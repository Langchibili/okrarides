// 'use client';
// // PATH: driver/app/(main)/active-ride/[id]/page.jsx
// // MAP/MARKER CHANGES ONLY vs original:
// //   • routePickup / routeDropoff / routeReady / routeStatusRef added
// //   • Route reset effect on rideStatus change
// //   • accepted  → routePickup = driverLoc every 2s poll, routeDropoff = ride.pickupLocation (fixed)
// //   • passenger_onboard → both fixed, drawn once via guard
// //   • markers useMemo: overrides 'pickup' id in accepted phase so auto-pin doesn't
// //     appear at driverLoc (routePickup prop). Driver moves via updateDriverLocation only.
// //   • configureDriverMarker({ bg:'#1d4ed8', label:'🚗', size:42 }) in both onMapLoad callbacks

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
// import MapIframe from '@/components/Map/MapIframeNoSSR';

// const COMPLETE_TRIP_LOCK_MS = 60_000;

// function getPollingInterval(settings) {
//   const v = settings?.appsServerPollingIntervalInSeconds;
//   return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
// }

// const normalizeCoords = (loc) => {
//   if (!loc) return null;
//   const lat = loc.lat ?? loc.latitude;
//   const lng = loc.lng ?? loc.longitude;
//   if (lat == null || lng == null) return null;
//   return { ...loc, lat, lng };
// };

// const deg2rad = (d) => d * (Math.PI / 180);
// const calculateDistance = (a, b) => {
//   if (!a || !b) return 0;
//   const lat1 = a.lat ?? a.latitude ?? 0, lat2 = b.lat ?? b.latitude ?? 0;
//   const lng1 = a.lng ?? a.longitude ?? 0, lng2 = b.lng ?? b.longitude ?? 0;
//   const R = 6371;
//   const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
//   const x = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
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

//   const [ride,    setRide]    = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [driverLocation, setDriverLocation] = useState(null);
//   const [eta,            setEta]            = useState(null);
//   const [distance,       setDistance]       = useState(null);

//   // ── MAP: one-time route state ──────────────────────────────────────────────
//   const [routePickup,  setRoutePickup]  = useState(null);
//   const [routeDropoff, setRouteDropoff] = useState(null);
//   const [routeReady,   setRouteReady]   = useState(false);
//   const routeStatusRef = useRef(null);

//   const [showNavPopup,       setShowNavPopup]       = useState(false);
//   const [showFullScreenMap,  setShowFullScreenMap]  = useState(false);
//   const [showCompleteDialog, setShowCompleteDialog] = useState(false);
//   const [completing,         setCompleting]         = useState(false);

//   const mapControlsRef              = useRef(null);
//   const fullScreenMapControlsRef    = useRef(null);
//   const fullScreenMapInitializedRef = useRef(false);

//   const [paymentRequested,        setPaymentRequested]        = useState(false);
//   const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);

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

//   // ── Load ride ─────────────────────────────────────────────────────────────
//   const loadRideDetails = useCallback(async () => {
//     try {
//       const response = await apiClient.get(`/rides/${params.id}`);
//       if (response?.data && mountedRef.current) {
//         const rideData = response.data;
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

//   // ── Status polling ────────────────────────────────────────────────────────
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
//       } catch (err) { console.error('[ActiveRide] poll error:', err); }
//     }, interval);

//     return () => clearInterval(pollingRef.current);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [ride?.id, ride?.rideStatus, settings]);

//   // ── MAP: reset route when status changes ──────────────────────────────────
//   useEffect(() => {
//     routeStatusRef.current = null;
//     setRouteReady(false);
//     setRoutePickup(null);
//     setRouteDropoff(null);
//   }, [ride?.rideStatus]);

//   const rideStatus = ride?.rideStatus;

//   // ── 2-second live location + ETA + route ──────────────────────────────────
//   useEffect(() => {
//     if (!ride || ['completed', 'cancelled'].includes(rideStatus)) return;

//     const updateLocations = async () => {
//       if (!mountedRef.current) return;
//       try {
//         const driverRes = await apiClient.get(`/users/${ride.driver?.id}`);
//         const rawDriver = driverRes?.data?.currentLocation ?? driverRes?.currentLocation;
//         const driverLoc = normalizeCoords(rawDriver);

//         if (driverLoc && mountedRef.current) {
//           setDriverLocation(driverLoc);
//           // Smooth move — no re-render, no ghost pins
//           mapControlsRef.current?.updateDriverLocation(driverLoc);
//           if (fullScreenMapInitializedRef.current) {
//             fullScreenMapControlsRef.current?.updateDriverLocation(driverLoc);
//           }
//           updateLocation(driverLoc, rawDriver?.heading || 0, rawDriver?.speed || 0);
//         }

//         // ── ACCEPTED: driver → rider's pickup ────────────────────────────
//         // routePickup = driver's live position (updates every poll — shifts the
//         // route origin so the line follows the driver toward the pickup).
//         // fitBounds fires only on first draw (routeLoaded guard in IframeMap).
//         if (rideStatus === 'accepted' && driverLoc) {
//           const riderRes = await apiClient.get(`/users/${ride.rider?.id}`);
//           const rawRider = riderRes?.data?.currentLocation ?? riderRes?.currentLocation;
//           const riderLoc = normalizeCoords(rawRider);
//           const etaDest  = riderLoc ?? normalizeCoords(ride.pickupLocation);
//           if (etaDest) {
//             const dist = calculateDistance(driverLoc, etaDest);
//             if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
//           }

//           const pickup = normalizeCoords(ride.pickupLocation);
//           if (pickup) {
//             setRoutePickup(driverLoc); // live — shifts each poll
//             setRouteDropoff(pickup);   // fixed — rider's pickup location
//             setRouteReady(true);
//           }
//         }

//         // ── PASSENGER_ONBOARD / AWAITING_PAYMENT: pickup → dropoff ───────
//         // Both endpoints fixed. Drawn ONCE via routeStatusRef guard.
//         if ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && driverLoc) {
//           const dropoff = normalizeCoords(ride.dropoffLocation);
//           if (dropoff) {
//             const dist = calculateDistance(driverLoc, dropoff);
//             if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
//           }

//           if (routeStatusRef.current !== 'passenger_onboard') {
//             routeStatusRef.current = 'passenger_onboard';
//             const pickup      = normalizeCoords(ride.pickupLocation);
//             const dropoffNorm = normalizeCoords(ride.dropoffLocation);
//             if (pickup && dropoffNorm) {
//               setRoutePickup(pickup);       // fixed — where rider was picked up
//               setRouteDropoff(dropoffNorm); // fixed — destination
//               setRouteReady(true);
//             }
//           }
//         }

//       } catch (err) { console.error('[ActiveRide] location update error:', err); }
//     };

//     updateLocations();
//     locationPollRef.current = setInterval(updateLocations, 2000);
//     return () => clearInterval(locationPollRef.current);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [ride?.id, rideStatus, ride?.driver?.id, ride?.rider?.id]);

//   // ── MAP: markers ──────────────────────────────────────────────────────────
//   // Driver moves via updateDriverLocation (persistent 🚗, no ghost trail).
//   //
//   // ACCEPTED phase:
//   //   routePickup = driver's live position (changes every 2s).
//   //   IframeMap auto-adds a green 📍 at routePickup if 'pickup' id is NOT in markers.
//   //   → We override 'pickup' id to point to the ACTUAL pickup location instead.
//   //     This suppresses the phantom pin that would follow the driver around.
//   //
//   // ONBOARD / ARRIVED:
//   //   Both endpoints are fixed — show correct pins for both.
//   const markers = useMemo(() => {
//     if (!ride) return [];
//     const pickupLoc  = normalizeCoords(ride.pickupLocation);
//     const dropoffLoc = normalizeCoords(ride.dropoffLocation);

//     if (rideStatus === 'accepted') {
//       const result = [];
//       if (pickupLoc) result.push({ id: 'pickup', position: pickupLoc, type: 'pickup' });
//       return result;
//     }

//     if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment' || rideStatus === 'arrived') {
//       const result = [];
//       if (pickupLoc)  result.push({ id: 'pickup',  position: pickupLoc,  type: 'pickup'  });
//       if (dropoffLoc) result.push({ id: 'dropoff', position: dropoffLoc, type: 'dropoff' });
//       return result;
//     }

//     return [];
//   }, [rideStatus, ride]);

//   // ── PAYMENT_RECEIVED listeners ────────────────────────────────────────────
//   useEffect(() => {
//     const unsub = rnOn('PAYMENT_RECEIVED', (payload) => {
//       if (payload?.rideId && String(payload.rideId) !== String(params.id)) return;
//       clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
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
//         clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
//         router.push('/home');
//       } catch {}
//     };
//     window.addEventListener('message', handler);
//     return () => window.removeEventListener('message', handler);
//   }, [params.id, router]);

//   useEffect(() => {
//     const handlePaymentReceived = (data) => {
//       if (data.rideId && String(data.rideId) !== String(params.id)) return;
//       clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
//       router.push('/home');
//     };
//     socketOn(SOCKET_EVENTS.PAYMENT.RECEIVED, handlePaymentReceived);
//     return () => socketOff(SOCKET_EVENTS.PAYMENT.RECEIVED);
//   }, [socketOn, socketOff, params.id, router]);

//   // ── Request payment ───────────────────────────────────────────────────────
//   const handleRequestPayment = useCallback(() => {
//     try {
//       emit(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, { rideId: ride.id, driverId: ride.driver?.id, riderId: ride.rider?.id, finalFare: ride.totalFare });
//       setPaymentRequested(true);
//       setCompleteLockSecondsLeft(Math.round(COMPLETE_TRIP_LOCK_MS / 1000));
//       countdownRef.current = setInterval(() => {
//         setCompleteLockSecondsLeft(prev => { if (prev <= 1) { clearInterval(countdownRef.current); return 0; } return prev - 1; });
//       }, 1000);
//       lockTimerRef.current = setTimeout(() => { setCompleteLockSecondsLeft(0); setPaymentRequested(false); }, COMPLETE_TRIP_LOCK_MS);
//     } catch (err) { console.error('Error requesting payment:', err); }
//   }, [emit, ride]);

//   const completeTripLocked = completeLockSecondsLeft > 0;

//   const handleStartTrip      = async () => { try { await startTrip(ride.id); loadRideDetails(); } catch (err) { console.error(err); } };
//   const handleCompleteTrip   = async () => { if (completeTripLocked) return; setShowCompleteDialog(true); };
//   const handleConfirmComplete = async () => {
//     setCompleting(true);
//     try { await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration }); router.push('/home'); }
//     catch (err) { console.error(err); setCompleting(false); setShowCompleteDialog(false); }
//   };
//   const handleConfirmArrival  = async () => { try { await confirmArrival(ride.id); loadRideDetails(); } catch (err) { console.error(err); } };
//   const handleNavigate = () => setShowNavPopup(prev => !prev);

//   const handleOpenInGoogleMaps = () => {
//     const dest = (rideStatus === 'accepted' || rideStatus === 'arrived')
//       ? normalizeCoords(ride?.pickupLocation)
//       : normalizeCoords(ride?.dropoffLocation);
//     if (dest?.lat && dest?.lng)
//       window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`, '_blank');
//   };

//   const getStatusColor = (s) => ({ completed:'success', cancelled:'error', passenger_onboard:'primary', arrived:'success', accepted:'info', awaiting_payment:'warning' }[s] || 'default');

//   if (loading || !ride) return <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><CircularProgress /></Box>;

//   return (
//     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

//       {/* AppBar */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
//           <Typography variant="h6" sx={{ flex: 1 }}>Active Ride</Typography>
//           <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color:'white', mr:1 }} />
//         </Toolbar>
//       </AppBar>

//       {/* ── MAP ─────────────────────────────────────────────────────────── */}
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
//             onMapLoad={(c) => {
//               mapControlsRef.current = c;
//               c.configureDriverMarker?.({ bg: '#1d4ed8', label: '🚗', size: 42 });
//             }}
//           />
//         </Box>

//         {/* Navigate popup */}
//         <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
//           <AnimatePresence>
//             {showNavPopup && (
//               <motion.div key="nav-popup" initial={{ opacity:0, y:10, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:10, scale:0.95 }} transition={{ type:'spring', stiffness:340, damping:28 }} style={{ marginBottom: 10 }}>
//                 <Paper elevation={10} sx={{ borderRadius:3, overflow:'hidden', minWidth:192, border:'1px solid', borderColor:'divider' }}>
//                   <Button fullWidth startIcon={<MapIcon />} onClick={() => { setShowNavPopup(false); setShowFullScreenMap(true); }} sx={{ justifyContent:'flex-start', px:2.5, py:1.5, fontWeight:700, textTransform:'none', borderRadius:0, borderBottom:'1px solid', borderColor:'divider' }}>In App</Button>
//                   <Button fullWidth startIcon={<OpenInNewIcon />} onClick={() => { setShowNavPopup(false); handleOpenInGoogleMaps(); }} sx={{ justifyContent:'flex-start', px:2.5, py:1.5, fontWeight:700, textTransform:'none', borderRadius:0 }}>Use Google Maps</Button>
//                 </Paper>
//               </motion.div>
//             )}
//           </AnimatePresence>
//           <Fab variant="extended" color="primary" sx={{ borderRadius:'24px' }} onClick={handleNavigate}>
//             <NavigationIcon sx={{ mr:1 }} />Directions
//           </Fab>
//         </Box>
//       </Box>

//       {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
//       <Paper elevation={8} sx={{ borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'60vh', overflow:'auto' }}>
//         <Box sx={{ p:3 }}>

//           {/* ETA banner */}
//           <AnimatePresence>
//             {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && (
//               <motion.div key={rideStatus+'-eta'} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ type:'spring', stiffness:280, damping:24 }}>
//                 <Box sx={{ p:2, borderRadius:3, mb:2, background: rideStatus==='accepted' ? 'linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(5,150,105,0.06) 100%)' : 'linear-gradient(135deg,rgba(255,193,7,0.12) 0%,rgba(255,140,0,0.06) 100%)', border:'1px solid', borderColor: rideStatus==='accepted' ? 'rgba(16,185,129,0.25)' : 'rgba(255,193,7,0.25)' }}>
//                   <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.8 }}>
//                     <SpeedIcon sx={{ fontSize:18, color: rideStatus==='accepted' ? '#10B981' : '#FF8C00' }} />
//                     <Typography variant="subtitle2" sx={{ fontWeight:700 }}>{rideStatus==='accepted' ? 'Heading to Pickup' : 'Trip in Progress'}</Typography>
//                   </Box>
//                   <Typography variant="body2" sx={{ color:'text.secondary', mb: eta!=null ? 1.5 : 0 }}>
//                     {rideStatus==='accepted' ? 'Drive to the pickup location to collect your rider.' : "Keep going — you're on your way to the destination!"}
//                   </Typography>
//                   {eta != null && (
//                     <Box>
//                       <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:0.5 }}>
//                         <Typography variant="caption" sx={{ fontWeight:600 }}>{rideStatus==='accepted' ? 'ETA to Pickup' : 'ETA to Destination'}</Typography>
//                         <Box sx={{ display:'flex', gap:1.5, alignItems:'center' }}>
//                           {distance!=null && <Typography variant="caption" sx={{ fontWeight:700, color:'text.secondary' }}>{distance.toFixed(1)} km</Typography>}
//                           <Typography variant="caption" sx={{ fontWeight:800, color: rideStatus==='accepted' ? '#10B981' : '#FF8C00' }}>{formatETA(eta)}</Typography>
//                         </Box>
//                       </Box>
//                       <LinearProgress variant="indeterminate" sx={{ borderRadius:2, height:5, bgcolor: rideStatus==='accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(255,193,7,0.15)', '& .MuiLinearProgress-bar': { background: rideStatus==='accepted' ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#FFC107,#FF8C00)' } }} />
//                     </Box>
//                   )}
//                 </Box>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Rider Info */}
//           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
//             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Rider Information</Typography>
//             <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
//               <Avatar sx={{ width:56, height:56, bgcolor:'primary.secondary' }}>
//                 {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
//               </Avatar>
//               <Box sx={{ flex:1 }}>
//                 <Typography variant="h6" sx={{ fontWeight:600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
//                 <Typography variant="body2" color="text.secondary">{(() => { const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber; const d = (raw||'').replace(/\D/g,''); return d.length>10?d.slice(-10):d; })()}</Typography>
//                 <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:0.5 }}>
//                   <StarIcon sx={{ fontSize:16, color:'warning.main' }} />
//                   <Typography variant="body2">{ride.rider?.riderProfile?.averageRating?.toFixed(1)||'5.0'} • {ride.rider?.riderProfile?.completedRides||0} rides</Typography>
//                 </Box>
//               </Box>
//               <Box sx={{ display:'flex', gap:1, flexShrink:0 }}>
//                 <IconButton onClick={() => { const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber; const d=(raw||'').replace(/\D/g,'');alert(`tel:${d.length>10?d.slice(-10):d}`); window.location.href=`tel:${d.length>10?d.slice(-10):d}`; }} sx={{ bgcolor:'success.main', color:'#fff', width:40, height:40, '&:hover':{ bgcolor:'success.dark', transform:'scale(1.08)' }, transition:'all 0.16s ease' }}><PhoneIcon sx={{ fontSize:18 }} /></IconButton>
//                 <IconButton onClick={() => { const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber; window.open(`https://wa.me/${(raw||'').replace(/\D/g,'')}`, '_blank'); }} sx={{ background:'linear-gradient(135deg,#10B981 0%,#059669 100%)', color:'#000', width:40, height:40, '&:hover':{ transform:'scale(1.08)' }, transition:'all 0.16s ease' }}><MessageIcon sx={{ fontSize:18 }} /></IconButton>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Trip Details */}
//           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
//             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Details</Typography>
//             <Box sx={{ display:'flex', gap:2, mb:2 }}>
//               <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'success.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><MyLocationIcon sx={{ color:'success.dark', fontSize:20 }} /></Box>
//               <Box sx={{ flex:1 }}>
//                 <Typography variant="caption" color="text.secondary">PICKUP</Typography>
//                 <Typography variant="body1" sx={{ fontWeight:500 }}>{ride.pickupLocation?.address}</Typography>
//               </Box>
//             </Box>
//             <Box sx={{ width:2, height:16, bgcolor:'divider', ml:2.2, mb:1 }} />
//             <Box sx={{ display:'flex', gap:2 }}>
//               <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'error.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><LocationIcon sx={{ color:'error.dark', fontSize:20 }} /></Box>
//               <Box sx={{ flex:1 }}>
//                 <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
//                 <Typography variant="body1" sx={{ fontWeight:500 }}>{ride.dropoffLocation?.address}</Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Fare */}
//           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
//             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}><ReceiptIcon sx={{ verticalAlign:'middle', mr:1 }} />Fare</Typography>
//             <List disablePadding>
//               {ride.baseFare      != null && <ListItem sx={{ px:0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
//               {ride.distanceFare  != null && <ListItem sx={{ px:0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
//               {ride.surgeFare     >  0    && <ListItem sx={{ px:0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
//               {ride.promoDiscount >  0    && <ListItem sx={{ px:0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
//               <Divider sx={{ my:1 }} />
//               <ListItem sx={{ px:0 }}><ListItemText primary="Total" primaryTypographyProps={{ fontWeight:600 }} /><Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography></ListItem>
//               <ListItem sx={{ px:0 }}><ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight:700, fontSize:'1.1rem' }} /><Typography fontWeight={700} fontSize="1.1rem" color="success.main">{formatCurrency(ride.driverEarnings||(ride.totalFare-(ride.commission||0)))}</Typography></ListItem>
//             </List>
//             <Chip label={`Payment: ${ride.paymentMethod==='cash'?'💵 Cash':'💳 OkraPay'}`} sx={{ mt:2, fontWeight:600 }} />
//           </Paper>

//           {/* Trip Stats */}
//           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
//             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Statistics</Typography>
//             <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
//               <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
//                 <Typography variant="h5" sx={{ fontWeight:700, color:'primary.main' }}>{(ride.actualDistance??ride.estimatedDistance??0).toFixed(1)} km</Typography>
//                 <Typography variant="caption" color="text.secondary">Distance</Typography>
//               </Box>
//               <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
//                 <Typography variant="h5" sx={{ fontWeight:700, color:'info.main' }}>{formatETA(ride.actualDuration??ride.estimatedDuration)}</Typography>
//                 <Typography variant="caption" color="text.secondary">Duration</Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Action Buttons */}
//           {ride.rideStatus === 'accepted' && (
//             <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival} sx={{ height:56, fontWeight:700, borderRadius:3, bgcolor:'success.main', '&:hover':{ bgcolor:'success.dark' }, mb:1 }}>I've Arrived at Pickup</Button>
//           )}
//           {ride.rideStatus === 'arrived' && (
//             <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />} sx={{ height:56, fontWeight:700, borderRadius:3, mb:1 }}>Start Trip</Button>
//           )}

//           {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
//             <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>
//               {okrapayAllowedForRides && (
//                 <Button fullWidth variant="contained" size="large" onClick={handleRequestPayment}
//                   disabled={paymentRequested && completeLockSecondsLeft > 0} startIcon={<PaymentIcon />}
//                   sx={{ height:56, fontWeight:700, borderRadius:3, bgcolor:(paymentRequested&&completeLockSecondsLeft>0)?'grey.400':'warning.main', '&:hover':{ bgcolor:(paymentRequested&&completeLockSecondsLeft>0)?'grey.400':'warning.dark' }, '&.Mui-disabled':{ bgcolor:'grey.300', color:'grey.500' } }}>
//                   {(paymentRequested&&completeLockSecondsLeft>0) ? `Payment Requested ✓  (${completeLockSecondsLeft}s)` : 'Request Payment'}
//                 </Button>
//               )}

//               {completeTripLocked && (
//                 <Box>
//                   <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}><TimerIcon sx={{ fontSize:16, color:'text.secondary' }} /><Typography variant="caption" color="text.secondary">Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay</Typography></Box>
//                   <LinearProgress variant="determinate" value={((COMPLETE_TRIP_LOCK_MS/1000-completeLockSecondsLeft)/(COMPLETE_TRIP_LOCK_MS/1000))*100} sx={{ borderRadius:1, height:6, bgcolor:'warning.light', '& .MuiLinearProgress-bar':{ bgcolor:'warning.main' } }} />
//                 </Box>
//               )}

//               {ride.rideStatus === 'awaiting_payment' && <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius:2 }}>Waiting for rider to complete payment…</Alert>}

//               <Button fullWidth variant="contained" color="success" size="large" onClick={handleCompleteTrip} disabled={completeTripLocked} startIcon={<CheckIcon />} sx={{ height:56, fontWeight:700, borderRadius:3, opacity:completeTripLocked?0.5:1 }}>Complete Trip</Button>
//             </Box>
//           )}

//           {['pending','accepted','arrived'].includes(ride.rideStatus) && (
//             <Button fullWidth variant="outlined" color="error" sx={{ height:48, borderRadius:3, fontWeight:600, borderWidth:2, mt:1, '&:hover':{ borderWidth:2 } }}
//               onClick={async () => { const reason = window.prompt('Reason for cancellation:'); if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch(e) { console.error(e); } } }}>
//               Cancel Ride
//             </Button>
//           )}
//         </Box>
//       </Paper>

//       {/* Full-screen in-app map modal */}
//       <Dialog fullScreen open={showFullScreenMap} onClose={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}>
//         <Box sx={{ width:'100%', height:'100%', position:'relative', bgcolor:'#000' }}>
//           <MapIframe
//             center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat:-15.4167, lng:28.2833 }}
//             zoom={16}
//             height="100%"
//             markers={markers}
//             pickupLocation={routePickup}
//             dropoffLocation={routeDropoff}
//             showRoute={routeReady}
//             onMapLoad={(c) => {
//               fullScreenMapControlsRef.current = c;
//               c.configureDriverMarker?.({ bg: '#1d4ed8', label: '🚗', size: 42 });
//               if (driverLocation && !fullScreenMapInitializedRef.current) {
//                 setTimeout(() => { fullScreenMapControlsRef.current?.animateToLocation(driverLocation, 16); fullScreenMapInitializedRef.current = true; }, 700);
//               }
//             }}
//           />
//           <Box sx={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', zIndex:10 }}>
//             <Button variant="contained" size="large" startIcon={<CloseIcon />}
//               onClick={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}
//               sx={{ height:52, px:5, borderRadius:3.5, fontWeight:700, bgcolor:'rgba(0,0,0,0.78)', backdropFilter:'blur(12px)', color:'#fff', border:'1px solid rgba(255,255,255,0.18)', boxShadow:'0 4px 24px rgba(0,0,0,0.5)', '&:hover':{ bgcolor:'rgba(0,0,0,0.92)' } }}>
//               Close Map
//             </Button>
//           </Box>
//         </Box>
//       </Dialog>

//       {/* Complete Trip dialog */}
//       <Dialog open={showCompleteDialog} onClose={() => !completing && setShowCompleteDialog(false)} PaperProps={{ sx:{ borderRadius:4, maxWidth:360, mx:2, border:'1px solid', borderColor:'divider' } }}>
//         <DialogTitle sx={{ fontWeight:700, pb:0.5 }}>
//           <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
//             <Box sx={{ width:40, height:40, borderRadius:2, flexShrink:0, background:'linear-gradient(135deg,#10B981 0%,#059669 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(16,185,129,0.35)' }}><CheckIcon sx={{ fontSize:22, color:'#fff' }} /></Box>
//             Complete Trip?
//           </Box>
//         </DialogTitle>
//         <DialogContent sx={{ pt:1.5, pb:1 }}>
//           <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.65 }}>Please confirm that the rider has been dropped off at the destination and the trip is finished.</Typography>
//           {ride?.totalFare != null && (
//             <Box sx={{ mt:2, p:1.5, borderRadius:2, bgcolor:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)' }}>
//               <Typography variant="caption" color="text.disabled" sx={{ fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, display:'block' }}>Your Earnings</Typography>
//               <Typography variant="h6" sx={{ fontWeight:800, color:'#10B981' }}>{formatCurrency(ride.driverEarnings||(ride.totalFare-(ride.commission||0)))}</Typography>
//             </Box>
//           )}
//         </DialogContent>
//         <DialogActions sx={{ px:2.5, pb:2.5, gap:1 }}>
//           <Button onClick={() => setShowCompleteDialog(false)} disabled={completing} variant="outlined" sx={{ flex:1, borderRadius:2.5, fontWeight:600, height:44 }}>Not Yet</Button>
//           <Button onClick={handleConfirmComplete} disabled={completing} variant="contained" color="success" startIcon={completing?<CircularProgress size={16} color="inherit" />:<CheckIcon />} sx={{ flex:1, borderRadius:2.5, fontWeight:700, height:44 }}>
//             {completing ? 'Completing…' : 'Yes, Complete'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {showNavPopup && <Box sx={{ position:'fixed', inset:0, zIndex:9 }} onClick={() => setShowNavPopup(false)} />}
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
  FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
  Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
  Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
  OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
  AccessTime as TimerIcon, Map as MapIcon, Speed as SpeedIcon,
  Cancel as CancelIcon, Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRide } from '@/lib/hooks/useRide';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import MapIframe from '@/components/Map/MapIframeNoSSR';

const COMPLETE_TRIP_LOCK_MS = 60_000;
const DEFAULT_CANCEL_REASON = 'Change of plans';

function getPollingInterval(settings) {
  const v = settings?.appsServerPollingIntervalInSeconds;
  return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
}

const normalizeCoords = (loc) => {
  if (!loc) return null;
  const lat = loc.lat ?? loc.latitude;
  const lng = loc.lng ?? loc.longitude;
  if (lat == null || lng == null) return null;
  return { ...loc, lat, lng };
};

const deg2rad = (d) => d * (Math.PI / 180);
const calculateDistance = (a, b) => {
  if (!a || !b) return 0;
  const lat1 = a.lat ?? a.latitude ?? 0, lat2 = b.lat ?? b.latitude ?? 0;
  const lng1 = a.lng ?? a.longitude ?? 0, lng2 = b.lng ?? b.longitude ?? 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
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

  const [ride,    setRide]    = useState(null);
  const [loading, setLoading] = useState(true);

  const [driverLocation, setDriverLocation] = useState(null);
  const [eta,            setEta]            = useState(null);
  const [distance,       setDistance]       = useState(null);

  // ── MAP: one-time route state ──────────────────────────────────────────────
  const [routePickup,  setRoutePickup]  = useState(null);
  const [routeDropoff, setRouteDropoff] = useState(null);
  const [routeReady,   setRouteReady]   = useState(false);
  const routeStatusRef = useRef(null);

  const [showNavPopup,       setShowNavPopup]       = useState(false);
  const [showFullScreenMap,  setShowFullScreenMap]  = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completing,         setCompleting]         = useState(false);

  // ── Cancel flow ───────────────────────────────────────────────────────────
  const [showCancelConfirm,    setShowCancelConfirm]    = useState(false);
  const [showCancelReasons,    setShowCancelReasons]    = useState(false);
  const [cancelReasons,        setCancelReasons]        = useState([]);
  const [cancelReasonsLoading, setCancelReasonsLoading] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [cancelOtherText,      setCancelOtherText]      = useState('');
  const [cancelling,           setCancelling]           = useState(false);

  const mapControlsRef              = useRef(null);
  const fullScreenMapControlsRef    = useRef(null);
  const fullScreenMapInitializedRef = useRef(false);

  const [paymentRequested,        setPaymentRequested]        = useState(false);
  const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);

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

  // ── Load ride ─────────────────────────────────────────────────────────────
  const loadRideDetails = useCallback(async () => {
    try {
      const response = await apiClient.get(`/rides/${params.id}`);
      if (response?.data && mountedRef.current) {
        const rideData = response.data;
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

  // ── Status polling ────────────────────────────────────────────────────────
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
      } catch (err) { console.error('[ActiveRide] poll error:', err); }
    }, interval);

    return () => clearInterval(pollingRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id, ride?.rideStatus, settings]);

  // ── MAP: reset route when status changes ──────────────────────────────────
  useEffect(() => {
    routeStatusRef.current = null;
    setRouteReady(false);
    setRoutePickup(null);
    setRouteDropoff(null);
  }, [ride?.rideStatus]);

  const rideStatus = ride?.rideStatus;

  // ── 2-second live location + ETA + route ──────────────────────────────────
  useEffect(() => {
    if (!ride || ['completed', 'cancelled'].includes(rideStatus)) return;

    const updateLocations = async () => {
      if (!mountedRef.current) return;
      try {
        const driverRes = await apiClient.get(`/users/${ride.driver?.id}`);
        const rawDriver = driverRes?.data?.currentLocation ?? driverRes?.currentLocation;
        const driverLoc = normalizeCoords(rawDriver);

        if (driverLoc && mountedRef.current) {
          setDriverLocation(driverLoc);
          mapControlsRef.current?.updateDriverLocation(driverLoc);
          if (fullScreenMapInitializedRef.current) {
            fullScreenMapControlsRef.current?.updateDriverLocation(driverLoc);
          }
          updateLocation(driverLoc, rawDriver?.heading || 0, rawDriver?.speed || 0);
        }

        if (rideStatus === 'accepted' && driverLoc) {
          const riderRes = await apiClient.get(`/users/${ride.rider?.id}`);
          const rawRider = riderRes?.data?.currentLocation ?? riderRes?.currentLocation;
          const riderLoc = normalizeCoords(rawRider);
          const etaDest  = riderLoc ?? normalizeCoords(ride.pickupLocation);
          if (etaDest) {
            const dist = calculateDistance(driverLoc, etaDest);
            if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
          }

          const pickup = normalizeCoords(ride.pickupLocation);
          if (pickup) {
            setRoutePickup(driverLoc);
            setRouteDropoff(pickup);
            setRouteReady(true);
          }
        }

        if ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && driverLoc) {
          const dropoff = normalizeCoords(ride.dropoffLocation);
          if (dropoff) {
            const dist = calculateDistance(driverLoc, dropoff);
            if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
          }

          if (routeStatusRef.current !== 'passenger_onboard') {
            routeStatusRef.current = 'passenger_onboard';
            const pickup      = normalizeCoords(ride.pickupLocation);
            const dropoffNorm = normalizeCoords(ride.dropoffLocation);
            if (pickup && dropoffNorm) {
              setRoutePickup(pickup);
              setRouteDropoff(dropoffNorm);
              setRouteReady(true);
            }
          }
        }

      } catch (err) { console.error('[ActiveRide] location update error:', err); }
    };

    updateLocations();
    locationPollRef.current = setInterval(updateLocations, 2000);
    return () => clearInterval(locationPollRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id, rideStatus, ride?.driver?.id, ride?.rider?.id]);

  // ── MAP: markers ──────────────────────────────────────────────────────────
  const markers = useMemo(() => {
    if (!ride) return [];
    const pickupLoc  = normalizeCoords(ride.pickupLocation);
    const dropoffLoc = normalizeCoords(ride.dropoffLocation);

    if (rideStatus === 'accepted') {
      const result = [];
      if (pickupLoc) result.push({ id: 'pickup', position: pickupLoc, type: 'pickup' });
      return result;
    }

    if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment' || rideStatus === 'arrived') {
      const result = [];
      if (pickupLoc)  result.push({ id: 'pickup',  position: pickupLoc,  type: 'pickup'  });
      if (dropoffLoc) result.push({ id: 'dropoff', position: dropoffLoc, type: 'dropoff' });
      return result;
    }

    return [];
  }, [rideStatus, ride]);

  // ── PAYMENT_RECEIVED listeners ────────────────────────────────────────────
  useEffect(() => {
    const unsub = rnOn('PAYMENT_RECEIVED', (payload) => {
      if (payload?.rideId && String(payload.rideId) !== String(params.id)) return;
      clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
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
        clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
        router.push('/home');
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [params.id, router]);

  useEffect(() => {
    const handlePaymentReceived = (data) => {
      if (data.rideId && String(data.rideId) !== String(params.id)) return;
      clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
      router.push('/home');
    };
    socketOn(SOCKET_EVENTS.PAYMENT.RECEIVED, handlePaymentReceived);
    return () => socketOff(SOCKET_EVENTS.PAYMENT.RECEIVED);
  }, [socketOn, socketOff, params.id, router]);

  // ── Request payment ───────────────────────────────────────────────────────
  const handleRequestPayment = useCallback(() => {
    try {
      emit(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, { rideId: ride.id, driverId: ride.driver?.id, riderId: ride.rider?.id, finalFare: ride.totalFare });
      setPaymentRequested(true);
      setCompleteLockSecondsLeft(Math.round(COMPLETE_TRIP_LOCK_MS / 1000));
      countdownRef.current = setInterval(() => {
        setCompleteLockSecondsLeft(prev => { if (prev <= 1) { clearInterval(countdownRef.current); return 0; } return prev - 1; });
      }, 1000);
      lockTimerRef.current = setTimeout(() => { setCompleteLockSecondsLeft(0); setPaymentRequested(false); }, COMPLETE_TRIP_LOCK_MS);
    } catch (err) { console.error('Error requesting payment:', err); }
  }, [emit, ride]);

  const completeTripLocked = completeLockSecondsLeft > 0;

  const handleStartTrip      = async () => { try { await startTrip(ride.id); loadRideDetails(); } catch (err) { console.error(err); } };
  const handleCompleteTrip   = async () => { if (completeTripLocked) return; setShowCompleteDialog(true); };
  const handleConfirmComplete = async () => {
    setCompleting(true);
    try { await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration }); router.push('/home'); }
    catch (err) { console.error(err); setCompleting(false); setShowCompleteDialog(false); }
  };
  const handleConfirmArrival  = async () => { try { await confirmArrival(ride.id); loadRideDetails(); } catch (err) { console.error(err); } };
  const handleNavigate = () => setShowNavPopup(prev => !prev);

  const handleOpenInGoogleMaps = () => {
    const dest = (rideStatus === 'accepted' || rideStatus === 'arrived')
      ? normalizeCoords(ride?.pickupLocation)
      : normalizeCoords(ride?.dropoffLocation);
    if (dest?.lat && dest?.lng)
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`, '_blank');
  };

  // ── Cancel handlers ───────────────────────────────────────────────────────
  const handleCancelPress = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirmYes = async () => {
    setShowCancelConfirm(false);
    setCancelReasonsLoading(true);
    setShowCancelReasons(true);
    setSelectedCancelReason('');
    setCancelOtherText('');
    try {
      const res = await apiClient.get('/cancellation-reasons?filters[isActive][$eq]=true&filters[applicableFor][$in][0]=driver&filters[applicableFor][$in][1]=both&sort=displayOrder:asc');
      const reasons = res?.data ?? res ?? [];
      if (mountedRef.current) setCancelReasons(reasons);
    } catch (err) {
      console.error('[ActiveRide] failed to load cancellation reasons:', err);
      if (mountedRef.current) setCancelReasons([]);
    } finally {
      if (mountedRef.current) setCancelReasonsLoading(false);
    }
  };

  const handleCancelConfirmNo = () => {
    setShowCancelConfirm(false);
  };

  const handleCancelWithReason = async () => {
    const isOther = selectedCancelReason === '__other__';
    const reason  = isOther
      ? (cancelOtherText.trim() || 'Other')
      : (cancelReasons.find(r => String(r.id) === String(selectedCancelReason))?.reason || selectedCancelReason);

    if (!reason) return;
    setCancelling(true);
    try {
      await cancelRide(ride.id, reason);
      router.push('/home');
    } catch (e) {
      console.error(e);
      setCancelling(false);
    }
  };

  const handleCancelWithoutReason = async () => {
    setCancelling(true);
    try {
      await cancelRide(ride.id, DEFAULT_CANCEL_REASON);
      router.push('/home');
    } catch (e) {
      console.error(e);
      setCancelling(false);
    }
  };

  const handleCloseCancelReasons = () => {
    if (cancelling) return;
    setShowCancelReasons(false);
    setCancelReasons([]);
    setSelectedCancelReason('');
    setCancelOtherText('');
  };

  const canSubmitCancel = selectedCancelReason && (
    selectedCancelReason !== '__other__' || cancelOtherText.trim().length > 0
  );

  const getStatusColor = (s) => ({ completed:'success', cancelled:'error', passenger_onboard:'primary', arrived:'success', accepted:'info', awaiting_payment:'warning' }[s] || 'default');

  if (loading || !ride) return <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>Active Ride</Typography>
          <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color:'white', mr:1 }} />
        </Toolbar>
      </AppBar>

      {/* ── MAP ─────────────────────────────────────────────────────────── */}
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
            onMapLoad={(c) => {
              mapControlsRef.current = c;
              c.configureDriverMarker?.({ bg: '#1d4ed8', label: '🚗', size: 42 });
            }}
          />
        </Box>

        {/* Navigate popup */}
        <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
          <AnimatePresence>
            {showNavPopup && (
              <motion.div key="nav-popup" initial={{ opacity:0, y:10, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:10, scale:0.95 }} transition={{ type:'spring', stiffness:340, damping:28 }} style={{ marginBottom: 10 }}>
                <Paper elevation={10} sx={{ borderRadius:3, overflow:'hidden', minWidth:192, border:'1px solid', borderColor:'divider' }}>
                  <Button fullWidth startIcon={<MapIcon />} onClick={() => { setShowNavPopup(false); setShowFullScreenMap(true); }} sx={{ justifyContent:'flex-start', px:2.5, py:1.5, fontWeight:700, textTransform:'none', borderRadius:0, borderBottom:'1px solid', borderColor:'divider' }}>In App</Button>
                  <Button fullWidth startIcon={<OpenInNewIcon />} onClick={() => { setShowNavPopup(false); handleOpenInGoogleMaps(); }} sx={{ justifyContent:'flex-start', px:2.5, py:1.5, fontWeight:700, textTransform:'none', borderRadius:0 }}>Use Google Maps</Button>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
          <Fab variant="extended" color="primary" sx={{ borderRadius:'24px' }} onClick={handleNavigate}>
            <NavigationIcon sx={{ mr:1 }} />Directions
          </Fab>
        </Box>
      </Box>

      {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
      <Paper elevation={8} sx={{ borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'60vh', overflow:'auto' }}>
        <Box sx={{ p:3 }}>

          {/* ETA banner */}
          <AnimatePresence>
            {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && (
              <motion.div key={rideStatus+'-eta'} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ type:'spring', stiffness:280, damping:24 }}>
                <Box sx={{ p:2, borderRadius:3, mb:2, background: rideStatus==='accepted' ? 'linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(5,150,105,0.06) 100%)' : 'linear-gradient(135deg,rgba(255,193,7,0.12) 0%,rgba(255,140,0,0.06) 100%)', border:'1px solid', borderColor: rideStatus==='accepted' ? 'rgba(16,185,129,0.25)' : 'rgba(255,193,7,0.25)' }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.8 }}>
                    <SpeedIcon sx={{ fontSize:18, color: rideStatus==='accepted' ? '#10B981' : '#FF8C00' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight:700 }}>{rideStatus==='accepted' ? 'Heading to Pickup' : 'Trip in Progress'}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color:'text.secondary', mb: eta!=null ? 1.5 : 0 }}>
                    {rideStatus==='accepted' ? 'Drive to the pickup location to collect your rider.' : "Keep going — you're on your way to the destination!"}
                  </Typography>
                  {eta != null && (
                    <Box>
                      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight:600 }}>{rideStatus==='accepted' ? 'ETA to Pickup' : 'ETA to Destination'}</Typography>
                        <Box sx={{ display:'flex', gap:1.5, alignItems:'center' }}>
                          {distance!=null && <Typography variant="caption" sx={{ fontWeight:700, color:'text.secondary' }}>{distance.toFixed(1)} km</Typography>}
                          <Typography variant="caption" sx={{ fontWeight:800, color: rideStatus==='accepted' ? '#10B981' : '#FF8C00' }}>{formatETA(eta)}</Typography>
                        </Box>
                      </Box>
                      <LinearProgress variant="indeterminate" sx={{ borderRadius:2, height:5, bgcolor: rideStatus==='accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(255,193,7,0.15)', '& .MuiLinearProgress-bar': { background: rideStatus==='accepted' ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#FFC107,#FF8C00)' } }} />
                    </Box>
                  )}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rider Info */}
          <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
            <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Rider Information</Typography>
            <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
              <Avatar sx={{ width:56, height:56, bgcolor:'primary.secondary' }}>
                {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
              </Avatar>
              <Box sx={{ flex:1 }}>
                <Typography variant="h6" sx={{ fontWeight:600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{(() => { const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber; const d = (raw||'').replace(/\D/g,''); return d.length>10?d.slice(-10):d; })()}</Typography>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:0.5 }}>
                  <StarIcon sx={{ fontSize:16, color:'warning.main' }} />
                  <Typography variant="body2">{ride.rider?.riderProfile?.averageRating?.toFixed(1)||'5.0'} • {ride.rider?.riderProfile?.completedRides||0} rides</Typography>
                </Box>
              </Box>
              <Box sx={{ display:'flex', gap:1, flexShrink:0 }}>
                <IconButton onClick={() => { const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber; const d=(raw||'').replace(/\D/g,''); window.location.href=`tel:${d.length>10?d.slice(-10):d}`; }} sx={{ bgcolor:'success.main', color:'#fff', width:40, height:40, '&:hover':{ bgcolor:'success.dark', transform:'scale(1.08)' }, transition:'all 0.16s ease' }}><PhoneIcon sx={{ fontSize:18 }} /></IconButton>
                <IconButton onClick={() => { const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber; window.open(`https://wa.me/${(raw||'').replace(/\D/g,'')}`, '_blank'); }} sx={{ background:'linear-gradient(135deg,#10B981 0%,#059669 100%)', color:'#000', width:40, height:40, '&:hover':{ transform:'scale(1.08)' }, transition:'all 0.16s ease' }}><MessageIcon sx={{ fontSize:18 }} /></IconButton>
              </Box>
            </Box>
          </Paper>

          {/* Trip Details */}
          <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
            <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Details</Typography>
            <Box sx={{ display:'flex', gap:2, mb:2 }}>
              <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'success.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><MyLocationIcon sx={{ color:'success.dark', fontSize:20 }} /></Box>
              <Box sx={{ flex:1 }}>
                <Typography variant="caption" color="text.secondary">PICKUP</Typography>
                <Typography variant="body1" sx={{ fontWeight:500 }}>{ride.pickupLocation?.address}</Typography>
              </Box>
            </Box>
            <Box sx={{ width:2, height:16, bgcolor:'divider', ml:2.2, mb:1 }} />
            <Box sx={{ display:'flex', gap:2 }}>
              <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'error.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><LocationIcon sx={{ color:'error.dark', fontSize:20 }} /></Box>
              <Box sx={{ flex:1 }}>
                <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
                <Typography variant="body1" sx={{ fontWeight:500 }}>{ride.dropoffLocation?.address}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Fare */}
          <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
            <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}><ReceiptIcon sx={{ verticalAlign:'middle', mr:1 }} />Fare</Typography>
            <List disablePadding>
              {ride.baseFare      != null && <ListItem sx={{ px:0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
              {ride.distanceFare  != null && <ListItem sx={{ px:0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
              {ride.surgeFare     >  0    && <ListItem sx={{ px:0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
              {ride.promoDiscount >  0    && <ListItem sx={{ px:0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
              <Divider sx={{ my:1 }} />
              <ListItem sx={{ px:0 }}><ListItemText primary="Total" primaryTypographyProps={{ fontWeight:600 }} /><Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography></ListItem>
              <ListItem sx={{ px:0 }}><ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight:700, fontSize:'1.1rem' }} /><Typography fontWeight={700} fontSize="1.1rem" color="success.main">{formatCurrency(ride.driverEarnings||(ride.totalFare-(ride.commission||0)))}</Typography></ListItem>
            </List>
            <Chip label={`Payment: ${ride.paymentMethod==='cash'?'💵 Cash':'💳 OkraPay'}`} sx={{ mt:2, fontWeight:600 }} />
          </Paper>

          {/* Trip Stats */}
          <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
            <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Statistics</Typography>
            <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
              <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
                <Typography variant="h5" sx={{ fontWeight:700, color:'primary.main' }}>{(ride.actualDistance??ride.estimatedDistance??0).toFixed(1)} km</Typography>
                <Typography variant="caption" color="text.secondary">Distance</Typography>
              </Box>
              <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
                <Typography variant="h5" sx={{ fontWeight:700, color:'info.main' }}>{formatETA(ride.actualDuration??ride.estimatedDuration)}</Typography>
                <Typography variant="caption" color="text.secondary">Duration</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Action Buttons */}
          {ride.rideStatus === 'accepted' && (
            <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival} sx={{ height:56, fontWeight:700, borderRadius:3, bgcolor:'success.main', '&:hover':{ bgcolor:'success.dark' }, mb:1 }}>I've Arrived at Pickup</Button>
          )}
          {ride.rideStatus === 'arrived' && (
            <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />} sx={{ height:56, fontWeight:700, borderRadius:3, mb:1 }}>Start Trip</Button>
          )}

          {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
            <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>
              {okrapayAllowedForRides && (
                <Button fullWidth variant="contained" size="large" onClick={handleRequestPayment}
                  disabled={paymentRequested && completeLockSecondsLeft > 0} startIcon={<PaymentIcon />}
                  sx={{ height:56, fontWeight:700, borderRadius:3, bgcolor:(paymentRequested&&completeLockSecondsLeft>0)?'grey.400':'warning.main', '&:hover':{ bgcolor:(paymentRequested&&completeLockSecondsLeft>0)?'grey.400':'warning.dark' }, '&.Mui-disabled':{ bgcolor:'grey.300', color:'grey.500' } }}>
                  {(paymentRequested&&completeLockSecondsLeft>0) ? `Payment Requested ✓  (${completeLockSecondsLeft}s)` : 'Request Payment'}
                </Button>
              )}

              {completeTripLocked && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}><TimerIcon sx={{ fontSize:16, color:'text.secondary' }} /><Typography variant="caption" color="text.secondary">Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay</Typography></Box>
                  <LinearProgress variant="determinate" value={((COMPLETE_TRIP_LOCK_MS/1000-completeLockSecondsLeft)/(COMPLETE_TRIP_LOCK_MS/1000))*100} sx={{ borderRadius:1, height:6, bgcolor:'warning.light', '& .MuiLinearProgress-bar':{ bgcolor:'warning.main' } }} />
                </Box>
              )}

              {ride.rideStatus === 'awaiting_payment' && <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius:2 }}>Waiting for rider to complete payment…</Alert>}

              <Button fullWidth variant="contained" color="success" size="large" onClick={handleCompleteTrip} disabled={completeTripLocked} startIcon={<CheckIcon />} sx={{ height:56, fontWeight:700, borderRadius:3, opacity:completeTripLocked?0.5:1 }}>Complete Trip</Button>
            </Box>
          )}

          {['pending','accepted','arrived'].includes(ride.rideStatus) && (
            <Button
              fullWidth variant="outlined" color="error"
              sx={{ height:48, borderRadius:3, fontWeight:600, borderWidth:2, mt:1, '&:hover':{ borderWidth:2 } }}
              onClick={handleCancelPress}
            >
              Cancel Ride
            </Button>
          )}
        </Box>
      </Paper>

      {/* Full-screen in-app map modal */}
      <Dialog fullScreen open={showFullScreenMap} onClose={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}>
        <Box sx={{ width:'100%', height:'100%', position:'relative', bgcolor:'#000' }}>
          <MapIframe
            center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat:-15.4167, lng:28.2833 }}
            zoom={16}
            height="100%"
            markers={markers}
            pickupLocation={routePickup}
            dropoffLocation={routeDropoff}
            showRoute={routeReady}
            onMapLoad={(c) => {
              fullScreenMapControlsRef.current = c;
              c.configureDriverMarker?.({ bg: '#1d4ed8', label: '🚗', size: 42 });
              if (driverLocation && !fullScreenMapInitializedRef.current) {
                setTimeout(() => { fullScreenMapControlsRef.current?.animateToLocation(driverLocation, 16); fullScreenMapInitializedRef.current = true; }, 700);
              }
            }}
          />
          <Box sx={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', zIndex:10 }}>
            <Button variant="contained" size="large" startIcon={<CloseIcon />}
              onClick={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}
              sx={{ height:52, px:5, borderRadius:3.5, fontWeight:700, bgcolor:'rgba(0,0,0,0.78)', backdropFilter:'blur(12px)', color:'#fff', border:'1px solid rgba(255,255,255,0.18)', boxShadow:'0 4px 24px rgba(0,0,0,0.5)', '&:hover':{ bgcolor:'rgba(0,0,0,0.92)' } }}>
              Close Map
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Complete Trip dialog */}
      <Dialog open={showCompleteDialog} onClose={() => !completing && setShowCompleteDialog(false)} PaperProps={{ sx:{ borderRadius:4, maxWidth:360, mx:2, border:'1px solid', borderColor:'divider' } }}>
        <DialogTitle sx={{ fontWeight:700, pb:0.5 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Box sx={{ width:40, height:40, borderRadius:2, flexShrink:0, background:'linear-gradient(135deg,#10B981 0%,#059669 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(16,185,129,0.35)' }}><CheckIcon sx={{ fontSize:22, color:'#fff' }} /></Box>
            Complete Trip?
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt:1.5, pb:1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.65 }}>Please confirm that the rider has been dropped off at the destination and the trip is finished.</Typography>
          {ride?.totalFare != null && (
            <Box sx={{ mt:2, p:1.5, borderRadius:2, bgcolor:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)' }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, display:'block' }}>Your Earnings</Typography>
              <Typography variant="h6" sx={{ fontWeight:800, color:'#10B981' }}>{formatCurrency(ride.driverEarnings||(ride.totalFare-(ride.commission||0)))}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px:2.5, pb:2.5, gap:1 }}>
          <Button onClick={() => setShowCompleteDialog(false)} disabled={completing} variant="outlined" sx={{ flex:1, borderRadius:2.5, fontWeight:600, height:44 }}>Not Yet</Button>
          <Button onClick={handleConfirmComplete} disabled={completing} variant="contained" color="success" startIcon={completing?<CircularProgress size={16} color="inherit" />:<CheckIcon />} sx={{ flex:1, borderRadius:2.5, fontWeight:700, height:44 }}>
            {completing ? 'Completing…' : 'Complete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── STEP 1: Cancel confirmation ───────────────────────────────────── */}
      <Dialog
        open={showCancelConfirm}
        onClose={handleCancelConfirmNo}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 360, mx: 2, border: '1px solid', borderColor: 'divider' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            }}>
              <WarningIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            Cancel Ride?
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            Are you sure you want to cancel this ride? This action cannot be undone and may affect your acceptance rate.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleCancelConfirmNo}
            variant="outlined"
            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, height: 44 }}
          >
            No
          </Button>
          <Button
            onClick={handleCancelConfirmYes}
            variant="contained"
            color="error"
            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 44 }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── STEP 2: Cancel reason selection ──────────────────────────────── */}
      <Dialog
        open={showCancelReasons}
        onClose={handleCloseCancelReasons}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 400, mx: 2, width: '100%', border: '1px solid', borderColor: 'divider' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            }}>
              <CancelIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            Reason for Cancellation
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
            Please let us know why you're cancelling so we can improve your experience.
          </Typography>

          {cancelReasonsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <FormControl fullWidth size="medium">
              <InputLabel id="cancel-reason-label">Select a reason</InputLabel>
              <Select
                labelId="cancel-reason-label"
                value={selectedCancelReason}
                label="Select a reason"
                onChange={(e) => {
                  setSelectedCancelReason(e.target.value);
                  if (e.target.value !== '__other__') setCancelOtherText('');
                }}
                sx={{ borderRadius: 2 }}
              >
                {cancelReasons.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>
                    {r.reason}
                  </MenuItem>
                ))}
                <MenuItem value="__other__">Other</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* "Other" free-text input */}
          <AnimatePresence>
            {selectedCancelReason === '__other__' && (
              <motion.div
                key="other-input"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                style={{ overflow: 'hidden' }}
              >
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  placeholder="Explain more…"
                  value={cancelOtherText}
                  onChange={(e) => setCancelOtherText(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 1.5, gap: 1, flexDirection: 'column' }}>
          {/* Primary action */}
          <Button
            fullWidth
            variant="contained"
            color="error"
            size="large"
            disabled={!canSubmitCancel || cancelling}
            startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
            onClick={handleCancelWithReason}
            sx={{ height: 50, borderRadius: 2.5, fontWeight: 700 }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Ride'}
          </Button>

          {/* Divider */}
          <Divider sx={{ width: '100%', my: 0.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>or</Typography>
          </Divider>

          {/* Cancel without reason */}
          <Button
            fullWidth
            variant="text"
            size="medium"
            disabled={cancelling}
            onClick={handleCancelWithoutReason}
            sx={{
              height: 44,
              borderRadius: 2.5,
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'none',
              fontSize: '0.875rem',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Cancel without reason
          </Button>
        </DialogActions>
      </Dialog>

      {showNavPopup && <Box sx={{ position:'fixed', inset:0, zIndex:9 }} onClick={() => setShowNavPopup(false)} />}
    </Box>
  );
}