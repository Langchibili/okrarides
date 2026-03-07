// PATH: Okra/Okrarides/backend/src/services/yandexMapService.ts
import axios from 'axios';

interface AddressComponent {
  kind: string;
  name: string;
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

class YandexMapService {
  private apiKey: string;
  private geocoderBaseUrl = 'https://geocode-maps.yandex.ru/1.x/';

  constructor() {
    this.apiKey = process.env.YANDEX_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YANDEX_MAPS_API_KEY is not set in environment variables');
    }
  }

  private getComponentByKind(components: AddressComponent[], kind: string): string | null {
    return components.find(c => c.kind === kind)?.name || null;
  }

  private parseGeoObject(geoObject: any): LocationDetails {
    const metaData = geoObject.metaDataProperty?.GeocoderMetaData;
    const address = metaData?.Address;
    const components: AddressComponent[] = address?.Components || [];
    const formattedAddress = address?.formatted || '';
    const point = geoObject.Point?.pos?.split(' ') || ['0', '0'];

    // Yandex uses pos as "lng lat"
    const placeId = `yandex_${point[0]}_${point[1]}`;

    const locality =
      this.getComponentByKind(components, 'locality') ||
      this.getComponentByKind(components, 'district');

    return {
      name:
        locality ||
        this.getComponentByKind(components, 'province') ||
        'Unknown',
      address: formattedAddress,
      placeId,
      city:
        this.getComponentByKind(components, 'locality') ||
        this.getComponentByKind(components, 'district'),
      country: this.getComponentByKind(components, 'country'),
      postalCode: address?.postal_code || null,
      state:
        this.getComponentByKind(components, 'province') ||
        this.getComponentByKind(components, 'area'),
      streetAddress: this.getComponentByKind(components, 'street'),
      streetNumber: this.getComponentByKind(components, 'house'),
    };
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
    try {
      if (!this.apiKey) return null;

      const response = await axios.get(this.geocoderBaseUrl, {
        params: {
          apikey: this.apiKey,
          geocode: `${longitude},${latitude}`,
          format: 'json',
          results: 1,
          lang: 'en_US',
        },
        timeout: 5000,
      });

      const featureMembers =
        response.data?.response?.GeoObjectCollection?.featureMember;
      if (!featureMembers || featureMembers.length === 0) return null;

      return this.parseGeoObject(featureMembers[0].GeoObject);
    } catch (error) {
      console.error('Yandex reverse geocoding error:', error);
      return null;
    }
  }

  async geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
    placeId: string;
  } | null> {
    try {
      if (!this.apiKey) return null;

      const response = await axios.get(this.geocoderBaseUrl, {
        params: {
          apikey: this.apiKey,
          geocode: address,
          format: 'json',
          results: 1,
          lang: 'en_US',
        },
        timeout: 5000,
      });

      const featureMembers =
        response.data?.response?.GeoObjectCollection?.featureMember;
      if (!featureMembers || featureMembers.length === 0) return null;

      const geoObject = featureMembers[0].GeoObject;
      const pos = geoObject.Point?.pos?.split(' ');
      if (!pos || pos.length < 2) return null;

      const lng = parseFloat(pos[0]);
      const lat = parseFloat(pos[1]);

      return {
        latitude: lat,
        longitude: lng,
        placeId: `yandex_${lng}_${lat}`,
      };
    } catch (error) {
      console.error('Yandex geocoding error:', error);
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

export const yandexMapService = new YandexMapService();
export default YandexMapService;
