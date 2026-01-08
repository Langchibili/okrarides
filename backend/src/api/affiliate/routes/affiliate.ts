export default {
  routes: [
    {
      method: 'GET',
      path: '/affiliate/:code',
      handler: 'api::affiliate.affiliate.getByCode',
      config: {
        auth: false, // Set to true if you want to restrict this
        policies: [],
        middlewares: [],
      },
    },
  ],
};