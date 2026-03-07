// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Button,
//   CircularProgress,
//   Avatar,
//   Alert,
//   Snackbar,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   IconButton,
// } from '@mui/material';
// import {
//   Close as CloseIcon,
//   Star as StarIcon,
//   DirectionsCar as CarIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useRide } from '@/lib/hooks/useRide';
// import ClientOnly from '@/components/ClientOnly';
// import { useSocket } from '@/lib/socket/SocketProvider';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { SOCKET_EVENTS } from '@/Constants';

// export default function FindingDriverPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const rideId = searchParams.get('rideId');

//   const { on: socketOn, off: socketOff } = useSocket();
//   const { on: rnOn } = useReactNative();

//   const {
//     activeRide,
//     ride,
//     cancelRide,
//     startPollingRideStatus,
//     stopPollingRideStatus,
//     loading,
//     error,
//   } = useRide();

//   // UI State
//   const [searchStage, setSearchStage] = useState('searching'); // searching | found | timeout
//   const [countdown, setCountdown] = useState(60);
//   const [showCancelDialog, setShowCancelDialog] = useState(false);
//   const [canceling, setCanceling] = useState(false);
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

//   // ── Derived ride / driver data ──────────────────────────────────────────────
//   const currentRide = activeRide || ride;
//   const driver = currentRide?.driver;

//   // ── Helper: handle a confirmed acceptance ──────────────────────────────────
//   // Called from both the socket handler and the RN bridge handler so there is
//   // only one place that drives the UI transition.
//   const handleAccepted = useCallback((data) => {
//     setSearchStage('found');
//     stopPollingRideStatus();
//     setSnackbar({
//       open: true,
//       message: `${data?.driver?.firstName ?? 'Your driver'} is on the way!`,
//       severity: 'success',
//     });
//     setTimeout(() => {
//       router.push(`/tracking?rideId=${data?.rideId ?? rideId}`);
//     }, 2000);
//   }, [stopPollingRideStatus, router, rideId]);

//   const handleCancelled = useCallback((data) => {
//     stopPollingRideStatus();
//     setSnackbar({
//       open: true,
//       message: data?.reason ?? 'Ride was cancelled',
//       severity: 'warning',
//     });
//     setTimeout(() => router.push('/home'), 2000);
//   }, [stopPollingRideStatus, router]);

//   // ============================================
//   // Start Polling for Driver Assignment
//   // ============================================
//   useEffect(() => {
//     if (rideId && searchStage === 'searching') {
//       startPollingRideStatus(rideId, 120);
//     }
//     return () => stopPollingRideStatus();
//   }, [rideId, searchStage, startPollingRideStatus, stopPollingRideStatus]);

//   // ============================================
//   // Monitor Ride Status Changes (from polling)
//   // ============================================
//   useEffect(() => {
//     if (!currentRide) return;

//     if (currentRide.rideStatus === 'accepted' && currentRide.driver) {
//       handleAccepted({ driver: currentRide.driver, rideId: currentRide.id });
//     } else if (currentRide.rideStatus === 'no_drivers_available') {
//       setSearchStage('timeout');
//       stopPollingRideStatus();
//     } else if (currentRide.rideStatus === 'cancelled') {
//       handleCancelled({ reason: 'Ride was cancelled' });
//     }
//   }, [currentRide?.rideStatus, currentRide?.driver, handleAccepted, handleCancelled, stopPollingRideStatus]);

//   // ============================================
//   // SOCKET.IO LISTENERS  (browser / PWA)
//   // ============================================
//   useEffect(() => {
//     const onAccepted = (data) => {
//       if (data.rideId !== rideId) return;
//       handleAccepted(data);
//     };

//     const onCancelled = (data) => {
//       if (data.rideId !== rideId) return;
//       handleCancelled(data);
//     };

//     socketOn(SOCKET_EVENTS.RIDE.ACCEPTED, onAccepted);
//     socketOn(SOCKET_EVENTS.RIDE.CANCELLED, onCancelled);

//     return () => {
//       socketOff(SOCKET_EVENTS.RIDE.ACCEPTED);
//       socketOff(SOCKET_EVENTS.RIDE.CANCELLED);
//     };
//   }, [rideId, socketOn, socketOff, handleAccepted, handleCancelled]);

//   // ============================================
//   // REACT NATIVE BRIDGE LISTENERS  (RN WebView shell)
//   // rnOn is stable (useCallback in ReactNativeWrapper) so this effect
//   // runs once. rideId is read inside the handler via the closure over
//   // the searchParams ref — if you navigate with a new rideId the handlers
//   // are re-registered because rideId is in the dep array.
//   // ============================================
//   useEffect(() => {
//     const forThisRide = (payload) =>
//       !payload?.rideId || payload.rideId === rideId; // let it through if no rideId guard

//     const unsubAccepted = rnOn('RIDE_ACCEPTED', (payload) => {
//       if (!forThisRide(payload)) return;
//       // Merge bridge payload with anything already in currentRide
//       handleAccepted({
//         driver:  payload.driver  ?? currentRide?.driver,
//         rideId:  payload.rideId  ?? rideId,
//         eta:     payload.eta,
//         vehicle: payload.vehicle,
//       });
//     });

//     const unsubCancelled = rnOn('RIDE_CANCELLED', (payload) => {
//       if (!forThisRide(payload)) return;
//       handleCancelled(payload);
//     });

//     // RIDE_TAKEN means another driver claimed it before ours could — treat
//     // same as cancelled from the rider's perspective on this page.
//     const unsubTaken = rnOn('RIDE_TAKEN', (payload) => {
//       if (!forThisRide(payload)) return;
//       handleCancelled({ reason: 'Ride was taken by another driver' });
//     });

//     return () => {
//       unsubAccepted?.();
//       unsubCancelled?.();
//       unsubTaken?.();
//     };
//   }, [rideId, rnOn, handleAccepted, handleCancelled, currentRide?.driver]);

//   // ============================================
//   // Countdown Timer
//   // ============================================
//   useEffect(() => {
//     if (searchStage !== 'searching') return;

//     const timer = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           setSearchStage('timeout');
//           stopPollingRideStatus();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [searchStage, stopPollingRideStatus]);

//   // ============================================
//   // Handle Cancel Request
//   // ============================================
//   const handleCancelRequest = useCallback(async () => {
//     if (!rideId) { router.back(); return; }

//     setCanceling(true);
//     try {
//       const result = await cancelRide(rideId, 'CHANGE_OF_PLANS', 'Cancelled during driver search');
//       if (result.success) {
//         setSnackbar({ open: true, message: 'Ride cancelled successfully', severity: 'info' });
//         setTimeout(() => router.push('/home'), 1000);
//       } else {
//         setSnackbar({ open: true, message: result.error || 'Failed to cancel ride', severity: 'error' });
//       }
//     } catch (err) {
//       setSnackbar({ open: true, message: 'An error occurred while cancelling', severity: 'error' });
//     } finally {
//       setCanceling(false);
//       setShowCancelDialog(false);
//     }
//   }, [rideId, cancelRide, router]);

//   const handleTryAgain = () => router.push('/home');

//   // ============================================
//   // Render
//   // ============================================
//   return (
//     <ClientOnly>
//       <Box
//         sx={{
//           minHeight: '100vh',
//           display: 'flex',
//           flexDirection: 'column',
//           bgcolor: 'background.default',
//           p: 3,
//         }}
//       >
//         <AnimatePresence mode="wait">

//           {/* ══════════════════════════════════════════ */}
//           {/* SEARCHING FOR DRIVER                       */}
//           {/* ══════════════════════════════════════════ */}
//           {searchStage === 'searching' && (
//             <motion.div
//               key="searching"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
//             >
//               {/* Animated Car */}
//               <Box
//                 sx={{
//                   width: 280, height: 280, mb: 4,
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   position: 'relative',
//                 }}
//               >
//                 <motion.div
//                   animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
//                   transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
//                 >
//                   <Box sx={{ fontSize: '8rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}>
//                     🚗
//                   </Box>
//                 </motion.div>

//                 <Box sx={{ position: 'absolute', bottom: 20, display: 'flex', gap: 1 }}>
//                   {[0, 1, 2].map((i) => (
//                     <motion.div
//                       key={i}
//                       animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
//                       transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
//                     >
//                       <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
//                     </motion.div>
//                   ))}
//                 </Box>
//               </Box>

//               <Typography
//                 variant="h5"
//                 sx={{
//                   fontWeight: 700, mb: 1, textAlign: 'center',
//                   background: 'linear-gradient(45deg, #FFC107 30%, #FF9800 90%)',
//                   backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
//                 }}
//               >
//                 Finding you a driver
//               </Typography>

//               <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
//                 Searching for nearby drivers...
//               </Typography>

//               {currentRide && (
//                 <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
//                   Ride #{currentRide.id?.toString().slice(-6) || 'N/A'}
//                 </Typography>
//               )}

//               {/* Countdown Circle */}
//               <Box sx={{ position: 'relative', display: 'inline-flex', mb: 6 }}>
//                 <CircularProgress
//                   variant="determinate"
//                   value={(countdown / 60) * 100}
//                   size={100}
//                   thickness={4}
//                   sx={{ color: 'primary.main', filter: 'drop-shadow(0 4px 8px rgba(255, 193, 7, 0.3))' }}
//                 />
//                 <Box
//                   sx={{
//                     top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
//                     display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
//                   }}
//                 >
//                   <Typography variant="h5" component="div" fontWeight={700} color="primary">
//                     {countdown}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary" fontWeight={600}>
//                     seconds
//                   </Typography>
//                 </Box>
//               </Box>

//               {/* Tip */}
//               <Box sx={{ mb: 4, p: 2, borderRadius: 3, bgcolor: 'action.hover', maxWidth: 400, width: '100%' }}>
//                 <Typography variant="body2" color="text.secondary" textAlign="center">
//                   💡 <strong>Tip:</strong> We're notifying drivers within 5km of your location
//                 </Typography>
//               </Box>

//               {/* Cancel Button */}
//               <Button
//                 variant="outlined"
//                 size="large"
//                 onClick={() => setShowCancelDialog(true)}
//                 disabled={canceling}
//                 sx={{
//                   width: '100%', maxWidth: 400, height: 56, borderRadius: 4,
//                   textTransform: 'none', fontWeight: 600, borderWidth: 2,
//                   '&:hover': { borderWidth: 2 },
//                 }}
//               >
//                 {canceling ? <CircularProgress size={24} /> : 'Cancel Request'}
//               </Button>
//             </motion.div>
//           )}

//           {/* ══════════════════════════════════════════ */}
//           {/* DRIVER FOUND                               */}
//           {/* ══════════════════════════════════════════ */}
//           {searchStage === 'found' && driver && (
//             <motion.div
//               key="found"
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
//             >
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ type: 'spring', stiffness: 260, damping: 20 }}
//               >
//                 <Box
//                   sx={{
//                     width: 120, height: 120, borderRadius: '50%', bgcolor: 'success.main',
//                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     fontSize: '4rem', color: 'white', mb: 3,
//                     boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)',
//                   }}
//                 >
//                   ✓
//                 </Box>
//               </motion.div>

//               <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'success.main' }}>
//                 Driver Found!
//               </Typography>
//               <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
//                 {driver.firstName} {driver.lastName} is coming to pick you up
//               </Typography>

//               {/* Driver Card */}
//               <motion.div
//                 initial={{ y: 20, opacity: 0 }}
//                 animate={{ y: 0, opacity: 1 }}
//                 transition={{ delay: 0.2 }}
//                 style={{ width: '100%', maxWidth: 450 }}
//               >
//                 <Box
//                   sx={{
//                     width: '100%', p: 3, borderRadius: 4,
//                     bgcolor: 'background.paper',
//                     boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
//                     border: '1px solid', borderColor: 'divider', mb: 4,
//                   }}
//                 >
//                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
//                     <Avatar
//                       src={driver.profilePicture}
//                       sx={{ width: 72, height: 72, mr: 2, border: '3px solid', borderColor: 'primary.main' }}
//                     >
//                       {driver.firstName?.[0]}
//                     </Avatar>
//                     <Box sx={{ flex: 1 }}>
//                       <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
//                         {driver.firstName} {driver.lastName}
//                       </Typography>
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                         <StarIcon sx={{ fontSize: 18, color: 'warning.main' }} />
//                         <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                           {driver.driverProfile?.averageRating || 4.8}
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           ({driver.driverProfile?.totalRatings || 0} ratings)
//                         </Typography>
//                       </Box>
//                       <Typography variant="caption" color="text.secondary">
//                         {driver.driverProfile?.completedRides || 0} completed trips
//                       </Typography>
//                     </Box>
//                   </Box>

//                   <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
//                     <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
//                         <CarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
//                         <Typography variant="caption" color="text.secondary" fontWeight={600}>VEHICLE</Typography>
//                       </Box>
//                       <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
//                         {currentRide?.vehicle?.numberPlate || 'N/A'}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {currentRide?.vehicle?.color} {currentRide?.vehicle?.make} {currentRide?.vehicle?.model}
//                       </Typography>
//                     </Box>

//                     <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
//                       <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>ARRIVING IN</Typography>
//                       <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
//                         {currentRide?.eta ? `${Math.ceil(currentRide.eta / 60)} min` : '3-5 min'}
//                       </Typography>
//                       <Typography variant="caption" sx={{ opacity: 0.9 }}>
//                         {currentRide?.distance ? `${currentRide.distance.toFixed(1)} km away` : 'Nearby'}
//                       </Typography>
//                     </Box>
//                   </Box>

//                   {driver.phoneNumber && (
//                     <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
//                       <Typography variant="caption" color="text.secondary">Phone Number</Typography>
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>{driver.phoneNumber}</Typography>
//                     </Box>
//                   )}
//                 </Box>
//               </motion.div>

//               <motion.div
//                 initial={{ y: 20, opacity: 0 }}
//                 animate={{ y: 0, opacity: 1 }}
//                 transition={{ delay: 0.4 }}
//                 style={{ width: '100%', maxWidth: 450 }}
//               >
//                 <Button
//                   fullWidth
//                   variant="contained"
//                   size="large"
//                   onClick={() => router.push(`/tracking?rideId=${currentRide?.id}`)}
//                   sx={{
//                     height: 56, fontWeight: 700, borderRadius: 4, fontSize: '1rem',
//                     boxShadow: '0 4px 12px rgba(255, 193, 7, 0.4)',
//                   }}
//                 >
//                   Track Driver
//                 </Button>
//               </motion.div>
//             </motion.div>
//           )}

//           {/* ══════════════════════════════════════════ */}
//           {/* NO DRIVERS AVAILABLE                       */}
//           {/* ══════════════════════════════════════════ */}
//           {searchStage === 'timeout' && (
//             <motion.div
//               key="timeout"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
//             >
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ type: 'spring', stiffness: 200, damping: 15 }}
//               >
//                 <Box
//                   sx={{
//                     width: 140, height: 140, borderRadius: '50%', bgcolor: 'error.light',
//                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     fontSize: '5rem', mb: 3,
//                     boxShadow: '0 10px 30px rgba(244, 67, 54, 0.2)',
//                   }}
//                 >
//                   😔
//                 </Box>
//               </motion.div>

//               <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
//                 No Drivers Available
//               </Typography>
//               <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 1, maxWidth: 350 }}>
//                 We couldn't find any drivers nearby right now.
//               </Typography>
//               <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 4, maxWidth: 350 }}>
//                 This could be due to high demand or limited drivers in your area. Please try again in a few minutes.
//               </Typography>

//               <Box sx={{ mb: 4, p: 2.5, borderRadius: 3, bgcolor: 'info.light', maxWidth: 400, width: '100%' }}>
//                 <Typography variant="body2" fontWeight={600} color="info.dark" gutterBottom>
//                   💡 Tips to increase your chances:
//                 </Typography>
//                 <Typography variant="caption" color="info.dark" component="div" sx={{ mt: 1 }}>• Try booking during peak hours (7-9 AM, 5-7 PM)</Typography>
//                 <Typography variant="caption" color="info.dark" component="div">• Move to a more accessible pickup location</Typography>
//                 <Typography variant="caption" color="info.dark" component="div">• Consider scheduling a ride in advance</Typography>
//               </Box>

//               <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
//                 <Button
//                   fullWidth variant="contained" size="large" onClick={handleTryAgain}
//                   sx={{ height: 56, fontWeight: 700, borderRadius: 4 }}
//                 >
//                   Try Again
//                 </Button>
//                 <Button
//                   fullWidth variant="outlined" size="large" onClick={() => router.push('/home')}
//                   sx={{ height: 56, fontWeight: 600, borderRadius: 4 }}
//                 >
//                   Back to Home
//                 </Button>
//               </Box>
//             </motion.div>
//           )}

//         </AnimatePresence>

//         {/* ── Cancel Confirmation Dialog ── */}
//         <Dialog
//           open={showCancelDialog}
//           onClose={() => setShowCancelDialog(false)}
//           PaperProps={{ sx: { borderRadius: 4, maxWidth: 400 } }}
//         >
//           <DialogTitle sx={{ fontWeight: 700 }}>
//             Cancel Ride Request?
//             <IconButton
//               onClick={() => setShowCancelDialog(false)}
//               sx={{ position: 'absolute', right: 8, top: 8 }}
//             >
//               <CloseIcon />
//             </IconButton>
//           </DialogTitle>
//           <DialogContent>
//             <Typography variant="body2" color="text.secondary">
//               Are you sure you want to cancel this ride request? This action cannot be undone.
//             </Typography>
//           </DialogContent>
//           <DialogActions sx={{ p: 2.5, pt: 1 }}>
//             <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ borderRadius: 2, px: 3 }}>
//               Keep Searching
//             </Button>
//             <Button
//               onClick={handleCancelRequest}
//               variant="contained"
//               color="error"
//               disabled={canceling}
//               sx={{ borderRadius: 2, px: 3 }}
//             >
//               {canceling ? <CircularProgress size={20} /> : 'Yes, Cancel'}
//             </Button>
//           </DialogActions>
//         </Dialog>

//         {/* ── Snackbar ── */}
//         <Snackbar
//           open={snackbar.open}
//           autoHideDuration={4000}
//           onClose={() => setSnackbar(s => ({ ...s, open: false }))}
//           anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
//         >
//           <Alert
//             onClose={() => setSnackbar(s => ({ ...s, open: false }))}
//             severity={snackbar.severity}
//             sx={{ width: '100%' }}
//           >
//             {snackbar.message}
//           </Alert>
//         </Snackbar>
//       </Box>
//     </ClientOnly>
//   );
// }
'use client';
// PATH: rider/app/(main)/finding-driver/page.jsx
//
// CHANGES vs previous version:
//   • Added a direct backend polling loop (independent of the hook) that calls
//     GET /rides/:id every 3 s while searchStage === 'searching'.
//     This ensures the UI reacts even if socket/RN-bridge events don't fire.
//   • Polling is stopped as soon as a terminal state is reached.
//   • Both the hook-state watcher AND the direct poll call the same handleAccepted
//     / handleCancelled helpers → no duplicate logic.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, CircularProgress, Avatar,
  Alert, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton,
} from '@mui/material';
import {
  Close as CloseIcon, Star as StarIcon, DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRide } from '@/lib/hooks/useRide';
import ClientOnly from '@/components/ClientOnly';
import { useSocket } from '@/lib/socket/SocketProvider';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { SOCKET_EVENTS } from '@/Constants';
import { apiClient } from '@/lib/api/client';

// How often the page directly polls the backend for ride status.
// Intentionally fast (3 s) while waiting for a driver — this is the
// most time-sensitive polling in the whole app.
const DRIVER_SEARCH_POLL_MS = 3_000;

export default function FindingDriverPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rideId       = searchParams.get('rideId');

  const { on: socketOn, off: socketOff } = useSocket();
  const { on: rnOn }                     = useReactNative();

  const {
    activeRide, ride,
    cancelRide,
    startPollingRideStatus, stopPollingRideStatus,
    loading,
  } = useRide();

  const [searchStage,      setSearchStage]      = useState('searching'); // searching | found | timeout
  const [countdown,        setCountdown]        = useState(60);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [canceling,        setCanceling]        = useState(false);
  const [snackbar,         setSnackbar]         = useState({ open: false, message: '', severity: 'info' });

  // We stash the found driver separately so the "found" panel always has data
  // regardless of whether activeRide has been updated yet.
  const [foundDriver,   setFoundDriver]   = useState(null);
  const [foundRideData, setFoundRideData] = useState(null);

  const currentRide     = activeRide || ride;
  const driver          = foundDriver  || currentRide?.driver;
  const displayRideData = foundRideData || currentRide;

  // Refs for cleanup
  const pollRef      = useRef(null);
  const mountedRef   = useRef(true);
  const resolvedRef  = useRef(false); // once we hit a terminal state, stop everything

  useEffect(() => {
    mountedRef.current  = true;
    resolvedRef.current = false;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Terminal-state helpers ────────────────────────────────────────────────
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
    setSnackbar({
      open: true,
      message: `${data?.driver?.firstName ?? 'Your driver'} is on the way!`,
      severity: 'success',
    });
    setTimeout(() => {
      router.push(`/tracking?rideId=${data?.rideId ?? rideId}`);
    }, 2500);
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

  // ══════════════════════════════════════════════════════════════════════════
  // DIRECT BACKEND POLLING
  // Independently polls GET /rides/:id every DRIVER_SEARCH_POLL_MS.
  // Does NOT rely on the hook updating activeRide — it reads the API response
  // directly and calls the terminal helpers.  This is the primary reliability
  // mechanism for the finding-driver flow.
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!rideId || searchStage !== 'searching') return;

    const poll = async () => {
      if (!mountedRef.current || resolvedRef.current) return;
      try {
        const res = await apiClient.get(
          `/rides/${rideId}?populate=driver.driverProfile,vehicle`
        );
        const data = res?.data ?? res;
        if (!data || !mountedRef.current || resolvedRef.current) return;

        switch (data.rideStatus) {
          case 'accepted':
            if (data.driver) {
              handleAccepted({
                driver:   data.driver,
                vehicle:  data.vehicle,
                rideId:   data.id ?? rideId,
                eta:      data.eta,
                distance: data.distance,
                ...data,
              });
            }
            break;
          case 'no_drivers_available':
            handleNoDrivers();
            break;
          case 'cancelled':
            handleCancelled({ reason: 'Ride was cancelled' });
            break;
          default:
            break;
        }
      } catch (err) {
        // Network hiccup — keep polling silently
        console.warn('[FindingDriver] poll error:', err.message);
      }
    };

    // Poll immediately, then on interval
    poll();
    pollRef.current = setInterval(poll, DRIVER_SEARCH_POLL_MS);

    return () => {
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [rideId, searchStage, handleAccepted, handleCancelled, handleNoDrivers]);

  // ── Also start the hook's polling as a supplementary layer ───────────────
  useEffect(() => {
    if (rideId && searchStage === 'searching') {
      startPollingRideStatus(rideId, 120);
    }
    return () => stopPollingRideStatus();
  }, [rideId, searchStage, startPollingRideStatus, stopPollingRideStatus]);

  // ── Hook state watcher (covers polling + socket updates in useRide) ───────
  useEffect(() => {
    if (!currentRide || resolvedRef.current) return;

    if (currentRide.rideStatus === 'accepted' && currentRide.driver) {
      handleAccepted({
        driver:   currentRide.driver,
        vehicle:  currentRide.vehicle,
        rideId:   currentRide.id ?? rideId,
        eta:      currentRide.eta,
        distance: currentRide.distance,
        ...currentRide,
      });
    } else if (currentRide.rideStatus === 'no_drivers_available') {
      handleNoDrivers();
    } else if (currentRide.rideStatus === 'cancelled') {
      handleCancelled({ reason: 'Ride was cancelled' });
    }
  }, [currentRide?.rideStatus, currentRide?.driver?.id, handleAccepted, handleCancelled, handleNoDrivers, rideId]);

  // ══════════════════════════════════════════════════════════════════════════
  // SOCKET.IO LISTENERS  (browser / PWA)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const onAccepted  = (data) => { if (String(data.rideId) !== String(rideId)) return; handleAccepted(data); };
    const onCancelled = (data) => { if (String(data.rideId) !== String(rideId)) return; handleCancelled(data); };

    socketOn(SOCKET_EVENTS.RIDE.ACCEPTED,  onAccepted);
    socketOn(SOCKET_EVENTS.RIDE.CANCELLED, onCancelled);
    return () => {
      socketOff(SOCKET_EVENTS.RIDE.ACCEPTED);
      socketOff(SOCKET_EVENTS.RIDE.CANCELLED);
    };
  }, [rideId, socketOn, socketOff, handleAccepted, handleCancelled]);

  // ══════════════════════════════════════════════════════════════════════════
  // REACT NATIVE BRIDGE LISTENERS
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const forThis = (p) => !p?.rideId || String(p.rideId) === String(rideId);

    const unsubAccepted  = rnOn('RIDE_ACCEPTED',  (p) => { if (!forThis(p)) return; handleAccepted({ driver: p.driver ?? currentRide?.driver, rideId: p.rideId ?? rideId, eta: p.eta, vehicle: p.vehicle, ...p }); });
    const unsubCancelled = rnOn('RIDE_CANCELLED', (p) => { if (!forThis(p)) return; handleCancelled(p); });
    const unsubTaken     = rnOn('RIDE_TAKEN',     (p) => { if (!forThis(p)) return; handleCancelled({ reason: 'Ride was taken by another driver' }); });

    return () => { unsubAccepted?.(); unsubCancelled?.(); unsubTaken?.(); };
  }, [rideId, rnOn, handleAccepted, handleCancelled, currentRide?.driver]);

  // ── Countdown (visual only — actual timeout is 120 polls × 3 s = 6 min) ──
  useEffect(() => {
    if (searchStage !== 'searching') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [searchStage]);

  // ── Cancel ────────────────────────────────────────────────────────────────
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

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <ClientOnly>
      <Box sx={{ minHeight:'100vh', display:'flex', flexDirection:'column', bgcolor:'background.default', p:3 }}>
        <AnimatePresence mode="wait">

          {/* ── SEARCHING ─────────────────────────────────────────────────── */}
          {searchStage === 'searching' && (
            <motion.div key="searching" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>

              <Box sx={{ width:280, height:280, mb:4, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                <motion.div animate={{ scale:[1,1.15,1], rotate:[0,5,-5,0] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}>
                  <Box sx={{ fontSize:'8rem', filter:'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}>🚗</Box>
                </motion.div>
                <Box sx={{ position:'absolute', bottom:20, display:'flex', gap:1 }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ scale:[1,1.5,1], opacity:[0.3,1,0.3] }} transition={{ duration:1.5, repeat:Infinity, delay:i*0.2 }}>
                      <Box sx={{ width:12, height:12, borderRadius:'50%', bgcolor:'primary.main' }} />
                    </motion.div>
                  ))}
                </Box>
              </Box>

              <Typography variant="h5" sx={{ fontWeight:700, mb:1, textAlign:'center',
                background:'linear-gradient(45deg, #FFC107 30%, #FF9800 90%)',
                backgroundClip:'text', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                Finding you a driver
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign:'center', mb:1 }}>
                Searching for nearby drivers…
              </Typography>
              {currentRide && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign:'center', mb:4 }}>
                  Ride #{currentRide.id?.toString().slice(-6) ?? rideId?.toString().slice(-6) ?? 'N/A'}
                </Typography>
              )}

              {/* Countdown circle */}
              <Box sx={{ position:'relative', display:'inline-flex', mb:6 }}>
                <CircularProgress variant="determinate" value={(countdown/60)*100} size={100} thickness={4}
                  sx={{ color:'primary.main', filter:'drop-shadow(0 4px 8px rgba(255,193,7,0.3))' }} />
                <Box sx={{ top:0,left:0,bottom:0,right:0,position:'absolute', display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column' }}>
                  <Typography variant="h5" component="div" fontWeight={700} color="primary">{countdown}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>seconds</Typography>
                </Box>
              </Box>

              {/* Polling indicator */}
              <Box sx={{ mb:3, display:'flex', alignItems:'center', gap:1 }}>
                <CircularProgress size={14} thickness={5} />
                <Typography variant="caption" color="text.secondary">Checking for drivers every 3 seconds…</Typography>
              </Box>

              <Box sx={{ mb:4, p:2, borderRadius:3, bgcolor:'action.hover', maxWidth:400, width:'100%' }}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  💡 <strong>Tip:</strong> We're notifying drivers within 5 km of your location
                </Typography>
              </Box>

              <Button variant="outlined" size="large" onClick={() => setShowCancelDialog(true)} disabled={canceling}
                sx={{ width:'100%', maxWidth:400, height:56, borderRadius:4, fontWeight:600, borderWidth:2, '&:hover':{ borderWidth:2 } }}>
                {canceling ? <CircularProgress size={24} /> : 'Cancel Request'}
              </Button>
            </motion.div>
          )}

          {/* ── DRIVER FOUND ──────────────────────────────────────────────── */}
          {searchStage === 'found' && driver && (
            <motion.div key="found" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>

              <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:260, damping:20 }}>
                <Box sx={{ width:120, height:120, borderRadius:'50%', bgcolor:'success.main', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem', color:'white', mb:3, boxShadow:'0 10px 30px rgba(76,175,80,0.4)' }}>
                  ✓
                </Box>
              </motion.div>

              <Typography variant="h4" sx={{ fontWeight:700, mb:1, color:'success.main' }}>Driver Found!</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb:4, textAlign:'center' }}>
                {driver.firstName} {driver.lastName} is coming to pick you up
              </Typography>

              <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.2 }} style={{ width:'100%', maxWidth:450 }}>
                <Box sx={{ p:3, borderRadius:4, bgcolor:'background.paper', boxShadow:'0 8px 32px rgba(0,0,0,0.12)', border:'1px solid', borderColor:'divider', mb:4 }}>
                  <Box sx={{ display:'flex', alignItems:'center', mb:3 }}>
                    <Avatar src={driver.profilePicture} sx={{ width:72, height:72, mr:2, border:'3px solid', borderColor:'primary.main' }}>{driver.firstName?.[0]}</Avatar>
                    <Box sx={{ flex:1 }}>
                      <Typography variant="h6" sx={{ fontWeight:700, mb:0.5 }}>{driver.firstName} {driver.lastName}</Typography>
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                        <StarIcon sx={{ fontSize:18, color:'warning.main' }} />
                        <Typography variant="body2" sx={{ fontWeight:600 }}>{driver.driverProfile?.averageRating || 4.8}</Typography>
                        <Typography variant="caption" color="text.secondary">({driver.driverProfile?.totalRatings || 0} ratings)</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{driver.driverProfile?.completedRides || 0} completed trips</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
                    <Box sx={{ p:2, borderRadius:2, bgcolor:'action.hover' }}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}><CarIcon sx={{ fontSize:18, color:'text.secondary' }} /><Typography variant="caption" color="text.secondary" fontWeight={600}>VEHICLE</Typography></Box>
                      <Typography variant="body2" sx={{ fontWeight:600, mb:0.5 }}>{displayRideData?.vehicle?.numberPlate || 'N/A'}</Typography>
                      <Typography variant="caption" color="text.secondary">{displayRideData?.vehicle?.color} {displayRideData?.vehicle?.make} {displayRideData?.vehicle?.model}</Typography>
                    </Box>
                    <Box sx={{ p:2, borderRadius:2, bgcolor:'primary.main', color:'white' }}>
                      <Typography variant="caption" sx={{ opacity:0.9, fontWeight:600 }}>ARRIVING IN</Typography>
                      <Typography variant="h5" sx={{ fontWeight:700, mt:0.5 }}>
                        {displayRideData?.eta ? `${Math.ceil(displayRideData.eta/60)} min` : '3-5 min'}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity:0.9 }}>
                        {displayRideData?.distance ? `${Number(displayRideData.distance).toFixed(1)} km away` : 'Nearby'}
                      </Typography>
                    </Box>
                  </Box>

                  {driver.phoneNumber && (
                    <Box sx={{ mt:2, p:2, borderRadius:2, border:'1px dashed', borderColor:'divider' }}>
                      <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight:600 }}>{driver.phoneNumber}</Typography>
                    </Box>
                  )}
                </Box>
              </motion.div>

              <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.4 }} style={{ width:'100%', maxWidth:450 }}>
                <Button fullWidth variant="contained" size="large"
                  onClick={() => router.push(`/tracking?rideId=${displayRideData?.id ?? rideId}`)}
                  sx={{ height:56, fontWeight:700, borderRadius:4, fontSize:'1rem', boxShadow:'0 4px 12px rgba(255,193,7,0.4)' }}>
                  Track Driver
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ── NO DRIVERS ────────────────────────────────────────────────── */}
          {searchStage === 'timeout' && (
            <motion.div key="timeout" initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>

              <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200, damping:15 }}>
                <Box sx={{ width:140, height:140, borderRadius:'50%', bgcolor:'error.light', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem', mb:3, boxShadow:'0 10px 30px rgba(244,67,54,0.2)' }}>😔</Box>
              </motion.div>

              <Typography variant="h5" sx={{ fontWeight:700, mb:1, textAlign:'center' }}>No Drivers Available</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign:'center', mb:1, maxWidth:350 }}>We couldn't find any drivers nearby right now.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign:'center', mb:4, maxWidth:350 }}>Please try again in a few minutes.</Typography>

              <Box sx={{ mb:4, p:2.5, borderRadius:3, bgcolor:'info.light', maxWidth:400, width:'100%' }}>
                <Typography variant="body2" fontWeight={600} color="info.dark" gutterBottom>💡 Tips to increase your chances:</Typography>
                <Typography variant="caption" color="info.dark" component="div" sx={{ mt:1 }}>• Try booking during peak hours (7–9 AM, 5–7 PM)</Typography>
                <Typography variant="caption" color="info.dark" component="div">• Move to a more accessible pickup location</Typography>
                <Typography variant="caption" color="info.dark" component="div">• Consider scheduling a ride in advance</Typography>
              </Box>

              <Box sx={{ width:'100%', maxWidth:400, display:'flex', flexDirection:'column', gap:2 }}>
                <Button fullWidth variant="contained" size="large" onClick={() => router.push('/home')} sx={{ height:56, fontWeight:700, borderRadius:4 }}>Try Again</Button>
                <Button fullWidth variant="outlined" size="large" onClick={() => router.push('/home')} sx={{ height:56, fontWeight:600, borderRadius:4 }}>Back to Home</Button>
              </Box>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} PaperProps={{ sx:{ borderRadius:4, maxWidth:400 } }}>
          <DialogTitle sx={{ fontWeight:700 }}>
            Cancel Ride Request?
            <IconButton onClick={() => setShowCancelDialog(false)} sx={{ position:'absolute', right:8, top:8 }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent><Typography variant="body2" color="text.secondary">Are you sure you want to cancel this ride request?</Typography></DialogContent>
          <DialogActions sx={{ p:2.5, pt:1 }}>
            <Button onClick={() => setShowCancelDialog(false)} variant="outlined" sx={{ borderRadius:2, px:3 }}>Keep Searching</Button>
            <Button onClick={handleCancelRequest} variant="contained" color="error" disabled={canceling} sx={{ borderRadius:2, px:3 }}>
              {canceling ? <CircularProgress size={20} /> : 'Yes, Cancel'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s=>({...s,open:false}))} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
          <Alert onClose={() => setSnackbar(s=>({...s,open:false}))} severity={snackbar.severity} sx={{ width:'100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </ClientOnly>
  );
}