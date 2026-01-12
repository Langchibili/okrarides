// src/api/withdrawal/content-types/withdrawal/lifecycles.ts

import socketService from '../../../../services/socketService';

export default {
  async afterUpdate(event: any) {
    const { result, params } = event;

    // In Strapi v5 lifecycles, params.data contains the attributes sent in the update
    const newStatus = result.withdrawalStatus;
    const updateData = params?.data;

    // Check if status is being updated to 'completed'
    // Note: logic checks if the incoming data or the result reflects the status change
    if (newStatus === 'completed' && updateData?.withdrawalStatus === 'completed') {
      
      // Populate relations to get driver information
      const withdrawal: any = await strapi.db.query('api::withdrawal.withdrawal').findOne({
        where: { id: result.id },
        populate: ['driver'],
      });

      if (withdrawal && withdrawal.driver) {
        // Emit withdrawal processed event using the socket service
        socketService.emitWithdrawalProcessed(
          withdrawal.driver.id,
          withdrawal.amount,
          withdrawal.paymentMethod || 'bank_transfer',
          withdrawal.transactionId || withdrawal.id
        );
      }
    }
  },
};