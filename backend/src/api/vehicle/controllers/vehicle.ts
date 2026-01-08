//============================================
// src/api/vehicle/controllers/vehicle.ts
//============================================
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::vehicle.vehicle', ({ strapi }) => ({
  
  // Get driver's vehicles
  async findOwn(ctx) {
    try {
      const userId = ctx.state.user.id;

      const vehicles = await strapi.db.query('api::vehicle.vehicle').findMany({
        where: { owner: userId },
        populate: ['taxiType', 'rideClass']
      });

      return ctx.send(vehicles);
    } catch (error) {
      strapi.log.error('Find vehicles error:', error);
      return ctx.internalServerError('Failed to get vehicles');
    }
  },
   async findDriverVehicle(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const driverProfileWithAssignedVehicle = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        populate: { 
            assignedVehicle: {
                populate: true 
            }
        }
      })

      return ctx.send({success: true, hasVehicle: true, vehicle:driverProfileWithAssignedVehicle.assignedVehicle});
    } catch (error) {
      strapi.log.error('Find vehicles error:', error);
      return ctx.internalServerError('Failed to get vehicles');
    }
  },
  async findDriverVehicles(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const driverProfileWithVehicles = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        populate: { 
            vehicles: {
                populate: true 
            }
        }
      })

      return ctx.send({success: true, hasVehicle: true, vehicles: driverProfileWithVehicles.vehicles});
    } catch (error) {
      strapi.log.error('Find vehicles error:', error);
      return ctx.internalServerError('Failed to get vehicles');
    }
  },

  // Add vehicle
  async addVehicle(ctx) {
    try {
      const userId = ctx.state.user.id;
      const data = ctx.request.body.data;

      const vehicle = await strapi.db.query('api::vehicle.vehicle').create({
        data: {
          ...data,
          owner: userId,
          verificationStatus: 'not_started',
          isActive: false,
        }
      });

      return ctx.send(vehicle);
    } catch (error) {
      strapi.log.error('Add vehicle error:', error);
      return ctx.internalServerError('Failed to add vehicle');
    }
  },

  // Update vehicle
  async updateDriverVehicle(ctx) {
    try {
      const userId = ctx.state.user.id;
      const data = ctx.request.body.data;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const driverProfileWithAssignedVehicle = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        populate: { 
            assignedVehicle: {
                populate: true 
            }
        }
      })

      if (!driverProfileWithAssignedVehicle?.assignedVehicle?.id) {
        return ctx.notFound('Vehicle not found');
      }

      // Update vehicle - preserving existing data
      const updated = await strapi.db.query('api::vehicle.vehicle').update({
        where: { id: driverProfileWithAssignedVehicle.assignedVehicle.id },
        data: {
          ...data,
        }
      });

      return ctx.send(updated);
    } catch (error) {
      strapi.log.error('Update vehicle error:', error);
      return ctx.internalServerError('Failed to update vehicle');
    }
  },
}));

