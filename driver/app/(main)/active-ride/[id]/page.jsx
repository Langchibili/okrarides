// // // 'use client';
// // // // PATH: driver/app/(main)/active-ride/[id]/page.jsx

// // // import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// // // import { useParams, useRouter } from 'next/navigation';
// // // import {
// // //   Box, AppBar, Toolbar, Typography, Button, Paper, IconButton, Avatar,
// // //   Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider,
// // //   LinearProgress, Dialog,
// // // } from '@mui/material';
// // // import {
// // //   ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
// // //   Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
// // //   Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
// // //   OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
// // //   AccessTime as TimerIcon, Map as MapIcon, Speed as SpeedIcon,
// // // } from '@mui/icons-material';
// // // import { motion, AnimatePresence } from 'framer-motion';
// // // import { useRide } from '@/lib/hooks/useRide';
// // // import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// // // import { formatCurrency, formatDateTime } from '@/Functions';
// // // import { apiClient } from '@/lib/api/client';
// // // import { useSocket } from '@/lib/socket/SocketProvider';
// // // import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
// // // import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// // // import MapIframe from '@/components/Map/MapIframe';

// // // const COMPLETE_TRIP_LOCK_MS = 60_000;

// // // function getPollingInterval(settings) {
// // //   const v = settings?.appsServerPollingIntervalInSeconds;
// // //   return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
// // // }

// // // // ─── Coordinate normalizer ────────────────────────────────────────────────────
// // // // Backend stores locations as { latitude, longitude }; map expects { lat, lng }.
// // // const normalizeCoords = (loc) => {
// // //   if (!loc) return null;
// // //   const lat = loc.lat ?? loc.latitude;
// // //   const lng = loc.lng ?? loc.longitude;
// // //   if (lat == null || lng == null) return null;
// // //   return { ...loc, lat, lng };
// // // };

// // // // ─── Distance / ETA helpers ───────────────────────────────────────────────────
// // // const deg2rad = (d) => d * (Math.PI / 180);
// // // const calculateDistance = (a, b) => {
// // //   if (!a || !b) return 0;
// // //   const lat1 = a.lat ?? a.latitude ?? 0, lat2 = b.lat ?? b.latitude ?? 0;
// // //   const lng1 = a.lng ?? a.longitude ?? 0, lng2 = b.lng ?? b.longitude ?? 0;
// // //   const R = 6371;
// // //   const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
// // //   const x = Math.sin(dLat / 2) ** 2 +
// // //     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
// // //   return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
// // // };
// // // const estimateDuration = (km) => Math.ceil((km / 30) * 60);
// // // const formatETA = (m) => {
// // //   if (!m && m !== 0) return 'Calculating…';
// // //   if (m < 1)  return 'Less than a minute';
// // //   if (m < 60) return `${m} min`;
// // //   const h = Math.floor(m / 60), r = m % 60;
// // //   return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
// // // };

// // // export default function ActiveRidePage() {
// // //   const params = useParams();
// // //   const router = useRouter();

// // //   const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
// // //   const { updateLocation } = useSocket();
// // //   const { isNative, getCurrentLocation, on: rnOn } = useReactNative();
// // //   const { emit, on: socketOn, off: socketOff } = useSocket();
// // //   const { isOkrapayEnabled, allowRidePaymentWithOkraPay, settings } = useAdminSettings();

// // //   const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;

// // //   // ── Core ride state ──────────────────────────────────────────────────────
// // //   const [ride,    setRide]    = useState(null);
// // //   const [loading, setLoading] = useState(true);

// // //   // ── Live-location state ──────────────────────────────────────────────────
// // //   const [driverLocation, setDriverLocation] = useState(null);
// // //   const [riderLocation,  setRiderLocation]  = useState(null);
// // //   const [eta,            setEta]            = useState(null);
// // //   const [distance,       setDistance]       = useState(null);

// // //   // ── Navigation popup / full-screen map ──────────────────────────────────
// // //   const [showNavPopup,      setShowNavPopup]      = useState(false);
// // //   const [showFullScreenMap, setShowFullScreenMap] = useState(false);

// // //   // ── Map control refs ─────────────────────────────────────────────────────
// // //   const mapControlsRef          = useRef(null);
// // //   const fullScreenMapControlsRef = useRef(null);

// // //   // ── Payment lock ─────────────────────────────────────────────────────────
// // //   const [paymentRequested,        setPaymentRequested]        = useState(false);
// // //   const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);

// // //   // ── Interval / timer refs ────────────────────────────────────────────────
// // //   const lockTimerRef    = useRef(null);
// // //   const countdownRef    = useRef(null);
// // //   const pollingRef      = useRef(null);
// // //   const locationPollRef = useRef(null);
// // //   const mountedRef      = useRef(true);

// // //   useEffect(() => {
// // //     mountedRef.current = true;
// // //     return () => {
// // //       mountedRef.current = false;
// // //       clearTimeout(lockTimerRef.current);
// // //       clearInterval(countdownRef.current);
// // //       clearInterval(pollingRef.current);
// // //       clearInterval(locationPollRef.current);
// // //     };
// // //   }, []);

// // //   // ── Load ride ────────────────────────────────────────────────────────────
// // //   const loadRideDetails = useCallback(async () => {
// // //     try {
// // //       const response = await apiClient.get(`/rides/${params.id}`);
// // //       if (response?.data && mountedRef.current) {
// // //         const rideData = response.data;
// // //         // Seed the map with last-known backend location (latitude/longitude shape)
// // //         if (rideData.currentDriverLocation) {
// // //           const norm = normalizeCoords(rideData.currentDriverLocation);
// // //           if (norm) setDriverLocation(norm);
// // //         }
// // //         setRide(rideData);
// // //       }
// // //     } catch (error) {
// // //       console.error('Error loading ride:', error);
// // //     } finally {
// // //       if (mountedRef.current) setLoading(false);
// // //     }
// // //   }, [params.id]);

// // //   useEffect(() => { loadRideDetails(); }, [loadRideDetails]);

// // //   // ── Status polling (server-driven ride state) ────────────────────────────
// // //   useEffect(() => {
// // //     if (!ride?.id) return;
// // //     const ACTIVE = ['accepted', 'arrived', 'passenger_onboard', 'awaiting_payment'];
// // //     if (!ACTIVE.includes(ride.rideStatus)) return;

// // //     const interval = getPollingInterval(settings);

// // //     pollingRef.current = setInterval(async () => {
// // //       if (!mountedRef.current) return;
// // //       try {
// // //         const res = await apiClient.get(`/rides/${ride.id}?populate=rider,vehicle`);
// // //         const backend = res?.data;
// // //         if (!backend || !mountedRef.current) return;
// // //         if (backend.paymentStatus === 'completed' || backend.rideStatus === 'completed') {
// // //           clearInterval(pollingRef.current);
// // //           router.push('/home');
// // //           return;
// // //         }
// // //         setRide(prev => prev ? { ...prev, ...backend } : prev);
// // //       } catch (err) {
// // //         console.error('[ActiveRide] poll error:', err);
// // //       }
// // //     }, interval);

// // //     return () => clearInterval(pollingRef.current);
// // //   // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, [ride?.id, ride?.rideStatus, settings]);

// // //   // ── 2-second live location + ETA polling ────────────────────────────────
// // //   //
// // //   // Every 2 seconds:
// // //   //   • Fetch driver's currentLocation from the backend (by driver.id)
// // //   //   • During 'accepted':  also fetch rider's location → ETA driver → rider
// // //   //   • During 'passenger_onboard' / 'awaiting_payment':
// // //   //       ETA driver → dropoff  (rider may be offline — only use driver coords)
// // //   //   • Also emit driver location over socket so the rider tracking page updates
// // //   //   • During in-progress: pan main map to driver with no zoom change
// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   const rideStatus = ride?.rideStatus;

// // //   useEffect(() => {
// // //     if (!ride || ['completed', 'cancelled'].includes(rideStatus)) return;

// // //     const updateLocations = async () => {
// // //       if (!mountedRef.current) return;
// // //       try {
// // //         // ── Driver location ──────────────────────────────────────────────
// // //         const driverRes = await apiClient.get(`/users/${ride.driver?.id}`);
// // //         const rawDriver = driverRes?.data?.currentLocation ?? driverRes?.currentLocation;
// // //         const driverLoc = normalizeCoords(rawDriver);

// // //         if (driverLoc && mountedRef.current) {
// // //           setDriverLocation(driverLoc);
// // //           // Keep the rider's tracking page updated via socket
// // //           updateLocation(driverLoc, rawDriver?.heading || 0, rawDriver?.speed || 0);
// // //         }

// // //         // ── During 'accepted': show driver approaching rider's pickup ────
// // //         if (rideStatus === 'accepted' && driverLoc) {
// // //           const riderRes = await apiClient.get(`/users/${ride.rider?.id}`);
// // //           const rawRider = riderRes?.data?.currentLocation ?? riderRes?.currentLocation;
// // //           const riderLoc = normalizeCoords(rawRider);
// // //           if (riderLoc && mountedRef.current) setRiderLocation(riderLoc);

// // //           // ETA: driver → rider's current position (or static pickup as fallback)
// // //           const dest = riderLoc ?? normalizeCoords(ride.pickupLocation);
// // //           if (dest) {
// // //             const dist = calculateDistance(driverLoc, dest);
// // //             if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
// // //           }
// // //         }

// // //         // ── During 'passenger_onboard' / 'awaiting_payment': ─────────────
// // //         //    ETA driver → dropoff (rider may be offline — driver location only)
// // //         if ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && driverLoc) {
// // //           const dropoff = normalizeCoords(ride.dropoffLocation);
// // //           if (dropoff) {
// // //             const dist = calculateDistance(driverLoc, dropoff);
// // //             if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
// // //           }
// // //           // Pan main map to driver — pass undefined zoom so IframeMap keeps the
// // //           // current zoom level (only center changes, no zoom animation).
// // //           if (mapControlsRef.current) {
// // //             mapControlsRef.current.animateToLocation(driverLoc);
// // //           }
// // //           // Keep full-screen map (if open) zoomed in on driver at z=20
// // //           if (fullScreenMapControlsRef.current) {
// // //             fullScreenMapControlsRef.current.animateToLocation(driverLoc, 20);
// // //           }
// // //         }
// // //       } catch (err) {
// // //         console.error('[ActiveRide] location update error:', err);
// // //       }
// // //     };

// // //     updateLocations(); // run immediately on mount / status change
// // //     locationPollRef.current = setInterval(updateLocations, 2000);
// // //     return () => clearInterval(locationPollRef.current);
// // //   // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, [ride?.id, rideStatus, ride?.driver?.id, ride?.rider?.id]);

// // //   // ── Map markers + route props ─────────────────────────────────────────────
// // //   //
// // //   // We compute three things here:
// // //   //   mapPickup    → passed as `pickupLocation` to MapIframe → route START
// // //   //   mapDropoff   → passed as `dropoffLocation` to MapIframe → route END
// // //   //   markers      → explicit marker overrides (driver car, rider pin, etc.)
// // //   //
// // //   // Because IframeMap auto-adds 'pickup' and 'dropoff' id markers from the
// // //   // pickupLocation / dropoffLocation props, we override both in the explicit
// // //   // markers array (same id → last write wins in the iframe marker map).
// // //   // ─────────────────────────────────────────────────────────────────────────
// // //   const { mapPickup, mapDropoff, mapShowRoute, markers } = useMemo(() => {
// // //     const dNorm = driverLocation;
// // //     const rNorm = riderLocation;
// // //     const pickup = normalizeCoords(ride?.pickupLocation);
// // //     const dropoff = normalizeCoords(ride?.dropoffLocation);

// // //     if (rideStatus === 'accepted') {
// // //       // Route: driver → rider's current position (or static pickup as fallback)
// // //       const dest = rNorm ?? pickup;
// // //       return {
// // //         mapPickup:   dNorm ?? pickup,
// // //         mapDropoff:  dest,
// // //         mapShowRoute: !!(dNorm && dest),
// // //         markers: [
// // //           // Override the auto-'pickup' marker (at driverLocation) with a car icon
// // //           ...(dNorm ? [{ id: 'pickup', position: dNorm, type: 'driver' }] : []),
// // //           // Override the auto-'dropoff' marker (at dest) with a pickup pin
// // //           ...(dest  ? [{ id: 'dropoff', position: dest,  type: 'pickup' }] : []),
// // //           // Also show rider's LIVE position as a small pulse dot (if available)
// // //           ...(rNorm ? [{ id: 'rider',   position: rNorm, type: 'current' }] : []),
// // //         ],
// // //       };
// // //     }

// // //     if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') {
// // //       // Route: driver (live) → dropoff. Rider is in the car — only driver matters.
// // //       return {
// // //         mapPickup:   dNorm ?? pickup,
// // //         mapDropoff:  dropoff,
// // //         mapShowRoute: true,
// // //         markers: [
// // //           ...(dNorm   ? [{ id: 'pickup',  position: dNorm,  type: 'driver'  }] : []),
// // //           ...(dropoff ? [{ id: 'dropoff', position: dropoff, type: 'dropoff' }] : []),
// // //         ],
// // //       };
// // //     }

// // //     // 'arrived' (and any other status): show static pickup, driver bouncing
// // //     return {
// // //       mapPickup:   pickup,
// // //       mapDropoff:  null,
// // //       mapShowRoute: false,
// // //       markers: [
// // //         ...(dNorm  ? [{ id: 'driver', position: dNorm,  type: 'driver',  animation: 'BOUNCE' }] : []),
// // //         ...(pickup ? [{ id: 'pickup', position: pickup, type: 'pickup' }] : []),
// // //       ],
// // //     };
// // //   }, [
// // //     rideStatus,
// // //     driverLocation?.lat, driverLocation?.lng,
// // //     riderLocation?.lat,  riderLocation?.lng,
// // //     ride?.pickupLocation?.lat,  ride?.pickupLocation?.lng,
// // //     ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng,
// // //   ]);

// // //   // ── PAYMENT_RECEIVED — three listeners (RN bridge, window.message, socket) ─
// // //   useEffect(() => {
// // //     const unsub = rnOn('PAYMENT_RECEIVED', (payload) => {
// // //       if (payload?.rideId && String(payload.rideId) !== String(params.id)) return;
// // //       clearTimeout(lockTimerRef.current);
// // //       clearInterval(countdownRef.current);
// // //       clearInterval(pollingRef.current);
// // //       router.push('/home');
// // //     });
// // //     return () => unsub?.();
// // //   }, [rnOn, params.id, router]);

// // //   useEffect(() => {
// // //     const handler = (event) => {
// // //       try {
// // //         const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
// // //         if (msg?.type !== 'PAYMENT_RECEIVED') return;
// // //         if (msg.payload?.rideId && String(msg.payload.rideId) !== String(params.id)) return;
// // //         clearTimeout(lockTimerRef.current);
// // //         clearInterval(countdownRef.current);
// // //         clearInterval(pollingRef.current);
// // //         router.push('/home');
// // //       } catch {}
// // //     };
// // //     window.addEventListener('message', handler);
// // //     return () => window.removeEventListener('message', handler);
// // //   }, [params.id, router]);

// // //   useEffect(() => {
// // //     const handlePaymentReceived = (data) => {
// // //       if (data.rideId && String(data.rideId) !== String(params.id)) return;
// // //       clearTimeout(lockTimerRef.current);
// // //       clearInterval(countdownRef.current);
// // //       clearInterval(pollingRef.current);
// // //       router.push('/home');
// // //     };
// // //     socketOn(SOCKET_EVENTS.PAYMENT.RECEIVED, handlePaymentReceived);
// // //     return () => socketOff(SOCKET_EVENTS.PAYMENT.RECEIVED);
// // //   }, [socketOn, socketOff, params.id, router]);

// // //   // ── Request payment ──────────────────────────────────────────────────────
// // //   const handleRequestPayment = useCallback(() => {
// // //     try {
// // //       emit(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, {
// // //         rideId:    ride.id,
// // //         driverId:  ride.driver?.id,
// // //         riderId:   ride.rider?.id,
// // //         finalFare: ride.totalFare,
// // //       });
// // //       setPaymentRequested(true);
// // //       setCompleteLockSecondsLeft(Math.round(COMPLETE_TRIP_LOCK_MS / 1000));

// // //       countdownRef.current = setInterval(() => {
// // //         setCompleteLockSecondsLeft(prev => {
// // //           if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
// // //           return prev - 1;
// // //         });
// // //       }, 1000);

// // //       lockTimerRef.current = setTimeout(() => {
// // //         setCompleteLockSecondsLeft(0);
// // //         setPaymentRequested(false);
// // //       }, COMPLETE_TRIP_LOCK_MS);
// // //     } catch (err) {
// // //       console.error('Error requesting payment:', err);
// // //     }
// // //   }, [emit, ride]);

// // //   const completeTripLocked = completeLockSecondsLeft > 0;

// // //   const handleStartTrip = async () => {
// // //     try { await startTrip(ride.id); loadRideDetails(); }
// // //     catch (err) { console.error('Error starting trip:', err); }
// // //   };

// // //   const handleCompleteTrip = async () => {
// // //     if (completeTripLocked) return;
// // //     if (!window.confirm('Complete this ride?')) return;
// // //     try {
// // //       await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration });
// // //       router.push('/home');
// // //     } catch (err) { console.error('Error completing trip:', err); }
// // //   };

// // //   const handleConfirmArrival = async () => {
// // //     try { await confirmArrival(ride.id); loadRideDetails(); }
// // //     catch (err) { console.error('Error confirming arrival:', err); }
// // //   };

// // //   // ── Navigate button: toggles the popup ──────────────────────────────────
// // //   const handleNavigate = () => setShowNavPopup(prev => !prev);

// // //   const handleCallRider    = () => ride?.rider?.phoneNumber && (window.location.href = `tel:${ride.rider.phoneNumber}`);
// // //   const handleMessageRider = () => ride?.rider?.phoneNumber && (window.location.href = `sms:${ride.rider.phoneNumber}`);

// // //   // Google Maps deep-link: navigate to current destination
// // //   const handleOpenInGoogleMaps = () => {
// // //     const dest = (rideStatus === 'accepted' || rideStatus === 'arrived')
// // //       ? (riderLocation ?? normalizeCoords(ride?.pickupLocation))
// // //       : normalizeCoords(ride?.dropoffLocation);
// // //     if (dest?.lat && dest?.lng)
// // //       window.open(
// // //         `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`,
// // //         '_blank',
// // //       );
// // //   };

// // //   const getStatusColor = (s) => ({
// // //     completed: 'success', cancelled: 'error', passenger_onboard: 'primary',
// // //     arrived: 'success', accepted: 'info', awaiting_payment: 'warning',
// // //   }[s] || 'default');

// // //   if (loading || !ride) {
// // //     return (
// // //       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
// // //         <CircularProgress />
// // //       </Box>
// // //     );
// // //   }

// // //   return (
// // //     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

// // //       {/* AppBar */}
// // //       <AppBar position="static" elevation={0}>
// // //         <Toolbar>
// // //           <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
// // //           <Typography variant="h6" sx={{ flex: 1 }}>Active Ride</Typography>
// // //           <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color: 'white', mr: 1 }} />
// // //         </Toolbar>
// // //       </AppBar>

// // //       {/* ── Map ──────────────────────────────────────────────────────────── */}
// // //       <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
// // //         <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
// // //           <MapIframe
// // //             center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
// // //             zoom={15}
// // //             height="100%"
// // //             markers={markers}
// // //             pickupLocation={mapPickup}
// // //             dropoffLocation={mapDropoff}
// // //             showRoute={mapShowRoute}
// // //             onMapLoad={(c) => { mapControlsRef.current = c; }}
// // //           />
// // //         </Box>

// // //         {/* ── Navigate button + popup ──────────────────────────────────── */}
// // //         <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
// // //           <AnimatePresence>
// // //             {showNavPopup && (
// // //               <motion.div
// // //                 key="nav-popup"
// // //                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
// // //                 animate={{ opacity: 1, y: 0, scale: 1 }}
// // //                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
// // //                 transition={{ type: 'spring', stiffness: 340, damping: 28 }}
// // //                 style={{ marginBottom: 10 }}
// // //               >
// // //                 <Paper elevation={10} sx={{ borderRadius: 3, overflow: 'hidden', minWidth: 192, border: '1px solid', borderColor: 'divider' }}>
// // //                   {/* In App */}
// // //                   <Button
// // //                     fullWidth
// // //                     startIcon={<MapIcon />}
// // //                     onClick={() => { setShowNavPopup(false); setShowFullScreenMap(true); }}
// // //                     sx={{
// // //                       justifyContent: 'flex-start', px: 2.5, py: 1.5,
// // //                       fontWeight: 700, textTransform: 'none', borderRadius: 0,
// // //                       borderBottom: '1px solid', borderColor: 'divider',
// // //                     }}
// // //                   >
// // //                     In App
// // //                   </Button>
// // //                   {/* Use Google Maps */}
// // //                   <Button
// // //                     fullWidth
// // //                     startIcon={<OpenInNewIcon />}
// // //                     onClick={() => { setShowNavPopup(false); handleOpenInGoogleMaps(); }}
// // //                     sx={{ justifyContent: 'flex-start', px: 2.5, py: 1.5, fontWeight: 700, textTransform: 'none', borderRadius: 0 }}
// // //                   >
// // //                     Use Google Maps
// // //                   </Button>
// // //                 </Paper>
// // //               </motion.div>
// // //             )}
// // //           </AnimatePresence>

// // //           <Fab
// // //             variant="extended"
// // //             color="primary"
// // //             sx={{ borderRadius: '24px' }}
// // //             onClick={handleNavigate}
// // //           >
// // //             <NavigationIcon sx={{ mr: 1 }} />
// // //             Directions
// // //           </Fab>
// // //         </Box>
// // //       </Box>

// // //       {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
// // //       <Paper elevation={8} sx={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60vh', overflow: 'auto' }}>
// // //         <Box sx={{ p: 3 }}>

// // //           {/* ── ETA / progress banner ─────────────────────────────────────
// // //               Shown during 'accepted' (green) and 'passenger_onboard' (amber).
// // //               Mirrors the same banner shown on the rider's tracking page.
// // //           ── */}
// // //           <AnimatePresence>
// // //             {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && (
// // //               <motion.div
// // //                 key={rideStatus + '-eta-banner'}
// // //                 initial={{ opacity: 0, y: 12 }}
// // //                 animate={{ opacity: 1, y: 0 }}
// // //                 exit={{ opacity: 0, y: -12 }}
// // //                 transition={{ type: 'spring', stiffness: 280, damping: 24 }}
// // //               >
// // //                 <Box sx={{
// // //                   p: 2, borderRadius: 3, mb: 2,
// // //                   background: rideStatus === 'accepted'
// // //                     ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)'
// // //                     : 'linear-gradient(135deg, rgba(255,193,7,0.12) 0%, rgba(255,140,0,0.06) 100%)',
// // //                   border: '1px solid',
// // //                   borderColor: rideStatus === 'accepted' ? 'rgba(16,185,129,0.25)' : 'rgba(255,193,7,0.25)',
// // //                 }}>
// // //                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
// // //                     <SpeedIcon sx={{ fontSize: 18, color: rideStatus === 'accepted' ? '#10B981' : '#FF8C00' }} />
// // //                     <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
// // //                       {rideStatus === 'accepted' ? 'Heading to Pickup' : 'Trip in Progress'}
// // //                     </Typography>
// // //                   </Box>
// // //                   <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta != null ? 1.5 : 0 }}>
// // //                     {rideStatus === 'accepted'
// // //                       ? 'Drive to the pickup location to collect your rider.'
// // //                       : "Keep going — you're on your way to the destination!"}
// // //                   </Typography>
// // //                   {eta != null && (
// // //                     <Box>
// // //                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
// // //                         <Typography variant="caption" sx={{ fontWeight: 600 }}>
// // //                           {rideStatus === 'accepted' ? 'ETA to Pickup' : 'ETA to Destination'}
// // //                         </Typography>
// // //                         <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
// // //                           {distance != null && (
// // //                             <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
// // //                               {distance.toFixed(1)} km
// // //                             </Typography>
// // //                           )}
// // //                           <Typography variant="caption" sx={{
// // //                             fontWeight: 800,
// // //                             color: rideStatus === 'accepted' ? '#10B981' : '#FF8C00',
// // //                           }}>
// // //                             {formatETA(eta)}
// // //                           </Typography>
// // //                         </Box>
// // //                       </Box>
// // //                       <LinearProgress
// // //                         variant="indeterminate"
// // //                         sx={{
// // //                           borderRadius: 2, height: 5,
// // //                           bgcolor: rideStatus === 'accepted'
// // //                             ? 'rgba(16,185,129,0.15)' : 'rgba(255,193,7,0.15)',
// // //                           '& .MuiLinearProgress-bar': {
// // //                             background: rideStatus === 'accepted'
// // //                               ? 'linear-gradient(90deg, #10B981, #059669)'
// // //                               : 'linear-gradient(90deg, #FFC107, #FF8C00)',
// // //                           },
// // //                         }}
// // //                       />
// // //                     </Box>
// // //                   )}
// // //                 </Box>
// // //               </motion.div>
// // //             )}
// // //           </AnimatePresence>

// // //           {/* Rider Info */}
// // //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// // //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Rider Information</Typography>
// // //             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
// // //               <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.secondary' }}>
// // //                 {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
// // //               </Avatar>
// // //               <Box sx={{ flex: 1 }}>
// // //                 <Typography variant="h6" sx={{ fontWeight: 600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
// // //                 <Typography variant="body2" color="text.secondary">{(() => {
// // //                   const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// // //                     ? ride?.rider?.username
// // //                     : ride?.rider?.phoneNumber;
// // //                   const digits = raw.replace(/\D/g, '');
// // //                   return digits.length > 10 ? digits.slice(-10) : digits;
// // //                 })()}</Typography>
// // //                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
// // //                   <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
// // //                   <Typography variant="body2">
// // //                     {ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides
// // //                   </Typography>
// // //                 </Box>
// // //               </Box>
// // //               <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
// // //                 <IconButton
// // //                   onClick={() => {
// // //                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// // //                       ? ride?.rider?.username
// // //                       : ride?.rider?.phoneNumber;
// // //                     const digits = raw.replace(/\D/g, '');
// // //                     const phone = digits.length > 10 ? digits.slice(-10) : digits;
// // //                     window.location.href = `tel:${phone}`;
// // //                   }}
// // //                   sx={{ bgcolor: 'success.main', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
// // //                 >
// // //                   <PhoneIcon sx={{ fontSize: 18 }} />
// // //                 </IconButton>
// // //                 <IconButton
// // //                   onClick={() => {
// // //                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// // //                       ? ride?.rider?.username
// // //                       : ride?.rider?.phoneNumber;
// // //                     const phone = raw.replace(/\D/g, '');
// // //                     window.open(`https://wa.me/${phone}`, '_blank');
// // //                   }}
// // //                   sx={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#000', width: 40, height: 40, '&:hover': { transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
// // //                 >
// // //                   <MessageIcon sx={{ fontSize: 18 }} />
// // //                 </IconButton>
// // //               </Box>
// // //             </Box>
// // //           </Paper>

// // //           {/* Trip Details */}
// // //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// // //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Details</Typography>
// // //             <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
// // //               <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
// // //                 <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
// // //               </Box>
// // //               <Box sx={{ flex: 1 }}>
// // //                 <Typography variant="caption" color="text.secondary">PICKUP</Typography>
// // //                 <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.pickupLocation?.address}</Typography>
// // //               </Box>
// // //             </Box>
// // //             <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />
// // //             <Box sx={{ display: 'flex', gap: 2 }}>
// // //               <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
// // //                 <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
// // //               </Box>
// // //               <Box sx={{ flex: 1 }}>
// // //                 <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
// // //                 <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.dropoffLocation?.address}</Typography>
// // //               </Box>
// // //             </Box>
// // //           </Paper>

// // //           {/* Fare */}
// // //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// // //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}><ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Fare</Typography>
// // //             <List disablePadding>
// // //               {ride.baseFare     != null && <ListItem sx={{ px: 0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
// // //               {ride.distanceFare != null && <ListItem sx={{ px: 0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
// // //               {ride.surgeFare    >  0    && <ListItem sx={{ px: 0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
// // //               {ride.promoDiscount > 0    && <ListItem sx={{ px: 0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
// // //               <Divider sx={{ my: 1 }} />
// // //               <ListItem sx={{ px: 0 }}>
// // //                 <ListItemText primary="Total" primaryTypographyProps={{ fontWeight: 600 }} />
// // //                 <Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography>
// // //               </ListItem>
// // //               <ListItem sx={{ px: 0 }}>
// // //                 <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }} />
// // //                 <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
// // //                   {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
// // //                 </Typography>
// // //               </ListItem>
// // //             </List>
// // //             <Chip label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`} sx={{ mt: 2, fontWeight: 600 }} />
// // //           </Paper>

// // //           {/* Trip Stats */}
// // //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// // //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Statistics</Typography>
// // //             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
// // //               <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
// // //                 <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km</Typography>
// // //                 <Typography variant="caption" color="text.secondary">Distance</Typography>
// // //               </Box>
// // //               <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
// // //                 <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>{formatETA(ride.actualDuration ?? ride.estimatedDuration)}</Typography>
// // //                 <Typography variant="caption" color="text.secondary">Duration</Typography>
// // //               </Box>
// // //             </Box>
// // //           </Paper>

// // //           {/* Action Buttons */}
// // //           {ride.rideStatus === 'accepted' && (
// // //             <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival}
// // //               sx={{ height: 56, fontWeight: 700, borderRadius: 3, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' }, mb: 1 }}>
// // //               I've Arrived at Pickup
// // //             </Button>
// // //           )}

// // //           {ride.rideStatus === 'arrived' && (
// // //             <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />}
// // //               sx={{ height: 56, fontWeight: 700, borderRadius: 3, mb: 1 }}>
// // //               Start Trip
// // //             </Button>
// // //           )}

// // //           {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
// // //             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

// // //               {okrapayAllowedForRides && (
// // //                 <Button fullWidth variant="contained" size="large"
// // //                   onClick={handleRequestPayment}
// // //                   disabled={paymentRequested && completeLockSecondsLeft > 0}
// // //                   startIcon={<PaymentIcon />}
// // //                   sx={{
// // //                     height: 56, fontWeight: 700, borderRadius: 3,
// // //                     bgcolor:  (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.main',
// // //                     '&:hover': { bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.dark' },
// // //                     '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
// // //                   }}>
// // //                   {(paymentRequested && completeLockSecondsLeft > 0)
// // //                     ? `Payment Requested ✓  (${completeLockSecondsLeft}s)`
// // //                     : 'Request Payment'}
// // //                 </Button>
// // //               )}

// // //               {completeTripLocked && (
// // //                 <Box>
// // //                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
// // //                     <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
// // //                     <Typography variant="caption" color="text.secondary">
// // //                       Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay
// // //                     </Typography>
// // //                   </Box>
// // //                   <LinearProgress
// // //                     variant="determinate"
// // //                     value={((COMPLETE_TRIP_LOCK_MS / 1000 - completeLockSecondsLeft) / (COMPLETE_TRIP_LOCK_MS / 1000)) * 100}
// // //                     sx={{ borderRadius: 1, height: 6, bgcolor: 'warning.light', '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' } }}
// // //                   />
// // //                 </Box>
// // //               )}

// // //               {ride.rideStatus === 'awaiting_payment' && (
// // //                 <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius: 2 }}>
// // //                   Waiting for rider to complete payment…
// // //                 </Alert>
// // //               )}

// // //               <Button fullWidth variant="contained" color="success" size="large"
// // //                 onClick={handleCompleteTrip}
// // //                 disabled={completeTripLocked}
// // //                 startIcon={<CheckIcon />}
// // //                 sx={{ height: 56, fontWeight: 700, borderRadius: 3, opacity: completeTripLocked ? 0.5 : 1 }}>
// // //                 Complete Trip
// // //               </Button>
// // //             </Box>
// // //           )}

// // //           {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
// // //             <Button fullWidth variant="outlined" color="error"
// // //               sx={{ height: 48, borderRadius: 3, fontWeight: 600, borderWidth: 2, mt: 1, '&:hover': { borderWidth: 2 } }}
// // //               onClick={async () => {
// // //                 const reason = window.prompt('Reason for cancellation:');
// // //                 if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
// // //               }}>
// // //               Cancel Ride
// // //             </Button>
// // //           )}
// // //         </Box>
// // //       </Paper>

// // //       {/* ── Full-screen in-app map modal ─────────────────────────────────── */}
// // //       {/* Opens when driver chooses "In App" from the navigation popup.
// // //           Zoom = 20, centered on driver's live position, route is active.
// // //           Only a close button at the bottom. */}
// // //       <Dialog fullScreen open={showFullScreenMap} onClose={() => setShowFullScreenMap(false)}>
// // //         <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000' }}>
// // //           <MapIframe
// // //             center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
// // //             zoom={20}
// // //             height="100%"
// // //             markers={markers}
// // //             pickupLocation={mapPickup}
// // //             dropoffLocation={mapDropoff}
// // //             showRoute={mapShowRoute}
// // //             onMapLoad={(c) => {
// // //               fullScreenMapControlsRef.current = c;
// // //               // After the map boots, fly to the driver's current position at z=20
// // //               if (driverLocation) {
// // //                 setTimeout(() => {
// // //                   fullScreenMapControlsRef.current?.animateToLocation(driverLocation, 20);
// // //                 }, 700);
// // //               }
// // //             }}
// // //           />
// // //           {/* Close button — bottom-center, above the map */}
// // //           <Box sx={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
// // //             <Button
// // //               variant="contained"
// // //               size="large"
// // //               startIcon={<CloseIcon />}
// // //               onClick={() => setShowFullScreenMap(false)}
// // //               sx={{
// // //                 height: 52, px: 5, borderRadius: 3.5, fontWeight: 700,
// // //                 bgcolor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)',
// // //                 color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
// // //                 boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
// // //                 '&:hover': { bgcolor: 'rgba(0,0,0,0.92)' },
// // //               }}
// // //             >
// // //               Close Map
// // //             </Button>
// // //           </Box>
// // //         </Box>
// // //       </Dialog>

// // //       {/* Transparent backdrop to dismiss nav popup when tapping elsewhere */}
// // //       {showNavPopup && (
// // //         <Box
// // //           sx={{ position: 'fixed', inset: 0, zIndex: 9 }}
// // //           onClick={() => setShowNavPopup(false)}
// // //         />
// // //       )}
// // //     </Box>
// // //   );
// // // }
// // 'use client';
// // // PATH: driver/app/(main)/active-ride/[id]/page.jsx

// // import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// // import { useParams, useRouter } from 'next/navigation';
// // import {
// //   Box, AppBar, Toolbar, Typography, Button, Paper, IconButton, Avatar,
// //   Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider,
// //   LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
// // } from '@mui/material';
// // import {
// //   ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
// //   Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
// //   Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
// //   OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
// //   AccessTime as TimerIcon, Map as MapIcon, Speed as SpeedIcon,
// // } from '@mui/icons-material';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { useRide } from '@/lib/hooks/useRide';
// // import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// // import { formatCurrency, formatDateTime } from '@/Functions';
// // import { apiClient } from '@/lib/api/client';
// // import { useSocket } from '@/lib/socket/SocketProvider';
// // import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
// // import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// // import MapIframe from '@/components/Map/MapIframe';

// // const COMPLETE_TRIP_LOCK_MS = 60_000;

// // function getPollingInterval(settings) {
// //   const v = settings?.appsServerPollingIntervalInSeconds;
// //   return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
// // }

// // // ─── Coordinate normalizer ────────────────────────────────────────────────────
// // // Backend stores locations as { latitude, longitude }; map expects { lat, lng }.
// // const normalizeCoords = (loc) => {
// //   if (!loc) return null;
// //   const lat = loc.lat ?? loc.latitude;
// //   const lng = loc.lng ?? loc.longitude;
// //   if (lat == null || lng == null) return null;
// //   return { ...loc, lat, lng };
// // };

// // // ─── Distance / ETA helpers ───────────────────────────────────────────────────
// // const deg2rad = (d) => d * (Math.PI / 180);
// // const calculateDistance = (a, b) => {
// //   if (!a || !b) return 0;
// //   const lat1 = a.lat ?? a.latitude ?? 0, lat2 = b.lat ?? b.latitude ?? 0;
// //   const lng1 = a.lng ?? a.longitude ?? 0, lng2 = b.lng ?? b.longitude ?? 0;
// //   const R = 6371;
// //   const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
// //   const x = Math.sin(dLat / 2) ** 2 +
// //     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
// //   return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
// // };
// // const estimateDuration = (km) => Math.ceil((km / 30) * 60);
// // const formatETA = (m) => {
// //   if (!m && m !== 0) return 'Calculating…';
// //   if (m < 1)  return 'Less than a minute';
// //   if (m < 60) return `${m} min`;
// //   const h = Math.floor(m / 60), r = m % 60;
// //   return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
// // };

// // export default function ActiveRidePage() {
// //   const params = useParams();
// //   const router = useRouter();

// //   const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
// //   const { updateLocation } = useSocket();
// //   const { isNative, getCurrentLocation, on: rnOn } = useReactNative();
// //   const { emit, on: socketOn, off: socketOff } = useSocket();
// //   const { isOkrapayEnabled, allowRidePaymentWithOkraPay, settings } = useAdminSettings();

// //   const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;

// //   // ── Core ride state ──────────────────────────────────────────────────────
// //   const [ride,    setRide]    = useState(null);
// //   const [loading, setLoading] = useState(true);

// //   // ── Live-location state ──────────────────────────────────────────────────
// //   const [driverLocation, setDriverLocation] = useState(null);
// //   const [riderLocation,  setRiderLocation]  = useState(null);
// //   const [eta,            setEta]            = useState(null);
// //   const [distance,       setDistance]       = useState(null);

// //   // ── Navigation popup / full-screen map ──────────────────────────────────
// //   const [showNavPopup,      setShowNavPopup]      = useState(false);
// //   const [showFullScreenMap, setShowFullScreenMap] = useState(false);

// //   // ── Complete trip confirmation dialog ────────────────────────────────────
// //   const [showCompleteDialog, setShowCompleteDialog] = useState(false);
// //   const [completing,         setCompleting]         = useState(false);

// //   // ── Map control refs ─────────────────────────────────────────────────────
// //   const mapControlsRef           = useRef(null);
// //   const fullScreenMapControlsRef = useRef(null);
// //   // Tracks whether the full-screen map has done its initial fly-to.
// //   // Prevents re-zooming on every 2-second location tick after first open.
// //   const fullScreenMapInitializedRef = useRef(false);

// //   // ── Payment lock ─────────────────────────────────────────────────────────
// //   const [paymentRequested,        setPaymentRequested]        = useState(false);
// //   const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);

// //   // ── Interval / timer refs ────────────────────────────────────────────────
// //   const lockTimerRef    = useRef(null);
// //   const countdownRef    = useRef(null);
// //   const pollingRef      = useRef(null);
// //   const locationPollRef = useRef(null);
// //   const mountedRef      = useRef(true);

// //   useEffect(() => {
// //     mountedRef.current = true;
// //     return () => {
// //       mountedRef.current = false;
// //       clearTimeout(lockTimerRef.current);
// //       clearInterval(countdownRef.current);
// //       clearInterval(pollingRef.current);
// //       clearInterval(locationPollRef.current);
// //     };
// //   }, []);

// //   // ── Load ride ────────────────────────────────────────────────────────────
// //   const loadRideDetails = useCallback(async () => {
// //     try {
// //       const response = await apiClient.get(`/rides/${params.id}`);
// //       if (response?.data && mountedRef.current) {
// //         const rideData = response.data;
// //         // Seed the map with last-known backend location (latitude/longitude shape)
// //         if (rideData.currentDriverLocation) {
// //           const norm = normalizeCoords(rideData.currentDriverLocation);
// //           if (norm) setDriverLocation(norm);
// //         }
// //         setRide(rideData);
// //       }
// //     } catch (error) {
// //       console.error('Error loading ride:', error);
// //     } finally {
// //       if (mountedRef.current) setLoading(false);
// //     }
// //   }, [params.id]);

// //   useEffect(() => { loadRideDetails(); }, [loadRideDetails]);

// //   // ── Status polling (server-driven ride state) ────────────────────────────
// //   useEffect(() => {
// //     if (!ride?.id) return;
// //     const ACTIVE = ['accepted', 'arrived', 'passenger_onboard', 'awaiting_payment'];
// //     if (!ACTIVE.includes(ride.rideStatus)) return;

// //     const interval = getPollingInterval(settings);

// //     pollingRef.current = setInterval(async () => {
// //       if (!mountedRef.current) return;
// //       try {
// //         const res = await apiClient.get(`/rides/${ride.id}?populate=rider,vehicle`);
// //         const backend = res?.data;
// //         if (!backend || !mountedRef.current) return;
// //         if (backend.paymentStatus === 'completed' || backend.rideStatus === 'completed') {
// //           clearInterval(pollingRef.current);
// //           router.push('/home');
// //           return;
// //         }
// //         setRide(prev => prev ? { ...prev, ...backend } : prev);
// //       } catch (err) {
// //         console.error('[ActiveRide] poll error:', err);
// //       }
// //     }, interval);

// //     return () => clearInterval(pollingRef.current);
// //   // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [ride?.id, ride?.rideStatus, settings]);

// //   // ── 2-second live location + ETA polling ────────────────────────────────
// //   //
// //   // Every 2 seconds:
// //   //   • Fetch driver's currentLocation from the backend (by driver.id)
// //   //   • During 'accepted':  also fetch rider's location → ETA driver → rider
// //   //   • During 'passenger_onboard' / 'awaiting_payment':
// //   //       ETA driver → dropoff  (rider may be offline — only use driver coords)
// //   //   • Also emit driver location over socket so the rider tracking page updates
// //   //   • During in-progress: pan main map to driver with no zoom change
// //   // ─────────────────────────────────────────────────────────────────────────
// //   const rideStatus = ride?.rideStatus;

// //   useEffect(() => {
// //     if (!ride || ['completed', 'cancelled'].includes(rideStatus)) return;

// //     const updateLocations = async () => {
// //       if (!mountedRef.current) return;
// //       try {
// //         // ── Driver location ──────────────────────────────────────────────
// //         const driverRes = await apiClient.get(`/users/${ride.driver?.id}`);
// //         const rawDriver = driverRes?.data?.currentLocation ?? driverRes?.currentLocation;
// //         const driverLoc = normalizeCoords(rawDriver);

// //         if (driverLoc && mountedRef.current) {
// //           setDriverLocation(driverLoc);
// //           // Keep the rider's tracking page updated via socket
// //           updateLocation(driverLoc, rawDriver?.heading || 0, rawDriver?.speed || 0);
// //         }

// //         // ── During 'accepted': show driver approaching rider's pickup ────
// //         if (rideStatus === 'accepted' && driverLoc) {
// //           const riderRes = await apiClient.get(`/users/${ride.rider?.id}`);
// //           const rawRider = riderRes?.data?.currentLocation ?? riderRes?.currentLocation;
// //           const riderLoc = normalizeCoords(rawRider);
// //           if (riderLoc && mountedRef.current) setRiderLocation(riderLoc);

// //           // ETA: driver → rider's current position (or static pickup as fallback)
// //           const dest = riderLoc ?? normalizeCoords(ride.pickupLocation);
// //           if (dest) {
// //             const dist = calculateDistance(driverLoc, dest);
// //             if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
// //           }
// //         }

// //         // ── During 'passenger_onboard' / 'awaiting_payment': ─────────────
// //         //    ETA driver → dropoff (rider may be offline — driver location only)
// //         if ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && driverLoc) {
// //           const dropoff = normalizeCoords(ride.dropoffLocation);
// //           if (dropoff) {
// //             const dist = calculateDistance(driverLoc, dropoff);
// //             if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
// //           }
// //           // Pan main map to driver — pass undefined zoom so IframeMap keeps the
// //           // current zoom level (only center changes, no zoom animation).
// //           if (mapControlsRef.current) {
// //             mapControlsRef.current.animateToLocation(driverLoc);
// //           }
// //           // Keep full-screen map (if open) centered on driver — but ONLY pan
// //           // (no zoom) after the initial fly-to has already happened, so the
// //           // driver can freely zoom in/out without the interval snapping it back.
// //           if (fullScreenMapControlsRef.current && fullScreenMapInitializedRef.current) {
// //             fullScreenMapControlsRef.current.animateToLocation(driverLoc);
// //           }
// //         }
// //       } catch (err) {
// //         console.error('[ActiveRide] location update error:', err);
// //       }
// //     };

// //     updateLocations(); // run immediately on mount / status change
// //     locationPollRef.current = setInterval(updateLocations, 2000);
// //     return () => clearInterval(locationPollRef.current);
// //   // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [ride?.id, rideStatus, ride?.driver?.id, ride?.rider?.id]);

// //   // ── Map markers + route props ─────────────────────────────────────────────
// //   //
// //   // We compute three things here:
// //   //   mapPickup    → passed as `pickupLocation` to MapIframe → route START
// //   //   mapDropoff   → passed as `dropoffLocation` to MapIframe → route END
// //   //   markers      → explicit marker overrides (driver car, rider pin, etc.)
// //   //
// //   // Because IframeMap auto-adds 'pickup' and 'dropoff' id markers from the
// //   // pickupLocation / dropoffLocation props, we override both in the explicit
// //   // markers array (same id → last write wins in the iframe marker map).
// //   // ─────────────────────────────────────────────────────────────────────────
// //   const { mapPickup, mapDropoff, mapShowRoute, markers } = useMemo(() => {
// //     const dNorm = driverLocation;
// //     const rNorm = riderLocation;
// //     const pickup = normalizeCoords(ride?.pickupLocation);
// //     const dropoff = normalizeCoords(ride?.dropoffLocation);

// //     if (rideStatus === 'accepted') {
// //       // Route: driver → rider's current position (or static pickup as fallback)
// //       const dest = rNorm ?? pickup;
// //       return {
// //         mapPickup:   dNorm ?? pickup,
// //         mapDropoff:  dest,
// //         mapShowRoute: !!(dNorm && dest),
// //         markers: [
// //           // Override the auto-'pickup' marker (at driverLocation) with a car icon
// //           ...(dNorm ? [{ id: 'pickup', position: dNorm, type: 'driver' }] : []),
// //           // Override the auto-'dropoff' marker (at dest) with a pickup pin
// //           ...(dest  ? [{ id: 'dropoff', position: dest,  type: 'pickup' }] : []),
// //           // Also show rider's LIVE position as a small pulse dot (if available)
// //           ...(rNorm ? [{ id: 'rider',   position: rNorm, type: 'current' }] : []),
// //         ],
// //       };
// //     }

// //     if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') {
// //       // Route: driver (live) → dropoff. Rider is in the car — only driver matters.
// //       return {
// //         mapPickup:   dNorm ?? pickup,
// //         mapDropoff:  dropoff,
// //         mapShowRoute: true,
// //         markers: [
// //           ...(dNorm   ? [{ id: 'pickup',  position: dNorm,  type: 'driver'  }] : []),
// //           ...(dropoff ? [{ id: 'dropoff', position: dropoff, type: 'dropoff' }] : []),
// //         ],
// //       };
// //     }

// //     // 'arrived' (and any other status): show static pickup, driver bouncing
// //     return {
// //       mapPickup:   pickup,
// //       mapDropoff:  null,
// //       mapShowRoute: false,
// //       markers: [
// //         ...(dNorm  ? [{ id: 'driver', position: dNorm,  type: 'driver',  animation: 'BOUNCE' }] : []),
// //         ...(pickup ? [{ id: 'pickup', position: pickup, type: 'pickup' }] : []),
// //       ],
// //     };
// //   }, [
// //     rideStatus,
// //     driverLocation?.lat, driverLocation?.lng,
// //     riderLocation?.lat,  riderLocation?.lng,
// //     ride?.pickupLocation?.lat,  ride?.pickupLocation?.lng,
// //     ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng,
// //   ]);

// //   // ── PAYMENT_RECEIVED — three listeners (RN bridge, window.message, socket) ─
// //   useEffect(() => {
// //     const unsub = rnOn('PAYMENT_RECEIVED', (payload) => {
// //       if (payload?.rideId && String(payload.rideId) !== String(params.id)) return;
// //       clearTimeout(lockTimerRef.current);
// //       clearInterval(countdownRef.current);
// //       clearInterval(pollingRef.current);
// //       router.push('/home');
// //     });
// //     return () => unsub?.();
// //   }, [rnOn, params.id, router]);

// //   useEffect(() => {
// //     const handler = (event) => {
// //       try {
// //         const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
// //         if (msg?.type !== 'PAYMENT_RECEIVED') return;
// //         if (msg.payload?.rideId && String(msg.payload.rideId) !== String(params.id)) return;
// //         clearTimeout(lockTimerRef.current);
// //         clearInterval(countdownRef.current);
// //         clearInterval(pollingRef.current);
// //         router.push('/home');
// //       } catch {}
// //     };
// //     window.addEventListener('message', handler);
// //     return () => window.removeEventListener('message', handler);
// //   }, [params.id, router]);

// //   useEffect(() => {
// //     const handlePaymentReceived = (data) => {
// //       if (data.rideId && String(data.rideId) !== String(params.id)) return;
// //       clearTimeout(lockTimerRef.current);
// //       clearInterval(countdownRef.current);
// //       clearInterval(pollingRef.current);
// //       router.push('/home');
// //     };
// //     socketOn(SOCKET_EVENTS.PAYMENT.RECEIVED, handlePaymentReceived);
// //     return () => socketOff(SOCKET_EVENTS.PAYMENT.RECEIVED);
// //   }, [socketOn, socketOff, params.id, router]);

// //   // ── Request payment ──────────────────────────────────────────────────────
// //   const handleRequestPayment = useCallback(() => {
// //     try {
// //       emit(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, {
// //         rideId:    ride.id,
// //         driverId:  ride.driver?.id,
// //         riderId:   ride.rider?.id,
// //         finalFare: ride.totalFare,
// //       });
// //       setPaymentRequested(true);
// //       setCompleteLockSecondsLeft(Math.round(COMPLETE_TRIP_LOCK_MS / 1000));

// //       countdownRef.current = setInterval(() => {
// //         setCompleteLockSecondsLeft(prev => {
// //           if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
// //           return prev - 1;
// //         });
// //       }, 1000);

// //       lockTimerRef.current = setTimeout(() => {
// //         setCompleteLockSecondsLeft(0);
// //         setPaymentRequested(false);
// //       }, COMPLETE_TRIP_LOCK_MS);
// //     } catch (err) {
// //       console.error('Error requesting payment:', err);
// //     }
// //   }, [emit, ride]);

// //   const completeTripLocked = completeLockSecondsLeft > 0;

// //   const handleStartTrip = async () => {
// //     try { await startTrip(ride.id); loadRideDetails(); }
// //     catch (err) { console.error('Error starting trip:', err); }
// //   };

// //   const handleCompleteTrip = async () => {
// //     if (completeTripLocked) return;
// //     setShowCompleteDialog(true);
// //   };

// //   const handleConfirmComplete = async () => {
// //     setCompleting(true);
// //     try {
// //       await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration });
// //       router.push('/home');
// //     } catch (err) {
// //       console.error('Error completing trip:', err);
// //       setCompleting(false);
// //       setShowCompleteDialog(false);
// //     }
// //   };

// //   const handleConfirmArrival = async () => {
// //     try { await confirmArrival(ride.id); loadRideDetails(); }
// //     catch (err) { console.error('Error confirming arrival:', err); }
// //   };

// //   // ── Navigate button: toggles the popup ──────────────────────────────────
// //   const handleNavigate = () => setShowNavPopup(prev => !prev);

// //   const handleCallRider    = () => ride?.rider?.phoneNumber && (window.location.href = `tel:${ride.rider.phoneNumber}`);
// //   const handleMessageRider = () => ride?.rider?.phoneNumber && (window.location.href = `sms:${ride.rider.phoneNumber}`);

// //   // Google Maps deep-link: navigate to current destination
// //   const handleOpenInGoogleMaps = () => {
// //     const dest = (rideStatus === 'accepted' || rideStatus === 'arrived')
// //       ? (riderLocation ?? normalizeCoords(ride?.pickupLocation))
// //       : normalizeCoords(ride?.dropoffLocation);
// //     if (dest?.lat && dest?.lng)
// //       window.open(
// //         `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`,
// //         '_blank',
// //       );
// //   };

// //   const getStatusColor = (s) => ({
// //     completed: 'success', cancelled: 'error', passenger_onboard: 'primary',
// //     arrived: 'success', accepted: 'info', awaiting_payment: 'warning',
// //   }[s] || 'default');

// //   if (loading || !ride) {
// //     return (
// //       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
// //         <CircularProgress />
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

// //       {/* AppBar */}
// //       <AppBar position="static" elevation={0}>
// //         <Toolbar>
// //           <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
// //           <Typography variant="h6" sx={{ flex: 1 }}>Active Ride</Typography>
// //           <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color: 'white', mr: 1 }} />
// //         </Toolbar>
// //       </AppBar>

// //       {/* ── Map ──────────────────────────────────────────────────────────── */}
// //       <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
// //         <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
// //           <MapIframe
// //             center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
// //             zoom={15}
// //             height="100%"
// //             markers={markers}
// //             pickupLocation={mapPickup}
// //             dropoffLocation={mapDropoff}
// //             showRoute={mapShowRoute}
// //             onMapLoad={(c) => { mapControlsRef.current = c; }}
// //           />
// //         </Box>

// //         {/* ── Navigate button + popup ──────────────────────────────────── */}
// //         <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
// //           <AnimatePresence>
// //             {showNavPopup && (
// //               <motion.div
// //                 key="nav-popup"
// //                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
// //                 animate={{ opacity: 1, y: 0, scale: 1 }}
// //                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
// //                 transition={{ type: 'spring', stiffness: 340, damping: 28 }}
// //                 style={{ marginBottom: 10 }}
// //               >
// //                 <Paper elevation={10} sx={{ borderRadius: 3, overflow: 'hidden', minWidth: 192, border: '1px solid', borderColor: 'divider' }}>
// //                   {/* In App */}
// //                   <Button
// //                     fullWidth
// //                     startIcon={<MapIcon />}
// //                     onClick={() => { setShowNavPopup(false); setShowFullScreenMap(true); }}
// //                     sx={{
// //                       justifyContent: 'flex-start', px: 2.5, py: 1.5,
// //                       fontWeight: 700, textTransform: 'none', borderRadius: 0,
// //                       borderBottom: '1px solid', borderColor: 'divider',
// //                     }}
// //                   >
// //                     In App
// //                   </Button>
// //                   {/* Use Google Maps */}
// //                   <Button
// //                     fullWidth
// //                     startIcon={<OpenInNewIcon />}
// //                     onClick={() => { setShowNavPopup(false); handleOpenInGoogleMaps(); }}
// //                     sx={{ justifyContent: 'flex-start', px: 2.5, py: 1.5, fontWeight: 700, textTransform: 'none', borderRadius: 0 }}
// //                   >
// //                     Use Google Maps
// //                   </Button>
// //                 </Paper>
// //               </motion.div>
// //             )}
// //           </AnimatePresence>

// //           <Fab
// //             variant="extended"
// //             color="primary"
// //             sx={{ borderRadius: '24px' }}
// //             onClick={handleNavigate}
// //           >
// //             <NavigationIcon sx={{ mr: 1 }} />
// //             Directions
// //           </Fab>
// //         </Box>
// //       </Box>

// //       {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
// //       <Paper elevation={8} sx={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60vh', overflow: 'auto' }}>
// //         <Box sx={{ p: 3 }}>

// //           {/* ── ETA / progress banner ─────────────────────────────────────
// //               Shown during 'accepted' (green) and 'passenger_onboard' (amber).
// //               Mirrors the same banner shown on the rider's tracking page.
// //           ── */}
// //           <AnimatePresence>
// //             {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && (
// //               <motion.div
// //                 key={rideStatus + '-eta-banner'}
// //                 initial={{ opacity: 0, y: 12 }}
// //                 animate={{ opacity: 1, y: 0 }}
// //                 exit={{ opacity: 0, y: -12 }}
// //                 transition={{ type: 'spring', stiffness: 280, damping: 24 }}
// //               >
// //                 <Box sx={{
// //                   p: 2, borderRadius: 3, mb: 2,
// //                   background: rideStatus === 'accepted'
// //                     ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)'
// //                     : 'linear-gradient(135deg, rgba(255,193,7,0.12) 0%, rgba(255,140,0,0.06) 100%)',
// //                   border: '1px solid',
// //                   borderColor: rideStatus === 'accepted' ? 'rgba(16,185,129,0.25)' : 'rgba(255,193,7,0.25)',
// //                 }}>
// //                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
// //                     <SpeedIcon sx={{ fontSize: 18, color: rideStatus === 'accepted' ? '#10B981' : '#FF8C00' }} />
// //                     <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
// //                       {rideStatus === 'accepted' ? 'Heading to Pickup' : 'Trip in Progress'}
// //                     </Typography>
// //                   </Box>
// //                   <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta != null ? 1.5 : 0 }}>
// //                     {rideStatus === 'accepted'
// //                       ? 'Drive to the pickup location to collect your rider.'
// //                       : "Keep going — you're on your way to the destination!"}
// //                   </Typography>
// //                   {eta != null && (
// //                     <Box>
// //                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
// //                         <Typography variant="caption" sx={{ fontWeight: 600 }}>
// //                           {rideStatus === 'accepted' ? 'ETA to Pickup' : 'ETA to Destination'}
// //                         </Typography>
// //                         <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
// //                           {distance != null && (
// //                             <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
// //                               {distance.toFixed(1)} km
// //                             </Typography>
// //                           )}
// //                           <Typography variant="caption" sx={{
// //                             fontWeight: 800,
// //                             color: rideStatus === 'accepted' ? '#10B981' : '#FF8C00',
// //                           }}>
// //                             {formatETA(eta)}
// //                           </Typography>
// //                         </Box>
// //                       </Box>
// //                       <LinearProgress
// //                         variant="indeterminate"
// //                         sx={{
// //                           borderRadius: 2, height: 5,
// //                           bgcolor: rideStatus === 'accepted'
// //                             ? 'rgba(16,185,129,0.15)' : 'rgba(255,193,7,0.15)',
// //                           '& .MuiLinearProgress-bar': {
// //                             background: rideStatus === 'accepted'
// //                               ? 'linear-gradient(90deg, #10B981, #059669)'
// //                               : 'linear-gradient(90deg, #FFC107, #FF8C00)',
// //                           },
// //                         }}
// //                       />
// //                     </Box>
// //                   )}
// //                 </Box>
// //               </motion.div>
// //             )}
// //           </AnimatePresence>

// //           {/* Rider Info */}
// //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Rider Information</Typography>
// //             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
// //               <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.secondary' }}>
// //                 {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
// //               </Avatar>
// //               <Box sx={{ flex: 1 }}>
// //                 <Typography variant="h6" sx={{ fontWeight: 600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
// //                 <Typography variant="body2" color="text.secondary">{(() => {
// //                   const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// //                     ? ride?.rider?.username
// //                     : ride?.rider?.phoneNumber;
// //                   const digits = raw.replace(/\D/g, '');
// //                   return digits.length > 10 ? digits.slice(-10) : digits;
// //                 })()}</Typography>
// //                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
// //                   <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
// //                   <Typography variant="body2">
// //                     {ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides
// //                   </Typography>
// //                 </Box>
// //               </Box>
// //               <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
// //                 <IconButton
// //                   onClick={() => {
// //                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// //                       ? ride?.rider?.username
// //                       : ride?.rider?.phoneNumber;
// //                     const digits = raw.replace(/\D/g, '');
// //                     const phone = digits.length > 10 ? digits.slice(-10) : digits;
// //                     window.location.href = `tel:${phone}`;
// //                   }}
// //                   sx={{ bgcolor: 'success.main', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
// //                 >
// //                   <PhoneIcon sx={{ fontSize: 18 }} />
// //                 </IconButton>
// //                 <IconButton
// //                   onClick={() => {
// //                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// //                       ? ride?.rider?.username
// //                       : ride?.rider?.phoneNumber;
// //                     const phone = raw.replace(/\D/g, '');
// //                     window.open(`https://wa.me/${phone}`, '_blank');
// //                   }}
// //                   sx={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#000', width: 40, height: 40, '&:hover': { transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
// //                 >
// //                   <MessageIcon sx={{ fontSize: 18 }} />
// //                 </IconButton>
// //               </Box>
// //             </Box>
// //           </Paper>

// //           {/* Trip Details */}
// //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Details</Typography>
// //             <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
// //               <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
// //                 <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
// //               </Box>
// //               <Box sx={{ flex: 1 }}>
// //                 <Typography variant="caption" color="text.secondary">PICKUP</Typography>
// //                 <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.pickupLocation?.address}</Typography>
// //               </Box>
// //             </Box>
// //             <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />
// //             <Box sx={{ display: 'flex', gap: 2 }}>
// //               <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
// //                 <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
// //               </Box>
// //               <Box sx={{ flex: 1 }}>
// //                 <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
// //                 <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.dropoffLocation?.address}</Typography>
// //               </Box>
// //             </Box>
// //           </Paper>

// //           {/* Fare */}
// //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}><ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Fare</Typography>
// //             <List disablePadding>
// //               {ride.baseFare     != null && <ListItem sx={{ px: 0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
// //               {ride.distanceFare != null && <ListItem sx={{ px: 0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
// //               {ride.surgeFare    >  0    && <ListItem sx={{ px: 0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
// //               {ride.promoDiscount > 0    && <ListItem sx={{ px: 0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
// //               <Divider sx={{ my: 1 }} />
// //               <ListItem sx={{ px: 0 }}>
// //                 <ListItemText primary="Total" primaryTypographyProps={{ fontWeight: 600 }} />
// //                 <Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography>
// //               </ListItem>
// //               <ListItem sx={{ px: 0 }}>
// //                 <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }} />
// //                 <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
// //                   {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
// //                 </Typography>
// //               </ListItem>
// //             </List>
// //             <Chip label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`} sx={{ mt: 2, fontWeight: 600 }} />
// //           </Paper>

// //           {/* Trip Stats */}
// //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Statistics</Typography>
// //             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
// //               <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
// //                 <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km</Typography>
// //                 <Typography variant="caption" color="text.secondary">Distance</Typography>
// //               </Box>
// //               <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
// //                 <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>{formatETA(ride.actualDuration ?? ride.estimatedDuration)}</Typography>
// //                 <Typography variant="caption" color="text.secondary">Duration</Typography>
// //               </Box>
// //             </Box>
// //           </Paper>

// //           {/* Action Buttons */}
// //           {ride.rideStatus === 'accepted' && (
// //             <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival}
// //               sx={{ height: 56, fontWeight: 700, borderRadius: 3, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' }, mb: 1 }}>
// //               I've Arrived at Pickup
// //             </Button>
// //           )}

// //           {ride.rideStatus === 'arrived' && (
// //             <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />}
// //               sx={{ height: 56, fontWeight: 700, borderRadius: 3, mb: 1 }}>
// //               Start Trip
// //             </Button>
// //           )}

// //           {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
// //             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

// //               {okrapayAllowedForRides && (
// //                 <Button fullWidth variant="contained" size="large"
// //                   onClick={handleRequestPayment}
// //                   disabled={paymentRequested && completeLockSecondsLeft > 0}
// //                   startIcon={<PaymentIcon />}
// //                   sx={{
// //                     height: 56, fontWeight: 700, borderRadius: 3,
// //                     bgcolor:  (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.main',
// //                     '&:hover': { bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.dark' },
// //                     '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
// //                   }}>
// //                   {(paymentRequested && completeLockSecondsLeft > 0)
// //                     ? `Payment Requested ✓  (${completeLockSecondsLeft}s)`
// //                     : 'Request Payment'}
// //                 </Button>
// //               )}

// //               {completeTripLocked && (
// //                 <Box>
// //                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
// //                     <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
// //                     <Typography variant="caption" color="text.secondary">
// //                       Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay
// //                     </Typography>
// //                   </Box>
// //                   <LinearProgress
// //                     variant="determinate"
// //                     value={((COMPLETE_TRIP_LOCK_MS / 1000 - completeLockSecondsLeft) / (COMPLETE_TRIP_LOCK_MS / 1000)) * 100}
// //                     sx={{ borderRadius: 1, height: 6, bgcolor: 'warning.light', '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' } }}
// //                   />
// //                 </Box>
// //               )}

// //               {ride.rideStatus === 'awaiting_payment' && (
// //                 <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius: 2 }}>
// //                   Waiting for rider to complete payment…
// //                 </Alert>
// //               )}

// //               <Button fullWidth variant="contained" color="success" size="large"
// //                 onClick={handleCompleteTrip}
// //                 disabled={completeTripLocked}
// //                 startIcon={<CheckIcon />}
// //                 sx={{ height: 56, fontWeight: 700, borderRadius: 3, opacity: completeTripLocked ? 0.5 : 1 }}>
// //                 Complete Trip
// //               </Button>
// //             </Box>
// //           )}

// //           {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
// //             <Button fullWidth variant="outlined" color="error"
// //               sx={{ height: 48, borderRadius: 3, fontWeight: 600, borderWidth: 2, mt: 1, '&:hover': { borderWidth: 2 } }}
// //               onClick={async () => {
// //                 const reason = window.prompt('Reason for cancellation:');
// //                 if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
// //               }}>
// //               Cancel Ride
// //             </Button>
// //           )}
// //         </Box>
// //       </Paper>

// //       {/* ── Full-screen in-app map modal ─────────────────────────────────── */}
// //       {/* Opens when driver chooses "In App" from the navigation popup.
// //           Zoom = 16 on first open, centered on driver's live position.
// //           Subsequent location ticks only pan (no zoom) so driver can freely
// //           zoom in/out without the interval snapping it back.
// //           Only a close button at the bottom. */}
// //       <Dialog fullScreen open={showFullScreenMap} onClose={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}>
// //         <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000' }}>
// //           <MapIframe
// //             center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
// //             zoom={16}
// //             height="100%"
// //             markers={markers}
// //             pickupLocation={mapPickup}
// //             dropoffLocation={mapDropoff}
// //             showRoute={mapShowRoute}
// //             onMapLoad={(c) => {
// //               fullScreenMapControlsRef.current = c;
// //               // Only do the initial fly-to once per open — never again while
// //               // the modal is open so the driver's manual zoom is preserved.
// //               if (driverLocation && !fullScreenMapInitializedRef.current) {
// //                 setTimeout(() => {
// //                   fullScreenMapControlsRef.current?.animateToLocation(driverLocation, 16);
// //                   fullScreenMapInitializedRef.current = true;
// //                 }, 700);
// //               }
// //             }}
// //           />
// //           {/* Close button — bottom-center, above the map */}
// //           <Box sx={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
// //             <Button
// //               variant="contained"
// //               size="large"
// //               startIcon={<CloseIcon />}
// //               onClick={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}
// //               sx={{
// //                 height: 52, px: 5, borderRadius: 3.5, fontWeight: 700,
// //                 bgcolor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)',
// //                 color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
// //                 boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
// //                 '&:hover': { bgcolor: 'rgba(0,0,0,0.92)' },
// //               }}
// //             >
// //               Close Map
// //             </Button>
// //           </Box>
// //         </Box>
// //       </Dialog>

// //       {/* ── Complete Trip confirmation dialog ────────────────────────────── */}
// //       <Dialog
// //         open={showCompleteDialog}
// //         onClose={() => !completing && setShowCompleteDialog(false)}
// //         PaperProps={{ sx: { borderRadius: 4, maxWidth: 360, mx: 2, border: '1px solid', borderColor: 'divider' } }}
// //       >
// //         <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
// //           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
// //             <Box sx={{
// //               width: 40, height: 40, borderRadius: 2, flexShrink: 0,
// //               background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
// //               display: 'flex', alignItems: 'center', justifyContent: 'center',
// //               boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
// //             }}>
// //               <CheckIcon sx={{ fontSize: 22, color: '#fff' }} />
// //             </Box>
// //             Complete Trip?
// //           </Box>
// //         </DialogTitle>
// //         <DialogContent sx={{ pt: 1.5, pb: 1 }}>
// //           <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
// //             Please confirm that the rider has been dropped off at the destination
// //             and the trip is finished.
// //           </Typography>
// //           {ride?.totalFare != null && (
// //             <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
// //               <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block' }}>
// //                 Your Earnings
// //               </Typography>
// //               <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>
// //                 {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
// //               </Typography>
// //             </Box>
// //           )}
// //         </DialogContent>
// //         <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
// //           <Button
// //             onClick={() => setShowCompleteDialog(false)}
// //             disabled={completing}
// //             variant="outlined"
// //             sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, height: 44 }}
// //           >
// //             Not Yet
// //           </Button>
// //           <Button
// //             onClick={handleConfirmComplete}
// //             disabled={completing}
// //             variant="contained"
// //             color="success"
// //             startIcon={completing ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
// //             sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 44 }}
// //           >
// //             {completing ? 'Completing…' : 'Yes, Complete'}
// //           </Button>
// //         </DialogActions>
// //       </Dialog>

// //       {/* Transparent backdrop to dismiss nav popup when tapping elsewhere */}
// //       {showNavPopup && (
// //         <Box
// //           sx={{ position: 'fixed', inset: 0, zIndex: 9 }}
// //           onClick={() => setShowNavPopup(false)}
// //         />
// //       )}
// //     </Box>
// //   );
// // }
// 'use client';
// // PATH: driver/app/(main)/active-ride/[id]/page.jsx

// import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import {
//   Box, AppBar, Toolbar, Typography, Button, Paper, IconButton, Avatar,
//   Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider,
//   LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
//   Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
//   Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
//   OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
//   AccessTime as TimerIcon, Map as MapIcon, Speed as SpeedIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useRide } from '@/lib/hooks/useRide';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { formatCurrency, formatDateTime } from '@/Functions';
// import { apiClient } from '@/lib/api/client';
// import { useSocket } from '@/lib/socket/SocketProvider';
// import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
// import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// import MapIframe from '@/components/Map/MapIframe';

// const COMPLETE_TRIP_LOCK_MS = 60_000;

// function getPollingInterval(settings) {
//   const v = settings?.appsServerPollingIntervalInSeconds;
//   return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
// }

// // ─── Coordinate normalizer ────────────────────────────────────────────────────
// // Backend stores locations as { latitude, longitude }; map expects { lat, lng }.
// const normalizeCoords = (loc) => {
//   if (!loc) return null;
//   const lat = loc.lat ?? loc.latitude;
//   const lng = loc.lng ?? loc.longitude;
//   if (lat == null || lng == null) return null;
//   return { ...loc, lat, lng };
// };

// // ─── Distance / ETA helpers ───────────────────────────────────────────────────
// const deg2rad = (d) => d * (Math.PI / 180);
// const calculateDistance = (a, b) => {
//   if (!a || !b) return 0;
//   const lat1 = a.lat ?? a.latitude ?? 0, lat2 = b.lat ?? b.latitude ?? 0;
//   const lng1 = a.lng ?? a.longitude ?? 0, lng2 = b.lng ?? b.longitude ?? 0;
//   const R = 6371;
//   const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
//   const x = Math.sin(dLat / 2) ** 2 +
//     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
// };
// const estimateDuration = (km) => Math.ceil((km / 30) * 60);
// const formatETA = (m) => {
//   if (!m && m !== 0) return 'Calculating…';
//   if (m < 1)  return 'Less than a minute';
//   if (m < 60) return `${m} min`;
//   const h = Math.floor(m / 60), r = m % 60;
//   return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
// };

// export default function ActiveRidePage() {
//   const params = useParams();
//   const router = useRouter();

//   const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
//   const { updateLocation } = useSocket();
//   const { isNative, getCurrentLocation, on: rnOn } = useReactNative();
//   const { emit, on: socketOn, off: socketOff } = useSocket();
//   const { isOkrapayEnabled, allowRidePaymentWithOkraPay, settings } = useAdminSettings();

//   const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;

//   // ── Core ride state ──────────────────────────────────────────────────────
//   const [ride,    setRide]    = useState(null);
//   const [loading, setLoading] = useState(true);

//   // ── Live-location state ──────────────────────────────────────────────────
//   // driverLocation is only used for the map `center` prop (initial camera).
//   // The driver MARKER is moved directly via mapControlsRef.updateDriverLocation()
//   // on every tick — no state update, no useMemo re-run, no route redraw.
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [riderLocation,  setRiderLocation]  = useState(null);
//   const [eta,            setEta]            = useState(null);
//   const [distance,       setDistance]       = useState(null);

//   // ── One-time route state ──────────────────────────────────────────────────
//   // Set ONCE per ride-status. Never updated again so MapIframe never
//   // re-fires DRAW_ROUTE / fitBounds after the initial draw.
//   const [routePickup,  setRoutePickup]  = useState(null);
//   const [routeDropoff, setRouteDropoff] = useState(null);
//   const [routeReady,   setRouteReady]   = useState(false);
//   // Which status the current route was drawn for — if status changes we
//   // draw one fresh route for the new status.
//   const routeStatusRef = useRef(null);

//   // ── Navigation popup / full-screen map ──────────────────────────────────
//   const [showNavPopup,      setShowNavPopup]      = useState(false);
//   const [showFullScreenMap, setShowFullScreenMap] = useState(false);

//   // ── Complete trip confirmation dialog ────────────────────────────────────
//   const [showCompleteDialog, setShowCompleteDialog] = useState(false);
//   const [completing,         setCompleting]         = useState(false);

//   // ── Map control refs ─────────────────────────────────────────────────────
//   const mapControlsRef           = useRef(null);
//   const fullScreenMapControlsRef = useRef(null);
//   // Tracks whether the full-screen map has done its initial fly-to.
//   // Prevents re-zooming on every 2-second location tick after first open.
//   const fullScreenMapInitializedRef = useRef(false);

//   // ── Payment lock ─────────────────────────────────────────────────────────
//   const [paymentRequested,        setPaymentRequested]        = useState(false);
//   const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);

//   // ── Interval / timer refs ────────────────────────────────────────────────
//   const lockTimerRef    = useRef(null);
//   const countdownRef    = useRef(null);
//   const pollingRef      = useRef(null);
//   const locationPollRef = useRef(null);
//   const mountedRef      = useRef(true);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//       clearTimeout(lockTimerRef.current);
//       clearInterval(countdownRef.current);
//       clearInterval(pollingRef.current);
//       clearInterval(locationPollRef.current);
//     };
//   }, []);

//   // ── Load ride ────────────────────────────────────────────────────────────
//   const loadRideDetails = useCallback(async () => {
//     try {
//       const response = await apiClient.get(`/rides/${params.id}`);
//       if (response?.data && mountedRef.current) {
//         const rideData = response.data;
//         // Seed the map with last-known backend location (latitude/longitude shape)
//         if (rideData.currentDriverLocation) {
//           const norm = normalizeCoords(rideData.currentDriverLocation);
//           if (norm) setDriverLocation(norm);
//         }
//         setRide(rideData);
//       }
//     } catch (error) {
//       console.error('Error loading ride:', error);
//     } finally {
//       if (mountedRef.current) setLoading(false);
//     }
//   }, [params.id]);

//   useEffect(() => { loadRideDetails(); }, [loadRideDetails]);

//   // ── Status polling (server-driven ride state) ────────────────────────────
//   useEffect(() => {
//     if (!ride?.id) return;
//     const ACTIVE = ['accepted', 'arrived', 'passenger_onboard', 'awaiting_payment'];
//     if (!ACTIVE.includes(ride.rideStatus)) return;

//     const interval = getPollingInterval(settings);

//     pollingRef.current = setInterval(async () => {
//       if (!mountedRef.current) return;
//       try {
//         const res = await apiClient.get(`/rides/${ride.id}?populate=rider,vehicle`);
//         const backend = res?.data;
//         if (!backend || !mountedRef.current) return;
//         if (backend.paymentStatus === 'completed' || backend.rideStatus === 'completed') {
//           clearInterval(pollingRef.current);
//           router.push('/home');
//           return;
//         }
//         setRide(prev => prev ? { ...prev, ...backend } : prev);
//       } catch (err) {
//         console.error('[ActiveRide] poll error:', err);
//       }
//     }, interval);

//     return () => clearInterval(pollingRef.current);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [ride?.id, ride?.rideStatus, settings]);

//   // ── 2-second live location + ETA polling ────────────────────────────────
//   //
//   // KEY CHANGE: the route is drawn only ONCE per ride status.
//   //   • First tick for a status  → set routePickup/routeDropoff state (MapIframe
//   //     draws the route via DRAW_ROUTE + fitBounds once).
//   //   • Every subsequent tick    → call updateDriverLocation() directly on the
//   //     map controls ref. This sends UPDATE_DRIVER_LOCATION to the iframe which
//   //     just moves the car marker (smooth easeTo) — no fitBounds, no redraw.
//   //
//   // driverLocation state is still updated so the map `center` prop stays
//   // current (used as initial camera on first render / full-screen map open).
//   // ─────────────────────────────────────────────────────────────────────────
//   const rideStatus = ride?.rideStatus;

//   useEffect(() => {
//     if (!ride || ['completed', 'cancelled'].includes(rideStatus)) return;

//     const updateLocations = async () => {
//       if (!mountedRef.current) return;
//       try {
//         // ── Driver location ──────────────────────────────────────────────
//         const driverRes = await apiClient.get(`/users/${ride.driver?.id}`);
//         const rawDriver = driverRes?.data?.currentLocation ?? driverRes?.currentLocation;
//         const driverLoc = normalizeCoords(rawDriver);

//         if (driverLoc && mountedRef.current) {
//           // Update state only for map center prop — NOT for markers.
//           setDriverLocation(driverLoc);
//           // Move the driver marker directly: smooth, no fitBounds, no route redraw.
//           mapControlsRef.current?.updateDriverLocation(driverLoc);
//           // Also move it in the full-screen map if open (pan only, no zoom).
//           if (fullScreenMapInitializedRef.current) {
//             fullScreenMapControlsRef.current?.updateDriverLocation(driverLoc);
//           }
//           // Keep the rider's tracking page updated via socket.
//           updateLocation(driverLoc, rawDriver?.heading || 0, rawDriver?.speed || 0);
//         }

//         // ── During 'accepted': ETA driver → rider / static pickup ────────
//         if (rideStatus === 'accepted' && driverLoc) {
//           const riderRes = await apiClient.get(`/users/${ride.rider?.id}`);
//           const rawRider = riderRes?.data?.currentLocation ?? riderRes?.currentLocation;
//           const riderLoc = normalizeCoords(rawRider);
//           if (riderLoc && mountedRef.current) setRiderLocation(riderLoc);

//           const dest = riderLoc ?? normalizeCoords(ride.pickupLocation);
//           if (dest) {
//             const dist = calculateDistance(driverLoc, dest);
//             if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
//           }

//           // Draw route ONCE for this status.
//           if (routeStatusRef.current !== 'accepted' && driverLoc) {
//             routeStatusRef.current = 'accepted';
//             const routeDest = riderLoc ?? normalizeCoords(ride.pickupLocation);
//             setRoutePickup(driverLoc);
//             setRouteDropoff(routeDest);
//             setRouteReady(true);
//           }
//         }

//         // ── During 'passenger_onboard' / 'awaiting_payment' ──────────────
//         //    ETA driver → dropoff (rider may be offline — driver only).
//         if ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && driverLoc) {
//           const dropoff = normalizeCoords(ride.dropoffLocation);
//           if (dropoff) {
//             const dist = calculateDistance(driverLoc, dropoff);
//             if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
//           }

//           // Draw route ONCE for this status (also handles transition from 'accepted').
//           if (routeStatusRef.current !== 'passenger_onboard') {
//             routeStatusRef.current = 'passenger_onboard';
//             const dropoffNorm = normalizeCoords(ride.dropoffLocation);
//             setRoutePickup(driverLoc);
//             setRouteDropoff(dropoffNorm);
//             setRouteReady(true);
//           }
//         }
//       } catch (err) {
//         console.error('[ActiveRide] location update error:', err);
//       }
//     };

//     updateLocations(); // run immediately on mount / status change
//     locationPollRef.current = setInterval(updateLocations, 2000);
//     return () => clearInterval(locationPollRef.current);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [ride?.id, rideStatus, ride?.driver?.id, ride?.rider?.id]);

//   // ── Map markers (static — driver marker is NOT here) ─────────────────────
//   //
//   // The driver car is managed entirely by UPDATE_DRIVER_LOCATION (smooth move).
//   // Including it here would cause UPDATE_MARKERS → fitBounds on every tick.
//   // We only keep the truly static markers: rider pin (during accepted) and
//   // the dropoff flag (during in-progress).
//   const markers = useMemo(() => {
//     const rNorm  = riderLocation;
//     const pickup  = normalizeCoords(ride?.pickupLocation);
//     const dropoff = normalizeCoords(ride?.dropoffLocation);

//     if (rideStatus === 'accepted') {
//       // Show rider's live position (or static pickup as fallback) as a pin.
//       const dest = rNorm ?? pickup;
//       return dest ? [{ id: 'rider-dest', position: dest, type: 'pickup' }] : [];
//     }

//     if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') {
//       // Show the dropoff pin only.
//       return dropoff ? [{ id: 'dropoff', position: dropoff, type: 'dropoff' }] : [];
//     }

//     // 'arrived': show static pickup pin (driver marker still via updateDriverLocation).
//     return pickup ? [{ id: 'pickup', position: pickup, type: 'pickup' }] : [];
//   }, [
//     rideStatus,
//     riderLocation?.lat,  riderLocation?.lng,
//     ride?.pickupLocation?.lat,  ride?.pickupLocation?.lng,
//     ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng,
//   ]);

//   // ── PAYMENT_RECEIVED — three listeners (RN bridge, window.message, socket) ─
//   useEffect(() => {
//     const unsub = rnOn('PAYMENT_RECEIVED', (payload) => {
//       if (payload?.rideId && String(payload.rideId) !== String(params.id)) return;
//       clearTimeout(lockTimerRef.current);
//       clearInterval(countdownRef.current);
//       clearInterval(pollingRef.current);
//       router.push('/home');
//     });
//     return () => unsub?.();
//   }, [rnOn, params.id, router]);

//   useEffect(() => {
//     const handler = (event) => {
//       try {
//         const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
//         if (msg?.type !== 'PAYMENT_RECEIVED') return;
//         if (msg.payload?.rideId && String(msg.payload.rideId) !== String(params.id)) return;
//         clearTimeout(lockTimerRef.current);
//         clearInterval(countdownRef.current);
//         clearInterval(pollingRef.current);
//         router.push('/home');
//       } catch {}
//     };
//     window.addEventListener('message', handler);
//     return () => window.removeEventListener('message', handler);
//   }, [params.id, router]);

//   useEffect(() => {
//     const handlePaymentReceived = (data) => {
//       if (data.rideId && String(data.rideId) !== String(params.id)) return;
//       clearTimeout(lockTimerRef.current);
//       clearInterval(countdownRef.current);
//       clearInterval(pollingRef.current);
//       router.push('/home');
//     };
//     socketOn(SOCKET_EVENTS.PAYMENT.RECEIVED, handlePaymentReceived);
//     return () => socketOff(SOCKET_EVENTS.PAYMENT.RECEIVED);
//   }, [socketOn, socketOff, params.id, router]);

//   // ── Request payment ──────────────────────────────────────────────────────
//   const handleRequestPayment = useCallback(() => {
//     try {
//       emit(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, {
//         rideId:    ride.id,
//         driverId:  ride.driver?.id,
//         riderId:   ride.rider?.id,
//         finalFare: ride.totalFare,
//       });
//       setPaymentRequested(true);
//       setCompleteLockSecondsLeft(Math.round(COMPLETE_TRIP_LOCK_MS / 1000));

//       countdownRef.current = setInterval(() => {
//         setCompleteLockSecondsLeft(prev => {
//           if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
//           return prev - 1;
//         });
//       }, 1000);

//       lockTimerRef.current = setTimeout(() => {
//         setCompleteLockSecondsLeft(0);
//         setPaymentRequested(false);
//       }, COMPLETE_TRIP_LOCK_MS);
//     } catch (err) {
//       console.error('Error requesting payment:', err);
//     }
//   }, [emit, ride]);

//   const completeTripLocked = completeLockSecondsLeft > 0;

//   const handleStartTrip = async () => {
//     try { await startTrip(ride.id); loadRideDetails(); }
//     catch (err) { console.error('Error starting trip:', err); }
//   };

//   const handleCompleteTrip = async () => {
//     if (completeTripLocked) return;
//     setShowCompleteDialog(true);
//   };

//   const handleConfirmComplete = async () => {
//     setCompleting(true);
//     try {
//       await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration });
//       router.push('/home');
//     } catch (err) {
//       console.error('Error completing trip:', err);
//       setCompleting(false);
//       setShowCompleteDialog(false);
//     }
//   };

//   const handleConfirmArrival = async () => {
//     try { await confirmArrival(ride.id); loadRideDetails(); }
//     catch (err) { console.error('Error confirming arrival:', err); }
//   };

//   // ── Navigate button: toggles the popup ──────────────────────────────────
//   const handleNavigate = () => setShowNavPopup(prev => !prev);

//   const handleCallRider    = () => ride?.rider?.phoneNumber && (window.location.href = `tel:${ride.rider.phoneNumber}`);
//   const handleMessageRider = () => ride?.rider?.phoneNumber && (window.location.href = `sms:${ride.rider.phoneNumber}`);

//   // Google Maps deep-link: navigate to current destination
//   const handleOpenInGoogleMaps = () => {
//     const dest = (rideStatus === 'accepted' || rideStatus === 'arrived')
//       ? (riderLocation ?? normalizeCoords(ride?.pickupLocation))
//       : normalizeCoords(ride?.dropoffLocation);
//     if (dest?.lat && dest?.lng)
//       window.open(
//         `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`,
//         '_blank',
//       );
//   };

//   const getStatusColor = (s) => ({
//     completed: 'success', cancelled: 'error', passenger_onboard: 'primary',
//     arrived: 'success', accepted: 'info', awaiting_payment: 'warning',
//   }[s] || 'default');

//   if (loading || !ride) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

//       {/* AppBar */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
//           <Typography variant="h6" sx={{ flex: 1 }}>Active Ride</Typography>
//           <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color: 'white', mr: 1 }} />
//         </Toolbar>
//       </AppBar>

//       {/* ── Map ──────────────────────────────────────────────────────────── */}
//       <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
//         <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
//           <MapIframe
//             center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
//             zoom={15}
//             height="100%"
//             markers={markers}
//             pickupLocation={routePickup}
//             dropoffLocation={routeDropoff}
//             showRoute={routeReady}
//             onMapLoad={(c) => { mapControlsRef.current = c; }}
//           />
//         </Box>

//         {/* ── Navigate button + popup ──────────────────────────────────── */}
//         <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
//           <AnimatePresence>
//             {showNavPopup && (
//               <motion.div
//                 key="nav-popup"
//                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
//                 animate={{ opacity: 1, y: 0, scale: 1 }}
//                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
//                 transition={{ type: 'spring', stiffness: 340, damping: 28 }}
//                 style={{ marginBottom: 10 }}
//               >
//                 <Paper elevation={10} sx={{ borderRadius: 3, overflow: 'hidden', minWidth: 192, border: '1px solid', borderColor: 'divider' }}>
//                   {/* In App */}
//                   <Button
//                     fullWidth
//                     startIcon={<MapIcon />}
//                     onClick={() => { setShowNavPopup(false); setShowFullScreenMap(true); }}
//                     sx={{
//                       justifyContent: 'flex-start', px: 2.5, py: 1.5,
//                       fontWeight: 700, textTransform: 'none', borderRadius: 0,
//                       borderBottom: '1px solid', borderColor: 'divider',
//                     }}
//                   >
//                     In App
//                   </Button>
//                   {/* Use Google Maps */}
//                   <Button
//                     fullWidth
//                     startIcon={<OpenInNewIcon />}
//                     onClick={() => { setShowNavPopup(false); handleOpenInGoogleMaps(); }}
//                     sx={{ justifyContent: 'flex-start', px: 2.5, py: 1.5, fontWeight: 700, textTransform: 'none', borderRadius: 0 }}
//                   >
//                     Use Google Maps
//                   </Button>
//                 </Paper>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <Fab
//             variant="extended"
//             color="primary"
//             sx={{ borderRadius: '24px' }}
//             onClick={handleNavigate}
//           >
//             <NavigationIcon sx={{ mr: 1 }} />
//             Directions
//           </Fab>
//         </Box>
//       </Box>

//       {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
//       <Paper elevation={8} sx={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60vh', overflow: 'auto' }}>
//         <Box sx={{ p: 3 }}>

//           {/* ── ETA / progress banner ─────────────────────────────────────
//               Shown during 'accepted' (green) and 'passenger_onboard' (amber).
//               Mirrors the same banner shown on the rider's tracking page.
//           ── */}
//           <AnimatePresence>
//             {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && (
//               <motion.div
//                 key={rideStatus + '-eta-banner'}
//                 initial={{ opacity: 0, y: 12 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -12 }}
//                 transition={{ type: 'spring', stiffness: 280, damping: 24 }}
//               >
//                 <Box sx={{
//                   p: 2, borderRadius: 3, mb: 2,
//                   background: rideStatus === 'accepted'
//                     ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)'
//                     : 'linear-gradient(135deg, rgba(255,193,7,0.12) 0%, rgba(255,140,0,0.06) 100%)',
//                   border: '1px solid',
//                   borderColor: rideStatus === 'accepted' ? 'rgba(16,185,129,0.25)' : 'rgba(255,193,7,0.25)',
//                 }}>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
//                     <SpeedIcon sx={{ fontSize: 18, color: rideStatus === 'accepted' ? '#10B981' : '#FF8C00' }} />
//                     <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
//                       {rideStatus === 'accepted' ? 'Heading to Pickup' : 'Trip in Progress'}
//                     </Typography>
//                   </Box>
//                   <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta != null ? 1.5 : 0 }}>
//                     {rideStatus === 'accepted'
//                       ? 'Drive to the pickup location to collect your rider.'
//                       : "Keep going — you're on your way to the destination!"}
//                   </Typography>
//                   {eta != null && (
//                     <Box>
//                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
//                         <Typography variant="caption" sx={{ fontWeight: 600 }}>
//                           {rideStatus === 'accepted' ? 'ETA to Pickup' : 'ETA to Destination'}
//                         </Typography>
//                         <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
//                           {distance != null && (
//                             <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
//                               {distance.toFixed(1)} km
//                             </Typography>
//                           )}
//                           <Typography variant="caption" sx={{
//                             fontWeight: 800,
//                             color: rideStatus === 'accepted' ? '#10B981' : '#FF8C00',
//                           }}>
//                             {formatETA(eta)}
//                           </Typography>
//                         </Box>
//                       </Box>
//                       <LinearProgress
//                         variant="indeterminate"
//                         sx={{
//                           borderRadius: 2, height: 5,
//                           bgcolor: rideStatus === 'accepted'
//                             ? 'rgba(16,185,129,0.15)' : 'rgba(255,193,7,0.15)',
//                           '& .MuiLinearProgress-bar': {
//                             background: rideStatus === 'accepted'
//                               ? 'linear-gradient(90deg, #10B981, #059669)'
//                               : 'linear-gradient(90deg, #FFC107, #FF8C00)',
//                           },
//                         }}
//                       />
//                     </Box>
//                   )}
//                 </Box>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Rider Info */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Rider Information</Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//               <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.secondary' }}>
//                 {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
//               </Avatar>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="h6" sx={{ fontWeight: 600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
//                 <Typography variant="body2" color="text.secondary">{(() => {
//                   const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
//                     ? ride?.rider?.username
//                     : ride?.rider?.phoneNumber;
//                   const digits = raw.replace(/\D/g, '');
//                   return digits.length > 10 ? digits.slice(-10) : digits;
//                 })()}</Typography>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
//                   <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
//                   <Typography variant="body2">
//                     {ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides
//                   </Typography>
//                 </Box>
//               </Box>
//               <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
//                 <IconButton
//                   onClick={() => {
//                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
//                       ? ride?.rider?.username
//                       : ride?.rider?.phoneNumber;
//                     const digits = raw.replace(/\D/g, '');
//                     const phone = digits.length > 10 ? digits.slice(-10) : digits;
//                     window.location.href = `tel:${phone}`;
//                   }}
//                   sx={{ bgcolor: 'success.main', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
//                 >
//                   <PhoneIcon sx={{ fontSize: 18 }} />
//                 </IconButton>
//                 <IconButton
//                   onClick={() => {
//                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
//                       ? ride?.rider?.username
//                       : ride?.rider?.phoneNumber;
//                     const phone = raw.replace(/\D/g, '');
//                     window.open(`https://wa.me/${phone}`, '_blank');
//                   }}
//                   sx={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#000', width: 40, height: 40, '&:hover': { transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
//                 >
//                   <MessageIcon sx={{ fontSize: 18 }} />
//                 </IconButton>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Trip Details */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Details</Typography>
//             <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
//               <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                 <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
//               </Box>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="caption" color="text.secondary">PICKUP</Typography>
//                 <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.pickupLocation?.address}</Typography>
//               </Box>
//             </Box>
//             <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />
//             <Box sx={{ display: 'flex', gap: 2 }}>
//               <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                 <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
//               </Box>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
//                 <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.dropoffLocation?.address}</Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Fare */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}><ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Fare</Typography>
//             <List disablePadding>
//               {ride.baseFare     != null && <ListItem sx={{ px: 0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
//               {ride.distanceFare != null && <ListItem sx={{ px: 0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
//               {ride.surgeFare    >  0    && <ListItem sx={{ px: 0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
//               {ride.promoDiscount > 0    && <ListItem sx={{ px: 0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
//               <Divider sx={{ my: 1 }} />
//               <ListItem sx={{ px: 0 }}>
//                 <ListItemText primary="Total" primaryTypographyProps={{ fontWeight: 600 }} />
//                 <Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography>
//               </ListItem>
//               <ListItem sx={{ px: 0 }}>
//                 <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }} />
//                 <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
//                   {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
//                 </Typography>
//               </ListItem>
//             </List>
//             <Chip label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`} sx={{ mt: 2, fontWeight: 600 }} />
//           </Paper>

//           {/* Trip Stats */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Statistics</Typography>
//             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
//               <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
//                 <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km</Typography>
//                 <Typography variant="caption" color="text.secondary">Distance</Typography>
//               </Box>
//               <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
//                 <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>{formatETA(ride.actualDuration ?? ride.estimatedDuration)}</Typography>
//                 <Typography variant="caption" color="text.secondary">Duration</Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Action Buttons */}
//           {ride.rideStatus === 'accepted' && (
//             <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival}
//               sx={{ height: 56, fontWeight: 700, borderRadius: 3, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' }, mb: 1 }}>
//               I've Arrived at Pickup
//             </Button>
//           )}

//           {ride.rideStatus === 'arrived' && (
//             <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />}
//               sx={{ height: 56, fontWeight: 700, borderRadius: 3, mb: 1 }}>
//               Start Trip
//             </Button>
//           )}

//           {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

//               {okrapayAllowedForRides && (
//                 <Button fullWidth variant="contained" size="large"
//                   onClick={handleRequestPayment}
//                   disabled={paymentRequested && completeLockSecondsLeft > 0}
//                   startIcon={<PaymentIcon />}
//                   sx={{
//                     height: 56, fontWeight: 700, borderRadius: 3,
//                     bgcolor:  (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.main',
//                     '&:hover': { bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.dark' },
//                     '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
//                   }}>
//                   {(paymentRequested && completeLockSecondsLeft > 0)
//                     ? `Payment Requested ✓  (${completeLockSecondsLeft}s)`
//                     : 'Request Payment'}
//                 </Button>
//               )}

//               {completeTripLocked && (
//                 <Box>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
//                     <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
//                     <Typography variant="caption" color="text.secondary">
//                       Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay
//                     </Typography>
//                   </Box>
//                   <LinearProgress
//                     variant="determinate"
//                     value={((COMPLETE_TRIP_LOCK_MS / 1000 - completeLockSecondsLeft) / (COMPLETE_TRIP_LOCK_MS / 1000)) * 100}
//                     sx={{ borderRadius: 1, height: 6, bgcolor: 'warning.light', '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' } }}
//                   />
//                 </Box>
//               )}

//               {ride.rideStatus === 'awaiting_payment' && (
//                 <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius: 2 }}>
//                   Waiting for rider to complete payment…
//                 </Alert>
//               )}

//               <Button fullWidth variant="contained" color="success" size="large"
//                 onClick={handleCompleteTrip}
//                 disabled={completeTripLocked}
//                 startIcon={<CheckIcon />}
//                 sx={{ height: 56, fontWeight: 700, borderRadius: 3, opacity: completeTripLocked ? 0.5 : 1 }}>
//                 Complete Trip
//               </Button>
//             </Box>
//           )}

//           {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
//             <Button fullWidth variant="outlined" color="error"
//               sx={{ height: 48, borderRadius: 3, fontWeight: 600, borderWidth: 2, mt: 1, '&:hover': { borderWidth: 2 } }}
//               onClick={async () => {
//                 const reason = window.prompt('Reason for cancellation:');
//                 if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
//               }}>
//               Cancel Ride
//             </Button>
//           )}
//         </Box>
//       </Paper>

//       {/* ── Full-screen in-app map modal ─────────────────────────────────── */}
//       {/* Opens when driver chooses "In App" from the navigation popup.
//           Zoom = 16 on first open, centered on driver's live position.
//           Subsequent location ticks only pan (no zoom) so driver can freely
//           zoom in/out without the interval snapping it back.
//           Only a close button at the bottom. */}
//       <Dialog fullScreen open={showFullScreenMap} onClose={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}>
//         <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000' }}>
//           <MapIframe
//             center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
//             zoom={16}
//             height="100%"
//             markers={markers}
//             pickupLocation={routePickup}
//             dropoffLocation={routeDropoff}
//             showRoute={routeReady}
//             onMapLoad={(c) => {
//               fullScreenMapControlsRef.current = c;
//               // Only do the initial fly-to once per open — never again while
//               // the modal is open so the driver's manual zoom is preserved.
//               if (driverLocation && !fullScreenMapInitializedRef.current) {
//                 setTimeout(() => {
//                   fullScreenMapControlsRef.current?.animateToLocation(driverLocation, 16);
//                   fullScreenMapInitializedRef.current = true;
//                 }, 700);
//               }
//             }}
//           />
//           {/* Close button — bottom-center, above the map */}
//           <Box sx={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
//             <Button
//               variant="contained"
//               size="large"
//               startIcon={<CloseIcon />}
//               onClick={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}
//               sx={{
//                 height: 52, px: 5, borderRadius: 3.5, fontWeight: 700,
//                 bgcolor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)',
//                 color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
//                 boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
//                 '&:hover': { bgcolor: 'rgba(0,0,0,0.92)' },
//               }}
//             >
//               Close Map
//             </Button>
//           </Box>
//         </Box>
//       </Dialog>

//       {/* ── Complete Trip confirmation dialog ────────────────────────────── */}
//       <Dialog
//         open={showCompleteDialog}
//         onClose={() => !completing && setShowCompleteDialog(false)}
//         PaperProps={{ sx: { borderRadius: 4, maxWidth: 360, mx: 2, border: '1px solid', borderColor: 'divider' } }}
//       >
//         <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//             <Box sx={{
//               width: 40, height: 40, borderRadius: 2, flexShrink: 0,
//               background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//               boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
//             }}>
//               <CheckIcon sx={{ fontSize: 22, color: '#fff' }} />
//             </Box>
//             Complete Trip?
//           </Box>
//         </DialogTitle>
//         <DialogContent sx={{ pt: 1.5, pb: 1 }}>
//           <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
//             Please confirm that the rider has been dropped off at the destination
//             and the trip is finished.
//           </Typography>
//           {ride?.totalFare != null && (
//             <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
//               <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block' }}>
//                 Your Earnings
//               </Typography>
//               <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>
//                 {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
//               </Typography>
//             </Box>
//           )}
//         </DialogContent>
//         <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
//           <Button
//             onClick={() => setShowCompleteDialog(false)}
//             disabled={completing}
//             variant="outlined"
//             sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, height: 44 }}
//           >
//             Not Yet
//           </Button>
//           <Button
//             onClick={handleConfirmComplete}
//             disabled={completing}
//             variant="contained"
//             color="success"
//             startIcon={completing ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
//             sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 44 }}
//           >
//             {completing ? 'Completing…' : 'Yes, Complete'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Transparent backdrop to dismiss nav popup when tapping elsewhere */}
//       {showNavPopup && (
//         <Box
//           sx={{ position: 'fixed', inset: 0, zIndex: 9 }}
//           onClick={() => setShowNavPopup(false)}
//         />
//       )}
//     </Box>
//   );
// }
'use client';
// PATH: driver/app/(main)/active-ride/[id]/page.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Button, Paper, IconButton, Avatar,
  Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
  Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
  Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
  OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
  AccessTime as TimerIcon, Map as MapIcon, Speed as SpeedIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRide } from '@/lib/hooks/useRide';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import MapIframe from '@/components/Map/MapIframe';

const COMPLETE_TRIP_LOCK_MS = 60_000;

function getPollingInterval(settings) {
  const v = settings?.appsServerPollingIntervalInSeconds;
  return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
}

// ─── Coordinate normalizer ────────────────────────────────────────────────────
// Backend stores locations as { latitude, longitude }; map expects { lat, lng }.
const normalizeCoords = (loc) => {
  if (!loc) return null;
  const lat = loc.lat ?? loc.latitude;
  const lng = loc.lng ?? loc.longitude;
  if (lat == null || lng == null) return null;
  return { ...loc, lat, lng };
};

// ─── Distance / ETA helpers ───────────────────────────────────────────────────
const deg2rad = (d) => d * (Math.PI / 180);
const calculateDistance = (a, b) => {
  if (!a || !b) return 0;
  const lat1 = a.lat ?? a.latitude ?? 0, lat2 = b.lat ?? b.latitude ?? 0;
  const lng1 = a.lng ?? a.longitude ?? 0, lng2 = b.lng ?? b.longitude ?? 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
const estimateDuration = (km) => Math.ceil((km / 30) * 60);
const formatETA = (m) => {
  if (!m && m !== 0) return 'Calculating…';
  if (m < 1)  return 'Less than a minute';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
};

export default function ActiveRidePage() {
  const params = useParams();
  const router = useRouter();

  const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
  const { updateLocation } = useSocket();
  const { isNative, getCurrentLocation, on: rnOn } = useReactNative();
  const { emit, on: socketOn, off: socketOff } = useSocket();
  const { isOkrapayEnabled, allowRidePaymentWithOkraPay, settings } = useAdminSettings();

  const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;

  // ── Core ride state ──────────────────────────────────────────────────────
  const [ride,    setRide]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Live-location state ──────────────────────────────────────────────────
  // driverLocation is only used for the map `center` prop (initial camera).
  // The driver MARKER is moved directly via mapControlsRef.updateDriverLocation()
  // on every tick — no state update, no useMemo re-run, no route redraw.
  // riderLocation is intentionally NOT in state — storing it caused a new
  // `markers` array reference every 2 seconds → UPDATE_MARKERS → fitBounds spam.
  // ETA calculations use the local variable from the API response directly.
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta,            setEta]            = useState(null);
  const [distance,       setDistance]       = useState(null);

  // ── One-time route state ──────────────────────────────────────────────────
  // Set ONCE per ride-status. Never updated again so MapIframe never
  // re-fires DRAW_ROUTE / fitBounds after the initial draw.
  const [routePickup,  setRoutePickup]  = useState(null);
  const [routeDropoff, setRouteDropoff] = useState(null);
  const [routeReady,   setRouteReady]   = useState(false);
  // Which status the current route was drawn for — if status changes we
  // draw one fresh route for the new status.
  const routeStatusRef = useRef(null);

  // ── Navigation popup / full-screen map ──────────────────────────────────
  const [showNavPopup,      setShowNavPopup]      = useState(false);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);

  // ── Complete trip confirmation dialog ────────────────────────────────────
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completing,         setCompleting]         = useState(false);

  // ── Map control refs ─────────────────────────────────────────────────────
  const mapControlsRef           = useRef(null);
  const fullScreenMapControlsRef = useRef(null);
  // Tracks whether the full-screen map has done its initial fly-to.
  // Prevents re-zooming on every 2-second location tick after first open.
  const fullScreenMapInitializedRef = useRef(false);

  // ── Payment lock ─────────────────────────────────────────────────────────
  const [paymentRequested,        setPaymentRequested]        = useState(false);
  const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);

  // ── Interval / timer refs ────────────────────────────────────────────────
  const lockTimerRef    = useRef(null);
  const countdownRef    = useRef(null);
  const pollingRef      = useRef(null);
  const locationPollRef = useRef(null);
  const mountedRef      = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(lockTimerRef.current);
      clearInterval(countdownRef.current);
      clearInterval(pollingRef.current);
      clearInterval(locationPollRef.current);
    };
  }, []);

  // ── Load ride ────────────────────────────────────────────────────────────
  const loadRideDetails = useCallback(async () => {
    try {
      const response = await apiClient.get(`/rides/${params.id}`);
      if (response?.data && mountedRef.current) {
        const rideData = response.data;
        // Seed the map with last-known backend location (latitude/longitude shape)
        if (rideData.currentDriverLocation) {
          const norm = normalizeCoords(rideData.currentDriverLocation);
          if (norm) setDriverLocation(norm);
        }
        setRide(rideData);
      }
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { loadRideDetails(); }, [loadRideDetails]);

  // ── Status polling (server-driven ride state) ────────────────────────────
  useEffect(() => {
    if (!ride?.id) return;
    const ACTIVE = ['accepted', 'arrived', 'passenger_onboard', 'awaiting_payment'];
    if (!ACTIVE.includes(ride.rideStatus)) return;

    const interval = getPollingInterval(settings);

    pollingRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const res = await apiClient.get(`/rides/${ride.id}?populate=rider,vehicle`);
        const backend = res?.data;
        if (!backend || !mountedRef.current) return;
        if (backend.paymentStatus === 'completed' || backend.rideStatus === 'completed') {
          clearInterval(pollingRef.current);
          router.push('/home');
          return;
        }
        setRide(prev => prev ? { ...prev, ...backend } : prev);
      } catch (err) {
        console.error('[ActiveRide] poll error:', err);
      }
    }, interval);

    return () => clearInterval(pollingRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id, ride?.rideStatus, settings]);

  // ── 2-second live location + ETA polling ────────────────────────────────
  //
  // KEY CHANGE: the route is drawn only ONCE per ride status.
  //   • First tick for a status  → set routePickup/routeDropoff state (MapIframe
  //     draws the route via DRAW_ROUTE + fitBounds once).
  //   • Every subsequent tick    → call updateDriverLocation() directly on the
  //     map controls ref. This sends UPDATE_DRIVER_LOCATION to the iframe which
  //     just moves the car marker (smooth easeTo) — no fitBounds, no redraw.
  //
  // driverLocation state is still updated so the map `center` prop stays
  // current (used as initial camera on first render / full-screen map open).
  // ─────────────────────────────────────────────────────────────────────────
  const rideStatus = ride?.rideStatus;

  useEffect(() => {
    if (!ride || ['completed', 'cancelled'].includes(rideStatus)) return;

    const updateLocations = async () => {
      if (!mountedRef.current) return;
      try {
        // ── Driver location ──────────────────────────────────────────────
        const driverRes = await apiClient.get(`/users/${ride.driver?.id}`);
        const rawDriver = driverRes?.data?.currentLocation ?? driverRes?.currentLocation;
        const driverLoc = normalizeCoords(rawDriver);

        if (driverLoc && mountedRef.current) {
          // Update state only for map center prop — NOT for markers.
          setDriverLocation(driverLoc);
          // Move the driver marker directly: smooth, no fitBounds, no route redraw.
          mapControlsRef.current?.updateDriverLocation(driverLoc);
          // Also move it in the full-screen map if open (pan only, no zoom).
          if (fullScreenMapInitializedRef.current) {
            fullScreenMapControlsRef.current?.updateDriverLocation(driverLoc);
          }
          // Keep the rider's tracking page updated via socket.
          updateLocation(driverLoc, rawDriver?.heading || 0, rawDriver?.speed || 0);
        }

        // ── During 'accepted': ETA driver → rider's latest position ─────
        if (rideStatus === 'accepted' && driverLoc) {
          // Fetch rider location for ETA only (NOT stored in state — avoids markers re-render).
          const riderRes = await apiClient.get(`/users/${ride.rider?.id}`);
          const rawRider = riderRes?.data?.currentLocation ?? riderRes?.currentLocation;
          const riderLoc = normalizeCoords(rawRider);

          // ETA: driver → rider's live position (or static pickup as fallback)
          const etaDest = riderLoc ?? normalizeCoords(ride.pickupLocation);
          if (etaDest) {
            const dist = calculateDistance(driverLoc, etaDest);
            if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
          }

          // Draw route ONCE for this status.
          // Route endpoint = static ride.pickupLocation (never changes, no marker spam).
          if (routeStatusRef.current !== 'accepted') {
            routeStatusRef.current = 'accepted';
            setRoutePickup(driverLoc);
            setRouteDropoff(normalizeCoords(ride.pickupLocation));
            setRouteReady(true);
          }
        }

        // ── During 'passenger_onboard' / 'awaiting_payment' ──────────────
        //    ETA driver → dropoff (rider may be offline — driver only).
        if ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && driverLoc) {
          const dropoff = normalizeCoords(ride.dropoffLocation);
          if (dropoff) {
            const dist = calculateDistance(driverLoc, dropoff);
            if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
          }

          // Draw route ONCE for this status (also handles transition from 'accepted').
          if (routeStatusRef.current !== 'passenger_onboard') {
            routeStatusRef.current = 'passenger_onboard';
            const dropoffNorm = normalizeCoords(ride.dropoffLocation);
            setRoutePickup(driverLoc);
            setRouteDropoff(dropoffNorm);
            setRouteReady(true);
          }
        }
      } catch (err) {
        console.error('[ActiveRide] location update error:', err);
      }
    };

    updateLocations(); // run immediately on mount / status change
    locationPollRef.current = setInterval(updateLocations, 2000);
    return () => clearInterval(locationPollRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id, rideStatus, ride?.driver?.id, ride?.rider?.id]);

  // ── Map markers ───────────────────────────────────────────────────────────
  //
  // EMPTY — deliberately so.
  //
  // The driver car is handled entirely by UPDATE_DRIVER_LOCATION (smooth move,
  // no fitBounds). The pickup / dropoff destination pins are created
  // automatically by IframeMap from the `pickupLocation` and `dropoffLocation`
  // props, which are `routePickup` and `routeDropoff` — both set ONCE per
  // status and then never changed.
  //
  // Keeping this array empty means UPDATE_MARKERS only fires:
  //   (a) once when the iframe loads, and
  //   (b) once when routePickup / routeDropoff transition from null → value.
  // After that the map is completely stable — no more fitBounds spam.
  const markers = useMemo(() => [], []);

  // ── PAYMENT_RECEIVED — three listeners (RN bridge, window.message, socket) ─
  useEffect(() => {
    const unsub = rnOn('PAYMENT_RECEIVED', (payload) => {
      if (payload?.rideId && String(payload.rideId) !== String(params.id)) return;
      clearTimeout(lockTimerRef.current);
      clearInterval(countdownRef.current);
      clearInterval(pollingRef.current);
      router.push('/home');
    });
    return () => unsub?.();
  }, [rnOn, params.id, router]);

  useEffect(() => {
    const handler = (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg?.type !== 'PAYMENT_RECEIVED') return;
        if (msg.payload?.rideId && String(msg.payload.rideId) !== String(params.id)) return;
        clearTimeout(lockTimerRef.current);
        clearInterval(countdownRef.current);
        clearInterval(pollingRef.current);
        router.push('/home');
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [params.id, router]);

  useEffect(() => {
    const handlePaymentReceived = (data) => {
      if (data.rideId && String(data.rideId) !== String(params.id)) return;
      clearTimeout(lockTimerRef.current);
      clearInterval(countdownRef.current);
      clearInterval(pollingRef.current);
      router.push('/home');
    };
    socketOn(SOCKET_EVENTS.PAYMENT.RECEIVED, handlePaymentReceived);
    return () => socketOff(SOCKET_EVENTS.PAYMENT.RECEIVED);
  }, [socketOn, socketOff, params.id, router]);

  // ── Request payment ──────────────────────────────────────────────────────
  const handleRequestPayment = useCallback(() => {
    try {
      emit(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, {
        rideId:    ride.id,
        driverId:  ride.driver?.id,
        riderId:   ride.rider?.id,
        finalFare: ride.totalFare,
      });
      setPaymentRequested(true);
      setCompleteLockSecondsLeft(Math.round(COMPLETE_TRIP_LOCK_MS / 1000));

      countdownRef.current = setInterval(() => {
        setCompleteLockSecondsLeft(prev => {
          if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);

      lockTimerRef.current = setTimeout(() => {
        setCompleteLockSecondsLeft(0);
        setPaymentRequested(false);
      }, COMPLETE_TRIP_LOCK_MS);
    } catch (err) {
      console.error('Error requesting payment:', err);
    }
  }, [emit, ride]);

  const completeTripLocked = completeLockSecondsLeft > 0;

  const handleStartTrip = async () => {
    try { await startTrip(ride.id); loadRideDetails(); }
    catch (err) { console.error('Error starting trip:', err); }
  };

  const handleCompleteTrip = async () => {
    if (completeTripLocked) return;
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = async () => {
    setCompleting(true);
    try {
      await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration });
      router.push('/home');
    } catch (err) {
      console.error('Error completing trip:', err);
      setCompleting(false);
      setShowCompleteDialog(false);
    }
  };

  const handleConfirmArrival = async () => {
    try { await confirmArrival(ride.id); loadRideDetails(); }
    catch (err) { console.error('Error confirming arrival:', err); }
  };

  // ── Navigate button: toggles the popup ──────────────────────────────────
  const handleNavigate = () => setShowNavPopup(prev => !prev);

  const handleCallRider    = () => ride?.rider?.phoneNumber && (window.location.href = `tel:${ride.rider.phoneNumber}`);
  const handleMessageRider = () => ride?.rider?.phoneNumber && (window.location.href = `sms:${ride.rider.phoneNumber}`);

  // Google Maps deep-link: navigate to current destination
  const handleOpenInGoogleMaps = () => {
    const dest = (rideStatus === 'accepted' || rideStatus === 'arrived')
      ? (riderLocation ?? normalizeCoords(ride?.pickupLocation))
      : normalizeCoords(ride?.dropoffLocation);
    if (dest?.lat && dest?.lng)
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`,
        '_blank',
      );
  };

  const getStatusColor = (s) => ({
    completed: 'success', cancelled: 'error', passenger_onboard: 'primary',
    arrived: 'success', accepted: 'info', awaiting_payment: 'warning',
  }[s] || 'default');

  if (loading || !ride) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>Active Ride</Typography>
          <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color: 'white', mr: 1 }} />
        </Toolbar>
      </AppBar>

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MapIframe
            center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
            zoom={15}
            height="100%"
            markers={markers}
            pickupLocation={routePickup}
            dropoffLocation={routeDropoff}
            showRoute={routeReady}
            onMapLoad={(c) => { mapControlsRef.current = c; }}
          />
        </Box>

        {/* ── Navigate button + popup ──────────────────────────────────── */}
        <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
          <AnimatePresence>
            {showNavPopup && (
              <motion.div
                key="nav-popup"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                style={{ marginBottom: 10 }}
              >
                <Paper elevation={10} sx={{ borderRadius: 3, overflow: 'hidden', minWidth: 192, border: '1px solid', borderColor: 'divider' }}>
                  {/* In App */}
                  <Button
                    fullWidth
                    startIcon={<MapIcon />}
                    onClick={() => { setShowNavPopup(false); setShowFullScreenMap(true); }}
                    sx={{
                      justifyContent: 'flex-start', px: 2.5, py: 1.5,
                      fontWeight: 700, textTransform: 'none', borderRadius: 0,
                      borderBottom: '1px solid', borderColor: 'divider',
                    }}
                  >
                    In App
                  </Button>
                  {/* Use Google Maps */}
                  <Button
                    fullWidth
                    startIcon={<OpenInNewIcon />}
                    onClick={() => { setShowNavPopup(false); handleOpenInGoogleMaps(); }}
                    sx={{ justifyContent: 'flex-start', px: 2.5, py: 1.5, fontWeight: 700, textTransform: 'none', borderRadius: 0 }}
                  >
                    Use Google Maps
                  </Button>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>

          <Fab
            variant="extended"
            color="primary"
            sx={{ borderRadius: '24px' }}
            onClick={handleNavigate}
          >
            <NavigationIcon sx={{ mr: 1 }} />
            Directions
          </Fab>
        </Box>
      </Box>

      {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
      <Paper elevation={8} sx={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60vh', overflow: 'auto' }}>
        <Box sx={{ p: 3 }}>

          {/* ── ETA / progress banner ─────────────────────────────────────
              Shown during 'accepted' (green) and 'passenger_onboard' (amber).
              Mirrors the same banner shown on the rider's tracking page.
          ── */}
          <AnimatePresence>
            {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && (
              <motion.div
                key={rideStatus + '-eta-banner'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                <Box sx={{
                  p: 2, borderRadius: 3, mb: 2,
                  background: rideStatus === 'accepted'
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)'
                    : 'linear-gradient(135deg, rgba(255,193,7,0.12) 0%, rgba(255,140,0,0.06) 100%)',
                  border: '1px solid',
                  borderColor: rideStatus === 'accepted' ? 'rgba(16,185,129,0.25)' : 'rgba(255,193,7,0.25)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                    <SpeedIcon sx={{ fontSize: 18, color: rideStatus === 'accepted' ? '#10B981' : '#FF8C00' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {rideStatus === 'accepted' ? 'Heading to Pickup' : 'Trip in Progress'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: eta != null ? 1.5 : 0 }}>
                    {rideStatus === 'accepted'
                      ? 'Drive to the pickup location to collect your rider.'
                      : "Keep going — you're on your way to the destination!"}
                  </Typography>
                  {eta != null && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {rideStatus === 'accepted' ? 'ETA to Pickup' : 'ETA to Destination'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                          {distance != null && (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                              {distance.toFixed(1)} km
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{
                            fontWeight: 800,
                            color: rideStatus === 'accepted' ? '#10B981' : '#FF8C00',
                          }}>
                            {formatETA(eta)}
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="indeterminate"
                        sx={{
                          borderRadius: 2, height: 5,
                          bgcolor: rideStatus === 'accepted'
                            ? 'rgba(16,185,129,0.15)' : 'rgba(255,193,7,0.15)',
                          '& .MuiLinearProgress-bar': {
                            background: rideStatus === 'accepted'
                              ? 'linear-gradient(90deg, #10B981, #059669)'
                              : 'linear-gradient(90deg, #FFC107, #FF8C00)',
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rider Info */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Rider Information</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.secondary' }}>
                {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{(() => {
                  const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
                    ? ride?.rider?.username
                    : ride?.rider?.phoneNumber;
                  const digits = raw.replace(/\D/g, '');
                  return digits.length > 10 ? digits.slice(-10) : digits;
                })()}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2">
                    {ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <IconButton
                  onClick={() => {
                    const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
                      ? ride?.rider?.username
                      : ride?.rider?.phoneNumber;
                    const digits = raw.replace(/\D/g, '');
                    const phone = digits.length > 10 ? digits.slice(-10) : digits;
                    window.location.href = `tel:${phone}`;
                  }}
                  sx={{ bgcolor: 'success.main', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
                >
                  <PhoneIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  onClick={() => {
                    const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
                      ? ride?.rider?.username
                      : ride?.rider?.phoneNumber;
                    const phone = raw.replace(/\D/g, '');
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }}
                  sx={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#000', width: 40, height: 40, '&:hover': { transform: 'scale(1.08)' }, transition: 'all 0.16s ease' }}
                >
                  <MessageIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {/* Trip Details */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Details</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">PICKUP</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.pickupLocation?.address}</Typography>
              </Box>
            </Box>
            <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.dropoffLocation?.address}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Fare */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}><ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Fare</Typography>
            <List disablePadding>
              {ride.baseFare     != null && <ListItem sx={{ px: 0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
              {ride.distanceFare != null && <ListItem sx={{ px: 0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
              {ride.surgeFare    >  0    && <ListItem sx={{ px: 0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
              {ride.promoDiscount > 0    && <ListItem sx={{ px: 0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
              <Divider sx={{ my: 1 }} />
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Total" primaryTypographyProps={{ fontWeight: 600 }} />
                <Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography>
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }} />
                <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
                  {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
                </Typography>
              </ListItem>
            </List>
            <Chip label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`} sx={{ mt: 2, fontWeight: 600 }} />
          </Paper>

          {/* Trip Stats */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Statistics</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km</Typography>
                <Typography variant="caption" color="text.secondary">Distance</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>{formatETA(ride.actualDuration ?? ride.estimatedDuration)}</Typography>
                <Typography variant="caption" color="text.secondary">Duration</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Action Buttons */}
          {ride.rideStatus === 'accepted' && (
            <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival}
              sx={{ height: 56, fontWeight: 700, borderRadius: 3, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' }, mb: 1 }}>
              I've Arrived at Pickup
            </Button>
          )}

          {ride.rideStatus === 'arrived' && (
            <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />}
              sx={{ height: 56, fontWeight: 700, borderRadius: 3, mb: 1 }}>
              Start Trip
            </Button>
          )}

          {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

              {okrapayAllowedForRides && (
                <Button fullWidth variant="contained" size="large"
                  onClick={handleRequestPayment}
                  disabled={paymentRequested && completeLockSecondsLeft > 0}
                  startIcon={<PaymentIcon />}
                  sx={{
                    height: 56, fontWeight: 700, borderRadius: 3,
                    bgcolor:  (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.main',
                    '&:hover': { bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.dark' },
                    '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
                  }}>
                  {(paymentRequested && completeLockSecondsLeft > 0)
                    ? `Payment Requested ✓  (${completeLockSecondsLeft}s)`
                    : 'Request Payment'}
                </Button>
              )}

              {completeTripLocked && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((COMPLETE_TRIP_LOCK_MS / 1000 - completeLockSecondsLeft) / (COMPLETE_TRIP_LOCK_MS / 1000)) * 100}
                    sx={{ borderRadius: 1, height: 6, bgcolor: 'warning.light', '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' } }}
                  />
                </Box>
              )}

              {ride.rideStatus === 'awaiting_payment' && (
                <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius: 2 }}>
                  Waiting for rider to complete payment…
                </Alert>
              )}

              <Button fullWidth variant="contained" color="success" size="large"
                onClick={handleCompleteTrip}
                disabled={completeTripLocked}
                startIcon={<CheckIcon />}
                sx={{ height: 56, fontWeight: 700, borderRadius: 3, opacity: completeTripLocked ? 0.5 : 1 }}>
                Complete Trip
              </Button>
            </Box>
          )}

          {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
            <Button fullWidth variant="outlined" color="error"
              sx={{ height: 48, borderRadius: 3, fontWeight: 600, borderWidth: 2, mt: 1, '&:hover': { borderWidth: 2 } }}
              onClick={async () => {
                const reason = window.prompt('Reason for cancellation:');
                if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
              }}>
              Cancel Ride
            </Button>
          )}
        </Box>
      </Paper>

      {/* ── Full-screen in-app map modal ─────────────────────────────────── */}
      {/* Opens when driver chooses "In App" from the navigation popup.
          Zoom = 16 on first open, centered on driver's live position.
          Subsequent location ticks only pan (no zoom) so driver can freely
          zoom in/out without the interval snapping it back.
          Only a close button at the bottom. */}
      <Dialog fullScreen open={showFullScreenMap} onClose={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}>
        <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000' }}>
          <MapIframe
            center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
            zoom={16}
            height="100%"
            markers={markers}
            pickupLocation={routePickup}
            dropoffLocation={routeDropoff}
            showRoute={routeReady}
            onMapLoad={(c) => {
              fullScreenMapControlsRef.current = c;
              // Only do the initial fly-to once per open — never again while
              // the modal is open so the driver's manual zoom is preserved.
              if (driverLocation && !fullScreenMapInitializedRef.current) {
                setTimeout(() => {
                  fullScreenMapControlsRef.current?.animateToLocation(driverLocation, 16);
                  fullScreenMapInitializedRef.current = true;
                }, 700);
              }
            }}
          />
          {/* Close button — bottom-center, above the map */}
          <Box sx={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CloseIcon />}
              onClick={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}
              sx={{
                height: 52, px: 5, borderRadius: 3.5, fontWeight: 700,
                bgcolor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.92)' },
              }}
            >
              Close Map
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* ── Complete Trip confirmation dialog ────────────────────────────── */}
      <Dialog
        open={showCompleteDialog}
        onClose={() => !completing && setShowCompleteDialog(false)}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 360, mx: 2, border: '1px solid', borderColor: 'divider' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
            }}>
              <CheckIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            Complete Trip?
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            Please confirm that the rider has been dropped off at the destination
            and the trip is finished.
          </Typography>
          {ride?.totalFare != null && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block' }}>
                Your Earnings
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>
                {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setShowCompleteDialog(false)}
            disabled={completing}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, height: 44 }}
          >
            Not Yet
          </Button>
          <Button
            onClick={handleConfirmComplete}
            disabled={completing}
            variant="contained"
            color="success"
            startIcon={completing ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 44 }}
          >
            {completing ? 'Completing…' : 'Yes, Complete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transparent backdrop to dismiss nav popup when tapping elsewhere */}
      {showNavPopup && (
        <Box
          sx={{ position: 'fixed', inset: 0, zIndex: 9 }}
          onClick={() => setShowNavPopup(false)}
        />
      )}
    </Box>
  );
}