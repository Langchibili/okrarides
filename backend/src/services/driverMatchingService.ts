// src/services/driverMatchingService.js
/**
 * Service to find and match available drivers for rides
 */

// module.exports = ({ strapi }) => ({
//   /**
//    * Find nearby available drivers excluding blocked ones
//    */
//   async findNearbyDrivers(pickupLocation, riderId, maxDistance = 10, limit = 100) {
//     try {
//       // Get all blocked drivers for this rider
//       const blockedResult = await strapi.service('api::rider.riderBlockingService')
//         .getBlockedDrivers(riderId);
      
//       const tempBlocked = Object.keys(blockedResult.tempBlocked || {}).map(id => parseInt(id));
//       const permanentBlocked = blockedResult.permanentlyBlocked || [];
//       const allBlockedIds = [...new Set([...tempBlocked, ...permanentBlocked])];

//       // Find online and available drivers
//       const drivers = await strapi.db.query('plugin::users-permissions.user').findMany({
//         where: {
//           'driverProfile.isOnline': true,
//           'driverProfile.isAvailable': true,
//           isOnline: true,
//           activeProfile: 'driver',
//           profileActivityStatus: {
//             driver: true
//           },
//           id: {
//             $notIn: allBlockedIds // Exclude blocked drivers
//           }
//         },
//         populate: {
//           driverProfile: {
//             populate: {
//               assignedVehicle: true,
//               acceptedRideClasses: true,
//               acceptedTaxiTypes: true
//             }
//           }
//         },
//         limit: 1000 // Get more drivers to filter by distance
//       });

//       // Calculate distance and filter
//       const driversWithDistance = drivers
//         .filter(driver => driver.currentLocation?.latitude && driver.currentLocation?.longitude)
//         .map(driver => {
//           const distance = this.calculateDistance(
//             pickupLocation.lat,
//             pickupLocation.lng,
//             driver.currentLocation.latitude,
//             driver.currentLocation.longitude
//           );
          
//           return {
//             ...driver,
//             distance
//           };
//         })
//         .filter(driver => driver.distance <= maxDistance)
//         .sort((a, b) => a.distance - b.distance)
//         .slice(0, limit);

//       return {
//         success: true,
//         drivers: driversWithDistance,
//         totalFound: driversWithDistance.length
//       };
//     } catch (error) {
//       strapi.log.error('Error finding nearby drivers:', error);
//       return { success: false, error: error.message, drivers: [] };
//     }
//   },

//   /**
//    * Calculate distance between two coordinates using Haversine formula
//    */
//   calculateDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371; // Earth's radius in km
//     const dLat = this.deg2rad(lat2 - lat1);
//     const dLon = this.deg2rad(lon2 - lon1);
    
//     const a = 
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
//       Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   },

//   deg2rad(deg) {
//     return deg * (Math.PI / 180);
//   }
// });
// src/api/driver/services/nearbyDriverService.ts

export interface NearbyDriverService {
  findNearbyDrivers(
    pickupLocation: { lat: number; lng: number },
    riderId: number | string,
    maxDistance?: number,
    limit?: number
  ): Promise<any>;
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  deg2rad(deg: number): number;
}

export default ({ strapi }: { strapi: any }) => ({
  /**
   * Find nearby available drivers excluding blocked ones
   */
  async findNearbyDrivers(
    pickupLocation: { lat: number; lng: number },
    riderId: number | string,
    maxDistance: number = 10,
    limit: number = 100
  ) {
    try {
      // Get all blocked drivers for this rider
      const blockedResult: any = await strapi
        .service('api::rider.riderBlockingService')
        .getBlockedDrivers(riderId);

      const tempBlocked = Object.keys(blockedResult.tempBlocked || {}).map((id) =>
        parseInt(id)
      );
      const permanentBlocked = blockedResult.permanentlyBlocked || [];
      const allBlockedIds = [...new Set([...tempBlocked, ...permanentBlocked])];

      // Find online and available drivers
      const drivers: any[] = await strapi.db
        .query('plugin::users-permissions.user')
        .findMany({
          where: {
            'driverProfile.isOnline': true,
            'driverProfile.isAvailable': true,
            isOnline: true,
            activeProfile: 'driver',
            profileActivityStatus: {
              driver: true,
            },
            id: {
              $notIn: allBlockedIds, // Exclude blocked drivers
            },
          },
          populate: {
            driverProfile: {
              populate: {
                assignedVehicle: true,
                acceptedRideClasses: true,
                acceptedTaxiTypes: true,
              },
            },
          },
          limit: 1000, // Get more drivers to filter by distance
        });
      console.log('online drivers',drivers)
      // Calculate distance and filter
      const driversWithDistance = drivers
        .filter((driver) => driver.currentLocation?.latitude && driver.currentLocation?.longitude)
        .map((driver) => {
          const distance = this.calculateDistance(
            pickupLocation.lat,
            pickupLocation.lng,
            driver.currentLocation.latitude,
            driver.currentLocation.longitude
          );

          return {
            ...driver,
            distance,
          };
        })
        .filter((driver) => driver.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
console.log('driversWithDistance',driversWithDistance)
      return {
        success: true,
        drivers: driversWithDistance,
        totalFound: driversWithDistance.length,
      }
    } catch (error: any) {
      strapi.log.error('Error finding nearby drivers:', error);
      return { success: false, error: error.message, drivers: [] };
    }
  },

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  },
});