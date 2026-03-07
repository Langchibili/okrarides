// // src/api/driver-subscription/content-types/driver-subscription/lifecycles.ts

// import socketService from '../../../../services/socketService';

// /**
//  * Helper to route subscription status changes to the correct socket events
//  * Moved outside the export to prevent Strapi validation errors
//  */
// const handleSubscriptionSocketEvents = (subscription: any, previousStatus: string | null) => {
//   const driverId = subscription.driver.id || subscription.driver;

//   // 1. Handle Activation/Renewal
//   if (subscription.subscriptionStatus === 'active' && previousStatus !== 'active') {
//     socketService.emitSubscriptionActivated(driverId, subscription);
//   }

//   // 2. Handle Expiration
//   if (subscription.subscriptionStatus === 'expired') {
//     // Notify of expiration
//     socketService.emitSubscriptionExpired(
//       driverId, 
//       subscription.expiresAt, 
//       'Your subscription has expired'
//     );

//     // Force driver offline via socket
//     socketService.emitDriverForcedOffline(
//       driverId,
//       'subscription_expired',
//       'Your subscription has expired. Please renew to continue accepting rides.'
//     );
//   }
// };

// export default {
//   /**
//    * Triggered after a new subscription record is created
//    */
//   async afterCreate(event: any) {
//     const { result } = event;

//     const subscription: any = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//       where: { id: result.id },
//       populate: ['driver', 'subscriptionPlan'],
//     });

//     if (!subscription || !subscription.driver) return;

//     // Call the local helper function directly
//     handleSubscriptionSocketEvents(subscription, null);
//   },

//   /**
//    * Triggered after a subscription status or record is updated
//    */
//   async afterUpdate(event: any) {
//     const { result, params } = event;

//     const updateData = params?.data || {};
//     const previousStatus = updateData.subscriptionStatus;

//     const subscription: any = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
//       where: { id: result.id },
//       populate: ['driver', 'subscriptionPlan'],
//     });

//     if (!subscription || !subscription.driver) return;

//     if (subscription.status !== previousStatus) {
//       // Call the local helper function directly
//       handleSubscriptionSocketEvents(subscription, previousStatus);
//     }
//   },
// };
// src/api/driver-subscription/content-types/driver-subscription/lifecycles.ts

import socketService from '../../../../services/socketService';

/**
 * Sync the driver profile's denormalized subscriptionStatus field so that
 * eligibility checks (which read from the profile component) stay in sync
 * with the actual subscription record.
 */
const syncDriverProfileStatus = async (driverId: number | string, subscriptionStatus: string) => {
  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: driverId },
      populate: {
        driverProfile: { select: ['id'] }
      }
    });

    if (!user?.driverProfile?.id) return;

    await strapi.db.query('driver-profiles.driver-profile').update({
      where: { id: user.driverProfile.id },
      data: { subscriptionStatus }
    });

    strapi.log.info(`[lifecycle] Synced driver ${driverId} profile subscriptionStatus → '${subscriptionStatus}'`);
  } catch (error) {
    strapi.log.error(`[lifecycle] Failed to sync driver ${driverId} profile status:`, error);
  }
};

/**
 * Route subscription status changes to the correct socket events and DB updates.
 */
const handleSubscriptionStatusChange = async (
  subscription: any,
  previousStatus: string | null
) => {
  const driverId = subscription.driver?.id ?? subscription.driver;
  const currentStatus = subscription.subscriptionStatus;  // ← correct field name

  if (!driverId) return;

  strapi.log.info(
    `[lifecycle] Subscription ${subscription.id} status: '${previousStatus}' → '${currentStatus}'`
  );

  switch (currentStatus) {
    case 'active':
      if (previousStatus !== 'active') {
        // Sync profile
        await syncDriverProfileStatus(driverId, 'active');
        // Notify driver
        socketService.emitSubscriptionActivated(driverId, subscription);
      }
      break;

    case 'trial':
      if (previousStatus !== 'trial') {
        await syncDriverProfileStatus(driverId, 'trial');
        socketService.emitSubscriptionActivated(driverId, subscription);
      }
      break;

    case 'expired':
      // Sync profile to expired — driver can no longer use subscription perks
      await syncDriverProfileStatus(driverId, 'expired');

      // Notify via socket
      socketService.emitSubscriptionExpired(
        driverId,
        subscription.expiresAt,
        'Your subscription has expired. Please renew to continue accepting rides.'
      );

      // Force driver offline if they are currently online and on subscription system
      try {
        const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
        if (
          settings?.paymentSystemType === 'subscription_based' ||
          settings?.paymentSystemType === 'hybrid'
        ) {
          socketService.emitDriverForcedOffline(
            driverId,
            'subscription_expired',
            'Your subscription has expired. Please renew to continue accepting rides.'
          );

          // Also update the DB so the driver is flagged offline
          const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: driverId },
            populate: {
              driverProfile: { select: ['id'] }
            }
          });
          if (user?.driverProfile?.id) {
            await strapi.db.query('driver-profiles.driver-profile').update({
              where: { id: user.driverProfile.id },
              data: {
                isOnline: false,
                isAvailable: false,
                isActive: false,
              }
            });
          }
        }
      } catch (err) {
        strapi.log.error('[lifecycle] Error forcing driver offline on expiry:', err);
      }
      break;

    case 'cancelled':
      // Don't immediately revoke access — access continues until expiresAt.
      // The cron job will set it to 'expired' when the time comes.
      await syncDriverProfileStatus(driverId, 'cancelled');
      break;

    case 'suspended':
      await syncDriverProfileStatus(driverId, 'suspended');
      socketService.emitDriverForcedOffline(
        driverId,
        'subscription_suspended',
        'Your subscription has been suspended. Please contact support.'
      );
      break;

    default:
      break;
  }
};

export default {
  /**
   * Triggered after a new subscription record is created.
   */
  async afterCreate(event: any) {
    const { result } = event;

    const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
      where: { id: result.id },
      populate: ['driver', 'subscriptionPlan'],
    });

    if (!subscription?.driver) return;

    await handleSubscriptionStatusChange(subscription, null);
  },

  /**
   * Triggered after a subscription is updated.
   */
  async afterUpdate(event: any) {
    const { result, params } = event;

    // params.data is what was written — use it to know the PREVIOUS status
    // (actually params.data is the NEW data being set; we can't know previous
    // status from params alone, so we trust the result record and emit events
    // unconditionally when status-related fields change)
    const incomingData = params?.data || {};

    // Only act if subscriptionStatus was part of this update
    if (!('subscriptionStatus' in incomingData)) return;

    const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
      where: { id: result.id },
      populate: ['driver', 'subscriptionPlan'],
    });

    if (!subscription?.driver) return;

    // The previous status cannot be reliably known here — we pass null and let
    // handleSubscriptionStatusChange guard with !== checks internally.
    await handleSubscriptionStatusChange(subscription, null);
  },
};