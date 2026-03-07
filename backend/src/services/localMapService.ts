// PATH: Okra/Okrarides/backend/src/services/localMapService.ts
import axios from 'axios';

interface LocationDetails {
  name: string;
  address: string;
  placeId: string;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  state: string | null;
  streetAddress: string | null;
  streetNumber: string | null;
}

class LocalMapService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.LOCALLY_HOSTED_MAP_SERVER_URL || 'http://localhost';
    if (!process.env.LOCALLY_HOSTED_MAP_SERVER_URL) {
      console.warn('LOCALLY_HOSTED_MAP_SERVER_URL is not set — defaulting to http://localhost');
    }
  }

  /**
   * Reverse geocode using local Nominatim server.
   * Returns the same LocationDetails shape as Google/Yandex services.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/reverse`, {
        params: { lat: latitude, lon: longitude },
        timeout: 8000,
      });

      const data = response.data;
      if (!data || data.error) return null;

      // Local server returns schema matching the target schema exactly
      return {
        name: data.name || data.city || 'Unknown',
        address: data.address || data.streetAddress || '',
        placeId: data.placeId || `local_${latitude}_${longitude}`,
        city: data.city || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        state: data.state || null,
        streetAddress: data.streetAddress || null,
        streetNumber: data.streetNumber || null,
      };
    } catch (error) {
      console.error('Local map service reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Forward geocode an address using local Nominatim.
   */
  async geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
    placeId: string;
  } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/geocode`, {
        params: { q: address, limit: 1 },
        timeout: 8000,
      });

      const results = response.data;
      if (!results || !Array.isArray(results) || results.length === 0) return null;

      const first = results[0];
      return {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        placeId: first.place_id || `local_${first.lat}_${first.lon}`,
      };
    } catch (error) {
      console.error('Local map service geocoding error:', error);
      return null;
    }
  }

  /**
   * Get route between two points using local OSRM.
   */
  async getRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<{
    distance: string;
    duration: string;
    distanceValue: number;
    durationValue: number;
  } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/route`, {
        params: {
          origin: `${originLat},${originLng}`,
          destination: `${destLat},${destLng}`,
        },
        timeout: 10000,
      });

      return response.data || null;
    } catch (error) {
      console.error('Local map service routing error:', error);
      return null;
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const localMapService = new LocalMapService();
export default LocalMapService;
