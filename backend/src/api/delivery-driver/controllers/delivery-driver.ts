// // ============================================================
// // src/api/delivery-driver/controllers/delivery-driver.ts
// // ============================================================

// import { factories } from '@strapi/strapi';
// import socketService from '../../../services/socketService';
// import DeviceService from '../../../services/deviceServices';
// import { disconnect } from 'process';

// export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({

//   // ─── Toggle delivery-driver online/offline ────────────────────────────────
//   async toggleDeliveryDriverOnline(ctx) {
//     try {
//       const userId = ctx.state.user.id;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         select: ['id', 'username', 'isOnline'],
//         populate: {
//           deliveryProfile: { select: ['id', 'isOnline', 'activeVehicleType'] },
//           driverProfile: { select: ['id', 'partnerId'] },
//           riderProfile: { select: ['id'] },
//           conductorProfile: { select: ['id'] },
//         },
//       });

//       if (!user?.deliveryProfile) {
//         return ctx.badRequest('Delivery profile not found');
//       }

//       const newOnlineStatus = !user.deliveryProfile.isOnline;

//       await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: userId },
//         data: {
//           isOnline: newOnlineStatus,
//           activeProfile: newOnlineStatus ? 'delivery' : 'none',
//           profileActivityStatus: {
//             rider: false,
//             driver: false,
//             delivery: newOnlineStatus,
//             conductor: false,
//           },
//           lastSeen: new Date(),
//         },
//       });

//       await strapi.db.query('delivery-profiles.delivery-profile').update({
//         where: { id: user.deliveryProfile.id },
//         data: {
//           isOnline: newOnlineStatus,
//           isAvailable: newOnlineStatus,
//           isActive: true,
//         },
//       });

//       if (user.driverProfile) {
//         await strapi.db.query('driver-profiles.driver-profile').update({
//           where: { id: user.driverProfile.id },
//           data: { isOnline: false, isAvailable: false, isActive: false },
//         });
//       }
//       if (user.riderProfile) {
//         await strapi.db.query('rider-profiles.rider-profile').update({
//           where: { id: user.riderProfile.id },
//           data: { isOnline: false, isAvailable: false, isActive: false },
//         });
//       }
//       if (user.conductorProfile) {
//         await strapi.db.query('conductor-profiles.conductor-profile').update({
//           where: { id: user.conductorProfile.id },
//           data: { isOnline: false, isAvailable: false, isActive: false },
//         });
//       }

//       if (!newOnlineStatus) {
//         try {
//           await DeviceService.sendNotificationToDevice(userId, {
//             type: 'STOP_LOCATION_TRACKING',
//             message: 'You are now offline',
//           });
//         } catch (err) {
//           strapi.log.warn(`[DeliveryDriver] Failed to stop tracking for driver ${userId}:`, err);
//         }
//       } else {
//         try {
//           await DeviceService.requestLocationFromDevice(userId, 'delivery');
//           strapi.log.info(`[DeliveryDriver] Location requested from driver ${userId} after going online`);
//         } catch (err) {
//           strapi.log.warn(`[DeliveryDriver] Failed to request location from driver ${userId}:`, err);
//         }
//       }

//       socketService.emit('driver:status:changed', {
//         driverId: userId,
//         status: newOnlineStatus ? 'online' : 'offline',
//         partnerId: user.driverProfile?.partnerId || null,
//       });

//       return ctx.send({
//         success: true,
//         isOnline: newOnlineStatus,
//         message: `Delivery driver is now ${newOnlineStatus ? 'online' : 'offline'}`,
//         locationRequested: newOnlineStatus,
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] toggleDeliveryDriverOnline error:', error);
//       return ctx.internalServerError('Failed to update delivery driver status');
//     }
//   },

//   async goOffline(ctx) {
//     try {
//       const userId = ctx.state.user.id;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         select: ['id'],
//         populate: {
//           riderProfile: { select: ['id'] },
//           deliveryProfile: { select: ['id'] },
//           conductorProfile: { select: ['id'] },
//           driverProfile: { select: ['id', 'partnerId'] }
//         }
//       });

//       if (!user?.deliveryProfile) {
//         return ctx.badRequest('Driver Delivery profile not found');
//       }

//       // ── User record ──────────────────────────────────────────────────────
//       await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: userId },
//         data: {
//           isOnline: true
//         }
//       });


//       // ── Delivery profile → offline ────────────────────────────────────────
//       if (user.deliveryProfile) {
//         await strapi.db.query('delivery-profiles.delivery-profile').update({
//           where: { id: user.deliveryProfile.id },
//           data: { isOnline: false, isAvailable: false, isActive: false }
//         });
//       }


//       // ── Conductor profile → offline ───────────────────────────────────────
//       if (user.conductorProfile) {
//         await strapi.db.query('conductor-profiles.conductor-profile').update({
//           where: { id: user.conductorProfile.id },
//           data: { isOnline: false, isAvailable: false, isActive: false }
//         });
//       }

//       // ── WebSocket event ───────────────────────────────────────────────────
//       socketService.emit('driver:status:changed', {
//         driverId: userId,
//         status: 'offline',
//         partnerId: user.driverProfile?.partnerId || null,
//       });

//       return ctx.send({
//         success: true,
//         isOnline: false,
//         activeProfile: 'rider',
//         message: 'Driver is now offline. Switched to rider mode.',
//       });

//     } catch (error) {
//       strapi.log.error('Go offline error:', error);
//       return ctx.internalServerError('Failed to go offline');
//     }
//   },

//   // ─── Save delivery vehicle details ────────────────────────────────────────
//   // Sub-component UIDs:
//   //   taxi       → delivery-vehicles.taxi
//   //   motorbike  → delivery-vehicles.motorbike
//   //   motorcycle → delivery-vehicles.motorcycle
//   //   truck      → delivery-vehicles.truck
//   //
//   // Pattern: load the sub-component to get its id, then update it directly
//   // (same way driver-profiles.driver-profile is updated throughout the app).
//   // If the sub-component doesn't exist yet, create the Vehicle record and
//   // update the parent delivery profile to attach it.
//   async handleSaveDeliveryVehicleDetails(ctx) {
//     try {
//       const {
//         driverId,
//         vehicleType,
//         numberPlate,
//         make,
//         model,
//         year,
//         color,
//         seatingCapacity,
//         insuranceExpiryDate,
//       } = ctx.request.body
//       const userId = driverId || ctx.state.user.id;


//       if (!vehicleType) {
//         return ctx.badRequest('vehicleType is required');
//       }

//       const validTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'];
//       if (!validTypes.includes(vehicleType)) {
//         return ctx.badRequest(`vehicleType must be one of: ${validTypes.join(', ')}`);
//       }

//       // ── 1. Load user + delivery profile ────────────────────────────────
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: { deliveryProfile: true },
//       });

//       if (!user?.deliveryProfile) {
//         return ctx.badRequest('Delivery profile not found. Complete onboarding first.');
//       }

//       // ── 2. Load the delivery profile with its sub-component ────────────
//       const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
//         where: { id: user.deliveryProfile.id },
//         populate: {
//           [vehicleType]: { populate: { vehicle: true } },
//         },
//       });

//       if (!deliveryProfile) {
//         return ctx.badRequest('Delivery profile could not be loaded.');
//       }

//       const subComponent = (deliveryProfile as any)[vehicleType];
//       const existingVehicleId = subComponent?.vehicle?.id ?? subComponent?.vehicle ?? null;

//       // ── 3. Create or update the Vehicle record ──────────────────────────
//       let vehicle: any;

//       if (existingVehicleId) {
//         vehicle = await strapi.db.query('api::vehicle.vehicle').update({
//           where: { id: existingVehicleId },
//           data: {
//             numberPlate: (numberPlate ?? '').toUpperCase(),
//             make,
//             model,
//             year: parseInt(year) || new Date().getFullYear(),
//             color,
//             seatingCapacity: parseInt(seatingCapacity) || 2,
//             insuranceExpiryDate: insuranceExpiryDate || null,
//           },
//         });
//       } else {
//         // Normalise: Vehicle collection uses 'motorbike' not 'motorcycle' for motorbike type
//         const vehicleCollectionType = vehicleType === 'motorbike' ? 'motorbike'
//           : vehicleType === 'taxi' ? 'taxi'
//             : vehicleType === 'truck' ? 'truck'
//               : 'motorcycle';

//         vehicle = await strapi.db.query('api::vehicle.vehicle').create({
//           data: {
//             vehicleType: vehicleCollectionType,
//             numberPlate: (numberPlate ?? '').toUpperCase(),
//             make,
//             model,
//             year: parseInt(year) || new Date().getFullYear(),
//             color,
//             seatingCapacity: parseInt(seatingCapacity) || 2,
//             insuranceExpiryDate: insuranceExpiryDate || null,
//             verificationStatus: 'pending',
//             assignedDriver: userId
//           },
//         });
//       }

//       // ── 4. Update the sub-component directly by its own UID ────────────
//       //
//       // The sub-component already has a row — get its id and update it
//       // directly, exactly like driver-profiles.driver-profile is updated
//       // elsewhere. No need to touch the parent entity.
//       if (subComponent?.id) {
//         await strapi.db.query(`delivery-vehicles.${vehicleType}`).update({
//           where: { id: subComponent.id },
//           data: {
//             vehicle: vehicle.id,
//             isActive: true,
//           },
//         });
//       } else {
//         // Sub-component row doesn't exist yet — update the parent delivery
//         // profile to create it. This only happens on first-time setup.
//         await strapi.db.query('delivery-profiles.delivery-profile').update({
//           where: { id: (deliveryProfile as any).id },
//           data: {
//             [vehicleType]: { vehicle: vehicle.id, isActive: true },
//           },
//         });
//       }

//       const checkIfVehicleExistsAndUserHasInitialFloatToppedUp = async () => {
//         const vehicleNumberPlate = vehicle?.numberPlate.toLowerCase()
//         const capitalize = (text: String) => text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '';

//         if (!vehicle) {
//           return false
//         }
//         let existingVehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
//           where: { numberPlate: vehicleNumberPlate },
//           populate: { assignedDriver: true }
//         })
//         if (!existingVehicle) { // try checking toLowerCase
//           existingVehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
//             where: { numberPlate: capitalize(vehicleNumberPlate) },
//             populate: { assignedDriver: true }
//           })
//         }
//         if (!existingVehicle) { // try checking toUpperCase
//           existingVehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
//             where: { numberPlate: vehicleNumberPlate.toUpperCase() },
//             populate: { assignedDriver: true }
//           })
//         }

//         if (existingVehicle?.assignedDriver) {
//           if (existingVehicle?.assignedDriver?.initialFloatToppedUp) { // means an account exists which already has float topped up
//             return true
//           }
//         }
//         return false
//       }

//       // Always keep activeVehicleType in sync on the delivery profile
//       await strapi.db.query('delivery-profiles.delivery-profile').update({
//         where: { id: (deliveryProfile as any).id },
//         data: { activeVehicleType: vehicleType },
//       });

//       if (checkIfVehicleExistsAndUserHasInitialFloatToppedUp) { // to avoid a user getting free float topups twice
//         await strapi.db.query('plugin::users-permissions.user').update({
//           where: { id: userId },
//           data: {
//             initialFloatToppedUp: true
//           }
//         })
//       }

//       // ── 5. Return ───────────────────────────────────────────────────────
//       return ctx.send({
//         success: true,
//         hasVehicle: true,
//         vehicle: {
//           id: vehicle.id,
//           vehicleType: vehicle.vehicleType,
//           numberPlate: vehicle.numberPlate,
//           make: vehicle.make,
//           model: vehicle.model,
//           year: vehicle.year,
//           color: vehicle.color,
//           seatingCapacity: vehicle.seatingCapacity,
//           insuranceExpiryDate: vehicle.insuranceExpiryDate,
//           verificationStatus: vehicle.verificationStatus,
//         },
//       });

//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] handleSaveDeliveryVehicleDetails error:', error);
//       return ctx.internalServerError(error?.message ?? 'Failed to save delivery vehicle details');
//     }
//   },

//   // ─── Update delivery driver location ─────────────────────────────────────
//   async updateDeliveryLocation(ctx) {
//     try {
//       const userId = ctx.state.user.id;
//       const { lat, lng, heading, speed } = ctx.request.body;

//       if (!lat || !lng) return ctx.badRequest('Location coordinates required');

//       const location = { lat, lng, heading, speed };

//       await strapi.db.query('plugin::users-permissions.user').update({
//         where: { id: userId },
//         data: { currentLocation: location, lastSeen: new Date() },
//       });

//       strapi.eventHub.emit('delivery-driver:location:update', { driverId: userId, location });

//       return ctx.send({ success: true, location, timestamp: new Date() });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] updateDeliveryLocation error:', error);
//       return ctx.internalServerError('Failed to update location');
//     }
//   },

//   // ─── Delivery stats ───────────────────────────────────────────────────────
//   async getDeliveryStats(ctx) {
//     try {
//       const userId = ctx.state.user.id;
//       const { period = 'today' } = ctx.query;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: { deliveryProfile: true },
//       });

//       if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');

//       const now = new Date();
//       let startDate = new Date();
//       switch (period) {
//         case 'today': startDate.setHours(0, 0, 0, 0); break;
//         case 'week': startDate.setDate(now.getDate() - 7); break;
//         case 'month': startDate.setMonth(now.getMonth() - 1); break;
//         case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
//       }

//       const deliveries = await strapi.db.query('api::delivery.delivery').findMany({
//         where: { deliverer: userId, createdAt: { $gte: startDate } },
//       });

//       const completed = deliveries.filter((d) => d.rideStatus === 'completed');
//       const cancelled = deliveries.filter((d) => d.rideStatus === 'cancelled');
//       const earnings = completed.reduce((s, d) => s + (d.driverEarnings || 0), 0);
//       const distance = completed.reduce((s, d) => s + (d.actualDistance || 0), 0);
//       const duration = completed.reduce((s, d) => s + (d.actualDuration || 0), 0);

//       return ctx.send({
//         period,
//         stats: {
//           totalDeliveries: deliveries.length,
//           completedDeliveries: completed.length,
//           cancelledDeliveries: cancelled.length,
//           earnings: parseFloat(earnings.toFixed(2)),
//           totalDistance: parseFloat(distance.toFixed(2)),
//           totalDuration: duration,
//           averageRating: user.deliveryProfile.averageRating || 0,
//         },
//         allTime: {
//           totalDeliveries: user.deliveryProfile.totalDeliveries || 0,
//           completedDeliveries: user.deliveryProfile.completedDeliveries || 0,
//           totalEarnings: user.deliveryProfile.totalEarnings || 0,
//           currentBalance: user.deliveryProfile.currentBalance || 0,
//         },
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] getDeliveryStats error:', error);
//       return ctx.internalServerError('Failed to get delivery stats');
//     }
//   },

//   // ─── Delivery earnings ────────────────────────────────────────────────────
//   async getDeliveryEarnings(ctx) {
//     try {
//       const userId = ctx.state.user.id;
//       const { period = 'week', startDate, endDate } = ctx.query;

//       let start = new Date();
//       let end = new Date();

//       if (startDate && endDate) {
//         start = new Date(startDate as string);
//         end = new Date(endDate as string);
//       } else {
//         switch (period) {
//           case 'today': start.setHours(0, 0, 0, 0); break;
//           case 'week': start.setDate(start.getDate() - 7); break;
//           case 'month': start.setMonth(start.getMonth() - 1); break;
//           case 'year': start.setFullYear(start.getFullYear() - 1); break;
//         }
//       }

//       const deliveries = await strapi.db.query('api::delivery.delivery').findMany({
//         where: {
//           deliverer: userId,
//           rideStatus: 'completed',
//           tripCompletedAt: { $gte: start, $lte: end },
//         },
//       });

//       const totalEarnings = deliveries.reduce((s, d) => s + (d.driverEarnings || 0), 0);
//       const totalFares = deliveries.reduce((s, d) => s + (d.totalFare || 0), 0);
//       const totalCommission = deliveries.reduce((s, d) => s + (d.commission || 0), 0);
//       const cashDeliveries = deliveries.filter((d) => d.paymentMethod === 'cash');
//       const okrapayDeliveries = deliveries.filter((d) => d.paymentMethod === 'okrapay');

//       return ctx.send({
//         period: { start, end },
//         summary: {
//           totalEarnings: parseFloat(totalEarnings.toFixed(2)),
//           totalFares: parseFloat(totalFares.toFixed(2)),
//           totalCommission: parseFloat(totalCommission.toFixed(2)),
//           deliveriesCompleted: deliveries.length,
//           cashEarnings: cashDeliveries.reduce((s, d) => s + (d.driverEarnings || 0), 0),
//           okrapayEarnings: okrapayDeliveries.reduce((s, d) => s + (d.driverEarnings || 0), 0),
//         },
//         deliveries: deliveries.map((d) => ({
//           rideCode: d.rideCode,
//           date: d.tripCompletedAt,
//           fare: d.totalFare,
//           commission: d.commission,
//           earnings: d.driverEarnings,
//           paymentMethod: d.paymentMethod,
//         })),
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] getDeliveryEarnings error:', error);
//       return ctx.internalServerError('Failed to get delivery earnings');
//     }
//   },

//   // ─── Delivery earnings breakdown ──────────────────────────────────────────
//   async getDeliveryEarningsBreakdown(ctx) {
//     try {
//       const userId = ctx.state.user.id;
//       const { period = 'month' } = ctx.query;

//       const now = new Date();
//       let startDate = new Date();
//       switch (period) {
//         case 'week': startDate.setDate(now.getDate() - 7); break;
//         case 'month': startDate.setMonth(now.getMonth() - 1); break;
//         case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
//       }

//       const deliveries = await strapi.db.query('api::delivery.delivery').findMany({
//         where: {
//           deliverer: userId,
//           rideStatus: 'completed',
//           tripCompletedAt: { $gte: startDate },
//         },
//       });

//       const dailyBreakdown: Record<string, any> = {};
//       deliveries.forEach((d) => {
//         const date = new Date(d.tripCompletedAt).toISOString().split('T')[0];
//         if (!dailyBreakdown[date]) dailyBreakdown[date] = { earnings: 0, deliveries: 0, commission: 0 };
//         dailyBreakdown[date].earnings += d.driverEarnings || 0;
//         dailyBreakdown[date].deliveries += 1;
//         dailyBreakdown[date].commission += d.commission || 0;
//       });

//       return ctx.send({
//         period,
//         dailyBreakdown,
//         total: {
//           earnings: deliveries.reduce((s, d) => s + (d.driverEarnings || 0), 0),
//           commission: deliveries.reduce((s, d) => s + (d.commission || 0), 0),
//           deliveries: deliveries.length,
//         },
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] getDeliveryEarningsBreakdown error:', error);
//       return ctx.internalServerError('Failed to get earnings breakdown');
//     }
//   },

//   // ─── Onboarding: save delivery vehicle type ───────────────────────────────
//   async saveDeliveryVehicleType(ctx) {
//     try {
//       const { vehicleType, driverId } = ctx.request.body;
//       const userId = driverId || ctx.state.user.id;

//       const validTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'];
//       if (!validTypes.includes(vehicleType)) {
//         return ctx.badRequest(`vehicleType must be one of: ${validTypes.join(', ')}`);
//       }

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: { deliveryProfile: true },
//       });

//       if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');
//       // Load all sub-components to get their ids for direct updates
//       const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
//         where: { id: user.deliveryProfile.id },
//         populate: {
//           taxi: {
//             populate: true // Populate all relations inside taxiDriver
//           },
//           motorbike: {
//             populate: true // Populate all relations inside busDriver
//           },
//           motorcycle: {
//             populate: true // Populate all relations inside motorbikeRider
//           },
//           truck: {
//             populate: true // Populate all relations inside motorbikeRider
//           }
//         }
//       })

//       const allTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'];

//       // Activate the chosen sub-component directly
//       const chosen = (deliveryProfile as any)[vehicleType];
//       if (chosen?.id) {
//         await strapi.db.query(`delivery-vehicles.${vehicleType}`).update({
//           where: { id: chosen.id },
//           data: { isActive: true },
//         })
//       }
//       else {
//         const vehicleTypeEntry = await strapi.db.query(`delivery-vehicles.${vehicleType}`).create({
//           data: { isActive: true }
//         })
//         await strapi.db.query('delivery-profiles.delivery-profile').update({
//           where: { id: user.deliveryProfile.id },
//           data: {
//             [vehicleType]: vehicleTypeEntry
//           },
//         })
//       }

//       // Deactivate all other sub-components directly
//       for (const t of allTypes.filter((t) => t !== vehicleType)) {
//         const other = (deliveryProfile as any)[t];
//         if (other?.id) {
//           await strapi.db.query(`delivery-vehicles.${t}`).update({
//             where: { id: other.id },
//             data: { isActive: false },
//           });
//         }
//       }

//       // Update activeVehicleType on the delivery profile
//       await strapi.db.query('delivery-profiles.delivery-profile').update({
//         where: { id: user.deliveryProfile.id },
//         data: { activeVehicleType: vehicleType },
//       });

//       return ctx.send({
//         success: true,
//         message: 'Delivery vehicle type saved',
//         nextStep: 'vehicle-details',
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] saveDeliveryVehicleType error:', error);
//       return ctx.internalServerError('Failed to save delivery vehicle type');
//     }
//   },

//   // ─── Onboarding: save delivery vehicle details (initial creation path) ────
//   async saveDeliveryVehicleDetails(ctx) {
//     try {
//       const {
//         driverId, make, model, year, numberPlate, color,
//         vehicleType, seatingCapacity, insuranceExpiryDate,
//         maxPackageWeight,
//       } = ctx.request.body;
//       const userId = driverId || ctx.state.user.id;


//       const validTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'];
//       if (!validTypes.includes(vehicleType)) {
//         return ctx.badRequest(`vehicleType must be one of: ${validTypes.join(', ')}`);
//       }

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: { deliveryProfile: true },
//       })

//       if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');

//       const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
//         where: { id: user.deliveryProfile.id },
//         populate: { [vehicleType]: { populate: { vehicle: true } } },
//       })

//       const vehicleCollectionType = (() => {
//         if (vehicleType === 'taxi') return 'taxi';
//         if (vehicleType === 'truck') return 'truck';
//         if (vehicleType === 'motorbike') return 'motorbike';
//         return 'motorcycle';
//       })();
//       let deliveryClasses = await strapi.db.query('api::ride-class.ride-class').findMany()
//       if (vehicleType === 'motorbike' || vehicleType === 'motorcycle' || vehicleType === 'motorbike') {
//         const allowedClasses = ['standard', 'midsize']
//         deliveryClasses = deliveryClasses.filter((deliclass) => allowedClasses.includes(deliclass.name))
//       }
//       if (vehicleType === 'taxi') {
//         const allowedClasses = ['standard', 'midsize', 'big']
//         deliveryClasses = deliveryClasses.filter((deliclass) => allowedClasses.includes(deliclass.name))
//       }
//       if (vehicleType === 'truck') {
//         const allowedClasses = ['big', 'large']
//         deliveryClasses = deliveryClasses.filter((deliclass) => allowedClasses.includes(deliclass.name))
//       }
//       const newVehicle = await strapi.db.query('api::vehicle.vehicle').create({
//         data: {
//           make,
//           model,
//           year,
//           numberPlate,
//           color,
//           vehicleType: vehicleCollectionType,
//           seatingCapacity: seatingCapacity || null,
//           insuranceExpiryDate: insuranceExpiryDate || null,
//           isActive: true,
//           deliveryClasses: { connect: deliveryClasses.map(rc => rc.id) },
//           assignedDriver: userId
//         },
//       });

//       const subComponent = (deliveryProfile as any)[vehicleType];

//       if (subComponent?.id) {
//         // Sub-component row exists — update it directly
//         await strapi.db.query(`delivery-vehicles.${vehicleType}`).update({
//           where: { id: subComponent.id },
//           data: {
//             vehicle: newVehicle.id,
//             isActive: true,
//             ...(maxPackageWeight != null ? { maxPackageWeight } : {}),
//           },
//         });
//       } else {
//         // First time — create via parent
//         await strapi.db.query('delivery-profiles.delivery-profile').update({
//           where: { id: user.deliveryProfile.id },
//           data: {
//             [vehicleType]: {
//               vehicle: newVehicle.id,
//               isActive: true,
//               ...(maxPackageWeight != null ? { maxPackageWeight } : {}),
//             },
//           },
//         });
//       }

//       await strapi.db.query('delivery-profiles.delivery-profile').update({
//         where: { id: user.deliveryProfile.id },
//         data: { activeVehicleType: vehicleType, acceptedDeliveryClasses: { connect: deliveryClasses.map(rc => rc.id) } },
//       });

//       return ctx.send({
//         success: true,
//         message: 'Delivery vehicle details saved',
//         nextStep: 'review',
//         vehicle: newVehicle,
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] saveDeliveryVehicleDetails error:', error);
//       return ctx.internalServerError('Failed to save delivery vehicle details');
//     }
//   },
//   async assignVehicle(ctx) {

//     // ============================================================
//     // FIXED: assignVehicle — src/api/delivery-driver/controllers/delivery-driver.ts
//     // ============================================================
//     //
//     // Bugs fixed:
//     //   1. Sub-component (taxi / motorbike / motorcycle / truck) may not exist
//     //      yet for a freshly-registered delivery driver. The original code handled
//     //      the "create via parent" branch, but only AFTER step 7, which could throw
//     //      and abort the entire function before it had a chance to run.
//     //
//     //   2. Step 7 (cleanup) called `disconnect: [vehicle?.assignedDriver?.id]`.
//     //      When assignedDriver is null, this becomes `disconnect: [undefined]`,
//     //      which throws an unhandled exception. The outer catch then returns 500,
//     //      so the client sees "failed" even though steps 4-6 already succeeded.
//     //      The vehicle WAS attached to the sub-component, but the API told the
//     //      client it wasn't. Fix: wrap all cleanup in a try-catch; guard the
//     //      disconnect call against null.
//     //
//     //   3. When the vehicle was previously assigned to a RIDE driver (via
//     //      vehicle.assignedDriver), that driver's driverProfile.assignedVehicle
//     //      was never cleared.
//     //      Fix: after nulling vehicle.assignedDriver, find the previous driver
//     //      and clear their assignedVehicle.
//     //
//     //   4. For delivery drivers the ownership link is
//     //      deliveryProfile.[vehicleType].vehicle, NOT vehicle.assignedDriver.
//     //      We still clear vehicle.assignedDriver if a ride-driver had been using
//     //      it (to prevent dual ownership confusion), but we do NOT set it to the
//     //      new delivery driver — that is intentional.

//     try {
//       const { driverId, vehicleId } = ctx.request.body;
//       const userId = driverId || ctx.state.user.id;

//       if (!vehicleId) {
//         return ctx.badRequest('vehicleId is required');
//       }

//       // ── 1. Fetch vehicle ────────────────────────────────────────────────
//       const vehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
//         where: { id: vehicleId },
//         populate: { assignedDriver: { select: ['id'] } },
//       });

//       if (!vehicle) {
//         return ctx.notFound('Vehicle not found');
//       }

//       const validDeliveryTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'] as const;
//       type DeliveryVehicleType = typeof validDeliveryTypes[number];
//       const vehicleType = vehicle.vehicleType as DeliveryVehicleType;

//       if (!validDeliveryTypes.includes(vehicleType)) {
//         return ctx.badRequest(
//           `Vehicle type "${vehicleType}" cannot be assigned to a delivery profile. ` +
//           `Must be one of: ${validDeliveryTypes.join(', ')}`
//         );
//       }

//       // ── 2. Load user + delivery profile ─────────────────────────────────
//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: { deliveryProfile: true },
//       });

//       if (!user?.deliveryProfile) {
//         return ctx.badRequest('Delivery profile not found');
//       }

//       // ── 3. Load delivery profile with all sub-components ─────────────────
//       const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
//         where: { id: user.deliveryProfile.id },
//         populate: {
//           taxi: { populate: { vehicle: true } },
//           motorbike: { populate: { vehicle: true } },
//           motorcycle: { populate: { vehicle: true } },
//           truck: { populate: { vehicle: true } },
//         },
//       }) as any;

//       if (!deliveryProfile) {
//         return ctx.badRequest('Delivery profile could not be loaded');
//       }

//       // ── 4. Activate chosen sub-component and attach the vehicle ──────────
//       //
//       // If the sub-component row already exists → update it directly via its
//       // own component UID (fastest path, mirrors handleSaveDeliveryVehicleDetails).
//       // If it doesn't exist yet → let Strapi create it through the parent
//       // profile update (same fallback used in saveDeliveryVehicleDetails).
//       const chosenSub = deliveryProfile[vehicleType];
//       if (chosenSub?.id) {
//         await strapi.db.query(`delivery-vehicles.${vehicleType}`).update({
//           where: { id: chosenSub.id },
//           data: { vehicle: vehicleId, isActive: true },
//         });
//       } else {
//         // Sub-component row doesn't exist yet — create it via the parent profile.
//         await strapi.db.query('delivery-profiles.delivery-profile').update({
//           where: { id: deliveryProfile.id },
//           data: { [vehicleType]: { vehicle: vehicleId, isActive: true } },
//         });
//       }

//       // ── 5. Deactivate all other sub-components ────────────────────────────
//       for (const t of validDeliveryTypes.filter(t => t !== vehicleType)) {
//         const other = deliveryProfile[t];
//         if (other?.id) {
//           await strapi.db.query(`delivery-vehicles.${t}`).update({
//             where: { id: other.id },
//             data: { isActive: false },
//           });
//         }
//       }

//       // ── 6. Sync activeVehicleType on the delivery profile ─────────────────
//       await strapi.db.query('delivery-profiles.delivery-profile').update({
//         where: { id: deliveryProfile.id },
//         data: { activeVehicleType: vehicleType },
//       })
//       // add this driver to the vehicle as assigned driver
//       await strapi.db.query('api::vehicle.vehicle').update({
//         where: { id: vehicleId },
//         data: { assignedDriver: userId },
//       })

//       // ── 7. Previous-driver cleanup (non-fatal) ────────────────────────────
//       //
//       // For delivery drivers, vehicle.assignedDriver is NOT used to track
//       // which delivery driver is using the vehicle — that link lives in
//       // deliveryProfile.[vehicleType].vehicle (updated in step 4).
//       //
//       // However, if a RIDE driver previously had this vehicle assigned to them
//       // (via vehicle.assignedDriver → their driverProfile.assignedVehicle),
//       // we must clear both sides to prevent dual-ownership.
//       //
//       // This entire block is wrapped in try-catch so that any cleanup failure
//       // never rolls back the successful assignment above.
//       // try {
//       //   const previousDriverId = vehicle.assignedDriver?.id;
//       //   if (previousDriverId) {
//       //     // Clear vehicle.assignedDriver


//       //     // Clear driverProfile.assignedVehicle on the previous ride-driver
//       //     const prevUser = await strapi.db.query('plugin::users-permissions.user').findOne({
//       //       where: { id: previousDriverId },
//       //       populate: { driverProfile: { select: ['id'] } },
//       //     });
//       //     if (prevUser?.driverProfile?.id) {
//       //       await strapi.db.query('driver-profiles.driver-profile').update({
//       //         where: { id: prevUser.driverProfile.id },
//       //         data: { assignedVehicle: null },
//       //       });
//       //       strapi.log.info(
//       //         `[DeliveryDriver assignVehicle] Cleared assignedVehicle from ` +
//       //         `previous ride-driver ${previousDriverId}`
//       //       );
//       //     }
//       //   }
//       // } catch (cleanupErr) {
//       //   // Non-fatal — the vehicle has already been attached to the delivery
//       //   // driver's sub-component. Log and continue.
//       //   strapi.log.warn(
//       //     '[DeliveryDriver assignVehicle] Previous-driver cleanup failed (non-fatal):',
//       //     cleanupErr
//       //   );
//       // }

//       return ctx.send({
//         success: true,
//         message: 'Vehicle assigned successfully',
//         activeVehicleType: vehicleType,
//         vehicle: {
//           id: vehicle.id,
//           vehicleType: vehicle.vehicleType,
//           numberPlate: vehicle.numberPlate,
//           make: vehicle.make,
//           model: vehicle.model,
//           insuranceExpiryDate: vehicle.insuranceExpiryDate,
//         },
//       });

//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] assignVehicle error:', error);
//       return ctx.internalServerError('Failed to assign vehicle');
//     }
//   },
//   // ─── Onboarding: submit for verification ─────────────────────────────────
//   async submitDeliveryForVerification(ctx) {
//     try {
//       const { driverId } = ctx.request.body;
//       const userId = driverId || ctx.state.user.id;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: { driverProfile: true, deliveryProfile: true },
//       })


//       if (!user?.driverProfile) return ctx.badRequest('Driver profile is incomplete');
//       if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');
//       if (user.driverProfile.verificationStatus === 'pending') {
//         return ctx.badRequest('Verification request already sent');
//       }
//       const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
//         where: { id: user.deliveryProfile.id },
//         populate: {
//           taxi: { populate: { vehicle: true } },
//           motorbike: { populate: { vehicle: true } },
//           motorcycle: { populate: { vehicle: true } },
//           truck: { populate: { vehicle: true } },
//         },
//       });

//       const activeType = (deliveryProfile as any)?.activeVehicleType;
//       if (!activeType || activeType === 'none' || !(deliveryProfile as any)[activeType]?.vehicle) {
//         return ctx.badRequest('Please complete delivery vehicle setup before submitting');
//       }
//       const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});

//       const initialDelivererFloat = () => {
//         if (user.initialFloatToppedUp) { // you have already been given the float top up
//           return user.driverProfile?.floatBalance
//         } // initialFloatToppedUp instead of initialDelivererFloatToppedUp because a user can act clever and create a delivery account just to use the free float in a driver account
//         return settings?.initialDelivererFloat || 0
//       }
//       await strapi.db.query('driver-profiles.driver-profile').update({
//         where: { id: user.driverProfile.id },
//         data: {
//           verificationStatus: driverId || settings?.autoApproveDeliverers ? 'approved' : 'pending',
//           floatBalance: initialDelivererFloat(), // add initial float to driver account based on how much float we are creating for free on account creation
//         },
//       })

//       await strapi.db.query('delivery-profiles.delivery-profile').update({
//         where: { id: user.deliveryProfile.id },
//         data: { verificationStatus: settings?.autoApproveDeliverers ? 'approved' : 'pending' },
//       })
//       await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: { initialFloatToppedUp: true }
//       })

//       try {
//         const emailList = await strapi.db.query('api::email-addresses-list.email-addresses-list').findOne({
//           where: { id: 1 },
//         });
//         let adminEmailMessage = settings?.autoApproveDeliverers ? 'A delivery driver has been outo approved on OkraRides. Driver ID: ' + userId : 'A delivery driver is looking for verification on OkraRides. User ID: ' + userId
//         if (driverId) {
//           adminEmailMessage = 'A delivery driver has been registered by a partner on OkraRides. Driver ID: ' + ctx.state.user.id
//         }
//         (emailList?.adminEmailAddresses || []).forEach((email: string) => {
//           const { SendEmailNotification } = require('../../../services/messages');
//           SendEmailNotification(
//             email,
//             adminEmailMessage
//           )
//         });
//       } catch (e) {
//         strapi.log.warn('[DeliveryDriver] Admin email notification failed:', e);
//       }

//       socketService.emitNotification(userId, 'delivery', {
//         type: 'account_update',
//         title: 'Verification Submitted',
//         body: 'Your application has been submitted for review. We will notify you once verification is complete.',
//         data: { verificationStatus: 'pending' },
//       });

//       return ctx.send({ success: true, message: 'Application submitted successfully' });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] submitDeliveryForVerification error:', error);
//       return ctx.internalServerError('Failed to submit application');
//     }
//   },

//   // ─── Onboarding status ────────────────────────────────────────────────────
//   async getDeliveryOnboardingStatus(ctx) {
//     try {
//       const userId = ctx.state.user.id;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: {
//           driverProfile: true,
//           deliveryProfile: {
//             populate: {
//               taxi: true,
//               motorbike: true,
//               motorcycle: true,
//               truck: true,
//             },
//           },
//         },
//       });

//       const dp = (user?.driverProfile || {}) as any;
//       const dlp = (user?.deliveryProfile || {}) as any;
//       const activeType = dlp.activeVehicleType;
//       const hasVehicle = activeType && activeType !== 'none' && dlp[activeType]?.vehicle;

//       return ctx.send({
//         isDriverProfileCreated: !!user?.driverProfile,
//         isDeliveryProfileCreated: !!user?.deliveryProfile,
//         onboardingStatus: dp.verificationStatus || dlp.verificationStatus || 'not_started',
//         currentStep: dp.onboardingStep || 'license',
//         steps: {
//           license: !!dp.driverLicenseNumber,
//           nationalId: !!dp.nationalIdNumber,
//           address: !!dp.proofOfAddress,
//           deliveryVehicle: !!hasVehicle,
//         },
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] getDeliveryOnboardingStatus error:', error);
//       return ctx.internalServerError('Failed to fetch onboarding status');
//     }
//   },

//   // ─── Find assigned delivery vehicle ──────────────────────────────────────
//   async findDeliveryVehicle(ctx) {
//     try {
//       const userId = ctx.state.user.id;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: { deliveryProfile: true },
//       });

//       if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');

//       const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
//         where: { id: user.deliveryProfile.id },
//         populate: {
//           taxi: { populate: { vehicle: true } },
//           motorbike: { populate: { vehicle: true } },
//           motorcycle: { populate: { vehicle: true } },
//           truck: { populate: { vehicle: true } },
//         },
//       });

//       const activeType = (deliveryProfile as any)?.activeVehicleType;
//       const vehicle = activeType && activeType !== 'none'
//         ? (deliveryProfile as any)[activeType]?.vehicle
//         : null;

//       return ctx.send({
//         success: true,
//         hasVehicle: !!vehicle,
//         activeVehicleType: activeType,
//         vehicle,
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] findDeliveryVehicle error:', error);
//       return ctx.internalServerError('Failed to get delivery vehicle');
//     }
//   },

//   // ─── Payment phone numbers ────────────────────────────────────────────────
//   async getPaymentPhoneNumbers(ctx) {
//     try {
//       const userId = ctx.state.user.id;

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: {
//           driverProfile: { select: ['id', 'paymentPhoneNumbers'] },
//           country: { select: ['id', 'phoneCode', 'acceptedMobileMoneyPayments'] },
//         },
//       });

//       if (!user?.driverProfile) return ctx.badRequest('Driver profile not found');

//       return ctx.send({
//         paymentPhoneNumbers: user.driverProfile.paymentPhoneNumbers || [],
//         acceptedMobileMoneyPayments: user.country?.acceptedMobileMoneyPayments || [],
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] getPaymentPhoneNumbers error:', error);
//       return ctx.internalServerError('Failed to fetch payment phone numbers');
//     }
//   },

//   async savePaymentPhoneNumbers(ctx) {
//     try {
//       const userId = ctx.state.user.id;
//       const { paymentPhoneNumbers } = ctx.request.body;

//       if (!Array.isArray(paymentPhoneNumbers)) {
//         return ctx.badRequest('paymentPhoneNumbers must be an array');
//       }

//       const user = await strapi.db.query('plugin::users-permissions.user').findOne({
//         where: { id: userId },
//         populate: {
//           driverProfile: { select: ['id', 'paymentPhoneNumbers'] },
//           country: { select: ['id', 'phoneCode', 'acceptedMobileMoneyPayments'] },
//         },
//       });

//       if (!user?.driverProfile) return ctx.badRequest('Driver profile not found');

//       const acceptedTypes: string[] = (
//         user.country?.acceptedMobileMoneyPayments || []
//       ).map((t: string) => t.toLowerCase());

//       for (let i = 0; i < paymentPhoneNumbers.length; i++) {
//         const entry = paymentPhoneNumbers[i];
//         if (!entry.mobileNumber || !entry.mobileType || !entry.name) {
//           return ctx.badRequest(
//             `Entry at index ${i} is missing required fields (mobileNumber, mobileType, name)`
//           );
//         }
//         if (
//           acceptedTypes.length > 0 &&
//           !acceptedTypes.includes(entry.mobileType.toLowerCase())
//         ) {
//           return ctx.badRequest(
//             `Entry at index ${i}: mobileType "${entry.mobileType}" is not accepted in your country. ` +
//             `Accepted: ${acceptedTypes.join(', ')}`
//           );
//         }
//       }

//       const normalised = paymentPhoneNumbers.map((e: any) => ({
//         mobileNumber: e.mobileNumber.replace(/\s/g, ''),
//         mobileType: e.mobileType.toLowerCase(),
//         name: e.name.trim(),
//       }));

//       await strapi.db.query('driver-profiles.driver-profile').update({
//         where: { id: user.driverProfile.id },
//         data: { paymentPhoneNumbers: normalised },
//       });

//       return ctx.send({
//         success: true,
//         message: 'Payment phone numbers updated successfully',
//         paymentPhoneNumbers: normalised,
//       });
//     } catch (error) {
//       strapi.log.error('[DeliveryDriver] savePaymentPhoneNumbers error:', error);
//       return ctx.internalServerError('Failed to save payment phone numbers');
//     }
//   },
// }));
// ============================================================
// src/api/delivery-driver/controllers/delivery-driver.ts
// ============================================================

import { factories } from '@strapi/strapi';
import socketService from '../../../services/socketService';
import DeviceService from '../../../services/deviceServices';
import { disconnect } from 'process';

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({

  // ─── Toggle delivery-driver online/offline ────────────────────────────────
  async toggleDeliveryDriverOnline(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['id', 'username', 'isOnline'],
        populate: {
          deliveryProfile: { select: ['id', 'isOnline', 'activeVehicleType'] },
          driverProfile: { select: ['id', 'partnerId'] },
          riderProfile: { select: ['id'] },
          conductorProfile: { select: ['id'] },
        },
      });

      if (!user?.deliveryProfile) {
        return ctx.badRequest('Delivery profile not found');
      }

      const newOnlineStatus = !user.deliveryProfile.isOnline;

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          isOnline: newOnlineStatus,
          activeProfile: newOnlineStatus ? 'delivery' : 'none',
          profileActivityStatus: {
            rider: false,
            driver: false,
            delivery: newOnlineStatus,
            conductor: false,
          },
          lastSeen: new Date(),
        },
      });

      await strapi.db.query('delivery-profiles.delivery-profile').update({
        where: { id: user.deliveryProfile.id },
        data: {
          isOnline: newOnlineStatus,
          isAvailable: newOnlineStatus,
          isActive: true,
        },
      });

      if (user.driverProfile) {
        await strapi.db.query('driver-profiles.driver-profile').update({
          where: { id: user.driverProfile.id },
          data: { isOnline: false, isAvailable: false, isActive: false },
        });
      }
      if (user.riderProfile) {
        await strapi.db.query('rider-profiles.rider-profile').update({
          where: { id: user.riderProfile.id },
          data: { isOnline: false, isAvailable: false, isActive: false },
        });
      }
      if (user.conductorProfile) {
        await strapi.db.query('conductor-profiles.conductor-profile').update({
          where: { id: user.conductorProfile.id },
          data: { isOnline: false, isAvailable: false, isActive: false },
        });
      }

      if (!newOnlineStatus) {
        try {
          await DeviceService.sendNotificationToDevice(userId, {
            type: 'STOP_LOCATION_TRACKING',
            message: 'You are now offline',
          });
        } catch (err) {
          strapi.log.warn(`[DeliveryDriver] Failed to stop tracking for driver ${userId}:`, err);
        }
      } else {
        try {
          await DeviceService.requestLocationFromDevice(userId, 'delivery');
          strapi.log.info(`[DeliveryDriver] Location requested from driver ${userId} after going online`);
        } catch (err) {
          strapi.log.warn(`[DeliveryDriver] Failed to request location from driver ${userId}:`, err);
        }
      }

      socketService.emit('driver:status:changed', {
        driverId: userId,
        status: newOnlineStatus ? 'online' : 'offline',
        partnerId: user.driverProfile?.partnerId || null,
      });

      return ctx.send({
        success: true,
        isOnline: newOnlineStatus,
        message: `Delivery driver is now ${newOnlineStatus ? 'online' : 'offline'}`,
        locationRequested: newOnlineStatus,
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] toggleDeliveryDriverOnline error:', error);
      return ctx.internalServerError('Failed to update delivery driver status');
    }
  },

  async goOffline(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['id'],
        populate: {
          riderProfile: { select: ['id'] },
          deliveryProfile: { select: ['id'] },
          conductorProfile: { select: ['id'] },
          driverProfile: { select: ['id', 'partnerId'] }
        }
      });

      if (!user?.deliveryProfile) {
        return ctx.badRequest('Driver Delivery profile not found');
      }

      // ── User record ──────────────────────────────────────────────────────
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          isOnline: true
        }
      });

      // ── Delivery profile → offline ────────────────────────────────────────
      if (user.deliveryProfile) {
        await strapi.db.query('delivery-profiles.delivery-profile').update({
          where: { id: user.deliveryProfile.id },
          data: { isOnline: false, isAvailable: false, isActive: false }
        });
      }

      // ── Conductor profile → offline ───────────────────────────────────────
      if (user.conductorProfile) {
        await strapi.db.query('conductor-profiles.conductor-profile').update({
          where: { id: user.conductorProfile.id },
          data: { isOnline: false, isAvailable: false, isActive: false }
        });
      }

      // ── WebSocket event ───────────────────────────────────────────────────
      socketService.emit('driver:status:changed', {
        driverId: userId,
        status: 'offline',
        partnerId: user.driverProfile?.partnerId || null,
      });

      return ctx.send({
        success: true,
        isOnline: false,
        activeProfile: 'rider',
        message: 'Driver is now offline. Switched to rider mode.',
      });

    } catch (error) {
      strapi.log.error('Go offline error:', error);
      return ctx.internalServerError('Failed to go offline');
    }
  },

  // ─── Save delivery vehicle details (edit/update path) ────────────────────
  async handleSaveDeliveryVehicleDetails(ctx) {
    try {
      const {
        driverId,
        vehicleType,
        numberPlate,
        make,
        model,
        year,
        color,
        seatingCapacity,
        insuranceExpiryDate,
      } = ctx.request.body
      const userId = driverId || ctx.state.user.id;

      if (!vehicleType) {
        return ctx.badRequest('vehicleType is required');
      }

      const validTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'];
      if (!validTypes.includes(vehicleType)) {
        return ctx.badRequest(`vehicleType must be one of: ${validTypes.join(', ')}`);
      }

      // ── 1. Load user + delivery profile ────────────────────────────────
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { deliveryProfile: true },
      });

      if (!user?.deliveryProfile) {
        return ctx.badRequest('Delivery profile not found. Complete onboarding first.');
      }

      // ── 2. Load the delivery profile with its sub-component ────────────
      const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
        where: { id: user.deliveryProfile.id },
        populate: {
          [vehicleType]: { populate: { vehicle: true } },
        },
      });

      if (!deliveryProfile) {
        return ctx.badRequest('Delivery profile could not be loaded.');
      }

      const subComponent = (deliveryProfile as any)[vehicleType];
      const existingVehicleId = subComponent?.vehicle?.id ?? subComponent?.vehicle ?? null;

      // ── 3. Create or update the Vehicle record (WITHOUT assignedDriver) ──
      // assignedDriver is set AFTER the profile links are written so the
      // lifecycle can scan an already-populated profile and record accurate
      // assignedDriverDetails for future cleanup.
      let vehicle: any;

      if (existingVehicleId) {
        // Update path — profile links already exist, so we can set
        // assignedDriver immediately after updating the vehicle row.
        vehicle = await strapi.db.query('api::vehicle.vehicle').update({
          where: { id: existingVehicleId },
          data: {
            numberPlate: (numberPlate ?? '').toUpperCase(),
            make,
            model,
            year: parseInt(year) || new Date().getFullYear(),
            color,
            seatingCapacity: parseInt(seatingCapacity) || 2,
            insuranceExpiryDate: insuranceExpiryDate || null,
            // assignedDriver intentionally omitted — set last below
          },
        });
      } else {
        // Create path — profile links are written in step 4 below; set
        // assignedDriver after those writes.
        const vehicleCollectionType = vehicleType === 'motorbike' ? 'motorbike'
          : vehicleType === 'taxi' ? 'taxi'
            : vehicleType === 'truck' ? 'truck'
              : 'motorcycle';

        vehicle = await strapi.db.query('api::vehicle.vehicle').create({
          data: {
            vehicleType: vehicleCollectionType,
            numberPlate: (numberPlate ?? '').toUpperCase(),
            make,
            model,
            year: parseInt(year) || new Date().getFullYear(),
            color,
            seatingCapacity: parseInt(seatingCapacity) || 2,
            insuranceExpiryDate: insuranceExpiryDate || null,
            verificationStatus: 'pending',
            // assignedDriver intentionally omitted — set last below
          },
        });
      }

      // ── 4. Update the sub-component directly by its own UID ────────────
      if (subComponent?.id) {
        await strapi.db.query(`delivery-vehicles.${vehicleType}`).update({
          where: { id: subComponent.id },
          data: {
            vehicle: vehicle.id,
            isActive: true,
          },
        });
      } else {
        await strapi.db.query('delivery-profiles.delivery-profile').update({
          where: { id: (deliveryProfile as any).id },
          data: {
            [vehicleType]: { vehicle: vehicle.id, isActive: true },
          },
        });
      }

      // Keep activeVehicleType in sync
      await strapi.db.query('delivery-profiles.delivery-profile').update({
        where: { id: (deliveryProfile as any).id },
        data: { activeVehicleType: vehicleType },
      });

      // ── 5. Set assignedDriver LAST so the lifecycle fires against an
      //       already-linked profile and records correct assignedDriverDetails ─
      await strapi.db.query('api::vehicle.vehicle').update({
        where: { id: vehicle.id },
        data: { assignedDriver: userId },
      });

      const checkIfVehicleExistsAndUserHasInitialFloatToppedUp = async () => {
        const vehicleNumberPlate = vehicle?.numberPlate.toLowerCase()
        const capitalize = (text: String) => text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '';

        if (!vehicle) {
          return false
        }
        let existingVehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
          where: { numberPlate: vehicleNumberPlate },
          populate: { assignedDriver: true }
        })
        if (!existingVehicle) {
          existingVehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
            where: { numberPlate: capitalize(vehicleNumberPlate) },
            populate: { assignedDriver: true }
          })
        }
        if (!existingVehicle) {
          existingVehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
            where: { numberPlate: vehicleNumberPlate.toUpperCase() },
            populate: { assignedDriver: true }
          })
        }

        if (existingVehicle?.assignedDriver) {
          if (existingVehicle?.assignedDriver?.initialFloatToppedUp) {
            return true
          }
        }
        return false
      }

      if (checkIfVehicleExistsAndUserHasInitialFloatToppedUp) {
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: userId },
          data: {
            initialFloatToppedUp: true
          }
        })
      }

      // ── 6. Return ───────────────────────────────────────────────────────
      return ctx.send({
        success: true,
        hasVehicle: true,
        vehicle: {
          id: vehicle.id,
          vehicleType: vehicle.vehicleType,
          numberPlate: vehicle.numberPlate,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          seatingCapacity: vehicle.seatingCapacity,
          insuranceExpiryDate: vehicle.insuranceExpiryDate,
          verificationStatus: vehicle.verificationStatus,
        },
      });

    } catch (error) {
      strapi.log.error('[DeliveryDriver] handleSaveDeliveryVehicleDetails error:', error);
      return ctx.internalServerError(error?.message ?? 'Failed to save delivery vehicle details');
    }
  },

  // ─── Update delivery driver location ─────────────────────────────────────
  async updateDeliveryLocation(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { lat, lng, heading, speed } = ctx.request.body;

      if (!lat || !lng) return ctx.badRequest('Location coordinates required');

      const location = { lat, lng, heading, speed };

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: { currentLocation: location, lastSeen: new Date() },
      });

      strapi.eventHub.emit('delivery-driver:location:update', { driverId: userId, location });

      return ctx.send({ success: true, location, timestamp: new Date() });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] updateDeliveryLocation error:', error);
      return ctx.internalServerError('Failed to update location');
    }
  },

  // ─── Delivery stats ───────────────────────────────────────────────────────
  async getDeliveryStats(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { period = 'today' } = ctx.query;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { deliveryProfile: true },
      });

      if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');

      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case 'today': startDate.setHours(0, 0, 0, 0); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      const deliveries = await strapi.db.query('api::delivery.delivery').findMany({
        where: { deliverer: userId, createdAt: { $gte: startDate } },
      });

      const completed = deliveries.filter((d) => d.rideStatus === 'completed');
      const cancelled = deliveries.filter((d) => d.rideStatus === 'cancelled');
      const earnings = completed.reduce((s, d) => s + (d.driverEarnings || 0), 0);
      const distance = completed.reduce((s, d) => s + (d.actualDistance || 0), 0);
      const duration = completed.reduce((s, d) => s + (d.actualDuration || 0), 0);

      return ctx.send({
        period,
        stats: {
          totalDeliveries: deliveries.length,
          completedDeliveries: completed.length,
          cancelledDeliveries: cancelled.length,
          earnings: parseFloat(earnings.toFixed(2)),
          totalDistance: parseFloat(distance.toFixed(2)),
          totalDuration: duration,
          averageRating: user.deliveryProfile.averageRating || 0,
        },
        allTime: {
          totalDeliveries: user.deliveryProfile.totalDeliveries || 0,
          completedDeliveries: user.deliveryProfile.completedDeliveries || 0,
          totalEarnings: user.deliveryProfile.totalEarnings || 0,
          currentBalance: user.deliveryProfile.currentBalance || 0,
        },
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] getDeliveryStats error:', error);
      return ctx.internalServerError('Failed to get delivery stats');
    }
  },

  // ─── Delivery earnings ────────────────────────────────────────────────────
  async getDeliveryEarnings(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { period = 'week', startDate, endDate } = ctx.query;

      let start = new Date();
      let end = new Date();

      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      } else {
        switch (period) {
          case 'today': start.setHours(0, 0, 0, 0); break;
          case 'week': start.setDate(start.getDate() - 7); break;
          case 'month': start.setMonth(start.getMonth() - 1); break;
          case 'year': start.setFullYear(start.getFullYear() - 1); break;
        }
      }

      const deliveries = await strapi.db.query('api::delivery.delivery').findMany({
        where: {
          deliverer: userId,
          rideStatus: 'completed',
          tripCompletedAt: { $gte: start, $lte: end },
        },
      });

      const totalEarnings = deliveries.reduce((s, d) => s + (d.driverEarnings || 0), 0);
      const totalFares = deliveries.reduce((s, d) => s + (d.totalFare || 0), 0);
      const totalCommission = deliveries.reduce((s, d) => s + (d.commission || 0), 0);
      const cashDeliveries = deliveries.filter((d) => d.paymentMethod === 'cash');
      const okrapayDeliveries = deliveries.filter((d) => d.paymentMethod === 'okrapay');

      return ctx.send({
        period: { start, end },
        summary: {
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          totalFares: parseFloat(totalFares.toFixed(2)),
          totalCommission: parseFloat(totalCommission.toFixed(2)),
          deliveriesCompleted: deliveries.length,
          cashEarnings: cashDeliveries.reduce((s, d) => s + (d.driverEarnings || 0), 0),
          okrapayEarnings: okrapayDeliveries.reduce((s, d) => s + (d.driverEarnings || 0), 0),
        },
        deliveries: deliveries.map((d) => ({
          rideCode: d.rideCode,
          date: d.tripCompletedAt,
          fare: d.totalFare,
          commission: d.commission,
          earnings: d.driverEarnings,
          paymentMethod: d.paymentMethod,
        })),
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] getDeliveryEarnings error:', error);
      return ctx.internalServerError('Failed to get delivery earnings');
    }
  },

  // ─── Delivery earnings breakdown ──────────────────────────────────────────
  async getDeliveryEarningsBreakdown(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { period = 'month' } = ctx.query;

      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      const deliveries = await strapi.db.query('api::delivery.delivery').findMany({
        where: {
          deliverer: userId,
          rideStatus: 'completed',
          tripCompletedAt: { $gte: startDate },
        },
      });

      const dailyBreakdown: Record<string, any> = {};
      deliveries.forEach((d) => {
        const date = new Date(d.tripCompletedAt).toISOString().split('T')[0];
        if (!dailyBreakdown[date]) dailyBreakdown[date] = { earnings: 0, deliveries: 0, commission: 0 };
        dailyBreakdown[date].earnings += d.driverEarnings || 0;
        dailyBreakdown[date].deliveries += 1;
        dailyBreakdown[date].commission += d.commission || 0;
      });

      return ctx.send({
        period,
        dailyBreakdown,
        total: {
          earnings: deliveries.reduce((s, d) => s + (d.driverEarnings || 0), 0),
          commission: deliveries.reduce((s, d) => s + (d.commission || 0), 0),
          deliveries: deliveries.length,
        },
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] getDeliveryEarningsBreakdown error:', error);
      return ctx.internalServerError('Failed to get earnings breakdown');
    }
  },

  // ─── Onboarding: save delivery vehicle type ───────────────────────────────
  async saveDeliveryVehicleType(ctx) {
    try {
      const { vehicleType, driverId } = ctx.request.body;
      const userId = driverId || ctx.state.user.id;

      const validTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'];
      if (!validTypes.includes(vehicleType)) {
        return ctx.badRequest(`vehicleType must be one of: ${validTypes.join(', ')}`);
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { deliveryProfile: true },
      });

      if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');

      const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
        where: { id: user.deliveryProfile.id },
        populate: {
          taxi: { populate: true },
          motorbike: { populate: true },
          motorcycle: { populate: true },
          truck: { populate: true }
        }
      })

      const allTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'];

      // Activate the chosen sub-component directly
      const chosen = (deliveryProfile as any)[vehicleType];
      if (chosen?.id) {
        await strapi.db.query(`delivery-vehicles.${vehicleType}`).update({
          where: { id: chosen.id },
          data: { isActive: true },
        })
      }
      else {
        const vehicleTypeEntry = await strapi.db.query(`delivery-vehicles.${vehicleType}`).create({
          data: { isActive: true }
        })
        await strapi.db.query('delivery-profiles.delivery-profile').update({
          where: { id: user.deliveryProfile.id },
          data: {
            [vehicleType]: vehicleTypeEntry
          },
        })
      }

      // Deactivate all other sub-components directly
      for (const t of allTypes.filter((t) => t !== vehicleType)) {
        const other = (deliveryProfile as any)[t];
        if (other?.id) {
          await strapi.db.query(`delivery-vehicles.${t}`).update({
            where: { id: other.id },
            data: { isActive: false },
          });
        }
      }

      await strapi.db.query('delivery-profiles.delivery-profile').update({
        where: { id: user.deliveryProfile.id },
        data: { activeVehicleType: vehicleType },
      });

      return ctx.send({
        success: true,
        message: 'Delivery vehicle type saved',
        nextStep: 'vehicle-details',
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] saveDeliveryVehicleType error:', error);
      return ctx.internalServerError('Failed to save delivery vehicle type');
    }
  },

  // ─── Onboarding: save delivery vehicle details (initial creation path) ────
  async saveDeliveryVehicleDetails(ctx) {
    try {
      const {
        driverId, make, model, year, numberPlate, color,
        vehicleType, seatingCapacity, insuranceExpiryDate,
        maxPackageWeight,
      } = ctx.request.body;
      const userId = driverId || ctx.state.user.id;

      const validTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'];
      if (!validTypes.includes(vehicleType)) {
        return ctx.badRequest(`vehicleType must be one of: ${validTypes.join(', ')}`);
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { deliveryProfile: true },
      })

      if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');

      const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
        where: { id: user.deliveryProfile.id },
        populate: { [vehicleType]: { populate: { vehicle: true } } },
      })

      const vehicleCollectionType = (() => {
        if (vehicleType === 'taxi') return 'taxi';
        if (vehicleType === 'truck') return 'truck';
        if (vehicleType === 'motorbike') return 'motorbike';
        return 'motorcycle';
      })();

      let deliveryClasses = await strapi.db.query('api::ride-class.ride-class').findMany()
      if (vehicleType === 'motorbike' || vehicleType === 'motorcycle' || vehicleType === 'motorbike') {
        const allowedClasses = ['standard', 'midsize']
        deliveryClasses = deliveryClasses.filter((deliclass) => allowedClasses.includes(deliclass.name))
      }
      if (vehicleType === 'taxi') {
        const allowedClasses = ['standard', 'midsize', 'big']
        deliveryClasses = deliveryClasses.filter((deliclass) => allowedClasses.includes(deliclass.name))
      }
      if (vehicleType === 'truck') {
        const allowedClasses = ['big', 'large']
        deliveryClasses = deliveryClasses.filter((deliclass) => allowedClasses.includes(deliclass.name))
      }

      // ── 1. Create the vehicle WITHOUT assignedDriver ──────────────────────
      // assignedDriver is set AFTER the profile links are written so the
      // lifecycle can scan an already-populated profile and record accurate
      // assignedDriverDetails for future cleanup.
      const newVehicle = await strapi.db.query('api::vehicle.vehicle').create({
        data: {
          make,
          model,
          year,
          numberPlate,
          color,
          vehicleType: vehicleCollectionType,
          seatingCapacity: seatingCapacity || null,
          insuranceExpiryDate: insuranceExpiryDate || null,
          isActive: true,
          deliveryClasses: { connect: deliveryClasses.map(rc => rc.id) },
          // assignedDriver intentionally omitted — set last below
        },
      });

      // ── 2. Link the vehicle to the delivery profile sub-component ─────────
      const subComponent = (deliveryProfile as any)[vehicleType];

      if (subComponent?.id) {
        await strapi.db.query(`delivery-vehicles.${vehicleType}`).update({
          where: { id: subComponent.id },
          data: {
            vehicle: newVehicle.id,
            isActive: true,
            ...(maxPackageWeight != null ? { maxPackageWeight } : {}),
          },
        });
      } else {
        await strapi.db.query('delivery-profiles.delivery-profile').update({
          where: { id: user.deliveryProfile.id },
          data: {
            [vehicleType]: {
              vehicle: newVehicle.id,
              isActive: true,
              ...(maxPackageWeight != null ? { maxPackageWeight } : {}),
            },
          },
        });
      }

      await strapi.db.query('delivery-profiles.delivery-profile').update({
        where: { id: user.deliveryProfile.id },
        data: { activeVehicleType: vehicleType, acceptedDeliveryClasses: { connect: deliveryClasses.map(rc => rc.id) } },
      });

      // ── 3. Set assignedDriver LAST so the lifecycle fires against an
      //       already-linked profile and records correct assignedDriverDetails ─
      await strapi.db.query('api::vehicle.vehicle').update({
        where: { id: newVehicle.id },
        data: { assignedDriver: userId },
      })

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          vehicles: { connect: [newVehicle.id] }// add to the array of vehicles a driver has had 
        }
      })

      return ctx.send({
        success: true,
        message: 'Delivery vehicle details saved',
        nextStep: 'review',
        vehicle: newVehicle,
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] saveDeliveryVehicleDetails error:', error);
      return ctx.internalServerError('Failed to save delivery vehicle details');
    }
  },

  async assignVehicle(ctx) {
    // assignVehicle already writes all profile links before setting
    // assignedDriver (steps 4–6 then the assignedDriver update), so the
    // lifecycle fires at the correct moment. No ordering change needed here.
    try {
      const { driverId, vehicleId } = ctx.request.body;
      const userId = driverId || ctx.state.user.id;

      if (!vehicleId) {
        return ctx.badRequest('vehicleId is required');
      }

      // ── 1. Fetch vehicle ────────────────────────────────────────────────
      const vehicle = await strapi.db.query('api::vehicle.vehicle').findOne({
        where: { id: vehicleId },
        populate: { assignedDriver: { select: ['id'] } },
      });

      if (!vehicle) {
        return ctx.notFound('Vehicle not found');
      }

      if (vehicle.assignedDriver?.id) { // stops a partner account from assigning a vehicle of a user who belongs to another partner account
        const prevUserAccount = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: vehicle.assignedDriver.id },
          populate: { partner: { select: ['id'] } },
        })
        const currentUserAccount = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: userId },
          populate: { partner: { select: ['id'] } },
        })
        if (prevUserAccount?.partner?.id && prevUserAccount.partner.id !== currentUserAccount?.partner?.id) {
          return ctx.badRequest('Driver belongs to a different partner');
        }
      }

      const validDeliveryTypes = ['taxi', 'motorbike', 'motorcycle', 'truck'] as const;
      type DeliveryVehicleType = typeof validDeliveryTypes[number];
      const vehicleType = vehicle.vehicleType as DeliveryVehicleType;

      if (!validDeliveryTypes.includes(vehicleType)) {
        return ctx.badRequest(
          `Vehicle type "${vehicleType}" cannot be assigned to a delivery profile. ` +
          `Must be one of: ${validDeliveryTypes.join(', ')}`
        );
      }

      // ── 2. Load user + delivery profile ─────────────────────────────────
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { deliveryProfile: true },
      });

      if (!user?.deliveryProfile) {
        return ctx.badRequest('Delivery profile not found');
      }

      // ── 3. Load delivery profile with all sub-components ─────────────────
      const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
        where: { id: user.deliveryProfile.id },
        populate: {
          taxi: { populate: { vehicle: true } },
          motorbike: { populate: { vehicle: true } },
          motorcycle: { populate: { vehicle: true } },
          truck: { populate: { vehicle: true } },
        },
      }) as any;

      if (!deliveryProfile) {
        return ctx.badRequest('Delivery profile could not be loaded');
      }

      // ── 4. Activate chosen sub-component and attach the vehicle ──────────
      const chosenSub = deliveryProfile[vehicleType];
      if (chosenSub?.id) {
        await strapi.db.query(`delivery-vehicles.${vehicleType}`).update({
          where: { id: chosenSub.id },
          data: { vehicle: vehicleId, isActive: true },
        });
      } else {
        await strapi.db.query('delivery-profiles.delivery-profile').update({
          where: { id: deliveryProfile.id },
          data: { [vehicleType]: { vehicle: vehicleId, isActive: true } },
        });
      }

      // ── 5. Deactivate all other sub-components ────────────────────────────
      for (const t of validDeliveryTypes.filter(t => t !== vehicleType)) {
        const other = deliveryProfile[t];
        if (other?.id) {
          await strapi.db.query(`delivery-vehicles.${t}`).update({
            where: { id: other.id },
            data: { isActive: false },
          });
        }
      }

      // ── 6. Sync activeVehicleType on the delivery profile ─────────────────
      await strapi.db.query('delivery-profiles.delivery-profile').update({
        where: { id: deliveryProfile.id },
        data: { activeVehicleType: vehicleType },
      });

      // ── 7. Set assignedDriver LAST so the lifecycle fires against an
      //       already-linked profile and records correct assignedDriverDetails ─
      await strapi.db.query('api::vehicle.vehicle').update({
        where: { id: vehicleId },
        data: { assignedDriver: userId },
      })
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          vehicles: { connect: [vehicleId] }// add to the array of vehicles a driver has had 
        }
      })

      return ctx.send({
        success: true,
        message: 'Vehicle assigned successfully',
        activeVehicleType: vehicleType,
        vehicle: {
          id: vehicle.id,
          vehicleType: vehicle.vehicleType,
          numberPlate: vehicle.numberPlate,
          make: vehicle.make,
          model: vehicle.model,
          insuranceExpiryDate: vehicle.insuranceExpiryDate,
        },
      });

    } catch (error) {
      strapi.log.error('[DeliveryDriver] assignVehicle error:', error);
      return ctx.internalServerError('Failed to assign vehicle');
    }
  },

  // ─── Onboarding: submit for verification ─────────────────────────────────
  async submitDeliveryForVerification(ctx) {
    try {
      const { driverId } = ctx.request.body;
      const userId = driverId || ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true, deliveryProfile: true },
      })

      if (!user?.driverProfile) return ctx.badRequest('Driver profile is incomplete');
      if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');
      if (user.driverProfile.verificationStatus === 'pending') {
        return ctx.badRequest('Verification request already sent');
      }

      const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
        where: { id: user.deliveryProfile.id },
        populate: {
          taxi: { populate: { vehicle: true } },
          motorbike: { populate: { vehicle: true } },
          motorcycle: { populate: { vehicle: true } },
          truck: { populate: { vehicle: true } },
        },
      });

      const activeType = (deliveryProfile as any)?.activeVehicleType;
      if (!activeType || activeType === 'none' || !(deliveryProfile as any)[activeType]?.vehicle) {
        return ctx.badRequest('Please complete delivery vehicle setup before submitting');
      }

      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});

      const initialDelivererFloat = () => {
        if (user.initialFloatToppedUp) {
          return user.driverProfile?.floatBalance
        }
        return settings?.initialDelivererFloat || 0
      }

      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          verificationStatus: driverId || settings?.autoApproveDeliverers ? 'approved' : 'pending',
          floatBalance: initialDelivererFloat(),
        },
      })

      await strapi.db.query('delivery-profiles.delivery-profile').update({
        where: { id: user.deliveryProfile.id },
        data: { verificationStatus: settings?.autoApproveDeliverers ? 'approved' : 'pending' },
      })

      await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { initialFloatToppedUp: true }
      })

      try {
        const emailList = await strapi.db.query('api::email-addresses-list.email-addresses-list').findOne({
          where: { id: 1 },
        });
        let adminEmailMessage = settings?.autoApproveDeliverers ? 'A delivery driver has been outo approved on OkraRides. Driver ID: ' + userId : 'A delivery driver is looking for verification on OkraRides. User ID: ' + userId
        if (driverId) {
          adminEmailMessage = 'A delivery driver has been registered by a partner on OkraRides. Driver ID: ' + ctx.state.user.id
        }
        (emailList?.adminEmailAddresses || []).forEach((email: string) => {
          const { SendEmailNotification } = require('../../../services/messages');
          SendEmailNotification(email, adminEmailMessage)
        });
      } catch (e) {
        strapi.log.warn('[DeliveryDriver] Admin email notification failed:', e);
      }

      socketService.emitNotification(userId, 'delivery', {
        type: 'account_update',
        title: 'Verification Submitted',
        body: 'Your application has been submitted for review. We will notify you once verification is complete.',
        data: { verificationStatus: 'pending' },
      });

      return ctx.send({ success: true, message: 'Application submitted successfully' });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] submitDeliveryForVerification error:', error);
      return ctx.internalServerError('Failed to submit application');
    }
  },

  // ─── Onboarding status ────────────────────────────────────────────────────
  async getDeliveryOnboardingStatus(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: {
          driverProfile: true,
          deliveryProfile: {
            populate: {
              taxi: true,
              motorbike: true,
              motorcycle: true,
              truck: true,
            },
          },
        },
      });

      const dp = (user?.driverProfile || {}) as any;
      const dlp = (user?.deliveryProfile || {}) as any;
      const activeType = dlp.activeVehicleType;
      const hasVehicle = activeType && activeType !== 'none' && dlp[activeType]?.vehicle;

      return ctx.send({
        isDriverProfileCreated: !!user?.driverProfile,
        isDeliveryProfileCreated: !!user?.deliveryProfile,
        onboardingStatus: dp.verificationStatus || dlp.verificationStatus || 'not_started',
        currentStep: dp.onboardingStep || 'license',
        steps: {
          license: !!dp.driverLicenseNumber,
          nationalId: !!dp.nationalIdNumber,
          address: !!dp.proofOfAddress,
          deliveryVehicle: !!hasVehicle,
        },
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] getDeliveryOnboardingStatus error:', error);
      return ctx.internalServerError('Failed to fetch onboarding status');
    }
  },

  // ─── Find assigned delivery vehicle ──────────────────────────────────────
  async findDeliveryVehicle(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { deliveryProfile: true },
      });

      if (!user?.deliveryProfile) return ctx.badRequest('Delivery profile not found');

      const deliveryProfile = await strapi.db.query('delivery-profiles.delivery-profile').findOne({
        where: { id: user.deliveryProfile.id },
        populate: {
          taxi: { populate: { vehicle: true } },
          motorbike: { populate: { vehicle: true } },
          motorcycle: { populate: { vehicle: true } },
          truck: { populate: { vehicle: true } },
        },
      });

      const activeType = (deliveryProfile as any)?.activeVehicleType;
      const vehicle = activeType && activeType !== 'none'
        ? (deliveryProfile as any)[activeType]?.vehicle
        : null;

      return ctx.send({
        success: true,
        hasVehicle: !!vehicle,
        activeVehicleType: activeType,
        vehicle,
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] findDeliveryVehicle error:', error);
      return ctx.internalServerError('Failed to get delivery vehicle');
    }
  },

  // ─── Payment phone numbers ────────────────────────────────────────────────
  async getPaymentPhoneNumbers(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: {
          driverProfile: { select: ['id', 'paymentPhoneNumbers'] },
          country: { select: ['id', 'phoneCode', 'acceptedMobileMoneyPayments'] },
        },
      });

      if (!user?.driverProfile) return ctx.badRequest('Driver profile not found');

      return ctx.send({
        paymentPhoneNumbers: user.driverProfile.paymentPhoneNumbers || [],
        acceptedMobileMoneyPayments: user.country?.acceptedMobileMoneyPayments || [],
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] getPaymentPhoneNumbers error:', error);
      return ctx.internalServerError('Failed to fetch payment phone numbers');
    }
  },

  async savePaymentPhoneNumbers(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { paymentPhoneNumbers } = ctx.request.body;

      if (!Array.isArray(paymentPhoneNumbers)) {
        return ctx.badRequest('paymentPhoneNumbers must be an array');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: {
          driverProfile: { select: ['id', 'paymentPhoneNumbers'] },
          country: { select: ['id', 'phoneCode', 'acceptedMobileMoneyPayments'] },
        },
      });

      if (!user?.driverProfile) return ctx.badRequest('Driver profile not found');

      const acceptedTypes: string[] = (
        user.country?.acceptedMobileMoneyPayments || []
      ).map((t: string) => t.toLowerCase());

      for (let i = 0; i < paymentPhoneNumbers.length; i++) {
        const entry = paymentPhoneNumbers[i];
        if (!entry.mobileNumber || !entry.mobileType || !entry.name) {
          return ctx.badRequest(
            `Entry at index ${i} is missing required fields (mobileNumber, mobileType, name)`
          );
        }
        if (
          acceptedTypes.length > 0 &&
          !acceptedTypes.includes(entry.mobileType.toLowerCase())
        ) {
          return ctx.badRequest(
            `Entry at index ${i}: mobileType "${entry.mobileType}" is not accepted in your country. ` +
            `Accepted: ${acceptedTypes.join(', ')}`
          );
        }
      }

      const normalised = paymentPhoneNumbers.map((e: any) => ({
        mobileNumber: e.mobileNumber.replace(/\s/g, ''),
        mobileType: e.mobileType.toLowerCase(),
        name: e.name.trim(),
      }));

      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: { paymentPhoneNumbers: normalised },
      });

      return ctx.send({
        success: true,
        message: 'Payment phone numbers updated successfully',
        paymentPhoneNumbers: normalised,
      });
    } catch (error) {
      strapi.log.error('[DeliveryDriver] savePaymentPhoneNumbers error:', error);
      return ctx.internalServerError('Failed to save payment phone numbers');
    }
  },
}));