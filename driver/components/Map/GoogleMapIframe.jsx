// // // components/Map/GoogleMapIframe.jsx
// // 'use client';

// // import { memo, useEffect, useRef, useState, useCallback } from 'react';
// // import { Box, CircularProgress, Typography } from '@mui/material';

// // export const GoogleMapIframe = memo(({
// //   center = { lat: -15.4167, lng: 28.2833 },
// //   zoom = 13,
// //   pickupLocation = null,
// //   dropoffLocation = null,
// //   onRouteCalculated,
// //   onMapLoad,
// //   height = '100%',
// //   width = '100%',
// // }) => {
// //   const iframeRef = useRef(null);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [iframeLoaded, setIframeLoaded] = useState(false);
// //   const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`).current;
  
// //   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// //   // Send message to iframe
// //   const sendToIframe = useCallback((type, data = {}) => {
// //     if (iframeRef.current && iframeLoaded) {
// //       iframeRef.current.contentWindow?.postMessage({
// //         type,
// //         mapId,
// //         ...data,
// //       }, '*');
// //     }
// //   }, [iframeLoaded, mapId]);

// //   // Update markers when locations change
// //   useEffect(() => {
// //     if (!iframeLoaded) return;
    
// //     sendToIframe('UPDATE_MARKERS', {
// //       pickup: pickupLocation,
// //       dropoff: dropoffLocation,
// //     });
    
// //     // Draw route if both locations exist
// //     if (pickupLocation && dropoffLocation) {
// //       sendToIframe('DRAW_ROUTE', {
// //         pickup: pickupLocation,
// //         dropoff: dropoffLocation,
// //       });
// //     } else {
// //       sendToIframe('CLEAR_ROUTE');
// //     }
// //   }, [pickupLocation, dropoffLocation, iframeLoaded, sendToIframe]);

// //   // Provide controls to parent
// //   useEffect(() => {
// //     if (!iframeLoaded || !onMapLoad) return;
    
// //     onMapLoad({
// //       animateToLocation: (location, zoom) => {
// //         sendToIframe('ANIMATE_TO_LOCATION', { location, zoom });
// //       },
// //       setZoom: (zoom) => {
// //         sendToIframe('SET_ZOOM', { zoom });
// //       },
// //       clearRoute: () => {
// //         sendToIframe('CLEAR_ROUTE');
// //       },
// //     });
// //   }, [iframeLoaded, onMapLoad, sendToIframe]);

// //   // Listen for messages from iframe
// //   useEffect(() => {
// //     const handleMessage = (event) => {
// //       const { type, mapId: receivedMapId, ...data } = event.data;
      
// //       if (receivedMapId !== mapId) return;
      
// //       switch (type) {
// //         case 'MAP_LOADED':
// //           setIframeLoaded(true);
// //           setIsLoading(false);
// //           break;
// //         case 'ROUTE_CALCULATED':
// //           if (onRouteCalculated) {
// //             onRouteCalculated(data);
// //           }
// //           break;
// //         case 'MAP_ERROR':
// //           console.error('Map error:', data.error);
// //           setIsLoading(false);
// //           break;
// //       }
// //     };

// //     window.addEventListener('message', handleMessage);
// //     return () => window.removeEventListener('message', handleMessage);
// //   }, [mapId, onRouteCalculated]);

// //   // Generate iframe URL
// //   const iframeSrc = useCallback(() => {
// //     const params = new URLSearchParams({
// //       apiKey,
// //       mapId,
// //       lat: center.lat.toString(),
// //       lng: center.lng.toString(),
// //     });
// //     return `/api/map-iframe?${params.toString()}`;
// //   }, [apiKey, mapId, center]);

// //   if (!apiKey) {
// //     return (
// //       <Box
// //         sx={{
// //           width,
// //           height,
// //           display: 'flex',
// //           alignItems: 'center',
// //           justifyContent: 'center',
// //           bgcolor: 'error.light',
// //           p: 3,
// //         }}
// //       >
// //         <Typography color="error.dark">
// //           Google Maps API key is not configured
// //         </Typography>
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box sx={{ position: 'relative', width, height }}>
// //       {isLoading && (
// //         <Box
// //           sx={{
// //             position: 'absolute',
// //             top: 0,
// //             left: 0,
// //             right: 0,
// //             bottom: 0,
// //             display: 'flex',
// //             flexDirection: 'column',
// //             alignItems: 'center',
// //             justifyContent: 'center',
// //             bgcolor: 'grey.200',
// //             zIndex: 1,
// //           }}
// //         >
// //           <CircularProgress size={40} sx={{ mb: 2 }} />
// //           <Typography variant="body2" color="text.secondary">
// //             Loading map...
// //           </Typography>
// //         </Box>
// //       )}
      
// //       <iframe
// //         ref={iframeRef}
// //         src={iframeSrc()}
// //         style={{
// //           width: '100%',
// //           height: '100%',
// //           border: 'none',
// //           display: 'block',
// //         }}
// //         title="Google Maps"
// //         allow="geolocation"
// //         loading="lazy"
// //       />
// //     </Box>
// //   );
// // });

// // GoogleMapIframe.displayName = 'GoogleMapIframe';
// import { memo, useEffect, useRef, useState, useCallback } from 'react';
// import { Search, X, MapPin, Navigation, Plus, Minus, AlertCircle } from 'lucide-react';

// // ============= LOCATION SEARCH COMPONENT =============
// const LocationSearch = memo(({ onSelectLocation, placeholder = "Search location", autoFocus = false, mapControls }) => {
//   const [query, setQuery] = useState('');
//   const [predictions, setPredictions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const searchTimeout = useRef(null);

//   const handleInputChange = (e) => {
//     const value = e.target.value;
//     setQuery(value);

//     if (searchTimeout.current) clearTimeout(searchTimeout.current);

//     if (!value || value.length < 3) {
//       setPredictions([]);
//       return;
//     }

//     setLoading(true);
//     searchTimeout.current = setTimeout(() => {
//       if (mapControls) {
//         mapControls.searchLocation(value, (results) => {
//           setPredictions(results || []);
//           setLoading(false);
//         });
//       }
//     }, 300);
//   };

//   const handleSelectPrediction = (prediction) => {
//     if (mapControls) {
//       mapControls.getPlaceDetails(prediction.place_id, (location) => {
//         if (location) {
//           onSelectLocation(location);
//           setQuery(location.address);
//           setPredictions([]);
//         }
//       });
//     }
//   };

//   const handleUseCurrentLocation = () => {
//     if (mapControls) {
//       mapControls.getCurrentLocation((location) => {
//         if (location) {
//           onSelectLocation(location);
//           setQuery('Current Location');
//           setPredictions([]);
//         }
//       });
//     }
//   };

//   const handleClear = () => {
//     setQuery('');
//     setPredictions([]);
//   };

//   return (
//     <div className="relative w-full">
//       <div className="relative">
//         <div className="absolute left-3 top-1/2 -translate-y-1/2">
//           {loading ? (
//             <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
//           ) : (
//             <Search className="w-5 h-5 text-gray-400" />
//           )}
//         </div>
//         <input
//           type="text"
//           value={query}
//           onChange={handleInputChange}
//           placeholder={placeholder}
//           autoFocus={autoFocus}
//           className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white shadow-sm"
//         />
//         {query && (
//           <button
//             onClick={handleClear}
//             className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
//           >
//             <X className="w-4 h-4 text-gray-400" />
//           </button>
//         )}
//       </div>

//       {predictions.length > 0 && (
//         <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-auto z-50">
//           <button
//             onClick={handleUseCurrentLocation}
//             className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100"
//           >
//             <Navigation className="w-5 h-5 text-yellow-500" />
//             <span className="font-semibold text-yellow-600">Use Current Location</span>
//           </button>

//           {predictions.map((prediction) => (
//             <button
//               key={prediction.place_id}
//               onClick={() => handleSelectPrediction(prediction)}
//               className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
//             >
//               <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
//               <div className="flex-1 min-w-0">
//                 <div className="font-medium text-gray-900 truncate">{prediction.main_text}</div>
//                 <div className="text-sm text-gray-500 truncate">{prediction.secondary_text}</div>
//               </div>
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// });

// LocationSearch.displayName = 'LocationSearch';

// // ============= MAP CONTROLS COMPONENT =============
// const MapControls = memo(({ onLocateMe, onZoomIn, onZoomOut, onToggleTraffic, showTraffic = false, style = {} }) => {
//   return (
//     <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden" style={style}>
//       <button
//         onClick={onLocateMe}
//         className="p-3 hover:bg-gray-100 border-b border-gray-200"
//         title="My Location"
//       >
//         <Navigation className="w-5 h-5" />
//       </button>

//       <button
//         onClick={onZoomIn}
//         className="p-2 hover:bg-gray-100 border-b border-gray-200"
//         title="Zoom In"
//       >
//         <Plus className="w-5 h-5" />
//       </button>

//       <button
//         onClick={onZoomOut}
//         className="p-2 hover:bg-gray-100 border-b border-gray-200"
//         title="Zoom Out"
//       >
//         <Minus className="w-5 h-5" />
//       </button>

//       {onToggleTraffic && (
//         <button
//           onClick={onToggleTraffic}
//           className={`p-3 hover:bg-gray-100 ${showTraffic ? 'text-yellow-600' : ''}`}
//           title="Toggle Traffic"
//         >
//           <AlertCircle className="w-5 h-5" />
//         </button>
//       )}
//     </div>
//   );
// });

// MapControls.displayName = 'MapControls';

// // ============= GOOGLE MAP IFRAME COMPONENT =============
// const GoogleMapIframe = memo(({
//   center = { lat: -15.4167, lng: 28.2833 },
//   zoom = 13,
//   markers = [],
//   pickupLocation = null,
//   dropoffLocation = null,
//   onRouteCalculated,
//   onMapClick,
//   onMapLoad,
//   showTraffic = false,
//   height = '100%',
//   width = '100%',
// }) => {
//   const iframeRef = useRef(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [iframeLoaded, setIframeLoaded] = useState(false);
//   const [error, setError] = useState(null);
//   const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`).current;

//   const apiKey = 'YOUR_API_KEY_HERE'; // Replace with your actual API key

//   // Send message to iframe
//   const sendToIframe = useCallback((type, data = {}) => {
//     if (iframeRef.current && iframeLoaded) {
//       iframeRef.current.contentWindow?.postMessage({
//         type,
//         mapId,
//         ...data,
//       }, '*');
//     }
//   }, [iframeLoaded, mapId]);

//   // Create map controls interface
//   const createMapControls = useCallback(() => ({
//     animateToLocation: (location, zoom) => {
//       sendToIframe('ANIMATE_TO_LOCATION', { location, zoom });
//     },
//     setZoom: (zoom) => {
//       sendToIframe('SET_ZOOM', { zoom });
//     },
//     zoomIn: () => {
//       sendToIframe('ZOOM_IN');
//     },
//     zoomOut: () => {
//       sendToIframe('ZOOM_OUT');
//     },
//     toggleTraffic: () => {
//       sendToIframe('TOGGLE_TRAFFIC');
//     },
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
//     clearRoute: () => {
//       sendToIframe('CLEAR_ROUTE');
//     },
//   }), [sendToIframe]);

//   // Notify parent when map is loaded
//   useEffect(() => {
//     if (iframeLoaded && onMapLoad) {
//       onMapLoad(createMapControls());
//     }
//   }, [iframeLoaded, onMapLoad, createMapControls]);

//   // Update markers
//   useEffect(() => {
//     if (!iframeLoaded) return;

//     const markerData = [];

//     if (pickupLocation) {
//       markerData.push({
//         id: 'pickup',
//         position: pickupLocation,
//         type: 'pickup',
//         title: 'Pickup Location',
//       });
//     }

//     if (dropoffLocation) {
//       markerData.push({
//         id: 'dropoff',
//         position: dropoffLocation,
//         type: 'dropoff',
//         title: 'Dropoff Location',
//       });
//     }

//     markerData.push(...markers);

//     sendToIframe('UPDATE_MARKERS', { markers: markerData });

//     if (pickupLocation && dropoffLocation) {
//       sendToIframe('DRAW_ROUTE', {
//         pickup: pickupLocation,
//         dropoff: dropoffLocation,
//       });
//     } else {
//       sendToIframe('CLEAR_ROUTE');
//     }
//   }, [markers, pickupLocation, dropoffLocation, iframeLoaded, sendToIframe]);

//   // Update traffic
//   useEffect(() => {
//     if (!iframeLoaded) return;
//     sendToIframe('SET_TRAFFIC', { show: showTraffic });
//   }, [showTraffic, iframeLoaded, sendToIframe]);

//   // Listen for messages from iframe
//   useEffect(() => {
//     const handleMessage = (event) => {
//       const { type, mapId: receivedMapId, ...data } = event.data;

//       if (receivedMapId !== mapId) return;

//       switch (type) {
//         case 'MAP_LOADED':
//           setIframeLoaded(true);
//           setIsLoading(false);
//           break;
//         case 'ROUTE_CALCULATED':
//           if (onRouteCalculated) {
//             onRouteCalculated(data);
//           }
//           break;
//         case 'MAP_CLICKED':
//           if (onMapClick) {
//             onMapClick(data.location);
//           }
//           break;
//         case 'MAP_ERROR':
//           console.error('Map error:', data.error);
//           setError(data.error);
//           setIsLoading(false);
//           break;
//       }
//     };

//     window.addEventListener('message', handleMessage);
//     return () => window.removeEventListener('message', handleMessage);
//   }, [mapId, onRouteCalculated, onMapClick]);

//   // Generate iframe HTML content
//   const generateIframeContent = () => {
//     return `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1">
//   <title>Google Maps</title>
//   <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,drawing"></script>
//   <style>
//     * { margin: 0; padding: 0; box-sizing: border-box; }
//     html, body, #map { width: 100%; height: 100%; }
//   </style>
// </head>
// <body>
//   <div id="map"></div>
//   <script>
//     (function() {
//       const mapId = '${mapId}';
//       let map, markers = {}, polyline, trafficLayer, directionsService, directionsRenderer;
//       let autocompleteService, placesService;

//       function initMap() {
//         try {
//           map = new google.maps.Map(document.getElementById('map'), {
//             center: { lat: ${center.lat}, lng: ${center.lng} },
//             zoom: ${zoom},
//             disableDefaultUI: true,
//             zoomControl: false,
//             mapTypeControl: false,
//             streetViewControl: false,
//             fullscreenControl: false,
//             gestureHandling: 'greedy',
//             clickableIcons: false,
//             styles: [
//               { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
//               { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
//             ]
//           });

//           directionsService = new google.maps.DirectionsService();
//           directionsRenderer = new google.maps.DirectionsRenderer({
//             map: map,
//             suppressMarkers: true,
//             polylineOptions: {
//               strokeColor: '#FFC107',
//               strokeWeight: 4,
//               strokeOpacity: 0.8
//             }
//           });

//           trafficLayer = new google.maps.TrafficLayer();
//           autocompleteService = new google.maps.places.AutocompleteService();
//           placesService = new google.maps.places.PlacesService(map);

//           map.addListener('click', (e) => {
//             sendMessage('MAP_CLICKED', {
//               location: { lat: e.latLng.lat(), lng: e.latLng.lng() }
//             });
//           });

//           sendMessage('MAP_LOADED');
//         } catch (error) {
//           sendMessage('MAP_ERROR', { error: error.message });
//         }
//       }

//       function createMarker(markerData) {
//         const colors = {
//           pickup: '#4CAF50',
//           dropoff: '#F44336',
//           driver: '#FFC107',
//           station: '#2196F3'
//         };

//         const icon = {
//           path: google.maps.SymbolPath.CIRCLE,
//           fillColor: colors[markerData.type] || '#FFC107',
//           fillOpacity: 1,
//           strokeColor: '#FFFFFF',
//           strokeWeight: 3,
//           scale: 10
//         };

//         const marker = new google.maps.Marker({
//           position: markerData.position,
//           map: map,
//           icon: icon,
//           title: markerData.title,
//           animation: markerData.animation ? google.maps.Animation.BOUNCE : null
//         });

//         if (markerData.onClick) {
//           marker.addListener('click', () => {
//             sendMessage('MARKER_CLICKED', { markerId: markerData.id });
//           });
//         }

//         return marker;
//       }

//       function drawRoute(pickup, dropoff) {
//         if (!directionsService || !directionsRenderer) return;

//         directionsService.route({
//           origin: pickup,
//           destination: dropoff,
//           travelMode: google.maps.TravelMode.DRIVING
//         }, (result, status) => {
//           if (status === 'OK') {
//             directionsRenderer.setDirections(result);
//             const route = result.routes[0];
//             const leg = route.legs[0];
//             sendMessage('ROUTE_CALCULATED', {
//               distance: leg.distance.text,
//               duration: leg.duration.text,
//               distanceValue: leg.distance.value,
//               durationValue: leg.duration.value
//             });
//           } else {
//             sendMessage('ROUTE_ERROR', { error: status });
//           }
//         });
//       }

//       function sendMessage(type, data = {}) {
//         window.parent.postMessage({ type, mapId, ...data }, '*');
//       }

//       window.addEventListener('message', (event) => {
//         const { type, mapId: receivedMapId, ...data } = event.data;
//         if (receivedMapId !== mapId) return;

//         switch (type) {
//           case 'UPDATE_MARKERS':
//             Object.values(markers).forEach(m => m.setMap(null));
//             markers = {};
//             if (data.markers) {
//               data.markers.forEach(markerData => {
//                 markers[markerData.id] = createMarker(markerData);
//               });
//             }
//             break;

//           case 'DRAW_ROUTE':
//             drawRoute(data.pickup, data.dropoff);
//             break;

//           case 'CLEAR_ROUTE':
//             if (directionsRenderer) {
//               directionsRenderer.setDirections({ routes: [] });
//             }
//             break;

//           case 'ANIMATE_TO_LOCATION':
//             if (map) {
//               map.panTo(data.location);
//               if (data.zoom) map.setZoom(data.zoom);
//             }
//             break;

//           case 'SET_ZOOM':
//             if (map) map.setZoom(data.zoom);
//             break;

//           case 'ZOOM_IN':
//             if (map) map.setZoom(map.getZoom() + 1);
//             break;

//           case 'ZOOM_OUT':
//             if (map) map.setZoom(map.getZoom() - 1);
//             break;

//           case 'TOGGLE_TRAFFIC':
//             if (trafficLayer) {
//               trafficLayer.setMap(trafficLayer.getMap() ? null : map);
//             }
//             break;

//           case 'SET_TRAFFIC':
//             if (trafficLayer) {
//               trafficLayer.setMap(data.show ? map : null);
//             }
//             break;

//           case 'GET_CURRENT_LOCATION':
//             if (navigator.geolocation) {
//               navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                   sendMessage('CURRENT_LOCATION_RESPONSE', {
//                     messageId: data.messageId,
//                     location: {
//                       lat: position.coords.latitude,
//                       lng: position.coords.longitude,
//                       address: 'Current Location'
//                     }
//                   });
//                 },
//                 (error) => {
//                   sendMessage('CURRENT_LOCATION_RESPONSE', {
//                     messageId: data.messageId,
//                     location: null,
//                     error: error.message
//                   });
//                 }
//               );
//             }
//             break;

//           case 'SEARCH_LOCATION':
//             if (autocompleteService) {
//               autocompleteService.getPlacePredictions({
//                 input: data.query,
//                 componentRestrictions: { country: 'zm' },
//                 types: ['geocode', 'establishment']
//               }, (results, status) => {
//                 if (status === google.maps.places.PlacesServiceStatus.OK) {
//                   const formatted = results.map(r => ({
//                     place_id: r.place_id,
//                     main_text: r.structured_formatting.main_text,
//                     secondary_text: r.structured_formatting.secondary_text
//                   }));
//                   sendMessage('SEARCH_RESULTS', {
//                     messageId: data.messageId,
//                     results: formatted
//                   });
//                 } else {
//                   sendMessage('SEARCH_RESULTS', {
//                     messageId: data.messageId,
//                     results: []
//                   });
//                 }
//               });
//             }
//             break;

//           case 'GET_PLACE_DETAILS':
//             if (placesService) {
//               placesService.getDetails({
//                 placeId: data.placeId,
//                 fields: ['geometry', 'formatted_address', 'name']
//               }, (place, status) => {
//                 if (status === google.maps.places.PlacesServiceStatus.OK) {
//                   sendMessage('PLACE_DETAILS', {
//                     messageId: data.messageId,
//                     location: {
//                       lat: place.geometry.location.lat(),
//                       lng: place.geometry.location.lng(),
//                       address: place.formatted_address,
//                       name: place.name,
//                       placeId: data.placeId
//                     }
//                   });
//                 } else {
//                   sendMessage('PLACE_DETAILS', {
//                     messageId: data.messageId,
//                     location: null
//                   });
//                 }
//               });
//             }
//             break;
//         }
//       });

//       if (document.readyState === 'loading') {
//         document.addEventListener('DOMContentLoaded', initMap);
//       } else {
//         initMap();
//       }
//     })();
//   </script>
// </body>
// </html>
//     `;
//   };

//   if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
//     return (
//       <div className="w-full h-full flex items-center justify-center bg-red-50 p-6" style={{ width, height }}>
//         <div className="text-center">
//           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <p className="text-red-700 font-semibold">Google Maps API key not configured</p>
//           <p className="text-sm text-red-600 mt-2">
//             Please replace 'YOUR_API_KEY_HERE' with your actual Google Maps API key
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="w-full h-full flex items-center justify-center bg-red-50 p-6" style={{ width, height }}>
//         <div className="text-center">
//           <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <p className="text-red-700 font-semibold">Error loading map</p>
//           <p className="text-sm text-red-600 mt-2">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="relative" style={{ width, height }}>
//       {isLoading && (
//         <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
//           <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
//           <p className="text-gray-600">Loading map...</p>
//         </div>
//       )}

//       <iframe
//         ref={iframeRef}
//         srcDoc={generateIframeContent()}
//         style={{
//           width: '100%',
//           height: '100%',
//           border: 'none',
//           display: 'block',
//         }}
//         title="Google Maps"
//         allow="geolocation"
//       />
//     </div>
//   );
// });

// GoogleMapIframe.displayName = 'GoogleMapIframe';

// // ============= DEMO COMPONENT =============
// export default function IntegratedMapDemo() {
//   const [pickupLocation, setPickupLocation] = useState(null);
//   const [dropoffLocation, setDropoffLocation] = useState(null);
//   const [showTraffic, setShowTraffic] = useState(false);
//   const [routeInfo, setRouteInfo] = useState(null);
//   const [mapControls, setMapControls] = useState(null);

//   const handlePickupSelect = (location) => {
//     setPickupLocation(location);
//     if (mapControls) {
//       mapControls.animateToLocation(location, 15);
//     }
//   };

//   const handleDropoffSelect = (location) => {
//     setDropoffLocation(location);
//     if (mapControls) {
//       mapControls.animateToLocation(location, 15);
//     }
//   };

//   const handleLocateMe = () => {
//     if (mapControls) {
//       mapControls.getCurrentLocation((location) => {
//         if (location) {
//           mapControls.animateToLocation(location, 15);
//         }
//       });
//     }
//   };

//   const handleZoomIn = () => {
//     if (mapControls) mapControls.zoomIn();
//   };

//   const handleZoomOut = () => {
//     if (mapControls) mapControls.zoomOut();
//   };

//   const handleToggleTraffic = () => {
//     setShowTraffic(!showTraffic);
//   };

//   const handleRouteCalculated = (data) => {
//     setRouteInfo(data);
//   };

//   return (
//     <div className="w-screen h-screen flex flex-col bg-gray-50">
//       {/* Search Bar */}
//       <div className="bg-white shadow-md p-4 z-10">
//         <div className="max-w-6xl mx-auto">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <LocationSearch
//               placeholder="Enter pickup location"
//               onSelectLocation={handlePickupSelect}
//               mapControls={mapControls}
//             />
//             <LocationSearch
//               placeholder="Enter dropoff location"
//               onSelectLocation={handleDropoffSelect}
//               mapControls={mapControls}
//             />
//           </div>

//           {/* Route Info */}
//           {routeInfo && (
//             <div className="mt-4 text-center text-sm text-gray-600">
//               <span className="font-semibold">Distance:</span> {routeInfo.distance}
//               <span className="mx-3">•</span>
//               <span className="font-semibold">Duration:</span> {routeInfo.duration}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Map Container */}
//       <div className="flex-1 relative">
//         <GoogleMapIframe
//           pickupLocation={pickupLocation}
//           dropoffLocation={dropoffLocation}
//           showTraffic={showTraffic}
//           onRouteCalculated={handleRouteCalculated}
//           onMapClick={(location) => console.log('Map clicked:', location)}
//           onMapLoad={setMapControls}
//         />

//         {/* Map Controls */}
//         <MapControls
//           onLocateMe={handleLocateMe}
//           onZoomIn={handleZoomIn}
//           onZoomOut={handleZoomOut}
//           onToggleTraffic={handleToggleTraffic}
//           showTraffic={showTraffic}
//           style={{
//             position: 'absolute',
//             right: '16px',
//             bottom: '16px',
//           }}
//         />
//       </div>
//     </div>
//   );
// }
// ============================================

// ============================================
// File: components/Map/GoogleMapIframe.jsx
// ============================================
'use client';

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const GoogleMapIframe = memo(({
  center = { lat: -15.4167, lng: 28.2833 },
  zoom = 13,
  markers = [],
  pickupLocation = null,
  dropoffLocation = null,
  onRouteCalculated,
  onMapClick,
  onMapLoad,
  showTraffic = false,
  height = '100%',
  width = '100%',
}) => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`).current;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const sendToIframe = useCallback((type, data = {}) => {
    if (iframeRef.current && iframeLoaded) {
      iframeRef.current.contentWindow?.postMessage({
        type,
        mapId,
        ...data,
      }, '*');
    }
  }, [iframeLoaded, mapId]);

  const createMapControls = useCallback(() => ({
    animateToLocation: (location, zoom) => {
      sendToIframe('ANIMATE_TO_LOCATION', { location, zoom });
    },
    setZoom: (zoom) => {
      sendToIframe('SET_ZOOM', { zoom });
    },
    zoomIn: () => {
      sendToIframe('ZOOM_IN');
    },
    zoomOut: () => {
      sendToIframe('ZOOM_OUT');
    },
    toggleTraffic: () => {
      sendToIframe('TOGGLE_TRAFFIC');
    },
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
    clearRoute: () => {
      sendToIframe('CLEAR_ROUTE');
    },
  }), [sendToIframe]);

  useEffect(() => {
    if (iframeLoaded && onMapLoad) {
      onMapLoad(createMapControls());
    }
  }, [iframeLoaded, onMapLoad, createMapControls]);

  useEffect(() => {
    if (!iframeLoaded) return;

    const markerData = [];

    if (pickupLocation) {
      markerData.push({
        id: 'pickup',
        position: pickupLocation,
        type: 'pickup',
        title: 'Pickup Location',
      });
    }

    if (dropoffLocation) {
      markerData.push({
        id: 'dropoff',
        position: dropoffLocation,
        type: 'dropoff',
        title: 'Dropoff Location',
      });
    }

    markerData.push(...markers);
    sendToIframe('UPDATE_MARKERS', { markers: markerData });

    if (pickupLocation && dropoffLocation) {
      sendToIframe('DRAW_ROUTE', {
        pickup: pickupLocation,
        dropoff: dropoffLocation,
      });
    } else {
      sendToIframe('CLEAR_ROUTE');
    }
  }, [markers, pickupLocation, dropoffLocation, iframeLoaded, sendToIframe]);

  useEffect(() => {
    if (!iframeLoaded) return;
    sendToIframe('SET_TRAFFIC', { show: showTraffic });
  }, [showTraffic, iframeLoaded, sendToIframe]);

  useEffect(() => {
    const handleMessage = (event) => {
      const { type, mapId: receivedMapId, ...data } = event.data;
      if (receivedMapId !== mapId) return;

      switch (type) {
        case 'MAP_LOADED':
          setIframeLoaded(true);
          setIsLoading(false);
          break;
        case 'ROUTE_CALCULATED':
          if (onRouteCalculated) onRouteCalculated(data);
          break;
        case 'MAP_CLICKED':
          if (onMapClick) onMapClick(data.location);
          break;
        case 'MAP_ERROR':
          console.error('Map error:', data.error);
          setError(data.error);
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mapId, onRouteCalculated, onMapClick]);

  const generateIframeContent = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,drawing"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      const mapId = '${mapId}';
      let map, markers = {}, directionsService, directionsRenderer, trafficLayer, autocompleteService, placesService;

      function initMap() {
        try {
          map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: ${center.lat}, lng: ${center.lng} },
            zoom: ${zoom},
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            clickableIcons: false,
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
              { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
            ]
          });

          directionsService = new google.maps.DirectionsService();
          directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#1976d2',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          });

          trafficLayer = new google.maps.TrafficLayer();
          autocompleteService = new google.maps.places.AutocompleteService();
          placesService = new google.maps.places.PlacesService(map);

          map.addListener('click', (e) => {
            sendMessage('MAP_CLICKED', {
              location: { lat: e.latLng.lat(), lng: e.latLng.lng() }
            });
          });

          sendMessage('MAP_LOADED');
        } catch (error) {
          sendMessage('MAP_ERROR', { error: error.message });
        }
      }

      function createMarker(markerData) {
        const colors = {
          pickup: '#4CAF50',
          dropoff: '#F44336',
          driver: '#FFC107',
          station: '#2196F3'
        };

        const marker = new google.maps.Marker({
          position: markerData.position,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: colors[markerData.type] || '#1976d2',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
            scale: 10
          },
          title: markerData.title,
          animation: markerData.animation ? google.maps.Animation.BOUNCE : null
        });

        if (markerData.onClick) {
          marker.addListener('click', () => {
            sendMessage('MARKER_CLICKED', { markerId: markerData.id });
          });
        }

        return marker;
      }

      function drawRoute(pickup, dropoff) {
        if (!directionsService || !directionsRenderer) return;

        directionsService.route({
          origin: pickup,
          destination: dropoff,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            const route = result.routes[0];
            const leg = route.legs[0];
            sendMessage('ROUTE_CALCULATED', {
              distance: leg.distance.text,
              duration: leg.duration.text,
              distanceValue: leg.distance.value,
              durationValue: leg.duration.value
            });
          } else {
            sendMessage('ROUTE_ERROR', { error: status });
          }
        });
      }

      function sendMessage(type, data = {}) {
        window.parent.postMessage({ type, mapId, ...data }, '*');
      }

      window.addEventListener('message', (event) => {
        const { type, mapId: receivedMapId, ...data } = event.data;
        if (receivedMapId !== mapId) return;

        switch (type) {
          case 'UPDATE_MARKERS':
            Object.values(markers).forEach(m => m.setMap(null));
            markers = {};
            if (data.markers) {
              data.markers.forEach(markerData => {
                markers[markerData.id] = createMarker(markerData);
              });
            }
            break;

          case 'DRAW_ROUTE':
            drawRoute(data.pickup, data.dropoff);
            break;

          case 'CLEAR_ROUTE':
            if (directionsRenderer) {
              directionsRenderer.setDirections({ routes: [] });
            }
            break;

          case 'ANIMATE_TO_LOCATION':
            if (map) {
              map.panTo(data.location);
              if (data.zoom) map.setZoom(data.zoom);
            }
            break;

          case 'SET_ZOOM':
            if (map) map.setZoom(data.zoom);
            break;

          case 'ZOOM_IN':
            if (map) map.setZoom(map.getZoom() + 1);
            break;

          case 'ZOOM_OUT':
            if (map) map.setZoom(map.getZoom() - 1);
            break;

          case 'TOGGLE_TRAFFIC':
            if (trafficLayer) {
              trafficLayer.setMap(trafficLayer.getMap() ? null : map);
            }
            break;

          case 'SET_TRAFFIC':
            if (trafficLayer) {
              trafficLayer.setMap(data.show ? map : null);
            }
            break;

          case 'GET_CURRENT_LOCATION':
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  sendMessage('CURRENT_LOCATION_RESPONSE', {
                    messageId: data.messageId,
                    location: {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                      address: 'Current Location'
                    }
                  });
                },
                (error) => {
                  sendMessage('CURRENT_LOCATION_RESPONSE', {
                    messageId: data.messageId,
                    location: null,
                    error: error.message
                  });
                }
              );
            }
            break;

          case 'SEARCH_LOCATION':
            if (autocompleteService) {
              autocompleteService.getPlacePredictions({
                input: data.query,
                componentRestrictions: { country: 'zm' },
                types: ['geocode', 'establishment']
              }, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                  const formatted = results.map(r => ({
                    place_id: r.place_id,
                    main_text: r.structured_formatting.main_text,
                    secondary_text: r.structured_formatting.secondary_text
                  }));
                  sendMessage('SEARCH_RESULTS', {
                    messageId: data.messageId,
                    results: formatted
                  });
                } else {
                  sendMessage('SEARCH_RESULTS', {
                    messageId: data.messageId,
                    results: []
                  });
                }
              });
            }
            break;

          case 'GET_PLACE_DETAILS':
            if (placesService) {
              placesService.getDetails({
                placeId: data.placeId,
                fields: ['geometry', 'formatted_address', 'name']
              }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                  sendMessage('PLACE_DETAILS', {
                    messageId: data.messageId,
                    location: {
                      lat: place.geometry.location.lat(),
                      lng: place.geometry.location.lng(),
                      address: place.formatted_address,
                      name: place.name,
                      placeId: data.placeId
                    }
                  });
                } else {
                  sendMessage('PLACE_DETAILS', {
                    messageId: data.messageId,
                    location: null
                  });
                }
              });
            }
            break;
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
  };

  if (!apiKey) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'error.light',
          p: 3,
        }}
      >
        <Typography color="error.dark">
          Google Maps API key is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'error.light',
          p: 3,
        }}
      >
        <Typography color="error.dark">
          Error loading map: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width, height }}>
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200',
            zIndex: 1,
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading map...
          </Typography>
        </Box>
      )}

      <iframe
        ref={iframeRef}
        srcDoc={generateIframeContent()}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title="Google Maps"
        allow="geolocation"
      />
    </Box>
  );
});

GoogleMapIframe.displayName = 'GoogleMapIframe';

export default GoogleMapIframe;

// ============================================
// File: app/page.jsx (Example Usage)
// ============================================


// import { useState } from 'react';
// import { Box, Container, Grid, Typography, Paper } from '@mui/material';
// import { LocationSearch } from '@/components/Map/LocationSearch';
// import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
// import { MapControls } from '@/components/Map/MapControls';

// export default function MapPage() {
//   const [pickupLocation, setPickupLocation] = useState(null);
//   const [dropoffLocation, setDropoffLocation] = useState(null);
//   const [showTraffic, setShowTraffic] = useState(false);
//   const [routeInfo, setRouteInfo] = useState(null);
//   const [mapControls, setMapControls] = useState(null);

//   const handlePickupSelect = (location) => {
//     setPickupLocation(location);
//     if (mapControls) {
//       mapControls.animateToLocation(location, 15);
//     }
//   };

//   const handleDropoffSelect = (location) => {
//     setDropoffLocation(location);
//     if (mapControls) {
//       mapControls.animateToLocation(location, 15);
//     }
//   };

//   const handleLocateMe = () => {
//     if (mapControls) {
//       mapControls.getCurrentLocation((location) => {
//         if (location) {
//           mapControls.animateToLocation(location, 15);
//         }
//       });
//     }
//   };

//   return (
//     <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
//       {/* Search Section - Separate from Map */}
//       <Paper elevation={2} sx={{ zIndex: 10 }}>
//         <Container maxWidth="lg" sx={{ py: 2 }}>
//           <Grid container spacing={2}>
//             <Grid item xs={12} md={6}>
//               <LocationSearch
//                 placeholder="Enter pickup location"
//                 onSelectLocation={handlePickupSelect}
//                 mapControls={mapControls}
//               />
//             </Grid>
//             <Grid item xs={12} md={6}>
//               <LocationSearch
//                 placeholder="Enter dropoff location"
//                 onSelectLocation={handleDropoffSelect}
//                 mapControls={mapControls}
//               />
//             </Grid>
//           </Grid>

//           {routeInfo && (
//             <Box sx={{ mt: 2, textAlign: 'center' }}>
//               <Typography variant="body2" color="text.secondary">
//                 <strong>Distance:</strong> {routeInfo.distance} •{' '}
//                 <strong>Duration:</strong> {routeInfo.duration}
//               </Typography>
//             </Box>
//           )}
//         </Container>
//       </Paper>

//       {/* Map Container */}
//       <Box sx={{ flex: 1, position: 'relative', bgcolor: 'grey.300' }}>
//         <GoogleMapIframe
//           pickupLocation={pickupLocation}
//           dropoffLocation={dropoffLocation}
//           showTraffic={showTraffic}
//           onRouteCalculated={setRouteInfo}
//           onMapLoad={setMapControls}
//         />

//         {/* Map Controls - Positioned on Map */}
//         <MapControls
//           onLocateMe={handleLocateMe}
//           onZoomIn={() => mapControls?.zoomIn()}
//           onZoomOut={() => mapControls?.zoomOut()}
//           onToggleTraffic={() => setShowTraffic(!showTraffic)}
//           showTraffic={showTraffic}
//           style={{
//             position: 'absolute',
//             right: 16,
//             bottom: 16,
//           }}
//         />
//       </Box>
//     </Box>
//   );
// }