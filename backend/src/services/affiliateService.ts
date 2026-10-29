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
import {
  processAffiliatePointsAllocation,
} from './affiliatePointsAllocationService';
import { resolveSettingsForCountry } from './settingsResolver';

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
  affiliateOwnerId?: number;
  affiliatePromotionId?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
  await processAffiliatePointsAllocation(params);
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
  const user = await strapi.db
    .query('plugin::users-permissions.user')
    .findOne({
      where: { id: userId },
      populate: { country: { populate: { currency: true } } },
    });

  const settings = await resolveSettingsForCountry(strapi, user?.country?.id);
  const conversion = user?.country?.id
    ? await strapi.db
      .query('api::affiliate-points-conversion.affiliate-points-conversion')
      .findOne({
        where: { country: user.country.id, publishedAt: { $notNull: true } },
        populate: { currency: true },
      })
    : null;

  const countryCurrency = user?.country?.currency;
  const currency = conversion?.currency ?? countryCurrency ?? settings.defaultCurrency;
  const currencyCode = currency?.code ?? currency?.currCode ?? 'ZMW';
  const currencySymbol = currency?.symbol ?? 'K';

  if (conversion?.affiliatePoints && conversion?.currencyAmount && conversion.affiliatePoints > 0) {
    return {
      affiliatePoints: conversion.affiliatePoints,
      currencyAmount: conversion.currencyAmount,
      currencyCode,
      currencySymbol,
      ratePerPoint: Number(conversion.currencyAmount) / Number(conversion.affiliatePoints),
    };
  }

  const defaultRate = Number(settings.moneyPerPoint) || 0.1;
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
    // Already has a referredBy? Skip.
    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { id: userId },
        select: ['id'],
        populate: { referredBy: true, country: true },
      });
    const settings = await resolveSettingsForCountry(strapi, user?.country?.id);
    if (settings.affiliateSystemEnabled !== true) return;
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