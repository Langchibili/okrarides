/**
 * Strapi Bootstrap + Cron Registration
 * PATH: src/index.ts
 *
 * All cron tasks are registered here via strapi.cron.add() so they are
 * guaranteed to fire (no dependency on cron-tasks.ts config file).
 *
 * Schedule overview:
 *   OkraPay collection poller          every 20 seconds
 *   Platform stats snapshot            every 15 minutes
 *   Subscription expiry checker        every 6 hours  + immediate on startup
 *   SMS: expired / no subscription     daily at 09:00 UTC
 *   SMS: zero float / inactive driver  daily at 09:30 UTC
 */

import socketService from './services/socketService';
import { pollPendingCollections }   from './services/collection-poller';
import { recalculatePlatformStats } from './services/platform-stats';
import { SendSmsNotification }      from './services/messages';
import { handleUserCreation, handleUserUpdate } from "./pluginExtensionsFiles/userLifecycleMethods"

// =============================================================================
// SHARED HELPERS
// =============================================================================

/**
 * Returns true when the string could be an international phone number.
 * Strips spaces, dashes, parentheses and a leading + then checks that
 * only digits remain and the length is in the valid ITU range (7–15).
 * Examples that pass : "260971234567", "+260971234567", "0971234567"
 * Examples that fail : "john_doe", "user123", "abc"
 */
const isPhoneNumber = (str: string): boolean => {
  if (!str) return false;
  const digits = str.replace(/[\s\-().+]/g, '');
  return /^\d{7,15}$/.test(digits);
};

/** Use username when it looks like a phone number, otherwise fall back to phoneNumber */
const resolvePhone = (user: any): string | null =>
  isPhoneNumber(user.username) ? user.username : (user.phoneNumber || null);

/** "Dear John Doe," — falls back to "Dear driver," when names are absent */
const greeting = (user: any): string => {
  const first = user.firstName?.trim();
  const last  = user.lastName?.trim();
  if (first && last) return `Dear ${first} ${last}`;
  if (first)         return `Dear ${first}`;
  return 'Dear driver';
};

// =============================================================================
// CRON TASK 1 — Subscription Expiry Checker
// Runs every 6 hours + immediately on bootstrap.
// • Marks overdue active/trial/cancelled subscriptions as 'expired'
// • Syncs driver profile (isActive, isOnline, isAvailable → false)
// • Emits socket events so the driver app reacts in real-time
// • Warns drivers whose subscription expires within the next 7 days
//   (only on milestone days: 7, 3, 1)
// =============================================================================
async function runSubscriptionExpiryCheck(strapi: any): Promise<void> {
  try {
    const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});

    if (settings?.paymentSystemType !== 'subscription_based') {
      strapi.log.info('[sms-overdue-sub] Skipped — paymentSystemType is not subscription_based');
      return;
    }
    const now = new Date();

    // ── 1a. Mark overdue subscriptions as expired ───────────────────────────
    const overdue = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .findMany({
        where: {
          subscriptionStatus: { $in: ['active', 'trial', 'cancelled'] },
          expiresAt: { $lte: now },
        },
        populate: {
          driver:          { select: ['id'] },
          subscriptionPlan: true,
        },
      });

    for (const sub of overdue) {
      if (!sub.driver) continue;
      const driverId = sub.driver.id ?? sub.driver;

      strapi.log.info(`[expiry-cron] Expiring subscription ${sub.id} for driver ${driverId}`);

      await strapi.db.query('api::driver-subscription.driver-subscription').update({
        where: { id: sub.id },
        data:  { subscriptionStatus: 'expired' },
      });

      // Sync the driver profile component
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where:    { id: driverId },
        select:   ['id'],
        populate: { driverProfile: { select: ['id'] } },
      });

      if (user?.driverProfile?.id) {
        await strapi.db.query('driver-profiles.driver-profile').update({
          where: { id: user.driverProfile.id },
          data: {
            subscriptionStatus: 'expired',
            isOnline:    false,
            isAvailable: false,
            isActive:    false,
          },
        });
      }

      // Force the driver app offline via socket
      socketService.emitSubscriptionExpired(
        driverId,
        sub.expiresAt,
        'Your Okrarides subscription has expired. Please renew to continue accepting rides.'
      );
      socketService.emitDriverForcedOffline(
        driverId,
        'subscription_expired',
        'Your Okrarides subscription has expired. Please renew to continue accepting rides.'
      );
    }

    if (overdue.length > 0) {
      strapi.log.info(`[expiry-cron] Expired ${overdue.length} subscription(s)`);
    }

    // ── 1b. Warn drivers whose subscription expires within 7 days ───────────
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringSoon = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .findMany({
        where: {
          subscriptionStatus: { $in: ['active', 'trial'] },
          expiresAt: { $gte: now, $lte: sevenDaysFromNow },
        },
        populate: {
          driver:           { select: ['id'] },
          subscriptionPlan: true,
        },
      });

    for (const sub of expiringSoon) {
      if (!sub.driver) continue;
      const driverId = sub.driver.id ?? sub.driver;
      const daysRemaining = Math.ceil(
        (new Date(sub.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only emit on milestone days to avoid spamming on every 6-hour cycle
      if ([7, 3, 1].includes(daysRemaining)) {
        socketService.emitSubscriptionExpiring(driverId, { ...sub, daysRemaining });
        strapi.log.info(
          `[expiry-cron] Warned driver ${driverId} — subscription expiring in ${daysRemaining} day(s)`
        );
      }
    }
  } catch (error) {
    strapi.log.error('[expiry-cron] Error in subscription expiry check:', error);
  }
}

// =============================================================================
// CRON TASK 2 — sendMessagesToUsersWithExpiredSubscriptions
// Runs daily at 09:00 UTC.
// Guard: only executes when paymentSystemType === 'subscription_based'.
// Targets:
//   A) Drivers whose most-recent subscription is in 'expired' status
//   B) Drivers who have a driverProfile but ZERO subscription records at all
// =============================================================================
async function sendMessagesToUsersWithExpiredSubscriptions(strapi: any): Promise<void> {
  try {
    const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});

    if (settings?.paymentSystemType !== 'subscription_based') {
      strapi.log.info('[sms-expired-sub] Skipped — paymentSystemType is not subscription_based');
      return;
    }

    strapi.log.info('[sms-expired-sub] Running…');

    const buildMessage = (user: any) =>
      `${greeting(user)}, your Okrarides subscription has expired, to continue receiving ` +
      `ride orders from our many customers and earning with Okra, please subscribe using the app`;

    // Track who has already been messaged to avoid duplicates
    const notifiedIds = new Set<number>();

    // ── A. Drivers with at least one 'expired' subscription ─────────────────
    const expiredSubs = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .findMany({
        where:    { subscriptionStatus: 'expired' },
        select:   ['id'],
        populate: {
          driver: { select: ['id', 'firstName', 'lastName', 'username', 'phoneNumber'] },
        },
      });

    for (const sub of expiredSubs) {
      const user = sub.driver;
      if (!user) continue;
      if (notifiedIds.has(user.id)) continue;

      const phone = resolvePhone(user);
      if (!phone) {
        strapi.log.warn(`[sms-expired-sub] No phone for driver ${user.id} — skipping`);
        continue;
      }

      SendSmsNotification(phone, buildMessage(user));
      notifiedIds.add(user.id);
      strapi.log.info(`[sms-expired-sub] Sent expired-sub SMS to driver ${user.id}`);
    }

    // ── B. Drivers with NO subscription record at all ────────────────────────
    // Collect every driver user ID that has any subscription record
    const allSubRecords = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .findMany({
        select:   ['id'],
        populate: { driver: { select: ['id'] } },
      });

    const driversWithAnySub = new Set<number>(
      allSubRecords.map((s: any) => s.driver?.id).filter(Boolean)
    );

    // All users who have a driver profile
    const allDriverUsers = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: {
          driverProfile: { isActive: { $notNull: true } }, // component exists
        },
        select:   ['id', 'firstName', 'lastName', 'username', 'phoneNumber'],
        populate: { driverProfile: { select: ['id'] } },
      });

    for (const user of allDriverUsers) {
      if (!user.driverProfile) continue;               // no driver profile component
      if (driversWithAnySub.has(user.id)) continue;    // already has a sub record
      if (notifiedIds.has(user.id)) continue;           // already messaged above

      const phone = resolvePhone(user);
      if (!phone) {
        strapi.log.warn(`[sms-expired-sub] No phone for driver ${user.id} — skipping`);
        continue;
      }

      SendSmsNotification(phone, buildMessage(user));
      notifiedIds.add(user.id);
      strapi.log.info(`[sms-expired-sub] Sent no-sub SMS to driver ${user.id}`);
    }

    strapi.log.info(`[sms-expired-sub] Done — ${notifiedIds.size} driver(s) notified.`);
  } catch (error) {
    strapi.log.error('[sms-expired-sub] Failed:', error);
  }
}

// =============================================================================
// CRON TASK 3 — sendMessagesToUsersWithZeroFloat
// Runs daily at 09:30 UTC.
// Guard: only executes when paymentSystemType === 'float_based'.
//
// Two sub-cases for active drivers:
//   A) totalRides < 1  AND  floatBalance <= 0
//      → "you have no float in your account, try to buy from the app"
//   B) totalRides >= 1 AND last completed ride was > 2 days ago (any float)
//      → "you haven't had orders for a while, we hope you are okay"
// =============================================================================
async function sendMessagesToUsersWithZeroFloat(strapi: any): Promise<void> {
  try {
    const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});

    if (settings?.paymentSystemType !== 'float_based') {
      strapi.log.info('[sms-zero-float] Skipped — paymentSystemType is not float_based');
      return;
    }

    strapi.log.info('[sms-zero-float] Running…');

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // All active drivers
    const activeDrivers = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: {
          driverProfile: { isActive: true },
        },
        select:   ['id', 'firstName', 'lastName', 'username', 'phoneNumber'],
        populate: {
          driverProfile: { select: ['id', 'floatBalance', 'totalRides'] },
        },
      });

    for (const user of activeDrivers) {
      const profile = user.driverProfile;
      if (!profile) continue;

      const phone = resolvePhone(user);
      if (!phone) {
        strapi.log.warn(`[sms-zero-float] No phone for driver ${user.id} — skipping`);
        continue;
      }

      const totalRides   = Number(profile.totalRides)   || 0;
      const floatBalance = parseFloat(profile.floatBalance) || 0;
      const greet        = greeting(user);

      // ── Case A: never completed a ride AND has no float ──────────────────
      if (totalRides < 1 && floatBalance <= 0) {
        const msg =
          `${greet}, we have noticed that you have no float in your Okrarides account, ` +
          `to receive orders from our many customers, try and buy from the app.`;

        SendSmsNotification(phone, msg);
        strapi.log.info(`[sms-zero-float] Sent no-float SMS to new driver ${user.id}`);
        continue; // move to next driver — case B does not apply
      }

      // ── Case B: has completed rides but last one was > 2 days ago ────────
      if (totalRides >= 1) {
        const lastCompletedRide = await strapi.db.query('api::ride.ride').findOne({
          where: {
            driver:     user.id,
            rideStatus: 'completed',
          },
          select:   ['id', 'tripCompletedAt'],
          orderBy:  { tripCompletedAt: 'desc' },
        });

        if (
          lastCompletedRide?.tripCompletedAt &&
          new Date(lastCompletedRide.tripCompletedAt) < twoDaysAgo
        ) {
          const msg =
            `${greet}, we have noticed that you haven't had orders with Okrarides for a while now, ` +
            `we hope you are okay.`;

          SendSmsNotification(phone, msg);
          strapi.log.info(`[sms-zero-float] Sent inactive SMS to driver ${user.id}`);
        }
      }
    }

    strapi.log.info('[sms-zero-float] Done.');
  } catch (error) {
    strapi.log.error('[sms-zero-float] Failed:', error);
  }
}

// =============================================================================
// STRAPI BOOTSTRAP — register all cron tasks
// =============================================================================
export default {
  register({ strapi }: { strapi: any }) {},

  bootstrap({ strapi }: { strapi: any }) {
    // Connect socket service
    socketService.connect();
    console.log('✅ Socket Service initialized');

    // ── User lifecycle hooks ──────────────────────────────────────────────────
    strapi.db.lifecycles.subscribe({
      models: ['plugin::users-permissions.user'],

      async afterCreate(event: any) {
        const { result: user } = event;
        if (!user?.id) return;
        try {
          await handleUserCreation(strapi, user);
        } catch (error) {
          console.error('Error in afterCreate:', error);
        }
      },

      async afterUpdate(event: any) {
        const { result: user, params } = event;
        if (!user?.id) return;
        try {
          await handleUserUpdate(strapi, user, params);
        } catch (error) {
          console.error('Error in afterUpdate:', error);
        }
      },
    });

   
    // Define your jobs in an array for easy management
    const jobsToRegister = [
      {
        name: 'pollCollections',
        rule: '*/20 * * * * *',
        task: async () => { await pollPendingCollections(); }
      },
      {
        name: 'platformStats',
        rule: '*/10 * * * *',
        task: async () => { await recalculatePlatformStats(); }
      },
      {
        name: 'expiryChecker',
        rule: '0 */6 * * *',
        task: async () => { await runSubscriptionExpiryCheck(strapi); }
      },
      {
        name: 'smsExpired',
        rule: '0 7 * * *', // 09:30 AM CAT
        task: async () => { await sendMessagesToUsersWithExpiredSubscriptions(strapi); }
      },
      {
        name: 'smsZeroFloat',
        rule: '30 7 * * *', // 09:30 AM CAT
        task: async () => { await sendMessagesToUsersWithZeroFloat(strapi); }
      }
    ];

    // Loop through and register safely
    for (const job of jobsToRegister) {
      // 1. Remove existing job with this name to prevent duplicates on restart
      strapi.cron.remove(job.name);

      // 2. Add the job fresh
      strapi.cron.add({
        [job.name]: {
          task: job.task,
          options: {
            rule: job.rule,
            tz: 'UTC'
          }
        }
      });
    }

    // Run the expiry check immediately on startup so stale subs are resolved
    // before the first scheduled 6-hour tick.
    
    runSubscriptionExpiryCheck(strapi).then(() => {
      console.log('[bootstrap] Initial subscription expiry check complete');
    })
    sendMessagesToUsersWithZeroFloat(strapi).then(() => {
      console.log('[bootstrap] Initial low float drivers check complete');
    });

    console.log('[bootstrap] All cron tasks registered ✅');
  },
};
