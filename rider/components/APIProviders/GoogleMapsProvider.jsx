// // // // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/GoogleMapsProvider.jsx
// // // // // // //
// // // // // // // Wraps Google Maps Geocoder HTTP API and Places API.
// // // // // // // Called by MapsProvider when Google is the active provider.
// // // // // // // Does NOT load the Google Maps JavaScript API here — that is only loaded
// // // // // // // inside the MapIframe when a Google JS API key is present.

// // // // // // export class GoogleMapsProvider {
// // // // // //   constructor(apiKey) {
// // // // // //     this.apiKey = apiKey;
// // // // // //     this.name = 'googlemaps';
// // // // // //   }

// // // // // //   // ── Place autocomplete (Places API) ────────────────────────────────────────
// // // // // //   async searchPlaces(query, countryCode = null) {
// // // // // //     if (!this.apiKey) return null;
// // // // // //     try {
// // // // // //       const params = new URLSearchParams({
// // // // // //         input: query,
// // // // // //         key: this.apiKey,
// // // // // //         language: 'en',
// // // // // //       });
// // // // // //       if (countryCode) params.set('components', `country:${countryCode}`);

// // // // // //       const res = await fetch(
// // // // // //         `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
// // // // // //       );
// // // // // //       if (!res.ok) return null;
// // // // // //       const data = await res.json();

// // // // // //       if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return null;

// // // // // //       return (data.predictions || []).map((p) => ({
// // // // // //         place_id: p.place_id,
// // // // // //         main_text: p.structured_formatting?.main_text || p.description,
// // // // // //         secondary_text: p.structured_formatting?.secondary_text || '',
// // // // // //         address: p.description,
// // // // // //         name: p.structured_formatting?.main_text || p.description,
// // // // // //       }));
// // // // // //     } catch (err) {
// // // // // //       console.error('[GoogleMapsProvider] searchPlaces error:', err);
// // // // // //       return null;
// // // // // //     }
// // // // // //   }

// // // // // //   // ── Place details ──────────────────────────────────────────────────────────
// // // // // //   async getPlaceDetails(placeId) {
// // // // // //     if (!this.apiKey) return null;
// // // // // //     try {
// // // // // //       const res = await fetch(
// // // // // //         `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${this.apiKey}`
// // // // // //       );
// // // // // //       if (!res.ok) return null;
// // // // // //       const data = await res.json();
// // // // // //       if (data.status !== 'OK') return null;

// // // // // //       const p = data.result;
// // // // // //       return {
// // // // // //         lat: p.geometry.location.lat,
// // // // // //         lng: p.geometry.location.lng,
// // // // // //         address: p.formatted_address,
// // // // // //         name: p.name,
// // // // // //         place_id: placeId,
// // // // // //       };
// // // // // //     } catch (err) {
// // // // // //       console.error('[GoogleMapsProvider] getPlaceDetails error:', err);
// // // // // //       return null;
// // // // // //     }
// // // // // //   }

// // // // // //   // ── Geocoder HTTP API ──────────────────────────────────────────────────────
// // // // // //   async reverseGeocode(lat, lng) {
// // // // // //     if (!this.apiKey) return null;
// // // // // //     try {
// // // // // //       const res = await fetch(
// // // // // //         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&language=en`
// // // // // //       );
// // // // // //       if (!res.ok) return null;
// // // // // //       const data = await res.json();
// // // // // //       if (data.status !== 'OK' || !data.results?.length) return null;

// // // // // //       const result = data.results[0];
// // // // // //       const getComp = (types) =>
// // // // // //         result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name || null;

// // // // // //       return {
// // // // // //         lat,
// // // // // //         lng,
// // // // // //         address: result.formatted_address,
// // // // // //         name: getComp(['locality', 'sublocality', 'neighborhood']) || getComp(['administrative_area_level_2']) || 'Unknown',
// // // // // //         place_id: result.place_id,
// // // // // //         city: getComp(['locality', 'administrative_area_level_2']),
// // // // // //         country: getComp(['country']),
// // // // // //         postalCode: getComp(['postal_code']),
// // // // // //         state: getComp(['administrative_area_level_1']),
// // // // // //         streetAddress: getComp(['route']),
// // // // // //         streetNumber: getComp(['street_number']),
// // // // // //       };
// // // // // //     } catch (err) {
// // // // // //       console.error('[GoogleMapsProvider] reverseGeocode error:', err);
// // // // // //       return null;
// // // // // //     }
// // // // // //   }

// // // // // //   async geocodeAddress(address) {
// // // // // //     if (!this.apiKey) return null;
// // // // // //     try {
// // // // // //       const res = await fetch(
// // // // // //         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}&language=en`
// // // // // //       );
// // // // // //       if (!res.ok) return null;
// // // // // //       const data = await res.json();
// // // // // //       if (data.status !== 'OK' || !data.results?.length) return null;

// // // // // //       const r = data.results[0];
// // // // // //       return {
// // // // // //         lat: r.geometry.location.lat,
// // // // // //         lng: r.geometry.location.lng,
// // // // // //         address: r.formatted_address,
// // // // // //         place_id: r.place_id,
// // // // // //       };
// // // // // //     } catch (err) {
// // // // // //       console.error('[GoogleMapsProvider] geocodeAddress error:', err);
// // // // // //       return null;
// // // // // //     }
// // // // // //   }
// // // // // // }

// // // // // // export default GoogleMapsProvider;

// // // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/GoogleMapsProvider.jsx
// // // // // //
// // // // // // Cost-optimized Google Maps implementation.
// // // // // //
// // // // // // Three-step flow (all Essentials tier):
// // // // // //   1. Autocomplete (New)  — per-request, no session token     ~$2.83 / 1k
// // // // // //   2. Geocoding API       — placeId → lat/lng                  $5.00 / 1k
// // // // // //   3. Routes API          — coordinates → distance/ETA/polyline $5.00 / 1k
// // // // // //
// // // // // // Field masking is applied at every step so we never accidentally trigger
// // // // // // a higher pricing tier.
// // // // // //
// // // // // // Total per autocomplete-to-route flow: ~$12.83 / 1k  (vs ~$22+ session-based)

// // // // // export class GoogleMapsProvider {
// // // // //   constructor(apiKey) {
// // // // //     this.apiKey = apiKey;
// // // // //     this.name   = 'google';
// // // // //   }

// // // // //   // ─────────────────────────────────────────────────────────────────────────
// // // // //   // STEP 1 — Place Autocomplete (New)
// // // // //   //
// // // // //   // Endpoint : POST https://places.googleapis.com/v1/places:autocomplete
// // // // //   // Tier     : Essentials ~$2.83 / 1k  (per-request — NO session token)
// // // // //   // Mask     : suggestions.placePrediction.text
// // // // //   //            suggestions.placePrediction.placeId
// // // // //   //
// // // // //   // Returns  : [{ place_id, main_text, secondary_text, address, name }]
// // // // //   //
// // // // //   // Note: we intentionally omit `sessionToken` to stay in per-request pricing.
// // // // //   // Session pricing ($17/session) is only cheaper when ≥ 3 keystrokes lead
// // // // //   // to a single Place Details call — which we replace with the cheaper
// // // // //   // Geocoding API in step 2.
// // // // //   // ─────────────────────────────────────────────────────────────────────────

// // // // //   async searchPlaces(query, countryCode = null) {
// // // // //     if (!this.apiKey || !query) return null;

// // // // //     try {
// // // // //       const body = {
// // // // //         input:            query,
// // // // //         languageCode:     'en',
// // // // //         // Optional: bias toward a region using a circle
// // // // //         // locationBias: { circle: { center: { latitude, longitude }, radiusMeters: 50000 } }
// // // // //       };

// // // // //       if (countryCode) {
// // // // //         // includedRegionCodes takes ISO 3166-1 alpha-2 codes
// // // // //         body.includedRegionCodes = [countryCode.toUpperCase()];
// // // // //       }

// // // // //       const res = await fetch(
// // // // //         'https://places.googleapis.com/v1/places:autocomplete',
// // // // //         {
// // // // //           method:  'POST',
// // // // //           headers: {
// // // // //             'Content-Type':    'application/json',
// // // // //             'X-Goog-Api-Key':  this.apiKey,
// // // // //             // ⚑ FIELD MASK — only pay for text + placeId (Essentials)
// // // // //             'X-Goog-FieldMask': 'suggestions.placePrediction.text,suggestions.placePrediction.placeId',
// // // // //           },
// // // // //           body: JSON.stringify(body),
// // // // //         },
// // // // //       );

// // // // //       if (!res.ok) {
// // // // //         const err = await res.json().catch(() => ({}));
// // // // //         console.error('[GoogleMapsProvider.searchPlaces] API error:', res.status, err?.error?.message);
// // // // //         return null;
// // // // //       }

// // // // //       const data        = await res.json();
// // // // //       const suggestions = data.suggestions || [];
// // // // //       if (!suggestions.length) return null;

// // // // //       return suggestions
// // // // //         .filter((s) => s.placePrediction)
// // // // //         .map((s) => {
// // // // //           const pred     = s.placePrediction;
// // // // //           const fullText = pred.text?.text || '';
// // // // //           // text.text = "Main Text, Secondary Text, Country"
// // // // //           // Split on first comma for a rough main/secondary split
// // // // //           const commaIdx     = fullText.indexOf(',');
// // // // //           const main_text    = commaIdx > -1 ? fullText.slice(0, commaIdx).trim() : fullText;
// // // // //           const secondary_text = commaIdx > -1 ? fullText.slice(commaIdx + 1).trim() : '';

// // // // //           return {
// // // // //             place_id:       pred.placeId,
// // // // //             main_text,
// // // // //             secondary_text,
// // // // //             address:        fullText,
// // // // //             name:           main_text,
// // // // //             // lat/lng are NOT available at this step — resolved in getPlaceDetails
// // // // //           };
// // // // //         });
// // // // //     } catch (err) {
// // // // //       console.error('[GoogleMapsProvider.searchPlaces] error:', err?.message);
// // // // //       return null;
// // // // //     }
// // // // //   }

// // // // //   // ─────────────────────────────────────────────────────────────────────────
// // // // //   // STEP 2 — Geocoding API  (placeId → lat/lng)
// // // // //   //
// // // // //   // Endpoint : GET https://maps.googleapis.com/maps/api/geocode/json
// // // // //   // Tier     : Essentials $5.00 / 1k
// // // // //   //
// // // // //   // This replaces the much more expensive Place Details API ($17 / 1k).
// // // // //   // We only need coordinates + a formatted address, both of which the
// // // // //   // Geocoding API returns as standard Essentials fields.
// // // // //   // ─────────────────────────────────────────────────────────────────────────

// // // // //   async getPlaceDetails(placeId, extraData = null) {
// // // // //     // Fast path: caller already has coordinates (e.g. from a prior lookup)
// // // // //     if (extraData?.lat != null && extraData?.lng != null) {
// // // // //       return {
// // // // //         lat:      extraData.lat,
// // // // //         lng:      extraData.lng,
// // // // //         address:  extraData.address || extraData.main_text || '',
// // // // //         name:     extraData.name    || extraData.main_text || '',
// // // // //         place_id: placeId,
// // // // //       };
// // // // //     }

// // // // //     if (!this.apiKey || !placeId) return null;

// // // // //     try {
// // // // //       const params = new URLSearchParams({
// // // // //         place_id: placeId,
// // // // //         key:      this.apiKey,
// // // // //         language: 'en',
// // // // //         // result_type not set — we want whatever the Geocoding API returns
// // // // //         // for this place_id; no extra filtering needed.
// // // // //       });

// // // // //       const res = await fetch(
// // // // //         `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
// // // // //       );
// // // // //       if (!res.ok) return null;

// // // // //       const data = await res.json();
// // // // //       if (data.status !== 'OK' || !data.results?.length) {
// // // // //         console.warn('[GoogleMapsProvider.getPlaceDetails] geocoding status:', data.status);
// // // // //         return null;
// // // // //       }

// // // // //       const r = data.results[0];
// // // // //       return {
// // // // //         lat:      r.geometry.location.lat,
// // // // //         lng:      r.geometry.location.lng,
// // // // //         address:  r.formatted_address,
// // // // //         name:     r.address_components?.[0]?.long_name || r.formatted_address?.split(',')[0] || '',
// // // // //         place_id: r.place_id || placeId,
// // // // //       };
// // // // //     } catch (err) {
// // // // //       console.error('[GoogleMapsProvider.getPlaceDetails] error:', err?.message);
// // // // //       return null;
// // // // //     }
// // // // //   }

// // // // //   // ─────────────────────────────────────────────────────────────────────────
// // // // //   // STEP 3 — Routes API  (coordinates → distance / ETA / polyline)
// // // // //   //
// // // // //   // Endpoint : POST https://routes.googleapis.com/directions/v2:computeRoutes
// // // // //   // Tier     : Essentials $5.00 / 1k
// // // // //   //
// // // // //   // STRICT field mask keeps us in Essentials.
// // // // //   // Adding any of the following would trigger Pro ($10 / 1k):
// // // // //   //   routes.travelAdvisory, routes.legs.travelAdvisory,
// // // // //   //   routes.optimizedIntermediateWaypointIndex,
// // // // //   //   routes.localizedValues, routes.routeToken
// // // // //   //   or any traffic-aware polyline fields.
// // // // //   // ─────────────────────────────────────────────────────────────────────────

// // // // //   async getRoute(origin, destination) {
// // // // //     if (!this.apiKey || !origin || !destination) return null;

// // // // //     try {
// // // // //       const body = {
// // // // //         origin: {
// // // // //           location: {
// // // // //             latLng: { latitude: origin.lat, longitude: origin.lng },
// // // // //           },
// // // // //         },
// // // // //         destination: {
// // // // //           location: {
// // // // //             latLng: { latitude: destination.lat, longitude: destination.lng },
// // // // //           },
// // // // //         },
// // // // //         travelMode:             'DRIVE',
// // // // //         routingPreference:      'TRAFFIC_UNAWARE',  // TRAFFIC_AWARE would bump to Pro
// // // // //         computeAlternativeRoutes: false,
// // // // //         languageCode:           'en-US',
// // // // //         units:                  'METRIC',
// // // // //       };

// // // // //       const res = await fetch(
// // // // //         'https://routes.googleapis.com/directions/v2:computeRoutes',
// // // // //         {
// // // // //           method:  'POST',
// // // // //           headers: {
// // // // //             'Content-Type':   'application/json',
// // // // //             'X-Goog-Api-Key': this.apiKey,
// // // // //             // ⚑ STRICT FIELD MASK — exactly the three Essentials fields
// // // // //             // Do NOT add anything beyond these three without checking pricing.
// // // // //             'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
// // // // //           },
// // // // //           body: JSON.stringify(body),
// // // // //         },
// // // // //       );

// // // // //       if (!res.ok) {
// // // // //         const err = await res.json().catch(() => ({}));
// // // // //         console.error('[GoogleMapsProvider.getRoute] API error:', res.status, err?.error?.message);
// // // // //         return null;
// // // // //       }

// // // // //       const data  = await res.json();
// // // // //       const route = data.routes?.[0];
// // // // //       if (!route) return null;

// // // // //       const distanceMeters = route.distanceMeters ?? 0;
// // // // //       const durationSec    = parseInt(route.duration?.replace('s', '') || '0', 10);
// // // // //       const km             = distanceMeters / 1000;
// // // // //       const min            = durationSec / 60;

// // // // //       // Decode the encoded polyline into [[lng, lat], ...] GeoJSON order
// // // // //       const geometry = decodePolyline(route.polyline?.encodedPolyline || '');

// // // // //       return {
// // // // //         type:          'google',
// // // // //         distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(distanceMeters)} m`,
// // // // //         duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
// // // // //         distanceValue: distanceMeters,
// // // // //         durationValue: durationSec,
// // // // //         geometry,               // [[lng, lat], ...]  — ready for MapLibre / MapIframe
// // // // //         steps:         [],      // Routes Essentials doesn't include step-by-step nav
// // // // //       };
// // // // //     } catch (err) {
// // // // //       console.error('[GoogleMapsProvider.getRoute] error:', err?.message);
// // // // //       return null;
// // // // //     }
// // // // //   }

// // // // //   // ─────────────────────────────────────────────────────────────────────────
// // // // //   // calculateDistance — extracts distance from getRoute
// // // // //   // ─────────────────────────────────────────────────────────────────────────

// // // // //   async calculateDistance(origin, destination) {
// // // // //     const route = await this.getRoute(origin, destination);
// // // // //     if (!route) return null;
// // // // //     return { distance: route.distance, distanceValue: route.distanceValue };
// // // // //   }

// // // // //   // ─────────────────────────────────────────────────────────────────────────
// // // // //   // calculateEta — extracts duration from getRoute
// // // // //   // ─────────────────────────────────────────────────────────────────────────

// // // // //   async calculateEta(origin, destination) {
// // // // //     const route = await this.getRoute(origin, destination);
// // // // //     if (!route) return null;
// // // // //     return { duration: route.duration, durationValue: route.durationValue };
// // // // //   }

// // // // //   // ─────────────────────────────────────────────────────────────────────────
// // // // //   // reverseGeocode — Geocoding API (latlng → address)
// // // // //   //
// // // // //   // Tier: Essentials $5.00 / 1k
// // // // //   // ─────────────────────────────────────────────────────────────────────────

// // // // //   async reverseGeocode(lat, lng) {
// // // // //     if (!this.apiKey) return null;
// // // // //     try {
// // // // //       const params = new URLSearchParams({
// // // // //         latlng:   `${lat},${lng}`,
// // // // //         key:      this.apiKey,
// // // // //         language: 'en',
// // // // //       });

// // // // //       const res = await fetch(
// // // // //         `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
// // // // //       );
// // // // //       if (!res.ok) return null;

// // // // //       const data = await res.json();
// // // // //       if (data.status !== 'OK' || !data.results?.length) return null;

// // // // //       const result = data.results[0];
// // // // //       const getComp = (types) =>
// // // // //         result.address_components?.find((c) =>
// // // // //           types.some((t) => c.types.includes(t)),
// // // // //         )?.long_name ?? null;

// // // // //       return {
// // // // //         lat, lng,
// // // // //         address:       result.formatted_address,
// // // // //         name:          getComp(['locality', 'sublocality', 'neighborhood'])
// // // // //                        || getComp(['administrative_area_level_2'])
// // // // //                        || 'Unknown',
// // // // //         place_id:      result.place_id,
// // // // //         city:          getComp(['locality', 'administrative_area_level_2']),
// // // // //         country:       getComp(['country']),
// // // // //         postalCode:    getComp(['postal_code']),
// // // // //         state:         getComp(['administrative_area_level_1']),
// // // // //         streetAddress: getComp(['route']),
// // // // //         streetNumber:  getComp(['street_number']),
// // // // //       };
// // // // //     } catch (err) {
// // // // //       console.error('[GoogleMapsProvider.reverseGeocode] error:', err?.message);
// // // // //       return null;
// // // // //     }
// // // // //   }

// // // // //   // ─────────────────────────────────────────────────────────────────────────
// // // // //   // geocodeAddress — forward geocode a free-text address string
// // // // //   // Tier: Essentials $5.00 / 1k
// // // // //   // ─────────────────────────────────────────────────────────────────────────

// // // // //   async geocodeAddress(address) {
// // // // //     if (!this.apiKey || !address) return null;
// // // // //     try {
// // // // //       const params = new URLSearchParams({
// // // // //         address:  address,
// // // // //         key:      this.apiKey,
// // // // //         language: 'en',
// // // // //       });

// // // // //       const res = await fetch(
// // // // //         `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
// // // // //       );
// // // // //       if (!res.ok) return null;

// // // // //       const data = await res.json();
// // // // //       if (data.status !== 'OK' || !data.results?.length) return null;

// // // // //       const r = data.results[0];
// // // // //       return {
// // // // //         lat:      r.geometry.location.lat,
// // // // //         lng:      r.geometry.location.lng,
// // // // //         address:  r.formatted_address,
// // // // //         place_id: r.place_id,
// // // // //       };
// // // // //     } catch (err) {
// // // // //       console.error('[GoogleMapsProvider.geocodeAddress] error:', err?.message);
// // // // //       return null;
// // // // //     }
// // // // //   }
// // // // // }

// // // // // export default GoogleMapsProvider;

// // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // POLYLINE DECODER
// // // // // //
// // // // // // Decodes a Google encoded polyline string into [[lng, lat], ...] pairs
// // // // // // (GeoJSON coordinate order) ready for MapLibre / the IframeMap route renderer.
// // // // // //
// // // // // // Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
// // // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // // function decodePolyline(encoded) {
// // // // //   if (!encoded) return [];

// // // // //   const coords = [];
// // // // //   let index = 0, lat = 0, lng = 0;

// // // // //   while (index < encoded.length) {
// // // // //     let b, shift = 0, result = 0;
// // // // //     do {
// // // // //       b       = encoded.charCodeAt(index++) - 63;
// // // // //       result |= (b & 0x1f) << shift;
// // // // //       shift  += 5;
// // // // //     } while (b >= 0x20);
// // // // //     lat += (result & 1) ? ~(result >> 1) : result >> 1;

// // // // //     shift = 0; result = 0;
// // // // //     do {
// // // // //       b       = encoded.charCodeAt(index++) - 63;
// // // // //       result |= (b & 0x1f) << shift;
// // // // //       shift  += 5;
// // // // //     } while (b >= 0x20);
// // // // //     lng += (result & 1) ? ~(result >> 1) : result >> 1;

// // // // //     // GeoJSON order: [longitude, latitude]
// // // // //     coords.push([lng / 1e5, lat / 1e5]);
// // // // //   }

// // // // //   return coords;
// // // // // }
// // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/GoogleMapsProvider.jsx
// // // // //
// // // // // Cost-optimized Google Maps implementation.
// // // // //
// // // // // Three-step flow (all Essentials tier):
// // // // //   1. Autocomplete (New)  — per-request, no session token     ~$2.83 / 1k
// // // // //   2. Geocoding API       — placeId → lat/lng                  $5.00 / 1k
// // // // //   3. Routes API          — coordinates → distance/ETA/polyline $5.00 / 1k

// // // // export class GoogleMapsProvider {
// // // //   constructor(apiKey) {
// // // //     this.apiKey = apiKey;
// // // //     this.name   = 'google';
// // // //   }

// // // //   // ─────────────────────────────────────────────────────────────────────────
// // // //   // STEP 1 — Place Autocomplete (New)
// // // //   //
// // // //   // POST https://places.googleapis.com/v1/places:autocomplete
// // // //   // Tier : Essentials ~$2.83 / 1k  (per-request — NO session token)
// // // //   //
// // // //   // Field mask includes structuredFormat so we get a clean main / secondary
// // // //   // text split directly from the API instead of splitting on the first comma.
// // // //   //
// // // //   // ⚑ Do NOT add fields beyond these three — each extra field risks bumping
// // // //   //   the SKU to a higher pricing tier.
// // // //   // ─────────────────────────────────────────────────────────────────────────

// // // //   async searchPlaces(query, countryCode = null) {
// // // //     if (!this.apiKey || !query) return null;

// // // //     try {
// // // //       const body = { input: query, languageCode: 'en' };
// // // //       if (countryCode) body.includedRegionCodes = [countryCode.toUpperCase()];

// // // //       // Pass the current viewport center as a bias when available.
// // // //       // AppleMapsProvider.setCenter() pattern — we mirror it here.
// // // //       if (this._center) {
// // // //         body.locationBias = {
// // // //           circle: {
// // // //             center: { latitude: this._center.lat, longitude: this._center.lng },
// // // //             radiusMeters: 50_000,
// // // //           },
// // // //         };
// // // //       }

// // // //       const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
// // // //         method:  'POST',
// // // //         headers: {
// // // //           'Content-Type':    'application/json',
// // // //           'X-Goog-Api-Key':  this.apiKey,
// // // //           // ⚑ FIELD MASK — structuredFormat gives us clean main / secondary
// // // //           //   text without fragile comma-splitting. placeId is required for
// // // //           //   step 2. text is kept as the address fallback.
// // // //           'X-Goog-FieldMask': [
// // // //             'suggestions.placePrediction.placeId',
// // // //             'suggestions.placePrediction.text',
// // // //             'suggestions.placePrediction.structuredFormat',
// // // //           ].join(','),
// // // //         },
// // // //         body: JSON.stringify(body),
// // // //       });

// // // //       if (!res.ok) {
// // // //         const err = await res.json().catch(() => ({}));
// // // //         console.error('[GoogleMapsProvider.searchPlaces] API error:', res.status, err?.error?.message);
// // // //         return null;
// // // //       }

// // // //       const data        = await res.json();
// // // //       const suggestions = data.suggestions ?? [];
// // // //       if (!suggestions.length) return null;

// // // //       return suggestions
// // // //         .filter((s) => s.placePrediction)
// // // //         .map((s) => {
// // // //           const pred = s.placePrediction;

// // // //           // Prefer structuredFormat — it gives us the split the API computed.
// // // //           // Fall back to splitting pred.text.text on the first comma only when
// // // //           // structuredFormat is absent (should never happen with the mask above).
// // // //           const main_text =
// // // //             pred.structuredFormat?.mainText?.text ||
// // // //             pred.text?.text?.split(',')[0]?.trim() ||
// // // //             '';

// // // //           const secondary_text =
// // // //             pred.structuredFormat?.secondaryText?.text ||
// // // //             pred.text?.text?.split(',').slice(1).join(',').trim() ||
// // // //             '';

// // // //           return {
// // // //             place_id:       pred.placeId,
// // // //             main_text,
// // // //             secondary_text,
// // // //             address:        pred.text?.text || `${main_text}, ${secondary_text}`,
// // // //             name:           main_text,
// // // //             // lat/lng are NOT available here — resolved in getPlaceDetails (step 2)
// // // //           };
// // // //         });
// // // //     } catch (err) {
// // // //       console.error('[GoogleMapsProvider.searchPlaces] error:', err?.message);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   // Allow the map display to push the current viewport center so search
// // // //   // results are biased toward the visible area (mirrors AppleMapsProvider).
// // // //   setCenter(lat, lng) {
// // // //     this._center = { lat, lng };
// // // //   }

// // // //   // ─────────────────────────────────────────────────────────────────────────
// // // //   // STEP 2 — Geocoding API  (placeId → lat/lng + address)
// // // //   //
// // // //   // GET https://maps.googleapis.com/maps/api/geocode/json?place_id=…
// // // //   // Tier : Essentials $5.00 / 1k
// // // //   //
// // // //   // Replaces the much more expensive Place Details API ($17 / 1k).
// // // //   // ─────────────────────────────────────────────────────────────────────────

// // // //   async getPlaceDetails(placeId, extraData = null) {
// // // //     // Fast path: caller already has coordinates (e.g. from a prior lookup)
// // // //     if (extraData?.lat != null && extraData?.lng != null) {
// // // //       return {
// // // //         lat:      extraData.lat,
// // // //         lng:      extraData.lng,
// // // //         address:  extraData.address || extraData.main_text || '',
// // // //         name:     extraData.name    || extraData.main_text || '',
// // // //         place_id: placeId,
// // // //       };
// // // //     }

// // // //     if (!this.apiKey || !placeId) return null;

// // // //     try {
// // // //       const params = new URLSearchParams({
// // // //         place_id: placeId,
// // // //         key:      this.apiKey,
// // // //         language: 'en',
// // // //       });

// // // //       const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// // // //       if (!res.ok) return null;

// // // //       const data = await res.json();
// // // //       if (data.status !== 'OK' || !data.results?.length) {
// // // //         console.warn('[GoogleMapsProvider.getPlaceDetails] geocoding status:', data.status);
// // // //         return null;
// // // //       }

// // // //       const r = data.results[0];
// // // //       return {
// // // //         lat:      r.geometry.location.lat,
// // // //         lng:      r.geometry.location.lng,
// // // //         address:  r.formatted_address,
// // // //         name:     r.address_components?.[0]?.long_name || r.formatted_address?.split(',')[0] || '',
// // // //         place_id: r.place_id || placeId,
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[GoogleMapsProvider.getPlaceDetails] error:', err?.message);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   // ─────────────────────────────────────────────────────────────────────────
// // // //   // STEP 3 — Routes API  (coordinates → distance / ETA / polyline)
// // // //   //
// // // //   // POST https://routes.googleapis.com/directions/v2:computeRoutes
// // // //   // Tier : Essentials $5.00 / 1k
// // // //   //
// // // //   // ⚑ STRICT FIELD MASK — these three fields ONLY.
// // // //   //   Adding ANY of the following silently promotes the SKU to Pro ($10 / 1k):
// // // //   //     routes.travelAdvisory, routes.legs.travelAdvisory,
// // // //   //     routes.optimizedIntermediateWaypointIndex,
// // // //   //     routes.localizedValues, routes.routeToken,
// // // //   //     any traffic-aware polyline field.
// // // //   // ─────────────────────────────────────────────────────────────────────────

// // // //   async getRoute(origin, destination) {
// // // //     if (!this.apiKey || !origin || !destination) return null;

// // // //     try {
// // // //       const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
// // // //         method:  'POST',
// // // //         headers: {
// // // //           'Content-Type':   'application/json',
// // // //           'X-Goog-Api-Key': this.apiKey,
// // // //           // ⚑ Essentials — do NOT extend without checking SKU impact
// // // //           'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
// // // //         },
// // // //         body: JSON.stringify({
// // // //           origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lng      } } },
// // // //           destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
// // // //           travelMode:               'DRIVE',
// // // //           routingPreference:        'TRAFFIC_UNAWARE', // TRAFFIC_AWARE → Pro tier
// // // //           computeAlternativeRoutes: false,
// // // //           languageCode:             'en-US',
// // // //           units:                    'METRIC',
// // // //         }),
// // // //       });

// // // //       if (!res.ok) {
// // // //         const err = await res.json().catch(() => ({}));
// // // //         console.error('[GoogleMapsProvider.getRoute] API error:', res.status, err?.error?.message);
// // // //         return null;
// // // //       }

// // // //       const data  = await res.json();
// // // //       const route = data.routes?.[0];
// // // //       if (!route) return null;

// // // //       const distanceMeters = route.distanceMeters ?? 0;
// // // //       const durationSec    = parseInt(String(route.duration ?? '0s').replace('s', ''), 10);
// // // //       const km             = distanceMeters / 1000;
// // // //       const min            = durationSec / 60;

// // // //       return {
// // // //         type:          'google',
// // // //         distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(distanceMeters)} m`,
// // // //         duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
// // // //         distanceValue: distanceMeters,
// // // //         durationValue: durationSec,
// // // //         geometry:      decodePolyline(route.polyline?.encodedPolyline || ''),
// // // //         steps:         [],
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[GoogleMapsProvider.getRoute] error:', err?.message);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   async calculateDistance(origin, destination) {
// // // //     const route = await this.getRoute(origin, destination);
// // // //     if (!route) return null;
// // // //     return { distance: route.distance, distanceValue: route.distanceValue };
// // // //   }

// // // //   async calculateEta(origin, destination) {
// // // //     const route = await this.getRoute(origin, destination);
// // // //     if (!route) return null;
// // // //     return { duration: route.duration, durationValue: route.durationValue };
// // // //   }

// // // //   // ─────────────────────────────────────────────────────────────────────────
// // // //   // Reverse geocode  (latlng → address)
// // // //   // Tier: Essentials $5.00 / 1k
// // // //   // ─────────────────────────────────────────────────────────────────────────

// // // //   async reverseGeocode(lat, lng) {
// // // //     if (!this.apiKey) return null;
// // // //     try {
// // // //       const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: this.apiKey, language: 'en' });
// // // //       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// // // //       if (!res.ok) return null;

// // // //       const data = await res.json();
// // // //       if (data.status !== 'OK' || !data.results?.length) return null;

// // // //       const result  = data.results[0];
// // // //       const getComp = (types) =>
// // // //         result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null;

// // // //       return {
// // // //         lat, lng,
// // // //         address:       result.formatted_address,
// // // //         name:          getComp(['locality', 'sublocality', 'neighborhood']) || getComp(['administrative_area_level_2']) || 'Unknown',
// // // //         place_id:      result.place_id,
// // // //         city:          getComp(['locality', 'administrative_area_level_2']),
// // // //         country:       getComp(['country']),
// // // //         postalCode:    getComp(['postal_code']),
// // // //         state:         getComp(['administrative_area_level_1']),
// // // //         streetAddress: getComp(['route']),
// // // //         streetNumber:  getComp(['street_number']),
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[GoogleMapsProvider.reverseGeocode] error:', err?.message);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   async geocodeAddress(address) {
// // // //     if (!this.apiKey || !address) return null;
// // // //     try {
// // // //       const params = new URLSearchParams({ address, key: this.apiKey, language: 'en' });
// // // //       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// // // //       if (!res.ok) return null;

// // // //       const data = await res.json();
// // // //       if (data.status !== 'OK' || !data.results?.length) return null;

// // // //       const r = data.results[0];
// // // //       return {
// // // //         lat:      r.geometry.location.lat,
// // // //         lng:      r.geometry.location.lng,
// // // //         address:  r.formatted_address,
// // // //         place_id: r.place_id,
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[GoogleMapsProvider.geocodeAddress] error:', err?.message);
// // // //       return null;
// // // //     }
// // // //   }
// // // // }

// // // // export default GoogleMapsProvider;

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // POLYLINE DECODER
// // // // // Decodes a Google encoded polyline into [[lng, lat], ...] GeoJSON order.
// // // // // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // function decodePolyline(encoded) {
// // // //   if (!encoded) return [];
// // // //   const coords = [];
// // // //   let index = 0, lat = 0, lng = 0;

// // // //   while (index < encoded.length) {
// // // //     let b, shift = 0, result = 0;
// // // //     do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
// // // //     lat += (result & 1) ? ~(result >> 1) : result >> 1;

// // // //     shift = 0; result = 0;
// // // //     do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
// // // //     lng += (result & 1) ? ~(result >> 1) : result >> 1;

// // // //     coords.push([lng / 1e5, lat / 1e5]); // GeoJSON: [longitude, latitude]
// // // //   }
// // // //   return coords;
// // // // }
// // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/GoogleMapsProvider.jsx
// // // //
// // // // Cost-optimized Google Maps implementation.
// // // //
// // // // Three-step flow (all Essentials tier):
// // // //   1. Autocomplete (New)  — per-request, no session token     ~$2.83 / 1k
// // // //   2. Geocoding API       — placeId → lat/lng                  $5.00 / 1k
// // // //   3. Routes API          — coordinates → distance/ETA/polyline $5.00 / 1k
// // // //
// // // // Every public service method accepts an optional `apiMethod` string that
// // // // MapsProvider passes down from the per-provider config stored in Strapi:
// // // //   { routing: 'routeApi', distance: 'routeApi', eta: 'routeApi',
// // // //     autoComplete: 'placesApi', location: 'geocoding' }
// // // //
// // // // The dispatch table at the bottom of each method maps those strings to the
// // // // appropriate internal implementation. If apiMethod is null / unrecognised,
// // // // the method falls back to its default implementation.

// // // export class GoogleMapsProvider {
// // //   constructor(apiKey) {
// // //     this.apiKey  = apiKey;
// // //     this.name    = 'google';
// // //     this._center = null; // set via setCenter() to bias autocomplete results
// // //   }

// // //   // Allow the map display to push the current viewport centre
// // //   setCenter(lat, lng) {
// // //     this._center = { lat, lng };
// // //   }

// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   // SERVICE DISPATCH HELPERS
// // //   //
// // //   // Each public method calls _dispatch*(apiMethod, ...args) which maps the
// // //   // Strapi api-method string to the right internal implementation.
// // //   // Unknown strings fall through to the default (first case).
// // //   // ─────────────────────────────────────────────────────────────────────────

// // //   async _dispatchSearch(apiMethod, query, countryCode) {
// // //     switch (apiMethod) {
// // //       case 'placesApi':
// // //       default:
// // //         return this._searchViaAutoCompleteNew(query, countryCode);
// // //     }
// // //   }

// // //   async _dispatchLocation(apiMethod, ...args) {
// // //     // args[0] = placeId | lat, args[1] = extraData | lng
// // //     switch (apiMethod) {
// // //       case 'geocoding':
// // //       default:
// // //         // Differentiate reverse geocode (two numbers) from place details (string)
// // //         if (typeof args[0] === 'string') return this._placeDetailsViaGeocoding(args[0], args[1]);
// // //         return this._reverseGeocodeViaGeocoding(args[0], args[1]);
// // //     }
// // //   }

// // //   async _dispatchRoute(apiMethod, origin, destination) {
// // //     switch (apiMethod) {
// // //       case 'routeApi':
// // //       default:
// // //         return this._routeViaRoutesApi(origin, destination);
// // //     }
// // //   }

// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   // PUBLIC SERVICE METHODS
// // //   // Called by MapsProvider with (args..., apiMethod) appended.
// // //   // ─────────────────────────────────────────────────────────────────────────

// // //   async searchPlaces(query, countryCode = null, apiMethod = 'placesApi') {
// // //     if (!this.apiKey || !query) return null;
// // //     return this._dispatchSearch(apiMethod, query, countryCode);
// // //   }

// // //   async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoding') {
// // //     // Fast path: caller already has coordinates
// // //     if (extraData?.lat != null && extraData?.lng != null) {
// // //       return {
// // //         lat:      extraData.lat,
// // //         lng:      extraData.lng,
// // //         address:  extraData.address || extraData.main_text || '',
// // //         name:     extraData.name    || extraData.main_text || '',
// // //         place_id: placeId,
// // //       };
// // //     }
// // //     if (!this.apiKey || !placeId) return null;
// // //     return this._dispatchLocation(apiMethod, placeId, extraData);
// // //   }

// // //   async reverseGeocode(lat, lng, apiMethod = 'geocoding') {
// // //     if (!this.apiKey) return null;
// // //     return this._dispatchLocation(apiMethod, lat, lng);
// // //   }

// // //   async getRoute(origin, destination, apiMethod = 'routeApi') {
// // //     if (!this.apiKey || !origin || !destination) return null;
// // //     return this._dispatchRoute(apiMethod, origin, destination);
// // //   }

// // //   async calculateDistance(origin, destination, apiMethod = 'routeApi') {
// // //     const route = await this.getRoute(origin, destination, apiMethod);
// // //     if (!route) return null;
// // //     return { distance: route.distance, distanceValue: route.distanceValue };
// // //   }

// // //   async calculateEta(origin, destination, apiMethod = 'routeApi') {
// // //     const route = await this.getRoute(origin, destination, apiMethod);
// // //     if (!route) return null;
// // //     return { duration: route.duration, durationValue: route.durationValue };
// // //   }

// // //   async geocodeAddress(address, apiMethod = 'geocoding') {
// // //     if (!this.apiKey || !address) return null;
// // //     return this._geocodeAddressViaGeocoding(address);
// // //   }

// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   // IMPLEMENTATION: Autocomplete (New)
// // //   //
// // //   // POST https://places.googleapis.com/v1/places:autocomplete
// // //   // Tier : Essentials ~$2.83 / 1k  (per-request — NO session token)
// // //   //
// // //   // Field mask includes structuredFormat for a clean main / secondary split.
// // //   // ─────────────────────────────────────────────────────────────────────────

// // //   async _searchViaAutoCompleteNew(query, countryCode) {
// // //     try {
// // //       const body = { input: query, languageCode: 'en' };
// // //       if (countryCode) body.includedRegionCodes = [countryCode.toUpperCase()];

// // //       if (this._center) {
// // //         body.locationBias = {
// // //           circle: {
// // //             center: { latitude: this._center.lat, longitude: this._center.lng },
// // //             radiusMeters: 50_000,
// // //           },
// // //         };
// // //       }

// // //       const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
// // //         method:  'POST',
// // //         headers: {
// // //           'Content-Type':    'application/json',
// // //           'X-Goog-Api-Key':  this.apiKey,
// // //           // ⚑ FIELD MASK — structuredFormat gives a clean main/secondary split.
// // //           //   Do NOT add further fields without checking pricing tier impact.
// // //           'X-Goog-FieldMask': [
// // //             'suggestions.placePrediction.placeId',
// // //             'suggestions.placePrediction.text',
// // //             'suggestions.placePrediction.structuredFormat',
// // //           ].join(','),
// // //         },
// // //         body: JSON.stringify(body),
// // //       });

// // //       if (!res.ok) {
// // //         const err = await res.json().catch(() => ({}));
// // //         console.error('[GoogleMapsProvider.searchPlaces] API error:', res.status, err?.error?.message);
// // //         return null;
// // //       }

// // //       const data        = await res.json();
// // //       const suggestions = data.suggestions ?? [];
// // //       if (!suggestions.length) return null;

// // //       return suggestions
// // //         .filter((s) => s.placePrediction)
// // //         .map((s) => {
// // //           const pred = s.placePrediction;

// // //           // Prefer structuredFormat — the API-computed split.
// // //           // Comma-split on text is a fallback only.
// // //           const main_text =
// // //             pred.structuredFormat?.mainText?.text ||
// // //             pred.text?.text?.split(',')[0]?.trim() || '';

// // //           const secondary_text =
// // //             pred.structuredFormat?.secondaryText?.text ||
// // //             pred.text?.text?.split(',').slice(1).join(',').trim() || '';

// // //           return {
// // //             place_id:       pred.placeId,
// // //             main_text,
// // //             secondary_text,
// // //             address:        pred.text?.text || `${main_text}, ${secondary_text}`,
// // //             name:           main_text,
// // //           };
// // //         });
// // //     } catch (err) {
// // //       console.error('[GoogleMapsProvider._searchViaAutoCompleteNew] error:', err?.message);
// // //       return null;
// // //     }
// // //   }

// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   // IMPLEMENTATION: Geocoding API — place ID → lat/lng
// // //   //
// // //   // GET https://maps.googleapis.com/maps/api/geocode/json?place_id=…
// // //   // Tier : Essentials $5.00 / 1k
// // //   //
// // //   // Replaces Place Details API ($17 / 1k).
// // //   // ─────────────────────────────────────────────────────────────────────────

// // //   async _placeDetailsViaGeocoding(placeId, _extraData) {
// // //     try {
// // //       const params = new URLSearchParams({ place_id: placeId, key: this.apiKey, language: 'en' });
// // //       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// // //       if (!res.ok) return null;

// // //       const data = await res.json();
// // //       if (data.status !== 'OK' || !data.results?.length) {
// // //         console.warn('[GoogleMapsProvider.getPlaceDetails] geocoding status:', data.status);
// // //         return null;
// // //       }

// // //       const r = data.results[0];
// // //       return {
// // //         lat:      r.geometry.location.lat,
// // //         lng:      r.geometry.location.lng,
// // //         address:  r.formatted_address,
// // //         name:     r.address_components?.[0]?.long_name || r.formatted_address?.split(',')[0] || '',
// // //         place_id: r.place_id || placeId,
// // //       };
// // //     } catch (err) {
// // //       console.error('[GoogleMapsProvider._placeDetailsViaGeocoding] error:', err?.message);
// // //       return null;
// // //     }
// // //   }

// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   // IMPLEMENTATION: Geocoding API — latlng → address
// // //   // Tier : Essentials $5.00 / 1k
// // //   // ─────────────────────────────────────────────────────────────────────────

// // //   async _reverseGeocodeViaGeocoding(lat, lng) {
// // //     try {
// // //       const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: this.apiKey, language: 'en' });
// // //       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// // //       if (!res.ok) return null;

// // //       const data = await res.json();
// // //       if (data.status !== 'OK' || !data.results?.length) return null;

// // //       const result  = data.results[0];
// // //       const getComp = (types) =>
// // //         result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null;

// // //       return {
// // //         lat, lng,
// // //         address:       result.formatted_address,
// // //         name:          getComp(['locality', 'sublocality', 'neighborhood']) || getComp(['administrative_area_level_2']) || 'Unknown',
// // //         place_id:      result.place_id,
// // //         city:          getComp(['locality', 'administrative_area_level_2']),
// // //         country:       getComp(['country']),
// // //         postalCode:    getComp(['postal_code']),
// // //         state:         getComp(['administrative_area_level_1']),
// // //         streetAddress: getComp(['route']),
// // //         streetNumber:  getComp(['street_number']),
// // //       };
// // //     } catch (err) {
// // //       console.error('[GoogleMapsProvider._reverseGeocodeViaGeocoding] error:', err?.message);
// // //       return null;
// // //     }
// // //   }

// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   // IMPLEMENTATION: Geocoding API — address string → latlng
// // //   // Tier : Essentials $5.00 / 1k
// // //   // ─────────────────────────────────────────────────────────────────────────

// // //   async _geocodeAddressViaGeocoding(address) {
// // //     try {
// // //       const params = new URLSearchParams({ address, key: this.apiKey, language: 'en' });
// // //       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// // //       if (!res.ok) return null;

// // //       const data = await res.json();
// // //       if (data.status !== 'OK' || !data.results?.length) return null;

// // //       const r = data.results[0];
// // //       return {
// // //         lat:      r.geometry.location.lat,
// // //         lng:      r.geometry.location.lng,
// // //         address:  r.formatted_address,
// // //         place_id: r.place_id,
// // //       };
// // //     } catch (err) {
// // //       console.error('[GoogleMapsProvider._geocodeAddressViaGeocoding] error:', err?.message);
// // //       return null;
// // //     }
// // //   }

// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   // IMPLEMENTATION: Routes API — coordinates → distance / ETA / polyline
// // //   //
// // //   // POST https://routes.googleapis.com/directions/v2:computeRoutes
// // //   // Tier : Essentials $5.00 / 1k
// // //   //
// // //   // ⚑ STRICT FIELD MASK — these three fields ONLY.
// // //   //   Adding ANY of the following silently promotes the SKU to Pro ($10 / 1k):
// // //   //     routes.travelAdvisory, routes.legs.travelAdvisory,
// // //   //     routes.optimizedIntermediateWaypointIndex,
// // //   //     routes.localizedValues, routes.routeToken,
// // //   //     any traffic-aware polyline field.
// // //   // ─────────────────────────────────────────────────────────────────────────

// // //   async _routeViaRoutesApi(origin, destination) {
// // //     try {
// // //       const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
// // //         method:  'POST',
// // //         headers: {
// // //           'Content-Type':   'application/json',
// // //           'X-Goog-Api-Key': this.apiKey,
// // //           // ⚑ Essentials — do NOT extend without checking SKU impact
// // //           'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
// // //         },
// // //         body: JSON.stringify({
// // //           origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lng      } } },
// // //           destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
// // //           travelMode:               'DRIVE',
// // //           routingPreference:        'TRAFFIC_UNAWARE', // TRAFFIC_AWARE → Pro tier
// // //           computeAlternativeRoutes: false,
// // //           languageCode:             'en-US',
// // //           units:                    'METRIC',
// // //         }),
// // //       });

// // //       if (!res.ok) {
// // //         const err = await res.json().catch(() => ({}));
// // //         console.error('[GoogleMapsProvider._routeViaRoutesApi] API error:', res.status, err?.error?.message);
// // //         return null;
// // //       }

// // //       const data  = await res.json();
// // //       const route = data.routes?.[0];
// // //       if (!route) return null;

// // //       const distanceMeters = route.distanceMeters ?? 0;
// // //       const durationSec    = parseInt(String(route.duration ?? '0s').replace('s', ''), 10);
// // //       const km             = distanceMeters / 1000;
// // //       const min            = durationSec / 60;

// // //       return {
// // //         type:          'google',
// // //         distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(distanceMeters)} m`,
// // //         duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
// // //         distanceValue: distanceMeters,
// // //         durationValue: durationSec,
// // //         geometry:      decodePolyline(route.polyline?.encodedPolyline || ''),
// // //         steps:         [],
// // //       };
// // //     } catch (err) {
// // //       console.error('[GoogleMapsProvider._routeViaRoutesApi] error:', err?.message);
// // //       return null;
// // //     }
// // //   }
// // // }

// // // export default GoogleMapsProvider;

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // // POLYLINE DECODER
// // // // Decodes a Google encoded polyline into [[lng, lat], ...] GeoJSON order.
// // // // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
// // // // ─────────────────────────────────────────────────────────────────────────────

// // // function decodePolyline(encoded) {
// // //   if (!encoded) return [];
// // //   const coords = [];
// // //   let index = 0, lat = 0, lng = 0;

// // //   while (index < encoded.length) {
// // //     let b, shift = 0, result = 0;
// // //     do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
// // //     lat += (result & 1) ? ~(result >> 1) : result >> 1;

// // //     shift = 0; result = 0;
// // //     do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
// // //     lng += (result & 1) ? ~(result >> 1) : result >> 1;

// // //     coords.push([lng / 1e5, lat / 1e5]); // GeoJSON: [longitude, latitude]
// // //   }
// // //   return coords;
// // // }
// // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/GoogleMapsProvider.jsx
// // //
// // // Cost-optimized Google Maps — all Essentials tier:
// // //   searchPlaces   → Autocomplete (New)  ~$2.83 / 1k
// // //   getPlaceDetails → Geocoding API       $5.00 / 1k
// // //   reverseGeocode  → Geocoding API       $5.00 / 1k
// // //   getRoute        → Routes API          $5.00 / 1k
// // //
// // // Every public method accepts apiMethod (string) forwarded from MapsProvider.
// // // The _dispatch* helpers map those strings to the right implementation.
// // // Adding a new implementation = new case in the relevant switch.

// // export class GoogleMapsProvider {
// //   constructor(apiKey) {
// //     this.apiKey  = apiKey;
// //     this.name    = 'google';
// //     this._center = null;
// //   }

// //   setCenter(lat, lng) { this._center = { lat, lng }; }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // DISPATCH LAYER
// //   // ─────────────────────────────────────────────────────────────────────────

// //   _dispatchSearch(apiMethod, query, countryCode) {
// //     switch (apiMethod) {
// //       case 'placesApi':
// //       default:
// //         return this._autoCompleteNew(query, countryCode);
// //     }
// //   }

// //   _dispatchLocation(apiMethod, ...args) {
// //     switch (apiMethod) {
// //       case 'geocoding':
// //       default:
// //         return typeof args[0] === 'string'
// //           ? this._placeIdToLatLng(args[0], args[1])
// //           : this._reverseGeocode(args[0], args[1]);
// //     }
// //   }

// //   _dispatchRoute(apiMethod, origin, destination) {
// //     switch (apiMethod) {
// //       case 'routeApi':
// //       default:
// //         return this._routesApi(origin, destination);
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // PUBLIC SERVICE METHODS  (all accept optional apiMethod)
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async searchPlaces(query, countryCode = null, apiMethod = 'placesApi') {
// //     if (!this.apiKey || !query) return null;
// //     return this._dispatchSearch(apiMethod, query, countryCode);
// //   }

// //   async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoding') {
// //     if (extraData?.lat != null && extraData?.lng != null) {
// //       return {
// //         lat: extraData.lat, lng: extraData.lng,
// //         address:  extraData.address  || extraData.main_text || '',
// //         name:     extraData.name     || extraData.main_text || '',
// //         place_id: placeId,
// //       };
// //     }
// //     if (!this.apiKey || !placeId) return null;
// //     return this._dispatchLocation(apiMethod, placeId, extraData);
// //   }

// //   async reverseGeocode(lat, lng, apiMethod = 'geocoding') {
// //     if (!this.apiKey) return null;
// //     return this._dispatchLocation(apiMethod, lat, lng);
// //   }

// //   async getRoute(origin, destination, apiMethod = 'routeApi') {
// //     if (!this.apiKey || !origin || !destination) return null;
// //     return this._dispatchRoute(apiMethod, origin, destination);
// //   }

// //   async calculateDistance(origin, destination, apiMethod = 'routeApi') {
// //     const r = await this.getRoute(origin, destination, apiMethod);
// //     return r ? { distance: r.distance, distanceValue: r.distanceValue } : null;
// //   }

// //   async calculateEta(origin, destination, apiMethod = 'routeApi') {
// //     const r = await this.getRoute(origin, destination, apiMethod);
// //     return r ? { duration: r.duration, durationValue: r.durationValue } : null;
// //   }

// //   async geocodeAddress(address, apiMethod = 'geocoding') {
// //     if (!this.apiKey || !address) return null;
// //     return this._forwardGeocode(address);
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Autocomplete (New)
// //   //
// //   // POST https://places.googleapis.com/v1/places:autocomplete
// //   // Tier : Essentials ~$2.83 / 1k  (no session token)
// //   //
// //   // structuredFormat gives a clean main/secondary split without comma-hacking.
// //   // ⚑ Do NOT add fields beyond these three — extra fields can bump the tier.
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _autoCompleteNew(query, countryCode) {
// //     try {
// //       const body = { input: query, languageCode: 'en' };
// //       if (countryCode) body.includedRegionCodes = [countryCode.toUpperCase()];
// //       if (this._center) {
// //         body.locationBias = {
// //           circle: {
// //             center: { latitude: this._center.lat, longitude: this._center.lng },
// //             radiusMeters: 50_000,
// //           },
// //         };
// //       }

// //       const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type':    'application/json',
// //           'X-Goog-Api-Key':  this.apiKey,
// //           // ⚑ FIELD MASK — Essentials. Do NOT extend without checking tier impact.
// //           'X-Goog-FieldMask': [
// //             'suggestions.placePrediction.placeId',
// //             'suggestions.placePrediction.text',
// //             'suggestions.placePrediction.structuredFormat',
// //           ].join(','),
// //         },
// //         body: JSON.stringify(body),
// //       });

// //       if (!res.ok) {
// //         const err = await res.json().catch(() => ({}));
// //         console.error('[GoogleMapsProvider._autoCompleteNew] error:', res.status, err?.error?.message);
// //         return null;
// //       }

// //       const data        = await res.json();
// //       const suggestions = data.suggestions ?? [];
// //       if (!suggestions.length) return null;

// //       return suggestions
// //         .filter((s) => s.placePrediction)
// //         .map((s) => {
// //           const pred = s.placePrediction;
// //           const main_text =
// //             pred.structuredFormat?.mainText?.text ||
// //             pred.text?.text?.split(',')[0]?.trim() || '';
// //           const secondary_text =
// //             pred.structuredFormat?.secondaryText?.text ||
// //             pred.text?.text?.split(',').slice(1).join(',').trim() || '';
// //           return {
// //             place_id: pred.placeId,
// //             main_text,
// //             secondary_text,
// //             address:  pred.text?.text || `${main_text}, ${secondary_text}`,
// //             name:     main_text,
// //           };
// //         });
// //     } catch (err) {
// //       console.error('[GoogleMapsProvider._autoCompleteNew] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Geocoding — place ID → lat/lng
// //   //
// //   // GET https://maps.googleapis.com/maps/api/geocode/json?place_id=…
// //   // Tier : Essentials $5.00 / 1k  (replaces Place Details $17 / 1k)
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _placeIdToLatLng(placeId) {
// //     try {
// //       const params = new URLSearchParams({ place_id: placeId, key: this.apiKey, language: 'en' });
// //       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// //       if (!res.ok) return null;
// //       const data = await res.json();
// //       if (data.status !== 'OK' || !data.results?.length) return null;
// //       const r = data.results[0];
// //       return {
// //         lat:      r.geometry.location.lat,
// //         lng:      r.geometry.location.lng,
// //         address:  r.formatted_address,
// //         name:     r.address_components?.[0]?.long_name || r.formatted_address?.split(',')[0] || '',
// //         place_id: r.place_id || placeId,
// //       };
// //     } catch (err) {
// //       console.error('[GoogleMapsProvider._placeIdToLatLng] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Geocoding — latlng → address
// //   // Tier : Essentials $5.00 / 1k
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _reverseGeocode(lat, lng) {
// //     try {
// //       const params = new URLSearchParams({ latlng: `${lat},${lng}`, key: this.apiKey, language: 'en' });
// //       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// //       if (!res.ok) return null;
// //       const data = await res.json();
// //       if (data.status !== 'OK' || !data.results?.length) return null;
// //       const result  = data.results[0];
// //       const getComp = (types) =>
// //         result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null;
// //       return {
// //         lat, lng,
// //         address:       result.formatted_address,
// //         name:          getComp(['locality', 'sublocality', 'neighborhood']) || getComp(['administrative_area_level_2']) || 'Unknown',
// //         place_id:      result.place_id,
// //         city:          getComp(['locality', 'administrative_area_level_2']),
// //         country:       getComp(['country']),
// //         postalCode:    getComp(['postal_code']),
// //         state:         getComp(['administrative_area_level_1']),
// //         streetAddress: getComp(['route']),
// //         streetNumber:  getComp(['street_number']),
// //       };
// //     } catch (err) {
// //       console.error('[GoogleMapsProvider._reverseGeocode] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Geocoding — address string → lat/lng
// //   // Tier : Essentials $5.00 / 1k
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _forwardGeocode(address) {
// //     try {
// //       const params = new URLSearchParams({ address, key: this.apiKey, language: 'en' });
// //       const res    = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
// //       if (!res.ok) return null;
// //       const data = await res.json();
// //       if (data.status !== 'OK' || !data.results?.length) return null;
// //       const r = data.results[0];
// //       return {
// //         lat: r.geometry.location.lat, lng: r.geometry.location.lng,
// //         address: r.formatted_address, place_id: r.place_id,
// //       };
// //     } catch (err) {
// //       console.error('[GoogleMapsProvider._forwardGeocode] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Routes API — coordinates → distance / ETA / polyline
// //   //
// //   // POST https://routes.googleapis.com/directions/v2:computeRoutes
// //   // Tier : Essentials $5.00 / 1k
// //   //
// //   // ⚑ STRICT FIELD MASK — these three fields ONLY.
// //   //   Any addition can silently promote to Pro ($10 / 1k):
// //   //     routes.travelAdvisory, routes.legs.travelAdvisory,
// //   //     routes.optimizedIntermediateWaypointIndex,
// //   //     routes.localizedValues, routes.routeToken,
// //   //     any traffic-aware polyline field.
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _routesApi(origin, destination) {
// //     try {
// //       const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type':   'application/json',
// //           'X-Goog-Api-Key': this.apiKey,
// //           // ⚑ Essentials — do NOT extend without checking tier impact
// //           'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
// //         },
// //         body: JSON.stringify({
// //           origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lng      } } },
// //           destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
// //           travelMode:               'DRIVE',
// //           routingPreference:        'TRAFFIC_UNAWARE', // TRAFFIC_AWARE → Pro tier
// //           computeAlternativeRoutes: false,
// //           languageCode:             'en-US',
// //           units:                    'METRIC',
// //         }),
// //       });

// //       if (!res.ok) {
// //         const err = await res.json().catch(() => ({}));
// //         console.error('[GoogleMapsProvider._routesApi] error:', res.status, err?.error?.message);
// //         return null;
// //       }

// //       const data  = await res.json();
// //       const route = data.routes?.[0];
// //       if (!route) return null;

// //       const distanceMeters = route.distanceMeters ?? 0;
// //       const durationSec    = parseInt(String(route.duration ?? '0s').replace('s', ''), 10);
// //       const km  = distanceMeters / 1000;
// //       const min = durationSec / 60;

// //       return {
// //         type:          'google',
// //         distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(distanceMeters)} m`,
// //         duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
// //         distanceValue: distanceMeters,
// //         durationValue: durationSec,
// //         geometry:      decodePolyline(route.polyline?.encodedPolyline || ''),
// //         steps:         [],
// //       };
// //     } catch (err) {
// //       console.error('[GoogleMapsProvider._routesApi] error:', err?.message);
// //       return null;
// //     }
// //   }
// // }

// // export default GoogleMapsProvider;

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Decode Google encoded polyline → [[lng, lat], ...] GeoJSON order
// // // ─────────────────────────────────────────────────────────────────────────────
// // function decodePolyline(encoded) {
// //   if (!encoded) return [];
// //   const coords = [];
// //   let index = 0, lat = 0, lng = 0;
// //   while (index < encoded.length) {
// //     let b, shift = 0, result = 0;
// //     do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
// //     lat += (result & 1) ? ~(result >> 1) : result >> 1;
// //     shift = 0; result = 0;
// //     do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
// //     lng += (result & 1) ? ~(result >> 1) : result >> 1;
// //     coords.push([lng / 1e5, lat / 1e5]);
// //   }
// //   return coords;
// // }
// // PATH: Okra/Okrarides/rider/components/Map/APIProviders/GoogleMapsProvider.jsx
// //
// // Cost-optimized Google Maps — all Essentials tier:
// //   searchPlaces    → Autocomplete (New)  ~$2.83 / 1k
// //   getPlaceDetails → Geocoding API        $5.00 / 1k
// //   reverseGeocode  → Geocoding API        $5.00 / 1k
// //   getRoute        → Routes API           $5.00 / 1k

// export class GoogleMapsProvider {
//   constructor(apiKey) {
//     this.apiKey = apiKey;
//     this.name   = 'google';

//     // Viewport state — call setViewport() from the map display component
//     // so autocomplete is biased toward what the user is actually looking at.
//     // Defaults to Lusaka, Zambia (app default location).
//     this._center = { lat: -15.4167, lng: 28.2833 };
//     this._viewportRadiusMeters = 50_000; // ~50 km; tightened by setViewport()
//     this._regionCode = null; // e.g. 'ZM' — set via setRegion()
//   }

//   // ── Called by the map display to keep autocomplete geographically relevant ──
//   //
//   // lat/lng  : centre of the current map viewport
//   // radiusM  : approximate radius of the visible area in metres
//   //            (use map bounds diagonal / 2 if you can compute it)
//   // regionCode: ISO 3166-1 alpha-2 country code for the ccTLD bias ('ZM', 'US' …)
//   setViewport(lat, lng, radiusM = 50_000, regionCode = null) {
//     this._center               = { lat, lng };
//     this._viewportRadiusMeters = Math.min(Math.max(radiusM, 1000), 50_000); // clamp 1–50 km
//     if (regionCode) this._regionCode = regionCode.toUpperCase();
//   }

//   // Backwards-compatible alias used by AppleMapsProvider pattern
//   setCenter(lat, lng) { this.setViewport(lat, lng, this._viewportRadiusMeters, this._regionCode); }
//   setRegion(code)     { this._regionCode = code ? code.toUpperCase() : null; }

//   // ─────────────────────────────────────────────────────────────────────────
//   // DISPATCH LAYER
//   // ─────────────────────────────────────────────────────────────────────────

//   _dispatchSearch(apiMethod, query, countryCode) {
//     switch (apiMethod) {
//       case 'placesApi':
//       default:
//         return this._autoCompleteNew(query, countryCode);
//     }
//   }

//   _dispatchLocation(apiMethod, ...args) {
//     switch (apiMethod) {
//       case 'geocoding':
//       default:
//         return typeof args[0] === 'string'
//           ? this._placeIdToLatLng(args[0], args[1])
//           : this._reverseGeocode(args[0], args[1]);
//     }
//   }

//   _dispatchRoute(apiMethod, origin, destination) {
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
//     if (!this.apiKey || !query) return null;
//     return this._dispatchSearch(apiMethod, query, countryCode);
//   }

//   async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoding') {
//     if (extraData?.lat != null && extraData?.lng != null) {
//       return {
//         lat: extraData.lat, lng: extraData.lng,
//         address:  extraData.address  || extraData.main_text || '',
//         name:     extraData.name     || extraData.main_text || '',
//         place_id: placeId,
//       };
//     }
//     if (!this.apiKey || !placeId) return null;
//     return this._dispatchLocation(apiMethod, placeId, extraData);
//   }

//   async reverseGeocode(lat, lng, apiMethod = 'geocoding') {
//     if (!this.apiKey) return null;
//     return this._dispatchLocation(apiMethod, lat, lng);
//   }

//   async getRoute(origin, destination, apiMethod = 'routeApi') {
//     if (!this.apiKey || !origin || !destination) return null;
//     return this._dispatchRoute(apiMethod, origin, destination);
//   }

//   async calculateDistance(origin, destination, apiMethod = 'routeApi') {
//     const r = await this.getRoute(origin, destination, apiMethod);
//     return r ? { distance: r.distance, distanceValue: r.distanceValue } : null;
//   }

//   async calculateEta(origin, destination, apiMethod = 'routeApi') {
//     const r = await this.getRoute(origin, destination, apiMethod);
//     return r ? { duration: r.duration, durationValue: r.durationValue } : null;
//   }

//   async geocodeAddress(address, _apiMethod = 'geocoding') {
//     if (!this.apiKey || !address) return null;
//     return this._forwardGeocode(address);
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Autocomplete (New)
//   //
//   // POST https://places.googleapis.com/v1/places:autocomplete
//   // Tier : Essentials ~$2.83 / 1k  (per-request, no session token)
//   //
//   // Key parameters per the API docs:
//   //
//   //  locationBias   — biases results toward the current map viewport.
//   //                   Always set — without it the API ignores geography entirely.
//   //                   Use circle centred on the map viewport.
//   //
//   //  regionCode     — ccTLD code ('ZM', 'US' etc).  The docs call this the
//   //                   PRIMARY bias parameter for regional preference.
//   //                   Set from the app's country / user profile.
//   //
//   //  includedRegionCodes — hard-restricts to listed countries.
//   //                        Only set when countryCode is explicitly passed
//   //                        (e.g. from the ride booking form's country filter).
//   //
//   //  languageCode   — 'en' by default; results language.
//   //
//   //  origin         — centre of the viewport.  Makes the API return
//   //                   distanceMeters in each suggestion, which lets us
//   //                   rank nearby results higher if needed.
//   //
//   // Field mask:
//   //  placeId            — required for step 2 (geocoding)
//   //  text               — full address string (fallback display)
//   //  structuredFormat   — clean main / secondary text split from the API
//   //                       (avoids fragile comma-splitting on our side)
//   //
//   // ⚑ Do NOT add fields beyond these without checking the pricing tier.
//   // ─────────────────────────────────────────────────────────────────────────

//   async _autoCompleteNew(query, countryCode) {
//     try {
//       const { lat, lng } = this._center;

//       const body = {
//         input:        query,
//         languageCode: 'en',

//         // ── Geographic bias: map viewport ────────────────────────────────
//         // Per docs: "use the viewport of the map the user is looking at".
//         // locationBias allows results outside the circle; this is correct
//         // because we want nearby suggestions, not hard-restricted ones.
//         locationBias: {
//           circle: {
//             center:       { latitude: lat, longitude: lng },
//             radiusMeters: this._viewportRadiusMeters,
//           },
//         },

//         // ── Origin: for distanceMeters in response ───────────────────────
//         // Enables the API to return straight-line distance per suggestion.
//         origin: { latitude: lat, longitude: lng },
//       };

//       // ── regionCode: primary regional preference bias ───────────────────
//       // Per docs: "Set according to user's regional preference."
//       // Use the app country code or the countryCode prop when available.
//       const effectiveRegion = this._regionCode || (countryCode ? countryCode.toUpperCase() : null);
//       if (effectiveRegion) {
//         // regionCode biases formatting and ranking toward the region
//         body.regionCode = effectiveRegion.toLowerCase(); // API expects lowercase ccTLD
//       }

//       // ── includedRegionCodes: hard country restriction ──────────────────
//       // Only applied when caller explicitly passes a countryCode filter
//       // (e.g. "search within Zambia only").  Different from regionCode.
//       if (countryCode) {
//         body.includedRegionCodes = [countryCode.toUpperCase()];
//       }

//       const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
//         method: 'POST',
//         headers: {
//           'Content-Type':    'application/json',
//           'X-Goog-Api-Key':  this.apiKey,
//           // ⚑ FIELD MASK — Essentials tier.
//           //   structuredFormat: clean main/secondary split the API computes
//           //   text:             full address string (fallback + display)
//           //   placeId:          required for geocoding step
//           'X-Goog-FieldMask': [
//             'suggestions.placePrediction.placeId',
//             'suggestions.placePrediction.text',
//             'suggestions.placePrediction.structuredFormat',
//           ].join(','),
//         },
//         body: JSON.stringify(body),
//       });

//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         console.error('[GoogleMapsProvider._autoCompleteNew] API error:', res.status, err?.error?.message);
//         return null;
//       }

//       const data        = await res.json();
//       const suggestions = data.suggestions ?? [];
//       if (!suggestions.length) return null;

//       return suggestions
//         .filter((s) => s.placePrediction)
//         .map((s) => {
//           const pred = s.placePrediction;

//           // structuredFormat is the authoritative split from the API.
//           // text.text is the full string fallback.
//           const main_text =
//             pred.structuredFormat?.mainText?.text ||
//             pred.text?.text?.split(',')[0]?.trim() || '';

//           const secondary_text =
//             pred.structuredFormat?.secondaryText?.text ||
//             pred.text?.text?.split(',').slice(1).join(',').trim() || '';

//           return {
//             place_id:       pred.placeId,
//             main_text,
//             secondary_text,
//             address:        pred.text?.text || `${main_text}, ${secondary_text}`,
//             name:           main_text,
//             // distanceMeters available when origin was sent — useful for ranking
//             distanceMeters: pred.distanceMeters ?? null,
//           };
//         })
//         // Sort by distance when available — mirrors how Google Maps itself ranks
//         .sort((a, b) => {
//           if (a.distanceMeters == null && b.distanceMeters == null) return 0;
//           if (a.distanceMeters == null) return 1;
//           if (b.distanceMeters == null) return -1;
//           return a.distanceMeters - b.distanceMeters;
//         });

//     } catch (err) {
//       console.error('[GoogleMapsProvider._autoCompleteNew] error:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Geocoding API — place ID → lat/lng + address
//   //
//   // GET https://maps.googleapis.com/maps/api/geocode/json?place_id=…
//   // Tier : Essentials $5.00 / 1k  (replaces Place Details $17 / 1k)
//   // ─────────────────────────────────────────────────────────────────────────

//   async _placeIdToLatLng(placeId) {
//     try {
//       const params = new URLSearchParams({
//         place_id: placeId,
//         key:      this.apiKey,
//         language: 'en',
//       });
//       const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
//       if (!res.ok) return null;

//       const data = await res.json();
//       if (data.status !== 'OK' || !data.results?.length) {
//         console.warn('[GoogleMapsProvider._placeIdToLatLng] status:', data.status);
//         return null;
//       }
//       const r = data.results[0];
//       return {
//         lat:      r.geometry.location.lat,
//         lng:      r.geometry.location.lng,
//         address:  r.formatted_address,
//         name:     r.address_components?.[0]?.long_name || r.formatted_address?.split(',')[0] || '',
//         place_id: r.place_id || placeId,
//       };
//     } catch (err) {
//       console.error('[GoogleMapsProvider._placeIdToLatLng] error:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Geocoding API — latlng → address
//   // Tier : Essentials $5.00 / 1k
//   // ─────────────────────────────────────────────────────────────────────────

//   async _reverseGeocode(lat, lng) {
//     try {
//       const params = new URLSearchParams({
//         latlng:   `${lat},${lng}`,
//         key:      this.apiKey,
//         language: 'en',
//       });
//       const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
//       if (!res.ok) return null;

//       const data = await res.json();
//       if (data.status !== 'OK' || !data.results?.length) return null;

//       const result  = data.results[0];
//       const getComp = (types) =>
//         result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? null;

//       return {
//         lat, lng,
//         address:       result.formatted_address,
//         name:          getComp(['locality', 'sublocality', 'neighborhood']) || getComp(['administrative_area_level_2']) || 'Unknown',
//         place_id:      result.place_id,
//         city:          getComp(['locality', 'administrative_area_level_2']),
//         country:       getComp(['country']),
//         postalCode:    getComp(['postal_code']),
//         state:         getComp(['administrative_area_level_1']),
//         streetAddress: getComp(['route']),
//         streetNumber:  getComp(['street_number']),
//       };
//     } catch (err) {
//       console.error('[GoogleMapsProvider._reverseGeocode] error:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Geocoding API — address string → lat/lng
//   // Tier : Essentials $5.00 / 1k
//   // ─────────────────────────────────────────────────────────────────────────

//   async _forwardGeocode(address) {
//     try {
//       const params = new URLSearchParams({
//         address,
//         key:      this.apiKey,
//         language: 'en',
//         ...(this._regionCode ? { region: this._regionCode.toLowerCase() } : {}),
//       });
//       const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
//       if (!res.ok) return null;

//       const data = await res.json();
//       if (data.status !== 'OK' || !data.results?.length) return null;

//       const r = data.results[0];
//       return {
//         lat:      r.geometry.location.lat,
//         lng:      r.geometry.location.lng,
//         address:  r.formatted_address,
//         place_id: r.place_id,
//       };
//     } catch (err) {
//       console.error('[GoogleMapsProvider._forwardGeocode] error:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Routes API — coordinates → distance / ETA / polyline
//   //
//   // POST https://routes.googleapis.com/directions/v2:computeRoutes
//   // Tier : Essentials $5.00 / 1k
//   //
//   // ⚑ STRICT FIELD MASK.  Adding ANY of these promotes to Pro ($10 / 1k):
//   //   routes.travelAdvisory, routes.legs.travelAdvisory,
//   //   routes.optimizedIntermediateWaypointIndex,
//   //   routes.localizedValues, routes.routeToken,
//   //   any traffic-aware polyline field.
//   // ─────────────────────────────────────────────────────────────────────────

//   async _routesApi(origin, destination) {
//     try {
//       const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
//         method: 'POST',
//         headers: {
//           'Content-Type':   'application/json',
//           'X-Goog-Api-Key': this.apiKey,
//           // ⚑ Essentials — do NOT extend without checking tier impact
//           'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
//         },
//         body: JSON.stringify({
//           origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lng      } } },
//           destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
//           travelMode:               'DRIVE',
//           routingPreference:        'TRAFFIC_UNAWARE', // TRAFFIC_AWARE → Pro tier
//           computeAlternativeRoutes: false,
//           languageCode:             'en-US',
//           units:                    'METRIC',
//         }),
//       });

//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         console.error('[GoogleMapsProvider._routesApi] error:', res.status, err?.error?.message);
//         return null;
//       }

//       const data  = await res.json();
//       const route = data.routes?.[0];
//       if (!route) return null;

//       const distanceMeters = route.distanceMeters ?? 0;
//       const durationSec    = parseInt(String(route.duration ?? '0s').replace('s', ''), 10);
//       const km             = distanceMeters / 1000;
//       const min            = durationSec / 60;

//       return {
//         type:          'google',
//         distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(distanceMeters)} m`,
//         duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
//         distanceValue: distanceMeters,
//         durationValue: durationSec,
//         geometry:      decodePolyline(route.polyline?.encodedPolyline || ''),
//         steps:         [],
//       };
//     } catch (err) {
//       console.error('[GoogleMapsProvider._routesApi] error:', err?.message);
//       return null;
//     }
//   }
// }

// export default GoogleMapsProvider;

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