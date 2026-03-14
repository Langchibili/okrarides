// 'use client';
// // PATH: rider/app/(main)/tracking/page.jsx
// // CHANGES: visual polish on status bar, ETA card, bottom sheet — zero logic changes.

// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import {
//   Box, Typography, Button, Avatar, IconButton, Chip, Paper,
//   Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle,
//   DialogContent, DialogActions, LinearProgress, useTheme,
// } from '@mui/material';
// import {
//   Phone as PhoneIcon, Message as MessageIcon, Close as CloseIcon,
//   Star as StarIcon, Navigation as NavigationIcon, Place as PlaceIcon,
//   MyLocation as MyLocationIcon, DirectionsCar as CarIcon, Speed as SpeedIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useRide } from '@/lib/hooks/useRide';
// import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
// import ClientOnly from '@/components/ClientOnly';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import MapIframe from '@/components/Map/MapIframe';
// import { getImageUrl } from '@/Functions';
// import { VanIconSmall, getColorByKey } from '@/components/ui/VehicleColorPicker';

// const RIDE_STATUS_CONFIG = {
//   accepted:          { title: 'Driver is on the way',  color: 'info',    icon: '🚗', description: 'Your driver is heading to your pickup location' },
//   arrived:           { title: 'Driver has arrived',    color: 'success', icon: '📍', description: 'Your driver is waiting at the pickup location' },
//   passenger_onboard: { title: 'Trip in progress',      color: 'primary', icon: '🎯', description: 'Taking you to your destination' },
//   awaiting_payment:  { title: 'Payment Required',      color: 'warning', icon: '💳', description: 'Please complete payment for your trip' },
// };

// const deg2rad = (deg) => deg * (Math.PI / 180);
// const calculateDistance = (point1, point2) => {
//   if (!point1 || !point2) return 0;
//   const lat1 = point1.latitude ?? point1.lat ?? 0;
//   const lat2 = point2.latitude ?? point2.lat ?? 0;
//   const lng1 = point1.longitude ?? point1.lng ?? 0;
//   const lng2 = point2.longitude ?? point2.lng ?? 0;
//   const R = 6371;
//   const dLat = deg2rad(lat2 - lat1);
//   const dLon = deg2rad(lng2 - lng1);
//   const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };
// const estimateDuration = (distanceKm) => Math.ceil((distanceKm / 30) * 60);
// const formatETA = (minutes) => {
//   if (!minutes && minutes !== 0) return 'Calculating...';
//   if (minutes < 60) return `${minutes} min`;
//   const h = Math.floor(minutes / 60), m = minutes % 60;
//   return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
// };

// const STATUS_GRADIENTS = {
//   info:    'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
//   success: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
//   primary: 'linear-gradient(135deg, #E65100 0%, #FF8C00 100%)',
//   warning: 'linear-gradient(135deg, #E65100 0%, #F57C00 100%)',
// };

// export default function TrackingPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const rideId = searchParams.get('rideId');
//   const theme = useTheme();
//   const isDark = theme.palette.mode === 'dark';
//   const { activeRide, ride, confirmPickup, cancelRide, startTracking, stopTracking, loading } = useRide();
//   const { on: rnOn } = useReactNative();
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [showCancelDialog, setShowCancelDialog] = useState(false);
//   const [canceling, setCanceling] = useState(false);
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
//   const [trackingStarted, setTrackingStarted] = useState(false);
//   const mapControlsRef = useRef(null);
//   const currentRide = activeRide || ride;
//   const rideStatus = currentRide?.rideStatus;
//   const driver = currentRide?.driver;
//   const vehicle = currentRide?.vehicle;
//   const statusConfig = RIDE_STATUS_CONFIG[rideStatus] || RIDE_STATUS_CONFIG.accepted;
//   const statusGradient = STATUS_GRADIENTS[statusConfig.color] || STATUS_GRADIENTS.info;
//   const [driverProfilePic, setDriverProfilePic ] = useState(null)
//   const { loadRideDriverProfilePicUrl } = useRide()

//   useEffect(() => {
//     const unsub = rnOn('DRIVER_LOCATION_UPDATED', (payload) => {
//       const raw = payload.location ?? payload;
//       if (!raw) return;
//       const loc = { lat: raw.lat ?? raw.latitude, lng: raw.lng ?? raw.longitude, accuracy: raw.accuracy, heading: raw.heading, speed: raw.speed };
//       if (loc.lat == null) return;
//       setDriverLocation(loc);
//       mapControlsRef.current?.updateDriverLocation(loc);
//       if (payload.eta != null) setEta(payload.eta)
//       if (payload.distance != null) setDistance(payload.distance);
//     });
//     return () => unsub?.();
//   }, [rnOn]);

//   useEffect(() => {
//     if (!rideId || !currentRide || trackingStarted) return;
//     const handleUpdate = (trackData) => {
//       if (trackData.driverLocation) { setDriverLocation(trackData.driverLocation); mapControlsRef.current?.updateDriverLocation(trackData.driverLocation); }
//       if (trackData.estimatedDuration !== undefined) setEta(trackData.estimatedDuration);
//       else if (trackData.pickupLocation && trackData.dropoffLocation) setEta(estimateDuration(calculateDistance(trackData.pickupLocation, trackData.dropoffLocation)));
//       if (trackData.estimatedDistance !== undefined) setDistance(trackData.estimatedDistance);
//       else if (trackData.pickupLocation && trackData.dropoffLocation) setDistance(calculateDistance(trackData.pickupLocation, trackData.dropoffLocation));
//     };
//     const cleanup = startTracking(rideId, handleUpdate);
//     setTrackingStarted(true);
//     return () => { if (cleanup) cleanup(); stopTracking(); };
//   }, [rideId, currentRide, startTracking, stopTracking, trackingStarted]);

//   useEffect(() => {
//     if (!currentRide) return;
//     if (currentRide.currentDriverLocation) setDriverLocation(currentRide.currentDriverLocation);
//     if (currentRide.estimatedDuration !== undefined) setEta(currentRide.estimatedDuration);
//     else if (currentRide.pickupLocation && currentRide.dropoffLocation) setEta(estimateDuration(calculateDistance(currentRide.pickupLocation, currentRide.dropoffLocation)));
//     if (currentRide.estimatedDistance !== undefined) setDistance(currentRide.estimatedDistance);
//     else if (currentRide.pickupLocation && currentRide.dropoffLocation) setDistance(calculateDistance(currentRide.pickupLocation, currentRide.dropoffLocation));
//     const getDriverProfilePic = async ()=>{ 
//       setDriverProfilePic(await loadRideDriverProfilePicUrl(currentRide?.driver?.id))
//     }
//     getDriverProfilePic()
//   }, [currentRide]);

//   useEffect(() => {
//     if (!currentRide) return;
//     const id = currentRide.id ?? rideId;
//     if (currentRide.rideStatus === 'awaiting_payment') {
//       if (!window.location.pathname.includes(`/trips/${id}/pay`)) {
//         setSnackbar({ open: true, message: 'Payment required. Redirecting…', severity: 'warning' });
//         setTimeout(() => router.push(`/trips/${id}/pay`), 1200);
//       }
//       return;
//     }
//     if (currentRide.rideStatus === 'completed') { stopTracking(); router.push(`/trip-summary?rideId=${id}`); }
//     else if (currentRide.rideStatus === 'cancelled') { stopTracking(); setSnackbar({ open: true, message: 'Ride was cancelled', severity: 'warning' }); setTimeout(() => router.push('/'), 2000); }
//     else if (currentRide.rideStatus === 'arrived') { setSnackbar({ open: true, message: '📍 Your driver has arrived!', severity: 'success' }); }
//   }, [currentRide?.rideStatus, router, stopTracking, rideId]);

//   const handleConfirmPickup = async () => {
//     if (!rideId) return;
//     try {
//       const result = await confirmPickup(rideId);
//       setSnackbar({ open: true, message: result.success ? 'Trip started!' : (result.error || 'Failed'), severity: result.success ? 'success' : 'error' });
//     } catch { setSnackbar({ open: true, message: 'An error occurred.', severity: 'error' }); }
//   };

//   const handleCancelRide = async () => {
//     if (!rideId) return;
//     setCanceling(true);
//     try {
//       const result = await cancelRide(rideId, 'CHANGE_OF_PLANS', 'Cancelled during trip');
//       if (result.success) { setSnackbar({ open: true, message: 'Ride cancelled', severity: 'info' }); setTimeout(() => router.push('/'), 1500); }
//       else setSnackbar({ open: true, message: result.error || 'Failed to cancel', severity: 'error' });
//     } catch { setSnackbar({ open: true, message: 'Error cancelling', severity: 'error' }); }
//     finally { setCanceling(false); setShowCancelDialog(false); }
//   };

//   const markers = [];
//   if (driverLocation) markers.push({ id: 'driver', position: driverLocation, type: 'driver', icon: '🚗', animation: 'BOUNCE' });
//   if (currentRide?.pickupLocation) markers.push({ id: 'pickup', position: currentRide.pickupLocation, type: 'pickup', icon: '📍' });
//   if (currentRide?.dropoffLocation && rideStatus === 'passenger_onboard') markers.push({ id: 'dropoff', position: currentRide.dropoffLocation, type: 'dropoff', icon: '🎯' });

//   if (!currentRide && loading)
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
//         <CircularProgress size={40} sx={{ color: '#FFC107' }} />
//         <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading ride details...</Typography>
//       </Box>
//     );

//   if (!currentRide && !loading)
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', p: 3 }}>
//         <Typography variant="h6" sx={{ mb: 2 }}>No active ride found</Typography>
//         <Button variant="contained" onClick={() => router.push('/')}>Go to Home</Button>
//       </Box>
//     );

//   return (
//     <ClientOnly>
//       <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

//         {/* Map */}
//         <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
//           <MapIframe
//             center={driverLocation || currentRide?.pickupLocation || { lat: -15.4167, lng: 28.2833 }}
//             zoom={15}
//             markers={markers}
//             pickupLocation={currentRide?.pickupLocation}
//             dropoffLocation={rideStatus === 'passenger_onboard' ? currentRide?.dropoffLocation : null}
//             showRoute={rideStatus === 'passenger_onboard'}
//             onMapLoad={(c) => { mapControlsRef.current = c; }}
//           />
//         </Box>

//         {/* Status Bar */}
//         <motion.div
//           initial={{ y: -60, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ type: 'spring', stiffness: 260, damping: 24 }}
//           style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
//         >
//           <Box
//             sx={{
//               background: statusGradient,
//               color: 'white',
//               py: 1.5,
//               px: 2,
//               display: 'flex',
//               alignItems: 'center',
//               gap: 1.5,
//               boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
//             }}
//           >
//             <Box
//               sx={{
//                 width: 38,
//                 height: 38,
//                 borderRadius: '50%',
//                 bgcolor: 'rgba(255,255,255,0.18)',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 fontSize: '1.3rem',
//                 flexShrink: 0,
//               }}
//             >
//               {statusConfig.icon}
//             </Box>
//             <Box sx={{ flex: 1 }}>
//               <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
//                 {statusConfig.title}
//               </Typography>
//               <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 400 }}>
//                 {statusConfig.description}
//               </Typography>
//             </Box>
//             <IconButton size="small" onClick={() => router.push('/')} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
//               <CloseIcon sx={{ fontSize: 18 }} />
//             </IconButton>
//           </Box>
//         </motion.div>

//         {/* ETA card */}
//         {rideStatus === 'accepted' && (
//           <motion.div
//             initial={{ y: -80, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
//             style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9 }}
//           >
//             <Paper
//               elevation={8}
//               sx={{
//                 px: 3,
//                 py: 1.5,
//                 borderRadius: 4,
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 2.5,
//                 background: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.96)',
//                 backdropFilter: 'blur(20px)',
//                 border: '1px solid',
//                 borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
//                 boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
//               }}
//             >
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>
//                   ETA
//                 </Typography>
//                 <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFC107', lineHeight: 1.1, letterSpacing: -0.5 }}>
//                   {eta ? formatETA(eta) : '—'}
//                 </Typography>
//               </Box>
//               <Divider orientation="vertical" flexItem />
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>
//                   Distance
//                 </Typography>
//                 <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.5 }}>
//                   {distance ? `${distance.toFixed(1)} km` : '—'}
//                 </Typography>
//               </Box>
//             </Paper>
//           </motion.div>
//         )}

//         {/* Payment banner */}
//         {rideStatus === 'awaiting_payment' && (
//           <motion.div
//             initial={{ y: -80, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             style={{ position: 'absolute', top: 70, left: 16, right: 16, zIndex: 9 }}
//           >
//             <Alert
//               severity="warning"
//               sx={{ borderRadius: 3, fontWeight: 600, boxShadow: '0 8px 24px rgba(255,152,0,0.3)' }}
//               action={
//                 <Button
//                   size="small"
//                   variant="contained"
//                   color="warning"
//                   onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)}
//                   sx={{ fontWeight: 700, borderRadius: 2 }}
//                 >
//                   Pay Now
//                 </Button>
//               }
//             >
//               Payment required — please pay the driver
//             </Alert>
//           </motion.div>
//         )}

//         {/* Center on driver button */}
//         {driverLocation && (
//           <IconButton
//             onClick={() => mapControlsRef.current?.animateToLocation(driverLocation, 16)}
//             sx={{
//               position: 'absolute',
//               right: 16,
//               top: 80,
//               zIndex: 5,
//               bgcolor: isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)',
//               backdropFilter: 'blur(10px)',
//               boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
//               border: '1px solid',
//               borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
//               '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.3)', transform: 'scale(1.06)' },
//               transition: 'all 0.18s ease',
//             }}
//           >
//             <MyLocationIcon color="primary" />
//           </IconButton>
//         )}

//         {/* Bottom Sheet */}
//         <SwipeableBottomSheet
//           open
//           initialHeight={rideStatus === 'arrived' ? 500 : 420}
//           maxHeight="80%"
//           minHeight={200}
//           draggable
//         >
//           {/* Drag pill — always visible at top so the user knows they can pull up */}
//           <Box sx={{ pt: 1.25, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
//             <Box
//               sx={{
//                 width: 36,
//                 height: 4,
//                 borderRadius: 2,
//                 bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
//               }}
//             />
//             <Typography
//               variant="caption"
//               sx={{
//                 color: 'text.disabled',
//                 fontSize: '0.6rem',
//                 fontWeight: 600,
//                 letterSpacing: 0.4,
//                 textTransform: 'uppercase',
//                 opacity: 0.7,
//               }}
//             >
//               Pull up for details
//             </Typography>
//           </Box>

//           <Box
//             sx={{
//               px: 3,
//               pb: 3,
//               flex: 1,
//               display: 'flex',
//               flexDirection: 'column',
//               overflowY: 'auto',
//               '&::-webkit-scrollbar': { display: 'none' },
//               scrollbarWidth: 'none',
//             }}
//           >
//             {/* Driver header */}
//             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, flexShrink: 0 }}>
//               <Box sx={{ position: 'relative', mr: 2 }}>
//                 <Avatar
//                   src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(driverProfilePic, 'thumbnail')}
//                   sx={{
//                     width: 64,
//                     height: 64,
//                     border: '3px solid',
//                     borderColor: 'primary.main',
//                     boxShadow: '0 4px 16px rgba(255,193,7,0.3)',
//                   }}
//                 >
//                   {driver?.firstName?.[0]}
//                 </Avatar>
//                 <Box
//                   sx={{
//                     position: 'absolute',
//                     bottom: 2,
//                     right: 2,
//                     width: 12,
//                     height: 12,
//                     borderRadius: '50%',
//                     bgcolor: 'success.main',
//                     border: '2px solid',
//                     borderColor: 'background.paper',
//                   }}
//                 />
//               </Box>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.3, letterSpacing: -0.3 }}>
//                   {driver?.firstName} {driver?.lastName}
//                 </Typography>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
//                   <StarIcon sx={{ fontSize: 15, color: '#FF8C00' }} />
//                   <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF8C00', fontSize: '0.82rem' }}>
//                     {driver?.driverProfile?.averageRating || 4.8}
//                   </Typography>
//                   <Typography variant="caption" sx={{ color: 'text.disabled' }}>
//                     · {driver?.driverProfile?.completedRides || 0} trips
//                   </Typography>
//                 </Box>
//                 <Chip
//                   size="small"
//                   label={
//                     rideStatus === 'awaiting_payment' ? 'Payment Required'
//                     : rideStatus === 'arrived' ? 'Arrived'
//                     : rideStatus === 'passenger_onboard' ? 'In Transit'
//                     : 'On the way'
//                   }
//                   color={rideStatus === 'awaiting_payment' ? 'warning' : rideStatus === 'arrived' ? 'success' : 'primary'}
//                   sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
//                 />
//               </Box>
//               <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
//                 <IconButton
//                   onClick={
//                     () => {
//                         const raw = /^\+?\d[\d\s\-]{6,}$/.test(driver.username)
//                           ? driver.username
//                           : driver.phoneNumber;
//                         const digits = raw.replace(/\D/g, '');
//                         const phone = digits.length > 10 ? digits.slice(-10) : digits;
//                         window.location.href = `tel:${phone}`;
//                   }}
//                   sx={{
//                     bgcolor: 'success.main',
//                     color: '#fff',
//                     width: 40,
//                     height: 40,
//                     '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' },
//                     transition: 'all 0.16s ease',
//                   }}
//                 >
//                   <PhoneIcon sx={{ fontSize: 18 }} />
//                 </IconButton>
//                 <IconButton
//                   onClick={
//                      () => {
//                         const raw = /^\+?\d[\d\s\-]{6,}$/.test(driver.username)
//                           ? driver.username
//                           : driver.phoneNumber;
//                         const phone = raw.replace(/\D/g, '');
//                         window.open(`https://wa.me/${phone}`, '_blank');
//                    }}
//                   sx={{
//                     background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
//                     color: '#000',
//                     width: 40,
//                     height: 40,
//                     '&:hover': { transform: 'scale(1.08)' },
//                     transition: 'all 0.16s ease',
//                   }}
//                 >
//                   <MessageIcon sx={{ fontSize: 18 }} />
//                 </IconButton>
//               </Box>
//             </Box>

//             {/* In-progress banner */}
//             <AnimatePresence mode="wait">
//               {rideStatus === 'passenger_onboard' && (
//                 <motion.div key="in-progress" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
//                   <Box
//                     sx={{
//                       p: 2,
//                       borderRadius: 3,
//                       background: 'linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,140,0,0.08) 100%)',
//                       border: '1px solid rgba(255,193,7,0.25)',
//                       mb: 2,
//                       flexShrink: 0,
//                     }}
//                   >
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
//                       <SpeedIcon sx={{ color: '#FF8C00', fontSize: 18 }} />
//                       <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Trip in Progress</Typography>
//                     </Box>
//                     <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta ? 1.5 : 0 }}>
//                       Sit back and relax. You'll arrive soon!
//                     </Typography>
//                     {eta && (
//                       <Box>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                           <Typography variant="caption" sx={{ fontWeight: 600 }}>Estimated Arrival</Typography>
//                           <Typography variant="caption" sx={{ fontWeight: 800, color: '#FF8C00' }}>{formatETA(eta)}</Typography>
//                         </Box>
//                         <LinearProgress
//                           variant="indeterminate"
//                           sx={{
//                             borderRadius: 2,
//                             height: 5,
//                             bgcolor: 'rgba(255,193,7,0.15)',
//                             '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #FFC107, #FF8C00)' },
//                           }}
//                         />
//                       </Box>
//                     )}
//                   </Box>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Vehicle card */}
//             <Box
//               sx={{
//                 p: 2,
//                 borderRadius: 3,
//                 border: '1px solid',
//                 borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
//                 bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
//                 mb: 2,
//                 flexShrink: 0,
//               }}
//             >
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
//                 <CarIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
//                 <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.disabled' }}>
//                   Vehicle
//                 </Typography>
//               </Box>
//               <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
//                 <Box>
//                   <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Plate</Typography>
//                   <Typography
//                     variant="body1"
//                     sx={{
//                       fontWeight: 800,
//                       letterSpacing: 1,
//                       fontFamily: 'monospace',
//                       background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
//                       backgroundClip: 'text',
//                       WebkitBackgroundClip: 'text',
//                       WebkitTextFillColor: 'transparent',
//                     }}
//                   >
//                     {vehicle?.numberPlate || 'N/A'}
//                   </Typography>
//                 </Box>
//                 <Box>
//                   <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Model</Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>{vehicle?.make} {vehicle?.model}</Typography>
//                 </Box>
//                 <Box>
//                   <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>
//                     Color
//                   </Typography>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
//                     <Box
//                       sx={{
//                         width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
//                         bgcolor: getColorByKey(vehicle?.color)?.body,
//                         border: '1.5px solid',
//                         borderColor: getColorByKey(vehicle?.color)?.outline,
//                       }}
//                     />
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                       {getColorByKey(vehicle?.color)?.label ?? vehicle?.color}
//                     </Typography>
//                   </Box>
//                 </Box>
//                 {driverLocation?.speed && (
//                   <Box>
//                     <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Speed</Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>{Math.round(driverLocation.speed)} km/h</Typography>
//                   </Box>
//                 )}
//               </Box>

//               {/* Van colour preview */}
//               {vehicle?.color && (
//                 <Box
//                   sx={{
//                     mt: 1.5,
//                     p: 1.5,
//                     borderRadius: 2.5,
//                     bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
//                     border: '1px solid',
//                     borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
//                     display: 'flex',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <VanIconSmall colorKey={vehicle.color} size={140} />
//                 </Box>
//               )}
//             </Box>

//             {/* Route */}
//             <Box sx={{ mb: 2, flexShrink: 0 }}>
//               <Box sx={{ display: 'flex', gap: 2 }}>
//                 <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
//                   <NavigationIcon sx={{ color: 'success.main', fontSize: 18 }} />
//                   <Box sx={{ flex: 1, width: 2, minHeight: 24, background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 3px, transparent 3px, transparent 6px)', my: 0.5 }} />
//                   <PlaceIcon sx={{ color: 'error.main', fontSize: 18 }} />
//                 </Box>
//                 <Box sx={{ flex: 1 }}>
//                   <Box sx={{ mb: 2 }}>
//                     <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>Pickup</Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3, mt: 0.2 }}>{currentRide?.pickupLocation?.address}</Typography>
//                   </Box>
//                   <Box>
//                     <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>Destination</Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3, mt: 0.2 }}>{currentRide?.dropoffLocation?.address}</Typography>
//                   </Box>
//                 </Box>
//               </Box>
//             </Box>

//             {/* Actions */}
//             <Box sx={{ mt: 'auto', flexShrink: 0 }}>
//               <AnimatePresence mode="wait">
//                 {rideStatus === 'arrived' && (
//                   <motion.div key="confirm-pickup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
//                     <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }}>
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                         Your driver has arrived! Confirm once you're in the vehicle.
//                       </Typography>
//                     </Alert>
//                     <Button
//                       fullWidth
//                       variant="contained"
//                       size="large"
//                       onClick={handleConfirmPickup}
//                       disabled={loading}
//                       sx={{
//                         height: 56,
//                         fontWeight: 800,
//                         fontSize: '1rem',
//                         borderRadius: 3.5,
//                         mb: 1,
//                         background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
//                         boxShadow: '0 6px 20px rgba(76,175,80,0.4)',
//                         '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(76,175,80,0.5)' },
//                         transition: 'all 0.2s ease',
//                       }}
//                     >
//                       {loading ? <CircularProgress size={24} color="inherit" /> : "✓ I'm in the car — Start Trip"}
//                     </Button>
//                   </motion.div>
//                 )}
//                 {rideStatus === 'awaiting_payment' && (
//                   <motion.div key="awaiting-payment" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
//                     <Button
//                       fullWidth
//                       variant="contained"
//                       color="warning"
//                       size="large"
//                       onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)}
//                       sx={{ height: 56, fontWeight: 800, borderRadius: 3.5, mb: 1 }}
//                     >
//                       💳 Pay Now
//                     </Button>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {rideStatus !== 'passenger_onboard' && rideStatus !== 'awaiting_payment' && (
//                 <Button
//                   fullWidth
//                   variant="outlined"
//                   color="error"
//                   onClick={() => setShowCancelDialog(true)}
//                   disabled={canceling}
//                   sx={{
//                     height: 48,
//                     fontWeight: 700,
//                     borderRadius: 3.5,
//                     borderWidth: 1.5,
//                     '&:hover': { borderWidth: 1.5 },
//                   }}
//                 >
//                   Cancel Ride
//                 </Button>
//               )}
//             </Box>
//           </Box>
//         </SwipeableBottomSheet>

//         {/* Cancel Dialog */}
//         <Dialog
//           open={showCancelDialog}
//           onClose={() => setShowCancelDialog(false)}
//           PaperProps={{ sx: { borderRadius: 4, maxWidth: 400, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }}
//         >
//           <DialogTitle sx={{ fontWeight: 700 }}>
//             Cancel Ride?
//             <IconButton onClick={() => setShowCancelDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
//               <CloseIcon />
//             </IconButton>
//           </DialogTitle>
//           <DialogContent>
//             <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>A cancellation fee may apply.</Alert>
//             <Typography variant="body2" color="text.secondary">Are you sure you want to cancel this ride?</Typography>
//           </DialogContent>
//           <DialogActions sx={{ p: 2.5, pt: 1 }}>
//             <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}>Keep Ride</Button>
//             <Button onClick={handleCancelRide} variant="contained" color="error" disabled={canceling} sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}>
//               {canceling ? <CircularProgress size={20} /> : 'Yes, Cancel'}
//             </Button>
//           </DialogActions>
//         </Dialog>

//         {/* Snackbar */}
//         <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
//           <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
//             {snackbar.message}
//           </Alert>
//         </Snackbar>
//       </Box>
//     </ClientOnly>
//   );
// }
'use client';
// PATH: rider/app/(main)/tracking/page.jsx
// CHANGES: visual polish on status bar, ETA card, bottom sheet — zero logic changes.
//          FIX: normalizeCoords() applied everywhere driverLocation is set from
//               backend/ride data so { latitude, longitude } shapes are always
//               converted to { lat, lng } before reaching the map.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Avatar, IconButton, Chip, Paper,
  Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, useTheme,
} from '@mui/material';
import {
  Phone as PhoneIcon, Message as MessageIcon, Close as CloseIcon,
  Star as StarIcon, Navigation as NavigationIcon, Place as PlaceIcon,
  MyLocation as MyLocationIcon, DirectionsCar as CarIcon, Speed as SpeedIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRide } from '@/lib/hooks/useRide';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import ClientOnly from '@/components/ClientOnly';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import MapIframe from '@/components/Map/MapIframe';
import { getImageUrl } from '@/Functions';
import { VanIconSmall, getColorByKey } from '@/components/ui/VehicleColorPicker';

const RIDE_STATUS_CONFIG = {
  accepted:          { title: 'Driver is on the way',  color: 'info',    icon: '🚗', description: 'Your driver is heading to your pickup location' },
  arrived:           { title: 'Driver has arrived',    color: 'success', icon: '📍', description: 'Your driver is waiting at the pickup location' },
  passenger_onboard: { title: 'Trip in progress',      color: 'primary', icon: '🎯', description: 'Taking you to your destination' },
  awaiting_payment:  { title: 'Payment Required',      color: 'warning', icon: '💳', description: 'Please complete payment for your trip' },
};

const deg2rad = (deg) => deg * (Math.PI / 180);
const calculateDistance = (point1, point2) => {
  if (!point1 || !point2) return 0;
  const lat1 = point1.latitude ?? point1.lat ?? 0;
  const lat2 = point2.latitude ?? point2.lat ?? 0;
  const lng1 = point1.longitude ?? point1.lng ?? 0;
  const lng2 = point2.longitude ?? point2.lng ?? 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const estimateDuration = (distanceKm) => Math.ceil((distanceKm / 30) * 60);
const formatETA = (minutes) => {
  if (!minutes && minutes !== 0) return 'Calculating...';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};

const STATUS_GRADIENTS = {
  info:    'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
  success: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
  primary: 'linear-gradient(135deg, #E65100 0%, #FF8C00 100%)',
  warning: 'linear-gradient(135deg, #E65100 0%, #F57C00 100%)',
};

// ─── FIX ────────────────────────────────────────────────────────────────────
// The backend stores the driver's current location with { latitude, longitude }
// keys (from the GPS/nominatim shape), while the map and all internal helpers
// expect { lat, lng }.  This normalizer is applied every time we receive a
// driver location from ANY source so the map never gets undefined coords.
// ────────────────────────────────────────────────────────────────────────────
const normalizeCoords = (loc) => {
  if (!loc) return null;
  const lat = loc.lat ?? loc.latitude;
  const lng = loc.lng ?? loc.longitude;
  if (lat == null || lng == null) return null;
  return { ...loc, lat, lng };
};

export default function TrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideId = searchParams.get('rideId');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { activeRide, ride, confirmPickup, cancelRide, startTracking, stopTracking, loading } = useRide();
  const { on: rnOn } = useReactNative();
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [trackingStarted, setTrackingStarted] = useState(false);
  const mapControlsRef = useRef(null);
  const currentRide = activeRide || ride;
  const rideStatus = currentRide?.rideStatus;
  const driver = currentRide?.driver;
  const vehicle = currentRide?.vehicle;
  const statusConfig = RIDE_STATUS_CONFIG[rideStatus] || RIDE_STATUS_CONFIG.accepted;
  const statusGradient = STATUS_GRADIENTS[statusConfig.color] || STATUS_GRADIENTS.info;
  const [driverProfilePic, setDriverProfilePic] = useState(null);
  const { loadRideDriverProfilePicUrl } = useRide();

  // ── RN live location updates ─────────────────────────────────────────────
  // Already normalised correctly — kept as-is but now uses normalizeCoords()
  // for consistency and safety.
  useEffect(() => {
    const unsub = rnOn('DRIVER_LOCATION_UPDATED', (payload) => {
      const raw = payload.location ?? payload;
      if (!raw) return;

      // FIX: use normalizeCoords so both { lat } and { latitude } shapes work
      const loc = normalizeCoords({
        lat:      raw.lat      ?? raw.latitude,
        lng:      raw.lng      ?? raw.longitude,
        accuracy: raw.accuracy,
        heading:  raw.heading,
        speed:    raw.speed,
      });
      if (!loc) return;

      setDriverLocation(loc);
      mapControlsRef.current?.updateDriverLocation(loc);
      if (payload.eta      != null) setEta(payload.eta);
      if (payload.distance != null) setDistance(payload.distance);
    });
    return () => unsub?.();
  }, [rnOn]);

  // ── startTracking subscription ───────────────────────────────────────────
  useEffect(() => {
    if (!rideId || !currentRide || trackingStarted) return;

    const handleUpdate = (trackData) => {
      if (trackData.driverLocation) {
        // FIX: normalise before storing / forwarding to map
        const norm = normalizeCoords(trackData.driverLocation);
        if (norm) {
          setDriverLocation(norm);
          mapControlsRef.current?.updateDriverLocation(norm);
        }
      }
      if (trackData.estimatedDuration !== undefined) {
        setEta(trackData.estimatedDuration);
      } else if (trackData.pickupLocation && trackData.dropoffLocation) {
        setEta(estimateDuration(calculateDistance(trackData.pickupLocation, trackData.dropoffLocation)));
      }
      if (trackData.estimatedDistance !== undefined) {
        setDistance(trackData.estimatedDistance);
      } else if (trackData.pickupLocation && trackData.dropoffLocation) {
        setDistance(calculateDistance(trackData.pickupLocation, trackData.dropoffLocation));
      }
    };

    const cleanup = startTracking(rideId, handleUpdate);
    setTrackingStarted(true);
    return () => { if (cleanup) cleanup(); stopTracking(); };
  }, [rideId, currentRide, startTracking, stopTracking, trackingStarted]);

  // ── Seed state from currentRide on first load / ride change ─────────────
  useEffect(() => {
    if (!currentRide) return;

    // FIX: currentRide.currentDriverLocation comes from the backend with
    // { latitude, longitude } — normalise it before setting state.
    if (currentRide.currentDriverLocation) {
      const norm = normalizeCoords(currentRide.currentDriverLocation);
      if (norm) setDriverLocation(norm);
    }

    if (currentRide.estimatedDuration !== undefined) {
      setEta(currentRide.estimatedDuration);
    } else if (currentRide.pickupLocation && currentRide.dropoffLocation) {
      setEta(estimateDuration(calculateDistance(currentRide.pickupLocation, currentRide.dropoffLocation)));
    }

    if (currentRide.estimatedDistance !== undefined) {
      setDistance(currentRide.estimatedDistance);
    } else if (currentRide.pickupLocation && currentRide.dropoffLocation) {
      setDistance(calculateDistance(currentRide.pickupLocation, currentRide.dropoffLocation));
    }

    const getDriverProfilePic = async () => {
      setDriverProfilePic(await loadRideDriverProfilePicUrl(currentRide?.driver?.id));
    };
    getDriverProfilePic();
  }, [currentRide]);

  // ── Ride-status side-effects (redirect, snackbar, etc.) ─────────────────
  useEffect(() => {
    if (!currentRide) return;
    const id = currentRide.id ?? rideId;
    if (currentRide.rideStatus === 'awaiting_payment') {
      if (!window.location.pathname.includes(`/trips/${id}/pay`)) {
        setSnackbar({ open: true, message: 'Payment required. Redirecting…', severity: 'warning' });
        setTimeout(() => router.push(`/trips/${id}/pay`), 1200);
      }
      return;
    }
    if (currentRide.rideStatus === 'completed') { stopTracking(); router.push(`/trip-summary?rideId=${id}`); }
    else if (currentRide.rideStatus === 'cancelled') { stopTracking(); setSnackbar({ open: true, message: 'Ride was cancelled', severity: 'warning' }); setTimeout(() => router.push('/'), 2000); }
    else if (currentRide.rideStatus === 'arrived')   { setSnackbar({ open: true, message: '📍 Your driver has arrived!', severity: 'success' }); }
  }, [currentRide?.rideStatus, router, stopTracking, rideId]);

  const handleConfirmPickup = async () => {
    if (!rideId) return;
    try {
      const result = await confirmPickup(rideId);
      setSnackbar({ open: true, message: result.success ? 'Trip started!' : (result.error || 'Failed'), severity: result.success ? 'success' : 'error' });
    } catch { setSnackbar({ open: true, message: 'An error occurred.', severity: 'error' }); }
  };

  const handleCancelRide = async () => {
    if (!rideId) return;
    setCanceling(true);
    try {
      const result = await cancelRide(rideId, 'CHANGE_OF_PLANS', 'Cancelled during trip');
      if (result.success) { setSnackbar({ open: true, message: 'Ride cancelled', severity: 'info' }); setTimeout(() => router.push('/'), 1500); }
      else setSnackbar({ open: true, message: result.error || 'Failed to cancel', severity: 'error' });
    } catch { setSnackbar({ open: true, message: 'Error cancelling', severity: 'error' }); }
    finally { setCanceling(false); setShowCancelDialog(false); }
  };

  // ── Map markers ──────────────────────────────────────────────────────────
  // driverLocation is now guaranteed to be { lat, lng } (or null) at this point
  const markers = [];
  if (driverLocation) markers.push({ id: 'driver', position: driverLocation, type: 'driver', icon: '🚗', animation: 'BOUNCE' });
  if (currentRide?.pickupLocation) markers.push({ id: 'pickup', position: currentRide.pickupLocation, type: 'pickup', icon: '📍' });
  if (currentRide?.dropoffLocation && rideStatus === 'passenger_onboard') markers.push({ id: 'dropoff', position: currentRide.dropoffLocation, type: 'dropoff', icon: '🎯' });

  if (!currentRide && loading)
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#FFC107' }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading ride details...</Typography>
      </Box>
    );

  if (!currentRide && !loading)
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>No active ride found</Typography>
        <Button variant="contained" onClick={() => router.push('/')}>Go to Home</Button>
      </Box>
    );

  return (
    <ClientOnly>
      <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

        {/* Map */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MapIframe
            center={driverLocation || currentRide?.pickupLocation || { lat: -15.4167, lng: 28.2833 }}
            zoom={15}
            markers={markers}
            pickupLocation={currentRide?.pickupLocation}
            dropoffLocation={rideStatus === 'passenger_onboard' ? currentRide?.dropoffLocation : null}
            showRoute={rideStatus === 'passenger_onboard'}
            onMapLoad={(c) => { mapControlsRef.current = c; }}
          />
        </Box>

        {/* Status Bar */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
        >
          <Box
            sx={{
              background: statusGradient,
              color: 'white',
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
              }}
            >
              {statusConfig.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {statusConfig.title}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 400 }}>
                {statusConfig.description}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => router.push('/')} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </motion.div>

        {/* ETA card */}
        {rideStatus === 'accepted' && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
            style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9 }}
          >
            <Paper
              elevation={8}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                background: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  ETA
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFC107', lineHeight: 1.1, letterSpacing: -0.5 }}>
                  {eta ? formatETA(eta) : '—'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Distance
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.5 }}>
                  {distance ? `${distance.toFixed(1)} km` : '—'}
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* Payment banner */}
        {rideStatus === 'awaiting_payment' && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ position: 'absolute', top: 70, left: 16, right: 16, zIndex: 9 }}
          >
            <Alert
              severity="warning"
              sx={{ borderRadius: 3, fontWeight: 600, boxShadow: '0 8px 24px rgba(255,152,0,0.3)' }}
              action={
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)}
                  sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                  Pay Now
                </Button>
              }
            >
              Payment required — please pay the driver
            </Alert>
          </motion.div>
        )}

        {/* Center on driver button */}
        {driverLocation && (
          <IconButton
            onClick={() => mapControlsRef.current?.animateToLocation(driverLocation, 16)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 80,
              zIndex: 5,
              bgcolor: isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.3)', transform: 'scale(1.06)' },
              transition: 'all 0.18s ease',
            }}
          >
            <MyLocationIcon color="primary" />
          </IconButton>
        )}

        {/* Bottom Sheet */}
        <SwipeableBottomSheet
          open
          initialHeight={rideStatus === 'arrived' ? 500 : 420}
          maxHeight="80%"
          minHeight={200}
          draggable
        >
          {/* Drag pill */}
          <Box sx={{ pt: 1.25, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'text.disabled',
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                opacity: 0.7,
              }}
            >
              Pull up for details
            </Typography>
          </Box>

          <Box
            sx={{
              px: 3,
              pb: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            {/* Driver header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, flexShrink: 0 }}>
              <Box sx={{ position: 'relative', mr: 2 }}>
                <Avatar
                  src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(driverProfilePic, 'thumbnail')}
                  sx={{
                    width: 64,
                    height: 64,
                    border: '3px solid',
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 16px rgba(255,193,7,0.3)',
                  }}
                >
                  {driver?.firstName?.[0]}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    border: '2px solid',
                    borderColor: 'background.paper',
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.3, letterSpacing: -0.3 }}>
                  {driver?.firstName} {driver?.lastName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
                  <StarIcon sx={{ fontSize: 15, color: '#FF8C00' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF8C00', fontSize: '0.82rem' }}>
                    {driver?.driverProfile?.averageRating || 4.8}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    · {driver?.driverProfile?.completedRides || 0} trips
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={
                    rideStatus === 'awaiting_payment' ? 'Payment Required'
                    : rideStatus === 'arrived'        ? 'Arrived'
                    : rideStatus === 'passenger_onboard' ? 'In Transit'
                    : 'On the way'
                  }
                  color={rideStatus === 'awaiting_payment' ? 'warning' : rideStatus === 'arrived' ? 'success' : 'primary'}
                  sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <IconButton
                  onClick={() => {
                    const raw = /^\+?\d[\d\s\-]{6,}$/.test(driver.username)
                      ? driver.username
                      : driver.phoneNumber;
                    const digits = raw.replace(/\D/g, '');
                    const phone = digits.length > 10 ? digits.slice(-10) : digits;
                    window.location.href = `tel:${phone}`;
                  }}
                  sx={{
                    bgcolor: 'success.main',
                    color: '#fff',
                    width: 40,
                    height: 40,
                    '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' },
                    transition: 'all 0.16s ease',
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  onClick={() => {
                    const raw = /^\+?\d[\d\s\-]{6,}$/.test(driver.username)
                      ? driver.username
                      : driver.phoneNumber;
                    const phone = raw.replace(/\D/g, '');
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                    color: '#000',
                    width: 40,
                    height: 40,
                    '&:hover': { transform: 'scale(1.08)' },
                    transition: 'all 0.16s ease',
                  }}
                >
                  <MessageIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>

            {/* In-progress banner */}
            <AnimatePresence mode="wait">
              {rideStatus === 'passenger_onboard' && (
                <motion.div key="in-progress" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,140,0,0.08) 100%)',
                      border: '1px solid rgba(255,193,7,0.25)',
                      mb: 2,
                      flexShrink: 0,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                      <SpeedIcon sx={{ color: '#FF8C00', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Trip in Progress</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta ? 1.5 : 0 }}>
                      Sit back and relax. You'll arrive soon!
                    </Typography>
                    {eta && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>Estimated Arrival</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#FF8C00' }}>{formatETA(eta)}</Typography>
                        </Box>
                        <LinearProgress
                          variant="indeterminate"
                          sx={{
                            borderRadius: 2,
                            height: 5,
                            bgcolor: 'rgba(255,193,7,0.15)',
                            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #FFC107, #FF8C00)' },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vehicle card */}
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                mb: 2,
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CarIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.disabled' }}>
                  Vehicle
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Plate</Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: 1,
                      fontFamily: 'monospace',
                      background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {vehicle?.numberPlate || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Model</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{vehicle?.make} {vehicle?.model}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>
                    Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box
                      sx={{
                        width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                        bgcolor: getColorByKey(vehicle?.color)?.body,
                        border: '1.5px solid',
                        borderColor: getColorByKey(vehicle?.color)?.outline,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {getColorByKey(vehicle?.color)?.label ?? vehicle?.color}
                    </Typography>
                  </Box>
                </Box>
                {driverLocation?.speed && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Speed</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{Math.round(driverLocation.speed)} km/h</Typography>
                  </Box>
                )}
              </Box>

              {/* Van colour preview */}
              {vehicle?.color && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <VanIconSmall colorKey={vehicle.color} size={140} />
                </Box>
              )}
            </Box>

            {/* Route */}
            <Box sx={{ mb: 2, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                  <NavigationIcon sx={{ color: 'success.main', fontSize: 18 }} />
                  <Box sx={{ flex: 1, width: 2, minHeight: 24, background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 3px, transparent 3px, transparent 6px)', my: 0.5 }} />
                  <PlaceIcon sx={{ color: 'error.main', fontSize: 18 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>Pickup</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3, mt: 0.2 }}>{currentRide?.pickupLocation?.address}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>Destination</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3, mt: 0.2 }}>{currentRide?.dropoffLocation?.address}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ mt: 'auto', flexShrink: 0 }}>
              <AnimatePresence mode="wait">
                {rideStatus === 'arrived' && (
                  <motion.div key="confirm-pickup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Your driver has arrived! Confirm once you're in the vehicle.
                      </Typography>
                    </Alert>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleConfirmPickup}
                      disabled={loading}
                      sx={{
                        height: 56,
                        fontWeight: 800,
                        fontSize: '1rem',
                        borderRadius: 3.5,
                        mb: 1,
                        background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                        boxShadow: '0 6px 20px rgba(76,175,80,0.4)',
                        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(76,175,80,0.5)' },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : "✓ I'm in the car — Start Trip"}
                    </Button>
                  </motion.div>
                )}
                {rideStatus === 'awaiting_payment' && (
                  <motion.div key="awaiting-payment" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      size="large"
                      onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)}
                      sx={{ height: 56, fontWeight: 800, borderRadius: 3.5, mb: 1 }}
                    >
                      💳 Pay Now
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {rideStatus !== 'passenger_onboard' && rideStatus !== 'awaiting_payment' && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={canceling}
                  sx={{
                    height: 48,
                    fontWeight: 700,
                    borderRadius: 3.5,
                    borderWidth: 1.5,
                    '&:hover': { borderWidth: 1.5 },
                  }}
                >
                  Cancel Ride
                </Button>
              )}
            </Box>
          </Box>
        </SwipeableBottomSheet>

        {/* Cancel Dialog */}
        <Dialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          PaperProps={{ sx: { borderRadius: 4, maxWidth: 400, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Cancel Ride?
            <IconButton onClick={() => setShowCancelDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>A cancellation fee may apply.</Alert>
            <Typography variant="body2" color="text.secondary">Are you sure you want to cancel this ride?</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}>Keep Ride</Button>
            <Button onClick={handleCancelRide} variant="contained" color="error" disabled={canceling} sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}>
              {canceling ? <CircularProgress size={20} /> : 'Yes, Cancel'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ClientOnly>
  );
}