// src/api/notification/content-types/notification/lifecycles.ts

import socketService from '../../../../services/socketService';

export default {
  /**
   * Triggered after a notification record is created in the database
   */
  async afterCreate(event: any) {
    const { result } = event;

    // 1. Populate relations to get the target user
    const notification: any = await strapi.db.query('api::notification.notification').findOne({
      where: { id: result.id },
      populate: ['user'],
    });

    if (!notification) return;

    const userId = notification.user?.id || notification.user;

    // 2. Determine user type from user profile
    const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      select: ['activeProfile'],
    });

    const userType = user?.activeProfile || 'rider';

    // 3. Send real-time socket notification using the service singleton
    const wasSent = socketService.emitNotification(userId, userType, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });

    // 4. Update the database record to reflect status
    if (wasSent) {
      await strapi.db.query('api::notification.notification').update({
        where: { id: notification.id },
        data: {
          sent: true,
          sentAt: new Date().toISOString(),
        },
      });
    }
  },
};