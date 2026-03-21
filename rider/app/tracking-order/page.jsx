// 'use client';
// // PATH: app/tracking-order/page.jsx

// import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import { useSearchParams } from 'next/navigation';
// import {
//   Box, Paper, Typography, Avatar, IconButton, Button, Chip,
//   LinearProgress, CircularProgress,
// } from '@mui/material';
// import { alpha, useTheme } from '@mui/material/styles';
// import {
//   Phone as PhoneIcon, Message as MessageIcon,
//   Star as StarIcon,
//   Inventory as PackageIcon,
//   Navigation as NavIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import MapIframe from '@/components/Map/MapIframe';
// import { apiClient } from '@/lib/api/client';
// import { formatCurrency } from '@/Functions';

// const AMBER = '#F59E0B';
// const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

// // ── Helpers ───────────────────────────────────────────────────────────────────
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

// // ── Public API calls (no auth token needed) ───────────────────────────────────
// const getDeliveryByCode = async (delicode) => {
//   const res = await apiClient.get(`/deliveries/ridecode/${delicode}`);
//   return res?.data ?? res;
// };

// // Single endpoint that returns delivery status + deliverer location + ETA
// const trackDeliveryById = async (deliveryId) => {
//   const res = await apiClient.get(`/deliveries/${deliveryId}/track`);
//   return res ?? null;
// };

// // ── Status config ─────────────────────────────────────────────────────────────
// const STATUS_STEPS = [
//   { status: 'accepted',          label: 'Deliverer En Route', emoji: '🚗' },
//   { status: 'arrived',           label: 'Arrived at Pickup',  emoji: '📍' },
//   { status: 'passenger_onboard', label: 'Package In Transit', emoji: '📦' },
//   { status: 'awaiting_payment',  label: 'Awaiting Payment',   emoji: '💳' },
//   { status: 'completed',         label: 'Delivered!',         emoji: '✅' },
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
//               : alpha(isDark ? '#fff' : '#000', isDark ? 0.12 : 0.08),
//             border: `2px solid ${i === cur ? AMBER : 'transparent'}`,
//             fontSize: '0.75rem', fontWeight: 700,
//             color: i <= cur ? '#fff' : 'text.disabled',
//             transition: 'all 0.3s ease',
//             boxShadow: i === cur ? `0 0 0 4px ${alpha(AMBER, 0.25)}` : 'none',
//           }}>
//             {i < cur ? '✓' : step.emoji}
//           </Box>
//           {i < 3 && (
//             <Box sx={{
//               flex: 1, height: 3, borderRadius: 1.5, mx: 0.5,
//               background: i < cur
//                 ? `linear-gradient(90deg,${AMBER},#D97706)`
//                 : alpha(isDark ? '#fff' : '#000', isDark ? 0.1 : 0.07),
//               transition: 'background 0.3s ease',
//             }} />
//           )}
//         </Box>
//       ))}
//     </Box>
//   );
// }

// // ── Page ──────────────────────────────────────────────────────────────────────
// function DeliveryCodeEntry() {
//   const [code,  setCode]  = useState('');
//   const [error, setError] = useState(false);
//   const theme  = useTheme();
//   const isDark = theme.palette.mode === 'dark';

//   const handleSubmit = () => {
//     const trimmed = code.trim();
//     if (!trimmed) { setError(true); return; }
//     window.location.href = `/tracking-order?delicode=${encodeURIComponent(trimmed)}`;
//   };

//   const handleKey = (e) => {
//     if (e.key === 'Enter') handleSubmit();
//   };

//   return (
//     <Box sx={{
//       minHeight: '100vh',
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       justifyContent: 'center',
//       p: 3,
//       bgcolor: 'background.default',
//     }}>
//       <motion.div
//         initial={{ opacity: 0, y: 24 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ type: 'spring', stiffness: 260, damping: 24 }}
//         style={{ width: '100%', maxWidth: 400 }}
//       >
//         {/* Icon */}
//         <Box sx={{ textAlign: 'center', mb: 3 }}>
//           <motion.div
//             animate={{ y: [0, -8, 0] }}
//             transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
//             style={{ display: 'inline-block' }}
//           >
//             <Typography sx={{ fontSize: 64, lineHeight: 1 }}>📦</Typography>
//           </motion.div>
//           <Typography variant="h5" fontWeight={800} sx={{ mt: 1.5, mb: 0.5 }}>
//             Track Your Delivery
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Enter your delivery code to see live status and ETA
//           </Typography>
//         </Box>

//         {/* Card */}
//         <Paper elevation={isDark ? 0 : 4} sx={{
//           p: 3, borderRadius: 4,
//           border: `1px solid ${alpha(AMBER, isDark ? 0.2 : 0.12)}`,
//           background: isDark
//             ? `linear-gradient(145deg, ${alpha(AMBER, 0.07)} 0%, transparent 100%)`
//             : '#fff',
//           boxShadow: isDark ? 'none' : `0 8px 32px ${alpha(AMBER, 0.12)}`,
//         }}>
//           <Typography variant="caption" sx={{
//             display: 'block', mb: 1,
//             fontWeight: 700, letterSpacing: 0.6,
//             textTransform: 'uppercase', color: 'text.disabled', fontSize: 10,
//           }}>
//             Delivery Code
//           </Typography>

//           {/* Input */}
//           <Box sx={{
//             display: 'flex', alignItems: 'center',
//             borderRadius: 2.5,
//             border: `2px solid ${error ? '#EF4444' : alpha(AMBER, code ? 0.55 : 0.25)}`,
//             transition: 'border-color 0.2s',
//             overflow: 'hidden',
//             bgcolor: isDark ? alpha('#fff', 0.04) : alpha(AMBER, 0.03),
//             '&:focus-within': {
//               borderColor: error ? '#EF4444' : AMBER,
//               boxShadow: `0 0 0 3px ${alpha(error ? '#EF4444' : AMBER, 0.15)}`,
//             },
//           }}>
//             <Typography sx={{ pl: 1.75, fontSize: 18, userSelect: 'none' }}>🔍</Typography>
//             <input
//               autoFocus
//               value={code}
//               onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(false); }}
//               onKeyDown={handleKey}
//               placeholder="e.g. DEL-Z9K23P"
//               style={{
//                 flex: 1,
//                 border: 'none',
//                 outline: 'none',
//                 background: 'transparent',
//                 padding: '14px 12px',
//                 fontSize: 15,
//                 fontWeight: 700,
//                 fontFamily: 'monospace',
//                 letterSpacing: 1.5,
//                 color: isDark ? '#fff' : '#111',
//               }}
//             />
//             {code && (
//               <Box
//                 onClick={() => { setCode(''); setError(false); }}
//                 sx={{ pr: 1.5, cursor: 'pointer', color: 'text.disabled', fontSize: 18, lineHeight: 1, userSelect: 'none' }}
//               >
//                 ×
//               </Box>
//             )}
//           </Box>

//           {/* Error message */}
//           <AnimatePresence>
//             {error && (
//               <motion.div
//                 initial={{ opacity: 0, y: -4 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -4 }}
//                 transition={{ duration: 0.18 }}
//               >
//                 <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600, mt: 0.75, display: 'block' }}>
//                   Please enter a delivery code first.
//                 </Typography>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Submit button */}
//           <motion.button
//             whileTap={{ scale: 0.97 }}
//             onClick={handleSubmit}
//             style={{
//               width: '100%',
//               marginTop: 16,
//               height: 52,
//               borderRadius: 12,
//               border: 'none',
//               cursor: 'pointer',
//               background: `linear-gradient(135deg, ${AMBER} 0%, #D97706 100%)`,
//               color: '#fff',
//               fontSize: 15,
//               fontWeight: 800,
//               letterSpacing: 0.3,
//               fontFamily: 'inherit',
//               boxShadow: `0 4px 20px ${alpha(AMBER, 0.4)}`,
//               transition: 'box-shadow 0.2s',
//             }}
//           >
//             Track Package →
//           </motion.button>
//         </Paper>

//         <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
//           Your code was shared with you by the sender or delivery confirmation message.
//         </Typography>
//       </motion.div>
//     </Box>
//   );
// }
// export default function PublicTrackingPage() {
//   const searchParams = useSearchParams();
//   const delicode     = searchParams.get('delicode');
//   const theme        = useTheme();
//   const isDark       = theme.palette.mode === 'dark';

//   const [delivery,      setDelivery]      = useState(null);
//   const [delivererLoc,  setDelivererLoc]  = useState(null);
//   const [eta,           setEta]           = useState(null);
//   const [distance,      setDistance]      = useState(null);
//   const [loading,       setLoading]       = useState(true);
//   const [notFound,      setNotFound]      = useState(false);
//   const [showFullSheet, setShowFullSheet] = useState(false);

//   const [routePickup,  setRoutePickup]  = useState(null);
//   const [routeDropoff, setRouteDropoff] = useState(null);
//   const [routeReady,   setRouteReady]   = useState(false);
//   const routeStatusRef = useRef(null);

//   const mapControlsRef = useRef(null);
//   const pollRef        = useRef(null);
//   const locPollRef     = useRef(null);
//   const mountedRef     = useRef(true);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//       clearInterval(pollRef.current);
//       clearInterval(locPollRef.current);
//     };
//   }, []);

//   // ── Load delivery by rideCode ─────────────────────────────────────────────
//   const load = useCallback(async () => {
//     if (!delicode) { setLoading(false); setNotFound(true); return; }
//     try {
//       const data = await getDeliveryByCode(delicode);
//       if (data && mountedRef.current) setDelivery(data);
//       else setNotFound(true);
//     } catch {
//       if (mountedRef.current) setNotFound(true);
//     } finally {
//       if (mountedRef.current) setLoading(false);
//     }
//   }, [delicode]);

//   useEffect(() => { load(); }, [load]);

//   // ── Status polling (public, no auth) ─────────────────────────────────────
//   const rideStatus = delivery?.rideStatus;

// // ── Remove these two separate effects entirely ────────────────────────────────
// // (the status polling useEffect and the location polling useEffect)
// // Replace with this single unified one:

// useEffect(() => {
//   if (!delivery?.id) return;

//   const poll = async () => {
//     if (!mountedRef.current) return;
//     try {
//       const res = await trackDeliveryById(delivery.id);
//       if (!res || !mountedRef.current) return;

//       const { delivery: d, deliverer, tracking } = res;

//       // ── Update delivery status ────────────────────────────────────────
//       if (d) {
//         setDelivery(prev => prev ? { ...prev, ...d } : d);
//       }

//       // ── Update deliverer location ─────────────────────────────────────
//       const rawLoc = deliverer?.currentLocation;
//       const loc    = normalizeCoords(rawLoc);

//       if (loc) {
//         setDelivererLoc(loc);
//         mapControlsRef.current?.updateDriverLocation(loc);
//       }

//       // ── Update ETA and distance from backend calculation ──────────────
//       if (tracking?.eta) {
//         const mins = parseInt(tracking.eta);
//         if (!isNaN(mins)) setEta(mins);
//       }
//       if (tracking?.distance) {
//         const km = parseFloat(tracking.distance);
//         if (!isNaN(km)) setDistance(km);
//       }

//       // ── Update route lines on status change ───────────────────────────
//       const status = d?.rideStatus ?? delivery.rideStatus;

//       if (loc && status === 'accepted' && routeStatusRef.current !== 'accepted') {
//         routeStatusRef.current = 'accepted';
//         setRoutePickup(loc);
//         setRouteDropoff(normalizeCoords(d?.pickupLocation ?? delivery.pickupLocation));
//         setRouteReady(true);
//       }
//       if (loc && status === 'passenger_onboard' && routeStatusRef.current !== 'passenger_onboard') {
//         routeStatusRef.current = 'passenger_onboard';
//         setRoutePickup(loc);
//         setRouteDropoff(normalizeCoords(d?.dropoffLocation ?? delivery.dropoffLocation));
//         setRouteReady(true);
//       }

//     } catch {}
//   };

//   // Poll immediately then every 8 seconds
//   poll();
//   pollRef.current = setInterval(poll, 8000);
//   return () => clearInterval(pollRef.current);

//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [delivery?.id]);
//   const markers    = useMemo(() => [], []);
//   const curStep    = STATUS_STEPS.find(s => s.status === rideStatus) ?? STATUS_STEPS[0];
//   const bannerColor = rideStatus === 'accepted' ? '#10B981' : AMBER;
//   const bannerBg    = rideStatus === 'accepted'
//     ? 'linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(5,150,105,0.06) 100%)'
//     : 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(217,119,6,0.06) 100%)';

    
//   // ── No code supplied ──────────────────────────────────────────────────────
// //   if (!delicode && !loading) {
// //     return (
// //       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, p: 3 }}>
// //         <Typography sx={{ fontSize: 48 }}>📦</Typography>
// //         <Typography variant="h6" fontWeight={700} textAlign="center">No tracking code provided</Typography>
// //         <Typography variant="body2" color="text.secondary" textAlign="center">
// //           Use a link like <code>/tracking-order?delicode=DEL-XXXXX</code>
// //         </Typography>
// //       </Box>
// //     );
// //   }
// // ── No code supplied — show input ─────────────────────────────────────────
// if (!delicode && !loading) {
//   return <DeliveryCodeEntry />;
// }

//   // ── Loading ───────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
//         <CircularProgress sx={{ color: AMBER }} />
//         <Typography variant="body2" color="text.secondary">Loading your delivery…</Typography>
//       </Box>
//     );
//   }

//   // ── Not found ─────────────────────────────────────────────────────────────
//   if (notFound || !delivery) {
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, p: 3 }}>
//         <Typography sx={{ fontSize: 48 }}>🔍</Typography>
//         <Typography variant="h6" fontWeight={700} textAlign="center">Delivery not found</Typography>
//         <Typography variant="body2" color="text.secondary" textAlign="center">
//           The tracking code <strong>{delicode}</strong> did not match any delivery.
//         </Typography>
//       </Box>
//     );
//   }

//   // ── Completed ─────────────────────────────────────────────────────────────
//   if (rideStatus === 'completed') {
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, p: 3, bgcolor: 'background.default' }}>
//         <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
//           <Box sx={{ textAlign: 'center' }}>
//             <Typography sx={{ fontSize: 64, mb: 1 }}>✅</Typography>
//             <Typography variant="h5" fontWeight={800} sx={{ mb: 0.75 }}>Package Delivered!</Typography>
//             <Typography variant="body2" color="text.secondary">
//               Your delivery <strong>{delicode}</strong> has been completed successfully.
//             </Typography>
//             {delivery.totalFare != null && (
//               <Chip label={`Total: ${formatCurrency(delivery.totalFare)}`} size="small"
//                 sx={{ mt: 2, fontWeight: 700, bgcolor: alpha(AMBER, 0.12), color: AMBER, border: `1px solid ${alpha(AMBER, 0.3)}` }} />
//             )}
//           </Box>
//         </motion.div>
//       </Box>
//     );
//   }

//   const deliverer = delivery.deliverer;

//   return (
//     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

//       {/* Map */}
//       <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
//         <MapIframe
//           center={delivererLoc ?? normalizeCoords(delivery.pickupLocation) ?? { lat: -15.4167, lng: 28.2833 }}
//           zoom={15}
//           height="100%"
//           markers={markers}
//           pickupLocation={routePickup}
//           dropoffLocation={routeDropoff}
//           showRoute={routeReady}
//           onMapLoad={(c) => { mapControlsRef.current = c; }}
//         />

//         {/* Tracking code badge — top of map */}
//         <Box sx={{
//           position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
//           zIndex: 10, pointerEvents: 'none',
//         }}>
//           <Box sx={{
//             px: 2, py: 0.75, borderRadius: 99,
//             background: alpha('#000', 0.55),
//             backdropFilter: 'blur(12px)',
//             border: `1px solid ${alpha('#fff', 0.18)}`,
//           }}>
//             <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1, fontFamily: 'monospace' }}>
//               📦 {delicode}
//             </Typography>
//           </Box>
//         </Box>
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

//           {/* Progress stepper */}
//           <Box sx={{ mb: 2 }}>
//             <ProgressStepper rideStatus={rideStatus} />
//           </Box>

//           {/* ETA / status banner */}
//           <AnimatePresence mode="wait">
//             <motion.div key={rideStatus} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
//               <Box sx={{ p: 2, borderRadius: 3, mb: 2, background: bannerBg, border: `1px solid ${alpha(bannerColor, 0.25)}` }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
//                   <Typography sx={{ fontSize: 18 }}>{curStep.emoji}</Typography>
//                   <Typography variant="subtitle2" fontWeight={700}>{curStep.label}</Typography>
//                   {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard') && eta != null && (
//                     <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
//                       {distance != null && (
//                         <Typography variant="caption" color="text.secondary" fontWeight={600}>
//                           {distance.toFixed(1)} km
//                         </Typography>
//                       )}
//                       <Typography variant="caption" fontWeight={800} sx={{ color: bannerColor }}>
//                         {fmtETA(eta)}
//                       </Typography>
//                     </Box>
//                   )}
//                 </Box>
//                 {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard') && eta != null && (
//                   <LinearProgress variant="indeterminate" sx={{
//                     borderRadius: 2, height: 4,
//                     bgcolor: alpha(bannerColor, 0.15),
//                     '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg,${bannerColor},${alpha(bannerColor, 0.7)})` },
//                   }} />
//                 )}
//               </Box>
//             </motion.div>
//           </AnimatePresence>

//           {/* Deliverer card */}
//           {deliverer && (
//             <Paper elevation={0} sx={{
//               p: 2, borderRadius: 3, mb: 2,
//               border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}`,
//               bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.02),
//             }}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                 <Avatar sx={{ width: 50, height: 50, border: `2px solid ${alpha(AMBER, 0.5)}` }}>
//                   {deliverer.firstName?.[0]}{deliverer.lastName?.[0]}
//                 </Avatar>
//                 <Box sx={{ flex: 1 }}>
//                   <Typography variant="subtitle1" fontWeight={700}>
//                     {deliverer.firstName} {deliverer.lastName}
//                   </Typography>
//                   {deliverer.driverProfile?.averageRating > 0 && (
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                       <Typography sx={{ fontSize: 13, color: AMBER }}>★</Typography>
//                       <Typography variant="caption" fontWeight={700} sx={{ color: AMBER }}>
//                         {deliverer.driverProfile.averageRating.toFixed(1)}
//                       </Typography>
//                       <Typography variant="caption" color="text.disabled">
//                         · {deliverer.driverProfile.completedDeliveries ?? 0} deliveries
//                       </Typography>
//                     </Box>
//                   )}
//                   {delivery.vehicle && (
//                     <Typography variant="caption" color="text.secondary">
//                       {delivery.vehicle.make} {delivery.vehicle.model} · {delivery.vehicle.numberPlate}
//                     </Typography>
//                   )}
//                 </Box>
//                 {/* Contact buttons — available even for unauthenticated recipients */}
//                 <Box sx={{ display: 'flex', gap: 1 }}>
//                   <IconButton
//                     onClick={() => window.location.href = `tel:${deliverer.phoneNumber}`}
//                     sx={{ bgcolor: 'success.main', color: '#fff', width: 38, height: 38, '&:hover': { bgcolor: 'success.dark' } }}
//                   >
//                     <PhoneIcon sx={{ fontSize: 17 }} />
//                   </IconButton>
//                   <IconButton
//                     onClick={() => window.open(`https://wa.me/${deliverer.phoneNumber?.replace(/\D/g, '')}`, '_blank')}
//                     sx={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', width: 38, height: 38 }}
//                   >
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
//               <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}` }}>
//                 <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
//                   <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', mt: 0.6, flexShrink: 0 }} />
//                   <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                       Pickup
//                     </Typography>
//                     <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                       {delivery.pickupLocation?.address}
//                     </Typography>
//                   </Box>
//                 </Box>
//                 <Box sx={{ display: 'flex', gap: 1.5 }}>
//                   <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: '#EF4444', mt: 0.6, flexShrink: 0 }} />
//                   <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                       Dropoff
//                     </Typography>
//                     <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                       {delivery.dropoffLocation?.address}
//                     </Typography>
//                   </Box>
//                 </Box>

//                 {/* Package details */}
//                 {delivery.package && (
//                   <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.07)}`, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
//                     <PackageIcon sx={{ fontSize: 15, color: AMBER }} />
//                     <Typography variant="caption" textTransform="capitalize" fontWeight={600}>
//                       {delivery.package.packageType ?? 'Package'}
//                     </Typography>
//                     {delivery.package.isFragile && (
//                       <Chip label="Fragile" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem' }} />
//                     )}
//                     {delivery.package.recipientName && (
//                       <Typography variant="caption" color="text.secondary">
//                         → {delivery.package.recipientName}
//                       </Typography>
//                     )}
//                   </Box>
//                 )}
//               </Paper>

//               {/* Fare */}
//               {delivery.totalFare != null && (
//                 <Paper elevation={0} sx={{
//                   p: 2, borderRadius: 3, mb: 2,
//                   border: `1px solid ${alpha(AMBER, 0.2)}`,
//                   background: alpha(AMBER, isDark ? 0.08 : 0.04),
//                 }}>
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <Typography variant="body2" fontWeight={600}>Total Fare</Typography>
//                     <Typography variant="h6" fontWeight={800} sx={{ color: AMBER }}>
//                       {formatCurrency(delivery.totalFare)}
//                     </Typography>
//                   </Box>
//                   <Chip
//                     label={delivery.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}
//                     size="small"
//                     sx={{ mt: 0.75, fontWeight: 700, bgcolor: alpha(AMBER, isDark ? 0.15 : 0.1), color: AMBER, border: `1px solid ${alpha(AMBER, 0.3)}` }}
//                   />
//                 </Paper>
//               )}
//             </motion.div>
//           )}

//           {/* Navigate to dropoff */}
//           <Button
//             fullWidth variant="outlined" size="small" startIcon={<NavIcon />}
//             onClick={() => {
//               const dest = normalizeCoords(delivery.dropoffLocation);
//               if (dest) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
//             }}
//             sx={{ height: 44, borderRadius: 3, fontWeight: 600, borderColor: alpha(AMBER, 0.5), color: AMBER }}
//           >
//             Open Dropoff in Google Maps
//           </Button>
//         </Box>
//       </Paper>
//     </Box>
//   );
// }
'use client';
// PATH: app/tracking-order/page.jsx
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Paper, Typography, Avatar, IconButton, Button, Chip,
  LinearProgress, CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Phone as PhoneIcon, Message as MessageIcon,
  Inventory as PackageIcon,
  Navigation as NavIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import MapIframe from '@/components/Map/MapIframe';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@/Functions';

const AMBER = '#F59E0B';
const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

// ── Custom marker configs ─────────────────────────────────────────────────────
const PACKAGE_MARKER = { bg: '#92400E', label: '📦', size: 36 };
const TRUCK_MARKER   = { bg: '#0F172A', label: '🚚', size: 44 };

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Public API calls (no auth token needed) ───────────────────────────────────
const getDeliveryByCode = async (delicode) => {
  const res = await apiClient.get(`/deliveries/ridecode/${delicode}`);
  return res?.data ?? res;
};

const trackDeliveryById = async (deliveryId) => {
  const res = await apiClient.get(`/deliveries/${deliveryId}/track`);
  return res ?? null;
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { status: 'accepted',          label: 'Deliverer En Route', emoji: '🚗' },
  { status: 'arrived',           label: 'Arrived at Pickup',  emoji: '📍' },
  { status: 'passenger_onboard', label: 'Package In Transit', emoji: '📦' },
  { status: 'awaiting_payment',  label: 'Awaiting Payment',   emoji: '💳' },
  { status: 'completed',         label: 'Delivered!',         emoji: '✅' },
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
              : alpha(isDark ? '#fff' : '#000', isDark ? 0.12 : 0.08),
            border: `2px solid ${i === cur ? AMBER : 'transparent'}`,
            fontSize: '0.75rem', fontWeight: 700,
            color: i <= cur ? '#fff' : 'text.disabled',
            transition: 'all 0.3s ease',
            boxShadow: i === cur ? `0 0 0 4px ${alpha(AMBER, 0.25)}` : 'none',
          }}>
            {i < cur ? '✓' : step.emoji}
          </Box>
          {i < 3 && (
            <Box sx={{
              flex: 1, height: 3, borderRadius: 1.5, mx: 0.5,
              background: i < cur
                ? `linear-gradient(90deg,${AMBER},#D97706)`
                : alpha(isDark ? '#fff' : '#000', isDark ? 0.1 : 0.07),
              transition: 'background 0.3s ease',
            }} />
          )}
        </Box>
      ))}
    </Box>
  );
}

// ── Delivery code entry screen ────────────────────────────────────────────────
function DeliveryCodeEntry() {
  const [code,  setCode]  = useState('');
  const [error, setError] = useState(false);
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (!trimmed) { setError(true); return; }
    window.location.href = `/tracking-order?delicode=${encodeURIComponent(trimmed)}`;
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: 'background.default' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} style={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-block' }}>
            <Typography sx={{ fontSize: 64, lineHeight: 1 }}>📦</Typography>
          </motion.div>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 1.5, mb: 0.5 }}>Track Your Delivery</Typography>
          <Typography variant="body2" color="text.secondary">Enter your delivery code to see live status and ETA</Typography>
        </Box>

        <Paper elevation={isDark ? 0 : 4} sx={{
          p: 3, borderRadius: 4,
          border: `1px solid ${alpha(AMBER, isDark ? 0.2 : 0.12)}`,
          background: isDark ? `linear-gradient(145deg, ${alpha(AMBER, 0.07)} 0%, transparent 100%)` : '#fff',
          boxShadow: isDark ? 'none' : `0 8px 32px ${alpha(AMBER, 0.12)}`,
        }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'text.disabled', fontSize: 10 }}>
            Delivery Code
          </Typography>

          <Box sx={{
            display: 'flex', alignItems: 'center', borderRadius: 2.5,
            border: `2px solid ${error ? '#EF4444' : alpha(AMBER, code ? 0.55 : 0.25)}`,
            transition: 'border-color 0.2s', overflow: 'hidden',
            bgcolor: isDark ? alpha('#fff', 0.04) : alpha(AMBER, 0.03),
            '&:focus-within': { borderColor: error ? '#EF4444' : AMBER, boxShadow: `0 0 0 3px ${alpha(error ? '#EF4444' : AMBER, 0.15)}` },
          }}>
            <Typography sx={{ pl: 1.75, fontSize: 18, userSelect: 'none' }}>🔍</Typography>
            <input
              autoFocus
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. DEL-Z9K23P"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '14px 12px', fontSize: 15, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1.5, color: isDark ? '#fff' : '#111' }}
            />
            {code && (
              <Box onClick={() => { setCode(''); setError(false); }} sx={{ pr: 1.5, cursor: 'pointer', color: 'text.disabled', fontSize: 18, lineHeight: 1, userSelect: 'none' }}>×</Box>
            )}
          </Box>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600, mt: 0.75, display: 'block' }}>Please enter a delivery code first.</Typography>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            style={{ width: '100%', marginTop: 16, height: 52, borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${AMBER} 0%, #D97706 100%)`, color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: 0.3, fontFamily: 'inherit', boxShadow: `0 4px 20px ${alpha(AMBER, 0.4)}` }}
          >
            Track Package →
          </motion.button>
        </Paper>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Your code was shared with you by the sender or delivery confirmation message.
        </Typography>
      </motion.div>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicTrackingPage() {
  const searchParams = useSearchParams();
  const delicode     = searchParams.get('delicode');
  const theme        = useTheme();
  const isDark       = theme.palette.mode === 'dark';

  const [delivery,      setDelivery]      = useState(null);
  const [delivererLoc,  setDelivererLoc]  = useState(null);
  const [eta,           setEta]           = useState(null);
  const [distance,      setDistance]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [notFound,      setNotFound]      = useState(false);
  const [showFullSheet, setShowFullSheet] = useState(false);

  const [routePickup,  setRoutePickup]  = useState(null);
  const [routeDropoff, setRouteDropoff] = useState(null);
  const [routeReady,   setRouteReady]   = useState(false);
  const routeStatusRef = useRef(null);

  const mapControlsRef = useRef(null);
  const pollRef        = useRef(null);
  const mountedRef     = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
    };
  }, []);

  // ── Load delivery by rideCode ─────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!delicode) { setLoading(false); setNotFound(true); return; }
    try {
      const data = await getDeliveryByCode(delicode);
      if (data && mountedRef.current) setDelivery(data);
      else setNotFound(true);
    } catch {
      if (mountedRef.current) setNotFound(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [delicode]);

  useEffect(() => { load(); }, [load]);

  const rideStatus = delivery?.rideStatus;

  // ── Reset route state when status changes ─────────────────────────────────
  useEffect(() => {
    routeStatusRef.current = null;
    setRouteReady(false);
    setRoutePickup(null);
    setRouteDropoff(null);
  }, [rideStatus]);

  // ── Unified polling — status + location + route ───────────────────────────
  useEffect(() => {
    if (!delivery?.id) return;

    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await trackDeliveryById(delivery.id);
        if (!res || !mountedRef.current) return;

        const { delivery: d, deliverer, tracking } = res;

        // ── Update delivery status ──────────────────────────────────────────
        if (d) {
          setDelivery(prev => prev ? { ...prev, ...d } : d);
        }

        // ── Update deliverer location ───────────────────────────────────────
        const rawLoc = deliverer?.currentLocation;
        const loc    = normalizeCoords(rawLoc);

        if (loc) {
          setDelivererLoc(loc);
          // Smooth movement — no re-render, no ghost pins
          mapControlsRef.current?.updateDriverLocation(loc);
        }

        // ── ETA / distance from backend ─────────────────────────────────────
        if (tracking?.eta) {
          const mins = parseInt(tracking.eta);
          if (!isNaN(mins)) setEta(mins);
        }
        if (tracking?.distance) {
          const km = parseFloat(tracking.distance);
          if (!isNaN(km)) setDistance(km);
        }

        const status = d?.rideStatus ?? rideStatus;

        // ── ACCEPTED: route driver→pickup, updates origin each poll ──────────
        if (loc && status === 'accepted') {
          const pickup = normalizeCoords(d?.pickupLocation ?? delivery.pickupLocation);
          if (pickup) {
            setRoutePickup(loc);     // driver's current position — shifts each poll
            setRouteDropoff(pickup); // fixed: the pickup location
            setRouteReady(true);
            routeStatusRef.current = 'accepted';
          }
        }

        // ── PASSENGER_ONBOARD: route pickup→dropoff, drawn once ───────────────
        if (status === 'passenger_onboard' && routeStatusRef.current !== 'passenger_onboard') {
          routeStatusRef.current = 'passenger_onboard';
          const pickup  = normalizeCoords(d?.pickupLocation  ?? delivery.pickupLocation);
          const dropoff = normalizeCoords(d?.dropoffLocation ?? delivery.dropoffLocation);
          if (pickup && dropoff) {
            setRoutePickup(pickup);
            setRouteDropoff(dropoff);
            setRouteReady(true);
          }
        }

      } catch {}
    };

    poll();
    pollRef.current = setInterval(poll, 8000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.id, rideStatus]);

  // ── Markers ───────────────────────────────────────────────────────────────
  // Driver is moved via updateDriverLocation (persistent marker, no ghost trail).
  // Only static pins (package pickup, dropoff flag) go in the markers array.
  const markers = useMemo(() => {
    if (!delivery) return [];

    const actualPickup  = normalizeCoords(delivery.pickupLocation);
    const actualDropoff = normalizeCoords(delivery.dropoffLocation);

    if (rideStatus === 'accepted') {
      // Route: driver → pickup
      // Show package icon at actual pickup; driver is the persistent truck marker
      const result = [];
      if (actualPickup) result.push({ id: 'pickup', position: actualPickup, type: 'pickup', custom: PACKAGE_MARKER });
      return result;
    }

    if (rideStatus === 'passenger_onboard') {
      // Route: pickup → dropoff
      // Show package icon at pickup, default flag at dropoff; driver is persistent truck
      const result = [];
      if (actualPickup)  result.push({ id: 'pickup',  position: actualPickup,  type: 'pickup',  custom: PACKAGE_MARKER });
      if (actualDropoff) result.push({ id: 'dropoff', position: actualDropoff, type: 'dropoff', custom: null });
      return result;
    }

    // Other statuses — show both endpoints
    const result = [];
    if (actualPickup)  result.push({ id: 'pickup',  position: actualPickup,  type: 'pickup',  custom: PACKAGE_MARKER });
    if (actualDropoff) result.push({ id: 'dropoff', position: actualDropoff, type: 'dropoff', custom: null });
    return result;
  }, [rideStatus, delivery]);

  const curStep     = STATUS_STEPS.find(s => s.status === rideStatus) ?? STATUS_STEPS[0];
  const bannerColor = rideStatus === 'accepted' ? '#10B981' : AMBER;
  const bannerBg    = rideStatus === 'accepted'
    ? 'linear-gradient(135deg,rgba(16,185,129,0.12) 0%,rgba(5,150,105,0.06) 100%)'
    : 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(217,119,6,0.06) 100%)';

  // ── No code supplied ──────────────────────────────────────────────────────
  if (!delicode && !loading) return <DeliveryCodeEntry />;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: AMBER }} />
        <Typography variant="body2" color="text.secondary">Loading your delivery…</Typography>
      </Box>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !delivery) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, p: 3 }}>
        <Typography sx={{ fontSize: 48 }}>🔍</Typography>
        <Typography variant="h6" fontWeight={700} textAlign="center">Delivery not found</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          The tracking code <strong>{delicode}</strong> did not match any delivery.
        </Typography>
      </Box>
    );
  }

  // ── Completed ─────────────────────────────────────────────────────────────
  if (rideStatus === 'completed') {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, p: 3, bgcolor: 'background.default' }}>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 64, mb: 1 }}>✅</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.75 }}>Package Delivered!</Typography>
            <Typography variant="body2" color="text.secondary">
              Your delivery <strong>{delicode}</strong> has been completed successfully.
            </Typography>
            {delivery.totalFare != null && (
              <Chip label={`Total: ${formatCurrency(delivery.totalFare)}`} size="small"
                sx={{ mt: 2, fontWeight: 700, bgcolor: alpha(AMBER, 0.12), color: AMBER, border: `1px solid ${alpha(AMBER, 0.3)}` }} />
            )}
          </Box>
        </motion.div>
      </Box>
    );
  }

  const deliverer = delivery.deliverer;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <MapIframe
          center={delivererLoc ?? normalizeCoords(delivery.pickupLocation) ?? { lat: -15.4167, lng: 28.2833 }}
          zoom={15}
          height="100%"
          markers={markers}
          pickupLocation={routePickup}
          dropoffLocation={routeDropoff}
          showRoute={routeReady}
          onMapLoad={(c) => {
            mapControlsRef.current = c;
            // Configure persistent driver marker as truck — done once, no re-renders
            c.configureDriverMarker(TRUCK_MARKER);
          }}
        />

        {/* Tracking code badge */}
        <Box sx={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
          <Box sx={{ px: 2, py: 0.75, borderRadius: 99, background: alpha('#000', 0.55), backdropFilter: 'blur(12px)', border: `1px solid ${alpha('#fff', 0.18)}` }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1, fontFamily: 'monospace' }}>
              📦 {delicode}
            </Typography>
          </Box>
        </Box>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5, cursor: 'pointer' }} onClick={() => setShowFullSheet(p => !p)}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>

        <Box sx={{ px: 2.5, pb: 3 }}>

          {/* Progress stepper */}
          <Box sx={{ mb: 2 }}><ProgressStepper rideStatus={rideStatus} /></Box>

          {/* ETA / status banner */}
          <AnimatePresence mode="wait">
            <motion.div key={rideStatus} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Box sx={{ p: 2, borderRadius: 3, mb: 2, background: bannerBg, border: `1px solid ${alpha(bannerColor, 0.25)}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontSize: 18 }}>{curStep.emoji}</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{curStep.label}</Typography>
                  {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard') && eta != null && (
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                      {distance != null && (
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {typeof distance === 'number' ? distance.toFixed(1) : distance} km
                        </Typography>
                      )}
                      <Typography variant="caption" fontWeight={800} sx={{ color: bannerColor }}>{fmtETA(eta)}</Typography>
                    </Box>
                  )}
                </Box>
                {(rideStatus === 'accepted' || rideStatus === 'passenger_onboard') && eta != null && (
                  <LinearProgress variant="indeterminate" sx={{
                    borderRadius: 2, height: 4,
                    bgcolor: alpha(bannerColor, 0.15),
                    '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg,${bannerColor},${alpha(bannerColor, 0.7)})` },
                  }} />
                )}
              </Box>
            </motion.div>
          </AnimatePresence>

          {/* Deliverer card */}
          {deliverer && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}`, bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.02) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 50, height: 50, border: `2px solid ${alpha(AMBER, 0.5)}` }}>
                  {deliverer.firstName?.[0]}{deliverer.lastName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{deliverer.firstName} {deliverer.lastName}</Typography>
                  {deliverer.deliveryProfile?.averageRating > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontSize: 13, color: AMBER }}>★</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: AMBER }}>{deliverer.deliveryProfile.averageRating.toFixed(1)}</Typography>
                      <Typography variant="caption" color="text.disabled">· {deliverer.deliveryProfile.completedDeliveries ?? 0} deliveries</Typography>
                    </Box>
                  )}
                  {delivery.vehicle && (
                    <Typography variant="caption" color="text.secondary">
                      {delivery.vehicle.make} {delivery.vehicle.model} · {delivery.vehicle.numberPlate}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => window.location.href = `tel:${deliverer.phoneNumber}`}
                    sx={{ bgcolor: 'success.main', color: '#fff', width: 38, height: 38, '&:hover': { bgcolor: 'success.dark' } }}
                  >
                    <PhoneIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                  <IconButton
                    onClick={() => window.open(`https://wa.me/${deliverer.phoneNumber?.replace(/\D/g, '')}`, '_blank')}
                    sx={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', width: 38, height: 38 }}
                  >
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
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}` }}>
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
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.07)}`, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2, border: `1px solid ${alpha(AMBER, 0.2)}`, background: alpha(AMBER, isDark ? 0.08 : 0.04) }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={600}>Total Fare</Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ color: AMBER }}>{formatCurrency(delivery.totalFare)}</Typography>
                  </Box>
                  <Chip
                    label={delivery.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}
                    size="small"
                    sx={{ mt: 0.75, fontWeight: 700, bgcolor: alpha(AMBER, isDark ? 0.15 : 0.1), color: AMBER, border: `1px solid ${alpha(AMBER, 0.3)}` }}
                  />
                </Paper>
              )}
            </motion.div>
          )}

          {/* Navigate to dropoff */}
          <Button
            fullWidth variant="outlined" size="small" startIcon={<NavIcon />}
            onClick={() => {
              const dest = normalizeCoords(delivery.dropoffLocation);
              if (dest) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
            }}
            sx={{ height: 44, borderRadius: 3, fontWeight: 600, borderColor: alpha(AMBER, 0.5), color: AMBER }}
          >
            Open Dropoff in Google Maps
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}