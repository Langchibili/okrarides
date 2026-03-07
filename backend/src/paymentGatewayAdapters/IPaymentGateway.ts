/**
 * IPaymentGateway — contract every payment-gateway adapter must satisfy.
 * New gateways (Stripe, Flutterwave, etc.) only need to implement this interface
 * and register themselves in the factory (index.ts).
 */

export interface InitiatePaymentParams {
  /** Structured reference: ref-id-{userId}-purpose-{code}-{timestamp} */
  reference: string;
  amount: number;
  currency: string;
  /** Customer email */
  email: string;
  customer: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  /** Channels to enable, e.g. ['mobile-money', 'card'] */
  channels?: string[];
  /** Where to redirect the user after payment */
  callbackUrl?: string;
  /** Human-readable narration shown to the customer */
  narration?: string;
  metadata?: Record<string, unknown>;
}

export interface InitiatePaymentResult {
  /** Gateway-specific transaction / payment-intent ID */
  gatewayReference: string;
  /** Redirect URL to send the browser to (hosted checkout page, etc.) */
  paymentUrl: string;
  /** Raw gateway response for auditing */
  raw: unknown;
}

export interface InitiatePayoutParams {
  reference: string;
  amount: number;
  currency: string;
  accountNumber: string;
  accountName: string;
  /** e.g. 'mobile_money' | 'bank_transfer' */
  method: string;
  /** Mobile-money operator, bank code, etc. */
  provider?: string;
  narration?: string;
  metadata?: Record<string, unknown>;
}

export interface InitiatePayoutResult {
  gatewayReference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  raw: unknown;
}

export interface VerifyWebhookResult {
  valid: boolean;
  event: string;
  data: Record<string, unknown>;
}

export interface IPaymentGateway {
  /**
   * Initiate a payment collection from a customer.
   * Returns a payment URL to redirect the user to.
   */
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;

  /**
   * Initiate a payout (withdrawal) to a customer.
   */
  initiatePayout(params: InitiatePayoutParams): Promise<InitiatePayoutResult>;

  /**
   * Verify an inbound webhook request and extract the event + data.
   * @param headers - raw request headers
   * @param rawBody - raw (string) request body before JSON.parse
   */
  verifyWebhook(headers: Record<string, string>, rawBody: string): VerifyWebhookResult;

  /**
   * Determine whether a webhook event represents a successful collection.
   */
  isCollectionSuccess(event: string, data: Record<string, unknown>): boolean;

  /**
   * Determine whether a webhook event represents a failed collection.
   */
  isCollectionFailed(event: string, data: Record<string, unknown>): boolean;

  /**
   * Determine whether a webhook event represents a completed payout.
   */
  isPayoutCompleted(event: string, data: Record<string, unknown>): boolean;

  /**
   * Determine whether a webhook event represents a failed payout.
   */
  isPayoutFailed(event: string, data: Record<string, unknown>): boolean;

  /**
   * Extract the client reference (our reference string) from the webhook data.
   */
  extractReference(data: Record<string, unknown>): string | null;

  /**
   * Extract the gateway's own transaction ID from the webhook data.
   */
  extractGatewayTransactionId(data: Record<string, unknown>): string;
}