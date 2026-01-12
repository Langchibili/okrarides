// src/utils/socketUtils.ts
// ============================================
// Socket Utility Functions
// ============================================

import socketService from '../services/socketService';

/**
 * Safely emit socket event with error handling
 */
export const safeEmit = (event: string, data: any, context: string = ''): boolean => {
  try {
    const success = socketService.emit(event, data);
    if (!success) {
      console.warn(`⚠️ Failed to emit '${event}' ${context}`);
    }
    return success;
  } catch (error) {
    console.error(`❌ Error emitting '${event}' ${context}:`, error);
    return false;
  }
};

/**
 * Emit ride status change event
 */
export const emitRideStatusChange = (ride: any, previousStatus: string | null = null): boolean => {
  const rideStatus = ride.rideStatus;
  
  switch (rideStatus) {
    case 'pending':
      return socketService.emitRideRequestCreated(ride);
      
    case 'accepted':
      // Handled by ride controller
      return true;
      
    case 'arrived':
      return socketService.emitDriverArrived(ride);
      
    case 'passenger_onboard':
      return socketService.emitTripStarted(ride);
      
    case 'completed':
      return socketService.emitTripCompleted(ride);
      
    case 'cancelled':
      return socketService.emitRideCancelled(
        ride,
        ride.cancelledBy,
        ride.cancellationReason,
        ride.cancellationFee || 0
      );
      
    default:
      console.log(`ℹ️ No socket event for ride status: ${rideStatus}`);
      return true;
  }
};

/**
 * Emit driver status change event
 */
export const emitDriverStatusChange = (
  driverId: string | number, 
  status: string, 
  reason: string | null = null, 
  message: string | null = null
): boolean => {
  if (status === 'offline' && reason) {
    return socketService.emitDriverForcedOffline(driverId, reason, message || '');
  }
  return true;
};

/**
 * Emit subscription status change event
 */
export const emitSubscriptionStatusChange = (subscription: any, previousStatus: string | null = null): boolean => {
  const driverId = subscription.driver?.id || subscription.driver;
  const subscriptionStatus = subscription.subscriptionStatus;

  switch (subscriptionStatus) {
    case 'active':
    case 'trial':
      return socketService.emitSubscriptionActivated(driverId, subscription);
      
    case 'expired':
      return socketService.emitSubscriptionExpired(
        driverId,
        subscription.expiresAt,
        'Your subscription has expired. Please renew to continue accepting rides.'
      );
      
    default:
      return true;
  }
};

/**
 * Check if subscription is expiring soon and send warning
 */
export const checkAndWarnSubscriptionExpiring = (subscription: any): boolean => {
  if (subscription.subscriptionStatus !== 'active' && subscription.subscriptionStatus !== 'trial') {
    return false;
  }

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Warn at 7, 3, and 1 day(s) before expiry
  if ([7, 3, 1].includes(daysRemaining)) {
    const driverId = subscription.driver?.id || subscription.driver;
    return socketService.emitSubscriptionExpiring(driverId, subscription);
  }

  return false;
};

/**
 * Emit payment event
 */
export const emitPaymentEvent = (transaction: any, success: boolean = true): boolean => {
  const userId = transaction.user?.id || transaction.user;
  const userType = transaction.userType || 'rider'; 
  const amount = transaction.amount;
  const transactionId = transaction.id || transaction.transactionId;

  if (success) {
    return socketService.emitPaymentSuccess(
      userId,
      userType,
      amount,
      transactionId,
      transaction.type || 'ride'
    );
  } else {
    return socketService.emitPaymentFailed(
      userId,
      userType,
      amount,
      transaction.failureReason || 'Payment failed',
      transactionId
    );
  }
};

/**
 * Emit withdrawal processed event
 */
export const emitWithdrawalEvent = (withdrawal: any): boolean => {
  const driverId = withdrawal.driver?.id || withdrawal.driver;
  return socketService.emitWithdrawalProcessed(
    driverId,
    withdrawal.amount,
    withdrawal.method,
    withdrawal.id || withdrawal.transactionId
  );
};

/**
 * Request ratings from users after ride completion
 */
export const requestRatings = (ride: any): void => {
  const riderId = ride.rider?.id || ride.rider;
  const driverId = ride.driver?.id || ride.driver;
  const rideId = ride.id;

  // Request rating from rider
  socketService.emitRatingRequestRider(riderId, rideId, driverId);

  // Request rating from driver
  socketService.emitRatingRequestDriver(driverId, rideId, riderId);
};

/**
 * Confirm rating submission
 */
export const emitRatingSubmitted = (userId, userType, rideId, rating) =>{
  return socketService.emit('rating:submitted', {
    userId,
    userType,
    rideId,
    rating,
  });
}

/**
 * Send notification via socket
 */
export const sendSocketNotification = (userId: string | number, userType: string, notification: any): boolean => {
  return socketService.emitNotification(userId, userType, notification);
};

/**
 * Broadcast system announcement
 */
export const broadcastAnnouncement = (targetAudience: string, message: string, priority: string = 'normal'): boolean => {
  return socketService.emitSystemAnnouncement(targetAudience, message, priority);
};
