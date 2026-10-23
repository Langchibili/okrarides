import { resolveSettingsForCountry } from './settingsResolver';

type AllocationAction =
  | 'account-setup'
  | 'ride-booking'
  | 'ride-completion'
  | 'delivery-booking'
  | 'delivery-completion';

const ACTIONS: Record<string, AllocationAction> = {
  onReferralSignup: 'account-setup',
  onRideBooking: 'ride-booking',
  onRideCompletion: 'ride-completion',
  onDeliveryBooking: 'delivery-booking',
  onDeliveryCompletion: 'delivery-completion',
};

const SUBJECT_TYPE: Record<AllocationAction, 'rider' | 'driver'> = {
  'account-setup': 'rider',
  'ride-booking': 'rider',
  'ride-completion': 'driver',
  'delivery-booking': 'rider',
  'delivery-completion': 'driver',
};

const TRANSACTION_TYPE: Record<AllocationAction, string> = {
  'account-setup': 'referral_signup',
  'ride-booking': 'referral_ride_booking',
  'ride-completion': 'referral_ride_completion',
  'delivery-booking': 'referral_delivery_booking',
  'delivery-completion': 'referral_delivery_completion',
};

function getEventId(params: any): string {
  if (params.rideId) return `ride-${params.rideId}`;
  if (params.deliveryId) return `delivery-${params.deliveryId}`;
  return `${ACTIONS[params.eventType]}-user-${params.triggeringUserId}`;
}

async function countCompletedActions(action: AllocationAction, userId: number): Promise<number> {
  if (action === 'ride-booking' || action === 'ride-completion') {
    const role = action === 'ride-booking' ? 'rider' : 'driver';
    return strapi.db.query('api::ride.ride').count({
      where: { [role]: userId, rideStatus: 'completed' },
    });
  }
  if (action === 'delivery-booking' || action === 'delivery-completion') {
    const role = action === 'delivery-booking' ? 'sender' : 'deliverer';
    return strapi.db.query('api::delivery.delivery').count({
      where: { [role]: userId, rideStatus: 'completed' },
    });
  }
  return 1;
}

export async function processAffiliatePointsAllocation(params: {
  eventType: string;
  triggeringUserId: number;
  fare?: number;
  rideId?: number;
  deliveryId?: number;
}): Promise<void> {
  const action = ACTIONS[params.eventType];
  if (!action) return;

  try {
    const triggeringUser = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { id: params.triggeringUserId },
        populate: {
          country: true,
          referredBy: { populate: { affiliateProfile: true, country: true } },
        },
      });
    const referrer = triggeringUser?.referredBy;
    if (!referrer?.id || referrer.id === triggeringUser.id) return;

    const triggeringSettings = await resolveSettingsForCountry(strapi, triggeringUser.country?.id);
    if (triggeringSettings.affiliateSystemEnabled !== true) return;
    const affiliateSettings = await resolveSettingsForCountry(strapi, referrer.country?.id);

    const matchingRules = await strapi.db
      .query('api::affiliate-points-allocation-rule.affiliate-points-allocation-rule')
      .findMany({
        where: { type: action, active: true },
        populate: { countries: true },
      });
    const countryId = triggeringUser.country?.id;
    const rules = matchingRules.filter((rule: any) => (
      countryId
      && rule.countries?.some((country: any) => country.id === countryId && country.isActive === true)
      && (rule.appliesTo === 'all' || rule.appliesTo === SUBJECT_TYPE[action])
    ));

    if (referrer.affiliateProfile?.blocked) return;

    const eventId = getEventId(params);
    const profile = referrer.affiliateProfile;
    if (!profile?.id) return;
    let totalPoints = Number(profile.totalPoints || 0);
    let pointsBalance = Number(profile.pointsBalance || 0);
    let totalEarnings = Number(profile.totalEarnings || 0);
    let withdrawableBalance = Number(profile.withdrawableBalance || 0);
    let referralCountIncremented = false;

    for (const rule of rules) {
      const ruleTransactions = await strapi.db
        .query('api::affiliate-transaction.affiliate-transaction')
        .findMany({
          where: { affiliate: referrer.id, referredUser: triggeringUser.id, rule: rule.id },
          select: ['id', 'transactionId'],
        });
      const transactionId = `AFF-${rule.id}-${triggeringUser.id}-${eventId}`;
      if (ruleTransactions.some((transaction: any) => transaction.transactionId === transactionId)) continue;
      if (ruleTransactions.length >= Math.max(1, Number(rule.actionAmountsPerUser) || 1)) continue;

      if (rule.isRuleVolumeType) {
        const volume = Number(rule.volume);
        const completedActions = await countCompletedActions(action, triggeringUser.id);
        if (volume <= 0 || completedActions % volume !== 0) continue;
      }

      const points = Math.max(0, Number(rule.pointsAllocatedFromAction) || 0);
      if (!points) continue;

      const conversion = affiliateSettings._affiliatePointsConversion;
      const pointsPerUnit = Number(conversion?.affiliatePoints);
      const currencyAmount = Number(conversion?.currencyAmount);
      const fallbackRate = Number(affiliateSettings.moneyPerPoint) || 0;
      const cashValue = pointsPerUnit > 0 && Number.isFinite(currencyAmount)
        ? (points / pointsPerUnit) * currencyAmount
        : points * fallbackRate;
      const isNewReferral = action === 'account-setup' && !referralCountIncremented
        ? !(await strapi.db.query('api::affiliate-transaction.affiliate-transaction').findOne({
            where: {
              affiliate: referrer.id,
              referredUser: triggeringUser.id,
              type: 'referral_signup',
              affiliate_transaction_status: 'completed',
            },
            select: ['id'],
          }))
        : false;

      let allocationTransactionId: number | undefined;
      let pointsPersisted = false;
      try {
        const transaction = await strapi.db.query('api::affiliate-transaction.affiliate-transaction').create({
          data: {
            transactionId,
            affiliate: referrer.id,
            referredUser: triggeringUser.id,
            rule: rule.id,
            type: TRANSACTION_TYPE[action],
            points,
            amount: cashValue,
            affiliate_transaction_status: 'pending',
            ride: params.rideId ?? null,
            delivery: params.deliveryId ?? null,
            description: `${points} pts earned — ${action}`,
            processedAt: new Date(),
          },
        });
        allocationTransactionId = transaction.id;
        if (!referrer.documentId) {
          throw new Error(`Affiliate referrer ${referrer.id} is missing a document ID`);
        }
        const updatedReferrer = await strapi
          .documents('plugin::users-permissions.user')
          .update({
            documentId: referrer.documentId,
            data: {
              affiliateProfile: {
                id: profile.id,
                totalPoints: totalPoints + points,
                pointsBalance: pointsBalance + points,
                totalEarnings: totalEarnings + cashValue,
                withdrawableBalance: withdrawableBalance + cashValue,
                totalReferrals: Number(profile.totalReferrals || 0) + (isNewReferral ? 1 : 0),
                activeReferrals: Number(profile.activeReferrals || 0) + (isNewReferral ? 1 : 0),
              },
            },
            populate: ['affiliateProfile'],
          });
        const updatedProfile = updatedReferrer?.affiliateProfile;
        if (
          Number(updatedProfile?.totalPoints) !== totalPoints + points
          || Number(updatedProfile?.pointsBalance) !== pointsBalance + points
        ) {
          throw new Error(`Affiliate profile ${profile.id} points did not persist`);
        }
        pointsPersisted = true;
        await strapi.db.query('api::affiliate-transaction.affiliate-transaction').update({
          where: { id: transaction.id },
          data: { affiliate_transaction_status: 'completed' },
        });
        totalPoints += points;
        pointsBalance += points;
        totalEarnings += cashValue;
        withdrawableBalance += cashValue;
        referralCountIncremented = referralCountIncremented || isNewReferral;
      } catch (error) {
        if (allocationTransactionId && !pointsPersisted) {
          try {
            await strapi.db
              .query('api::affiliate-transaction.affiliate-transaction')
              .delete({ where: { id: allocationTransactionId } });
          } catch (cleanupError) {
            strapi.log.error(
              '[AffiliatePointsAllocation] Could not remove incomplete transaction',
              cleanupError,
            );
          }
        }
        strapi.log.error('[AffiliatePointsAllocation] Could not persist allocation transaction', error);
        throw error;
      }
    }
  } catch (error) {
    strapi.log.error('[AffiliatePointsAllocation] Processing failed', error);
  }
}

export async function ensureDefaultAffiliateAllocationRules(strapiInstance: any): Promise<void> {
  const countries = await strapiInstance.db.query('api::country.country').findMany({
    select: ['id'],
  });
  const countryIds = countries.map((country: any) => country.id);

  const defaults = [
    { type: 'ride-booking', name: 'Rider completed ride referral', appliesTo: 'rider' },
    { type: 'ride-completion', name: 'Driver completed ride referral', appliesTo: 'driver' },
  ];

  for (const ruleDefaults of defaults) {
    const existing = await strapiInstance.db
      .query('api::affiliate-points-allocation-rule.affiliate-points-allocation-rule')
      .findMany({
        where: { type: ruleDefaults.type },
        populate: { countries: true },
      });
    if (!existing.length) {
      await strapiInstance.db
        .query('api::affiliate-points-allocation-rule.affiliate-points-allocation-rule')
        .create({
          data: {
            ...ruleDefaults,
            actionAmountsPerUser: 1,
            pointsAllocatedFromAction: 1,
            active: true,
            isRuleVolumeType: false,
            volume: 0,
            countries: { connect: countryIds },
          },
        });
      continue;
    }

    for (const rule of existing) {
      const linkedIds = new Set((rule.countries ?? []).map((country: any) => country.id));
      const missingIds = countryIds.filter((id: number) => !linkedIds.has(id));
      if (missingIds.length) {
        await strapiInstance.db
          .query('api::affiliate-points-allocation-rule.affiliate-points-allocation-rule')
          .update({
            where: { id: rule.id },
            data: { countries: { connect: missingIds } },
          });
      }
    }
  }
}
