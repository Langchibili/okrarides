// import type { Core } from '@strapi/strapi';
// import { handleUserCreation, handleUserUpdate } from "./pluginExtensionsFiles/userLifecycleMethods"
import { handleUserCreation } from "./pluginExtensionsFiles/userLifecycleMethods"
export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
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