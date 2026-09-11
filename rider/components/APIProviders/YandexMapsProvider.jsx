// // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.js

// // export class YandexMapsProvider {
// //   /**
// //    * @param {string} geocoderKey    – NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY
// //    * @param {string} geoSuggestApiKey – NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY
// //    */
// //   constructor(geocoderKey, geoSuggestApiKey) {
// //     this.geocoderKey      = geocoderKey;
// //     this.geoSuggestApiKey = geoSuggestApiKey;
// //     this.name             = 'yandex';
// //     this._center          = { lat: -15.4167, lng: 28.2833 };

// //     console.log(
// //       '[YandexMapsProvider] geocoderKey present:',    !!geocoderKey,
// //       '| geoSuggestApiKey present:', !!geoSuggestApiKey,
// //     );
// //     if (!geoSuggestApiKey) {
// //       console.warn(
// //         '[YandexMapsProvider] ⚠️  NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is not set — ' +
// //         'GeoSuggestAPI calls will be skipped.',
// //       );
// //     }
// //     if (!geocoderKey) {
// //       console.warn(
// //         '[YandexMapsProvider] ⚠️  NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY is not set — ' +
// //         'Geocoder / Router calls will fail.',
// //       );
// //     }
// //   }

// //   setCenter(lat, lng) { this._center = { lat, lng }; }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // STORAGE HELPERS
// //   // Read the geo data saved by GoogleMapsIpLocation component.
// //   // ─────────────────────────────────────────────────────────────────────────

// //   static _readGeoLoc() {
// //     if (typeof window === 'undefined') return {};
// //     try {
// //       const status = localStorage.getItem('geo_loc_status');
// //       if (status !== 'success') return {};
// //       return {
// //         countryName:   localStorage.getItem('geo_loc_country_name')   || null,
// //         cityName:      localStorage.getItem('geo_loc_city_name')      || null,
// //         countryCoords: localStorage.getItem('geo_loc_country_coords') || null,
// //         cityCoords:    localStorage.getItem('geo_loc_city_coords')    || null,
// //         lat:           (() => { try { return JSON.parse(localStorage.getItem('geo_loc_data') || 'null')?.lat ?? null; } catch { return null; } })(),
// //         lng:           (() => { try { return JSON.parse(localStorage.getItem('geo_loc_data') || 'null')?.lng ?? null; } catch { return null; } })(),
// //       };
// //     } catch { return {}; }
// //   }

// //   /**
// //    * Convert stored "swLat,swLng~neLat,neLng" → Yandex bbox "swLng,swLat~neLng,neLat".
// //    * Yandex bbox format is: lon_min,lat_min~lon_max,lat_max
// //    */
// //   static _toBbox(coordStr) {
// //     if (!coordStr) return null;
// //     try {
// //       const [sw, ne] = coordStr.split('~');
// //       if (!sw || !ne) return null;
// //       const [swLat, swLng] = sw.split(',').map(Number);
// //       const [neLat, neLng] = ne.split(',').map(Number);
// //       if ([swLat, swLng, neLat, neLng].some(isNaN)) return null;
// //       return `${swLng},${swLat}~${neLng},${neLat}`;
// //     } catch { return null; }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // DISPATCH LAYER
// //   // ─────────────────────────────────────────────────────────────────────────

// //   _dispatchSearch(apiMethod, query, countryCode) {
// //     switch (apiMethod) {
// //       case 'GeoSuggestAPI':
// //         return this._geoSuggestSearch(query, countryCode);
// //       case 'suggest':
// //       default:
// //         return this._suggestSearch(query, countryCode);
// //     }
// //   }

// //   _dispatchLocation(apiMethod, ...args) {
// //     switch (apiMethod) {
// //       case 'geocoder':
// //       default:
// //         return typeof args[0] === 'string'
// //           ? this._placeDetails(args[0], args[1])
// //           : this._reverseGeocode(args[0], args[1]);
// //     }
// //   }

// //   _dispatchRoute(apiMethod, origin, destination) {
// //     switch (apiMethod) {
// //       case 'routeApi':
// //       default:
// //         return this._routeApi(origin, destination);
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // PUBLIC SERVICE METHODS
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async searchPlaces(query, countryCode = null, apiMethod = 'GeoSuggestAPI') {
// //     if (!query) return null;
// //     if (apiMethod === 'GeoSuggestAPI' && !this.geoSuggestApiKey) {
// //       console.warn('[YandexMapsProvider] searchPlaces: GeoSuggestAPI requested but key is missing — falling back to suggest');
// //       return this._suggestSearch(query, countryCode);
// //     }
// //     if (apiMethod !== 'GeoSuggestAPI' && !this.geocoderKey) return null;
// //     return this._dispatchSearch(apiMethod, query, countryCode);
// //   }

// //   async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoder') {
// //     // Fast path: coords already attached (e.g. business results from GeoSuggest)
// //     if (extraData?.lat != null && extraData?.lng != null) {
// //       return {
// //         lat:      extraData.lat,
// //         lng:      extraData.lng,
// //         address:  extraData.address || extraData.main_text || '',
// //         name:     extraData.name    || extraData.main_text || '',
// //         place_id: placeId,
// //       };
// //     }
// //     return this._dispatchLocation(apiMethod, placeId, extraData);
// //   }

// //   async reverseGeocode(lat, lng, apiMethod = 'geocoder') {
// //     if (!this.geocoderKey) return null;
// //     return this._dispatchLocation(apiMethod, lat, lng);
// //   }

// //   async getRoute(origin, destination, apiMethod = 'routeApi') {
// //     if (!this.geocoderKey) return null;
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

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Yandex GeoSuggest API
// //   //
// //   // POST https://suggest-maps.yandex.ru/v1/suggest
// //   // Key : NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY
// //   //
// //   // Query format: "{userText},{countryName}" (country always lowercase)
// //   // Spatial bias: bbox from geo_loc_country_coords (or city_coords for tighter area)
// //   //
// //   // Results are returned WITHOUT coordinates — coordinates are resolved
// //   // lazily via _placeDetails / Geocoder only when the user selects an entry.
// //   //
// //   // Docs: https://yandex.ru/dev/geosuggest/doc/en/
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _geoSuggestSearch(query, countryCode) {
// //     console.log(`[YandexMapsProvider._geoSuggestSearch] query:"${query}"`);
// //     try {
// //       // ── 1. Read saved geolocation ──────────────────────────────────────
// //       const geo = YandexMapsProvider._readGeoLoc();

// //       // ── 2. Build country-appended query text ───────────────────────────
// //       //    Format: "{userQuery},{countryName}" all lowercase
// //       const countryTag   = (geo.countryName || '').toLowerCase().trim();
// //       const searchText   = countryTag
// //         ? `${query.trim()},${countryTag}`
// //         : query.trim();

// //       console.log(`[YandexMapsProvider._geoSuggestSearch] searchText:"${searchText}"`);

// //       // ── 3. Build bbox from stored coords ──────────────────────────────
// //       //    Prefer city bbox for tighter results; fall back to country bbox.
// //       const cityBbox    = YandexMapsProvider._toBbox(geo.cityCoords);
// //       const countryBbox = YandexMapsProvider._toBbox(geo.countryCoords);
// //       const bbox        = cityBbox || countryBbox;

// //       // ── 4. Build params ───────────────────────────────────────────────
// //       const params = new URLSearchParams({
// //         apikey:        this.geoSuggestApiKey,
// //         text:          searchText,
// //         lang:          'en_US',
// //         results:       '10',
// //         types:         'geo,biz',
// //         print_address: '1',
// //         attrs:         'uri',      // needed for URI-based geocoder resolution
// //         highlight:     '0',
// //       });

// //       if (bbox) {
// //         // bbox gives the most relevant spatial bias for the user's country/city
// //         params.set('bbox', bbox);
// //       } else if (geo.lat != null && geo.lng != null) {
// //         // Fallback: ll + spn viewport bias
// //         params.set('ll',  `${geo.lng},${geo.lat}`);
// //         params.set('spn', '1,1');
// //       } else {
// //         // Hardcoded Lusaka default
// //         params.set('ll',  `${this._center.lng},${this._center.lat}`);
// //         params.set('spn', '1,1');
// //       }

// //       // ── 5. Fetch ──────────────────────────────────────────────────────
// //       const res = await fetch(
// //         `https://suggest-maps.yandex.ru/v1/suggest?${params}`,
// //         { headers: { 'Accept-Language': 'en' } },
// //       );

// //       console.log(`[YandexMapsProvider._geoSuggestSearch] HTTP ${res.status}`);
// //       if (!res.ok) {
// //         const err = await res.json().catch(() => ({}));
// //         console.error('[YandexMapsProvider._geoSuggestSearch] API error:', res.status, err);
// //         return null;
// //       }

// //       const data  = await res.json();
// //       const items = data.results ?? [];

// //       console.log(`[YandexMapsProvider._geoSuggestSearch] ${items.length} raw results`);
// //       if (!items.length) return null;

// //       // ── 6. Map results ────────────────────────────────────────────────
// //       const mapped = items.map((item, i) => {
// //         const titleText    = item.title?.text    || '';
// //         const subtitleText = item.subtitle?.text || '';

// //         // URI is present when attrs=uri is set — preferred for geocoder lookup
// //         const uri  = item.uri || null;
// //         const tags = Array.isArray(item.tags) ? item.tags : [];

// //         // Business results sometimes carry coordinates directly
// //         const coords    = item.geometry?.geometry?.coordinates; // [lng, lat]
// //         const lng       = Array.isArray(coords) ? Number(coords[0]) : null;
// //         const lat       = Array.isArray(coords) ? Number(coords[1]) : null;
// //         const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

// //         // Full address string used both for display and as geocoder text fallback
// //         const formattedAddress =
// //           item.address?.formatted_address ||
// //           (subtitleText ? `${titleText}, ${subtitleText}` : titleText);

// //         // Distance from the search center (for sorting)
// //         const distanceMeters = item.distance?.value ?? null;

// //         const isBiz = tags.includes('business') || tags.includes('biz');

// //         return {
// //           // place_id is the URI when available — _placeDetails detects it
// //           place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
// //           main_text:      titleText,
// //           secondary_text: formattedAddress !== titleText ? formattedAddress : subtitleText,
// //           address:        formattedAddress,
// //           name:           titleText,
// //           // Coords only for business results; toponyms resolved via geocoder on select
// //           ...(hasCoords ? { lat, lng } : {}),
// //           distanceMeters,
// //           _uri:           uri,
// //           _isBiz:         isBiz,
// //           _src:           'geosuggest',
// //         };
// //       });

// //       // Sort: entries with coords first (faster UX), then by distance
// //       mapped.sort((a, b) => {
// //         const aHas = a.lat != null ? 0 : 1;
// //         const bHas = b.lat != null ? 0 : 1;
// //         if (aHas !== bHas) return aHas - bHas;
// //         return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
// //       });

// //       console.log(
// //         '[YandexMapsProvider._geoSuggestSearch] ✅ returning',
// //         mapped.length, 'results:',
// //         mapped.map(r => r.main_text).join(' | '),
// //       );
// //       return mapped;
// //     } catch (err) {
// //       console.error('[YandexMapsProvider._geoSuggestSearch] exception:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Yandex Suggest API (legacy fallback)
// //   // Used when NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is absent.
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _suggestSearch(query, countryCode) {
// //     try {
// //       const geo         = YandexMapsProvider._readGeoLoc();
// //       const countryTag  = (geo.countryName || '').toLowerCase().trim();
// //       const searchText  = countryTag ? `${query.trim()},${countryTag}` : query.trim();

// //       const params = new URLSearchParams({
// //         apikey:  this.geocoderKey,
// //         text:    searchText,
// //         lang:    'en_US',
// //         ll:      `${this._center.lng},${this._center.lat}`,
// //         spn:     '1,1',
// //         results: '7',
// //       });
// //       if (countryCode) params.set('strict_bounds', '1');

// //       const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`, {
// //         headers: { 'Accept-Language': 'en' },
// //       });
// //       if (!res.ok) return null;

// //       const data  = await res.json();
// //       const items = data.results ?? [];
// //       if (!items.length) return null;

// //       return items.map((item, i) => {
// //         const title    = item.title?.text    || '';
// //         const subtitle = item.subtitle?.text || '';
// //         const uri      = item.uri || null;
// //         return {
// //           place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
// //           main_text:      title,
// //           secondary_text: subtitle,
// //           address:        subtitle ? `${title}, ${subtitle}` : title,
// //           name:           title,
// //           _uri:           uri,
// //           _src:           'suggest',
// //         };
// //       });
// //     } catch (err) {
// //       console.error('[YandexMapsProvider._suggestSearch] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Geocoder — resolve URI / text → { lat, lng, address, name }
// //   //
// //   // This is called when a user selects a suggest result that has no coordinates.
// //   // URI path is the most reliable (from attrs=uri in GeoSuggest).
// //   // Text path is a fallback using the formatted address string.
// //   //
// //   // Key: NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _placeDetails(placeId, extraData) {
// //     // Fast path: coords already present (business results from GeoSuggest)
// //     if (extraData?.lat != null && extraData?.lng != null) {
// //       return {
// //         lat:      extraData.lat,
// //         lng:      extraData.lng,
// //         address:  extraData.address || extraData.name || extraData.main_text || '',
// //         name:     extraData.name    || extraData.main_text || '',
// //         place_id: placeId,
// //       };
// //     }

// //     const isUri = typeof placeId === 'string' && placeId.startsWith('ymapsbm1://');
// //     const text  = extraData?.address || extraData?.name || extraData?.main_text;

// //     if (!isUri && !text) {
// //       console.warn('[YandexMapsProvider._placeDetails] no URI and no text — cannot resolve');
// //       return null;
// //     }

// //     console.log(
// //       `[YandexMapsProvider._placeDetails] resolving via ${isUri ? 'URI' : 'text'}:`,
// //       isUri ? placeId : text,
// //     );

// //     try {
// //       const params = new URLSearchParams({
// //         apikey:  this.geocoderKey,
// //         format:  'json',
// //         results: '1',
// //         lang:    'en_US',
// //       });

// //       if (isUri) {
// //         params.set('uri', placeId);
// //       } else {
// //         params.set('geocode', text);
// //       }

// //       const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
// //       if (!res.ok) {
// //         console.error('[YandexMapsProvider._placeDetails] geocoder HTTP', res.status);
// //         return null;
// //       }
// //       const data = await res.json();

// //       const members = data?.response?.GeoObjectCollection?.featureMember;
// //       if (!members?.length) {
// //         console.warn('[YandexMapsProvider._placeDetails] no geocoder results');
// //         return null;
// //       }

// //       const geo  = members[0].GeoObject;
// //       const pos  = geo.Point?.pos?.split(' ');
// //       if (!pos || pos.length < 2) return null;

// //       const resolvedLng = parseFloat(pos[0]);
// //       const resolvedLat = parseFloat(pos[1]);

// //       const meta       = geo.metaDataProperty?.GeocoderMetaData;
// //       const address    = meta?.Address;
// //       const components = address?.Components ?? [];
// //       const getKind    = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

// //       const fullAddress = address?.formatted || text || '';
// //       const name        = (extraData?.name || extraData?.main_text || fullAddress.split(',')[0] || '').trim();

// //       const result = {
// //         lat:           resolvedLat,
// //         lng:           resolvedLng,
// //         address:       fullAddress,
// //         name,
// //         place_id:      isUri ? placeId : `yandex_${resolvedLng}_${resolvedLat}`,
// //         // Extra detail fields for callers that want them
// //         city:          getKind('locality') || getKind('district') || null,
// //         country:       getKind('country')  || null,
// //         postalCode:    address?.postal_code ?? null,
// //         state:         getKind('province') || getKind('area') || null,
// //         streetAddress: getKind('street')   || null,
// //         streetNumber:  getKind('house')    || null,
// //       };

// //       console.log('[YandexMapsProvider._placeDetails] ✅ resolved', {
// //         lat: result.lat, lng: result.lng, address: result.address,
// //       });
// //       return result;
// //     } catch (err) {
// //       console.error('[YandexMapsProvider._placeDetails] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Yandex Geocoder — latlng → address
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _reverseGeocode(lat, lng) {
// //     try {
// //       const params = new URLSearchParams({
// //         apikey:  this.geocoderKey,
// //         geocode: `${lng},${lat}`,
// //         format:  'json',
// //         results: '1',
// //         lang:    'en_US',
// //       });
// //       const res  = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
// //       if (!res.ok) return null;
// //       const data = await res.json();

// //       const members = data?.response?.GeoObjectCollection?.featureMember;
// //       if (!members?.length) return null;

// //       const geo        = members[0].GeoObject;
// //       const meta       = geo.metaDataProperty?.GeocoderMetaData;
// //       const address    = meta?.Address;
// //       const components = address?.Components ?? [];
// //       const getKind    = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

// //       return {
// //         lat, lng,
// //         address:       address?.formatted || '',
// //         name:          getKind('locality') || getKind('district') || getKind('province') || 'Unknown',
// //         place_id:      `yandex_${lng}_${lat}`,
// //         city:          getKind('locality') || getKind('district'),
// //         country:       getKind('country'),
// //         postalCode:    address?.postal_code ?? null,
// //         state:         getKind('province')  || getKind('area'),
// //         streetAddress: getKind('street'),
// //         streetNumber:  getKind('house'),
// //       };
// //     } catch (err) {
// //       console.error('[YandexMapsProvider._reverseGeocode] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Yandex Router API
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _routeApi(origin, destination) {
// //     try {
// //       const params = new URLSearchParams({
// //         apikey:    this.geocoderKey,
// //         waypoints: `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`,
// //         mode:      'driving',
// //         lang:      'en_US',
// //         format:    'json',
// //       });
// //       const res  = await fetch(`https://api.routing.yandex.net/v2/route?${params}`);
// //       if (!res.ok) throw new Error(`Yandex Router ${res.status}`);

// //       const data = await res.json();
// //       const legs = data?.route?.legs ?? [];

// //       let totalDistanceM = 0;
// //       let totalDurationS = 0;
// //       const geometry     = [];

// //       for (const leg of legs) {
// //         totalDistanceM += Number(leg.length   ?? 0);
// //         totalDurationS += Number(leg.duration ?? 0);
// //         for (const step of (leg.steps ?? [])) {
// //           if (step.polyline) geometry.push(...decodeYandexPolyline(step.polyline));
// //           else if (step.maneuver?.position) {
// //             geometry.push([step.maneuver.position.lon, step.maneuver.position.lat]);
// //           }
// //         }
// //       }

// //       const km  = totalDistanceM / 1000;
// //       const min = totalDurationS / 60;

// //       return {
// //         type:          'yandex',
// //         distance:      km  >= 1 ? `${km.toFixed(1)} km`                                  : `${Math.round(totalDistanceM)} m`,
// //         duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
// //         distanceValue: Math.round(totalDistanceM),
// //         durationValue: Math.round(totalDurationS),
// //         geometry,
// //         steps: [],
// //       };
// //     } catch (err) {
// //       console.error('[YandexMapsProvider._routeApi] error:', err?.message);
// //       return null;
// //     }
// //   }
// // }

// // export default YandexMapsProvider;

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Decode Yandex / Google encoded polyline → [[lng, lat], ...]
// // // ─────────────────────────────────────────────────────────────────────────────
// // function decodeYandexPolyline(encoded) {
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
// // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.js

// export class YandexMapsProvider {
//   /**
//    * @param {string} geocoderKey    – NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY
//    * @param {string} geoSuggestApiKey – NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY
//    */
//   constructor(geocoderKey, geoSuggestApiKey) {
//     this.geocoderKey      = geocoderKey;
//     this.geoSuggestApiKey = geoSuggestApiKey;
//     this.name             = 'yandex';
//     this._center          = { lat: -15.4167, lng: 28.2833 };

//     console.log(
//       '[YandexMapsProvider] geocoderKey present:',    !!geocoderKey,
//       '| geoSuggestApiKey present:', !!geoSuggestApiKey,
//     );
//     if (!geoSuggestApiKey) {
//       console.warn(
//         '[YandexMapsProvider] ⚠️  NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is not set — ' +
//         'GeoSuggestAPI calls will be skipped.',
//       );
//     }
//     if (!geocoderKey) {
//       console.warn(
//         '[YandexMapsProvider] ⚠️  NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY is not set — ' +
//         'Geocoder / Router calls will fail.',
//       );
//     }
//   }

//   setCenter(lat, lng) { this._center = { lat, lng }; }

//   // ─────────────────────────────────────────────────────────────────────────
//   // STORAGE HELPERS
//   // Read the geo data saved by GoogleMapsIpLocation component.
//   // ─────────────────────────────────────────────────────────────────────────

//   static _readGeoLoc() {
//     if (typeof window === 'undefined') return {};
//     try {
//       const status = localStorage.getItem('geo_loc_status');
//       if (status !== 'success') return {};
//       return {
//         countryName:   localStorage.getItem('geo_loc_country_name')   || null,
//         cityName:      localStorage.getItem('geo_loc_city_name')      || null,
//         countryCoords: localStorage.getItem('geo_loc_country_coords') || null,
//         cityCoords:    localStorage.getItem('geo_loc_city_coords')    || null,
//         lat:           (() => { try { return JSON.parse(localStorage.getItem('geo_loc_data') || 'null')?.lat ?? null; } catch { return null; } })(),
//         lng:           (() => { try { return JSON.parse(localStorage.getItem('geo_loc_data') || 'null')?.lng ?? null; } catch { return null; } })(),
//       };
//     } catch { return {}; }
//   }

//   /**
//    * Convert stored "swLat,swLng~neLat,neLng" → Yandex bbox "swLng,swLat~neLng,neLat".
//    * Yandex bbox format is: lon_min,lat_min~lon_max,lat_max
//    */
//   static _toBbox(coordStr) {
//     if (!coordStr) return null;
//     try {
//       const [sw, ne] = coordStr.split('~');
//       if (!sw || !ne) return null;
//       const [swLat, swLng] = sw.split(',').map(Number);
//       const [neLat, neLng] = ne.split(',').map(Number);
//       if ([swLat, swLng, neLat, neLng].some(isNaN)) return null;
//       return `${swLng},${swLat}~${neLng},${neLat}`;
//     } catch { return null; }
//   }

//   /**
//    * Parse a "lng,lat" locationBounds string (the user's CURRENT geolocation,
//    * passed down from the rider component) into { lng, lat }.
//    * This value takes PRIORITY over everything else (bbox, saved geo, default center)
//    * wherever it's supplied to a search call.
//    */
//     /**
//    * Parse a "lng,lat" locationBounds string (the user's CURRENT geolocation,
//    * passed down from the rider component) into { lng, lat }.
//    * This value takes PRIORITY over everything else (bbox, saved geo, default center)
//    * wherever it's supplied to a search call.
//    *
//    * Includes basic sanity checks so a swapped "lat,lng" string (which would
//    * silently bias suggestions to the wrong hemisphere and return nothing)
//    * gets flagged instead of failing silently.
//    */
//   static _parseLocationBounds(locationBounds) {
//     if (!locationBounds || typeof locationBounds !== 'string') return null;
//     const parts = locationBounds.split(',').map((s) => parseFloat(String(s).trim()));
//     if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
//       console.warn('[YandexMapsProvider._parseLocationBounds] could not parse:', locationBounds);
//       return null;
//     }
//     const [lng, lat] = parts;

//     // Sanity check — lng must be in [-180,180], lat in [-90,90].
//     // If this fails, it's very likely the string is "lat,lng" instead of "lng,lat".
//     if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
//       console.error(
//         `[YandexMapsProvider._parseLocationBounds] ⚠️ SUSPECT SWAPPED COORDS —` +
//         ` got lng:${lng} lat:${lat} from "${locationBounds}". Expected format is "lng,lat".`
//       );
//       return null;
//     }

//     return { lng, lat };
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // DISPATCH LAYER
//   // ─────────────────────────────────────────────────────────────────────────

//   _dispatchSearch(apiMethod, query, countryCode, locationBounds) {
//     switch (apiMethod) {
//       case 'GeoSuggestAPI':
//         return this._geoSuggestSearch(query, countryCode, locationBounds);
//       case 'suggest':
//       default:
//         return this._suggestSearch(query, countryCode, locationBounds);
//     }
//   }

//   _dispatchLocation(apiMethod, ...args) {
//     switch (apiMethod) {
//       case 'geocoder':
//       default:
//         return typeof args[0] === 'string'
//           ? this._placeDetails(args[0], args[1])
//           : this._reverseGeocode(args[0], args[1]);
//     }
//   }

//   _dispatchRoute(apiMethod, origin, destination) {
//     switch (apiMethod) {
//       case 'routeApi':
//       default:
//         return this._routeApi(origin, destination);
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // PUBLIC SERVICE METHODS
//   // ─────────────────────────────────────────────────────────────────────────

//   /**
//    * @param {string} locationBounds – "lng,lat" — the user's CURRENT geolocation
//    *   coordinate bounds. Takes PRIORITY over any other spatial bias for both
//    *   GeoSuggestAPI (JS-style suggest) and the legacy suggest fallback.
//    */
//   async searchPlaces(query, countryCode = null, apiMethod = 'GeoSuggestAPI', locationBounds = null) {
//     if (!query) return null;
//     if (apiMethod === 'GeoSuggestAPI' && !this.geoSuggestApiKey) {
//       console.warn('[YandexMapsProvider] searchPlaces: GeoSuggestAPI requested but key is missing — falling back to suggest');
//       return this._suggestSearch(query, countryCode, locationBounds);
//     }
//     if (apiMethod !== 'GeoSuggestAPI' && !this.geocoderKey) return null;
//     return this._dispatchSearch(apiMethod, query, countryCode, locationBounds);
//   }

//   async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoder') {
//     // Fast path: coords already attached (e.g. business results from GeoSuggest)
//     if (extraData?.lat != null && extraData?.lng != null) {
//       return {
//         lat:      extraData.lat,
//         lng:      extraData.lng,
//         address:  extraData.address || extraData.main_text || '',
//         name:     extraData.name    || extraData.main_text || '',
//         place_id: placeId,
//       };
//     }
//     return this._dispatchLocation(apiMethod, placeId, extraData);
//   }

//   async reverseGeocode(lat, lng, apiMethod = 'geocoder') {
//     if (!this.geocoderKey) return null;
//     return this._dispatchLocation(apiMethod, lat, lng);
//   }

//   async getRoute(origin, destination, apiMethod = 'routeApi') {
//     if (!this.geocoderKey) return null;
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

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Yandex GeoSuggest API
//   //
//   // POST https://suggest-maps.yandex.ru/v1/suggest
//   // Key : NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY
//   //
//   // Query format: "{userText},{countryName}" (country always lowercase)
//   // Spatial bias PRIORITY:
//   //   1. Explicit locationBounds prop ("lng,lat")  → &ll=&spn=0.1,0.1&rspn=0
//   //   2. bbox from geo_loc_country_coords / city_coords
//   //   3. saved geo_loc_data lat/lng                → &ll=&spn=1,1
//   //   4. hardcoded default center
//   //
//   // Results are returned WITHOUT coordinates — coordinates are resolved
//   // lazily via _placeDetails / Geocoder only when the user selects an entry.
//   //
//   // Docs: https://yandex.ru/dev/geosuggest/doc/en/
//   // ─────────────────────────────────────────────────────────────────────────
//   async _geoSuggestSearch(query, countryCode, locationBounds = null) {
//     console.log('[YandexMapsProvider._geoSuggestSearch] locationBounds prop received:', locationBounds);
//     console.log(`[YandexMapsProvider._geoSuggestSearch] query:"${query}" locationBounds:"${locationBounds}"`);
//     try {
//       const savedCountryName = localStorage.getItem('savedCountryName');
//       // ── 1. Read saved geolocation ──────────────────────────────────────
//       const geo = YandexMapsProvider._readGeoLoc();
//       const userCountryName = savedCountryName || geo.countryName || '';
//       // ── 2. Build country-appended query text ───────────────────────────
//       //    Format: "{userQuery},{countryName}" all lowercase
//       // const countryTag  = (userCountryName || '').toLowerCase().trim();
//       const countryTag  =  ''
//       const searchText   = countryTag
//         ? `${query.trim()},${countryTag}`
//         : query.trim();

//       console.log(`[YandexMapsProvider._geoSuggestSearch] searchText:"${searchText}"`);

//       // ── 3. Build bbox from stored coords ──────────────────────────────
//       //    Prefer city bbox for tighter results; fall back to country bbox.
//       const cityBbox    = YandexMapsProvider._toBbox(geo.cityCoords);
//       const countryBbox = YandexMapsProvider._toBbox(geo.countryCoords);
//       const bbox        = cityBbox || countryBbox;

//       // ── 3b. Explicit locationBounds prop — TOP PRIORITY ─────────────────
//       const explicitBounds = YandexMapsProvider._parseLocationBounds(locationBounds);

//       // ── 4. Build params ───────────────────────────────────────────────
//       const params = new URLSearchParams({
//         apikey:        this.geoSuggestApiKey,
//         text:          searchText,
//         lang:          'en_US',
//         results:       '10',
//         types:         'geo,biz',
//         print_address: '1',
//         attrs:         'uri',      // needed for URI-based geocoder resolution
//         highlight:     '0',
//       });

//       if (explicitBounds) {
//         // Format example: &ll=28.334712,-15.520371&spn=0.1,0.1&rspn=0
//         console.log(`[YandexMapsProvider._geoSuggestSearch] using PRIORITY locationBounds ll=${explicitBounds.lng},${explicitBounds.lat}`);
//         params.set('ll',   `${explicitBounds.lng},${explicitBounds.lat}`);
//         params.set('spn',  '0.1,0.1');
//         params.set('rspn', '0');
//       } else if (bbox) {
//         console.log('[YandexMapsProvider._geoSuggestSearch] no locationBounds — falling back to bbox:', bbox);
//         // bbox gives the most relevant spatial bias for the user's country/city
//         params.set('bbox', bbox);
//       } else if (geo.lat != null && geo.lng != null) {
//         console.log('[YandexMapsProvider._geoSuggestSearch] no locationBounds/bbox — falling back to saved geo:', geo.lat, geo.lng);
//         // Fallback: ll + spn viewport bias
//         params.set('ll',  `${geo.lng},${geo.lat}`);
//         params.set('spn', '1,1');
//       } else {
//         console.log('[YandexMapsProvider._geoSuggestSearch] no bias sources available — using hardcoded default center');
//         // Hardcoded Lusaka default
//         params.set('ll',  `${this._center.lng},${this._center.lat}`);
//         params.set('spn', '1,1');
//       }

//       const requestUrl = `https://suggest-maps.yandex.ru/v1/suggest?${params}`;
//       console.log('[YandexMapsProvider._geoSuggestSearch] full request URL:', requestUrl);

//       // ── 5. Fetch ──────────────────────────────────────────────────────
//       const res = await fetch(requestUrl, { headers: { 'Accept-Language': 'en' } });

//       console.log(`[YandexMapsProvider._geoSuggestSearch] HTTP ${res.status}`);
//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         console.error('[YandexMapsProvider._geoSuggestSearch] API error:', res.status, err);
//         return null;
//       }

//       const data  = await res.json();
//       const items = data.results ?? [];

//       console.log(`[YandexMapsProvider._geoSuggestSearch] ${items.length} raw results`);
//       if (!items.length) {
//         console.warn('[YandexMapsProvider._geoSuggestSearch] ZERO results — full response:', JSON.stringify(data).slice(0, 500));
//         return null;
//       }

//       // ── 6. Map results ────────────────────────────────────────────────
//       const mapped = items.map((item, i) => {
//         const titleText    = item.title?.text    || '';
//         const subtitleText = item.subtitle?.text || '';

//         // URI is present when attrs=uri is set — preferred for geocoder lookup
//         const uri  = item.uri || null;
//         const tags = Array.isArray(item.tags) ? item.tags : [];

//         // Business results sometimes carry coordinates directly
//         const coords    = item.geometry?.geometry?.coordinates; // [lng, lat]
//         const lng       = Array.isArray(coords) ? Number(coords[0]) : null;
//         const lat       = Array.isArray(coords) ? Number(coords[1]) : null;
//         const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

//         // Full address string used both for display and as geocoder text fallback
//         const formattedAddress =
//           item.address?.formatted_address ||
//           (subtitleText ? `${titleText}, ${subtitleText}` : titleText);

//         // Distance from the search center (for sorting)
//         const distanceMeters = item.distance?.value ?? null;

//         const isBiz = tags.includes('business') || tags.includes('biz');

//         return {
//           // place_id is the URI when available — _placeDetails detects it
//           place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
//           main_text:      titleText,
//           secondary_text: formattedAddress !== titleText ? formattedAddress : subtitleText,
//           address:        formattedAddress,
//           name:           titleText,
//           // Coords only for business results; toponyms resolved via geocoder on select
//           ...(hasCoords ? { lat, lng } : {}),
//           distanceMeters,
//           _uri:           uri,
//           _isBiz:         isBiz,
//           _src:           'geosuggest',
//         };
//       });

//       // Sort: entries with coords first (faster UX), then by distance
//       mapped.sort((a, b) => {
//         const aHas = a.lat != null ? 0 : 1;
//         const bHas = b.lat != null ? 0 : 1;
//         if (aHas !== bHas) return aHas - bHas;
//         return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
//       });

//       console.log(
//         '[YandexMapsProvider._geoSuggestSearch] ✅ returning',
//         mapped.length, 'results:',
//         mapped.map(r => r.main_text).join(' | '),
//       );
//       return mapped;
//     } catch (err) {
//       console.error('[YandexMapsProvider._geoSuggestSearch] exception:', err?.message, err);
//       return null;
//     }
//   }
// async _suggestSearch(query, countryCode, locationBounds = null) {
//     try {
//       const savedCountryName = localStorage.getItem('savedCountryName');
//       // ── 1. Read saved geolocation ──────────────────────────────────────
//       const geo = YandexMapsProvider._readGeoLoc();
//       const userCountryName = savedCountryName || geo.countryName || '';

//       // const countryTag  = (userCountryName || '').toLowerCase().trim();
//       const countryTag  =  ''
//       const searchText  = countryTag ? `${query.trim()},${countryTag}` : query.trim();

//       const explicitBounds = YandexMapsProvider._parseLocationBounds(locationBounds);
//       const center = explicitBounds || this._center;
//       const spn    = explicitBounds ? '0.1,0.1' : '1,1';

//       console.log(
//         `[YandexMapsProvider._suggestSearch] query:"${query}" locationBounds:"${locationBounds}"` +
//         ` ll:${center.lng},${center.lat} spn:${spn}` +
//         ` priority:${explicitBounds ? 'locationBounds' : 'default center'}`,
//       );

//       const params = new URLSearchParams({
//         apikey:  this.geocoderKey,
//         text:    searchText,
//         lang:    'en_US',
//         ll:      `${center.lng},${center.lat}`,
//         spn,
//         results: '7',
//       });
//       if (explicitBounds) params.set('rspn', '0');
//       if (countryCode) params.set('strict_bounds', '1');

//       const requestUrl = `https://suggest-maps.yandex.ru/v1/suggest?${params}`;
//       console.log('[YandexMapsProvider._suggestSearch] full request URL:', requestUrl);

//       const res = await fetch(requestUrl, { headers: { 'Accept-Language': 'en' } });

//       console.log(`[YandexMapsProvider._suggestSearch] HTTP ${res.status}`);
//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         console.error('[YandexMapsProvider._suggestSearch] API error:', res.status, err);
//         return null;
//       }

//       const data  = await res.json();
//       const items = data.results ?? [];
//       console.log(`[YandexMapsProvider._suggestSearch] ${items.length} raw results`);
//       if (!items.length) {
//         console.warn('[YandexMapsProvider._suggestSearch] ZERO results — full response:', JSON.stringify(data).slice(0, 500));
//         return null;
//       }

//       return items.map((item, i) => {
//         const title    = item.title?.text    || '';
//         const subtitle = item.subtitle?.text || '';
//         const uri      = item.uri || null;
//         return {
//           place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
//           main_text:      title,
//           secondary_text: subtitle,
//           address:        subtitle ? `${title}, ${subtitle}` : title,
//           name:           title,
//           _uri:           uri,
//           _src:           'suggest',
//         };
//       });
//     } catch (err) {
//       console.error('[YandexMapsProvider._suggestSearch] error:', err?.message, err);
//       return null;
//     }
//   }
//   // async _geoSuggestSearch(query, countryCode, locationBounds = null) {
//   //   console.log('location bounds are',locationBounds)
//   //   console.log(`[YandexMapsProvider._geoSuggestSearch] query:"${query}" locationBounds:"${locationBounds}"`);
//   //   try {
//   //     const savedCountryName = localStorage.getItem('savedCountryName');
//   //     // ── 1. Read saved geolocation ──────────────────────────────────────
//   //     const geo =  YandexMapsProvider._readGeoLoc();
//   //     const userCountryName = savedCountryName || geo.countryName || '';
//   //     // ── 2. Build country-appended query text ───────────────────────────
//   //     //    Format: "{userQuery},{countryName}" all lowercase
//   //     const countryTag   = (userCountryName || '').toLowerCase().trim();
//   //     const searchText   = countryTag
//   //       ? `${query.trim()},${countryTag}`
//   //       : query.trim();

//   //     console.log(`[YandexMapsProvider._geoSuggestSearch] searchText:"${searchText}"`);

//   //     // ── 3. Build bbox from stored coords ──────────────────────────────
//   //     //    Prefer city bbox for tighter results; fall back to country bbox.
//   //     const cityBbox    = YandexMapsProvider._toBbox(geo.cityCoords);
//   //     const countryBbox = YandexMapsProvider._toBbox(geo.countryCoords);
//   //     const bbox        = cityBbox || countryBbox;

//   //     // ── 3b. Explicit locationBounds prop — TOP PRIORITY ─────────────────
//   //     const explicitBounds = YandexMapsProvider._parseLocationBounds(locationBounds);

//   //     // ── 4. Build params ───────────────────────────────────────────────
//   //     const params = new URLSearchParams({
//   //       apikey:        this.geoSuggestApiKey,
//   //       text:          searchText,
//   //       lang:          'en_US',
//   //       results:       '10',
//   //       types:         'geo,biz',
//   //       print_address: '1',
//   //       attrs:         'uri',      // needed for URI-based geocoder resolution
//   //       highlight:     '0',
//   //     });

//   //     if (explicitBounds) {
//   //       // Format example: &ll=28.334712,-15.520371&spn=0.1,0.1&rspn=0
//   //       console.log(`[YandexMapsProvider._geoSuggestSearch] using PRIORITY locationBounds ll=${explicitBounds.lng},${explicitBounds.lat}`);
//   //       params.set('ll',   `${explicitBounds.lng},${explicitBounds.lat}`);
//   //       params.set('spn',  '0.1,0.1');
//   //       params.set('rspn', '0');
//   //     } else if (bbox) {
//   //       // bbox gives the most relevant spatial bias for the user's country/city
//   //       params.set('bbox', bbox);
//   //     } else if (geo.lat != null && geo.lng != null) {
//   //       // Fallback: ll + spn viewport bias
//   //       params.set('ll',  `${geo.lng},${geo.lat}`);
//   //       params.set('spn', '1,1');
//   //     } else {
//   //       // Hardcoded Lusaka default
//   //       params.set('ll',  `${this._center.lng},${this._center.lat}`);
//   //       params.set('spn', '1,1');
//   //     }

//   //     // ── 5. Fetch ──────────────────────────────────────────────────────
//   //     const res = await fetch(
//   //       `https://suggest-maps.yandex.ru/v1/suggest?${params}`,
//   //       { headers: { 'Accept-Language': 'en' } },
//   //     );

//   //     console.log(`[YandexMapsProvider._geoSuggestSearch] HTTP ${res.status}`);
//   //     if (!res.ok) {
//   //       const err = await res.json().catch(() => ({}));
//   //       console.error('[YandexMapsProvider._geoSuggestSearch] API error:', res.status, err);
//   //       return null;
//   //     }

//   //     const data  = await res.json();
//   //     const items = data.results ?? [];

//   //     console.log(`[YandexMapsProvider._geoSuggestSearch] ${items.length} raw results`);
//   //     if (!items.length) return null;

//   //     // ── 6. Map results ────────────────────────────────────────────────
//   //     const mapped = items.map((item, i) => {
//   //       const titleText    = item.title?.text    || '';
//   //       const subtitleText = item.subtitle?.text || '';

//   //       // URI is present when attrs=uri is set — preferred for geocoder lookup
//   //       const uri  = item.uri || null;
//   //       const tags = Array.isArray(item.tags) ? item.tags : [];

//   //       // Business results sometimes carry coordinates directly
//   //       const coords    = item.geometry?.geometry?.coordinates; // [lng, lat]
//   //       const lng       = Array.isArray(coords) ? Number(coords[0]) : null;
//   //       const lat       = Array.isArray(coords) ? Number(coords[1]) : null;
//   //       const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

//   //       // Full address string used both for display and as geocoder text fallback
//   //       const formattedAddress =
//   //         item.address?.formatted_address ||
//   //         (subtitleText ? `${titleText}, ${subtitleText}` : titleText);

//   //       // Distance from the search center (for sorting)
//   //       const distanceMeters = item.distance?.value ?? null;

//   //       const isBiz = tags.includes('business') || tags.includes('biz');

//   //       return {
//   //         // place_id is the URI when available — _placeDetails detects it
//   //         place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
//   //         main_text:      titleText,
//   //         secondary_text: formattedAddress !== titleText ? formattedAddress : subtitleText,
//   //         address:        formattedAddress,
//   //         name:           titleText,
//   //         // Coords only for business results; toponyms resolved via geocoder on select
//   //         ...(hasCoords ? { lat, lng } : {}),
//   //         distanceMeters,
//   //         _uri:           uri,
//   //         _isBiz:         isBiz,
//   //         _src:           'geosuggest',
//   //       };
//   //     });

//   //     // Sort: entries with coords first (faster UX), then by distance
//   //     mapped.sort((a, b) => {
//   //       const aHas = a.lat != null ? 0 : 1;
//   //       const bHas = b.lat != null ? 0 : 1;
//   //       if (aHas !== bHas) return aHas - bHas;
//   //       return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
//   //     });

//   //     console.log(
//   //       '[YandexMapsProvider._geoSuggestSearch] ✅ returning',
//   //       mapped.length, 'results:',
//   //       mapped.map(r => r.main_text).join(' | '),
//   //     );
//   //     return mapped;
//   //   } catch (err) {
//   //     console.error('[YandexMapsProvider._geoSuggestSearch] exception:', err?.message);
//   //     return null;
//   //   }
//   // }

//   // // ─────────────────────────────────────────────────────────────────────────
//   // // IMPLEMENTATION: Yandex Suggest API (legacy fallback)
//   // // Used when NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is absent.
//   // //
//   // // Spatial bias PRIORITY:
//   // //   1. Explicit locationBounds prop ("lng,lat") → &ll=&spn=0.1,0.1&rspn=0
//   // //   2. this._center default                     → &ll=&spn=1,1
//   // // ─────────────────────────────────────────────────────────────────────────

//   // async _suggestSearch(query, countryCode, locationBounds = null) {
//   //   try {
//   //      const savedCountryName = localStorage.getItem('savedCountryName');
//   //     // ── 1. Read saved geolocation ──────────────────────────────────────
//   //     const geo =  YandexMapsProvider._readGeoLoc();
//   //     const userCountryName = savedCountryName || geo.countryName || '';
      
//   //     const countryTag  = (userCountryName || '').toLowerCase().trim();
//   //     const searchText  = countryTag ? `${query.trim()},${countryTag}` : query.trim();

//   //     const explicitBounds = YandexMapsProvider._parseLocationBounds(locationBounds);
//   //     const center = explicitBounds || this._center;
//   //     const spn    = explicitBounds ? '0.1,0.1' : '1,1';

//   //     console.log(
//   //       `[YandexMapsProvider._suggestSearch] query:"${query}"` +
//   //       ` ll:${center.lng},${center.lat} spn:${spn}` +
//   //       ` priority:${explicitBounds ? 'locationBounds' : 'default center'}`,
//   //     );

//   //     const params = new URLSearchParams({
//   //       apikey:  this.geocoderKey,
//   //       text:    searchText,
//   //       lang:    'en_US',
//   //       ll:      `${center.lng},${center.lat}`,
//   //       spn,
//   //       results: '7',
//   //     });
//   //     if (explicitBounds) params.set('rspn', '0');
//   //     if (countryCode) params.set('strict_bounds', '1');

//   //     const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`, {
//   //       headers: { 'Accept-Language': 'en' },
//   //     });
//   //     if (!res.ok) return null;

//   //     const data  = await res.json();
//   //     const items = data.results ?? [];
//   //     if (!items.length) return null;

//   //     return items.map((item, i) => {
//   //       const title    = item.title?.text    || '';
//   //       const subtitle = item.subtitle?.text || '';
//   //       const uri      = item.uri || null;
//   //       return {
//   //         place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
//   //         main_text:      title,
//   //         secondary_text: subtitle,
//   //         address:        subtitle ? `${title}, ${subtitle}` : title,
//   //         name:           title,
//   //         _uri:           uri,
//   //         _src:           'suggest',
//   //       };
//   //     });
//   //   } catch (err) {
//   //     console.error('[YandexMapsProvider._suggestSearch] error:', err?.message);
//   //     return null;
//   //   }
//   // }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Geocoder — resolve URI / text → { lat, lng, address, name }
//   //
//   // This is called when a user selects a suggest result that has no coordinates.
//   // URI path is the most reliable (from attrs=uri in GeoSuggest).
//   // Text path is a fallback using the formatted address string.
//   //
//   // Key: NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY
//   // ─────────────────────────────────────────────────────────────────────────

//   async _placeDetails(placeId, extraData) {
//     // Fast path: coords already present (business results from GeoSuggest)
//     if (extraData?.lat != null && extraData?.lng != null) {
//       return {
//         lat:      extraData.lat,
//         lng:      extraData.lng,
//         address:  extraData.address || extraData.name || extraData.main_text || '',
//         name:     extraData.name    || extraData.main_text || '',
//         place_id: placeId,
//       };
//     }

//     const isUri = typeof placeId === 'string' && placeId.startsWith('ymapsbm1://');
//     const text  = extraData?.address || extraData?.name || extraData?.main_text;

//     if (!isUri && !text) {
//       console.warn('[YandexMapsProvider._placeDetails] no URI and no text — cannot resolve');
//       return null;
//     }

//     console.log(
//       `[YandexMapsProvider._placeDetails] resolving via ${isUri ? 'URI' : 'text'}:`,
//       isUri ? placeId : text,
//     );

//     try {
//       const params = new URLSearchParams({
//         apikey:  this.geocoderKey,
//         format:  'json',
//         results: '1',
//         lang:    'en_US',
//       });

//       if (isUri) {
//         params.set('uri', placeId);
//       } else {
//         params.set('geocode', text);
//       }

//       const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
//       if (!res.ok) {
//         console.error('[YandexMapsProvider._placeDetails] geocoder HTTP', res.status);
//         return null;
//       }
//       const data = await res.json();

//       const members = data?.response?.GeoObjectCollection?.featureMember;
//       if (!members?.length) {
//         console.warn('[YandexMapsProvider._placeDetails] no geocoder results');
//         return null;
//       }

//       const geo  = members[0].GeoObject;
//       const pos  = geo.Point?.pos?.split(' ');
//       if (!pos || pos.length < 2) return null;

//       const resolvedLng = parseFloat(pos[0]);
//       const resolvedLat = parseFloat(pos[1]);

//       const meta       = geo.metaDataProperty?.GeocoderMetaData;
//       const address    = meta?.Address;
//       const components = address?.Components ?? [];
//       const getKind    = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

//       const fullAddress = address?.formatted || text || '';
//       const name        = (extraData?.name || extraData?.main_text || fullAddress.split(',')[0] || '').trim();

//       const result = {
//         lat:           resolvedLat,
//         lng:           resolvedLng,
//         address:       fullAddress,
//         name,
//         place_id:      isUri ? placeId : `yandex_${resolvedLng}_${resolvedLat}`,
//         // Extra detail fields for callers that want them
//         city:          getKind('locality') || getKind('district') || null,
//         country:       getKind('country')  || null,
//         postalCode:    address?.postal_code ?? null,
//         state:         getKind('province') || getKind('area') || null,
//         streetAddress: getKind('street')   || null,
//         streetNumber:  getKind('house')    || null,
//       };

//       console.log('[YandexMapsProvider._placeDetails] ✅ resolved', {
//         lat: result.lat, lng: result.lng, address: result.address,
//       });
//       return result;
//     } catch (err) {
//       console.error('[YandexMapsProvider._placeDetails] error:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Yandex Geocoder — latlng → address
//   // ─────────────────────────────────────────────────────────────────────────

//   async _reverseGeocode(lat, lng) {
//     try {
//       const params = new URLSearchParams({
//         apikey:  this.geocoderKey,
//         geocode: `${lng},${lat}`,
//         format:  'json',
//         results: '1',
//         lang:    'en_US',
//       });
//       const res  = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
//       if (!res.ok) return null;
//       const data = await res.json();

//       const members = data?.response?.GeoObjectCollection?.featureMember;
//       if (!members?.length) return null;

//       const geo        = members[0].GeoObject;
//       const meta       = geo.metaDataProperty?.GeocoderMetaData;
//       const address    = meta?.Address;
//       const components = address?.Components ?? [];
//       const getKind    = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

//       return {
//         lat, lng,
//         address:       address?.formatted || '',
//         name:          getKind('locality') || getKind('district') || getKind('province') || 'Unknown',
//         place_id:      `yandex_${lng}_${lat}`,
//         city:          getKind('locality') || getKind('district'),
//         country:       getKind('country'),
//         postalCode:    address?.postal_code ?? null,
//         state:         getKind('province')  || getKind('area'),
//         streetAddress: getKind('street'),
//         streetNumber:  getKind('house'),
//       };
//     } catch (err) {
//       console.error('[YandexMapsProvider._reverseGeocode] error:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Yandex Router API
//   // ─────────────────────────────────────────────────────────────────────────

//   async _routeApi(origin, destination) {
//     try {
//       const params = new URLSearchParams({
//         apikey:    this.geocoderKey,
//         waypoints: `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`,
//         mode:      'driving',
//         lang:      'en_US',
//         format:    'json',
//       });
//       const res  = await fetch(`https://api.routing.yandex.net/v2/route?${params}`);
//       if (!res.ok) throw new Error(`Yandex Router ${res.status}`);

//       const data = await res.json();
//       const legs = data?.route?.legs ?? [];

//       let totalDistanceM = 0;
//       let totalDurationS = 0;
//       const geometry     = [];

//       for (const leg of legs) {
//         totalDistanceM += Number(leg.length   ?? 0);
//         totalDurationS += Number(leg.duration ?? 0);
//         for (const step of (leg.steps ?? [])) {
//           if (step.polyline) geometry.push(...decodeYandexPolyline(step.polyline));
//           else if (step.maneuver?.position) {
//             geometry.push([step.maneuver.position.lon, step.maneuver.position.lat]);
//           }
//         }
//       }

//       const km  = totalDistanceM / 1000;
//       const min = totalDurationS / 60;

//       return {
//         type:          'yandex',
//         distance:      km  >= 1 ? `${km.toFixed(1)} km`                                  : `${Math.round(totalDistanceM)} m`,
//         duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
//         distanceValue: Math.round(totalDistanceM),
//         durationValue: Math.round(totalDurationS),
//         geometry,
//         steps: [],
//       };
//     } catch (err) {
//       console.error('[YandexMapsProvider._routeApi] error:', err?.message);
//       return null;
//     }
//   }
// }

// export default YandexMapsProvider;

// // ─────────────────────────────────────────────────────────────────────────────
// // Decode Yandex / Google encoded polyline → [[lng, lat], ...]
// // ─────────────────────────────────────────────────────────────────────────────
// function decodeYandexPolyline(encoded) {
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
// PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.js

// ─────────────────────────────────────────────────────────────────────────────
// Module-level city-name cache — avoids re-reverse-geocoding the same
// coordinates on every keystroke. Keyed by coords rounded to 3 decimals
// (~110m precision), which is plenty for "which city/town am I in".
// ─────────────────────────────────────────────────────────────────────────────
const _cityNameCache = new Map();

function _cityCacheKey(lat, lng) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Haversine distance (km) — used to hard-filter search results that fall
// outside the user's current area even though the API returned them.
// ─────────────────────────────────────────────────────────────────────────────
function _haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// How far (km) a result is allowed to be from the user's locationBounds
// before it's dropped as irrelevant (e.g. a Lusaka result when the user is
// in Malawi). Results without coordinates yet (unresolved Yandex toponyms)
// can't be measured and are left untouched.
const YANDEX_SEARCH_PROXIMITY_KM = 400;

export class YandexMapsProvider {
  /**
   * @param {string} geocoderKey    – NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY
   * @param {string} geoSuggestApiKey – NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY
   */
  constructor(geocoderKey, geoSuggestApiKey) {
    this.geocoderKey      = geocoderKey;
    this.geoSuggestApiKey = geoSuggestApiKey;
    this.name             = 'yandex';
    this._center          = { lat: -15.4167, lng: 28.2833 };

    console.log(
      '[YandexMapsProvider] geocoderKey present:',    !!geocoderKey,
      '| geoSuggestApiKey present:', !!geoSuggestApiKey,
    );
    if (!geoSuggestApiKey) {
      console.warn(
        '[YandexMapsProvider] ⚠️  NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is not set — ' +
        'GeoSuggestAPI calls will be skipped.',
      );
    }
    if (!geocoderKey) {
      console.warn(
        '[YandexMapsProvider] ⚠️  NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY is not set — ' +
        'Geocoder / Router calls will fail.',
      );
    }
  }

  setCenter(lat, lng) { this._center = { lat, lng }; }

  // ─────────────────────────────────────────────────────────────────────────
  // STORAGE HELPERS
  // Read the geo data saved by GoogleMapsIpLocation component.
  // ─────────────────────────────────────────────────────────────────────────

  static _readGeoLoc() {
    if (typeof window === 'undefined') return {};
    try {
      const status = localStorage.getItem('geo_loc_status');
      if (status !== 'success') return {};
      return {
        countryName:   localStorage.getItem('geo_loc_country_name')   || null,
        cityName:      localStorage.getItem('geo_loc_city_name')      || null,
        countryCoords: localStorage.getItem('geo_loc_country_coords') || null,
        cityCoords:    localStorage.getItem('geo_loc_city_coords')    || null,
        lat:           (() => { try { return JSON.parse(localStorage.getItem('geo_loc_data') || 'null')?.lat ?? null; } catch { return null; } })(),
        lng:           (() => { try { return JSON.parse(localStorage.getItem('geo_loc_data') || 'null')?.lng ?? null; } catch { return null; } })(),
      };
    } catch { return {}; }
  }

  /**
   * Convert stored "swLat,swLng~neLat,neLng" → Yandex bbox "swLng,swLat~neLng,neLat".
   * Yandex bbox format is: lon_min,lat_min~lon_max,lat_max
   */
  static _toBbox(coordStr) {
    if (!coordStr) return null;
    try {
      const [sw, ne] = coordStr.split('~');
      if (!sw || !ne) return null;
      const [swLat, swLng] = sw.split(',').map(Number);
      const [neLat, neLng] = ne.split(',').map(Number);
      if ([swLat, swLng, neLat, neLng].some(isNaN)) return null;
      return `${swLng},${swLat}~${neLng},${neLat}`;
    } catch { return null; }
  }

  /**
   * Parse a "lng,lat" locationBounds string (the user's CURRENT geolocation,
   * passed down from the rider component) into { lng, lat }.
   * This value takes PRIORITY over everything else (bbox, saved geo, default center)
   * wherever it's supplied to a search call.
   *
   * Includes basic sanity checks so a swapped "lat,lng" string (which would
   * silently bias suggestions to the wrong hemisphere and return nothing)
   * gets flagged instead of failing silently.
   */
  static _parseLocationBounds(locationBounds) {
    if (!locationBounds || typeof locationBounds !== 'string') return null;
    const parts = locationBounds.split(',').map((s) => parseFloat(String(s).trim()));
    if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
      console.warn('[YandexMapsProvider._parseLocationBounds] could not parse:', locationBounds);
      return null;
    }
    const [lng, lat] = parts;

    // Sanity check — lng must be in [-180,180], lat in [-90,90].
    // If this fails, it's very likely the string is "lat,lng" instead of "lng,lat".
    if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
      console.error(
        `[YandexMapsProvider._parseLocationBounds] ⚠️ SUSPECT SWAPPED COORDS —` +
        ` got lng:${lng} lat:${lat} from "${locationBounds}". Expected format is "lng,lat".`
      );
      return null;
    }

    return { lng, lat };
  }

  /**
   * Resolve the user's current CITY/TOWN name from their locationBounds
   * coordinates ("lng,lat"). Tries Yandex's own geocoder first (since we
   * already have a key for it), then falls back to Nominatim reverse
   * geocoding. Results are cached per-coordinate to avoid repeat lookups.
   *
   * Returns '' if nothing could be resolved (caller should search without
   * a city tag in that case, not throw).
   */
  async _resolveCityName(explicitBounds) {
    if (!explicitBounds) return '';

    const cacheKey = _cityCacheKey(explicitBounds.lat, explicitBounds.lng);
    if (_cityNameCache.has(cacheKey)) {
      return _cityNameCache.get(cacheKey);
    }

    let cityName = '';

    // ── Try Yandex geocoder first (we likely already have the key) ────────
    if (this.geocoderKey) {
      try {
        const params = new URLSearchParams({
          apikey:  this.geocoderKey,
          geocode: `${explicitBounds.lng},${explicitBounds.lat}`,
          format:  'json',
          results: '1',
          lang:    'en_US',
        });
        const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
        if (res.ok) {
          const data = await res.json();
          const members = data?.response?.GeoObjectCollection?.featureMember;
          const geo = members?.[0]?.GeoObject;
          const components = geo?.metaDataProperty?.GeocoderMetaData?.Address?.Components ?? [];
          const getKind = (kind) => components.find((c) => c.kind === kind)?.name ?? null;
          cityName = getKind('locality') || getKind('district') || getKind('area') || '';
        }
      } catch (err) {
        console.warn('[YandexMapsProvider._resolveCityName] Yandex geocoder failed:', err?.message);
      }
    }

    // ── Fallback: Nominatim reverse geocode ────────────────────────────────
    if (!cityName) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${explicitBounds.lat}&lon=${explicitBounds.lng}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } },
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data?.address || {};
          cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        }
      } catch (err) {
        console.warn('[YandexMapsProvider._resolveCityName] Nominatim fallback failed:', err?.message);
      }
    }

    _cityNameCache.set(cacheKey, cityName);
    console.log(`[YandexMapsProvider._resolveCityName] resolved city for (${explicitBounds.lat},${explicitBounds.lng}) → "${cityName || '(none)'}"`);
    return cityName;
  }

  /**
   * Drop search results whose coordinates fall outside a radius of the
   * user's current locationBounds. Results without coordinates yet
   * (unresolved Yandex toponym suggestions) are left untouched since
   * there's nothing to measure — they get resolved and can be re-checked
   * only once the user selects them.
   */
  static _filterResultsWithinBounds(results, explicitBounds, maxKm = YANDEX_SEARCH_PROXIMITY_KM) {
    if (!Array.isArray(results) || !explicitBounds) return results;

    const kept = [];
    const dropped = [];

    for (const r of results) {
      if (r.lat == null || r.lng == null) {
        kept.push(r);
        continue;
      }
      const distKm = _haversineKm(explicitBounds.lat, explicitBounds.lng, r.lat, r.lng);
      if (distKm <= maxKm) {
        kept.push(r);
      } else {
        dropped.push({ name: r.main_text || r.name, distKm: Math.round(distKm) });
      }
    }

    if (dropped.length) {
      console.warn('[YandexMapsProvider._filterResultsWithinBounds] dropped out-of-bounds result(s):', dropped);
    }

    return kept;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DISPATCH LAYER
  // ─────────────────────────────────────────────────────────────────────────

  _dispatchSearch(apiMethod, query, countryCode, locationBounds) {
    switch (apiMethod) {
      case 'GeoSuggestAPI':
        return this._geoSuggestSearch(query, countryCode, locationBounds);
      case 'suggest':
      default:
        return this._suggestSearch(query, countryCode, locationBounds);
    }
  }

  _dispatchLocation(apiMethod, ...args) {
    switch (apiMethod) {
      case 'geocoder':
      default:
        return typeof args[0] === 'string'
          ? this._placeDetails(args[0], args[1])
          : this._reverseGeocode(args[0], args[1]);
    }
  }

  _dispatchRoute(apiMethod, origin, destination) {
    switch (apiMethod) {
      case 'routeApi':
      default:
        return this._routeApi(origin, destination);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC SERVICE METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * @param {string} locationBounds – "lng,lat" — the user's CURRENT geolocation
   *   coordinate bounds. Takes PRIORITY over any other spatial bias for both
   *   GeoSuggestAPI (JS-style suggest) and the legacy suggest fallback.
   */
  async searchPlaces(query, countryCode = null, apiMethod = 'GeoSuggestAPI', locationBounds = null) {
    if (!query) return null;
    if (apiMethod === 'GeoSuggestAPI' && !this.geoSuggestApiKey) {
      console.warn('[YandexMapsProvider] searchPlaces: GeoSuggestAPI requested but key is missing — falling back to suggest');
      return this._suggestSearch(query, countryCode, locationBounds);
    }
    if (apiMethod !== 'GeoSuggestAPI' && !this.geocoderKey) return null;
    return this._dispatchSearch(apiMethod, query, countryCode, locationBounds);
  }

  async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoder') {
    // Fast path: coords already attached (e.g. business results from GeoSuggest)
    if (extraData?.lat != null && extraData?.lng != null) {
      return {
        lat:      extraData.lat,
        lng:      extraData.lng,
        address:  extraData.address || extraData.main_text || '',
        name:     extraData.name    || extraData.main_text || '',
        place_id: placeId,
      };
    }
    return this._dispatchLocation(apiMethod, placeId, extraData);
  }

  async reverseGeocode(lat, lng, apiMethod = 'geocoder') {
    if (!this.geocoderKey) return null;
    return this._dispatchLocation(apiMethod, lat, lng);
  }

  async getRoute(origin, destination, apiMethod = 'routeApi') {
    if (!this.geocoderKey) return null;
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

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Yandex GeoSuggest API
  //
  // POST https://suggest-maps.yandex.ru/v1/suggest
  // Key : NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY
  //
  // Query format: "{userText},{cityName}" — cityName is resolved from the
  // user's locationBounds coordinates (via Yandex geocoder, falling back to
  // Nominatim), NOT the country name anymore.
  //
  // Spatial bias PRIORITY:
  //   1. Explicit locationBounds prop ("lng,lat")  → &ll=&spn=0.1,0.1&rspn=0
  //   2. bbox from geo_loc_country_coords / city_coords
  //   3. saved geo_loc_data lat/lng                → &ll=&spn=1,1
  //   4. hardcoded default center
  //
  // Results are returned WITHOUT coordinates (except business results) —
  // toponym coordinates are resolved lazily via _placeDetails / Geocoder
  // only when the user selects an entry. Results that DO carry coordinates
  // are hard-filtered by proximity to locationBounds before being returned.
  //
  // Docs: https://yandex.ru/dev/geosuggest/doc/en/
  // ─────────────────────────────────────────────────────────────────────────

  async _geoSuggestSearch(query, countryCode, locationBounds = null) {
    console.log('[YandexMapsProvider._geoSuggestSearch] locationBounds prop received:', locationBounds);
    console.log(`[YandexMapsProvider._geoSuggestSearch] query:"${query}" locationBounds:"${locationBounds}"`);
    try {
      // ── 3b. Explicit locationBounds prop — TOP PRIORITY ─────────────────
      const explicitBounds = YandexMapsProvider._parseLocationBounds(locationBounds);

      // ── 1. Read saved geolocation (still used for bbox fallback) ────────
      const geo = YandexMapsProvider._readGeoLoc();

      // ── 2. Build city-appended query text ───────────────────────────────
      //    Format: "{userQuery},{cityName}" — city resolved from
      //    locationBounds, NOT the country name.
      const cityTag = (await this._resolveCityName(explicitBounds)).toLowerCase().trim();
      const searchText = cityTag
        ? `${query.trim()},${cityTag}`
        : query.trim();

      console.log(`[YandexMapsProvider._geoSuggestSearch] searchText:"${searchText}" (cityTag:"${cityTag}")`);

      // ── 3. Build bbox from stored coords ──────────────────────────────
      //    Prefer city bbox for tighter results; fall back to country bbox.
      const cityBbox    = YandexMapsProvider._toBbox(geo.cityCoords);
      const countryBbox = YandexMapsProvider._toBbox(geo.countryCoords);
      const bbox        = cityBbox || countryBbox;

      // ── 4. Build params ───────────────────────────────────────────────
      const params = new URLSearchParams({
        apikey:        this.geoSuggestApiKey,
        text:          searchText,
        lang:          'en_US',
        results:       '10',
        types:         'geo,biz',
        print_address: '1',
        attrs:         'uri',      // needed for URI-based geocoder resolution
        highlight:     '0',
      });

      if (explicitBounds) {
        // Format example: &ll=28.334712,-15.520371&spn=0.1,0.1&rspn=0
        console.log(`[YandexMapsProvider._geoSuggestSearch] using PRIORITY locationBounds ll=${explicitBounds.lng},${explicitBounds.lat}`);
        params.set('ll',   `${explicitBounds.lng},${explicitBounds.lat}`);
        params.set('spn',  '0.1,0.1');
        params.set('rspn', '0');
      } else if (bbox) {
        console.log('[YandexMapsProvider._geoSuggestSearch] no locationBounds — falling back to bbox:', bbox);
        // bbox gives the most relevant spatial bias for the user's country/city
        params.set('bbox', bbox);
      } else if (geo.lat != null && geo.lng != null) {
        console.log('[YandexMapsProvider._geoSuggestSearch] no locationBounds/bbox — falling back to saved geo:', geo.lat, geo.lng);
        // Fallback: ll + spn viewport bias
        params.set('ll',  `${geo.lng},${geo.lat}`);
        params.set('spn', '1,1');
      } else {
        console.log('[YandexMapsProvider._geoSuggestSearch] no bias sources available — using hardcoded default center');
        // Hardcoded Lusaka default
        params.set('ll',  `${this._center.lng},${this._center.lat}`);
        params.set('spn', '1,1');
      }

      const requestUrl = `https://suggest-maps.yandex.ru/v1/suggest?${params}`;
      console.log('[YandexMapsProvider._geoSuggestSearch] full request URL:', requestUrl);

      // ── 5. Fetch ──────────────────────────────────────────────────────
      const res = await fetch(requestUrl, { headers: { 'Accept-Language': 'en' } });

      console.log(`[YandexMapsProvider._geoSuggestSearch] HTTP ${res.status}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[YandexMapsProvider._geoSuggestSearch] API error:', res.status, err);
        return null;
      }

      const data  = await res.json();
      const items = data.results ?? [];

      console.log(`[YandexMapsProvider._geoSuggestSearch] ${items.length} raw results`);
      if (!items.length) {
        console.warn('[YandexMapsProvider._geoSuggestSearch] ZERO results — full response:', JSON.stringify(data).slice(0, 500));
        return null;
      }

      // ── 6. Map results ────────────────────────────────────────────────
      let mapped = items.map((item, i) => {
        const titleText    = item.title?.text    || '';
        const subtitleText = item.subtitle?.text || '';

        // URI is present when attrs=uri is set — preferred for geocoder lookup
        const uri  = item.uri || null;
        const tags = Array.isArray(item.tags) ? item.tags : [];

        // Business results sometimes carry coordinates directly
        const coords    = item.geometry?.geometry?.coordinates; // [lng, lat]
        const lng       = Array.isArray(coords) ? Number(coords[0]) : null;
        const lat       = Array.isArray(coords) ? Number(coords[1]) : null;
        const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

        // Full address string used both for display and as geocoder text fallback
        const formattedAddress =
          item.address?.formatted_address ||
          (subtitleText ? `${titleText}, ${subtitleText}` : titleText);

        // Distance from the search center (for sorting)
        const distanceMeters = item.distance?.value ?? null;

        const isBiz = tags.includes('business') || tags.includes('biz');

        return {
          // place_id is the URI when available — _placeDetails detects it
          place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
          main_text:      titleText,
          secondary_text: formattedAddress !== titleText ? formattedAddress : subtitleText,
          address:        formattedAddress,
          name:           titleText,
          // Coords only for business results; toponyms resolved via geocoder on select
          ...(hasCoords ? { lat, lng } : {}),
          distanceMeters,
          _uri:           uri,
          _isBiz:         isBiz,
          _src:           'geosuggest',
        };
      });

      // ── 6b. Hard-filter out-of-bounds results (only affects entries that
      //        already carry coordinates — business results) ──────────────
      if (explicitBounds) {
        mapped = YandexMapsProvider._filterResultsWithinBounds(mapped, explicitBounds);
      }

      if (!mapped.length) {
        console.warn('[YandexMapsProvider._geoSuggestSearch] all results filtered out as out-of-bounds');
        return null;
      }

      // Sort: entries with coords first (faster UX), then by distance
      mapped.sort((a, b) => {
        const aHas = a.lat != null ? 0 : 1;
        const bHas = b.lat != null ? 0 : 1;
        if (aHas !== bHas) return aHas - bHas;
        return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
      });

      console.log(
        '[YandexMapsProvider._geoSuggestSearch] ✅ returning',
        mapped.length, 'results:',
        mapped.map(r => r.main_text).join(' | '),
      );
      return mapped;
    } catch (err) {
      console.error('[YandexMapsProvider._geoSuggestSearch] exception:', err?.message, err);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Yandex Suggest API (legacy fallback)
  // Used when NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is absent.
  //
  // Query format: "{userText},{cityName}" — same city-resolution approach
  // as _geoSuggestSearch, no country tag anymore.
  //
  // Spatial bias PRIORITY:
  //   1. Explicit locationBounds prop ("lng,lat") → &ll=&spn=0.1,0.1&rspn=0
  //   2. this._center default                     → &ll=&spn=1,1
  // ─────────────────────────────────────────────────────────────────────────

  async _suggestSearch(query, countryCode, locationBounds = null) {
    try {
      const explicitBounds = YandexMapsProvider._parseLocationBounds(locationBounds);

      const cityTag = (await this._resolveCityName(explicitBounds)).toLowerCase().trim();
      const searchText = cityTag ? `${query.trim()},${cityTag}` : query.trim();

      const center = explicitBounds || this._center;
      const spn    = explicitBounds ? '0.1,0.1' : '1,1';

      console.log(
        `[YandexMapsProvider._suggestSearch] query:"${query}" locationBounds:"${locationBounds}"` +
        ` cityTag:"${cityTag}" ll:${center.lng},${center.lat} spn:${spn}` +
        ` priority:${explicitBounds ? 'locationBounds' : 'default center'}`,
      );

      const params = new URLSearchParams({
        apikey:  this.geocoderKey,
        text:    searchText,
        lang:    'en_US',
        ll:      `${center.lng},${center.lat}`,
        spn,
        results: '7',
      });
      if (explicitBounds) params.set('rspn', '0');
      if (countryCode) params.set('strict_bounds', '1');

      const requestUrl = `https://suggest-maps.yandex.ru/v1/suggest?${params}`;
      console.log('[YandexMapsProvider._suggestSearch] full request URL:', requestUrl);

      const res = await fetch(requestUrl, { headers: { 'Accept-Language': 'en' } });

      console.log(`[YandexMapsProvider._suggestSearch] HTTP ${res.status}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[YandexMapsProvider._suggestSearch] API error:', res.status, err);
        return null;
      }

      const data  = await res.json();
      const items = data.results ?? [];
      console.log(`[YandexMapsProvider._suggestSearch] ${items.length} raw results`);
      if (!items.length) {
        console.warn('[YandexMapsProvider._suggestSearch] ZERO results — full response:', JSON.stringify(data).slice(0, 500));
        return null;
      }

      let mapped = items.map((item, i) => {
        const title    = item.title?.text    || '';
        const subtitle = item.subtitle?.text || '';
        const uri      = item.uri || null;
        return {
          place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
          main_text:      title,
          secondary_text: subtitle,
          address:        subtitle ? `${title}, ${subtitle}` : title,
          name:           title,
          _uri:           uri,
          _src:           'suggest',
        };
      });

      // Legacy suggest never returns coordinates, so this filter is a no-op
      // today, but kept for consistency in case that ever changes.
      if (explicitBounds) {
        mapped = YandexMapsProvider._filterResultsWithinBounds(mapped, explicitBounds);
      }

      return mapped.length ? mapped : null;
    } catch (err) {
      console.error('[YandexMapsProvider._suggestSearch] error:', err?.message, err);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Geocoder — resolve URI / text → { lat, lng, address, name }
  //
  // This is called when a user selects a suggest result that has no coordinates.
  // URI path is the most reliable (from attrs=uri in GeoSuggest).
  // Text path is a fallback using the formatted address string.
  //
  // Key: NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY
  // ─────────────────────────────────────────────────────────────────────────

  async _placeDetails(placeId, extraData) {
    // Fast path: coords already present (business results from GeoSuggest)
    if (extraData?.lat != null && extraData?.lng != null) {
      return {
        lat:      extraData.lat,
        lng:      extraData.lng,
        address:  extraData.address || extraData.name || extraData.main_text || '',
        name:     extraData.name    || extraData.main_text || '',
        place_id: placeId,
      };
    }

    const isUri = typeof placeId === 'string' && placeId.startsWith('ymapsbm1://');
    const text  = extraData?.address || extraData?.name || extraData?.main_text;

    if (!isUri && !text) {
      console.warn('[YandexMapsProvider._placeDetails] no URI and no text — cannot resolve');
      return null;
    }

    console.log(
      `[YandexMapsProvider._placeDetails] resolving via ${isUri ? 'URI' : 'text'}:`,
      isUri ? placeId : text,
    );

    try {
      const params = new URLSearchParams({
        apikey:  this.geocoderKey,
        format:  'json',
        results: '1',
        lang:    'en_US',
      });

      if (isUri) {
        params.set('uri', placeId);
      } else {
        params.set('geocode', text);
      }

      const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
      if (!res.ok) {
        console.error('[YandexMapsProvider._placeDetails] geocoder HTTP', res.status);
        return null;
      }
      const data = await res.json();

      const members = data?.response?.GeoObjectCollection?.featureMember;
      if (!members?.length) {
        console.warn('[YandexMapsProvider._placeDetails] no geocoder results');
        return null;
      }

      const geo  = members[0].GeoObject;
      const pos  = geo.Point?.pos?.split(' ');
      if (!pos || pos.length < 2) return null;

      const resolvedLng = parseFloat(pos[0]);
      const resolvedLat = parseFloat(pos[1]);

      const meta       = geo.metaDataProperty?.GeocoderMetaData;
      const address    = meta?.Address;
      const components = address?.Components ?? [];
      const getKind    = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

      const fullAddress = address?.formatted || text || '';
      const name        = (extraData?.name || extraData?.main_text || fullAddress.split(',')[0] || '').trim();

      const result = {
        lat:           resolvedLat,
        lng:           resolvedLng,
        address:       fullAddress,
        name,
        place_id:      isUri ? placeId : `yandex_${resolvedLng}_${resolvedLat}`,
        // Extra detail fields for callers that want them
        city:          getKind('locality') || getKind('district') || null,
        country:       getKind('country')  || null,
        postalCode:    address?.postal_code ?? null,
        state:         getKind('province') || getKind('area') || null,
        streetAddress: getKind('street')   || null,
        streetNumber:  getKind('house')    || null,
      };

      console.log('[YandexMapsProvider._placeDetails] ✅ resolved', {
        lat: result.lat, lng: result.lng, address: result.address,
      });
      return result;
    } catch (err) {
      console.error('[YandexMapsProvider._placeDetails] error:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Yandex Geocoder — latlng → address
  // ─────────────────────────────────────────────────────────────────────────

  async _reverseGeocode(lat, lng) {
    try {
      const params = new URLSearchParams({
        apikey:  this.geocoderKey,
        geocode: `${lng},${lat}`,
        format:  'json',
        results: '1',
        lang:    'en_US',
      });
      const res  = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
      if (!res.ok) return null;
      const data = await res.json();

      const members = data?.response?.GeoObjectCollection?.featureMember;
      if (!members?.length) return null;

      const geo        = members[0].GeoObject;
      const meta       = geo.metaDataProperty?.GeocoderMetaData;
      const address    = meta?.Address;
      const components = address?.Components ?? [];
      const getKind    = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

      return {
        lat, lng,
        address:       address?.formatted || '',
        name:          getKind('locality') || getKind('district') || getKind('province') || 'Unknown',
        place_id:      `yandex_${lng}_${lat}`,
        city:          getKind('locality') || getKind('district'),
        country:       getKind('country'),
        postalCode:    address?.postal_code ?? null,
        state:         getKind('province')  || getKind('area'),
        streetAddress: getKind('street'),
        streetNumber:  getKind('house'),
      };
    } catch (err) {
      console.error('[YandexMapsProvider._reverseGeocode] error:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Yandex Router API
  // ─────────────────────────────────────────────────────────────────────────

  async _routeApi(origin, destination) {
    try {
      const params = new URLSearchParams({
        apikey:    this.geocoderKey,
        waypoints: `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`,
        mode:      'driving',
        lang:      'en_US',
        format:    'json',
      });
      const res  = await fetch(`https://api.routing.yandex.net/v2/route?${params}`);
      if (!res.ok) throw new Error(`Yandex Router ${res.status}`);

      const data = await res.json();
      const legs = data?.route?.legs ?? [];

      let totalDistanceM = 0;
      let totalDurationS = 0;
      const geometry     = [];

      for (const leg of legs) {
        totalDistanceM += Number(leg.length   ?? 0);
        totalDurationS += Number(leg.duration ?? 0);
        for (const step of (leg.steps ?? [])) {
          if (step.polyline) geometry.push(...decodeYandexPolyline(step.polyline));
          else if (step.maneuver?.position) {
            geometry.push([step.maneuver.position.lon, step.maneuver.position.lat]);
          }
        }
      }

      const km  = totalDistanceM / 1000;
      const min = totalDurationS / 60;

      return {
        type:          'yandex',
        distance:      km  >= 1 ? `${km.toFixed(1)} km`                                  : `${Math.round(totalDistanceM)} m`,
        duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
        distanceValue: Math.round(totalDistanceM),
        durationValue: Math.round(totalDurationS),
        geometry,
        steps: [],
      };
    } catch (err) {
      console.error('[YandexMapsProvider._routeApi] error:', err?.message);
      return null;
    }
  }
}

export default YandexMapsProvider;

// ─────────────────────────────────────────────────────────────────────────────
// Decode Yandex / Google encoded polyline → [[lng, lat], ...]
// ─────────────────────────────────────────────────────────────────────────────
function decodeYandexPolyline(encoded) {
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