// // src/services/deviceService.ts
// export interface DeviceService {
//   requestLocationFromDevice(userId: number | string, userType?: string): Promise<boolean>;
//   sendNotificationToDevice(userId: number | string, notification: any): Promise<boolean>;
//   showDrawOverOnDevice(userId: number | string, overlayData: any): Promise<boolean>;
//   cleanupInactiveDevices(): Promise<number>;
// }

// export default {
//   /**
//    * Send location request to user's devices
//    */
//   async requestLocationFromDevice(userId: number | string, userType: string = 'driver'): Promise<boolean> {
//     try {
//       // Get user devices
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//       });

//       if (!user || !user.devices || user.devices.length === 0) {
//         console.warn(`No devices found for user ${userId}`);
//         return false;
//       }

//       // Send location request via device socket server
//       // This would be handled by the main socket server routing to device socket server
//       const socketService = (strapi as any).socketService;
//       if (socketService) {
//         socketService.emit('device:location:request', {
//           userId,
//           userType,
//           timestamp: Date.now(),
//         });
//         return true;
//       }

//       return false;
//     } catch (error) {
//       console.error('Error requesting location from device:', error);
//       return false;
//     }
//   },

//   /**
//    * Send notification to user's devices
//    */
//   async sendNotificationToDevice(userId: number | string, notification: any): Promise<boolean> {
//     try {
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//       });

//       if (!user || !user.devices || user.devices.length === 0) {
//         console.warn(`No devices found for user ${userId}`);
//         return false;
//       }

//       const socketService = (strapi as any).socketService;
//       if (socketService) {
//         socketService.emit('device:notification:send', {
//           userId,
//           notification,
//         });
//         return true;
//       }

//       return false;
//     } catch (error) {
//       console.error('Error sending notification to device:', error);
//       return false;
//     }
//   },

//   /**
//    * Show draw-over on user's devices (for ride requests, etc.)
//    */
//   async showDrawOverOnDevice(userId: number | string, overlayData: any): Promise<boolean> {
//     try {
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//       });

//       if (!user || !user.devices || user.devices.length === 0) {
//         console.warn(`No devices found for user ${userId}`);
//         return false;
//       }

//       const socketService = (strapi as any).socketService;
//       if (socketService) {
//         socketService.emit('device:drawover:show', {
//           userId,
//           overlayData,
//         });
//         return true;
//       }

//       return false;
//     } catch (error) {
//       console.error('Error showing draw-over on device:', error);
//       return false;
//     }
//   },

//   /**
//    * Cleanup inactive devices (haven't been seen in 30 days)
//    */
//   async cleanupInactiveDevices(): Promise<number> {
//     try {
//       const thirtyDaysAgo = new Date();
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//       const users = await strapi.db.query('plugin::users-permissions.user').findMany({
//         where: {},
//       });

//       let totalCleaned = 0;

//       for (const user of users) {
//         if (!user.devices || user.devices.length === 0) continue;

//         const activeDevices = user.devices.filter(device => {
//           const lastSeen = new Date(device.lastSeen || device.registeredAt);
//           return lastSeen > thirtyDaysAgo;
//         });

//         if (activeDevices.length !== user.devices.length) {
//           const cleanedCount = user.devices.length - activeDevices.length;
//           totalCleaned += cleanedCount;

//           await strapi.db.query('plugin::users-permissions.user').update({
//             where: { id: user.id },
//             data: {
//               devices: activeDevices,
//             },
//           });
//         }
//       }

//       console.log(`Cleaned up ${totalCleaned} inactive devices`);
//       return totalCleaned;
//     } catch (error) {
//       console.error('Error cleaning up inactive devices:', error);
//       return 0;
//     }
//   }
// };
// src/services/deviceService.ts
export interface DeviceService {
  requestLocationFromDevice(userId: number | string, userType?: string): Promise<boolean>;
  sendNotificationToDevice(userId: number | string, notification: any): Promise<boolean>;
  showDrawOverOnDevice(userId: number | string, overlayData: any): Promise<boolean>;
  cleanupInactiveDevices(): Promise<number>;
}

export default {
  /**
   * Send location request to user's devices
   */
  async requestLocationFromDevice(userId: number | string, userType: string = 'driver'): Promise<boolean> {
    try {
      // Get user devices from device collection
      const devices = await strapi.db.query('api::device.device').findMany({
        where: { user: userId },
      });

      if (!devices || devices.length === 0) {
        console.warn(`No devices found for user ${userId}`);
        return false;
      }

      // Send location request via device socket server
      const socketService = (strapi as any).socketService;
      if (socketService) {
        socketService.emit('device:location:request', {
          userId,
          userType,
          timestamp: Date.now(),
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting location from device:', error);
      return false;
    }
  },

  /**
   * Send notification to user's devices
   */
  async sendNotificationToDevice(userId: number | string, notification: any): Promise<boolean> {
    try {
      const devices = await strapi.db.query('api::device.device').findMany({
        where: { user: userId },
      });

      if (!devices || devices.length === 0) {
        console.warn(`No devices found for user ${userId}`);
        return false;
      }

      const socketService = (strapi as any).socketService;
      if (socketService) {
        socketService.emit('device:notification:send', {
          userId,
          notification,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending notification to device:', error);
      return false;
    }
  },

  /**
   * Show draw-over on user's devices (for ride requests, etc.)
   */
  async showDrawOverOnDevice(userId: number | string, overlayData: any): Promise<boolean> {
    try {
      const devices = await strapi.db.query('api::device.device').findMany({
        where: { user: userId },
      });

      if (!devices || devices.length === 0) {
        console.warn(`No devices found for user ${userId}`);
        return false;
      }

      const socketService = (strapi as any).socketService;
      if (socketService) {
        socketService.emit('device:drawover:show', {
          userId,
          overlayData,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error showing draw-over on device:', error);
      return false;
    }
  },

  /**
   * Cleanup inactive devices (haven't been seen in 30 days)
   */
  async cleanupInactiveDevices(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allDevices = await strapi.db.query('api::device.device').findMany({});

      let totalCleaned = 0;

      for (const device of allDevices) {
        if (!device.deviceInfo?.lastSeen) continue;

        const lastSeen = new Date(device.deviceInfo.lastSeen);
        
        if (lastSeen < thirtyDaysAgo) {
          await strapi.db.query('api::device.device').delete({
            where: { id: device.id },
          });
          totalCleaned++;
        }
      }

      console.log(`Cleaned up ${totalCleaned} inactive devices`);
      return totalCleaned;
    } catch (error) {
      console.error('Error cleaning up inactive devices:', error);
      return 0;
    }
  }
};