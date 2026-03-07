// PATH: backend/src/api/okrapay/controllers/okrapay.ts

/**
 * OkraPay Controller
 *
 * Reference format sent to the gateway:
 *   General:  ref-id-{userId}-purpose-{code}-{phone}-{timestamp}
 *   ridepay:  ref-id-{rideId}-purpose-ridepay-{phone}-{timestamp}
 *             ^^^^^ for ridepay the first ID is the RIDE ID, not userId.
 *             The rider is derived from the ride record.
 *
 * Purpose codes:
 *   floatadd   — driver float top-up
 *   subpay     — driver subscription payment
 *   ridepay    — rider paying for a completed ride (ID = rideId)
 *   withdraw   — driver/rider withdrawal
 *   walletTopup — rider wallet top-up
 *
 * Routes:
 *   POST /okrapay/initiate              — create payment intent (auth required)
 *   POST /okrapay                       — inbound collection webhook (public)
 *   POST /okrapay/withdraw              — inbound payout webhook (public)
 *   POST /okrapay/request-withdrawal    — request a withdrawal (auth required)
 *   GET  /okrapay/status/:reference     — check status (auth required)
 */

import { factories } from '@strapi/strapi';
import { getPaymentGateway } from '../../../paymentGatewayAdapters/';
import socketService from '../../../services/socketService';

// ─── Reference helpers ────────────────────────────────────────────────────────

interface ParsedReference {
  /** For ridepay: this is the rideId. For all others: userId. */
  contextId: string;
  purpose: string;
  phone: string;
  timestamp: string;
}

function buildReference(contextId: number | string, purpose: string, phone: string): string {
  return `ref-id-${contextId}-purpose-${purpose}-${phone}-${Date.now()}`;
}

function parseReference(reference: string): ParsedReference | null {
  const match = reference.match(/^ref-id-(\d+)-purpose-([a-zA-Z]+)-([0-9]*)-(\d+)$/);
  if (!match) return null;
  return {
    contextId: match[1],
    purpose:   match[2],
    phone:     match[3],
    timestamp: match[4],
  };
}

// ─── Admin settings helper ────────────────────────────────────────────────────

async function getAdminSettings(): Promise<Record<string, any>> {
  return (await strapi.db.query('api::admn-setting.admn-setting').findOne({})) || {};
}

// ─── Post-payment domain handlers ────────────────────────────────────────────

/**
 * Dispatches to the correct domain handler based on purpose.
 * Called after a successful collection webhook.
 */
async function handleCollectionSuccess(
  okrapayRecord: any,
  parsed: ParsedReference,
  webhookData: Record<string, unknown>
): Promise<void> {
  switch (parsed.purpose) {
    case 'floatadd':
      await handleFloatTopupSuccess(okrapayRecord, parsed.contextId, webhookData);
      break;
    case 'subpay':
      await handleSubscriptionPaymentSuccess(okrapayRecord, parsed.contextId, webhookData);
      break;
    case 'ridepay':
      // contextId is rideId for ridepay
      await handleRidePaymentSuccess(okrapayRecord, parsed.contextId, webhookData);
      break;
    case 'walletTopup':
      await handleWalletTopupSuccess(okrapayRecord, parsed.contextId, webhookData);
      break;
    default:
      strapi.log.warn(`[OkraPay] Unhandled purpose '${parsed.purpose}' for reference ${okrapayRecord.reference}`);
  }
}

// ─── Float top-up ─────────────────────────────────────────────────────────────

async function handleFloatTopupSuccess(
  okrapayRecord: any,
  userId: string,
  webhookData: Record<string, unknown>
): Promise<void> {
  try {
    const relatedId = okrapayRecord.relatedEntityId;

    const topup = await strapi.db.query('api::float-topup.float-topup').findOne({
      where: { id: relatedId }
    });

    if (!topup) {
      strapi.log.error(`[OkraPay:floatadd] Float topup ${relatedId} not found`);
      return;
    }
    if (topup.floatStatus === 'completed') {
      strapi.log.warn(`[OkraPay:floatadd] Topup ${relatedId} already completed — duplicate ignored`);
      return;
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: { driverProfile: { select: ['id', 'floatBalance'] } }
    });

    if (!user?.driverProfile) {
      strapi.log.error(`[OkraPay:floatadd] Driver profile not found for user ${userId}`);
      return;
    }

    const currentFloat = parseFloat(user.driverProfile.floatBalance || '0');
    const topupAmount  = parseFloat(topup.amount);
    const newFloat     = currentFloat + topupAmount;

    await strapi.db.query('api::float-topup.float-topup').update({
      where: { id: relatedId },
      data: {
        floatStatus:       'completed',
        floatBalanceBefore: currentFloat,
        floatBalanceAfter:  newFloat,
        completedAt:        new Date(),
        gatewayReference:   okrapayRecord.gatewayReference,
        gatewayResponse:    webhookData,
      }
    });

    await strapi.db.query('driver-profiles.driver-profile').update({
      where: { id: user.driverProfile.id },
      data: { floatBalance: newFloat }
    });

    await strapi.db.query('api::ledger-entry.ledger-entry').create({
      data: {
        entryId:       `LED-FT-${Date.now()}`,
        driver:        parseInt(userId),
        type:          'float_topup',
        amount:        topupAmount,
        source:        'okrapay',
        ledgerStatus:  'settled',
        balanceBefore: currentFloat,
        balanceAfter:  newFloat,
        description:   `Float top-up via OkraPay — ref ${okrapayRecord.reference}`,
        metadata:      { okrapayId: okrapayRecord.id },
      }
    });

    socketService.emitPaymentSuccess(parseInt(userId), 'driver', topupAmount, okrapayRecord.paymentId, 'float_topup');
    strapi.log.info(`[OkraPay:floatadd] +${topupAmount} → user ${userId}, new float ${newFloat}`);
  } catch (err) {
    strapi.log.error('[OkraPay:floatadd]', err);
  }
}

// ─── Subscription payment ─────────────────────────────────────────────────────

async function handleSubscriptionPaymentSuccess(
  okrapayRecord: any,
  userId: string,
  webhookData: Record<string, unknown>
): Promise<void> {
  try {
    const relatedId = okrapayRecord.relatedEntityId;
    const meta       = okrapayRecord.metadata || {};
    const action: string = meta.subscriptionAction || 'subscribe';

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: { driverProfile: { select: ['id', 'subscriptionStatus'] } }
    });

    if (!user?.driverProfile) return;

    const transactionId = `TXN-SUBPAY-${Date.now()}`;

    if (action === 'renew') {
      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { id: relatedId },
        populate: { subscriptionPlan: true }
      });
      if (!subscription) return;

      const plan = subscription.subscriptionPlan;
      const now  = new Date();
      const base =
        ['active', 'trial'].includes(subscription.subscriptionStatus) &&
        new Date(subscription.expiresAt) > now
          ? new Date(subscription.expiresAt)
          : now;

      const newExpiresAt = calculateExpiryDate(base, plan.durationType, plan.durationValue || 1);

      await strapi.db.query('api::driver-subscription.driver-subscription').update({
        where: { id: subscription.id },
        data: {
          subscriptionStatus:        'active',
          expiresAt:                 newExpiresAt,
          lastPaymentDate:           now,
          lastPaymentAmount:         plan.price,
          lastPaymentTransactionId:  transactionId,
          nextPaymentDue:            newExpiresAt,
          autoRenew:                 true,
          renewalCount:              (subscription.renewalCount || 0) + 1,
        }
      });

      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: { subscriptionStatus: 'active' }
      });
    } else {
      const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
        where: { id: relatedId }
      });
      if (!plan) return;

      const existing = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { driver: userId, subscriptionStatus: { $in: ['active', 'trial'] } }
      });
      if (existing) {
        await strapi.db.query('api::driver-subscription.driver-subscription').update({
          where: { id: existing.id },
          data: { subscriptionStatus: 'expired', autoRenew: false }
        });
      }

      const now       = new Date();
      const expiresAt = calculateExpiryDate(now, plan.durationType, plan.durationValue || 1);

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').create({
        data: {
          subscriptionId:            `SUB-${Date.now()}`,
          driver:                    parseInt(userId),
          subscriptionPlan:          parseInt(relatedId),
          subscriptionStatus:        'active',
          startedAt:                 now,
          expiresAt,
          isFreeTrial:               false,
          lastPaymentDate:           now,
          lastPaymentAmount:         plan.price,
          lastPaymentTransactionId:  transactionId,
          nextPaymentDue:            expiresAt,
          autoRenew:                 true,
          renewalCount:              0,
        }
      });

      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          subscriptionStatus:  'active',
          subscriptionPlan:    parseInt(relatedId),
          currentSubscription: subscription.id,
        }
      });
    }

    await strapi.db.query('api::transaction.transaction').create({
      data: {
        transactionId,
        user:              parseInt(userId),
        type:              'subscription_payment',
        amount:            okrapayRecord.amount,
        transactionStatus: 'completed',
        paymentMethod:     'okrapay',
        gatewayReference:  okrapayRecord.gatewayReference,
        gatewayResponse:   webhookData,
        processedAt:       new Date(),
      }
    });

    socketService.emitPaymentSuccess(parseInt(userId), 'driver', okrapayRecord.amount, okrapayRecord.paymentId, 'subscription_payment');
  } catch (err) {
    strapi.log.error('[OkraPay:subpay]', err);
  }
}

// ─── Ride payment ─────────────────────────────────────────────────────────────
//
// contextId here is the RIDE ID (not userId).
// We derive the rider from the ride record.
// We only reach this handler when the gateway webhook fires — meaning
// the wallet-balance path was NOT taken (wallet was insufficient) and
// the rider paid via the gateway.

async function handleRidePaymentSuccess(
  okrapayRecord: any,
  rideId: string,
  webhookData: Record<string, unknown>
): Promise<void> {
  try {
    const ride = await strapi.db.query('api::ride.ride').findOne({
      where: { id: rideId },
      populate: { rider: { select: ['id'] } }
    });

    if (!ride) {
      strapi.log.error(`[OkraPay:ridepay] Ride ${rideId} not found`);
      return;
    }

    // Idempotency guard
    if (ride.paymentStatus === 'completed') {
      strapi.log.warn(`[OkraPay:ridepay] Ride ${rideId} already paid — duplicate ignored`);
      return;
    }

    const riderId = ride.rider?.id ?? ride.rider;

    // Mark ride as paid via okrapay
    await strapi.db.query('api::ride.ride').update({
      where: { id: rideId },
      data: {
        paymentMethod: 'okrapay',
        paymentStatus: 'completed',
      }
    });

    // Transaction record for the rider
    await strapi.db.query('api::transaction.transaction').create({
      data: {
        transactionId:     `TXN-RIDE-${Date.now()}`,
        user:              riderId,
        type:              'ride_payment',
        amount:            okrapayRecord.amount,
        transactionStatus: 'completed',
        paymentMethod:     'okrapay',
        ride:              parseInt(rideId),
        gatewayReference:  okrapayRecord.gatewayReference,
        gatewayResponse:   webhookData,
        processedAt:       new Date(),
      }
    });

    socketService.emitPaymentSuccess(riderId, 'rider', okrapayRecord.amount, okrapayRecord.paymentId, 'ride_payment');
    strapi.log.info(`[OkraPay:ridepay] Ride ${rideId} marked paid via OkraPay gateway`);
  } catch (err) {
    strapi.log.error('[OkraPay:ridepay]', err);
  }
}

// ─── Wallet top-up (rider) ────────────────────────────────────────────────────

async function handleWalletTopupSuccess(
  okrapayRecord: any,
  userId: string,
  webhookData: Record<string, unknown>
): Promise<void> {
  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: { riderProfile: { select: ['id', 'walletBalance'] } }
    });

    if (!user?.riderProfile) {
      strapi.log.error(`[OkraPay:walletTopup] Rider profile not found for user ${userId}`);
      return;
    }

    const currentBalance = parseFloat(user.riderProfile.walletBalance || '0');
    const topupAmount    = parseFloat(okrapayRecord.amount);
    const newBalance     = currentBalance + topupAmount;

    await strapi.db.query('rider-profiles.rider-profile').update({
      where: { id: user.riderProfile.id },
      data: { walletBalance: newBalance }
    });

    await strapi.db.query('api::transaction.transaction').create({
      data: {
        transactionId:     `TXN-WALLET-${Date.now()}`,
        user:              parseInt(userId),
        type:              'float_topup',
        amount:            topupAmount,
        transactionStatus: 'completed',
        paymentMethod:     'okrapay',
        gatewayReference:  okrapayRecord.gatewayReference,
        gatewayResponse:   webhookData,
        processedAt:       new Date(),
      }
    });

    socketService.emitPaymentSuccess(parseInt(userId), 'rider', topupAmount, okrapayRecord.paymentId, 'wallet_topup');
    strapi.log.info(`[OkraPay:walletTopup] +${topupAmount} → rider ${userId}, new balance ${newBalance}`);
  } catch (err) {
    strapi.log.error('[OkraPay:walletTopup]', err);
  }
}

// ─── Withdrawal completed ─────────────────────────────────────────────────────

async function handleWithdrawalCompleted(
  okrapayRecord: any,
  userId: string,
  webhookData: Record<string, unknown>
): Promise<void> {
  try {
    const withdrawalId = okrapayRecord.relatedEntityId;
    const withdrawal   = await strapi.db.query('api::withdrawal.withdrawal').findOne({ where: { id: withdrawalId } });

    if (!withdrawal) return;
    if (withdrawal.withdrawalStatus === 'completed') return;

    await strapi.db.query('api::withdrawal.withdrawal').update({
      where: { id: withdrawalId },
      data: { withdrawalStatus: 'completed', gatewayResponse: webhookData, processedAt: new Date() }
    });

    await strapi.db.query('api::ledger-entry.ledger-entry').create({
      data: {
        entryId:       `LED-WD-${Date.now()}`,
        driver:        parseInt(userId),
        type:          'withdrawal',
        amount:        -Math.abs(withdrawal.amount),
        source:        'okrapay',
        ledgerStatus:  'settled',
        balanceBefore: withdrawal.balanceBefore,
        balanceAfter:  withdrawal.balanceAfter,
        description:   `Withdrawal via OkraPay — ref ${okrapayRecord.reference}`,
        metadata:      { okrapayId: okrapayRecord.id },
      }
    });

    await strapi.db.query('api::transaction.transaction').create({
      data: {
        transactionId:     `TXN-WD-${Date.now()}`,
        user:              parseInt(userId),
        type:              'withdrawal',
        amount:            withdrawal.amount,
        transactionStatus: 'completed',
        paymentMethod:     'okrapay',
        gatewayReference:  okrapayRecord.gatewayReference,
        processedAt:       new Date(),
      }
    });

    socketService.emitPaymentSuccess(parseInt(userId), 'driver', withdrawal.amount, okrapayRecord.paymentId, 'withdrawal');
    strapi.log.info(`[OkraPay:withdraw] Withdrawal ${withdrawalId} completed for user ${userId}`);
  } catch (err) {
    strapi.log.error('[OkraPay:withdraw]', err);
  }
}

async function handleWithdrawalFailed(
  okrapayRecord: any,
  userId: string,
  webhookData: Record<string, unknown>
): Promise<void> {
  try {
    const withdrawalId = okrapayRecord.relatedEntityId;

    await strapi.db.query('api::withdrawal.withdrawal').update({
      where: { id: withdrawalId },
      data: {
        withdrawalStatus: 'failed',
        gatewayResponse:  webhookData,
        failureReason:    (webhookData as any)?.reasonForFailure || 'Payout failed',
      }
    });

    // Refund the optimistically deducted balance
    const withdrawal = await strapi.db.query('api::withdrawal.withdrawal').findOne({ where: { id: withdrawalId } });
    if (withdrawal?.balanceBefore != null) {
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: { select: ['id'] } }
      });
      if (user?.driverProfile?.id) {
        await strapi.db.query('driver-profiles.driver-profile').update({
          where: { id: user.driverProfile.id },
          data: { floatBalance: withdrawal.balanceBefore }
        });
      }
    }

    socketService.emitPaymentFailed(parseInt(userId), 'driver', okrapayRecord.amount, (webhookData as any)?.reasonForFailure || 'Withdrawal failed', okrapayRecord.paymentId);
    strapi.log.warn(`[OkraPay:withdraw] Withdrawal ${withdrawalId} failed for user ${userId}`);
  } catch (err) {
    strapi.log.error('[OkraPay:withdrawFailed]', err);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateExpiryDate(from: Date, durationType: string, durationValue: number): Date {
  const d = new Date(from);
  switch (durationType) {
    case 'daily':   d.setDate(d.getDate() + durationValue); break;
    case 'weekly':  d.setDate(d.getDate() + 7 * durationValue); break;
    case 'monthly': d.setMonth(d.getMonth() + durationValue); break;
    case 'yearly':  d.setFullYear(d.getFullYear() + durationValue); break;
    default:        d.setMonth(d.getMonth() + 1);
  }
  return d;
}

function purposeToEntityType(purpose: string): string {
  const map: Record<string, string> = {
    floatadd:    'float_topup',
    subpay:      'driver_subscription',
    ridepay:     'ride',
    withdraw:    'withdrawal',
    walletTopup: 'wallet_topup',
  };
  return map[purpose] || '';
}

function purposeToNarration(purpose: string): string {
  const map: Record<string, string> = {
    floatadd:    'Float top-up — OkraRides',
    subpay:      'Subscription payment — OkraRides',
    ridepay:     'Ride payment — OkraRides',
    withdraw:    'Withdrawal — OkraRides',
    walletTopup: 'Wallet top-up — OkraRides',
  };
  return map[purpose] || 'OkraRides payment';
}

function resolvePaymentMethod(data: Record<string, unknown>): string {
  if ((data as any).mobileMoneyDetails) return 'mobile_money';
  if ((data as any).cardDetails)        return 'card';
  if ((data as any).bankAccountDetails) return 'bank_transfer';
  return 'mobile_money';
}

// ─── Controller ───────────────────────────────────────────────────────────────

export default factories.createCoreController('api::okrapay.okrapay', ({ strapi }) => ({

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/okrapay/initiate
  //
  // For ridepay:
  //   - relatedEntityId = rideId
  //   - Checks rider wallet balance first
  //   - If wallet covers fare: deduct wallet, mark ride paid, return immediately
  //   - Otherwise: initiate OkraPay gateway for the ride amount
  // ──────────────────────────────────────────────────────────────────────────
  async initiate(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      const {
        purpose,
        amount,
        currency,
        relatedEntityId,
        metadata  = {},
        phone     = '',
        channels,
        callbackUrl,
        narration,
      } = ctx.request.body as Record<string, any>;

      if (!purpose || !amount) return ctx.badRequest('purpose and amount are required');

      const settings    = await getAdminSettings();
      const gatewayName: string = settings.externalPaymentGateway || 'lencopay';

      // ── Respect admin flags ───────────────────────────────────────────────
      if (!settings.okrapayEnabled) {
        return ctx.forbidden('OkraPay is not enabled on this platform');
      }
      if (purpose === 'floatadd' && !settings.allowFloatTopUpWithOkraPay) {
        return ctx.forbidden('Float top-up via OkraPay is not allowed');
      }
      if (purpose === 'ridepay' && !settings.allowRidePaymentWithOkraPay) {
        return ctx.forbidden('Ride payment via OkraPay is not allowed');
      }

      const numAmount = parseFloat(amount);

      // ── ridepay: wallet-first flow ────────────────────────────────────────
      if (purpose === 'ridepay') {
        const rideId = relatedEntityId;
        if (!rideId) return ctx.badRequest('relatedEntityId (rideId) is required for ridepay');

        const ride = await strapi.db.query('api::ride.ride').findOne({
          where: { id: rideId },
          populate: { rider: { select: ['id', 'email', 'username', 'firstName', 'lastName'] } }
        });

        if (!ride) return ctx.notFound('Ride not found');

        // Idempotency
        if (ride.paymentStatus === 'completed') {
          return ctx.send({ success: true, alreadyPaid: true, message: 'Ride already paid' });
        }

        const riderRecord = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: ride.rider?.id ?? ride.rider },
          populate: { riderProfile: { select: ['id', 'walletBalance'] } }
        });

        const walletBalance = parseFloat(riderRecord?.riderProfile?.walletBalance || '0');
        const fareAmount    = parseFloat(ride.totalFare);

        if (walletBalance >= fareAmount) {
          // ── Pay from wallet — no gateway needed ───────────────────────────
          const riderId   = riderRecord.id;
          const newBalance = walletBalance - fareAmount;

          await strapi.db.query('rider-profiles.rider-profile').update({
            where: { id: riderRecord.riderProfile.id },
            data: { walletBalance: newBalance }
          });

          await strapi.db.query('api::ride.ride').update({
            where: { id: rideId },
            data: { paymentMethod: 'okrapay', paymentStatus: 'completed' }
          });

          const txnId = `TXN-RIDE-WALLET-${Date.now()}`;
          await strapi.db.query('api::transaction.transaction').create({
            data: {
              transactionId:     txnId,
              user:              riderId,
              type:              'ride_payment',
              amount:            fareAmount,
              transactionStatus: 'completed',
              paymentMethod:     'okrapay',
              ride:              parseInt(rideId),
              processedAt:       new Date(),
              notes:             'Paid from wallet balance',
            }
          });

          socketService.emitPaymentSuccess(riderId, 'rider', fareAmount, txnId, 'ride_payment');
          strapi.log.info(`[OkraPay:ridepay] Ride ${rideId} paid from wallet. Deducted ${fareAmount}, new balance ${newBalance}`);

          return ctx.send({
            success:       true,
            paidFromWallet: true,
            message:       'Ride paid from wallet balance',
            data: { rideId, amount: fareAmount, walletBalance: newBalance }
          });
        }

        // ── Insufficient wallet — initiate gateway ─────────────────────────
        // Reference uses rideId as the contextId for ridepay
        const reference = buildReference(rideId, 'ridepay', riderRecord?.username || phone);
        const paymentId = `OKRA-${Date.now()}`;

        const okrapayRecord = await strapi.db.query('api::okrapay.okrapay').create({
          data: {
            paymentId,
            reference,
            user:              riderRecord.id,
            purpose:           'ridepay',
            direction:         'collection',
            amount:            fareAmount,
            paymentStatus:     'pending',
            gatewayName,
            relatedEntityType: 'ride',
            relatedEntityId:   String(rideId),
            initiatedAt:       new Date(),
            ipAddress:         ctx.request.ip,
            metadata,
          }
        });

        const gateway = getPaymentGateway(gatewayName);
        const result  = await gateway.initiatePayment({
          reference,
          amount:   fareAmount,
          currency: currency || settings.defaultCurrency?.isoCode || 'ZMW',
          email:    riderRecord.email || '',
          customer: {
            firstName: riderRecord.firstName || riderRecord.username || '',
            lastName:  riderRecord.lastName  || '',
            phone:     riderRecord.username  || phone,
          },
          channels,
          callbackUrl,
          narration: narration || purposeToNarration('ridepay'),
          metadata: { okrapayId: okrapayRecord.id, rideId, riderId: riderRecord.id },
        });

        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data:  { gatewayReference: result.gatewayReference }
        });

        strapi.log.info(`[OkraPay:ridepay] Gateway initiated for ride ${rideId}, rider wallet ${walletBalance} < fare ${fareAmount}`);

        return ctx.send({
          success:        true,
          paidFromWallet: false,
          data: {
            paymentId,
            reference,
            paymentUrl:   result.paymentUrl,
            gatewayName,
            gatewayConfig: result.raw,
            amount:        fareAmount,
          }
        });
      }

      // ── All other purposes ────────────────────────────────────────────────
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['id', 'email', 'username', 'firstName', 'lastName'],
      });

      const reference = buildReference(userId, purpose, phone || user?.username || '');
      const paymentId = `OKRA-${Date.now()}`;

      const okrapayRecord = await strapi.db.query('api::okrapay.okrapay').create({
        data: {
          paymentId,
          reference,
          user:              userId,
          purpose,
          direction:         'collection',
          amount:            numAmount,
          paymentStatus:     'pending',
          gatewayName,
          relatedEntityType: purposeToEntityType(purpose),
          relatedEntityId:   relatedEntityId ? String(relatedEntityId) : null,
          initiatedAt:       new Date(),
          ipAddress:         ctx.request.ip,
          metadata:          { ...metadata, subscriptionAction: metadata.subscriptionAction },
          notes:             narration || null,
        }
      });

      const gateway = getPaymentGateway(gatewayName);
      const result  = await gateway.initiatePayment({
        reference,
        amount:   numAmount,
        currency: currency || settings.defaultCurrency?.isoCode || 'ZMW',
        email:    user?.email || '',
        customer: {
          firstName: user?.firstName || user?.username || '',
          lastName:  user?.lastName  || '',
          phone:     phone || user?.username || '',
        },
        channels,
        callbackUrl,
        narration: narration || purposeToNarration(purpose),
        metadata: { okrapayId: okrapayRecord.id, userId, purpose, relatedEntityId },
      });

      await strapi.db.query('api::okrapay.okrapay').update({
        where: { id: okrapayRecord.id },
        data:  { gatewayReference: result.gatewayReference }
      });

      return ctx.send({
        success: true,
        data: {
          paymentId,
          reference,
          paymentUrl:    result.paymentUrl,
          gatewayName,
          gatewayConfig: result.raw,
          amount:        numAmount,
        }
      });
    } catch (err: any) {
      strapi.log.error('[OkraPay:initiate]', err);
      return ctx.internalServerError(err.message || 'Failed to initiate payment');
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/okrapay   (inbound collection webhook — no auth)
  // ──────────────────────────────────────────────────────────────────────────
  async webhook(ctx) {
    ctx.status = 200;
    ctx.body   = { received: true };

    try {
      const settings    = await getAdminSettings();
      const gatewayName: string = settings.externalPaymentGateway || 'lencopay';
      const gateway     = getPaymentGateway(gatewayName);

      const rawBody = ctx.rawBody || JSON.stringify(ctx.request.body);
      const headers = ctx.request.headers as Record<string, string>;
      const verified = gateway.verifyWebhook(headers, rawBody);

      if (!verified.valid) {
        strapi.log.warn('[OkraPay:webhook] Invalid signature');
        return;
      }

      const { event, data } = verified;
      strapi.log.info(`[OkraPay:webhook] event='${event}'`);

      const reference = gateway.extractReference(data);
      if (!reference) return;

      const parsed = parseReference(reference);
      if (!parsed) {
        strapi.log.warn(`[OkraPay:webhook] Cannot parse reference '${reference}'`);
        return;
      }

      const okrapayRecord = await strapi.db.query('api::okrapay.okrapay').findOne({ where: { reference } });
      if (!okrapayRecord) {
        strapi.log.warn(`[OkraPay:webhook] No record for reference '${reference}'`);
        return;
      }

      const gatewayTxId   = gateway.extractGatewayTransactionId(data);
      const paymentMethod = resolvePaymentMethod(data);

      if (gateway.isCollectionSuccess(event, data)) {
        if (okrapayRecord.paymentStatus === 'completed') return; // duplicate

        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: {
            paymentStatus:    'completed',
            gatewayReference: gatewayTxId || okrapayRecord.gatewayReference,
            gatewayResponse:  data,
            paymentMethod,
            completedAt:      new Date(),
          }
        });

        const updated = await strapi.db.query('api::okrapay.okrapay').findOne({ where: { id: okrapayRecord.id } });
        await handleCollectionSuccess(updated, parsed, data);

      } else if (gateway.isCollectionFailed(event, data)) {
        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: {
            paymentStatus:    'failed',
            gatewayReference: gatewayTxId || okrapayRecord.gatewayReference,
            gatewayResponse:  data,
            failedAt:         new Date(),
            failureReason:    (data as any).reasonForFailure || 'Payment failed',
          }
        });

        // Notify the user
        // For ridepay, the user is the rider (stored in okrapayRecord.user)
        if (okrapayRecord.user) {
          socketService.emitPaymentFailed(
            okrapayRecord.user,
            parsed.purpose === 'ridepay' ? 'rider' : 'driver',
            okrapayRecord.amount,
            (data as any).reasonForFailure || 'Payment failed',
            okrapayRecord.paymentId
          );
        }
      }
    } catch (err) {
      strapi.log.error('[OkraPay:webhook]', err);
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/okrapay/withdraw   (inbound payout webhook — no auth)
  // ──────────────────────────────────────────────────────────────────────────
  async withdrawWebhook(ctx) {
    ctx.status = 200;
    ctx.body   = { received: true };

    try {
      const settings    = await getAdminSettings();
      const gatewayName: string = settings.externalPaymentGateway || 'lencopay';
      const gateway     = getPaymentGateway(gatewayName);

      const rawBody = ctx.rawBody || JSON.stringify(ctx.request.body);
      const headers = ctx.request.headers as Record<string, string>;
      const verified = gateway.verifyWebhook(headers, rawBody);
      if (!verified.valid) return;

      const { event, data } = verified;
      const reference = gateway.extractReference(data);
      if (!reference) return;

      const parsed = parseReference(reference);
      if (!parsed || parsed.purpose !== 'withdraw') return;

      const okrapayRecord = await strapi.db.query('api::okrapay.okrapay').findOne({ where: { reference } });
      if (!okrapayRecord) return;

      const gatewayTxId = gateway.extractGatewayTransactionId(data);

      if (gateway.isPayoutCompleted(event, data)) {
        if (okrapayRecord.paymentStatus === 'completed') return;

        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: { paymentStatus: 'completed', gatewayReference: gatewayTxId, gatewayResponse: data, completedAt: new Date() }
        });

        const updated = await strapi.db.query('api::okrapay.okrapay').findOne({ where: { id: okrapayRecord.id } });
        await handleWithdrawalCompleted(updated, String(okrapayRecord.user), data);

      } else if (gateway.isPayoutFailed(event, data)) {
        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: { paymentStatus: 'failed', gatewayReference: gatewayTxId, gatewayResponse: data, failedAt: new Date(), failureReason: (data as any).reasonForFailure || 'Withdrawal failed' }
        });

        const updated = await strapi.db.query('api::okrapay.okrapay').findOne({ where: { id: okrapayRecord.id } });
        await handleWithdrawalFailed(updated, String(okrapayRecord.user), data);
      }
    } catch (err) {
      strapi.log.error('[OkraPay:withdrawWebhook]', err);
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/okrapay/request-withdrawal   (auth required)
  // ──────────────────────────────────────────────────────────────────────────
  async requestWithdrawal(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      const { amount, method = 'mobile_money', provider, accountNumber, accountName, narration } =
        ctx.request.body as Record<string, any>;

      if (!amount || !accountNumber || !accountName) {
        return ctx.badRequest('amount, accountNumber and accountName are required');
      }

      const settings    = await getAdminSettings();
      if (!settings.okrapayEnabled) return ctx.forbidden('OkraPay is not enabled');

      const gatewayName: string = settings.externalPaymentGateway || 'lencopay';
      const numAmount = parseFloat(amount);

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: { select: ['id', 'floatBalance'] } }
      });

      if (!user?.driverProfile) return ctx.badRequest('Driver profile not found');

      const currentBalance = parseFloat(user.driverProfile.floatBalance || '0');
      if (currentBalance < numAmount) {
        return ctx.badRequest(`Insufficient balance. Available: ${currentBalance}`);
      }

      const reference = buildReference(userId, 'withdraw', accountNumber);
      const paymentId = `OKRA-WD-${Date.now()}`;
      const newBalance = currentBalance - numAmount;

      // Optimistic deduction
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: { floatBalance: newBalance }
      });

      const withdrawal = await strapi.db.query('api::withdrawal.withdrawal').create({
        data: {
          withdrawalId:     `WD-${Date.now()}`,
          user:             userId,
          amount:           numAmount,
          method,
          provider:         provider || '',
          accountNumber,
          accountName,
          withdrawalStatus: 'processing',
          balanceBefore:    currentBalance,
          balanceAfter:     newBalance,
          requestedAt:      new Date(),
        }
      });

      const okrapayRecord = await strapi.db.query('api::okrapay.okrapay').create({
        data: {
          paymentId,
          reference,
          user:              userId,
          purpose:           'withdraw',
          direction:         'payout',
          amount:            numAmount,
          paymentStatus:     'processing',
          gatewayName,
          relatedEntityType: 'withdrawal',
          relatedEntityId:   String(withdrawal.id),
          initiatedAt:       new Date(),
          ipAddress:         ctx.request.ip,
        }
      });

      await strapi.db.query('api::withdrawal.withdrawal').update({
        where: { id: withdrawal.id },
        data: { okrapayTransaction: okrapayRecord.id }
      });

      const gateway = getPaymentGateway(gatewayName);
      const result  = await gateway.initiatePayout({
        reference,
        amount:        numAmount,
        currency:      settings.defaultCurrency?.isoCode || 'ZMW',
        accountNumber,
        accountName,
        method,
        provider,
        narration:     narration || `Withdrawal for user ${userId}`,
      });

      await strapi.db.query('api::okrapay.okrapay').update({
        where: { id: okrapayRecord.id },
        data: { gatewayReference: result.gatewayReference }
      });

      await strapi.db.query('api::withdrawal.withdrawal').update({
        where: { id: withdrawal.id },
        data: { gatewayReference: result.gatewayReference }
      });

      strapi.log.info(`[OkraPay:requestWithdrawal] Withdrawal ${withdrawal.id} initiated for user ${userId}, amount ${numAmount}`);

      return ctx.send({
        success: true,
        data: {
          withdrawalId: withdrawal.withdrawalId,
          reference,
          status:       'processing',
          amount:       numAmount,
          message:      'Withdrawal initiated. Funds will be sent to your account shortly.',
        }
      });
    } catch (err: any) {
      strapi.log.error('[OkraPay:requestWithdrawal]', err);
      return ctx.internalServerError(err.message || 'Failed to initiate withdrawal');
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/okrapay/status/:reference   (auth required)
  // ──────────────────────────────────────────────────────────────────────────
  async getPaymentStatus(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      const { reference } = ctx.params;

      const record = await strapi.db.query('api::okrapay.okrapay').findOne({
        where: { reference, user: userId }
      });

      if (!record) return ctx.notFound('Payment record not found');

      return ctx.send({
        paymentId:     record.paymentId,
        reference:     record.reference,
        purpose:       record.purpose,
        amount:        record.amount,
        paymentStatus: record.paymentStatus,
        paymentMethod: record.paymentMethod,
        initiatedAt:   record.initiatedAt,
        completedAt:   record.completedAt,
        failedAt:      record.failedAt,
        failureReason: record.failureReason,
      });
    } catch (err) {
      strapi.log.error('[OkraPay:getPaymentStatus]', err);
      return ctx.internalServerError('Failed to get payment status');
    }
  },

}));