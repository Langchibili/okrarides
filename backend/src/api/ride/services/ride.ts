// import { factories } from '@strapi/strapi';

// export default factories.createCoreService('api::ride.ride');
// ============================================
// src/api/ride/services/ride.ts
// ============================================

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::ride.ride', ({ strapi }) => ({
  /**
   * Find nearby available drivers
   */
  async findNearbyDrivers(location: { lat: number; lng: number }, maxDistance = 10) {
    // This would query drivers with location within radius
    const drivers = await strapi.db.query('plugin::users-permissions.user').findMany({
      where: {
        'driverProfile.isAvailable': true,
        'driverProfile.isOnline': true,
        isOnline: true,
      },
      populate: {
        driverProfile: true,
      },
    });

    // Filter by distance (you'd implement geospatial queries)
    return drivers.filter((driver: any) => {
      if (!driver.currentLocation) return false;
      // Calculate distance and filter
      return true;
    });
  },

  /**
   * Calculate dynamic pricing
   */
  async calculateDynamicPricing(rideClassId: number, distance: number, duration: number) {
    const rideClass = await strapi.db.query('api::ride-class.ride-class').findOne({
      where: { id: rideClassId },
    });

    if (!rideClass) {
      throw new Error('Ride class not found');
    }

    const baseFare = rideClass.baseFare;
    const distanceFare = distance * rideClass.perKmRate;
    const timeFare = duration * rideClass.perMinuteRate;

    return {
      baseFare,
      distanceFare,
      timeFare,
      subtotal: baseFare + distanceFare + timeFare,
    };
  },

  /**
   * Update driver location
   */
  async updateDriverLocation(driverId: number, location: { lat: number; lng: number; heading?: number; speed?: number }) {
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: driverId },
      data: {
        currentLocation: location,
        lastSeen: new Date(),
      },
    });
  },

  /**
   * Apply promo code
   */
  async applyPromoCode(promoCode: string, subtotal: number, userId: number) {
    const promo = await strapi.db.query('api::promo-code.promo-code').findOne({
      where: {
        code: promoCode,
        isActive: true,
      },
    });

    if (!promo) {
      throw new Error('Invalid promo code');
    }

    // Check validity
    const now = new Date();
    if (now < new Date(promo.validFrom) || now > new Date(promo.validUntil)) {
      throw new Error('Promo code has expired');
    }

    // Check usage limits
    if (promo.maxUsageCount && promo.currentUsageCount >= promo.maxUsageCount) {
      throw new Error('Promo code usage limit reached');
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (subtotal * promo.discountValue) / 100;
      if (promo.maxDiscountAmount) {
        discount = Math.min(discount, promo.maxDiscountAmount);
      }
    } else {
      discount = promo.discountValue;
    }

    return {
      promoId: promo.id,
      discount,
      discountType: promo.discountType,
    };
  },
}));