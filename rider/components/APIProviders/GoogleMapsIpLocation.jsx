// // "use client";

// // import { useEffect } from "react";

// // const GEO_LOC_KEY = "geo_loc_data";
// // const GEO_LOC_TIMESTAMP_KEY = "geo_loc_timestamp";
// // const GEO_LOC_STATUS_KEY = "geo_loc_status";
// // const GEOLOCATION_API_URL = "https://www.googleapis.com/geolocation/v1/geolocate";

// // /**
// //  * GoogleMapsIpLocation
// //  *
// //  * Silently fetches the user's approximate location via Google's Geolocation API
// //  * (IP / WiFi / cell-tower based — no browser permission required) and persists
// //  * the result to localStorage under the "geo_loc_*" namespace.
// //  *
// //  * localStorage keys written:
// //  *   geo_loc_data      – { lat, lng, accuracy } from the API response
// //  *   geo_loc_timestamp – ISO 8601 string of when the data was fetched
// //  *   geo_loc_status    – "success" | "error"
// //  *
// //  * Requires: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
// //  * Renders:  nothing (null) — drop anywhere in your layout/root component.
// //  */
// // export default function GoogleMapsIpLocation() {
// //   useEffect(() => {
// //     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// //     if (!apiKey) {
// //       console.warn(
// //         "[GoogleMapsIpLocation] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Skipping geolocation."
// //       );
// //       return;
// //     }

// //     const fetchGeolocation = async () => {
// //       try {
// //         const response = await fetch(
// //           `${GEOLOCATION_API_URL}?key=${apiKey}`,
// //           {
// //             method: "POST",
// //             headers: {
// //               "Content-Type": "application/json",
// //             },
// //             // An empty body triggers IP-based lookup.
// //             // Optionally include wifiAccessPoints / cellTowers for higher accuracy.
// //             body: JSON.stringify({}),
// //           }
// //         );

// //         if (!response.ok) {
// //           const errorBody = await response.json().catch(() => ({}));
// //           throw new Error(
// //             errorBody?.error?.message ||
// //               `Google Geolocation API responded with status ${response.status}`
// //           );
// //         }

// //         const data = await response.json();

// //         // data shape: { location: { lat, lng }, accuracy: <meters> }
// //         const geoPayload = {
// //           lat: data.location?.lat ?? null,
// //           lng: data.location?.lng ?? null,
// //           accuracy: data.accuracy ?? null,
// //         };

// //         localStorage.setItem(GEO_LOC_KEY, JSON.stringify(geoPayload));
// //         localStorage.setItem(GEO_LOC_TIMESTAMP_KEY, new Date().toISOString());
// //         localStorage.setItem(GEO_LOC_STATUS_KEY, "success");
// //       } catch (error) {
// //         console.error("[GoogleMapsIpLocation] Failed to fetch geolocation:", error);

// //         localStorage.setItem(GEO_LOC_TIMESTAMP_KEY, new Date().toISOString());
// //         localStorage.setItem(GEO_LOC_STATUS_KEY, "error");
// //       }
// //     };

// //     fetchGeolocation();
// //   }, []); // run once on mount

// //   return null;
// // }

// // /**
// //  * Helper — read the saved geolocation from localStorage.
// //  *
// //  * Returns null if nothing has been stored yet or if the fetch failed.
// //  *
// //  * Usage:
// //  *   import { getStoredGeolocation } from "@/components/GoogleMapsIpLocation";
// //  *   const geo = getStoredGeolocation(); // { lat, lng, accuracy } | null
// //  */
// // export function getStoredGeolocation() {
// //   if (typeof window === "undefined") return null;

// //   const status = localStorage.getItem(GEO_LOC_STATUS_KEY);
// //   if (status !== "success") return null;

// //   const raw = localStorage.getItem(GEO_LOC_KEY);
// //   if (!raw) return null;

// //   try {
// //     return JSON.parse(raw);
// //   } catch {
// //     return null;
// //   }
// // }
// "use client";

// import { useEffect } from "react";

// const GEO_LOC_KEY = "geo_loc_data";
// const GEO_LOC_TIMESTAMP_KEY = "geo_loc_timestamp";
// const GEO_LOC_STATUS_KEY = "geo_loc_status";
// const GEO_LOC_COUNTRY_NAME_KEY = "geo_loc_country_name";
// const GEO_LOC_CITY_NAME_KEY = "geo_loc_city_name";
// const GEO_LOC_COUNTRY_COORDS_KEY = "geo_loc_country_coords";
// const GEO_LOC_CITY_COORDS_KEY = "geo_loc_city_coords";

// const GEOLOCATION_API_URL = "https://www.googleapis.com/geolocation/v1/geolocate";
// const GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

// /**
//  * Formats a Google Geocoding API geometry bounds/viewport object into
//  * the "swLat,swLng~neLat,neLng" string format.
//  *
//  * Prefers `bounds` (the true administrative boundary) and falls back
//  * to `viewport` when bounds are unavailable.
//  */
// function formatCoordBounds(geometry) {
//   const box = geometry?.bounds ?? geometry?.viewport;
//   if (!box) return null;

//   const sw = box.southwest;
//   const ne = box.northeast;
//   if (!sw || !ne) return null;

//   return `${sw.lat},${sw.lng}~${ne.lat},${ne.lng}`;
// }

// /**
//  * Reverse-geocodes a { lat, lng } point and extracts country + city
//  * (locality) information, including their bounding-box coordinates.
//  *
//  * Returns:
//  *   {
//  *     countryName:  string | null,
//  *     cityName:     string | null,
//  *     countryCoords: "swLat,swLng~neLat,neLng" | null,
//  *     cityCoords:    "swLat,swLng~neLat,neLng" | null,
//  *   }
//  */
// async function reverseGeocode(lat, lng, apiKey) {
//   const url = `${GEOCODING_API_URL}?latlng=${lat},${lng}&key=${apiKey}`;
//   const response = await fetch(url);

//   if (!response.ok) {
//     throw new Error(`Geocoding API responded with status ${response.status}`);
//   }

//   const data = await response.json();

//   if (data.status !== "OK" || !Array.isArray(data.results)) {
//     throw new Error(`Geocoding API returned status: ${data.status}`);
//   }

//   let countryName = null;
//   let cityName = null;
//   let countryCoords = null;
//   let cityCoords = null;

//   // Each result has a types array. We look for the most specific result
//   // whose types include "country" or "locality" / "administrative_area_level_1".
//   for (const result of data.results) {
//     const types = result.types ?? [];

//     // ── Country ──────────────────────────────────────────────────────────────
//     if (!countryName && types.includes("country")) {
//       countryName =
//         result.address_components?.find((c) => c.types.includes("country"))
//           ?.long_name ?? null;
//       countryCoords = formatCoordBounds(result.geometry);
//     }

//     // ── City (locality preferred, admin level 1 as fallback) ─────────────────
//     if (!cityName && types.includes("locality")) {
//       cityName =
//         result.address_components?.find((c) => c.types.includes("locality"))
//           ?.long_name ?? null;
//       cityCoords = formatCoordBounds(result.geometry);
//     }

//     if (!cityName && types.includes("administrative_area_level_1")) {
//       cityName =
//         result.address_components?.find((c) =>
//           c.types.includes("administrative_area_level_1")
//         )?.long_name ?? null;
//       cityCoords = formatCoordBounds(result.geometry);
//     }

//     // Stop early once we have everything we need.
//     if (countryName && cityName) break;
//   }

//   return { countryName, cityName, countryCoords, cityCoords };
// }

// /**
//  * GoogleMapsIpLocation
//  *
//  * Silently fetches the user's approximate location via Google's Geolocation API
//  * (IP / WiFi / cell-tower based — no browser permission required), then
//  * reverse-geocodes the result to extract country and city information.
//  * Everything is persisted to localStorage under the "geo_loc_*" namespace.
//  *
//  * localStorage keys written:
//  *   geo_loc_data           – { lat, lng, accuracy } from the Geolocation API
//  *   geo_loc_timestamp      – ISO 8601 string of when the data was fetched
//  *   geo_loc_status         – "success" | "error"
//  *   geo_loc_country_name   – e.g. "Turkey"
//  *   geo_loc_city_name      – e.g. "Istanbul"
//  *   geo_loc_country_coords – "swLat,swLng~neLat,neLng" bounding box
//  *   geo_loc_city_coords    – "swLat,swLng~neLat,neLng" bounding box
//  *
//  * Requires: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
//  * Renders:  nothing (null) — drop anywhere in your layout/root component.
//  */
// export default function GoogleMapsIpLocation() {
//   useEffect(() => {
//     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
//     if (!apiKey) {
//       console.warn(
//         "[GoogleMapsIpLocation] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Skipping geolocation."
//       );
//       return;
//     }
//     const fetchGeolocation = async () => {
//       try {
//         // ── Step 1: IP-based lat/lng ────────────────────────────────────────
//         const geoResponse = await fetch(
//           `${GEOLOCATION_API_URL}?key=${apiKey}`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({}),
//           }
//         );

//         if (!geoResponse.ok) {
//           const errorBody = await geoResponse.json().catch(() => ({}));
//           throw new Error(
//             errorBody?.error?.message ||
//               `Google Geolocation API responded with status ${geoResponse.status}`
//           );
//         }

//         const geoData = await geoResponse.json();

//         const geoPayload = {
//           lat: geoData.location?.lat ?? null,
//           lng: geoData.location?.lng ?? null,
//           accuracy: geoData.accuracy ?? null,
//         };

//         localStorage.setItem(GEO_LOC_KEY, JSON.stringify(geoPayload));
//         localStorage.setItem(GEO_LOC_TIMESTAMP_KEY, new Date().toISOString());
//         localStorage.setItem(GEO_LOC_STATUS_KEY, "success");

//         // ── Step 2: Reverse-geocode to country + city ───────────────────────
//         if (geoPayload.lat !== null && geoPayload.lng !== null) {
//           const { countryName, cityName, countryCoords, cityCoords } =
//             await reverseGeocode(geoPayload.lat, geoPayload.lng, apiKey);
//           if (countryName) localStorage.setItem(GEO_LOC_COUNTRY_NAME_KEY, countryName);
//           if (cityName)    localStorage.setItem(GEO_LOC_CITY_NAME_KEY, cityName);
//           if (countryCoords) localStorage.setItem(GEO_LOC_COUNTRY_COORDS_KEY, countryCoords);
//           if (cityCoords)    localStorage.setItem(GEO_LOC_CITY_COORDS_KEY, cityCoords);
//         }
//       } catch (error) {
//         console.error("[GoogleMapsIpLocation] Failed to fetch geolocation:", error);
//         localStorage.setItem(GEO_LOC_TIMESTAMP_KEY, new Date().toISOString());
//         localStorage.setItem(GEO_LOC_STATUS_KEY, "error");
//       }
//     };

//     fetchGeolocation();
//   }, []); // run once on mount

//   return null;
// }

// /**
//  * Helper — read the saved geolocation from localStorage.
//  *
//  * Returns null if nothing has been stored yet or if the fetch failed.
//  *
//  * Usage:
//  *   import { getStoredGeolocation } from "@/components/GoogleMapsIpLocation";
//  *   const geo = getStoredGeolocation();
//  *   // {
//  *   //   lat, lng, accuracy,
//  *   //   countryName, cityName,
//  *   //   countryCoords, cityCoords   ← "swLat,swLng~neLat,neLng"
//  *   // } | null
//  */
// export function getStoredGeolocation() {
//   if (typeof window === "undefined") return null;

//   const status = localStorage.getItem(GEO_LOC_STATUS_KEY);
//   if (status !== "success") return null;

//   const raw = localStorage.getItem(GEO_LOC_KEY);
//   if (!raw) return null;

//   try {
//     const base = JSON.parse(raw);
//     return {
//       ...base,
//       countryName:   localStorage.getItem(GEO_LOC_COUNTRY_NAME_KEY) ?? null,
//       cityName:      localStorage.getItem(GEO_LOC_CITY_NAME_KEY) ?? null,
//       countryCoords: localStorage.getItem(GEO_LOC_COUNTRY_COORDS_KEY) ?? null,
//       cityCoords:    localStorage.getItem(GEO_LOC_CITY_COORDS_KEY) ?? null,
//     };
//   } catch {
//     return null;
//   }
// }
"use client";

import { useEffect } from "react";

const GEO_LOC_KEY = "geo_loc_data";
const GEO_LOC_TIMESTAMP_KEY = "geo_loc_timestamp";
const GEO_LOC_STATUS_KEY = "geo_loc_status";
const GEO_LOC_COUNTRY_NAME_KEY = "geo_loc_country_name";
const GEO_LOC_CITY_NAME_KEY = "geo_loc_city_name";
const GEO_LOC_COUNTRY_COORDS_KEY = "geo_loc_country_coords";
const GEO_LOC_CITY_COORDS_KEY = "geo_loc_city_coords";

const GEO_LOC_COOKIE = "geolocationObtained";
const GEO_LOC_COOKIE_TTL_HOURS = 6;

const GEOLOCATION_API_URL = "https://www.googleapis.com/geolocation/v1/geolocate";
const GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

// ── Cookie helpers ────────────────────────────────────────────────────────────

/**
 * Sets a cookie with a given name, value, and expiry in hours.
 */
function setCookie(name, value, expiryHours) {
  const expires = new Date();
  expires.setTime(expires.getTime() + expiryHours * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Reads a cookie by name. Returns null if not found.
 */
function getCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

// ── Geocoding helpers ─────────────────────────────────────────────────────────

function formatCoordBounds(geometry) {
  const box = geometry?.bounds ?? geometry?.viewport;
  if (!box) return null;

  const sw = box.southwest;
  const ne = box.northeast;
  if (!sw || !ne) return null;

  return `${sw.lat},${sw.lng}~${ne.lat},${ne.lng}`;
}

async function reverseGeocode(lat, lng, apiKey) {
  const url = `${GEOCODING_API_URL}?latlng=${lat},${lng}&key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding API responded with status ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "OK" || !Array.isArray(data.results)) {
    throw new Error(`Geocoding API returned status: ${data.status}`);
  }

  let countryName = null;
  let cityName = null;
  let countryCoords = null;
  let cityCoords = null;

  for (const result of data.results) {
    const types = result.types ?? [];

    if (!countryName && types.includes("country")) {
      countryName =
        result.address_components?.find((c) => c.types.includes("country"))
          ?.long_name ?? null;
      countryCoords = formatCoordBounds(result.geometry);
    }

    if (!cityName && types.includes("locality")) {
      cityName =
        result.address_components?.find((c) => c.types.includes("locality"))
          ?.long_name ?? null;
      cityCoords = formatCoordBounds(result.geometry);
    }

    if (!cityName && types.includes("administrative_area_level_1")) {
      cityName =
        result.address_components?.find((c) =>
          c.types.includes("administrative_area_level_1")
        )?.long_name ?? null;
      cityCoords = formatCoordBounds(result.geometry);
    }

    if (countryName && cityName) break;
  }

  return { countryName, cityName, countryCoords, cityCoords };
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * GoogleMapsIpLocation
 *
 * Silently fetches the user's approximate location via Google's Geolocation API
 * (IP / WiFi / cell-tower based — no browser permission required), then
 * reverse-geocodes the result to extract country and city information.
 * Everything is persisted to localStorage under the "geo_loc_*" namespace.
 *
 * A "geolocationObtained" cookie (TTL: 6 hours) is written on success.
 * If the cookie is present on mount the entire fetch is skipped — the data
 * already in localStorage is still fresh.
 *
 * localStorage keys written:
 *   geo_loc_data           – { lat, lng, accuracy }
 *   geo_loc_timestamp      – ISO 8601 fetch time
 *   geo_loc_status         – "success" | "error"
 *   geo_loc_country_name   – e.g. "Zambia"
 *   geo_loc_city_name      – e.g. "Lusaka"
 *   geo_loc_country_coords – "swLat,swLng~neLat,neLng"
 *   geo_loc_city_coords    – "swLat,swLng~neLat,neLng"
 *
 * Cookie written:
 *   geolocationObtained=true  (expires in 6 hours)
 *
 * Requires: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
 * Renders:  nothing (null) — drop anywhere in your layout/root component.
 */
export default function GoogleMapsIpLocation() {
  useEffect(() => {
    // ── Guard: skip if we already have fresh data ─────────────────────────
    if (getCookie(GEO_LOC_COOKIE) === "true") {
      console.info(
        "[GoogleMapsIpLocation] geolocationObtained cookie found — skipping fetch."
      );
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn(
        "[GoogleMapsIpLocation] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Skipping geolocation."
      );
      return;
    }

    const fetchGeolocation = async () => {
      try {
        // ── Step 1: IP-based lat/lng ────────────────────────────────────────
        const geoResponse = await fetch(`${GEOLOCATION_API_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!geoResponse.ok) {
          const errorBody = await geoResponse.json().catch(() => ({}));
          throw new Error(
            errorBody?.error?.message ||
              `Google Geolocation API responded with status ${geoResponse.status}`
          );
        }

        const geoData = await geoResponse.json();

        const geoPayload = {
          lat: geoData.location?.lat ?? null,
          lng: geoData.location?.lng ?? null,
          accuracy: geoData.accuracy ?? null,
        };

        localStorage.setItem(GEO_LOC_KEY, JSON.stringify(geoPayload));
        localStorage.setItem(GEO_LOC_TIMESTAMP_KEY, new Date().toISOString());
        localStorage.setItem(GEO_LOC_STATUS_KEY, "success");

        // ── Step 2: Reverse-geocode to country + city ───────────────────────
        if (geoPayload.lat !== null && geoPayload.lng !== null) {
          const { countryName, cityName, countryCoords, cityCoords } =
            await reverseGeocode(geoPayload.lat, geoPayload.lng, apiKey);

          if (countryName) localStorage.setItem(GEO_LOC_COUNTRY_NAME_KEY, countryName);
          if (cityName)    localStorage.setItem(GEO_LOC_CITY_NAME_KEY, cityName);
          if (countryCoords) localStorage.setItem(GEO_LOC_COUNTRY_COORDS_KEY, countryCoords);
          if (cityCoords)    localStorage.setItem(GEO_LOC_CITY_COORDS_KEY, cityCoords);
        }

        // ── Step 3: Stamp the cookie so we skip the next 6 hours ───────────
        setCookie(GEO_LOC_COOKIE, "true", GEO_LOC_COOKIE_TTL_HOURS);
      } catch (error) {
        console.error("[GoogleMapsIpLocation] Failed to fetch geolocation:", error);
        localStorage.setItem(GEO_LOC_TIMESTAMP_KEY, new Date().toISOString());
        localStorage.setItem(GEO_LOC_STATUS_KEY, "error");
        // Intentionally do NOT set the cookie on error so the next
        // page load will retry the fetch.
      }
    };

    fetchGeolocation();
  }, []);

  return null;
}

// ── Read helper ───────────────────────────────────────────────────────────────

/**
 * Reads the saved geolocation from localStorage.
 *
 * Returns null if nothing has been stored yet or if the last fetch failed.
 *
 * Usage:
 *   import { getStoredGeolocation } from "@/components/GoogleMapsIpLocation";
 *   const geo = getStoredGeolocation();
 *   // {
 *   //   lat, lng, accuracy,
 *   //   countryName, cityName,
 *   //   countryCoords, cityCoords   ← "swLat,swLng~neLat,neLng"
 *   // } | null
 */
export function getStoredGeolocation() {
  if (typeof window === "undefined") return null;

  const status = localStorage.getItem(GEO_LOC_STATUS_KEY);
  if (status !== "success") return null;

  const raw = localStorage.getItem(GEO_LOC_KEY);
  if (!raw) return null;

  try {
    const base = JSON.parse(raw);
    return {
      ...base,
      countryName:   localStorage.getItem(GEO_LOC_COUNTRY_NAME_KEY) ?? null,
      cityName:      localStorage.getItem(GEO_LOC_CITY_NAME_KEY) ?? null,
      countryCoords: localStorage.getItem(GEO_LOC_COUNTRY_COORDS_KEY) ?? null,
      cityCoords:    localStorage.getItem(GEO_LOC_CITY_COORDS_KEY) ?? null,
    };
  } catch {
    return null;
  }
}