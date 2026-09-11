import { apiClient } from './client';

export const affiliateAPI = {
  /**
   * Fetches affiliate/user info using the referral code
   * Route: GET /api/affiliate/:code
   */
  async getByCode(code) {
    if (!code) return null;
    try {
      // Note: We use the custom route path defined in Strapi
      const response = await apiClient.get(`/affiliate/${code}`);
      // Based on Strapi controller response: { data: { id, username, affiliateProfile: { ... } } }
      return response.data;
    } catch (error) {
      console.error('Error fetching affiliate by code:', error);
      throw error;
    }
  },
};

export default affiliateAPI;