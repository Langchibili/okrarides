// // rider/app/(main)/tracking/page.jsx
// 'use client';

// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import {
//   Box, Typography, Button, Avatar, IconButton, Chip, Paper,
//   Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle,
//   DialogContent, DialogActions, LinearProgress,
// } from '@mui/material';
// import {
//   Phone as PhoneIcon, Message as MessageIcon, Close as CloseIcon,
//   Star as StarIcon, Navigation as NavigationIcon, Place as PlaceIcon,
//   MyLocation as MyLocationIcon, DirectionsCar as CarIcon, Speed as SpeedIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useRide } from '@/lib/hooks/useRide';
// import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
// import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
// import ClientOnly from '@/components/ClientOnly';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// const RIDE_STATUS_CONFIG = {
//   accepted:          { title: 'Driver is on the way',    color: 'info',    icon: '🚗', description: 'Your driver is heading to your pickup location' },
//   arrived:           { title: 'Driver has arrived',      color: 'success', icon: '📍', description: 'Your driver is waiting at the pickup location' },
//   passenger_onboard: { title: 'Trip in progress',        color: 'primary', icon: '🎯', description: 'Taking you to your destination' },
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const deg2rad = (deg) => deg * (Math.PI / 180);

// /**
//  * Haversine distance in km.
//  *
//  * BUG that was here (operator precedence):
//  *   deg2rad(point2.latitude || point2.lat - point1.latitude || point1.lat)
//  * JS evaluates `-` before `||`, so this was:
//  *   deg2rad(point2.latitude || (point2.lat - point1.latitude) || point1.lat)
//  * which gives a completely wrong dLat/dLon. Fixed below.
//  */
// const calculateDistance = (point1, point2) => {
//   if (!point1 || !point2) return 0;

//   const lat1 = point1.latitude  ?? point1.lat ?? 0;
//   const lat2 = point2.latitude  ?? point2.lat ?? 0;
//   const lng1 = point1.longitude ?? point1.lng ?? 0;
//   const lng2 = point2.longitude ?? point2.lng ?? 0;

//   const R    = 6371;
//   const dLat = deg2rad(lat2 - lat1);   // ✅ subtraction BEFORE deg2rad
//   const dLon = deg2rad(lng2 - lng1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// const estimateDuration = (distanceKm) => Math.ceil((distanceKm / 30) * 60);

// const formatETA = (minutes) => {
//   if (!minutes && minutes !== 0) return 'Calculating...';
//   if (minutes < 60) return `${minutes} min`;
//   const h = Math.floor(minutes / 60), m = minutes % 60;
//   return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
// };
// // ─────────────────────────────────────────────────────────────────────────────

// export default function TrackingPage() {
//   const router       = useRouter();
//   const searchParams = useSearchParams();
//   const rideId       = searchParams.get('rideId');

//   const { activeRide, ride, confirmPickup, cancelRide, startTracking, stopTracking, loading } = useRide();

//   // Subscribe to RN bridge for driver location so we can push it to the map
//   // ref immediately — without waiting for a React re-render cycle.
//   const { on: rnOn } = useReactNative();

//   const [driverLocation,   setDriverLocation]   = useState(null);
//   const [eta,              setEta]              = useState(null);
//   const [distance,         setDistance]         = useState(null);
//   const [showCancelDialog, setShowCancelDialog] = useState(false);
//   const [canceling,        setCanceling]        = useState(false);
//   const [snackbar,         setSnackbar]         = useState({ open: false, message: '', severity: 'info' });
//   const [trackingStarted,  setTrackingStarted]  = useState(false);

//   const mapControlsRef = useRef(null);

//   const currentRide  = activeRide || ride;
//   const rideStatus   = currentRide?.rideStatus;
//   const driver       = currentRide?.driver;
//   const vehicle      = currentRide?.vehicle;
//   const statusConfig = RIDE_STATUS_CONFIG[rideStatus] || RIDE_STATUS_CONFIG.accepted;

//   // ─── RN bridge: driver location → map ref (bypasses React render cycle) ────
//   useEffect(() => {
//     const unsub = rnOn('DRIVER_LOCATION_UPDATED', (payload) => {
//       const raw = payload.location ?? payload;
//       if (!raw) return;

//       const loc = {
//         lat:      raw.lat      ?? raw.latitude,
//         lng:      raw.lng      ?? raw.longitude,
//         accuracy: raw.accuracy,
//         heading:  raw.heading,
//         speed:    raw.speed,
//       };
//       if (loc.lat == null) return;

//       setDriverLocation(loc);
//       mapControlsRef.current?.updateDriverLocation(loc);

//       if (payload.eta      != null) setEta(payload.eta);
//       if (payload.distance != null) setDistance(payload.distance);
//     });
//     return () => unsub?.();
//   }, [rnOn]);
//   // ─────────────────────────────────────────────────────────────────────────────

//   // ─── API-polling tracking (fallback / supplements RN bridge) ────────────────
//   useEffect(() => {
//     if (!rideId || !currentRide || trackingStarted) return;

//     const handleTrackingUpdate = (trackData) => {
//       if (trackData.driverLocation) {
//         setDriverLocation(trackData.driverLocation);
//         mapControlsRef.current?.updateDriverLocation(trackData.driverLocation);
//       }
//       if (trackData.estimatedDuration !== undefined) {
//         setEta(trackData.estimatedDuration);
//       } else if (trackData.pickupLocation && trackData.dropoffLocation) {
//         setEta(estimateDuration(calculateDistance(trackData.pickupLocation, trackData.dropoffLocation)));
//       }
//       if (trackData.estimatedDistance !== undefined) {
//         setDistance(trackData.estimatedDistance);
//       } else if (trackData.pickupLocation && trackData.dropoffLocation) {
//         setDistance(calculateDistance(trackData.pickupLocation, trackData.dropoffLocation));
//       }
//     };

//     const cleanup = startTracking(rideId, handleTrackingUpdate);
//     setTrackingStarted(true);
//     return () => { if (cleanup) cleanup(); stopTracking(); };
//   }, [rideId, currentRide, startTracking, stopTracking, trackingStarted]);

//   // ─── Sync from activeRide state changes ──────────────────────────────────────
//   useEffect(() => {
//     if (!currentRide) return;
//     if (currentRide.currentDriverLocation) setDriverLocation(currentRide.currentDriverLocation);
//     if (currentRide.estimatedDuration !== undefined) {
//       setEta(currentRide.estimatedDuration);
//     } else if (currentRide.pickupLocation && currentRide.dropoffLocation) {
//       setEta(estimateDuration(calculateDistance(currentRide.pickupLocation, currentRide.dropoffLocation)));
//     }
//     if (currentRide.estimatedDistance !== undefined) {
//       setDistance(currentRide.estimatedDistance);
//     } else if (currentRide.pickupLocation && currentRide.dropoffLocation) {
//       setDistance(calculateDistance(currentRide.pickupLocation, currentRide.dropoffLocation));
//     }
//   }, [currentRide]);

//   // ─── Handle status transitions ───────────────────────────────────────────────
//   useEffect(() => {
//     if (!currentRide) return;
//     if (currentRide.rideStatus === 'completed') {
//       stopTracking();
//       router.push(`/trip-summary?rideId=${currentRide.id}`);
//     } else if (currentRide.rideStatus === 'cancelled') {
//       stopTracking();
//       setSnackbar({ open: true, message: 'Ride was cancelled', severity: 'warning' });
//       setTimeout(() => router.push('/'), 2000);
//     } else if (currentRide.rideStatus === 'arrived') {
//       setSnackbar({ open: true, message: 'Your driver has arrived!', severity: 'success' });
//     }
//   }, [currentRide?.rideStatus, router, stopTracking]);

//   // ─── Confirm Pickup ──────────────────────────────────────────────────────────
//   const handleConfirmPickup = async () => {
//     if (!rideId) return;
//     try {
//       const result = await confirmPickup(rideId);
//       setSnackbar({ open: true, message: result.success ? 'Trip started! On your way to destination.' : (result.error || 'Failed to confirm pickup'), severity: result.success ? 'success' : 'error' });
//     } catch {
//       setSnackbar({ open: true, message: 'An error occurred. Please try again.', severity: 'error' });
//     }
//   };

//   // ─── Cancel Ride ─────────────────────────────────────────────────────────────
//   const handleCancelRide = async () => {
//     if (!rideId) return;
//     setCanceling(true);
//     try {
//       const result = await cancelRide(rideId, 'CHANGE_OF_PLANS', 'Cancelled during trip');
//       if (result.success) {
//         setSnackbar({ open: true, message: 'Ride cancelled successfully', severity: 'info' });
//         setTimeout(() => router.push('/'), 1500);
//       } else {
//         setSnackbar({ open: true, message: result.error || 'Failed to cancel ride', severity: 'error' });
//       }
//     } catch {
//       setSnackbar({ open: true, message: 'An error occurred while cancelling', severity: 'error' });
//     } finally { setCanceling(false); setShowCancelDialog(false); }
//   };

//   const handleCallDriver    = () => { if (driver?.phoneNumber) window.location.href = `tel:${driver.phoneNumber}`; };
//   const handleMessageDriver = () => { if (driver?.phoneNumber) window.location.href = `sms:${driver.phoneNumber}`; };

//   // ─── Map Markers ─────────────────────────────────────────────────────────────
//   const markers = [];
//   if (driverLocation) markers.push({ id: 'driver',  position: driverLocation,               type: 'driver',  icon: '🚗', animation: 'BOUNCE' });
//   if (currentRide?.pickupLocation)  markers.push({ id: 'pickup',  position: currentRide.pickupLocation,  type: 'pickup',  icon: '📍' });
//   if (currentRide?.dropoffLocation && rideStatus === 'passenger_onboard')
//     markers.push({ id: 'dropoff', position: currentRide.dropoffLocation, type: 'dropoff', icon: '🎯' });

//   // ─── Loading / Not Found ─────────────────────────────────────────────────────
//   if (!currentRide && loading)
//     return <Box sx={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}><CircularProgress size={48} /><Typography sx={{ mt:2, color:'text.secondary' }}>Loading ride details...</Typography></Box>;

//   if (!currentRide && !loading)
//     return <Box sx={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', p:3 }}><Typography variant="h6" sx={{ mb:2 }}>No active ride found</Typography><Button variant="contained" onClick={() => router.push('/')}>Go to Home</Button></Box>;

//   return (
//     <ClientOnly>
//       <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

//         {/* Map */}
//         <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
//           <GoogleMapIframe
//             center={driverLocation || currentRide?.pickupLocation || { lat: -15.4167, lng: 28.2833 }}
//             zoom={15}
//             markers={markers}
//             pickupLocation={currentRide?.pickupLocation}
//             dropoffLocation={rideStatus === 'passenger_onboard' ? currentRide?.dropoffLocation : null}
//             showRoute={rideStatus === 'passenger_onboard'}
//             onMapLoad={(controls) => { mapControlsRef.current = controls; }}
//           />
//         </Box>

//         {/* Status Bar */}
//         <Box sx={{ position:'absolute', top:0, left:0, right:0, zIndex:10, bgcolor:`${statusConfig.color}.main`, color:'white', py:1.5, px:2, display:'flex', alignItems:'center', gap:1, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
//           <Typography sx={{ fontSize: '1.5rem' }}>{statusConfig.icon}</Typography>
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="body2" sx={{ fontWeight: 700, opacity: 0.9 }}>{statusConfig.title}</Typography>
//             <Typography variant="caption" sx={{ opacity: 0.8 }}>{statusConfig.description}</Typography>
//           </Box>
//           <IconButton size="small" onClick={() => router.push('/')} sx={{ color: 'white' }}><CloseIcon /></IconButton>
//         </Box>

//         {/* ETA Card */}
//         {rideStatus === 'accepted' && (
//           <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
//             style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9 }}>
//             <Paper elevation={4} sx={{ px: 3, py: 1.5, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="caption" color="text.secondary" fontWeight={600}>ETA</Typography>
//                 <Typography variant="h6" fontWeight={700} color="primary">{eta ? formatETA(eta) : 'Calculating...'}</Typography>
//               </Box>
//               <Divider orientation="vertical" flexItem />
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="caption" color="text.secondary" fontWeight={600}>DISTANCE</Typography>
//                 <Typography variant="h6" fontWeight={700}>{distance ? `${distance.toFixed(1)} km` : '--'}</Typography>
//               </Box>
//             </Paper>
//           </motion.div>
//         )}

//         {/* Centre-on-driver button */}
//         {driverLocation && (
//           <IconButton onClick={() => mapControlsRef.current?.animateToLocation(driverLocation, 16)}
//             sx={{ position:'absolute', right:16, top:80, zIndex:5, bgcolor:'background.paper', boxShadow:2, '&:hover':{ boxShadow:4 } }}>
//             <MyLocationIcon color="primary" />
//           </IconButton>
//         )}

//         {/* Bottom Sheet */}
//         <SwipeableBottomSheet open initialHeight={rideStatus === 'arrived' ? 500 : 420} maxHeight={700} minHeight={200}>
//           <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>

//             {/* Driver Header */}
//             <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexShrink: 0 }}>
//               <Avatar src={driver?.profilePicture} sx={{ width:64, height:64, mr:2, border:'3px solid', borderColor:'primary.main' }}>
//                 {driver?.firstName?.[0]}
//               </Avatar>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{driver?.firstName} {driver?.lastName}</Typography>
//                 <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
//                   <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
//                     <StarIcon sx={{ fontSize:18, color:'warning.main' }} />
//                     <Typography variant="body2" fontWeight={600}>{driver?.driverProfile?.averageRating || 4.8}</Typography>
//                   </Box>
//                   <Typography variant="caption" color="text.secondary">• {driver?.driverProfile?.completedRides || 0} trips</Typography>
//                 </Box>
//                 <Chip size="small"
//                   label={rideStatus === 'arrived' ? 'Arrived' : rideStatus === 'passenger_onboard' ? 'In Transit' : 'On the way'}
//                   color={rideStatus === 'arrived' ? 'success' : 'primary'} sx={{ fontWeight: 600 }} />
//               </Box>
//               <Box sx={{ display: 'flex', gap: 1 }}>
//                 <IconButton onClick={handleCallDriver}    sx={{ bgcolor:'success.light', color:'success.dark', '&:hover':{ bgcolor:'success.main', color:'white' } }}><PhoneIcon /></IconButton>
//                 <IconButton onClick={handleMessageDriver} sx={{ bgcolor:'primary.light', color:'primary.dark', '&:hover':{ bgcolor:'primary.main', color:'white' } }}><MessageIcon /></IconButton>
//               </Box>
//             </Box>

//             {/* Vehicle Info */}
//             <Paper sx={{ p:2, borderRadius:3, bgcolor:'action.hover', mb:2, flexShrink:0 }}>
//               <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.5 }}>
//                 <CarIcon sx={{ color: 'text.secondary' }} />
//                 <Typography variant="subtitle2" fontWeight={700}>Vehicle Details</Typography>
//               </Box>
//               <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
//                 <Box><Typography variant="caption" color="text.secondary">Plate Number</Typography><Typography variant="body1" fontWeight={600}>{vehicle?.numberPlate || 'N/A'}</Typography></Box>
//                 <Box><Typography variant="caption" color="text.secondary">Model</Typography><Typography variant="body1" fontWeight={600}>{vehicle?.make} {vehicle?.model}</Typography></Box>
//                 <Box><Typography variant="caption" color="text.secondary">Color</Typography><Typography variant="body1" fontWeight={600}>{vehicle?.color}</Typography></Box>
//                 {driverLocation?.speed && <Box><Typography variant="caption" color="text.secondary">Speed</Typography><Typography variant="body1" fontWeight={600}>{Math.round(driverLocation.speed)} km/h</Typography></Box>}
//               </Box>
//             </Paper>

//             {/* Trip Info */}
//             <Box sx={{ mb: 2, flexShrink: 0 }}>
//               <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.5 }}>
//                 <NavigationIcon sx={{ color:'success.main', fontSize:20 }} />
//                 <Typography variant="body2" fontWeight={600} color="text.secondary">PICKUP</Typography>
//               </Box>
//               <Typography variant="body2" sx={{ mb:1, ml:3.5, fontWeight:500 }}>{currentRide?.pickupLocation?.address}</Typography>
//               <Typography variant="body2" sx={{ mb:2, ml:3.5, fontWeight:300 }}><strong>{'> '}</strong>{currentRide?.pickupLocation?.name}</Typography>
//               <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.5 }}>
//                 <PlaceIcon sx={{ color:'error.main', fontSize:20 }} />
//                 <Typography variant="body2" fontWeight={600} color="text.secondary">DESTINATION</Typography>
//               </Box>
//               <Typography variant="body2" sx={{ ml:3.5, fontWeight:500 }}>{currentRide?.dropoffLocation?.address}</Typography>
//               <Typography variant="body2" sx={{ ml:3.5, fontWeight:300 }}><strong>{'> '}</strong>{currentRide?.dropoffLocation?.name}</Typography>
//             </Box>

//             {/* Action Buttons */}
//             <Box sx={{ mt: 'auto', flexShrink: 0 }}>
//               <AnimatePresence mode="wait">
//                 {rideStatus === 'arrived' && (
//                   <motion.div key="confirm-pickup" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}>
//                     <Alert severity="success" sx={{ mb: 2 }}>
//                       <Typography variant="body2" fontWeight={600}>Your driver has arrived! Please confirm once you're in the vehicle.</Typography>
//                     </Alert>
//                     <Button fullWidth variant="contained" size="large" onClick={handleConfirmPickup} disabled={loading}
//                       sx={{ height:56, fontWeight:700, fontSize:'1rem', borderRadius:3, mb:1, bgcolor:'success.main', '&:hover':{ bgcolor:'success.dark' } }}>
//                       {loading ? <CircularProgress size={24} color="inherit" /> : "✓ I'm in the car - Start Trip"}
//                     </Button>
//                   </motion.div>
//                 )}

//                 {rideStatus === 'passenger_onboard' && (
//                   <motion.div key="in-progress" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}>
//                     <Paper sx={{ p:2, borderRadius:3, bgcolor:'primary.light', mb:2, border:'2px solid', borderColor:'primary.main' }}>
//                       <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
//                         <SpeedIcon sx={{ color: 'primary.main' }} />
//                         <Typography variant="subtitle2" fontWeight={700}>Trip in Progress</Typography>
//                       </Box>
//                       <Typography variant="body2" color="text.secondary">Sit back and relax. You'll arrive at your destination soon!</Typography>
//                       {eta && (
//                         <Box sx={{ mt: 2 }}>
//                           <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
//                             <Typography variant="caption" fontWeight={600}>Estimated Arrival</Typography>
//                             <Typography variant="caption" fontWeight={700} color="primary">{formatETA(eta)}</Typography>
//                           </Box>
//                           <LinearProgress variant="indeterminate" sx={{ borderRadius:1, height:6 }} />
//                         </Box>
//                       )}
//                     </Paper>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {rideStatus !== 'passenger_onboard' && (
//                 <Button fullWidth variant="outlined" color="error" onClick={() => setShowCancelDialog(true)} disabled={canceling}
//                   sx={{ height:48, fontWeight:600, borderRadius:3, borderWidth:2, '&:hover':{ borderWidth:2 } }}>
//                   Cancel Ride
//                 </Button>
//               )}
//             </Box>
//           </Box>
//         </SwipeableBottomSheet>

//         {/* Cancel Dialog */}
//         <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} PaperProps={{ sx: { borderRadius:4, maxWidth:400 } }}>
//           <DialogTitle sx={{ fontWeight: 700 }}>
//             Cancel Ride?
//             <IconButton onClick={() => setShowCancelDialog(false)} sx={{ position:'absolute', right:8, top:8 }}><CloseIcon /></IconButton>
//           </DialogTitle>
//           <DialogContent>
//             <Alert severity="warning" sx={{ mb: 2 }}>A cancellation fee may apply if you cancel after the driver has accepted.</Alert>
//             <Typography variant="body2" color="text.secondary">Are you sure you want to cancel this ride?</Typography>
//           </DialogContent>
//           <DialogActions sx={{ p:2.5, pt:1 }}>
//             <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ borderRadius:2, px:3 }}>Keep Ride</Button>
//             <Button onClick={handleCancelRide} variant="contained" color="error" disabled={canceling} sx={{ borderRadius:2, px:3 }}>
//               {canceling ? <CircularProgress size={20} /> : 'Yes, Cancel'}
//             </Button>
//           </DialogActions>
//         </Dialog>

//         {/* Snackbar */}
//         <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
//           <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
//             {snackbar.message}
//           </Alert>
//         </Snackbar>

//       </Box>
//     </ClientOnly>
//   );
// }
'use client';
// PATH: rider/app/(main)/tracking/page.jsx
// ONLY CHANGE vs provided file:
//   • handleStatusTransitions now handles 'awaiting_payment' → redirect to pay page
//   • Existing haversine bug fix preserved

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Avatar, IconButton, Chip, Paper,
  Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress,
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

const RIDE_STATUS_CONFIG = {
  accepted:          { title: 'Driver is on the way',    color: 'info',    icon: '🚗', description: 'Your driver is heading to your pickup location' },
  arrived:           { title: 'Driver has arrived',      color: 'success', icon: '📍', description: 'Your driver is waiting at the pickup location' },
  passenger_onboard: { title: 'Trip in progress',        color: 'primary', icon: '🎯', description: 'Taking you to your destination' },
  awaiting_payment:  { title: 'Payment Required',        color: 'warning', icon: '💳', description: 'Please complete payment for your trip' },
};

// ── Haversine (bug-fixed) ─────────────────────────────────────────────────────
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
  const a = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const estimateDuration = (distanceKm) => Math.ceil((distanceKm / 30) * 60);
const formatETA = (minutes) => {
  if (!minutes && minutes !== 0) return 'Calculating...';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};

export default function TrackingPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rideId       = searchParams.get('rideId');

  const { activeRide, ride, confirmPickup, cancelRide, startTracking, stopTracking, loading } = useRide();
  const { on: rnOn } = useReactNative();

  const [driverLocation,   setDriverLocation]   = useState(null);
  const [eta,              setEta]              = useState(null);
  const [distance,         setDistance]         = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [canceling,        setCanceling]        = useState(false);
  const [snackbar,         setSnackbar]         = useState({ open: false, message: '', severity: 'info' });
  const [trackingStarted,  setTrackingStarted]  = useState(false);

  const mapControlsRef = useRef(null);

  const currentRide  = activeRide || ride;
  const rideStatus   = currentRide?.rideStatus;
  const driver       = currentRide?.driver;
  const vehicle      = currentRide?.vehicle;
  const statusConfig = RIDE_STATUS_CONFIG[rideStatus] || RIDE_STATUS_CONFIG.accepted;

  // ── RN bridge: driver location → map ─────────────────────────────────────
  useEffect(() => {
    const unsub = rnOn('DRIVER_LOCATION_UPDATED', (payload) => {
      const raw = payload.location ?? payload;
      if (!raw) return;
      const loc = { lat: raw.lat ?? raw.latitude, lng: raw.lng ?? raw.longitude, accuracy: raw.accuracy, heading: raw.heading, speed: raw.speed };
      if (loc.lat == null) return;
      setDriverLocation(loc);
      mapControlsRef.current?.updateDriverLocation(loc);
      if (payload.eta      != null) setEta(payload.eta);
      if (payload.distance != null) setDistance(payload.distance);
    });
    return () => unsub?.();
  }, [rnOn]);

  // ── API-polling tracking fallback ─────────────────────────────────────────
  useEffect(() => {
    if (!rideId || !currentRide || trackingStarted) return;
    const handleUpdate = (trackData) => {
      if (trackData.driverLocation) { setDriverLocation(trackData.driverLocation); mapControlsRef.current?.updateDriverLocation(trackData.driverLocation); }
      if (trackData.estimatedDuration !== undefined) setEta(trackData.estimatedDuration);
      else if (trackData.pickupLocation && trackData.dropoffLocation) setEta(estimateDuration(calculateDistance(trackData.pickupLocation, trackData.dropoffLocation)));
      if (trackData.estimatedDistance !== undefined) setDistance(trackData.estimatedDistance);
      else if (trackData.pickupLocation && trackData.dropoffLocation) setDistance(calculateDistance(trackData.pickupLocation, trackData.dropoffLocation));
    };
    const cleanup = startTracking(rideId, handleUpdate);
    setTrackingStarted(true);
    return () => { if (cleanup) cleanup(); stopTracking(); };
  }, [rideId, currentRide, startTracking, stopTracking, trackingStarted]);

  // ── Sync from activeRide state ────────────────────────────────────────────
  useEffect(() => {
    if (!currentRide) return;
    if (currentRide.currentDriverLocation) setDriverLocation(currentRide.currentDriverLocation);
    if (currentRide.estimatedDuration !== undefined) setEta(currentRide.estimatedDuration);
    else if (currentRide.pickupLocation && currentRide.dropoffLocation) setEta(estimateDuration(calculateDistance(currentRide.pickupLocation, currentRide.dropoffLocation)));
    if (currentRide.estimatedDistance !== undefined) setDistance(currentRide.estimatedDistance);
    else if (currentRide.pickupLocation && currentRide.dropoffLocation) setDistance(calculateDistance(currentRide.pickupLocation, currentRide.dropoffLocation));
  }, [currentRide]);

  // ── STATUS TRANSITIONS (including awaiting_payment) ───────────────────────
  useEffect(() => {
    if (!currentRide) return;
    const id = currentRide.id ?? rideId;

    if (currentRide.rideStatus === 'awaiting_payment') {
      // Redirect to pay page if not already there
      if (!window.location.pathname.includes(`/trips/${id}/pay`)) {
        setSnackbar({ open: true, message: 'Payment required. Redirecting…', severity: 'warning' });
        setTimeout(() => router.push(`/trips/${id}/pay`), 1200);
      }
      return;
    }

    if (currentRide.rideStatus === 'completed') {
      stopTracking();
      router.push(`/trip-summary?rideId=${id}`);
    } else if (currentRide.rideStatus === 'cancelled') {
      stopTracking();
      setSnackbar({ open: true, message: 'Ride was cancelled', severity: 'warning' });
      setTimeout(() => router.push('/'), 2000);
    } else if (currentRide.rideStatus === 'arrived') {
      setSnackbar({ open: true, message: 'Your driver has arrived!', severity: 'success' });
    }
  }, [currentRide?.rideStatus, router, stopTracking, rideId]);

  // ── Confirm Pickup ────────────────────────────────────────────────────────
  const handleConfirmPickup = async () => {
    if (!rideId) return;
    try {
      const result = await confirmPickup(rideId);
      setSnackbar({ open: true, message: result.success ? 'Trip started!' : (result.error || 'Failed'), severity: result.success ? 'success' : 'error' });
    } catch { setSnackbar({ open: true, message: 'An error occurred.', severity: 'error' }); }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
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

  const handleCallDriver    = () => driver?.phoneNumber && (window.location.href = `tel:${driver.phoneNumber}`);
  const handleMessageDriver = () => driver?.phoneNumber && (window.location.href = `sms:${driver.phoneNumber}`);

  const markers = [];
  if (driverLocation) markers.push({ id:'driver',  position:driverLocation,              type:'driver',  icon:'🚗', animation:'BOUNCE' });
  if (currentRide?.pickupLocation)  markers.push({ id:'pickup',  position:currentRide.pickupLocation,  type:'pickup',  icon:'📍' });
  if (currentRide?.dropoffLocation && rideStatus === 'passenger_onboard') markers.push({ id:'dropoff', position:currentRide.dropoffLocation, type:'dropoff', icon:'🎯' });

  if (!currentRide && loading) return <Box sx={{ height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column' }}><CircularProgress size={48} /><Typography sx={{ mt:2,color:'text.secondary' }}>Loading ride details...</Typography></Box>;
  if (!currentRide && !loading) return <Box sx={{ height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',p:3 }}><Typography variant="h6" sx={{ mb:2 }}>No active ride found</Typography><Button variant="contained" onClick={() => router.push('/')}>Go to Home</Button></Box>;

  return (
    <ClientOnly>
      <Box sx={{ height:'100vh', width:'100%', position:'relative', overflow:'hidden' }}>

        {/* Map */}
        <Box sx={{ position:'absolute', inset:0, zIndex:1 }}>
          <MapIframe center={driverLocation || currentRide?.pickupLocation || { lat:-15.4167, lng:28.2833 }} zoom={15}
            markers={markers} pickupLocation={currentRide?.pickupLocation}
            dropoffLocation={rideStatus === 'passenger_onboard' ? currentRide?.dropoffLocation : null}
            showRoute={rideStatus === 'passenger_onboard'}
            onMapLoad={(c) => { mapControlsRef.current = c; }} />
        </Box>

        {/* Status Bar */}
        <Box sx={{ position:'absolute',top:0,left:0,right:0,zIndex:10,bgcolor:`${statusConfig.color}.main`,color:'white',py:1.5,px:2,display:'flex',alignItems:'center',gap:1,boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
          <Typography sx={{ fontSize:'1.5rem' }}>{statusConfig.icon}</Typography>
          <Box sx={{ flex:1 }}>
            <Typography variant="body2" sx={{ fontWeight:700,opacity:0.9 }}>{statusConfig.title}</Typography>
            <Typography variant="caption" sx={{ opacity:0.8 }}>{statusConfig.description}</Typography>
          </Box>
          <IconButton size="small" onClick={() => router.push('/')} sx={{ color:'white' }}><CloseIcon /></IconButton>
        </Box>

        {/* ETA Card */}
        {rideStatus === 'accepted' && (
          <motion.div initial={{ y:-100,opacity:0 }} animate={{ y:0,opacity:1 }} style={{ position:'absolute',top:70,left:'50%',transform:'translateX(-50%)',zIndex:9 }}>
            <Paper elevation={4} sx={{ px:3,py:1.5,borderRadius:10,display:'flex',alignItems:'center',gap:2 }}>
              <Box sx={{ textAlign:'center' }}><Typography variant="caption" color="text.secondary" fontWeight={600}>ETA</Typography><Typography variant="h6" fontWeight={700} color="primary">{eta ? formatETA(eta) : 'Calculating...'}</Typography></Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign:'center' }}><Typography variant="caption" color="text.secondary" fontWeight={600}>DISTANCE</Typography><Typography variant="h6" fontWeight={700}>{distance ? `${distance.toFixed(1)} km` : '--'}</Typography></Box>
            </Paper>
          </motion.div>
        )}

        {/* Payment Required Banner */}
        {rideStatus === 'awaiting_payment' && (
          <motion.div initial={{ y:-100,opacity:0 }} animate={{ y:0,opacity:1 }} style={{ position:'absolute',top:70,left:16,right:16,zIndex:9 }}>
            <Alert severity="warning" sx={{ borderRadius:3, fontWeight:600, boxShadow:4 }}
              action={<Button size="small" variant="contained" color="warning" onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)}>Pay Now</Button>}>
              Payment required — please pay the driver
            </Alert>
          </motion.div>
        )}

        {/* Centre-on-driver button */}
        {driverLocation && (
          <IconButton onClick={() => mapControlsRef.current?.animateToLocation(driverLocation, 16)}
            sx={{ position:'absolute',right:16,top:80,zIndex:5,bgcolor:'background.paper',boxShadow:2,'&:hover':{ boxShadow:4 } }}>
            <MyLocationIcon color="primary" />
          </IconButton>
        )}

        {/* Bottom Sheet */}
        <SwipeableBottomSheet open initialHeight={rideStatus === 'arrived' ? 500 : 420} maxHeight={700} minHeight={200}>
          <Box sx={{ p:3,height:'100%',display:'flex',flexDirection:'column' }}>

            {/* Driver Header */}
            <Box sx={{ display:'flex',alignItems:'center',mb:3,flexShrink:0 }}>
              <Avatar src={driver?.profilePicture} sx={{ width:64,height:64,mr:2,border:'3px solid',borderColor:'primary.main' }}>{driver?.firstName?.[0]}</Avatar>
              <Box sx={{ flex:1 }}>
                <Typography variant="h6" sx={{ fontWeight:700,mb:0.5 }}>{driver?.firstName} {driver?.lastName}</Typography>
                <Box sx={{ display:'flex',alignItems:'center',gap:1,mb:0.5 }}>
                  <StarIcon sx={{ fontSize:18,color:'warning.main' }} />
                  <Typography variant="body2" fontWeight={600}>{driver?.driverProfile?.averageRating || 4.8}</Typography>
                  <Typography variant="caption" color="text.secondary">• {driver?.driverProfile?.completedRides || 0} trips</Typography>
                </Box>
                <Chip size="small"
                  label={rideStatus === 'awaiting_payment' ? 'Payment Required' : rideStatus === 'arrived' ? 'Arrived' : rideStatus === 'passenger_onboard' ? 'In Transit' : 'On the way'}
                  color={rideStatus === 'awaiting_payment' ? 'warning' : rideStatus === 'arrived' ? 'success' : 'primary'}
                  sx={{ fontWeight:600 }} />
              </Box>
              <Box sx={{ display:'flex',gap:1 }}>
                <IconButton onClick={handleCallDriver}    sx={{ bgcolor:'success.light',color:'success.dark' }}><PhoneIcon /></IconButton>
                <IconButton onClick={handleMessageDriver} sx={{ bgcolor:'primary.light',color:'primary.dark' }}><MessageIcon /></IconButton>
              </Box>
            </Box>
            <AnimatePresence mode="wait">
                {rideStatus === 'passenger_onboard' && (
                  <motion.div key="in-progress" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}>
                    <Paper sx={{ p:2, borderRadius:3, bgcolor:'primary.light', mb:2, border:'2px solid', borderColor:'primary.main' }}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
                        <SpeedIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="subtitle2" fontWeight={700}>Trip in Progress</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Sit back and relax. You'll arrive at your destination soon!</Typography>
                      {eta && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                            <Typography variant="caption" fontWeight={600}>Estimated Arrival</Typography>
                            <Typography variant="caption" fontWeight={700} color="primary">{formatETA(eta)}</Typography>
                          </Box>
                          <LinearProgress variant="indeterminate" sx={{ borderRadius:1, height:6 }} />
                        </Box>
                      )}
                    </Paper>
                  </motion.div>
                )}
                </AnimatePresence>
            {/* Vehicle */}
            <Paper sx={{ p:2,borderRadius:3,bgcolor:'action.hover',mb:2,flexShrink:0 }}>
              <Box sx={{ display:'flex',alignItems:'center',gap:1,mb:1.5 }}><CarIcon sx={{ color:'text.secondary' }} /><Typography variant="subtitle2" fontWeight={700}>Vehicle</Typography></Box>
              <Box sx={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:2 }}>
                <Box><Typography variant="caption" color="text.secondary">Plate</Typography><Typography variant="body1" fontWeight={600}>{vehicle?.numberPlate || 'N/A'}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Model</Typography><Typography variant="body1" fontWeight={600}>{vehicle?.make} {vehicle?.model}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Color</Typography><Typography variant="body1" fontWeight={600}>{vehicle?.color}</Typography></Box>
                {driverLocation?.speed && <Box><Typography variant="caption" color="text.secondary">Speed</Typography><Typography variant="body1" fontWeight={600}>{Math.round(driverLocation.speed)} km/h</Typography></Box>}
              </Box>
            </Paper>

            {/* Route */}
            <Box sx={{ mb:2,flexShrink:0 }}>
              <Box sx={{ display:'flex',alignItems:'center',gap:1,mb:1.5 }}><NavigationIcon sx={{ color:'success.main',fontSize:20 }} /><Typography variant="body2" fontWeight={600} color="text.secondary">PICKUP</Typography></Box>
              <Typography variant="body2" sx={{ mb:1,ml:3.5,fontWeight:500 }}>{currentRide?.pickupLocation?.address}</Typography>
              <Box sx={{ display:'flex',alignItems:'center',gap:1,mb:1.5 }}><PlaceIcon sx={{ color:'error.main',fontSize:20 }} /><Typography variant="body2" fontWeight={600} color="text.secondary">DESTINATION</Typography></Box>
              <Typography variant="body2" sx={{ ml:3.5,fontWeight:500 }}>{currentRide?.dropoffLocation?.address}</Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ mt:'auto',flexShrink:0 }}>
              <AnimatePresence mode="wait">
                {rideStatus === 'arrived' && (
                  <motion.div key="confirm-pickup" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }}>
                    <Alert severity="success" sx={{ mb:2 }}><Typography variant="body2" fontWeight={600}>Your driver has arrived! Confirm once you're in the vehicle.</Typography></Alert>
                    <Button fullWidth variant="contained" size="large" onClick={handleConfirmPickup} disabled={loading}
                      sx={{ height:56,fontWeight:700,fontSize:'1rem',borderRadius:3,mb:1,bgcolor:'success.main','&:hover':{ bgcolor:'success.dark' } }}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : "✓ I'm in the car - Start Trip"}
                    </Button>
                  </motion.div>
                )}
                {rideStatus === 'awaiting_payment' && (
                  <motion.div key="awaiting-payment" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
                    <Button fullWidth variant="contained" color="warning" size="large"
                      onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)}
                      sx={{ height:56,fontWeight:700,borderRadius:3,mb:1 }}>
                      💳 Pay Now
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {rideStatus !== 'passenger_onboard' && rideStatus !== 'awaiting_payment' && (
                <Button fullWidth variant="outlined" color="error" onClick={() => setShowCancelDialog(true)} disabled={canceling}
                  sx={{ height:48,fontWeight:600,borderRadius:3,borderWidth:2,'&:hover':{ borderWidth:2 } }}>
                  Cancel Ride
                </Button>
              )}
            </Box>
          </Box>
        </SwipeableBottomSheet>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} PaperProps={{ sx:{ borderRadius:4,maxWidth:400 } }}>
          <DialogTitle sx={{ fontWeight:700 }}>Cancel Ride?<IconButton onClick={() => setShowCancelDialog(false)} sx={{ position:'absolute',right:8,top:8 }}><CloseIcon /></IconButton></DialogTitle>
          <DialogContent><Alert severity="warning" sx={{ mb:2 }}>A cancellation fee may apply.</Alert><Typography variant="body2" color="text.secondary">Are you sure?</Typography></DialogContent>
          <DialogActions sx={{ p:2.5,pt:1 }}>
            <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ borderRadius:2,px:3 }}>Keep Ride</Button>
            <Button onClick={handleCancelRide} variant="contained" color="error" disabled={canceling} sx={{ borderRadius:2,px:3 }}>{canceling ? <CircularProgress size={20} /> : 'Yes, Cancel'}</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s=>({...s,open:false}))} anchorOrigin={{ vertical:'top',horizontal:'center' }}>
          <Alert onClose={() => setSnackbar(s=>({...s,open:false}))} severity={snackbar.severity} sx={{ width:'100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </ClientOnly>
  );
}