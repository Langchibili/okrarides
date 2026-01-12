// src/api/ride/controllers/ride.ts
// ============================================

import { factories } from '@strapi/strapi';
import { generateUniqueRideCode }  from '../../../services/generateUniqueRideCode';
import  RideBookingService  from '../../../services/rideBookingService';
import  RiderBlockingService  from '../../../services/riderBlockingService';
const { emitRideStatusChange, requestRatings, emitRatingSubmitted  } = require('../../../utils/socketUtils');
import socketService from '../../../services/socketService';

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
interface QueryFilters {
  rideStatus?: {
    $eq?: string;
  };
  createdAt?: {
    $gte?: string | Date;
    $lte?: string | Date;
  };
}

interface QueryPagination {
  page?: number;
  pageSize?: number;
}

interface QueryParams {
  filters?: QueryFilters;
  pagination?: QueryPagination;
  sort?: any;
}

const toggleDriverProfileOffline = async (ctx)=> {
    try {
      const userId = ctx.state.user.id;
      
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        // 1. Limit fields on the main User object
        select: ['id', 'username',"isOnline"], 
        populate: { 
          driverProfile: {
            // 2. Only fetch fields used in your logic (ID and status)
            select: ['id'] 
          },
          riderProfile: {
            // 3. We only need the ID to perform the update later
            select: ['id'] 
          },
          deliveryProfile: {
            select: ['id']
          },
          conductorProfile: {
            select: ['id'] 
          }
        }
      })
      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const newOnlineStatus = !user.driverProfile.isOnline;
      
      // Update driver profile - getting component ID and updating it
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          isOnline: newOnlineStatus,
          activeProfile: 'rider',
          profileActivityStatus: {
            "rider": true,
            "driver": false,
            "delivery": false,
            "conductor": false
          },
          lastSeen: new Date()
        }
      })
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },  
        data: {
            isOnline: false,
            isActive: false
         }
      })
      await strapi.db.query('rider-profiles.rider-profile').update({
        where: { id: user.riderProfile.id },   
        data: {
            isOnline: true,
            isAvailable: true,
            isActive: true
        }
      })
      await strapi.db.query('delivery-profiles.delivery-profile').update({
         where: { id: user.deliveryProfile.id },   
         data: {
            isOnline: false,
            isAvailable: false,
            isActive: false
         }
      })
      await strapi.db.query('conductor-profiles.conductor-profile').update({
          where: { id: user.conductorProfile.id },   
          data: {
            isOnline: false,
            isAvailable: false,
            isActive: false
          }
      })

      // Emit WebSocket event
      strapi.eventHub.emit('driver:status:changed', {
        driverId: userId,
        status: 'offline'
      });
    } catch (error) {
      strapi.log.error('Toggle online error:', error);
      return ctx.internalServerError('Failed to update status');
    }
  }
// Helper function to parse sort parameter
// Helper function to parse sort parameter
function parseSortParam(sort: any): Record<string, 'asc' | 'desc'> {
  if (!sort) {
    return { createdAt: 'desc' };
  }
  
  // If it's already an object, return it
  if (typeof sort === 'object' && !Array.isArray(sort)) {
    return sort;
  }
  
  // If it's a string like "createdAt:desc" or "createdAt"
  if (typeof sort === 'string') {
    const [field, order] = sort.split(':');
    return { [field]: (order as 'asc' | 'desc') || 'asc' };
  }
  
  // If it's an array, take the first element
  if (Array.isArray(sort) && sort.length > 0) {
    return parseSortParam(sort[0]);
  }
  
  return { createdAt: 'desc' };
}

export default factories.createCoreController('api::ride.ride',({ strapi }) => ({
  // ============================================
  // Keep all default CRUD operations
  // ============================================
// Replace your find method with this:
async find(ctx) {
  try {
    // Type the query properly
    const query = ctx.query as QueryParams;

    if (query) {
      // Parse the sort parameter
      const orderBy = parseSortParam(query.sort);

      // Build the query with proper Strapi v5 syntax
      const entities = await strapi.db.query('api::ride.ride').findMany({
        where: {
          // Add user filter - only show rides for current user
          $or: [
            { rider: ctx.state.user.id },
            { driver: ctx.state.user.id }
          ],
          // Add status filter if provided
          ...(query.filters?.rideStatus?.$eq && {
            rideStatus: query.filters.rideStatus.$eq
          }),
          // Add date filters if provided
          ...(query.filters?.createdAt?.$gte && {
            createdAt: {
              $gte: query.filters.createdAt.$gte,
              ...(query.filters?.createdAt?.$lte && {
                $lte: query.filters.createdAt.$lte
              })
            }
          })
        },
        populate: {
          driver: {
            fields: ['id', 'firstName', 'lastName', 'phoneNumber', 'profile_picture'], // Use 'fields' instead of 'select'
            populate: {
              driverProfile: {
                fields: ['id', 'averageRating', 'totalRatings', 'completedRides']
              }
            }
          },
          rider: {
            fields: ['id', 'firstName', 'lastName', 'phoneNumber', 'profile_picture'],
            populate: {
              riderProfile: {
                fields: ['id', 'averageRating', 'totalRatings']
              }
            }
          },
          vehicle: {
            fields: ['id', 'numberPlate', 'make', 'model', 'color', 'vehicleType']
          },
          rideClass: {
            fields: ['id', 'name', 'description']
          },
          taxiType: {
            fields: ['id', 'name']
          }
        },
        orderBy,
        limit: query.pagination?.pageSize || 20,
        offset: query.pagination?.page 
          ? (query.pagination.page - 1) * (query.pagination.pageSize || 20) 
          : 0,
      });

      // Get total count for pagination
      const total = await strapi.db.query('api::ride.ride').count({
        where: {
          $or: [
            { rider: ctx.state.user.id },
            { driver: ctx.state.user.id }
          ],
          ...(query.filters?.rideStatus?.$eq && {
            rideStatus: query.filters.rideStatus.$eq
          }),
          ...(query.filters?.createdAt?.$gte && {
            createdAt: {
              $gte: query.filters.createdAt.$gte,
              ...(query.filters?.createdAt?.$lte && {
                $lte: query.filters.createdAt.$lte
              })
            }
          })
        }
      });

      // Sanitize output
      const sanitizedEntities = await Promise.all(
        entities.map(entity => this.sanitizeOutput(entity, ctx))
      );

      // Return with pagination metadata
      return {
        data: sanitizedEntities,
        meta: {
          pagination: {
            page: query.pagination?.page || 1,
            pageSize: query.pagination?.pageSize || 20,
            pageCount: Math.ceil(total / (query.pagination?.pageSize || 20)),
            total: total
          }
        }
      };
    } else {
      return await super.find(ctx);
    }

  } catch (error) {
    strapi.log.error('Find rides error:', error);
    return ctx.internalServerError('Failed to fetch rides');
  }
},

async findOne(ctx) {
  const { id } = ctx.params;

  try {
    // Use db.query to find by numerical 'id'
    const entity = await strapi.db.query('api::ride.ride').findOne({
      where: { id: id },
      populate: {
        driver: {
          fields: ['id', 'firstName', 'lastName', 'phoneNumber', 'profile_picture'],
          populate: {
            driverProfile: {
              fields: ['id', 'averageRating', 'totalRatings', 'completedRides']
            }
          }
        },
        rider: {
          fields: ['id', 'firstName', 'lastName', 'phoneNumber', 'profile_picture'],
          populate: {
            riderProfile: {
              fields: ['id', 'averageRating', 'totalRatings']
            }
          }
        },
        vehicle: {
          fields: ['id', 'numberPlate', 'make', 'model', 'color', 'vehicleType']
        },
        rideClass: {
          fields: ['id', 'name', 'description']
        },
        taxiType: {
          fields: ['id', 'name']
        },
        pickupStation: true,
        dropoffStation: true
      }
    });

    if (!entity) {
      return ctx.notFound('Ride not found');
    }

    // Verify user has access to this ride
    const userId = ctx.state.user.id;
    const isRider = entity.rider?.id === userId || entity.rider === userId;
    const isDriver = entity.driver?.id === userId || entity.driver === userId;

    if (!isRider && !isDriver) {
      return ctx.forbidden('You do not have access to this ride');
    }

    // Sanitize the output to remove private fields
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
    
  } catch (error) {
    strapi.log.error('Find one ride error:', error);
    return ctx.internalServerError('Failed to fetch ride');
  }
},

  // async create(ctx) {
  //   //console.log('ctx.request.body', ctx.request.body);
    
  //   const { data } = ctx.request.body;
    
  //   // Generate ride code if not present
  //   data.rideCode = data.rideCode ? data.rideCode : await generateUniqueRideCode();
    
  //   // Convert taxiType string to ID if needed
  //   if (data.taxiType && typeof data.taxiType === 'string') {
  //       const taxiTypeRecord = await strapi.db.query('api::taxi-type.taxi-type').findOne({
  //       where: { name: data.taxiType } // or whatever field contains "taxi"
  //       });
        
  //       if (taxiTypeRecord) {
  //       data.taxiType = taxiTypeRecord.id;
  //       } else {
  //       // Handle case when taxi type doesn't exist
  //       return ctx.badRequest('Invalid taxi type');
  //       }
  //   }
    
  //   // Same for rideClass if it might be a string
  //   if (data.rideClass && typeof data.rideClass === 'string') {
  //       const rideClassRecord = await strapi.db.query('api::ride-class.ride-class').findOne({
  //       where: { name: data.rideClass } // adjust field as needed
  //       });
        
  //       if (rideClassRecord) {
  //       data.rideClass = rideClassRecord.id;
  //       }
  //   }
    
  //   const response = await super.create(ctx);
    
  //   // Emit event for driver matching
  //   strapi.eventHub.emit('ride.created', { ride: response.data });
    
  //   return response;
  // },
 async create(ctx) {
    try {
      const { data } = ctx.request.body;
      const riderId = ctx.state.user.id;

      // Validate rider profile is active
      const rider = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: riderId },
        populate: { riderProfile: true }
      })

      if (!rider?.riderProfile) {
        return ctx.badRequest('Rider profile not found');
      }

      // Ensure rider profile is active and other profiles are inactive
      // if (rider.activeProfile !== 'rider') {
      //   return ctx.badRequest('Rider profile must be active to book rides');
      // }

      // Generate ride code
      data.rideCode = data.rideCode || await generateUniqueRideCode();

      // Convert taxiType string to ID if needed
      if (data.taxiType && typeof data.taxiType === 'string') {
        const taxiTypeRecord = await strapi.db.query('api::taxi-type.taxi-type').findOne({
          where: { name: data.taxiType }
        });
        if (taxiTypeRecord) {
          data.taxiType = taxiTypeRecord.id;
        } else {
          return ctx.badRequest('Invalid taxi type');
        }
      }

      // Same for rideClass
      if (data.rideClass && typeof data.rideClass === 'string') {
        const rideClassRecord = await strapi.db.query('api::ride-class.ride-class').findOne({
          where: { name: data.rideClass }
        });
        if (rideClassRecord) {
          data.rideClass = rideClassRecord.id;
        }
      }

      // Set initial values
      data.rider = riderId;
      data.rideStatus = 'pending';
      data.requestedAt = new Date();
      data.requestedDrivers = [];
      data.declinedDrivers = [];

      // Create the ride
      const ride = await strapi.db.query('api::ride.ride').create({
        data,
        populate: true
      });
      // Emit socket event for new ride request
      socketService.emitRideRequestCreated(ride);

      strapi.log.info(`Ride ${ride.id} created by rider ${riderId}`);
      toggleDriverProfileOffline(ctx) // if you are online in your driver profile, we set it to offline
      // Find and notify eligible drivers
      const eligibleDriversResult = await RideBookingService.findEligibleDrivers({
          pickupLocation: data.pickupLocation,
          riderId,
          taxiType: data.taxiType,
          rideClass: data.rideClass
        });

      if (eligibleDriversResult.success && eligibleDriversResult.drivers.length > 0) {
        // Send requests to drivers
        await RideBookingService.sendRideRequests(ride.id, eligibleDriversResult.drivers);
      } else {
        // No drivers available
        await strapi.db.query('api::ride.ride').update({
          where: { id: ride.id },
          data: { rideStatus: 'no_drivers_available', cancelledBy: 'system' }
        });

        strapi.log.warn(`No eligible drivers found for ride ${ride.id}`);
      }

      // Emit event for rider
      strapi.eventHub.emit('ride.created', { ride });

      return ctx.send({
        success: true,
        data: ride,
        driversNotified: eligibleDriversResult.drivers?.length || 0
      });
    } catch (error) {
      strapi.log.error('Create ride error:', error);
      return ctx.internalServerError('Failed to create ride');
    }
  },
  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body; // Standard Strapi wrapper { data: { ... } }

    // 1. Perform the update using the low-level db.query
    // This allows targeting the numerical 'id' directly
    const updatedEntity = await strapi.db.query('api::vehicle.vehicle').update({
      where: { id: id },
      data: data,
      populate: true, // Populates relations so the response is complete
    });

    // 2. Handle 404 if record doesn't exist
    if (!updatedEntity) {
      return ctx.notFound('Vehicle not found');
    }

    // 3. Sanitize the output 
    // This removes sensitive fields based on the Content-Type permissions
    const sanitizedEntity = await this.sanitizeOutput(updatedEntity, ctx);
    const transformedResponse = this.transformResponse(sanitizedEntity) 
    // 4. Emit your event (using v5 flattened structure)
    const ride = (transformedResponse as any)?.data;
    if (ride?.rideStatus) {
      strapi.eventHub.emit(`ride.rideStatus.${ride.rideStatus}`, { ride });
    }
    // 4. Transform to standard Strapi JSON API response
    // This wraps the result in { data: { id, attributes: ... } } (v4) or { data: { ... } } (v5)
    return transformedResponse;
  },

 async delete(ctx) {
  const { id } = ctx.params;

  // 1. Perform the deletion using the low-level db.query
  // This targets the numerical 'id' directly. 
  // We use .delete() which returns the deleted record's data.
  const deletedEntity = await strapi.db.query('api::vehicle.vehicle').delete({
    where: { id: id },
    populate: true, // Optional: populate if you need the response to show relations
  });

  // 2. Handle 404 if the record didn't exist
  if (!deletedEntity) {
    return ctx.notFound('Vehicle not found');
  }
  // Optional: Emit a deletion event if needed
    strapi.eventHub.emit('ride.deleted', { id });
  // 3. Sanitize the output
  // Removes sensitive data (like creator information or private fields)
  const sanitizedEntity = await this.sanitizeOutput(deletedEntity, ctx);

  // 4. Transform to standard Strapi JSON API response
  // Returns the deleted record wrapped in the standard { data: ... } format
  return this.transformResponse(sanitizedEntity);
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
        rideStatus: ride.rideStatus,
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

          // Calculate ETA based on rideStatus
          if (ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived') {
            distance = calculateDistance(
              driver.currentLocation,
              ride.pickupLocation
            );
            eta = Math.ceil(distance * 3); // 3 minutes per km
          } else if (ride.rideStatus === 'passenger_onboard') {
            distance = calculateDistance(
              driver.currentLocation,
              ride.dropoffLocation
            );
            eta = Math.ceil(distance * 3);
          }
        }
      }

      const driverProfile = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: ride.driver.id },
          populate: {
              driverProfile: {select: ['id','averageRating','completedRides'] }
          }
      })

      // Build tracking response
      const trackingData = {
        ride: {
          id: ride.id,
          rideCode: ride.rideCode,
          rideStatus: ride.rideStatus,
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
          averageRating: driverProfile?.averageRating || 0,
          totalRides: driverProfile?.completedRides || 0,
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

      if (ride.rideStatus !== 'completed') {
        return ctx.badRequest('Receipt is only available for completed rides');
      }

      const driverProfile = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: ride.driver.id },
          populate: {
              driverProfile: {select: ['id','averageRating','completedRides'] }
          }
      })

      // Build receipt
      const receipt = {
        rideDetails: {
          rideCode: ride.rideCode,
          date: ride.tripCompletedAt || ride.createdAt,
          rideStatus: ride.rideStatus,
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
          rideStatus: ride.paymentStatus,
        },
        driver: ride.driver ? {
          name: `${ride.driver.firstName} ${ride.driver.lastName}`,
          phoneNumber: ride.driver.phoneNumber,
          rating: driverProfile?.averageRating || 0,
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
        select: ['id', 'rideCode', 'rideStatus'],
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      // Check if ride is in trackable state
      const trackableStatuses = ['accepted', 'arrived', 'passenger_onboard'];
      if (!trackableStatuses.includes(ride.rideStatus)) {
        return ctx.badRequest('Ride is not in a trackable state');
      }

      // Generate unique tracking token
      const crypto = require('crypto');
      const trackingToken = crypto.randomBytes(32).toString('hex');

      // Store tracking token (you might want to create a separate tracking_tokens table)
      // For now, we'll just generate the URL

      const baseUrl = strapi.config.get('server.url') || 'http://localhost:1343';
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
  // async acceptRide(ctx) {
  //   try {
  //     const { id } = ctx.params;
  //     const driverId = ctx.state.user.id;

  //     const ride = await strapi.db.query('api::ride.ride').findOne({
  //       where: { id },
  //       populate: ['rider', 'driver']
  //     });

  //     if (!ride) {
  //       return ctx.notFound('Ride not found');
  //     }

  //     if (ride.status !== 'pending') {
  //       return ctx.badRequest('Ride is not available');
  //     }

  //     // Check if driver is available
  //     const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
  //       where: { id: driverId },
  //       populate: { driverProfile: true }
  //     });

  //     if (!driver.driverProfile?.isAvailable) {
  //       return ctx.badRequest('Driver is not available');
  //     }

  //     // Update ride
  //     const updatedRide = await strapi.db.query('api::ride.ride').update({
  //       where: { id },
  //       data: {
  //         status: 'accepted',
  //         driver: driverId,
  //         acceptedAt: new Date(),
  //       }
  //     });

  //     // Update driver profile - preserving existing component data
  //     await strapi.db.query('plugin::users-permissions.user').update({
  //       where: { id: driverId },
  //       data: {
  //         driverProfile: {
  //           ...driver.driverProfile,
  //           isAvailable: false,
  //           currentRide: id,
  //         }
  //       }
  //     });

  //     // Emit events
  //     strapi.eventHub.emit('ride:accepted', { ride: updatedRide, driverId });

  //     return ctx.send(updatedRide);
  //   } catch (error) {
  //     strapi.log.error('Accept ride error:', error);
  //     return ctx.internalServerError('Failed to accept ride');
  //   }
  // },
 // Accept ride with subscription check

 // ============================================
// GET ACTIVE RIDE - Check for rider or driver active rides
// ============================================
// ============================================
// GET ACTIVE RIDE - Advanced with profile validation
// ============================================
async getActiveRide(ctx) {
  try {
    const userId = ctx.state.user.id;

    // Get user with profile information
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: {
        riderProfile: {
          populate: true
        },
        driverProfile: {
          populate: {
            assignedVehicle: true
          }
        },
        profileActivityStatus: true
      }
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    // Define active statuses
    const riderActiveStatuses = ['pending', 'accepted', 'arrived', 'passenger_onboard'];
    const excludedDriverStatuses = ['completed', 'cancelled', 'no_drivers_available'];

    // Check for rider active rides
    if (user.riderProfile) {
      const riderWhereConditions = {
        rider: {
          id: { $eq: userId },
          riderProfile: {
            isActive: { $eq: true },
            blocked: { $eq: false }
          }
        },
        rideStatus: {
          $in: riderActiveStatuses
        }
      };

      const riderActiveRide = await strapi.db.query('api::ride.ride').findOne({
        where: riderWhereConditions,
        populate: {
          rider: {
            populate: {
              riderProfile: true
            }
          },
          driver: {
            populate: {
              driverProfile: {
                populate: {
                  assignedVehicle: true
                }
              }
            }
          },
          vehicle: true,
          rideClass: true,
          taxiType: true,
          pickupStation: true,
          dropoffStation: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      if (riderActiveRide) {
        strapi.log.info(`Active ride found for rider ${userId}: ${riderActiveRide.id}`);
        
        return ctx.send({
          success: true,
          data: riderActiveRide,
          userRole: 'rider',
          message: 'Active ride found as rider'
        });
      }
    }

    // Check for driver active rides
    if (user.driverProfile) {
      const driverWhereConditions = {
        driver: {
          id: { $eq: userId },
          driverProfile: {
            isActive: { $eq: true },
            blocked: { $eq: false },
            verificationStatus: { $eq: 'approved' }
          }
        },
        rideStatus: {
          $notIn: excludedDriverStatuses
        }
      };

      const driverActiveRide = await strapi.db.query('api::ride.ride').findOne({
        where: driverWhereConditions,
        populate: {
          rider: {
            populate: {
              riderProfile: true
            }
          },
          driver: {
            populate: {
              driverProfile: {
                populate: {
                  assignedVehicle: true,
                  taxiDriver: true,
                  busDriver: true,
                  motorbikeRider: true,
                  currentSubscription: true
                }
              }
            }
          },
          vehicle: true,
          rideClass: true,
          taxiType: true,
          pickupStation: true,
          dropoffStation: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      if (driverActiveRide) {
        strapi.log.info(`Active ride found for driver ${userId}: ${driverActiveRide.id}`);
        
        return ctx.send({
          success: true,
          data: driverActiveRide,
          userRole: 'driver',
          message: 'Active ride found as driver'
        });
      }
    }

    // No active rides found
    strapi.log.info(`No active rides found for user ${userId}`);
    
    return ctx.send({
      success: true,
      data: null,
      userRole: null,
      message: 'No active rides'
    });

  } catch (error) {
    strapi.log.error('Get active ride error:', error);
    return ctx.internalServerError('Failed to get active ride');
  }
},
  async acceptRide(ctx) {
    try {
      const { id } = ctx.params;
      const driverId = ctx.state.user.id;

      // Check if driver can accept rides
      const eligibilityCheck = await RideBookingService.canDriverAcceptRides(driverId);

      if (!eligibilityCheck.canAccept) {
        return ctx.forbidden(eligibilityCheck.reason);
      }

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: ['rider', 'driver']
      });

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      if (ride.rideStatus !== 'pending') {
        return ctx.badRequest('Ride is not available');
      }

      // Check if this driver was actually requested
      const requestedDrivers = ride.requestedDrivers || [];
      const wasRequested = requestedDrivers.some(rd => rd.driverId === driverId);

      if (!wasRequested) {
        return ctx.badRequest('You were not requested for this ride');
      }

      // Get driver details
      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: driverId },
        populate: {
          driverProfile: {
            populate: {
              assignedVehicle: true
            }
          }
        }
      });

      if (!driver.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      // Update ride
      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          rideStatus: 'accepted',
          driver: driverId,
          vehicle: driver.driverProfile.assignedVehicle?.id || null,
          acceptedAt: new Date()
        },
        populate: true
      });
      
      // Notify rider via socket (real-time)
      socketService.emit('ride:accepted', {
        rideId: updatedRide.id,
        driverId,
        driver: {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          phoneNumber: driver.phoneNumber,
          profilePicture: driver.profilePicture,
          driverProfile: {
            averageRating: driver.driverProfile.averageRating,
            totalRatings: driver.driverProfile.totalRatings || 0,
            completedRides: driver.driverProfile.completedRides || 0,
          },
        },
        vehicle: driver.driverProfile.assignedVehicle ? {
          id: driver.driverProfile.assignedVehicle.id,
          numberPlate: driver.driverProfile.assignedVehicle.numberPlate,
          make: driver.driverProfile.assignedVehicle.make,
          model: driver.driverProfile.assignedVehicle.model,
          color: driver.driverProfile.assignedVehicle.color,
        } : null,
        eta: 180, // Calculate actual ETA
        distance: 1.5, // Calculate actual distance
      })

      // Update driver profile
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: driverId },
        data: {
          driverProfile: {
            id: driver?.driverProfile?.id,
            isAvailable: false,
            currentRide: id
          }
        }
      });

      // Emit events
      strapi.eventHub.emit('ride:accepted', { 
        ride: updatedRide, 
        driverId 
      });

      // Notify other drivers that ride was taken
      const otherDriverIds = requestedDrivers
        .filter(rd => rd.driverId !== driverId)
        .map(rd => rd.driverId);

      if (otherDriverIds.length > 0) {
        strapi.eventHub.emit('ride:taken', {
          rideId: id,
          driverIds: otherDriverIds
        });
      }

      strapi.log.info(`Ride ${id} accepted by driver ${driverId}`);

      return ctx.send({
        success: true,
        data: updatedRide
      });
    } catch (error) {
      strapi.log.error('Accept ride error:', error);
      return ctx.internalServerError('Failed to accept ride');
    }
  },

  // Decline ride
  // async declineRide(ctx) {
  //   try {
  //     const { id } = ctx.params;
  //     const driverId = ctx.state.user.id;

  //     const ride = await strapi.db.query('api::ride.ride').findOne({
  //       where: { id }
  //     });

  //     if (!ride) {
  //       return ctx.notFound('Ride not found');
  //     }

  //     // Remove driver from requested list
  //     const requestedDrivers = ride.requestedDrivers || [];
  //     const updatedDrivers = requestedDrivers.filter(d => d.driverId !== driverId);

  //     await strapi.db.query('api::ride.ride').update({
  //       where: { id },
  //       data: {
  //         requestedDrivers: updatedDrivers
  //       }
  //     });

  //     return ctx.send({ message: 'Ride declined successfully' });
  //   } catch (error) {
  //     strapi.log.error('Decline ride error:', error);
  //     return ctx.internalServerError('Failed to decline ride');
  //   }
  // },
  // Decline ride
  async declineRide(ctx) {
    try {
      const { id } = ctx.params;
      const driverId = ctx.state.user.id;

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: ['rider']
      })

      if (!ride) {
        return ctx.notFound('Ride not found');
      }

      // Add to declined drivers
      const declinedDrivers = ride.declinedDrivers || [];
      if (!declinedDrivers.includes(driverId)) {
        declinedDrivers.push(driverId);
      }

      // Remove from requested drivers
      const requestedDrivers = (ride.requestedDrivers || []).map(rd => {
        if (rd.driverId === driverId) {
          return { ...rd, status: 'declined', declinedAt: new Date().toISOString() };
        }
        return rd;
      });

      // add the driver into the rider's temporarily blocked drivers
      if(ride?.rider?.id){
         RiderBlockingService.addTempBlock(ride.rider.id,driverId)
      }
      
      await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          requestedDrivers,
          declinedDrivers
        }
      });

      strapi.log.info(`Driver ${driverId} declined ride ${id}`);

      return ctx.send({
        success: true,
        message: 'Ride declined successfully'
      });
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

      if (ride.rideStatus !== 'accepted') {
        return ctx.badRequest('Invalid ride status');
      }

      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          rideStatus: 'arrived',
          arrivedAt: new Date(),
        }
      })
      
      emitRideStatusChange(updatedRide, 'accepted'); // previous status is what's added
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

      if (ride.rideStatus !== 'arrived') {
        return ctx.badRequest('Must confirm arrival first');
      }

      const updatedRide = await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          rideStatus: 'passenger_onboard',
          tripStartedAt: new Date(),
        }
      });
      
      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: driverId },
        populate: {
          driverProfile: {select: ['id'] }
        }
      })
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: driver.driverProfile.id },  
        data: {
            isAvailable: false,
            isEnroute: true,
            currentRide: id
         }
      })
      emitRideStatusChange(updatedRide, 'arrived'); // previous status is what's added
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

      if (ride.rideStatus !== 'passenger_onboard') {
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
          rideStatus: 'completed',
          tripCompletedAt: new Date(),
          actualDistance: actualDistance || ride.estimatedDistance,
          actualDuration: actualDuration || ride.estimatedDuration,
          commission,
          driverEarnings,
          commissionDeducted: true,
        }
      });

      // Update driver profile - getting existing data and updating it
      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: ride.driver.id },
        populate: {
          driverProfile: {
            select: ['id','completedRides','totalRides','totalEarnings','currentBalance'] 
          }
        }
      })

      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: driver.driverProfile.id },  
        data: {
            isAvailable: true,
            isEnroute: false,
            currentRide: null,
            completedRides: (driver.driverProfile.completedRides || 0) + 1,
            totalRides: (driver.driverProfile.totalRides || 0) + 1,
            totalEarnings: (driver.driverProfile.totalEarnings || 0) + driverEarnings,
            currentBalance: (driver.driverProfile.currentBalance || 0) + driverEarnings,
         }
      })
      // Create ledger entry
      await strapi.db.query('api::ledger-entry.ledger-entry').create({
        data: {
          entryId: `LE-${Date.now()}`,
          driver: driverId,
          ride: id,
          type: 'fare',
          amount: driverEarnings,
          source: ride.paymentMethod,
          ledgerStatus: 'settled',
        }
      });

      emitRideStatusChange(updatedRide, 'passenger_onboard'); // previous status is what's added
      requestRatings(updatedRide);
      strapi.eventHub.emit('ride:completed', { ride: updatedRide });

      return ctx.send(updatedRide);
    } catch (error) {
      strapi.log.error('Complete trip error:', error);
      return ctx.internalServerError('Failed to complete trip');
    }
  },

  // Cancel ride
  // async cancelRide(ctx) {
  //   try {
  //     const { id } = ctx.params;
  //     const userId = ctx.state.user.id;
  //     const { reason, cancelledBy } = ctx.request.body;

  //     const ride = await strapi.db.query('api::ride.ride').findOne({
  //       where: { id },
  //       populate: ['rider', 'driver']
  //     });

  //     if (!ride) {
  //       return ctx.notFound('Ride not found');
  //     }

  //     if (ride.status === 'completed' || ride.status === 'cancelled') {
  //       return ctx.badRequest('Cannot cancel this ride');
  //     }

  //     // Calculate cancellation fee if applicable
  //     let cancellationFee = 0;
  //     const cancellationReason = await strapi.db.query('api::cancellation-reason.cancellation-reason').findOne({
  //       where: { code: reason }
  //     });

  //     if (cancellationReason?.hasFee) {
  //       cancellationFee = cancellationReason.feeAmount || 0;
  //     }

  //     const updatedRide = await strapi.db.query('api::ride.ride').update({
  //       where: { id },
  //       data: {
  //         status: 'cancelled',
  //         cancelledAt: new Date(),
  //         cancelledBy,
  //         cancellationReason: reason,
  //         cancellationFee,
  //       }
  //     });

  //     // Update driver if assigned
  //     if (ride.driver) {
  //       await strapi.db.query('plugin::users-permissions.user').update({
  //         where: { id: ride.driver.id },
  //         data: {
  //           driverProfile: {
  //             ...ride.driver.driverProfile,
  //             isAvailable: true,
  //             currentRide: null,
  //             cancelledRides: (ride.driver.driverProfile.cancelledRides || 0) + 1,
  //           }
  //         }
  //       });
  //     }

  //     strapi.eventHub.emit('ride:cancelled', { ride: updatedRide, cancelledBy });

  //     return ctx.send(updatedRide);
  //   } catch (error) {
  //     strapi.log.error('Cancel ride error:', error);
  //     return ctx.internalServerError('Failed to cancel ride');
  //   }
  // }
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

    if (ride.rideStatus === 'completed' || ride.rideStatus === 'cancelled') {
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
        rideStatus: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy,
        cancellationReason: reason,
        cancellationFee,
      }
    });

    // **NEW: Handle driver blocking after cancellation**
    if (ride.driver && ride.rideStatus === 'accepted') {
      // Add driver to temp blocked list
      await RiderBlockingService.addTempBlock(ride.rider.id, ride.driver.id);
      
      strapi.log.info(`Driver ${ride.driver.id} temp blocked for rider ${ride.rider.id} due to cancellation`);
    }

    

    // Update driver if assigned
    if (ride.driver) {
      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: ride.driver.id },
        populate: {
          driverProfile: {select: ['id','cancelledRides'] }
        }
      })
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: driver.driverProfile.id },  
        data: {
            isAvailable: true,
            isEnroute: false,
            currentRide: null,
            cancelledRides: (driver.driverProfile.cancelledRides || 0) + 1
         }
      })
     
    }
    
    emitRideStatusChange(updatedRide, ride.rideStatus);
    strapi.eventHub.emit('ride:cancelled', { ride: updatedRide, cancelledBy });

    return ctx.send(updatedRide);
  } catch (error) {
    strapi.log.error('Cancel ride error:', error);
    return ctx.internalServerError('Failed to cancel ride');
  }
},
// ============================================
// CUSTOM METHOD: Rate Ride (Driver or Rider)
// ============================================
async rateRide(ctx) {
  try {
    const { id } = ctx.params;
    const userId = ctx.state.user.id;
    const { rating, review = '', tags = [], ratedBy } = ctx.request.body;

    // Validate inputs
    if (!rating || rating < 1 || rating > 5) {
      return ctx.badRequest('Rating must be between 1 and 5');
    }

    if (!ratedBy || !['rider', 'driver'].includes(ratedBy)) {
      return ctx.badRequest('ratedBy must be either "rider" or "driver"');
    }

    // Get ride with all relations
    const ride = await strapi.db.query('api::ride.ride').findOne({
      where: { id },
      populate: {
        rider: {
          populate: {
            riderProfile: true
          }
        },
        driver: {
          populate: {
            driverProfile: true
          }
        }
      }
    });

    if (!ride) {
      return ctx.notFound('Ride not found');
    }

    // Verify ride is completed
    if (ride.rideStatus !== 'completed') {
      return ctx.badRequest('Can only rate completed rides');
    }

    // Verify user is part of this ride
    const isRider = ride.rider?.id === userId;
    const isDriver = ride.driver?.id === userId;

    if (!isRider && !isDriver) {
      return ctx.forbidden('You are not authorized to rate this ride');
    }

    // Verify ratedBy matches user type
    if ((ratedBy === 'rider' && !isRider) || (ratedBy === 'driver' && !isDriver)) {
      return ctx.badRequest('ratedBy does not match your user type');
    }

    // Check if already rated
    const existingRating = await strapi.db.query('api::rating.rating').findOne({
      where: {
        ride: id,
        ratedBy: ratedBy
      }
    });

    if (existingRating) {
      return ctx.badRequest('You have already rated this ride');
    }

    // Determine who is being rated
    let ratedUserId;
    let ratedUserType;
    
    if (ratedBy === 'rider') {
      // Rider is rating the driver
      ratedUserId = ride.driver?.id;
      ratedUserType = 'driver';
    } else {
      // Driver is rating the rider
      ratedUserId = ride.rider?.id;
      ratedUserType = 'rider';
    }

    if (!ratedUserId) {
      return ctx.badRequest('Cannot determine who to rate');
    }

    // Create rating record
    const newRating = await strapi.db.query('api::rating.rating').create({
      data: {
        ride: id,
        ratedUser: ratedUserId, // The person being given the rating
        rating: rating,
        review: review,
        tags: tags,
        ratedBy: userId // The person giving the rating
      }
    });

    // Update rated user's statistics
    if (ratedUserType === 'driver') {
      // Update driver's rating
      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: ratedUserId },
        populate: {
          driverProfile: {
            select: ['id', 'averageRating', 'totalRatings']
          }
        }
      });

      if (driver?.driverProfile) {
        const currentAverage = driver.driverProfile.averageRating || 0;
        const currentTotal = driver.driverProfile.totalRatings || 0;
        
        // Calculate new average
        const newTotal = currentTotal + 1;
        const newAverage = ((currentAverage * currentTotal) + rating) / newTotal;

        await strapi.db.query('driver-profiles.driver-profile').update({
          where: { id: driver.driverProfile.id },
          data: {
            averageRating: parseFloat(newAverage.toFixed(2)),
            totalRatings: newTotal
          }
        });
      }
    } else {
      // Update rider's rating
      const rider = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: ratedUserId },
        populate: {
          riderProfile: {
            select: ['id', 'averageRating', 'totalRatings']
          }
        }
      });

      if (rider?.riderProfile) {
        const currentAverage = rider.riderProfile.averageRating || 0;
        const currentTotal = rider.riderProfile.totalRatings || 0;
        
        // Calculate new average
        const newTotal = currentTotal + 1;
        const newAverage = ((currentAverage * currentTotal) + rating) / newTotal;

        await strapi.db.query('rider-profiles.rider-profile').update({
          where: { id: rider.riderProfile.id },
          data: {
            averageRating: parseFloat(newAverage.toFixed(2)),
            totalRatings: newTotal
          }
        });
      }
    }

    // Emit socket event for rating confirmation
    emitRatingSubmitted(userId, ratedBy, id, rating);

    strapi.log.info(`${ratedBy} ${userId} rated ${ratedUserType} ${ratedUserId} with ${rating} stars for ride ${id}`);

    return ctx.send({
      success: true,
      message: 'Rating submitted successfully',
      rating: {
        id: newRating.id,
        rating: rating,
        review: review,
        tags: tags,
      }
    });

  } catch (error) {
    strapi.log.error('Rate ride error:', error);
    return ctx.internalServerError('Failed to submit rating');
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
