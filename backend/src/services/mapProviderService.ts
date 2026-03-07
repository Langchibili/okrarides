// PATH: Okra/Okrarides/backend/src/services/mapProviderService.ts
//
// Orchestrates which map API provider to use based on:
//   1. Priority order from apiProvidersPriorityMap (Strapi single type)
//   2. Monthly request counts vs maxMonthlyRequests per apiProvider record
//   3. Falls back to local server / Nominatim if all providers exhausted
//
// Request counts are stored in providerData as:
//   { requestCounts: { march: { GeocoderHTTPAPI: 20, JavaScriptAPI: 4 }, ... } }

import { googleMapService } from './googleMapService';
import { yandexMapService } from './yandexMapService';
import { localMapService } from './localMapService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationDetails {
  name: string;
  address: string;
  placeId: string;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  state: string | null;
  streetAddress: string | null;
  streetNumber: string | null;
}

type APIType = 'GeocoderHTTPAPI' | 'JavaScriptAPI' | 'PlacesAPI' | 'RoutingAPI';

interface ProviderRecord {
  id: number;
  providerName: string;
  providerData: Record<string, any>;
  maxMonthlyRequests: number;
}

// ─── Month helper ─────────────────────────────────────────────────────────────

function getCurrentMonthKey(): string {
  return new Date()
    .toLocaleString('en-US', { month: 'long' })
    .toLowerCase(); // e.g. "march"
}

// ─── Core: get ordered list of usable providers ───────────────────────────────

async function getProviderPriorityList(): Promise<string[]> {
  try {
    const priorityMap: any = await strapi.db.query('api::api-providers-priority-map.api-providers-priority-map').findMany()

    if (!priorityMap) return [];

    // mapsProviders is a JSON array of provider name strings e.g. ["yandexmaps", "googlemaps"]
    const list = priorityMap.mapsProviders;
    if (!Array.isArray(list)) return [];
    return list;
  } catch (err) {
    console.error('[mapProviderService] getProviderPriorityList error:', err);
    return [];
  }
}

async function getProviderRecord(providerName: string): Promise<ProviderRecord | null> {
  try {
    const records = await strapi.entityService.findMany(
      'api::api-provider.api-provider' as any,
      {
        filters: { providerName },
        publicationState: 'live',
        limit: 1,
      }
    ) as any[];

    if (!records || records.length === 0) return null;
    return records[0];
  } catch (err) {
    console.error(`[mapProviderService] getProviderRecord(${providerName}) error:`, err);
    return null;
  }
}

function getMonthlyCount(record: ProviderRecord, apiType: APIType): number {
  const month = getCurrentMonthKey();
  return record.providerData?.requestCounts?.[month]?.[apiType] ?? 0;
}

function getTotalMonthlyCount(record: ProviderRecord): number {
  const month = getCurrentMonthKey();
  const monthData = record.providerData?.requestCounts?.[month] ?? {};
  return Object.values(monthData).reduce((sum: number, v: any) => sum + (v || 0), 0) as number;
}

// ─── Core: log a request ─────────────────────────────────────────────────────

export async function logProviderRequest(providerName: string, apiType: APIType): Promise<void> {
  try {
    const record = await getProviderRecord(providerName);
    if (!record) return;

    const month = getCurrentMonthKey();
    const existingData = record.providerData || {};
    const existingCounts = existingData.requestCounts || {};
    const monthData = existingCounts[month] || {};
    const currentCount = monthData[apiType] || 0;

    await strapi.db.query('api::api-provider.api-provider').update(
      {
        where:{id:record.id},
        data: {
          providerData: {
            ...existingData,
            requestCounts: {
              ...existingCounts,
              [month]: {
                ...monthData,
                [apiType]: currentCount + 1,
              },
            },
          },
        },
      }
    );
  } catch (err) {
    console.error(`[mapProviderService] logProviderRequest error:`, err);
    // Non-fatal — don't throw
  }
}

// ─── Core: find the first provider under its monthly limit ───────────────────

async function getActiveProvider(): Promise<{ name: string; record: ProviderRecord } | null> {
  const priorityList = await getProviderPriorityList();

  for (const providerName of priorityList) {
    const record = await getProviderRecord(providerName);
    if (!record) continue;

    const totalUsed = getTotalMonthlyCount(record);
    if (totalUsed < record.maxMonthlyRequests) {
      return { name: providerName, record };
    }
  }

  return null; // All providers exhausted — use local/Nominatim
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Reverse geocode coordinates using the highest-priority available provider.
 * Falls back through providers in order, then to the local server.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationDetails | null> {
  const active = await getActiveProvider();

  if (active) {
    const { name } = active;

    if (name === 'googlemaps') {
      const result = await googleMapService.reverseGeocode(latitude, longitude);
      if (result) {
        await logProviderRequest('googlemaps', 'GeocoderHTTPAPI');
        return result;
      }
    }

    if (name === 'yandexmaps') {
      const result = await yandexMapService.reverseGeocode(latitude, longitude);
      if (result) {
        await logProviderRequest('yandexmaps', 'GeocoderHTTPAPI');
        return result;
      }
    }
  }

  // Fallback: local self-hosted server (Nominatim)
  console.info('[mapProviderService] Using local server for reverse geocoding');
  return localMapService.reverseGeocode(latitude, longitude);
}

/**
 * Forward geocode an address using the highest-priority available provider.
 */
export async function geocodeAddress(address: string): Promise<{
  latitude: number;
  longitude: number;
  placeId: string;
} | null> {
  const active = await getActiveProvider();

  if (active) {
    const { name } = active;

    if (name === 'googlemaps') {
      const result = await googleMapService.geocodeAddress(address);
      if (result) {
        await logProviderRequest('googlemaps', 'GeocoderHTTPAPI');
        return result;
      }
    }

    if (name === 'yandexmaps') {
      const result = await yandexMapService.geocodeAddress(address);
      if (result) {
        await logProviderRequest('yandexmaps', 'GeocoderHTTPAPI');
        return result;
      }
    }
  }

  // Fallback: local server
  return localMapService.geocodeAddress(address);
}

/**
 * Check whether any provider still has budget remaining this month.
 * Useful for deciding whether the frontend should call provider APIs.
 */
export async function getProviderStatus(): Promise<{
  activeProvider: string | null;
  allExhausted: boolean;
  providers: Array<{ name: string; used: number; max: number; remaining: number }>;
}> {
  const priorityList = await getProviderPriorityList();
  const providers: Array<{ name: string; used: number; max: number; remaining: number }> = [];

  let activeProvider: string | null = null;

  for (const name of priorityList) {
    const record = await getProviderRecord(name);
    if (!record) continue;

    const used = getTotalMonthlyCount(record);
    const max = record.maxMonthlyRequests;
    const remaining = Math.max(0, max - used);

    providers.push({ name, used, max, remaining });

    if (!activeProvider && remaining > 0) {
      activeProvider = name;
    }
  }

  return {
    activeProvider,
    allExhausted: activeProvider === null,
    providers,
  };
}

export { getCurrentMonthKey };
