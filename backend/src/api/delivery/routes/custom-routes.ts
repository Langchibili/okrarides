// ============================================================
// src/api/delivery/routes/custom-routes.ts
// ============================================================

export default {
  routes: [
    // ─── Sender-facing ────────────────────────────────────────────────────
    {
      method:  'POST',
      path:    '/deliveries/estimate',
      handler: 'delivery.estimate',
      config:  { policies: [], middlewares: [] },
    },
    {
     method:  'GET',
     path:    '/deliveries/ridecode/:rideCode',
     handler: 'delivery.getDeliveryByRideCode',
     config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/deliveries/active',
      handler: 'delivery.getActiveDelivery',
      config:  { policies: [] },
    },
    {
      method:  'GET',
      path:    '/deliveries/:id/track',
      handler: 'delivery.trackDelivery',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/deliveries/:id/deliverer-location',
      handler: 'delivery.getDelivererLocation',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/deliveries/:id/pay-cash',
      handler: 'delivery.payCash',
      config:  { policies: [] },
    },
    {
      method:  'POST',
      path:    '/deliveries/:id/cancel',
      handler: 'delivery.cancelDelivery',
      config:  { policies: [] },
    },
    {
      method:  'POST',
      path:    '/deliveries/:id/rate',
      handler: 'delivery.rateDelivery',
      config:  { policies: [] },
    },

    // ─── Deliverer-facing ─────────────────────────────────────────────────
    {
      method:  'POST',
      path:    '/deliveries/:id/accept',
      handler: 'delivery.acceptDelivery',
      config:  { policies: [] },
    },
    {
      method:  'POST',
      path:    '/deliveries/:id/decline',
      handler: 'delivery.declineDelivery',
      config:  { policies: [] },
    },
    {
      method:  'POST',
      path:    '/deliveries/:id/confirm-arrival',
      handler: 'delivery.confirmArrival',
      config:  { policies: [] },
    },
    {
      method:  'POST',
      path:    '/deliveries/:id/start',
      handler: 'delivery.startDelivery',
      config:  { policies: [] },
    },
    {
      method:  'POST',
      path:    '/deliveries/:id/request-payment',
      handler: 'delivery.requestPayment',
      config:  { policies: [] },
    },
    {
      method:  'POST',
      path:    '/deliveries/:id/complete',
      handler: 'delivery.completeDelivery',
      config:  { policies: [] },
    },
  ],
};


// ============================================================
// src/api/delivery/routes/index.ts
// ============================================================
// (Paste into a SEPARATE file: src/api/delivery/routes/index.ts)

// import defaultRoutes from './delivery';
// import customRoutes from './custom-routes';
//
// export default {
//   routes: [...defaultRoutes.routes, ...customRoutes.routes],
// };