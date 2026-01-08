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
    {
      method: 'POST',
      path: '/rides/:id/accept',
      handler: 'ride.acceptRide',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/rides/:id/decline',
      handler: 'ride.declineRide',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/rides/:id/confirm-arrival',
      handler: 'ride.confirmArrival',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/rides/:id/start',
      handler: 'ride.startTrip',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/rides/:id/complete',
      handler: 'ride.completeTrip',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/rides/:id/cancel',
      handler: 'ride.cancelRide',
      config: { policies: [] }
    }
  ],
};