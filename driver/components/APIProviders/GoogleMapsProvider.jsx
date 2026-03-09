// PATH: Okra/Okrarides/rider/components/Map/APIProviders/GoogleMapsProvider.jsx
//
// Wraps Google Maps Geocoder HTTP API and Places API.
// Called by MapsProvider when Google is the active provider.
// Does NOT load the Google Maps JavaScript API here — that is only loaded
// inside the MapIframe when a Google JS API key is present.

export class GoogleMapsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.name = 'googlemaps';
  }

  // ── Place autocomplete (Places API) ────────────────────────────────────────
  async searchPlaces(query, countryCode = null) {
    if (!this.apiKey) return null;
    try {
      const params = new URLSearchParams({
        input: query,
        key: this.apiKey,
        language: 'en',
      });
      if (countryCode) params.set('components', `country:${countryCode}`);

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
      );
      if (!res.ok) return null;
      const data = await res.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return null;

      return (data.predictions || []).map((p) => ({
        place_id: p.place_id,
        main_text: p.structured_formatting?.main_text || p.description,
        secondary_text: p.structured_formatting?.secondary_text || '',
        address: p.description,
        name: p.structured_formatting?.main_text || p.description,
      }));
    } catch (err) {
      console.error('[GoogleMapsProvider] searchPlaces error:', err);
      return null;
    }
  }

  // ── Place details ──────────────────────────────────────────────────────────
  async getPlaceDetails(placeId) {
    if (!this.apiKey) return null;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${this.apiKey}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 'OK') return null;

      const p = data.result;
      return {
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        address: p.formatted_address,
        name: p.name,
        place_id: placeId,
      };
    } catch (err) {
      console.error('[GoogleMapsProvider] getPlaceDetails error:', err);
      return null;
    }
  }

  // ── Geocoder HTTP API ──────────────────────────────────────────────────────
  async reverseGeocode(lat, lng) {
    if (!this.apiKey) return null;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&language=en`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) return null;

      const result = data.results[0];
      const getComp = (types) =>
        result.address_components?.find((c) => types.some((t) => c.types.includes(t)))?.long_name || null;

      return {
        lat,
        lng,
        address: result.formatted_address,
        name: getComp(['locality', 'sublocality', 'neighborhood']) || getComp(['administrative_area_level_2']) || 'Unknown',
        place_id: result.place_id,
        city: getComp(['locality', 'administrative_area_level_2']),
        country: getComp(['country']),
        postalCode: getComp(['postal_code']),
        state: getComp(['administrative_area_level_1']),
        streetAddress: getComp(['route']),
        streetNumber: getComp(['street_number']),
      };
    } catch (err) {
      console.error('[GoogleMapsProvider] reverseGeocode error:', err);
      return null;
    }
  }

  async geocodeAddress(address) {
    if (!this.apiKey) return null;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}&language=en`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) return null;

      const r = data.results[0];
      return {
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        address: r.formatted_address,
        place_id: r.place_id,
      };
    } catch (err) {
      console.error('[GoogleMapsProvider] geocodeAddress error:', err);
      return null;
    }
  }
}

export default GoogleMapsProvider;
