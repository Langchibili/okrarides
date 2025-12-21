import { apiClient } from './client';

export const ridesAPI = {
  // Get price estimate
  async getEstimate(data) {
    const { pickupLocation, dropoffLocation, rideTypes = ['taxi'] } = data;
    
    const response = await apiClient.post('/rides/estimate', {
      pickupLocation,
      dropoffLocation,
      rideTypes,
    });
    
    return response;
  },
  
  // Create new ride request
  async createRide(data) {
    const {
      taxiType,
      rideClass,
      pickupLocation,
      dropoffLocation,
      paymentMethod,
      promoCode,
      specialRequests,
      scheduledFor,
      passengerCount = 1,
    } = data;
    
    const response = await apiClient.post('/rides', {
      data: {
        taxiType,
        rideClass,
        pickupLocation,
        dropoffLocation,
        paymentMethod,
        promoCode,
        specialRequests,
        scheduledFor,
        passengerCount,
        status: 'pending',
      },
    });
    
    return response.data;
  },
  
  // Get ride by ID
  async getRide(rideId) {
    const response = await apiClient.get(`/rides/${rideId}?populate=*`);
    return response.data;
  },
  
  // Get rider's rides (history)
  async getMyRides(params = {}) {
    const { page = 1, limit = 20, status, sort = 'createdAt:desc' } = params;
    
    const filters = {};
    if (status) filters.status = { $eq: status };
    
    const query = new URLSearchParams({
      'populate': '*',
      'pagination[page]': page,
      'pagination[pageSize]': limit,
      'sort': sort,
      'filters': JSON.stringify(filters),
    });
    
    const response = await apiClient.get(`/rides?${query}`);
    return response;
  },
  
  // Cancel ride
  async cancelRide(rideId, reason) {
    const response = await apiClient.put(`/rides/${rideId}`, {
      data: {
        status: 'cancelled',
        cancelledBy: 'rider',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
      },
    });
    
    return response.data;
  },
  
  // Rate driver
  async rateDriver(rideId, rating, review, tags = []) {
    const response = await apiClient.post('/ratings', {
      data: {
        ride: rideId,
        rating,
        review,
        tags,
      },
    });
    
    return response.data;
  },
  
  // Get available taxi types
  async getTaxiTypes() {
    const response = await apiClient.get('/taxi-types?filters[isActive][$eq]=true&sort=displayOrder:asc');
    return response.data;
  },
  
  // Get ride classes for a taxi type
  async getRideClasses(taxiTypeId) {
    const response = await apiClient.get(
      `/ride-classes?filters[taxiType][id][$eq]=${taxiTypeId}&filters[isActive][$eq]=true&sort=displayOrder:asc`
    );
    return response.data;
  },
  
  // Validate promo code
  async validatePromoCode(code) {
    const response = await apiClient.post('/promo-codes/validate', {
      code,
    });
    return response;
  },
  
  // Apply promo code to estimate
  async applyPromoCode(estimateId, code) {
    const response = await apiClient.post(`/rides/estimate/${estimateId}/apply-promo`, {
      code,
    });
    return response;
  },
  
  // Get active ride (if any)
  async getActiveRide() {
    const response = await apiClient.get(
      '/rides?filters[status][$in]=pending,accepted,arrived,passenger_onboard&filters[rider][id][$eq]=me&sort=createdAt:desc&pagination[limit]=1'
    );
    
    return response.data?.[0] || null;
  },
  
  // Track ride (WebSocket alternative - polling)
  async trackRide(rideId) {
    const response = await apiClient.get(`/rides/${rideId}/track`);
    return response;
  },
  
  // Report issue with ride
  async reportIssue(rideId, issue) {
    const { category, description, photos } = issue;
    
    const response = await apiClient.post('/support-tickets', {
      data: {
        ride: rideId,
        category,
        subject: `Ride Issue: ${category}`,
        description,
        attachments: photos,
        priority: 'high',
        status: 'open',
      },
    });
    
    return response.data;
  },
  
  // Get ride receipt
  async getReceipt(rideId) {
    const response = await apiClient.get(`/rides/${rideId}/receipt`);
    return response;
  },
  
  // Share ride tracking link
  async shareRideTracking(rideId) {
    const response = await apiClient.post(`/rides/${rideId}/share-tracking`);
    return response;
  },
};

export default ridesAPI;
