// PATH: Okra/Okrarides/rider/components/Map/MapDisplays/YandexMapDisplay.jsx
//
// Full Yandex Maps JS API v3 (ymaps3) display component.
// Env: NEXT_PUBLIC_YANDEX_MAPS_API_KEY
//
// Docs: https://yandex.com/dev/maps/jsapi/doc/3.0/

'use client';

import { useEffect, useRef } from 'react';

const MARKER_COLORS = {
  pickup:  '#22c55e',
  dropoff: '#ef4444',
  driver:  '#3b82f6',
  station: '#6366f1',
  current: '#3b82f6',
  default: '#8b5cf6',
};

function svgPin(color, size = 36) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="10" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>
      <line x1="12" y1="16" x2="12" y2="22" stroke="${color}" stroke-width="2"/>
    </svg>`;
}

export default function YandexMapDisplay({
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
  const ymaps3Ref    = useRef(null);
  const markersRef   = useRef({});
  const routeRef     = useRef(null);
  const controlsRef  = useRef(null);

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';

  useEffect(() => {
    if (!apiKey) { console.warn('[YandexMapDisplay] No API key'); return; }
    let cancelled = false;

    async function init() {
      // Load Yandex Maps JS API v3 script
      await loadScript(
        `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=en_US`,
        'ymaps3-script'
      );

      if (cancelled || !window.ymaps3) return;

      await window.ymaps3.ready;
      if (cancelled) return;

      const ymaps3 = window.ymaps3;
      ymaps3Ref.current = ymaps3;

      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer,
              YMapListener, YMapMarker, YMapFeature } = ymaps3;

      const map = new YMap(containerRef.current, {
        location: {
          center: [center.lng, center.lat],
          zoom,
        },
        mode: 'vector',
      });

      map.addChild(new YMapDefaultSchemeLayer());
      map.addChild(new YMapDefaultFeaturesLayer());

      mapRef.current = map;

      // Click listener
      const listener = new YMapListener({
        layer: 'any',
        onClick: (obj, event) => {
          const [lng, lat] = event.coordinates;
          onMapClick?.({ lat, lng });
        },
      });
      map.addChild(listener);

      controlsRef.current = buildControls(map, ymaps3);
      onMapLoad?.(controlsRef.current);
    }

    init();
    return () => {
      cancelled = true;
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Markers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map    = mapRef.current;
    const ymaps3 = ymaps3Ref.current;
    if (!map || !ymaps3) return;

    const { YMapMarker } = ymaps3;

    const all = [
      ...markers,
      ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
      ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
    ];

    const ids = new Set(all.map((m) => m.id || m.type));

    // Remove stale
    Object.keys(markersRef.current).forEach((id) => {
      if (!ids.has(id)) {
        try { map.removeChild(markersRef.current[id]); } catch {}
        delete markersRef.current[id];
      }
    });

    // Add / update
    all.forEach((m) => {
      const id    = m.id || m.type;
      const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;

      if (markersRef.current[id]) {
        markersRef.current[id].update({ coordinates: [m.lng, m.lat] });
        return;
      }

      const el       = document.createElement('div');
      el.innerHTML   = svgPin(color);
      el.style.cursor = 'pointer';

      const marker = new YMapMarker(
        { coordinates: [m.lng, m.lat], draggable: false },
        el
      );
      map.addChild(marker);
      markersRef.current[id] = marker;
    });
  }, [markers, pickupLocation, dropoffLocation]);

  // ── Route ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map    = mapRef.current;
    const ymaps3 = ymaps3Ref.current;
    if (!map || !ymaps3) return;

    if (routeRef.current) {
      try { map.removeChild(routeRef.current); } catch {}
      routeRef.current = null;
    }

    if (!showRoute || !route?.length) return;

    const { YMapFeature } = ymaps3;
    const feature = new YMapFeature({
      geometry: { type: 'LineString', coordinates: route },
      style: {
        stroke: [{ color: '#3b82f6', width: 5 }, { color: '#fff', width: 8 }],
        strokeWidth: 5,
      },
    });
    map.addChild(feature);
    routeRef.current = feature;
  }, [route, showRoute]);

  // ── Center / view updates ─────────────────────────────────────────────────
  useEffect(() => {
    mapRef.current?.setLocation({ center: [center.lng, center.lat], duration: 500 });
  }, [center.lat, center.lng]);

  useEffect(() => {
    mapRef.current?.setLocation({
      azimuth: bearing,
      tilt:    pitch / 90, // Yandex tilt is 0–1
      duration: 500,
    });
  }, [bearing, pitch]);

  function buildControls(map, ymaps3) {
    return {
      animateToLocation(lat, lng, z) {
        map.setLocation({ center: [lng, lat], zoom: z, duration: 800 });
      },
      setZoom(z)   { map.setLocation({ zoom: z }); },
      zoomIn()     { map.setLocation({ zoom: map.zoom + 1, duration: 300 }); },
      zoomOut()    { map.setLocation({ zoom: map.zoom - 1, duration: 300 }); },
      enable3DMode(brg = 0) {
        map.setLocation({ tilt: 0.7, azimuth: brg, duration: 600 });
      },
      disable3DMode() {
        map.setLocation({ tilt: 0, azimuth: 0, duration: 600 });
      },
      updateDriverLocation(lat, lng, heading) {
        const marker = markersRef.current['driver'];
        if (marker) {
          marker.update({ coordinates: [lng, lat] });
          if (heading != null)
            marker.element?.style && (marker.element.style.transform = `rotate(${heading}deg)`);
        }
      },
      clearRoute() {
        if (routeRef.current) {
          try { map.removeChild(routeRef.current); } catch {}
          routeRef.current = null;
        }
      },
      getCurrentLocation(cb) {
        navigator.geolocation?.getCurrentPosition(
          (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => cb(null)
        );
      },
    };
  }

  return (
    <div ref={containerRef} style={{ width, height, position: 'relative' }} />
  );
}

// Helper — loads a script once by id
function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s  = document.createElement('script');
    s.id     = id;
    s.src    = src;
    s.async  = true;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
