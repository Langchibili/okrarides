// import { factories } from '@strapi/strapi';

// export default factories.createCoreRouter('api::ride.ride');
// ============================================
// src/api/ride/routes/ride.ts
// ============================================

const defaultRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/rides/:id',
      handler: 'ride.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/rides',
      handler: 'ride.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    
    {
      method: 'POST',
      path: '/rides',
      handler: 'ride.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/rides/:id',
      handler: 'ride.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/rides/:id',
      handler: 'ride.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

export default defaultRoutes;