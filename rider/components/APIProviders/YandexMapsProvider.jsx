// // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx

// // // // export class YandexMapsProvider {
// // // //   constructor(apiKey) {
// // // //     this.apiKey       = apiKey;
// // // //     this.name         = 'yandexmaps';
// // // //     this.geocoderBase = 'https://geocode-maps.yandex.ru/1.x/';
// // // //     this.suggestBase  = 'https://suggest-maps.yandex.ru/v1/suggest'; // ← v1, not /suggest-geo
// // // //   }

// // // //   // ── Yandex Suggest v1 ────────────────────────────────────────────────────
// // // //   // The v1 API returns a `uri` field on every result like:
// // // //   //   "ymapsbm1://geo?ll=28.2833%2C-15.4167&..."
// // // //   // We extract the coordinates from it, so no extra geocoder round-trip is needed.
// // // //   async searchPlaces(query, countryCode = null) {
// // // //     console.log('yandex',query)
// // // //     if (!this.apiKey) {
// // // //       console.warn('[YandexMapsProvider] No API key set');
// // // //       return null;
// // // //     }
// // // //     try {
// // // //       const params = new URLSearchParams({
// // // //         apikey:  this.apiKey,
// // // //         text:    query,
// // // //         lang:    'en_US',
// // // //         results: '7',
// // // //         types:   'geo',            // toponyms only (no businesses)
// // // //         print_address: '1',
// // // //       });

// // // //       const res = await fetch(`${this.suggestBase}?${params}`);

// // // //       if (!res.ok) {
// // // //         console.warn('[YandexMapsProvider] Suggest API returned', res.status, res.statusText);
// // // //         return null;
// // // //       }

// // // //       const data = await res.json();
// // // //       const items = data?.results ?? [];

// // // //       if (!items.length) return [];

// // // //       return items.map((item, i) => {
// // // //         const mainText  = item.title?.text    || '';
// // // //         const subText   = item.subtitle?.text || '';

// // // //         // Extract coordinates from the URI (free, no extra API call)
// // // //         // URI looks like: ymapsbm1://geo?ll=28.2833%2C-15.4167&spn=...
// // // //         let lat = null, lng = null;
// // // //         if (item.uri) {
// // // //           const llMatch = item.uri.match(/ll=([^&]+)/);
// // // //           if (llMatch) {
// // // //             const parts = decodeURIComponent(llMatch[1]).split(',');
// // // //             if (parts.length === 2) {
// // // //               lng = parseFloat(parts[0]);
// // // //               lat = parseFloat(parts[1]);
// // // //             }
// // // //           }
// // // //         }

// // // //         return {
// // // //           place_id:       `yandex_${i}_${Date.now()}`,
// // // //           main_text:      mainText,
// // // //           secondary_text: subText,
// // // //           address:        subText ? `${mainText}, ${subText}` : mainText,
// // // //           name:           mainText,
// // // //           // If we got coordinates from the URI, store them directly
// // // //           // so getPlaceDetails can return immediately without a geocoder call
// // // //           lat,
// // // //           lng,
// // // //           // If URI had no coords, store the raw text for a geocoder fallback
// // // //           _rawText: `${mainText}${subText ? ', ' + subText : ''}`,
// // // //           _uri:     item.uri || null,
// // // //         };
// // // //       });
// // // //     } catch (err) {
// // // //       console.error('[YandexMapsProvider] searchPlaces error:', err);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   // ── Place details ────────────────────────────────────────────────────────
// // // //   // Called after the user selects a suggestion.
// // // //   // • If the suggestion already has lat/lng (from URI parsing above) → return immediately
// // // //   // • Otherwise geocode the _rawText
// // // //   async getPlaceDetails(placeId, extraData = null) {
// // // //     // Fast path — suggestion already had coords in its URI
// // // //     if (extraData?.lat != null && extraData?.lng != null) {
// // // //       return {
// // // //         lat:      extraData.lat,
// // // //         lng:      extraData.lng,
// // // //         address:  extraData.address || extraData.main_text || extraData.name || '',
// // // //         name:     extraData.name    || extraData.main_text || '',
// // // //         place_id: placeId,
// // // //       };
// // // //     }

// // // //     // Slow path — geocode the raw text string
// // // //     const textToGeocode = extraData?._rawText || extraData?.name || extraData?.address;
// // // //     if (!textToGeocode) {
// // // //       console.warn('[YandexMapsProvider] getPlaceDetails: no text to geocode for', placeId);
// // // //       return null;
// // // //     }

// // // //     const result = await this.geocodeAddress(textToGeocode);
// // // //     if (!result) return null;

// // // //     return {
// // // //       lat:      result.lat,
// // // //       lng:      result.lng,
// // // //       address:  result.address,
// // // //       name:     textToGeocode.split(',')[0],
// // // //       place_id: placeId,
// // // //     };
// // // //   }

// // // //   // ── Geocoder HTTP API — forward geocoding ────────────────────────────────
// // // //   async geocodeAddress(address) {
// // // //     if (!this.apiKey) return null;
// // // //     try {
// // // //       const params = new URLSearchParams({
// // // //         apikey:  this.apiKey,
// // // //         geocode: address,
// // // //         format:  'json',
// // // //         results: '1',
// // // //         lang:    'en_US',
// // // //       });

// // // //       const res = await fetch(`${this.geocoderBase}?${params}`);
// // // //       if (!res.ok) {
// // // //         console.warn('[YandexMapsProvider] geocodeAddress HTTP', res.status);
// // // //         return null;
// // // //       }
// // // //       const data = await res.json();

// // // //       const members = data?.response?.GeoObjectCollection?.featureMember;
// // // //       if (!members?.length) return null;

// // // //       const obj = members[0].GeoObject;
// // // //       const pos = obj.Point?.pos?.split(' ');
// // // //       if (!pos || pos.length < 2) return null;

// // // //       const lng = parseFloat(pos[0]);
// // // //       const lat = parseFloat(pos[1]);

// // // //       return {
// // // //         lat,
// // // //         lng,
// // // //         address:  obj.metaDataProperty?.GeocoderMetaData?.Address?.formatted || address,
// // // //         place_id: `yandex_geo_${lng}_${lat}`,
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[YandexMapsProvider] geocodeAddress error:', err);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   // ── Geocoder HTTP API — reverse geocoding ────────────────────────────────
// // // //   async reverseGeocode(lat, lng) {
// // // //     if (!this.apiKey) return null;
// // // //     try {
// // // //       const params = new URLSearchParams({
// // // //         apikey:  this.apiKey,
// // // //         geocode: `${lng},${lat}`,   // Yandex uses lng,lat order
// // // //         format:  'json',
// // // //         results: '1',
// // // //         lang:    'en_US',
// // // //       });

// // // //       const res = await fetch(`${this.geocoderBase}?${params}`);
// // // //       if (!res.ok) {
// // // //         console.warn('[YandexMapsProvider] reverseGeocode HTTP', res.status);
// // // //         return null;
// // // //       }
// // // //       const data = await res.json();

// // // //       const members = data?.response?.GeoObjectCollection?.featureMember;
// // // //       if (!members?.length) return null;

// // // //       const obj        = members[0].GeoObject;
// // // //       const metaAddr   = obj.metaDataProperty?.GeocoderMetaData?.Address;
// // // //       const components = metaAddr?.Components || [];

// // // //       const getKind = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

// // // //       return {
// // // //         lat,
// // // //         lng,
// // // //         address:       metaAddr?.formatted || '',
// // // //         name:          getKind('locality') || getKind('district') || getKind('province') || 'Unknown',
// // // //         place_id:      `yandex_geo_${lng}_${lat}`,
// // // //         city:          getKind('locality')  || getKind('district'),
// // // //         country:       getKind('country'),
// // // //         postalCode:    metaAddr?.postal_code ?? null,
// // // //         state:         getKind('province')  || getKind('area'),
// // // //         streetAddress: getKind('street'),
// // // //         streetNumber:  getKind('house'),
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[YandexMapsProvider] reverseGeocode error:', err);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   // ── Distance (haversine — no API call) ───────────────────────────────────
// // // //   calculateDistance(lat1, lon1, lat2, lon2) {
// // // //     const R    = 6371;
// // // //     const dLat = (lat2 - lat1) * (Math.PI / 180);
// // // //     const dLon = (lon2 - lon1) * (Math.PI / 180);
// // // //     const a =
// // // //       Math.sin(dLat / 2) ** 2 +
// // // //       Math.cos(lat1 * (Math.PI / 180)) *
// // // //       Math.cos(lat2 * (Math.PI / 180)) *
// // // //       Math.sin(dLon / 2) ** 2;
// // // //     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // // //   }
// // // // }

// // // // export default YandexMapsProvider;
// // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx

// // // export class YandexMapsProvider {
// // //   constructor(apiKey) {
// // //     this.apiKey       = apiKey;
// // //     this.name         = 'yandexmaps';
// // //     this.geocoderBase = 'https://geocode-maps.yandex.ru/1.x/';
// // //   //   this.suggestBase  = 'https://suggest-maps.yandex.ru/v1/suggest'; // ← v1, not /suggest-geo
// // //    }

// // //   // ── Yandex Suggest v1 ────────────────────────────────────────────────────
// // //   // The v1 API returns a `uri` field on every result like:
// // //   //   "ymapsbm1://geo?ll=28.2833%2C-15.4167&..."
// // //   // We extract the coordinates from it, so no extra geocoder round-trip is needed.
// // //   // async searchPlaces(query, countryCode = null) {
// // //   //   console.log('[YandexMapsProvider] searchPlaces called with query:', query);
// // //   //   if (!this.apiKey) {
// // //   //     console.warn('[YandexMapsProvider] No API key set');
// // //   //     return null;
// // //   //   }
// // //   //   try {
// // //   //     const params = new URLSearchParams({
// // //   //       apikey:  this.apiKey,
// // //   //       text:    query,
// // //   //       lang:    'en_US',
// // //   //       results: '7',
// // //   //       types:   'geo',            // toponyms only (no businesses)
// // //   //       print_address: '1',
// // //   //     });

// // //   //     const url = `${this.suggestBase}?${params}`;
// // //   //     console.log('[YandexMapsProvider] fetch URL:', url);
// // //   //     const res = await fetch(url);
// // //   //     console.log('[YandexMapsProvider] fetch response status:', res.status);

// // //   //     if (!res.ok) {
// // //   //       console.warn('[YandexMapsProvider] Suggest API returned', res.status, res.statusText);
// // //   //       return null;
// // //   //     }

// // //   //     const data = await res.json();
// // //   //     console.log('[YandexMapsProvider] suggest data:', data);
// // //   //     const items = data?.results ?? [];

// // //   //     if (!items.length) return [];

// // //   //     return items.map((item, i) => {
// // //   //       const mainText  = item.title?.text    || '';
// // //   //       const subText   = item.subtitle?.text || '';

// // //   //       // Extract coordinates from the URI (free, no extra API call)
// // //   //       // URI looks like: ymapsbm1://geo?ll=28.2833%2C-15.4167&spn=...
// // //   //       let lat = null, lng = null;
// // //   //       if (item.uri) {
// // //   //         const llMatch = item.uri.match(/ll=([^&]+)/);
// // //   //         if (llMatch) {
// // //   //           const parts = decodeURIComponent(llMatch[1]).split(',');
// // //   //           if (parts.length === 2) {
// // //   //             lng = parseFloat(parts[0]);
// // //   //             lat = parseFloat(parts[1]);
// // //   //           }
// // //   //         }
// // //   //       }

// // //   //       return {
// // //   //         place_id:       `yandex_${i}_${Date.now()}`,
// // //   //         main_text:      mainText,
// // //   //         secondary_text: subText,
// // //   //         address:        subText ? `${mainText}, ${subText}` : mainText,
// // //   //         name:           mainText,
// // //   //         // If we got coordinates from the URI, store them directly
// // //   //         // so getPlaceDetails can return immediately without a geocoder call
// // //   //         lat,
// // //   //         lng,
// // //   //         // If URI had no coords, store the raw text for a geocoder fallback
// // //   //         _rawText: `${mainText}${subText ? ', ' + subText : ''}`,
// // //   //         _uri:     item.uri || null,
// // //   //       };
// // //   //     });
// // //   //   } catch (err) {
// // //   //     console.error('[YandexMapsProvider] searchPlaces error:', err);
// // //   //     return null;
// // //   //   }
// // //   // }
// // //   // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx

// // //   async searchPlaces(query, countryCode = null) {
// // //     console.log('[YandexMapsProvider] searchPlaces called with query:', query);
// // //     if (!this.apiKey) {
// // //       console.warn('[YandexMapsProvider] No API key set');
// // //       return null;
// // //     }
// // //     try {
// // //       const params = new URLSearchParams({
// // //         apikey:  this.apiKey,
// // //         geocode: query,
// // //         format:  'json',
// // //         results: '7',
// // //         lang:    'en_US',
// // //       });

// // //       const url = `${this.geocoderBase}?${params}`;
// // //       console.log('[YandexMapsProvider] fetch URL:', url);
// // //       const res = await fetch(url);
// // //       console.log('[YandexMapsProvider] fetch response status:', res.status);

// // //       if (!res.ok) {
// // //         console.warn('[YandexMapsProvider] Geocoder API returned', res.status);
// // //         return null;
// // //       }

// // //       const data = await res.json();
// // //       console.log('[YandexMapsProvider] geocoder data:', data);

// // //       const members = data?.response?.GeoObjectCollection?.featureMember || [];
// // //       if (!members.length) return [];

// // //       return members.map((member, i) => {
// // //         const obj = member.GeoObject;
// // //         const pos = obj.Point?.pos?.split(' ');
// // //         let lat = null, lng = null;
// // //         if (pos && pos.length === 2) {
// // //           lng = parseFloat(pos[0]);
// // //           lat = parseFloat(pos[1]);
// // //         }

// // //         const name = obj.name || '';
// // //         const description = obj.description || '';
// // //         const address = obj.metaDataProperty?.GeocoderMetaData?.Address?.formatted || description || name;

// // //         return {
// // //           place_id:       `yandex_geo_${i}_${Date.now()}`,
// // //           main_text:      name,
// // //           secondary_text: description,
// // //           address:        address,
// // //           name:           name,
// // //           lat,
// // //           lng,
// // //           _rawText:       address,
// // //         };
// // //       });
// // //     } catch (err) {
// // //       console.error('[YandexMapsProvider] searchPlaces error:', err);
// // //       return null;
// // //     }
// // //   }

// // //   // ── Place details ────────────────────────────────────────────────────────
// // //   // Called after the user selects a suggestion.
// // //   // • If the suggestion already has lat/lng (from URI parsing above) → return immediately
// // //   // • Otherwise geocode the _rawText
// // //   async getPlaceDetails(placeId, extraData = null) {
// // //     console.log('[YandexMapsProvider] getPlaceDetails called with placeId:', placeId, 'extraData:', extraData);
// // //     // Fast path — suggestion already had coords in its URI
// // //     if (extraData?.lat != null && extraData?.lng != null) {
// // //       console.log('[YandexMapsProvider] using fast path (coords already present)');
// // //       return {
// // //         lat:      extraData.lat,
// // //         lng:      extraData.lng,
// // //         address:  extraData.address || extraData.main_text || extraData.name || '',
// // //         name:     extraData.name    || extraData.main_text || '',
// // //         place_id: placeId,
// // //       };
// // //     }

// // //     // Slow path — geocode the raw text string
// // //     const textToGeocode = extraData?._rawText || extraData?.name || extraData?.address;
// // //     console.log('[YandexMapsProvider] textToGeocode:', textToGeocode);
// // //     if (!textToGeocode) {
// // //       console.warn('[YandexMapsProvider] getPlaceDetails: no text to geocode for', placeId);
// // //       return null;
// // //     }

// // //     const result = await this.geocodeAddress(textToGeocode);
// // //     console.log('[YandexMapsProvider] geocodeAddress result:', result);
// // //     if (!result) return null;

// // //     return {
// // //       lat:      result.lat,
// // //       lng:      result.lng,
// // //       address:  result.address,
// // //       name:     textToGeocode.split(',')[0],
// // //       place_id: placeId,
// // //     };
// // //   }

// // //   // ── Geocoder HTTP API — forward geocoding ────────────────────────────────
// // //   async geocodeAddress(address) {
// // //     console.log('[YandexMapsProvider] geocodeAddress called with address:', address);
// // //     if (!this.apiKey) return null;
// // //     try {
// // //       const params = new URLSearchParams({
// // //         apikey:  this.apiKey,
// // //         geocode: address,
// // //         format:  'json',
// // //         results: '1',
// // //         lang:    'en_US',
// // //       });

// // //       const url = `${this.geocoderBase}?${params}`;
// // //       console.log('[YandexMapsProvider] geocodeAddress URL:', url);
// // //       const res = await fetch(url);
// // //       console.log('[YandexMapsProvider] geocodeAddress response status:', res.status);
// // //       if (!res.ok) {
// // //         console.warn('[YandexMapsProvider] geocodeAddress HTTP', res.status);
// // //         return null;
// // //       }
// // //       const data = await res.json();
// // //       console.log('[YandexMapsProvider] geocodeAddress data:', data);

// // //       const members = data?.response?.GeoObjectCollection?.featureMember;
// // //       if (!members?.length) return null;

// // //       const obj = members[0].GeoObject;
// // //       const pos = obj.Point?.pos?.split(' ');
// // //       if (!pos || pos.length < 2) return null;

// // //       const lng = parseFloat(pos[0]);
// // //       const lat = parseFloat(pos[1]);

// // //       return {
// // //         lat,
// // //         lng,
// // //         address:  obj.metaDataProperty?.GeocoderMetaData?.Address?.formatted || address,
// // //         place_id: `yandex_geo_${lng}_${lat}`,
// // //       };
// // //     } catch (err) {
// // //       console.error('[YandexMapsProvider] geocodeAddress error:', err);
// // //       return null;
// // //     }
// // //   }

// // //   // ── Geocoder HTTP API — reverse geocoding ────────────────────────────────
// // //   async reverseGeocode(lat, lng) {
// // //     console.log('[YandexMapsProvider] reverseGeocode called for lat:', lat, 'lng:', lng);
// // //     if (!this.apiKey) return null;
// // //     try {
// // //       const params = new URLSearchParams({
// // //         apikey:  this.apiKey,
// // //         geocode: `${lng},${lat}`,   // Yandex uses lng,lat order
// // //         format:  'json',
// // //         results: '1',
// // //         lang:    'en_US',
// // //       });

// // //       const url = `${this.geocoderBase}?${params}`;
// // //       console.log('[YandexMapsProvider] reverseGeocode URL:', url);
// // //       const res = await fetch(url);
// // //       console.log('[YandexMapsProvider] reverseGeocode response status:', res.status);
// // //       if (!res.ok) {
// // //         console.warn('[YandexMapsProvider] reverseGeocode HTTP', res.status);
// // //         return null;
// // //       }
// // //       const data = await res.json();
// // //       console.log('[YandexMapsProvider] reverseGeocode data:', data);

// // //       const members = data?.response?.GeoObjectCollection?.featureMember;
// // //       if (!members?.length) return null;

// // //       const obj        = members[0].GeoObject;
// // //       const metaAddr   = obj.metaDataProperty?.GeocoderMetaData?.Address;
// // //       const components = metaAddr?.Components || [];

// // //       const getKind = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

// // //       return {
// // //         lat,
// // //         lng,
// // //         address:       metaAddr?.formatted || '',
// // //         name:          getKind('locality') || getKind('district') || getKind('province') || 'Unknown',
// // //         place_id:      `yandex_geo_${lng}_${lat}`,
// // //         city:          getKind('locality')  || getKind('district'),
// // //         country:       getKind('country'),
// // //         postalCode:    metaAddr?.postal_code ?? null,
// // //         state:         getKind('province')  || getKind('area'),
// // //         streetAddress: getKind('street'),
// // //         streetNumber:  getKind('house'),
// // //       };
// // //     } catch (err) {
// // //       console.error('[YandexMapsProvider] reverseGeocode error:', err);
// // //       return null;
// // //     }
// // //   }

// // //   // ── Distance (haversine — no API call) ───────────────────────────────────
// // //   calculateDistance(lat1, lon1, lat2, lon2) {
// // //     const R    = 6371;
// // //     const dLat = (lat2 - lat1) * (Math.PI / 180);
// // //     const dLon = (lon2 - lon1) * (Math.PI / 180);
// // //     const a =
// // //       Math.sin(dLat / 2) ** 2 +
// // //       Math.cos(lat1 * (Math.PI / 180)) *
// // //       Math.cos(lat2 * (Math.PI / 180)) *
// // //       Math.sin(dLon / 2) ** 2;
// // //     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // //   }
// // // }

// // // export default YandexMapsProvider;
// // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx
// // //
// // // Yandex Maps via Geocoder HTTP API.
// // // Env: NEXT_PUBLIC_YANDEX_MAPS_API_KEY
// // //
// // // searchPlaces uses `ll` + `spn` params for geographic bias so results are
// // // local rather than global.

// // const GEOCODER_BASE = 'https://geocode-maps.yandex.ru/1.x/';

// // export class YandexMapsProvider {
// //   constructor(apiKey) {
// //     this.apiKey  = apiKey;
// //     this.name    = 'yandexmaps';
// //     // Default center bias — Lusaka, Zambia. Updated via setCenter().
// //     this._center = { lat: -15.4167, lng: 28.2833 };
// //     console.log('[YandexMapsProvider] constructor — apiKey present:', !!apiKey);
// //   }

// //   // Allow map display / MapsProvider to push the current viewport center
// //   setCenter(lat, lng) {
// //     this._center = { lat, lng };
// //   }

// //   // ── Internal geocoder fetch ────────────────────────────────────────────────
// //   async _geocode(params) {
// //     if (!this.apiKey) {
// //       console.warn('[YandexMapsProvider._geocode] ❌ no apiKey');
// //       return null;
// //     }
// //     const url = new URL(GEOCODER_BASE);
// //     url.searchParams.set('apikey', this.apiKey);
// //     url.searchParams.set('format', 'json');
// //     url.searchParams.set('lang',   'en_US');
// //     for (const [k, v] of Object.entries(params)) {
// //       url.searchParams.set(k, v);
// //     }
// //     console.log('[YandexMapsProvider._geocode] GET', url.toString().replace(this.apiKey, '***'));
// //     const res = await fetch(url.toString());
// //     if (!res.ok) {
// //       console.error('[YandexMapsProvider._geocode] HTTP', res.status);
// //       return null;
// //     }
// //     return res.json();
// //   }

// //   // ── Parse GeoObjectCollection → normalized result array ───────────────────
// //   _parseCollection(json) {
// //     try {
// //       const members = json
// //         ?.response
// //         ?.GeoObjectCollection
// //         ?.featureMember || [];

// //       return members.map((m, i) => {
// //         const obj      = m.GeoObject;
// //         const meta     = obj?.metaDataProperty?.GeocoderMetaData;
// //         const posStr   = obj?.Point?.pos; // "lng lat"
// //         const [lng, lat] = posStr ? posStr.split(' ').map(Number) : [null, null];
// //         const address  = meta?.text || obj?.name || '';
// //         const name     = obj?.name || address.split(',')[0];
// //         const kind     = meta?.kind;

// //         // Build place_id that encodes coordinates so getPlaceDetails can skip re-geocoding
// //         const place_id = lat != null && lng != null
// //           ? `yandex_${lat.toFixed(6)}_${lng.toFixed(6)}_${i}`
// //           : `yandex_${i}_${Date.now()}`;

// //         return {
// //           place_id,
// //           main_text:      name,
// //           secondary_text: address,
// //           address,
// //           name,
// //           lat,
// //           lng,
// //           _kind: kind,
// //         };
// //       }).filter((r) => r.lat != null && r.lng != null);
// //     } catch (err) {
// //       console.error('[YandexMapsProvider._parseCollection] parse error:', err?.message);
// //       return [];
// //     }
// //   }

// //   // ── Search places ─────────────────────────────────────────────────────────
// //   // Uses `ll` (center lng,lat) + `spn` (span in degrees) to bias results to
// //   // the current viewport area. This is what stops Yandex returning random
// //   // places from the other side of the world.
// //   async searchPlaces(query, countryCode = null) {
// //     console.log('[YandexMapsProvider.searchPlaces] ▶ query:', JSON.stringify(query), '| center:', this._center);

// //     const { lat, lng } = this._center;

// //     // `rspn=1` restricts results to the ll+spn bounding box strictly
// //     // `rspn=0` uses ll+spn as a bias (prefer local results, allow others)
// //     // We use rspn=0 so short/ambiguous queries still return something.
// //     const params = {
// //       geocode: query,
// //       results: 7,
// //       ll:      `${lng},${lat}`,   // Yandex uses lng,lat order for ll
// //       spn:     '1.5,1.5',         // ~150 km span either side
// //       rspn:    0,                  // bias (not strict restriction)
// //     };

// //     // Country filter: Yandex supports `bbox` but not direct country code.
// //     // For strict country filtering, callers should include the country name in query.
// //     // We log it but can't enforce it via API param.
// //     if (countryCode) {
// //       console.log('[YandexMapsProvider.searchPlaces] countryCode hint (informational):', countryCode);
// //     }

// //     try {
// //       const json    = await this._geocode(params);
// //       const results = this._parseCollection(json);
// //       console.log('[YandexMapsProvider.searchPlaces] ✅ parsed', results.length, 'results:', results.map(r => r.main_text).join(', '));
// //       return results.length ? results : null;
// //     } catch (err) {
// //       console.error('[YandexMapsProvider.searchPlaces] ❌ error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ── Place details ─────────────────────────────────────────────────────────
// //   // Yandex place_ids encode lat/lng — extract them to skip a re-geocode.
// //   async getPlaceDetails(placeId, extraData = null) {
// //     console.log('[YandexMapsProvider.getPlaceDetails] placeId:', placeId);

// //     // Fast path: coordinates already in extraData
// //     if (extraData?.lat != null && extraData?.lng != null) {
// //       return {
// //         lat:      extraData.lat,
// //         lng:      extraData.lng,
// //         address:  extraData.address  || extraData.secondary_text || extraData.main_text || '',
// //         name:     extraData.name     || extraData.main_text || '',
// //         place_id: placeId,
// //       };
// //     }

// //     // Fast path: extract lat/lng encoded in place_id (yandex_lat_lng_idx)
// //     const match = placeId?.match(/^yandex_([-\d.]+)_([-\d.]+)/);
// //     if (match) {
// //       const lat = parseFloat(match[1]);
// //       const lng = parseFloat(match[2]);
// //       if (!isNaN(lat) && !isNaN(lng)) {
// //         return {
// //           lat, lng,
// //           address:  extraData?.address || extraData?.secondary_text || extraData?.main_text || '',
// //           name:     extraData?.name    || extraData?.main_text || '',
// //           place_id: placeId,
// //         };
// //       }
// //     }

// //     // Slow path: re-geocode by address text
// //     const text = extraData?._rawText || extraData?.name || extraData?.address || extraData?.main_text;
// //     if (!text) return null;
// //     return this.geocodeAddress(text);
// //   }

// //   // ── Forward geocode ───────────────────────────────────────────────────────
// //   async geocodeAddress(address) {
// //     console.log('[YandexMapsProvider.geocodeAddress] address:', address);
// //     try {
// //       const json    = await this._geocode({ geocode: address, results: 1 });
// //       const results = this._parseCollection(json);
// //       if (!results.length) return null;
// //       const r = results[0];
// //       return {
// //         lat:      r.lat,
// //         lng:      r.lng,
// //         address:  r.address,
// //         name:     r.name,
// //         place_id: r.place_id,
// //       };
// //     } catch (err) {
// //       console.error('[YandexMapsProvider.geocodeAddress] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ── Reverse geocode ───────────────────────────────────────────────────────
// //   async reverseGeocode(lat, lng) {
// //     console.log('[YandexMapsProvider.reverseGeocode]', lat, lng);
// //     try {
// //       const json    = await this._geocode({ geocode: `${lng},${lat}`, results: 1 });
// //       const results = this._parseCollection(json);
// //       if (!results.length) return null;
// //       const r = results[0];
// //       return {
// //         lat:  r.lat,
// //         lng:  r.lng,
// //         address: r.address,
// //         name:    r.name,
// //         place_id: r.place_id,
// //       };
// //     } catch (err) {
// //       console.error('[YandexMapsProvider.reverseGeocode] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ── Navigation deep link ──────────────────────────────────────────────────
// //   getNavigationDeepLink(destination, origin = null) {
// //     const dest = `${destination.lat},${destination.lng}`;
// //     const base = origin
// //       ? `https://yandex.com/maps/?rtext=${origin.lat},${origin.lng}~${dest}&rtt=auto`
// //       : `https://yandex.com/maps/?pt=${dest}&z=16`;
// //     return { webUrl: base, appUrl: null, isMobile: false };
// //   }

// //   openNavigation(destination, origin = null) {
// //     const { webUrl } = this.getNavigationDeepLink(destination, origin);
// //     window.open(webUrl, '_blank');
// //   }

// //   calculateDistance(lat1, lon1, lat2, lon2) {
// //     const R    = 6371;
// //     const dLat = (lat2 - lat1) * Math.PI / 180;
// //     const dLon = (lon2 - lon1) * Math.PI / 180;
// //     const a    = Math.sin(dLat / 2) ** 2 +
// //                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
// //                  Math.sin(dLon / 2) ** 2;
// //     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// //   }
// // }

// // export default YandexMapsProvider;
// // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx
// //
// // Yandex Maps via Geocoder HTTP API.
// // Env: NEXT_PUBLIC_YANDEX_MAPS_API_KEY
// //
// // searchPlaces uses `ll` + `spn` params for geographic bias so results are
// // local rather than global.

// const GEOCODER_BASE = 'https://geocode-maps.yandex.ru/1.x/';

// export class YandexMapsProvider {
//   constructor(apiKey) {
//     this.apiKey  = apiKey;
//     this.name    = 'yandexmaps';
//     // Default center bias — Lusaka, Zambia. Updated via setCenter().
//     this._center = { lat: -15.4167, lng: 28.2833 };
//     console.log('[YandexMapsProvider] constructor — apiKey present:', !!apiKey);
//   }

//   // Allow map display / MapsProvider to push the current viewport center
//   setCenter(lat, lng) {
//     this._center = { lat, lng };
//   }

//   // ── Internal geocoder fetch ────────────────────────────────────────────────
//   async _geocode(params) {
//     if (!this.apiKey) {
//       console.warn('[YandexMapsProvider._geocode] ❌ no apiKey');
//       return null;
//     }
//     const url = new URL(GEOCODER_BASE);
//     url.searchParams.set('apikey', this.apiKey);
//     url.searchParams.set('format', 'json');
//     url.searchParams.set('lang',   'en_US');
//     for (const [k, v] of Object.entries(params)) {
//       url.searchParams.set(k, v);
//     }
//     console.log('[YandexMapsProvider._geocode] GET', url.toString().replace(this.apiKey, '***'));
//     const res = await fetch(url.toString());
//     if (!res.ok) {
//       console.error('[YandexMapsProvider._geocode] HTTP', res.status);
//       return null;
//     }
//     return res.json();
//   }

//   // ── Parse GeoObjectCollection → normalized result array ───────────────────
//   _parseCollection(json) {
//     try {
//       const members = json
//         ?.response
//         ?.GeoObjectCollection
//         ?.featureMember || [];

//       return members.map((m, i) => {
//         const obj      = m.GeoObject;
//         const meta     = obj?.metaDataProperty?.GeocoderMetaData;
//         const posStr   = obj?.Point?.pos; // "lng lat"
//         const [lng, lat] = posStr ? posStr.split(' ').map(Number) : [null, null];
//         const address  = meta?.text || obj?.name || '';
//         const name     = obj?.name || address.split(',')[0];
//         const kind     = meta?.kind;

//         // Build place_id that encodes coordinates so getPlaceDetails can skip re-geocoding
//         const place_id = lat != null && lng != null
//           ? `yandex_${lat.toFixed(6)}_${lng.toFixed(6)}_${i}`
//           : `yandex_${i}_${Date.now()}`;

//         return {
//           place_id,
//           main_text:      name,
//           secondary_text: address,
//           address,
//           name,
//           lat,
//           lng,
//           _kind: kind,
//         };
//       }).filter((r) => r.lat != null && r.lng != null);
//     } catch (err) {
//       console.error('[YandexMapsProvider._parseCollection] parse error:', err?.message);
//       return [];
//     }
//   }

//   // ── Search places ─────────────────────────────────────────────────────────
//   // Uses `ll` (center lng,lat) + `spn` (span in degrees) to bias results to
//   // the current viewport area. This is what stops Yandex returning random
//   // places from the other side of the world.
//   async searchPlaces(query, countryCode = null) {
//     console.log('[YandexMapsProvider.searchPlaces] ▶ query:', JSON.stringify(query), '| center:', this._center);

//     const { lat, lng } = this._center;

//     // `rspn=1` strictly restricts results to the ll+spn bounding box.
//     // We use a generous span (3°≈330km) so local cities within the region still appear,
//     // but random places from New Zealand or France are excluded.
//     const params = {
//       geocode: query,
//       results: 7,
//       ll:      `${lng},${lat}`,   // Yandex uses lng,lat order for ll
//       spn:     '3.0,3.0',         // ~330 km span — covers greater metro area
//       rspn:    1,                  // strict restriction to bounding box
//     };

//     // Country filter: Yandex supports `bbox` but not direct country code.
//     // For strict country filtering, callers should include the country name in query.
//     // We log it but can't enforce it via API param.
//     if (countryCode) {
//       console.log('[YandexMapsProvider.searchPlaces] countryCode hint (informational):', countryCode);
//     }

//     try {
//       const json    = await this._geocode(params);
//       const results = this._parseCollection(json);
//       console.log('[YandexMapsProvider.searchPlaces] ✅ parsed', results.length, 'results:', results.map(r => r.main_text).join(', '));
//       return results.length ? results : null;
//     } catch (err) {
//       console.error('[YandexMapsProvider.searchPlaces] ❌ error:', err?.message);
//       return null;
//     }
//   }

//   // ── Place details ─────────────────────────────────────────────────────────
//   // Yandex place_ids encode lat/lng — extract them to skip a re-geocode.
//   async getPlaceDetails(placeId, extraData = null) {
//     console.log('[YandexMapsProvider.getPlaceDetails] placeId:', placeId);

//     // Fast path: coordinates already in extraData
//     if (extraData?.lat != null && extraData?.lng != null) {
//       return {
//         lat:      extraData.lat,
//         lng:      extraData.lng,
//         address:  extraData.address  || extraData.secondary_text || extraData.main_text || '',
//         name:     extraData.name     || extraData.main_text || '',
//         place_id: placeId,
//       };
//     }

//     // Fast path: extract lat/lng encoded in place_id (yandex_lat_lng_idx)
//     const match = placeId?.match(/^yandex_([-\d.]+)_([-\d.]+)/);
//     if (match) {
//       const lat = parseFloat(match[1]);
//       const lng = parseFloat(match[2]);
//       if (!isNaN(lat) && !isNaN(lng)) {
//         return {
//           lat, lng,
//           address:  extraData?.address || extraData?.secondary_text || extraData?.main_text || '',
//           name:     extraData?.name    || extraData?.main_text || '',
//           place_id: placeId,
//         };
//       }
//     }

//     // Slow path: re-geocode by address text
//     const text = extraData?._rawText || extraData?.name || extraData?.address || extraData?.main_text;
//     if (!text) return null;
//     return this.geocodeAddress(text);
//   }

//   // ── Forward geocode ───────────────────────────────────────────────────────
//   async geocodeAddress(address) {
//     console.log('[YandexMapsProvider.geocodeAddress] address:', address);
//     try {
//       const json    = await this._geocode({ geocode: address, results: 1 });
//       const results = this._parseCollection(json);
//       if (!results.length) return null;
//       const r = results[0];
//       return {
//         lat:      r.lat,
//         lng:      r.lng,
//         address:  r.address,
//         name:     r.name,
//         place_id: r.place_id,
//       };
//     } catch (err) {
//       console.error('[YandexMapsProvider.geocodeAddress] error:', err?.message);
//       return null;
//     }
//   }

//   // ── Reverse geocode ───────────────────────────────────────────────────────
//   async reverseGeocode(lat, lng) {
//     console.log('[YandexMapsProvider.reverseGeocode]', lat, lng);
//     try {
//       const json    = await this._geocode({ geocode: `${lng},${lat}`, results: 1 });
//       const results = this._parseCollection(json);
//       if (!results.length) return null;
//       const r = results[0];
//       return {
//         lat:  r.lat,
//         lng:  r.lng,
//         address: r.address,
//         name:    r.name,
//         place_id: r.place_id,
//       };
//     } catch (err) {
//       console.error('[YandexMapsProvider.reverseGeocode] error:', err?.message);
//       return null;
//     }
//   }

//   // ── Navigation deep link ──────────────────────────────────────────────────
//   getNavigationDeepLink(destination, origin = null) {
//     const dest = `${destination.lat},${destination.lng}`;
//     const base = origin
//       ? `https://yandex.com/maps/?rtext=${origin.lat},${origin.lng}~${dest}&rtt=auto`
//       : `https://yandex.com/maps/?pt=${dest}&z=16`;
//     return { webUrl: base, appUrl: null, isMobile: false };
//   }

//   openNavigation(destination, origin = null) {
//     const { webUrl } = this.getNavigationDeepLink(destination, origin);
//     window.open(webUrl, '_blank');
//   }

//   calculateDistance(lat1, lon1, lat2, lon2) {
//     const R    = 6371;
//     const dLat = (lat2 - lat1) * Math.PI / 180;
//     const dLon = (lon2 - lon1) * Math.PI / 180;
//     const a    = Math.sin(dLat / 2) ** 2 +
//                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//                  Math.sin(dLon / 2) ** 2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   }
// }

// export default YandexMapsProvider;
// PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx
//
// Yandex Maps frontend provider.
//
// Default service config (from MapsProvider DEFAULT_SERVICE_APIS):
//   autoComplete: 'suggest'   → _suggestSearch()
//   location:     'geocoder'  → _reverseGeocode() / _placeDetails()
//   routing:      'routeApi'  → _routeApi()
//
// All public methods accept an optional apiMethod forwarded from MapsProvider.

export class YandexMapsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name   = 'yandex';
    this._center = { lat: -15.4167, lng: 28.2833 };
    console.log('[YandexMapsProvider] apiKey present:', !!apiKey);
  }

  setCenter(lat, lng) { this._center = { lat, lng }; }

  // ─────────────────────────────────────────────────────────────────────────
  // DISPATCH LAYER
  // ─────────────────────────────────────────────────────────────────────────

  _dispatchSearch(apiMethod, query, countryCode) {
    switch (apiMethod) {
      case 'suggest':
      default:
        return this._suggestSearch(query, countryCode);
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

  async searchPlaces(query, countryCode = null, apiMethod = 'suggest') {
    if (!this.apiKey || !query) return null;
    return this._dispatchSearch(apiMethod, query, countryCode);
  }

  async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoder') {
    if (extraData?.lat != null && extraData?.lng != null) {
      return {
        lat: extraData.lat, lng: extraData.lng,
        address:  extraData.address || extraData.main_text || '',
        name:     extraData.name    || extraData.main_text || '',
        place_id: placeId,
      };
    }
    return this._dispatchLocation(apiMethod, placeId, extraData);
  }

  async reverseGeocode(lat, lng, apiMethod = 'geocoder') {
    if (!this.apiKey) return null;
    return this._dispatchLocation(apiMethod, lat, lng);
  }

  async getRoute(origin, destination, apiMethod = 'routeApi') {
    if (!this.apiKey) return null;
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
  // IMPLEMENTATION: Yandex Suggest API (autoComplete)
  //
  // Yandex Suggest: https://yandex.com/maps-api/docs/suggest/
  // Returns place suggestions based on partial text input.
  // ─────────────────────────────────────────────────────────────────────────

  async _suggestSearch(query, countryCode) {
    try {
      const params = new URLSearchParams({
        apikey: this.apiKey,
        text:   query,
        lang:   'en_US',
        ll:     `${this._center.lng},${this._center.lat}`,
        spn:    '1,1',
        results: '7',
      });
      if (countryCode) params.set('strict_bounds', '1');

      const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`, {
        headers: { 'Accept-Language': 'en' },
      });
      if (!res.ok) return null;

      const data  = await res.json();
      const items = data.results ?? [];
      if (!items.length) return null;

      return items.map((item, i) => {
        const title    = item.title?.text || '';
        const subtitle = item.subtitle?.text || '';
        return {
          place_id:       `yandex_suggest_${i}_${Date.now()}`,
          main_text:      title,
          secondary_text: subtitle,
          address:        subtitle ? `${title}, ${subtitle}` : title,
          name:           title,
          // lat/lng not available at suggest stage — resolved via geocoder
        };
      });
    } catch (err) {
      console.error('[YandexMapsProvider._suggestSearch] error:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Yandex Geocoder — place text → lat/lng
  // ─────────────────────────────────────────────────────────────────────────

  async _placeDetails(placeId, extraData) {
    // placeId from suggest is not a real Yandex URI — we use the address text
    const text = extraData?.address || extraData?.name || extraData?.main_text;
    if (!text) return null;

    try {
      const params = new URLSearchParams({
        apikey:  this.apiKey,
        geocode: text,
        format:  'json',
        results: '1',
        lang:    'en_US',
      });
      const res  = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
      if (!res.ok) return null;
      const data = await res.json();

      const members = data?.response?.GeoObjectCollection?.featureMember;
      if (!members?.length) return null;

      const geo = members[0].GeoObject;
      const pos = geo.Point?.pos?.split(' ');
      if (!pos || pos.length < 2) return null;

      const lng = parseFloat(pos[0]);
      const lat = parseFloat(pos[1]);

      return {
        lat, lng,
        address:  geo.metaDataProperty?.GeocoderMetaData?.Address?.formatted || text,
        name:     text.split(',')[0],
        place_id: `yandex_${lng}_${lat}`,
      };
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
        apikey:  this.apiKey,
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
  // IMPLEMENTATION: Yandex Router API — coordinates → route
  //
  // Yandex does not expose a public JS routing API on the same level as
  // Google Routes. This implementation calls the Yandex Router REST API
  // which requires a server-side API key with routing access.
  // Callers without that access will receive null and fall back to OSRM.
  // ─────────────────────────────────────────────────────────────────────────

  async _routeApi(origin, destination) {
    try {
      const params = new URLSearchParams({
        apikey:     this.apiKey,
        waypoints:  `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`,
        mode:       'driving',
        lang:       'en_US',
        format:     'json',
      });
      const res  = await fetch(`https://api.routing.yandex.net/v2/route?${params}`);
      if (!res.ok) throw new Error(`Yandex Router ${res.status}`);

      const data = await res.json();
      const legs = data?.route?.legs ?? [];

      let totalDistanceM = 0;
      let totalDurationS = 0;
      const geometry = [];

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
        distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(totalDistanceM)} m`,
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

// Decode Yandex / Google encoded polyline → [[lng, lat], ...]
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