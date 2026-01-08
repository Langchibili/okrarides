import { apiClient } from './client';

export const profileAPI = {
  // Get user profile
  async getProfile() {
    const response = await apiClient.get('/users/me?populate=deep');
    return response;
  },

  // Update basic info
  async updateProfile(data) {
    const response = await apiClient.put('/users/me', data);
    return response;
  },

  // Update profile picture
  async updateProfilePicture(file) {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('ref', 'plugin::users-permissions.user');
    formData.append('refId', 'me');
    formData.append('field', 'profilePicture');

    const response = await apiClient.upload('/upload', formData);
    return response;
  },

  // Get favorite locations
  async getFavoriteLocations() {
    const response = await apiClient.get('/favorite-locations?filters[user][id][$eq]=me&sort=createdAt:desc');
    return response.data;
  },

  // Add favorite location
  async addFavoriteLocation(data) {
    const { label, address, location, icon } = data;
    
    const response = await apiClient.post('/favorite-locations', {
      data: {
        label,
        address,
        location,
        icon,
        user: 'me',
      },
    });
    
    return response.data;
  },

  // Update favorite location
  async updateFavoriteLocation(id, data) {
    const response = await apiClient.put(`/favorite-locations/${id}`, {
      data,
    });
    return response.data;
  },

  // Delete favorite location
  async deleteFavoriteLocation(id) {
    const response = await apiClient.delete(`/favorite-locations/${id}`);
    return response;
  },

  // Get emergency contacts
  async getEmergencyContacts() {
    const response = await apiClient.get('/emergency-contacts?filters[user][id][$eq]=me&sort=isPrimary:desc,createdAt:desc');
    return response.data;
  },

  // Add emergency contact
  async addEmergencyContact(data) {
    const { name, phoneNumber, relationship, isPrimary } = data;
    
    const response = await apiClient.post('/emergency-contacts', {
      data: {
        name,
        phoneNumber,
        relationship,
        isPrimary,
        user: 'me',
      },
    });
    
    return response.data;
  },

  // Update emergency contact
  async updateEmergencyContact(id, data) {
    const response = await apiClient.put(`/emergency-contacts/${id}`, {
      data,
    });
    return response.data;
  },

  // Delete emergency contact
  async deleteEmergencyContact(id) {
    const response = await apiClient.delete(`/emergency-contacts/${id}`);
    return response;
  },

  // Get referral stats
  async getReferralStats() {
    const response = await apiClient.get('/users/me?populate=affiliateProfile');
    return response.affiliateProfile;
  },

  // Get referral transactions
  async getReferralTransactions(params = {}) {
    const { page = 1, limit = 20 } = params;
    
    const query = new URLSearchParams({
      'populate': '*',
      'pagination[page]': page,
      'pagination[pageSize]': limit,
      'sort': 'createdAt:desc',
      'filters[affiliate][id][$eq]': 'me',
    });

    const response = await apiClient.get(`/affiliate-transactions?${query}`);
    return response;
  },

  // Redeem referral points
  async redeemPoints(points) {
    const response = await apiClient.post('/affiliate-transactions/redeem', {
      points,
    });
    return response.data;
  },
};

export default profileAPI;
