export default () => ({
    admn: {
      enabled: true,
      resolve: './src/plugins/admn',
    },
    'users-permissions': {
      config: {
        jwt: {
          expiresIn: '1y',
        }
      }
    }
});
