// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import {
// // // //   Box,
// // // //   AppBar,
// // // //   Toolbar,
// // // //   IconButton,
// // // //   Avatar,
// // // //   Typography,
// // // //   Paper,
// // // //   TextField,
// // // //   InputAdornment,
// // // // } from '@mui/material';
// // // // import {
// // // //   Menu as MenuIcon,
// // // //   Notifications as NotificationsIcon,
// // // //   Search as SearchIcon,
// // // //   MyLocation as MyLocationIcon,
// // // // } from '@mui/icons-material';
// // // // import { useAuth } from '@/lib/hooks/useAuth';
// // // // import { useGeolocation } from '@/lib/hooks/useGeolocation';
// // // // import { motion } from 'framer-motion';

// // // // export default function HomePage() {
// // // //   const { user } = useAuth();
// // // //   const { location, error: locationError, loading: locationLoading, refresh } = useGeolocation();
  
// // // //   const [pickupAddress, setPickupAddress] = useState('');
// // // //   const [dropoffAddress, setDropoffAddress] = useState('');
  
// // // //   useEffect(() => {
// // // //     if (location) {
// // // //       // Reverse geocode to get address
// // // //       reverseGeocode(location.lat, location.lng);
// // // //     }
// // // //   }, [location]);
  
// // // //   const reverseGeocode = async (lat, lng) => {
// // // //     // This would use Google Maps Geocoding API
// // // //     // For now, just set a placeholder
// // // //     setPickupAddress('Current Location');
// // // //   };
  
// // // //   return (
// // // //     <Box sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
// // // //       {/* App Bar */}
// // // //       <AppBar
// // // //         position="absolute"
// // // //         elevation={0}
// // // //         sx={{
// // // //           bgcolor: 'transparent',
// // // //           backdropFilter: 'blur(20px)',
// // // //           borderBottom: '1px solid',
// // // //           borderColor: 'divider',
// // // //         }}
// // // //       >
// // // //         <Toolbar>
// // // //           <IconButton edge="start">
// // // //             <MenuIcon />
// // // //           </IconButton>
          
// // // //           <Box sx={{ flex: 1 }} />
          
// // // //           <IconButton>
// // // //             <NotificationsIcon />
// // // //           </IconButton>
          
// // // //           <Avatar
// // // //             src={user?.profilePicture}
// // // //             sx={{ ml: 1, width: 36, height: 36 }}
// // // //           >
// // // //             {user?.firstName?.[0] || 'U'}
// // // //           </Avatar>
// // // //         </Toolbar>
// // // //       </AppBar>
      
// // // //       {/* Map Container */}
// // // //       <Box
// // // //         sx={{
// // // //           height: '100%',
// // // //           width: '100%',
// // // //           bgcolor: 'grey.200',
// // // //           position: 'relative',
// // // //         }}
// // // //       >
// // // //         {/* Map would go here */}
// // // //         <Box
// // // //           sx={{
// // // //             width: '100%',
// // // //             height: '100%',
// // // //             display: 'flex',
// // // //             alignItems: 'center',
// // // //             justifyContent: 'center',
// // // //             color: 'text.secondary',
// // // //           }}
// // // //         >
// // // //           <Typography variant="body2">
// // // //             {locationLoading ? 'Loading map...' : 'Map will appear here'}
// // // //           </Typography>
// // // //         </Box>
        
// // // //         {/* Locate Me Button */}
// // // //         <motion.div
// // // //           style={{
// // // //             position: 'absolute',
// // // //             bottom: 300,
// // // //             right: 16,
// // // //           }}
// // // //           initial={{ scale: 0 }}
// // // //           animate={{ scale: 1 }}
// // // //           transition={{ delay: 0.2 }}
// // // //         >
// // // //           <Paper
// // // //             elevation={3}
// // // //             sx={{
// // // //               borderRadius: '50%',
// // // //               overflow: 'hidden',
// // // //             }}
// // // //           >
// // // //             <IconButton
// // // //               onClick={refresh}
// // // //               sx={{
// // // //                 width: 48,
// // // //                 height: 48,
// // // //                 bgcolor: 'background.paper',
// // // //               }}
// // // //             >
// // // //               <MyLocationIcon />
// // // //             </IconButton>
// // // //           </Paper>
// // // //         </motion.div>
// // // //       </Box>
      
// // // //       {/* Location Search Sheet */}
// // // //       <motion.div
// // // //         initial={{ y: '100%' }}
// // // //         animate={{ y: 0 }}
// // // //         transition={{ type: 'spring', stiffness: 300, damping: 30 }}
// // // //         style={{
// // // //           position: 'absolute',
// // // //           bottom: 0,
// // // //           left: 0,
// // // //           right: 0,
// // // //         }}
// // // //       >
// // // //         <Paper
// // // //           elevation={8}
// // // //           sx={{
// // // //             borderTopLeftRadius: 32,
// // // //             borderTopRightRadius: 32,
// // // //             p: 3,
// // // //             pb: 12, // Space for bottom nav
// // // //           }}
// // // //         >
// // // //           <Box sx={{ mb: 2 }}>
// // // //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// // // //               Where to?
// // // //             </Typography>
            
// // // //             {/* Pickup Input */}
// // // //             <TextField
// // // //               fullWidth
// // // //               value={pickupAddress}
// // // //               onChange={(e) => setPickupAddress(e.target.value)}
// // // //               placeholder="Pickup location"
// // // //               InputProps={{
// // // //                 startAdornment: (
// // // //                   <InputAdornment position="start">
// // // //                     <Box
// // // //                       sx={{
// // // //                         width: 12,
// // // //                         height: 12,
// // // //                         borderRadius: '50%',
// // // //                         bgcolor: 'success.main',
// // // //                       }}
// // // //                     />
// // // //                   </InputAdornment>
// // // //                 ),
// // // //               }}
// // // //               sx={{ mb: 1.5 }}
// // // //             />
            
// // // //             {/* Dropoff Input */}
// // // //             <TextField
// // // //               fullWidth
// // // //               value={dropoffAddress}
// // // //               onChange={(e) => setDropoffAddress(e.target.value)}
// // // //               placeholder="Where are you going?"
// // // //               InputProps={{
// // // //                 startAdornment: (
// // // //                   <InputAdornment position="start">
// // // //                     <Box
// // // //                       sx={{
// // // //                         width: 12,
// // // //                         height: 12,
// // // //                         borderRadius: 2,
// // // //                         bgcolor: 'error.main',
// // // //                       }}
// // // //                     />
// // // //                   </InputAdornment>
// // // //                 ),
// // // //                 endAdornment: (
// // // //                   <InputAdornment position="end">
// // // //                     <SearchIcon />
// // // //                   </InputAdornment>
// // // //                 ),
// // // //               }}
// // // //             />
// // // //           </Box>
          
// // // //           {/* Saved Places */}
// // // //           <Box>
// // // //             <Typography
// // // //               variant="subtitle2"
// // // //               color="text.secondary"
// // // //               sx={{ mb: 1, px: 1 }}
// // // //             >
// // // //               Saved Places
// // // //             </Typography>
            
// // // //             <Paper
// // // //               sx={{
// // // //                 p: 2,
// // // //                 borderRadius: 3,
// // // //                 bgcolor: 'action.hover',
// // // //                 cursor: 'pointer',
// // // //                 '&:hover': {
// // // //                   bgcolor: 'action.selected',
// // // //                 },
// // // //               }}
// // // //             >
// // // //               <Typography variant="body2" sx={{ fontWeight: 500 }}>
// // // //                 🏠 Home
// // // //               </Typography>
// // // //               <Typography variant="caption" color="text.secondary">
// // // //                 Kabulonga, Lusaka
// // // //               </Typography>
// // // //             </Paper>
// // // //           </Box>
// // // //         </Paper>
// // // //       </motion.div>
// // // //     </Box>
// // // //   );
// // // // }

// // // // rider/app/(main)/home/page.jsx
// // // 'use client';
// // // import { useState, useEffect, useRef } from 'react';
// // // import { useRouter } from 'next/navigation';
// // // import {
// // //   Box,
// // //   AppBar,
// // //   Toolbar,
// // //   IconButton,
// // //   Avatar,
// // //   Typography,
// // //   Paper,
// // //   Button,
// // //   Badge,
// // //   Fab,
// // // } from '@mui/material';
// // // import {
// // //   Menu as MenuIcon,
// // //   Notifications as NotificationsIcon,
// // //   MyLocation as MyLocationIcon,
// // //   Navigation as NavigationIcon,
// // // } from '@mui/icons-material';
// // // import { motion, AnimatePresence } from 'framer-motion';
// // // import { useAuth } from '@/lib/hooks/useAuth';
// // // import { useGeolocation } from '@/lib/hooks/useGeolocation';
// // // import { useRide } from '@/lib/hooks/useRide';
// // // import { GoogleMapProvider } from '@/components/Map/GoogleMapProvider';
// // // import { OptimizedMap } from '@/components/Map/OptimizedMap';
// // // import { MapControls } from '@/components/Map/MapControls';
// // // import { LocationSearch } from '@/components/Map/LocationSearch';
// // // import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
// // // import { createCustomMarker } from '@/components/Map/CustomMarkers';
// // // import { Spinner } from '@/components/ui';

// // // export default function HomePage() {
// // //   const router = useRouter();
// // //   const { user } = useAuth();
// // //   const { location, loading: locationLoading, refresh } = useGeolocation({ watch: true });
// // //   const { activeRide, loading: rideLoading } = useRide();
  
// // //   const [mapCenter, setMapCenter] = useState(null);
// // //   const [pickupLocation, setPickupLocation] = useState(null);
// // //   const [dropoffLocation, setDropoffLocation] = useState(null);
// // //   const [showLocationSheet, setShowLocationSheet] = useState(true);
// // //   const [showRideOptions, setShowRideOptions] = useState(false);
// // //   const [searchMode, setSearchMode] = useState('pickup'); // 'pickup' or 'dropoff'
// // //   const [recentLocations, setRecentLocations] = useState([]);
// // //   const [mapRef, setMapRef] = useState(null);

// // //   // Redirect if there's an active ride
// // //   useEffect(() => {
// // //     if (activeRide) {
// // //       router.push(`/tracking?rideId=${activeRide.id}`);
// // //     }
// // //   }, [activeRide, router]);

// // //   // Set initial map center to user's location
// // //   useEffect(() => {
// // //     if (location) {
// // //       setMapCenter({
// // //         lat: location.lat,
// // //         lng: location.lng,
// // //       });
      
// // //       // Auto-set pickup to current location if not set
// // //       if (!pickupLocation) {
// // //         setPickupLocation({
// // //           lat: location.lat,
// // //           lng: location.lng,
// // //           address: 'Current Location',
// // //           name: 'Current Location',
// // //         });
// // //       }
// // //     }
// // //   }, [location]);

// // //   // Load recent locations from localStorage
// // //   useEffect(() => {
// // //     if (typeof window !== 'undefined') {
// // //       const saved = localStorage.getItem('recent_locations');
// // //       if (saved) {
// // //         try {
// // //           setRecentLocations(JSON.parse(saved));
// // //         } catch (error) {
// // //           console.error('Error loading recent locations:', error);
// // //         }
// // //       }
// // //     }
// // //   }, []);

// // //   // Save location to recent
// // //   const saveToRecent = (location) => {
// // //     const newRecent = [
// // //       location,
// // //       ...recentLocations.filter(l => l.address !== location.address)
// // //     ].slice(0, 5);
    
// // //     setRecentLocations(newRecent);
// // //     if (typeof window !== 'undefined') {
// // //       localStorage.setItem('recent_locations', JSON.stringify(newRecent));
// // //     }
// // //   };

// // //   const handleSelectLocation = (location) => {
// // //     if (searchMode === 'pickup') {
// // //       setPickupLocation(location);
// // //       saveToRecent(location);
      
// // //       // Pan map to selected location
// // //       if (mapRef) {
// // //         mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 15);
// // //       }
      
// // //       // Auto-switch to dropoff input
// // //       setSearchMode('dropoff');
// // //     } else {
// // //       setDropoffLocation(location);
// // //       saveToRecent(location);
      
// // //       // If both locations are set, show ride options
// // //       if (pickupLocation) {
// // //         setShowLocationSheet(false);
// // //         setShowRideOptions(true);
// // //       }
// // //     }
// // //   };

// // //   const handleUseCurrentLocation = () => {
// // //     if (location) {
// // //       const currentLoc = {
// // //         lat: location.lat,
// // //         lng: location.lng,
// // //         address: 'Current Location',
// // //         name: 'Current Location',
// // //       };
// // //       handleSelectLocation(currentLoc);
// // //     } else {
// // //       refresh();
// // //     }
// // //   };

// // //   const handleConfirmRide = async (rideDetails) => {
// // //     try {
// // //       router.push('/finding-driver?' + new URLSearchParams({
// // //         pickup: JSON.stringify(pickupLocation),
// // //         dropoff: JSON.stringify(dropoffLocation),
// // //         ...rideDetails,
// // //       }));
// // //     } catch (error) {
// // //       console.error('Error confirming ride:', error);
// // //       alert('Failed to book ride. Please try again.');
// // //     }
// // //   };

// // //   const handleReset = () => {
// // //     setPickupLocation(null);
// // //     setDropoffLocation(null);
// // //     setShowRideOptions(false);
// // //     setShowLocationSheet(true);
// // //     setSearchMode('pickup');
// // //   };

// // //   // Get markers for map
// // //   const getMarkers = () => {
// // //     const markers = [];
    
// // //     if (pickupLocation) {
// // //       markers.push({
// // //         id: 'pickup',
// // //         position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
// // //         icon: createCustomMarker('pickup'),
// // //         title: 'Pickup Location',
// // //       });
// // //     }
    
// // //     if (dropoffLocation) {
// // //       markers.push({
// // //         id: 'dropoff',
// // //         position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
// // //         icon: createCustomMarker('dropoff'),
// // //         title: 'Dropoff Location',
// // //       });
// // //     }
    
// // //     return markers;
// // //   };

// // //   if (locationLoading && !location) {
// // //     return (
// // //       <Box sx={{ 
// // //         height: '100vh', 
// // //         display: 'flex', 
// // //         alignItems: 'center', 
// // //         justifyContent: 'center' 
// // //       }}>
// // //         <Spinner />
// // //         <Typography sx={{ mt: 2 }}>Getting your location...</Typography>
// // //       </Box>
// // //     );
// // //   }

// // //   return (
// // //     <Box sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
// // //       {/* App Bar */}
// // //       <AppBar
// // //         position="absolute"
// // //         elevation={0}
// // //         sx={{
// // //           bgcolor: 'transparent',
// // //           backdropFilter: 'blur(20px)',
// // //           zIndex: 1000,
// // //         }}
// // //       >
// // //         <Toolbar>
// // //           <IconButton edge="start" onClick={() => router.push('/profile')}>
// // //             <MenuIcon />
// // //           </IconButton>
          
// // //           <Box sx={{ flex: 1 }} />
          
// // //           <IconButton onClick={() => router.push('/notifications')}>
// // //             <Badge badgeContent={0} color="error">
// // //               <NotificationsIcon />
// // //             </Badge>
// // //           </IconButton>
          
// // //           <Avatar
// // //             src={user?.profilePicture}
// // //             sx={{ ml: 1, width: 36, height: 36 }}
// // //             onClick={() => router.push('/profile')}
// // //           >
// // //             {user?.firstName?.[0] || 'U'}
// // //           </Avatar>
// // //         </Toolbar>
// // //       </AppBar>

// // //       {/* Map Container */}
// // //       <GoogleMapProvider>
// // //         <OptimizedMap
// // //           center={mapCenter || { lat: -15.4167, lng: 28.2833 }}
// // //           zoom={mapCenter ? 15 : 13}
// // //           markers={getMarkers()}
// // //           onMapLoad={setMapRef}
// // //         />
// // //       </GoogleMapProvider>

// // //       {/* Map Controls */}
// // //       <MapControls
// // //         onLocateMe={() => {
// // //           if (location && mapRef) {
// // //             mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
// // //           } else {
// // //             refresh();
// // //           }
// // //         }}
// // //         onZoomIn={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) + 1)}
// // //         onZoomOut={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) - 1)}
// // //         style={{ bottom: showLocationSheet ? 380 : 120 }}
// // //       />

// // //       {/* Current Location FAB */}
// // //       {!pickupLocation && location && (
// // //         <Fab
// // //           color="primary"
// // //           sx={{
// // //             position: 'absolute',
// // //             bottom: showLocationSheet ? 360 : 100,
// // //             right: 16,
// // //             zIndex: 999,
// // //           }}
// // //           onClick={handleUseCurrentLocation}
// // //         >
// // //           <NavigationIcon />
// // //         </Fab>
// // //       )}

// // //       {/* Location Search Sheet */}
// // //       <AnimatePresence>
// // //         {showLocationSheet && (
// // //           <motion.div
// // //             initial={{ y: '100%' }}
// // //             animate={{ y: 0 }}
// // //             exit={{ y: '100%' }}
// // //             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
// // //             style={{
// // //               position: 'absolute',
// // //               bottom: 0,
// // //               left: 0,
// // //               right: 0,
// // //               zIndex: 1100,
// // //             }}
// // //           >
// // //             <Paper
// // //               elevation={8}
// // //               sx={{
// // //                 borderTopLeftRadius: 32,
// // //                 borderTopRightRadius: 32,
// // //                 p: 3,
// // //                 pb: 12,
// // //                 maxHeight: '70vh',
// // //                 overflow: 'auto',
// // //               }}
// // //             >
// // //               <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// // //                 Where to?
// // //               </Typography>

// // //               {/* Pickup Input */}
// // //               <Box sx={{ mb: 1.5 }}>
// // //                 <LocationSearch
// // //                   placeholder="Pickup location"
// // //                   onSelectLocation={handleSelectLocation}
// // //                   currentLocation={location}
// // //                   autoFocus={searchMode === 'pickup'}
// // //                 />
// // //                 {pickupLocation && (
// // //                   <Box
// // //                     sx={{
// // //                       display: 'flex',
// // //                       alignItems: 'center',
// // //                       gap: 1,
// // //                       mt: 1,
// // //                       p: 1.5,
// // //                       bgcolor: 'success.light',
// // //                       borderRadius: 2,
// // //                     }}
// // //                   >
// // //                     <Box
// // //                       sx={{
// // //                         width: 12,
// // //                         height: 12,
// // //                         borderRadius: '50%',
// // //                         bgcolor: 'success.main',
// // //                       }}
// // //                     />
// // //                     <Typography variant="body2" sx={{ flex: 1 }}>
// // //                       {pickupLocation.address}
// // //                     </Typography>
// // //                     <IconButton size="small" onClick={() => setPickupLocation(null)}>
// // //                       ✕
// // //                     </IconButton>
// // //                   </Box>
// // //                 )}
// // //               </Box>

// // //               {/* Dropoff Input */}
// // //               <Box sx={{ mb: 2 }}>
// // //                 <LocationSearch
// // //                   placeholder="Where are you going?"
// // //                   onSelectLocation={handleSelectLocation}
// // //                   currentLocation={location}
// // //                   autoFocus={searchMode === 'dropoff'}
// // //                 />
// // //                 {dropoffLocation && (
// // //                   <Box
// // //                     sx={{
// // //                       display: 'flex',
// // //                       alignItems: 'center',
// // //                       gap: 1,
// // //                       mt: 1,
// // //                       p: 1.5,
// // //                       bgcolor: 'error.light',
// // //                       borderRadius: 2,
// // //                     }}
// // //                   >
// // //                     <Box
// // //                       sx={{
// // //                         width: 12,
// // //                         height: 12,
// // //                         borderRadius: 1,
// // //                         bgcolor: 'error.main',
// // //                       }}
// // //                     />
// // //                     <Typography variant="body2" sx={{ flex: 1 }}>
// // //                       {dropoffLocation.address}
// // //                     </Typography>
// // //                     <IconButton size="small" onClick={() => setDropoffLocation(null)}>
// // //                       ✕
// // //                     </IconButton>
// // //                   </Box>
// // //                 )}
// // //               </Box>

// // //               {/* Recent Locations */}
// // //               {recentLocations.length > 0 && (
// // //                 <>
// // //                   <Typography
// // //                     variant="subtitle2"
// // //                     color="text.secondary"
// // //                     sx={{ mb: 1, px: 1 }}
// // //                   >
// // //                     Recent Locations
// // //                   </Typography>
// // //                   {recentLocations.map((loc, index) => (
// // //                     <Paper
// // //                       key={index}
// // //                       sx={{
// // //                         p: 2,
// // //                         mb: 1,
// // //                         borderRadius: 3,
// // //                         cursor: 'pointer',
// // //                         '&:hover': {
// // //                           bgcolor: 'action.hover',
// // //                         },
// // //                       }}
// // //                       onClick={() => handleSelectLocation(loc)}
// // //                     >
// // //                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
// // //                         📍 {loc.name || loc.address}
// // //                       </Typography>
// // //                       {loc.name && loc.name !== loc.address && (
// // //                         <Typography variant="caption" color="text.secondary">
// // //                           {loc.address}
// // //                         </Typography>
// // //                       )}
// // //                     </Paper>
// // //                   ))}
// // //                 </>
// // //               )}

// // //               {/* Confirm Button */}
// // //               {pickupLocation && dropoffLocation && (
// // //                 <Button
// // //                   fullWidth
// // //                   variant="contained"
// // //                   size="large"
// // //                   onClick={() => {
// // //                     setShowLocationSheet(false);
// // //                     setShowRideOptions(true);
// // //                   }}
// // //                   sx={{ height: 56, mt: 2 }}
// // //                 >
// // //                   Continue
// // //                 </Button>
// // //               )}
// // //             </Paper>
// // //           </motion.div>
// // //         )}
// // //       </AnimatePresence>

// // //       {/* Ride Options Sheet */}
// // //       {showRideOptions && pickupLocation && dropoffLocation && (
// // //         <RideOptionsSheet
// // //           pickupLocation={pickupLocation}
// // //           dropoffLocation={dropoffLocation}
// // //           onClose={handleReset}
// // //           onConfirmRide={handleConfirmRide}
// // //         />
// // //       )}
// // //     </Box>
// // //   );
// // // }

// // // rider/app/(main)/home/page.jsx
// // 'use client';
// // import { useState, useEffect, useRef } from 'react';
// // import { useRouter } from 'next/navigation';
// // import {
// //   Box,
// //   AppBar,
// //   Toolbar,
// //   IconButton,
// //   Avatar,
// //   Typography,
// //   Paper,
// //   Button,
// //   Badge,
// //   Fab,
// //   TextField,
// //   InputAdornment,
// //   List,
// //   ListItem,
// //   ListItemIcon,
// //   ListItemText,
// //   CircularProgress,
// //   Backdrop,
// // } from '@mui/material';
// // import {
// //   Menu as MenuIcon,
// //   Notifications as NotificationsIcon,
// //   MyLocation as MyLocationIcon,
// //   Navigation as NavigationIcon,
// //   Close as CloseIcon,
// //   LocationOn as LocationIcon,
// // } from '@mui/icons-material';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { useAuth } from '@/lib/hooks/useAuth';
// // import { useGeolocation } from '@/lib/hooks/useGeolocation';
// // import { useRide } from '@/lib/hooks/useRide';
// // import { GoogleMapProvider } from '@/components/Map/GoogleMapProvider';
// // import { OptimizedMap } from '@/components/Map/OptimizedMap';
// // import { MapControls } from '@/components/Map/MapControls';
// // import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
// // import { createCustomMarker } from '@/components/Map/CustomMarkers';
// // import { debounce } from '@/Functions';

// // export default function HomePage() {
// //   const router = useRouter();
// //   const { user } = useAuth();
// //   const { location, loading: locationLoading, refresh } = useGeolocation({ watch: true });
// //   const { activeRide } = useRide();
  
// //   const [mapCenter, setMapCenter] = useState(null);
// //   const [pickupLocation, setPickupLocation] = useState(null);
// //   const [dropoffLocation, setDropoffLocation] = useState(null);
// //   const [showLocationSheet, setShowLocationSheet] = useState(true);
// //   const [showRideOptions, setShowRideOptions] = useState(false);
// //   const [recentLocations, setRecentLocations] = useState([]);
// //   const [mapRef, setMapRef] = useState(null);
// //   const [isRelocating, setIsRelocating] = useState(false);
  
// //   // Search states
// //   const [pickupQuery, setPickupQuery] = useState('');
// //   const [dropoffQuery, setDropoffQuery] = useState('');
// //   const [predictions, setPredictions] = useState([]);
// //   const [loadingPredictions, setLoadingPredictions] = useState(false);
// //   const [activeInput, setActiveInput] = useState(null);
  
// //   const autocompleteService = useRef(null);
// //   const placesService = useRef(null);

// //   // Initialize Google Places services
// //   useEffect(() => {
// //     if (typeof window !== 'undefined' && window.google) {
// //       autocompleteService.current = new window.google.maps.places.AutocompleteService();
// //       placesService.current = new window.google.maps.places.PlacesService(
// //         document.createElement('div')
// //       );
// //     }
// //   }, []);

// //   // Redirect if there's an active ride
// //   useEffect(() => {
// //     if (activeRide) {
// //       router.push(`/tracking?rideId=${activeRide.id}`);
// //     }
// //   }, [activeRide, router]);

// //   // Set initial map center and pickup to user's location
// //   useEffect(() => {
// //     if (location && !pickupLocation) {
// //       const currentLoc = {
// //         lat: location.lat,
// //         lng: location.lng,
// //         address: 'Current Location',
// //         name: 'Current Location',
// //       };
      
// //       setMapCenter({ lat: location.lat, lng: location.lng });
// //       setPickupLocation(currentLoc);
// //       setPickupQuery('Current Location');
// //     }
// //   }, [location, pickupLocation]);

// //   // Load recent locations
// //   useEffect(() => {
// //     if (typeof window !== 'undefined') {
// //       const saved = localStorage.getItem('recent_locations');
// //       if (saved) {
// //         try {
// //           setRecentLocations(JSON.parse(saved));
// //         } catch (error) {
// //           console.error('Error loading recent locations:', error);
// //         }
// //       }
// //     }
// //   }, []);

// //   // Debounced search function
// //   const debouncedSearch = useRef(
// //     debounce((query) => {
// //       if (!query || query.length < 3 || query === 'Current Location') {
// //         setPredictions([]);
// //         return;
// //       }

// //       if (!autocompleteService.current) return;

// //       setLoadingPredictions(true);
// //       autocompleteService.current.getPlacePredictions(
// //         {
// //           input: query,
// //           componentRestrictions: { country: 'zm' },
// //           types: ['geocode', 'establishment'],
// //         },
// //         (results, status) => {
// //           setLoadingPredictions(false);
// //           if (status === window.google.maps.places.PlacesServiceStatus.OK) {
// //             setPredictions(results || []);
// //           } else {
// //             setPredictions([]);
// //           }
// //         }
// //       );
// //     }, 300)
// //   ).current;

// //   // Handle input change
// //   const handleSearchChange = (value, isPickup) => {
// //     if (isPickup) {
// //       setPickupQuery(value);
// //       setActiveInput('pickup');
// //     } else {
// //       setDropoffQuery(value);
// //       setActiveInput('dropoff');
// //     }
// //     debouncedSearch(value);
// //   };

// //   // Select location from predictions
// //   const handleSelectPrediction = (prediction) => {
// //     if (!placesService.current) return;

// //     placesService.current.getDetails(
// //       {
// //         placeId: prediction.place_id,
// //         fields: ['geometry', 'formatted_address', 'name'],
// //       },
// //       (place, status) => {
// //         if (status === window.google.maps.places.PlacesServiceStatus.OK) {
// //           const location = {
// //             lat: place.geometry.location.lat(),
// //             lng: place.geometry.location.lng(),
// //             address: place.formatted_address,
// //             name: place.name,
// //             placeId: prediction.place_id,
// //           };

// //           if (activeInput === 'pickup') {
// //             setPickupLocation(location);
// //             setPickupQuery(place.formatted_address);
// //             saveToRecent(location);
// //             setActiveInput('dropoff');
// //           } else {
// //             setDropoffLocation(location);
// //             setDropoffQuery(place.formatted_address);
// //             saveToRecent(location);
// //           }

// //           setPredictions([]);

// //           if (mapRef) {
// //             mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 15);
// //           }
// //         }
// //       }
// //     );
// //   };

// //   // Use current location
// //   const handleUseCurrentLocation = () => {
// //     if (location) {
// //       const currentLoc = {
// //         lat: location.lat,
// //         lng: location.lng,
// //         address: 'Current Location',
// //         name: 'Current Location',
// //       };

// //       if (activeInput === 'pickup' || !activeInput) {
// //         setPickupLocation(currentLoc);
// //         setPickupQuery('Current Location');
// //         setActiveInput('dropoff');
// //       } else {
// //         setDropoffLocation(currentLoc);
// //         setDropoffQuery('Current Location');
// //       }

// //       setPredictions([]);

// //       if (mapRef) {
// //         mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 15);
// //       }
// //     }
// //   };

// //   // Save location to recent
// //   const saveToRecent = (location) => {
// //     if (location.address === 'Current Location') return;
    
// //     const newRecent = [
// //       location,
// //       ...recentLocations.filter((l) => l.address !== location.address),
// //     ].slice(0, 5);

// //     setRecentLocations(newRecent);
// //     if (typeof window !== 'undefined') {
// //       localStorage.setItem('recent_locations', JSON.stringify(newRecent));
// //     }
// //   };

// //   const handleConfirmRide = async (rideDetails) => {
// //     try {
// //       router.push(
// //         '/finding-driver?' +
// //           new URLSearchParams({
// //             pickup: JSON.stringify(pickupLocation),
// //             dropoff: JSON.stringify(dropoffLocation),
// //             ...rideDetails,
// //           })
// //       );
// //     } catch (error) {
// //       console.error('Error confirming ride:', error);
// //       alert('Failed to book ride. Please try again.');
// //     }
// //   };

// //   const handleReset = () => {
// //     setPickupLocation(null);
// //     setDropoffLocation(null);
// //     setPickupQuery('');
// //     setDropoffQuery('');
// //     setShowRideOptions(false);
// //     setShowLocationSheet(true);
// //     setPredictions([]);
// //     setActiveInput(null);
// //   };

// //   const handleRelocate = () => {
// //     setIsRelocating(true);
// //     refresh();
    
// //     setTimeout(() => {
// //       if (location && mapRef) {
// //         mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
// //       }
// //       setIsRelocating(false);
// //     }, 800);
// //   };

// //   // Get markers for map
// //   const getMarkers = () => {
// //     const markers = [];

// //     if (pickupLocation && pickupLocation.address !== 'Current Location') {
// //       markers.push({
// //         id: 'pickup',
// //         position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
// //         icon: createCustomMarker('pickup'),
// //         title: 'Pickup Location',
// //       });
// //     }

// //     if (dropoffLocation) {
// //       markers.push({
// //         id: 'dropoff',
// //         position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
// //         icon: createCustomMarker('dropoff'),
// //         title: 'Dropoff Location',
// //       });
// //     }

// //     return markers;
// //   };

// //   const hasSearchResults = activeInput && (predictions.length > 0 || loadingPredictions);

// //   if (locationLoading && !location) {
// //     return (
// //       <Box
// //         sx={{
// //           height: '100vh',
// //           display: 'flex',
// //           flexDirection: 'column',
// //           alignItems: 'center',
// //           justifyContent: 'center',
// //           gap: 2,
// //         }}
// //       >
// //         <CircularProgress size={60} />
// //         <Typography variant="h6" sx={{ fontWeight: 600 }}>
// //           Getting your location...
// //         </Typography>
// //         <Typography variant="body2" color="text.secondary">
// //           Please enable location services
// //         </Typography>
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
// //       {/* Relocate Loading Overlay */}
// //       <Backdrop
// //         open={isRelocating}
// //         sx={{
// //           zIndex: 2000,
// //           bgcolor: 'rgba(0, 0, 0, 0.5)',
// //           backdropFilter: 'blur(8px)',
// //         }}
// //       >
// //         <Box
// //           sx={{
// //             display: 'flex',
// //             flexDirection: 'column',
// //             alignItems: 'center',
// //             gap: 2,
// //           }}
// //         >
// //           <CircularProgress size={60} sx={{ color: 'primary.main' }} />
// //           <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
// //             Finding your location...
// //           </Typography>
// //         </Box>
// //       </Backdrop>

// //       {/* App Bar */}
// //       <AppBar
// //         position="absolute"
// //         elevation={0}
// //         sx={{
// //           bgcolor: 'rgba(255, 255, 255, 0.9)',
// //           backdropFilter: 'blur(20px)',
// //           zIndex: 1000,
// //         }}
// //       >
// //         <Toolbar>
// //           <IconButton edge="start" onClick={() => router.push('/profile')}>
// //             <MenuIcon />
// //           </IconButton>

// //           <Box sx={{ flex: 1 }} />

// //           <IconButton onClick={() => router.push('/notifications')}>
// //             <Badge badgeContent={0} color="error">
// //               <NotificationsIcon />
// //             </Badge>
// //           </IconButton>

// //           <Avatar
// //             src={user?.profilePicture}
// //             sx={{ ml: 1, width: 36, height: 36, cursor: 'pointer' }}
// //             onClick={() => router.push('/profile')}
// //           >
// //             {user?.firstName?.[0] || 'U'}
// //           </Avatar>
// //         </Toolbar>
// //       </AppBar>

// //       {/* Map Container */}
// //       <GoogleMapProvider>
// //         <OptimizedMap
// //           center={mapCenter || { lat: -15.4167, lng: 28.2833 }}
// //           zoom={mapCenter ? 15 : 13}
// //           markers={getMarkers()}
// //           onMapLoad={setMapRef}
// //         />
// //       </GoogleMapProvider>

// //       {/* Map Controls */}
// //       <MapControls
// //         onLocateMe={handleRelocate}
// //         onZoomIn={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) + 1)}
// //         onZoomOut={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) - 1)}
// //         style={{ bottom: hasSearchResults ? 500 : showLocationSheet ? 380 : 120 }}
// //       />

// //       {/* Current Location FAB */}
// //       <Fab
// //         color="primary"
// //         sx={{
// //           position: 'absolute',
// //           bottom: hasSearchResults ? 480 : showLocationSheet ? 360 : 100,
// //           right: 16,
// //           zIndex: 999,
// //         }}
// //         onClick={handleRelocate}
// //       >
// //         <NavigationIcon />
// //       </Fab>

// //       {/* Location Search Sheet */}
// //       <AnimatePresence>
// //         {showLocationSheet && (
// //           <motion.div
// //             initial={{ y: '100%' }}
// //             animate={{ y: 0 }}
// //             exit={{ y: '100%' }}
// //             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
// //             style={{
// //               position: 'absolute',
// //               bottom: 0,
// //               left: 0,
// //               right: 0,
// //               zIndex: 1100,
// //             }}
// //           >
// //             <Paper
// //               elevation={8}
// //               sx={{
// //                 borderTopLeftRadius: 32,
// //                 borderTopRightRadius: 32,
// //                 p: 3,
// //                 pb: 12,
// //                 maxHeight: hasSearchResults ? '85vh' : '70vh',
// //                 overflow: 'auto',
// //                 transition: 'max-height 0.3s ease',
// //               }}
// //             >
// //               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
// //                 <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
// //                   Where to?
// //                 </Typography>
// //                 {(pickupLocation || dropoffLocation) && (
// //                   <IconButton size="small" onClick={handleReset}>
// //                     <CloseIcon />
// //                   </IconButton>
// //                 )}
// //               </Box>

// //               {/* Pickup Input */}
// //               <Box sx={{ mb: 1.5 }}>
// //                 <TextField
// //                   fullWidth
// //                   value={pickupQuery}
// //                   onChange={(e) => handleSearchChange(e.target.value, true)}
// //                   onFocus={() => setActiveInput('pickup')}
// //                   placeholder="Pickup location"
// //                   InputProps={{
// //                     startAdornment: (
// //                       <InputAdornment position="start">
// //                         <Box
// //                           sx={{
// //                             width: 12,
// //                             height: 12,
// //                             borderRadius: '50%',
// //                             bgcolor: 'success.main',
// //                           }}
// //                         />
// //                       </InputAdornment>
// //                     ),
// //                     endAdornment: pickupQuery && (
// //                       <InputAdornment position="end">
// //                         <IconButton
// //                           size="small"
// //                           onClick={() => {
// //                             setPickupQuery('');
// //                             setPickupLocation(null);
// //                             setPredictions([]);
// //                           }}
// //                         >
// //                           <CloseIcon fontSize="small" />
// //                         </IconButton>
// //                       </InputAdornment>
// //                     ),
// //                   }}
// //                   sx={{
// //                     '& .MuiOutlinedInput-root': {
// //                       bgcolor: activeInput === 'pickup' ? 'action.selected' : 'background.paper',
// //                       '&:hover': {
// //                         bgcolor: 'action.hover',
// //                       },
// //                     },
// //                   }}
// //                 />
// //               </Box>

// //               {/* Dropoff Input */}
// //               <Box sx={{ mb: 2 }}>
// //                 <TextField
// //                   fullWidth
// //                   value={dropoffQuery}
// //                   onChange={(e) => handleSearchChange(e.target.value, false)}
// //                   onFocus={() => setActiveInput('dropoff')}
// //                   placeholder="Where are you going?"
// //                   InputProps={{
// //                     startAdornment: (
// //                       <InputAdornment position="start">
// //                         <Box
// //                           sx={{
// //                             width: 12,
// //                             height: 12,
// //                             borderRadius: 1,
// //                             bgcolor: 'error.main',
// //                           }}
// //                         />
// //                       </InputAdornment>
// //                     ),
// //                     endAdornment: dropoffQuery && (
// //                       <InputAdornment position="end">
// //                         <IconButton
// //                           size="small"
// //                           onClick={() => {
// //                             setDropoffQuery('');
// //                             setDropoffLocation(null);
// //                             setPredictions([]);
// //                           }}
// //                         >
// //                           <CloseIcon fontSize="small" />
// //                         </IconButton>
// //                       </InputAdornment>
// //                     ),
// //                   }}
// //                   sx={{
// //                     '& .MuiOutlinedInput-root': {
// //                       bgcolor: activeInput === 'dropoff' ? 'action.selected' : 'background.paper',
// //                       '&:hover': {
// //                         bgcolor: 'action.hover',
// //                       },
// //                     },
// //                   }}
// //                 />
// //               </Box>

// //               {/* Search Results */}
// //               <AnimatePresence>
// //                 {hasSearchResults && (
// //                   <motion.div
// //                     initial={{ opacity: 0, height: 0 }}
// //                     animate={{ opacity: 1, height: 'auto' }}
// //                     exit={{ opacity: 0, height: 0 }}
// //                   >
// //                     <Paper
// //                       elevation={4}
// //                       sx={{
// //                         mb: 2,
// //                         maxHeight: 300,
// //                         overflow: 'auto',
// //                         borderRadius: 3,
// //                       }}
// //                     >
// //                       <List disablePadding>
// //                         {/* Current Location Option - FIRST */}
// //                         {location && (
// //                           <ListItem
// //                             button
// //                             onClick={handleUseCurrentLocation}
// //                             sx={{
// //                               borderBottom: 1,
// //                               borderColor: 'divider',
// //                               bgcolor: 'primary.light',
// //                               '&:hover': {
// //                                 bgcolor: 'primary.main',
// //                                 '& *': {
// //                                   color: 'white',
// //                                 },
// //                               },
// //                             }}
// //                           >
// //                             <ListItemIcon>
// //                               <MyLocationIcon color="primary" />
// //                             </ListItemIcon>
// //                             <ListItemText
// //                               primary="Use Current Location"
// //                               primaryTypographyProps={{
// //                                 fontWeight: 600,
// //                                 color: 'primary.dark',
// //                               }}
// //                             />
// //                           </ListItem>
// //                         )}

// //                         {/* Loading State */}
// //                         {loadingPredictions && (
// //                           <ListItem>
// //                             <CircularProgress size={24} sx={{ mr: 2 }} />
// //                             <ListItemText primary="Searching..." />
// //                           </ListItem>
// //                         )}

// //                         {/* Predictions */}
// //                         {predictions.map((prediction) => (
// //                           <ListItem
// //                             key={prediction.place_id}
// //                             button
// //                             onClick={() => handleSelectPrediction(prediction)}
// //                             sx={{
// //                               '&:hover': {
// //                                 bgcolor: 'action.hover',
// //                               },
// //                             }}
// //                           >
// //                             <ListItemIcon>
// //                               <LocationIcon />
// //                             </ListItemIcon>
// //                             <ListItemText
// //                               primary={prediction.structured_formatting.main_text}
// //                               secondary={prediction.structured_formatting.secondary_text}
// //                               primaryTypographyProps={{
// //                                 fontWeight: 500,
// //                               }}
// //                               secondaryTypographyProps={{
// //                                 variant: 'caption',
// //                               }}
// //                             />
// //                           </ListItem>
// //                         ))}
// //                       </List>
// //                     </Paper>
// //                   </motion.div>
// //                 )}
// //               </AnimatePresence>

// //               {/* Recent Locations - Only show when not searching */}
// //               {!hasSearchResults && recentLocations.length > 0 && (
// //                 <>
// //                   <Typography
// //                     variant="subtitle2"
// //                     color="text.secondary"
// //                     sx={{ mb: 1, px: 1, fontWeight: 600 }}
// //                   >
// //                     Recent Locations
// //                   </Typography>
// //                   {recentLocations.map((loc, index) => (
// //                     <Paper
// //                       key={index}
// //                       sx={{
// //                         p: 2,
// //                         mb: 1,
// //                         borderRadius: 3,
// //                         cursor: 'pointer',
// //                         transition: 'all 0.2s',
// //                         '&:hover': {
// //                           bgcolor: 'action.hover',
// //                           transform: 'translateX(4px)',
// //                         },
// //                       }}
// //                       onClick={() => {
// //                         if (activeInput === 'pickup') {
// //                           setPickupLocation(loc);
// //                           setPickupQuery(loc.address);
// //                           setActiveInput('dropoff');
// //                         } else {
// //                           setDropoffLocation(loc);
// //                           setDropoffQuery(loc.address);
// //                         }
// //                         if (mapRef) {
// //                           mapRef.animateToLocation({ lat: loc.lat, lng: loc.lng }, 15);
// //                         }
// //                       }}
// //                     >
// //                       <Typography variant="body2" sx={{ fontWeight: 500 }}>
// //                         📍 {loc.name || loc.address}
// //                       </Typography>
// //                       {loc.name && loc.name !== loc.address && (
// //                         <Typography variant="caption" color="text.secondary">
// //                           {loc.address}
// //                         </Typography>
// //                       )}
// //                     </Paper>
// //                   ))}
// //                 </>
// //               )}

// //               {/* Confirm Button */}
// //               {pickupLocation && dropoffLocation && !hasSearchResults && (
// //                 <motion.div
// //                   initial={{ opacity: 0, y: 20 }}
// //                   animate={{ opacity: 1, y: 0 }}
// //                 >
// //                   <Button
// //                     fullWidth
// //                     variant="contained"
// //                     size="large"
// //                     onClick={() => {
// //                       setShowLocationSheet(false);
// //                       setShowRideOptions(true);
// //                     }}
// //                     sx={{ height: 56, mt: 2, fontWeight: 600 }}
// //                   >
// //                     Continue
// //                   </Button>
// //                 </motion.div>
// //               )}
// //             </Paper>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>

// //       {/* Ride Options Sheet */}
// //       {showRideOptions && pickupLocation && dropoffLocation && (
// //         <RideOptionsSheet
// //           pickupLocation={pickupLocation}
// //           dropoffLocation={dropoffLocation}
// //           onClose={handleReset}
// //           onConfirmRide={handleConfirmRide}
// //         />
// //       )}
// //     </Box>
// //   );
// // }
// // // rider/app/(main)/home/page.jsx - MODIFIED VERSION
// // 'use client';
// // import { useState, useEffect, useRef } from 'react';
// // import { useRouter } from 'next/navigation';
// // import {
// //   Box,
// //   AppBar,
// //   Toolbar,
// //   IconButton,
// //   Avatar,
// //   Typography,
// //   Paper,
// //   Button,
// //   Badge,
// //   Fab,
// //   List,
// //   ListItem,
// //   ListItemIcon,
// //   ListItemText,
// //   CircularProgress,
// //   Backdrop,
// // } from '@mui/material';
// // import {
// //   Menu as MenuIcon,
// //   Notifications as NotificationsIcon,
// //   MyLocation as MyLocationIcon,
// //   Navigation as NavigationIcon,
// //   Close as CloseIcon,
// //   LocationOn as LocationIcon,
// //   Search as SearchIcon,
// // } from '@mui/icons-material';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { useAuth } from '@/lib/hooks/useAuth';
// // import { useGeolocation } from '@/lib/hooks/useGeolocation';
// // import { useRide } from '@/lib/hooks/useRide';
// // import { GoogleMapProvider } from '@/components/Map/GoogleMapProvider';
// // import { OptimizedMap } from '@/components/Map/OptimizedMap';
// // import { MapControls } from '@/components/Map/MapControls';
// // import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
// // import { createCustomMarker } from '@/components/Map/CustomMarkers';
// // import { debounce } from '@/Functions';

// // export default function HomePage() {
// //   const router = useRouter();
// //   const { user } = useAuth();
// //   const { location, loading: locationLoading, refresh } = useGeolocation({ watch: true });
// //   const { activeRide } = useRide();
  
// //   const [mapCenter, setMapCenter] = useState(null);
// //   const [pickupLocation, setPickupLocation] = useState(null);
// //   const [dropoffLocation, setDropoffLocation] = useState(null);
// //   const [showLocationSheet, setShowLocationSheet] = useState(true);
// //   const [showRideOptions, setShowRideOptions] = useState(false);
// //   const [recentLocations, setRecentLocations] = useState([]);
// //   const [mapRef, setMapRef] = useState(null);
// //   const [isRelocating, setIsRelocating] = useState(false);
  
// //   // Search states
// //   const [pickupQuery, setPickupQuery] = useState('');
// //   const [dropoffQuery, setDropoffQuery] = useState('');
// //   const [predictions, setPredictions] = useState([]);
// //   const [loadingPredictions, setLoadingPredictions] = useState(false);
// //   const [activeInput, setActiveInput] = useState(null);
// //   const [mapSnapshot, setMapSnapshot] = useState(null);
  
// //   const autocompleteService = useRef(null);
// //   const placesService = useRef(null);

// //   // Initialize Google Places services
// //   useEffect(() => {
// //     if (typeof window !== 'undefined' && window.google) {
// //       autocompleteService.current = new window.google.maps.places.AutocompleteService();
// //       placesService.current = new window.google.maps.places.PlacesService(
// //         document.createElement('div')
// //       );
// //     }
// //   }, []);

// //   // Redirect if there's an active ride
// //   useEffect(() => {
// //     if (activeRide) {
// //       router.push(`/tracking?rideId=${activeRide.id}`);
// //     }
// //   }, [activeRide, router]);

// //   // Set initial map center and pickup to user's location
// //   useEffect(() => {
// //     if (location && !pickupLocation) {
// //       const currentLoc = {
// //         lat: location.lat,
// //         lng: location.lng,
// //         address: 'Current Location',
// //         name: 'Current Location',
// //       };
      
// //       setMapCenter({ lat: location.lat, lng: location.lng });
// //       setPickupLocation(currentLoc);
// //       setPickupQuery('Current Location');
// //     }
// //   }, [location, pickupLocation]);

// //   // Load recent locations
// //   useEffect(() => {
// //     if (typeof window !== 'undefined') {
// //       const saved = localStorage.getItem('recent_locations');
// //       if (saved) {
// //         try {
// //           setRecentLocations(JSON.parse(saved));
// //         } catch (error) {
// //           console.error('Error loading recent locations:', error);
// //         }
// //       }
// //     }
// //   }, []);

// //   // Debounced search function
// //   const debouncedSearch = useRef(
// //     debounce((query) => {
// //       if (!query || query.length < 3 || query === 'Current Location') {
// //         setPredictions([]);
// //         return;
// //       }

// //       if (!autocompleteService.current) return;

// //       setLoadingPredictions(true);
// //       autocompleteService.current.getPlacePredictions(
// //         {
// //           input: query,
// //           componentRestrictions: { country: 'zm' },
// //           types: ['geocode', 'establishment'],
// //         },
// //         (results, status) => {
// //           setLoadingPredictions(false);
// //           if (status === window.google.maps.places.PlacesServiceStatus.OK) {
// //             setPredictions(results || []);
// //           } else {
// //             setPredictions([]);
// //           }
// //         }
// //       );
// //     }, 300)
// //   ).current;

// //   // Handle input change
// //   const handleSearchChange = (value, isPickup) => {
// //     if (isPickup) {
// //       setPickupQuery(value);
// //       setActiveInput('pickup');
// //     } else {
// //       setDropoffQuery(value);
// //       setActiveInput('dropoff');
// //     }
    
// //     if (value && value.length > 0 && value !== 'Current Location') {
// //       debouncedSearch(value);
// //     } else {
// //       setPredictions([]);
// //     }
// //   };

// //   // Select location from predictions
// //   const handleSelectPrediction = (prediction) => {
// //     if (!placesService.current) return;

// //     placesService.current.getDetails(
// //       {
// //         placeId: prediction.place_id,
// //         fields: ['geometry', 'formatted_address', 'name'],
// //       },
// //       (place, status) => {
// //         if (status === window.google.maps.places.PlacesServiceStatus.OK) {
// //           const location = {
// //             lat: place.geometry.location.lat(),
// //             lng: place.geometry.location.lng(),
// //             address: place.formatted_address,
// //             name: place.name,
// //             placeId: prediction.place_id,
// //           };

// //           if (activeInput === 'pickup') {
// //             setPickupLocation(location);
// //             setPickupQuery(place.formatted_address);
// //             saveToRecent(location);
// //             setPredictions([]);
// //             setActiveInput(null);
// //           } else {
// //             setDropoffLocation(location);
// //             setDropoffQuery(place.formatted_address);
// //             saveToRecent(location);
// //             setPredictions([]);
// //             setActiveInput(null);
// //           }

// //           if (mapRef) {
// //             mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 15);
// //           }
// //         }
// //       }
// //     );
// //   };

// //   // Use current location
// //   const handleUseCurrentLocation = () => {
// //     if (location) {
// //       const currentLoc = {
// //         lat: location.lat,
// //         lng: location.lng,
// //         address: 'Current Location',
// //         name: 'Current Location',
// //       };

// //       if (activeInput === 'pickup' || !activeInput) {
// //         setPickupLocation(currentLoc);
// //         setPickupQuery('Current Location');
// //         setPredictions([]);
// //         setActiveInput(null);
// //       } else {
// //         setDropoffLocation(currentLoc);
// //         setDropoffQuery('Current Location');
// //         setPredictions([]);
// //         setActiveInput(null);
// //       }

// //       if (mapRef) {
// //         mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 15);
// //       }
// //     }
// //   };

// //   // Save location to recent
// //   const saveToRecent = (location) => {
// //     if (location.address === 'Current Location') return;
    
// //     const newRecent = [
// //       location,
// //       ...recentLocations.filter((l) => l.address !== location.address),
// //     ].slice(0, 5);

// //     setRecentLocations(newRecent);
// //     if (typeof window !== 'undefined') {
// //       localStorage.setItem('recent_locations', JSON.stringify(newRecent));
// //     }
// //   };

// //   const handleConfirmRide = async (rideDetails) => {
// //     try {
// //       router.push(
// //         '/finding-driver?' +
// //           new URLSearchParams({
// //             pickup: JSON.stringify(pickupLocation),
// //             dropoff: JSON.stringify(dropoffLocation),
// //             ...rideDetails,
// //           })
// //       );
// //     } catch (error) {
// //       console.error('Error confirming ride:', error);
// //       alert('Failed to book ride. Please try again.');
// //     }
// //   };

// //   const handleReset = () => {
// //     setPickupLocation(null);
// //     setDropoffLocation(null);
// //     setPickupQuery('');
// //     setDropoffQuery('');
// //     setShowRideOptions(false);
// //     setShowLocationSheet(true);
// //     setPredictions([]);
// //     setActiveInput(null);
// //   };

// //   const handleRelocate = () => {
// //     // Capture map snapshot
// //     if (mapRef?.map) {
// //       const mapDiv = mapRef.map.getDiv();
// //       if (mapDiv) {
// //         try {
// //           // Use html2canvas if available, otherwise use a gray placeholder
// //           setMapSnapshot('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UwZTBlMCIvPjwvc3ZnPg==');
// //         } catch (error) {
// //           console.error('Error creating snapshot:', error);
// //         }
// //       }
// //     }
    
// //     setIsRelocating(true);
// //     refresh();
    
// //     setTimeout(() => {
// //       if (location && mapRef) {
// //         mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
// //       }
// //       setIsRelocating(false);
// //       setMapSnapshot(null);
// //     }, 1200);
// //   };

// //   // Get markers for map
// //   const getMarkers = () => {
// //     const markers = [];

// //     if (pickupLocation && pickupLocation.address !== 'Current Location') {
// //       markers.push({
// //         id: 'pickup',
// //         position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
// //         icon: createCustomMarker('pickup'),
// //         title: 'Pickup Location',
// //       });
// //     }

// //     if (dropoffLocation) {
// //       markers.push({
// //         id: 'dropoff',
// //         position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
// //         icon: createCustomMarker('dropoff'),
// //         title: 'Dropoff Location',
// //       });
// //     }

// //     return markers;
// //   };

// //   const hasSearchResults = activeInput && (predictions.length > 0 || loadingPredictions);

// //   if (locationLoading && !location) {
// //     return (
// //       <Box
// //         sx={{
// //           height: '100vh',
// //           display: 'flex',
// //           flexDirection: 'column',
// //           alignItems: 'center',
// //           justifyContent: 'center',
// //           gap: 2,
// //         }}
// //       >
// //         <CircularProgress size={60} />
// //         <Typography variant="h6" sx={{ fontWeight: 600 }}>
// //           Getting your location...
// //         </Typography>
// //         <Typography variant="body2" color="text.secondary">
// //           Please enable location services
// //         </Typography>
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
// //       {/* Relocate Loading Overlay with Map Snapshot */}
// //       <Backdrop
// //         open={isRelocating}
// //         sx={{
// //           zIndex: 2000,
// //           bgcolor: 'transparent',
// //         }}
// //       >
// //         {mapSnapshot && (
// //           <Box
// //             sx={{
// //               position: 'absolute',
// //               top: 0,
// //               left: 0,
// //               right: 0,
// //               bottom: 0,
// //               backgroundImage: `url(${mapSnapshot})`,
// //               backgroundSize: 'cover',
// //               backgroundPosition: 'center',
// //               filter: 'blur(4px)',
// //               opacity: 0.8,
// //             }}
// //           />
// //         )}
// //         <Box
// //           sx={{
// //             position: 'relative',
// //             zIndex: 2001,
// //             display: 'flex',
// //             flexDirection: 'column',
// //             alignItems: 'center',
// //             gap: 2,
// //             bgcolor: 'rgba(0, 0, 0, 0.6)',
// //             p: 4,
// //             borderRadius: 4,
// //             backdropFilter: 'blur(10px)',
// //           }}
// //         >
// //           <CircularProgress size={60} sx={{ color: 'primary.main' }} />
// //           <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
// //             Finding your location...
// //           </Typography>
// //         </Box>
// //       </Backdrop>

// //       {/* App Bar */}
// //       <AppBar
// //         position="absolute"
// //         elevation={0}
// //         sx={{
// //           bgcolor: 'rgba(255, 255, 255, 0.9)',
// //           backdropFilter: 'blur(20px)',
// //           zIndex: 1000,
// //         }}
// //       >
// //         <Toolbar>
// //           <IconButton edge="start" onClick={() => router.push('/profile')}>
// //             <MenuIcon />
// //           </IconButton>

// //           <Box sx={{ flex: 1 }} />

// //           <IconButton onClick={() => router.push('/notifications')}>
// //             <Badge badgeContent={0} color="error">
// //               <NotificationsIcon />
// //             </Badge>
// //           </IconButton>

// //           <Avatar
// //             src={user?.profilePicture}
// //             sx={{ ml: 1, width: 36, height: 36, cursor: 'pointer' }}
// //             onClick={() => router.push('/profile')}
// //           >
// //             {user?.firstName?.[0] || 'U'}
// //           </Avatar>
// //         </Toolbar>
// //       </AppBar>

// //       {/* Map Container */}
// //       <GoogleMapProvider>
// //         <OptimizedMap
// //           center={mapCenter || { lat: -15.4167, lng: 28.2833 }}
// //           zoom={mapCenter ? 15 : 13}
// //           markers={getMarkers()}
// //           onMapLoad={setMapRef}
// //         />
// //       </GoogleMapProvider>

// //       {/* Map Controls */}
// //       <MapControls
// //         onLocateMe={handleRelocate}
// //         onZoomIn={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) + 1)}
// //         onZoomOut={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) - 1)}
// //         style={{ 
// //           bottom: hasSearchResults ? 680 : showLocationSheet ? 440 : 120,
// //           transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
// //         }}
// //       />

// //       {/* Current Location FAB */}
// //       <Fab
// //         color="primary"
// //         sx={{
// //           position: 'absolute',
// //           bottom: hasSearchResults ? 660 : showLocationSheet ? 420 : 100,
// //           right: 16,
// //           zIndex: 999,
// //           transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
// //         }}
// //         onClick={handleRelocate}
// //       >
// //         <NavigationIcon />
// //       </Fab>

// //       {/* Location Search Sheet */}
// //       <AnimatePresence>
// //         {showLocationSheet && (
// //           <motion.div
// //             initial={{ y: '100%' }}
// //             animate={{ y: 0 }}
// //             exit={{ y: '100%' }}
// //             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
// //             style={{
// //               position: 'absolute',
// //               bottom: 80, // Above bottom nav
// //               left: 0,
// //               right: 0,
// //               zIndex: 1100,
// //             }}
// //           >
// //             <Paper
// //               elevation={8}
// //               sx={{
// //                 borderTopLeftRadius: 32,
// //                 borderTopRightRadius: 32,
// //                 p: 3,
// //                 pb: 4,
// //                 maxHeight: hasSearchResults ? 'calc(100vh - 160px)' : '60vh',
// //                 overflow: 'auto',
// //                 transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
// //               }}
// //             >
// //               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
// //                 <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
// //                   Where to?
// //                 </Typography>
// //                 {(pickupLocation || dropoffLocation) && (
// //                   <IconButton size="small" onClick={handleReset}>
// //                     <CloseIcon />
// //                   </IconButton>
// //                 )}
// //               </Box>

// //               {/* Pickup Input */}
// //               <Box sx={{ mb: 1.5, position: 'relative' }}>
// //                 <Box
// //                   sx={{
// //                     display: 'flex',
// //                     alignItems: 'center',
// //                     bgcolor: activeInput === 'pickup' ? 'action.selected' : 'background.paper',
// //                     border: '1px solid',
// //                     borderColor: activeInput === 'pickup' ? 'primary.main' : 'divider',
// //                     borderRadius: 2,
// //                     px: 2,
// //                     py: 1.5,
// //                     transition: 'all 0.2s',
// //                     '&:hover': {
// //                       bgcolor: activeInput === 'pickup' ? 'action.selected' : 'action.hover',
// //                     },
// //                   }}
// //                 >
// //                   <Box
// //                     sx={{
// //                       width: 12,
// //                       height: 12,
// //                       borderRadius: '50%',
// //                       bgcolor: 'success.main',
// //                       mr: 2,
// //                       flexShrink: 0,
// //                     }}
// //                   />
// //                   <input
// //                     type="text"
// //                     value={pickupQuery}
// //                     onChange={(e) => handleSearchChange(e.target.value, true)}
// //                     onFocus={() => setActiveInput('pickup')}
// //                     placeholder="Pickup location"
// //                     autoComplete="off"
// //                     style={{
// //                       flex: 1,
// //                       border: 'none',
// //                       outline: 'none',
// //                       background: 'transparent',
// //                       fontSize: '1rem',
// //                       color: 'inherit',
// //                       fontFamily: 'inherit',
// //                     }}
// //                   />
// //                   {pickupQuery && pickupQuery !== 'Current Location' && (
// //                     <IconButton
// //                       size="small"
// //                       onClick={(e) => {
// //                         e.stopPropagation();
// //                         setPickupQuery('');
// //                         setPickupLocation(null);
// //                         setPredictions([]);
// //                       }}
// //                       sx={{ ml: 1 }}
// //                     >
// //                       <CloseIcon fontSize="small" />
// //                     </IconButton>
// //                   )}
// //                 </Box>
// //               </Box>

// //               {/* Dropoff Input */}
// //               <Box sx={{ mb: 2, position: 'relative' }}>
// //                 <Box
// //                   sx={{
// //                     display: 'flex',
// //                     alignItems: 'center',
// //                     bgcolor: activeInput === 'dropoff' ? 'action.selected' : 'background.paper',
// //                     border: '1px solid',
// //                     borderColor: activeInput === 'dropoff' ? 'primary.main' : 'divider',
// //                     borderRadius: 2,
// //                     px: 2,
// //                     py: 1.5,
// //                     transition: 'all 0.2s',
// //                     '&:hover': {
// //                       bgcolor: activeInput === 'dropoff' ? 'action.selected' : 'action.hover',
// //                     },
// //                   }}
// //                 >
// //                   <Box
// //                     sx={{
// //                       width: 12,
// //                       height: 12,
// //                       borderRadius: 1,
// //                       bgcolor: 'error.main',
// //                       mr: 2,
// //                       flexShrink: 0,
// //                     }}
// //                   />
// //                   <input
// //                     type="text"
// //                     value={dropoffQuery}
// //                     onChange={(e) => handleSearchChange(e.target.value, false)}
// //                     onFocus={() => setActiveInput('dropoff')}
// //                     placeholder="Where are you going?"
// //                     autoComplete="off"
// //                     style={{
// //                       flex: 1,
// //                       border: 'none',
// //                       outline: 'none',
// //                       background: 'transparent',
// //                       fontSize: '1rem',
// //                       color: 'inherit',
// //                       fontFamily: 'inherit',
// //                     }}
// //                   />
// //                   {dropoffQuery && (
// //                     <IconButton
// //                       size="small"
// //                       onClick={(e) => {
// //                         e.stopPropagation();
// //                         setDropoffQuery('');
// //                         setDropoffLocation(null);
// //                         setPredictions([]);
// //                       }}
// //                       sx={{ ml: 1 }}
// //                     >
// //                       <CloseIcon fontSize="small" />
// //                     </IconButton>
// //                   )}
// //                 </Box>
// //               </Box>

// //               {/* Search Results */}
// //               <AnimatePresence>
// //                 {hasSearchResults && (
// //                   <motion.div
// //                     initial={{ opacity: 0, y: -10 }}
// //                     animate={{ opacity: 1, y: 0 }}
// //                     exit={{ opacity: 0, y: -10 }}
// //                     transition={{ duration: 0.2 }}
// //                   >
// //                     <Paper
// //                       elevation={4}
// //                       sx={{
// //                         mb: 2,
// //                         maxHeight: 400,
// //                         overflow: 'auto',
// //                         borderRadius: 3,
// //                       }}
// //                     >
// //                       <List disablePadding>
// //                         {/* Current Location Option - ALWAYS FIRST */}
// //                         {location && (
// //                           <ListItem
// //                             button
// //                             onClick={handleUseCurrentLocation}
// //                             sx={{
// //                               borderBottom: 1,
// //                               borderColor: 'divider',
// //                               bgcolor: 'primary.light',
// //                               py: 2,
// //                               '&:hover': {
// //                                 bgcolor: 'primary.main',
// //                                 '& .MuiListItemIcon-root': {
// //                                   color: 'white',
// //                                 },
// //                                 '& .MuiListItemText-primary': {
// //                                   color: 'white',
// //                                 },
// //                               },
// //                             }}
// //                           >
// //                             <ListItemIcon>
// //                               <MyLocationIcon color="primary" sx={{ fontSize: 28 }} />
// //                             </ListItemIcon>
// //                             <ListItemText
// //                               primary="Use Current Location"
// //                               primaryTypographyProps={{
// //                                 fontWeight: 600,
// //                                 color: 'primary.dark',
// //                                 fontSize: '1rem',
// //                               }}
// //                             />
// //                           </ListItem>
// //                         )}

// //                         {/* Loading State */}
// //                         {loadingPredictions && (
// //                           <ListItem sx={{ py: 2 }}>
// //                             <CircularProgress size={24} sx={{ mr: 2 }} />
// //                             <ListItemText primary="Searching locations..." />
// //                           </ListItem>
// //                         )}

// //                         {/* Predictions */}
// //                         {!loadingPredictions && predictions.map((prediction) => (
// //                           <ListItem
// //                             key={prediction.place_id}
// //                             button
// //                             onClick={() => handleSelectPrediction(prediction)}
// //                             sx={{
// //                               py: 2,
// //                               '&:hover': {
// //                                 bgcolor: 'action.hover',
// //                               },
// //                             }}
// //                           >
// //                             <ListItemIcon>
// //                               <LocationIcon color="action" />
// //                             </ListItemIcon>
// //                             <ListItemText
// //                               primary={prediction.structured_formatting.main_text}
// //                               secondary={prediction.structured_formatting.secondary_text}
// //                               primaryTypographyProps={{
// //                                 fontWeight: 500,
// //                               }}
// //                               secondaryTypographyProps={{
// //                                 variant: 'caption',
// //                               }}
// //                             />
// //                           </ListItem>
// //                         ))}
                        
// //                         {/* No Results */}
// //                         {!loadingPredictions && predictions.length === 0 && (pickupQuery.length > 2 || dropoffQuery.length > 2) && activeInput && (
// //                           <ListItem sx={{ py: 3 }}>
// //                             <ListItemText
// //                               primary="No locations found"
// //                               secondary="Try a different search term"
// //                               sx={{ textAlign: 'center' }}
// //                               primaryTypographyProps={{
// //                                 color: 'text.secondary',
// //                               }}
// //                             />
// //                           </ListItem>
// //                         )}
// //                       </List>
// //                     </Paper>
// //                   </motion.div>
// //                 )}
// //               </AnimatePresence>

// //               {/* Recent Locations - Only show when not searching */}
// //               {!hasSearchResults && !activeInput && recentLocations.length > 0 && (
// //                 <Box sx={{ mt: 2 }}>
// //                   <Typography
// //                     variant="subtitle2"
// //                     color="text.secondary"
// //                     sx={{ mb: 1.5, px: 1, fontWeight: 600 }}
// //                   >
// //                     Recent Locations
// //                   </Typography>
// //                   {recentLocations.map((loc, index) => (
// //                     <motion.div
// //                       key={index}
// //                       initial={{ opacity: 0, x: -20 }}
// //                       animate={{ opacity: 1, x: 0 }}
// //                       transition={{ delay: index * 0.05 }}
// //                     >
// //                       <Paper
// //                         sx={{
// //                           p: 2,
// //                           mb: 1.5,
// //                           borderRadius: 3,
// //                           cursor: 'pointer',
// //                           transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
// //                           border: '1px solid',
// //                           borderColor: 'divider',
// //                           '&:hover': {
// //                             bgcolor: 'action.hover',
// //                             transform: 'translateX(4px)',
// //                             borderColor: 'primary.main',
// //                           },
// //                           '&:active': {
// //                             transform: 'scale(0.98)',
// //                           },
// //                         }}
// //                         onClick={() => {
// //                           if (!dropoffLocation) {
// //                             setDropoffLocation(loc);
// //                             setDropoffQuery(loc.address);
// //                           } else {
// //                             setPickupLocation(loc);
// //                             setPickupQuery(loc.address);
// //                           }
// //                           if (mapRef) {
// //                             mapRef.animateToLocation({ lat: loc.lat, lng: loc.lng }, 15);
// //                           }
// //                         }}
// //                       >
// //                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
// //                           <Box
// //                             sx={{
// //                               width: 40,
// //                               height: 40,
// //                               borderRadius: 2,
// //                               bgcolor: 'primary.light',
// //                               display: 'flex',
// //                               alignItems: 'center',
// //                               justifyContent: 'center',
// //                               fontSize: '1.2rem',
// //                             }}
// //                           >
// //                             📍
// //                           </Box>
// //                           <Box sx={{ flex: 1 }}>
// //                             <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
// //                               {loc.name || loc.address}
// //                             </Typography>
// //                             {loc.name && loc.name !== loc.address && (
// //                               <Typography variant="caption" color="text.secondary">
// //                                 {loc.address}
// //                               </Typography>
// //                             )}
// //                           </Box>
// //                         </Box>
// //                       </Paper>
// //                     </motion.div>
// //                   ))}
// //                 </Box>
// //               )}

// //               {/* Confirm Button */}
// //               {pickupLocation && dropoffLocation && !hasSearchResults && (
// //                 <motion.div
// //                   initial={{ opacity: 0, y: 20 }}
// //                   animate={{ opacity: 1, y: 0 }}
// //                 >
// //                   <Button
// //                     fullWidth
// //                     variant="contained"
// //                     size="large"
// //                     onClick={() => {
// //                       setShowLocationSheet(false);
// //                       setShowRideOptions(true);
// //                     }}
// //                     sx={{ height: 56, mt: 2, fontWeight: 600 }}
// //                   >
// //                     Continue
// //                   </Button>
// //                 </motion.div>
// //               )}
// //             </Paper>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>

// //       {/* Ride Options Sheet */}
// //       {showRideOptions && pickupLocation && dropoffLocation && (
// //         <RideOptionsSheet
// //           pickupLocation={pickupLocation}
// //           dropoffLocation={dropoffLocation}
// //           onClose={handleReset}
// //           onConfirmRide={handleConfirmRide}
// //         />
// //       )}
// //     </Box>
// //   );
// // }
// // rider/app/(main)/home/page.jsx - FIXED VERSION
// 'use client';
// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   Box, AppBar, Toolbar, IconButton, Avatar, Typography, Paper, Button, 
//   Badge, Fab, List, ListItem, ListItemIcon, ListItemText, CircularProgress,
//   Backdrop, TextField, InputAdornment,
// } from '@mui/material';
// import { 
//   Menu as MenuIcon, Notifications as NotificationsIcon, 
//   MyLocation as MyLocationIcon, Navigation as NavigationIcon,
//   Close as CloseIcon, LocationOn as LocationIcon,
//   Search as SearchIcon, Place as PlaceIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useGeolocation } from '@/lib/hooks/useGeolocation';
// import { useRide } from '@/lib/hooks/useRide';
// import { GoogleMapProvider } from '@/components/Map/GoogleMapProvider';
// import { OptimizedMap } from '@/components/Map/OptimizedMap';
// import { MapControls } from '@/components/Map/MapControls';
// import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
// import { createCustomMarker } from '@/components/Map/CustomMarkers';
// import { debounce } from '@/Functions';
// import html2canvas from 'html2canvas';

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
//   const [mapRef, setMapRef] = useState(null);
//   const [isRelocating, setIsRelocating] = useState(false);
  
//   // Search states
//   const [pickupQuery, setPickupQuery] = useState('');
//   const [dropoffQuery, setDropoffQuery] = useState('');
//   const [predictions, setPredictions] = useState([]);
//   const [loadingPredictions, setLoadingPredictions] = useState(false);
//   const [activeInput, setActiveInput] = useState(null);
//   const [mapSnapshot, setMapSnapshot] = useState(null);
//   const [showSearchResults, setShowSearchResults] = useState(false);

//   const autocompleteService = useRef(null);
//   const placesService = useRef(null);
//   const mapContainerRef = useRef(null);
  
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
//       setPickupQuery('Current Location');
//     }
//   }, [location]);

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

//   // Initialize Google Places services
//   useEffect(() => {
//     const initializeServices = () => {
//       if (typeof window !== 'undefined' && window.google?.maps?.places) {
//         autocompleteService.current = new window.google.maps.places.AutocompleteService();
//         placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
//       } else {
//         // Retry after a short delay if Google Maps isn't loaded yet
//         setTimeout(initializeServices, 100);
//       }
//     };
    
//     initializeServices();
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

//   // Debounced search function
//   const debouncedSearch = useCallback(
//     debounce((query, inputType) => {
//       if (!query || query.length < 2 || query === 'Current Location') {
//         setPredictions([]);
//         setShowSearchResults(false);
//         return;
//       }
      
//       if (!autocompleteService.current) return;
      
//       setLoadingPredictions(true);
//       setShowSearchResults(true);
      
//       autocompleteService.current.getPlacePredictions(
//         {
//           input: query,
//           componentRestrictions: { country: 'zm' },
//           types: ['geocode', 'establishment'],
//         },
//         (results, status) => {
//           setLoadingPredictions(false);
//           if (status === window.google.maps.places.PlacesServiceStatus.OK) {
//             setPredictions(results || []);
//           } else {
//             setPredictions([]);
//           }
//         }
//       );
//     }, 300),
//     []
//   );

//   // Handle input change
//   const handleSearchChange = (value, isPickup) => {
//     if (isPickup) {
//       setPickupQuery(value);
//       setActiveInput('pickup');
//     } else {
//       setDropoffQuery(value);
//       setActiveInput('dropoff');
//     }
    
//     if (value && value.length > 0 && value !== 'Current Location') {
//       debouncedSearch(value, isPickup ? 'pickup' : 'dropoff');
//     } else {
//       setPredictions([]);
//       setShowSearchResults(false);
//     }
//   };

//   // Clear search
//   const handleClearSearch = (isPickup) => {
//     if (isPickup) {
//       setPickupQuery('');
//       setPickupLocation(null);
//     } else {
//       setDropoffQuery('');
//       setDropoffLocation(null);
//     }
//     setPredictions([]);
//     setShowSearchResults(false);
//     setActiveInput(null);
//   };

//   // Select location from predictions
//   const handleSelectPrediction = (prediction) => {
//     if (!placesService.current) return;
    
//     placesService.current.getDetails(
//       {
//         placeId: prediction.place_id,
//         fields: ['geometry', 'formatted_address', 'name', 'vicinity'],
//       },
//       (place, status) => {
//         if (status === window.google.maps.places.PlacesServiceStatus.OK) {
//           const location = {
//             lat: place.geometry.location.lat(),
//             lng: place.geometry.location.lng(),
//             address: place.formatted_address || place.vicinity || prediction.description,
//             name: place.name || prediction.structured_formatting?.main_text || 'Location',
//             placeId: prediction.place_id,
//           };
          
//           if (activeInput === 'pickup' || !dropoffQuery) {
//             setPickupLocation(location);
//             setPickupQuery(location.address);
//           } else {
//             setDropoffLocation(location);
//             setDropoffQuery(location.address);
//           }
          
//           saveToRecent(location);
//           setPredictions([]);
//           setShowSearchResults(false);
//           setActiveInput(null);
          
//           if (mapRef) {
//             mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 15);
//           }
//         }
//       }
//     );
//   };

//   // Use current location
//   const handleUseCurrentLocation = () => {
//     if (location) {
//       const currentLoc = {
//         lat: location.lat,
//         lng: location.lng,
//         address: 'Current Location',
//         name: 'Current Location',
//         placeId: 'current_location',
//       };
      
//       if (activeInput === 'pickup' || !activeInput) {
//         setPickupLocation(currentLoc);
//         setPickupQuery('Current Location');
//       } else {
//         setDropoffLocation(currentLoc);
//         setDropoffQuery('Current Location');
//       }
      
//       setPredictions([]);
//       setShowSearchResults(false);
//       setActiveInput(null);
      
//       if (mapRef) {
//         mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
//       }
//     }
//   };

//   // Select recent location
//   const handleSelectRecentLocation = (loc) => {
//     if (!dropoffLocation) {
//       setDropoffLocation(loc);
//       setDropoffQuery(loc.address);
//     } else {
//       setPickupLocation(loc);
//       setPickupQuery(loc.address);
//     }
    
//     setPredictions([]);
//     setShowSearchResults(false);
//     setActiveInput(null);
    
//     if (mapRef) {
//       mapRef.animateToLocation({ lat: loc.lat, lng: loc.lng }, 15);
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
//       setPickupQuery('Current Location');
//     } else {
//       setPickupLocation(null);
//       setPickupQuery('');
//     }
//     setDropoffLocation(null);
//     setDropoffQuery('');
//     setShowRideOptions(false);
//     setShowLocationSheet(true);
//     setPredictions([]);
//     setShowSearchResults(false);
//     setActiveInput(null);
//   };

//   // Capture map snapshot
//   const captureMapSnapshot = async () => {
//     if (!mapContainerRef.current) return null;
    
//     try {
//       const canvas = await html2canvas(mapContainerRef.current, {
//         useCORS: true,
//         allowTaint: true,
//         backgroundColor: null,
//         scale: 0.5, // Lower quality for performance
//       });
//       return canvas.toDataURL('image/jpeg', 0.7);
//     } catch (error) {
//       console.error('Failed to capture map snapshot:', error);
//       return null;
//     }
//   };

//   const handleRelocate = async () => {
//     try {
//       // Capture snapshot before relocation
//       const snapshot = await captureMapSnapshot();
//       if (snapshot) {
//         setMapSnapshot(snapshot);
//       }
      
//       setIsRelocating(true);
//       await refresh(); // Refresh location
      
//       // Animate to new location
//       if (location && mapRef) {
//         mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
//       }
      
//       // Reset after animation
//       setTimeout(() => {
//         setIsRelocating(false);
//         setMapSnapshot(null);
//       }, 1200);
//     } catch (error) {
//       console.error('Relocation error:', error);
//       setIsRelocating(false);
//       setMapSnapshot(null);
//     }
//   };

//   // Get markers for map - FIXED: No theme parameter needed
//   const getMarkers = () => {
//     const markers = [];
    
//     if (pickupLocation && pickupLocation.placeId !== 'current_location') {
//       markers.push({
//         id: 'pickup',
//         position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
//         icon: createCustomMarker('pickup'), // No theme parameter
//         title: 'Pickup Location',
//       });
//     }
    
//     if (dropoffLocation) {
//       markers.push({
//         id: 'dropoff',
//         position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
//         icon: createCustomMarker('dropoff'), // No theme parameter
//         title: 'Dropoff Location',
//       });
//     }
    
//     return markers;
//   };

//   const hasSearchResults = showSearchResults && (predictions.length > 0 || loadingPredictions);

//   if (locationLoading && !location) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <CircularProgress />
//         <Typography sx={{ ml: 2 }}>
//           Getting your location... Please enable location services
//         </Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
//       {/* Map Container */}
//       <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
//         <GoogleMapProvider>
//           <OptimizedMap
//             center={mapCenter || (location ? { lat: location.lat, lng: location.lng } : { lat: -15.4167, lng: 28.2833 })}
//             zoom={13}
//             markers={getMarkers()}
//             onMapLoad={(map) => {
//               setMapRef(map);
//               if (map?.map?.getDiv()) {
//                 mapContainerRef.current = map.map.getDiv();
//               }
//             }}
//           />
//         </GoogleMapProvider>
//       </Box>

//       {/* Relocate Loading Overlay */}
//       <AnimatePresence>
//         {isRelocating && (
//           <Backdrop
//             open={isRelocating}
//             sx={{
//               zIndex: 1400,
//               backgroundColor: 'rgba(0, 0, 0, 0.7)',
//               backdropFilter: 'blur(4px)',
//             }}
//           >
//             <motion.div
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.9 }}
//               style={{ textAlign: 'center' }}
//             >
//               {mapSnapshot && (
//                 <img
//                   src={mapSnapshot}
//                   alt="Map Snapshot"
//                   style={{
//                     width: 200,
//                     height: 200,
//                     borderRadius: 16,
//                     marginBottom: 16,
//                     opacity: 0.7,
//                   }}
//                 />
//               )}
//               <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
//               <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
//                 Finding your location...
//               </Typography>
//             </motion.div>
//           </Backdrop>
//         )}
//       </AnimatePresence>

//       {/* AppBar */}
//       <AppBar
//         position="absolute"
//         sx={{
//           backgroundColor: 'rgba(255, 255, 255, 0.9)',
//           backdropFilter: 'blur(20px)',
//           boxShadow: 'none',
//           borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
//         }}
//       >
//         <Toolbar>
//           <IconButton
//             edge="start"
//             sx={{ mr: 2 }}
//             onClick={() => {}}
//           >
//             <MenuIcon />
//           </IconButton>
          
//           <Box sx={{ flexGrow: 1 }} />
          
//           <IconButton
//             onClick={() => router.push('/notifications')}
//             sx={{ mr: 1 }}
//           >
//             <Badge badgeContent={3} color="error">
//               <NotificationsIcon />
//             </Badge>
//           </IconButton>
          
//           <IconButton
//             onClick={() => router.push('/profile')}
//           >
//             <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
//               {user?.firstName?.[0] || 'U'}
//             </Avatar>
//           </IconButton>
//         </Toolbar>
//       </AppBar>

//       {/* Map Controls */}
//       <MapControls
//         onLocateMe={handleRelocate}
//         onZoomIn={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) + 1)}
//         onZoomOut={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) - 1)}
//         style={{
//           position: 'absolute',
//           right: 16,
//           bottom: showLocationSheet ? (hasSearchResults ? 600 : 400) : 100,
//           zIndex: 99,
//           transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//         }}
//       />

//       {/* Location FAB */}
//       <Fab
//         color="primary"
//         sx={{
//           position: 'absolute',
//           bottom: showLocationSheet ? (hasSearchResults ? 550 : 350) : 50,
//           left: 16,
//           zIndex: 99,
//         }}
//         onClick={handleRelocate}
//       >
//         <MyLocationIcon />
//       </Fab>

//       {/* Location Search Sheet */}
//       <AnimatePresence>
//         {showLocationSheet && (
//           <motion.div
//             initial={{ y: '100%' }}
//             animate={{ y: 0 }}
//             exit={{ y: '100%' }}
//             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
//             style={{
//               position: 'absolute',
//               bottom: 0,
//               left: 0,
//               right: 0,
//               zIndex: 100,
//             }}
//           >
//             <Paper
//               sx={{
//                 borderTopLeftRadius: 24,
//                 borderTopRightRadius: 24,
//                 p: 3,
//                 pb: 4,
//                 maxHeight: '80vh',
//                 overflow: 'hidden',
//                 display: 'flex',
//                 flexDirection: 'column',
//               }}
//             >
//               {/* Header */}
//               <Box sx={{ mb: 3 }}>
//                 <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
//                   Where to?
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   Book a ride in seconds
//                 </Typography>
//               </Box>

//               {/* Reset Button (only show when locations selected) */}
//               {(pickupLocation || dropoffLocation) && (
//                 <Button
//                   startIcon={<CloseIcon />}
//                   onClick={handleReset}
//                   sx={{
//                     mb: 2,
//                     alignSelf: 'flex-start',
//                     textTransform: 'none',
//                   }}
//                 >
//                   Reset
//                 </Button>
//               )}

//               {/* Pickup Input */}
//               <TextField
//                 fullWidth
//                 placeholder="Pickup location"
//                 value={pickupQuery}
//                 onChange={(e) => handleSearchChange(e.target.value, true)}
//                 onFocus={() => {
//                   setActiveInput('pickup');
//                   setShowSearchResults(true);
//                 }}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <NavigationIcon color={pickupLocation ? 'primary' : 'action'} />
//                     </InputAdornment>
//                   ),
//                   endAdornment: pickupQuery ? (
//                     <InputAdornment position="end">
//                       <IconButton
//                         size="small"
//                         onClick={() => handleClearSearch(true)}
//                         edge="end"
//                       >
//                         <CloseIcon fontSize="small" />
//                       </IconButton>
//                     </InputAdornment>
//                   ) : null,
//                   sx: {
//                     borderRadius: 2,
//                     bgcolor: activeInput === 'pickup' ? 'action.selected' : 'background.paper',
//                     '& .MuiOutlinedInput-notchedOutline': {
//                       borderColor: activeInput === 'pickup' ? 'primary.main' : 'divider',
//                       borderWidth: 2,
//                     },
//                     '&:hover .MuiOutlinedInput-notchedOutline': {
//                       borderColor: activeInput === 'pickup' ? 'primary.main' : 'text.secondary',
//                     },
//                   },
//                 }}
//                 sx={{ mb: 2 }}
//               />

//               {/* Dropoff Input */}
//               <TextField
//                 fullWidth
//                 placeholder="Where to?"
//                 value={dropoffQuery}
//                 onChange={(e) => handleSearchChange(e.target.value, false)}
//                 onFocus={() => {
//                   setActiveInput('dropoff');
//                   setShowSearchResults(true);
//                 }}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <PlaceIcon color={dropoffLocation ? 'error' : 'action'} />
//                     </InputAdornment>
//                   ),
//                   endAdornment: dropoffQuery ? (
//                     <InputAdornment position="end">
//                       <IconButton
//                         size="small"
//                         onClick={() => handleClearSearch(false)}
//                         edge="end"
//                       >
//                         <CloseIcon fontSize="small" />
//                       </IconButton>
//                     </InputAdornment>
//                   ) : null,
//                   sx: {
//                     borderRadius: 2,
//                     bgcolor: activeInput === 'dropoff' ? 'action.selected' : 'background.paper',
//                     '& .MuiOutlinedInput-notchedOutline': {
//                       borderColor: activeInput === 'dropoff' ? 'primary.main' : 'divider',
//                       borderWidth: 2,
//                     },
//                     '&:hover .MuiOutlinedInput-notchedOutline': {
//                       borderColor: activeInput === 'dropoff' ? 'primary.main' : 'text.secondary',
//                     },
//                   },
//                 }}
//                 sx={{ mb: 2 }}
//               />

//               {/* Search Results */}
//               {hasSearchResults && (
//                 <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
//                   {/* Current Location Option - ALWAYS FIRST */}
//                   {location && (
//                     <ListItem
//                       onClick={handleUseCurrentLocation}
//                       sx={{
//                         py: 2,
//                         px: 2,
//                         borderBottom: 1,
//                         borderColor: 'divider',
//                         '&:hover': { bgcolor: 'action.hover' },
//                       }}
//                     >
//                       <ListItemIcon>
//                         <MyLocationIcon color="primary" />
//                       </ListItemIcon>
//                       <ListItemText
//                         primary="Current Location"
//                         secondary="Use your current location"
//                         secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
//                       />
//                     </ListItem>
//                   )}

//                   {/* Loading State */}
//                   {loadingPredictions && (
//                     <Box sx={{ textAlign: 'center', py: 3 }}>
//                       <CircularProgress size={24} />
//                       <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
//                         Searching locations...
//                       </Typography>
//                     </Box>
//                   )}

//                   {/* Predictions */}
//                   {!loadingPredictions && predictions.map((prediction) => (
//                     <ListItem
//                       key={prediction.place_id}
//                       onClick={() => handleSelectPrediction(prediction)}
//                       sx={{
//                         py: 2,
//                         px: 2,
//                         borderBottom: 1,
//                         borderColor: 'divider',
//                         '&:hover': { bgcolor: 'action.hover' },
//                       }}
//                     >
//                       <ListItemIcon>
//                         <LocationIcon />
//                       </ListItemIcon>
//                       <ListItemText
//                         primary={prediction.structured_formatting.main_text}
//                         secondary={prediction.structured_formatting.secondary_text}
//                         secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
//                       />
//                     </ListItem>
//                   ))}

//                   {/* No Results */}
//                   {!loadingPredictions && predictions.length === 0 && 
//                    (pickupQuery.length > 2 || dropoffQuery.length > 2) && (
//                     <ListItem sx={{ py: 3 }}>
//                       <ListItemText
//                         primary="No locations found"
//                         secondary="Try a different search term"
//                         primaryTypographyProps={{ textAlign: 'center' }}
//                         secondaryTypographyProps={{ textAlign: 'center' }}
//                       />
//                     </ListItem>
//                   )}
//                 </Box>
//               )}

//               {/* Recent Locations - Only show when not searching */}
//               {!hasSearchResults && !showSearchResults && recentLocations.length > 0 && (
//                 <Box sx={{ mb: 2 }}>
//                   <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
//                     Recent Locations
//                   </Typography>
//                   {recentLocations.map((loc, index) => (
//                     <ListItem
//                       key={index}
//                       onClick={() => handleSelectRecentLocation(loc)}
//                       sx={{
//                         py: 1.5,
//                         borderRadius: 1,
//                         '&:hover': { bgcolor: 'action.hover' },
//                       }}
//                     >
//                       <ListItemIcon>
//                         <LocationIcon />
//                       </ListItemIcon>
//                       <ListItemText
//                         primary={loc.name || loc.address.split(',')[0]}
//                         secondary={loc.name && loc.name !== loc.address && loc.address}
//                         secondaryTypographyProps={{ variant: 'caption' }}
//                       />
//                     </ListItem>
//                   ))}
//                 </Box>
//               )}

//               {/* Confirm Button */}
//               {pickupLocation && dropoffLocation && !showSearchResults && (
//                 <Button
//                   fullWidth
//                   variant="contained"
//                   size="large"
//                   onClick={() => {
//                     setShowLocationSheet(false);
//                     setShowRideOptions(true);
//                   }}
//                   sx={{
//                     height: 56,
//                     fontWeight: 700,
//                     fontSize: '1rem',
//                     borderRadius: 2,
//                     textTransform: 'none',
//                   }}
//                 >
//                   Continue
//                 </Button>
//               )}
//             </Paper>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Ride Options Sheet */}
//       {showRideOptions && pickupLocation && dropoffLocation && (
//         <RideOptionsSheet
//           pickupLocation={pickupLocation}
//           dropoffLocation={dropoffLocation}
//           onClose={() => setShowRideOptions(false)}
//           onConfirmRide={handleConfirmRide}
//         />
//       )}
//     </Box>
//   );
// }
// rider/app/(main)/home/page.jsx - UPDATED VERSION
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Typography,
  Paper,
  Button,
  Badge,
  Fab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Backdrop,
  Chip,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  MyLocation as MyLocationIcon,
  Navigation as NavigationIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Place as PlaceIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useRide } from '@/lib/hooks/useRide';
import { GoogleMapProvider } from '@/components/Map/GoogleMapProvider';
import { OptimizedMap } from '@/components/Map/OptimizedMap';
import { MapControls } from '@/components/Map/MapControls';
import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
import { createCustomMarker } from '@/components/Map/CustomMarkers';
import { debounce } from '@/Functions';
import LocationChipInput from '@/components/Rider/LocationChipInput';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import html2canvas from 'html2canvas';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { location, loading: locationLoading, refresh } = useGeolocation({ watch: true });
  const { activeRide } = useRide();

  const [mapCenter, setMapCenter] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [showLocationSheet, setShowLocationSheet] = useState(true);
  const [showRideOptions, setShowRideOptions] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [mapRef, setMapRef] = useState(null);
  const [isRelocating, setIsRelocating] = useState(false);

  // Search states
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [mapSnapshot, setMapSnapshot] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const mapContainerRef = useRef(null);

  // Redirect if there's an active ride
  useEffect(() => {
    if (activeRide) {
      router.push(`/tracking?rideId=${activeRide.id}`);
    }
  }, [activeRide, router]);

  // Set initial map center and pickup to user's location
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
      setPickupQuery('');
    }
  }, [location, pickupLocation]);

  // Load recent locations
  useEffect(() => {
    const loadRecentLocations = () => {
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
    };

    loadRecentLocations();
  }, []);

  // Initialize Google Places services
  useEffect(() => {
    const initializeServices = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      } else {
        setTimeout(initializeServices, 100);
      }
    };

    initializeServices();
  }, []);

  // Save location to recent
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

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query, inputType) => {
      if (!query || query.length < 2 || query === 'Current Location') {
        setPredictions([]);
        setShowSearchResults(false);
        return;
      }

      if (!autocompleteService.current) return;

      setLoadingPredictions(true);
      setShowSearchResults(true);

      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'zm' },
          types: ['geocode', 'establishment'],
        },
        (results, status) => {
          setLoadingPredictions(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPredictions(results || []);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 300),
    []
  );

  // Handle input change
  const handleSearchChange = (value, isPickup) => {
    if (isPickup) {
      setPickupQuery(value);
      setActiveInput('pickup');
      // Clear pickup location if user starts typing
      if (value && pickupLocation) {
        setPickupLocation(null);
      }
    } else {
      setDropoffQuery(value);
      setActiveInput('dropoff');
      // Clear dropoff location if user starts typing
      if (value && dropoffLocation) {
        setDropoffLocation(null);
      }
    }

    if (value && value.length > 0 && value !== 'Current Location') {
      debouncedSearch(value, isPickup ? 'pickup' : 'dropoff');
    } else {
      setPredictions([]);
      setShowSearchResults(false);
    }
  };

  // Clear search
  const handleClearSearch = (isPickup) => {
    if (isPickup) {
      setPickupQuery('');
      setPickupLocation(null);
      if (location) {
        const currentLoc = {
          lat: location.lat,
          lng: location.lng,
          address: 'Current Location',
          name: 'Current Location',
          placeId: 'current_location',
        };
        setPickupLocation(currentLoc);
      }
    } else {
      setDropoffQuery('');
      setDropoffLocation(null);
    }
    setPredictions([]);
    setShowSearchResults(false);
    setActiveInput(null);
  };

  // Select location from predictions
  const handleSelectPrediction = (prediction, inputType) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address', 'name', 'vicinity'],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.vicinity || prediction.description,
            name: place.name || prediction.structured_formatting?.main_text || 'Location',
            placeId: prediction.place_id,
          };

          if (inputType === 'pickup') {
            setPickupLocation(location);
            setPickupQuery('');
          } else {
            setDropoffLocation(location);
            setDropoffQuery('');
          }

          saveToRecent(location);
          setPredictions([]);
          setShowSearchResults(false);
          setActiveInput(null);

          if (mapRef) {
            mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 15);
          }
        }
      }
    );
  };

  // Use current location
  const handleUseCurrentLocation = (inputType) => {
    if (!location) return;

    const currentLoc = {
      lat: location.lat,
      lng: location.lng,
      address: 'Current Location',
      name: 'Current Location',
      placeId: 'current_location',
    };

    if (inputType === 'pickup' || !dropoffLocation) {
      setPickupLocation(currentLoc);
      setPickupQuery('');
    } else {
      setDropoffLocation(currentLoc);
      setDropoffQuery('');
    }

    setPredictions([]);
    setShowSearchResults(false);
    setActiveInput(null);

    if (mapRef) {
      mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
    }
  };

  // Select recent location
  const handleSelectRecentLocation = (loc, inputType) => {
    if (inputType === 'dropoff' || !dropoffLocation) {
      setDropoffLocation(loc);
      setDropoffQuery('');
    } else {
      setPickupLocation(loc);
      setPickupQuery('');
    }

    setPredictions([]);
    setShowSearchResults(false);
    setActiveInput(null);

    if (mapRef) {
      mapRef.animateToLocation({ lat: loc.lat, lng: loc.lng }, 15);
    }
  };

  const handleConfirmRide = async (rideDetails) => {
    try {
      const params = new URLSearchParams({
        pickup: JSON.stringify(pickupLocation),
        dropoff: JSON.stringify(dropoffLocation),
        ...rideDetails,
      });
      router.push(`/finding-driver?${params.toString()}`);
    } catch (error) {
      console.error('Error confirming ride:', error);
      alert('Failed to book ride. Please try again.');
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
      setPickupQuery('');
    } else {
      setPickupLocation(null);
      setPickupQuery('');
    }
    setDropoffLocation(null);
    setDropoffQuery('');
    setShowRideOptions(false);
    setShowLocationSheet(true);
    setPredictions([]);
    setShowSearchResults(false);
    setActiveInput(null);
  };

  // Capture map snapshot
  const captureMapSnapshot = async () => {
    if (!mapContainerRef.current) return null;

    try {
      const canvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 0.5,
      });
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.error('Failed to capture map snapshot:', error);
      return null;
    }
  };

  const handleRelocate = async () => {
    try {
      const snapshot = await captureMapSnapshot();
      if (snapshot) {
        setMapSnapshot(snapshot);
      }

      setIsRelocating(true);
      await refresh();

      if (location && mapRef) {
        mapRef.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
      }

      setTimeout(() => {
        setIsRelocating(false);
        setMapSnapshot(null);
      }, 1200);
    } catch (error) {
      console.error('Relocation error:', error);
      setIsRelocating(false);
      setMapSnapshot(null);
    }
  };

  // Get markers for map
  const getMarkers = () => {
    const markers = [];

    if (pickupLocation && pickupLocation.placeId !== 'current_location') {
      markers.push({
        id: 'pickup',
        position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        icon: createCustomMarker('pickup'),
        title: 'Pickup Location',
      });
    }

    if (dropoffLocation) {
      markers.push({
        id: 'dropoff',
        position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
        icon: createCustomMarker('dropoff'),
        title: 'Dropoff Location',
      });
    }

    return markers;
  };

  const hasSearchResults = showSearchResults && (predictions.length > 0 || loadingPredictions);

  if (locationLoading && !location) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={32} />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
          Getting your location...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Map Container */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
        <GoogleMapProvider>
          <OptimizedMap
            center={mapCenter || (location ? { lat: location.lat, lng: location.lng } : { lat: -15.4167, lng: 28.2833 })}
            zoom={13}
            markers={getMarkers()}
            onMapLoad={(map) => {
              setMapRef(map);
              if (map?.map?.getDiv()) {
                mapContainerRef.current = map.map.getDiv();
              }
            }}
          />
        </GoogleMapProvider>
      </Box>

      {/* Relocate Loading Overlay */}
      <AnimatePresence>
        {isRelocating && (
          <Backdrop
            open={isRelocating}
            sx={{
              zIndex: 1400,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ textAlign: 'center' }}
            >
              {mapSnapshot && (
                <img
                  src={mapSnapshot}
                  alt="Map Snapshot"
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: 12,
                    marginBottom: 16,
                    opacity: 0.7,
                  }}
                />
              )}
              <CircularProgress size={48} thickness={3} sx={{ mb: 2, color: 'primary.main' }} />
              <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                Finding your location...
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
          <IconButton
            edge="start"
            sx={{ mr: 1 }}
            onClick={() => { }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            onClick={() => router.push('/notifications')}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="error" variant="dot">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            onClick={() => router.push('/profile')}
          >
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
          onZoomIn={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) + 1)}
          onZoomOut={() => mapRef?.map?.setZoom((mapRef?.map?.getZoom() || 15) - 1)}
          style={{ gap: 1 }}
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
          <Box sx={{ mb: 3, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Where to?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Book a ride in seconds
            </Typography>
          </Box>

          {/* Location Inputs */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            {/* Pickup Input */}
            <LocationChipInput
              label="Pickup"
              value={pickupLocation?.address || pickupQuery}
              onChange={(value) => handleSearchChange(value, true)}
              onClear={() => handleClearSearch(true)}
              icon={<NavigationIcon sx={{ color: activeInput === 'pickup' ? 'primary.main' : 'text.secondary' }} />}
              placeholder="Current Location"
              currentLocation={location}
              onUseCurrentLocation={() => handleUseCurrentLocation('pickup')}
              predictions={activeInput === 'pickup' ? predictions : []}
              loadingPredictions={loadingPredictions && activeInput === 'pickup'}
              onSelectPrediction={(prediction) => handleSelectPrediction(prediction, 'pickup')}
              showSearchResults={showSearchResults && activeInput === 'pickup'}
              onFocus={() => {
                setActiveInput('pickup');
                setShowSearchResults(true);
              }}
              active={activeInput === 'pickup'}
            />

            <Box sx={{ my: 1.5, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Box>
            </Box>

            {/* Dropoff Input */}
            <LocationChipInput
              label="Destination"
              value={dropoffLocation?.address || dropoffQuery}
              onChange={(value) => handleSearchChange(value, false)}
              onClear={() => handleClearSearch(false)}
              icon={<PlaceIcon sx={{ color: activeInput === 'dropoff' ? 'primary.main' : 'text.secondary' }} />}
              placeholder="Where to?"
              onUseCurrentLocation={() => handleUseCurrentLocation('dropoff')}
              predictions={activeInput === 'dropoff' ? predictions : []}
              loadingPredictions={loadingPredictions && activeInput === 'dropoff'}
              onSelectPrediction={(prediction) => handleSelectPrediction(prediction, 'dropoff')}
              showSearchResults={showSearchResults && activeInput === 'dropoff'}
              onFocus={() => {
                setActiveInput('dropoff');
                setShowSearchResults(true);
              }}
              active={activeInput === 'dropoff'}
            />
          </Box>

          {/* Search Results */}
          {hasSearchResults && (
            <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
              {/* Current Location Option */}
              {location && activeInput && (
                <ListItem
                  onClick={() => handleUseCurrentLocation(activeInput)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <MyLocationIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Current Location"
                    secondary="Use your current location"
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              )}

              {/* Loading State */}
              {loadingPredictions && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={20} thickness={4} />
                  <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                    Searching locations...
                  </Typography>
                </Box>
              )}

              {/* Predictions */}
              {!loadingPredictions && predictions.map((prediction) => (
                <ListItem
                  key={prediction.place_id}
                  onClick={() => handleSelectPrediction(prediction, activeInput)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={prediction.structured_formatting.main_text}
                    secondary={prediction.structured_formatting.secondary_text}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              ))}

              {/* No Results */}
              {!loadingPredictions && predictions.length === 0 &&
                (pickupQuery.length > 2 || dropoffQuery.length > 2) && (
                  <ListItem sx={{ py: 3 }}>
                    <ListItemText
                      primary="No locations found"
                      secondary="Try a different search term"
                      primaryTypographyProps={{ textAlign: 'center' }}
                      secondaryTypographyProps={{ textAlign: 'center' }}
                    />
                  </ListItem>
                )}
            </Box>
          )}

          {/* Recent Locations - Only show when not searching */}
          {!hasSearchResults && !showSearchResults && recentLocations.length > 0 && (
            <Box sx={{ mb: 2, flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                Recent Locations
              </Typography>
              {recentLocations.map((loc, index) => (
                <ListItem
                  key={index}
                  onClick={() => handleSelectRecentLocation(loc, dropoffLocation ? 'pickup' : 'dropoff')}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={loc.name || loc.address.split(',')[0]}
                    secondary={loc.name && loc.name !== loc.address && loc.address}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </Box>
          )}

          {/* Continue Button */}
          {pickupLocation && dropoffLocation && !showSearchResults && (
            <Box sx={{ flexShrink: 0 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => {
                  setShowLocationSheet(false);
                  setShowRideOptions(true);
                }}
                sx={{
                  height: 56,
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: 3,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                Continue
              </Button>
            </Box>
          )}
        </Box>
      </SwipeableBottomSheet>

      {/* Ride Options Sheet */}
      {showRideOptions && pickupLocation && dropoffLocation && (
        <RideOptionsSheet
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          onClose={() => setShowRideOptions(false)}
          onConfirmRide={handleConfirmRide}
        />
      )}
    </Box>
  );
}