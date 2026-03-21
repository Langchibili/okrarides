/**
 * Affiliate Points Service
 * PATH: src/services/affiliateService.ts
 *
 * Called from:
 *   - handleCompleteTrip   → processAffiliatePoints({ eventType: 'onRideCompletion', ... })
 *   - handleCompleteDelivery → processAffiliatePoints({ eventType: 'onDeliveryCompletion', ... })
 *   - ride.create controller → processAffiliatePoints({ eventType: 'onRideBooking', ... })
 *   - delivery.create controller → processAffiliatePoints({ eventType: 'onDeliveryBooking', ... })
 *   - User lifecycle afterUpdate → processAffiliatePoints({ eventType: 'onReferralSignup', ... })
 *
 * Point calculation:
 *   flat      → points = rule.value  (e.g. 10 flat points)
 *   percentage → points = Math.round(fare * rule.value / 100)  (e.g. 10% of 100 fare = 10 pts)
 *
 * Cash conversion uses affiliate_points_conversion for the affiliate's country currency.
 * Falls back to adminSettings.moneyPerPoint if no country-specific record exists.
 */

declare const strapi: any;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AffiliateEventType =
  | 'onRideCompletion'
  | 'onRideBooking'
  | 'onDeliveryCompletion'
  | 'onDeliveryBooking'
  | 'onReferralSignup'
  | 'onFirstRideAsRider'
  | 'onFirstRideAsDriver'
  | 'onFirstDelivery';

interface AffiliatePointsParams {
  eventType: AffiliateEventType;
  /** The user who triggered the event — rider, sender, new registrant, etc. */
  triggeringUserId: number;
  /** Fare in platform currency — required for percentage rules */
  fare?: number;
  rideId?: number;
  deliveryId?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps eventType → affiliate_transaction.type enum value
 */
function eventTypeToTransactionType(eventType: AffiliateEventType): string {
  const map: Record<AffiliateEventType, string> = {
    onReferralSignup:     'referral_signup',
    onFirstRideAsRider:  'referral_first_ride_as_rider',
    onFirstRideAsDriver: 'referral_first_ride_as_driver',
    onRideCompletion:    'referral_first_ride_as_rider',
    onRideBooking:       'referral_first_ride_as_rider',
    onDeliveryCompletion:'referral_first_ride_as_rider',
    onDeliveryBooking:   'referral_first_ride_as_rider',
    onFirstDelivery:     'referral_first_ride_as_rider',
  };
  return map[eventType] ?? 'bonus';
}

/**
 * Converts a point amount to cash using the country-specific conversion table.
 * Falls back to adminSettings.moneyPerPoint (default 0.1) if no record found.
 */
async function convertPointsToCash(
  points: number,
  affiliateUserId: number,
): Promise<number> {
  try {
    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { id: affiliateUserId },
        populate: { country: { populate: { currency: true } } },
      });

    const currencyId = user?.country?.currency?.id;

    if (currencyId) {
      const conversion = await strapi.db
        .query('api::affiliate-points-conversion.affiliate-points-conversion')
        .findOne({
          where: { currency: currencyId },
          populate: ['currency'],
        });

      if (
        conversion?.affiliatePoints &&
        conversion?.currencyAmount &&
        conversion.affiliatePoints > 0
      ) {
        // e.g. 100 points = 10 ZMW  →  1 point = 0.1 ZMW
        return (points / conversion.affiliatePoints) * conversion.currencyAmount;
      }
    }
  } catch (err) {
    strapi.log.warn('[AffiliateService:convertPointsToCash] Lookup failed:', err);
  }

  // Fallback: admin global rate
  const settings = await strapi.db
    .query('api::admn-setting.admn-setting')
    .findOne({});
  const ratePerPoint = parseFloat(settings?.moneyPerPoint ?? 0.1);
  return points * ratePerPoint;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Award affiliate points whenever a platform event occurs.
 * Safe to call fire-and-forget (catches all errors internally).
 */
export async function processAffiliatePoints(
  params: AffiliatePointsParams,
): Promise<void> {
  const { eventType, triggeringUserId, fare, rideId, deliveryId } = params;

  try {
    // ── 1. Check global kill-switch ─────────────────────────────────────────
    const settings = await strapi.db
      .query('api::admn-setting.admn-setting')
      .findOne({});
    if (!settings?.affiliateSystemEnabled) return;

    // ── 2. Find triggering user and their affiliate (referredBy) ────────────
    const triggeringUser = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { id: triggeringUserId },
        populate: {
          referredBy: {
            populate: { affiliateProfile: true },
          },
        },
      });

    const affiliate = triggeringUser?.referredBy;
    if (!affiliate?.id) return; // user was not referred

    const ap = affiliate.affiliateProfile;
    if (!ap) return;
    if (ap.blocked) {
      strapi.log.info(
        `[AffiliateService] Skipping blocked affiliate ${affiliate.id}`,
      );
      return;
    }

    // ── 3. Fetch active point rules for this event ───────────────────────────
    const rules = await strapi.db
      .query('api::affiliate-points-type.affiliate-points-type')
      .findMany({ where: { eventType, isEnabled: true } });

    if (!rules.length) return;

    // ── 4. Calculate total points across all matching rules ──────────────────
    let totalPoints = 0;
    for (const rule of rules) {
      if (rule.rewardType === 'flat') {
        totalPoints += Number(rule.value);
      } else if (rule.rewardType === 'percentage' && fare && fare > 0) {
        totalPoints += Math.round((fare * Number(rule.value)) / 100);
      }
    }

    if (totalPoints <= 0) return;

    // ── 5. Convert points → cash value ───────────────────────────────────────
    const cashValue = await convertPointsToCash(totalPoints, affiliate.id);

    // ── 6. Update affiliate component on user record ─────────────────────────
    const newTotalPoints       = (ap.totalPoints       || 0) + totalPoints;
    const newPointsBalance     = (ap.pointsBalance     || 0) + totalPoints;
    const newTotalEarnings     = (ap.totalEarnings     || 0) + cashValue;
    const newWithdrawable      = (ap.withdrawableBalance || 0) + cashValue;

    // For referral count tracking
    const isReferralEvent = [
      'onReferralSignup',
      'onFirstRideAsRider',
      'onFirstRideAsDriver',
      'onFirstDelivery',
    ].includes(eventType);

    const newTotalReferrals  = isReferralEvent
      ? (ap.totalReferrals  || 0) + 1
      : (ap.totalReferrals  || 0);
    const newActiveReferrals = isReferralEvent
      ? (ap.activeReferrals || 0) + 1
      : (ap.activeReferrals || 0);

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: affiliate.id },
      data: {
        affiliateProfile: {
          id: ap.id, // keep the existing component row
          totalPoints:        newTotalPoints,
          pointsBalance:      newPointsBalance,
          totalEarnings:      newTotalEarnings,
          withdrawableBalance: newWithdrawable,
          totalReferrals:     newTotalReferrals,
          activeReferrals:    newActiveReferrals,
        },
      },
    });

    // ── 7. Create transaction log entry ──────────────────────────────────────
    await strapi.db
      .query('api::affiliate-transaction.affiliate-transaction')
      .create({
        data: {
          transactionId: `AT-${eventType.toUpperCase()}-${Date.now()}`,
          affiliate:    affiliate.id,
          referredUser: triggeringUserId,
          type:         eventTypeToTransactionType(eventType),
          points:       totalPoints,
          amount:       cashValue,
          affiliate_transaction_status: 'completed',
          ride:        rideId     ?? null,
          description: `${totalPoints} pts earned — ${eventType}`,
          processedAt: new Date(),
        },
      });

    strapi.log.info(
      `[AffiliateService] +${totalPoints} pts (${cashValue} cash) → affiliate ${affiliate.id} | event: ${eventType}`,
    );
  } catch (err) {
    // Never let this crash the parent call
    strapi.log.error('[AffiliateService] processAffiliatePoints failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: get conversion rate for a user's country (used by frontend endpoint)
// ─────────────────────────────────────────────────────────────────────────────

export async function getConversionRateForUser(userId: number): Promise<{
  affiliatePoints: number;
  currencyAmount: number;
  currencyCode: string;
  currencySymbol: string;
  ratePerPoint: number;
}> {
  const settings = await strapi.db
    .query('api::admn-setting.admn-setting')
    .findOne({});

  const defaultRate = parseFloat(settings?.moneyPerPoint ?? 0.1);

  const user = await strapi.db
    .query('plugin::users-permissions.user')
    .findOne({
      where: { id: userId },
      populate: { country: { populate: { currency: true } } },
    });

  const currency = user?.country?.currency;
  const currencyId = currency?.id;
  const currencyCode   = currency?.code   ?? 'ZMW';
  const currencySymbol = currency?.symbol ?? 'K';

  if (currencyId) {
    const conv = await strapi.db
      .query('api::affiliate-points-conversion.affiliate-points-conversion')
      .findOne({
        where: { currency: currencyId },
        populate: ['currency'],
      });

    if (conv?.affiliatePoints && conv?.currencyAmount && conv.affiliatePoints > 0) {
      return {
        affiliatePoints: conv.affiliatePoints,
        currencyAmount:  conv.currencyAmount,
        currencyCode,
        currencySymbol,
        ratePerPoint: conv.currencyAmount / conv.affiliatePoints,
      };
    }
  }

  return {
    affiliatePoints: 1,
    currencyAmount:  defaultRate,
    currencyCode,
    currencySymbol,
    ratePerPoint: defaultRate,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// IP Signature (fingerprint hash) — used by frontend for impression tracking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate the same deterministic hash the frontend sends.
 * On the backend we just store what the frontend sends.
 * This is the Node equivalent shown here for reference only.
 */
// export function buildIpSignature(parts: {
//   ip: string;
//   userAgent: string;
// }): string {
//   const crypto = require('crypto');
//   return crypto
//     .createHash('sha256')
//     .update(`${parts.ip}|${parts.userAgent}`)
//     .digest('hex');
// }
export function buildIpSignature(parts: { ip: string }): string {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(parts.ip)
    .digest('hex');
}

/**
 * Match an incoming login/register IP signature against stored impressions
 * and link the new user to the affiliate if found.
 * Call this after a user successfully registers or logs in for the first time.
 */
export async function matchImpressionToUser(
  userId: number,
  ipSignatureHash: string,
): Promise<void> {
  try {
    const settings = await strapi.db
      .query('api::admn-setting.admn-setting')
      .findOne({});
    if (!settings?.affiliateSystemEnabled) return;

    // Already has a referredBy? Skip.
    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { id: userId }, select: ['id'], populate: { referredBy: true } });
    if (user?.referredBy?.id) return;

    // Find an unconverted impression within the last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const impression = await strapi.db
      .query('api::affiliate-impression.affiliate-impression')
      .findOne({
        where: {
          ipSignatureHash,
          converted: false,
          createdAt: { $gte: since },
        },
        populate: { affiliateOwner: true },
      });

    if (!impression?.affiliateOwner?.id) return;

    // Link user → affiliate
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { referredBy: impression.affiliateOwner.id },
    });

    // Mark impression as converted
    await strapi.db
      .query('api::affiliate-impression.affiliate-impression')
      .update({
        where: { id: impression.id },
        data: { converted: true, convertedUser: userId },
      });

    // Fire referral-signup points
    await processAffiliatePoints({
      eventType: 'onReferralSignup',
      triggeringUserId: userId,
    });

    strapi.log.info(
      `[AffiliateService] Impression matched: user ${userId} → affiliate ${impression.affiliateOwner.id}`,
    );
  } catch (err) {
    strapi.log.error('[AffiliateService] matchImpressionToUser failed:', err);
  }
}