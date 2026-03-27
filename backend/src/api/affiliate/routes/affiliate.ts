// ============================================================
// src/api/affiliate/routes/affiliate.ts
// ============================================================
export default {
  routes: [
    // ─── Impression ───────────────────────────────────────────────────────
    {
      method:  'POST',
      path:    '/affiliate/track-impression',
      handler: 'affiliate.trackImpression',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/affiliate/check-impression',
      handler: 'affiliate.checkImpression',
      config:  { policies: [], middlewares: [] },
    },

    // ─── Dashboard & reporting ────────────────────────────────────────────
    {
      method:  'GET',
      path:    '/affiliate/dashboard',
      handler: 'affiliate.getDashboard',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/affiliate/transactions',
      handler: 'affiliate.getTransactions',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'GET',
      path:    '/affiliate/conversion-rate',
      handler: 'affiliate.getConversionRate',
      config:  { policies: [], middlewares: [] },
    },

    // ─── Actions ──────────────────────────────────────────────────────────
    {
      method:  'POST',
      path:    '/affiliate/request-withdrawal',
      handler: 'affiliate.requestWithdrawal',
      config:  { policies: [], middlewares: [] },
    },
    {
      method:  'POST',
      path:    '/affiliate/apply-code',
      handler: 'affiliate.applyCode',
      config:  { policies: [], middlewares: [] },
    },

    // ─── Generic param (must be last) ─────────────────────────────────────
    {
      method:  'GET',
      path:    '/affiliate/:code',
      handler: 'affiliate.getByCode',
      config:  { policies: [], middlewares: [] },
    },
  ],
};