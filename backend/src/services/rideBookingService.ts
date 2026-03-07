// //Okra\Okrarides\backend\src\services\rideBookingService.ts
// import { SendSmsNotification, SendEmailNotification } from "./messages";
// import RiderBlockingService from './riderBlockingService'
// import DeviceService from './deviceServices'
// import socketService from './socketService'

// export interface RideBookingService {
//   findEligibleDrivers(rideData: any): Promise<any>;
//   sendRideRequests(rideId: number | string, drivers: any[]): Promise<any>;
//   scheduleRequestTimeout(rideId: number | string): void;
//   calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
//   deg2rad(deg: number): number;
//   canDriverAcceptRides(driverId: number | string): Promise<any>;
// }

// export default {
//   /**
//    * Find eligible drivers for a ride request
//    * Respects: float system, negative float settings, subscription system
//    */
//   async findEligibleDrivers(rideData: any) {
//     try {
//       const { pickupLocation, riderId, taxiType, rideClass } = rideData;

//       // Get admin settings
//       const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
//       const maxRadius = settings?.rideBookingRadius || 10;
//       const maxDrivers = settings?.maxSimultaneousDriverRequests || 5;

//       // Get blocked drivers for this rider
//       const blockedResult: any = await RiderBlockingService.getBlockedDrivers(riderId)
//       const tempBlocked = Object.keys(blockedResult.tempBlocked || {}).map(id => parseInt(id));
//       const permanentBlocked = blockedResult.permanentlyBlocked || [];
//       const allBlockedIds = [...new Set([...tempBlocked, ...permanentBlocked])];

//       strapi.log.info(`Finding drivers within ${maxRadius}km, excluding ${allBlockedIds.length} blocked drivers`);

//       const whereConditions = {
//         driverProfile: {
//           isActive: { $eq: true },
//           isOnline: { $eq: true },
//           isAvailable: { $eq: true },
//           taxiDriver: {
//             isActive: { $eq: true }
//           },
//           isEnroute: { $eq: false },
//           blocked: { $eq: false },
//         },
//         isOnline: { $eq: true },
//         activeProfile: { $eq: 'driver' },
//         id: {
//           $notIn: allBlockedIds
//         }
//       }

//       const drivers: any[] = await strapi.db.query('plugin::users-permissions.user').findMany({
//         where: whereConditions,
//         populate: {
//           driverProfile: {
//             populate: {
//               taxiDriver: true,
//               busDriver: true,
//               motorBikeRider: true,
//               assignedVehicle: true,
//               acceptedRideClasses: true,
//               acceptedTaxiTypes: true,
//               subscriptionPlan: true,
//               currentSubscription: true
//             }
//           },
//           profileActivityStatus: true
//         },
//         limit: 1000
//       });

//       // Request fresh location from all online drivers
//       if (drivers.length > 0) {
//         strapi.log.info(`Requesting fresh location from ${drivers.length} online drivers`);
//         for (const driver of drivers) {
//           try {
//             await DeviceService.requestLocationFromDevice(driver.id, 'driver');
//           } catch (error) {
//             strapi.log.warn(`Failed to request location from driver ${driver.id}:`, error);
//           }
//         }
//         // Give drivers a moment to respond with updated location
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }

//       strapi.log.info(`Found ${drivers.length} online drivers before filtering`);

//       // Determine payment system from settings
//       const paymentSystemType = settings?.paymentSystemType || 'float_based';
//       const floatSystemEnabled = settings?.floatSystemEnabled !== false; // default true
//       const allowNegativeFloat = settings?.allowNegativeFloat || false;
//       const negativeFloatLimit = settings?.negativeFloatLimit || 0;

//       const eligibleDrivers = drivers
//         .filter(driver => {
//           // 1. Check Profile Activity Status
//           if (driver.profileActivityStatus?.driver !== true) {
//             return false;
//           }

//           // 2. Must have current location
//           if (!driver.currentLocation?.latitude || !driver.currentLocation?.longitude) {
//             return false;
//           }

//           // 3. Calculate distance
//           const distance = this.calculateDistance(
//             pickupLocation.lat,
//             pickupLocation.lng,
//             driver.currentLocation.latitude,
//             driver.currentLocation.longitude
//           );

//           // 4. Must be within radius
//           if (distance > maxRadius) {
//             return false;
//           }

//           // 5. Check taxi type if specified
//           if (taxiType && driver.driverProfile?.acceptedTaxiTypes?.length > 0) {
//             const acceptedTypeIds = driver.driverProfile.acceptedTaxiTypes.map((t: any) => t.id);
//             if (!acceptedTypeIds.includes(taxiType)) {
//               return false;
//             }
//           }

//           // 6. Check ride class if specified
//           if (rideClass && driver.driverProfile?.acceptedRideClasses?.length > 0) {
//             const acceptedClassIds = driver.driverProfile.acceptedRideClasses.map((c: any) => c.id);
//             if (!acceptedClassIds.includes(rideClass)) {
//               return false;
//             }
//           }

//           // 7. Float eligibility check
//           // Determine if this driver needs float checked:
//           // - Pure float system: always check float
//           // - Hybrid system: only check if driver doesn't have active subscription
//           // - Subscription system: never check float
//           const driverSubStatus = driver.driverProfile?.subscriptionStatus;
//           const hasActiveSubscription = ['active', 'trial'].includes(driverSubStatus);

//           const shouldCheckFloat =
//             floatSystemEnabled &&
//             (paymentSystemType === 'float_based' ||
//               (paymentSystemType === 'hybrid' && !hasActiveSubscription));

//           if (shouldCheckFloat) {
//             const floatBalance = driver.driverProfile?.floatBalance || 0;

//             if (floatBalance < 0) {
//               if (!allowNegativeFloat) {
//                 // Negative float not allowed at all — driver is ineligible
//                 strapi.log.info(
//                   `Driver ${driver.id} excluded: negative float (${floatBalance}), negative float not allowed`
//                 );
//                 return false;
//               }

//               // Negative float is allowed but check the limit
//               if (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit) {
//                 strapi.log.info(
//                   `Driver ${driver.id} excluded: float (${floatBalance}) exceeded negative limit (-${negativeFloatLimit})`
//                 );
//                 return false;
//               }
//             }
//           }

//           return true;
//         })
//         .map(driver => ({
//           ...driver,
//           distance: this.calculateDistance(
//             pickupLocation.lat,
//             pickupLocation.lng,
//             driver.currentLocation.latitude,
//             driver.currentLocation.longitude
//           )
//         }))
//         .sort((a, b) => a.distance - b.distance)
//         .slice(0, maxDrivers);

//       strapi.log.info(`Found ${eligibleDrivers.length} eligible drivers`);

//       return {
//         success: true,
//         drivers: eligibleDrivers,
//         totalFound: eligibleDrivers.length
//       };
//     } catch (error: any) {
//       strapi.log.error('Error finding eligible drivers:', error);
//       return { success: false, error: error.message, drivers: [] };
//     }
//   },

//   /**
//    * Send ride requests to eligible drivers
//    */
//   async sendRideRequests(rideId: string | number, drivers: any[]) {
//     try {
//       const ride: any = await strapi.db.query('api::ride.ride').findOne({
//         where: { id: rideId },
//         populate: ['rider', 'taxiType', 'rideClass']
//       });

//       if (!ride) {
//         return { success: false, error: 'Ride not found' };
//       }

//       const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
//       const requestedDrivers: any[] = [];
//       const requestedDriverAccounts: any[] = [];

//       for (const driver of drivers) {
//         const requestData = {
//           rideId: ride.id,
//           rideCode: ride.rideCode,
//           riderId: ride.rider.id,
//           riderName: `${ride.rider.firstName} ${ride.rider.lastName}`,
//           pickupLocation: ride.pickupLocation,
//           dropoffLocation: ride.dropoffLocation,
//           estimatedFare: ride.totalFare,
//           distance: driver.distance,
//           taxiType: ride.taxiType?.name,
//           rideClass: ride.rideClass?.name,
//           requestedAt: new Date().toISOString()
//         };

//         // Show draw-over overlay on driver's device
//         try {
//           await DeviceService.showDrawOverOnDevice(driver.id, {
//             type: 'ride_request',
//             title: 'New Ride Request',
//             message: `Pickup: ${ride.pickupLocation.address || ride.pickupLocation.name}`,
//             rideId: ride.id,
//             rideCode: ride.rideCode,
//             estimatedFare: ride.totalFare,
//             distance: driver.distance.toFixed(1),
//             pickupAddress: ride.pickupLocation.address || ride.pickupLocation.name,
//             dropoffAddress: ride.dropoffLocation.address || ride.dropoffLocation.name,
//             riderName: `${ride.rider.firstName} ${ride.rider.lastName}`,
//             autoTimeout: 30000
//           });
//           strapi.log.info(`Draw-over shown to driver ${driver.id}`);
//         } catch (error) {
//           strapi.log.error(`Draw-over error for driver ${driver.id}:`, error);
//         }

//         // Send push notification (if enabled)
//         if (settings?.pushNotificationsEnabled) {
//           try {
//             await DeviceService.sendNotificationToDevice(driver.id, {
//               title: 'New Ride Request',
//               body: `${driver.distance.toFixed(1)}km away • K${ride.totalFare.toFixed(2)}`,
//               data: {
//                 type: 'ride_request',
//                 rideId: ride.id,
//                 rideCode: ride.rideCode,
//                 ...requestData
//               }
//             });
//           } catch (error) {
//             strapi.log.error(`Push notification error for driver ${driver.id}:`, error);
//           }
//         }

//         // Send SMS (if enabled and driver has phone)
//         if (settings?.smsEnabled && settings?.driversCanReceiveRideRequestsViaSms && driver.phoneNumber) {
//           try {
//             const smsMessage = `New Okra rides ride request! ${driver.distance.toFixed(1)}km away. Fare: K${ride.totalFare.toFixed(2)}, Drop Off in ${ride.dropoffLocation.name}. Open app to accept.`;
//             await SendSmsNotification("+" + driver.phoneNumber, smsMessage);
//           } catch (error) {
//             strapi.log.error(`SMS error for driver ${driver.id}:`, error);
//           }
//         }

//         // Send email (if enabled and driver has email)
//         if (settings?.emailEnabled && driver.email) {
//           try {
//             const emailSubject = `New Okra rides Ride Request - ${ride.rideCode}`;
//             const emailBody = `
//               You have a new Okra rides ride request!

//               Pickup: ${ride.pickupLocation.address}
//               Dropoff: ${ride.dropoffLocation.address}
//               Distance to pickup: ${driver.distance.toFixed(1)}km
//               Estimated fare: K${ride.totalFare.toFixed(2)}

//               Open your app to accept this ride.
//             `;
//             await SendEmailNotification(driver.email, emailBody);
//           } catch (error) {
//             strapi.log.error(`Email error for driver ${driver.id}:`, error);
//           }
//         }

//         requestedDrivers.push({
//           driverId: driver.id,
//           distance: driver.distance,
//           requestedAt: new Date().toISOString(),
//           rideStatus: 'pending'
//         });
//         requestedDriverAccounts.push(driver.id);
//         socketService.emitRideRequestSent(rideId, requestedDrivers.map(rd => rd.driverId), requestData);
//       }

//       await strapi.db.query('api::ride.ride').update({
//         where: { id: rideId },
//         data: {
//           requestedDrivers,
//           requestedDriverAccounts: { connect: requestedDriverAccounts }
//         }
//       });

//       strapi.log.info(`Sent ride requests to ${requestedDrivers.length} drivers for ride ${rideId}`);

//       this.scheduleRequestTimeout(rideId);

//       return {
//         success: true,
//         driverCount: requestedDrivers.length
//       };
//     } catch (error: any) {
//       strapi.log.error('Error sending ride requests:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   /**
//    * Schedule timeout for ride request
//    */
//   async scheduleRequestTimeout(rideId: string | number) {
//     const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
//     const timeoutSeconds = settings?.rideRequestTimeoutSeconds || 30;

//     setTimeout(async () => {
//       try {
//         const ride: any = await strapi.db.query('api::ride.ride').findOne({
//           where: { id: rideId }
//         });

//         if (ride && ride.rideStatus === 'pending') {
//           await strapi.db.query('api::ride.ride').update({
//             where: { id: rideId },
//             data: {
//               rideStatus: 'no_drivers_available'
//             }
//           });

//           socketService.emit('ride:no_drivers', {
//             rideId,
//             riderId: ride.rider,
//           });
//           strapi.eventHub.emit('ride:no_drivers', {
//             rideId,
//             riderId: ride.rider
//           });

//           strapi.log.warn(`Ride ${rideId} timed out - no drivers accepted`);
//         }
//       } catch (error) {
//         strapi.log.error(`Error handling timeout for ride ${rideId}:`, error);
//       }
//     }, timeoutSeconds * 1000);
//   },

//   /**
//    * Calculate distance between two coordinates (Haversine formula)
//    */
//   calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//     const R = 6371;
//     const dLat = this.deg2rad(lat2 - lat1);
//     const dLon = this.deg2rad(lon2 - lon1);

//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   },

//   deg2rad(deg: number): number {
//     return deg * (Math.PI / 180);
//   },

//   /**
//    * Check if driver can accept rides
//    * Respects: subscription system, float system, negative float settings
//    */
//   async canDriverAcceptRides(driverId: string | number) {
//     try {
//       const driver: any = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: driverId },
//         populate: {
//           driverProfile: {
//             populate: {
//               currentSubscription: true
//             }
//           }
//         }
//       });

//       if (!driver?.driverProfile) {
//         return { canAccept: false, reason: 'Driver profile not found' };
//       }

//       if (!driver.driverProfile.isOnline) {
//         return { canAccept: false, reason: 'Driver is offline' };
//       }

//       if (!driver.driverProfile.isAvailable) {
//         return { canAccept: false, reason: 'Driver is not available' };
//       }

//       const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
//       const paymentSystemType = settings?.paymentSystemType || 'float_based';

//       // ─── Subscription check ─────────────────────────────────────────────────
//       if (settings?.subscriptionSystemEnabled) {
//         const subscriptionStatus = driver.driverProfile.subscriptionStatus;
//         const validStatuses = ['active', 'trial'];

//         // On pure subscription system, must have valid subscription
//         if (paymentSystemType === 'subscription_based' && !validStatuses.includes(subscriptionStatus)) {
//           return {
//             canAccept: false,
//             reason: 'Active subscription required to accept rides',
//             subscriptionStatus,
//             action: 'subscribe'
//           };
//         }

//         // Check subscription expiry
//         const subscription = driver.driverProfile.currentSubscription;
//         if (subscription && subscription.expiresAt && validStatuses.includes(subscriptionStatus)) {
//           const now = new Date();
//           const expiresAt = new Date(subscription.expiresAt);

//           if (now > expiresAt) {
//             if (paymentSystemType === 'subscription_based') {
//               return {
//                 canAccept: false,
//                 reason: 'Subscription has expired',
//                 expiresAt: subscription.expiresAt,
//                 action: 'renew_subscription'
//               };
//             }
//             // For hybrid, fall through to float check
//           }
//         }
//       }

//       // ─── Float check ────────────────────────────────────────────────────────
//       const floatSystemEnabled = settings?.floatSystemEnabled !== false;
//       const allowNegativeFloat = settings?.allowNegativeFloat || false;
//       const negativeFloatLimit = settings?.negativeFloatLimit || 0;

//       const driverSubStatus = driver.driverProfile?.subscriptionStatus;
//       const hasActiveSubscription = ['active', 'trial'].includes(driverSubStatus);

//       const shouldCheckFloat =
//         floatSystemEnabled &&
//         (paymentSystemType === 'float_based' ||
//           (paymentSystemType === 'hybrid' && !hasActiveSubscription));

//       if (shouldCheckFloat) {
//         const floatBalance = driver.driverProfile?.floatBalance || 0;

//         if (floatBalance < 0) {
//           if (!allowNegativeFloat) {
//             return {
//               canAccept: false,
//               reason: 'Your float balance is negative. Please top up your float to accept rides.',
//               floatBalance,
//               action: 'topup_float'
//             };
//           }

//           if (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit) {
//             return {
//               canAccept: false,
//               reason: `Your float balance (K${Math.abs(floatBalance).toFixed(2)}) has exceeded the allowed negative limit of K${negativeFloatLimit}. Please top up.`,
//               floatBalance,
//               negativeLimit: -negativeFloatLimit,
//               action: 'topup_float'
//             };
//           }
//         }
//       }

//       return { canAccept: true };
//     } catch (error) {
//       strapi.log.error('Error checking driver eligibility:', error);
//       return { canAccept: false, reason: 'Error checking eligibility' };
//     }
//   }
// }
// src/services/rideBookingService.ts

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

// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Determines whether a driver's subscription is currently valid and unexpired.
 * Checks BOTH the denormalized `subscriptionStatus` field on the driver profile
 * AND the actual `expiresAt` timestamp on the currentSubscription relation.
 *
 * This dual check catches cases where the hourly cron job hasn't yet run but
 * the subscription has already technically passed its expiry time.
 */
function isSubscriptionCurrentlyActive(driverProfile: any): boolean {
  const profileStatus = driverProfile?.subscriptionStatus;

  // Fast-fail on clearly inactive statuses
  if (!['active', 'trial'].includes(profileStatus)) {
    return false;
  }

  // If no linked subscription record, trust the denormalized status alone
  const sub = driverProfile?.currentSubscription;
  if (!sub) {
    return profileStatus === 'active' || profileStatus === 'trial';
  }

  // Check the actual subscription record status (correct field name: subscriptionStatus)
  const subStatus = sub.subscriptionStatus;
  if (!['active', 'trial'].includes(subStatus)) {
    return false;
  }

  // Guard against stale profile data — check the actual expiry timestamp
  if (sub.expiresAt) {
    const now = new Date();
    const expiresAt = new Date(sub.expiresAt);
    if (now > expiresAt) {
      return false;
    }
  }

  return true;
}

export default {

  /**
   * Find eligible drivers for a ride request.
   * Eligibility is determined solely by paymentSystemType:
   *   float_based        — float balance check always applies
   *   subscription_based — active subscription required; float is irrelevant
   *   hybrid             — active subscription skips float check; otherwise float check applies
   */
  async findEligibleDrivers(rideData: any) {
    try {
      const { pickupLocation, riderId, taxiType, rideClass } = rideData;

      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      const maxRadius = settings?.rideBookingRadius || 10;
      const maxDrivers = settings?.maxSimultaneousDriverRequests || 5;

      // getBlockedDrivers is async — must await
      const blockedResult: any = await RiderBlockingService.getBlockedDrivers(riderId);
      const tempBlocked = Object.keys(blockedResult.tempBlocked || {}).map(id => parseInt(id));
      const permanentBlocked = blockedResult.permanentlyBlocked || [];
      const allBlockedIds = [...new Set([...tempBlocked, ...permanentBlocked])];

      strapi.log.info(`Finding drivers within ${maxRadius}km, excluding ${allBlockedIds.length} blocked drivers`);

      const whereConditions: any = {
        driverProfile: {
          isActive: { $eq: true },
          isOnline: { $eq: true },
          isAvailable: { $eq: true },
          taxiDriver: { isActive: { $eq: true } },
          isEnroute: { $eq: false },
          blocked: { $eq: false },
        },
        isOnline: { $eq: true },
        activeProfile: { $eq: 'driver' },
      };

      if (allBlockedIds.length > 0) {
        whereConditions.id = { $notIn: allBlockedIds };
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
              currentSubscription: true,
            }
          },
          profileActivityStatus: true
        },
        limit: 1000
      });

      // Request fresh locations from all online drivers
      if (drivers.length > 0) {
        strapi.log.info(`Requesting fresh location from ${drivers.length} online drivers`);
        for (const driver of drivers) {
          try {
            await DeviceService.requestLocationFromDevice(driver.id, 'driver');
          } catch (error) {
            strapi.log.warn(`Failed to request location from driver ${driver.id}:`, error);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      strapi.log.info(`Found ${drivers.length} online drivers before filtering`);

      const paymentSystemType = settings?.paymentSystemType || 'float_based';
      const allowNegativeFloat = settings?.allowNegativeFloat || false;
      const negativeFloatLimit = settings?.negativeFloatLimit || 0;

      const eligibleDrivers = drivers
        .filter(driver => {
          // 1. Must be actively in driver mode
          if (driver.profileActivityStatus?.driver !== true) {
            return false;
          }

          // 2. Must have a current location
          if (!driver.currentLocation?.latitude || !driver.currentLocation?.longitude) {
            return false;
          }

          // 3. Distance check
          const distance = this.calculateDistance(
            pickupLocation.lat,
            pickupLocation.lng,
            driver.currentLocation.latitude,
            driver.currentLocation.longitude
          );

          if (distance > maxRadius) {
            return false;
          }

          // 4. Taxi type check
          if (taxiType && driver.driverProfile?.acceptedTaxiTypes?.length > 0) {
            const acceptedTypeIds = driver.driverProfile.acceptedTaxiTypes.map((t: any) => t.id);
            if (!acceptedTypeIds.includes(taxiType)) {
              return false;
            }
          }

          // 5. Ride class check
          if (rideClass && driver.driverProfile?.acceptedRideClasses?.length > 0) {
            const acceptedClassIds = driver.driverProfile.acceptedRideClasses.map((c: any) => c.id);
            if (!acceptedClassIds.includes(rideClass)) {
              return false;
            }
          }

          // 6. Subscription system — active subscription required; float is irrelevant
          if (paymentSystemType === 'subscription_based') {
            const hasActiveSubscription = isSubscriptionCurrentlyActive(driver.driverProfile);
            if (!hasActiveSubscription) {
              strapi.log.info(
                `Driver ${driver.id} excluded: no active subscription ` +
                `(status: ${driver.driverProfile?.subscriptionStatus})`
              );
              return false;
            }
            return true;
          }

          // 7. Hybrid — active subscription skips float check entirely
          if (paymentSystemType === 'hybrid') {
            if (isSubscriptionCurrentlyActive(driver.driverProfile)) {
              return true;
            }
            // No active subscription — fall through to float check
          }

          // 8. Float check — applies to float_based, and hybrid drivers without active subscription
          const floatBalance = driver.driverProfile?.floatBalance || 0;

          if (floatBalance < 0) {
            if (!allowNegativeFloat) {
              strapi.log.info(
                `Driver ${driver.id} excluded: negative float (${floatBalance}), not allowed`
              );
              return false;
            }

            if (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit) {
              strapi.log.info(
                `Driver ${driver.id} excluded: float ${floatBalance} exceeded limit (-${negativeFloatLimit})`
              );
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
            driver.currentLocation.latitude,
            driver.currentLocation.longitude
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

  /**
   * Send ride requests to eligible drivers.
   */
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
      const requestedDriverAccounts: any[] = [];

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

        // Show draw-over overlay on driver device
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
            autoTimeout: 30000
          });
          strapi.log.info(`Draw-over shown to driver ${driver.id}`);
        } catch (error) {
          strapi.log.error(`Draw-over error for driver ${driver.id}:`, error);
        }

        // Push notification
        if (settings?.pushNotificationsEnabled) {
          try {
            await DeviceService.sendNotificationToDevice(driver.id, {
              title: 'New Ride Request',
              body: `${driver.distance.toFixed(1)}km away • K${ride.totalFare.toFixed(2)}`,
              data: { type: 'ride_request', rideId: ride.id, rideCode: ride.rideCode, ...requestData }
            });
          } catch (error) {
            strapi.log.error(`Push notification error for driver ${driver.id}:`, error);
          }
        }

        // SMS
        if (settings?.smsEnabled && settings?.driversCanReceiveRideRequestsViaSms && driver.phoneNumber) {
          try {
            const smsMessage = `New Okra rides ride request! ${driver.distance.toFixed(1)}km away. Fare: K${ride.totalFare.toFixed(2)}, Drop Off in ${ride.dropoffLocation.name}. Open app to accept.`;
            await SendSmsNotification("+" + driver.phoneNumber, smsMessage);
          } catch (error) {
            strapi.log.error(`SMS error for driver ${driver.id}:`, error);
          }
        }

        // Email
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
        requestedDriverAccounts.push(driver.id);
        socketService.emitRideRequestSent(rideId, requestedDrivers.map(rd => rd.driverId), requestData);
      }

      await strapi.db.query('api::ride.ride').update({
        where: { id: rideId },
        data: {
          requestedDrivers,
          requestedDriverAccounts: { connect: requestedDriverAccounts }
        }
      });

      strapi.log.info(`Sent ride requests to ${requestedDrivers.length} drivers for ride ${rideId}`);

      // scheduleRequestTimeout is async — intentionally not awaited (fire-and-schedule)
      this.scheduleRequestTimeout(rideId);

      return { success: true, driverCount: requestedDrivers.length };
    } catch (error: any) {
      strapi.log.error('Error sending ride requests:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Schedule timeout for a ride request.
   * Reads the configurable timeout from admin settings.
   * If no driver accepts within the window, marks the ride as no_drivers_available.
   */
  async scheduleRequestTimeout(rideId: string | number) {
    const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
    const timeoutSeconds = settings?.rideRequestTimeoutSeconds || 30;

    setTimeout(async () => {
      try {
        const ride: any = await strapi.db.query('api::ride.ride').findOne({
          where: { id: rideId }
        });

        if (ride && ride.rideStatus === 'pending') {
          await strapi.db.query('api::ride.ride').update({
            where: { id: rideId },
            data: { rideStatus: 'no_drivers_available' }
          });

          socketService.emit('ride:no_drivers', { rideId, riderId: ride.rider });
          strapi.eventHub.emit('ride:no_drivers', { rideId, riderId: ride.rider });

          strapi.log.warn(`Ride ${rideId} timed out — no drivers accepted`);
        }
      } catch (error) {
        strapi.log.error(`Error handling timeout for ride ${rideId}:`, error);
      }
    }, timeoutSeconds * 1000);
  },

  /**
   * Check if a specific driver can accept rides right now.
   * Eligibility is determined solely by paymentSystemType.
   */
  async canDriverAcceptRides(driverId: string | number) {
    try {
      const driver: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: driverId },
        populate: {
          driverProfile: {
            populate: {
              currentSubscription: true,
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
      const paymentSystemType = settings?.paymentSystemType || 'float_based';

      // ─── Subscription check ──────────────────────────────────────────────
      if (paymentSystemType !== 'float_based') {
        const driverOnSubscription = isSubscriptionCurrentlyActive(driver.driverProfile);

        if (paymentSystemType === 'subscription_based') {
          if (!driverOnSubscription) {
            const profileStatus = driver.driverProfile.subscriptionStatus;
            return {
              canAccept: false,
              reason: ['expired', 'cancelled'].includes(profileStatus)
                ? 'Your subscription has expired. Please renew to continue accepting rides.'
                : 'An active subscription is required to accept rides.',
              subscriptionStatus: profileStatus,
              action: 'subscribe',
            };
          }
          // Active subscription on pure subscription system — no float check needed
          return { canAccept: true };
        }

        // Hybrid with active subscription — no float check needed
        if (paymentSystemType === 'hybrid' && driverOnSubscription) {
          return { canAccept: true };
        }

        // Hybrid with no active subscription — fall through to float check
      }

      // ─── Float check — applies to float_based, and hybrid without active subscription
      const allowNegativeFloat = settings?.allowNegativeFloat || false;
      const negativeFloatLimit = settings?.negativeFloatLimit || 0;
      const floatBalance = driver.driverProfile?.floatBalance || 0;

      if (floatBalance < 0) {
        if (!allowNegativeFloat) {
          return {
            canAccept: false,
            reason: `Your float balance (K${Math.abs(floatBalance).toFixed(2)}) is negative. Please top up to accept rides.`,
            floatBalance,
            action: 'topup_float',
          };
        }

        if (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit) {
          return {
            canAccept: false,
            reason: `Your float (K${Math.abs(floatBalance).toFixed(2)}) has exceeded the allowed negative limit of K${negativeFloatLimit.toFixed(2)}. Please top up.`,
            floatBalance,
            negativeLimit: -negativeFloatLimit,
            action: 'topup_float',
          };
        }
      }

      return { canAccept: true };
    } catch (error) {
      strapi.log.error('Error checking driver eligibility:', error);
      return { canAccept: false, reason: 'Error checking eligibility' };
    }
  },

  // ─── Utility ──────────────────────────────────────────────────────────────

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
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
}