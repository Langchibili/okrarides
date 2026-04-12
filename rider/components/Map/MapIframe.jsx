// // //Okrarides\rider\components\Map\MapIframe.jsx
// // 'use client';

// // import {
// //   useEffect, useRef, useState, useCallback,
// //   Suspense, lazy, Component, memo, useMemo,
// // } from 'react';
// // import { Box, CircularProgress, Typography } from '@mui/material';

// // // ── Safe context read (works even if MapIframe is used outside MapsProvider) ──
// // let useMapProviderHook = null;
// // try {
// //   const mod = require('../APIProviders/MapsProvider');
// //   useMapProviderHook = mod.useMapProvider;
// // } catch (e) {
// //   console.warn('[MapIframe] Could not load MapsProvider:', e?.message);
// // }

// // function useSafeMapProvider() {
// //   try { if (useMapProviderHook) return useMapProviderHook(); } catch {}
// //   return null;
// // }

// // // ── Native display components (lazy-loaded, no SSR) ──────────────────────────
// // const YandexMapDisplay = lazy(() => import('../APIProviders/MapDisplays/YandexMapDisplay'));
// // const GoogleMapDisplay = lazy(() => import('../APIProviders/MapDisplays/GoogleMapDisplay'));
// // const AppleMapDisplay  = lazy(() => import('../APIProviders/MapDisplays/AppleMapDisplay'));
// // const LocalMapDisplay  = lazy(() => import('../APIProviders/MapDisplays/LocalMapDisplay'));
// // const WazeMapModal     = lazy(() => import('../APIProviders/MapDisplays/WazeMapModal'));

// // const NATIVE_COMPONENTS = {
// //   yandexmap: YandexMapDisplay,
// //   googlemap:  GoogleMapDisplay,
// //   applemap:   AppleMapDisplay,
// //   localmap:   LocalMapDisplay,
// // };

// // // ── Error boundary ────────────────────────────────────────────────────────────
// // class NativeMapErrorBoundary extends Component {
// //   constructor(props) { super(props); this.state = { crashed: false, error: null }; }
// //   static getDerivedStateFromError(err) { return { crashed: true, error: err }; }
// //   componentDidCatch(err, info) {
// //     console.error('[MapIframe] ❌ NATIVE MAP CRASHED — falling back to iframe');
// //     console.error('[MapIframe] Error:', err?.message, err);
// //     console.error('[MapIframe] Component stack:', info?.componentStack);
// //   }
// //   render() {
// //     if (this.state.crashed) {
// //       console.warn('[MapIframe] Rendering iframe fallback after crash:', this.state.error?.message);
// //       return <IframeMap {...this.props.fallbackProps} />;
// //     }
// //     return this.props.children;
// //   }
// // }

// // // ── generateIframeContent — defined OUTSIDE IframeMap so it never changes ────
// // function generateIframeContent({ mapId, center, zoom, localMapServerUrl }) {
// //   return `<!DOCTYPE html>
// // <html>
// // <head>
// //   <meta charset="utf-8">
// //   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
// //   <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet">
// //   <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
// //   <style>
// //     * { margin: 0; padding: 0; box-sizing: border-box; }
// //     html, body, #map { width: 100%; height: 100%; overflow: hidden; }
// //     .maplibregl-ctrl-logo { display: none !important; }
// //     .custom-marker { cursor: pointer; }
// //     @keyframes pulse {
// //       0%   { box-shadow: 0 0 0 0   rgba(59,130,246,0.7); }
// //       70%  { box-shadow: 0 0 0 12px rgba(59,130,246,0);   }
// //       100% { box-shadow: 0 0 0 0   rgba(59,130,246,0);   }
// //     }
// //     .current-location-dot {
// //       width: 18px; height: 18px;
// //       background: #3b82f6; border: 3px solid white;
// //       border-radius: 50%; animation: pulse 2s infinite;
// //       box-shadow: 0 2px 6px rgba(0,0,0,0.4);
// //     }
// //   </style>
// // </head>
// // <body>
// // <div id="map"></div>
// // <script>
// // (function() {
// //   const mapId = '${mapId}';
// //   const LOCAL_SERVER = '${localMapServerUrl}';

// //   // ── Module-level state ─────────────────────────────────────────────────────
// //   let map, markers = {}, driverMarker = null, driverMarkerConfig = null, routeLoaded = false;
// //   let is3DMode = false, mapReady = false;

// //   const OPENFREE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// //   function buildFallbackStyle() {
// //     const tileUrl = LOCAL_SERVER
// //       ? [LOCAL_SERVER + '/tiles/{z}/{x}/{y}.png']
// //       : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
// //     return {
// //       version: 8,
// //       sources: { raster: { type: 'raster', tiles: tileUrl, tileSize: 256, attribution: '© OpenStreetMap' } },
// //       layers:  [{ id: 'raster', type: 'raster', source: 'raster' }],
// //     };
// //   }

// //   function sendMessage(type, data = {}) { window.parent.postMessage({ type, mapId, ...data }, '*'); }

// //   // ── createMarkerEl — accepts optional custom config object ─────────────────
// //   // If custom is provided it overrides the type preset entirely.
// //   // custom shape: { bg: string, label: string, size: number, isPulse?: bool }
// //   function createMarkerEl(type, custom) {
// //     const configs = {
// //       pickup:  { bg: '#22c55e', label: '📍', size: 36 },
// //       dropoff: { bg: '#ef4444', label: '🎯', size: 36 },
// //       driver:  { bg: '#1d4ed8', label: '🚗', size: 42 },
// //       station: { bg: '#3b82f6', label: '🏢', size: 32 },
// //       current: { bg: '#3b82f6', label: null,  size: 18, isPulse: true },
// //       default: { bg: '#6366f1', label: '📌', size: 32 },
// //     };
// //     // custom overrides the preset entirely if provided
// //     const cfg = custom ?? configs[type] ?? configs.default;
// //     const el  = document.createElement('div');
// //     el.className = 'custom-marker';
// //     if (cfg.isPulse) {
// //       el.innerHTML = '<div class="current-location-dot"></div>';
// //     } else {
// //       el.style.cssText = [
// //         'display:flex','align-items:center','justify-content:center',
// //         'border-radius:50%','border:3px solid white',
// //         'box-shadow:0 3px 10px rgba(0,0,0,0.4)',
// //         'cursor:pointer','user-select:none','transition:transform 0.15s ease',
// //         \`background:\${cfg.bg}\`,\`width:\${cfg.size}px\`,\`height:\${cfg.size}px\`,
// //         \`font-size:\${cfg.size * 0.45}px\`,
// //       ].join(';');
// //       el.textContent = cfg.label;
// //       el.onmouseenter = () => (el.style.transform = 'scale(1.2)');
// //       el.onmouseleave = () => (el.style.transform = 'scale(1)');
// //     }
// //     return el;
// //   }

// //   let routeFailures = 0;
// //   const ROUTE_MAX_FAILURES = 5;
// //   let lastRouteKey = null;

// //   // ── renderRouteCoords — fitBounds ONLY on first draw, never on updates ─────
// //   function renderRouteCoords(coords, distanceKm, durationMin) {
// //     if (!coords || coords.length < 2) return;
// //     const geojson = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
// //     if (map.getSource('route')) {
// //       // Route already exists — update data only, NO fitBounds
// //       // (prevents zoom-in / re-centering on every location poll)
// //       map.getSource('route').setData(geojson);
// //     } else {
// //       // First draw — add source + layers + fitBounds
// //       map.addSource('route', { type: 'geojson', data: geojson });
// //       map.addLayer({ id: 'route-casing', type: 'line', source: 'route',
// //         layout: { 'line-join': 'round', 'line-cap': 'round' },
// //         paint:  { 'line-color': '#1e40af', 'line-width': 10, 'line-opacity': 0.4 } });
// //       map.addLayer({ id: 'route-line', type: 'line', source: 'route',
// //         layout: { 'line-join': 'round', 'line-cap': 'round' },
// //         paint:  { 'line-color': '#3b82f6', 'line-width': 5,  'line-opacity': 0.9 } });
// //       routeLoaded = true;
// //       // fitBounds only here — never on subsequent route updates
// //       const lngs = coords.map(c => c[0]), lats = coords.map(c => c[1]);
// //       map.fitBounds(
// //         [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
// //         { padding: { top: 80, bottom: 220, left: 80, right: 80 }, duration: 800 }
// //       );
// //     }
// //     const distStr = distanceKm != null ? (distanceKm >= 1 ? distanceKm.toFixed(1) + ' km' : Math.round(distanceKm * 1000) + ' m') : 'N/A';
// //     const durStr  = durationMin != null ? (durationMin >= 60 ? Math.floor(durationMin/60) + 'h ' + Math.round(durationMin%60) + 'min' : Math.round(durationMin) + ' min') : 'N/A';
// //     sendMessage('ROUTE_CALCULATED', {
// //       distance: distStr, duration: durStr,
// //       distanceValue: distanceKm != null ? Math.round(distanceKm * 1000) : 0,
// //       durationValue: durationMin != null ? Math.round(durationMin * 60) : 0,
// //     });
// //   }

// //   function haversineKm(lat1, lon1, lat2, lon2) {
// //     const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
// //     const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
// //     return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
// //   }

// //   async function drawRoute(pickup, dropoff) {
// //     const routeKey = pickup.lat + ',' + pickup.lng + '->' + dropoff.lat + ',' + dropoff.lng;
// //     if (routeKey === lastRouteKey) return;
// //     lastRouteKey = routeKey;

// //     if (LOCAL_SERVER && routeFailures < ROUTE_MAX_FAILURES) {
// //       try {
// //         const url = LOCAL_SERVER + '/api/route?origin=' + pickup.lat + ',' + pickup.lng +
// //                     '&destination=' + dropoff.lat + ',' + dropoff.lng;
// //         const res = await fetch(url);
// //         if (!res.ok) throw new Error('Local route API ' + res.status);
// //         const data = await res.json();
// //         routeFailures = 0;
// //         renderRouteCoords(data.geometry || [], (data.distanceValue || 0) / 1000, (data.durationValue || 0) / 60);
// //         return;
// //       } catch(err) {
// //         routeFailures++;
// //         if (routeFailures >= ROUTE_MAX_FAILURES) {
// //           console.error('[MapIframe] Local route failed ' + ROUTE_MAX_FAILURES + ' times — circuit open.');
// //         } else {
// //           console.warn('[MapIframe] Local route error (' + routeFailures + '/' + ROUTE_MAX_FAILURES + '):', err.message);
// //         }
// //         lastRouteKey = null;
// //       }
// //     }

// //     try {
// //       const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' +
// //         pickup.lng + ',' + pickup.lat + ';' +
// //         dropoff.lng + ',' + dropoff.lat +
// //         '?overview=full&geometries=geojson';
// //       const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(8000) });
// //       if (!res.ok) throw new Error('OSRM ' + res.status);
// //       const data = await res.json();
// //       const route = data.routes?.[0];
// //       if (!route) throw new Error('No OSRM route');
// //       renderRouteCoords(route.geometry?.coordinates || [], route.distance / 1000, route.duration / 60);
// //       return;
// //     } catch(err) {
// //       console.warn('[MapIframe] Public OSRM failed, using straight-line:', err.message);
// //     }

// //     const dist = haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
// //     renderRouteCoords([[pickup.lng, pickup.lat], [dropoff.lng, dropoff.lat]], dist, null);
// //   }

// //   function clearRoute() {
// //     if (map && map.getLayer('route-line'))   map.removeLayer('route-line');
// //     if (map && map.getLayer('route-casing')) map.removeLayer('route-casing');
// //     if (map && map.getSource('route'))       map.removeSource('route');
// //     routeLoaded = false;
// //     lastRouteKey = null; // allow route to redraw after clear
// //   }

// //   let ipLocationSet = false;
// //   async function getIPLocation() {
// //     if (LOCAL_SERVER) {
// //       try {
// //         const r = await fetch(LOCAL_SERVER + '/api/ip-location');
// //         if (r.ok) { const d = await r.json(); if (d.latitude && d.longitude) return [d.longitude, d.latitude]; }
// //       } catch {}
// //     }
// //     try {
// //       const r = await fetch('https://ipapi.co/json/');
// //       if (r.ok) { const d = await r.json(); if (d.latitude && d.longitude) return [d.longitude, d.latitude]; }
// //     } catch {}
// //     return [${center.lng}, ${center.lat}];
// //   }

// //   async function nominatimSearch(query) {
// //     try {
// //       const r = await fetch(
// //         'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) +
// //         '&format=json&limit=7&addressdetails=1',
// //         { headers: { 'Accept-Language': 'en' } }
// //       );
// //       if (!r.ok) return [];
// //       const data = await r.json();
// //       return data.map(item => ({
// //         place_id:       item.place_id?.toString(),
// //         main_text:      item.name || item.display_name?.split(',')[0],
// //         secondary_text: item.display_name,
// //         lat:            parseFloat(item.lat),
// //         lng:            parseFloat(item.lon),
// //         address:        item.display_name,
// //         name:           item.name || item.display_name?.split(',')[0],
// //       }));
// //     } catch { return []; }
// //   }

// //   async function initMap() {
// //     const initialCenter = await getIPLocation();
// //     ipLocationSet = true;
// //     let mapStyle = OPENFREE_STYLE;
// //     try {
// //       const test = await fetch('https://tiles.openfreemap.org/styles/liberty', {
// //         method: 'HEAD', signal: AbortSignal.timeout(4000),
// //       });
// //       if (!test.ok) throw new Error();
// //     } catch { mapStyle = buildFallbackStyle(); }

// //     map = new maplibregl.Map({
// //       container: 'map', style: mapStyle, center: initialCenter,
// //       zoom: ${zoom}, maxZoom: 22, minZoom: 2, pitch: 0, bearing: 0,
// //       attributionControl: false,
// //     });

// //     map.on('error', () => {
// //       if (!map._fallbackApplied) {
// //         map._fallbackApplied = true;
// //         try { map.setStyle(buildFallbackStyle()); } catch {}
// //       }
// //     });

// //     map.on('load', async () => {
// //       mapReady = true;
// //       if (navigator.geolocation) {
// //         navigator.geolocation.getCurrentPosition((pos) => {
// //           const loc = [pos.coords.longitude, pos.coords.latitude];
// //           if (ipLocationSet) map.flyTo({ center: loc, zoom: 15, duration: 1200 });
// //           if (markers['current-location']) markers['current-location'].remove();
// //           const el = createMarkerEl('current');
// //           markers['current-location'] = new maplibregl.Marker({ element: el }).setLngLat(loc).addTo(map);
// //         }, () => {});
// //       }
// //       sendMessage('MAP_LOADED');
// //     });

// //     map.on('click', (e) => {
// //       sendMessage('MAP_CLICKED', { location: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
// //     });
// //   }

// //   window.addEventListener('message', async (event) => {
// //     const { type, mapId: rid, ...data } = event.data || {};
// //     if (rid !== mapId) return;

// //     switch (type) {

// //       // ── UPDATE_MARKERS — passes md.custom through to createMarkerEl ──────
// //       case 'UPDATE_MARKERS': {
// //         Object.entries(markers).forEach(([id, m]) => {
// //           if (id !== 'current-location') { m.remove(); delete markers[id]; }
// //         });
// //         (data.markers || []).forEach(md => {
// //           if (!md.position) return;
// //           const el = createMarkerEl(md.type || 'default', md.custom ?? null);
// //           markers[md.id] = new maplibregl.Marker({ element: el })
// //             .setLngLat([
// //               md.position.lng || md.position.longitude,
// //               md.position.lat || md.position.latitude,
// //             ])
// //             .addTo(map);
// //         });
// //         break;
// //       }

// //       // ── CONFIGURE_DRIVER_MARKER ───────────────────────────────────────────
// //       // Call once after onMapLoad to set the driver marker's icon.
// //       // If the driver marker already exists, it is recreated with the new config.
// //       case 'CONFIGURE_DRIVER_MARKER': {
// //         driverMarkerConfig = data.config ?? null;
// //         if (driverMarker) {
// //           const lngLat = driverMarker.getLngLat();
// //           driverMarker.remove();
// //           const el = createMarkerEl('driver', driverMarkerConfig);
// //           driverMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
// //             .setLngLat(lngLat).addTo(map);
// //         }
// //         break;
// //       }

// //       // ── UPDATE_DRIVER_LOCATION ────────────────────────────────────────────
// //       // Moves one persistent driverMarker — no remove/re-add, no ghost trail.
// //       case 'UPDATE_DRIVER_LOCATION': {
// //         const loc = data.location; if (!loc) break;
// //         const lngLat = [loc.lng || loc.longitude, loc.lat || loc.latitude];
// //         if (driverMarker) {
// //           // Just reposition — no re-creation, so no ghost pins left behind
// //           driverMarker.setLngLat(lngLat);
// //         } else {
// //           // First appearance — create using driverMarkerConfig if set
// //           const el = createMarkerEl('driver', driverMarkerConfig);
// //           driverMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
// //             .setLngLat(lngLat).addTo(map);
// //         }
// //         if (loc.heading != null) {
// //           driverMarker.getElement().style.transform = 'rotate(' + loc.heading + 'deg)';
// //           if (is3DMode) map.rotateTo(loc.heading, { duration: 500 });
// //         }
// //         break;
// //       }

// //       case 'DRAW_ROUTE':
// //         if (!mapReady) { setTimeout(() => drawRoute(data.pickup, data.dropoff), 500); break; }
// //         drawRoute(data.pickup, data.dropoff); break;

// //       case 'CLEAR_ROUTE': clearRoute(); break;

// //       case 'ANIMATE_TO_LOCATION': {
// //         const loc = data.location; if (!loc || !map) break;
// //         map.flyTo({ center: [loc.lng || loc.longitude, loc.lat || loc.latitude], zoom: data.zoom || map.getZoom(), duration: 800 });
// //         break;
// //       }
// //       case 'SET_ZOOM':    if (map) map.setZoom(data.zoom); break;
// //       case 'ZOOM_IN':     if (map) map.setZoom(map.getZoom() + 1); break;
// //       case 'ZOOM_OUT':    if (map) map.setZoom(map.getZoom() - 1); break;
// //       case 'ENABLE_3D_MODE':  is3DMode = true;  map.easeTo({ pitch: 60, bearing: data.bearing || 0, duration: 800 }); break;
// //       case 'DISABLE_3D_MODE': is3DMode = false; map.easeTo({ pitch: 0,  bearing: 0, duration: 600 }); break;

// //       case 'GET_CURRENT_LOCATION':
// //         navigator.geolocation?.getCurrentPosition(
// //           (pos) => {
// //             const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
// //             sendMessage('CURRENT_LOCATION_RESPONSE', { messageId: data.messageId, location: loc });
// //             const lngLat = [loc.lng, loc.lat];
// //             if (markers['current-location']) {
// //               markers['current-location'].setLngLat(lngLat);
// //             } else {
// //               const el = createMarkerEl('current');
// //               markers['current-location'] = new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
// //             }
// //           },
// //           () => sendMessage('CURRENT_LOCATION_RESPONSE', { messageId: data.messageId, location: null })
// //         );
// //         break;

// //       case 'SEARCH_LOCATION': {
// //         const results = await nominatimSearch(data.query);
// //         sendMessage('SEARCH_RESULTS', { messageId: data.messageId, results });
// //         break;
// //       }

// //       case 'GET_PLACE_DETAILS': {
// //         try {
// //           const r = await fetch(
// //             'https://nominatim.openstreetmap.org/lookup?osm_ids=N' + data.placeId + '&format=json'
// //           );
// //           if (r.ok) {
// //             const d = await r.json();
// //             if (d?.length > 0) {
// //               const item = d[0];
// //               sendMessage('PLACE_DETAILS', {
// //                 messageId: data.messageId,
// //                 location: {
// //                   lat:      parseFloat(item.lat),
// //                   lng:      parseFloat(item.lon),
// //                   address:  item.display_name,
// //                   name:     item.display_name?.split(',')[0],
// //                   place_id: data.placeId,
// //                 },
// //               });
// //               break;
// //             }
// //           }
// //         } catch {}
// //         sendMessage('PLACE_DETAILS', { messageId: data.messageId, location: null });
// //         break;
// //       }
// //     }
// //   });

// //   if (document.readyState === 'loading') {
// //     document.addEventListener('DOMContentLoaded', initMap);
// //   } else {
// //     initMap();
// //   }
// // })();
// // </script>
// // </body>
// // </html>`;
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // MAIN EXPORT
// // // ─────────────────────────────────────────────────────────────────────────────
// // export function MapIframe(props) {
// //   const mapsProvider   = useSafeMapProvider();
// //   const ready          = mapsProvider?.ready ?? true; // no provider = use OSM iframe directly
// //   const prioritizedMap = (ready ? mapsProvider?.prioritizedMap : null) || 'openstreetmap';

// //   const [wazeModalOpen, setWazeModalOpen] = useState(false);

// //   useEffect(() => {
// //     if (ready && prioritizedMap === 'wazemap') setWazeModalOpen(true);
// //   }, [ready, prioritizedMap]);

// //   const NativeComponent = NATIVE_COMPONENTS[prioritizedMap];

// //   const { height: _h = '100%', width: _w = '100%' } = props;
// //   const wrapSx = { position: 'relative', width: _w, height: _h, overflow: 'hidden' };

// //   if (!ready) {
// //     return <Box sx={wrapSx}><MapLoading /></Box>;
// //   }

// //   if (prioritizedMap === 'wazemap') {
// //     return (
// //       <Box sx={wrapSx}>
// //         <IframeMap {...props} />
// //         {!wazeModalOpen && (
// //           <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1300 }}>
// //             <Box
// //               component="button"
// //               onClick={() => setWazeModalOpen(true)}
// //               sx={{
// //                 display: 'flex', alignItems: 'center', gap: 1,
// //                 px: 2, py: 1, bgcolor: '#08b4e0', color: '#fff',
// //                 border: 'none', borderRadius: 3, fontWeight: 700, fontSize: 14,
// //                 cursor: 'pointer', boxShadow: '0 4px 16px rgba(8,180,224,0.45)',
// //                 '&:hover': { bgcolor: '#0696bc' },
// //               }}
// //             >
// //               🚗 Open Waze Map
// //             </Box>
// //           </Box>
// //         )}
// //         <Suspense fallback={null}>
// //           <WazeMapModal
// //             open={wazeModalOpen}
// //             onClose={() => setWazeModalOpen(false)}
// //             onLocationSelected={(location, type) => {
// //               props.onMapClick?.(location);
// //               props.onWazeLocationSelected?.(location, type);
// //             }}
// //             initialCenter={props.center || { lat: -15.4167, lng: 28.2833 }}
// //             pickupLocation={props.pickupLocation}
// //             dropoffLocation={props.dropoffLocation}
// //             countryCode={props.countryCode}
// //           />
// //         </Suspense>
// //       </Box>
// //     );
// //   }

// //   if (NativeComponent) {
// //     return (
// //       <Box sx={wrapSx}>
// //         <NativeMapErrorBoundary fallbackProps={props}>
// //           <Suspense fallback={<MapLoading />}>
// //             <NativeMapWrapper
// //               NativeComponent={NativeComponent}
// //               prioritizedMap={prioritizedMap}
// //               {...props}
// //             />
// //           </Suspense>
// //         </NativeMapErrorBoundary>
// //       </Box>
// //     );
// //   }

// //   if (prioritizedMap === 'geoapify') {
// //     return <Box sx={wrapSx}><IframeMap {...props} /></Box>;
// //   }

// //   return <Box sx={wrapSx}><IframeMap {...props} /></Box>;
// // }

// // MapIframe.displayName = 'MapIframe';
// // export default MapIframe;

// // // ─────────────────────────────────────────────────────────────────────────────
// // // NativeMapWrapper
// // // ─────────────────────────────────────────────────────────────────────────────
// // function NativeMapWrapper({
// //   NativeComponent,
// //   prioritizedMap,
// //   center,
// //   zoom,
// //   markers,
// //   pickupLocation,
// //   dropoffLocation,
// //   onRouteCalculated,
// //   onMapClick,
// //   onMapLoad,
// //   showRoute,
// //   height,
// //   width,
// // }) {
// //   const mapsProvider = useSafeMapProvider();
// //   const controlsRef  = useRef(null);
// //   const [route, setRoute] = useState(null);

// //   useEffect(() => {
// //     if (!pickupLocation || !dropoffLocation) { setRoute(null); return; }
// //     let cancelled = false;

// //     async function fetchRoute() {
// //       if (mapsProvider?.getRoute) {
// //         const result = await mapsProvider.getRoute(pickupLocation, dropoffLocation);
// //         if (cancelled) return;
// //         if (result?.type === 'deeplink') {
// //           onRouteCalculated?.({ distance: 'N/A', duration: 'N/A', distanceValue: 0, durationValue: 0, viaApp: prioritizedMap });
// //         } else if (result?.geometry) {
// //           setRoute(result.geometry);
// //           onRouteCalculated?.({ distance: result.distance, duration: result.duration, distanceValue: result.distanceValue, durationValue: result.durationValue });
// //         }
// //       } else {
// //         const dist = haversine(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
// //         onRouteCalculated?.({ distance: `${dist.toFixed(1)} km`, duration: 'N/A', distanceValue: Math.round(dist * 1000), durationValue: 0 });
// //       }
// //     }

// //     fetchRoute();
// //     return () => { cancelled = true; };
// //   }, [pickupLocation?.lat, pickupLocation?.lng, dropoffLocation?.lat, dropoffLocation?.lng]); // eslint-disable-line

// //   const handleNativeMapLoad = useCallback((nativeControls) => {
// //     controlsRef.current = nativeControls;

// //     const controls = {
// //       animateToLocation:     (loc, z)  => nativeControls?.animateToLocation?.(loc.lat ?? loc.latitude, loc.lng ?? loc.longitude, z),
// //       setZoom:               (z)       => nativeControls?.setZoom?.(z),
// //       zoomIn:                ()        => nativeControls?.zoomIn?.(),
// //       zoomOut:               ()        => nativeControls?.zoomOut?.(),
// //       enable3DMode:          (b)       => nativeControls?.enable3DMode?.(b),
// //       disable3DMode:         ()        => nativeControls?.disable3DMode?.(),
// //       clearRoute:            ()        => { setRoute(null); nativeControls?.clearRoute?.(); },
// //       toggleTraffic:         ()        => {},
// //       configureDriverMarker: ()        => {}, // no-op for native — handled natively
// //       updateDriverLocation:  (loc)     => nativeControls?.updateDriverLocation?.(loc.lat ?? loc.latitude, loc.lng ?? loc.longitude, loc.heading),
// //       getCurrentLocation:    (cb)      => nativeControls?.getCurrentLocation?.(cb),
// //       searchLocation: (query, cb) => {
// //         if (mapsProvider?.searchPlaces) {
// //           mapsProvider.searchPlaces(query).then(r => cb(r || [])).catch(() => cb([]));
// //         } else { cb([]); }
// //       },
// //       getPlaceDetails: (placeId, cb) => {
// //         if (mapsProvider?.getPlaceDetails) {
// //           mapsProvider.getPlaceDetails(placeId).then(r => cb(r)).catch(() => cb(null));
// //         } else { cb(null); }
// //       },
// //     };

// //     onMapLoad?.(controls);
// //   }, [onMapLoad, mapsProvider]);

// //   const resolvedHeight = height || '100%';
// //   const resolvedWidth  = width  || '100%';

// //   return (
// //     <div style={{ width: resolvedWidth, height: resolvedHeight, position: 'relative', minHeight: resolvedHeight === '100%' ? '400px' : undefined }}>
// //       <NativeComponent
// //         center={center} zoom={zoom} markers={markers}
// //         pickupLocation={pickupLocation} dropoffLocation={dropoffLocation}
// //         route={route} showRoute={!!(showRoute && route?.length)}
// //         onMapClick={onMapClick} onMapLoad={handleNativeMapLoad}
// //         height="100%" width="100%"
// //       />
// //     </div>
// //   );
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // IframeMap — srcDoc memoized on mount, never recreated on re-render
// // // ─────────────────────────────────────────────────────────────────────────────
// // const IframeMap = memo(({
// //   center         = { lat: -15.4167, lng: 28.2833 },
// //   zoom           = 13,
// //   markers        = [],
// //   pickupLocation = null,
// //   dropoffLocation= null,
// //   onRouteCalculated,
// //   onMapClick,
// //   onMapLoad,
// //   showTraffic    = false,
// //   showRoute      = false,
// //   height         = '100%',
// //   width          = '100%',
// // }) => {
// //   const iframeRef = useRef(null);
// //   const [isLoading,    setIsLoading]    = useState(true);
// //   const [iframeLoaded, setIframeLoaded] = useState(false);
// //   const [error,        setError]        = useState(null);
// //   const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`).current;

// //   const localMapServerUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

// //   // ✅ Computed once on mount — iframe is never replaced on re-render
// //   const srcDoc = useMemo(
// //     () => generateIframeContent({ mapId, center, zoom, localMapServerUrl }),
// //     [] // eslint-disable-line react-hooks/exhaustive-deps
// //   );

// //   const sendToIframe = useCallback((type, data = {}) => {
// //     if (iframeRef.current && iframeLoaded) {
// //       iframeRef.current.contentWindow?.postMessage({ type, mapId, ...data }, '*');
// //     }
// //   }, [iframeLoaded, mapId]);

// //   const createMapControls = useCallback(() => ({
// //     animateToLocation:    (location, z) => sendToIframe('ANIMATE_TO_LOCATION', { location, zoom: z }),
// //     setZoom:              (z)           => sendToIframe('SET_ZOOM', { zoom: z }),
// //     zoomIn:               ()            => sendToIframe('ZOOM_IN'),
// //     zoomOut:              ()            => sendToIframe('ZOOM_OUT'),
// //     toggleTraffic:        ()            => sendToIframe('TOGGLE_TRAFFIC'),
// //     clearRoute:           ()            => sendToIframe('CLEAR_ROUTE'),
// //     updateDriverLocation: (location)    => sendToIframe('UPDATE_DRIVER_LOCATION', { location }),
// //     enable3DMode:         (bearing)     => sendToIframe('ENABLE_3D_MODE', { bearing }),
// //     disable3DMode:        ()            => sendToIframe('DISABLE_3D_MODE'),
// //     // ── Configure the persistent driver marker icon once after map loads ───
// //     configureDriverMarker: (config)     => sendToIframe('CONFIGURE_DRIVER_MARKER', { config }),
// //     getCurrentLocation: (callback) => {
// //       const messageId = Math.random().toString(36);
// //       const handler = (event) => {
// //         if (event.data.type === 'CURRENT_LOCATION_RESPONSE' && event.data.messageId === messageId) {
// //           callback(event.data.location);
// //           window.removeEventListener('message', handler);
// //         }
// //       };
// //       window.addEventListener('message', handler);
// //       sendToIframe('GET_CURRENT_LOCATION', { messageId });
// //     },
// //     searchLocation: (query, callback) => {
// //       const messageId = Math.random().toString(36);
// //       const handler = (event) => {
// //         if (event.data.type === 'SEARCH_RESULTS' && event.data.messageId === messageId) {
// //           callback(event.data.results);
// //           window.removeEventListener('message', handler);
// //         }
// //       };
// //       window.addEventListener('message', handler);
// //       sendToIframe('SEARCH_LOCATION', { query, messageId });
// //     },
// //     getPlaceDetails: (placeId, callback) => {
// //       const messageId = Math.random().toString(36);
// //       const handler = (event) => {
// //         if (event.data.type === 'PLACE_DETAILS' && event.data.messageId === messageId) {
// //           callback(event.data.location);
// //           window.removeEventListener('message', handler);
// //         }
// //       };
// //       window.addEventListener('message', handler);
// //       sendToIframe('GET_PLACE_DETAILS', { placeId, messageId });
// //     },
// //   }), [sendToIframe]);

// //   useEffect(() => {
// //     if (iframeLoaded && onMapLoad) onMapLoad(createMapControls());
// //   }, [iframeLoaded, onMapLoad, createMapControls]);

// //   // ── Marker sync ───────────────────────────────────────────────────────────
// //   useEffect(() => {
// //   if (!iframeLoaded) return;
// //   const markerData = [];

// //   // Only auto-add pickup/dropoff pins if the explicit markers array
// //   // doesn't already contain an entry for those ids.
// //   // This prevents orphaned duplicate pins when the caller overrides them.
// //   const overriddenIds = new Set(markers.map(m => m.id));

// //   if (pickupLocation && !overriddenIds.has('pickup')) {
// //     markerData.push({ id: 'pickup',  position: pickupLocation,  type: 'pickup',  title: 'Pickup'  });
// //   }
// //   if (dropoffLocation && !overriddenIds.has('dropoff')) {
// //     markerData.push({ id: 'dropoff', position: dropoffLocation, type: 'dropoff', title: 'Dropoff' });
// //   }

// //   markerData.push(...markers);
// //   sendToIframe('UPDATE_MARKERS', { markers: markerData });
// // }, [markers, pickupLocation, dropoffLocation, iframeLoaded, sendToIframe])

// //   // ── Route drawing — primitive deps to avoid spam ──────────────────────────
// //   const pickupLat  = pickupLocation?.lat;
// //   const pickupLng  = pickupLocation?.lng;
// //   const dropoffLat = dropoffLocation?.lat;
// //   const dropoffLng = dropoffLocation?.lng;

// //   useEffect(() => {
// //     if (!iframeLoaded) return;
// //     if (pickupLat != null && pickupLng != null && dropoffLat != null && dropoffLng != null) {
// //       sendToIframe('DRAW_ROUTE', {
// //         pickup:  { lat: pickupLat,  lng: pickupLng  },
// //         dropoff: { lat: dropoffLat, lng: dropoffLng },
// //       });
// //     } else {
// //       sendToIframe('CLEAR_ROUTE');
// //     }
// //   }, [pickupLat, pickupLng, dropoffLat, dropoffLng, iframeLoaded, sendToIframe]);

// //   // ── Message listener ──────────────────────────────────────────────────────
// //   useEffect(() => {
// //     const handleMessage = (event) => {
// //       const { type, mapId: rid, ...data } = event.data;
// //       if (rid !== mapId) return;
// //       switch (type) {
// //         case 'MAP_LOADED':
// //           setIframeLoaded(true);
// //           setIsLoading(false);
// //           break;
// //         case 'ROUTE_CALCULATED':
// //           if (onRouteCalculated) onRouteCalculated(data);
// //           break;
// //         case 'MAP_CLICKED':
// //           if (onMapClick) onMapClick(data.location);
// //           break;
// //         case 'MAP_ERROR':
// //           console.error('Map iframe error:', data.error);
// //           setError(data.error);
// //           setIsLoading(false);
// //           break;
// //       }
// //     };
// //     window.addEventListener('message', handleMessage);
// //     return () => window.removeEventListener('message', handleMessage);
// //   }, [mapId, onRouteCalculated, onMapClick]);

// //   if (error) {
// //     return (
// //       <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'error.light', p: 3 }}>
// //         <Typography color="error.dark">Error loading map: {error}</Typography>
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box sx={{ position: 'relative', width, height }}>
// //       {isLoading && <MapLoading />}
// //       <iframe
// //         ref={iframeRef}
// //         srcDoc={srcDoc}
// //         style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
// //         title="Map"
// //         allow="geolocation"
// //       />
// //     </Box>
// //   );
// // });

// // IframeMap.displayName = 'IframeMap';

// // // ─────────────────────────────────────────────────────────────────────────────
// // // MapLoading — map skeleton shown while iframe initialises
// // // ─────────────────────────────────────────────────────────────────────────────
// // function MapLoading() {
// //   return (
// //     <Box sx={{
// //       position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
// //       zIndex: 1, overflow: 'hidden',
// //       bgcolor: '#E8EEF4',
// //     }}>
// //       {/* Animated shimmer base */}
// //       <Box sx={{
// //         position: 'absolute', inset: 0,
// //         background: 'linear-gradient(110deg, #E8EEF4 30%, #F2F6FA 50%, #E8EEF4 70%)',
// //         backgroundSize: '200% 100%',
// //         animation: 'mapShimmer 1.6s ease-in-out infinite',
// //         '@keyframes mapShimmer': {
// //           '0%':   { backgroundPosition: '200% 0' },
// //           '100%': { backgroundPosition: '-200% 0' },
// //         },
// //       }} />

// //       {/* Fake road grid */}
// //       <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
// //         {[18, 38, 56, 72, 88].map((top, i) => (
// //           <Box key={`h${i}`} sx={{ position: 'absolute', left: 0, right: 0, top: `${top}%`, height: i % 2 === 0 ? 3 : 2, bgcolor: '#D0DAE4', borderRadius: 1 }} />
// //         ))}
// //         {[15, 32, 50, 68, 82].map((left, i) => (
// //           <Box key={`v${i}`} sx={{ position: 'absolute', top: 0, bottom: 0, left: `${left}%`, width: i % 2 === 0 ? 3 : 2, bgcolor: '#D0DAE4', borderRadius: 1 }} />
// //         ))}
// //         <Box sx={{ position: 'absolute', top: 0, left: '20%', width: 2, height: '140%', bgcolor: '#C8D4E0', transform: 'rotate(25deg)', transformOrigin: 'top left' }} />
// //         <Box sx={{ position: 'absolute', top: 0, left: '60%', width: 2, height: '140%', bgcolor: '#C8D4E0', transform: 'rotate(-18deg)', transformOrigin: 'top left' }} />
// //       </Box>

// //       {/* Fake location blocks */}
// //       {[
// //         { top: '22%', left: '15%', w: 48, h: 28 },
// //         { top: '45%', left: '55%', w: 64, h: 24 },
// //         { top: '65%', left: '28%', w: 52, h: 22 },
// //         { top: '30%', left: '72%', w: 44, h: 20 },
// //       ].map((b, i) => (
// //         <Box key={i} sx={{ position: 'absolute', top: b.top, left: b.left, width: b.w, height: b.h, bgcolor: '#D6E0EA', borderRadius: 1, opacity: 0.6 }} />
// //       ))}

// //       {/* Center loading indicator */}
// //       <Box sx={{
// //         position: 'absolute', top: '50%', left: '50%',
// //         transform: 'translate(-50%, -50%)',
// //         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
// //       }}>
// //         <Box sx={{
// //           width: 52, height: 52, borderRadius: '50%',
// //           bgcolor: 'rgba(255,255,255,0.9)',
// //           display: 'flex', alignItems: 'center', justifyContent: 'center',
// //           boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
// //         }}>
// //           <CircularProgress size={28} thickness={3.5} sx={{ color: '#3b82f6' }} />
// //         </Box>
// //         <Box sx={{
// //           px: 2, py: 0.75, borderRadius: 99,
// //           bgcolor: 'rgba(255,255,255,0.9)',
// //           boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
// //         }}>
// //           <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', fontSize: 11, letterSpacing: 0.3 }}>
// //             Loading map…
// //           </Typography>
// //         </Box>
// //       </Box>
// //     </Box>
// //   );
// // }

// // // ─────────────────────────────────────────────────────────────────────────────
// // // HELPERS
// // // ─────────────────────────────────────────────────────────────────────────────
// // function haversine(lat1, lon1, lat2, lon2) {
// //   const R    = 6371;
// //   const dLat = (lat2 - lat1) * Math.PI / 180;
// //   const dLon = (lon2 - lon1) * Math.PI / 180;
// //   const a    = Math.sin(dLat / 2) ** 2 +
// //                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
// //                Math.sin(dLon / 2) ** 2;
// //   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // }
// // PATH: Okrarides/rider/components/Map/MapIframe.jsx
// 'use client';

// import {
//   useEffect, useRef, useState, useCallback,
//   Suspense, lazy, Component, memo, useMemo,
// } from 'react';
// import { Box, CircularProgress, Typography } from '@mui/material';

// // ── Safe context read ─────────────────────────────────────────────────────────
// let useMapProviderHook = null;
// try {
//   if (typeof window !== 'undefined') {
//     const mod = require('../APIProviders/MapsProvider');
//     useMapProviderHook = mod.useMapProvider;
//   }
// } catch (e) {
//   console.warn('[MapIframe] Could not load MapsProvider:', e?.message);
// }

// function useSafeMapProvider() {
//   try { if (useMapProviderHook) return useMapProviderHook(); } catch {}
//   return null;
// }

// // ── Native display components ─────────────────────────────────────────────────
// const YandexMapDisplay = lazy(() => import('../APIProviders/MapDisplays/YandexMapDisplay'));
// const GoogleMapDisplay = lazy(() => import('../APIProviders/MapDisplays/GoogleMapDisplay'));
// const AppleMapDisplay  = lazy(() => import('../APIProviders/MapDisplays/AppleMapDisplay'));
// const LocalMapDisplay  = lazy(() => import('../APIProviders/MapDisplays/LocalMapDisplay'));
// const WazeMapModal     = lazy(() => import('../APIProviders/MapDisplays/WazeMapModal'));

// const NATIVE_COMPONENTS = {
//   yandexmap: YandexMapDisplay,
//   googlemap:  GoogleMapDisplay,
//   applemap:   AppleMapDisplay,
//   localmap:   LocalMapDisplay,
// };

// // ── Error boundary ────────────────────────────────────────────────────────────
// class NativeMapErrorBoundary extends Component {
//   constructor(props) { super(props); this.state = { crashed: false, error: null }; }
//   static getDerivedStateFromError(err) { return { crashed: true, error: err }; }
//   componentDidCatch(err, info) {
//     console.error('[MapIframe] ❌ NATIVE MAP CRASHED — falling back to iframe', err?.message);
//   }
//   render() {
//     if (this.state.crashed) return <IframeMap {...this.props.fallbackProps} />;
//     return this.props.children;
//   }
// }

// // ── generateIframeContent ─────────────────────────────────────────────────────
// // Route drawing is now handled entirely on the React side via MapsProvider.getRoute().
// // The iframe receives a SET_ROUTE_GEOMETRY message with pre-computed coordinates
// // instead of fetching the route itself. This means the iframe never calls the
// // local route server — the prioritized provider (e.g. Google) is always used.
// function generateIframeContent({ mapId, center, zoom, localMapServerUrl }) {
//   return `<!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
//   <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet">
//   <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
//   <style>
//     * { margin: 0; padding: 0; box-sizing: border-box; }
//     html, body, #map { width: 100%; height: 100%; overflow: hidden; }
//     .maplibregl-ctrl-logo { display: none !important; }
//     .custom-marker { cursor: pointer; }
//     @keyframes pulse {
//       0%   { box-shadow: 0 0 0 0   rgba(59,130,246,0.7); }
//       70%  { box-shadow: 0 0 0 12px rgba(59,130,246,0);   }
//       100% { box-shadow: 0 0 0 0   rgba(59,130,246,0);   }
//     }
//     .current-location-dot {
//       width: 18px; height: 18px;
//       background: #3b82f6; border: 3px solid white;
//       border-radius: 50%; animation: pulse 2s infinite;
//       box-shadow: 0 2px 6px rgba(0,0,0,0.4);
//     }
//   </style>
// </head>
// <body>
// <div id="map"></div>
// <script>
// (function() {
//   const mapId = '${mapId}';
//   const LOCAL_SERVER = '${localMapServerUrl}';

//   let map, markers = {}, driverMarker = null, driverMarkerConfig = null;
//   let is3DMode = false, mapReady = false;

//   const OPENFREE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

//   function buildFallbackStyle() {
//     const tileUrl = LOCAL_SERVER
//       ? [LOCAL_SERVER + '/tiles/{z}/{x}/{y}.png']
//       : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
//     return {
//       version: 8,
//       sources: { raster: { type: 'raster', tiles: tileUrl, tileSize: 256, attribution: '© OpenStreetMap' } },
//       layers:  [{ id: 'raster', type: 'raster', source: 'raster' }],
//     };
//   }

//   function sendMessage(type, data = {}) {
//     window.parent.postMessage({ type, mapId, ...data }, '*');
//   }

//   function createMarkerEl(type, custom) {
//     const configs = {
//       pickup:  { bg: '#22c55e', label: '📍', size: 36 },
//       dropoff: { bg: '#ef4444', label: '🎯', size: 36 },
//       driver:  { bg: '#1d4ed8', label: '🚗', size: 42 },
//       station: { bg: '#3b82f6', label: '🏢', size: 32 },
//       current: { bg: '#3b82f6', label: null,  size: 18, isPulse: true },
//       default: { bg: '#6366f1', label: '📌', size: 32 },
//     };
//     const cfg = custom ?? configs[type] ?? configs.default;
//     const el  = document.createElement('div');
//     el.className = 'custom-marker';
//     if (cfg.isPulse) {
//       el.innerHTML = '<div class="current-location-dot"></div>';
//     } else {
//       el.style.cssText = [
//         'display:flex','align-items:center','justify-content:center',
//         'border-radius:50%','border:3px solid white',
//         'box-shadow:0 3px 10px rgba(0,0,0,0.4)',
//         'cursor:pointer','user-select:none','transition:transform 0.15s ease',
//         \`background:\${cfg.bg}\`,\`width:\${cfg.size}px\`,\`height:\${cfg.size}px\`,
//         \`font-size:\${cfg.size * 0.45}px\`,
//       ].join(';');
//       el.textContent = cfg.label;
//       el.onmouseenter = () => (el.style.transform = 'scale(1.2)');
//       el.onmouseleave = () => (el.style.transform = 'scale(1)');
//     }
//     return el;
//   }

//   // ── Route rendering ─────────────────────────────────────────────────────────
//   // The route geometry is always sent from the React side (pre-computed by
//   // MapsProvider.getRoute → Google Routes API / OSRM fallback).
//   // The iframe NEVER fetches routes itself — it only draws what it receives.

//   function renderRouteGeometry(coords, distanceText, durationText, distanceValue, durationValue) {
//     if (!coords || coords.length < 2) return;
//     const geojson = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };

//     if (map.getSource('route')) {
//       map.getSource('route').setData(geojson);
//       // No fitBounds on update — prevents zoom-in on driver location polls
//     } else {
//       map.addSource('route', { type: 'geojson', data: geojson });
//       map.addLayer({ id: 'route-casing', type: 'line', source: 'route',
//         layout: { 'line-join': 'round', 'line-cap': 'round' },
//         paint:  { 'line-color': '#1e40af', 'line-width': 10, 'line-opacity': 0.4 } });
//       map.addLayer({ id: 'route-line', type: 'line', source: 'route',
//         layout: { 'line-join': 'round', 'line-cap': 'round' },
//         paint:  { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.9 } });

//       // fitBounds only on first draw
//       const lngs = coords.map(c => c[0]), lats = coords.map(c => c[1]);
//       map.fitBounds(
//         [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
//         { padding: { top: 80, bottom: 220, left: 80, right: 80 }, duration: 800 }
//       );
//     }

//     sendMessage('ROUTE_CALCULATED', {
//       distance:      distanceText  || 'N/A',
//       duration:      durationText  || 'N/A',
//       distanceValue: distanceValue || 0,
//       durationValue: durationValue || 0,
//     });
//   }

//   function clearRoute() {
//     if (map && map.getLayer('route-line'))   map.removeLayer('route-line');
//     if (map && map.getLayer('route-casing')) map.removeLayer('route-casing');
//     if (map && map.getSource('route'))       map.removeSource('route');
//   }

//   async function getIPLocation() {
//     if (LOCAL_SERVER) {
//       try {
//         const r = await fetch(LOCAL_SERVER + '/api/ip-location');
//         if (r.ok) { const d = await r.json(); if (d.latitude && d.longitude) return [d.longitude, d.latitude]; }
//       } catch {}
//     }
//     try {
//       const r = await fetch('https://ipapi.co/json/');
//       if (r.ok) { const d = await r.json(); if (d.latitude && d.longitude) return [d.longitude, d.latitude]; }
//     } catch {}
//     return [${center.lng}, ${center.lat}];
//   }

//   async function nominatimSearch(query) {
//     try {
//       const r = await fetch(
//         'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) +
//         '&format=json&limit=7&addressdetails=1',
//         { headers: { 'Accept-Language': 'en' } }
//       );
//       if (!r.ok) return [];
//       const data = await r.json();
//       return data.map(item => ({
//         place_id:       item.place_id?.toString(),
//         main_text:      item.name || item.display_name?.split(',')[0],
//         secondary_text: item.display_name,
//         lat:            parseFloat(item.lat),
//         lng:            parseFloat(item.lon),
//         address:        item.display_name,
//         name:           item.name || item.display_name?.split(',')[0],
//       }));
//     } catch { return []; }
//   }

//   async function initMap() {
//     const initialCenter = await getIPLocation();
//     let mapStyle = OPENFREE_STYLE;
//     try {
//       const test = await fetch('https://tiles.openfreemap.org/styles/liberty', {
//         method: 'HEAD', signal: AbortSignal.timeout(4000),
//       });
//       if (!test.ok) throw new Error();
//     } catch { mapStyle = buildFallbackStyle(); }

//     map = new maplibregl.Map({
//       container: 'map', style: mapStyle, center: initialCenter,
//       zoom: ${zoom}, maxZoom: 22, minZoom: 2, pitch: 0, bearing: 0,
//       attributionControl: false,
//     });

//     map.on('error', () => {
//       if (!map._fallbackApplied) {
//         map._fallbackApplied = true;
//         try { map.setStyle(buildFallbackStyle()); } catch {}
//       }
//     });

//     map.on('load', async () => {
//       mapReady = true;
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition((pos) => {
//           const loc = [pos.coords.longitude, pos.coords.latitude];
//           map.flyTo({ center: loc, zoom: 15, duration: 1200 });
//           if (markers['current-location']) markers['current-location'].remove();
//           const el = createMarkerEl('current');
//           markers['current-location'] = new maplibregl.Marker({ element: el }).setLngLat(loc).addTo(map);
//         }, () => {});
//       }
//       sendMessage('MAP_LOADED');
//     });

//     map.on('click', (e) => {
//       sendMessage('MAP_CLICKED', { location: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
//     });
//   }

//   window.addEventListener('message', async (event) => {
//     const { type, mapId: rid, ...data } = event.data || {};
//     if (rid !== mapId) return;

//     switch (type) {

//       case 'UPDATE_MARKERS': {
//         Object.entries(markers).forEach(([id, m]) => {
//           if (id !== 'current-location') { m.remove(); delete markers[id]; }
//         });
//         (data.markers || []).forEach(md => {
//           if (!md.position) return;
//           const el = createMarkerEl(md.type || 'default', md.custom ?? null);
//           markers[md.id] = new maplibregl.Marker({ element: el })
//             .setLngLat([
//               md.position.lng || md.position.longitude,
//               md.position.lat || md.position.latitude,
//             ])
//             .addTo(map);
//         });
//         break;
//       }

//       case 'CONFIGURE_DRIVER_MARKER': {
//         driverMarkerConfig = data.config ?? null;
//         if (driverMarker) {
//           const lngLat = driverMarker.getLngLat();
//           driverMarker.remove();
//           const el = createMarkerEl('driver', driverMarkerConfig);
//           driverMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
//             .setLngLat(lngLat).addTo(map);
//         }
//         break;
//       }

//       case 'UPDATE_DRIVER_LOCATION': {
//         const loc = data.location; if (!loc) break;
//         const lngLat = [loc.lng || loc.longitude, loc.lat || loc.latitude];
//         if (driverMarker) {
//           driverMarker.setLngLat(lngLat);
//         } else {
//           const el = createMarkerEl('driver', driverMarkerConfig);
//           driverMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
//             .setLngLat(lngLat).addTo(map);
//         }
//         if (loc.heading != null) {
//           driverMarker.getElement().style.transform = 'rotate(' + loc.heading + 'deg)';
//           if (is3DMode) map.rotateTo(loc.heading, { duration: 500 });
//         }
//         break;
//       }

//       // ── SET_ROUTE_GEOMETRY ──────────────────────────────────────────────────
//       // Replaces the old DRAW_ROUTE handler. The React side now fetches the
//       // route via MapsProvider.getRoute() and sends the geometry here for
//       // rendering only. The iframe never fetches routes itself.
//       case 'SET_ROUTE_GEOMETRY': {
//         if (!mapReady) {
//           setTimeout(() => {
//             renderRouteGeometry(
//               data.geometry, data.distance, data.duration,
//               data.distanceValue, data.durationValue
//             );
//           }, 500);
//           break;
//         }
//         renderRouteGeometry(
//           data.geometry, data.distance, data.duration,
//           data.distanceValue, data.durationValue
//         );
//         break;
//       }

//       case 'CLEAR_ROUTE': clearRoute(); break;

//       case 'ANIMATE_TO_LOCATION': {
//         const loc = data.location; if (!loc || !map) break;
//         map.flyTo({ center: [loc.lng || loc.longitude, loc.lat || loc.latitude], zoom: data.zoom || map.getZoom(), duration: 800 });
//         break;
//       }
//       case 'SET_ZOOM':    if (map) map.setZoom(data.zoom); break;
//       case 'ZOOM_IN':     if (map) map.setZoom(map.getZoom() + 1); break;
//       case 'ZOOM_OUT':    if (map) map.setZoom(map.getZoom() - 1); break;
//       case 'ENABLE_3D_MODE':  is3DMode = true;  map.easeTo({ pitch: 60, bearing: data.bearing || 0, duration: 800 }); break;
//       case 'DISABLE_3D_MODE': is3DMode = false; map.easeTo({ pitch: 0,  bearing: 0, duration: 600 }); break;

//       case 'GET_CURRENT_LOCATION':
//         navigator.geolocation?.getCurrentPosition(
//           (pos) => {
//             const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
//             sendMessage('CURRENT_LOCATION_RESPONSE', { messageId: data.messageId, location: loc });
//             const lngLat = [loc.lng, loc.lat];
//             if (markers['current-location']) {
//               markers['current-location'].setLngLat(lngLat);
//             } else {
//               const el = createMarkerEl('current');
//               markers['current-location'] = new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
//             }
//           },
//           () => sendMessage('CURRENT_LOCATION_RESPONSE', { messageId: data.messageId, location: null })
//         );
//         break;

//       case 'SEARCH_LOCATION': {
//         const results = await nominatimSearch(data.query);
//         sendMessage('SEARCH_RESULTS', { messageId: data.messageId, results });
//         break;
//       }

//       case 'GET_PLACE_DETAILS': {
//         try {
//           const r = await fetch(
//             'https://nominatim.openstreetmap.org/lookup?osm_ids=N' + data.placeId + '&format=json'
//           );
//           if (r.ok) {
//             const d = await r.json();
//             if (d?.length > 0) {
//               const item = d[0];
//               sendMessage('PLACE_DETAILS', {
//                 messageId: data.messageId,
//                 location: {
//                   lat:      parseFloat(item.lat),
//                   lng:      parseFloat(item.lon),
//                   address:  item.display_name,
//                   name:     item.display_name?.split(',')[0],
//                   place_id: data.placeId,
//                 },
//               });
//               break;
//             }
//           }
//         } catch {}
//         sendMessage('PLACE_DETAILS', { messageId: data.messageId, location: null });
//         break;
//       }
//     }
//   });

//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initMap);
//   } else {
//     initMap();
//   }
// })();
// </script>
// </body>
// </html>`;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN EXPORT
// // ─────────────────────────────────────────────────────────────────────────────
// export function MapIframe(props) {
//   const mapsProvider   = useSafeMapProvider();
//   const ready          = mapsProvider?.ready ?? true;
//   const prioritizedMap = (ready ? mapsProvider?.prioritizedMap : null) || 'openstreetmap';

//   const [wazeModalOpen, setWazeModalOpen] = useState(false);

//   useEffect(() => {
//     if (ready && prioritizedMap === 'wazemap') setWazeModalOpen(true);
//   }, [ready, prioritizedMap]);

//   const NativeComponent = NATIVE_COMPONENTS[prioritizedMap];
//   const { height: _h = '100%', width: _w = '100%' } = props;
//   const wrapSx = { position: 'relative', width: _w, height: _h, overflow: 'hidden' };

//   if (!ready) return <Box sx={wrapSx}><MapLoading /></Box>;

//   if (prioritizedMap === 'wazemap') {
//     return (
//       <Box sx={wrapSx}>
//         <IframeMap {...props} />
//         {!wazeModalOpen && (
//           <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1300 }}>
//             <Box
//               component="button"
//               onClick={() => setWazeModalOpen(true)}
//               sx={{
//                 display: 'flex', alignItems: 'center', gap: 1,
//                 px: 2, py: 1, bgcolor: '#08b4e0', color: '#fff',
//                 border: 'none', borderRadius: 3, fontWeight: 700, fontSize: 14,
//                 cursor: 'pointer', boxShadow: '0 4px 16px rgba(8,180,224,0.45)',
//                 '&:hover': { bgcolor: '#0696bc' },
//               }}
//             >🚗 Open Waze Map</Box>
//           </Box>
//         )}
//         <Suspense fallback={null}>
//           <WazeMapModal
//             open={wazeModalOpen}
//             onClose={() => setWazeModalOpen(false)}
//             onLocationSelected={(location, type) => {
//               props.onMapClick?.(location);
//               props.onWazeLocationSelected?.(location, type);
//             }}
//             initialCenter={props.center || { lat: -15.4167, lng: 28.2833 }}
//             pickupLocation={props.pickupLocation}
//             dropoffLocation={props.dropoffLocation}
//             countryCode={props.countryCode}
//           />
//         </Suspense>
//       </Box>
//     );
//   }

//   if (NativeComponent) {
//     return (
//       <Box sx={wrapSx}>
//         <NativeMapErrorBoundary fallbackProps={props}>
//           <Suspense fallback={<MapLoading />}>
//             <NativeMapWrapper NativeComponent={NativeComponent} prioritizedMap={prioritizedMap} {...props} />
//           </Suspense>
//         </NativeMapErrorBoundary>
//       </Box>
//     );
//   }

//   return <Box sx={wrapSx}><IframeMap {...props} /></Box>;
// }

// MapIframe.displayName = 'MapIframe';
// export default MapIframe;

// // ─────────────────────────────────────────────────────────────────────────────
// // NativeMapWrapper
// // ─────────────────────────────────────────────────────────────────────────────
// function NativeMapWrapper({
//   NativeComponent, prioritizedMap, center, zoom, markers,
//   pickupLocation, dropoffLocation, onRouteCalculated, onMapClick, onMapLoad,
//   showRoute, height, width,
// }) {
//   const mapsProvider = useSafeMapProvider();
//   const controlsRef  = useRef(null);
//   const [route, setRoute] = useState(null);

//   useEffect(() => {
//     if (!pickupLocation || !dropoffLocation) { setRoute(null); return; }
//     let cancelled = false;
//     async function fetchRoute() {
//       if (mapsProvider?.getRoute) {
//         const result = await mapsProvider.getRoute(pickupLocation, dropoffLocation);
//         if (cancelled) return;
//         if (result?.type === 'deeplink') {
//           onRouteCalculated?.({ distance: 'N/A', duration: 'N/A', distanceValue: 0, durationValue: 0, viaApp: prioritizedMap });
//         } else if (result?.geometry) {
//           setRoute(result.geometry);
//           onRouteCalculated?.({ distance: result.distance, duration: result.duration, distanceValue: result.distanceValue, durationValue: result.durationValue });
//         }
//       }
//     }
//     fetchRoute();
//     return () => { cancelled = true; };
//   }, [pickupLocation?.lat, pickupLocation?.lng, dropoffLocation?.lat, dropoffLocation?.lng]); // eslint-disable-line

//   const handleNativeMapLoad = useCallback((nativeControls) => {
//     controlsRef.current = nativeControls;
//     const controls = {
//       animateToLocation:     (loc, z)  => nativeControls?.animateToLocation?.(loc.lat ?? loc.latitude, loc.lng ?? loc.longitude, z),
//       setZoom:               (z)       => nativeControls?.setZoom?.(z),
//       zoomIn:                ()        => nativeControls?.zoomIn?.(),
//       zoomOut:               ()        => nativeControls?.zoomOut?.(),
//       enable3DMode:          (b)       => nativeControls?.enable3DMode?.(b),
//       disable3DMode:         ()        => nativeControls?.disable3DMode?.(),
//       clearRoute:            ()        => { setRoute(null); nativeControls?.clearRoute?.(); },
//       toggleTraffic:         ()        => {},
//       configureDriverMarker: ()        => {},
//       updateDriverLocation:  (loc)     => nativeControls?.updateDriverLocation?.(loc.lat ?? loc.latitude, loc.lng ?? loc.longitude, loc.heading),
//       getCurrentLocation:    (cb)      => nativeControls?.getCurrentLocation?.(cb),
//       searchLocation: (query, cb) => {
//         if (mapsProvider?.searchPlaces) {
//           mapsProvider.searchPlaces(query).then(r => cb(r || [])).catch(() => cb([]));
//         } else { cb([]); }
//       },
//       getPlaceDetails: (placeId, cb) => {
//         if (mapsProvider?.getPlaceDetails) {
//           mapsProvider.getPlaceDetails(placeId).then(r => cb(r)).catch(() => cb(null));
//         } else { cb(null); }
//       },
//     };
//     onMapLoad?.(controls);
//   }, [onMapLoad, mapsProvider]);

//   return (
//     <div style={{ width: width || '100%', height: height || '100%', position: 'relative', minHeight: height === '100%' ? '400px' : undefined }}>
//       <NativeComponent
//         center={center} zoom={zoom} markers={markers}
//         pickupLocation={pickupLocation} dropoffLocation={dropoffLocation}
//         route={route} showRoute={!!(showRoute && route?.length)}
//         onMapClick={onMapClick} onMapLoad={handleNativeMapLoad}
//         height="100%" width="100%"
//       />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // IframeMap
// // ─────────────────────────────────────────────────────────────────────────────
// const IframeMap = memo(({
//   center          = { lat: -15.4167, lng: 28.2833 },
//   zoom            = 13,
//   markers         = [],
//   pickupLocation  = null,
//   dropoffLocation = null,
//   onRouteCalculated,
//   onMapClick,
//   onMapLoad,
//   showRoute       = false,
//   height          = '100%',
//   width           = '100%',
// }) => {
//   const iframeRef = useRef(null);
//   const [isLoading,    setIsLoading]    = useState(true);
//   const [iframeLoaded, setIframeLoaded] = useState(false);
//   const [error,        setError]        = useState(null);
//   const mapId            = useRef(`map-${Math.random().toString(36).substr(2, 9)}`).current;
//   const localMapServerUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

//   // ── MapsProvider for route fetching ──────────────────────────────────────
//   const mapsProvider = useSafeMapProvider();

//   const srcDoc = useMemo(
//     () => generateIframeContent({ mapId, center, zoom, localMapServerUrl }),
//     [], // eslint-disable-line react-hooks/exhaustive-deps
//   );

//   const sendToIframe = useCallback((type, data = {}) => {
//     if (iframeRef.current && iframeLoaded) {
//       iframeRef.current.contentWindow?.postMessage({ type, mapId, ...data }, '*');
//     }
//   }, [iframeLoaded, mapId]);

//   const createMapControls = useCallback(() => ({
//     animateToLocation:     (location, z) => sendToIframe('ANIMATE_TO_LOCATION', { location, zoom: z }),
//     setZoom:               (z)           => sendToIframe('SET_ZOOM', { zoom: z }),
//     zoomIn:                ()            => sendToIframe('ZOOM_IN'),
//     zoomOut:               ()            => sendToIframe('ZOOM_OUT'),
//     toggleTraffic:         ()            => sendToIframe('TOGGLE_TRAFFIC'),
//     clearRoute:            ()            => sendToIframe('CLEAR_ROUTE'),
//     updateDriverLocation:  (location)    => sendToIframe('UPDATE_DRIVER_LOCATION', { location }),
//     enable3DMode:          (bearing)     => sendToIframe('ENABLE_3D_MODE', { bearing }),
//     disable3DMode:         ()            => sendToIframe('DISABLE_3D_MODE'),
//     configureDriverMarker: (config)      => sendToIframe('CONFIGURE_DRIVER_MARKER', { config }),
//     getCurrentLocation: (callback) => {
//       const messageId = Math.random().toString(36);
//       const handler = (event) => {
//         if (event.data.type === 'CURRENT_LOCATION_RESPONSE' && event.data.messageId === messageId) {
//           callback(event.data.location);
//           window.removeEventListener('message', handler);
//         }
//       };
//       window.addEventListener('message', handler);
//       sendToIframe('GET_CURRENT_LOCATION', { messageId });
//     },
//     searchLocation: (query, callback) => {
//       const messageId = Math.random().toString(36);
//       const handler = (event) => {
//         if (event.data.type === 'SEARCH_RESULTS' && event.data.messageId === messageId) {
//           callback(event.data.results);
//           window.removeEventListener('message', handler);
//         }
//       };
//       window.addEventListener('message', handler);
//       sendToIframe('SEARCH_LOCATION', { query, messageId });
//     },
//     getPlaceDetails: (placeId, callback) => {
//       const messageId = Math.random().toString(36);
//       const handler = (event) => {
//         if (event.data.type === 'PLACE_DETAILS' && event.data.messageId === messageId) {
//           callback(event.data.location);
//           window.removeEventListener('message', handler);
//         }
//       };
//       window.addEventListener('message', handler);
//       sendToIframe('GET_PLACE_DETAILS', { placeId, messageId });
//     },
//   }), [sendToIframe]);

//   useEffect(() => {
//     if (iframeLoaded && onMapLoad) onMapLoad(createMapControls());
//   }, [iframeLoaded, onMapLoad, createMapControls]);

//   // ── Marker sync ───────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!iframeLoaded) return;
//     const markerData = [];
//     const overriddenIds = new Set(markers.map(m => m.id));
//     if (pickupLocation  && !overriddenIds.has('pickup'))  markerData.push({ id: 'pickup',  position: pickupLocation,  type: 'pickup',  title: 'Pickup'  });
//     if (dropoffLocation && !overriddenIds.has('dropoff')) markerData.push({ id: 'dropoff', position: dropoffLocation, type: 'dropoff', title: 'Dropoff' });
//     markerData.push(...markers);
//     sendToIframe('UPDATE_MARKERS', { markers: markerData });
//   }, [markers, pickupLocation, dropoffLocation, iframeLoaded, sendToIframe]);

//   // ── Route: fetch via MapsProvider then send geometry to iframe ────────────
//   // This is the key fix: instead of telling the iframe to fetch the route
//   // itself (which always hit the local server), we fetch it here via
//   // MapsProvider.getRoute() which respects prioritizedRoute (e.g. 'google').
//   const pickupLat  = pickupLocation?.lat;
//   const pickupLng  = pickupLocation?.lng;
//   const dropoffLat = dropoffLocation?.lat;
//   const dropoffLng = dropoffLocation?.lng;

//   useEffect(() => {
//     if (!iframeLoaded) return;

//     if (pickupLat == null || pickupLng == null || dropoffLat == null || dropoffLng == null) {
//       sendToIframe('CLEAR_ROUTE');
//       return;
//     }

//     const origin      = { lat: pickupLat,  lng: pickupLng  };
//     const destination = { lat: dropoffLat, lng: dropoffLng };

//     async function fetchAndSendRoute() {
//       try {
//         let result = null;

//         if (mapsProvider?.getRoute) {
//           // Uses prioritizedRoute from Strapi (e.g. google → Routes API)
//           result = await mapsProvider.getRoute(origin, destination);
//         }

//         if (result?.type === 'deeplink') {
//           // Waze/Apple opened navigation app — nothing to draw
//           onRouteCalculated?.({ distance: 'N/A', duration: 'N/A', distanceValue: 0, durationValue: 0 });
//           return;
//         }

//         if (result?.geometry?.length) {
//           // Send pre-computed geometry to the iframe for rendering
//           sendToIframe('SET_ROUTE_GEOMETRY', {
//             geometry:      result.geometry,
//             distance:      result.distance,
//             duration:      result.duration,
//             distanceValue: result.distanceValue ?? 0,
//             durationValue: result.durationValue ?? 0,
//           });
//           onRouteCalculated?.({
//             distance:      result.distance,
//             duration:      result.duration,
//             distanceValue: result.distanceValue ?? 0,
//             durationValue: result.durationValue ?? 0,
//           });
//           return;
//         }
//       } catch (err) {
//         console.warn('[IframeMap] mapsProvider.getRoute failed:', err?.message);
//       }

//       // Last resort: public OSRM (doesn't hit the local server)
//       try {
//         const url =
//           `https://router.project-osrm.org/route/v1/driving/` +
//           `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
//           `?overview=full&geometries=geojson`;
//         const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
//         if (res.ok) {
//           const data  = await res.json();
//           const route = data.routes?.[0];
//           if (route) {
//             const km  = route.distance / 1000;
//             const min = route.duration / 60;
//             sendToIframe('SET_ROUTE_GEOMETRY', {
//               geometry:      route.geometry?.coordinates || [],
//               distance:      km  >= 1 ? `${km.toFixed(1)} km`             : `${Math.round(km * 1000)} m`,
//               duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
//               distanceValue: route.distance,
//               durationValue: route.duration,
//             });
//             onRouteCalculated?.({ distance: `${km.toFixed(1)} km`, duration: `${Math.round(min)} min`, distanceValue: route.distance, durationValue: route.duration });
//             return;
//           }
//         }
//       } catch {}

//       // Absolute fallback: straight-line haversine
//       const R    = 6371;
//       const dLat = (destination.lat - origin.lat) * Math.PI / 180;
//       const dLon = (destination.lng - origin.lng) * Math.PI / 180;
//       const a    =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
//         Math.sin(dLon / 2) ** 2;
//       const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//       sendToIframe('SET_ROUTE_GEOMETRY', {
//         geometry:      [[origin.lng, origin.lat], [destination.lng, destination.lat]],
//         distance:      `${km.toFixed(1)} km`,
//         duration:      'N/A',
//         distanceValue: Math.round(km * 1000),
//         durationValue: 0,
//       });
//       onRouteCalculated?.({ distance: `${km.toFixed(1)} km`, duration: 'N/A', distanceValue: Math.round(km * 1000), durationValue: 0 });
//     }

//     fetchAndSendRoute();
//   }, [pickupLat, pickupLng, dropoffLat, dropoffLng, iframeLoaded, sendToIframe, mapsProvider, onRouteCalculated]);

//   // ── Message listener ──────────────────────────────────────────────────────
//   useEffect(() => {
//     const handleMessage = (event) => {
//       const { type, mapId: rid, ...data } = event.data;
//       if (rid !== mapId) return;
//       switch (type) {
//         case 'MAP_LOADED':
//           setIframeLoaded(true);
//           setIsLoading(false);
//           break;
//         case 'ROUTE_CALCULATED':
//           if (onRouteCalculated) onRouteCalculated(data);
//           break;
//         case 'MAP_CLICKED':
//           if (onMapClick) onMapClick(data.location);
//           break;
//         case 'MAP_ERROR':
//           console.error('Map iframe error:', data.error);
//           setError(data.error);
//           setIsLoading(false);
//           break;
//       }
//     };
//     window.addEventListener('message', handleMessage);
//     return () => window.removeEventListener('message', handleMessage);
//   }, [mapId, onRouteCalculated, onMapClick]);

//   if (error) {
//     return (
//       <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'error.light', p: 3 }}>
//         <Typography color="error.dark">Error loading map: {error}</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ position: 'relative', width, height }}>
//       {isLoading && <MapLoading />}
//       <iframe
//         ref={iframeRef}
//         srcDoc={srcDoc}
//         style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
//         title="Map"
//         allow="geolocation"
//       />
//     </Box>
//   );
// });

// IframeMap.displayName = 'IframeMap';

// // ─────────────────────────────────────────────────────────────────────────────
// // MapLoading
// // ─────────────────────────────────────────────────────────────────────────────
// function MapLoading() {
//   return (
//     <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, overflow: 'hidden', bgcolor: '#E8EEF4' }}>
//       <Box sx={{
//         position: 'absolute', inset: 0,
//         background: 'linear-gradient(110deg, #E8EEF4 30%, #F2F6FA 50%, #E8EEF4 70%)',
//         backgroundSize: '200% 100%',
//         animation: 'mapShimmer 1.6s ease-in-out infinite',
//         '@keyframes mapShimmer': { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
//       }} />
//       <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
//         {[18, 38, 56, 72, 88].map((top, i) => (
//           <Box key={`h${i}`} sx={{ position: 'absolute', left: 0, right: 0, top: `${top}%`, height: i % 2 === 0 ? 3 : 2, bgcolor: '#D0DAE4', borderRadius: 1 }} />
//         ))}
//         {[15, 32, 50, 68, 82].map((left, i) => (
//           <Box key={`v${i}`} sx={{ position: 'absolute', top: 0, bottom: 0, left: `${left}%`, width: i % 2 === 0 ? 3 : 2, bgcolor: '#D0DAE4', borderRadius: 1 }} />
//         ))}
//       </Box>
//       <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
//         <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
//           <CircularProgress size={28} thickness={3.5} sx={{ color: '#3b82f6' }} />
//         </Box>
//         <Box sx={{ px: 2, py: 0.75, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
//           <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', fontSize: 11, letterSpacing: 0.3 }}>
//             Loading map…
//           </Typography>
//         </Box>
//       </Box>
//     </Box>
//   );
// }
'use client';
// PATH: Okrarides/rider/components/Map/MapIframe.jsx

import {
  useEffect, useRef, useState, useCallback,
  Suspense, lazy, Component, memo, useMemo,
} from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// ── Safe context read ─────────────────────────────────────────────────────────
let useMapProviderHook = null;
try {
  if (typeof window !== 'undefined') {
    const mod = require('../APIProviders/MapsProvider');
    useMapProviderHook = mod.useMapProvider;
  }
} catch (e) {
  console.warn('[MapIframe] Could not load MapsProvider:', e?.message);
}

function useSafeMapProvider() {
  try { if (useMapProviderHook) return useMapProviderHook(); } catch {}
  return null;
}

// ── Native display components ─────────────────────────────────────────────────
const YandexMapDisplay = lazy(() => import('../APIProviders/MapDisplays/YandexMapDisplay'));
const GoogleMapDisplay = lazy(() => import('../APIProviders/MapDisplays/GoogleMapDisplay'));
const AppleMapDisplay  = lazy(() => import('../APIProviders/MapDisplays/AppleMapDisplay'));
const LocalMapDisplay  = lazy(() => import('../APIProviders/MapDisplays/LocalMapDisplay'));
const WazeMapModal     = lazy(() => import('../APIProviders/MapDisplays/WazeMapModal'));

const NATIVE_COMPONENTS = {
  yandexmap: YandexMapDisplay,
  googlemap:  GoogleMapDisplay,
  applemap:   AppleMapDisplay,
  localmap:   LocalMapDisplay,
};

// ── Error boundary ────────────────────────────────────────────────────────────
class NativeMapErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(err) { return { crashed: true, error: err }; }
  componentDidCatch(err, info) {
    console.error('[MapIframe] ❌ NATIVE MAP CRASHED — falling back to iframe', err?.message);
  }
  render() {
    if (this.state.crashed) return <IframeMap {...this.props.fallbackProps} />;
    return this.props.children;
  }
}

// ── generateIframeContent — module-scope so it is never recreated ─────────────
// Defining this outside the component means useMemo([]) inside IframeMap
// memoizes the HTML string once on mount and never regenerates it, preventing
// the iframe from reloading on every parent re-render.
function generateIframeContent({ mapId, center, zoom, localMapServerUrl }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet">
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; }
    .maplibregl-ctrl-logo { display: none !important; }
    .custom-marker { cursor: pointer; }
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0   rgba(59,130,246,0.7); }
      70%  { box-shadow: 0 0 0 12px rgba(59,130,246,0);   }
      100% { box-shadow: 0 0 0 0   rgba(59,130,246,0);   }
    }
    .current-location-dot {
      width: 18px; height: 18px;
      background: #3b82f6; border: 3px solid white;
      border-radius: 50%; animation: pulse 2s infinite;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
(function() {
  const mapId = '${mapId}';
  const LOCAL_SERVER = '${localMapServerUrl}';

  let map, markers = {}, driverMarker = null, driverMarkerConfig = null;
  let is3DMode = false, mapReady = false;

  const OPENFREE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

  function buildFallbackStyle() {
    const tileUrl = LOCAL_SERVER
      ? [LOCAL_SERVER + '/tiles/{z}/{x}/{y}.png']
      : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
    return {
      version: 8,
      sources: { raster: { type: 'raster', tiles: tileUrl, tileSize: 256, attribution: '© OpenStreetMap' } },
      layers:  [{ id: 'raster', type: 'raster', source: 'raster' }],
    };
  }

  function sendMessage(type, data = {}) {
    window.parent.postMessage({ type, mapId, ...data }, '*');
  }

  // Accepts optional custom config — shape: { bg, label, size, isPulse? }
  function createMarkerEl(type, custom) {
    const configs = {
      pickup:  { bg: '#22c55e', label: '📍', size: 36 },
      dropoff: { bg: '#ef4444', label: '🎯', size: 36 },
      driver:  { bg: '#1d4ed8', label: '🚗', size: 42 },
      station: { bg: '#3b82f6', label: '🏢', size: 32 },
      current: { bg: '#3b82f6', label: null,  size: 18, isPulse: true },
      default: { bg: '#6366f1', label: '📌', size: 32 },
    };
    const cfg = custom ?? configs[type] ?? configs.default;
    const el  = document.createElement('div');
    el.className = 'custom-marker';
    if (cfg.isPulse) {
      el.innerHTML = '<div class="current-location-dot"></div>';
    } else {
      el.style.cssText = [
        'display:flex','align-items:center','justify-content:center',
        'border-radius:50%','border:3px solid white',
        'box-shadow:0 3px 10px rgba(0,0,0,0.4)',
        'cursor:pointer','user-select:none','transition:transform 0.15s ease',
        \`background:\${cfg.bg}\`,\`width:\${cfg.size}px\`,\`height:\${cfg.size}px\`,
        \`font-size:\${cfg.size * 0.45}px\`,
      ].join(';');
      el.textContent = cfg.label;
      el.onmouseenter = () => (el.style.transform = 'scale(1.2)');
      el.onmouseleave = () => (el.style.transform = 'scale(1)');
    }
    return el;
  }

  function renderRouteGeometry(coords, distanceText, durationText, distanceValue, durationValue) {
    if (!coords || coords.length < 2) return;
    const geojson = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };

    if (map.getSource('route')) {
      map.getSource('route').setData(geojson);
      // No fitBounds on update — prevents zoom-in on location polls
    } else {
      map.addSource('route', { type: 'geojson', data: geojson });
      map.addLayer({ id: 'route-casing', type: 'line', source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint:  { 'line-color': '#1e40af', 'line-width': 10, 'line-opacity': 0.4 } });
      map.addLayer({ id: 'route-line', type: 'line', source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint:  { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.9 } });
      // fitBounds only on first draw
      const lngs = coords.map(c => c[0]), lats = coords.map(c => c[1]);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: { top: 80, bottom: 220, left: 80, right: 80 }, duration: 800 }
      );
    }

    sendMessage('ROUTE_CALCULATED', {
      distance:      distanceText  || 'N/A',
      duration:      durationText  || 'N/A',
      distanceValue: distanceValue || 0,
      durationValue: durationValue || 0,
    });
  }

  function clearRoute() {
    if (map && map.getLayer('route-line'))   map.removeLayer('route-line');
    if (map && map.getLayer('route-casing')) map.removeLayer('route-casing');
    if (map && map.getSource('route'))       map.removeSource('route');
  }

  async function getIPLocation() {
    if (LOCAL_SERVER) {
      try {
        const r = await fetch(LOCAL_SERVER + '/api/ip-location');
        if (r.ok) { const d = await r.json(); if (d.latitude && d.longitude) return [d.longitude, d.latitude]; }
      } catch {}
    }
    try {
      const r = await fetch('https://ipapi.co/json/');
      if (r.ok) { const d = await r.json(); if (d.latitude && d.longitude) return [d.longitude, d.latitude]; }
    } catch {}
    return [${center.lng}, ${center.lat}];
  }

  async function nominatimSearch(query) {
    try {
      const r = await fetch(
        'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) +
        '&format=json&limit=7&addressdetails=1',
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!r.ok) return [];
      const data = await r.json();
      return data.map(item => ({
        place_id:       item.place_id?.toString(),
        main_text:      item.name || item.display_name?.split(',')[0],
        secondary_text: item.display_name,
        lat:            parseFloat(item.lat),
        lng:            parseFloat(item.lon),
        address:        item.display_name,
        name:           item.name || item.display_name?.split(',')[0],
      }));
    } catch { return []; }
  }

  async function initMap() {
    const initialCenter = await getIPLocation();
    let mapStyle = OPENFREE_STYLE;
    try {
      const test = await fetch('https://tiles.openfreemap.org/styles/liberty', {
        method: 'HEAD', signal: AbortSignal.timeout(4000),
      });
      if (!test.ok) throw new Error();
    } catch { mapStyle = buildFallbackStyle(); }

    map = new maplibregl.Map({
      container: 'map', style: mapStyle, center: initialCenter,
      zoom: ${zoom}, maxZoom: 22, minZoom: 2, pitch: 0, bearing: 0,
      attributionControl: false,
    });

    map.on('error', () => {
      if (!map._fallbackApplied) {
        map._fallbackApplied = true;
        try { map.setStyle(buildFallbackStyle()); } catch {}
      }
    });

    map.on('load', async () => {
      mapReady = true;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const loc = [pos.coords.longitude, pos.coords.latitude];
          map.flyTo({ center: loc, zoom: 15, duration: 1200 });
          if (markers['current-location']) markers['current-location'].remove();
          const el = createMarkerEl('current');
          markers['current-location'] = new maplibregl.Marker({ element: el }).setLngLat(loc).addTo(map);
        }, () => {});
      }
      sendMessage('MAP_LOADED');
    });

    map.on('click', (e) => {
      sendMessage('MAP_CLICKED', { location: { lat: e.lngLat.lat, lng: e.lngLat.lng } });
    });
  }

  window.addEventListener('message', async (event) => {
    const { type, mapId: rid, ...data } = event.data || {};
    if (rid !== mapId) return;

    switch (type) {

      case 'UPDATE_MARKERS': {
        Object.entries(markers).forEach(([id, m]) => {
          if (id !== 'current-location') { m.remove(); delete markers[id]; }
        });
        (data.markers || []).forEach(md => {
          if (!md.position) return;
          const el = createMarkerEl(md.type || 'default', md.custom ?? null);
          markers[md.id] = new maplibregl.Marker({ element: el })
            .setLngLat([
              md.position.lng || md.position.longitude,
              md.position.lat || md.position.latitude,
            ])
            .addTo(map);
        });
        break;
      }

      case 'CONFIGURE_DRIVER_MARKER': {
        driverMarkerConfig = data.config ?? null;
        if (driverMarker) {
          const lngLat = driverMarker.getLngLat();
          driverMarker.remove();
          const el = createMarkerEl('driver', driverMarkerConfig);
          driverMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
            .setLngLat(lngLat).addTo(map);
        }
        break;
      }

      case 'UPDATE_DRIVER_LOCATION': {
        const loc = data.location; if (!loc) break;
        const lngLat = [loc.lng || loc.longitude, loc.lat || loc.latitude];
        if (driverMarker) {
          driverMarker.setLngLat(lngLat);
        } else {
          const el = createMarkerEl('driver', driverMarkerConfig);
          driverMarker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
            .setLngLat(lngLat).addTo(map);
        }
        if (loc.heading != null) {
          driverMarker.getElement().style.transform = 'rotate(' + loc.heading + 'deg)';
          if (is3DMode) map.rotateTo(loc.heading, { duration: 500 });
        }
        break;
      }

      case 'SET_ROUTE_GEOMETRY': {
        if (!mapReady) {
          setTimeout(() => {
            renderRouteGeometry(
              data.geometry, data.distance, data.duration,
              data.distanceValue, data.durationValue
            );
          }, 500);
          break;
        }
        renderRouteGeometry(
          data.geometry, data.distance, data.duration,
          data.distanceValue, data.durationValue
        );
        break;
      }

      case 'CLEAR_ROUTE': clearRoute(); break;

      case 'ANIMATE_TO_LOCATION': {
        const loc = data.location; if (!loc || !map) break;
        map.flyTo({ center: [loc.lng || loc.longitude, loc.lat || loc.latitude], zoom: data.zoom || map.getZoom(), duration: 800 });
        break;
      }
      case 'SET_ZOOM':    if (map) map.setZoom(data.zoom); break;
      case 'ZOOM_IN':     if (map) map.setZoom(map.getZoom() + 1); break;
      case 'ZOOM_OUT':    if (map) map.setZoom(map.getZoom() - 1); break;
      case 'ENABLE_3D_MODE':  is3DMode = true;  map.easeTo({ pitch: 60, bearing: data.bearing || 0, duration: 800 }); break;
      case 'DISABLE_3D_MODE': is3DMode = false; map.easeTo({ pitch: 0,  bearing: 0, duration: 600 }); break;

      case 'GET_CURRENT_LOCATION':
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
            sendMessage('CURRENT_LOCATION_RESPONSE', { messageId: data.messageId, location: loc });
            const lngLat = [loc.lng, loc.lat];
            if (markers['current-location']) {
              markers['current-location'].setLngLat(lngLat);
            } else {
              const el = createMarkerEl('current');
              markers['current-location'] = new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
            }
          },
          () => sendMessage('CURRENT_LOCATION_RESPONSE', { messageId: data.messageId, location: null })
        );
        break;

      case 'SEARCH_LOCATION': {
        const results = await nominatimSearch(data.query);
        sendMessage('SEARCH_RESULTS', { messageId: data.messageId, results });
        break;
      }

      case 'GET_PLACE_DETAILS': {
        try {
          const r = await fetch(
            'https://nominatim.openstreetmap.org/lookup?osm_ids=N' + data.placeId + '&format=json'
          );
          if (r.ok) {
            const d = await r.json();
            if (d?.length > 0) {
              const item = d[0];
              sendMessage('PLACE_DETAILS', {
                messageId: data.messageId,
                location: {
                  lat:      parseFloat(item.lat),
                  lng:      parseFloat(item.lon),
                  address:  item.display_name,
                  name:     item.display_name?.split(',')[0],
                  place_id: data.placeId,
                },
              });
              break;
            }
          }
        } catch {}
        sendMessage('PLACE_DETAILS', { messageId: data.messageId, location: null });
        break;
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function MapIframe(props) {
  const mapsProvider   = useSafeMapProvider();
  const ready          = mapsProvider?.ready ?? true;
  const prioritizedMap = (ready ? mapsProvider?.prioritizedMap : null) || 'openstreetmap';

  const [wazeModalOpen, setWazeModalOpen] = useState(false);

  useEffect(() => {
    if (ready && prioritizedMap === 'wazemap') setWazeModalOpen(true);
  }, [ready, prioritizedMap]);

  const NativeComponent = NATIVE_COMPONENTS[prioritizedMap];
  const { height: _h = '100%', width: _w = '100%' } = props;
  const wrapSx = { position: 'relative', width: _w, height: _h, overflow: 'hidden' };

  if (!ready) return <Box sx={wrapSx}><MapLoading /></Box>;

  if (prioritizedMap === 'wazemap') {
    return (
      <Box sx={wrapSx}>
        <IframeMap {...props} />
        {!wazeModalOpen && (
          <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1300 }}>
            <Box
              component="button"
              onClick={() => setWazeModalOpen(true)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2, py: 1, bgcolor: '#08b4e0', color: '#fff',
                border: 'none', borderRadius: 3, fontWeight: 700, fontSize: 14,
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(8,180,224,0.45)',
                '&:hover': { bgcolor: '#0696bc' },
              }}
            >🚗 Open Waze Map</Box>
          </Box>
        )}
        <Suspense fallback={null}>
          <WazeMapModal
            open={wazeModalOpen}
            onClose={() => setWazeModalOpen(false)}
            onLocationSelected={(location, type) => {
              props.onMapClick?.(location);
              props.onWazeLocationSelected?.(location, type);
            }}
            initialCenter={props.center || { lat: -15.4167, lng: 28.2833 }}
            pickupLocation={props.pickupLocation}
            dropoffLocation={props.dropoffLocation}
            countryCode={props.countryCode}
          />
        </Suspense>
      </Box>
    );
  }

  if (NativeComponent) {
    return (
      <Box sx={wrapSx}>
        <NativeMapErrorBoundary fallbackProps={props}>
          <Suspense fallback={<MapLoading />}>
            <NativeMapWrapper NativeComponent={NativeComponent} prioritizedMap={prioritizedMap} {...props} />
          </Suspense>
        </NativeMapErrorBoundary>
      </Box>
    );
  }

  return <Box sx={wrapSx}><IframeMap {...props} /></Box>;
}

MapIframe.displayName = 'MapIframe';
export default MapIframe;

// ─────────────────────────────────────────────────────────────────────────────
// NativeMapWrapper
// ─────────────────────────────────────────────────────────────────────────────
function NativeMapWrapper({
  NativeComponent, prioritizedMap, center, zoom, markers,
  pickupLocation, dropoffLocation, onRouteCalculated, onMapClick, onMapLoad,
  showRoute, height, width,
}) {
  const mapsProvider = useSafeMapProvider();
  const controlsRef  = useRef(null);
  const [route, setRoute] = useState(null);

  useEffect(() => {
    if (!pickupLocation || !dropoffLocation) { setRoute(null); return; }
    let cancelled = false;
    async function fetchRoute() {
      if (mapsProvider?.getRoute) {
        const result = await mapsProvider.getRoute(pickupLocation, dropoffLocation);
        if (cancelled) return;
        if (result?.type === 'deeplink') {
          onRouteCalculated?.({ distance: 'N/A', duration: 'N/A', distanceValue: 0, durationValue: 0, viaApp: prioritizedMap });
        } else if (result?.geometry) {
          setRoute(result.geometry);
          onRouteCalculated?.({ distance: result.distance, duration: result.duration, distanceValue: result.distanceValue, durationValue: result.durationValue });
        }
      }
    }
    fetchRoute();
    return () => { cancelled = true; };
  }, [pickupLocation?.lat, pickupLocation?.lng, dropoffLocation?.lat, dropoffLocation?.lng]); // eslint-disable-line

  const handleNativeMapLoad = useCallback((nativeControls) => {
    controlsRef.current = nativeControls;
    const controls = {
      animateToLocation:     (loc, z)  => nativeControls?.animateToLocation?.(loc.lat ?? loc.latitude, loc.lng ?? loc.longitude, z),
      setZoom:               (z)       => nativeControls?.setZoom?.(z),
      zoomIn:                ()        => nativeControls?.zoomIn?.(),
      zoomOut:               ()        => nativeControls?.zoomOut?.(),
      enable3DMode:          (b)       => nativeControls?.enable3DMode?.(b),
      disable3DMode:         ()        => nativeControls?.disable3DMode?.(),
      clearRoute:            ()        => { setRoute(null); nativeControls?.clearRoute?.(); },
      toggleTraffic:         ()        => {},
      configureDriverMarker: ()        => {},
      updateDriverLocation:  (loc)     => nativeControls?.updateDriverLocation?.(loc.lat ?? loc.latitude, loc.lng ?? loc.longitude, loc.heading),
      getCurrentLocation:    (cb)      => nativeControls?.getCurrentLocation?.(cb),
      searchLocation: (query, cb) => {
        if (mapsProvider?.searchPlaces) {
          mapsProvider.searchPlaces(query).then(r => cb(r || [])).catch(() => cb([]));
        } else { cb([]); }
      },
      getPlaceDetails: (placeId, cb) => {
        if (mapsProvider?.getPlaceDetails) {
          mapsProvider.getPlaceDetails(placeId).then(r => cb(r)).catch(() => cb(null));
        } else { cb(null); }
      },
    };
    onMapLoad?.(controls);
  }, [onMapLoad, mapsProvider]);

  return (
    <div style={{ width: width || '100%', height: height || '100%', position: 'relative', minHeight: height === '100%' ? '400px' : undefined }}>
      <NativeComponent
        center={center} zoom={zoom} markers={markers}
        pickupLocation={pickupLocation} dropoffLocation={dropoffLocation}
        route={route} showRoute={!!(showRoute && route?.length)}
        onMapClick={onMapClick} onMapLoad={handleNativeMapLoad}
        height="100%" width="100%"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IframeMap
// ─────────────────────────────────────────────────────────────────────────────
const IframeMap = memo(({
  center          = { lat: -15.4167, lng: 28.2833 },
  zoom            = 13,
  markers         = [],
  pickupLocation  = null,
  dropoffLocation = null,
  onRouteCalculated,
  onMapClick,
  onMapLoad,
  showRoute       = false,
  height          = '100%',
  width           = '100%',
}) => {
  const iframeRef = useRef(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error,        setError]        = useState(null);
  const mapId             = useRef(`map-${Math.random().toString(36).substr(2, 9)}`).current;
  const localMapServerUrl = process.env.NEXT_PUBLIC_LOCALLY_HOSTED_MAP_SERVER_URL || '';

  // Extract only the function we need — NOT the whole mapsProvider object.
  // The mapsProvider object reference changes every time MapsProvider's internal
  // state changes (e.g. logRequest → setProviders). Using the whole object as a
  // dep causes the route effect to re-fire constantly, clearing and re-fetching
  // the route on every poll tick — the root cause of the "route not drawing"
  // and "mismatch" issues on the delivery tracking page.
  const mapsProvider = useSafeMapProvider();
  const getRoute     = mapsProvider?.getRoute;

  // ── FIX: memoize HTML once — iframe never reloads on re-render ───────────
  const srcDoc = useMemo(
    () => generateIframeContent({ mapId, center, zoom, localMapServerUrl }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── FIX: sendToIframe reads iframeLoaded from a ref — stable reference ───
  // Previously depended on iframeLoaded state, making sendToIframe change after
  // map load → createMapControls unstable → onMapLoad effect re-fires on every
  // render → configureDriverMarker called on every poll tick.
  const iframeLoadedRef = useRef(false);
  useEffect(() => { iframeLoadedRef.current = iframeLoaded; }, [iframeLoaded]);

  const sendToIframe = useCallback((type, data = {}) => {
    if (iframeRef.current && iframeLoadedRef.current) {
      iframeRef.current.contentWindow?.postMessage({ type, mapId, ...data }, '*');
    }
  }, [mapId]); // mapId is stable — no iframeLoaded dep needed

  const createMapControls = useCallback(() => ({
    animateToLocation:     (location, z) => sendToIframe('ANIMATE_TO_LOCATION', { location, zoom: z }),
    setZoom:               (z)           => sendToIframe('SET_ZOOM', { zoom: z }),
    zoomIn:                ()            => sendToIframe('ZOOM_IN'),
    zoomOut:               ()            => sendToIframe('ZOOM_OUT'),
    toggleTraffic:         ()            => sendToIframe('TOGGLE_TRAFFIC'),
    clearRoute:            ()            => sendToIframe('CLEAR_ROUTE'),
    updateDriverLocation:  (location)    => sendToIframe('UPDATE_DRIVER_LOCATION', { location }),
    enable3DMode:          (bearing)     => sendToIframe('ENABLE_3D_MODE', { bearing }),
    disable3DMode:         ()            => sendToIframe('DISABLE_3D_MODE'),
    configureDriverMarker: (config)      => sendToIframe('CONFIGURE_DRIVER_MARKER', { config }),
    getCurrentLocation: (callback) => {
      const messageId = Math.random().toString(36);
      const handler = (event) => {
        if (event.data.type === 'CURRENT_LOCATION_RESPONSE' && event.data.messageId === messageId) {
          callback(event.data.location);
          window.removeEventListener('message', handler);
        }
      };
      window.addEventListener('message', handler);
      sendToIframe('GET_CURRENT_LOCATION', { messageId });
    },
    searchLocation: (query, callback) => {
      const messageId = Math.random().toString(36);
      const handler = (event) => {
        if (event.data.type === 'SEARCH_RESULTS' && event.data.messageId === messageId) {
          callback(event.data.results);
          window.removeEventListener('message', handler);
        }
      };
      window.addEventListener('message', handler);
      sendToIframe('SEARCH_LOCATION', { query, messageId });
    },
    getPlaceDetails: (placeId, callback) => {
      const messageId = Math.random().toString(36);
      const handler = (event) => {
        if (event.data.type === 'PLACE_DETAILS' && event.data.messageId === messageId) {
          callback(event.data.location);
          window.removeEventListener('message', handler);
        }
      };
      window.addEventListener('message', handler);
      sendToIframe('GET_PLACE_DETAILS', { placeId, messageId });
    },
  }), [sendToIframe]);

  // ── FIX: onMapLoad accessed via ref — effect fires exactly once on load ───
  const onMapLoadRef = useRef(onMapLoad);
  useEffect(() => { onMapLoadRef.current = onMapLoad; }, [onMapLoad]);

  useEffect(() => {
    if (iframeLoaded) onMapLoadRef.current?.(createMapControls());
  }, [iframeLoaded, createMapControls]); // onMapLoad removed from deps

  // ── Marker sync with overriddenIds ghost-marker guard ────────────────────
  useEffect(() => {
    if (!iframeLoaded) return;
    const overriddenIds = new Set(markers.map(m => m.id));
    const markerData    = [];
    if (pickupLocation  && !overriddenIds.has('pickup'))
      markerData.push({ id: 'pickup',  position: pickupLocation,  type: 'pickup',  title: 'Pickup'  });
    if (dropoffLocation && !overriddenIds.has('dropoff'))
      markerData.push({ id: 'dropoff', position: dropoffLocation, type: 'dropoff', title: 'Dropoff' });
    markerData.push(...markers);
    sendToIframe('UPDATE_MARKERS', { markers: markerData });
  }, [markers, pickupLocation, dropoffLocation, iframeLoaded, sendToIframe]);

  // ── Route: fetch via MapsProvider then send geometry to iframe ────────────
  // Uses primitive lat/lng values (not objects) as deps — only re-runs when
  // coordinates actually change, not when the coord object reference changes.
  const pickupLat  = pickupLocation?.lat;
  const pickupLng  = pickupLocation?.lng;
  const dropoffLat = dropoffLocation?.lat;
  const dropoffLng = dropoffLocation?.lng;

  // ── FIX: onRouteCalculated via ref — removed from effect deps ─────────────
  // Previously `onRouteCalculated` and `mapsProvider` (whole object) were deps.
  // - mapsProvider object changes on every logRequest → setProviders → route
  //   effect re-fired → CLEAR_ROUTE sent → route disappeared every poll tick.
  // - onRouteCalculated being an inline arrow prop caused same re-fire pattern.
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  useEffect(() => { onRouteCalculatedRef.current = onRouteCalculated; }, [onRouteCalculated]);

  useEffect(() => {
    if (!iframeLoaded) return;

    if (pickupLat == null || pickupLng == null || dropoffLat == null || dropoffLng == null) {
      sendToIframe('CLEAR_ROUTE');
      return;
    }

    const origin      = { lat: pickupLat,  lng: pickupLng  };
    const destination = { lat: dropoffLat, lng: dropoffLng };
    let   cancelled   = false;

    async function fetchAndSendRoute() {
      try {
        let result = null;
        if (getRoute) {
          result = await getRoute(origin, destination);
        }
        if (cancelled) return;

        if (result?.type === 'deeplink') {
          onRouteCalculatedRef.current?.({ distance: 'N/A', duration: 'N/A', distanceValue: 0, durationValue: 0 });
          return;
        }

        if (result?.geometry?.length) {
          sendToIframe('SET_ROUTE_GEOMETRY', {
            geometry:      result.geometry,
            distance:      result.distance,
            duration:      result.duration,
            distanceValue: result.distanceValue ?? 0,
            durationValue: result.durationValue ?? 0,
          });
          onRouteCalculatedRef.current?.({
            distance:      result.distance,
            duration:      result.duration,
            distanceValue: result.distanceValue ?? 0,
            durationValue: result.durationValue ?? 0,
          });
          return;
        }
      } catch (err) {
        console.warn('[IframeMap] mapsProvider.getRoute failed:', err?.message);
      }

      if (cancelled) return;

      // Fallback: public OSRM
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
          `?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data  = await res.json();
          const route = data.routes?.[0];
          if (route && !cancelled) {
            const km  = route.distance / 1000;
            const min = route.duration / 60;
            sendToIframe('SET_ROUTE_GEOMETRY', {
              geometry:      route.geometry?.coordinates || [],
              distance:      km  >= 1 ? `${km.toFixed(1)} km`                              : `${Math.round(km * 1000)} m`,
              duration:      min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}min` : `${Math.round(min)} min`,
              distanceValue: route.distance,
              durationValue: route.duration,
            });
            onRouteCalculatedRef.current?.({ distance: `${km.toFixed(1)} km`, duration: `${Math.round(min)} min`, distanceValue: route.distance, durationValue: route.duration });
            return;
          }
        }
      } catch {}

      if (cancelled) return;

      // Absolute fallback: haversine straight-line
      const R    = 6371;
      const dLat = (destination.lat - origin.lat) * Math.PI / 180;
      const dLon = (destination.lng - origin.lng) * Math.PI / 180;
      const a    =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
      const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      sendToIframe('SET_ROUTE_GEOMETRY', {
        geometry:      [[origin.lng, origin.lat], [destination.lng, destination.lat]],
        distance:      `${km.toFixed(1)} km`,
        duration:      'N/A',
        distanceValue: Math.round(km * 1000),
        durationValue: 0,
      });
      onRouteCalculatedRef.current?.({ distance: `${km.toFixed(1)} km`, duration: 'N/A', distanceValue: Math.round(km * 1000), durationValue: 0 });
    }

    fetchAndSendRoute();
    return () => { cancelled = true; };

  // getRoute is the extracted stable function ref — not the whole mapsProvider.
  // onRouteCalculated accessed via ref — not a dep.
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, iframeLoaded, sendToIframe, getRoute]);

  // ── Message listener — callbacks via refs, registers only once ───────────
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  useEffect(() => {
    const handleMessage = (event) => {
      const { type, mapId: rid, ...data } = event.data;
      if (rid !== mapId) return;
      switch (type) {
        case 'MAP_LOADED':
          setIframeLoaded(true);
          setIsLoading(false);
          break;
        case 'ROUTE_CALCULATED':
          onRouteCalculatedRef.current?.(data);
          break;
        case 'MAP_CLICKED':
          onMapClickRef.current?.(data.location);
          break;
        case 'MAP_ERROR':
          console.error('Map iframe error:', data.error);
          setError(data.error);
          setIsLoading(false);
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mapId]); // mapId only — callbacks via refs above

  if (error) {
    return (
      <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'error.light', p: 3 }}>
        <Typography color="error.dark">Error loading map: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width, height }}>
      {isLoading && <MapLoading />}
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Map"
        allow="geolocation"
      />
    </Box>
  );
});

IframeMap.displayName = 'IframeMap';

// ─────────────────────────────────────────────────────────────────────────────
// MapLoading
// ─────────────────────────────────────────────────────────────────────────────
function MapLoading() {
  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, overflow: 'hidden', bgcolor: '#E8EEF4' }}>
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(110deg, #E8EEF4 30%, #F2F6FA 50%, #E8EEF4 70%)',
        backgroundSize: '200% 100%',
        animation: 'mapShimmer 1.6s ease-in-out infinite',
        '@keyframes mapShimmer': { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      }} />
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
        {[18, 38, 56, 72, 88].map((top, i) => (
          <Box key={`h${i}`} sx={{ position: 'absolute', left: 0, right: 0, top: `${top}%`, height: i % 2 === 0 ? 3 : 2, bgcolor: '#D0DAE4', borderRadius: 1 }} />
        ))}
        {[15, 32, 50, 68, 82].map((left, i) => (
          <Box key={`v${i}`} sx={{ position: 'absolute', top: 0, bottom: 0, left: `${left}%`, width: i % 2 === 0 ? 3 : 2, bgcolor: '#D0DAE4', borderRadius: 1 }} />
        ))}
      </Box>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          <CircularProgress size={28} thickness={3.5} sx={{ color: '#3b82f6' }} />
        </Box>
        <Box sx={{ px: 2, py: 0.75, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', fontSize: 11, letterSpacing: 0.3 }}>
            Loading map…
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}