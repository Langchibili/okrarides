// ============================================================
// src/api/delivery/routes/delivery.ts  (default CRUD)
// ============================================================
const defaultRoutes = {
  routes: [
    {
      method: 'GET',
      path:   '/deliveries/:id',
      handler: 'delivery.findOne',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path:   '/deliveries',
      handler: 'delivery.find',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path:   '/deliveries',
      handler: 'delivery.create',
      config: { policies: [], middlewares: [] },
    },
  ],
};

export default defaultRoutes;