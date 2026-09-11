// src/api/system-announcement/content-types/system-announcement/lifecycles.ts

import socketService from '../../../../services/socketService';

export default {
  /**
   * Triggered after a system announcement is created
   */
  async afterCreate(event: any) {
    const { result } = event;

    // Fetch the announcement to ensure we have all fields
    const announcement: any = await strapi.db.query('api::system-announcement.system-announcement').findOne({
      where: { id: result.id },
    });

    if (!announcement) return;

    // Broadcast if the announcement is set to active
    if (announcement.isActive) {
      socketService.emitSystemAnnouncement(
        announcement.targetAudience || 'all',
        announcement.message,
        announcement.priority || 'normal'
      );
    }
  },

  /**
   * Triggered after an announcement is updated
   * (Added this logic to handle announcements being toggled to 'active' later)
   */
  async afterUpdate(event: any) {
    const { result, params } = event;
    const updateData = params?.data;

    // Only broadcast if 'isActive' was just changed to true
    if (updateData?.isActive === true && result.isActive === true) {
      socketService.emitSystemAnnouncement(
        result.targetAudience || 'all',
        result.message,
        result.priority || 'normal'
      );
    }
  }
};