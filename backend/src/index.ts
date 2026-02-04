// backend/src/index.js
// import type { Core } from '@strapi/strapi';
// import { handleUserCreation, handleUserUpdate } from "./pluginExtensionsFiles/userLifecycleMethods"
import { handleUserCreation } from "./pluginExtensionsFiles/userLifecycleMethods"
// Import socket service
import socketService from './services/socketService'

export default {
  register(/* { strapi } */) {
    // Import socket service
    socketService.connect();
    // socketService.on('device:register', (data) => {
    //     console.log('New driver:location:update', data);
    // });
    socketService.on('driver:location:update', (data) => {
        console.log('New driver:location:update', data);
    })
    socketService.on('device:permissions:update', (data) => {
        console.log('New driver:location:update', data);
    })
    // socketService.on('driver:location:update', (data) => {
    //     console.log('New driver:location:update', data);
    // });
    
  },

  bootstrap({ strapi }) {
    // Connect socket service
    socketService.connect();
    console.log('✅ Socket Service initialized');

    // ❌ REMOVED ALL EVENTHUB LISTENERS - Not needed anymore
    // Controllers now call socketService.emit() directly

    // Setup subscription expiry checker
    setupSubscriptionExpiryChecker(strapi);
    
    // Setup user lifecycle hooks (keep this)
    strapi.db.lifecycles.subscribe({
      models: ['plugin::users-permissions.user'],
      async afterCreate(event: any) {
        const { result: user } = event;
        if (!user?.id) return;
        try {
          await handleUserCreation(strapi, user);
        } catch (error) {
          console.error('Error in afterCreate:', error);
        }
      }
    });
  },
};

/**
 * Setup cron job to check for expiring subscriptions
 */
function setupSubscriptionExpiryChecker(strapi) {
  const { checkAndWarnSubscriptionExpiring } = require('./utils/socketUtils');

  // Run every hour
  setInterval(async () => {
    try {
      const subscriptions = await strapi.db.query('api::driver-subscription.driver-subscription').findMany({
        where: {
          status: {
            $in: ['active', 'trial'],
          },
        },
        populate: ['driver', 'subscriptionPlan'],
      });

      for (const subscription of subscriptions) {
        checkAndWarnSubscriptionExpiring(subscription);
      }
    } catch (error) {
      console.error('❌ Error checking subscription expiry:', error);
    }
  }, 60 * 60 * 1000); // 1 hour

  console.log('✅ Subscription expiry checker initialized');
}



