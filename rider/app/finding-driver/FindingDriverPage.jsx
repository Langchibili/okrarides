// 'use client';
// // PATH: rider/app/(main)/finding-driver/page.jsx
// //
// // CHANGES vs previous version:
// //   • Added a direct backend polling loop (independent of the hook) that calls
// //     GET /rides/:id every 3 s while searchStage === 'searching'.
// //     This ensures the UI reacts even if socket/RN-bridge events don't fire.
// //   • Polling is stopped as soon as a terminal state is reached.
// //   • Both the hook-state watcher AND the direct poll call the same handleAccepted
// //     / handleCancelled helpers → no duplicate logic.

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import {
//   Box, Typography, Button, CircularProgress, Avatar,
//   Alert, Snackbar, Dialog, DialogTitle, DialogContent,
//   DialogActions, IconButton,
// } from '@mui/material';
// import {
//   Close as CloseIcon, Star as StarIcon, DirectionsCar as CarIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useRide } from '@/lib/hooks/useRide';
// import ClientOnly from '@/components/ClientOnly';
// import { useSocket } from '@/lib/socket/SocketProvider';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { SOCKET_EVENTS } from '@/Constants';
// import { apiClient } from '@/lib/api/client';

// // How often the page directly polls the backend for ride status.
// // Intentionally fast (3 s) while waiting for a driver — this is the
// // most time-sensitive polling in the whole app.
// const DRIVER_SEARCH_POLL_MS = 3_000;

// export default function FindingDriverPage() {
//   const router       = useRouter();
//   const searchParams = useSearchParams();
//   const rideId       = searchParams.get('rideId');

//   const { on: socketOn, off: socketOff } = useSocket();
//   const { on: rnOn }                     = useReactNative();

//   const {
//     activeRide, ride,
//     cancelRide,
//     startPollingRideStatus, stopPollingRideStatus,
//     loading,
//   } = useRide();

//   const [searchStage,      setSearchStage]      = useState('searching'); // searching | found | timeout
//   const [countdown,        setCountdown]        = useState(60);
//   const [showCancelDialog, setShowCancelDialog] = useState(false);
//   const [canceling,        setCanceling]        = useState(false);
//   const [snackbar,         setSnackbar]         = useState({ open: false, message: '', severity: 'info' });

//   // We stash the found driver separately so the "found" panel always has data
//   // regardless of whether activeRide has been updated yet.
//   const [foundDriver,   setFoundDriver]   = useState(null);
//   const [foundRideData, setFoundRideData] = useState(null);

//   const currentRide     = activeRide || ride;
//   const driver          = foundDriver  || currentRide?.driver;
//   const displayRideData = foundRideData || currentRide;

//   // Refs for cleanup
//   const pollRef      = useRef(null);
//   const mountedRef   = useRef(true);
//   const resolvedRef  = useRef(false); // once we hit a terminal state, stop everything

//   useEffect(() => {
//     mountedRef.current  = true;
//     resolvedRef.current = false;
//     return () => { mountedRef.current = false; };
//   }, []);

//   // ── Terminal-state helpers ────────────────────────────────────────────────
//   const stopAllPolling = useCallback(() => {
//     clearInterval(pollRef.current);
//     pollRef.current = null;
//     stopPollingRideStatus();
//   }, [stopPollingRideStatus]);

//   const handleAccepted = useCallback((data) => {
//     if (resolvedRef.current) return;
//     resolvedRef.current = true;
//     stopAllPolling();

//     setFoundDriver(data?.driver ?? null);
//     setFoundRideData(data ?? null);
//     setSearchStage('found');
//     setSnackbar({
//       open: true,
//       message: `${data?.driver?.firstName ?? 'Your driver'} is on the way!`,
//       severity: 'success',
//     });
//     setTimeout(() => {
//       router.push(`/tracking?rideId=${data?.rideId ?? rideId}`);
//     }, 2500);
//   }, [stopAllPolling, router, rideId]);

//   const handleCancelled = useCallback((data) => {
//     if (resolvedRef.current) return;
//     resolvedRef.current = true;
//     stopAllPolling();

//     setSnackbar({ open: true, message: data?.reason ?? 'Ride was cancelled', severity: 'warning' });
//     setTimeout(() => router.push('/home'), 2000);
//   }, [stopAllPolling, router]);

//   const handleNoDrivers = useCallback(() => {
//     if (resolvedRef.current) return;
//     resolvedRef.current = true;
//     stopAllPolling();
//     setSearchStage('timeout');
//   }, [stopAllPolling]);

//   // ══════════════════════════════════════════════════════════════════════════
//   // DIRECT BACKEND POLLING
//   // Independently polls GET /rides/:id every DRIVER_SEARCH_POLL_MS.
//   // Does NOT rely on the hook updating activeRide — it reads the API response
//   // directly and calls the terminal helpers.  This is the primary reliability
//   // mechanism for the finding-driver flow.
//   // ══════════════════════════════════════════════════════════════════════════
//   useEffect(() => {
//     if (!rideId || searchStage !== 'searching') return;

//     const poll = async () => {
//       if (!mountedRef.current || resolvedRef.current) return;
//       try {
//         const res = await apiClient.get(
//           `/rides/${rideId}?populate=driver.driverProfile,vehicle`
//         );
//         const data = res?.data ?? res;
//         if (!data || !mountedRef.current || resolvedRef.current) return;

//         switch (data.rideStatus) {
//           case 'accepted':
//             if (data.driver) {
//               handleAccepted({
//                 driver:   data.driver,
//                 vehicle:  data.vehicle,
//                 rideId:   data.id ?? rideId,
//                 eta:      data.eta,
//                 distance: data.distance,
//                 ...data,
//               });
//             }
//             break;
//           case 'no_drivers_available':
//             handleNoDrivers();
//             break;
//           case 'cancelled':
//             handleCancelled({ reason: 'Ride was cancelled' });
//             break;
//           default:
//             break;
//         }
//       } catch (err) {
//         // Network hiccup — keep polling silently
//         console.warn('[FindingDriver] poll error:', err.message);
//       }
//     };

//     // Poll immediately, then on interval
//     poll();
//     pollRef.current = setInterval(poll, DRIVER_SEARCH_POLL_MS);

//     return () => {
//       clearInterval(pollRef.current);
//       pollRef.current = null;
//     };
//   }, [rideId, searchStage, handleAccepted, handleCancelled, handleNoDrivers]);

//   // ── Also start the hook's polling as a supplementary layer ───────────────
//   useEffect(() => {
//     if (rideId && searchStage === 'searching') {
//       startPollingRideStatus(rideId, 120);
//     }
//     return () => stopPollingRideStatus();
//   }, [rideId, searchStage, startPollingRideStatus, stopPollingRideStatus]);

//   // ── Hook state watcher (covers polling + socket updates in useRide) ───────
//   useEffect(() => {
//     if (!currentRide || resolvedRef.current) return;

//     if (currentRide.rideStatus === 'accepted' && currentRide.driver) {
//       handleAccepted({
//         driver:   currentRide.driver,
//         vehicle:  currentRide.vehicle,
//         rideId:   currentRide.id ?? rideId,
//         eta:      currentRide.eta,
//         distance: currentRide.distance,
//         ...currentRide,
//       });
//     } else if (currentRide.rideStatus === 'no_drivers_available') {
//       handleNoDrivers();
//     } else if (currentRide.rideStatus === 'cancelled') {
//       handleCancelled({ reason: 'Ride was cancelled' });
//     }
//   }, [currentRide?.rideStatus, currentRide?.driver?.id, handleAccepted, handleCancelled, handleNoDrivers, rideId]);

//   // ══════════════════════════════════════════════════════════════════════════
//   // SOCKET.IO LISTENERS  (browser / PWA)
//   // ══════════════════════════════════════════════════════════════════════════
//   useEffect(() => {
//     const onAccepted  = (data) => { if (String(data.rideId) !== String(rideId)) return; handleAccepted(data); };
//     const onCancelled = (data) => { if (String(data.rideId) !== String(rideId)) return; handleCancelled(data); };

//     socketOn(SOCKET_EVENTS.RIDE.ACCEPTED,  onAccepted);
//     socketOn(SOCKET_EVENTS.RIDE.CANCELLED, onCancelled);
//     return () => {
//       socketOff(SOCKET_EVENTS.RIDE.ACCEPTED);
//       socketOff(SOCKET_EVENTS.RIDE.CANCELLED);
//     };
//   }, [rideId, socketOn, socketOff, handleAccepted, handleCancelled]);

//   // ══════════════════════════════════════════════════════════════════════════
//   // REACT NATIVE BRIDGE LISTENERS
//   // ══════════════════════════════════════════════════════════════════════════
//   useEffect(() => {
//     const forThis = (p) => !p?.rideId || String(p.rideId) === String(rideId);

//     const unsubAccepted  = rnOn('RIDE_ACCEPTED',  (p) => { if (!forThis(p)) return; handleAccepted({ driver: p.driver ?? currentRide?.driver, rideId: p.rideId ?? rideId, eta: p.eta, vehicle: p.vehicle, ...p }); });
//     const unsubCancelled = rnOn('RIDE_CANCELLED', (p) => { if (!forThis(p)) return; handleCancelled(p); });
//     const unsubTaken     = rnOn('RIDE_TAKEN',     (p) => { if (!forThis(p)) return; handleCancelled({ reason: 'Ride was taken by another driver' }); });

//     return () => { unsubAccepted?.(); unsubCancelled?.(); unsubTaken?.(); };
//   }, [rideId, rnOn, handleAccepted, handleCancelled, currentRide?.driver]);

//   // ── Countdown (visual only — actual timeout is 120 polls × 3 s = 6 min) ──
//   useEffect(() => {
//     if (searchStage !== 'searching') return;
//     const timer = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev <= 1) { clearInterval(timer); return 0; }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(timer);
//   }, [searchStage]);

//   // ── Cancel ────────────────────────────────────────────────────────────────
//   const handleCancelRequest = useCallback(async () => {
//     if (!rideId) { router.back(); return; }
//     setCanceling(true);
//     try {
//       const result = await cancelRide(rideId, 'CHANGE_OF_PLANS', 'Cancelled during driver search');
//       if (result.success) {
//         setSnackbar({ open: true, message: 'Ride cancelled', severity: 'info' });
//         setTimeout(() => router.push('/home'), 1000);
//       } else {
//         setSnackbar({ open: true, message: result.error || 'Failed to cancel', severity: 'error' });
//       }
//     } catch {
//       setSnackbar({ open: true, message: 'An error occurred while cancelling', severity: 'error' });
//     } finally {
//       setCanceling(false);
//       setShowCancelDialog(false);
//     }
//   }, [rideId, cancelRide, router]);

//   // ══════════════════════════════════════════════════════════════════════════
//   // RENDER
//   // ══════════════════════════════════════════════════════════════════════════
//   return (
//     <ClientOnly>
//       <Box sx={{ minHeight:'100vh', display:'flex', flexDirection:'column', bgcolor:'background.default', p:3 }}>
//         <AnimatePresence mode="wait">

//           {/* ── SEARCHING ─────────────────────────────────────────────────── */}
//           {searchStage === 'searching' && (
//             <motion.div key="searching" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
//               style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>

//               <Box sx={{ width:280, height:280, mb:4, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
//                 <motion.div animate={{ scale:[1,1.15,1], rotate:[0,5,-5,0] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}>
//                   <Box sx={{ fontSize:'8rem', filter:'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}>🚗</Box>
//                 </motion.div>
//                 <Box sx={{ position:'absolute', bottom:20, display:'flex', gap:1 }}>
//                   {[0,1,2].map(i => (
//                     <motion.div key={i} animate={{ scale:[1,1.5,1], opacity:[0.3,1,0.3] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.2 }}>
//                       <Box sx={{ width:12, height:12, borderRadius:'50%', bgcolor:'primary.main' }} />
//                     </motion.div>
//                   ))}
//                 </Box>
//               </Box>

//               <Typography variant="h5" sx={{ fontWeight:700, mb:1, textAlign:'center',
//                 background:'linear-gradient(45deg, #FFC107 30%, #FF9800 90%)',
//                 backgroundClip:'text', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
//                 Finding you a driver
//               </Typography>
//               <Typography variant="body1" color="text.secondary" sx={{ textAlign:'center', mb:1 }}>
//                 Searching for nearby drivers…
//               </Typography>
//               {currentRide && (
//                 <Typography variant="caption" color="text.secondary" sx={{ textAlign:'center', mb:4 }}>
//                   Ride #{currentRide.id?.toString().slice(-6) ?? rideId?.toString().slice(-6) ?? 'N/A'}
//                 </Typography>
//               )}

//               {/* Countdown circle */}
//               <Box sx={{ position:'relative', display:'inline-flex', mb:6 }}>
//                 <CircularProgress variant="determinate" value={(countdown/60)*100} size={100} thickness={4}
//                   sx={{ color:'primary.main', filter:'drop-shadow(0 4px 8px rgba(255,193,7,0.3))' }} />
//                 <Box sx={{ top:0,left:0,bottom:0,right:0,position:'absolute', display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column' }}>
//                   <Typography variant="h5" component="div" fontWeight={700} color="primary">{countdown}</Typography>
//                   <Typography variant="caption" color="text.secondary" fontWeight={600}>seconds</Typography>
//                 </Box>
//               </Box>

//               {/* Polling indicator */}
//               <Box sx={{ mb:3, display:'flex', alignItems:'center', gap:1 }}>
//                 <CircularProgress size={14} thickness={5} />
//                 <Typography variant="caption" color="text.secondary">Checking for drivers every 3 seconds…</Typography>
//               </Box>

//               <Box sx={{ mb:4, p:2, borderRadius:3, bgcolor:'action.hover', maxWidth:400, width:'100%' }}>
//                 <Typography variant="body2" color="text.secondary" textAlign="center">
//                   💡 <strong>Tip:</strong> We're notifying drivers within 5 km of your location
//                 </Typography>
//               </Box>

//               <Button variant="outlined" size="large" onClick={() => setShowCancelDialog(true)} disabled={canceling}
//                 sx={{ width:'100%', maxWidth:400, height:56, borderRadius:4, fontWeight:600, borderWidth:2, '&:hover':{ borderWidth:2 } }}>
//                 {canceling ? <CircularProgress size={24} /> : 'Cancel Request'}
//               </Button>
//             </motion.div>
//           )}

//           {/* ── DRIVER FOUND ──────────────────────────────────────────────── */}
//           {searchStage === 'found' && driver && (
//             <motion.div key="found" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
//               style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>

//               <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:260, damping:20 }}>
//                 <Box sx={{ width:120, height:120, borderRadius:'50%', bgcolor:'success.main', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem', color:'white', mb:3, boxShadow:'0 10px 30px rgba(76,175,80,0.4)' }}>
//                   ✓
//                 </Box>
//               </motion.div>

//               <Typography variant="h4" sx={{ fontWeight:700, mb:1, color:'success.main' }}>Driver Found!</Typography>
//               <Typography variant="body1" color="text.secondary" sx={{ mb:4, textAlign:'center' }}>
//                 {driver.firstName} {driver.lastName} is coming to pick you up
//               </Typography>

//               <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.2 }} style={{ width:'100%', maxWidth:450 }}>
//                 <Box sx={{ p:3, borderRadius:4, bgcolor:'background.paper', boxShadow:'0 8px 32px rgba(0,0,0,0.12)', border:'1px solid', borderColor:'divider', mb:4 }}>
//                   <Box sx={{ display:'flex', alignItems:'center', mb:3 }}>
//                     <Avatar src={driver.profilePicture} sx={{ width:72, height:72, mr:2, border:'3px solid', borderColor:'primary.main' }}>{driver.firstName?.[0]}</Avatar>
//                     <Box sx={{ flex:1 }}>
//                       <Typography variant="h6" sx={{ fontWeight:700, mb:0.5 }}>{driver.firstName} {driver.lastName}</Typography>
//                       <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
//                         <StarIcon sx={{ fontSize:18, color:'warning.main' }} />
//                         <Typography variant="body2" sx={{ fontWeight:600 }}>{driver.driverProfile?.averageRating || 4.8}</Typography>
//                         <Typography variant="caption" color="text.secondary">({driver.driverProfile?.totalRatings || 0} ratings)</Typography>
//                       </Box>
//                       <Typography variant="caption" color="text.secondary">{driver.driverProfile?.completedRides || 0} completed trips</Typography>
//                     </Box>
//                   </Box>

//                   <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
//                     <Box sx={{ p:2, borderRadius:2, bgcolor:'action.hover' }}>
//                       <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}><CarIcon sx={{ fontSize:18, color:'text.secondary' }} /><Typography variant="caption" color="text.secondary" fontWeight={600}>VEHICLE</Typography></Box>
//                       <Typography variant="body2" sx={{ fontWeight:600, mb:0.5 }}>{displayRideData?.vehicle?.numberPlate || 'N/A'}</Typography>
//                       <Typography variant="caption" color="text.secondary">{displayRideData?.vehicle?.color} {displayRideData?.vehicle?.make} {displayRideData?.vehicle?.model}</Typography>
//                     </Box>
//                     <Box sx={{ p:2, borderRadius:2, bgcolor:'primary.main', color:'white' }}>
//                       <Typography variant="caption" sx={{ opacity:0.9, fontWeight:600 }}>ARRIVING IN</Typography>
//                       <Typography variant="h5" sx={{ fontWeight:700, mt:0.5 }}>
//                         {displayRideData?.eta ? `${Math.ceil(displayRideData.eta/60)} min` : '3-5 min'}
//                       </Typography>
//                       <Typography variant="caption" sx={{ opacity:0.9 }}>
//                         {displayRideData?.distance ? `${Number(displayRideData.distance).toFixed(1)} km away` : 'Nearby'}
//                       </Typography>
//                     </Box>
//                   </Box>

//                   {driver.phoneNumber && (
//                     <Box sx={{ mt:2, p:2, borderRadius:2, border:'1px dashed', borderColor:'divider' }}>
//                       <Typography variant="caption" color="text.secondary">Phone Number</Typography>
//                       <Typography variant="body2" sx={{ fontWeight:600 }}>{driver.phoneNumber}</Typography>
//                     </Box>
//                   )}
//                 </Box>
//               </motion.div>

//               <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.4 }} style={{ width:'100%', maxWidth:450 }}>
//                 <Button fullWidth variant="contained" size="large"
//                   onClick={() => router.push(`/tracking?rideId=${displayRideData?.id ?? rideId}`)}
//                   sx={{ height:56, fontWeight:700, borderRadius:4, fontSize:'1rem', boxShadow:'0 4px 12px rgba(255,193,7,0.4)' }}>
//                   Track Driver
//                 </Button>
//               </motion.div>
//             </motion.div>
//           )}

//           {/* ── NO DRIVERS ────────────────────────────────────────────────── */}
//           {searchStage === 'timeout' && (
//             <motion.div key="timeout" initial={{ opacity:0 }} animate={{ opacity:1 }}
//               style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>

//               <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200, damping:15 }}>
//                 <Box sx={{ width:140, height:140, borderRadius:'50%', bgcolor:'error.light', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem', mb:3, boxShadow:'0 10px 30px rgba(244,67,54,0.2)' }}>😔</Box>
//               </motion.div>

//               <Typography variant="h5" sx={{ fontWeight:700, mb:1, textAlign:'center' }}>No Drivers Available</Typography>
//               <Typography variant="body1" color="text.secondary" sx={{ textAlign:'center', mb:1, maxWidth:350 }}>We couldn't find any drivers nearby right now.</Typography>
//               <Typography variant="body2" color="text.secondary" sx={{ textAlign:'center', mb:4, maxWidth:350 }}>Please try again in a few minutes.</Typography>

//               <Box sx={{ mb:4, p:2.5, borderRadius:3, bgcolor:'info.light', maxWidth:400, width:'100%' }}>
//                 <Typography variant="body2" fontWeight={600} color="info.dark" gutterBottom>💡 Tips to increase your chances:</Typography>
//                 <Typography variant="caption" color="info.dark" component="div" sx={{ mt:1 }}>• Try booking during peak hours (7–9 AM, 5–7 PM)</Typography>
//                 <Typography variant="caption" color="info.dark" component="div">• Move to a more accessible pickup location</Typography>
//                 <Typography variant="caption" color="info.dark" component="div">• Consider scheduling a ride in advance</Typography>
//               </Box>

//               <Box sx={{ width:'100%', maxWidth:400, display:'flex', flexDirection:'column', gap:2 }}>
//                 <Button fullWidth variant="contained" size="large" onClick={() => router.push('/home')} sx={{ height:56, fontWeight:700, borderRadius:4 }}>Try Again</Button>
//                 <Button fullWidth variant="outlined" size="large" onClick={() => router.push('/home')} sx={{ height:56, fontWeight:600, borderRadius:4 }}>Back to Home</Button>
//               </Box>
//             </motion.div>
//           )}

//         </AnimatePresence>

//         {/* Cancel Dialog */}
//         <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} PaperProps={{ sx:{ borderRadius:4, maxWidth:400 } }}>
//           <DialogTitle sx={{ fontWeight:700 }}>
//             Cancel Ride Request?
//             <IconButton onClick={() => setShowCancelDialog(false)} sx={{ position:'absolute', right:8, top:8 }}><CloseIcon /></IconButton>
//           </DialogTitle>
//           <DialogContent><Typography variant="body2" color="text.secondary">Are you sure you want to cancel this ride request?</Typography></DialogContent>
//           <DialogActions sx={{ p:2.5, pt:1 }}>
//             <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ borderRadius:2, px:3 }}>Keep Searching</Button>
//             <Button onClick={handleCancelRequest} variant="contained" color="error" disabled={canceling} sx={{ borderRadius:2, px:3 }}>
//               {canceling ? <CircularProgress size={20} /> : 'Yes, Cancel'}
//             </Button>
//           </DialogActions>
//         </Dialog>

//         {/* Snackbar */}
//         <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s=>({...s,open:false}))} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
//           <Alert onClose={() => setSnackbar(s=>({...s,open:false}))} severity={snackbar.severity} sx={{ width:'100%' }}>{snackbar.message}</Alert>
//         </Snackbar>
//       </Box>
//     </ClientOnly>
//   );
// }
'use client';
// PATH: rider/app/(main)/finding-driver/page.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, CircularProgress, Avatar,
  Alert, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, useTheme,Paper
} from '@mui/material';
import {
  Close as CloseIcon, Star as StarIcon, DirectionsCar as CarIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRide } from '@/lib/hooks/useRide';
import ClientOnly from '@/components/ClientOnly';
import { useSocket } from '@/lib/socket/SocketProvider';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { SOCKET_EVENTS } from '@/Constants';
import { apiClient } from '@/lib/api/client';

const DRIVER_SEARCH_POLL_MS = 3_000;

// ─── Animated pulse rings ─────────────────────────────────────────────────────
const PulseRing = ({ size, delay, color }) => (
  <motion.div
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      border: `2px solid ${color}`,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}
    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
    transition={{ duration: 2.4, repeat: Infinity, delay, ease: 'easeOut' }}
  />
);

// ─── Loading dots ─────────────────────────────────────────────────────────────
const LoadingDots = ({ color = '#FFC107' }) => (
  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
      >
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}AA)` }} />
      </motion.div>
    ))}
  </Box>
);

export default function FindingDriverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideId = searchParams.get('rideId');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { on: socketOn, off: socketOff } = useSocket();
  const { on: rnOn } = useReactNative();

  const {
    activeRide, ride,
    cancelRide,
    startPollingRideStatus, stopPollingRideStatus,
    loading,
  } = useRide();

  const [searchStage, setSearchStage] = useState('searching');
  const [countdown, setCountdown] = useState(60);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [foundDriver, setFoundDriver] = useState(null);
  const [foundRideData, setFoundRideData] = useState(null);

  const currentRide = activeRide || ride;
  const driver = foundDriver || currentRide?.driver;
  const displayRideData = foundRideData || currentRide;

  const pollRef = useRef(null);
  const mountedRef = useRef(true);
  const resolvedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    resolvedRef.current = false;
    return () => { mountedRef.current = false; };
  }, []);

  const stopAllPolling = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = null;
    stopPollingRideStatus();
  }, [stopPollingRideStatus]);

  const handleAccepted = useCallback((data) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    stopAllPolling();
    setFoundDriver(data?.driver ?? null);
    setFoundRideData(data ?? null);
    setSearchStage('found');
    setSnackbar({ open: true, message: `${data?.driver?.firstName ?? 'Your driver'} is on the way!`, severity: 'success' });
    setTimeout(() => { router.push(`/tracking?rideId=${data?.rideId ?? rideId}`); }, 2500);
  }, [stopAllPolling, router, rideId]);

  const handleCancelled = useCallback((data) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    stopAllPolling();
    setSnackbar({ open: true, message: data?.reason ?? 'Ride was cancelled', severity: 'warning' });
    setTimeout(() => router.push('/home'), 2000);
  }, [stopAllPolling, router]);

  const handleNoDrivers = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    stopAllPolling();
    setSearchStage('timeout');
  }, [stopAllPolling]);

  useEffect(() => {
    if (!rideId || searchStage !== 'searching') return;
    const poll = async () => {
      if (!mountedRef.current || resolvedRef.current) return;
      try {
        const res = await apiClient.get(`/rides/${rideId}?populate=driver.driverProfile,vehicle`);
        const data = res?.data ?? res;
        if (!data || !mountedRef.current || resolvedRef.current) return;
        if (data.rideStatus === 'accepted' && data.driver) {
          handleAccepted({ driver: data.driver, vehicle: data.vehicle, rideId: data.id ?? rideId, eta: data.eta, distance: data.distance, ...data });
        } else if (data.rideStatus === 'no_drivers_available') handleNoDrivers();
        else if (data.rideStatus === 'cancelled') handleCancelled({ reason: 'Ride was cancelled' });
      } catch (err) { console.warn('[FindingDriver] poll error:', err.message); }
    };
    poll();
    pollRef.current = setInterval(poll, DRIVER_SEARCH_POLL_MS);
    return () => { clearInterval(pollRef.current); pollRef.current = null; };
  }, [rideId, searchStage, handleAccepted, handleCancelled, handleNoDrivers]);

  useEffect(() => {
    if (rideId && searchStage === 'searching') { startPollingRideStatus(rideId, 120); }
    return () => stopPollingRideStatus();
  }, [rideId, searchStage, startPollingRideStatus, stopPollingRideStatus]);

  useEffect(() => {
    if (!currentRide || resolvedRef.current) return;
    if (currentRide.rideStatus === 'accepted' && currentRide.driver) handleAccepted({ driver: currentRide.driver, vehicle: currentRide.vehicle, rideId: currentRide.id ?? rideId, eta: currentRide.eta, distance: currentRide.distance, ...currentRide });
    else if (currentRide.rideStatus === 'no_drivers_available') handleNoDrivers();
    else if (currentRide.rideStatus === 'cancelled') handleCancelled({ reason: 'Ride was cancelled' });
  }, [currentRide?.rideStatus, currentRide?.driver?.id, handleAccepted, handleCancelled, handleNoDrivers, rideId]);

  useEffect(() => {
    const onAccepted = (data) => { if (String(data.rideId) !== String(rideId)) return; handleAccepted(data); };
    const onCancelled = (data) => { if (String(data.rideId) !== String(rideId)) return; handleCancelled(data); };
    socketOn(SOCKET_EVENTS.RIDE.ACCEPTED, onAccepted);
    socketOn(SOCKET_EVENTS.RIDE.CANCELLED, onCancelled);
    return () => { socketOff(SOCKET_EVENTS.RIDE.ACCEPTED); socketOff(SOCKET_EVENTS.RIDE.CANCELLED); };
  }, [rideId, socketOn, socketOff, handleAccepted, handleCancelled]);

  useEffect(() => {
    const forThis = (p) => !p?.rideId || String(p.rideId) === String(rideId);
    const unsubAccepted = rnOn('RIDE_ACCEPTED', (p) => { if (!forThis(p)) return; handleAccepted({ driver: p.driver ?? currentRide?.driver, rideId: p.rideId ?? rideId, eta: p.eta, vehicle: p.vehicle, ...p }); });
    const unsubCancelled = rnOn('RIDE_CANCELLED', (p) => { if (!forThis(p)) return; handleCancelled(p); });
    const unsubTaken = rnOn('RIDE_TAKEN', (p) => { if (!forThis(p)) return; handleCancelled({ reason: 'Ride was taken by another driver' }); });
    return () => { unsubAccepted?.(); unsubCancelled?.(); unsubTaken?.(); };
  }, [rideId, rnOn, handleAccepted, handleCancelled, currentRide?.driver]);

  useEffect(() => {
    if (searchStage !== 'searching') return;
    const timer = setInterval(() => { setCountdown((prev) => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; }); }, 1000);
    return () => clearInterval(timer);
  }, [searchStage]);

  const handleCancelRequest = useCallback(async () => {
    if (!rideId) { router.back(); return; }
    setCanceling(true);
    try {
      const result = await cancelRide(rideId, 'CHANGE_OF_PLANS', 'Cancelled during driver search');
      if (result.success) {
        setSnackbar({ open: true, message: 'Ride cancelled', severity: 'info' });
        setTimeout(() => router.push('/home'), 1000);
      } else {
        setSnackbar({ open: true, message: result.error || 'Failed to cancel', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'An error occurred while cancelling', severity: 'error' });
    } finally {
      setCanceling(false);
      setShowCancelDialog(false);
    }
  }, [rideId, cancelRide, router]);

  return (
    <ClientOnly>
      <Box
        sx={{
          minHeight: '100vh',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Ambient gradient background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: isDark
              ? 'radial-gradient(ellipse at 50% 30%, rgba(255,193,7,0.06) 0%, transparent 65%)'
              : 'radial-gradient(ellipse at 50% 30%, rgba(255,193,7,0.1) 0%, transparent 65%)',
            zIndex: 0,
          }}
        />

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            position: 'relative',
            zIndex: 1,
            px: 3,
            py: 4,
          }}
        >
          <AnimatePresence mode="wait">

            {/* ── SEARCHING ─────────────────────────────────────────────── */}
            {searchStage === 'searching' && (
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                {/* Car with pulse rings */}
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    mb: 4,
                  }}
                >
                  <PulseRing size={120} delay={0} color="#FFC107" />
                  <PulseRing size={120} delay={0.8} color="#FF8C00" />
                  <PulseRing size={120} delay={1.6} color="#FFC107" />
                  <motion.div
                    animate={{ y: [-6, 6, -6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'relative', zIndex: 2 }}
                  >
                    <Box
                      sx={{
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(255,193,7,0.2) 0%, rgba(255,140,0,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,140,0,0.08) 100%)',
                        border: '2px solid rgba(255,193,7,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(255,193,7,0.25)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Typography sx={{ fontSize: '2.8rem', lineHeight: 1 }}>🚗</Typography>
                    </Box>
                  </motion.div>
                </Box>

                {/* Title */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mb: 0.8,
                    textAlign: 'center',
                    letterSpacing: -0.5,
                    background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Finding your driver
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 0.5, fontWeight: 500 }}>
                  Notifying drivers within 5 km
                </Typography>
                {currentRide && (
                  <Box
                    sx={{
                      px: 2,
                      py: 0.6,
                      borderRadius: 2,
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      mb: 4,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', fontWeight: 600 }}>
                      #{currentRide.id?.toString().slice(-6) ?? rideId?.toString().slice(-6) ?? 'N/A'}
                    </Typography>
                  </Box>
                )}

                {/* Countdown */}
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255,193,7,0.12) 0%, transparent 70%)',
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={(countdown / 60) * 100}
                    size={100}
                    thickness={3.5}
                    sx={{
                      color: '#FFC107',
                      filter: 'drop-shadow(0 4px 12px rgba(255,193,7,0.35))',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: '#FFC107', lineHeight: 1, letterSpacing: -1 }}>
                      {countdown}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.6rem', letterSpacing: 0.5 }}>
                      SEC
                    </Typography>
                  </Box>
                </Box>

                {/* Polling indicator */}
                <Box
                  sx={{
                    mb: 4,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <LoadingDots />
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                    Checking for drivers every 3 seconds
                  </Typography>
                </Box>

                {/* Tip card */}
                <Box
                  sx={{
                    mb: 5,
                    p: 2.5,
                    borderRadius: 3,
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,140,0,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255,193,7,0.08) 0%, rgba(255,140,0,0.04) 100%)',
                    border: '1px solid rgba(255,193,7,0.2)',
                    maxWidth: 400,
                    width: '100%',
                  }}
                >
                  <Typography variant="body2" sx={{ textAlign: 'center', color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)', fontWeight: 500 }}>
                    💡 We're notifying all nearby drivers. You'll be matched soon!
                  </Typography>
                </Box>

                <motion.div whileTap={{ scale: 0.97 }} style={{ width: '100%', maxWidth: 400 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={canceling}
                    sx={{
                      width: '100%',
                      height: 54,
                      borderRadius: 3,
                      fontWeight: 700,
                      borderWidth: 1.5,
                      borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                      color: 'text.secondary',
                      '&:hover': { borderWidth: 1.5 },
                    }}
                  >
                    {canceling ? <CircularProgress size={22} /> : 'Cancel Request'}
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* ── DRIVER FOUND ──────────────────────────────────────────── */}
            {searchStage === 'found' && driver && (
              <motion.div
                key="found"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      color: 'white',
                      mb: 3,
                      boxShadow: '0 12px 36px rgba(76,175,80,0.45)',
                    }}
                  >
                    ✓
                  </Box>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, textAlign: 'center', color: 'success.main', letterSpacing: -0.5 }}>
                    Driver Found!
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, textAlign: 'center', fontWeight: 500 }}>
                    {driver.firstName} {driver.lastName} is heading to you
                  </Typography>
                </motion.div>

                {/* Driver card */}
                <motion.div
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{ width: '100%', maxWidth: 440 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      mb: 3,
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                      boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 16px 48px rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Success border top */}
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)' }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                      <Avatar
                        src={driver.profilePicture}
                        sx={{
                          width: 68,
                          height: 68,
                          mr: 2,
                          border: '3px solid',
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 16px rgba(255,193,7,0.3)',
                          fontSize: '1.5rem',
                        }}
                      >
                        {driver.firstName?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.3, mb: 0.3 }}>
                          {driver.firstName} {driver.lastName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          <StarIcon sx={{ fontSize: 16, color: '#FF8C00' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF8C00' }}>
                            {driver.driverProfile?.averageRating || 4.8}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            · {driver.driverProfile?.totalRatings || 0} ratings
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {driver.driverProfile?.completedRides || 0} completed trips
                        </Typography>
                      </Box>
                    </Box>

                    {/* Vehicle + ETA grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                          <CarIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            Vehicle
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: 0.5,
                            fontFamily: 'monospace',
                            background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {displayRideData?.vehicle?.numberPlate || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                          {displayRideData?.vehicle?.color} {displayRideData?.vehicle?.make} {displayRideData?.vehicle?.model}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                          boxShadow: '0 4px 16px rgba(255,193,7,0.35)',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.6)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                          Arriving In
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#000', lineHeight: 1, letterSpacing: -0.5 }}>
                          {displayRideData?.eta ? `${Math.ceil(displayRideData.eta / 60)} min` : '3–5 min'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.55)', fontSize: '0.7rem' }}>
                          {displayRideData?.distance ? `${Number(displayRideData.distance).toFixed(1)} km away` : 'Nearby'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.32 }} style={{ width: '100%', maxWidth: 440 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => router.push(`/tracking?rideId=${displayRideData?.id ?? rideId}`)}
                    sx={{
                      height: 56,
                      fontWeight: 800,
                      borderRadius: 3.5,
                      fontSize: '1rem',
                      background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                      boxShadow: '0 6px 20px rgba(255,193,7,0.45)',
                      color: '#000',
                      letterSpacing: 0.2,
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(255,193,7,0.55)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Track Driver →
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* ── NO DRIVERS ─────────────────────────────────────────────── */}
            {searchStage === 'timeout' && (
              <motion.div
                key="timeout"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: isDark
                        ? 'linear-gradient(135deg, rgba(244,67,54,0.2) 0%, rgba(244,67,54,0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(244,67,54,0.12) 0%, rgba(244,67,54,0.05) 100%)',
                      border: '2px solid rgba(244,67,54,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '4rem',
                      mb: 3,
                      boxShadow: '0 12px 36px rgba(244,67,54,0.2)',
                    }}
                  >
                    😔
                  </Box>
                </motion.div>

                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, textAlign: 'center', letterSpacing: -0.4 }}>
                  No Drivers Available
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 1, maxWidth: 320, fontWeight: 500 }}>
                  We couldn't find any drivers nearby right now.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', mb: 4, maxWidth: 320 }}>
                  Please try again in a few minutes.
                </Typography>

                <Box
                  sx={{
                    mb: 4,
                    p: 2.5,
                    borderRadius: 3,
                    background: isDark
                      ? 'rgba(33,150,243,0.1)'
                      : 'rgba(33,150,243,0.06)',
                    border: '1px solid rgba(33,150,243,0.2)',
                    maxWidth: 380,
                    width: '100%',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#2196F3', mb: 1 }}>
                    💡 Tips to get a driver faster:
                  </Typography>
                  {['Try during peak hours (7–9 AM, 5–7 PM)', 'Move to a more accessible location', 'Consider scheduling in advance'].map((tip) => (
                    <Typography key={tip} variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)', display: 'block', mb: 0.5 }}>
                      • {tip}
                    </Typography>
                  ))}
                </Box>

                <Box sx={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => router.push('/home')}
                    sx={{
                      height: 54,
                      fontWeight: 800,
                      borderRadius: 3.5,
                      background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                      color: '#000',
                      boxShadow: '0 6px 20px rgba(255,193,7,0.4)',
                    }}
                  >
                    Try Again
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => router.push('/home')}
                    sx={{
                      height: 54,
                      fontWeight: 600,
                      borderRadius: 3.5,
                      borderWidth: 1.5,
                      '&:hover': { borderWidth: 1.5 },
                    }}
                  >
                    Back to Home
                  </Button>
                </Box>
              </motion.div>
            )}

          </AnimatePresence>
        </Box>

        {/* ── Cancel Dialog ──────────────────────────────────────────────────── */}
        <Dialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 4,
              maxWidth: 400,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Cancel Ride Request?
            <IconButton onClick={() => setShowCancelDialog(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to cancel this ride request?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}>
              Keep Searching
            </Button>
            <Button onClick={handleCancelRequest} variant="contained" color="error" disabled={canceling} sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}>
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