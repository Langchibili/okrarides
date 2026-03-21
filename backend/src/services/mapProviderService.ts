// // // PATH: Okra/Okrarides/backend/src/services/mapProviderService.ts
// // //
// // // Orchestrates which map API provider to use based on:
// // //   1. Priority order from apiProvidersPriorityMap (Strapi single type)
// // //   2. Monthly request counts vs maxMonthlyRequests per apiProvider record
// // //   3. Falls back to local server / Nominatim if all providers exhausted
// // //
// // // Request counts are stored in providerData as:
// // //   { requestCounts: { march: { GeocoderHTTPAPI: 20, JavaScriptAPI: 4 }, ... } }

// // import { googleMapService } from './googleMapService';
// // import { yandexMapService } from './yandexMapService';
// // import { localMapService } from './localMapService';

// // // ─── Types ────────────────────────────────────────────────────────────────────

// // interface LocationDetails {
// //   name: string;
// //   address: string;
// //   placeId: string;
// //   city: string | null;
// //   country: string | null;
// //   postalCode: string | null;
// //   state: string | null;
// //   streetAddress: string | null;
// //   streetNumber: string | null;
// // }

// // type APIType = 'GeocoderHTTPAPI' | 'JavaScriptAPI' | 'PlacesAPI' | 'RoutingAPI';

// // interface ProviderRecord {
// //   id: number;
// //   providerName: string;
// //   providerData: Record<string, any>;
// //   maxMonthlyRequests: number;
// // }

// // // ─── Month helper ─────────────────────────────────────────────────────────────

// // function getCurrentMonthKey(): string {
// //   return new Date()
// //     .toLocaleString('en-US', { month: 'long' })
// //     .toLowerCase(); // e.g. "march"
// // }

// // // ─── Core: get ordered list of usable providers ───────────────────────────────

// // async function getProviderPriorityList(): Promise<string[]> {
// //   try {
// //     const priorityMap: any = await strapi.db.query('api::api-providers-priority-map.api-providers-priority-map').findMany()

// //     if (!priorityMap) return [];

// //     // mapsProviders is a JSON array of provider name strings e.g. ["yandexmaps", "googlemaps"]
// //     const list = priorityMap.mapsProviders;
// //     if (!Array.isArray(list)) return [];
// //     return list;
// //   } catch (err) {
// //     console.error('[mapProviderService] getProviderPriorityList error:', err);
// //     return [];
// //   }
// // }

// // async function getProviderRecord(providerName: string): Promise<ProviderRecord | null> {
// //   try {
// //     const records = await strapi.entityService.findMany(
// //       'api::api-provider.api-provider' as any,
// //       {
// //         filters: { providerName },
// //         publicationState: 'live',
// //         limit: 1,
// //       }
// //     ) as any[];

// //     if (!records || records.length === 0) return null;
// //     return records[0];
// //   } catch (err) {
// //     console.error(`[mapProviderService] getProviderRecord(${providerName}) error:`, err);
// //     return null;
// //   }
// // }

// // function getMonthlyCount(record: ProviderRecord, apiType: APIType): number {
// //   const month = getCurrentMonthKey();
// //   return record.providerData?.requestCounts?.[month]?.[apiType] ?? 0;
// // }

// // function getTotalMonthlyCount(record: ProviderRecord): number {
// //   const month = getCurrentMonthKey();
// //   const monthData = record.providerData?.requestCounts?.[month] ?? {};
// //   return Object.values(monthData).reduce((sum: number, v: any) => sum + (v || 0), 0) as number;
// // }

// // // ─── Core: log a request ─────────────────────────────────────────────────────

// // export async function logProviderRequest(providerName: string, apiType: APIType): Promise<void> {
// //   try {
// //     const record = await getProviderRecord(providerName);
// //     if (!record) return;

// //     const month = getCurrentMonthKey();
// //     const existingData = record.providerData || {};
// //     const existingCounts = existingData.requestCounts || {};
// //     const monthData = existingCounts[month] || {};
// //     const currentCount = monthData[apiType] || 0;

// //     await strapi.db.query('api::api-provider.api-provider').update(
// //       {
// //         where:{id:record.id},
// //         data: {
// //           providerData: {
// //             ...existingData,
// //             requestCounts: {
// //               ...existingCounts,
// //               [month]: {
// //                 ...monthData,
// //                 [apiType]: currentCount + 1,
// //               },
// //             },
// //           },
// //         },
// //       }
// //     );
// //   } catch (err) {
// //     console.error(`[mapProviderService] logProviderRequest error:`, err);
// //     // Non-fatal — don't throw
// //   }
// // }

// // // ─── Core: find the first provider under its monthly limit ───────────────────

// // async function getActiveProvider(): Promise<{ name: string; record: ProviderRecord } | null> {
// //   const priorityList = await getProviderPriorityList();

// //   for (const providerName of priorityList) {
// //     const record = await getProviderRecord(providerName);
// //     if (!record) continue;

// //     const totalUsed = getTotalMonthlyCount(record);
// //     if (totalUsed < record.maxMonthlyRequests) {
// //       return { name: providerName, record };
// //     }
// //   }

// //   return null; // All providers exhausted — use local/Nominatim
// // }

// // // ─── Public API ───────────────────────────────────────────────────────────────

// // /**
// //  * Reverse geocode coordinates using the highest-priority available provider.
// //  * Falls back through providers in order, then to the local server.
// //  */
// // export async function reverseGeocode(
// //   latitude: number,
// //   longitude: number
// // ): Promise<LocationDetails | null> {
// //   const active = await getActiveProvider();

// //   if (active) {
// //     const { name } = active;

// //     if (name === 'googlemaps') {
// //       const result = await googleMapService.reverseGeocode(latitude, longitude);
// //       if (result) {
// //         await logProviderRequest('googlemaps', 'GeocoderHTTPAPI');
// //         return result;
// //       }
// //     }

// //     if (name === 'yandexmaps') {
// //       const result = await yandexMapService.reverseGeocode(latitude, longitude);
// //       if (result) {
// //         await logProviderRequest('yandexmaps', 'GeocoderHTTPAPI');
// //         return result;
// //       }
// //     }
// //   }

// //   // Fallback: local self-hosted server (Nominatim)
// //   console.info('[mapProviderService] Using local server for reverse geocoding');
// //   return localMapService.reverseGeocode(latitude, longitude);
// // }

// // /**
// //  * Forward geocode an address using the highest-priority available provider.
// //  */
// // export async function geocodeAddress(address: string): Promise<{
// //   latitude: number;
// //   longitude: number;
// //   placeId: string;
// // } | null> {
// //   const active = await getActiveProvider();

// //   if (active) {
// //     const { name } = active;

// //     if (name === 'googlemaps') {
// //       const result = await googleMapService.geocodeAddress(address);
// //       if (result) {
// //         await logProviderRequest('googlemaps', 'GeocoderHTTPAPI');
// //         return result;
// //       }
// //     }

// //     if (name === 'yandexmaps') {
// //       const result = await yandexMapService.geocodeAddress(address);
// //       if (result) {
// //         await logProviderRequest('yandexmaps', 'GeocoderHTTPAPI');
// //         return result;
// //       }
// //     }
// //   }

// //   // Fallback: local server
// //   return localMapService.geocodeAddress(address);
// // }

// // /**
// //  * Check whether any provider still has budget remaining this month.
// //  * Useful for deciding whether the frontend should call provider APIs.
// //  */
// // export async function getProviderStatus(): Promise<{
// //   activeProvider: string | null;
// //   allExhausted: boolean;
// //   providers: Array<{ name: string; used: number; max: number; remaining: number }>;
// // }> {
// //   const priorityList = await getProviderPriorityList();
// //   const providers: Array<{ name: string; used: number; max: number; remaining: number }> = [];

// //   let activeProvider: string | null = null;

// //   for (const name of priorityList) {
// //     const record = await getProviderRecord(name);
// //     if (!record) continue;

// //     const used = getTotalMonthlyCount(record);
// //     const max = record.maxMonthlyRequests;
// //     const remaining = Math.max(0, max - used);

// //     providers.push({ name, used, max, remaining });

// //     if (!activeProvider && remaining > 0) {
// //       activeProvider = name;
// //     }
// //   }

// //   return {
// //     activeProvider,
// //     allExhausted: activeProvider === null,
// //     providers,
// //   };
// // }

// // export { getCurrentMonthKey };

// // PATH: Okra/Okrarides/backend/src/services/mapProviderService.ts
// //
// // Orchestrates map API providers on the backend.
// //
// // Provider names match the updated Strapi schema (no trailing "maps"):
// //   google | yandex | apple | geoapify | waze | openstreet | local
// //
// // Service routing follows the same explicit-first → priority-list → fallback
// // pattern as the frontend MapsProvider:
// //   1. Use the provider explicitly assigned to the service in Strapi
// //   2. If that provider fails or is exhausted, walk the priority list
// //   3. local failure always substitutes openstreet before continuing
// //   4. Final fallback is always Nominatim / haversine (never throws)
// //
// // Quota tracking uses both monthly totals AND daily per-bucket counts
// // (matching the frontend schema).

// import { googleMapService }  from './googleMapService';
// import { yandexMapService }  from './yandexMapService';
// import { localMapService }   from './localMapService';

// // ─── Types ────────────────────────────────────────────────────────────────────

// export type ProviderName =
//   | 'google'
//   | 'yandex'
//   | 'apple'
//   | 'geoapify'
//   | 'waze'
//   | 'openstreet'
//   | 'local';

// export type ServiceType = 'routing' | 'distance' | 'eta' | 'autoComplete' | 'location';

// export type APIType =
//   | 'GeocoderHTTPAPI'
//   | 'JavaScriptAPI'
//   | 'PlacesAPI'
//   | 'RoutingAPI';

// interface ProviderRecord {
//   id:                 number;
//   providerName:       ProviderName;
//   providerData:       Record<string, any>;
//   maxMonthlyRequests: number;
// }

// export interface LocationDetails {
//   name:          string;
//   address:       string;
//   placeId:       string;
//   lat:           number;
//   lng:           number;
//   city:          string | null;
//   country:       string | null;
//   postalCode:    string | null;
//   state:         string | null;
//   streetAddress: string | null;
//   streetNumber:  string | null;
// }

// export interface RouteResult {
//   distanceMeters: number;
//   distanceText:   string;
//   durationSec:    number;
//   durationText:   string;
//   geometry:       [number, number][]; // [[lng, lat], ...]
// }

// // ─── Deep-link / inline providers (no quota to track) ────────────────────────

// const DEEP_LINK_PROVIDERS = new Set<ProviderName>(['waze', 'apple']);
// const INLINE_PROVIDERS    = new Set<ProviderName>(['openstreet', 'local']);

// // ─── Date helpers ─────────────────────────────────────────────────────────────

// function getMonthKey(): string {
//   const d = new Date();
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
// }

// function getDayKey(): string {
//   const d = new Date();
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// }

// function dailyBucket(apiType: APIType): 'js' | 'geo' {
//   return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
// }

// // ─── Strapi queries ───────────────────────────────────────────────────────────

// async function getPriorityConfig(): Promise<{
//   list:               ProviderName[];
//   prioritizedRoute:   ProviderName | null;
//   prioritizedDistance:ProviderName | null;
//   prioritizedEta:     ProviderName | null;
// }> {
//   try {
//     const rows = await strapi.db
//       .query('api::api-providers-priority-map.api-providers-priority-map')
//       .findMany({});

//     const pm   = rows?.[0] as any;
//     if (!pm) return { list: [], prioritizedRoute: null, prioritizedDistance: null, prioritizedEta: null };

//     return {
//       list:                (pm.mapsProviders               ?? []) as ProviderName[],
//       prioritizedRoute:    (pm.priotizedRouteDrawer         ?? null) as ProviderName | null,
//       prioritizedDistance: (pm.priotizedDistanceCalculator  ?? null) as ProviderName | null,
//       prioritizedEta:      (pm.priotizedEtaCalculator       ?? null) as ProviderName | null,
//     };
//   } catch (err) {
//     console.error('[mapProviderService] getPriorityConfig error:', err);
//     return { list: [], prioritizedRoute: null, prioritizedDistance: null, prioritizedEta: null };
//   }
// }

// async function getProviderRecord(name: ProviderName): Promise<ProviderRecord | null> {
//   try {
//     const records = await strapi.entityService.findMany(
//       'api::api-provider.api-provider' as any,
//       { filters: { providerName: name }, limit: 1 },
//     ) as any[];
//     return records?.[0] ?? null;
//   } catch (err) {
//     console.error(`[mapProviderService] getProviderRecord(${name}) error:`, err);
//     return null;
//   }
// }

// // ─── Quota helpers ────────────────────────────────────────────────────────────

// function getMonthlyUsed(record: ProviderRecord): number {
//   const monthData = record.providerData?.requestCounts?.[getMonthKey()] ?? {};
//   return Object.values(monthData).reduce((s: number, v: any) => s + (Number(v) || 0), 0) as number;
// }

// function getDailyUsed(record: ProviderRecord, bucket: 'js' | 'geo'): number {
//   return Number(record.providerData?.dailyCounts?.[getDayKey()]?.[bucket]) || 0;
// }

// function hasQuota(record: ProviderRecord, apiType: APIType): boolean {
//   if (INLINE_PROVIDERS.has(record.providerName) || DEEP_LINK_PROVIDERS.has(record.providerName)) return true;

//   const monthlyMax  = record.maxMonthlyRequests ?? 20_000;
//   const maxDailyGeo = Number(record.providerData?.maxDailyGeocoderApiRequests) || 800;
//   const maxDailyJS  = Number(record.providerData?.maxDailyJSApiRequests)       || 20_000;

//   if (getMonthlyUsed(record) >= monthlyMax)   return false;
//   if (apiType === 'GeocoderHTTPAPI' && getDailyUsed(record, 'geo') >= maxDailyGeo) return false;
//   if (apiType === 'JavaScriptAPI'   && getDailyUsed(record, 'js')  >= maxDailyJS)  return false;
//   return true;
// }

// // ─── Log a request (fire-and-forget) ─────────────────────────────────────────

// export async function logProviderRequest(name: ProviderName, apiType: APIType): Promise<void> {
//   try {
//     const record = await getProviderRecord(name);
//     if (!record) return;

//     const monthKey = getMonthKey();
//     const dayKey   = getDayKey();
//     const bucket   = dailyBucket(apiType);

//     const existing   = record.providerData ?? {};
//     const monthData  = { ...(existing.requestCounts?.[monthKey] ?? {}) };
//     const dayData    = { ...(existing.dailyCounts?.[dayKey]     ?? {}) };

//     monthData[apiType]  = (Number(monthData[apiType]) || 0) + 1;
//     dayData[bucket]     = (Number(dayData[bucket])    || 0) + 1;

//     await strapi.db.query('api::api-provider.api-provider').update({
//       where: { id: record.id },
//       data: {
//         providerData: {
//           ...existing,
//           requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
//           dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
//         },
//       },
//     });
//   } catch (err) {
//     console.error('[mapProviderService] logProviderRequest error:', err);
//     // Non-fatal — don't rethrow
//   }
// }

// // ─── Provider resolver ────────────────────────────────────────────────────────
// //
// // Resolution order:
// //   1. Explicit assigned provider (if budget remains and not already failed)
// //   2. Priority list top-to-bottom, skipping failed providers
// //      — local failed → substitute openstreet immediately before continuing
// //   3. null (all options exhausted)

// async function resolveProvider(
//   explicitName: ProviderName | null,
//   apiType:      APIType,
//   failed:       Set<ProviderName>,
// ): Promise<ProviderName | null> {

//   const { list } = await getPriorityConfig();

//   const isUsable = async (name: ProviderName): Promise<boolean> => {
//     if (failed.has(name)) return false;
//     if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;
//     const record = await getProviderRecord(name);
//     if (!record) return false;
//     return hasQuota(record, apiType);
//   };

//   // 1. Explicit provider
//   if (explicitName && !failed.has(explicitName) && (await isUsable(explicitName))) {
//     return explicitName;
//   }

//   // 2. Priority list
//   for (const name of list as ProviderName[]) {
//     if (name === explicitName) continue; // already tried above

//     // local failed → substitute openstreet
//     if (name === 'local' && failed.has('local')) {
//       if (await isUsable('openstreet')) return 'openstreet';
//       continue;
//     }

//     if (await isUsable(name)) return name;
//   }

//   return null;
// }

// // ─── Generic retry runner ─────────────────────────────────────────────────────

// async function runWithFallback<T>(
//   explicitProvider: ProviderName | null,
//   apiType:          APIType,
//   handler:          (name: ProviderName) => Promise<T | null>,
//   finalFallback:    () => Promise<T | null>,
// ): Promise<T | null> {
//   const failed = new Set<ProviderName>();
//   const maxAttempts = 8; // enough for any realistic priority list

//   for (let i = 0; i < maxAttempts; i++) {
//     const next = await resolveProvider(
//       failed.has(explicitProvider!) ? null : explicitProvider,
//       apiType,
//       failed,
//     );
//     if (!next) break;

//     try {
//       const result = await handler(next);
//       if (result != null) return result;
//     } catch (err: any) {
//       console.warn(`[mapProviderService] ${next} threw:`, err?.message);
//     }

//     failed.add(next);
//   }

//   return finalFallback();
// }

// // ─── Public API ───────────────────────────────────────────────────────────────

// /**
//  * Reverse geocode coordinates.
//  * Uses the provider priority list; falls back to local Nominatim.
//  */
// export async function reverseGeocode(
//   latitude:  number,
//   longitude: number,
// ): Promise<LocationDetails | null> {
//   return runWithFallback(
//     null,
//     'GeocoderHTTPAPI',
//     async (name) => {
//       if (name === 'google') {
//         const r = await googleMapService.reverseGeocode(latitude, longitude);
//         if (r) { await logProviderRequest('google', 'GeocoderHTTPAPI'); return r as LocationDetails; }
//       }
//       if (name === 'yandex') {
//         const r = await yandexMapService.reverseGeocode(latitude, longitude);
//         if (r) { await logProviderRequest('yandex', 'GeocoderHTTPAPI'); return r as LocationDetails; }
//       }
//       if (name === 'openstreet' || name === 'local') {
//         return localMapService.reverseGeocode(latitude, longitude) as Promise<LocationDetails | null>;
//       }
//       return null;
//     },
//     () => localMapService.reverseGeocode(latitude, longitude) as Promise<LocationDetails | null>,
//   );
// }

// /**
//  * Forward geocode an address string.
//  */
// export async function geocodeAddress(
//   address: string,
// ): Promise<{ latitude: number; longitude: number; placeId: string } | null> {
//   return runWithFallback(
//     null,
//     'GeocoderHTTPAPI',
//     async (name) => {
//       if (name === 'google') {
//         const r = await googleMapService.geocodeAddress(address);
//         if (r) { await logProviderRequest('google', 'GeocoderHTTPAPI'); return r; }
//       }
//       if (name === 'yandex') {
//         const r = await yandexMapService.geocodeAddress(address);
//         if (r) { await logProviderRequest('yandex', 'GeocoderHTTPAPI'); return r; }
//       }
//       if (name === 'openstreet' || name === 'local') {
//         return localMapService.geocodeAddress(address);
//       }
//       return null;
//     },
//     () => localMapService.geocodeAddress(address),
//   );
// }

// /**
//  * Resolve a placeId to coordinates using the Geocoding API.
//  * Replaces the expensive Place Details API.
//  */
// export async function geocodePlaceId(
//   placeId: string,
// ): Promise<LocationDetails | null> {
//   return runWithFallback(
//     null,
//     'GeocoderHTTPAPI',
//     async (name) => {
//       if (name === 'google') {
//         const r = await googleMapService.geocodePlaceId(placeId);
//         if (r) { await logProviderRequest('google', 'GeocoderHTTPAPI'); return r; }
//       }
//       return null;
//     },
//     async () => null,
//   );
// }

// /**
//  * Compute a route between two coordinates.
//  * Uses the explicitly assigned route provider first, then falls back.
//  */
// export async function computeRoute(
//   origin:      { lat: number; lng: number },
//   destination: { lat: number; lng: number },
// ): Promise<RouteResult | null> {
//   const { prioritizedRoute } = await getPriorityConfig();

//   return runWithFallback(
//     prioritizedRoute,
//     'RoutingAPI',
//     async (name) => {
//       if (name === 'google') {
//         const r = await googleMapService.computeRoute(origin, destination);
//         if (r) { await logProviderRequest('google', 'RoutingAPI'); return r; }
//       }
//       if (name === 'yandex') {
//         const r = await yandexMapService.computeRoute?.(origin, destination);
//         if (r) { await logProviderRequest('yandex', 'RoutingAPI'); return r as RouteResult; }
//       }
//       if (name === 'openstreet' || name === 'local') {
//         return localMapService.computeRoute(origin, destination) as Promise<RouteResult | null>;
//       }
//       return null;
//     },
//     () => localMapService.computeRoute(origin, destination) as Promise<RouteResult | null>,
//   );
// }

// /**
//  * Calculate distance only (cheaper than a full route when ETA isn't needed).
//  */
// export async function calculateDistance(
//   origin:      { lat: number; lng: number },
//   destination: { lat: number; lng: number },
// ): Promise<{ distanceMeters: number; distanceText: string } | null> {
//   const { prioritizedDistance } = await getPriorityConfig();

//   const route = await runWithFallback(
//     prioritizedDistance,
//     'RoutingAPI',
//     async (name) => {
//       if (name === 'google') return googleMapService.computeRoute(origin, destination);
//       if (name === 'yandex') return yandexMapService.computeRoute?.(origin, destination) as Promise<RouteResult | null>;
//       if (name === 'openstreet' || name === 'local') return localMapService.computeRoute(origin, destination) as Promise<RouteResult | null>;
//       return null;
//     },
//     async () => null,
//   );

//   if (route) {
//     return { distanceMeters: route.distanceMeters, distanceText: route.distanceText };
//   }

//   // Haversine straight-line fallback — always available
//   const R    = 6371_000;
//   const dLat = (destination.lat - origin.lat) * Math.PI / 180;
//   const dLon = (destination.lng - origin.lng) * Math.PI / 180;
//   const a    =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
//     Math.sin(dLon / 2) ** 2;
//   const meters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const km     = meters / 1000;
//   return {
//     distanceMeters: Math.round(meters),
//     distanceText:   km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`,
//   };
// }

// /**
//  * Calculate ETA only.
//  */
// export async function calculateEta(
//   origin:      { lat: number; lng: number },
//   destination: { lat: number; lng: number },
// ): Promise<{ durationSec: number; durationText: string } | null> {
//   const { prioritizedEta } = await getPriorityConfig();

//   const route = await runWithFallback(
//     prioritizedEta,
//     'RoutingAPI',
//     async (name) => {
//       if (name === 'google') return googleMapService.computeRoute(origin, destination);
//       if (name === 'yandex') return yandexMapService.computeRoute?.(origin, destination) as Promise<RouteResult | null>;
//       if (name === 'openstreet' || name === 'local') return localMapService.computeRoute(origin, destination) as Promise<RouteResult | null>;
//       return null;
//     },
//     async () => null,
//   );

//   if (!route) return null;
//   return { durationSec: route.durationSec, durationText: route.durationText };
// }

// /**
//  * Full provider status — useful for admin dashboards / healthchecks.
//  */
// export async function getProviderStatus(): Promise<{
//   activeProvider:  ProviderName | null;
//   allExhausted:    boolean;
//   providers: Array<{
//     name:      ProviderName;
//     used:      number;
//     max:       number;
//     remaining: number;
//   }>;
// }> {
//   const { list } = await getPriorityConfig();
//   const providers: Array<{ name: ProviderName; used: number; max: number; remaining: number }> = [];
//   let activeProvider: ProviderName | null = null;

//   for (const name of list as ProviderName[]) {
//     const record = await getProviderRecord(name);
//     if (!record) continue;

//     const used      = getMonthlyUsed(record);
//     const max       = record.maxMonthlyRequests ?? 20_000;
//     const remaining = Math.max(0, max - used);

//     providers.push({ name, used, max, remaining });
//     if (!activeProvider && remaining > 0) activeProvider = name;
//   }

//   return { activeProvider, allExhausted: activeProvider === null, providers };
// }
// PATH: Okra/Okrarides/backend/src/services/mapProviderService.ts
//
// Orchestrates map API providers on the backend.
//
// mapsProviders Strapi shape (new):
//   [{ name: "google", config: { routing: "routeApi", ... } }, ...]
//
// Service routing:
//   1. Explicit provider (priotizedRouteDrawer etc.) bypasses the list
//   2. Priority list walk on failure
//   3. local failure → openstreet substitution
//   4. haversine / null as absolute final fallback

import { googleMapService }  from './googleMapService';
import { yandexMapService }  from './yandexMapService';
import { localMapService }   from './localMapService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProviderName =
  | 'google' | 'yandex' | 'apple' | 'geoapify'
  | 'waze'   | 'openstreet' | 'local';

export type ServiceType = 'routing' | 'distance' | 'eta' | 'autoComplete' | 'location';

export type APIType =
  | 'GeocoderHTTPAPI' | 'JavaScriptAPI' | 'PlacesAPI' | 'RoutingAPI';

interface ProviderRecord {
  id:                 number;
  providerName:       ProviderName;
  providerData:       Record<string, any>;
  maxMonthlyRequests: number;
}

export interface LocationDetails {
  name:          string;
  address:       string;
  placeId:       string;
  lat:           number;
  lng:           number;
  city:          string | null;
  country:       string | null;
  postalCode:    string | null;
  state:         string | null;
  streetAddress: string | null;
  streetNumber:  string | null;
}

export interface RouteResult {
  distanceMeters: number;
  distanceText:   string;
  durationSec:    number;
  durationText:   string;
  geometry:       [number, number][];
}

// ─── Provider classification ───────────────────────────────────────────────────

const DEEP_LINK_PROVIDERS = new Set<ProviderName>(['waze', 'apple']);
const INLINE_PROVIDERS    = new Set<ProviderName>(['openstreet', 'local']);

// ─── Default service → api method map ────────────────────────────────────────
// Mirrors DEFAULT_SERVICE_APIS in the frontend MapsProvider.

const DEFAULT_SERVICE_APIS: Record<ProviderName, Record<ServiceType, string | null>> = {
  google:      { routing: 'routeApi',   distance: 'routeApi',   eta: 'routeApi',   autoComplete: 'placesApi',   location: 'geocoding'   },
  apple:       { routing: 'deeplink',   distance: 'mapkit',     eta: null,          autoComplete: 'search',      location: 'geocoder'    },
  yandex:      { routing: 'routeApi',   distance: 'routeApi',   eta: 'routeApi',   autoComplete: 'suggest',     location: 'geocoder'    },
  geoapify:    { routing: 'routingApi', distance: 'routingApi', eta: 'routingApi', autoComplete: 'placesApi',   location: 'geocodingApi'},
  waze:        { routing: 'deeplink',   distance: null,         eta: null,          autoComplete: null,          location: null          },
  openstreet:  { routing: 'osrm',       distance: 'osrm',       eta: 'osrm',       autoComplete: 'nominatim',   location: 'nominatim'   },
  local:       { routing: 'localOsrm',  distance: 'localOsrm',  eta: 'localOsrm',  autoComplete: 'nominatim',   location: 'nominatim'   },
};

// ─── Date helpers ──────────────────────────────────────────────────────────────

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dailyBucket(apiType: APIType): 'js' | 'geo' {
  return apiType === 'JavaScriptAPI' ? 'js' : 'geo';
}

// ─── Parse mapsProviders from Strapi ──────────────────────────────────────────
//
// New shape: [{ name: "google", config: { routing: "routeApi" } }, ...]
// Legacy:    ["google:", { routing: "routeApi" }, ...]  (still handled)

function parseMapsProviders(rawList: any[]): {
  providerNames: ProviderName[];
  perProviderApis: Record<string, Record<string, string>>;
} {
  const providerNames: ProviderName[] = [];
  const perProviderApis: Record<string, Record<string, string>> = {};
  const seen = new Set<string>();

  if (!Array.isArray(rawList)) return { providerNames, perProviderApis };

  const isNewFormat = rawList.length > 0 &&
    typeof rawList[0] === 'object' && rawList[0] !== null && 'name' in rawList[0];

  if (isNewFormat) {
    for (const entry of rawList) {
      if (!entry || typeof entry !== 'object') continue;
      const name   = (entry.name || '').trim() as ProviderName;
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
    const name = item.replace(/:$/, '').trim() as ProviderName;
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

// ─── Load priority config ──────────────────────────────────────────────────────

interface PriorityConfig {
  list:               ProviderName[];
  serviceApis:        Record<ProviderName, Record<ServiceType, string | null>>;
  prioritizedRoute:   ProviderName | null;
  prioritizedDistance:ProviderName | null;
  prioritizedEta:     ProviderName | null;
}

async function getPriorityConfig(): Promise<PriorityConfig> {
  try {
    const rows = await strapi.db
      .query('api::api-providers-priority-map.api-providers-priority-map')
      .findMany({});

    const pm = rows?.[0] as any;
    if (!pm) return emptyConfig();

    const { providerNames: list, perProviderApis } = parseMapsProviders(pm.mapsProviders ?? []);

    // Build merged serviceApis: defaults + Strapi overrides
    const serviceApis = { ...DEFAULT_SERVICE_APIS } as Record<ProviderName, Record<ServiceType, string | null>>;
    for (const [name, apis] of Object.entries(perProviderApis)) {
      serviceApis[name as ProviderName] = {
        ...(DEFAULT_SERVICE_APIS[name as ProviderName] || {} as any),
        ...apis,
      } as Record<ServiceType, string | null>;
    }

    return {
      list,
      serviceApis,
      prioritizedRoute:    (pm.priotizedRouteDrawer        ?? null) as ProviderName | null,
      prioritizedDistance: (pm.priotizedDistanceCalculator ?? null) as ProviderName | null,
      prioritizedEta:      (pm.priotizedEtaCalculator      ?? null) as ProviderName | null,
    };
  } catch (err) {
    console.error('[mapProviderService] getPriorityConfig error:', err);
    return emptyConfig();
  }
}

function emptyConfig(): PriorityConfig {
  return {
    list: [], serviceApis: DEFAULT_SERVICE_APIS as any,
    prioritizedRoute: null, prioritizedDistance: null, prioritizedEta: null,
  };
}

// ─── Provider record ───────────────────────────────────────────────────────────

async function getProviderRecord(name: ProviderName): Promise<ProviderRecord | null> {
  try {
    const records = await strapi.entityService.findMany(
      'api::api-provider.api-provider' as any,
      { filters: { providerName: name }, limit: 1 },
    ) as any[];
    return records?.[0] ?? null;
  } catch (err) {
    console.error(`[mapProviderService] getProviderRecord(${name}) error:`, err);
    return null;
  }
}

// ─── Quota ─────────────────────────────────────────────────────────────────────

function getMonthlyUsed(record: ProviderRecord): number {
  const monthData = record.providerData?.requestCounts?.[getMonthKey()] ?? {};
  return Object.values(monthData).reduce((s: number, v: any) => s + (Number(v) || 0), 0) as number;
}

function getDailyUsed(record: ProviderRecord, bucket: 'js' | 'geo'): number {
  return Number(record.providerData?.dailyCounts?.[getDayKey()]?.[bucket]) || 0;
}

function hasQuota(record: ProviderRecord, apiType: APIType): boolean {
  if (INLINE_PROVIDERS.has(record.providerName) || DEEP_LINK_PROVIDERS.has(record.providerName)) return true;
  const max       = record.maxMonthlyRequests ?? 20_000;
  const maxGeo    = Number(record.providerData?.maxDailyGeocoderApiRequests) || 800;
  const maxJS     = Number(record.providerData?.maxDailyJSApiRequests)       || 20_000;
  if (getMonthlyUsed(record) >= max) return false;
  if (apiType === 'GeocoderHTTPAPI' && getDailyUsed(record, 'geo') >= maxGeo) return false;
  if (apiType === 'JavaScriptAPI'   && getDailyUsed(record, 'js')  >= maxJS)  return false;
  return true;
}

// ─── Log request ───────────────────────────────────────────────────────────────

export async function logProviderRequest(name: ProviderName, apiType: APIType): Promise<void> {
  try {
    const record = await getProviderRecord(name);
    if (!record) return;

    const monthKey = getMonthKey();
    const dayKey   = getDayKey();
    const bucket   = dailyBucket(apiType);
    const existing = record.providerData ?? {};

    const monthData = { ...(existing.requestCounts?.[monthKey] ?? {}) };
    const dayData   = { ...(existing.dailyCounts?.[dayKey]     ?? {}) };
    monthData[apiType]  = (Number(monthData[apiType]) || 0) + 1;
    dayData[bucket]     = (Number(dayData[bucket])    || 0) + 1;

    await strapi.db.query('api::api-provider.api-provider').update({
      where: { id: record.id },
      data: {
        providerData: {
          ...existing,
          requestCounts: { ...existing.requestCounts, [monthKey]: monthData },
          dailyCounts:   { ...existing.dailyCounts,   [dayKey]:   dayData   },
        },
      },
    });
  } catch (err) {
    console.error('[mapProviderService] logProviderRequest error:', err);
  }
}

// ─── Provider resolution ───────────────────────────────────────────────────────
//
// Returns { name, apiMethod } | null
// apiMethod comes from serviceApis[name][serviceType]

async function resolveProvider(
  config:       PriorityConfig,
  explicitName: ProviderName | null,
  apiType:      APIType,
  failed:       Set<ProviderName>,
): Promise<{ name: ProviderName; apiMethod: string | null } | null> {

  const apiMethod = (name: ProviderName): string | null =>
    config.serviceApis[name]?.[
      apiType === 'JavaScriptAPI' ? 'autoComplete' : 'location'
    ] ?? DEFAULT_SERVICE_APIS[name]?.location ?? null;

  const isUsable = async (name: ProviderName): Promise<boolean> => {
    if (failed.has(name)) return false;
    if (INLINE_PROVIDERS.has(name) || DEEP_LINK_PROVIDERS.has(name)) return true;
    const record = await getProviderRecord(name);
    if (!record) return false;
    return hasQuota(record, apiType);
  };

  // 1. Explicit provider
  if (explicitName && !failed.has(explicitName) && await isUsable(explicitName)) {
    const method = config.serviceApis[explicitName]?.[_serviceTypeFromApiType(apiType)] ?? null;
    return { name: explicitName, apiMethod: method };
  }

  // 2. Priority list
  for (const name of config.list) {
    if (name === explicitName) continue;

    if (name === 'local' && failed.has('local')) {
      if (await isUsable('openstreet')) {
        return { name: 'openstreet', apiMethod: DEFAULT_SERVICE_APIS.openstreet.routing };
      }
      continue;
    }

    if (await isUsable(name)) {
      const method = config.serviceApis[name]?.[_serviceTypeFromApiType(apiType)] ?? null;
      return { name, apiMethod: method };
    }
  }
  return null;
}

function _serviceTypeFromApiType(apiType: APIType): ServiceType {
  if (apiType === 'JavaScriptAPI') return 'autoComplete';
  if (apiType === 'RoutingAPI')    return 'routing';
  return 'location';
}

// ─── Generic retry runner ──────────────────────────────────────────────────────

async function runWithFallback<T>(
  config:           PriorityConfig,
  explicitProvider: ProviderName | null,
  apiType:          APIType,
  handler:          (name: ProviderName, apiMethod: string | null) => Promise<T | null>,
  finalFallback:    () => Promise<T | null>,
): Promise<T | null> {
  const failed = new Set<ProviderName>();
  const maxAttempts = config.list.length + 2;

  for (let i = 0; i < maxAttempts; i++) {
    const resolved = await resolveProvider(
      config,
      failed.has(explicitProvider!) ? null : explicitProvider,
      apiType,
      failed,
    );
    if (!resolved) break;

    try {
      const result = await handler(resolved.name, resolved.apiMethod);
      if (result != null) return result;
    } catch (err: any) {
      console.warn(`[mapProviderService] ${resolved.name} threw:`, err?.message);
    }
    failed.add(resolved.name);
  }

  return finalFallback();
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function reverseGeocode(
  latitude: number, longitude: number,
): Promise<LocationDetails | null> {
  const config = await getPriorityConfig();
  return runWithFallback(config, null, 'GeocoderHTTPAPI',
    async (name, apiMethod) => {
      if (name === 'google') {
        const r = await googleMapService.reverseGeocode(latitude, longitude);
        if (r) { await logProviderRequest('google', 'GeocoderHTTPAPI'); return r as LocationDetails; }
      }
      if (name === 'yandex') {
        const r = await yandexMapService.reverseGeocode(latitude, longitude);
        if (r) { await logProviderRequest('yandex', 'GeocoderHTTPAPI'); return r as LocationDetails; }
      }
      if (name === 'openstreet' || name === 'local') {
        return localMapService.reverseGeocode(latitude, longitude) as Promise<LocationDetails | null>;
      }
      return null;
    },
    () => localMapService.reverseGeocode(latitude, longitude) as Promise<LocationDetails | null>,
  );
}

export async function geocodeAddress(
  address: string,
): Promise<{ latitude: number; longitude: number; placeId: string } | null> {
  const config = await getPriorityConfig();
  return runWithFallback(config, null, 'GeocoderHTTPAPI',
    async (name) => {
      if (name === 'google') {
        const r = await googleMapService.geocodeAddress(address);
        if (r) { await logProviderRequest('google', 'GeocoderHTTPAPI'); return r; }
      }
      if (name === 'yandex') {
        const r = await yandexMapService.geocodeAddress(address);
        if (r) { await logProviderRequest('yandex', 'GeocoderHTTPAPI'); return r; }
      }
      if (name === 'openstreet' || name === 'local') return localMapService.geocodeAddress(address);
      return null;
    },
    () => localMapService.geocodeAddress(address),
  );
}

export async function geocodePlaceId(
  placeId: string,
): Promise<LocationDetails | null> {
  const config = await getPriorityConfig();
  return runWithFallback(config, null, 'GeocoderHTTPAPI',
    async (name) => {
      if (name === 'google') {
        const r = await googleMapService.geocodePlaceId(placeId);
        if (r) { await logProviderRequest('google', 'GeocoderHTTPAPI'); return r; }
      }
      return null;
    },
    async () => null,
  );
}

export async function computeRoute(
  origin:      { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResult | null> {
  const config = await getPriorityConfig();
  return runWithFallback(config, config.prioritizedRoute, 'RoutingAPI',
    async (name, apiMethod) => {
      if (name === 'google') {
        // apiMethod = 'routeApi' → googleMapService.computeRoute() internally uses Routes API
        const r = await googleMapService.computeRoute(origin, destination);
        if (r) { await logProviderRequest('google', 'RoutingAPI'); return r; }
      }
      if (name === 'yandex') {
        const r = await yandexMapService.computeRoute?.(origin, destination);
        if (r) { await logProviderRequest('yandex', 'RoutingAPI'); return r as RouteResult; }
      }
      if (name === 'openstreet' || name === 'local') {
        return localMapService.computeRoute(origin, destination) as Promise<RouteResult | null>;
      }
      return null;
    },
    () => localMapService.computeRoute(origin, destination) as Promise<RouteResult | null>,
  );
}

export async function calculateDistance(
  origin:      { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ distanceMeters: number; distanceText: string } | null> {
  const config = await getPriorityConfig();
  const route  = await runWithFallback(config, config.prioritizedDistance, 'RoutingAPI',
    async (name) => {
      if (name === 'google')                          return googleMapService.computeRoute(origin, destination);
      if (name === 'yandex')                          return yandexMapService.computeRoute?.(origin, destination) as Promise<RouteResult | null>;
      if (name === 'openstreet' || name === 'local')  return localMapService.computeRoute(origin, destination) as Promise<RouteResult | null>;
      return null;
    },
    async () => null,
  );

  if (route) return { distanceMeters: route.distanceMeters, distanceText: route.distanceText };

  // Haversine fallback
  const R = 6_371_000;
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLon = (destination.lng - origin.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const meters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km     = meters / 1000;
  return {
    distanceMeters: Math.round(meters),
    distanceText:   km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`,
  };
}

export async function calculateEta(
  origin:      { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ durationSec: number; durationText: string } | null> {
  const config = await getPriorityConfig();
  const route  = await runWithFallback(config, config.prioritizedEta, 'RoutingAPI',
    async (name) => {
      if (name === 'google')                          return googleMapService.computeRoute(origin, destination);
      if (name === 'yandex')                          return yandexMapService.computeRoute?.(origin, destination) as Promise<RouteResult | null>;
      if (name === 'openstreet' || name === 'local')  return localMapService.computeRoute(origin, destination) as Promise<RouteResult | null>;
      return null;
    },
    async () => null,
  );
  if (!route) return null;
  return { durationSec: route.durationSec, durationText: route.durationText };
}

export async function getProviderStatus(): Promise<{
  activeProvider:  ProviderName | null;
  allExhausted:    boolean;
  providers: Array<{ name: ProviderName; used: number; max: number; remaining: number; serviceApis: any }>;
}> {
  const config    = await getPriorityConfig();
  const providers: any[] = [];
  let activeProvider: ProviderName | null = null;

  for (const name of config.list) {
    const record = await getProviderRecord(name);
    if (!record) continue;
    const used      = getMonthlyUsed(record);
    const max       = record.maxMonthlyRequests ?? 20_000;
    const remaining = Math.max(0, max - used);
    providers.push({ name, used, max, remaining, serviceApis: config.serviceApis[name] });
    if (!activeProvider && remaining > 0) activeProvider = name;
  }

  return { activeProvider, allExhausted: activeProvider === null, providers };
}