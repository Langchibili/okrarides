// // src/services/riderBlockingService.js
// /**
//  * Service to handle temporary and permanent driver blocking for riders
//  */

// module.exports = ({ strapi }) => ({
//   /**
//    * Clean expired temporary blocks when rider opens app
//    */
//   async cleanExpiredTempBlocks(riderId) {
//     try {
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: riderId },
//         populate: { riderProfile: true }
//       });

//       if (!user?.riderProfile) {
//         return { success: false, error: 'Rider profile not found' };
//       }

//       const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
//       const cooldownMinutes = settings?.driverCancellationCooldownMinutes || 15;
      
//       const tempBlockedDrivers = user.riderProfile.tempBlockedDrivers || {};
//       const now = new Date();
//       const cleanedBlocks = {};

//       // Check each blocked driver
//       Object.entries(tempBlockedDrivers).forEach(([driverId, blockedAt]) => {
//         const blockTime = new Date(blockedAt as string | number);
//         const minutesSinceBlock = (now.getTime() - blockTime.getTime()) / (1000 * 60);
        
//         // Keep if still within cooldown period
//         if (minutesSinceBlock < cooldownMinutes) {
//           cleanedBlocks[driverId] = blockedAt;
//         }
//       });

//       // Update rider profile with cleaned blocks
//       await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: riderId },
//         data: {
//           riderProfile: {
//             ...user.riderProfile,
//             tempBlockedDrivers: cleanedBlocks
//           }
//         }
//       });

//       return { 
//         success: true, 
//         cleanedCount: Object.keys(tempBlockedDrivers).length - Object.keys(cleanedBlocks).length,
//         remainingBlocks: cleanedBlocks
//       };
//     } catch (error) {
//       strapi.log.error('Error cleaning temp blocks:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   /**
//    * Add driver to temporary block list after cancellation
//    */
//   async addTempBlock(riderId, driverId) {
//     try {
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: riderId },
//         populate: { riderProfile: true }
//       });

//       if (!user?.riderProfile) {
//         return { success: false, error: 'Rider profile not found' };
//       }

//       const tempBlockedDrivers = user.riderProfile.tempBlockedDrivers || {};
//       tempBlockedDrivers[driverId] = new Date().toISOString();

//       await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: riderId },
//         data: {
//           riderProfile: {
//             ...user.riderProfile,
//             tempBlockedDrivers
//           }
//         }
//       });

//       return { success: true, blockedAt: tempBlockedDrivers[driverId] };
//     } catch (error) {
//       strapi.log.error('Error adding temp block:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   /**
//    * Add driver to permanent block list
//    */
//   async addPermanentBlock(riderId, driverId) {
//     try {
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: riderId },
//         populate: { riderProfile: true }
//       });

//       if (!user?.riderProfile) {
//         return { success: false, error: 'Rider profile not found' };
//       }

//       const blockedDrivers = user.riderProfile.blockedDrivers || [];
      
//       // Check if already blocked
//       if (blockedDrivers.includes(driverId)) {
//         return { success: false, error: 'Driver already blocked' };
//       }

//       blockedDrivers.push(driverId);

//       await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: riderId },
//         data: {
//           riderProfile: {
//             ...user.riderProfile,
//             blockedDrivers
//           }
//         }
//       });

//       return { success: true };
//     } catch (error) {
//       strapi.log.error('Error adding permanent block:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   /**
//    * Remove driver from permanent block list
//    */
//   async removePermanentBlock(riderId, driverId) {
//     try {
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: riderId },
//         populate: { riderProfile: true }
//       });

//       if (!user?.riderProfile) {
//         return { success: false, error: 'Rider profile not found' };
//       }

//       const blockedDrivers = user.riderProfile.blockedDrivers || [];
//       const updatedBlocks = blockedDrivers.filter(id => id !== driverId);

//       await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: riderId },
//         data: {
//           riderProfile: {
//             ...user.riderProfile,
//             blockedDrivers: updatedBlocks
//           }
//         }
//       });

//       return { success: true };
//     } catch (error) {
//       strapi.log.error('Error removing permanent block:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   /**
//    * Get all blocked drivers for a rider
//    */
//   async getBlockedDrivers(riderId) {
//     try {
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: riderId },
//         populate: { riderProfile: true }
//       });

//       if (!user?.riderProfile) {
//         return { success: false, error: 'Rider profile not found' };
//       }

//       return {
//         success: true,
//         tempBlocked: user.riderProfile.tempBlockedDrivers || {},
//         permanentlyBlocked: user.riderProfile.blockedDrivers || []
//       };
//     } catch (error) {
//       strapi.log.error('Error getting blocked drivers:', error);
//       return { success: false, error: error.message };
//     }
//   },

//   /**
//    * Check if a driver is blocked (temp or permanent)
//    */
//   async isDriverBlocked(riderId, driverId) {
//     try {
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: riderId },
//         populate: { riderProfile: true }
//       });

//       if (!user?.riderProfile) {
//         return false;
//       }

//       // Check permanent blocks
//       const permanentBlocks = user.riderProfile.blockedDrivers || [];
//       if (permanentBlocks.includes(driverId)) {
//         return true;
//       }

//       // Check temp blocks
//       const tempBlocks = user.riderProfile.tempBlockedDrivers || {};
//       if (tempBlocks[driverId]) {
//         const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
//         const cooldownMinutes = settings?.driverCancellationCooldownMinutes || 15;
        
//         const blockTime = new Date(tempBlocks[driverId]);
//         const now = new Date();
//         const minutesSinceBlock = (now.getTime() - blockTime.getTime()) / (1000 * 60);
        
//         return minutesSinceBlock < cooldownMinutes;
//       }

//       return false;
//     } catch (error) {
//       strapi.log.error('Error checking if driver blocked:', error);
//       return false;
//     }
//   }
// });

// src/api/rider/services/riderBlockingService.ts

export interface RiderBlockingService {
  cleanExpiredTempBlocks(riderId: number | string): Promise<any>;
  addTempBlock(riderId: number | string, driverId: number | string): Promise<any>;
  addPermanentBlock(riderId: number | string, driverId: number | string): Promise<any>;
  removePermanentBlock(riderId: number | string, driverId: number | string): Promise<any>;
  getBlockedDrivers(riderId: number | string): Promise<any>;
  isDriverBlocked(riderId: number | string, driverId: number | string): Promise<boolean>;
}

export default {
  /**
   * Clean expired temporary blocks when rider opens app
   */
  async cleanExpiredTempBlocks(riderId: number | string) {
    try {
      const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: riderId },
        populate: { riderProfile: true }
      });

      if (!user?.riderProfile) {
        return { success: false, error: 'Rider profile not found' };
      }

      const settings: any = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      const cooldownMinutes = settings?.driverCancellationCooldownMinutes || 15;
      
      const tempBlockedDrivers = user.riderProfile.tempBlockedDrivers || {};
      const now = new Date();
      const cleanedBlocks: Record<string, any> = {};

      // Check each blocked driver
      Object.entries(tempBlockedDrivers).forEach(([driverId, blockedAt]) => {
        const blockTime = new Date(blockedAt as string | number);
        const minutesSinceBlock = (now.getTime() - blockTime.getTime()) / (1000 * 60);
        
        // Keep if still within cooldown period
        if (minutesSinceBlock < cooldownMinutes) {
          cleanedBlocks[driverId] = blockedAt;
        }
      });

      // Update rider profile with cleaned blocks
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: riderId },
        data: {
          riderProfile: {
            ...user.riderProfile,
            tempBlockedDrivers: cleanedBlocks
          }
        }
      });

      return { 
        success: true, 
        cleanedCount: Object.keys(tempBlockedDrivers).length - Object.keys(cleanedBlocks).length,
        remainingBlocks: cleanedBlocks
      };
    } catch (error: any) {
      strapi.log.error('Error cleaning temp blocks:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add driver to temporary block list after cancellation
   */
  async addTempBlock(riderId: number | string, driverId: number | string) {
    try {
      const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: riderId },
        populate: { riderProfile: true }
      });

      if (!user?.riderProfile) {
        return { success: false, error: 'Rider profile not found' };
      }

      const tempBlockedDrivers = user.riderProfile.tempBlockedDrivers || {};
      tempBlockedDrivers[driverId as string] = new Date().toISOString();

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: riderId },
        data: {
          riderProfile: {
            ...user.riderProfile,
            tempBlockedDrivers
          }
        }
      });

      return { success: true, blockedAt: tempBlockedDrivers[driverId as string] };
    } catch (error: any) {
      strapi.log.error('Error adding temp block:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add driver to permanent block list
   */
  async addPermanentBlock(riderId: number | string, driverId: number | string) {
    try {
      const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: riderId },
        populate: { riderProfile: true }
      });

      if (!user?.riderProfile) {
        return { success: false, error: 'Rider profile not found' };
      }

      const blockedDrivers: any[] = user.riderProfile.blockedDrivers || [];
      
      // Check if already blocked
      if (blockedDrivers.includes(driverId)) {
        return { success: false, error: 'Driver already blocked' };
      }

      blockedDrivers.push(driverId);

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: riderId },
        data: {
          riderProfile: {
            ...user.riderProfile,
            blockedDrivers
          }
        }
      });

      return { success: true };
    } catch (error: any) {
      strapi.log.error('Error adding permanent block:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove driver from permanent block list
   */
  async removePermanentBlock(riderId: number | string, driverId: number | string) {
    try {
      const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: riderId },
        populate: { riderProfile: true }
      });

      if (!user?.riderProfile) {
        return { success: false, error: 'Rider profile not found' };
      }

      const blockedDrivers: any[] = user.riderProfile.blockedDrivers || [];
      const updatedBlocks = blockedDrivers.filter(id => id !== driverId);

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: riderId },
        data: {
          riderProfile: {
            ...user.riderProfile,
            blockedDrivers: updatedBlocks
          }
        }
      });

      return { success: true };
    } catch (error: any) {
      strapi.log.error('Error removing permanent block:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all blocked drivers for a rider
   */
  async getBlockedDrivers(riderId: number | string) {
    try {
      const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: riderId },
        populate: { riderProfile: true }
      });

      if (!user?.riderProfile) {
        return { success: false, error: 'Rider profile not found' };
      }

      return {
        success: true,
        tempBlocked: user.riderProfile.tempBlockedDrivers || {},
        permanentlyBlocked: user.riderProfile.blockedDrivers || []
      };
    } catch (error: any) {
      strapi.log.error('Error getting blocked drivers:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if a driver is blocked (temp or permanent)
   */
  async isDriverBlocked(riderId: number | string, driverId: number | string): Promise<boolean> {
    try {
      const user: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: riderId },
        populate: { riderProfile: true }
      });

      if (!user?.riderProfile) {
        return false;
      }

      // Check permanent blocks
      const permanentBlocks: any[] = user.riderProfile.blockedDrivers || [];
      if (permanentBlocks.includes(driverId)) {
        return true;
      }

      // Check temp blocks
      const tempBlocks = user.riderProfile.tempBlockedDrivers || {};
      if (tempBlocks[driverId as string]) {
        const settings: any = await strapi.db.query('api::admn-setting.admn-setting').findOne();
        const cooldownMinutes = settings?.driverCancellationCooldownMinutes || 15;
        
        const blockTime = new Date(tempBlocks[driverId as string]);
        const now = new Date();
        const minutesSinceBlock = (now.getTime() - blockTime.getTime()) / (1000 * 60);
        
        return minutesSinceBlock < cooldownMinutes;
      }

      return false;
    } catch (error) {
      strapi.log.error('Error checking if driver blocked:', error);
      return false;
    }
  }
};