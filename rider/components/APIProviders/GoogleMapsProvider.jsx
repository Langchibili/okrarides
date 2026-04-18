
// export class GoogleMapsProvider {
//   constructor(apiKey) {
//     this.apiKey = apiKey;
//     this.name   = 'google';

//     this._center         = { lat: -15.4167, lng: 28.2833 };
//     this._viewportRadius = 20_000;
//     this._regionCode     = 'zm';

//     // DEBUG: Confirms an instance was actually created and whether the key is present
//     console.log(
//       '[GoogleMapsProvider:DEBUG] constructor called' +
//       ` | apiKey present: ${!!apiKey}` +
//       ` | apiKey prefix: ${apiKey ? apiKey.slice(0, 8) + '...' : 'NONE'}`
//     );

//     if (!apiKey) {
//       console.error(
//         '[GoogleMapsProvider:DEBUG] ⚠️  NO API KEY — ' +
//         'check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in .env ' +
//         'and that the Next.js dev server was restarted after adding it.'
//       );
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // VIEWPORT / REGION HELPERS
//   // ─────────────────────────────────────────────────────────────────────────

//   setViewport(lat, lng, radiusM = 20_000, regionCode = null) {
//     this._center         = { lat, lng };
//     this._viewportRadius = Math.min(Math.max(radiusM, 1_000), 20_000);
//     if (regionCode) this._regionCode = regionCode.toLowerCase();
//     console.log(
//       `[GoogleMapsProvider:DEBUG] setViewport → lat:${lat} lng:${lng}` +
//       ` radius:${this._viewportRadius} region:${this._regionCode}`
//     );
//   }

//   setCenter(lat, lng) { this.setViewport(lat, lng, this._viewportRadius, this._regionCode); }
//   setRegion(code)     { this._regionCode = code ? code.toLowerCase() : 'zm'; }

//   // ─────────────────────────────────────────────────────────────────────────
//   // DISPATCH LAYER
//   // ─────────────────────────────────────────────────────────────────────────

//   _dispatchSearch(apiMethod, query, countryCode) {
//     console.log(`[GoogleMapsProvider:DEBUG] _dispatchSearch → apiMethod:"${apiMethod}" query:"${query}" countryCode:${countryCode}`);
//     switch (apiMethod) {
//       case 'placesApi':
//       default:
//         return this._autoCompleteNew(query, countryCode);
//     }
//   }

//   _dispatchLocation(apiMethod, ...args) {
//     const isReverse = typeof args[0] !== 'string';
//     console.log(`[GoogleMapsProvider:DEBUG] _dispatchLocation → apiMethod:"${apiMethod}" isReverse:${isReverse} arg0:${args[0]}`);
//     switch (apiMethod) {
//       case 'geocoding':
//       default:
//         return isReverse
//           ? this._reverseGeocode(args[0], args[1])
//           : this._placeIdToLatLng(args[0]);
//     }
//   }

//   _dispatchRoute(apiMethod, origin, destination) {
//     console.log(
//       `[GoogleMapsProvider:DEBUG] _dispatchRoute → apiMethod:"${apiMethod}"` +
//       ` origin:${JSON.stringify(origin)} dest:${JSON.stringify(destination)}`
//     );
//     switch (apiMethod) {
//       case 'routeApi':
//       default:
//         return this._routesApi(origin, destination);
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // PUBLIC SERVICE METHODS
//   // ─────────────────────────────────────────────────────────────────────────

//   async searchPlaces(query, countryCode = null, apiMethod = 'placesApi') {
//     console.log(`[GoogleMapsProvider:DEBUG] searchPlaces → query:"${query}" apiMethod:"${apiMethod}" hasKey:${!!this.apiKey}`);
//     if (!this.apiKey) {
//       console.error('[GoogleMapsProvider:DEBUG] searchPlaces BLOCKED — no API key');
//       return null;
//     }
//     if (!query?.trim()) {
//       console.warn('[GoogleMapsProvider:DEBUG] searchPlaces BLOCKED — empty query');
//       return null;
//     }
//     return this._dispatchSearch(apiMethod, query, countryCode);
//   }

//   async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoding') {
//     console.log(
//       `[GoogleMapsProvider:DEBUG] getPlaceDetails → placeId:"${placeId}"` +
//       ` hasExtraCoords:${extraData?.lat != null} apiMethod:"${apiMethod}"`
//     );
//     if (extraData?.lat != null && extraData?.lng != null) {
//       console.log('[GoogleMapsProvider:DEBUG] getPlaceDetails → fast-path, coords already present');
//       return {
//         lat:      extraData.lat,
//         lng:      extraData.lng,
//         address:  extraData.address  || extraData.main_text || '',
//         name:     extraData.name     || extraData.main_text || '',
//         place_id: placeId,
//       };
//     }
//     if (!this.apiKey) {
//       console.error('[GoogleMapsProvider:DEBUG] getPlaceDetails BLOCKED — no API key');
//       return null;
//     }
//     if (!placeId) {
//       console.warn('[GoogleMapsProvider:DEBUG] getPlaceDetails BLOCKED — no placeId');
//       return null;
//     }
//     return this._dispatchLocation(apiMethod, placeId, extraData);
//   }

//   async reverseGeocode(lat, lng, apiMethod = 'geocoding') {
//     console.log(`[GoogleMapsProvider:DEBUG] reverseGeocode → lat:${lat} lng:${lng} apiMethod:"${apiMethod}" hasKey:${!!this.apiKey}`);
//     if (!this.apiKey) {
//       console.error('[GoogleMapsProvider:DEBUG] reverseGeocode BLOCKED — no API key');
//       return null;
//     }
//     return this._dispatchLocation(apiMethod, lat, lng);
//   }

//   async getRoute(origin, destination, apiMethod = 'routeApi') {
//     console.log(
//       `[GoogleMapsProvider:DEBUG] getRoute → apiMethod:"${apiMethod}" hasKey:${!!this.apiKey}` +
//       ` origin:${JSON.stringify(origin)} dest:${JSON.stringify(destination)}`
//     );
//     if (!this.apiKey) {
//       console.error('[GoogleMapsProvider:DEBUG] getRoute BLOCKED — no API key');
//       return null;
//     }
//     if (!origin || !destination) {
//       console.warn('[GoogleMapsProvider:DEBUG] getRoute BLOCKED — missing origin or destination');
//       return null;
//     }
//     return this._dispatchRoute(apiMethod, origin, destination);
//   }

//   async calculateDistance(origin, destination, apiMethod = 'routeApi') {
//     console.log(`[GoogleMapsProvider:DEBUG] calculateDistance → apiMethod:"${apiMethod}"`);
//     const r = await this.getRoute(origin, destination, apiMethod);
//     if (!r) {
//       console.warn('[GoogleMapsProvider:DEBUG] calculateDistance → getRoute returned null');
//       return null;
//     }
//     return { distance: r.distance, distanceValue: r.distanceValue };
//   }

//   async calculateEta(origin, destination, apiMethod = 'routeApi') {
//     console.log(`[GoogleMapsProvider:DEBUG] calculateEta → apiMethod:"${apiMethod}"`);
//     const r = await this.getRoute(origin, destination, apiMethod);
//     if (!r) {
//       console.warn('[GoogleMapsProvider:DEBUG] calculateEta → getRoute returned null');
//       return null;
//     }
//     return { duration: r.duration, durationValue: r.durationValue };
//   }

//   async geocodeAddress(address, _apiMethod = 'geocoding') {
//     console.log(`[GoogleMapsProvider:DEBUG] geocodeAddress → address:"${address}" hasKey:${!!this.apiKey}`);
//     if (!this.apiKey || !address) return null;
//     return this._forwardGeocode(address);
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Autocomplete (New)
//   //
//   // POST https://places.googleapis.com/v1/places:autocomplete
//   // Tier : Essentials ~$2.83 / 1k
//   //
//   // ⚑ FIELD MASK — Essentials only. Do NOT add fields without checking tier.
//   // ─────────────────────────────────────────────────────────────────────────

//   async _autoCompleteNew(query, countryCode) {
//     const { lat, lng }    = this._center;
//     const effectiveRegion = this._regionCode || (countryCode ? countryCode.toLowerCase() : 'zm');
//     const country         = countryCode ? countryCode.toUpperCase() : 'ZM';

//     const body = {
//       input:                   query.trim(),
//       languageCode:            'en',
//       includeQueryPredictions: true,
//       locationBias: {
//         circle: {
//           center: { latitude: lat, longitude: lng },
//           radius: this._viewportRadius,
//         },
//       },
//       origin:              { latitude: lat, longitude: lng },
//       regionCode:          effectiveRegion,
//       includedRegionCodes: [country],
//     };

//     console.log(
//       '[GoogleMapsProvider:DEBUG] _autoCompleteNew → sending request' +
//       ` | center:(${lat},${lng}) radius:${this._viewportRadius}` +
//       ` | regionCode:${effectiveRegion} includedRegionCodes:${country}`
//     );

//     try {
//       const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
//         method: 'POST',
//         headers: {
//           'Content-Type':     'application/json',
//           'X-Goog-Api-Key':   this.apiKey,
//           'X-Goog-FieldMask': [
//             'suggestions.placePrediction.placeId',
//             'suggestions.placePrediction.text',
//             'suggestions.placePrediction.structuredFormat',
//             'suggestions.placePrediction.distanceMeters',
//           ].join(','),
//         },
//         body: JSON.stringify(body),
//       });

//       console.log(`[GoogleMapsProvider:DEBUG] _autoCompleteNew → HTTP ${res.status}`);

//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         console.error(
//           '[GoogleMapsProvider:DEBUG] _autoCompleteNew API error:',
//           res.status, err?.error?.message, err?.error?.status
//         );
//         return null;
//       }

//       const data        = await res.json();
//       const suggestions = data.suggestions ?? [];
//       console.log(`[GoogleMapsProvider:DEBUG] _autoCompleteNew → ${suggestions.length} suggestions received`);

//       if (!suggestions.length) return null;

//       const results = suggestions
//         .filter((s) => s.placePrediction)
//         .map((s) => {
//           const pred           = s.placePrediction;
//           const main_text      = pred.structuredFormat?.mainText?.text      || pred.text?.text?.split(',')[0]?.trim()            || '';
//           const secondary_text = pred.structuredFormat?.secondaryText?.text || pred.text?.text?.split(',').slice(1).join(',').trim() || '';
//           return {
//             place_id:       pred.placeId,
//             main_text,
//             secondary_text,
//             address:        pred.text?.text || `${main_text}, ${secondary_text}`,
//             name:           main_text,
//             distanceMeters: pred.distanceMeters ?? null,
//           };
//         })
//         .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));

//       console.log(
//         '[GoogleMapsProvider:DEBUG] _autoCompleteNew → ✅ returning',
//         results.length, 'results:', results.map((r) => r.main_text).join(' | ')
//       );
//       return results;

//     } catch (err) {
//       console.error('[GoogleMapsProvider:DEBUG] _autoCompleteNew exception:', err?.message, err);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Geocoding API — place ID → lat/lng
//   // Tier : Essentials $5.00 / 1k
//   // ─────────────────────────────────────────────────────────────────────────

//   async _placeIdToLatLng(placeId) {
//     console.log(`[GoogleMapsProvider:DEBUG] _placeIdToLatLng → placeId:"${placeId}"`);
//     try {
//       const params = new URLSearchParams({ place_id: placeId, key: this.apiKey, language: 'en' });
//       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

//       console.log(`[GoogleMapsProvider:DEBUG] _placeIdToLatLng → HTTP ${res.status}`);
//       if (!res.ok) return null;

//       const data = await res.json();
//       console.log(
//         `[GoogleMapsProvider:DEBUG] _placeIdToLatLng → API status:"${data.status}"` +
//         ` results:${data.results?.length ?? 0}`
//       );

//       if (data.status !== 'OK' || !data.results?.length) {
//         console.warn('[GoogleMapsProvider:DEBUG] _placeIdToLatLng → bad status:', data.status, data.error_message);
//         return null;
//       }

//       const r      = data.results[0];
//       const result = {
//         lat:      r.geometry.location.lat,
//         lng:      r.geometry.location.lng,
//         address:  r.formatted_address,
//         name:     r.address_components?.[0]?.long_name || r.formatted_address?.split(',')[0] || '',
//         place_id: r.place_id || placeId,
//       };
//       console.log('[GoogleMapsProvider:DEBUG] _placeIdToLatLng → ✅', JSON.stringify(result));
//       return result;
//     } catch (err) {
//       console.error('[GoogleMapsProvider:DEBUG] _placeIdToLatLng exception:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Geocoding API — latlng → address
//   // Tier : Essentials $5.00 / 1k
//   // ─────────────────────────────────────────────────────────────────────────

//   async _reverseGeocode(lat, lng) {
//     console.log(`[GoogleMapsProvider:DEBUG] _reverseGeocode → lat:${lat} lng:${lng}`);
//     try {
//       const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: this.apiKey, language: 'en' });
//       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

//       console.log(`[GoogleMapsProvider:DEBUG] _reverseGeocode → HTTP ${res.status}`);
//       if (!res.ok) return null;

//       const data = await res.json();
//       console.log(
//         `[GoogleMapsProvider:DEBUG] _reverseGeocode → API status:"${data.status}"` +
//         ` results:${data.results?.length ?? 0}`
//       );

//       if (data.status !== 'OK' || !data.results?.length) {
//         console.warn('[GoogleMapsProvider:DEBUG] _reverseGeocode → bad status:', data.status, data.error_message);
//         return null;
//       }

//       const result  = data.results[0];
//       const getComp = (types) =>
//         result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null;

//       const out = {
//         lat, lng,
//         address:       result.formatted_address,
//         name:          getComp(['locality', 'sublocality', 'neighborhood']) ||
//                        getComp(['administrative_area_level_2']) || 'Unknown',
//         place_id:      result.place_id,
//         city:          getComp(['locality', 'administrative_area_level_2']),
//         country:       getComp(['country']),
//         postalCode:    getComp(['postal_code']),
//         state:         getComp(['administrative_area_level_1']),
//         streetAddress: getComp(['route']),
//         streetNumber:  getComp(['street_number']),
//       };
//       console.log('[GoogleMapsProvider:DEBUG] _reverseGeocode → ✅', JSON.stringify(out));
//       return out;
//     } catch (err) {
//       console.error('[GoogleMapsProvider:DEBUG] _reverseGeocode exception:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Geocoding API — address string → lat/lng
//   // Tier : Essentials $5.00 / 1k
//   // ─────────────────────────────────────────────────────────────────────────

//   async _forwardGeocode(address) {
//     console.log(`[GoogleMapsProvider:DEBUG] _forwardGeocode → address:"${address}" region:${this._regionCode}`);
//     try {
//       const params = new URLSearchParams({
//         address,
//         key:      this.apiKey,
//         language: 'en',
//         ...(this._regionCode ? { region: this._regionCode } : {}),
//       });
//       const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

//       console.log(`[GoogleMapsProvider:DEBUG] _forwardGeocode → HTTP ${res.status}`);
//       if (!res.ok) return null;

//       const data = await res.json();
//       console.log(
//         `[GoogleMapsProvider:DEBUG] _forwardGeocode → API status:"${data.status}"` +
//         ` results:${data.results?.length ?? 0}`
//       );

//       if (data.status !== 'OK' || !data.results?.length) {
//         console.warn('[GoogleMapsProvider:DEBUG] _forwardGeocode → bad status:', data.status, data.error_message);
//         return null;
//       }

//       const r = data.results[0];
//       return { lat: r.geometry.location.lat, lng: r.geometry.location.lng, address: r.formatted_address, place_id: r.place_id };
//     } catch (err) {
//       console.error('[GoogleMapsProvider:DEBUG] _forwardGeocode exception:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Routes API — coordinates → distance / ETA / polyline
//   //
//   // POST https://routes.googleapis.com/directions/v2:computeRoutes
//   // Tier : Essentials $5.00 / 1k
//   //
//   // ⚑ STRICT FIELD MASK — do NOT add fields without checking tier impact.
//   //   These promote to Pro ($10 / 1k):
//   //     routes.travelAdvisory, routes.legs.travelAdvisory,
//   //     routes.optimizedIntermediateWaypointIndex,
//   //     routes.localizedValues, routes.routeToken,
//   //     any traffic-aware polyline field.
//   // ─────────────────────────────────────────────────────────────────────────

//   async _routesApi(origin, destination) {
//     console.log(
//       `[GoogleMapsProvider:DEBUG] _routesApi → origin:${JSON.stringify(origin)}` +
//       ` dest:${JSON.stringify(destination)}`
//     );
//     try {
//       const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
//         method: 'POST',
//         headers: {
//           'Content-Type':     'application/json',
//           'X-Goog-Api-Key':   this.apiKey,
//           'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
//         },
//         body: JSON.stringify({
//           origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lng      } } },
//           destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
//           travelMode:               'DRIVE',
//           routingPreference:        'TRAFFIC_UNAWARE',
//           computeAlternativeRoutes: false,
//           languageCode:             'en-US',
//           units:                    'METRIC',
//         }),
//       });

//       console.log(`[GoogleMapsProvider:DEBUG] _routesApi → HTTP ${res.status}`);

//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         console.error(
//           '[GoogleMapsProvider:DEBUG] _routesApi API error:',
//           res.status, err?.error?.message, err?.error?.status
//         );
//         return null;
//       }

//       const data  = await res.json();
//       const route = data.routes?.[0];

//       console.log(`[GoogleMapsProvider:DEBUG] _routesApi → routes received: ${data.routes?.length ?? 0}`);

//       if (!route) {
//         console.warn('[GoogleMapsProvider:DEBUG] _routesApi → no route in response:', JSON.stringify(data));
//         return null;
//       }

//       const distanceMeters = route.distanceMeters ?? 0;
//       const durationSec    = parseInt(String(route.duration ?? '0s').replace('s', ''), 10);
//       const km             = distanceMeters / 1000;
//       const min            = durationSec / 60;

//       const result = {
//         type:          'google',
//         distance:      km  >= 1 ? `${km.toFixed(1)} km`                                  : `${Math.round(distanceMeters)} m`,
//         duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
//         distanceValue: distanceMeters,
//         durationValue: durationSec,
//         geometry:      decodePolyline(route.polyline?.encodedPolyline || ''),
//         steps:         [],
//       };

//       console.log(
//         `[GoogleMapsProvider:DEBUG] _routesApi → ✅ ${result.distance}` +
//         ` | ${result.duration} | ${result.geometry.length} polyline points`
//       );
//       return result;
//     } catch (err) {
//       console.error('[GoogleMapsProvider:DEBUG] _routesApi exception:', err?.message, err);
//       return null;
//     }
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Decode Google encoded polyline → [[lng, lat], ...] GeoJSON order
// // ─────────────────────────────────────────────────────────────────────────────
// function decodePolyline(encoded) {
//   if (!encoded) return [];
//   const coords = [];
//   let index = 0, lat = 0, lng = 0;
//   while (index < encoded.length) {
//     let b, shift = 0, result = 0;
//     do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
//     lat += (result & 1) ? ~(result >> 1) : result >> 1;
//     shift = 0; result = 0;
//     do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
//     lng += (result & 1) ? ~(result >> 1) : result >> 1;
//     coords.push([lng / 1e5, lat / 1e5]);
//   }
//   return coords;
// }

// export default GoogleMapsProvider;
export class GoogleMapsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name   = 'google';

    this._center         = { lat: -15.4167, lng: 28.2833 };
    this._viewportRadius = 20_000;
    this._regionCode     = 'zm';

    // ── Seed viewport from Google IP-geolocation saved by GoogleMapsIpLocation ──
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('geo_loc_status') === 'success') {
          const geo = JSON.parse(localStorage.getItem('geo_loc_data') || 'null');
          if (geo?.lat != null && geo?.lng != null) {
            this._center = { lat: geo.lat, lng: geo.lng };
          }
        }
      } catch {}
    }

    console.log(
      '[GoogleMapsProvider:DEBUG] constructor called' +
      ` | apiKey present: ${!!apiKey}` +
      ` | apiKey prefix: ${apiKey ? apiKey.slice(0, 8) + '...' : 'NONE'}` +
      ` | center: ${JSON.stringify(this._center)}`
    );

    if (!apiKey) {
      console.error(
        '[GoogleMapsProvider:DEBUG] ⚠️  NO API KEY — ' +
        'check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in .env ' +
        'and that the Next.js dev server was restarted after adding it.'
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEWPORT / REGION HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  setViewport(lat, lng, radiusM = 20_000, regionCode = null) {
    this._center         = { lat, lng };
    this._viewportRadius = Math.min(Math.max(radiusM, 1_000), 20_000);
    if (regionCode) this._regionCode = regionCode.toLowerCase();
    console.log(
      `[GoogleMapsProvider:DEBUG] setViewport → lat:${lat} lng:${lng}` +
      ` radius:${this._viewportRadius} region:${this._regionCode}`
    );
  }

  setCenter(lat, lng) { this.setViewport(lat, lng, this._viewportRadius, this._regionCode); }
  setRegion(code)     { this._regionCode = code ? code.toLowerCase() : 'zm'; }

  // ─────────────────────────────────────────────────────────────────────────
  // DISPATCH LAYER
  // ─────────────────────────────────────────────────────────────────────────

  _dispatchSearch(apiMethod, query, countryCode) {
    console.log(`[GoogleMapsProvider:DEBUG] _dispatchSearch → apiMethod:"${apiMethod}" query:"${query}" countryCode:${countryCode}`);
    switch (apiMethod) {
      case 'placesApi':
      default:
        return this._autoCompleteNew(query, countryCode);
    }
  }

  _dispatchLocation(apiMethod, ...args) {
    const isReverse = typeof args[0] !== 'string';
    console.log(`[GoogleMapsProvider:DEBUG] _dispatchLocation → apiMethod:"${apiMethod}" isReverse:${isReverse} arg0:${args[0]}`);
    switch (apiMethod) {
      case 'geocoding':
      default:
        return isReverse
          ? this._reverseGeocode(args[0], args[1])
          : this._placeIdToLatLng(args[0]);
    }
  }

  _dispatchRoute(apiMethod, origin, destination) {
    console.log(
      `[GoogleMapsProvider:DEBUG] _dispatchRoute → apiMethod:"${apiMethod}"` +
      ` origin:${JSON.stringify(origin)} dest:${JSON.stringify(destination)}`
    );
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
    console.log(`[GoogleMapsProvider:DEBUG] searchPlaces → query:"${query}" apiMethod:"${apiMethod}" hasKey:${!!this.apiKey}`);
    if (!this.apiKey) {
      console.error('[GoogleMapsProvider:DEBUG] searchPlaces BLOCKED — no API key');
      return null;
    }
    if (!query?.trim()) {
      console.warn('[GoogleMapsProvider:DEBUG] searchPlaces BLOCKED — empty query');
      return null;
    }
    return this._dispatchSearch(apiMethod, query, countryCode);
  }

  async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoding') {
    console.log(
      `[GoogleMapsProvider:DEBUG] getPlaceDetails → placeId:"${placeId}"` +
      ` hasExtraCoords:${extraData?.lat != null} apiMethod:"${apiMethod}"`
    );
    if (extraData?.lat != null && extraData?.lng != null) {
      console.log('[GoogleMapsProvider:DEBUG] getPlaceDetails → fast-path, coords already present');
      return {
        lat:      extraData.lat,
        lng:      extraData.lng,
        address:  extraData.address  || extraData.main_text || '',
        name:     extraData.name     || extraData.main_text || '',
        place_id: placeId,
      };
    }
    if (!this.apiKey) {
      console.error('[GoogleMapsProvider:DEBUG] getPlaceDetails BLOCKED — no API key');
      return null;
    }
    if (!placeId) {
      console.warn('[GoogleMapsProvider:DEBUG] getPlaceDetails BLOCKED — no placeId');
      return null;
    }
    return this._dispatchLocation(apiMethod, placeId, extraData);
  }

  async reverseGeocode(lat, lng, apiMethod = 'geocoding') {
    console.log(`[GoogleMapsProvider:DEBUG] reverseGeocode → lat:${lat} lng:${lng} apiMethod:"${apiMethod}" hasKey:${!!this.apiKey}`);
    if (!this.apiKey) {
      console.error('[GoogleMapsProvider:DEBUG] reverseGeocode BLOCKED — no API key');
      return null;
    }
    return this._dispatchLocation(apiMethod, lat, lng);
  }

  async getRoute(origin, destination, apiMethod = 'routeApi') {
    console.log(
      `[GoogleMapsProvider:DEBUG] getRoute → apiMethod:"${apiMethod}" hasKey:${!!this.apiKey}` +
      ` origin:${JSON.stringify(origin)} dest:${JSON.stringify(destination)}`
    );
    if (!this.apiKey) {
      console.error('[GoogleMapsProvider:DEBUG] getRoute BLOCKED — no API key');
      return null;
    }
    if (!origin || !destination) {
      console.warn('[GoogleMapsProvider:DEBUG] getRoute BLOCKED — missing origin or destination');
      return null;
    }
    return this._dispatchRoute(apiMethod, origin, destination);
  }

  async calculateDistance(origin, destination, apiMethod = 'routeApi') {
    console.log(`[GoogleMapsProvider:DEBUG] calculateDistance → apiMethod:"${apiMethod}"`);
    const r = await this.getRoute(origin, destination, apiMethod);
    if (!r) {
      console.warn('[GoogleMapsProvider:DEBUG] calculateDistance → getRoute returned null');
      return null;
    }
    return { distance: r.distance, distanceValue: r.distanceValue };
  }

  async calculateEta(origin, destination, apiMethod = 'routeApi') {
    console.log(`[GoogleMapsProvider:DEBUG] calculateEta → apiMethod:"${apiMethod}"`);
    const r = await this.getRoute(origin, destination, apiMethod);
    if (!r) {
      console.warn('[GoogleMapsProvider:DEBUG] calculateEta → getRoute returned null');
      return null;
    }
    return { duration: r.duration, durationValue: r.durationValue };
  }

  async geocodeAddress(address, _apiMethod = 'geocoding') {
    console.log(`[GoogleMapsProvider:DEBUG] geocodeAddress → address:"${address}" hasKey:${!!this.apiKey}`);
    if (!this.apiKey || !address) return null;
    return this._forwardGeocode(address);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Autocomplete (New) + parallel Geocoding
  //
  // POST https://places.googleapis.com/v1/places:autocomplete
  // GET  https://maps.googleapis.com/maps/api/geocode/json
  //
  // Runs both in parallel to reliably reach 10 results.
  // Number-coded addresses (e.g. "Plot 10203, Lagos Road") are floated to top.
  // ─────────────────────────────────────────────────────────────────────────

  async _autoCompleteNew(query, countryCode) {
    // Always prefer the saved GPS/IP geolocation over the static default
    let lat = this._center.lat;
    let lng = this._center.lng;
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('geo_loc_status') === 'success') {
          const geo = JSON.parse(localStorage.getItem('geo_loc_data') || 'null');
          if (geo?.lat != null && geo?.lng != null) { lat = geo.lat; lng = geo.lng; }
        }
      } catch {}
    }

    const effectiveRegion = this._regionCode || (countryCode ? countryCode.toLowerCase() : 'zm');

    const body = {
      input:                   query.trim(),
      languageCode:            'en',
      includeQueryPredictions: true,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          // Widen the bias radius so nearby numbered streets aren't clipped
          radius: Math.min(Math.max(this._viewportRadius, 5_000), 50_000),
        },
      },
      origin:     { latitude: lat, longitude: lng },
      regionCode: effectiveRegion,
      // Intentionally omit includedRegionCodes — avoids missing cross-border
      // results like a "Lagos Road" that sits just outside a country boundary.
    };

    console.log(
      '[GoogleMapsProvider:DEBUG] _autoCompleteNew → center:(' + lat + ',' + lng + ')' +
      ' region:' + effectiveRegion
    );

    // ── Run autocomplete + geocoding in parallel ──────────────────────────
    const [acSettled, geoSettled] = await Promise.allSettled([

      // 1) Places Autocomplete (New) — up to 5 fuzzy predictions
      (async () => {
        const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type':     'application/json',
            'X-Goog-Api-Key':   this.apiKey,
            'X-Goog-FieldMask': [
              'suggestions.placePrediction.placeId',
              'suggestions.placePrediction.text',
              'suggestions.placePrediction.structuredFormat',
              'suggestions.placePrediction.distanceMeters',
            ].join(','),
          },
          body: JSON.stringify(body),
        });

        console.log(`[GoogleMapsProvider:DEBUG] _autoCompleteNew AC → HTTP ${res.status}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('[GoogleMapsProvider:DEBUG] _autoCompleteNew AC error:', res.status, err?.error?.message);
          return [];
        }

        const data = await res.json();
        return (data.suggestions ?? [])
          .filter(s => s.placePrediction)
          .map(s => {
            const pred           = s.placePrediction;
            const main_text      = pred.structuredFormat?.mainText?.text      || pred.text?.text?.split(',')[0]?.trim()            || '';
            const secondary_text = pred.structuredFormat?.secondaryText?.text || pred.text?.text?.split(',').slice(1).join(',').trim() || '';
            return {
              place_id:       pred.placeId,
              main_text,
              secondary_text,
              address:        pred.text?.text || `${main_text}, ${secondary_text}`,
              name:           main_text,
              distanceMeters: pred.distanceMeters ?? null,
              _src:           'ac',
            };
          });
      })(),

      // 2) Geocoding API — returns ALL address matches including plot/street
      //    numbers like "10203 Lagos Road". Bounds-biased to current location.
      (async () => {
        const delta  = 0.5; // ~55 km bounding box
        const bounds = `${lat - delta},${lng - delta}|${lat + delta},${lng + delta}`;
        const params = new URLSearchParams({
          address:  query.trim(),
          key:      this.apiKey,
          language: 'en',
          bounds,
          ...(this._regionCode ? { region: this._regionCode } : {}),
        });
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

        console.log(`[GoogleMapsProvider:DEBUG] _autoCompleteNew GEO → HTTP ${res.status}`);
        if (!res.ok) return [];

        const data = await res.json();
        console.log(`[GoogleMapsProvider:DEBUG] _autoCompleteNew GEO → status:"${data.status}" results:${data.results?.length ?? 0}`);
        if (data.status !== 'OK') return [];

        return (data.results || []).map(r => {
          const name = r.address_components?.[0]?.long_name || r.formatted_address.split(',')[0];
          // Approximate distance in metres (flat-earth OK at city scale)
          const dLat = r.geometry.location.lat - lat;
          const dLng = r.geometry.location.lng - lng;
          const distanceMeters = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111_000);
          return {
            place_id:       r.place_id,
            main_text:      name,
            secondary_text: r.formatted_address,
            address:        r.formatted_address,
            name,
            lat:            r.geometry.location.lat,
            lng:            r.geometry.location.lng,
            distanceMeters,
            _src:           'geo',
          };
        });
      })(),
    ]);

    const acList  = acSettled.status  === 'fulfilled' ? acSettled.value  : [];
    const geoList = geoSettled.status === 'fulfilled' ? geoSettled.value : [];

    console.log(
      `[GoogleMapsProvider:DEBUG] _autoCompleteNew → ac:${acList.length} geo:${geoList.length}`
    );

    // ── Merge + deduplicate (by place_id, then by address string) ────────
    const seen   = new Set();
    const merged = [];
    for (const r of [...acList, ...geoList]) {
      const key = r.place_id || r.address;
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      merged.push(r);
      if (merged.length >= 10) break;  // hard cap at 10 results
    }

    if (!merged.length) return null;

    // ── Sort: number-coded addresses first, then by proximity ────────────
    // Rationale: users typing "10203 Lagos" almost certainly want the exact
    // numbered address, not a fuzzy suburb match.
    const hasNumber = (r) => /\d/.test(r.main_text || r.name || '');
    merged.sort((a, b) => {
      const numA = hasNumber(a) ? 0 : 1;
      const numB = hasNumber(b) ? 0 : 1;
      if (numA !== numB) return numA - numB;
      return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
    });

    console.log(
      '[GoogleMapsProvider:DEBUG] _autoCompleteNew → ✅ returning',
      merged.length, 'results:', merged.map(r => r.main_text).join(' | ')
    );
    return merged;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Geocoding API — place ID → lat/lng
  // Tier : Essentials $5.00 / 1k
  // ─────────────────────────────────────────────────────────────────────────

  async _placeIdToLatLng(placeId) {
    console.log(`[GoogleMapsProvider:DEBUG] _placeIdToLatLng → placeId:"${placeId}"`);
    try {
      const params = new URLSearchParams({ place_id: placeId, key: this.apiKey, language: 'en' });
      const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

      console.log(`[GoogleMapsProvider:DEBUG] _placeIdToLatLng → HTTP ${res.status}`);
      if (!res.ok) return null;

      const data = await res.json();
      console.log(
        `[GoogleMapsProvider:DEBUG] _placeIdToLatLng → API status:"${data.status}"` +
        ` results:${data.results?.length ?? 0}`
      );

      if (data.status !== 'OK' || !data.results?.length) {
        console.warn('[GoogleMapsProvider:DEBUG] _placeIdToLatLng → bad status:', data.status, data.error_message);
        return null;
      }

      const r      = data.results[0];
      const result = {
        lat:      r.geometry.location.lat,
        lng:      r.geometry.location.lng,
        address:  r.formatted_address,
        name:     r.address_components?.[0]?.long_name || r.formatted_address?.split(',')[0] || '',
        place_id: r.place_id || placeId,
      };
      console.log('[GoogleMapsProvider:DEBUG] _placeIdToLatLng → ✅', JSON.stringify(result));
      return result;
    } catch (err) {
      console.error('[GoogleMapsProvider:DEBUG] _placeIdToLatLng exception:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Geocoding API — latlng → address
  // Tier : Essentials $5.00 / 1k
  // ─────────────────────────────────────────────────────────────────────────

  async _reverseGeocode(lat, lng) {
    console.log(`[GoogleMapsProvider:DEBUG] _reverseGeocode → lat:${lat} lng:${lng}`);
    try {
      const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: this.apiKey, language: 'en' });
      const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

      console.log(`[GoogleMapsProvider:DEBUG] _reverseGeocode → HTTP ${res.status}`);
      if (!res.ok) return null;

      const data = await res.json();
      console.log(
        `[GoogleMapsProvider:DEBUG] _reverseGeocode → API status:"${data.status}"` +
        ` results:${data.results?.length ?? 0}`
      );

      if (data.status !== 'OK' || !data.results?.length) {
        console.warn('[GoogleMapsProvider:DEBUG] _reverseGeocode → bad status:', data.status, data.error_message);
        return null;
      }

      const result  = data.results[0];
      const getComp = (types) =>
        result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null;

      const out = {
        lat, lng,
        address:       result.formatted_address,
        name:          getComp(['locality', 'sublocality', 'neighborhood']) ||
                       getComp(['administrative_area_level_2']) || 'Unknown',
        place_id:      result.place_id,
        city:          getComp(['locality', 'administrative_area_level_2']),
        country:       getComp(['country']),
        postalCode:    getComp(['postal_code']),
        state:         getComp(['administrative_area_level_1']),
        streetAddress: getComp(['route']),
        streetNumber:  getComp(['street_number']),
      };
      console.log('[GoogleMapsProvider:DEBUG] _reverseGeocode → ✅', JSON.stringify(out));
      return out;
    } catch (err) {
      console.error('[GoogleMapsProvider:DEBUG] _reverseGeocode exception:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Geocoding API — address string → lat/lng
  // Tier : Essentials $5.00 / 1k
  // ─────────────────────────────────────────────────────────────────────────

  async _forwardGeocode(address) {
    console.log(`[GoogleMapsProvider:DEBUG] _forwardGeocode → address:"${address}" region:${this._regionCode}`);
    try {
      const params = new URLSearchParams({
        address,
        key:      this.apiKey,
        language: 'en',
        ...(this._regionCode ? { region: this._regionCode } : {}),
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);

      console.log(`[GoogleMapsProvider:DEBUG] _forwardGeocode → HTTP ${res.status}`);
      if (!res.ok) return null;

      const data = await res.json();
      console.log(
        `[GoogleMapsProvider:DEBUG] _forwardGeocode → API status:"${data.status}"` +
        ` results:${data.results?.length ?? 0}`
      );

      if (data.status !== 'OK' || !data.results?.length) {
        console.warn('[GoogleMapsProvider:DEBUG] _forwardGeocode → bad status:', data.status, data.error_message);
        return null;
      }

      const r = data.results[0];
      return { lat: r.geometry.location.lat, lng: r.geometry.location.lng, address: r.formatted_address, place_id: r.place_id };
    } catch (err) {
      console.error('[GoogleMapsProvider:DEBUG] _forwardGeocode exception:', err?.message);
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
    console.log(
      `[GoogleMapsProvider:DEBUG] _routesApi → origin:${JSON.stringify(origin)}` +
      ` dest:${JSON.stringify(destination)}`
    );
    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type':     'application/json',
          'X-Goog-Api-Key':   this.apiKey,
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

      console.log(`[GoogleMapsProvider:DEBUG] _routesApi → HTTP ${res.status}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(
          '[GoogleMapsProvider:DEBUG] _routesApi API error:',
          res.status, err?.error?.message, err?.error?.status
        );
        return null;
      }

      const data  = await res.json();
      const route = data.routes?.[0];

      console.log(`[GoogleMapsProvider:DEBUG] _routesApi → routes received: ${data.routes?.length ?? 0}`);

      if (!route) {
        console.warn('[GoogleMapsProvider:DEBUG] _routesApi → no route in response:', JSON.stringify(data));
        return null;
      }

      const distanceMeters = route.distanceMeters ?? 0;
      const durationSec    = parseInt(String(route.duration ?? '0s').replace('s', ''), 10);
      const km             = distanceMeters / 1000;
      const min            = durationSec / 60;

      const result = {
        type:          'google',
        distance:      km  >= 1 ? `${km.toFixed(1)} km`                                  : `${Math.round(distanceMeters)} m`,
        duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
        distanceValue: distanceMeters,
        durationValue: durationSec,
        geometry:      decodePolyline(route.polyline?.encodedPolyline || ''),
        steps:         [],
      };

      console.log(
        `[GoogleMapsProvider:DEBUG] _routesApi → ✅ ${result.distance}` +
        ` | ${result.duration} | ${result.geometry.length} polyline points`
      );
      return result;
    } catch (err) {
      console.error('[GoogleMapsProvider:DEBUG] _routesApi exception:', err?.message, err);
      return null;
    }
  }
}

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

export default GoogleMapsProvider;