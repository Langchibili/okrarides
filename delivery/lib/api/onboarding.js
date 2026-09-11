// PATH: driver/lib/api/onboarding.js  (DELIVERY FRONTEND VERSION)
// Changes from ride driver version:
//   - saveVehicleType     → /delivery-driver/onboarding/vehicle-type
//   - saveVehicleDetails  → /delivery-driver/onboarding/vehicle-details
//   - submitForVerification → /delivery-driver/onboarding/submit
//   - getOnboardingStatus → /delivery-driver/onboarding/status
//
// UNCHANGED (documents live on driverProfile for both ride and delivery drivers):
//   - uploadDocument
//   - saveLicenseInfo     → /driver/onboarding/license
//   - saveNationalIdInfo  → /driver/onboarding/national-id
//   - saveProofOfAddress  → /driver/onboarding/proof-of-address

import { apiClient } from './client';

export const onboardingAPI = {
  async uploadDocument(documentType, file, ref, fieldId) {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('ref', ref);
    formData.append('refId', fieldId);
    formData.append('field', documentType);
    return apiClient.upload('/upload', formData);
  },

  // ─── Document steps — same endpoint as ride driver (docs on driverProfile) ─
  async saveLicenseInfo(data) {
    return apiClient.post('/driver/onboarding/license', data);
  },

  async saveNationalIdInfo(data) {
    return apiClient.post('/driver/onboarding/national-id', data);
  },

  async saveProofOfAddress(data) {
    return apiClient.post('/driver/onboarding/proof-of-address', data);
  },

  // ─── Delivery-specific steps ──────────────────────────────────────────────
  async saveVehicleType(data) {
    return apiClient.post('/delivery-driver/onboarding/vehicle-type', data);
  },

  async saveVehicleDetails(data) {
    return apiClient.post('/delivery-driver/onboarding/vehicle-details', data);
  },

  async submitForVerification() {
    return apiClient.post('/delivery-driver/onboarding/submit');
  },

  async getOnboardingStatus() {
    return apiClient.get('/delivery-driver/onboarding/status');
  },
};

export default onboardingAPI;

// Named exports for convenience
export const {
  uploadDocument,
  saveLicenseInfo,
  saveNationalIdInfo,
  saveProofOfAddress,
  saveVehicleType,
  saveVehicleDetails,
  submitForVerification,
  getOnboardingStatus,
} = onboardingAPI;