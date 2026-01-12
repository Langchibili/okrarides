// src/services/socketService.ts
// ============================================
// Socket Service - Centralized Socket Event Emitter
// ============================================

import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private readonly SOCKET_SERVER_URL: string = process.env.SOCKET_SERVER_URL || 'http://localhost:3005';
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;

  /**
   * Initialize socket connection to the Socket.IO server
   */
  public connect(): void {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    console.log(`🔌 Connecting to Socket Server: ${this.SOCKET_SERVER_URL}`);

    this.socket = io(this.SOCKET_SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'],
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Strapi connected to Socket Server');
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Strapi disconnected from Socket Server:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
    });
  }

  /**
   * Disconnect from socket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('🔌 Disconnected from Socket Server');
    }
  }

  /**
   * Emit event to socket server
   */
  public emit(event: string, data: any): boolean {
    if (!this.socket || !this.connected) {
      console.warn(`⚠️ Cannot emit '${event}': Socket not connected`);
      return false;
    }

    try {
      this.socket.emit(event, data);
      console.log(`📤 Emitted '${event}':`, JSON.stringify(data).substring(0, 100));
      return true;
    } catch (error) {
      console.error(`❌ Error emitting '${event}':`, error);
      return false;
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.connected && (this.socket?.connected ?? false);
  }

  // ============================================
  // RIDE EVENTS
  // ============================================

  /**
   * Notify that a new ride request has been created
   */
  public emitRideRequestCreated(ride: any): boolean {
    return this.emit('ride:request:created', {
      rideId: ride.id,
      riderId: ride.rider?.id || ride.rider,
      pickupLocation: ride.pickupLocation,
      dropoffLocation: ride.dropoffLocation,
      rideType: ride.taxiType || ride.rideType,
      estimatedFare: ride.totalFare,
      searchRadius: 10, // km
    });
  }

  /**
   * Notify drivers about ride request
   */
  public emitRideRequestSent(rideId: string | number, driverIds: (string | number)[], requestData: any): boolean {
    return this.emit('ride:request:sent', {
      rideId,
      driverIds,
      requestData,
    });
  }

  /**
   * Notify that driver arrived at pickup
   */
  public emitDriverArrived(ride: any): boolean {
    return this.emit('ride:driver:arrived', {
      rideId: ride.id,
      driverId: ride.driver?.id || ride.driver,
      arrivedAt: ride.arrivedAt || new Date().toISOString(),
    });
  }

  /**
   * Notify that trip has started
   */
  public emitTripStarted(ride: any): boolean {
    return this.emit('ride:trip:started', {
      rideId: ride.id,
      driverId: ride.driver?.id || ride.driver,
      tripStartedAt: ride.tripStartedAt || new Date().toISOString(),
    });
  }

  /**
   * Notify that trip has been completed
   */
  public emitTripCompleted(ride: any): boolean {
    return this.emit('ride:trip:completed', {
      rideId: ride.id,
      driverId: ride.driver?.id || ride.driver,
      finalFare: ride.totalFare,
      distance: ride.actualDistance || ride.estimatedDistance,
      duration: ride.actualDuration || ride.estimatedDuration,
      tripCompletedAt: ride.tripCompletedAt || new Date().toISOString(),
    });
  }

  /**
   * Notify that ride has been cancelled
   */
  public emitRideCancelled(ride: any, cancelledBy: string, reason: string, cancellationFee: number = 0): boolean {
    return this.emit('ride:cancelled', {
      rideId: ride.id,
      cancelledBy,
      reason,
      cancellationFee,
    });
  }

  // ============================================
  // DRIVER EVENTS
  // ============================================

  /**
   * Force driver offline (subscription expired, etc.)
   */
  public emitDriverForcedOffline(driverId: string | number, reason: string, message: string): boolean {
    return this.emit('driver:forced:offline', {
      driverId,
      reason,
      message,
    });
  }

  // ============================================
  // SUBSCRIPTION EVENTS
  // ============================================

  /**
   * Warn driver that subscription is expiring soon
   */
  public emitSubscriptionExpiring(driverId: string | number, subscription: any): boolean {
    const daysRemaining = Math.ceil(
      (new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return this.emit('subscription:expiring:warning', {
      driverId,
      daysRemaining,
      expiresAt: subscription.expiresAt,
      planName: subscription.subscriptionPlan?.name || 'Subscription',
    });
  }

  /**
   * Notify driver that subscription has expired
   */
  public emitSubscriptionExpired(driverId: string | number, expiredAt: string, message: string = 'Your subscription has expired'): boolean {
    return this.emit('subscription:expired', {
      driverId,
      expiredAt,
      message,
    });
  }

  /**
   * Notify driver that subscription has been activated/renewed
   */
  public emitSubscriptionActivated(driverId: string | number, subscription: any): boolean {
    return this.emit('subscription:activated', {
      driverId,
      planName: subscription.subscriptionPlan?.name || 'Subscription',
      expiresAt: subscription.expiresAt,
    });
  }

  // ============================================
  // PAYMENT EVENTS
  // ============================================

  /**
   * Notify user of successful payment
   */
  public emitPaymentSuccess(userId: string | number, userType: string, amount: number, transactionId: string | number, type: string = 'ride'): boolean {
    return this.emit('payment:success', {
      userId,
      userType,
      amount,
      transactionId,
      type,
    });
  }

  /**
   * Notify user of failed payment
   */
  public emitPaymentFailed(userId: string | number, userType: string, amount: number, reason: string, transactionId: string | number): boolean {
    return this.emit('payment:failed', {
      userId,
      userType,
      amount,
      reason,
      transactionId,
    });
  }

  /**
   * Notify driver of processed withdrawal
   */
  public emitWithdrawalProcessed(driverId: string | number, amount: number, method: string, transactionId: string | number): boolean {
    return this.emit('withdrawal:processed', {
      driverId,
      amount,
      method,
      transactionId,
    });
  }

  // ============================================
  // RATING EVENTS
  // ============================================

  /**
   * Request rating from rider
   */
  public emitRatingRequestRider(riderId: string | number, rideId: string | number, driverId: string | number): boolean {
    return this.emit('rating:request:rider', {
      riderId,
      rideId,
      driverId,
    });
  }

  /**
   * Request rating from driver
   */
  public emitRatingRequestDriver(driverId: string | number, rideId: string | number, riderId: string | number): boolean {
    return this.emit('rating:request:driver', {
      driverId,
      rideId,
      riderId,
    });
  }

  /**
   * Confirm rating submission
   */
  public emitRatingSubmitted(userId: string | number, userType: string, rideId: string | number, rating: number): boolean {
    return this.emit('rating:submitted', {
      userId,
      userType,
      rideId,
      rating,
    });
  }

  // ============================================
  // NOTIFICATION EVENTS
  // ============================================

  /**
   * Send notification to specific user
   */
  public emitNotification(userId: string | number, userType: string, notification: any): boolean {
    return this.emit('notification:send', {
      userId,
      userType,
      notification,
    });
  }

  /**
   * Broadcast notification to all users of a type
   */
  public emitNotificationBroadcast(userType: string, notification: any): boolean {
    return this.emit('notification:broadcast', {
      userType, // 'all', 'riders', 'drivers', 'conductors', 'delivery'
      notification,
    });
  }

  // ============================================
  // SOS & EMERGENCY EVENTS
  // ============================================

  /**
   * Acknowledge SOS alert
   */
  public emitSOSAcknowledged(alertId: string | number, userId: string | number, userType: string, acknowledgedBy: string): boolean {
    return this.emit('sos:acknowledged', {
      alertId,
      userId,
      userType,
      acknowledgedBy,
    });
  }

  // ============================================
  // ADMIN EVENTS
  // ============================================

  /**
   * Send system announcement
   */
  public emitSystemAnnouncement(targetAudience: string, message: string, priority: string = 'normal'): boolean {
    return this.emit('admin:announcement', {
      targetAudience, // 'all', 'riders', 'drivers', etc.
      message,
      priority,
    });
  }

  // ============================================
  // AFFILIATE EVENTS
  // ============================================

  /**
   * Notify affiliate of referral signup
   */
  public emitAffiliateReferralSignup(affiliateId: string | number, referredUser: any, points: number): boolean {
    return this.emit('affiliate:referral:signup', {
      affiliateId,
      referredUser,
      points,
    });
  }

  /**
   * Notify affiliate of commission earned
   */
  public emitAffiliateCommissionEarned(affiliateId: string | number, amount: number, rideId: string | number, points: number): boolean {
    return this.emit('affiliate:commission:earned', {
      affiliateId,
      amount,
      rideId,
      points,
    });
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;