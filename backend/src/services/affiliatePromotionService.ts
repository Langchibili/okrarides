/**
 * Affiliate Promotion Service
 * PATH: src/services/affiliatePromotionService.ts
 *
 * Responsibilities:
 *  1. createDefaultPromotion         — called once per new user at registration
 *  2. applyImmediatePromotions       — float-topup / wallet-credit at sign-up
 *  3. recordAffiliateCodeEntry       — writes into riderProfile.affiliateCodes JSON
 *  4. checkAndApplyRideDiscount      — called inside ride.create
 *  5. checkAndApplyDeliveryDiscount  — called inside delivery.create
 *  6. recordPromotionUsage           — increments timesUsed after redemption
 *  7. applyCodeManually              — POST /affiliate/apply-code endpoint handler
 *  8. getPromotionsForAffiliate      — returns active promotions for a given affiliate user
 */

declare const strapi: any;

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
  percentageAmount: number;
  usageLimit: number;
  isActive: boolean;
  expiresAt?: string | null;
  affiliateOwner: { id: number } | number;
  isDefault?: boolean;
}

interface PromotionUsageEntry {
  action: string;
  limit: number;
  timesUsed: number;
  lastUsedAt: string | null;
}

interface AffiliateCodeEntry {
  affiliateOwnerId: number;
  addedAt: string;
  source: 'registration' | 'manual';
  promotionUsages: Record<string, PromotionUsageEntry>;
}

interface AffiliateCodesMap {
  [affiliateCode: string]: AffiliateCodeEntry;
}

interface DiscountResult {
  discountedFare: number;
  discountAmount: number;
  appliedCode: string | null;
  promotionId: number | null;
  promotionDescription: string | null;
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

async function getRiderProfileId(userId: number): Promise<{ id: number; affiliateCodes: AffiliateCodesMap } | null> {
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: { riderProfile: { select: ['id', 'affiliateCodes'] } },
  });
  return user?.riderProfile ?? null;
}

async function getDriverProfileId(userId: number): Promise<{ id: number; floatBalance: number; withdrawableFloatBalance: number } | null> {
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: { driverProfile: { select: ['id', 'floatBalance', 'withdrawableFloatBalance'] } },
  });
  return user?.driverProfile ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Create default promotion for every new affiliate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called inside initializeUserProfiles() after the user record is set up.
 * Creates one default "Welcome Float Bonus" promotion owned by the new user
 * so that anyone who registers via their affiliate link gets 100 free float.
 */
export async function createDefaultPromotion(userId: number): Promise<void> {
  try {
    await strapi.db.query('api::affiliate-promotion.affiliate-promotion').create({
      data: {
        name: 'Welcome Float Bonus',
        description: 'Get K100 free float when you register as a driver using this affiliate link',
        action: 'float-topup',
        for: 'driver',
        amount: 100,
        percentageAmount: 0,
        usageLimit: 1,
        isActive: true,
        expiresAt: null,
        affiliateOwner: userId,
        isDefault: true,
      },
    });
    strapi.log?.info(`[AffiliatePromo] Default promotion created for user ${userId}`);
  } catch (err) {
    strapi.log?.error?.(`[AffiliatePromo] createDefaultPromotion failed for ${userId}:`, err) ||
      console.error('[AffiliatePromo] createDefaultPromotion failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get active, non-expired promotions for an affiliate owner
// ─────────────────────────────────────────────────────────────────────────────

export async function getPromotionsForAffiliate(affiliateOwnerId: number): Promise<AffiliatePromotion[]> {
  const promos: AffiliatePromotion[] = await strapi.db
    .query('api::affiliate-promotion.affiliate-promotion')
    .findMany({
      where: { affiliateOwner: affiliateOwnerId, isActive: true },
    });
  return promos.filter((p) => !isPromotionExpired(p));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Record affiliate code entry in riderProfile.affiliateCodes
// ─────────────────────────────────────────────────────────────────────────────

export async function recordAffiliateCodeEntry(
  userId: number,
  affiliateCode: string,
  affiliateOwnerId: number,
  promotions: AffiliatePromotion[],
  source: 'registration' | 'manual' = 'registration',
): Promise<void> {
  try {
    const riderProfile = await getRiderProfileId(userId);
    if (!riderProfile) return;

    const existing: AffiliateCodesMap = riderProfile.affiliateCodes ?? {};

    // Don't overwrite if already present
    if (existing[affiliateCode]) return;

    const usages: Record<string, PromotionUsageEntry> = {};
    for (const p of promotions) {
      usages[String(p.id)] = {
        action: p.action,
        limit: p.usageLimit,
        timesUsed: 0,
        lastUsedAt: null,
      };
    }

    const updated: AffiliateCodesMap = {
      ...existing,
      [affiliateCode]: {
        affiliateOwnerId,
        addedAt: new Date().toISOString(),
        source,
        promotionUsages: usages,
      },
    };

    await strapi.db.query('rider-profiles.rider-profile').update({
      where: { id: riderProfile.id },
      data: { affiliateCodes: updated },
    });

    strapi.log?.info(`[AffiliatePromo] Code ${affiliateCode} recorded for user ${userId}`);
  } catch (err) {
    console.error('[AffiliatePromo] recordAffiliateCodeEntry failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Increment timesUsed for a specific promotion inside affiliateCodes
// ─────────────────────────────────────────────────────────────────────────────

export async function recordPromotionUsage(
  userId: number,
  affiliateCode: string,
  promotionId: number,
): Promise<void> {
  try {
    const riderProfile = await getRiderProfileId(userId);
    if (!riderProfile) return;

    const codes: AffiliateCodesMap = riderProfile.affiliateCodes ?? {};
    const entry = codes[affiliateCode];
    if (!entry) return;

    const key = String(promotionId);
    const usage = entry.promotionUsages[key];
    if (!usage) return;

    usage.timesUsed += 1;
    usage.lastUsedAt = new Date().toISOString();

    await strapi.db.query('rider-profiles.rider-profile').update({
      where: { id: riderProfile.id },
      data: { affiliateCodes: codes },
    });
  } catch (err) {
    console.error('[AffiliatePromo] recordPromotionUsage failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Apply immediate promotions at registration (float-topup, wallet-credit)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called right after a new user registers via an affiliate link.
 * Applies one-time instant promotions (float-topup / wallet-credit).
 * Discount promotions (ride-discount / delivery-discount) are handled at
 * booking time — they are just recorded here, not applied yet.
 */
export async function applyImmediatePromotions(
  userId: number,
  affiliateCode: string,
  affiliateOwnerId: number,
): Promise<void> {
  try {
    const promotions = await getPromotionsForAffiliate(affiliateOwnerId);
    if (!promotions.length) return;

    // ── Record all promotions in affiliateCodes first ─────────────────────
    await recordAffiliateCodeEntry(userId, affiliateCode, affiliateOwnerId, promotions, 'registration');

    for (const promo of promotions) {
      // ── float-topup ─────────────────────────────────────────────────────
      if (
        promo.action === 'float-topup' &&
        appliesToUserType(promo, 'driver') &&
        promo.amount > 0
      ) {
        const dp = await getDriverProfileId(userId);
        if (dp) {
          const currentFloat      = parseFloat(String(dp.floatBalance ?? 0));
          const currentWithdrawable = parseFloat(String(dp.withdrawableFloatBalance ?? 0));
          await strapi.db.query('driver-profiles.driver-profile').update({
            where: { id: dp.id },
            data: {
              floatBalance:             currentFloat + promo.amount,
              withdrawableFloatBalance: currentWithdrawable + promo.amount,
            },
          });
          await recordPromotionUsage(userId, affiliateCode, promo.id);
          strapi.log?.info(
            `[AffiliatePromo] float-topup +${promo.amount} applied to driver ${userId}`,
          );
        }
      }

      // ── wallet-credit ────────────────────────────────────────────────────
      if (
        promo.action === 'wallet-credit' &&
        appliesToUserType(promo, 'rider') &&
        promo.amount > 0
      ) {
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: userId },
          populate: { riderProfile: { select: ['id', 'walletBalance'] } },
        });
        const rp = user?.riderProfile;
        if (rp) {
          const currentWallet = parseFloat(String(rp.walletBalance ?? 0));
          await strapi.db.query('rider-profiles.rider-profile').update({
            where: { id: rp.id },
            data: { walletBalance: currentWallet + promo.amount },
          });
          await recordPromotionUsage(userId, affiliateCode, promo.id);
          strapi.log?.info(
            `[AffiliatePromo] wallet-credit +${promo.amount} applied to rider ${userId}`,
          );
        }
      }

      // ride-discount / delivery-discount: recorded in affiliateCodes, used at booking
    }
  } catch (err) {
    console.error('[AffiliatePromo] applyImmediatePromotions failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Check and apply booking discount (shared logic for ride + delivery)
// ─────────────────────────────────────────────────────────────────────────────

async function checkAndApplyBookingDiscount(
  userId: number,
  fare: number,
  actionType: 'ride-discount' | 'delivery-discount',
): Promise<DiscountResult> {
  const noDiscount: DiscountResult = {
    discountedFare: fare,
    discountAmount: 0,
    appliedCode: null,
    promotionId: null,
    promotionDescription: null,
  };

  try {
    const riderProfile = await getRiderProfileId(userId);
    if (!riderProfile) return noDiscount;

    const codes: AffiliateCodesMap = riderProfile.affiliateCodes ?? {};
    const codeKeys = Object.keys(codes);
    if (!codeKeys.length) return noDiscount;

    for (const code of codeKeys) {
      const entry = codes[code];
      const usages = entry.promotionUsages ?? {};

      for (const [promoIdStr, usage] of Object.entries(usages)) {
        if (usage.action !== actionType) continue;
        if (usage.timesUsed >= usage.limit) continue; // exhausted

        const promoId = parseInt(promoIdStr, 10);

        // Re-verify the promotion is still active in DB
        const promo: AffiliatePromotion | null = await strapi.db
          .query('api::affiliate-promotion.affiliate-promotion')
          .findOne({ where: { id: promoId, isActive: true } });

        if (!promo || isPromotionExpired(promo)) continue;
        if (!appliesToUserType(promo, 'rider')) continue;

        const pct = parseFloat(String(promo.percentageAmount ?? 0));
        if (pct <= 0) continue;

        const discountAmount = parseFloat(((fare * pct) / 100).toFixed(2));
        const discountedFare = Math.max(0, fare - discountAmount);

        return {
          discountedFare,
          discountAmount,
          appliedCode: code,
          promotionId: promoId,
          promotionDescription: promo.description ?? `${pct}% discount applied`,
        };
      }
    }
  } catch (err) {
    console.error('[AffiliatePromo] checkAndApplyBookingDiscount failed:', err);
  }

  return noDiscount;
}

export async function checkAndApplyRideDiscount(
  userId: number,
  rideFare: number,
): Promise<DiscountResult> {
  return checkAndApplyBookingDiscount(userId, rideFare, 'ride-discount');
}

export async function checkAndApplyDeliveryDiscount(
  userId: number,
  deliveryFare: number,
): Promise<DiscountResult> {
  return checkAndApplyBookingDiscount(userId, deliveryFare, 'delivery-discount');
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
    // Check affiliate system is enabled
    const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});
    if (!settings?.affiliateSystemEnabled) {
      return { success: false, message: 'Affiliate system is not enabled', promotionsApplied: 0 };
    }

    // Resolve affiliate owner from the code
    const affiliateUser = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { affiliateProfile: { affiliateCode } },
        select: ['id'],
      });
    if (!affiliateUser) {
      return { success: false, message: 'Affiliate code not found', promotionsApplied: 0 };
    }
    if (affiliateUser.id === userId) {
      return { success: false, message: 'You cannot use your own affiliate code', promotionsApplied: 0 };
    }

    // Check if code is already in the user's affiliateCodes
    const riderProfile = await getRiderProfileId(userId);
    const existingCodes: AffiliateCodesMap = riderProfile?.affiliateCodes ?? {};
    if (existingCodes[affiliateCode]) {
      return { success: false, message: 'You have already applied this code', promotionsApplied: 0 };
    }

    const promotions = await getPromotionsForAffiliate(affiliateUser.id);
    if (!promotions.length) {
      return { success: false, message: 'No active promotions on this code', promotionsApplied: 0 };
    }

    // Record and apply
    await applyImmediatePromotions(userId, affiliateCode, affiliateUser.id);

    // Also set referredBy if not already set
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      select: ['id'],
      populate: { referredBy: true },
    });
    if (!user?.referredBy?.id) {
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: { referredBy: affiliateUser.id },
      });
    }

    return {
      success: true,
      message: 'Affiliate code applied successfully',
      promotionsApplied: promotions.length,
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
  return strapi.db.query('api::affiliate-promotion.affiliate-promotion').findMany({
    where: { affiliateOwner: userId },
    orderBy: { createdAt: 'desc' },
  });
}