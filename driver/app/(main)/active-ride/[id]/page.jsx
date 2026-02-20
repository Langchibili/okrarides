// // // driver/app/(main)/active-ride/[id]/page.jsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useParams, useRouter } from 'next/navigation';
// // import {
// //   Box,
// //   AppBar,
// //   Toolbar,
// //   Typography,
// //   Button,
// //   Paper,
// //   IconButton,
// //   Avatar,
// //   Fab,
// // } from '@mui/material';
// // import {
// //   ArrowBack as BackIcon,
// //   Phone as PhoneIcon,
// //   Navigation as NavigationIcon,
// //   Check as CheckIcon,
// // } from '@mui/icons-material';
// // import { motion } from 'framer-motion';
// // import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
// // import { useRide } from '@/lib/hooks/useRide';
// // import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// // import { formatCurrency, formatDistance } from '@/Functions';
// // import { apiClient } from '@/lib/api/client';
// // import { useSocket } from '@/lib/socket/SocketProvider';
// // import { SOCKET_EVENTS } from '@/Constants';

// // export default function ActiveRidePage() {
// //   const params = useParams();
// //   const router = useRouter();
// //   const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
// //   const { updateLocation } = useSocket();
// //   const { isNative, getCurrentLocation } = useReactNative();

// //   const [ride, setRide] = useState(null);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     loadRideDetails();
// //   }, [params.id]);

// //   // Add location tracking
// //   useEffect(() => {
// //     if (!ride || ride.rideStatus === 'completed' || ride.rideStatus === 'cancelled') return;

// //     let locationInterval;

// //     const trackLocation = async () => {
// //       try {
// //         if (isNative) {
// //           const location = await getCurrentLocation();
// //           if (location) {
// //             updateLocation(location, location.heading || 0, location.speed || 0);
// //           }
// //         } else {
// //           // Web fallback
// //           if (navigator.geolocation) {
// //             navigator.geolocation.getCurrentPosition(
// //               (position) => {
// //                 const location = {
// //                   lat: position.coords.latitude,
// //                   lng: position.coords.longitude,
// //                 };
// //                 const heading = position.coords.heading || 0;
// //                 const speed = position.coords.speed || 0;
// //                 updateLocation(location, heading, speed);
// //               },
// //               (error) => console.error('Location error:', error)
// //             );
// //           }
// //         }
// //       } catch (error) {
// //         console.error('Location tracking error:', error);
// //       }
// //     };

// //     // Track immediately
// //     trackLocation();

// //     // Then track every 5 seconds
// //     locationInterval = setInterval(trackLocation, 5000);

// //     return () => {
// //       if (locationInterval) clearInterval(locationInterval);
// //     };
// //   }, [ride?.rideStatus, isNative, getCurrentLocation, updateLocation]);

// //   const loadRideDetails = async () => {
// //     try {
// //       const response = await apiClient.get(`/rides/${params.id}`);
// //       if (response.success) {
// //         setRide(response.ride);
// //       }
// //     } catch (error) {
// //       console.error('Error loading ride:', error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleStartTrip = async () => {
// //     try {
// //       await startTrip(ride.id);
// //       loadRideDetails();
// //     } catch (error) {
// //       console.error('Error starting trip:', error);
// //     }
// //   };

// //   const handleCompleteTrip = async () => {
// //     if (window.confirm('Complete this ride?')) {
// //       try {
// //         await completeTrip(ride.id, {
// //           // Add completion data
// //         });
// //         router.push('/home');
// //       } catch (error) {
// //         console.error('Error completing trip:', error);
// //       }
// //     }
// //   };

// //   const handleConfirmArrival = async (type) => {
// //     try {
// //       await confirmArrival(ride.id, type);
// //       loadRideDetails();
// //     } catch (error) {
// //       console.error('Error confirming arrival:', error);
// //     }
// //   };

// //   const handleNavigate = () => {
// //     const destination =
// //       ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived'
// //         ? ride.pickupLocation
// //         : ride.dropoffLocation;

// //     const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
// //     window.open(url, '_blank');
// //   }

// //   if (loading || !ride) {
// //     return (
// //       <Box
// //         sx={{
// //           display: 'flex',
// //           justifyContent: 'center',
// //           alignItems: 'center',
// //           height: '100vh',
// //         }}
// //       >
// //         Loading...
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
// //       {/* AppBar */}
// //       <AppBar position="static" elevation={0}>
// //         <Toolbar>
// //           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
// //             <BackIcon />
// //           </IconButton>
// //           <Typography variant="h6" sx={{ flex: 1 }}>
// //             Active Ride
// //           </Typography>
// //           <IconButton color="inherit" href={`tel:${ride.rider?.phoneNumber}`}>
// //             <PhoneIcon />
// //           </IconButton>
// //         </Toolbar>
// //       </AppBar>

// //       {/* Map */}
// //       <Box sx={{ flex: 1, position: 'relative' }}>
// //         <GoogleMapIframe
// //           center={ride.pickupLocation}
// //           zoom={15}
// //           height="100%"
// //           pickupLocation={ride.pickupLocation}
// //           dropoffLocation={ride.dropoffLocation}
// //         />

// //         {/* Navigate FAB */}
// //         <Fab
// //           color="primary"
// //           sx={{
// //             position: 'absolute',
// //             bottom: 16,
// //             right: 16,
// //           }}
// //           onClick={handleNavigate}
// //         >
// //           <NavigationIcon />
// //         </Fab>
// //       </Box>

// //       {/* Ride Info Bottom Sheet */}
// //       <Paper
// //         elevation={8}
// //         sx={{
// //           borderTopLeftRadius: 24,
// //           borderTopRightRadius: 24,
// //           p: 3,
// //           maxHeight: '50vh',
// //           overflow: 'auto',
// //         }}
// //       >
// //         {/* Rider Info */}
// //         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
// //           <Avatar src={ride.rider?.profilePicture} sx={{ width: 56, height: 56 }}>
// //             {ride.rider?.firstName?.[0]}
// //           </Avatar>
// //           <Box sx={{ flex: 1 }}>
// //             <Typography variant="h6" sx={{ fontWeight: 600 }}>
// //               {ride.rider?.firstName} {ride.rider?.lastName}
// //             </Typography>
// //             <Typography variant="body2" color="text.secondary">
// //               ⭐ {ride.rider?.averageRating || '5.0'} • {ride.rider?.totalRides || 0} rides
// //             </Typography>
// //           </Box>
// //         </Box>

// //         {/* Trip Details */}
// //         <Box sx={{ mb: 3 }}>
// //           <Typography variant="subtitle2" color="text.secondary" gutterBottom>
// //             PICKUP
// //           </Typography>
// //           <Typography variant="body1" sx={{ mb: 2 }}>
// //             {ride.pickupLocation.address}
// //           </Typography>

// //           <Typography variant="subtitle2" color="text.secondary" gutterBottom>
// //             DROPOFF
// //           </Typography>
// //           <Typography variant="body1" sx={{ mb: 2 }}>
// //             {ride.dropoffLocation.address}
// //           </Typography>

// //           <Box sx={{ display: 'flex', gap: 2 }}>
// //             <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
// //               <Typography variant="h6" color="primary.main">
// //                 {formatDistance(ride.estimatedDistance * 1000)}
// //               </Typography>
// //               <Typography variant="caption" color="text.secondary">
// //                 Distance
// //               </Typography>
// //             </Paper>
// //             <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
// //               <Typography variant="h6" color="success.main">
// //                 {formatCurrency(ride.totalFare)}
// //               </Typography>
// //               <Typography variant="caption" color="text.secondary">
// //                 Fare
// //               </Typography>
// //             </Paper>
// //           </Box>
// //         </Box>

// //         {/* Action Buttons */}
// //         {ride.rideStatus === 'accepted' && (
// //           <Button
// //             fullWidth
// //             variant="contained"
// //             size="large"
// //             onClick={() => handleConfirmArrival('pickup')}
// //             sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
// //           >
// //             I've Arrived
// //           </Button>
// //         )}

// //         {ride.rideStatus === 'arrived' && (
// //           <Button
// //             fullWidth
// //             variant="contained"
// //             size="large"
// //             onClick={handleStartTrip}
// //             startIcon={<CheckIcon />}
// //             sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
// //           >
// //             Start Trip
// //           </Button>
// //         )}

// //         {ride.rideStatus === 'passenger_onboard' && (
// //           <Button
// //             fullWidth
// //             variant="contained"
// //             color="success"
// //             size="large"
// //             onClick={handleCompleteTrip}
// //             startIcon={<CheckIcon />}
// //             sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
// //           >
// //             Complete Trip
// //           </Button>
// //         )}
// //       </Paper>
// //     </Box>
// //   );
// // }
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
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
// import { useRide } from '@/lib/hooks/useRide';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { formatCurrency, formatDateTime } from '@/Functions';
// import { apiClient } from '@/lib/api/client';
// import { useSocket } from '@/lib/socket/SocketProvider';
// import { RIDE_STATUS } from '@/Constants';

// export default function ActiveRidePage() {
//   const params = useParams();
//   const router = useRouter();
//   const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
//   const { updateLocation } = useSocket();
//   const { isNative, getCurrentLocation } = useReactNative();

//   const [ride, setRide] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const mapControlsRef = useRef(null);

//   useEffect(() => {
//     loadRideDetails();
//   }, [params.id]);

//   // Add location tracking
//   useEffect(() => {
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
//             <Button
//               fullWidth
//               variant="contained"
//               color="success"
//               size="large"
//               onClick={handleCompleteTrip}
//               startIcon={<CheckIcon />}
//               sx={{
//                 height: 56,
//                 fontWeight: 700,
//                 borderRadius: 3,
//                 mb: 1,
//               }}
//             >
//               Complete Trip
//             </Button>
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
//     </Box>
//   );
// }
// driver/app/(main)/active-ride/[id]/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  IconButton,
  Avatar,
  Fab,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Phone as PhoneIcon,
  Navigation as NavigationIcon,
  Check as CheckIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Star as StarIcon,
  Receipt as ReceiptIcon,
  Message as MessageIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { useRide } from '@/lib/hooks/useRide';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { RIDE_STATUS } from '@/Constants';

export default function ActiveRidePage() {
  const params = useParams();
  const router = useRouter();
  const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
  const { updateLocation } = useSocket();
  const { isNative, getCurrentLocation } = useReactNative();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const mapControlsRef = useRef(null);

  useEffect(() => {
    loadRideDetails();
  }, [params.id]);

  // Add location tracking
  useEffect(() => {
    if (!ride || ride.rideStatus === 'completed' || ride.rideStatus === 'cancelled') return;

    let locationInterval;

    const trackLocation = async () => {
      try {
        if (isNative) {
          const location = await getCurrentLocation();
          if (location) {
            updateLocation(location, location.heading || 0, location.speed || 0);
          }
        } else {
          // Web fallback
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                const heading = position.coords.heading || 0;
                const speed = position.coords.speed || 0;
                updateLocation(location, heading, speed);
              },
              (error) => console.error('Location error:', error),
              { enableHighAccuracy: true }
            );
          }
        }
      } catch (error) {
        console.error('Location tracking error:', error);
      }
    };

    // Track immediately
    trackLocation();

    // Then track every 5 seconds
    locationInterval = setInterval(trackLocation, 5000);

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [ride?.rideStatus, isNative, getCurrentLocation, updateLocation]);

  const loadRideDetails = async () => {
    try {
      const response = await apiClient.get(`/rides/${params.id}`);
      if (response?.data) {
        setRide(response.data);
      }
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    try {
      await startTrip(ride.id);
      loadRideDetails();
    } catch (error) {
      console.error('Error starting trip:', error);
      alert('Failed to start trip');
    }
  };

  const handleCompleteTrip = async () => {
    if (window.confirm('Complete this ride?')) {
      try {
        await completeTrip(ride.id, {
          actualDistance: ride.estimatedDistance,
          actualDuration: ride.estimatedDuration,
        });
        router.push('/home');
      } catch (error) {
        console.error('Error completing trip:', error);
        alert('Failed to complete trip');
      }
    }
  };

  const handleConfirmArrival = async () => {
    try {
      await confirmArrival(ride.id);
      loadRideDetails();
    } catch (error) {
      console.error('Error confirming arrival:', error);
      alert('Failed to confirm arrival');
    }
  };

  const handleNavigate = () => {
    setShowNavigationModal(true);
  };

  const handleOpenInExternalApp = () => {
    const destination =
      ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived'
        ? ride.pickupLocation
        : ride.dropoffLocation;

    if (destination && destination.lat && destination.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleCallRider = () => {
    if (ride?.rider?.phoneNumber) {
      window.location.href = `tel:${ride.rider.phoneNumber}`;
    }
  };

  const handleMessageRider = () => {
    if (ride?.rider?.phoneNumber) {
      window.location.href = `sms:${ride.rider.phoneNumber}`;
    }
  };

  const formatETA = (minutes) => {
    if (!minutes && minutes !== 0) return 'Calculating...';

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case RIDE_STATUS.COMPLETED:
        return 'success';
      case RIDE_STATUS.CANCELLED:
        return 'error';
      case RIDE_STATUS.PASSENGER_ONBOARD:
        return 'primary';
      case RIDE_STATUS.ARRIVED:
        return 'success';
      case RIDE_STATUS.ACCEPTED:
        return 'info';
      default:
        return 'default';
    }
  };

  // Get destination for navigation
  const getNavigationDestination = () => {
    if (!ride) return null;
    return ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived'
      ? ride.pickupLocation
      : ride.dropoffLocation;
  };

  // Generate Google Maps Embed URL
  const getMapEmbedUrl = () => {
    const destination = getNavigationDestination();
    if (!destination) return '';

    // Using Google Maps Embed API with directions mode
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=current+location&destination=${destination.lat},${destination.lng}&mode=driving`;
  };

  if (loading || !ride) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Get valid map center
  const getMapCenter = () => {
    if (ride.pickupLocation?.lat && ride.pickupLocation?.lng) {
      return ride.pickupLocation;
    }
    // Default to Lusaka
    return { lat: -15.4167, lng: 28.2833 };
  };

  const destination = getNavigationDestination();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Active Ride
          </Typography>
          <Chip
            label={ride.rideStatus}
            color={getStatusColor(ride.rideStatus)}
            sx={{ color: 'white', mr: 1 }}
          />
          <IconButton color="inherit" onClick={handleCallRider}>
            <PhoneIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <GoogleMapIframe
          center={getMapCenter()}
          zoom={15}
          height="100%"
          pickupLocation={ride.pickupLocation}
          dropoffLocation={ride.dropoffLocation}
          showRoute={ride.rideStatus === 'passenger_onboard'}
          onMapLoad={(controls) => {
            mapControlsRef.current = controls;
          }}
        />

        {/* Navigate FAB */}
        <Fab
          color="primary"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
          onClick={handleNavigate}
        >
          <NavigationIcon />
        </Fab>
      </Box>

      {/* Ride Info Bottom Sheet */}
      <Paper
        elevation={8}
        sx={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '60vh',
          overflow: 'auto',
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Rider Info */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Rider Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main',
                }}
              >
                {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {ride.rider?.firstName} {ride.rider?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ride.rider?.phoneNumber}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2">
                    {ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={handleMessageRider}
                sx={{
                  bgcolor: 'primary.light',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' },
                }}
              >
                <MessageIcon />
              </IconButton>
            </Box>
          </Paper>

          {/* Trip Details */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Trip Details
            </Typography>

            {/* Pickup */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  PICKUP
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {ride.pickupLocation?.address}
                </Typography>
                {ride.pickupLocation?.name && (
                  <Typography variant="body2" sx={{ fontWeight: 300 }}>
                    <strong>{'> '}</strong>{ride.pickupLocation.name}
                  </Typography>
                )}
                {ride.acceptedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Accepted: {formatDateTime(ride.acceptedAt)}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Connecting line */}
            <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />

            {/* Dropoff */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'error.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  DROPOFF
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {ride.dropoffLocation?.address}
                </Typography>
                {ride.dropoffLocation?.name && (
                  <Typography variant="body2" sx={{ fontWeight: 300 }}>
                    <strong>{'> '}</strong>{ride.dropoffLocation.name}
                  </Typography>
                )}
                {ride.tripCompletedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Completed: {formatDateTime(ride.tripCompletedAt)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Fare Breakdown */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Fare Breakdown
            </Typography>

            <List disablePadding>
              {ride.baseFare !== null && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Base Fare" />
                  <Typography>{formatCurrency(ride.baseFare || 0)}</Typography>
                </ListItem>
              )}
              {ride.distanceFare !== null && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Distance Fare" />
                  <Typography>{formatCurrency(ride.distanceFare || 0)}</Typography>
                </ListItem>
              )}
              {ride.timeFare !== null && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Time Fare" />
                  <Typography>{formatCurrency(ride.timeFare || 0)}</Typography>
                </ListItem>
              )}
              {ride.surgeFare > 0 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Surge" />
                  <Typography color="warning.main">
                    +{formatCurrency(ride.surgeFare)}
                  </Typography>
                </ListItem>
              )}
              {ride.promoDiscount > 0 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Promo Discount" />
                  <Typography color="success.main">
                    -{formatCurrency(ride.promoDiscount)}
                  </Typography>
                </ListItem>
              )}
              <Divider sx={{ my: 1 }} />
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Total Fare"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <Typography fontWeight={600}>
                  {formatCurrency(ride.totalFare)}
                </Typography>
              </ListItem>

              {/* Subscription vs Float Mode */}
              {ride.wasSubscriptionRide ? (
                <>
                  <ListItem sx={{ px: 0, bgcolor: 'success.light', borderRadius: 2, mt: 1 }}>
                    <ListItemText
                      primary="Commission (Subscription Mode)"
                      secondary="You keep 100% of the fare!"
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    <Typography fontWeight={700} color="success.dark">
                      {formatCurrency(0)}
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Your Earnings"
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                    />
                    <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
                      {formatCurrency(ride.driverEarnings || ride.totalFare)}
                    </Typography>
                  </ListItem>
                </>
              ) : (
                <>
                  {ride.commission > 0 && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="Commission (15%)" />
                      <Typography color="error.main">
                        -{formatCurrency(ride.commission)}
                      </Typography>
                    </ListItem>
                  )}
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Your Earnings"
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                    />
                    <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
                      {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
                    </Typography>
                  </ListItem>
                </>
              )}
            </List>

            {/* Payment Method */}
            <Chip
              label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`}
              sx={{ mt: 2, fontWeight: 600 }}
            />
          </Paper>

          {/* Trip Stats */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Trip Statistics
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}
            >
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {ride.actualDistance?.toFixed(1) || ride.estimatedDistance?.toFixed(1) || '0'} km
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Distance
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {formatETA(ride.actualDuration || ride.estimatedDuration)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Action Buttons */}
          {ride.rideStatus === 'accepted' && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleConfirmArrival}
              sx={{
                height: 56,
                fontWeight: 700,
                borderRadius: 3,
                bgcolor: 'success.main',
                '&:hover': { bgcolor: 'success.dark' },
                mb: 1,
              }}
            >
              I've Arrived at Pickup
            </Button>
          )}

          {ride.rideStatus === 'arrived' && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleStartTrip}
              startIcon={<CheckIcon />}
              sx={{
                height: 56,
                fontWeight: 700,
                borderRadius: 3,
                bgcolor: 'primary.main',
                mb: 1,
              }}
            >
              Start Trip
            </Button>
          )}

          {ride.rideStatus === 'passenger_onboard' && (
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              onClick={handleCompleteTrip}
              startIcon={<CheckIcon />}
              sx={{
                height: 56,
                fontWeight: 700,
                borderRadius: 3,
                mb: 1,
              }}
            >
              Complete Trip
            </Button>
          )}

          {/* Cancel Button (for pending/accepted/arrived status) */}
          {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={async () => {
                const reason = window.prompt('Reason for cancellation:');
                if (reason) {
                  try {
                    await cancelRide(ride.id, reason);
                    router.push('/home');
                  } catch (error) {
                    console.error('Error cancelling ride:', error);
                    alert('Failed to cancel ride');
                  }
                }
              }}
              sx={{ height: 48, borderRadius: 3, fontWeight: 600, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Cancel Ride
            </Button>
          )}
        </Box>
      </Paper>

      {/* Navigation Modal */}
      {showNavigationModal && destination && (
        <SwipeableBottomSheet
          open={showNavigationModal}
          onClose={() => setShowNavigationModal(false)}
          expandedHeight="70%"
          initialHeight={window.innerHeight * 0.7}
          maxHeight={window.innerHeight * 0.9}
          minHeight={300}
          onSwipeDown={() => setShowNavigationModal(false)}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NavigationIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Navigation
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={handleOpenInExternalApp}
                  sx={{
                    bgcolor: 'primary.light',
                    '&:hover': { bgcolor: 'primary.main', color: 'white' },
                  }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setShowNavigationModal(false)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Destination Info */}
            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                NAVIGATING TO
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                {destination.name && `${destination.name} - `}
                {destination.address}
              </Typography>
            </Box>

            {/* Google Maps Embed */}
            <Box sx={{ flex: 1, position: 'relative', bgcolor: 'background.default' }}>
              <iframe
                src={getMapEmbedUrl()}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Box>

            {/* Action Button */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenInExternalApp}
                sx={{
                  height: 48,
                  fontWeight: 600,
                  borderRadius: 3,
                }}
              >
                Open in Google Maps App
              </Button>
            </Box>
          </Box>
        </SwipeableBottomSheet>
      )}
    </Box>
  );
}