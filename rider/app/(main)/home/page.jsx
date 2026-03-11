// // rider/app/(main)/home/page.jsx
// 'use client';

// import { useState, useEffect, useCallback, useRef } from 'react';
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
//   Alert,
//   Snackbar,
//   Skeleton,
//   Chip,
// } from '@mui/material';
// import {
//   Menu as MenuIcon,
//   Notifications as NotificationsIcon,
//   MyLocation as MyLocationIcon,
//   Close as CloseIcon,
//   Person as PersonIcon,
//   Flag as FlagIcon,
//   LocationOn as LocationIcon,
//   AccessTime as AccessTimeIcon,
//   DirectionsCar as DirectionsCarIcon,
//   ElectricCar as ElectricCarIcon,
//   TwoWheeler as TwoWheelerIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useGeolocation } from '@/lib/hooks/useGeolocation';
// import { useRide } from '@/lib/hooks/useRide';
// import { MapControls } from '@/components/Map/MapControls';
// import { LocationSearch } from '@/components/Map/LocationSearch';
// import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
// import SwipeableBottomSheet, { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';
// import ClientOnly from '@/components/ClientOnly';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import MapIframe from '@/components/Map/MapIframe';

// // ─────────────────────────────────────────────────────────────────────────────
// // The gradient header dragArea sx — shared between drawer and skeleton
// // ─────────────────────────────────────────────────────────────────────────────
// const HEADER_GRADIENT_SX = {
//   // Animated wave shimmer
//   background: 'linear-gradient(-60deg, #FFB300 0%, #FF8A00 25%, #FFC107 50%, #FF6D00 75%, #FFD54F 100%)',
//   backgroundSize: '300% 300%',
//   animation: 'okraHeaderWave 6s ease infinite',
//   '@keyframes okraHeaderWave': {
//     '0%':   { backgroundPosition: '0% 50%' },
//     '50%':  { backgroundPosition: '100% 50%' },
//     '100%': { backgroundPosition: '0% 50%' },
//   },
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Helper: strip all border/icon styling from LocationSearch inner input
// // ─────────────────────────────────────────────────────────────────────────────
// const CLEAN_INPUT_SX = {
//   '& .MuiInputBase-root': {
//     border: 'none !important',
//     outline: 'none !important',
//     boxShadow: 'none !important',
//     bgcolor: 'transparent !important',
//     p: '0 !important',
//   },
//   '& .MuiOutlinedInput-notchedOutline': { border: 'none !important' },
//   '& .MuiFilledInput-underline:before': { display: 'none' },
//   '& .MuiFilledInput-underline:after':  { display: 'none' },
//   '& .MuiInput-underline:before':       { display: 'none' },
//   '& .MuiInput-underline:after':        { display: 'none' },
//   '& .MuiInputAdornment-root':          { display: 'none' },
//   '& .MuiIconButton-root':              { display: 'none' },
//   '& .MuiInputBase-input': {
//     p: '0 !important',
//     fontSize: '0.9rem',
//     fontWeight: 500,
//   },
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Skeleton: full modal loading (location fetch in progress)
// // ─────────────────────────────────────────────────────────────────────────────
// const ModalLoadingSkeleton = () => (
//   <Box>
//     {/* Gradient header skeleton — pill INSIDE, same border-radius as sheet */}
//     <Box sx={{
//       ...HEADER_GRADIENT_SX,
//       borderTopLeftRadius: 24,
//       borderTopRightRadius: 24,
//       px: 3,
//       pb: 2.5,
//     }}>
//       {/* Pill placeholder */}
//       <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.75 }}>
//         <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.4)' }} />
//       </Box>
//       <Skeleton
//         animation="wave"
//         variant="text"
//         width={110}
//         height={32}
//         sx={{ bgcolor: 'rgba(255,255,255,0.25)', borderRadius: 1, mb: 1 }}
//       />
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//         <Skeleton animation="wave" width={80}  height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
//         <Skeleton animation="wave" width={130} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
//       </Box>
//       <Box sx={{ display: 'flex', gap: 1 }}>
//         <Skeleton animation="wave" variant="rounded" height={38} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
//         <Skeleton animation="wave" variant="rounded" height={38} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
//       </Box>
//     </Box>

//     {/* Input skeletons */}
//     <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
//       <Skeleton animation="wave" width={44}  height={11} sx={{ borderRadius: 1, mb: 0.5 }} />
//       <Skeleton animation="wave" variant="rounded" height={62} sx={{ borderRadius: 2, mb: 1 }} />
//       <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
//         <Skeleton animation="wave" width={2} height={22} />
//       </Box>
//       <Skeleton animation="wave" width={60}  height={11} sx={{ borderRadius: 1, mb: 0.5 }} />
//       <Skeleton animation="wave" variant="rounded" height={62} sx={{ borderRadius: 2 }} />
//     </Box>

//     {/* Recent locations skeletons */}
//     <Box sx={{ px: 3, pt: 2 }}>
//       <Skeleton animation="wave" width={120} height={14} sx={{ borderRadius: 1, mb: 1.5 }} />
//       {[1, 2, 3].map((i) => (
//         <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//           <Skeleton animation="wave" variant="circular" width={36} height={36} sx={{ mr: 1.5, flexShrink: 0 }} />
//           <Box sx={{ flex: 1 }}>
//             <Skeleton animation="wave" width="55%" height={14} sx={{ borderRadius: 1, mb: 0.4 }} />
//             <Skeleton animation="wave" width="75%" height={12} sx={{ borderRadius: 1 }} />
//           </Box>
//         </Box>
//       ))}
//     </Box>
//   </Box>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Skeleton: fare estimates loading inside the ride options sheet
// // ─────────────────────────────────────────────────────────────────────────────
// const FareEstimatesSkeleton = ({ onClose, routeInfo }) => (
//   <Box>
//     {/* Gradient header with pill — matches RideOptionsSheet exactly */}
//     <Box
//       sx={{
//         ...HEADER_GRADIENT_SX,
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         px: 3,
//         pb: 2.5,
//         position: 'relative',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Pill */}
//       <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.75 }}>
//         <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.4)' }} />
//       </Box>

//       <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
//         <Box>
//           <Skeleton animation="wave" width={130} height={26} sx={{ bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 1, mb: 0.5 }} />
//           {routeInfo ? (
//             <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
//               📍 {routeInfo.distance}&nbsp;·&nbsp;⏱ {routeInfo.duration}
//             </Typography>
//           ) : (
//             <Skeleton animation="wave" width={100} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
//           )}
//         </Box>
//         <IconButton size="small" onClick={onClose} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
//           <CloseIcon fontSize="small" />
//         </IconButton>
//       </Box>
//     </Box>

//     {/* Ride option card skeletons */}
//     <Box sx={{ px: 3, pt: 2.5 }}>
//       <Skeleton animation="wave" width={110} height={18} sx={{ borderRadius: 1, mb: 2 }} />
//       {[
//         { w1: '60%', w2: '35%' },
//         { w1: '50%', w2: '30%' },
//         { w1: '45%', w2: '25%' },
//       ].map(({ w1, w2 }, i) => (
//         <Box
//           key={i}
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             p: 2,
//             mb: 1.5,
//             border: '1.5px solid',
//             borderColor: i === 0 ? 'primary.light' : 'divider',
//             borderRadius: 2.5,
//             bgcolor: i === 0 ? 'rgba(255,193,7,0.06)' : 'transparent',
//             gap: 2,
//           }}
//         >
//           <Skeleton animation="wave" variant="circular" width={52} height={52} sx={{ flexShrink: 0 }} />
//           <Box sx={{ flex: 1 }}>
//             <Skeleton animation="wave" width={w1} height={18} sx={{ borderRadius: 1, mb: 0.5 }} />
//             <Skeleton animation="wave" width={w2} height={14} sx={{ borderRadius: 1 }} />
//           </Box>
//           <Box sx={{ textAlign: 'right' }}>
//             <Skeleton animation="wave" width={64} height={22} sx={{ borderRadius: 1, mb: 0.3 }} />
//             <Skeleton animation="wave" width={44} height={13} sx={{ borderRadius: 1 }} />
//           </Box>
//         </Box>
//       ))}
//     </Box>

//     {/* Promo + book button skeletons */}
//     <Box sx={{ px: 3, pb: 3, pt: 1 }}>
//       <Skeleton animation="wave" variant="rounded" height={50} sx={{ borderRadius: 2, mb: 2 }} />
//       <Skeleton animation="wave" variant="rounded" height={56} sx={{ borderRadius: 3, bgcolor: 'rgba(255,193,7,0.25)' }} />
//     </Box>
//   </Box>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Main Page
// // ─────────────────────────────────────────────────────────────────────────────
// export default function HomePage() {
//   const router = useRouter();
//   const { user } = useAuth();
//   const { location, loading: locationLoading, refresh } = useGeolocation({ watch: true });
//   const { isNative, getCurrentLocation: getNativeLocation } = useReactNative();
//   const {
//     loading: rideLoading,
//     error: rideError,
//     getFareEstimate,
//     validatePromoCode,
//     requestRide,
//     getTaxiTypes,
//     getRideClasses,
//   } = useRide();

//   // ── UI State ──
//   const [mapCenter, setMapCenter] = useState(null);
//   const [pickupLocation, setPickupLocation] = useState(null);
//   const [dropoffLocation, setDropoffLocation] = useState(null);
//   const [showLocationSheet, setShowLocationSheet] = useState(true);
//   const [showRideOptions, setShowRideOptions] = useState(false);
//   const [recentLocations, setRecentLocations] = useState([]);
//   const [mapControls, setMapControls] = useState(null);
//   const [isRelocating, setIsRelocating] = useState(false);
//   const [routeInfo, setRouteInfo] = useState(null);

//   // ── Input focus & sheet expansion ──
//   const [focusedInput, setFocusedInput] = useState(null);
//   const [sheetExpanded, setSheetExpanded] = useState(false);
//   const [pickupChipVisible, setPickupChipVisible] = useState(false);

//   // ── Skeleton timing ──
//   const [showModalSkeleton, setShowModalSkeleton] = useState(true);
//   const skeletonTimerRef = useRef(null);
//   // ── Ref to scroll into view when keyboard opens on mobile ──
//   const inputsSectionRef = useRef(null);

//   // ── Ride State ──
//   const [fareEstimates, setFareEstimates] = useState(null);
//   const [loadingEstimates, setLoadingEstimates] = useState(false);
//   const [selectedRideClass, setSelectedRideClass] = useState(null);
//   const [promoCode, setPromoCode] = useState('');
//   const [promoDiscount, setPromoDiscount] = useState(null);
//   const [validatingPromo, setValidatingPromo] = useState(false);

//   // ── Notifications ──
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

//   // ═══════════════════════════════════════════════════════════════════════
//   // 10-second skeleton timer
//   // ═══════════════════════════════════════════════════════════════════════
//   useEffect(() => {
//     skeletonTimerRef.current = setTimeout(() => setShowModalSkeleton(false), 5000);
//     return () => { if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current); };
//   }, []);

//   // ═══════════════════════════════════════════════════════════════════════
//   // Pickup chip visibility
//   // ═══════════════════════════════════════════════════════════════════════
//   useEffect(() => {
//     setPickupChipVisible(
//       pickupLocation?.placeId === 'current_location' && focusedInput !== 'pickup'
//     );
//   }, [pickupLocation, focusedInput]);

//   // ═══════════════════════════════════════════════════════════════════════
//   // Initialize user location
//   // ═══════════════════════════════════════════════════════════════════════
//   useEffect(() => {
//     const initializeLocation = async () => {
//       if (isNative && !pickupLocation) {
//         try {
//           const nativeLoc = await getNativeLocation();
//           if (nativeLoc) {
//             const currentLoc = { lat: nativeLoc.lat, lng: nativeLoc.lng, address: 'Current Location', name: 'Current Location', placeId: 'current_location' };
//             setMapCenter({ lat: nativeLoc.lat, lng: nativeLoc.lng });
//             setPickupLocation(currentLoc);
//             return;
//           }
//         } catch {}
//       }
//       if (location && !pickupLocation) {
//         const currentLoc = { lat: location.lat, lng: location.lng, address: 'Current Location', name: 'Current Location', placeId: 'current_location' };
//         setMapCenter({ lat: location.lat, lng: location.lng });
//         setPickupLocation(currentLoc);
//       }
//     };
//     initializeLocation();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location, pickupLocation]);

//   // ═══════════════════════════════════════════════════════════════════════
//   // Load taxi types
//   // ═══════════════════════════════════════════════════════════════════════
//   useEffect(() => {
//     const load = async () => {
//       if (typeof window !== 'undefined') {
//         const saved = localStorage.getItem('okra_rides_recent_locations');
//         if (saved) {
//           try { setRecentLocations(JSON.parse(saved)); } catch {}
//         }
//       }
//       try {
//         const types = await getTaxiTypes();
//         if (types?.length > 0) await getRideClasses(types[0].id);
//       } catch {}
//     };
//     load();
//   }, [getTaxiTypes, getRideClasses]);

//   // ═══════════════════════════════════════════════════════════════════════
//   // Auto-transition when both locations set
//   // ═══════════════════════════════════════════════════════════════════════
//   useEffect(() => {
//     if (pickupLocation && dropoffLocation && showLocationSheet) {
//       loadFareEstimates();
//       const t = setTimeout(() => {
//         setShowLocationSheet(false);
//         setShowRideOptions(true);
//         setSheetExpanded(false);
//         setFocusedInput(null);
//       }, 250);
//       return () => clearTimeout(t);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pickupLocation, dropoffLocation]);

//   // ═══════════════════════════════════════════════════════════════════════
//   // Load fare estimates
//   // ═══════════════════════════════════════════════════════════════════════
//   const loadFareEstimates = async () => {
//     if (!pickupLocation || !dropoffLocation) return;
//     setLoadingEstimates(true);
//     setFareEstimates(null);
//     try {
//       const estimates = await getFareEstimate(pickupLocation, dropoffLocation, 'taxi', ['taxi']);
//       if (estimates) {
//         setFareEstimates(estimates);
//         if (estimates.estimates?.length > 0) setSelectedRideClass(estimates.estimates[0]);
//       } else {
//         setSnackbar({ open: true, message: 'Failed to load fare estimates', severity: 'error' });
//       }
//     } catch {
//       setSnackbar({ open: true, message: 'Error calculating fare. Please try again.', severity: 'error' });
//     } finally {
//       setLoadingEstimates(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════════════════
//   // Promo code validation
//   // ═══════════════════════════════════════════════════════════════════════
//   const handleValidatePromoCode = async (code) => {
//     if (!code || !selectedRideClass) return;
//     setValidatingPromo(true);
//     try {
//       const result = await validatePromoCode(code, selectedRideClass.subtotal);
//       if (result?.valid) {
//         setPromoDiscount(result);
//         setSnackbar({ open: true, message: result.message || 'Promo code applied!', severity: 'success' });
//       } else {
//         setPromoDiscount(null);
//         setSnackbar({ open: true, message: 'Invalid or expired promo code', severity: 'error' });
//       }
//     } catch {
//       setPromoDiscount(null);
//       setSnackbar({ open: true, message: 'Error validating promo code', severity: 'error' });
//     } finally {
//       setValidatingPromo(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════════════════
//   // Confirm ride booking
//   // ═══════════════════════════════════════════════════════════════════════
//   const handleConfirmRide = async (rideDetails) => {
//     if (!pickupLocation || !dropoffLocation || !selectedRideClass) {
//       setSnackbar({ open: true, message: 'Please select pickup and dropoff locations', severity: 'warning' });
//       return;
//     }
//     try {
//       const result = await requestRide({
//         taxiType: 'taxi',
//         rideType: 'taxi',
//         rider: user,
//         rideClass: selectedRideClass.rideClassId || selectedRideClass.id,
//         rideClassId: selectedRideClass.rideClassId || selectedRideClass.id,
//         pickupLocation,
//         dropoffLocation,
//         paymentMethod: rideDetails.paymentMethod || 'cash',
//         promoCode: promoCode || null,
//         estimatedFare: rideDetails.totalFare || selectedRideClass.subtotal,
//         totalFare: rideDetails.totalFare || selectedRideClass.subtotal,
//         passengerCount: rideDetails.passengerCount || 1,
//         specialRequests: rideDetails.specialRequests || [],
//         notes: rideDetails.notes || '',
//         estimatedDistance: parseFloat(routeInfo?.distance) || null,
//         estimatedDuration: parseFloat(routeInfo?.duration) || null,
//       });
//       if (result.success) {
//         setSnackbar({ open: true, message: 'Ride requested! Finding your driver…', severity: 'success' });
//         setTimeout(() => router.push(`/finding-driver?rideId=${result.data.id}`), 500);
//       } else {
//         setSnackbar({ open: true, message: result.error || 'Failed to book ride.', severity: 'error' });
//       }
//     } catch {
//       setSnackbar({ open: true, message: 'An error occurred while booking.', severity: 'error' });
//     }
//   };

//   // ═══════════════════════════════════════════════════════════════════════
//   // Location management
//   // ═══════════════════════════════════════════════════════════════════════
//   const saveToRecent = useCallback((loc) => {
//     if (loc.placeId === 'current_location') return;
//     const newRecent = [
//       loc,
//       ...recentLocations.filter((l) => l.placeId !== loc.placeId && l.address !== loc.address),
//     ].slice(0, 5);
//     setRecentLocations(newRecent);
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('okra_rides_recent_locations', JSON.stringify(newRecent));
//     }
//   }, [recentLocations]);

//   const handlePickupSelect = useCallback((loc) => {
//     setPickupLocation(loc);
//     saveToRecent(loc);
//     if (mapControls) mapControls.animateToLocation(loc, 15);
//     setTimeout(() => setFocusedInput(null), 150);
//     setFareEstimates(null);
//     setSelectedRideClass(null);
//     setPromoDiscount(null);
//   }, [mapControls, saveToRecent]);

//   const handleDropoffSelect = useCallback((loc) => {
//     setDropoffLocation(loc);
//     saveToRecent(loc);
//     if (mapControls) mapControls.animateToLocation(loc, 15);
//     setTimeout(() => setFocusedInput(null), 150);
//     setFareEstimates(null);
//     setSelectedRideClass(null);
//     setPromoDiscount(null);
//   }, [mapControls, saveToRecent]);

//   // Recent/saved location goes to focused input, defaults to dropoff
//   const handleSelectRecentLocation = useCallback((loc) => {
//     if (focusedInput === 'pickup') {
//       handlePickupSelect(loc);
//     } else {
//       handleDropoffSelect(loc);
//     }
//   }, [focusedInput, handlePickupSelect, handleDropoffSelect]);

//   const handleReset = () => {
//     if (location) {
//       setPickupLocation({ lat: location.lat, lng: location.lng, address: 'Current Location', name: 'Current Location', placeId: 'current_location' });
//     } else {
//       setPickupLocation(null);
//     }
//     setDropoffLocation(null);
//     setFareEstimates(null);
//     setSelectedRideClass(null);
//     setPromoCode('');
//     setPromoDiscount(null);
//     setShowRideOptions(false);
//     setShowLocationSheet(true);
//     setRouteInfo(null);
//     setFocusedInput(null);
//     setSheetExpanded(false);
//   };

//   // ── Input focus management ──
//   const handleInputFocus = (input) => {
//     setFocusedInput(input);
//     if (!sheetExpanded) setSheetExpanded(true);
//     // On mobile, when keyboard opens the viewport shrinks.
//     // Scroll the inputs section into view so the user sees the input, not the bottom of the page.
//     setTimeout(() => {
//       if (inputsSectionRef.current) {
//         inputsSectionRef.current.scrollIntoView({
//           behavior: 'smooth',
//           block: 'start',
//         });
//       }
//     }, 350); // slight delay to let the sheet expansion animation begin first
//   };

//   const handleInputBlur = () => {
//     // Delay so item-selection fires before blur resets focus state
//     setTimeout(() => setFocusedInput(null), 180);
//   };

//   // "Change" taps into pickup input
//   const handleChangeLocation = () => {
//     setPickupChipVisible(false);
//     handleInputFocus('pickup');
//   };

//   // "I am here" resets pickup to GPS location
//   const handleIAmHere = () => {
//     const currentLoc = {
//       lat: location?.lat ?? pickupLocation?.lat,
//       lng: location?.lng ?? pickupLocation?.lng,
//       address: 'Current Location',
//       name: 'Current Location',
//       placeId: 'current_location',
//     };
//     setPickupLocation(currentLoc);
//     setFocusedInput(null);
//     if (mapControls && location) mapControls.animateToLocation(currentLoc, 15);
//   };

//   // ── Relocate ──
//   const handleRelocate = async () => {
//     setIsRelocating(true);
//     try {
//       let newLocation = null;
//       if (isNative) {
//         try {
//           const nativeLoc = await getNativeLocation();
//           if (nativeLoc) newLocation = { lat: nativeLoc.lat, lng: nativeLoc.lng };
//         } catch {}
//       }
//       if (!newLocation) {
//         await refresh();
//         await new Promise((r) => setTimeout(r, 500));
//         if (location) newLocation = { lat: location.lat, lng: location.lng };
//       }
//       if (newLocation && mapControls) {
//         mapControls.animateToLocation(newLocation, 16);
//         setSnackbar({ open: true, message: 'Location updated', severity: 'success' });
//       } else throw new Error();
//       setTimeout(() => setIsRelocating(false), 1500);
//     } catch {
//       setIsRelocating(false);
//       setSnackbar({ open: true, message: 'Could not get your location. Check permissions.', severity: 'error' });
//     }
//   };

//   // ── Close ride options → back to location sheet ──
//   const handleCloseRideOptions = () => {
//     setShowRideOptions(false);
//     setShowLocationSheet(true);
//     setSheetExpanded(false);
//     setFareEstimates(null);
//     setDropoffLocation(null);
//     setSelectedRideClass(null);
//   };

//   // ── Display text for user's location in header ──
//   const locationDisplayText = (() => {
//     if (!pickupLocation) return 'Detecting location…';
//     if (pickupLocation.placeId === 'current_location') {
//       if (location) return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
//       return 'Current Location';
//     }
//     return pickupLocation.name || pickupLocation.address?.split(',')[0] || 'Current Location';
//   })();

//   // ═══════════════════════════════════════════════════════════════════════
//   // Full-page loading (before any location)
//   // ═══════════════════════════════════════════════════════════════════════
//   if (locationLoading && !location) {
//     return (
//       <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
//         <CircularProgress size={48} />
//         <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>Getting your location…</Typography>
//       </Box>
//     );
//   }

//   // ═══════════════════════════════════════════════════════════════════════
//   // Render
//   // ═══════════════════════════════════════════════════════════════════════
//   return (
//     <ClientOnly>
//       {/*
//         position:fixed + inset:0 is the most reliable way to contain a mobile
//         app to the viewport. It prevents iOS Safari bounce, Android browser
//         address-bar shifts, and any horizontal overflow from children.
//         overflow:hidden on the root clips everything to the screen rect.
//       */}
//       <Box
//         sx={{
//           position: 'fixed',
//           top: 0, left: 0, right: 0, bottom: 0,
//           width: '100%',
//           height: '100%',
//           overflow: 'hidden',
//           // Prevent horizontal overflow from any child at any nesting level
//           maxWidth: '100vw',
//           boxSizing: 'border-box',
//         }}
//       >

//         {/* ── Map ── */}
//         <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
//           <MapIframe
//             center={mapCenter ?? (location ? { lat: location.lat, lng: location.lng } : { lat: -15.4167, lng: 28.2833 })}
//             zoom={13}
//             pickupLocation={pickupLocation}
//             dropoffLocation={dropoffLocation}
//             onMapLoad={setMapControls}
//             onRouteCalculated={setRouteInfo}
//           />
//         </Box>

//         {/* ── Relocating overlay ── */}
//         <AnimatePresence>
//           {isRelocating && (
//             <Backdrop open sx={{ zIndex: 1400, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.85 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.85 }}
//                 style={{ textAlign: 'center' }}
//               >
//                 <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, mx: 'auto', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { boxShadow: '0 0 0 0 rgba(255,193,7,0.7)' }, '70%': { boxShadow: '0 0 0 20px rgba(255,193,7,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(255,193,7,0)' } } }}>
//                   <MyLocationIcon sx={{ fontSize: 40, color: 'white' }} />
//                 </Box>
//                 <CircularProgress size={44} thickness={3} sx={{ mb: 2, color: 'primary.main' }} />
//                 <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>Finding your location…</Typography>
//                 <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>This may take a few seconds</Typography>
//               </motion.div>
//             </Backdrop>
//           )}
//         </AnimatePresence>

//         {/* ── AppBar ── */}
//         <AppBar
//           position="absolute"
//           sx={{
//             backgroundColor: 'rgba(255,255,255,0.95)',
//             backdropFilter: 'blur(20px)',
//             boxShadow: 'none',
//             borderBottom: '1px solid rgba(0,0,0,0.07)',
//             zIndex: 10,
//           }}
//         >
//           <Toolbar sx={{ minHeight: 56 }}>
//             <IconButton edge="start" sx={{ mr: 1 }} onClick={() => router.push('/menu')}>
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

//         {/* ── Map Controls ── */}
//         <Box
//           sx={{
//             position: 'absolute',
//             right: 16,
//             bottom: showLocationSheet ? 360 : 100,
//             zIndex: 5,
//             transition: 'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
//           }}
//         >
//           <MapControls
//             onLocateMe={handleRelocate}
//             onZoomIn={() => mapControls?.zoomIn()}
//             onZoomOut={() => mapControls?.zoomOut()}
//           />
//         </Box>

//         {/* ══════════════════════════════════════════════════
//             Location Selection Sheet — initial height ~60vh
//         ══════════════════════════════════════════════════ */}
//         <AnimatePresence>
//           {showLocationSheet && (
//             <SwipeableBottomSheet
//               open
//               initialHeight="80%"
//               maxHeight="90%"
//               minHeight={280}
//               expandedHeight={sheetExpanded ? '90%' : null}
//               persistHeight={sheetExpanded}
//               onSwipeDown={() => {
//                 setSheetExpanded(false);
//                 setFocusedInput(null);
//               }}
//             >
//               <AnimatePresence mode="wait">
//                 {showModalSkeleton ? (
//                   <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
//                     <ModalLoadingSkeleton />
//                   </motion.div>
//                 ) : (
//                   <motion.div
//                     key="content"
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     transition={{ duration: 0.3 }}
//                     style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', overflow: 'hidden' }}
//                   >

//                     {/* ── UNIFIED GRADIENT HEADER (pill is INSIDE — no seam) ── */}
//                     <Box
//                       sx={{
//                         ...HEADER_GRADIENT_SX,
//                         borderTopLeftRadius: 24,
//                         borderTopRightRadius: 24,
//                         px: 3,
//                         pb: 2.5,
//                         flexShrink: 0,
//                         position: 'relative',
//                         overflow: 'hidden',
//                         '&::before': {
//                           content: '""', position: 'absolute',
//                           top: -30, right: -30, width: 120, height: 120,
//                           borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
//                         },
//                       }}
//                     >
//                       <BottomSheetDragPill colored />

//                       <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontSize: '1.2rem', letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.15)', mb: 1.5 }}>
//                         Okra Rides
//                       </Typography>

//                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
//                         <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, flexShrink: 0 }}>Your location</Typography>
//                         <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, maxWidth: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
//                           {locationDisplayText}
//                         </Typography>
//                       </Box>

//                       <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
//                         <Button fullWidth size="small" onClick={handleChangeLocation}
//                           sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', py: 0.75, border: '1px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }, '&:focus': { outline: 'none' } }}>
//                           Change
//                         </Button>
//                         <Button fullWidth size="small" onClick={handleIAmHere}
//                           sx={{ bgcolor: 'white', color: '#E65100', borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', py: 0.75, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' }, '&:focus': { outline: 'none' } }}>
//                           I am here
//                         </Button>
//                       </Box>
//                     </Box>

//                     {/* ── SCROLL AREA — inputs + recent locations ── */}
//                     <Box
//                       sx={{
//                         flex: 1, minHeight: 0,
//                         overflowY: 'auto', overflowX: 'hidden',
//                         scrollbarWidth: 'none', msOverflowStyle: 'none',
//                         '&::-webkit-scrollbar': { display: 'none' },
//                         width: '100%', maxWidth: '100%', boxSizing: 'border-box',
//                       }}
//                     >

//                     {/* ── Inputs ── */}
//                     <Box ref={inputsSectionRef} sx={{ px: 2.5, pt: 2.5, pb: 1, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
//                       {rideError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{rideError}</Alert>}

//                       {/* Route info pill */}
//                       {routeInfo && (
//                         <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
//                           <Box sx={{ display: 'flex', gap: 1, mb: 1.5, px: 1.5, py: 0.75, bgcolor: 'rgba(255,193,7,0.08)', borderRadius: 2, border: '1px solid', borderColor: 'rgba(255,193,7,0.3)' }}>
//                             <Typography variant="caption" color="primary.main" fontWeight={700}>📍 {routeInfo.distance}</Typography>
//                             <Typography variant="caption" color="text.secondary">·</Typography>
//                             <Typography variant="caption" color="primary.main" fontWeight={700}>⏱ {routeInfo.duration}</Typography>
//                           </Box>
//                         </motion.div>
//                       )}

//                       {/* ─── Pickup ─── */}
//                       <Box sx={{ mb: 0.75 }}>
//                         <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, color: focusedInput === 'pickup' ? 'primary.main' : 'text.disabled', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, transition: 'color 0.2s ease' }}>
//                           Pickup
//                         </Typography>
//                         <Box
//                           sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             border: '1.5px solid',
//                             borderColor: focusedInput === 'pickup' ? 'primary.main' : 'divider',
//                             borderRadius: 2,
//                             transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
//                             boxShadow: focusedInput === 'pickup' ? '0 0 0 3px rgba(255,193,7,0.15)' : 'none',
//                             bgcolor: 'background.paper',
//                             minHeight: 56,
//                             width: '100%',
//                             maxWidth: '100%',
//                             boxSizing: 'border-box',
//                             overflow: 'visible',
//                           }}
//                         >
//                           {/* Person icon column */}
//                           <Box sx={{ width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', bgcolor: focusedInput === 'pickup' ? 'rgba(255,193,7,0.1)' : 'grey.50', borderRight: '1.5px solid', borderColor: 'divider', flexShrink: 0, transition: 'background-color 0.2s ease' }}>
//                             <PersonIcon sx={{ fontSize: 20, color: focusedInput === 'pickup' ? 'primary.main' : pickupLocation ? 'success.main' : 'text.disabled', transition: 'color 0.2s ease' }} />
//                           </Box>

//                           {/* Input content */}
//                           <Box
//                             sx={{ flex: 1, px: 1.5, py: 1, display: 'flex', alignItems: 'center', cursor: 'text' }}
//                             onClick={() => { if (pickupChipVisible) { setPickupChipVisible(false); handleInputFocus('pickup'); } }}
//                           >
//                             {pickupChipVisible ? (
//                               <Chip
//                                 icon={<MyLocationIcon sx={{ fontSize: '14px !important' }} />}
//                                 label="Current Location"
//                                 onDelete={() => { setPickupLocation(null); setPickupChipVisible(false); handleInputFocus('pickup'); }}
//                                 onClick={() => { setPickupChipVisible(false); handleInputFocus('pickup'); }}
//                                 size="small"
//                                 sx={{ bgcolor: 'rgba(255,193,7,0.15)', color: '#E65100', fontWeight: 700, fontSize: '0.75rem', height: 28, '& .MuiChip-deleteIcon': { color: '#E65100', opacity: 0.7 }, '& .MuiChip-icon': { color: '#E65100' }, cursor: 'pointer' }}
//                               />
//                             ) : (
//                               // Strip all inner borders / icons from LocationSearch
//                               <Box sx={CLEAN_INPUT_SX}>
//                                 <LocationSearch
//                                   placeholder={pickupLocation?.address && pickupLocation.placeId !== 'current_location' ? pickupLocation.address : 'Enter pickup location'}
//                                   onSelectLocation={handlePickupSelect}
//                                   mapControls={mapControls}
//                                   value={focusedInput === 'pickup' ? (pickupLocation?.placeId === 'current_location' ? '' : pickupLocation?.address || '') : (pickupLocation?.address || '')}
//                                   autoFocus={focusedInput === 'pickup'}
//                                   onFocus={() => handleInputFocus('pickup')}
//                                   onBlur={handleInputBlur}
//                                 />
//                               </Box>
//                             )}
//                           </Box>

//                           {/* Clear button */}
//                           {pickupLocation && !pickupChipVisible && (
//                             <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled' }} onClick={(e) => { e.stopPropagation(); setPickupLocation(null); setFareEstimates(null); }}>
//                               <CloseIcon sx={{ fontSize: 14 }} />
//                             </IconButton>
//                           )}
//                         </Box>
//                       </Box>

//                       {/* Connector line */}
//                       <Box sx={{ display: 'flex', alignItems: 'center', pl: '22px', my: 0.25 }}>
//                         <Box sx={{ width: 2, height: 20, bgcolor: pickupLocation && dropoffLocation ? 'primary.main' : 'divider', borderRadius: 1, transition: 'background-color 0.3s ease' }} />
//                       </Box>

//                       {/* ─── Dropoff ─── */}
//                       <Box>
//                         <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, color: focusedInput === 'dropoff' ? 'primary.main' : 'text.disabled', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, transition: 'color 0.2s ease' }}>
//                           Destination
//                         </Typography>
//                         <Box
//                           sx={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             border: '1.5px solid',
//                             borderColor: focusedInput === 'dropoff' ? 'primary.main' : 'divider',
//                             borderRadius: 2,
//                             transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
//                             boxShadow: focusedInput === 'dropoff' ? '0 0 0 3px rgba(255,193,7,0.15)' : 'none',
//                             bgcolor: 'background.paper',
//                             minHeight: 56,
//                             width: '100%',
//                             maxWidth: '100%',
//                             boxSizing: 'border-box',
//                             overflow: 'visible',
//                           }}
//                         >
//                           {/* Flag icon column */}
//                           <Box sx={{ width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', bgcolor: focusedInput === 'dropoff' ? 'rgba(255,193,7,0.1)' : 'grey.50', borderRight: '1.5px solid', borderColor: 'divider', flexShrink: 0, transition: 'background-color 0.2s ease' }}>
//                             <FlagIcon sx={{ fontSize: 20, color: focusedInput === 'dropoff' ? 'primary.main' : dropoffLocation ? 'error.main' : 'text.disabled', transition: 'color 0.2s ease' }} />
//                           </Box>

//                           {/* Input content */}
//                           <Box sx={{ flex: 1, px: 1.5, py: 1 }}>
//                             <Box sx={CLEAN_INPUT_SX}>
//                               <LocationSearch
//                                 placeholder="Where to?"
//                                 onSelectLocation={handleDropoffSelect}
//                                 mapControls={mapControls}
//                                 value={dropoffLocation?.address || ''}
//                                 autoFocus={focusedInput === 'dropoff'}
//                                 onFocus={() => handleInputFocus('dropoff')}
//                                 onBlur={handleInputBlur}
//                               />
//                             </Box>
//                           </Box>

//                           {/* Clear button */}
//                           {dropoffLocation && (
//                             <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled' }} onClick={(e) => { e.stopPropagation(); setDropoffLocation(null); setFareEstimates(null); }}>
//                               <CloseIcon sx={{ fontSize: 14 }} />
//                             </IconButton>
//                           )}
//                         </Box>
//                       </Box>
//                     </Box>

//                     {/* ── Recent Locations ── */}
//                     <AnimatePresence>
//                       {recentLocations.length > 0 && (
//                         <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
//                           <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
//                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                               <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
//                                 {focusedInput === 'pickup' ? 'Set as pickup' : 'Recent destinations'}
//                               </Typography>
//                               <Box sx={{ height: 1, flex: 1, mx: 1.5, bgcolor: 'divider' }} />
//                               <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
//                             </Box>

//                             <List disablePadding>
//                               {recentLocations.map((loc, index) => (
//                                 <motion.div key={`${loc.placeId}-${index}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.2 }}>
//                                   <ListItem
//                                     onClick={() => handleSelectRecentLocation(loc)}
//                                     sx={{ py: 1, px: 1.5, borderRadius: 2, mb: 0.5, cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { bgcolor: 'action.hover', transform: 'translateX(3px)' }, '&:active': { transform: 'translateX(1px)' } }}
//                                   >
//                                     <ListItemIcon sx={{ minWidth: 36, width: 36, height: 36, borderRadius: '50%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
//                                       <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
//                                     </ListItemIcon>
//                                     <ListItemText
//                                       primary={loc.name || loc.address?.split(',')[0]}
//                                       secondary={loc.name && loc.name !== loc.address ? loc.address : null}
//                                       primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem', noWrap: true }}
//                                       secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', noWrap: true }}
//                                     />
//                                   </ListItem>
//                                 </motion.div>
//                               ))}
//                             </List>
//                           </Box>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>

//                     </Box>{/* end scroll area */}
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </SwipeableBottomSheet>
//           )}
//         </AnimatePresence>

//         {/* ══════════════════════════════════════════════════
//             Ride Options — slides in from RIGHT, stays at 95%
//             Book button padded above bottom nav
//         ══════════════════════════════════════════════════ */}
//         <AnimatePresence mode="wait">
//           {showRideOptions && pickupLocation && dropoffLocation && (
//             <SwipeableBottomSheet
//               key="ride-options-sheet"
//               open
//               initialHeight="80%"
//               maxHeight="90%"
//               minHeight={280}
//               expandedHeight="90%"
//               persistHeight
//               draggable={false}
//             >
//               {loadingEstimates ? (
//                 <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//                   <FareEstimatesSkeleton onClose={handleCloseRideOptions} routeInfo={routeInfo} />
//                 </Box>
//               ) : (
//                 <RideOptionsSheet
//                   pickupLocation={pickupLocation}
//                   dropoffLocation={dropoffLocation}
//                   routeInfo={routeInfo}
//                   fareEstimates={fareEstimates}
//                   loadingEstimates={loadingEstimates}
//                   selectedRideClass={selectedRideClass}
//                   onSelectRideClass={setSelectedRideClass}
//                   promoCode={promoCode}
//                   onPromoCodeChange={setPromoCode}
//                   promoDiscount={promoDiscount}
//                   onValidatePromo={handleValidatePromoCode}
//                   validatingPromo={validatingPromo}
//                   onClose={handleCloseRideOptions}
//                   onConfirmRide={handleConfirmRide}
//                   loading={rideLoading}
//                   bottomPadding={80}
//                 />
//               )}
//             </SwipeableBottomSheet>
//           )}
//         </AnimatePresence>

//         {/* ── Snackbar ── */}
//         <Snackbar
//           open={snackbar.open}
//           autoHideDuration={4000}
//           onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
//           anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
//         >
//           <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
//             {snackbar.message}
//           </Alert>
//         </Snackbar>
//       </Box>
//     </ClientOnly>
//   );
// }
// rider/app/(main)/home/page.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Skeleton,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  MyLocation as MyLocationIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  DirectionsCar as DirectionsCarIcon,
  ElectricCar as ElectricCarIcon,
  TwoWheeler as TwoWheelerIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useRide } from '@/lib/hooks/useRide';
import { MapControls } from '@/components/Map/MapControls';
import { LocationSearch } from '@/components/Map/LocationSearch';
import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
import SwipeableBottomSheet, { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';
import ClientOnly from '@/components/ClientOnly';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import MapIframe from '@/components/Map/MapIframe';

// ─────────────────────────────────────────────────────────────────────────────
// The gradient header dragArea sx — shared between drawer and skeleton
// ─────────────────────────────────────────────────────────────────────────────
const HEADER_GRADIENT_SX = {
  // Animated wave shimmer
  background: 'linear-gradient(-60deg, #FFB300 0%, #FF8A00 25%, #FFC107 50%, #FF6D00 75%, #FFD54F 100%)',
  backgroundSize: '300% 300%',
  animation: 'okraHeaderWave 6s ease infinite',
  '@keyframes okraHeaderWave': {
    '0%':   { backgroundPosition: '0% 50%' },
    '50%':  { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: strip all border/icon styling from LocationSearch inner input
// ─────────────────────────────────────────────────────────────────────────────
const CLEAN_INPUT_SX = {
  '& .MuiInputBase-root': {
    border: 'none !important',
    outline: 'none !important',
    boxShadow: 'none !important',
    bgcolor: 'transparent !important',
    p: '0 !important',
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none !important' },
  '& .MuiFilledInput-underline:before': { display: 'none' },
  '& .MuiFilledInput-underline:after':  { display: 'none' },
  '& .MuiInput-underline:before':       { display: 'none' },
  '& .MuiInput-underline:after':        { display: 'none' },
  '& .MuiInputAdornment-root':          { display: 'none' },
  '& .MuiIconButton-root':              { display: 'none' },
  '& .MuiInputBase-input': {
    p: '0 !important',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton: full modal loading (location fetch in progress)
// ─────────────────────────────────────────────────────────────────────────────
const ModalLoadingSkeleton = () => (
  <Box>
    {/* Gradient header skeleton — pill INSIDE, same border-radius as sheet */}
    <Box sx={{
      ...HEADER_GRADIENT_SX,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      px: 3,
      pb: 2.5,
    }}>
      {/* Pill placeholder */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.75 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.4)' }} />
      </Box>
      <Skeleton
        animation="wave"
        variant="text"
        width={110}
        height={32}
        sx={{ bgcolor: 'rgba(255,255,255,0.25)', borderRadius: 1, mb: 1 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton animation="wave" width={80}  height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
        <Skeleton animation="wave" width={130} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton animation="wave" variant="rounded" height={38} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
        <Skeleton animation="wave" variant="rounded" height={38} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
      </Box>
    </Box>

    {/* Input skeletons */}
    <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
      <Skeleton animation="wave" width={44}  height={11} sx={{ borderRadius: 1, mb: 0.5 }} />
      <Skeleton animation="wave" variant="rounded" height={62} sx={{ borderRadius: 2, mb: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
        <Skeleton animation="wave" width={2} height={22} />
      </Box>
      <Skeleton animation="wave" width={60}  height={11} sx={{ borderRadius: 1, mb: 0.5 }} />
      <Skeleton animation="wave" variant="rounded" height={62} sx={{ borderRadius: 2 }} />
    </Box>

    {/* Recent locations skeletons */}
    <Box sx={{ px: 3, pt: 2 }}>
      <Skeleton animation="wave" width={120} height={14} sx={{ borderRadius: 1, mb: 1.5 }} />
      {[1, 2, 3].map((i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Skeleton animation="wave" variant="circular" width={36} height={36} sx={{ mr: 1.5, flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton animation="wave" width="55%" height={14} sx={{ borderRadius: 1, mb: 0.4 }} />
            <Skeleton animation="wave" width="75%" height={12} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton: fare estimates loading inside the ride options sheet
// ─────────────────────────────────────────────────────────────────────────────
const FareEstimatesSkeleton = ({ onClose, routeInfo }) => (
  <Box>
    {/* Gradient header with pill — matches RideOptionsSheet exactly */}
    <Box
      sx={{
        ...HEADER_GRADIENT_SX,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        px: 3,
        pb: 2.5,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Pill */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.75 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.4)' }} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Skeleton animation="wave" width={130} height={26} sx={{ bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 1, mb: 0.5 }} />
          {routeInfo ? (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              📍 {routeInfo.distance}&nbsp;·&nbsp;⏱ {routeInfo.duration}
            </Typography>
          ) : (
            <Skeleton animation="wave" width={100} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>

    {/* Ride option card skeletons */}
    <Box sx={{ px: 3, pt: 2.5 }}>
      <Skeleton animation="wave" width={110} height={18} sx={{ borderRadius: 1, mb: 2 }} />
      {[
        { w1: '60%', w2: '35%' },
        { w1: '50%', w2: '30%' },
        { w1: '45%', w2: '25%' },
      ].map(({ w1, w2 }, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            mb: 1.5,
            border: '1.5px solid',
            borderColor: i === 0 ? 'primary.light' : 'divider',
            borderRadius: 2.5,
            bgcolor: i === 0 ? 'rgba(255,193,7,0.06)' : 'transparent',
            gap: 2,
          }}
        >
          <Skeleton animation="wave" variant="circular" width={52} height={52} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton animation="wave" width={w1} height={18} sx={{ borderRadius: 1, mb: 0.5 }} />
            <Skeleton animation="wave" width={w2} height={14} sx={{ borderRadius: 1 }} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Skeleton animation="wave" width={64} height={22} sx={{ borderRadius: 1, mb: 0.3 }} />
            <Skeleton animation="wave" width={44} height={13} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      ))}
    </Box>

    {/* Promo + book button skeletons */}
    <Box sx={{ px: 3, pb: 3, pt: 1 }}>
      <Skeleton animation="wave" variant="rounded" height={50} sx={{ borderRadius: 2, mb: 2 }} />
      <Skeleton animation="wave" variant="rounded" height={56} sx={{ borderRadius: 3, bgcolor: 'rgba(255,193,7,0.25)' }} />
    </Box>
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { location, loading: locationLoading, refresh } = useGeolocation({ watch: true });
  const { isNative, getCurrentLocation: getNativeLocation } = useReactNative();
  const {
    loading: rideLoading,
    error: rideError,
    getFareEstimate,
    validatePromoCode,
    requestRide,
    getTaxiTypes,
    getRideClasses,
  } = useRide();

  // ── UI State ──
  const [mapCenter, setMapCenter] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [showLocationSheet, setShowLocationSheet] = useState(true);
  const [showRideOptions, setShowRideOptions] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [mapControls, setMapControls] = useState(null);
  const [isRelocating, setIsRelocating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  // ── Input focus & sheet expansion ──
  const [focusedInput, setFocusedInput] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [pickupChipVisible, setPickupChipVisible] = useState(false);

  // ── Skeleton timing ──
  const [showModalSkeleton, setShowModalSkeleton] = useState(true);
  const skeletonTimerRef = useRef(null);
  // ── Ref to scroll into view when keyboard opens on mobile ──
  const inputsSectionRef = useRef(null);

  // ── Ride State ──
  const [fareEstimates, setFareEstimates] = useState(null);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [selectedRideClass, setSelectedRideClass] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // ── Notifications ──
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ═══════════════════════════════════════════════════════════════════════
  // 10-second skeleton timer
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    skeletonTimerRef.current = setTimeout(() => setShowModalSkeleton(false), 5000);
    return () => { if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current); };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // Pickup chip visibility
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    setPickupChipVisible(
      pickupLocation?.placeId === 'current_location' && focusedInput !== 'pickup'
    );
  }, [pickupLocation, focusedInput]);

  // ═══════════════════════════════════════════════════════════════════════
  // Initialize user location
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const initializeLocation = async () => {
      if (isNative && !pickupLocation) {
        try {
          const nativeLoc = await getNativeLocation();
          if (nativeLoc) {
            const currentLoc = { lat: nativeLoc.lat, lng: nativeLoc.lng, address: 'Current Location', name: 'Current Location', placeId: 'current_location' };
            setMapCenter({ lat: nativeLoc.lat, lng: nativeLoc.lng });
            setPickupLocation(currentLoc);
            return;
          }
        } catch {}
      }
      if (location && !pickupLocation) {
        const currentLoc = { lat: location.lat, lng: location.lng, address: 'Current Location', name: 'Current Location', placeId: 'current_location' };
        setMapCenter({ lat: location.lat, lng: location.lng });
        setPickupLocation(currentLoc);
      }
    };
    initializeLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, pickupLocation]);

  // ═══════════════════════════════════════════════════════════════════════
  // Load taxi types
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const load = async () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('okra_rides_recent_locations');
        if (saved) {
          try { setRecentLocations(JSON.parse(saved)); } catch {}
        }
      }
      try {
        const types = await getTaxiTypes();
        if (types?.length > 0) await getRideClasses(types[0].id);
      } catch {}
    };
    load();
  }, [getTaxiTypes, getRideClasses]);

  // ═══════════════════════════════════════════════════════════════════════
  // Auto-transition when both locations set
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (pickupLocation && dropoffLocation && showLocationSheet) {
      loadFareEstimates();
      const t = setTimeout(() => {
        setShowLocationSheet(false);
        setShowRideOptions(true);
        setSheetExpanded(false);
        setFocusedInput(null);
      }, 250);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation, dropoffLocation]);

  // ═══════════════════════════════════════════════════════════════════════
  // Load fare estimates
  // ═══════════════════════════════════════════════════════════════════════
  const loadFareEstimates = async () => {
    if (!pickupLocation || !dropoffLocation) return;
    setLoadingEstimates(true);
    setFareEstimates(null);
    try {
      const estimates = await getFareEstimate(pickupLocation, dropoffLocation, 'taxi', ['taxi']);
      if (estimates) {
        setFareEstimates(estimates);
        if (estimates.estimates?.length > 0) setSelectedRideClass(estimates.estimates[0]);
      } else {
        setSnackbar({ open: true, message: 'Failed to load fare estimates', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Error calculating fare. Please try again.', severity: 'error' });
    } finally {
      setLoadingEstimates(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Promo code validation
  // ═══════════════════════════════════════════════════════════════════════
  const handleValidatePromoCode = async (code) => {
    if (!code || !selectedRideClass) return;
    setValidatingPromo(true);
    try {
      const result = await validatePromoCode(code, selectedRideClass.subtotal);
      if (result?.valid) {
        setPromoDiscount(result);
        setSnackbar({ open: true, message: result.message || 'Promo code applied!', severity: 'success' });
      } else {
        setPromoDiscount(null);
        setSnackbar({ open: true, message: 'Invalid or expired promo code', severity: 'error' });
      }
    } catch {
      setPromoDiscount(null);
      setSnackbar({ open: true, message: 'Error validating promo code', severity: 'error' });
    } finally {
      setValidatingPromo(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Confirm ride booking
  // ═══════════════════════════════════════════════════════════════════════
  const handleConfirmRide = async (rideDetails) => {
    if (!pickupLocation || !dropoffLocation || !selectedRideClass) {
      setSnackbar({ open: true, message: 'Please select pickup and dropoff locations', severity: 'warning' });
      return;
    }
    try {
      const result = await requestRide({
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
        estimatedDistance: parseFloat(routeInfo?.distance) || null,
        estimatedDuration: parseFloat(routeInfo?.duration) || null,
      });
      if (result.success) {
        setSnackbar({ open: true, message: 'Ride requested! Finding your driver…', severity: 'success' });
        setTimeout(() => router.push(`/finding-driver?rideId=${result.data.id}`), 500);
      } else {
        setSnackbar({ open: true, message: result.error || 'Failed to book ride.', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'An error occurred while booking.', severity: 'error' });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Location management
  // ═══════════════════════════════════════════════════════════════════════
  const saveToRecent = useCallback((loc) => {
    if (loc.placeId === 'current_location') return;
    const newRecent = [
      loc,
      ...recentLocations.filter((l) => l.placeId !== loc.placeId && l.address !== loc.address),
    ].slice(0, 5);
    setRecentLocations(newRecent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('okra_rides_recent_locations', JSON.stringify(newRecent));
    }
  }, [recentLocations]);

  const handlePickupSelect = useCallback((loc) => {
    setPickupLocation(loc);
    saveToRecent(loc);
    if (mapControls) mapControls.animateToLocation(loc, 15);
    setTimeout(() => setFocusedInput(null), 150);
    setFareEstimates(null);
    setSelectedRideClass(null);
    setPromoDiscount(null);
  }, [mapControls, saveToRecent]);

  const handleDropoffSelect = useCallback((loc) => {
    setDropoffLocation(loc);
    saveToRecent(loc);
    if (mapControls) mapControls.animateToLocation(loc, 15);
    setTimeout(() => setFocusedInput(null), 150);
    setFareEstimates(null);
    setSelectedRideClass(null);
    setPromoDiscount(null);
  }, [mapControls, saveToRecent]);

  // Recent/saved location goes to focused input, defaults to dropoff
  const handleSelectRecentLocation = useCallback((loc) => {
    if (focusedInput === 'pickup') {
      handlePickupSelect(loc);
    } else {
      handleDropoffSelect(loc);
    }
  }, [focusedInput, handlePickupSelect, handleDropoffSelect]);

  const handleReset = () => {
    if (location) {
      setPickupLocation({ lat: location.lat, lng: location.lng, address: 'Current Location', name: 'Current Location', placeId: 'current_location' });
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
    setFocusedInput(null);
    setSheetExpanded(false);
  };

  // ── Input focus management ──
  const handleInputFocus = (input) => {
    setFocusedInput(input);
    if (!sheetExpanded) setSheetExpanded(true);
  };

  const handleInputBlur = () => {
    // Delay so item-selection fires before blur resets focus state
    setTimeout(() => setFocusedInput(null), 180);
  };

  // "Change" taps into pickup input
  const handleChangeLocation = () => {
    setPickupChipVisible(false);
    handleInputFocus('pickup');
  };

  // "I am here" resets pickup to GPS location
  const handleIAmHere = () => {
    const currentLoc = {
      lat: location?.lat ?? pickupLocation?.lat,
      lng: location?.lng ?? pickupLocation?.lng,
      address: 'Current Location',
      name: 'Current Location',
      placeId: 'current_location',
    };
    setPickupLocation(currentLoc);
    setFocusedInput(null);
    if (mapControls && location) mapControls.animateToLocation(currentLoc, 15);
  };

  // ── Relocate ──
  const handleRelocate = async () => {
    setIsRelocating(true);
    try {
      let newLocation = null;
      if (isNative) {
        try {
          const nativeLoc = await getNativeLocation();
          if (nativeLoc) newLocation = { lat: nativeLoc.lat, lng: nativeLoc.lng };
        } catch {}
      }
      if (!newLocation) {
        await refresh();
        await new Promise((r) => setTimeout(r, 500));
        if (location) newLocation = { lat: location.lat, lng: location.lng };
      }
      if (newLocation && mapControls) {
        mapControls.animateToLocation(newLocation, 16);
        setSnackbar({ open: true, message: 'Location updated', severity: 'success' });
      } else throw new Error();
      setTimeout(() => setIsRelocating(false), 1500);
    } catch {
      setIsRelocating(false);
      setSnackbar({ open: true, message: 'Could not get your location. Check permissions.', severity: 'error' });
    }
  };

  // ── Close ride options → back to location sheet ──
  const handleCloseRideOptions = () => {
    setShowRideOptions(false);
    setShowLocationSheet(true);
    setSheetExpanded(false);
    setFareEstimates(null);
    setDropoffLocation(null);
    setSelectedRideClass(null);
  };

  // ── Display text for user's location in header ──
  const locationDisplayText = (() => {
    if (!pickupLocation) return 'Detecting location…';
    if (pickupLocation.placeId === 'current_location') {
      if (location) return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      return 'Current Location';
    }
    return pickupLocation.name || pickupLocation.address?.split(',')[0] || 'Current Location';
  })();

  // ═══════════════════════════════════════════════════════════════════════
  // Full-page loading (before any location)
  // ═══════════════════════════════════════════════════════════════════════
  if (locationLoading && !location) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>Getting your location…</Typography>
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <ClientOnly>
      {/*
        position:fixed + inset:0 is the most reliable way to contain a mobile
        app to the viewport. It prevents iOS Safari bounce, Android browser
        address-bar shifts, and any horizontal overflow from children.
        overflow:hidden on the root clips everything to the screen rect.
      */}
      <Box
        sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          // Prevent horizontal overflow from any child at any nesting level
          maxWidth: '100vw',
          boxSizing: 'border-box',
        }}
      >

        {/* ── Map ── */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MapIframe
            center={mapCenter ?? (location ? { lat: location.lat, lng: location.lng } : { lat: -15.4167, lng: 28.2833 })}
            zoom={13}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            onMapLoad={setMapControls}
            onRouteCalculated={setRouteInfo}
          />
        </Box>

        {/* ── Relocating overlay ── */}
        <AnimatePresence>
          {isRelocating && (
            <Backdrop open sx={{ zIndex: 1400, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                style={{ textAlign: 'center' }}
              >
                <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, mx: 'auto', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { boxShadow: '0 0 0 0 rgba(255,193,7,0.7)' }, '70%': { boxShadow: '0 0 0 20px rgba(255,193,7,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(255,193,7,0)' } } }}>
                  <MyLocationIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <CircularProgress size={44} thickness={3} sx={{ mb: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>Finding your location…</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>This may take a few seconds</Typography>
              </motion.div>
            </Backdrop>
          )}
        </AnimatePresence>

        {/* ── AppBar ── */}
        <AppBar
          position="absolute"
          sx={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
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

        {/* ── Map Controls ── */}
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: showLocationSheet ? 360 : 100,
            zIndex: 5,
            transition: 'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <MapControls
            onLocateMe={handleRelocate}
            onZoomIn={() => mapControls?.zoomIn()}
            onZoomOut={() => mapControls?.zoomOut()}
          />
        </Box>

        {/* ══════════════════════════════════════════════════
            Location Selection Sheet — initial height ~60vh
        ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showLocationSheet && (
            <SwipeableBottomSheet
              open
              initialHeight="80%"
              maxHeight="90%"
              minHeight={280}
              expandedHeight={sheetExpanded ? '90%' : null}
              persistHeight={sheetExpanded}
              onSwipeDown={() => {
                setSheetExpanded(false);
                setFocusedInput(null);
              }}
            >
              <AnimatePresence mode="wait">
                {showModalSkeleton ? (
                  <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ModalLoadingSkeleton />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.28 }}
                    style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', overflow: 'hidden' }}
                  >
                    {/*
                      ════ UNIFIED GRADIENT ZONE ════
                      The gradient Box contains BOTH the header info AND the inputs.
                      When focusedInput is set, the header info animates upward via
                      AnimatePresence, and Framer Motion's `layout` prop on the
                      inputs wrapper automatically slides them up to fill the space —
                      no measurement or DOM teleportation needed.
                    */}
                    <Box
                      sx={{
                        ...HEADER_GRADIENT_SX,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        flexShrink: 0,
                        overflow: 'hidden',
                        position: 'relative',
                        // Decorative orb
                        '&::before': {
                          content: '""', position: 'absolute',
                          top: -30, right: -30, width: 120, height: 120,
                          borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)',
                          pointerEvents: 'none',
                        },
                      }}
                    >
                      {/* Pill — always visible, always inside gradient, no seam */}
                      <BottomSheetDragPill colored />

                      {/*
                        Header info: title + location row + buttons.
                        Exits UPWARD when any input is focused.
                        AnimatePresence mode="sync" so exit and enter overlap cleanly.
                      */}
                      <AnimatePresence>
                        {!focusedInput && (
                          <motion.div
                            key="header-info"
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -28 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <Box sx={{ px: 3, pb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontSize: '1.15rem', letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.15)', mb: 1.25 }}>
                                Okra Rides
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, gap: 1 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, flexShrink: 0 }}>Your location</Typography>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, maxWidth: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
                                  {locationDisplayText}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button fullWidth size="small" onClick={handleChangeLocation}
                                  sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', py: 0.75, border: '1px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }, '&:focus': { outline: 'none' } }}>
                                  Change
                                </Button>
                                <Button fullWidth size="small" onClick={handleIAmHere}
                                  sx={{ bgcolor: 'white', color: '#E65100', borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', py: 0.75, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' }, '&:focus': { outline: 'none' } }}>
                                  I am here
                                </Button>
                              </Box>
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/*
                        Inputs — always inside the gradient header.
                        `layout` tells Framer Motion to smoothly animate this element's
                        position when the header info above it mounts/unmounts.
                        On focus: header info exits → this block slides up to fill the space.
                        Styling adapts from glass-on-gradient to solid-white-on-gradient.
                      */}
                      <motion.div
                        layout
                        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                        style={{ width: '100%' }}
                      >
                        <Box sx={{ px: 2.5, pt: 0.5, pb: 2.5, width: '100%', boxSizing: 'border-box' }}>
                          {rideError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{rideError}</Alert>}

                          {routeInfo && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                              <Box sx={{ display: 'flex', gap: 1, mb: 1.5, px: 1.5, py: 0.6, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.3)' }}>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>📍 {routeInfo.distance}</Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>·</Typography>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>⏱ {routeInfo.duration}</Typography>
                              </Box>
                            </motion.div>
                          )}

                          {/* ─── Pickup ─── */}
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" sx={{
                              fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase',
                              display: 'block', mb: 0.4, pl: 0.5, transition: 'color 0.2s ease',
                              // Label is always white since it's on the gradient
                              color: focusedInput === 'pickup' ? 'white' : 'rgba(255,255,255,0.65)',
                            }}>
                              Pickup
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex', alignItems: 'center',
                                border: '1.5px solid',
                                // White borders on gradient; brighter when focused
                                borderColor: focusedInput === 'pickup'
                                  ? 'rgba(255,255,255,1)'
                                  : 'rgba(255,255,255,0.45)',
                                borderRadius: 2,
                                // Glow shadow on gradient — white glow
                                boxShadow: focusedInput === 'pickup'
                                  ? '0 0 0 3px rgba(255,255,255,0.22)'
                                  : 'none',
                                // When this field is focused: pure white bg for readability
                                // When other field is focused or neither: frosted glass
                                bgcolor: focusedInput === 'pickup'
                                  ? 'white'
                                  : 'rgba(255,255,255,0.88)',
                                minHeight: 52,
                                width: '100%', maxWidth: '100%', boxSizing: 'border-box',
                                transition: 'all 0.22s ease',
                                // clip border-radius properly — no overflow visible needed
                                // since dropdown uses portal
                                overflow: 'hidden',
                              }}
                            >
                              {/* Person icon */}
                              <Box sx={{
                                width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                alignSelf: 'stretch', flexShrink: 0,
                                borderRight: '1.5px solid',
                                borderColor: focusedInput === 'pickup' ? 'divider' : 'rgba(255,255,255,0.3)',
                                bgcolor: focusedInput === 'pickup' ? 'rgba(255,193,7,0.08)' : 'rgba(255,255,255,0.15)',
                                transition: 'all 0.22s ease',
                              }}>
                                <PersonIcon sx={{ fontSize: 19, color: focusedInput === 'pickup' ? 'primary.main' : pickupLocation ? 'success.main' : 'rgba(0,0,0,0.4)', transition: 'color 0.22s ease' }} />
                              </Box>

                              {/* Input */}
                              <Box
                                sx={{ flex: 1, px: 1.5, py: 1, display: 'flex', alignItems: 'center', cursor: 'text', minWidth: 0 }}
                                onClick={() => { if (pickupChipVisible) { setPickupChipVisible(false); handleInputFocus('pickup'); } }}
                              >
                                {pickupChipVisible ? (
                                  <Chip
                                    icon={<MyLocationIcon sx={{ fontSize: '14px !important' }} />}
                                    label="Current Location"
                                    onDelete={() => { setPickupLocation(null); setPickupChipVisible(false); handleInputFocus('pickup'); }}
                                    onClick={() => { setPickupChipVisible(false); handleInputFocus('pickup'); }}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,193,7,0.15)', color: '#E65100', fontWeight: 700, fontSize: '0.75rem', height: 28, '& .MuiChip-deleteIcon': { color: '#E65100', opacity: 0.7 }, '& .MuiChip-icon': { color: '#E65100' } }}
                                  />
                                ) : (
                                  <Box sx={{ ...CLEAN_INPUT_SX, width: '100%' }}>
                                    <LocationSearch
                                      placeholder={pickupLocation?.address && pickupLocation.placeId !== 'current_location' ? pickupLocation.address : 'Enter pickup location'}
                                      onSelectLocation={handlePickupSelect}
                                      mapControls={mapControls}
                                      value={focusedInput === 'pickup' ? (pickupLocation?.placeId === 'current_location' ? '' : pickupLocation?.address || '') : (pickupLocation?.address || '')}
                                      autoFocus={focusedInput === 'pickup'}
                                      onFocus={() => handleInputFocus('pickup')}
                                      onBlur={handleInputBlur}
                                    />
                                  </Box>
                                )}
                              </Box>

                              {pickupLocation && !pickupChipVisible && (
                                <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled', '&:focus': { outline: 'none' } }} onClick={(e) => { e.stopPropagation(); setPickupLocation(null); setFareEstimates(null); }}>
                                  <CloseIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>

                          {/* Connector line */}
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: '21px', my: 0.2 }}>
                            <Box sx={{ width: 2, height: 18, bgcolor: pickupLocation && dropoffLocation ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', borderRadius: 1, transition: 'background-color 0.3s ease' }} />
                          </Box>

                          {/* ─── Dropoff ─── */}
                          <Box>
                            <Typography variant="caption" sx={{
                              fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase',
                              display: 'block', mb: 0.4, pl: 0.5, transition: 'color 0.2s ease',
                              color: focusedInput === 'dropoff' ? 'white' : 'rgba(255,255,255,0.65)',
                            }}>
                              Destination
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex', alignItems: 'center',
                                border: '1.5px solid',
                                borderColor: focusedInput === 'dropoff'
                                  ? 'rgba(255,255,255,1)'
                                  : 'rgba(255,255,255,0.45)',
                                borderRadius: 2,
                                boxShadow: focusedInput === 'dropoff'
                                  ? '0 0 0 3px rgba(255,255,255,0.22)'
                                  : 'none',
                                bgcolor: focusedInput === 'dropoff'
                                  ? 'white'
                                  : 'rgba(255,255,255,0.88)',
                                minHeight: 52,
                                width: '100%', maxWidth: '100%', boxSizing: 'border-box',
                                transition: 'all 0.22s ease',
                                overflow: 'hidden',
                              }}
                            >
                              {/* Flag icon */}
                              <Box sx={{
                                width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                alignSelf: 'stretch', flexShrink: 0,
                                borderRight: '1.5px solid',
                                borderColor: focusedInput === 'dropoff' ? 'divider' : 'rgba(255,255,255,0.3)',
                                bgcolor: focusedInput === 'dropoff' ? 'rgba(255,193,7,0.08)' : 'rgba(255,255,255,0.15)',
                                transition: 'all 0.22s ease',
                              }}>
                                <FlagIcon sx={{ fontSize: 19, color: focusedInput === 'dropoff' ? 'primary.main' : dropoffLocation ? 'error.main' : 'rgba(0,0,0,0.4)', transition: 'color 0.22s ease' }} />
                              </Box>

                              {/* Input */}
                              <Box sx={{ flex: 1, px: 1.5, py: 1, minWidth: 0 }}>
                                <Box sx={{ ...CLEAN_INPUT_SX, width: '100%' }}>
                                  <LocationSearch
                                    placeholder="Where to?"
                                    onSelectLocation={handleDropoffSelect}
                                    mapControls={mapControls}
                                    value={dropoffLocation?.address || ''}
                                    autoFocus={focusedInput === 'dropoff'}
                                    onFocus={() => handleInputFocus('dropoff')}
                                    onBlur={handleInputBlur}
                                  />
                                </Box>
                              </Box>

                              {dropoffLocation && (
                                <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled', '&:focus': { outline: 'none' } }} onClick={(e) => { e.stopPropagation(); setDropoffLocation(null); setFareEstimates(null); }}>
                                  <CloseIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </motion.div>
                    </Box>{/* end gradient zone */}

                    {/* ── SCROLL AREA — recent locations only ── */}
                    <Box
                      sx={{
                        flex: 1, minHeight: 0,
                        overflowY: 'auto', overflowX: 'hidden',
                        scrollbarWidth: 'none', msOverflowStyle: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                        width: '100%', maxWidth: '100%', boxSizing: 'border-box',
                      }}
                    >
                    {/* ── Recent Locations ── */}
                    <AnimatePresence>
                      {recentLocations.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                          <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                {focusedInput === 'pickup' ? 'Set as pickup' : 'Recent destinations'}
                              </Typography>
                              <Box sx={{ height: 1, flex: 1, mx: 1.5, bgcolor: 'divider' }} />
                              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            </Box>

                            <List disablePadding>
                              {recentLocations.map((loc, index) => (
                                <motion.div key={`${loc.placeId}-${index}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.2 }}>
                                  <ListItem
                                    onClick={() => handleSelectRecentLocation(loc)}
                                    sx={{ py: 1, px: 1.5, borderRadius: 2, mb: 0.5, cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { bgcolor: 'action.hover', transform: 'translateX(3px)' }, '&:active': { transform: 'translateX(1px)' }, '&:focus': { outline: 'none' } }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 36, width: 36, height: 36, borderRadius: '50%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
                                      <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={loc.name || loc.address?.split(',')[0]}
                                      secondary={loc.name && loc.name !== loc.address ? loc.address : null}
                                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem', noWrap: true }}
                                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', noWrap: true }}
                                    />
                                  </ListItem>
                                </motion.div>
                              ))}
                            </List>
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </Box>{/* end scroll area */}
                  </motion.div>
                )}
              </AnimatePresence>
            </SwipeableBottomSheet>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════
            Ride Options — slides in from RIGHT, stays at 95%
            Book button padded above bottom nav
        ══════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {showRideOptions && pickupLocation && dropoffLocation && (
            <SwipeableBottomSheet
              key="ride-options-sheet"
              open
              initialHeight="80%"
              maxHeight="90%"
              minHeight={280}
              expandedHeight="90%"
              persistHeight
              draggable={false}
            >
              {loadingEstimates ? (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <FareEstimatesSkeleton onClose={handleCloseRideOptions} routeInfo={routeInfo} />
                </Box>
              ) : (
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
                  onClose={handleCloseRideOptions}
                  onConfirmRide={handleConfirmRide}
                  loading={rideLoading}
                  bottomPadding={80}
                />
              )}
            </SwipeableBottomSheet>
          )}
        </AnimatePresence>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ClientOnly>
  );
}