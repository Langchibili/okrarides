// // backend/src/index.js
// // import type { Core } from '@strapi/strapi';
// // import { handleUserCreation, handleUserUpdate } from "./pluginExtensionsFiles/userLifecycleMethods"
// import { handleUserCreation } from "./pluginExtensionsFiles/userLifecycleMethods"
// // Import socket service
// import socketService from './services/socketService'

// export default {
//   register(/* { strapi } */) {
//     // Import socket service
//     // socketService.connect();
//   },

//   bootstrap({ strapi }) {
//     // Connect socket service
//     socketService.connect();
//     console.log('✅ Socket Service initialized');

//     // ❌ REMOVED ALL EVENTHUB LISTENERS - Not needed anymore
//     // Controllers now call socketService.emit() directly

//     // Setup subscription expiry checker
//     setupSubscriptionExpiryChecker(strapi);
    
//     // Setup user lifecycle hooks (keep this)
//     strapi.db.lifecycles.subscribe({
//       models: ['plugin::users-permissions.user'],
//       async afterCreate(event: any) {
//         const { result: user } = event;
//         if (!user?.id) return;
//         try {
//           await handleUserCreation(strapi, user);
//         } catch (error) {
//           console.error('Error in afterCreate:', error);
//         }
//       }
//     });
//   },
// };

// /**
//  * Setup cron job to check for expiring subscriptions
//  */
// function setupSubscriptionExpiryChecker(strapi) {
//   const { checkAndWarnSubscriptionExpiring } = require('./utils/socketUtils');

//   // Run every hour
//   setInterval(async () => {
//     try {
//       const subscriptions = await strapi.db.query('api::driver-subscription.driver-subscription').findMany({
//         where: {
//           status: {
//             $in: ['active', 'trial'],
//           },
//         },
//         populate: ['driver', 'subscriptionPlan'],
//       });

//       for (const subscription of subscriptions) {
//         checkAndWarnSubscriptionExpiring(subscription);
//       }
//     } catch (error) {
//       console.error('❌ Error checking subscription expiry:', error);
//     }
//   }, 60 * 60 * 1000); // 1 hour

//   console.log('✅ Subscription expiry checker initialized');
// }



// backend/src/index.ts

import { handleUserCreation } from "./pluginExtensionsFiles/userLifecycleMethods"
import socketService from './services/socketService'

export default {
  register(/* { strapi } */) {},

  bootstrap({ strapi }) {
    // Connect socket service
    socketService.connect();
    console.log('✅ Socket Service initialized');

    // Setup subscription expiry + warning checker
    setupSubscriptionExpiryChecker(strapi);

    // Setup user lifecycle hooks
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
      }
    });
  },
};

// ─── Subscription expiry checker ────────────────────────────────────────────

/**
 * Runs every hour.
 *
 * For every active/trial subscription:
 *   - If expired → mark as expired in DB, sync driver profile, force offline
 *   - If expiring in 7, 3, or 1 days → emit warning socket event
 */
function setupSubscriptionExpiryChecker(strapi) {
  const runCheck = async () => {
    try {
      const now = new Date();

      // ── 1. Find subscriptions that have PASSED their expiresAt ──────────────
      const expired = await strapi.db.query('api::driver-subscription.driver-subscription').findMany({
        where: {
          subscriptionStatus: { $in: ['active', 'trial', 'cancelled'] }, // cancelled runs until expiry
          expiresAt: { $lte: now },
        },
        populate: ['driver', 'subscriptionPlan'],
      });

      for (const sub of expired) {
        if (!sub.driver) continue;

        strapi.log.info(`[expiry-cron] Expiring subscription ${sub.id} for driver ${sub.driver.id}`);

        // Mark subscription as expired
        await strapi.db.query('api::driver-subscription.driver-subscription').update({
          where: { id: sub.id },
          data: { subscriptionStatus: 'expired' },
        });

        // Sync driver profile subscriptionStatus
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: sub.driver.id ?? sub.driver },
          populate: { driverProfile: { select: ['id', 'isOnline'] } },
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

        // Notify driver via socket
        const driverId = sub.driver.id ?? sub.driver;
        socketService.emitSubscriptionExpired(
          driverId,
          sub.expiresAt,
          'Your subscription has expired. Please renew to continue accepting rides.'
        );

        // Force driver offline via socket
        socketService.emitDriverForcedOffline(
          driverId,
          'subscription_expired',
          'Your subscription has expired. Please renew to continue accepting rides.'
        );
      }

      if (expired.length > 0) {
        strapi.log.info(`[expiry-cron] Expired ${expired.length} subscription(s)`);
      }

      // ── 2. Find subscriptions expiring in the next 7 days ───────────────────
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const expiringSoon = await strapi.db.query('api::driver-subscription.driver-subscription').findMany({
        where: {
          subscriptionStatus: { $in: ['active', 'trial'] },
          expiresAt: {
            $gte: now,
            $lte: sevenDaysFromNow,
          },
        },
        populate: ['driver', 'subscriptionPlan'],
      });

      for (const sub of expiringSoon) {
        if (!sub.driver) continue;

        const expiresAt = new Date(sub.expiresAt);
        const daysRemaining = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only emit on specific milestone days to avoid spamming every hour
        if ([7, 3, 1].includes(daysRemaining)) {
          const driverId = sub.driver.id ?? sub.driver;
          socketService.emitSubscriptionExpiring(driverId, {
            ...sub,
            daysRemaining,
          });
          strapi.log.info(
            `[expiry-cron] Warned driver ${driverId} — subscription expiring in ${daysRemaining} day(s)`
          );
        }
      }
    } catch (error) {
      strapi.log.error('[expiry-cron] Error in subscription expiry check:', error);
    }
  };

  // Run immediately on bootstrap so stale subs are caught at startup
  runCheck();

  // Then run every hour
  //setInterval(runCheck, 60 * 60 * 1000);
  // Runs runCheck every 6 hours (21,600,000 milliseconds)
  setInterval(runCheck, 6 * 60 * 60 * 1000);
  console.log('✅ Subscription expiry checker initialized');
}