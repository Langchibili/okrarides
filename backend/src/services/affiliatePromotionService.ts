/**
 * Affiliate Promotion Service
 * PATH: src/services/affiliatePromotionService.ts
 *
 * Admins create promotions. Affiliates create coupons linked to those promotions.
 * Referral attribution and points allocation are handled separately.
 */

declare const strapi: any;
import { processAffiliatePoints } from './affiliateService';
import { resolveSettingsForCountry } from './settingsResolver';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AffiliatePromotion {
  id: number;
  name: string;
  description?: string;
  action: 'float-topup' | 'ride-discount' | 'delivery-discount' | 'wallet-credit';
  for: 'rider' | 'driver' | 'all';
  amount: number;
  amountType?: 'flatrate' | 'percentage';
  usageLimit: number;
  isActive: boolean;
  expiresAt?: string | null;
  publishedAt?: string | null;
}

interface DiscountResult {
  discountedFare: number;
  discountAmount: number;
  appliedCode: string | null;
  promotionId: number | null;
  promotionDescription: string | null;
  couponId: number | null;
  couponCode: string | null;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isPromotionExpired(promo: AffiliatePromotion): boolean {
  if (!promo.expiresAt) return false;
  return new Date() > new Date(promo.expiresAt);
}

function appliesToUserType(promo: AffiliatePromotion, userType: 'rider' | 'driver'): boolean {
  return promo.for === 'all' || promo.for === userType;
}

export async function getPromotionsForAffiliate(affiliateOwnerId: number): Promise<AffiliatePromotion[]> {
  const promos: AffiliatePromotion[] = await strapi.db
    .query('api::affiliate-promotion.affiliate-promotion')
    .findMany({
      where: { isActive: true, publishedAt: { $notNull: true } },
      populate: { countries: true },
    });
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: affiliateOwnerId },
    populate: { country: true },
  });
  if (!user?.country?.isActive) return [];
  return promos.filter((promo) => (
    !isPromotionExpired(promo)
    && (!Array.isArray((promo as any).countries) || !(promo as any).countries.length
      || (promo as any).countries.some((country: any) => country.id === user.country.id && country.isActive))
  ));
}

async function checkAndApplyBookingDiscount(
  userId: number,
  fare: number,
  actionType: 'ride-discount' | 'delivery-discount',
  couponCode?: string,
): Promise<DiscountResult> {
  const noDiscount: DiscountResult = {
    discountedFare: fare,
    discountAmount: 0,
    appliedCode: null,
    promotionId: null,
    promotionDescription: null,
    couponId: null,
    couponCode: null,
  };

  if (!couponCode?.trim()) return noDiscount;

  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: { country: true },
    });
    if (!user?.country?.isActive) {
      return { ...noDiscount, error: 'Your country is not active for affiliate coupons.' };
    }
    const settings = await resolveSettingsForCountry(strapi, user.country.id);
    if (settings.affiliateSystemEnabled !== true) {
      return { ...noDiscount, error: 'Affiliate coupons are not enabled in your country.' };
    }

    const coupon = await strapi.db.query('api::affiliate-coupon.affiliate-coupon').findOne({
      where: { code: couponCode.trim().toUpperCase(), isActive: true },
      populate: { promotion: { populate: { countries: true } }, affiliateOwner: true },
    });
    if (!coupon || new Date(coupon.expiresAt) <= new Date()) {
      return { ...noDiscount, error: 'Coupon code is invalid or expired.' };
    }
    const promo = coupon.promotion as AffiliatePromotion & { countries?: any[] };
    if (!promo?.isActive || !promo.publishedAt || isPromotionExpired(promo) || promo.action !== actionType) {
      return { ...noDiscount, error: 'Coupon is not valid for this booking.' };
    }
    if (!appliesToUserType(promo, 'rider')) {
      return { ...noDiscount, error: 'This promotion is not available to riders.' };
    }
    if (promo.countries?.length
      && !promo.countries.some((country) => country.id === user.country.id && country.isActive)) {
      return { ...noDiscount, error: 'Coupon is not available in your country.' };
    }

    const usedByUser = await strapi.db.query('api::affiliate-coupon-usage.affiliate-coupon-usage').count({
      where: { coupon: coupon.id, user: userId },
    });
    const perUserLimit = Math.max(1, Number(coupon.usageLimit ?? promo.usageLimit) || 1);
    if (usedByUser >= perUserLimit) {
      return { ...noDiscount, error: 'You have already reached this coupon’s usage limit.' };
    }

    const value = Number(promo.amount);
    if (!Number.isFinite(value) || value <= 0) {
      return { ...noDiscount, error: 'This promotion does not provide a valid discount.' };
    }
    const amount = promo.amountType === 'percentage' ? (fare * value) / 100 : value;
    const discountAmount = Number(Math.min(fare, amount).toFixed(2));
    return {
      discountedFare: Math.max(0, fare - discountAmount),
      discountAmount,
      appliedCode: coupon.code,
      promotionId: Number(promo.id),
      promotionDescription: promo.description ?? `${promo.amountType === 'percentage' ? `${value}%` : value} discount applied`,
      couponId: Number(coupon.id),
      couponCode: coupon.code,
    };
  } catch (err) {
    console.error('[AffiliatePromo] checkAndApplyBookingDiscount failed:', err);
    return { ...noDiscount, error: 'Could not validate the coupon. Please try again.' };
  }

}

export async function checkAndApplyRideDiscount(
  userId: number,
  rideFare: number,
  couponCode?: string,
): Promise<DiscountResult> {
  return checkAndApplyBookingDiscount(userId, rideFare, 'ride-discount', couponCode);
}

export async function checkAndApplyDeliveryDiscount(
  userId: number,
  deliveryFare: number,
  couponCode?: string,
): Promise<DiscountResult> {
  return checkAndApplyBookingDiscount(userId, deliveryFare, 'delivery-discount', couponCode);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. POST /affiliate/apply-code — manual code entry after registration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A user who missed the referral link can enter an affiliate code manually.
 * Returns { success, message, promotionsApplied }.
 */
export async function applyCodeManually(
  userId: number,
  affiliateCode: string,
): Promise<{ success: boolean; message: string; promotionsApplied: number }> {
  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: { referredBy: true, country: true },
    });
    if (!user) return { success: false, message: 'User not found', promotionsApplied: 0 };
    const settings = await resolveSettingsForCountry(strapi, user.country?.id);
    if (settings.affiliateSystemEnabled !== true) {
      return { success: false, message: 'Affiliate system is not enabled', promotionsApplied: 0 };
    }
    if (user.referredBy?.id) {
      return { success: false, message: 'A referral code has already been applied', promotionsApplied: 0 };
    }

    const affiliateUser = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { affiliateProfile: { affiliateCode: affiliateCode.trim().toUpperCase() } },
        select: ['id'],
      });
    if (!affiliateUser) {
      return { success: false, message: 'Affiliate code not found', promotionsApplied: 0 };
    }
    if (affiliateUser.id === userId) {
      return { success: false, message: 'You cannot use your own affiliate code', promotionsApplied: 0 };
    }

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { referredBy: affiliateUser.id },
    });
    await processAffiliatePoints({
      eventType: 'onReferralSignup',
      triggeringUserId: userId,
    });

    return {
      success: true,
      message: 'Referral code applied successfully',
      promotionsApplied: 0,
    };
  } catch (err: any) {
    console.error('[AffiliatePromo] applyCodeManually failed:', err);
    return { success: false, message: err?.message ?? 'Failed to apply code', promotionsApplied: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Get all promotions for a user's own affiliate profile (for dashboard display)
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyPromotions(userId: number): Promise<AffiliatePromotion[]> {
  return getPromotionsForAffiliate(userId);
}

export async function getMyCoupons(userId: number): Promise<any[]> {
  return strapi.db.query('api::affiliate-coupon.affiliate-coupon').findMany({
    where: { affiliateOwner: userId },
    populate: { promotion: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createAffiliateCoupon(
  userId: number,
  input: { name: string; promotionId: number; code?: string },
): Promise<any> {
  const name = String(input.name ?? '').trim();
  if (!name) throw new Error('Coupon name is required');
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: { country: true, affiliateProfile: true },
  });
  if (!user?.country?.isActive) throw new Error('Your country is not active');
  if (!user.affiliateProfile) throw new Error('Affiliate profile not found');

  const settings = await resolveSettingsForCountry(strapi, user.country.id);
  if (settings.affiliateSystemEnabled !== true) throw new Error('Affiliate system is not enabled');

  const promotion = await strapi.db.query('api::affiliate-promotion.affiliate-promotion').findOne({
    where: { id: input.promotionId, isActive: true, publishedAt: { $notNull: true } },
    populate: { countries: true },
  });
  if (!promotion || isPromotionExpired(promotion)) throw new Error('Promotion is not available');
  if (promotion.countries?.length
    && !promotion.countries.some((country: any) => country.id === user.country.id && country.isActive)) {
    throw new Error('Promotion is not available in your country');
  }

  const codeBase = String(input.code || name)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  if (codeBase.length < 3) throw new Error('Coupon code must contain at least 3 letters or numbers');
  let code = codeBase;
  const existing = await strapi.db.query('api::affiliate-coupon.affiliate-coupon').findOne({
    where: { code },
    select: ['id'],
  });
  if (existing && input.code) throw new Error('That coupon code is already in use');
  if (existing) {
    code = `${codeBase.slice(0, 26)}-${userId}-${Date.now().toString(36).slice(-4)}`;
  }

  const expiryDays = Math.max(1, Number(settings.affiliateCouponExpiryDays) || 30);
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  return strapi.db.query('api::affiliate-coupon.affiliate-coupon').create({
    data: {
      name,
      code,
      isActive: true,
      expiresAt,
      usageLimit: Math.max(1, Number(promotion.usageLimit) || 1),
      uses: 0,
      affiliateOwner: userId,
      promotion: promotion.id,
    },
    populate: { promotion: true },
  });
}

export async function recordCouponUsage(
  userId: number,
  couponCode: string,
  reference: string,
  rideId?: number,
  deliveryId?: number,
): Promise<void> {
  const code = String(couponCode ?? '').toUpperCase();
  if (!code || !reference) return;
  const coupon = await strapi.db.query('api::affiliate-coupon.affiliate-coupon').findOne({
    where: { code },
    select: ['id', 'uses'],
  });
  if (!coupon) throw new Error(`Coupon ${code} was not found while recording usage`);
  const usageReference = `COUPON-${coupon.id}-${reference}`;
  const existing = await strapi.db.query('api::affiliate-coupon-usage.affiliate-coupon-usage').findOne({
    where: { reference: usageReference },
    select: ['id'],
  });
  if (existing) return;

  await strapi.db.query('api::affiliate-coupon-usage.affiliate-coupon-usage').create({
    data: {
      reference: usageReference,
      coupon: coupon.id,
      user: userId,
      ride: rideId ?? null,
      delivery: deliveryId ?? null,
    },
  });
  await strapi.db.query('api::affiliate-coupon.affiliate-coupon').update({
    where: { id: coupon.id },
    data: { uses: Number(coupon.uses || 0) + 1 },
  });
}