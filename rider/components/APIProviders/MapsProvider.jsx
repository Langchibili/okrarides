// // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx
// // // // 'use client';

// // // // import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
// // // // import { GoogleMapsProvider } from './GoogleMapsProvider';
// // // // import { YandexMapsProvider } from './YandexMapsProvider';
// // // // import { WazeMapsProvider }   from './WazeMapsProvider';
// // // // import { AppleMapsProvider }  from './AppleMapsProvider';
// // // // import { GeoapifyProvider }   from './GeoapifyProvider';

// // // // const MapsContext = createContext(null);

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // PROVIDER NAME CONSTANTS
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // const PROVIDER = {
// // // //   GOOGLE:     'google',
// // // //   APPLE:      'apple',
// // // //   YANDEX:     'yandex',
// // // //   WAZE:       'waze',
// // // //   GEOAPIFY:   'geoapify',
// // // //   OPENSTREET: 'openstreet',
// // // //   LOCAL:      'local',
// // // // };

// // // // const DEEP_LINK_PROVIDERS = new Set([PROVIDER.WAZE, PROVIDER.APPLE]);
// // // // const INLINE_PROVIDERS    = new Set([PROVIDER.OPENSTREET, PROVIDER.LOCAL]);

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // DEFAULT SERVICE → API METHOD MAP PER PROVIDER
// // // // //
// // // // // Strapi per-provider config objects are merged over these at load time.
// // // // // An empty config {} leaves all defaults intact.
// // // // //
// // // // // service keys: routing | distance | eta | autoComplete | location
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // const DEFAULT_SERVICE_APIS = {
// // // //   [PROVIDER.GOOGLE]: {
// // // //     routing:      'routeApi',
// // // //     distance:     'routeApi',
// // // //     eta:          'routeApi',
// // // //     autoComplete: 'placesApi',
// // // //     location:     'geocoding',
// // // //   },
// // // //   [PROVIDER.APPLE]: {
// // // //     routing:      'deeplink',
// // // //     distance:     'mapkit',
// // // //     eta:          null,
// // // //     autoComplete: 'search',
// // // //     location:     'geocoder',
// // // //   },
// // // //   [PROVIDER.YANDEX]: {
// // // //     routing:      'routeApi',
// // // //     distance:     'routeApi',
// // // //     eta:          'routeApi',
// // // //     autoComplete: 'suggest',
// // // //     location:     'geocoder',
// // // //   },
// // // //   [PROVIDER.GEOAPIFY]: {
// // // //     routing:      'routingApi',
// // // //     distance:     'routingApi',
// // // //     eta:          'routingApi',
// // // //     autoComplete: 'placesApi',
// // // //     location:     'geocodingApi',
// // // //   },
// // // //   [PROVIDER.WAZE]: {
// // // //     routing:      'deeplink',
// // // //     distance:     null,
// // // //     eta:          null,
// // // //     autoComplete: null,
// // // //     location:     null,
// // // //   },
// // // //   [PROVIDER.OPENSTREET]: {
// // // //     routing:      'osrm',
// // // //     distance:     'osrm',
// // // //     eta:          'osrm',
// // // //     autoComplete: 'nominatim',
// // // //     location:     'nominatim',
// // // //   },
// // // //   [PROVIDER.LOCAL]: {
// // // //     routing:      'localOsrm',
// // // //     distance:     'localOsrm',
// // // //     eta:          'localOsrm',
// // // //     autoComplete: 'nominatim',
// // // //     location:     'nominatim',
// // // //   },
// // // // };

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // PARSE mapsProviders ARRAY FROM STRAPI
// // // // //
// // // // // Expected Strapi shape:
// // // // //   [
// // // // //     { "name": "geoapify", "config": {} },
// // // // //     { "name": "google",   "config": { "routing": "routeApi", ... } },
// // // // //     { "name": "waze",     "config": {} },
// // // // //     ...
// // // // //   ]
// // // // //
// // // // // Returns:
// // // // //   providerNames:   ["geoapify", "google", "waze", ...]   ordered
// // // // //   perProviderApis: { google: { routing: "routeApi", ... } }
// // // // //
// // // // // Robustness: also handles the old flat alternating format
// // // // //   ["google:", {...}, "waze:", {}] in case old data is still in Strapi.
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // function parseMapsProviders(rawList) {
// // // //   const providerNames   = [];
// // // //   const perProviderApis = {};
// // // //   const seen            = new Set();

// // // //   if (!Array.isArray(rawList)) return { providerNames, perProviderApis };

// // // //   // ── New format: array of { name, config } objects ─────────────────────────
// // // //   const isNewFormat = rawList.length > 0 &&
// // // //     typeof rawList[0] === 'object' && rawList[0] !== null &&
// // // //     'name' in rawList[0];

// // // //   if (isNewFormat) {
// // // //     for (const entry of rawList) {
// // // //       if (!entry || typeof entry !== 'object') continue;

// // // //       const name   = (entry.name || '').trim();
// // // //       const config = (entry.config && typeof entry.config === 'object') ? entry.config : {};

// // // //       if (!name) continue;
// // // //       if (!seen.has(name)) { providerNames.push(name); seen.add(name); }

// // // //       // Non-empty config merges over any previous entry for this provider
// // // //       if (Object.keys(config).length > 0) {
// // // //         perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
// // // //       }
// // // //     }
// // // //     return { providerNames, perProviderApis };
// // // //   }

// // // //   // ── Legacy format: ["google:", { routing: "routeApi" }, "waze:", {}, ...] ─
// // // //   for (let i = 0; i < rawList.length; i++) {
// // // //     const item = rawList[i];
// // // //     if (typeof item !== 'string') continue;

// // // //     const name = item.replace(/:$/, '').trim();
// // // //     if (!name) continue;

// // // //     const next   = rawList[i + 1];
// // // //     const config = (next !== null && typeof next === 'object' && !Array.isArray(next)) ? next : {};

// // // //     if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
// // // //     if (Object.keys(config).length > 0) {
// // // //       perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
// // // //     }
// // // //   }

// // // //   return { providerNames, perProviderApis };
// // // // }

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // DATE HELPERS
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // function getMonthKey() {
// // // //   const d = new Date();
// // // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// // // // }

// // // // function getDayKey() {
// // // //   const d = new Date();
// // // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// // // // }

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // QUOTA
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // const QUOTA_DEFAULTS = {
// // // //   maxMonthlyRequests:          20_000,
// // // //   maxDailyGeocoderApiRequests:    1000,
// // // //   maxDailyJSApiRequests:       20_000,
// // // // };

// // // // function dailyBucketKey(apiType) {
// // // //   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// // // // }

// // // // function buildFreshProviderData() {
// // // //   return {
// // // //     maxDailyGeocoderApiRequests: QUOTA_DEFAULTS.maxDailyGeocoderApiRequests,
// // // //     maxDailyJSApiRequests:       QUOTA_DEFAULTS.maxDailyJSApiRequests,
// // // //     requestCounts: {},
// // // //     dailyCounts:   {},
// // // //   };
// // // // }

// // // // function computeBudget(record) {
// // // //   const pd       = record?.providerData || {};
// // // //   const monthKey = getMonthKey();
// // // //   const dayKey   = getDayKey();

// // // //   const monthData   = pd.requestCounts?.[monthKey] || {};
// // // //   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
// // // //   const monthlyMax  = record?.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests;

// // // //   const dayData     = pd.dailyCounts?.[dayKey] || {};
// // // //   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || QUOTA_DEFAULTS.maxDailyGeocoderApiRequests;
// // // //   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || QUOTA_DEFAULTS.maxDailyJSApiRequests;

// // // //   return {
// // // //     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
// // // //     dailyGeoRemaining: Math.max(0, maxDailyGeo - (Number(dayData.geo) || 0)),
// // // //     dailyJSRemaining:  Math.max(0, maxDailyJS  - (Number(dayData.js)  || 0)),
// // // //     monthlyMax, maxDailyGeo, maxDailyJS,
// // // //   };
// // // // }

// // // // function hasQuota(record, apiType) {
// // // //   const name = record?.providerName;
// // // //   if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;
// // // //   const b = computeBudget(record);
// // // //   return (
// // // //     b.monthlyRemaining > 0 &&
// // // //     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
// // // //     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0)
// // // //   );
// // // // }

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // PROVIDER INSTANCE FACTORY
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // function createProviderInstance(name) {
// // // //   switch (name) {
// // // //     case PROVIDER.WAZE:       return new WazeMapsProvider();
// // // //     case PROVIDER.APPLE:      return new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
// // // //     case PROVIDER.GOOGLE:     return new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
// // // //     case PROVIDER.YANDEX:     return new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
// // // //     case PROVIDER.GEOAPIFY:   return new GeoapifyProvider(process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '');
// // // //     case PROVIDER.OPENSTREET:
// // // //     case PROVIDER.LOCAL:      return null;
// // // //     default:
// // // //       console.warn(`[MapsProvider] createProviderInstance: unknown provider "${name}"`);
// // // //       return null;
// // // //   }
// // // // }

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // NOMINATIM
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // async function nominatimSearch(query, countryCode = null) {
// // // //   try {
// // // //     const params = new URLSearchParams({ q: query, format: 'json', limit: '7', addressdetails: '1' });
// // // //     if (countryCode) params.set('countrycodes', countryCode);
// // // //     const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
// // // //       headers: { 'Accept-Language': 'en' },
// // // //     });
// // // //     if (!res.ok) return [];
// // // //     const data = await res.json();
// // // //     return data.map((item) => ({
// // // //       place_id:       item.place_id?.toString(),
// // // //       main_text:      item.name || item.display_name?.split(',')[0],
// // // //       secondary_text: item.display_name,
// // // //       lat:            parseFloat(item.lat),
// // // //       lng:            parseFloat(item.lon),
// // // //       address:        item.display_name,
// // // //       name:           item.name || item.display_name?.split(',')[0],
// // // //     }));
// // // //   } catch { return []; }
// // // // }

// // // // async function nominatimReverse(lat, lng) {
// // // //   try {
// // // //     const res = await fetch(
// // // //       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
// // // //       { headers: { 'Accept-Language': 'en' } },
// // // //     );
// // // //     if (!res.ok) return null;
// // // //     const data = await res.json();
// // // //     return {
// // // //       lat, lng,
// // // //       address:  data.display_name,
// // // //       name:     data.name || data.display_name?.split(',')[0],
// // // //       place_id: `nominatim_${data.place_id}`,
// // // //     };
// // // //   } catch { return null; }
// // // // }

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // PUBLIC OSRM
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // async function osrmRoute(origin, destination) {
// // // //   try {
// // // //     const url =
// // // //       `https://router.project-osrm.org/route/v1/driving/` +
// // // //       `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
// // // //       `?overview=full&geometries=geojson`;
// // // //     const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
// // // //     if (!res.ok) throw new Error(`OSRM ${res.status}`);
// // // //     const data  = await res.json();
// // // //     const route = data.routes?.[0];
// // // //     if (!route) throw new Error('No OSRM route');
// // // //     const km  = route.distance / 1000;
// // // //     const min = route.duration / 60;
// // // //     return {
// // // //       type:          'osrm',
// // // //       distance:      km  >= 1 ? `${km.toFixed(1)} km`        : `${Math.round(km * 1000)} m`,
// // // //       duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
// // // //       distanceValue: route.distance,
// // // //       durationValue: route.duration,
// // // //       geometry:      route.geometry?.coordinates || [],
// // // //       steps:         [],
// // // //     };
// // // //   } catch (err) {
// // // //     console.warn('[MapsProvider] Public OSRM failed:', err.message);
// // // //     return null;
// // // //   }
// // // // }

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // IP GEOLOCATION
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // async function getIPLocation(localServerUrl) {
// // // //   if (localServerUrl) {
// // // //     try {
// // // //       const res = await fetch(`${localServerUrl}/ip-location`);
// // // //       if (res.ok) {
// // // //         const d = await res.json();
// // // //         if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'local' };
// // // //       }
// // // //     } catch { /* fall through */ }
// // // //   }
// // // //   try {
// // // //     const res = await fetch('https://ipapi.co/json/');
// // // //     if (res.ok) {
// // // //       const d = await res.json();
// // // //       if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'ipapi' };
// // // //     }
// // // //   } catch { /* fall through */ }
// // // //   return { lat: -15.4167, lng: 28.2833, source: 'default' };
// // // // }

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // MAPSPROVIDER
// // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // export function MapsProvider({ children }) {
// // // //   const [priorityList,        setPriorityList]        = useState([]);
// // // //   const [providers,           setProviders]           = useState({});
// // // //   const [allExhausted,        setAllExhausted]        = useState(false);
// // // //   const [ready,               setReady]               = useState(false);

// // // //   const [prioritizedMap,      setPrioritizedMap]      = useState(PROVIDER.OPENSTREET);
// // // //   const [prioritizedRoute,    setPrioritizedRoute]    = useState(null);
// // // //   const [prioritizedDistance, setPrioritizedDistance] = useState(null);
// // // //   const [prioritizedEta,      setPrioritizedEta]      = useState(null);

// // // //   const [serviceApis, setServiceApis] = useState(DEFAULT_SERVICE_APIS);

// // // //   const apiUrl      = process.env.NEXT_PUBLIC_API_URL                       || '';
// // // //   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';
// // // //   const providersRef = useRef(providers);
// // // //   useEffect(() => { providersRef.current = providers; }, [providers]);

// // // //   const getToken = useCallback(() => {
// // // //     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
// // // //     catch { return null; }
// // // //   }, [])

// // // //   function authHeaders() {
// // // //     const token = getToken();
// // // //     return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
// // // //   }

// // // //   const initFailures = useRef({});
// // // //   const logFailures  = useRef({});

// // // //   async function initProviderData(record) {
// // // //     if (record.id == null) return { ...record, providerData: buildFreshProviderData() };
// // // //     const pd = record.providerData;
// // // //     if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) return record;

// // // //     const failKey = record.providerName;
// // // //     if ((initFailures.current[failKey] || 0) >= 5) {
// // // //       return { ...record, providerData: buildFreshProviderData() };
// // // //     }

// // // //     const freshData = buildFreshProviderData();
// // // //     try {
// // // //       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
// // // //         method: 'PUT', headers: authHeaders(),
// // // //         body: JSON.stringify({ data: { providerData: freshData } }),
// // // //       })
// // // //       if (!res.ok) {
// // // //         if(res.status === 404 ) return { ...record, providerData: buildFreshProviderData() } // this means there is nothing we can do, it's not found
// // // //         initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
// // // //       }
// // // //       else { 
// // // //         initFailures.current[failKey] = 0
// // // //       }
// // // //     } catch {
// // // //       initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
// // // //     }
// // // //     return { ...record, providerData: freshData };
// // // //   }

// // // //   // ── Load ──────────────────────────────────────────────────────────────────

// // // //   useEffect(() => {
// // // //     async function load() {
// // // //       if (!apiUrl) { setReady(true); return; }

// // // //       try {
// // // //         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
// // // //         const pmJson = await pmRes.json();
// // // //         const pmRaw  = pmJson?.data ?? {};
// // // //         const attrs  = pmRaw.attributes ?? pmRaw;

// // // //         const pMap      = attrs.prioritizedMap              ?? PROVIDER.OPENSTREET;
// // // //         const pRoute    = attrs.priotizedRouteDrawer        ?? null;
// // // //         const pDistance = attrs.priotizedDistanceCalculator ?? null;
// // // //         const pEta      = attrs.priotizedEtaCalculator      ?? null;

// // // //         console.log('[MapsProvider] assignments — map:', pMap, '| route:', pRoute, '| distance:', pDistance, '| eta:', pEta);

// // // //         setPrioritizedMap(pMap);
// // // //         setPrioritizedRoute(pRoute);
// // // //         setPrioritizedDistance(pDistance);
// // // //         setPrioritizedEta(pEta);

// // // //         // ── Parse mapsProviders ─────────────────────────────────────────────
// // // //         // New Strapi shape: [{ name: "google", config: { routing: "routeApi" } }, ...]
// // // //         // Legacy shape:     ["google:", { routing: "routeApi" }, ...]  (still handled)
// // // //         const rawList = attrs.mapsProviders ?? [];
// // // //         const { providerNames: list, perProviderApis } = parseMapsProviders(rawList);

// // // //         console.log('[MapsProvider] provider list:', list);
// // // //         console.log('[MapsProvider] per-provider api config:', perProviderApis);

// // // //         // Merge Strapi configs over defaults — empty config leaves defaults intact
// // // //         setServiceApis(() => {
// // // //           const merged = { ...DEFAULT_SERVICE_APIS };
// // // //           for (const [provName, apis] of Object.entries(perProviderApis)) {
// // // //             merged[provName] = {
// // // //               ...(DEFAULT_SERVICE_APIS[provName] || {}),
// // // //               ...apis,
// // // //             };
// // // //           }
// // // //           return merged;
// // // //         });

// // // //         setPriorityList(list);
// // // //         if (!list.length) { setReady(true); return; }

// // // //         // ── Fetch provider records ──────────────────────────────────────────
// // // //         const queryableNames = list.filter((n) => !INLINE_PROVIDERS.has(n));
// // // //         const providerMap    = {};

// // // //         if (queryableNames.length > 0) {
// // // //           const filterParams = queryableNames
// // // //             .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
// // // //             .join('&');

// // // //           const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
// // // //           const provJson = await provRes.json();

// // // //           for (const item of (provJson?.data ?? [])) {
// // // //             const flat = item.attributes ?? item;
// // // //             const name = flat.providerName;
// // // //             if (!name) continue;

// // // //             const record = {
// // // //               id:                 item.id,
// // // //               providerName:       name,
// // // //               providerData:       flat.providerData       ?? {},
// // // //               maxMonthlyRequests: flat.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests,
// // // //             };

// // // //             if (!DEEP_LINK_PROVIDERS.has(name)) {
// // // //               initProviderData(record).then((updated) => {
// // // //                 setProviders((prev) => {
// // // //                   if (!prev[name]) return prev;
// // // //                   return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
// // // //                 });
// // // //               }).catch(() => {});
// // // //             }

// // // //             providerMap[name] = { record, instance: createProviderInstance(name), budget: computeBudget(record) };
// // // //           }
// // // //         }

// // // //         // Synthesise entries for providers without Strapi records
// // // //         for (const name of list) {
// // // //           if (providerMap[name]) continue;
// // // //           const defaultRecord = {
// // // //             id: null, providerName: name,
// // // //             providerData: buildFreshProviderData(),
// // // //             maxMonthlyRequests: QUOTA_DEFAULTS.maxMonthlyRequests,
// // // //           };
// // // //           providerMap[name] = {
// // // //             record: defaultRecord,
// // // //             instance: createProviderInstance(name),
// // // //             budget: computeBudget(defaultRecord),
// // // //           };
// // // //           console.log(`[MapsProvider] "${name}": synthesised | instance: ${providerMap[name].instance ? 'created' : 'inline/null'}`);
// // // //         }

// // // //         setProviders(providerMap);
// // // //         setAllExhausted(!list.some((n) => providerMap[n]?.instance != null || INLINE_PROVIDERS.has(n)));

// // // //       } catch (err) {
// // // //         console.error('[MapsProvider] load error:', err);
// // // //         setAllExhausted(true);
// // // //       } finally {
// // // //         setReady(true);
// // // //       }
// // // //     }

// // // //     load();
// // // //   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // // //   // ── logRequest ────────────────────────────────────────────────────────────

// // // //   const logRequest = useCallback((providerName, apiType) => {
// // // //     const p = providersRef.current[providerName]
// // // //     if (!p || p.record.id == null) return;

// // // //     const failKey   = `${providerName}:${p.record.id}`;
// // // //     const failCount = logFailures.current[failKey] || 0;
// // // //     if (failCount >= 3) return;

// // // //     const monthKey = getMonthKey()
// // // //     const dayKey   = getDayKey()
// // // //     const bucket   = dailyBucketKey(apiType)

// // // //     const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
// // // //     const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
// // // //     const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

// // // //     monthData[apiType] = (Number(monthData[apiType]) || 0) + 1;
// // // //     dayData[bucket]    = (Number(dayData[bucket])    || 0) + 1;

// // // //     const updatedProviderData = {
// // // //       ...existing,
// // // //       requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
// // // //       dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
// // // //     };

// // // //     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
// // // //       method: 'PUT', headers: authHeaders(),
// // // //       body: JSON.stringify({ data: { providerData: updatedProviderData } }),
// // // //     })
// // // //       .then((res) => {
// // // //         if (!res.ok) {
// // // //           logFailures.current[failKey] = failCount + 1
// // // //           if(res.status === 404 && failCount === 2) return
// // // //           if (failCount === 0) console.warn(
// // // //             `[MapsProvider] logRequest PUT ${res.status} for "${providerName}".`,
// // // //             res.status === 404 ? 'Grant update on api-providers in Strapi → Settings → Roles.' : `HTTP ${res.status}`,
// // // //           )
// // // //         } else {
// // // //           logFailures.current[failKey] = 0;
// // // //         }
// // // //       })
// // // //       .catch(() => { logFailures.current[failKey] = failCount + 1; });

// // // //     setProviders((prev) => {
// // // //       const cur = prev[providerName];
// // // //       if (!cur) return prev;
// // // //       const updatedRecord = { ...cur.record, providerData: updatedProviderData };
// // // //       return { ...prev, [providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) } };
// // // //     })

// // // //   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // // //   // ─────────────────────────────────────────────────────────────────────────
// // // //   // PROVIDER RESOLUTION
// // // //   //
// // // //   // Returns { name, instance, record, apiMethod } | null
// // // //   //
// // // //   // apiMethod = serviceApis[name][serviceType]
// // // //   // e.g. serviceApis['google']['routing'] = 'routeApi'
// // // //   // ─────────────────────────────────────────────────────────────────────────

// // // //   const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
// // // //     const apiType = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';

// // // //     const isUsable = (name) => {
// // // //       if (failedSet.has(name)) return false;
// // // //       if (INLINE_PROVIDERS.has(name)) return true;
// // // //       if (DEEP_LINK_PROVIDERS.has(name)) return !!providers[name]?.instance;
// // // //       const p = providers[name];
// // // //       if (!p?.instance) return false;
// // // //       return hasQuota(p.record, apiType);
// // // //     };

// // // //     const toEntry = (name) => ({
// // // //       name,
// // // //       instance:  providers[name]?.instance ?? null,
// // // //       record:    providers[name]?.record   ?? null,
// // // //       apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
// // // //     });

// // // //     // 1. Explicit provider — bypass priority list entirely
// // // //     if (explicitName && isUsable(explicitName)) {
// // // //       console.log(`[MapsProvider.resolve] ✅ explicit: "${explicitName}" | ${serviceType} → ${toEntry(explicitName).apiMethod}`);
// // // //       return toEntry(explicitName);
// // // //     }

// // // //     // 2. Priority list walk
// // // //     for (const name of priorityList) {
// // // //       if (name === explicitName) continue;

// // // //       // local failed → substitute openstreet immediately
// // // //       if (name === PROVIDER.LOCAL && failedSet.has(PROVIDER.LOCAL)) {
// // // //         if (isUsable(PROVIDER.OPENSTREET)) {
// // // //           console.log('[MapsProvider.resolve] local failed → openstreet substituted');
// // // //           return toEntry(PROVIDER.OPENSTREET);
// // // //         }
// // // //         continue;
// // // //       }

// // // //       if (isUsable(name)) {
// // // //         console.log(`[MapsProvider.resolve] ✅ fallback: "${name}" | ${serviceType} → ${toEntry(name).apiMethod}`);
// // // //         return toEntry(name);
// // // //       }
// // // //     }

// // // //     console.log(`[MapsProvider.resolve] ❌ no provider for ${serviceType}`);
// // // //     return null;
// // // //   }, [priorityList, providers, serviceApis]);

// // // //   // ── Local OSRM helper ─────────────────────────────────────────────────────

// // // //   const fetchLocalRoute = useCallback(async (origin, destination) => {
// // // //     if (!localMapUrl) throw new Error('localMapUrl not configured');
// // // //     const res = await fetch(
// // // //       `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
// // // //     );
// // // //     if (!res.ok) throw new Error(`Local route API ${res.status}`);
// // // //     const data = await res.json();
// // // //     return {
// // // //       type: 'local',
// // // //       distance:      data.distance,
// // // //       duration:      data.duration,
// // // //       distanceValue: data.distanceValue,
// // // //       durationValue: data.durationValue,
// // // //       geometry:      data.geometry ?? [],
// // // //       steps:         data.steps   ?? [],
// // // //     };
// // // //   }, [localMapUrl]);

// // // //   // ─────────────────────────────────────────────────────────────────────────
// // // //   // GENERIC SERVICE RUNNER
// // // //   //
// // // //   // handler(p) where p = { name, instance, record, apiMethod }
// // // //   // The apiMethod is forwarded to the provider instance so it can dispatch
// // // //   // to the right internal implementation.
// // // //   // ─────────────────────────────────────────────────────────────────────────

// // // //   const runWithFallback = useCallback(async ({
// // // //     serviceType,
// // // //     explicitProvider,
// // // //     handler,
// // // //     finalFallback = async () => null,
// // // //   }) => {
// // // //     const failed      = new Set();
// // // //     const maxAttempts = priorityList.length + 2;

// // // //     for (let i = 0; i < maxAttempts; i++) {
// // // //       const p = resolveServiceProvider(
// // // //         failed.has(explicitProvider) ? null : explicitProvider,
// // // //         serviceType,
// // // //         failed,
// // // //       );
// // // //       if (!p) break;

// // // //       try {
// // // //         const result = await handler(p);
// // // //         if (result != null) return result;
// // // //         console.log(`[MapsProvider.${serviceType}] "${p.name}" (${p.apiMethod}) → no result`);
// // // //         failed.add(p.name);
// // // //       } catch (err) {
// // // //         console.warn(`[MapsProvider.${serviceType}] "${p.name}" (${p.apiMethod}) threw:`, err.message);
// // // //         failed.add(p.name);
// // // //       }
// // // //     }

// // // //     console.warn(`[MapsProvider.${serviceType}] all providers failed — final fallback`);
// // // //     return finalFallback();
// // // //   }, [priorityList, resolveServiceProvider]);

// // // //   // ─────────────────────────────────────────────────────────────────────────
// // // //   // PUBLIC API
// // // //   // ─────────────────────────────────────────────────────────────────────────

// // // //   const searchPlaces = useCallback(async (query, countryCode = null) => {
// // // //     if (!query || query.length < 2) return [];
// // // //     return runWithFallback({
// // // //       serviceType: 'autoComplete', explicitProvider: null,
// // // //       handler: async (p) => {
// // // //         if (DEEP_LINK_PROVIDERS.has(p.name) && !p.apiMethod) return null;
// // // //         if (INLINE_PROVIDERS.has(p.name)) {
// // // //           const r = await nominatimSearch(query, countryCode);
// // // //           return r.length ? r : null;
// // // //         }
// // // //         if (!p.instance?.searchPlaces) return null;

// // // //         // ── Inject viewport bias from the active map display ───────────────
// // // //         // GoogleMapDisplay (and other displays) write their current viewport
// // // //         // centre + radius to window.__googleMapsViewport on every map idle.
// // // //         // We forward that to the provider instance so autocomplete results
// // // //         // are biased toward what the user is currently looking at, which is
// // // //         // exactly how Google Maps itself behaves.
// // // //         if (typeof window !== 'undefined' && window.__googleMapsViewport) {
// // // //           const vp = window.__googleMapsViewport;
// // // //           if (p.instance.setViewport) {
// // // //             p.instance.setViewport(vp.lat, vp.lng, vp.radiusM, vp.regionCode || countryCode);
// // // //           } else if (p.instance.setCenter) {
// // // //             p.instance.setCenter(vp.lat, vp.lng);
// // // //           }
// // // //         }

// // // //         const results = await p.instance.searchPlaces(query, countryCode, p.apiMethod);
// // // //         if (results?.length) { logRequest(p.name, 'JavaScriptAPI'); return results; }
// // // //         return null;
// // // //       },
// // // //       finalFallback: () => nominatimSearch(query, countryCode),
// // // //     });
// // // //   }, [runWithFallback, logRequest]);

// // // //   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
// // // //     if (fallbackData?.lat != null && fallbackData?.lng != null) return fallbackData;
// // // //     return runWithFallback({
// // // //       serviceType: 'location', explicitProvider: null,
// // // //       handler: async (p) => {
// // // //         if (INLINE_PROVIDERS.has(p.name)) return fallbackData;
// // // //         if (!p.instance?.getPlaceDetails) return null;
// // // //         const result = await p.instance.getPlaceDetails(placeId, fallbackData, p.apiMethod);
// // // //         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// // // //         return null;
// // // //       },
// // // //       finalFallback: async () => fallbackData,
// // // //     });
// // // //   }, [runWithFallback, logRequest]);

// // // //   const reverseGeocode = useCallback(async (lat, lng) => {
// // // //     return runWithFallback({
// // // //       serviceType: 'location', explicitProvider: null,
// // // //       handler: async (p) => {
// // // //         if (INLINE_PROVIDERS.has(p.name)) return nominatimReverse(lat, lng);
// // // //         if (!p.instance?.reverseGeocode) return null;
// // // //         const result = await p.instance.reverseGeocode(lat, lng, p.apiMethod);
// // // //         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// // // //         return null;
// // // //       },
// // // //       finalFallback: () => nominatimReverse(lat, lng),
// // // //     });
// // // //   }, [runWithFallback, logRequest]);

// // // //   const getRoute = useCallback(async (origin, destination) => {
// // // //     return runWithFallback({
// // // //       serviceType: 'routing', explicitProvider: prioritizedRoute,
// // // //       handler: async (p) => {
// // // //         if (DEEP_LINK_PROVIDERS.has(p.name) && p.instance?.openNavigation) {
// // // //           p.instance.openNavigation(destination, origin);
// // // //           return { type: 'deeplink', provider: p.name };
// // // //         }
// // // //         if (p.name === PROVIDER.LOCAL)      return fetchLocalRoute(origin, destination);
// // // //         if (p.name === PROVIDER.OPENSTREET) return osrmRoute(origin, destination);
// // // //         if (!p.instance?.getRoute) return null;
// // // //         const result = await p.instance.getRoute(origin, destination, p.apiMethod);
// // // //         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// // // //         return null;
// // // //       },
// // // //       finalFallback: () => osrmRoute(origin, destination),
// // // //     });
// // // //   }, [prioritizedRoute, runWithFallback, fetchLocalRoute, logRequest]);

// // // //   const calculateDistance = useCallback(async (origin, destination) => {
// // // //     return runWithFallback({
// // // //       serviceType: 'distance', explicitProvider: prioritizedDistance,
// // // //       handler: async (p) => {
// // // //         if (p.name === PROVIDER.LOCAL) {
// // // //           const r = await fetchLocalRoute(origin, destination);
// // // //           return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
// // // //         }
// // // //         if (p.name === PROVIDER.OPENSTREET) {
// // // //           const r = await osrmRoute(origin, destination);
// // // //           return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
// // // //         }
// // // //         if (!p.instance?.calculateDistance) return null;
// // // //         const result = await p.instance.calculateDistance(origin, destination, p.apiMethod);
// // // //         if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// // // //         return null;
// // // //       },
// // // //       finalFallback: async () => {
// // // //         const R = 6371;
// // // //         const dLat = (destination.lat - origin.lat) * Math.PI / 180;
// // // //         const dLon = (destination.lng - origin.lng) * Math.PI / 180;
// // // //         const a =
// // // //           Math.sin(dLat / 2) ** 2 +
// // // //           Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
// // // //           Math.sin(dLon / 2) ** 2;
// // // //         const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // // //         return { distanceValue: Math.round(km * 1000), distance: km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m` };
// // // //       },
// // // //     });
// // // //   }, [prioritizedDistance, runWithFallback, fetchLocalRoute, logRequest]);

// // // //   const calculateEta = useCallback(async (origin, destination) => {
// // // //     return runWithFallback({
// // // //       serviceType: 'eta', explicitProvider: prioritizedEta,
// // // //       handler: async (p) => {
// // // //         if (p.name === PROVIDER.LOCAL) {
// // // //           const r = await fetchLocalRoute(origin, destination);
// // // //           return r ? { durationValue: r.durationValue, duration: r.duration } : null;
// // // //         }
// // // //         if (p.name === PROVIDER.OPENSTREET) {
// // // //           const r = await osrmRoute(origin, destination);
// // // //           return r ? { durationValue: r.durationValue, duration: r.duration } : null;
// // // //         }
// // // //         if (!p.instance?.calculateEta) return null;
// // // //         const result = await p.instance.calculateEta(origin, destination, p.apiMethod);
// // // //         if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// // // //         return null;
// // // //       },
// // // //       finalFallback: async () => null,
// // // //     });
// // // //   }, [prioritizedEta, runWithFallback, fetchLocalRoute, logRequest]);

// // // //   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

// // // //   const getProviderStatus = useCallback(() =>
// // // //     priorityList.map((name) => {
// // // //       const p = providers[name];
// // // //       if (!p) return { name, loaded: false };
// // // //       return {
// // // //         name,
// // // //         loaded:      true,
// // // //         hasInstance: !!p.instance || INLINE_PROVIDERS.has(name),
// // // //         budget:      p.budget,
// // // //         serviceApis: serviceApis[name] ?? null,
// // // //         canUseGeo:   hasQuota(p.record, 'GeocoderHTTPAPI'),
// // // //         canUseJS:    hasQuota(p.record, 'JavaScriptAPI'),
// // // //       };
// // // //     }),
// // // //   [priorityList, providers, serviceApis]);

// // // //   useEffect(() => {
// // // //     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
// // // //   }, [getProviderStatus])

// // // //   const value = useMemo(() => ({
// // // //     ready, allExhausted,
// // // //     prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
// // // //     serviceApis,
// // // //     searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
// // // //     getRoute, calculateDistance, calculateEta,
// // // //     getProviderStatus, localMapUrl,
// // // //   }), [
// // // //     ready, allExhausted,
// // // //     prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
// // // //     serviceApis,
// // // //     searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
// // // //     getRoute, calculateDistance, calculateEta,
// // // //     getProviderStatus, localMapUrl,
// // // //   ]); // eslint-disable-line react-hooks/exhaustive-deps

// // // //   return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
// // // // }

// // // // export function useMapProvider() {
// // // //   const ctx = useContext(MapsContext);
// // // //   if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
// // // //   return ctx;
// // // // }

// // // // export default MapsProvider;
// // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx
// // // 'use client';

// // // import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
// // // import { GoogleMapsProvider } from './GoogleMapsProvider';
// // // import { YandexMapsProvider } from './YandexMapsProvider';
// // // import { WazeMapsProvider }   from './WazeMapsProvider';
// // // import { AppleMapsProvider }  from './AppleMapsProvider';
// // // import { GeoapifyProvider }   from './GeoapifyProvider';

// // // const MapsContext = createContext(null);

// // // // PROVIDER NAME CONSTANTS
// // // const PROVIDER = {
// // //   GOOGLE:     'google',
// // //   APPLE:      'apple',
// // //   YANDEX:     'yandex',
// // //   WAZE:       'waze',
// // //   GEOAPIFY:   'geoapify',
// // //   OPENSTREET: 'openstreet',
// // //   LOCAL:      'local',
// // // };

// // // const DEEP_LINK_PROVIDERS = new Set([PROVIDER.WAZE, PROVIDER.APPLE]);
// // // const INLINE_PROVIDERS    = new Set([PROVIDER.OPENSTREET, PROVIDER.LOCAL]);

// // // // DEFAULT SERVICE → API METHOD MAP
// // // const DEFAULT_SERVICE_APIS = { /* unchanged - same as before */ };

// // // function parseMapsProviders(rawList) { /* unchanged */ }

// // // function getMonthKey() { /* unchanged */ }
// // // function getDayKey() { /* unchanged */ }

// // // const QUOTA_DEFAULTS = { /* unchanged */ };

// // // function dailyBucketKey(apiType) { /* unchanged */ }
// // // function buildFreshProviderData() { /* unchanged */ }
// // // function computeBudget(record) { /* unchanged */ }

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // // DEBUG: Enhanced hasQuota with full budget visibility
// // // // ─────────────────────────────────────────────────────────────────────────────
// // // function hasQuota(record, apiType) {
// // //   const name = record?.providerName;
// // //   if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;

// // //   const b = computeBudget(record);

// // //   console.log(`[MapsProvider:DEBUG] hasQuota("${name}", ${apiType}) → monthly:${b.monthlyRemaining} | dailyGeo:${b.dailyGeoRemaining} | dailyJS:${b.dailyJSRemaining}`);

// // //   return (
// // //     b.monthlyRemaining > 0 &&
// // //     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
// // //     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0)
// // //   );
// // // }

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // // DEBUG: Enhanced isUsable + resolveServiceProvider
// // // // ─────────────────────────────────────────────────────────────────────────────
// // // function createProviderInstance(name) { /* unchanged */ }

// // // async function nominatimSearch(query, countryCode = null) { /* unchanged */ }
// // // async function nominatimReverse(lat, lng) { /* unchanged */ }
// // // async function osrmRoute(origin, destination) { /* unchanged */ }
// // // async function getIPLocation(localServerUrl) { /* unchanged */ }

// // // export function MapsProvider({ children }) {
// // //   // ... all your existing state and refs (unchanged)

// // //   const initFailures = useRef({});
// // //   const logFailures  = useRef({});

// // //   async function initProviderData(record) { /* unchanged */ }

// // //   // ── Load ──────────────────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     async function load() {
// // //       if (!apiUrl) { setReady(true); return; }

// // //       try {
// // //         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
// // //         const pmJson = await pmRes.json();
// // //         const pmRaw  = pmJson?.data ?? {};
// // //         const attrs  = pmRaw.attributes ?? pmRaw;

// // //         // DEBUG: Show exactly what Strapi sent for prioritized settings
// // //         console.log('[MapsProvider:DEBUG] Strapi prioritized settings →', {
// // //           prioritizedMap:              attrs.prioritizedMap,
// // //           prioritizedRouteDrawer:      attrs.priotizedRouteDrawer,
// // //           prioritizedDistanceCalculator: attrs.priotizedDistanceCalculator,
// // //           prioritizedEtaCalculator:    attrs.priotizedEtaCalculator,
// // //         });

// // //         const pMap      = attrs.prioritizedMap              ?? PROVIDER.OPENSTREET;
// // //         const pRoute    = attrs.priotizedRouteDrawer        ?? null;
// // //         const pDistance = attrs.priotizedDistanceCalculator ?? null;
// // //         const pEta      = attrs.priotizedEtaCalculator      ?? null;

// // //         console.log(`[MapsProvider:DEBUG] FINAL assigned → map: ${pMap} | route: ${pRoute} | distance: ${pDistance} | eta: ${pEta}`);

// // //         setPrioritizedMap(pMap);
// // //         setPrioritizedRoute(pRoute);
// // //         setPrioritizedDistance(pDistance);
// // //         setPrioritizedEta(pEta);

// // //         // ... rest of your load() function (parsing providers, etc.) remains unchanged ...

// // //         setProviders(providerMap);
// // //         setAllExhausted(!list.some((n) => providerMap[n]?.instance != null || INLINE_PROVIDERS.has(n)));

// // //       } catch (err) {
// // //         console.error('[MapsProvider] load error:', err);
// // //         setAllExhausted(true);
// // //       } finally {
// // //         setReady(true);
// // //       }
// // //     }

// // //     load();
// // //   }, [apiUrl]);

// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   // DEBUG: Enhanced resolveServiceProvider
// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
// // //     const apiType = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';

// // //     const isUsable = (name) => {
// // //       if (failedSet.has(name)) return false;
// // //       if (INLINE_PROVIDERS.has(name)) return true;
// // //       if (DEEP_LINK_PROVIDERS.has(name)) return !!providers[name]?.instance;

// // //       const p = providers[name];
// // //       if (!p?.instance) {
// // //         console.log(`[MapsProvider:DEBUG] isUsable("${name}") → NO INSTANCE`);
// // //         return false;
// // //       }

// // //       const quotaOk = hasQuota(p.record, apiType);
// // //       console.log(`[MapsProvider:DEBUG] isUsable("${name}") → quotaOk: ${quotaOk} | serviceType: ${serviceType}`);
// // //       return quotaOk;
// // //     };

// // //     const toEntry = (name) => ({
// // //       name,
// // //       instance:  providers[name]?.instance ?? null,
// // //       record:    providers[name]?.record   ?? null,
// // //       apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
// // //     });

// // //     // Explicit provider check
// // //     if (explicitName) {
// // //       const usable = isUsable(explicitName);
// // //       console.log(`[MapsProvider:DEBUG] explicit check "${explicitName}" for ${serviceType} → usable: ${usable}`);
// // //       if (usable) {
// // //         console.log(`[MapsProvider:DEBUG] ✅ USING EXPLICIT PROVIDER: ${explicitName} for ${serviceType}`);
// // //         return toEntry(explicitName);
// // //       }
// // //     }

// // //     // Priority list walk
// // //     console.log(`[MapsProvider:DEBUG] explicit failed or not set → walking priorityList for ${serviceType}`);
// // //     for (const name of priorityList) {
// // //       if (name === explicitName) continue;
// // //       if (isUsable(name)) {
// // //         console.log(`[MapsProvider:DEBUG] ✅ FALLBACK PROVIDER CHOSEN: ${name} for ${serviceType}`);
// // //         return toEntry(name);
// // //       }
// // //     }

// // //     console.log(`[MapsProvider:DEBUG] ❌ NO PROVIDER FOUND for ${serviceType}`);
// // //     return null;
// // //   }, [priorityList, providers, serviceApis]);

// // //   const logRequest = useCallback((providerName, apiType) => {
// // //     // ... existing code ...
// // //     console.log(`[MapsProvider:DEBUG] logRequest → ${providerName} used ${apiType} (quota will be decremented)`);
// // //     // ... rest unchanged ...
// // //   }, [providers, apiUrl]);

// // //   // ── PUBLIC API with debug logs ─────────────────────────────────────────────
// // //   const searchPlaces = useCallback(async (query, countryCode = null) => {
// // //     console.log(`[MapsProvider:DEBUG] searchPlaces called with query: "${query}"`);
// // //     return runWithFallback({ /* existing ... */ });
// // //   }, [runWithFallback, logRequest]);

// // //   const getRoute = useCallback(async (origin, destination) => {
// // //     console.log(`[MapsProvider:DEBUG] getRoute called → explicit prioritizedRoute = ${prioritizedRoute}`);
// // //     return runWithFallback({ /* existing ... */ });
// // //   }, [prioritizedRoute, runWithFallback, fetchLocalRoute, logRequest]);

// // //   const calculateDistance = useCallback(async (origin, destination) => {
// // //     console.log(`[MapsProvider:DEBUG] calculateDistance called → explicit prioritizedDistance = ${prioritizedDistance}`);
// // //     return runWithFallback({ /* existing ... */ });
// // //   }, [prioritizedDistance, runWithFallback, fetchLocalRoute, logRequest]);

// // //   const calculateEta = useCallback(async (origin, destination) => {
// // //     console.log(`[MapsProvider:DEBUG] calculateEta called → explicit prioritizedEta = ${prioritizedEta}`);
// // //     return runWithFallback({ /* existing ... */ });
// // //   }, [prioritizedEta, runWithFallback, fetchLocalRoute, logRequest]);

// // //   // ... rest of your file (runWithFallback, getPlaceDetails, reverseGeocode, etc.) remains exactly the same ...

// // //   const value = useMemo(() => ({ /* unchanged */ }), [ /* deps */ ]);

// // //   return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
// // // }

// // // export function useMapProvider() {
// // //   const ctx = useContext(MapsContext);
// // //   if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
// // //   return ctx;
// // // }

// // // export default MapsProvider;
// // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx
// // 'use client';

// // import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
// // import { GoogleMapsProvider } from './GoogleMapsProvider';
// // import { YandexMapsProvider } from './YandexMapsProvider';
// // import { WazeMapsProvider }   from './WazeMapsProvider';
// // import { AppleMapsProvider }  from './AppleMapsProvider';
// // import { GeoapifyProvider }   from './GeoapifyProvider';

// // const MapsContext = createContext(null);

// // // ─────────────────────────────────────────────────────────────────────────────
// // // PROVIDER NAME CONSTANTS
// // // ─────────────────────────────────────────────────────────────────────────────

// // const PROVIDER = {
// //   GOOGLE:     'google',
// //   APPLE:      'apple',
// //   YANDEX:     'yandex',
// //   WAZE:       'waze',
// //   GEOAPIFY:   'geoapify',
// //   OPENSTREET: 'openstreet',
// //   LOCAL:      'local',
// // };

// // const DEEP_LINK_PROVIDERS = new Set([PROVIDER.WAZE, PROVIDER.APPLE]);
// // const INLINE_PROVIDERS    = new Set([PROVIDER.OPENSTREET, PROVIDER.LOCAL]);

// // // ─────────────────────────────────────────────────────────────────────────────
// // // DEFAULT SERVICE → API METHOD MAP PER PROVIDER
// // // ─────────────────────────────────────────────────────────────────────────────

// // const DEFAULT_SERVICE_APIS = {
// //   [PROVIDER.GOOGLE]: {
// //     routing:      'routeApi',
// //     distance:     'routeApi',
// //     eta:          'routeApi',
// //     autoComplete: 'placesApi',
// //     location:     'geocoding',
// //   },
// //   [PROVIDER.APPLE]: {
// //     routing:      'deeplink',
// //     distance:     'mapkit',
// //     eta:          null,
// //     autoComplete: 'search',
// //     location:     'geocoder',
// //   },
// //   [PROVIDER.YANDEX]: {
// //     routing:      'routeApi',
// //     distance:     'routeApi',
// //     eta:          'routeApi',
// //     autoComplete: 'suggest',
// //     location:     'geocoder',
// //   },
// //   [PROVIDER.GEOAPIFY]: {
// //     routing:      'routingApi',
// //     distance:     'routingApi',
// //     eta:          'routingApi',
// //     autoComplete: 'placesApi',
// //     location:     'geocodingApi',
// //   },
// //   [PROVIDER.WAZE]: {
// //     routing:      'deeplink',
// //     distance:     null,
// //     eta:          null,
// //     autoComplete: null,
// //     location:     null,
// //   },
// //   [PROVIDER.OPENSTREET]: {
// //     routing:      'osrm',
// //     distance:     'osrm',
// //     eta:          'osrm',
// //     autoComplete: 'nominatim',
// //     location:     'nominatim',
// //   },
// //   [PROVIDER.LOCAL]: {
// //     routing:      'localOsrm',
// //     distance:     'localOsrm',
// //     eta:          'localOsrm',
// //     autoComplete: 'nominatim',
// //     location:     'nominatim',
// //   },
// // };

// // // ─────────────────────────────────────────────────────────────────────────────
// // // PARSE mapsProviders ARRAY FROM STRAPI
// // // ─────────────────────────────────────────────────────────────────────────────

// // function parseMapsProviders(rawList) {
// //   const providerNames   = [];
// //   const perProviderApis = {};
// //   const seen            = new Set();

// //   if (!Array.isArray(rawList)) return { providerNames, perProviderApis };

// //   const isNewFormat = rawList.length > 0 &&
// //     typeof rawList[0] === 'object' && rawList[0] !== null &&
// //     'name' in rawList[0];

// //   if (isNewFormat) {
// //     for (const entry of rawList) {
// //       if (!entry || typeof entry !== 'object') continue;
// //       const name   = (entry.name || '').trim();
// //       const config = (entry.config && typeof entry.config === 'object') ? entry.config : {};
// //       if (!name) continue;
// //       if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
// //       if (Object.keys(config).length > 0) {
// //         perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
// //       }
// //     }
// //     return { providerNames, perProviderApis };
// //   }

// //   // Legacy format: ["google:", { routing: "routeApi" }, ...]
// //   for (let i = 0; i < rawList.length; i++) {
// //     const item = rawList[i];
// //     if (typeof item !== 'string') continue;
// //     const name = item.replace(/:$/, '').trim();
// //     if (!name) continue;
// //     const next   = rawList[i + 1];
// //     const config = (next !== null && typeof next === 'object' && !Array.isArray(next)) ? next : {};
// //     if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
// //     if (Object.keys(config).length > 0) {
// //       perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
// //     }
// //   }

// //   return { providerNames, perProviderApis };
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // DATE HELPERS
// // // ─────────────────────────────────────────────────────────────────────────────

// // function getMonthKey() {
// //   const d = new Date();
// //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// // }

// // function getDayKey() {
// //   const d = new Date();
// //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // QUOTA
// // // ─────────────────────────────────────────────────────────────────────────────

// // const QUOTA_DEFAULTS = {
// //   maxMonthlyRequests:          20_000,
// //   maxDailyGeocoderApiRequests:  1_000,
// //   maxDailyJSApiRequests:       20_000,
// // };

// // function dailyBucketKey(apiType) {
// //   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// // }

// // function buildFreshProviderData() {
// //   return {
// //     maxDailyGeocoderApiRequests: QUOTA_DEFAULTS.maxDailyGeocoderApiRequests,
// //     maxDailyJSApiRequests:       QUOTA_DEFAULTS.maxDailyJSApiRequests,
// //     requestCounts: {},
// //     dailyCounts:   {},
// //   };
// // }

// // function computeBudget(record) {
// //   const pd       = record?.providerData || {};
// //   const monthKey = getMonthKey();
// //   const dayKey   = getDayKey();

// //   const monthData   = pd.requestCounts?.[monthKey] || {};
// //   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
// //   const monthlyMax  = record?.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests;

// //   const dayData     = pd.dailyCounts?.[dayKey] || {};
// //   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || QUOTA_DEFAULTS.maxDailyGeocoderApiRequests;
// //   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || QUOTA_DEFAULTS.maxDailyJSApiRequests;

// //   return {
// //     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
// //     dailyGeoRemaining: Math.max(0, maxDailyGeo - (Number(dayData.geo) || 0)),
// //     dailyJSRemaining:  Math.max(0, maxDailyJS  - (Number(dayData.js)  || 0)),
// //     monthlyMax, maxDailyGeo, maxDailyJS,
// //   };
// // }

// // function hasQuota(record, apiType) {
// //   const name = record?.providerName;
// //   if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;

// //   const b = computeBudget(record);

// //   console.log(
// //     `[MapsProvider:DEBUG] hasQuota("${name}", ${apiType})` +
// //     ` → monthly:${b.monthlyRemaining}/${b.monthlyMax}` +
// //     ` | dailyGeo:${b.dailyGeoRemaining}/${b.maxDailyGeo}` +
// //     ` | dailyJS:${b.dailyJSRemaining}/${b.maxDailyJS}`
// //   );

// //   return (
// //     b.monthlyRemaining > 0 &&
// //     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
// //     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0)
// //   );
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // PROVIDER INSTANCE FACTORY
// // // Keys come from environment variables — providerData in Strapi is quota-only.
// // // ─────────────────────────────────────────────────────────────────────────────

// // function createProviderInstance(name) {
// //   switch (name) {
// //     case PROVIDER.WAZE:       return new WazeMapsProvider();
// //     case PROVIDER.APPLE:      return new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN        || '');
// //     case PROVIDER.GOOGLE:     return new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY    || '');
// //     case PROVIDER.YANDEX:     return new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY   || '');
// //     case PROVIDER.GEOAPIFY:   return new GeoapifyProvider(process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY         || '');
// //     case PROVIDER.OPENSTREET:
// //     case PROVIDER.LOCAL:      return null;
// //     default:
// //       console.warn(`[MapsProvider] createProviderInstance: unknown provider "${name}"`);
// //       return null;
// //   }
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // NOMINATIM
// // // ─────────────────────────────────────────────────────────────────────────────

// // async function nominatimSearch(query, countryCode = null) {
// //   try {
// //     const params = new URLSearchParams({ q: query, format: 'json', limit: '7', addressdetails: '1' });
// //     if (countryCode) params.set('countrycodes', countryCode);
// //     const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
// //       headers: { 'Accept-Language': 'en' },
// //     });
// //     if (!res.ok) return [];
// //     const data = await res.json();
// //     return data.map((item) => ({
// //       place_id:       item.place_id?.toString(),
// //       main_text:      item.name || item.display_name?.split(',')[0],
// //       secondary_text: item.display_name,
// //       lat:            parseFloat(item.lat),
// //       lng:            parseFloat(item.lon),
// //       address:        item.display_name,
// //       name:           item.name || item.display_name?.split(',')[0],
// //     }));
// //   } catch { return []; }
// // }

// // async function nominatimReverse(lat, lng) {
// //   try {
// //     const res = await fetch(
// //       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
// //       { headers: { 'Accept-Language': 'en' } },
// //     );
// //     if (!res.ok) return null;
// //     const data = await res.json();
// //     return {
// //       lat, lng,
// //       address:  data.display_name,
// //       name:     data.name || data.display_name?.split(',')[0],
// //       place_id: `nominatim_${data.place_id}`,
// //     };
// //   } catch { return null; }
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // PUBLIC OSRM
// // // ─────────────────────────────────────────────────────────────────────────────

// // async function osrmRoute(origin, destination) {
// //   try {
// //     const url =
// //       `https://router.project-osrm.org/route/v1/driving/` +
// //       `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
// //       `?overview=full&geometries=geojson`;
// //     const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
// //     if (!res.ok) throw new Error(`OSRM ${res.status}`);
// //     const data  = await res.json();
// //     const route = data.routes?.[0];
// //     if (!route) throw new Error('No OSRM route');
// //     const km  = route.distance / 1000;
// //     const min = route.duration / 60;
// //     return {
// //       type:          'osrm',
// //       distance:      km  >= 1 ? `${km.toFixed(1)} km`        : `${Math.round(km * 1000)} m`,
// //       duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
// //       distanceValue: route.distance,
// //       durationValue: route.duration,
// //       geometry:      route.geometry?.coordinates || [],
// //       steps:         [],
// //     };
// //   } catch (err) {
// //     console.warn('[MapsProvider] Public OSRM failed:', err.message);
// //     return null;
// //   }
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // IP GEOLOCATION
// // // ─────────────────────────────────────────────────────────────────────────────

// // async function getIPLocation(localServerUrl) {
// //   if (localServerUrl) {
// //     try {
// //       const res = await fetch(`${localServerUrl}/ip-location`);
// //       if (res.ok) {
// //         const d = await res.json();
// //         if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'local' };
// //       }
// //     } catch { /* fall through */ }
// //   }
// //   try {
// //     const res = await fetch('https://ipapi.co/json/');
// //     if (res.ok) {
// //       const d = await res.json();
// //       if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'ipapi' };
// //     }
// //   } catch { /* fall through */ }
// //   return { lat: -15.4167, lng: 28.2833, source: 'default' };
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // MAPSPROVIDER
// // // ─────────────────────────────────────────────────────────────────────────────

// // export function MapsProvider({ children }) {
// //   const [priorityList,        setPriorityList]        = useState([]);
// //   const [providers,           setProviders]           = useState({});
// //   const [allExhausted,        setAllExhausted]        = useState(false);
// //   const [ready,               setReady]               = useState(false);

// //   const [prioritizedMap,      setPrioritizedMap]      = useState(PROVIDER.OPENSTREET);
// //   const [prioritizedRoute,    setPrioritizedRoute]    = useState(null);
// //   const [prioritizedDistance, setPrioritizedDistance] = useState(null);
// //   const [prioritizedEta,      setPrioritizedEta]      = useState(null);

// //   const [serviceApis, setServiceApis] = useState(DEFAULT_SERVICE_APIS);

// //   const apiUrl      = process.env.NEXT_PUBLIC_API_URL                       || '';
// //   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

// //   const providersRef = useRef(providers);
// //   useEffect(() => { providersRef.current = providers; }, [providers]);

// //   const getToken = useCallback(() => {
// //     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
// //     catch { return null; }
// //   }, []);

// //   function authHeaders() {
// //     const token = getToken();
// //     return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
// //   }

// //   const initFailures = useRef({});
// //   const logFailures  = useRef({});

// //   async function initProviderData(record) {
// //     if (record.id == null) return { ...record, providerData: buildFreshProviderData() };

// //     const pd = record.providerData;
// //     // providerData already has content — preserve it entirely (keys + counts)
// //     if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) return record;

// //     const failKey = record.providerName;
// //     if ((initFailures.current[failKey] || 0) >= 5) {
// //       return { ...record, providerData: buildFreshProviderData() };
// //     }

// //     const freshData = buildFreshProviderData();
// //     try {
// //       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
// //         method: 'PUT', headers: authHeaders(),
// //         body: JSON.stringify({ data: { providerData: freshData } }),
// //       });
// //       if (!res.ok) {
// //         if (res.status === 404) return { ...record, providerData: buildFreshProviderData() };
// //         initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
// //       } else {
// //         initFailures.current[failKey] = 0;
// //       }
// //     } catch {
// //       initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
// //     }
// //     return { ...record, providerData: freshData };
// //   }

// //   // ── Load ──────────────────────────────────────────────────────────────────

// //   useEffect(() => {
// //     async function load() {
// //       if (!apiUrl) { setReady(true); return; }

// //       try {
// //         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
// //         const pmJson = await pmRes.json();
// //         const pmRaw  = pmJson?.data ?? {};
// //         const attrs  = pmRaw.attributes ?? pmRaw;

// //         // DEBUG: Show exactly what Strapi returned
// //         console.log('[MapsProvider:DEBUG] Strapi priority-map attrs →', {
// //           prioritizedMap:               attrs.prioritizedMap,
// //           priotizedRouteDrawer:         attrs.priotizedRouteDrawer,
// //           priotizedDistanceCalculator:  attrs.priotizedDistanceCalculator,
// //           priotizedEtaCalculator:       attrs.priotizedEtaCalculator,
// //           mapsProviders:                attrs.mapsProviders,
// //         });

// //         const pMap      = attrs.prioritizedMap              ?? PROVIDER.OPENSTREET;
// //         const pRoute    = attrs.priotizedRouteDrawer        ?? null;
// //         const pDistance = attrs.priotizedDistanceCalculator ?? null;
// //         const pEta      = attrs.priotizedEtaCalculator      ?? null;

// //         console.log(`[MapsProvider:DEBUG] FINAL assigned → map:${pMap} | route:${pRoute} | distance:${pDistance} | eta:${pEta}`);

// //         setPrioritizedMap(pMap);
// //         setPrioritizedRoute(pRoute);
// //         setPrioritizedDistance(pDistance);
// //         setPrioritizedEta(pEta);

// //         // ── Parse mapsProviders ─────────────────────────────────────────────
// //         const rawList = attrs.mapsProviders ?? [];
// //         const { providerNames: list, perProviderApis } = parseMapsProviders(rawList);

// //         console.log('[MapsProvider:DEBUG] provider priority list:', list);
// //         console.log('[MapsProvider:DEBUG] per-provider api overrides:', perProviderApis);

// //         // Merge Strapi per-provider configs over hardcoded defaults
// //         setServiceApis(() => {
// //           const merged = { ...DEFAULT_SERVICE_APIS };
// //           for (const [provName, apis] of Object.entries(perProviderApis)) {
// //             merged[provName] = { ...(DEFAULT_SERVICE_APIS[provName] || {}), ...apis };
// //           }
// //           return merged;
// //         });

// //         setPriorityList(list);
// //         if (!list.length) { setReady(true); return; }

// //         // ── Fetch provider records from Strapi ──────────────────────────────
// //         const queryableNames = list.filter((n) => !INLINE_PROVIDERS.has(n));
// //         const providerMap    = {};

// //         if (queryableNames.length > 0) {
// //           const filterParams = queryableNames
// //             .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
// //             .join('&');

// //           const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
// //           const provJson = await provRes.json();

// //           for (const item of (provJson?.data ?? [])) {
// //             const flat = item.attributes ?? item;
// //             const name = flat.providerName;
// //             if (!name) continue;

// //             const record = {
// //               id:                 item.id,
// //               providerName:       name,
// //               // providerData in Strapi is quota tracking only — API keys come from process.env
// //               providerData:       flat.providerData       ?? {},
// //               maxMonthlyRequests: flat.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests,
// //             };

// //             // Initialise providerData if it is empty (first-time setup)
// //             if (!DEEP_LINK_PROVIDERS.has(name)) {
// //               initProviderData(record).then((updated) => {
// //                 setProviders((prev) => {
// //                   if (!prev[name]) return prev;
// //                   return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
// //                 });
// //               }).catch(() => {});
// //             }

// //             const instance = createProviderInstance(name);
// //             console.log(`[MapsProvider:DEBUG] "${name}" → record id:${item.id} | instance:${instance ? 'created' : 'null'}`);

// //             providerMap[name] = { record, instance, budget: computeBudget(record) };
// //           }
// //         }

// //         // Synthesise entries for providers not yet in Strapi
// //         for (const name of list) {
// //           if (providerMap[name]) continue;
// //           const defaultRecord = {
// //             id: null, providerName: name,
// //             providerData: buildFreshProviderData(),
// //             maxMonthlyRequests: QUOTA_DEFAULTS.maxMonthlyRequests,
// //           };
// //           const instance = createProviderInstance(name);
// //           providerMap[name] = { record: defaultRecord, instance, budget: computeBudget(defaultRecord) };
// //           console.log(`[MapsProvider:DEBUG] "${name}": synthesised (no Strapi record) | instance:${instance ? 'created' : 'inline/null'}`);
// //         }

// //         setProviders(providerMap);
// //         setAllExhausted(!list.some((n) => providerMap[n]?.instance != null || INLINE_PROVIDERS.has(n)));

// //       } catch (err) {
// //         console.error('[MapsProvider] load error:', err);
// //         setAllExhausted(true);
// //       } finally {
// //         setReady(true);
// //       }
// //     }

// //     load();
// //   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// //   // ── logRequest ────────────────────────────────────────────────────────────
// //   // IMPORTANT: always spreads existing providerData before updating counts
// //   // so that any other fields (e.g. future metadata) are never clobbered.

// //   const logRequest = useCallback((providerName, apiType) => {
// //     const p = providersRef.current[providerName];
// //     if (!p || p.record.id == null) return;

// //     const failKey   = `${providerName}:${p.record.id}`;
// //     const failCount = logFailures.current[failKey] || 0;
// //     if (failCount >= 3) return;

// //     const monthKey = getMonthKey();
// //     const dayKey   = getDayKey();
// //     const bucket   = dailyBucketKey(apiType);

// //     // Spread existing providerData first — preserves every field already there
// //     const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
// //     const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
// //     const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

// //     monthData[apiType] = (Number(monthData[apiType]) || 0) + 1;
// //     dayData[bucket]    = (Number(dayData[bucket])    || 0) + 1;

// //     const updatedProviderData = {
// //       ...existing,
// //       requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
// //       dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
// //     };

// //     console.log(`[MapsProvider:DEBUG] logRequest → "${providerName}" used ${apiType} | bucket:${bucket} day total:${dayData[bucket]}`);

// //     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
// //       method: 'PUT', headers: authHeaders(),
// //       body: JSON.stringify({ data: { providerData: updatedProviderData } }),
// //     })
// //       .then((res) => {
// //         if (!res.ok) {
// //           logFailures.current[failKey] = failCount + 1;
// //           if (res.status === 404 && failCount === 2) return;
// //           if (failCount === 0) console.warn(
// //             `[MapsProvider] logRequest PUT ${res.status} for "${providerName}".`,
// //             res.status === 404
// //               ? 'Grant update on api-providers in Strapi → Settings → Roles.'
// //               : `HTTP ${res.status}`,
// //           );
// //         } else {
// //           logFailures.current[failKey] = 0;
// //         }
// //       })
// //       .catch(() => { logFailures.current[failKey] = failCount + 1; });

// //     // Optimistic local update
// //     setProviders((prev) => {
// //       const cur = prev[providerName];
// //       if (!cur) return prev;
// //       const updatedRecord = { ...cur.record, providerData: updatedProviderData };
// //       return { ...prev, [providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) } };
// //     });
// //   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // PROVIDER RESOLUTION
// //   // Returns { name, instance, record, apiMethod } | null
// //   // ─────────────────────────────────────────────────────────────────────────

// //   const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
// //     const apiType = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';

// //     const isUsable = (name) => {
// //       if (failedSet.has(name)) return false;
// //       if (INLINE_PROVIDERS.has(name)) return true;
// //       if (DEEP_LINK_PROVIDERS.has(name)) return !!providers[name]?.instance;

// //       const p = providers[name];
// //       if (!p?.instance) {
// //         console.log(`[MapsProvider:DEBUG] isUsable("${name}") → NO INSTANCE`);
// //         return false;
// //       }

// //       const quotaOk = hasQuota(p.record, apiType);
// //       console.log(`[MapsProvider:DEBUG] isUsable("${name}") → quotaOk:${quotaOk} | serviceType:${serviceType}`);
// //       return quotaOk;
// //     };

// //     const toEntry = (name) => ({
// //       name,
// //       instance:  providers[name]?.instance ?? null,
// //       record:    providers[name]?.record   ?? null,
// //       apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
// //     });

// //     // 1. Explicit provider — bypass priority list entirely
// //     if (explicitName) {
// //       const usable = isUsable(explicitName);
// //       console.log(`[MapsProvider:DEBUG] explicit check "${explicitName}" for ${serviceType} → usable:${usable}`);
// //       if (usable) {
// //         const entry = toEntry(explicitName);
// //         console.log(`[MapsProvider:DEBUG] ✅ EXPLICIT: "${explicitName}" | ${serviceType} → apiMethod:${entry.apiMethod}`);
// //         return entry;
// //       }
// //       console.log(`[MapsProvider:DEBUG] explicit "${explicitName}" not usable → walking priorityList`);
// //     }

// //     // 2. Priority list walk
// //     for (const name of priorityList) {
// //       if (name === explicitName) continue;

// //       // local failed → substitute openstreet immediately
// //       if (name === PROVIDER.LOCAL && failedSet.has(PROVIDER.LOCAL)) {
// //         if (isUsable(PROVIDER.OPENSTREET)) {
// //           console.log('[MapsProvider:DEBUG] local failed → openstreet substituted');
// //           return toEntry(PROVIDER.OPENSTREET);
// //         }
// //         continue;
// //       }

// //       if (isUsable(name)) {
// //         const entry = toEntry(name);
// //         console.log(`[MapsProvider:DEBUG] ✅ FALLBACK: "${name}" | ${serviceType} → apiMethod:${entry.apiMethod}`);
// //         return entry;
// //       }
// //     }

// //     console.log(`[MapsProvider:DEBUG] ❌ NO PROVIDER FOUND for ${serviceType}`);
// //     return null;
// //   }, [priorityList, providers, serviceApis]);

// //   // ── Local OSRM helper ─────────────────────────────────────────────────────

// //   const fetchLocalRoute = useCallback(async (origin, destination) => {
// //     if (!localMapUrl) throw new Error('localMapUrl not configured');
// //     const res = await fetch(
// //       `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
// //     );
// //     if (!res.ok) throw new Error(`Local route API ${res.status}`);
// //     const data = await res.json();
// //     return {
// //       type:          'local',
// //       distance:      data.distance,
// //       duration:      data.duration,
// //       distanceValue: data.distanceValue,
// //       durationValue: data.durationValue,
// //       geometry:      data.geometry ?? [],
// //       steps:         data.steps   ?? [],
// //     };
// //   }, [localMapUrl]);

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // GENERIC SERVICE RUNNER
// //   // ─────────────────────────────────────────────────────────────────────────

// //   const runWithFallback = useCallback(async ({
// //     serviceType,
// //     explicitProvider,
// //     handler,
// //     finalFallback = async () => null,
// //   }) => {
// //     const failed      = new Set();
// //     const maxAttempts = priorityList.length + 2;

// //     for (let i = 0; i < maxAttempts; i++) {
// //       const p = resolveServiceProvider(
// //         failed.has(explicitProvider) ? null : explicitProvider,
// //         serviceType,
// //         failed,
// //       );
// //       if (!p) break;

// //       try {
// //         const result = await handler(p);
// //         if (result != null) return result;
// //         console.log(`[MapsProvider.${serviceType}] "${p.name}" (${p.apiMethod}) → no result`);
// //         failed.add(p.name);
// //       } catch (err) {
// //         console.warn(`[MapsProvider.${serviceType}] "${p.name}" (${p.apiMethod}) threw:`, err.message);
// //         failed.add(p.name);
// //       }
// //     }

// //     console.warn(`[MapsProvider.${serviceType}] all providers failed — final fallback`);
// //     return finalFallback();
// //   }, [priorityList, resolveServiceProvider]);

// //   // ─────────────────────────────────────────────────────────────────────────
// //   // PUBLIC API
// //   // ─────────────────────────────────────────────────────────────────────────

// //   const searchPlaces = useCallback(async (query, countryCode = null) => {
// //     if (!query || query.length < 2) return [];
// //     console.log(`[MapsProvider:DEBUG] searchPlaces → query:"${query}" | countryCode:${countryCode}`);
// //     return runWithFallback({
// //       serviceType: 'autoComplete', explicitProvider: null,
// //       handler: async (p) => {
// //         if (DEEP_LINK_PROVIDERS.has(p.name) && !p.apiMethod) return null;
// //         if (INLINE_PROVIDERS.has(p.name)) {
// //           const r = await nominatimSearch(query, countryCode);
// //           return r.length ? r : null;
// //         }
// //         if (!p.instance?.searchPlaces) return null;

// //         if (typeof window !== 'undefined' && window.__googleMapsViewport) {
// //           const vp = window.__googleMapsViewport;
// //           if (p.instance.setViewport) {
// //             p.instance.setViewport(vp.lat, vp.lng, vp.radiusM, vp.regionCode || countryCode);
// //           } else if (p.instance.setCenter) {
// //             p.instance.setCenter(vp.lat, vp.lng);
// //           }
// //         }

// //         const results = await p.instance.searchPlaces(query, countryCode, p.apiMethod);
// //         if (results?.length) { logRequest(p.name, 'JavaScriptAPI'); return results; }
// //         return null;
// //       },
// //       finalFallback: () => nominatimSearch(query, countryCode),
// //     });
// //   }, [runWithFallback, logRequest]);

// //   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
// //     if (fallbackData?.lat != null && fallbackData?.lng != null) return fallbackData;
// //     return runWithFallback({
// //       serviceType: 'location', explicitProvider: null,
// //       handler: async (p) => {
// //         if (INLINE_PROVIDERS.has(p.name)) return fallbackData;
// //         if (!p.instance?.getPlaceDetails) return null;
// //         const result = await p.instance.getPlaceDetails(placeId, fallbackData, p.apiMethod);
// //         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// //         return null;
// //       },
// //       finalFallback: async () => fallbackData,
// //     });
// //   }, [runWithFallback, logRequest]);

// //   const reverseGeocode = useCallback(async (lat, lng) => {
// //     return runWithFallback({
// //       serviceType: 'location', explicitProvider: null,
// //       handler: async (p) => {
// //         if (INLINE_PROVIDERS.has(p.name)) return nominatimReverse(lat, lng);
// //         if (!p.instance?.reverseGeocode) return null;
// //         const result = await p.instance.reverseGeocode(lat, lng, p.apiMethod);
// //         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// //         return null;
// //       },
// //       finalFallback: () => nominatimReverse(lat, lng),
// //     });
// //   }, [runWithFallback, logRequest]);

// //   const getRoute = useCallback(async (origin, destination) => {
// //     console.log(`[MapsProvider:DEBUG] getRoute → explicit prioritizedRoute:${prioritizedRoute}`);
// //     return runWithFallback({
// //       serviceType: 'routing', explicitProvider: prioritizedRoute,
// //       handler: async (p) => {
// //         if (DEEP_LINK_PROVIDERS.has(p.name) && p.instance?.openNavigation) {
// //           p.instance.openNavigation(destination, origin);
// //           return { type: 'deeplink', provider: p.name };
// //         }
// //         if (p.name === PROVIDER.LOCAL)      return fetchLocalRoute(origin, destination);
// //         if (p.name === PROVIDER.OPENSTREET) return osrmRoute(origin, destination);
// //         if (!p.instance?.getRoute) return null;
// //         const result = await p.instance.getRoute(origin, destination, p.apiMethod);
// //         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// //         return null;
// //       },
// //       finalFallback: () => osrmRoute(origin, destination),
// //     });
// //   }, [prioritizedRoute, runWithFallback, fetchLocalRoute, logRequest]);

// //   const calculateDistance = useCallback(async (origin, destination) => {
// //     console.log(`[MapsProvider:DEBUG] calculateDistance → explicit prioritizedDistance:${prioritizedDistance}`);
// //     return runWithFallback({
// //       serviceType: 'distance', explicitProvider: prioritizedDistance,
// //       handler: async (p) => {
// //         if (p.name === PROVIDER.LOCAL) {
// //           const r = await fetchLocalRoute(origin, destination);
// //           return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
// //         }
// //         if (p.name === PROVIDER.OPENSTREET) {
// //           const r = await osrmRoute(origin, destination);
// //           return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
// //         }
// //         if (!p.instance?.calculateDistance) return null;
// //         const result = await p.instance.calculateDistance(origin, destination, p.apiMethod);
// //         if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// //         return null;
// //       },
// //       finalFallback: async () => {
// //         const R    = 6371;
// //         const dLat = (destination.lat - origin.lat) * Math.PI / 180;
// //         const dLon = (destination.lng - origin.lng) * Math.PI / 180;
// //         const a =
// //           Math.sin(dLat / 2) ** 2 +
// //           Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
// //           Math.sin(dLon / 2) ** 2;
// //         const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// //         return {
// //           distanceValue: Math.round(km * 1000),
// //           distance: km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`,
// //         };
// //       },
// //     });
// //   }, [prioritizedDistance, runWithFallback, fetchLocalRoute, logRequest]);

// //   const calculateEta = useCallback(async (origin, destination) => {
// //     console.log(`[MapsProvider:DEBUG] calculateEta → explicit prioritizedEta:${prioritizedEta}`);
// //     return runWithFallback({
// //       serviceType: 'eta', explicitProvider: prioritizedEta,
// //       handler: async (p) => {
// //         if (p.name === PROVIDER.LOCAL) {
// //           const r = await fetchLocalRoute(origin, destination);
// //           return r ? { durationValue: r.durationValue, duration: r.duration } : null;
// //         }
// //         if (p.name === PROVIDER.OPENSTREET) {
// //           const r = await osrmRoute(origin, destination);
// //           return r ? { durationValue: r.durationValue, duration: r.duration } : null;
// //         }
// //         if (!p.instance?.calculateEta) return null;
// //         const result = await p.instance.calculateEta(origin, destination, p.apiMethod);
// //         if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
// //         return null;
// //       },
// //       finalFallback: async () => null,
// //     });
// //   }, [prioritizedEta, runWithFallback, fetchLocalRoute, logRequest]);

// //   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

// //   const getProviderStatus = useCallback(() =>
// //     priorityList.map((name) => {
// //       const p = providers[name];
// //       if (!p) return { name, loaded: false };
// //       return {
// //         name,
// //         loaded:      true,
// //         hasInstance: !!p.instance || INLINE_PROVIDERS.has(name),
// //         budget:      p.budget,
// //         serviceApis: serviceApis[name] ?? null,
// //         canUseGeo:   hasQuota(p.record, 'GeocoderHTTPAPI'),
// //         canUseJS:    hasQuota(p.record, 'JavaScriptAPI'),
// //       };
// //     }),
// //   [priorityList, providers, serviceApis]);

// //   useEffect(() => {
// //     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
// //   }, [getProviderStatus]);

// //   const value = useMemo(() => ({
// //     ready, allExhausted,
// //     prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
// //     serviceApis,
// //     searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
// //     getRoute, calculateDistance, calculateEta,
// //     getProviderStatus, localMapUrl,
// //   }), [
// //     ready, allExhausted,
// //     prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
// //     serviceApis,
// //     searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
// //     getRoute, calculateDistance, calculateEta,
// //     getProviderStatus, localMapUrl,
// //   ]); // eslint-disable-line react-hooks/exhaustive-deps

// //   return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
// // }

// // export function useMapProvider() {
// //   const ctx = useContext(MapsContext);
// //   if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
// //   return ctx;
// // }

// // export default MapsProvider;
// // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx
// 'use client';

// import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
// import { GoogleMapsProvider } from './GoogleMapsProvider';
// import { YandexMapsProvider } from './YandexMapsProvider';
// import { WazeMapsProvider }   from './WazeMapsProvider';
// import { AppleMapsProvider }  from './AppleMapsProvider';
// import { GeoapifyProvider }   from './GeoapifyProvider';

// const MapsContext = createContext(null);

// // ─────────────────────────────────────────────────────────────────────────────
// // PROVIDER NAME CONSTANTS
// // ─────────────────────────────────────────────────────────────────────────────

// const PROVIDER = {
//   GOOGLE:     'google',
//   APPLE:      'apple',
//   YANDEX:     'yandex',
//   WAZE:       'waze',
//   GEOAPIFY:   'geoapify',
//   OPENSTREET: 'openstreet',
//   LOCAL:      'local',
// };

// const DEEP_LINK_PROVIDERS = new Set([PROVIDER.WAZE, PROVIDER.APPLE]);
// const INLINE_PROVIDERS    = new Set([PROVIDER.OPENSTREET, PROVIDER.LOCAL]);

// // ─────────────────────────────────────────────────────────────────────────────
// // DEFAULT SERVICE → API METHOD MAP PER PROVIDER
// // ─────────────────────────────────────────────────────────────────────────────

// const DEFAULT_SERVICE_APIS = {
//   [PROVIDER.GOOGLE]: {
//     routing:      'routeApi',
//     distance:     'routeApi',
//     eta:          'routeApi',
//     autoComplete: 'placesApi',
//     location:     'geocoding',
//   },
//   [PROVIDER.APPLE]: {
//     routing:      'deeplink',
//     distance:     'mapkit',
//     eta:          null,
//     autoComplete: 'search',
//     location:     'geocoder',
//   },
//   [PROVIDER.YANDEX]: {
//     routing:      'routeApi',
//     distance:     'routeApi',
//     eta:          'routeApi',
//     autoComplete: 'suggest',
//     location:     'geocoder',
//   },
//   [PROVIDER.GEOAPIFY]: {
//     routing:      'routingApi',
//     distance:     'routingApi',
//     eta:          'routingApi',
//     autoComplete: 'placesApi',
//     location:     'geocodingApi',
//   },
//   [PROVIDER.WAZE]: {
//     routing:      'deeplink',
//     distance:     null,
//     eta:          null,
//     autoComplete: null,
//     location:     null,
//   },
//   [PROVIDER.OPENSTREET]: {
//     routing:      'osrm',
//     distance:     'osrm',
//     eta:          'osrm',
//     autoComplete: 'nominatim',
//     location:     'nominatim',
//   },
//   [PROVIDER.LOCAL]: {
//     routing:      'localOsrm',
//     distance:     'localOsrm',
//     eta:          'localOsrm',
//     autoComplete: 'nominatim',
//     location:     'nominatim',
//   },
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // PARSE mapsProviders ARRAY FROM STRAPI
// // ─────────────────────────────────────────────────────────────────────────────

// function parseMapsProviders(rawList) {
//   const providerNames   = [];
//   const perProviderApis = {};
//   const seen            = new Set();

//   console.log('[MapsProvider:DEBUG] parseMapsProviders → rawList:', JSON.stringify(rawList));

//   if (!Array.isArray(rawList)) {
//     console.warn('[MapsProvider:DEBUG] parseMapsProviders → rawList is NOT an array, type:', typeof rawList);
//     return { providerNames, perProviderApis };
//   }

//   if (rawList.length === 0) {
//     console.warn('[MapsProvider:DEBUG] parseMapsProviders → rawList is EMPTY — no providers will be loaded');
//     return { providerNames, perProviderApis };
//   }

//   const isNewFormat = rawList.length > 0 &&
//     typeof rawList[0] === 'object' && rawList[0] !== null &&
//     'name' in rawList[0];

//   console.log(`[MapsProvider:DEBUG] parseMapsProviders → detected format: ${isNewFormat ? 'NEW {name,config}' : 'LEGACY string array'}`);

//   if (isNewFormat) {
//     for (const entry of rawList) {
//       if (!entry || typeof entry !== 'object') {
//         console.warn('[MapsProvider:DEBUG] parseMapsProviders → skipping invalid entry:', entry);
//         continue;
//       }
//       const name   = (entry.name || '').trim();
//       const config = (entry.config && typeof entry.config === 'object') ? entry.config : {};
//       if (!name) {
//         console.warn('[MapsProvider:DEBUG] parseMapsProviders → entry has no name, skipping:', entry);
//         continue;
//       }
//       if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
//       if (Object.keys(config).length > 0) {
//         perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
//         console.log(`[MapsProvider:DEBUG] parseMapsProviders → "${name}" config override:`, config);
//       } else {
//         console.log(`[MapsProvider:DEBUG] parseMapsProviders → "${name}" has empty config — defaults will be used`);
//       }
//     }
//     console.log('[MapsProvider:DEBUG] parseMapsProviders → result:', { providerNames, perProviderApis });
//     return { providerNames, perProviderApis };
//   }

//   // Legacy format: ["google:", { routing: "routeApi" }, ...]
//   for (let i = 0; i < rawList.length; i++) {
//     const item = rawList[i];
//     if (typeof item !== 'string') continue;
//     const name = item.replace(/:$/, '').trim();
//     if (!name) continue;
//     const next   = rawList[i + 1];
//     const config = (next !== null && typeof next === 'object' && !Array.isArray(next)) ? next : {};
//     if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
//     if (Object.keys(config).length > 0) {
//       perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
//     }
//   }

//   console.log('[MapsProvider:DEBUG] parseMapsProviders → result (legacy):', { providerNames, perProviderApis });
//   return { providerNames, perProviderApis };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // DATE HELPERS
// // ─────────────────────────────────────────────────────────────────────────────

// function getMonthKey() {
//   const d = new Date();
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// }

// function getDayKey() {
//   const d = new Date();
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // QUOTA
// // ─────────────────────────────────────────────────────────────────────────────

// const QUOTA_DEFAULTS = {
//   maxMonthlyRequests:          20_000,
//   maxDailyGeocoderApiRequests:  1_000,
//   maxDailyJSApiRequests:       20_000,
// };

// function dailyBucketKey(apiType) {
//   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// }

// function buildFreshProviderData() {
//   return {
//     maxDailyGeocoderApiRequests: QUOTA_DEFAULTS.maxDailyGeocoderApiRequests,
//     maxDailyJSApiRequests:       QUOTA_DEFAULTS.maxDailyJSApiRequests,
//     requestCounts: {},
//     dailyCounts:   {},
//   };
// }

// function computeBudget(record) {
//   const pd       = record?.providerData || {};
//   const monthKey = getMonthKey();
//   const dayKey   = getDayKey();

//   const monthData   = pd.requestCounts?.[monthKey] || {};
//   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
//   const monthlyMax  = record?.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests;

//   const dayData     = pd.dailyCounts?.[dayKey] || {};
//   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || QUOTA_DEFAULTS.maxDailyGeocoderApiRequests;
//   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || QUOTA_DEFAULTS.maxDailyJSApiRequests;

//   const budget = {
//     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
//     dailyGeoRemaining: Math.max(0, maxDailyGeo - (Number(dayData.geo) || 0)),
//     dailyJSRemaining:  Math.max(0, maxDailyJS  - (Number(dayData.js)  || 0)),
//     monthlyMax, maxDailyGeo, maxDailyJS,
//   };

//   if (record?.providerName) {
//     console.log(
//       `[MapsProvider:DEBUG] computeBudget("${record.providerName}")` +
//       ` | monthKey:${monthKey} dayKey:${dayKey}` +
//       ` | monthlyUsed:${monthlyUsed}/${monthlyMax}` +
//       ` | geoToday:${Number(dayData.geo) || 0}/${maxDailyGeo}` +
//       ` | jsToday:${Number(dayData.js) || 0}/${maxDailyJS}` +
//       ` | providerData keys:[${Object.keys(pd).join(',')}]`
//     );
//   }

//   return budget;
// }

// function hasQuota(record, apiType) {
//   const name = record?.providerName;
//   if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;

//   const b = computeBudget(record);

//   console.log(
//     `[MapsProvider:DEBUG] hasQuota("${name}", ${apiType})` +
//     ` → monthly:${b.monthlyRemaining}/${b.monthlyMax}` +
//     ` | dailyGeo:${b.dailyGeoRemaining}/${b.maxDailyGeo}` +
//     ` | dailyJS:${b.dailyJSRemaining}/${b.maxDailyJS}`
//   );

//   return (
//     b.monthlyRemaining > 0 &&
//     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
//     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0)
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // PROVIDER INSTANCE FACTORY
// // ─────────────────────────────────────────────────────────────────────────────

// function createProviderInstance(name) {
//   switch (name) {
//     case PROVIDER.WAZE: {
//       const inst = new WazeMapsProvider();
//       console.log(`[MapsProvider:DEBUG] createProviderInstance("waze") → deep-link instance created`);
//       return inst;
//     }
//     case PROVIDER.APPLE: {
//       const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';
//       console.log(`[MapsProvider:DEBUG] createProviderInstance("apple") → token present:${!!token}`);
//       return new AppleMapsProvider(token);
//     }
//     case PROVIDER.GOOGLE: {
//       const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
//       console.log(
//         `[MapsProvider:DEBUG] createProviderInstance("google") → key present:${!!key}` +
//         ` | prefix:${key ? key.slice(0, 8) + '...' : 'MISSING — check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env'}`
//       );
//       if (!key) console.error('[MapsProvider:DEBUG] ⚠️  Google instance created with NO API KEY — all Google calls will fail');
//       return new GoogleMapsProvider(key);
//     }
//     case PROVIDER.YANDEX: {
//       const key = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
//       console.log(`[MapsProvider:DEBUG] createProviderInstance("yandex") → key present:${!!key}`);
//       return new YandexMapsProvider(key);
//     }
//     case PROVIDER.GEOAPIFY: {
//       const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
//       console.log(`[MapsProvider:DEBUG] createProviderInstance("geoapify") → key present:${!!key}`);
//       return new GeoapifyProvider(key);
//     }
//     case PROVIDER.OPENSTREET:
//     case PROVIDER.LOCAL:
//       console.log(`[MapsProvider:DEBUG] createProviderInstance("${name}") → inline provider, no instance needed`);
//       return null;
//     default:
//       console.warn(`[MapsProvider:DEBUG] createProviderInstance: unknown provider "${name}"`);
//       return null;
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // NOMINATIM
// // ─────────────────────────────────────────────────────────────────────────────

// async function nominatimSearch(query, countryCode = null) {
//   try {
//     const params = new URLSearchParams({ q: query, format: 'json', limit: '7', addressdetails: '1' });
//     if (countryCode) params.set('countrycodes', countryCode);
//     const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
//       headers: { 'Accept-Language': 'en' },
//     });
//     if (!res.ok) return [];
//     const data = await res.json();
//     return data.map((item) => ({
//       place_id:       item.place_id?.toString(),
//       main_text:      item.name || item.display_name?.split(',')[0],
//       secondary_text: item.display_name,
//       lat:            parseFloat(item.lat),
//       lng:            parseFloat(item.lon),
//       address:        item.display_name,
//       name:           item.name || item.display_name?.split(',')[0],
//     }));
//   } catch { return []; }
// }

// async function nominatimReverse(lat, lng) {
//   try {
//     const res = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
//       { headers: { 'Accept-Language': 'en' } },
//     );
//     if (!res.ok) return null;
//     const data = await res.json();
//     return {
//       lat, lng,
//       address:  data.display_name,
//       name:     data.name || data.display_name?.split(',')[0],
//       place_id: `nominatim_${data.place_id}`,
//     };
//   } catch { return null; }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // PUBLIC OSRM
// // ─────────────────────────────────────────────────────────────────────────────

// async function osrmRoute(origin, destination) {
//   try {
//     const url =
//       `https://router.project-osrm.org/route/v1/driving/` +
//       `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
//       `?overview=full&geometries=geojson`;
//     const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
//     if (!res.ok) throw new Error(`OSRM ${res.status}`);
//     const data  = await res.json();
//     const route = data.routes?.[0];
//     if (!route) throw new Error('No OSRM route');
//     const km  = route.distance / 1000;
//     const min = route.duration / 60;
//     return {
//       type:          'osrm',
//       distance:      km  >= 1 ? `${km.toFixed(1)} km`        : `${Math.round(km * 1000)} m`,
//       duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
//       distanceValue: route.distance,
//       durationValue: route.duration,
//       geometry:      route.geometry?.coordinates || [],
//       steps:         [],
//     };
//   } catch (err) {
//     console.warn('[MapsProvider] Public OSRM failed:', err.message);
//     return null;
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // IP GEOLOCATION
// // ─────────────────────────────────────────────────────────────────────────────

// async function getIPLocation(localServerUrl) {
//   if (localServerUrl) {
//     try {
//       const res = await fetch(`${localServerUrl}/ip-location`);
//       if (res.ok) {
//         const d = await res.json();
//         if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'local' };
//       }
//     } catch { /* fall through */ }
//   }
//   try {
//     const res = await fetch('https://ipapi.co/json/');
//     if (res.ok) {
//       const d = await res.json();
//       if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'ipapi' };
//     }
//   } catch { /* fall through */ }
//   return { lat: -15.4167, lng: 28.2833, source: 'default' };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAPSPROVIDER
// // ─────────────────────────────────────────────────────────────────────────────

// export function MapsProvider({ children }) {
//   const [priorityList,        setPriorityList]        = useState([]);
//   const [providers,           setProviders]           = useState({});
//   const [allExhausted,        setAllExhausted]        = useState(false);
//   const [ready,               setReady]               = useState(false);

//   const [prioritizedMap,      setPrioritizedMap]      = useState(PROVIDER.OPENSTREET);
//   const [prioritizedRoute,    setPrioritizedRoute]    = useState(null);
//   const [prioritizedDistance, setPrioritizedDistance] = useState(null);
//   const [prioritizedEta,      setPrioritizedEta]      = useState(null);

//   const [serviceApis, setServiceApis] = useState(DEFAULT_SERVICE_APIS);

//   const apiUrl      = process.env.NEXT_PUBLIC_API_URL                       || '';
//   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

//   const providersRef = useRef(providers);
//   useEffect(() => { providersRef.current = providers; }, [providers]);

//   const getToken = useCallback(() => {
//     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
//     catch { return null; }
//   }, []);

//   function authHeaders() {
//     const token = getToken();
//     return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
//   }

//   const initFailures = useRef({});
//   const logFailures  = useRef({});

//   async function initProviderData(record) {
//     const name = record.providerName;
//     console.log(
//       `[MapsProvider:DEBUG] initProviderData("${name}") → id:${record.id}` +
//       ` | providerData keys:[${Object.keys(record.providerData || {}).join(',')}]`
//     );

//     if (record.id == null) {
//       console.log(`[MapsProvider:DEBUG] initProviderData("${name}") → no Strapi id, using fresh data`);
//       return { ...record, providerData: buildFreshProviderData() };
//     }

//     const pd = record.providerData;
//     if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) {
//       console.log(`[MapsProvider:DEBUG] initProviderData("${name}") → providerData already populated, skipping PUT`);
//       return record;
//     }

//     const failKey   = name;
//     const failCount = initFailures.current[failKey] || 0;
//     console.log(`[MapsProvider:DEBUG] initProviderData("${name}") → providerData is EMPTY, will PUT fresh data | failCount:${failCount}`);

//     if (failCount >= 5) {
//       console.warn(`[MapsProvider:DEBUG] initProviderData("${name}") → too many failures (${failCount}), using local fresh data only`);
//       return { ...record, providerData: buildFreshProviderData() };
//     }

//     const freshData = buildFreshProviderData();
//     try {
//       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
//         method: 'PUT', headers: authHeaders(),
//         body: JSON.stringify({ data: { providerData: freshData } }),
//       });
//       console.log(`[MapsProvider:DEBUG] initProviderData("${name}") → PUT response: ${res.status}`);
//       if (!res.ok) {
//         if (res.status === 404) {
//           console.warn(`[MapsProvider:DEBUG] initProviderData("${name}") → 404, record not found in Strapi`);
//           return { ...record, providerData: buildFreshProviderData() };
//         }
//         initFailures.current[failKey] = failCount + 1;
//       } else {
//         initFailures.current[failKey] = 0;
//         console.log(`[MapsProvider:DEBUG] initProviderData("${name}") → ✅ fresh providerData written to Strapi`);
//       }
//     } catch (err) {
//       console.error(`[MapsProvider:DEBUG] initProviderData("${name}") → PUT threw:`, err?.message);
//       initFailures.current[failKey] = failCount + 1;
//     }
//     return { ...record, providerData: freshData };
//   }

//   // ── Load ──────────────────────────────────────────────────────────────────

//   useEffect(() => {
//     async function load() {
//       if (!apiUrl) { setReady(true); return; }

//       try {
//         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
//         const pmJson = await pmRes.json();
//         const pmRaw  = pmJson?.data ?? {};
//         const attrs  = pmRaw.attributes ?? pmRaw;

//         console.log('[MapsProvider:DEBUG] Strapi priority-map attrs →', {
//           prioritizedMap:               attrs.prioritizedMap,
//           priotizedRouteDrawer:         attrs.priotizedRouteDrawer,
//           priotizedDistanceCalculator:  attrs.priotizedDistanceCalculator,
//           priotizedEtaCalculator:       attrs.priotizedEtaCalculator,
//           mapsProviders:                attrs.mapsProviders,
//         });

//         const pMap      = attrs.prioritizedMap              ?? PROVIDER.OPENSTREET;
//         const pRoute    = attrs.priotizedRouteDrawer        ?? null;
//         const pDistance = attrs.priotizedDistanceCalculator ?? null;
//         const pEta      = attrs.priotizedEtaCalculator      ?? null;

//         console.log(`[MapsProvider:DEBUG] FINAL assigned → map:${pMap} | route:${pRoute} | distance:${pDistance} | eta:${pEta}`);

//         setPrioritizedMap(pMap);
//         setPrioritizedRoute(pRoute);
//         setPrioritizedDistance(pDistance);
//         setPrioritizedEta(pEta);

//         // ── Parse mapsProviders ─────────────────────────────────────────────
//         const rawList = attrs.mapsProviders ?? [];
//         const { providerNames: parsedList, perProviderApis } = parseMapsProviders(rawList);

//         // ── FIX: Auto-inject any provider referenced in the prioritized      ──
//         // ── fields that wasn't explicitly listed in mapsProviders.            ──
//         // ── Previously, if e.g. "google" was set as priotizedRouteDrawer but  ──
//         // ── was absent from mapsProviders, providers['google'] would be       ──
//         // ── undefined and resolveServiceProvider would silently fall through  ──
//         // ── to openstreet (always usable as an inline provider).              ──
//         const list = [...parsedList];
//         const prioritizedProviders = [pMap, pRoute, pDistance, pEta].filter(Boolean);
//         for (const name of prioritizedProviders) {
//           if (!list.includes(name)) {
//             list.push(name);
//             console.log(
//               `[MapsProvider:DEBUG] ✅ AUTO-INJECTED prioritized provider "${name}" into provider list` +
//               ` — it was set in a priority field but was missing from mapsProviders.`
//             );
//           }
//         }

//         console.log('[MapsProvider:DEBUG] final provider list (after auto-inject):', list);
//         console.log('[MapsProvider:DEBUG] per-provider api overrides:', perProviderApis);

//         // Merge Strapi per-provider configs over hardcoded defaults
//         setServiceApis(() => {
//           const merged = { ...DEFAULT_SERVICE_APIS };
//           for (const [provName, apis] of Object.entries(perProviderApis)) {
//             merged[provName] = { ...(DEFAULT_SERVICE_APIS[provName] || {}), ...apis };
//           }
//           return merged;
//         });

//         setPriorityList(list);
//         if (!list.length) { setReady(true); return; }

//         // ── Fetch provider records from Strapi ──────────────────────────────
//         const queryableNames = list.filter((n) => !INLINE_PROVIDERS.has(n));
//         const providerMap    = {};

//         console.log('[MapsProvider:DEBUG] queryable provider names (non-inline):', queryableNames);

//         if (queryableNames.length > 0) {
//           const filterParams = queryableNames
//             .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
//             .join('&');

//           const provUrl  = `${apiUrl}/api-providers?${filterParams}&populate=*`;
//           console.log('[MapsProvider:DEBUG] fetching provider records →', provUrl.replace(/Bearer [^\s]+/, 'Bearer <redacted>'));

//           const provRes  = await fetch(provUrl, { headers: authHeaders() });
//           const provJson = await provRes.json();

//           console.log(
//             `[MapsProvider:DEBUG] Strapi api-providers response → HTTP:${provRes.status}` +
//             ` | records returned:${(provJson?.data ?? []).length}` +
//             ` | expected:${queryableNames.length}`
//           );

//           if ((provJson?.data ?? []).length === 0) {
//             console.warn(
//               '[MapsProvider:DEBUG] ⚠️  NO provider records returned from Strapi!' +
//               ' Make sure each provider has a row in the api-providers collection with the correct providerName.'
//             );
//           }

//           for (const item of (provJson?.data ?? [])) {
//             const flat = item.attributes ?? item;
//             const name = flat.providerName;

//             console.log(
//               `[MapsProvider:DEBUG] Strapi record → id:${item.id} | providerName:"${name}"` +
//               ` | maxMonthly:${flat.maxMonthlyRequests}` +
//               ` | providerData keys:[${Object.keys(flat.providerData || {}).join(',')}]`
//             );

//             if (!name) {
//               console.warn('[MapsProvider:DEBUG] Strapi record has no providerName, skipping. Raw item:', JSON.stringify(item));
//               continue;
//             }

//             const record = {
//               id:                 item.id,
//               providerName:       name,
//               providerData:       flat.providerData       ?? {},
//               maxMonthlyRequests: flat.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests,
//             };

//             if (!DEEP_LINK_PROVIDERS.has(name)) {
//               initProviderData(record).then((updated) => {
//                 setProviders((prev) => {
//                   if (!prev[name]) return prev;
//                   return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
//                 });
//               }).catch(() => {});
//             }

//             const instance = createProviderInstance(name);
//             console.log(`[MapsProvider:DEBUG] "${name}" → record id:${item.id} | instance:${instance ? 'created ✅' : 'null ❌'}`);

//             providerMap[name] = { record, instance, budget: computeBudget(record) };
//           }

//           for (const name of queryableNames) {
//             if (!providerMap[name]) {
//               console.warn(
//                 `[MapsProvider:DEBUG] ⚠️  "${name}" is in provider list but has NO Strapi record.` +
//                 ` It will get a synthesised record with default quota. Check api-providers collection.`
//               );
//             }
//           }
//         }

//         // Synthesise entries for providers not yet in Strapi
//         for (const name of list) {
//           if (providerMap[name]) continue;
//           const defaultRecord = {
//             id: null, providerName: name,
//             providerData: buildFreshProviderData(),
//             maxMonthlyRequests: QUOTA_DEFAULTS.maxMonthlyRequests,
//           };
//           const instance = createProviderInstance(name);
//           providerMap[name] = { record: defaultRecord, instance, budget: computeBudget(defaultRecord) };
//           console.log(`[MapsProvider:DEBUG] "${name}": synthesised (no Strapi record) | instance:${instance ? 'created' : 'inline/null'}`);
//         }

//         setProviders(providerMap);

//         const summary = Object.entries(providerMap).map(([n, p]) => ({
//           name:        n,
//           hasInstance: !!p.instance,
//           isInline:    INLINE_PROVIDERS.has(n),
//           recordId:    p.record?.id ?? 'none',
//           budget:      p.budget,
//         }));
//         console.log('[MapsProvider:DEBUG] ── FINAL PROVIDER MAP ──');
//         summary.forEach((s) => {
//           const usable = s.hasInstance || s.isInline;
//           console.log(
//             `[MapsProvider:DEBUG]  ${usable ? '✅' : '❌'} "${s.name}"` +
//             ` | instance:${s.hasInstance} inline:${s.isInline} recordId:${s.recordId}` +
//             ` | monthly remaining:${s.budget?.monthlyRemaining} geo/day:${s.budget?.dailyGeoRemaining} js/day:${s.budget?.dailyJSRemaining}`
//           );
//         });

//         const anyUsable = list.some((n) => providerMap[n]?.instance != null || INLINE_PROVIDERS.has(n));
//         console.log(`[MapsProvider:DEBUG] allExhausted will be set to: ${!anyUsable}`);
//         setAllExhausted(!anyUsable);

//       } catch (err) {
//         console.error('[MapsProvider] load error:', err);
//         setAllExhausted(true);
//       } finally {
//         setReady(true);
//       }
//     }

//     load();
//   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── logRequest ────────────────────────────────────────────────────────────

//   const logRequest = useCallback((providerName, apiType) => {
//     const p = providersRef.current[providerName];
//     if (!p || p.record.id == null) return;

//     const failKey   = `${providerName}:${p.record.id}`;
//     const failCount = logFailures.current[failKey] || 0;
//     if (failCount >= 3) return;

//     const monthKey = getMonthKey();
//     const dayKey   = getDayKey();
//     const bucket   = dailyBucketKey(apiType);

//     const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
//     const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
//     const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

//     monthData[apiType] = (Number(monthData[apiType]) || 0) + 1;
//     dayData[bucket]    = (Number(dayData[bucket])    || 0) + 1;

//     const updatedProviderData = {
//       ...existing,
//       requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
//       dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
//     };

//     console.log(`[MapsProvider:DEBUG] logRequest → "${providerName}" used ${apiType} | bucket:${bucket} day total:${dayData[bucket]}`);

//     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
//       method: 'PUT', headers: authHeaders(),
//       body: JSON.stringify({ data: { providerData: updatedProviderData } }),
//     })
//       .then((res) => {
//         if (!res.ok) {
//           logFailures.current[failKey] = failCount + 1;
//           if (res.status === 404 && failCount === 2) return;
//           if (failCount === 0) console.warn(
//             `[MapsProvider] logRequest PUT ${res.status} for "${providerName}".`,
//             res.status === 404
//               ? 'Grant update on api-providers in Strapi → Settings → Roles.'
//               : `HTTP ${res.status}`,
//           );
//         } else {
//           logFailures.current[failKey] = 0;
//         }
//       })
//       .catch(() => { logFailures.current[failKey] = failCount + 1; });

//     setProviders((prev) => {
//       const cur = prev[providerName];
//       if (!cur) return prev;
//       const updatedRecord = { ...cur.record, providerData: updatedProviderData };
//       return { ...prev, [providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) } };
//     });
//   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ─────────────────────────────────────────────────────────────────────────
//   // PROVIDER RESOLUTION
//   // ─────────────────────────────────────────────────────────────────────────

//   const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
//     const apiType = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';

//     const providerKeys = Object.keys(providers);
//     console.log(
//       `[MapsProvider:DEBUG] resolveServiceProvider("${explicitName}", "${serviceType}")` +
//       ` | providers in state:[${providerKeys.join(',')}]` +
//       ` | priorityList:[${priorityList.join(',')}]` +
//       ` | failedSet:[${[...failedSet].join(',')}]`
//     );

//     if (providerKeys.length === 0) {
//       console.error('[MapsProvider:DEBUG] resolveServiceProvider → providers state is EMPTY — load() may not have completed or setProviders was not called');
//     }

//     const isUsable = (name) => {
//       if (failedSet.has(name)) {
//         console.log(`[MapsProvider:DEBUG] isUsable("${name}") → SKIPPED (already in failedSet)`);
//         return false;
//       }
//       if (INLINE_PROVIDERS.has(name)) {
//         console.log(`[MapsProvider:DEBUG] isUsable("${name}") → INLINE, always usable`);
//         return true;
//       }
//       if (DEEP_LINK_PROVIDERS.has(name)) {
//         const ok = !!providers[name]?.instance;
//         console.log(`[MapsProvider:DEBUG] isUsable("${name}") → DEEP_LINK, instance:${ok}`);
//         return ok;
//       }

//       const p = providers[name];
//       if (!p) {
//         console.log(`[MapsProvider:DEBUG] isUsable("${name}") → NOT IN providers state (providers has:[${Object.keys(providers).join(',')}])`);
//         return false;
//       }
//       if (!p.instance) {
//         console.log(`[MapsProvider:DEBUG] isUsable("${name}") → NO INSTANCE (p exists but p.instance is null/undefined)`);
//         return false;
//       }

//       const quotaOk = hasQuota(p.record, apiType);
//       console.log(`[MapsProvider:DEBUG] isUsable("${name}") → instance:✅ quotaOk:${quotaOk} | serviceType:${serviceType}`);
//       return quotaOk;
//     };

//     const toEntry = (name) => ({
//       name,
//       instance:  providers[name]?.instance ?? null,
//       record:    providers[name]?.record   ?? null,
//       apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
//     });

//     // 1. Explicit provider
//     if (explicitName) {
//       const usable = isUsable(explicitName);
//       console.log(`[MapsProvider:DEBUG] explicit check "${explicitName}" for ${serviceType} → usable:${usable}`);
//       if (usable) {
//         const entry = toEntry(explicitName);
//         console.log(`[MapsProvider:DEBUG] ✅ EXPLICIT: "${explicitName}" | ${serviceType} → apiMethod:${entry.apiMethod}`);
//         return entry;
//       }
//       console.log(`[MapsProvider:DEBUG] explicit "${explicitName}" not usable → walking priorityList`);
//     }

//     // 2. Priority list walk
//     for (const name of priorityList) {
//       if (name === explicitName) continue;

//       if (name === PROVIDER.LOCAL && failedSet.has(PROVIDER.LOCAL)) {
//         if (isUsable(PROVIDER.OPENSTREET)) {
//           console.log('[MapsProvider:DEBUG] local failed → openstreet substituted');
//           return toEntry(PROVIDER.OPENSTREET);
//         }
//         continue;
//       }

//       if (isUsable(name)) {
//         const entry = toEntry(name);
//         console.log(`[MapsProvider:DEBUG] ✅ FALLBACK: "${name}" | ${serviceType} → apiMethod:${entry.apiMethod}`);
//         return entry;
//       }
//     }

//     console.log(`[MapsProvider:DEBUG] ❌ NO PROVIDER FOUND for ${serviceType}`);
//     return null;
//   }, [priorityList, providers, serviceApis]);

//   // ── Local OSRM helper ─────────────────────────────────────────────────────

//   const fetchLocalRoute = useCallback(async (origin, destination) => {
//     if (!localMapUrl) throw new Error('localMapUrl not configured');
//     const res = await fetch(
//       `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
//     );
//     if (!res.ok) throw new Error(`Local route API ${res.status}`);
//     const data = await res.json();
//     return {
//       type:          'local',
//       distance:      data.distance,
//       duration:      data.duration,
//       distanceValue: data.distanceValue,
//       durationValue: data.durationValue,
//       geometry:      data.geometry ?? [],
//       steps:         data.steps   ?? [],
//     };
//   }, [localMapUrl]);

//   // ─────────────────────────────────────────────────────────────────────────
//   // GENERIC SERVICE RUNNER
//   // ─────────────────────────────────────────────────────────────────────────

//   const runWithFallback = useCallback(async ({
//     serviceType,
//     explicitProvider,
//     handler,
//     finalFallback = async () => null,
//   }) => {
//     const failed      = new Set();
//     const maxAttempts = priorityList.length + 2;

//     console.log(
//       `[MapsProvider:DEBUG] runWithFallback START → serviceType:"${serviceType}"` +
//       ` | explicitProvider:"${explicitProvider}" | maxAttempts:${maxAttempts}`
//     );

//     for (let i = 0; i < maxAttempts; i++) {
//       const p = resolveServiceProvider(
//         failed.has(explicitProvider) ? null : explicitProvider,
//         serviceType,
//         failed,
//       );
//       if (!p) {
//         console.log(`[MapsProvider:DEBUG] runWithFallback → attempt ${i + 1}: resolveServiceProvider returned null, stopping`);
//         break;
//       }

//       console.log(`[MapsProvider:DEBUG] runWithFallback → attempt ${i + 1}: trying "${p.name}" apiMethod:"${p.apiMethod}"`);

//       try {
//         const result = await handler(p);
//         if (result != null) {
//           console.log(`[MapsProvider:DEBUG] runWithFallback → ✅ "${p.name}" returned a result for ${serviceType}`);
//           return result;
//         }
//         console.log(`[MapsProvider:DEBUG] runWithFallback → "${p.name}" (${p.apiMethod}) returned null/undefined`);
//         failed.add(p.name);
//       } catch (err) {
//         console.warn(`[MapsProvider:DEBUG] runWithFallback → "${p.name}" (${p.apiMethod}) threw: ${err.message}`);
//         failed.add(p.name);
//       }
//     }

//     console.warn(`[MapsProvider:DEBUG] runWithFallback → all providers failed for "${serviceType}", running finalFallback`);
//     return finalFallback();
//   }, [priorityList, resolveServiceProvider]);

//   // ─────────────────────────────────────────────────────────────────────────
//   // PUBLIC API
//   // ─────────────────────────────────────────────────────────────────────────

//   const searchPlaces = useCallback(async (query, countryCode = null) => {
//     if (!query || query.length < 2) return [];
//     console.log(`[MapsProvider:DEBUG] searchPlaces called → query:"${query}" | countryCode:${countryCode}`);
//     return runWithFallback({
//       serviceType: 'autoComplete', explicitProvider: null,
//       handler: async (p) => {
//         console.log(`[MapsProvider:DEBUG] searchPlaces handler → provider:"${p.name}" apiMethod:"${p.apiMethod}"`);
//         if (DEEP_LINK_PROVIDERS.has(p.name) && !p.apiMethod) {
//           console.log(`[MapsProvider:DEBUG] searchPlaces → deep-link "${p.name}" has no autoComplete method, skipping`);
//           return null;
//         }
//         if (INLINE_PROVIDERS.has(p.name)) {
//           console.log(`[MapsProvider:DEBUG] searchPlaces → inline Nominatim branch`);
//           const r = await nominatimSearch(query, countryCode);
//           return r.length ? r : null;
//         }
//         if (!p.instance?.searchPlaces) {
//           console.warn(`[MapsProvider:DEBUG] searchPlaces → "${p.name}" has no searchPlaces method`);
//           return null;
//         }

//         if (typeof window !== 'undefined' && window.__googleMapsViewport) {
//           const vp = window.__googleMapsViewport;
//           console.log(`[MapsProvider:DEBUG] searchPlaces → injecting viewport bias into "${p.name}":`, vp);
//           if (p.instance.setViewport) {
//             p.instance.setViewport(vp.lat, vp.lng, vp.radiusM, vp.regionCode || countryCode);
//           } else if (p.instance.setCenter) {
//             p.instance.setCenter(vp.lat, vp.lng);
//           }
//         }

//         console.log(`[MapsProvider:DEBUG] searchPlaces → calling p.instance.searchPlaces on "${p.name}"`);
//         const results = await p.instance.searchPlaces(query, countryCode, p.apiMethod);
//         if (results?.length) {
//           logRequest(p.name, 'JavaScriptAPI');
//           console.log(`[MapsProvider:DEBUG] searchPlaces → ✅ "${p.name}" returned ${results.length} results`);
//           return results;
//         }
//         console.warn(`[MapsProvider:DEBUG] searchPlaces → "${p.name}" returned no results`);
//         return null;
//       },
//       finalFallback: () => {
//         console.warn('[MapsProvider:DEBUG] searchPlaces → finalFallback: Nominatim');
//         return nominatimSearch(query, countryCode);
//       },
//     });
//   }, [runWithFallback, logRequest]);

//   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
//     if (fallbackData?.lat != null && fallbackData?.lng != null) return fallbackData;
//     return runWithFallback({
//       serviceType: 'location', explicitProvider: null,
//       handler: async (p) => {
//         if (INLINE_PROVIDERS.has(p.name)) return fallbackData;
//         if (!p.instance?.getPlaceDetails) return null;
//         const result = await p.instance.getPlaceDetails(placeId, fallbackData, p.apiMethod);
//         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
//         return null;
//       },
//       finalFallback: async () => fallbackData,
//     });
//   }, [runWithFallback, logRequest]);

//   const reverseGeocode = useCallback(async (lat, lng) => {
//     return runWithFallback({
//       serviceType: 'location', explicitProvider: null,
//       handler: async (p) => {
//         if (INLINE_PROVIDERS.has(p.name)) return nominatimReverse(lat, lng);
//         if (!p.instance?.reverseGeocode) return null;
//         const result = await p.instance.reverseGeocode(lat, lng, p.apiMethod);
//         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
//         return null;
//       },
//       finalFallback: () => nominatimReverse(lat, lng),
//     });
//   }, [runWithFallback, logRequest]);

//   const getRoute = useCallback(async (origin, destination) => {
//     console.log(`[MapsProvider:DEBUG] getRoute called → prioritizedRoute:"${prioritizedRoute}" | origin:${JSON.stringify(origin)} dest:${JSON.stringify(destination)}`);
//     return runWithFallback({
//       serviceType: 'routing', explicitProvider: prioritizedRoute,
//       handler: async (p) => {
//         console.log(`[MapsProvider:DEBUG] getRoute handler → provider:"${p.name}" apiMethod:"${p.apiMethod}"`);
//         if (DEEP_LINK_PROVIDERS.has(p.name) && p.instance?.openNavigation) {
//           console.log(`[MapsProvider:DEBUG] getRoute → deep-link branch for "${p.name}"`);
//           p.instance.openNavigation(destination, origin);
//           return { type: 'deeplink', provider: p.name };
//         }
//         if (p.name === PROVIDER.LOCAL) {
//           console.log('[MapsProvider:DEBUG] getRoute → local OSRM branch');
//           return fetchLocalRoute(origin, destination);
//         }
//         if (p.name === PROVIDER.OPENSTREET) {
//           console.log('[MapsProvider:DEBUG] getRoute → public OSRM branch');
//           return osrmRoute(origin, destination);
//         }
//         if (!p.instance?.getRoute) {
//           console.warn(`[MapsProvider:DEBUG] getRoute → "${p.name}" has no getRoute method`);
//           return null;
//         }
//         console.log(`[MapsProvider:DEBUG] getRoute → calling p.instance.getRoute on "${p.name}"`);
//         const result = await p.instance.getRoute(origin, destination, p.apiMethod);
//         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
//         console.warn(`[MapsProvider:DEBUG] getRoute → "${p.name}" instance.getRoute returned null`);
//         return null;
//       },
//       finalFallback: () => {
//         console.warn('[MapsProvider:DEBUG] getRoute → finalFallback: public OSRM');
//         return osrmRoute(origin, destination);
//       },
//     });
//   }, [prioritizedRoute, runWithFallback, fetchLocalRoute, logRequest]);

//   const calculateDistance = useCallback(async (origin, destination) => {
//     console.log(`[MapsProvider:DEBUG] calculateDistance called → prioritizedDistance:"${prioritizedDistance}"`);
//     return runWithFallback({
//       serviceType: 'distance', explicitProvider: prioritizedDistance,
//       handler: async (p) => {
//         console.log(`[MapsProvider:DEBUG] calculateDistance handler → provider:"${p.name}" apiMethod:"${p.apiMethod}"`);
//         if (p.name === PROVIDER.LOCAL) {
//           const r = await fetchLocalRoute(origin, destination);
//           return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
//         }
//         if (p.name === PROVIDER.OPENSTREET) {
//           const r = await osrmRoute(origin, destination);
//           return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
//         }
//         if (!p.instance?.calculateDistance) {
//           console.warn(`[MapsProvider:DEBUG] calculateDistance → "${p.name}" has no calculateDistance method`);
//           return null;
//         }
//         const result = await p.instance.calculateDistance(origin, destination, p.apiMethod);
//         if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
//         return null;
//       },
//       finalFallback: async () => {
//         console.warn('[MapsProvider:DEBUG] calculateDistance → finalFallback: haversine');
//         const R    = 6371;
//         const dLat = (destination.lat - origin.lat) * Math.PI / 180;
//         const dLon = (destination.lng - origin.lng) * Math.PI / 180;
//         const a =
//           Math.sin(dLat / 2) ** 2 +
//           Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
//           Math.sin(dLon / 2) ** 2;
//         const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//         return {
//           distanceValue: Math.round(km * 1000),
//           distance: km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`,
//         };
//       },
//     });
//   }, [prioritizedDistance, runWithFallback, fetchLocalRoute, logRequest]);

//   const calculateEta = useCallback(async (origin, destination) => {
//     console.log(`[MapsProvider:DEBUG] calculateEta called → prioritizedEta:"${prioritizedEta}"`);
//     return runWithFallback({
//       serviceType: 'eta', explicitProvider: prioritizedEta,
//       handler: async (p) => {
//         console.log(`[MapsProvider:DEBUG] calculateEta handler → provider:"${p.name}" apiMethod:"${p.apiMethod}"`);
//         if (p.name === PROVIDER.LOCAL) {
//           const r = await fetchLocalRoute(origin, destination);
//           return r ? { durationValue: r.durationValue, duration: r.duration } : null;
//         }
//         if (p.name === PROVIDER.OPENSTREET) {
//           const r = await osrmRoute(origin, destination);
//           return r ? { durationValue: r.durationValue, duration: r.duration } : null;
//         }
//         if (!p.instance?.calculateEta) {
//           console.warn(`[MapsProvider:DEBUG] calculateEta → "${p.name}" has no calculateEta method`);
//           return null;
//         }
//         const result = await p.instance.calculateEta(origin, destination, p.apiMethod);
//         if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
//         return null;
//       },
//       finalFallback: async () => {
//         console.warn('[MapsProvider:DEBUG] calculateEta → finalFallback: null');
//         return null;
//       },
//     });
//   }, [prioritizedEta, runWithFallback, fetchLocalRoute, logRequest]);

//   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

//   const getProviderStatus = useCallback(() =>
//     priorityList.map((name) => {
//       const p = providers[name];
//       if (!p) return { name, loaded: false };
//       return {
//         name,
//         loaded:      true,
//         hasInstance: !!p.instance || INLINE_PROVIDERS.has(name),
//         budget:      p.budget,
//         serviceApis: serviceApis[name] ?? null,
//         canUseGeo:   hasQuota(p.record, 'GeocoderHTTPAPI'),
//         canUseJS:    hasQuota(p.record, 'JavaScriptAPI'),
//       };
//     }),
//   [priorityList, providers, serviceApis]);

//   useEffect(() => {
//     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
//   }, [getProviderStatus]);

//   const value = useMemo(() => ({
//     ready, allExhausted,
//     prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
//     serviceApis,
//     searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
//     getRoute, calculateDistance, calculateEta,
//     getProviderStatus, localMapUrl,
//   }), [
//     ready, allExhausted,
//     prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
//     serviceApis,
//     searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
//     getRoute, calculateDistance, calculateEta,
//     getProviderStatus, localMapUrl,
//   ]); // eslint-disable-line react-hooks/exhaustive-deps

//   return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
// }

// export function useMapProvider() {
//   const ctx = useContext(MapsContext);
//   if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
//   return ctx;
// }

// export default MapsProvider;
// PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx
'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMapsProvider } from './GoogleMapsProvider';
import { YandexMapsProvider } from './YandexMapsProvider';
import { WazeMapsProvider }   from './WazeMapsProvider';
import { AppleMapsProvider }  from './AppleMapsProvider';
import { GeoapifyProvider }   from './GeoapifyProvider';

const MapsContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING HELPER
// Prefixes every log with a timestamp and severity tag so you can grep easily.
// L.info / L.warn / L.error / L.ok / L.fail / L.trace
// ─────────────────────────────────────────────────────────────────────────────
const L = {
  _fmt: (tag, section, msg, data) => {
    const ts   = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    const base = `[MapsProvider][${ts}][${tag}] ── ${section} ── ${msg}`;
    if (data !== undefined) console.log(base, data);
    else                    console.log(base);
  },
  info:  (s, m, d) => L._fmt('INFO ', s, m, d),
  warn:  (s, m, d) => L._fmt('WARN ', s, m, d),
  error: (s, m, d) => L._fmt('ERROR', s, m, d),
  ok:    (s, m, d) => L._fmt('OK   ', s, m, d),
  fail:  (s, m, d) => L._fmt('FAIL ', s, m, d),
  trace: (s, m, d) => L._fmt('TRACE', s, m, d),
};

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER NAME CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER = {
  GOOGLE:     'google',
  APPLE:      'apple',
  YANDEX:     'yandex',
  WAZE:       'waze',
  GEOAPIFY:   'geoapify',
  OPENSTREET: 'openstreet',
  LOCAL:      'local',
};

const DEEP_LINK_PROVIDERS = new Set([PROVIDER.WAZE, PROVIDER.APPLE]);
const INLINE_PROVIDERS    = new Set([PROVIDER.OPENSTREET, PROVIDER.LOCAL]);

L.info('MODULE', 'PROVIDER constants loaded', {
  allProviders:      Object.values(PROVIDER),
  deepLinkProviders: [...DEEP_LINK_PROVIDERS],
  inlineProviders:   [...INLINE_PROVIDERS],
});

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SERVICE → API METHOD MAP PER PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SERVICE_APIS = {
  [PROVIDER.GOOGLE]: {
    routing:      'routeApi',
    distance:     'routeApi',
    eta:          'routeApi',
    autoComplete: 'placesApi',
    location:     'geocoding',
  },
  [PROVIDER.APPLE]: {
    routing:      'deeplink',
    distance:     'mapkit',
    eta:          null,
    autoComplete: 'search',
    location:     'geocoder',
  },
  [PROVIDER.YANDEX]: {
    routing:      'routeApi',
    distance:     'routeApi',
    eta:          'routeApi',
    autoComplete: 'suggest',
    location:     'geocoder',
  },
  [PROVIDER.GEOAPIFY]: {
    routing:      'routingApi',
    distance:     'routingApi',
    eta:          'routingApi',
    autoComplete: 'placesApi',
    location:     'geocodingApi',
  },
  [PROVIDER.WAZE]: {
    routing:      'deeplink',
    distance:     null,
    eta:          null,
    autoComplete: null,
    location:     null,
  },
  [PROVIDER.OPENSTREET]: {
    routing:      'osrm',
    distance:     'osrm',
    eta:          'osrm',
    autoComplete: 'nominatim',
    location:     'nominatim',
  },
  [PROVIDER.LOCAL]: {
    routing:      'localOsrm',
    distance:     'localOsrm',
    eta:          'localOsrm',
    autoComplete: 'nominatim',
    location:     'nominatim',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PARSE mapsProviders ARRAY FROM STRAPI
// ─────────────────────────────────────────────────────────────────────────────

function parseMapsProviders(rawList) {
  L.info('parseMapsProviders', 'called', { rawList });

  const providerNames   = [];
  const perProviderApis = {};
  const seen            = new Set();

  if (!Array.isArray(rawList)) {
    L.error('parseMapsProviders', 'rawList is NOT an array — nothing will load', { type: typeof rawList, value: rawList });
    return { providerNames, perProviderApis };
  }
  if (rawList.length === 0) {
    L.warn('parseMapsProviders', 'rawList is EMPTY — no providers will be parsed from it');
    return { providerNames, perProviderApis };
  }

  const isNewFormat = typeof rawList[0] === 'object' && rawList[0] !== null && 'name' in rawList[0];
  L.info('parseMapsProviders', `format detected: ${isNewFormat ? 'NEW {name,config}' : 'LEGACY string[]'}`);

  if (isNewFormat) {
    for (const entry of rawList) {
      if (!entry || typeof entry !== 'object') {
        L.warn('parseMapsProviders', 'skipping invalid entry', entry);
        continue;
      }
      const name   = (entry.name || '').trim();
      const config = (entry.config && typeof entry.config === 'object') ? entry.config : {};
      if (!name) { L.warn('parseMapsProviders', 'entry has no name, skipping', entry); continue; }
      if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
      if (Object.keys(config).length > 0) {
        perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
        L.info('parseMapsProviders', `"${name}" config override`, config);
      } else {
        L.info('parseMapsProviders', `"${name}" no config override — defaults apply`);
      }
    }
  } else {
    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      if (typeof item !== 'string') continue;
      const name = item.replace(/:$/, '').trim();
      if (!name) continue;
      const next   = rawList[i + 1];
      const config = (next !== null && typeof next === 'object' && !Array.isArray(next)) ? next : {};
      if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
      if (Object.keys(config).length > 0) {
        perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
        L.info('parseMapsProviders', `legacy: "${name}" config`, config);
      }
    }
  }

  L.ok('parseMapsProviders', 'done', { providerNames, perProviderApis });
  return { providerNames, perProviderApis };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTA
// ─────────────────────────────────────────────────────────────────────────────

const QUOTA_DEFAULTS = {
  maxMonthlyRequests:          20_000,
  maxDailyGeocoderApiRequests:  1_000,
  maxDailyJSApiRequests:       20_000,
};

function dailyBucketKey(apiType) {
  return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
}

function buildFreshProviderData() {
  return {
    maxDailyGeocoderApiRequests: QUOTA_DEFAULTS.maxDailyGeocoderApiRequests,
    maxDailyJSApiRequests:       QUOTA_DEFAULTS.maxDailyJSApiRequests,
    requestCounts: {},
    dailyCounts:   {},
  };
}

function computeBudget(record) {
  const pd       = record?.providerData || {};
  const monthKey = getMonthKey();
  const dayKey   = getDayKey();

  const monthData   = pd.requestCounts?.[monthKey] || {};
  const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
  const monthlyMax  = record?.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests;

  const dayData     = pd.dailyCounts?.[dayKey] || {};
  const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || QUOTA_DEFAULTS.maxDailyGeocoderApiRequests;
  const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || QUOTA_DEFAULTS.maxDailyJSApiRequests;

  const budget = {
    monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
    dailyGeoRemaining: Math.max(0, maxDailyGeo - (Number(dayData.geo) || 0)),
    dailyJSRemaining:  Math.max(0, maxDailyJS  - (Number(dayData.js)  || 0)),
    monthlyMax, maxDailyGeo, maxDailyJS,
  };

  if (record?.providerName) {
    L.trace('computeBudget', `"${record.providerName}"`, {
      monthKey, dayKey, monthlyUsed, monthlyMax,
      geoToday: Number(dayData.geo) || 0, maxDailyGeo,
      jsToday:  Number(dayData.js)  || 0, maxDailyJS,
      budget,
    });
  }
  return budget;
}

function hasQuota(record, apiType) {
  const name = record?.providerName;
  if (INLINE_PROVIDERS.has(name))    { L.trace('hasQuota', `"${name}" INLINE → true`);    return true; }
  if (DEEP_LINK_PROVIDERS.has(name)) { L.trace('hasQuota', `"${name}" DEEP_LINK → true`); return true; }

  const b         = computeBudget(record);
  const monthlyOk = b.monthlyRemaining > 0;
  const jsOk      = dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0;
  const geoOk     = dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0;
  const result    = monthlyOk && jsOk && geoOk;

  L.trace('hasQuota', `"${name}" apiType:${apiType} → ${result}`, {
    monthlyOk, monthlyRemaining: b.monthlyRemaining,
    jsOk,      dailyJSRemaining: b.dailyJSRemaining,
    geoOk,     dailyGeoRemaining: b.dailyGeoRemaining,
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER INSTANCE FACTORY
// ─────────────────────────────────────────────────────────────────────────────

function createProviderInstance(name) {
  L.info('createProviderInstance', `"${name}"`);
  switch (name) {
    case PROVIDER.WAZE: {
      const inst = new WazeMapsProvider();
      L.ok('createProviderInstance', '"waze" deep-link instance created');
      return inst;
    }
    case PROVIDER.APPLE: {
      const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';
      L.info('createProviderInstance', '"apple"', { tokenPresent: !!token });
      if (!token) L.warn('createProviderInstance', '"apple" NO TOKEN — NEXT_PUBLIC_APPLE_MAPS_TOKEN not set');
      return new AppleMapsProvider(token);
    }
    case PROVIDER.GOOGLE: {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      L.info('createProviderInstance', '"google"', {
        keyPresent: !!key,
        keyPrefix:  key ? key.slice(0, 8) + '...' : 'MISSING',
        envVar:     'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      });
      if (!key) {
        L.error('createProviderInstance',
          '"google" — NO API KEY. ' +
          'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set or the dev server was not restarted after adding it. ' +
          'Every single Google call will return null until this is fixed.'
        );
      } else {
        L.ok('createProviderInstance', '"google" — API key found, instance will be created');
      }
      return new GoogleMapsProvider(key);
    }
    case PROVIDER.YANDEX: {
      const key = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
      L.info('createProviderInstance', '"yandex"', { keyPresent: !!key });
      if (!key) L.warn('createProviderInstance', '"yandex" NO KEY — NEXT_PUBLIC_YANDEX_MAPS_API_KEY not set');
      return new YandexMapsProvider(key);
    }
    case PROVIDER.GEOAPIFY: {
      const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
      L.info('createProviderInstance', '"geoapify"', { keyPresent: !!key });
      if (!key) L.warn('createProviderInstance', '"geoapify" NO KEY — NEXT_PUBLIC_GEOAPIFY_API_KEY not set');
      return new GeoapifyProvider(key);
    }
    case PROVIDER.OPENSTREET:
    case PROVIDER.LOCAL:
      L.info('createProviderInstance', `"${name}" is inline — no instance, returns null`);
      return null;
    default:
      L.warn('createProviderInstance', `unknown provider name "${name}" — returns null`);
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOMINATIM
// ─────────────────────────────────────────────────────────────────────────────

async function nominatimSearch(query, countryCode = null) {
  L.info('nominatimSearch', 'called', { query, countryCode });
  try {
    const params = new URLSearchParams({ q: query, format: 'json', limit: '7', addressdetails: '1' });
    if (countryCode) params.set('countrycodes', countryCode);
    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    L.trace('nominatimSearch', 'GET', { url });
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    L.info('nominatimSearch', `HTTP ${res.status}`);
    if (!res.ok) { L.warn('nominatimSearch', `bad status ${res.status}`); return []; }
    const data = await res.json();
    L.ok('nominatimSearch', `${data.length} results`);
    return data.map((item) => ({
      place_id:       item.place_id?.toString(),
      main_text:      item.name || item.display_name?.split(',')[0],
      secondary_text: item.display_name,
      lat:            parseFloat(item.lat),
      lng:            parseFloat(item.lon),
      address:        item.display_name,
      name:           item.name || item.display_name?.split(',')[0],
    }));
  } catch (err) {
    L.error('nominatimSearch', 'threw', { message: err?.message });
    return [];
  }
}

async function nominatimReverse(lat, lng) {
  L.info('nominatimReverse', 'called', { lat, lng });
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    L.info('nominatimReverse', `HTTP ${res.status}`);
    if (!res.ok) { L.warn('nominatimReverse', `bad status ${res.status}`); return null; }
    const data   = await res.json();
    const result = {
      lat, lng,
      address:  data.display_name,
      name:     data.name || data.display_name?.split(',')[0],
      place_id: `nominatim_${data.place_id}`,
    };
    L.ok('nominatimReverse', 'result', result);
    return result;
  } catch (err) {
    L.error('nominatimReverse', 'threw', { message: err?.message });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC OSRM
// ─────────────────────────────────────────────────────────────────────────────

async function osrmRoute(origin, destination) {
  L.info('osrmRoute', 'called', { origin, destination });
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=geojson`;
    L.trace('osrmRoute', 'GET', { url });
    const res   = await fetch(url, { signal: AbortSignal.timeout(8000) });
    L.info('osrmRoute', `HTTP ${res.status}`);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data  = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('No OSRM route in response');
    const km  = route.distance / 1000;
    const min = route.duration / 60;
    const result = {
      type:          'osrm',
      distance:      km  >= 1 ? `${km.toFixed(1)} km`        : `${Math.round(km * 1000)} m`,
      duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
      distanceValue: route.distance,
      durationValue: route.duration,
      geometry:      route.geometry?.coordinates || [],
      steps:         [],
    };
    L.ok('osrmRoute', `${result.distance} / ${result.duration} | ${result.geometry.length} pts`);
    return result;
  } catch (err) {
    L.error('osrmRoute', 'failed', { message: err?.message });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IP GEOLOCATION
// ─────────────────────────────────────────────────────────────────────────────

async function getIPLocation(localServerUrl) {
  L.info('getIPLocation', 'called', { localServerUrl: localServerUrl || '(none)' });
  if (localServerUrl) {
    try {
      const res = await fetch(`${localServerUrl}/ip-location`);
      L.info('getIPLocation', `local server HTTP ${res.status}`);
      if (res.ok) {
        const d = await res.json();
        if (d.latitude && d.longitude) {
          L.ok('getIPLocation', 'local server', { lat: d.latitude, lng: d.longitude });
          return { lat: d.latitude, lng: d.longitude, source: 'local' };
        }
        L.warn('getIPLocation', 'local server response has no lat/lng', d);
      }
    } catch (err) { L.warn('getIPLocation', 'local server threw', { message: err?.message }); }
  }
  try {
    const res = await fetch('https://ipapi.co/json/');
    L.info('getIPLocation', `ipapi.co HTTP ${res.status}`);
    if (res.ok) {
      const d = await res.json();
      if (d.latitude && d.longitude) {
        L.ok('getIPLocation', 'ipapi.co', { lat: d.latitude, lng: d.longitude });
        return { lat: d.latitude, lng: d.longitude, source: 'ipapi' };
      }
      L.warn('getIPLocation', 'ipapi.co no lat/lng', d);
    }
  } catch (err) { L.warn('getIPLocation', 'ipapi.co threw', { message: err?.message }); }
  L.warn('getIPLocation', 'all sources failed — Lusaka hardcoded default');
  return { lat: -15.4167, lng: 28.2833, source: 'default' };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPSPROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function MapsProvider({ children }) {
  L.info('MapsProvider', 'component rendering');

  const [priorityList,        setPriorityList]        = useState([]);
  const [providers,           setProviders]           = useState({});
  const [allExhausted,        setAllExhausted]        = useState(false);
  const [ready,               setReady]               = useState(false);

  const [prioritizedMap,      setPrioritizedMap]      = useState(PROVIDER.OPENSTREET);
  const [prioritizedRoute,    setPrioritizedRoute]    = useState(null);
  const [prioritizedDistance, setPrioritizedDistance] = useState(null);
  const [prioritizedEta,      setPrioritizedEta]      = useState(null);

  const [serviceApis, setServiceApis] = useState(DEFAULT_SERVICE_APIS);

  const apiUrl      = process.env.NEXT_PUBLIC_API_URL                       || '';
  const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

  L.info('MapsProvider', 'env snapshot', {
    NEXT_PUBLIC_API_URL:                       apiUrl      || 'NOT SET',
    NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL: localMapUrl || '(not set)',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:           process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.slice(0, 8) + '...'
      : 'NOT SET',
    NEXT_PUBLIC_GEOAPIFY_API_KEY:              process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY  ? '(set)' : '(not set)',
    NEXT_PUBLIC_YANDEX_MAPS_API_KEY:           process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ? '(set)' : '(not set)',
    NEXT_PUBLIC_APPLE_MAPS_TOKEN:              process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN  ? '(set)' : '(not set)',
  });

  const providersRef = useRef(providers);
  useEffect(() => {
    providersRef.current = providers;
    L.trace('MapsProvider', 'providersRef synced', { keys: Object.keys(providers) });
  }, [providers]);

  const getToken = useCallback(() => {
    try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
    catch { return null; }
  }, []);

  function authHeaders() {
    const token = getToken();
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }

  const initFailures = useRef({});
  const logFailures  = useRef({});

  async function initProviderData(record) {
    const name = record.providerName;
    L.info('initProviderData', `"${name}"`, {
      id: record.id, providerDataKeys: Object.keys(record.providerData || {}),
    });

    if (record.id == null) {
      L.warn('initProviderData', `"${name}" no Strapi id — using local fresh data, quota NOT persisted`);
      return { ...record, providerData: buildFreshProviderData() };
    }

    const pd = record.providerData;
    if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) {
      L.info('initProviderData', `"${name}" providerData already populated — skipping PUT`);
      return record;
    }

    const failKey   = name;
    const failCount = initFailures.current[failKey] || 0;
    L.info('initProviderData', `"${name}" providerData empty — will PUT fresh data`, { failCount });

    if (failCount >= 5) {
      L.warn('initProviderData', `"${name}" too many PUT failures (${failCount}) — local fresh data only`);
      return { ...record, providerData: buildFreshProviderData() };
    }

    const freshData = buildFreshProviderData();
    const putUrl    = `${apiUrl}/api-providers/${record.id}`;
    L.info('initProviderData', `"${name}" PUT`, { url: putUrl });
    try {
      const res = await fetch(putUrl, {
        method: 'PUT', headers: authHeaders(),
        body:   JSON.stringify({ data: { providerData: freshData } }),
      });
      L.info('initProviderData', `"${name}" PUT response: ${res.status}`);
      if (!res.ok) {
        if (res.status === 404) {
          L.error('initProviderData', `"${name}" 404 — record not found. Is the Strapi id correct?`);
          return { ...record, providerData: buildFreshProviderData() };
        }
        L.warn('initProviderData', `"${name}" PUT failed HTTP ${res.status}`);
        initFailures.current[failKey] = failCount + 1;
      } else {
        initFailures.current[failKey] = 0;
        L.ok('initProviderData', `"${name}" fresh providerData written to Strapi`);
      }
    } catch (err) {
      L.error('initProviderData', `"${name}" PUT threw`, { message: err?.message });
      initFailures.current[failKey] = failCount + 1;
    }
    return { ...record, providerData: freshData };
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    L.info('load()', 'useEffect fired', { apiUrl: apiUrl || 'EMPTY — will early-return' });

    async function load() {
      if (!apiUrl) {
        L.warn('load()', 'NEXT_PUBLIC_API_URL is empty — skipping all Strapi fetches, setting ready immediately');
        setReady(true);
        return;
      }

      try {

        // ── Step 1: fetch priority map ──────────────────────────────────────
        const pmUrl = `${apiUrl}/api-providers-priority-map?populate=*`;
        L.info('load()', 'Step 1: fetching priority map', { url: pmUrl });
        const pmRes = await fetch(pmUrl, { headers: authHeaders() });
        L.info('load()', `Step 1: HTTP ${pmRes.status}`);

        if (!pmRes.ok) {
          L.error('load()', `Step 1: FAILED HTTP ${pmRes.status} — cannot determine priorities, aborting load`);
          setReady(true);
          return;
        }

        const pmJson = await pmRes.json();
        L.info('load()', 'Step 1: raw response JSON', pmJson);

        const pmRaw = pmJson?.data ?? {};
        const attrs = pmRaw.attributes ?? pmRaw;
        
        L.info('load()', 'Step 1: attrs', {
          prioritizedMap:              attrs.prioritizedMap,
          priotizedRouteDrawer:        attrs.priotizedRouteDrawer,
          priotizedDistanceCalculator: attrs.priotizedDistanceCalculator,
          priotizedEtaCalculator:      attrs.priotizedEtaCalculator,
          mapsProviders:               attrs.mapsProviders,
        });

        const pMap      = attrs.prioritizedMap              ?? PROVIDER.OPENSTREET;
        const pRoute    = attrs.priotizedRouteDrawer        ?? null;
        const pDistance = attrs.priotizedDistanceCalculator ?? null;
        const pEta      = attrs.priotizedEtaCalculator      ?? null;

        L.info('load()', 'Step 1: resolved priorities', { pMap, pRoute, pDistance, pEta });
        if (!pRoute)    L.warn('load()', 'priotizedRouteDrawer is null/unset in Strapi');
        if (!pDistance) L.warn('load()', 'priotizedDistanceCalculator is null/unset in Strapi');
        if (!pEta)      L.warn('load()', 'priotizedEtaCalculator is null/unset in Strapi');

        setPrioritizedMap(pMap);
        setPrioritizedRoute(pRoute);
        setPrioritizedDistance(pDistance);
        setPrioritizedEta(pEta);

        // ── Step 2: parse mapsProviders ─────────────────────────────────────
        L.info('load()', 'Step 2: parsing mapsProviders', { raw: attrs.mapsProviders });
        const rawList = attrs.mapsProviders ?? [];
        if (!rawList || rawList.length === 0) {
          L.error('load()', 'Step 2: mapsProviders is empty/missing in Strapi. No provider instances will be created.');
        }
        const { providerNames: list, perProviderApis } = parseMapsProviders(rawList);
        L.info('load()', 'Step 2: parsed', { list, perProviderApis });

        // ── Step 3: auto-include any prioritized service providers missing from list ──
        L.info('load()', 'Step 3: ensuring prioritized service providers are in the list');
        const serviceProviders = [pRoute, pDistance, pEta].filter(Boolean);
        L.info('load()', 'Step 3: service providers from Strapi priority fields', serviceProviders);
        for (const name of serviceProviders) {
          if (!list.includes(name)) {
            list.push(name);
            L.warn('load()',
              `Step 3: "${name}" is a prioritized provider but was MISSING from mapsProviders — auto-added. ` +
              `Add it to the mapsProviders JSON in Strapi to silence this warning.`
            );
          } else {
            L.ok('load()', `Step 3: "${name}" already present in mapsProviders`);
          }
        }
        L.info('load()', 'Step 3: final list after guard', list);

        if (list.length === 0) {
          L.error('load()', 'Step 3: list is empty after guard — no providers can be loaded. setReady and return.');
          setReady(true);
          return;
        }

        // ── Step 4: merge service API overrides ─────────────────────────────
        L.info('load()', 'Step 4: merging service API overrides');
        setServiceApis(() => {
          const merged = { ...DEFAULT_SERVICE_APIS };
          for (const [provName, apis] of Object.entries(perProviderApis)) {
            merged[provName] = { ...(DEFAULT_SERVICE_APIS[provName] || {}), ...apis };
            L.info('load()', `Step 4: "${provName}" merged service APIs`, merged[provName]);
          }
          return merged;
        });

        setPriorityList(list);

        // ── Step 5: fetch Strapi records ────────────────────────────────────
        const queryableNames = list.filter((n) => !INLINE_PROVIDERS.has(n));
        L.info('load()', 'Step 5: queryable (non-inline) providers', queryableNames);

        const providerMap = {};

        if (queryableNames.length > 0) {
          const filterParams = queryableNames
            .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
            .join('&');
          const provUrl = `${apiUrl}/api-providers?${filterParams}&populate=*`;
          L.info('load()', 'Step 5: fetching provider records', { url: provUrl });

          const provRes  = await fetch(provUrl, { headers: authHeaders() });
          const provJson = await provRes.json();
          const records  = provJson?.data ?? [];

          L.info('load()', `Step 5: ${records.length} records returned (expected ${queryableNames.length})`, {
            returnedNames: records.map(r => (r.attributes ?? r).providerName),
            expectedNames: queryableNames,
          });

          if (records.length === 0) {
            L.error('load()',
              'Step 5: ZERO records returned from Strapi api-providers. ' +
              'Each provider in mapsProviders must have a matching row with the exact providerName. ' +
              'Providers will be synthesised with default quota — but if the API key is present they will still work.'
            );
          } else {
            const returnedNames = records.map(r => (r.attributes ?? r).providerName);
            const missing       = queryableNames.filter(n => !returnedNames.includes(n));
            if (missing.length > 0) {
              L.warn('load()', `Step 5: ${missing.length} provider(s) have no Strapi record`, { missing });
            }
          }

          for (const item of records) {
            const flat = item.attributes ?? item;
            const name = flat.providerName;
            if (!name) { L.warn('load()', 'Step 5: record has no providerName — skipping', item); continue; }

            L.info('load()', `Step 5: processing record for "${name}"`, {
              id: item.id, maxMonthly: flat.maxMonthlyRequests,
              providerDataKeys: Object.keys(flat.providerData || {}),
            });

            const record = {
              id:                 item.id,
              providerName:       name,
              providerData:       flat.providerData       ?? {},
              maxMonthlyRequests: flat.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests,
            };

            if (!DEEP_LINK_PROVIDERS.has(name)) {
              L.info('load()', `Step 5: scheduling initProviderData for "${name}"`);
              initProviderData(record).then((updated) => {
                L.info('load()', `Step 5: initProviderData resolved for "${name}"`, {
                  updatedDataKeys: Object.keys(updated.providerData),
                });
                setProviders((prev) => {
                  if (!prev[name]) {
                    L.warn('load()', `Step 5: initProviderData resolved but "${name}" no longer in state`);
                    return prev;
                  }
                  return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
                });
              }).catch((err) => {
                L.error('load()', `Step 5: initProviderData threw for "${name}"`, { message: err?.message });
              });
            }

            const instance = createProviderInstance(name);
            L.info('load()', `Step 5: instance for "${name}"`, {
              created:     !!instance,
              hasGetRoute: !!(instance?.getRoute),
              hasSearch:   !!(instance?.searchPlaces),
            });

            if (!instance && !INLINE_PROVIDERS.has(name) && !DEEP_LINK_PROVIDERS.has(name)) {
              L.error('load()',
                `Step 5: "${name}" has a Strapi record but createProviderInstance returned null. ` +
                `This almost always means the API key env var is missing or empty.`
              );
            }

            providerMap[name] = { record, instance, budget: computeBudget(record) };
          }

          for (const name of queryableNames) {
            if (!providerMap[name]) {
              L.warn('load()', `Step 5: "${name}" was expected but had no Strapi record — will synthesise`);
            }
          }
        }

        // ── Step 6: synthesise missing entries ──────────────────────────────
        L.info('load()', 'Step 6: synthesising providers without Strapi records');
        for (const name of list) {
          if (providerMap[name]) { L.trace('load()', `Step 6: "${name}" already present — skip`); continue; }
          const defaultRecord = {
            id: null, providerName: name,
            providerData: buildFreshProviderData(),
            maxMonthlyRequests: QUOTA_DEFAULTS.maxMonthlyRequests,
          };
          const instance = createProviderInstance(name);
          providerMap[name] = { record: defaultRecord, instance, budget: computeBudget(defaultRecord) };
          L.warn('load()', `Step 6: "${name}" synthesised (no Strapi record)`, {
            instance: !!instance, isInline: INLINE_PROVIDERS.has(name), isDeepLink: DEEP_LINK_PROVIDERS.has(name),
          });
        }

        // ── Step 7: commit + final summary ──────────────────────────────────
        L.info('load()', 'Step 7: committing providers state');
        setProviders(providerMap);

        console.log('\n[MapsProvider] ════════════════ FINAL PROVIDER MAP ════════════════');
        for (const [n, p] of Object.entries(providerMap)) {
          const isInline   = INLINE_PROVIDERS.has(n);
          const isDeepLink = DEEP_LINK_PROVIDERS.has(n);
          const usable     = !!p.instance || isInline;
          const icon       = usable ? '✅' : '❌';
          console.log(
            `[MapsProvider] ${icon} "${n}"` +
            ` | instance:${!!p.instance}` +
            ` | inline:${isInline} | deepLink:${isDeepLink}` +
            ` | strapiId:${p.record?.id ?? 'none (synthesised)'}` +
            ` | monthlyRemaining:${p.budget?.monthlyRemaining}` +
            ` | geoRemaining:${p.budget?.dailyGeoRemaining}` +
            ` | jsRemaining:${p.budget?.dailyJSRemaining}`
          );
          if (!usable) {
            console.log(`[MapsProvider]    ⚠️  "${n}" NOT usable — check API key env var and Strapi record`);
          }
        }

        console.log('\n[MapsProvider] ════════════ PRIORITIZED PROVIDER CHECK ════════════');
        for (const [label, name] of [['map', pMap], ['route', pRoute], ['distance', pDistance], ['eta', pEta]]) {
          if (!name) { console.log(`[MapsProvider]  ${label}: (not set in Strapi)`); continue; }
          const p      = providerMap[name];
          const usable = p && (!!p.instance || INLINE_PROVIDERS.has(name));
          const quota  = p ? hasQuota(p.record, 'GeocoderHTTPAPI') : false;
          const icon   = (usable && quota) ? '✅' : '❌';
          console.log(
            `[MapsProvider] ${icon} ${label}: "${name}"` +
            ` | inMap:${!!p} | hasInstance:${!!(p?.instance)} | isInline:${INLINE_PROVIDERS.has(name)} | hasQuota:${quota}`
          );
          if (!p)        console.log(`[MapsProvider]    ⚠️  "${name}" NOT in providerMap — it was never loaded. Check mapsProviders in Strapi.`);
          else if (!usable) console.log(`[MapsProvider]    ⚠️  "${name}" in map but NO instance — likely missing API key.`);
          else if (!quota)  console.log(`[MapsProvider]    ⚠️  "${name}" usable but quota exhausted.`);
        }
        console.log('[MapsProvider] ═══════════════════════════════════════════════════════\n');

        const anyUsable = list.some((n) => providerMap[n]?.instance != null || INLINE_PROVIDERS.has(n));
        L.info('load()', `Step 7: anyUsable:${anyUsable} → allExhausted:${!anyUsable}`);
        setAllExhausted(!anyUsable);

      } catch (err) {
        L.error('load()', 'UNHANDLED ERROR', { message: err?.message, stack: err?.stack?.slice(0, 500) });
        setAllExhausted(true);
      } finally {
        L.info('load()', 'setting ready = true');
        setReady(true);
      }
    }

    load();
  }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── logRequest ────────────────────────────────────────────────────────────

  const logRequest = useCallback((providerName, apiType) => {
    L.trace('logRequest', `"${providerName}" used ${apiType}`);
    const p = providersRef.current[providerName];
    if (!p) { L.warn('logRequest', `"${providerName}" not in providersRef`); return; }
    if (p.record.id == null) { L.trace('logRequest', `"${providerName}" synthesised — skipping remote log`); return; }

    const failKey   = `${providerName}:${p.record.id}`;
    const failCount = logFailures.current[failKey] || 0;
    if (failCount >= 3) { L.warn('logRequest', `"${providerName}" suppressed — too many PUT failures`); return; }

    const monthKey = getMonthKey();
    const dayKey   = getDayKey();
    const bucket   = dailyBucketKey(apiType);

    const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
    const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
    const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

    monthData[apiType] = (Number(monthData[apiType]) || 0) + 1;
    dayData[bucket]    = (Number(dayData[bucket])    || 0) + 1;

    const updatedProviderData = {
      ...existing,
      requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
      dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
    };

    L.trace('logRequest', `"${providerName}" updated counts`, {
      bucket, dayTotal: dayData[bucket], monthTotal: monthData[apiType],
    });

    fetch(`${apiUrl}/api-providers/${p.record.id}`, {
      method: 'PUT', headers: authHeaders(),
      body:   JSON.stringify({ data: { providerData: updatedProviderData } }),
    })
      .then((res) => {
        if (!res.ok) {
          logFailures.current[failKey] = failCount + 1;
          L.warn('logRequest', `"${providerName}" PUT failed HTTP ${res.status}`, {
            hint: res.status === 404
              ? 'Grant "update" on api-providers in Strapi → Settings → Roles'
              : `HTTP ${res.status}`,
          });
        } else {
          logFailures.current[failKey] = 0;
          L.trace('logRequest', `"${providerName}" PUT OK`);
        }
      })
      .catch((err) => {
        logFailures.current[failKey] = failCount + 1;
        L.error('logRequest', `"${providerName}" PUT threw`, { message: err?.message });
      });

    setProviders((prev) => {
      const cur = prev[providerName];
      if (!cur) return prev;
      const updatedRecord = { ...cur.record, providerData: updatedProviderData };
      return { ...prev, [providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) } };
    });
  }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // PROVIDER RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────

  const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
    const apiType      = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';
    const providerKeys = Object.keys(providers);

    L.trace('resolveServiceProvider', 'called', {
      explicitName, serviceType, apiType,
      providersInState: providerKeys,
      priorityList, failedSet: [...failedSet],
    });

    if (providerKeys.length === 0) {
      L.error('resolveServiceProvider',
        'providers state is EMPTY. load() has not completed yet, or setProviders was never called. ' +
        'If this keeps appearing after startup, there is a state management bug.'
      );
    }

    const isUsable = (name) => {
      if (failedSet.has(name)) {
        L.trace('resolveServiceProvider', `isUsable("${name}") → false (in failedSet)`);
        return false;
      }
      if (INLINE_PROVIDERS.has(name)) {
        L.trace('resolveServiceProvider', `isUsable("${name}") → true (INLINE)`);
        return true;
      }
      if (DEEP_LINK_PROVIDERS.has(name)) {
        const ok = !!providers[name]?.instance;
        L.trace('resolveServiceProvider', `isUsable("${name}") → ${ok} (DEEP_LINK)`);
        return ok;
      }
      const p = providers[name];
      if (!p) {
        L.warn('resolveServiceProvider',
          `isUsable("${name}") → false — NOT in providers state. ` +
          `State has: [${providerKeys.join(',')}]. ` +
          `"${name}" was never loaded. Add it to mapsProviders in Strapi.`
        );
        return false;
      }
      if (!p.instance) {
        L.warn('resolveServiceProvider',
          `isUsable("${name}") → false — in state but instance is null. ` +
          `This almost always means the API key env var is missing or empty. ` +
          `Check NEXT_PUBLIC_${name.toUpperCase()}_MAPS_API_KEY (or equivalent).`
        );
        return false;
      }
      const quotaOk = hasQuota(p.record, apiType);
      L.trace('resolveServiceProvider', `isUsable("${name}") → ${quotaOk} (instance OK, quotaOk:${quotaOk})`);
      return quotaOk;
    };

    const toEntry = (name) => ({
      name,
      instance:  providers[name]?.instance ?? null,
      record:    providers[name]?.record   ?? null,
      apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
    });

    if (explicitName) {
      L.trace('resolveServiceProvider', `checking explicit "${explicitName}" for ${serviceType}`);
      if (isUsable(explicitName)) {
        const entry = toEntry(explicitName);
        L.ok('resolveServiceProvider', `EXPLICIT "${explicitName}" → ${serviceType}`, { apiMethod: entry.apiMethod });
        return entry;
      }
      L.warn('resolveServiceProvider',
        `explicit "${explicitName}" NOT usable for ${serviceType} — falling through to priority list`
      );
    }

    L.trace('resolveServiceProvider', `walking priorityList for ${serviceType}`, { priorityList });
    for (const name of priorityList) {
      if (name === explicitName) {
        L.trace('resolveServiceProvider', `skipping "${name}" (same as failed explicit)`);
        continue;
      }
      if (name === PROVIDER.LOCAL && failedSet.has(PROVIDER.LOCAL)) {
        L.trace('resolveServiceProvider', '"local" failed — trying openstreet substitute');
        if (isUsable(PROVIDER.OPENSTREET)) {
          L.ok('resolveServiceProvider', 'local→openstreet substitution');
          return toEntry(PROVIDER.OPENSTREET);
        }
        L.warn('resolveServiceProvider', 'local failed AND openstreet not usable');
        continue;
      }
      if (isUsable(name)) {
        const entry = toEntry(name);
        L.ok('resolveServiceProvider', `FALLBACK "${name}" → ${serviceType}`, { apiMethod: entry.apiMethod });
        return entry;
      }
    }

    L.fail('resolveServiceProvider', `NO provider found for ${serviceType}`, {
      tried: [...failedSet, explicitName].filter(Boolean),
      priorityList, providersInState: providerKeys,
    });
    return null;
  }, [priorityList, providers, serviceApis]);

  // ── Local OSRM helper ─────────────────────────────────────────────────────

  const fetchLocalRoute = useCallback(async (origin, destination) => {
    L.info('fetchLocalRoute', 'called', { origin, destination, localMapUrl: localMapUrl || 'NOT SET' });
    if (!localMapUrl) throw new Error('NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL is not configured');
    const url = `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
    L.trace('fetchLocalRoute', 'GET', { url });
    const res = await fetch(url);
    L.info('fetchLocalRoute', `HTTP ${res.status}`);
    if (!res.ok) throw new Error(`Local route API ${res.status}`);
    const data = await res.json();
    L.ok('fetchLocalRoute', 'result', { distance: data.distance, duration: data.duration });
    return {
      type:          'local',
      distance:      data.distance,
      duration:      data.duration,
      distanceValue: data.distanceValue,
      durationValue: data.durationValue,
      geometry:      data.geometry ?? [],
      steps:         data.steps   ?? [],
    };
  }, [localMapUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // GENERIC SERVICE RUNNER
  // ─────────────────────────────────────────────────────────────────────────

  const runWithFallback = useCallback(async ({
    serviceType, explicitProvider, handler, finalFallback = async () => null,
  }) => {
    const failed      = new Set();
    const maxAttempts = priorityList.length + 2;

    L.info('runWithFallback', `START "${serviceType}"`, { explicitProvider, maxAttempts, priorityList });

    for (let i = 0; i < maxAttempts; i++) {
      const resolvedExplicit = failed.has(explicitProvider) ? null : explicitProvider;
      L.trace('runWithFallback', `attempt ${i + 1}/${maxAttempts}`, {
        resolvedExplicit, failed: [...failed],
      });

      const p = resolveServiceProvider(resolvedExplicit, serviceType, failed);
      if (!p) {
        L.warn('runWithFallback', `attempt ${i + 1}: resolve returned null — no more providers`);
        break;
      }

      L.info('runWithFallback', `attempt ${i + 1}: trying "${p.name}"`, {
        apiMethod: p.apiMethod, hasInstance: !!p.instance,
      });

      try {
        const result = await handler(p);
        if (result != null) {
          L.ok('runWithFallback', `attempt ${i + 1}: "${p.name}" SUCCESS for ${serviceType}`);
          return result;
        }
        L.warn('runWithFallback', `attempt ${i + 1}: "${p.name}" returned null — marking failed`);
        failed.add(p.name);
      } catch (err) {
        L.error('runWithFallback', `attempt ${i + 1}: "${p.name}" threw`, { message: err?.message });
        failed.add(p.name);
      }
    }

    L.warn('runWithFallback', `all attempts exhausted for "${serviceType}" — finalFallback`);
    return finalFallback();
  }, [priorityList, resolveServiceProvider]);

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  const searchPlaces = useCallback(async (query, countryCode = null) => {
    L.info('searchPlaces', 'called', { query, countryCode });
    if (!query || query.length < 2) { L.trace('searchPlaces', 'query too short'); return []; }
    return runWithFallback({
      serviceType: 'autoComplete', explicitProvider: null,
      handler: async (p) => {
        L.info('searchPlaces', `handler "${p.name}"`, { apiMethod: p.apiMethod });
        if (DEEP_LINK_PROVIDERS.has(p.name) && !p.apiMethod) {
          L.warn('searchPlaces', `"${p.name}" deep-link with no autoComplete — skip`); return null;
        }
        if (INLINE_PROVIDERS.has(p.name)) {
          L.info('searchPlaces', `"${p.name}" inline — Nominatim`);
          const r = await nominatimSearch(query, countryCode);
          L.info('searchPlaces', `Nominatim ${r.length} results`);
          return r.length ? r : null;
        }
        if (!p.instance?.searchPlaces) {
          L.warn('searchPlaces', `"${p.name}" no searchPlaces method`); return null;
        }
        if (typeof window !== 'undefined' && window.__googleMapsViewport) {
          const vp = window.__googleMapsViewport;
          L.info('searchPlaces', `injecting viewport into "${p.name}"`, vp);
          if (p.instance.setViewport) p.instance.setViewport(vp.lat, vp.lng, vp.radiusM, vp.regionCode || countryCode);
          else if (p.instance.setCenter) p.instance.setCenter(vp.lat, vp.lng);
        }
        L.info('searchPlaces', `calling instance.searchPlaces on "${p.name}"`);
        const results = await p.instance.searchPlaces(query, countryCode, p.apiMethod);
        L.info('searchPlaces', `"${p.name}" returned ${results?.length ?? 0} results`);
        if (results?.length) { logRequest(p.name, 'JavaScriptAPI'); return results; }
        L.warn('searchPlaces', `"${p.name}" no results`); return null;
      },
      finalFallback: () => { L.warn('searchPlaces', 'finalFallback: Nominatim'); return nominatimSearch(query, countryCode); },
    });
  }, [runWithFallback, logRequest]);

  const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
    L.info('getPlaceDetails', 'called', { placeId, hasFallbackCoords: fallbackData?.lat != null });
    if (fallbackData?.lat != null && fallbackData?.lng != null) {
      L.ok('getPlaceDetails', 'fast-path: fallbackData has coords');
      return fallbackData;
    }
    return runWithFallback({
      serviceType: 'location', explicitProvider: null,
      handler: async (p) => {
        L.info('getPlaceDetails', `handler "${p.name}"`);
        if (INLINE_PROVIDERS.has(p.name)) { L.trace('getPlaceDetails', 'inline — return fallbackData'); return fallbackData; }
        if (!p.instance?.getPlaceDetails) { L.warn('getPlaceDetails', `"${p.name}" no method`); return null; }
        const result = await p.instance.getPlaceDetails(placeId, fallbackData, p.apiMethod);
        if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        L.warn('getPlaceDetails', `"${p.name}" returned null`); return null;
      },
      finalFallback: async () => { L.warn('getPlaceDetails', 'finalFallback: fallbackData'); return fallbackData; },
    });
  }, [runWithFallback, logRequest]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    L.info('reverseGeocode', 'called', { lat, lng });
    return runWithFallback({
      serviceType: 'location', explicitProvider: null,
      handler: async (p) => {
        L.info('reverseGeocode', `handler "${p.name}"`);
        if (INLINE_PROVIDERS.has(p.name)) { L.info('reverseGeocode', 'inline — Nominatim reverse'); return nominatimReverse(lat, lng); }
        if (!p.instance?.reverseGeocode) { L.warn('reverseGeocode', `"${p.name}" no method`); return null; }
        const result = await p.instance.reverseGeocode(lat, lng, p.apiMethod);
        if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        L.warn('reverseGeocode', `"${p.name}" returned null`); return null;
      },
      finalFallback: () => { L.warn('reverseGeocode', 'finalFallback: Nominatim reverse'); return nominatimReverse(lat, lng); },
    });
  }, [runWithFallback, logRequest]);

  const getRoute = useCallback(async (origin, destination) => {
    L.info('getRoute', 'called', { prioritizedRoute, origin, destination });
    return runWithFallback({
      serviceType: 'routing', explicitProvider: prioritizedRoute,
      handler: async (p) => {
        L.info('getRoute', `handler "${p.name}"`, { apiMethod: p.apiMethod });
        if (DEEP_LINK_PROVIDERS.has(p.name) && p.instance?.openNavigation) {
          L.info('getRoute', `"${p.name}" deep-link navigation`);
          p.instance.openNavigation(destination, origin);
          return { type: 'deeplink', provider: p.name };
        }
        if (p.name === PROVIDER.LOCAL) { L.info('getRoute', 'local OSRM'); return fetchLocalRoute(origin, destination); }
        if (p.name === PROVIDER.OPENSTREET) { L.info('getRoute', 'public OSRM'); return osrmRoute(origin, destination); }
        if (!p.instance?.getRoute) { L.warn('getRoute', `"${p.name}" no getRoute method`); return null; }
        L.info('getRoute', `calling instance.getRoute on "${p.name}"`);
        const result = await p.instance.getRoute(origin, destination, p.apiMethod);
        if (result) {
          L.ok('getRoute', `"${p.name}" result`, { distance: result.distance, duration: result.duration, pts: result.geometry?.length ?? 0 });
          logRequest(p.name, 'GeocoderHTTPAPI');
          return result;
        }
        L.warn('getRoute', `"${p.name}" returned null`); return null;
      },
      finalFallback: () => { L.warn('getRoute', 'finalFallback: public OSRM'); return osrmRoute(origin, destination); },
    });
  }, [prioritizedRoute, runWithFallback, fetchLocalRoute, logRequest]);

  const calculateDistance = useCallback(async (origin, destination) => {
    L.info('calculateDistance', 'called', { prioritizedDistance, origin, destination });
    return runWithFallback({
      serviceType: 'distance', explicitProvider: prioritizedDistance,
      handler: async (p) => {
        L.info('calculateDistance', `handler "${p.name}"`, { apiMethod: p.apiMethod });
        if (p.name === PROVIDER.LOCAL) {
          L.info('calculateDistance', 'local OSRM');
          const r = await fetchLocalRoute(origin, destination);
          return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
        }
        if (p.name === PROVIDER.OPENSTREET) {
          L.info('calculateDistance', 'public OSRM');
          const r = await osrmRoute(origin, destination);
          return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
        }
        if (!p.instance?.calculateDistance) { L.warn('calculateDistance', `"${p.name}" no method`); return null; }
        L.info('calculateDistance', `calling instance.calculateDistance on "${p.name}"`);
        const result = await p.instance.calculateDistance(origin, destination, p.apiMethod);
        if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        L.warn('calculateDistance', `"${p.name}" returned null`); return null;
      },
      finalFallback: async () => {
        L.warn('calculateDistance', 'finalFallback: haversine');
        const R    = 6371;
        const dLat = (destination.lat - origin.lat) * Math.PI / 180;
        const dLon = (destination.lng - origin.lng) * Math.PI / 180;
        const a    =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;
        const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { distanceValue: Math.round(km * 1000), distance: km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m` };
      },
    });
  }, [prioritizedDistance, runWithFallback, fetchLocalRoute, logRequest]);

  const calculateEta = useCallback(async (origin, destination) => {
    L.info('calculateEta', 'called', { prioritizedEta, origin, destination });
    return runWithFallback({
      serviceType: 'eta', explicitProvider: prioritizedEta,
      handler: async (p) => {
        L.info('calculateEta', `handler "${p.name}"`, { apiMethod: p.apiMethod });
        if (p.name === PROVIDER.LOCAL) {
          L.info('calculateEta', 'local OSRM');
          const r = await fetchLocalRoute(origin, destination);
          return r ? { durationValue: r.durationValue, duration: r.duration } : null;
        }
        if (p.name === PROVIDER.OPENSTREET) {
          L.info('calculateEta', 'public OSRM');
          const r = await osrmRoute(origin, destination);
          return r ? { durationValue: r.durationValue, duration: r.duration } : null;
        }
        if (!p.instance?.calculateEta) { L.warn('calculateEta', `"${p.name}" no method`); return null; }
        L.info('calculateEta', `calling instance.calculateEta on "${p.name}"`);
        const result = await p.instance.calculateEta(origin, destination, p.apiMethod);
        if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        L.warn('calculateEta', `"${p.name}" returned null`); return null;
      },
      finalFallback: async () => { L.warn('calculateEta', 'finalFallback: null'); return null; },
    });
  }, [prioritizedEta, runWithFallback, fetchLocalRoute, logRequest]);

  const getInitialLocation = useCallback(() => {
    L.info('getInitialLocation', 'called');
    return getIPLocation(localMapUrl);
  }, [localMapUrl]);

  const getProviderStatus = useCallback(() =>
    priorityList.map((name) => {
      const p = providers[name];
      if (!p) return { name, loaded: false };
      return {
        name, loaded: true,
        hasInstance: !!p.instance || INLINE_PROVIDERS.has(name),
        budget:      p.budget,
        serviceApis: serviceApis[name] ?? null,
        canUseGeo:   hasQuota(p.record, 'GeocoderHTTPAPI'),
        canUseJS:    hasQuota(p.record, 'JavaScriptAPI'),
      };
    }),
  [priorityList, providers, serviceApis]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__mapsProviderStatus = getProviderStatus;
      L.info('MapsProvider', '__mapsProviderStatus attached to window — run window.__mapsProviderStatus() in DevTools to inspect provider state');
    }
  }, [getProviderStatus]);

  const value = useMemo(() => ({
    ready, allExhausted,
    prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
    serviceApis,
    searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
    getRoute, calculateDistance, calculateEta,
    getProviderStatus, localMapUrl,
  }), [
    ready, allExhausted,
    prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
    serviceApis,
    searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
    getRoute, calculateDistance, calculateEta,
    getProviderStatus, localMapUrl,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  L.trace('MapsProvider', 'rendering context provider', { ready, allExhausted, prioritizedMap, prioritizedRoute });

  return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
}

export function useMapProvider() {
  const ctx = useContext(MapsContext);
  if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
  return ctx;
}

export default MapsProvider;