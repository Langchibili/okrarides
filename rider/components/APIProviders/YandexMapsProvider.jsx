// // // // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx

// // // // // // export class YandexMapsProvider {
// // // // // //   constructor(apiKey) {
// // // // // //     this.apiKey       = apiKey;
// // // // // //     this.name         = 'yandexmaps';
// // // // // //     this.geocoderBase = 'https://geocode-maps.yandex.ru/1.x/';
// // // // // //     this.suggestBase  = 'https://suggest-maps.yandex.ru/v1/suggest'; // ← v1, not /suggest-geo
// // // // // //   }

// // // // // //   // ── Yandex Suggest v1 ────────────────────────────────────────────────────
// // // // // //   // The v1 API returns a `uri` field on every result like:
// // // // // //   //   "ymapsbm1://geo?ll=28.2833%2C-15.4167&..."
// // // // // //   // We extract the coordinates from it, so no extra geocoder round-trip is needed.
// // // // // //   async searchPlaces(query, countryCode = null) {
// // // // // //     console.log('yandex',query)
// // // // // //     if (!this.apiKey) {
// // // // // //       console.warn('[YandexMapsProvider] No API key set');
// // // // // //       return null;
// // // // // //     }
// // // // // //     try {
// // // // // //       const params = new URLSearchParams({
// // // // // //         apikey:  this.apiKey,
// // // // // //         text:    query,
// // // // // //         lang:    'en_US',
// // // // // //         results: '7',
// // // // // //         types:   'geo',            // toponyms only (no businesses)
// // // // // //         print_address: '1',
// // // // // //       });

// // // // // //       const res = await fetch(`${this.suggestBase}?${params}`);

// // // // // //       if (!res.ok) {
// // // // // //         console.warn('[YandexMapsProvider] Suggest API returned', res.status, res.statusText);
// // // // // //         return null;
// // // // // //       }

// // // // // //       const data = await res.json();
// // // // // //       const items = data?.results ?? [];

// // // // // //       if (!items.length) return [];

// // // // // //       return items.map((item, i) => {
// // // // // //         const mainText  = item.title?.text    || '';
// // // // // //         const subText   = item.subtitle?.text || '';

// // // // // //         // Extract coordinates from the URI (free, no extra API call)
// // // // // //         // URI looks like: ymapsbm1://geo?ll=28.2833%2C-15.4167&spn=...
// // // // // //         let lat = null, lng = null;
// // // // // //         if (item.uri) {
// // // // // //           const llMatch = item.uri.match(/ll=([^&]+)/);
// // // // // //           if (llMatch) {
// // // // // //             const parts = decodeURIComponent(llMatch[1]).split(',');
// // // // // //             if (parts.length === 2) {
// // // // // //               lng = parseFloat(parts[0]);
// // // // // //               lat = parseFloat(parts[1]);
// // // // // //             }
// // // // // //           }
// // // // // //         }

// // // // // //         return {
// // // // // //           place_id:       `yandex_${i}_${Date.now()}`,
// // // // // //           main_text:      mainText,
// // // // // //           secondary_text: subText,
// // // // // //           address:        subText ? `${mainText}, ${subText}` : mainText,
// // // // // //           name:           mainText,
// // // // // //           // If we got coordinates from the URI, store them directly
// // // // // //           // so getPlaceDetails can return immediately without a geocoder call
// // // // // //           lat,
// // // // // //           lng,
// // // // // //           // If URI had no coords, store the raw text for a geocoder fallback
// // // // // //           _rawText: `${mainText}${subText ? ', ' + subText : ''}`,
// // // // // //           _uri:     item.uri || null,
// // // // // //         };
// // // // // //       });
// // // // // //     } catch (err) {
// // // // // //       console.error('[YandexMapsProvider] searchPlaces error:', err);
// // // // // //       return null;
// // // // // //     }
// // // // // //   }

// // // // // //   // ── Place details ────────────────────────────────────────────────────────
// // // // // //   // Called after the user selects a suggestion.
// // // // // //   // • If the suggestion already has lat/lng (from URI parsing above) → return immediately
// // // // // //   // • Otherwise geocode the _rawText
// // // // // //   async getPlaceDetails(placeId, extraData = null) {
// // // // // //     // Fast path — suggestion already had coords in its URI
// // // // // //     if (extraData?.lat != null && extraData?.lng != null) {
// // // // // //       return {
// // // // // //         lat:      extraData.lat,
// // // // // //         lng:      extraData.lng,
// // // // // //         address:  extraData.address || extraData.main_text || extraData.name || '',
// // // // // //         name:     extraData.name    || extraData.main_text || '',
// // // // // //         place_id: placeId,
// // // // // //       };
// // // // // //     }

// // // // // //     // Slow path — geocode the raw text string
// // // // // //     const textToGeocode = extraData?._rawText || extraData?.name || extraData?.address;
// // // // // //     if (!textToGeocode) {
// // // // // //       console.warn('[YandexMapsProvider] getPlaceDetails: no text to geocode for', placeId);
// // // // // //       return null;
// // // // // //     }

// // // // // //     const result = await this.geocodeAddress(textToGeocode);
// // // // // //     if (!result) return null;

// // // // // //     return {
// // // // // //       lat:      result.lat,
// // // // // //       lng:      result.lng,
// // // // // //       address:  result.address,
// // // // // //       name:     textToGeocode.split(',')[0],
// // // // // //       place_id: placeId,
// // // // // //     };
// // // // // //   }

// // // // // //   // ── Geocoder HTTP API — forward geocoding ────────────────────────────────
// // // // // //   async geocodeAddress(address) {
// // // // // //     if (!this.apiKey) return null;
// // // // // //     try {
// // // // // //       const params = new URLSearchParams({
// // // // // //         apikey:  this.apiKey,
// // // // // //         geocode: address,
// // // // // //         format:  'json',
// // // // // //         results: '1',
// // // // // //         lang:    'en_US',
// // // // // //       });

// // // // // //       const res = await fetch(`${this.geocoderBase}?${params}`);
// // // // // //       if (!res.ok) {
// // // // // //         console.warn('[YandexMapsProvider] geocodeAddress HTTP', res.status);
// // // // // //         return null;
// // // // // //       }
// // // // // //       const data = await res.json();

// // // // // //       const members = data?.response?.GeoObjectCollection?.featureMember;
// // // // // //       if (!members?.length) return null;

// // // // // //       const obj = members[0].GeoObject;
// // // // // //       const pos = obj.Point?.pos?.split(' ');
// // // // // //       if (!pos || pos.length < 2) return null;

// // // // // //       const lng = parseFloat(pos[0]);
// // // // // //       const lat = parseFloat(pos[1]);

// // // // // //       return {
// // // // // //         lat,
// // // // // //         lng,
// // // // // //         address:  obj.metaDataProperty?.GeocoderMetaData?.Address?.formatted || address,
// // // // // //         place_id: `yandex_geo_${lng}_${lat}`,
// // // // // //       };
// // // // // //     } catch (err) {
// // // // // //       console.error('[YandexMapsProvider] geocodeAddress error:', err);
// // // // // //       return null;
// // // // // //     }
// // // // // //   }

// // // // // //   // ── Geocoder HTTP API — reverse geocoding ────────────────────────────────
// // // // // //   async reverseGeocode(lat, lng) {
// // // // // //     if (!this.apiKey) return null;
// // // // // //     try {
// // // // // //       const params = new URLSearchParams({
// // // // // //         apikey:  this.apiKey,
// // // // // //         geocode: `${lng},${lat}`,   // Yandex uses lng,lat order
// // // // // //         format:  'json',
// // // // // //         results: '1',
// // // // // //         lang:    'en_US',
// // // // // //       });

// // // // // //       const res = await fetch(`${this.geocoderBase}?${params}`);
// // // // // //       if (!res.ok) {
// // // // // //         console.warn('[YandexMapsProvider] reverseGeocode HTTP', res.status);
// // // // // //         return null;
// // // // // //       }
// // // // // //       const data = await res.json();

// // // // // //       const members = data?.response?.GeoObjectCollection?.featureMember;
// // // // // //       if (!members?.length) return null;

// // // // // //       const obj        = members[0].GeoObject;
// // // // // //       const metaAddr   = obj.metaDataProperty?.GeocoderMetaData?.Address;
// // // // // //       const components = metaAddr?.Components || [];

// // // // // //       const getKind = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

// // // // // //       return {
// // // // // //         lat,
// // // // // //         lng,
// // // // // //         address:       metaAddr?.formatted || '',
// // // // // //         name:          getKind('locality') || getKind('district') || getKind('province') || 'Unknown',
// // // // // //         place_id:      `yandex_geo_${lng}_${lat}`,
// // // // // //         city:          getKind('locality')  || getKind('district'),
// // // // // //         country:       getKind('country'),
// // // // // //         postalCode:    metaAddr?.postal_code ?? null,
// // // // // //         state:         getKind('province')  || getKind('area'),
// // // // // //         streetAddress: getKind('street'),
// // // // // //         streetNumber:  getKind('house'),
// // // // // //       };
// // // // // //     } catch (err) {
// // // // // //       console.error('[YandexMapsProvider] reverseGeocode error:', err);
// // // // // //       return null;
// // // // // //     }
// // // // // //   }

// // // // // //   // ── Distance (haversine — no API call) ───────────────────────────────────
// // // // // //   calculateDistance(lat1, lon1, lat2, lon2) {
// // // // // //     const R    = 6371;
// // // // // //     const dLat = (lat2 - lat1) * (Math.PI / 180);
// // // // // //     const dLon = (lon2 - lon1) * (Math.PI / 180);
// // // // // //     const a =
// // // // // //       Math.sin(dLat / 2) ** 2 +
// // // // // //       Math.cos(lat1 * (Math.PI / 180)) *
// // // // // //       Math.cos(lat2 * (Math.PI / 180)) *
// // // // // //       Math.sin(dLon / 2) ** 2;
// // // // // //     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // // // // //   }
// // // // // // }

// // // // // // export default YandexMapsProvider;
// // // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx

// // // // // export class YandexMapsProvider {
// // // // //   constructor(apiKey) {
// // // // //     this.apiKey       = apiKey;
// // // // //     this.name         = 'yandexmaps';
// // // // //     this.geocoderBase = 'https://geocode-maps.yandex.ru/1.x/';
// // // // //   //   this.suggestBase  = 'https://suggest-maps.yandex.ru/v1/suggest'; // ← v1, not /suggest-geo
// // // // //    }

// // // // //   // ── Yandex Suggest v1 ────────────────────────────────────────────────────
// // // // //   // The v1 API returns a `uri` field on every result like:
// // // // //   //   "ymapsbm1://geo?ll=28.2833%2C-15.4167&..."
// // // // //   // We extract the coordinates from it, so no extra geocoder round-trip is needed.
// // // // //   // async searchPlaces(query, countryCode = null) {
// // // // //   //   console.log('[YandexMapsProvider] searchPlaces called with query:', query);
// // // // //   //   if (!this.apiKey) {
// // // // //   //     console.warn('[YandexMapsProvider] No API key set');
// // // // //   //     return null;
// // // // //   //   }
// // // // //   //   try {
// // // // //   //     const params = new URLSearchParams({
// // // // //   //       apikey:  this.apiKey,
// // // // //   //       text:    query,
// // // // //   //       lang:    'en_US',
// // // // //   //       results: '7',
// // // // //   //       types:   'geo',            // toponyms only (no businesses)
// // // // //   //       print_address: '1',
// // // // //   //     });

// // // // //   //     const url = `${this.suggestBase}?${params}`;
// // // // //   //     console.log('[YandexMapsProvider] fetch URL:', url);
// // // // //   //     const res = await fetch(url);
// // // // //   //     console.log('[YandexMapsProvider] fetch response status:', res.status);

// // // // //   //     if (!res.ok) {
// // // // //   //       console.warn('[YandexMapsProvider] Suggest API returned', res.status, res.statusText);
// // // // //   //       return null;
// // // // //   //     }

// // // // //   //     const data = await res.json();
// // // // //   //     console.log('[YandexMapsProvider] suggest data:', data);
// // // // //   //     const items = data?.results ?? [];

// // // // //   //     if (!items.length) return [];

// // // // //   //     return items.map((item, i) => {
// // // // //   //       const mainText  = item.title?.text    || '';
// // // // //   //       const subText   = item.subtitle?.text || '';

// // // // //   //       // Extract coordinates from the URI (free, no extra API call)
// // // // //   //       // URI looks like: ymapsbm1://geo?ll=28.2833%2C-15.4167&spn=...
// // // // //   //       let lat = null, lng = null;
// // // // //   //       if (item.uri) {
// // // // //   //         const llMatch = item.uri.match(/ll=([^&]+)/);
// // // // //   //         if (llMatch) {
// // // // //   //           const parts = decodeURIComponent(llMatch[1]).split(',');
// // // // //   //           if (parts.length === 2) {
// // // // //   //             lng = parseFloat(parts[0]);
// // // // //   //             lat = parseFloat(parts[1]);
// // // // //   //           }
// // // // //   //         }
// // // // //   //       }

// // // // //   //       return {
// // // // //   //         place_id:       `yandex_${i}_${Date.now()}`,
// // // // //   //         main_text:      mainText,
// // // // //   //         secondary_text: subText,
// // // // //   //         address:        subText ? `${mainText}, ${subText}` : mainText,
// // // // //   //         name:           mainText,
// // // // //   //         // If we got coordinates from the URI, store them directly
// // // // //   //         // so getPlaceDetails can return immediately without a geocoder call
// // // // //   //         lat,
// // // // //   //         lng,
// // // // //   //         // If URI had no coords, store the raw text for a geocoder fallback
// // // // //   //         _rawText: `${mainText}${subText ? ', ' + subText : ''}`,
// // // // //   //         _uri:     item.uri || null,
// // // // //   //       };
// // // // //   //     });
// // // // //   //   } catch (err) {
// // // // //   //     console.error('[YandexMapsProvider] searchPlaces error:', err);
// // // // //   //     return null;
// // // // //   //   }
// // // // //   // }
// // // // //   // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx

// // // // //   async searchPlaces(query, countryCode = null) {
// // // // //     console.log('[YandexMapsProvider] searchPlaces called with query:', query);
// // // // //     if (!this.apiKey) {
// // // // //       console.warn('[YandexMapsProvider] No API key set');
// // // // //       return null;
// // // // //     }
// // // // //     try {
// // // // //       const params = new URLSearchParams({
// // // // //         apikey:  this.apiKey,
// // // // //         geocode: query,
// // // // //         format:  'json',
// // // // //         results: '7',
// // // // //         lang:    'en_US',
// // // // //       });

// // // // //       const url = `${this.geocoderBase}?${params}`;
// // // // //       console.log('[YandexMapsProvider] fetch URL:', url);
// // // // //       const res = await fetch(url);
// // // // //       console.log('[YandexMapsProvider] fetch response status:', res.status);

// // // // //       if (!res.ok) {
// // // // //         console.warn('[YandexMapsProvider] Geocoder API returned', res.status);
// // // // //         return null;
// // // // //       }

// // // // //       const data = await res.json();
// // // // //       console.log('[YandexMapsProvider] geocoder data:', data);

// // // // //       const members = data?.response?.GeoObjectCollection?.featureMember || [];
// // // // //       if (!members.length) return [];

// // // // //       return members.map((member, i) => {
// // // // //         const obj = member.GeoObject;
// // // // //         const pos = obj.Point?.pos?.split(' ');
// // // // //         let lat = null, lng = null;
// // // // //         if (pos && pos.length === 2) {
// // // // //           lng = parseFloat(pos[0]);
// // // // //           lat = parseFloat(pos[1]);
// // // // //         }

// // // // //         const name = obj.name || '';
// // // // //         const description = obj.description || '';
// // // // //         const address = obj.metaDataProperty?.GeocoderMetaData?.Address?.formatted || description || name;

// // // // //         return {
// // // // //           place_id:       `yandex_geo_${i}_${Date.now()}`,
// // // // //           main_text:      name,
// // // // //           secondary_text: description,
// // // // //           address:        address,
// // // // //           name:           name,
// // // // //           lat,
// // // // //           lng,
// // // // //           _rawText:       address,
// // // // //         };
// // // // //       });
// // // // //     } catch (err) {
// // // // //       console.error('[YandexMapsProvider] searchPlaces error:', err);
// // // // //       return null;
// // // // //     }
// // // // //   }

// // // // //   // ── Place details ────────────────────────────────────────────────────────
// // // // //   // Called after the user selects a suggestion.
// // // // //   // • If the suggestion already has lat/lng (from URI parsing above) → return immediately
// // // // //   // • Otherwise geocode the _rawText
// // // // //   async getPlaceDetails(placeId, extraData = null) {
// // // // //     console.log('[YandexMapsProvider] getPlaceDetails called with placeId:', placeId, 'extraData:', extraData);
// // // // //     // Fast path — suggestion already had coords in its URI
// // // // //     if (extraData?.lat != null && extraData?.lng != null) {
// // // // //       console.log('[YandexMapsProvider] using fast path (coords already present)');
// // // // //       return {
// // // // //         lat:      extraData.lat,
// // // // //         lng:      extraData.lng,
// // // // //         address:  extraData.address || extraData.main_text || extraData.name || '',
// // // // //         name:     extraData.name    || extraData.main_text || '',
// // // // //         place_id: placeId,
// // // // //       };
// // // // //     }

// // // // //     // Slow path — geocode the raw text string
// // // // //     const textToGeocode = extraData?._rawText || extraData?.name || extraData?.address;
// // // // //     console.log('[YandexMapsProvider] textToGeocode:', textToGeocode);
// // // // //     if (!textToGeocode) {
// // // // //       console.warn('[YandexMapsProvider] getPlaceDetails: no text to geocode for', placeId);
// // // // //       return null;
// // // // //     }

// // // // //     const result = await this.geocodeAddress(textToGeocode);
// // // // //     console.log('[YandexMapsProvider] geocodeAddress result:', result);
// // // // //     if (!result) return null;

// // // // //     return {
// // // // //       lat:      result.lat,
// // // // //       lng:      result.lng,
// // // // //       address:  result.address,
// // // // //       name:     textToGeocode.split(',')[0],
// // // // //       place_id: placeId,
// // // // //     };
// // // // //   }

// // // // //   // ── Geocoder HTTP API — forward geocoding ────────────────────────────────
// // // // //   async geocodeAddress(address) {
// // // // //     console.log('[YandexMapsProvider] geocodeAddress called with address:', address);
// // // // //     if (!this.apiKey) return null;
// // // // //     try {
// // // // //       const params = new URLSearchParams({
// // // // //         apikey:  this.apiKey,
// // // // //         geocode: address,
// // // // //         format:  'json',
// // // // //         results: '1',
// // // // //         lang:    'en_US',
// // // // //       });

// // // // //       const url = `${this.geocoderBase}?${params}`;
// // // // //       console.log('[YandexMapsProvider] geocodeAddress URL:', url);
// // // // //       const res = await fetch(url);
// // // // //       console.log('[YandexMapsProvider] geocodeAddress response status:', res.status);
// // // // //       if (!res.ok) {
// // // // //         console.warn('[YandexMapsProvider] geocodeAddress HTTP', res.status);
// // // // //         return null;
// // // // //       }
// // // // //       const data = await res.json();
// // // // //       console.log('[YandexMapsProvider] geocodeAddress data:', data);

// // // // //       const members = data?.response?.GeoObjectCollection?.featureMember;
// // // // //       if (!members?.length) return null;

// // // // //       const obj = members[0].GeoObject;
// // // // //       const pos = obj.Point?.pos?.split(' ');
// // // // //       if (!pos || pos.length < 2) return null;

// // // // //       const lng = parseFloat(pos[0]);
// // // // //       const lat = parseFloat(pos[1]);

// // // // //       return {
// // // // //         lat,
// // // // //         lng,
// // // // //         address:  obj.metaDataProperty?.GeocoderMetaData?.Address?.formatted || address,
// // // // //         place_id: `yandex_geo_${lng}_${lat}`,
// // // // //       };
// // // // //     } catch (err) {
// // // // //       console.error('[YandexMapsProvider] geocodeAddress error:', err);
// // // // //       return null;
// // // // //     }
// // // // //   }

// // // // //   // ── Geocoder HTTP API — reverse geocoding ────────────────────────────────
// // // // //   async reverseGeocode(lat, lng) {
// // // // //     console.log('[YandexMapsProvider] reverseGeocode called for lat:', lat, 'lng:', lng);
// // // // //     if (!this.apiKey) return null;
// // // // //     try {
// // // // //       const params = new URLSearchParams({
// // // // //         apikey:  this.apiKey,
// // // // //         geocode: `${lng},${lat}`,   // Yandex uses lng,lat order
// // // // //         format:  'json',
// // // // //         results: '1',
// // // // //         lang:    'en_US',
// // // // //       });

// // // // //       const url = `${this.geocoderBase}?${params}`;
// // // // //       console.log('[YandexMapsProvider] reverseGeocode URL:', url);
// // // // //       const res = await fetch(url);
// // // // //       console.log('[YandexMapsProvider] reverseGeocode response status:', res.status);
// // // // //       if (!res.ok) {
// // // // //         console.warn('[YandexMapsProvider] reverseGeocode HTTP', res.status);
// // // // //         return null;
// // // // //       }
// // // // //       const data = await res.json();
// // // // //       console.log('[YandexMapsProvider] reverseGeocode data:', data);

// // // // //       const members = data?.response?.GeoObjectCollection?.featureMember;
// // // // //       if (!members?.length) return null;

// // // // //       const obj        = members[0].GeoObject;
// // // // //       const metaAddr   = obj.metaDataProperty?.GeocoderMetaData?.Address;
// // // // //       const components = metaAddr?.Components || [];

// // // // //       const getKind = (kind) => components.find((c) => c.kind === kind)?.name ?? null;

// // // // //       return {
// // // // //         lat,
// // // // //         lng,
// // // // //         address:       metaAddr?.formatted || '',
// // // // //         name:          getKind('locality') || getKind('district') || getKind('province') || 'Unknown',
// // // // //         place_id:      `yandex_geo_${lng}_${lat}`,
// // // // //         city:          getKind('locality')  || getKind('district'),
// // // // //         country:       getKind('country'),
// // // // //         postalCode:    metaAddr?.postal_code ?? null,
// // // // //         state:         getKind('province')  || getKind('area'),
// // // // //         streetAddress: getKind('street'),
// // // // //         streetNumber:  getKind('house'),
// // // // //       };
// // // // //     } catch (err) {
// // // // //       console.error('[YandexMapsProvider] reverseGeocode error:', err);
// // // // //       return null;
// // // // //     }
// // // // //   }

// // // // //   // ── Distance (haversine — no API call) ───────────────────────────────────
// // // // //   calculateDistance(lat1, lon1, lat2, lon2) {
// // // // //     const R    = 6371;
// // // // //     const dLat = (lat2 - lat1) * (Math.PI / 180);
// // // // //     const dLon = (lon2 - lon1) * (Math.PI / 180);
// // // // //     const a =
// // // // //       Math.sin(dLat / 2) ** 2 +
// // // // //       Math.cos(lat1 * (Math.PI / 180)) *
// // // // //       Math.cos(lat2 * (Math.PI / 180)) *
// // // // //       Math.sin(dLon / 2) ** 2;
// // // // //     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // // // //   }
// // // // // }

// // // // // export default YandexMapsProvider;
// // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx
// // // // //
// // // // // Yandex Maps via Geocoder HTTP API.
// // // // // Env: NEXT_PUBLIC_YANDEX_MAPS_API_KEY
// // // // //
// // // // // searchPlaces uses `ll` + `spn` params for geographic bias so results are
// // // // // local rather than global.

// // // // const GEOCODER_BASE = 'https://geocode-maps.yandex.ru/1.x/';

// // // // export class YandexMapsProvider {
// // // //   constructor(apiKey) {
// // // //     this.apiKey  = apiKey;
// // // //     this.name    = 'yandexmaps';
// // // //     // Default center bias — Lusaka, Zambia. Updated via setCenter().
// // // //     this._center = { lat: -15.4167, lng: 28.2833 };
// // // //     console.log('[YandexMapsProvider] constructor — apiKey present:', !!apiKey);
// // // //   }

// // // //   // Allow map display / MapsProvider to push the current viewport center
// // // //   setCenter(lat, lng) {
// // // //     this._center = { lat, lng };
// // // //   }

// // // //   // ── Internal geocoder fetch ────────────────────────────────────────────────
// // // //   async _geocode(params) {
// // // //     if (!this.apiKey) {
// // // //       console.warn('[YandexMapsProvider._geocode] ❌ no apiKey');
// // // //       return null;
// // // //     }
// // // //     const url = new URL(GEOCODER_BASE);
// // // //     url.searchParams.set('apikey', this.apiKey);
// // // //     url.searchParams.set('format', 'json');
// // // //     url.searchParams.set('lang',   'en_US');
// // // //     for (const [k, v] of Object.entries(params)) {
// // // //       url.searchParams.set(k, v);
// // // //     }
// // // //     console.log('[YandexMapsProvider._geocode] GET', url.toString().replace(this.apiKey, '***'));
// // // //     const res = await fetch(url.toString());
// // // //     if (!res.ok) {
// // // //       console.error('[YandexMapsProvider._geocode] HTTP', res.status);
// // // //       return null;
// // // //     }
// // // //     return res.json();
// // // //   }

// // // //   // ── Parse GeoObjectCollection → normalized result array ───────────────────
// // // //   _parseCollection(json) {
// // // //     try {
// // // //       const members = json
// // // //         ?.response
// // // //         ?.GeoObjectCollection
// // // //         ?.featureMember || [];

// // // //       return members.map((m, i) => {
// // // //         const obj      = m.GeoObject;
// // // //         const meta     = obj?.metaDataProperty?.GeocoderMetaData;
// // // //         const posStr   = obj?.Point?.pos; // "lng lat"
// // // //         const [lng, lat] = posStr ? posStr.split(' ').map(Number) : [null, null];
// // // //         const address  = meta?.text || obj?.name || '';
// // // //         const name     = obj?.name || address.split(',')[0];
// // // //         const kind     = meta?.kind;

// // // //         // Build place_id that encodes coordinates so getPlaceDetails can skip re-geocoding
// // // //         const place_id = lat != null && lng != null
// // // //           ? `yandex_${lat.toFixed(6)}_${lng.toFixed(6)}_${i}`
// // // //           : `yandex_${i}_${Date.now()}`;

// // // //         return {
// // // //           place_id,
// // // //           main_text:      name,
// // // //           secondary_text: address,
// // // //           address,
// // // //           name,
// // // //           lat,
// // // //           lng,
// // // //           _kind: kind,
// // // //         };
// // // //       }).filter((r) => r.lat != null && r.lng != null);
// // // //     } catch (err) {
// // // //       console.error('[YandexMapsProvider._parseCollection] parse error:', err?.message);
// // // //       return [];
// // // //     }
// // // //   }

// // // //   // ── Search places ─────────────────────────────────────────────────────────
// // // //   // Uses `ll` (center lng,lat) + `spn` (span in degrees) to bias results to
// // // //   // the current viewport area. This is what stops Yandex returning random
// // // //   // places from the other side of the world.
// // // //   async searchPlaces(query, countryCode = null) {
// // // //     console.log('[YandexMapsProvider.searchPlaces] ▶ query:', JSON.stringify(query), '| center:', this._center);

// // // //     const { lat, lng } = this._center;

// // // //     // `rspn=1` restricts results to the ll+spn bounding box strictly
// // // //     // `rspn=0` uses ll+spn as a bias (prefer local results, allow others)
// // // //     // We use rspn=0 so short/ambiguous queries still return something.
// // // //     const params = {
// // // //       geocode: query,
// // // //       results: 7,
// // // //       ll:      `${lng},${lat}`,   // Yandex uses lng,lat order for ll
// // // //       spn:     '1.5,1.5',         // ~150 km span either side
// // // //       rspn:    0,                  // bias (not strict restriction)
// // // //     };

// // // //     // Country filter: Yandex supports `bbox` but not direct country code.
// // // //     // For strict country filtering, callers should include the country name in query.
// // // //     // We log it but can't enforce it via API param.
// // // //     if (countryCode) {
// // // //       console.log('[YandexMapsProvider.searchPlaces] countryCode hint (informational):', countryCode);
// // // //     }

// // // //     try {
// // // //       const json    = await this._geocode(params);
// // // //       const results = this._parseCollection(json);
// // // //       console.log('[YandexMapsProvider.searchPlaces] ✅ parsed', results.length, 'results:', results.map(r => r.main_text).join(', '));
// // // //       return results.length ? results : null;
// // // //     } catch (err) {
// // // //       console.error('[YandexMapsProvider.searchPlaces] ❌ error:', err?.message);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   // ── Place details ─────────────────────────────────────────────────────────
// // // //   // Yandex place_ids encode lat/lng — extract them to skip a re-geocode.
// // // //   async getPlaceDetails(placeId, extraData = null) {
// // // //     console.log('[YandexMapsProvider.getPlaceDetails] placeId:', placeId);

// // // //     // Fast path: coordinates already in extraData
// // // //     if (extraData?.lat != null && extraData?.lng != null) {
// // // //       return {
// // // //         lat:      extraData.lat,
// // // //         lng:      extraData.lng,
// // // //         address:  extraData.address  || extraData.secondary_text || extraData.main_text || '',
// // // //         name:     extraData.name     || extraData.main_text || '',
// // // //         place_id: placeId,
// // // //       };
// // // //     }

// // // //     // Fast path: extract lat/lng encoded in place_id (yandex_lat_lng_idx)
// // // //     const match = placeId?.match(/^yandex_([-\d.]+)_([-\d.]+)/);
// // // //     if (match) {
// // // //       const lat = parseFloat(match[1]);
// // // //       const lng = parseFloat(match[2]);
// // // //       if (!isNaN(lat) && !isNaN(lng)) {
// // // //         return {
// // // //           lat, lng,
// // // //           address:  extraData?.address || extraData?.secondary_text || extraData?.main_text || '',
// // // //           name:     extraData?.name    || extraData?.main_text || '',
// // // //           place_id: placeId,
// // // //         };
// // // //       }
// // // //     }

// // // //     // Slow path: re-geocode by address text
// // // //     const text = extraData?._rawText || extraData?.name || extraData?.address || extraData?.main_text;
// // // //     if (!text) return null;
// // // //     return this.geocodeAddress(text);
// // // //   }

// // // //   // ── Forward geocode ───────────────────────────────────────────────────────
// // // //   async geocodeAddress(address) {
// // // //     console.log('[YandexMapsProvider.geocodeAddress] address:', address);
// // // //     try {
// // // //       const json    = await this._geocode({ geocode: address, results: 1 });
// // // //       const results = this._parseCollection(json);
// // // //       if (!results.length) return null;
// // // //       const r = results[0];
// // // //       return {
// // // //         lat:      r.lat,
// // // //         lng:      r.lng,
// // // //         address:  r.address,
// // // //         name:     r.name,
// // // //         place_id: r.place_id,
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[YandexMapsProvider.geocodeAddress] error:', err?.message);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   // ── Reverse geocode ───────────────────────────────────────────────────────
// // // //   async reverseGeocode(lat, lng) {
// // // //     console.log('[YandexMapsProvider.reverseGeocode]', lat, lng);
// // // //     try {
// // // //       const json    = await this._geocode({ geocode: `${lng},${lat}`, results: 1 });
// // // //       const results = this._parseCollection(json);
// // // //       if (!results.length) return null;
// // // //       const r = results[0];
// // // //       return {
// // // //         lat:  r.lat,
// // // //         lng:  r.lng,
// // // //         address: r.address,
// // // //         name:    r.name,
// // // //         place_id: r.place_id,
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[YandexMapsProvider.reverseGeocode] error:', err?.message);
// // // //       return null;
// // // //     }
// // // //   }

// // // //   // ── Navigation deep link ──────────────────────────────────────────────────
// // // //   getNavigationDeepLink(destination, origin = null) {
// // // //     const dest = `${destination.lat},${destination.lng}`;
// // // //     const base = origin
// // // //       ? `https://yandex.com/maps/?rtext=${origin.lat},${origin.lng}~${dest}&rtt=auto`
// // // //       : `https://yandex.com/maps/?pt=${dest}&z=16`;
// // // //     return { webUrl: base, appUrl: null, isMobile: false };
// // // //   }

// // // //   openNavigation(destination, origin = null) {
// // // //     const { webUrl } = this.getNavigationDeepLink(destination, origin);
// // // //     window.open(webUrl, '_blank');
// // // //   }

// // // //   calculateDistance(lat1, lon1, lat2, lon2) {
// // // //     const R    = 6371;
// // // //     const dLat = (lat2 - lat1) * Math.PI / 180;
// // // //     const dLon = (lon2 - lon1) * Math.PI / 180;
// // // //     const a    = Math.sin(dLat / 2) ** 2 +
// // // //                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
// // // //                  Math.sin(dLon / 2) ** 2;
// // // //     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // // //   }
// // // // }

// // // // export default YandexMapsProvider;
// // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx
// // // //
// // // // Yandex Maps via Geocoder HTTP API.
// // // // Env: NEXT_PUBLIC_YANDEX_MAPS_API_KEY
// // // //
// // // // searchPlaces uses `ll` + `spn` params for geographic bias so results are
// // // // local rather than global.

// // // const GEOCODER_BASE = 'https://geocode-maps.yandex.ru/1.x/';

// // // export class YandexMapsProvider {
// // //   constructor(apiKey) {
// // //     this.apiKey  = apiKey;
// // //     this.name    = 'yandexmaps';
// // //     // Default center bias — Lusaka, Zambia. Updated via setCenter().
// // //     this._center = { lat: -15.4167, lng: 28.2833 };
// // //     console.log('[YandexMapsProvider] constructor — apiKey present:', !!apiKey);
// // //   }

// // //   // Allow map display / MapsProvider to push the current viewport center
// // //   setCenter(lat, lng) {
// // //     this._center = { lat, lng };
// // //   }

// // //   // ── Internal geocoder fetch ────────────────────────────────────────────────
// // //   async _geocode(params) {
// // //     if (!this.apiKey) {
// // //       console.warn('[YandexMapsProvider._geocode] ❌ no apiKey');
// // //       return null;
// // //     }
// // //     const url = new URL(GEOCODER_BASE);
// // //     url.searchParams.set('apikey', this.apiKey);
// // //     url.searchParams.set('format', 'json');
// // //     url.searchParams.set('lang',   'en_US');
// // //     for (const [k, v] of Object.entries(params)) {
// // //       url.searchParams.set(k, v);
// // //     }
// // //     console.log('[YandexMapsProvider._geocode] GET', url.toString().replace(this.apiKey, '***'));
// // //     const res = await fetch(url.toString());
// // //     if (!res.ok) {
// // //       console.error('[YandexMapsProvider._geocode] HTTP', res.status);
// // //       return null;
// // //     }
// // //     return res.json();
// // //   }

// // //   // ── Parse GeoObjectCollection → normalized result array ───────────────────
// // //   _parseCollection(json) {
// // //     try {
// // //       const members = json
// // //         ?.response
// // //         ?.GeoObjectCollection
// // //         ?.featureMember || [];

// // //       return members.map((m, i) => {
// // //         const obj      = m.GeoObject;
// // //         const meta     = obj?.metaDataProperty?.GeocoderMetaData;
// // //         const posStr   = obj?.Point?.pos; // "lng lat"
// // //         const [lng, lat] = posStr ? posStr.split(' ').map(Number) : [null, null];
// // //         const address  = meta?.text || obj?.name || '';
// // //         const name     = obj?.name || address.split(',')[0];
// // //         const kind     = meta?.kind;

// // //         // Build place_id that encodes coordinates so getPlaceDetails can skip re-geocoding
// // //         const place_id = lat != null && lng != null
// // //           ? `yandex_${lat.toFixed(6)}_${lng.toFixed(6)}_${i}`
// // //           : `yandex_${i}_${Date.now()}`;

// // //         return {
// // //           place_id,
// // //           main_text:      name,
// // //           secondary_text: address,
// // //           address,
// // //           name,
// // //           lat,
// // //           lng,
// // //           _kind: kind,
// // //         };
// // //       }).filter((r) => r.lat != null && r.lng != null);
// // //     } catch (err) {
// // //       console.error('[YandexMapsProvider._parseCollection] parse error:', err?.message);
// // //       return [];
// // //     }
// // //   }

// // //   // ── Search places ─────────────────────────────────────────────────────────
// // //   // Uses `ll` (center lng,lat) + `spn` (span in degrees) to bias results to
// // //   // the current viewport area. This is what stops Yandex returning random
// // //   // places from the other side of the world.
// // //   async searchPlaces(query, countryCode = null) {
// // //     console.log('[YandexMapsProvider.searchPlaces] ▶ query:', JSON.stringify(query), '| center:', this._center);

// // //     const { lat, lng } = this._center;

// // //     // `rspn=1` strictly restricts results to the ll+spn bounding box.
// // //     // We use a generous span (3°≈330km) so local cities within the region still appear,
// // //     // but random places from New Zealand or France are excluded.
// // //     const params = {
// // //       geocode: query,
// // //       results: 7,
// // //       ll:      `${lng},${lat}`,   // Yandex uses lng,lat order for ll
// // //       spn:     '3.0,3.0',         // ~330 km span — covers greater metro area
// // //       rspn:    1,                  // strict restriction to bounding box
// // //     };

// // //     // Country filter: Yandex supports `bbox` but not direct country code.
// // //     // For strict country filtering, callers should include the country name in query.
// // //     // We log it but can't enforce it via API param.
// // //     if (countryCode) {
// // //       console.log('[YandexMapsProvider.searchPlaces] countryCode hint (informational):', countryCode);
// // //     }

// // //     try {
// // //       const json    = await this._geocode(params);
// // //       const results = this._parseCollection(json);
// // //       console.log('[YandexMapsProvider.searchPlaces] ✅ parsed', results.length, 'results:', results.map(r => r.main_text).join(', '));
// // //       return results.length ? results : null;
// // //     } catch (err) {
// // //       console.error('[YandexMapsProvider.searchPlaces] ❌ error:', err?.message);
// // //       return null;
// // //     }
// // //   }

// // //   // ── Place details ─────────────────────────────────────────────────────────
// // //   // Yandex place_ids encode lat/lng — extract them to skip a re-geocode.
// // //   async getPlaceDetails(placeId, extraData = null) {
// // //     console.log('[YandexMapsProvider.getPlaceDetails] placeId:', placeId);

// // //     // Fast path: coordinates already in extraData
// // //     if (extraData?.lat != null && extraData?.lng != null) {
// // //       return {
// // //         lat:      extraData.lat,
// // //         lng:      extraData.lng,
// // //         address:  extraData.address  || extraData.secondary_text || extraData.main_text || '',
// // //         name:     extraData.name     || extraData.main_text || '',
// // //         place_id: placeId,
// // //       };
// // //     }

// // //     // Fast path: extract lat/lng encoded in place_id (yandex_lat_lng_idx)
// // //     const match = placeId?.match(/^yandex_([-\d.]+)_([-\d.]+)/);
// // //     if (match) {
// // //       const lat = parseFloat(match[1]);
// // //       const lng = parseFloat(match[2]);
// // //       if (!isNaN(lat) && !isNaN(lng)) {
// // //         return {
// // //           lat, lng,
// // //           address:  extraData?.address || extraData?.secondary_text || extraData?.main_text || '',
// // //           name:     extraData?.name    || extraData?.main_text || '',
// // //           place_id: placeId,
// // //         };
// // //       }
// // //     }

// // //     // Slow path: re-geocode by address text
// // //     const text = extraData?._rawText || extraData?.name || extraData?.address || extraData?.main_text;
// // //     if (!text) return null;
// // //     return this.geocodeAddress(text);
// // //   }

// // //   // ── Forward geocode ───────────────────────────────────────────────────────
// // //   async geocodeAddress(address) {
// // //     console.log('[YandexMapsProvider.geocodeAddress] address:', address);
// // //     try {
// // //       const json    = await this._geocode({ geocode: address, results: 1 });
// // //       const results = this._parseCollection(json);
// // //       if (!results.length) return null;
// // //       const r = results[0];
// // //       return {
// // //         lat:      r.lat,
// // //         lng:      r.lng,
// // //         address:  r.address,
// // //         name:     r.name,
// // //         place_id: r.place_id,
// // //       };
// // //     } catch (err) {
// // //       console.error('[YandexMapsProvider.geocodeAddress] error:', err?.message);
// // //       return null;
// // //     }
// // //   }

// // //   // ── Reverse geocode ───────────────────────────────────────────────────────
// // //   async reverseGeocode(lat, lng) {
// // //     console.log('[YandexMapsProvider.reverseGeocode]', lat, lng);
// // //     try {
// // //       const json    = await this._geocode({ geocode: `${lng},${lat}`, results: 1 });
// // //       const results = this._parseCollection(json);
// // //       if (!results.length) return null;
// // //       const r = results[0];
// // //       return {
// // //         lat:  r.lat,
// // //         lng:  r.lng,
// // //         address: r.address,
// // //         name:    r.name,
// // //         place_id: r.place_id,
// // //       };
// // //     } catch (err) {
// // //       console.error('[YandexMapsProvider.reverseGeocode] error:', err?.message);
// // //       return null;
// // //     }
// // //   }

// // //   // ── Navigation deep link ──────────────────────────────────────────────────
// // //   getNavigationDeepLink(destination, origin = null) {
// // //     const dest = `${destination.lat},${destination.lng}`;
// // //     const base = origin
// // //       ? `https://yandex.com/maps/?rtext=${origin.lat},${origin.lng}~${dest}&rtt=auto`
// // //       : `https://yandex.com/maps/?pt=${dest}&z=16`;
// // //     return { webUrl: base, appUrl: null, isMobile: false };
// // //   }

// // //   openNavigation(destination, origin = null) {
// // //     const { webUrl } = this.getNavigationDeepLink(destination, origin);
// // //     window.open(webUrl, '_blank');
// // //   }

// // //   calculateDistance(lat1, lon1, lat2, lon2) {
// // //     const R    = 6371;
// // //     const dLat = (lat2 - lat1) * Math.PI / 180;
// // //     const dLon = (lon2 - lon1) * Math.PI / 180;
// // //     const a    = Math.sin(dLat / 2) ** 2 +
// // //                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
// // //                  Math.sin(dLon / 2) ** 2;
// // //     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // //   }
// // // }

// // // export default YandexMapsProvider;
// // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/YandexMapsProvider.jsx
// // //
// // // Yandex Maps frontend provider.
// // //
// // // Default service config (from MapsProvider DEFAULT_SERVICE_APIS):
// // //   autoComplete: 'suggest'   → _suggestSearch()
// // //   location:     'geocoder'  → _reverseGeocode() / _placeDetails()
// // //   routing:      'routeApi'  → _routeApi()
// // //
// // // All public methods accept an optional apiMethod forwarded from MapsProvider.

// // export class YandexMapsProvider {
// //   constructor(apiKey) {
// //     this.apiKey = apiKey;
// //     this.name   = 'yandex';
// //     this._center = { lat: -15.4167, lng: 28.2833 };
// //     console.log('[YandexMapsProvider] apiKey present:', !!apiKey);
// //   }

// //   setCenter(lat, lng) { this._center = { lat, lng }; }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // DISPATCH LAYER
// //   // ─────────────────────────────────────────────────────────────────────────

// //   _dispatchSearch(apiMethod, query, countryCode) {
// //     switch (apiMethod) {
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

// //   async searchPlaces(query, countryCode = null, apiMethod = 'suggest') {
// //     if (!this.apiKey || !query) return null;
// //     return this._dispatchSearch(apiMethod, query, countryCode);
// //   }

// //   async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoder') {
// //     if (extraData?.lat != null && extraData?.lng != null) {
// //       return {
// //         lat: extraData.lat, lng: extraData.lng,
// //         address:  extraData.address || extraData.main_text || '',
// //         name:     extraData.name    || extraData.main_text || '',
// //         place_id: placeId,
// //       };
// //     }
// //     return this._dispatchLocation(apiMethod, placeId, extraData);
// //   }

// //   async reverseGeocode(lat, lng, apiMethod = 'geocoder') {
// //     if (!this.apiKey) return null;
// //     return this._dispatchLocation(apiMethod, lat, lng);
// //   }

// //   async getRoute(origin, destination, apiMethod = 'routeApi') {
// //     if (!this.apiKey) return null;
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
// //   // IMPLEMENTATION: Yandex Suggest API (autoComplete)
// //   //
// //   // Yandex Suggest: https://yandex.com/maps-api/docs/suggest/
// //   // Returns place suggestions based on partial text input.
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _suggestSearch(query, countryCode) {
// //     try {
// //       const params = new URLSearchParams({
// //         apikey: this.apiKey,
// //         text:   query,
// //         lang:   'en_US',
// //         ll:     `${this._center.lng},${this._center.lat}`,
// //         spn:    '1,1',
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
// //         const title    = item.title?.text || '';
// //         const subtitle = item.subtitle?.text || '';
// //         return {
// //           place_id:       `yandex_suggest_${i}_${Date.now()}`,
// //           main_text:      title,
// //           secondary_text: subtitle,
// //           address:        subtitle ? `${title}, ${subtitle}` : title,
// //           name:           title,
// //           // lat/lng not available at suggest stage — resolved via geocoder
// //         };
// //       });
// //     } catch (err) {
// //       console.error('[YandexMapsProvider._suggestSearch] error:', err?.message);
// //       return null;
// //     }
// //   }

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // IMPLEMENTATION: Yandex Geocoder — place text → lat/lng
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _placeDetails(placeId, extraData) {
// //     // placeId from suggest is not a real Yandex URI — we use the address text
// //     const text = extraData?.address || extraData?.name || extraData?.main_text;
// //     if (!text) return null;

// //     try {
// //       const params = new URLSearchParams({
// //         apikey:  this.apiKey,
// //         geocode: text,
// //         format:  'json',
// //         results: '1',
// //         lang:    'en_US',
// //       });
// //       const res  = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
// //       if (!res.ok) return null;
// //       const data = await res.json();

// //       const members = data?.response?.GeoObjectCollection?.featureMember;
// //       if (!members?.length) return null;

// //       const geo = members[0].GeoObject;
// //       const pos = geo.Point?.pos?.split(' ');
// //       if (!pos || pos.length < 2) return null;

// //       const lng = parseFloat(pos[0]);
// //       const lat = parseFloat(pos[1]);

// //       return {
// //         lat, lng,
// //         address:  geo.metaDataProperty?.GeocoderMetaData?.Address?.formatted || text,
// //         name:     text.split(',')[0],
// //         place_id: `yandex_${lng}_${lat}`,
// //       };
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
// //         apikey:  this.apiKey,
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
// //   // IMPLEMENTATION: Yandex Router API — coordinates → route
// //   //
// //   // Yandex does not expose a public JS routing API on the same level as
// //   // Google Routes. This implementation calls the Yandex Router REST API
// //   // which requires a server-side API key with routing access.
// //   // Callers without that access will receive null and fall back to OSRM.
// //   // ─────────────────────────────────────────────────────────────────────────

// //   async _routeApi(origin, destination) {
// //     try {
// //       const params = new URLSearchParams({
// //         apikey:     this.apiKey,
// //         waypoints:  `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`,
// //         mode:       'driving',
// //         lang:       'en_US',
// //         format:     'json',
// //       });
// //       const res  = await fetch(`https://api.routing.yandex.net/v2/route?${params}`);
// //       if (!res.ok) throw new Error(`Yandex Router ${res.status}`);

// //       const data = await res.json();
// //       const legs = data?.route?.legs ?? [];

// //       let totalDistanceM = 0;
// //       let totalDurationS = 0;
// //       const geometry = [];

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
// //         distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(totalDistanceM)} m`,
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

// // // Decode Yandex / Google encoded polyline → [[lng, lat], ...]
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
// export class YandexMapsProvider {
//   /**
//    * @param {string} apiKey           – NEXT_PUBLIC_YANDEX_MAPS_API_KEY  (Geocoder / Router)
//    * @param {string} geoSuggestApiKey – NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY (GeoSuggest)
//    */
//   constructor(apiKey, geoSuggestApiKey) {
//     this.apiKey           = apiKey;
//     this.geoSuggestApiKey = geoSuggestApiKey;
//     this.name             = 'yandex';
//     this._center          = { lat: -15.4167, lng: 28.2833 };

//     console.log(
//       '[YandexMapsProvider] apiKey present:', !!apiKey,
//       '| geoSuggestApiKey present:', !!geoSuggestApiKey,
//     );
//     if (!geoSuggestApiKey) {
//       console.warn(
//         '[YandexMapsProvider] ⚠️  NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is not set — ' +
//         'GeoSuggestAPI calls will be skipped.',
//       );
//     }
//   }

//   setCenter(lat, lng) { this._center = { lat, lng }; }

//   // ─────────────────────────────────────────────────────────────────────────
//   // DISPATCH LAYER
//   // ─────────────────────────────────────────────────────────────────────────

//   _dispatchSearch(apiMethod, query, countryCode) {
//     switch (apiMethod) {
//       case 'GeoSuggestAPI':
//         return this._geoSuggestSearch(query, countryCode);
//       case 'suggest':
//       default:
//         return this._suggestSearch(query, countryCode);
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

//   async searchPlaces(query, countryCode = null, apiMethod = 'GeoSuggestAPI') {
//     if (!query) return null;
//     // GeoSuggest path requires its own key
//     if (apiMethod === 'GeoSuggestAPI' && !this.geoSuggestApiKey) {
//       console.warn('[YandexMapsProvider] searchPlaces: GeoSuggestAPI requested but key is missing — falling back to suggest');
//       return this._suggestSearch(query, countryCode);
//     }
//     if (apiMethod !== 'GeoSuggestAPI' && !this.apiKey) return null;
//     return this._dispatchSearch(apiMethod, query, countryCode);
//   }

//   async getPlaceDetails(placeId, extraData = null, apiMethod = 'geocoder') {
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
//     if (!this.apiKey) return null;
//     return this._dispatchLocation(apiMethod, lat, lng);
//   }

//   async getRoute(origin, destination, apiMethod = 'routeApi') {
//     if (!this.apiKey) return null;
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
//   // Uses types=geo,biz to return both geographic objects (streets, landmarks)
//   // and businesses (restaurants, shops, etc.) — equivalent to Google Places.
//   //
//   // Business results include lat/lng directly in geometry.  Toponym results
//   // do not; those are resolved later via _placeDetails (Geocoder + URI).
//   //
//   // Docs: https://yandex.ru/dev/geosuggest/doc/en/
//   // ─────────────────────────────────────────────────────────────────────────

//   async _geoSuggestSearch(query, countryCode) {
//     console.log(`[YandexMapsProvider._geoSuggestSearch] query:"${query}" center:${JSON.stringify(this._center)}`);
//     try {
//       const params = new URLSearchParams({
//         apikey:        this.geoSuggestApiKey,
//         text:          query.trim(),
//         lang:          'en_US',
//         ll:            `${this._center.lng},${this._center.lat}`,
//         spn:           '1,1',
//         results:       '10',
//         // geo  = toponyms (streets, areas, POIs)
//         // biz  = businesses (shops, restaurants, services)
//         types:         'geo,biz',
//         print_address: '1',       // include formatted address in response
//       });

//       // Optional country restriction — Yandex uses ISO 3166-1 alpha-2 codes
//       // but does not have a direct countrycodes param; we rely on the ll/spn
//       // viewport bias instead and let results flow naturally.

//       const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`, {
//         headers: { 'Accept-Language': 'en' },
//       });

//       console.log(`[YandexMapsProvider._geoSuggestSearch] HTTP ${res.status}`);
//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         console.error('[YandexMapsProvider._geoSuggestSearch] API error:', res.status, err);
//         return null;
//       }

//       const data  = await res.json();
//       const items = data.results ?? [];

//       console.log(`[YandexMapsProvider._geoSuggestSearch] ${items.length} raw results`);
//       if (!items.length) return null;

//       const mapped = items.map((item, i) => {
//         const title    = item.title?.text    || '';
//         const subtitle = item.subtitle?.text || '';

//         // ── Coordinates ───────────────────────────────────────────────────
//         // Yandex returns Point geometry [lng, lat] for business results.
//         // Toponym results may omit geometry; they'll be resolved via geocoder.
//         const coords = item.geometry?.geometry?.coordinates;   // [lng, lat]
//         const lng    = Array.isArray(coords) ? Number(coords[0]) : null;
//         const lat    = Array.isArray(coords) ? Number(coords[1]) : null;
//         const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

//         // ── Formatted address from print_address=1 ────────────────────────
//         const formattedAddress =
//           item.address?.formatted_address ||
//           (subtitle ? `${title}, ${subtitle}` : title);

//         // ── Yandex URI — used later to resolve toponyms via Geocoder ──────
//         // URI looks like: ymapsbm1://geo?ll=28.30%2C-15.41&spn=0.001%2C0.001&text=...
//         //              or: ymapsbm1://org?oid=12345
//         const uri = item.uri || null;

//         // ── Tags tell us geo vs biz ────────────────────────────────────────
//         const tags  = Array.isArray(item.tags) ? item.tags : [];
//         const isBiz = tags.includes('business') || tags.includes('biz');

//         // ── Distance from center ───────────────────────────────────────────
//         // Yandex returns distance as { value (metres), text }
//         const distanceMeters = item.distance?.value ?? null;

//         return {
//           place_id:       uri || `yandex_suggest_${i}_${Date.now()}`,
//           main_text:      title,
//           secondary_text: formattedAddress !== title ? formattedAddress : subtitle,
//           address:        formattedAddress,
//           name:           title,
//           // Coords available immediately for biz; toponyms resolved later
//           ...(hasCoords ? { lat, lng } : {}),
//           distanceMeters,
//           _uri:           uri,
//           _isBiz:         isBiz,
//           _src:           'geosuggest',
//         };
//       });

//       // ── Sort: items WITH coords first (faster UX), then by distance ──────
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
//       console.error('[YandexMapsProvider._geoSuggestSearch] exception:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Yandex Suggest API (legacy fallback autoComplete)
//   //
//   // Kept as fallback when NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is absent.
//   // ─────────────────────────────────────────────────────────────────────────

//   async _suggestSearch(query, countryCode) {
//     try {
//       const params = new URLSearchParams({
//         apikey:  this.apiKey,
//         text:    query,
//         lang:    'en_US',
//         ll:      `${this._center.lng},${this._center.lat}`,
//         spn:     '1,1',
//         results: '7',
//       });
//       if (countryCode) params.set('strict_bounds', '1');

//       const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`, {
//         headers: { 'Accept-Language': 'en' },
//       });
//       if (!res.ok) return null;

//       const data  = await res.json();
//       const items = data.results ?? [];
//       if (!items.length) return null;

//       return items.map((item, i) => {
//         const title    = item.title?.text    || '';
//         const subtitle = item.subtitle?.text || '';
//         return {
//           place_id:       `yandex_suggest_${i}_${Date.now()}`,
//           main_text:      title,
//           secondary_text: subtitle,
//           address:        subtitle ? `${title}, ${subtitle}` : title,
//           name:           title,
//           _src:           'suggest',
//         };
//       });
//     } catch (err) {
//       console.error('[YandexMapsProvider._suggestSearch] error:', err?.message);
//       return null;
//     }
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   // IMPLEMENTATION: Yandex Geocoder — place ID / URI / text → lat/lng
//   //
//   // When the caller passes a Yandex URI (ymapsbm1://...) as placeId we resolve
//   // it directly via the &uri= parameter — more reliable than text geocoding.
//   // ─────────────────────────────────────────────────────────────────────────

//   async _placeDetails(placeId, extraData) {
//     // Fast path: if GeoSuggest already embedded coords, skip the geocoder call
//     if (extraData?.lat != null && extraData?.lng != null) {
//       return {
//         lat:      extraData.lat,
//         lng:      extraData.lng,
//         address:  extraData.address || extraData.name || extraData.main_text || '',
//         name:     extraData.name    || extraData.main_text || '',
//         place_id: placeId,
//       };
//     }

//     // Determine geocoder query strategy
//     const isUri = typeof placeId === 'string' && placeId.startsWith('ymapsbm1://');
//     const text  = extraData?.address || extraData?.name || extraData?.main_text;

//     if (!isUri && !text) {
//       console.warn('[YandexMapsProvider._placeDetails] no URI and no text — cannot resolve');
//       return null;
//     }

//     console.log(`[YandexMapsProvider._placeDetails] resolving via ${isUri ? 'URI' : 'text'}:`, isUri ? placeId : text);

//     try {
//       const params = new URLSearchParams({
//         apikey:  this.apiKey,
//         format:  'json',
//         results: '1',
//         lang:    'en_US',
//       });

//       if (isUri) {
//         // URI geocoding is the most precise path for GeoSuggest results
//         params.set('uri', placeId);
//       } else {
//         params.set('geocode', text);
//       }

//       const res  = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params}`);
//       if (!res.ok) return null;
//       const data = await res.json();

//       const members = data?.response?.GeoObjectCollection?.featureMember;
//       if (!members?.length) return null;

//       const geo = members[0].GeoObject;
//       const pos = geo.Point?.pos?.split(' ');
//       if (!pos || pos.length < 2) return null;

//       const lng = parseFloat(pos[0]);
//       const lat = parseFloat(pos[1]);

//       return {
//         lat, lng,
//         address:  geo.metaDataProperty?.GeocoderMetaData?.Address?.formatted || text || '',
//         name:     (text || '').split(',')[0],
//         place_id: isUri ? placeId : `yandex_${lng}_${lat}`,
//       };
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
//         apikey:  this.apiKey,
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
//         apikey:    this.apiKey,
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
//         distance:      km  >= 1 ? `${km.toFixed(1)} km`                                 : `${Math.round(totalDistanceM)} m`,
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

  // ─────────────────────────────────────────────────────────────────────────
  // DISPATCH LAYER
  // ─────────────────────────────────────────────────────────────────────────

  _dispatchSearch(apiMethod, query, countryCode) {
    switch (apiMethod) {
      case 'GeoSuggestAPI':
        return this._geoSuggestSearch(query, countryCode);
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

  async searchPlaces(query, countryCode = null, apiMethod = 'GeoSuggestAPI') {
    if (!query) return null;
    if (apiMethod === 'GeoSuggestAPI' && !this.geoSuggestApiKey) {
      console.warn('[YandexMapsProvider] searchPlaces: GeoSuggestAPI requested but key is missing — falling back to suggest');
      return this._suggestSearch(query, countryCode);
    }
    if (apiMethod !== 'GeoSuggestAPI' && !this.geocoderKey) return null;
    return this._dispatchSearch(apiMethod, query, countryCode);
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
  // Query format: "{userText},{countryName}" (country always lowercase)
  // Spatial bias: bbox from geo_loc_country_coords (or city_coords for tighter area)
  //
  // Results are returned WITHOUT coordinates — coordinates are resolved
  // lazily via _placeDetails / Geocoder only when the user selects an entry.
  //
  // Docs: https://yandex.ru/dev/geosuggest/doc/en/
  // ─────────────────────────────────────────────────────────────────────────

  async _geoSuggestSearch(query, countryCode) {
    console.log(`[YandexMapsProvider._geoSuggestSearch] query:"${query}"`);
    try {
      // ── 1. Read saved geolocation ──────────────────────────────────────
      const geo = YandexMapsProvider._readGeoLoc();

      // ── 2. Build country-appended query text ───────────────────────────
      //    Format: "{userQuery},{countryName}" all lowercase
      const countryTag   = (geo.countryName || '').toLowerCase().trim();
      const searchText   = countryTag
        ? `${query.trim()},${countryTag}`
        : query.trim();

      console.log(`[YandexMapsProvider._geoSuggestSearch] searchText:"${searchText}"`);

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

      if (bbox) {
        // bbox gives the most relevant spatial bias for the user's country/city
        params.set('bbox', bbox);
      } else if (geo.lat != null && geo.lng != null) {
        // Fallback: ll + spn viewport bias
        params.set('ll',  `${geo.lng},${geo.lat}`);
        params.set('spn', '1,1');
      } else {
        // Hardcoded Lusaka default
        params.set('ll',  `${this._center.lng},${this._center.lat}`);
        params.set('spn', '1,1');
      }

      // ── 5. Fetch ──────────────────────────────────────────────────────
      const res = await fetch(
        `https://suggest-maps.yandex.ru/v1/suggest?${params}`,
        { headers: { 'Accept-Language': 'en' } },
      );

      console.log(`[YandexMapsProvider._geoSuggestSearch] HTTP ${res.status}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[YandexMapsProvider._geoSuggestSearch] API error:', res.status, err);
        return null;
      }

      const data  = await res.json();
      const items = data.results ?? [];

      console.log(`[YandexMapsProvider._geoSuggestSearch] ${items.length} raw results`);
      if (!items.length) return null;

      // ── 6. Map results ────────────────────────────────────────────────
      const mapped = items.map((item, i) => {
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
      console.error('[YandexMapsProvider._geoSuggestSearch] exception:', err?.message);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION: Yandex Suggest API (legacy fallback)
  // Used when NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY is absent.
  // ─────────────────────────────────────────────────────────────────────────

  async _suggestSearch(query, countryCode) {
    try {
      const geo         = YandexMapsProvider._readGeoLoc();
      const countryTag  = (geo.countryName || '').toLowerCase().trim();
      const searchText  = countryTag ? `${query.trim()},${countryTag}` : query.trim();

      const params = new URLSearchParams({
        apikey:  this.geocoderKey,
        text:    searchText,
        lang:    'en_US',
        ll:      `${this._center.lng},${this._center.lat}`,
        spn:     '1,1',
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
    } catch (err) {
      console.error('[YandexMapsProvider._suggestSearch] error:', err?.message);
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