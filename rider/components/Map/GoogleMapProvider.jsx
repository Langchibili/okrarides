'use client';

import { LoadScript } from '@react-google-maps/api';
import { memo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const libraries = ['places', 'geometry', 'drawing'];

// Loading skeleton for map
const MapLoadingSkeleton = () => (
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
    <Box
      sx={{
        textAlign: 'center',
      }}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Loading map...
      </Typography>
    </Box>
  </Box>
);

// Memoized to prevent re-renders
export const GoogleMapProvider = memo(({ children }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'error.light',
          p: 3,
        }}
      >
        <Typography color="error.dark">
          Google Maps API key is not configured
        </Typography>
      </Box>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      loadingElement={<MapLoadingSkeleton />}
      preventGoogleFontsLoading // Performance: Don't load Google fonts
      version="weekly" // Use latest stable version
      language="en"
      region="ZM" // Zambia
    >
      {children}
    </LoadScript>
  );
});

GoogleMapProvider.displayName = 'GoogleMapProvider';

export default GoogleMapProvider;
