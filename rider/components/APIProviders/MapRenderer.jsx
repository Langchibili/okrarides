// // PATH: Okra/Okrarides/rider/components/Map/MapRenderer.jsx
// //
// // Orchestrator component.
// // Reads `prioritizedMap` from MapsProvider context and renders the
// // appropriate display component. If that component throws or fails to load,
// // falls back to OSMMapDisplay (OpenStreetMap).
// //
// // prioritizedMap values (set in Strapi ApiProvidersPriorityMap.prioritizedMap):
// //   wazemap | openstreetmap | localmap | yandexmap | googlemap | applemap

// 'use client';

// import React, { Component, useContext } from 'react';
// import { useMapProvider } from './APIProviders/MapsProvider';

// // Map display components — loaded via dynamic import to avoid SSR issues
// import dynamic from 'next/dynamic';

// const OSMMapDisplay = dynamic(() => import('./MapDisplays/OSMMapDisplay'),    { ssr: false });
// const LocalMapDisplay = dynamic(() => import('./MapDisplays/LocalMapDisplay'),  { ssr: false });
// const YandexMapDisplay = dynamic(() => import('./MapDisplays/YandexMapDisplay'), { ssr: false });
// const GoogleMapDisplay = dynamic(() => import('./MapDisplays/GoogleMapDisplay'), { ssr: false });
// const WazeMapDisplay = dynamic(() => import('./MapDisplays/WazeMapDisplay'),   { ssr: false });
// const AppleMapDisplay = dynamic(() => import('./MapDisplays/AppleMapDisplay'),  { ssr: false });

// // Map from Strapi enum value → React display component
// const MAP_COMPONENTS = {
//   openstreetmap: OSMMapDisplay,
//   localmap:      LocalMapDisplay,
//   yandexmap:     YandexMapDisplay,
//   googlemap:     GoogleMapDisplay,
//   wazemap:       WazeMapDisplay,
//   applemap:      AppleMapDisplay,
// };

// // ── Error boundary: catches render/load errors and falls back to OSM ─────────

// class MapErrorBoundary extends Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false, errorMessage: '' };
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true, errorMessage: error?.message || 'Unknown error' };
//   }

//   componentDidCatch(error, info) {
//     console.error('[MapRenderer] Map component crashed:', error, info);
//     this.props.onError?.(error);
//   }

//   render() {
//     if (this.state.hasError) {
//       console.warn(
//         `[MapRenderer] Falling back to OSM — ${this.props.providerName} crashed: ${this.state.errorMessage}`
//       );
//       return <OSMMapDisplay {...this.props.mapProps} />;
//     }
//     return this.props.children;
//   }
// }

// // ── MapRenderer ───────────────────────────────────────────────────────────────

// export default function MapRenderer(props) {
//   const { prioritizedMap, localMapUrl, ready } = useMapProvider();

//   // While provider config is loading, render OSM as placeholder
//   if (!ready) {
//     return <OSMMapDisplay {...props} />;
//   }

//   const mapKey = prioritizedMap || 'openstreetmap';
//   const DisplayComponent = MAP_COMPONENTS[mapKey] ?? OSMMapDisplay;

//   // Pass localMapUrl through for LocalMapDisplay
//   const enrichedProps = {
//     ...props,
//     localMapUrl,
//   };

//   console.log(`[MapRenderer] rendering: ${mapKey}`);

//   return (
//     <MapErrorBoundary
//       providerName={mapKey}
//       mapProps={enrichedProps}
//       onError={(err) => console.error('[MapRenderer] error:', err)}
//     >
//       <DisplayComponent {...enrichedProps} />
//     </MapErrorBoundary>
//   );
// }

// // ── Convenience re-export so existing imports of GoogleMapIframe still work ───
// export { MapRenderer };
// PATH: Okra/Okrarides/rider/components/Map/MapRenderer.jsx
//
// Orchestrator component.
// Reads `prioritizedMap` from MapsProvider context and renders the
// appropriate display component. If that component throws or fails to load,
// falls back to OSMMapDisplay (OpenStreetMap).
//
// prioritizedMap values (Strapi ApiProvidersPriorityMap.prioritizedMap enum):
//   google | apple | yandex | waze | geoapify | openstreet | local

'use client';

import React, { Component } from 'react';
import { useMapProvider } from './APIProviders/MapsProvider';
import dynamic from 'next/dynamic';

// ── Map display components ────────────────────────────────────────────────────
// All loaded dynamically to avoid SSR issues with map SDKs.

const OSMMapDisplay    = dynamic(() => import('./MapDisplays/OSMMapDisplay'),    { ssr: false });
const LocalMapDisplay  = dynamic(() => import('./MapDisplays/LocalMapDisplay'),  { ssr: false });
const YandexMapDisplay = dynamic(() => import('./MapDisplays/YandexMapDisplay'), { ssr: false });
const GoogleMapDisplay = dynamic(() => import('./MapDisplays/GoogleMapDisplay'), { ssr: false });
const WazeMapDisplay   = dynamic(() => import('./MapDisplays/WazeMapDisplay'),   { ssr: false });
const AppleMapDisplay  = dynamic(() => import('./MapDisplays/AppleMapDisplay'),  { ssr: false });

// ── Strapi enum value → display component ────────────────────────────────────
// Keys must exactly match the `prioritizedMap` enum in the Strapi schema.
// Previous naming (googlemaps, applemap, …) has been removed.

const MAP_COMPONENTS = {
  openstreet: OSMMapDisplay,
  local:      LocalMapDisplay,
  yandex:     YandexMapDisplay,
  google:     GoogleMapDisplay,
  waze:       WazeMapDisplay,
  apple:      AppleMapDisplay,
};

// ── Error boundary ────────────────────────────────────────────────────────────
// Catches render / SDK-load errors from a map display component and falls
// back to OSMMapDisplay so the user always sees something.

class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    console.error('[MapRenderer] Map component crashed:', error, info);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      console.warn(
        `[MapRenderer] Falling back to OSM — ${this.props.providerName} crashed:`,
        this.state.errorMessage,
      );
      // OSM / Nominatim never crashes in the same way, so this is always safe.
      return <OSMMapDisplay {...this.props.mapProps} />;
    }
    return this.props.children;
  }
}

// ── MapRenderer ───────────────────────────────────────────────────────────────

export default function MapRenderer(props) {
  const { prioritizedMap, localMapUrl, ready } = useMapProvider();

  // While provider config is still loading, render OSM as a placeholder so
  // the user never stares at a blank panel.
  if (!ready) {
    return <OSMMapDisplay {...props} />;
  }

  const mapKey = prioritizedMap || 'openstreet';

  // Unknown / future enum values fall through to OSM gracefully.
  const DisplayComponent = MAP_COMPONENTS[mapKey] ?? OSMMapDisplay;

  // localMapUrl is forwarded so LocalMapDisplay can reach the tile/OSRM server.
  const enrichedProps = { ...props, localMapUrl };

  console.log(`[MapRenderer] rendering: ${mapKey}`);

  return (
    <MapErrorBoundary
      providerName={mapKey}
      mapProps={enrichedProps}
      onError={(err) => console.error('[MapRenderer] unrecoverable error:', err)}
    >
      <DisplayComponent {...enrichedProps} />
    </MapErrorBoundary>
  );
}

// Convenience re-export so any legacy import of MapRenderer as a named export
// still resolves without a breaking change.
export { MapRenderer };