// src/api/driver/services/nearbyDriverService.ts

// Direct import — riderBlockingService is a plain exported object, not a registered
// Strapi service. Do NOT use strapi.service('api::rider.riderBlockingService').
import RiderBlockingService from './riderBlockingService';

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

// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Determines whether a driver's subscription is currently valid and unexpired.
 * Checks BOTH the denormalized `subscriptionStatus` field on the driver profile
 * AND the actual `expiresAt` timestamp from the currentSubscription relation.
 *
 * Kept in sync with the same helper in rideBookingService so the map and
 * dispatch eligibility rules are always identical.
 */
function isSubscriptionCurrentlyActive(driverProfile: any): boolean {
  const profileStatus = driverProfile?.subscriptionStatus;

  if (!['active', 'trial'].includes(profileStatus)) {
    return false;
  }

  const sub = driverProfile?.currentSubscription;
  if (!sub) {
    return profileStatus === 'active' || profileStatus === 'trial';
  }

  // Correct field name: subscriptionStatus (not status)
  const subStatus = sub.subscriptionStatus;
  if (!['active', 'trial'].includes(subStatus)) {
    return false;
  }

  if (sub.expiresAt) {
    const now = new Date();
    const expiresAt = new Date(sub.expiresAt);
    if (now > expiresAt) {
      return false;
    }
  }

  return true;
}

export default ({ strapi }: { strapi: any }) => ({
  /**
   * Find nearby available drivers excluding blocked ones.
   *
   * Applies the same payment-system eligibility rules as findEligibleDrivers
   * in rideBookingService so the map only shows drivers who could actually
   * accept a ride right now.
   *
   * Eligibility is determined solely by paymentSystemType:
   *   float_based        — float balance check always applies
   *   subscription_based — active subscription required; float is irrelevant
   *   hybrid             — active subscription skips float check; otherwise float check applies
   */
  async findNearbyDrivers(
    pickupLocation: { lat: number; lng: number },
    riderId: number | string,
    maxDistance: number = 10,
    limit: number = 100
  ) {
    try {
      // getBlockedDrivers is async — must await
      const blockedResult: any = await RiderBlockingService.getBlockedDrivers(riderId);

      const tempBlocked = Object.keys(blockedResult.tempBlocked || {}).map((id) =>
        parseInt(id)
      );
      const permanentBlocked = blockedResult.permanentlyBlocked || [];
      const allBlockedIds = [...new Set([...tempBlocked, ...permanentBlocked])];

      const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne();
      const paymentSystemType = settings?.paymentSystemType || 'float_based';
      const allowNegativeFloat = settings?.allowNegativeFloat || false;
      const negativeFloatLimit = settings?.negativeFloatLimit || 0;

      // NOTE: Strapi v4 does NOT support dot-notation like 'driverProfile.isOnline'.
      // Use nested object syntax.
      const whereConditions: any = {
        driverProfile: {
          isActive: { $eq: true },
          isOnline: { $eq: true },
          isAvailable: { $eq: true },
          isEnroute: { $eq: false },
          blocked: { $eq: false },
        },
        isOnline: { $eq: true },
        activeProfile: { $eq: 'driver' },
      };

      if (allBlockedIds.length > 0) {
        whereConditions.id = { $notIn: allBlockedIds };
      }

      const drivers: any[] = await strapi.db
        .query('plugin::users-permissions.user')
        .findMany({
          where: whereConditions,
          populate: {
            driverProfile: {
              populate: {
                assignedVehicle: true,
                acceptedRideClasses: true,
                acceptedTaxiTypes: true,
                subscriptionPlan: true,
                currentSubscription: true,
              },
            },
            profileActivityStatus: true,
          },
          limit: 1000,
        });

      const driversWithDistance = drivers
        .filter((driver) => {
          // Must be actively in driver mode
          if (driver.profileActivityStatus?.driver !== true) {
            return false;
          }

          // Must have a current location
          if (!driver.currentLocation?.latitude || !driver.currentLocation?.longitude) {
            return false;
          }

          // ── Subscription system — active subscription required; float is irrelevant
          if (paymentSystemType === 'subscription_based') {
            return isSubscriptionCurrentlyActive(driver.driverProfile);
          }

          // ── Hybrid — active subscription skips float check entirely
          if (paymentSystemType === 'hybrid') {
            if (isSubscriptionCurrentlyActive(driver.driverProfile)) {
              return true;
            }
            // No active subscription — fall through to float check
          }

          // ── Float check — applies to float_based, and hybrid without active subscription
          const floatBalance = driver.driverProfile?.floatBalance || 0;

          if (floatBalance < 0) {
            if (!allowNegativeFloat) {
              return false;
            }

            if (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit) {
              return false;
            }
          }

          return true;
        })
        .map((driver) => {
          const distance = this.calculateDistance(
            pickupLocation.lat,
            pickupLocation.lng,
            driver.currentLocation.latitude,
            driver.currentLocation.longitude
          );

          return { ...driver, distance };
        })
        .filter((driver) => driver.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      return {
        success: true,
        drivers: driversWithDistance,
        totalFound: driversWithDistance.length,
      };
    } catch (error: any) {
      strapi.log.error('Error finding nearby drivers:', error);
      return { success: false, error: error.message, drivers: [] };
    }
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
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