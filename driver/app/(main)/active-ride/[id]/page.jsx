// // driver/app/(main)/active-ride/[id]/page.jsx
// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import {
//   Box,
//   AppBar,
//   Toolbar,
//   Typography,
//   Button,
//   Paper,
//   IconButton,
//   Avatar,
//   Fab,
//   Chip,
//   Alert,
//   CircularProgress,
//   List,
//   ListItem,
//   ListItemText,
//   Divider,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon,
//   Phone as PhoneIcon,
//   Navigation as NavigationIcon,
//   Check as CheckIcon,
//   LocationOn as LocationIcon,
//   MyLocation as MyLocationIcon,
//   Star as StarIcon,
//   Receipt as ReceiptIcon,
//   Message as MessageIcon,
//   OpenInNew as OpenInNewIcon,
//   Close as CloseIcon,
//   Payment as PaymentIcon 
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
// import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
// import { useRide } from '@/lib/hooks/useRide';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { formatCurrency, formatDateTime } from '@/Functions';
// import { apiClient } from '@/lib/api/client';
// import { useSocket } from '@/lib/socket/SocketProvider';
// import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
// import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// export default function ActiveRidePage() {
//   const params = useParams();
//   const router = useRouter();
//   const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
//   const { updateLocation } = useSocket();
//   const { isNative, getCurrentLocation } = useReactNative();

//   const [ride, setRide] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showNavigationModal, setShowNavigationModal] = useState(false);
//   const mapControlsRef = useRef(null);
//   const { isOkrapayEnabled, allowRidePaymentWithOkraPay } = useAdminSettings();
//   const { emit } = useSocket();
//   // OkraPay is enabled for rides when both flags are on
//   const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;
//   // Whether driver has already clicked "Request Payment" this session
//   const [paymentRequested, setPaymentRequested] = useState(false);

//   useEffect(() => {
//     loadRideDetails();
//   }, [params.id]);

//   // Add location tracking
//   useEffect(() => {
//     console.log('isOkrapayEnabled && allowRidePaymentWithOkraPay',isOkrapayEnabled , allowRidePaymentWithOkraPay)
//     if (!ride || ride.rideStatus === 'completed' || ride.rideStatus === 'cancelled') return;

//     let locationInterval;

//     const trackLocation = async () => {
//       try {
//         if (isNative) {
//           const location = await getCurrentLocation();
//           if (location) {
//             updateLocation(location, location.heading || 0, location.speed || 0);
//           }
//         } else {
//           // Web fallback
//           if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//               (position) => {
//                 const location = {
//                   lat: position.coords.latitude,
//                   lng: position.coords.longitude,
//                 };
//                 const heading = position.coords.heading || 0;
//                 const speed = position.coords.speed || 0;
//                 updateLocation(location, heading, speed);
//               },
//               (error) => console.error('Location error:', error),
//               { enableHighAccuracy: true }
//             );
//           }
//         }
//       } catch (error) {
//         console.error('Location tracking error:', error);
//       }
//     };

//     // Track immediately
//     trackLocation();

//     // Then track every 5 seconds
//     locationInterval = setInterval(trackLocation, 5000);

//     return () => {
//       if (locationInterval) clearInterval(locationInterval);
//     };
//   }, [ride?.rideStatus, isNative, getCurrentLocation, updateLocation]);

//   const loadRideDetails = async () => {
//     try {
//       const response = await apiClient.get(`/rides/${params.id}`);
//       if (response?.data) {
//         setRide(response.data);
//       }
//     } catch (error) {
//       console.error('Error loading ride:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartTrip = async () => {
//     try {
//       await startTrip(ride.id);
//       loadRideDetails();
//     } catch (error) {
//       console.error('Error starting trip:', error);
//       alert('Failed to start trip');
//     }
//   };

//   const handleCompleteTrip = async () => {
//     if (window.confirm('Complete this ride?')) {
//       try {
//         await completeTrip(ride.id, {
//           actualDistance: ride.estimatedDistance,
//           actualDuration: ride.estimatedDuration,
//         });
//         router.push('/home');
//       } catch (error) {
//         console.error('Error completing trip:', error);
//         alert('Failed to complete trip');
//       }
//     }
//   };

//      const handleRequestPayment = async () => {
//      try {
//        // Emit the new socket event to the rider
//        emit(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, {
//          rideId: ride.id,
//          driverId: ride.driver?.id,
//          riderId:  ride.rider?.id,
//          finalFare: ride.totalFare,
//        });
//        setPaymentRequested(true);
//      } catch (error) {
//        console.error('Error requesting payment:', error);
//        alert('Failed to request payment. Please try again.');
//      }
//    };

//   const handleConfirmArrival = async () => {
//     try {
//       await confirmArrival(ride.id);
//       loadRideDetails();
//     } catch (error) {
//       console.error('Error confirming arrival:', error);
//       alert('Failed to confirm arrival');
//     }
//   };

//   const handleNavigate = () => {
//     setShowNavigationModal(true);
//   };

//   const handleOpenInExternalApp = () => {
//     const destination =
//       ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived'
//         ? ride.pickupLocation
//         : ride.dropoffLocation;

//     if (destination && destination.lat && destination.lng) {
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
//       window.open(url, '_blank');
//     }
//   };

//   const handleCallRider = () => {
//     if (ride?.rider?.phoneNumber) {
//       window.location.href = `tel:${ride.rider.phoneNumber}`;
//     }
//   };

//   const handleMessageRider = () => {
//     if (ride?.rider?.phoneNumber) {
//       window.location.href = `sms:${ride.rider.phoneNumber}`;
//     }
//   };

//   const formatETA = (minutes) => {
//     if (!minutes && minutes !== 0) return 'Calculating...';

//     if (minutes < 60) {
//       return `${minutes} min`;
//     }

//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = minutes % 60;

//     if (remainingMinutes === 0) {
//       return `${hours} hr`;
//     }

//     return `${hours} hr ${remainingMinutes} min`;
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case RIDE_STATUS.COMPLETED:
//         return 'success';
//       case RIDE_STATUS.CANCELLED:
//         return 'error';
//       case RIDE_STATUS.PASSENGER_ONBOARD:
//         return 'primary';
//       case RIDE_STATUS.ARRIVED:
//         return 'success';
//       case RIDE_STATUS.ACCEPTED:
//         return 'info';
//       default:
//         return 'default';
//     }
//   };

//   // Get destination for navigation
//   const getNavigationDestination = () => {
//     if (!ride) return null;
//     return ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived'
//       ? ride.pickupLocation
//       : ride.dropoffLocation;
//   };

//   // Generate Google Maps Embed URL
//   const getMapEmbedUrl = () => {
//     const destination = getNavigationDestination();
//     if (!destination) return '';

//     // Using Google Maps Embed API with directions mode
//     const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
//     return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=current+location&destination=${destination.lat},${destination.lng}&mode=driving`;
//   };

//   if (loading || !ride) {
//     return (
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           height: '100vh',
//         }}
//       >
//         <CircularProgress />
//       </Box>
//     );
//   }

//   // Get valid map center
//   const getMapCenter = () => {
//     if (ride.pickupLocation?.lat && ride.pickupLocation?.lng) {
//       return ride.pickupLocation;
//     }
//     // Default to Lusaka
//     return { lat: -15.4167, lng: 28.2833 };
//   };

//   const destination = getNavigationDestination();

//   return (
//     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
//       {/* AppBar */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
//             <BackIcon />
//           </IconButton>
//           <Typography variant="h6" sx={{ flex: 1 }}>
//             Active Ride
//           </Typography>
//           <Chip
//             label={ride.rideStatus}
//             color={getStatusColor(ride.rideStatus)}
//             sx={{ color: 'white', mr: 1 }}
//           />
//           <IconButton color="inherit" onClick={handleCallRider}>
//             <PhoneIcon />
//           </IconButton>
//         </Toolbar>
//       </AppBar>

//       {/* Map */}
//       <Box sx={{ flex: 1, position: 'relative' }}>
//         <GoogleMapIframe
//           center={getMapCenter()}
//           zoom={15}
//           height="100%"
//           pickupLocation={ride.pickupLocation}
//           dropoffLocation={ride.dropoffLocation}
//           showRoute={ride.rideStatus === 'passenger_onboard'}
//           onMapLoad={(controls) => {
//             mapControlsRef.current = controls;
//           }}
//         />

//         {/* Navigate FAB */}
//         <Fab
//           color="primary"
//           sx={{
//             position: 'absolute',
//             bottom: 16,
//             right: 16,
//           }}
//           onClick={handleNavigate}
//         >
//           <NavigationIcon />
//         </Fab>
//       </Box>

//       {/* Ride Info Bottom Sheet */}
//       <Paper
//         elevation={8}
//         sx={{
//           borderTopLeftRadius: 24,
//           borderTopRightRadius: 24,
//           maxHeight: '60vh',
//           overflow: 'auto',
//         }}
//       >
//         <Box sx={{ p: 3 }}>
//           {/* Rider Info */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
//               Rider Information
//             </Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//               <Avatar
//                 sx={{
//                   width: 56,
//                   height: 56,
//                   bgcolor: 'primary.main',
//                 }}
//               >
//                 {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
//               </Avatar>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="h6" sx={{ fontWeight: 600 }}>
//                   {ride.rider?.firstName} {ride.rider?.lastName}
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   {ride.rider?.phoneNumber}
//                 </Typography>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
//                   <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
//                   <Typography variant="body2">
//                     {ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides
//                   </Typography>
//                 </Box>
//               </Box>
//               <IconButton
//                 onClick={handleMessageRider}
//                 sx={{
//                   bgcolor: 'primary.light',
//                   '&:hover': { bgcolor: 'primary.main', color: 'white' },
//                 }}
//               >
//                 <MessageIcon />
//               </IconButton>
//             </Box>
//           </Paper>

//           {/* Trip Details */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
//               Trip Details
//             </Typography>

//             {/* Pickup */}
//             <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
//               <Box
//                 sx={{
//                   width: 36,
//                   height: 36,
//                   borderRadius: 2,
//                   bgcolor: 'success.light',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   flexShrink: 0,
//                 }}
//               >
//                 <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
//               </Box>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="caption" color="text.secondary">
//                   PICKUP
//                 </Typography>
//                 <Typography variant="body1" sx={{ fontWeight: 500 }}>
//                   {ride.pickupLocation?.address}
//                 </Typography>
//                 {ride.pickupLocation?.name && (
//                   <Typography variant="body2" sx={{ fontWeight: 300 }}>
//                     <strong>{'> '}</strong>{ride.pickupLocation.name}
//                   </Typography>
//                 )}
//                 {ride.acceptedAt && (
//                   <Typography variant="caption" color="text.secondary">
//                     Accepted: {formatDateTime(ride.acceptedAt)}
//                   </Typography>
//                 )}
//               </Box>
//             </Box>

//             {/* Connecting line */}
//             <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />

//             {/* Dropoff */}
//             <Box sx={{ display: 'flex', gap: 2 }}>
//               <Box
//                 sx={{
//                   width: 36,
//                   height: 36,
//                   borderRadius: 2,
//                   bgcolor: 'error.light',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   flexShrink: 0,
//                 }}
//               >
//                 <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
//               </Box>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="caption" color="text.secondary">
//                   DROPOFF
//                 </Typography>
//                 <Typography variant="body1" sx={{ fontWeight: 500 }}>
//                   {ride.dropoffLocation?.address}
//                 </Typography>
//                 {ride.dropoffLocation?.name && (
//                   <Typography variant="body2" sx={{ fontWeight: 300 }}>
//                     <strong>{'> '}</strong>{ride.dropoffLocation.name}
//                   </Typography>
//                 )}
//                 {ride.tripCompletedAt && (
//                   <Typography variant="caption" color="text.secondary">
//                     Completed: {formatDateTime(ride.tripCompletedAt)}
//                   </Typography>
//                 )}
//               </Box>
//             </Box>
//           </Paper>

//           {/* Fare Breakdown */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
//               <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
//               Fare Breakdown
//             </Typography>

//             <List disablePadding>
//               {ride.baseFare !== null && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Base Fare" />
//                   <Typography>{formatCurrency(ride.baseFare || 0)}</Typography>
//                 </ListItem>
//               )}
//               {ride.distanceFare !== null && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Distance Fare" />
//                   <Typography>{formatCurrency(ride.distanceFare || 0)}</Typography>
//                 </ListItem>
//               )}
//               {ride.timeFare !== null && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Time Fare" />
//                   <Typography>{formatCurrency(ride.timeFare || 0)}</Typography>
//                 </ListItem>
//               )}
//               {ride.surgeFare > 0 && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Surge" />
//                   <Typography color="warning.main">
//                     +{formatCurrency(ride.surgeFare)}
//                   </Typography>
//                 </ListItem>
//               )}
//               {ride.promoDiscount > 0 && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Promo Discount" />
//                   <Typography color="success.main">
//                     -{formatCurrency(ride.promoDiscount)}
//                   </Typography>
//                 </ListItem>
//               )}
//               <Divider sx={{ my: 1 }} />
//               <ListItem sx={{ px: 0 }}>
//                 <ListItemText
//                   primary="Total Fare"
//                   primaryTypographyProps={{ fontWeight: 600 }}
//                 />
//                 <Typography fontWeight={600}>
//                   {formatCurrency(ride.totalFare)}
//                 </Typography>
//               </ListItem>

//               {/* Subscription vs Float Mode */}
//               {ride.wasSubscriptionRide ? (
//                 <>
//                   <ListItem sx={{ px: 0, bgcolor: 'success.light', borderRadius: 2, mt: 1 }}>
//                     <ListItemText
//                       primary="Commission (Subscription Mode)"
//                       secondary="You keep 100% of the fare!"
//                       primaryTypographyProps={{ fontWeight: 600 }}
//                     />
//                     <Typography fontWeight={700} color="success.dark">
//                       {formatCurrency(0)}
//                     </Typography>
//                   </ListItem>
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText
//                       primary="Your Earnings"
//                       primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
//                     />
//                     <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
//                       {formatCurrency(ride.driverEarnings || ride.totalFare)}
//                     </Typography>
//                   </ListItem>
//                 </>
//               ) : (
//                 <>
//                   {ride.commission > 0 && (
//                     <ListItem sx={{ px: 0 }}>
//                       <ListItemText primary="Commission (15%)" />
//                       <Typography color="error.main">
//                         -{formatCurrency(ride.commission)}
//                       </Typography>
//                     </ListItem>
//                   )}
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText
//                       primary="Your Earnings"
//                       primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
//                     />
//                     <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
//                       {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
//                     </Typography>
//                   </ListItem>
//                 </>
//               )}
//             </List>

//             {/* Payment Method */}
//             <Chip
//               label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`}
//               sx={{ mt: 2, fontWeight: 600 }}
//             />
//           </Paper>

//           {/* Trip Stats */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
//               Trip Statistics
//             </Typography>
//             <Box
//               sx={{
//                 display: 'grid',
//                 gridTemplateColumns: '1fr 1fr',
//                 gap: 2,
//               }}
//             >
//               <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
//                 <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
//                   {ride.actualDistance?.toFixed(1) || ride.estimatedDistance?.toFixed(1) || '0'} km
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary">
//                   Distance
//                 </Typography>
//               </Box>
//               <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
//                 <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
//                   {formatETA(ride.actualDuration || ride.estimatedDuration)}
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary">
//                   Duration
//                 </Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Action Buttons */}
//           {ride.rideStatus === 'accepted' && (
//             <Button
//               fullWidth
//               variant="contained"
//               size="large"
//               onClick={handleConfirmArrival}
//               sx={{
//                 height: 56,
//                 fontWeight: 700,
//                 borderRadius: 3,
//                 bgcolor: 'success.main',
//                 '&:hover': { bgcolor: 'success.dark' },
//                 mb: 1,
//               }}
//             >
//               I've Arrived at Pickup
//             </Button>
//           )}

//           {ride.rideStatus === 'arrived' && (
//             <Button
//               fullWidth
//               variant="contained"
//               size="large"
//               onClick={handleStartTrip}
//               startIcon={<CheckIcon />}
//               sx={{
//                 height: 56,
//                 fontWeight: 700,
//                 borderRadius: 3,
//                 bgcolor: 'primary.main',
//                 mb: 1,
//               }}
//             >
//               Start Trip
//             </Button>
//           )}

//           {ride.rideStatus === 'passenger_onboard' && (
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

//               {/* "Request Payment" — only shown when OkraPay is allowed for rides */}
//               {okrapayAllowedForRides && (
//                 <Button
//                   fullWidth
//                   variant="contained"
//                   size="large"
//                   onClick={handleRequestPayment}
//                   disabled={paymentRequested}
//                   startIcon={<PaymentIcon />}
//                   sx={{
//                     height: 56, fontWeight: 700, borderRadius: 3,
//                     bgcolor: paymentRequested ? 'grey.400' : 'warning.main',
//                     '&:hover': { bgcolor: paymentRequested ? 'grey.400' : 'warning.dark' },
//                     '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
//                   }}
//                 >
//                   {paymentRequested ? 'Payment Requested ✓' : 'Request Payment'}
//                 </Button>
//               )}

//               {/* "Complete Trip" — always visible once passenger is onboard */}
//               <Button
//                 fullWidth
//                 variant="contained"
//                 color="success"
//                 size="large"
//                 onClick={handleCompleteTrip}
//                 startIcon={<CheckIcon />}
//                 sx={{ height: 56, fontWeight: 700, borderRadius: 3 }}
//               >
//                 Complete Trip
//               </Button>

//             </Box>
//           )}

//           {/* Cancel Button (for pending/accepted/arrived status) */}
//           {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
//             <Button
//               fullWidth
//               variant="outlined"
//               color="error"
//               onClick={async () => {
//                 const reason = window.prompt('Reason for cancellation:');
//                 if (reason) {
//                   try {
//                     await cancelRide(ride.id, reason);
//                     router.push('/home');
//                   } catch (error) {
//                     console.error('Error cancelling ride:', error);
//                     alert('Failed to cancel ride');
//                   }
//                 }
//               }}
//               sx={{ height: 48, borderRadius: 3, fontWeight: 600, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
//             >
//               Cancel Ride
//             </Button>
//           )}
//         </Box>
//       </Paper>

//       {/* Navigation Modal */}
//       {showNavigationModal && destination && (
//         <SwipeableBottomSheet
//           open={showNavigationModal}
//           onClose={() => setShowNavigationModal(false)}
//           expandedHeight="70%"
//           initialHeight={window.innerHeight * 0.7}
//           maxHeight={window.innerHeight * 0.9}
//           minHeight={300}
//           onSwipeDown={() => setShowNavigationModal(false)}
//         >
//           <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//             {/* Header */}
//             <Box
//               sx={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'space-between',
//                 p: 2,
//                 borderBottom: '1px solid',
//                 borderColor: 'divider',
//               }}
//             >
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <NavigationIcon color="primary" />
//                 <Typography variant="h6" sx={{ fontWeight: 600 }}>
//                   Navigation
//                 </Typography>
//               </Box>
//               <Box sx={{ display: 'flex', gap: 1 }}>
//                 <IconButton
//                   size="small"
//                   onClick={handleOpenInExternalApp}
//                   sx={{
//                     bgcolor: 'primary.light',
//                     '&:hover': { bgcolor: 'primary.main', color: 'white' },
//                   }}
//                 >
//                   <OpenInNewIcon fontSize="small" />
//                 </IconButton>
//                 <IconButton
//                   size="small"
//                   onClick={() => setShowNavigationModal(false)}
//                 >
//                   <CloseIcon fontSize="small" />
//                 </IconButton>
//               </Box>
//             </Box>

//             {/* Destination Info */}
//             <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
//               <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
//                 NAVIGATING TO
//               </Typography>
//               <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
//                 {destination.name && `${destination.name} - `}
//                 {destination.address}
//               </Typography>
//             </Box>

//             {/* Google Maps Embed */}
//             <Box sx={{ flex: 1, position: 'relative', bgcolor: 'background.default' }}>
//               <iframe
//                 src={getMapEmbedUrl()}
//                 width="100%"
//                 height="100%"
//                 style={{ border: 0 }}
//                 allowFullScreen
//                 loading="lazy"
//                 referrerPolicy="no-referrer-when-downgrade"
//               />
//             </Box>

//             {/* Action Button */}
//             <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
//               <Button
//                 fullWidth
//                 variant="contained"
//                 startIcon={<OpenInNewIcon />}
//                 onClick={handleOpenInExternalApp}
//                 sx={{
//                   height: 48,
//                   fontWeight: 600,
//                   borderRadius: 3,
//                 }}
//               >
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
//
// KEY CHANGES vs previous version:
//  1. "Request Payment" disables "Complete Trip" for 60 seconds → re-enables after
//  2. Driver listens for PAYMENT_RECEIVED socket/RN event → auto-navigates to home
//  3. Status polling every appsServerPollingIntervalInSeconds (default 20 s)
//     - if paymentStatus==='completed' → auto-navigate home
//     - if rideStatus changed locally → sync UI
//  4. awaiting_payment status guard

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Button, Paper, IconButton, Avatar,
  Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider, LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
  Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
  Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
  OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
  AccessTime as TimerIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { useRide } from '@/lib/hooks/useRide';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

// ── How long (ms) "Complete Trip" stays disabled after "Request Payment" ─────
const COMPLETE_TRIP_LOCK_MS = 60_000; // 1 minute

// ── Read polling interval from admin settings or default 20 s ─────────────────
function getPollingInterval(settings) {
  const v = settings?.appsServerPollingIntervalInSeconds;
  return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
}

export default function ActiveRidePage() {
  const params = useParams();
  const router = useRouter();

  const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
  const { updateLocation } = useSocket();
  const { isNative, getCurrentLocation, on: rnOn } = useReactNative();
  const { emit, on: socketOn, off: socketOff } = useSocket();
  const { isOkrapayEnabled, allowRidePaymentWithOkraPay, settings } = useAdminSettings();

  const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;

  const [ride,                  setRide]                  = useState(null);
  const [loading,               setLoading]               = useState(true);
  const [showNavigationModal,   setShowNavigationModal]   = useState(false);
  const mapControlsRef = useRef(null);

  // ── Payment request state ─────────────────────────────────────────────────
  const [paymentRequested,        setPaymentRequested]        = useState(false);
  // How many seconds remain on the Complete-Trip lock (0 = unlocked)
  const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);
  const lockTimerRef   = useRef(null);
  const countdownRef   = useRef(null);
  const pollingRef     = useRef(null);
  const mountedRef     = useRef(true);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(lockTimerRef.current);
      clearInterval(countdownRef.current);
      clearInterval(pollingRef.current);
    };
  }, []);

  // ── Load ride ─────────────────────────────────────────────────────────────
  const loadRideDetails = useCallback(async () => {
    try {
      const response = await apiClient.get(`/rides/${params.id}`);
      if (response?.data && mountedRef.current) setRide(response.data);
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { loadRideDetails(); }, [loadRideDetails]);

  // ── STATUS POLLING ────────────────────────────────────────────────────────
  // Fires every appsServerPollingIntervalInSeconds while ride is active.
  // Syncs local state with backend; auto-completes if paymentStatus===completed.
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

        // Payment confirmed → navigate driver home
        if (backend.paymentStatus === 'completed' || backend.rideStatus === 'completed') {
          clearInterval(pollingRef.current);
          router.push('/home');
          return;
        }

        // Sync ride state
        setRide(prev => prev ? { ...prev, ...backend } : prev);
      } catch (err) {
        console.error('[ActiveRide] poll error:', err);
      }
    }, interval);

    return () => clearInterval(pollingRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id, ride?.rideStatus, settings]);

  // ── Location tracking ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!ride || ['completed', 'cancelled'].includes(ride.rideStatus)) return;
    const trackLocation = async () => {
      try {
        if (isNative) {
          const loc = await getCurrentLocation();
          if (loc) updateLocation(loc, loc.heading || 0, loc.speed || 0);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => updateLocation({ lat: coords.latitude, lng: coords.longitude }, coords.heading || 0, coords.speed || 0),
            (err) => console.error('Geo error:', err),
            { enableHighAccuracy: true }
          );
        }
      } catch (err) { console.error('Location tracking error:', err); }
    };
    trackLocation();
    const id = setInterval(trackLocation, 5000);
    return () => clearInterval(id);
  }, [ride?.rideStatus, isNative, getCurrentLocation, updateLocation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT_RECEIVED — rider paid (cash OR OkraPay confirmed by backend)
  // Driver auto-navigates to home; no need to manually complete the trip.
  // ═══════════════════════════════════════════════════════════════════════════

  // RN bridge
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

  // window message relay (from App.tsx)
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

  // Socket.IO (direct WebSocket path)
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

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST PAYMENT — 1-minute Complete-Trip lock
  // ═══════════════════════════════════════════════════════════════════════════
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

      // Countdown tick (1 s)
      countdownRef.current = setInterval(() => {
        setCompleteLockSecondsLeft(prev => {
          if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);

      // After 1 minute: unlock Complete Trip and re-enable Request Payment button
      lockTimerRef.current = setTimeout(() => {
        setCompleteLockSecondsLeft(0);
        setPaymentRequested(false); // re-enable so driver can send another nudge
      }, COMPLETE_TRIP_LOCK_MS);
    } catch (err) {
      console.error('Error requesting payment:', err);
    }
  }, [emit, ride]);

  const completeTripLocked = completeLockSecondsLeft > 0;

  // ── Standard action handlers ──────────────────────────────────────────────
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

  const handleNavigate          = () => setShowNavigationModal(true);
  const handleCallRider         = () => ride?.rider?.phoneNumber && (window.location.href = `tel:${ride.rider.phoneNumber}`);
  const handleMessageRider      = () => ride?.rider?.phoneNumber && (window.location.href = `sms:${ride.rider.phoneNumber}`);
  const handleOpenInExternalApp = () => {
    const dest = ride?.rideStatus === 'accepted' || ride?.rideStatus === 'arrived' ? ride.pickupLocation : ride.dropoffLocation;
    if (dest?.lat && dest?.lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
  };

  const getStatusColor = (s) => ({ completed:'success', cancelled:'error', passenger_onboard:'primary', arrived:'success', accepted:'info', awaiting_payment:'warning' }[s] || 'default');
  const getMapCenter   = () => ride?.pickupLocation?.lat ? ride.pickupLocation : { lat: -15.4167, lng: 28.2833 };
  const destination    = () => (ride?.rideStatus === 'accepted' || ride?.rideStatus === 'arrived') ? ride.pickupLocation : ride.dropoffLocation;
  const formatETA      = (m) => !m && m !== 0 ? 'Calculating…' : m < 60 ? `${m} min` : `${Math.floor(m/60)} hr ${m%60 ? m%60+' min' : ''}`.trim();
  const getMapEmbedUrl = () => { const d = destination(); return d ? `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=current+location&destination=${d.lat},${d.lng}&mode=driving` : ''; };

  if (loading || !ride) {
    return <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex:1 }}>Active Ride</Typography>
          <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color:'white', mr:1 }} />
          <IconButton color="inherit" onClick={handleCallRider}><PhoneIcon /></IconButton>
        </Toolbar>
      </AppBar>

      {/* Map */}
      <Box sx={{ flex:1, position:'relative' }}>
        <GoogleMapIframe center={getMapCenter()} zoom={15} height="100%"
          pickupLocation={ride.pickupLocation} dropoffLocation={ride.dropoffLocation}
          showRoute={ride.rideStatus === 'passenger_onboard'}
          onMapLoad={(c) => { mapControlsRef.current = c; }} />
        <Fab color="primary" sx={{ position:'absolute', bottom:16, right:16 }} onClick={handleNavigate}><NavigationIcon /></Fab>
      </Box>

      {/* Bottom Sheet */}
      <Paper elevation={8} sx={{ borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'60vh', overflow:'auto' }}>
        <Box sx={{ p:3 }}>

          {/* Rider Info */}
          <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
            <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Rider Information</Typography>
            <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
              <Avatar sx={{ width:56, height:56, bgcolor:'primary.main' }}>
                {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
              </Avatar>
              <Box sx={{ flex:1 }}>
                <Typography variant="h6" sx={{ fontWeight:600 }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{ride.rider?.phoneNumber}</Typography>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:0.5 }}>
                  <StarIcon sx={{ fontSize:16, color:'warning.main' }} />
                  <Typography variant="body2">{ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides</Typography>
                </Box>
              </Box>
              <IconButton onClick={handleMessageRider} sx={{ bgcolor:'primary.light', '&:hover':{ bgcolor:'primary.main', color:'white' } }}><MessageIcon /></IconButton>
            </Box>
          </Paper>

          {/* Trip Details */}
          <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
            <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Details</Typography>
            <Box sx={{ display:'flex', gap:2, mb:2 }}>
              <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'success.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <MyLocationIcon sx={{ color:'success.dark', fontSize:20 }} />
              </Box>
              <Box sx={{ flex:1 }}>
                <Typography variant="caption" color="text.secondary">PICKUP</Typography>
                <Typography variant="body1" sx={{ fontWeight:500 }}>{ride.pickupLocation?.address}</Typography>
              </Box>
            </Box>
            <Box sx={{ width:2, height:16, bgcolor:'divider', ml:2.2, mb:1 }} />
            <Box sx={{ display:'flex', gap:2 }}>
              <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:'error.light', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <LocationIcon sx={{ color:'error.dark', fontSize:20 }} />
              </Box>
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
              {ride.baseFare     != null && <ListItem sx={{ px:0 }}><ListItemText primary="Base Fare"     /><Typography>{formatCurrency(ride.baseFare)}</Typography></ListItem>}
              {ride.distanceFare != null && <ListItem sx={{ px:0 }}><ListItemText primary="Distance Fare" /><Typography>{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
              {ride.surgeFare    >  0    && <ListItem sx={{ px:0 }}><ListItemText primary="Surge"         /><Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
              {ride.promoDiscount > 0    && <ListItem sx={{ px:0 }}><ListItemText primary="Promo"         /><Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
              <Divider sx={{ my:1 }} />
              <ListItem sx={{ px:0 }}>
                <ListItemText primary="Total" primaryTypographyProps={{ fontWeight:600 }} />
                <Typography fontWeight={600}>{formatCurrency(ride.totalFare)}</Typography>
              </ListItem>
              <ListItem sx={{ px:0 }}>
                <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight:700, fontSize:'1.1rem' }} />
                <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
                  {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
                </Typography>
              </ListItem>
            </List>
            <Chip label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`} sx={{ mt:2, fontWeight:600 }} />
          </Paper>

          {/* Trip Stats */}
          <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:2 }}>
            <Typography variant="h6" sx={{ fontWeight:600, mb:2 }}>Trip Statistics</Typography>
            <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
              <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
                <Typography variant="h5" sx={{ fontWeight:700, color:'primary.main' }}>{(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km</Typography>
                <Typography variant="caption" color="text.secondary">Distance</Typography>
              </Box>
              <Box sx={{ textAlign:'center', p:2, bgcolor:'background.default', borderRadius:2 }}>
                <Typography variant="h5" sx={{ fontWeight:700, color:'info.main' }}>{formatETA(ride.actualDuration ?? ride.estimatedDuration)}</Typography>
                <Typography variant="caption" color="text.secondary">Duration</Typography>
              </Box>
            </Box>
          </Paper>

          {/* ── ACTION BUTTONS ────────────────────────────────────────────── */}
          {ride.rideStatus === 'accepted' && (
            <Button fullWidth variant="contained" size="large" onClick={handleConfirmArrival}
              sx={{ height:56, fontWeight:700, borderRadius:3, bgcolor:'success.main', '&:hover':{ bgcolor:'success.dark' }, mb:1 }}>
              I've Arrived at Pickup
            </Button>
          )}

          {ride.rideStatus === 'arrived' && (
            <Button fullWidth variant="contained" size="large" onClick={handleStartTrip} startIcon={<CheckIcon />}
              sx={{ height:56, fontWeight:700, borderRadius:3, mb:1 }}>
              Start Trip
            </Button>
          )}

          {(ride.rideStatus === 'passenger_onboard' || ride.rideStatus === 'awaiting_payment') && (
            <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>

              {/* REQUEST PAYMENT — only when OkraPay is enabled */}
              {okrapayAllowedForRides && (
                <Button fullWidth variant="contained" size="large"
                  onClick={handleRequestPayment}
                  disabled={paymentRequested && completeLockSecondsLeft > 0}
                  startIcon={<PaymentIcon />}
                  sx={{
                    height:56, fontWeight:700, borderRadius:3,
                    bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.main',
                    '&:hover': { bgcolor: (paymentRequested && completeLockSecondsLeft > 0) ? 'grey.400' : 'warning.dark' },
                    '&.Mui-disabled': { bgcolor:'grey.300', color:'grey.500' },
                  }}>
                  {(paymentRequested && completeLockSecondsLeft > 0)
                    ? `Payment Requested ✓  (${completeLockSecondsLeft}s)`
                    : 'Request Payment'}
                </Button>
              )}

              {/* Countdown progress bar */}
              {completeTripLocked && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.5 }}>
                    <TimerIcon sx={{ fontSize:16, color:'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Complete Trip available in {completeLockSecondsLeft}s — giving rider time to pay
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((COMPLETE_TRIP_LOCK_MS / 1000 - completeLockSecondsLeft) / (COMPLETE_TRIP_LOCK_MS / 1000)) * 100}
                    sx={{ borderRadius:1, height:6, bgcolor:'warning.light', '& .MuiLinearProgress-bar':{ bgcolor:'warning.main' } }}
                  />
                </Box>
              )}

              {/* Waiting for payment alert */}
              {ride.rideStatus === 'awaiting_payment' && (
                <Alert severity="info" icon={<PaymentIcon />} sx={{ borderRadius:2 }}>
                  Waiting for rider to complete payment…
                </Alert>
              )}

              {/* COMPLETE TRIP — disabled during 1-minute lock window */}
              <Button fullWidth variant="contained" color="success" size="large"
                onClick={handleCompleteTrip}
                disabled={completeTripLocked}
                startIcon={<CheckIcon />}
                sx={{ height:56, fontWeight:700, borderRadius:3, opacity: completeTripLocked ? 0.5 : 1 }}>
                Complete Trip
              </Button>

            </Box>
          )}

          {/* Cancel button */}
          {['pending','accepted','arrived'].includes(ride.rideStatus) && (
            <Button fullWidth variant="outlined" color="error" sx={{ height:48, borderRadius:3, fontWeight:600, borderWidth:2, mt:1, '&:hover':{ borderWidth:2 } }}
              onClick={async () => {
                const reason = window.prompt('Reason for cancellation:');
                if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
              }}>
              Cancel Ride
            </Button>
          )}
        </Box>
      </Paper>

      {/* Navigation Modal */}
      {showNavigationModal && destination() && (
        <SwipeableBottomSheet open={showNavigationModal} onClose={() => setShowNavigationModal(false)}
          initialHeight={window.innerHeight * 0.7} maxHeight={window.innerHeight * 0.9} minHeight={300}
          onSwipeDown={() => setShowNavigationModal(false)}>
          <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', p:2, borderBottom:'1px solid', borderColor:'divider' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}><NavigationIcon color="primary" /><Typography variant="h6" fontWeight={600}>Navigation</Typography></Box>
              <Box sx={{ display:'flex', gap:1 }}>
                <IconButton size="small" onClick={handleOpenInExternalApp} sx={{ bgcolor:'primary.light' }}><OpenInNewIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => setShowNavigationModal(false)}><CloseIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
            <Box sx={{ p:2, bgcolor:'action.hover' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>NAVIGATING TO</Typography>
              <Typography variant="body1" fontWeight={500} mt={0.5}>{destination()?.address}</Typography>
            </Box>
            <Box sx={{ flex:1 }}><iframe src={getMapEmbedUrl()} width="100%" height="100%" style={{ border:0 }} allowFullScreen loading="lazy" /></Box>
            <Box sx={{ p:2, borderTop:'1px solid', borderColor:'divider' }}>
              <Button fullWidth variant="contained" startIcon={<OpenInNewIcon />} onClick={handleOpenInExternalApp} sx={{ height:48, fontWeight:600, borderRadius:3 }}>
                Open in Google Maps App
              </Button>
            </Box>
          </Box>
        </SwipeableBottomSheet>
      )}
    </Box>
  );
}