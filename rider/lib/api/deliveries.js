// PATH: rider/lib/api/deliveries.js
import { apiClient } from './client';

// ─── Estimate fare ────────────────────────────────────────────────────────────
export async function estimateDeliveryFare({ pickupLocation, dropoffLocation, packageType = 'parcel' }) {
  return apiClient.post('/deliveries/estimate', {
    pickupLocation,
    dropoffLocation,
    packageType,
  });
}

// ─── Create delivery request ──────────────────────────────────────────────────
export async function createDelivery(data) {
  return apiClient.post('/deliveries', { data });
}

// ─── Get single delivery ──────────────────────────────────────────────────────
export async function getDelivery(id) {
  return apiClient.get(`/deliveries/${id}?populate=deliverer.driverProfile,deliverer.deliveryProfile,package,vehicle`);
}

// ─── Get deliverer location ───────────────────────────────────────────────────
export async function getDelivererLocation(deliveryId) {
  return apiClient.get(`/deliveries/${deliveryId}/deliverer-location`);
}

// ─── Track delivery ───────────────────────────────────────────────────────────
export async function trackDelivery(deliveryId) {
  return apiClient.get(`/deliveries/${deliveryId}/track`);
}

// ─── Cancel delivery (sender side) ───────────────────────────────────────────
export async function cancelDelivery(deliveryId, reason) {
  return apiClient.post(`/deliveries/${deliveryId}/cancel`, {
    reason,
    cancelledBy: 'sender',
  });
}

// ─── Rate delivery ────────────────────────────────────────────────────────────
export async function rateDelivery(deliveryId, rating, review = '', tags = []) {
  return apiClient.post(`/deliveries/${deliveryId}/rate`, {
    rating, review, tags, ratedBy: 'sender',
  });
}

// ─── Get delivery history (sender's deliveries) ───────────────────────────────
export async function getDeliveryHistory({ page = 1, limit = 20, rideStatus } = {}) {
  const q = new URLSearchParams({
    'pagination[page]': page,
    'pagination[pageSize]': limit,
    'sort': 'createdAt:desc',
    'populate[0]': 'deliverer',
    'populate[1]': 'package',
    'populate[2]': 'vehicle',
  });
  if (rideStatus) q.append('filters[rideStatus][$eq]', rideStatus);
  return apiClient.get(`/deliveries?${q}`);
}

// ─── Get active delivery ──────────────────────────────────────────────────────
export async function getActiveDelivery() {
  return apiClient.get('/deliveries/active');
}

// ─── Pay cash (sender confirms cash payment) ─────────────────────────────────
export async function payCashDelivery(deliveryId) {
  return apiClient.post(`/deliveries/${deliveryId}/pay-cash`);
}

export default {
  estimateDeliveryFare,
  createDelivery,
  getDelivery,
  getDelivererLocation,
  trackDelivery,
  cancelDelivery,
  rateDelivery,
  getDeliveryHistory,
  getActiveDelivery,
  payCashDelivery,
};