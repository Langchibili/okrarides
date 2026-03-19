// src/api/ride/controllers/ride.ts
// ============================================

import { factories } from '@strapi/strapi';
import { generateUniqueRideCode }  from '../../../services/generateUniqueRideCode';
import  RideBookingService  from '../../../services/rideBookingService';
import  RiderBlockingService  from '../../../services/riderBlockingService';
import socketService from '../../../services/socketService';
import { getDriverStats, StatPeriod } from '../../../services/driverStatsService';
import { processAffiliatePoints } from '../../../services/affiliateService';
import {
  checkAndApplyRideDiscount,
  recordPromotionUsage,
  applyCodeManually,
} from '../../../services/affiliatePromotionService';

const { emitRatingSubmitted  } = require('../../../utils/socketUtils');

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
interface HandleCompleteTripInput {
  rideId:          string | number;
  driverId:        string | number;
  actualDistance?: number;
  actualDuration?: number;
}

interface HandleCompleteTripResult {
  updatedRide:        Record<string, any>;
  driverEarnings:     number;
  commission:         number;
  floatDeduction:     number;
  isSubscriptionRide: boolean;
  paymentSystemType:  string;
  newFloatBalance:    number;
  newCurrentBalance:  number;
}
async function handleCompleteTrip(
  input: HandleCompleteTripInput
): Promise<HandleCompleteTripResult> {
  const { rideId, driverId, actualDistance, actualDuration } = input;

  const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});

  // Re-fetch ride with latest data (paymentMethod may have been set by payCash just before this call)
  const ride = await strapi.db.query('api::ride.ride').findOne({
    where: { id: rideId },
    populate: ['driver', 'rideClass', 'rider'],
  });

  if (!ride) throw new Error(`Ride ${rideId} not found`);

  // Populate driver with subscription info
  const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: driverId },
    populate: {
      driverProfile: {
        populate: { currentSubscription: true },
      },
    },
  });

  if (!driver?.driverProfile) {
    throw new Error(`Driver profile not found for driver ${driverId}`);
  }

  // ── Payment system context ────────────────────────────────────────────────
  const paymentSystemType     = settings?.paymentSystemType || 'float_based';
  const hasActiveSubscription = isSubscriptionCurrentlyActive(driver.driverProfile);

  const isSubscriptionRide =
    paymentSystemType === 'subscription_based' ||
    (paymentSystemType === 'hybrid' && hasActiveSubscription);

  // ── Commission & earnings ─────────────────────────────────────────────────
  let commission     = 0;
  let floatDeduction = 0;
  let driverEarnings = 0;
  let withdrawableFloatBalance = 0
      
  if (isSubscriptionRide) {
    commission     = 0;
    floatDeduction = 0;
    driverEarnings = ride.totalFare;
  } else {
    if (settings?.commissionType === 'percentage') {
      commission = (ride.totalFare * (settings.defaultCommissionPercentage || 15)) / 100;
    } else if (settings?.commissionType === 'flat_rate') {
      commission = settings.defaultFlatCommission || 0;
    }

    // both payment methods, cash or digital ones, like okrapay incur the same deduction from the driver, because once a driver buys float, we get our money already as a platform, 
    // so if a driver does trips, when they complete rides, we deduct our commission, in that, the driver will need more float to have more ride bookings
    floatDeduction = ride.totalFare + commission;
    driverEarnings = ride.totalFare // so driver earns all the money the rider pays, but due to float deductions, driver makes total float - total rides
  }

  // ── New balances ──────────────────────────────────────────────────────────
  const currentFloat   = driver.driverProfile.floatBalance   || 0;
  const currentBalance = driver.driverProfile.currentBalance || 0;

  let newFloatBalance   = currentFloat;
  let newCurrentBalance = currentBalance;

  if (!isSubscriptionRide) {
    newFloatBalance   = currentFloat - floatDeduction;
    newCurrentBalance = newFloatBalance > 0 ? newFloatBalance : 0;
    // calculate the withdrawableFloatBalance by removing the floatDeduction from it, and if withdrawableFloatBalance is negative or 0, it must be reverted to 0
    withdrawableFloatBalance = driver.driverProfile.withdrawableFloatBalance > 0? driver.driverProfile.withdrawableFloatBalance - floatDeduction : 0
  } else {
    newCurrentBalance = currentBalance + driverEarnings;
  }

  // ── Update ride record ────────────────────────────────────────────────────
  const updatedRide = await strapi.db.query('api::ride.ride').update({
    where: { id: rideId },
    data: {
      rideStatus:          'completed',
      tripCompletedAt:     new Date(),
      actualDistance:      actualDistance || ride.estimatedDistance,
      actualDuration:      actualDuration || ride.estimatedDuration,
      commission,
      driverEarnings,
      commissionDeducted:  !isSubscriptionRide,
      wasSubscriptionRide: isSubscriptionRide,
      paymentStatus:       'completed',
    },
  });

  
  // ── Update driver profile ─────────────────────────────────────────────────
  await strapi.db.query('driver-profiles.driver-profile').update({
    where: { id: driver.driverProfile.id },
    data: {
      isAvailable:    true,
      isEnroute:      false,
      currentRide:    null,
      completedRides: (driver.driverProfile.completedRides || 0) + 1,
      totalRides:     (driver.driverProfile.totalRides     || 0) + 1,
      totalEarnings:  (driver.driverProfile.totalEarnings  || 0) + driverEarnings,
      floatBalance:   newFloatBalance,
      withdrawableFloatBalance: withdrawableFloatBalance > 0? withdrawableFloatBalance : 0, // withdrawableFloatBalance cannot be negative
      currentBalance: newCurrentBalance,
    },
  });

  // ── Ledger entries ────────────────────────────────────────────────────────
  await strapi.db.query('api::ledger-entry.ledger-entry').create({
    data: {
      entryId:      `LE-${Date.now()}`,
      driver:       driverId,
      ride:         rideId,
      type:         isSubscriptionRide
                      ? 'fare_subscription'
                      : ride.paymentMethod === 'cash'
                      ? 'fare_cash'
                      : 'fare_digital',
      amount:       driverEarnings,
      source:       ride.paymentMethod,
      ledgerStatus: 'settled',
    },
  });

  if (floatDeduction > 0) {
    await strapi.db.query('api::ledger-entry.ledger-entry').create({
      data: {
        entryId:      `LE-FD-${Date.now()}`,
        driver:       driverId,
        ride:         rideId,
        type:         'float_deduction',
        amount:       -floatDeduction,
        source:       'system',
        ledgerStatus: 'settled',
      },
    });
  }

  if (commission > 0) {
    await strapi.db.query('api::ledger-entry.ledger-entry').create({
      data: {
        entryId:      `LE-COMM-${Date.now()}`,
        driver:       driverId,
        ride:         rideId,
        type:         'commission',
        amount:       -commission,
        source:       'system',
        ledgerStatus: 'settled',
      },
    });
  }

  strapi.log.info(
    `[handleCompleteTrip] Ride ${rideId} finalised. ` +
    `System: ${paymentSystemType}${isSubscriptionRide ? ' (subscription)' : ''}. ` +
    `Payment: ${ride.paymentMethod}. ` +
    `Fare: ${ride.totalFare}, Commission: ${commission}, ` +
    `FloatDeduction: ${floatDeduction}, DriverEarnings: ${driverEarnings}. ` +
    `NewFloat: ${newFloatBalance}, NewBalance: ${newCurrentBalance}`
  )

  // Award affiliate points to whoever referred this rider
  const riderId = ride.rider?.id ?? ride.rider;
  processAffiliatePoints({
    eventType: 'onRideCompletion',
    triggeringUserId: Number(driverId),
    fare: ride.totalFare,
    rideId: Number(rideId)
  })// fire-and-forget — safe, errors are swallowed internally
  processAffiliatePoints({
    eventType: 'onRideBooking',
    triggeringUserId: Number(riderId),
    rideId: ride.id
  })
   // ── Record affiliate promotion usage on completion ────────────────────
    // appliedAffiliateCode and appliedPromotionId were set at ride creation and
    // stored on the ride record (add them as optional string/integer fields on
    // the ride schema if you want strict persistence; otherwise read from ride data).
    const { appliedAffiliatePromoCode, appliedAffiliatePromotionId } = ride;
    if (appliedAffiliatePromoCode && appliedAffiliatePromotionId) {
      const riderId = ride.rider?.id ?? ride.rider;
      recordPromotionUsage(riderId, appliedAffiliatePromoCode, appliedAffiliatePromotionId)
        .catch((e: any) => strapi.log.warn('[ride:completeTrip] promo usage record failed:', e));
    }
    // ── End affiliate promotion usage recording ───────────────────────────
  return {
    updatedRide,
    driverEarnings,
    commission,
    floatDeduction,
    isSubscriptionRide,
    paymentSystemType,
    newFloatBalance,
    newCurrentBalance,
  }
}
// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Determines whether a driver's subscription is currently valid and unexpired.
 * Checks BOTH the denormalized `subscriptionStatus` field on the driver profile
 * AND the actual `expiresAt` timestamp on the currentSubscription relation.
 *
 * This dual check catches cases where the hourly cron job hasn't yet run but
 * the subscription has already technically passed its expiry time — particularly
 * important in completeTrip where the commission calculation depends on this.
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

// ─────────────────────────────────────────────────────────────────────────────

const toggleDriverProfileOffline = async (ctx)=> {
    try {
      const userId = ctx.state.user.id;
      
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        select: ['id', 'username',"isOnline"], 
        populate: { 
          driverProfile: {
            select: ['id'] 
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

      strapi.eventHub.emit('driver:status:changed', {
        driverId: userId,
        status: 'offline'
      });
    } catch (error) {
      strapi.log.error('Toggle online error:', error);
      return ctx.internalServerError('Failed to update status');
    }
  }

function parseSortParam(sort: any): Record<string, 'asc' | 'desc'> {
  if (!sort) {
    return { createdAt: 'desc' };
  }
  
  if (typeof sort === 'object' && !Array.isArray(sort)) {
    return sort;
  }
  
  if (typeof sort === 'string') {
    const [field, order] = sort.split(':');
    return { [field]: (order as 'asc' | 'desc') || 'asc' };
  }
  
  if (Array.isArray(sort) && sort.length > 0) {
    return parseSortParam(sort[0]);
  }
  
  return { createdAt: 'desc' };
}

export default factories.createCoreController('api::ride.ride',({ strapi }) => ({
async find(ctx) {
  try {
    const query = ctx.query as QueryParams;

    if (query) {
      const orderBy = parseSortParam(query.sort);

      const entities = await strapi.db.query('api::ride.ride').findMany({
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
        },
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
          }
        },
        orderBy,
        limit: query.pagination?.pageSize || 20,
        offset: query.pagination?.page 
          ? (query.pagination.page - 1) * (query.pagination.pageSize || 20) 
          : 0,
      });

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

      const sanitizedEntities = await Promise.all(
        entities.map(entity => this.sanitizeOutput(entity, ctx))
      );

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

    const userId = ctx.state.user.id;
    const isRider = entity.rider?.id === userId || entity.rider === userId;
    const isDriver = entity.driver?.id === userId || entity.driver === userId;

    if (!isRider && !isDriver) {
      return ctx.forbidden('You do not have access to this ride');
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
    
  } catch (error) {
    strapi.log.error('Find one ride error:', error);
    return ctx.internalServerError('Failed to fetch ride');
  }
},

async create(ctx) {
    try {
      const { data } = ctx.request.body;
      const riderId = ctx.state.user.id;

      const rider = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: riderId },
        populate: { riderProfile: true }
      });

      if (!rider?.riderProfile) {
        return ctx.badRequest('Rider profile not found');
      }

      data.rideCode = data.rideCode || await generateUniqueRideCode();

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

      if (data.rideClass && typeof data.rideClass === 'string') {
        const rideClassRecord = await strapi.db.query('api::ride-class.ride-class').findOne({
          where: { name: data.rideClass }
        });
        if (rideClassRecord) {
          data.rideClass = rideClassRecord.id;
        }
      }

      data.rider = riderId;
     
      // ── Affiliate promotion discount ──────────────────────────────────────
      // Check whether the rider has any active ride-discount promotions in their
      // riderProfile.affiliateCodes. If so, apply the best available discount.
      let affiliatePromoDiscount = 0;
      let appliedAffiliateCode: string | null = null;
      let appliedPromotionId: number | null = null;
      let affiliatePromoDescription: string | null = null;

      
     if (data.totalFare || data.estimatedFare) {
      const baseFare = parseFloat(data.totalFare ?? data.estimatedFare ?? 0);
      if (baseFare > 0) {
        const discountResult = await checkAndApplyRideDiscount(riderId, baseFare);
          if (discountResult.discountAmount > 0) {
            affiliatePromoDiscount   = discountResult.discountAmount;
            appliedAffiliateCode     = discountResult.appliedCode;
            appliedPromotionId       = discountResult.promotionId;
            affiliatePromoDescription= discountResult.promotionDescription;

            // Reflect discount in the fare fields being saved
            data.promoDiscount   = (parseFloat(data.promoDiscount ?? 0)) + affiliatePromoDiscount;
            data.totalFare       = discountResult.discountedFare;
            data.subtotal        = discountResult.discountedFare;
          }
        }
      }
      // ── End affiliate promotion discount ──────────────────────────────────
      data.rideStatus = 'pending';
      data.requestedAt = new Date();
      data.requestedDrivers = [];
      data.declinedDrivers = [];
      const ride = await strapi.db.query('api::ride.ride').create({
        data,
        populate: true
      });

      socketService.emitRideRequestCreated(ride);
      strapi.log.info(`Ride ${ride.id} created by rider ${riderId}`);

      const toggleDriverProfileOffline = async () => {
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: riderId },
          populate: {
            driverProfile: { select: ['id'] },
            riderProfile: { select: ['id'] },
            deliveryProfile: { select: ['id'] },
            conductorProfile: { select: ['id'] }
          }
        });

        if (user?.driverProfile) {
          await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: riderId },
            data: {
              isOnline: false,
              activeProfile: 'rider',
              profileActivityStatus: {
                "rider": true,
                "driver": false,
                "delivery": false,
                "conductor": false
              },
              lastSeen: new Date()
            }
          });

          await strapi.db.query('driver-profiles.driver-profile').update({
            where: { id: user.driverProfile.id },
            data: { isOnline: false, isActive: false }
          });

          await strapi.db.query('rider-profiles.rider-profile').update({
            where: { id: user.riderProfile.id },
            data: { isOnline: true, isAvailable: true, isActive: true }
          });

          await strapi.db.query('delivery-profiles.delivery-profile').update({
            where: { id: user.deliveryProfile.id },
            data: { isOnline: false, isAvailable: false, isActive: false }
          });

          await strapi.db.query('conductor-profiles.conductor-profile').update({
            where: { id: user.conductorProfile.id },
            data: { isOnline: false, isAvailable: false, isActive: false }
          });
        }
      };

      await toggleDriverProfileOffline();

      const eligibleDriversResult = await RideBookingService.findEligibleDrivers({
        pickupLocation: data.pickupLocation,
        riderId,
        taxiType: data.taxiType,
        rideClass: data.rideClass
      });

      if (eligibleDriversResult.success && eligibleDriversResult.drivers.length > 0) {
        await RideBookingService.sendRideRequests(ride.id, eligibleDriversResult.drivers);
      } else {
        await strapi.db.query('api::ride.ride').update({
          where: { id: ride.id },
          data: {
            rideStatus: 'no_drivers_available',
            cancelledBy: 'system'
          }
        });
        strapi.log.warn(`No eligible drivers found for ride ${ride.id}`);
      }

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
    const { data } = ctx.request.body;

    const updatedEntity = await strapi.db.query('api::vehicle.vehicle').update({
      where: { id: id },
      data: data,
      populate: true,
    });

    if (!updatedEntity) {
      return ctx.notFound('Vehicle not found');
    }

    const sanitizedEntity = await this.sanitizeOutput(updatedEntity, ctx);
    const transformedResponse = this.transformResponse(sanitizedEntity) 
    const ride = (transformedResponse as any)?.data;
    if (ride?.rideStatus) {
      strapi.eventHub.emit(`ride.rideStatus.${ride.rideStatus}`, { ride });
    }
    return transformedResponse;
  },

 async delete(ctx) {
  const { id } = ctx.params;

  const deletedEntity = await strapi.db.query('api::vehicle.vehicle').delete({
    where: { id: id },
    populate: true,
  });

  if (!deletedEntity) {
    return ctx.notFound('Vehicle not found');
  }
  strapi.eventHub.emit('ride.deleted', { id });
  const sanitizedEntity = await this.sanitizeOutput(deletedEntity, ctx);
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

      if (!pickupLocation || !dropoffLocation) {
        return ctx.badRequest('Pickup and dropoff locations are required');
      }

      const distance = calculateDistance(pickupLocation, dropoffLocation);
      const duration = estimateDuration(distance);

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

      const surgePricing = await strapi.db.query('api::surge-pricing.surge-pricing').findOne({
        where: {
          isActive: true,
          startTime: { $lte: new Date() },
          endTime: { $gte: new Date() },
        },
      });

      const surgeMultiplier = surgePricing?.multiplier || 1;

      const estimates = rideClasses.map((rideClass: any) => {
        const baseFare = rideClass.baseFare;
        const distanceFare = distance * rideClass.perKmRate;
        const timeFare = duration * rideClass.perMinuteRate;
        const subtotal = baseFare + distanceFare + timeFare;
        const surgeFare = subtotal * (surgeMultiplier - 1);
        const totalFare = subtotal + surgeFare;

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

      estimates.sort((a, b) => a.totalFare - b.totalFare);

      return ctx.send({
        estimates,
        route: {
          distance: `${distance.toFixed(1)} km`,
          duration: `${duration} min`,
          polyline: '',
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

          if (ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived') {
            distance = calculateDistance(
              driver.currentLocation,
              ride.pickupLocation
            );
            eta = Math.ceil(distance * 3);
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

      const receipt = {
        rideDetails: {
          rideCode: ride.rideCode,
          date: ride.tripCompletedAt || ride.createdAt,
          rideStatus: ride.rideStatus,
          wasSubscriptionRide: ride.wasSubscriptionRide || false,
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
          commission: parseFloat((ride.commission || 0).toFixed(2)),
          driverEarnings: parseFloat((ride.driverEarnings || 0).toFixed(2)),
          commissionNote: ride.wasSubscriptionRide
            ? 'No commission — subscription plan'
            : `Commission (${ride.commission > 0 ? ((ride.commission / ride.totalFare) * 100).toFixed(0) : 0}%)`,
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
  async downloadReceipt(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user?.id;

      if (!userId) return ctx.unauthorized('Authentication required');

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: {
          rider:     { select: ['id', 'firstName', 'lastName', 'phoneNumber', 'email'] },
          driver:    { select: ['id', 'firstName', 'lastName', 'phoneNumber'] },
          vehicle:   true,
          rideClass: true,
          taxiType:  true,
          promoCode: true,
        },
      });

      if (!ride) return ctx.notFound('Ride not found');

      const isRider  = ride.rider?.id  === userId || ride.rider  === userId;
      const isDriver = ride.driver?.id === userId || ride.driver === userId;
      if (!isRider && !isDriver) return ctx.forbidden('Access denied');

      if (ride.rideStatus !== 'completed') {
        return ctx.badRequest('Receipt is only available for completed rides');
      }

      // ── Lookup driver rating ─────────────────────────────────────────────
      let driverRating = 'N/A';
      if (ride.driver) {
        const driverUser = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: ride.driver.id ?? ride.driver },
          populate: { driverProfile: { select: ['averageRating'] } },
        });
        if (driverUser?.driverProfile?.averageRating != null) {
          driverRating = parseFloat(driverUser.driverProfile.averageRating).toFixed(1);
        }
      }

      // ── Admin settings (platform name, support contact) ──────────────────
      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({}) || {};
      const platformName  = settings.platformName  || 'OkraRides';
      const supportEmail  = settings.supportEmail  || 'support@okrarides.com';
      const supportPhone  = settings.supportPhone  || '';
      const currency      = settings.defaultCurrency?.symbol || 'K';

      const fmt = (n: number) => `${currency}${(n || 0).toFixed(2)}`;

      const dateStr = new Date(ride.tripCompletedAt || ride.createdAt).toLocaleString('en-ZM', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      const distanceStr  = `${(ride.actualDistance  || ride.estimatedDistance  || 0).toFixed(2)} km`;
      const durationStr  = `${(ride.actualDuration   || ride.estimatedDuration  || 0)} min`;
      const paymentLabel = ride.paymentMethod === 'cash' ? 'Cash' : 'OkraPay';

      // ── Fare rows ────────────────────────────────────────────────────────
      const fareRows = [
        ['Base Fare',      fmt(ride.baseFare     || 0)],
        ['Distance Fare',  fmt(ride.distanceFare || 0)],
        ['Time Fare',      fmt(ride.timeFare     || 0)],
        ...(ride.surgeFare     > 0 ? [['Surge',            fmt(ride.surgeFare)]]       : []),
        ...(ride.promoDiscount > 0 ? [['Promo Discount',  `-${fmt(ride.promoDiscount)}`]] : []),
      ];

      const fareRowsHtml = fareRows.map(([label, value]) => `
        <tr>
          <td>${label}</td>
          <td class="amount">${value}</td>
        </tr>`).join('');

      const promoRowHtml = ride.promoCode ? `
        <div class="section">
          <div class="section-title">Promo Applied</div>
          <table>
            <tr><td>Code</td><td class="amount">${ride.promoCode.code}</td></tr>
            <tr><td>Discount</td><td class="amount">-${fmt(ride.promoDiscount || 0)}</td></tr>
          </table>
        </div>` : '';

      const driverHtml = ride.driver ? `
        <div class="section">
          <div class="section-title">Driver Information</div>
          <table>
            <tr><td>Name</td>
                <td class="amount">${ride.driver.firstName || ''} ${ride.driver.lastName || ''}</td></tr>
            <tr><td>Phone</td>
                <td class="amount">${ride.driver.phoneNumber || 'N/A'}</td></tr>
            <tr><td>Rating</td>
                <td class="amount">⭐ ${driverRating}</td></tr>
            ${ride.vehicle ? `
            <tr><td>Vehicle</td>
                <td class="amount">${[ride.vehicle.color, ride.vehicle.make, ride.vehicle.model].filter(Boolean).join(' ')}</td></tr>
            <tr><td>Plate</td>
                <td class="amount">${ride.vehicle.numberPlate || 'N/A'}</td></tr>` : ''}
          </table>
        </div>` : '';

      const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${platformName} Receipt — ${ride.rideCode}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: #1a1a1a;
            background: #f5f5f5;
            padding: 24px;
          }

          .receipt {
            max-width: 480px;
            margin: 0 auto;
            background: #fff;
            border-radius: 16px;
            padding: 32px 28px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10);
          }

          .header {
            text-align: center;
            margin-bottom: 28px;
          }

          .brand {
            font-size: 28px;
            font-weight: 800;
            background: linear-gradient(135deg, #FFC107, #FF9800);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
          }

          .receipt-label {
            font-size: 12px;
            color: #888;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .ride-code {
            text-align: center;
            margin-bottom: 20px;
          }

          .ride-code span {
            display: inline-block;
            background: #f0f0f0;
            border-radius: 8px;
            padding: 6px 16px;
            font-weight: 700;
            font-size: 16px;
            letter-spacing: 1px;
          }

          .total-block {
            text-align: center;
            margin: 20px 0 24px;
            padding: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 12px;
            color: white;
          }

          .total-label { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
          .total-amount { font-size: 36px; font-weight: 800; margin: 6px 0 4px; }
          .total-method { font-size: 13px; opacity: 0.8; }

          .divider {
            border: none;
            border-top: 1px solid #eee;
            margin: 20px 0;
          }

          .section { margin-bottom: 20px; }

          .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 10px;
          }

          table { width: 100%; border-collapse: collapse; }

          td {
            padding: 7px 0;
            vertical-align: top;
            color: #444;
            border-bottom: 1px solid #f5f5f5;
          }

          td.amount {
            text-align: right;
            font-weight: 600;
            color: #1a1a1a;
          }

          .route-item {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
            align-items: flex-start;
          }

          .dot {
            width: 12px; height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 3px;
          }

          .dot.pickup  { background: #4CAF50; }
          .dot.dropoff { background: #F44336; border-radius: 3px; }

          .route-label { font-size: 10px; color: #888; font-weight: 600; text-transform: uppercase; }
          .route-addr  { font-size: 13px; font-weight: 500; margin-top: 2px; }

          .total-row td {
            font-size: 16px;
            font-weight: 800;
            padding-top: 12px;
            border-bottom: none;
          }

          .total-row td.amount { color: #FF9800; }

          .footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }

          .footer p { font-size: 12px; color: #999; line-height: 1.6; }

          .print-btn {
            display: block;
            margin: 28px auto 0;
            padding: 12px 32px;
            background: #FF9800;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: 0.3px;
          }

          .print-btn:hover { background: #F57C00; }

          @media print {
            body { background: white; padding: 0; }
            .receipt { box-shadow: none; border-radius: 0; max-width: 100%; padding: 20px; }
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">

          <div class="header">
            <div class="brand">${platformName}</div>
            <div class="receipt-label">Trip Receipt</div>
          </div>

          <div class="ride-code"><span>${ride.rideCode}</span></div>

          <div class="total-block">
            <div class="total-label">Total Charged</div>
            <div class="total-amount">${fmt(ride.totalFare)}</div>
            <div class="total-method">${paymentLabel} • ${dateStr}</div>
          </div>

          <!-- Route -->
          <div class="section">
            <div class="section-title">Trip Route</div>

            <div class="route-item">
              <div class="dot pickup"></div>
              <div>
                <div class="route-label">Pickup</div>
                <div class="route-addr">${ride.pickupLocation?.address || 'N/A'}</div>
              </div>
            </div>

            <div class="route-item">
              <div class="dot dropoff"></div>
              <div>
                <div class="route-label">Dropoff</div>
                <div class="route-addr">${ride.dropoffLocation?.address || 'N/A'}</div>
              </div>
            </div>
          </div>

          <hr class="divider">

          <!-- Trip Stats -->
          <div class="section">
            <div class="section-title">Trip Details</div>
            <table>
              <tr>
                <td>Distance</td>
                <td class="amount">${distanceStr}</td>
              </tr>
              <tr>
                <td>Duration</td>
                <td class="amount">${durationStr}</td>
              </tr>
              ${ride.rideClass ? `
              <tr>
                <td>Ride Class</td>
                <td class="amount">${ride.rideClass.name}</td>
              </tr>` : ''}
              ${ride.taxiType ? `
              <tr>
                <td>Type</td>
                <td class="amount">${ride.taxiType.name}</td>
              </tr>` : ''}
            </table>
          </div>

          <hr class="divider">

          <!-- Fare Breakdown -->
          <div class="section">
            <div class="section-title">Fare Breakdown</div>
            <table>
              ${fareRowsHtml}
              <tr class="total-row">
                <td>Total</td>
                <td class="amount">${fmt(ride.totalFare)}</td>
              </tr>
            </table>
          </div>

          ${promoRowHtml}

          <hr class="divider">

          <!-- Driver -->
          ${driverHtml}

          ${driverHtml ? '<hr class="divider">' : ''}

          <!-- Payment -->
          <div class="section">
            <div class="section-title">Payment</div>
            <table>
              <tr>
                <td>Method</td>
                <td class="amount">${paymentLabel}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td class="amount">${ride.paymentStatus || 'N/A'}</td>
              </tr>
              ${ride.wasSubscriptionRide ? `
              <tr>
                <td>Note</td>
                <td class="amount" style="color:#4CAF50">Subscription Ride — 0% commission</td>
              </tr>` : ''}
            </table>
          </div>

          <div class="footer">
            <p>
              Thank you for riding with <strong>${platformName}</strong>!<br>
              ${supportEmail ? `Support: ${supportEmail}` : ''}
              ${supportPhone ? ` • ${supportPhone}` : ''}
            </p>
          </div>

        </div>

        <button class="print-btn" onclick="window.print()">
          Save as PDF / Print
        </button>

        <script>
          // Auto-trigger print dialog when opened directly as a download target
          if (window.location.search.includes('auto_print=1')) {
            window.addEventListener('load', () => setTimeout(() => window.print(), 300));
          }
        </script>
      </body>
      </html>`;

      ctx.set('Content-Type', 'text/html; charset=utf-8');
      ctx.set('Content-Disposition', `inline; filename="okrarides-receipt-${ride.rideCode}.html"`);
      ctx.body = html;

    } catch (err: any) {
      strapi.log.error('[Ride:downloadReceipt]', err);
      return ctx.internalServerError(err.message || 'Failed to generate receipt');
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

      const trackableStatuses = ['accepted', 'arrived', 'passenger_onboard'];
      if (!trackableStatuses.includes(ride.rideStatus)) {
        return ctx.badRequest('Ride is not in a trackable state');
      }

      const crypto = require('crypto');
      const trackingToken = crypto.randomBytes(32).toString('hex');

      const baseUrl = strapi.config.get('server.url') || 'http://localhost:1343';
      const trackingUrl = `${baseUrl}/track/${ride.rideCode}/${trackingToken}`;

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

  // ============================================
  // GET ACTIVE RIDE
  // ============================================
  async getActiveRide(ctx) {
    try {
      const userId = ctx.state.user.id;

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

      const riderActiveStatuses = ['pending', 'accepted', 'arrived', 'passenger_onboard'];
      const excludedDriverStatuses = ['completed', 'cancelled', 'no_drivers_available'];

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

  // ============================================
  // Accept ride with subscription / float check
  // ============================================
  async acceptRide(ctx) {
    try {
      const { id } = ctx.params;
      const driverId = ctx.state.user.id;

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

      const requestedDrivers = ride.requestedDrivers || [];
      const wasRequested = requestedDrivers.some(rd => rd.driverId === driverId);

      if (!wasRequested) {
        return ctx.badRequest('You were not requested for this ride');
      }

      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: driverId },
        populate: {
          driverProfile: {
            populate: { assignedVehicle: true }
          }
        }
      });

      if (!driver.driverProfile) {
        return ctx.badRequest('Driver profile not found');
      }

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
        eta: 180,
        distance: 1.5,
      });

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: driverId },
        data: {
          driverProfile: {
            id: driver?.driverProfile?.id,
            isAvailable: false,
            currentRide: id
          }
        }
      })

      const otherDriverIds = requestedDrivers
        .filter(rd => rd.driverId !== driverId)
        .map(rd => rd.driverId);

      if (otherDriverIds.length > 0) {
        socketService.emit('ride:taken', {
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

      const declinedDrivers = ride.declinedDrivers || [];
      if (!declinedDrivers.includes(driverId)) {
        declinedDrivers.push(driverId);
      }

      const requestedDrivers = (ride.requestedDrivers || []).map(rd => {
        if (rd.driverId === driverId) {
          return { ...rd, status: 'declined', declinedAt: new Date().toISOString() };
        }
        return rd;
      });

      // FIX: addTempBlock is async — must await so errors are caught and
      // the block is guaranteed to complete before the response is sent.
      if (ride?.rider?.id) {
        await RiderBlockingService.addTempBlock(ride.rider.id, driverId);
      }
      
      await strapi.db.query('api::ride.ride').update({
        where: { id },
        data: {
          requestedDrivers,
          declinedDrivers
        }
      })

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
      });

      socketService.emitDriverArrived(updatedRide);

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
          driverProfile: {
            select: ['id']
          }
        }
      });

      await strapi.db.query('driver-profiles.driver-profile').update({
        where: { id: driver.driverProfile.id },
        data: {
          isAvailable: false,
          isEnroute: true,
          currentRide: id
        }
      });

      socketService.emitTripStarted(updatedRide);

      return ctx.send(updatedRide);
    } catch (error) {
      strapi.log.error('Start trip error:', error);
      return ctx.internalServerError('Failed to start trip');
    }
  },


  /**
   * POST /api/rides/:id/request-payment
   *
   * Called when the driver taps "Request Payment". Emits a socket event so the
   * rider's device/app is notified and redirected to the pay page.
   *
   * The driver's frontend also emits directly via socket (see active-ride page),
   * but this REST endpoint gives the backend a chance to:
   *  - validate the ride is in the right state
   *  - record the paymentRequestedAt timestamp
   *  - re-emit via the authoritative backend socket if the client emit failed
   */
  async requestPayment(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user?.id;

      if (!userId) return ctx.unauthorized('Authentication required');

      const ride = await strapi.db.query('api::ride.ride').findOne({
        where: { id },
        populate: {
          rider:  { select: ['id'] },
          driver: { select: ['id'] },
        },
      });

      if (!ride) return ctx.notFound('Ride not found');

      const isDriver = ride.driver?.id === userId || ride.driver === userId;
      if (!isDriver) return ctx.forbidden('Only the driver can request payment');

      if (ride.rideStatus !== 'passenger_onboard') {
        return ctx.badRequest('Payment can only be requested while the trip is in progress');
      }

      // Record timestamp
      await strapi.db.query('api::ride.ride').update({
        where: { id },
        data:  { paymentRequestedAt: new Date() },
      });

      const riderId  = ride.rider?.id  ?? ride.rider;
      const driverId = ride.driver?.id ?? ride.driver;

      // Emit via the main socket server so both socket paths are covered
      if (socketService?.emit) {
        socketService.emit('ride:payment:requested', {
          rideId:    ride.id,
          riderId,
          driverId,
          finalFare: ride.totalFare,
          paymentRequestedAt: new Date().toISOString(),
        });
      }

      return ctx.send({ success: true, message: 'Payment request sent to rider' });

    } catch (err: any) {
      strapi.log.error('[Ride:requestPayment]', err);
      return ctx.internalServerError(err.message || 'Failed to request payment');
    }
  },
 async getMyStats(ctx) {
  try {
    const driverId = ctx.state.user.id;
    const period   = (ctx.query.period as string) || 'today';

    const validPeriods: StatPeriod[] = ['today', 'week', 'month', 'year', 'all'];
    if (!validPeriods.includes(period as StatPeriod)) {
      return ctx.badRequest('Invalid period. Use: today | week | month | year | all');
    }

    // ← strapi is passed explicitly so the service stays testable
    const stats = await getDriverStats(strapi, driverId, period as StatPeriod);

    return ctx.send({ success: true, data: stats });
  } catch (error) {
    strapi.log.error('getMyStats error:', error);
    return ctx.internalServerError('Failed to fetch driver stats');
  }
 },
// ════════════════════════════════════════════════════════════════════════════
// 2. completeTrip  (paste inside the controller object)
// ════════════════════════════════════════════════════════════════════════════
async completeTrip(ctx) {
  try {
    const { id } = ctx.params;
    const driverId = ctx.state.user.id;
    const { actualDistance, actualDuration } = ctx.request.body;

    const ride = await strapi.db.query('api::ride.ride').findOne({
      where: { id, driver: driverId },
      populate: ['driver', 'rideClass', 'rider'],
    });

    if (!ride) return ctx.notFound('Ride not found');

    const completableStatuses = ['passenger_onboard', 'awaiting_payment'];
    if (!completableStatuses.includes(ride.rideStatus)) {
      return ctx.badRequest(`Trip cannot be completed from status: ${ride.rideStatus}`);
    }

    // Plain function call — TypeScript knows the exact signature and return type
    const { updatedRide } = await handleCompleteTrip({
      rideId: id,
      driverId,
      actualDistance,
      actualDuration,
    });

    socketService.emitTripCompleted(updatedRide)
    // socketService.emitRatingRequestRider(ride.rider?.id, id, driverId);
    // socketService.emitRatingRequestDriver(driverId, id, ride.rider?.id);

    return ctx.send(updatedRide);
  } catch (error) {
    strapi.log.error('completeTrip error:', error);
    return ctx.internalServerError('Failed to complete trip');
  }
},

// ════════════════════════════════════════════════════════════════════════════
// 3. payCash  (paste inside the controller object)
// ════════════════════════════════════════════════════════════════════════════
async payCash(ctx) {
  try {
    const { id: rideId } = ctx.params;
    const userId = ctx.state.user?.id;

    if (!userId) return ctx.unauthorized('Authentication required');

    const ride = await strapi.db.query('api::ride.ride').findOne({
      where: { id: rideId },
      populate: { rider: true, driver: true },
    });

    if (!ride) return ctx.notFound('Ride not found');

    if (String(ride.rider?.id) !== String(userId)) {
      return ctx.forbidden('You are not the rider of this trip');
    }

    if (ride.paymentStatus === 'completed') {
      return ctx.send({ success: true, message: 'Already paid', alreadyCompleted: true });
    }

    const payableStatuses = ['passenger_onboard', 'awaiting_payment'];
    if (!payableStatuses.includes(ride.rideStatus)) {
      return ctx.badRequest(`Ride cannot be paid in status: ${ride.rideStatus}`);
    }

    if (!ride.driver?.id) {
      return ctx.badRequest('No driver assigned to this ride');
    }

    // Set paymentMethod to 'cash' before the helper re-fetches the ride,
    // so the float-deduction formula inside handleCompleteTrip uses the correct path.
    await strapi.db.query('api::ride.ride').update({
      where: { id: rideId },
      data:  { paymentMethod: 'cash' },
    });

    // Plain function call — no `this`, no Strapi signature constraint
    const { updatedRide } = await handleCompleteTrip({
      rideId,
      driverId: ride.driver.id,
      // actualDistance / actualDuration fall back to estimated values inside the helper
    })

    // Transaction record
    try {
      await strapi.db.query('api::transaction.transaction').create({
        data: {
          user:              ride.rider?.id,
          ride:              rideId,
          type:              'ride_payment',
          paymentMethod:     'cash',
          amount:            ride.totalFare ?? ride.estimatedFare ?? 0,
          transactionStatus: 'completed',
          notes:             `Cash payment for ride #${ride.rideCode ?? rideId}`,
          processedAt:       new Date().toISOString(),
        },
      });
    } catch (txErr) {
      strapi.log.warn('[payCash] Failed to create transaction record:', txErr.message);
    }

    const socketService  = strapi.service('api::socket.socket');
    const now            = new Date().toISOString();

    const paymentPayload = {
      rideId,
      riderId:       ride.rider?.id,
      driverId:      ride.driver?.id,
      amount:        ride.totalFare ?? ride.estimatedFare ?? 0,
      method:        'cash',
      rideStatus:    'completed',
      paymentStatus: 'completed',
      paidAt:        now,
    };

    try {
      socketService.emitPaymentReceived(
        rideId,
        ride.rider?.id,
        ride.driver?.id,
        ride.totalFare ?? ride.estimatedFare ?? 0,
        'cash',
      );
    } catch (emitErr) {
      strapi.log.warn('[payCash] Socket emit error:', emitErr.message);
    }

    // socketService.emitTripCompleted(updatedRide)
    // socketService?.emitRatingRequestRider?.(ride.rider?.id,  rideId, ride.driver?.id);
    // socketService?.emitRatingRequestDriver?.(ride.driver?.id, rideId, ride.rider?.id);

    return ctx.send({
      success:       true,
      message:       'Cash payment recorded. Ride completed.',
      rideStatus:    'completed',
      paymentStatus: 'completed',
      paymentMethod: 'cash',
      paidAt:        now,
    });
  } catch (error) {
    strapi.log.error('payCash error:', error);
    return ctx.internalServerError('Failed to record cash payment');
  }
},


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

      if (ride.driver && ride.rideStatus === 'accepted') {
        // FIX: addTempBlock is async — must await so errors are caught and
        // the block is guaranteed to complete before the response is sent.
        await RiderBlockingService.addTempBlock(ride.rider.id, ride.driver.id);
        strapi.log.info(`Driver ${ride.driver.id} temp blocked for rider ${ride.rider.id} due to cancellation`);
      }

      if (ride.driver) {
        const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: ride.driver.id },
          populate: {
            driverProfile: {
              select: ['id', 'cancelledRides']
            }
          }
        });

        await strapi.db.query('driver-profiles.driver-profile').update({
          where: { id: driver.driverProfile.id },
          data: {
            isAvailable: true,
            isEnroute: false,
            currentRide: null,
            cancelledRides: (driver.driverProfile.cancelledRides || 0) + 1
          }
        });
      }

      socketService.emitRideCancelled(updatedRide, cancelledBy, reason, cancellationFee);

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

      if (!rating || rating < 1 || rating > 5) {
        return ctx.badRequest('Rating must be between 1 and 5');
      }

      if (!ratedBy || !['rider', 'driver'].includes(ratedBy)) {
        return ctx.badRequest('ratedBy must be either "rider" or "driver"');
      }

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

      if (ride.rideStatus !== 'completed') {
        return ctx.badRequest('Can only rate completed rides');
      }

      const isRider = ride.rider?.id === userId;
      const isDriver = ride.driver?.id === userId;

      if (!isRider && !isDriver) {
        return ctx.forbidden('You are not authorized to rate this ride');
      }

      if ((ratedBy === 'rider' && !isRider) || (ratedBy === 'driver' && !isDriver)) {
        return ctx.badRequest('ratedBy does not match your user type');
      }

      const existingRating = await strapi.db.query('api::rating.rating').findOne({
        where: {
          ride: id,
          ratedBy: ratedBy
        }
      });

      if (existingRating) {
        return ctx.badRequest('You have already rated this ride');
      }

      let ratedUserId;
      let ratedUserType;
      
      if (ratedBy === 'rider') {
        ratedUserId = ride.driver?.id;
        ratedUserType = 'driver';
      } else {
        ratedUserId = ride.rider?.id;
        ratedUserType = 'rider';
      }

      if (!ratedUserId) {
        return ctx.badRequest('Cannot determine who to rate');
      }

      const newRating = await strapi.db.query('api::rating.rating').create({
        data: {
          ride: id,
          ratedUser: ratedUserId,
          rating: rating,
          review: review,
          tags: tags,
          ratedBy: userId
        }
      });

      if (ratedUserType === 'driver') {
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

function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371;
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

function estimateDuration(distanceKm: number): number {
  const averageSpeedKmh = 30;
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.ceil(hours * 60);
  return minutes;
}















