// // // // // // PATH: Okra/Okrarides/rider/components/Map/MapDisplays/AppleMapDisplay.jsx
// // // // // //
// // // // // // Apple Maps via MapKit JS.
// // // // // // Env: NEXT_PUBLIC_APPLE_MAPS_TOKEN  (JWT signed with your MapKit key)
// // // // // //
// // // // // // To generate your JWT token see:
// // // // // // https://developer.apple.com/documentation/mapkitjs/creating_and_using_tokens_with_mapkit_js
// // // // // //
// // // // // // Routing opens the Maps app / maps.apple.com via URL scheme.

// // // // // 'use client';

// // // // // import { useEffect, useRef } from 'react';

// // // // // const MARKER_COLORS = {
// // // // //   pickup:  '#22c55e',
// // // // //   dropoff: '#ef4444',
// // // // //   driver:  '#3b82f6',
// // // // //   station: '#6366f1',
// // // // //   current: '#3b82f6',
// // // // //   default: '#8b5cf6',
// // // // // };

// // // // // export default function AppleMapDisplay({
// // // // //   center        = { lat: -15.4167, lng: 28.2833 },
// // // // //   zoom          = 13,
// // // // //   markers       = [],
// // // // //   pickupLocation,
// // // // //   dropoffLocation,
// // // // //   route,
// // // // //   showRoute     = false,
// // // // //   onMapClick,
// // // // //   onMapLoad,
// // // // //   height        = '100%',
// // // // //   width         = '100%',
// // // // // }) {
// // // // //   const containerRef = useRef(null);
// // // // //   const mapRef       = useRef(null);
// // // // //   const mkaRef       = useRef(null);  // mapkit instance
// // // // //   const markersRef   = useRef({});
// // // // //   const overlayRef   = useRef(null);
// // // // //   const controlsRef  = useRef(null);

// // // // //   const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';

// // // // //   useEffect(() => {
// // // // //     if (!token) { console.warn('[AppleMapDisplay] No MapKit JS token'); return; }
// // // // //     let cancelled = false;

// // // // //     async function init() {
// // // // //       await loadScript('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js', 'mapkit-script');
// // // // //       if (cancelled || !window.mapkit) return;

// // // // //       const mapkit = window.mapkit;
// // // // //       mkaRef.current = mapkit;

// // // // //       if (!mapkit._initialized) {
// // // // //         mapkit.init({
// // // // //           authorizationCallback: (done) => done(token),
// // // // //           language: 'en',
// // // // //         });
// // // // //         mapkit._initialized = true;
// // // // //       }

// // // // //       await new Promise((res) => {
// // // // //         if (mapkit.loadedLibraries?.length) { res(); return; }
// // // // //         mapkit.addEventListener('configuration-change', () => res(), { once: true });
// // // // //       });

// // // // //       if (cancelled) return;

// // // // //       // ── Zoom level: MapKit uses span (lat/lng degrees), not zoom int ──────
// // // // //       const spanDeg = zoomToSpan(zoom);

// // // // //       const map = new mapkit.Map(containerRef.current, {
// // // // //         region: new mapkit.CoordinateRegion(
// // // // //           new mapkit.Coordinate(center.lat, center.lng),
// // // // //           new mapkit.CoordinateSpan(spanDeg, spanDeg)
// // // // //         ),
// // // // //         showsCompass:     mapkit.FeatureVisibility.Adaptive,
// // // // //         showsZoomControl: true,
// // // // //         showsMapTypeControl: false,
// // // // //         mapType:          mapkit.Map.MapTypes.Standard,
// // // // //       });

// // // // //       mapRef.current = map;

// // // // //       map.addEventListener('click', (e) => {
// // // // //         onMapClick?.({ lat: e.pointOnPage.y, lng: e.pointOnPage.x }); // best effort
// // // // //       });

// // // // //       // MapKit JS doesn't provide click coordinates directly without a
// // // // //       // conversion helper; use an overlay div for click events
// // // // //       containerRef.current.addEventListener('click', (e) => {
// // // // //         const rect  = containerRef.current.getBoundingClientRect();
// // // // //         const point = new mapkit.DOMPoint(e.clientX - rect.left, e.clientY - rect.top);
// // // // //         const coord = map.convertPointOnPageToCoordinate(point);
// // // // //         if (coord) onMapClick?.({ lat: coord.latitude, lng: coord.longitude });
// // // // //       });

// // // // //       controlsRef.current = buildControls(map, mapkit);
// // // // //       onMapLoad?.(controlsRef.current);
// // // // //     }

// // // // //     init();
// // // // //     return () => {
// // // // //       cancelled = true;
// // // // //       mapRef.current?.destroy?.();
// // // // //       mapRef.current = null;
// // // // //     };
// // // // //   }, []); // eslint-disable-line react-hooks/exhaustive-deps

// // // // //   // ── Markers ────────────────────────────────────────────────────────────────
// // // // //   useEffect(() => {
// // // // //     const map    = mapRef.current;
// // // // //     const mapkit = mkaRef.current;
// // // // //     if (!map || !mapkit) return;

// // // // //     const all = [
// // // // //       ...markers,
// // // // //       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
// // // // //       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
// // // // //     ];
// // // // //     const ids = new Set(all.map((m) => m.id || m.type));

// // // // //     // Remove stale
// // // // //     Object.entries(markersRef.current).forEach(([id, annotation]) => {
// // // // //       if (!ids.has(id)) { map.removeAnnotation(annotation); delete markersRef.current[id]; }
// // // // //     });

// // // // //     // Add / update
// // // // //     all.forEach((m) => {
// // // // //       const id    = m.id || m.type;
// // // // //       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;

// // // // //       if (markersRef.current[id]) {
// // // // //         markersRef.current[id].coordinate =
// // // // //           new mapkit.Coordinate(m.lat, m.lng);
// // // // //         return;
// // // // //       }

// // // // //       const annotation = new mapkit.MarkerAnnotation(
// // // // //         new mapkit.Coordinate(m.lat, m.lng),
// // // // //         {
// // // // //           color,
// // // // //           title:   m.name || m.type || '',
// // // // //           glyphColor: '#fff',
// // // // //         }
// // // // //       );
// // // // //       map.addAnnotation(annotation);
// // // // //       markersRef.current[id] = annotation;
// // // // //     });
// // // // //   }, [markers, pickupLocation, dropoffLocation]);

// // // // //   // ── Route (polyline overlay) ───────────────────────────────────────────────
// // // // //   useEffect(() => {
// // // // //     const map    = mapRef.current;
// // // // //     const mapkit = mkaRef.current;
// // // // //     if (!map || !mapkit) return;

// // // // //     // Remove existing overlay
// // // // //     if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }

// // // // //     if (!showRoute || !route?.length) return;

// // // // //     // route = [[lng, lat], ...]
// // // // //     const coords    = route.map(([lng, lat]) => new mapkit.Coordinate(lat, lng));
// // // // //     const polyline  = new mapkit.PolylineOverlay(coords, {
// // // // //       style: new mapkit.Style({
// // // // //         lineWidth:  5,
// // // // //         strokeColor: '#3b82f6',
// // // // //         strokeOpacity: 1,
// // // // //       }),
// // // // //     });
// // // // //     map.addOverlay(polyline);
// // // // //     overlayRef.current = polyline;
// // // // //   }, [route, showRoute]);

// // // // //   // ── Center ────────────────────────────────────────────────────────────────
// // // // //   useEffect(() => {
// // // // //     const map    = mapRef.current;
// // // // //     const mapkit = mkaRef.current;
// // // // //     if (!map || !mapkit) return;
// // // // //     const spanDeg = zoomToSpan(zoom);
// // // // //     map.setRegionAnimated(
// // // // //       new mapkit.CoordinateRegion(
// // // // //         new mapkit.Coordinate(center.lat, center.lng),
// // // // //         new mapkit.CoordinateSpan(spanDeg, spanDeg)
// // // // //       )
// // // // //     );
// // // // //   }, [center.lat, center.lng, zoom]);

// // // // //   function buildControls(map, mapkit) {
// // // // //     return {
// // // // //       animateToLocation(lat, lng, z) {
// // // // //         const span = zoomToSpan(z ?? zoom);
// // // // //         map.setRegionAnimated(
// // // // //           new mapkit.CoordinateRegion(
// // // // //             new mapkit.Coordinate(lat, lng),
// // // // //             new mapkit.CoordinateSpan(span, span)
// // // // //           )
// // // // //         );
// // // // //       },
// // // // //       setZoom(z) {
// // // // //         const span = zoomToSpan(z);
// // // // //         map.setRegionAnimated(
// // // // //           new mapkit.CoordinateRegion(map.center, new mapkit.CoordinateSpan(span, span))
// // // // //         );
// // // // //       },
// // // // //       zoomIn()  { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta / 2, r.span.longitudeDelta / 2))); },
// // // // //       zoomOut() { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta * 2, r.span.longitudeDelta * 2))); },
// // // // //       enable3DMode()  { /* MapKit doesn't support pitch programmatically in basic API */ },
// // // // //       disable3DMode() { /* no-op */ },
// // // // //       updateDriverLocation(lat, lng) {
// // // // //         const ann = markersRef.current['driver'];
// // // // //         if (ann) ann.coordinate = new mapkit.Coordinate(lat, lng);
// // // // //       },
// // // // //       clearRoute() {
// // // // //         if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }
// // // // //       },
// // // // //       getCurrentLocation(cb) {
// // // // //         navigator.geolocation?.getCurrentPosition(
// // // // //           (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
// // // // //           () => cb(null)
// // // // //         );
// // // // //       },
// // // // //     };
// // // // //   }

// // // // //   return (
// // // // //     <div ref={containerRef} style={{ width, height, position: 'relative' }} />
// // // // //   );
// // // // // }

// // // // // // Approximate zoom int → lat/lng span degrees
// // // // // function zoomToSpan(zoom = 13) {
// // // // //   return 360 / Math.pow(2, zoom) * 2;
// // // // // }

// // // // // function loadScript(src, id) {
// // // // //   return new Promise((resolve, reject) => {
// // // // //     if (document.getElementById(id)) { resolve(); return; }
// // // // //     const s = document.createElement('script');
// // // // //     s.id = id; s.src = src; s.async = true;
// // // // //     s.onload = resolve; s.onerror = reject;
// // // // //     document.head.appendChild(s);
// // // // //   });
// // // // // }

// // // // // PATH: Okra/Okrarides/rider/components/Map/MapDisplays/AppleMapDisplay.jsx
// // // // //
// // // // // Apple Maps via MapKit JS.
// // // // // Env: NEXT_PUBLIC_APPLE_MAPS_TOKEN  (JWT signed with your MapKit key)
// // // // //
// // // // // To generate your JWT token see:
// // // // // https://developer.apple.com/documentation/mapkitjs/creating_and_using_tokens_with_mapkit_js
// // // // //
// // // // // Routing opens the Maps app / maps.apple.com via URL scheme.

// // // // 'use client';

// // // // import { useEffect, useRef } from 'react';

// // // // const MARKER_COLORS = {
// // // //   pickup:  '#22c55e',
// // // //   dropoff: '#ef4444',
// // // //   driver:  '#3b82f6',
// // // //   station: '#6366f1',
// // // //   current: '#3b82f6',
// // // //   default: '#8b5cf6',
// // // // };

// // // // export default function AppleMapDisplay({
// // // //   center        = { lat: -15.4167, lng: 28.2833 },
// // // //   zoom          = 13,
// // // //   markers       = [],
// // // //   pickupLocation,
// // // //   dropoffLocation,
// // // //   route,
// // // //   showRoute     = false,
// // // //   onMapClick,
// // // //   onMapLoad,
// // // //   height        = '100%',
// // // //   width         = '100%',
// // // // }) {
// // // //   const containerRef = useRef(null);
// // // //   const mapRef       = useRef(null);
// // // //   const mkaRef       = useRef(null);  // mapkit instance
// // // //   const markersRef   = useRef({});
// // // //   const overlayRef   = useRef(null);
// // // //   const controlsRef  = useRef(null);

// // // //   const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';

// // // //   if (!token) {
// // // //     return (
// // // //       <div style={{ width, height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#475569', fontFamily: 'sans-serif', gap: 8 }}>
// // // //         <div style={{ fontSize: 32 }}>🍎</div>
// // // //         <div style={{ fontWeight: 600 }}>Apple Maps token missing</div>
// // // //         <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 280, color: '#94a3b8' }}>
// // // //           Add <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_APPLE_MAPS_TOKEN</code> to your <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> file and restart the dev server.
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   useEffect(() => {
// // // //     let cancelled = false;

// // // //     async function init() {
// // // //       await loadScript('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js', 'mapkit-script');
// // // //       if (cancelled || !window.mapkit) return;

// // // //       const mapkit = window.mapkit;
// // // //       mkaRef.current = mapkit;

// // // //       if (!mapkit._initialized) {
// // // //         mapkit.init({
// // // //           authorizationCallback: (done) => done(token),
// // // //           language: 'en',
// // // //         });
// // // //         mapkit._initialized = true;
// // // //       }

// // // //       await new Promise((res) => {
// // // //         if (mapkit.loadedLibraries?.length) { res(); return; }
// // // //         mapkit.addEventListener('configuration-change', () => res(), { once: true });
// // // //       });

// // // //       if (cancelled) return;

// // // //       // ── Zoom level: MapKit uses span (lat/lng degrees), not zoom int ──────
// // // //       const spanDeg = zoomToSpan(zoom);

// // // //       const map = new mapkit.Map(containerRef.current, {
// // // //         region: new mapkit.CoordinateRegion(
// // // //           new mapkit.Coordinate(center.lat, center.lng),
// // // //           new mapkit.CoordinateSpan(spanDeg, spanDeg)
// // // //         ),
// // // //         showsCompass:     mapkit.FeatureVisibility.Adaptive,
// // // //         showsZoomControl: true,
// // // //         showsMapTypeControl: false,
// // // //         mapType:          mapkit.Map.MapTypes.Standard,
// // // //       });

// // // //       mapRef.current = map;

// // // //       map.addEventListener('click', (e) => {
// // // //         onMapClick?.({ lat: e.pointOnPage.y, lng: e.pointOnPage.x }); // best effort
// // // //       });

// // // //       // MapKit JS doesn't provide click coordinates directly without a
// // // //       // conversion helper; use an overlay div for click events
// // // //       containerRef.current.addEventListener('click', (e) => {
// // // //         const rect  = containerRef.current.getBoundingClientRect();
// // // //         const point = new mapkit.DOMPoint(e.clientX - rect.left, e.clientY - rect.top);
// // // //         const coord = map.convertPointOnPageToCoordinate(point);
// // // //         if (coord) onMapClick?.({ lat: coord.latitude, lng: coord.longitude });
// // // //       });

// // // //       controlsRef.current = buildControls(map, mapkit);
// // // //       onMapLoad?.(controlsRef.current);
// // // //     }

// // // //     init();
// // // //     return () => {
// // // //       cancelled = true;
// // // //       mapRef.current?.destroy?.();
// // // //       mapRef.current = null;
// // // //     };
// // // //   }, []); // eslint-disable-line react-hooks/exhaustive-deps

// // // //   // ── Markers ────────────────────────────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     const map    = mapRef.current;
// // // //     const mapkit = mkaRef.current;
// // // //     if (!map || !mapkit) return;

// // // //     const all = [
// // // //       ...markers,
// // // //       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
// // // //       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
// // // //     ];
// // // //     const ids = new Set(all.map((m) => m.id || m.type));

// // // //     // Remove stale
// // // //     Object.entries(markersRef.current).forEach(([id, annotation]) => {
// // // //       if (!ids.has(id)) { map.removeAnnotation(annotation); delete markersRef.current[id]; }
// // // //     });

// // // //     // Add / update
// // // //     all.forEach((m) => {
// // // //       const id    = m.id || m.type;
// // // //       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;

// // // //       if (markersRef.current[id]) {
// // // //         markersRef.current[id].coordinate =
// // // //           new mapkit.Coordinate(m.lat, m.lng);
// // // //         return;
// // // //       }

// // // //       const annotation = new mapkit.MarkerAnnotation(
// // // //         new mapkit.Coordinate(m.lat, m.lng),
// // // //         {
// // // //           color,
// // // //           title:   m.name || m.type || '',
// // // //           glyphColor: '#fff',
// // // //         }
// // // //       );
// // // //       map.addAnnotation(annotation);
// // // //       markersRef.current[id] = annotation;
// // // //     });
// // // //   }, [markers, pickupLocation, dropoffLocation]);

// // // //   // ── Route (polyline overlay) ───────────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     const map    = mapRef.current;
// // // //     const mapkit = mkaRef.current;
// // // //     if (!map || !mapkit) return;

// // // //     // Remove existing overlay
// // // //     if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }

// // // //     if (!showRoute || !route?.length) return;

// // // //     // route = [[lng, lat], ...]
// // // //     const coords    = route.map(([lng, lat]) => new mapkit.Coordinate(lat, lng));
// // // //     const polyline  = new mapkit.PolylineOverlay(coords, {
// // // //       style: new mapkit.Style({
// // // //         lineWidth:  5,
// // // //         strokeColor: '#3b82f6',
// // // //         strokeOpacity: 1,
// // // //       }),
// // // //     });
// // // //     map.addOverlay(polyline);
// // // //     overlayRef.current = polyline;
// // // //   }, [route, showRoute]);

// // // //   // ── Center ────────────────────────────────────────────────────────────────
// // // //   useEffect(() => {
// // // //     const map    = mapRef.current;
// // // //     const mapkit = mkaRef.current;
// // // //     if (!map || !mapkit) return;
// // // //     const spanDeg = zoomToSpan(zoom);
// // // //     map.setRegionAnimated(
// // // //       new mapkit.CoordinateRegion(
// // // //         new mapkit.Coordinate(center.lat, center.lng),
// // // //         new mapkit.CoordinateSpan(spanDeg, spanDeg)
// // // //       )
// // // //     );
// // // //   }, [center.lat, center.lng, zoom]);

// // // //   function buildControls(map, mapkit) {
// // // //     return {
// // // //       animateToLocation(lat, lng, z) {
// // // //         const span = zoomToSpan(z ?? zoom);
// // // //         map.setRegionAnimated(
// // // //           new mapkit.CoordinateRegion(
// // // //             new mapkit.Coordinate(lat, lng),
// // // //             new mapkit.CoordinateSpan(span, span)
// // // //           )
// // // //         );
// // // //       },
// // // //       setZoom(z) {
// // // //         const span = zoomToSpan(z);
// // // //         map.setRegionAnimated(
// // // //           new mapkit.CoordinateRegion(map.center, new mapkit.CoordinateSpan(span, span))
// // // //         );
// // // //       },
// // // //       zoomIn()  { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta / 2, r.span.longitudeDelta / 2))); },
// // // //       zoomOut() { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta * 2, r.span.longitudeDelta * 2))); },
// // // //       enable3DMode()  { /* MapKit doesn't support pitch programmatically in basic API */ },
// // // //       disable3DMode() { /* no-op */ },
// // // //       updateDriverLocation(lat, lng) {
// // // //         const ann = markersRef.current['driver'];
// // // //         if (ann) ann.coordinate = new mapkit.Coordinate(lat, lng);
// // // //       },
// // // //       clearRoute() {
// // // //         if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }
// // // //       },
// // // //       getCurrentLocation(cb) {
// // // //         navigator.geolocation?.getCurrentPosition(
// // // //           (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
// // // //           () => cb(null)
// // // //         );
// // // //       },
// // // //     };
// // // //   }

// // // //   return (
// // // //     <div ref={containerRef} style={{ width, height, position: 'relative' }} />
// // // //   );
// // // // }

// // // // // Approximate zoom int → lat/lng span degrees
// // // // function zoomToSpan(zoom = 13) {
// // // //   return 360 / Math.pow(2, zoom) * 2;
// // // // }

// // // // function loadScript(src, id) {
// // // //   return new Promise((resolve, reject) => {
// // // //     if (document.getElementById(id)) { resolve(); return; }
// // // //     const s = document.createElement('script');
// // // //     s.id = id; s.src = src; s.async = true;
// // // //     s.onload = resolve; s.onerror = reject;
// // // //     document.head.appendChild(s);
// // // //   });
// // // // }
// // // // PATH: Okra/Okrarides/rider/components/Map/MapDisplays/AppleMapDisplay.jsx
// // // //
// // // // Apple Maps via MapKit JS.
// // // // Env: NEXT_PUBLIC_APPLE_MAPS_TOKEN  (JWT signed with your MapKit key)
// // // //
// // // // To generate your JWT token see:
// // // // https://developer.apple.com/documentation/mapkitjs/creating_and_using_tokens_with_mapkit_js
// // // //
// // // // Routing opens the Maps app / maps.apple.com via URL scheme.

// // // 'use client';

// // // import { useEffect, useRef } from 'react';

// // // const MARKER_COLORS = {
// // //   pickup:  '#22c55e',
// // //   dropoff: '#ef4444',
// // //   driver:  '#3b82f6',
// // //   station: '#6366f1',
// // //   current: '#3b82f6',
// // //   default: '#8b5cf6',
// // // };

// // // export default function AppleMapDisplay({
// // //   center        = { lat: -15.4167, lng: 28.2833 },
// // //   zoom          = 13,
// // //   markers       = [],
// // //   pickupLocation,
// // //   dropoffLocation,
// // //   route,
// // //   showRoute     = false,
// // //   onMapClick,
// // //   onMapLoad,
// // //   height        = '100%',
// // //   width         = '100%',
// // // }) {
// // //   const containerRef = useRef(null);
// // //   const mapRef       = useRef(null);
// // //   const mkaRef       = useRef(null);  // mapkit instance
// // //   const markersRef   = useRef({});
// // //   const overlayRef   = useRef(null);
// // //   const controlsRef  = useRef(null);

// // //   const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';

// // //   if (!token) {
// // //     return (
// // //       <div style={{ width, height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#475569', fontFamily: 'sans-serif', gap: 8 }}>
// // //         <div style={{ fontSize: 32 }}>🍎</div>
// // //         <div style={{ fontWeight: 600 }}>Apple Maps token missing</div>
// // //         <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 280, color: '#94a3b8' }}>
// // //           Add <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_APPLE_MAPS_TOKEN</code> to your <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> file and restart the dev server.
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   useEffect(() => {
// // //     let cancelled = false;

// // //     async function init() {
// // //       await loadScript('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js', 'mapkit-script');
// // //       if (cancelled || !window.mapkit) return;

// // //       const mapkit = window.mapkit;
// // //       mkaRef.current = mapkit;

// // //       if (!mapkit._initialized) {
// // //         mapkit.init({
// // //           authorizationCallback: (done) => done(token),
// // //           language: 'en',
// // //         });
// // //         mapkit._initialized = true;
// // //       }

// // //       await new Promise((res) => {
// // //         if (mapkit.loadedLibraries?.length) { res(); return; }
// // //         mapkit.addEventListener('configuration-change', () => res(), { once: true });
// // //       });

// // //       if (cancelled) return;

// // //       // ── Zoom level: MapKit uses span (lat/lng degrees), not zoom int ──────
// // //       const spanDeg = zoomToSpan(zoom);

// // //       const map = new mapkit.Map(containerRef.current, {
// // //         region: new mapkit.CoordinateRegion(
// // //           new mapkit.Coordinate(center.lat, center.lng),
// // //           new mapkit.CoordinateSpan(spanDeg, spanDeg)
// // //         ),
// // //         showsCompass:     mapkit.FeatureVisibility.Adaptive,
// // //         showsZoomControl: true,
// // //         showsMapTypeControl: false,
// // //         mapType:          mapkit.Map.MapTypes.Standard,
// // //       });

// // //       mapRef.current = map;

// // //       map.addEventListener('click', (e) => {
// // //         onMapClick?.({ lat: e.pointOnPage.y, lng: e.pointOnPage.x }); // best effort
// // //       });

// // //       // MapKit JS doesn't provide click coordinates directly without a
// // //       // conversion helper; use an overlay div for click events
// // //       containerRef.current.addEventListener('click', (e) => {
// // //         const rect  = containerRef.current.getBoundingClientRect();
// // //         const point = new mapkit.DOMPoint(e.clientX - rect.left, e.clientY - rect.top);
// // //         const coord = map.convertPointOnPageToCoordinate(point);
// // //         if (coord) onMapClick?.({ lat: coord.latitude, lng: coord.longitude });
// // //       });

// // //       controlsRef.current = buildControls(map, mapkit);
// // //       onMapLoad?.(controlsRef.current);
// // //     }

// // //     init();
// // //     return () => {
// // //       cancelled = true;
// // //       mapRef.current?.destroy?.();
// // //       mapRef.current = null;
// // //     };
// // //   }, []); // eslint-disable-line react-hooks/exhaustive-deps

// // //   // ── Markers ────────────────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     const map    = mapRef.current;
// // //     const mapkit = mkaRef.current;
// // //     if (!map || !mapkit) return;

// // //     const all = [
// // //       ...markers,
// // //       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
// // //       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
// // //     ];
// // //     const ids = new Set(all.map((m) => m.id || m.type));

// // //     // Remove stale
// // //     Object.entries(markersRef.current).forEach(([id, annotation]) => {
// // //       if (!ids.has(id)) { map.removeAnnotation(annotation); delete markersRef.current[id]; }
// // //     });

// // //     // Add / update
// // //     all.forEach((m) => {
// // //       const id    = m.id || m.type;
// // //       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;

// // //       if (markersRef.current[id]) {
// // //         markersRef.current[id].coordinate =
// // //           new mapkit.Coordinate(m.lat, m.lng);
// // //         return;
// // //       }

// // //       const annotation = new mapkit.MarkerAnnotation(
// // //         new mapkit.Coordinate(m.lat, m.lng),
// // //         {
// // //           color,
// // //           title:   m.name || m.type || '',
// // //           glyphColor: '#fff',
// // //         }
// // //       );
// // //       map.addAnnotation(annotation);
// // //       markersRef.current[id] = annotation;
// // //     });
// // //   }, [markers, pickupLocation, dropoffLocation]);

// // //   // ── Route (polyline overlay) ───────────────────────────────────────────────
// // //   useEffect(() => {
// // //     const map    = mapRef.current;
// // //     const mapkit = mkaRef.current;
// // //     if (!map || !mapkit) return;

// // //     // Remove existing overlay
// // //     if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }

// // //     if (!showRoute || !route?.length) return;

// // //     // route = [[lng, lat], ...]
// // //     const coords    = route.map(([lng, lat]) => new mapkit.Coordinate(lat, lng));
// // //     const polyline  = new mapkit.PolylineOverlay(coords, {
// // //       style: new mapkit.Style({
// // //         lineWidth:  5,
// // //         strokeColor: '#3b82f6',
// // //         strokeOpacity: 1,
// // //       }),
// // //     });
// // //     map.addOverlay(polyline);
// // //     overlayRef.current = polyline;
// // //   }, [route, showRoute]);

// // //   // ── Center ────────────────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     const map    = mapRef.current;
// // //     const mapkit = mkaRef.current;
// // //     if (!map || !mapkit) return;
// // //     const spanDeg = zoomToSpan(zoom);
// // //     map.setRegionAnimated(
// // //       new mapkit.CoordinateRegion(
// // //         new mapkit.Coordinate(center.lat, center.lng),
// // //         new mapkit.CoordinateSpan(spanDeg, spanDeg)
// // //       )
// // //     );
// // //   }, [center.lat, center.lng, zoom]);

// // //   function buildControls(map, mapkit) {
// // //     return {
// // //       animateToLocation(lat, lng, z) {
// // //         const span = zoomToSpan(z ?? zoom);
// // //         map.setRegionAnimated(
// // //           new mapkit.CoordinateRegion(
// // //             new mapkit.Coordinate(lat, lng),
// // //             new mapkit.CoordinateSpan(span, span)
// // //           )
// // //         );
// // //       },
// // //       setZoom(z) {
// // //         const span = zoomToSpan(z);
// // //         map.setRegionAnimated(
// // //           new mapkit.CoordinateRegion(map.center, new mapkit.CoordinateSpan(span, span))
// // //         );
// // //       },
// // //       zoomIn()  { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta / 2, r.span.longitudeDelta / 2))); },
// // //       zoomOut() { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta * 2, r.span.longitudeDelta * 2))); },
// // //       enable3DMode()  { /* MapKit doesn't support pitch programmatically in basic API */ },
// // //       disable3DMode() { /* no-op */ },
// // //       updateDriverLocation(lat, lng) {
// // //         const ann = markersRef.current['driver'];
// // //         if (ann) ann.coordinate = new mapkit.Coordinate(lat, lng);
// // //       },
// // //       clearRoute() {
// // //         if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }
// // //       },
// // //       getCurrentLocation(cb) {
// // //         navigator.geolocation?.getCurrentPosition(
// // //           (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
// // //           () => cb(null)
// // //         );
// // //       },
// // //     };
// // //   }

// // //   return (
// // //     <div ref={containerRef} style={{ width, height, position: 'relative' }} />
// // //   );
// // // }

// // // // Approximate zoom int → lat/lng span degrees
// // // function zoomToSpan(zoom = 13) {
// // //   return 360 / Math.pow(2, zoom) * 2;
// // // }

// // // function loadScript(src, id) {
// // //   return new Promise((resolve, reject) => {
// // //     if (document.getElementById(id)) { resolve(); return; }
// // //     const s = document.createElement('script');
// // //     s.id = id; s.src = src; s.async = true;
// // //     s.onload = resolve; s.onerror = reject;
// // //     document.head.appendChild(s);
// // //   });
// // // }
// // // PATH: Okra/Okrarides/rider/components/Map/MapDisplays/AppleMapDisplay.jsx
// // //
// // // Apple Maps via MapKit JS.
// // // Env: NEXT_PUBLIC_APPLE_MAPS_TOKEN  (JWT signed with your MapKit key)
// // //
// // // To generate your JWT token see:
// // // https://developer.apple.com/documentation/mapkitjs/creating_and_using_tokens_with_mapkit_js
// // //
// // // Routing opens the Maps app / maps.apple.com via URL scheme.

// // 'use client';

// // import { useEffect, useRef } from 'react';

// // const MARKER_COLORS = {
// //   pickup:  '#22c55e',
// //   dropoff: '#ef4444',
// //   driver:  '#3b82f6',
// //   station: '#6366f1',
// //   current: '#3b82f6',
// //   default: '#8b5cf6',
// // };

// // export default function AppleMapDisplay({
// //   center        = { lat: -15.4167, lng: 28.2833 },
// //   zoom          = 13,
// //   markers       = [],
// //   pickupLocation,
// //   dropoffLocation,
// //   route,
// //   showRoute     = false,
// //   onMapClick,
// //   onMapLoad,
// //   height        = '100%',
// //   width         = '100%',
// // }) {
// //   const containerRef = useRef(null);
// //   const mapRef       = useRef(null);
// //   const mkaRef       = useRef(null);  // mapkit instance
// //   const markersRef   = useRef({});
// //   const overlayRef   = useRef(null);
// //   const controlsRef  = useRef(null);

// //   const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';

// //   if (!token) {
// //     return (
// //       <div style={{ width, height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#475569', fontFamily: 'sans-serif', gap: 8 }}>
// //         <div style={{ fontSize: 32 }}>🍎</div>
// //         <div style={{ fontWeight: 600 }}>Apple Maps token missing</div>
// //         <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 280, color: '#94a3b8' }}>
// //           Add <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_APPLE_MAPS_TOKEN</code> to your <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> file and restart the dev server.
// //         </div>
// //       </div>
// //     );
// //   }

// //   useEffect(() => {
// //     console.log('[AppleMapDisplay] MOUNT — token present:', !!token, '| token prefix:', token?.slice(0,20)||'MISSING', '| container:', !!containerRef.current, '| center:', center, '| zoom:', zoom);
// //     let cancelled = false;

// //     async function init() {
// //       try {
// //       console.log('[AppleMapDisplay] loading mapkit.js script...');
// //       await loadScript('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js', 'mapkit-script');
// //       console.log('[AppleMapDisplay] script loaded — window.mapkit:', !!window.mapkit);
// //       if (cancelled) { console.log('[AppleMapDisplay] cancelled'); return; }
// //       if (!window.mapkit) { console.error('[AppleMapDisplay] ❌ window.mapkit not available after script load'); return; }

// //       const mapkit = window.mapkit;
// //       mkaRef.current = mapkit;

// //       console.log('[AppleMapDisplay] mapkit ready, _initialized:', !!mapkit._initialized);
// //       if (!mapkit._initialized) {
// //         mapkit.init({
// //           authorizationCallback: (done) => done(token),
// //           language: 'en',
// //         });
// //         mapkit._initialized = true;
// //       }

// //       await new Promise((res) => {
// //         if (mapkit.loadedLibraries?.length) { res(); return; }
// //         mapkit.addEventListener('configuration-change', () => res(), { once: true });
// //       });

// //       if (cancelled) return;

// //       // ── Zoom level: MapKit uses span (lat/lng degrees), not zoom int ──────
// //       const spanDeg = zoomToSpan(zoom);

// //       const map = new mapkit.Map(containerRef.current, {
// //         region: new mapkit.CoordinateRegion(
// //           new mapkit.Coordinate(center.lat, center.lng),
// //           new mapkit.CoordinateSpan(spanDeg, spanDeg)
// //         ),
// //         showsCompass:     mapkit.FeatureVisibility.Adaptive,
// //         showsZoomControl: true,
// //         showsMapTypeControl: false,
// //         mapType:          mapkit.Map.MapTypes.Standard,
// //       });

// //       mapRef.current = map;

// //       map.addEventListener('click', (e) => {
// //         onMapClick?.({ lat: e.pointOnPage.y, lng: e.pointOnPage.x }); // best effort
// //       });

// //       // MapKit JS doesn't provide click coordinates directly without a
// //       // conversion helper; use an overlay div for click events
// //       containerRef.current.addEventListener('click', (e) => {
// //         const rect  = containerRef.current.getBoundingClientRect();
// //         const point = new mapkit.DOMPoint(e.clientX - rect.left, e.clientY - rect.top);
// //         const coord = map.convertPointOnPageToCoordinate(point);
// //         if (coord) onMapClick?.({ lat: coord.latitude, lng: coord.longitude });
// //       });

// //       console.log('[AppleMapDisplay] ✅ map created, calling onMapLoad');
// //       controlsRef.current = buildControls(map, mapkit);
// //       onMapLoad?.(controlsRef.current);
// //       } catch(err) { console.error('[AppleMapDisplay] ❌ init error:', err?.message, err); }
// //     }

// //     init();
// //     return () => {
// //       cancelled = true;
// //       mapRef.current?.destroy?.();
// //       mapRef.current = null;
// //     };
// //   }, []); // eslint-disable-line react-hooks/exhaustive-deps

// //   // ── Markers ────────────────────────────────────────────────────────────────
// //   useEffect(() => {
// //     const map    = mapRef.current;
// //     const mapkit = mkaRef.current;
// //     if (!map || !mapkit) return;

// //     const all = [
// //       ...markers,
// //       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
// //       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
// //     ];
// //     const ids = new Set(all.map((m) => m.id || m.type));

// //     // Remove stale
// //     Object.entries(markersRef.current).forEach(([id, annotation]) => {
// //       if (!ids.has(id)) { map.removeAnnotation(annotation); delete markersRef.current[id]; }
// //     });

// //     // Add / update
// //     all.forEach((m) => {
// //       const id    = m.id || m.type;
// //       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;

// //       if (markersRef.current[id]) {
// //         markersRef.current[id].coordinate =
// //           new mapkit.Coordinate(m.lat, m.lng);
// //         return;
// //       }

// //       const annotation = new mapkit.MarkerAnnotation(
// //         new mapkit.Coordinate(m.lat, m.lng),
// //         {
// //           color,
// //           title:   m.name || m.type || '',
// //           glyphColor: '#fff',
// //         }
// //       );
// //       map.addAnnotation(annotation);
// //       markersRef.current[id] = annotation;
// //     });
// //   }, [markers, pickupLocation, dropoffLocation]);

// //   // ── Route (polyline overlay) ───────────────────────────────────────────────
// //   useEffect(() => {
// //     const map    = mapRef.current;
// //     const mapkit = mkaRef.current;
// //     if (!map || !mapkit) return;

// //     // Remove existing overlay
// //     if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }

// //     if (!showRoute || !route?.length) return;

// //     // route = [[lng, lat], ...]
// //     const coords    = route.map(([lng, lat]) => new mapkit.Coordinate(lat, lng));
// //     const polyline  = new mapkit.PolylineOverlay(coords, {
// //       style: new mapkit.Style({
// //         lineWidth:  5,
// //         strokeColor: '#3b82f6',
// //         strokeOpacity: 1,
// //       }),
// //     });
// //     map.addOverlay(polyline);
// //     overlayRef.current = polyline;
// //   }, [route, showRoute]);

// //   // ── Center ────────────────────────────────────────────────────────────────
// //   useEffect(() => {
// //     const map    = mapRef.current;
// //     const mapkit = mkaRef.current;
// //     if (!map || !mapkit) return;
// //     const spanDeg = zoomToSpan(zoom);
// //     map.setRegionAnimated(
// //       new mapkit.CoordinateRegion(
// //         new mapkit.Coordinate(center.lat, center.lng),
// //         new mapkit.CoordinateSpan(spanDeg, spanDeg)
// //       )
// //     );
// //   }, [center.lat, center.lng, zoom]);

// //   function buildControls(map, mapkit) {
// //     return {
// //       animateToLocation(lat, lng, z) {
// //         const span = zoomToSpan(z ?? zoom);
// //         map.setRegionAnimated(
// //           new mapkit.CoordinateRegion(
// //             new mapkit.Coordinate(lat, lng),
// //             new mapkit.CoordinateSpan(span, span)
// //           )
// //         );
// //       },
// //       setZoom(z) {
// //         const span = zoomToSpan(z);
// //         map.setRegionAnimated(
// //           new mapkit.CoordinateRegion(map.center, new mapkit.CoordinateSpan(span, span))
// //         );
// //       },
// //       zoomIn()  { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta / 2, r.span.longitudeDelta / 2))); },
// //       zoomOut() { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta * 2, r.span.longitudeDelta * 2))); },
// //       enable3DMode()  { /* MapKit doesn't support pitch programmatically in basic API */ },
// //       disable3DMode() { /* no-op */ },
// //       updateDriverLocation(lat, lng) {
// //         const ann = markersRef.current['driver'];
// //         if (ann) ann.coordinate = new mapkit.Coordinate(lat, lng);
// //       },
// //       clearRoute() {
// //         if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }
// //       },
// //       getCurrentLocation(cb) {
// //         navigator.geolocation?.getCurrentPosition(
// //           (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
// //           () => cb(null)
// //         );
// //       },
// //     };
// //   }

// //   return (
// //     <div ref={containerRef} style={{ width, height, position: 'relative', background: '#f0f4e8' }} />
// //   );
// // }

// // // Approximate zoom int → lat/lng span degrees
// // function zoomToSpan(zoom = 13) {
// //   return 360 / Math.pow(2, zoom) * 2;
// // }

// // function loadScript(src, id) {
// //   return new Promise((resolve, reject) => {
// //     if (document.getElementById(id)) { resolve(); return; }
// //     const s = document.createElement('script');
// //     s.id = id; s.src = src; s.async = true;
// //     s.onload = resolve; s.onerror = reject;
// //     document.head.appendChild(s);
// //   });
// // }
// // PATH: Okra/Okrarides/rider/components/Map/MapDisplays/AppleMapDisplay.jsx
// //
// // Apple Maps via MapKit JS.
// // Env: NEXT_PUBLIC_APPLE_MAPS_TOKEN  (JWT signed with your MapKit key)
// //
// // To generate your JWT token see:
// // https://developer.apple.com/documentation/mapkitjs/creating_and_using_tokens_with_mapkit_js
// //
// // Routing opens the Maps app / maps.apple.com via URL scheme.

// 'use client';

// import { useEffect, useRef } from 'react';

// const MARKER_COLORS = {
//   pickup:  '#22c55e',
//   dropoff: '#ef4444',
//   driver:  '#3b82f6',
//   station: '#6366f1',
//   current: '#3b82f6',
//   default: '#8b5cf6',
// };

// export default function AppleMapDisplay({
//   center        = { lat: -15.4167, lng: 28.2833 },
//   zoom          = 13,
//   markers       = [],
//   pickupLocation,
//   dropoffLocation,
//   route,
//   showRoute     = false,
//   onMapClick,
//   onMapLoad,
//   height        = '100%',
//   width         = '100%',
// }) {
//   const containerRef = useRef(null);
//   const mapRef       = useRef(null);
//   const mkaRef       = useRef(null);  // mapkit instance
//   const markersRef   = useRef({});
//   const overlayRef   = useRef(null);
//   const controlsRef  = useRef(null);

//   const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';

//   if (!token) {
//     return (
//       <div style={{ width, height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#475569', fontFamily: 'sans-serif', gap: 8 }}>
//         <div style={{ fontSize: 32 }}>🍎</div>
//         <div style={{ fontWeight: 600 }}>Apple Maps token missing</div>
//         <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 280, color: '#94a3b8' }}>
//           Add <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_APPLE_MAPS_TOKEN</code> to your <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> file and restart the dev server.
//         </div>
//       </div>
//     );
//   }

//   useEffect(() => {
//     console.log('[AppleMapDisplay] MOUNT — token present:', !!token, '| container:', !!containerRef.current);
//     // `cancelled` is intentionally checked ONLY before creating the Map DOM node.
//     // We let script loading and mapkit.init() proceed even on StrictMode's
//     // "fake" first mount — they're idempotent and the script must be ready
//     // for the real third mount to succeed.
//     let cancelled = false;

//     async function init() {
//       try {
//         // Step 1: inject the script tag (idempotent)
//         console.log('[AppleMapDisplay] loading mapkit.js...');
//         await loadScript('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js', 'mapkit-script');

//         // Step 2: wait for window.mapkit to be populated (script is async internally)
//         const mapkit = await waitForMapkit(6000);
//         if (!mapkit) { console.error('[AppleMapDisplay] ❌ window.mapkit never appeared'); return; }
//         mkaRef.current = mapkit;
//         console.log('[AppleMapDisplay] mapkit available, _initialized:', !!mapkit._initialized);

//         // Step 3: init is idempotent — safe to call on every mount attempt
//         if (!mapkit._initialized) {
//           mapkit.init({ authorizationCallback: (done) => done(token), language: 'en' });
//           mapkit._initialized = true;
//         }

//         // Step 4: wait for auth/config (add a timeout so we don't hang forever)
//         await new Promise((res) => {
//           if (mapkit.loadedLibraries?.length) { res(); return; }
//           mapkit.addEventListener('configuration-change', () => res(), { once: true });
//           setTimeout(res, 4000); // fallback — proceed anyway
//         });

//         // Step 5: ONLY NOW respect cancellation, right before DOM mutation
//         if (cancelled) {
//           console.log('[AppleMapDisplay] cancelled before Map creation (StrictMode unmount) — real mount will succeed');
//           return;
//         }
//         if (!containerRef.current) {
//           console.error('[AppleMapDisplay] ❌ container ref is gone');
//           return;
//         }

//         console.log('[AppleMapDisplay] creating map...');
//         const spanDeg = zoomToSpan(zoom);
//         const map = new mapkit.Map(containerRef.current, {
//           region: new mapkit.CoordinateRegion(
//             new mapkit.Coordinate(center.lat, center.lng),
//             new mapkit.CoordinateSpan(spanDeg, spanDeg)
//           ),
//           showsCompass:        mapkit.FeatureVisibility.Adaptive,
//           showsZoomControl:    true,
//           showsMapTypeControl: false,
//           mapType:             mapkit.Map.MapTypes.Standard,
//         });

//         mapRef.current = map;

//         containerRef.current.addEventListener('click', (e) => {
//           const rect  = containerRef.current.getBoundingClientRect();
//           const point = new mapkit.DOMPoint(e.clientX - rect.left, e.clientY - rect.top);
//           const coord = map.convertPointOnPageToCoordinate(point);
//           if (coord) onMapClick?.({ lat: coord.latitude, lng: coord.longitude });
//         });

//         console.log('[AppleMapDisplay] ✅ map created — calling onMapLoad');
//         controlsRef.current = buildControls(map, mapkit);
//         onMapLoad?.(controlsRef.current);

//       } catch (err) {
//         console.error('[AppleMapDisplay] ❌ init error:', err?.message, err);
//       }
//     }

//     init();
//     return () => {
//       cancelled = true;
//       mapRef.current?.destroy?.();
//       mapRef.current = null;
//     };
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Markers ────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const map    = mapRef.current;
//     const mapkit = mkaRef.current;
//     if (!map || !mapkit) return;

//     const all = [
//       ...markers,
//       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
//       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
//     ];
//     const ids = new Set(all.map((m) => m.id || m.type));

//     // Remove stale
//     Object.entries(markersRef.current).forEach(([id, annotation]) => {
//       if (!ids.has(id)) { map.removeAnnotation(annotation); delete markersRef.current[id]; }
//     });

//     // Add / update
//     all.forEach((m) => {
//       const id    = m.id || m.type;
//       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;

//       if (markersRef.current[id]) {
//         markersRef.current[id].coordinate =
//           new mapkit.Coordinate(m.lat, m.lng);
//         return;
//       }

//       const annotation = new mapkit.MarkerAnnotation(
//         new mapkit.Coordinate(m.lat, m.lng),
//         {
//           color,
//           title:   m.name || m.type || '',
//           glyphColor: '#fff',
//         }
//       );
//       map.addAnnotation(annotation);
//       markersRef.current[id] = annotation;
//     });
//   }, [markers, pickupLocation, dropoffLocation]);

//   // ── Route (polyline overlay) ───────────────────────────────────────────────
//   useEffect(() => {
//     const map    = mapRef.current;
//     const mapkit = mkaRef.current;
//     if (!map || !mapkit) return;

//     // Remove existing overlay
//     if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }

//     if (!showRoute || !route?.length) return;

//     // route = [[lng, lat], ...]
//     const coords    = route.map(([lng, lat]) => new mapkit.Coordinate(lat, lng));
//     const polyline  = new mapkit.PolylineOverlay(coords, {
//       style: new mapkit.Style({
//         lineWidth:  5,
//         strokeColor: '#3b82f6',
//         strokeOpacity: 1,
//       }),
//     });
//     map.addOverlay(polyline);
//     overlayRef.current = polyline;
//   }, [route, showRoute]);

//   // ── Center ────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const map    = mapRef.current;
//     const mapkit = mkaRef.current;
//     if (!map || !mapkit) return;
//     const spanDeg = zoomToSpan(zoom);
//     map.setRegionAnimated(
//       new mapkit.CoordinateRegion(
//         new mapkit.Coordinate(center.lat, center.lng),
//         new mapkit.CoordinateSpan(spanDeg, spanDeg)
//       )
//     );
//   }, [center.lat, center.lng, zoom]);

//   function buildControls(map, mapkit) {
//     return {
//       animateToLocation(lat, lng, z) {
//         const span = zoomToSpan(z ?? zoom);
//         map.setRegionAnimated(
//           new mapkit.CoordinateRegion(
//             new mapkit.Coordinate(lat, lng),
//             new mapkit.CoordinateSpan(span, span)
//           )
//         );
//       },
//       setZoom(z) {
//         const span = zoomToSpan(z);
//         map.setRegionAnimated(
//           new mapkit.CoordinateRegion(map.center, new mapkit.CoordinateSpan(span, span))
//         );
//       },
//       zoomIn()  { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta / 2, r.span.longitudeDelta / 2))); },
//       zoomOut() { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta * 2, r.span.longitudeDelta * 2))); },
//       enable3DMode()  { /* MapKit doesn't support pitch programmatically in basic API */ },
//       disable3DMode() { /* no-op */ },
//       updateDriverLocation(lat, lng) {
//         const ann = markersRef.current['driver'];
//         if (ann) ann.coordinate = new mapkit.Coordinate(lat, lng);
//       },
//       clearRoute() {
//         if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }
//       },
//       getCurrentLocation(cb) {
//         navigator.geolocation?.getCurrentPosition(
//           (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//           () => cb(null)
//         );
//       },
//     };
//   }

//   return (
//     <div ref={containerRef} style={{ width: width || '100%', height: height || '100%', minHeight: '400px', position: 'relative', background: '#f0f4e8' }} />
//   );
// }

// // Approximate zoom int → lat/lng span degrees
// function zoomToSpan(zoom = 13) {
//   return 360 / Math.pow(2, zoom) * 2;
// }

// // Polls for window.mapkit to appear — the script sets it asynchronously
// function waitForMapkit(timeout = 6000) {
//   return new Promise((resolve) => {
//     if (window.mapkit) { resolve(window.mapkit); return; }
//     const deadline = Date.now() + timeout;
//     const poll = () => {
//       if (window.mapkit) { resolve(window.mapkit); return; }
//       if (Date.now() > deadline) { resolve(null); return; }
//       setTimeout(poll, 50);
//     };
//     poll();
//   });
// }

// function loadScript(src, id) {
//   return new Promise((resolve, reject) => {
//     const existing = document.getElementById(id);
//     if (existing) {
//       // Script tag already in DOM — but window.mapkit may not be ready yet if it's still loading
//       if (window.mapkit) { resolve(); return; }
//       // Wait for it to finish loading
//       existing.addEventListener('load', resolve, { once: true });
//       existing.addEventListener('error', reject, { once: true });
//       // If it already loaded (readyState) just resolve
//       if (existing.readyState === 'complete' || existing.readyState === 'loaded') { resolve(); }
//       return;
//     }
//     const s = document.createElement('script');
//     s.id = id; s.src = src; s.async = true;
//     s.onload = resolve; s.onerror = reject;
//     document.head.appendChild(s);
//   });
// }
// PATH: Okra/Okrarides/rider/components/Map/MapDisplays/AppleMapDisplay.jsx
//
// Apple Maps via MapKit JS.
// Env: NEXT_PUBLIC_APPLE_MAPS_TOKEN  (JWT signed with your MapKit key)
//
// To generate your JWT token see:
// https://developer.apple.com/documentation/mapkitjs/creating_and_using_tokens_with_mapkit_js
//
// Routing opens the Maps app / maps.apple.com via URL scheme.

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

export default function AppleMapDisplay({
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
}) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const mkaRef       = useRef(null);  // mapkit instance
  const markersRef   = useRef({});
  const overlayRef   = useRef(null);
  const controlsRef  = useRef(null);

  const token = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN || '';

  if (!token) {
    return (
      <div style={{ width, height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#475569', fontFamily: 'sans-serif', gap: 8 }}>
        <div style={{ fontSize: 32 }}>🍎</div>
        <div style={{ fontWeight: 600 }}>Apple Maps token missing</div>
        <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 280, color: '#94a3b8' }}>
          Add <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>NEXT_PUBLIC_APPLE_MAPS_TOKEN</code> to your <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>.env.local</code> file and restart the dev server.
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log('[AppleMapDisplay] MOUNT — token present:', !!token, '| container:', !!containerRef.current);
    // `cancelled` is intentionally checked ONLY before creating the Map DOM node.
    // We let script loading and mapkit.init() proceed even on StrictMode's
    // "fake" first mount — they're idempotent and the script must be ready
    // for the real third mount to succeed.
    let cancelled = false;

    async function init() {
      try {
        // Step 1: inject the script tag (idempotent)
        console.log('[AppleMapDisplay] loading mapkit.js...');
        await loadScript('https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js', 'mapkit-script');

        // Step 2: wait for window.mapkit to be populated (script is async internally)
        const mapkit = await waitForMapkit(6000);
        if (!mapkit) { console.error('[AppleMapDisplay] ❌ window.mapkit never appeared'); return; }
        mkaRef.current = mapkit;
        console.log('[AppleMapDisplay] mapkit available, _initialized:', !!mapkit._initialized);

        // Step 3: init is idempotent — safe to call on every mount attempt
        if (!mapkit._initialized) {
          mapkit.init({ authorizationCallback: (done) => done(token), language: 'en' });
          mapkit._initialized = true;
        }

        // Step 4: wait for auth/config (add a timeout so we don't hang forever)
        await new Promise((res) => {
          if (mapkit.loadedLibraries?.length) { res(); return; }
          mapkit.addEventListener('configuration-change', () => res(), { once: true });
          setTimeout(res, 4000); // fallback — proceed anyway
        });

        // Step 5: ONLY NOW respect cancellation, right before DOM mutation
        if (cancelled) {
          console.log('[AppleMapDisplay] cancelled before Map creation (StrictMode unmount) — real mount will succeed');
          return;
        }
        if (!containerRef.current) {
          console.error('[AppleMapDisplay] ❌ container ref is gone');
          return;
        }

        console.log('[AppleMapDisplay] creating map...');
        const spanDeg = zoomToSpan(zoom);
        const map = new mapkit.Map(containerRef.current, {
          region: new mapkit.CoordinateRegion(
            new mapkit.Coordinate(center.lat, center.lng),
            new mapkit.CoordinateSpan(spanDeg, spanDeg)
          ),
          showsCompass:        mapkit.FeatureVisibility.Adaptive,
          showsZoomControl:    true,
          showsMapTypeControl: false,
          mapType:             mapkit.Map.MapTypes.Standard,
        });

        mapRef.current = map;

        containerRef.current.addEventListener('click', (e) => {
          const rect  = containerRef.current.getBoundingClientRect();
          const point = new mapkit.DOMPoint(e.clientX - rect.left, e.clientY - rect.top);
          const coord = map.convertPointOnPageToCoordinate(point);
          if (coord) onMapClick?.({ lat: coord.latitude, lng: coord.longitude });
        });

        console.log('[AppleMapDisplay] ✅ map created — calling onMapLoad');
        controlsRef.current = buildControls(map, mapkit);
        onMapLoad?.(controlsRef.current);

      } catch (err) {
        console.error('[AppleMapDisplay] ❌ init error:', err?.message, err);
      }
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
    const mapkit = mkaRef.current;
    if (!map || !mapkit) return;

    const all = [
      ...markers,
      ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
      ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
    ];
    const ids = new Set(all.map((m) => m.id || m.type));

    // Remove stale
    Object.entries(markersRef.current).forEach(([id, annotation]) => {
      if (!ids.has(id)) { map.removeAnnotation(annotation); delete markersRef.current[id]; }
    });

    // Add / update
    all.forEach((m) => {
      const id    = m.id || m.type;
      const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;

      if (markersRef.current[id]) {
        markersRef.current[id].coordinate =
          new mapkit.Coordinate(m.lat ?? m.latitude, m.lng ?? m.longitude);
        return;
      }

      // Custom tall pin — gives full size control (MapKit MarkerAnnotation
      // does not expose a height/size prop; Annotation with a factory element does).
      const factory = () => {
        const EMOJIS = { pickup:'📍', dropoff:'🎯', driver:'🚗', station:'🏢', current:'📌', default:'📌' };
        const emoji  = EMOJIS[m.type] || EMOJIS.default;
        const wrap   = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;';
        // Pin head
        const head = document.createElement('div');
        head.style.cssText = [
          'width:38px','height:38px','border-radius:50% 50% 50% 4px',
          'transform:rotate(-45deg)',
          `background:${color}`,
          'border:3px solid white',
          'box-shadow:0 4px 12px rgba(0,0,0,0.35)',
          'display:flex','align-items:center','justify-content:center',
        ].join(';');
        const inner = document.createElement('div');
        inner.style.cssText = 'transform:rotate(45deg);font-size:18px;line-height:1;';
        inner.textContent = emoji;
        head.appendChild(inner);
        // Stem
        const stem = document.createElement('div');
        stem.style.cssText = [
          `background:${color}`,
          'width:4px','height:18px',
          'border-radius:0 0 4px 4px',
          'box-shadow:0 2px 4px rgba(0,0,0,0.2)',
        ].join(';');
        wrap.appendChild(head);
        wrap.appendChild(stem);
        return wrap;
      };

      const annotation = new mapkit.Annotation(
        new mapkit.Coordinate(m.lat ?? m.latitude, m.lng ?? m.longitude),
        factory,
        {
          // Anchor at the bottom-tip of the stem
          anchorOffset: new DOMPoint(0, -28),
          title:        m.name || m.type || '',
          data:         { type: m.type },
        }
      );
      map.addAnnotation(annotation);
      markersRef.current[id] = annotation;
    });
  }, [markers, pickupLocation, dropoffLocation]);

  // ── Route (polyline overlay) ───────────────────────────────────────────────
  useEffect(() => {
    const map    = mapRef.current;
    const mapkit = mkaRef.current;
    if (!map || !mapkit) return;

    // Remove existing overlay
    if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }

    if (!showRoute || !route?.length) return;

    // route = [[lng, lat], ...]
    const coords    = route.map(([lng, lat]) => new mapkit.Coordinate(lat, lng));
    const polyline  = new mapkit.PolylineOverlay(coords, {
      style: new mapkit.Style({
        lineWidth:   6,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.9,
        lineCap:     'round',
        lineJoin:    'round',
      }),
    });
    map.addOverlay(polyline);
    overlayRef.current = polyline;

    // Zoom map to fit the full route with padding
    if (route.length >= 2) {
      const lngs = route.map(c => c[0]);
      const lats = route.map(c => c[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const padFactor = 1.35; // ~35% padding around route
      const spanLat = Math.max((maxLat - minLat) * padFactor, 0.01);
      const spanLng = Math.max((maxLng - minLng) * padFactor, 0.01);
      map.setRegionAnimated(
        new mapkit.CoordinateRegion(
          new mapkit.Coordinate((minLat + maxLat) / 2, (minLng + maxLng) / 2),
          new mapkit.CoordinateSpan(spanLat, spanLng)
        ),
        true // animated
      );
    }
  }, [route, showRoute]);

  // ── Center ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map    = mapRef.current;
    const mapkit = mkaRef.current;
    if (!map || !mapkit) return;
    const spanDeg = zoomToSpan(zoom);
    map.setRegionAnimated(
      new mapkit.CoordinateRegion(
        new mapkit.Coordinate(center.lat, center.lng),
        new mapkit.CoordinateSpan(spanDeg, spanDeg)
      )
    );
  }, [center.lat, center.lng, zoom]);

  function buildControls(map, mapkit) {
    return {
      animateToLocation(lat, lng, z) {
        const span = zoomToSpan(z ?? zoom);
        map.setRegionAnimated(
          new mapkit.CoordinateRegion(
            new mapkit.Coordinate(lat, lng),
            new mapkit.CoordinateSpan(span, span)
          )
        );
      },
      setZoom(z) {
        const span = zoomToSpan(z);
        map.setRegionAnimated(
          new mapkit.CoordinateRegion(map.center, new mapkit.CoordinateSpan(span, span))
        );
      },
      zoomIn()  { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta / 2, r.span.longitudeDelta / 2))); },
      zoomOut() { const r = map.region; map.setRegionAnimated(new mapkit.CoordinateRegion(r.center, new mapkit.CoordinateSpan(r.span.latitudeDelta * 2, r.span.longitudeDelta * 2))); },
      enable3DMode()  { /* MapKit doesn't support pitch programmatically in basic API */ },
      disable3DMode() { /* no-op */ },
      updateDriverLocation(lat, lng) {
        const ann = markersRef.current['driver'];
        if (ann) ann.coordinate = new mapkit.Coordinate(lat, lng);
      },
      clearRoute() {
        if (overlayRef.current) { map.removeOverlay(overlayRef.current); overlayRef.current = null; }
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
    <div ref={containerRef} style={{ width: width || '100%', height: height || '100%', minHeight: '400px', position: 'relative', background: '#f0f4e8' }} />
  );
}

// Approximate zoom int → lat/lng span degrees
function zoomToSpan(zoom = 13) {
  return 360 / Math.pow(2, zoom) * 2;
}

// Polls for window.mapkit to appear — the script sets it asynchronously
function waitForMapkit(timeout = 6000) {
  return new Promise((resolve) => {
    if (window.mapkit) { resolve(window.mapkit); return; }
    const deadline = Date.now() + timeout;
    const poll = () => {
      if (window.mapkit) { resolve(window.mapkit); return; }
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
      // Script tag already in DOM — but window.mapkit may not be ready yet if it's still loading
      if (window.mapkit) { resolve(); return; }
      // Wait for it to finish loading
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      // If it already loaded (readyState) just resolve
      if (existing.readyState === 'complete' || existing.readyState === 'loaded') { resolve(); }
      return;
    }
    const s = document.createElement('script');
    s.id = id; s.src = src; s.async = true;
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}