// PATH: Okra/Okrarides/rider/components/Map/MapDisplays/LocalMapDisplay.jsx
//
// Uses the self-hosted okrageoserver for tiles and routing.
// Falls back to OSMMapDisplay if the local server is unreachable.

'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import OSMMapDisplay from './OSMMapDisplay';

export default function LocalMapDisplay(props) {
  const { localMapUrl } = props;
  const [serverOk, setServerOk] = useState(null); // null = checking

  const serverUrl = localMapUrl || process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

  // Health-check the local server once on mount
  useEffect(() => {
    if (!serverUrl) { setServerOk(false); return; }
    fetch(`${serverUrl}/api/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => setServerOk(r.ok))
      .catch(() => setServerOk(false));
  }, [serverUrl]);

  // Still checking → render nothing yet (avoid flash)
  if (serverOk === null) return null;

  // Server down → fallback to OSM
  if (!serverOk) {
    console.warn('[LocalMapDisplay] local server unreachable — falling back to OSM');
    return <OSMMapDisplay {...props} />;
  }

  // Server is up — use local raster tiles via MapLibre
  return <LocalMapLibreDisplay {...props} serverUrl={serverUrl} />;
}

// ── Inner component: MapLibre with local tiles ────────────────────────────────

const MARKER_COLORS = {
  pickup: '#22c55e', dropoff: '#ef4444', driver: '#3b82f6',
  station: '#6366f1', current: '#3b82f6', default: '#8b5cf6',
};

function LocalMapLibreDisplay({
  serverUrl,
  center        = { lat: -15.4167, lng: 28.2833 },
  zoom          = 13,
  markers       = [],
  pickupLocation,
  dropoffLocation,
  route,
  showRoute     = false,
  onMapClick,
  onMapLoad,
  height        = '100%',
  width         = '100%',
  bearing       = 0,
  pitch         = 0,
}) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});
  const controlsRef  = useRef(null);

  const localStyle = {
    version: 8,
    sources: {
      'local-tiles': {
        type: 'raster',
        tiles: [`${serverUrl}/tiles/{z}/{x}/{y}.png`],
        tileSize: 256,
        attribution: '© Local Map Server | © OpenStreetMap',
      },
    },
    layers: [{ id: 'local-layer', type: 'raster', source: 'local-tiles' }],
  };

  useEffect(() => {
    let cancelled = false;

    function init() {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style:     localStyle,
        center:    [center.lng, center.lat],
        zoom,
        bearing,
        pitch,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;
        // Route layers
        map.addSource('route', { type: 'geojson', data: emptyGeoJSON() });
        map.addLayer({ id: 'route-casing', type: 'line', source: 'route',
          paint: { 'line-color': '#fff', 'line-width': 8 } });
        map.addLayer({ id: 'route-line',   type: 'line', source: 'route',
          paint: { 'line-color': '#3b82f6', 'line-width': 5 },
          layout: { 'line-join': 'round', 'line-cap': 'round' } });

        controlsRef.current = buildControls(map);
        onMapLoad?.(controlsRef.current);
      });

      map.on('click', (e) => {
        onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });
    }

    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function emptyGeoJSON() {
    return { type: 'FeatureCollection', features: [] };
  }

  function buildControls(map) {
    return {
      animateToLocation(lat, lng, z) {
        map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 1000 });
      },
      setZoom(z)   { map.setZoom(z); },
      zoomIn()     { map.zoomIn(); },
      zoomOut()    { map.zoomOut(); },
      enable3DMode(brg = 0) { map.easeTo({ pitch: 60, bearing: brg, duration: 600 }); },
      disable3DMode()       { map.easeTo({ pitch: 0,  bearing: 0,   duration: 600 }); },
      updateDriverLocation(lat, lng, heading) {
        const marker = markersRef.current['driver'];
        if (marker) {
          marker.setLngLat([lng, lat]);
          if (heading != null)
            marker.getElement().style.transform += ` rotate(${heading}deg)`;
        }
      },
      clearRoute() { map.getSource('route')?.setData(emptyGeoJSON()); },
      getCurrentLocation(cb) {
        navigator.geolocation?.getCurrentPosition(
          (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => cb(null)
        );
      },
    };
  }

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const all = [
      ...markers,
      ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
      ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
    ];

    const ids = new Set(all.map((m) => m.id || m.type));
    Object.keys(markersRef.current).forEach((id) => {
      if (!ids.has(id)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
    });

    all.forEach((m) => {
      const id    = m.id || m.type;
      const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;
      if (markersRef.current[id]) {
        markersRef.current[id].setLngLat([m.lng, m.lat]);
      } else {
        const el         = document.createElement('div');
        el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)`;
        markersRef.current[id] = new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(map);
      }
    });
  }, [markers, pickupLocation, dropoffLocation]);

  // Route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!showRoute || !route?.length) {
      map.getSource('route')?.setData(emptyGeoJSON());
      return;
    }
    map.getSource('route')?.setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: route } }],
    });
  }, [route, showRoute]);

  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], duration: 500 });
  }, [center.lat, center.lng]);

  useEffect(() => {
    mapRef.current?.easeTo({ bearing, pitch, duration: 500 });
  }, [bearing, pitch]);

  return <div ref={containerRef} style={{ width, height, position: 'relative' }} />;
}