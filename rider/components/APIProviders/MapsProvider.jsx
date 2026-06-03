'use client';
// PATH: Okra/Okrarides/rider/components/Map/APIProviders/MapsProvider.jsx

import {
  createContext, useContext, useEffect, useState,
  useCallback, useRef, useMemo,
} from 'react';
import { GoogleMapsProvider } from './GoogleMapsProvider';
import { YandexMapsProvider } from './YandexMapsProvider';
import { WazeMapsProvider } from './WazeMapsProvider';
import { AppleMapsProvider } from './AppleMapsProvider';
import { GeoapifyProvider } from './GeoapifyProvider';

const MapsContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// LOGGING HELPER
// ─────────────────────────────────────────────────────────────────────────────
const L = {
  _fmt: (tag, section, msg, data) => {
    const ts = new Date().toISOString().slice(11, 23);
    const base = `[MapsProvider][${ts}][${tag}] ── ${section} ── ${msg}`;
    if (data !== undefined) console.log(base, data);
    else console.log(base);
  },
  info: (s, m, d) => L._fmt('INFO ', s, m, d),
  warn: (s, m, d) => L._fmt('WARN ', s, m, d),
  error: (s, m, d) => L._fmt('ERROR', s, m, d),
  ok: (s, m, d) => L._fmt('OK   ', s, m, d),
  fail: (s, m, d) => L._fmt('FAIL ', s, m, d),
  trace: (s, m, d) => L._fmt('TRACE', s, m, d),
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE-AWARE LOG SUPPRESSION
// Returns true when the current page is a tracking route — on those pages we
// skip remote quota logging so polling-heavy screens don't inflate counts or
// trigger cascading re-renders from setProviders inside logRequest.
// ─────────────────────────────────────────────────────────────────────────────
function isTrackingRoute() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.endsWith('/tracking');
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER NAME CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER = {
  GOOGLE: 'google',
  APPLE: 'apple',
  YANDEX: 'yandex',
  WAZE: 'waze',
  GEOAPIFY: 'geoapify',
  OPENSTREET: 'openstreet',
  LOCAL: 'local',
};

const DEEP_LINK_PROVIDERS = new Set([PROVIDER.WAZE, PROVIDER.APPLE]);
const INLINE_PROVIDERS = new Set([PROVIDER.OPENSTREET, PROVIDER.LOCAL]);

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SERVICE → API METHOD MAP PER PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SERVICE_APIS = {
  [PROVIDER.GOOGLE]: {
    routing: 'routeApi',
    distance: 'routeApi',
    eta: 'routeApi',
    autoComplete: 'placesApi',
    location: 'geocoding',
  },
  [PROVIDER.APPLE]: {
    routing: 'deeplink',
    distance: 'mapkit',
    eta: null,
    autoComplete: 'search',
    location: 'geocoder',
  },
  [PROVIDER.YANDEX]: {
    routing: 'routeApi',
    distance: 'routeApi',
    eta: 'routeApi',
    autoComplete: 'GeoSuggestAPI',
    location: 'geocoder',
  },
  [PROVIDER.GEOAPIFY]: {
    routing: 'routingApi',
    distance: 'routingApi',
    eta: 'routingApi',
    autoComplete: 'placesApi',
    location: 'geocodingApi',
  },
  [PROVIDER.WAZE]: {
    routing: 'deeplink',
    distance: null,
    eta: null,
    autoComplete: null,
    location: null,
  },
  [PROVIDER.OPENSTREET]: {
    routing: 'osrm',
    distance: 'osrm',
    eta: 'osrm',
    autoComplete: 'nominatim',
    location: 'nominatim',
  },
  [PROVIDER.LOCAL]: {
    routing: 'localOsrm',
    distance: 'localOsrm',
    eta: 'localOsrm',
    autoComplete: 'nominatim',
    location: 'nominatim',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PARSE mapsProviders ARRAY FROM STRAPI
// ─────────────────────────────────────────────────────────────────────────────

function parseMapsProviders(rawList) {
  L.info('parseMapsProviders', 'called', { rawList });

  const providerNames = [];
  const perProviderApis = {};
  const seen = new Set();

  if (!Array.isArray(rawList)) {
    L.error('parseMapsProviders', 'rawList is NOT an array', { type: typeof rawList });
    return { providerNames, perProviderApis };
  }
  if (rawList.length === 0) {
    L.warn('parseMapsProviders', 'rawList is EMPTY');
    return { providerNames, perProviderApis };
  }

  const isNewFormat =
    typeof rawList[0] === 'object' && rawList[0] !== null && 'name' in rawList[0];
  L.info('parseMapsProviders', `format: ${isNewFormat ? 'NEW {name,config}' : 'LEGACY string[]'}`);

  if (isNewFormat) {
    for (const entry of rawList) {
      if (!entry || typeof entry !== 'object') { L.warn('parseMapsProviders', 'skip invalid entry', entry); continue; }
      const name = (entry.name || '').trim();
      const config = (entry.config && typeof entry.config === 'object') ? entry.config : {};
      if (!name) { L.warn('parseMapsProviders', 'entry has no name', entry); continue; }
      if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
      if (Object.keys(config).length > 0) {
        perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
      }
    }
  } else {
    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      if (typeof item !== 'string') continue;
      const name = item.replace(/:$/, '').trim();
      if (!name) continue;
      const next = rawList[i + 1];
      const config = (next !== null && typeof next === 'object' && !Array.isArray(next)) ? next : {};
      if (!seen.has(name)) { providerNames.push(name); seen.add(name); }
      if (Object.keys(config).length > 0) {
        perProviderApis[name] = { ...(perProviderApis[name] || {}), ...config };
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
  maxMonthlyRequests: 20_000,
  maxDailyGeocoderApiRequests: 1_000,
  maxDailyJSApiRequests: 20_000,
};

/**
 * 'js'  → JavaScriptAPI
 * 'geo' → GeocoderHTTPAPI | GeoSuggestAPI | everything else
 */
function dailyBucketKey(apiType) {
  return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
}

function buildFreshProviderData() {
  return {
    maxDailyGeocoderApiRequests: QUOTA_DEFAULTS.maxDailyGeocoderApiRequests,
    maxDailyJSApiRequests: QUOTA_DEFAULTS.maxDailyJSApiRequests,
    requestCounts: {},
    dailyCounts: {},
  };
}

function computeBudget(record) {
  const pd = record?.providerData || {};
  const monthKey = getMonthKey();
  const dayKey = getDayKey();

  const monthData = pd.requestCounts?.[monthKey] || {};
  const monthlyUsed = Object.values(monthData).reduce((s, v) => s + (Number(v) || 0), 0);
  const monthlyMax = record?.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests;

  const dayData = pd.dailyCounts?.[dayKey] || {};
  const maxDailyGeo = Number(pd.maxDailyGeocoderApiRequests) || QUOTA_DEFAULTS.maxDailyGeocoderApiRequests;
  const maxDailyJS = Number(pd.maxDailyJSApiRequests) || QUOTA_DEFAULTS.maxDailyJSApiRequests;

  return {
    monthlyRemaining: Math.max(0, monthlyMax - monthlyUsed),
    dailyGeoRemaining: Math.max(0, maxDailyGeo - (Number(dayData.geo) || 0)),
    dailyJSRemaining: Math.max(0, maxDailyJS - (Number(dayData.js) || 0)),
    monthlyMax, maxDailyGeo, maxDailyJS,
  };
}

function hasQuota(record, apiType) {
  const name = record?.providerName;
  if (INLINE_PROVIDERS.has(name)) return true;
  if (DEEP_LINK_PROVIDERS.has(name)) return true;

  const b = computeBudget(record);
  const monthlyOk = b.monthlyRemaining > 0;
  const jsOk = dailyBucketKey(apiType) !== 'js' || b.dailyJSRemaining > 0;
  const geoOk = dailyBucketKey(apiType) !== 'geo' || b.dailyGeoRemaining > 0;
  return monthlyOk && jsOk && geoOk;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER INSTANCE FACTORY
// ─────────────────────────────────────────────────────────────────────────────

function createProviderInstance(name) {
  switch (name) {
    case PROVIDER.WAZE:
      return new WazeMapsProvider();

    case PROVIDER.APPLE: {
      const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';
      if (!token) L.warn('createProviderInstance', '"apple" NO TOKEN');
      return new AppleMapsProvider(token);
    }

    case PROVIDER.GOOGLE: {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      if (!key) L.error('createProviderInstance', '"google" NO API KEY — all Google calls will fail');
      return new GoogleMapsProvider(key);
    }

    case PROVIDER.YANDEX: {
      const geocoderKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY || '';
      const geoSuggestKey = process.env.NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY || '';
      if (!geocoderKey) L.warn('createProviderInstance', '"yandex" geocoderKey missing');
      if (!geoSuggestKey) L.warn('createProviderInstance', '"yandex" geoSuggestKey missing — falling back to basic suggest');
      return new YandexMapsProvider(geocoderKey, geoSuggestKey);
    }

    case PROVIDER.GEOAPIFY: {
      const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
      if (!key) L.warn('createProviderInstance', '"geoapify" NO KEY');
      return new GeoapifyProvider(key);
    }

    case PROVIDER.OPENSTREET:
    case PROVIDER.LOCAL:
      return null; // inline — no instance needed

    default:
      L.warn('createProviderInstance', `unknown provider "${name}"`);
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
      place_id: item.place_id?.toString(),
      main_text: item.name || item.display_name?.split(',')[0],
      secondary_text: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name,
      name: item.name || item.display_name?.split(',')[0],
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
      address: data.display_name,
      name: data.name || data.display_name?.split(',')[0],
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
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('No OSRM route');
    const km = route.distance / 1000;
    const min = route.duration / 60;
    return {
      type: 'osrm',
      distance: km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`,
      duration: min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
      distanceValue: route.distance,
      durationValue: route.duration,
      geometry: route.geometry?.coordinates || [],
      steps: [],
    };
  } catch (err) {
    L.warn('osrmRoute', 'failed', { message: err?.message });
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
  const [priorityList, setPriorityList] = useState([]);
  const [providers, setProviders] = useState({});
  const [allExhausted, setAllExhausted] = useState(false);
  const [ready, setReady] = useState(false);

  const [prioritizedMap, setPrioritizedMap] = useState(PROVIDER.OPENSTREET);
  const [prioritizedRoute, setPrioritizedRoute] = useState(null);
  const [prioritizedDistance, setPrioritizedDistance] = useState(null);
  const [prioritizedEta, setPrioritizedEta] = useState(null);
  const [prioritizedAutocomplete, setPrioritizedAutocomplete] = useState(null);

  const [serviceApis, setServiceApis] = useState(DEFAULT_SERVICE_APIS);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const localMapUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

  // ── Refs ────────────────────────────────────────────────────────────────
  // providersRef is the single source of truth for logRequest —
  // keeping providers OUT of logRequest's dependency array prevents the
  // "setProviders → new logRequest → new value memo → all consumers re-render"
  // cascade that was causing page refreshes.
  const providersRef = useRef(providers);
  const serviceApisRef = useRef(serviceApis);
  const apiUrlRef = useRef(apiUrl);

  useEffect(() => { providersRef.current = providers; }, [providers]);
  useEffect(() => { serviceApisRef.current = serviceApis; }, [serviceApis]);
  useEffect(() => { apiUrlRef.current = apiUrl; }, [apiUrl]);

  const initFailures = useRef({});
  const logFailures = useRef({});

  // ── Log env once on mount, not on every render ────────────────────────
  useEffect(() => {
    L.info('MapsProvider', 'mounted — env snapshot', {
      NEXT_PUBLIC_API_URL: apiUrl || 'NOT SET',
      NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL: localMapUrl || '(not set)',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.slice(0, 8) + '...'
        : 'NOT SET',
      NEXT_PUBLIC_GEOAPIFY_API_KEY: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ? '(set)' : '(not set)',
      NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY: process.env.NEXT_PUBLIC_YANDEX_MAPS_GEOCODER_AND_JAVASCRIPITAPI_KEY ? '(set)' : '(not set)',
      NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY: process.env.NEXT_PUBLIC_YANDEX_GEOSUGGESTAPIKEY ? '(set)' : '(not set)',
      NEXT_PUBLIC_APPLE_MAPS_TOKEN: process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN ? '(set)' : '(not set)',
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth helpers ────────────────────────────────────────────────────────
  const getToken = useCallback(() => {
    try { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
    catch { return null; }
  }, []);

  // authHeaders reads apiUrlRef so it is always current without being a dep
  const authHeaders = useCallback(() => {
    const token = getToken();
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, [getToken]);

  // ── initProviderData ────────────────────────────────────────────────────
  // Captures apiUrl + authHeaders via refs/callbacks, not closures, so the
  // function identity is stable and doesn't cause load() to re-run.
  const initProviderData = useCallback(async (record) => {
    const name = record.providerName;

    if (record.id == null) {
      L.warn('initProviderData', `"${name}" no Strapi id — local fresh data only`);
      return { ...record, providerData: buildFreshProviderData() };
    }

    const pd = record.providerData;
    if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) {
      return record; // already populated
    }

    const failKey = name;
    const failCount = initFailures.current[failKey] || 0;
    if (failCount >= 5) {
      L.warn('initProviderData', `"${name}" too many failures — local fresh data`);
      return { ...record, providerData: buildFreshProviderData() };
    }

    const freshData = buildFreshProviderData();
    try {
      const res = await fetch(`${apiUrlRef.current}/api-providers/${record.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ data: { providerData: freshData } }),
      });
      if (!res.ok) {
        if (res.status === 404) return { ...record, providerData: buildFreshProviderData() };
        initFailures.current[failKey] = failCount + 1;
      } else {
        initFailures.current[failKey] = 0;
      }
    } catch {
      initFailures.current[failKey] = failCount + 1;
    }
    return { ...record, providerData: freshData };
  }, [authHeaders]); // apiUrl accessed via ref — stable

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    L.info('load()', 'useEffect fired', { apiUrl: apiUrl || 'EMPTY' });

    async function load() {
      if (!apiUrl) {
        L.warn('load()', 'NEXT_PUBLIC_API_URL empty — skipping Strapi');
        setReady(true);
        return;
      }

      try {
        // Step 1 — priority map
        const pmRes = await fetch(`${apiUrl}/api-providers-priority-map?populate=*`, { headers: authHeaders() });
        if (!pmRes.ok) {
          L.error('load()', `Step 1 FAILED HTTP ${pmRes.status}`);
          setReady(true);
          return;
        }
        const pmJson = await pmRes.json();
        L.info('load()', 'Step 1 raw JSON', pmJson);

        const pmRaw = pmJson?.data ?? {};
        const attrs = pmRaw.attributes ?? pmRaw;

        const pMap = attrs.prioritizedMap ?? PROVIDER.OPENSTREET;
        const pRoute = attrs.priotizedRouteDrawer ?? null;
        const pDistance = attrs.priotizedDistanceCalculator ?? null;
        const pEta = attrs.priotizedEtaCalculator ?? null;
        const pAutocomplete = attrs.priotizedAutocompleteApi ?? null;

        L.info('load()', 'Step 1 priorities', { pMap, pRoute, pDistance, pEta, pAutocomplete });

        setPrioritizedMap(pMap);
        setPrioritizedRoute(pRoute);
        setPrioritizedDistance(pDistance);
        setPrioritizedEta(pEta);
        setPrioritizedAutocomplete(pAutocomplete);

        // Step 2 — parse mapsProviders
        const rawList = attrs.mapsProviders ?? [];
        if (!rawList.length) L.error('load()', 'Step 2: mapsProviders empty in Strapi');
        const { providerNames: parsedList, perProviderApis } = parseMapsProviders(rawList);

        // Step 3 — auto-inject prioritized providers missing from the list
        const list = [...parsedList];
        for (const name of [pRoute, pDistance, pEta, pAutocomplete].filter(Boolean)) {
          if (!list.includes(name)) {
            list.push(name);
            L.warn('load()', `Step 3: "${name}" auto-injected (missing from mapsProviders)`);
          }
        }

        if (list.length === 0) {
          L.error('load()', 'Step 3: provider list empty — nothing to load');
          setReady(true);
          return;
        }

        // Step 4 — merge service API overrides
        setServiceApis(() => {
          const merged = { ...DEFAULT_SERVICE_APIS };
          for (const [provName, apis] of Object.entries(perProviderApis)) {
            merged[provName] = { ...(DEFAULT_SERVICE_APIS[provName] || {}), ...apis };
          }
          return merged;
        });

        setPriorityList(list);

        // Step 5 — fetch Strapi provider records
        const queryableNames = list.filter((n) => !INLINE_PROVIDERS.has(n));
        const providerMap = {};

        if (queryableNames.length > 0) {
          const filterParams = queryableNames
            .map((n, i) => `filters[providerName][$in][${i}]=${encodeURIComponent(n)}`)
            .join('&');
          const provRes = await fetch(`${apiUrl}/api-providers?${filterParams}&populate=*`, { headers: authHeaders() });
          const provJson = await provRes.json();
          const records = provJson?.data ?? [];

          L.info('load()', `Step 5: ${records.length} records (expected ${queryableNames.length})`);
          if (records.length === 0) L.error('load()', 'Step 5: ZERO records from Strapi');

          for (const item of records) {
            const flat = item.attributes ?? item;
            const name = flat.providerName;
            if (!name) continue;

            const record = {
              id: item.id,
              providerName: name,
              providerData: flat.providerData ?? {},
              maxMonthlyRequests: flat.maxMonthlyRequests ?? QUOTA_DEFAULTS.maxMonthlyRequests,
            };

            if (!DEEP_LINK_PROVIDERS.has(name)) {
              initProviderData(record).then((updated) => {
                setProviders((prev) => {
                  if (!prev[name]) return prev;
                  return { ...prev, [name]: { ...prev[name], record: updated, budget: computeBudget(updated) } };
                });
              }).catch(() => { });
            }

            const instance = createProviderInstance(name);
            if (!instance && !INLINE_PROVIDERS.has(name) && !DEEP_LINK_PROVIDERS.has(name)) {
              L.error('load()', `Step 5: "${name}" instance is null — check API key env var`);
            }
            providerMap[name] = { record, instance, budget: computeBudget(record) };
          }
        }

        // Step 6 — synthesise missing entries
        for (const name of list) {
          if (providerMap[name]) continue;
          const defaultRecord = {
            id: null, providerName: name,
            providerData: buildFreshProviderData(),
            maxMonthlyRequests: QUOTA_DEFAULTS.maxMonthlyRequests,
          };
          const instance = createProviderInstance(name);
          providerMap[name] = { record: defaultRecord, instance, budget: computeBudget(defaultRecord) };
          L.warn('load()', `Step 6: "${name}" synthesised — no Strapi record`);
        }

        // Step 7 — commit
        setProviders(providerMap);

        // Final summary
        console.log('\n[MapsProvider] ════════════════ FINAL PROVIDER MAP ════════════════');
        for (const [n, p] of Object.entries(providerMap)) {
          const isInline = INLINE_PROVIDERS.has(n);
          const usable = !!p.instance || isInline;
          console.log(
            `[MapsProvider] ${usable ? '✅' : '❌'} "${n}"` +
            ` | instance:${!!p.instance} | inline:${isInline}` +
            ` | strapiId:${p.record?.id ?? 'none'}` +
            ` | monthly:${p.budget?.monthlyRemaining}` +
            ` | geo/day:${p.budget?.dailyGeoRemaining}` +
            ` | js/day:${p.budget?.dailyJSRemaining}`,
          );
        }
        console.log('\n[MapsProvider] ════════════ PRIORITIZED CHECK ════════════');
        for (const [label, name] of [['map', pMap], ['route', pRoute], ['distance', pDistance], ['eta', pEta], ['autocomplete', pAutocomplete]]) {
          if (!name) { console.log(`[MapsProvider]  ${label}: (not set)`); continue; }
          const p = providerMap[name];
          const usable = p && (!!p.instance || INLINE_PROVIDERS.has(name));
          const quota = p ? hasQuota(p.record, 'GeocoderHTTPAPI') : false;
          console.log(`[MapsProvider] ${(usable && quota) ? '✅' : '❌'} ${label}: "${name}" | usable:${usable} | quota:${quota}`);
        }
        console.log('[MapsProvider] ═══════════════════════════════════════════════════════\n');

        setAllExhausted(!list.some((n) => providerMap[n]?.instance != null || INLINE_PROVIDERS.has(n)));

      } catch (err) {
        L.error('load()', 'UNHANDLED ERROR', { message: err?.message, stack: err?.stack?.slice(0, 400) });
        setAllExhausted(true);
      } finally {
        setReady(true);
      }
    }

    load();
  }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── logRequest ────────────────────────────────────────────────────────────
  //
  // FIX: `providers` has been REMOVED from the dependency array.
  //      All provider reads now go through `providersRef.current` which is
  //      kept in sync by the effect above.  This breaks the chain:
  //        setProviders (optimistic) → new logRequest → new useMemo value
  //        → all context consumers re-render → tracking page "refreshes"
  //
  // FIX: skip remote logging entirely on /tracking routes to prevent the
  //      polling-heavy screen from inflating quota counts on every poll.
  // ─────────────────────────────────────────────────────────────────────────
  const logRequest = useCallback((providerName, apiType) => {
    // ── Skip on tracking routes ───────────────────────────────────────────
    if (isTrackingRoute()) {
      L.trace('logRequest', `"${providerName}" skipped — tracking route`);
      return;
    }

    const p = providersRef.current[providerName];
    if (!p) { L.warn('logRequest', `"${providerName}" not in providersRef`); return; }
    if (p.record.id == null) return; // synthesised record — nothing to persist

    const failKey = `${providerName}:${p.record.id}`;
    const failCount = logFailures.current[failKey] || 0;
    if (failCount >= 3) return;

    const monthKey = getMonthKey();
    const dayKey = getDayKey();
    const bucket = dailyBucketKey(apiType);

    const existing = { ...buildFreshProviderData(), ...p.record.providerData };
    const monthData = { ...(existing.requestCounts?.[monthKey] || {}) };
    const dayData = { ...(existing.dailyCounts?.[dayKey] || {}) };

    monthData[apiType] = (Number(monthData[apiType]) || 0) + 1;
    dayData[bucket] = (Number(dayData[bucket]) || 0) + 1;

    const updatedProviderData = {
      ...existing,
      requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
      dailyCounts: { ...existing.dailyCounts, [dayKey]: dayData },
    };

    // Fire-and-forget PUT — do NOT call setProviders here; the optimistic
    // local update below is the only state write, and it uses the functional
    // updater so it never creates a new logRequest reference.
    fetch(`${apiUrlRef.current}/api-providers/${p.record.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ data: { providerData: updatedProviderData } }),
    })
      .then((res) => {
        if (!res.ok) {
          logFailures.current[failKey] = failCount + 1;
          if (failCount === 0) L.warn('logRequest', `"${providerName}" PUT ${res.status}`);
        } else {
          logFailures.current[failKey] = 0;
        }
      })
      .catch(() => { logFailures.current[failKey] = failCount + 1; });

    // Optimistic local state update — functional updater, no extra deps needed
    setProviders((prev) => {
      const cur = prev[providerName];
      if (!cur) return prev;
      const updatedRecord = { ...cur.record, providerData: updatedProviderData };
      return { ...prev, [providerName]: { ...cur, record: updatedRecord, budget: computeBudget(updatedRecord) } };
    });
  }, [authHeaders]); // ← only authHeaders; providers accessed via ref

  // ─────────────────────────────────────────────────────────────────────────
  // PROVIDER RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────

  const resolveServiceProvider = useCallback((explicitName, serviceType, failedSet = new Set()) => {
    const apiType = serviceType === 'autoComplete' ? 'JavaScriptAPI' : 'GeocoderHTTPAPI';
    const providerKeys = Object.keys(providers);

    if (providerKeys.length === 0) {
      L.error('resolveServiceProvider', 'providers state EMPTY — load() not completed yet');
    }

    const isUsable = (name) => {
      if (failedSet.has(name)) return false;
      if (INLINE_PROVIDERS.has(name)) return true;
      if (DEEP_LINK_PROVIDERS.has(name)) return !!providers[name]?.instance;
      const p = providers[name];
      if (!p) { L.warn('resolveServiceProvider', `"${name}" not in state`); return false; }
      if (!p.instance) { L.warn('resolveServiceProvider', `"${name}" no instance — check API key`); return false; }
      return hasQuota(p.record, apiType);
    };

    const toEntry = (name) => ({
      name,
      instance: providers[name]?.instance ?? null,
      record: providers[name]?.record ?? null,
      apiMethod: serviceApis[name]?.[serviceType] ?? DEFAULT_SERVICE_APIS[name]?.[serviceType] ?? null,
    });

    if (explicitName && isUsable(explicitName)) {
      const entry = toEntry(explicitName);
      L.ok('resolveServiceProvider', `EXPLICIT "${explicitName}" → ${serviceType}`, { apiMethod: entry.apiMethod });
      return entry;
    }
    if (explicitName) {
      L.warn('resolveServiceProvider', `explicit "${explicitName}" not usable — walking priority list`);
    }

    for (const name of priorityList) {
      if (name === explicitName) continue;
      if (name === PROVIDER.LOCAL && failedSet.has(PROVIDER.LOCAL)) {
        if (isUsable(PROVIDER.OPENSTREET)) return toEntry(PROVIDER.OPENSTREET);
        continue;
      }
      if (isUsable(name)) {
        const entry = toEntry(name);
        L.ok('resolveServiceProvider', `FALLBACK "${name}" → ${serviceType}`, { apiMethod: entry.apiMethod });
        return entry;
      }
    }

    L.fail('resolveServiceProvider', `NO provider for ${serviceType}`);
    return null;
  }, [priorityList, providers, serviceApis]);

  // ── Local OSRM helper ─────────────────────────────────────────────────────
  const fetchLocalRoute = useCallback(async (origin, destination) => {
    if (!localMapUrl) throw new Error('NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL not configured');
    const res = await fetch(
      `${localMapUrl}/api/route?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`,
    );
    if (!res.ok) throw new Error(`Local route API ${res.status}`);
    const data = await res.json();
    return {
      type: 'local',
      distance: data.distance,
      duration: data.duration,
      distanceValue: data.distanceValue,
      durationValue: data.durationValue,
      geometry: data.geometry ?? [],
      steps: data.steps ?? [],
    };
  }, [localMapUrl]);

  // ─────────────────────────────────────────────────────────────────────────
  // GENERIC SERVICE RUNNER
  // ─────────────────────────────────────────────────────────────────────────
  const runWithFallback = useCallback(async ({
    serviceType, explicitProvider, handler, finalFallback = async () => null,
  }) => {
    const failed = new Set();
    const maxAttempts = priorityList.length + 2;

    for (let i = 0; i < maxAttempts; i++) {
      const resolvedExplicit = failed.has(explicitProvider) ? null : explicitProvider;
      const p = resolveServiceProvider(resolvedExplicit, serviceType, failed);
      if (!p) break;

      try {
        const result = await handler(p);
        if (result != null) return result;
        failed.add(p.name);
      } catch (err) {
        L.warn('runWithFallback', `"${p.name}" threw`, { message: err?.message });
        failed.add(p.name);
      }
    }

    L.warn('runWithFallback', `all providers failed for "${serviceType}" — finalFallback`);
    return finalFallback();
  }, [priorityList, resolveServiceProvider]);

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  const searchPlaces = useCallback(async (query, countryCode = null) => {
    if (!query || query.length < 2) return [];
    return runWithFallback({
      serviceType: 'autoComplete', explicitProvider: prioritizedAutocomplete,
      handler: async (p) => {
        if (DEEP_LINK_PROVIDERS.has(p.name) && !p.apiMethod) return null;
        if (INLINE_PROVIDERS.has(p.name)) {
          const r = await nominatimSearch(query, countryCode);
          return r.length ? r : null;
        }
        if (!p.instance?.searchPlaces) return null;
        if (typeof window !== 'undefined' && window.__googleMapsViewport) {
          const vp = window.__googleMapsViewport;
          if (p.instance.setViewport) p.instance.setViewport(vp.lat, vp.lng, vp.radiusM, vp.regionCode || countryCode);
          else if (p.instance.setCenter) p.instance.setCenter(vp.lat, vp.lng);
        }
        const results = await p.instance.searchPlaces(query, countryCode, p.apiMethod);
        if (results?.length) {
          logRequest(p.name, p.apiMethod || 'JavaScriptAPI');
          return results;
        }
        return null;
      },
      finalFallback: () => nominatimSearch(query, countryCode),
    });
  }, [runWithFallback, logRequest, prioritizedAutocomplete]);

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
        if (p.name === PROVIDER.LOCAL) return fetchLocalRoute(origin, destination);
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

  const getInitialLocation = useCallback(
    () => getIPLocation(localMapUrl),
    [localMapUrl],
  );

  const getProviderStatus = useCallback(() =>
    priorityList.map((name) => {
      const p = providers[name];
      if (!p) return { name, loaded: false };
      return {
        name, loaded: true,
        hasInstance: !!p.instance || INLINE_PROVIDERS.has(name),
        budget: p.budget,
        serviceApis: serviceApis[name] ?? null,
        canUseGeo: hasQuota(p.record, 'GeocoderHTTPAPI'),
        canUseJS: hasQuota(p.record, 'JavaScriptAPI'),
      };
    }),
    [priorityList, providers, serviceApis]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__mapsProviderStatus = getProviderStatus;
    }
  }, [getProviderStatus]);

  // ── Context value — stable identity unless something actually changes ────
  const value = useMemo(() => ({
    ready, allExhausted,
    prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta, prioritizedAutocomplete,
    serviceApis,
    searchPlaces, getPlaceDetails, reverseGeocode, getInitialLocation,
    getRoute, calculateDistance, calculateEta,
    getProviderStatus, localMapUrl,
  }), [
    ready, allExhausted,
    prioritizedMap, prioritizedRoute, prioritizedDistance, prioritizedEta, prioritizedAutocomplete,
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