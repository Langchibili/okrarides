/**
 * Platform Statistics Calculator
 * PATH: src/services/platform-stats.ts
 *
 * Uses only strapi.db.query() — no raw Knex.
 */

const sumField = (records: any[], field: string): number =>
  records.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);

export async function recalculatePlatformStats(): Promise<void> {
  try {
    strapi.log.info('[platform-stats] Starting recalculation…');

    // =========================================================================
    // 1. RIDE COUNTS
    // =========================================================================

    const totalRidesCompleted = await strapi.db
      .query('api::ride.ride')
      .count({ where: { rideStatus: 'completed' } });

    const totalRidesCancelled = await strapi.db
      .query('api::ride.ride')
      .count({ where: { rideStatus: 'cancelled' } });

    const totalSubscriptionRides = await strapi.db
      .query('api::ride.ride')
      .count({ where: { wasSubscriptionRide: true } });

    const totalFloatRides = await strapi.db
      .query('api::ride.ride')
      .count({ where: { commissionDeducted: true, wasSubscriptionRide: false } });

    const totalCashRides = await strapi.db
      .query('api::ride.ride')
      .count({ where: { rideStatus: 'completed', paymentMethod: 'cash' } });

    const totalDigitalRides = await strapi.db
      .query('api::ride.ride')
      .count({ where: { rideStatus: 'completed', paymentMethod: 'okrapay' } });

    // =========================================================================
    // 2. RIDE EARNINGS & COMMISSION  (completed rides only)
    // =========================================================================

    const completedRideFinancials = await strapi.db
      .query('api::ride.ride')
      .findMany({
        where: { rideStatus: 'completed' },
        select: ['driverEarnings', 'commission'],
      });

    const totalDriverEarnings     = sumField(completedRideFinancials, 'driverEarnings');
    const totalPlatformCommission = sumField(completedRideFinancials, 'commission');

    // =========================================================================
    // 3. TRANSACTION SUMS
    // =========================================================================

    const subscriptionPayments = await strapi.db
      .query('api::transaction.transaction')
      .findMany({
        where: { type: 'subscription_payment', transactionStatus: 'completed' },
        select: ['amount'],
      });

    const totalSubscriptionRevenue = sumField(subscriptionPayments, 'amount');

    const floatTopups = await strapi.db
      .query('api::transaction.transaction')
      .findMany({
        where: { type: 'float_topup', transactionStatus: 'completed' },
        select: ['amount'],
      });

    const totalFloatSold = sumField(floatTopups, 'amount');

    const processedWithdrawals = await strapi.db
      .query('api::transaction.transaction')
      .findMany({
        where: { type: 'withdrawal', transactionStatus: 'completed' },
        select: ['amount'],
      });

    const totalWithdrawalsProcessed = sumField(processedWithdrawals, 'amount');

    const pendingWithdrawals = await strapi.db
      .query('api::transaction.transaction')
      .findMany({
        where: { type: 'withdrawal', transactionStatus: 'pending' },
        select: ['amount'],
      });

    const totalPendingWithdrawals = sumField(pendingWithdrawals, 'amount');

    // =========================================================================
    // 4. FLOAT STATS
    // =========================================================================

    const driversWithPositiveFloat = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: { driverProfile: { floatBalance: { $gt: 0 } } },
        populate: { driverProfile: { select: ['floatBalance'] } },
        select: ['id'],
      });

    const totalActiveFloat = driversWithPositiveFloat.reduce(
      (acc, u) => acc + (parseFloat(u.driverProfile?.floatBalance) || 0),
      0
    );

    const driversInNegativeFloat = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: { driverProfile: { floatBalance: { $lt: 0 } } },
        populate: { driverProfile: { select: ['floatBalance'] } },
        select: ['id'],
      });

    const totalNegativeFloat = driversInNegativeFloat.reduce(
      (acc, u) => acc + Math.abs(parseFloat(u.driverProfile?.floatBalance) || 0),
      0
    );

    const driversWithNegativeFloat = driversInNegativeFloat.length;

    // =========================================================================
    // 5. DRIVER & SUBSCRIBER COUNTS
    // =========================================================================

    const activeDriverCount = await strapi.db
      .query('plugin::users-permissions.user')
      .count({ where: { driverProfile: { isActive: true } } });

    const activeSubscriberCount = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .count({ where: { subscriptionStatus: 'active' } });

    const trialSubscriberCount = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .count({ where: { subscriptionStatus: 'trial' } });

    // =========================================================================
    // 6. DELIVERY COUNTS
    // =========================================================================

    const totalDeliveriesCompleted = await strapi.db
      .query('api::delivery.delivery')
      .count({ where: { rideStatus: 'completed' } });

    const totalDeliveriesCancelled = await strapi.db
      .query('api::delivery.delivery')
      .count({ where: { rideStatus: 'cancelled' } });

    const totalCashDeliveries = await strapi.db
      .query('api::delivery.delivery')
      .count({ where: { rideStatus: 'completed', paymentMethod: 'cash' } });

    const totalDigitalDeliveries = await strapi.db
      .query('api::delivery.delivery')
      .count({ where: { rideStatus: 'completed', paymentMethod: 'okrapay' } });

    // =========================================================================
    // 7. DELIVERY EARNINGS & COMMISSION
    // =========================================================================

    const completedDeliveryFinancials = await strapi.db
      .query('api::delivery.delivery')
      .findMany({
        where: { rideStatus: 'completed' },
        select: ['driverEarnings', 'commission'],
      });

    const totalDeliveryDriverEarnings     = sumField(completedDeliveryFinancials, 'driverEarnings');
    const totalDeliveryPlatformCommission = sumField(completedDeliveryFinancials, 'commission');

    // =========================================================================
    // 8. ACTIVE DELIVERY DRIVER COUNT
    // =========================================================================

    const activeDeliveryDriverCount = await strapi.db
      .query('plugin::users-permissions.user')
      .count({ where: { deliveryProfile: { isActive: true } } });

    // =========================================================================
    // 9. UPSERT the single-type platform_stats record
    // =========================================================================

    const existing = await strapi.db
      .query('api::platform-stat.platform-stat')
      .findOne({});

    const statsPayload = {
      lastCalculatedAt: new Date(),

      totalDriverEarnings,
      totalPlatformCommission,
      totalSubscriptionRevenue,

      totalFloatSold,
      totalActiveFloat,
      totalNegativeFloat,
      driversWithNegativeFloat,

      totalWithdrawalsProcessed,
      totalPendingWithdrawals,

      totalRidesCompleted,
      totalRidesCancelled,
      totalSubscriptionRides,
      totalFloatRides,
      totalCashRides,
      totalDigitalRides,

      activeDriverCount,
      activeSubscriberCount,
      trialSubscriberCount,

      // ─── Deliveries ────────────────────────────────────────────────────
      totalDeliveriesCompleted,
      totalDeliveriesCancelled,
      totalDeliveryDriverEarnings,
      totalDeliveryPlatformCommission,
      totalCashDeliveries,
      totalDigitalDeliveries,
      activeDeliveryDriverCount,
    };

    if (existing) {
      await strapi.db
        .query('api::platform-stat.platform-stat')
        .update({ where: { id: existing.id }, data: statsPayload });
    } else {
      await strapi.db
        .query('api::platform-stat.platform-stat')
        .create({ data: statsPayload });
    }

    strapi.log.info('[platform-stats] Recalculation complete.', {
      totalRidesCompleted,
      totalDriverEarnings,
      activeDriverCount,
      totalDeliveriesCompleted,
      totalDeliveryDriverEarnings,
      activeDeliveryDriverCount,
    });
  } catch (err) {
    strapi.log.error('[platform-stats] Recalculation failed:', err);
  }
}