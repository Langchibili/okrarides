import { apiClient } from './client'

export const onboardingAPI = {
  // Upload document
  async uploadDocument(documentType, file, ref, fieldId) {
    const formData = new FormData()
    formData.append('files', file)
    formData.append('ref', ref)
    formData.append('refId', fieldId)
    formData.append('field', documentType)

    const response = await apiClient.upload('/upload', formData)
    return response
  },

  // Save license info
  async saveLicenseInfo(data) {
    const response = await apiClient.post('/driver/onboarding/license', data)
    return response
  },

  // Save national ID info
  async saveNationalIdInfo(data) {
    const response = await apiClient.post('/driver/onboarding/national-id', data)
    return response
  },

  // Save proof of address
  async saveProofOfAddress(data) {
    const response = await apiClient.post('/driver/onboarding/proof-of-address', data)
    return response
  },

  // Save vehicle type
  async saveVehicleType(data) {
    const response = await apiClient.post('/driver/onboarding/vehicle-type', data)
    return response
  },

  // Save vehicle details
  async saveVehicleDetails(data) {
    const response = await apiClient.post('/driver/onboarding/vehicle-details', data)
    return response
  },

  // Submit for verification
  async submitForVerification() {
    const response = await apiClient.post('/driver/onboarding/submit')
    return response
  },

  // Get onboarding status
  async getOnboardingStatus() {
    const response = await apiClient.get('/driver/onboarding/status')
    return response
  },
}

export default onboardingAPI

// Export individual functions for convenience
export const {
  uploadDocument,
  saveLicenseInfo,
  saveNationalIdInfo,
  saveProofOfAddress,
  saveVehicleType,
  saveVehicleDetails,
  submitForVerification,
  getOnboardingStatus,
} = onboardingAPI

