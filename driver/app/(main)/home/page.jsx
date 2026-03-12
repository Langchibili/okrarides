// //Okra\Okrarides\driver\app\(main)\home\page.jsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box, AppBar, Toolbar, Typography, Grid, IconButton,
//   Button, Alert, Paper, Chip,
// } from '@mui/material';
// import {
//   Menu as MenuIcon,
//   Notifications as NotificationsIcon,
//   LocalAtm as EarningsIcon,
//   DirectionsCar as RidesIcon,
//   Star as StarIcon,
//   Speed as SpeedIcon,
//   History as HistoryIcon,
//   AccountBalanceWallet as WalletIcon,
//   Warning as WarningIcon,
//   TrendingDown as FloatLowIcon,
//   Schedule as ExpiryIcon,
//   Savings as SavingsIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { OnlineToggle } from '@/components/Driver/OnlineToggle';
// import { EarningsCard } from '@/components/Driver/EarningsCard';
// import { StatCard } from '@/components/Driver/StatCard';
// import { RideRequestModal } from '@/components/Driver/RideRequestModal';
// import { useDriver } from '@/lib/hooks/useDriver';
// import { useRide } from '@/lib/hooks/useRide';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// import { formatCurrency } from '@/Functions';
// import { VERIFICATION_STATUS } from '@/Constants';
// import useAuthGuard from '@/lib/hooks/useAuthGuard';
// import ClientOnly from '@/components/ClientOnly';  // FIX 1: import ClientOnly
// import { useDriverStats } from '@/lib/hooks/useDriverStats';

// export default function DriverHomePage() {
//   const router = useRouter();
//   const {
//     driverProfile,
//     isOnline,
//     toggleOnline,
//     needsVerification,
//     needsVehicle,
//     needsSubscription,
//     paymentSystemType,
//     loadingDriverProfile
//   } = useDriver();

//   const {
//     isNegativeFloatAllowed,
//     negativeFloatLimit,
//     minimumFloatTopup,
//     defaultCommissionPercentage,
//     isFloatSystemEnabled,
//     isSubscriptionSystemEnabled,
//   } = useAdminSettings();

//   const { user } = useAuthGuard({
//     requireAuth: true,
//     requireVerification: true,
//     redirectTo: '/home',
//   });

//   const { incomingRide, currentRide, acceptRide, declineRide } = useRide();
//   const { isNative, getCurrentLocation } = useReactNative();
//   const [loading, setLoading] = useState(true);
//   const [mapControls, setMapControls] = useState(null);
//   const [currentLocation, setCurrentLocation] = useState(null);  // FIX 2: drives center prop
//   const { summary, lifetime, loading: statsLoading, fetchStats } = useDriverStats();

//   useEffect(() => {
//     loadDriverStats();
//     requestLocationOnMount();
//   }, []);

//   // FIX 3: When mapControls becomes available AND we already have a location,
//   // animate to it. Mirrors how the rider home handles this — location state is
//   // set first, then the map animates once controls are ready.
//   useEffect(() => {
//     if (mapControls && currentLocation) {
//       mapControls.animateToLocation(currentLocation, 16);
//     }
//   }, [mapControls, currentLocation]);

//   const loadDriverStats = async () => {
//     try {
//       const response = await fetchStats('today');
//       console.log('stats',response)
//       if (response.success) setStats(response.stats);
//     } catch (error) {
//       console.error('Error loading stats:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const requestLocationOnMount = async () => {
//     try {
//       if (isNative) {
//         // FIX 4: .catch(() => null) so an unhandled rejection never propagates
//         // up into useAuthGuard and causes the render loop that keeps
//         // MapsProvider stuck at ready:false.
//         const location = await getCurrentLocation().catch(() => null);
//         if (location) {
//           setCurrentLocation({ lat: location.lat, lng: location.lng });
//           // mapControls may not exist yet — the useEffect above will animate
//           // once mapControls is set (FIX 3).
//           return;
//         }
//       }

//       // Web geolocation fallback
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           ({ coords }) => {
//             setCurrentLocation({ lat: coords.latitude, lng: coords.longitude });
//             // same as above — useEffect (FIX 3) handles the animate call
//           },
//           (error) => console.error('Location error:', error),
//           { enableHighAccuracy: true, timeout: 10000 },
//         );
//       }
//     } catch (error) {
//       console.error('Error requesting location:', error);
//     }
//   };

//   const handleToggleOnline = async () => {
//     try {
//       const result = await toggleOnline(!isOnline);
//       if (!result.allowed) {
//         if (result.action === 'subscribe') {
//           if (window.confirm(result.message + '\n\nView plans?')) router.push('/subscription/plans');
//         } else if (result.action === 'topup_float') {
//           if (window.confirm(result.message + '\n\nTop up now?')) router.push('/float/topup');
//         }
//       }
//     } catch (error) {
//       console.error('Error toggling online:', error);
//     }
//   };

//   const handleAcceptRide = async (rideId) => {
//     try {
//       await acceptRide(rideId);
//       router.push(`/active-ride/${rideId}`);
//     } catch (error) {
//       console.error('Error accepting ride:', error);
//     }
//   };

//   const handleDeclineRide = async (rideId) => {
//     try {
//       await declineRide(rideId, 'Driver declined');
//     } catch (error) {
//       console.error('Error declining ride:', error);
//     }
//   };
  
//   console.log('driverProfile',driverProfile)
//   // ─── Driver-level payment mode ─────────────────────────────────────────────
//   const subscriptionStatus = driverProfile?.subscriptionStatus;
//   const subscriptionExpiresAt = driverProfile?.currentSubscription?.expiresAt;

//   const isOnSubscriptionSystem =
//     paymentSystemType === 'subscription_based' ||
//     (paymentSystemType === 'hybrid' && ['active', 'trial'].includes(subscriptionStatus));

//   const isOnFloatSystem =
//     paymentSystemType === 'float_based' ||
//     (paymentSystemType === 'hybrid' && !['active', 'trial'].includes(subscriptionStatus));

//   // ─── Subscription alert conditions ────────────────────────────────────────
//   const daysUntilExpiry = subscriptionExpiresAt
//     ? Math.floor((new Date(subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
//     : null;
//   const isSubscriptionExpired = ['expired', 'cancelled'].includes(subscriptionStatus);
//   const isSubscriptionExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
//   const isOnTrial = subscriptionStatus === 'trial';

//   // ─── Float alert conditions ────────────────────────────────────────────────
//   const floatBalance = driverProfile?.floatBalance || 0;
//   const isFloatNegative = floatBalance < 0;
//   const isFloatAtLimit =
//     isFloatNegative && negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit;
//   const isFloatLow = !isFloatNegative && floatBalance < minimumFloatTopup * 2 && floatBalance > 0;

//   // ─── Alert visibility flags ───────────────────────────────────────────────
//   const showVerificationAlert = needsVerification || needsVehicle;

//   const showSubscriptionRequiredAlert =
//     !showVerificationAlert &&
//     paymentSystemType === 'subscription_based' &&
//     needsSubscription;

//   const showSubscriptionExpiryAlert =
//     !showVerificationAlert &&
//     isOnSubscriptionSystem &&
//     (isSubscriptionExpired || isSubscriptionExpiringSoon);

//   const showFloatBlockedAlert =
//     !showVerificationAlert &&
//     isOnFloatSystem &&
//     (isFloatAtLimit || (isFloatNegative && !isNegativeFloatAllowed));

//   const showFloatLowAlert =
//     !showVerificationAlert &&
//     isOnFloatSystem &&
//     isFloatLow;

//   const showFloatNegativeWarning =
//     !showVerificationAlert &&
//     isOnFloatSystem &&
//     isFloatNegative &&
//     !isFloatAtLimit &&
//     isNegativeFloatAllowed;

//   const showFloatWithdrawableNotice =
//     !showVerificationAlert &&
//     isOnSubscriptionSystem &&
//     floatBalance > 0;
  
//   if(!loadingDriverProfile) {} 
//   return (
//     // FIX 1: ClientOnly prevents SSR hydration mismatches that cause extra
//     // re-renders which previously kept MapsProvider stuck at ready:false.
//     <ClientOnly>
//       <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
//         <AppBar position="static" elevation={0}>
//           <Toolbar>
//             <IconButton edge="start" color="inherit"><MenuIcon /></IconButton>
//             <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>Dashboard</Typography>
//             <IconButton color="inherit"><NotificationsIcon /></IconButton>
//           </Toolbar>
//         </AppBar>

//         <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>

//           {/* 1. Verification Required */}
//           {showVerificationAlert && (
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}
//                 action={<Button color="inherit" size="small" onClick={() => router.push('/verification')}>Complete</Button>}
//               >
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Verification Required</Typography>
//                 <Typography variant="body2">
//                   {needsVerification && 'Complete your verification before accepting rides. '}
//                   {needsVehicle && 'Add your vehicle information to continue.'}
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* 2. Subscription Required */}
//           {showSubscriptionRequiredAlert && (
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity="info" sx={{ mb: 2 }}
//                 action={<Button color="inherit" size="small" onClick={() => router.push('/subscription/plans')}>Subscribe</Button>}
//               >
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Subscription Required</Typography>
//                 <Typography variant="body2">
//                   Subscribe to a plan to start accepting rides and keep 100% of your earnings.
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* 3. Subscription Expiry Warning */}
//           {showSubscriptionExpiryAlert && (
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity={isSubscriptionExpired ? 'error' : 'warning'}
//                 icon={<ExpiryIcon />} sx={{ mb: 2 }}
//                 action={
//                   <Button color="inherit" size="small" onClick={() => router.push('/subscription/plans')}>
//                     {isSubscriptionExpired ? 'Renew Now' : 'View Plan'}
//                   </Button>
//                 }
//               >
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
//                   {isSubscriptionExpired
//                     ? 'Subscription Expired'
//                     : isOnTrial
//                     ? `Trial Ends in ${daysUntilExpiry} Day${daysUntilExpiry !== 1 ? 's' : ''}`
//                     : `Subscription Expiring in ${daysUntilExpiry} Day${daysUntilExpiry !== 1 ? 's' : ''}`}
//                 </Typography>
//                 <Typography variant="body2">
//                   {isSubscriptionExpired
//                     ? 'Your subscription has expired. Renew to keep accepting rides at zero commission.'
//                     : isOnTrial
//                     ? 'Your free trial ends soon. Subscribe to continue enjoying 0% commission.'
//                     : 'Renew before it expires to avoid interruption.'}
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* 4. Float Blocked */}
//           {showFloatBlockedAlert && (
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity="error" icon={<FloatLowIcon />} sx={{ mb: 2 }}
//                 action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}
//               >
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Float Balance Blocked</Typography>
//                 <Typography variant="body2">
//                   Your float balance is {formatCurrency(floatBalance)} and you cannot accept cash rides until you top up.{' '}
//                   {isFloatAtLimit && `You have exceeded the negative limit of ${formatCurrency(-negativeFloatLimit)}.`}
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* 5. Float Negative (within limit) */}
//           {showFloatNegativeWarning && (
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity="warning" icon={<FloatLowIcon />} sx={{ mb: 2 }}
//                 action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}
//               >
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Negative Float Balance</Typography>
//                 <Typography variant="body2">
//                   Your float is {formatCurrency(floatBalance)}.{' '}
//                   {negativeFloatLimit > 0
//                     ? `You can go down to ${formatCurrency(-negativeFloatLimit)} before being blocked.`
//                     : 'Top up to maintain a healthy balance.'}
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* 6. Float Low */}
//           {showFloatLowAlert && (
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity="warning" sx={{ mb: 2 }}
//                 action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}
//               >
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Float Balance Low</Typography>
//                 <Typography variant="body2">
//                   Your float balance is {formatCurrency(floatBalance)}. Top up soon to avoid interruptions.
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* 7. Withdrawable Float (subscription drivers) */}
//           {showFloatWithdrawableNotice && (
//             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity="success" icon={<SavingsIcon />} sx={{ mb: 2 }}
//                 action={<Button color="inherit" size="small" onClick={() => router.push('/float')}>Withdraw</Button>}
//               >
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>You Have Float to Withdraw</Typography>
//                 <Typography variant="body2">
//                   You have {formatCurrency(floatBalance)} in your float. Since you're on a subscription
//                   plan, this can be withdrawn at any time.
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* Payment System Banner */}
//           {driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED && (
//             <Paper
//               elevation={0}
//               sx={{
//                 p: 1.5, mb: 2, borderRadius: 2,
//                 bgcolor: isOnSubscriptionSystem ? 'success.light' : 'info.light',
//                 border: 1,
//                 borderColor: isOnSubscriptionSystem ? 'success.main' : 'info.main',
//               }}
//             >
//               <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                 <Typography
//                   variant="body2"
//                   sx={{ fontWeight: 600, color: isOnSubscriptionSystem ? 'success.dark' : 'info.dark' }}
//                 >
//                   💰{' '}
//                   {paymentSystemType === 'subscription_based'
//                     ? '0% Commission — Subscription Plan'
//                     : paymentSystemType === 'float_based'
//                     ? `Float System — ${defaultCommissionPercentage}% Commission on Cash Rides`
//                     : isOnSubscriptionSystem
//                     ? '0% Commission — Active Subscription'
//                     : `Hybrid — ${defaultCommissionPercentage}% Commission (no active subscription)`}
//                 </Typography>
//                 {isOnFloatSystem && (
//                   <Chip
//                     label={`Float: ${formatCurrency(floatBalance)}`}
//                     size="small"
//                     color={isFloatNegative ? 'error' : isFloatLow ? 'warning' : 'success'}
//                     onClick={() => router.push('/float')}
//                     sx={{ cursor: 'pointer', fontWeight: 600 }}
//                   />
//                 )}
//               </Box>
//             </Paper>
//           )}

//           {/* Online Toggle */}
//           <OnlineToggle
//             isSubscriptionSystemEnabled={isSubscriptionSystemEnabled}
//             isOnline={isOnline}
//             subscriptionStatus={driverProfile?.currentSubscription}
//             onToggle={handleToggleOnline}
//             disabled={showVerificationAlert || showFloatBlockedAlert || showSubscriptionRequiredAlert}
//           />

//           {/* Stats Grid */}
          
//         <Grid container spacing={2} sx={{ mb: 2 }}>
//           <Grid item xs={6}>
//             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
//               <EarningsCard
//                 title="Today's Earnings"
//                 amount={summary.totalEarnings}
//                 icon={<EarningsIcon sx={{ color: 'earnings.dark' }} />}
//                 color="earnings"
//                 onClick={() => router.push('/earnings')}
//               />
//             </motion.div>
//           </Grid>

//           <Grid item xs={6}>
//             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
//               <StatCard
//                 title="Rides Today"
//                 value={summary.completedRides}
//                 icon={<RidesIcon sx={{ color: 'primary.dark' }} />}
//                 color="primary"
//               />
//             </motion.div>
//           </Grid>

//           <Grid item xs={6}>
//             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
//               <StatCard
//                 title="Rating"
//                 value={lifetime.averageRating.toFixed(1)}
//                 icon={<StarIcon sx={{ color: 'warning.dark' }} />}
//                 color="warning"
//               />
//             </motion.div>
//           </Grid>

//           <Grid item xs={6}>
//             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
//               <StatCard
//                 title="Acceptance"
//                 value={`${summary.acceptanceRate}%`}
//                 icon={<SpeedIcon sx={{ color: 'info.dark' }} />}
//                 color="info"
//               />
//             </motion.div>
//           </Grid>
//         </Grid>

//           {/* Map Preview */}
//           {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
//             <Box sx={{ height: 200, borderRadius: 3, overflow: 'hidden', mb: 2 }}>
//               <MapIframe
//                 // FIX 2: currentLocation drives center prop — map re-renders to the
//                 // right spot automatically without relying on mapControls being ready.
//                 center={currentLocation || { lat: -15.4167, lng: 28.2833 }}
//                 zoom={13}
//                 height="200px"
//                 onMapLoad={setMapControls}
//               />
//             </Box>
//           </motion.div> */}

//           {/* Quick Actions */}
//           <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
//             <Button variant="outlined" fullWidth startIcon={<HistoryIcon />} onClick={() => router.push('/rides')}>
//               Ride History
//             </Button>
//             <Button variant="outlined" fullWidth startIcon={<WalletIcon />} onClick={() => router.push('/earnings')}>
//               Earnings
//             </Button>
//           </Box>

//           {/* Float / Subscription row */}
//           <Box sx={{ display: 'flex', gap: 1 }}>
//             {isFloatSystemEnabled && (
//               <Button
//                 variant={isFloatNegative || isFloatLow ? 'contained' : 'outlined'}
//                 fullWidth
//                 color={isFloatNegative ? 'error' : isFloatLow ? 'warning' : 'inherit'}
//                 startIcon={<WalletIcon />}
//                 onClick={() => router.push('/float')}
//               >
//                 Float: {formatCurrency(floatBalance)}
//               </Button>
//             )}
//             {isSubscriptionSystemEnabled && (
//               <Button
//                 variant="outlined"
//                 fullWidth
//                 color={isSubscriptionExpired ? 'error' : isSubscriptionExpiringSoon ? 'warning' : 'inherit'}
//                 onClick={() => router.push('/subscription/plans')}
//               >
//                 {isSubscriptionExpired
//                   ? 'Renew Plan'
//                   : ['active', 'trial'].includes(subscriptionStatus)
//                   ? `Plan: ${daysUntilExpiry}d left`
//                   : 'View Plans'}
//               </Button>
//             )}
//           </Box>
//         </Box>

//         <AnimatePresence>
//           {incomingRide && (
//             <RideRequestModal
//               open={!!incomingRide}
//               rideRequest={incomingRide}
//               onAccept={handleAcceptRide}
//               onDecline={handleDeclineRide}
//             />
//           )}
//         </AnimatePresence>
//       </Box>
//     </ClientOnly>
//   );
// }
// PATH: app/(main)/home/page.jsx
'use client';

import { useState, useEffect }  from 'react';
import { useRouter }            from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Grid, IconButton,
  Button, Alert, Paper, Chip,
} from '@mui/material';
import { alpha, useTheme }      from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  LocalAtm as EarningsIcon,
  DirectionsCar as RidesIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
  TrendingDown as FloatLowIcon,
  Schedule as ExpiryIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { OnlineToggle }     from '@/components/Driver/OnlineToggle';
import { EarningsCard }     from '@/components/Driver/EarningsCard';
import { StatCard }         from '@/components/Driver/StatCard';
import { RideRequestModal } from '@/components/Driver/RideRequestModal';
import { HomePageSkeleton } from '@/components/Skeletons/HomePageSkeleton';

import { useDriver }       from '@/lib/hooks/useDriver';
import { useRide }         from '@/lib/hooks/useRide';
import { useReactNative }  from '@/lib/contexts/ReactNativeWrapper';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { useDriverStats }  from '@/lib/hooks/useDriverStats';
import { formatCurrency }  from '@/Functions';
import { VERIFICATION_STATUS } from '@/Constants';
import useAuthGuard        from '@/lib/hooks/useAuthGuard';
import ClientOnly          from '@/components/ClientOnly';

// ── Scroll-hide helper ────────────────────────────────────────────────────
const hideScrollbar = {
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
};

export default function DriverHomePage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    driverProfile, isOnline, toggleOnline,
    needsVerification, needsVehicle, needsSubscription,
    paymentSystemType, loadingDriverProfile,
  } = useDriver();

  const {
    isNegativeFloatAllowed, negativeFloatLimit, minimumFloatTopup,
    defaultCommissionPercentage, isFloatSystemEnabled, isSubscriptionSystemEnabled,
  } = useAdminSettings();

  const { user } = useAuthGuard({ requireAuth: true, requireVerification: true, redirectTo: '/home' });
  const { incomingRide, acceptRide, declineRide } = useRide();
  const { isNative, getCurrentLocation } = useReactNative();
  const { summary, lifetime, loading: statsLoading, fetchStats } = useDriverStats();

  const [mapControls, setMapControls]       = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    fetchStats('today');
    requestLocationOnMount();
  }, []);

  useEffect(() => {
    if (mapControls && currentLocation) mapControls.animateToLocation(currentLocation, 16);
  }, [mapControls, currentLocation]);

  const requestLocationOnMount = async () => {
    try {
      if (isNative) {
        const location = await getCurrentLocation().catch(() => null);
        if (location) { setCurrentLocation({ lat: location.lat, lng: location.lng }); return; }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => setCurrentLocation({ lat: coords.latitude, lng: coords.longitude }),
          (e) => console.error('Location error:', e),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
    } catch (e) { console.error('Error requesting location:', e); }
  };

  const handleToggleOnline = async () => {
    try {
      const result = await toggleOnline(!isOnline);
      if (!result.allowed) {
        if (result.action === 'subscribe') {
          if (window.confirm(result.message + '\n\nView plans?')) router.push('/subscription/plans');
        } else if (result.action === 'topup_float') {
          if (window.confirm(result.message + '\n\nTop up now?')) router.push('/float/topup');
        }
      }
    } catch (e) { console.error('Error toggling online:', e); }
  };

  const handleAcceptRide  = async (rideId) => { try { await acceptRide(rideId);  router.push(`/active-ride/${rideId}`); } catch (e) { console.error(e); } };
  const handleDeclineRide = async (rideId) => { try { await declineRide(rideId, 'Driver declined'); } catch (e) { console.error(e); } };

  // ── Payment mode ──────────────────────────────────────────────────────
  const subscriptionStatus   = driverProfile?.subscriptionStatus;
  const subscriptionExpiresAt = driverProfile?.currentSubscription?.expiresAt;

  const isOnSubscriptionSystem =
    paymentSystemType === 'subscription_based' ||
    (paymentSystemType === 'hybrid' && ['active', 'trial'].includes(subscriptionStatus));
  const isOnFloatSystem =
    paymentSystemType === 'float_based' ||
    (paymentSystemType === 'hybrid' && !['active', 'trial'].includes(subscriptionStatus));

  const daysUntilExpiry = subscriptionExpiresAt
    ? Math.floor((new Date(subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isSubscriptionExpired     = ['expired', 'cancelled'].includes(subscriptionStatus);
  const isSubscriptionExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  const isOnTrial = subscriptionStatus === 'trial';

  const floatBalance    = driverProfile?.floatBalance || 0;
  const isFloatNegative = floatBalance < 0;
  const isFloatAtLimit  = isFloatNegative && negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit;
  const isFloatLow      = !isFloatNegative && floatBalance < minimumFloatTopup * 2 && floatBalance > 0;

  const showVerificationAlert         = needsVerification || needsVehicle;
  const showSubscriptionRequiredAlert = !showVerificationAlert && paymentSystemType === 'subscription_based' && needsSubscription;
  const showSubscriptionExpiryAlert   = !showVerificationAlert && isOnSubscriptionSystem && (isSubscriptionExpired || isSubscriptionExpiringSoon);
  const showFloatBlockedAlert         = !showVerificationAlert && isOnFloatSystem && (isFloatAtLimit || (isFloatNegative && !isNegativeFloatAllowed));
  const showFloatLowAlert             = !showVerificationAlert && isOnFloatSystem && isFloatLow;
  const showFloatNegativeWarning      = !showVerificationAlert && isOnFloatSystem && isFloatNegative && !isFloatAtLimit && isNegativeFloatAllowed;
  const showFloatWithdrawableNotice   = !showVerificationAlert && isOnSubscriptionSystem && floatBalance > 0;

  const isBooting = loadingDriverProfile;

  const alertVariants = {
    hidden: { opacity: 0, y: -12, height: 0 },
    show:   { opacity: 1, y: 0,   height: 'auto', transition: { type: 'spring', stiffness: 300, damping: 28 } },
    exit:   { opacity: 0, y: -8,  height: 0 },
  };

  return (
    <ClientOnly>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

        {/* ── AppBar ───────────────────────────────────────────────────── */}
        <AppBar position="static" elevation={0} sx={{
          background: isDark
            ? `linear-gradient(135deg, ${alpha('#1E293B', 0.98)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          backdropFilter: 'blur(12px)',
        }}>
          <Toolbar>
            <IconButton edge="start" color="inherit"><MenuIcon /></IconButton>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, letterSpacing: -0.3 }}>Dashboard</Typography>
            <IconButton color="inherit"><NotificationsIcon /></IconButton>
          </Toolbar>
        </AppBar>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 10, ...hideScrollbar }}>

          {isBooting ? (
            <HomePageSkeleton />
          ) : (
            <>
              {/* Alerts */}
              <AnimatePresence initial={false}>
                {showVerificationAlert && (
                  <motion.div key="verify" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 1.5, borderRadius: 2 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/verification')}>Complete</Button>}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Verification Required</Typography>
                      <Typography variant="body2">
                        {needsVerification && 'Complete your verification before accepting rides. '}
                        {needsVehicle && 'Add your vehicle information to continue.'}
                      </Typography>
                    </Alert>
                  </motion.div>
                )}

                {showSubscriptionRequiredAlert && (
                  <motion.div key="sub-req" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/subscription/plans')}>Subscribe</Button>}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Subscription Required</Typography>
                      <Typography variant="body2">Subscribe to a plan to start accepting rides and keep 100% of your earnings.</Typography>
                    </Alert>
                  </motion.div>
                )}

                {showSubscriptionExpiryAlert && (
                  <motion.div key="sub-exp" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity={isSubscriptionExpired ? 'error' : 'warning'} icon={<ExpiryIcon />} sx={{ mb: 1.5, borderRadius: 2 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/subscription/plans')}>{isSubscriptionExpired ? 'Renew Now' : 'View Plan'}</Button>}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {isSubscriptionExpired ? 'Subscription Expired' : isOnTrial ? `Trial Ends in ${daysUntilExpiry}d` : `Expiring in ${daysUntilExpiry}d`}
                      </Typography>
                      <Typography variant="body2">
                        {isSubscriptionExpired ? 'Renew to keep accepting rides at zero commission.'
                          : isOnTrial ? 'Subscribe to continue enjoying 0% commission.'
                          : 'Renew before it expires to avoid interruption.'}
                      </Typography>
                    </Alert>
                  </motion.div>
                )}

                {showFloatBlockedAlert && (
                  <motion.div key="float-blocked" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="error" icon={<FloatLowIcon />} sx={{ mb: 1.5, borderRadius: 2 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Float Balance Blocked</Typography>
                      <Typography variant="body2">
                        Your float is {formatCurrency(floatBalance)}.{' '}
                        {isFloatAtLimit && `Exceeded limit of ${formatCurrency(-negativeFloatLimit)}.`}
                      </Typography>
                    </Alert>
                  </motion.div>
                )}

                {showFloatNegativeWarning && (
                  <motion.div key="float-neg" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="warning" icon={<FloatLowIcon />} sx={{ mb: 1.5, borderRadius: 2 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Negative Float Balance</Typography>
                      <Typography variant="body2">
                        Float: {formatCurrency(floatBalance)}.{' '}
                        {negativeFloatLimit > 0 ? `Limit: ${formatCurrency(-negativeFloatLimit)}.` : 'Top up to maintain balance.'}
                      </Typography>
                    </Alert>
                  </motion.div>
                )}

                {showFloatLowAlert && (
                  <motion.div key="float-low" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Float Balance Low</Typography>
                      <Typography variant="body2">Balance: {formatCurrency(floatBalance)}. Top up soon to avoid interruptions.</Typography>
                    </Alert>
                  </motion.div>
                )}

                {showFloatWithdrawableNotice && (
                  <motion.div key="float-withdraw" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="success" icon={<SavingsIcon />} sx={{ mb: 1.5, borderRadius: 2 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/float')}>Withdraw</Button>}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Float Available to Withdraw</Typography>
                      <Typography variant="body2">{formatCurrency(floatBalance)} available — subscription plan lets you withdraw anytime.</Typography>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Payment banner ─────────────────────────────────────── */}
              {driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Paper elevation={0} sx={{
                    p: 1.5, mb: 1.5, borderRadius: 2.5,
                    background: isOnSubscriptionSystem
                      ? `linear-gradient(135deg, ${alpha('#10B981', isDark ? 0.2 : 0.08)} 0%, ${alpha('#047857', isDark ? 0.12 : 0.04)} 100%)`
                      : `linear-gradient(135deg, ${alpha('#3B82F6', isDark ? 0.2 : 0.08)} 0%, ${alpha('#1D4ED8', isDark ? 0.12 : 0.04)} 100%)`,
                    border: `1px solid ${alpha(isOnSubscriptionSystem ? '#10B981' : '#3B82F6', isDark ? 0.3 : 0.18)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isOnSubscriptionSystem ? 'success.main' : 'info.main', fontSize: 12 }}>
                      💰{' '}
                      {paymentSystemType === 'subscription_based' ? '0% Commission — Subscription Plan'
                        : paymentSystemType === 'float_based' ? `Float — ${defaultCommissionPercentage}% Commission`
                        : isOnSubscriptionSystem ? '0% Commission — Active Subscription'
                        : `Hybrid — ${defaultCommissionPercentage}% Commission`}
                    </Typography>
                    {isOnFloatSystem && (
                      <Chip
                        label={`Float: ${formatCurrency(floatBalance)}`}
                        size="small"
                        color={isFloatNegative ? 'error' : isFloatLow ? 'warning' : 'success'}
                        onClick={() => router.push('/float')}
                        sx={{ cursor: 'pointer', fontWeight: 700, height: 24 }}
                      />
                    )}
                  </Paper>
                </motion.div>
              )}

              {/* ── Online Toggle ───────────────────────────────────────── */}
              <OnlineToggle
                isSubscriptionSystemEnabled={isSubscriptionSystemEnabled}
                isOnline={isOnline}
                subscriptionStatus={driverProfile?.currentSubscription}
                onToggle={handleToggleOnline}
                disabled={showVerificationAlert || showFloatBlockedAlert || showSubscriptionRequiredAlert}
              />

              {/* ── Stats Grid ─────────────────────────────────────────── */}
              <Box
  sx={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridAutoRows: '1fr',        // ← forces every row to equal height
    gap: 1.5,
    mb: 1.5,
    '& > *': {                  // every direct child fills its cell
      minWidth: 0,
      minHeight: 0,
    },
  }}
>
                {[
                  {
                    el: <EarningsCard title="Today's Earnings" amount={summary.totalEarnings}
                          icon={<EarningsIcon />} color="earnings"
                          onClick={() => router.push('/earnings')} />,
                    delay: 0.08,
                  },
                  {
                    el: <StatCard title="Rides Today" value={summary.completedRides}
                          icon={<RidesIcon />} color="primary" />,
                    delay: 0.14,
                  },
                  {
                    el: <StatCard title="Rating" value={lifetime.averageRating.toFixed(1)}
                          icon={<StarIcon />} color="warning" />,
                    delay: 0.20,
                  },
                  {
                    el: <StatCard title="Acceptance" value={`${summary.acceptanceRate}%`}
                          icon={<SpeedIcon />} color="info" />,
                    delay: 0.26,
                  },
                ].map(({ el, delay }, i) => (
                  <Grid item xs={6} key={i}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 24, delay }}
                      style={{ height: '100%' }}
                    >
                      {el}
                    </motion.div>
                  </Grid>
                ))}
              </Box>

              {/* ── Quick Actions ───────────────────────────────────────── */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                {[
                  { label: 'Ride History', icon: <HistoryIcon />, path: '/rides'    },
                  { label: 'Earnings',     icon: <WalletIcon />,  path: '/earnings' },
                ].map(({ label, icon, path }, i) => (
                  <motion.div key={label} style={{ flex: 1 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                  >
                    <Button variant="outlined" fullWidth startIcon={icon}
                      onClick={() => router.push(path)}
                      sx={{ borderRadius: 2.5, height: 44, fontWeight: 600, textTransform: 'none' }}>
                      {label}
                    </Button>
                  </motion.div>
                ))}
              </Box>

              {/* ── Float / Subscription row ────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
              >
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {isFloatSystemEnabled && (
                    <Button
                      variant={isFloatNegative || isFloatLow ? 'contained' : 'outlined'}
                      fullWidth
                      color={isFloatNegative ? 'error' : isFloatLow ? 'warning' : 'inherit'}
                      startIcon={<WalletIcon />}
                      onClick={() => router.push('/float')}
                      sx={{ borderRadius: 2.5, height: 44, fontWeight: 600, textTransform: 'none', flex: 1 }}
                    >
                      Float: {formatCurrency(floatBalance)}
                    </Button>
                  )}
                  {isSubscriptionSystemEnabled && (
                    <Button
                      variant="outlined" fullWidth
                      color={isSubscriptionExpired ? 'error' : isSubscriptionExpiringSoon ? 'warning' : 'inherit'}
                      onClick={() => router.push('/subscription/plans')}
                      sx={{ borderRadius: 2.5, height: 44, fontWeight: 600, textTransform: 'none', flex: 1 }}
                    >
                      {isSubscriptionExpired ? 'Renew Plan'
                        : ['active', 'trial'].includes(subscriptionStatus) ? `Plan: ${daysUntilExpiry}d left`
                        : 'View Plans'}
                    </Button>
                  )}
                </Box>
              </motion.div>
            </>
          )}
        </Box>

        <AnimatePresence>
          {incomingRide && (
            <RideRequestModal
              open={!!incomingRide}
              rideRequest={incomingRide}
              onAccept={handleAcceptRide}
              onDecline={handleDeclineRide}
            />
          )}
        </AnimatePresence>
      </Box>
    </ClientOnly>
  );
}