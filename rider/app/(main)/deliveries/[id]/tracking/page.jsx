// 'use client';
// // PATH: rider/app/(main)/deliveries/[id]/tracking/page.jsx

// import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import {
//   Box, Paper, Typography, Avatar, IconButton, Button, Chip,
//   LinearProgress, CircularProgress, Alert,
// } from '@mui/material';
// import { alpha, useTheme } from '@mui/material/styles';
// import {
//   Phone as PhoneIcon, Message as MessageIcon,
//   Star as StarIcon, LocalShipping as DeliveryIcon,
//   Inventory as PackageIcon, Speed as SpeedIcon,
//   Navigation as NavIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import MapIframe from '@/components/Map/MapIframeNoSSR';
// import { getDelivery, getDelivererLocation } from '@/lib/api/deliveries';
// import { useSocket } from '@/lib/socket/SocketProvider';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { formatCurrency } from '@/Functions';
// import { SOCKET_EVENTS } from '@/Constants';

// const AMBER = '#F59E0B';
// const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

// const deg2rad = (d) => d * (Math.PI / 180);
// function haversine(a, b) {
//   if (!a || !b) return 0;
//   const lat1 = a.lat ?? 0, lat2 = b.lat ?? 0, lng1 = a.lng ?? 0, lng2 = b.lng ?? 0;
//   const R = 6371;
//   const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
//   const x = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.sin(dLon/2)**2;
//   return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
// }
// const estimateMins = (km) => Math.ceil((km / 30) * 60);
// const fmtETA = (m) => {
//   if (m == null) return 'Calculating…';
//   if (m < 1)  return 'Arriving soon';
//   if (m < 60) return `${m} min`;
//   return `${Math.floor(m/60)}h ${m%60 ? m%60+'m' : ''}`.trim();
// };

// function normalizeCoords(loc) {
//   if (!loc) return null;
//   const lat = loc.lat ?? loc.latitude;
//   const lng = loc.lng ?? loc.longitude;
//   if (lat == null || lng == null) return null;
//   return { ...loc, lat, lng };
// }

// const STATUS_STEPS = [
//   { status: 'accepted',          label: 'Deliverer En Route',  emoji: '🚗' },
//   { status: 'arrived',           label: 'Arrived at Pickup',   emoji: '📍' },
//   { status: 'passenger_onboard', label: 'Package In Transit',  emoji: '📦' },
//   { status: 'awaiting_payment',  label: 'Awaiting Payment',    emoji: '💳' },
//   { status: 'completed',         label: 'Delivered!',          emoji: '✅' },
// ];

// const STATUS_IDX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.status, i]));

// function ProgressStepper({ rideStatus }) {
//   const theme  = useTheme();
//   const isDark = theme.palette.mode === 'dark';
//   const cur    = STATUS_IDX[rideStatus] ?? 0;
//   return (
//     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
//       {STATUS_STEPS.slice(0, 4).map((step, i) => (
//         <Box key={step.status} sx={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 0 }}>
//           <Box sx={{
//             width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             background: i <= cur
//               ? `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)`
//               : alpha(isDark?'#fff':'#000', isDark?0.12:0.08),
//             border: `2px solid ${i === cur ? AMBER : 'transparent'}`,
//             fontSize: '0.75rem', fontWeight: 700,
//             color: i <= cur ? '#fff' : 'text.disabled',
//             transition: 'all 0.3s ease',
//             boxShadow: i === cur ? `0 0 0 4px ${alpha(AMBER,0.25)}` : 'none',
//           }}>
//             {i < cur ? '✓' : step.emoji}
//           </Box>
//           {i < 3 && (
//             <Box sx={{ flex: 1, height: 3, borderRadius: 1.5, background: i < cur ? `linear-gradient(90deg,${AMBER},#D97706)` : alpha(isDark?'#fff':'#000', isDark?0.1:0.07), transition: 'background 0.3s ease', mx: 0.5 }} />
//           )}
//         </Box>
//       ))}
//     </Box>
//   );
// }

// export default function DeliveryTrackingPage() {
//   const params = useParams();
//   const router = useRouter();
//   const theme  = useTheme();
//   const isDark = theme.palette.mode === 'dark';
//   const id     = params.id;

//   const [delivery,      setDelivery]      = useState(null);
//   const [delivererLoc,  setDelivererLoc]  = useState(null);
//   const [eta,           setEta]           = useState(null);
//   const [distance,      setDistance]      = useState(null);
//   const [loading,       setLoading]       = useState(true);
//   const [showFullSheet, setShowFullSheet] = useState(false);

//   const [routePickup,  setRoutePickup]  = useState(null);
//   const [routeDropoff, setRouteDropoff] = useState(null);
//   const [routeReady,   setRouteReady]   = useState(false);
//   const routeStatusRef = useRef(null);

//   const mapControlsRef = useRef(null);
//   const pollRef        = useRef(null);
//   const locPollRef     = useRef(null);
//   const mountedRef     = useRef(true);

//   const { on: socketOn, off: socketOff, connected } = useSocket();
//   const { on: rnOn } = useReactNative();

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//       clearInterval(pollRef.current);
//       clearInterval(locPollRef.current);
//     };
//   }, []);


//   // ─── Load delivery ────────────────────────────────────────────────────
//   const load = useCallback(async () => {
//     try {
//       const res  = await getDelivery(id);
//       const data = res?.data ?? res;
//       if (data && mountedRef.current) setDelivery(data);
//     } catch {}
//     finally { if (mountedRef.current) setLoading(false); }
//   }, [id]);

//   useEffect(() => { load(); }, [load]);

//   // ─── Status polling (fallback) ────────────────────────────────────────
//   const rideStatus = delivery?.rideStatus;

  
//   useEffect(() => {
//     if (!id) return;
//     pollRef.current = setInterval(async () => {
//       if (!mountedRef.current) return;
//       try {
//         const res  = await getDelivery(id);
//         const data = res?.data ?? res;
//         if (!data || !mountedRef.current) return;
//         setDelivery(prev => prev ? { ...prev, ...data } : data);
//         if (data.rideStatus === 'completed' || data.paymentStatus === 'completed') {
//           clearInterval(pollRef.current);
//           router.replace(`/deliveries/${id}`);
//         }
//         if (data.rideStatus === 'cancelled') {
//           clearInterval(pollRef.current);
//           router.replace('/deliveries');
//         }
//       } catch {}
//     }, 15000);
//     return () => clearInterval(pollRef.current);
//   }, [id, router]);

//   // ─── Socket events ────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!connected || !id) return;

//     const match = (data) => !data?.deliveryId || String(data.deliveryId) === String(id);

//     const onArrived   = (data) => { if (!match(data)) return; setDelivery(p => p ? { ...p, rideStatus: 'arrived' } : p); };
//     const onStarted   = (data) => { if (!match(data)) return; setDelivery(p => p ? { ...p, rideStatus: 'passenger_onboard' } : p); };
//     const onPayReq    = (data) => { if (!match(data)) return; setDelivery(p => p ? { ...p, rideStatus: 'awaiting_payment' } : p); };
//     const onComplete  = (data) => { if (!match(data)) return; clearInterval(pollRef.current); router.replace(`/deliveries/${id}`); };
//     const onCancelled = (data) => { if (!match(data)) return; clearInterval(pollRef.current); router.replace('/deliveries'); };

//     // Use constants to avoid magic strings
//     socketOn(SOCKET_EVENTS.DELIVERY.DRIVER_ARRIVED,    onArrived);
//     socketOn(SOCKET_EVENTS.DELIVERY.STARTED,           onStarted);
//     socketOn(SOCKET_EVENTS.DELIVERY.PAYMENT_REQUESTED, onPayReq);
//     socketOn(SOCKET_EVENTS.DELIVERY.COMPLETED,         onComplete);
//     socketOn(SOCKET_EVENTS.DELIVERY.CANCELLED,         onCancelled);

//     return () => {
//       socketOff(SOCKET_EVENTS.DELIVERY.DRIVER_ARRIVED);
//       socketOff(SOCKET_EVENTS.DELIVERY.STARTED);
//       socketOff(SOCKET_EVENTS.DELIVERY.PAYMENT_REQUESTED);
//       socketOff(SOCKET_EVENTS.DELIVERY.COMPLETED);
//       socketOff(SOCKET_EVENTS.DELIVERY.CANCELLED);
//     };
//   }, [connected, id, socketOn, socketOff, router]);

//   // ─── Live location from ReactNative WebView bridge ────────────────────
//   // The native app may forward the deliverer's location under either
//   // DELIVERY_LOCATION_UPDATED (delivery-specific) or DRIVER_LOCATION_UPDATED
//   // (legacy/generic). Listen to both.
//   const handleDelivererLocFromRN = useCallback((payload) => {
//     const raw = payload?.location ?? payload;
//     const loc = normalizeCoords(raw);
//     if (!loc || !mountedRef.current) return;
//     setDelivererLoc(loc);
//     mapControlsRef.current?.updateDriverLocation(loc);
//     if (payload.eta      != null) setEta(payload.eta);
//     if (payload.distance != null) setDistance(payload.distance);
//   }, []);

//   useEffect(() => {
//     // Subscribe to both keys — native app may use either
//     const unsub1 = rnOn('DELIVERY_LOCATION_UPDATED', handleDelivererLocFromRN);
//     const unsub2 = rnOn('DRIVER_LOCATION_UPDATED',   handleDelivererLocFromRN);
//     return () => { unsub1?.(); unsub2?.(); };
//   }, [rnOn, handleDelivererLocFromRN]);

// // ─── Reset route ref when status changes so route redraws correctly ───
// useEffect(() => {
//   routeStatusRef.current = null;
//   setRouteReady(false);
//   setRoutePickup(null);
//   setRouteDropoff(null);
// }, [rideStatus]);

// // ─── Live location polling from API ───────────────────────────────────
// useEffect(() => {
//   if (!delivery || !id || ['completed', 'cancelled'].includes(rideStatus)) return;

//   const updateLoc = async () => {
//     if (!mountedRef.current) return;
//     try {
//       const res = await getDelivererLocation(id);
//       // ── Unwrap the nested location field from the backend response ────
//       const raw = res?.location ?? res?.data?.location ?? res?.data ?? res;
//       const loc = normalizeCoords(raw);
//       if (!loc || !mountedRef.current) return;

//       setDelivererLoc(loc);
//       mapControlsRef.current?.updateDriverLocation(loc);

//       // ── ETA calculation ───────────────────────────────────────────────
//       const etaDest = rideStatus === 'accepted'
//         ? normalizeCoords(delivery.pickupLocation)
//         : normalizeCoords(delivery.dropoffLocation);
//       if (etaDest) {
//         const km = haversine(loc, etaDest);
//         if (mountedRef.current) { setDistance(km); setEta(estimateMins(km)); }
//       }

//       // ── ACCEPTED: route is driver→pickup, updates every poll ──────────
//       // routePickup is the driver's live position (changes each poll)
//       // routeDropoff is the fixed pickup location
//       if (rideStatus === 'accepted') {
//         const pickup = normalizeCoords(delivery.pickupLocation);
//         if (pickup) {
//           setRoutePickup(loc);          // driver's current position — updates live
//           setRouteDropoff(pickup);      // fixed destination: pickup location
//           setRouteReady(true);
//         }
//       }

//       // ── PASSENGER_ONBOARD: route is pickup→dropoff, drawn once ────────
//       // Both ends are fixed — no need to update on every poll
//       if (rideStatus === 'passenger_onboard' && routeStatusRef.current !== 'passenger_onboard') {
//         routeStatusRef.current = 'passenger_onboard';
//         const pickup  = normalizeCoords(delivery.pickupLocation);
//         const dropoff = normalizeCoords(delivery.dropoffLocation);
//         if (pickup && dropoff) {
//           setRoutePickup(pickup);
//           setRouteDropoff(dropoff);
//           setRouteReady(true);
//         }
//       }

//     } catch {}
//   };

//   // Fire immediately then every 3 seconds
//   updateLoc();
//   locPollRef.current = setInterval(updateLoc, 3000);
//   return () => clearInterval(locPollRef.current);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [id, rideStatus, delivery?.deliverer?.id]);


//   // Replace the static useMemo(() => [], []) with this:
// const markers = useMemo(() => {
//   if (!delivery) return [];

//   const actualPickup  = normalizeCoords(delivery.pickupLocation);
//   const actualDropoff = normalizeCoords(delivery.dropoffLocation);

//   const PACKAGE_MARKER = { bg: '#92400E', label: '📦', size: 36 };

//   if (rideStatus === 'accepted') {
//     // Driver handled by updateDriverLocation — only show pickup destination pin
//     const result = [];
//     if (actualPickup) {
//       result.push({ id: 'pickup', position: actualPickup, type: 'pickup', custom: PACKAGE_MARKER });
//     }
//     return result;
//   }

//   if (rideStatus === 'passenger_onboard') {
//     // Driver handled by updateDriverLocation — show route endpoints only
//     const result = [];
//     if (actualPickup) {
//       result.push({ id: 'pickup',  position: actualPickup,  type: 'pickup',  custom: PACKAGE_MARKER });
//     }
//     if (actualDropoff) {
//       result.push({ id: 'dropoff', position: actualDropoff, type: 'dropoff', custom: null });
//     }
//     return result;
//   }

//   // Other statuses
//   const result = [];
//   if (actualPickup)  result.push({ id: 'pickup',  position: actualPickup,  type: 'pickup',  custom: PACKAGE_MARKER });
//   if (actualDropoff) result.push({ id: 'dropoff', position: actualDropoff, type: 'dropoff', custom: null });
//   return result;

// }, [rideStatus, delivery])


//   const curStep    = STATUS_STEPS.find(s => s.status === rideStatus) ?? STATUS_STEPS[0];
//   const bannerColor = rideStatus === 'accepted' ? '#10B981' : AMBER;
//   const bannerBg    = rideStatus === 'accepted'
//     ? 'linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(5,150,105,0.06) 100%)'
//     : 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(217,119,6,0.06) 100%)';

//   if (loading || !delivery) {
//     return <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: AMBER }} /></Box>;
//   }

//   const deliverer = delivery.deliverer;

//   return (
//     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

//       {/* Map */}
//       <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
//         <MapIframe
//   center={delivererLoc ?? normalizeCoords(delivery.pickupLocation) ?? { lat: -15.4167, lng: 28.2833 }}
//   zoom={15} height="100%" markers={markers}
//   pickupLocation={routePickup} dropoffLocation={routeDropoff} showRoute={routeReady}
//   onMapLoad={(c) => {
//     mapControlsRef.current = c;
//     // Configure driver marker to use truck icon — done once, persists
//     c.configureDriverMarker({ bg: '#0F172A', label: '🚚', size: 44 });
//   }} 
// />
//       </Box>

//       {/* Bottom sheet */}
//       <Paper elevation={0} sx={{
//         borderTopLeftRadius: 24, borderTopRightRadius: 24,
//         maxHeight: showFullSheet ? '70vh' : '42vh',
//         minHeight: '42vh',
//         transition: 'max-height 0.35s ease',
//         overflowY: 'auto', ...hideScrollbar,
//         background: isDark ? 'linear-gradient(160deg,#1E293B 0%,#0F172A 100%)' : '#FFFFFF',
//         boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
//       }}>
//         {/* Handle */}
//         <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5, cursor: 'pointer' }}
//           onClick={() => setShowFullSheet(p => !p)}>
//           <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
//         </Box>

//         <Box sx={{ px: 2.5, pb: 3 }}>
//           {/* Status progress */}
//           <Box sx={{ mb: 2 }}><ProgressStepper rideStatus={rideStatus} /></Box>

//           {/* ETA / status banner */}
//           <AnimatePresence mode="wait">
//             <motion.div key={rideStatus} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
//               <Box sx={{ p: 2, borderRadius: 3, mb: 2, background: bannerBg, border: `1px solid ${alpha(bannerColor,0.25)}` }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
//                   <Typography sx={{ fontSize: 18 }}>{curStep.emoji}</Typography>
//                   <Typography variant="subtitle2" fontWeight={700}>{curStep.label}</Typography>
//                   {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard') && eta != null && (
//                     <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
//                       {distance != null && <Typography variant="caption" color="text.secondary" fontWeight={600}>{distance.toFixed(1)} km</Typography>}
//                       <Typography variant="caption" fontWeight={800} sx={{ color: bannerColor }}>{fmtETA(eta)}</Typography>
//                     </Box>
//                   )}
//                 </Box>
//                 {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard') && eta != null && (
//                   <LinearProgress variant="indeterminate" sx={{ borderRadius: 2, height: 4, bgcolor: alpha(bannerColor,0.15), '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg,${bannerColor},${alpha(bannerColor,0.7)})` } }} />
//                 )}
//               </Box>
//             </motion.div>
//           </AnimatePresence>

//           {/* Deliverer card */}
//           {deliverer && (
//             <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(isDark?'#fff':'#000',0.08)}`, bgcolor: isDark ? alpha('#fff',0.04) : alpha('#000',0.02) }}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                 <Avatar sx={{ width: 50, height: 50, border: `2px solid ${alpha(AMBER,0.5)}` }}>
//                   {deliverer.firstName?.[0]}{deliverer.lastName?.[0]}
//                 </Avatar>
//                 <Box sx={{ flex: 1 }}>
//                   <Typography variant="subtitle1" fontWeight={700}>{deliverer.firstName} {deliverer.lastName}</Typography>
//                   {deliverer.driverProfile?.averageRating > 0 && (
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                       <Typography sx={{ fontSize: 13, color: AMBER }}>★</Typography>
//                       <Typography variant="caption" fontWeight={700} sx={{ color: AMBER }}>{deliverer.driverProfile.averageRating.toFixed(1)}</Typography>
//                       <Typography variant="caption" color="text.disabled">· {deliverer.driverProfile.completedDeliveries ?? 0} deliveries</Typography>
//                     </Box>
//                   )}
//                   {delivery.vehicle && (
//                     <Typography variant="caption" color="text.secondary">
//                       {delivery.vehicle.make} {delivery.vehicle.model} · {delivery.vehicle.numberPlate}
//                     </Typography>
//                   )}
//                 </Box>
//                 <Box sx={{ display: 'flex', gap: 1 }}>
//                   <IconButton onClick={() => window.location.href = `tel:${deliverer.phoneNumber}`}
//                     sx={{ bgcolor: 'success.main', color: '#fff', width: 38, height: 38, '&:hover': { bgcolor: 'success.dark' } }}>
//                     <PhoneIcon sx={{ fontSize: 17 }} />
//                   </IconButton>
//                   <IconButton onClick={() => window.open(`https://wa.me/${deliverer.phoneNumber?.replace(/\D/g,'')}`, '_blank')}
//                     sx={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', width: 38, height: 38 }}>
//                     <MessageIcon sx={{ fontSize: 17 }} />
//                   </IconButton>
//                 </Box>
//               </Box>
//             </Paper>
//           )}

//           {/* Expanded details */}
//           {showFullSheet && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//               {/* Route summary */}
//               <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(isDark?'#fff':'#000',0.08)}` }}>
//                 <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
//                   <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', mt: 0.6, flexShrink: 0 }} />
//                   <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pickup</Typography>
//                     <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                       {delivery.pickupLocation?.address}
//                     </Typography>
//                   </Box>
//                 </Box>
//                 <Box sx={{ display: 'flex', gap: 1.5 }}>
//                   <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: '#EF4444', mt: 0.6, flexShrink: 0 }} />
//                   <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Dropoff</Typography>
//                     <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                       {delivery.dropoffLocation?.address}
//                     </Typography>
//                   </Box>
//                 </Box>

//                 {/* Package details */}
//                 {delivery.package && (
//                   <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha(isDark?'#fff':'#000',0.07)}`, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
//                     <PackageIcon sx={{ fontSize: 15, color: AMBER }} />
//                     <Typography variant="caption" textTransform="capitalize" fontWeight={600}>
//                       {delivery.package.packageType ?? 'Package'}
//                     </Typography>
//                     {delivery.package.isFragile && <Chip label="Fragile" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem' }} />}
//                     {delivery.package.recipientName && (
//                       <Typography variant="caption" color="text.secondary">→ {delivery.package.recipientName}</Typography>
//                     )}
//                   </Box>
//                 )}
//               </Paper>

//               {/* Fare */}
//               {delivery.totalFare != null && (
//                 <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(AMBER,0.2)}`, background: alpha(AMBER,isDark?0.08:0.04) }}>
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <Typography variant="body2" fontWeight={600}>Total Fare</Typography>
//                     <Typography variant="h6" fontWeight={800} sx={{ color: AMBER }}>{formatCurrency(delivery.totalFare)}</Typography>
//                   </Box>
//                   <Chip label={delivery.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'} size="small"
//                     sx={{ mt: 0.75, fontWeight: 700, bgcolor: alpha(AMBER,isDark?0.15:0.1), color: AMBER, border: `1px solid ${alpha(AMBER,0.3)}` }} />
//                 </Paper>
//               )}
//             </motion.div>
//           )}

//           {/* Navigate to dropoff */}
//           <Button fullWidth variant="outlined" size="small" startIcon={<NavIcon />}
//             onClick={() => {
//               const dest = normalizeCoords(delivery.dropoffLocation);
//               if (dest) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
//             }}
//             sx={{ height: 44, borderRadius: 3, fontWeight: 600, borderColor: alpha(AMBER,0.5), color: AMBER }}>
//             Open Dropoff in Google Maps
//           </Button>
//         </Box>
//       </Paper>
//     </Box>
//   );
// }
'use client';
// PATH: rider/app/(main)/deliveries/[id]/tracking/page.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, Avatar, IconButton, Button, Chip,
  LinearProgress, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Phone as PhoneIcon, Message as MessageIcon,
  Star as StarIcon, LocalShipping as DeliveryIcon,
  Inventory as PackageIcon, Speed as SpeedIcon,
  Navigation as NavIcon, Cancel as CancelIcon, Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import MapIframe from '@/components/Map/MapIframeNoSSR';
import { getDelivery, getDelivererLocation } from '@/lib/api/deliveries';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { formatCurrency } from '@/Functions';
import { SOCKET_EVENTS } from '@/Constants';

const AMBER = '#F59E0B';
const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };
const DEFAULT_CANCEL_REASON = 'Change of plans';

const deg2rad = (d) => d * (Math.PI / 180);
function haversine(a, b) {
  if (!a || !b) return 0;
  const lat1 = a.lat ?? 0, lat2 = b.lat ?? 0, lng1 = a.lng ?? 0, lng2 = b.lng ?? 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
  const x = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
const estimateMins = (km) => Math.ceil((km / 30) * 60);
const fmtETA = (m) => {
  if (m == null) return 'Calculating…';
  if (m < 1)  return 'Arriving soon';
  if (m < 60) return `${m} min`;
  return `${Math.floor(m/60)}h ${m%60 ? m%60+'m' : ''}`.trim();
};

function normalizeCoords(loc) {
  if (!loc) return null;
  const lat = loc.lat ?? loc.latitude;
  const lng = loc.lng ?? loc.longitude;
  if (lat == null || lng == null) return null;
  return { ...loc, lat, lng };
}

const STATUS_STEPS = [
  { status: 'accepted',          label: 'Deliverer En Route',  emoji: '🚗' },
  { status: 'arrived',           label: 'Arrived at Pickup',   emoji: '📍' },
  { status: 'passenger_onboard', label: 'Package In Transit',  emoji: '📦' },
  { status: 'awaiting_payment',  label: 'Awaiting Payment',    emoji: '💳' },
  { status: 'completed',         label: 'Delivered!',          emoji: '✅' },
];

const STATUS_IDX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.status, i]));

function ProgressStepper({ rideStatus }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const cur    = STATUS_IDX[rideStatus] ?? 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STATUS_STEPS.slice(0, 4).map((step, i) => (
        <Box key={step.status} sx={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 0 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i <= cur
              ? `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)`
              : alpha(isDark?'#fff':'#000', isDark?0.12:0.08),
            border: `2px solid ${i === cur ? AMBER : 'transparent'}`,
            fontSize: '0.75rem', fontWeight: 700,
            color: i <= cur ? '#fff' : 'text.disabled',
            transition: 'all 0.3s ease',
            boxShadow: i === cur ? `0 0 0 4px ${alpha(AMBER,0.25)}` : 'none',
          }}>
            {i < cur ? '✓' : step.emoji}
          </Box>
          {i < 3 && (
            <Box sx={{ flex: 1, height: 3, borderRadius: 1.5, background: i < cur ? `linear-gradient(90deg,${AMBER},#D97706)` : alpha(isDark?'#fff':'#000', isDark?0.1:0.07), transition: 'background 0.3s ease', mx: 0.5 }} />
          )}
        </Box>
      ))}
    </Box>
  );
}

export default function DeliveryTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const id     = params.id;

  const [delivery,      setDelivery]      = useState(null);
  const [delivererLoc,  setDelivererLoc]  = useState(null);
  const [eta,           setEta]           = useState(null);
  const [distance,      setDistance]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showFullSheet, setShowFullSheet] = useState(false);

  const [routePickup,  setRoutePickup]  = useState(null);
  const [routeDropoff, setRouteDropoff] = useState(null);
  const [routeReady,   setRouteReady]   = useState(false);
  const routeStatusRef = useRef(null);

  // ── Cancel flow ───────────────────────────────────────────────────────────
  const [showCancelConfirm,    setShowCancelConfirm]    = useState(false);
  const [showCancelReasons,    setShowCancelReasons]    = useState(false);
  const [cancelReasons,        setCancelReasons]        = useState([]);
  const [cancelReasonsLoading, setCancelReasonsLoading] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [cancelOtherText,      setCancelOtherText]      = useState('');
  const [cancelling,           setCancelling]           = useState(false);

  const mapControlsRef = useRef(null);
  const pollRef        = useRef(null);
  const locPollRef     = useRef(null);
  const mountedRef     = useRef(true);

  const { on: socketOn, off: socketOff, connected } = useSocket();
  const { on: rnOn } = useReactNative();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
      clearInterval(locPollRef.current);
    };
  }, []);

  // ─── Load delivery ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res  = await getDelivery(id);
      const data = res?.data ?? res;
      if (data && mountedRef.current) setDelivery(data);
    } catch {}
    finally { if (mountedRef.current) setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ─── Status polling (fallback) ────────────────────────────────────────
  const rideStatus = delivery?.rideStatus;

  useEffect(() => {
    if (!id) return;
    pollRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const res  = await getDelivery(id);
        const data = res?.data ?? res;
        if (!data || !mountedRef.current) return;
        setDelivery(prev => prev ? { ...prev, ...data } : data);
        if (data.rideStatus === 'completed' || data.paymentStatus === 'completed') {
          clearInterval(pollRef.current);
          router.replace(`/deliveries/${id}`);
        }
        if (data.rideStatus === 'cancelled') {
          clearInterval(pollRef.current);
          router.replace('/deliveries');
        }
      } catch {}
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [id, router]);

  // ─── Socket events ────────────────────────────────────────────────────
  useEffect(() => {
    if (!connected || !id) return;

    const match = (data) => !data?.deliveryId || String(data.deliveryId) === String(id);

    const onArrived   = (data) => { if (!match(data)) return; setDelivery(p => p ? { ...p, rideStatus: 'arrived' } : p); };
    const onStarted   = (data) => { if (!match(data)) return; setDelivery(p => p ? { ...p, rideStatus: 'passenger_onboard' } : p); };
    const onPayReq    = (data) => { if (!match(data)) return; setDelivery(p => p ? { ...p, rideStatus: 'awaiting_payment' } : p); };
    const onComplete  = (data) => { if (!match(data)) return; clearInterval(pollRef.current); router.replace(`/deliveries/${id}`); };
    const onCancelled = (data) => { if (!match(data)) return; clearInterval(pollRef.current); router.replace('/deliveries'); };

    socketOn(SOCKET_EVENTS.DELIVERY.DRIVER_ARRIVED,    onArrived);
    socketOn(SOCKET_EVENTS.DELIVERY.STARTED,           onStarted);
    socketOn(SOCKET_EVENTS.DELIVERY.PAYMENT_REQUESTED, onPayReq);
    socketOn(SOCKET_EVENTS.DELIVERY.COMPLETED,         onComplete);
    socketOn(SOCKET_EVENTS.DELIVERY.CANCELLED,         onCancelled);

    return () => {
      socketOff(SOCKET_EVENTS.DELIVERY.DRIVER_ARRIVED);
      socketOff(SOCKET_EVENTS.DELIVERY.STARTED);
      socketOff(SOCKET_EVENTS.DELIVERY.PAYMENT_REQUESTED);
      socketOff(SOCKET_EVENTS.DELIVERY.COMPLETED);
      socketOff(SOCKET_EVENTS.DELIVERY.CANCELLED);
    };
  }, [connected, id, socketOn, socketOff, router]);

  // ─── Live location from ReactNative WebView bridge ────────────────────
  const handleDelivererLocFromRN = useCallback((payload) => {
    const raw = payload?.location ?? payload;
    const loc = normalizeCoords(raw);
    if (!loc || !mountedRef.current) return;
    setDelivererLoc(loc);
    mapControlsRef.current?.updateDriverLocation(loc);
    if (payload.eta      != null) setEta(payload.eta);
    if (payload.distance != null) setDistance(payload.distance);
  }, []);

  useEffect(() => {
    const unsub1 = rnOn('DELIVERY_LOCATION_UPDATED', handleDelivererLocFromRN);
    const unsub2 = rnOn('DRIVER_LOCATION_UPDATED',   handleDelivererLocFromRN);
    return () => { unsub1?.(); unsub2?.(); };
  }, [rnOn, handleDelivererLocFromRN]);

  // ─── Reset route ref when status changes ─────────────────────────────
  useEffect(() => {
    routeStatusRef.current = null;
    setRouteReady(false);
    setRoutePickup(null);
    setRouteDropoff(null);
  }, [rideStatus]);

  // ─── Live location polling from API ───────────────────────────────────
  useEffect(() => {
    if (!delivery || !id || ['completed', 'cancelled'].includes(rideStatus)) return;

    const updateLoc = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await getDelivererLocation(id);
        const raw = res?.location ?? res?.data?.location ?? res?.data ?? res;
        const loc = normalizeCoords(raw);
        if (!loc || !mountedRef.current) return;

        setDelivererLoc(loc);
        mapControlsRef.current?.updateDriverLocation(loc);

        const etaDest = rideStatus === 'accepted'
          ? normalizeCoords(delivery.pickupLocation)
          : normalizeCoords(delivery.dropoffLocation);
        if (etaDest) {
          const km = haversine(loc, etaDest);
          if (mountedRef.current) { setDistance(km); setEta(estimateMins(km)); }
        }

        if (rideStatus === 'accepted') {
          const pickup = normalizeCoords(delivery.pickupLocation);
          if (pickup) {
            setRoutePickup(loc);
            setRouteDropoff(pickup);
            setRouteReady(true);
          }
        }

        if (rideStatus === 'passenger_onboard' && routeStatusRef.current !== 'passenger_onboard') {
          routeStatusRef.current = 'passenger_onboard';
          const pickup  = normalizeCoords(delivery.pickupLocation);
          const dropoff = normalizeCoords(delivery.dropoffLocation);
          if (pickup && dropoff) {
            setRoutePickup(pickup);
            setRouteDropoff(dropoff);
            setRouteReady(true);
          }
        }

      } catch {}
    };

    updateLoc();
    locPollRef.current = setInterval(updateLoc, 3000);
    return () => clearInterval(locPollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, rideStatus, delivery?.deliverer?.id]);

  // ─── Markers ──────────────────────────────────────────────────────────
  const markers = useMemo(() => {
    if (!delivery) return [];

    const actualPickup  = normalizeCoords(delivery.pickupLocation);
    const actualDropoff = normalizeCoords(delivery.dropoffLocation);

    const PACKAGE_MARKER = { bg: '#92400E', label: '📦', size: 36 };

    if (rideStatus === 'accepted') {
      const result = [];
      if (actualPickup) {
        result.push({ id: 'pickup', position: actualPickup, type: 'pickup', custom: PACKAGE_MARKER });
      }
      return result;
    }

    if (rideStatus === 'passenger_onboard') {
      const result = [];
      if (actualPickup) {
        result.push({ id: 'pickup',  position: actualPickup,  type: 'pickup',  custom: PACKAGE_MARKER });
      }
      if (actualDropoff) {
        result.push({ id: 'dropoff', position: actualDropoff, type: 'dropoff', custom: null });
      }
      return result;
    }

    const result = [];
    if (actualPickup)  result.push({ id: 'pickup',  position: actualPickup,  type: 'pickup',  custom: PACKAGE_MARKER });
    if (actualDropoff) result.push({ id: 'dropoff', position: actualDropoff, type: 'dropoff', custom: null });
    return result;

  }, [rideStatus, delivery]);

  // ── Cancel handlers ───────────────────────────────────────────────────────
  const handleCancelPress = () => setShowCancelConfirm(true);

  const handleCancelConfirmYes = async () => {
    setShowCancelConfirm(false);
    setCancelReasonsLoading(true);
    setShowCancelReasons(true);
    setSelectedCancelReason('');
    setCancelOtherText('');
    try {
      const res = await apiClient.get('/cancellation-reasons?filters[isActive][$eq]=true&filters[applicableFor][$in][0]=rider&filters[applicableFor][$in][1]=both&sort=displayOrder:asc');
      const reasons = res?.data ?? res ?? [];
      if (mountedRef.current) setCancelReasons(reasons);
    } catch (err) {
      console.error('[DeliveryTracking] failed to load cancellation reasons:', err);
      if (mountedRef.current) setCancelReasons([]);
    } finally {
      if (mountedRef.current) setCancelReasonsLoading(false);
    }
  };

  const handleCancelConfirmNo = () => setShowCancelConfirm(false);

  const handleCancelWithReason = async () => {
    const isOther = selectedCancelReason === '__other__';
    const reason  = isOther
      ? (cancelOtherText.trim() || 'Other')
      : (cancelReasons.find(r => String(r.id) === String(selectedCancelReason))?.reason || selectedCancelReason);
    if (!reason) return;
    setCancelling(true);
    try {
      await apiClient.post(`/deliveries/${id}/cancel`, { reason });
      clearInterval(pollRef.current);
      router.replace('/deliveries');
    } catch (e) { console.error(e); setCancelling(false); }
  };

  const handleCancelWithoutReason = async () => {
    setCancelling(true);
    try {
      await apiClient.post(`/deliveries/${id}/cancel`, { reason: DEFAULT_CANCEL_REASON });
      clearInterval(pollRef.current);
      router.replace('/deliveries');
    } catch (e) { console.error(e); setCancelling(false); }
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

  const curStep    = STATUS_STEPS.find(s => s.status === rideStatus) ?? STATUS_STEPS[0];
  const bannerColor = rideStatus === 'accepted' ? '#10B981' : AMBER;
  const bannerBg    = rideStatus === 'accepted'
    ? 'linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(5,150,105,0.06) 100%)'
    : 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(217,119,6,0.06) 100%)';

  if (loading || !delivery) {
    return <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: AMBER }} /></Box>;
  }

  const deliverer = delivery.deliverer;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <MapIframe
          center={delivererLoc ?? normalizeCoords(delivery.pickupLocation) ?? { lat: -15.4167, lng: 28.2833 }}
          zoom={15} height="100%" markers={markers}
          pickupLocation={routePickup} dropoffLocation={routeDropoff} showRoute={routeReady}
          onMapLoad={(c) => {
            mapControlsRef.current = c;
            c.configureDriverMarker({ bg: '#0F172A', label: '🚚', size: 44 });
          }}
        />
      </Box>

      {/* Bottom sheet */}
      <Paper elevation={0} sx={{
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: showFullSheet ? '70vh' : '42vh',
        minHeight: '42vh',
        transition: 'max-height 0.35s ease',
        overflowY: 'auto', ...hideScrollbar,
        background: isDark ? 'linear-gradient(160deg,#1E293B 0%,#0F172A 100%)' : '#FFFFFF',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
      }}>
        {/* Handle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5, cursor: 'pointer' }}
          onClick={() => setShowFullSheet(p => !p)}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>

        <Box sx={{ px: 2.5, pb: 3 }}>
          {/* Status progress */}
          <Box sx={{ mb: 2 }}><ProgressStepper rideStatus={rideStatus} /></Box>

          {/* ETA / status banner */}
          <AnimatePresence mode="wait">
            <motion.div key={rideStatus} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Box sx={{ p: 2, borderRadius: 3, mb: 2, background: bannerBg, border: `1px solid ${alpha(bannerColor,0.25)}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontSize: 18 }}>{curStep.emoji}</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{curStep.label}</Typography>
                  {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard') && eta != null && (
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                      {distance != null && <Typography variant="caption" color="text.secondary" fontWeight={600}>{distance.toFixed(1)} km</Typography>}
                      <Typography variant="caption" fontWeight={800} sx={{ color: bannerColor }}>{fmtETA(eta)}</Typography>
                    </Box>
                  )}
                </Box>
                {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard') && eta != null && (
                  <LinearProgress variant="indeterminate" sx={{ borderRadius: 2, height: 4, bgcolor: alpha(bannerColor,0.15), '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg,${bannerColor},${alpha(bannerColor,0.7)})` } }} />
                )}
              </Box>
            </motion.div>
          </AnimatePresence>

          {/* Deliverer card */}
          {deliverer && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(isDark?'#fff':'#000',0.08)}`, bgcolor: isDark ? alpha('#fff',0.04) : alpha('#000',0.02) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 50, height: 50, border: `2px solid ${alpha(AMBER,0.5)}` }}>
                  {deliverer.firstName?.[0]}{deliverer.lastName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{deliverer.firstName} {deliverer.lastName}</Typography>
                  {deliverer.driverProfile?.averageRating > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontSize: 13, color: AMBER }}>★</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: AMBER }}>{deliverer.driverProfile.averageRating.toFixed(1)}</Typography>
                      <Typography variant="caption" color="text.disabled">· {deliverer.driverProfile.completedDeliveries ?? 0} deliveries</Typography>
                    </Box>
                  )}
                  {delivery.vehicle && (
                    <Typography variant="caption" color="text.secondary">
                      {delivery.vehicle.make} {delivery.vehicle.model} · {delivery.vehicle.numberPlate}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => window.location.href = `tel:${deliverer.phoneNumber}`}
                    sx={{ bgcolor: 'success.main', color: '#fff', width: 38, height: 38, '&:hover': { bgcolor: 'success.dark' } }}>
                    <PhoneIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                  <IconButton onClick={() => window.open(`https://wa.me/${deliverer.phoneNumber?.replace(/\D/g,'')}`, '_blank')}
                    sx={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', width: 38, height: 38 }}>
                    <MessageIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Expanded details */}
          {showFullSheet && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Route summary */}
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(isDark?'#fff':'#000',0.08)}` }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', mt: 0.6, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pickup</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {delivery.pickupLocation?.address}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: '#EF4444', mt: 0.6, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Dropoff</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {delivery.dropoffLocation?.address}
                    </Typography>
                  </Box>
                </Box>

                {/* Package details */}
                {delivery.package && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha(isDark?'#fff':'#000',0.07)}`, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <PackageIcon sx={{ fontSize: 15, color: AMBER }} />
                    <Typography variant="caption" textTransform="capitalize" fontWeight={600}>
                      {delivery.package.packageType ?? 'Package'}
                    </Typography>
                    {delivery.package.isFragile && <Chip label="Fragile" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem' }} />}
                    {delivery.package.recipientName && (
                      <Typography variant="caption" color="text.secondary">→ {delivery.package.recipientName}</Typography>
                    )}
                  </Box>
                )}
              </Paper>

              {/* Fare */}
              {delivery.totalFare != null && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(AMBER,0.2)}`, background: alpha(AMBER,isDark?0.08:0.04) }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={600}>Total Fare</Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ color: AMBER }}>{formatCurrency(delivery.totalFare)}</Typography>
                  </Box>
                  <Chip label={delivery.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'} size="small"
                    sx={{ mt: 0.75, fontWeight: 700, bgcolor: alpha(AMBER,isDark?0.15:0.1), color: AMBER, border: `1px solid ${alpha(AMBER,0.3)}` }} />
                </Paper>
              )}
            </motion.div>
          )}

          {/* Navigate to dropoff */}
          <Button fullWidth variant="outlined" size="small" startIcon={<NavIcon />}
            onClick={() => {
              const dest = normalizeCoords(delivery.dropoffLocation);
              if (dest) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
            }}
            sx={{ height: 44, borderRadius: 3, fontWeight: 600, borderColor: alpha(AMBER,0.5), color: AMBER, mb: ['accepted','arrived'].includes(rideStatus) ? 1.5 : 0 }}>
            Open Dropoff in Google Maps
          </Button>

          {/* Cancel button — only available before package is picked up */}
          {['accepted', 'arrived'].includes(rideStatus) && (
            <Button
              fullWidth variant="outlined" color="error" size="small"
              disabled={cancelling}
              onClick={handleCancelPress}
              sx={{ height: 44, borderRadius: 3, fontWeight: 600, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}
            >
              Cancel Delivery
            </Button>
          )}
        </Box>
      </Paper>

      {/* ── STEP 1: Cancel confirmation ───────────────────────────────────── */}
      <Dialog
        open={showCancelConfirm}
        onClose={handleCancelConfirmNo}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 360, mx: 2, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width:40, height:40, borderRadius:2, flexShrink:0, background:'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(239,68,68,0.35)' }}>
              <WarningIcon sx={{ fontSize:22, color:'#fff' }} />
            </Box>
            Cancel Delivery?
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            Are you sure you want to cancel this delivery? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={handleCancelConfirmNo} variant="outlined" sx={{ flex:1, borderRadius:2.5, fontWeight:600, height:44 }}>No</Button>
          <Button onClick={handleCancelConfirmYes} variant="contained" color="error" sx={{ flex:1, borderRadius:2.5, fontWeight:700, height:44 }}>Yes</Button>
        </DialogActions>
      </Dialog>

      {/* ── STEP 2: Cancel reason selection ──────────────────────────────── */}
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
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} sx={{ color: AMBER }} /></Box>
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
          <Button fullWidth variant="contained" color="error" size="large" disabled={!canSubmitCancel || cancelling} startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />} onClick={handleCancelWithReason} sx={{ height:50, borderRadius:2.5, fontWeight:700 }}>
            {cancelling ? 'Cancelling…' : 'Cancel Delivery'}
          </Button>
          <Divider sx={{ width:'100%', my:0.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ px:1 }}>or</Typography>
          </Divider>
          <Button fullWidth variant="text" size="medium" disabled={cancelling} onClick={handleCancelWithoutReason} sx={{ height:44, borderRadius:2.5, fontWeight:600, color:'text.secondary', textTransform:'none', fontSize:'0.875rem', '&:hover':{ bgcolor:'action.hover' } }}>
            Cancel without reason
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}