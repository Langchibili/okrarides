// import { factories } from '@strapi/strapi';

// export default factories.createCoreRouter('api::supportTicket.supportTicket');
// ============================================
// src/api/supportTicket/routes/supportTicket.ts
// ============================================

const defaultRoutes = {
  routes: [
    {
      method: 'GET',
      path: '/support-tickets/:id',
      handler: 'support-ticket.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/support-tickets',
      handler: 'support-ticket.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    
    {
      method: 'POST',
      path: '/support-tickets',
      handler: 'support-ticket.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
    method: 'PUT',
      path: '/support-tickets/:id',
      handler: 'support-ticket.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/support-tickets/:id',
      handler: 'support-ticket.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

export default defaultRoutes;