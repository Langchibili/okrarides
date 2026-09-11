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
// PATH: Okra/Okrarides/driver/components/Map/MapRenderer.jsx
//
// Updated from original driver version:
//  - MAP_COMPONENTS keys updated to match new Strapi enum values
//    (no trailing "map": 'openstreet' not 'openstreetmap', 'local' not 'localmap', etc.)
//  - Default fallback updated to 'openstreet'
//  All other logic unchanged.

'use client';

import React, { Component } from 'react';
import { useMapProvider } from './APIProviders/MapsProvider';
import dynamic from 'next/dynamic';

const OSMMapDisplay    = dynamic(() => import('./MapDisplays/OSMMapDisplay'),    { ssr: false });
const LocalMapDisplay  = dynamic(() => import('./MapDisplays/LocalMapDisplay'),  { ssr: false });
const YandexMapDisplay = dynamic(() => import('./MapDisplays/YandexMapDisplay'), { ssr: false });
const GoogleMapDisplay = dynamic(() => import('./MapDisplays/GoogleMapDisplay'), { ssr: false });
const WazeMapDisplay   = dynamic(() => import('./MapDisplays/WazeMapDisplay'),   { ssr: false });
const AppleMapDisplay  = dynamic(() => import('./MapDisplays/AppleMapDisplay'),  { ssr: false });

// Keys match Strapi prioritizedMap enum values exactly
const MAP_COMPONENTS = {
  openstreet: OSMMapDisplay,    // was 'openstreetmap'
  local:      LocalMapDisplay,  // was 'localmap'
  yandex:     YandexMapDisplay, // was 'yandexmap'
  google:     GoogleMapDisplay, // was 'googlemap'
  waze:       WazeMapDisplay,   // was 'wazemap'
  apple:      AppleMapDisplay,  // was 'applemap'
};

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
      console.warn(`[MapRenderer] Falling back to OSM — ${this.props.providerName} crashed: ${this.state.errorMessage}`);
      return <OSMMapDisplay {...this.props.mapProps} />;
    }
    return this.props.children;
  }
}

export default function MapRenderer(props) {
  const { prioritizedMap, localMapUrl, ready } = useMapProvider();

  if (!ready) {
    return <OSMMapDisplay {...props} />;
  }

  const mapKey = prioritizedMap || 'openstreet';
  const DisplayComponent = MAP_COMPONENTS[mapKey] ?? OSMMapDisplay;

  const enrichedProps = { ...props, localMapUrl };

  console.log(`[MapRenderer] rendering: ${mapKey}`);

  return (
    <MapErrorBoundary
      providerName={mapKey}
      mapProps={enrichedProps}
      onError={(err) => console.error('[MapRenderer] error:', err)}
    >
      <DisplayComponent {...enrichedProps} />
    </MapErrorBoundary>
  );
}

export { MapRenderer };