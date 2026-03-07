// PATH: Okra/Okrarides/backend/src/api/device/controllers/device.ts
//
// Only updateUserCurrentLocation has changed vs the original:
//   • Uses mapProviderService.reverseGeocode() instead of googleMapService directly
//   • All other methods are unchanged from the original file

import { factories } from '@strapi/strapi';
import { reverseGeocode } from '../../../services/mapProviderService';
import RideBookingService from '../../../services/rideBookingService';
import socketService from '../../../services/socketService';

export default factories.createCoreController('api::device.device', ({ strapi }) => ({
  // ========================
  // DEFAULT CRUD OPERATIONS  (unchanged)
  // ========================

  async find(ctx) {
    try {
      const sanitizedQuery = await this.sanitizeQuery(ctx);
      const { results, pagination } = await strapi.service('api::device.device').find(sanitizedQuery);
      const sanitizedResults = await this.sanitizeOutput(results, ctx);
      return this.transformResponse(sanitizedResults, { pagination });
    } catch (error) {
      console.error('Error finding devices:', error);
      ctx.internalServerError('Failed to fetch devices');
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const sanitizedQuery = await this.sanitizeQuery(ctx);
      const entity = await strapi.service('api::device.device').findOne(id, sanitizedQuery);
      if (!entity) return ctx.notFound('Device not found');
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      console.error('Error finding device:', error);
      ctx.internalServerError('Failed to fetch device');
    }
  },

  async create(ctx) {
    try {
      const sanitizedInput = await this.sanitizeInput(ctx.request.body, ctx);
      const entity = await strapi.service('api::device.device').create({ data: sanitizedInput });
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      console.error('Error creating device:', error);
      ctx.internalServerError('Failed to create device');
    }
  },

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const sanitizedInput = await this.sanitizeInput(ctx.request.body, ctx);
      const existingDevice = await strapi.service('api::device.device').findOne(id);
      if (!existingDevice) return ctx.notFound('Device not found');
      const entity = await strapi.service('api::device.device').update(id, { data: sanitizedInput });
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      console.error('Error updating device:', error);
      ctx.internalServerError('Failed to update device');
    }
  },

  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const existingDevice = await strapi.service('api::device.device').findOne(id);
      if (!existingDevice) return ctx.notFound('Device not found');
      const entity = await strapi.service('api::device.device').delete(id);
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      console.error('Error deleting device:', error);
      ctx.internalServerError('Failed to delete device');
    }
  },

  // ========================
  // CUSTOM OPERATIONS
  // ========================

  async registerDevices(ctx) {
    const { userId, devices } = ctx.request.body;
    if (!Array.isArray(devices)) return ctx.badRequest('Devices array is required');

    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId);
    if (!user) return ctx.notFound('User not found');

    const registeredDevices = [];

    for (const device of devices) {
      const { deviceId, notificationToken, deviceInfo, frontendName } = device;
      const existing = await strapi.entityService.findMany('api::device.device', {
        filters: { deviceId },
        limit: 1,
      });

      const baseDeviceInfo = {
        ...(deviceInfo || {}),
        frontendName,
        lastSeen: new Date().toISOString(),
        active: true,
        updatedAt: new Date().toISOString(),
      };

      if (existing.length) {
        const updated = await strapi.entityService.update('api::device.device', existing[0].id, {
          data: {
            notificationToken,
            deviceInfo: { ...((existing[0].deviceInfo as Record<string, any>) || {}), ...baseDeviceInfo },
            user: userId,
          },
        });
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: userId },
          data: { activeDevice: existing[0].id, devices: { connect: [existing[0].id] } },
        });
        registeredDevices.push(updated);
      } else {
        const created = await strapi.entityService.create('api::device.device', {
          data: {
            deviceId,
            notificationToken,
            deviceInfo: { ...baseDeviceInfo, registeredAt: new Date().toISOString() },
            user: userId,
          },
        });
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: userId },
          data: { devices: { connect: [created.id] }, activeDevice: created.id },
        });
        registeredDevices.push(created);
      }
    }

    ctx.send({ success: true, deviceCount: registeredDevices.length, devices: registeredDevices });
  },

  // ─── UPDATED: uses mapProviderService for priority-based geocoding ─────────
  async updateUserCurrentLocation(ctx) {
    try {
      const { deviceId, location } = ctx.request.body;

      if (!deviceId) return ctx.badRequest('Device ID is required');
      if (!location || typeof location !== 'object') return ctx.badRequest('Location object is required');
      if (!location.latitude || !location.longitude)
        return ctx.badRequest('Location must include latitude and longitude');

      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
        populate: ['user'],
      });

      if (!device) return ctx.notFound('Device not found');
      if (!device.user) return ctx.badRequest('Device is not associated with a user');

      let locationDetails: any = {
        latitude: location.latitude,
        longitude: location.longitude,
        ...(location.accuracy !== undefined && { accuracy: location.accuracy }),
        ...(location.altitude !== undefined && { altitude: location.altitude }),
        ...(location.altitudeAccuracy !== undefined && { altitudeAccuracy: location.altitudeAccuracy }),
        ...(location.heading !== undefined && { heading: location.heading }),
        ...(location.speed !== undefined && { speed: location.speed }),
        timestamp: location.timestamp
          ? new Date(location.timestamp).toISOString()
          : new Date().toISOString(),
      };

      // ── Priority-based geocoding (Yandex → Google → local) ───────────────
      try {
        const geocodingData = await reverseGeocode(location.latitude, location.longitude);

        if (geocodingData) {
          locationDetails = {
            ...locationDetails,
            name: geocodingData.name,
            address: geocodingData.address,
            placeId: geocodingData.placeId,
            city: geocodingData.city,
            country: geocodingData.country,
            postalCode: geocodingData.postalCode,
            state: geocodingData.state,
            streetAddress: geocodingData.streetAddress,
            streetNumber: geocodingData.streetNumber,
          };
        } else {
          console.warn('[device controller] No geocoding result from any provider');
        }
      } catch (geocodingError) {
        console.error('[device controller] Geocoding error (non-fatal):', geocodingError);
      }

      // Update user's current location
      const updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: device.user.id },
        data: { currentLocation: locationDetails },
      });

      // Update device lastSeen + lastLocation
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: device.user.id },
        populate: ['activeDevice'],
      });

      await strapi.db.query('api::device.device').update({
        where: { id: user?.activeDevice?.id || device.id },
        data: {
          deviceInfo: {
            ...(device.deviceInfo || {}),
            lastSeen: new Date().toISOString(),
            lastLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
              timestamp: locationDetails.timestamp,
            },
          },
        },
      });

      ctx.send({
        success: true,
        message: 'User location updated successfully',
        userId: device.user.id,
        location: updatedUser.currentLocation,
      });
    } catch (error) {
      console.error('Error updating user location:', error);
      ctx.internalServerError('Failed to update user location');
    }
  },

  // ─── All remaining methods unchanged from original ────────────────────────

  async updateDevice(ctx) {
    const { userId, deviceId } = ctx.params;
    const updateData = ctx.request.body;
    try {
      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
        populate: ['user'],
      });
      if (!device) return ctx.notFound('Device not found');
      if (device.user.id !== parseInt(userId)) return ctx.forbidden('Device does not belong to this user');

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: device.user.id },
        populate: ['activeDevice'],
      });

      const updatedDevice = await strapi.db.query('api::device.device').update({
        where: { id: user?.activeDevice?.id || device.id },
        data: {
          notificationToken: updateData.notificationToken || device.notificationToken,
          deviceInfo: {
            ...(device.deviceInfo || {}),
            ...(updateData.deviceInfo || {}),
            lastSeen: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });

      ctx.send({ success: true, message: 'Device updated successfully', device: updatedDevice });
    } catch (error) {
      console.error('Error updating device:', error);
      ctx.internalServerError('Failed to update device');
    }
  },

  async getUserDevices(ctx) {
    const { userId } = ctx.params;
    try {
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: userId } });
      if (!user) return ctx.notFound('User not found');
      const devices = await strapi.db.query('api::device.device').findMany({ where: { user: userId } });
      ctx.send({ success: true, devices: devices || [] });
    } catch (error) {
      console.error('Error getting user devices:', error);
      ctx.internalServerError('Failed to get devices');
    }
  },

  async removeDevice(ctx) {
    const { userId, deviceId } = ctx.params;
    try {
      const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
      if (!device) return ctx.notFound('Device not found');
      if (device.user.id !== parseInt(userId)) return ctx.forbidden('Device does not belong to this user');
      await strapi.db.query('api::device.device').delete({ where: { id: device.id } });
      ctx.send({ success: true, message: 'Device removed successfully' });
    } catch (error) {
      console.error('Error removing device:', error);
      ctx.internalServerError('Failed to remove device');
    }
  },

  async checkDevicePermissions(ctx) {
    const { deviceId } = ctx.params;
    try {
      const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId } });
      if (!device) return ctx.notFound('Device not found');
      const hasPermissions = !!(
        device.deviceInfo?.permissions && Object.keys(device.deviceInfo.permissions).length > 0
      );
      ctx.send({ permissions: device?.deviceInfo?.permissions, success: true, hasPermissions, deviceId });
    } catch (error) {
      console.error('Error checking device permissions:', error);
      ctx.internalServerError('Failed to check device permissions');
    }
  },

  async count(ctx) {
    try {
      const sanitizedQuery = await this.sanitizeQuery(ctx);
      const count = await strapi.service('api::device.device').count(sanitizedQuery);
      return { data: { count, timestamp: new Date().toISOString() } };
    } catch (error) {
      console.error('Error counting devices:', error);
      ctx.internalServerError('Failed to count devices');
    }
  },

  async bulkCreate(ctx) {
    try {
      const { devices } = ctx.request.body;
      if (!Array.isArray(devices) || devices.length === 0)
        return ctx.badRequest('Devices array is required and cannot be empty');
      const createdDevices = [];
      for (const deviceData of devices) {
        const sanitizedInput = await this.sanitizeInput(deviceData, ctx);
        const entity = await strapi.service('api::device.device').create({ data: sanitizedInput });
        createdDevices.push(entity);
      }
      const sanitizedResults = await this.sanitizeOutput(createdDevices, ctx);
      return this.transformResponse(sanitizedResults, {
        message: `Successfully created ${createdDevices.length} devices`,
      });
    } catch (error) {
      console.error('Error in bulk create:', error);
      ctx.internalServerError('Failed to bulk create devices');
    }
  },

  async bulkDelete(ctx) {
    try {
      const { ids } = ctx.request.body;
      if (!Array.isArray(ids) || ids.length === 0)
        return ctx.badRequest('Device IDs array is required and cannot be empty');
      const deletedDevices = [];
      for (const id of ids) {
        const entity = await strapi.service('api::device.device').delete(id);
        if (entity) deletedDevices.push(entity);
      }
      const sanitizedResults = await this.sanitizeOutput(deletedDevices, ctx);
      return this.transformResponse(sanitizedResults, {
        message: `Successfully deleted ${deletedDevices.length} devices`,
      });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      ctx.internalServerError('Failed to bulk delete devices');
    }
  },

  async search(ctx) {
    try {
      const { query, field = 'deviceId' } = ctx.query as { query: string; field?: string };
      if (!query) return ctx.badRequest('Search query is required');
      const sanitizedQuery = await this.sanitizeQuery(ctx);
      const { results, pagination } = await strapi.service('api::device.device').find({
        ...sanitizedQuery,
        filters: { [field as string]: { $contains: query } },
      });
      const sanitizedResults = await this.sanitizeOutput(results, ctx);
      return this.transformResponse(sanitizedResults, {
        pagination,
        searchInfo: { query, field, count: results.length },
      });
    } catch (error) {
      console.error('Error searching devices:', error);
      ctx.internalServerError('Failed to search devices');
    }
  },

  async getActiveRideByDevice(ctx) {
    try {
      const { deviceId } = ctx.params;
      if (!deviceId) return ctx.badRequest('Device ID is required');

      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
        populate: {
          user: {
            populate: {
              riderProfile: { populate: true },
              driverProfile: { populate: { assignedVehicle: true } },
              profileActivityStatus: true,
            },
          },
        },
      });

      if (!device) return ctx.notFound('Device not found');
      if (!device.user) return ctx.badRequest('Device is not associated with a user');

      const user = device.user;
      const userId = user.id;
      const riderActiveStatuses = ['pending', 'accepted', 'arrived', 'passenger_onboard'];
      const excludedDriverStatuses = ['completed', 'cancelled', 'no_drivers_available'];

      if (user.riderProfile) {
        const riderActiveRide = await strapi.db.query('api::ride.ride').findOne({
          where: {
            rider: { id: { $eq: userId }, riderProfile: { isActive: { $eq: true }, blocked: { $eq: false } } },
            rideStatus: { $in: riderActiveStatuses },
          },
          populate: {
            rider: { populate: { riderProfile: true } },
            driver: { populate: { driverProfile: { populate: { assignedVehicle: true } } } },
            vehicle: true, rideClass: true, taxiType: true, pickupStation: true, dropoffStation: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (riderActiveRide) {
          return ctx.send({ success: true, data: riderActiveRide, userRole: 'rider', message: 'Active ride found as rider' });
        }
      }

      if (user.driverProfile) {
        const driverActiveRide = await strapi.db.query('api::ride.ride').findOne({
          where: {
            driver: { id: { $eq: userId }, driverProfile: { isActive: { $eq: true }, blocked: { $eq: false }, verificationStatus: { $eq: 'approved' } } },
            rideStatus: { $notIn: excludedDriverStatuses },
          },
          populate: {
            rider: { populate: { riderProfile: true } },
            driver: { populate: { driverProfile: { populate: { assignedVehicle: true, taxiDriver: true, busDriver: true, motorbikeRider: true, currentSubscription: true } } } },
            vehicle: true, rideClass: true, taxiType: true, pickupStation: true, dropoffStation: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (driverActiveRide) {
          return ctx.send({ success: true, data: driverActiveRide, userRole: 'driver', message: 'Active ride found as driver' });
        }
      }

      return ctx.send({ success: true, data: null, userRole: null, message: 'No active rides' });
    } catch (error) {
      strapi.log.error('Get active ride by device error:', error);
      return ctx.internalServerError('Failed to get active ride');
    }
  },

  async getPendingRideByDevice(ctx) {
    const { deviceId } = ctx.params;
    if (!deviceId) return ctx.badRequest('Device ID is required');

    try {
      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
        populate: ['user'],
      });
      if (!device) return ctx.notFound('Device not found');
      const user = device.user;
      if (!user) return ctx.badRequest('Device not associated with a user');

      const rides = await strapi.db.query('api::ride.ride').findMany({
        where: { rideStatus: 'pending', requestedDriverAccounts: { id: user.id } },
        populate: { rider: { select: ['id', 'username', 'firstName', 'lastName', 'phoneNumber'] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!rides.length) return ctx.send({ success: true, data: [], message: 'No pending ride requests' });

      const enrichedRides = rides.map((ride) => ({
        rideId: ride.id, rideCode: ride.rideCode, rideStatus: ride.rideStatus,
        requestedAt: ride.requestedAt, distance: ride.estimatedDistance, estimatedFare: ride.totalFare,
        rider: ride.rider ? {
          id: ride.rider.id,
          name: ride.rider.firstName && ride.rider.lastName
            ? `${ride.rider.firstName} ${ride.rider.lastName}`
            : ride.rider.username || 'Rider',
          phoneNumber: ride.rider.phoneNumber,
          profilePicture: ride.rider.profilePicture,
        } : null,
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation,
      }));

      ctx.send({ success: true, data: enrichedRides, message: `Found ${enrichedRides.length} pending ride(s)` });
    } catch (error) {
      strapi.log.error('Error fetching pending ride by device:', error);
      ctx.internalServerError('Failed to fetch pending ride');
    }
  },

  async acceptRideByDevice(ctx) {
    try {
      const { deviceId } = ctx.params;
      if (!deviceId) return ctx.badRequest('Device ID is required');

      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
        populate: { user: { populate: { driverProfile: { populate: { assignedVehicle: true, currentSubscription: true } } } } },
      });

      if (!device) return ctx.notFound('Device not found');
      if (!device.user) return ctx.badRequest('Device is not associated with a user');

      const user = device.user;
      const driverId = user.id;
      if (!user.driverProfile) return ctx.badRequest('User does not have a driver profile');

      const eligibilityCheck = await RideBookingService.canDriverAcceptRides(driverId);
      if (!eligibilityCheck.canAccept) return ctx.forbidden(eligibilityCheck.reason);

      const pendingRides = await strapi.db.query('api::ride.ride').findMany({
        where: { rideStatus: 'pending' },
        populate: ['rider', 'driver'],
        orderBy: { createdAt: 'desc' },
        limit: 50,
      });

      const ride = pendingRides.find((r) => {
        const requestedDrivers = r.requestedDrivers || [];
        return requestedDrivers.some((rd) => rd.driverId === driverId);
      });

      if (!ride) return ctx.notFound('No pending ride request found for this driver');

      const currentRide = await strapi.db.query('api::ride.ride').findOne({
        where: { id: ride.id },
        populate: ['rider', 'driver'],
      });

      if (!currentRide || currentRide.rideStatus !== 'pending') return ctx.badRequest('Ride is no longer available');

      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id: currentRide.id },
        data: {
          rideStatus: 'accepted', driver: driverId,
          vehicle: user.driverProfile.assignedVehicle?.id || null,
          acceptedAt: new Date(),
        },
        populate: {
          rider: { populate: { riderProfile: true } },
          driver: { populate: { driverProfile: { populate: { assignedVehicle: true } } } },
          vehicle: true, rideClass: true, taxiType: true, pickupStation: true, dropoffStation: true,
        },
      });

      socketService.emit('ride:accepted', {
        rideId: updatedRide.id, driverId, riderId: currentRide.rider?.id,
        driver: {
          id: user.id, firstName: user.firstName, lastName: user.lastName,
          phoneNumber: user.phoneNumber, profilePicture: user.profilePicture,
          driverProfile: {
            averageRating: user.driverProfile.averageRating,
            totalRatings: user.driverProfile.totalRatings || 0,
            completedRides: user.driverProfile.completedRides || 0,
          },
        },
        vehicle: user.driverProfile.assignedVehicle ? {
          id: user.driverProfile.assignedVehicle.id,
          numberPlate: user.driverProfile.assignedVehicle.numberPlate,
          make: user.driverProfile.assignedVehicle.make,
          model: user.driverProfile.assignedVehicle.model,
          color: user.driverProfile.assignedVehicle.color,
        } : null,
        eta: 180, distance: 1.5,
      });

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: driverId },
        data: { driverProfile: { id: user.driverProfile.id, isAvailable: false, currentRide: currentRide.id } },
      });

      const requestedDrivers = currentRide.requestedDrivers || [];
      const otherDriverIds = requestedDrivers.filter((rd) => rd.driverId !== driverId).map((rd) => rd.driverId);
      if (otherDriverIds.length > 0) socketService.emit('ride:taken', { rideId: currentRide.id, driverIds: otherDriverIds });

      return ctx.send({ success: true, data: updatedRide, message: 'Ride accepted successfully' });
    } catch (error) {
      strapi.log.error('Accept ride by device error:', error);
      return ctx.internalServerError('Failed to accept ride');
    }
  },
}));
