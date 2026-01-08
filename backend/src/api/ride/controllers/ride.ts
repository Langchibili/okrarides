// import { factories } from '@strapi/strapi';

// export default factories.createCoreController('api::ride.ride');
// ============================================
// src/api/ride/controllers/ride.ts
// ============================================

import { factories } from '@strapi/strapi';
import { generateUniqueRideCode }  from '../../../services/generateUniqueRideCode';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface EstimateRequest {
  pickupLocation: Location;
  dropoffLocation: Location;
  rideType?: string;
  rideTypes?: string[];
  passengerCount?: number;
}

export default factories.createCoreController('api::ride.ride', ({ strapi }) => ({
  // ============================================
  // Keep all default CRUD operations
  // ============================================
  async find(ctx) {
    // Add custom query logic if needed
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  async findOne(ctx) {
    const { data, meta } = await super.findOne(ctx);
    return { data, meta };
  },

  async create(ctx) {
    //console.log('ctx.request.body', ctx.request.body);
    
    const { data } = ctx.request.body;
    
    // Generate ride code if not present
    data.rideCode = data.rideCode ? data.rideCode : await generateUniqueRideCode();
    
    // Convert taxiType string to ID if needed
    if (data.taxiType && typeof data.taxiType === 'string') {
        const taxiTypeRecord = await strapi.db.query('api::taxi-type.taxi-type').findOne({
        where: { name: data.taxiType } // or whatever field contains "taxi"
        });
        
        if (taxiTypeRecord) {
        data.taxiType = taxiTypeRecord.id;
        } else {
        // Handle case when taxi type doesn't exist
        return ctx.badRequest('Invalid taxi type');
        }
    }
    
    // Same for rideClass if it might be a string
    if (data.rideClass && typeof data.rideClass === 'string') {
        const rideClassRecord = await strapi.db.query('api::ride-class.ride-class').findOne({
        where: { name: data.rideClass } // adjust field as needed
        });
        
        if (rideClassRecord) {
        data.rideClass = rideClassRecord.id;
        }
    }
    
    const response = await super.create(ctx);
    
    // Emit event for driver matching
    strapi.eventHub.emit('ride.created', { ride: response.data });
    
    return response;
  },

  async update(ctx) {
    const response = await super.update(ctx);
    
    // Emit events based on status changes
    const ride = response.data;
    if (ride.attributes?.status) {
      strapi.eventHub.emit(`ride.status.${ride.attributes.status}`, { ride });
    }
    
    return response;
  },

  async delete(ctx) {
    return await super.delete(ctx);
  },

  // ============================================
  // CUSTOM METHOD 1: Estimate Fare
  // ============================================
  async estimate(ctx) {
    try {
      const {
        pickupLocation,
        dropoffLocation,
        rideType = 'taxi',
        rideTypes = ['taxi'],
        passengerCount = 1,
      }: EstimateRequest = ctx.request.body;
      // Validate input
      if (!pickupLocation || !dropoffLocation) {
        return ctx.badRequest('Pickup and dropoff locations are required');
      }

      // Calculate distance and duration
      const distance = calculateDistance(pickupLocation, dropoffLocation);
      const duration = estimateDuration(distance);

      // Get active ride classes for the taxi type
      const rideClasses = await strapi.db.query('api::ride-class.ride-class').findMany({
        where: {
          isActive: true,
          $or: rideTypes.map(type => ({
            taxiType: {
              name: {
                $containsi: type,
              },
            },
          })),
        },
        populate: {
          taxiType: true,
        },
      });

      if (!rideClasses || rideClasses.length === 0) {
        return ctx.badRequest('No active ride classes found');
      }

      // Get surge pricing if applicable
      const surgePricing = await strapi.db.query('api::surge-pricing.surge-pricing').findOne({
        where: {
          isActive: true,
          startTime: { $lte: new Date() },
          endTime: { $gte: new Date() },
        },
      });

      const surgeMultiplier = surgePricing?.multiplier || 1;

      // Calculate estimates for each ride class
      const estimates = rideClasses.map((rideClass: any) => {
        const baseFare = rideClass.baseFare;
        const distanceFare = distance * rideClass.perKmRate;
        const timeFare = duration * rideClass.perMinuteRate;
        const subtotal = baseFare + distanceFare + timeFare;
        const surgeFare = subtotal * (surgeMultiplier - 1);
        const totalFare = subtotal + surgeFare;

        // Count available drivers (mock - you'd implement actual driver availability)
        const availableDrivers = Math.floor(Math.random() * 10) + 1;

        return {
          rideClassId: rideClass.id,
          rideClassName: rideClass.name,
          rideClassDescription: rideClass.description,
          taxiType: rideClass.taxiType?.name,
          baseFare: parseFloat(baseFare.toFixed(2)),
          distanceFare: parseFloat(distanceFare.toFixed(2)),
          timeFare: parseFloat(timeFare.toFixed(2)),
          surgeFare: parseFloat(surgeFare.toFixed(2)),
          subtotal: parseFloat(subtotal.toFixed(2)),
          totalFare: parseFloat(totalFare.toFixed(2)),
          estimatedDistance: parseFloat(distance.toFixed(2)),
          estimatedDuration: duration,
          availableDrivers,
          surgeActive: surgeMultiplier > 1,
          surgeMultiplier,
        };
      });

      // Sort by price
      estimates.sort((a, b) => a.totalFare - b.totalFare);

      return ctx.send({
        estimates,
        route: {
          distance: `${distance.toFixed(1)} km`,
          duration: `${duration} min`,
          polyline: '', // You can integrate with Google Maps Directions API
        },
        surgePricing: surgeMultiplier > 1 ? {
          active: true,
          multiplier: surgeMultiplier,
          reason: surgePricing?.reason,
        } : null,
      });
    } catch (error) {
      strapi.log.error('Estimate error:', error);
      return ctx.internalServerError('Failed to calculate fare estimate');
    }
  },

  // ============================================
  // CUSTOM METHOD 2: Get Driver Location
  // ============================================
  async getDriverLocation(ctx) {
    try {
      const { id } = ctx.params;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: {
          driver: {
            populate: ['driverProfile'],
          },
        },
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      if (!ride.driver) {
        return ctx.badRequest('No driver assigned to this ride');
      }

      // Get driver's current location
      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: ride.driver.id },
        select: ['currentLocation', 'lastSeen', 'isOnline'],
      });

      if (!driver?.currentLocation) {
        return ctx.notFound('Driver location not available');
      }

      return ctx.send({
        location: driver.currentLocation,
        lastUpdated: driver.lastSeen || new Date(),
        isOnline: driver.isOnline || false,
        rideStatus: ride.status,
      });
    } catch (error) {
      strapi.log.error('Get driver location error:', error);
      return ctx.internalServerError('Failed to get driver location');
    }
  },

  // ============================================
  // CUSTOM METHOD 3: Track Ride
  // ============================================
  async trackRide(ctx) {
    try {
      const { id } = ctx.params;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: {
          driver: {
            populate: {
              driverProfile: true,
            },
          },
          vehicle: true,
          pickupStation: true,
          dropoffStation: true,
        },
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      // Get driver's current location
      let driverLocation = null;
      let eta = null;
      let distance = null;

      if (ride.driver) {
        const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: ride.driver.id },
          select: ['currentLocation', 'lastSeen', 'isOnline'],
        });

        if (driver?.currentLocation) {
          driverLocation = driver.currentLocation;

          // Calculate ETA based on status
          if (ride.status === 'accepted' || ride.status === 'arrived') {
            distance = calculateDistance(
              driver.currentLocation,
              ride.pickupLocation
            );
            eta = Math.ceil(distance * 3); // 3 minutes per km
          } else if (ride.status === 'passenger_onboard') {
            distance = calculateDistance(
              driver.currentLocation,
              ride.dropoffLocation
            );
            eta = Math.ceil(distance * 3);
          }
        }
      }

      // Build tracking response
      const trackingData = {
        ride: {
          id: ride.id,
          rideCode: ride.rideCode,
          status: ride.status,
          pickupLocation: ride.pickupLocation,
          dropoffLocation: ride.dropoffLocation,
          requestedAt: ride.requestedAt,
          acceptedAt: ride.acceptedAt,
          arrivedAt: ride.arrivedAt,
          tripStartedAt: ride.tripStartedAt,
          estimatedDistance: ride.estimatedDistance,
          estimatedDuration: ride.estimatedDuration,
        },
        driver: ride.driver ? {
          id: ride.driver.id,
          firstName: ride.driver.firstName,
          lastName: ride.driver.lastName,
          phoneNumber: ride.driver.phoneNumber,
          profilePicture: ride.driver.profilePicture,
          averageRating: ride.driver.driverProfile?.averageRating || 0,
          totalRides: ride.driver.driverProfile?.completedRides || 0,
          currentLocation: driverLocation,
        } : null,
        vehicle: ride.vehicle ? {
          numberPlate: ride.vehicle.numberPlate,
          make: ride.vehicle.make,
          model: ride.vehicle.model,
          color: ride.vehicle.color,
        } : null,
        tracking: {
          eta: eta ? `${eta} min` : null,
          distance: distance ? `${distance.toFixed(1)} km` : null,
          lastUpdated: new Date(),
        },
      };

      return ctx.send(trackingData);
    } catch (error) {
      strapi.log.error('Track ride error:', error);
      return ctx.internalServerError('Failed to track ride');
    }
  },

  // ============================================
  // CUSTOM METHOD 4: Get Receipt
  // ============================================
  async getReceipt(ctx) {
    try {
      const { id } = ctx.params;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: {
          rider: true,
          driver: {
            populate: ['driverProfile'],
          },
          vehicle: true,
          rideClass: true,
          taxiType: true,
          promoCode: true,
        },
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      if (ride.status !== 'completed') {
        return ctx.badRequest('Receipt is only available for completed rides');
      }

      // Build receipt
      const receipt = {
        rideDetails: {
          rideCode: ride.rideCode,
          date: ride.tripCompletedAt || ride.createdAt,
          status: ride.status,
        },
        locations: {
          pickup: {
            address: ride.pickupLocation.address,
            coordinates: {
              lat: ride.pickupLocation.lat,
              lng: ride.pickupLocation.lng,
            },
          },
          dropoff: {
            address: ride.dropoffLocation.address,
            coordinates: {
              lat: ride.dropoffLocation.lat,
              lng: ride.dropoffLocation.lng,
            },
          },
        },
        tripInfo: {
          distance: `${(ride.actualDistance || ride.estimatedDistance || 0).toFixed(2)} km`,
          duration: `${ride.actualDuration || ride.estimatedDuration || 0} min`,
          rideClass: ride.rideClass?.name,
          taxiType: ride.taxiType?.name,
        },
        fareBreakdown: {
          baseFare: parseFloat((ride.baseFare || 0).toFixed(2)),
          distanceFare: parseFloat((ride.distanceFare || 0).toFixed(2)),
          timeFare: parseFloat((ride.timeFare || 0).toFixed(2)),
          surgeFare: parseFloat((ride.surgeFare || 0).toFixed(2)),
          subtotal: parseFloat((ride.subtotal || 0).toFixed(2)),
          promoDiscount: parseFloat((ride.promoDiscount || 0).toFixed(2)),
          totalFare: parseFloat(ride.totalFare.toFixed(2)),
        },
        promoCode: ride.promoCode ? {
          code: ride.promoCode.code,
          name: ride.promoCode.name,
          discount: parseFloat((ride.promoDiscount || 0).toFixed(2)),
        } : null,
        payment: {
          method: ride.paymentMethod,
          status: ride.paymentStatus,
        },
        driver: ride.driver ? {
          name: `${ride.driver.firstName} ${ride.driver.lastName}`,
          phoneNumber: ride.driver.phoneNumber,
          rating: ride.driver.driverProfile?.averageRating || 0,
        } : null,
        vehicle: ride.vehicle ? {
          numberPlate: ride.vehicle.numberPlate,
          make: ride.vehicle.make,
          model: ride.vehicle.model,
          color: ride.vehicle.color,
        } : null,
      };

      return ctx.send(receipt);
    } catch (error) {
      strapi.log.error('Get receipt error:', error);
      return ctx.internalServerError('Failed to generate receipt');
    }
  },

  // ============================================
  // CUSTOM METHOD 5: Share Tracking
  // ============================================
  async shareTracking(ctx) {
    try {
      const { id } = ctx.params;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        select: ['id', 'rideCode', 'status'],
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      // Check if ride is in trackable state
      const trackableStatuses = ['accepted', 'arrived', 'passenger_onboard'];
      if (!trackableStatuses.includes(ride.status)) {
        return ctx.badRequest('Ride is not in a trackable state');
      }

      // Generate unique tracking token
      const crypto = require('crypto');
      const trackingToken = crypto.randomBytes(32).toString('hex');

      // Store tracking token (you might want to create a separate tracking_tokens table)
      // For now, we'll just generate the URL

      const baseUrl = strapi.config.get('server.url') || 'http://localhost:1337';
      const trackingUrl = `${baseUrl}/track/${ride.rideCode}/${trackingToken}`;

      // Set expiry (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      return ctx.send({
        trackingUrl,
        trackingToken,
        rideCode: ride.rideCode,
        expiresAt,
        message: 'Share this link to allow others to track this ride in real-time',
      });
    } catch (error) {
      strapi.log.error('Share tracking error:', error);
      return ctx.internalServerError('Failed to generate tracking link');
    }
  },
   // Accept ride
  async acceptRide(ctx) {
    try {
      const { id } = ctx.params;
      const driverId = ctx.state.user.id;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: ['rider', 'driver']
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      if (ride.status !== 'pending') {
        return ctx.badRequest('Ride is not available');
      }

      // Check if driver is available
      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: driverId },
        populate: { driverProfile: true }
      });

      if (!driver.driverProfile?.isAvailable) {
        return ctx.badRequest('Driver is not available');
      }

      // Update ride
      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          status: 'accepted',
          driver: driverId,
          acceptedAt: new Date(),
        }
      });

      // Update driver profile - preserving existing component data
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: driverId },
        data: {
          driverProfile: {
            ...driver.driverProfile,
            isAvailable: false,
            currentRide: id,
          }
        }
      });

      // Emit events
      strapi.eventHub.emit('ride:accepted', { ride: updatedRide, driverId });

      return ctx.send(updatedRide);
    } catch (error) {
      strapi.log.error('Accept ride error:', error);
      return ctx.internalServerError('Failed to accept ride');
    }
  },

  // Decline ride
  async declineRide(ctx) {
    try {
      const { id } = ctx.params;
      const driverId = ctx.state.user.id;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id }
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      // Remove driver from requested list
      const requestedDrivers = ride.requestedDrivers || [];
      const updatedDrivers = requestedDrivers.filter(d => d.driverId !== driverId);

      await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          requestedDrivers: updatedDrivers
        }
      });

      return ctx.send({ message: 'Ride declined successfully' });
    } catch (error) {
      strapi.log.error('Decline ride error:', error);
      return ctx.internalServerError('Failed to decline ride');
    }
  },

  // Confirm arrival
  async confirmArrival(ctx) {
    try {
      const { id } = ctx.params;
      const driverId = ctx.state.user.id;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id, driver: driverId }
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      if (ride.status !== 'accepted') {
        return ctx.badRequest('Invalid ride status');
      }

      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          status: 'arrived',
          arrivedAt: new Date(),
        }
      });

      strapi.eventHub.emit('ride:arrived', { ride: updatedRide });

      return ctx.send(updatedRide);
    } catch (error) {
      strapi.log.error('Confirm arrival error:', error);
      return ctx.internalServerError('Failed to confirm arrival');
    }
  },

  // Start trip
  async startTrip(ctx) {
    try {
      const { id } = ctx.params;
      const driverId = ctx.state.user.id;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id, driver: driverId }
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      if (ride.status !== 'arrived') {
        return ctx.badRequest('Must confirm arrival first');
      }

      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          status: 'passenger_onboard',
          tripStartedAt: new Date(),
        }
      });

      strapi.eventHub.emit('ride:started', { ride: updatedRide });

      return ctx.send(updatedRide);
    } catch (error) {
      strapi.log.error('Start trip error:', error);
      return ctx.internalServerError('Failed to start trip');
    }
  },

  // Complete trip
  async completeTrip(ctx) {
    try {
      const { id } = ctx.params;
      const driverId = ctx.state.user.id;
      const { actualDistance, actualDuration } = ctx.request.body;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id, driver: driverId },
        populate: ['driver', 'rideClass']
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      if (ride.status !== 'passenger_onboard') {
        return ctx.badRequest('Trip not started');
      }

      // Calculate commission
      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      let commission = 0;
      
      if (settings?.commissionType === 'percentage') {
        commission = (ride.totalFare * (settings.defaultCommissionPercentage || 15)) / 100;
      } else if (settings?.commissionType === 'flat_rate') {
        commission = settings.defaultFlatCommission || 0;
      }

      const driverEarnings = ride.totalFare - commission;

      // Update ride
      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          status: 'completed',
          tripCompletedAt: new Date(),
          actualDistance: actualDistance || ride.estimatedDistance,
          actualDuration: actualDuration || ride.estimatedDuration,
          commission,
          driverEarnings,
          commissionDeducted: true,
        }
      });

      // Update driver profile - getting existing data and updating it
      const driver = ride.driver;
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: driverId },
        data: {
          driverProfile: {
            ...driver.driverProfile,
            isAvailable: true,
            currentRide: null,
            completedRides: (driver.driverProfile.completedRides || 0) + 1,
            totalRides: (driver.driverProfile.totalRides || 0) + 1,
            totalEarnings: (driver.driverProfile.totalEarnings || 0) + driverEarnings,
            currentBalance: (driver.driverProfile.currentBalance || 0) + driverEarnings,
          }
        }
      });

      // Create ledger entry
      await strapi.db.query('api::ledger-entry.ledger-entry').create({
        data: {
          entryId: `LE-${Date.now()}`,
          driver: driverId,
          ride: id,
          type: 'fare',
          amount: driverEarnings,
          source: ride.paymentMethod,
          status: 'settled',
        }
      });

      strapi.eventHub.emit('ride:completed', { ride: updatedRide });

      return ctx.send(updatedRide);
    } catch (error) {
      strapi.log.error('Complete trip error:', error);
      return ctx.internalServerError('Failed to complete trip');
    }
  },

  // Cancel ride
  async cancelRide(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;
      const { reason, cancelledBy } = ctx.request.body;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: ['rider', 'driver']
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      if (ride.status === 'completed' || ride.status === 'cancelled') {
        return ctx.badRequest('Cannot cancel this ride');
      }

      // Calculate cancellation fee if applicable
      let cancellationFee = 0;
      const cancellationReason = await strapi.db.query('api::cancellation-reason.cancellation-reason').findOne({
        where: { code: reason }
      });

      if (cancellationReason?.hasFee) {
        cancellationFee = cancellationReason.feeAmount || 0;
      }

      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy,
          cancellationReason: reason,
          cancellationFee,
        }
      });

      // Update driver if assigned
      if (ride.driver) {
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: ride.driver.id },
          data: {
            driverProfile: {
              ...ride.driver.driverProfile,
              isAvailable: true,
              currentRide: null,
              cancelledRides: (ride.driver.driverProfile.cancelledRides || 0) + 1,
            }
          }
        });
      }

      strapi.eventHub.emit('ride:cancelled', { ride: updatedRide, cancelledBy });

      return ctx.send(updatedRide);
    } catch (error) {
      strapi.log.error('Cancel ride error:', error);
      return ctx.internalServerError('Failed to cancel ride');
    }
  }
}));

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(point2.lat - point1.lat);
  const dLon = deg2rad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(point1.lat)) *
      Math.cos(deg2rad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate duration based on distance
 * Assumes average speed of 30 km/h in city traffic
 */
function estimateDuration(distanceKm: number): number {
  const averageSpeedKmh = 30;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.ceil(hours * 60);
  return minutes;
}
