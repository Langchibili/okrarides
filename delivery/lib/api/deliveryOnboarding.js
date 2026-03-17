// PATH: driver/lib/api/deliveryOnboarding.js
import { apiClient } from './client';

export const deliveryOnboardingAPI = {
  // Document steps reuse the existing ride-driver endpoints:
  //   POST /driver/onboarding/license
  //   POST /driver/onboarding/national-id
  //   POST /driver/onboarding/proof-of-address
  // Those are already in lib/api/onboarding.js — no new endpoints needed.

  // ─── Delivery-specific steps ─────────────────────────────────────────────────

  /** POST /delivery-driver/onboarding/vehicle-type */
  async saveDeliveryVehicleType(vehicleType) {
    return apiClient.post('/delivery-driver/onboarding/vehicle-type', { vehicleType });
  },

  /** POST /delivery-driver/onboarding/vehicle-details */
  async saveDeliveryVehicleDetails(data) {
    return apiClient.post('/delivery-driver/onboarding/vehicle-details', data);
  },

  /** POST /delivery-driver/onboarding/submit */
  async submitDeliveryForVerification() {
    return apiClient.post('/delivery-driver/onboarding/submit');
  },

  /** GET /delivery-driver/onboarding/status */
  async getDeliveryOnboardingStatus() {
    return apiClient.get('/delivery-driver/onboarding/status');
  },

  /** GET /delivery-driver/vehicle */
  async getDeliveryVehicle() {
    return apiClient.get('/delivery-driver/vehicle');
  },
};

export default deliveryOnboardingAPI;