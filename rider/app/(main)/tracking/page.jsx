// 'use client'
// // PATH: rider/app/(main)/tracking/page.js

// import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import {
//   Box, Typography, Button, Avatar, IconButton, Chip, Paper,
//   Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle,
//   DialogContent, DialogActions, LinearProgress, useTheme,
//   FormControl, InputLabel, Select, MenuItem, TextField,
// } from '@mui/material';
// import {
//   Phone as PhoneIcon, Message as MessageIcon, Close as CloseIcon,
//   Star as StarIcon, Navigation as NavigationIcon, Place as PlaceIcon,
//   MyLocation as MyLocationIcon, DirectionsCar as CarIcon, Speed as SpeedIcon,
//   Cancel as CancelIcon, Warning as WarningIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useRide } from '@/lib/hooks/useRide';
// import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
// import ClientOnly from '@/components/ClientOnly';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import MapIframe from '@/components/Map/MapIframeNoSSR';
// import { getImageUrl } from '@/Functions';
// import { VanIconSmall, getColorByKey } from '@/components/ui/VehicleColorPicker';
// import { ridesAPI } from '@/lib/api/rides';
// import BottomMarginDiv from '@/components/BottomMarginDiv';
// import { apiClient } from '@/lib/api/client';

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

// const normalizeCoords = (loc) => {
//   if (!loc) return null;
//   const lat = loc.lat ?? loc.latitude;
//   const lng = loc.lng ?? loc.longitude;
//   if (lat == null || lng == null) return null;
//   return { ...loc, lat, lng };
// };

// const DEFAULT_CANCEL_REASON = 'Change of plans';

// // ── Coord key helper — used to deduplicate route state updates ────────────────
// // Returns a stable string key for a coord object, or null if invalid.
// // Two coords with the same lat/lng produce the same key even if they are
// // different object references, so we can skip redundant setState calls.
// function coordKey(c) {
//   if (!c) return null;
//   return `${c.lat},${c.lng}`;
// }

// export default function TrackingPage() {
//   const router       = useRouter();
//   const searchParams = useSearchParams();
//   const rideId       = searchParams.get('rideId');
//   const theme        = useTheme();
//   const isDark       = theme.palette.mode === 'dark';

//   const {
//     activeRide, ride, confirmPickup, cancelRide,
//     startTracking, stopTracking, loading,
//     loadRideDriverProfilePicUrl,
//   } = useRide();
//   const { on: rnOn, sendToNative } = useReactNative();

//   // ── Stable logging helper ─────────────────────────────────────────────────
//   const log = useCallback((key, data = {}) => {
//     const payload = { key: `tracking-page-${key}`, ts: Date.now(), ...data };
//     try { sendToNative('LOG_DATA', payload); } catch {}
//     console.log(`tracking-page-${key}`, data);
//   }, [sendToNative]);

//   const [driverLocation,  setDriverLocation]  = useState(null);
//   const [eta,             setEta]             = useState(null);
//   const [distance,        setDistance]        = useState(null);
//   const [showCancelDialog,setShowCancelDialog]= useState(false);
//   const [canceling,       setCanceling]       = useState(false);
//   const [snackbar,        setSnackbar]        = useState({ open: false, message: '', severity: 'info' });
//   const [driverProfilePic,setDriverProfilePic]= useState(null);

//   // ── Cancel flow: step-2 state ─────────────────────────────────────────────
//   const [showCancelReasons,    setShowCancelReasons]    = useState(false);
//   const [cancelReasons,        setCancelReasons]        = useState([]);
//   const [cancelReasonsLoading, setCancelReasonsLoading] = useState(false);
//   const [selectedCancelReason, setSelectedCancelReason] = useState('');
//   const [cancelOtherText,      setCancelOtherText]      = useState('');

//   // ── MAP: route state ───────────────────────────────────────────────────────
//   const [routePickup,  setRoutePickup]  = useState(null);
//   const [routeDropoff, setRouteDropoff] = useState(null);
//   const [routeReady,   setRouteReady]   = useState(false);
//   const routeStatusRef  = useRef(null);
//   // ── FIX: track last-set route coords as strings so we can skip
//   //    redundant setState calls when the driver hasn't moved ─────────────────
//   const lastRouteKeyRef = useRef(null);

//   const mapControlsRef = useRef(null);
//   const locPollRef     = useRef(null);
//   const mountedRef     = useRef(true);

//   const currentRide    = activeRide || ride;
//   const rideStatus     = currentRide?.rideStatus;
//   const driver         = currentRide?.driver;
//   const vehicle        = currentRide?.vehicle;
//   const statusConfig   = RIDE_STATUS_CONFIG[rideStatus] || RIDE_STATUS_CONFIG.accepted;
//   const statusGradient = STATUS_GRADIENTS[statusConfig.color] || STATUS_GRADIENTS.info;

//   log('render', {
//     rideId,
//     rideStatus,
//     currentRideId: currentRide?.id,
//     sourceOfRide:  activeRide ? 'activeRide' : 'ride',
//     loading,
//     routeReady,
//     driverLocation: driverLocation ? `${driverLocation.lat},${driverLocation.lng}` : null,
//   });

//   useEffect(() => {
//     mountedRef.current = true;
//     log('mounted', { rideId });
//     return () => {
//       mountedRef.current = false;
//       clearInterval(locPollRef.current);
//       log('unmounted', { rideId });
//     };
//   }, []); // eslint-disable-line

//   // ── MAP: reset route whenever status changes ───────────────────────────────
//   useEffect(() => {
//     log('status-changed-reset-route', {
//       newStatus:    rideStatus,
//       prevRouteRef: routeStatusRef.current,
//       hadRoute:     routeReady,
//     });
//     routeStatusRef.current  = null;
//     lastRouteKeyRef.current = null; // allow fresh route after status change
//     setRouteReady(false);
//     setRoutePickup(null);
//     setRouteDropoff(null);
//   }, [rideStatus]); // eslint-disable-line

//   // ── Direct location polling ────────────────────────────────────────────────
//   useEffect(() => {
//     if (!rideId || !currentRide || ['completed', 'cancelled'].includes(rideStatus)) {
//       log('poll-skipped', { rideId, rideStatus, hasCurrentRide: !!currentRide });
//       return;
//     }

//     log('poll-started', { rideId, rideStatus, intervalMs: 5000 });

//     const poll = async () => {
//       if (!mountedRef.current) return;
//       try {
//         const result = await ridesAPI.trackRide(rideId);

//         log('poll-response', {
//           success:        result.success,
//           backendStatus:  result.data?.ride?.rideStatus,
//           localStatus:    rideStatus,
//           statusMismatch: result.data?.ride?.rideStatus !== rideStatus,
//           hasDriverLoc:   !!result.data?.driver?.currentLocation,
//           trackingEta:    result.data?.tracking?.eta,
//           trackingDist:   result.data?.tracking?.distance,
//         });

//         if (!result.success || !result.data || !mountedRef.current) return;

//         const td     = result.data;
//         const rawLoc = td.driver?.currentLocation;
//         const loc    = normalizeCoords(rawLoc);

//         if (loc) {
//           setDriverLocation(loc);
//           mapControlsRef.current?.updateDriverLocation(loc);

//           if (td.tracking?.eta) {
//             const mins = parseInt(td.tracking.eta);
//             if (!isNaN(mins)) setEta(mins);
//           }
//           if (td.tracking?.distance) {
//             const km = parseFloat(td.tracking.distance);
//             if (!isNaN(km)) setDistance(km);
//           }

//           if (rideStatus === 'accepted') {
//             const pickup = normalizeCoords(td.ride?.pickupLocation ?? currentRide.pickupLocation);
//             if (pickup) {
//               // ── FIX: only call setState when the route endpoints have actually
//               //    changed. Every poll returns a new object even if coords are
//               //    identical, so comparing object refs always says "changed".
//               //    Comparing the coord key string is cheap and correct. ─────────
//               const newKey = `${coordKey(loc)}->${coordKey(pickup)}`;
//               if (newKey !== lastRouteKeyRef.current) {
//                 log('route-set-accepted', {
//                   driverLoc: coordKey(loc),
//                   pickupLoc: coordKey(pickup),
//                   wasKey:    lastRouteKeyRef.current,
//                 });
//                 lastRouteKeyRef.current = newKey;
//                 setRoutePickup(loc);
//                 setRouteDropoff(pickup);
//                 setRouteReady(true);
//               }
//             } else {
//               log('route-accepted-no-pickup', {
//                 tdPickup:      td.ride?.pickupLocation,
//                 currentPickup: currentRide.pickupLocation,
//               });
//             }
//           }

//           if (rideStatus === 'passenger_onboard' && routeStatusRef.current !== 'passenger_onboard') {
//             routeStatusRef.current = 'passenger_onboard';
//             const pickup  = normalizeCoords(td.ride?.pickupLocation  ?? currentRide.pickupLocation);
//             const dropoff = normalizeCoords(td.ride?.dropoffLocation ?? currentRide.dropoffLocation);
//             if (pickup && dropoff) {
//               log('route-set-onboard', {
//                 pickup:  coordKey(pickup),
//                 dropoff: coordKey(dropoff),
//               });
//               lastRouteKeyRef.current = `${coordKey(pickup)}->${coordKey(dropoff)}`;
//               setRoutePickup(pickup);
//               setRouteDropoff(dropoff);
//               setRouteReady(true);
//             } else {
//               log('route-onboard-missing-coords', {
//                 hasPickup:   !!pickup,
//                 hasDropoff:  !!dropoff,
//                 ridePickup:  currentRide.pickupLocation,
//                 rideDropoff: currentRide.dropoffLocation,
//               });
//             }
//           }
//         } else {
//           log('poll-no-driver-location', { rawLoc });
//         }

//         const backendStatus = td.ride?.rideStatus;
//         if (backendStatus === 'completed' || backendStatus === 'cancelled') {
//           log('poll-terminal-status', { backendStatus });
//           clearInterval(locPollRef.current);
//         }

//       } catch (err) {
//         log('poll-error', { message: err?.message, stack: err?.stack?.slice(0, 300) });
//       }
//     };

//     poll();
//     locPollRef.current = setInterval(poll, 5000);
//     return () => {
//       log('poll-cleared', { rideId, rideStatus });
//       clearInterval(locPollRef.current);
//     };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [rideId, rideStatus, currentRide?.driver?.id]);

//   // ── RN live location bridge ────────────────────────────────────────────────
//   useEffect(() => {
//     const unsub = rnOn('DRIVER_LOCATION_UPDATED', (payload) => {
//       const raw = payload.location ?? payload;
//       if (!raw) return;
//       const loc = normalizeCoords({
//         lat: raw.lat ?? raw.latitude, lng: raw.lng ?? raw.longitude,
//         accuracy: raw.accuracy, heading: raw.heading, speed: raw.speed,
//       });
//       if (!loc) return;
//       log('rn-driver-location', { lat: loc.lat, lng: loc.lng, eta: payload.eta, distance: payload.distance });
//       setDriverLocation(loc);
//       mapControlsRef.current?.updateDriverLocation(loc);
//       if (payload.eta      != null) setEta(payload.eta);
//       if (payload.distance != null) setDistance(payload.distance);
//     });
//     return () => unsub?.();
//   }, [rnOn]); // eslint-disable-line

//   // ── startTracking — kept for ride-status syncing ───────────────────────────
//   useEffect(() => {
//     if (!rideId || !currentRide) return;
//     log('start-tracking', { rideId });
//     const cleanup = startTracking(rideId, () => {});
//     return () => {
//       log('stop-tracking', { rideId });
//       if (cleanup) cleanup();
//       stopTracking();
//     };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [rideId]);

//   // ── Seed initial driver location ───────────────────────────────────────────
//   useEffect(() => {
//     if (!currentRide) return;
//     log('seed-initial-data', {
//       currentRideId:            currentRide.id,
//       rideStatus:               currentRide.rideStatus,
//       hasCurrentDriverLocation: !!currentRide.currentDriverLocation,
//       estimatedDuration:        currentRide.estimatedDuration,
//       estimatedDistance:        currentRide.estimatedDistance,
//     });
//     if (currentRide.currentDriverLocation) {
//       const norm = normalizeCoords(currentRide.currentDriverLocation);
//       if (norm) setDriverLocation(norm);
//     }
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
//     const fetchPic = async () => {
//       setDriverProfilePic(await loadRideDriverProfilePicUrl(currentRide?.driver?.id));
//     };
//     fetchPic();
//   }, [currentRide?.id]); // eslint-disable-line

//   // ── Ride-status side-effects ───────────────────────────────────────────────
//   useEffect(() => {
//     if (!currentRide) return;
//     const id           = currentRide.id ?? rideId;
//     const status       = currentRide.rideStatus;
//     const currentPath  = typeof window !== 'undefined' ? window.location.pathname : 'ssr';
//     const alreadyOnPay = typeof window !== 'undefined' && window.location.pathname.includes(`/trips/${id}/pay`);

//     log('status-effect-fired', {
//       status,
//       rideId:       id,
//       currentPath,
//       alreadyOnPay,
//       sourceOfRide: activeRide ? 'activeRide' : 'ride',
//       hookLoading:  loading,
//     });

//     if (status === 'awaiting_payment') {
//       if (!alreadyOnPay) {
//         log('redirect-to-pay', { rideId: id, from: currentPath });
//         setSnackbar({ open: true, message: 'Payment required. Redirecting…', severity: 'warning' });
//         setTimeout(() => router.push(`/trips/${id}/pay`), 1200);
//       } else {
//         log('redirect-to-pay-skipped-already-there', { rideId: id, currentPath });
//       }
//       return;
//     }

//     if (status === 'completed') {
//       log('redirect-trip-summary', { rideId: id, from: currentPath });
//       stopTracking();
//       router.push(`/trip-summary?rideId=${id}`);
//     } else if (status === 'cancelled') {
//       log('redirect-home-cancelled', { rideId: id, from: currentPath });
//       stopTracking();
//       setSnackbar({ open: true, message: 'Ride was cancelled', severity: 'warning' });
//       setTimeout(() => router.push('/'), 2000);
//     } else if (status === 'arrived') {
//       log('driver-arrived-snackbar', { rideId: id });
//       setSnackbar({ open: true, message: '📍 Your driver has arrived!', severity: 'success' });
//     } else {
//       log('status-effect-no-action', { status });
//     }
//   }, [currentRide?.rideStatus, router, stopTracking, rideId]); // eslint-disable-line

//   // ── FIX: stable onMapLoad — inline arrow in JSX is a new ref every render,
//   //    which causes IframeMap's [iframeLoaded, onMapLoad] effect to re-fire on
//   //    every re-render (i.e. every poll tick), calling configureDriverMarker
//   //    repeatedly and producing the "map-loaded fires every 5s" pattern. ─────
//   const handleMapLoad = useCallback((c) => {
//     log('map-loaded', { hasControls: !!c });
//     mapControlsRef.current = c;
//     c.configureDriverMarker?.({ bg: '#1d4ed8', label: '🚗', size: 42 });
//   }, []); // eslint-disable-line — log is stable, no other deps needed

//   const handleConfirmPickup = async () => {
//     if (!rideId) return;
//     log('confirm-pickup', { rideId });
//     try {
//       const result = await confirmPickup(rideId);
//       log('confirm-pickup-result', { success: result.success, error: result.error });
//       setSnackbar({ open: true, message: result.success ? 'Trip started!' : (result.error || 'Failed'), severity: result.success ? 'success' : 'error' });
//     } catch (err) {
//       log('confirm-pickup-error', { message: err?.message });
//       setSnackbar({ open: true, message: 'An error occurred.', severity: 'error' });
//     }
//   };

//   // ── Cancel handlers ───────────────────────────────────────────────────────
//   const handleCancelRide = async () => {
//     if (!rideId) return;
//     log('cancel-without-reason', { rideId });
//     setCanceling(true);
//     try {
//       const result = await cancelRide(rideId, 'CHANGE_OF_PLANS', 'Cancelled during trip');
//       log('cancel-without-reason-result', { success: result.success, error: result.error });
//       if (result.success) { setSnackbar({ open: true, message: 'Ride cancelled', severity: 'info' }); setTimeout(() => router.push('/'), 1500); }
//       else setSnackbar({ open: true, message: result.error || 'Failed to cancel', severity: 'error' });
//     } catch (err) {
//       log('cancel-without-reason-error', { message: err?.message });
//       setSnackbar({ open: true, message: 'Error cancelling', severity: 'error' });
//     }
//     finally { setCanceling(false); setShowCancelReasons(false); setShowCancelDialog(false); }
//   };

//   const handleCancelConfirmYes = async () => {
//     log('cancel-step1-confirmed', { rideId });
//     setShowCancelDialog(false);
//     setCancelReasonsLoading(true);
//     setShowCancelReasons(true);
//     setSelectedCancelReason('');
//     setCancelOtherText('');
//     try {
//       const res = await apiClient.get('/cancellation-reasons?filters[isActive][$eq]=true&filters[applicableFor][$in][0]=rider&filters[applicableFor][$in][1]=both&sort=displayOrder:asc');
//       const reasons = res?.data ?? res ?? [];
//       log('cancel-reasons-loaded', { count: reasons.length });
//       if (mountedRef.current) setCancelReasons(reasons);
//     } catch (err) {
//       log('cancel-reasons-load-error', { message: err?.message });
//       if (mountedRef.current) setCancelReasons([]);
//     } finally {
//       if (mountedRef.current) setCancelReasonsLoading(false);
//     }
//   };

//   const handleCancelWithReason = async () => {
//     const isOther = selectedCancelReason === '__other__';
//     const reason  = isOther
//       ? (cancelOtherText.trim() || 'Other')
//       : (cancelReasons.find(r => String(r.id) === String(selectedCancelReason))?.reason || selectedCancelReason);
//     if (!reason) return;
//     log('cancel-with-reason', { rideId, reason });
//     setCanceling(true);
//     try {
//       const result = await cancelRide(rideId, reason, reason);
//       log('cancel-with-reason-result', { success: result.success, error: result.error });
//       if (result.success) { setSnackbar({ open: true, message: 'Ride cancelled', severity: 'info' }); setTimeout(() => router.push('/'), 1500); }
//       else setSnackbar({ open: true, message: result.error || 'Failed to cancel', severity: 'error' });
//     } catch (err) {
//       log('cancel-with-reason-error', { message: err?.message });
//       setSnackbar({ open: true, message: 'Error cancelling', severity: 'error' });
//     }
//     finally { setCanceling(false); setShowCancelReasons(false); }
//   };

//   const handleCloseCancelReasons = () => {
//     if (canceling) return;
//     log('cancel-reasons-dialog-closed');
//     setShowCancelReasons(false);
//     setCancelReasons([]);
//     setSelectedCancelReason('');
//     setCancelOtherText('');
//   };

//   const canSubmitCancel = selectedCancelReason && (
//     selectedCancelReason !== '__other__' || cancelOtherText.trim().length > 0
//   );

//   // ── MAP: markers ──────────────────────────────────────────────────────────
//   const markers = useMemo(() => {
//     if (!currentRide) return [];
//     const pickupLoc  = normalizeCoords(currentRide.pickupLocation);
//     const dropoffLoc = normalizeCoords(currentRide.dropoffLocation);

//     if (rideStatus === 'accepted') {
//       const result = [];
//       if (pickupLoc) result.push({ id: 'pickup', position: pickupLoc, type: 'pickup' });
//       return result;
//     }

//     if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') {
//       const result = [];
//       if (pickupLoc)  result.push({ id: 'pickup',  position: pickupLoc,  type: 'pickup'  });
//       if (dropoffLoc) result.push({ id: 'dropoff', position: dropoffLoc, type: 'dropoff' });
//       return result;
//     }

//     return [];
//   }, [currentRide, rideStatus]);

//   if (!currentRide && loading) {
//     log('loading-state', { rideId });
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
//         <CircularProgress size={40} sx={{ color: '#FFC107' }} />
//         <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading ride details...</Typography>
//       </Box>
//     );
//   }

//   if (!currentRide && !loading) {
//     log('no-ride-found', { rideId, hasActiveRide: !!activeRide, hasRide: !!ride });
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', p: 3 }}>
//         <Typography variant="h6" sx={{ mb: 2 }}>No active ride found</Typography>
//         <Button variant="contained" onClick={() => router.push('/')}>Go to Home</Button>
//       </Box>
//     );
//   }

//   return (
//     <ClientOnly>
//       <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

//         {/* ── MAP ──────────────────────────────────────────────────────────── */}
//         <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
//           <MapIframe
//             center={driverLocation || normalizeCoords(currentRide?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
//             zoom={15}
//             markers={markers}
//             pickupLocation={routePickup}
//             dropoffLocation={routeDropoff}
//             showRoute={routeReady}
//             onMapLoad={handleMapLoad}
//           />
//         </Box>

//         {/* Status Bar */}
//         <motion.div
//           initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
//           transition={{ type: 'spring', stiffness: 260, damping: 24 }}
//           style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
//         >
//           <Box sx={{ background: statusGradient, color: 'white', py: 1.5, px: 2, display: 'flex', alignItems: 'center', gap: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
//             <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
//               {statusConfig.icon}
//             </Box>
//             <Box sx={{ flex: 1 }}>
//               <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{statusConfig.title}</Typography>
//               <Typography variant="caption" sx={{ opacity: 0.85 }}>{statusConfig.description}</Typography>
//             </Box>
//             <IconButton size="small" onClick={() => router.push('/')} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
//               <CloseIcon sx={{ fontSize: 18 }} />
//             </IconButton>
//           </Box>
//         </motion.div>

//         {/* ETA card */}
//         {rideStatus === 'accepted' && (
//           <motion.div
//             initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
//             transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
//             style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9 }}
//           >
//             <Paper elevation={8} sx={{ px: 3, py: 1.5, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2.5, background: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)' }}>
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>ETA</Typography>
//                 <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFC107', lineHeight: 1.1 }}>{eta ? formatETA(eta) : '—'}</Typography>
//               </Box>
//               <Divider orientation="vertical" flexItem />
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>Distance</Typography>
//                 <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{distance ? `${typeof distance === 'number' ? distance.toFixed(1) : distance} km` : '—'}</Typography>
//               </Box>
//             </Paper>
//           </motion.div>
//         )}

//         {/* Payment banner */}
//         {rideStatus === 'awaiting_payment' && (
//           <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ position: 'absolute', top: 70, left: 16, right: 16, zIndex: 9 }}>
//             <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 600, boxShadow: '0 8px 24px rgba(255,152,0,0.3)' }}
//               action={<Button size="small" variant="contained" color="warning" onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)} sx={{ fontWeight: 700, borderRadius: 2 }}>Pay Now</Button>}>
//               Payment required — please pay the driver
//             </Alert>
//           </motion.div>
//         )}

//         {/* Centre on driver */}
//         {driverLocation && (
//           <IconButton
//             onClick={() => mapControlsRef.current?.animateToLocation(driverLocation, 16)}
//             sx={{ position: 'absolute', right: 16, top: 80, zIndex: 5, bgcolor: isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.3)', transform: 'scale(1.06)' }, transition: 'all 0.18s ease' }}
//           >
//             <MyLocationIcon color="primary" />
//           </IconButton>
//         )}

//         {/* Bottom Sheet */}
//         <SwipeableBottomSheet open initialHeight={rideStatus === 'arrived' ? 500 : 420} maxHeight="80%" minHeight={200} draggable>
//           <Box sx={{ pt: 1.25, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
//             <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' }} />
//             <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.7 }}>Pull up for details</Typography>
//           </Box>

//           <Box sx={{ px: 3, pb: 3, flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
//             {/* Driver header */}
//             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, flexShrink: 0 }}>
//               <Box sx={{ position: 'relative', mr: 2 }}>
//                 <Avatar src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(driverProfilePic, 'thumbnail')} sx={{ width: 64, height: 64, border: '3px solid', borderColor: 'primary.main', boxShadow: '0 4px 16px rgba(255,193,7,0.3)' }}>
//                   {driver?.firstName?.[0]}
//                 </Avatar>
//                 <Box sx={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main', border: '2px solid', borderColor: 'background.paper' }} />
//               </Box>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.3 }}>{driver?.firstName} {driver?.lastName}</Typography>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
//                   <StarIcon sx={{ fontSize: 15, color: '#FF8C00' }} />
//                   <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF8C00', fontSize: '0.82rem' }}>{driver?.driverProfile?.averageRating || 4.8}</Typography>
//                   <Typography variant="caption" sx={{ color: 'text.disabled' }}>· {driver?.driverProfile?.completedRides || 0} trips</Typography>
//                 </Box>
//                 <Chip size="small"
//                   label={rideStatus === 'awaiting_payment' ? 'Payment Required' : rideStatus === 'arrived' ? 'Arrived' : rideStatus === 'passenger_onboard' ? 'In Transit' : 'On the way'}
//                   color={rideStatus === 'awaiting_payment' ? 'warning' : rideStatus === 'arrived' ? 'success' : 'primary'}
//                   sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
//                 />
//               </Box>
//               <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
//                 <IconButton
//                   onClick={() => {
//                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(driver?.username) ? driver.username : driver?.phoneNumber;
//                     const digits = (raw || '').replace(/\D/g, '');
//                     window.location.href = `tel:${digits.length > 10 ? digits.slice(-10) : digits}`;
//                   }}
//                   sx={{ bgcolor: 'success.main', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
//                 >
//                   <PhoneIcon sx={{ fontSize: 18 }} />
//                 </IconButton>
//                 <IconButton
//                   onClick={() => {
//                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(driver?.username) ? driver.username : driver?.phoneNumber;
//                     window.open(`https://wa.me/${(raw || '').replace(/\D/g, '')}`, '_blank');
//                   }}
//                   sx={{ background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)', color: '#000', width: 40, height: 40, '&:hover': { transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
//                 >
//                   <MessageIcon sx={{ fontSize: 18 }} />
//                 </IconButton>
//               </Box>
//             </Box>

//             {/* In-progress banner */}
//             <AnimatePresence mode="wait">
//               {rideStatus === 'passenger_onboard' && (
//                 <motion.div key="in-progress" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
//                   <Box sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg,rgba(255,193,7,0.15) 0%,rgba(255,140,0,0.08) 100%)', border: '1px solid rgba(255,193,7,0.25)', mb: 2, flexShrink: 0 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
//                       <SpeedIcon sx={{ color: '#FF8C00', fontSize: 18 }} />
//                       <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Trip in Progress</Typography>
//                     </Box>
//                     <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta ? 1.5 : 0 }}>Sit back and relax. You'll arrive soon!</Typography>
//                     {eta && (
//                       <Box>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                           <Typography variant="caption" sx={{ fontWeight: 600 }}>Estimated Arrival</Typography>
//                           <Typography variant="caption" sx={{ fontWeight: 800, color: '#FF8C00' }}>{formatETA(eta)}</Typography>
//                         </Box>
//                         <LinearProgress variant="indeterminate" sx={{ borderRadius: 2, height: 5, bgcolor: 'rgba(255,193,7,0.15)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#FFC107,#FF8C00)' } }} />
//                       </Box>
//                     )}
//                   </Box>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Vehicle card */}
//             <Box sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', mb: 2, flexShrink: 0 }}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
//                 <CarIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
//                 <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.disabled' }}>Vehicle</Typography>
//               </Box>
//               <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
//                 <Box>
//                   <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Plate</Typography>
//                   <Typography variant="body1" sx={{ fontWeight: 800, letterSpacing: 1, fontFamily: 'monospace', background: 'linear-gradient(135deg,#FFC107 0%,#FF8C00 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
//                     {vehicle?.numberPlate || 'N/A'}
//                   </Typography>
//                 </Box>
//                 <Box>
//                   <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Model</Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>{vehicle?.make} {vehicle?.model}</Typography>
//                 </Box>
//                 <Box>
//                   <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Color</Typography>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
//                     <Box sx={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, bgcolor: getColorByKey(vehicle?.color)?.body, border: '1.5px solid', borderColor: getColorByKey(vehicle?.color)?.outline }} />
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>{getColorByKey(vehicle?.color)?.label ?? vehicle?.color}</Typography>
//                   </Box>
//                 </Box>
//                 {driverLocation?.speed && (
//                   <Box>
//                     <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>Speed</Typography>
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>{Math.round(driverLocation.speed)} km/h</Typography>
//                   </Box>
//                 )}
//               </Box>
//               {vehicle?.color && (
//                 <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'center' }}>
//                   <VanIconSmall colorKey={vehicle.color} size={140} />
//                 </Box>
//               )}
//             </Box>

//             {/* Route */}
//             <Box sx={{ mb: 2, flexShrink: 0 }}>
//               <Box sx={{ display: 'flex', gap: 2 }}>
//                 <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
//                   <NavigationIcon sx={{ color: 'success.main', fontSize: 18 }} />
//                   <Box sx={{ flex: 1, width: 2, minHeight: 24, background: 'repeating-linear-gradient(180deg,rgba(0,0,0,0.15) 0px,rgba(0,0,0,0.15) 3px,transparent 3px,transparent 6px)', my: 0.5 }} />
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
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>Your driver has arrived! Confirm once you're in the vehicle.</Typography>
//                     </Alert>
//                     <Button fullWidth variant="contained" size="large" onClick={handleConfirmPickup} disabled={loading}
//                       sx={{ height: 56, fontWeight: 800, fontSize: '1rem', borderRadius: 3.5, mb: 1, background: 'linear-gradient(135deg,#4CAF50 0%,#2E7D32 100%)', boxShadow: '0 6px 20px rgba(76,175,80,0.4)', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(76,175,80,0.5)' }, transition: 'all 0.2s ease' }}>
//                       {loading ? <CircularProgress size={24} color="inherit" /> : "✓ I'm in the car — Start Trip"}
//                     </Button>
//                   </motion.div>
//                 )}
//                 {rideStatus === 'awaiting_payment' && (
//                   <motion.div key="awaiting-payment" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
//                     <Button fullWidth variant="contained" color="warning" size="large" onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)} sx={{ height: 56, fontWeight: 800, borderRadius: 3.5, mb: 1 }}>
//                       💳 Pay Now
//                     </Button>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {rideStatus !== 'passenger_onboard' && rideStatus !== 'awaiting_payment' && (
//                 <Button fullWidth variant="outlined" color="error" onClick={() => setShowCancelDialog(true)} disabled={canceling}
//                   sx={{ height: 48, fontWeight: 700, borderRadius: 3.5, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}>
//                   Cancel Ride
//                 </Button>
//               )}
//             </Box>
//           </Box>
//         </SwipeableBottomSheet>

//         {/* ── STEP 1: Cancel confirmation ─────────────────────────────────── */}
//         <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} PaperProps={{ sx: { borderRadius: 4, maxWidth: 400, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }}>
//           <DialogTitle sx={{ fontWeight: 700 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//               <Box sx={{ width:40, height:40, borderRadius:2, flexShrink:0, background:'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(239,68,68,0.35)' }}>
//                 <WarningIcon sx={{ fontSize:22, color:'#fff' }} />
//               </Box>
//               Cancel Ride?
//             </Box>
//             <IconButton onClick={() => setShowCancelDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
//           </DialogTitle>
//           <DialogContent>
//             <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>A cancellation fee may apply.</Alert>
//             <Typography variant="body2" color="text.secondary">Are you sure you want to cancel this ride?</Typography>
//           </DialogContent>
//           <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
//             <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, height: 44 }}>No</Button>
//             <Button onClick={handleCancelConfirmYes} variant="contained" color="error" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 44 }}>Yes</Button>
//           </DialogActions>
//         </Dialog>

//         {/* ── STEP 2: Cancel reason selection ─────────────────────────────── */}
//         <Dialog
//           open={showCancelReasons}
//           onClose={handleCloseCancelReasons}
//           PaperProps={{ sx: { borderRadius: 4, maxWidth: 400, mx: 2, width: '100%', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }}
//         >
//           <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//               <Box sx={{ width:40, height:40, borderRadius:2, flexShrink:0, background:'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(239,68,68,0.35)' }}>
//                 <CancelIcon sx={{ fontSize:22, color:'#fff' }} />
//               </Box>
//               Reason for Cancellation
//             </Box>
//           </DialogTitle>
//           <DialogContent sx={{ pt: 2, pb: 1 }}>
//             <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
//               Please let us know why you're cancelling so we can improve your experience.
//             </Typography>
//             {cancelReasonsLoading ? (
//               <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
//             ) : (
//               <FormControl fullWidth size="medium">
//                 <InputLabel id="cancel-reason-label">Select a reason</InputLabel>
//                 <Select
//                   labelId="cancel-reason-label"
//                   value={selectedCancelReason}
//                   label="Select a reason"
//                   onChange={(e) => { setSelectedCancelReason(e.target.value); if (e.target.value !== '__other__') setCancelOtherText(''); }}
//                   sx={{ borderRadius: 2 }}
//                 >
//                   {cancelReasons.map((r) => (
//                     <MenuItem key={r.id} value={String(r.id)}>{r.reason}</MenuItem>
//                   ))}
//                   <MenuItem value="__other__">Other</MenuItem>
//                 </Select>
//               </FormControl>
//             )}
//             <AnimatePresence>
//               {selectedCancelReason === '__other__' && (
//                 <motion.div key="other-input" initial={{ opacity:0, height:0, marginTop:0 }} animate={{ opacity:1, height:'auto', marginTop:16 }} exit={{ opacity:0, height:0, marginTop:0 }} transition={{ type:'spring', stiffness:300, damping:28 }} style={{ overflow:'hidden' }}>
//                   <TextField fullWidth multiline minRows={2} maxRows={4} placeholder="Explain more…" value={cancelOtherText} onChange={(e) => setCancelOtherText(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </DialogContent>
//           <DialogActions sx={{ px: 2.5, pb: 1.5, gap: 1, flexDirection: 'column' }}>
//             <Button fullWidth variant="contained" color="error" size="large" disabled={!canSubmitCancel || canceling} startIcon={canceling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />} onClick={handleCancelWithReason} sx={{ height:50, borderRadius:2.5, fontWeight:700 }}>
//               {canceling ? 'Cancelling…' : 'Cancel Ride'}
//             </Button>
//             <Divider sx={{ width:'100%', my:0.5 }}>
//               <Typography variant="caption" color="text.disabled" sx={{ px:1 }}>or</Typography>
//             </Divider>
//             <Button fullWidth variant="text" size="medium" disabled={canceling} onClick={handleCancelRide} sx={{ height:44, borderRadius:2.5, fontWeight:600, color:'text.secondary', textTransform:'none', fontSize:'0.875rem', '&:hover':{ bgcolor:'action.hover' } }}>
//               Cancel without reason
//             </Button>
//           </DialogActions>
//         </Dialog>

//         {/* Snackbar */}
//         <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
//           <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
//             {snackbar.message}
//           </Alert>
//         </Snackbar>
//       </Box>
//     </ClientOnly>
//   );
// }
'use client'
// PATH: rider/app/(main)/tracking/page.js

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Avatar, IconButton, Chip, Paper,
  Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, useTheme,
  FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import {
  Phone as PhoneIcon, Message as MessageIcon, Close as CloseIcon,
  Star as StarIcon, Navigation as NavigationIcon, Place as PlaceIcon,
  MyLocation as MyLocationIcon, DirectionsCar as CarIcon, Speed as SpeedIcon,
  Cancel as CancelIcon, Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRide } from '@/lib/hooks/useRide';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import ClientOnly from '@/components/ClientOnly';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import MapIframe from '@/components/Map/MapIframeNoSSR';
import { getImageUrl } from '@/Functions';
import { VanIconSmall, getColorByKey } from '@/components/ui/VehicleColorPicker';
import { ridesAPI } from '@/lib/api/rides';
import BottomMarginDiv from '@/components/BottomMarginDiv';
import { apiClient } from '@/lib/api/client';

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
  if (minutes < 1)  return 'Arriving soon';
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

const normalizeCoords = (loc) => {
  if (!loc) return null;
  const lat = loc.lat ?? loc.latitude;
  const lng = loc.lng ?? loc.longitude;
  if (lat == null || lng == null) return null;
  return { ...loc, lat, lng };
};

const DEFAULT_CANCEL_REASON = 'Change of plans';

function coordKey(c) {
  if (!c) return null;
  return `${c.lat},${c.lng}`;
}

// ── License Plate Component ────────────────────────────────────────────────────
// Renders an authentic-looking vehicle number plate with blue header strip
function LicensePlate({ plate, size = 'large' }) {
  const isLarge = size === 'large';
  if (!plate) return null;

  return (
    <Box sx={{
      position: 'relative',
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRadius: isLarge ? 2.5 : 1.5,
      overflow: 'hidden',
      // Plate body: white/off-white gradient
      background: 'linear-gradient(180deg, #FAFAFA 0%, #F0F0F0 100%)',
      border: '2.5px solid #111',
      boxShadow: isLarge
        ? '0 6px 24px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9)'
        : '0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
      minWidth: isLarge ? 140 : 90,
    }}>
      {/* Plate number */}
      <Box sx={{ px: isLarge ? 2 : 1.25, pb: isLarge ? 0.75 : 0.4, pt: isLarge ? 0.5 : 0.3 }}>
        <Typography sx={{
          fontFamily: '"Courier New", "Lucida Console", "Liberation Mono", monospace',
          fontWeight: 900,
          fontSize: isLarge ? '1.5rem' : '0.9rem',
          letterSpacing: isLarge ? 4 : 2.5,
          color: '#0A0A0A',
          lineHeight: 1,
          textTransform: 'uppercase',
          textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          whiteSpace: 'nowrap',
          userSelect: 'all',
        }}>
          {plate}
        </Typography>
      </Box>
    </Box>
  );
}

export default function TrackingPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rideId       = searchParams.get('rideId');
  const theme        = useTheme();
  const isDark       = theme.palette.mode === 'dark';

  const {
    activeRide, ride, confirmPickup, cancelRide,
    startTracking, stopTracking, loading,
    loadRideDriverProfilePicUrl,
  } = useRide();
  const { on: rnOn, sendToNative } = useReactNative();

  const log = useCallback((key, data = {}) => {
    const payload = { key: `tracking-page-${key}`, ts: Date.now(), ...data };
    try { sendToNative('LOG_DATA', payload); } catch {}
    console.log(`tracking-page-${key}`, data);
  }, [sendToNative]);

  const [driverLocation,  setDriverLocation]  = useState(null);
  const [eta,             setEta]             = useState(null);
  const [distance,        setDistance]        = useState(null);
  const [showCancelDialog,setShowCancelDialog]= useState(false);
  const [canceling,       setCanceling]       = useState(false);
  const [snackbar,        setSnackbar]        = useState({ open: false, message: '', severity: 'info' });
  const [driverProfilePic,setDriverProfilePic]= useState(null);

  const [showCancelReasons,    setShowCancelReasons]    = useState(false);
  const [cancelReasons,        setCancelReasons]        = useState([]);
  const [cancelReasonsLoading, setCancelReasonsLoading] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [cancelOtherText,      setCancelOtherText]      = useState('');

  const [routePickup,  setRoutePickup]  = useState(null);
  const [routeDropoff, setRouteDropoff] = useState(null);
  const [routeReady,   setRouteReady]   = useState(false);
  const routeStatusRef  = useRef(null);
  const lastRouteKeyRef = useRef(null);

  const mapControlsRef = useRef(null);
  const locPollRef     = useRef(null);
  const mountedRef     = useRef(true);

  const currentRide    = activeRide || ride;
  const rideStatus     = currentRide?.rideStatus;
  const driver         = currentRide?.driver;
  const vehicle        = currentRide?.vehicle;
  const statusConfig   = RIDE_STATUS_CONFIG[rideStatus] || RIDE_STATUS_CONFIG.accepted;
  const statusGradient = STATUS_GRADIENTS[statusConfig.color] || STATUS_GRADIENTS.info;

  log('render', {
    rideId,
    rideStatus,
    currentRideId: currentRide?.id,
    sourceOfRide:  activeRide ? 'activeRide' : 'ride',
    loading,
    routeReady,
    driverLocation: driverLocation ? `${driverLocation.lat},${driverLocation.lng}` : null,
  });

  useEffect(() => {
    mountedRef.current = true;
    log('mounted', { rideId });
    return () => {
      mountedRef.current = false;
      clearInterval(locPollRef.current);
      log('unmounted', { rideId });
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    log('status-changed-reset-route', {
      newStatus:    rideStatus,
      prevRouteRef: routeStatusRef.current,
      hadRoute:     routeReady,
    });
    routeStatusRef.current  = null;
    lastRouteKeyRef.current = null;
    setRouteReady(false);
    setRoutePickup(null);
    setRouteDropoff(null);
  }, [rideStatus]); // eslint-disable-line

  useEffect(() => {
    if (!rideId || !currentRide || ['completed', 'cancelled'].includes(rideStatus)) {
      log('poll-skipped', { rideId, rideStatus, hasCurrentRide: !!currentRide });
      return;
    }

    log('poll-started', { rideId, rideStatus, intervalMs: 5000 });

    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const result = await ridesAPI.trackRide(rideId);

        log('poll-response', {
          success:        result.success,
          backendStatus:  result.data?.ride?.rideStatus,
          localStatus:    rideStatus,
          statusMismatch: result.data?.ride?.rideStatus !== rideStatus,
          hasDriverLoc:   !!result.data?.driver?.currentLocation,
          trackingEta:    result.data?.tracking?.eta,
          trackingDist:   result.data?.tracking?.distance,
        });

        if (!result.success || !result.data || !mountedRef.current) return;

        const td     = result.data;
        const rawLoc = td.driver?.currentLocation;
        const loc    = normalizeCoords(rawLoc);

        if (loc) {
          setDriverLocation(loc);
          mapControlsRef.current?.updateDriverLocation(loc);

          // ── FIX: ETA/distance must reflect the actual leg being driven ──
          if (rideStatus === 'accepted') {
            // Driver → pickup: compute locally from live GPS coords
            const pickup = normalizeCoords(td.ride?.pickupLocation ?? currentRide.pickupLocation);
            if (pickup) {
              const km = calculateDistance(loc, pickup);
              setDistance(km);
              setEta(estimateDuration(km));
            }
          } else {
            // passenger_onboard / awaiting_payment: recalculate live from driver position → dropoff
            const dropoff = normalizeCoords(td.ride?.dropoffLocation ?? currentRide.dropoffLocation);
            if (dropoff) {
              const km = calculateDistance(loc, dropoff);
              setDistance(km);
              setEta(estimateDuration(km));
            }
          }

          if (rideStatus === 'accepted') {
            const pickup = normalizeCoords(td.ride?.pickupLocation ?? currentRide.pickupLocation);
            if (pickup) {
              const newKey = `${coordKey(loc)}->${coordKey(pickup)}`;
              if (newKey !== lastRouteKeyRef.current) {
                log('route-set-accepted', {
                  driverLoc: coordKey(loc),
                  pickupLoc: coordKey(pickup),
                  wasKey:    lastRouteKeyRef.current,
                });
                lastRouteKeyRef.current = newKey;
                setRoutePickup(loc);
                setRouteDropoff(pickup);
                setRouteReady(true);
              }
            } else {
              log('route-accepted-no-pickup', {
                tdPickup:      td.ride?.pickupLocation,
                currentPickup: currentRide.pickupLocation,
              });
            }
          }

          if (rideStatus === 'passenger_onboard' && routeStatusRef.current !== 'passenger_onboard') {
            routeStatusRef.current = 'passenger_onboard';
            const pickup  = normalizeCoords(td.ride?.pickupLocation  ?? currentRide.pickupLocation);
            const dropoff = normalizeCoords(td.ride?.dropoffLocation ?? currentRide.dropoffLocation);
            if (pickup && dropoff) {
              log('route-set-onboard', {
                pickup:  coordKey(pickup),
                dropoff: coordKey(dropoff),
              });
              lastRouteKeyRef.current = `${coordKey(pickup)}->${coordKey(dropoff)}`;
              setRoutePickup(pickup);
              setRouteDropoff(dropoff);
              setRouteReady(true);
            } else {
              log('route-onboard-missing-coords', {
                hasPickup:   !!pickup,
                hasDropoff:  !!dropoff,
                ridePickup:  currentRide.pickupLocation,
                rideDropoff: currentRide.dropoffLocation,
              });
            }
          }
        } else {
          log('poll-no-driver-location', { rawLoc });
        }

        const backendStatus = td.ride?.rideStatus;
        if (backendStatus === 'completed' || backendStatus === 'cancelled') {
          log('poll-terminal-status', { backendStatus });
          clearInterval(locPollRef.current);
        }

      } catch (err) {
        log('poll-error', { message: err?.message, stack: err?.stack?.slice(0, 300) });
      }
    };

    poll();
    locPollRef.current = setInterval(poll, 5000);
    return () => {
      log('poll-cleared', { rideId, rideStatus });
      clearInterval(locPollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId, rideStatus, currentRide?.driver?.id]);

  useEffect(() => {
    const unsub = rnOn('DRIVER_LOCATION_UPDATED', (payload) => {
      const raw = payload.location ?? payload;
      if (!raw) return;
      const loc = normalizeCoords({
        lat: raw.lat ?? raw.latitude, lng: raw.lng ?? raw.longitude,
        accuracy: raw.accuracy, heading: raw.heading, speed: raw.speed,
      });
      if (!loc) return;
      log('rn-driver-location', { lat: loc.lat, lng: loc.lng, eta: payload.eta, distance: payload.distance });
      setDriverLocation(loc);
      mapControlsRef.current?.updateDriverLocation(loc);
      if (payload.eta      != null) setEta(payload.eta);
      if (payload.distance != null) setDistance(payload.distance);
    });
    return () => unsub?.();
  }, [rnOn]); // eslint-disable-line

  useEffect(() => {
    if (!rideId || !currentRide) return;
    log('start-tracking', { rideId });
    const cleanup = startTracking(rideId, () => {});
    return () => {
      log('stop-tracking', { rideId });
      if (cleanup) cleanup();
      stopTracking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  useEffect(() => {
    if (!currentRide) return;
    log('seed-initial-data', {
      currentRideId:            currentRide.id,
      rideStatus:               currentRide.rideStatus,
      hasCurrentDriverLocation: !!currentRide.currentDriverLocation,
      estimatedDuration:        currentRide.estimatedDuration,
      estimatedDistance:        currentRide.estimatedDistance,
    });
    if (currentRide.currentDriverLocation) {
      const norm = normalizeCoords(currentRide.currentDriverLocation);
      if (norm) setDriverLocation(norm);
    }

    // ── FIX: seed ETA/distance for the correct leg ──
    if (currentRide.rideStatus === 'accepted') {
      // Driver → pickup: seed from live driver location if available
      if (currentRide.currentDriverLocation && currentRide.pickupLocation) {
        const driverLoc = normalizeCoords(currentRide.currentDriverLocation);
        const pickup    = normalizeCoords(currentRide.pickupLocation);
        if (driverLoc && pickup) {
          const km = calculateDistance(driverLoc, pickup);
          setDistance(km);
          setEta(estimateDuration(km));
        }
      }
    } else {
      // passenger_onboard / arrived / awaiting_payment — pickup→dropoff is correct
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
    }

    const fetchPic = async () => {
      setDriverProfilePic(await loadRideDriverProfilePicUrl(currentRide?.driver?.id));
    };
    fetchPic();
  }, [currentRide?.id]); // eslint-disable-line

  useEffect(() => {
    if (!currentRide) return;
    const id           = currentRide.id ?? rideId;
    const status       = currentRide.rideStatus;
    const currentPath  = typeof window !== 'undefined' ? window.location.pathname : 'ssr';
    const alreadyOnPay = typeof window !== 'undefined' && window.location.pathname.includes(`/trips/${id}/pay`);

    log('status-effect-fired', {
      status,
      rideId:       id,
      currentPath,
      alreadyOnPay,
      sourceOfRide: activeRide ? 'activeRide' : 'ride',
      hookLoading:  loading,
    });

    if (status === 'awaiting_payment') {
      if (!alreadyOnPay) {
        log('redirect-to-pay', { rideId: id, from: currentPath });
        setSnackbar({ open: true, message: 'Payment required. Redirecting…', severity: 'warning' });
        setTimeout(() => router.push(`/trips/${id}/pay`), 1200);
      } else {
        log('redirect-to-pay-skipped-already-there', { rideId: id, currentPath });
      }
      return;
    }

    if (status === 'completed') {
      log('redirect-trip-summary', { rideId: id, from: currentPath });
      stopTracking();
      router.push(`/trip-summary?rideId=${id}`);
    } else if (status === 'cancelled') {
      log('redirect-home-cancelled', { rideId: id, from: currentPath });
      stopTracking();
      setSnackbar({ open: true, message: 'Ride was cancelled', severity: 'warning' });
      setTimeout(() => router.push('/'), 2000);
    } else if (status === 'arrived') {
      log('driver-arrived-snackbar', { rideId: id });
      setSnackbar({ open: true, message: '📍 Your driver has arrived!', severity: 'success' });
    } else {
      log('status-effect-no-action', { status });
    }
  }, [currentRide?.rideStatus, router, stopTracking, rideId]); // eslint-disable-line

  const handleMapLoad = useCallback((c) => {
    log('map-loaded', { hasControls: !!c });
    mapControlsRef.current = c;
    c.configureDriverMarker?.({ bg: '#1d4ed8', label: '🚗', size: 42 });
  }, []); // eslint-disable-line

  const handleConfirmPickup = async () => {
    if (!rideId) return;
    log('confirm-pickup', { rideId });
    try {
      const result = await confirmPickup(rideId);
      log('confirm-pickup-result', { success: result.success, error: result.error });
      setSnackbar({ open: true, message: result.success ? 'Trip started!' : (result.error || 'Failed'), severity: result.success ? 'success' : 'error' });
    } catch (err) {
      log('confirm-pickup-error', { message: err?.message });
      setSnackbar({ open: true, message: 'An error occurred.', severity: 'error' });
    }
  };

  const handleCancelRide = async () => {
    if (!rideId) return;
    log('cancel-without-reason', { rideId });
    setCanceling(true);
    try {
      const result = await cancelRide(rideId, 'CHANGE_OF_PLANS', 'Cancelled during trip');
      log('cancel-without-reason-result', { success: result.success, error: result.error });
      if (result.success) { setSnackbar({ open: true, message: 'Ride cancelled', severity: 'info' }); setTimeout(() => router.push('/'), 1500); }
      else setSnackbar({ open: true, message: result.error || 'Failed to cancel', severity: 'error' });
    } catch (err) {
      log('cancel-without-reason-error', { message: err?.message });
      setSnackbar({ open: true, message: 'Error cancelling', severity: 'error' });
    }
    finally { setCanceling(false); setShowCancelReasons(false); setShowCancelDialog(false); }
  };

  const handleCancelConfirmYes = async () => {
    log('cancel-step1-confirmed', { rideId });
    setShowCancelDialog(false);
    setCancelReasonsLoading(true);
    setShowCancelReasons(true);
    setSelectedCancelReason('');
    setCancelOtherText('');
    try {
      const res = await apiClient.get('/cancellation-reasons?filters[isActive][$eq]=true&filters[applicableFor][$in][0]=rider&filters[applicableFor][$in][1]=both&sort=displayOrder:asc');
      const reasons = res?.data ?? res ?? [];
      log('cancel-reasons-loaded', { count: reasons.length });
      if (mountedRef.current) setCancelReasons(reasons);
    } catch (err) {
      log('cancel-reasons-load-error', { message: err?.message });
      if (mountedRef.current) setCancelReasons([]);
    } finally {
      if (mountedRef.current) setCancelReasonsLoading(false);
    }
  };

  const handleCancelWithReason = async () => {
    const isOther = selectedCancelReason === '__other__';
    const reason  = isOther
      ? (cancelOtherText.trim() || 'Other')
      : (cancelReasons.find(r => String(r.id) === String(selectedCancelReason))?.reason || selectedCancelReason);
    if (!reason) return;
    log('cancel-with-reason', { rideId, reason });
    setCanceling(true);
    try {
      const result = await cancelRide(rideId, reason, reason);
      log('cancel-with-reason-result', { success: result.success, error: result.error });
      if (result.success) { setSnackbar({ open: true, message: 'Ride cancelled', severity: 'info' }); setTimeout(() => router.push('/'), 1500); }
      else setSnackbar({ open: true, message: result.error || 'Failed to cancel', severity: 'error' });
    } catch (err) {
      log('cancel-with-reason-error', { message: err?.message });
      setSnackbar({ open: true, message: 'Error cancelling', severity: 'error' });
    }
    finally { setCanceling(false); setShowCancelReasons(false); }
  };

  const handleCloseCancelReasons = () => {
    if (canceling) return;
    log('cancel-reasons-dialog-closed');
    setShowCancelReasons(false);
    setCancelReasons([]);
    setSelectedCancelReason('');
    setCancelOtherText('');
  };

  const canSubmitCancel = selectedCancelReason && (
    selectedCancelReason !== '__other__' || cancelOtherText.trim().length > 0
  );

  const markers = useMemo(() => {
    if (!currentRide) return [];
    const pickupLoc  = normalizeCoords(currentRide.pickupLocation);
    const dropoffLoc = normalizeCoords(currentRide.dropoffLocation);

    if (rideStatus === 'accepted') {
      const result = [];
      if (pickupLoc) result.push({ id: 'pickup', position: pickupLoc, type: 'pickup' });
      return result;
    }

    if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') {
      const result = [];
      if (pickupLoc)  result.push({ id: 'pickup',  position: pickupLoc,  type: 'pickup'  });
      if (dropoffLoc) result.push({ id: 'dropoff', position: dropoffLoc, type: 'dropoff' });
      return result;
    }

    return [];
  }, [currentRide, rideStatus]);

  if (!currentRide && loading) {
    log('loading-state', { rideId });
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#FFC107' }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading ride details...</Typography>
      </Box>
    );
  }

  if (!currentRide && !loading) {
    log('no-ride-found', { rideId, hasActiveRide: !!activeRide, hasRide: !!ride });
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>No active ride found</Typography>
        <Button variant="contained" onClick={() => router.push('/')}>Go to Home</Button>
      </Box>
    );
  }

  // ── Derived: live color info from VehicleColorPicker ─────────────────────
  const colorInfo = getColorByKey(vehicle?.color);

  return (
    <ClientOnly>
      <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

        {/* ── MAP ──────────────────────────────────────────────────────────── */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MapIframe
            center={driverLocation || normalizeCoords(currentRide?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
            zoom={15}
            markers={markers}
            pickupLocation={routePickup}
            dropoffLocation={routeDropoff}
            showRoute={routeReady}
            onMapLoad={handleMapLoad}
          />
        </Box>

        {/* Status Bar */}
        <motion.div
          initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
        >
          <Box sx={{ background: statusGradient, color: 'white', py: 1.5, px: 2, display: 'flex', alignItems: 'center', gap: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
              {statusConfig.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{statusConfig.title}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>{statusConfig.description}</Typography>
            </Box>
            <IconButton size="small" onClick={() => router.push('/')} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </motion.div>

        {/* ── Floating ETA card: GREEN when heading to pickup (driver → pickup) ── */}
        {rideStatus === 'accepted' && (
          <motion.div
            initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 22 }}
            style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9 }}
          >
            <Paper elevation={8} sx={{
              px: 3, py: 1.5, borderRadius: 4,
              display: 'flex', alignItems: 'center', gap: 2.5,
              background: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.35)',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(16,185,129,0.18)',
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>ETA to Pickup</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981', lineHeight: 1.1 }}>
                  {eta != null ? formatETA(eta) : '—'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>Distance</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {distance != null ? `${typeof distance === 'number' ? distance.toFixed(1) : distance} km` : '—'}
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* ── In-transit ETA card ──────────────────────────────────────────── */}
        {rideStatus === 'passenger_onboard' && eta != null && (
          <motion.div
            initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
            style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9 }}
          >
            <Paper elevation={8} sx={{
              px: 3, py: 1.5, borderRadius: 4,
              display: 'flex', alignItems: 'center', gap: 2.5,
              background: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,193,7,0.3)' : 'rgba(255,193,7,0.4)',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(255,140,0,0.2)',
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>Arrival</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FF8C00', lineHeight: 1.1 }}>
                  {formatETA(eta)}
                </Typography>
              </Box>
              {distance != null && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>Remaining</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                      {typeof distance === 'number' ? `${distance.toFixed(1)} km` : `${distance} km`}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </motion.div>
        )}

        {/* Payment banner */}
        {rideStatus === 'awaiting_payment' && (
          <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ position: 'absolute', top: 70, left: 16, right: 16, zIndex: 9 }}>
            <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 600, boxShadow: '0 8px 24px rgba(255,152,0,0.3)' }}
              action={<Button size="small" variant="contained" color="warning" onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)} sx={{ fontWeight: 700, borderRadius: 2 }}>Pay Now</Button>}>
              Payment required — please pay the driver
            </Alert>
          </motion.div>
        )}

        {/* Centre on driver */}
        {driverLocation && (
          <IconButton
            onClick={() => mapControlsRef.current?.animateToLocation(driverLocation, 16)}
            sx={{ position: 'absolute', right: 16, top: 80, zIndex: 5, bgcolor: isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.3)', transform: 'scale(1.06)' }, transition: 'all 0.18s ease' }}
          >
            <MyLocationIcon color="primary" />
          </IconButton>
        )}

        {/* Bottom Sheet */}
        <SwipeableBottomSheet open initialHeight={rideStatus === 'arrived' ? 500 : 420} maxHeight="85%" minHeight={200} draggable>
          <Box sx={{ pt: 1.25, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.7 }}>Pull up for details</Typography>
          </Box>

          <Box sx={{ px: 3, pb: 3, flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
            {/* Driver header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, flexShrink: 0 }}>
              <Box sx={{ position: 'relative', mr: 2 }}>
                <Avatar src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(driverProfilePic, 'thumbnail')} sx={{ width: 64, height: 64, border: '3px solid', borderColor: 'primary.main', boxShadow: '0 4px 16px rgba(255,193,7,0.3)' }}>
                  {driver?.firstName?.[0]}
                </Avatar>
                <Box sx={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main', border: '2px solid', borderColor: 'background.paper' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.3 }}>{driver?.firstName} {driver?.lastName}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
                  <StarIcon sx={{ fontSize: 15, color: '#FF8C00' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF8C00', fontSize: '0.82rem' }}>{driver?.driverProfile?.averageRating || 4.8}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>· {driver?.driverProfile?.completedRides || 0} trips</Typography>
                </Box>
                <Chip size="small"
                  label={rideStatus === 'awaiting_payment' ? 'Payment Required' : rideStatus === 'arrived' ? 'Arrived' : rideStatus === 'passenger_onboard' ? 'In Transit' : 'On the way'}
                  color={rideStatus === 'awaiting_payment' ? 'warning' : rideStatus === 'arrived' ? 'success' : 'primary'}
                  sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <IconButton
                  onClick={() => {
                    const raw = /^\+?\d[\d\s\-]{6,}$/.test(driver?.username) ? driver.username : driver?.phoneNumber;
                    const digits = (raw || '').replace(/\D/g, '');
                    window.location.href = `tel:${digits.length > 10 ? digits.slice(-10) : digits}`;
                  }}
                  sx={{ bgcolor: 'success.main', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
                >
                  <PhoneIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  onClick={() => {
                    const raw = /^\+?\d[\d\s\-]{6,}$/.test(driver?.username) ? driver.username : driver?.phoneNumber;
                    window.open(`https://wa.me/${(raw || '').replace(/\D/g, '')}`, '_blank');
                  }}
                  sx={{ background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)', color: '#000', width: 40, height: 40, '&:hover': { transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
                >
                  <MessageIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>

            {/* ── Driver on the way banner (accepted) ── */}
            <AnimatePresence mode="wait">
              {rideStatus === 'accepted' && (
                <motion.div key="en-route" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                  <Box sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(5,150,105,0.06) 100%)', border: '1px solid rgba(16,185,129,0.25)', mb: 2, flexShrink: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                      <SpeedIcon sx={{ fontSize: 18, color: '#10B981' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Driver on the way</Typography>
                      {eta != null && (
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5 }}>
                          {distance != null && (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                              {typeof distance === 'number' ? `${distance.toFixed(1)} km` : `${distance} km`}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#10B981' }}>
                            {formatETA(eta)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta != null ? 1.5 : 0 }}>
                      Your driver is heading to your pickup location.
                    </Typography>
                    {eta != null && (
                      <LinearProgress variant="indeterminate" sx={{ borderRadius: 2, height: 4, bgcolor: 'rgba(16,185,129,0.15)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#10B981,#059669)' } }} />
                    )}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* In-progress banner */}
            <AnimatePresence mode="wait">
              {rideStatus === 'passenger_onboard' && (
                <motion.div key="in-progress" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                  <Box sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg,rgba(255,193,7,0.15) 0%,rgba(255,140,0,0.08) 100%)', border: '1px solid rgba(255,193,7,0.25)', mb: 2, flexShrink: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                      <SpeedIcon sx={{ color: '#FF8C00', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Trip in Progress</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta ? 1.5 : 0 }}>Sit back and relax. You'll arrive soon!</Typography>
                    {eta && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>Estimated Arrival</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#FF8C00' }}>{formatETA(eta)}</Typography>
                        </Box>
                        <LinearProgress variant="indeterminate" sx={{ borderRadius: 2, height: 5, bgcolor: 'rgba(255,193,7,0.15)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#FFC107,#FF8C00)' } }} />
                      </Box>
                    )}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Vehicle card — redesigned for maximum plate visibility ──── */}
            <Box sx={{
              p: 2, borderRadius: 3, border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              mb: 2, flexShrink: 0,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CarIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.disabled' }}>
                  Your Vehicle
                </Typography>
              </Box>

              {/* ── Number plate — hero element ─────────────────────────── */}
              {vehicle?.numberPlate && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <LicensePlate plate={vehicle.numberPlate} size="large" />
                </Box>
              )}

              {/* Make / model / color row */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: vehicle?.color ? '1fr 1fr' : '1fr',
                gap: 1.5,
                mb: vehicle?.color && colorInfo ? 1.5 : 0,
              }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.25 }}>
                    Model
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {vehicle?.make} {vehicle?.model}
                  </Typography>
                </Box>
                {vehicle?.color && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.25 }}>
                      Colour
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {/* Big, clear color swatch */}
                      <Box sx={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        bgcolor: colorInfo?.body ?? '#888',
                        border: `2.5px solid ${colorInfo?.outline ?? '#666'}`,
                        boxShadow: `0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.5)`,
                      }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                        {colorInfo?.label ?? vehicle.color}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Vehicle illustration */}
              {vehicle?.color && (
                <Box sx={{
                  mt: 1.5, p: 1.5, borderRadius: 2.5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  display: 'flex', justifyContent: 'center',
                }}>
                  <VanIconSmall colorKey={vehicle.color} size={140} />
                </Box>
              )}

              {/* Speed — only when moving */}
              {driverLocation?.speed && (
                <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <SpeedIcon sx={{ fontSize: 15, color: '#FF8C00' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#FF8C00' }}>
                    {Math.round(driverLocation.speed)} km/h
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Route */}
            <Box sx={{ mb: 2, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                  <NavigationIcon sx={{ color: 'success.main', fontSize: 18 }} />
                  <Box sx={{ flex: 1, width: 2, minHeight: 24, background: 'repeating-linear-gradient(180deg,rgba(0,0,0,0.15) 0px,rgba(0,0,0,0.15) 3px,transparent 3px,transparent 6px)', my: 0.5 }} />
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Your driver has arrived! Confirm once you're in the vehicle.</Typography>
                    </Alert>
                    <Button fullWidth variant="contained" size="large" onClick={handleConfirmPickup} disabled={loading}
                      sx={{ height: 56, fontWeight: 800, fontSize: '1rem', borderRadius: 3.5, mb: 1, background: 'linear-gradient(135deg,#4CAF50 0%,#2E7D32 100%)', boxShadow: '0 6px 20px rgba(76,175,80,0.4)', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(76,175,80,0.5)' }, transition: 'all 0.2s ease' }}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : "✓ I'm in the car — Start Trip"}
                    </Button>
                  </motion.div>
                )}
                {rideStatus === 'awaiting_payment' && (
                  <motion.div key="awaiting-payment" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <Button fullWidth variant="contained" color="warning" size="large" onClick={() => router.push(`/trips/${currentRide.id ?? rideId}/pay`)} sx={{ height: 56, fontWeight: 800, borderRadius: 3.5, mb: 1 }}>
                      💳 Pay Now
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {rideStatus !== 'passenger_onboard' && rideStatus !== 'awaiting_payment' && (
                <Button fullWidth variant="outlined" color="error" onClick={() => setShowCancelDialog(true)} disabled={canceling}
                  sx={{ height: 48, fontWeight: 700, borderRadius: 3.5, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}>
                  Cancel Ride
                </Button>
              )}
            </Box>
          </Box>
        </SwipeableBottomSheet>

        {/* ── STEP 1: Cancel confirmation ─────────────────────────────────── */}
        <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} PaperProps={{ sx: { borderRadius: 4, maxWidth: 400, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width:40, height:40, borderRadius:2, flexShrink:0, background:'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(239,68,68,0.35)' }}>
                <WarningIcon sx={{ fontSize:22, color:'#fff' }} />
              </Box>
              Cancel Ride?
            </Box>
            <IconButton onClick={() => setShowCancelDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>A cancellation fee may apply.</Alert>
            <Typography variant="body2" color="text.secondary">Are you sure you want to cancel this ride?</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
            <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, height: 44 }}>No</Button>
            <Button onClick={handleCancelConfirmYes} variant="contained" color="error" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 44 }}>Yes</Button>
          </DialogActions>
        </Dialog>

        {/* ── STEP 2: Cancel reason selection ─────────────────────────────── */}
        <Dialog
          open={showCancelReasons}
          onClose={handleCloseCancelReasons}
          PaperProps={{ sx: { borderRadius: 4, maxWidth: 400, mx: 2, width: '100%', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }}
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width:40, height:40, borderRadius:2, flexShrink:0, background:'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(239,68,68,0.35)' }}>
                <CancelIcon sx={{ fontSize:22, color:'#fff' }} />
              </Box>
              Reason for Cancellation
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 2, pb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
              Please let us know why you're cancelling so we can improve your experience.
            </Typography>
            {cancelReasonsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
            ) : (
              <FormControl fullWidth size="medium">
                <InputLabel id="cancel-reason-label">Select a reason</InputLabel>
                <Select
                  labelId="cancel-reason-label"
                  value={selectedCancelReason}
                  label="Select a reason"
                  onChange={(e) => { setSelectedCancelReason(e.target.value); if (e.target.value !== '__other__') setCancelOtherText(''); }}
                  sx={{ borderRadius: 2 }}
                >
                  {cancelReasons.map((r) => (
                    <MenuItem key={r.id} value={String(r.id)}>{r.reason}</MenuItem>
                  ))}
                  <MenuItem value="__other__">Other</MenuItem>
                </Select>
              </FormControl>
            )}
            <AnimatePresence>
              {selectedCancelReason === '__other__' && (
                <motion.div key="other-input" initial={{ opacity:0, height:0, marginTop:0 }} animate={{ opacity:1, height:'auto', marginTop:16 }} exit={{ opacity:0, height:0, marginTop:0 }} transition={{ type:'spring', stiffness:300, damping:28 }} style={{ overflow:'hidden' }}>
                  <TextField fullWidth multiline minRows={2} maxRows={4} placeholder="Explain more…" value={cancelOtherText} onChange={(e) => setCancelOtherText(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 1.5, gap: 1, flexDirection: 'column' }}>
            <Button fullWidth variant="contained" color="error" size="large" disabled={!canSubmitCancel || canceling} startIcon={canceling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />} onClick={handleCancelWithReason} sx={{ height:50, borderRadius:2.5, fontWeight:700 }}>
              {canceling ? 'Cancelling…' : 'Cancel Ride'}
            </Button>
            <Divider sx={{ width:'100%', my:0.5 }}>
              <Typography variant="caption" color="text.disabled" sx={{ px:1 }}>or</Typography>
            </Divider>
            <Button fullWidth variant="text" size="medium" disabled={canceling} onClick={handleCancelRide} sx={{ height:44, borderRadius:2.5, fontWeight:600, color:'text.secondary', textTransform:'none', fontSize:'0.875rem', '&:hover':{ bgcolor:'action.hover' } }}>
              Cancel without reason
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ClientOnly>
  );
}