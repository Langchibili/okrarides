export default {
  routes: [
    {
      method: 'GET',
      path: '/admn-setting/resolved',
      handler: 'admn-setting.resolve',
      config: { policies: [], middlewares: [] },
    },
  ],
};
