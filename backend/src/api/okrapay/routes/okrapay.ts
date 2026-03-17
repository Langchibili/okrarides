// /**
//  * OkraPay custom routes
//  *
//  * POST /okrapay/initiate              — create payment intent (auth required)
//  * POST /okrapay                       — inbound collection webhook (public)
//  * POST /okrapay/withdraw              — inbound payout webhook    (public)
//  * POST /okrapay/request-withdrawal    — driver/rider requests a withdrawal (auth required)
//  * GET  /okrapay/status/:reference     — check payment status (auth required)
//  */

export default {
  routes: [
    {
      method: 'POST',
      path: '/okrapay/initiate',
      handler: 'okrapay.initiate',
      config: {
        policies: []
      },
    },
    {
      // Collection webhook — no authentication, verified by gateway signature
      method: 'POST',
      path: '/okrapay',
      handler: 'okrapay.webhook',
      config: {
        policies: []
      },
    },
    {
      // Payout / withdrawal webhook — no authentication, verified by gateway signature
      method: 'POST',
      path: '/okrapay/withdraw',
      handler: 'okrapay.withdrawWebhook',
      config: {
        policies: []
      },
    },
    {
      method: 'POST',
      path: '/okrapay/request-withdrawal',
      handler: 'okrapay.requestWithdrawal',
      config: {
        policies: []
      },
    },
    {
      method: 'GET',
      path: '/okrapay/status/:reference',
      handler: 'okrapay.getPaymentStatus',
      config: {
        policies: []
      },
    },
  ],
};