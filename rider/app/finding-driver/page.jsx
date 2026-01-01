// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Button,
//   CircularProgress,
//   Avatar,
// } from '@mui/material';
// import { motion, AnimatePresence } from 'framer-motion';

// export default function FindingDriverPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [searchStage, setSearchStage] = useState('searching'); // searching, found, timeout
//   const [driver, setDriver] = useState(null);
//   const [countdown, setCountdown] = useState(30);

//   // Simulate driver search
//   useEffect(() => {
//     // Countdown timer
//     const timer = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           setSearchStage('timeout');
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     // Simulate finding driver after 5 seconds
//     const findDriver = setTimeout(() => {
//       setDriver({
//         id: '123',
//         name: 'John Banda',
//         rating: 4.8,
//         avatar: '/avatars/driver1.jpg',
//         vehiclePlate: 'BAZ 1234',
//         vehicleModel: 'Toyota Corolla',
//         vehicleColor: 'White',
//         eta: '3 min',
//       });
//       setSearchStage('found');
//       clearInterval(timer);
//     }, 5000);

//     return () => {
//       clearInterval(timer);
//       clearTimeout(findDriver);
//     };
//   }, []);

//   const handleCancel = () => {
//     router.back();
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: '100vh',
//         display: 'flex',
//         flexDirection: 'column',
//         bgcolor: 'background.default',
//         p: 3,
//       }}
//     >
//       <AnimatePresence mode="wait">
//         {searchStage === 'searching' && (
//           <motion.div
//             key="searching"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             style={{
//               flex: 1,
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             {/* Animation */}
//             <Box
//               sx={{
//                 width: 280,
//                 height: 280,
//                 mb: 4,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//               }}
//             >
//               <motion.div
//                 animate={{
//                   scale: [1, 1.2, 1],
//                   rotate: [0, 180, 360],
//                 }}
//                 transition={{
//                   duration: 2,
//                   repeat: Infinity,
//                   ease: "easeInOut",
//                 }}
//               >
//                 <Box
//                   sx={{
//                     fontSize: '6rem',
//                   }}
//                 >
//                   🚗
//                 </Box>
//               </motion.div>
//             </Box>

//             {/* Text */}
//             <Typography
//               variant="h5"
//               sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}
//             >
//               Finding you a driver
//             </Typography>
//             <Typography
//               variant="body1"
//               color="text.secondary"
//               sx={{ textAlign: 'center', mb: 4 }}
//             >
//               This should only take a moment...
//             </Typography>

//             {/* Countdown */}
//             <Box
//               sx={{
//                 position: 'relative',
//                 display: 'inline-flex',
//                 mb: 6,
//               }}
//             >
//               <CircularProgress
//                 variant="determinate"
//                 value={(countdown / 30) * 100}
//                 size={80}
//                 thickness={4}
//                 sx={{ color: 'primary.main' }}
//               />
//               <Box
//                 sx={{
//                   top: 0,
//                   left: 0,
//                   bottom: 0,
//                   right: 0,
//                   position: 'absolute',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}
//               >
//                 <Typography
//                   variant="h6"
//                   component="div"
//                   fontWeight={700}
//                 >
//                   {countdown}s
//                 </Typography>
//               </Box>
//             </Box>

//             {/* Cancel Button */}
//             <Button
//               variant="outlined"
//               size="large"
//               onClick={handleCancel}
//               sx={{
//                 width: '100%',
//                 height: 56,
//                 borderRadius: 4,
//                 textTransform: 'none',
//                 fontWeight: 600,
//               }}
//             >
//               Cancel Request
//             </Button>
//           </motion.div>
//         )}

//         {searchStage === 'found' && driver && (
//           <motion.div
//             key="found"
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             style={{
//               flex: 1,
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             {/* Success Icon */}
//             <motion.div
//               initial={{ scale: 0 }}
//               animate={{ scale: 1 }}
//               transition={{
//                 type: 'spring',
//                 stiffness: 260,
//                 damping: 20,
//               }}
//             >
//               <Box
//                 sx={{
//                   width: 100,
//                   height: 100,
//                   borderRadius: '50%',
//                   bgcolor: 'success.main',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   fontSize: '3rem',
//                   mb: 3,
//                 }}
//               >
//                 ✓
//               </Box>
//             </motion.div>

//             <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
//               Driver Found!
//             </Typography>
//             <Typography
//               variant="body1"
//               color="text.secondary"
//               sx={{ mb: 4 }}
//             >
//               {driver.name} is coming to pick you up
//             </Typography>

//             {/* Driver Card */}
//             <Box
//               sx={{
//                 width: '100%',
//                 maxWidth: 400,
//                 p: 3,
//                 borderRadius: 4,
//                 bgcolor: 'background.paper',
//                 boxShadow: 3,
//                 mb: 4,
//               }}
//             >
//               <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
//                 <Avatar
//                   src={driver.avatar}
//                   sx={{ width: 64, height: 64, mr: 2 }}
//                 />
//                 <Box sx={{ flex: 1 }}>
//                   <Typography variant="h6" sx={{ fontWeight: 600 }}>
//                     {driver.name}
//                   </Typography>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                       ⭐ {driver.rating}
//                     </Typography>
//                     <Typography variant="caption" color="text.secondary">
//                       • {driver.vehicleColor} {driver.vehicleModel}
//                     </Typography>
//                   </Box>
//                 </Box>
//               </Box>

//               <Box
//                 sx={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   p: 2,
//                   borderRadius: 2,
//                   bgcolor: 'action.hover',
//                 }}
//               >
//                 <Box>
//                   <Typography variant="caption" color="text.secondary">
//                     Plate Number
//                   </Typography>
//                   <Typography variant="body1" sx={{ fontWeight: 600 }}>
//                     {driver.vehiclePlate}
//                   </Typography>
//                 </Box>
//                 <Box sx={{ textAlign: 'right' }}>
//                   <Typography variant="caption" color="text.secondary">
//                     Arriving in
//                   </Typography>
//                   <Typography
//                     variant="body1"
//                     sx={{ fontWeight: 700, color: 'primary.main' }}
//                   >
//                     {driver.eta}
//                   </Typography>
//                 </Box>
//               </Box>
//             </Box>

//             {/* Continue Button */}
//             <Button
//               fullWidth
//               variant="contained"
//               size="large"
//               onClick={() => router.push('/rider/tracking')}
//               sx={{ height: 56, fontWeight: 600 }}
//             >
//               Track Driver
//             </Button>
//           </motion.div>
//         )}

//         {searchStage === 'timeout' && (
//           <motion.div
//             key="timeout"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             style={{
//               flex: 1,
//               display: 'flex',
//               flexDirection: 'column',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             {/* No Drivers Icon */}
//             <Box
//               sx={{
//                 width: 120,
//                 height: 120,
//                 borderRadius: '50%',
//                 bgcolor: 'error.light',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 fontSize: '4rem',
//                 mb: 3,
//               }}
//             >
//               😔
//             </Box>

//             <Typography
//               variant="h5"
//               sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}
//             >
//               No Drivers Available
//             </Typography>
//             <Typography
//               variant="body1"
//               color="text.secondary"
//               sx={{ textAlign: 'center', mb: 4, maxWidth: 300 }}
//             >
//               We couldn't find any drivers nearby right now. Please try again in a few minutes.
//             </Typography>

//             {/* Actions */}
//             <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
//               <Button
//                 fullWidth
//                 variant="contained"
//                 size="large"
//                 onClick={() => window.location.reload()}
//                 sx={{ height: 56, fontWeight: 600 }}
//               >
//                 Try Again
//               </Button>
//               <Button
//                 fullWidth
//                 variant="outlined"
//                 size="large"
//                 onClick={handleCancel}
//                 sx={{ height: 56, fontWeight: 600 }}
//               >
//                 Go Back
//               </Button>
//             </Box>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </Box>
//   );
// }

// ============================================
// rider/app/(main)/finding-driver/page.tsx
// ENHANCED WITH FULL API INTEGRATION
// ============================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Avatar,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRide } from '@/lib/hooks/useRide';
import ClientOnly from '@/components/ClientOnly';

export default function FindingDriverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideId = searchParams.get('rideId');

  // Ride hook with polling
  const { 
    activeRide, 
    ride,
    cancelRide, 
    startPollingRideStatus,
    stopPollingRideStatus,
    loading,
    error,
  } = useRide();

  // UI State
  const [searchStage, setSearchStage] = useState('searching'); // searching, found, timeout
  const [countdown, setCountdown] = useState(60); // Increased to 60 seconds
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ============================================
  // Start Polling for Driver Assignment
  // ============================================
  useEffect(() => {
    if (rideId && searchStage === 'searching') {
      // Start polling for ride status updates
      startPollingRideStatus(rideId, 120); // Poll for 2 minutes max
    }

    return () => {
      stopPollingRideStatus();
    };
  }, [rideId, searchStage, startPollingRideStatus, stopPollingRideStatus]);

  // ============================================
  // Monitor Ride Status Changes
  // ============================================
  useEffect(() => {
    const currentRide = activeRide || ride;
    if (!currentRide) return;

    // Driver accepted the ride
    if (currentRide.status === 'accepted' && currentRide.driver) {
      setSearchStage('found');
      stopPollingRideStatus();
      
      // Show success notification
      setSnackbar({
        open: true,
        message: `${currentRide.driver.firstName} is on the way!`,
        severity: 'success',
      });

      // Navigate to tracking after showing driver info
      setTimeout(() => {
        router.push(`/tracking?rideId=${currentRide.id}`);
      }, 3000);
    }
    // No drivers available
    else if (currentRide.status === 'no_drivers_available') {
      setSearchStage('timeout');
      stopPollingRideStatus();
    }
    // Ride was cancelled
    else if (currentRide.status === 'cancelled') {
      setSnackbar({
        open: true,
        message: 'Ride was cancelled',
        severity: 'warning',
      });
      setTimeout(() => {
        router.push('/home');
      }, 2000);
    }
  }, [activeRide, ride, router, stopPollingRideStatus]);

  // ============================================
  // Countdown Timer
  // ============================================
  useEffect(() => {
    if (searchStage !== 'searching') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSearchStage('timeout');
          stopPollingRideStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchStage, stopPollingRideStatus]);

  // ============================================
  // Handle Cancel Request
  // ============================================
  const handleCancelRequest = useCallback(async () => {
    if (!rideId) {
      router.back();
      return;
    }

    setCanceling(true);
    try {
      const result = await cancelRide(
        rideId,
        'CHANGE_OF_PLANS',
        'Cancelled during driver search'
      );

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Ride cancelled successfully',
          severity: 'info',
        });
        
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to cancel ride',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Cancel error:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while cancelling',
        severity: 'error',
      });
    } finally {
      setCanceling(false);
      setShowCancelDialog(false);
    }
  }, [rideId, cancelRide, router]);

  const handleTryAgain = () => {
    router.push('/home');
  };

  // Get current ride data
  const currentRide = activeRide || ride;
  const driver = currentRide?.driver;

  // ============================================
  // Render UI
  // ============================================
  return (
    <ClientOnly>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <AnimatePresence mode="wait">
          {/* ============================================ */}
          {/* SEARCHING FOR DRIVER */}
          {/* ============================================ */}
          {searchStage === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Animated Car Icon */}
              <Box
                sx={{
                  width: 280,
                  height: 280,
                  mb: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Box
                    sx={{
                      fontSize: '8rem',
                      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))',
                    }}
                  >
                    🚗
                  </Box>
                </motion.div>

                {/* Searching dots animation */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Box>

              {/* Title */}
              <Typography
                variant="h5"
                sx={{ 
                  fontWeight: 700, 
                  mb: 1, 
                  textAlign: 'center',
                  background: 'linear-gradient(45deg, #FFC107 30%, #FF9800 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Finding you a driver
              </Typography>

              {/* Subtitle */}
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ textAlign: 'center', mb: 1 }}
              >
                Searching for nearby drivers...
              </Typography>

              {/* Ride Info */}
              {currentRide && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center', mb: 4 }}
                >
                  Ride #{currentRide.id?.toString().slice(-6) || 'N/A'}
                </Typography>
              )}

              {/* Countdown Circle */}
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  mb: 6,
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={(countdown / 60) * 100}
                  size={100}
                  thickness={4}
                  sx={{ 
                    color: 'primary.main',
                    filter: 'drop-shadow(0 4px 8px rgba(255, 193, 7, 0.3))',
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <Typography
                    variant="h5"
                    component="div"
                    fontWeight={700}
                    color="primary"
                  >
                    {countdown}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    seconds
                  </Typography>
                </Box>
              </Box>

              {/* Tips */}
              <Box
                sx={{
                  mb: 4,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'action.hover',
                  maxWidth: 400,
                  width: '100%',
                }}
              >
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  💡 <strong>Tip:</strong> We're notifying drivers within 5km of your location
                </Typography>
              </Box>

              {/* Cancel Button */}
              <Button
                variant="outlined"
                size="large"
                onClick={() => setShowCancelDialog(true)}
                disabled={canceling}
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 56,
                  borderRadius: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                {canceling ? (
                  <CircularProgress size={24} />
                ) : (
                  'Cancel Request'
                )}
              </Button>
            </motion.div>
          )}

          {/* ============================================ */}
          {/* DRIVER FOUND */}
          {/* ============================================ */}
          {searchStage === 'found' && driver && (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    color: 'white',
                    mb: 3,
                    boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)',
                  }}
                >
                  ✓
                </Box>
              </motion.div>

              {/* Title */}
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  color: 'success.main',
                }}
              >
                Driver Found!
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, textAlign: 'center' }}
              >
                {driver.firstName} {driver.lastName} is coming to pick you up
              </Typography>

              {/* Driver Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ width: '100%', maxWidth: 450 }}
              >
                <Box
                  sx={{
                    width: '100%',
                    p: 3,
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 4,
                  }}
                >
                  {/* Driver Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      src={driver.profilePicture}
                      sx={{ 
                        width: 72, 
                        height: 72, 
                        mr: 2,
                        border: '3px solid',
                        borderColor: 'primary.main',
                      }}
                    >
                      {driver.firstName?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {driver.firstName} {driver.lastName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {driver.driverProfile?.averageRating || 4.8}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({driver.driverProfile?.totalRatings || 0} ratings)
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {driver.driverProfile?.completedRides || 0} completed trips
                      </Typography>
                    </Box>
                  </Box>

                  {/* Vehicle & ETA Info */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 2,
                    }}
                  >
                    {/* Vehicle Info */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          VEHICLE
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {currentRide?.vehicle?.numberPlate || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentRide?.vehicle?.color} {currentRide?.vehicle?.make} {currentRide?.vehicle?.model}
                      </Typography>
                    </Box>

                    {/* ETA Info */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                      }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                        ARRIVING IN
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, mt: 0.5 }}
                      >
                        {currentRide?.eta ? `${Math.ceil(currentRide.eta / 60)} min` : '3-5 min'}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {currentRide?.distance ? `${currentRide.distance.toFixed(1)} km away` : 'Nearby'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Contact Info */}
                  {driver.phoneNumber && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {driver.phoneNumber}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </motion.div>

              {/* Continue Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ width: '100%', maxWidth: 450 }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => router.push(`/tracking?rideId=${currentRide?.id}`)}
                  sx={{ 
                    height: 56, 
                    fontWeight: 700,
                    borderRadius: 4,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.4)',
                  }}
                >
                  Track Driver
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ============================================ */}
          {/* NO DRIVERS AVAILABLE */}
          {/* ============================================ */}
          {searchStage === 'timeout' && (
            <motion.div
              key="timeout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Sad Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    bgcolor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '5rem',
                    mb: 3,
                    boxShadow: '0 10px 30px rgba(244, 67, 54, 0.2)',
                  }}
                >
                  😔
                </Box>
              </motion.div>

              {/* Title */}
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}
              >
                No Drivers Available
              </Typography>

              {/* Message */}
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ textAlign: 'center', mb: 1, maxWidth: 350 }}
              >
                We couldn't find any drivers nearby right now.
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', mb: 4, maxWidth: 350 }}
              >
                This could be due to high demand or limited drivers in your area. Please try again in a few minutes.
              </Typography>

              {/* Info Box */}
              <Box
                sx={{
                  mb: 4,
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'info.light',
                  maxWidth: 400,
                  width: '100%',
                }}
              >
                <Typography variant="body2" fontWeight={600} color="info.dark" gutterBottom>
                  💡 Tips to increase your chances:
                </Typography>
                <Typography variant="caption" color="info.dark" component="div" sx={{ mt: 1 }}>
                  • Try booking during peak hours (7-9 AM, 5-7 PM)
                </Typography>
                <Typography variant="caption" color="info.dark" component="div">
                  • Move to a more accessible pickup location
                </Typography>
                <Typography variant="caption" color="info.dark" component="div">
                  • Consider scheduling a ride in advance
                </Typography>
              </Box>

              {/* Actions */}
              <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleTryAgain}
                  sx={{ 
                    height: 56, 
                    fontWeight: 700,
                    borderRadius: 4,
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
                    height: 56, 
                    fontWeight: 600,
                    borderRadius: 4,
                  }}
                >
                  Back to Home
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 4,
              maxWidth: 400,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Cancel Ride Request?
            <IconButton
              onClick={() => setShowCancelDialog(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to cancel this ride request? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button
              onClick={() => setShowCancelDialog(false)}
              variant="outlined"
              sx={{ borderRadius: 2, px: 3 }}
            >
              Keep Searching
            </Button>
            <Button
              onClick={handleCancelRequest}
              variant="contained"
              color="error"
              disabled={canceling}
              sx={{ borderRadius: 2, px: 3 }}
            >
              {canceling ? <CircularProgress size={20} /> : 'Yes, Cancel'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ClientOnly>
  );
}