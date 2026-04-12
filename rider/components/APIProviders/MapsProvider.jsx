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
// //
// // Strapi per-provider config objects are merged over these at load time.
// // An empty config {} leaves all defaults intact.
// //
// // service keys: routing | distance | eta | autoComplete | location
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
// //
// // Expected Strapi shape:
// //   [
// //     { "name": "geoapify", "config": {} },
// //     { "name": "google",   "config": { "routing": "routeApi", ... } },
// //     { "name": "waze",     "config": {} },
// //     ...
// //   ]
// //
// // Returns:
// //   providerNames:   ["geoapify", "google", "waze", ...]   ordered
// //   perProviderApis: { google: { routing: "routeApi", ... } }
// //
// // Robustness: also handles the old flat alternating format
// //   ["google:", {...}, "waze:", {}] in case old data is still in Strapi.
// // ─────────────────────────────────────────────────────────────────────────────

// function parseMapsProviders(rawList) {
//   const providerNames   = [];
//   const perProviderApis = {};
//   const seen            = new Set();

//   if (!Array.isArray(rawList)) return { providerNames, perProviderApis };

//   // ── New format: array of { name, config } objects ─────────────────────────
//   const isNewFormat = rawList.length > 0 &&
//     typeof rawList[0] === 'object' && rawList[0] !== null &&
//     'name' in rawList[0];

//   if (isNewFormat) {
//     for (const entry of rawList) {
//       if (!entry || typeof entry !== 'object') continue;

//       const name   = (entry.name || '').trim();
//       const config = (entry.config && typeof entry.config === 'object') ? entry.config : {};

//       if (!name) continue;
//       if (!seen.has(name)) { providerNames.push(name); seen.add(name); }

//       // Non-empty config merges over any previous entry for this provider
//       if (Object.keys(config).length > 0) {
//         perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
//       }
//     }
//     return { providerNames, perProviderApis };
//   }

//   // ── Legacy format: ["google:", { routing: "routeApi" }, "waze:", {}, ...] ─
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
//   maxDailyGeocoderApiRequests:    1000,
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

//   return {
//     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
//     dailyGeoRemaining: Math.max(0, maxDailyGeo - (Number(dayData.geo) || 0)),
//     dailyJSRemaining:  Math.max(0, maxDailyJS  - (Number(dayData.js)  || 0)),
//     monthlyMax, maxDailyGeo, maxDailyJS,
//   };
// }

// function hasQuota(record, apiType) {
//   const name = record?.providerName;
//   if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;
//   const b = computeBudget(record);
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
//     case PROVIDER.WAZE:       return new WazeMapsProvider();
//     case PROVIDER.APPLE:      return new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
//     case PROVIDER.GOOGLE:     return new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
//     case PROVIDER.YANDEX:     return new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
//     case PROVIDER.GEOAPIFY:   return new GeoapifyProvider(process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '');
//     case PROVIDER.OPENSTREET:
//     case PROVIDER.LOCAL:      return null;
//     default:
//       console.warn(`[MapsProvider] createProviderInstance: unknown provider "${name}"`);
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
//   }, [])

//   function authHeaders() {
//     const token = getToken();
//     return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
//   }

//   const initFailures = useRef({});
//   const logFailures  = useRef({});

//   async function initProviderData(record) {
//     if (record.id == null) return { ...record, providerData: buildFreshProviderData() };
//     const pd = record.providerData;
//     if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) return record;

//     const failKey = record.providerName;
//     if ((initFailures.current[failKey] || 0) >= 5) {
//       return { ...record, providerData: buildFreshProviderData() };
//     }

//     const freshData = buildFreshProviderData();
//     try {
//       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
//         method: 'PUT', headers: authHeaders(),
//         body: JSON.stringify({ data: { providerData: freshData } }),
//       })
//       if (!res.ok) {
//         if(res.status === 404 ) return { ...record, providerData: buildFreshProviderData() } // this means there is nothing we can do, it's not found
//         initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
//       }
//       else { 
//         initFailures.current[failKey] = 0
//       }
//     } catch {
//       initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
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

//         const pMap      = attrs.prioritizedMap              ?? PROVIDER.OPENSTREET;
//         const pRoute    = attrs.priotizedRouteDrawer        ?? null;
//         const pDistance = attrs.priotizedDistanceCalculator ?? null;
//         const pEta      = attrs.priotizedEtaCalculator      ?? null;

//         console.log('[MapsProvider] assignments — map:', pMap, '| route:', pRoute, '| distance:', pDistance, '| eta:', pEta);

//         setPrioritizedMap(pMap);
//         setPrioritizedRoute(pRoute);
//         setPrioritizedDistance(pDistance);
//         setPrioritizedEta(pEta);

//         // ── Parse mapsProviders ─────────────────────────────────────────────
//         // New Strapi shape: [{ name: "google", config: { routing: "routeApi" } }, ...]
//         // Legacy shape:     ["google:", { routing: "routeApi" }, ...]  (still handled)
//         const rawList = attrs.mapsProviders ?? [];
//         const { providerNames: list, perProviderApis } = parseMapsProviders(rawList);

//         console.log('[MapsProvider] provider list:', list);
//         console.log('[MapsProvider] per-provider api config:', perProviderApis);

//         // Merge Strapi configs over defaults — empty config leaves defaults intact
//         setServiceApis(() => {
//           const merged = { ...DEFAULT_SERVICE_APIS };
//           for (const [provName, apis] of Object.entries(perProviderApis)) {
//             merged[provName] = {
//               ...(DEFAULT_SERVICE_APIS[provName] || {}),
//               ...apis,
//             };
//           }
//           return merged;
//         });

//         setPriorityList(list);
//         if (!list.length) { setReady(true); return; }

//         // ── Fetch provider records ──────────────────────────────────────────
//         const queryableNames = list.filter((n) => !INLINE_PROVIDERS.has(n));
//         const providerMap    = {};

//         if (queryableNames.length > 0) {
//           const filterParams = queryableNames
//             .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
//             .join('&');

//           const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
//           const provJson = await provRes.json();

//           for (const item of (provJson?.data ?? [])) {
//             const flat = item.attributes ?? item;
//             const name = flat.providerName;
//             if (!name) continue;

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

//             providerMap[name] = { record, instance: createProviderInstance(name), budget: computeBudget(record) };
//           }
//         }

//         // Synthesise entries for providers without Strapi records
//         for (const name of list) {
//           if (providerMap[name]) continue;
//           const defaultRecord = {
//             id: null, providerName: name,
//             providerData: buildFreshProviderData(),
//             maxMonthlyRequests: QUOTA_DEFAULTS.maxMonthlyRequests,
//           };
//           providerMap[name] = {
//             record: defaultRecord,
//             instance: createProviderInstance(name),
//             budget: computeBudget(defaultRecord),
//           };
//           console.log(`[MapsProvider] "${name}": synthesised | instance: ${providerMap[name].instance ? 'created' : 'inline/null'}`);
//         }

//         setProviders(providerMap);
//         setAllExhausted(!list.some((n) => providerMap[n]?.instance != null || INLINE_PROVIDERS.has(n)));

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
//     const p = providersRef.current[providerName]
//     if (!p || p.record.id == null) return;

//     const failKey   = `${providerName}:${p.record.id}`;
//     const failCount = logFailures.current[failKey] || 0;
//     if (failCount >= 3) return;

//     const monthKey = getMonthKey()
//     const dayKey   = getDayKey()
//     const bucket   = dailyBucketKey(apiType)

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

//     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
//       method: 'PUT', headers: authHeaders(),
//       body: JSON.stringify({ data: { providerData: updatedProviderData } }),
//     })
//       .then((res) => {
//         if (!res.ok) {
//           logFailures.current[failKey] = failCount + 1
//           if(res.status === 404 && failCount === 2) return
//           if (failCount === 0) console.warn(
//             `[MapsProvider] logRequest PUT ${res.status} for "${providerName}".`,
//             res.status === 404 ? 'Grant update on api-providers in Strapi → Settings → Roles.' : `HTTP ${res.status}`,
//           )
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
//     })

//   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ─────────────────────────────────────────────────────────────────────────
//   // PROVIDER RESOLUTION
//   //
//   // Returns { name, instance, record, apiMethod } | null
//   //
//   // apiMethod = serviceApis[name][serviceType]
//   // e.g. serviceApis['google']['routing'] = 'routeApi'
//   // ─────────────────────────────────────────────────────────────────────────

//   const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
//     const apiType = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';

//     const isUsable = (name) => {
//       if (failedSet.has(name)) return false;
//       if (INLINE_PROVIDERS.has(name)) return true;
//       if (DEEP_LINK_PROVIDERS.has(name)) return !!providers[name]?.instance;
//       const p = providers[name];
//       if (!p?.instance) return false;
//       return hasQuota(p.record, apiType);
//     };

//     const toEntry = (name) => ({
//       name,
//       instance:  providers[name]?.instance ?? null,
//       record:    providers[name]?.record   ?? null,
//       apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
//     });

//     // 1. Explicit provider — bypass priority list entirely
//     if (explicitName && isUsable(explicitName)) {
//       console.log(`[MapsProvider.resolve] ✅ explicit: "${explicitName}" | ${serviceType} → ${toEntry(explicitName).apiMethod}`);
//       return toEntry(explicitName);
//     }

//     // 2. Priority list walk
//     for (const name of priorityList) {
//       if (name === explicitName) continue;

//       // local failed → substitute openstreet immediately
//       if (name === PROVIDER.LOCAL && failedSet.has(PROVIDER.LOCAL)) {
//         if (isUsable(PROVIDER.OPENSTREET)) {
//           console.log('[MapsProvider.resolve] local failed → openstreet substituted');
//           return toEntry(PROVIDER.OPENSTREET);
//         }
//         continue;
//       }

//       if (isUsable(name)) {
//         console.log(`[MapsProvider.resolve] ✅ fallback: "${name}" | ${serviceType} → ${toEntry(name).apiMethod}`);
//         return toEntry(name);
//       }
//     }

//     console.log(`[MapsProvider.resolve] ❌ no provider for ${serviceType}`);
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
//       type: 'local',
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
//   //
//   // handler(p) where p = { name, instance, record, apiMethod }
//   // The apiMethod is forwarded to the provider instance so it can dispatch
//   // to the right internal implementation.
//   // ─────────────────────────────────────────────────────────────────────────

//   const runWithFallback = useCallback(async ({
//     serviceType,
//     explicitProvider,
//     handler,
//     finalFallback = async () => null,
//   }) => {
//     const failed      = new Set();
//     const maxAttempts = priorityList.length + 2;

//     for (let i = 0; i < maxAttempts; i++) {
//       const p = resolveServiceProvider(
//         failed.has(explicitProvider) ? null : explicitProvider,
//         serviceType,
//         failed,
//       );
//       if (!p) break;

//       try {
//         const result = await handler(p);
//         if (result != null) return result;
//         console.log(`[MapsProvider.${serviceType}] "${p.name}" (${p.apiMethod}) → no result`);
//         failed.add(p.name);
//       } catch (err) {
//         console.warn(`[MapsProvider.${serviceType}] "${p.name}" (${p.apiMethod}) threw:`, err.message);
//         failed.add(p.name);
//       }
//     }

//     console.warn(`[MapsProvider.${serviceType}] all providers failed — final fallback`);
//     return finalFallback();
//   }, [priorityList, resolveServiceProvider]);

//   // ─────────────────────────────────────────────────────────────────────────
//   // PUBLIC API
//   // ─────────────────────────────────────────────────────────────────────────

//   const searchPlaces = useCallback(async (query, countryCode = null) => {
//     if (!query || query.length < 2) return [];
//     return runWithFallback({
//       serviceType: 'autoComplete', explicitProvider: null,
//       handler: async (p) => {
//         if (DEEP_LINK_PROVIDERS.has(p.name) && !p.apiMethod) return null;
//         if (INLINE_PROVIDERS.has(p.name)) {
//           const r = await nominatimSearch(query, countryCode);
//           return r.length ? r : null;
//         }
//         if (!p.instance?.searchPlaces) return null;

//         // ── Inject viewport bias from the active map display ───────────────
//         // GoogleMapDisplay (and other displays) write their current viewport
//         // centre + radius to window.__googleMapsViewport on every map idle.
//         // We forward that to the provider instance so autocomplete results
//         // are biased toward what the user is currently looking at, which is
//         // exactly how Google Maps itself behaves.
//         if (typeof window !== 'undefined' && window.__googleMapsViewport) {
//           const vp = window.__googleMapsViewport;
//           if (p.instance.setViewport) {
//             p.instance.setViewport(vp.lat, vp.lng, vp.radiusM, vp.regionCode || countryCode);
//           } else if (p.instance.setCenter) {
//             p.instance.setCenter(vp.lat, vp.lng);
//           }
//         }

//         const results = await p.instance.searchPlaces(query, countryCode, p.apiMethod);
//         if (results?.length) { logRequest(p.name, 'JavaScriptAPI'); return results; }
//         return null;
//       },
//       finalFallback: () => nominatimSearch(query, countryCode),
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
//     return runWithFallback({
//       serviceType: 'routing', explicitProvider: prioritizedRoute,
//       handler: async (p) => {
//         if (DEEP_LINK_PROVIDERS.has(p.name) && p.instance?.openNavigation) {
//           p.instance.openNavigation(destination, origin);
//           return { type: 'deeplink', provider: p.name };
//         }
//         if (p.name === PROVIDER.LOCAL)      return fetchLocalRoute(origin, destination);
//         if (p.name === PROVIDER.OPENSTREET) return osrmRoute(origin, destination);
//         if (!p.instance?.getRoute) return null;
//         const result = await p.instance.getRoute(origin, destination, p.apiMethod);
//         if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
//         return null;
//       },
//       finalFallback: () => osrmRoute(origin, destination),
//     });
//   }, [prioritizedRoute, runWithFallback, fetchLocalRoute, logRequest]);

//   const calculateDistance = useCallback(async (origin, destination) => {
//     return runWithFallback({
//       serviceType: 'distance', explicitProvider: prioritizedDistance,
//       handler: async (p) => {
//         if (p.name === PROVIDER.LOCAL) {
//           const r = await fetchLocalRoute(origin, destination);
//           return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
//         }
//         if (p.name === PROVIDER.OPENSTREET) {
//           const r = await osrmRoute(origin, destination);
//           return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
//         }
//         if (!p.instance?.calculateDistance) return null;
//         const result = await p.instance.calculateDistance(origin, destination, p.apiMethod);
//         if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
//         return null;
//       },
//       finalFallback: async () => {
//         const R = 6371;
//         const dLat = (destination.lat - origin.lat) * Math.PI / 180;
//         const dLon = (destination.lng - origin.lng) * Math.PI / 180;
//         const a =
//           Math.sin(dLat / 2) ** 2 +
//           Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
//           Math.sin(dLon / 2) ** 2;
//         const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//         return { distanceValue: Math.round(km * 1000), distance: km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m` };
//       },
//     });
//   }, [prioritizedDistance, runWithFallback, fetchLocalRoute, logRequest]);

//   const calculateEta = useCallback(async (origin, destination) => {
//     return runWithFallback({
//       serviceType: 'eta', explicitProvider: prioritizedEta,
//       handler: async (p) => {
//         if (p.name === PROVIDER.LOCAL) {
//           const r = await fetchLocalRoute(origin, destination);
//           return r ? { durationValue: r.durationValue, duration: r.duration } : null;
//         }
//         if (p.name === PROVIDER.OPENSTREET) {
//           const r = await osrmRoute(origin, destination);
//           return r ? { durationValue: r.durationValue, duration: r.duration } : null;
//         }
//         if (!p.instance?.calculateEta) return null;
//         const result = await p.instance.calculateEta(origin, destination, p.apiMethod);
//         if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
//         return null;
//       },
//       finalFallback: async () => null,
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
//   }, [getProviderStatus])

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

// PROVIDER NAME CONSTANTS
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

// DEFAULT SERVICE → API METHOD MAP
const DEFAULT_SERVICE_APIS = { /* unchanged - same as before */ };

function parseMapsProviders(rawList) { /* unchanged */ }

function getMonthKey() { /* unchanged */ }
function getDayKey() { /* unchanged */ }

const QUOTA_DEFAULTS = { /* unchanged */ };

function dailyBucketKey(apiType) { /* unchanged */ }
function buildFreshProviderData() { /* unchanged */ }
function computeBudget(record) { /* unchanged */ }

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG: Enhanced hasQuota with full budget visibility
// ─────────────────────────────────────────────────────────────────────────────
function hasQuota(record, apiType) {
  const name = record?.providerName;
  if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;

  const b = computeBudget(record);

  console.log(`[MapsProvider:DEBUG] hasQuota("${name}", ${apiType}) → monthly:${b.monthlyRemaining} | dailyGeo:${b.dailyGeoRemaining} | dailyJS:${b.dailyJSRemaining}`);

  return (
    b.monthlyRemaining > 0 &&
    (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
    (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG: Enhanced isUsable + resolveServiceProvider
// ─────────────────────────────────────────────────────────────────────────────
function createProviderInstance(name) { /* unchanged */ }

async function nominatimSearch(query, countryCode = null) { /* unchanged */ }
async function nominatimReverse(lat, lng) { /* unchanged */ }
async function osrmRoute(origin, destination) { /* unchanged */ }
async function getIPLocation(localServerUrl) { /* unchanged */ }

export function MapsProvider({ children }) {
  // ... all your existing state and refs (unchanged)

  const initFailures = useRef({});
  const logFailures  = useRef({});

  async function initProviderData(record) { /* unchanged */ }

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (!apiUrl) { setReady(true); return; }

      try {
        const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
        const pmJson = await pmRes.json();
        const pmRaw  = pmJson?.data ?? {};
        const attrs  = pmRaw.attributes ?? pmRaw;

        // DEBUG: Show exactly what Strapi sent for prioritized settings
        console.log('[MapsProvider:DEBUG] Strapi prioritized settings →', {
          prioritizedMap:              attrs.prioritizedMap,
          prioritizedRouteDrawer:      attrs.priotizedRouteDrawer,
          prioritizedDistanceCalculator: attrs.priotizedDistanceCalculator,
          prioritizedEtaCalculator:    attrs.priotizedEtaCalculator,
        });

        const pMap      = attrs.prioritizedMap              ?? PROVIDER.OPENSTREET;
        const pRoute    = attrs.priotizedRouteDrawer        ?? null;
        const pDistance = attrs.priotizedDistanceCalculator ?? null;
        const pEta      = attrs.priotizedEtaCalculator      ?? null;

        console.log(`[MapsProvider:DEBUG] FINAL assigned → map: ${pMap} | route: ${pRoute} | distance: ${pDistance} | eta: ${pEta}`);

        setPrioritizedMap(pMap);
        setPrioritizedRoute(pRoute);
        setPrioritizedDistance(pDistance);
        setPrioritizedEta(pEta);

        // ... rest of your load() function (parsing providers, etc.) remains unchanged ...

        setProviders(providerMap);
        setAllExhausted(!list.some((n) => providerMap[n]?.instance != null || INLINE_PROVIDERS.has(n)));

      } catch (err) {
        console.error('[MapsProvider] load error:', err);
        setAllExhausted(true);
      } finally {
        setReady(true);
      }
    }

    load();
  }, [apiUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // DEBUG: Enhanced resolveServiceProvider
  // ─────────────────────────────────────────────────────────────────────────
  const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
    const apiType = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';

    const isUsable = (name) => {
      if (failedSet.has(name)) return false;
      if (INLINE_PROVIDERS.has(name)) return true;
      if (DEEP_LINK_PROVIDERS.has(name)) return !!providers[name]?.instance;

      const p = providers[name];
      if (!p?.instance) {
        console.log(`[MapsProvider:DEBUG] isUsable("${name}") → NO INSTANCE`);
        return false;
      }

      const quotaOk = hasQuota(p.record, apiType);
      console.log(`[MapsProvider:DEBUG] isUsable("${name}") → quotaOk: ${quotaOk} | serviceType: ${serviceType}`);
      return quotaOk;
    };

    const toEntry = (name) => ({
      name,
      instance:  providers[name]?.instance ?? null,
      record:    providers[name]?.record   ?? null,
      apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
    });

    // Explicit provider check
    if (explicitName) {
      const usable = isUsable(explicitName);
      console.log(`[MapsProvider:DEBUG] explicit check "${explicitName}" for ${serviceType} → usable: ${usable}`);
      if (usable) {
        console.log(`[MapsProvider:DEBUG] ✅ USING EXPLICIT PROVIDER: ${explicitName} for ${serviceType}`);
        return toEntry(explicitName);
      }
    }

    // Priority list walk
    console.log(`[MapsProvider:DEBUG] explicit failed or not set → walking priorityList for ${serviceType}`);
    for (const name of priorityList) {
      if (name === explicitName) continue;
      if (isUsable(name)) {
        console.log(`[MapsProvider:DEBUG] ✅ FALLBACK PROVIDER CHOSEN: ${name} for ${serviceType}`);
        return toEntry(name);
      }
    }

    console.log(`[MapsProvider:DEBUG] ❌ NO PROVIDER FOUND for ${serviceType}`);
    return null;
  }, [priorityList, providers, serviceApis]);

  const logRequest = useCallback((providerName, apiType) => {
    // ... existing code ...
    console.log(`[MapsProvider:DEBUG] logRequest → ${providerName} used ${apiType} (quota will be decremented)`);
    // ... rest unchanged ...
  }, [providers, apiUrl]);

  // ── PUBLIC API with debug logs ─────────────────────────────────────────────
  const searchPlaces = useCallback(async (query, countryCode = null) => {
    console.log(`[MapsProvider:DEBUG] searchPlaces called with query: "${query}"`);
    return runWithFallback({ /* existing ... */ });
  }, [runWithFallback, logRequest]);

  const getRoute = useCallback(async (origin, destination) => {
    console.log(`[MapsProvider:DEBUG] getRoute called → explicit prioritizedRoute = ${prioritizedRoute}`);
    return runWithFallback({ /* existing ... */ });
  }, [prioritizedRoute, runWithFallback, fetchLocalRoute, logRequest]);

  const calculateDistance = useCallback(async (origin, destination) => {
    console.log(`[MapsProvider:DEBUG] calculateDistance called → explicit prioritizedDistance = ${prioritizedDistance}`);
    return runWithFallback({ /* existing ... */ });
  }, [prioritizedDistance, runWithFallback, fetchLocalRoute, logRequest]);

  const calculateEta = useCallback(async (origin, destination) => {
    console.log(`[MapsProvider:DEBUG] calculateEta called → explicit prioritizedEta = ${prioritizedEta}`);
    return runWithFallback({ /* existing ... */ });
  }, [prioritizedEta, runWithFallback, fetchLocalRoute, logRequest]);

  // ... rest of your file (runWithFallback, getPlaceDetails, reverseGeocode, etc.) remains exactly the same ...

  const value = useMemo(() => ({ /* unchanged */ }), [ /* deps */ ]);

  return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
}

export function useMapProvider() {
  const ctx = useContext(MapsContext);
  if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
  return ctx;
}

export default MapsProvider;