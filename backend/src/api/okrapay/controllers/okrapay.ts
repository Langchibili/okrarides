//Okrarides\backend\src\api\okrapay\controllers\okrapay.ts

import { factories } from '@strapi/strapi';
import { getPaymentGateway } from '../../../paymentGatewayAdapters/';
import socketService from '../../../services/socketService';
import { SendEmailNotification } from '../../../services/messages';

// ─── Reference helpers ────────────────────────────────────────────────────────

interface ParsedReference {
  contextId: string;
  purpose:   string;
  phone:     string;
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

// ─── Admin settings ───────────────────────────────────────────────────────────

async function getAdminSettings(): Promise<Record<string, any>> {
  return (await strapi.db.query('api::admn-setting.admn-setting').findOne({})) || {};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── User + country helper ────────────────────────────────────────────────────

function normalisePhone(phone: string, phoneCode: string): string {
  const code   = String(phoneCode).replace(/\D/g, '');
  let   digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith(code)) digits = digits.slice(code.length);
  digits = digits.replace(/^0+/, '');
  return `${code}${digits.slice(-9)}`;
}

async function getUserWithCountry(userId: number) {
  return strapi.db.query('plugin::users-permissions.user').findOne({
    where:  { id: userId },
    select: ['id', 'email', 'username', 'firstName', 'lastName'],
    populate: {
      country: {
        populate: {
          currency: { select: ['id', 'code', 'symbol'] },
        },
      },
    },
  });
}

// ─── Domain handlers (webhook + poller share these) ───────────────────────────

async function handleCollectionSuccess(
  okrapayRecord: any,
  parsed:        ParsedReference,
  webhookData:   Record<string, unknown>,
): Promise<void> {
  switch (parsed.purpose) {
    case 'floatadd':
      await handleFloatTopupSuccess(okrapayRecord, parsed.contextId, webhookData);
      break;
    case 'subpay':
      await handleSubscriptionPaymentSuccess(okrapayRecord, parsed.contextId, webhookData);
      break;
    case 'ridepay':
      await handleRidePaymentSuccess(okrapayRecord, parsed.contextId, webhookData);
      break;
    case 'walletTopup':
      await handleWalletTopupSuccess(okrapayRecord, parsed.contextId, webhookData);
      break;
    default:
      strapi.log.warn(`[OkraPay] Unhandled purpose '${parsed.purpose}' ref ${okrapayRecord.reference}`);
  }
}

// ─── Float top-up ─────────────────────────────────────────────────────────────

async function handleFloatTopupSuccess(
  okrapayRecord: any,
  userId:        string,
  webhookData:   Record<string, unknown>,
): Promise<void> {
  try {
    const relatedId = okrapayRecord.relatedEntityId;

    const topup = await strapi.db.query('api::float-topup.float-topup').findOne({
      where: { id: relatedId },
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
      where:  { id: userId },
      select: ['id', 'email', 'firstName', 'lastName'],
      populate: { driverProfile: { select: ['id'] } },
    });

    if (!user?.driverProfile?.id) {
      strapi.log.error(`[OkraPay:floatadd] Driver profile not found for user ${userId}`);
      return;
    }

    const driverProfile = await strapi.db.query('driver-profiles.driver-profile').findOne({
      where:  { id: user.driverProfile.id },
      select: ['id', 'floatBalance', 'withdrawableFloatBalance'],
    });

    const currentFloat = parseFloat(driverProfile?.floatBalance || '0');
    const topupAmount  = parseFloat(topup.amount);
    const newFloat     = currentFloat + topupAmount;

    await strapi.db.query('api::float-topup.float-topup').update({
      where: { id: relatedId },
      data: {
        floatStatus:        'completed',
        floatBalanceBefore: currentFloat,
        floatBalanceAfter:  newFloat,
        completedAt:        new Date(),
        gatewayReference:   okrapayRecord.gatewayReference,
        gatewayResponse:    webhookData,
      },
    });

    await strapi.db.query('driver-profiles.driver-profile').update({
      where: { id: user.driverProfile.id },
      data:  { floatBalance: newFloat },
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
      },
    });

    socketService.emitPaymentSuccess(
      parseInt(userId), 'driver', topupAmount, okrapayRecord.paymentId, 'float_topup',
    );

    try {
      const settings     = await getAdminSettings();
      const adminEmails: string[] = Array.isArray(settings.adminSupportEmails)
        ? settings.adminSupportEmails
        : [];

      const driverName = [user.firstName, user.lastName].filter(Boolean).join(' ')
        || user.email
        || `User #${userId}`;

      const emailBody =
        `Float Top-Up Notification — OkraRides\n\n` +
        `Driver:         ${driverName}\n` +
        `Email:          ${user.email || 'N/A'}\n` +
        `Top-up amount:  ${topupAmount}\n` +
        `Balance before: ${currentFloat}\n` +
        `Balance after:  ${newFloat}\n` +
        `Reference:      ${okrapayRecord.reference}\n` +
        `Timestamp:      ${new Date().toISOString()}\n`;

      adminEmails.forEach(email => {
        try { SendEmailNotification(email, emailBody); } catch { /* non-fatal */ }
      });
    } catch (emailErr) {
      strapi.log.warn('[OkraPay:floatadd] Admin email failed:', emailErr);
    }

    strapi.log.info(
      `[OkraPay:floatadd] +${topupAmount} → user ${userId}, new float ${newFloat}`,
    );
  } catch (err) {
    strapi.log.error('[OkraPay:floatadd]', err);
  }
}

// ─── Subscription payment ─────────────────────────────────────────────────────
//
// relatedEntityId is now the PENDING subscription ID (not the plan ID).
// This function activates the pending subscription created by
// POST /subscriptions/subscribe, rather than creating a brand-new one.
//
// Flow:
//   1. Frontend calls POST /subscriptions/subscribe → creates pending subscription
//   2. OkraPayModal sends relatedEntityId = subscription.id, purpose = 'subpay'
//   3. On payment success this handler fires with relatedId = subscription.id
//   4. We find the pending subscription, activate it, update driver profile.
//
// ─────────────────────────────────────────────────────────────────────────────

async function handleSubscriptionPaymentSuccess(
  okrapayRecord: any,
  userId:        string,
  webhookData:   Record<string, unknown>,
): Promise<void> {
  try {
    const relatedId = okrapayRecord.relatedEntityId;
    const meta       = okrapayRecord.metadata || {};
    const action: string = meta.subscriptionAction || 'subscribe';

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where:    { id: userId },
      populate: { driverProfile: { select: ['id', 'subscriptionStatus'] } },
    });

    if (!user?.driverProfile) {
      strapi.log.error(`[OkraPay:subpay] Driver profile not found for user ${userId}`);
      return;
    }

    const transactionId = `TXN-SUBPAY-${Date.now()}`;

    if (action === 'renew') {
      // ── Renewal: relatedId is still the existing subscription ID ──────────
      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where:    { id: relatedId },
        populate: { subscriptionPlan: true },
      });
      if (!subscription) {
        strapi.log.error(`[OkraPay:subpay:renew] Subscription ${relatedId} not found`);
        return;
      }

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
        },
      });

      const dpRecord = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        select: ['id'],
      });
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: dpRecord.id },
        data:  { subscriptionStatus: 'active' },
      });

      strapi.log.info(
        `[OkraPay:subpay:renew] Subscription ${subscription.id} renewed for user ${userId}, new expiry ${newExpiresAt}`,
      );

    } else {
      // ── New subscription: relatedId is the PENDING subscription ID ────────
      const pendingSubscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where:    { id: relatedId },
        populate: { subscriptionPlan: true },
      });

      if (!pendingSubscription) {
        strapi.log.error(`[OkraPay:subpay:subscribe] Pending subscription ${relatedId} not found`);
        return;
      }

      // Idempotency guard — don't activate twice
      if (pendingSubscription.subscriptionStatus === 'active') {
        strapi.log.warn(
          `[OkraPay:subpay:subscribe] Subscription ${relatedId} already active — duplicate ignored`,
        );
        return;
      }

      const plan = pendingSubscription.subscriptionPlan;
      if (!plan) {
        strapi.log.error(`[OkraPay:subpay:subscribe] Plan not found on pending subscription ${relatedId}`);
        return;
      }

      // Expire any OTHER currently active/trial subscription for this driver
      const existingActive = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: {
          driver: userId,
          subscriptionStatus: { $in: ['active', 'trial'] },
          id: { $ne: pendingSubscription.id },  // not the pending one we're about to activate
        },
      });
      if (existingActive) {
        await strapi.db.query('api::driver-subscription.driver-subscription').update({
          where: { id: existingActive.id },
          data:  { subscriptionStatus: 'expired', autoRenew: false },
        });
        strapi.log.info(
          `[OkraPay:subpay:subscribe] Expired previous subscription ${existingActive.id} for driver ${userId}`,
        );
      }

      const now       = new Date();
      const expiresAt = calculateExpiryDate(now, plan.durationType, plan.durationValue || 1);

      // Activate the pending subscription
      await strapi.db.query('api::driver-subscription.driver-subscription').update({
        where: { id: pendingSubscription.id },
        data: {
          subscriptionStatus:        'active',
          startedAt:                 now,
          expiresAt,
          lastPaymentDate:           now,
          lastPaymentAmount:         plan.price,
          lastPaymentTransactionId:  transactionId,
          nextPaymentDue:            expiresAt,
          autoRenew:                 true,
        },
      });

      // Sync driver profile — NOW that payment is confirmed
      const dpRecord = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        select: ['id'],
      });
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: dpRecord.id },
        data: {
          subscriptionStatus:  'active',
          subscriptionPlan:    plan.id,
          currentSubscription: pendingSubscription.id,
        },
      });

      strapi.log.info(
        `[OkraPay:subpay:subscribe] Activated subscription ${pendingSubscription.id} ` +
        `for user ${userId}, plan ${plan.id}, expires ${expiresAt}`,
      );
    }

    // ── Transaction record ─────────────────────────────────────────────────
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
      },
    });

    socketService.emitPaymentSuccess(
      parseInt(userId), 'driver', okrapayRecord.amount, okrapayRecord.paymentId, 'subscription_payment',
    );
  } catch (err) {
    strapi.log.error('[OkraPay:subpay]', err);
  }
}

// ─── Ride payment ─────────────────────────────────────────────────────────────

async function handleRidePaymentSuccess(
  okrapayRecord: any,
  rideId:        string,
  webhookData:   Record<string, unknown>,
): Promise<void> {
  try {
    const ride = await strapi.db.query('api::ride.ride').findOne({
      where:    { id: rideId },
      populate: { rider: { select: ['id'] } },
    });

    if (!ride) {
      strapi.log.error(`[OkraPay:ridepay] Ride ${rideId} not found`);
      return;
    }
    if (ride.paymentStatus === 'completed') {
      strapi.log.warn(`[OkraPay:ridepay] Ride ${rideId} already paid — duplicate ignored`);
      return;
    }

    const riderId = ride.rider?.id ?? ride.rider;

    await strapi.db.query('api::ride.ride').update({
      where: { id: rideId },
      data:  { paymentMethod: 'okrapay', paymentStatus: 'completed' },
    });

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
      },
    });

    socketService.emitPaymentSuccess(
      riderId, 'rider', okrapayRecord.amount, okrapayRecord.paymentId, 'ride_payment',
    );
    strapi.log.info(`[OkraPay:ridepay] Ride ${rideId} marked paid via OkraPay`);
  } catch (err) {
    strapi.log.error('[OkraPay:ridepay]', err);
  }
}

// ─── Wallet top-up ────────────────────────────────────────────────────────────

async function handleWalletTopupSuccess(
  okrapayRecord: any,
  userId:        string,
  webhookData:   Record<string, unknown>,
): Promise<void> {
  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where:    { id: userId },
      populate: { riderProfile: { select: ['id'] } },
    });

    if (!user?.riderProfile?.id) {
      strapi.log.error(`[OkraPay:walletTopup] Rider profile not found for user ${userId}`);
      return;
    }

    const riderProfile = await strapi.db.query('rider-profiles.rider-profile').findOne({
      where:  { id: user.riderProfile.id },
      select: ['id', 'walletBalance'],
    });

    const currentBalance = parseFloat(riderProfile?.walletBalance || '0');
    const topupAmount    = parseFloat(okrapayRecord.amount);
    const newBalance     = currentBalance + topupAmount;

    await strapi.db.query('rider-profiles.rider-profile').update({
      where: { id: user.riderProfile.id },
      data:  { walletBalance: newBalance },
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
      },
    });

    socketService.emitPaymentSuccess(
      parseInt(userId), 'rider', topupAmount, okrapayRecord.paymentId, 'wallet_topup',
    );
    strapi.log.info(
      `[OkraPay:walletTopup] +${topupAmount} → rider ${userId}, new balance ${newBalance}`,
    );
  } catch (err) {
    strapi.log.error('[OkraPay:walletTopup]', err);
  }
}

// ─── Withdrawal handlers ──────────────────────────────────────────────────────

async function handleWithdrawalCompleted(
  okrapayRecord: any,
  userId:        string,
  webhookData:   Record<string, unknown>,
): Promise<void> {
  try {
    const withdrawalId = okrapayRecord.relatedEntityId;
    const withdrawal   = await strapi.db.query('api::withdrawal.withdrawal').findOne({ where: { id: withdrawalId } });

    if (!withdrawal || withdrawal.withdrawalStatus === 'completed') return;

    await strapi.db.query('api::withdrawal.withdrawal').update({
      where: { id: withdrawalId },
      data: {
        withdrawalStatus: 'completed',
        gatewayResponse:  webhookData,
        processedAt:      new Date(),
      },
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
      },
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
      },
    });

    socketService.emitPaymentSuccess(
      parseInt(userId), 'driver', withdrawal.amount, okrapayRecord.paymentId, 'withdrawal',
    );
    strapi.log.info(`[OkraPay:withdraw] Withdrawal ${withdrawalId} completed for user ${userId}`);
  } catch (err) {
    strapi.log.error('[OkraPay:withdraw]', err);
  }
}

async function handleWithdrawalFailed(
  okrapayRecord: any,
  userId:        string,
  webhookData:   Record<string, unknown>,
): Promise<void> {
  try {
    const withdrawalId = okrapayRecord.relatedEntityId;

    await strapi.db.query('api::withdrawal.withdrawal').update({
      where: { id: withdrawalId },
      data: {
        withdrawalStatus: 'failed',
        gatewayResponse:  webhookData,
        failureReason:    (webhookData as any)?.reasonForFailure || 'Payout failed',
      },
    });

    const withdrawal = await strapi.db.query('api::withdrawal.withdrawal').findOne({
      where: { id: withdrawalId },
    });

    if (withdrawal?.balanceBefore != null) {
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where:    { id: userId },
        populate: { driverProfile: { select: ['id'] } },
      });

      if (user?.driverProfile?.id) {
        const dpRecord = await strapi.db.query('driver-profiles.driver-profile').findOne({
          where:  { id: user.driverProfile.id },
          select: ['id'],
        });

        const balanceField =
          withdrawal.withdrawableMode === 'float'
            ? 'withdrawableFloatBalance'
            : 'currentBalance';

        await strapi.db.query('driver-profiles.driver-profile').update({
          where: { id: dpRecord.id },
          data:  { [balanceField]: withdrawal.balanceBefore },
        });

        strapi.log.info(
          `[OkraPay:withdrawFailed] Refunded ${withdrawal.balanceBefore} ` +
          `to field '${balanceField}' for user ${userId}`,
        );
      }
    }

    socketService.emitPaymentFailed(
      parseInt(userId), 'driver', okrapayRecord.amount,
      (webhookData as any)?.reasonForFailure || 'Withdrawal failed',
      okrapayRecord.paymentId,
    );
    strapi.log.warn(`[OkraPay:withdraw] Withdrawal ${withdrawalId} failed for user ${userId}`);
  } catch (err) {
    strapi.log.error('[OkraPay:withdrawFailed]', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

export default factories.createCoreController('api::okrapay.okrapay', ({ strapi }) => ({

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/okrapay/initiate   (auth required)
  // ──────────────────────────────────────────────────────────────────────────
  async initiate(ctx: any) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      const {
        purpose,
        amount,
        relatedEntityId,
        metadata    = {},
        paymentType = 'mobile_money',
        phone       = '',
        operator    = '',
        customer: cardCustomer,
        card,
        billing,
        redirectUrl,
        narration,
        channels,
        callbackUrl,
      } = ctx.request.body as Record<string, any>;

      if (!purpose || !amount) return ctx.badRequest('purpose and amount are required');

      const numAmount = parseFloat(amount);

      const user         = await getUserWithCountry(userId);
      const userCountry  = user?.country;
      const countryCode  = (userCountry?.code          || 'zm').toLowerCase();
      const phoneCode    = (userCountry?.phoneCode      || '260').replace(/\D/g, '');
      const currencyCode = (userCountry?.currency?.code || 'ZMW').toUpperCase();

      const formattedPhone = phone ? normalisePhone(phone, phoneCode) : '';

      const settings    = await getAdminSettings();
      const gatewayName = String(settings.externalPaymentGateway || 'lencopay');
      const gateway     = getPaymentGateway(gatewayName);

      const reference = buildReference(userId, purpose, formattedPhone || user?.username || '');
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
          metadata:          { ...metadata },
          notes:             narration || null,
        },
      });

      const result = await gateway.initiatePayment({
        reference,
        amount:   numAmount,
        currency: currencyCode,
        email:    user?.email || '',
        customer: {
          firstName: cardCustomer?.firstName || user?.firstName || user?.username || '',
          lastName:  cardCustomer?.lastName  || user?.lastName  || '',
          phone:     formattedPhone,
        },
        paymentType,
        phone:    formattedPhone,
        operator: operator ? operator.toLowerCase() : undefined,
        country:  countryCode,
        card,
        billing,
        redirectUrl,
        channels,
        callbackUrl,
        narration: narration || purposeToNarration(purpose),
        metadata:  { okrapayId: okrapayRecord.id, userId, purpose, relatedEntityId },
      });

      if (result.lencoStatus === 'failed') {
        const rawData = result.raw as any;
        const reason  = rawData?.reasonForFailure || 'Payment declined';

        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: {
            paymentStatus:    'failed',
            gatewayReference: rawData?.id || rawData?.lencoReference || '',
            gatewayResponse:  rawData,
            failedAt:         new Date(),
            failureReason:    reason,
          },
        });

        return ctx.send({
          success:          false,
          immediateFailure: true,
          data: {
            paymentId,
            reference,
            lencoStatus:      'failed',
            reasonForFailure: reason,
            raw:              rawData,
          },
        });
      }

      await strapi.db.query('api::okrapay.okrapay').update({
        where: { id: okrapayRecord.id },
        data: {
          gatewayReference: result.gatewayReference,
          ...(result.lencoStatus === '3ds-auth-required' ? { paymentStatus: 'processing' } : {}),
        },
      });

      return ctx.send({
        success: true,
        data: {
          paymentId,
          reference,
          paymentUrl:   result.paymentUrl,
          lencoStatus:  result.lencoStatus,
          redirectUrl:  result.redirectUrl,
          gatewayName,
          gatewayConfig: result.raw,
          amount:        numAmount,
        },
      });
    } catch (err: any) {
      strapi.log.error('[OkraPay:initiate]', err);
      return ctx.internalServerError(err.message || 'Failed to initiate payment');
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/okrapay/status/:reference   (auth required)
  // ──────────────────────────────────────────────────────────────────────────
  async getPaymentStatus(ctx: any) {
    try {
      const userId    = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      const { reference } = ctx.params;

      const record = await strapi.db.query('api::okrapay.okrapay').findOne({
        where: { reference, user: userId },
      });

      if (!record) return ctx.notFound('Payment record not found');

      if (['pending', 'processing'].includes(record.paymentStatus)) {
        try {
          const settings    = await getAdminSettings();
          const gatewayName = String(settings.externalPaymentGateway || 'lencopay');
          const gateway     = getPaymentGateway(gatewayName) as any;

          if (typeof gateway.getCollectionStatus === 'function') {
            const { status: lencoStatus, data: lencoData } =
              await gateway.getCollectionStatus(reference);

            if (lencoStatus === 'successful') {
              if (record.paymentStatus !== 'completed') {
                await strapi.db.query('api::okrapay.okrapay').update({
                  where: { id: record.id },
                  data: {
                    paymentStatus:    'completed',
                    gatewayReference: (lencoData as any).id || record.gatewayReference,
                    gatewayResponse:  lencoData,
                    paymentMethod:    resolvePaymentMethod(lencoData as any),
                    completedAt:      new Date(),
                  },
                });

                const parsed = parseReference(reference);
                if (parsed) {
                  const updated = await strapi.db.query('api::okrapay.okrapay').findOne({
                    where: { id: record.id },
                  });
                  handleCollectionSuccess(updated, parsed, lencoData as Record<string, unknown>)
                    .catch(e => strapi.log.error('[OkraPay:getStatus handler]', e));
                }

                return ctx.send({
                  paymentId:     record.paymentId,
                  reference:     record.reference,
                  purpose:       record.purpose,
                  amount:        record.amount,
                  paymentStatus: 'completed',
                  paymentMethod: resolvePaymentMethod(lencoData as any),
                  completedAt:   new Date(),
                  failureReason: null,
                });
              }
            } else if (lencoStatus === 'failed') {
              if (record.paymentStatus !== 'failed') {
                const reason = (lencoData as any).reasonForFailure || 'Payment failed';
                await strapi.db.query('api::okrapay.okrapay').update({
                  where: { id: record.id },
                  data: {
                    paymentStatus:    'failed',
                    gatewayResponse:  lencoData,
                    failedAt:         new Date(),
                    failureReason:    reason,
                  },
                });
                return ctx.send({
                  paymentId:     record.paymentId,
                  reference:     record.reference,
                  purpose:       record.purpose,
                  amount:        record.amount,
                  paymentStatus: 'failed',
                  failureReason: reason,
                });
              }
            }
          }
        } catch (pollErr: any) {
          strapi.log.warn(`[OkraPay:getStatus] Lenco poll failed: ${pollErr.message}`);
        }
      }

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

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/okrapay   (inbound collection webhook — no auth)
  // ──────────────────────────────────────────────────────────────────────────
  async webhook(ctx: any) {
    ctx.status = 200;
    ctx.body   = { received: true };

    try {
      const settings    = await getAdminSettings();
      const gatewayName = String(settings.externalPaymentGateway || 'lencopay');
      const gateway     = getPaymentGateway(gatewayName);

      const rawBody  = ctx.rawBody || JSON.stringify(ctx.request.body);
      const headers  = ctx.request.headers as Record<string, string>;
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

      const okrapayRecord = await strapi.db.query('api::okrapay.okrapay').findOne({
        where: { reference },
      });
      if (!okrapayRecord) {
        strapi.log.warn(`[OkraPay:webhook] No record for reference '${reference}'`);
        return;
      }

      const gatewayTxId   = gateway.extractGatewayTransactionId(data);
      const paymentMethod = resolvePaymentMethod(data);

      if (gateway.isCollectionSuccess(event, data)) {
        if (okrapayRecord.paymentStatus === 'completed') return;

        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: {
            paymentStatus:    'completed',
            gatewayReference: gatewayTxId || okrapayRecord.gatewayReference,
            gatewayResponse:  data,
            paymentMethod,
            completedAt:      new Date(),
          },
        });

        const updated = await strapi.db.query('api::okrapay.okrapay').findOne({
          where: { id: okrapayRecord.id },
        });
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
          },
        });

        if (okrapayRecord.user) {
          socketService.emitPaymentFailed(
            okrapayRecord.user,
            parsed.purpose === 'ridepay' ? 'rider' : 'driver',
            okrapayRecord.amount,
            (data as any).reasonForFailure || 'Payment failed',
            okrapayRecord.paymentId,
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
  async withdrawWebhook(ctx: any) {
    ctx.status = 200;
    ctx.body   = { received: true };

    try {
      const settings    = await getAdminSettings();
      const gatewayName = String(settings.externalPaymentGateway || 'lencopay');
      const gateway     = getPaymentGateway(gatewayName);

      const rawBody  = ctx.rawBody || JSON.stringify(ctx.request.body);
      const headers  = ctx.request.headers as Record<string, string>;
      const verified = gateway.verifyWebhook(headers, rawBody);
      if (!verified.valid) return;

      const { event, data } = verified;
      const reference = gateway.extractReference(data);
      if (!reference) return;

      const parsed = parseReference(reference);
      if (!parsed || parsed.purpose !== 'withdraw') return;

      const okrapayRecord = await strapi.db.query('api::okrapay.okrapay').findOne({
        where: { reference },
      });
      if (!okrapayRecord) return;

      const gatewayTxId = gateway.extractGatewayTransactionId(data);

      if (gateway.isPayoutCompleted(event, data)) {
        if (okrapayRecord.paymentStatus === 'completed') return;

        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: {
            paymentStatus:    'completed',
            gatewayReference: gatewayTxId,
            gatewayResponse:  data,
            completedAt:      new Date(),
          },
        });

        const updated = await strapi.db.query('api::okrapay.okrapay').findOne({
          where: { id: okrapayRecord.id },
        });
        await handleWithdrawalCompleted(updated, String(okrapayRecord.user), data);

      } else if (gateway.isPayoutFailed(event, data)) {
        await strapi.db.query('api::okrapay.okrapay').update({
          where: { id: okrapayRecord.id },
          data: {
            paymentStatus:    'failed',
            gatewayReference: gatewayTxId,
            gatewayResponse:  data,
            failedAt:         new Date(),
            failureReason:    (data as any).reasonForFailure || 'Withdrawal failed',
          },
        });

        const updated = await strapi.db.query('api::okrapay.okrapay').findOne({
          where: { id: okrapayRecord.id },
        });
        await handleWithdrawalFailed(updated, String(okrapayRecord.user), data);
      }
    } catch (err) {
      strapi.log.error('[OkraPay:withdrawWebhook]', err);
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/okrapay/request-withdrawal   (auth required)
  //
  // BUG FIX: if gateway.initiatePayout() throws, we now restore the
  // optimistically-deducted balance and return a proper error response
  // instead of leaving the driver with a phantom deduction.
  // ──────────────────────────────────────────────────────────────────────────
  async requestWithdrawal(ctx: any) {
    let dpRecord: any  = null;
    let balanceField   = 'currentBalance';
    let currentBalance = 0;
    let withdrawal: any = null;
    let okrapayRecord: any = null;

    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized('Authentication required');

      const {
        amount,
        method        = 'mobile_money',
        narration,
        phone         = '',
        operator      = '',
        accountName   = '',
        accountNumber = '',
        bankId        = '',
      } = ctx.request.body as Record<string, any>;

      if (!amount) return ctx.badRequest('amount is required');

      if (method === 'mobile_money' && (!phone || !operator)) {
        return ctx.badRequest('phone and operator are required for mobile_money withdrawals');
      }
      if (method === 'bank_account' && (!accountNumber || !bankId || !accountName)) {
        return ctx.badRequest('accountNumber, bankId and accountName are required for bank_account withdrawals');
      }

      const numAmount = parseFloat(amount);

      const settings         = await getAdminSettings();
      const withdrawableMode = (settings.withdrawableBalance || 'earnings') as 'float' | 'earnings';
      const minimumWithdraw  = parseFloat(settings.minimumWithdrawAmount ?? 50);
      const gatewayName      = String(settings.externalPaymentGateway || 'lencopay');

      if (numAmount < minimumWithdraw) {
        return ctx.badRequest(`Minimum withdrawal amount is ${minimumWithdraw}`);
      }

      const user         = await getUserWithCountry(userId);
      const userCountry  = user?.country;
      const countryCode  = (userCountry?.code          || 'zm').toLowerCase();
      const phoneCode    = (userCountry?.phoneCode      || '260').replace(/\D/g, '');
      const currencyCode = (userCountry?.currency?.code || 'ZMW').toUpperCase();

      const formattedPhone = phone ? normalisePhone(phone, phoneCode) : '';

      const userForBalance = await strapi.db.query('plugin::users-permissions.user').findOne({
        where:    { id: userId },
        populate: { driverProfile: { select: ['id'] } },
      });

      if (!userForBalance?.driverProfile?.id) {
        return ctx.badRequest('Driver profile not found');
      }

      dpRecord = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where:  { id: userForBalance.driverProfile.id },
        select: ['id', 'floatBalance', 'withdrawableFloatBalance', 'currentBalance'],
      });

      if (withdrawableMode === 'float') {
        currentBalance = parseFloat(dpRecord?.withdrawableFloatBalance || '0');
        balanceField   = 'withdrawableFloatBalance';
      } else {
        currentBalance = parseFloat(dpRecord?.currentBalance || '0');
        balanceField   = 'currentBalance';
      }

      if (currentBalance < numAmount) {
        return ctx.badRequest(
          `Insufficient ${withdrawableMode === 'float' ? 'withdrawable float' : 'earnings'} balance. Available: ${currentBalance}`,
        );
      }

      // ── Optimistic balance deduction ────────────────────────────────────────
      const newBalance = currentBalance - numAmount;
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: dpRecord.id },
        data:  { [balanceField]: newBalance },
      });

      const reference = buildReference(
        userId,
        'withdraw',
        method === 'mobile_money' ? formattedPhone : accountNumber,
      );
      const paymentId = `OKRA-WD-${Date.now()}`;

      // Create withdrawal record
      withdrawal = await strapi.db.query('api::withdrawal.withdrawal').create({
        data: {
          withdrawalId:     `WD-${Date.now()}`,
          user:             userId,
          amount:           numAmount,
          method,
          provider:         operator ? operator.toLowerCase() : (bankId || ''),
          accountNumber:    method === 'mobile_money' ? formattedPhone : accountNumber,
          accountName,
          withdrawalStatus: 'processing',
          withdrawableMode,
          balanceBefore:    currentBalance,
          balanceAfter:     newBalance,
          requestedAt:      new Date(),
        },
      });

      // Create okrapay record
      okrapayRecord = await strapi.db.query('api::okrapay.okrapay').create({
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
        },
      });

      await strapi.db.query('api::withdrawal.withdrawal').update({
        where: { id: withdrawal.id },
        data:  { okrapayTransaction: okrapayRecord.id },
      });

      // ── Call gateway — if this throws we restore the balance ────────────────
      const gateway = getPaymentGateway(gatewayName);
      const result  = await gateway.initiatePayout({
        reference,
        amount:        numAmount,
        currency:      currencyCode,
        narration:     narration || `Withdrawal for user ${userId}`,
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
        data:  { gatewayReference: result.gatewayReference },
      });
      await strapi.db.query('api::withdrawal.withdrawal').update({
        where: { id: withdrawal.id },
        data:  { gatewayReference: result.gatewayReference },
      });

      strapi.log.info(
        `[OkraPay:requestWithdrawal] Withdrawal ${withdrawal.id} initiated for user ${userId}, ` +
        `amount ${numAmount}, mode '${withdrawableMode}', field '${balanceField}'`,
      );

      return ctx.send({
        success: true,
        data: {
          withdrawalId: withdrawal.withdrawalId,
          reference,
          status:  'processing',
          amount:  numAmount,
          message: 'Withdrawal initiated. Funds will be sent to your account shortly.',
        },
      });

    } catch (err: any) {
      strapi.log.error('[OkraPay:requestWithdrawal]', err);

      // ── Rollback: restore the deducted balance if the gateway call failed ────
      if (dpRecord?.id && currentBalance > 0) {
        try {
          await strapi.db.query('driver-profiles.driver-profile').update({
            where: { id: dpRecord.id },
            data:  { [balanceField]: currentBalance },
          });
          strapi.log.info(
            `[OkraPay:requestWithdrawal] Rolled back balance for field '${balanceField}' → ${currentBalance}`,
          );
        } catch (rollbackErr) {
          strapi.log.error('[OkraPay:requestWithdrawal] Balance rollback failed:', rollbackErr);
        }
      }

      // Mark withdrawal as failed if it was already created
      if (withdrawal?.id) {
        try {
          await strapi.db.query('api::withdrawal.withdrawal').update({
            where: { id: withdrawal.id },
            data: {
              withdrawalStatus: 'failed',
              failureReason:    err.message || 'Gateway error',
            },
          });
        } catch { /* non-fatal */ }
      }

      // Mark okrapay record as failed if it was already created
      if (okrapayRecord?.id) {
        try {
          await strapi.db.query('api::okrapay.okrapay').update({
            where: { id: okrapayRecord.id },
            data: {
              paymentStatus: 'failed',
              failedAt:      new Date(),
              failureReason: err.message || 'Gateway error',
            },
          });
        } catch { /* non-fatal */ }
      }

      return ctx.internalServerError(err.message || 'Failed to initiate withdrawal');
    }
  }

}));