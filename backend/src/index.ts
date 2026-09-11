/**
 * Strapi Bootstrap + Cron Registration
 * PATH: src/index.ts
 *
 * ⚠️  ALL CRON TASKS ARE TEMPORARILY DISABLED ⚠️
 * Re-enable by uncommenting the jobsToRegister loop and startup calls below.
 *
 * Schedule overview (currently disabled):
 *   OkraPay collection poller          every 20 seconds
 *   Platform stats snapshot            every 10 minutes
 *   Subscription expiry checker        every 6 hours  + immediate on startup
 *   SMS: expired / no subscription     daily at 07:00 UTC (09:00 CAT)
 *   SMS: zero float / inactive driver  daily at 07:30 UTC (09:30 CAT)
 *   Frontend restart                   every hour on the hour
 */

import socketService from './services/socketService';
import { pollPendingCollections } from './services/collection-poller';
import { recalculatePlatformStats } from './services/platform-stats';
import { SendSmsNotification } from './services/messages';
import { handleUserCreation, handleUserUpdate } from "./pluginExtensionsFiles/userLifecycleMethods"

// =============================================================================
// SHARED HELPERS
// =============================================================================

/**
 * Returns true when the string could be an international phone number.
 * Strips spaces, dashes, parentheses and a leading + then checks that
 * only digits remain and the length is in the valid ITU range (7–15).
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
  const last = user.lastName?.trim();
  if (first && last) return `Dear ${first} ${last}`;
  if (first) return `Dear ${first}`;
  return 'Dear driver';
};

// =============================================================================
// CRON TASK 1 — Subscription Expiry Checker
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
          driver: { select: ['id'] },
          subscriptionPlan: true,
        },
      });

    for (const sub of overdue) {
      if (!sub.driver) continue;
      const driverId = sub.driver.id ?? sub.driver;

      strapi.log.info(`[expiry-cron] Expiring subscription ${sub.id} for driver ${driverId}`);

      await strapi.db.query('api::driver-subscription.driver-subscription').update({
        where: { id: sub.id },
        data: { subscriptionStatus: 'expired' },
      });

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: driverId },
        select: ['id'],
        populate: { driverProfile: { select: ['id'] } },
      });

      if (user?.driverProfile?.id) {
        await strapi.db.query('driver-profiles.driver-profile').update({
          where: { id: user.driverProfile.id },
          data: {
            subscriptionStatus: 'expired',
            isOnline: false,
            isAvailable: false,
            isActive: false,
          },
        });
      }

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
          driver: { select: ['id'] },
          subscriptionPlan: true,
        },
      });

    for (const sub of expiringSoon) {
      if (!sub.driver) continue;
      const driverId = sub.driver.id ?? sub.driver;
      const daysRemaining = Math.ceil(
        (new Date(sub.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

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

    const notifiedIds = new Set<number>();

    const expiredSubs = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .findMany({
        where: { subscriptionStatus: 'expired' },
        select: ['id'],
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

    const allSubRecords = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .findMany({
        select: ['id'],
        populate: { driver: { select: ['id'] } },
      });

    const driversWithAnySub = new Set<number>(
      allSubRecords.map((s: any) => s.driver?.id).filter(Boolean)
    );

    const allDriverUsers = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: {
          driverProfile: { isActive: { $notNull: true } },
        },
        select: ['id', 'firstName', 'lastName', 'username', 'phoneNumber'],
        populate: { driverProfile: { select: ['id'] } },
      });

    for (const user of allDriverUsers) {
      if (!user.driverProfile) continue;
      if (driversWithAnySub.has(user.id)) continue;
      if (notifiedIds.has(user.id)) continue;

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

    const activeDrivers = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: {
          driverProfile: { isActive: true },
        },
        select: ['id', 'firstName', 'lastName', 'username', 'phoneNumber'],
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

      const totalRides = Number(profile.totalRides) || 0;
      const floatBalance = parseFloat(profile.floatBalance) || 0;
      const greet = greeting(user);

      if (totalRides < 1 && floatBalance <= 0) {
        const msg =
          `${greet}, we have noticed that you have no float in your Okrarides account, ` +
          `to receive orders from our many customers, try and buy from the app.`;

        SendSmsNotification(phone, msg);
        strapi.log.info(`[sms-zero-float] Sent no-float SMS to new driver ${user.id}`);
        continue;
      }

      if (totalRides >= 1) {
        const lastCompletedRide = await strapi.db.query('api::ride.ride').findOne({
          where: {
            driver: user.id,
            rideStatus: 'completed',
          },
          select: ['id', 'tripCompletedAt'],
          orderBy: { tripCompletedAt: 'desc' },
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
// STRAPI BOOTSTRAP
// =============================================================================
export default {
  register({ strapi }: { strapi: any }) { },

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

    // ── CRON TASKS — DISABLED ─────────────────────────────────────────────────
    // All jobs are commented out while investigating the high-CPU issue.
    // To re-enable, uncomment the jobsToRegister array, the registration loop,
    // and the two startup calls at the bottom.
    //
    // const jobsToRegister = [
    //   {
    //     name: 'pollCollections',
    //     rule: '*/20 * * * * *',
    //     task: async () => { await pollPendingCollections(); }
    //   },
    //   {
    //     name: 'platformStats',
    //     rule: '*/10 * * * *',
    //     task: async () => { await recalculatePlatformStats(); }
    //   },
    //   {
    //     name: 'expiryChecker',
    //     rule: '0 */6 * * *',
    //     task: async () => { await runSubscriptionExpiryCheck(strapi); }
    //   },
    //   {
    //     name: 'smsExpired',
    //     rule: '0 7 * * *', // 09:00 AM CAT
    //     task: async () => { await sendMessagesToUsersWithExpiredSubscriptions(strapi); }
    //   },
    //   {
    //     name: 'smsZeroFloat',
    //     rule: '30 7 * * *', // 09:30 AM CAT
    //     task: async () => { await sendMessagesToUsersWithZeroFloat(strapi); }
    //   },
    //   {
    //     name: 'restartFrontend',
    //     rule: '0 * * * *', // every hour on the hour
    //     task: async () => {
    //       const { exec } = await import('child_process');
    //       exec('pm2 restart frontendapp', (error, stdout, stderr) => {
    //         if (error) {
    //           strapi.log.error(`[restart-frontend] Failed: ${error.message}`);
    //           return;
    //         }
    //         strapi.log.info(`[restart-frontend] ${stdout.trim()}`);
    //         if (stderr) strapi.log.warn(`[restart-frontend] stderr: ${stderr.trim()}`);
    //       });
    //     }
    //   },
    // ];
    //
    // for (const job of jobsToRegister) {
    //   strapi.cron.remove(job.name);
    //   strapi.cron.add({
    //     [job.name]: {
    //       task: job.task,
    //       options: { rule: job.rule, tz: 'UTC' }
    //     }
    //   });
    // }
    //
    // runSubscriptionExpiryCheck(strapi).then(() => {
    //   console.log('[bootstrap] Initial subscription expiry check complete');
    // });
    // sendMessagesToUsersWithZeroFloat(strapi).then(() => {
    //   console.log('[bootstrap] Initial low float drivers check complete');
    // });

    console.log('[bootstrap] Cron tasks are currently DISABLED ⚠️');
    console.log('[bootstrap] Bootstrap complete ✅');
  },
};