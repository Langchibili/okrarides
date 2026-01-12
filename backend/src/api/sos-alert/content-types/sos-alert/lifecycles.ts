// src/api/sos-alert/content-types/sos-alert/lifecycles.ts

import socketService from '../../../../services/socketService';

export default {
  /**
   * Triggered after an SOS alert is created
   */
  async afterCreate(event: any) {
    const { result } = event;

    // Populate relations to get user and ride data
    const alert: any = await strapi.db.query('api::sos-alert.sos-alert').findOne({
      where: { id: result.id },
      populate: ['user', 'ride'],
    });

    if (!alert) return;

    const userId = alert.user?.id || alert.user;

    // Determine user type (active profile)
    const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      select: ['active_profile'], // Note: check your schema, typically 'active_profile' in DB
    });

    const userType = user?.activeProfile || 'rider';

    // Trigger SOS alert via socket service
    socketService.emit('sos:trigger', {
      alertId: alert.id,
      userId,
      userType,
      location: alert.location,
      rideId: alert.ride?.id || alert.ride,
      type: alert.alertType,
    });
  },

  /**
   * Triggered after an SOS alert is updated
   */
  async afterUpdate(event: any) {
    const { result, params } = event;
    
    // In Strapi v5, params.data contains the incoming change
    const newStatus = result.sosStatus;
    const updateData = params?.data;

    // If alert was acknowledged
    if (newStatus === 'acknowledged' && updateData?.sosStatus === 'acknowledged') {
      const alert: any = await strapi.db.query('api::sos-alert.sos-alert').findOne({
        where: { id: result.id },
        populate: ['user', 'acknowledgedBy'],
      });

      if (!alert) return;

      const userId = alert.user?.id || alert.user;
      
      // Get user profile to determine type
      const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['active_profile'],
      });

      const userType = user?.activeProfile || 'rider';

      // Use specific method from socket service
      socketService.emitSOSAcknowledged(
        result.id,
        userId,
        userType,
        alert.acknowledgedBy?.id || alert.acknowledgedBy
      );
    }
  },
};