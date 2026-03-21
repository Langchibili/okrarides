// // PATH: Okra/Okrarides/rider/components/Map/APIProviders/WazeMapsProvider.jsx
// //
// // Waze has NO public geocoding HTTP API.
// // This provider handles ROUTING only via Waze Deep Links / iframe navigation.
// // All geocoding falls through to Nominatim via MapsProvider's fallback chain.
// //
// // Routing deep link format:
// //   https://waze.com/ul?ll={lat},{lng}&navigate=yes&utm_source=okrarides

// export class WazeMapsProvider {
//   constructor() {
//     this.name = 'wazemap';
//     this.deepLinkBase = 'https://waze.com/ul';
//     this.iframeBase   = 'https://embed.waze.com/iframe';
//   }

//   // ── Routing via Waze Deep Link ────────────────────────────────────────────
//   // Returns { deepLink, isMobile } — caller decides whether to open or display.
//   // On mobile with Waze installed, waze:// scheme opens the native app.
//   getNavigationDeepLink(destination, origin = null) {
//     const params = new URLSearchParams({
//       ll:         `${destination.lat},${destination.lng}`,
//       navigate:   'yes',
//       utm_source: 'okrarides',
//     });

//     if (origin) {
//       // Waze doesn't accept a custom origin in deep links (it uses the device GPS),
//       // but we pass it for reference.
//       params.set('from', `${origin.lat},${origin.lng}`);
//     }

//     const isMobile =
//       typeof navigator !== 'undefined' &&
//       /android|iphone|ipad|ipod/i.test(navigator.userAgent);

//     // Prefer waze:// scheme on mobile (opens native app directly)
//     const webUrl = `${this.deepLinkBase}?${params}`;
//     const appUrl = `waze://?ll=${destination.lat},${destination.lng}&navigate=yes`;

//     return {
//       webUrl,
//       appUrl: isMobile ? appUrl : null,
//       isMobile,
//     };
//   }

//   // Open Waze navigation in a new tab (or native app on mobile)
//   openNavigation(destination, origin = null) {
//     const { webUrl, appUrl, isMobile } = this.getNavigationDeepLink(destination, origin);

//     if (isMobile && appUrl) {
//       // Try native app first; fall back to web after a short timeout
//       window.location.href = appUrl;
//       setTimeout(() => { window.open(webUrl, '_blank'); }, 1500);
//     } else {
//       window.open(webUrl, '_blank');
//     }
//   }

//   // ── Search deep link (opens Waze with a search query) ─────────────────────
//   openSearch(query) {
//     const url = `${this.deepLinkBase}?q=${encodeURIComponent(query)}`;
//     window.open(url, '_blank');
//   }

//   // ── Build Waze iframe URL (for the embedded live map display) ─────────────
//   buildIframeUrl({ lat, lng, zoom = 13, pin = false, lang = null }) {
//     const base = lang
//       ? `https://embed.waze.com/${lang}/iframe`
//       : this.iframeBase;

//     const params = new URLSearchParams({
//       lat:  lat,
//       lon:  lng,
//       zoom: Math.min(17, Math.max(3, zoom)),
//     });

//     if (pin) params.set('pin', '1');

//     return `${base}?${params}`;
//   }

//   // ── Distance (haversine — no Waze API available) ──────────────────────────
//   calculateDistance(lat1, lon1, lat2, lon2) {
//     const R    = 6371;
//     const dLat = (lat2 - lat1) * (Math.PI / 180);
//     const dLon = (lon2 - lon1) * (Math.PI / 180);
//     const a =
//       Math.sin(dLat / 2) ** 2 +
//       Math.cos(lat1 * (Math.PI / 180)) *
//       Math.cos(lat2 * (Math.PI / 180)) *
//       Math.sin(dLon / 2) ** 2;
//     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   }

//   // Geocoding falls back to Nominatim via MapsProvider — Waze has no public API
//   async reverseGeocode() { return null; }
//   async geocodeAddress()  { return null; }
//   async searchPlaces()    { return null; }
// }

// export default WazeMapsProvider;

// PATH: Okra/Okrarides/rider/components/Map/APIProviders/WazeMapsProvider.jsx
//
// Waze provider — navigation via deep-link only.
// No geocoding, no autocomplete, no routing API.
// openNavigation() is the only meaningful method.
//
// Default service config: { routing: 'deeplink' }
// All other services are null → MapsProvider will skip Waze for those.

export class WazeMapsProvider {
  constructor() {
    this.name = 'waze';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DISPATCH LAYER
  // ─────────────────────────────────────────────────────────────────────────

  _dispatchRoute(apiMethod, origin, destination) {
    switch (apiMethod) {
      case 'deeplink':
      default:
        this.openNavigation(destination, origin);
        // Return a sentinel so MapsProvider knows the action was handled
        return Promise.resolve({ type: 'deeplink', provider: 'waze' });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC SERVICE METHODS
  //
  // searchPlaces / getPlaceDetails / reverseGeocode are deliberately absent —
  // MapsProvider will see no method and fall back to the next provider.
  // ─────────────────────────────────────────────────────────────────────────

  async getRoute(origin, destination, apiMethod = 'deeplink') {
    return this._dispatchRoute(apiMethod, origin, destination);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────

  openNavigation(destination, origin = null) {
    // Waze deep-link
    const params = new URLSearchParams({
      ll:     `${destination.lat},${destination.lng}`,
      z:      '10',
      navigate: 'yes',
    });
    const wazeUrl = `https://waze.com/ul?${params}`;
    const appUrl  = `waze://?ll=${destination.lat},${destination.lng}&navigate=yes`;

    const isMobile = typeof navigator !== 'undefined' &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = appUrl;
      setTimeout(() => window.open(wazeUrl, '_blank'), 1500);
    } else {
      window.open(wazeUrl, '_blank');
    }
  }

  getNavigationDeepLink(destination, origin = null) {
    const params = new URLSearchParams({
      ll:       `${destination.lat},${destination.lng}`,
      z:        '10',
      navigate: 'yes',
    });
    return {
      webUrl: `https://waze.com/ul?${params}`,
      appUrl: `waze://?ll=${destination.lat},${destination.lng}&navigate=yes`,
    };
  }
}

export default WazeMapsProvider;