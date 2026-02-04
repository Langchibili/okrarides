// // // src/api/device/routes/device.ts
// // import { factories } from '@strapi/strapi';

// // export default factories.createCoreController('api::device.device', ({ strapi }) => ({
// //   async registerDevices(ctx) {
// //     const { userId,devices } = ctx.request.body;

// //     if (!devices || !Array.isArray(devices)) {
// //       return ctx.badRequest('Devices array is required');
// //     }

// //     try {
// //       // Get user
// //       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
// //         where: { id: userId },
// //       });

// //       if (!user) {
// //         return ctx.notFound('User not found');
// //       }

// //       // Get or create user's device record
// //       let userDevices = user.devices || [];

// //       // Process each device
// //       for (const device of devices) {
// //         const { deviceId, notificationToken, deviceInfo, frontendName } = device;

// //         // Check if device already exists
// //         const existingIndex = userDevices.findIndex(d => d.deviceId === deviceId);

// //         if (existingIndex >= 0) {
// //           // Update existing device
// //           userDevices[existingIndex] = {
// //             ...userDevices[existingIndex],
// //             notificationToken,
// //             deviceInfo,
// //             frontendName,
// //             lastSeen: new Date().toISOString(),
// //             updatedAt: new Date().toISOString(),
// //           };
// //         } else {
// //           // Add new device
// //           userDevices.push({
// //             deviceId,
// //             notificationToken,
// //             deviceInfo,
// //             frontendName,
// //             registeredAt: new Date().toISOString(),
// //             lastSeen: new Date().toISOString(),
// //             permissions: {},
// //             active: true,
// //           });
// //         }
// //       }

// //       // Update user with new devices
// //       await strapi.db.query('plugin::users-permissions.user').update({
// //         where: { id: userId },
// //         data: { devices: userDevices },
// //       });

// //       ctx.send({
// //         success: true,
// //         message: 'Devices registered successfully',
// //         deviceCount: userDevices.length,
// //       });
// //     } catch (error) {
// //       console.error('Error registering devices:', error);
// //       console.log('error',error)
// //       ctx.internalServerError('Failed to register devices');
// //     }
// //   },

// //   async updateDevice(ctx) {
// //     const { userId, deviceId } = ctx.params;
// //     const updateData = ctx.request.body;

// //     try {
// //       // Get user
// //       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
// //         where: { id: userId },
// //       });

// //       if (!user) {
// //         return ctx.notFound('User not found');
// //       }

// //       let userDevices = user.devices || [];
// //       const deviceIndex = userDevices.findIndex(d => d.deviceId === deviceId);

// //       if (deviceIndex === -1) {
// //         return ctx.notFound('Device not found');
// //       }

// //       // Update device
// //       userDevices[deviceIndex] = {
// //         ...userDevices[deviceIndex],
// //         ...updateData,
// //         lastSeen: new Date().toISOString(),
// //         updatedAt: new Date().toISOString(),
// //       };

// //       // Save
// //       await strapi.db.query('plugin::users-permissions.user').update({
// //         where: { id: userId },
// //         data: { devices: userDevices },
// //       });

// //       ctx.send({
// //         success: true,
// //         message: 'Device updated successfully',
// //         device: userDevices[deviceIndex],
// //       });
// //     } catch (error) {
// //       console.error('Error updating device:', error);
// //       ctx.internalServerError('Failed to update device');
// //     }
// //   },

// //   async getUserDevices(ctx) {
// //     const { userId } = ctx.params;

// //     try {
// //       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
// //         where: { id: userId },
// //       });

// //       if (!user) {
// //         return ctx.notFound('User not found');
// //       }

// //       ctx.send({
// //         success: true,
// //         devices: user.devices || [],
// //       });
// //     } catch (error) {
// //       console.error('Error getting user devices:', error);
// //       ctx.internalServerError('Failed to get devices');
// //     }
// //   },

// //   async removeDevice(ctx) {
// //     const { userId, deviceId } = ctx.params;

// //     try {
// //       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
// //         where: { id: userId },
// //       });

// //       if (!user) {
// //         return ctx.notFound('User not found');
// //       }

// //       let userDevices = user.devices || [];
// //       userDevices = userDevices.filter(d => d.deviceId !== deviceId);

// //       await strapi.db.query('plugin::users-permissions.user').update({
// //         where: { id: userId },
// //         data: { devices: userDevices },
// //       });

// //       ctx.send({
// //         success: true,
// //         message: 'Device removed successfully',
// //       });
// //     } catch (error) {
// //       console.error('Error removing device:', error);
// //       ctx.internalServerError('Failed to remove device');
// //     }
// //   },
// // }));

// // src/api/device/controller/device.ts
// import { factories } from '@strapi/strapi';

// export default factories.createCoreController('api::device.device', ({ strapi }) => ({
//   async registerDevices(ctx) {
//     const { userId, devices } = ctx.request.body;
//     if (!devices || !Array.isArray(devices)) {
//       return ctx.badRequest('Devices array is required');
//     }

//     try {
//       // Verify user exists
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//       });

//       if (!user) {
//         return ctx.notFound('User not found');
//       }

//       const registeredDevices = [];

//       // Process each device
//       for (const device of devices) {
//         const { deviceId, notificationToken, deviceInfo, frontendName } = device;
//         // Check if device already exists
//         const existingDevice = await strapi.db.query('api::device.device').findOne({
//           where: { deviceId },
//         })
      
//       return
//         const deviceData = {
//           notificationToken,
//           deviceInfo: {
//             ...(deviceInfo || {}),
//             frontendName,
//             lastSeen: new Date().toISOString(),
//             permissions: existingDevice?.deviceInfo?.permissions || {},
//             active: true,
//             updatedAt: new Date().toISOString(),
//           }
//         };
//          console.log('2',existingDevice)
//         if (existingDevice) {
//           console.log('3',existingDevice)
//           // Update existing device
//           const updated = await strapi.db.query('api::device.device').update({
//             where: { id: existingDevice.id },
//             data: {
//               ...deviceData,
//               user: userId,
//               deviceInfo: {
//                 ...deviceData.deviceInfo,
//                 registeredAt: existingDevice.deviceInfo?.registeredAt || new Date().toISOString(),
//               }
//             },
//           });
//           registeredDevices.push(updated);
//         } else {
//           console.log('here in create mode')
//           // Create new device
//           const created = await strapi.db.query('api::device.device').create({
//             data: {
//               deviceId,
//               ...deviceData,
//               user: userId,
//               deviceInfo: {
//                 ...deviceData.deviceInfo,
//                 registeredAt: new Date().toISOString(),
//               },
//               publishedAt: new Date()
//             },
//           })
//           registeredDevices.push(created)
//         }
//       }

//       ctx.send({
//         success: true,
//         message: 'Devices registered successfully',
//         deviceCount: registeredDevices.length,
//         devices: registeredDevices,
//       });
//     } catch (error) {
//       console.error('Error registering devices:', error);
//       console.log('error', error);
//       ctx.internalServerError('Failed to register devices');
//     }
//   },

//   async updateDevice(ctx) {
//     const { userId, deviceId } = ctx.params;
//     const updateData = ctx.request.body;

//     try {
//       // Find device
//       const device = await strapi.db.query('api::device.device').findOne({
//         where: { deviceId },
//         populate: ['user'],
//       });

//       if (!device) {
//         return ctx.notFound('Device not found');
//       }

//       // Verify device belongs to user
//       if (device.user.id !== parseInt(userId)) {
//         return ctx.forbidden('Device does not belong to this user');
//       }

//       // Update device - merge deviceInfo if provided
//       const updatedDevice = await strapi.db.query('api::device.device').update({
//         where: { id: device.id },
//         data: {
//           notificationToken: updateData.notificationToken || device.notificationToken,
//           deviceInfo: {
//             ...(device.deviceInfo || {}),
//             ...(updateData.deviceInfo || {}),
//             lastSeen: new Date().toISOString(),
//             updatedAt: new Date().toISOString(),
//           }
//         },
//       });

//       ctx.send({
//         success: true,
//         message: 'Device updated successfully',
//         device: updatedDevice,
//       });
//     } catch (error) {
//       console.error('Error updating device:', error);
//       ctx.internalServerError('Failed to update device');
//     }
//   },

//   async getUserDevices(ctx) {
//     const { userId } = ctx.params;

//     try {
//       // Verify user exists
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//       });

//       if (!user) {
//         return ctx.notFound('User not found');
//       }

//       // Get all devices for user
//       const devices = await strapi.db.query('api::device.device').findMany({
//         where: { user: userId },
//       });

//       ctx.send({
//         success: true,
//         devices: devices || [],
//       });
//     } catch (error) {
//       console.error('Error getting user devices:', error);
//       ctx.internalServerError('Failed to get devices');
//     }
//   },

//   async removeDevice(ctx) {
//     const { userId, deviceId } = ctx.params;

//     try {
//       // Find device
//       const device = await strapi.db.query('api::device.device').findOne({
//         where: { deviceId },
//         populate: ['user'],
//       });

//       if (!device) {
//         return ctx.notFound('Device not found');
//       }

//       // Verify device belongs to user
//       if (device.user.id !== parseInt(userId)) {
//         return ctx.forbidden('Device does not belong to this user');
//       }

//       // Delete device
//       await strapi.db.query('api::device.device').delete({
//         where: { id: device.id },
//       });

//       ctx.send({
//         success: true,
//         message: 'Device removed successfully',
//       });
//     } catch (error) {
//       console.error('Error removing device:', error);
//       ctx.internalServerError('Failed to remove device');
//     }
//   },

//   async checkDevicePermissions(ctx) {
//     const { deviceId } = ctx.params;

//     try {
//       // Find device by deviceId
//       const device = await strapi.db.query('api::device.device').findOne({
//         where: { deviceId },
//       });

//       if (!device) {
//         return ctx.notFound('Device not found');
//       }

//       // Check if permissions are set and not empty
//       const hasPermissions = !!(
//         device.deviceInfo?.permissions && 
//         Object.keys(device.deviceInfo.permissions).length > 0
//       );

//       ctx.send({
//         permissions: device?.deviceInfo?.permissions,
//         success: true,
//         hasPermissions,
//         deviceId,
//       });
//     } catch (error) {
//       console.error('Error checking device permissions:', error);
//       ctx.internalServerError('Failed to check device permissions');
//     }
//   },
// }))
// src/api/device/controller/device.ts
import { factories } from '@strapi/strapi';
import { googleMapService } from '../../../services/googleMapService';
export default factories.createCoreController('api::device.device', ({ strapi }) => ({
  // ========================
  // DEFAULT CRUD OPERATIONS
  // ========================
  
  async find(ctx) {
    try {
      // You can customize the default find behavior
      const sanitizedQuery = await this.sanitizeQuery(ctx);
      
      const { results, pagination } = await strapi.service('api::device.device').find(sanitizedQuery);
      
      // Sanitize the results
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
      
      if (!entity) {
        return ctx.notFound('Device not found');
      }
      
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
      
      const entity = await strapi.service('api::device.device').create({
        data: sanitizedInput,
      });
      
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
      
      // Check if device exists
      const existingDevice = await strapi.service('api::device.device').findOne(id);
      if (!existingDevice) {
        return ctx.notFound('Device not found');
      }
      
      const entity = await strapi.service('api::device.device').update(id, {
        data: sanitizedInput,
      });
      
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
      
      // Check if device exists
      const existingDevice = await strapi.service('api::device.device').findOne(id);
      if (!existingDevice) {
        return ctx.notFound('Device not found');
      }
      
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

  // async registerDevices(ctx) {
  //   const { userId, devices } = ctx.request.body;
  //   if (!devices || !Array.isArray(devices)) {
  //     return ctx.badRequest('Devices array is required');
  //   }

  //   try {
  //     // Verify user exists
  //     const user = await strapi.db.query('plugin::users-permissions.user').findOne({
  //       where: { id: userId },
  //     });

  //     if (!user) {
  //       return ctx.notFound('User not found');
  //     }

  //     const registeredDevices = [];

  //     // Process each device
  //     for (const device of devices) {
  //       const { deviceId, notificationToken, deviceInfo, frontendName } = device;
        
  //       // Check if device already exists
  //       const existingDevice = await strapi.db.query('api::device.device').findOne({
  //         where: { deviceId },
  //       });
  //       // await strapi.db.query('api::device.device').delete({
  //       //   where: {id:existingDevice.id}
  //       // });
  //       // return
  //       console.log('still found', existingDevice)
  //       const deviceData = {
  //         notificationToken,
  //         deviceInfo: {
  //           ...(deviceInfo || {}),
  //           frontendName,
  //           lastSeen: new Date().toISOString(),
  //           permissions: existingDevice?.deviceInfo?.permissions || {},
  //           active: true,
  //           updatedAt: new Date().toISOString(),
  //         }
  //       };

  //       if (existingDevice) {
  //         // Update existing device
  //         const updated = await strapi.db.query('api::device.device').update({
  //           where: { id: existingDevice.id },
  //           data: {
  //             ...deviceData,
  //             user: userId,
  //             deviceInfo: {
  //               ...deviceData.deviceInfo,
  //               registeredAt: existingDevice.deviceInfo?.registeredAt || new Date().toISOString(),
  //             }
  //           },
  //         });
  //         registeredDevices.push(updated);
  //       } else {
  //         // Create new device
  //         const created = await strapi.db.query('api::device.device').create({
  //           data: {
  //             deviceId,
  //             ...deviceData,
  //             user: userId,
  //             deviceInfo: {
  //               ...deviceData.deviceInfo,
  //               registeredAt: new Date().toISOString(),
  //             },
  //             publishedAt: new Date(),
  //             createdBy: 1, // Admin user ID
  //             updatedBy: 1, // Admin user ID
  //           },
  //         })
  //         registeredDevices.push(created);
  //       }
  //     }

  //     ctx.send({
  //       success: true,
  //       message: 'Devices registered successfully',
  //       deviceCount: registeredDevices.length,
  //       devices: registeredDevices,
  //     });
  //   } catch (error) {
  //     console.error('Error registering devices:', error);
  //     ctx.internalServerError('Failed to register devices');
  //   }
  // },
async registerDevices(ctx) {
  const { userId, devices } = ctx.request.body;

  if (!Array.isArray(devices)) {
    return ctx.badRequest('Devices array is required');
  }

  const user = await strapi.entityService.findOne(
    'plugin::users-permissions.user',
    userId
  );

  if (!user) return ctx.notFound('User not found');

  const registeredDevices = [];

  for (const device of devices) {
    const { deviceId, notificationToken, deviceInfo, frontendName } = device;

    const existing = await strapi.entityService.findMany(
      'api::device.device',
      {
        filters: { deviceId },
        publicationState: 'preview',
        limit: 1,
      }
    )

    const baseDeviceInfo = {
      ...(deviceInfo || {}),
      frontendName,
      lastSeen: new Date().toISOString(),
      active: true,
      updatedAt: new Date().toISOString(),
    };

    if (existing.length) {
      const updated = await strapi.entityService.update(
        'api::device.device',
        existing[0].id,
        {
          data: {
            notificationToken,
            deviceInfo: {
              ...((existing[0].deviceInfo as Record<string, any>) || {}),
              ...baseDeviceInfo,
            },
            user: userId,
          },
        }
      )
      registeredDevices.push(updated);
    } else {
      const created = await strapi.entityService.create(
        'api::device.device',
        {
          data: {
            deviceId,
            notificationToken,
            deviceInfo: {
              ...baseDeviceInfo,
              registeredAt: new Date().toISOString(),
            },
            user: userId,
          },
        }
      )
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: { devices: {connect:[created.id]} }
      })
      registeredDevices.push(created);
    }
  }

  ctx.send({
    success: true,
    deviceCount: registeredDevices.length,
    devices: registeredDevices,
  });
}
,
async updateUserCurrentLocation(ctx) {
  try {
    const { deviceId, location } = ctx.request.body;

    // Validate required fields
    if (!deviceId) {
      return ctx.badRequest('Device ID is required');
    }

    if (!location || typeof location !== 'object') {
      return ctx.badRequest('Location object is required');
    }

    // Validate location structure
    if (!location.latitude || !location.longitude) {
      return ctx.badRequest('Location must include latitude and longitude');
    }

    // Find device by deviceId
    const device = await strapi.db.query('api::device.device').findOne({
      where: { deviceId },
      populate: ['user'],
    });

    if (!device) {
      return ctx.notFound('Device not found');
    }

    if (!device.user) {
      return ctx.badRequest('Device is not associated with a user');
    }

    // Base location data from the request
    let locationDetails: any = {
      latitude: location.latitude,
      longitude: location.longitude,
    };

    // Add optional location properties if they exist
    if (location.accuracy !== undefined) {
      locationDetails.accuracy = location.accuracy;
    }
    if (location.altitude !== undefined) {
      locationDetails.altitude = location.altitude;
    }
    if (location.altitudeAccuracy !== undefined) {
      locationDetails.altitudeAccuracy = location.altitudeAccuracy;
    }
    if (location.heading !== undefined) {
      locationDetails.heading = location.heading;
    }
    if (location.speed !== undefined) {
      locationDetails.speed = location.speed;
    }

    // Set timestamp
    locationDetails.timestamp = location.timestamp 
      ? new Date(location.timestamp).toISOString() 
      : new Date().toISOString();

    // Fetch geocoding details from Google Maps
    try {
      const geocodingData = await googleMapService.reverseGeocode(
        location.latitude,
        location.longitude
      );

      if (geocodingData) {
        // Merge geocoding data with location details
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

        console.log('Successfully fetched geocoding data:', {
          name: geocodingData.name,
          address: geocodingData.address,
          placeId: geocodingData.placeId,
        });
      } else {
        console.warn('No geocoding data returned from Google Maps API');
      }
    } catch (geocodingError) {
      console.error('Error fetching geocoding details:', geocodingError);
      // Continue without geocoding details if API fails
    }
    console.log('device.user.id:',device.user.id)
    console.log('device.id:',device.id)
    // Update user's current location
    const updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: device.user.id },
      data: {
        currentLocation: locationDetails
      },
    });

    // Update device's last seen timestamp and last location
    await strapi.db.query('api::device.device').update({
      where: { id: device.id },
      data: {
        deviceInfo: {
          ...(device.deviceInfo || {}),
          lastSeen: new Date().toISOString(),
          lastLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: locationDetails.timestamp,
          }
        }
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
  async updateDevice(ctx) {
    const { userId, deviceId } = ctx.params;
    const updateData = ctx.request.body;

    try {
      // Find device
      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
        populate: ['user'],
      });

      if (!device) {
        return ctx.notFound('Device not found');
      }

      // Verify device belongs to user
      if (device.user.id !== parseInt(userId)) {
        return ctx.forbidden('Device does not belong to this user');
      }

      // Update device - merge deviceInfo if provided
      const updatedDevice = await strapi.db.query('api::device.device').update({
        where: { id: device.id },
        data: {
          notificationToken: updateData.notificationToken || device.notificationToken,
          deviceInfo: {
            ...(device.deviceInfo || {}),
            ...(updateData.deviceInfo || {}),
            lastSeen: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        },
      });

      ctx.send({
        success: true,
        message: 'Device updated successfully',
        device: updatedDevice,
      });
    } catch (error) {
      console.error('Error updating device:', error);
      ctx.internalServerError('Failed to update device');
    }
  },

  async getUserDevices(ctx) {
    const { userId } = ctx.params;

    try {
      // Verify user exists
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
      });

      if (!user) {
        return ctx.notFound('User not found');
      }

      // Get all devices for user
      const devices = await strapi.db.query('api::device.device').findMany({
        where: { user: userId },
      });

      ctx.send({
        success: true,
        devices: devices || [],
      });
    } catch (error) {
      console.error('Error getting user devices:', error);
      ctx.internalServerError('Failed to get devices');
    }
  },

  async removeDevice(ctx) {
    const { userId, deviceId } = ctx.params;

    try {
      // Find device
      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
        populate: ['user'],
      });

      if (!device) {
        return ctx.notFound('Device not found');
      }

      // Verify device belongs to user
      if (device.user.id !== parseInt(userId)) {
        return ctx.forbidden('Device does not belong to this user');
      }

      // Delete device
      await strapi.db.query('api::device.device').delete({
        where: { id: device.id },
      });

      ctx.send({
        success: true,
        message: 'Device removed successfully',
      });
    } catch (error) {
      console.error('Error removing device:', error);
      ctx.internalServerError('Failed to remove device');
    }
  },

  async checkDevicePermissions(ctx) {
    const { deviceId } = ctx.params;

    try {
      // Find device by deviceId
      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
      });

      if (!device) {
        return ctx.notFound('Device not found');
      }

      // Check if permissions are set and not empty
      const hasPermissions = !!(
        device.deviceInfo?.permissions && 
        Object.keys(device.deviceInfo.permissions).length > 0
      );

      ctx.send({
        permissions: device?.deviceInfo?.permissions,
        success: true,
        hasPermissions,
        deviceId,
      });
    } catch (error) {
      console.error('Error checking device permissions:', error);
      ctx.internalServerError('Failed to check device permissions');
    }
  },

  // ========================
  // ADDITIONAL HELPER METHODS
  // ========================

  async count(ctx) {
    try {
      const sanitizedQuery = await this.sanitizeQuery(ctx);
      
      const count = await strapi.service('api::device.device').count(sanitizedQuery);
      
      return {
        data: {
          count,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error counting devices:', error);
      ctx.internalServerError('Failed to count devices');
    }
  },

  async bulkCreate(ctx) {
    try {
      const { devices } = ctx.request.body;
      
      if (!Array.isArray(devices) || devices.length === 0) {
        return ctx.badRequest('Devices array is required and cannot be empty');
      }

      const createdDevices = [];
      
      for (const deviceData of devices) {
        const sanitizedInput = await this.sanitizeInput(deviceData, ctx);
        
        const entity = await strapi.service('api::device.device').create({
          data: sanitizedInput,
        });
        
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
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return ctx.badRequest('Device IDs array is required and cannot be empty');
      }

      const deletedDevices = [];
      
      for (const id of ids) {
        const entity = await strapi.service('api::device.device').delete(id);
        if (entity) {
          deletedDevices.push(entity);
        }
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
      
      if (!query) {
        return ctx.badRequest('Search query is required');
      }

      const sanitizedQuery = await this.sanitizeQuery(ctx);
      
      const { results, pagination } = await strapi.service('api::device.device').find({
        ...sanitizedQuery,
        filters: {
          [field as string]: {
            $contains: query,
          },
        },
      });

      const sanitizedResults = await this.sanitizeOutput(results, ctx);
      
      return this.transformResponse(sanitizedResults, {
        pagination,
        searchInfo: {
          query,
          field,
          count: results.length,
        },
      });
    } catch (error) {
      console.error('Error searching devices:', error);
      ctx.internalServerError('Failed to search devices');
    }
  },
}));