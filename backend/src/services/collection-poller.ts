/**
 * OkraPay Collection Poller
 * PATH: backend/src/api/okrapay/services/collection-poller.ts
 *
 * Called from the Strapi cron task (config/cron-tasks.ts) every 20 seconds.
 * Finds all pending / processing collection records and queries
 *   GET /access/v2/collections/status/:reference
 * then delegates to the same domain handlers used by the webhook.
 *
 * This is the fallback / guarantee mechanism — the webhook is the primary
 * notification channel; polling handles cases where webhooks are delayed or
 * missed.
 */

import { getPaymentGateway } from '../paymentGatewayAdapters/';
import { SendEmailNotification } from './messages';
import socketService from './socketService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OkrapayRecord {
  id:               number;
  paymentId:        string;
  reference:        string;
  purpose:          string;
  direction:        string;
  amount:           number;
  paymentStatus:    string;
  gatewayName:      string;
  gatewayReference: string;
  relatedEntityId:  string | null;
  user:             number | { id: number };
  metadata:         Record<string, unknown> | null;
  initiatedAt:      Date;
}

// ─── Admin settings ───────────────────────────────────────────────────────────

async function getAdminSettings(): Promise<Record<string, any>> {
  return (await strapi.db.query('api::admn-setting.admn-setting').findOne({})) || {};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveUserId(record: OkrapayRecord): number {
  return typeof record.user === 'object' ? record.user.id : record.user;
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

// ─── Domain handlers ──────────────────────────────────────────────────────────
// These mirror the handlers in the main controller but are self-contained so
// the poller can call them without coupling to the controller factory.

async function handleFloatTopupSuccess(
  record: OkrapayRecord,
  userId: number,
  lencoData: Record<string, unknown>,
): Promise<void> {
  try {
    const relatedId = record.relatedEntityId;

    const topup = await strapi.db.query('api::float-topup.float-topup').findOne({
      where: { id: relatedId },
    });

    if (!topup) {
      strapi.log.error(`[Poller:floatadd] Float topup ${relatedId} not found`);
      return;
    }
    if (topup.floatStatus === 'completed') {
      strapi.log.warn(`[Poller:floatadd] Topup ${relatedId} already completed — skipping`);
      return;
    }

    // ── Fetch user then the driver-profile component directly ────────────────
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName'],
      populate: { driverProfile: { select: ['id'] } },
    });

    if (!user?.driverProfile?.id) {
      strapi.log.error(`[Poller:floatadd] Driver profile not found for user ${userId}`);
      return;
    }

    // ── Fetch the component directly so we have the current balance ──────────
    const driverProfile = await strapi.db.query('driver-profiles.driver-profile').findOne({
      where: { id: user.driverProfile.id },
      select: ['id', 'floatBalance'],
    });

    const currentFloat = parseFloat(driverProfile?.floatBalance || '0');
    const topupAmount  = parseFloat(topup.amount);
    const newFloat     = currentFloat + topupAmount;

    // ── Update float-topup record ────────────────────────────────────────────
    await strapi.db.query('api::float-topup.float-topup').update({
      where: { id: relatedId },
      data: {
        floatStatus:        'completed',
        floatBalanceBefore: currentFloat,
        floatBalanceAfter:  newFloat,
        completedAt:        new Date(),
        gatewayReference:   record.gatewayReference,
        gatewayResponse:    lencoData,
      },
    });

    // ── Update driver-profile component directly ─────────────────────────────
    // Fetch current withdrawable balance first
    const currentWithdrawable = parseFloat(driverProfile?.withdrawableFloatBalance || '0');
    const newWithdrawable = currentWithdrawable + topupAmount;

    await strapi.db.query('driver-profiles.driver-profile').update({
    where: { id: user.driverProfile.id },
    data:  {
        floatBalance:            newFloat,
        withdrawableFloatBalance: newWithdrawable,
    },
    })

    // ── Ledger entry ─────────────────────────────────────────────────────────
    await strapi.db.query('api::ledger-entry.ledger-entry').create({
      data: {
        entryId:       `LED-FT-${Date.now()}`,
        driver:        userId,
        type:          'float_topup',
        amount:        topupAmount,
        source:        'okrapay',
        ledgerStatus:  'settled',
        balanceBefore: currentFloat,
        balanceAfter:  newFloat,
        description:   `Float top-up via OkraPay — ref ${record.reference}`,
        metadata:      { okrapayId: record.id },
      },
    });

    // ── Notify driver via socket ──────────────────────────────────────────────
    socketService.emitPaymentSuccess(
      userId, 'driver', topupAmount, record.paymentId, 'float_topup',
    );

    // ── Notify admin emails ───────────────────────────────────────────────────
    try {
      const settings = await getAdminSettings();
      const adminEmails: string[] = Array.isArray(settings.adminSupportEmails)
        ? settings.adminSupportEmails
        : [];

      const driverName = [user.firstName, user.lastName].filter(Boolean).join(' ')
        || user.email
        || `User #${userId}`;

      const emailBody =
        `Float Top-Up Notification\n\n` +
        `Driver: ${driverName}\n` +
        `Email: ${user.email || 'N/A'}\n` +
        `Amount: ${topupAmount} (top-up)\n` +
        `Balance before: ${currentFloat}\n` +
        `Balance after:  ${newFloat}\n` +
        `Reference: ${record.reference}\n` +
        `Timestamp: ${new Date().toISOString()}\n`;

      adminEmails.forEach(email => {
        try { SendEmailNotification(email, emailBody); } catch { /* non-fatal */ }
      });
    } catch (emailErr) {
      strapi.log.warn('[Poller:floatadd] Failed to send admin email:', emailErr);
    }

    strapi.log.info(
      `[Poller:floatadd] +${topupAmount} → user ${userId}, new float ${newFloat}`,
    );
  } catch (err) {
    strapi.log.error('[Poller:floatadd]', err);
  }
}

async function handleSubscriptionPaymentSuccess(
  record: OkrapayRecord,
  userId: number,
  lencoData: Record<string, unknown>,
): Promise<void> {
  try {
    const relatedId = record.relatedEntityId;
    const meta      = record.metadata || {};
    const action    = (meta as any).subscriptionAction || 'subscribe';

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: { driverProfile: { select: ['id', 'subscriptionStatus'] } },
    });
    if (!user?.driverProfile) return;

    const transactionId = `TXN-SUBPAY-${Date.now()}`;

    if (action === 'renew') {
      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { id: relatedId },
        populate: { subscriptionPlan: true },
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
        },
      });

      // ── Update component directly ──────────────────────────────────────────
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: { subscriptionStatus: 'active' },
      });
    } else {
      const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
        where: { id: relatedId },
      });
      if (!plan) return;

      const existing = await strapi.db.query('api::driver-subscription.driver-subscription').findOne({
        where: { driver: userId, subscriptionStatus: { $in: ['active', 'trial'] } },
      });
      if (existing) {
        await strapi.db.query('api::driver-subscription.driver-subscription').update({
          where: { id: existing.id },
          data: { subscriptionStatus: 'expired', autoRenew: false },
        });
      }

      const now       = new Date();
      const expiresAt = calculateExpiryDate(now, plan.durationType, plan.durationValue || 1);

      const subscription = await strapi.db.query('api::driver-subscription.driver-subscription').create({
        data: {
          subscriptionId:            `SUB-${Date.now()}`,
          driver:                    userId,
          subscriptionPlan:          parseInt(relatedId!),
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
        },
      });

      // ── Fetch driverProfile component, then update ─────────────────────────
      const dpRecord = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        select: ['id'],
      });
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: dpRecord.id },
        data: {
          subscriptionStatus:  'active',
          subscriptionPlan:    parseInt(relatedId!),
          currentSubscription: subscription.id,
        },
      });
    }

    await strapi.db.query('api::transaction.transaction').create({
      data: {
        transactionId,
        user:              userId,
        type:              'subscription_payment',
        amount:            record.amount,
        transactionStatus: 'completed',
        paymentMethod:     'okrapay',
        gatewayReference:  record.gatewayReference,
        gatewayResponse:   lencoData,
        processedAt:       new Date(),
      },
    });

    socketService.emitPaymentSuccess(
      userId, 'driver', record.amount, record.paymentId, 'subscription_payment',
    );
  } catch (err) {
    strapi.log.error('[Poller:subpay]', err);
  }
}

async function handleRidePaymentSuccess(
  record: OkrapayRecord,
  rideId: string,
  lencoData: Record<string, unknown>,
): Promise<void> {
  try {
    const ride = await strapi.db.query('api::ride.ride').findOne({
      where: { id: rideId },
      populate: { rider: { select: ['id'] } },
    });
    if (!ride) return;
    if (ride.paymentStatus === 'completed') return;

    const riderId = ride.rider?.id ?? ride.rider;

    await strapi.db.query('api::ride.ride').update({
      where: { id: rideId },
      data: { paymentMethod: 'okrapay', paymentStatus: 'completed' },
    });

    await strapi.db.query('api::transaction.transaction').create({
      data: {
        transactionId:     `TXN-RIDE-${Date.now()}`,
        user:              riderId,
        type:              'ride_payment',
        amount:            record.amount,
        transactionStatus: 'completed',
        paymentMethod:     'okrapay',
        ride:              parseInt(rideId),
        gatewayReference:  record.gatewayReference,
        gatewayResponse:   lencoData,
        processedAt:       new Date(),
      },
    });

    socketService.emitPaymentSuccess(
      riderId, 'rider', record.amount, record.paymentId, 'ride_payment',
    );
  } catch (err) {
    strapi.log.error('[Poller:ridepay]', err);
  }
}

async function handleWalletTopupSuccess(
  record: OkrapayRecord,
  userId: number,
  lencoData: Record<string, unknown>,
): Promise<void> {
  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: { riderProfile: { select: ['id'] } },
    });
    if (!user?.riderProfile?.id) return;

    // ── Fetch rider-profile component directly ────────────────────────────────
    const riderProfile = await strapi.db.query('rider-profiles.rider-profile').findOne({
      where: { id: user.riderProfile.id },
      select: ['id', 'walletBalance'],
    });

    const currentBalance = parseFloat(riderProfile?.walletBalance || '0');
    const topupAmount    = parseFloat(String(record.amount));
    const newBalance     = currentBalance + topupAmount;

    await strapi.db.query('rider-profiles.rider-profile').update({
      where: { id: user.riderProfile.id },
      data: { walletBalance: newBalance },
    });

    await strapi.db.query('api::transaction.transaction').create({
      data: {
        transactionId:     `TXN-WALLET-${Date.now()}`,
        user:              userId,
        type:              'float_topup',
        amount:            topupAmount,
        transactionStatus: 'completed',
        paymentMethod:     'okrapay',
        gatewayReference:  record.gatewayReference,
        gatewayResponse:   lencoData,
        processedAt:       new Date(),
      },
    });

    socketService.emitPaymentSuccess(
      userId, 'rider', topupAmount, record.paymentId, 'wallet_topup',
    );
  } catch (err) {
    strapi.log.error('[Poller:walletTopup]', err);
  }
}

async function handleCollectionFailed(
  record: OkrapayRecord,
  userId: number,
  lencoData: Record<string, unknown>,
): Promise<void> {
  const reason = (lencoData as any).reasonForFailure || 'Payment failed';
  const role   = record.purpose === 'ridepay' ? 'rider' : 'driver';
  socketService.emitPaymentFailed(userId, role, record.amount, reason, record.paymentId);
}

// ─── Route to correct domain handler ─────────────────────────────────────────

async function dispatchSuccess(
  record: OkrapayRecord,
  userId: number,
  lencoData: Record<string, unknown>,
): Promise<void> {
  switch (record.purpose) {
    case 'floatadd':
      await handleFloatTopupSuccess(record, userId, lencoData);
      break;
    case 'subpay':
      await handleSubscriptionPaymentSuccess(record, userId, lencoData);
      break;
    case 'ridepay':
      await handleRidePaymentSuccess(record, record.relatedEntityId!, lencoData);
      break;
    case 'walletTopup':
      await handleWalletTopupSuccess(record, userId, lencoData);
      break;
    default:
      strapi.log.warn(`[Poller] Unhandled purpose '${record.purpose}' ref ${record.reference}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — called from cron-tasks.ts
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Poll Lenco for status on every pending / processing collection record.
 * Designed to be called on a 20-second schedule.
 */
export async function pollPendingCollections(): Promise<void> {
  try {
    const settings    = await getAdminSettings();
    const gatewayName = String(settings.externalPaymentGateway || 'lencopay');
    const gateway     = getPaymentGateway(gatewayName) as any;

    if (typeof gateway.getCollectionStatus !== 'function') {
      strapi.log.warn('[Poller] Gateway does not support getCollectionStatus — skipping poll');
      return;
    }

    // Find all collection records that are still pending or processing
    const pendingRecords: OkrapayRecord[] = await strapi.db
      .query('api::okrapay.okrapay')
      .findMany({
        where: {
          direction:     'collection',
          paymentStatus: { $in: ['pending', 'processing'] },
        },
        // Only poll records initiated in the last 2 hours to avoid runaway queries
        // on very old stuck records. Adjust window as needed.
        filters: {
          initiatedAt: {
            $gte: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        },
        limit: 50,
        orderBy: { initiatedAt: 'asc' },
      });

    if (!pendingRecords.length) return;

    strapi.log.debug(`[Poller] Checking ${pendingRecords.length} pending collection(s)`);

    await Promise.allSettled(
      pendingRecords.map(record => pollSingleRecord(record, gateway)),
    );
  } catch (err) {
    strapi.log.error('[Poller:pollPendingCollections]', err);
  }
}

async function pollSingleRecord(record: OkrapayRecord, gateway: any): Promise<void> {
  try {
    const { status, data: lencoData } = await gateway.getCollectionStatus(record.reference);

    // ── Still waiting — do nothing this tick ──────────────────────────────────
    if (['pending', 'pay-offline', '3ds-auth-required'].includes(status)) return;

    const userId = resolveUserId(record);

    if (status === 'successful') {
      // Idempotency: skip if already processed
      const fresh = await strapi.db.query('api::okrapay.okrapay').findOne({
        where: { id: record.id },
        select: ['id', 'paymentStatus', 'gatewayReference'],
      });
      if (fresh?.paymentStatus === 'completed') return;

      // Update okrapay record
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

      // Re-fetch so domain handlers have the latest reference/gatewayReference
      const updated: OkrapayRecord = await strapi.db.query('api::okrapay.okrapay').findOne({
        where: { id: record.id },
      });

      await dispatchSuccess(updated, userId, lencoData as Record<string, unknown>);

    } else if (status === 'failed') {
      const fresh = await strapi.db.query('api::okrapay.okrapay').findOne({
        where: { id: record.id },
        select: ['id', 'paymentStatus'],
      });
      if (fresh?.paymentStatus === 'failed') return;

      await strapi.db.query('api::okrapay.okrapay').update({
        where: { id: record.id },
        data: {
          paymentStatus:    'failed',
          gatewayReference: (lencoData as any).id || record.gatewayReference,
          gatewayResponse:  lencoData,
          failedAt:         new Date(),
          failureReason:    (lencoData as any).reasonForFailure || 'Payment failed',
        },
      });

      await handleCollectionFailed(record, userId, lencoData as Record<string, unknown>);
    }
  } catch (err: any) {
    strapi.log.warn(`[Poller] Error checking ref ${record.reference}: ${err.message}`);
  }
}

function resolvePaymentMethod(data: Record<string, unknown>): string {
  if ((data as any).mobileMoneyDetails) return 'mobile_money';
  if ((data as any).cardDetails)        return 'card';
  if ((data as any).bankAccountDetails) return 'bank_transfer';
  return 'mobile_money';
}