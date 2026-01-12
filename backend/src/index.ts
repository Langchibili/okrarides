// import type { Core } from '@strapi/strapi';
// import { handleUserCreation, handleUserUpdate } from "./pluginExtensionsFiles/userLifecycleMethods"
import { handleUserCreation } from "./pluginExtensionsFiles/userLifecycleMethods"
// Import socket service
import socketService from './services/socketService'
export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {
    socketService.connect();
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    // // Make socket service available globally
    // strapi.socketService = socketService;
    //  console.log('✅ Socket Service initialized and available as strapi.socketService');

    // Optional: Setup subscription expiry checker
    setupSubscriptionExpiryChecker(strapi);
    strapi.db.lifecycles.subscribe({
      models: ['plugin::users-permissions.user'],
    // Main lifecycle hooks - SIMPLIFIED VERSION
      async afterCreate(event: any) {
        console.log('✅ afterCreate lifecycle triggered');
        const { result: user } = event;
        
        // Log user data for debugging
        console.log('User data received:', {
          id: user?.id,
          email: user?.email,
          phoneNumber: user?.phoneNumber,
          referredBy: user?.referredBy
        });
        
        if (!user?.id) {
          console.error('User ID is missing in afterCreate');
          return;
        }
        
        try {
          // Pass strapi instance to the handler
          await handleUserCreation(strapi, user);
        } catch (error) {
          console.error('Error in afterCreate:', error);
        }
      },

      async afterUpdate(event: any) {
        console.log('✅ afterUpdate lifecycle triggered');
        const { result: user } = event;
        
        if (!user?.id) {
          console.error('User ID is missing in afterUpdate');
          return;
        }
        
        try {
          // Use a simple logging function instead of handleUserUpdate
          // to avoid recursion
          console.log(`User ${user.id} was updated. No further actions to avoid recursion.`);
        } catch (error) {
          console.error('Error in afterUpdate:', error);
        }
      }
    }
      // async afterCreate(event) {
      //    const { result: user } = event;
      //    await handleUserCreation(strapi, user);
      // },

      // async beforeUpdate(event) {
      //    const { result: user, params } = event;
      //    await handleUserUpdate(strapi, user, params);
      // },
    //}
  );
  },
}

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