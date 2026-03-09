// // // // PATH: Okra/Okrarides/rider/components/Map/MapDisplays/WazeMapDisplay.jsx
// // // //
// // // // Waze Live Map embedded via iframe.
// // // // Since the Waze iframe is opaque (no postMessage API), markers and route lines
// // // // are rendered on a transparent MapLibre GL overlay that sits on top.
// // // // Routing opens the Waze app/website via deep links.
// // // //
// // // // No API key required for the iframe embed.

// // // 'use client';

// // // import { useEffect, useRef, useState } from 'react';
// // // import maplibregl from 'maplibre-gl';
// // // import 'maplibre-gl/dist/maplibre-gl.css';

// // // const MARKER_COLORS = {
// // //   pickup: '#22c55e', dropoff: '#ef4444', driver: '#3b82f6',
// // //   station: '#6366f1', current: '#3b82f6', default: '#8b5cf6',
// // // };

// // // export default function WazeMapDisplay({
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
// // //   bearing       = 0,
// // //   pitch         = 0,
// // // }) {
// // //   const [iframeCenter, setIframeCenter] = useState(center);
// // //   const [iframeZoom,   setIframeZoom]   = useState(clampZoom(zoom));

// // //   const overlayRef   = useRef(null);
// // //   const mapRef       = useRef(null);
// // //   const markersRef   = useRef({});
// // //   const controlsRef  = useRef(null);
// // //   const syncTimer    = useRef(null);

// // //   // ── Waze iframe URL ────────────────────────────────────────────────────────
// // //   const iframeUrl = buildWazeUrl(iframeCenter, iframeZoom);

// // //   // ── Initialise MapLibre overlay (transparent, pointer-events: none) ────────
// // //   useEffect(() => {
// // //     let cancelled = false;

// // //     function init() {
// // //       if (!overlayRef.current) return;

// // //       // Fully transparent style — just an empty canvas for markers / lines
// // //       const transparentStyle = {
// // //         version: 8,
// // //         sources: {},
// // //         layers:  [],
// // //         glyphs:  'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
// // //       };

// // //       const map = new maplibregl.Map({
// // //         container:          overlayRef.current,
// // //         style:              transparentStyle,
// // //         center:             [center.lng, center.lat],
// // //         zoom:               iframeZoom,
// // //         bearing,
// // //         pitch,
// // //         attributionControl: false,
// // //         interactive:        false, // Let Waze iframe receive mouse events
// // //       });

// // //       mapRef.current = map;

// // //       map.on('load', () => {
// // //         if (cancelled) return;
// // //         // Route layer
// // //         map.addSource('route', { type: 'geojson', data: emptyGeoJSON() });
// // //         map.addLayer({ id: 'route-casing', type: 'line', source: 'route',
// // //           paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': 0.9 } });
// // //         map.addLayer({ id: 'route-line',   type: 'line', source: 'route',
// // //           paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 1 },
// // //           layout: { 'line-join': 'round', 'line-cap': 'round' } });

// // //         controlsRef.current = buildControls(map);
// // //         onMapLoad?.(controlsRef.current);
// // //       });
// // //     }

// // //     init();
// // //     return () => {
// // //       cancelled = true;
// // //       mapRef.current?.remove();
// // //       mapRef.current = null;
// // //     };
// // //   }, []); // eslint-disable-line react-hooks/exhaustive-deps

// // //   // ── Sync overlay with Waze iframe when center changes ─────────────────────
// // //   useEffect(() => {
// // //     mapRef.current?.easeTo({ center: [center.lng, center.lat], duration: 300 });

// // //     clearTimeout(syncTimer.current);
// // //     syncTimer.current = setTimeout(() => {
// // //       setIframeCenter(center);
// // //     }, 800);
// // //   }, [center.lat, center.lng]);

// // //   useEffect(() => {
// // //     setIframeZoom(clampZoom(zoom));
// // //     mapRef.current?.setZoom(zoom);
// // //   }, [zoom]);

// // //   // ── Markers on overlay ────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     const map = mapRef.current;
// // //     if (!map) return;

// // //     const all = [
// // //       ...markers,
// // //       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
// // //       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
// // //     ];
// // //     const ids = new Set(all.map((m) => m.id || m.type));

// // //     Object.keys(markersRef.current).forEach((id) => {
// // //       if (!ids.has(id)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
// // //     });

// // //     all.forEach((m) => {
// // //       const id    = m.id || m.type;
// // //       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;
// // //       if (markersRef.current[id]) {
// // //         markersRef.current[id].setLngLat([m.lng, m.lat]);
// // //         return;
// // //       }
// // //       const el         = document.createElement('div');
// // //       el.style.cssText = `
// // //         width:20px;height:20px;border-radius:50%;
// // //         background:${color};border:2px solid #fff;
// // //         box-shadow:0 2px 8px rgba(0,0,0,.5);
// // //         pointer-events:auto;cursor:pointer;
// // //       `;
// // //       markersRef.current[id] = new maplibregl.Marker({ element: el, anchor: 'center' })
// // //         .setLngLat([m.lng, m.lat])
// // //         .addTo(map);
// // //     });
// // //   }, [markers, pickupLocation, dropoffLocation]);

// // //   // ── Route on overlay ──────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     const map = mapRef.current;
// // //     if (!map || !map.getSource) return;
// // //     if (!showRoute || !route?.length) {
// // //       map.getSource('route')?.setData(emptyGeoJSON());
// // //       return;
// // //     }
// // //     map.getSource('route')?.setData({
// // //       type: 'FeatureCollection',
// // //       features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: route } }],
// // //     });
// // //   }, [route, showRoute]);

// // //   function buildControls(map) {
// // //     return {
// // //       animateToLocation(lat, lng, z) {
// // //         setIframeCenter({ lat, lng });
// // //         if (z) setIframeZoom(clampZoom(z));
// // //         map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 800 });
// // //       },
// // //       setZoom(z) {
// // //         setIframeZoom(clampZoom(z));
// // //         map.setZoom(z);
// // //       },
// // //       zoomIn()  { const z = map.getZoom() + 1; setIframeZoom(clampZoom(z)); map.zoomIn();  },
// // //       zoomOut() { const z = map.getZoom() - 1; setIframeZoom(clampZoom(z)); map.zoomOut(); },
// // //       enable3DMode()  { /* Waze iframe has no tilt control */ },
// // //       disable3DMode() { /* no-op */ },
// // //       updateDriverLocation(lat, lng, heading) {
// // //         const marker = markersRef.current['driver'];
// // //         if (marker) {
// // //           marker.setLngLat([lng, lat]);
// // //           if (heading != null)
// // //             marker.getElement().style.transform = `rotate(${heading}deg)`;
// // //         }
// // //       },
// // //       clearRoute() { map.getSource('route')?.setData(emptyGeoJSON()); },
// // //       getCurrentLocation(cb) {
// // //         navigator.geolocation?.getCurrentPosition(
// // //           (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
// // //           () => cb(null)
// // //         );
// // //       },
// // //     };
// // //   }

// // //   return (
// // //     <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
// // //       {/* Waze Live Map iframe — provides the actual map background */}
// // //       <iframe
// // //         src={iframeUrl}
// // //         title="Waze Live Map"
// // //         style={{
// // //           position: 'absolute', inset: 0,
// // //           width: '100%', height: '100%',
// // //           border: 'none',
// // //         }}
// // //         allowFullScreen
// // //         loading="lazy"
// // //         referrerPolicy="no-referrer-when-downgrade"
// // //       />

// // //       {/* Transparent MapLibre overlay — renders markers & route lines */}
// // //       <div
// // //         ref={overlayRef}
// // //         style={{
// // //           position:       'absolute', inset: 0,
// // //           width:          '100%',     height: '100%',
// // //           pointerEvents:  'none',
// // //           background:     'transparent',
// // //         }}
// // //       />

// // //       {/* "Powered by Waze" attribution (required by Waze guidelines) */}
// // //       <div style={{
// // //         position:   'absolute', bottom: 8, right: 8,
// // //         background: 'rgba(255,255,255,.85)', borderRadius: 6,
// // //         padding:    '3px 8px', fontSize: 11, fontWeight: 600,
// // //         color:      '#08b4e0', pointerEvents: 'none',
// // //         boxShadow:  '0 1px 4px rgba(0,0,0,.2)',
// // //       }}>
// // //         Powered by Waze
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // function clampZoom(z) { return Math.min(17, Math.max(3, Math.round(z))); }

// // // function buildWazeUrl({ lat, lng }, zoom) {
// // //   return `https://embed.waze.com/iframe?lat=${lat}&lon=${lng}&zoom=${zoom}&pin=1`;
// // // }

// // // function emptyGeoJSON() {
// // //   return { type: 'FeatureCollection', features: [] };
// // // }
// // // PATH: Okra/Okrarides/rider/components/Map/MapDisplays/WazeMapDisplay.jsx
// // //
// // // Waze Live Map embedded via iframe.
// // // Markers and route lines are rendered on a transparent MapLibre GL overlay
// // // that sits on top of the iframe.
// // //
// // // KEY FIXES vs previous version:
// // //  1. FOCUS-STEALING: A transparent "cover" div sits above the iframe.
// // //     - Normally: pointerEvents=auto  → cover absorbs clicks, iframe never gets focus
// // //     - On mousedown ON the cover: pointerEvents=none for the drag duration → iframe
// // //       receives pan/zoom gestures
// // //     - On mouseup (caught on window): pointerEvents=auto restored immediately
// // //     This ensures clicks on UI outside the map always reach their target.
// // //
// // //  2. SEARCH BAR: Waze's embed always renders its own search bar (~56px tall).
// // //     We can't remove it cross-origin. Instead we shift the iframe 56px upward
// // //     and clip with overflow:hidden, so only the map tile area is visible.
// // //
// // //  3. STABLE CONTROLS: setIframeCenter/setIframeZoom are stored in refs so the
// // //     controls object returned via onMapLoad never closes over stale state.

// // // 'use client';

// // // import { useEffect, useRef, useState, useCallback } from 'react';
// // // import maplibregl from 'maplibre-gl';
// // // import 'maplibre-gl/dist/maplibre-gl.css';

// // // const WAZE_SEARCHBAR_HEIGHT = 56; // px — clip this many pixels from the top of the embed

// // // const MARKER_COLORS = {
// // //   pickup: '#22c55e', dropoff: '#ef4444', driver: '#3b82f6',
// // //   station: '#6366f1', current: '#3b82f6', default: '#8b5cf6',
// // // };

// // // export default function WazeMapDisplay({
// // //   center        = { lat: -15.4167, lng: 28.2833 },
// // //   zoom          = 13,
// // //   markers       = [],
// // //   pickupLocation,
// // //   dropoffLocation,
// // //   route,
// // //   showRoute     = false,
// // //   onMapLoad,
// // //   height        = '100%',
// // //   width         = '100%',
// // //   bearing       = 0,
// // //   pitch         = 0,
// // // }) {
// // //   const [iframeCenter, setIframeCenter] = useState(center);
// // //   const [iframeZoom,   setIframeZoom]   = useState(clampZoom(zoom));

// // //   // Stable refs so controls closure is never stale
// // //   const iframeCenterRef = useRef(center);
// // //   const iframeZoomRef   = useRef(clampZoom(zoom));

// // //   const setCenter = useCallback((c) => {
// // //     iframeCenterRef.current = c;
// // //     setIframeCenter(c);
// // //   }, []);

// // //   const setZoomVal = useCallback((z) => {
// // //     const clamped = clampZoom(z);
// // //     iframeZoomRef.current = clamped;
// // //     setIframeZoom(clamped);
// // //   }, []);

// // //   const overlayRef  = useRef(null);
// // //   const coverRef    = useRef(null);
// // //   const mapRef      = useRef(null);
// // //   const markersRef  = useRef({});
// // //   const syncTimer   = useRef(null);
// // //   const dragging    = useRef(false);

// // //   // ── Waze iframe URL ────────────────────────────────────────────────────────
// // //   // embed=true reduces some chrome; there is no documented param to hide search.
// // //   const iframeUrl = `https://embed.waze.com/iframe?lat=${iframeCenter.lat}&lon=${iframeCenter.lng}&zoom=${iframeZoom}&pin=1&embed=true`;

// // //   // ── Cover div — pointer-events management ─────────────────────────────────
// // //   const openCover = useCallback(() => {
// // //     if (coverRef.current) coverRef.current.style.pointerEvents = 'none';
// // //     dragging.current = true;
// // //   }, []);

// // //   const closeCover = useCallback(() => {
// // //     if (coverRef.current) coverRef.current.style.pointerEvents = 'auto';
// // //     dragging.current = false;
// // //   }, []);

// // //   // Restore cover on mouseup anywhere on the page
// // //   useEffect(() => {
// // //     const onUp = () => { if (dragging.current) closeCover(); };
// // //     window.addEventListener('mouseup',    onUp);
// // //     window.addEventListener('touchend',   onUp);
// // //     window.addEventListener('touchcancel', onUp);
// // //     return () => {
// // //       window.removeEventListener('mouseup',    onUp);
// // //       window.removeEventListener('touchend',   onUp);
// // //       window.removeEventListener('touchcancel', onUp);
// // //     };
// // //   }, [closeCover]);

// // //   // ── Initialise MapLibre overlay ────────────────────────────────────────────
// // //   useEffect(() => {
// // //     let cancelled = false;
// // //     if (!overlayRef.current) return;

// // //     const map = new maplibregl.Map({
// // //       container:          overlayRef.current,
// // //       style:              { version: 8, sources: {}, layers: [], glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf' },
// // //       center:             [center.lng, center.lat],
// // //       zoom:               iframeZoomRef.current,
// // //       bearing,
// // //       pitch,
// // //       attributionControl: false,
// // //       interactive:        false,
// // //     });

// // //     mapRef.current = map;

// // //     map.on('load', () => {
// // //       if (cancelled) return;

// // //       map.addSource('route', { type: 'geojson', data: emptyGeoJSON() });
// // //       map.addLayer({ id: 'route-casing', type: 'line', source: 'route',
// // //         paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': 0.9 } });
// // //       map.addLayer({ id: 'route-line', type: 'line', source: 'route',
// // //         paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 1 },
// // //         layout: { 'line-join': 'round', 'line-cap': 'round' } });

// // //       // Build controls with stable refs — these never go stale
// // //       const controls = {
// // //         animateToLocation(lat, lng, z) {
// // //           setCenter({ lat, lng });
// // //           if (z != null) setZoomVal(z);
// // //           map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 800 });
// // //         },
// // //         setZoom(z) { setZoomVal(z); map.setZoom(z); },
// // //         zoomIn()   { setZoomVal(map.getZoom() + 1); map.zoomIn();  },
// // //         zoomOut()  { setZoomVal(map.getZoom() - 1); map.zoomOut(); },
// // //         enable3DMode()  { /* Waze iframe has no tilt */ },
// // //         disable3DMode() { /* no-op */ },
// // //         updateDriverLocation(lat, lng, heading) {
// // //           const m = markersRef.current['driver'];
// // //           if (m) {
// // //             m.setLngLat([lng, lat]);
// // //             if (heading != null)
// // //               m.getElement().style.transform = `rotate(${heading}deg)`;
// // //           }
// // //         },
// // //         clearRoute() { map.getSource('route')?.setData(emptyGeoJSON()); },
// // //         getCurrentLocation(cb) {
// // //           navigator.geolocation?.getCurrentPosition(
// // //             (p) => cb({ lat: p.coords.latitude, lng: p.coords.longitude }),
// // //             ()  => cb(null),
// // //           );
// // //         },
// // //       };

// // //       onMapLoad?.(controls);
// // //     });

// // //     return () => {
// // //       cancelled = true;
// // //       mapRef.current?.remove();
// // //       mapRef.current = null;
// // //     };
// // //   }, []); // eslint-disable-line react-hooks/exhaustive-deps

// // //   // ── Sync overlay when center/zoom props change ─────────────────────────────
// // //   useEffect(() => {
// // //     mapRef.current?.easeTo({ center: [center.lng, center.lat], duration: 300 });
// // //     clearTimeout(syncTimer.current);
// // //     syncTimer.current = setTimeout(() => setCenter(center), 800);
// // //   }, [center.lat, center.lng, setCenter]);

// // //   useEffect(() => {
// // //     setZoomVal(zoom);
// // //     mapRef.current?.setZoom(zoom);
// // //   }, [zoom, setZoomVal]);

// // //   // ── Markers on overlay ────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     const map = mapRef.current;
// // //     if (!map) return;

// // //     const all = [
// // //       ...markers,
// // //       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
// // //       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
// // //     ];
// // //     const ids = new Set(all.map((m) => m.id || m.type));

// // //     Object.keys(markersRef.current).forEach((id) => {
// // //       if (!ids.has(id)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
// // //     });

// // //     all.forEach((m) => {
// // //       const id    = m.id || m.type;
// // //       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;
// // //       if (markersRef.current[id]) {
// // //         markersRef.current[id].setLngLat([m.lng, m.lat]);
// // //         return;
// // //       }
// // //       const el = document.createElement('div');
// // //       el.style.cssText = `width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);pointer-events:auto;cursor:pointer;`;
// // //       markersRef.current[id] = new maplibregl.Marker({ element: el, anchor: 'center' })
// // //         .setLngLat([m.lng, m.lat])
// // //         .addTo(map);
// // //     });
// // //   }, [markers, pickupLocation, dropoffLocation]);

// // //   // ── Route on overlay ──────────────────────────────────────────────────────
// // //   useEffect(() => {
// // //     const map = mapRef.current;
// // //     if (!map?.getSource) return;
// // //     map.getSource('route')?.setData(
// // //       showRoute && route?.length
// // //         ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: route } }] }
// // //         : emptyGeoJSON()
// // //     );
// // //   }, [route, showRoute]);

// // //   return (
// // //     <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>

// // //       {/* ── Waze iframe — shifted up to hide built-in search bar ──────────── */}
// // //       {/* The search bar is ~56px tall. We move the iframe up by that amount   */}
// // //       {/* and add the same amount to the height so the map tiles fill the box. */}
// // //       <iframe
// // //         src={iframeUrl}
// // //         title="Waze Live Map"
// // //         style={{
// // //           position: 'absolute',
// // //           top:      -WAZE_SEARCHBAR_HEIGHT,
// // //           left:     0,
// // //           width:    '100%',
// // //           height:   `calc(100% + ${WAZE_SEARCHBAR_HEIGHT}px)`,
// // //           border:   'none',
// // //         }}
// // //         allowFullScreen
// // //         loading="lazy"
// // //         referrerPolicy="no-referrer-when-downgrade"
// // //       />

// // //       {/* ── Transparent MapLibre overlay — markers & route only ───────────── */}
// // //       {/* pointer-events:none — let events fall to the cover div below        */}
// // //       <div
// // //         ref={overlayRef}
// // //         style={{
// // //           position:      'absolute', inset: 0,
// // //           width:         '100%',     height: '100%',
// // //           pointerEvents: 'none',
// // //           background:    'transparent',
// // //           zIndex:        2,
// // //         }}
// // //       />

// // //       {/* ── Cover div — prevents iframe focus-stealing ────────────────────── */}
// // //       {/*                                                                       */}
// // //       {/* Sits between the iframe and the MapLibre overlay (z-index: 1).       */}
// // //       {/* pointerEvents:auto  → swallows events, iframe never gains focus.     */}
// // //       {/* On mousedown: drop to none so Waze receives the drag/pinch.          */}
// // //       {/* On mouseup (window listener): immediately restore to auto.           */}
// // //       <div
// // //         ref={coverRef}
// // //         onMouseDown={openCover}
// // //         onTouchStart={openCover}
// // //         onMouseLeave={closeCover}
// // //         style={{
// // //           position:      'absolute', inset: 0,
// // //           width:         '100%',     height: '100%',
// // //           pointerEvents: 'auto',
// // //           background:    'transparent',
// // //           cursor:        'grab',
// // //           zIndex:        1,
// // //         }}
// // //       />

// // //       {/* Attribution */}
// // //       <div style={{
// // //         position:      'absolute', bottom: 8, right: 8,
// // //         background:    'rgba(255,255,255,.85)', borderRadius: 6,
// // //         padding:       '3px 8px', fontSize: 11, fontWeight: 600,
// // //         color:         '#08b4e0', pointerEvents: 'none',
// // //         boxShadow:     '0 1px 4px rgba(0,0,0,.2)',
// // //         zIndex:        3,
// // //       }}>
// // //         Powered by Waze
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // function clampZoom(z) { return Math.min(17, Math.max(3, Math.round(z))); }
// // // function emptyGeoJSON() { return { type: 'FeatureCollection', features: [] }; }


// // 'use client';

// // import { useEffect, useRef, useState, useCallback } from 'react';
// // import maplibregl from 'maplibre-gl';
// // import 'maplibre-gl/dist/maplibre-gl.css';

// // const MARKER_COLORS = {
// //   pickup: '#22c55e', dropoff: '#ef4444', driver: '#3b82f6',
// //   station: '#6366f1', current: '#3b82f6', default: '#8b5cf6',
// // };

// // export default function WazeMapDisplay({
// //   center        = { lat: -15.4167, lng: 28.2833 },
// //   zoom          = 13,
// //   markers       = [],
// //   pickupLocation,
// //   dropoffLocation,
// //   route,
// //   showRoute     = false,
// //   onMapLoad,
// //   height        = '100%',
// //   width         = '100%',
// //   bearing       = 0,
// //   pitch         = 0,
// // }) {
// //   const [iframeCenter, setIframeCenter] = useState(center);
// //   const [iframeZoom,   setIframeZoom]   = useState(clampZoom(zoom));

// //   const overlayRef  = useRef(null);
// //   const coverRef    = useRef(null);   // transparent click-blocker over the iframe
// //   const mapRef      = useRef(null);
// //   const markersRef  = useRef({});
// //   const controlsRef = useRef(null);
// //   const syncTimer   = useRef(null);
// //   const dragging    = useRef(false);

// //   // ── Waze iframe URL ────────────────────────────────────────────────────────
// //   const iframeUrl = buildWazeUrl(iframeCenter, iframeZoom);

// //   // ── Cover div — pointer-events management ─────────────────────────────────
// //   // Let the iframe receive events while the user is dragging/zooming inside
// //   // the map boundary.  Restore the cover the moment they lift the mouse or
// //   // move outside, so the iframe can never keep focus beyond the interaction.
// //   const openCover  = useCallback(() => {
// //     if (coverRef.current) coverRef.current.style.pointerEvents = 'none';
// //     dragging.current = true;
// //   }, []);

// //   const closeCover = useCallback(() => {
// //     if (coverRef.current) coverRef.current.style.pointerEvents = 'auto';
// //     dragging.current = false;
// //   }, []);

// //   // Global mouseup — always restore cover even if mouse was released outside
// //   useEffect(() => {
// //     const onUp = () => { if (dragging.current) closeCover(); };
// //     window.addEventListener('mouseup',   onUp);
// //     window.addEventListener('touchend',  onUp);
// //     window.addEventListener('touchcancel', onUp);
// //     return () => {
// //       window.removeEventListener('mouseup',   onUp);
// //       window.removeEventListener('touchend',  onUp);
// //       window.removeEventListener('touchcancel', onUp);
// //     };
// //   }, [closeCover]);

// //   // ── Initialise MapLibre overlay (transparent, pointer-events: none) ────────
// //   useEffect(() => {
// //     let cancelled = false;

// //     if (!overlayRef.current) return;

// //     const transparentStyle = {
// //       version: 8,
// //       sources: {},
// //       layers:  [],
// //       glyphs:  'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
// //     };

// //     const map = new maplibregl.Map({
// //       container:          overlayRef.current,
// //       style:              transparentStyle,
// //       center:             [center.lng, center.lat],
// //       zoom:               iframeZoom,
// //       bearing,
// //       pitch,
// //       attributionControl: false,
// //       interactive:        false, // MapLibre overlay is visual-only; Waze iframe handles pan/zoom
// //     });

// //     mapRef.current = map;

// //     map.on('load', () => {
// //       if (cancelled) return;
// //       map.addSource('route', { type: 'geojson', data: emptyGeoJSON() });
// //       map.addLayer({
// //         id: 'route-casing', type: 'line', source: 'route',
// //         paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': 0.9 },
// //       });
// //       map.addLayer({
// //         id: 'route-line', type: 'line', source: 'route',
// //         paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 1 },
// //         layout: { 'line-join': 'round', 'line-cap': 'round' },
// //       });

// //       controlsRef.current = buildControls(map, setIframeCenter, setIframeZoom);
// //       onMapLoad?.(controlsRef.current);
// //     });

// //     return () => {
// //       cancelled = true;
// //       mapRef.current?.remove();
// //       mapRef.current = null;
// //     };
// //   }, []); // eslint-disable-line react-hooks/exhaustive-deps

// //   // ── Sync overlay with Waze iframe when center changes ─────────────────────
// //   useEffect(() => {
// //     mapRef.current?.easeTo({ center: [center.lng, center.lat], duration: 300 });
// //     clearTimeout(syncTimer.current);
// //     syncTimer.current = setTimeout(() => setIframeCenter(center), 800);
// //   }, [center.lat, center.lng]);

// //   useEffect(() => {
// //     setIframeZoom(clampZoom(zoom));
// //     mapRef.current?.setZoom(zoom);
// //   }, [zoom]);

// //   // ── Markers on overlay ────────────────────────────────────────────────────
// //   useEffect(() => {
// //     const map = mapRef.current;
// //     if (!map) return;

// //     const all = [
// //       ...markers,
// //       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
// //       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
// //     ];
// //     const ids = new Set(all.map((m) => m.id || m.type));

// //     Object.keys(markersRef.current).forEach((id) => {
// //       if (!ids.has(id)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
// //     });

// //     all.forEach((m) => {
// //       const id    = m.id || m.type;
// //       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;
// //       if (markersRef.current[id]) {
// //         markersRef.current[id].setLngLat([m.lng, m.lat]);
// //         return;
// //       }
// //       const el         = document.createElement('div');
// //       el.style.cssText = `
// //         width:20px;height:20px;border-radius:50%;
// //         background:${color};border:2px solid #fff;
// //         box-shadow:0 2px 8px rgba(0,0,0,.5);
// //         pointer-events:auto;cursor:pointer;
// //       `;
// //       markersRef.current[id] = new maplibregl.Marker({ element: el, anchor: 'center' })
// //         .setLngLat([m.lng, m.lat])
// //         .addTo(map);
// //     });
// //   }, [markers, pickupLocation, dropoffLocation]);

// //   // ── Route on overlay ──────────────────────────────────────────────────────
// //   useEffect(() => {
// //     const map = mapRef.current;
// //     if (!map?.getSource) return;
// //     if (!showRoute || !route?.length) {
// //       map.getSource('route')?.setData(emptyGeoJSON());
// //       return;
// //     }
// //     map.getSource('route')?.setData({
// //       type: 'FeatureCollection',
// //       features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: route } }],
// //     });
// //   }, [route, showRoute]);

// //   return (
// //     <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>

// //       {/* ── Waze Live Map iframe ─────────────────────────────────────────── */}
// //       <iframe
// //         src={iframeUrl}
// //         title="Waze Live Map"
// //         style={{
// //           position: 'absolute', inset: 0,
// //           width: '100%', height: '100%',
// //           border: 'none',
// //         }}
// //         allowFullScreen
// //         loading="lazy"
// //         referrerPolicy="no-referrer-when-downgrade"
// //       />

// //       {/* ── Transparent MapLibre overlay — markers & route lines ─────────── */}
// //       {/* pointer-events:none — events pass through to the cover div below   */}
// //       <div
// //         ref={overlayRef}
// //         style={{
// //           position:      'absolute', inset: 0,
// //           width:         '100%',     height: '100%',
// //           pointerEvents: 'none',
// //           background:    'transparent',
// //         }}
// //       />

// //       {/* ── Click-blocker cover div ──────────────────────────────────────── */}
// //       {/*                                                                      */}
// //       {/* This is the key fix for iframe focus-stealing.                       */}
// //       {/*                                                                      */}
// //       {/* Sits above the iframe (z-index > iframe, below MapLibre markers).    */}
// //       {/* Normally absorbs all pointer events so the iframe can never gain     */}
// //       {/* focus. On mousedown here we drop to pointerEvents:none for the       */}
// //       {/* duration of the drag so Waze receives the pan/zoom, then immediately */}
// //       {/* restore on mouseup (caught on window).                               */}
// //       <div
// //         ref={coverRef}
// //         onMouseDown={openCover}
// //         onTouchStart={openCover}
// //         onMouseLeave={closeCover}
// //         style={{
// //           position:      'absolute', inset: 0,
// //           width:         '100%',     height: '100%',
// //           pointerEvents: 'auto',     // default: block iframe from receiving events
// //           background:    'transparent',
// //           cursor:        'grab',
// //           zIndex:        1,          // above iframe, below MapLibre marker elements
// //         }}
// //       />

// //       {/* "Powered by Waze" attribution */}
// //       <div style={{
// //         position:      'absolute', bottom: 8, right: 8,
// //         background:    'rgba(255,255,255,.85)', borderRadius: 6,
// //         padding:       '3px 8px', fontSize: 11, fontWeight: 600,
// //         color:         '#08b4e0', pointerEvents: 'none',
// //         boxShadow:     '0 1px 4px rgba(0,0,0,.2)',
// //         zIndex:        2,
// //       }}>
// //         Powered by Waze
// //       </div>
// //     </div>
// //   );
// // }

// // // ── Helpers ────────────────────────────────────────────────────────────────────

// // function clampZoom(z) { return Math.min(17, Math.max(3, Math.round(z))); }

// // function buildWazeUrl({ lat, lng }, zoom) {
// //   // embed=true hides some chrome; no public param to hide Waze's own search bar
// //   return `https://embed.waze.com/iframe?lat=${lat}&lon=${lng}&zoom=${zoom}&pin=1`;
// // }

// // function emptyGeoJSON() {
// //   return { type: 'FeatureCollection', features: [] };
// // }

// // function buildControls(map, setIframeCenter, setIframeZoom) {
// //   return {
// //     animateToLocation(lat, lng, z) {
// //       setIframeCenter({ lat, lng });
// //       if (z) setIframeZoom(clampZoom(z));
// //       map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 800 });
// //     },
// //     setZoom(z) {
// //       setIframeZoom(clampZoom(z));
// //       map.setZoom(z);
// //     },
// //     zoomIn()  { const z = map.getZoom() + 1; setIframeZoom(clampZoom(z)); map.zoomIn();  },
// //     zoomOut() { const z = map.getZoom() - 1; setIframeZoom(clampZoom(z)); map.zoomOut(); },
// //     enable3DMode()  { /* Waze iframe has no tilt control */ },
// //     disable3DMode() { /* no-op */ },
// //     updateDriverLocation(lat, lng, heading) {
// //       // driver marker is managed by the markers useEffect; nothing to do here
// //     },
// //     clearRoute() { map.getSource('route')?.setData(emptyGeoJSON()); },
// //     getCurrentLocation(cb) {
// //       navigator.geolocation?.getCurrentPosition(
// //         (pos) => cb({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
// //         () => cb(null),
// //       );
// //     },
// //   };
// // }
// // PATH: Okra/Okrarides/rider/components/Map/MapDisplays/WazeMapDisplay.jsx
// //
// // Waze Live Map embedded via iframe.
// // Markers and route lines are rendered on a transparent MapLibre GL overlay.
// //
// // SEARCH BAR: Waze's embed always renders its own search bar (~56px tall).
// // It cannot be removed cross-origin via CSS or URL params.
// //
// // Fix: shift the iframe upward by WAZE_SEARCHBAR_HEIGHT and apply
// //   clip-path: inset(WAZE_SEARCHBAR_HEIGHT px 0 0 0)
// //
// // clip-path clips BOTH visual rendering AND pointer events (per CSS spec,
// // supported in Chrome/Firefox/Safari). This means:
// //   - The search bar pixels are invisible
// //   - Clicks in that area pass through to app UI above the map
// //   - The Waze map tiles fill the full container
// //   - No cover div needed — the Waze iframe is fully interactive

// 'use client';

// import { useEffect, useRef, useState, useCallback } from 'react';
// import maplibregl from 'maplibre-gl';
// import 'maplibre-gl/dist/maplibre-gl.css';

// const WAZE_SEARCHBAR_HEIGHT = 56;

// const MARKER_COLORS = {
//   pickup:  '#22c55e',
//   dropoff: '#ef4444',
//   driver:  '#3b82f6',
//   station: '#6366f1',
//   current: '#3b82f6',
//   default: '#8b5cf6',
// };

// export default function WazeMapDisplay({
//   center        = { lat: -15.4167, lng: 28.2833 },
//   zoom          = 13,
//   markers       = [],
//   pickupLocation,
//   dropoffLocation,
//   route,
//   showRoute     = false,
//   onMapLoad,
//   height        = '100%',
//   width         = '100%',
//   bearing       = 0,
//   pitch         = 0,
// }) {
//   const [iframeCenter, setIframeCenter] = useState(center);
//   const [iframeZoom,   setIframeZoom]   = useState(clampZoom(zoom));

//   const iframeZoomRef = useRef(clampZoom(zoom));

//   const setCenter = useCallback((c) => setIframeCenter(c), []);

//   const setZoomVal = useCallback((z) => {
//     const clamped = clampZoom(z);
//     iframeZoomRef.current = clamped;
//     setIframeZoom(clamped);
//   }, []);

//   const overlayRef = useRef(null);
//   const mapRef     = useRef(null);
//   const markersRef = useRef({});
//   const syncTimer  = useRef(null);

//   const iframeUrl = [
//     'https://embed.waze.com/iframe',
//     `?lat=${iframeCenter.lat}`,
//     `&lon=${iframeCenter.lng}`,
//     `&zoom=${iframeZoom}`,
//     '&pin=1',
//   ].join('');

//   // ── Initialise MapLibre overlay ────────────────────────────────────────────
//   useEffect(() => {
//     let cancelled = false;
//     if (!overlayRef.current) return;

//     const map = new maplibregl.Map({
//       container: overlayRef.current,
//       style: {
//         version: 8, sources: {}, layers: [],
//         glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
//       },
//       center:             [center.lng, center.lat],
//       zoom:               iframeZoomRef.current,
//       bearing,
//       pitch,
//       attributionControl: false,
//       interactive:        false,
//     });

//     mapRef.current = map;

//     map.on('load', () => {
//       if (cancelled) return;

//       map.addSource('route', { type: 'geojson', data: emptyGeoJSON() });
//       map.addLayer({
//         id: 'route-casing', type: 'line', source: 'route',
//         paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': 0.9 },
//       });
//       map.addLayer({
//         id: 'route-line', type: 'line', source: 'route',
//         paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 1 },
//         layout: { 'line-join': 'round', 'line-cap': 'round' },
//       });

//       onMapLoad?.({
//         animateToLocation(lat, lng, z) {
//           setCenter({ lat, lng });
//           if (z != null) setZoomVal(z);
//           map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 800 });
//         },
//         setZoom(z)  { setZoomVal(z); map.setZoom(z); },
//         zoomIn()    { setZoomVal(map.getZoom() + 1); map.zoomIn();  },
//         zoomOut()   { setZoomVal(map.getZoom() - 1); map.zoomOut(); },
//         enable3DMode()  { /* Waze iframe has no tilt control */ },
//         disable3DMode() { /* no-op */ },
//         updateDriverLocation(lat, lng, heading) {
//           const m = markersRef.current['driver'];
//           if (!m) return;
//           m.setLngLat([lng, lat]);
//           if (heading != null) m.getElement().style.transform = `rotate(${heading}deg)`;
//         },
//         clearRoute() { map.getSource('route')?.setData(emptyGeoJSON()); },
//         getCurrentLocation(cb) {
//           navigator.geolocation?.getCurrentPosition(
//             (p) => cb({ lat: p.coords.latitude, lng: p.coords.longitude }),
//             ()  => cb(null),
//           );
//         },
//       });
//     });

//     return () => {
//       cancelled = true;
//       mapRef.current?.remove();
//       mapRef.current = null;
//     };
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Sync overlay when center / zoom props change ───────────────────────────
//   useEffect(() => {
//     mapRef.current?.easeTo({ center: [center.lng, center.lat], duration: 300 });
//     clearTimeout(syncTimer.current);
//     syncTimer.current = setTimeout(() => setCenter(center), 800);
//   }, [center.lat, center.lng, setCenter]);

//   useEffect(() => {
//     setZoomVal(zoom);
//     mapRef.current?.setZoom(zoom);
//   }, [zoom, setZoomVal]);

//   // ── Markers ────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map) return;

//     const all = [
//       ...markers,
//       ...(pickupLocation  ? [{ ...pickupLocation,  type: 'pickup'  }] : []),
//       ...(dropoffLocation ? [{ ...dropoffLocation, type: 'dropoff' }] : []),
//     ];
//     const ids = new Set(all.map((m) => m.id || m.type));

//     Object.keys(markersRef.current).forEach((id) => {
//       if (!ids.has(id)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
//     });

//     all.forEach((m) => {
//       const id    = m.id || m.type;
//       const color = MARKER_COLORS[m.type] || MARKER_COLORS.default;
//       if (markersRef.current[id]) {
//         markersRef.current[id].setLngLat([m.lng, m.lat]);
//         return;
//       }
//       const el = document.createElement('div');
//       el.style.cssText = `width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);pointer-events:auto;cursor:pointer;`;
//       markersRef.current[id] = new maplibregl.Marker({ element: el, anchor: 'center' })
//         .setLngLat([m.lng, m.lat])
//         .addTo(map);
//     });
//   }, [markers, pickupLocation, dropoffLocation]);

//   // ── Route ──────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map?.getSource) return;
//     map.getSource('route')?.setData(
//       showRoute && route?.length
//         ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: route } }] }
//         : emptyGeoJSON(),
//     );
//   }, [route, showRoute]);

//   return (
//     <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>

//       {/*
//         Waze iframe — shifted up to hide built-in search bar.

//         clip-path: inset(56px 0 0 0) clips both the VISUAL rendering and the
//         POINTER EVENTS of the top 56px (the search bar), so clicks in that
//         area pass through to whatever is underneath in the app layout.
//         The iframe is positioned -56px from the top and made 56px taller so
//         the map tiles still fill the full container height.
//       */}
//       <iframe
//         src={iframeUrl}
//         title="Waze Live Map"
//         style={{
//           position: 'absolute',
//           top:      -WAZE_SEARCHBAR_HEIGHT,
//           left:     0,
//           width:    '100%',
//           height:   `calc(100% + ${WAZE_SEARCHBAR_HEIGHT}px)`,
//           border:   'none',
//           clipPath: `inset(${WAZE_SEARCHBAR_HEIGHT}px 0 0 0)`,
//         }}
//         allowFullScreen
//         loading="lazy"
//         referrerPolicy="no-referrer-when-downgrade"
//       />

//       {/* Transparent MapLibre overlay — markers & route, pointer-events:none */}
//       <div
//         ref={overlayRef}
//         style={{
//           position:      'absolute', inset: 0,
//           width:         '100%',     height: '100%',
//           pointerEvents: 'none',
//           background:    'transparent',
//           zIndex:        1,
//         }}
//       />

//       {/* Attribution */}
//       <div style={{
//         position:   'absolute', bottom: 8, right: 8,
//         background: 'rgba(255,255,255,.85)', borderRadius: 6,
//         padding:    '3px 8px', fontSize: 11, fontWeight: 600,
//         color:      '#08b4e0', pointerEvents: 'none',
//         boxShadow:  '0 1px 4px rgba(0,0,0,.2)',
//         zIndex:     2,
//       }}>
//         Powered by Waze
//       </div>
//     </div>
//   );
// }

// function clampZoom(z) { return Math.min(17, Math.max(3, Math.round(z))); }
// function emptyGeoJSON() { return { type: 'FeatureCollection', features: [] }; }
// PATH: Okra/Okrarides/rider/components/Map/MapDisplays/WazeMapDisplay.jsx
//
// Waze Live Map embedded via iframe.
// Markers and route lines are rendered on a transparent MapLibre GL overlay.
//
// SEARCH BAR REMOVAL:
//   Waze's embed always renders its own search bar (~56px tall). There is no
//   URL parameter to disable it and CSS cannot reach a cross-origin iframe.
//
//   Fix — clip wrapper technique:
//     • An inner "clip wrapper" div sits at top:56px, height:calc(100%-56px),
//       overflow:hidden.
//     • The iframe inside is nudged top:-56px, height:calc(100%+56px).
//     • overflow:hidden on a positioned container clips BOTH painting AND
//       pointer-event hit-testing of children — including iframes.
//     • Result: the search bar is above the clip boundary → invisible AND
//       unclickable. The map tiles below are fully visible and interactive.
//
//   Note: clip-path does NOT clip pointer events on iframes (browser bug /
//   spec gap), so that approach was wrong.
//
// OVERLAP:
//   The outer container uses position:relative + explicit width/height so it
//   never bleeds into sibling layout. No negative-top escapes.

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const WAZE_SEARCHBAR_HEIGHT = 56; // px — Waze embed's built-in search bar height

const MARKER_COLORS = {
  pickup:  '#22c55e',
  dropoff: '#ef4444',
  driver:  '#3b82f6',
  station: '#6366f1',
  current: '#3b82f6',
  default: '#8b5cf6',
};

export default function WazeMapDisplay({
  center        = { lat: -15.4167, lng: 28.2833 },
  zoom          = 13,
  markers       = [],
  pickupLocation,
  dropoffLocation,
  route,
  showRoute     = false,
  onMapLoad,
  height        = '100%',
  width         = '100%',
  bearing       = 0,
  pitch         = 0,
}) {
  const [iframeCenter, setIframeCenter] = useState(center);
  const [iframeZoom,   setIframeZoom]   = useState(clampZoom(zoom));

  const iframeZoomRef = useRef(clampZoom(zoom));

  const setCenter = useCallback((c) => setIframeCenter(c), []);

  const setZoomVal = useCallback((z) => {
    const clamped = clampZoom(z);
    iframeZoomRef.current = clamped;
    setIframeZoom(clamped);
  }, []);

  const overlayRef = useRef(null);
  const mapRef     = useRef(null);
  const markersRef = useRef({});
  const syncTimer  = useRef(null);

  const iframeUrl = [
    'https://embed.waze.com/iframe',
    `?lat=${iframeCenter.lat}`,
    `&lon=${iframeCenter.lng}`,
    `&zoom=${iframeZoom}`,
    '&pin=1',
  ].join('');

  // ── MapLibre overlay (transparent — markers & route only) ─────────────────
  useEffect(() => {
    let cancelled = false;
    if (!overlayRef.current) return;

    const map = new maplibregl.Map({
      container: overlayRef.current,
      style: {
        version: 8, sources: {}, layers: [],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
      },
      center:             [center.lng, center.lat],
      zoom:               iframeZoomRef.current,
      bearing,
      pitch,
      attributionControl: false,
      interactive:        false, // Waze iframe handles all pan/zoom
    });

    mapRef.current = map;

    map.on('load', () => {
      if (cancelled) return;

      map.addSource('route', { type: 'geojson', data: emptyGeoJSON() });
      map.addLayer({
        id: 'route-casing', type: 'line', source: 'route',
        paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': 0.9 },
      });
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 1 },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      });

      onMapLoad?.({
        animateToLocation(lat, lng, z) {
          setCenter({ lat, lng });
          if (z != null) setZoomVal(z);
          map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 800 });
        },
        setZoom(z)  { setZoomVal(z); map.setZoom(z); },
        zoomIn()    { setZoomVal(map.getZoom() + 1); map.zoomIn();  },
        zoomOut()   { setZoomVal(map.getZoom() - 1); map.zoomOut(); },
        enable3DMode()  { /* Waze iframe has no tilt */ },
        disable3DMode() { /* no-op */ },
        updateDriverLocation(lat, lng, heading) {
          const m = markersRef.current['driver'];
          if (!m) return;
          m.setLngLat([lng, lat]);
          if (heading != null) m.getElement().style.transform = `rotate(${heading}deg)`;
        },
        clearRoute() { map.getSource('route')?.setData(emptyGeoJSON()); },
        getCurrentLocation(cb) {
          navigator.geolocation?.getCurrentPosition(
            (p) => cb({ lat: p.coords.latitude, lng: p.coords.longitude }),
            ()  => cb(null),
          );
        },
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync overlay ───────────────────────────────────────────────────────────
  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], duration: 300 });
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setCenter(center), 800);
  }, [center.lat, center.lng, setCenter]);

  useEffect(() => {
    setZoomVal(zoom);
    mapRef.current?.setZoom(zoom);
  }, [zoom, setZoomVal]);

  // ── Markers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
        return;
      }
      const el = document.createElement('div');
      el.style.cssText = `width:20px;height:20px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);pointer-events:auto;cursor:pointer;`;
      markersRef.current[id] = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
    });
  }, [markers, pickupLocation, dropoffLocation]);

  // ── Route ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource) return;
    map.getSource('route')?.setData(
      showRoute && route?.length
        ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: route } }] }
        : emptyGeoJSON(),
    );
  }, [route, showRoute]);

  return (
    // Outer container — establishes the layout boundary, never bleeds into siblings
    <div style={{ position: 'relative', width, height }}>

      {/*
        ── Clip wrapper ──────────────────────────────────────────────────────
        Sits at top:WAZE_SEARCHBAR_HEIGHT, so it starts BELOW the search bar.
        overflow:hidden clips both painting and pointer events of children,
        including iframes. Anything above this wrapper's top edge is invisible
        AND un-hittable.
      */}
      <div style={{
        position: 'absolute',
        top:      WAZE_SEARCHBAR_HEIGHT,
        left:     0,
        right:    0,
        bottom:   0,
        overflow: 'hidden',
      }}>

        {/*
          Waze iframe — shifted UP by WAZE_SEARCHBAR_HEIGHT so the map tiles
          start at the top of the clip wrapper, and the search bar is hidden
          above the clip boundary.
        */}
        <iframe
          src={iframeUrl}
          title="Waze Live Map"
          style={{
            position: 'absolute',
            top:      -WAZE_SEARCHBAR_HEIGHT,
            left:     0,
            width:    '100%',
            height:   `calc(100% + ${WAZE_SEARCHBAR_HEIGHT}px)`,
            border:   'none',
          }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/*
          MapLibre overlay — markers & route lines only.
          pointer-events:none so all map interactions go straight to the iframe.
          Positioned to match the visible map area (not the hidden search bar).
        */}
        <div
          ref={overlayRef}
          style={{
            position:      'absolute',
            top:           0,
            left:          0,
            width:         '100%',
            height:        '100%',
            pointerEvents: 'none',
            background:    'transparent',
          }}
        />

      </div>

      {/* Attribution — sits in the outer container, above the clip wrapper */}
      <div style={{
        position:   'absolute', bottom: 8, right: 8,
        background: 'rgba(255,255,255,.85)', borderRadius: 6,
        padding:    '3px 8px', fontSize: 11, fontWeight: 600,
        color:      '#08b4e0', pointerEvents: 'none',
        boxShadow:  '0 1px 4px rgba(0,0,0,.2)',
        zIndex:     1,
      }}>
        Powered by Waze
      </div>

    </div>
  );
}

function clampZoom(z) { return Math.min(17, Math.max(3, Math.round(z))); }
function emptyGeoJSON() { return { type: 'FeatureCollection', features: [] }; }