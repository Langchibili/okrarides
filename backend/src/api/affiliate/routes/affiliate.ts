export default {
  routes: [
    {
      method: 'POST',
      path: '/affiliate/track-impression',
      handler: 'affiliate.trackImpression',
      config: { policies: [], middlewares: [] },
    },
    {
     method: 'GET',
     path: '/affiliate/check-impression',
     handler: 'affiliate.checkImpression',
     config: {
      policies: [],
      middlewares: []
     },
    },
    {
      method: 'GET',
      path: '/affiliate/dashboard',
      handler: 'affiliate.getDashboard',
      config: { middlewares: [] },
    },
    {
      method: 'GET',
      path: '/affiliate/transactions',
      handler: 'affiliate.getTransactions',
      config: { middlewares: [] },
    },
    {
      method: 'GET',
      path: '/affiliate/conversion-rate',
      handler: 'affiliate.getConversionRate',
      config: { middlewares: [] },
    },
    {
      method: 'POST',
      path: '/affiliate/request-withdrawal',
      handler: 'affiliate.requestWithdrawal',
      config: { middlewares: [] },
    },
     {
      method: 'POST',
      path: '/affiliate/apply-code',
      handler: 'affiliate.applyCode',
      config: { middlewares: [] },  // auth required
    },
    {
      method: 'GET',
      path: '/affiliate/:code',
      handler: 'affiliate.getByCode',
      config: {  policies: [], middlewares: [] },
    }
  ]
}