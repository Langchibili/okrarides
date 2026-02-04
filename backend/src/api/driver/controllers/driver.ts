//============================================
// src/api/driver/controllers/driver.ts
//============================================
import { factories } from '@strapi/strapi';
import { SendSmsNotification, SendEmailNotification } from "../../../services/messages"
import socketService from '../../../services/socketService'
import DeviceService from '../../../services/deviceServices'

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  
  // Toggle driver online/offline status
async toggleOnline(ctx) {
  try {
    const userId = ctx.state.user.id;
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      select: ['id', 'username', "isOnline"],
      populate: {
        driverProfile: {
          select: ['id', 'isOnline', 'subscriptionStatus']
        },
        riderProfile: {
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

    // Update driver profile
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: {
        isOnline: newOnlineStatus,
        activeProfile: 'driver',
        profileActivityStatus: {
          "rider": false,
          "driver": true,
          "delivery": false,
          "conductor": false
        },
        lastSeen: new Date()
      }
    })

    await strapi.db.query('driver-profiles.driver-profile').update({
      where: { id: user.driverProfile.id },
      data: {
        isOnline: newOnlineStatus,
        isAvailable: newOnlineStatus === true ? true : newOnlineStatus,
        isActive: true
      }
    })

    await strapi.db.query('rider-profiles.rider-profile').update({
      where: { id: user.riderProfile.id },
      data: {
        isOnline: false,
        isAvailable: false,
        isActive: false
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

    // 🆕 If going offline, stop native tracking
    if (!newOnlineStatus) {
      try {
        await DeviceService.sendNotificationToDevice(userId, {
          type: 'STOP_LOCATION_TRACKING',
          message: 'You are now offline'
        });
      } catch (error) {
        strapi.log.warn(`Failed to stop tracking for driver ${userId}:`, error);
      }
    }

    // 🆕 If going online, request current location from device
    if (newOnlineStatus) {
      try {
        await DeviceService.requestLocationFromDevice(userId, 'driver');
        strapi.log.info(`Location requested from driver ${userId} after going online`);
      } catch (error) {
        strapi.log.warn(`Failed to request location from driver ${userId}:`, error);
      }
    }

    // Emit WebSocket event
    strapi.eventHub.emit('driver:status:changed', {
      driverId: userId,
      status: newOnlineStatus ? 'online' : 'offline'
    });

    return ctx.send({
      success: true,
      isOnline: newOnlineStatus,
      message: `Driver is now ${newOnlineStatus ? 'online' : 'offline'}`,
      locationRequested: newOnlineStatus // Indicate if location was requested
    });
  } catch (error) {
    strapi.log.error('Toggle online error:', error);
    return ctx.internalServerError('Failed to update status');
  }
},
  // async toggleOnline(ctx) {
  //   try {
  //     const userId = ctx.state.user.id;
      
  //     const user = await strapi.db.query('plugin::users-permissions.user').findOne({
  //       where: { id: userId },
  //       // 1. Limit fields on the main User object
  //       select: ['id', 'username',"isOnline"], 
  //       populate: { 
  //         driverProfile: {
  //           // 2. Only fetch fields used in your logic (ID and status)
  //           select: ['id', 'isOnline', 'subscriptionStatus'] 
  //         },
  //         riderProfile: {
  //           // 3. We only need the ID to perform the update later
  //           select: ['id'] 
  //         },
  //         deliveryProfile: {
  //           select: ['id']
  //         },
  //         conductorProfile: {
  //           select: ['id'] 
  //         }
  //       }
  //     })
  //     if (!user?.driverProfile) {
  //       return ctx.badRequest('Driver profile not found');
  //     }

  //     const newOnlineStatus = !user.driverProfile.isOnline;
      
  //     // Check subscription status before going online
  //     // if (newOnlineStatus) { 
  //     //   const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
        
  //     //   if (settings?.subscriptionSystemEnabled) {
  //     //     if (!['active', 'trial'].includes(user.driverProfile.subscriptionStatus)) {
  //     //       return ctx.forbidden('Active subscription required to go online');
  //     //     }
  //     //   }
  //     // }
  //      console.log('newOnlineStatus',newOnlineStatus)
  //     // Update driver profile - getting component ID and updating it
  //     await strapi.db.query('plugin::users-permissions.user').update({
  //       where: { id: userId },
  //       data: {
  //         isOnline: newOnlineStatus,
  //         activeProfile: 'driver',
  //         profileActivityStatus: {
  //           "rider": false,
  //           "driver": true,
  //           "delivery": false,
  //           "conductor": false
  //         },
  //         lastSeen: new Date()
  //       }
  //     })
  //     await strapi.db.query('driver-profiles.driver-profile').update({
  //       where: { id: user.driverProfile.id },  
  //       data: {
  //           isOnline: newOnlineStatus,
  //           isAvailable: newOnlineStatus === true? true : newOnlineStatus,
  //           isActive: true
  //        }
  //     })
  //     await strapi.db.query('rider-profiles.rider-profile').update({
  //       where: { id: user.riderProfile.id },   
  //       data: {
  //           isOnline: false,
  //           isAvailable: false,
  //           isActive: false
  //       }
  //     })
  //     await strapi.db.query('delivery-profiles.delivery-profile').update({
  //        where: { id: user.deliveryProfile.id },   
  //        data: {
  //           isOnline: false,
  //           isAvailable: false,
  //           isActive: false
  //        }
  //     })
  //     await strapi.db.query('conductor-profiles.conductor-profile').update({
  //         where: { id: user.conductorProfile.id },   
  //         data: {
  //           isOnline: false,
  //           isAvailable: false,
  //           isActive: false
  //         }
  //     })

  //     // Emit WebSocket event
  //     strapi.eventHub.emit('driver:status:changed', {
  //       driverId: userId,
  //       status: newOnlineStatus ? 'online' : 'offline'
  //     });

  //     return ctx.send({
  //       success: true,
  //       isOnline: newOnlineStatus,
  //       message: `Driver is now ${newOnlineStatus ? 'online' : 'offline'}`
  //     });
  //   } catch (error) {
  //     strapi.log.error('Toggle online error:', error);
  //     return ctx.internalServerError('Failed to update status');
  //   }
  // },

  // Update driver location
  async updateLocation(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { lat, lng, heading, speed } = ctx.request.body;

      if (!lat || !lng) {
        return ctx.badRequest('Location coordinates required');
      }

      const location = { lat, lng, heading, speed };

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          currentLocation: location,
          lastSeen: new Date(),
        }
      });

      // Emit location update event
      strapi.eventHub.emit('location:update', {
        driverId: userId,
        location
      });

      return ctx.send({
        success: true,
        location,
        timestamp: new Date()
      });
    } catch (error) {
      strapi.log.error('Update location error:', error);
      return ctx.internalServerError('Failed to update location');
    }
  },

  // Get driver statistics
  async getStats(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { period = 'today' } = ctx.query;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch(period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get rides for period
      const rides = await strapi.db.query('api::ride.ride').findMany({
        where: {
          driver: userId,
          createdAt: { $gte: startDate }
        }
      });

      const completedRides = rides.filter(r => r.rideStatus === 'completed');
      const cancelledRides = rides.filter(r => r.rideStatus === 'cancelled');
      
      const earnings = completedRides.reduce((sum, ride) => sum + (ride.driverEarnings || 0), 0);
      const totalDistance = completedRides.reduce((sum, ride) => sum + (ride.actualDistance || 0), 0);
      const totalDuration = completedRides.reduce((sum, ride) => sum + (ride.actualDuration || 0), 0);

      return ctx.send({
        period,
        stats: {
          totalRides: rides.length,
          completedRides: completedRides.length,
          cancelledRides: cancelledRides.length,
          earnings: parseFloat(earnings.toFixed(2)),
          totalDistance: parseFloat(totalDistance.toFixed(2)),
          totalDuration,
          averageRating: user.driverProfile.averageRating || 0,
          completionRate: user.driverProfile.completionRate || 100,
          acceptanceRate: user.driverProfile.acceptanceRate || 100,
        },
        allTime: {
          totalRides: user.driverProfile.totalRides || 0,
          completedRides: user.driverProfile.completedRides || 0,
          totalEarnings: user.driverProfile.totalEarnings || 0,
          currentBalance: user.driverProfile.currentBalance || 0,
        }
      });
    } catch (error) {
      strapi.log.error('Get stats error:', error);
      return ctx.internalServerError('Failed to get statistics');
    }
  },

  // Get driver earnings
  async getEarnings(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { period = 'week', startDate, endDate } = ctx.query;

      let start = new Date();
      let end = new Date();

      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      } else {
        switch(period) {
          case 'today':
            start.setHours(0, 0, 0, 0);
            break;
          case 'week':
            start.setDate(start.getDate() - 7);
            break;
          case 'month':
            start.setMonth(start.getMonth() - 1);
            break;
          case 'year':
            start.setFullYear(start.getFullYear() - 1);
            break;
        }
      }

      const rides = await strapi.db.query('api::ride.ride').findMany({
        where: {
          driver: userId,
          rideStatus: 'completed',
          tripCompletedAt: { $gte: start, $lte: end }
        },
        populate: ['rideClass', 'taxiType']
      });

      const totalEarnings = rides.reduce((sum, ride) => sum + (ride.driverEarnings || 0), 0);
      const totalFares = rides.reduce((sum, ride) => sum + ride.totalFare, 0);
      const totalCommission = rides.reduce((sum, ride) => sum + (ride.commission || 0), 0);
      const cashRides = rides.filter(r => r.paymentMethod === 'cash');
      const okrapayRides = rides.filter(r => r.paymentMethod === 'okrapay');

      return ctx.send({
        period: { start, end },
        summary: {
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          totalFares: parseFloat(totalFares.toFixed(2)),
          totalCommission: parseFloat(totalCommission.toFixed(2)),
          ridesCompleted: rides.length,
          cashEarnings: cashRides.reduce((sum, r) => sum + (r.driverEarnings || 0), 0),
          okrapayEarnings: okrapayRides.reduce((sum, r) => sum + (r.driverEarnings || 0), 0),
        },
        rides: rides.map(ride => ({
          rideCode: ride.rideCode,
          date: ride.tripCompletedAt,
          fare: ride.totalFare,
          commission: ride.commission,
          earnings: ride.driverEarnings,
          paymentMethod: ride.paymentMethod,
          rideClass: ride.rideClass?.name,
          taxiType: ride.taxiType?.name,
        }))
      });
    } catch (error) {
      strapi.log.error('Get earnings error:', error);
      return ctx.internalServerError('Failed to get earnings');
    }
  },

  // Get earnings breakdown
  async getEarningsBreakdown(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { period = 'month' } = ctx.query;

      const now = new Date();
      let startDate = new Date();
      
      switch(period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const rides = await strapi.db.query('api::ride.ride').findMany({
        where: {
          driver: userId,
          rideStatus: 'completed',
          tripCompletedAt: { $gte: startDate }
        }
      });

      // Daily breakdown
      const dailyBreakdown = {};
      rides.forEach(ride => {
        const date = new Date(ride.tripCompletedAt).toISOString().split('T')[0];
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = { earnings: 0, rides: 0, commission: 0 };
        }
        dailyBreakdown[date].earnings += ride.driverEarnings || 0;
        dailyBreakdown[date].rides += 1;
        dailyBreakdown[date].commission += ride.commission || 0;
      });

      return ctx.send({
        period,
        dailyBreakdown,
        total: {
          earnings: rides.reduce((sum, r) => sum + (r.driverEarnings || 0), 0),
          commission: rides.reduce((sum, r) => sum + (r.commission || 0), 0),
          rides: rides.length,
        }
      });
    } catch (error) {
      strapi.log.error('Get earnings breakdown error:', error);
      return ctx.internalServerError('Failed to get earnings breakdown');
    }
  },
   //============================================
  // ONBOARDING CONTROLLERS
  //============================================

  // 1. Save License Information
  async saveLicenseInfo(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { licenseNumber, expiryDate } = ctx.request.body;

      if (!licenseNumber || !expiryDate) {
        return ctx.badRequest('Missing required license fields');
      }

      // 1. Get the User to find the Profile ID
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      // 2. Update the Component directly
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          driverLicenseNumber: licenseNumber,
          licenseExpiryDate: expiryDate,
          // Assuming you have this field in schema, otherwise remove it
          onboardingStep: 'national-id', 
        },
      });

      return ctx.send({ success: true, message: 'License info saved', nextStep: 'national-id' });
    } catch (error) {
      strapi.log.error('Save License Info Error:', error);
      return ctx.internalServerError('Failed to save license information');
    }
  },

  // 2. Save National ID Information
  async saveNationalIdInfo(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { idNumber } = ctx.request.body;

      if (!idNumber) {
        return ctx.badRequest('Missing National ID number');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      // Update Component directly
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          nationalIdNumber: idNumber, // Mapped to your Schema
          onboardingStep: 'proof-of-address',
        },
      });

      return ctx.send({ success: true, message: 'National ID saved', nextStep: 'proof-of-address' });
    } catch (error) {
      strapi.log.error('Save National ID Error:', error);
      return ctx.internalServerError('Failed to save National ID information');
    }
  },

  // 3. Save Proof of Address
  async saveProofOfAddress(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { address } = ctx.request.body;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { 
            driverProfile: {
                populate: true 
             } 
        }
      })

      // 1. Update Main User Address (if address string is provided)
      if (address) {
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: userId },
          data: { address },
        });
      }

      // 2. Update Profile Step
      if (user?.driverProfile) {
        await strapi.db.query('driver-profiles.driver-profile').update({
          where: { id: user.driverProfile.id },
          data: {
            // Note: Your schema provided doesn't show 'addressType', 
            // so I'm only updating the step here. Add addressType to schema if needed.
            onboardingStep: 'vehicle-type',
          },
        });
      }

      return ctx.send({ success: true, message: 'Address saved', nextStep: 'vehicle-type' });
    } catch (error) {
      strapi.log.error('Save Address Error:', error);
      return ctx.internalServerError('Failed to save proof of address');
    }
  },

  // 4. Save Vehicle Type
  async saveVehicleType(ctx) {
    try {
      const userId = ctx.state.user.id;
      // vehicleType expected values: 'taxi', 'bus', 'motorbike' to match enum
      const { vehicleType } = ctx.request.body; 
     
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }
    
      const driverProfileWithSubProfiles = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        populate: { 
            taxiDriver: {
                populate: true // Populate all relations inside taxiDriver
            },
            busDriver: {
                populate: true // Populate all relations inside busDriver
            },
            motorbikeRider: {
                populate: true // Populate all relations inside motorbikeRider
            }
        }
      })

      const driverType = ((vehicleType)=>{
         if(vehicleType === "bus"){
            return "busDriver"
         }
         else if(vehicleType === "motorbike"){
            return "motorbikeRider"
         }
         return "taxiDriver" 
      })(vehicleType);
     await strapi.entityService.update('plugin::users-permissions.user', user.id, {
     data: {
        driverProfile:{
            id:user.driverProfile.id,
            activeSubProfile: vehicleType,
            // Entity Service will automatically create this component 
            // if it doesn't exist, or update it if it does.
            [driverType] : driverProfileWithSubProfiles[driverType]? {
              id:driverProfileWithSubProfiles[driverType]['id'],
              totalEarnings: 0,
              isActive: true
             } :{
              totalEarnings: 0,
              isActive: true
            },
            ...["taxiDriver","busDriver","motorbikeRider"].filter(type => 
               type !== driverType &&  // Filter out vehicle type
               driverProfileWithSubProfiles[type] // Check if it exists in user.driverProfile
            ).reduce((acc, type) => ({ ...acc, [type]: { id: driverProfileWithSubProfiles[type]['id'],isActive: false }
            }), {}), // this is to ensure that only the chosen vehicle type is active, the rest should be inactive, even if toggled on before
           onboardingStep: 'vehicle-details',
        }
    },
});

      return ctx.send({ success: true, message: 'Vehicle type saved', nextStep: 'vehicle-details' });
    } catch (error) {
      strapi.log.error('Save Vehicle Type Error:', error);
      return ctx.internalServerError('Failed to save vehicle type');
    }
  },

  // 5. Save Vehicle Details (Creates Vehicle + Links it)
  async saveVehicleDetails(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { 
        make, model, year, numberPlate, color, vehicleType, seatingCapacity, insuranceExpiryDate 
      } = ctx.request.body;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }
      const driverProfileWithSubProfiles = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        populate: { 
            taxiDriver: {
                populate: true // Populate all relations inside taxiDriver
            },
            busDriver: {
                populate: true // Populate all relations inside busDriver
            },
            motorbikeRider: {
                populate: true // Populate all relations inside motorbikeRider
            }
        }
      })
      const driverType = ((vehicleType)=>{
         if(vehicleType === "bus"){
            return "busDriver"
         }
         else if(vehicleType === "motorbike"){
            return "motorbikeRider"
         }
         return "taxiDriver" 
      })(vehicleType);

      const vehicleConnectType = ((vehicleType)=>{
         if(vehicleType === "taxi"){
            return "vehicle"
         }
         return vehicleType
      })(vehicleType);
      
      const rideClasses = await strapi.db.query('api::ride-class.ride-class').findMany()
      // 1. Create the Vehicle in the Vehicles Collection
      // We use entityService.create to ensure lifecycle hooks run if you have any
      const newVehicle = await strapi.db.query('api::vehicle.vehicle').create({
        data: {
          make,
          model,
          year,
          numberPlate,
          color,
          vehicleType,
          seatingCapacity,
          insuranceExpiryDate,
          isActive: true,
          rideClasses: {connect: rideClasses.map(rc => rc.id)}
          // Optional: If vehicle has a 'driver' relation, link it back here
          // driver: userId 
        }
      })

      // 2. Link the new Vehicle to the Driver Profile Component
      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          [driverType] : driverProfileWithSubProfiles[driverType]? {
            id:driverProfileWithSubProfiles[driverType]['id'],
            [vehicleConnectType]: newVehicle.id,
            isActive: true
            } :{
            isActive: true,
            [vehicleConnectType]: newVehicle.id
          },
          assignedVehicle: newVehicle.id, // Linking the ID directly
          vehicles: {connect:[newVehicle.id]},
          onboardingStep: 'review',
          acceptedRideClasses: {connect: rideClasses.map(rc => rc.id)} 
        },
      });

      return ctx.send({ success: true, message: 'Vehicle created and assigned', nextStep: 'review', newVehicle });
    } catch (error) {
      strapi.log.error('Save Vehicle Details Error:', error);
      return ctx.internalServerError('Failed to save vehicle details');
    }
  },

  // 6. Submit for Verification
  async submitForVerification(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile is incomplete');
      }
      if (user?.driverProfile?.verificationStatus === "pending"){
         return ctx.badRequest('Verification request already sent');
      }
      
     const { adminNumbers } = await strapi.db.query("api::phone-numbers-list.phone-numbers-list").findOne({where: { id: 1 }})
     const { adminEmailAddresses } = await strapi.db.query("api::email-addresses-list.email-addresses-list").findOne({where: { id: 1 }})
     
     await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: user.driverProfile.id },
        data: {
          verificationStatus: 'pending', // Mapped to schema enum 'pending'
          // submittedAt: new Date(), // Schema doesn't show 'submittedAt', only 'verifiedAt'. Add to schema if needed.
        },
      })
      try{
         adminEmailAddresses.forEach((email)=>{ 
          SendEmailNotification(email, "a driver is looking for vehicle verification on okrarides, the driver's account id is: "+ctx.state.user.id)
         }) 
      }
      catch(e){
           console.log(e)
      }
      // Notify driver
      socketService.emitNotification(
        userId,
        'driver',
        {
          type: 'account_update',
          title: 'Verification Submitted',
          body: 'Your application has been submitted for review. We will notify you once verification is complete.',
          data: { verificationStatus: 'pending' },
        }
      )
      return ctx.send({ success: true, message: 'Application submitted successfully' });
    } catch (error) {
      strapi.log.error('Submit Verification Error:', error);
      return ctx.internalServerError('Failed to submit application');
    }
  },

  // 7. Get Onboarding Status
  async getOnboardingStatus(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      const profile = user?.driverProfile || {};

      return ctx.send({
        isProfileCreated: !!user?.driverProfile,
        onboardingStatus: profile.verificationStatus || 'not_started',
        currentStep: profile.onboardingStep || 'license', // Ensure 'onboardingStep' exists in schema or handled manually
        
        // Return completeness based on schema fields
        steps: {
          license: !!profile.driverLicenseNumber,
          nationalId: !!profile.nationalIdNumber,
          address: !!profile.proofOfAddress, // Only checking if media is linked
          vehicle: !!profile.assignedVehicle
        }
      });
    } catch (error) {
      strapi.log.error('Get Status Error:', error);
      return ctx.internalServerError('Failed to fetch onboarding status');
    }
  },
  // Get driver's vehicles
   async findDriverVehicle(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const driverProfileWithAssignedVehicle = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        populate: { 
            assignedVehicle: {
                populate: true 
            }
        }
      })

      return ctx.send({success: true, hasVehicle: true, vehicle:driverProfileWithAssignedVehicle.assignedVehicle});
    } catch (error) {
      strapi.log.error('Find vehicles error:', error);
      return ctx.internalServerError('Failed to get vehicles');
    }
  },
  async findDriverVehicles(ctx) {
    try {
      const userId = ctx.state.user.id;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const driverProfileWithVehicles = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        populate: { 
            vehicles: {
                populate: true 
            }
        }
      })

      return ctx.send({success: true, hasVehicle: true, vehicles: driverProfileWithVehicles.vehicles});
    } catch (error) {
      strapi.log.error('Find vehicles error:', error);
      return ctx.internalServerError('Failed to get vehicles');
    }
  },

  // Add vehicle
  async addVehicle(ctx) {
    try {
      const userId = ctx.state.user.id;
      const data = ctx.request.body.data;

      const vehicle = await strapi.db.query('api::vehicle.vehicle').create({
        data: {
          ...data,
          owner: userId,
          verificationStatus: 'not_started',
          isActive: false,
        }
      });

      return ctx.send(vehicle);
    } catch (error) {
      strapi.log.error('Add vehicle error:', error);
      return ctx.internalServerError('Failed to add vehicle');
    }
  },

  // Update vehicle
  async updateDriverVehicle(ctx) {
    try {
      const userId = ctx.state.user.id;
      const data = ctx.request.body.data;

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: { driverProfile: true }
      });

      if (!user?.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

      const driverProfileWithAssignedVehicle = await strapi.db.query('driver-profiles.driver-profile').findOne({
        where: { id: user.driverProfile.id },
        populate: { 
            assignedVehicle: {
                populate: true 
            }
        }
      })

      if (!driverProfileWithAssignedVehicle?.assignedVehicle?.id) {
        return ctx.notFound('Vehicle not found');
      }

      // Update vehicle - preserving existing data
      const updated = await strapi.db.query('api::vehicle.vehicle').update({
        where: { id: driverProfileWithAssignedVehicle.assignedVehicle.id },
        data: {
          ...data,
        }
      });

      return ctx.send(updated);
    } catch (error) {
      strapi.log.error('Update vehicle error:', error);
      return ctx.internalServerError('Failed to update vehicle');
    }
  }
}));
