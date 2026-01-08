//============================================
// src/api/finance/routes/finance.ts
//============================================
export default {
  routes: [
    {
      method: 'GET',
      path: '/driver/float/balance',
      handler: 'finance.getFloatBalance',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/driver/float/topup',
      handler: 'finance.topupFloat',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/driver/withdrawal/request',
      handler: 'finance.requestWithdrawal',
      config: { policies: [] }
    },
  ]
};