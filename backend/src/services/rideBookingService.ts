import { SendSmsNotification, SendEmailNotification } from "./messages";
import RiderBlockingService from './riderBlockingService'
import DeviceService from './deviceServices'
import socketService from './socketService'

export interface RideBookingService {
  findEligibleDrivers(rideData: any): Promise<any>;
  sendRideRequests(rideId: number | string, drivers: any[]): Promise<any>;
  scheduleRequestTimeout(rideId: number | string): void;
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  deg2rad(deg: number): number;
  canDriverAcceptRides(driverId: number | string): Promise<any>;
}

export default {
  /**
   * Find eligible drivers for a ride request
   */
  /* Find eligible drivers for a ride request
   */
  // async findEligibleDrivers(rideData: any) {
  //   try {
  //     const { pickupLocation, riderId, taxiType, rideClass } = rideData;
  //     // Get admin settings
  //     const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
  //     const maxRadius = settings?.rideBookingRadius || 10; // km
  //     const maxDrivers = settings?.maxSimultaneousDriverRequests || 5;

  //     // Get blocked drivers for this rider
  //     const blockedResult: any = RiderBlockingService.getBlockedDrivers(riderId);

  //     const tempBlocked = Object.keys(blockedResult.tempBlocked || {}).map(id => parseInt(id));
  //     const permanentBlocked = blockedResult.permanentlyBlocked || [];
  //     const allBlockedIds = [...new Set([...tempBlocked, ...permanentBlocked])];

  //     strapi.log.info(`Finding drivers within ${maxRadius}km, excluding ${allBlockedIds.length} blocked drivers`);

  //     // Build query conditions
  //     // FIXED: Removed 'profileActivityStatus' from here to prevent "Undefined operator" error
  //     // FIXED: Used explicit $eq operators for strict Strapi v5 compliance
  //     const whereConditions = {
  //       driverProfile: {
  //         isActive: { $eq: true },
  //         isOnline: { $eq: true },
  //         isAvailable: { $eq: true },
  //         taxiDriver:{
  //           isActive: { $eq: true }
  //         },
  //         isEnroute: { $eq: false },
  //         blocked: { $eq: false },
  //       },
  //       isOnline: { $eq: true },
  //       activeProfile: { $eq: 'driver' },
  //       id: {
  //         $notIn: allBlockedIds
  //       }
  //     }

  //     // Find online and available drivers
  //     const drivers: any[] = await strapi.db.query('plugin::users-permissions.user').findMany({
  //       where: whereConditions,
  //       populate: {
  //         driverProfile: {
  //           populate: {
  //             taxiDriver: true,
  //             busDriver: true,
  //             motorBikeRider: true,
  //             assignedVehicle: true,
  //             acceptedRideClasses: true,
  //             acceptedTaxiTypes: true,
  //             subscriptionPlan: true,
  //             currentSubscription: true
  //           }
  //         },
  //         // Ensure we populate this so we can filter it in JS below
  //         profileActivityStatus: true 
  //       },
  //       limit: 1000
  //     });
  //     console.log('drivers',drivers)

  //     strapi.log.info(`Found ${drivers.length} online drivers before filtering`);

  //     // Filter by distance, taxi type, ride class, and location
  //     const eligibleDrivers = drivers
  //       .filter(driver => {
  //         // 1. Check Profile Activity Status (Moved from DB query to here)
  //         if (driver.profileActivityStatus?.driver !== true) {
  //           return false;
  //         }

  //         // 2. Must have current location
  //         if (!driver.currentLocation?.lat || !driver.currentLocation?.lng) {
  //           return false;
  //         }

  //         // 3. Calculate distance
  //         const distance = this.calculateDistance(
  //           pickupLocation.lat,
  //           pickupLocation.lng,
  //           driver.currentLocation.lat,
  //           driver.currentLocation.lng
  //         );

  //         // 4. Must be within radius
  //         if (distance > maxRadius) {
  //           return false;
  //         }

  //         // 5. Check taxi type if specified
  //         if (taxiType && driver.driverProfile?.acceptedTaxiTypes?.length > 0) {
  //           const acceptedTypeIds = driver.driverProfile.acceptedTaxiTypes.map((t: any) => t.id);
  //           if (!acceptedTypeIds.includes(taxiType)) {
  //             return false;
  //           }
  //         }

  //         // 6. Check ride class if specified
  //         if (rideClass && driver.driverProfile?.acceptedRideClasses?.length > 0) {
  //           const acceptedClassIds = driver.driverProfile.acceptedRideClasses.map((c: any) => c.id);
  //           if (!acceptedClassIds.includes(rideClass)) {
  //             return false;
  //           }
  //         }

  //         return true;
  //       })
  //       .map(driver => ({
  //         ...driver,
  //         distance: this.calculateDistance(
  //           pickupLocation.lat,
  //           pickupLocation.lng,
  //           driver.currentLocation.lat,
  //           driver.currentLocation.lng
  //         )
  //       }))
  //       .sort((a, b) => a.distance - b.distance) // Closest first
  //       .slice(0, maxDrivers);

  //     strapi.log.info(`Found ${eligibleDrivers.length} eligible drivers`);

  //     return {
  //       success: true,
  //       drivers: eligibleDrivers,
  //       totalFound: eligibleDrivers.length
  //     };
  //   } catch (error: any) {
  //     strapi.log.error('Error finding eligible drivers:', error);
  //     return { success: false, error: error.message, drivers: [] };
  //   }
  // },
  /**
   * Send ride requests to eligible drivers
   */
  async findEligibleDrivers(rideData: any) {
    try {
      const { pickupLocation, riderId, taxiType, rideClass } = rideData;
  
      // Get admin settings
      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      const maxRadius = settings?.rideBookingRadius || 10;
      const maxDrivers = settings?.maxSimultaneousDriverRequests || 5;
  
      // Get blocked drivers for this rider
      const blockedResult: any = RiderBlockingService.getBlockedDrivers(riderId);
      const tempBlocked = Object.keys(blockedResult.tempBlocked || {}).map(id => parseInt(id));
      const permanentBlocked = blockedResult.permanentlyBlocked || [];
      const allBlockedIds = [...new Set([...tempBlocked, ...permanentBlocked])];
  
      strapi.log.info(`Finding drivers within ${maxRadius}km, excluding ${allBlockedIds.length} blocked drivers`);
  
      const whereConditions = {
        driverProfile: {
          isActive: { $eq: true },
          isOnline: { $eq: true },
          isAvailable: { $eq: true },
          taxiDriver: {
            isActive: { $eq: true }
          },
          isEnroute: { $eq: false },
          blocked: { $eq: false },
        },
        isOnline: { $eq: true },
        activeProfile: { $eq: 'driver' },
        id: {
          $notIn: allBlockedIds
        }
      }
  
      const drivers: any[] = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: whereConditions,
        populate: {
          driverProfile: {
            populate: {
              taxiDriver: true,
              busDriver: true,
              motorBikeRider: true,
              assignedVehicle: true,
              acceptedRideClasses: true,
              acceptedTaxiTypes: true,
              subscriptionPlan: true,
              currentSubscription: true
            }
          },
          profileActivityStatus: true
        },
        limit: 1000
      });
  
      // 🆕 REQUEST FRESH LOCATION FROM ALL ONLINE DRIVERS
      if (drivers.length > 0) {
        strapi.log.info(`Requesting fresh location from ${drivers.length} online drivers`);
        
        for (const driver of drivers) {
          try {
            await DeviceService.requestLocationFromDevice(driver.id, 'driver');
          } catch (error) {
            strapi.log.warn(`Failed to request location from driver ${driver.id}:`, error);
          }
        }
  
        // Give drivers a moment to respond with updated location
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
  
      strapi.log.info(`Found ${drivers.length} online drivers before filtering`);
  
      // Rest of the filtering logic remains the same...
      const eligibleDrivers = drivers
        .filter(driver => {
          if (driver.profileActivityStatus?.driver !== true) {
            return false;
          }
  
          if (!driver.currentLocation?.lat || !driver.currentLocation?.lng) {
            return false;
          }
  
          const distance = this.calculateDistance(
            pickupLocation.lat,
            pickupLocation.lng,
            driver.currentLocation.lat,
            driver.currentLocation.lng
          );
  
          if (distance > maxRadius) {
            return false;
          }
  
          if (taxiType && driver.driverProfile?.acceptedTaxiTypes?.length > 0) {
            const acceptedTypeIds = driver.driverProfile.acceptedTaxiTypes.map((t: any) => t.id);
            if (!acceptedTypeIds.includes(taxiType)) {
              return false;
            }
          }
  
          if (rideClass && driver.driverProfile?.acceptedRideClasses?.length > 0) {
            const acceptedClassIds = driver.driverProfile.acceptedRideClasses.map((c: any) => c.id);
            if (!acceptedClassIds.includes(rideClass)) {
              return false;
            }
          }
  
          return true;
        })
        .map(driver => ({
          ...driver,
          distance: this.calculateDistance(
            pickupLocation.lat,
            pickupLocation.lng,
            driver.currentLocation.lat,
            driver.currentLocation.lng
          )
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxDrivers);
  
      strapi.log.info(`Found ${eligibleDrivers.length} eligible drivers`);
  
      return {
        success: true,
        drivers: eligibleDrivers,
        totalFound: eligibleDrivers.length
      };
    } catch (error: any) {
      strapi.log.error('Error finding eligible drivers:', error);
      return { success: false, error: error.message, drivers: [] };
    }
  },
  // async sendRideRequests(rideId: string | number, drivers: any[]) {
  //   try {
  //     const ride: any = await strapi.db.query('api::ride.ride').findOne({
  //       where: { id: rideId },
  //       populate: ['rider', 'taxiType', 'rideClass']
  //     });

  //     if (!ride) {
  //       return { success: false, error: 'Ride not found' };
  //     }

  //     const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
  //     const requestedDrivers: any[] = [];

  //     for (const driver of drivers) {
  //       const requestData = {
  //         rideId: ride.id,
  //         rideCode: ride.rideCode,
  //         riderId: ride.rider.id,
  //         riderName: `${ride.rider.firstName} ${ride.rider.lastName}`,
  //         pickupLocation: ride.pickupLocation,
  //         dropoffLocation: ride.dropoffLocation,
  //         estimatedFare: ride.totalFare,
  //         distance: driver.distance,
  //         taxiType: ride.taxiType?.name,
  //         rideClass: ride.rideClass?.name,
  //         requestedAt: new Date().toISOString()
  //       };

  //       // 1. Send push notification (if enabled)
  //       if (settings?.pushNotificationsEnabled) {
  //         try {
  //           strapi.eventHub.emit('ride:request:sent', {
  //             driverIds: [driver.id],
  //             requestData
  //           });
  //         } catch (error) {
  //           strapi.log.error(`Push notification error for driver ${driver.id}:`, error);
  //         }
  //       }

  //       // 2. Send SMS (if enabled and driver has phone)
  //       if (settings?.smsEnabled && settings?.driversCanReceiveRideRequestsViaSms && driver.phoneNumber) { // this is impractical, seeing as sms costs would ramp
  //         try {
  //           const smsMessage = `New Okrarides ride request! ${driver.distance.toFixed(1)}km away. Fare: K${ride.totalFare.toFixed(2)}, Drop Off in${ride.dropoffLocation.name}. Open app to accept.`;
  //           await SendSmsNotification("+"+driver.phoneNumber, smsMessage);
  //         } catch (error) {
  //           strapi.log.error(`SMS error for driver ${driver.id}:`, error);
  //         }
  //       }

  //       // 3. Send email (if enabled and driver has email)
  //       if (settings?.emailEnabled && driver.email) {
  //         try {
  //           const emailSubject = `New Okrarides Ride Request - ${ride.rideCode}`;
  //           const emailBody = `
  //             You have a new Okrarides ride request!
              
  //             Pickup: ${ride.pickupLocation.address}
  //             Dropoff: ${ride.dropoffLocation.address}
  //             Distance to pickup: ${driver.distance.toFixed(1)}km
  //             Estimated fare: K${ride.totalFare.toFixed(2)}
              
  //             Open your app to accept this ride.
  //           `;
  //           await SendEmailNotification(driver.email, emailBody);
  //         } catch (error) {
  //           strapi.log.error(`Email error for driver ${driver.id}:`, error);
  //         }
  //       }

  //       requestedDrivers.push({
  //         driverId: driver.id,
  //         distance: driver.distance,
  //         requestedAt: new Date().toISOString(),
  //         rideStatus: 'pending'
  //       });
  //       // Emit socket event to notify drivers
  //       socketService.emitRideRequestSent(rideId, requestedDrivers.map(rd => rd.driverId), requestData);
  //     }

  //     // Update ride with requested drivers
  //     await strapi.db.query('api::ride.ride').update({
  //       where: { id: rideId },
  //       data: {
  //         requestedDrivers
  //       }
  //     });

  //     strapi.log.info(`Sent ride requests to ${requestedDrivers.length} drivers for ride ${rideId}`);

  //     // Set timeout to handle no responses
  //     this.scheduleRequestTimeout(rideId);

  //     return {
  //       success: true,
  //       driverCount: requestedDrivers.length
  //     };
  //   } catch (error: any) {
  //     strapi.log.error('Error sending ride requests:', error);
  //     return { success: false, error: error.message };
  //   }
  // },
  async sendRideRequests(rideId: string | number, drivers: any[]) {
    try {
      const ride: any = await strapi.db.query('api::ride.ride').findOne({
        where: { id: rideId },
        populate: ['rider', 'taxiType', 'rideClass']
      });
  
      if (!ride) {
        return { success: false, error: 'Ride not found' };
      }
  
      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      const requestedDrivers: any[] = [];
  
      for (const driver of drivers) {
        const requestData = {
          rideId: ride.id,
          rideCode: ride.rideCode,
          riderId: ride.rider.id,
          riderName: `${ride.rider.firstName} ${ride.rider.lastName}`,
          pickupLocation: ride.pickupLocation,
          dropoffLocation: ride.dropoffLocation,
          estimatedFare: ride.totalFare,
          distance: driver.distance,
          taxiType: ride.taxiType?.name,
          rideClass: ride.rideClass?.name,
          requestedAt: new Date().toISOString()
        };
  
        // 🆕 1. Show draw-over overlay on driver's device
        try {
          await DeviceService.showDrawOverOnDevice(driver.id, {
            type: 'ride_request',
            title: 'New Ride Request',
            message: `Pickup: ${ride.pickupLocation.address || ride.pickupLocation.name}`,
            rideId: ride.id,
            rideCode: ride.rideCode,
            estimatedFare: ride.totalFare,
            distance: driver.distance.toFixed(1),
            pickupAddress: ride.pickupLocation.address || ride.pickupLocation.name,
            dropoffAddress: ride.dropoffLocation.address || ride.dropoffLocation.name,
            riderName: `${ride.rider.firstName} ${ride.rider.lastName}`,
            autoTimeout: 30000 // 30 seconds
          });
          strapi.log.info(`Draw-over shown to driver ${driver.id}`);
        } catch (error) {
          strapi.log.error(`Draw-over error for driver ${driver.id}:`, error);
        }
  
        // 2. Send push notification (if enabled)
        if (settings?.pushNotificationsEnabled) {
          try {
            await DeviceService.sendNotificationToDevice(driver.id, {
              title: 'New Ride Request',
              body: `${driver.distance.toFixed(1)}km away • K${ride.totalFare.toFixed(2)}`,
              data: {
                type: 'ride_request',
                rideId: ride.id,
                rideCode: ride.rideCode,
                ...requestData
              }
            });
          } catch (error) {
            strapi.log.error(`Push notification error for driver ${driver.id}:`, error);
          }
        }
  
        // 3. Send SMS (if enabled and driver has phone)
        if (settings?.smsEnabled && settings?.driversCanReceiveRideRequestsViaSms && driver.phoneNumber) {
          try {
            const smsMessage = `New Okra rides ride request! ${driver.distance.toFixed(1)}km away. Fare: K${ride.totalFare.toFixed(2)}, Drop Off in ${ride.dropoffLocation.name}. Open app to accept.`;
            await SendSmsNotification("+" + driver.phoneNumber, smsMessage);
          } catch (error) {
            strapi.log.error(`SMS error for driver ${driver.id}:`, error);
          }
        }
  
        // 4. Send email (if enabled and driver has email)
        if (settings?.emailEnabled && driver.email) {
          try {
            const emailSubject = `New Okra rides Ride Request - ${ride.rideCode}`;
            const emailBody = `
              You have a new Okra rides ride request!
  
              Pickup: ${ride.pickupLocation.address}
              Dropoff: ${ride.dropoffLocation.address}
              Distance to pickup: ${driver.distance.toFixed(1)}km
              Estimated fare: K${ride.totalFare.toFixed(2)}
  
              Open your app to accept this ride.
          `;
            await SendEmailNotification(driver.email, emailBody);
          } catch (error) {
            strapi.log.error(`Email error for driver ${driver.id}:`, error);
          }
        }
  
        requestedDrivers.push({
          driverId: driver.id,
          distance: driver.distance,
          requestedAt: new Date().toISOString(),
          rideStatus: 'pending'
        });
  
        // Emit socket event to notify drivers
        socketService.emitRideRequestSent(rideId, requestedDrivers.map(rd => rd.driverId), requestData);
      }
  
      // Update ride with requested drivers
      await strapi.db.query('api::ride.ride').update({
        where: { id: rideId },
        data: {
          requestedDrivers
        }
      });
  
      strapi.log.info(`Sent ride requests to ${requestedDrivers.length} drivers for ride ${rideId}`);
  
      // Set timeout to handle no responses
      this.scheduleRequestTimeout(rideId);
  
      return {
        success: true,
        driverCount: requestedDrivers.length
      };
    } catch (error: any) {
      strapi.log.error('Error sending ride requests:', error);
      return { success: false, error: error.message };
    }
  },
  /**
   * Schedule timeout for ride request
   */
  scheduleRequestTimeout(rideId: string | number) {
    setTimeout(async () => {
      try {
        const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
        const timeoutSeconds = settings?.rideRequestTimeoutSeconds || 30;

        const ride: any = await strapi.db.query('api::ride.ride').findOne({
          where: { id: rideId }
        });

        if (ride && ride.rideStatus === 'pending') {
          await strapi.db.query('api::ride.ride').update({
            where: { id: rideId },
            data: {
              rideStatus: 'no_drivers_available'
            }
          });

          // Emit socket event
          socketService.emit('ride:no_drivers', {
            rideId,
            riderId: ride.rider,
          });
          strapi.eventHub.emit('ride:no_drivers', {
            rideId,
            riderId: ride.rider
          });

          strapi.log.warn(`Ride ${rideId} timed out - no drivers accepted`);
        }
      } catch (error) {
        strapi.log.error(`Error handling timeout for ride ${rideId}:`, error);
      }
    }, 30000); // Defaulting to 30s for the timer structure, but logically based on settings
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  },

  /**
   * Check if driver can accept rides (subscription check)
   */
  async canDriverAcceptRides(driverId: string | number) {
    try {
      const driver: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: driverId },
        populate: {
          driverProfile: {
            populate: {
              currentSubscription: true
            }
          }
        }
      });

      if (!driver?.driverProfile) {
        return { canAccept: false, reason: 'Driver profile not found' };
      }

      if (!driver.driverProfile.isOnline) {
        return { canAccept: false, reason: 'Driver is offline' };
      }

      if (!driver.driverProfile.isAvailable) {
        return { canAccept: false, reason: 'Driver is not available' };
      }

      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      
      if (settings?.subscriptionSystemEnabled) {
        const subscriptionStatus = driver.driverProfile.subscriptionStatus;
        const validStatuses = ['active', 'trial'];

        if (!validStatuses.includes(subscriptionStatus)) {
          return { 
            canAccept: false, 
            reason: 'Active subscription required to accept rides',
            subscriptionStatus 
          };
        }

        const subscription = driver.driverProfile.currentSubscription;
        if (subscription && subscription.expiresAt) {
          const now = new Date();
          const expiresAt = new Date(subscription.expiresAt);
          
          if (now > expiresAt) {
            return { 
              canAccept: false, 
              reason: 'Subscription has expired',
              expiresAt: subscription.expiresAt 
            };
          }
        }
      }

      return { canAccept: true };
    } catch (error) {
      strapi.log.error('Error checking driver eligibility:', error);
      return { canAccept: false, reason: 'Error checking eligibility' };
    }
  }
}