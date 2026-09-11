// // PATH: Okra/Okrarides/delivery/components/Map/APIProviders/AppleMapsProvider.jsx

// export class AppleMapsProvider {
//   constructor(token) {
//     this.token    = token;
//     this.name     = 'applemap';
//     this._mkReady = false;
//     this._mkInit  = null;
//     console.log('[AppleMapsProvider] constructor — token present:', !!token, '| token prefix:', token?.slice(0, 20) || 'NONE');
//   }

//   // ── Load MapKit JS ────────────────────────────────────────────────────────
//   _loadMapKit() {
//     console.log('[AppleMapsProvider._loadMapKit] called — _mkInit cached:', !!this._mkInit, '| window.mapkit:', !!window?.mapkit, '| window.mapkit._initialized:', !!window?.mapkit?._initialized);
//     if (this._mkInit) {
//       console.log('[AppleMapsProvider._loadMapKit] returning cached promise');
//       return this._mkInit;
//     }

//     this._mkInit = new Promise((resolve, reject) => {
//       if (typeof window === 'undefined') {
//         console.error('[AppleMapsProvider._loadMapKit] SSR — cannot load mapkit');
//         return reject(new Error('SSR'));
//       }

//       const tryResolve = () => {
//         const mk = window.mapkit;
//         if (!mk) {
//           console.log('[AppleMapsProvider._loadMapKit] tryResolve: window.mapkit not yet available');
//           return false;
//         }
//         console.log('[AppleMapsProvider._loadMapKit] tryResolve: window.mapkit found, _initialized:', !!mk._initialized);

//         if (mk._initialized) {
//           console.log('[AppleMapsProvider._loadMapKit] ✅ reusing already-initialized mapkit');
//           this._mkReady = true;
//           resolve(mk);
//           return true;
//         }

//         console.log('[AppleMapsProvider._loadMapKit] calling mapkit.init() ourselves');
//         try {
//           mk.init({ authorizationCallback: (done) => done(this.token), language: 'en' });
//           mk._initialized = true;
//           this._mkReady = true;
//           console.log('[AppleMapsProvider._loadMapKit] ✅ mapkit.init() succeeded');
//           resolve(mk);
//           return true;
//         } catch (err) {
//           console.error('[AppleMapsProvider._loadMapKit] ❌ mapkit.init() threw:', err?.message);
//           reject(err);
//           return true;
//         }
//       };

//       if (tryResolve()) return;

//       const existing = document.getElementById('mapkit-script');
//       console.log('[AppleMapsProvider._loadMapKit] mapkit-script tag in DOM:', !!existing);
//       if (existing) {
//         console.log('[AppleMapsProvider._loadMapKit] polling for window.mapkit (max 8s)...');
//         const deadline = Date.now() + 8000;
//         let polls = 0;
//         const poll = () => {
//           polls++;
//           if (tryResolve()) {
//             console.log('[AppleMapsProvider._loadMapKit] resolved after', polls, 'polls');
//             return;
//           }
//           if (Date.now() > deadline) {
//             console.error('[AppleMapsProvider._loadMapKit] ❌ timeout after', polls, 'polls — window.mapkit never appeared');
//             reject(new Error('mapkit load timeout'));
//             return;
//           }
//           setTimeout(poll, 50);
//         };
//         poll();
//         return;
//       }

//       console.log('[AppleMapsProvider._loadMapKit] injecting mapkit.js script ourselves');
//       const script = document.createElement('script');
//       script.id  = 'mapkit-script';
//       script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
//       script.crossOrigin = 'anonymous';
//       script.async = true;
//       script.onload = () => {
//         console.log('[AppleMapsProvider._loadMapKit] script onload fired — window.mapkit:', !!window.mapkit);
//         if (!tryResolve()) reject(new Error('mapkit not on window after load'));
//       };
//       script.onerror = (e) => {
//         console.error('[AppleMapsProvider._loadMapKit] ❌ script failed to load:', e);
//         reject(e);
//       };
//       document.head.appendChild(script);
//     });

//     return this._mkInit;
//   }

//   // ── Search places ─────────────────────────────────────────────────────────
//   async searchPlaces(query, countryCode = null) {
//     console.log('[AppleMapsProvider.searchPlaces] ▶ query:', JSON.stringify(query), '| countryCode:', countryCode);
//     console.log('[AppleMapsProvider.searchPlaces] token present:', !!this.token, '| _mkReady:', this._mkReady);

//     if (!this.token) {
//       console.warn('[AppleMapsProvider.searchPlaces] ❌ no token — cannot search');
//       return null;
//     }

//     try {
//       console.log('[AppleMapsProvider.searchPlaces] awaiting _loadMapKit...');
//       const mapkit = await this._loadMapKit();
//       console.log('[AppleMapsProvider.searchPlaces] mapkit resolved:', !!mapkit, '| mapkit.Search available:', typeof mapkit?.Search);

//       if (!mapkit?.Search) {
//         console.error('[AppleMapsProvider.searchPlaces] ❌ mapkit.Search is not available — mapkit may not be fully loaded');
//         console.log('[AppleMapsProvider.searchPlaces] mapkit keys:', Object.keys(mapkit || {}));
//         return null;
//       }

//       const searchOptions = { language: 'en-US', getsUserLocation: false };
//       if (countryCode) searchOptions.limitToCountries = countryCode.toUpperCase();
//       console.log('[AppleMapsProvider.searchPlaces] creating mapkit.Search with options:', searchOptions);

//       const results = await new Promise((resolve) => {
//         const search = new mapkit.Search(searchOptions);
//         console.log('[AppleMapsProvider.searchPlaces] calling search.search()...');
//         search.search(query, (err, data) => {
//           console.log('[AppleMapsProvider.searchPlaces] search callback — err:', err, '| data keys:', Object.keys(data || {}));
//           if (err) {
//             console.warn('[AppleMapsProvider.searchPlaces] mapkit.Search error:', JSON.stringify(err));
//             resolve(null);
//             return;
//           }
//           const places = data?.places || [];
//           const items  = data?.displayItems || [];
//           console.log('[AppleMapsProvider.searchPlaces] places:', places.length, '| displayItems:', items.length);
//           const all = places.length ? places : items;
//           if (!all.length) { resolve(null); return; }
//           const mapped = all.map((r, i) => ({
//             place_id:       `apple_${i}_${Date.now()}`,
//             main_text:      r.name || r.displayLines?.[0] || r.formattedAddress?.split(',')[0] || '',
//             secondary_text: r.formattedAddress || r.displayLines?.slice(1).join(', ') || '',
//             address:        r.formattedAddress || r.name || '',
//             name:           r.name || r.displayLines?.[0] || '',
//             lat:            r.coordinate?.latitude  ?? null,
//             lng:            r.coordinate?.longitude ?? null,
//           }));
//           console.log('[AppleMapsProvider.searchPlaces] mapped', mapped.length, 'results:', mapped.map(r => r.main_text).join(', '));
//           resolve(mapped);
//         });
//       });

//       if (results?.length) {
//         console.log('[AppleMapsProvider.searchPlaces] ✅ returning', results.length, 'results from Search');
//         return results;
//       }

//       // Geocoder fallback for exact addresses
//       console.log('[AppleMapsProvider.searchPlaces] Search empty — trying Geocoder fallback');
//       return await new Promise((resolve) => {
//         const geocoder = new mapkit.Geocoder({ language: 'en-US' });
//         geocoder.lookup(query, (err, data) => {
//           console.log('[AppleMapsProvider.searchPlaces] Geocoder callback — err:', err, '| results:', data?.results?.length ?? 0);
//           if (err || !data?.results?.length) { resolve(null); return; }
//           const mapped = data.results.map((r, i) => ({
//             place_id:       `apple_geo_${i}_${Date.now()}`,
//             main_text:      r.name || r.formattedAddress?.split(',')[0] || '',
//             secondary_text: r.formattedAddress || '',
//             address:        r.formattedAddress || r.name || '',
//             name:           r.name || '',
//             lat:            r.coordinate?.latitude  ?? null,
//             lng:            r.coordinate?.longitude ?? null,
//           }));
//           console.log('[AppleMapsProvider.searchPlaces] Geocoder returned', mapped.length, 'results');
//           resolve(mapped);
//         });
//       });

//     } catch (err) {
//       console.error('[AppleMapsProvider.searchPlaces] ❌ exception:', err?.message, err);
//       return null;
//     }
//   }

//   // ── Place details ─────────────────────────────────────────────────────────
//   async getPlaceDetails(placeId, extraData = null) {
//     console.log('[AppleMapsProvider.getPlaceDetails] placeId:', placeId, '| extraData lat/lng:', extraData?.lat, extraData?.lng);
//     if (extraData?.lat != null && extraData?.lng != null) {
//       console.log('[AppleMapsProvider.getPlaceDetails] ✅ fast path — coords already in extraData');
//       return {
//         lat:      extraData.lat,
//         lng:      extraData.lng,
//         address:  extraData.address || extraData.main_text || '',
//         name:     extraData.name    || extraData.main_text || '',
//         place_id: placeId,
//       };
//     }
//     const text = extraData?._rawText || extraData?.name || extraData?.address;
//     console.log('[AppleMapsProvider.getPlaceDetails] no coords — geocoding text:', text);
//     if (!text) return null;
//     const result = await this.geocodeAddress(text);
//     if (!result) return null;
//     return { ...result, name: text.split(',')[0], place_id: placeId };
//   }

//   // ── Forward geocode ───────────────────────────────────────────────────────
//   async geocodeAddress(address) {
//     console.log('[AppleMapsProvider.geocodeAddress]', address);
//     if (!this.token) return null;
//     try {
//       const mapkit = await this._loadMapKit();
//       return await new Promise((resolve) => {
//         const geocoder = new mapkit.Geocoder({ language: 'en-US' });
//         geocoder.lookup(address, (err, data) => {
//           if (err || !data?.results?.length) { console.warn('[AppleMapsProvider.geocodeAddress] no results'); resolve(null); return; }
//           const r = data.results[0];
//           resolve({ lat: r.coordinate.latitude, lng: r.coordinate.longitude, address: r.formattedAddress || address, place_id: `apple_geo_${r.coordinate.latitude}_${r.coordinate.longitude}` });
//         });
//       });
//     } catch (err) {
//       console.error('[AppleMapsProvider.geocodeAddress] error:', err?.message);
//       return null;
//     }
//   }

//   // ── Reverse geocode ───────────────────────────────────────────────────────
//   async reverseGeocode(lat, lng) {
//     if (!this.token) return null;
//     try {
//       const mapkit = await this._loadMapKit();
//       return await new Promise((resolve) => {
//         const geocoder = new mapkit.Geocoder({ language: 'en-US' });
//         geocoder.reverseLookup(new mapkit.Coordinate(lat, lng), (err, data) => {
//           if (err || !data?.results?.length) { resolve(null); return; }
//           const r = data.results[0];
//           resolve({ lat, lng, address: r.formattedAddress || '', name: r.name || r.locality || '', place_id: `apple_rev_${lat}_${lng}`, city: r.locality || null, country: r.country || null });
//         });
//       });
//     } catch (err) {
//       console.error('[AppleMapsProvider.reverseGeocode] error:', err?.message);
//       return null;
//     }
//   }

//   // ── Route ─────────────────────────────────────────────────────────────────
//   // 1. MapKit JS Directions API (in-browser, no extra key)
//   // 2. Local OSRM server fallback
//   // 3. Straight-line last resort
//   // Returns: { type, distance, duration, distanceValue, durationValue, geometry[[lng,lat],...], steps }
//   async getRoute(origin, destination) {
//     console.log('[AppleMapsProvider.getRoute] ▶', origin, '->', destination);

//     // 1. Apple Directions API
//     try {
//       const mapkit = await this._loadMapKit();
//       if (mapkit?.Directions) {
//         const result = await new Promise((resolve) => {
//           const dirs = new mapkit.Directions();
//           dirs.route({
//             origin:        new mapkit.Coordinate(origin.lat, origin.lng),
//             destination:   new mapkit.Coordinate(destination.lat, destination.lng),
//             transportType: mapkit.Directions.Transport.Automobile,
//           }, (err, data) => {
//             if (err || !data?.routes?.length) { resolve(null); return; }
//             const r        = data.routes[0];
//             // route.polyline.points is an array of mapkit.Coordinate objects
//             const pts      = r.polyline?.points || [];
//             const geometry = pts.map(p => [p.longitude, p.latitude]);
//             if (geometry.length < 2) { resolve(null); return; }
//             const distKm = (r.distance || 0) / 1000;
//             const durMin = (r.expectedTravelTime || 0) / 60;
//             resolve({
//               type:          'apple',
//               distance:      distKm >= 1 ? distKm.toFixed(1) + ' km' : Math.round(distKm * 1000) + ' m',
//               duration:      durMin >= 60
//                 ? Math.floor(durMin / 60) + 'h ' + Math.round(durMin % 60) + 'min'
//                 : Math.round(durMin) + ' min',
//               distanceValue: Math.round(r.distance || 0),
//               durationValue: Math.round(r.expectedTravelTime || 0),
//               geometry,
//               steps: (r.steps || []).map(s => ({ instruction: s.instructions, distance: s.distance })),
//             });
//           });
//         });
//         if (result) {
//           console.log('[AppleMapsProvider.getRoute] ✅ Apple Directions succeeded');
//           return result;
//         }
//         console.warn('[AppleMapsProvider.getRoute] Apple Directions returned no route — trying local server');
//       }
//     } catch (err) {
//       console.warn('[AppleMapsProvider.getRoute] Apple Directions exception:', err?.message);
//     }

//     // 2. Local OSRM server
//     const localUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL) || '';
//     if (localUrl) {
//       try {
//         const res = await fetch(
//           `${localUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
//           { signal: AbortSignal.timeout(8000) }
//         );
//         if (!res.ok) throw new Error(`Local route ${res.status}`);
//         const data = await res.json();
//         console.log('[AppleMapsProvider.getRoute] ✅ local server route');
//         return {
//           type:          'local',
//           distance:      data.distance,
//           duration:      data.duration,
//           distanceValue: data.distanceValue,
//           durationValue: data.durationValue,
//           geometry:      data.geometry || [],
//           steps:         data.steps    || [],
//         };
//       } catch (err) {
//         console.warn('[AppleMapsProvider.getRoute] local server failed:', err?.message);
//       }
//     }

//     // 3. Straight-line fallback
//     const dist = this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
//     console.warn('[AppleMapsProvider.getRoute] ⚠ using straight-line fallback');
//     return {
//       type:          'straight',
//       distance:      dist.toFixed(1) + ' km',
//       duration:      'N/A',
//       distanceValue: Math.round(dist * 1000),
//       durationValue: 0,
//       geometry:      [[origin.lng, origin.lat], [destination.lng, destination.lat]],
//       steps:         [],
//     };
//   }

//   // ── Navigation ────────────────────────────────────────────────────────────
//   getNavigationDeepLink(destination, origin = null) {
//     const params = new URLSearchParams({ daddr: `${destination.lat},${destination.lng}`, dirflg: 'd' });
//     if (origin) params.set('saddr', `${origin.lat},${origin.lng}`);
//     const webUrl = `https://maps.apple.com/?${params}`;
//     const appUrl = `maps://?daddr=${destination.lat},${destination.lng}&dirflg=d`;
//     const isMobile = typeof navigator !== 'undefined' && /iphone|ipad|ipod|mac/i.test(navigator.userAgent);
//     return { webUrl, appUrl: isMobile ? appUrl : null, isMobile };
//   }

//   openNavigation(destination, origin = null) {
//     const { webUrl, appUrl, isMobile } = this.getNavigationDeepLink(destination, origin);
//     if (isMobile && appUrl) { window.location.href = appUrl; setTimeout(() => window.open(webUrl, '_blank'), 1500); }
//     else window.open(webUrl, '_blank');
//   }

//   calculateDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
//     const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//   }
// }

// export default AppleMapsProvider;
// PATH: Okra/Okrarides/delivery/components/Map/APIProviders/AppleMapsProvider.jsx
//
// Updated from delivery original:
//  - All public methods now accept an optional apiMethod parameter
//    (forwarded from MapsProvider dispatch pattern)
//  - setViewport() and setCenter() added for geographic autocomplete bias
//  All existing logic (_loadMapKit, searchPlaces, getRoute with Apple Directions
//  fallback, openNavigation, etc.) preserved exactly.

export class AppleMapsProvider {
  constructor(token) {
    this.token    = token;
    this.name     = 'apple';
    this._mkReady = false;
    this._mkInit  = null;
    this._center  = { lat: -15.4167, lng: 28.2833 };
    console.log('[AppleMapsProvider] constructor — token present:', !!token, '| token prefix:', token?.slice(0, 20) || 'NONE');
  }

  // Allow map display to push viewport centre for autocomplete bias
  setViewport(lat, lng, _radiusM, _regionCode) {
    this._center = { lat, lng };
  }

  setCenter(lat, lng) { this._center = { lat, lng }; }

  // ── Load MapKit JS ────────────────────────────────────────────────────────
  _loadMapKit() {
    console.log('[AppleMapsProvider._loadMapKit] called — _mkInit cached:', !!this._mkInit, '| window.mapkit:', !!window?.mapkit, '| window.mapkit._initialized:', !!window?.mapkit?._initialized);
    if (this._mkInit) {
      console.log('[AppleMapsProvider._loadMapKit] returning cached promise');
      return this._mkInit;
    }

    this._mkInit = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        console.error('[AppleMapsProvider._loadMapKit] SSR — cannot load mapkit');
        return reject(new Error('SSR'));
      }

      const tryResolve = () => {
        const mk = window.mapkit;
        if (!mk) {
          console.log('[AppleMapsProvider._loadMapKit] tryResolve: window.mapkit not yet available');
          return false;
        }
        console.log('[AppleMapsProvider._loadMapKit] tryResolve: window.mapkit found, _initialized:', !!mk._initialized);

        if (mk._initialized) {
          console.log('[AppleMapsProvider._loadMapKit] ✅ reusing already-initialized mapkit');
          this._mkReady = true;
          resolve(mk);
          return true;
        }

        console.log('[AppleMapsProvider._loadMapKit] calling mapkit.init() ourselves');
        try {
          mk.init({ authorizationCallback: (done) => done(this.token), language: 'en' });
          mk._initialized = true;
          this._mkReady = true;
          console.log('[AppleMapsProvider._loadMapKit] ✅ mapkit.init() succeeded');
          resolve(mk);
          return true;
        } catch (err) {
          console.error('[AppleMapsProvider._loadMapKit] ❌ mapkit.init() threw:', err?.message);
          reject(err);
          return true;
        }
      };

      if (tryResolve()) return;

      const existing = document.getElementById('mapkit-script');
      console.log('[AppleMapsProvider._loadMapKit] mapkit-script tag in DOM:', !!existing);
      if (existing) {
        console.log('[AppleMapsProvider._loadMapKit] polling for window.mapkit (max 8s)...');
        const deadline = Date.now() + 8000;
        let polls = 0;
        const poll = () => {
          polls++;
          if (tryResolve()) {
            console.log('[AppleMapsProvider._loadMapKit] resolved after', polls, 'polls');
            return;
          }
          if (Date.now() > deadline) {
            console.error('[AppleMapsProvider._loadMapKit] ❌ timeout after', polls, 'polls — window.mapkit never appeared');
            reject(new Error('mapkit load timeout'));
            return;
          }
          setTimeout(poll, 50);
        };
        poll();
        return;
      }

      console.log('[AppleMapsProvider._loadMapKit] injecting mapkit.js script ourselves');
      const script = document.createElement('script');
      script.id  = 'mapkit-script';
      script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.onload = () => {
        console.log('[AppleMapsProvider._loadMapKit] script onload fired — window.mapkit:', !!window.mapkit);
        if (!tryResolve()) reject(new Error('mapkit not on window after load'));
      };
      script.onerror = (e) => {
        console.error('[AppleMapsProvider._loadMapKit] ❌ script failed to load:', e);
        reject(e);
      };
      document.head.appendChild(script);
    });

    return this._mkInit;
  }

  // ── Search places — apiMethod accepted, dispatches to MapKit Search ───────
  async searchPlaces(query, countryCode = null, _apiMethod = 'search') {
    console.log('[AppleMapsProvider.searchPlaces] ▶ query:', JSON.stringify(query), '| countryCode:', countryCode);
    console.log('[AppleMapsProvider.searchPlaces] token present:', !!this.token, '| _mkReady:', this._mkReady);

    if (!this.token) {
      console.warn('[AppleMapsProvider.searchPlaces] ❌ no token — cannot search');
      return null;
    }

    try {
      console.log('[AppleMapsProvider.searchPlaces] awaiting _loadMapKit...');
      const mapkit = await this._loadMapKit();
      console.log('[AppleMapsProvider.searchPlaces] mapkit resolved:', !!mapkit, '| mapkit.Search available:', typeof mapkit?.Search);

      if (!mapkit?.Search) {
        console.error('[AppleMapsProvider.searchPlaces] ❌ mapkit.Search is not available — mapkit may not be fully loaded');
        console.log('[AppleMapsProvider.searchPlaces] mapkit keys:', Object.keys(mapkit || {}));
        return null;
      }

      const searchOptions = { language: 'en-US', getsUserLocation: false };

      // Apply viewport bias when available
      try { searchOptions.coordinate = new mapkit.Coordinate(this._center.lat, this._center.lng); } catch {}
      try {
        searchOptions.region = new mapkit.CoordinateRegion(
          new mapkit.Coordinate(this._center.lat, this._center.lng),
          new mapkit.CoordinateSpan(1.8, 1.8),
        );
      } catch {}

      if (countryCode) searchOptions.limitToCountries = countryCode.toUpperCase();
      console.log('[AppleMapsProvider.searchPlaces] creating mapkit.Search with options:', searchOptions);

      const results = await new Promise((resolve) => {
        const search = new mapkit.Search(searchOptions);
        console.log('[AppleMapsProvider.searchPlaces] calling search.search()...');
        search.search(query, (err, data) => {
          console.log('[AppleMapsProvider.searchPlaces] search callback — err:', err, '| data keys:', Object.keys(data || {}));
          if (err) {
            console.warn('[AppleMapsProvider.searchPlaces] mapkit.Search error:', JSON.stringify(err));
            resolve(null);
            return;
          }
          const places = data?.places || [];
          const items  = data?.displayItems || [];
          console.log('[AppleMapsProvider.searchPlaces] places:', places.length, '| displayItems:', items.length);
          const all = places.length ? places : items;
          if (!all.length) { resolve(null); return; }
          const mapped = all.map((r, i) => ({
            place_id:       `apple_${i}_${Date.now()}`,
            main_text:      r.name || r.displayLines?.[0] || r.formattedAddress?.split(',')[0] || '',
            secondary_text: r.formattedAddress || r.displayLines?.slice(1).join(', ') || '',
            address:        r.formattedAddress || r.name || '',
            name:           r.name || r.displayLines?.[0] || '',
            lat:            r.coordinate?.latitude  ?? null,
            lng:            r.coordinate?.longitude ?? null,
          }));
          console.log('[AppleMapsProvider.searchPlaces] mapped', mapped.length, 'results:', mapped.map(r => r.main_text).join(', '));
          resolve(mapped);
        });
      });

      if (results?.length) {
        console.log('[AppleMapsProvider.searchPlaces] ✅ returning', results.length, 'results from Search');
        return results;
      }

      // Geocoder fallback
      console.log('[AppleMapsProvider.searchPlaces] Search empty — trying Geocoder fallback');
      return await new Promise((resolve) => {
        const geocoder = new mapkit.Geocoder({ language: 'en-US' });
        geocoder.lookup(query, (err, data) => {
          console.log('[AppleMapsProvider.searchPlaces] Geocoder callback — err:', err, '| results:', data?.results?.length ?? 0);
          if (err || !data?.results?.length) { resolve(null); return; }
          const mapped = data.results.map((r, i) => ({
            place_id:       `apple_geo_${i}_${Date.now()}`,
            main_text:      r.name || r.formattedAddress?.split(',')[0] || '',
            secondary_text: r.formattedAddress || '',
            address:        r.formattedAddress || r.name || '',
            name:           r.name || '',
            lat:            r.coordinate?.latitude  ?? null,
            lng:            r.coordinate?.longitude ?? null,
          }));
          console.log('[AppleMapsProvider.searchPlaces] Geocoder returned', mapped.length, 'results');
          resolve(mapped);
        });
      });

    } catch (err) {
      console.error('[AppleMapsProvider.searchPlaces] ❌ exception:', err?.message, err);
      return null;
    }
  }

  // ── Place details — apiMethod accepted ────────────────────────────────────
  async getPlaceDetails(placeId, extraData = null, _apiMethod = 'geocoder') {
    console.log('[AppleMapsProvider.getPlaceDetails] placeId:', placeId, '| extraData lat/lng:', extraData?.lat, extraData?.lng);
    if (extraData?.lat != null && extraData?.lng != null) {
      console.log('[AppleMapsProvider.getPlaceDetails] ✅ fast path — coords already in extraData');
      return {
        lat:      extraData.lat,
        lng:      extraData.lng,
        address:  extraData.address || extraData.main_text || '',
        name:     extraData.name    || extraData.main_text || '',
        place_id: placeId,
      };
    }
    const text = extraData?._rawText || extraData?.name || extraData?.address;
    console.log('[AppleMapsProvider.getPlaceDetails] no coords — geocoding text:', text);
    if (!text) return null;
    const result = await this.geocodeAddress(text);
    if (!result) return null;
    return { ...result, name: text.split(',')[0], place_id: placeId };
  }

  // ── Forward geocode ───────────────────────────────────────────────────────
  async geocodeAddress(address) {
    console.log('[AppleMapsProvider.geocodeAddress]', address);
    if (!this.token) return null;
    try {
      const mapkit = await this._loadMapKit();
      return await new Promise((resolve) => {
        const geocoder = new mapkit.Geocoder({ language: 'en-US' });
        geocoder.lookup(address, (err, data) => {
          if (err || !data?.results?.length) { console.warn('[AppleMapsProvider.geocodeAddress] no results'); resolve(null); return; }
          const r = data.results[0];
          resolve({ lat: r.coordinate.latitude, lng: r.coordinate.longitude, address: r.formattedAddress || address, place_id: `apple_geo_${r.coordinate.latitude}_${r.coordinate.longitude}` });
        });
      });
    } catch (err) {
      console.error('[AppleMapsProvider.geocodeAddress] error:', err?.message);
      return null;
    }
  }

  // ── Reverse geocode — apiMethod accepted ──────────────────────────────────
  async reverseGeocode(lat, lng, _apiMethod = 'geocoder') {
    if (!this.token) return null;
    try {
      const mapkit = await this._loadMapKit();
      return await new Promise((resolve) => {
        const geocoder = new mapkit.Geocoder({ language: 'en-US' });
        geocoder.reverseLookup(new mapkit.Coordinate(lat, lng), (err, data) => {
          if (err || !data?.results?.length) { resolve(null); return; }
          const r = data.results[0];
          resolve({ lat, lng, address: r.formattedAddress || '', name: r.name || r.locality || '', place_id: `apple_rev_${lat}_${lng}`, city: r.locality || null, country: r.country || null });
        });
      });
    } catch (err) {
      console.error('[AppleMapsProvider.reverseGeocode] error:', err?.message);
      return null;
    }
  }

  // ── Route — apiMethod accepted, dispatches to Apple Directions ────────────
  // 1. MapKit JS Directions API, 2. Local OSRM, 3. Straight-line
  async getRoute(origin, destination, _apiMethod = 'deeplink') {
    console.log('[AppleMapsProvider.getRoute] ▶', origin, '->', destination);

    // 1. Apple Directions API
    try {
      const mapkit = await this._loadMapKit();
      if (mapkit?.Directions) {
        const result = await new Promise((resolve) => {
          const dirs = new mapkit.Directions();
          dirs.route({
            origin:        new mapkit.Coordinate(origin.lat, origin.lng),
            destination:   new mapkit.Coordinate(destination.lat, destination.lng),
            transportType: mapkit.Directions.Transport.Automobile,
          }, (err, data) => {
            if (err || !data?.routes?.length) { resolve(null); return; }
            const r        = data.routes[0];
            const pts      = r.polyline?.points || [];
            const geometry = pts.map(p => [p.longitude, p.latitude]);
            if (geometry.length < 2) { resolve(null); return; }
            const distKm = (r.distance || 0) / 1000;
            const durMin = (r.expectedTravelTime || 0) / 60;
            resolve({
              type:          'apple',
              distance:      distKm >= 1 ? distKm.toFixed(1) + ' km' : Math.round(distKm * 1000) + ' m',
              duration:      durMin >= 60
                ? Math.floor(durMin / 60) + 'h ' + Math.round(durMin % 60) + 'min'
                : Math.round(durMin) + ' min',
              distanceValue: Math.round(r.distance || 0),
              durationValue: Math.round(r.expectedTravelTime || 0),
              geometry,
              steps: (r.steps || []).map(s => ({ instruction: s.instructions, distance: s.distance })),
            });
          });
        });
        if (result) {
          console.log('[AppleMapsProvider.getRoute] ✅ Apple Directions succeeded');
          return result;
        }
        console.warn('[AppleMapsProvider.getRoute] Apple Directions returned no route — trying local server');
      }
    } catch (err) {
      console.warn('[AppleMapsProvider.getRoute] Apple Directions exception:', err?.message);
    }

    // 2. Local OSRM server
    const localUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL) || '';
    if (localUrl) {
      try {
        const res = await fetch(
          `${localUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error(`Local route ${res.status}`);
        const data = await res.json();
        console.log('[AppleMapsProvider.getRoute] ✅ local server route');
        return {
          type:          'local',
          distance:      data.distance,
          duration:      data.duration,
          distanceValue: data.distanceValue,
          durationValue: data.durationValue,
          geometry:      data.geometry || [],
          steps:         data.steps    || [],
        };
      } catch (err) {
        console.warn('[AppleMapsProvider.getRoute] local server failed:', err?.message);
      }
    }

    // 3. Straight-line fallback
    const dist = this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    console.warn('[AppleMapsProvider.getRoute] ⚠ using straight-line fallback');
    return {
      type:          'straight',
      distance:      dist.toFixed(1) + ' km',
      duration:      'N/A',
      distanceValue: Math.round(dist * 1000),
      durationValue: 0,
      geometry:      [[origin.lng, origin.lat], [destination.lng, destination.lat]],
      steps:         [],
    };
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  getNavigationDeepLink(destination, origin = null) {
    const params = new URLSearchParams({ daddr: `${destination.lat},${destination.lng}`, dirflg: 'd' });
    if (origin) params.set('saddr', `${origin.lat},${origin.lng}`);
    const webUrl = `https://maps.apple.com/?${params}`;
    const appUrl = `maps://?daddr=${destination.lat},${destination.lng}&dirflg=d`;
    const isMobile = typeof navigator !== 'undefined' && /iphone|ipad|ipod|mac/i.test(navigator.userAgent);
    return { webUrl, appUrl: isMobile ? appUrl : null, isMobile };
  }

  openNavigation(destination, origin = null) {
    const { webUrl, appUrl, isMobile } = this.getNavigationDeepLink(destination, origin);
    if (isMobile && appUrl) { window.location.href = appUrl; setTimeout(() => window.open(webUrl, '_blank'), 1500); }
    else window.open(webUrl, '_blank');
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}

export default AppleMapsProvider;