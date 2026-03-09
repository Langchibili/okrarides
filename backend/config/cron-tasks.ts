/**
 * Strapi Cron Tasks
 * PATH: backend/config/cron-tasks.ts
 *
 * The OkraPay collection poller fires every 20 seconds.
 * It queries Lenco's /collections/status/:reference for every pending
 * payment record and processes completions/failures, acting as a safety
 * net alongside the webhook.
 *
 * The interval can also be driven by admin settings
 * (appsServerPollingIntervalInSeconds), but since Strapi cron expressions
 * are fixed at startup we use a hardcoded 20-second schedule.  If you need
 * runtime-configurable intervals, run the poller from a bootstrap instead.
 *
 * Note: node-cron (used by Strapi) supports 6-part cron expressions
 * where the first field is seconds.  20 * * * * *" = every 20 seconds.
 */

import { pollPendingCollections } from '../src/services/collection-poller';

export default {
  /**
   * OkraPay pending-collection poller — every 20 seconds
   *
   * Pattern: [seconds] [minutes] [hours] [day-of-month] [month] [day-of-week]
   */
  '*/20 * * * * *': {
    task: async ({ strapi: _strapi }: { strapi: any }) => {
      await pollPendingCollections();
    },
    options: {
      tz: 'UTC',
    },
  },
};