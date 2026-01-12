//============================================
// src/api/driver/routes/driver.ts
//============================================
export default {
  routes: [
    {
      method: 'POST',
      path: '/driver/toggle-online',
      handler: 'driver.toggleOnline',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/driver/update-location',
      handler: 'driver.updateLocation',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/driver/stats',
      handler: 'driver.getStats',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/driver/earnings',
      handler: 'driver.getEarnings',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/driver/earnings/breakdown',
      handler: 'driver.getEarningsBreakdown',
      config: { policies: [] }
    },
    // 1. License Information
    {
      method: 'POST',
      path: '/driver/onboarding/license', 
      handler: 'driver.saveLicenseInfo',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 2. National ID (NRC)
    {
      method: 'POST',
      path: '/driver/onboarding/national-id', 
      handler: 'driver.saveNationalIdInfo',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 3. Proof of Address
    {
      method: 'POST',
      path: '/driver/onboarding/proof-of-address', 
      handler: 'driver.saveProofOfAddress',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 4. Vehicle Type
    {
      method: 'POST',
      path: '/driver/onboarding/vehicle-type', 
      handler: 'driver.saveVehicleType',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 5. Vehicle Details
    {
      method: 'POST',
      path: '/driver/onboarding/vehicle-details', 
      handler: 'driver.saveVehicleDetails',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 6. Submit Application
    {
      method: 'POST',
      path: '/driver/onboarding/submit', 
      handler: 'driver.submitForVerification',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 7. Get Onboarding Status
    {
      method: 'GET',
      path: '/driver/onboarding/status', 
      handler: 'driver.getOnboardingStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 8. Toggle Online Status (Existing)
    {
      method: 'POST',
      path: '/driver/toggle-online',
      handler: 'driver.toggleOnline',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 9. Update Location (Existing)
    {
      method: 'POST',
      path: '/driver/location',
      handler: 'driver.updateLocation',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 10. Get Stats (Existing)
    {
      method: 'GET',
      path: '/driver/stats',
      handler: 'driver.getStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 11. Get Earnings (Existing)
    {
      method: 'GET',
      path: '/driver/earnings',
      handler: 'driver.getEarnings',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // 12. Get Earnings Breakdown (Existing)
    {
      method: 'GET',
      path: '/driver/earnings/breakdown',
      handler: 'driver.getEarningsBreakdown',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/driver/vehicle',
      handler: 'driver.findDriverVehicle',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/driver/vehicles',
      handler: 'driver.findDriverVehicles',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/driver/vehicles',
      handler: 'driver.addVehicle',
      config: { policies: [] }
    },
    {
      method: 'PUT',
      path: '/driver/vehicles/assigned-vehicle',
      handler: 'driver.updateDriverVehicle',
      config: { policies: [] }
    }
  ]
};