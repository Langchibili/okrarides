module.exports = {
  routes: [
    {
      method:  'POST',
      path:    '/account-exist-check/check-user',
      handler: 'account-exist-check.checkUser',
      config: { middlewares: [] }
    },
  ],
};