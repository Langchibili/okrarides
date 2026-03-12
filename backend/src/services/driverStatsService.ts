/**
 * Driver Stats Service
 * PATH: src/services/driverStatsService.ts
 *
 * Returns aggregated ride + profile stats for a single driver
 * for a given period (today | week | month | year | all).
 *
 * Called by the custom /rides/driver-stats endpoint.
 */

export type StatPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

function getPeriodBounds(period: StatPeriod): { from: Date | null; to: Date } {
  const now = new Date();
  const to  = new Date(now);

  if (period === 'all') return { from: null, to };

  const from = new Date(now);

  switch (period) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case 'week':
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      break;
    case 'month':
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      break;
    case 'year':
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      break;
  }

  return { from, to };
}

/** Group completed rides into daily buckets for charting */
function buildDailyBreakdown(rides: any[]): any[] {
  const map = new Map<string, { date: string; earnings: number; rides: number; commission: number; distance: number }>();

  for (const ride of rides) {
    const dateKey = new Date(ride.tripCompletedAt).toISOString().split('T')[0];
    const bucket  = map.get(dateKey) ?? { date: dateKey, earnings: 0, rides: 0, commission: 0, distance: 0 };

    bucket.earnings   += parseFloat(ride.driverEarnings) || 0;
    bucket.commission += parseFloat(ride.commission)     || 0;
    bucket.distance   += parseFloat(ride.actualDistance || ride.estimatedDistance) || 0;
    bucket.rides      += 1;

    map.set(dateKey, bucket);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Group completed rides by hour-of-day for the heatmap */
function buildHourlyBreakdown(rides: any[]): any[] {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, rides: 0, earnings: 0 }));

  for (const ride of rides) {
    const h = new Date(ride.tripCompletedAt).getHours();
    hours[h].rides    += 1;
    hours[h].earnings += parseFloat(ride.driverEarnings) || 0;
  }

  return hours;
}

export async function getDriverStats(strapi: any, driverId: number, period: StatPeriod) {
  const { from, to } = getPeriodBounds(period);

  // ── Date filter applied to tripCompletedAt ──────────────────────────────
  const dateWhere = from
    ? { tripCompletedAt: { $gte: from, $lte: to } }
    : {};

  // ── 1. Completed rides for this driver in the period ────────────────────
  const completedRides = await strapi.db.query('api::ride.ride').findMany({
    where: {
      driver:     driverId,
      rideStatus: 'completed',
      ...dateWhere,
    },
    select: [
      'id', 'totalFare', 'driverEarnings', 'commission',
      'paymentMethod', 'wasSubscriptionRide', 'commissionDeducted',
      'actualDistance', 'estimatedDistance',
      'actualDuration', 'estimatedDuration',
      'tripCompletedAt',
    ],
  });

  // ── 2. Cancelled rides in the period (for rate calculations) ────────────
  const cancelledCount = await strapi.db.query('api::ride.ride').count({
    where: {
      driver:     driverId,
      rideStatus: 'cancelled',
      ...(from ? { cancelledAt: { $gte: from, $lte: to } } : {}),
    },
  });

  // ── 3. All rides requested to this driver (for acceptance rate) ─────────
  //    requestedDriverAccounts is a relation — count rides where this driver
  //    appears as a requested driver in the period
  const totalRequested = await strapi.db.query('api::ride.ride').count({
    where: {
      requestedDriverAccounts: driverId,
      ...(from ? { requestedAt: { $gte: from, $lte: to } } : {}),
    },
  });

  // ── 4. Driver profile (lifetime counters + balances) ────────────────────
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where:    { id: driverId },
    select:   ['id'],
    populate: {
      driverProfile: {
        select: [
          'totalRides', 'completedRides', 'cancelledRides',
          'totalEarnings', 'currentBalance',
          'floatBalance', 'withdrawableFloatBalance',
          'averageRating', 'totalRatings',
          'acceptanceRate', 'completionRate', 'cancellationRate',
          'totalDistance',
          'subscriptionStatus',
        ],
        populate: {
          currentSubscription: {
            select: ['id', 'subscriptionStatus', 'expiresAt', 'isFreeTrial'],
            populate: {
              subscriptionPlan: { select: ['name', 'price'] },
            },
          },
        },
      },
    },
  });

  const profile = user?.driverProfile ?? {};

  // ── 5. Aggregate period numbers from rides ──────────────────────────────
  let periodEarnings    = 0;
  let periodCommission  = 0;
  let periodDistance    = 0;
  let periodDuration    = 0;
  let cashRides         = 0;
  let digitalRides      = 0;
  let subscriptionRides = 0;
  let floatRides        = 0;
  let totalFareCollected = 0;

  for (const ride of completedRides) {
    const earnings   = parseFloat(ride.driverEarnings) || 0;
    const commission = parseFloat(ride.commission)     || 0;
    const distance   = parseFloat(ride.actualDistance || ride.estimatedDistance) || 0;
    const duration   = parseInt(ride.actualDuration   || ride.estimatedDuration) || 0;

    periodEarnings     += earnings;
    periodCommission   += commission;
    periodDistance     += distance;
    periodDuration     += duration;
    totalFareCollected += parseFloat(ride.totalFare) || 0;

    if (ride.paymentMethod === 'cash')    cashRides++;
    else                                  digitalRides++;

    if (ride.wasSubscriptionRide)  subscriptionRides++;
    else                           floatRides++;
  }

  const completedCount = completedRides.length;
  const totalInPeriod  = completedCount + cancelledCount;
  const averageRide    = completedCount > 0 ? periodEarnings / completedCount : 0;

  // Acceptance rate for the period
  const periodAcceptanceRate = totalRequested > 0
    ? Math.round((completedCount / totalRequested) * 100)
    : 100;

  // ── 6. Float deduction summary for the period ───────────────────────────
  // For float-based rides: floatDeduction per ride = totalFare + commission
  // So total float spent doing these rides =
  const periodFloatDeducted = floatRides > 0
    ? completedRides
        .filter(r => !r.wasSubscriptionRide)
        .reduce((sum, r) => sum + (parseFloat(r.totalFare) || 0) + (parseFloat(r.commission) || 0), 0)
    : 0;

  return {
    period,

    // ── Period summary ──────────────────────────────────────────────────
    summary: {
      totalEarnings:      parseFloat(periodEarnings.toFixed(2)),
      totalFareCollected: parseFloat(totalFareCollected.toFixed(2)),
      totalCommission:    parseFloat(periodCommission.toFixed(2)),
      completedRides:     completedCount,
      cancelledRides:     cancelledCount,
      totalRides:         totalInPeriod,
      cashRides,
      digitalRides,
      subscriptionRides,
      floatRides,
      averageRide:        parseFloat(averageRide.toFixed(2)),
      totalDistance:      parseFloat(periodDistance.toFixed(2)),
      totalDuration:      periodDuration,           // minutes
      acceptanceRate:     periodAcceptanceRate,
      floatDeducted:      parseFloat(periodFloatDeducted.toFixed(2)),
    },

    // ── Lifetime profile counters ───────────────────────────────────────
    lifetime: {
      totalRides:       profile.totalRides       ?? 0,
      completedRides:   profile.completedRides   ?? 0,
      cancelledRides:   profile.cancelledRides   ?? 0,
      totalEarnings:    parseFloat((profile.totalEarnings    ?? 0).toString()),
      currentBalance:   parseFloat((profile.currentBalance   ?? 0).toString()),
      totalDistance:    parseFloat((profile.totalDistance    ?? 0).toString()),
      averageRating:    parseFloat((profile.averageRating    ?? 0).toString()),
      totalRatings:     profile.totalRatings     ?? 0,
      acceptanceRate:   parseFloat((profile.acceptanceRate   ?? 100).toString()),
      completionRate:   parseFloat((profile.completionRate   ?? 100).toString()),
      cancellationRate: parseFloat((profile.cancellationRate ?? 0).toString()),
    },

    // ── Float / subscription balances ───────────────────────────────────
    balances: {
      floatBalance:             parseFloat((profile.floatBalance             ?? 0).toString()),
      withdrawableFloatBalance: parseFloat((profile.withdrawableFloatBalance ?? 0).toString()),
      subscriptionStatus:       profile.subscriptionStatus ?? 'inactive',
      currentSubscription:      profile.currentSubscription ?? null,
    },

    // ── Chart data ──────────────────────────────────────────────────────
    dailyBreakdown:  buildDailyBreakdown(completedRides),
    hourlyBreakdown: buildHourlyBreakdown(completedRides),
  };
}