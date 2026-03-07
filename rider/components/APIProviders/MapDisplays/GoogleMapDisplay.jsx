// PATH: Okra/Okrarides/rider/components/Map/MapDisplays/GoogleMapDisplay.jsx
//
// Google Maps JS API display component.
// Env: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

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

export default function GoogleMapDisplay({
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
  const polylineRef  = useRef(null);
  const controlsRef  = useRef(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    console.log('[GoogleMapDisplay] MOUNT — apiKey present:', !!apiKey, '| apiKey prefix:', apiKey?.slice(0,8) || 'MISSING', '| containerRef:', !!containerRef.current, '| center:', center, '| zoom:', zoom);
    if (!apiKey) {
      console.error('[GoogleMapDisplay] ❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing — map cannot load');
      return;
    }
    let cancelled = false;

    async function init() {
      try {
        // Step 1: load script (idempotent — safe on StrictMode double-invoke)
        console.log('[GoogleMapDisplay] loading Google Maps script...');
        await loadScript(
          `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`,
          'google-maps-script'
        );

        // Step 2: wait for google.maps to actually be populated
        const gmaps = await waitForGoogleMaps(6000);
        if (!gmaps) { console.error('[GoogleMapDisplay] ❌ window.google.maps never appeared'); return; }
        console.log('[GoogleMapDisplay] google.maps available');

        // Step 3: only NOW check cancelled — right before touching the DOM
        if (cancelled) {
          console.log('[GoogleMapDisplay] cancelled before map creation (StrictMode unmount) — real mount will succeed');
          return;
        }
        if (!containerRef.current) { console.error('[GoogleMapDisplay] ❌ container ref gone'); return; }

        console.log('[GoogleMapDisplay] creating map...');
        const map = new window.google.maps.Map(containerRef.current, {
          center:            { lat: center.lat, lng: center.lng },
          zoom,
          heading:           bearing,
          tilt:              pitch,
          mapId:             'OKRA_MAP',
          disableDefaultUI: true,
          zoomControl:       true,
          gestureHandling:   'greedy',
        });
        console.log('[GoogleMapDisplay] ✅ map instance created');

        mapRef.current = map;

        map.addListener('click', (e) => {
          onMapClick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });

        controlsRef.current = buildControls(map);
        console.log('[GoogleMapDisplay] calling onMapLoad with controls');
        onMapLoad?.(controlsRef.current);
      } catch (err) {
        console.error('[GoogleMapDisplay] ❌ init error:', err?.message, err);
      }
    }

    init();
    return () => {
      cancelled = true;
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Markers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    const all = [
      ...markers,
      ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
      ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
    ];

    const ids = new Set(all.map((m) => m.id || m.type));

    Object.keys(markersRef.current).forEach((id) => {
      if (!ids.has(id)) { markersRef.current[id].setMap(null); delete markersRef.current[id]; }
    });

    all.forEach((m) => {
      const id    = m.id || m.type;
      const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;

      if (markersRef.current[id]) {
        markersRef.current[id].setPosition({ lat: m.lat, lng: m.lng });
        return;
      }

      const marker = new window.google.maps.Marker({
        map,
        position: { lat: m.lat, lng: m.lng },
        icon: {
          path:        window.google.maps.SymbolPath.CIRCLE,
          scale:       9,
          fillColor:   color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      markersRef.current[id] = marker;
    });
  }, [markers, pickupLocation, dropoffLocation]);

  // ── Route ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    polylineRef.current?.setMap(null);
    polylineRef.current = null;

    if (!showRoute || !route?.length) return;

    // route = [[lng, lat], ...] (GeoJSON order)
    const path = route.map(([lng, lat]) => ({ lat, lng }));

    polylineRef.current = new window.google.maps.Polyline({
      map,
      path,
      strokeColor:   '#3b82f6',
      strokeOpacity: 1,
      strokeWeight:  5,
    });
  }, [route, showRoute]);

  // ── Center ────────────────────────────────────────────────────────────────
  useEffect(() => {
    mapRef.current?.panTo({ lat: center.lat, lng: center.lng });
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setHeading(bearing);
    map.setTilt(pitch);
  }, [bearing, pitch]);

  function buildControls(map) {
    return {
      animateToLocation(lat, lng, z) {
        map.panTo({ lat, lng });
        if (z != null) map.setZoom(z);
      },
      setZoom(z)   { map.setZoom(z); },
      zoomIn()     { map.setZoom(map.getZoom() + 1); },
      zoomOut()    { map.setZoom(map.getZoom() - 1); },
      enable3DMode(brg = 0) {
        map.setTilt(45);
        map.setHeading(brg);
      },
      disable3DMode() {
        map.setTilt(0);
        map.setHeading(0);
      },
      updateDriverLocation(lat, lng, heading) {
        const marker = markersRef.current['driver'];
        if (marker) marker.setPosition({ lat, lng });
      },
      clearRoute() {
        polylineRef.current?.setMap(null);
        polylineRef.current = null;
      },
      getCurrentLocation(cb) {
        navigator.geolocation?.getCurrentPosition(
          (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => cb(null)
        );
      },
    };
  }

  console.log('[GoogleMapDisplay] RETURNING div — width:', width, 'height:', height);
  return (
    <div ref={containerRef} style={{ width: width || '100%', height: height || '100%', minHeight: '400px', position: 'relative', background: '#e8f4fd' }} />
  );
}

function waitForGoogleMaps(timeout = 6000) {
  return new Promise((resolve) => {
    if (window.google?.maps) { resolve(window.google.maps); return; }
    const deadline = Date.now() + timeout;
    const poll = () => {
      if (window.google?.maps) { resolve(window.google.maps); return; }
      if (Date.now() > deadline) { resolve(null); return; }
      setTimeout(poll, 50);
    };
    poll();
  });
}

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      if (window.google?.maps) { resolve(); return; }
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const s  = document.createElement('script');
    s.id     = id;
    s.src    = src;
    s.async  = true;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}