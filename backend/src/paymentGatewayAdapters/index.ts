//Okrarides\backend\src\paymentGatewayAdapters\index.ts
/**
 * Payment Gateway Adapter Factory
 *
 * Reads the `externalPaymentGateway` setting from Admin Settings and returns
 * the corresponding adapter instance.  Adding a new gateway only requires:
 *   1. Creating a new file in this folder that implements IPaymentGateway
 *   2. Registering it in the `adapters` map below
 *   3. Adding the enum value to Admin Settings schema
 */

import { IPaymentGateway } from './IPaymentGateway';
import lencopayAdapter from './lencopay';

// ─── Registry ────────────────────────────────────────────────────────────────

const adapters: Record<string, IPaymentGateway> = {
  lencopay: lencopayAdapter,
  // stripe: stripeAdapter,
  // flutterwave: flutterwaveAdapter,
};

// ─── Factory function ─────────────────────────────────────────────────────────

/**
 * Returns the payment gateway adapter configured in Admin Settings.
 * Falls back to lencopay if no setting is found.
 *
 * @param gatewayName - value of admn-setting.externalPaymentGateway
 */
export function getPaymentGateway(gatewayName?: string | null): IPaymentGateway {
  const key = (gatewayName || 'lencopay').toLowerCase();
  const adapter = adapters[key];

  if (!adapter) {
    strapi?.log?.warn(
      `[PaymentGatewayFactory] Unknown gateway '${key}', falling back to lencopay`
    );
    return lencopayAdapter;
  }

  return adapter;
}

export type { IPaymentGateway };