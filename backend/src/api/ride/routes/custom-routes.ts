// 
// ============================================
// src/api/ride/routes/custom-routes.ts
// ============================================

export default {
  routes: [
    // ─── 1. Fully literal paths ───────────────────────────────────────────
    {
      method:  'POST',
      path:    '/rides/estimate',
      handler: 'ride.estimate',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/rides/active',
      handler: 'ride.getActiveRide',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/rides/driver-stats',
      handler: 'ride.getMyStats',
      config:  { policies: [], middlewares: [] },
    },

    // ─── 2. Param + deeper literal suffix (more segments first) ──────────
    {
      method:  'GET',
      path:    '/rides/:id/receipt/download',
      handler: 'ride.downloadReceipt',
      config:  { policies: [], middlewares: [] },
    },

    // ─── 3. Param + single literal suffix (:id/action) ───────────────────
    // GET actions
    {
      method:  'GET',
      path:    '/rides/:id/driver-location',
      handler: 'ride.getDriverLocation',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/rides/:id/track',
      handler: 'ride.trackRide',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/rides/:id/receipt',
      handler: 'ride.getReceipt',
      config:  { policies: [], middlewares: [] },
    },

    // POST actions
    {
      method:  'POST',
      path:    '/rides/:id/share-tracking',
      handler: 'ride.shareTracking',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/accept',
      handler: 'ride.acceptRide',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/decline',
      handler: 'ride.declineRide',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/confirm-arrival',
      handler: 'ride.confirmArrival',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/start',
      handler: 'ride.startTrip',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/request-payment',
      handler: 'ride.requestPayment',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/pay-cash',
      handler: 'ride.payCash',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/complete',
      handler: 'ride.completeTrip',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/rate',
      handler: 'ride.rateRide',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rides/:id/cancel',
      handler: 'ride.cancelRide',
      config:  { policies: [], middlewares: [] },
    },

    // ─── 4. /rider prefix (separate namespace, all literal) ──────────────
    {
      method:  'GET',
      path:    '/rider/blocked-drivers',
      handler: 'rider.getBlockedDrivers',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rider/block-driver',
      handler: 'rider.blockDriver',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rider/unblock-driver',
      handler: 'rider.unblockDriver',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/rider/clean-temp-blocks',
      handler: 'rider.cleanTempBlocks',
      config:  { policies: [], middlewares: [] },
    },
  ],
};