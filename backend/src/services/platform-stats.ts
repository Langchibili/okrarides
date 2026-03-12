// /**
//  * Platform Statistics Calculator
//  * PATH: src/services/platform-stats.ts
//  *
//  * Queries all relevant tables and upserts the single-type
//  * platform_stats record with fresh aggregated values.
//  *
//  * Called by the cron task — do not call directly in request handlers
//  * (it is intentionally slow and lock-free).
//  */

// export async function recalculatePlatformStats(): Promise<void> {
//   try {
//     strapi.log.info('[platform-stats] Starting recalculation…');

//     // ─── Knex instance for raw aggregations ──────────────────────────────────
//     const knex = strapi.db.connection;

//     // =========================================================================
//     // 1.  RIDE-LEVEL STATS
//     //     All from the `rides` table (collectionName = "rides")
//     // =========================================================================

//     // Completed / cancelled counts
//     const [{ count: totalRidesCompleted }] = await knex('rides')
//       .where('ride_status', 'completed')
//       .count('id as count');

//     const [{ count: totalRidesCancelled }] = await knex('rides')
//       .where('ride_status', 'cancelled')
//       .count('id as count');

//     // Subscription rides — wasSubscriptionRide = true (any status, mirrors the flag)
//     const [{ count: totalSubscriptionRides }] = await knex('rides')
//       .where('was_subscription_ride', true)
//       .count('id as count');

//     // Float rides — commission was deducted, not a subscription ride
//     const [{ count: totalFloatRides }] = await knex('rides')
//       .where('commission_deducted', true)
//       .where('was_subscription_ride', false)
//       .count('id as count');

//     // Cash / digital split (completed rides only)
//     const [{ count: totalCashRides }] = await knex('rides')
//       .where('ride_status', 'completed')
//       .where('payment_method', 'cash')
//       .count('id as count');

//     const [{ count: totalDigitalRides }] = await knex('rides')
//       .where('ride_status', 'completed')
//       .where('payment_method', 'okrapay')
//       .count('id as count');

//     // Driver earnings & commission — completed rides only
//     const [earningsRow] = await knex('rides')
//       .where('ride_status', 'completed')
//       .sum({ totalDriverEarnings: 'driver_earnings', totalPlatformCommission: 'commission' });

//     const totalDriverEarnings     = parseFloat(earningsRow?.totalDriverEarnings  ?? 0) || 0;
//     const totalPlatformCommission = parseFloat(earningsRow?.totalPlatformCommission ?? 0) || 0;

//     // =========================================================================
//     // 2.  TRANSACTION-LEVEL STATS
//     //     From the `transactions` table
//     // =========================================================================

//     // Subscription revenue — completed subscription_payment transactions
//     const [subRevenueRow] = await knex('transactions')
//       .where('type', 'subscription_payment')
//       .where('transaction_status', 'completed')
//       .sum({ total: 'amount' });

//     const totalSubscriptionRevenue = parseFloat(subRevenueRow?.total ?? 0) || 0;

//     // Float sold — completed float_topup transactions
//     const [floatSoldRow] = await knex('transactions')
//       .where('type', 'float_topup')
//       .where('transaction_status', 'completed')
//       .sum({ total: 'amount' });

//     const totalFloatSold = parseFloat(floatSoldRow?.total ?? 0) || 0;

//     // Withdrawals processed — completed withdrawal transactions
//     const [withdrawProcessedRow] = await knex('transactions')
//       .where('type', 'withdrawal')
//       .where('transaction_status', 'completed')
//       .sum({ total: 'amount' });

//     const totalWithdrawalsProcessed = parseFloat(withdrawProcessedRow?.total ?? 0) || 0;

//     // Pending withdrawals — pending withdrawal transactions
//     const [withdrawPendingRow] = await knex('transactions')
//       .where('type', 'withdrawal')
//       .where('transaction_status', 'pending')
//       .sum({ total: 'amount' });

//     const totalPendingWithdrawals = parseFloat(withdrawPendingRow?.total ?? 0) || 0;

//     // =========================================================================
//     // 3.  DRIVER PROFILE FLOAT STATS
//     //     Driver profiles are stored as a Strapi component.
//     //     The component table is: components_driver_profiles_driver_profiles
//     //     Only rows that are linked to a user exist (entity_id is set internally
//     //     by Strapi's component join table: users_driver_profile_components).
//     //     We query the component table directly for float aggregations.
//     // =========================================================================

//     // Active float — sum of positive balances
//     const [activeFloatRow] = await knex('components_driver_profiles_driver_profiles')
//       .where('float_balance', '>', 0)
//       .sum({ total: 'float_balance' });

//     const totalActiveFloat = parseFloat(activeFloatRow?.total ?? 0) || 0;

//     // Negative float — sum of absolute negative balances
//     const [negFloatRow] = await knex('components_driver_profiles_driver_profiles')
//       .where('float_balance', '<', 0)
//       .sum({ total: knex.raw('ABS(float_balance)') });

//     const totalNegativeFloat = parseFloat(negFloatRow?.total ?? 0) || 0;

//     // Count of drivers in negative float
//     const [{ count: driversWithNegativeFloat }] = await knex(
//       'components_driver_profiles_driver_profiles'
//     )
//       .where('float_balance', '<', 0)
//       .count('id as count');

//     // =========================================================================
//     // 4.  DRIVER / SUBSCRIBER COUNTS
//     // =========================================================================

//     // Active drivers — driver profile isActive = true
//     const [{ count: activeDriverCount }] = await knex(
//       'components_driver_profiles_driver_profiles'
//     )
//       .where('is_active', true)
//       .count('id as count');

//     // Active subscribers — driver_subscriptions with status 'active'
//     const [{ count: activeSubscriberCount }] = await knex('driver_subscriptions')
//       .where('subscription_status', 'active')
//       .count('id as count');

//     // Trial subscribers — driver_subscriptions with status 'trial'
//     const [{ count: trialSubscriberCount }] = await knex('driver_subscriptions')
//       .where('subscription_status', 'trial')
//       .count('id as count');

//     // =========================================================================
//     // 5.  UPSERT platform_stats (single type — always one row)
//     // =========================================================================

//     const existing = await strapi.db
//       .query('api::platform-stat.platform-stat')
//       .findOne({});

//     const statsPayload = {
//       lastCalculatedAt: new Date(),

//       totalDriverEarnings:      totalDriverEarnings,
//       totalPlatformCommission:  totalPlatformCommission,
//       totalSubscriptionRevenue: totalSubscriptionRevenue,

//       totalFloatSold:           totalFloatSold,
//       totalActiveFloat:         totalActiveFloat,
//       totalNegativeFloat:       totalNegativeFloat,
//       driversWithNegativeFloat: Number(driversWithNegativeFloat),

//       totalWithdrawalsProcessed: totalWithdrawalsProcessed,
//       totalPendingWithdrawals:   totalPendingWithdrawals,

//       totalRidesCompleted:    Number(totalRidesCompleted),
//       totalRidesCancelled:    Number(totalRidesCancelled),
//       totalSubscriptionRides: Number(totalSubscriptionRides),
//       totalFloatRides:        Number(totalFloatRides),
//       totalCashRides:         Number(totalCashRides),
//       totalDigitalRides:      Number(totalDigitalRides),

//       activeDriverCount:      Number(activeDriverCount),
//       activeSubscriberCount:  Number(activeSubscriberCount),
//       trialSubscriberCount:   Number(trialSubscriberCount),
//     };

//     if (existing) {
//       await strapi.db
//         .query('api::platform-stat.platform-stat')
//         .update({ where: { id: existing.id }, data: statsPayload });
//     } else {
//       await strapi.db
//         .query('api::platform-stat.platform-stat')
//         .create({ data: statsPayload });
//     }

//     strapi.log.info('[platform-stats] Recalculation complete.', {
//       totalRidesCompleted,
//       totalDriverEarnings,
//       activeDriverCount,
//     });
//   } catch (err) {
//     strapi.log.error('[platform-stats] Recalculation failed:', err);
//     // Never rethrow — cron tasks should be silent failures to avoid process crashes
//   }
// }
/**
 * Platform Statistics Calculator
 * PATH: src/services/platform-stats.ts
 *
 * Uses only strapi.db.query() — no raw Knex.
 * count() is used for counting, findMany() with minimal field selection
 * is used for summations (reduced in JS).
 */

// ─── Tiny helper to sum a numeric field across an array of records ───────────
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
    //    Driver profiles are components on the User — we query users and
    //    filter/populate driverProfile to read floatBalance.
    // =========================================================================

    const driversWithPositiveFloat = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: {
          driverProfile: {
            floatBalance: { $gt: 0 },
          },
        },
        populate: {
          driverProfile: {
            select: ['floatBalance'],
          },
        },
        select: ['id'],
      });

    const totalActiveFloat = driversWithPositiveFloat.reduce(
      (acc, u) => acc + (parseFloat(u.driverProfile?.floatBalance) || 0),
      0
    );

    const driversInNegativeFloat = await strapi.db
      .query('plugin::users-permissions.user')
      .findMany({
        where: {
          driverProfile: {
            floatBalance: { $lt: 0 },
          },
        },
        populate: {
          driverProfile: {
            select: ['floatBalance'],
          },
        },
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
      .count({
        where: {
          driverProfile: {
            isActive: true,
          },
        },
      });

    const activeSubscriberCount = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .count({ where: { subscriptionStatus: 'active' } });

    const trialSubscriberCount = await strapi.db
      .query('api::driver-subscription.driver-subscription')
      .count({ where: { subscriptionStatus: 'trial' } });

    // =========================================================================
    // 6. UPSERT the single-type platform_stats record
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
    });
  } catch (err) {
    strapi.log.error('[platform-stats] Recalculation failed:', err);
    // Never rethrow — keeps the cron process alive on failure
  }
}