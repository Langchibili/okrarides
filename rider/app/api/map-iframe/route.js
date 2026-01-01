// app/api/map-iframe/route.ts
// Express/Node.js version
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('apiKey');
  const mapId = searchParams.get('mapId');
  const lat = searchParams.get('lat') || '-15.4167';
  const lng = searchParams.get('lng') || '28.2833';

  if (!apiKey) {
    return new Response('API key required', { status: 400 });
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Google Map</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body, html {
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: Arial, sans-serif;
        }
        
        #map {
          width: 100%;
          height: 100%;
        }
        
        .map-error {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f5f5f5;
          color: #666;
          text-align: center;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div id="error" class="map-error" style="display: none;"></div>
      
      <script>
        const mapId = '${mapId}';
        const initialLocation = { lat: ${lat}, lng: ${lng} };
        
        let map;
        let pickupMarker = null;
        let dropoffMarker = null;
        let directionsRenderer = null;
        let directionsService = null;
        
        function initMap() {
          try {
            map = new google.maps.Map(document.getElementById('map'), {
              center: initialLocation,
              zoom: 13,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: false,
              gestureHandling: 'greedy',
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            });
            
            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer({
              map: map,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#FFC107',
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            });
            
            notifyParent('MAP_LOADED');
          } catch (error) {
            showError('Failed to load map: ' + error.message);
            notifyParent('MAP_ERROR', { error: error.message });
          }
        }
        
        function updateMarkers(pickup, dropoff) {
          // Clear existing markers
          if (pickupMarker) pickupMarker.setMap(null);
          if (dropoffMarker) dropoffMarker.setMap(null);
          
          // Create pickup marker (green)
          if (pickup && pickup.placeId !== 'current_location') {
            pickupMarker = new google.maps.Marker({
              position: { lat: pickup.lat, lng: pickup.lng },
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4CAF50',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
                scale: 10
              },
              title: 'Pickup Location'
            });
          }
          
          // Create dropoff marker (red)
          if (dropoff) {
            dropoffMarker = new google.maps.Marker({
              position: { lat: dropoff.lat, lng: dropoff.lng },
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#F44336',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
                scale: 10
              },
              title: 'Dropoff Location'
            });
          }
          
          // Fit bounds if both markers exist
          if (pickup && dropoff) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: pickup.lat, lng: pickup.lng });
            bounds.extend({ lat: dropoff.lat, lng: dropoff.lng });
            map.fitBounds(bounds, { padding: 80 });
          } else if (pickup) {
            map.panTo({ lat: pickup.lat, lng: pickup.lng });
            map.setZoom(15);
          } else if (dropoff) {
            map.panTo({ lat: dropoff.lat, lng: dropoff.lng });
            map.setZoom(15);
          }
        }
        
        function drawRoute(pickup, dropoff) {
          if (!pickup || !dropoff || !directionsService || !directionsRenderer) {
            if (directionsRenderer) {
              directionsRenderer.setMap(null);
            }
            return;
          }
          
          const request = {
            origin: { lat: pickup.lat, lng: pickup.lng },
            destination: { lat: dropoff.lat, lng: dropoff.lng },
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true
          };
          
          directionsService.route(request, (result, status) => {
            if (status === 'OK') {
              directionsRenderer.setDirections(result);
              
              // Send route info back to parent
              const route = result.routes[0];
              const leg = route.legs[0];
              
              notifyParent('ROUTE_CALCULATED', {
                distance: leg.distance.text,
                duration: leg.duration.text,
                distanceValue: leg.distance.value,
                durationValue: leg.duration.value
              });
            } else {
              console.error('Directions request failed:', status);
              notifyParent('ROUTE_ERROR', { error: status });
            }
          });
        }
        
        function animateToLocation(location, zoom) {
          if (map && location) {
            map.panTo({ lat: location.lat, lng: location.lng });
            if (zoom) {
              map.setZoom(zoom);
            }
          }
        }
        
        function setZoom(zoom) {
          if (map) {
            map.setZoom(zoom);
          }
        }
        
        function notifyParent(type, data = {}) {
          window.parent.postMessage({
            type,
            mapId,
            ...data
          }, '*');
        }
        
        function showError(message) {
          const errorEl = document.getElementById('error');
          errorEl.textContent = message;
          errorEl.style.display = 'flex';
          document.getElementById('map').style.display = 'none';
        }
        
        // Listen for messages from parent
        window.addEventListener('message', (event) => {
          const { type, mapId: receivedMapId, ...data } = event.data;
          
          if (receivedMapId !== mapId) return;
          
          switch (type) {
            case 'UPDATE_MARKERS':
              updateMarkers(data.pickup, data.dropoff);
              break;
            case 'DRAW_ROUTE':
              drawRoute(data.pickup, data.dropoff);
              break;
            case 'ANIMATE_TO_LOCATION':
              animateToLocation(data.location, data.zoom);
              break;
            case 'SET_ZOOM':
              setZoom(data.zoom);
              break;
            case 'CLEAR_ROUTE':
              if (directionsRenderer) {
                directionsRenderer.setMap(null);
              }
              break;
          }
        });
        
        // Load Google Maps
        function loadGoogleMaps() {
          const script = document.createElement('script');
          script.src = \`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap\`;
          script.async = true;
          script.defer = true;
          script.onerror = () => {
            showError('Failed to load Google Maps');
            notifyParent('MAP_ERROR', { error: 'Script load failed' });
          };
          document.head.appendChild(script);
        }
        
        window.addEventListener('load', loadGoogleMaps);
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}