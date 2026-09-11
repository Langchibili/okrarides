// // PATH: Okra/Okrarides/delivery/components/Map/APIProviders/GoogleMapsProvider.jsx
// //
// // Wraps Google Maps Geocoder HTTP API and Places API.
// // Called by MapsProvider when Google is the active provider.
// // Does NOT load the Google Maps JavaScript API here — that is only loaded
// // inside the MapIframe when a Google JS API key is present.

// export class GoogleMapsProvider {
//   constructor(apiKey) {
//     this.apiKey = apiKey;
//     this.name = 'googlemaps';
//   }

//   // ── Place autocomplete (Places API) ────────────────────────────────────────
//   async searchPlaces(query, countryCode = null) {
//     if (!this.apiKey) return null;
//     try {
//       const params = new URLSearchParams({
//         input: query,
//         key: this.apiKey,
//         language: 'en',
//       });
//       if (countryCode) params.set('components', `country:${countryCode}`);

//       const res = await fetch(
//         `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
//       );
//       if (!res.ok) return null;
//       const data = await res.json();

//       if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return null;

//       return (data.predictions || []).map((p) => ({
//         place_id: p.place_id,
//         main_text: p.structured_formatting?.main_text || p.description,
//         secondary_text: p.structured_formatting?.secondary_text || '',
//         address: p.description,
//         name: p.structured_formatting?.main_text || p.description,
//       }));
//     } catch (err) {
//       console.error('[GoogleMapsProvider] searchPlaces error:', err);
//       return null;
//     }
//   }

//   // ── Place details ──────────────────────────────────────────────────────────
//   async getPlaceDetails(placeId) {
//     if (!this.apiKey) return null;
//     try {
//       const res = await fetch(
//         `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${this.apiKey}`
//       );
//       if (!res.ok) return null;
//       const data = await res.json();
//       if (data.status !== 'OK') return null;

//       const p = data.result;
//       return {
//         lat: p.geometry.location.lat,
//         lng: p.geometry.location.lng,
//         address: p.formatted_address,
//         name: p.name,
//         place_id: placeId,
//       };
//     } catch (err) {
//       console.error('[GoogleMapsProvider] getPlaceDetails error:', err);
//       return null;
//     }
//   }

//   // ── Geocoder HTTP API ──────────────────────────────────────────────────────
//   async reverseGeocode(lat, lng) {
//     if (!this.apiKey) return null;
//     try {
//       const res = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&language=en`
//       );
//       if (!res.ok) return null;
//       const data = await res.json();
//       if (data.status !== 'OK' || !data.results?.length) return null;

//       const result = data.results[0];
//       const getComp = (types) =>
//         result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name || null;

//       return {
//         lat,
//         lng,
//         address: result.formatted_address,
//         name: getComp(['locality', 'sublocality', 'neighborhood']) || getComp(['administrative_area_level_2']) || 'Unknown',
//         place_id: result.place_id,
//         city: getComp(['locality', 'administrative_area_level_2']),
//         country: getComp(['country']),
//         postalCode: getComp(['postal_code']),
//         state: getComp(['administrative_area_level_1']),
//         streetAddress: getComp(['route']),
//         streetNumber: getComp(['street_number']),
//       };
//     } catch (err) {
//       console.error('[GoogleMapsProvider] reverseGeocode error:', err);
//       return null;
//     }
//   }

//   async geocodeAddress(address) {
//     if (!this.apiKey) return null;
//     try {
//       const res = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}&language=en`
//       );
//       if (!res.ok) return null;
//       const data = await res.json();
//       if (data.status !== 'OK' || !data.results?.length) return null;

//       const r = data.results[0];
//       return {
//         lat: r.geometry.location.lat,
//         lng: r.geometry.location.lng,
//         address: r.formatted_address,
//         place_id: r.place_id,
//       };
//     } catch (err) {
//       console.error('[GoogleMapsProvider] geocodeAddress error:', err);
//       return null;
//     }
//   }
// }

// export default GoogleMapsProvider;
// PATH: Okra/Okrarides/delivery/components/Map/APIProviders/GoogleMapsProvider.jsx
//
// Updated from original delivery version:
//  - searchPlaces: switched to Autocomplete (New) with correct field names
//    (radius not radiusMeters, structuredFormat for clean text split)
//  - getPlaceDetails: switched from Place Details ($17/1k) to Geocoding ($5/1k)
//  - getRoute/calculateDistance/calculateEta: added via Routes API ($5/1k)
//  - All methods accept optional apiMethod for MapsProvider dispatch pattern
//  - setViewport() for geographic autocomplete bias

export class GoogleMapsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name   = 'google';
    this._center         = { lat: -15.4167, lng: 28.2833 };
    this._viewportRadius = 50_000;
    this._regionCode     = null;
  }

  setViewport(lat, lng, radiusM = 50_000, regionCode = null) {
    this._center         = { lat, lng };
    this._viewportRadius = Math.min(Math.max(radiusM, 1000), 50_000);
    if (regionCode) this._regionCode = regionCode.toLowerCase();
  }

  setCenter(lat, lng) { this.setViewport(lat, lng, this._viewportRadius, this._regionCode); }
  setRegion(code)     { this._regionCode = code ? code.toLowerCase() : null; }

  // ── Dispatch ──────────────────────────────────────────────────────────────

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

  // ── Public service methods ────────────────────────────────────────────────

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

  // ── Autocomplete (New) ────────────────────────────────────────────────────
  // POST https://places.googleapis.com/v1/places:autocomplete
  // Tier: Essentials ~$2.83/1k | "radius" not "radiusMeters"

  async _autoCompleteNew(query, countryCode) {
    try {
      const { lat, lng } = this._center;
      const body = {
        input:        query,
        languageCode: 'en',
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: this._viewportRadius, // ← "radius" not "radiusMeters"
          },
        },
        origin: { latitude: lat, longitude: lng },
      };

      const effectiveRegion = this._regionCode || (countryCode ? countryCode.toLowerCase() : null);
      if (effectiveRegion) body.regionCode = effectiveRegion;
      if (countryCode) body.includedRegionCodes = [countryCode.toUpperCase()];

      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'X-Goog-Api-Key':  this.apiKey,
          // ⚑ FIELD MASK — Essentials. Do NOT extend without checking tier.
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

  // ── Geocoding — place ID → lat/lng ────────────────────────────────────────
  // Tier: Essentials $5/1k (replaces Place Details $17/1k)

  async _placeIdToLatLng(placeId) {
    try {
      const params = new URLSearchParams({ place_id: placeId, key: this.apiKey, language: 'en' });
      const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) return null;
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

  // ── Geocoding — latlng → address ──────────────────────────────────────────
  // Tier: Essentials $5/1k

  async _reverseGeocode(lat, lng) {
    try {
      const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: this.apiKey, language: 'en' });
      const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) return null;
      const result  = data.results[0];
      const getComp = (types) =>
        result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name || null;
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

  // ── Geocoding — address string → lat/lng ──────────────────────────────────

  async _forwardGeocode(address) {
    try {
      const params = new URLSearchParams({
        address, key: this.apiKey, language: 'en',
        ...(this._regionCode ? { region: this._regionCode } : {}),
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) return null;
      const r = data.results[0];
      return {
        lat: r.geometry.location.lat, lng: r.geometry.location.lng,
        address: r.formatted_address, place_id: r.place_id,
      };
    } catch (err) {
      console.error('[GoogleMapsProvider._forwardGeocode] error:', err?.message);
      return null;
    }
  }

  // ── Routes API — coordinates → distance / ETA / polyline ─────────────────
  // POST https://routes.googleapis.com/directions/v2:computeRoutes
  // Tier: Essentials $5/1k
  // ⚑ STRICT FIELD MASK — any addition can promote to Pro ($10/1k)

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

// Decode Google encoded polyline → [[lng, lat], ...] GeoJSON order
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