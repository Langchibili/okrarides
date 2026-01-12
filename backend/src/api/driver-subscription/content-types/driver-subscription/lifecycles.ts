// src/api/driver-subscription/content-types/driver-subscription/lifecycles.ts

import socketService from '../../../../services/socketService';

/**
 * Helper to route subscription status changes to the correct socket events
 * Moved outside the export to prevent Strapi validation errors
 */
const handleSubscriptionSocketEvents = (subscription: any, previousStatus: string | null) => {
  const driverId = subscription.driver.id || subscription.driver;

  // 1. Handle Activation/Renewal
  if (subscription.subscriptionStatus === 'active' && previousStatus !== 'active') {
    socketService.emitSubscriptionActivated(driverId, subscription);
  }

  // 2. Handle Expiration
  if (subscription.subscriptionStatus === 'expired') {
    // Notify of expiration
    socketService.emitSubscriptionExpired(
      driverId, 
      subscription.expiresAt, 
      'Your subscription has expired'
    );

    // Force driver offline via socket
    socketService.emitDriverForcedOffline(
      driverId,
      'subscription_expired',
      'Your subscription has expired. Please renew to continue accepting rides.'
    );
  }
};

export default {
  /**
   * Triggered after a new subscription record is created
   */
  async afterCreate(event: any) {
    const { result } = event;

    const subscription: any = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
      where: { id: result.id },
      populate: ['driver', 'subscriptionPlan'],
    });

    if (!subscription || !subscription.driver) return;

    // Call the local helper function directly
    handleSubscriptionSocketEvents(subscription, null);
  },

  /**
   * Triggered after a subscription status or record is updated
   */
  async afterUpdate(event: any) {
    const { result, params } = event;

    const updateData = params?.data || {};
    const previousStatus = updateData.subscriptionStatus;

    const subscription: any = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
      where: { id: result.id },
      populate: ['driver', 'subscriptionPlan'],
    });

    if (!subscription || !subscription.driver) return;

    if (subscription.status !== previousStatus) {
      // Call the local helper function directly
      handleSubscriptionSocketEvents(subscription, previousStatus);
    }
  },
};