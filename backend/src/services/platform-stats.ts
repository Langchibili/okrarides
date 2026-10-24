import { resolveSettingsForCountry } from './settingsResolver';

const COUNTRY_UID = 'api::country.country';
const USER_UID = 'plugin::users-permissions.user';
const PLATFORM_STAT_UID = 'api::platform-stat.platform-stat';

const sumField = (records: any[], field: string): number =>
  records.reduce((total, record) => total + (Number(record[field]) || 0), 0);

const relationId = (relation: any): number | null =>
  typeof relation === 'number' ? relation : relation?.id ?? null;

let recalculationInProgress = false;

export async function recalculatePlatformStats(): Promise<void> {
  if (recalculationInProgress) {
    strapi.log.warn('[platform-stats] Recalculation skipped because one is already running');
    return;
  }
  recalculationInProgress = true;

  try {
    const countries = await strapi.db.query(COUNTRY_UID).findMany({
      where: { isActive: true },
      select: ['id', 'name', 'code'],
      populate: { currency: { select: ['id', 'name', 'code', 'symbol'] } },
    });

    const legacySnapshots = await strapi.db.query(PLATFORM_STAT_UID).findMany({
      where: { country: null },
      select: ['id'],
    });
    if (legacySnapshots.length) {
      await strapi.db.query(PLATFORM_STAT_UID).deleteMany({
        where: { id: { $in: legacySnapshots.map((snapshot: any) => snapshot.id) } },
      });
    }

    for (const country of countries) {
      const countryId = Number(country.id);
      const [settings, rides, deliveries, users] = await Promise.all([
        resolveSettingsForCountry(strapi, countryId),
        strapi.db.query('api::ride.ride').findMany({
          where: {
            $or: [
              { driver: { country: { id: countryId } } },
              { rider: { country: { id: countryId } } },
            ],
          },
          select: [
            'id', 'rideStatus', 'paymentMethod', 'driverEarnings', 'commission',
            'commissionDeducted', 'wasSubscriptionRide',
          ],
          populate: {
            driver: { select: ['id'], populate: { partner: { select: ['id'] } } },
          },
        }),
        strapi.db.query('api::delivery.delivery').findMany({
          where: {
            $or: [
              { deliverer: { country: { id: countryId } } },
              { sender: { country: { id: countryId } } },
            ],
          },
          select: ['id', 'rideStatus', 'paymentMethod', 'driverEarnings', 'commission'],
          populate: {
            deliverer: { select: ['id'], populate: { partner: { select: ['id'] } } },
          },
        }),
        strapi.db.query(USER_UID).findMany({
          where: { country: { id: countryId } },
          select: ['id'],
          populate: {
            driverProfile: {
              select: ['id', 'isActive', 'floatBalance'],
              populate: { assignedVehicle: { select: ['id'] } },
            },
            deliveryProfile: {
              select: ['id', 'isActive'],
              populate: {
                taxi: { populate: { vehicle: { select: ['id'] } } },
                motorbike: { populate: { vehicle: { select: ['id'] } } },
                motorcycle: { populate: { vehicle: { select: ['id'] } } },
                truck: { populate: { vehicle: { select: ['id'] } } },
              },
            },
            affiliateProfile: { select: ['id', 'pointsBalance', 'pendingEarnings', 'activeReferrals'] },
            partnerProfile: { select: ['id'] },
            referredBy: { select: ['id'] },
          },
        }),
      ]);

      const completedRides = rides.filter((ride: any) => ride.rideStatus === 'completed');
      const completedDeliveries = deliveries.filter((delivery: any) => delivery.rideStatus === 'completed');
      const rideCommission = sumField(completedRides, 'commission');
      const deliveryCommission = sumField(completedDeliveries, 'commission');
      const totalPlatformCommission = rideCommission + deliveryCommission;
      const partnerCommissionBase =
        completedRides
          .filter((ride: any) => relationId(ride.driver?.partner))
          .reduce((sum: number, ride: any) => sum + (Number(ride.commission) || 0), 0) +
        completedDeliveries
          .filter((delivery: any) => relationId(delivery.deliverer?.partner))
          .reduce((sum: number, delivery: any) => sum + (Number(delivery.commission) || 0), 0);
      const partnerCommissionPercentage = Number(settings.partnerCommisionPercentage) || 0;
      const partnerCommissionShare = partnerCommissionBase * partnerCommissionPercentage / 100;
      const countryUsers = users as any[];
      const driverUsers = countryUsers.filter((user) => user.driverProfile);
      const deliveryDriverUsers = countryUsers.filter((user) => user.deliveryProfile);
      const hasAssignedVehicle = (user: any): boolean => Boolean(
        relationId(user.driverProfile?.assignedVehicle) ||
        relationId(user.deliveryProfile?.taxi?.vehicle) ||
        relationId(user.deliveryProfile?.motorbike?.vehicle) ||
        relationId(user.deliveryProfile?.motorcycle?.vehicle) ||
        relationId(user.deliveryProfile?.truck?.vehicle),
      );
      const assignedRideDrivers = driverUsers.filter(hasAssignedVehicle);
      const assignedDeliveryDrivers = deliveryDriverUsers.filter(hasAssignedVehicle);
      const riderCount = countryUsers.filter((user) => !user.partnerProfile && !hasAssignedVehicle(user)).length;
      const positiveFloatUsers = driverUsers.filter((user) => Number(user.driverProfile.floatBalance) > 0);
      const negativeFloatUsers = driverUsers.filter((user) => Number(user.driverProfile.floatBalance) < 0);
      const partnerIds = countryUsers
        .filter((user) => user.partnerProfile)
        .map((user) => Number(user.id));

      const [subscriptions, withdrawals, pendingWithdrawals, driverLedger, affiliateTransactions] =
        await Promise.all([
          strapi.db.query('api::transaction.transaction').findMany({
            where: {
              user: { country: { id: countryId } },
              type: 'subscription_payment',
              transactionStatus: 'completed',
            },
            select: ['amount'],
          }),
          strapi.db.query('api::transaction.transaction').findMany({
            where: {
              user: { country: { id: countryId } },
              type: 'withdrawal',
              transactionStatus: 'completed',
            },
            select: ['amount'],
          }),
          strapi.db.query('api::transaction.transaction').findMany({
            where: {
              user: { country: { id: countryId } },
              type: 'withdrawal',
              transactionStatus: 'pending',
            },
            select: ['amount'],
          }),
          strapi.db.query('api::ledger-entry.ledger-entry').findMany({
            where: {
              driver: { country: { id: countryId } },
              type: { $in: ['float_topup', 'float_topup-partner'] },
              amount: { $gt: 0 },
              ledgerStatus: 'settled',
            },
            select: ['amount', 'type'],
          }),
          strapi.db.query('api::affiliate-transaction.affiliate-transaction').findMany({
            where: { affiliate: { country: { id: countryId } } },
            select: ['id', 'points'],
          }),
        ]);

      const partnerTopups = partnerIds.length
        ? await strapi.db.query('api::float-topup.float-topup').findMany({
            where: { partner: { $in: partnerIds }, floatStatus: 'completed' },
            select: ['amount'],
          })
        : [];

      const affiliateUsers = countryUsers.filter((user) => user.affiliateProfile);
      const activeAffiliateCount = affiliateUsers.filter(
        (user) => Number(user.affiliateProfile.activeReferrals) > 0,
      ).length;
      const completedAffiliatePayouts = await strapi.db.query('api::transaction.transaction').findMany({
        where: {
          user: { country: { id: countryId } },
          type: 'affiliate_payout',
          transactionStatus: 'completed',
        },
        select: ['amount'],
      });
      const activeSubscribers = await strapi.db.query('api::driver-subscription.driver-subscription').count({
        where: { driver: { country: { id: countryId } }, subscriptionStatus: 'active' },
      });
      const trialSubscribers = await strapi.db.query('api::driver-subscription.driver-subscription').count({
        where: { driver: { country: { id: countryId } }, subscriptionStatus: 'trial' },
      });

      const statsPayload = {
        country: countryId,
        lastCalculatedAt: new Date(),
        platformStatCalculationCycleInMins: Math.max(
          1,
          Number(settings.platformStatCalculationCycleInMins) || 20,
        ),
        partnerCommisionPercentage: partnerCommissionPercentage,
        partnerCommissionShare,
        estimatedProfit: totalPlatformCommission - partnerCommissionShare,
        totalDriverEarnings: sumField(completedRides, 'driverEarnings') +
          sumField(completedDeliveries, 'driverEarnings'),
        totalPlatformCommission,
        totalSubscriptionRevenue: sumField(subscriptions, 'amount'),
        totalFloatSold: sumField(
          driverLedger.filter((entry: any) => entry.type === 'float_topup'),
          'amount',
        ) + sumField(partnerTopups, 'amount'),
        totalDriverFloatIssued: sumField(driverLedger, 'amount'),
        totalPartnerFloatPurchased: sumField(partnerTopups, 'amount'),
        totalActiveFloat: positiveFloatUsers.reduce(
          (sum, user) => sum + (Number(user.driverProfile.floatBalance) || 0), 0,
        ),
        totalNegativeFloat: negativeFloatUsers.reduce(
          (sum, user) => sum + Math.abs(Number(user.driverProfile.floatBalance) || 0), 0,
        ),
        driversWithNegativeFloat: negativeFloatUsers.length,
        totalWithdrawalsProcessed: sumField(withdrawals, 'amount'),
        totalPendingWithdrawals: sumField(pendingWithdrawals, 'amount'),
        totalRidesCompleted: completedRides.length,
        totalRideCount: rides.length,
        totalRidesCancelled: rides.filter((ride: any) => ride.rideStatus === 'cancelled').length,
        totalSubscriptionRides: rides.filter((ride: any) => ride.wasSubscriptionRide).length,
        totalFloatRides: rides.filter((ride: any) => ride.commissionDeducted && !ride.wasSubscriptionRide).length,
        totalCashRides: completedRides.filter((ride: any) => ride.paymentMethod === 'cash').length,
        totalDigitalRides: completedRides.filter((ride: any) => ride.paymentMethod === 'okrapay').length,
        totalDriverCount: assignedRideDrivers.length,
        totalDelivererCount: assignedDeliveryDrivers.length,
        totalRiderCount: riderCount,
        activeDriverCount: assignedRideDrivers.filter((user) => user.driverProfile.isActive).length,
        activeSubscriberCount: activeSubscribers,
        trialSubscriberCount: trialSubscribers,
        totalDeliveriesCompleted: completedDeliveries.length,
        totalDeliveryCount: deliveries.length,
        totalDeliveriesCancelled: deliveries.filter((delivery: any) => delivery.rideStatus === 'cancelled').length,
        totalDeliveryDriverEarnings: sumField(completedDeliveries, 'driverEarnings'),
        totalDeliveryPlatformCommission: deliveryCommission,
        totalCashDeliveries: completedDeliveries.filter((delivery: any) => delivery.paymentMethod === 'cash').length,
        totalDigitalDeliveries: completedDeliveries.filter((delivery: any) => delivery.paymentMethod === 'okrapay').length,
        activeDeliveryDriverCount: assignedDeliveryDrivers.filter((user) => user.deliveryProfile.isActive).length,
        totalAffiliatePoints: sumField(
          affiliateTransactions.filter((transaction: any) => Number(transaction.points) > 0),
          'points',
        ),
        totalAffiliatePayouts: sumField(completedAffiliatePayouts, 'amount'),
        totalPendingAffiliateBalance: affiliateUsers.reduce(
          (sum, user) => sum + (Number(user.affiliateProfile.pendingEarnings) || 0), 0,
        ),
        activeAffiliateCount,
        totalAffiliateReferrals: countryUsers.filter((user) => user.referredBy).length,
        totalAffiliateTransactions: affiliateTransactions.length,
      };

      const existing = await strapi.db.query(PLATFORM_STAT_UID).findOne({
        where: { country: { id: countryId } },
        select: ['id'],
      });
      if (existing) {
        await strapi.db.query(PLATFORM_STAT_UID).update({
          where: { id: existing.id },
          data: statsPayload,
        });
      } else {
        await strapi.db.query(PLATFORM_STAT_UID).create({ data: statsPayload });
      }
    }

    strapi.log.info(`[platform-stats] Recalculated snapshots for ${countries.length} active countries`);
  } catch (error) {
    strapi.log.error('[platform-stats] Recalculation failed', error);
    throw error;
  } finally {
    recalculationInProgress = false;
  }
}
