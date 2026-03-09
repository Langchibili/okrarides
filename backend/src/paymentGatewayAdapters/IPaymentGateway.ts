/**
 * IPaymentGateway — contract every gateway adapter must satisfy.
 * PATH: backend/src/paymentGatewayAdapters/IPaymentGateway.ts
 */

export interface InitiatePaymentParams {
  reference:   string;
  amount:      number;
  currency:    string;
  email:       string;
  customer: {
    firstName: string;
    lastName:  string;
    phone?:    string;
  };
  /** Which collection channel to use */
  paymentType?: 'mobile_money' | 'card';

  // ── Mobile Money ──────────────────────────────────────────────────────────
  phone?:    string;                          // e.g. "0971234567"
  operator?: string;                         // 'mtn' | 'airtel' | 'zamtel' | 'tnm'
  country?:  string;                         // 'zm' | 'mw'

  // ── Card ──────────────────────────────────────────────────────────────────
  card?: {
    number:      string;
    expiryMonth: string;   // "MM"
    expiryYear:  string;   // "YYYY"
    cvv:         string;
  };
  billing?: {
    streetAddress: string;
    city:          string;
    state?:        string;
    postalCode:    string;
    country:       string;
  };
  redirectUrl?: string;

  // ── Shared ────────────────────────────────────────────────────────────────
  channels?:    string[];
  callbackUrl?: string;
  narration?:   string;
  metadata?:    Record<string, unknown>;
}

export interface InitiatePaymentResult {
  /** Lenco's transaction id (data.id) */
  gatewayReference: string;
  /** 3DS redirect URL, or '' for mobile money */
  paymentUrl:  string;
  /** Lenco raw status: 'pay-offline' | 'pending' | '3ds-auth-required' | 'successful' */
  lencoStatus?: string;
  redirectUrl?: string;
  raw:          unknown;
}

export interface InitiatePayoutParams {
  reference: string;
  amount:    number;
  currency:  string;
  narration?: string;
  /** 'mobile_money' | 'bank_account' */
  method: string;

  // ── Mobile Money ──────────────────────────────────────────────────────────
  phone?:    string;
  operator?: string;   // 'mtn' | 'airtel' | 'zamtel' | 'tnm'
  country?:  string;   // 'zm' | 'mw'

  // ── Bank Account ──────────────────────────────────────────────────────────
  accountNumber?: string;
  accountName?:   string;
  bankId?:        string;   // Lenco bank UUID

  // ── Legacy / fallback ─────────────────────────────────────────────────────
  provider?:  string;
  metadata?:  Record<string, unknown>;
}

export interface InitiatePayoutResult {
  gatewayReference: string;
  lencoTransferId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  raw:    unknown;
}

export interface VerifyWebhookResult {
  valid: boolean;
  event: string;
  data:  Record<string, unknown>;
}

export interface IPaymentGateway {
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  initiatePayout(params: InitiatePayoutParams):   Promise<InitiatePayoutResult>;
  verifyWebhook(headers: Record<string, string>, rawBody: string): VerifyWebhookResult;
  isCollectionSuccess(event: string, data: Record<string, unknown>): boolean;
  isCollectionFailed(event: string,  data: Record<string, unknown>): boolean;
  isPayoutCompleted(event: string,   data: Record<string, unknown>): boolean;
  isPayoutFailed(event: string,      data: Record<string, unknown>): boolean;
  extractReference(data: Record<string, unknown>): string | null;
  extractGatewayTransactionId(data: Record<string, unknown>): string;
}