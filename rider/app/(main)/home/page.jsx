// // File: rider/app/(main)/home/page.tsx
// // ============================================
// 'use client';
// import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   AppBar,
//   Toolbar,
//   IconButton,
//   Avatar,
//   Typography,
//   Button,
//   Badge,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   CircularProgress,
//   Backdrop,
// } from '@mui/material';
// import {
//   Menu as MenuIcon,
//   Notifications as NotificationsIcon,
//   Navigation as NavigationIcon,
//   Place as PlaceIcon,
//   LocationOn as LocationIcon,
//   MyLocation as MyLocationIcon,
//   Close as CloseIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useGeolocation } from '@/lib/hooks/useGeolocation';
// import { useRide } from '@/lib/hooks/useRide';
// import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
// import { MapControls } from '@/components/Map/MapControls';
// import { LocationSearch } from '@/components/Map/LocationSearch';
// import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
// import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
// import ClientOnly from '@/components/ClientOnly';

// export default function HomePage() {
//   const router = useRouter();
//   const { user } = useAuth();
//   const { location, loading: locationLoading, refresh } = useGeolocation({ watch: true });
//   const { activeRide } = useRide();

//   const [mapCenter, setMapCenter] = useState(null);
//   const [pickupLocation, setPickupLocation] = useState(null);
//   const [dropoffLocation, setDropoffLocation] = useState(null);
//   const [showLocationSheet, setShowLocationSheet] = useState(true);
//   const [showRideOptions, setShowRideOptions] = useState(false);
//   const [recentLocations, setRecentLocations] = useState([]);
//   const [mapControls, setMapControls] = useState(null);
//   const [isRelocating, setIsRelocating] = useState(false);
//   const [routeInfo, setRouteInfo] = useState(null);
//   const [activeInput, setActiveInput] = useState(null);

//   // Redirect if there's an active ride
//   useEffect(() => {
//     if (activeRide) {
//       router.push(`/tracking?rideId=${activeRide.id}`);
//     }
//   }, [activeRide, router]);

//   // Set initial map center and pickup to user's location
//   useEffect(() => {
//     if (location && !pickupLocation) {
//       const currentLoc = {
//         lat: location.lat,
//         lng: location.lng,
//         address: 'Current Location',
//         name: 'Current Location',
//         placeId: 'current_location',
//       };
//       setMapCenter({ lat: location.lat, lng: location.lng });
//       setPickupLocation(currentLoc);
//     }
//   }, [location, pickupLocation]);

//   // Load recent locations
//   useEffect(() => {
//     const loadRecentLocations = () => {
//       if (typeof window !== 'undefined') {
//         const saved = localStorage.getItem('okra_rides_recent_locations');
//         if (saved) {
//           try {
//             setRecentLocations(JSON.parse(saved));
//           } catch (error) {
//             console.error('Error loading recent locations:', error);
//           }
//         }
//       }
//     };
//     loadRecentLocations();
//   }, []);

//   // Save location to recent
//   const saveToRecent = useCallback((location) => {
//     if (location.address === 'Current Location' || location.placeId === 'current_location') return;

//     const newRecent = [
//       location,
//       ...recentLocations.filter((l) =>
//         l.placeId !== location.placeId && l.address !== location.address
//       ),
//     ].slice(0, 5);

//     setRecentLocations(newRecent);
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('okra_rides_recent_locations', JSON.stringify(newRecent));
//     }
//   }, [recentLocations]);

//   // Handle location selection
//   const handlePickupSelect = (location) => {
//     setPickupLocation(location);
//     saveToRecent(location);
//     if (mapControls) {
//       mapControls.animateToLocation(location, 15);
//     }
//     setActiveInput(null);
//   };

//   const handleDropoffSelect = (location) => {
//     setDropoffLocation(location);
//     saveToRecent(location);
//     if (mapControls) {
//       mapControls.animateToLocation(location, 15);
//     }
//     setActiveInput(null);
//   };

//   // Select recent location
//   const handleSelectRecentLocation = (loc) => {
//     if (!pickupLocation || pickupLocation.placeId === 'current_location') {
//       handlePickupSelect(loc);
//     } else if (!dropoffLocation) {
//       handleDropoffSelect(loc);
//     } else {
//       // If both are set, replace dropoff
//       handleDropoffSelect(loc);
//     }
//   };

//   const handleConfirmRide = async (rideDetails) => {
//     try {
//       const params = new URLSearchParams({
//         pickup: JSON.stringify(pickupLocation),
//         dropoff: JSON.stringify(dropoffLocation),
//         ...rideDetails,
//       });
//       router.push(`/finding-driver?${params.toString()}`);
//     } catch (error) {
//       console.error('Error confirming ride:', error);
//       alert('Failed to book ride. Please try again.');
//     }
//   };

//   const handleReset = () => {
//     if (location) {
//       const currentLoc = {
//         lat: location.lat,
//         lng: location.lng,
//         address: 'Current Location',
//         name: 'Current Location',
//         placeId: 'current_location',
//       };
//       setPickupLocation(currentLoc);
//     } else {
//       setPickupLocation(null);
//     }
//     setDropoffLocation(null);
//     setShowRideOptions(false);
//     setShowLocationSheet(true);
//     setRouteInfo(null);
//     setActiveInput(null);
//   };

//   const handleRelocate = async () => {
//     try {
//       setIsRelocating(true);
//       await refresh();

//       setTimeout(() => {
//         if (location && mapControls) {
//           mapControls.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
//         }
//       }, 300);

//       setTimeout(() => {
//         setIsRelocating(false);
//       }, 1500);
//     } catch (error) {
//       console.error('Relocation error:', error);
//       setIsRelocating(false);
//     }
//   };

//   if (locationLoading && !location) {
//     return (
//       <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <CircularProgress size={32} />
//         <Typography sx={{ mt: 2, color: 'text.secondary' }}>
//           Getting your location...
//         </Typography>
//       </Box>
//     );
//   }

//   return (
//     <ClientOnly>
//       <Box sx={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
//         {/* Map Container */}
//         <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
//           <GoogleMapIframe
//             center={mapCenter || (location ? { lat: location.lat, lng: location.lng } : { lat: -15.4167, lng: 28.2833 })}
//             zoom={13}
//             pickupLocation={pickupLocation}
//             dropoffLocation={dropoffLocation}
//             onMapLoad={setMapControls}
//             onRouteCalculated={setRouteInfo}
//           />
//         </Box>

//         {/* Relocate Loading Overlay */}
//         <AnimatePresence>
//           {isRelocating && (
//             <Backdrop
//               open={isRelocating}
//               sx={{
//                 zIndex: 1400,
//                 backgroundColor: 'rgba(0, 0, 0, 0.7)',
//                 backdropFilter: 'blur(8px)',
//               }}
//             >
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.8 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.8 }}
//                 style={{ textAlign: 'center' }}
//               >
//                 <Box
//                   sx={{
//                     width: 80,
//                     height: 80,
//                     borderRadius: '50%',
//                     bgcolor: 'primary.main',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     mb: 3,
//                     mx: 'auto',
//                     boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.7)',
//                     animation: 'pulse 2s infinite',
//                     '@keyframes pulse': {
//                       '0%': { boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.7)' },
//                       '70%': { boxShadow: '0 0 0 20px rgba(255, 193, 7, 0)' },
//                       '100%': { boxShadow: '0 0 0 0 rgba(255, 193, 7, 0)' },
//                     },
//                   }}
//                 >
//                   <MyLocationIcon sx={{ fontSize: 40, color: 'white' }} />
//                 </Box>
//                 <CircularProgress size={48} thickness={3} sx={{ mb: 2, color: 'primary.main' }} />
//                 <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
//                   Finding your location...
//                 </Typography>
//                 <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
//                   This may take a few seconds
//                 </Typography>
//               </motion.div>
//             </Backdrop>
//           )}
//         </AnimatePresence>

//         {/* AppBar */}
//         <AppBar
//           position="absolute"
//           sx={{
//             backgroundColor: 'rgba(255, 255, 255, 0.95)',
//             backdropFilter: 'blur(20px)',
//             boxShadow: 'none',
//             borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
//             zIndex: 10,
//           }}
//         >
//           <Toolbar sx={{ minHeight: 56 }}>
//             <IconButton edge="start" sx={{ mr: 1 }}>
//               <MenuIcon />
//             </IconButton>
//             <Box sx={{ flexGrow: 1 }} />
//             <IconButton onClick={() => router.push('/notifications')} sx={{ mr: 1 }}>
//               <Badge badgeContent={3} color="error" variant="dot">
//                 <NotificationsIcon />
//               </Badge>
//             </IconButton>
//             <IconButton onClick={() => router.push('/profile')}>
//               <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
//                 {user?.firstName?.[0] || 'U'}
//               </Avatar>
//             </IconButton>
//           </Toolbar>
//         </AppBar>

//         {/* Map Controls */}
//         <Box
//           sx={{
//             position: 'absolute',
//             right: 16,
//             bottom: showLocationSheet ? 320 : 100,
//             zIndex: 5,
//             transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//           }}
//         >
//           <MapControls
//             onLocateMe={handleRelocate}
//             onZoomIn={() => mapControls?.zoomIn()}
//             onZoomOut={() => mapControls?.zoomOut()}
//           />
//         </Box>

//         {/* Location Search Bottom Sheet */}
//         <SwipeableBottomSheet
//           open={showLocationSheet}
//           initialHeight={400}
//           maxHeight={600}
//           minHeight={300}
//         >
//           <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
//             {/* Header */}
//             <Box sx={{ mb: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <Box>
//                 <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
//                   Where to?
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   Book a ride in seconds
//                 </Typography>
//                 {routeInfo && (
//                   <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
//                     📍 {routeInfo.distance} • ⏱️ {routeInfo.duration}
//                   </Typography>
//                 )}
//               </Box>
//               {(pickupLocation || dropoffLocation) && (
//                 <IconButton 
//                   size="small" 
//                   onClick={handleReset}
//                   sx={{
//                     bgcolor: 'action.hover',
//                     '&:hover': { bgcolor: 'action.selected' },
//                   }}
//                 >
//                   <CloseIcon fontSize="small" />
//                 </IconButton>
//               )}
//             </Box>

//             {/* Location Search Inputs */}
//             <Box sx={{ mb: 2, flexShrink: 0 }}>
//               {/* Pickup Location */}
//               <Box sx={{ mb: 1.5 }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                   <NavigationIcon 
//                     sx={{ 
//                       fontSize: 20, 
//                       color: activeInput === 'pickup' ? 'primary.main' : pickupLocation ? 'success.main' : 'text.secondary' 
//                     }} 
//                   />
//                   <Typography variant="caption" fontWeight={600} color="text.secondary">
//                     PICKUP
//                   </Typography>
//                 </Box>
//                 <LocationSearch
//                   placeholder="Current Location"
//                   onSelectLocation={handlePickupSelect}
//                   mapControls={mapControls}
//                   value={pickupLocation?.address || ''}
//                   autoFocus={activeInput === 'pickup'}
//                 />
//               </Box>

//               {/* Connecting Line */}
//               <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
//                 <Box sx={{ 
//                   width: 2, 
//                   height: 24, 
//                   bgcolor: pickupLocation && dropoffLocation ? 'primary.main' : 'divider',
//                   transition: 'background-color 0.3s ease',
//                 }} />
//               </Box>

//               {/* Dropoff Location */}
//               <Box>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                   <PlaceIcon 
//                     sx={{ 
//                       fontSize: 20, 
//                       color: activeInput === 'dropoff' ? 'primary.main' : dropoffLocation ? 'error.main' : 'text.secondary' 
//                     }} 
//                   />
//                   <Typography variant="caption" fontWeight={600} color="text.secondary">
//                     DESTINATION
//                   </Typography>
//                 </Box>
//                 <LocationSearch
//                   placeholder="Where to?"
//                   onSelectLocation={handleDropoffSelect}
//                   mapControls={mapControls}
//                   value={dropoffLocation?.address || ''}
//                   autoFocus={activeInput === 'dropoff'}
//                 />
//               </Box>
//             </Box>

//             {/* Recent Locations */}
//             {!activeInput && recentLocations.length > 0 && (
//               <Box sx={{ mb: 2, flexShrink: 0 }}>
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
//                   Recent Locations
//                 </Typography>
//                 <List sx={{ p: 0 }}>
//                   {recentLocations.map((loc, index) => (
//                     <motion.div
//                       key={index}
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: index * 0.05 }}
//                     >
//                       <ListItem 
//                         onClick={() => handleSelectRecentLocation(loc)} 
//                         sx={{ 
//                           py: 1.5, 
//                           px: 2, 
//                           borderRadius: 2, 
//                           mb: 1, 
//                           cursor: 'pointer',
//                           border: '1px solid',
//                           borderColor: 'divider',
//                           transition: 'all 0.2s',
//                           '&:hover': { 
//                             bgcolor: 'action.hover',
//                             borderColor: 'primary.main',
//                             transform: 'translateX(4px)',
//                           } 
//                         }}
//                       >
//                         <ListItemIcon sx={{ minWidth: 40 }}>
//                           <LocationIcon color="action" />
//                         </ListItemIcon>
//                         <ListItemText 
//                           primary={loc.name || loc.address.split(',')[0]} 
//                           secondary={loc.name && loc.name !== loc.address ? loc.address : null}
//                           primaryTypographyProps={{ fontWeight: 500 }}
//                           secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
//                         />
//                       </ListItem>
//                     </motion.div>
//                   ))}
//                 </List>
//               </Box>
//             )}

//             {/* Continue Button */}
//             {pickupLocation && dropoffLocation && (
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 20 }}
//               >
//                 <Box sx={{ flexShrink: 0, mt: 'auto' }}>
//                   <Button
//                     fullWidth
//                     variant="contained"
//                     size="large"
//                     onClick={() => {
//                       setShowLocationSheet(false);
//                       setShowRideOptions(true);
//                     }}
//                     sx={{
//                       height: 56,
//                       fontWeight: 700,
//                       fontSize: '1rem',
//                       borderRadius: 3,
//                       textTransform: 'none',
//                       boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
//                       '&:hover': {
//                         boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
//                         transform: 'translateY(-2px)',
//                       },
//                       '&:active': {
//                         transform: 'translateY(0)',
//                       },
//                     }}
//                   >
//                     Continue to Ride Options
//                   </Button>
//                 </Box>
//               </motion.div>
//             )}
//           </Box>
//         </SwipeableBottomSheet>

//         {/* Ride Options Sheet */}
//         {showRideOptions && pickupLocation && dropoffLocation && (
//           <RideOptionsSheet
//             pickupLocation={pickupLocation}
//             dropoffLocation={dropoffLocation}
//             routeInfo={routeInfo}
//             onClose={() => {
//               setShowRideOptions(false);
//               setShowLocationSheet(true);
//             }}
//             onConfirmRide={handleConfirmRide}
//           />
//         )}
//       </Box>
//     </ClientOnly>
//   );
// }
// ============================================
// rider/app/(main)/home/page.tsx
// ENHANCED WITH FULL API INTEGRATION
// ============================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Typography,
  Button,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Backdrop,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Navigation as NavigationIcon,
  Place as PlaceIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useRide } from '@/lib/hooks/useRide';
import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
import { MapControls } from '@/components/Map/MapControls';
import { LocationSearch } from '@/components/Map/LocationSearch';
import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import ClientOnly from '@/components/ClientOnly';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { location, loading: locationLoading, refresh } = useGeolocation({ watch: true });
  
  // Use comprehensive ride hook
  const { 
    activeRide,
    loading: rideLoading,
    error: rideError,
    getFareEstimate,
    validatePromoCode,
    requestRide,
    getTaxiTypes,
    getRideClasses,
  } = useRide();

  // UI State
  const [mapCenter, setMapCenter] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [showLocationSheet, setShowLocationSheet] = useState(true);
  const [showRideOptions, setShowRideOptions] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [mapControls, setMapControls] = useState(null);
  const [isRelocating, setIsRelocating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  
  // Ride State
  const [fareEstimates, setFareEstimates] = useState(null);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [selectedRideClass, setSelectedRideClass] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [taxiTypes, setTaxiTypes] = useState([]);
  const [rideClasses, setRideClasses] = useState([]);
  
  // Error/Success notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ============================================
  // Redirect Logic for Active Rides
  // ============================================
  useEffect(() => {
    if (activeRide) {
      const { rideStatus, id } = activeRide;
      
      if (rideStatus === 'pending') {
        router.push(`/finding-driver?rideId=${id}`);
      } else if (['accepted', 'arrived', 'passenger_onboard'].includes(rideStatus)) {
        router.push(`/tracking?rideId=${id}`);
      } else if (rideStatus === 'completed') {
        router.push(`/trip-summary?rideId=${id}`);
      }
    }
  }, [activeRide, router]);

  // ============================================
  // Initialize Location
  // ============================================
  useEffect(() => {
    if (location && !pickupLocation) {
      const currentLoc = {
        lat: location.lat,
        lng: location.lng,
        address: 'Current Location',
        name: 'Current Location',
        placeId: 'current_location',
      };
      setMapCenter({ lat: location.lat, lng: location.lng });
      setPickupLocation(currentLoc);
    }
  }, [location, pickupLocation]);

  // ============================================
  // Load Initial Data
  // ============================================
  useEffect(() => {
    const loadInitialData = async () => {
      // Load recent locations
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('okra_rides_recent_locations');
        if (saved) {
          try {
            setRecentLocations(JSON.parse(saved));
          } catch (error) {
            console.error('Error loading recent locations:', error);
          }
        }
      }

      // Load taxi types and ride classes
      try {
        const types = await getTaxiTypes();
        setTaxiTypes(types);
        
        if (types.length > 0) {
          const classes = await getRideClasses(types[0].id);
          setRideClasses(classes);
        }
      } catch (error) {
        console.error('Error loading taxi data:', error);
      }
    };

    loadInitialData();
  }, [getTaxiTypes, getRideClasses]);

  // ============================================
  // Auto-fetch Estimates When Locations Set
  // ============================================
  useEffect(() => {
    if (pickupLocation && dropoffLocation && !fareEstimates) {
      loadFareEstimates();
    }
  }, [pickupLocation, dropoffLocation]);

  // ============================================
  // Load Fare Estimates
  // ============================================
  const loadFareEstimates = async () => {
    if (!pickupLocation || !dropoffLocation) return;

    setLoadingEstimates(true);
    try {
      const estimates = await getFareEstimate(
        pickupLocation, 
        dropoffLocation,
        'taxi',
        ['taxi']
      );

      if (estimates) {
        setFareEstimates(estimates);
        
        // Auto-select first ride class if available
        if (estimates.estimates && estimates.estimates.length > 0) {
          setSelectedRideClass(estimates.estimates[0]);
        }
        
        setSnackbar({
          open: true,
          message: 'Fare estimates loaded successfully',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to load fare estimates',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading estimates:', error);
      setSnackbar({
        open: true,
        message: 'Error calculating fare. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoadingEstimates(false);
    }
  };

  // ============================================
  // Validate Promo Code
  // ============================================
  const handleValidatePromoCode = async (code) => {
    if (!code || !selectedRideClass) return;

    setValidatingPromo(true);
    try {
      const result = await validatePromoCode(code, selectedRideClass.subtotal);
      
      if (result && result.valid) {
        setPromoDiscount(result);
        setSnackbar({
          open: true,
          message: result.message || 'Promo code applied successfully!',
          severity: 'success',
        });
      } else {
        setPromoDiscount(null);
        setSnackbar({
          open: true,
          message: 'Invalid or expired promo code',
          severity: 'error',
        });
      }
    } catch (error) {
      setPromoDiscount(null);
      setSnackbar({
        open: true,
        message: 'Error validating promo code',
        severity: 'error',
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  // ============================================
  // Confirm and Book Ride
  // ============================================
  const handleConfirmRide = async (rideDetails) => {
    if (!pickupLocation || !dropoffLocation || !selectedRideClass) {
      setSnackbar({
        open: true,
        message: 'Please select pickup and dropoff locations',
        severity: 'warning',
      });
      return;
    }
    const rideData = {
      taxiType: 'taxi',
      rideType: 'taxi',
      rider: user,
      rideClass: selectedRideClass.rideClassId || selectedRideClass.id,
      rideClassId: selectedRideClass.rideClassId || selectedRideClass.id,
      pickupLocation,
      dropoffLocation,
      paymentMethod: rideDetails.paymentMethod || 'cash',
      promoCode: promoCode || null,
      estimatedFare: rideDetails.totalFare || selectedRideClass.subtotal,
      totalFare: rideDetails.totalFare || selectedRideClass.subtotal,
      passengerCount: rideDetails.passengerCount || 1,
      specialRequests: rideDetails.specialRequests || [],
      notes: rideDetails.notes || '',
    };

    try {
      const result = await requestRide(rideData);

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Ride requested successfully! Finding driver...',
          severity: 'success',
        });

        // Navigate to finding driver screen
        setTimeout(() => {
          router.push(`/finding-driver?rideId=${result.data.id}`);
        }, 500);
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to book ride. Please try again.',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error booking ride:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while booking. Please try again.',
        severity: 'error',
      });
    }
  };

  // ============================================
  // Location Management
  // ============================================
  const saveToRecent = useCallback((location) => {
    if (location.address === 'Current Location' || location.placeId === 'current_location') return;

    const newRecent = [
      location,
      ...recentLocations.filter((l) =>
        l.placeId !== location.placeId && l.address !== location.address
      ),
    ].slice(0, 5);

    setRecentLocations(newRecent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('okra_rides_recent_locations', JSON.stringify(newRecent));
    }
  }, [recentLocations]);

  const handlePickupSelect = (location) => {
    setPickupLocation(location);
    saveToRecent(location);
    if (mapControls) {
      mapControls.animateToLocation(location, 15);
    }
    setActiveInput(null);
    
    // Clear estimates when changing locations
    setFareEstimates(null);
    setSelectedRideClass(null);
    setPromoDiscount(null);
  };

  const handleDropoffSelect = (location) => {
    setDropoffLocation(location);
    saveToRecent(location);
    if (mapControls) {
      mapControls.animateToLocation(location, 15);
    }
    setActiveInput(null);
    
    // Clear estimates when changing locations
    setFareEstimates(null);
    setSelectedRideClass(null);
    setPromoDiscount(null);
  };

  const handleSelectRecentLocation = (loc) => {
    if (!pickupLocation || pickupLocation.placeId === 'current_location') {
      handlePickupSelect(loc);
    } else if (!dropoffLocation) {
      handleDropoffSelect(loc);
    } else {
      // If both are set, replace dropoff
      handleDropoffSelect(loc);
    }
  };

  const handleReset = () => {
    if (location) {
      const currentLoc = {
        lat: location.lat,
        lng: location.lng,
        address: 'Current Location',
        name: 'Current Location',
        placeId: 'current_location',
      };
      setPickupLocation(currentLoc);
    } else {
      setPickupLocation(null);
    }
    setDropoffLocation(null);
    setFareEstimates(null);
    setSelectedRideClass(null);
    setPromoCode('');
    setPromoDiscount(null);
    setShowRideOptions(false);
    setShowLocationSheet(true);
    setRouteInfo(null);
    setActiveInput(null);
  };

  const handleRelocate = async () => {
    try {
      setIsRelocating(true);
      await refresh();

      setTimeout(() => {
        if (location && mapControls) {
          mapControls.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
        }
      }, 300);

      setTimeout(() => {
        setIsRelocating(false);
      }, 1500);
    } catch (error) {
      console.error('Relocation error:', error);
      setIsRelocating(false);
      setSnackbar({
        open: true,
        message: 'Could not get your location. Please try again.',
        severity: 'error',
      });
    }
  };

  // ============================================
  // Continue to Ride Options
  // ============================================
  const handleContinueToRideOptions = () => {
    if (!fareEstimates) {
      loadFareEstimates();
    }
    setShowLocationSheet(false);
    setShowRideOptions(true);
  };

  // ============================================
  // Loading State
  // ============================================
  if (locationLoading && !location) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default',
      }}>
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
          Getting your location...
        </Typography>
      </Box>
    );
  }

  return (
    <ClientOnly>
      <Box sx={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
        {/* Map Container */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
          <GoogleMapIframe
            center={mapCenter || (location ? { lat: location.lat, lng: location.lng } : { lat: -15.4167, lng: 28.2833 })}
            zoom={13}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            onMapLoad={setMapControls}
            onRouteCalculated={setRouteInfo}
          />
        </Box>

        {/* Relocate Loading Overlay */}
        <AnimatePresence>
          {isRelocating && (
            <Backdrop
              open={isRelocating}
              sx={{
                zIndex: 1400,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{ textAlign: 'center' }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    mx: 'auto',
                    boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.7)',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(255, 193, 7, 0.7)' },
                      '70%': { boxShadow: '0 0 0 20px rgba(255, 193, 7, 0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(255, 193, 7, 0)' },
                    },
                  }}
                >
                  <MyLocationIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <CircularProgress size={48} thickness={3} sx={{ mb: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                  Finding your location...
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  This may take a few seconds
                </Typography>
              </motion.div>
            </Backdrop>
          )}
        </AnimatePresence>

        {/* AppBar */}
        <AppBar
          position="absolute"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            zIndex: 10,
          }}
        >
          <Toolbar sx={{ minHeight: 56 }}>
            <IconButton edge="start" sx={{ mr: 1 }} onClick={() => router.push('/menu')}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={() => router.push('/notifications')} sx={{ mr: 1 }}>
              <Badge badgeContent={3} color="error" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={() => router.push('/profile')}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                {user?.firstName?.[0] || 'U'}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Map Controls */}
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: showLocationSheet ? 320 : 100,
            zIndex: 5,
            transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <MapControls
            onLocateMe={handleRelocate}
            onZoomIn={() => mapControls?.zoomIn()}
            onZoomOut={() => mapControls?.zoomOut()}
          />
        </Box>

        {/* Location Search Bottom Sheet */}
        <SwipeableBottomSheet
          open={showLocationSheet}
          initialHeight={400}
          maxHeight={600}
          minHeight={300}
        >
          <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ mb: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Where to?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Book a ride in seconds
                </Typography>
                {routeInfo && (
                  <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
                    📍 {routeInfo.distance} • ⏱️ {routeInfo.duration}
                  </Typography>
                )}
              </Box>
              {(pickupLocation || dropoffLocation) && (
                <IconButton 
                  size="small" 
                  onClick={handleReset}
                  sx={{
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {/* Error Alert */}
            {rideError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
                {rideError}
              </Alert>
            )}

            {/* Location Search Inputs */}
            <Box sx={{ mb: 2, flexShrink: 0 }}>
              {/* Pickup Location */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <NavigationIcon 
                    sx={{ 
                      fontSize: 20, 
                      color: activeInput === 'pickup' ? 'primary.main' : pickupLocation ? 'success.main' : 'text.secondary' 
                    }} 
                  />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    PICKUP
                  </Typography>
                </Box>
                <LocationSearch
                  placeholder="Current Location"
                  onSelectLocation={handlePickupSelect}
                  mapControls={mapControls}
                  value={pickupLocation?.address || ''}
                  autoFocus={activeInput === 'pickup'}
                  onFocus={() => setActiveInput('pickup')}
                  onBlur={() => setActiveInput(null)}
                />
              </Box>

              {/* Connecting Line */}
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                <Box sx={{ 
                  width: 2, 
                  height: 24, 
                  bgcolor: pickupLocation && dropoffLocation ? 'primary.main' : 'divider',
                  transition: 'background-color 0.3s ease',
                }} />
              </Box>

              {/* Dropoff Location */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PlaceIcon 
                    sx={{ 
                      fontSize: 20, 
                      color: activeInput === 'dropoff' ? 'primary.main' : dropoffLocation ? 'error.main' : 'text.secondary' 
                    }} 
                  />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    DESTINATION
                  </Typography>
                </Box>
                <LocationSearch
                  placeholder="Where to?"
                  onSelectLocation={handleDropoffSelect}
                  mapControls={mapControls}
                  value={dropoffLocation?.address || ''}
                  autoFocus={activeInput === 'dropoff'}
                  onFocus={() => setActiveInput('dropoff')}
                  onBlur={() => setActiveInput(null)}
                />
              </Box>
            </Box>

            {/* Recent Locations */}
            {!activeInput && recentLocations.length > 0 && (
              <Box sx={{ mb: 2, flexShrink: 0, flexGrow: 1, overflowY: 'auto' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                  Recent Locations
                </Typography>
                <List sx={{ p: 0 }}>
                  {recentLocations.map((loc, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ListItem 
                        onClick={() => handleSelectRecentLocation(loc)} 
                        sx={{ 
                          py: 1.5, 
                          px: 2, 
                          borderRadius: 2, 
                          mb: 1, 
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s',
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                            transform: 'translateX(4px)',
                          } 
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <LocationIcon color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={loc.name || loc.address.split(',')[0]} 
                          secondary={loc.name && loc.name !== loc.address ? loc.address : null}
                          primaryTypographyProps={{ fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              </Box>
            )}

            {/* Continue Button */}
            {pickupLocation && dropoffLocation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Box sx={{ flexShrink: 0, mt: 'auto' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleContinueToRideOptions}
                    disabled={loadingEstimates || rideLoading}
                    sx={{
                      height: 56,
                      fontWeight: 700,
                      fontSize: '1rem',
                      borderRadius: 3,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      '&:disabled': {
                        bgcolor: 'action.disabledBackground',
                      },
                    }}
                  >
                    {loadingEstimates ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Continue to Ride Options'
                    )}
                  </Button>
                </Box>
              </motion.div>
            )}
          </Box>
        </SwipeableBottomSheet>

        {/* Ride Options Sheet */}
        {showRideOptions && pickupLocation && dropoffLocation && (
          <RideOptionsSheet
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            routeInfo={routeInfo}
            fareEstimates={fareEstimates}
            loadingEstimates={loadingEstimates}
            selectedRideClass={selectedRideClass}
            onSelectRideClass={setSelectedRideClass}
            promoCode={promoCode}
            onPromoCodeChange={setPromoCode}
            promoDiscount={promoDiscount}
            onValidatePromo={handleValidatePromoCode}
            validatingPromo={validatingPromo}
            onClose={() => {
              setShowRideOptions(false);
              setShowLocationSheet(true);
            }}
            onConfirmRide={handleConfirmRide}
            loading={rideLoading}
          />
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ClientOnly>
  );
}