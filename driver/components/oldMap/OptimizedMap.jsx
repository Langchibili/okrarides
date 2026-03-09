'use client';

import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Lusaka center
const defaultCenter = {
  lat: -15.4167,
  lng: 28.2833,
};

// Dark mode map style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
];

// Light mode - clean style
const lightMapStyle = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
];

export const OptimizedMap = memo(({
  center = defaultCenter,
  zoom = 13,
  markers = [],
  route = null,
  onMapClick,
  onMapLoad,
  showTraffic = false,
  children,
}) => {
  const theme = useTheme();
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Map options
  const mapOptions = useCallback(() => ({
    styles: theme.palette.mode === 'dark' ? darkMapStyle : lightMapStyle,
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    clickableIcons: false,
    minZoom: 10,
    maxZoom: 20,
    restriction: {
      latLngBounds: {
        north: -8.2,
        south: -18.1,
        west: 21.9,
        east: 33.7,
      },
      strictBounds: false,
    },
  }), [theme.palette.mode]);
  
  // On map load
  const handleLoad = useCallback((map) => {
    mapRef.current = map;
    setIsMapLoaded(true);
    
    // Fit bounds if markers exist
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend(marker.position);
      });
      map.fitBounds(bounds, { padding: 50 });
    }
    
    onMapLoad?.({
      map,
      animateToLocation: (location, zoom) => {
        map.panTo(location);
        if (zoom) map.setZoom(zoom);
      },
      fitBounds: (padding = 50) => {
        if (markers.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        markers.forEach(marker => {
          bounds.extend(marker.position);
        });
        map.fitBounds(bounds, { padding });
      },
    });
  }, [markers, onMapLoad]);
  
  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      options={mapOptions()}
      onLoad={handleLoad}
      onClick={onMapClick}
    >
      {/* Render markers */}
      {markers.map((marker, index) => (
        <Marker
          key={marker.id || index}
          position={marker.position}
          icon={marker.icon}
          title={marker.title}
          onClick={marker.onClick}
          animation={marker.animation}
        />
      ))}
      
      {/* Render route polyline */}
      {route && (
        <Polyline
          path={route.path}
          options={{
            strokeColor: theme.palette.primary.main,
            strokeOpacity: 1.0,
            strokeWeight: 4,
            geodesic: true,
          }}
        />
      )}
      
      {children}
    </GoogleMap>
  );
});

OptimizedMap.displayName = 'OptimizedMap';

// Loading skeleton
export const MapLoadingSkeleton = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      bgcolor: 'grey.200',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Box sx={{ textAlign: 'center' }}>
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Loading map...
      </Typography>
    </Box>
  </Box>
);