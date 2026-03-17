// PATH: driver/lib/api/deliveries.js
import { apiClient } from './client';

class DeliveryAPI {
  // ─── Estimate fare ──────────────────────────────────────────────────────────
  async estimateFare(pickupLocation, dropoffLocation, packageType = 'parcel') {
    try {
      const response = await apiClient.post('/deliveries/estimate', {
        pickupLocation: { lat: pickupLocation.lat, lng: pickupLocation.lng, address: pickupLocation.address },
        dropoffLocation: { lat: dropoffLocation.lat, lng: dropoffLocation.lng, address: dropoffLocation.address },
        packageType,
      });
      return { success: true, data: response.estimates ?? response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to estimate fare' };
    }
  }

  // ─── Get single delivery ─────────────────────────────────────────────────────
  async getDelivery(deliveryId) {
    try {
      const response = await apiClient.get(`/deliveries/${deliveryId}?populate=*`);
      return { success: true, data: response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to fetch delivery' };
    }
  }

  // ─── Get delivery history ────────────────────────────────────────────────────
  async getDeliveryHistory(params = {}) {
    const { page = 1, limit = 20, rideStatus, sort = 'createdAt:desc' } = params;
    try {
      const q = new URLSearchParams({
        'pagination[page]': page,
        'pagination[pageSize]': limit,
        sort,
        'populate[0]': 'sender',
        'populate[1]': 'deliverer',
        'populate[2]': 'package',
        'populate[3]': 'vehicle',
      });
      if (rideStatus) q.append('filters[rideStatus][$eq]', rideStatus);
      const response = await apiClient.get(`/deliveries?${q.toString()}`);
      return {
        success: true,
        data: response.data ?? response.data?.data ?? [],
        meta: response.meta,
      };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to fetch delivery history', data: [] };
    }
  }

  // ─── Get active delivery ─────────────────────────────────────────────────────
  async getActiveDelivery() {
    try {
      const response = await apiClient.get('/deliveries/active');
      return {
        success: true,
        data: response.data ?? null,
        userRole: response.userRole ?? null,
      };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to fetch active delivery', data: null };
    }
  }

  // ─── Accept ──────────────────────────────────────────────────────────────────
  async acceptDelivery(deliveryId) {
    try {
      const response = await apiClient.post(`/deliveries/${deliveryId}/accept`);
      return { success: true, data: response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to accept delivery' };
    }
  }

  // ─── Decline ─────────────────────────────────────────────────────────────────
  async declineDelivery(deliveryId, reason = 'Driver declined') {
    try {
      const response = await apiClient.post(`/deliveries/${deliveryId}/decline`, { reason });
      return { success: true, data: response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to decline delivery' };
    }
  }

  // ─── Confirm arrival at pickup ───────────────────────────────────────────────
  async confirmArrival(deliveryId) {
    try {
      const response = await apiClient.post(`/deliveries/${deliveryId}/confirm-arrival`);
      return { success: true, data: response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to confirm arrival' };
    }
  }

  // ─── Start delivery (package picked up) ─────────────────────────────────────
  async startDelivery(deliveryId) {
    try {
      const response = await apiClient.post(`/deliveries/${deliveryId}/start`);
      return { success: true, data: response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to start delivery' };
    }
  }

  // ─── Request payment ─────────────────────────────────────────────────────────
  async requestPayment(deliveryId) {
    try {
      const response = await apiClient.post(`/deliveries/${deliveryId}/request-payment`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to request payment' };
    }
  }

  // ─── Complete delivery ───────────────────────────────────────────────────────
  async completeDelivery(deliveryId, data = {}) {
    try {
      const response = await apiClient.post(`/deliveries/${deliveryId}/complete`, data);
      return { success: true, data: response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to complete delivery' };
    }
  }

  // ─── Cancel ──────────────────────────────────────────────────────────────────
  async cancelDelivery(deliveryId, reason, cancelledBy = 'deliverer') {
    try {
      const response = await apiClient.post(`/deliveries/${deliveryId}/cancel`, { reason, cancelledBy });
      return { success: true, data: response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to cancel delivery' };
    }
  }

  // ─── Rate ────────────────────────────────────────────────────────────────────
  async rateDelivery(deliveryId, rating, review = '', tags = []) {
    try {
      const response = await apiClient.post(`/deliveries/${deliveryId}/rate`, {
        rating, review, tags, ratedBy: 'deliverer',
      });
      return { success: true, data: response.data ?? response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to submit rating' };
    }
  }

  // ─── Track ───────────────────────────────────────────────────────────────────
  async trackDelivery(deliveryId) {
    try {
      const response = await apiClient.get(`/deliveries/${deliveryId}/track`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to track delivery' };
    }
  }

  // ─── Toggle online (delivery driver) ────────────────────────────────────────
  async toggleDeliveryOnline() {
    try {
      const response = await apiClient.post('/delivery-driver/toggle-online');
      return { success: true, ...response };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to toggle online status' };
    }
  }

  // ─── Delivery driver stats ───────────────────────────────────────────────────
  async getDeliveryStats(period = 'today') {
    try {
      const response = await apiClient.get(`/delivery-driver/stats?period=${period}`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const deliveriesAPI = new DeliveryAPI();
export default DeliveryAPI;