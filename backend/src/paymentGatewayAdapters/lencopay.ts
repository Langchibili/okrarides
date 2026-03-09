/**
 * LencoPayAdapter — v2
 *
 * PATH: backend/src/paymentGatewayAdapters/lencopay.ts
 *
 * Collections  (money IN):
 *   Mobile Money → POST /access/v2/collections/mobile-money
 *   Card         → POST /access/v2/collections/card  (JWE-encrypted payload)
 *   Status poll  → GET  /access/v2/collections/status/:reference
 *
 * Transfers/Payouts  (money OUT):
 *   Mobile Money → POST /access/v2/transfers/mobile-money
 *   Bank Account → POST /access/v2/transfers/bank-account
 *
 * Env vars required:
 *   LENCO_SECRET_KEY   — Bearer token for Authorization header
 *   LENCO_ACCOUNT_ID   — 36-char account UUID to debit for payouts
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

let jose: any;

const BASE = 'https://api.lenco.co/access/v2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${process.env.LENCO_SECRET_KEY || ''}`,
  };
}

async function lencoPost<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
  const res  = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(body),
  });
  const json = (await res.json()) as any;
  if (!res.ok || json.status === false) {
    throw new Error(`[LencoPayAdapter] ${path} failed: ${json.message || res.statusText}`);
  }
  return json as T;
}

async function lencoGet<T = any>(path: string): Promise<T> {
  const res  = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = (await res.json()) as any;
  if (!res.ok || json.status === false) {
    throw new Error(`[LencoPayAdapter] GET ${path} failed: ${json.message || res.statusText}`);
  }
  return json as T;
}

// ─── JWE encryption for card payloads ────────────────────────────────────────

async function encryptCardPayload(plainObj: Record<string, unknown>): Promise<string> {
  // Lazy load jose module
  if (!jose) {
    jose = await import('jose');
  }

  // Step 1: Get RSA public key from Lenco
  const keyRes = await lencoGet<{ status: boolean; data: { publicKey: any } }>('/encryption-key');
  const jwk    = keyRes.data.publicKey; // already a JWK object from Lenco

  // Step 2: Import the public key
  const publicKey = await jose.importJWK(jwk, 'RSA-OAEP-256');

  // Step 3: JWE compact serialisation
  const encoder = new TextEncoder();
  const jwe     = await new jose.CompactEncrypt(encoder.encode(JSON.stringify(plainObj)))
    .setProtectedHeader({
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM',
      cty: 'application/json',
      kid: jwk.kid,
    })
    .encrypt(publicKey);

  return jwe;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class LencoPayAdapter implements IPaymentGateway {
  private accountId: string;

  constructor() {
    this.accountId = process.env.LENCO_ACCOUNT_ID || '';
    if (!process.env.LENCO_SECRET_KEY) {
      throw new Error('[LencoPayAdapter] LENCO_SECRET_KEY is not set');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Collections (money IN)
  // ──────────────────────────────────────────────────────────────────────────

  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const paymentType = params.paymentType || 'mobile_money';

    if (paymentType === 'card') {
      return this._initiateCardCollection(params);
    }
    return this._initiateMobileMoneyCollection(params);
  }

  // ── Mobile Money collection ───────────────────────────────────────────────

  private async _initiateMobileMoneyCollection(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    const body: Record<string, unknown> = {
      amount:    params.amount.toFixed(2),
      reference: params.reference,
      phone:     params.phone || params.customer.phone || '',
      operator:  params.operator || 'mtn',   // 'airtel' | 'mtn' | 'tnm'
      country:   params.country  || 'zm',    // 'zm' | 'mw'
      bearer:    'merchant',
    };

    const res = await lencoPost<{
      data: {
        id: string;
        reference: string;
        lencoReference: string;
        status: string;
        reasonForFailure?: string;
      };
    }>('/collections/mobile-money', body);
    const d = res.data;

    return {
      gatewayReference: d.id,
      paymentUrl:       '',          // mobile-money is offline; no redirect URL
      lencoStatus:      d.status,   // 'pay-offline' | 'pending' | 'successful' | 'failed'
      raw:              d,
    };
  }

  // ── Card collection (JWE-encrypted) ──────────────────────────────────────

  private async _initiateCardCollection(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    if (!params.card) throw new Error('[LencoPayAdapter] card details required for card payment');

    const plainPayload: Record<string, unknown> = {
      reference: params.reference,
      email:     params.email,
      amount:    params.amount.toFixed(2),
      currency:  params.currency || 'ZMW',
      bearer:    'merchant',
      customer: {
        firstName: params.customer.firstName,
        lastName:  params.customer.lastName,
      },
      billing: {
        streetAddress: params.billing?.streetAddress || '',
        city:          params.billing?.city          || '',
        state:         params.billing?.state         || '',
        postalCode:    params.billing?.postalCode    || '',
        country:       params.billing?.country       || 'ZM',
      },
      card: {
        number:      params.card.number.replace(/\s/g, ''),
        expiryMonth: params.card.expiryMonth,
        expiryYear:  params.card.expiryYear,   // 4-digit e.g. "2027"
        cvv:         params.card.cvv,
      },
      ...(params.redirectUrl ? { redirectUrl: params.redirectUrl } : {}),
    };

    const encryptedPayload = await encryptCardPayload(plainPayload);

    const res = await lencoPost<{
      data: {
        id: string;
        reference: string;
        lencoReference: string;
        status: string;            // 'pending' | 'successful' | 'failed' | '3ds-auth-required'
        reasonForFailure?: string;
        meta?: {
          authorization?: {
            mode:     string;
            redirect: string;
          };
        };
      };
    }>('/collections/card', { encryptedPayload });

    const d = res.data;

    const redirectUrl =
      d.status === '3ds-auth-required'
        ? d.meta?.authorization?.redirect || ''
        : '';

    return {
      gatewayReference: d.id,
      paymentUrl:       redirectUrl,
      lencoStatus:      d.status,
      redirectUrl,
      raw:              d,
    };
  }

  // ── Collection status (poll) ──────────────────────────────────────────────

  async getCollectionStatus(reference: string): Promise<{
    status: string;
    data:   Record<string, unknown>;
  }> {
    const res = await lencoGet<{ data: { status: string; [k: string]: unknown } }>(
      `/collections/status/${encodeURIComponent(reference)}`,
    );
    return { status: res.data.status, data: res.data as Record<string, unknown> };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Transfers / Payouts (money OUT)
  // ──────────────────────────────────────────────────────────────────────────

  async initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult> {
    if (!this.accountId) {
      throw new Error('[LencoPayAdapter] LENCO_ACCOUNT_ID is not set');
    }

    if (params.method === 'mobile_money') {
      return this._transferMobileMoney(params);
    }
    return this._transferBankAccount(params);
  }

  // ── Mobile Money transfer ─────────────────────────────────────────────────
  //   POST /access/v2/transfers/mobile-money
  //   Required: accountId, amount, reference
  //   Optional: narration, phone, operator, country

  private async _transferMobileMoney(
    params: InitiatePayoutParams,
  ): Promise<InitiatePayoutResult> {
    const body: Record<string, unknown> = {
      accountId: this.accountId,
      amount:    params.amount.toFixed(2),
      reference: params.reference,
      narration: params.narration || `Withdrawal ${params.reference}`,
      phone:     params.phone    || params.accountNumber || '',
      operator:  params.operator || params.provider     || 'mtn',
      country:   params.country  || 'zm',
    };

    const res = await lencoPost<{
      data: {
        id:             string;
        lencoReference: string;
        reference:      string | null;
        status:         string;
        reasonForFailure?: string | null;
      };
    }>('/transfers/mobile-money', body);

    const d = res.data;

    return {
      gatewayReference: d.id,
      lencoTransferId:  d.lencoReference,
      status:           d.status === 'successful' ? 'completed' : 'processing',
      raw:              d,
    };
  }

  // ── Bank Account transfer ─────────────────────────────────────────────────
  //   POST /access/v2/transfers/bank-account
  //   Required: accountId, amount, reference
  //   Optional: narration, accountNumber, bankId, country

  private async _transferBankAccount(
    params: InitiatePayoutParams,
  ): Promise<InitiatePayoutResult> {
    const body: Record<string, unknown> = {
      accountId:     this.accountId,
      amount:        params.amount.toFixed(2),
      reference:     params.reference,
      narration:     params.narration || `Withdrawal ${params.reference}`,
      accountNumber: params.accountNumber || '',
      bankId:        params.bankId        || params.provider || '',
      country:       params.country       || 'zm',
    };

    const res = await lencoPost<{
      data: {
        id:             string;
        lencoReference: string;
        reference:      string | null;
        status:         string;
        reasonForFailure?: string | null;
      };
    }>('/transfers/bank-account', body);

    const d = res.data;

    return {
      gatewayReference: d.id,
      lencoTransferId:  d.lencoReference,
      status:           d.status === 'successful' ? 'completed' : 'processing',
      raw:              d,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Webhook verification
  // ──────────────────────────────────────────────────────────────────────────

  verifyWebhook(headers: Record<string, string>, rawBody: string): VerifyWebhookResult {
    const signature = headers['x-lenco-signature'];
    if (!signature) return { valid: false, event: '', data: {} };

    // webhook_hash_key = SHA256(API_TOKEN)
    const webhookHashKey = crypto
      .createHash('sha256')
      .update(process.env.LENCO_SECRET_KEY || '')
      .digest('hex');

    const expected = crypto
      .createHmac('sha512', webhookHashKey)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) return { valid: false, event: '', data: {} };

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { valid: false, event: '', data: {} };
    }

    return { valid: true, event: parsed.event || '', data: parsed.data || {} };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Event classifiers
  // ──────────────────────────────────────────────────────────────────────────

  // Lenco collection events: collection.successful | collection.failed | collection.settled
  isCollectionSuccess(event: string, _data: Record<string, unknown>): boolean {
    return event === 'collection.successful' || event === 'collection.settled';
  }

  isCollectionFailed(event: string, _data: Record<string, unknown>): boolean {
    return event === 'collection.failed';
  }

  // Lenco transfer events: transfer.successful | transfer.failed
  isPayoutCompleted(event: string, _data: Record<string, unknown>): boolean {
    return event === 'transfer.successful';
  }

  isPayoutFailed(event: string, _data: Record<string, unknown>): boolean {
    return event === 'transfer.failed';
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Reference extraction
  // ──────────────────────────────────────────────────────────────────────────

  extractReference(data: Record<string, unknown>): string | null {
    return (
      (data.reference as string)            ||
      (data.clientReference as string)      ||
      (data.transactionReference as string) ||
      null
    );
  }

  extractGatewayTransactionId(data: Record<string, unknown>): string {
    return (data.id as string) || (data.lencoReference as string) || '';
  }
}

export default new LencoPayAdapter();