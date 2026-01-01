// ============================================
// src/api/ride/routes/custom-routes.ts
// ============================================

export default {
  routes: [
    {
      method: 'POST',
      path: '/rides/estimate',
      handler: 'ride.estimate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/rides/:id/driver-location',
      handler: 'ride.getDriverLocation',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/rides/:id/track',
      handler: 'ride.trackRide',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/rides/:id/receipt',
      handler: 'ride.getReceipt',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/rides/:id/share-tracking',
      handler: 'ride.shareTracking',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};