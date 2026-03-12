export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1343),
  app: {
    keys: env.array('APP_KEYS'),
  },
  cron: {
    enabled: true,   // ← this must be true
  }
});
