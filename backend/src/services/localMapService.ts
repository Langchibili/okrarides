// // PATH: Okra/Okrarides/backend/src/services/localMapService.ts
// import axios from 'axios';

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

// class LocalMapService {
//   private baseUrl: string;

//   constructor() {
//     this.baseUrl = process.env.LOCALLY_HOSTED_MAP_SERVER_URL || 'http://localhost';
//     if (!process.env.LOCALLY_HOSTED_MAP_SERVER_URL) {
//       console.warn('LOCALLY_HOSTED_MAP_SERVER_URL is not set — defaulting to http://localhost');
//     }
//   }

//   /**
//    * Reverse geocode using local Nominatim server.
//    * Returns the same LocationDetails shape as Google/Yandex services.
//    */
//   async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
//     try {
//       const response = await axios.get(`${this.baseUrl}/api/reverse`, {
//         params: { lat: latitude, lon: longitude },
//         timeout: 8000,
//       });

//       const data = response.data;
//       if (!data || data.error) return null;

//       // Local server returns schema matching the target schema exactly
//       return {
//         name: data.name || data.city || 'Unknown',
//         address: data.address || data.streetAddress || '',
//         placeId: data.placeId || `local_${latitude}_${longitude}`,
//         city: data.city || null,
//         country: data.country || null,
//         postalCode: data.postalCode || null,
//         state: data.state || null,
//         streetAddress: data.streetAddress || null,
//         streetNumber: data.streetNumber || null,
//       };
//     } catch (error) {
//       console.error('Local map service reverse geocoding error:', error);
//       return null;
//     }
//   }

//   /**
//    * Forward geocode an address using local Nominatim.
//    */
//   async geocodeAddress(address: string): Promise<{
//     latitude: number;
//     longitude: number;
//     placeId: string;
//   } | null> {
//     try {
//       const response = await axios.get(`${this.baseUrl}/api/geocode`, {
//         params: { q: address, limit: 1 },
//         timeout: 8000,
//       });

//       const results = response.data;
//       if (!results || !Array.isArray(results) || results.length === 0) return null;

//       const first = results[0];
//       return {
//         latitude: parseFloat(first.lat),
//         longitude: parseFloat(first.lon),
//         placeId: first.place_id || `local_${first.lat}_${first.lon}`,
//       };
//     } catch (error) {
//       console.error('Local map service geocoding error:', error);
//       return null;
//     }
//   }

//   /**
//    * Get route between two points using local OSRM.
//    */
//   async getRoute(
//     originLat: number,
//     originLng: number,
//     destLat: number,
//     destLng: number
//   ): Promise<{
//     distance: string;
//     duration: string;
//     distanceValue: number;
//     durationValue: number;
//   } | null> {
//     try {
//       const response = await axios.get(`${this.baseUrl}/api/route`, {
//         params: {
//           origin: `${originLat},${originLng}`,
//           destination: `${destLat},${destLng}`,
//         },
//         timeout: 10000,
//       });

//       return response.data || null;
//     } catch (error) {
//       console.error('Local map service routing error:', error);
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
// }

// export const localMapService = new LocalMapService();
// export default LocalMapService;

// PATH: Okra/Okrarides/backend/src/services/localMapService.ts
//
// Local self-hosted map service.
//
// Wraps a locally-hosted server that exposes:
//   /api/reverse       — Nominatim reverse geocode
//   /api/geocode       — Nominatim forward geocode
//   /api/route         — OSRM route computation
//
// All methods return the same shapes as the Google/Yandex services so
// mapProviderService can use them interchangeably.

import axios, { AxiosInstance } from 'axios';
import type { RouteResult } from './googleMapService';

// ─── Types ────────────────────────────────────────────────────────────────────

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
// LocalMapService
// ─────────────────────────────────────────────────────────────────────────────

class LocalMapService {
  private readonly baseUrl: string;
  private readonly client:  AxiosInstance;

  constructor() {
    this.baseUrl = process.env.LOCALLY_HOSTED_MAP_SERVER_URL || 'http://localhost';
    if (!process.env.LOCALLY_HOSTED_MAP_SERVER_URL) {
      console.warn('[LocalMapService] LOCALLY_HOSTED_MAP_SERVER_URL not set — defaulting to http://localhost');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10_000,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reverse geocode  (latlng → address)
  // Backed by local Nominatim.
  // ─────────────────────────────────────────────────────────────────────────

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
    try {
      const { data } = await this.client.get('/api/reverse', {
        params: { lat: latitude, lon: longitude },
      });

      if (!data || data.error) return null;

      return {
        lat:          data.lat      ?? latitude,
        lng:          data.lon      ?? longitude,
        name:         data.name     || data.city       || 'Unknown',
        address:      data.address  || data.streetAddress || '',
        placeId:      data.placeId  || `local_${latitude}_${longitude}`,
        city:         data.city         ?? null,
        country:      data.country      ?? null,
        postalCode:   data.postalCode   ?? null,
        state:        data.state        ?? null,
        streetAddress:data.streetAddress ?? null,
        streetNumber: data.streetNumber  ?? null,
      };
    } catch (err: any) {
      console.error('[LocalMapService.reverseGeocode] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forward geocode  (address string → latlng)
  // Backed by local Nominatim.
  // ─────────────────────────────────────────────────────────────────────────

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; placeId: string } | null> {
    try {
      const { data } = await this.client.get('/api/geocode', {
        params: { q: address, limit: 1 },
      });

      const results: any[] = Array.isArray(data) ? data : [];
      if (!results.length) return null;

      const first = results[0];
      return {
        latitude:  parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        placeId:   first.place_id || `local_${first.lat}_${first.lon}`,
      };
    } catch (err: any) {
      console.error('[LocalMapService.geocodeAddress] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // computeRoute  (latlng pair → distance / ETA / polyline)
  //
  // Calls the local OSRM server via the custom /api/route endpoint.
  // Returns the shared RouteResult shape so mapProviderService can use it
  // without special-casing.
  //
  // Expected local server response shape:
  // {
  //   distance:      "3.2 km",        // formatted string
  //   duration:      "8 min",         // formatted string
  //   distanceValue: 3200,            // metres
  //   durationValue: 480,             // seconds
  //   geometry:      [[lng,lat], ...] // GeoJSON order
  //   steps:         []               // optional turn-by-turn
  // }
  // ─────────────────────────────────────────────────────────────────────────

  async computeRoute(
    origin:      { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<RouteResult | null> {
    try {
      const { data } = await this.client.get('/api/route', {
        params: {
          origin:      `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
        },
      });

      if (!data) return null;

      const distanceMeters = Number(data.distanceValue ?? 0);
      const durationSec    = Number(data.durationValue ?? 0);
      const km             = distanceMeters / 1000;
      const min            = durationSec / 60;

      return {
        distanceMeters,
        // Prefer the server-formatted strings; fall back to our own formatting
        distanceText: data.distance || (km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(distanceMeters)} m`),
        durationSec,
        durationText: data.duration || (min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`),
        geometry:     Array.isArray(data.geometry) ? data.geometry : [],
      };
    } catch (err: any) {
      console.error('[LocalMapService.computeRoute] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Convenience wrappers
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
  // Used by mapProviderService as a last resort when all routing APIs fail.
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
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const localMapService = new LocalMapService();
export default LocalMapService;