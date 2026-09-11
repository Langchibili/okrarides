// // PATH: Okra/Okrarides/backend/src/services/yandexMapService.ts
// import axios from 'axios';

// interface AddressComponent {
//   kind: string;
//   name: string;
// }

// interface LocationDetails {
//   name: string;
//   address: string;
//   placeId: string;
//   city: string | null;
//   country: string | null;
//   postalCode: string | null;
//   state: string | null;
//   streetAddress: string | null;
//   streetNumber: string | null;
// }

// class YandexMapService {
//   private apiKey: string;
//   private geocoderBaseUrl = 'https://geocode-maps.yandex.ru/1.x/';

//   constructor() {
//     this.apiKey = process.env.YANDEX_MAPS_API_KEY || '';
//     if (!this.apiKey) {
//       console.warn('YANDEX_MAPS_API_KEY is not set in environment variables');
//     }
//   }

//   private getComponentByKind(components: AddressComponent[], kind: string): string | null {
//     return components.find(c => c.kind === kind)?.name || null;
//   }

//   private parseGeoObject(geoObject: any): LocationDetails {
//     const metaData = geoObject.metaDataProperty?.GeocoderMetaData;
//     const address = metaData?.Address;
//     const components: AddressComponent[] = address?.Components || [];
//     const formattedAddress = address?.formatted || '';
//     const point = geoObject.Point?.pos?.split(' ') || ['0', '0'];

//     // Yandex uses pos as "lng lat"
//     const placeId = `yandex_${point[0]}_${point[1]}`;

//     const locality =
//       this.getComponentByKind(components, 'locality') ||
//       this.getComponentByKind(components, 'district');

//     return {
//       name:
//         locality ||
//         this.getComponentByKind(components, 'province') ||
//         'Unknown',
//       address: formattedAddress,
//       placeId,
//       city:
//         this.getComponentByKind(components, 'locality') ||
//         this.getComponentByKind(components, 'district'),
//       country: this.getComponentByKind(components, 'country'),
//       postalCode: address?.postal_code || null,
//       state:
//         this.getComponentByKind(components, 'province') ||
//         this.getComponentByKind(components, 'area'),
//       streetAddress: this.getComponentByKind(components, 'street'),
//       streetNumber: this.getComponentByKind(components, 'house'),
//     };
//   }

//   async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
//     try {
//       if (!this.apiKey) return null;

//       const response = await axios.get(this.geocoderBaseUrl, {
//         params: {
//           apikey: this.apiKey,
//           geocode: `${longitude},${latitude}`,
//           format: 'json',
//           results: 1,
//           lang: 'en_US',
//         },
//         timeout: 5000,
//       });

//       const featureMembers =
//         response.data?.response?.GeoObjectCollection?.featureMember;
//       if (!featureMembers || featureMembers.length === 0) return null;

//       return this.parseGeoObject(featureMembers[0].GeoObject);
//     } catch (error) {
//       console.error('Yandex reverse geocoding error:', error);
//       return null;
//     }
//   }

//   async geocodeAddress(address: string): Promise<{
//     latitude: number;
//     longitude: number;
//     placeId: string;
//   } | null> {
//     try {
//       if (!this.apiKey) return null;

//       const response = await axios.get(this.geocoderBaseUrl, {
//         params: {
//           apikey: this.apiKey,
//           geocode: address,
//           format: 'json',
//           results: 1,
//           lang: 'en_US',
//         },
//         timeout: 5000,
//       });

//       const featureMembers =
//         response.data?.response?.GeoObjectCollection?.featureMember;
//       if (!featureMembers || featureMembers.length === 0) return null;

//       const geoObject = featureMembers[0].GeoObject;
//       const pos = geoObject.Point?.pos?.split(' ');
//       if (!pos || pos.length < 2) return null;

//       const lng = parseFloat(pos[0]);
//       const lat = parseFloat(pos[1]);

//       return {
//         latitude: lat,
//         longitude: lng,
//         placeId: `yandex_${lng}_${lat}`,
//       };
//     } catch (error) {
//       console.error('Yandex geocoding error:', error);
//       return null;
//     }
//   }

//   calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//     const R = 6371;
//     const dLat = this.toRadians(lat2 - lat1);
//     const dLon = this.toRadians(lon2 - lon1);
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(this.toRadians(lat1)) *
//         Math.cos(this.toRadians(lat2)) *
//         Math.sin(dLon / 2) *
//         Math.sin(dLon / 2);
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   }

//   private toRadians(degrees: number): number {
//     return degrees * (Math.PI / 180);
//   }

//   formatLocationString(locationDetails: LocationDetails): string {
//     const parts = [];
//     if (locationDetails.streetNumber) parts.push(locationDetails.streetNumber);
//     if (locationDetails.streetAddress) parts.push(locationDetails.streetAddress);
//     if (locationDetails.city) parts.push(locationDetails.city);
//     if (locationDetails.state) parts.push(locationDetails.state);
//     if (locationDetails.country) parts.push(locationDetails.country);
//     return parts.join(', ') || locationDetails.address;
//   }
// }

// export const yandexMapService = new YandexMapService();
// export default YandexMapService;

// PATH: Okra/Okrarides/backend/src/services/yandexMapService.ts
//
// Yandex Maps backend service.
//
// Active API endpoints:
//   ─ Geocoder API  (geocode-maps.yandex.ru/1.x/)
//       reverseGeocode   — latlng → address
//       geocodeAddress   — address string → latlng
//   ─ Router API    (api.routing.yandex.net/v2/route)
//       computeRoute     — latlng pair → distance / ETA / polyline
//
// calculateDistance remains a haversine helper (no API call, zero cost).
// Suggest / autocomplete is NOT implemented — the Geocoder API is used
// for address lookup in this service.

import axios, { AxiosInstance } from 'axios';
import type { RouteResult } from './googleMapService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressComponent {
  kind: string;
  name: string;
}

export interface LocationDetails {
  name:          string;
  address:       string;
  placeId:       string;
  lat:           number;
  lng:           number;
  city:          string | null;
  country:       string | null;
  postalCode:    string | null;
  state:         string | null;
  streetAddress: string | null;
  streetNumber:  string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// YandexMapService
// ─────────────────────────────────────────────────────────────────────────────

class YandexMapService {
  private readonly apiKey:         string;
  private readonly geocoderClient: AxiosInstance;
  private readonly routerClient:   AxiosInstance;

  constructor() {
    this.apiKey = process.env.YANDEX_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[YandexMapService] YANDEX_MAPS_API_KEY is not set');
    }

    // Geocoder API
    this.geocoderClient = axios.create({
      baseURL: 'https://geocode-maps.yandex.ru/1.x/',
      timeout: 8_000,
      params: {
        apikey: this.apiKey,
        format: 'json',
        lang:   'en_US',
      },
    });

    // Router API
    this.routerClient = axios.create({
      baseURL: 'https://api.routing.yandex.net/v2',
      timeout: 10_000,
      params: {
        apikey: this.apiKey,
        lang:   'en_US',
      },
    });
  }

  // ── Geocoder helpers ──────────────────────────────────────────────────────

  private getComponentByKind(components: AddressComponent[], kind: string): string | null {
    return components.find((c) => c.kind === kind)?.name ?? null;
  }

  private parseGeoObject(geoObject: any): LocationDetails {
    const meta       = geoObject.metaDataProperty?.GeocoderMetaData;
    const address    = meta?.Address;
    const components: AddressComponent[] = address?.Components ?? [];
    const formatted  = address?.formatted ?? '';
    const pos        = geoObject.Point?.pos?.split(' ') ?? ['0', '0'];
    const lng        = parseFloat(pos[0]);
    const lat        = parseFloat(pos[1]);

    const locality =
      this.getComponentByKind(components, 'locality') ||
      this.getComponentByKind(components, 'district');

    return {
      lat,
      lng,
      address:  formatted,
      placeId:  `yandex_${lng}_${lat}`,
      name:     locality || this.getComponentByKind(components, 'province') || 'Unknown',
      city:     this.getComponentByKind(components, 'locality') || this.getComponentByKind(components, 'district'),
      country:  this.getComponentByKind(components, 'country'),
      postalCode: address?.postal_code ?? null,
      state:    this.getComponentByKind(components, 'province') || this.getComponentByKind(components, 'area'),
      streetAddress: this.getComponentByKind(components, 'street'),
      streetNumber:  this.getComponentByKind(components, 'house'),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Geocoder — reverse geocode (latlng → address)
  // ─────────────────────────────────────────────────────────────────────────

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
    if (!this.apiKey) return null;

    try {
      const { data } = await this.geocoderClient.get('', {
        params: { geocode: `${longitude},${latitude}`, results: 1 },
      });

      const members = data?.response?.GeoObjectCollection?.featureMember;
      if (!members?.length) return null;

      return this.parseGeoObject(members[0].GeoObject);
    } catch (err: any) {
      console.error('[YandexMapService.reverseGeocode] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Geocoder — forward geocode (address string → latlng)
  // ─────────────────────────────────────────────────────────────────────────

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; placeId: string } | null> {
    if (!this.apiKey || !address) return null;

    try {
      const { data } = await this.geocoderClient.get('', {
        params: { geocode: address, results: 1 },
      });

      const members = data?.response?.GeoObjectCollection?.featureMember;
      if (!members?.length) return null;

      const pos = members[0].GeoObject.Point?.pos?.split(' ');
      if (!pos || pos.length < 2) return null;

      const lng = parseFloat(pos[0]);
      const lat = parseFloat(pos[1]);

      return { latitude: lat, longitude: lng, placeId: `yandex_${lng}_${lat}` };
    } catch (err: any) {
      console.error('[YandexMapService.geocodeAddress] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Router API — compute route (latlng pair → distance / ETA / polyline)
  //
  // POST https://api.routing.yandex.net/v2/route
  //
  // waypoints format: "lng,lat|lng,lat"
  // Yandex returns segments with encoded polylines; we decode each leg
  // into [[lng, lat], ...] GeoJSON order to match the shared RouteResult type.
  //
  // mode: driving (car) — change to "walking" or "transit" as needed.
  // ─────────────────────────────────────────────────────────────────────────

  async computeRoute(
    origin:      { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<RouteResult | null> {
    if (!this.apiKey) return null;

    try {
      const { data } = await this.routerClient.post('/route', {
        waypoints: [
          { type: 'WAYPOINT', point: { lat: origin.lat,      lon: origin.lng      } },
          { type: 'WAYPOINT', point: { lat: destination.lat, lon: destination.lng } },
        ],
        departureTime: new Date().toISOString(),
        routingMode:   'OPTIMAL',
        vehicle:       { type: 'DEFAULT' },
      });

      // Yandex Router v2 response shape:
      // data.route.legs[] → leg.steps[] → step.polyline (encoded)
      // data.route.legs[] → leg.duration / leg.length
      const route = data?.route;
      if (!route) return null;

      const legs: any[] = route.legs ?? [];

      // Aggregate totals across all legs
      let totalDistanceM = 0;
      let totalDurationS = 0;
      const geometry: [number, number][] = [];

      for (const leg of legs) {
        totalDistanceM += Number(leg.length ?? 0);
        totalDurationS += Number(leg.duration ?? 0);

        // Decode each step's polyline and append to the full geometry
        for (const step of (leg.steps ?? []) as any[]) {
          if (step.polyline) {
            geometry.push(...decodeYandexPolyline(step.polyline));
          } else if (step.maneuver?.position) {
            // Fallback when no polyline — record the maneuver position only
            const p = step.maneuver.position;
            geometry.push([p.lon, p.lat]);
          }
        }
      }

      const km  = totalDistanceM / 1000;
      const min = totalDurationS / 60;

      return {
        distanceMeters: Math.round(totalDistanceM),
        distanceText:   km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(totalDistanceM)} m`,
        durationSec:    Math.round(totalDurationS),
        durationText:   min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
        geometry,
      };
    } catch (err: any) {
      console.error('[YandexMapService.computeRoute] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Convenience wrappers — delegate to computeRoute to avoid double calls
  // ─────────────────────────────────────────────────────────────────────────

  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<{ distanceMeters: number; distanceText: string } | null> {
    const route = await this.computeRoute(origin, destination);
    if (!route) return null;
    return { distanceMeters: route.distanceMeters, distanceText: route.distanceText };
  }

  async calculateEta(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<{ durationSec: number; durationText: string } | null> {
    const route = await this.computeRoute(origin, destination);
    if (!route) return null;
    return { durationSec: route.durationSec, durationText: route.durationText };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Haversine straight-line distance — zero cost, never fails
  // ─────────────────────────────────────────────────────────────────────────

  calculateDistanceFallback(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R    = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  formatLocationString(details: LocationDetails): string {
    return (
      [details.streetNumber, details.streetAddress, details.city, details.state, details.country]
        .filter(Boolean)
        .join(', ') || details.address
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Decode a Yandex encoded polyline (same algorithm as Google's) into
 * [[lng, lat], ...] GeoJSON coordinate order.
 *
 * Yandex Router returns polylines encoded with the same variable-length
 * integer encoding as Google Maps. The coordinate order in the encoded
 * string is (lat, lng), so we swap on output.
 */
function decodeYandexPolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;

    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;

    coords.push([lng / 1e5, lat / 1e5]); // GeoJSON: [longitude, latitude]
  }
  return coords;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const yandexMapService = new YandexMapService();
export default YandexMapService;