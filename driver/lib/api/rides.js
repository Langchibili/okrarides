// ============================================
// lib/api/rides.js - Complete Ride API
// ============================================

import { apiClient } from './client';

class RideAPI {
  // ============================================
  // STEP 1: Get Fare Estimate
  // ============================================
  async estimateFare(pickupLocation, dropoffLocation, rideType = 'taxi', rideTypes = ['taxi']) {
    /*
      POST /rides/estimate
      Body: {
        pickupLocation: { lat, lng, address, placeId },
        dropoffLocation: { lat, lng, address, placeId },
        rideType: 'taxi' | 'bus' | 'delivery',
        rideTypes: ['taxi', 'bus'] // for multiple estimates
      }
      
      Returns: {
        estimates: [
          {
            rideClassId: 1,
            rideClassName: 'Okra Go',
            baseFare: 10,
            distanceFare: 15,
            timeFare: 5,
            surgeFare: 0,
            subtotal: 30,
            estimatedDistance: 5.2,
            estimatedDuration: 12,
            availableDrivers: 8
          }
        ],
        route: {
          distance: '5.2 km',
          duration: '12 min',
          polyline: 'encoded_polyline_string'
        }
      }
    */
    
    try {
      const response = await apiClient.post('/rides/estimate', {
        pickupLocation: {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          address: pickupLocation.address,
          placeId: pickupLocation.placeId,
        },
        dropoffLocation: {
          lat: dropoffLocation.lat,
          lng: dropoffLocation.lng,
          address: dropoffLocation.address,
          placeId: dropoffLocation.placeId,
        },
        rideType,
        rideTypes,
      });
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to estimate fare',
      };
    }
  }

  // ============================================
  // STEP 2: Validate Promo Code
  // ============================================
  async validatePromoCode(code, subtotal = null) {
    /*
      POST /promo-codes/validate
      Body: { code, subtotal }
      
      Returns: {
        valid: true,
        discount: 10.50,
        discountType: 'percentage' | 'fixed_amount',
        discountValue: 50,
        maxDiscount: 20,
        message: '50% off applied!'
      }
    */
    
    try {
      const response = await apiClient.post('/promo-codes/validate', {
        code,
        subtotal,
      });
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Invalid promo code',
      };
    }
  }

  // Apply promo code to estimate
  async applyPromoCode(estimateId, code) {
    /*
      POST /rides/estimate/:id/apply-promo
      Body: { code }
      
      Returns: Updated estimate with discount applied
    */
    
    try {
      const response = await apiClient.post(`/rides/estimate/${estimateId}/apply-promo`, {
        code,
      });
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to apply promo code',
      };
    }
  }

  // ============================================
  // STEP 3: Create Ride Request
  // ============================================
  async createRide(rideData) {
    /*
      POST /rides
      Body: {
        taxiType: 'taxi',
        rideClass: 1, // rideClassId
        pickupLocation: { lat, lng, address, placeId },
        dropoffLocation: { lat, lng, address, placeId },
        passengerCount: 1,
        paymentMethod: 'cash' | 'okrapay',
        promoCode: 'WELCOME50' (optional),
        specialRequests: ['wheelchair', 'pet_friendly'],
        notes: 'Please call when arriving',
        scheduledFor: '2025-01-15T14:30:00Z' (optional)
      }
      
      Returns: {
        id: 123,
        rideCode: 'RIDE-ABC123',
        rideStatus: 'pending',
        estimatedFare: 25.50,
        createdAt: '2025-01-10T10:30:00Z'
      }
    */
    
    try {
      const response = await apiClient.post('/rides', {
        data: {
          rider: rideData.rider?.id,
          rideType: rideData.rideType || rideData.taxiType,
          taxiType: rideData.taxiType || rideData.rideType,
          rideClass: rideData.rideClass || rideData.rideClassId,
          pickupLocation: rideData.pickupLocation,
          dropoffLocation: rideData.dropoffLocation,
          passengerCount: rideData.passengerCount || 1,
          paymentMethod: rideData.paymentMethod,
          promoCode: rideData.promoCode || null,
          specialRequests: rideData.specialRequests || [],
          notes: rideData.notes || '',
          scheduledFor: rideData.scheduledFor || null,
          totalFare: rideData.estimatedFare || rideData.totalFare,
          rideStatus: 'pending',
          requestedAt: new Date().toISOString(),
        },
      });
      
      return {
        success: true,
        data: response.data?.data || response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to create ride request',
      };
    }
  }

  // ============================================
  // Get Ride by ID
  // ============================================
  async getRide(rideId) {
    /*
      GET /rides/:id?populate=*
      
      Returns: Complete ride details with driver, vehicle, etc.
    */
    
    try {
      const response = await apiClient.get(`/rides/${rideId}?populate=*`);
      
      return {
        success: true,
        data: response.data?.data || response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to fetch ride',
      };
    }
  }

  // ============================================
  // STEP 4: Check Ride Status (Poll for Driver)
  // ============================================
  async checkRideStatus(rideId) {
    /*
      GET /rides/:id?populate=driver,vehicle
      
      Returns: {
        id: 123,
        rideStatus: 'accepted' | 'pending' | 'no_drivers_available',
        driver: {
          id: 45,
          firstName: 'John',
          lastName: 'Banda',
          phoneNumber: '+260972612345',
          profilePicture: 'url',
          driverProfile: {
            averageRating: 4.8,
            totalRatings: 250,
            completedRides: 500
          }
        },
        vehicle: {
          id: 10,
          numberPlate: 'BAZ 1234',
          make: 'Toyota',
          model: 'Corolla',
          color: 'White'
        },
        currentDriverLocation: { lat, lng },
        eta: 180, // seconds
        distance: 1.2 // km to pickup
      }
    */
    
    try {
      const response = await apiClient.get(
        `/rides/${rideId}?populate=driver.driverProfile,vehicle`
      );
      
      return {
        success: true,
        data: response.data?.data || response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to fetch ride status',
      };
    }
  }

  // ============================================
  // STEP 5: Get Driver Location
  // ============================================
  async getDriverLocation(rideId) {
    /*
      GET /rides/:id/driver-location
      
      Returns: {
        lat: -15.4100,
        lng: 28.2850,
        heading: 45, // degrees
        speed: 30, // km/h
        updatedAt: '2025-01-10T10:35:00Z'
      }
    */
    
    try {
      const response = await apiClient.get(`/rides/${rideId}/driver-location`);
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to get driver location',
      };
    }
  }

  // Track ride (alternative polling endpoint)
  async trackRide(rideId) {
    /*
      GET /rides/:id/track
      
      Returns: Real-time tracking data including driver location and ETA
    */
    
    try {
      const response = await apiClient.get(`/rides/${rideId}/track`);
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to track ride',
      };
    }
  }

  // ============================================
  // STEP 6: Cancel Ride
  // ============================================
  async cancelRide(rideId, reason, explanation = '') {
    /*
      PUT /rides/:id (Strapi format)
      or
      POST /rides/:id/cancel (Custom endpoint format)
      
      Body: {
        rideStatus: 'cancelled',
        cancelledBy: 'rider',
        cancellationReason: reason,
        explanation: explanation,
        cancelledAt: timestamp
      }
      
      Returns: {
        success: true,
        cancellationFee: 0,
        message: 'Ride cancelled successfully'
      }
    */
    
    try {
      // Try custom endpoint first
      let response;
      try {
        response = await apiClient.post(`/rides/${rideId}/cancel`, {
          reason,
          explanation,
          cancelledBy: 'driver',
        });
      } catch (customEndpointError) {
        // Fallback to Strapi update endpoint
        response = await apiClient.put(`/rides/${rideId}`, {
          data: {
            rideStatus: 'cancelled',
            cancelledBy: 'driver',
            cancellationReason: reason,
            explanation,
            cancelledAt: new Date().toISOString(),
          },
        });
      }
      
      return {
        success: true,
        data: response.data?.data || response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to cancel ride',
      };
    }
  }

  // ============================================
  // STEP 7: Confirm Pickup
  // ============================================
  async confirmPickup(rideId) {
    /*
      POST /rides/:id/confirm-pickup
      
      Returns: {
        success: true,
        rideStatus: 'passenger_onboard',
        tripStartedAt: '2025-01-10T10:40:00Z'
      }
    */
    
    try {
      const response = await apiClient.post(`/rides/${rideId}/confirm-pickup`);
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to confirm pickup',
      };
    }
  }

  // ============================================
  // STEP 8: Complete Ride
  // ============================================
  async completeRide(rideId) {
    /*
      POST /rides/:id/complete
      
      Returns: {
        id: 123,
        rideStatus: 'completed',
        tripCompletedAt: '2025-01-10T10:55:00Z',
        finalFare: 28.50,
        actualDistance: 5.5,
        actualDuration: 15,
        paymentStatus: 'pending' | 'completed'
      }
    */
    
    try {
      const response = await apiClient.post(`/rides/${rideId}/complete`);
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to complete ride',
      };
    }
  }

  // ============================================
  // STEP 9: Rate Rider
  // ============================================
  async rateDriver(rideId, rating, review = '', tags = []) {
    /*
      POST /rides/:id/rate
      or
      POST /ratings
      
      Body: {
        rating: 5, // 1-5
        review: 'Great driver, very professional!',
        tags: ['friendly', 'clean_car', 'safe_driving'],
        ratedBy: 'rider'
      }
      
      Returns: {
        success: true,
        message: 'Thank you for your feedback!'
      }
    */
    
    try {
      // Try custom endpoint first
      let response;
      try {
        response = await apiClient.post(`/rides/${rideId}/rate`, {
          rating,
          review,
          tags,
          ratedBy: 'driver',
        });
      } catch (customEndpointError) {
        // Fallback to ratings endpoint
        response = await apiClient.post('/ratings', {
          data: {
            ride: rideId,
            rating,
            review,
            tags,
          },
        });
      }
      
      return {
        success: true,
        data: response.data?.data || response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to submit rating',
      };
    }
  }

  // ============================================
  // Get Active Ride
  // ============================================
  // async getActiveRide() {
  //   /*
  //     GET /rides/active
  //     or
  //     GET /rides?filters[rideStatus][$in]=pending,accepted,arrived,passenger_onboard
      
  //     Returns: Current active ride or null
  //   */
    
  //   try {
  //     // Try custom endpoint first
  //     let response;
  //     try {
  //       response = await apiClient.get('/rides/active');
  //     } catch (customEndpointError) {
  //       // Fallback to filtered query
  //       response = await apiClient.get(
  //         '/rides?filters[rideStatus][$in]=pending,accepted,arrived,passenger_onboard&filters[rider][id][$eq]=me&sort=createdAt:desc&pagination[limit]=1&populate=*'
  //       );
        
  //       // Extract first item if array
  //       if (response.data?.data && Array.isArray(response.data.data)) {
  //         response.data = response.data.data[0] || null;
  //       } else if (Array.isArray(response.data)) {
  //         response.data = response.data[0] || null;
  //       }
  //     }
      
  //     return {
  //       success: true,
  //       data: response.data?.data || response.data || null,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.response?.message || error.message || 'Failed to fetch active ride',
  //     };
  //   }
  // }

  async getActiveRide() {
  try {
    const response = await apiClient.get('/rides/active');
    return {
      success: true,
      data: response.data || null,
      userRole: response.userRole || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch active ride',
      data: null,
    };
  }
}

  // ============================================
  // Get Ride History
  // ============================================
  // async getRideHistory(params = {}) {
  //   /*
  //     GET /rides?filters[rider][id][$eq]=userId&sort=createdAt:desc
      
  //     Returns: {
  //       data: [ { ride1 }, { ride2 }, ... ],
  //       meta: {
  //         pagination: {
  //           page: 1,
  //           pageSize: 20,
  //           pageCount: 5,
  //           total: 100
  //         }
  //       }
  //     }
  //   */
    
  //   const { 
  //     page = 1, 
  //     limit = 20, 
  //     pageSize = 20,
  //     rideStatus, 
  //     fromDate,
  //     toDate,
  //     sort = 'createdAt:desc' 
  //   } = params;
    
  //   try {
  //     const queryParams = new URLSearchParams({
  //       'pagination[page]': page,
  //       'pagination[pageSize]': limit || pageSize,
  //       'sort': sort,
  //       'populate': 'driver,vehicle,rideClass',
  //     });
      
  //     // Add filters
  //     if (rideStatus) {
  //       queryParams.append('filters[rideStatus][$eq]', rideStatus);
  //     }
  //     if (fromDate) {
  //       queryParams.append('filters[createdAt][$gte]', fromDate);
  //     }
  //     if (toDate) {
  //       queryParams.append('filters[createdAt][$lte]', toDate);
  //     }
      
  //     const response = await apiClient.get(`/rides?${queryParams.toString()}`);
      
  //     return {
  //       success: true,
  //       data: response.data?.data || response.data || [],
  //       meta: response.data?.meta || response.meta,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.response?.message || error.message || 'Failed to fetch ride history',
  //     };
  //   }
  // }
async getRideHistory(params = {}) {
  const {
    page = 1,
    limit = 20,
    pageSize = 20,
    rideStatus,
    fromDate,
    toDate,
    sort = 'createdAt:desc'
  } = params;

  try {
    const queryParams = new URLSearchParams({
      'pagination[page]': page,
      'pagination[pageSize]': limit || pageSize,
      'sort': sort,
    });

    // Strapi v5 populate syntax - use array notation
    queryParams.append('populate[0]', 'driver');
    queryParams.append('populate[1]', 'vehicle');
    queryParams.append('populate[2]', 'rideClass');
    queryParams.append('populate[3]', 'taxiType');
    queryParams.append('populate[4]', 'rider');
    queryParams.append('populate[driver][populate][0]', 'driverProfile');
    queryParams.append('populate[rider][populate][0]', 'riderProfile');

    // Add filters
    if (rideStatus) {
      queryParams.append('filters[rideStatus][$eq]', rideStatus);
    }
    if (fromDate) {
      queryParams.append('filters[createdAt][$gte]', fromDate);
    }
    if (toDate) {
      queryParams.append('filters[createdAt][$lte]', toDate);
    }

    const response = await apiClient.get(`/rides?${queryParams.toString()}`);

    return {
      success: true,
      data: response.data?.data || response.data || [],
      meta: response.data?.meta || response.meta,
    };
  } catch (error) {
    console.error('getRideHistory error:', error);
    return {
      success: false,
      error: error.response?.message || error.message || 'Failed to fetch ride history',
      data: [],
      meta: null,
    };
  }
}
  // Alias for getRideHistory
  async getMyRides(params = {}) {
    return this.getRideHistory(params);
  }

  // ============================================
  // Get Available Taxi Types
  // ============================================
  async getTaxiTypes() {
    /*
      GET /taxi-types?filters[isActive][$eq]=true&sort=displayOrder:asc
      
      Returns: List of available taxi types (taxi, bus, delivery, etc.)
    */
    
    try {
      const response = await apiClient.get(
        '/taxi-types?filters[isActive][$eq]=true&sort=displayOrder:asc'
      );
      
      return {
        success: true,
        data: response.data?.data || response.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to fetch taxi types',
      };
    }
  }

  // ============================================
  // Get Ride Classes
  // ============================================
  async getRideClasses(taxiTypeId = null) {
    /*
      GET /ride-classes?filters[taxiType][id][$eq]=1&filters[isActive][$eq]=true
      
      Returns: List of ride classes (Okra Go, Okra Bike, Okra XL, etc.)
    */
    
    try {
      let url = '/ride-classes?filters[isActive][$eq]=true&sort=displayOrder:asc';
      
      if (taxiTypeId) {
        url = `/ride-classes?filters[taxiType][id][$eq]=${taxiTypeId}&filters[isActive][$eq]=true&sort=displayOrder:asc`;
      }
      
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data?.data || response.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to fetch ride classes',
      };
    }
  }

  // ============================================
  // Report Issue
  // ============================================
  async reportIssue(rideId, issue) {
    /*
      POST /support-tickets
      Body: {
        ride: rideId,
        category: 'driver_behavior' | 'vehicle_condition' | 'fare_dispute' | etc,
        subject: 'Issue with ride',
        description: 'Detailed description',
        attachments: ['photo1.jpg', 'photo2.jpg'],
        priority: 'high',
        status: 'open'
      }
      
      Returns: Created support ticket
    */
    
    const { category, description, photos = [], subject } = issue;
    
    try {
      const response = await apiClient.post('/support-tickets', {
        data: {
          ride: rideId,
          category,
          subject: subject || `Ride Issue: ${category}`,
          description,
          attachments: photos,
          priority: 'high',
          ticketStatus: 'open',
        },
      });
      
      return {
        success: true,
        data: response.data?.data || response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to report issue',
      };
    }
  }

  // ============================================
  // Get Ride Receipt
  // ============================================
  async getReceipt(rideId) {
    /*
      GET /rides/:id/receipt
      
      Returns: Detailed receipt with fare breakdown
    */
    
    try {
      const response = await apiClient.get(`/rides/${rideId}/receipt`);
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to fetch receipt',
      };
    }
  }

  // ============================================
  // Share Ride Tracking
  // ============================================
  async shareRideTracking(rideId) {
    /*
      POST /rides/:id/share-tracking
      
      Returns: {
        trackingUrl: 'https://okrarides.com/track/abc123',
        expiresAt: '2025-01-10T15:00:00Z'
      }
    */
    
    try {
      const response = await apiClient.post(`/rides/${rideId}/share-tracking`);
      
      return {
        success: true,
        data: response.data || response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.message || error.message || 'Failed to share tracking link',
      };
    }
  }
}

// Export singleton instance
export const ridesAPI = new RideAPI();

// Export class for testing/custom instances
export default RideAPI;