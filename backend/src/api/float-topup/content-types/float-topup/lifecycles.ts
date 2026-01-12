// src/api/float-topup/content-types/float-topup/lifecycles.ts

import socketService from '../../../../services/socketService';

export default {
  /**
   * Triggered after a float topup record is updated
   */
  async afterUpdate(event: any) {
    const { result, params } = event;

    // In Strapi v5, result contains the new state, and params.data contains the attributes sent in the update
    const newStatus = result.floatStatus;
    const updateData = params?.data;

    // Check if status is being updated to 'completed'
    if (newStatus === 'completed' && updateData?.floatStatus === 'completed') {
      
      // Populate relations to get driver information
      const topup: any = await strapi.db.query('api::float-topup.float-topup').findOne({
        where: { id: result.id },
        populate: ['driver'],
      });

      if (!topup || !topup.driver) return;

      const driverId = topup.driver.id || topup.driver;

      // Notify driver via socket service using the 'float_topup' type
      socketService.emitPaymentSuccess(
        driverId,
        'driver',
        topup.amount,
        topup.topupId || topup.id,
        'float_topup'
      );
    }
  },
};