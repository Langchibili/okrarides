'use strict';

export default {
  routes: [
    {
      method: 'POST',
      path:   '/support-tickets/create-draft',
      handler: 'support-ticket.createDraft',
      config: {
        policies: [],
        middlewares: []
      },
    },
    {
      method: 'PUT',
      path:   '/support-tickets/:id/submit',
      handler: 'support-ticket.submitTicket',
      config: {
        policies: [],
        middlewares: []
      },
    },
    {
      method: 'GET',
      path:   '/support-tickets/mine',
      handler: 'support-ticket.getMyTickets',
      config: {
        policies: [],
        middlewares: []
      },
    },
  ],
};