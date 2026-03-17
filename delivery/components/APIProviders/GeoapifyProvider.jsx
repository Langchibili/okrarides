// // PATH: Okra/Okrarides/rider/components/Map/APIProviders/GeoapifyProvider.jsx
// //
// // Geoapify – Address Autocomplete + Forward / Reverse Geocoding
// // Docs: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
// //
// // Env var required: NEXT_PUBLIC_GEOAPIFY_API_KEY
// //
// // APIs used (all REST, no SDK):
// //   Autocomplete : GET https://api.geoapify.com/v1/geocode/autocomplete
// //   Forward geo  : GET https://api.geoapify.com/v1/geocode/search
// //   Reverse geo  : GET https://api.geoapify.com/v1/geocode/reverse
// //
// // Key design notes:
// //   • Autocomplete returns lat/lon in every result, so getPlaceDetails is
// //     almost always a zero-extra-request fast-path.
// //   • countryCode (ISO-3166-1 alpha-2, e.g. "zm") becomes a Geoapify
// //     filter=countrycode:<code> to keep suggestions local.
// //   • All console logs follow the same [ClassName.method] prefix convention
// //     used by the other providers so log filtering is consistent.

// export class GeoapifyProvider {
//   constructor(apiKey) {
//     this.apiKey           = apiKey;
//     this.name             = 'geoapify';
//     this.autocompleteBase = 'https://api.geoapify.com/v1/geocode/autocomplete';
//     this.forwardBase      = 'https://api.geoapify.com/v1/geocode/search';
//     this.reverseBase      = 'https://api.geoapify.com/v1/geocode/reverse';

//     console.log(
//       '[GeoapifyProvider] constructor — apiKey present:',
//       !!apiKey,
//       '| prefix:',
//       apiKey ? apiKey.slice(0, 8) + '...' : 'NONE',
//     );
//   }

//   // ── Autocomplete / search ─────────────────────────────────────────────────
//   // Called by MapsProvider.searchPlaces on every keystroke.
//   // Returns the standard shape used across all providers:
//   //   { place_id, main_text, secondary_text, address, name, lat, lng, ... }
//   async searchPlaces(query, countryCode = null) {
//     if (!this.apiKey) {
//       console.warn('[GeoapifyProvider.searchPlaces] no API key — skipping');
//       return null;
//     }
//     if (!query || query.length < 2) {
//       console.log('[GeoapifyProvider.searchPlaces] query too short — skipping');
//       return [];
//     }

//     console.log(
//       '[GeoapifyProvider.searchPlaces] ▶ query:' + JSON.stringify(query),
//       '| countryCode:' + countryCode,
//     );

//     try {
//       const params = new URLSearchParams({
//         text:   query,
//         format: 'json',
//         limit:  '7',
//         lang:   'en',
//         apiKey: this.apiKey,
//       });

//       // Restrict results to the specified country when provided.
//       // Geoapify expects lowercase alpha-2 codes: "zm", "us", etc.
//       if (countryCode) {
//         params.set('filter', 'countrycode:' + countryCode.toLowerCase());
//       }

//       const url = this.autocompleteBase + '?' + params;
//       console.log('[GeoapifyProvider.searchPlaces] → ' + url.replace(this.apiKey, 'REDACTED'));

//       const res = await fetch(url);
//       if (!res.ok) {
//         console.warn('[GeoapifyProvider.searchPlaces] HTTP', res.status, res.statusText);
//         return null;
//       }

//       const data    = await res.json();
//       const results = data?.results ?? [];
//       console.log('[GeoapifyProvider.searchPlaces] raw result count:', results.length);

//       if (!results.length) return [];

//       const mapped = results.map((r, i) => {
//         // address_line1 = primary label ("Main St 12" or amenity name)
//         // address_line2 = secondary label ("City, State, Country")
//         const mainText = r.address_line1 || r.name || (r.formatted || '').split(',')[0] || '';
//         const subText  = r.address_line2  || r.formatted || '';

//         return {
//           place_id:       'geoapify_' + i + '_' + Date.now(),
//           main_text:      mainText,
//           secondary_text: subText,
//           address:        r.formatted || (mainText + ', ' + subText),
//           name:           r.name      || mainText,
//           // Geoapify always embeds coordinates — no extra round-trip needed
//           lat: r.lat  ?? null,
//           lng: r.lon  ?? null,
//           // Stash raw text so geocoder fallback in getPlaceDetails can work
//           _rawText: r.formatted || (mainText + ', ' + subText),
//           // Extra structured fields exposed through getPlaceDetails
//           _geoapify: {
//             city:         r.city         || null,
//             state:        r.state        || null,
//             country:      r.country      || null,
//             country_code: r.country_code || null,
//             postcode:     r.postcode     || null,
//             street:       r.street       || null,
//             housenumber:  r.housenumber  || null,
//             result_type:  r.result_type  || null,
//           },
//         };
//       });

//       console.log(
//         '[GeoapifyProvider.searchPlaces] ✅ returning',
//         mapped.length,
//         'results:',
//         mapped.map((r) => r.main_text).join(' | '),
//       );
//       return mapped;

//     } catch (err) {
//       console.error('[GeoapifyProvider.searchPlaces] ❌ exception:', err && err.message, err);
//       return null;
//     }
//   }

//   // ── Place details ─────────────────────────────────────────────────────────
//   // Called after the user selects a suggestion.
//   // Fast path: autocomplete results already have lat/lon — return instantly.
//   // Slow path: forward-geocode the _rawText string (edge case only).
//   async getPlaceDetails(placeId, extraData) {
//     const hasCoords = extraData && extraData.lat != null && extraData.lng != null;
//     console.log(
//       '[GeoapifyProvider.getPlaceDetails] placeId:' + placeId,
//       '| hasCoords:' + hasCoords,
//     );

//     if (hasCoords) {
//       const g = extraData._geoapify || {};
//       return {
//         lat:          extraData.lat,
//         lng:          extraData.lng,
//         address:      extraData.address   || extraData.main_text || '',
//         name:         extraData.name      || extraData.main_text || '',
//         place_id:     placeId,
//         city:         g.city         || null,
//         state:        g.state        || null,
//         country:      g.country      || null,
//         country_code: g.country_code || null,
//         postcode:     g.postcode     || null,
//         street:       g.street       || null,
//         housenumber:  g.housenumber  || null,
//       };
//     }

//     // Slow path — should be rare
//     const text = (extraData && (extraData._rawText || extraData.name || extraData.address)) || null;
//     console.log('[GeoapifyProvider.getPlaceDetails] slow path — geocoding:', text);
//     if (!text) return null;

//     const result = await this.geocodeAddress(text);
//     if (!result) return null;
//     return Object.assign({}, result, { name: text.split(',')[0].trim(), place_id: placeId });
//   }

//   // ── Forward geocode ───────────────────────────────────────────────────────
//   async geocodeAddress(address) {
//     if (!this.apiKey) return null;
//     console.log('[GeoapifyProvider.geocodeAddress] ▶', address);

//     try {
//       const params = new URLSearchParams({
//         text:   address,
//         format: 'json',
//         limit:  '1',
//         lang:   'en',
//         apiKey: this.apiKey,
//       });

//       const res = await fetch(this.forwardBase + '?' + params);
//       if (!res.ok) {
//         console.warn('[GeoapifyProvider.geocodeAddress] HTTP', res.status);
//         return null;
//       }

//       const data    = await res.json();
//       const results = data?.results ?? [];
//       if (!results.length) {
//         console.warn('[GeoapifyProvider.geocodeAddress] no results for:', address);
//         return null;
//       }

//       const r = results[0];
//       return {
//         lat:          r.lat,
//         lng:          r.lon,
//         address:      r.formatted || address,
//         name:         r.name || r.address_line1 || address.split(',')[0],
//         place_id:     'geoapify_fwd_' + r.lat + '_' + r.lon,
//         city:         r.city         || null,
//         state:        r.state        || null,
//         country:      r.country      || null,
//         country_code: r.country_code || null,
//         postcode:     r.postcode     || null,
//       };
//     } catch (err) {
//       console.error('[GeoapifyProvider.geocodeAddress] error:', err && err.message);
//       return null;
//     }
//   }

//   // ── Reverse geocode ───────────────────────────────────────────────────────
//   async reverseGeocode(lat, lng) {
//     if (!this.apiKey) return null;
//     console.log('[GeoapifyProvider.reverseGeocode] ▶ lat:' + lat + ' lng:' + lng);

//     try {
//       const params = new URLSearchParams({
//         lat:    lat,
//         lon:    lng,
//         format: 'json',
//         lang:   'en',
//         apiKey: this.apiKey,
//       });

//       const res = await fetch(this.reverseBase + '?' + params);
//       if (!res.ok) {
//         console.warn('[GeoapifyProvider.reverseGeocode] HTTP', res.status);
//         return null;
//       }

//       const data    = await res.json();
//       const results = data?.results ?? [];
//       if (!results.length) {
//         console.warn('[GeoapifyProvider.reverseGeocode] no results');
//         return null;
//       }

//       const r = results[0];
//       return {
//         lat,
//         lng,
//         address:       r.formatted        || '',
//         name:          r.name || r.city   || r.address_line1 || '',
//         place_id:      'geoapify_rev_' + lat + '_' + lng,
//         city:          r.city          || null,
//         country:       r.country       || null,
//         country_code:  r.country_code  || null,
//         postalCode:    r.postcode      || null,
//         state:         r.state         || null,
//         streetAddress: r.street        || null,
//         streetNumber:  r.housenumber   || null,
//       };
//     } catch (err) {
//       console.error('[GeoapifyProvider.reverseGeocode] error:', err && err.message);
//       return null;
//     }
//   }

//   // ── Haversine distance (no API call) ──────────────────────────────────────
//   calculateDistance(lat1, lon1, lat2, lon2) {
//     const R    = 6371;
//     const dLat = (lat2 - lat1) * Math.PI / 180;
//     const dLon = (lon2 - lon1) * Math.PI / 180;
//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(lat1 * Math.PI / 180) *
//       Math.cos(lat2 * Math.PI / 180) *
//       Math.sin(dLon / 2) ** 2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   }
// }

// export default GeoapifyProvider;
// PATH: Okra/Okrarides/rider/components/Map/APIProviders/GeoapifyProvider.jsx
//
// Geoapify – Address Autocomplete + Forward / Reverse Geocoding
// Docs: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
//
// Env var required: NEXT_PUBLIC_GEOAPIFY_API_KEY
//
// APIs used (all REST, no SDK):
//   Autocomplete : GET https://api.geoapify.com/v1/geocode/autocomplete
//   Forward geo  : GET https://api.geoapify.com/v1/geocode/search
//   Reverse geo  : GET https://api.geoapify.com/v1/geocode/reverse
//
// Response format notes:
//   The Geoapify API returns GeoJSON by default (type:FeatureCollection,
//   features:[{geometry:{coordinates:[lon,lat]}, properties:{...}}]).
//   Passing format=json returns a flat {results:[{lat,lon,...}]} instead.
//   _normalizeResults() handles BOTH so callers don't have to care.
//
// Key design notes:
//   • Every result includes lat/lon, so getPlaceDetails is always a fast-path
//     (zero extra API calls after the user picks a suggestion).
//   • countryCode (ISO-3166-1 alpha-2, e.g. "zm") becomes filter=countrycode:zm
//   • Geoapify has NO map tile component — MapIframe automatically falls back
//     to the OSM iframe when prioritizedMap === 'geoapify'.

export class GeoapifyProvider {
  constructor(apiKey) {
    this.apiKey           = apiKey;
    this.name             = 'geoapify';
    this.autocompleteBase = 'https://api.geoapify.com/v1/geocode/autocomplete';
    this.forwardBase      = 'https://api.geoapify.com/v1/geocode/search';
    this.reverseBase      = 'https://api.geoapify.com/v1/geocode/reverse';

    console.log(
      '[GeoapifyProvider] constructor — apiKey present:', !!apiKey,
      '| prefix:', apiKey ? apiKey.slice(0, 8) + '...' : 'NONE',
    );
  }

  // ── Response normalizer ───────────────────────────────────────────────────
  // Geoapify returns GeoJSON (FeatureCollection) by default, or a flat
  // {results:[]} when format=json is passed. This function accepts either and
  // always returns a plain array of property objects with lat/lon at root level.
  //
  // GeoJSON shape:
  //   { type:'FeatureCollection', features:[{ geometry:{coordinates:[lon,lat]},
  //                                           properties:{ address_line1, ... lat, lon } }] }
  // JSON shape (format=json):
  //   { results:[{ lat, lon, address_line1, ... }], query:{} }
  _normalizeResults(data) {
    // GeoJSON — features array (default API response)
    if (data && Array.isArray(data.features)) {
      return data.features.map((f) => {
        const props = f.properties || {};
        // Prefer explicit lat/lon in properties; fall back to geometry coords
        const lat = props.lat ?? (f.geometry?.coordinates?.[1] ?? null);
        const lon = props.lon ?? (f.geometry?.coordinates?.[0] ?? null);
        return { ...props, lat, lon };
      });
    }
    // Flat JSON (format=json)
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  }

  // ── Internal: map a raw Geoapify property object to the shared shape ──────
  _toResult(r, index) {
    const mainText = r.address_line1 || r.name || (r.formatted || '').split(',')[0] || '';
    const subText  = r.address_line2 || r.formatted || '';

    return {
      place_id:       'geoapify_' + index + '_' + Date.now(),
      main_text:      mainText,
      secondary_text: subText,
      address:        r.formatted || (mainText + (subText ? ', ' + subText : '')),
      name:           r.name || mainText,
      // Geoapify always embeds coordinates — no geocoder round-trip needed
      lat: r.lat  ?? null,
      lng: r.lon  ?? null,        // note: API uses 'lon', we store as 'lng'
      // Raw text for geocoder fallback (edge-case if coords ever missing)
      _rawText: r.formatted || (mainText + (subText ? ', ' + subText : '')),
      // Structured address fields surfaced by getPlaceDetails
      _geoapify: {
        city:         r.city         || null,
        state:        r.state        || null,
        country:      r.country      || null,
        country_code: r.country_code || null,
        postcode:     r.postcode     || null,
        street:       r.street       || null,
        housenumber:  r.housenumber  || null,
        result_type:  r.result_type  || null,
      },
    };
  }

  // ── Autocomplete / search ─────────────────────────────────────────────────
  // Called by MapsProvider.searchPlaces on every keystroke.
  // Uses the Autocomplete API which handles partial queries, POI names,
  // streets, cities — equivalent to Google Places Autocomplete.
  async searchPlaces(query, countryCode = null) {
    if (!this.apiKey) {
      console.warn('[GeoapifyProvider.searchPlaces] no API key — skipping');
      return null;
    }
    if (!query || query.length < 2) {
      console.log('[GeoapifyProvider.searchPlaces] query too short — skipping');
      return [];
    }

    console.log(
      '[GeoapifyProvider.searchPlaces] ▶ query:', JSON.stringify(query),
      '| countryCode:', countryCode,
    );

    try {
      const params = new URLSearchParams({
        text:   query,
        limit:  '7',
        lang:   'en',
        apiKey: this.apiKey,
        // No format=json — use default GeoJSON which is the canonical response
        // shape shown in Geoapify's own docs and playground examples.
      });

      // Restrict results to one country when provided.
      // Geoapify expects lowercase alpha-2: "zm", "us", "gb", etc.
      if (countryCode) {
        params.set('filter', 'countrycode:' + countryCode.toLowerCase());
      }

      const url = this.autocompleteBase + '?' + params;
      console.log('[GeoapifyProvider.searchPlaces] → ' + url.replace(this.apiKey, '<REDACTED>'));

      const res = await fetch(url);
      if (!res.ok) {
        console.warn('[GeoapifyProvider.searchPlaces] HTTP', res.status, res.statusText);
        return null;
      }

      const data    = await res.json();
      const items   = this._normalizeResults(data);
      console.log('[GeoapifyProvider.searchPlaces] normalized item count:', items.length);

      if (!items.length) return [];

      const mapped = items.map((r, i) => this._toResult(r, i));

      console.log(
        '[GeoapifyProvider.searchPlaces] ✅ returning', mapped.length, 'results:',
        mapped.map((r) => r.main_text).join(' | '),
      );
      return mapped;

    } catch (err) {
      console.error('[GeoapifyProvider.searchPlaces] ❌ exception:', err && err.message, err);
      return null;
    }
  }

  // ── Place details ─────────────────────────────────────────────────────────
  // Called after the user selects a suggestion from the dropdown.
  // Fast path (normal): autocomplete result already has lat/lon → return instantly.
  // Slow path (edge case): forward-geocode the _rawText string.
  async getPlaceDetails(placeId, extraData) {
    const hasCoords = extraData && extraData.lat != null && extraData.lng != null;
    console.log(
      '[GeoapifyProvider.getPlaceDetails] placeId:', placeId, '| hasCoords:', hasCoords,
    );

    // Fast path — zero extra API calls
    if (hasCoords) {
      const g = extraData._geoapify || {};
      return {
        lat:          extraData.lat,
        lng:          extraData.lng,
        address:      extraData.address  || extraData.main_text || '',
        name:         extraData.name     || extraData.main_text || '',
        place_id:     placeId,
        city:         g.city         || null,
        state:        g.state        || null,
        country:      g.country      || null,
        country_code: g.country_code || null,
        postcode:     g.postcode     || null,
        street:       g.street       || null,
        housenumber:  g.housenumber  || null,
      };
    }

    // Slow path — should be rare
    const text = (extraData && (extraData._rawText || extraData.name || extraData.address)) || null;
    console.log('[GeoapifyProvider.getPlaceDetails] slow path — geocoding:', text);
    if (!text) return null;

    const result = await this.geocodeAddress(text);
    if (!result) return null;
    return Object.assign({}, result, { name: text.split(',')[0].trim(), place_id: placeId });
  }

  // ── Forward geocode ───────────────────────────────────────────────────────
  // Used as a fallback when autocomplete result lacks coordinates (edge case).
  async geocodeAddress(address) {
    if (!this.apiKey) return null;
    console.log('[GeoapifyProvider.geocodeAddress] ▶', address);

    try {
      const params = new URLSearchParams({
        text:   address,
        format: 'json',    // flat response is simpler for single-result parsing
        limit:  '1',
        lang:   'en',
        apiKey: this.apiKey,
      });

      const res = await fetch(this.forwardBase + '?' + params);
      if (!res.ok) {
        console.warn('[GeoapifyProvider.geocodeAddress] HTTP', res.status);
        return null;
      }

      const data  = await res.json();
      const items = this._normalizeResults(data);
      if (!items.length) {
        console.warn('[GeoapifyProvider.geocodeAddress] no results for:', address);
        return null;
      }

      const r = items[0];
      return {
        lat:          r.lat,
        lng:          r.lon,
        address:      r.formatted || address,
        name:         r.name || r.address_line1 || address.split(',')[0],
        place_id:     'geoapify_fwd_' + r.lat + '_' + r.lon,
        city:         r.city         || null,
        state:        r.state        || null,
        country:      r.country      || null,
        country_code: r.country_code || null,
        postcode:     r.postcode     || null,
      };
    } catch (err) {
      console.error('[GeoapifyProvider.geocodeAddress] error:', err && err.message);
      return null;
    }
  }

  // ── Reverse geocode ───────────────────────────────────────────────────────
  async reverseGeocode(lat, lng) {
    if (!this.apiKey) return null;
    console.log('[GeoapifyProvider.reverseGeocode] ▶ lat:', lat, 'lng:', lng);

    try {
      const params = new URLSearchParams({
        lat:    lat,
        lon:    lng,
        format: 'json',
        lang:   'en',
        apiKey: this.apiKey,
      });

      const res = await fetch(this.reverseBase + '?' + params);
      if (!res.ok) {
        console.warn('[GeoapifyProvider.reverseGeocode] HTTP', res.status);
        return null;
      }

      const data  = await res.json();
      const items = this._normalizeResults(data);
      if (!items.length) {
        console.warn('[GeoapifyProvider.reverseGeocode] no results');
        return null;
      }

      const r = items[0];
      return {
        lat,
        lng,
        address:       r.formatted        || '',
        name:          r.name || r.city   || r.address_line1 || '',
        place_id:      'geoapify_rev_' + lat + '_' + lng,
        city:          r.city          || null,
        country:       r.country       || null,
        country_code:  r.country_code  || null,
        postalCode:    r.postcode      || null,
        state:         r.state         || null,
        streetAddress: r.street        || null,
        streetNumber:  r.housenumber   || null,
      };
    } catch (err) {
      console.error('[GeoapifyProvider.reverseGeocode] error:', err && err.message);
      return null;
    }
  }

  // ── Haversine distance (no API call) ──────────────────────────────────────
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R    = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export default GeoapifyProvider;