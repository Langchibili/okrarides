// import { factories } from '@strapi/strapi';

// export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
//   async getByCode(ctx) {
//     const { code } = ctx.params;

//     if (!code) {
//       return ctx.badRequest('Affiliate code is required');
//     }

//     try {
//       // Find the user where the nested component attribute matches
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: {
//           affiliateProfile: {
//             affiliateCode: code,
//           },
//         },
//         // Populate the specific component and the QR code media
//         populate: {
//           affiliateProfile: {
//             populate: ['qrCode']
//           }
//         },
//         // Select only the public info you want to expose
//         select: ['id', 'username', 'firstName', 'lastName'],
//       });

//       if (!user) {
//         return ctx.notFound('Affiliate user not found');
//       }

//       // Return the user with their affiliate data
//       return ctx.send({
//         data: user
//       });
//     } catch (err) {
//       ctx.body = err;
//     }
//   },
// }));
/**
 * Affiliate Controller — FULL REPLACEMENT
 * PATH: src/api/affiliate/controllers/affiliate.ts
 *
 * Endpoints:
 *   GET  /affiliate/:code             → getByCode  (existing, unchanged)
 *   POST /affiliate/track-impression  → trackImpression  (new)
 *   GET  /affiliate/dashboard         → getDashboard     (new, auth required)
 *   GET  /affiliate/transactions      → getTransactions  (new, auth required)
 *   GET  /affiliate/conversion-rate   → getConversionRate (new, auth required)
 *   POST /affiliate/request-withdrawal → requestWithdrawal (new, auth required)
 */

import { factories } from '@strapi/strapi';
import { processAffiliatePoints, getConversionRateForUser, buildIpSignature } from '../../../services/affiliateService';
import { getPaymentGateway } from '../../../paymentGatewayAdapters/';
import { applyCodeManually } from '../../../services/affiliatePromotionService';
// Helper: normalise phone for payout
function normalisePhone(phone: string, phoneCode: string): string {
  const code = String(phoneCode).replace(/\D/g, '');
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith(code)) digits = digits.slice(code.length);
  digits = digits.replace(/^0+/, '');
  return `${code}${digits.slice(-9)}`;
}

function buildReference(contextId: string | number, purpose: string, phone: string): string {
  return `ref-id-${contextId}-purpose-${purpose}-${phone}-${Date.now()}`;
}

export default factories.createCoreController(
  'api::affiliate.affiliate',
  ({ strapi }) => ({

    // ─────────────────────────────────────────────────────────────────────────
    // GET /affiliate/:code  — existing, kept intact
    // ─────────────────────────────────────────────────────────────────────────
    async getByCode(ctx) {
      const { code } = ctx.params;
      if (!code) return ctx.badRequest('Affiliate code is required');

      try {
        const user = await strapi.db
          .query('plugin::users-permissions.user')
          .findOne({
            where: { affiliateProfile: { affiliateCode: code } },
            populate: { affiliateProfile: { populate: ['qrCode'] } },
            select: ['id', 'username', 'firstName', 'lastName'],
          });

        if (!user) return ctx.notFound('Affiliate user not found');
        return ctx.send({ data: user });
      } catch (err) {
        strapi.log.error('[Affiliate:getByCode]', err);
        return ctx.internalServerError('Failed to look up affiliate code');
      }
    },
     async applyCode(ctx) {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');
 
      const { affiliateCode } = ctx.request.body ?? {};
      if (!affiliateCode) return ctx.badRequest('affiliateCode is required');
 
      // Guard: user cannot apply their own code
      const self = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['id'],
        populate: { affiliateProfile: { select: ['affiliateCode'] } },
      });
      if (self?.affiliateProfile?.affiliateCode === affiliateCode) {
        return ctx.badRequest('You cannot apply your own affiliate code');
      }
 
      const result = await applyCodeManually(userId, affiliateCode);
 
      if (!result.success) return ctx.badRequest(result.message);
      return ctx.send({ success: true, message: result.message, promotionsApplied: result.promotionsApplied });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // POST /affiliate/track-impression  (no auth — guest visitor)
    // Body: { affiliateCode, userAgent? }
    // ─────────────────────────────────────────────────────────────────────────
    async trackImpression(ctx) {
      try {
        const settings = await strapi.db
          .query('api::admn-setting.admn-setting')
          .findOne({});
        if (!settings?.affiliateSystemEnabled) return ctx.send({ tracked: false });

        const { affiliateCode, userAgent = '' } = ctx.request.body ?? {};
        if (!affiliateCode) return ctx.badRequest('affiliateCode is required');

        const ip = ctx.request.ip ?? '';
        const hash = buildIpSignature({ ip, userAgent });

        // Resolve the affiliate user from the code
        const affiliateUser = await strapi.db
          .query('plugin::users-permissions.user')
          .findOne({
            where: { affiliateProfile: { affiliateCode } },
            select: ['id'],
          });

        if (!affiliateUser) return ctx.notFound('Affiliate code not found');

        // Upsert: don't double-log the same signature
        const existing = await strapi.db
          .query('api::affiliate-impression.affiliate-impression')
          .findOne({ where: { ipSignatureHash: hash, converted: false } });

        if (!existing) {
          await strapi.db
            .query('api::affiliate-impression.affiliate-impression')
            .create({
              data: {
                ipSignatureHash: hash,
                affiliateCode,
                affiliateOwner: affiliateUser.id,
                ipAddress: ip,
                userAgent,
                referrerUrl: ctx.request.headers['referer'] ?? '',
                converted: false,
              },
            });
        }

        return ctx.send({ tracked: true });
      } catch (err) {
        strapi.log.error('[Affiliate:trackImpression]', err);
        return ctx.internalServerError('Failed to track impression');
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // GET /affiliate/dashboard  (auth required)
    // Returns: profile, conversion rate, referral counts
    // ─────────────────────────────────────────────────────────────────────────
    async getDashboard(ctx) {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      try {
        const settings = await strapi.db
          .query('api::admn-setting.admn-setting')
          .findOne({});

        const user = await strapi.db
          .query('plugin::users-permissions.user')
          .findOne({
            where: { id: userId },
            populate: {
              affiliateProfile: { populate: ['qrCode'] },
              country: { populate: { currency: true } },
            },
            select: ['id', 'firstName', 'lastName', 'phoneNumber'],
          });

        const ap = user?.affiliateProfile;
        if (!ap) return ctx.notFound('Affiliate profile not found');

        const conversionRate = await getConversionRateForUser(userId);

        // Total referred users count
        const totalReferred = await strapi.db
          .query('plugin::users-permissions.user')
          .count({ where: { referredBy: userId } });

        // Recent 5 transactions
        const recentTransactions = await strapi.db
          .query('api::affiliate-transaction.affiliate-transaction')
          .findMany({
            where: { affiliate: userId },
            orderBy: { createdAt: 'desc' },
            limit: 5,
            populate: { referredUser: { select: ['id', 'firstName', 'lastName'] } },
          });

        return ctx.send({
          data: {
            affiliateSystemEnabled: settings?.affiliateSystemEnabled ?? false,
            profile: {
              affiliateCode:      ap.affiliateCode,
              qrCode:             ap.qrCode ?? null,
              totalPoints:        ap.totalPoints        ?? 0,
              pointsBalance:      ap.pointsBalance      ?? 0,
              totalEarnings:      ap.totalEarnings      ?? 0,
              pendingEarnings:    ap.pendingEarnings     ?? 0,
              withdrawableBalance:ap.withdrawableBalance ?? 0,
              totalReferrals:     ap.totalReferrals     ?? totalReferred,
              activeReferrals:    ap.activeReferrals    ?? 0,
              blocked:            ap.blocked            ?? false,
            },
            conversionRate,
            minimumPointsForRedemption: settings?.minimumPointsForRedemption ?? 100,
            minimumWithdrawAmount:      settings?.minimumWithdrawAmount ?? 10,
            user: {
              firstName: user.firstName,
              lastName:  user.lastName,
              country:   user.country,
            },
          },
        });
      } catch (err) {
        strapi.log.error('[Affiliate:getDashboard]', err);
        return ctx.internalServerError('Failed to load affiliate dashboard');
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // GET /affiliate/transactions?page=1&pageSize=20  (auth required)
    // ─────────────────────────────────────────────────────────────────────────
    async getTransactions(ctx) {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      try {
        const page     = parseInt(ctx.query.page as string) || 1;
        const pageSize = parseInt(ctx.query.pageSize as string) || 20;

        const [items, total] = await Promise.all([
          strapi.db
            .query('api::affiliate-transaction.affiliate-transaction')
            .findMany({
              where: { affiliate: userId },
              orderBy: { createdAt: 'desc' },
              limit: pageSize,
              offset: (page - 1) * pageSize,
              populate: {
                referredUser: { select: ['id', 'firstName', 'lastName'] },
                ride: { select: ['id', 'rideCode', 'totalFare'] },
              },
            }),
          strapi.db
            .query('api::affiliate-transaction.affiliate-transaction')
            .count({ where: { affiliate: userId } }),
        ]);

        return ctx.send({
          data: items,
          meta: {
            pagination: {
              page,
              pageSize,
              pageCount: Math.ceil(total / pageSize),
              total,
            },
          },
        });
      } catch (err) {
        strapi.log.error('[Affiliate:getTransactions]', err);
        return ctx.internalServerError('Failed to fetch transactions');
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // GET /affiliate/conversion-rate  (auth required)
    // ─────────────────────────────────────────────────────────────────────────
    async getConversionRate(ctx) {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      try {
        const rate = await getConversionRateForUser(userId);
        return ctx.send({ data: rate });
      } catch (err) {
        strapi.log.error('[Affiliate:getConversionRate]', err);
        return ctx.internalServerError('Failed to get conversion rate');
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // POST /affiliate/request-withdrawal  (auth required)
    // Body: { amount, method, phone?, operator?, accountNumber?, bankId?, accountName? }
    //
    // Flow:
    //  1. Validate affiliateProfile not blocked, balance sufficient
    //  2. Deduct withdrawableBalance optimistically
    //  3. Deduct equivalent points from pointsBalance
    //  4. Create affiliate_transaction (points_redemption)
    //  5. Create OkraPay payout record
    //  6. Call gateway
    //  7. Return reference for frontend polling
    //  8. On gateway error: rollback all changes
    // ─────────────────────────────────────────────────────────────────────────
    async requestWithdrawal(ctx) {
      let rollbackData: any = null;
      let withdrawalTxId: string | null = null;
      let okrapayId: string | null = null;

      try {
        const userId = ctx.state.user?.id;
        if (!userId) return ctx.unauthorized('Authentication required');

        const {
          amount,
          method = 'mobile_money',
          phone  = '',
          operator = '',
          accountNumber = '',
          bankId = '',
          accountName = '',
        } = ctx.request.body ?? {};

        if (!amount) return ctx.badRequest('amount is required');
        const numAmount = parseFloat(amount);

        // ── Load settings ─────────────────────────────────────────────────
        const settings = await strapi.db
          .query('api::admn-setting.admn-setting')
          .findOne({});
        if (!settings?.affiliateSystemEnabled) {
          return ctx.forbidden('Affiliate system is not enabled');
        }

        const minWithdraw = parseFloat(settings.minimumWithdrawAmount ?? 10);
        if (numAmount < minWithdraw) {
          return ctx.badRequest(`Minimum withdrawal is ${minWithdraw}`);
        }

        // ── Load user + affiliate profile ─────────────────────────────────
        const user = await strapi.db
          .query('plugin::users-permissions.user')
          .findOne({
            where: { id: userId },
            populate: {
              affiliateProfile: true,
              country: { populate: { currency: true } },
            },
          });

        const ap = user?.affiliateProfile;
        if (!ap) return ctx.notFound('Affiliate profile not found');
        if (ap.blocked) return ctx.forbidden('Affiliate account is blocked');

        const available = parseFloat(ap.withdrawableBalance ?? 0);
        if (available < numAmount) {
          return ctx.badRequest(`Insufficient balance. Available: ${available}`);
        }

        // ── Compute points being redeemed ─────────────────────────────────
        const convRate = await getConversionRateForUser(userId);
        const pointsRedeemed = Math.ceil(numAmount / convRate.ratePerPoint);

        const newWithdrawable   = available - numAmount;
        const newPointsBalance  = Math.max(0, (ap.pointsBalance ?? 0) - pointsRedeemed);

        // ── Optimistic deduction ──────────────────────────────────────────
        rollbackData = {
          apId: ap.id,
          oldWithdrawable:  ap.withdrawableBalance,
          oldPointsBalance: ap.pointsBalance,
        };

        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: userId },
          data: {
            affiliateProfile: {
              id: ap.id,
              withdrawableBalance: newWithdrawable,
              pointsBalance:       newPointsBalance,
              pendingEarnings:    (ap.pendingEarnings ?? 0) + numAmount,
            },
          },
        });

        // ── Phone / country context ───────────────────────────────────────
        const phoneCode   = String(user.country?.phoneCode ?? '260').replace(/\D/g, '');
        const currencyCode= user.country?.currency?.code ?? 'ZMW';
        const countryCode = (user.country?.code ?? 'zm').toLowerCase();
        const formattedPhone = phone ? normalisePhone(phone, phoneCode) : '';

        // ── Create affiliate_transaction (points_redemption) ──────────────
        const txRecord = await strapi.db
          .query('api::affiliate-transaction.affiliate-transaction')
          .create({
            data: {
              transactionId: `AT-REDEEM-${Date.now()}`,
              affiliate:  userId,
              type:       'points_redemption',
              points:     pointsRedeemed,
              amount:     numAmount,
              affiliate_transaction_status: 'pending',
              description: `Withdrawal of ${numAmount} ${currencyCode} (${pointsRedeemed} pts)`,
            },
          });
        withdrawalTxId = txRecord.id;

        // ── OkraPay payout ────────────────────────────────────────────────
        const gatewayName = String(settings.externalPaymentGateway ?? 'lencopay');
        const gateway     = getPaymentGateway(gatewayName) as any;
        const reference   = buildReference(userId, 'affiliatePayout', formattedPhone || accountNumber);
        const paymentId   = `OKRA-AFF-${Date.now()}`;

        const okrapayRecord = await strapi.db
          .query('api::okrapay.okrapay')
          .create({
            data: {
              paymentId,
              reference,
              user: userId,
              purpose:       'affiliatePayout',
              direction:     'payout',
              amount:        numAmount,
              paymentStatus: 'processing',
              gatewayName,
              relatedEntityType: 'withdrawal',
              relatedEntityId:   String(withdrawalTxId),
              initiatedAt:   new Date(),
              ipAddress:     ctx.request.ip,
              metadata: { affiliateTransactionId: withdrawalTxId, pointsRedeemed },
            },
          });
        okrapayId = okrapayRecord.id;

        // ── Call gateway ──────────────────────────────────────────────────
        const result = await gateway.initiatePayout({
          reference,
          amount:        numAmount,
          currency:      currencyCode,
          narration:     `Affiliate withdrawal — OkraRides`,
          method,
          phone:         formattedPhone || undefined,
          operator:      operator ? operator.toLowerCase() : undefined,
          country:       countryCode,
          accountNumber: accountNumber || undefined,
          accountName:   accountName   || undefined,
          bankId:        bankId        || undefined,
        });

        // Store gateway reference
        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: { gatewayReference: result.gatewayReference },
        });

        strapi.log.info(
          `[Affiliate:requestWithdrawal] Payout initiated for user ${userId}, amount ${numAmount}`,
        );

        return ctx.send({
          success: true,
          data: {
            reference,
            status: 'processing',
            amount: numAmount,
            pointsRedeemed,
            message: 'Withdrawal initiated. Funds will arrive shortly.',
          },
        });
      } catch (err: any) {
        strapi.log.error('[Affiliate:requestWithdrawal]', err);

        // ── Rollback deduction ────────────────────────────────────────────
        if (rollbackData) {
          try {
            await strapi.db.query('plugin::users-permissions.user').update({
              where: { id: ctx.state.user?.id },
              data: {
                affiliateProfile: {
                  id: rollbackData.apId,
                  withdrawableBalance: rollbackData.oldWithdrawable,
                  pointsBalance:       rollbackData.oldPointsBalance,
                  pendingEarnings:     0,
                },
              },
            });
          } catch (rbErr) {
            strapi.log.error('[Affiliate:requestWithdrawal] Rollback failed:', rbErr);
          }
        }

        // ── Mark tx as failed ─────────────────────────────────────────────
        if (withdrawalTxId) {
          try {
            await strapi.db
              .query('api::affiliate-transaction.affiliate-transaction')
              .update({
                where: { id: withdrawalTxId },
                data: { affiliate_transaction_status: 'failed' },
              });
          } catch { /* non-fatal */ }
        }

        if (okrapayId) {
          try {
            await strapi.db.query('api::okrapay.okrapay').update({
              where: { id: okrapayId },
              data: { paymentStatus: 'failed', failedAt: new Date(), failureReason: err.message },
            });
          } catch { /* non-fatal */ }
        }

        return ctx.internalServerError(err.message ?? 'Failed to initiate withdrawal');
      }
    },
  }),
);