// ============================================
// src/api/driver/routes/driver.ts
// ============================================
export default {
  routes: [
    // ─── 1. Online / location ─────────────────────────────────────────────
    {
      method:  'POST',
      path:    '/driver/toggle-online',
      handler: 'driver.toggleOnline',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/toggle-offline',
      handler: 'driver.goOffline',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/update-location',   // removed duplicate /driver/location
      handler: 'driver.updateLocation',
      config:  { policies: [], middlewares: [] },
    },

    // ─── 2. Stats & earnings (deeper path before shallower) ───────────────
    {
      method:  'GET',
      path:    '/driver/earnings/breakdown', // ← must precede /driver/earnings
      handler: 'driver.getEarningsBreakdown',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/driver/earnings',
      handler: 'driver.getEarnings',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/driver/stats',
      handler: 'driver.getStats',
      config:  { policies: [], middlewares: [] },
    },

    // ─── 3. Onboarding (all literal, POST-heavy) ──────────────────────────
    {
      method:  'GET',
      path:    '/driver/onboarding/status',
      handler: 'driver.getOnboardingStatus',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/onboarding/license',
      handler: 'driver.saveLicenseInfo',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/onboarding/national-id',
      handler: 'driver.saveNationalIdInfo',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/onboarding/proof-of-address',
      handler: 'driver.saveProofOfAddress',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/onboarding/vehicle-type',
      handler: 'driver.saveVehicleType',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/onboarding/vehicle-details',
      handler: 'driver.saveVehicleDetails',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/onboarding/submit',
      handler: 'driver.submitForVerification',
      config:  { policies: [], middlewares: [] },
    },

    // ─── 4. Vehicles ──────────────────────────────────────────────────────
    {
      method:  'PUT',
      path:    '/driver/vehicles/assigned-vehicle', // literal suffix before bare /vehicles
      handler: 'driver.updateDriverVehicle',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/driver/vehicles',
      handler: 'driver.findDriverVehicles',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/driver/vehicles',
      handler: 'driver.addVehicle',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/driver/vehicle',
      handler: 'driver.findDriverVehicle',
      config:  { policies: [], middlewares: [] },
    },

    // ─── 5. Payment ───────────────────────────────────────────────────────
    {
      method:  'GET',
      path:    '/driver/payment-phone-numbers',
      handler: 'driver.getPaymentPhoneNumbers',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'PUT',
      path:    '/driver/payment-phone-numbers',
      handler: 'driver.savePaymentPhoneNumbers',
      config:  { policies: [], middlewares: [] },
    },
  ],
};