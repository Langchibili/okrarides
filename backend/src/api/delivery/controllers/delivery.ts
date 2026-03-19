// ============================================================
// src/api/delivery/controllers/delivery.ts
//
// Full delivery booking flow controller.
// Mirrors ride.ts controller but targets:
//   - deliveries collection (api::delivery.delivery)
//   - deliveryProfile for driver availability
//   - package collection for package management
// ============================================================

import { factories } from '@strapi/strapi';
import { generateUniqueRideCode } from '../../../services/generateUniqueRideCode';
import DeliveryBookingService from '../../../services/deliveryBookingService';
import RiderBlockingService from '../../../services/riderBlockingService';
import socketService from '../../../services/socketService';
import { processAffiliatePoints } from '../../../services/affiliateService';
import { checkAndApplyDeliveryDiscount } from '../../../services/affiliatePromotionService';
// ─── Complete delivery helper ─────────────────────────────────────────────
interface HandleCompleteDeliveryInput {
  deliveryId: string | number;
  delivererId: string | number;
  actualDistance?: number;
  actualDuration?: number;
}

async function handleCompleteDelivery(input: HandleCompleteDeliveryInput) {
  const { deliveryId, delivererId, actualDistance, actualDuration } = input;

  const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({});

  const delivery = await strapi.db.query('api::delivery.delivery').findOne({
    where: { id: deliveryId },
    populate: ['deliverer', 'sender', 'package'],
  });

  if (!delivery) throw new Error(`Delivery ${deliveryId} not found`);

  const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: delivererId },
    populate: {
       driverProfile: {
        select: ['id', 'floatBalance', 'withdrawableFloatBalance'],
        populate: { currentSubscription: true },
      },
      // delivery-specific counters / balance live on deliveryProfile
      deliveryProfile: {
        select: ['id', 'currentBalance', 'completedDeliveries', 'totalDeliveries', 'totalEarnings'],
      }
    },
  });

  if (!driver?.driverProfile) throw new Error(`Driver profile not found for deliverer ${delivererId}`);

  // Payment system
  const paymentSystemType = settings?.paymentSystemType || 'float_based';
  const hasActiveSubscription = isSubscriptionCurrentlyActiveLocal(driver.driverProfile);
  const isSubscriptionDelivery =
    paymentSystemType === 'subscription_based' ||
    (paymentSystemType === 'hybrid' && hasActiveSubscription);

  // Commission & earnings — same logic as handleCompleteTrip
  let commission = 0;
  let floatDeduction = 0;
  let driverEarnings = 0;
  let withdrawableFloatBalance = 0;

  if (isSubscriptionDelivery) {
    commission = 0;
    floatDeduction = 0;
    driverEarnings = delivery.totalFare;
  } else {
    if (settings?.commissionType === 'percentage') {
      commission = (delivery.totalFare * (settings.defaultCommissionPercentage || 15)) / 100;
    } else if (settings?.commissionType === 'flat_rate') {
      commission = settings.defaultFlatCommission || 0;
    }
    floatDeduction = delivery.totalFare + commission;
    driverEarnings = delivery.totalFare;
  }

  // Balances — float lives on driverProfile
  const currentFloat   = driver.driverProfile.floatBalance || 0;
  const currentBalance = driver.deliveryProfile?.currentBalance || 0;
  let newFloatBalance    = currentFloat;
  let newCurrentBalance  = currentBalance;

  if (!isSubscriptionDelivery) {
    newFloatBalance = currentFloat - floatDeduction;
    newCurrentBalance = newFloatBalance > 0 ? newFloatBalance : 0;
    withdrawableFloatBalance =
      driver.driverProfile.withdrawableFloatBalance > 0
        ? driver.driverProfile.withdrawableFloatBalance - floatDeduction
        : 0;
  } else {
    newCurrentBalance = currentBalance + driverEarnings;
  }

  // Update delivery record
  const updatedDelivery = await strapi.db.query('api::delivery.delivery').update({
    where: { id: deliveryId },
    data: {
      rideStatus:        'completed',
      tripCompletedAt:   new Date(),
      actualDistance:    actualDistance || delivery.estimatedDistance,
      actualDuration:    actualDuration || delivery.estimatedDuration,
      commission,
      driverEarnings,
      commissionDeducted:  !isSubscriptionDelivery,
      wasSubscriptionRide: isSubscriptionDelivery,
      paymentStatus:       'completed',
    },
  });

  // Update driverProfile float balance
  await strapi.db.query('driver-profiles.driver-profile').update({
    where: { id: driver.driverProfile.id },
    data: {
      floatBalance:              newFloatBalance,
      withdrawableFloatBalance:  withdrawableFloatBalance > 0 ? withdrawableFloatBalance : 0,
    },
  });

  // Update deliveryProfile stats
  if (driver.deliveryProfile) {
    await strapi.db.query('delivery-profiles.delivery-profile').update({
      where: { id: driver.deliveryProfile.id },
      data: {
        isAvailable:          true,
        isEnroute:            false,
        currentDelivery:      null,
        completedDeliveries: (driver.deliveryProfile.completedDeliveries || 0) + 1,
        totalDeliveries:     (driver.deliveryProfile.totalDeliveries || 0) + 1,
        totalEarnings:       (driver.deliveryProfile.totalEarnings || 0) + driverEarnings,
        currentBalance:       newCurrentBalance,
      },
    });
  }

  // Update package status to delivered
  if (delivery.package?.id) {
    await strapi.db.query('api::package.package').update({
      where: { id: delivery.package.id },
      data: {
        packageStatus: 'delivered',
        deliveredAt:   new Date(),
      },
    });
  }

  // Ledger entries
  await strapi.db.query('api::ledger-entry.ledger-entry').create({
    data: {
      entryId: `LE-DEL-${Date.now()}`,
      driver:  delivererId,
      ride:    deliveryId, // ledger points to delivery via ride FK
      type:    isSubscriptionDelivery ? 'fare' : delivery.paymentMethod === 'cash' ? 'fare' : 'fare',
      amount:  driverEarnings,
      source:  delivery.paymentMethod,
      ledgerStatus: 'settled',
    },
  });

  if (floatDeduction > 0) {
    await strapi.db.query('api::ledger-entry.ledger-entry').create({
      data: {
        entryId: `LE-DEL-FD-${Date.now()}`,
        driver:  delivererId,
        type:    'float_deduction',
        amount:  -floatDeduction,
        source:  'system',
        ledgerStatus: 'settled',
      },
    });
  }

  if (commission > 0) {
    await strapi.db.query('api::ledger-entry.ledger-entry').create({
      data: {
        entryId: `LE-DEL-COMM-${Date.now()}`,
        driver:  delivererId,
        type:    'commission',
        amount:  -commission,
        source:  'system',
        ledgerStatus: 'settled',
      },
    });
  }

strapi.log.info(
  `[handleCompleteDelivery] Delivery ${deliveryId} finalised. ` +
  `System: ${paymentSystemType}${isSubscriptionDelivery ? ' (subscription)' : ''}. ` +
  `Fare: ${delivery.totalFare}, Commission: ${commission}, ` +
  `FloatDeduction: ${floatDeduction}, DriverEarnings: ${driverEarnings}.`
)

processAffiliatePoints({
    eventType: 'onDeliveryCompletion',
    triggeringUserId: Number(delivererId),
    fare: delivery.totalFare,
    deliveryId: Number(deliveryId)
})
// fire-and-forget — safe, errors are swallowed internally
processAffiliatePoints({
    eventType: 'onDeliveryBooking',
    triggeringUserId: Number(delivery.sender.id),
    deliveryId: Number(delivery.id)
})

  return {
    updatedDelivery,
    driverEarnings,
    commission,
    floatDeduction,
    isSubscriptionDelivery,
    paymentSystemType,
    newFloatBalance,
    newCurrentBalance,
  };
}

function isSubscriptionCurrentlyActiveLocal(driverProfile: any): boolean {
  const profileStatus = driverProfile?.subscriptionStatus;
  if (!['active', 'trial'].includes(profileStatus)) return false;
  const sub = driverProfile?.currentSubscription;
  if (!sub) return profileStatus === 'active' || profileStatus === 'trial';
  const subStatus = sub.subscriptionStatus;
  if (!['active', 'trial'].includes(subStatus)) return false;
  if (sub.expiresAt) {
    const now = new Date();
    if (now > new Date(sub.expiresAt)) return false;
  }
  return true;
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = deg2rad(point2.lat - point1.lat);
  const dLon = deg2rad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(point1.lat)) * Math.cos(deg2rad(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number { return deg * (Math.PI / 180); }
function estimateDuration(distanceKm: number): number { return Math.ceil((distanceKm / 30) * 60); }

// ─── Controller ──────────────────────────────────────────────────────────────
export default factories.createCoreController('api::delivery.delivery', ({ strapi }) => ({

  // ─── List deliveries ──────────────────────────────────────────────────────
  async find(ctx) {
    try {
      const query: any = ctx.query;
      const userId = ctx.state.user.id;

      const pageSize = query.pagination?.pageSize || 20;
      const page     = query.pagination?.page || 1;

      const where: any = {
        $or: [{ sender: userId }, { deliverer: userId }],
      };
      if (query.filters?.rideStatus?.$eq) where.rideStatus = query.filters.rideStatus.$eq;

      const entities = await strapi.db.query('api::delivery.delivery').findMany({
        where,
        populate: {
          sender:   { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
          deliverer: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'], populate: { deliveryProfile: { fields: ['id', 'averageRating'] } } },
          package:  true,
        },
        orderBy: { createdAt: 'desc' },
        limit:   pageSize,
        offset:  (page - 1) * pageSize,
      });

      const total = await strapi.db.query('api::delivery.delivery').count({ where });
      const sanitized = await Promise.all(entities.map((e) => this.sanitizeOutput(e, ctx)));

      return {
        data: sanitized,
        meta: {
          pagination: {
            page, pageSize,
            pageCount: Math.ceil(total / pageSize),
            total,
          },
        },
      };
    } catch (error) {
      strapi.log.error('[Delivery] find error:', error);
      return ctx.internalServerError('Failed to fetch deliveries');
    }
  },

  // ─── Single delivery ──────────────────────────────────────────────────────
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const entity = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id },
        populate: {
          sender:    { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
          deliverer: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'], populate: { deliveryProfile: { fields: ['id', 'averageRating'] } } },
          package:   true,
          vehicle:   true,
        },
      });

      if (!entity) return ctx.notFound('Delivery not found');

      const isSender   = entity.sender?.id === userId || entity.sender === userId;
      const isDeliverer = entity.deliverer?.id === userId || entity.deliverer === userId;
      if (!isSender && !isDeliverer) return ctx.forbidden('You do not have access to this delivery');

      const sanitized = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitized);
    } catch (error) {
      strapi.log.error('[Delivery] findOne error:', error);
      return ctx.internalServerError('Failed to fetch delivery');
    }
  },

  // ─── Create delivery request ──────────────────────────────────────────────
  async create(ctx) {
    try {
      const { data } = ctx.request.body;
      const senderId = ctx.state.user.id;

      const sender = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: senderId },
        populate: { riderProfile: true },
      });

      if (!sender) return ctx.badRequest('Sender not found');

      data.rideCode    = data.rideCode || await generateUniqueRideCode({ prefix: 'DEL' });
      data.sender      = senderId;
      // ── Affiliate promotion discount (delivery) ───────────────────────────
      let affiliateDeliveryDiscount = 0;
      if (data.totalFare || data.estimatedFare) {
      const baseFare = parseFloat(data.totalFare ?? data.estimatedFare ?? 0);
      if (baseFare > 0) {
            const discountResult = await checkAndApplyDeliveryDiscount(senderId, baseFare);
            if (discountResult.discountAmount > 0) {
            data.promoDiscount                = (parseFloat(data.promoDiscount ?? 0)) + discountResult.discountAmount;
            data.totalFare                    = discountResult.discountedFare;
            data.subtotal                     = discountResult.discountedFare;
            data.appliedAffiliatePromoCode    = discountResult.appliedCode;
            data.appliedAffiliatePromotionId  = discountResult.promotionId;
            }
        }
      }
      // ── End affiliate promotion discount (delivery) ───────────────────────
      data.rideStatus  = 'pending';
      data.requestedAt = new Date();
      data.isDelivery  = true;
      data.rideType    = 'delivery';
      data.requestedDrivers        = [];
      data.declinedDrivers         = [];

      // Validate package if provided
      if (data.package) {
        const pkg = await strapi.db.query('api::package.package').findOne({ where: { id: data.package } });
        if (!pkg) return ctx.badRequest('Package not found');
        // Use package recipient location as dropoff if not provided
        if (!data.dropoffLocation && pkg.recipient?.location) {
          data.dropoffLocation = pkg.recipient.location;
        }
      }

      const delivery = await strapi.db.query('api::delivery.delivery').create({
        data,
        populate: true,
      });

      socketService.emit('delivery:request:created', {
        deliveryId:     delivery.id,
        senderId,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        estimatedFare:  delivery.totalFare,
      });

      strapi.log.info(`[Delivery] Delivery ${delivery.id} created by sender ${senderId}`);

      // Find eligible delivery drivers
      const eligibleResult = await DeliveryBookingService.findEligibleDeliveryDrivers({
        pickupLocation:        data.pickupLocation,
        senderId,
        deliveryClassName:     data.deliveryClassName     ?? null,
        vehicleTypePreference: data.vehicleTypePreference ?? null,
        packageType:           data.packageType           ?? null,
      });

      if (eligibleResult.success && eligibleResult.drivers.length > 0) {
        await DeliveryBookingService.sendDeliveryRequests(delivery.id, eligibleResult.drivers);
      } else {
        await strapi.db.query('api::delivery.delivery').update({
          where: { id: delivery.id },
          data: { rideStatus: 'no_drivers_available', cancelledBy: 'system' },
        });
        strapi.log.warn(`[Delivery] No eligible delivery drivers found for delivery ${delivery.id}`);
      }

      return ctx.send({
        success: true,
        data: delivery,
        driversNotified: eligibleResult.drivers?.length || 0,
      });
    } catch (error) {
      strapi.log.error('[Delivery] create error:', error);
      return ctx.internalServerError('Failed to create delivery');
    }
  },

  // ─── Estimate delivery fare ───────────────────────────────────────────────
  async estimate(ctx) {
    try {
      const {
        pickupLocation,
        dropoffLocation,
        deliveryClassName,    // 'standard' | 'midsize' | 'big' | 'large'
        isFragile = false,
        weightKg  = null,
        vehicleTypePreference = null,
      } = ctx.request.body;

      if (!pickupLocation || !dropoffLocation) {
        return ctx.badRequest('Pickup and dropoff locations are required');
      }

      // Distance / duration
      const distance = calculateDistance(pickupLocation, dropoffLocation);
      const duration = estimateDuration(distance);

      // Load delivery classes — optionally filtered by name
      const classWhere: any = { isActive: true };
      if (deliveryClassName) classWhere.name = deliveryClassName;

      const deliveryClasses = await strapi.db.query('api::delivery-class.delivery-class').findMany({
        where: classWhere,
        orderBy: { displayOrder: 'asc' },
      });

      if (!deliveryClasses.length) {
        return ctx.badRequest('No matching delivery class found');
      }

      const estimates = deliveryClasses.map((dc: any) => {
        const baseFare     = dc.baseFare     || 0;
        const distanceFare = distance * (dc.perKmRate      || 0);
        const timeFare     = duration * (dc.perMinuteRate  || 0);
        let   subtotal     = baseFare + distanceFare + timeFare;

        // Fragile surcharge
        const fragileSurcharge = isFragile ? (dc.extraChargeForFragileItem || 0) : 0;
        subtotal += fragileSurcharge;

        // Extra weight charge — only if weightKg provided and class defines a threshold
        // (Strapi schema doesn't have a threshold field yet, so we apply per-extra-kg
        // as a flat multiplier when weightKg > maxWeightKg)
        let extraWeightCharge = 0;
        if (weightKg && dc.maxWeightKg && weightKg > dc.maxWeightKg && dc.extraWeightCharge) {
          const extraKg     = weightKg - dc.maxWeightKg;
          extraWeightCharge = extraKg * dc.extraWeightCharge;
          subtotal         += extraWeightCharge;
        }

        // Ensure minimum fare
        const totalFare = Math.max(subtotal, dc.minimumFare || 0);

        return {
          deliveryClassId:   dc.id,
          deliveryClassName: dc.name,
          name:              dc.name,
          description:       dc.description,
          maxWeightKg:       dc.maxWeightKg,
          baseFare:          parseFloat(baseFare.toFixed(2)),
          distanceFare:      parseFloat(distanceFare.toFixed(2)),
          timeFare:          parseFloat(timeFare.toFixed(2)),
          fragileSurcharge:  parseFloat(fragileSurcharge.toFixed(2)),
          extraWeightCharge: parseFloat(extraWeightCharge.toFixed(2)),
          subtotal:          parseFloat(subtotal.toFixed(2)),
          totalFare:         parseFloat(totalFare.toFixed(2)),
          estimatedDistance: parseFloat(distance.toFixed(2)),
          estimatedDuration: duration,
        };
      });

      return ctx.send({
        estimates,
        vehicleTypePreference,  // echoed back so the booking payload carries it
        route: {
          distance: `${distance.toFixed(1)} km`,
          duration: `${duration} min`,
        },
      });
    } catch (error) {
      strapi.log.error('[Delivery] estimate error:', error);
      return ctx.internalServerError('Failed to calculate delivery estimate');
    }
  },

  // ─── Get active delivery (sender or deliverer) ────────────────────────────
  async getActiveDelivery(ctx) {
    try {
      const userId = ctx.state.user.id;
      const activeStatuses = ['pending', 'accepted', 'arrived', 'passenger_onboard'];

      // Check as sender
      const senderDelivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { sender: userId, rideStatus: { $in: activeStatuses } },
        populate: {
          sender:    { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
          deliverer: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'], populate: { deliveryProfile: true } },
          package:   true,
          vehicle:   true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (senderDelivery) {
        return ctx.send({ success: true, data: senderDelivery, userRole: 'sender', message: 'Active delivery found as sender' });
      }

      // Check as deliverer
      const delivererDelivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: {
          deliverer: userId,
          rideStatus: { $notIn: ['completed', 'cancelled', 'no_drivers_available'] },
        },
        populate: {
          sender:    { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
          deliverer: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'], populate: { deliveryProfile: true } },
          package:   true,
          vehicle:   true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (delivererDelivery) {
        return ctx.send({ success: true, data: delivererDelivery, userRole: 'deliverer', message: 'Active delivery found as deliverer' });
      }

      return ctx.send({ success: true, data: null, userRole: null, message: 'No active deliveries' });
    } catch (error) {
      strapi.log.error('[Delivery] getActiveDelivery error:', error);
      return ctx.internalServerError('Failed to get active delivery');
    }
  },

  // ─── Accept delivery ──────────────────────────────────────────────────────
  async acceptDelivery(ctx) {
    try {
      const { id } = ctx.params;
      const delivererId = ctx.state.user.id;

      const eligibilityCheck = await DeliveryBookingService.canDriverAcceptDeliveries(delivererId);
      if (!eligibilityCheck.canAccept) return ctx.forbidden(eligibilityCheck.reason);

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id },
        populate: ['sender', 'deliverer'],
      });

      if (!delivery) return ctx.notFound('Delivery not found');
      if (delivery.rideStatus !== 'pending') return ctx.badRequest('Delivery is not available');

      const requestedDrivers: any[] = delivery.requestedDrivers || [];
      const wasRequested = requestedDrivers.some((rd: any) => rd.driverId === delivererId);
      if (!wasRequested) return ctx.badRequest('You were not requested for this delivery');

      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: delivererId },
        populate: {
          deliveryProfile: { populate: { taxi: { populate: { vehicle: true } }, motorbike: { populate: { vehicle: true } }, motorcycle: { populate: { vehicle: true } }, truck: { populate: { vehicle: true } } } },
        },
      })

      if (!driver?.deliveryProfile) return ctx.badRequest('Delivery profile not found');

      // Get the active vehicle
      const activeType = driver.deliveryProfile.activeVehicleType;
      const vehicleId  = activeType && activeType !== 'none' ? driver.deliveryProfile[activeType]?.vehicle?.id : null;

      const updatedDelivery = await strapi.db.query('api::delivery.delivery').update({
        where: { id },
        data: {
          rideStatus:  'accepted',
          deliverer:   delivererId,
          vehicle:     vehicleId || null,
          acceptedAt:  new Date(),
        },
        populate: true,
      });

      // Update deliveryProfile — mark as unavailable and set currentDelivery
      await strapi.db.query('delivery-profiles.delivery-profile').update({
        where: { id: driver.deliveryProfile.id },
        data: { isAvailable: false, currentDelivery: id },
      });

      socketService.emit('delivery:accepted', {
        deliveryId: updatedDelivery.id,
        delivererId,
        deliverer: {
          id:          driver.id,
          firstName:   driver.firstName,
          lastName:    driver.lastName,
          phoneNumber: driver.phoneNumber,
          deliveryProfile: { averageRating: driver.deliveryProfile.averageRating },
        },
        vehicle: vehicleId ? { id: vehicleId } : null,
        eta: 180,
        distance: 1.5,
      });

      // Notify other requested drivers that this delivery was taken
      const otherDriverIds = requestedDrivers
        .filter((rd: any) => rd.driverId !== delivererId)
        .map((rd: any) => rd.driverId);

      if (otherDriverIds.length > 0) {
        socketService.emit('delivery:taken', { deliveryId: id, driverIds: otherDriverIds });
      }

      strapi.log.info(`[Delivery] Delivery ${id} accepted by deliverer ${delivererId}`);
      return ctx.send({ success: true, data: updatedDelivery });
    } catch (error) {
      strapi.log.error('[Delivery] acceptDelivery error:', error);
      return ctx.internalServerError('Failed to accept delivery');
    }
  },

  // ─── Decline delivery ─────────────────────────────────────────────────────
  async declineDelivery(ctx) {
    try {
      const { id } = ctx.params;
      const delivererId = ctx.state.user.id;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id },
        populate: ['sender'],
      });

      if (!delivery) return ctx.notFound('Delivery not found');

      const declinedDrivers: any[] = delivery.declinedDrivers || [];
      if (!declinedDrivers.includes(delivererId)) declinedDrivers.push(delivererId);

      const requestedDrivers = (delivery.requestedDrivers || []).map((rd: any) => {
        if (rd.driverId === delivererId) {
          return { ...rd, status: 'declined', declinedAt: new Date().toISOString() };
        }
        return rd;
      });

      if (delivery.sender?.id) {
        await RiderBlockingService.addTempBlock(delivery.sender.id, delivererId);
      }

      await strapi.db.query('api::delivery.delivery').update({
        where: { id },
        data: { requestedDrivers, declinedDrivers },
      });

      strapi.log.info(`[Delivery] Driver ${delivererId} declined delivery ${id}`);
      return ctx.send({ success: true, message: 'Delivery declined successfully' });
    } catch (error) {
      strapi.log.error('[Delivery] declineDelivery error:', error);
      return ctx.internalServerError('Failed to decline delivery');
    }
  },

  // ─── Confirm arrival at pickup ────────────────────────────────────────────
  async confirmArrival(ctx) {
    try {
      const { id } = ctx.params;
      const delivererId = ctx.state.user.id;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id, deliverer: delivererId },
      });

      if (!delivery) return ctx.notFound('Delivery not found');
      if (delivery.rideStatus !== 'accepted') return ctx.badRequest('Invalid delivery status');

      const updated = await strapi.db.query('api::delivery.delivery').update({
        where: { id },
        data: { rideStatus: 'arrived', arrivedAt: new Date() },
      });

      socketService.emit('delivery:driver:arrived', {
        deliveryId: updated.id,
        delivererId,
        arrivedAt: updated.arrivedAt,
      });

      return ctx.send(updated);
    } catch (error) {
      strapi.log.error('[Delivery] confirmArrival error:', error);
      return ctx.internalServerError('Failed to confirm arrival');
    }
  },

  // ─── Start delivery (package picked up) ──────────────────────────────────
  async startDelivery(ctx) {
    try {
      const { id } = ctx.params;
      const delivererId = ctx.state.user.id;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id, deliverer: delivererId },
        populate: ['package'],
      });

      if (!delivery) return ctx.notFound('Delivery not found');
      if (delivery.rideStatus !== 'arrived') return ctx.badRequest('Must confirm arrival first');

      // passenger_onboard = package picked up / in transit
      const updated = await strapi.db.query('api::delivery.delivery').update({
        where: { id },
        data: { rideStatus: 'passenger_onboard', tripStartedAt: new Date() },
      });

      // Update package status to picked_up
      if (delivery.package?.id) {
        await strapi.db.query('api::package.package').update({
          where: { id: delivery.package.id },
          data: { packageStatus: 'picked_up', pickedUpAt: new Date() },
        });
      }

      // Update deliveryProfile — mark as en-route
      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: delivererId },
        populate: { deliveryProfile: { select: ['id'] } },
      });

      if (driver?.deliveryProfile) {
        await strapi.db.query('delivery-profiles.delivery-profile').update({
          where: { id: driver.deliveryProfile.id },
          data: { isAvailable: false, isEnroute: true, currentDelivery: id },
        });
      }

      socketService.emit('delivery:started', {
        deliveryId: updated.id,
        delivererId,
        tripStartedAt: updated.tripStartedAt,
      });

      return ctx.send(updated);
    } catch (error) {
      strapi.log.error('[Delivery] startDelivery error:', error);
      return ctx.internalServerError('Failed to start delivery');
    }
  },

  // ─── Request payment ──────────────────────────────────────────────────────
  async requestPayment(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id },
        populate: { sender: { select: ['id'] }, deliverer: { select: ['id'] } },
      });

      if (!delivery) return ctx.notFound('Delivery not found');

      const isDeliverer = delivery.deliverer?.id === userId || delivery.deliverer === userId;
      if (!isDeliverer) return ctx.forbidden('Only the deliverer can request payment');

      if (delivery.rideStatus !== 'passenger_onboard') {
        return ctx.badRequest('Payment can only be requested while the package is in transit');
      }

      await strapi.db.query('api::delivery.delivery').update({
        where: { id },
        data: { paymentRequestedAt: new Date() },
      });

      const senderId = delivery.sender?.id ?? delivery.sender;

      if (socketService?.emit) {
        socketService.emit('delivery:payment:requested', {
          deliveryId: delivery.id,
          senderId,
          delivererId: userId,
          finalFare: delivery.totalFare,
          paymentRequestedAt: new Date().toISOString(),
        });
      }

      return ctx.send({ success: true, message: 'Payment request sent to sender' });
    } catch (error: any) {
      strapi.log.error('[Delivery] requestPayment error:', error);
      return ctx.internalServerError(error.message || 'Failed to request payment');
    }
  },

  // ─── Pay cash ─────────────────────────────────────────────────────────────
  async payCash(ctx) {
    try {
      const { id: deliveryId } = ctx.params;
      const userId = ctx.state.user.id;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id: deliveryId },
        populate: { sender: true, deliverer: true },
      });

      if (!delivery) return ctx.notFound('Delivery not found');

      if (String(delivery.sender?.id) !== String(userId)) {
        return ctx.forbidden('You are not the sender of this delivery');
      }

      if (delivery.paymentStatus === 'completed') {
        return ctx.send({ success: true, message: 'Already paid', alreadyCompleted: true });
      }

      const payableStatuses = ['passenger_onboard', 'awaiting_payment'];
      if (!payableStatuses.includes(delivery.rideStatus)) {
        return ctx.badRequest(`Delivery cannot be paid in status: ${delivery.rideStatus}`);
      }

      if (!delivery.deliverer?.id) return ctx.badRequest('No deliverer assigned to this delivery');

      // Set payment method to cash before completing
      await strapi.db.query('api::delivery.delivery').update({
        where: { id: deliveryId },
        data: { paymentMethod: 'cash' },
      });

      const { updatedDelivery } = await handleCompleteDelivery({
        deliveryId,
        delivererId: delivery.deliverer.id,
      });

      // Transaction record
      try {
        await strapi.db.query('api::transaction.transaction').create({
          data: {
            transactionId: `TXN-DEL-${Date.now()}`,
            user:          delivery.sender?.id,
            type:          'ride_payment',
            paymentMethod: 'cash',
            amount:        delivery.totalFare ?? 0,
            transactionStatus: 'completed',
            notes: `Cash payment for delivery #${delivery.rideCode ?? deliveryId}`,
            processedAt: new Date().toISOString(),
          },
        });
      } catch (txErr) {
        strapi.log.warn('[Delivery] payCash: Failed to create transaction record:', txErr.message);
      }

      const now = new Date().toISOString();

      try {
        socketService.emitPaymentReceived(
          deliveryId,
          delivery.sender?.id,
          delivery.deliverer?.id,
          delivery.totalFare ?? 0,
          'cash'
        );
      } catch (emitErr) {
        strapi.log.warn('[Delivery] payCash: Socket emit error:', emitErr.message);
      }

      return ctx.send({
        success: true,
        message:       'Cash payment recorded. Delivery completed.',
        rideStatus:    'completed',
        paymentStatus: 'completed',
        paymentMethod: 'cash',
        paidAt:        now,
      });
    } catch (error) {
      strapi.log.error('[Delivery] payCash error:', error);
      return ctx.internalServerError('Failed to record cash payment');
    }
  },

  // ─── Complete delivery ────────────────────────────────────────────────────
  async completeDelivery(ctx) {
    try {
      const { id } = ctx.params;
      const delivererId = ctx.state.user.id;
      const { actualDistance, actualDuration } = ctx.request.body;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id, deliverer: delivererId },
        populate: ['deliverer', 'sender'],
      });

      if (!delivery) return ctx.notFound('Delivery not found');

      const completableStatuses = ['passenger_onboard', 'awaiting_payment'];
      if (!completableStatuses.includes(delivery.rideStatus)) {
        return ctx.badRequest(`Delivery cannot be completed from status: ${delivery.rideStatus}`);
      }

      const { updatedDelivery } = await handleCompleteDelivery({ deliveryId: id, delivererId, actualDistance, actualDuration });

      socketService.emit('delivery:completed', {
        deliveryId: updatedDelivery.id,
        delivererId,
        finalFare:  updatedDelivery.totalFare,
        distance:   updatedDelivery.actualDistance || updatedDelivery.estimatedDistance,
        duration:   updatedDelivery.actualDuration || updatedDelivery.estimatedDuration,
        tripCompletedAt: updatedDelivery.tripCompletedAt,
      });

      return ctx.send(updatedDelivery);
    } catch (error) {
      strapi.log.error('[Delivery] completeDelivery error:', error);
      return ctx.internalServerError('Failed to complete delivery');
    }
  },

  // ─── Cancel delivery ──────────────────────────────────────────────────────
  async cancelDelivery(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;
      const { reason, cancelledBy } = ctx.request.body;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id },
        populate: ['sender', 'deliverer'],
      });

      if (!delivery) return ctx.notFound('Delivery not found');
      if (['completed', 'cancelled'].includes(delivery.rideStatus)) return ctx.badRequest('Cannot cancel this delivery');

      const updated = await strapi.db.query('api::delivery.delivery').update({
        where: { id },
        data: {
          rideStatus:          'cancelled',
          cancelledAt:         new Date(),
          cancelledBy,
          cancellationReason:  reason,
          cancellationFee:     0,
        },
      });

      // Free up deliverer if assigned
      if (delivery.deliverer) {
        const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: delivery.deliverer.id ?? delivery.deliverer },
          populate: { deliveryProfile: { select: ['id', 'cancelledDeliveries'] } },
        });
        if (driver?.deliveryProfile) {
          await strapi.db.query('delivery-profiles.delivery-profile').update({
            where: { id: driver.deliveryProfile.id },
            data: {
              isAvailable:         true,
              isEnroute:           false,
              currentDelivery:     null,
              cancelledDeliveries: (driver.deliveryProfile.cancelledDeliveries || 0) + 1,
            },
          });
        }
      }

      // Update package status
      if (delivery.package) {
        await strapi.db.query('api::package.package').update({
          where: { id: delivery.package },
          data: { packageStatus: 'cancelled' },
        });
      }

      socketService.emit('delivery:cancelled', {
        deliveryId: updated.id,
        cancelledBy,
        reason,
        cancellationFee: 0,
      });

      return ctx.send(updated);
    } catch (error) {
      strapi.log.error('[Delivery] cancelDelivery error:', error);
      return ctx.internalServerError('Failed to cancel delivery');
    }
  },

  // ─── Track delivery ───────────────────────────────────────────────────────
  async trackDelivery(ctx) {
    try {
      const { id } = ctx.params;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id },
        populate: {
          deliverer: { fields: ['id', 'firstName', 'lastName', 'phoneNumber'] },
          vehicle:   true,
          package:   true,
        },
      });

      if (!delivery) return ctx.notFound('Delivery not found');

      let delivererLocation = null;
      let eta = null;
      let distance = null;

      if (delivery.deliverer) {
        const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: delivery.deliverer.id },
          select: ['currentLocation', 'lastSeen', 'isOnline'],
        });

        if (driver?.currentLocation) {
          delivererLocation = driver.currentLocation;
          if (['accepted', 'arrived'].includes(delivery.rideStatus)) {
            distance = calculateDistance(driver.currentLocation, delivery.pickupLocation);
            eta = Math.ceil(distance * 3);
          } else if (delivery.rideStatus === 'passenger_onboard') {
            distance = calculateDistance(driver.currentLocation, delivery.dropoffLocation);
            eta = Math.ceil(distance * 3);
          }
        }
      }

      return ctx.send({
        delivery: {
          id:           delivery.id,
          rideCode:     delivery.rideCode,
          rideStatus:   delivery.rideStatus,
          pickupLocation:  delivery.pickupLocation,
          dropoffLocation: delivery.dropoffLocation,
          requestedAt:  delivery.requestedAt,
          acceptedAt:   delivery.acceptedAt,
          arrivedAt:    delivery.arrivedAt,
          tripStartedAt: delivery.tripStartedAt,
          packageStatus: delivery.package?.packageStatus,
        },
        deliverer: delivery.deliverer ? {
          id:          delivery.deliverer.id,
          firstName:   delivery.deliverer.firstName,
          lastName:    delivery.deliverer.lastName,
          phoneNumber: delivery.deliverer.phoneNumber,
          currentLocation: delivererLocation,
        } : null,
        vehicle: delivery.vehicle ? {
          numberPlate: delivery.vehicle.numberPlate,
          make:        delivery.vehicle.make,
          model:       delivery.vehicle.model,
          color:       delivery.vehicle.color,
        } : null,
        tracking: {
          eta:         eta ? `${eta} min` : null,
          distance:    distance ? `${distance.toFixed(1)} km` : null,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      strapi.log.error('[Delivery] trackDelivery error:', error);
      return ctx.internalServerError('Failed to track delivery');
    }
  },

  // ─── Get deliverer location ───────────────────────────────────────────────
  async getDelivererLocation(ctx) {
    try {
      const { id } = ctx.params;

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id },
        populate: { deliverer: true },
      });

      if (!delivery) return ctx.notFound('Delivery not found');
      if (!delivery.deliverer) return ctx.badRequest('No deliverer assigned to this delivery');

      const driver = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: delivery.deliverer.id },
        select: ['currentLocation', 'lastSeen', 'isOnline'],
      });

      if (!driver?.currentLocation) return ctx.notFound('Deliverer location not available');

      return ctx.send({
        location:    driver.currentLocation,
        lastUpdated: driver.lastSeen || new Date(),
        isOnline:    driver.isOnline || false,
        rideStatus:  delivery.rideStatus,
      });
    } catch (error) {
      strapi.log.error('[Delivery] getDelivererLocation error:', error);
      return ctx.internalServerError('Failed to get deliverer location');
    }
  },

  // ─── Rate delivery ────────────────────────────────────────────────────────
  async rateDelivery(ctx) {
    try {
      const { id } = ctx.params;
      const userId = ctx.state.user.id;
      const { rating, review = '', tags = [], ratedBy } = ctx.request.body;

      if (!rating || rating < 1 || rating > 5) return ctx.badRequest('Rating must be between 1 and 5');
      if (!ratedBy || !['sender', 'deliverer'].includes(ratedBy)) {
        return ctx.badRequest('ratedBy must be either "sender" or "deliverer"');
      }

      const delivery = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id },
        populate: {
          sender:    { populate: { riderProfile: true } },
          deliverer: { populate: { deliveryProfile: true } },
        },
      });

      if (!delivery) return ctx.notFound('Delivery not found');
      if (delivery.rideStatus !== 'completed') return ctx.badRequest('Can only rate completed deliveries');

      const isSender   = delivery.sender?.id === userId;
      const isDeliverer = delivery.deliverer?.id === userId;

      if (!isSender && !isDeliverer) return ctx.forbidden('You are not authorised to rate this delivery');
      if ((ratedBy === 'sender' && !isSender) || (ratedBy === 'deliverer' && !isDeliverer)) {
        return ctx.badRequest('ratedBy does not match your user type');
      }

      const existingRating = await strapi.db.query('api::rating.rating').findOne({
        where: { ride: id, ratedBy: ratedBy },
      });
      if (existingRating) return ctx.badRequest('You have already rated this delivery');

      let ratedUserId: any;
      let ratedUserType: string;

      if (ratedBy === 'sender') {
        ratedUserId   = delivery.deliverer?.id;
        ratedUserType = 'deliverer';
      } else {
        ratedUserId   = delivery.sender?.id;
        ratedUserType = 'sender';
      }

      if (!ratedUserId) return ctx.badRequest('Cannot determine who to rate');

      const newRating = await strapi.db.query('api::rating.rating').create({
        data: { ride: id, ratedUser: ratedUserId, rating, review, tags, ratedBy: userId },
      });

      // Update averageRating on deliveryProfile if rating the deliverer
      if (ratedUserType === 'deliverer') {
        const ratedDriver = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: ratedUserId },
          populate: { deliveryProfile: { select: ['id', 'averageRating', 'totalRatings'] } },
        });
        if (ratedDriver?.deliveryProfile) {
          const currentAvg   = ratedDriver.deliveryProfile.averageRating || 0;
          const currentTotal = ratedDriver.deliveryProfile.totalRatings || 0;
          const newTotal     = currentTotal + 1;
          const newAverage   = ((currentAvg * currentTotal) + rating) / newTotal;
          await strapi.db.query('delivery-profiles.delivery-profile').update({
            where: { id: ratedDriver.deliveryProfile.id },
            data: { averageRating: parseFloat(newAverage.toFixed(2)), totalRatings: newTotal },
          });
        }
      }

      socketService.emit('rating:submitted', { userId, userType: ratedBy, rideId: id, rating });
      strapi.log.info(`[Delivery] ${ratedBy} ${userId} rated ${ratedUserType} ${ratedUserId} with ${rating} stars for delivery ${id}`);

      return ctx.send({
        success: true,
        message: 'Rating submitted successfully',
        rating:  { id: newRating.id, rating, review, tags },
      });
    } catch (error) {
      strapi.log.error('[Delivery] rateDelivery error:', error);
      return ctx.internalServerError('Failed to submit rating');
    }
  },
}));