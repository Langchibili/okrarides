// src/api/transaction/content-types/transaction/lifecycles.ts

import socketService from '../../../../services/socketService';

/**
 * Helper logic to determine which socket event to emit.
 * Moved outside the export object to comply with Strapi's strict lifecycle validation.
 */
const handlePaymentEvent = (transaction: any) => {
  const { user, status, amount, transactionId, id, type } = transaction;

  if (status === 'completed') {
    socketService.emitPaymentSuccess(
      user.id,
      transaction.userType || 'rider',
      amount,
      transactionId || id,
      type || 'ride'
    );
  } else if (status === 'failed') {
    socketService.emitPaymentFailed(
      user.id,
      transaction.userType || 'rider',
      amount,
      transaction.failureReason || 'Transaction failed',
      transactionId || id
    );
  }
};

export default {
  /**
   * Triggered after a transaction is created
   */
  async afterCreate(event: any) {
    const { result } = event;

    // Populate relations to get user information
    const transaction: any = await strapi.db.query('api::transaction.transaction').findOne({
      where: { id: result.id },
      populate: ['user'],
    });

    if (!transaction || !transaction.user) return;

    // Call helper directly (no 'this' required)
    handlePaymentEvent(transaction);
  },

  /**
   * Triggered after a transaction is updated
   */
  async afterUpdate(event: any) {
    const { result, params } = event;

    // Strapi v5: params.data contains the updated fields
    const newStatus = result.status;
    const updateData = params?.data;

    // Only emit if the status was part of the update and has changed
    if (updateData?.status && updateData.status === newStatus) {
      // Populate relations
      const transaction: any = await strapi.db.query('api::transaction.transaction').findOne({
        where: { id: result.id },
        populate: ['user'],
      });

      if (!transaction || !transaction.user) return;

      // Call helper directly
      handlePaymentEvent(transaction);
    }
  },
};