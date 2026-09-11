// ============================================================
// src/services/deliveryBookingService.ts
// Mirrors rideBookingService but targets deliveryProfile
// for availability checks while still using driverProfile
// for float / subscription eligibility.
// ============================================================

import { SendSmsNotification, SendEmailNotification } from './messages';
import RiderBlockingService from './riderBlockingService';
import DeviceService from './deviceServices';
import socketService from './socketService';

export interface DeliveryBookingService {
  findEligibleDeliveryDrivers(deliveryData: any): Promise<any>;
  sendDeliveryRequests(deliveryId: number | string, drivers: any[]): Promise<any>;
  scheduleDeliveryRequestTimeout(deliveryId: number | string): void;
  canDriverAcceptDeliveries(driverId: number | string): Promise<any>;
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  deg2rad(deg: number): number;
}

// ─── Helper ─────────────────────────────────────────────────────────────────
/**
 * Checks whether the driver's subscription is currently valid and unexpired.
 * Subscription lives on driverProfile — delivery drivers still use the same
 * payment system (float / subscription) as ride drivers.
 */
function isSubscriptionCurrentlyActive(driverProfile: any): boolean {
  const profileStatus = driverProfile?.subscriptionStatus;
  if (!['active', 'trial'].includes(profileStatus)) return false;

  const sub = driverProfile?.currentSubscription;
  if (!sub) return profileStatus === 'active' || profileStatus === 'trial';

  const subStatus = sub.subscriptionStatus;
  if (!['active', 'trial'].includes(subStatus)) return false;

  if (sub.expiresAt) {
    const now = new Date();
    const expiresAt = new Date(sub.expiresAt);
    if (now > expiresAt) return false;
  }
  return true;
}

export default {
  /**
   * Find eligible delivery drivers near the pickup location.
   * Eligibility rules:
   *   - deliveryProfile.isOnline / isAvailable / isActive / !isEnroute / !blocked
   *   - deliveryProfile.activeVehicleType !== 'none'
   *   - driverProfile float / subscription check (same rules as rides)
   *   - not in rider's blocked list
   *   - within maxRadius km of pickup
   */
 async findEligibleDeliveryDrivers(deliveryData: any) {
    try {
      const {
        pickupLocation,
        senderId,
        deliveryClassName,
        vehicleTypePreference,
      } = deliveryData;

      const settings  = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      const maxRadius  = settings?.rideBookingRadius || 10;
      const maxDrivers = settings?.maxSimultaneousDriverRequests || 5;

      const blockedResult: any = await RiderBlockingService.getBlockedDrivers(senderId);
      const tempBlocked        = Object.keys(blockedResult.tempBlocked || {}).map((id) => parseInt(id));
      const permanentBlocked   = blockedResult.permanentlyBlocked || [];
      const allBlockedIds      = [...new Set([...tempBlocked, ...permanentBlocked])];

      // ── Infer acceptable vehicle types from delivery class ────────────
      // vehicleTypePreference always wins; otherwise use class-based rules.
      let acceptableVehicleTypes: string[] | null = null;

      if (vehicleTypePreference) {
        // Rider explicitly chose a vehicle type — only that type is eligible
        acceptableVehicleTypes = [vehicleTypePreference];
      } else if (deliveryClassName) {
        switch (deliveryClassName) {
          case 'standard':
          case 'midsize':
            acceptableVehicleTypes = ['motorbike', 'motorcycle', 'taxi'];
            break;
          case 'big':
            acceptableVehicleTypes = ['taxi', 'truck'];
            break;
          case 'large':
            acceptableVehicleTypes = ['truck'];
            break;
        }
      }

      strapi.log.info(
        `[DeliveryBooking] Finding drivers within ${maxRadius} km. ` +
        `Class: ${deliveryClassName ?? 'any'} | ` +
        `VehiclePreference: ${vehicleTypePreference ?? 'none'} | ` +
        `AcceptableTypes: ${acceptableVehicleTypes?.join(', ') ?? 'any'}`
      );

      const whereConditions: any = {
        deliveryProfile: {
          isActive:    { $eq: true },
          isOnline:    { $eq: true },
          isAvailable: { $eq: true },
          isEnroute:   { $eq: false },
          blocked:     { $eq: false },
        },
        isOnline:      { $eq: true },
        activeProfile: { $eq: 'delivery' },
      };

      if (allBlockedIds.length > 0) {
        whereConditions.id = { $notIn: allBlockedIds };
      }

      const drivers: any[] = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: whereConditions,
        populate: {
          deliveryProfile: {
            populate: {
              taxi:       { populate: true },
              motorbike:  { populate: true },
              motorcycle: { populate: true },
              truck:      { populate: true },
            },
          },
          driverProfile: { populate: { currentSubscription: true } },
          country: { populate: true } ,
          profileActivityStatus: true,
        },
        limit: 1000,
      });

      // Request fresh locations
      if (drivers.length > 0) {
        for (const driver of drivers) {
          try { await DeviceService.requestLocationFromDevice(driver.id, 'delivery'); } catch {}
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const paymentSystemType  = settings?.paymentSystemType   || 'float_based';
      const allowNegativeFloat = settings?.allowNegativeFloat   || false;
      const negativeFloatLimit = settings?.negativeFloatLimit   || 0;

      const eligibleDrivers = drivers
        .filter((driver) => {
          if (driver.profileActivityStatus?.delivery !== true) return false;
          if (!driver.currentLocation?.latitude || !driver.currentLocation?.longitude) return false;

          const activeVehicleType = driver.deliveryProfile?.activeVehicleType;
          if (!activeVehicleType || activeVehicleType === 'none') return false;

          // ── Vehicle type filter ─────────────────────────────────────
          if (acceptableVehicleTypes && !acceptableVehicleTypes.includes(activeVehicleType)) {
            strapi.log.info(
              `[DeliveryBooking] Driver ${driver.id} excluded: ` +
              `activeVehicleType=${activeVehicleType} not in [${acceptableVehicleTypes.join(', ')}]`
            );
            return false;
          }

          const subComponent = driver.deliveryProfile?.[activeVehicleType];
          if (!subComponent?.vehicle) return false;

          const distance = this.calculateDistance(
            pickupLocation.lat, pickupLocation.lng,
            driver.currentLocation.latitude, driver.currentLocation.longitude
          );
          if (distance > maxRadius) return false;

          // Subscription check
          if (paymentSystemType === 'subscription_based') {
            if (!isSubscriptionCurrentlyActive(driver.driverProfile)) return false;
            return true;
          }
          if (paymentSystemType === 'hybrid') {
            if (isSubscriptionCurrentlyActive(driver.driverProfile)) return true;
          }

          // Float check
          const floatBalance = driver.driverProfile?.floatBalance || 0;
          if (floatBalance < 0) {
            if (!allowNegativeFloat) return false;
            if (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit) return false;
          }

          return true;
        })
        .map((driver) => ({
          ...driver,
          distance: this.calculateDistance(
            pickupLocation.lat, pickupLocation.lng,
            driver.currentLocation.latitude, driver.currentLocation.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxDrivers);

      strapi.log.info(`[DeliveryBooking] ${eligibleDrivers.length} eligible delivery drivers`);
      return { success: true, drivers: eligibleDrivers, totalFound: eligibleDrivers.length };
    } catch (error: any) {
      strapi.log.error('[DeliveryBooking] findEligibleDeliveryDrivers error:', error);
      return { success: false, error: error.message, drivers: [] };
    }
  },

  /**
   * Send delivery requests to eligible drivers (mirrors sendRideRequests).
   */
  async sendDeliveryRequests(deliveryId: string | number, drivers: any[]) {
    try {
      const delivery: any = await strapi.db.query('api::delivery.delivery').findOne({
        where: { id: deliveryId },
        populate: ['sender', 'package'],
      });

      if (!delivery) return { success: false, error: 'Delivery not found' };

      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();

      const requestedDrivers: any[] = [];
      const requestedDriverAccounts: any[] = [];

      for (const driver of drivers) {
        const requestData = {
          deliveryId: delivery.id,
          rideCode: delivery.rideCode,
          senderId: delivery.sender.id,
          senderName: `${delivery.sender.firstName} ${delivery.sender.lastName}`,
          pickupLocation: delivery.pickupLocation,
          dropoffLocation: delivery.dropoffLocation,
          estimatedFare: delivery.totalFare,
          distance: driver.distance,
          packageType: delivery.package?.packageType,
          requestedAt: new Date().toISOString(),
        };

        // Draw-over overlay on driver device
        try {
          await DeviceService.showDrawOverOnDevice(driver.id, {
            type: 'delivery_request',
            title: 'New Delivery Request',
            message: `Pickup: ${delivery.pickupLocation.address || delivery.pickupLocation.name}`,
            deliveryId: delivery.id,
            rideCode: delivery.rideCode,
            estimatedFare: delivery.totalFare,
            distance: driver.distance.toFixed(1),
            pickupAddress: delivery.pickupLocation.address || delivery.pickupLocation.name,
            dropoffAddress: delivery.dropoffLocation.address || delivery.dropoffLocation.name,
            senderName: `${delivery.sender.firstName} ${delivery.sender.lastName}`,
            autoTimeout: 60000,
          });
        } catch (err) {
          strapi.log.error(`[DeliveryBooking] Draw-over error for driver ${driver.id}:`, err);
        }

        // Push notification
        if (settings?.pushNotificationsEnabled) {
          try {
            await DeviceService.sendNotificationToDevice(driver.id, {
              title: 'New Delivery Request',
              body: `${driver.distance.toFixed(1)} km away • K${delivery.totalFare?.toFixed(2)}`,
              data: { type: 'delivery_request', deliveryId: delivery.id, rideCode: delivery.rideCode, ...requestData },
            });
          } catch (err) {
            strapi.log.error(`[DeliveryBooking] Push notification error for driver ${driver.id}:`, err);
          }
        }
       // SMS
        if (settings?.smsEnabled && settings?.driversCanReceiveRideRequestsViaSms && driver.phoneNumber) {
          try {
            const msg = `New OkraRides delivery request! ${driver.distance.toFixed(1)} km away. Fare: K${delivery.totalFare?.toFixed(2)}. Open app to accept.`;
            await SendSmsNotification('+' + driver.phoneNumber, msg);
          } catch (err) {
            strapi.log.error(`[DeliveryBooking] SMS error for driver ${driver.id}:`, err);
          }
        }

        requestedDrivers.push({ driverId: driver.id, distance: driver.distance, requestedAt: new Date().toISOString(), status: 'pending' });
        requestedDriverAccounts.push(driver.id);

        socketService.emitDeliveryRequestSent(deliveryId, requestedDrivers.map((rd) => rd.driverId), requestData);
      }

      await strapi.db.query('api::delivery.delivery').update({
        where: { id: deliveryId },
        data: {
          requestedDrivers,
          requestedDriverAccounts: { connect: requestedDriverAccounts },
        },
      });

      strapi.log.info(`[DeliveryBooking] Sent delivery requests to ${requestedDrivers.length} drivers for delivery ${deliveryId}`);
      this.scheduleDeliveryRequestTimeout(deliveryId);
      return { success: true, driverCount: requestedDrivers.length };
    } catch (error: any) {
      strapi.log.error('[DeliveryBooking] sendDeliveryRequests error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Timeout: if no driver accepts within the window, mark as no_drivers_available.
   */
  async scheduleDeliveryRequestTimeout(deliveryId: string | number) {
    const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
    const timeoutSeconds = settings?.deliveryRequestTimeoutSeconds || 60;

    setTimeout(async () => {
      try {
        const delivery: any = await strapi.db.query('api::delivery.delivery').findOne({ where: { id: deliveryId } });
        if (delivery && delivery.rideStatus === 'pending') {
          await strapi.db.query('api::delivery.delivery').update({
            where: { id: deliveryId },
            data: { rideStatus: 'no_drivers_available' },
          });
          socketService.emit('delivery:no_drivers', { deliveryId, senderId: delivery.sender });
          strapi.log.warn(`[DeliveryBooking] Delivery ${deliveryId} timed out — no drivers accepted`);
        }
      } catch (err) {
        strapi.log.error(`[DeliveryBooking] Timeout handler error for delivery ${deliveryId}:`, err);
      }
    }, timeoutSeconds * 1000);
  },

  /**
   * Check if a driver can currently accept deliveries.
   * Mirrors canDriverAcceptRides — checks deliveryProfile availability
   * plus the same float / subscription rules on driverProfile.
   */
  async canDriverAcceptDeliveries(driverId: string | number) {
    try {
      const driver: any = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: driverId },
        populate: {
          deliveryProfile: true,
          driverProfile: { populate: { currentSubscription: true } },
        },
      });

      if (!driver?.deliveryProfile) return { canAccept: false, reason: 'Delivery profile not found' };
      if (!driver.deliveryProfile.isOnline)   return { canAccept: false, reason: 'Delivery driver is offline' };
      if (!driver.deliveryProfile.isAvailable) return { canAccept: false, reason: 'Delivery driver is not available' };

      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      const paymentSystemType = settings?.paymentSystemType || 'float_based';

      if (paymentSystemType !== 'float_based') {
        const onSubscription = isSubscriptionCurrentlyActive(driver.driverProfile);
        if (paymentSystemType === 'subscription_based') {
          if (!onSubscription) {
            const profileStatus = driver.driverProfile?.subscriptionStatus;
            return {
              canAccept: false,
              reason: ['expired', 'cancelled'].includes(profileStatus)
                ? 'Your subscription has expired. Please renew to continue accepting deliveries.'
                : 'An active subscription is required to accept deliveries.',
              subscriptionStatus: profileStatus,
              action: 'subscribe',
            };
          }
          return { canAccept: true };
        }
        if (paymentSystemType === 'hybrid' && onSubscription) return { canAccept: true };
      }

      // Float check
      const allowNegativeFloat = settings?.allowNegativeFloat || false;
      const negativeFloatLimit = settings?.negativeFloatLimit || 0;
      const floatBalance = driver.driverProfile?.floatBalance || 0;

      if (floatBalance < 0) {
        if (!allowNegativeFloat) {
          return {
            canAccept: false,
            reason: `Your float balance (K${Math.abs(floatBalance).toFixed(2)}) is negative. Please top up to accept deliveries.`,
            floatBalance,
            action: 'topup_float',
          };
        }
        if (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit) {
          return {
            canAccept: false,
            reason: `Your float (K${Math.abs(floatBalance).toFixed(2)}) has exceeded the negative limit of K${negativeFloatLimit.toFixed(2)}. Please top up.`,
            floatBalance,
            action: 'topup_float',
          };
        }
      }

      return { canAccept: true };
    } catch (error) {
      strapi.log.error('[DeliveryBooking] canDriverAcceptDeliveries error:', error);
      return { canAccept: false, reason: 'Error checking eligibility' };
    }
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  },
};