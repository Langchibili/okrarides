// src/api/rider/controllers/rider.js
import { factories } from '@strapi/strapi';
import  RiderBlockingService  from '../../../services/riderBlockingService';

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  // Clean temp blocks when app opens
  async cleanTempBlocks(ctx) {
    try {
      const userId = ctx.state.user.id;
      
      const result = await RiderBlockingService.cleanExpiredTempBlocks(userId);
      
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('Clean temp blocks error:', error);
      return ctx.internalServerError('Failed to clean temporary blocks');
    }
  },

  // Block a driver permanently
  async blockDriver(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { driverId } = ctx.request.body;

      if (!driverId) {
        return ctx.badRequest('Driver ID is required');
      }

      const result = await RiderBlockingService.addPermanentBlock(userId, driverId);
      
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('Block driver error:', error);
      return ctx.internalServerError('Failed to block driver');
    }
  },

  // Unblock a driver
  async unblockDriver(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { driverId } = ctx.request.body;

      if (!driverId) {
        return ctx.badRequest('Driver ID is required');
      }

      const result = await RiderBlockingService.removePermanentBlock(userId, driverId);
      
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('Unblock driver error:', error);
      return ctx.internalServerError('Failed to unblock driver');
    }
  },

  // Get all blocked drivers
  async getBlockedDrivers(ctx) {
    try {
      const userId = ctx.state.user.id;
      
      const result = await RiderBlockingService.getBlockedDrivers(userId);
      
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('Get blocked drivers error:', error);
      return ctx.internalServerError('Failed to get blocked drivers');
    }
  }
}));