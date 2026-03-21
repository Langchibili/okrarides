// // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx

// 'use client';

// import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo  } from 'react';
// import { GoogleMapsProvider }  from './GoogleMapsProvider';
// import { YandexMapsProvider }  from './YandexMapsProvider';
// import { WazeMapsProvider }    from './WazeMapsProvider';
// import { AppleMapsProvider }   from './AppleMapsProvider';
// import { GeoapifyProvider }    from './GeoapifyProvider';

// const MapsContext = createContext(null);

// // ─────────────────────────────────────────────────────────────────────────────
// // DATE HELPERS
// // Keys are ISO strings so sorting / comparison works naturally:
// //   month key  → "2026-03"
// //   day key    → "2026-03-02"
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
// // DEFAULT LIMITS
// // ─────────────────────────────────────────────────────────────────────────────

// const DEFAULTS = {
//   maxMonthlyRequests:            20000,
//   maxDailyGeocoderApiRequests:     800,
//   maxDailyJSApiRequests:         20000,
// };

// function dailyBucketKey(apiType) {
//   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // PROVIDER DATA SCHEMA
// //
// // providerData = {
// //   maxDailyGeocoderApiRequests: 800,
// //   maxDailyJSApiRequests:       20000,
// //   requestCounts: { "2026-03": { GeocoderHTTPAPI: 12, JavaScriptAPI: 4 } }
// //   dailyCounts:   { "2026-03-02": { geo: 3, js: 1 } }
// // }
// // ─────────────────────────────────────────────────────────────────────────────

// function buildFreshProviderData() {
//   return {
//     maxDailyGeocoderApiRequests: DEFAULTS.maxDailyGeocoderApiRequests,
//     maxDailyJSApiRequests:       DEFAULTS.maxDailyJSApiRequests,
//     requestCounts: {},
//     dailyCounts:   {},
//   };
// }

// function computeBudget(record) {
//   const pd       = record.providerData || {};
//   const monthKey = getMonthKey();
//   const dayKey   = getDayKey();

//   const monthData   = pd.requestCounts?.[monthKey] || {};
//   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
//   const monthlyMax  = record.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests;

//   const dayData      = pd.dailyCounts?.[dayKey] || {};
//   const dailyGeoUsed = Number(dayData.geo) || 0;
//   const dailyJSUsed  = Number(dayData.js)  || 0;

//   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || DEFAULTS.maxDailyGeocoderApiRequests;
//   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || DEFAULTS.maxDailyJSApiRequests;

//   return {
//     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
//     dailyGeoRemaining: Math.max(0, maxDailyGeo - dailyGeoUsed),
//     dailyJSRemaining:  Math.max(0, maxDailyJS  - dailyJSUsed),
//     monthlyMax,
//     maxDailyGeo,
//     maxDailyJS,
//   };
// }

// function canUse(record, apiType) {
//   const b = computeBudget(record);
//   const result =
//     b.monthlyRemaining > 0 &&
//     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
//     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0);
//   console.log(`[MapsProvider] canUse(${record?.providerName}, ${apiType}): ${result}`, {
//     monthlyRemaining: b.monthlyRemaining,
//     dailyJSRemaining: b.dailyJSRemaining,
//     dailyGeoRemaining: b.dailyGeoRemaining
//   });
//   return result;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // NOMINATIM FALLBACKS
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
//       { headers: { 'Accept-Language': 'en' } }
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
// // PROVIDERS THAT HANDLE THEIR OWN ROUTING (deep-link based)
// // ─────────────────────────────────────────────────────────────────────────────
// const DEEP_LINK_ROUTING_MAPS = ['wazemap']; // applemap removed: it now fetches routes via AppleMapsProvider.getRoute() and draws them in-map

// // ─────────────────────────────────────────────────────────────────────────────
// // MASPROVIDER COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────

// export function MapsProvider({ children }) {
//   const [priorityList,   setPriorityList]   = useState([]);
//   const [providers,      setProviders]      = useState({});
//   const [allExhausted,   setAllExhausted]   = useState(false);
//   const [ready,          setReady]          = useState(false);
//   // ── NEW: which map to display on screen ───────────────────────────────────
//   // Populated from Strapi apiProvidersPriorityMap.prioritizedMap
//   // Values: 'wazemap' | 'openstreetmap' | 'localmap' | 'yandexmap' | 'googlemap' | 'applemap'
//   const [prioritizedMap, setPrioritizedMap] = useState('openstreetmap');

//   const apiUrl      = process.env.NEXT_PUBLIC_API_URL      || '';
//   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

//   // ── Auth ────────────────────────────────────────────────────────────────
//   function getToken() {
//     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
//     catch { return null; }
//   }
//   function authHeaders() {
//     const token = getToken();
//     return {
//       'Content-Type': 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     };
//   }

//   // Track consecutive PUT failures per provider — circuit breaks after 5
//   const initFailures = useRef({});

//   async function initProviderData(record) {
//     console.log('[MapsProvider] initProviderData for', record.providerName);

//     // Synthetic records (no Strapi entry) have id:null — skip the PUT entirely
//     if (record.id == null) {
//       console.log(`[MapsProvider] initProviderData: ${record.providerName} has no Strapi id — skipping PUT`);
//       const freshData = buildFreshProviderData();
//       return { ...record, providerData: freshData };
//     }

//     const pd = record.providerData;
//     const isEmpty = !pd || typeof pd !== 'object' || Object.keys(pd).length === 0;
//     if (!isEmpty) {
//       return record; // already initialised — nothing to do
//     }

//     // Circuit breaker: stop after 5 consecutive failures for this provider
//     const failKey = record.providerName;
//     if ((initFailures.current[failKey] || 0) >= 5) {
//       console.warn(`[MapsProvider] initProviderData: ${failKey} has failed 5+ times — skipping PUT`);
//       const freshData = buildFreshProviderData();
//       return { ...record, providerData: freshData };
//     }

//     const freshData = buildFreshProviderData();

//     try {
//       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
//         method: 'PUT',
//         headers: authHeaders(),
//         body: JSON.stringify({ data: { providerData: freshData } }),
//       });

//       if (!res.ok) {
//         initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
//         const failCount = initFailures.current[failKey];
//         if (failCount < 5) {
//           console.warn(`[MapsProvider] initProviderData PUT failed for ${record.providerName}: ${res.status} (attempt ${failCount}/5)`);
//         } else {
//           console.warn(`[MapsProvider] initProviderData PUT for ${record.providerName} failed 5 times — giving up. Check Strapi PUT permissions on api-providers.`);
//         }
//       } else {
//         // Success — reset counter
//         initFailures.current[failKey] = 0;
//         console.info(`[MapsProvider] Initialized providerData for ${record.providerName}`);
//       }
//     } catch (err) {
//       initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
//       console.warn(`[MapsProvider] initProviderData network error for ${record.providerName} (attempt ${initFailures.current[failKey]}/5)`);
//     }

//     return { ...record, providerData: freshData };
//   }

//   // ── Load priority + provider records ────────────────────────────────────
//   useEffect(() => {
//     async function load() {
//       console.log('[MapsProvider] load started');
//       if (!apiUrl) { setReady(true); return; }

//       try {
//         // 1. Priority map (single type)
//         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
//         const pmJson = await pmRes.json();
//         console.log('[MapsProvider] raw priority-map response:', JSON.stringify(pmJson));
//         const pmRaw  = pmJson?.data || {};
//         const list   = pmRaw.mapsProviders ?? pmRaw.attributes?.mapsProviders ?? [];

//         // ── Read prioritizedMap — try every casing Strapi might return ──
//         const pMap =
//           pmRaw.priotizedMap          ||   // actual Strapi field name (typo in schema)
//           pmRaw.prioritizedMap        ||
//           pmRaw.attributes?.prioritizedMap ||
//           pmRaw.attributes?.priotizedMap   ||
//           pmRaw.prioritized_map       ||
//           pmRaw.attributes?.prioritized_map ||
//           pmRaw.PrioritizedMap        ||
//           list[0]                     ||   // fall back to first provider in list
//           'openstreetmap';
//         console.log('[MapsProvider] prioritizedMap resolved to:', pMap, '(raw keys:', Object.keys(pmRaw), ')');
//         setPrioritizedMap(pMap);
//         // ────────────────────────────────────────────────────────────────

//         console.log('[MapsProvider] priority list:', list);
//         setPriorityList(list);
//         if (!list.length) { setReady(true); return; }

//         // 2. Provider records
//         const filterParams = list
//           .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
//           .join('&');

//         const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
//         const provJson = await provRes.json();
//         const rawItems = provJson?.data || [];
//         console.log('[MapsProvider] provider records:', rawItems);

//         const providerMap = {};

//         for (const item of rawItems) {
//           const flat = item.attributes ?? item;

//           let record = {
//             id:                 item.id,
//             providerName:       flat.providerName,
//             providerData:       flat.providerData       ?? {},
//             maxMonthlyRequests: flat.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests,
//           };

//           const name = flat.providerName ?? record.providerName;
//           if (!name) continue;

//           // Waze and Apple are display/routing providers only — they have no
//           // geocoder budget to track, so skip initProviderData entirely.
//           const isDeepLinkProvider = name === 'wazemap' || name === 'applemap';

//           if (!isDeepLinkProvider) {
//             // Fire-and-forget — don't let a 404 (Strapi permissions) block loading
//             initProviderData(record).then((updated) => {
//               setProviders((prev) => {
//                 if (!prev[name]) return prev;
//                 return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
//               });
//             }).catch(() => {});
//           }

//           let instance = null;

//           if (name === 'wazemap') {
//             console.log('[MapsProvider] creating WazeMapsProvider instance');
//             instance = new WazeMapsProvider();
//           } else if (name === 'applemap') {
//             console.log('[MapsProvider] creating AppleMapsProvider instance');
//             instance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
//           } else {
//             const hasGeoBudget = canUse(record, 'GeocoderHTTPAPI');
//             const hasJSBudget  = canUse(record, 'JavaScriptAPI');
//             console.log(`[MapsProvider] ${name} - hasGeoBudget:${hasGeoBudget} hasJSBudget:${hasJSBudget}`);

//             if (hasGeoBudget || hasJSBudget) {
//               if (name === 'googlemaps') {
//                 console.log('[MapsProvider] creating GoogleMapsProvider instance');
//                 instance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
//               }
//               if (name === 'yandexmaps') {
//                 console.log('[MapsProvider] creating YandexMapsProvider instance');
//                 instance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
//               }
//               if (name === 'geoapify') {
//                 console.log('[MapsProvider] creating GeoapifyProvider instance');
//                 instance = new GeoapifyProvider(process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '');
//               }
//             }
//           }

//           const budget = computeBudget(record);
//           providerMap[name] = { record, instance, budget };
//           console.log(`[MapsProvider] ${name} instance:`, instance ? 'created' : 'null');
//         }

//         // ── Fill in providers from priority list that had no Strapi record ─────
//         // Happens when a provider is in mapsProviders but no api-providers record
//         // exists yet. Synthesise a default record so the provider works without
//         // requiring a manual Strapi creation step.
//         for (const name of list) {
//           if (providerMap[name]) continue; // already loaded from Strapi
//           console.log(`[MapsProvider.load] ${name}: no Strapi record — synthesising default`);

//           const defaultRecord = {
//             id:                 null,
//             providerName:       name,
//             providerData:       buildFreshProviderData(),
//             maxMonthlyRequests: DEFAULTS.maxMonthlyRequests,
//           };

//           let syntheticInstance = null;
//           if (name === 'wazemap') {
//             syntheticInstance = new WazeMapsProvider();
//           } else if (name === 'applemap') {
//             syntheticInstance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
//           } else if (name === 'geoapify') {
//             const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
//             console.log(`[MapsProvider.load] geoapify synthetic — apiKey present:${!!key} | prefix:${key ? key.slice(0,8)+'...' : 'NONE'}`);
//             syntheticInstance = new GeoapifyProvider(key);
//           } else if (name === 'googlemaps') {
//             syntheticInstance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
//           } else if (name === 'yandexmaps') {
//             syntheticInstance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
//           }

//           providerMap[name] = { record: defaultRecord, instance: syntheticInstance, budget: computeBudget(defaultRecord) };
//           console.log(`[MapsProvider.load] ${name} synthetic instance:`, syntheticInstance ? 'created' : 'null (unsupported or missing env key)');
//         }

//         setProviders(providerMap);
//         console.log('[MapsProvider.load] providerMap summary:');
//         Object.entries(providerMap).forEach(([k, v]) => {
//           console.log(`  [MapsProvider.load]   ${k}: instance=${!!v.instance} | token=${v.instance?.token ? v.instance.token.slice(0,15)+'...' : 'N/A'} | budget=${JSON.stringify(v.budget)}`);
//         });

//         const anyActive = list.some((n) => providerMap[n]?.instance != null);
//         setAllExhausted(!anyActive);
//         console.log('[MapsProvider.load] anyActive:', anyActive, '| ready=true incoming');

//       } catch (err) {
//         console.error('[MapsProvider] load error:', err);
//         setAllExhausted(true);
//       } finally {
//         setReady(true);
//       }
//     }

//     load();
//   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Log a request ─────────────────────────────────────────────────────────
//   const logRequest = useCallback((providerName, apiType) => {
//     console.log(`[MapsProvider] logRequest: ${providerName} ${apiType}`);
//     const p = providers[providerName];
//     if (!p) return;

//     const monthKey = getMonthKey();
//     const dayKey   = getDayKey();
//     const bucket   = dailyBucketKey(apiType);

//     const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
//     const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
//     const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

//     monthData[apiType]  = (Number(monthData[apiType]) || 0) + 1;
//     dayData[bucket]     = (Number(dayData[bucket])    || 0) + 1;

//     const updatedProviderData = {
//       ...existing,
//       requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
//       dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
//     };

//     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
//       method:  'PUT',
//       headers: authHeaders(),
//       body:    JSON.stringify({ data: { providerData: updatedProviderData } }),
//     }).catch((err) => console.warn('[MapsProvider] logRequest PUT error:', err));

//     setProviders((prev) => {
//       const cur = prev[providerName];
//       if (!cur) return prev;
//       const updatedRecord = { ...cur.record, providerData: updatedProviderData };
//       return {
//         ...prev,
//         [providerName]: {
//           ...cur,
//           record: updatedRecord,
//           budget: computeBudget(updatedRecord),
//         },
//       };
//     });
//   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

//   const getActiveInstance = useCallback((apiType = 'GeocoderHTTPAPI') => {
//     console.log(`[MapsProvider.getActiveInstance] ▶ apiType=${apiType} | priorityList=[${priorityList.join(', ')}] | providers keys=[${Object.keys(providers).join(', ')}]`);
//     for (const name of priorityList) {
//       const p = providers[name];
//       if (!p) { console.log(`[MapsProvider.getActiveInstance] ${name}: not in providers map`); continue; }
//       if (!p.instance) { console.log(`[MapsProvider.getActiveInstance] ${name}: instance is null`); continue; }

//       if (name === 'wazemap') { console.log(`[MapsProvider.getActiveInstance] ${name}: skipped (no geocoding API)`); continue; }

//       if (name === 'applemap') {
//         const hasToken = !!p.instance?.token;
//         const tokenPrefix = p.instance?.token?.slice(0, 15) || 'NONE';
//         console.log(`[MapsProvider.getActiveInstance] applemap check — apiType:${apiType} | hasToken:${hasToken} | tokenPrefix:${tokenPrefix} | _mkReady:${p.instance?._mkReady}`);
//         if (apiType === 'JavaScriptAPI' && hasToken) {
//           console.log(`[MapsProvider.getActiveInstance] ✅ selected: applemap (MapKit JS)`);
//           return { name, instance: p.instance };
//         }
//         console.log(`[MapsProvider.getActiveInstance] applemap: skipped (apiType=${apiType} or no token)`);
//         continue;
//       }

//       if (name === 'geoapify') {
//         const hasKey = !!p.instance?.apiKey;
//         console.log(`[MapsProvider.getActiveInstance] geoapify check — hasKey:${hasKey} | apiType:${apiType}`);
//         if (!hasKey) { console.log('[MapsProvider.getActiveInstance] geoapify: skipped (no API key)'); continue; }
//         const canUseResult = canUse(p.record, apiType);
//         console.log(`[MapsProvider.getActiveInstance] geoapify: canUse=${canUseResult}`);
//         if (canUseResult) { console.log('[MapsProvider.getActiveInstance] ✅ selected: geoapify'); return { name, instance: p.instance }; }
//         continue;
//       }

//       const canUseResult = canUse(p.record, apiType);
//       console.log(`[MapsProvider.getActiveInstance] ${name}: canUse=${canUseResult}`);
//       if (canUseResult) {
//         console.log(`[MapsProvider.getActiveInstance] ✅ selected: ${name}`);
//         return { name, instance: p.instance };
//       }
//     }
//     console.log(`[MapsProvider.getActiveInstance] ❌ no provider found for ${apiType}`);
//     return null;
//   }, [priorityList, providers]);

//   // ── Public API ────────────────────────────────────────────────────────────

//   const searchPlaces = useCallback(async (query, countryCode = null) => {
//     console.log(`[MapsProvider.searchPlaces] ▶ query="${query}" | countryCode=${countryCode}`);
//     if (!query || query.length < 2) { console.log('[MapsProvider.searchPlaces] query too short — skipping'); return []; }

//     const active = getActiveInstance('JavaScriptAPI');
//     console.log(`[MapsProvider.searchPlaces] getActiveInstance(JavaScriptAPI) returned:`, active ? `{ name: ${active.name}, instance: ${!!active.instance} }` : 'null');

//     if (!active) {
//       console.log('[MapsProvider.searchPlaces] ⚠ no active provider — falling back to Nominatim');
//       return nominatimSearch(query, countryCode);
//     }

//     if (!active.instance?.searchPlaces) {
//       console.log(`[MapsProvider.searchPlaces] ⚠ ${active.name} has no searchPlaces method — falling back to Nominatim`);
//       return nominatimSearch(query, countryCode);
//     }

//     console.log(`[MapsProvider.searchPlaces] calling ${active.name}.searchPlaces...`);
//     try {
//       const results = await active.instance.searchPlaces(query, countryCode);
//       console.log(`[MapsProvider.searchPlaces] ${active.name} returned:`, results === null ? 'null' : results?.length ?? 'undefined', 'results');
//       if (results?.length) {
//         logRequest(active.name, 'JavaScriptAPI');
//         return results;
//       }
//       console.log(`[MapsProvider.searchPlaces] ${active.name} returned empty — falling back to Nominatim`);
//     } catch (err) {
//       console.error(`[MapsProvider.searchPlaces] ❌ ${active.name}.searchPlaces threw:`, err?.message, err);
//     }

//     console.log('[MapsProvider.searchPlaces] using Nominatim fallback');
//     return nominatimSearch(query, countryCode);
//   }, [getActiveInstance, logRequest]);

//   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
//     console.log(`[MapsProvider] getPlaceDetails called for placeId: ${placeId}`, fallbackData);
//     if (fallbackData?.lat != null && fallbackData?.lng != null) {
//       console.log('[MapsProvider] using fast path (fallbackData has coords)');
//       return fallbackData;
//     }

//     const active = getActiveInstance('PlacesAPI');
//     if (active?.instance?.getPlaceDetails) {
//       console.log(`[MapsProvider] using ${active.name}.getPlaceDetails`);
//       try {
//         const result = await active.instance.getPlaceDetails(placeId, fallbackData);
//         if (result) {
//           logRequest(active.name, 'PlacesAPI');
//           console.log(`[MapsProvider] ${active.name} returned:`, result);
//           return result;
//         } else {
//           console.log(`[MapsProvider] ${active.name} returned no result`);
//         }
//       } catch (err) {
//         console.warn(`[MapsProvider] ${active.name}.getPlaceDetails failed — falling back:`, err);
//       }
//     } else {
//       console.log('[MapsProvider] no active provider with getPlaceDetails, returning fallbackData');
//     }

//     return fallbackData;
//   }, [getActiveInstance, logRequest]);

//   const reverseGeocode = useCallback(async (lat, lng) => {
//     console.log(`[MapsProvider] reverseGeocode called for lat: ${lat}, lng: ${lng}`);
//     const active = getActiveInstance('GeocoderHTTPAPI');
//     if (active?.instance?.reverseGeocode) {
//       console.log(`[MapsProvider] using ${active.name}.reverseGeocode`);
//       try {
//         const result = await active.instance.reverseGeocode(lat, lng);
//         if (result) {
//           logRequest(active.name, 'GeocoderHTTPAPI');
//           console.log(`[MapsProvider] ${active.name} returned:`, result);
//           return result;
//         } else {
//           console.log(`[MapsProvider] ${active.name} returned no result`);
//         }
//       } catch (err) {
//         console.warn(`[MapsProvider] ${active.name}.reverseGeocode failed — falling back:`, err);
//       }
//     } else {
//       console.log('[MapsProvider] no active provider with reverseGeocode, falling back to Nominatim');
//     }

//     return nominatimReverse(lat, lng);
//   }, [getActiveInstance, logRequest]);

//   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

//   // ── NEW: getRoute — returns route data OR opens deep-link navigation ──────
//   // For wazemap / applemap: opens the native navigation app, returns null.
//   // For all others: calls local OSRM and returns GeoJSON route.
//   const getRoute = useCallback(async (origin, destination) => {
//     console.log('[MapsProvider] getRoute', origin, '->', destination);

//     // Deep-link based maps handle routing natively
//     if (DEEP_LINK_ROUTING_MAPS.includes(prioritizedMap)) {
//       const provider = Object.values(providers).find(
//         (p) => p?.record?.providerName === prioritizedMap
//       );
//       if (provider?.instance?.openNavigation) {
//         provider.instance.openNavigation(destination, origin);
//         return { type: 'deeplink', provider: prioritizedMap };
//       }
//     }

//     // Local OSRM routing (default for all other maps)
//     if (!localMapUrl) {
//       console.warn('[MapsProvider] localMapUrl not set — cannot compute route');
//       return null;
//     }

//     try {
//       const res = await fetch(
//         `${localMapUrl}/api/route?` +
//         `origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
//       );
//       if (!res.ok) throw new Error(`Route API returned ${res.status}`);
//       const data = await res.json();
//       return {
//         type:          'local',
//         distance:      data.distance,
//         duration:      data.duration,
//         distanceValue: data.distanceValue,
//         durationValue: data.durationValue,
//         geometry:      data.geometry,   // [[lng, lat], ...]
//         steps:         data.steps || [],
//       };
//     } catch (err) {
//       console.error('[MapsProvider] getRoute local error:', err);
//       return null;
//     }
//   }, [prioritizedMap, providers, localMapUrl]);
//   // ─────────────────────────────────────────────────────────────────────────

//   const getProviderStatus = useCallback(() =>
//     priorityList.map((name) => {
//       const p = providers[name];
//       if (!p) return { name, loaded: false };
//       return {
//         name,
//         loaded:      true,
//         hasInstance: !!p.instance,
//         budget:      p.budget,
//         canUseGeo:   canUse(p.record, 'GeocoderHTTPAPI'),
//         canUseJS:    canUse(p.record, 'JavaScriptAPI'),
//       };
//     })
//   , [priorityList, providers]);

//   useEffect(() => {
//     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
//   }, [getProviderStatus]);

//   // Memoised so getActiveInstance (and its canUse logs) only re-runs when
//   // providers or priorityList actually changes — not on every render.
//   const { activeForGeo, activeForJS } = useMemo(() => {
//     const geo = getActiveInstance('GeocoderHTTPAPI')?.name || 'nominatim';
//     const js  = getActiveInstance('JavaScriptAPI')?.name  || 'nominatim';
//     console.log(`[MapsProvider] active providers recalculated — geo:${geo} | js:${js}`);
//     return { activeForGeo: geo, activeForJS: js };
//   }, [getActiveInstance]); // getActiveInstance itself memoised on [priorityList, providers]

//   console.log(`[MapsProvider] context value — ready:${ready} | prioritizedMap:${prioritizedMap} | activeGeo:${activeForGeo} | activeJS:${activeForJS} | providers:[${Object.keys(providers).join(',')}]`);

//   const value = useMemo(() => ({
//     ready,
//     allExhausted,
//     prioritizedMap,
//     activeProviderName: activeForGeo,
//     searchPlaces,
//     getPlaceDetails,
//     reverseGeocode,
//     getInitialLocation,
//     getRoute,
//     getProviderStatus,
//     localMapUrl,
//   }), [ready, allExhausted, prioritizedMap, activeForGeo, searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation, getRoute, getProviderStatus, localMapUrl]); // eslint-disable-line react-hooks/exhaustive-deps

//   return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
// }

// export function useMapProvider() {
//   const ctx = useContext(MapsContext);
//   if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
//   return ctx;
// }

// export default MapsProvider;
// PATH: Okra/Okrarides/driver/components/Map/APIProviders/MapsProvider.jsx
'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMapsProvider } from './GoogleMapsProvider';
import { YandexMapsProvider } from './YandexMapsProvider';
import { WazeMapsProvider }   from './WazeMapsProvider';
import { AppleMapsProvider }  from './AppleMapsProvider';
import { GeoapifyProvider }   from './GeoapifyProvider';

const MapsContext = createContext(null);

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
//
// New shape: [{ name: "google", config: { routing: "routeApi", ... } }, ...]
// Legacy:    ["google:", { routing: "routeApi" }, ...]  (still handled)
// ─────────────────────────────────────────────────────────────────────────────

function parseMapsProviders(rawList) {
  const providerNames   = [];
  const perProviderApis = {};
  const seen            = new Set();

  if (!Array.isArray(rawList)) return { providerNames, perProviderApis };

  const isNewFormat = rawList.length > 0 &&
    typeof rawList[0] === 'object' && rawList[0] !== null && 'name' in rawList[0];

  if (isNewFormat) {
    for (const entry of rawList) {
      if (!entry || typeof entry !== 'object') continue;
      const name   = (entry.name || '').trim();
      const config = (entry.config && typeof entry.config === 'object') ? entry.config : {};
      if (!name) continue;
      if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
      if (Object.keys(config).length > 0) {
        perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
      }
    }
    return { providerNames, perProviderApis };
  }

  // Legacy alternating format
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
    }
  }
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
  maxDailyGeocoderApiRequests:    800,
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

  return {
    monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
    dailyGeoRemaining: Math.max(0, maxDailyGeo - (Number(dayData.geo) || 0)),
    dailyJSRemaining:  Math.max(0, maxDailyJS  - (Number(dayData.js)  || 0)),
    monthlyMax, maxDailyGeo, maxDailyJS,
  };
}

function hasQuota(record, apiType) {
  const name = record?.providerName;
  if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;
  const b = computeBudget(record);
  return (
    b.monthlyRemaining > 0 &&
    (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
    (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER INSTANCE FACTORY
// ─────────────────────────────────────────────────────────────────────────────

function createProviderInstance(name) {
  switch (name) {
    case PROVIDER.WAZE:       return new WazeMapsProvider();
    case PROVIDER.APPLE:      return new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
    case PROVIDER.GOOGLE:     return new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
    case PROVIDER.YANDEX:     return new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
    case PROVIDER.GEOAPIFY:   return new GeoapifyProvider(process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '');
    case PROVIDER.OPENSTREET:
    case PROVIDER.LOCAL:      return null;
    default:
      console.warn(`[MapsProvider] createProviderInstance: unknown provider "${name}"`);
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOMINATIM
// ─────────────────────────────────────────────────────────────────────────────

async function nominatimSearch(query, countryCode = null) {
  try {
    const params = new URLSearchParams({ q: query, format: 'json', limit: '7', addressdetails: '1' });
    if (countryCode) params.set('countrycodes', countryCode);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item) => ({
      place_id:       item.place_id?.toString(),
      main_text:      item.name || item.display_name?.split(',')[0],
      secondary_text: item.display_name,
      lat:            parseFloat(item.lat),
      lng:            parseFloat(item.lon),
      address:        item.display_name,
      name:           item.name || item.display_name?.split(',')[0],
    }));
  } catch { return []; }
}

async function nominatimReverse(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      lat, lng,
      address:  data.display_name,
      name:     data.name || data.display_name?.split(',')[0],
      place_id: `nominatim_${data.place_id}`,
    };
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC OSRM
// ─────────────────────────────────────────────────────────────────────────────

async function osrmRoute(origin, destination) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data  = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('No OSRM route');
    const km  = route.distance / 1000;
    const min = route.duration / 60;
    return {
      type:          'osrm',
      distance:      km  >= 1 ? `${km.toFixed(1)} km`        : `${Math.round(km * 1000)} m`,
      duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
      distanceValue: route.distance,
      durationValue: route.duration,
      geometry:      route.geometry?.coordinates || [],
      steps:         [],
    };
  } catch (err) {
    console.warn('[MapsProvider] Public OSRM failed:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IP GEOLOCATION
// ─────────────────────────────────────────────────────────────────────────────

async function getIPLocation(localServerUrl) {
  if (localServerUrl) {
    try {
      const res = await fetch(`${localServerUrl}/ip-location`);
      if (res.ok) {
        const d = await res.json();
        if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'local' };
      }
    } catch { /* fall through */ }
  }
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const d = await res.json();
      if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'ipapi' };
    }
  } catch { /* fall through */ }
  return { lat: -15.4167, lng: 28.2833, source: 'default' };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPSPROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function MapsProvider({ children }) {
  const [priorityList,        setPriorityList]        = useState([]);
  const [providers,           setProviders]           = useState({});
  const [allExhausted,        setAllExhausted]        = useState(false);
  const [ready,               setReady]               = useState(false);

  const [prioritizedMap,      setPrioritizedMap]      = useState(PROVIDER.OPENSTREET);
  const [prioritizedRoute,    setPrioritizedRoute]    = useState(null);
  const [prioritizedDistance, setPrioritizedDistance] = useState(null);
  const [prioritizedEta,      setPrioritizedEta]      = useState(null);
  const [serviceApis,         setServiceApis]         = useState(DEFAULT_SERVICE_APIS);

  const apiUrl      = process.env.NEXT_PUBLIC_API_URL                       || '';
  const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

  function getToken() {
    try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
    catch { return null; }
  }
  function authHeaders() {
    const token = getToken();
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }

  const initFailures = useRef({});
  const logFailures  = useRef({});

  async function initProviderData(record) {
    if (record.id == null) return { ...record, providerData: buildFreshProviderData() };
    const pd = record.providerData;
    if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) return record;

    const failKey = record.providerName;
    if ((initFailures.current[failKey] || 0) >= 5) {
      return { ...record, providerData: buildFreshProviderData() };
    }
    const freshData = buildFreshProviderData();
    try {
      const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ data: { providerData: freshData } }),
      });
      if (!res.ok) initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
      else         initFailures.current[failKey] = 0;
    } catch {
      initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
    }
    return { ...record, providerData: freshData };
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      if (!apiUrl) { setReady(true); return; }

      try {
        const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
        const pmJson = await pmRes.json();
        const pmRaw  = pmJson?.data ?? {};
        const attrs  = pmRaw.attributes ?? pmRaw;

        const pMap      = attrs.prioritizedMap              ?? PROVIDER.OPENSTREET;
        const pRoute    = attrs.priotizedRouteDrawer        ?? null;
        const pDistance = attrs.priotizedDistanceCalculator ?? null;
        const pEta      = attrs.priotizedEtaCalculator      ?? null;

        console.log('[MapsProvider] assignments — map:', pMap, '| route:', pRoute, '| distance:', pDistance, '| eta:', pEta);

        setPrioritizedMap(pMap);
        setPrioritizedRoute(pRoute);
        setPrioritizedDistance(pDistance);
        setPrioritizedEta(pEta);

        const rawList = attrs.mapsProviders ?? [];
        const { providerNames: list, perProviderApis } = parseMapsProviders(rawList);

        console.log('[MapsProvider] provider list:', list);

        setServiceApis(() => {
          const merged = { ...DEFAULT_SERVICE_APIS };
          for (const [provName, apis] of Object.entries(perProviderApis)) {
            merged[provName] = { ...(DEFAULT_SERVICE_APIS[provName] || {}), ...apis };
          }
          return merged;
        });

        setPriorityList(list);
        if (!list.length) { setReady(true); return; }

        const queryableNames = list.filter((n) => !INLINE_PROVIDERS.has(n));
        const providerMap    = {};

        if (queryableNames.length > 0) {
          const filterParams = queryableNames
            .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
            .join('&');
          const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
          const provJson = await provRes.json();

          for (const item of (provJson?.data ?? [])) {
            const flat = item.attributes ?? item;
            const name = flat.providerName;
            if (!name) continue;

            const record = {
              id:                 item.id,
              providerName:       name,
              providerData:       flat.providerData       ?? {},
              maxMonthlyRequests: flat.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests,
            };

            if (!DEEP_LINK_PROVIDERS.has(name)) {
              initProviderData(record).then((updated) => {
                setProviders((prev) => {
                  if (!prev[name]) return prev;
                  return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
                });
              }).catch(() => {});
            }

            providerMap[name] = { record, instance: createProviderInstance(name), budget: computeBudget(record) };
          }
        }

        for (const name of list) {
          if (providerMap[name]) continue;
          const defaultRecord = {
            id: null, providerName: name,
            providerData: buildFreshProviderData(),
            maxMonthlyRequests: QUOTA_DEFAULTS.maxMonthlyRequests,
          };
          providerMap[name] = {
            record: defaultRecord,
            instance: createProviderInstance(name),
            budget: computeBudget(defaultRecord),
          };
        }

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
  }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── logRequest — circuit-breaks after 3 consecutive failures ─────────────

  const logRequest = useCallback((providerName, apiType) => {
    const p = providers[providerName];
    if (!p || p.record.id == null) return;

    const failKey   = `${providerName}:${p.record.id}`;
    const failCount = logFailures.current[failKey] || 0;
    if (failCount >= 3) return;

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

    fetch(`${apiUrl}/api-providers/${p.record.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ data: { providerData: updatedProviderData } }),
    })
      .then((res) => {
        if (!res.ok) {
          logFailures.current[failKey] = failCount + 1;
          if (failCount === 0) console.warn(
            `[MapsProvider] logRequest PUT ${res.status} for "${providerName}".`,
            res.status === 404 ? 'Grant update on api-providers in Strapi → Settings → Roles.' : `HTTP ${res.status}`,
          );
        } else {
          logFailures.current[failKey] = 0;
        }
      })
      .catch(() => { logFailures.current[failKey] = failCount + 1; });

    setProviders((prev) => {
      const cur = prev[providerName];
      if (!cur) return prev;
      const updatedRecord = { ...cur.record, providerData: updatedProviderData };
      return { ...prev, [providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) } };
    });
  }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Provider resolution ───────────────────────────────────────────────────
  // Returns { name, instance, record, apiMethod } | null

  const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
    const apiType = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';

    const isUsable = (name) => {
      if (failedSet.has(name)) return false;
      if (INLINE_PROVIDERS.has(name)) return true;
      if (DEEP_LINK_PROVIDERS.has(name)) return !!providers[name]?.instance;
      const p = providers[name];
      if (!p?.instance) return false;
      return hasQuota(p.record, apiType);
    };

    const toEntry = (name) => ({
      name,
      instance:  providers[name]?.instance ?? null,
      record:    providers[name]?.record   ?? null,
      apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
    });

    // 1. Explicit provider — bypass priority list
    if (explicitName && isUsable(explicitName)) {
      return toEntry(explicitName);
    }

    // 2. Priority list walk
    for (const name of priorityList) {
      if (name === explicitName) continue;
      if (name === PROVIDER.LOCAL && failedSet.has(PROVIDER.LOCAL)) {
        if (isUsable(PROVIDER.OPENSTREET)) return toEntry(PROVIDER.OPENSTREET);
        continue;
      }
      if (isUsable(name)) return toEntry(name);
    }

    return null;
  }, [priorityList, providers, serviceApis]);

  // ── Local OSRM helper ─────────────────────────────────────────────────────

  const fetchLocalRoute = useCallback(async (origin, destination) => {
    if (!localMapUrl) throw new Error('localMapUrl not configured');
    const res = await fetch(
      `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
    );
    if (!res.ok) throw new Error(`Local route API ${res.status}`);
    const data = await res.json();
    return {
      type: 'local',
      distance:      data.distance,
      duration:      data.duration,
      distanceValue: data.distanceValue,
      durationValue: data.durationValue,
      geometry:      data.geometry ?? [],
      steps:         data.steps   ?? [],
    };
  }, [localMapUrl]);

  // ── Generic service runner ────────────────────────────────────────────────

  const runWithFallback = useCallback(async ({
    serviceType,
    explicitProvider,
    handler,
    finalFallback = async () => null,
  }) => {
    const failed      = new Set();
    const maxAttempts = priorityList.length + 2;

    for (let i = 0; i < maxAttempts; i++) {
      const p = resolveServiceProvider(
        failed.has(explicitProvider) ? null : explicitProvider,
        serviceType,
        failed,
      );
      if (!p) break;

      try {
        const result = await handler(p);
        if (result != null) return result;
        failed.add(p.name);
      } catch (err) {
        console.warn(`[MapsProvider.${serviceType}] "${p.name}" threw:`, err.message);
        failed.add(p.name);
      }
    }

    return finalFallback();
  }, [priorityList, resolveServiceProvider]);

  // ── Public API ────────────────────────────────────────────────────────────

  const searchPlaces = useCallback(async (query, countryCode = null) => {
    if (!query || query.length < 2) return [];
    return runWithFallback({
      serviceType: 'autoComplete', explicitProvider: null,
      handler: async (p) => {
        if (DEEP_LINK_PROVIDERS.has(p.name) && !p.apiMethod) return null;
        if (INLINE_PROVIDERS.has(p.name)) {
          const r = await nominatimSearch(query, countryCode);
          return r.length ? r : null;
        }
        if (!p.instance?.searchPlaces) return null;
        // Inject viewport bias from the active map display
        if (typeof window !== 'undefined' && window.__googleMapsViewport) {
          const vp = window.__googleMapsViewport;
          if (p.instance.setViewport) p.instance.setViewport(vp.lat, vp.lng, vp.radiusM, vp.regionCode || countryCode);
          else if (p.instance.setCenter) p.instance.setCenter(vp.lat, vp.lng);
        }
        const results = await p.instance.searchPlaces(query, countryCode, p.apiMethod);
        if (results?.length) { logRequest(p.name, 'JavaScriptAPI'); return results; }
        return null;
      },
      finalFallback: () => nominatimSearch(query, countryCode),
    });
  }, [runWithFallback, logRequest]);

  const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
    if (fallbackData?.lat != null && fallbackData?.lng != null) return fallbackData;
    return runWithFallback({
      serviceType: 'location', explicitProvider: null,
      handler: async (p) => {
        if (INLINE_PROVIDERS.has(p.name)) return fallbackData;
        if (!p.instance?.getPlaceDetails) return null;
        const result = await p.instance.getPlaceDetails(placeId, fallbackData, p.apiMethod);
        if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        return null;
      },
      finalFallback: async () => fallbackData,
    });
  }, [runWithFallback, logRequest]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    return runWithFallback({
      serviceType: 'location', explicitProvider: null,
      handler: async (p) => {
        if (INLINE_PROVIDERS.has(p.name)) return nominatimReverse(lat, lng);
        if (!p.instance?.reverseGeocode) return null;
        const result = await p.instance.reverseGeocode(lat, lng, p.apiMethod);
        if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        return null;
      },
      finalFallback: () => nominatimReverse(lat, lng),
    });
  }, [runWithFallback, logRequest]);

  const getRoute = useCallback(async (origin, destination) => {
    return runWithFallback({
      serviceType: 'routing', explicitProvider: prioritizedRoute,
      handler: async (p) => {
        if (DEEP_LINK_PROVIDERS.has(p.name) && p.instance?.openNavigation) {
          p.instance.openNavigation(destination, origin);
          return { type: 'deeplink', provider: p.name };
        }
        if (p.name === PROVIDER.LOCAL)      return fetchLocalRoute(origin, destination);
        if (p.name === PROVIDER.OPENSTREET) return osrmRoute(origin, destination);
        if (!p.instance?.getRoute) return null;
        const result = await p.instance.getRoute(origin, destination, p.apiMethod);
        if (result) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        return null;
      },
      finalFallback: () => osrmRoute(origin, destination),
    });
  }, [prioritizedRoute, runWithFallback, fetchLocalRoute, logRequest]);

  const calculateDistance = useCallback(async (origin, destination) => {
    return runWithFallback({
      serviceType: 'distance', explicitProvider: prioritizedDistance,
      handler: async (p) => {
        if (p.name === PROVIDER.LOCAL) {
          const r = await fetchLocalRoute(origin, destination);
          return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
        }
        if (p.name === PROVIDER.OPENSTREET) {
          const r = await osrmRoute(origin, destination);
          return r ? { distanceValue: r.distanceValue, distance: r.distance } : null;
        }
        if (!p.instance?.calculateDistance) return null;
        const result = await p.instance.calculateDistance(origin, destination, p.apiMethod);
        if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        return null;
      },
      finalFallback: async () => {
        const R = 6371;
        const dLat = (destination.lat - origin.lat) * Math.PI / 180;
        const dLon = (destination.lng - origin.lng) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;
        const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { distanceValue: Math.round(km * 1000), distance: km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m` };
      },
    });
  }, [prioritizedDistance, runWithFallback, fetchLocalRoute, logRequest]);

  const calculateEta = useCallback(async (origin, destination) => {
    return runWithFallback({
      serviceType: 'eta', explicitProvider: prioritizedEta,
      handler: async (p) => {
        if (p.name === PROVIDER.LOCAL) {
          const r = await fetchLocalRoute(origin, destination);
          return r ? { durationValue: r.durationValue, duration: r.duration } : null;
        }
        if (p.name === PROVIDER.OPENSTREET) {
          const r = await osrmRoute(origin, destination);
          return r ? { durationValue: r.durationValue, duration: r.duration } : null;
        }
        if (!p.instance?.calculateEta) return null;
        const result = await p.instance.calculateEta(origin, destination, p.apiMethod);
        if (result != null) { logRequest(p.name, 'GeocoderHTTPAPI'); return result; }
        return null;
      },
      finalFallback: async () => null,
    });
  }, [prioritizedEta, runWithFallback, fetchLocalRoute, logRequest]);

  const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

  const getProviderStatus = useCallback(() =>
    priorityList.map((name) => {
      const p = providers[name];
      if (!p) return { name, loaded: false };
      return {
        name,
        loaded:      true,
        hasInstance: !!p.instance || INLINE_PROVIDERS.has(name),
        budget:      p.budget,
        serviceApis: serviceApis[name] ?? null,
        canUseGeo:   hasQuota(p.record, 'GeocoderHTTPAPI'),
        canUseJS:    hasQuota(p.record, 'JavaScriptAPI'),
      };
    }),
  [priorityList, providers, serviceApis]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
  }, [getProviderStatus]);

  const value = useMemo(() => ({
    ready,
    allExhausted,
    prioritizedMap,
    prioritizedRoute,
    prioritizedDistance,
    prioritizedEta,
    serviceApis,
    searchPlaces,
    getPlaceDetails,
    reverseGeocode,
    getInitialLocation,
    getRoute,
    calculateDistance,
    calculateEta,
    getProviderStatus,
    localMapUrl,
  }), [
    ready, allExhausted,
    prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta,
    serviceApis,
    searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
    getRoute, calculateDistance, calculateEta,
    getProviderStatus, localMapUrl,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
}

export function useMapProvider() {
  const ctx = useContext(MapsContext);
  if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
  return ctx;
}

export default MapsProvider;