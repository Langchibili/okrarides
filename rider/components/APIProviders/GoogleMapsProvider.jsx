// PATH: Okra/Okrarides/rider/components/Map/APIProviders/GoogleMapsProvider.jsx
//
// Cost-optimized Google Maps — all Essentials tier:
//   searchPlaces    → Autocomplete (New)  ~$2.83 / 1k
//   getPlaceDetails → Geocoding API        $5.00 / 1k
//   reverseGeocode  → Geocoding API        $5.00 / 1k
//   getRoute        → Routes API           $5.00 / 1k

export class GoogleMapsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name   = 'google';

    // Default centre: Lusaka, Zambia.
    // Updated by setViewport() when the active map display reports its bounds.
    this._center               = { lat: -15.4167, lng: 28.2833 };
    this._viewportRadius       = 50_000; // metres; tightened by setViewport()
    this._regionCode           = null;   // e.g. 'zm' — set via setRegion()
  }

  // ── Called by MapsProvider.searchPlaces to keep autocomplete biased ────────
  // lat/lng   : current map viewport centre
  // radiusM   : half-diagonal of visible area in metres (compute from bounds)
  // regionCode: ISO 3166-1 alpha-2 code ('ZM', 'US' …)
  setViewport(lat, lng, radiusM = 50_000, regionCode = null) {
    this._center         = { lat, lng };
    this._viewportRadius = Math.min(Math.max(radiusM, 1000), 50_000);
    if (regionCode) this._regionCode = regionCode.toLowerCase();
  }

  setCenter(lat, lng) { this.setViewport(lat, lng, this._viewportRadius, this._regionCode); }
  setRegion(code)     { this._regionCode = code ? code.toLowerCase() : null; }

  // ─────────────────────────────────────────────────────────────────────────
  // DISPATCH LAYER
  // ─────────────────────────────────────────────────────────────────────────

  _dispatchSearch(apiMethod, query, countryCode) {
    switch (apiMethod) {
      case 'placesApi':
      default:
        return this._autoCompleteNew(query, countryCode);
    }
  }

  _dispatchLocation(apiMethod, ...args) {
    switch (apiMethod) {
      case 'geocoding':
      default:
        return typeof args[0] === 'string'
          ? this._placeIdToLatLng(args[0])
          : this._reverseGeocode(args[0], args[1]);
    }
  }

  _dispatchRoute(apiMethod, origin, destination) {
    switch (apiMethod) {
      case 'routeApi':
      default:
        return this._routesApi(origin, destination);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC SERVICE METHODS
  // ─────────────────────────────────────────────────────────────────────────

  async searchPlaces(query, countryCode = null, apiMethod = 'placesApi') {
    if (!this.apiKey || !query) return null;
    return this._dispatchSearch(apiMethod, query, countryCode);
  }

  async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoding') {
    if (extraData?.lat != null && extraData?.lng != null) {
      return {
        lat: extraData.lat, lng: extraData.lng,
        address:  extraData.address  || extraData.main_text || '',
        name:     extraData.name     || extraData.main_text || '',
        place_id: placeId,
      };
    }
    if (!this.apiKey || !placeId) return null;
    return this._dispatchLocation(apiMethod, placeId, extraData);
  }

  async reverseGeocode(lat, lng, apiMethod = 'geocoding') {
    if (!this.apiKey) return null;
    return this._dispatchLocation(apiMethod, lat, lng);
  }

  async getRoute(origin, destination, apiMethod = 'routeApi') {
    if (!this.apiKey || !origin || !destination) return null;
    return this._dispatchRoute(apiMethod, origin, destination);
  }

  async calculateDistance(origin, destination, apiMethod = 'routeApi') {
    const r = await this.getRoute(origin, destination, apiMethod);
    return r ? { distance: r.distance, distanceValue: r.distanceValue } : null;
  }

  async calculateEta(origin, destination, apiMethod = 'routeApi') {
    const r = await this.getRoute(origin, destination, apiMethod);
    return r ? { duration: r.duration, durationValue: r.durationValue } : null;
  }

  async geocodeAddress(address, _apiMethod = 'geocoding') {
    if (!this.apiKey || !address) return null;
    return this._forwardGeocode(address);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Autocomplete (New)
  //
  // POST https://places.googleapis.com/v1/places:autocomplete
  // Tier : Essentials ~$2.83 / 1k  (per-request, no session token)
  //
  // locationBias.circle uses "radius" (float, metres) NOT "radiusMeters".
  // The API docs and error messages confirm this field name.
  //
  // Key parameters:
  //   locationBias   — biases results toward the current map viewport
  //   origin         — same centre, enables distanceMeters per suggestion
  //   regionCode     — primary regional preference bias (ccTLD, lowercase)
  //   includedRegionCodes — hard country restriction (only when caller passes countryCode)
  //
  // Field mask (Essentials — do NOT extend without checking tier impact):
  //   placeId          — required for geocoding step
  //   text             — full address string fallback
  //   structuredFormat — clean main/secondary split from the API
  // ─────────────────────────────────────────────────────────────────────────

  async _autoCompleteNew(query, countryCode) {
    try {
      const { lat, lng } = this._center;

      const body = {
        input:        query,
        languageCode: 'en',

        // ── Viewport bias ────────────────────────────────────────────────
        // Per docs: "use the viewport of the map the user is looking at".
        // "radius" is a float in metres — NOT "radiusMeters".
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: this._viewportRadius,   // ← correct field name
          },
        },

        // ── Origin for distanceMeters ─────────────────────────────────────
        origin: { latitude: lat, longitude: lng },
      };

      // regionCode: primary regional bias — lowercase ccTLD per API spec
      const effectiveRegion = this._regionCode ||
        (countryCode ? countryCode.toLowerCase() : null);
      if (effectiveRegion) body.regionCode = effectiveRegion;

      // includedRegionCodes: hard country filter — only when explicitly requested
      if (countryCode) body.includedRegionCodes = [countryCode.toUpperCase()];

      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'X-Goog-Api-Key':  this.apiKey,
          // ⚑ FIELD MASK — Essentials. Do NOT add fields without checking tier.
          'X-Goog-FieldMask': [
            'suggestions.placePrediction.placeId',
            'suggestions.placePrediction.text',
            'suggestions.placePrediction.structuredFormat',
          ].join(','),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[GoogleMapsProvider._autoCompleteNew] API error:', res.status, err?.error?.message);
        return null;
      }

      const data        = await res.json();
      const suggestions = data.suggestions ?? [];
      if (!suggestions.length) return null;

      return suggestions
        .filter((s) => s.placePrediction)
        .map((s) => {
          const pred = s.placePrediction;
          const main_text =
            pred.structuredFormat?.mainText?.text ||
            pred.text?.text?.split(',')[0]?.trim() || '';
          const secondary_text =
            pred.structuredFormat?.secondaryText?.text ||
            pred.text?.text?.split(',').slice(1).join(',').trim() || '';
          return {
            place_id:       pred.placeId,
            main_text,
            secondary_text,
            address:        pred.text?.text || `${main_text}, ${secondary_text}`,
            name:           main_text,
            distanceMeters: pred.distanceMeters ?? null,
          };
        })
        // Sort by distance when available — mirrors Google Maps ranking
        .sort((a, b) => {
          if (a.distanceMeters == null && b.distanceMeters == null) return 0;
          if (a.distanceMeters == null) return 1;
          if (b.distanceMeters == null) return -1;
          return a.distanceMeters - b.distanceMeters;
        });

    } catch (err) {
      console.error('[GoogleMapsProvider._autoCompleteNew] error:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Geocoding API — place ID → lat/lng
  //
  // GET https://maps.googleapis.com/maps/api/geocode/json?place_id=…
  // Tier : Essentials $5.00 / 1k  (replaces Place Details $17 / 1k)
  // ─────────────────────────────────────────────────────────────────────────

  async _placeIdToLatLng(placeId) {
    try {
      const params = new URLSearchParams({ place_id: placeId, key: this.apiKey, language: 'en' });
      const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) {
        console.warn('[GoogleMapsProvider._placeIdToLatLng] status:', data.status);
        return null;
      }
      const r = data.results[0];
      return {
        lat:      r.geometry.location.lat,
        lng:      r.geometry.location.lng,
        address:  r.formatted_address,
        name:     r.address_components?.[0]?.long_name || r.formatted_address?.split(',')[0] || '',
        place_id: r.place_id || placeId,
      };
    } catch (err) {
      console.error('[GoogleMapsProvider._placeIdToLatLng] error:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Geocoding API — latlng → address
  // Tier : Essentials $5.00 / 1k
  // ─────────────────────────────────────────────────────────────────────────

  async _reverseGeocode(lat, lng) {
    try {
      const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: this.apiKey, language: 'en' });
      const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) return null;

      const result  = data.results[0];
      const getComp = (types) =>
        result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null;

      return {
        lat, lng,
        address:       result.formatted_address,
        name:          getComp(['locality', 'sublocality', 'neighborhood']) || getComp(['administrative_area_level_2']) || 'Unknown',
        place_id:      result.place_id,
        city:          getComp(['locality', 'administrative_area_level_2']),
        country:       getComp(['country']),
        postalCode:    getComp(['postal_code']),
        state:         getComp(['administrative_area_level_1']),
        streetAddress: getComp(['route']),
        streetNumber:  getComp(['street_number']),
      };
    } catch (err) {
      console.error('[GoogleMapsProvider._reverseGeocode] error:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Geocoding API — address string → lat/lng
  // Tier : Essentials $5.00 / 1k
  // ─────────────────────────────────────────────────────────────────────────

  async _forwardGeocode(address) {
    try {
      const params = new URLSearchParams({
        address,
        key:      this.apiKey,
        language: 'en',
        ...(this._regionCode ? { region: this._regionCode } : {}),
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) return null;

      const r = data.results[0];
      return {
        lat:      r.geometry.location.lat,
        lng:      r.geometry.location.lng,
        address:  r.formatted_address,
        place_id: r.place_id,
      };
    } catch (err) {
      console.error('[GoogleMapsProvider._forwardGeocode] error:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Routes API — coordinates → distance / ETA / polyline
  //
  // POST https://routes.googleapis.com/directions/v2:computeRoutes
  // Tier : Essentials $5.00 / 1k
  //
  // ⚑ STRICT FIELD MASK — do NOT add fields without checking tier impact.
  //   These promote to Pro ($10 / 1k):
  //     routes.travelAdvisory, routes.legs.travelAdvisory,
  //     routes.optimizedIntermediateWaypointIndex,
  //     routes.localizedValues, routes.routeToken,
  //     any traffic-aware polyline field.
  // ─────────────────────────────────────────────────────────────────────────

  async _routesApi(origin, destination) {
    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lng      } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode:               'DRIVE',
          routingPreference:        'TRAFFIC_UNAWARE',
          computeAlternativeRoutes: false,
          languageCode:             'en-US',
          units:                    'METRIC',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[GoogleMapsProvider._routesApi] error:', res.status, err?.error?.message);
        return null;
      }

      const data  = await res.json();
      const route = data.routes?.[0];
      if (!route) return null;

      const distanceMeters = route.distanceMeters ?? 0;
      const durationSec    = parseInt(String(route.duration ?? '0s').replace('s', ''), 10);
      const km             = distanceMeters / 1000;
      const min            = durationSec / 60;

      return {
        type:          'google',
        distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(distanceMeters)} m`,
        duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
        distanceValue: distanceMeters,
        durationValue: durationSec,
        geometry:      decodePolyline(route.polyline?.encodedPolyline || ''),
        steps:         [],
      };
    } catch (err) {
      console.error('[GoogleMapsProvider._routesApi] error:', err?.message);
      return null;
    }
  }
}

export default GoogleMapsProvider;

// ─────────────────────────────────────────────────────────────────────────────
// Decode Google encoded polyline → [[lng, lat], ...] GeoJSON order
// ─────────────────────────────────────────────────────────────────────────────
function decodePolyline(encoded) {
  if (!encoded) return [];
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}