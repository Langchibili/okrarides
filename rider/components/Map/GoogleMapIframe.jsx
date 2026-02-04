// // ============================================
// // File: components/Map/GoogleMapIframe.jsx
// // ============================================
// 'use client';

// import { memo, useEffect, useRef, useState, useCallback } from 'react';
// import { Box, CircularProgress, Typography } from '@mui/material';

// export const GoogleMapIframe = memo(({
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

//   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

//   const sendToIframe = useCallback((type, data = {}) => {
//     if (iframeRef.current && iframeLoaded) {
//       iframeRef.current.contentWindow?.postMessage({
//         type,
//         mapId,
//         ...data,
//       }, '*');
//     }
//   }, [iframeLoaded, mapId]);

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

//   useEffect(() => {
//     if (iframeLoaded && onMapLoad) {
//       onMapLoad(createMapControls());
//     }
//   }, [iframeLoaded, onMapLoad, createMapControls]);

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

//   useEffect(() => {
//     if (!iframeLoaded) return;
//     sendToIframe('SET_TRAFFIC', { show: showTraffic });
//   }, [showTraffic, iframeLoaded, sendToIframe]);

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
//           if (onRouteCalculated) onRouteCalculated(data);
//           break;
//         case 'MAP_CLICKED':
//           if (onMapClick) onMapClick(data.location);
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

//   const generateIframeContent = () => {
//     return `<!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1">
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
//       let map, markers = {}, directionsService, directionsRenderer, trafficLayer, autocompleteService, placesService;

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
//               strokeColor: '#1976d2',
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

//         const marker = new google.maps.Marker({
//           position: markerData.position,
//           map: map,
//           icon: {
//             path: google.maps.SymbolPath.CIRCLE,
//             fillColor: colors[markerData.type] || '#1976d2',
//             fillOpacity: 1,
//             strokeColor: '#FFFFFF',
//             strokeWeight: 3,
//             scale: 10
//           },
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
// </html>`;
//   };

//   if (!apiKey) {
//     return (
//       <Box
//         sx={{
//           width,
//           height,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           bgcolor: 'error.light',
//           p: 3,
//         }}
//       >
//         <Typography color="error.dark">
//           Google Maps API key is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env
//         </Typography>
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box
//         sx={{
//           width,
//           height,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           bgcolor: 'error.light',
//           p: 3,
//         }}
//       >
//         <Typography color="error.dark">
//           Error loading map: {error}
//         </Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ position: 'relative', width, height }}>
//       {isLoading && (
//         <Box
//           sx={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             justifyContent: 'center',
//             bgcolor: 'grey.200',
//             zIndex: 1,
//           }}
//         >
//           <CircularProgress size={40} sx={{ mb: 2 }} />
//           <Typography variant="body2" color="text.secondary">
//             Loading map...
//           </Typography>
//         </Box>
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
//     </Box>
//   );
// });

// GoogleMapIframe.displayName = 'GoogleMapIframe';

// export default GoogleMapIframe;
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
            maxZoom: 22,
            minZoom: 3,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            clickableIcons: true
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

          // Automatically get and display user's current location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const currentLoc = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                
                // Create red marker for current location
                markers['current-location'] = createMarker({
                  id: 'current-location',
                  position: currentLoc,
                  type: 'current',
                  title: 'My Location'
                });
              },
              (error) => {
                console.log('Geolocation error:', error.message);
              }
            );
          }

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
          station: '#2196F3',
          current: '#FF0000'
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
                  const currentLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    address: 'Current Location'
                  };
                  
                  // Add red marker for current location
                  if (markers['current-location']) {
                    markers['current-location'].setMap(null);
                  }
                  markers['current-location'] = createMarker({
                    id: 'current-location',
                    position: currentLoc,
                    type: 'current',
                    title: 'My Location'
                  });
                  
                  sendMessage('CURRENT_LOCATION_RESPONSE', {
                    messageId: data.messageId,
                    location: currentLoc
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
          {/* Google Maps API key is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env
           */}
           Error in loading map
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