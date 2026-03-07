// // // // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx

// // // // // // 'use client';

// // // // // // import { createContext, useContext, useEffect, useState, useCallback } from 'react';
// // // // // // import { GoogleMapsProvider } from './GoogleMapsProvider';
// // // // // // import { YandexMapsProvider } from './YandexMapsProvider';
// // // // // // import { WazeMapsProvider }   from './WazeMapsProvider';
// // // // // // import { AppleMapsProvider }  from './AppleMapsProvider';

// // // // // // const MapsContext = createContext(null);

// // // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // // DATE HELPERS
// // // // // // // Keys are ISO strings so sorting / comparison works naturally:
// // // // // // //   month key  → "2026-03"
// // // // // // //   day key    → "2026-03-02"
// // // // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // // // function getMonthKey() {
// // // // // //   const d = new Date();
// // // // // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// // // // // // }

// // // // // // function getDayKey() {
// // // // // //   const d = new Date();
// // // // // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// // // // // // }

// // // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // // DEFAULT LIMITS
// // // // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // // // const DEFAULTS = {
// // // // // //   maxMonthlyRequests:            20000,
// // // // // //   maxDailyGeocoderApiRequests:     800,
// // // // // //   maxDailyJSApiRequests:         20000,
// // // // // // };

// // // // // // function dailyBucketKey(apiType) {
// // // // // //   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// // // // // // }

// // // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // // PROVIDER DATA SCHEMA
// // // // // // //
// // // // // // // providerData = {
// // // // // // //   maxDailyGeocoderApiRequests: 800,
// // // // // // //   maxDailyJSApiRequests:       20000,
// // // // // // //   requestCounts: { "2026-03": { GeocoderHTTPAPI: 12, JavaScriptAPI: 4 } }
// // // // // // //   dailyCounts:   { "2026-03-02": { geo: 3, js: 1 } }
// // // // // // // }
// // // // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // // // function buildFreshProviderData() {
// // // // // //   return {
// // // // // //     maxDailyGeocoderApiRequests: DEFAULTS.maxDailyGeocoderApiRequests,
// // // // // //     maxDailyJSApiRequests:       DEFAULTS.maxDailyJSApiRequests,
// // // // // //     requestCounts: {},
// // // // // //     dailyCounts:   {},
// // // // // //   };
// // // // // // }

// // // // // // function computeBudget(record) {
// // // // // //   const pd       = record.providerData || {};
// // // // // //   const monthKey = getMonthKey();
// // // // // //   const dayKey   = getDayKey();

// // // // // //   const monthData   = pd.requestCounts?.[monthKey] || {};
// // // // // //   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
// // // // // //   const monthlyMax  = record.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests;

// // // // // //   const dayData      = pd.dailyCounts?.[dayKey] || {};
// // // // // //   const dailyGeoUsed = Number(dayData.geo) || 0;
// // // // // //   const dailyJSUsed  = Number(dayData.js)  || 0;

// // // // // //   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || DEFAULTS.maxDailyGeocoderApiRequests;
// // // // // //   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || DEFAULTS.maxDailyJSApiRequests;

// // // // // //   return {
// // // // // //     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
// // // // // //     dailyGeoRemaining: Math.max(0, maxDailyGeo - dailyGeoUsed),
// // // // // //     dailyJSRemaining:  Math.max(0, maxDailyJS  - dailyJSUsed),
// // // // // //     monthlyMax,
// // // // // //     maxDailyGeo,
// // // // // //     maxDailyJS,
// // // // // //   };
// // // // // // }

// // // // // // function canUse(record, apiType) {
// // // // // //   const b = computeBudget(record);
// // // // // //   const result =
// // // // // //     b.monthlyRemaining > 0 &&
// // // // // //     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
// // // // // //     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0);
// // // // // //   console.log(`[MapsProvider] canUse(${record?.providerName}, ${apiType}): ${result}`, {
// // // // // //     monthlyRemaining: b.monthlyRemaining,
// // // // // //     dailyJSRemaining: b.dailyJSRemaining,
// // // // // //     dailyGeoRemaining: b.dailyGeoRemaining
// // // // // //   });
// // // // // //   return result;
// // // // // // }

// // // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // // NOMINATIM FALLBACKS
// // // // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // // // async function nominatimSearch(query, countryCode = null) {
// // // // // //   try {
// // // // // //     const params = new URLSearchParams({ q: query, format: 'json', limit: '7', addressdetails: '1' });
// // // // // //     if (countryCode) params.set('countrycodes', countryCode);
// // // // // //     const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
// // // // // //       headers: { 'Accept-Language': 'en' },
// // // // // //     });
// // // // // //     if (!res.ok) return [];
// // // // // //     const data = await res.json();
// // // // // //     return data.map((item) => ({
// // // // // //       place_id:       item.place_id?.toString(),
// // // // // //       main_text:      item.name || item.display_name?.split(',')[0],
// // // // // //       secondary_text: item.display_name,
// // // // // //       lat:            parseFloat(item.lat),
// // // // // //       lng:            parseFloat(item.lon),
// // // // // //       address:        item.display_name,
// // // // // //       name:           item.name || item.display_name?.split(',')[0],
// // // // // //     }));
// // // // // //   } catch { return []; }
// // // // // // }

// // // // // // async function nominatimReverse(lat, lng) {
// // // // // //   try {
// // // // // //     const res = await fetch(
// // // // // //       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
// // // // // //       { headers: { 'Accept-Language': 'en' } }
// // // // // //     );
// // // // // //     if (!res.ok) return null;
// // // // // //     const data = await res.json();
// // // // // //     return {
// // // // // //       lat, lng,
// // // // // //       address:  data.display_name,
// // // // // //       name:     data.name || data.display_name?.split(',')[0],
// // // // // //       place_id: `nominatim_${data.place_id}`,
// // // // // //     };
// // // // // //   } catch { return null; }
// // // // // // }

// // // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // // IP GEOLOCATION
// // // // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // // // async function getIPLocation(localServerUrl) {
// // // // // //   if (localServerUrl) {
// // // // // //     try {
// // // // // //       const res = await fetch(`${localServerUrl}/ip-location`);
// // // // // //       if (res.ok) {
// // // // // //         const d = await res.json();
// // // // // //         if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'local' };
// // // // // //       }
// // // // // //     } catch { /* fall through */ }
// // // // // //   }
// // // // // //   try {
// // // // // //     const res = await fetch('https://ipapi.co/json/');
// // // // // //     if (res.ok) {
// // // // // //       const d = await res.json();
// // // // // //       if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'ipapi' };
// // // // // //     }
// // // // // //   } catch { /* fall through */ }
// // // // // //   return { lat: -15.4167, lng: 28.2833, source: 'default' };
// // // // // // }

// // // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // // PROVIDERS THAT HANDLE THEIR OWN ROUTING (deep-link based)
// // // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // const DEEP_LINK_ROUTING_MAPS = ['wazemap', 'applemap'];

// // // // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // // // // MASPROVIDER COMPONENT
// // // // // // // ─────────────────────────────────────────────────────────────────────────────

// // // // // // export function MapsProvider({ children }) {
// // // // // //   const [priorityList,   setPriorityList]   = useState([]);
// // // // // //   const [providers,      setProviders]      = useState({});
// // // // // //   const [allExhausted,   setAllExhausted]   = useState(false);
// // // // // //   const [ready,          setReady]          = useState(false);
// // // // // //   // ── NEW: which map to display on screen ───────────────────────────────────
// // // // // //   // Populated from Strapi apiProvidersPriorityMap.prioritizedMap
// // // // // //   // Values: 'wazemap' | 'openstreetmap' | 'localmap' | 'yandexmap' | 'googlemap' | 'applemap'
// // // // // //   const [prioritizedMap, setPrioritizedMap] = useState('openstreetmap');

// // // // // //   const apiUrl      = process.env.NEXT_PUBLIC_API_URL      || '';
// // // // // //   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

// // // // // //   // ── Auth ────────────────────────────────────────────────────────────────
// // // // // //   function getToken() {
// // // // // //     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
// // // // // //     catch { return null; }
// // // // // //   }
// // // // // //   function authHeaders() {
// // // // // //     const token = getToken();
// // // // // //     return {
// // // // // //       'Content-Type': 'application/json',
// // // // // //       ...(token ? { Authorization: `Bearer ${token}` } : {}),
// // // // // //     };
// // // // // //   }

// // // // // //   async function initProviderData(record) {
// // // // // //     console.log('[MapsProvider] initProviderData for', record.providerName);
// // // // // //     const pd = record.providerData;
// // // // // //     const isEmpty = !pd || typeof pd !== 'object' || Object.keys(pd).length === 0;
// // // // // //     if (!isEmpty) {
// // // // // //       console.log('[MapsProvider] providerData already exists');
// // // // // //       return record;
// // // // // //     }

// // // // // //     const freshData = buildFreshProviderData();

// // // // // //     try {
// // // // // //       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
// // // // // //         method: 'PUT',
// // // // // //         headers: authHeaders(),
// // // // // //         body: JSON.stringify({ data: { providerData: freshData } }),
// // // // // //       });

// // // // // //       if (!res.ok) {
// // // // // //         console.warn(`[MapsProvider] initProviderData PUT failed for ${record.providerName}:`, res.status);
// // // // // //       } else {
// // // // // //         console.info(`[MapsProvider] Initialized empty providerData for ${record.providerName}`);
// // // // // //       }
// // // // // //     } catch (err) {
// // // // // //       console.warn('[MapsProvider] initProviderData network error (non-fatal):', err);
// // // // // //     }

// // // // // //     return { ...record, providerData: freshData };
// // // // // //   }

// // // // // //   // ── Load priority + provider records ────────────────────────────────────
// // // // // //   useEffect(() => {
// // // // // //     async function load() {
// // // // // //       console.log('[MapsProvider] load started');
// // // // // //       if (!apiUrl) { setReady(true); return; }

// // // // // //       try {
// // // // // //         // 1. Priority map (single type)
// // // // // //         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
// // // // // //         const pmJson = await pmRes.json();
// // // // // //         console.log('[MapsProvider] raw priority-map response:', JSON.stringify(pmJson));
// // // // // //         const pmRaw  = pmJson?.data || {};
// // // // // //         const list   = pmRaw.mapsProviders ?? pmRaw.attributes?.mapsProviders ?? [];

// // // // // //         // ── Read prioritizedMap — try every casing Strapi might return ──
// // // // // //         const pMap =
// // // // // //           pmRaw.priotizedMap          ||   // actual Strapi field name (typo in schema)
// // // // // //           pmRaw.prioritizedMap        ||
// // // // // //           pmRaw.attributes?.prioritizedMap ||
// // // // // //           pmRaw.attributes?.priotizedMap   ||
// // // // // //           pmRaw.prioritized_map       ||
// // // // // //           pmRaw.attributes?.prioritized_map ||
// // // // // //           pmRaw.PrioritizedMap        ||
// // // // // //           list[0]                     ||   // fall back to first provider in list
// // // // // //           'openstreetmap';
// // // // // //         console.log('[MapsProvider] prioritizedMap resolved to:', pMap, '(raw keys:', Object.keys(pmRaw), ')');
// // // // // //         setPrioritizedMap(pMap);
// // // // // //         // ────────────────────────────────────────────────────────────────

// // // // // //         console.log('[MapsProvider] priority list:', list);
// // // // // //         setPriorityList(list);
// // // // // //         if (!list.length) { setReady(true); return; }

// // // // // //         // 2. Provider records
// // // // // //         const filterParams = list
// // // // // //           .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
// // // // // //           .join('&');

// // // // // //         const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
// // // // // //         const provJson = await provRes.json();
// // // // // //         const rawItems = provJson?.data || [];
// // // // // //         console.log('[MapsProvider] provider records:', rawItems);

// // // // // //         const providerMap = {};

// // // // // //         for (const item of rawItems) {
// // // // // //           const flat = item.attributes ?? item;

// // // // // //           let record = {
// // // // // //             id:                 item.id,
// // // // // //             providerName:       flat.providerName,
// // // // // //             providerData:       flat.providerData       ?? {},
// // // // // //             maxMonthlyRequests: flat.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests,
// // // // // //           };

// // // // // //           const name = flat.providerName ?? record.providerName;
// // // // // //           if (!name) continue;

// // // // // //           // Waze and Apple are display/routing providers only — they have no
// // // // // //           // geocoder budget to track, so skip initProviderData entirely.
// // // // // //           const isDeepLinkProvider = name === 'wazemap' || name === 'applemap';

// // // // // //           if (!isDeepLinkProvider) {
// // // // // //             // Fire-and-forget — don't let a 404 (Strapi permissions) block loading
// // // // // //             initProviderData(record).then((updated) => {
// // // // // //               setProviders((prev) => {
// // // // // //                 if (!prev[name]) return prev;
// // // // // //                 return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
// // // // // //               });
// // // // // //             }).catch(() => {});
// // // // // //           }

// // // // // //           let instance = null;

// // // // // //           if (name === 'wazemap') {
// // // // // //             console.log('[MapsProvider] creating WazeMapsProvider instance');
// // // // // //             instance = new WazeMapsProvider();
// // // // // //           } else if (name === 'applemap') {
// // // // // //             console.log('[MapsProvider] creating AppleMapsProvider instance');
// // // // // //             instance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
// // // // // //           } else {
// // // // // //             const hasGeoBudget = canUse(record, 'GeocoderHTTPAPI');
// // // // // //             const hasJSBudget  = canUse(record, 'JavaScriptAPI');
// // // // // //             console.log(`[MapsProvider] ${name} - hasGeoBudget:${hasGeoBudget} hasJSBudget:${hasJSBudget}`);

// // // // // //             if (hasGeoBudget || hasJSBudget) {
// // // // // //               if (name === 'googlemaps') {
// // // // // //                 console.log('[MapsProvider] creating GoogleMapsProvider instance');
// // // // // //                 instance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
// // // // // //               }
// // // // // //               if (name === 'yandexmaps') {
// // // // // //                 console.log('[MapsProvider] creating YandexMapsProvider instance');
// // // // // //                 instance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
// // // // // //               }
// // // // // //             }
// // // // // //           }

// // // // // //           const budget = computeBudget(record);
// // // // // //           providerMap[name] = { record, instance, budget };
// // // // // //           console.log(`[MapsProvider] ${name} instance:`, instance ? 'created' : 'null');
// // // // // //         }

// // // // // //         setProviders(providerMap);
// // // // // //         console.log('[MapsProvider.load] providerMap summary:');
// // // // // //         Object.entries(providerMap).forEach(([k, v]) => {
// // // // // //           console.log(`  [MapsProvider.load]   ${k}: instance=${!!v.instance} | token=${v.instance?.token ? v.instance.token.slice(0,15)+'...' : 'N/A'} | budget=${JSON.stringify(v.budget)}`);
// // // // // //         });

// // // // // //         const anyActive = list.some((n) => providerMap[n]?.instance != null);
// // // // // //         setAllExhausted(!anyActive);
// // // // // //         console.log('[MapsProvider.load] anyActive:', anyActive, '| ready=true incoming');

// // // // // //       } catch (err) {
// // // // // //         console.error('[MapsProvider] load error:', err);
// // // // // //         setAllExhausted(true);
// // // // // //       } finally {
// // // // // //         setReady(true);
// // // // // //       }
// // // // // //     }

// // // // // //     load();
// // // // // //   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // // // // //   // ── Log a request ─────────────────────────────────────────────────────────
// // // // // //   const logRequest = useCallback((providerName, apiType) => {
// // // // // //     console.log(`[MapsProvider] logRequest: ${providerName} ${apiType}`);
// // // // // //     const p = providers[providerName];
// // // // // //     if (!p) return;

// // // // // //     const monthKey = getMonthKey();
// // // // // //     const dayKey   = getDayKey();
// // // // // //     const bucket   = dailyBucketKey(apiType);

// // // // // //     const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
// // // // // //     const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
// // // // // //     const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

// // // // // //     monthData[apiType]  = (Number(monthData[apiType]) || 0) + 1;
// // // // // //     dayData[bucket]     = (Number(dayData[bucket])    || 0) + 1;

// // // // // //     const updatedProviderData = {
// // // // // //       ...existing,
// // // // // //       requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
// // // // // //       dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
// // // // // //     };

// // // // // //     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
// // // // // //       method:  'PUT',
// // // // // //       headers: authHeaders(),
// // // // // //       body:    JSON.stringify({ data: { providerData: updatedProviderData } }),
// // // // // //     }).catch((err) => console.warn('[MapsProvider] logRequest PUT error:', err));

// // // // // //     setProviders((prev) => {
// // // // // //       const cur = prev[providerName];
// // // // // //       if (!cur) return prev;
// // // // // //       const updatedRecord = { ...cur.record, providerData: updatedProviderData };
// // // // // //       return {
// // // // // //         ...prev,
// // // // // //         [providerName]: {
// // // // // //           ...cur,
// // // // // //           record: updatedRecord,
// // // // // //           budget: computeBudget(updatedRecord),
// // // // // //         },
// // // // // //       };
// // // // // //     });
// // // // // //   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // // // // //   const getActiveInstance = useCallback((apiType = 'GeocoderHTTPAPI') => {
// // // // // //     console.log(`[MapsProvider.getActiveInstance] ▶ apiType=${apiType} | priorityList=[${priorityList.join(', ')}] | providers keys=[${Object.keys(providers).join(', ')}]`);
// // // // // //     for (const name of priorityList) {
// // // // // //       const p = providers[name];
// // // // // //       if (!p) { console.log(`[MapsProvider.getActiveInstance] ${name}: not in providers map`); continue; }
// // // // // //       if (!p.instance) { console.log(`[MapsProvider.getActiveInstance] ${name}: instance is null`); continue; }

// // // // // //       if (name === 'wazemap') { console.log(`[MapsProvider.getActiveInstance] ${name}: skipped (no geocoding API)`); continue; }

// // // // // //       if (name === 'applemap') {
// // // // // //         const hasToken = !!p.instance?.token;
// // // // // //         const tokenPrefix = p.instance?.token?.slice(0, 15) || 'NONE';
// // // // // //         console.log(`[MapsProvider.getActiveInstance] applemap check — apiType:${apiType} | hasToken:${hasToken} | tokenPrefix:${tokenPrefix} | _mkReady:${p.instance?._mkReady}`);
// // // // // //         if (apiType === 'JavaScriptAPI' && hasToken) {
// // // // // //           console.log(`[MapsProvider.getActiveInstance] ✅ selected: applemap (MapKit JS)`);
// // // // // //           return { name, instance: p.instance };
// // // // // //         }
// // // // // //         console.log(`[MapsProvider.getActiveInstance] applemap: skipped (apiType=${apiType} or no token)`);
// // // // // //         continue;
// // // // // //       }

// // // // // //       const canUseResult = canUse(p.record, apiType);
// // // // // //       console.log(`[MapsProvider.getActiveInstance] ${name}: canUse=${canUseResult}`);
// // // // // //       if (canUseResult) {
// // // // // //         console.log(`[MapsProvider.getActiveInstance] ✅ selected: ${name}`);
// // // // // //         return { name, instance: p.instance };
// // // // // //       }
// // // // // //     }
// // // // // //     console.log(`[MapsProvider.getActiveInstance] ❌ no provider found for ${apiType}`);
// // // // // //     return null;
// // // // // //   }, [priorityList, providers]);

// // // // // //   // ── Public API ────────────────────────────────────────────────────────────

// // // // // //   const searchPlaces = useCallback(async (query, countryCode = null) => {
// // // // // //     console.log(`[MapsProvider.searchPlaces] ▶ query="${query}" | countryCode=${countryCode}`);
// // // // // //     if (!query || query.length < 2) { console.log('[MapsProvider.searchPlaces] query too short — skipping'); return []; }

// // // // // //     const active = getActiveInstance('JavaScriptAPI');
// // // // // //     console.log(`[MapsProvider.searchPlaces] getActiveInstance(JavaScriptAPI) returned:`, active ? `{ name: ${active.name}, instance: ${!!active.instance} }` : 'null');

// // // // // //     if (!active) {
// // // // // //       console.log('[MapsProvider.searchPlaces] ⚠ no active provider — falling back to Nominatim');
// // // // // //       return nominatimSearch(query, countryCode);
// // // // // //     }

// // // // // //     if (!active.instance?.searchPlaces) {
// // // // // //       console.log(`[MapsProvider.searchPlaces] ⚠ ${active.name} has no searchPlaces method — falling back to Nominatim`);
// // // // // //       return nominatimSearch(query, countryCode);
// // // // // //     }

// // // // // //     console.log(`[MapsProvider.searchPlaces] calling ${active.name}.searchPlaces...`);
// // // // // //     try {
// // // // // //       const results = await active.instance.searchPlaces(query, countryCode);
// // // // // //       console.log(`[MapsProvider.searchPlaces] ${active.name} returned:`, results === null ? 'null' : results?.length ?? 'undefined', 'results');
// // // // // //       if (results?.length) {
// // // // // //         logRequest(active.name, 'JavaScriptAPI');
// // // // // //         return results;
// // // // // //       }
// // // // // //       console.log(`[MapsProvider.searchPlaces] ${active.name} returned empty — falling back to Nominatim`);
// // // // // //     } catch (err) {
// // // // // //       console.error(`[MapsProvider.searchPlaces] ❌ ${active.name}.searchPlaces threw:`, err?.message, err);
// // // // // //     }

// // // // // //     console.log('[MapsProvider.searchPlaces] using Nominatim fallback');
// // // // // //     return nominatimSearch(query, countryCode);
// // // // // //   }, [getActiveInstance, logRequest]);

// // // // // //   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
// // // // // //     console.log(`[MapsProvider] getPlaceDetails called for placeId: ${placeId}`, fallbackData);
// // // // // //     if (fallbackData?.lat != null && fallbackData?.lng != null) {
// // // // // //       console.log('[MapsProvider] using fast path (fallbackData has coords)');
// // // // // //       return fallbackData;
// // // // // //     }

// // // // // //     const active = getActiveInstance('PlacesAPI');
// // // // // //     if (active?.instance?.getPlaceDetails) {
// // // // // //       console.log(`[MapsProvider] using ${active.name}.getPlaceDetails`);
// // // // // //       try {
// // // // // //         const result = await active.instance.getPlaceDetails(placeId, fallbackData);
// // // // // //         if (result) {
// // // // // //           logRequest(active.name, 'PlacesAPI');
// // // // // //           console.log(`[MapsProvider] ${active.name} returned:`, result);
// // // // // //           return result;
// // // // // //         } else {
// // // // // //           console.log(`[MapsProvider] ${active.name} returned no result`);
// // // // // //         }
// // // // // //       } catch (err) {
// // // // // //         console.warn(`[MapsProvider] ${active.name}.getPlaceDetails failed — falling back:`, err);
// // // // // //       }
// // // // // //     } else {
// // // // // //       console.log('[MapsProvider] no active provider with getPlaceDetails, returning fallbackData');
// // // // // //     }

// // // // // //     return fallbackData;
// // // // // //   }, [getActiveInstance, logRequest]);

// // // // // //   const reverseGeocode = useCallback(async (lat, lng) => {
// // // // // //     console.log(`[MapsProvider] reverseGeocode called for lat: ${lat}, lng: ${lng}`);
// // // // // //     const active = getActiveInstance('GeocoderHTTPAPI');
// // // // // //     if (active?.instance?.reverseGeocode) {
// // // // // //       console.log(`[MapsProvider] using ${active.name}.reverseGeocode`);
// // // // // //       try {
// // // // // //         const result = await active.instance.reverseGeocode(lat, lng);
// // // // // //         if (result) {
// // // // // //           logRequest(active.name, 'GeocoderHTTPAPI');
// // // // // //           console.log(`[MapsProvider] ${active.name} returned:`, result);
// // // // // //           return result;
// // // // // //         } else {
// // // // // //           console.log(`[MapsProvider] ${active.name} returned no result`);
// // // // // //         }
// // // // // //       } catch (err) {
// // // // // //         console.warn(`[MapsProvider] ${active.name}.reverseGeocode failed — falling back:`, err);
// // // // // //       }
// // // // // //     } else {
// // // // // //       console.log('[MapsProvider] no active provider with reverseGeocode, falling back to Nominatim');
// // // // // //     }

// // // // // //     return nominatimReverse(lat, lng);
// // // // // //   }, [getActiveInstance, logRequest]);

// // // // // //   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

// // // // // //   // ── NEW: getRoute — returns route data OR opens deep-link navigation ──────
// // // // // //   // For wazemap / applemap: opens the native navigation app, returns null.
// // // // // //   // For all others: calls local OSRM and returns GeoJSON route.
// // // // // //   const getRoute = useCallback(async (origin, destination) => {
// // // // // //     console.log('[MapsProvider] getRoute', origin, '->', destination);

// // // // // //     // Deep-link based maps handle routing natively
// // // // // //     if (DEEP_LINK_ROUTING_MAPS.includes(prioritizedMap)) {
// // // // // //       const provider = Object.values(providers).find(
// // // // // //         (p) => p?.record?.providerName === prioritizedMap
// // // // // //       );
// // // // // //       if (provider?.instance?.openNavigation) {
// // // // // //         provider.instance.openNavigation(destination, origin);
// // // // // //         return { type: 'deeplink', provider: prioritizedMap };
// // // // // //       }
// // // // // //     }

// // // // // //     // Local OSRM routing (default for all other maps)
// // // // // //     if (!localMapUrl) {
// // // // // //       console.warn('[MapsProvider] localMapUrl not set — cannot compute route');
// // // // // //       return null;
// // // // // //     }

// // // // // //     try {
// // // // // //       const res = await fetch(
// // // // // //         `${localMapUrl}/api/route?` +
// // // // // //         `origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
// // // // // //       );
// // // // // //       if (!res.ok) throw new Error(`Route API returned ${res.status}`);
// // // // // //       const data = await res.json();
// // // // // //       return {
// // // // // //         type:          'local',
// // // // // //         distance:      data.distance,
// // // // // //         duration:      data.duration,
// // // // // //         distanceValue: data.distanceValue,
// // // // // //         durationValue: data.durationValue,
// // // // // //         geometry:      data.geometry,   // [[lng, lat], ...]
// // // // // //         steps:         data.steps || [],
// // // // // //       };
// // // // // //     } catch (err) {
// // // // // //       console.error('[MapsProvider] getRoute local error:', err);
// // // // // //       return null;
// // // // // //     }
// // // // // //   }, [prioritizedMap, providers, localMapUrl]);
// // // // // //   // ─────────────────────────────────────────────────────────────────────────

// // // // // //   const getProviderStatus = useCallback(() =>
// // // // // //     priorityList.map((name) => {
// // // // // //       const p = providers[name];
// // // // // //       if (!p) return { name, loaded: false };
// // // // // //       return {
// // // // // //         name,
// // // // // //         loaded:      true,
// // // // // //         hasInstance: !!p.instance,
// // // // // //         budget:      p.budget,
// // // // // //         canUseGeo:   canUse(p.record, 'GeocoderHTTPAPI'),
// // // // // //         canUseJS:    canUse(p.record, 'JavaScriptAPI'),
// // // // // //       };
// // // // // //     })
// // // // // //   , [priorityList, providers]);

// // // // // //   useEffect(() => {
// // // // // //     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
// // // // // //   }, [getProviderStatus]);

// // // // // //   const activeForGeo = getActiveInstance('GeocoderHTTPAPI')?.name || 'nominatim';
// // // // // //   const activeForJS  = getActiveInstance('JavaScriptAPI')?.name  || 'nominatim';
// // // // // //   console.log(`[MapsProvider] context value — ready:${ready} | prioritizedMap:${prioritizedMap} | activeGeo:${activeForGeo} | activeJS:${activeForJS} | providers:[${Object.keys(providers).join(',')}]`);

// // // // // //   const value = {
// // // // // //     ready,
// // // // // //     allExhausted,
// // // // // //     prioritizedMap,
// // // // // //     activeProviderName: activeForGeo,
// // // // // //     searchPlaces,
// // // // // //     getPlaceDetails,
// // // // // //     reverseGeocode,
// // // // // //     getInitialLocation,
// // // // // //     getRoute,
// // // // // //     getProviderStatus,
// // // // // //     localMapUrl,
// // // // // //   };

// // // // // //   return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
// // // // // // }

// // // // // // export function useMapProvider() {
// // // // // //   const ctx = useContext(MapsContext);
// // // // // //   if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
// // // // // //   return ctx;
// // // // // // }

// // // // // // export default MapsProvider;
// // // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx
// // // // // // Changes vs previous version:
// // // // // //  1. logRequest: debounced setProviders (100ms) — stops a re-render per keystroke
// // // // // //  2. logRequest: skips setProviders when PUT returns 404 (Strapi permissions issue)
// // // // // //  3. AppleMapsProvider.setCenter() called after map loads so search bias stays current

// // // // // 'use client';

// // // // // import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
// // // // // import { GoogleMapsProvider } from './GoogleMapsProvider';
// // // // // import { YandexMapsProvider } from './YandexMapsProvider';
// // // // // import { WazeMapsProvider }   from './WazeMapsProvider';
// // // // // import { AppleMapsProvider }  from './AppleMapsProvider';

// // // // // const MapsContext = createContext(null);

// // // // // // ── DATE HELPERS ─────────────────────────────────────────────────────────────
// // // // // function getMonthKey() {
// // // // //   const d = new Date();
// // // // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// // // // // }
// // // // // function getDayKey() {
// // // // //   const d = new Date();
// // // // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// // // // // }

// // // // // // ── DEFAULT LIMITS ────────────────────────────────────────────────────────────
// // // // // const DEFAULTS = {
// // // // //   maxMonthlyRequests:          20000,
// // // // //   maxDailyGeocoderApiRequests:   800,
// // // // //   maxDailyJSApiRequests:       20000,
// // // // // };

// // // // // function dailyBucketKey(apiType) {
// // // // //   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// // // // // }

// // // // // function buildFreshProviderData() {
// // // // //   return {
// // // // //     maxDailyGeocoderApiRequests: DEFAULTS.maxDailyGeocoderApiRequests,
// // // // //     maxDailyJSApiRequests:       DEFAULTS.maxDailyJSApiRequests,
// // // // //     requestCounts: {},
// // // // //     dailyCounts:   {},
// // // // //   };
// // // // // }

// // // // // function computeBudget(record) {
// // // // //   const pd       = record.providerData || {};
// // // // //   const monthKey = getMonthKey();
// // // // //   const dayKey   = getDayKey();

// // // // //   const monthData   = pd.requestCounts?.[monthKey] || {};
// // // // //   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
// // // // //   const monthlyMax  = record.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests;

// // // // //   const dayData      = pd.dailyCounts?.[dayKey] || {};
// // // // //   const dailyGeoUsed = Number(dayData.geo) || 0;
// // // // //   const dailyJSUsed  = Number(dayData.js)  || 0;

// // // // //   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || DEFAULTS.maxDailyGeocoderApiRequests;
// // // // //   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || DEFAULTS.maxDailyJSApiRequests;

// // // // //   return {
// // // // //     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
// // // // //     dailyGeoRemaining: Math.max(0, maxDailyGeo - dailyGeoUsed),
// // // // //     dailyJSRemaining:  Math.max(0, maxDailyJS  - dailyJSUsed),
// // // // //     monthlyMax,
// // // // //     maxDailyGeo,
// // // // //     maxDailyJS,
// // // // //   };
// // // // // }

// // // // // function canUse(record, apiType) {
// // // // //   const b = computeBudget(record);
// // // // //   const result =
// // // // //     b.monthlyRemaining > 0 &&
// // // // //     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
// // // // //     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0);
// // // // //   console.log(`[MapsProvider] canUse(${record?.providerName}, ${apiType}): ${result}`, {
// // // // //     monthlyRemaining:  b.monthlyRemaining,
// // // // //     dailyJSRemaining:  b.dailyJSRemaining,
// // // // //     dailyGeoRemaining: b.dailyGeoRemaining,
// // // // //   });
// // // // //   return result;
// // // // // }

// // // // // // ── NOMINATIM FALLBACKS ───────────────────────────────────────────────────────
// // // // // async function nominatimSearch(query, countryCode = null) {
// // // // //   try {
// // // // //     const params = new URLSearchParams({ q: query, format: 'json', limit: '7', addressdetails: '1' });
// // // // //     if (countryCode) params.set('countrycodes', countryCode);
// // // // //     const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
// // // // //       headers: { 'Accept-Language': 'en' },
// // // // //     });
// // // // //     if (!res.ok) return [];
// // // // //     const data = await res.json();
// // // // //     return data.map((item) => ({
// // // // //       place_id:       item.place_id?.toString(),
// // // // //       main_text:      item.name || item.display_name?.split(',')[0],
// // // // //       secondary_text: item.display_name,
// // // // //       lat:            parseFloat(item.lat),
// // // // //       lng:            parseFloat(item.lon),
// // // // //       address:        item.display_name,
// // // // //       name:           item.name || item.display_name?.split(',')[0],
// // // // //     }));
// // // // //   } catch { return []; }
// // // // // }

// // // // // async function nominatimReverse(lat, lng) {
// // // // //   try {
// // // // //     const res = await fetch(
// // // // //       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
// // // // //       { headers: { 'Accept-Language': 'en' } }
// // // // //     );
// // // // //     if (!res.ok) return null;
// // // // //     const data = await res.json();
// // // // //     return {
// // // // //       lat, lng,
// // // // //       address:  data.display_name,
// // // // //       name:     data.name || data.display_name?.split(',')[0],
// // // // //       place_id: `nominatim_${data.place_id}`,
// // // // //     };
// // // // //   } catch { return null; }
// // // // // }

// // // // // // ── IP GEOLOCATION ────────────────────────────────────────────────────────────
// // // // // async function getIPLocation(localServerUrl) {
// // // // //   if (localServerUrl) {
// // // // //     try {
// // // // //       const res = await fetch(`${localServerUrl}/ip-location`);
// // // // //       if (res.ok) {
// // // // //         const d = await res.json();
// // // // //         if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'local' };
// // // // //       }
// // // // //     } catch { /* fall through */ }
// // // // //   }
// // // // //   try {
// // // // //     const res = await fetch('https://ipapi.co/json/');
// // // // //     if (res.ok) {
// // // // //       const d = await res.json();
// // // // //       if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'ipapi' };
// // // // //     }
// // // // //   } catch { /* fall through */ }
// // // // //   return { lat: -15.4167, lng: 28.2833, source: 'default' };
// // // // // }

// // // // // // ── PROVIDERS THAT HANDLE THEIR OWN ROUTING ───────────────────────────────────
// // // // // const DEEP_LINK_ROUTING_MAPS = ['wazemap', 'applemap'];

// // // // // // ── MAPSPROVIDER ──────────────────────────────────────────────────────────────
// // // // // export function MapsProvider({ children }) {
// // // // //   const [priorityList,   setPriorityList]   = useState([]);
// // // // //   const [providers,      setProviders]      = useState({});
// // // // //   const [allExhausted,   setAllExhausted]   = useState(false);
// // // // //   const [ready,          setReady]          = useState(false);
// // // // //   const [prioritizedMap, setPrioritizedMap] = useState('openstreetmap');

// // // // //   // FIX: ref to hold pending setProviders updates so we can debounce them
// // // // //   const pendingProviderUpdate = useRef(null);
// // // // //   const pendingUpdateTimer    = useRef(null);

// // // // //   const apiUrl      = process.env.NEXT_PUBLIC_API_URL                          || '';
// // // // //   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL    || '';

// // // // //   // ── Auth ──────────────────────────────────────────────────────────────────
// // // // //   function getToken() {
// // // // //     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
// // // // //     catch { return null; }
// // // // //   }
// // // // //   function authHeaders() {
// // // // //     const token = getToken();
// // // // //     return {
// // // // //       'Content-Type': 'application/json',
// // // // //       ...(token ? { Authorization: `Bearer ${token}` } : {}),
// // // // //     };
// // // // //   }

// // // // //   async function initProviderData(record) {
// // // // //     console.log('[MapsProvider] initProviderData for', record.providerName);
// // // // //     const pd = record.providerData;
// // // // //     const isEmpty = !pd || typeof pd !== 'object' || Object.keys(pd).length === 0;
// // // // //     if (!isEmpty) return record;

// // // // //     const freshData = buildFreshProviderData();

// // // // //     try {
// // // // //       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
// // // // //         method: 'PUT',
// // // // //         headers: authHeaders(),
// // // // //         body: JSON.stringify({ data: { providerData: freshData } }),
// // // // //       });
// // // // //       if (!res.ok) {
// // // // //         console.warn(`[MapsProvider] initProviderData PUT failed for ${record.providerName}:`, res.status);
// // // // //       }
// // // // //     } catch (err) {
// // // // //       console.warn('[MapsProvider] initProviderData network error (non-fatal):', err);
// // // // //     }

// // // // //     return { ...record, providerData: freshData };
// // // // //   }

// // // // //   // ── Load priority + provider records ──────────────────────────────────────
// // // // //   useEffect(() => {
// // // // //     async function load() {
// // // // //       console.log('[MapsProvider] load started');
// // // // //       if (!apiUrl) { setReady(true); return; }

// // // // //       try {
// // // // //         // 1. Priority map
// // // // //         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
// // // // //         const pmJson = await pmRes.json();
// // // // //         console.log('[MapsProvider] raw priority-map response:', JSON.stringify(pmJson));
// // // // //         const pmRaw = pmJson?.data || {};
// // // // //         const list  = pmRaw.mapsProviders ?? pmRaw.attributes?.mapsProviders ?? [];

// // // // //         const pMap =
// // // // //           pmRaw.priotizedMap               ||
// // // // //           pmRaw.prioritizedMap             ||
// // // // //           pmRaw.attributes?.prioritizedMap ||
// // // // //           pmRaw.attributes?.priotizedMap   ||
// // // // //           pmRaw.prioritized_map            ||
// // // // //           pmRaw.attributes?.prioritized_map ||
// // // // //           pmRaw.PrioritizedMap             ||
// // // // //           list[0]                          ||
// // // // //           'openstreetmap';
// // // // //         console.log('[MapsProvider] prioritizedMap resolved to:', pMap, '(raw keys:', Object.keys(pmRaw), ')');
// // // // //         setPrioritizedMap(pMap);
// // // // //         setPriorityList(list);
// // // // //         if (!list.length) { setReady(true); return; }

// // // // //         // 2. Provider records
// // // // //         const filterParams = list
// // // // //           .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
// // // // //           .join('&');
// // // // //         const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
// // // // //         const provJson = await provRes.json();
// // // // //         const rawItems = provJson?.data || [];
// // // // //         console.log('[MapsProvider] provider records:', rawItems);

// // // // //         const providerMap = {};

// // // // //         for (const item of rawItems) {
// // // // //           const flat = item.attributes ?? item;
// // // // //           let record = {
// // // // //             id:                 item.id,
// // // // //             providerName:       flat.providerName,
// // // // //             providerData:       flat.providerData       ?? {},
// // // // //             maxMonthlyRequests: flat.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests,
// // // // //           };

// // // // //           const name = flat.providerName ?? record.providerName;
// // // // //           if (!name) continue;

// // // // //           const isDeepLinkProvider = name === 'wazemap' || name === 'applemap';
// // // // //           if (!isDeepLinkProvider) {
// // // // //             initProviderData(record).then((updated) => {
// // // // //               setProviders((prev) => {
// // // // //                 if (!prev[name]) return prev;
// // // // //                 return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
// // // // //               });
// // // // //             }).catch(() => {});
// // // // //           }

// // // // //           let instance = null;
// // // // //           if (name === 'wazemap') {
// // // // //             instance = new WazeMapsProvider();
// // // // //           } else if (name === 'applemap') {
// // // // //             instance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
// // // // //           } else {
// // // // //             const hasGeoBudget = canUse(record, 'GeocoderHTTPAPI');
// // // // //             const hasJSBudget  = canUse(record, 'JavaScriptAPI');
// // // // //             if (hasGeoBudget || hasJSBudget) {
// // // // //               if (name === 'googlemaps') instance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
// // // // //               if (name === 'yandexmaps') instance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
// // // // //             }
// // // // //           }

// // // // //           const budget = computeBudget(record);
// // // // //           providerMap[name] = { record, instance, budget };
// // // // //           console.log(`[MapsProvider] ${name} instance:`, instance ? 'created' : 'null');
// // // // //         }

// // // // //         setProviders(providerMap);

// // // // //         const anyActive = list.some((n) => providerMap[n]?.instance != null);
// // // // //         setAllExhausted(!anyActive);
// // // // //         console.log('[MapsProvider.load] anyActive:', anyActive, '| ready=true incoming');

// // // // //       } catch (err) {
// // // // //         console.error('[MapsProvider] load error:', err);
// // // // //         setAllExhausted(true);
// // // // //       } finally {
// // // // //         setReady(true);
// // // // //       }
// // // // //     }
// // // // //     load();
// // // // //   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // // // //   // ── Log a request ─────────────────────────────────────────────────────────
// // // // //   // FIX: debounce setProviders so rapid search keystrokes don't cause a re-render
// // // // //   // per character. Also skip state update entirely when the PUT fails (404).
// // // // //   const logRequest = useCallback((providerName, apiType) => {
// // // // //     console.log(`[MapsProvider] logRequest: ${providerName} ${apiType}`);
// // // // //     const p = providers[providerName];
// // // // //     if (!p) return;

// // // // //     const monthKey = getMonthKey();
// // // // //     const dayKey   = getDayKey();
// // // // //     const bucket   = dailyBucketKey(apiType);

// // // // //     const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
// // // // //     const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
// // // // //     const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

// // // // //     monthData[apiType] = (Number(monthData[apiType]) || 0) + 1;
// // // // //     dayData[bucket]    = (Number(dayData[bucket])    || 0) + 1;

// // // // //     const updatedProviderData = {
// // // // //       ...existing,
// // // // //       requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
// // // // //       dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
// // // // //     };

// // // // //     // FIX: only update React state when the Strapi write succeeds (or if apiUrl is not set).
// // // // //     // This stops the re-render storm caused by 404 responses triggering setProviders every keystroke.
// // // // //     const applyStateUpdate = () => {
// // // // //       // Debounce: accumulate updates and flush in one setState call
// // // // //       pendingProviderUpdate.current = { providerName, updatedProviderData };
// // // // //       clearTimeout(pendingUpdateTimer.current);
// // // // //       pendingUpdateTimer.current = setTimeout(() => {
// // // // //         const pending = pendingProviderUpdate.current;
// // // // //         if (!pending) return;
// // // // //         pendingProviderUpdate.current = null;
// // // // //         setProviders((prev) => {
// // // // //           const cur = prev[pending.providerName];
// // // // //           if (!cur) return prev;
// // // // //           const updatedRecord = { ...cur.record, providerData: pending.updatedProviderData };
// // // // //           return {
// // // // //             ...prev,
// // // // //             [pending.providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) },
// // // // //           };
// // // // //         });
// // // // //       }, 100);
// // // // //     };

// // // // //     if (!apiUrl) {
// // // // //       // No backend configured — update local state only
// // // // //       applyStateUpdate();
// // // // //       return;
// // // // //     }

// // // // //     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
// // // // //       method:  'PUT',
// // // // //       headers: authHeaders(),
// // // // //       body:    JSON.stringify({ data: { providerData: updatedProviderData } }),
// // // // //     })
// // // // //       .then((res) => {
// // // // //         if (res.ok) {
// // // // //           // PUT succeeded — safe to update local state
// // // // //           applyStateUpdate();
// // // // //         } else {
// // // // //           // FIX: PUT failed (e.g. 404 Strapi permissions) — skip state update entirely
// // // // //           // so we don't cause a re-render. The count is lost but the app keeps working.
// // // // //           console.warn(`[MapsProvider] logRequest PUT ${res.status} for ${providerName} — skipping state update`);
// // // // //         }
// // // // //       })
// // // // //       .catch((err) => console.warn('[MapsProvider] logRequest PUT error:', err));

// // // // //   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // // // //   const getActiveInstance = useCallback((apiType = 'GeocoderHTTPAPI') => {
// // // // //     console.log(`[MapsProvider.getActiveInstance] ▶ apiType=${apiType} | priorityList=[${priorityList.join(', ')}] | providers keys=[${Object.keys(providers).join(', ')}]`);
// // // // //     for (const name of priorityList) {
// // // // //       const p = providers[name];
// // // // //       if (!p) { console.log(`[MapsProvider.getActiveInstance] ${name}: not in providers map`); continue; }
// // // // //       if (!p.instance) { console.log(`[MapsProvider.getActiveInstance] ${name}: instance is null`); continue; }

// // // // //       if (name === 'wazemap') { console.log(`[MapsProvider.getActiveInstance] ${name}: skipped (no geocoding API)`); continue; }

// // // // //       if (name === 'applemap') {
// // // // //         const hasToken    = !!p.instance?.token;
// // // // //         const tokenPrefix = p.instance?.token?.slice(0, 15) || 'NONE';
// // // // //         console.log(`[MapsProvider.getActiveInstance] applemap check — apiType:${apiType} | hasToken:${hasToken} | tokenPrefix:${tokenPrefix} | _mkReady:${p.instance?._mkReady}`);
// // // // //         if (apiType === 'JavaScriptAPI' && hasToken) {
// // // // //           console.log(`[MapsProvider.getActiveInstance] ✅ selected: applemap (MapKit JS)`);
// // // // //           return { name, instance: p.instance };
// // // // //         }
// // // // //         console.log(`[MapsProvider.getActiveInstance] applemap: skipped (apiType=${apiType} or no token)`);
// // // // //         continue;
// // // // //       }

// // // // //       const canUseResult = canUse(p.record, apiType);
// // // // //       console.log(`[MapsProvider.getActiveInstance] ${name}: canUse=${canUseResult}`);
// // // // //       if (canUseResult) {
// // // // //         console.log(`[MapsProvider.getActiveInstance] ✅ selected: ${name}`);
// // // // //         return { name, instance: p.instance };
// // // // //       }
// // // // //     }
// // // // //     console.log(`[MapsProvider.getActiveInstance] ❌ no provider found for ${apiType}`);
// // // // //     return null;
// // // // //   }, [priorityList, providers]);

// // // // //   // ── Public API ────────────────────────────────────────────────────────────

// // // // //   const searchPlaces = useCallback(async (query, countryCode = null) => {
// // // // //     console.log(`[MapsProvider.searchPlaces] ▶ query="${query}" | countryCode=${countryCode}`);
// // // // //     if (!query || query.length < 2) return [];

// // // // //     const active = getActiveInstance('JavaScriptAPI');
// // // // //     if (!active) {
// // // // //       console.log('[MapsProvider.searchPlaces] ⚠ no active provider — Nominatim fallback');
// // // // //       return nominatimSearch(query, countryCode);
// // // // //     }
// // // // //     if (!active.instance?.searchPlaces) {
// // // // //       console.log(`[MapsProvider.searchPlaces] ⚠ ${active.name} has no searchPlaces — Nominatim fallback`);
// // // // //       return nominatimSearch(query, countryCode);
// // // // //     }

// // // // //     try {
// // // // //       const results = await active.instance.searchPlaces(query, countryCode);
// // // // //       if (results?.length) {
// // // // //         logRequest(active.name, 'JavaScriptAPI');
// // // // //         return results;
// // // // //       }
// // // // //     } catch (err) {
// // // // //       console.error(`[MapsProvider.searchPlaces] ❌ ${active.name}.searchPlaces threw:`, err?.message);
// // // // //     }

// // // // //     console.log('[MapsProvider.searchPlaces] using Nominatim fallback');
// // // // //     return nominatimSearch(query, countryCode);
// // // // //   }, [getActiveInstance, logRequest]);

// // // // //   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
// // // // //     if (fallbackData?.lat != null && fallbackData?.lng != null) return fallbackData;
// // // // //     const active = getActiveInstance('PlacesAPI');
// // // // //     if (active?.instance?.getPlaceDetails) {
// // // // //       try {
// // // // //         const result = await active.instance.getPlaceDetails(placeId, fallbackData);
// // // // //         if (result) { logRequest(active.name, 'PlacesAPI'); return result; }
// // // // //       } catch (err) {
// // // // //         console.warn(`[MapsProvider] ${active.name}.getPlaceDetails failed:`, err);
// // // // //       }
// // // // //     }
// // // // //     return fallbackData;
// // // // //   }, [getActiveInstance, logRequest]);

// // // // //   const reverseGeocode = useCallback(async (lat, lng) => {
// // // // //     const active = getActiveInstance('GeocoderHTTPAPI');
// // // // //     if (active?.instance?.reverseGeocode) {
// // // // //       try {
// // // // //         const result = await active.instance.reverseGeocode(lat, lng);
// // // // //         if (result) { logRequest(active.name, 'GeocoderHTTPAPI'); return result; }
// // // // //       } catch (err) {
// // // // //         console.warn(`[MapsProvider] ${active.name}.reverseGeocode failed:`, err);
// // // // //       }
// // // // //     }
// // // // //     return nominatimReverse(lat, lng);
// // // // //   }, [getActiveInstance, logRequest]);

// // // // //   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

// // // // //   const getRoute = useCallback(async (origin, destination) => {
// // // // //     if (DEEP_LINK_ROUTING_MAPS.includes(prioritizedMap)) {
// // // // //       const provider = Object.values(providers).find((p) => p?.record?.providerName === prioritizedMap);
// // // // //       if (provider?.instance?.openNavigation) {
// // // // //         provider.instance.openNavigation(destination, origin);
// // // // //         return { type: 'deeplink', provider: prioritizedMap };
// // // // //       }
// // // // //     }
// // // // //     if (!localMapUrl) return null;
// // // // //     try {
// // // // //       const res = await fetch(
// // // // //         `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
// // // // //       );
// // // // //       if (!res.ok) throw new Error(`Route API returned ${res.status}`);
// // // // //       const data = await res.json();
// // // // //       return {
// // // // //         type: 'local', distance: data.distance, duration: data.duration,
// // // // //         distanceValue: data.distanceValue, durationValue: data.durationValue,
// // // // //         geometry: data.geometry, steps: data.steps || [],
// // // // //       };
// // // // //     } catch (err) {
// // // // //       console.error('[MapsProvider] getRoute local error:', err);
// // // // //       return null;
// // // // //     }
// // // // //   }, [prioritizedMap, providers, localMapUrl]);

// // // // //   // FIX: expose a way for the map display to update the AppleMapsProvider center bias
// // // // //   const updateSearchCenter = useCallback((lat, lng) => {
// // // // //     const appleProvider = providers['applemap']?.instance;
// // // // //     if (appleProvider?.setCenter) {
// // // // //       appleProvider.setCenter(lat, lng);
// // // // //     }
// // // // //   }, [providers]);

// // // // //   const getProviderStatus = useCallback(() =>
// // // // //     priorityList.map((name) => {
// // // // //       const p = providers[name];
// // // // //       if (!p) return { name, loaded: false };
// // // // //       return {
// // // // //         name, loaded: true, hasInstance: !!p.instance,
// // // // //         budget: p.budget,
// // // // //         canUseGeo: canUse(p.record, 'GeocoderHTTPAPI'),
// // // // //         canUseJS:  canUse(p.record, 'JavaScriptAPI'),
// // // // //       };
// // // // //     })
// // // // //   , [priorityList, providers]);

// // // // //   useEffect(() => {
// // // // //     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
// // // // //   }, [getProviderStatus]);

// // // // //   const activeForGeo = getActiveInstance('GeocoderHTTPAPI')?.name || 'nominatim';
// // // // //   const activeForJS  = getActiveInstance('JavaScriptAPI')?.name  || 'nominatim';
// // // // //   console.log(`[MapsProvider] context value — ready:${ready} | prioritizedMap:${prioritizedMap} | activeGeo:${activeForGeo} | activeJS:${activeForJS} | providers:[${Object.keys(providers).join(',')}]`);

// // // // //   const value = {
// // // // //     ready,
// // // // //     allExhausted,
// // // // //     prioritizedMap,
// // // // //     activeProviderName: activeForGeo,
// // // // //     searchPlaces,
// // // // //     getPlaceDetails,
// // // // //     reverseGeocode,
// // // // //     getInitialLocation,
// // // // //     getRoute,
// // // // //     getProviderStatus,
// // // // //     updateSearchCenter,  // FIX: exposed so map displays can push viewport center
// // // // //     localMapUrl,
// // // // //   };

// // // // //   return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
// // // // // }

// // // // // export function useMapProvider() {
// // // // //   const ctx = useContext(MapsContext);
// // // // //   if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
// // // // //   return ctx;
// // // // // }

// // // // // export default MapsProvider;
// // // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx
// // // // // Changes vs previous version:
// // // // //  1. logRequest: debounced setProviders (100ms) — stops a re-render per keystroke
// // // // //  2. logRequest: skips setProviders when PUT returns 404 (Strapi permissions issue)
// // // // //  3. AppleMapsProvider.setCenter() called after map loads so search bias stays current

// // // // 'use client';

// // // // import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
// // // // import { GoogleMapsProvider } from './GoogleMapsProvider';
// // // // import { YandexMapsProvider } from './YandexMapsProvider';
// // // // import { WazeMapsProvider }   from './WazeMapsProvider';
// // // // import { AppleMapsProvider }  from './AppleMapsProvider';

// // // // const MapsContext = createContext(null);

// // // // // ── DATE HELPERS ─────────────────────────────────────────────────────────────
// // // // function getMonthKey() {
// // // //   const d = new Date();
// // // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// // // // }
// // // // function getDayKey() {
// // // //   const d = new Date();
// // // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// // // // }

// // // // // ── DEFAULT LIMITS ────────────────────────────────────────────────────────────
// // // // const DEFAULTS = {
// // // //   maxMonthlyRequests:          20000,
// // // //   maxDailyGeocoderApiRequests:   800,
// // // //   maxDailyJSApiRequests:       20000,
// // // // };

// // // // function dailyBucketKey(apiType) {
// // // //   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// // // // }

// // // // function buildFreshProviderData() {
// // // //   return {
// // // //     maxDailyGeocoderApiRequests: DEFAULTS.maxDailyGeocoderApiRequests,
// // // //     maxDailyJSApiRequests:       DEFAULTS.maxDailyJSApiRequests,
// // // //     requestCounts: {},
// // // //     dailyCounts:   {},
// // // //   };
// // // // }

// // // // function computeBudget(record) {
// // // //   const pd       = record.providerData || {};
// // // //   const monthKey = getMonthKey();
// // // //   const dayKey   = getDayKey();

// // // //   const monthData   = pd.requestCounts?.[monthKey] || {};
// // // //   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
// // // //   const monthlyMax  = record.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests;

// // // //   const dayData      = pd.dailyCounts?.[dayKey] || {};
// // // //   const dailyGeoUsed = Number(dayData.geo) || 0;
// // // //   const dailyJSUsed  = Number(dayData.js)  || 0;

// // // //   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || DEFAULTS.maxDailyGeocoderApiRequests;
// // // //   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || DEFAULTS.maxDailyJSApiRequests;

// // // //   return {
// // // //     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
// // // //     dailyGeoRemaining: Math.max(0, maxDailyGeo - dailyGeoUsed),
// // // //     dailyJSRemaining:  Math.max(0, maxDailyJS  - dailyJSUsed),
// // // //     monthlyMax,
// // // //     maxDailyGeo,
// // // //     maxDailyJS,
// // // //   };
// // // // }

// // // // function canUse(record, apiType) {
// // // //   const b = computeBudget(record);
// // // //   const result =
// // // //     b.monthlyRemaining > 0 &&
// // // //     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
// // // //     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0);
// // // //   console.log(`[MapsProvider] canUse(${record?.providerName}, ${apiType}): ${result}`, {
// // // //     monthlyRemaining:  b.monthlyRemaining,
// // // //     dailyJSRemaining:  b.dailyJSRemaining,
// // // //     dailyGeoRemaining: b.dailyGeoRemaining,
// // // //   });
// // // //   return result;
// // // // }

// // // // // ── NOMINATIM FALLBACKS ───────────────────────────────────────────────────────
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
// // // //       { headers: { 'Accept-Language': 'en' } }
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

// // // // // ── IP GEOLOCATION ────────────────────────────────────────────────────────────
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

// // // // // ── PROVIDERS THAT HANDLE THEIR OWN ROUTING ───────────────────────────────────
// // // // const DEEP_LINK_ROUTING_MAPS = ['wazemap', 'applemap'];

// // // // // ── MAPSPROVIDER ──────────────────────────────────────────────────────────────
// // // // export function MapsProvider({ children }) {
// // // //   const [priorityList,   setPriorityList]   = useState([]);
// // // //   const [providers,      setProviders]      = useState({});
// // // //   const [allExhausted,   setAllExhausted]   = useState(false);
// // // //   const [ready,          setReady]          = useState(false);
// // // //   const [prioritizedMap, setPrioritizedMap] = useState('openstreetmap');

// // // //   // FIX: ref to hold pending setProviders updates so we can debounce them
// // // //   const pendingProviderUpdate = useRef(null);
// // // //   const pendingUpdateTimer    = useRef(null);

// // // //   const apiUrl      = process.env.NEXT_PUBLIC_API_URL                          || '';
// // // //   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL    || '';

// // // //   // ── Auth ──────────────────────────────────────────────────────────────────
// // // //   function getToken() {
// // // //     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
// // // //     catch { return null; }
// // // //   }
// // // //   function authHeaders() {
// // // //     const token = getToken();
// // // //     return {
// // // //       'Content-Type': 'application/json',
// // // //       ...(token ? { Authorization: `Bearer ${token}` } : {}),
// // // //     };
// // // //   }

// // // //   async function initProviderData(record) {
// // // //     console.log('[MapsProvider] initProviderData for', record.providerName);
// // // //     const pd = record.providerData;
// // // //     const isEmpty = !pd || typeof pd !== 'object' || Object.keys(pd).length === 0;
// // // //     if (!isEmpty) return record;

// // // //     const freshData = buildFreshProviderData();

// // // //     try {
// // // //       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
// // // //         method: 'PUT',
// // // //         headers: authHeaders(),
// // // //         body: JSON.stringify({ data: { providerData: freshData } }),
// // // //       });
// // // //       if (!res.ok) {
// // // //         console.warn(`[MapsProvider] initProviderData PUT failed for ${record.providerName}:`, res.status);
// // // //       }
// // // //     } catch (err) {
// // // //       console.warn('[MapsProvider] initProviderData network error (non-fatal):', err);
// // // //     }

// // // //     return { ...record, providerData: freshData };
// // // //   }

// // // //   // ── Load priority + provider records ──────────────────────────────────────
// // // //   useEffect(() => {
// // // //     async function load() {
// // // //       console.log('[MapsProvider] load started');
// // // //       if (!apiUrl) { setReady(true); return; }

// // // //       try {
// // // //         // 1. Priority map
// // // //         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
// // // //         const pmJson = await pmRes.json();
// // // //         console.log('[MapsProvider] raw priority-map response:', JSON.stringify(pmJson));
// // // //         const pmRaw = pmJson?.data || {};
// // // //         const list  = pmRaw.mapsProviders ?? pmRaw.attributes?.mapsProviders ?? [];

// // // //         const pMap =
// // // //           pmRaw.priotizedMap               ||
// // // //           pmRaw.prioritizedMap             ||
// // // //           pmRaw.attributes?.prioritizedMap ||
// // // //           pmRaw.attributes?.priotizedMap   ||
// // // //           pmRaw.prioritized_map            ||
// // // //           pmRaw.attributes?.prioritized_map ||
// // // //           pmRaw.PrioritizedMap             ||
// // // //           list[0]                          ||
// // // //           'openstreetmap';
// // // //         console.log('[MapsProvider] prioritizedMap resolved to:', pMap, '(raw keys:', Object.keys(pmRaw), ')');
// // // //         setPrioritizedMap(pMap);
// // // //         setPriorityList(list);
// // // //         if (!list.length) { setReady(true); return; }

// // // //         // 2. Provider records
// // // //         const filterParams = list
// // // //           .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
// // // //           .join('&');
// // // //         const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
// // // //         const provJson = await provRes.json();
// // // //         const rawItems = provJson?.data || [];
// // // //         console.log('[MapsProvider] provider records:', rawItems);

// // // //         const providerMap = {};

// // // //         for (const item of rawItems) {
// // // //           const flat = item.attributes ?? item;
// // // //           let record = {
// // // //             id:                 item.id,
// // // //             providerName:       flat.providerName,
// // // //             providerData:       flat.providerData       ?? {},
// // // //             maxMonthlyRequests: flat.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests,
// // // //           };

// // // //           const name = flat.providerName ?? record.providerName;
// // // //           if (!name) continue;

// // // //           const isDeepLinkProvider = name === 'wazemap' || name === 'applemap';
// // // //           if (!isDeepLinkProvider) {
// // // //             initProviderData(record).then((updated) => {
// // // //               setProviders((prev) => {
// // // //                 if (!prev[name]) return prev;
// // // //                 return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
// // // //               });
// // // //             }).catch(() => {});
// // // //           }

// // // //           let instance = null;
// // // //           if (name === 'wazemap') {
// // // //             instance = new WazeMapsProvider();
// // // //           } else if (name === 'applemap') {
// // // //             instance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
// // // //           } else {
// // // //             const hasGeoBudget = canUse(record, 'GeocoderHTTPAPI');
// // // //             const hasJSBudget  = canUse(record, 'JavaScriptAPI');
// // // //             if (hasGeoBudget || hasJSBudget) {
// // // //               if (name === 'googlemaps') instance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
// // // //               if (name === 'yandexmaps') instance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
// // // //             }
// // // //           }

// // // //           const budget = computeBudget(record);
// // // //           providerMap[name] = { record, instance, budget };
// // // //           console.log(`[MapsProvider] ${name} instance:`, instance ? 'created' : 'null');
// // // //         }

// // // //         setProviders(providerMap);

// // // //         const anyActive = list.some((n) => providerMap[n]?.instance != null);
// // // //         setAllExhausted(!anyActive);
// // // //         console.log('[MapsProvider.load] anyActive:', anyActive, '| ready=true incoming');

// // // //       } catch (err) {
// // // //         console.error('[MapsProvider] load error:', err);
// // // //         setAllExhausted(true);
// // // //       } finally {
// // // //         setReady(true);
// // // //       }
// // // //     }
// // // //     load();
// // // //   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // // //   // ── Log a request ─────────────────────────────────────────────────────────
// // // //   // FIX: debounce setProviders so rapid search keystrokes don't cause a re-render
// // // //   // per character. Also skip state update entirely when the PUT fails (404).
// // // //   const logRequest = useCallback((providerName, apiType) => {
// // // //     console.log(`[MapsProvider] logRequest: ${providerName} ${apiType}`);
// // // //     const p = providers[providerName];
// // // //     if (!p) return;

// // // //     const monthKey = getMonthKey();
// // // //     const dayKey   = getDayKey();
// // // //     const bucket   = dailyBucketKey(apiType);

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

// // // //     // FIX: only update React state when the Strapi write succeeds (or if apiUrl is not set).
// // // //     // This stops the re-render storm caused by 404 responses triggering setProviders every keystroke.
// // // //     const applyStateUpdate = () => {
// // // //       // Debounce: accumulate updates and flush in one setState call
// // // //       pendingProviderUpdate.current = { providerName, updatedProviderData };
// // // //       clearTimeout(pendingUpdateTimer.current);
// // // //       pendingUpdateTimer.current = setTimeout(() => {
// // // //         const pending = pendingProviderUpdate.current;
// // // //         if (!pending) return;
// // // //         pendingProviderUpdate.current = null;
// // // //         setProviders((prev) => {
// // // //           const cur = prev[pending.providerName];
// // // //           if (!cur) return prev;
// // // //           const updatedRecord = { ...cur.record, providerData: pending.updatedProviderData };
// // // //           return {
// // // //             ...prev,
// // // //             [pending.providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) },
// // // //           };
// // // //         });
// // // //       }, 100);
// // // //     };

// // // //     if (!apiUrl) {
// // // //       // No backend configured — update local state only
// // // //       applyStateUpdate();
// // // //       return;
// // // //     }

// // // //     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
// // // //       method:  'PUT',
// // // //       headers: authHeaders(),
// // // //       body:    JSON.stringify({ data: { providerData: updatedProviderData } }),
// // // //     })
// // // //       .then((res) => {
// // // //         if (res.ok) {
// // // //           // PUT succeeded — safe to update local state
// // // //           applyStateUpdate();
// // // //         } else {
// // // //           // FIX: PUT failed (e.g. 404 Strapi permissions) — skip state update entirely
// // // //           // so we don't cause a re-render. The count is lost but the app keeps working.
// // // //           console.warn(`[MapsProvider] logRequest PUT ${res.status} for ${providerName} — skipping state update`);
// // // //         }
// // // //       })
// // // //       .catch((err) => console.warn('[MapsProvider] logRequest PUT error:', err));

// // // //   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // // //   const getActiveInstance = useCallback((apiType = 'GeocoderHTTPAPI') => {
// // // //     console.log(`[MapsProvider.getActiveInstance] ▶ apiType=${apiType} | priorityList=[${priorityList.join(', ')}] | providers keys=[${Object.keys(providers).join(', ')}]`);
// // // //     for (const name of priorityList) {
// // // //       const p = providers[name];
// // // //       if (!p) { console.log(`[MapsProvider.getActiveInstance] ${name}: not in providers map`); continue; }
// // // //       if (!p.instance) { console.log(`[MapsProvider.getActiveInstance] ${name}: instance is null`); continue; }

// // // //       if (name === 'wazemap') { console.log(`[MapsProvider.getActiveInstance] ${name}: skipped (no geocoding API)`); continue; }

// // // //       if (name === 'applemap') {
// // // //         const hasToken    = !!p.instance?.token;
// // // //         const tokenPrefix = p.instance?.token?.slice(0, 15) || 'NONE';
// // // //         console.log(`[MapsProvider.getActiveInstance] applemap check — apiType:${apiType} | hasToken:${hasToken} | tokenPrefix:${tokenPrefix} | _mkReady:${p.instance?._mkReady}`);
// // // //         if (apiType === 'JavaScriptAPI' && hasToken) {
// // // //           console.log(`[MapsProvider.getActiveInstance] ✅ selected: applemap (MapKit JS)`);
// // // //           return { name, instance: p.instance };
// // // //         }
// // // //         console.log(`[MapsProvider.getActiveInstance] applemap: skipped (apiType=${apiType} or no token)`);
// // // //         continue;
// // // //       }

// // // //       const canUseResult = canUse(p.record, apiType);
// // // //       console.log(`[MapsProvider.getActiveInstance] ${name}: canUse=${canUseResult}`);
// // // //       if (canUseResult) {
// // // //         console.log(`[MapsProvider.getActiveInstance] ✅ selected: ${name}`);
// // // //         return { name, instance: p.instance };
// // // //       }
// // // //     }
// // // //     console.log(`[MapsProvider.getActiveInstance] ❌ no provider found for ${apiType}`);
// // // //     return null;
// // // //   }, [priorityList, providers]);

// // // //   // ── Public API ────────────────────────────────────────────────────────────

// // // //   const searchPlaces = useCallback(async (query, countryCode = null) => {
// // // //     console.log(`[MapsProvider.searchPlaces] ▶ query="${query}" | countryCode=${countryCode}`);
// // // //     if (!query || query.length < 2) return [];

// // // //     // Strategy: try providers in this order:
// // // //     //  1. GeocoderHTTPAPI (Yandex) — HTTP-based, geographically accurate
// // // //     //  2. JavaScriptAPI  (Apple)   — JS SDK, can drift without region bias
// // // //     //  3. Nominatim fallback

// // // //     // 1. Try Yandex (or whoever is active GeocoderHTTPAPI)
// // // //     const geoActive = getActiveInstance('GeocoderHTTPAPI');
// // // //     if (geoActive?.instance?.searchPlaces) {
// // // //       try {
// // // //         console.log(`[MapsProvider.searchPlaces] trying GeocoderHTTPAPI provider: ${geoActive.name}`);
// // // //         const results = await geoActive.instance.searchPlaces(query, countryCode);
// // // //         if (results?.length) {
// // // //           console.log(`[MapsProvider.searchPlaces] ${geoActive.name} returned: ${results.length} results`);
// // // //           logRequest(geoActive.name, 'GeocoderHTTPAPI');
// // // //           return results;
// // // //         }
// // // //         console.log(`[MapsProvider.searchPlaces] ${geoActive.name} returned empty`);
// // // //       } catch (err) {
// // // //         console.error(`[MapsProvider.searchPlaces] ❌ ${geoActive.name}.searchPlaces threw:`, err?.message);
// // // //       }
// // // //     }

// // // //     // 2. Try Apple Maps (JavaScriptAPI) — only if Yandex came up empty
// // // //     const jsActive = getActiveInstance('JavaScriptAPI');
// // // //     if (jsActive?.instance?.searchPlaces && jsActive.name !== geoActive?.name) {
// // // //       try {
// // // //         console.log(`[MapsProvider.searchPlaces] trying JavaScriptAPI provider: ${jsActive.name}`);
// // // //         const results = await jsActive.instance.searchPlaces(query, countryCode);
// // // //         if (results?.length) {
// // // //           console.log(`[MapsProvider.searchPlaces] ${jsActive.name} returned: ${results.length} results`);
// // // //           logRequest(jsActive.name, 'JavaScriptAPI');
// // // //           return results;
// // // //         }
// // // //         console.log(`[MapsProvider.searchPlaces] ${jsActive.name} returned empty`);
// // // //       } catch (err) {
// // // //         console.error(`[MapsProvider.searchPlaces] ❌ ${jsActive.name}.searchPlaces threw:`, err?.message);
// // // //       }
// // // //     }

// // // //     // 3. Nominatim fallback
// // // //     console.log('[MapsProvider.searchPlaces] using Nominatim fallback');
// // // //     return nominatimSearch(query, countryCode);
// // // //   }, [getActiveInstance, logRequest]);

// // // //   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
// // // //     if (fallbackData?.lat != null && fallbackData?.lng != null) return fallbackData;
// // // //     const active = getActiveInstance('PlacesAPI');
// // // //     if (active?.instance?.getPlaceDetails) {
// // // //       try {
// // // //         const result = await active.instance.getPlaceDetails(placeId, fallbackData);
// // // //         if (result) { logRequest(active.name, 'PlacesAPI'); return result; }
// // // //       } catch (err) {
// // // //         console.warn(`[MapsProvider] ${active.name}.getPlaceDetails failed:`, err);
// // // //       }
// // // //     }
// // // //     return fallbackData;
// // // //   }, [getActiveInstance, logRequest]);

// // // //   const reverseGeocode = useCallback(async (lat, lng) => {
// // // //     const active = getActiveInstance('GeocoderHTTPAPI');
// // // //     if (active?.instance?.reverseGeocode) {
// // // //       try {
// // // //         const result = await active.instance.reverseGeocode(lat, lng);
// // // //         if (result) { logRequest(active.name, 'GeocoderHTTPAPI'); return result; }
// // // //       } catch (err) {
// // // //         console.warn(`[MapsProvider] ${active.name}.reverseGeocode failed:`, err);
// // // //       }
// // // //     }
// // // //     return nominatimReverse(lat, lng);
// // // //   }, [getActiveInstance, logRequest]);

// // // //   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

// // // //   const getRoute = useCallback(async (origin, destination) => {
// // // //     if (DEEP_LINK_ROUTING_MAPS.includes(prioritizedMap)) {
// // // //       const provider = Object.values(providers).find((p) => p?.record?.providerName === prioritizedMap);
// // // //       if (provider?.instance?.openNavigation) {
// // // //         provider.instance.openNavigation(destination, origin);
// // // //         return { type: 'deeplink', provider: prioritizedMap };
// // // //       }
// // // //     }
// // // //     if (!localMapUrl) return null;
// // // //     try {
// // // //       const res = await fetch(
// // // //         `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
// // // //       );
// // // //       if (!res.ok) throw new Error(`Route API returned ${res.status}`);
// // // //       const data = await res.json();
// // // //       return {
// // // //         type: 'local', distance: data.distance, duration: data.duration,
// // // //         distanceValue: data.distanceValue, durationValue: data.durationValue,
// // // //         geometry: data.geometry, steps: data.steps || [],
// // // //       };
// // // //     } catch (err) {
// // // //       console.error('[MapsProvider] getRoute local error:', err);
// // // //       return null;
// // // //     }
// // // //   }, [prioritizedMap, providers, localMapUrl]);

// // // //   // FIX: expose a way for the map display to update the AppleMapsProvider center bias
// // // //   const updateSearchCenter = useCallback((lat, lng) => {
// // // //     const appleProvider = providers['applemap']?.instance;
// // // //     if (appleProvider?.setCenter) {
// // // //       appleProvider.setCenter(lat, lng);
// // // //     }
// // // //   }, [providers]);

// // // //   const getProviderStatus = useCallback(() =>
// // // //     priorityList.map((name) => {
// // // //       const p = providers[name];
// // // //       if (!p) return { name, loaded: false };
// // // //       return {
// // // //         name, loaded: true, hasInstance: !!p.instance,
// // // //         budget: p.budget,
// // // //         canUseGeo: canUse(p.record, 'GeocoderHTTPAPI'),
// // // //         canUseJS:  canUse(p.record, 'JavaScriptAPI'),
// // // //       };
// // // //     })
// // // //   , [priorityList, providers]);

// // // //   useEffect(() => {
// // // //     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
// // // //   }, [getProviderStatus]);

// // // //   const activeForGeo = getActiveInstance('GeocoderHTTPAPI')?.name || 'nominatim';
// // // //   const activeForJS  = getActiveInstance('JavaScriptAPI')?.name  || 'nominatim';
// // // //   console.log(`[MapsProvider] context value — ready:${ready} | prioritizedMap:${prioritizedMap} | activeGeo:${activeForGeo} | activeJS:${activeForJS} | providers:[${Object.keys(providers).join(',')}]`);

// // // //   const value = {
// // // //     ready,
// // // //     allExhausted,
// // // //     prioritizedMap,
// // // //     activeProviderName: activeForGeo,
// // // //     searchPlaces,
// // // //     getPlaceDetails,
// // // //     reverseGeocode,
// // // //     getInitialLocation,
// // // //     getRoute,
// // // //     getProviderStatus,
// // // //     updateSearchCenter,  // FIX: exposed so map displays can push viewport center
// // // //     localMapUrl,
// // // //   };

// // // //   return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
// // // // }

// // // // export function useMapProvider() {
// // // //   const ctx = useContext(MapsContext);
// // // //   if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
// // // //   return ctx;
// // // // }

// // // // export default MapsProvider;
// // // // PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx
// // // // Changes vs previous version:
// // // //  1. logRequest: debounced setProviders (100ms) — stops a re-render per keystroke
// // // //  2. logRequest: skips setProviders when PUT returns 404 (Strapi permissions issue)
// // // //  3. AppleMapsProvider.setCenter() called after map loads so search bias stays current

// // // 'use client';

// // // import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
// // // import { GoogleMapsProvider } from './GoogleMapsProvider';
// // // import { YandexMapsProvider } from './YandexMapsProvider';
// // // import { WazeMapsProvider }   from './WazeMapsProvider';
// // // import { AppleMapsProvider }  from './AppleMapsProvider';

// // // const MapsContext = createContext(null);

// // // // ── DATE HELPERS ─────────────────────────────────────────────────────────────
// // // function getMonthKey() {
// // //   const d = new Date();
// // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// // // }
// // // function getDayKey() {
// // //   const d = new Date();
// // //   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// // // }

// // // // ── DEFAULT LIMITS ────────────────────────────────────────────────────────────
// // // const DEFAULTS = {
// // //   maxMonthlyRequests:          20000,
// // //   maxDailyGeocoderApiRequests:   800,
// // //   maxDailyJSApiRequests:       20000,
// // // };

// // // function dailyBucketKey(apiType) {
// // //   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// // // }

// // // function buildFreshProviderData() {
// // //   return {
// // //     maxDailyGeocoderApiRequests: DEFAULTS.maxDailyGeocoderApiRequests,
// // //     maxDailyJSApiRequests:       DEFAULTS.maxDailyJSApiRequests,
// // //     requestCounts: {},
// // //     dailyCounts:   {},
// // //   };
// // // }

// // // function computeBudget(record) {
// // //   const pd       = record.providerData || {};
// // //   const monthKey = getMonthKey();
// // //   const dayKey   = getDayKey();

// // //   const monthData   = pd.requestCounts?.[monthKey] || {};
// // //   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
// // //   const monthlyMax  = record.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests;

// // //   const dayData      = pd.dailyCounts?.[dayKey] || {};
// // //   const dailyGeoUsed = Number(dayData.geo) || 0;
// // //   const dailyJSUsed  = Number(dayData.js)  || 0;

// // //   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || DEFAULTS.maxDailyGeocoderApiRequests;
// // //   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || DEFAULTS.maxDailyJSApiRequests;

// // //   return {
// // //     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
// // //     dailyGeoRemaining: Math.max(0, maxDailyGeo - dailyGeoUsed),
// // //     dailyJSRemaining:  Math.max(0, maxDailyJS  - dailyJSUsed),
// // //     monthlyMax,
// // //     maxDailyGeo,
// // //     maxDailyJS,
// // //   };
// // // }

// // // function canUse(record, apiType) {
// // //   const b = computeBudget(record);
// // //   const result =
// // //     b.monthlyRemaining > 0 &&
// // //     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
// // //     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0);
// // //   console.log(`[MapsProvider] canUse(${record?.providerName}, ${apiType}): ${result}`, {
// // //     monthlyRemaining:  b.monthlyRemaining,
// // //     dailyJSRemaining:  b.dailyJSRemaining,
// // //     dailyGeoRemaining: b.dailyGeoRemaining,
// // //   });
// // //   return result;
// // // }

// // // // ── NOMINATIM FALLBACKS ───────────────────────────────────────────────────────
// // // async function nominatimSearch(query, countryCode = null) {
// // //   try {
// // //     const params = new URLSearchParams({ q: query, format: 'json', limit: '7', addressdetails: '1' });
// // //     if (countryCode) params.set('countrycodes', countryCode);
// // //     const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
// // //       headers: { 'Accept-Language': 'en' },
// // //     });
// // //     if (!res.ok) return [];
// // //     const data = await res.json();
// // //     return data.map((item) => ({
// // //       place_id:       item.place_id?.toString(),
// // //       main_text:      item.name || item.display_name?.split(',')[0],
// // //       secondary_text: item.display_name,
// // //       lat:            parseFloat(item.lat),
// // //       lng:            parseFloat(item.lon),
// // //       address:        item.display_name,
// // //       name:           item.name || item.display_name?.split(',')[0],
// // //     }));
// // //   } catch { return []; }
// // // }

// // // async function nominatimReverse(lat, lng) {
// // //   try {
// // //     const res = await fetch(
// // //       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
// // //       { headers: { 'Accept-Language': 'en' } }
// // //     );
// // //     if (!res.ok) return null;
// // //     const data = await res.json();
// // //     return {
// // //       lat, lng,
// // //       address:  data.display_name,
// // //       name:     data.name || data.display_name?.split(',')[0],
// // //       place_id: `nominatim_${data.place_id}`,
// // //     };
// // //   } catch { return null; }
// // // }

// // // // ── IP GEOLOCATION ────────────────────────────────────────────────────────────
// // // async function getIPLocation(localServerUrl) {
// // //   if (localServerUrl) {
// // //     try {
// // //       const res = await fetch(`${localServerUrl}/ip-location`);
// // //       if (res.ok) {
// // //         const d = await res.json();
// // //         if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'local' };
// // //       }
// // //     } catch { /* fall through */ }
// // //   }
// // //   try {
// // //     const res = await fetch('https://ipapi.co/json/');
// // //     if (res.ok) {
// // //       const d = await res.json();
// // //       if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, source: 'ipapi' };
// // //     }
// // //   } catch { /* fall through */ }
// // //   return { lat: -15.4167, lng: 28.2833, source: 'default' };
// // // }

// // // // ── PROVIDERS THAT HANDLE THEIR OWN ROUTING ───────────────────────────────────
// // // const DEEP_LINK_ROUTING_MAPS = ['wazemap', 'applemap'];

// // // // ── MAPSPROVIDER ──────────────────────────────────────────────────────────────
// // // export function MapsProvider({ children }) {
// // //   const [priorityList,   setPriorityList]   = useState([]);
// // //   const [providers,      setProviders]      = useState({});
// // //   const [allExhausted,   setAllExhausted]   = useState(false);
// // //   const [ready,          setReady]          = useState(false);
// // //   const [prioritizedMap, setPrioritizedMap] = useState('openstreetmap');

// // //   // FIX: ref to hold pending setProviders updates so we can debounce them
// // //   const pendingProviderUpdate = useRef(null);
// // //   const pendingUpdateTimer    = useRef(null);

// // //   const apiUrl      = process.env.NEXT_PUBLIC_API_URL                          || '';
// // //   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL    || '';

// // //   // ── Auth ──────────────────────────────────────────────────────────────────
// // //   function getToken() {
// // //     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
// // //     catch { return null; }
// // //   }
// // //   function authHeaders() {
// // //     const token = getToken();
// // //     return {
// // //       'Content-Type': 'application/json',
// // //       ...(token ? { Authorization: `Bearer ${token}` } : {}),
// // //     };
// // //   }

// // //   async function initProviderData(record) {
// // //     console.log('[MapsProvider] initProviderData for', record.providerName);
// // //     const pd = record.providerData;
// // //     const isEmpty = !pd || typeof pd !== 'object' || Object.keys(pd).length === 0;
// // //     if (!isEmpty) return record;

// // //     const freshData = buildFreshProviderData();

// // //     try {
// // //       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
// // //         method: 'PUT',
// // //         headers: authHeaders(),
// // //         body: JSON.stringify({ data: { providerData: freshData } }),
// // //       });
// // //       if (!res.ok) {
// // //         console.warn(`[MapsProvider] initProviderData PUT failed for ${record.providerName}:`, res.status);
// // //       }
// // //     } catch (err) {
// // //       console.warn('[MapsProvider] initProviderData network error (non-fatal):', err);
// // //     }

// // //     return { ...record, providerData: freshData };
// // //   }

// // //   // ── Load priority + provider records ──────────────────────────────────────
// // //   useEffect(() => {
// // //     async function load() {
// // //       console.log('[MapsProvider] load started');
// // //       if (!apiUrl) { setReady(true); return; }

// // //       try {
// // //         // 1. Priority map
// // //         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
// // //         const pmJson = await pmRes.json();
// // //         console.log('[MapsProvider] raw priority-map response:', JSON.stringify(pmJson));
// // //         const pmRaw = pmJson?.data || {};
// // //         const list  = pmRaw.mapsProviders ?? pmRaw.attributes?.mapsProviders ?? [];

// // //         const pMap =
// // //           pmRaw.priotizedMap               ||
// // //           pmRaw.prioritizedMap             ||
// // //           pmRaw.attributes?.prioritizedMap ||
// // //           pmRaw.attributes?.priotizedMap   ||
// // //           pmRaw.prioritized_map            ||
// // //           pmRaw.attributes?.prioritized_map ||
// // //           pmRaw.PrioritizedMap             ||
// // //           list[0]                          ||
// // //           'openstreetmap';
// // //         console.log('[MapsProvider] prioritizedMap resolved to:', pMap, '(raw keys:', Object.keys(pmRaw), ')');
// // //         setPrioritizedMap(pMap);
// // //         setPriorityList(list);
// // //         if (!list.length) { setReady(true); return; }

// // //         // 2. Provider records
// // //         const filterParams = list
// // //           .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
// // //           .join('&');
// // //         const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
// // //         const provJson = await provRes.json();
// // //         const rawItems = provJson?.data || [];
// // //         console.log('[MapsProvider] provider records:', rawItems);

// // //         const providerMap = {};

// // //         for (const item of rawItems) {
// // //           const flat = item.attributes ?? item;
// // //           let record = {
// // //             id:                 item.id,
// // //             providerName:       flat.providerName,
// // //             providerData:       flat.providerData       ?? {},
// // //             maxMonthlyRequests: flat.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests,
// // //           };

// // //           const name = flat.providerName ?? record.providerName;
// // //           if (!name) continue;

// // //           const isDeepLinkProvider = name === 'wazemap' || name === 'applemap';
// // //           if (!isDeepLinkProvider) {
// // //             initProviderData(record).then((updated) => {
// // //               setProviders((prev) => {
// // //                 if (!prev[name]) return prev;
// // //                 return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
// // //               });
// // //             }).catch(() => {});
// // //           }

// // //           let instance = null;
// // //           if (name === 'wazemap') {
// // //             instance = new WazeMapsProvider();
// // //           } else if (name === 'applemap') {
// // //             instance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
// // //           } else {
// // //             const hasGeoBudget = canUse(record, 'GeocoderHTTPAPI');
// // //             const hasJSBudget  = canUse(record, 'JavaScriptAPI');
// // //             if (hasGeoBudget || hasJSBudget) {
// // //               if (name === 'googlemaps') instance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
// // //               if (name === 'yandexmaps') instance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
// // //             }
// // //           }

// // //           const budget = computeBudget(record);
// // //           providerMap[name] = { record, instance, budget };
// // //           console.log(`[MapsProvider] ${name} instance:`, instance ? 'created' : 'null');
// // //         }

// // //         setProviders(providerMap);

// // //         const anyActive = list.some((n) => providerMap[n]?.instance != null);
// // //         setAllExhausted(!anyActive);
// // //         console.log('[MapsProvider.load] anyActive:', anyActive, '| ready=true incoming');

// // //       } catch (err) {
// // //         console.error('[MapsProvider] load error:', err);
// // //         setAllExhausted(true);
// // //       } finally {
// // //         setReady(true);
// // //       }
// // //     }
// // //     load();
// // //   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // //   // ── Log a request ─────────────────────────────────────────────────────────
// // //   // FIX: debounce setProviders so rapid search keystrokes don't cause a re-render
// // //   // per character. Also skip state update entirely when the PUT fails (404).
// // //   const logRequest = useCallback((providerName, apiType) => {
// // //     console.log(`[MapsProvider] logRequest: ${providerName} ${apiType}`);
// // //     const p = providers[providerName];
// // //     if (!p) return;

// // //     const monthKey = getMonthKey();
// // //     const dayKey   = getDayKey();
// // //     const bucket   = dailyBucketKey(apiType);

// // //     const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
// // //     const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
// // //     const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

// // //     monthData[apiType] = (Number(monthData[apiType]) || 0) + 1;
// // //     dayData[bucket]    = (Number(dayData[bucket])    || 0) + 1;

// // //     const updatedProviderData = {
// // //       ...existing,
// // //       requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
// // //       dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
// // //     };

// // //     // FIX: only update React state when the Strapi write succeeds (or if apiUrl is not set).
// // //     // This stops the re-render storm caused by 404 responses triggering setProviders every keystroke.
// // //     const applyStateUpdate = () => {
// // //       // Debounce: accumulate updates and flush in one setState call
// // //       pendingProviderUpdate.current = { providerName, updatedProviderData };
// // //       clearTimeout(pendingUpdateTimer.current);
// // //       pendingUpdateTimer.current = setTimeout(() => {
// // //         const pending = pendingProviderUpdate.current;
// // //         if (!pending) return;
// // //         pendingProviderUpdate.current = null;
// // //         setProviders((prev) => {
// // //           const cur = prev[pending.providerName];
// // //           if (!cur) return prev;
// // //           const updatedRecord = { ...cur.record, providerData: pending.updatedProviderData };
// // //           return {
// // //             ...prev,
// // //             [pending.providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) },
// // //           };
// // //         });
// // //       }, 100);
// // //     };

// // //     if (!apiUrl) {
// // //       // No backend configured — update local state only
// // //       applyStateUpdate();
// // //       return;
// // //     }

// // //     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
// // //       method:  'PUT',
// // //       headers: authHeaders(),
// // //       body:    JSON.stringify({ data: { providerData: updatedProviderData } }),
// // //     })
// // //       .then((res) => {
// // //         if (res.ok) {
// // //           // PUT succeeded — safe to update local state
// // //           applyStateUpdate();
// // //         } else {
// // //           // FIX: PUT failed (e.g. 404 Strapi permissions) — skip state update entirely
// // //           // so we don't cause a re-render. The count is lost but the app keeps working.
// // //           console.warn(`[MapsProvider] logRequest PUT ${res.status} for ${providerName} — skipping state update`);
// // //         }
// // //       })
// // //       .catch((err) => console.warn('[MapsProvider] logRequest PUT error:', err));

// // //   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// // //   const getActiveInstance = useCallback((apiType = 'GeocoderHTTPAPI') => {
// // //     console.log(`[MapsProvider.getActiveInstance] ▶ apiType=${apiType} | priorityList=[${priorityList.join(', ')}] | providers keys=[${Object.keys(providers).join(', ')}]`);
// // //     for (const name of priorityList) {
// // //       const p = providers[name];
// // //       if (!p) { console.log(`[MapsProvider.getActiveInstance] ${name}: not in providers map`); continue; }
// // //       if (!p.instance) { console.log(`[MapsProvider.getActiveInstance] ${name}: instance is null`); continue; }

// // //       if (name === 'wazemap') { console.log(`[MapsProvider.getActiveInstance] ${name}: skipped (no geocoding API)`); continue; }

// // //       if (name === 'applemap') {
// // //         const hasToken    = !!p.instance?.token;
// // //         const tokenPrefix = p.instance?.token?.slice(0, 15) || 'NONE';
// // //         console.log(`[MapsProvider.getActiveInstance] applemap check — apiType:${apiType} | hasToken:${hasToken} | tokenPrefix:${tokenPrefix} | _mkReady:${p.instance?._mkReady}`);
// // //         if (apiType === 'JavaScriptAPI' && hasToken) {
// // //           console.log(`[MapsProvider.getActiveInstance] ✅ selected: applemap (MapKit JS)`);
// // //           return { name, instance: p.instance };
// // //         }
// // //         console.log(`[MapsProvider.getActiveInstance] applemap: skipped (apiType=${apiType} or no token)`);
// // //         continue;
// // //       }

// // //       const canUseResult = canUse(p.record, apiType);
// // //       console.log(`[MapsProvider.getActiveInstance] ${name}: canUse=${canUseResult}`);
// // //       if (canUseResult) {
// // //         console.log(`[MapsProvider.getActiveInstance] ✅ selected: ${name}`);
// // //         return { name, instance: p.instance };
// // //       }
// // //     }
// // //     console.log(`[MapsProvider.getActiveInstance] ❌ no provider found for ${apiType}`);
// // //     return null;
// // //   }, [priorityList, providers]);

// // //   // ── Public API ────────────────────────────────────────────────────────────

// // //   const searchPlaces = useCallback(async (query, countryCode = null) => {
// // //     console.log(`[MapsProvider.searchPlaces] ▶ query="${query}" | countryCode=${countryCode} | prioritizedMap=${prioritizedMap}`);
// // //     if (!query || query.length < 2) return [];

// // //     // Build an ordered list of providers to try for search:
// // //     //  1. The prioritized provider (respects admin config)
// // //     //  2. Any remaining JS API provider
// // //     //  3. Any remaining Geocoder HTTP API provider
// // //     //  4. Nominatim fallback
// // //     const tried = new Set();

// // //     const tryProvider = async (name, apiType) => {
// // //       if (tried.has(name)) return null;
// // //       tried.add(name);
// // //       const p = providers[name];
// // //       if (!p?.instance?.searchPlaces) return null;
// // //       console.log(`[MapsProvider.searchPlaces] trying ${name} (${apiType})`);
// // //       try {
// // //         const results = await p.instance.searchPlaces(query, countryCode);
// // //         if (results?.length) {
// // //           console.log(`[MapsProvider.searchPlaces] ${name} returned: ${results.length} results`);
// // //           logRequest(name, apiType);
// // //           return results;
// // //         }
// // //         console.log(`[MapsProvider.searchPlaces] ${name} returned empty`);
// // //       } catch (err) {
// // //         console.error(`[MapsProvider.searchPlaces] ❌ ${name}.searchPlaces threw:`, err?.message);
// // //       }
// // //       return null;
// // //     };

// // //     // 1. Prioritized provider first
// // //     if (prioritizedMap && prioritizedMap !== 'openstreetmap') {
// // //       const apiType = prioritizedMap === 'applemap' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';
// // //       const result = await tryProvider(prioritizedMap, apiType);
// // //       if (result) return result;
// // //     }

// // //     // 2. Active JavaScriptAPI (Apple) if not already tried
// // //     const jsActive = getActiveInstance('JavaScriptAPI');
// // //     if (jsActive) {
// // //       const result = await tryProvider(jsActive.name, 'JavaScriptAPI');
// // //       if (result) return result;
// // //     }

// // //     // 3. Active GeocoderHTTPAPI (Yandex/Google) if not already tried
// // //     const geoActive = getActiveInstance('GeocoderHTTPAPI');
// // //     if (geoActive) {
// // //       const result = await tryProvider(geoActive.name, 'GeocoderHTTPAPI');
// // //       if (result) return result;
// // //     }

// // //     // 4. Nominatim fallback
// // //     console.log('[MapsProvider.searchPlaces] all providers empty — Nominatim fallback');
// // //     return nominatimSearch(query, countryCode);
// // //   }, [prioritizedMap, providers, getActiveInstance, logRequest]);

// // //   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
// // //     if (fallbackData?.lat != null && fallbackData?.lng != null) return fallbackData;
// // //     const active = getActiveInstance('PlacesAPI');
// // //     if (active?.instance?.getPlaceDetails) {
// // //       try {
// // //         const result = await active.instance.getPlaceDetails(placeId, fallbackData);
// // //         if (result) { logRequest(active.name, 'PlacesAPI'); return result; }
// // //       } catch (err) {
// // //         console.warn(`[MapsProvider] ${active.name}.getPlaceDetails failed:`, err);
// // //       }
// // //     }
// // //     return fallbackData;
// // //   }, [getActiveInstance, logRequest]);

// // //   const reverseGeocode = useCallback(async (lat, lng) => {
// // //     const active = getActiveInstance('GeocoderHTTPAPI');
// // //     if (active?.instance?.reverseGeocode) {
// // //       try {
// // //         const result = await active.instance.reverseGeocode(lat, lng);
// // //         if (result) { logRequest(active.name, 'GeocoderHTTPAPI'); return result; }
// // //       } catch (err) {
// // //         console.warn(`[MapsProvider] ${active.name}.reverseGeocode failed:`, err);
// // //       }
// // //     }
// // //     return nominatimReverse(lat, lng);
// // //   }, [getActiveInstance, logRequest]);

// // //   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

// // //   const getRoute = useCallback(async (origin, destination) => {
// // //     if (DEEP_LINK_ROUTING_MAPS.includes(prioritizedMap)) {
// // //       const provider = Object.values(providers).find((p) => p?.record?.providerName === prioritizedMap);
// // //       if (provider?.instance?.openNavigation) {
// // //         provider.instance.openNavigation(destination, origin);
// // //         return { type: 'deeplink', provider: prioritizedMap };
// // //       }
// // //     }
// // //     if (!localMapUrl) return null;
// // //     try {
// // //       const res = await fetch(
// // //         `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
// // //       );
// // //       if (!res.ok) throw new Error(`Route API returned ${res.status}`);
// // //       const data = await res.json();
// // //       return {
// // //         type: 'local', distance: data.distance, duration: data.duration,
// // //         distanceValue: data.distanceValue, durationValue: data.durationValue,
// // //         geometry: data.geometry, steps: data.steps || [],
// // //       };
// // //     } catch (err) {
// // //       console.error('[MapsProvider] getRoute local error:', err);
// // //       return null;
// // //     }
// // //   }, [prioritizedMap, providers, localMapUrl]);

// // //   // FIX: expose a way for the map display to update the AppleMapsProvider center bias
// // //   const updateSearchCenter = useCallback((lat, lng) => {
// // //     const appleProvider = providers['applemap']?.instance;
// // //     if (appleProvider?.setCenter) {
// // //       appleProvider.setCenter(lat, lng);
// // //     }
// // //   }, [providers]);

// // //   const getProviderStatus = useCallback(() =>
// // //     priorityList.map((name) => {
// // //       const p = providers[name];
// // //       if (!p) return { name, loaded: false };
// // //       return {
// // //         name, loaded: true, hasInstance: !!p.instance,
// // //         budget: p.budget,
// // //         canUseGeo: canUse(p.record, 'GeocoderHTTPAPI'),
// // //         canUseJS:  canUse(p.record, 'JavaScriptAPI'),
// // //       };
// // //     })
// // //   , [priorityList, providers]);

// // //   useEffect(() => {
// // //     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
// // //   }, [getProviderStatus]);

// // //   const activeForGeo = getActiveInstance('GeocoderHTTPAPI')?.name || 'nominatim';
// // //   const activeForJS  = getActiveInstance('JavaScriptAPI')?.name  || 'nominatim';
// // //   console.log(`[MapsProvider] context value — ready:${ready} | prioritizedMap:${prioritizedMap} | activeGeo:${activeForGeo} | activeJS:${activeForJS} | providers:[${Object.keys(providers).join(',')}]`);

// // //   const value = {
// // //     ready,
// // //     allExhausted,
// // //     prioritizedMap,
// // //     activeProviderName: activeForGeo,
// // //     searchPlaces,
// // //     getPlaceDetails,
// // //     reverseGeocode,
// // //     getInitialLocation,
// // //     getRoute,
// // //     getProviderStatus,
// // //     updateSearchCenter,  // FIX: exposed so map displays can push viewport center
// // //     localMapUrl,
// // //   };

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

// // import { createContext, useContext, useEffect, useState, useCallback } from 'react';
// // import { GoogleMapsProvider }  from './GoogleMapsProvider';
// // import { YandexMapsProvider }  from './YandexMapsProvider';
// // import { WazeMapsProvider }    from './WazeMapsProvider';
// // import { AppleMapsProvider }   from './AppleMapsProvider';
// // import { GeoapifyProvider }    from './GeoapifyProvider';

// // const MapsContext = createContext(null);

// // // ─────────────────────────────────────────────────────────────────────────────
// // // DATE HELPERS
// // // Keys are ISO strings so sorting / comparison works naturally:
// // //   month key  → "2026-03"
// // //   day key    → "2026-03-02"
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
// // // DEFAULT LIMITS
// // // ─────────────────────────────────────────────────────────────────────────────

// // const DEFAULTS = {
// //   maxMonthlyRequests:            20000,
// //   maxDailyGeocoderApiRequests:     800,
// //   maxDailyJSApiRequests:         20000,
// // };

// // function dailyBucketKey(apiType) {
// //   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // PROVIDER DATA SCHEMA
// // //
// // // providerData = {
// // //   maxDailyGeocoderApiRequests: 800,
// // //   maxDailyJSApiRequests:       20000,
// // //   requestCounts: { "2026-03": { GeocoderHTTPAPI: 12, JavaScriptAPI: 4 } }
// // //   dailyCounts:   { "2026-03-02": { geo: 3, js: 1 } }
// // // }
// // // ─────────────────────────────────────────────────────────────────────────────

// // function buildFreshProviderData() {
// //   return {
// //     maxDailyGeocoderApiRequests: DEFAULTS.maxDailyGeocoderApiRequests,
// //     maxDailyJSApiRequests:       DEFAULTS.maxDailyJSApiRequests,
// //     requestCounts: {},
// //     dailyCounts:   {},
// //   };
// // }

// // function computeBudget(record) {
// //   const pd       = record.providerData || {};
// //   const monthKey = getMonthKey();
// //   const dayKey   = getDayKey();

// //   const monthData   = pd.requestCounts?.[monthKey] || {};
// //   const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
// //   const monthlyMax  = record.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests;

// //   const dayData      = pd.dailyCounts?.[dayKey] || {};
// //   const dailyGeoUsed = Number(dayData.geo) || 0;
// //   const dailyJSUsed  = Number(dayData.js)  || 0;

// //   const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || DEFAULTS.maxDailyGeocoderApiRequests;
// //   const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || DEFAULTS.maxDailyJSApiRequests;

// //   return {
// //     monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
// //     dailyGeoRemaining: Math.max(0, maxDailyGeo - dailyGeoUsed),
// //     dailyJSRemaining:  Math.max(0, maxDailyJS  - dailyJSUsed),
// //     monthlyMax,
// //     maxDailyGeo,
// //     maxDailyJS,
// //   };
// // }

// // function canUse(record, apiType) {
// //   const b = computeBudget(record);
// //   const result =
// //     b.monthlyRemaining > 0 &&
// //     (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
// //     (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0);
// //   console.log(`[MapsProvider] canUse(${record?.providerName}, ${apiType}): ${result}`, {
// //     monthlyRemaining: b.monthlyRemaining,
// //     dailyJSRemaining: b.dailyJSRemaining,
// //     dailyGeoRemaining: b.dailyGeoRemaining
// //   });
// //   return result;
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // NOMINATIM FALLBACKS
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
// //       { headers: { 'Accept-Language': 'en' } }
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
// // // PROVIDERS THAT HANDLE THEIR OWN ROUTING (deep-link based)
// // // ─────────────────────────────────────────────────────────────────────────────
// // const DEEP_LINK_ROUTING_MAPS = ['wazemap', 'applemap'];

// // // ─────────────────────────────────────────────────────────────────────────────
// // // MASPROVIDER COMPONENT
// // // ─────────────────────────────────────────────────────────────────────────────

// // export function MapsProvider({ children }) {
// //   const [priorityList,   setPriorityList]   = useState([]);
// //   const [providers,      setProviders]      = useState({});
// //   const [allExhausted,   setAllExhausted]   = useState(false);
// //   const [ready,          setReady]          = useState(false);
// //   // ── NEW: which map to display on screen ───────────────────────────────────
// //   // Populated from Strapi apiProvidersPriorityMap.prioritizedMap
// //   // Values: 'wazemap' | 'openstreetmap' | 'localmap' | 'yandexmap' | 'googlemap' | 'applemap'
// //   const [prioritizedMap, setPrioritizedMap] = useState('openstreetmap');

// //   const apiUrl      = process.env.NEXT_PUBLIC_API_URL      || '';
// //   const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

// //   // ── Auth ────────────────────────────────────────────────────────────────
// //   function getToken() {
// //     try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
// //     catch { return null; }
// //   }
// //   function authHeaders() {
// //     const token = getToken();
// //     return {
// //       'Content-Type': 'application/json',
// //       ...(token ? { Authorization: `Bearer ${token}` } : {}),
// //     };
// //   }

// //   async function initProviderData(record) {
// //     console.log('[MapsProvider] initProviderData for', record.providerName);
// //     const pd = record.providerData;
// //     const isEmpty = !pd || typeof pd !== 'object' || Object.keys(pd).length === 0;
// //     if (!isEmpty) {
// //       console.log('[MapsProvider] providerData already exists');
// //       return record;
// //     }

// //     const freshData = buildFreshProviderData();

// //     try {
// //       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
// //         method: 'PUT',
// //         headers: authHeaders(),
// //         body: JSON.stringify({ data: { providerData: freshData } }),
// //       });

// //       if (!res.ok) {
// //         console.warn(`[MapsProvider] initProviderData PUT failed for ${record.providerName}:`, res.status);
// //       } else {
// //         console.info(`[MapsProvider] Initialized empty providerData for ${record.providerName}`);
// //       }
// //     } catch (err) {
// //       console.warn('[MapsProvider] initProviderData network error (non-fatal):', err);
// //     }

// //     return { ...record, providerData: freshData };
// //   }

// //   // ── Load priority + provider records ────────────────────────────────────
// //   useEffect(() => {
// //     async function load() {
// //       console.log('[MapsProvider] load started');
// //       if (!apiUrl) { setReady(true); return; }

// //       try {
// //         // 1. Priority map (single type)
// //         const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
// //         const pmJson = await pmRes.json();
// //         console.log('[MapsProvider] raw priority-map response:', JSON.stringify(pmJson));
// //         const pmRaw  = pmJson?.data || {};
// //         const list   = pmRaw.mapsProviders ?? pmRaw.attributes?.mapsProviders ?? [];

// //         // ── Read prioritizedMap — try every casing Strapi might return ──
// //         const pMap =
// //           pmRaw.priotizedMap          ||   // actual Strapi field name (typo in schema)
// //           pmRaw.prioritizedMap        ||
// //           pmRaw.attributes?.prioritizedMap ||
// //           pmRaw.attributes?.priotizedMap   ||
// //           pmRaw.prioritized_map       ||
// //           pmRaw.attributes?.prioritized_map ||
// //           pmRaw.PrioritizedMap        ||
// //           list[0]                     ||   // fall back to first provider in list
// //           'openstreetmap';
// //         console.log('[MapsProvider] prioritizedMap resolved to:', pMap, '(raw keys:', Object.keys(pmRaw), ')');
// //         setPrioritizedMap(pMap);
// //         // ────────────────────────────────────────────────────────────────

// //         console.log('[MapsProvider] priority list:', list);
// //         setPriorityList(list);
// //         if (!list.length) { setReady(true); return; }

// //         // 2. Provider records
// //         const filterParams = list
// //           .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
// //           .join('&');

// //         const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
// //         const provJson = await provRes.json();
// //         const rawItems = provJson?.data || [];
// //         console.log('[MapsProvider] provider records:', rawItems);

// //         const providerMap = {};

// //         for (const item of rawItems) {
// //           const flat = item.attributes ?? item;

// //           let record = {
// //             id:                 item.id,
// //             providerName:       flat.providerName,
// //             providerData:       flat.providerData       ?? {},
// //             maxMonthlyRequests: flat.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests,
// //           };

// //           const name = flat.providerName ?? record.providerName;
// //           if (!name) continue;

// //           // Waze and Apple are display/routing providers only — they have no
// //           // geocoder budget to track, so skip initProviderData entirely.
// //           const isDeepLinkProvider = name === 'wazemap' || name === 'applemap';

// //           if (!isDeepLinkProvider) {
// //             // Fire-and-forget — don't let a 404 (Strapi permissions) block loading
// //             initProviderData(record).then((updated) => {
// //               setProviders((prev) => {
// //                 if (!prev[name]) return prev;
// //                 return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
// //               });
// //             }).catch(() => {});
// //           }

// //           let instance = null;

// //           if (name === 'wazemap') {
// //             console.log('[MapsProvider] creating WazeMapsProvider instance');
// //             instance = new WazeMapsProvider();
// //           } else if (name === 'applemap') {
// //             console.log('[MapsProvider] creating AppleMapsProvider instance');
// //             instance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
// //           } else {
// //             const hasGeoBudget = canUse(record, 'GeocoderHTTPAPI');
// //             const hasJSBudget  = canUse(record, 'JavaScriptAPI');
// //             console.log(`[MapsProvider] ${name} - hasGeoBudget:${hasGeoBudget} hasJSBudget:${hasJSBudget}`);

// //             if (hasGeoBudget || hasJSBudget) {
// //               if (name === 'googlemaps') {
// //                 console.log('[MapsProvider] creating GoogleMapsProvider instance');
// //                 instance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
// //               }
// //               if (name === 'yandexmaps') {
// //                 console.log('[MapsProvider] creating YandexMapsProvider instance');
// //                 instance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
// //               }
// //               if (name === 'geoapify') {
// //                 console.log('[MapsProvider] creating GeoapifyProvider instance');
// //                 instance = new GeoapifyProvider(process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '');
// //               }
// //             }
// //           }

// //           const budget = computeBudget(record);
// //           providerMap[name] = { record, instance, budget };
// //           console.log(`[MapsProvider] ${name} instance:`, instance ? 'created' : 'null');
// //         }

// //         setProviders(providerMap);
// //         console.log('[MapsProvider.load] providerMap summary:');
// //         Object.entries(providerMap).forEach(([k, v]) => {
// //           console.log(`  [MapsProvider.load]   ${k}: instance=${!!v.instance} | token=${v.instance?.token ? v.instance.token.slice(0,15)+'...' : 'N/A'} | budget=${JSON.stringify(v.budget)}`);
// //         });

// //         const anyActive = list.some((n) => providerMap[n]?.instance != null);
// //         setAllExhausted(!anyActive);
// //         console.log('[MapsProvider.load] anyActive:', anyActive, '| ready=true incoming');

// //       } catch (err) {
// //         console.error('[MapsProvider] load error:', err);
// //         setAllExhausted(true);
// //       } finally {
// //         setReady(true);
// //       }
// //     }

// //     load();
// //   }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// //   // ── Log a request ─────────────────────────────────────────────────────────
// //   const logRequest = useCallback((providerName, apiType) => {
// //     console.log(`[MapsProvider] logRequest: ${providerName} ${apiType}`);
// //     const p = providers[providerName];
// //     if (!p) return;

// //     const monthKey = getMonthKey();
// //     const dayKey   = getDayKey();
// //     const bucket   = dailyBucketKey(apiType);

// //     const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
// //     const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
// //     const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

// //     monthData[apiType]  = (Number(monthData[apiType]) || 0) + 1;
// //     dayData[bucket]     = (Number(dayData[bucket])    || 0) + 1;

// //     const updatedProviderData = {
// //       ...existing,
// //       requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
// //       dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
// //     };

// //     fetch(`${apiUrl}/api-providers/${p.record.id}`, {
// //       method:  'PUT',
// //       headers: authHeaders(),
// //       body:    JSON.stringify({ data: { providerData: updatedProviderData } }),
// //     }).catch((err) => console.warn('[MapsProvider] logRequest PUT error:', err));

// //     setProviders((prev) => {
// //       const cur = prev[providerName];
// //       if (!cur) return prev;
// //       const updatedRecord = { ...cur.record, providerData: updatedProviderData };
// //       return {
// //         ...prev,
// //         [providerName]: {
// //           ...cur,
// //           record: updatedRecord,
// //           budget: computeBudget(updatedRecord),
// //         },
// //       };
// //     });
// //   }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

// //   const getActiveInstance = useCallback((apiType = 'GeocoderHTTPAPI') => {
// //     console.log(`[MapsProvider.getActiveInstance] ▶ apiType=${apiType} | priorityList=[${priorityList.join(', ')}] | providers keys=[${Object.keys(providers).join(', ')}]`);
// //     for (const name of priorityList) {
// //       const p = providers[name];
// //       if (!p) { console.log(`[MapsProvider.getActiveInstance] ${name}: not in providers map`); continue; }
// //       if (!p.instance) { console.log(`[MapsProvider.getActiveInstance] ${name}: instance is null`); continue; }

// //       if (name === 'wazemap') { console.log(`[MapsProvider.getActiveInstance] ${name}: skipped (no geocoding API)`); continue; }

// //       if (name === 'applemap') {
// //         const hasToken = !!p.instance?.token;
// //         const tokenPrefix = p.instance?.token?.slice(0, 15) || 'NONE';
// //         console.log(`[MapsProvider.getActiveInstance] applemap check — apiType:${apiType} | hasToken:${hasToken} | tokenPrefix:${tokenPrefix} | _mkReady:${p.instance?._mkReady}`);
// //         if (apiType === 'JavaScriptAPI' && hasToken) {
// //           console.log(`[MapsProvider.getActiveInstance] ✅ selected: applemap (MapKit JS)`);
// //           return { name, instance: p.instance };
// //         }
// //         console.log(`[MapsProvider.getActiveInstance] applemap: skipped (apiType=${apiType} or no token)`);
// //         continue;
// //       }

// //       if (name === 'geoapify') {
// //         const hasKey = !!p.instance?.apiKey;
// //         console.log(`[MapsProvider.getActiveInstance] geoapify check — hasKey:${hasKey} | apiType:${apiType}`);
// //         if (!hasKey) { console.log('[MapsProvider.getActiveInstance] geoapify: skipped (no API key)'); continue; }
// //         const canUseResult = canUse(p.record, apiType);
// //         console.log(`[MapsProvider.getActiveInstance] geoapify: canUse=${canUseResult}`);
// //         if (canUseResult) { console.log('[MapsProvider.getActiveInstance] ✅ selected: geoapify'); return { name, instance: p.instance }; }
// //         continue;
// //       }

// //       const canUseResult = canUse(p.record, apiType);
// //       console.log(`[MapsProvider.getActiveInstance] ${name}: canUse=${canUseResult}`);
// //       if (canUseResult) {
// //         console.log(`[MapsProvider.getActiveInstance] ✅ selected: ${name}`);
// //         return { name, instance: p.instance };
// //       }
// //     }
// //     console.log(`[MapsProvider.getActiveInstance] ❌ no provider found for ${apiType}`);
// //     return null;
// //   }, [priorityList, providers]);

// //   // ── Public API ────────────────────────────────────────────────────────────

// //   const searchPlaces = useCallback(async (query, countryCode = null) => {
// //     console.log(`[MapsProvider.searchPlaces] ▶ query="${query}" | countryCode=${countryCode}`);
// //     if (!query || query.length < 2) { console.log('[MapsProvider.searchPlaces] query too short — skipping'); return []; }

// //     const active = getActiveInstance('JavaScriptAPI');
// //     console.log(`[MapsProvider.searchPlaces] getActiveInstance(JavaScriptAPI) returned:`, active ? `{ name: ${active.name}, instance: ${!!active.instance} }` : 'null');

// //     if (!active) {
// //       console.log('[MapsProvider.searchPlaces] ⚠ no active provider — falling back to Nominatim');
// //       return nominatimSearch(query, countryCode);
// //     }

// //     if (!active.instance?.searchPlaces) {
// //       console.log(`[MapsProvider.searchPlaces] ⚠ ${active.name} has no searchPlaces method — falling back to Nominatim`);
// //       return nominatimSearch(query, countryCode);
// //     }

// //     console.log(`[MapsProvider.searchPlaces] calling ${active.name}.searchPlaces...`);
// //     try {
// //       const results = await active.instance.searchPlaces(query, countryCode);
// //       console.log(`[MapsProvider.searchPlaces] ${active.name} returned:`, results === null ? 'null' : results?.length ?? 'undefined', 'results');
// //       if (results?.length) {
// //         logRequest(active.name, 'JavaScriptAPI');
// //         return results;
// //       }
// //       console.log(`[MapsProvider.searchPlaces] ${active.name} returned empty — falling back to Nominatim`);
// //     } catch (err) {
// //       console.error(`[MapsProvider.searchPlaces] ❌ ${active.name}.searchPlaces threw:`, err?.message, err);
// //     }

// //     console.log('[MapsProvider.searchPlaces] using Nominatim fallback');
// //     return nominatimSearch(query, countryCode);
// //   }, [getActiveInstance, logRequest]);

// //   const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
// //     console.log(`[MapsProvider] getPlaceDetails called for placeId: ${placeId}`, fallbackData);
// //     if (fallbackData?.lat != null && fallbackData?.lng != null) {
// //       console.log('[MapsProvider] using fast path (fallbackData has coords)');
// //       return fallbackData;
// //     }

// //     const active = getActiveInstance('PlacesAPI');
// //     if (active?.instance?.getPlaceDetails) {
// //       console.log(`[MapsProvider] using ${active.name}.getPlaceDetails`);
// //       try {
// //         const result = await active.instance.getPlaceDetails(placeId, fallbackData);
// //         if (result) {
// //           logRequest(active.name, 'PlacesAPI');
// //           console.log(`[MapsProvider] ${active.name} returned:`, result);
// //           return result;
// //         } else {
// //           console.log(`[MapsProvider] ${active.name} returned no result`);
// //         }
// //       } catch (err) {
// //         console.warn(`[MapsProvider] ${active.name}.getPlaceDetails failed — falling back:`, err);
// //       }
// //     } else {
// //       console.log('[MapsProvider] no active provider with getPlaceDetails, returning fallbackData');
// //     }

// //     return fallbackData;
// //   }, [getActiveInstance, logRequest]);

// //   const reverseGeocode = useCallback(async (lat, lng) => {
// //     console.log(`[MapsProvider] reverseGeocode called for lat: ${lat}, lng: ${lng}`);
// //     const active = getActiveInstance('GeocoderHTTPAPI');
// //     if (active?.instance?.reverseGeocode) {
// //       console.log(`[MapsProvider] using ${active.name}.reverseGeocode`);
// //       try {
// //         const result = await active.instance.reverseGeocode(lat, lng);
// //         if (result) {
// //           logRequest(active.name, 'GeocoderHTTPAPI');
// //           console.log(`[MapsProvider] ${active.name} returned:`, result);
// //           return result;
// //         } else {
// //           console.log(`[MapsProvider] ${active.name} returned no result`);
// //         }
// //       } catch (err) {
// //         console.warn(`[MapsProvider] ${active.name}.reverseGeocode failed — falling back:`, err);
// //       }
// //     } else {
// //       console.log('[MapsProvider] no active provider with reverseGeocode, falling back to Nominatim');
// //     }

// //     return nominatimReverse(lat, lng);
// //   }, [getActiveInstance, logRequest]);

// //   const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

// //   // ── NEW: getRoute — returns route data OR opens deep-link navigation ──────
// //   // For wazemap / applemap: opens the native navigation app, returns null.
// //   // For all others: calls local OSRM and returns GeoJSON route.
// //   const getRoute = useCallback(async (origin, destination) => {
// //     console.log('[MapsProvider] getRoute', origin, '->', destination);

// //     // Deep-link based maps handle routing natively
// //     if (DEEP_LINK_ROUTING_MAPS.includes(prioritizedMap)) {
// //       const provider = Object.values(providers).find(
// //         (p) => p?.record?.providerName === prioritizedMap
// //       );
// //       if (provider?.instance?.openNavigation) {
// //         provider.instance.openNavigation(destination, origin);
// //         return { type: 'deeplink', provider: prioritizedMap };
// //       }
// //     }

// //     // Local OSRM routing (default for all other maps)
// //     if (!localMapUrl) {
// //       console.warn('[MapsProvider] localMapUrl not set — cannot compute route');
// //       return null;
// //     }

// //     try {
// //       const res = await fetch(
// //         `${localMapUrl}/api/route?` +
// //         `origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
// //       );
// //       if (!res.ok) throw new Error(`Route API returned ${res.status}`);
// //       const data = await res.json();
// //       return {
// //         type:          'local',
// //         distance:      data.distance,
// //         duration:      data.duration,
// //         distanceValue: data.distanceValue,
// //         durationValue: data.durationValue,
// //         geometry:      data.geometry,   // [[lng, lat], ...]
// //         steps:         data.steps || [],
// //       };
// //     } catch (err) {
// //       console.error('[MapsProvider] getRoute local error:', err);
// //       return null;
// //     }
// //   }, [prioritizedMap, providers, localMapUrl]);
// //   // ─────────────────────────────────────────────────────────────────────────

// //   const getProviderStatus = useCallback(() =>
// //     priorityList.map((name) => {
// //       const p = providers[name];
// //       if (!p) return { name, loaded: false };
// //       return {
// //         name,
// //         loaded:      true,
// //         hasInstance: !!p.instance,
// //         budget:      p.budget,
// //         canUseGeo:   canUse(p.record, 'GeocoderHTTPAPI'),
// //         canUseJS:    canUse(p.record, 'JavaScriptAPI'),
// //       };
// //     })
// //   , [priorityList, providers]);

// //   useEffect(() => {
// //     if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
// //   }, [getProviderStatus]);

// //   const activeForGeo = getActiveInstance('GeocoderHTTPAPI')?.name || 'nominatim';
// //   const activeForJS  = getActiveInstance('JavaScriptAPI')?.name  || 'nominatim';
// //   console.log(`[MapsProvider] context value — ready:${ready} | prioritizedMap:${prioritizedMap} | activeGeo:${activeForGeo} | activeJS:${activeForJS} | providers:[${Object.keys(providers).join(',')}]`);

// //   const value = {
// //     ready,
// //     allExhausted,
// //     prioritizedMap,
// //     activeProviderName: activeForGeo,
// //     searchPlaces,
// //     getPlaceDetails,
// //     reverseGeocode,
// //     getInitialLocation,
// //     getRoute,
// //     getProviderStatus,
// //     localMapUrl,
// //   };

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

// import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
// const DEEP_LINK_ROUTING_MAPS = ['wazemap', 'applemap'];

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

//   async function initProviderData(record) {
//     console.log('[MapsProvider] initProviderData for', record.providerName);
//     const pd = record.providerData;
//     const isEmpty = !pd || typeof pd !== 'object' || Object.keys(pd).length === 0;
//     if (!isEmpty) {
//       console.log('[MapsProvider] providerData already exists');
//       return record;
//     }

//     const freshData = buildFreshProviderData();

//     try {
//       const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
//         method: 'PUT',
//         headers: authHeaders(),
//         body: JSON.stringify({ data: { providerData: freshData } }),
//       });

//       if (!res.ok) {
//         console.warn(`[MapsProvider] initProviderData PUT failed for ${record.providerName}:`, res.status);
//       } else {
//         console.info(`[MapsProvider] Initialized empty providerData for ${record.providerName}`);
//       }
//     } catch (err) {
//       console.warn('[MapsProvider] initProviderData network error (non-fatal):', err);
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

//   const activeForGeo = getActiveInstance('GeocoderHTTPAPI')?.name || 'nominatim';
//   const activeForJS  = getActiveInstance('JavaScriptAPI')?.name  || 'nominatim';
//   console.log(`[MapsProvider] context value — ready:${ready} | prioritizedMap:${prioritizedMap} | activeGeo:${activeForGeo} | activeJS:${activeForJS} | providers:[${Object.keys(providers).join(',')}]`);

//   const value = {
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
//   };

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
import { GoogleMapsProvider }  from './GoogleMapsProvider';
import { YandexMapsProvider }  from './YandexMapsProvider';
import { WazeMapsProvider }    from './WazeMapsProvider';
import { AppleMapsProvider }   from './AppleMapsProvider';
import { GeoapifyProvider }    from './GeoapifyProvider';

const MapsContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// Keys are ISO strings so sorting / comparison works naturally:
//   month key  → "2026-03"
//   day key    → "2026-03-02"
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
// DEFAULT LIMITS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  maxMonthlyRequests:            20000,
  maxDailyGeocoderApiRequests:     800,
  maxDailyJSApiRequests:         20000,
};

function dailyBucketKey(apiType) {
  return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER DATA SCHEMA
//
// providerData = {
//   maxDailyGeocoderApiRequests: 800,
//   maxDailyJSApiRequests:       20000,
//   requestCounts: { "2026-03": { GeocoderHTTPAPI: 12, JavaScriptAPI: 4 } }
//   dailyCounts:   { "2026-03-02": { geo: 3, js: 1 } }
// }
// ─────────────────────────────────────────────────────────────────────────────

function buildFreshProviderData() {
  return {
    maxDailyGeocoderApiRequests: DEFAULTS.maxDailyGeocoderApiRequests,
    maxDailyJSApiRequests:       DEFAULTS.maxDailyJSApiRequests,
    requestCounts: {},
    dailyCounts:   {},
  };
}

function computeBudget(record) {
  const pd       = record.providerData || {};
  const monthKey = getMonthKey();
  const dayKey   = getDayKey();

  const monthData   = pd.requestCounts?.[monthKey] || {};
  const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
  const monthlyMax  = record.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests;

  const dayData      = pd.dailyCounts?.[dayKey] || {};
  const dailyGeoUsed = Number(dayData.geo) || 0;
  const dailyJSUsed  = Number(dayData.js)  || 0;

  const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || DEFAULTS.maxDailyGeocoderApiRequests;
  const maxDailyJS  = Number(pd.maxDailyJSApiRequests)       || DEFAULTS.maxDailyJSApiRequests;

  return {
    monthlyRemaining:  Math.max(0, monthlyMax  - monthlyUsed),
    dailyGeoRemaining: Math.max(0, maxDailyGeo - dailyGeoUsed),
    dailyJSRemaining:  Math.max(0, maxDailyJS  - dailyJSUsed),
    monthlyMax,
    maxDailyGeo,
    maxDailyJS,
  };
}

function canUse(record, apiType) {
  const b = computeBudget(record);
  const result =
    b.monthlyRemaining > 0 &&
    (dailyBucketKey(apiType) !== 'js'  || b.dailyJSRemaining  > 0) &&
    (dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0);
  console.log(`[MapsProvider] canUse(${record?.providerName}, ${apiType}): ${result}`, {
    monthlyRemaining: b.monthlyRemaining,
    dailyJSRemaining: b.dailyJSRemaining,
    dailyGeoRemaining: b.dailyGeoRemaining
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOMINATIM FALLBACKS
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
      { headers: { 'Accept-Language': 'en' } }
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
// PROVIDERS THAT HANDLE THEIR OWN ROUTING (deep-link based)
// ─────────────────────────────────────────────────────────────────────────────
const DEEP_LINK_ROUTING_MAPS = ['wazemap', 'applemap'];

// ─────────────────────────────────────────────────────────────────────────────
// MASPROVIDER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function MapsProvider({ children }) {
  const [priorityList,   setPriorityList]   = useState([]);
  const [providers,      setProviders]      = useState({});
  const [allExhausted,   setAllExhausted]   = useState(false);
  const [ready,          setReady]          = useState(false);
  // ── NEW: which map to display on screen ───────────────────────────────────
  // Populated from Strapi apiProvidersPriorityMap.prioritizedMap
  // Values: 'wazemap' | 'openstreetmap' | 'localmap' | 'yandexmap' | 'googlemap' | 'applemap'
  const [prioritizedMap, setPrioritizedMap] = useState('openstreetmap');

  const apiUrl      = process.env.NEXT_PUBLIC_API_URL      || '';
  const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

  // ── Auth ────────────────────────────────────────────────────────────────
  function getToken() {
    try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
    catch { return null; }
  }
  function authHeaders() {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Track consecutive PUT failures per provider — circuit breaks after 5
  const initFailures = useRef({});

  async function initProviderData(record) {
    console.log('[MapsProvider] initProviderData for', record.providerName);

    // Synthetic records (no Strapi entry) have id:null — skip the PUT entirely
    if (record.id == null) {
      console.log(`[MapsProvider] initProviderData: ${record.providerName} has no Strapi id — skipping PUT`);
      const freshData = buildFreshProviderData();
      return { ...record, providerData: freshData };
    }

    const pd = record.providerData;
    const isEmpty = !pd || typeof pd !== 'object' || Object.keys(pd).length === 0;
    if (!isEmpty) {
      return record; // already initialised — nothing to do
    }

    // Circuit breaker: stop after 5 consecutive failures for this provider
    const failKey = record.providerName;
    if ((initFailures.current[failKey] || 0) >= 5) {
      console.warn(`[MapsProvider] initProviderData: ${failKey} has failed 5+ times — skipping PUT`);
      const freshData = buildFreshProviderData();
      return { ...record, providerData: freshData };
    }

    const freshData = buildFreshProviderData();

    try {
      const res = await fetch(`${apiUrl}/api-providers/${record.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ data: { providerData: freshData } }),
      });

      if (!res.ok) {
        initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
        const failCount = initFailures.current[failKey];
        if (failCount < 5) {
          console.warn(`[MapsProvider] initProviderData PUT failed for ${record.providerName}: ${res.status} (attempt ${failCount}/5)`);
        } else {
          console.warn(`[MapsProvider] initProviderData PUT for ${record.providerName} failed 5 times — giving up. Check Strapi PUT permissions on api-providers.`);
        }
      } else {
        // Success — reset counter
        initFailures.current[failKey] = 0;
        console.info(`[MapsProvider] Initialized providerData for ${record.providerName}`);
      }
    } catch (err) {
      initFailures.current[failKey] = (initFailures.current[failKey] || 0) + 1;
      console.warn(`[MapsProvider] initProviderData network error for ${record.providerName} (attempt ${initFailures.current[failKey]}/5)`);
    }

    return { ...record, providerData: freshData };
  }

  // ── Load priority + provider records ────────────────────────────────────
  useEffect(() => {
    async function load() {
      console.log('[MapsProvider] load started');
      if (!apiUrl) { setReady(true); return; }

      try {
        // 1. Priority map (single type)
        const pmRes  = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
        const pmJson = await pmRes.json();
        console.log('[MapsProvider] raw priority-map response:', JSON.stringify(pmJson));
        const pmRaw  = pmJson?.data || {};
        const list   = pmRaw.mapsProviders ?? pmRaw.attributes?.mapsProviders ?? [];

        // ── Read prioritizedMap — try every casing Strapi might return ──
        const pMap =
          pmRaw.priotizedMap          ||   // actual Strapi field name (typo in schema)
          pmRaw.prioritizedMap        ||
          pmRaw.attributes?.prioritizedMap ||
          pmRaw.attributes?.priotizedMap   ||
          pmRaw.prioritized_map       ||
          pmRaw.attributes?.prioritized_map ||
          pmRaw.PrioritizedMap        ||
          list[0]                     ||   // fall back to first provider in list
          'openstreetmap';
        console.log('[MapsProvider] prioritizedMap resolved to:', pMap, '(raw keys:', Object.keys(pmRaw), ')');
        setPrioritizedMap(pMap);
        // ────────────────────────────────────────────────────────────────

        console.log('[MapsProvider] priority list:', list);
        setPriorityList(list);
        if (!list.length) { setReady(true); return; }

        // 2. Provider records
        const filterParams = list
          .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
          .join('&');

        const provRes  = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
        const provJson = await provRes.json();
        const rawItems = provJson?.data || [];
        console.log('[MapsProvider] provider records:', rawItems);

        const providerMap = {};

        for (const item of rawItems) {
          const flat = item.attributes ?? item;

          let record = {
            id:                 item.id,
            providerName:       flat.providerName,
            providerData:       flat.providerData       ?? {},
            maxMonthlyRequests: flat.maxMonthlyRequests ?? DEFAULTS.maxMonthlyRequests,
          };

          const name = flat.providerName ?? record.providerName;
          if (!name) continue;

          // Waze and Apple are display/routing providers only — they have no
          // geocoder budget to track, so skip initProviderData entirely.
          const isDeepLinkProvider = name === 'wazemap' || name === 'applemap';

          if (!isDeepLinkProvider) {
            // Fire-and-forget — don't let a 404 (Strapi permissions) block loading
            initProviderData(record).then((updated) => {
              setProviders((prev) => {
                if (!prev[name]) return prev;
                return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
              });
            }).catch(() => {});
          }

          let instance = null;

          if (name === 'wazemap') {
            console.log('[MapsProvider] creating WazeMapsProvider instance');
            instance = new WazeMapsProvider();
          } else if (name === 'applemap') {
            console.log('[MapsProvider] creating AppleMapsProvider instance');
            instance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
          } else {
            const hasGeoBudget = canUse(record, 'GeocoderHTTPAPI');
            const hasJSBudget  = canUse(record, 'JavaScriptAPI');
            console.log(`[MapsProvider] ${name} - hasGeoBudget:${hasGeoBudget} hasJSBudget:${hasJSBudget}`);

            if (hasGeoBudget || hasJSBudget) {
              if (name === 'googlemaps') {
                console.log('[MapsProvider] creating GoogleMapsProvider instance');
                instance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
              }
              if (name === 'yandexmaps') {
                console.log('[MapsProvider] creating YandexMapsProvider instance');
                instance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
              }
              if (name === 'geoapify') {
                console.log('[MapsProvider] creating GeoapifyProvider instance');
                instance = new GeoapifyProvider(process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '');
              }
            }
          }

          const budget = computeBudget(record);
          providerMap[name] = { record, instance, budget };
          console.log(`[MapsProvider] ${name} instance:`, instance ? 'created' : 'null');
        }

        // ── Fill in providers from priority list that had no Strapi record ─────
        // Happens when a provider is in mapsProviders but no api-providers record
        // exists yet. Synthesise a default record so the provider works without
        // requiring a manual Strapi creation step.
        for (const name of list) {
          if (providerMap[name]) continue; // already loaded from Strapi
          console.log(`[MapsProvider.load] ${name}: no Strapi record — synthesising default`);

          const defaultRecord = {
            id:                 null,
            providerName:       name,
            providerData:       buildFreshProviderData(),
            maxMonthlyRequests: DEFAULTS.maxMonthlyRequests,
          };

          let syntheticInstance = null;
          if (name === 'wazemap') {
            syntheticInstance = new WazeMapsProvider();
          } else if (name === 'applemap') {
            syntheticInstance = new AppleMapsProvider(process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '');
          } else if (name === 'geoapify') {
            const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
            console.log(`[MapsProvider.load] geoapify synthetic — apiKey present:${!!key} | prefix:${key ? key.slice(0,8)+'...' : 'NONE'}`);
            syntheticInstance = new GeoapifyProvider(key);
          } else if (name === 'googlemaps') {
            syntheticInstance = new GoogleMapsProvider(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');
          } else if (name === 'yandexmaps') {
            syntheticInstance = new YandexMapsProvider(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '');
          }

          providerMap[name] = { record: defaultRecord, instance: syntheticInstance, budget: computeBudget(defaultRecord) };
          console.log(`[MapsProvider.load] ${name} synthetic instance:`, syntheticInstance ? 'created' : 'null (unsupported or missing env key)');
        }

        setProviders(providerMap);
        console.log('[MapsProvider.load] providerMap summary:');
        Object.entries(providerMap).forEach(([k, v]) => {
          console.log(`  [MapsProvider.load]   ${k}: instance=${!!v.instance} | token=${v.instance?.token ? v.instance.token.slice(0,15)+'...' : 'N/A'} | budget=${JSON.stringify(v.budget)}`);
        });

        const anyActive = list.some((n) => providerMap[n]?.instance != null);
        setAllExhausted(!anyActive);
        console.log('[MapsProvider.load] anyActive:', anyActive, '| ready=true incoming');

      } catch (err) {
        console.error('[MapsProvider] load error:', err);
        setAllExhausted(true);
      } finally {
        setReady(true);
      }
    }

    load();
  }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Log a request ─────────────────────────────────────────────────────────
  const logRequest = useCallback((providerName, apiType) => {
    console.log(`[MapsProvider] logRequest: ${providerName} ${apiType}`);
    const p = providers[providerName];
    if (!p) return;

    const monthKey = getMonthKey();
    const dayKey   = getDayKey();
    const bucket   = dailyBucketKey(apiType);

    const existing  = { ...buildFreshProviderData(), ...p.record.providerData };
    const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
    const dayData   = { ...(existing.dailyCounts?.[dayKey]     || {}) };

    monthData[apiType]  = (Number(monthData[apiType]) || 0) + 1;
    dayData[bucket]     = (Number(dayData[bucket])    || 0) + 1;

    const updatedProviderData = {
      ...existing,
      requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
      dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
    };

    fetch(`${apiUrl}/api-providers/${p.record.id}`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify({ data: { providerData: updatedProviderData } }),
    }).catch((err) => console.warn('[MapsProvider] logRequest PUT error:', err));

    setProviders((prev) => {
      const cur = prev[providerName];
      if (!cur) return prev;
      const updatedRecord = { ...cur.record, providerData: updatedProviderData };
      return {
        ...prev,
        [providerName]: {
          ...cur,
          record: updatedRecord,
          budget: computeBudget(updatedRecord),
        },
      };
    });
  }, [providers, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const getActiveInstance = useCallback((apiType = 'GeocoderHTTPAPI') => {
    console.log(`[MapsProvider.getActiveInstance] ▶ apiType=${apiType} | priorityList=[${priorityList.join(', ')}] | providers keys=[${Object.keys(providers).join(', ')}]`);
    for (const name of priorityList) {
      const p = providers[name];
      if (!p) { console.log(`[MapsProvider.getActiveInstance] ${name}: not in providers map`); continue; }
      if (!p.instance) { console.log(`[MapsProvider.getActiveInstance] ${name}: instance is null`); continue; }

      if (name === 'wazemap') { console.log(`[MapsProvider.getActiveInstance] ${name}: skipped (no geocoding API)`); continue; }

      if (name === 'applemap') {
        const hasToken = !!p.instance?.token;
        const tokenPrefix = p.instance?.token?.slice(0, 15) || 'NONE';
        console.log(`[MapsProvider.getActiveInstance] applemap check — apiType:${apiType} | hasToken:${hasToken} | tokenPrefix:${tokenPrefix} | _mkReady:${p.instance?._mkReady}`);
        if (apiType === 'JavaScriptAPI' && hasToken) {
          console.log(`[MapsProvider.getActiveInstance] ✅ selected: applemap (MapKit JS)`);
          return { name, instance: p.instance };
        }
        console.log(`[MapsProvider.getActiveInstance] applemap: skipped (apiType=${apiType} or no token)`);
        continue;
      }

      if (name === 'geoapify') {
        const hasKey = !!p.instance?.apiKey;
        console.log(`[MapsProvider.getActiveInstance] geoapify check — hasKey:${hasKey} | apiType:${apiType}`);
        if (!hasKey) { console.log('[MapsProvider.getActiveInstance] geoapify: skipped (no API key)'); continue; }
        const canUseResult = canUse(p.record, apiType);
        console.log(`[MapsProvider.getActiveInstance] geoapify: canUse=${canUseResult}`);
        if (canUseResult) { console.log('[MapsProvider.getActiveInstance] ✅ selected: geoapify'); return { name, instance: p.instance }; }
        continue;
      }

      const canUseResult = canUse(p.record, apiType);
      console.log(`[MapsProvider.getActiveInstance] ${name}: canUse=${canUseResult}`);
      if (canUseResult) {
        console.log(`[MapsProvider.getActiveInstance] ✅ selected: ${name}`);
        return { name, instance: p.instance };
      }
    }
    console.log(`[MapsProvider.getActiveInstance] ❌ no provider found for ${apiType}`);
    return null;
  }, [priorityList, providers]);

  // ── Public API ────────────────────────────────────────────────────────────

  const searchPlaces = useCallback(async (query, countryCode = null) => {
    console.log(`[MapsProvider.searchPlaces] ▶ query="${query}" | countryCode=${countryCode}`);
    if (!query || query.length < 2) { console.log('[MapsProvider.searchPlaces] query too short — skipping'); return []; }

    const active = getActiveInstance('JavaScriptAPI');
    console.log(`[MapsProvider.searchPlaces] getActiveInstance(JavaScriptAPI) returned:`, active ? `{ name: ${active.name}, instance: ${!!active.instance} }` : 'null');

    if (!active) {
      console.log('[MapsProvider.searchPlaces] ⚠ no active provider — falling back to Nominatim');
      return nominatimSearch(query, countryCode);
    }

    if (!active.instance?.searchPlaces) {
      console.log(`[MapsProvider.searchPlaces] ⚠ ${active.name} has no searchPlaces method — falling back to Nominatim`);
      return nominatimSearch(query, countryCode);
    }

    console.log(`[MapsProvider.searchPlaces] calling ${active.name}.searchPlaces...`);
    try {
      const results = await active.instance.searchPlaces(query, countryCode);
      console.log(`[MapsProvider.searchPlaces] ${active.name} returned:`, results === null ? 'null' : results?.length ?? 'undefined', 'results');
      if (results?.length) {
        logRequest(active.name, 'JavaScriptAPI');
        return results;
      }
      console.log(`[MapsProvider.searchPlaces] ${active.name} returned empty — falling back to Nominatim`);
    } catch (err) {
      console.error(`[MapsProvider.searchPlaces] ❌ ${active.name}.searchPlaces threw:`, err?.message, err);
    }

    console.log('[MapsProvider.searchPlaces] using Nominatim fallback');
    return nominatimSearch(query, countryCode);
  }, [getActiveInstance, logRequest]);

  const getPlaceDetails = useCallback(async (placeId, fallbackData = null) => {
    console.log(`[MapsProvider] getPlaceDetails called for placeId: ${placeId}`, fallbackData);
    if (fallbackData?.lat != null && fallbackData?.lng != null) {
      console.log('[MapsProvider] using fast path (fallbackData has coords)');
      return fallbackData;
    }

    const active = getActiveInstance('PlacesAPI');
    if (active?.instance?.getPlaceDetails) {
      console.log(`[MapsProvider] using ${active.name}.getPlaceDetails`);
      try {
        const result = await active.instance.getPlaceDetails(placeId, fallbackData);
        if (result) {
          logRequest(active.name, 'PlacesAPI');
          console.log(`[MapsProvider] ${active.name} returned:`, result);
          return result;
        } else {
          console.log(`[MapsProvider] ${active.name} returned no result`);
        }
      } catch (err) {
        console.warn(`[MapsProvider] ${active.name}.getPlaceDetails failed — falling back:`, err);
      }
    } else {
      console.log('[MapsProvider] no active provider with getPlaceDetails, returning fallbackData');
    }

    return fallbackData;
  }, [getActiveInstance, logRequest]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    console.log(`[MapsProvider] reverseGeocode called for lat: ${lat}, lng: ${lng}`);
    const active = getActiveInstance('GeocoderHTTPAPI');
    if (active?.instance?.reverseGeocode) {
      console.log(`[MapsProvider] using ${active.name}.reverseGeocode`);
      try {
        const result = await active.instance.reverseGeocode(lat, lng);
        if (result) {
          logRequest(active.name, 'GeocoderHTTPAPI');
          console.log(`[MapsProvider] ${active.name} returned:`, result);
          return result;
        } else {
          console.log(`[MapsProvider] ${active.name} returned no result`);
        }
      } catch (err) {
        console.warn(`[MapsProvider] ${active.name}.reverseGeocode failed — falling back:`, err);
      }
    } else {
      console.log('[MapsProvider] no active provider with reverseGeocode, falling back to Nominatim');
    }

    return nominatimReverse(lat, lng);
  }, [getActiveInstance, logRequest]);

  const getInitialLocation = useCallback(() => getIPLocation(localMapUrl), [localMapUrl]);

  // ── NEW: getRoute — returns route data OR opens deep-link navigation ──────
  // For wazemap / applemap: opens the native navigation app, returns null.
  // For all others: calls local OSRM and returns GeoJSON route.
  const getRoute = useCallback(async (origin, destination) => {
    console.log('[MapsProvider] getRoute', origin, '->', destination);

    // Deep-link based maps handle routing natively
    if (DEEP_LINK_ROUTING_MAPS.includes(prioritizedMap)) {
      const provider = Object.values(providers).find(
        (p) => p?.record?.providerName === prioritizedMap
      );
      if (provider?.instance?.openNavigation) {
        provider.instance.openNavigation(destination, origin);
        return { type: 'deeplink', provider: prioritizedMap };
      }
    }

    // Local OSRM routing (default for all other maps)
    if (!localMapUrl) {
      console.warn('[MapsProvider] localMapUrl not set — cannot compute route');
      return null;
    }

    try {
      const res = await fetch(
        `${localMapUrl}/api/route?` +
        `origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
      );
      if (!res.ok) throw new Error(`Route API returned ${res.status}`);
      const data = await res.json();
      return {
        type:          'local',
        distance:      data.distance,
        duration:      data.duration,
        distanceValue: data.distanceValue,
        durationValue: data.durationValue,
        geometry:      data.geometry,   // [[lng, lat], ...]
        steps:         data.steps || [],
      };
    } catch (err) {
      console.error('[MapsProvider] getRoute local error:', err);
      return null;
    }
  }, [prioritizedMap, providers, localMapUrl]);
  // ─────────────────────────────────────────────────────────────────────────

  const getProviderStatus = useCallback(() =>
    priorityList.map((name) => {
      const p = providers[name];
      if (!p) return { name, loaded: false };
      return {
        name,
        loaded:      true,
        hasInstance: !!p.instance,
        budget:      p.budget,
        canUseGeo:   canUse(p.record, 'GeocoderHTTPAPI'),
        canUseJS:    canUse(p.record, 'JavaScriptAPI'),
      };
    })
  , [priorityList, providers]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.__mapsProviderStatus = getProviderStatus;
  }, [getProviderStatus]);

  // Memoised so getActiveInstance (and its canUse logs) only re-runs when
  // providers or priorityList actually changes — not on every render.
  const { activeForGeo, activeForJS } = useMemo(() => {
    const geo = getActiveInstance('GeocoderHTTPAPI')?.name || 'nominatim';
    const js  = getActiveInstance('JavaScriptAPI')?.name  || 'nominatim';
    console.log(`[MapsProvider] active providers recalculated — geo:${geo} | js:${js}`);
    return { activeForGeo: geo, activeForJS: js };
  }, [getActiveInstance]); // getActiveInstance itself memoised on [priorityList, providers]

  console.log(`[MapsProvider] context value — ready:${ready} | prioritizedMap:${prioritizedMap} | activeGeo:${activeForGeo} | activeJS:${activeForJS} | providers:[${Object.keys(providers).join(',')}]`);

  const value = useMemo(() => ({
    ready,
    allExhausted,
    prioritizedMap,
    activeProviderName: activeForGeo,
    searchPlaces,
    getPlaceDetails,
    reverseGeocode,
    getInitialLocation,
    getRoute,
    getProviderStatus,
    localMapUrl,
  }), [ready, allExhausted, prioritizedMap, activeForGeo, searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation, getRoute, getProviderStatus, localMapUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
}

export function useMapProvider() {
  const ctx = useContext(MapsContext);
  if (!ctx) throw new Error('useMapProvider must be used inside <MapsProvider>');
  return ctx;
}

export default MapsProvider;