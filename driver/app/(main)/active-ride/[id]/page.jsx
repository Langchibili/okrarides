// // // 'use client';
// // // // PATH: driver/app/(main)/active-ride/[id]/page.jsx

// // // import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// // // import { useParams, useRouter } from 'next/navigation';
// // // import {
// // //   Box, AppBar, Toolbar, Typography, Button, Paper, IconButton, Avatar,
// // //   Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider, LinearProgress,
// // // } from '@mui/material';
// // // import {
// // //   ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
// // //   Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
// // //   Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
// // //   OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
// // //   AccessTime as TimerIcon,
// // // } from '@mui/icons-material';
// // // import { motion } from 'framer-motion';
// // // import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
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

// // // export default function ActiveRidePage() {
// // //   const params = useParams();
// // //   const router = useRouter();

// // //   const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
// // //   const { updateLocation } = useSocket();
// // //   const { isNative, getCurrentLocation, on: rnOn } = useReactNative();
// // //   const { emit, on: socketOn, off: socketOff } = useSocket();
// // //   const { isOkrapayEnabled, allowRidePaymentWithOkraPay, settings } = useAdminSettings();

// // //   const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;

// // //   const [ride,                  setRide]                  = useState(null);
// // //   const [loading,               setLoading]               = useState(true);
// // //   const [showNavigationModal,   setShowNavigationModal]   = useState(false);
// // //   const [driverLocation,        setDriverLocation]        = useState(null); // tracks driver's real-time position
// // //   const mapControlsRef = useRef(null);

// // //   const [paymentRequested,        setPaymentRequested]        = useState(false);
// // //   const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);
// // //   const lockTimerRef   = useRef(null);
// // //   const countdownRef   = useRef(null);
// // //   const pollingRef     = useRef(null);
// // //   const mountedRef     = useRef(true);

// // //   useEffect(() => {
// // //     mountedRef.current = true;
// // //     return () => {
// // //       mountedRef.current = false;
// // //       clearTimeout(lockTimerRef.current);
// // //       clearInterval(countdownRef.current);
// // //       clearInterval(pollingRef.current);
// // //     };
// // //   }, []);

// // //   // ── Load ride ─────────────────────────────────────────────────────────────
// // //   const loadRideDetails = useCallback(async () => {
// // //     try {
// // //       const response = await apiClient.get(`/rides/${params.id}`);
// // //       if (response?.data && mountedRef.current) setRide(response.data);
// // //     } catch (error) {
// // //       console.error('Error loading ride:', error);
// // //     } finally {
// // //       if (mountedRef.current) setLoading(false);
// // //     }
// // //   }, [params.id]);

// // //   useEffect(() => { loadRideDetails(); }, [loadRideDetails]);

// // //   // ── Status polling ────────────────────────────────────────────────────────
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

// // //   // ── Location tracking — updates both socket AND local driverLocation state ─
// // //   useEffect(() => {
// // //     if (!ride || ['completed', 'cancelled'].includes(ride.rideStatus)) return;

// // //     const trackLocation = async () => {
// // //       try {
// // //         if (isNative) {
// // //           const loc = await getCurrentLocation().catch(() => null);
// // //           if (loc) {
// // //             setDriverLocation({ lat: loc.lat, lng: loc.lng });
// // //             updateLocation(loc, loc.heading || 0, loc.speed || 0);
// // //           }
// // //         } else if (navigator.geolocation) {
// // //           navigator.geolocation.getCurrentPosition(
// // //             ({ coords }) => {
// // //               const loc = { lat: coords.latitude, lng: coords.longitude };
// // //               setDriverLocation(loc);
// // //               updateLocation(loc, coords.heading || 0, coords.speed || 0);
// // //             },
// // //             (err) => console.error('Geo error:', err),
// // //             { enableHighAccuracy: true },
// // //           );
// // //         }
// // //       } catch (err) {
// // //         console.error('Location tracking error:', err);
// // //       }
// // //     };

// // //     // Get location immediately on mount / status change so map has it right away
// // //     trackLocation();
// // //     const id = setInterval(trackLocation, 5000);
// // //     return () => clearInterval(id);
// // //   }, [ride?.rideStatus, isNative, getCurrentLocation, updateLocation]);

// // //   // ── Map markers — same pattern as rider tracking page ────────────────────
// // //   //
// // //   // accepted / arrived        → driver marker (bouncing) + pickup marker
// // //   // passenger_onboard /
// // //   //   awaiting_payment        → driver marker + pickup marker + dropoff marker
// // //   //
// // //   // showRoute / dropoffLocation follow the same rule as the tracking page:
// // //   //   only active once the rider is on board.
// // //   //
// // //   const rideStatus = ride?.rideStatus;

// // //   // useMemo with primitive lat/lng deps — prevents a new array reference on every
// // //   // render, which would re-trigger UPDATE_MARKERS in IframeMap and cause fitBounds
// // //   // to fight the smooth UPDATE_DRIVER_LOCATION easeTo pan on every location tick.
// // //   const markers = useMemo(() => {
// // //     const m = [];
// // //     if (driverLocation)
// // //       m.push({ id: 'driver',  position: driverLocation,       type: 'driver',  icon: '🚗', animation: 'BOUNCE' });
// // //     if (ride?.pickupLocation)
// // //       m.push({ id: 'pickup',  position: ride.pickupLocation,  type: 'pickup',  icon: '📍' });
// // //     if (ride?.dropoffLocation && (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment'))
// // //       m.push({ id: 'dropoff', position: ride.dropoffLocation, type: 'dropoff', icon: '🎯' });
// // //     return m;
// // //   }, [
// // //     driverLocation?.lat, driverLocation?.lng,
// // //     ride?.pickupLocation?.lat,  ride?.pickupLocation?.lng,
// // //     ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng,
// // //     rideStatus,
// // //   ]);

// // //   // ── PAYMENT_RECEIVED handlers ─────────────────────────────────────────────
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

// // //   // ── Request payment ───────────────────────────────────────────────────────
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

// // //   const handleNavigate          = () => setShowNavigationModal(true);
// // //   const handleCallRider         = () => ride?.rider?.phoneNumber && (window.location.href = `tel:${ride.rider.phoneNumber}`);
// // //   const handleMessageRider      = () => ride?.rider?.phoneNumber && (window.location.href = `sms:${ride.rider.phoneNumber}`);
// // //   const handleOpenInExternalApp = () => {
// // //     const dest = ride?.rideStatus === 'accepted' || ride?.rideStatus === 'arrived'
// // //       ? ride.pickupLocation
// // //       : ride.dropoffLocation;
// // //     if (dest?.lat && dest?.lng)
// // //       window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
// // //   };

// // //   const getStatusColor = (s) => ({
// // //     completed: 'success', cancelled: 'error', passenger_onboard: 'primary',
// // //     arrived: 'success', accepted: 'info', awaiting_payment: 'warning',
// // //   }[s] || 'default');

// // //   const destination    = () => (ride?.rideStatus === 'accepted' || ride?.rideStatus === 'arrived')
// // //     ? ride.pickupLocation
// // //     : ride.dropoffLocation;
// // //   const formatETA      = (m) => !m && m !== 0 ? 'Calculating…' : m < 60 ? `${m} min` : `${Math.floor(m/60)} hr ${m%60 ? m%60+' min' : ''}`.trim();
// // //   const getMapEmbedUrl = () => {
// // //     const d = destination();
// // //     return d ? `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=current+location&destination=${d.lat},${d.lng}&mode=driving` : '';
// // //   };

// // //   if (loading || !ride) {
// // //     return <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><CircularProgress /></Box>;
// // //   }

// // //   return (
// // //     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

// // //       {/* AppBar */}
// // //       <AppBar position="static" elevation={0}>
// // //         <Toolbar>
// // //           <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
// // //           <Typography variant="h6" sx={{ flex:1 }}>Active Ride</Typography>
// // //           <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color:'white', mr:1 }} />
// // //         </Toolbar>
// // //       </AppBar>

// // //       {/* Map — same prop pattern as rider tracking page */}
// // //       <Box sx={{ height:'100vh', width:'100%', position:'relative', overflow:'hidden' }}>
// // //        {/* Map */}
// // //         <Box sx={{ position:'absolute', inset:0, zIndex:1 }}>
// // //           <MapIframe 
// // //             center={driverLocation || ride?.pickupLocation || { lat: -15.4167, lng: 28.2833 }}
// // //             zoom={15}
// // //             height="100%"
// // //             markers={markers}
// // //             pickupLocation={ride?.pickupLocation}
// // //             dropoffLocation={(rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') ? ride?.dropoffLocation : null}
// // //             showRoute={rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment'}
// // //             onMapLoad={(c) => { mapControlsRef.current = c; }}
// // //           />
// // //       </Box>
// // //       <Fab
// // //         variant="extended"
// // //         color="primary"
// // //         sx={{
// // //           position: 'absolute',
// // //           bottom: 16,
// // //           right: 16,
// // //           borderRadius: '24px'
// // //         }}
// // //         onClick={handleNavigate}
// // //       >
// // //         <NavigationIcon sx={{ mr: 1 }} />
// // //         Directions
// // //       </Fab>
// // //      </Box>

// // //       {/* Bottom Sheet */}
// // //       <Paper elevation={8} sx={{ borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'60vh', overflow:'auto' }}>
// // //         <Box sx={{ p:3 }}>

// // //           {/* Rider Info */}
// // //           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
// // //             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Rider Information</Typography>
// // //             <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
// // //               <Avatar sx={{ width:56, height:56, bgcolor:'primary.secondary' }}>
// // //                 {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
// // //               </Avatar>
// // //               <Box sx={{ flex:1 }}>
// // //                 <Typography variant="h6" sx={{ fontWeight:600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
// // //                 <Typography variant="body2" color="text.secondary">{(() => {
// // //                         const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// // //                           ? ride?.rider?.username
// // //                           : ride?.rider?.phoneNumber;
// // //                         const digits = raw.replace(/\D/g, '');
// // //                         return digits.length > 10 ? digits.slice(-10) : digits;
// // //                   })()}</Typography>
// // //                 <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:0.5 }}>
// // //                   <StarIcon sx={{ fontSize:16, color:'warning.main' }} />
// // //                   <Typography variant="body2">{ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides</Typography>
// // //                 </Box>
// // //               </Box>
// // //               <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
// // //                 <IconButton
// // //                   onClick={
// // //                     () => {
// // //                         const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// // //                           ? ride?.rider?.username
// // //                           : ride?.rider?.phoneNumber;
// // //                         const digits = raw.replace(/\D/g, '');
// // //                         const phone = digits.length > 10 ? digits.slice(-10) : digits;
// // //                         window.location.href = `tel:${phone}`;
// // //                   }}
// // //                   sx={{
// // //                     bgcolor: 'success.main',
// // //                     color: '#fff',
// // //                     width: 40,
// // //                     height: 40,
// // //                     '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' },
// // //                     transition: 'all 0.16s ease',
// // //                   }}
// // //                 >
// // //                   <PhoneIcon sx={{ fontSize: 18 }} />
// // //                 </IconButton>
// // //                 <IconButton
// // //                   onClick={
// // //                      () => {
// // //                         const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// // //                           ? ride?.rider?.username
// // //                           : ride?.rider?.phoneNumber;
// // //                         const phone = raw.replace(/\D/g, '');
// // //                         window.open(`https://wa.me/${phone}`, '_blank');
// // //                    }}
// // //                   sx={{
// // //                     background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
// // //                     color: '#000',
// // //                     width: 40,
// // //                     height: 40,
// // //                     '&:hover': { transform: 'scale(1.08)' },
// // //                     transition: 'all 0.16s ease',
// // //                   }}
// // //                 >
// // //                   <MessageIcon sx={{ fontSize: 18 }} />
// // //                 </IconButton>
// // //               </Box>
// // //             </Box>
// // //           </Paper>

// // //           {/* Trip Details */}
// // //           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
// // //             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Details</Typography>
// // //             <Box sx={{ display:'flex', gap:2, mb:2 }}>
// // //               <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'success.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
// // //                 <MyLocationIcon sx={{ color:'success.dark', fontSize:20 }} />
// // //               </Box>
// // //               <Box sx={{ flex:1 }}>
// // //                 <Typography variant="caption" color="text.secondary">PICKUP</Typography>
// // //                 <Typography variant="body1" sx={{ fontWeight:500 }}>{ride.pickupLocation?.address}</Typography>
// // //               </Box>
// // //             </Box>
// // //             <Box sx={{ width:2, height:16, bgcolor:'divider', ml:2.2, mb:1 }} />
// // //             <Box sx={{ display:'flex', gap:2 }}>
// // //               <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'error.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
// // //                 <LocationIcon sx={{ color:'error.dark', fontSize:20 }} />
// // //               </Box>
// // //               <Box sx={{ flex:1 }}>
// // //                 <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
// // //                 <Typography variant="body1" sx={{ fontWeight:500 }}>{ride.dropoffLocation?.address}</Typography>
// // //               </Box>
// // //             </Box>
// // //           </Paper>

// // //           {/* Fare */}
// // //           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
// // //             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}><ReceiptIcon sx={{ verticalAlign:'middle', mr:1 }} />Fare</Typography>
// // //             <List disablePadding>
// // //               {ride.baseFare     != null && <ListItem sx={{ px:0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
// // //               {ride.distanceFare != null && <ListItem sx={{ px:0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
// // //               {ride.surgeFare    >  0    && <ListItem sx={{ px:0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
// // //               {ride.promoDiscount > 0    && <ListItem sx={{ px:0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
// // //               <Divider sx={{ my:1 }} />
// // //               <ListItem sx={{ px:0 }}>
// // //                 <ListItemText primary="Total" primaryTypographyProps={{ fontWeight:600 }} />
// // //                 <Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography>
// // //               </ListItem>
// // //               <ListItem sx={{ px:0 }}>
// // //                 <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight:700, fontSize:'1.1rem' }} />
// // //                 <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
// // //                   {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
// // //                 </Typography>
// // //               </ListItem>
// // //             </List>
// // //             <Chip label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`} sx={{ mt:2, fontWeight:600 }} />
// // //           </Paper>

// // //           {/* Trip Stats */}
// // //           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
// // //             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Statistics</Typography>
// // //             <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
// // //               <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
// // //                 <Typography variant="h5" sx={{ fontWeight:700, color:'primary.main' }}>{(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km</Typography>
// // //                 <Typography variant="caption" color="text.secondary">Distance</Typography>
// // //               </Box>
// // //               <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
// // //                 <Typography variant="h5" sx={{ fontWeight:700, color:'info.main' }}>{formatETA(ride.actualDuration ?? ride.estimatedDuration)}</Typography>
// // //                 <Typography variant="caption" color="text.secondary">Duration</Typography>
// // //               </Box>
// // //             </Box>
// // //           </Paper>

// // //           {/* Action Buttons */}
// // //           {ride.rideStatus === 'accepted' && (
// // //             <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival}
// // //               sx={{ height:56, fontWeight:700, borderRadius:3, bgcolor:'success.main', '&:hover':{ bgcolor:'success.dark' }, mb:1 }}>
// // //               I've Arrived at Pickup
// // //             </Button>
// // //           )}

// // //           {ride.rideStatus === 'arrived' && (
// // //             <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />}
// // //               sx={{ height:56, fontWeight:700, borderRadius:3, mb:1 }}>
// // //               Start Trip
// // //             </Button>
// // //           )}

// // //           {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
// // //             <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>

// // //               {okrapayAllowedForRides && (
// // //                 <Button fullWidth variant="contained" size="large"
// // //                   onClick={handleRequestPayment}
// // //                   disabled={paymentRequested && completeLockSecondsLeft > 0}
// // //                   startIcon={<PaymentIcon />}
// // //                   sx={{
// // //                     height:56, fontWeight:700, borderRadius:3,
// // //                     bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.main',
// // //                     '&:hover': { bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.dark' },
// // //                     '&.Mui-disabled': { bgcolor:'grey.300', color:'grey.500' },
// // //                   }}>
// // //                   {(paymentRequested && completeLockSecondsLeft > 0)
// // //                     ? `Payment Requested ✓  (${completeLockSecondsLeft}s)`
// // //                     : 'Request Payment'}
// // //                 </Button>
// // //               )}

// // //               {completeTripLocked && (
// // //                 <Box>
// // //                   <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
// // //                     <TimerIcon sx={{ fontSize:16, color:'text.secondary' }} />
// // //                     <Typography variant="caption" color="text.secondary">
// // //                       Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay
// // //                     </Typography>
// // //                   </Box>
// // //                   <LinearProgress
// // //                     variant="determinate"
// // //                     value={((COMPLETE_TRIP_LOCK_MS / 1000 - completeLockSecondsLeft) / (COMPLETE_TRIP_LOCK_MS / 1000)) * 100}
// // //                     sx={{ borderRadius:1, height:6, bgcolor:'warning.light', '& .MuiLinearProgress-bar':{ bgcolor:'warning.main' } }}
// // //                   />
// // //                 </Box>
// // //               )}

// // //               {ride.rideStatus === 'awaiting_payment' && (
// // //                 <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius:2 }}>
// // //                   Waiting for rider to complete payment…
// // //                 </Alert>
// // //               )}

// // //               <Button fullWidth variant="contained" color="success" size="large"
// // //                 onClick={handleCompleteTrip}
// // //                 disabled={completeTripLocked}
// // //                 startIcon={<CheckIcon />}
// // //                 sx={{ height:56, fontWeight:700, borderRadius:3, opacity: completeTripLocked ? 0.5 : 1 }}>
// // //                 Complete Trip
// // //               </Button>
// // //             </Box>
// // //           )}

// // //           {['pending','accepted','arrived'].includes(ride.rideStatus) && (
// // //             <Button fullWidth variant="outlined" color="error"
// // //               sx={{ height:48, borderRadius:3, fontWeight:600, borderWidth:2, mt:1, '&:hover':{ borderWidth:2 } }}
// // //               onClick={async () => {
// // //                 const reason = window.prompt('Reason for cancellation:');
// // //                 if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
// // //               }}>
// // //               Cancel Ride
// // //             </Button>
// // //           )}
// // //         </Box>
// // //       </Paper>

// // //       {/* Navigation Modal */}
// // //       {showNavigationModal && destination() && (
// // //         <SwipeableBottomSheet open={showNavigationModal} onClose={() => setShowNavigationModal(false)}
// // //           initialHeight={window.innerHeight * 0.7} maxHeight={window.innerHeight * 0.9} minHeight={300}
// // //           onSwipeDown={() => setShowNavigationModal(false)}>
// // //           <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
// // //             <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', p:2, borderBottom:'1px solid', borderColor:'divider' }}>
// // //               <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
// // //                 <NavigationIcon color="primary" />
// // //                 <Typography variant="h6" fontWeight={600}>Navigation</Typography>
// // //               </Box>
// // //               <Box sx={{ display:'flex', gap:1 }}>
// // //                 <IconButton size="small" onClick={handleOpenInExternalApp} sx={{ bgcolor:'primary.light' }}><OpenInNewIcon fontSize="small" /></IconButton>
// // //                 <IconButton size="small" onClick={() => setShowNavigationModal(false)}><CloseIcon fontSize="small" /></IconButton>
// // //               </Box>
// // //             </Box>
// // //             <Box sx={{ p:2, bgcolor:'action.hover' }}>
// // //               <Typography variant="caption" color="text.secondary" fontWeight={600}>NAVIGATING TO</Typography>
// // //               <Typography variant="body1" fontWeight={500} mt={0.5}>{destination()?.address}</Typography>
// // //             </Box>
// // //             <Box sx={{ flex:1 }}>
// // //               <iframe src={getMapEmbedUrl()} width="100%" height="100%" style={{ border:0 }} allowFullScreen loading="lazy" />
// // //             </Box>
// // //             <Box sx={{ p:2, borderTop:'1px solid', borderColor:'divider' }}>
// // //               <Button fullWidth variant="contained" startIcon={<OpenInNewIcon />} onClick={handleOpenInExternalApp}
// // //                 sx={{ height:48, fontWeight:600, borderRadius:3 }}>
// // //                 Open in Google Maps App
// // //               </Button>
// // //             </Box>
// // //           </Box>
// // //         </SwipeableBottomSheet>
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
// //   Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider, LinearProgress,
// //   ClickAwayListener,
// // } from '@mui/material';
// // import {
// //   ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
// //   Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
// //   Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
// //   OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
// //   AccessTime as TimerIcon,
// // } from '@mui/icons-material';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
// // import { useRide } from '@/lib/hooks/useRide';
// // import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// // import { formatCurrency, formatDateTime } from '@/Functions';
// // import { apiClient } from '@/lib/api/client';
// // import { useSocket } from '@/lib/socket/SocketProvider';
// // import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
// // import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// // import MapIframe from '@/components/Map/MapIframe';

// // const COMPLETE_TRIP_LOCK_MS = 60_000;

// // // ── Distance helpers (same as tracking page) ──────────────────────────────────
// // const deg2rad = (deg) => deg * (Math.PI / 180);
// // const calculateDistance = (p1, p2) => {
// //   if (!p1 || !p2) return 0;
// //   const lat1 = p1.latitude ?? p1.lat ?? 0, lat2 = p2.latitude ?? p2.lat ?? 0;
// //   const lng1 = p1.longitude ?? p1.lng ?? 0, lng2 = p2.longitude ?? p2.lng ?? 0;
// //   const R = 6371, dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
// //   const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
// //   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// // };
// // const estimateDuration = (km) => Math.ceil((km / 30) * 60);

// // function getPollingInterval(settings) {
// //   const v = settings?.appsServerPollingIntervalInSeconds;
// //   return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
// // }

// // export default function ActiveRidePage() {
// //   const params  = useParams();
// //   const router  = useRouter();

// //   const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
// //   const { updateLocation } = useSocket();
// //   const { isNative, getCurrentLocation, on: rnOn } = useReactNative();
// //   const { emit, on: socketOn, off: socketOff } = useSocket();
// //   const { isOkrapayEnabled, allowRidePaymentWithOkraPay, settings } = useAdminSettings();

// //   const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;

// //   const [ride,                  setRide]                  = useState(null);
// //   const [loading,               setLoading]               = useState(true);
// //   const [driverLocation,        setDriverLocation]        = useState(null);
// //   const [riderLocation,         setRiderLocation]         = useState(null);  // ── NEW
// //   // ── NEW: navigation UI state ──
// //   const [showNavPopup,          setShowNavPopup]          = useState(false);
// //   const [showFullscreenMap,     setShowFullscreenMap]     = useState(false);

// //   const mapControlsRef = useRef(null);

// //   const [paymentRequested,        setPaymentRequested]        = useState(false);
// //   const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);
// //   const lockTimerRef  = useRef(null);
// //   const countdownRef  = useRef(null);
// //   const pollingRef    = useRef(null);
// //   const mountedRef    = useRef(true);

// //   useEffect(() => {
// //     mountedRef.current = true;
// //     return () => {
// //       mountedRef.current = false;
// //       clearTimeout(lockTimerRef.current);
// //       clearInterval(countdownRef.current);
// //       clearInterval(pollingRef.current);
// //     };
// //   }, []);

// //   // ── Load ride ─────────────────────────────────────────────────────────────
// //   const loadRideDetails = useCallback(async () => {
// //     try {
// //       const response = await apiClient.get(`/rides/${params.id}`);
// //       if (response?.data && mountedRef.current) setRide(response.data);
// //     } catch (error) {
// //       console.error('Error loading ride:', error);
// //     } finally {
// //       if (mountedRef.current) setLoading(false);
// //     }
// //   }, [params.id]);

// //   useEffect(() => { loadRideDetails(); }, [loadRideDetails]);

// //   // ── Status polling ────────────────────────────────────────────────────────
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

// //   // ── Driver GPS tracking → socket → map pan (no zoom change) ──────────────
// //   useEffect(() => {
// //     if (!ride || ['completed', 'cancelled'].includes(ride.rideStatus)) return;

// //     const trackLocation = async () => {
// //       try {
// //         if (isNative) {
// //           const loc = await getCurrentLocation().catch(() => null);
// //           if (loc) {
// //             const dLoc = { lat: loc.lat, lng: loc.lng };
// //             setDriverLocation(dLoc);
// //             updateLocation(loc, loc.heading || 0, loc.speed || 0);
// //             // Pan map to driver — constant zoom=15 prevents zoom animation
// //             mapControlsRef.current?.animateToLocation?.(dLoc, 15);
// //           }
// //         } else if (navigator.geolocation) {
// //           navigator.geolocation.getCurrentPosition(
// //             ({ coords }) => {
// //               const dLoc = { lat: coords.latitude, lng: coords.longitude };
// //               setDriverLocation(dLoc);
// //               updateLocation(dLoc, coords.heading || 0, coords.speed || 0);
// //               mapControlsRef.current?.animateToLocation?.(dLoc, 15);
// //             },
// //             (err) => console.error('Geo error:', err),
// //             { enableHighAccuracy: true },
// //           );
// //         }
// //       } catch (err) {
// //         console.error('Location tracking error:', err);
// //       }
// //     };

// //     trackLocation();
// //     const id = setInterval(trackLocation, 5000);
// //     return () => clearInterval(id);
// //   }, [ride?.rideStatus, isNative, getCurrentLocation, updateLocation]);

// //   // ── NEW: Rider location poll (2s) — during accepted/arrived only ──────────
// //   // Once passenger is on board, rider's phone may be offline; only driver matters.
// //   useEffect(() => {
// //     if (!ride?.id || !ride?.rider?.id) return;
// //     if (['completed', 'cancelled'].includes(ride?.rideStatus)) return;
// //     if (!['accepted', 'arrived'].includes(ride?.rideStatus)) return;

// //     let cancelled = false;

// //     const fetchRiderLocation = async () => {
// //       if (cancelled) return;
// //       try {
// //         const res = await apiClient.get(`/users/${ride.rider.id}`);
// //         const cl  = res?.data?.currentLocation;
// //         if (cl?.latitude && cl?.longitude && !cancelled) {
// //           setRiderLocation({ lat: cl.latitude, lng: cl.longitude });
// //         }
// //       } catch {}
// //     };

// //     fetchRiderLocation();
// //     const id = setInterval(fetchRiderLocation, 2000);
// //     return () => { cancelled = true; clearInterval(id); };
// //   }, [ride?.id, ride?.rideStatus, ride?.rider?.id]);

// //   // ── Map markers — homologous with tracking page ───────────────────────────
// //   const rideStatus = ride?.rideStatus;

// //   const markers = useMemo(() => {
// //     const m = [];
// //     // Driver marker always present
// //     if (driverLocation)
// //       m.push({ id: 'driver', position: driverLocation, type: 'driver', icon: '🚗', animation: 'BOUNCE' });

// //     // Before passenger is in car: show rider's current position (or fixed pickup)
// //     if (rideStatus === 'accepted' || rideStatus === 'arrived') {
// //       const rLoc = riderLocation || ride?.pickupLocation;
// //       if (rLoc) m.push({ id: 'rider', position: rLoc, type: 'pickup', icon: '📍' });
// //     }

// //     // During trip: show dropoff destination
// //     if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') {
// //       if (ride?.dropoffLocation)
// //         m.push({ id: 'dropoff', position: ride.dropoffLocation, type: 'dropoff', icon: '🎯' });
// //     }
// //     return m;
// //   }, [
// //     driverLocation?.lat,      driverLocation?.lng,
// //     riderLocation?.lat,       riderLocation?.lng,
// //     ride?.pickupLocation?.lat,  ride?.pickupLocation?.lng,
// //     ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng,
// //     rideStatus,
// //   ]);

// //   // ── Map route props ────────────────────────────────────────────────────────
// //   // accepted  : driver → rider/pickup
// //   // arrived   : no route (driver already at pickup)
// //   // on board  : driver's current pos → dropoff
// //   const mapPickupForRoute  = driverLocation; // route always starts from driver
// //   const mapDropoffForRoute = (rideStatus === 'accepted')
// //     ? (riderLocation || ride?.pickupLocation)
// //     : ride?.dropoffLocation;
// //   const mapShowRoute = !!driverLocation && (
// //     (rideStatus === 'accepted'         && !!(riderLocation || ride?.pickupLocation)) ||
// //     ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && !!ride?.dropoffLocation)
// //   );

// //   // ── PAYMENT_RECEIVED handlers ─────────────────────────────────────────────
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

// //   // ── Request payment ───────────────────────────────────────────────────────
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
// //     if (!window.confirm('Complete this ride?')) return;
// //     try {
// //       await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration });
// //       router.push('/home');
// //     } catch (err) { console.error('Error completing trip:', err); }
// //   };

// //   const handleConfirmArrival = async () => {
// //     try { await confirmArrival(ride.id); loadRideDetails(); }
// //     catch (err) { console.error('Error confirming arrival:', err); }
// //   };

// //   const handleCallRider    = () => ride?.rider?.phoneNumber && (window.location.href = `tel:${ride.rider.phoneNumber}`);
// //   const handleMessageRider = () => ride?.rider?.phoneNumber && (window.location.href = `sms:${ride.rider.phoneNumber}`);

// //   // Navigation destination — pickup phase: rider's live loc (or fixed pickup);
// //   //                         trip phase   : dropoff
// //   const destination = () => {
// //     if (!ride) return null;
// //     if (ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived') {
// //       return riderLocation || ride.pickupLocation;
// //     }
// //     return ride.dropoffLocation;
// //   };

// //   // ── Navigate button handlers ───────────────────────────────────────────────
// //   const handleNavigate = () => setShowNavPopup(prev => !prev);

// //   const handleInAppNavigation = () => {
// //     setShowNavPopup(false);
// //     setShowFullscreenMap(true);
// //   };

// //   const handleGoogleMapsNavigation = () => {
// //     const dest = destination();
// //     if (!dest) return;
// //     const destLat = dest.lat ?? dest.latitude;
// //     const destLng = dest.lng ?? dest.longitude;
// //     const url = driverLocation
// //       ? `https://www.google.com/maps/dir/${driverLocation.lat},${driverLocation.lng}/${destLat},${destLng}`
// //       : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
// //     window.open(url, '_blank');
// //     setShowNavPopup(false);
// //   };

// //   const getStatusColor = (s) => ({
// //     completed: 'success', cancelled: 'error', passenger_onboard: 'primary',
// //     arrived: 'success', accepted: 'info', awaiting_payment: 'warning',
// //   }[s] || 'default');

// //   const formatETA = (m) => !m && m !== 0 ? 'Calculating…' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr ${m % 60 ? m % 60 + ' min' : ''}`.trim();

// //   if (loading || !ride) {
// //     return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
// //   }

// //   const navDest = destination();

// //   // Markers for fullscreen navigation modal
// //   const fullscreenMarkers = [
// //     driverLocation && { id: 'driver', position: driverLocation, type: 'driver', icon: '🚗', animation: 'BOUNCE' },
// //     navDest       && { id: 'dest',   position: navDest,         type: (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') ? 'dropoff' : 'pickup', icon: (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') ? '🎯' : '📍' },
// //   ].filter(Boolean);

// //   return (
// //     // ── HOMOLOGOUS: full-screen container, map absolute behind everything ─────
// //     <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

// //       {/* ── Map — fills entire screen (same as tracking/home page) ─────────── */}
// //       <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
// //         <MapIframe
// //           center={driverLocation || ride?.pickupLocation || { lat: -15.4167, lng: 28.2833 }}
// //           zoom={15}
// //           markers={markers}
// //           pickupLocation={mapPickupForRoute}
// //           dropoffLocation={mapDropoffForRoute}
// //           showRoute={mapShowRoute}
// //           onMapLoad={(c) => { mapControlsRef.current = c; }}
// //         />
// //       </Box>

// //       {/* ── AppBar — absolute so it floats over the map ─────────────────────── */}
// //       <AppBar
// //         position="absolute"
// //         elevation={0}
// //         sx={{
// //           zIndex: 10,
// //           background: 'rgba(0,0,0,0.6)',
// //           backdropFilter: 'blur(16px)',
// //           borderBottom: '1px solid rgba(255,255,255,0.08)',
// //         }}
// //       >
// //         <Toolbar>
// //           <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
// //           <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Active Ride</Typography>
// //           <Chip
// //             label={ride.rideStatus?.replace(/_/g, ' ')}
// //             color={getStatusColor(ride.rideStatus)}
// //             sx={{ color: 'white', fontWeight: 700, mr: 1, textTransform: 'capitalize' }}
// //           />
// //         </Toolbar>
// //       </AppBar>

// //       {/* ── Navigate FAB + popup ─────────────────────────────────────────────── */}
// //       <ClickAwayListener onClickAway={() => setShowNavPopup(false)}>
// //         <Box sx={{ position: 'absolute', right: 16, bottom: 450, zIndex: 5 }}>
// //           <Box sx={{ position: 'relative' }}>

// //             {/* Popup with two options */}
// //             <AnimatePresence>
// //               {showNavPopup && (
// //                 <motion.div
// //                   key="nav-popup"
// //                   initial={{ opacity: 0, y: 10, scale: 0.93 }}
// //                   animate={{ opacity: 1, y: 0, scale: 1 }}
// //                   exit={{ opacity: 0, y: 10, scale: 0.93 }}
// //                   transition={{ type: 'spring', stiffness: 340, damping: 28 }}
// //                   style={{
// //                     position: 'absolute',
// //                     bottom: '100%',
// //                     right: 0,
// //                     marginBottom: 10,
// //                     zIndex: 10,
// //                   }}
// //                 >
// //                   <Paper
// //                     elevation={12}
// //                     sx={{
// //                       p: 0.75,
// //                       borderRadius: 3,
// //                       overflow: 'hidden',
// //                       minWidth: 190,
// //                       border: '1px solid',
// //                       borderColor: 'rgba(255,255,255,0.12)',
// //                       backdropFilter: 'blur(16px)',
// //                     }}
// //                   >
// //                     <Button
// //                       fullWidth
// //                       onClick={handleInAppNavigation}
// //                       sx={{
// //                         justifyContent: 'flex-start',
// //                         py: 1.2, px: 2,
// //                         borderRadius: 2,
// //                         mb: 0.5,
// //                         fontWeight: 700,
// //                         fontSize: '0.85rem',
// //                         gap: 1.5,
// //                         textTransform: 'none',
// //                       }}
// //                     >
// //                       🗺️&nbsp; In App
// //                     </Button>
// //                     <Button
// //                       fullWidth
// //                       startIcon={<OpenInNewIcon sx={{ fontSize: 17 }} />}
// //                       onClick={handleGoogleMapsNavigation}
// //                       sx={{
// //                         justifyContent: 'flex-start',
// //                         py: 1.2, px: 2,
// //                         borderRadius: 2,
// //                         fontWeight: 700,
// //                         fontSize: '0.85rem',
// //                         textTransform: 'none',
// //                       }}
// //                     >
// //                       Use Google Maps
// //                     </Button>
// //                   </Paper>
// //                 </motion.div>
// //               )}
// //             </AnimatePresence>

// //             <Fab
// //               variant="extended"
// //               color="primary"
// //               onClick={handleNavigate}
// //               sx={{
// //                 borderRadius: '24px',
// //                 fontWeight: 700,
// //                 boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
// //               }}
// //             >
// //               <NavigationIcon sx={{ mr: 1 }} />
// //               Navigate
// //             </Fab>
// //           </Box>
// //         </Box>
// //       </ClickAwayListener>

// //       {/* ── Bottom Sheet — homologous with tracking page ─────────────────────── */}
// //       <SwipeableBottomSheet
// //         open
// //         initialHeight={420}
// //         maxHeight="80%"
// //         minHeight={200}
// //         draggable
// //       >
// //         {/* Drag pill */}
// //         <Box sx={{ pt: 1.25, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
// //           <Box
// //             sx={{
// //               width: 36, height: 4, borderRadius: 2,
// //               bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
// //             }}
// //           />
// //           <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.7 }}>
// //             Pull up for details
// //           </Typography>
// //         </Box>

// //         <Box
// //           sx={{
// //             px: 2.5, pb: 3,
// //             flex: 1,
// //             overflowY: 'auto',
// //             '&::-webkit-scrollbar': { display: 'none' },
// //             scrollbarWidth: 'none',
// //           }}
// //         >
// //           {/* Rider Info */}
// //           <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
// //             <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
// //               Rider Information
// //             </Typography>
// //             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
// //               <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.light', fontWeight: 700 }}>
// //                 {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
// //               </Avatar>
// //               <Box sx={{ flex: 1 }}>
// //                 <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
// //                   {ride.rider?.firstName} {ride.rider?.lastName}
// //                 </Typography>
// //                 <Typography variant="body2" color="text.secondary">
// //                   {(() => {
// //                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// //                       ? ride?.rider?.username
// //                       : ride?.rider?.phoneNumber;
// //                     const digits = raw?.replace(/\D/g, '') || '';
// //                     return digits.length > 10 ? digits.slice(-10) : digits;
// //                   })()}
// //                 </Typography>
// //                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
// //                   <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
// //                   <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
// //                     {ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'}
// //                   </Typography>
// //                   <Typography variant="caption" color="text.secondary">
// //                     · {ride.rider?.riderProfile?.completedRides || 0} rides
// //                   </Typography>
// //                 </Box>
// //               </Box>
// //               <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
// //                 <IconButton
// //                   onClick={() => {
// //                     const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// //                       ? ride?.rider?.username : ride?.rider?.phoneNumber;
// //                     const digits = raw?.replace(/\D/g, '') || '';
// //                     const phone  = digits.length > 10 ? digits.slice(-10) : digits;
// //                     window.location.href = `tel:${phone}`;
// //                   }}
// //                   sx={{
// //                     bgcolor: 'success.main',
// //                     color: '#fff',
// //                     width: 40, height: 40,
// //                     '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' },
// //                     transition: 'all 0.16s ease',
// //                   }}
// //                 >
// //                   <PhoneIcon sx={{ fontSize: 18 }} />
// //                 </IconButton>
// //                 <IconButton
// //                   onClick={() => {
// //                     const raw   = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
// //                       ? ride?.rider?.username : ride?.rider?.phoneNumber;
// //                     const phone = raw?.replace(/\D/g, '') || '';
// //                     window.open(`https://wa.me/${phone}`, '_blank');
// //                   }}
// //                   sx={{
// //                     background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
// //                     color: '#fff',
// //                     width: 40, height: 40,
// //                     '&:hover': { transform: 'scale(1.08)' },
// //                     transition: 'all 0.16s ease',
// //                   }}
// //                 >
// //                   <MessageIcon sx={{ fontSize: 18 }} />
// //                 </IconButton>
// //               </Box>
// //             </Box>
// //           </Paper>

// //           {/* Trip Details */}
// //           <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
// //             <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
// //               Trip Details
// //             </Typography>
// //             <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
// //               <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
// //                 <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
// //               </Box>
// //               <Box sx={{ flex: 1 }}>
// //                 <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>PICKUP</Typography>
// //                 <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>{ride.pickupLocation?.address}</Typography>
// //               </Box>
// //             </Box>
// //             <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1.5 }} />
// //             <Box sx={{ display: 'flex', gap: 2 }}>
// //               <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
// //                 <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
// //               </Box>
// //               <Box sx={{ flex: 1 }}>
// //                 <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>DROPOFF</Typography>
// //                 <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>{ride.dropoffLocation?.address}</Typography>
// //               </Box>
// //             </Box>
// //           </Paper>

// //           {/* Fare */}
// //           <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
// //             <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
// //               <ReceiptIcon sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.5 }} />Fare
// //             </Typography>
// //             <List disablePadding>
// //               {ride.baseFare     != null && <ListItem sx={{ px: 0, py: 0.5 }}><ListItemText primary="Base Fare"     primaryTypographyProps={{ variant: 'body2' }} /><Typography variant="body2">{formatCurrency(ride.baseFare)}</Typography></ListItem>}
// //               {ride.distanceFare != null && <ListItem sx={{ px: 0, py: 0.5 }}><ListItemText primary="Distance Fare" primaryTypographyProps={{ variant: 'body2' }} /><Typography variant="body2">{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
// //               {ride.surgeFare    >  0    && <ListItem sx={{ px: 0, py: 0.5 }}><ListItemText primary="Surge"         primaryTypographyProps={{ variant: 'body2' }} /><Typography variant="body2" color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
// //               {ride.promoDiscount > 0   && <ListItem sx={{ px: 0, py: 0.5 }}><ListItemText primary="Promo"         primaryTypographyProps={{ variant: 'body2' }} /><Typography variant="body2" color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
// //               <Divider sx={{ my: 1 }} />
// //               <ListItem sx={{ px: 0, py: 0.5 }}>
// //                 <ListItemText primary="Total" primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }} />
// //                 <Typography fontWeight={600} variant="body2">{formatCurrency(ride.totalFare)}</Typography>
// //               </ListItem>
// //               <ListItem sx={{ px: 0, py: 0.5 }}>
// //                 <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight: 700, variant: 'body1' }} />
// //                 <Typography fontWeight={700} variant="body1" color="success.main">
// //                   {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
// //                 </Typography>
// //               </ListItem>
// //             </List>
// //             <Chip
// //               label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`}
// //               size="small"
// //               sx={{ mt: 1.5, fontWeight: 600, fontSize: '0.75rem' }}
// //             />
// //           </Paper>

// //           {/* Trip Stats */}
// //           <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
// //             <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
// //               Trip Statistics
// //             </Typography>
// //             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
// //               <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
// //                 <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: -0.5 }}>
// //                   {(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km
// //                 </Typography>
// //                 <Typography variant="caption" color="text.secondary">Distance</Typography>
// //               </Box>
// //               <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
// //                 <Typography variant="h6" sx={{ fontWeight: 800, color: 'info.main', letterSpacing: -0.5 }}>
// //                   {formatETA(ride.actualDuration ?? ride.estimatedDuration)}
// //                 </Typography>
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
// //                     bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.main',
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
// //       </SwipeableBottomSheet>

// //       {/* ── Full-screen in-app navigation modal ─────────────────────────────── */}
// //       {/* Zoom=20 keeps the driver's current position tightly focused           */}
// //       <AnimatePresence>
// //         {showFullscreenMap && (
// //           <motion.div
// //             key="fullscreen-nav"
// //             initial={{ opacity: 0 }}
// //             animate={{ opacity: 1 }}
// //             exit={{ opacity: 0 }}
// //             transition={{ duration: 0.22 }}
// //             style={{
// //               position: 'fixed',
// //               inset: 0,
// //               zIndex: 9999,
// //               display: 'flex',
// //               flexDirection: 'column',
// //               background: '#000',
// //             }}
// //           >
// //             {/* Map fills the screen at tight zoom, centred on driver */}
// //             <Box sx={{ flex: 1, position: 'relative' }}>
// //               <MapIframe
// //                 center={driverLocation || ride?.pickupLocation || { lat: -15.4167, lng: 28.2833 }}
// //                 zoom={20}
// //                 markers={fullscreenMarkers}
// //                 pickupLocation={driverLocation}
// //                 dropoffLocation={navDest}
// //                 showRoute={!!driverLocation && !!navDest}
// //                 height="100%"
// //               />
// //             </Box>

// //             {/* Close button anchored to the bottom */}
// //             <Box
// //               sx={{
// //                 p: 2,
// //                 bgcolor: 'background.paper',
// //                 borderTop: '1px solid',
// //                 borderColor: 'divider',
// //                 flexShrink: 0,
// //               }}
// //             >
// //               <Button
// //                 fullWidth
// //                 variant="contained"
// //                 size="large"
// //                 onClick={() => setShowFullscreenMap(false)}
// //                 startIcon={<CloseIcon />}
// //                 sx={{ height: 56, fontWeight: 700, borderRadius: 3, fontSize: '1rem' }}
// //               >
// //                 Close Navigation
// //               </Button>
// //             </Box>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>

// //     </Box>
// //   );
// // }
// 'use client';
// // PATH: driver/app/(main)/active-ride/[id]/page.jsx
// // FIX: Added normalizeCoords() helper and applied it in loadRideDetails so that
// //      the backend's { latitude, longitude } shape on currentDriverLocation is
// //      converted to { lat, lng } before reaching the map.
// //      The GPS tracking branches already construct { lat, lng } correctly and
// //      are unchanged. All original logic is 100% preserved.

// import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import {
//   Box, AppBar, Toolbar, Typography, Button, Paper, IconButton, Avatar,
//   Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider, LinearProgress,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
//   Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
//   Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
//   OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
//   AccessTime as TimerIcon,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
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

// // ─── FIX ────────────────────────────────────────────────────────────────────
// // The backend stores the driver's persisted location with { latitude, longitude }
// // keys (GPS/nominatim shape), but the map and all internal helpers expect
// // { lat, lng }.  This normalizer is applied once in loadRideDetails when seeding
// // driverLocation from the ride object on initial page load.
// // The live GPS tracking branches (native + browser geolocation) already
// // construct { lat, lng } explicitly, so they are not affected.
// // ────────────────────────────────────────────────────────────────────────────
// const normalizeCoords = (loc) => {
//   if (!loc) return null;
//   const lat = loc.lat ?? loc.latitude;
//   const lng = loc.lng ?? loc.longitude;
//   if (lat == null || lng == null) return null;
//   return { ...loc, lat, lng };
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

//   const [ride,                  setRide]                  = useState(null);
//   const [loading,               setLoading]               = useState(true);
//   const [showNavigationModal,   setShowNavigationModal]   = useState(false);
//   const [driverLocation,        setDriverLocation]        = useState(null); // tracks driver's real-time position
//   const mapControlsRef = useRef(null);

//   const [paymentRequested,        setPaymentRequested]        = useState(false);
//   const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);
//   const lockTimerRef   = useRef(null);
//   const countdownRef   = useRef(null);
//   const pollingRef     = useRef(null);
//   const mountedRef     = useRef(true);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//       clearTimeout(lockTimerRef.current);
//       clearInterval(countdownRef.current);
//       clearInterval(pollingRef.current);
//     };
//   }, []);

//   // ── Load ride ─────────────────────────────────────────────────────────────
//   const loadRideDetails = useCallback(async () => {
//     try {
//       const response = await apiClient.get(`/rides/${params.id}`);
//       if (response?.data && mountedRef.current) {
//         const rideData = response.data;

//         // FIX: seed the map with the driver's last-known backend location so
//         // it isn't blank while we wait for the first GPS tick.
//         // currentDriverLocation uses { latitude, longitude } — normalise it.
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
//       } catch (err) {
//         console.error('[ActiveRide] poll error:', err);
//       }
//     }, interval);

//     return () => clearInterval(pollingRef.current);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [ride?.id, ride?.rideStatus, settings]);

//   // ── Location tracking — updates both socket AND local driverLocation state ─
//   useEffect(() => {
//     if (!ride || ['completed', 'cancelled'].includes(ride.rideStatus)) return;

//     const trackLocation = async () => {
//       try {
//         if (isNative) {
//           const loc = await getCurrentLocation().catch(() => null);
//           if (loc) {
//             setDriverLocation({ lat: loc.lat, lng: loc.lng });
//             updateLocation(loc, loc.heading || 0, loc.speed || 0);
//           }
//         } else if (navigator.geolocation) {
//           navigator.geolocation.getCurrentPosition(
//             ({ coords }) => {
//               const loc = { lat: coords.latitude, lng: coords.longitude };
//               setDriverLocation(loc);
//               updateLocation(loc, coords.heading || 0, coords.speed || 0);
//             },
//             (err) => console.error('Geo error:', err),
//             { enableHighAccuracy: true },
//           );
//         }
//       } catch (err) {
//         console.error('Location tracking error:', err);
//       }
//     };

//     // Get location immediately on mount / status change so map has it right away
//     trackLocation();
//     const id = setInterval(trackLocation, 5000);
//     return () => clearInterval(id);
//   }, [ride?.rideStatus, isNative, getCurrentLocation, updateLocation]);

//   // ── Map markers — same pattern as rider tracking page ────────────────────
//   //
//   // accepted / arrived        → driver marker (bouncing) + pickup marker
//   // passenger_onboard /
//   //   awaiting_payment        → driver marker + pickup marker + dropoff marker
//   //
//   // showRoute / dropoffLocation follow the same rule as the tracking page:
//   //   only active once the rider is on board.
//   //
//   const rideStatus = ride?.rideStatus;

//   // useMemo with primitive lat/lng deps — prevents a new array reference on every
//   // render, which would re-trigger UPDATE_MARKERS in IframeMap and cause fitBounds
//   // to fight the smooth UPDATE_DRIVER_LOCATION easeTo pan on every location tick.
//   const markers = useMemo(() => {
//     const m = [];
//     if (driverLocation)
//       m.push({ id: 'driver',  position: driverLocation,       type: 'driver',  icon: '🚗', animation: 'BOUNCE' });
//     if (ride?.pickupLocation)
//       m.push({ id: 'pickup',  position: ride.pickupLocation,  type: 'pickup',  icon: '📍' });
//     if (ride?.dropoffLocation && (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment'))
//       m.push({ id: 'dropoff', position: ride.dropoffLocation, type: 'dropoff', icon: '🎯' });
//     return m;
//   }, [
//     driverLocation?.lat, driverLocation?.lng,
//     ride?.pickupLocation?.lat,  ride?.pickupLocation?.lng,
//     ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng,
//     rideStatus,
//   ]);

//   // ── PAYMENT_RECEIVED handlers ─────────────────────────────────────────────
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

//   // ── Request payment ───────────────────────────────────────────────────────
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
//     if (!window.confirm('Complete this ride?')) return;
//     try {
//       await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration });
//       router.push('/home');
//     } catch (err) { console.error('Error completing trip:', err); }
//   };

//   const handleConfirmArrival = async () => {
//     try { await confirmArrival(ride.id); loadRideDetails(); }
//     catch (err) { console.error('Error confirming arrival:', err); }
//   };

//   const handleNavigate          = () => setShowNavigationModal(true);
//   const handleCallRider         = () => ride?.rider?.phoneNumber && (window.location.href = `tel:${ride.rider.phoneNumber}`);
//   const handleMessageRider      = () => ride?.rider?.phoneNumber && (window.location.href = `sms:${ride.rider.phoneNumber}`);
//   const handleOpenInExternalApp = () => {
//     const dest = ride?.rideStatus === 'accepted' || ride?.rideStatus === 'arrived'
//       ? ride.pickupLocation
//       : ride.dropoffLocation;
//     if (dest?.lat && dest?.lng)
//       window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
//   };

//   const getStatusColor = (s) => ({
//     completed: 'success', cancelled: 'error', passenger_onboard: 'primary',
//     arrived: 'success', accepted: 'info', awaiting_payment: 'warning',
//   }[s] || 'default');

//   const destination    = () => (ride?.rideStatus === 'accepted' || ride?.rideStatus === 'arrived')
//     ? ride.pickupLocation
//     : ride.dropoffLocation;
//   const formatETA      = (m) => !m && m !== 0 ? 'Calculating…' : m < 60 ? `${m} min` : `${Math.floor(m/60)} hr ${m%60 ? m%60+' min' : ''}`.trim();
//   const getMapEmbedUrl = () => {
//     const d = destination();
//     return d ? `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=current+location&destination=${d.lat},${d.lng}&mode=driving` : '';
//   };

//   if (loading || !ride) {
//     return <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><CircularProgress /></Box>;
//   }

//   return (
//     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

//       {/* AppBar */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
//           <Typography variant="h6" sx={{ flex:1 }}>Active Ride</Typography>
//           <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color:'white', mr:1 }} />
//         </Toolbar>
//       </AppBar>

//       {/* Map — same prop pattern as rider tracking page */}
//       <Box sx={{ height:'100vh', width:'100%', position:'relative', overflow:'hidden' }}>
//        {/* Map */}
//         <Box sx={{ position:'absolute', inset:0, zIndex:1 }}>
//           <MapIframe 
//             center={driverLocation || ride?.pickupLocation || { lat: -15.4167, lng: 28.2833 }}
//             zoom={15}
//             height="100%"
//             markers={markers}
//             pickupLocation={ride?.pickupLocation}
//             dropoffLocation={(rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') ? ride?.dropoffLocation : null}
//             showRoute={rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment'}
//             onMapLoad={(c) => { mapControlsRef.current = c; }}
//           />
//       </Box>
//       <Fab
//         variant="extended"
//         color="primary"
//         sx={{
//           position: 'absolute',
//           bottom: 16,
//           right: 16,
//           borderRadius: '24px'
//         }}
//         onClick={handleNavigate}
//       >
//         <NavigationIcon sx={{ mr: 1 }} />
//         Directions
//       </Fab>
//      </Box>

//       {/* Bottom Sheet */}
//       <Paper elevation={8} sx={{ borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'60vh', overflow:'auto' }}>
//         <Box sx={{ p:3 }}>

//           {/* Rider Info */}
//           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
//             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Rider Information</Typography>
//             <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
//               <Avatar sx={{ width:56, height:56, bgcolor:'primary.secondary' }}>
//                 {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
//               </Avatar>
//               <Box sx={{ flex:1 }}>
//                 <Typography variant="h6" sx={{ fontWeight:600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
//                 <Typography variant="body2" color="text.secondary">{(() => {
//                         const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
//                           ? ride?.rider?.username
//                           : ride?.rider?.phoneNumber;
//                         const digits = raw.replace(/\D/g, '');
//                         return digits.length > 10 ? digits.slice(-10) : digits;
//                   })()}</Typography>
//                 <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:0.5 }}>
//                   <StarIcon sx={{ fontSize:16, color:'warning.main' }} />
//                   <Typography variant="body2">{ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides</Typography>
//                 </Box>
//               </Box>
//               <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
//                 <IconButton
//                   onClick={
//                     () => {
//                         const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
//                           ? ride?.rider?.username
//                           : ride?.rider?.phoneNumber;
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
//                         const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username)
//                           ? ride?.rider?.username
//                           : ride?.rider?.phoneNumber;
//                         const phone = raw.replace(/\D/g, '');
//                         window.open(`https://wa.me/${phone}`, '_blank');
//                    }}
//                   sx={{
//                     background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
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
//           </Paper>

//           {/* Trip Details */}
//           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
//             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Details</Typography>
//             <Box sx={{ display:'flex', gap:2, mb:2 }}>
//               <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'success.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
//                 <MyLocationIcon sx={{ color:'success.dark', fontSize:20 }} />
//               </Box>
//               <Box sx={{ flex:1 }}>
//                 <Typography variant="caption" color="text.secondary">PICKUP</Typography>
//                 <Typography variant="body1" sx={{ fontWeight:500 }}>{ride.pickupLocation?.address}</Typography>
//               </Box>
//             </Box>
//             <Box sx={{ width:2, height:16, bgcolor:'divider', ml:2.2, mb:1 }} />
//             <Box sx={{ display:'flex', gap:2 }}>
//               <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'error.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
//                 <LocationIcon sx={{ color:'error.dark', fontSize:20 }} />
//               </Box>
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
//               {ride.baseFare     != null && <ListItem sx={{ px:0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
//               {ride.distanceFare != null && <ListItem sx={{ px:0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
//               {ride.surgeFare    >  0    && <ListItem sx={{ px:0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
//               {ride.promoDiscount > 0    && <ListItem sx={{ px:0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
//               <Divider sx={{ my:1 }} />
//               <ListItem sx={{ px:0 }}>
//                 <ListItemText primary="Total" primaryTypographyProps={{ fontWeight:600 }} />
//                 <Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography>
//               </ListItem>
//               <ListItem sx={{ px:0 }}>
//                 <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight:700, fontSize:'1.1rem' }} />
//                 <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
//                   {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
//                 </Typography>
//               </ListItem>
//             </List>
//             <Chip label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`} sx={{ mt:2, fontWeight:600 }} />
//           </Paper>

//           {/* Trip Stats */}
//           <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
//             <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Statistics</Typography>
//             <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
//               <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
//                 <Typography variant="h5" sx={{ fontWeight:700, color:'primary.main' }}>{(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km</Typography>
//                 <Typography variant="caption" color="text.secondary">Distance</Typography>
//               </Box>
//               <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
//                 <Typography variant="h5" sx={{ fontWeight:700, color:'info.main' }}>{formatETA(ride.actualDuration ?? ride.estimatedDuration)}</Typography>
//                 <Typography variant="caption" color="text.secondary">Duration</Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Action Buttons */}
//           {ride.rideStatus === 'accepted' && (
//             <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival}
//               sx={{ height:56, fontWeight:700, borderRadius:3, bgcolor:'success.main', '&:hover':{ bgcolor:'success.dark' }, mb:1 }}>
//               I've Arrived at Pickup
//             </Button>
//           )}

//           {ride.rideStatus === 'arrived' && (
//             <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />}
//               sx={{ height:56, fontWeight:700, borderRadius:3, mb:1 }}>
//               Start Trip
//             </Button>
//           )}

//           {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
//             <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>

//               {okrapayAllowedForRides && (
//                 <Button fullWidth variant="contained" size="large"
//                   onClick={handleRequestPayment}
//                   disabled={paymentRequested && completeLockSecondsLeft > 0}
//                   startIcon={<PaymentIcon />}
//                   sx={{
//                     height:56, fontWeight:700, borderRadius:3,
//                     bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.main',
//                     '&:hover': { bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.dark' },
//                     '&.Mui-disabled': { bgcolor:'grey.300', color:'grey.500' },
//                   }}>
//                   {(paymentRequested && completeLockSecondsLeft > 0)
//                     ? `Payment Requested ✓  (${completeLockSecondsLeft}s)`
//                     : 'Request Payment'}
//                 </Button>
//               )}

//               {completeTripLocked && (
//                 <Box>
//                   <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
//                     <TimerIcon sx={{ fontSize:16, color:'text.secondary' }} />
//                     <Typography variant="caption" color="text.secondary">
//                       Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay
//                     </Typography>
//                   </Box>
//                   <LinearProgress
//                     variant="determinate"
//                     value={((COMPLETE_TRIP_LOCK_MS / 1000 - completeLockSecondsLeft) / (COMPLETE_TRIP_LOCK_MS / 1000)) * 100}
//                     sx={{ borderRadius:1, height:6, bgcolor:'warning.light', '& .MuiLinearProgress-bar':{ bgcolor:'warning.main' } }}
//                   />
//                 </Box>
//               )}

//               {ride.rideStatus === 'awaiting_payment' && (
//                 <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius:2 }}>
//                   Waiting for rider to complete payment…
//                 </Alert>
//               )}

//               <Button fullWidth variant="contained" color="success" size="large"
//                 onClick={handleCompleteTrip}
//                 disabled={completeTripLocked}
//                 startIcon={<CheckIcon />}
//                 sx={{ height:56, fontWeight:700, borderRadius:3, opacity: completeTripLocked ? 0.5 : 1 }}>
//                 Complete Trip
//               </Button>
//             </Box>
//           )}

//           {['pending','accepted','arrived'].includes(ride.rideStatus) && (
//             <Button fullWidth variant="outlined" color="error"
//               sx={{ height:48, borderRadius:3, fontWeight:600, borderWidth:2, mt:1, '&:hover':{ borderWidth:2 } }}
//               onClick={async () => {
//                 const reason = window.prompt('Reason for cancellation:');
//                 if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
//               }}>
//               Cancel Ride
//             </Button>
//           )}
//         </Box>
//       </Paper>

//       {/* Navigation Modal */}
//       {showNavigationModal && destination() && (
//         <SwipeableBottomSheet open={showNavigationModal} onClose={() => setShowNavigationModal(false)}
//           initialHeight={window.innerHeight * 0.7} maxHeight={window.innerHeight * 0.9} minHeight={300}
//           onSwipeDown={() => setShowNavigationModal(false)}>
//           <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
//             <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', p:2, borderBottom:'1px solid', borderColor:'divider' }}>
//               <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
//                 <NavigationIcon color="primary" />
//                 <Typography variant="h6" fontWeight={600}>Navigation</Typography>
//               </Box>
//               <Box sx={{ display:'flex', gap:1 }}>
//                 <IconButton size="small" onClick={handleOpenInExternalApp} sx={{ bgcolor:'primary.light' }}><OpenInNewIcon fontSize="small" /></IconButton>
//                 <IconButton size="small" onClick={() => setShowNavigationModal(false)}><CloseIcon fontSize="small" /></IconButton>
//               </Box>
//             </Box>
//             <Box sx={{ p:2, bgcolor:'action.hover' }}>
//               <Typography variant="caption" color="text.secondary" fontWeight={600}>NAVIGATING TO</Typography>
//               <Typography variant="body1" fontWeight={500} mt={0.5}>{destination()?.address}</Typography>
//             </Box>
//             <Box sx={{ flex:1 }}>
//               <iframe src={getMapEmbedUrl()} width="100%" height="100%" style={{ border:0 }} allowFullScreen loading="lazy" />
//             </Box>
//             <Box sx={{ p:2, borderTop:'1px solid', borderColor:'divider' }}>
//               <Button fullWidth variant="contained" startIcon={<OpenInNewIcon />} onClick={handleOpenInExternalApp}
//                 sx={{ height:48, fontWeight:600, borderRadius:3 }}>
//                 Open in Google Maps App
//               </Button>
//             </Box>
//           </Box>
//         </SwipeableBottomSheet>
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
  LinearProgress, Dialog,
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
  const [driverLocation, setDriverLocation] = useState(null);
  const [riderLocation,  setRiderLocation]  = useState(null);
  const [eta,            setEta]            = useState(null);
  const [distance,       setDistance]       = useState(null);

  // ── Navigation popup / full-screen map ──────────────────────────────────
  const [showNavPopup,      setShowNavPopup]      = useState(false);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);

  // ── Map control refs ─────────────────────────────────────────────────────
  const mapControlsRef          = useRef(null);
  const fullScreenMapControlsRef = useRef(null);

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
  // Every 2 seconds:
  //   • Fetch driver's currentLocation from the backend (by driver.id)
  //   • During 'accepted':  also fetch rider's location → ETA driver → rider
  //   • During 'passenger_onboard' / 'awaiting_payment':
  //       ETA driver → dropoff  (rider may be offline — only use driver coords)
  //   • Also emit driver location over socket so the rider tracking page updates
  //   • During in-progress: pan main map to driver with no zoom change
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
          setDriverLocation(driverLoc);
          // Keep the rider's tracking page updated via socket
          updateLocation(driverLoc, rawDriver?.heading || 0, rawDriver?.speed || 0);
        }

        // ── During 'accepted': show driver approaching rider's pickup ────
        if (rideStatus === 'accepted' && driverLoc) {
          const riderRes = await apiClient.get(`/users/${ride.rider?.id}`);
          const rawRider = riderRes?.data?.currentLocation ?? riderRes?.currentLocation;
          const riderLoc = normalizeCoords(rawRider);
          if (riderLoc && mountedRef.current) setRiderLocation(riderLoc);

          // ETA: driver → rider's current position (or static pickup as fallback)
          const dest = riderLoc ?? normalizeCoords(ride.pickupLocation);
          if (dest) {
            const dist = calculateDistance(driverLoc, dest);
            if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
          }
        }

        // ── During 'passenger_onboard' / 'awaiting_payment': ─────────────
        //    ETA driver → dropoff (rider may be offline — driver location only)
        if ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && driverLoc) {
          const dropoff = normalizeCoords(ride.dropoffLocation);
          if (dropoff) {
            const dist = calculateDistance(driverLoc, dropoff);
            if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
          }
          // Pan main map to driver — pass undefined zoom so IframeMap keeps the
          // current zoom level (only center changes, no zoom animation).
          if (mapControlsRef.current) {
            mapControlsRef.current.animateToLocation(driverLoc);
          }
          // Keep full-screen map (if open) zoomed in on driver at z=20
          if (fullScreenMapControlsRef.current) {
            fullScreenMapControlsRef.current.animateToLocation(driverLoc, 20);
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

  // ── Map markers + route props ─────────────────────────────────────────────
  //
  // We compute three things here:
  //   mapPickup    → passed as `pickupLocation` to MapIframe → route START
  //   mapDropoff   → passed as `dropoffLocation` to MapIframe → route END
  //   markers      → explicit marker overrides (driver car, rider pin, etc.)
  //
  // Because IframeMap auto-adds 'pickup' and 'dropoff' id markers from the
  // pickupLocation / dropoffLocation props, we override both in the explicit
  // markers array (same id → last write wins in the iframe marker map).
  // ─────────────────────────────────────────────────────────────────────────
  const { mapPickup, mapDropoff, mapShowRoute, markers } = useMemo(() => {
    const dNorm = driverLocation;
    const rNorm = riderLocation;
    const pickup = normalizeCoords(ride?.pickupLocation);
    const dropoff = normalizeCoords(ride?.dropoffLocation);

    if (rideStatus === 'accepted') {
      // Route: driver → rider's current position (or static pickup as fallback)
      const dest = rNorm ?? pickup;
      return {
        mapPickup:   dNorm ?? pickup,
        mapDropoff:  dest,
        mapShowRoute: !!(dNorm && dest),
        markers: [
          // Override the auto-'pickup' marker (at driverLocation) with a car icon
          ...(dNorm ? [{ id: 'pickup', position: dNorm, type: 'driver' }] : []),
          // Override the auto-'dropoff' marker (at dest) with a pickup pin
          ...(dest  ? [{ id: 'dropoff', position: dest,  type: 'pickup' }] : []),
          // Also show rider's LIVE position as a small pulse dot (if available)
          ...(rNorm ? [{ id: 'rider',   position: rNorm, type: 'current' }] : []),
        ],
      };
    }

    if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') {
      // Route: driver (live) → dropoff. Rider is in the car — only driver matters.
      return {
        mapPickup:   dNorm ?? pickup,
        mapDropoff:  dropoff,
        mapShowRoute: true,
        markers: [
          ...(dNorm   ? [{ id: 'pickup',  position: dNorm,  type: 'driver'  }] : []),
          ...(dropoff ? [{ id: 'dropoff', position: dropoff, type: 'dropoff' }] : []),
        ],
      };
    }

    // 'arrived' (and any other status): show static pickup, driver bouncing
    return {
      mapPickup:   pickup,
      mapDropoff:  null,
      mapShowRoute: false,
      markers: [
        ...(dNorm  ? [{ id: 'driver', position: dNorm,  type: 'driver',  animation: 'BOUNCE' }] : []),
        ...(pickup ? [{ id: 'pickup', position: pickup, type: 'pickup' }] : []),
      ],
    };
  }, [
    rideStatus,
    driverLocation?.lat, driverLocation?.lng,
    riderLocation?.lat,  riderLocation?.lng,
    ride?.pickupLocation?.lat,  ride?.pickupLocation?.lng,
    ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng,
  ]);

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
    if (!window.confirm('Complete this ride?')) return;
    try {
      await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration });
      router.push('/home');
    } catch (err) { console.error('Error completing trip:', err); }
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
            pickupLocation={mapPickup}
            dropoffLocation={mapDropoff}
            showRoute={mapShowRoute}
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
          Zoom = 20, centered on driver's live position, route is active.
          Only a close button at the bottom. */}
      <Dialog fullScreen open={showFullScreenMap} onClose={() => setShowFullScreenMap(false)}>
        <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000' }}>
          <MapIframe
            center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
            zoom={20}
            height="100%"
            markers={markers}
            pickupLocation={mapPickup}
            dropoffLocation={mapDropoff}
            showRoute={mapShowRoute}
            onMapLoad={(c) => {
              fullScreenMapControlsRef.current = c;
              // After the map boots, fly to the driver's current position at z=20
              if (driverLocation) {
                setTimeout(() => {
                  fullScreenMapControlsRef.current?.animateToLocation(driverLocation, 20);
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
              onClick={() => setShowFullScreenMap(false)}
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