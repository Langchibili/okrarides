//============================================
// src/api/subscription/routes/subscription.ts
//============================================
export default {
  routes: [
    {
      method: 'GET',
      path: '/subscriptions/plans',
      handler: 'subscription.getPlans',
      config: { auth: false }
    },
    {
      method: 'POST',
      path: '/subscriptions/start-trial',
      handler: 'subscription.startTrial',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/subscriptions/subscribe',
      handler: 'subscription.subscribe',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/subscriptions/me',
      handler: 'subscription.getMySubscription',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/subscriptions/renew',
      handler: 'subscription.renew',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/subscriptions/cancel',
      handler: 'subscription.cancel',
      config: { policies: [] }
    },
  ]
};