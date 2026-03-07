/**
 * LencoPayAdapter
 *
 * Adapter for the Lenco payment gateway (https://lenco.co).
 * Supports mobile money (MTN, Airtel) and card payments.
 *
 * Environment variables required:
 *   LENCO_SECRET_KEY   — your Lenco API secret key
 *   LENCO_PUBLIC_KEY   — your Lenco public key (used on the frontend)
 *   LENCO_ACCOUNT_ID   — the Lenco account ID to debit for payouts
 */

import crypto from 'crypto';
import {
  IPaymentGateway,
  InitiatePaymentParams,
  InitiatePaymentResult,
  InitiatePayoutParams,
  InitiatePayoutResult,
  VerifyWebhookResult,
} from './IPaymentGateway';

const LENCO_BASE_URL = 'https://api.lenco.co/access/v1';

export class LencoPayAdapter implements IPaymentGateway {
  private secretKey: string;
  private accountId: string;

  constructor() {
    this.secretKey = process.env.LENCO_SECRET_KEY || '';
    this.accountId = process.env.LENCO_ACCOUNT_ID || '';

    if (!this.secretKey) {
      throw new Error('[LencoPayAdapter] LENCO_SECRET_KEY environment variable is not set');
    }
  }

  // ─── Collection ─────────────────────────────────────────────────────────────

  /**
   * Lenco does not expose a server-side "create checkout session" REST endpoint
   * the way Stripe does.  Instead, the inline JS widget is loaded on the frontend
   * and the backend only receives webhook events.
   *
   * Here we return a specially crafted URL that the frontend can use to trigger
   * the Lenco inline widget via query-params, OR we pass back the config for the
   * frontend to call window.LencoPay.getPaid() directly.
   *
   * We store the intent record in the okrapay table and return the config;
   * the frontend component reads this and opens the widget.
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    // Lenco inline widget is frontend-driven; we construct the config payload
    // that the frontend needs and wrap it in a data URL the frontend can consume.
    const config = {
      key: process.env.LENCO_PUBLIC_KEY || '', 
      reference: params.reference,
      email: params.email,
      amount: params.amount.toFixed(2),
      currency: params.currency || 'ZMW',
      channels: params.channels || ['mobile-money', 'card'],
      customer: {
        firstName: params.customer.firstName,
        lastName: params.customer.lastName,
        phone: params.customer.phone || '',
      },
      callbackUrl: params.callbackUrl || '',
      narration: params.narration || '',
      metadata: params.metadata || {},
    };

    // paymentUrl is a JSON-encoded config string the frontend decodes to open the widget
    const paymentUrl = `/payment/lenco?config=${encodeURIComponent(JSON.stringify(config))}`;

    return {
      gatewayReference: params.reference, // Lenco uses our reference as the tx ref
      paymentUrl,
      raw: config,
    };
  }

  // ─── Payout / Transfer ───────────────────────────────────────────────────────

  async initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult> {
    // Lenco transfer endpoint: POST /transactions
    const payload: Record<string, unknown> = {
      accountId: this.accountId,
      amount: params.amount.toFixed(2),
      narration: params.narration || `Withdrawal ${params.reference}`,
      clientReference: params.reference,
    };

    if (params.method === 'mobile_money') {
      payload['type'] = 'mobile-money';
      payload['mobileMoneyDetails'] = {
        phone: params.accountNumber,
        operator: params.provider || 'mtn', // 'mtn' | 'airtel'
        country: 'zm',
        accountName: params.accountName,
      };
    } else {
      // bank transfer
      payload['type'] = 'bank-transfer';
      payload['bankAccountDetails'] = {
        accountNumber: params.accountNumber,
        bankCode: params.provider || '',
        accountName: params.accountName,
      };
    }

    const response = await fetch(`${LENCO_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as Record<string, any>;

    if (!response.ok || data.status === false) {
      throw new Error(`[LencoPayAdapter] Payout failed: ${data.message || response.statusText}`);
    }

    return {
      gatewayReference: data.data?.id || params.reference,
      status: 'processing',
      raw: data,
    };
  }

  // ─── Webhook ─────────────────────────────────────────────────────────────────

  verifyWebhook(headers: Record<string, string>, rawBody: string): VerifyWebhookResult {
    const signature = headers['x-lenco-signature'];

    if (!signature) {
      return { valid: false, event: '', data: {} };
    }

    // webhook_hash_key = SHA256(secretKey)
    const webhookHashKey = crypto
      .createHash('sha256')
      .update(this.secretKey)
      .digest('hex');

    const expectedHash = crypto
      .createHmac('sha512', webhookHashKey)
      .update(rawBody)
      .digest('hex');

    if (expectedHash !== signature) {
      return { valid: false, event: '', data: {} };
    }

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { valid: false, event: '', data: {} };
    }

    return {
      valid: true,
      event: parsed.event || '',
      data: parsed.data || {},
    };
  }

  // ─── Event classifiers ───────────────────────────────────────────────────────

  isCollectionSuccess(event: string, data: Record<string, unknown>): boolean {
    return (
      event === 'transaction.successful' ||
      event === 'collection.settled' ||
      (event === 'virtual-account.transaction.settled' && true)
    );
  }

  isCollectionFailed(event: string, _data: Record<string, unknown>): boolean {
    return event === 'transaction.failed';
  }

  isPayoutCompleted(event: string, data: Record<string, unknown>): boolean {
    return event === 'transaction.successful' && (data as any).type === 'debit';
  }

  isPayoutFailed(event: string, data: Record<string, unknown>): boolean {
    return event === 'transaction.failed' && (data as any).type === 'debit';
  }

  // ─── Reference extraction ────────────────────────────────────────────────────

  extractReference(data: Record<string, unknown>): string | null {
    return (
      (data.clientReference as string) ||
      (data.reference as string) ||
      (data.transactionReference as string) ||
      null
    );
  }

  extractGatewayTransactionId(data: Record<string, unknown>): string {
    return (data.id as string) || (data.lencoReference as string) || '';
  }
}

export default new LencoPayAdapter();