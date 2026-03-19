/**
 * Affiliate Routes — FULL REPLACEMENT
 * PATH: src/api/affiliate/routes/affiliate.ts
 */
export default {
  routes: [
    // ── Public ────────────────────────────────────────────────────────────
    {
      method: 'GET',
      path: '/affiliate/:code',
      handler: 'api::affiliate.affiliate.getByCode',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/affiliate/track-impression',
      handler: 'api::affiliate.affiliate.trackImpression',
      config: { auth: false, policies: [], middlewares: [] },
    },

    // ── Authenticated ──────────────────────────────────────────────────────
    {
      method: 'GET',
      path: '/affiliate/dashboard',
      handler: 'api::affiliate.affiliate.getDashboard',
      config: { middlewares: [] },
    },
    {
      method: 'GET',
      path: '/affiliate/transactions',
      handler: 'api::affiliate.affiliate.getTransactions',
      config: { middlewares: [] },
    },
    {
      method: 'GET',
      path: '/affiliate/conversion-rate',
      handler: 'api::affiliate.affiliate.getConversionRate',
      config: { middlewares: [] },
    },
    {
      method: 'POST',
      path: '/affiliate/request-withdrawal',
      handler: 'api::affiliate.affiliate.requestWithdrawal',
      config: { middlewares: [] },
    },
     {
      method: 'POST',
      path: '/affiliate/apply-code',
      handler: 'api::affiliate.affiliate.applyCode',
      config: { middlewares: [] },  // auth required
    }
  ],
};