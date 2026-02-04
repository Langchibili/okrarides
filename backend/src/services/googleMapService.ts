import { Client } from '@googlemaps/google-maps-services-js';

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResult {
  address_components: AddressComponent[];
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

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

class GoogleMapService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('GOOGLE_MAPS_API_KEY is not set in environment variables');
    }
  }

  /**
   * Extract address component by types
   */
  private getAddressComponent(
    addressComponents: AddressComponent[],
    types: string[]
  ): string | null {
    const component = addressComponents.find(comp =>
      types.some(type => comp.types.includes(type))
    );
    return component?.long_name || null;
  }

  /**
   * Parse geocoding result into structured location details
   */
  private parseGeocodeResult(result: GeocodeResult): LocationDetails {
    const { address_components, formatted_address, place_id } = result;

    return {
      name: this.getAddressComponent(address_components, [
        'locality',
        'sublocality',
        'neighborhood'
      ]) || 
      this.getAddressComponent(address_components, [
        'administrative_area_level_2'
      ]) ||
      'Unknown',
      address: formatted_address,
      placeId: place_id,
      city: this.getAddressComponent(address_components, [
        'locality',
        'administrative_area_level_2'
      ]),
      country: this.getAddressComponent(address_components, ['country']),
      postalCode: this.getAddressComponent(address_components, ['postal_code']),
      state: this.getAddressComponent(address_components, [
        'administrative_area_level_1'
      ]),
      streetAddress: this.getAddressComponent(address_components, ['route']),
      streetNumber: this.getAddressComponent(address_components, ['street_number']),
    };
  }

  /**
   * Perform reverse geocoding to get location details from coordinates
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<LocationDetails | null> {
    try {
      if (!this.apiKey) {
        console.error('Google Maps API key is not configured');
        return null;
      }

      const response = await this.client.reverseGeocode({
        params: {
          latlng: {
            lat: latitude,
            lng: longitude,
          },
          key: this.apiKey,
        },
        timeout: 5000, // 5 second timeout
      });

      if (!response.data.results || response.data.results.length === 0) {
        console.warn('No results found for coordinates:', { latitude, longitude });
        return null;
      }

      const result = response.data.results[0];
      return this.parseGeocodeResult(result);
    } catch (error) {
      console.error('Google Maps reverse geocoding error:', error);
      
      if (error.response) {
        console.error('API Response Error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }
      
      return null;
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      if (!this.apiKey) {
        console.error('Google Maps API key is not configured');
        return null;
      }

      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
        },
        timeout: 5000,
      });

      return response.data.result;
    } catch (error) {
      console.error('Google Maps place details error:', error);
      return null;
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
    placeId: string;
  } | null> {
    try {
      if (!this.apiKey) {
        console.error('Google Maps API key is not configured');
        return null;
      }

      const response = await this.client.geocode({
        params: {
          address: address,
          key: this.apiKey,
        },
        timeout: 5000,
      });

      if (!response.data.results || response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        placeId: result.place_id,
      };
    } catch (error) {
      console.error('Google Maps geocoding error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format location details for display
   */
  formatLocationString(locationDetails: LocationDetails): string {
    const parts = [];
    
    if (locationDetails.streetNumber) parts.push(locationDetails.streetNumber);
    if (locationDetails.streetAddress) parts.push(locationDetails.streetAddress);
    if (locationDetails.city) parts.push(locationDetails.city);
    if (locationDetails.state) parts.push(locationDetails.state);
    if (locationDetails.country) parts.push(locationDetails.country);
    
    return parts.join(', ') || locationDetails.address;
  }
}

// Export a singleton instance
export const googleMapService = new GoogleMapService();

// Also export the class for testing purposes
export default GoogleMapService;