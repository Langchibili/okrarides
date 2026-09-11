// //Okrarides\backend\src\services\googleMapService.ts
// import { Client } from '@googlemaps/google-maps-services-js';

// interface AddressComponent {
//   long_name: string;
//   short_name: string;
//   types: string[];
// }

// interface GeocodeResult {
//   address_components: AddressComponent[];
//   formatted_address: string;
//   place_id: string;
//   geometry: {
//     location: {
//       lat: number;
//       lng: number;
//     };
//   };
//   types: string[];
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

// class GoogleMapService {
//   private client: Client;
//   private apiKey: string;

//   constructor() {
//     this.client = new Client({});
//     this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    
//     if (!this.apiKey) {
//       console.warn('GOOGLE_MAPS_API_KEY is not set in environment variables');
//     }
//   }

//   /**
//    * Extract address component by types
//    */
//   private getAddressComponent(
//     addressComponents: AddressComponent[],
//     types: string[]
//   ): string | null {
//     const component = addressComponents.find(comp =>
//       types.some(type => comp.types.includes(type))
//     );
//     return component?.long_name || null;
//   }

//   /**
//    * Parse geocoding result into structured location details
//    */
//   private parseGeocodeResult(result: GeocodeResult): LocationDetails {
//     const { address_components, formatted_address, place_id } = result;

//     return {
//       name: this.getAddressComponent(address_components, [
//         'locality',
//         'sublocality',
//         'neighborhood'
//       ]) || 
//       this.getAddressComponent(address_components, [
//         'administrative_area_level_2'
//       ]) ||
//       'Unknown',
//       address: formatted_address,
//       placeId: place_id,
//       city: this.getAddressComponent(address_components, [
//         'locality',
//         'administrative_area_level_2'
//       ]),
//       country: this.getAddressComponent(address_components, ['country']),
//       postalCode: this.getAddressComponent(address_components, ['postal_code']),
//       state: this.getAddressComponent(address_components, [
//         'administrative_area_level_1'
//       ]),
//       streetAddress: this.getAddressComponent(address_components, ['route']),
//       streetNumber: this.getAddressComponent(address_components, ['street_number']),
//     };
//   }

//   /**
//    * Perform reverse geocoding to get location details from coordinates
//    */
//   async reverseGeocode(
//     latitude: number,
//     longitude: number
//   ): Promise<LocationDetails | null> {
//     try {
//       if (!this.apiKey) {
//         console.error('Google Maps API key is not configured');
//         return null;
//       }

//       const response = await this.client.reverseGeocode({
//         params: {
//           latlng: {
//             lat: latitude,
//             lng: longitude,
//           },
//           key: this.apiKey,
//         },
//         timeout: 5000, // 5 second timeout
//       });

//       if (!response.data.results || response.data.results.length === 0) {
//         console.warn('No results found for coordinates:', { latitude, longitude });
//         return null;
//       }

//       const result = response.data.results[0];
//       return this.parseGeocodeResult(result);
//     } catch (error) {
//       console.error('Google Maps reverse geocoding error:', error);
      
//       if (error.response) {
//         console.error('API Response Error:', {
//           status: error.response.status,
//           statusText: error.response.statusText,
//           data: error.response.data,
//         });
//       }
      
//       return null;
//     }
//   }

//   /**
//    * Get place details by place ID
//    */
//   async getPlaceDetails(placeId: string): Promise<any> {
//     try {
//       if (!this.apiKey) {
//         console.error('Google Maps API key is not configured');
//         return null;
//       }

//       const response = await this.client.placeDetails({
//         params: {
//           place_id: placeId,
//           key: this.apiKey,
//         },
//         timeout: 5000,
//       });

//       return response.data.result;
//     } catch (error) {
//       console.error('Google Maps place details error:', error);
//       return null;
//     }
//   }

//   /**
//    * Geocode an address to get coordinates
//    */
//   async geocodeAddress(address: string): Promise<{
//     latitude: number;
//     longitude: number;
//     placeId: string;
//   } | null> {
//     try {
//       if (!this.apiKey) {
//         console.error('Google Maps API key is not configured');
//         return null;
//       }

//       const response = await this.client.geocode({
//         params: {
//           address: address,
//           key: this.apiKey,
//         },
//         timeout: 5000,
//       });

//       if (!response.data.results || response.data.results.length === 0) {
//         return null;
//       }

//       const result = response.data.results[0];
//       return {
//         latitude: result.geometry.location.lat,
//         longitude: result.geometry.location.lng,
//         placeId: result.place_id,
//       };
//     } catch (error) {
//       console.error('Google Maps geocoding error:', error);
//       return null;
//     }
//   }

//   /**
//    * Calculate distance between two coordinates (in kilometers)
//    */
//   calculateDistance(
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number
//   ): number {
//     const R = 6371; // Radius of the Earth in kilometers
//     const dLat = this.toRadians(lat2 - lat1);
//     const dLon = this.toRadians(lon2 - lon1);
    
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(this.toRadians(lat1)) *
//         Math.cos(this.toRadians(lat2)) *
//         Math.sin(dLon / 2) *
//         Math.sin(dLon / 2);
    
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c;
    
//     return distance;
//   }

//   /**
//    * Convert degrees to radians
//    */
//   private toRadians(degrees: number): number {
//     return degrees * (Math.PI / 180);
//   }

//   /**
//    * Format location details for display
//    */
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

// // Export a singleton instance
// export const googleMapService = new GoogleMapService();

// // Also export the class for testing purposes
// export default GoogleMapService;
// PATH: Okra/Okrarides/backend/src/services/googleMapService.ts
//
// Cost-optimized Google Maps implementation.
//
// Three-step flow (all Essentials tier):
//   1. Autocomplete (New)  — per-request, no session token     ~$2.83 / 1k
//   2. Geocoding API       — placeId → lat/lng                  $5.00 / 1k
//   3. Routes API          — coordinates → distance/ETA/polyline $5.00 / 1k
//
// Field masking is applied at every step so we never accidentally trigger
// a higher pricing tier.

import axios, { AxiosInstance } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddressComponent {
  long_name:  string;
  short_name: string;
  types:      string[];
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

export interface PlaceSuggestion {
  placeId:       string;
  mainText:      string;
  secondaryText: string;
  fullText:      string;
}

export interface RouteResult {
  distanceMeters: number;
  distanceText:   string;
  durationSec:    number;
  durationText:   string;
  geometry:       [number, number][]; // [[lng, lat], ...] GeoJSON order
}

// ─────────────────────────────────────────────────────────────────────────────
// GoogleMapService
// ─────────────────────────────────────────────────────────────────────────────

class GoogleMapService {
  private readonly apiKey:        string;
  private readonly geocodeClient: AxiosInstance;
  private readonly placesClient:  AxiosInstance;
  private readonly routesClient:  AxiosInstance;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[GoogleMapService] GOOGLE_MAPS_API_KEY is not set');
    }

    // Geocoding API — maps.googleapis.com
    this.geocodeClient = axios.create({
      baseURL: 'https://maps.googleapis.com/maps/api/geocode',
      timeout: 8_000,
      params:  { key: this.apiKey, language: 'en' },
    });

    // Places (Autocomplete New) — places.googleapis.com
    this.placesClient = axios.create({
      baseURL:  'https://places.googleapis.com/v1/places',
      timeout:  8_000,
      headers: {
        'Content-Type':   'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
    });

    // Routes API — routes.googleapis.com
    this.routesClient = axios.create({
      baseURL:  'https://routes.googleapis.com/directions/v2',
      timeout:  10_000,
      headers: {
        'Content-Type':   'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
    });
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  private getAddressComponent(components: AddressComponent[], types: string[]): string | null {
    return (
      components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null
    );
  }

  private parseGeocodeResult(result: any): LocationDetails {
    const comps = result.address_components ?? [];
    const get   = (types: string[]) => this.getAddressComponent(comps, types);

    return {
      lat:           result.geometry.location.lat,
      lng:           result.geometry.location.lng,
      address:       result.formatted_address ?? '',
      placeId:       result.place_id           ?? '',
      name:
        get(['locality', 'sublocality', 'neighborhood']) ||
        get(['administrative_area_level_2']) ||
        result.formatted_address?.split(',')[0] ||
        'Unknown',
      city:          get(['locality', 'administrative_area_level_2']),
      country:       get(['country']),
      postalCode:    get(['postal_code']),
      state:         get(['administrative_area_level_1']),
      streetAddress: get(['route']),
      streetNumber:  get(['street_number']),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Place Autocomplete (New)
  //
  // POST https://places.googleapis.com/v1/places:autocomplete
  // Field mask : suggestions.placePrediction.text
  //              suggestions.placePrediction.placeId
  // Tier       : Essentials ~$2.83 / 1k  (no session token)
  //
  // No session token intentionally — per-request pricing is cheaper when
  // coordinates are resolved via Geocoding API (step 2) instead of the
  // expensive Place Details endpoint ($17 / 1k).
  // ─────────────────────────────────────────────────────────────────────────

  async autocomplete(query: string, countryCode?: string): Promise<PlaceSuggestion[] | null> {
    if (!this.apiKey || !query) return null;

    try {
      const body: Record<string, unknown> = { input: query, languageCode: 'en' };
      if (countryCode) body.includedRegionCodes = [countryCode.toUpperCase()];

      const { data } = await this.placesClient.post(':autocomplete', body, {
        headers: {
          // ⚑ FIELD MASK — Essentials only; do not add further fields
          'X-Goog-FieldMask': 'suggestions.placePrediction.text,suggestions.placePrediction.placeId',
        },
      });

      const suggestions: any[] = data.suggestions ?? [];
      return suggestions
        .filter((s) => s.placePrediction)
        .map((s) => {
          const pred     = s.placePrediction;
          const fullText = pred.text?.text ?? '';
          const idx      = fullText.indexOf(',');
          return {
            placeId:       pred.placeId,
            mainText:      idx > -1 ? fullText.slice(0, idx).trim() : fullText,
            secondaryText: idx > -1 ? fullText.slice(idx + 1).trim() : '',
            fullText,
          };
        });
    } catch (err: any) {
      console.error('[GoogleMapService.autocomplete] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Geocoding API  (placeId → lat/lng + address)
  //
  // GET https://maps.googleapis.com/maps/api/geocode/json?place_id=…
  // Tier : Essentials $5.00 / 1k
  //
  // Replaces the much more expensive Place Details API ($17 / 1k).
  // ─────────────────────────────────────────────────────────────────────────

  async geocodePlaceId(placeId: string): Promise<LocationDetails | null> {
    if (!this.apiKey || !placeId) return null;

    try {
      const { data } = await this.geocodeClient.get('/json', { params: { place_id: placeId } });
      if (data.status !== 'OK' || !data.results?.length) {
        console.warn('[GoogleMapService.geocodePlaceId] status:', data.status);
        return null;
      }
      return this.parseGeocodeResult(data.results[0]);
    } catch (err: any) {
      console.error('[GoogleMapService.geocodePlaceId] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reverse geocode  (latlng → address)
  // Tier: Essentials $5.00 / 1k
  // ─────────────────────────────────────────────────────────────────────────

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
    if (!this.apiKey) return null;

    try {
      const { data } = await this.geocodeClient.get('/json', {
        params: { latlng: `${latitude},${longitude}` },
      });
      if (data.status !== 'OK' || !data.results?.length) return null;
      return this.parseGeocodeResult(data.results[0]);
    } catch (err: any) {
      console.error('[GoogleMapService.reverseGeocode] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forward geocode  (address string → lat/lng)
  // Tier: Essentials $5.00 / 1k
  // ─────────────────────────────────────────────────────────────────────────

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; placeId: string } | null> {
    if (!this.apiKey || !address) return null;

    try {
      const { data } = await this.geocodeClient.get('/json', { params: { address } });
      if (data.status !== 'OK' || !data.results?.length) return null;

      const r = data.results[0];
      return {
        latitude:  r.geometry.location.lat,
        longitude: r.geometry.location.lng,
        placeId:   r.place_id,
      };
    } catch (err: any) {
      console.error('[GoogleMapService.geocodeAddress] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Routes API  (coordinates → distance / ETA / polyline)
  //
  // POST https://routes.googleapis.com/directions/v2:computeRoutes
  // Tier : Essentials $5.00 / 1k
  //
  // ⚑ STRICT FIELD MASK — these three fields ONLY.
  //   Adding ANY of the following silently promotes the SKU to Pro ($10 / 1k):
  //     routes.travelAdvisory
  //     routes.legs.travelAdvisory
  //     routes.optimizedIntermediateWaypointIndex
  //     routes.localizedValues
  //     routes.routeToken
  //     any traffic-aware polyline field
  // ─────────────────────────────────────────────────────────────────────────

  async computeRoute(
    origin:      { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<RouteResult | null> {
    if (!this.apiKey) return null;

    try {
      const { data } = await this.routesClient.post(':computeRoutes', {
        origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lng      } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode:               'DRIVE',
        routingPreference:        'TRAFFIC_UNAWARE', // TRAFFIC_AWARE → Pro tier
        computeAlternativeRoutes: false,
        languageCode:             'en-US',
        units:                    'METRIC',
      }, {
        headers: {
          // ⚑ Essentials — do NOT extend this mask without checking SKU impact
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
      });

      const route = data.routes?.[0];
      if (!route) return null;

      const distanceMeters = route.distanceMeters ?? 0;
      const durationSec    = parseInt(String(route.duration ?? '0s').replace('s', ''), 10);
      const km             = distanceMeters / 1000;
      const min            = durationSec / 60;

      return {
        distanceMeters,
        distanceText: km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(distanceMeters)} m`,
        durationSec,
        durationText: min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
        geometry:     decodePolyline(route.polyline?.encodedPolyline ?? ''),
      };
    } catch (err: any) {
      console.error('[GoogleMapService.computeRoute] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Convenience wrappers — both delegate to computeRoute to avoid double billing
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
  // Haversine fallback — pure math, zero cost, never fails
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
 * Decode a Google encoded polyline into [[lng, lat], ...] (GeoJSON order).
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): [number, number][] {
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

export const googleMapService = new GoogleMapService();
export default GoogleMapService;