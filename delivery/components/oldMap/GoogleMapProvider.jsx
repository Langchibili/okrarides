// 'use client';

// import { LoadScript } from '@react-google-maps/api';
// import { memo, useEffect } from 'react';
// import { Box, CircularProgress, Typography } from '@mui/material';

// const libraries = ['places', 'geometry', 'drawing'];

// // Loading skeleton for map
// const MapLoadingSkeleton = () => (
//   <Box
//     sx={{
//       width: '100%',
//       height: '100%',
//       bgcolor: 'grey.200',
//       position: 'relative',
//       overflow: 'hidden',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//     }}
//   >
//     <Box sx={{ textAlign: 'center' }}>
//       <CircularProgress size={40} sx={{ mb: 2 }} />
//       <Typography variant="body2" color="text.secondary">
//         Loading map...
//       </Typography>
//     </Box>
//   </Box>
// );

// // Memoized to prevent re-renders
// export const GoogleMapProvider = memo(({ children }) => {
//   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

//   // Inject critical CSS fixes on mount
//   useEffect(() => {
//     // Create style element if it doesn't exist
//     if (!document.getElementById('google-maps-fix')) {
//       const style = document.createElement('style');
//       style.id = 'google-maps-fix';
//       style.textContent = `
//         /* Critical fixes for Google Maps */
//         .gm-style img,
//         .gm-style-iw img {
//           max-width: none !important;
//           box-sizing: content-box !important;
//         }
        
//         .gm-style input,
//         .gm-style-iw input {
//           box-sizing: content-box !important;
//           border: none !important;
//           margin: 0 !important;
//           padding: 0 !important;
//         }
        
//         .gm-style button,
//         .gm-style-iw button {
//           box-sizing: content-box !important;
//         }
        
//         .gm-style label {
//           width: auto !important;
//           display: inline !important;
//         }
        
//         .gm-style * {
//           box-sizing: content-box !important;
//         }
        
//         .google-map-container {
//           isolation: isolate;
//         }
//       `;
//       document.head.appendChild(style);
//     }

//     // Cleanup on unmount
//     return () => {
//       const style = document.getElementById('google-maps-fix');
//       if (style) {
//         style.remove();
//       }
//     };
//   }, []);

//   if (!apiKey) {
//     return (
//       <Box
//         sx={{
//           width: '100%',
//           height: '100%',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           bgcolor: 'error.light',
//           p: 3,
//         }}
//       >
//         <Typography color="error.dark">
//           Google Maps API key is not configured
//         </Typography>
//       </Box>
//     );
//   }

//   return (
//     <div className="google-map-container">
//       <LoadScript
//         googleMapsApiKey={apiKey}
//         libraries={libraries}
//         loadingElement={<MapLoadingSkeleton />}
//         preventGoogleFontsLoading
//         version="weekly"
//         language="en"
//         region="ZM"
//       >
//         {children}
//       </LoadScript>
//     </div>
//   );
// });

// GoogleMapProvider.displayName = 'GoogleMapProvider';

// export default GoogleMapProvider;

// 'use client';

// import { useJsApiLoader } from '@react-google-maps/api';
// import { memo, useEffect, useState } from 'react';
// import { Box, CircularProgress, Typography } from '@mui/material';

// const libraries = ['places', 'geometry', 'drawing'];

// // Loading skeleton for map
// const MapLoadingSkeleton = () => (
//   <Box
//     sx={{
//       width: '100%',
//       height: '100%',
//       bgcolor: 'grey.200',
//       position: 'relative',
//       overflow: 'hidden',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//     }}
//   >
//     <Box sx={{ textAlign: 'center' }}>
//       <CircularProgress size={40} sx={{ mb: 2 }} />
//       <Typography variant="body2" color="text.secondary">
//         Loading map...
//       </Typography>
//     </Box>
//   </Box>
// );

// // Inject CSS fixes BEFORE Google Maps loads
// const injectMapCssFixes = () => {
//   if (typeof document === 'undefined') return;
  
//   // Remove existing style if present
//   const existingStyle = document.getElementById('google-maps-css-fix');
//   if (existingStyle) return; // Already injected
  
//   const style = document.createElement('style');
//   style.id = 'google-maps-css-fix';
//   style.textContent = `
//     /* Prevent Google Maps from breaking Material-UI */
    
//     /* Isolate Google Maps styles */
//     .gm-style img {
//       max-width: none !important;
//     }
    
//     .gm-style input,
//     .gm-style select,
//     .gm-style textarea {
//       box-sizing: content-box !important;
//     }
    
//     .gm-style button {
//       box-sizing: content-box !important;
//     }
    
//     /* Keep Material-UI styles outside of map */
//     body img:not(.gm-style img):not(.gm-style-iw img) {
//       max-width: 100%;
//     }
    
//     body input:not(.gm-style input):not(.gm-style-iw input),
//     body select:not(.gm-style select):not(.gm-style-iw select),
//     body textarea:not(.gm-style textarea):not(.gm-style-iw textarea) {
//       box-sizing: border-box !important;
//     }
    
//     body button:not(.gm-style button):not(.gm-style-iw button) {
//       box-sizing: border-box !important;
//     }
    
//     /* Prevent global CSS pollution from Google Maps */
//     .MuiTextField-root,
//     .MuiOutlinedInput-root,
//     .MuiInput-root,
//     .MuiButton-root,
//     .MuiIconButton-root,
//     .MuiChip-root {
//       box-sizing: border-box !important;
//     }
    
//     .MuiTextField-root *,
//     .MuiOutlinedInput-root *,
//     .MuiInput-root *,
//     .MuiButton-root *,
//     .MuiIconButton-root *,
//     .MuiChip-root * {
//       box-sizing: border-box !important;
//     }
//   `;
  
//   document.head.insertBefore(style, document.head.firstChild);
// };

// // Memoized to prevent re-renders
// export const GoogleMapProvider = memo(({ children }) => {
//   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
//   const [cssInjected, setCssInjected] = useState(false);

//   // Inject CSS fixes BEFORE loading Google Maps
//   useEffect(() => {
//     injectMapCssFixes();
//     setCssInjected(true);
//   }, []);

//   // Use the hook instead of LoadScript component
//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: apiKey || '',
//     libraries,
//     preventGoogleFontsLoading: true,
//     version: 'weekly',
//     language: 'en',
//     region: 'ZM',
//   });

//   // Reapply fixes after Google Maps loads
//   useEffect(() => {
//     if (isLoaded) {
//       // Small delay to ensure Google Maps CSS is fully loaded
//       setTimeout(() => {
//         injectMapCssFixes();
//       }, 100);
//     }
//   }, [isLoaded]);

//   if (!apiKey) {
//     return (
//       <Box
//         sx={{
//           width: '100%',
//           height: '100%',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           bgcolor: 'error.light',
//           p: 3,
//         }}
//       >
//         <Typography color="error.dark">
//           Google Maps API key is not configured
//         </Typography>
//       </Box>
//     );
//   }

//   if (loadError) {
//     return (
//       <Box
//         sx={{
//           width: '100%',
//           height: '100%',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           bgcolor: 'error.light',
//           p: 3,
//         }}
//       >
//         <Typography color="error.dark">
//           Error loading Google Maps
//         </Typography>
//       </Box>
//     );
//   }

//   if (!isLoaded || !cssInjected) {
//     return <MapLoadingSkeleton />;
//   }

//   return <>{children}</>;
// });

// GoogleMapProvider.displayName = 'GoogleMapProvider';

// export default GoogleMapProvider;
'use client';

import { useJsApiLoader } from '@react-google-maps/api';
import { memo, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const libraries = ['places', 'geometry', 'drawing'];

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
    <Box sx={{ textAlign: 'center' }}>
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Loading map...
      </Typography>
    </Box>
  </Box>
);

// More aggressive CSS isolation
const injectMapCssFixes = () => {
  if (typeof document === 'undefined') return;
  
  const existingStyle = document.getElementById('google-maps-css-fix');
  if (existingStyle) return;
  
  const style = document.createElement('style');
  style.id = 'google-maps-css-fix';
  style.textContent = `
    /* COMPREHENSIVE GOOGLE MAPS CSS ISOLATION */
    
    /* CRITICAL: Reset Google Maps global styles */
    body:has(.gm-style) {
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
    }
    
    /* Isolate Google Maps completely */
    .gm-style * {
      font-family: Roboto, Arial, sans-serif !important;
    }
    
    /* Protect all non-map elements */
    body *:not(.gm-style):not(.gm-style *):not([class^="gm-"]) {
      box-sizing: border-box !important;
    }
    
    /* Specifically protect Material-UI components */
    .MuiContainer-root,
    .MuiBox-root,
    .MuiGrid-root,
    .MuiPaper-root,
    .MuiCard-root,
    .MuiButton-root,
    .MuiTextField-root,
    .MuiInputBase-root,
    .MuiOutlinedInput-root,
    .MuiInput-root,
    .MuiSelect-root,
    .MuiMenuItem-root,
    .MuiTypography-root,
    .MuiAppBar-root,
    .MuiToolbar-root,
    .MuiIconButton-root,
    .MuiChip-root,
    .MuiAvatar-root,
    .MuiListItem-root,
    .MuiTable-root,
    .MuiTableCell-root,
    .MuiDrawer-root,
    .MuiModal-root,
    .MuiDialog-root {
      box-sizing: border-box !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
    }
    
    /* Protect all MUI children */
    .MuiContainer-root *,
    .MuiBox-root *,
    .MuiGrid-root *,
    .MuiPaper-root *,
    .MuiCard-root *,
    .MuiButton-root *,
    .MuiTextField-root *,
    .MuiInputBase-root *,
    .MuiOutlinedInput-root *,
    .MuiInput-root *,
    .MuiSelect-root *,
    .MuiMenuItem-root *,
    .MuiTypography-root *,
    .MuiAppBar-root *,
    .MuiToolbar-root *,
    .MuiIconButton-root *,
    .MuiChip-root *,
    .MuiAvatar-root *,
    .MuiListItem-root *,
    .MuiTable-root *,
    .MuiTableCell-root *,
    .MuiDrawer-root *,
    .MuiModal-root *,
    .MuiDialog-root * {
      box-sizing: border-box !important;
    }
    
    /* Reset specific problematic Google Maps styles */
    .gm-style div,
    .gm-style span,
    .gm-style label,
    .gm-style a {
      font-family: Roboto, Arial, sans-serif !important;
    }
    
    /* Protect form elements outside map */
    input:not(.gm-style input):not(.gm-style-iw input),
    select:not(.gm-style select):not(.gm-style-iw select),
    textarea:not(.gm-style textarea):not(.gm-style-iw textarea),
    button:not(.gm-style button):not(.gm-style-iw button) {
      box-sizing: border-box !important;
      font-family: inherit !important;
      appearance: auto !important;
    }
    
    /* Protect images outside map */
    img:not(.gm-style img):not(.gm-style-iw img) {
      max-width: 100% !important;
      height: auto !important;
    }
    
    /* Prevent Google Maps font overrides */
    body, html {
      font-family: inherit !important;
    }
    
    /* Specific fix for buttons - Google Maps removes borders */
    button {
      border: none;
    }
    
    button.MuiButton-root {
      border: initial !important;
    }
  `;
  
  document.head.insertBefore(style, document.head.firstChild);
};

export const GoogleMapProvider = memo(({ children }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [cssInjected, setCssInjected] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Inject CSS fixes BEFORE loading Google Maps
  useEffect(() => {
    injectMapCssFixes();
    setCssInjected(true);
    
    // Force re-render after a delay to reapply styles
    const timer = setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries,
    preventGoogleFontsLoading: true,
    version: 'weekly',
    language: 'en',
    region: 'ZM',
    // Add nonce if you have CSP
    // nonce: "your-nonce-here"
  });

  // Reapply fixes after Google Maps loads
  useEffect(() => {
    if (isLoaded) {
      // Multiple re-applications to ensure styles stick
      setTimeout(() => {
        injectMapCssFixes();
        // Force style recalculation
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
      }, 100);
      
      setTimeout(() => {
        injectMapCssFixes();
      }, 500);
    }
  }, [isLoaded, forceUpdate]);

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

  if (loadError) {
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
          Error loading Google Maps
        </Typography>
      </Box>
    );
  }

  if (!isLoaded || !cssInjected) {
    return <MapLoadingSkeleton />;
  }

  return (
    <div key={`map-provider-${forceUpdate}`}>
      {children}
    </div>
  );
});

GoogleMapProvider.displayName = 'GoogleMapProvider';

export default GoogleMapProvider;