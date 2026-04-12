import axios, { AxiosInstance } from 'axios';

// ─── Types (mirrors googleMapService) ────────────────────────────────────────

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
// GeoapifyMapService
// ─────────────────────────────────────────────────────────────────────────────

class GeoapifyMapService {
  private readonly apiKey:    string;
  private readonly client:    AxiosInstance; // geocode + autocomplete
  private readonly routeClient: AxiosInstance;

  constructor() {
    this.apiKey = process.env.GEOAPIFY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[GeoapifyMapService] GEOAPIFY_API_KEY is not set');
    }

    this.client = axios.create({
      baseURL: 'https://api.geoapify.com/v1/geocode',
      timeout: 8_000,
    });

    this.routeClient = axios.create({
      baseURL: 'https://api.geoapify.com/v1/routing',
      timeout: 10_000,
    });
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  /**
   * Geoapify returns GeoJSON (FeatureCollection) by default.
   * When format=json is passed it returns { results: [] }.
   * This normalises both shapes into a flat array of property objects
   * with lat / lon hoisted to the root level.
   */
  private normalizeResults(data: any): any[] {
    if (data && Array.isArray(data.features)) {
      return data.features.map((f: any) => {
        const props = f.properties || {};
        const lat   = props.lat ?? f.geometry?.coordinates?.[1] ?? null;
        const lon   = props.lon ?? f.geometry?.coordinates?.[0] ?? null;
        return { ...props, lat, lon };
      });
    }
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  }

  private toLocationDetails(r: any, lat: number, lng: number): LocationDetails {
    const mainText = r.address_line1 || r.name || (r.formatted || '').split(',')[0] || '';
    return {
      lat,
      lng,
      address:       r.formatted     || mainText,
      placeId:       `geoapify_${lat}_${lng}`,
      name:          r.name          || r.city || mainText,
      city:          r.city          ?? null,
      country:       r.country       ?? null,
      postalCode:    r.postcode      ?? null,
      state:         r.state         ?? null,
      streetAddress: r.street        ?? null,
      streetNumber:  r.housenumber   ?? null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Autocomplete  (mirrors googleMapService.autocomplete)
  //
  // GET https://api.geoapify.com/v1/geocode/autocomplete
  // ─────────────────────────────────────────────────────────────────────────

  async autocomplete(query: string, countryCode?: string): Promise<PlaceSuggestion[] | null> {
    if (!this.apiKey || !query || query.length < 2) return null;

    try {
      const params: Record<string, string> = {
        text:   query,
        limit:  '7',
        lang:   'en',
        apiKey: this.apiKey,
      };
      if (countryCode) {
        params.filter = `countrycode:${countryCode.toLowerCase()}`;
      }

      const { data } = await this.client.get('/autocomplete', { params });
      const items = this.normalizeResults(data);

      return items.map((r, i) => {
        const mainText    = r.address_line1 || r.name || (r.formatted || '').split(',')[0] || '';
        const secondaryText = r.address_line2 || r.formatted || '';
        return {
          // Embed coords in placeId so getPlaceDetails can skip a geocoder call
          placeId:       `geoapify_${i}_${r.lat}_${r.lon}`,
          mainText,
          secondaryText,
          fullText:      r.formatted || `${mainText}${secondaryText ? ', ' + secondaryText : ''}`,
        };
      });
    } catch (err: any) {
      console.error('[GeoapifyMapService.autocomplete] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reverse geocode  (lat/lng → address)
  //
  // GET https://api.geoapify.com/v1/geocode/reverse
  // ─────────────────────────────────────────────────────────────────────────

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
    if (!this.apiKey) return null;

    try {
      const { data } = await this.client.get('/reverse', {
        params: { lat: latitude, lon: longitude, format: 'json', lang: 'en', apiKey: this.apiKey },
      });

      const items = this.normalizeResults(data);
      if (!items.length) return null;
      return this.toLocationDetails(items[0], latitude, longitude);
    } catch (err: any) {
      console.error('[GeoapifyMapService.reverseGeocode] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forward geocode  (address → lat/lng)
  //
  // GET https://api.geoapify.com/v1/geocode/search
  // ─────────────────────────────────────────────────────────────────────────

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; placeId: string } | null> {
    if (!this.apiKey || !address) return null;

    try {
      const { data } = await this.client.get('/search', {
        params: { text: address, format: 'json', limit: '1', lang: 'en', apiKey: this.apiKey },
      });

      const items = this.normalizeResults(data);
      if (!items.length || items[0].lat == null) return null;

      const r = items[0];
      return {
        latitude:  r.lat,
        longitude: r.lon,
        placeId:   `geoapify_fwd_${r.lat}_${r.lon}`,
      };
    } catch (err: any) {
      console.error('[GeoapifyMapService.geocodeAddress] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Compute route  (origin → destination)
  //
  // GET https://api.geoapify.com/v1/routing
  // Mode: drive  |  Units: metric
  //
  // Response shape:
  //   { features: [{ properties: { distance, time }, geometry: { coordinates } }] }
  // ─────────────────────────────────────────────────────────────────────────

  async computeRoute(
    origin:      { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<RouteResult | null> {
    if (!this.apiKey) return null;

    try {
      const waypoints = `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`;

      const { data } = await this.routeClient.get('', {
        params: {
          waypoints,
          mode:   'drive',
          apiKey: this.apiKey,
        },
      });

      const feature = data?.features?.[0];
      if (!feature) return null;

      const props          = feature.properties || {};
      const distanceMeters = Math.round((props.distance ?? 0) as number);
      const durationSec    = Math.round((props.time     ?? 0) as number);
      const km             = distanceMeters / 1000;
      const min            = durationSec    / 60;

      // Geoapify routing returns a LineString geometry with [lon, lat] coordinate pairs
      const rawCoords: [number, number][] =
        feature.geometry?.coordinates ?? [];

      // Handle both LineString ([lon,lat][]) and MultiLineString ([lon,lat][][])
      let geometry: [number, number][] = [];
      if (rawCoords.length > 0 && Array.isArray(rawCoords[0][0])) {
        // MultiLineString — flatten
        geometry = (rawCoords as unknown as [number, number][][]).flat();
      } else {
        geometry = rawCoords as [number, number][];
      }

      return {
        distanceMeters,
        distanceText: km  >= 1 ? `${km.toFixed(1)} km`             : `${distanceMeters} m`,
        durationSec,
        durationText: min >= 60
          ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min`
          : `${Math.round(min)} min`,
        geometry,
      };
    } catch (err: any) {
      console.error('[GeoapifyMapService.computeRoute] error:', err?.response?.data ?? err?.message);
      return null;
    }
  }

  // ── Convenience wrappers ──────────────────────────────────────────────────

  async calculateDistance(
    origin:      { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<{ distanceMeters: number; distanceText: string } | null> {
    const route = await this.computeRoute(origin, destination);
    if (!route) return null;
    return { distanceMeters: route.distanceMeters, distanceText: route.distanceText };
  }

  async calculateEta(
    origin:      { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<{ durationSec: number; durationText: string } | null> {
    const route = await this.computeRoute(origin, destination);
    if (!route) return null;
    return { durationSec: route.durationSec, durationText: route.durationText };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const geoapifyMapService = new GeoapifyMapService();
export default GeoapifyMapService;