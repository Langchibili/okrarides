// ============================================================
// src/api/delivery-driver/routes/delivery-driver.ts
// ============================================================

export default {
  routes: [
    // ─── Toggle online / offline ──────────────────────────────────────────
    {
      method: 'POST',
      path:   '/delivery-driver/toggle-online',
      handler: 'delivery-driver.toggleDeliveryDriverOnline',
      config: { policies: [] },
    },
    // ─── Location update ──────────────────────────────────────────────────
    {
      method: 'POST',
      path:   '/delivery-driver/update-location',
      handler: 'delivery-driver.updateDeliveryLocation',
      config: { policies: [] },
    },
    // ─── Stats & earnings ─────────────────────────────────────────────────
    {
      method: 'GET',
      path:   '/delivery-driver/stats',
      handler: 'delivery-driver.getDeliveryStats',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path:   '/delivery-driver/earnings',
      handler: 'delivery-driver.getDeliveryEarnings',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path:   '/delivery-driver/earnings/breakdown',
      handler: 'delivery-driver.getDeliveryEarningsBreakdown',
      config: { policies: [] },
    },
    // ─── Onboarding — document steps reuse the ride-driver endpoints ──────
    // (POST /driver/onboarding/license, national-id, proof-of-address)
    // Delivery-specific onboarding steps:
    {
      method: 'POST',
      path:   '/delivery-driver/onboarding/vehicle-type',
      handler: 'delivery-driver.saveDeliveryVehicleType',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path:   '/delivery-driver/onboarding/vehicle-details',
      handler: 'delivery-driver.saveDeliveryVehicleDetails',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path:   '/delivery-driver/onboarding/submit',
      handler: 'delivery-driver.submitDeliveryForVerification',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path:   '/delivery-driver/onboarding/status',
      handler: 'delivery-driver.getDeliveryOnboardingStatus',
      config: { policies: [], middlewares: [] },
    },
    // ─── Vehicle ──────────────────────────────────────────────────────────
    {
      method: 'GET',
      path:   '/delivery-driver/vehicle',
      handler: 'delivery-driver.findDeliveryVehicle',
      config: { policies: [] },
    },
    // ─── Payment phone numbers ────────────────────────────────────────────
    {
      method: 'GET',
      path:   '/delivery-driver/payment-phone-numbers',
      handler: 'delivery-driver.getPaymentPhoneNumbers',
      config: { policies: [] },
    },
    {
      method: 'PUT',
      path:   '/delivery-driver/payment-phone-numbers',
      handler: 'delivery-driver.savePaymentPhoneNumbers',
      config: { policies: [] },
    },
  ],
};