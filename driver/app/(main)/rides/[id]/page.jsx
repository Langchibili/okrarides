// // //Okrarides\driver\app\(main)\rides\[id]\page.jsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useParams, useRouter } from 'next/navigation';
// // import {
// //   Box,
// //   AppBar,
// //   Toolbar,
// //   Typography,
// //   Paper,
// //   Avatar,
// //   Divider,
// //   IconButton,
// //   Button,
// //   Chip,
// //   Alert,
// //   CircularProgress,
// //   List,
// //   ListItem,
// //   ListItemText,
// // } from '@mui/material';
// // import {
// //   ArrowBack as BackIcon,
// //   LocationOn as LocationIcon,
// //   MyLocation as MyLocationIcon,
// //   Star as StarIcon,
// //   AccessTime as TimeIcon,
// //   Receipt as ReceiptIcon,
// //   Navigation as NavigationIcon,
// // } from '@mui/icons-material';
// // import { formatCurrency, formatDateTime } from '@/Functions';
// // import { apiClient } from '@/lib/api/client';
// // import { RIDE_STATUS } from '@/Constants';
// // import { useRide } from '@/lib/hooks/useRide';
// // import MapIframe from '@/components/Map/MapIframe';

// // export default function RideDetailPage() {
// //   const params = useParams();
// //   const router = useRouter();
// //   const [ride, setRide] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const { confirmArrival, startTrip, completeTrip, cancelRide } = useRide();

// //   useEffect(() => {
// //     loadRideDetails();
// //   }, [params.id]);

// //   const loadRideDetails = async () => {
// //     try {
// //       const response = await apiClient.get(`/rides/${params.id}`);
// //       if (response?.data) {
// //         setRide(response.data);
// //       }
// //     } catch (error) {
// //       console.error('Error loading ride:', error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }

// //   const formatETA = (minutes) => {
// //     if (!minutes && minutes !== 0) return 'Calculating...';

// //     if (minutes < 60) {
// //       return `${minutes} min`;
// //     }

// //     const hours = Math.floor(minutes / 60);
// //     const remainingMinutes = minutes % 60;

// //     if (remainingMinutes === 0) {
// //       return `${hours} hr`;
// //     }

// //     return `${hours} hr ${remainingMinutes} min`;
// //   }

// //   if (loading) {
// //     return (
// //       <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
// //         <CircularProgress />
// //       </Box>
// //     );
// //   }

// //   if (!ride) {
// //     return (
// //       <Box sx={{ p: 3 }}>
// //         <Alert severity="error">Ride not found</Alert>
// //       </Box>
// //     );
// //   }

// //   const getStatusColor = (status) => {
// //     switch (status) {
// //       case RIDE_STATUS.COMPLETED:
// //         return 'success';
// //       case RIDE_STATUS.CANCELLED:
// //         return 'error';
// //       default:
// //         return 'default';
// //     }
// //   };

// //   return (
// //     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
// //       {/* AppBar */}
// //       <AppBar position="static" elevation={0}>
// //         <Toolbar>
// //           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
// //             <BackIcon />
// //           </IconButton>
// //           <Typography variant="h6" sx={{ flex: 1 }}>
// //             Ride Details
// //           </Typography>
// //           <Chip
// //             label={ride.rideStatus}
// //             color={getStatusColor(ride.rideStatus)}
// //             sx={{ color: 'white' }}
// //           />
// //         </Toolbar>
// //       </AppBar>

// //       {/* Map */}
// //       <Box sx={{ height: 250 }}>
// //         <MapIframe
// //           center={ride.pickupLocation}
// //           zoom={13}
// //           height="250px"
// //           pickupLocation={ride.pickupLocation}
// //           dropoffLocation={ride.dropoffLocation}
// //         />
// //       </Box>

// //       <Box sx={{ p: 3 }}>
// //         {/* Rider Info */}
// //         <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// //           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// //             Rider Information
// //           </Typography>
// //           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
// //             <Avatar
// //               src={ride.rider?.profilePicture}
// //               sx={{ width: 56, height: 56 }}
// //             >
// //               {ride.rider?.firstName?.[0]}
// //             </Avatar>
// //             <Box sx={{ flex: 1 }}>
// //               <Typography variant="h6" sx={{ fontWeight: 600 }}>
// //                 {ride.rider?.firstName} {ride.rider?.lastName}
// //               </Typography>
// //               <Typography variant="body2" color="text.secondary">
// //                 {ride.rider?.phoneNumber}
// //               </Typography>
// //               <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
// //                 <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
// //                 <Typography variant="body2">
// //                   {ride.rider?.averageRating || '5.0'} • {ride.rider?.totalRides || 0} rides
// //                 </Typography>
// //               </Box>
// //             </Box>
// //           </Box>
// //         </Paper>

// //         {/* Trip Details */}
// //         <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// //           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// //             Trip Details
// //           </Typography>

// //           {/* Pickup */}
// //           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
// //             <Box
// //               sx={{
// //                 width: 36,
// //                 height: 36,
// //                 borderRadius: 2,
// //                 bgcolor: 'success.light',
// //                 display: 'flex',
// //                 alignItems: 'center',
// //                 justifyContent: 'center',
// //                 flexShrink: 0,
// //               }}
// //             >
// //               <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
// //             </Box>
// //             <Box sx={{ flex: 1 }}>
// //               <Typography variant="caption" color="text.secondary">
// //                 PICKUP
// //               </Typography>
// //               <Typography variant="body1" sx={{ fontWeight: 500 }}>
// //                 {ride.pickupLocation.address}
// //               </Typography>
// //               <Typography variant="body1" sx={{ fontWeight: 300 }}>
// //                 <strong>{'> '}</strong>{ride.pickupLocation.name}
// //               </Typography>
// //               {ride.acceptedAt && (
// //                 <Typography variant="caption" color="text.secondary">
// //                   Accepted: {formatDateTime(ride.acceptedAt)}
// //                 </Typography>
// //               )}
// //             </Box>
// //           </Box>

// //           {/* Connecting line */}
// //           <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />

// //           {/* Dropoff */}
// //           <Box sx={{ display: 'flex', gap: 2 }}>
// //             <Box
// //               sx={{
// //                 width: 36,
// //                 height: 36,
// //                 borderRadius: 2,
// //                 bgcolor: 'error.light',
// //                 display: 'flex',
// //                 alignItems: 'center',
// //                 justifyContent: 'center',
// //                 flexShrink: 0,
// //               }}
// //             >
// //               <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
// //             </Box>
// //             <Box sx={{ flex: 1 }}>
// //               <Typography variant="caption" color="text.secondary">
// //                 DROPOFF
// //               </Typography>
// //               <Typography variant="body1" sx={{ fontWeight: 500 }}>
// //                 {ride.dropoffLocation.address}
// //               </Typography>
// //               <small>
// //                 <Typography variant="body1" sx={{ fontWeight: 300 }}>
// //                  <strong>{'> '}</strong>{ride.dropoffLocation.name}
// //               </Typography>
// //               </small>
// //               {ride.tripCompletedAt && (
// //                 <Typography variant="caption" color="text.secondary">
// //                   Completed: {formatDateTime(ride.tripCompletedAt)}
// //                 </Typography>
// //               )}
// //             </Box>
// //           </Box>
// //         </Paper>

// //         {/* Fare Breakdown */}
// //         <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
// //           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// //             <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
// //             Fare Breakdown
// //           </Typography>

// //           <List disablePadding>
// //             <ListItem sx={{ px: 0 }}>
// //               <ListItemText primary="Base Fare" />
// //               <Typography>{formatCurrency(ride.baseFare || 0)}</Typography>
// //             </ListItem>
// //             <ListItem sx={{ px: 0 }}>
// //               <ListItemText primary="Distance Fare" />
// //               <Typography>{formatCurrency(ride.distanceFare || 0)}</Typography>
// //             </ListItem>
// //             <ListItem sx={{ px: 0 }}>
// //               <ListItemText primary="Time Fare" />
// //               <Typography>{formatCurrency(ride.timeFare || 0)}</Typography>
// //             </ListItem>
// //             {ride.surgeFare > 0 && (
// //               <ListItem sx={{ px: 0 }}>
// //                 <ListItemText primary="Surge" />
// //                 <Typography color="warning.main">
// //                   +{formatCurrency(ride.surgeFare)}
// //                 </Typography>
// //               </ListItem>
// //             )}
// //             {ride.promoDiscount > 0 && (
// //               <ListItem sx={{ px: 0 }}>
// //                 <ListItemText primary="Promo Discount" />
// //                 <Typography color="success.main">
// //                   -{formatCurrency(ride.promoDiscount)}
// //                 </Typography>
// //               </ListItem>
// //             )}
// //             <Divider sx={{ my: 1 }} />
// //             <ListItem sx={{ px: 0 }}>
// //               <ListItemText
// //                 primary="Subtotal"
// //                 primaryTypographyProps={{ fontWeight: 600 }}
// //               />
// //               <Typography fontWeight={600}>
// //                 {formatCurrency(ride.subtotal || ride.totalFare)}
// //               </Typography>
// //             </ListItem>

// //             {/* Subscription vs Float Mode */}
// //             {ride.wasSubscriptionRide ? (
// //               <>
// //                 <ListItem sx={{ px: 0, bgcolor: 'success.light', borderRadius: 2, mt: 1 }}>
// //                   <ListItemText
// //                     primary="Commission (Subscription Mode)"
// //                     secondary="You keep 100% of the fare!"
// //                     primaryTypographyProps={{ fontWeight: 600 }}
// //                   />
// //                   <Typography fontWeight={700} color="success.dark">
// //                     {formatCurrency(0)}
// //                   </Typography>
// //                 </ListItem>
// //                 <ListItem sx={{ px: 0 }}>
// //                   <ListItemText
// //                     primary="Your Earnings"
// //                     primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
// //                   />
// //                   <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
// //                     {formatCurrency(ride.driverEarnings || ride.totalFare)}
// //                   </Typography>
// //                 </ListItem>
// //               </>
// //             ) : (
// //               <>
// //                 {ride.commission > 0 && (
// //                   <ListItem sx={{ px: 0 }}>
// //                     <ListItemText primary="Commission (15%)" />
// //                     <Typography color="error.main">
// //                       -{formatCurrency(ride.commission)}
// //                     </Typography>
// //                   </ListItem>
// //                 )}
// //                 <ListItem sx={{ px: 0 }}>
// //                   <ListItemText
// //                     primary="Your Earnings"
// //                     primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
// //                   />
// //                   <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
// //                     {formatCurrency(ride.driverEarnings)}
// //                   </Typography>
// //                 </ListItem>
// //               </>
// //             )}
// //           </List>

// //           {/* Payment Method */}
// //           <Chip
// //             label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`}
// //             sx={{ mt: 2, fontWeight: 600 }}
// //           />
// //         </Paper>

// //         {/* Trip Stats */}
// //         <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
// //           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// //             Trip Statistics
// //           </Typography>
// //           <Box
// //             sx={{
// //               display: 'grid',
// //               gridTemplateColumns: '1fr 1fr',
// //               gap: 2,
// //             }}
// //           >
// //             <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
// //               <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
// //                 {ride.actualDistance?.toFixed(1) || ride.estimatedDistance?.toFixed(1)} km
// //               </Typography>
// //               <Typography variant="caption" color="text.secondary">
// //                 Distance
// //               </Typography>
// //             </Box>
// //             <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
// //               <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
// //                 {formatETA(ride.actualDuration || ride.estimatedDuration)}
// //               </Typography>
// //               <Typography variant="caption" color="text.secondary">
// //                 Duration
// //               </Typography>
// //             </Box>
// //           </Box>
// //         </Paper>
// //       </Box>
// //       {/* Action Buttons (if ride is active) */}
// //         {ride.rideStatus === 'accepted' && (
// //           <Box sx={{ p: 3 }}>
// //             <Button
// //               fullWidth
// //               variant="contained"
// //               size="large"
// //               onClick={async () => {
// //                 try {
// //                   await confirmArrival(ride.id);
// //                   loadRideDetails();
// //                 } catch (error) {
// //                   console.error('Error confirming arrival:', error);
// //                   alert('Failed to confirm arrival');
// //                 }
// //               }}
// //               sx={{
// //                 height: 56,
// //                 fontWeight: 700,
// //                 borderRadius: 3,
// //                 bgcolor: 'success.main',
// //                 '&:hover': { bgcolor: 'success.dark' },
// //               }}
// //             >
// //               I've Arrived at Pickup
// //             </Button>
// //           </Box>
// //         )}

// //         {ride.rideStatus === 'arrived' && (
// //           <Box sx={{ p: 3 }}>
// //             <Button
// //               fullWidth
// //               variant="contained"
// //               size="large"
// //               onClick={async () => {
// //                 try {
// //                   await startTrip(ride.id);
// //                   loadRideDetails();
// //                 } catch (error) {
// //                   console.error('Error starting trip:', error);
// //                   alert('Failed to start trip');
// //                 }
// //               }}
// //               sx={{
// //                 height: 56,
// //                 fontWeight: 700,
// //                 borderRadius: 3,
// //                 bgcolor: 'primary.main',
// //               }}
// //             >
// //               Start Trip
// //             </Button>
// //           </Box>
// //         )}

// //         {ride.rideStatus === 'passenger_onboard' && (
// //           <Box sx={{ p: 3 }}>
// //             <Button
// //               fullWidth
// //               variant="contained"
// //               size="large"
// //               color="success"
// //               onClick={async () => {
// //                 if (window.confirm('Complete this ride?')) {
// //                   try {
// //                     await completeTrip(ride.id, {
// //                       actualDistance: ride.estimatedDistance,
// //                       actualDuration: ride.estimatedDuration,
// //                     });
// //                     router.push('/home');
// //                   } catch (error) {
// //                     console.error('Error completing trip:', error);
// //                     alert('Failed to complete trip');
// //                   }
// //                 }
// //               }}
// //               sx={{
// //                 height: 56,
// //                 fontWeight: 700,
// //                 borderRadius: 3,
// //               }}
// //             >
// //               Complete Trip
// //             </Button>
// //           </Box>
// //         )}

// //         {/* Cancel Button (for pending/accepted status) */}
// //         {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
// //           <Box sx={{ p: 3, pt: 0 }}>
// //             <Button
// //               fullWidth
// //               variant="outlined"
// //               color="error"
// //               onClick={async () => {
// //                 const reason = window.prompt('Reason for cancellation:');
// //                 if (reason) {
// //                   try {
// //                     await cancelRide(ride.id, reason);
// //                     router.push('/home');
// //                   } catch (error) {
// //                     console.error('Error cancelling ride:', error);
// //                     alert('Failed to cancel ride');
// //                   }
// //                 }
// //               }}
// //               sx={{ height: 48, borderRadius: 3 }}
// //             >
// //               Cancel Ride
// //             </Button>
// //           </Box>
// //         )}
// //     </Box>
// //   );
// // }


// //Okrarides\driver\app\(main)\rides\[id]\page.jsx
// 'use client';

// import { useState, useEffect, useRef, useMemo } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import {
//   Box,
//   AppBar,
//   Toolbar,
//   Typography,
//   Paper,
//   Avatar,
//   Divider,
//   IconButton,
//   Button,
//   Chip,
//   Alert,
//   CircularProgress,
//   List,
//   ListItem,
//   ListItemText,
//   Fab,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon,
//   LocationOn as LocationIcon,
//   MyLocation as MyLocationIcon,
//   Star as StarIcon,
//   AccessTime as TimeIcon,
//   Receipt as ReceiptIcon,
//   Navigation as NavigationIcon,
// } from '@mui/icons-material';
// import { formatCurrency, formatDateTime } from '@/Functions';
// import { apiClient } from '@/lib/api/client';
// import { RIDE_STATUS } from '@/Constants';
// import { useRide } from '@/lib/hooks/useRide';
// import MapIframe from '@/components/Map/MapIframe';
// import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';

// export default function RideDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const [ride,    setRide]    = useState(null);
//   const [loading, setLoading] = useState(true);
//   const { confirmArrival, startTrip, completeTrip, cancelRide } = useRide();
//   const mapControlsRef = useRef(null);

//   useEffect(() => {
//     loadRideDetails();
//   }, [params.id]);

//   const loadRideDetails = async () => {
//     try {
//       const response = await apiClient.get(`/rides/${params.id}`);
//       if (response?.data) setRide(response.data);
//     } catch (error) {
//       console.error('Error loading ride:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatETA = (minutes) => {
//     if (!minutes && minutes !== 0) return 'Calculating...';
//     if (minutes < 60) return `${minutes} min`;
//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = minutes % 60;
//     if (remainingMinutes === 0) return `${hours} hr`;
//     return `${hours} hr ${remainingMinutes} min`;
//   };

//   // ── Map markers — same pattern as ActiveRidePage ───────────────────────────
//   // accepted / arrived        → pickup marker only (no route yet)
//   // passenger_onboard /
//   //   awaiting_payment        → pickup + dropoff + route
//   const rideStatus = ride?.rideStatus;

//   const markers = useMemo(() => {
//     const m = [];
//     if (ride?.pickupLocation)
//       m.push({ id: 'pickup', position: ride.pickupLocation, type: 'pickup', icon: '📍' });
//     if (ride?.dropoffLocation && (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment'))
//       m.push({ id: 'dropoff', position: ride.dropoffLocation, type: 'dropoff', icon: '🎯' });
//     return m;
//   }, [
//     ride?.pickupLocation?.lat,  ride?.pickupLocation?.lng,
//     ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng,
//     rideStatus,
//   ]);

//   const handleNavigate = () => {
//     const dest = (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment')
//       ? ride?.dropoffLocation
//       : ride?.pickupLocation;
//     if (!dest) return;
//     const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
//     window.open(url, '_blank');
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (!ride) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Alert severity="error">Ride not found</Alert>
//       </Box>
//     );
//   }

//   const getStatusColor = (status) => {
//     switch (status) {
//       case RIDE_STATUS.COMPLETED: return 'success';
//       case RIDE_STATUS.CANCELLED: return 'error';
//       default: return 'default';
//     }
//   };

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
//       {/* AppBar */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
//             <BackIcon />
//           </IconButton>
//           <Typography variant="h6" sx={{ flex: 1 }}>Ride Details</Typography>
//           <Chip label={ride.rideStatus} color={getStatusColor(ride.rideStatus)} sx={{ color: 'white' }} />
//         </Toolbar>
//       </AppBar>

//       {/* Map — same prop pattern as ActiveRidePage */}
//         {/* <Box sx={{ height:'280px', width:'100%', position:'relative', overflow:'hidden' }}>

//         <Box sx={{ position:'absolute', inset:0, zIndex:1 }}>
//           <MapIframe
//           center={ride.pickupLocation || { lat: -15.4167, lng: 28.2833 }}
//           zoom={15}
//           height="280px"
//           markers={markers}
//           pickupLocation={ride.pickupLocation}
//           dropoffLocation={(rideStatus === 'completed' || rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') ? ride.dropoffLocation : null}
//           showRoute={rideStatus === 'completed' || rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment'}
//           onMapLoad={(c) => { mapControlsRef.current = c; }}
//         />
//         <Fab
//           size="small"
//           variant="extended"
//           color="primary"
//           sx={{ position: 'absolute', bottom: 12, right: 12, borderRadius: '20px', zIndex: 5 }}
//           onClick={handleNavigate}
//         >
//           <NavigationIcon sx={{ mr: 0.5, fontSize: 18 }} />
//           Directions
//         </Fab>
//         </Box>
//       </Box> */}
        

//       <Box sx={{ p: 3 }}>
//         {/* Rider Info */}
//         <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Rider Information</Typography>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//             <Avatar src={ride.rider?.profilePicture} sx={{ width: 56, height: 56 }}>
//               {ride.rider?.firstName?.[0]}
//             </Avatar>
//             <Box sx={{ flex: 1 }}>
//               <Typography variant="h6" sx={{ fontWeight: 600 }}>
//                 {ride.rider?.firstName} {ride.rider?.lastName}
//               </Typography>
//               <Typography variant="body2" color="text.secondary">{ride.rider?.phoneNumber}</Typography>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
//                 <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
//                 <Typography variant="body2">
//                   {ride.rider?.averageRating || '5.0'} • {ride.rider?.totalRides || 0} rides
//                 </Typography>
//               </Box>
//             </Box>
//           </Box>
//         </Paper>

//         {/* Trip Details */}
//         <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Details</Typography>
//           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
//             <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//               <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
//             </Box>
//             <Box sx={{ flex: 1 }}>
//               <Typography variant="caption" color="text.secondary">PICKUP</Typography>
//               <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.pickupLocation.address}</Typography>
//               <Typography variant="body1" sx={{ fontWeight: 300 }}><strong>{'> '}</strong>{ride.pickupLocation.name}</Typography>
//               {ride.acceptedAt && (
//                 <Typography variant="caption" color="text.secondary">Accepted: {formatDateTime(ride.acceptedAt)}</Typography>
//               )}
//             </Box>
//           </Box>
//           <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />
//           <Box sx={{ display: 'flex', gap: 2 }}>
//             <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//               <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
//             </Box>
//             <Box sx={{ flex: 1 }}>
//               <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
//               <Typography variant="body1" sx={{ fontWeight: 500 }}>{ride.dropoffLocation.address}</Typography>
//               <small>
//                 <Typography variant="body1" sx={{ fontWeight: 300 }}><strong>{'> '}</strong>{ride.dropoffLocation.name}</Typography>
//               </small>
//               {ride.tripCompletedAt && (
//                 <Typography variant="caption" color="text.secondary">Completed: {formatDateTime(ride.tripCompletedAt)}</Typography>
//               )}
//             </Box>
//           </Box>
//         </Paper>

//         {/* Fare Breakdown */}
//         <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
//           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
//             <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
//             Fare Breakdown
//           </Typography>
//           <List disablePadding>
//             <ListItem sx={{ px: 0 }}>
//               <ListItemText primary="Base Fare" />
//               <Typography>{formatCurrency(ride.baseFare || 0)}</Typography>
//             </ListItem>
//             <ListItem sx={{ px: 0 }}>
//               <ListItemText primary="Distance Fare" />
//               <Typography>{formatCurrency(ride.distanceFare || 0)}</Typography>
//             </ListItem>
//             <ListItem sx={{ px: 0 }}>
//               <ListItemText primary="Time Fare" />
//               <Typography>{formatCurrency(ride.timeFare || 0)}</Typography>
//             </ListItem>
//             {ride.surgeFare > 0 && (
//               <ListItem sx={{ px: 0 }}>
//                 <ListItemText primary="Surge" />
//                 <Typography color="warning.main">+{formatCurrency(ride.surgeFare)}</Typography>
//               </ListItem>
//             )}
//             {ride.promoDiscount > 0 && (
//               <ListItem sx={{ px: 0 }}>
//                 <ListItemText primary="Promo Discount" />
//                 <Typography color="success.main">-{formatCurrency(ride.promoDiscount)}</Typography>
//               </ListItem>
//             )}
//             <Divider sx={{ my: 1 }} />
//             <ListItem sx={{ px: 0 }}>
//               <ListItemText primary="Subtotal" primaryTypographyProps={{ fontWeight: 600 }} />
//               <Typography fontWeight={600}>{formatCurrency(ride.subtotal || ride.totalFare)}</Typography>
//             </ListItem>
//             {ride.wasSubscriptionRide ? (
//               <>
//                 <ListItem sx={{ px: 0, bgcolor: 'success.light', borderRadius: 2, mt: 1 }}>
//                   <ListItemText
//                     primary="Commission (Subscription Mode)"
//                     secondary="You keep 100% of the fare!"
//                     primaryTypographyProps={{ fontWeight: 600 }}
//                   />
//                   <Typography fontWeight={700} color="success.dark">{formatCurrency(0)}</Typography>
//                 </ListItem>
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }} />
//                   <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
//                     {formatCurrency(ride.driverEarnings || ride.totalFare)}
//                   </Typography>
//                 </ListItem>
//               </>
//             ) : (
//               <>
//                 {ride.commission > 0 && (
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText primary="Commission (15%)" />
//                     <Typography color="error.main">-{formatCurrency(ride.commission)}</Typography>
//                   </ListItem>
//                 )}
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }} />
//                   <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
//                     {formatCurrency(ride.driverEarnings)}
//                   </Typography>
//                 </ListItem>
//               </>
//             )}
//           </List>
//           <Chip label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`} sx={{ mt: 2, fontWeight: 600 }} />
//         </Paper>

//         {/* Trip Stats */}
//         <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
//           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Trip Statistics</Typography>
//           <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
//             <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
//               <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
//                 {ride.actualDistance?.toFixed(1) || ride.estimatedDistance?.toFixed(1)} km
//               </Typography>
//               <Typography variant="caption" color="text.secondary">Distance</Typography>
//             </Box>
//             <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
//               <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
//                 {formatETA(ride.actualDuration || ride.estimatedDuration)}
//               </Typography>
//               <Typography variant="caption" color="text.secondary">Duration</Typography>
//             </Box>
//           </Box>
//         </Paper>
//       </Box>

//       {/* Action Buttons */}
//       {ride.rideStatus === 'accepted' && (
//         <Box sx={{ p: 3 }}>
//           <Button fullWidth variant="contained" size="large"
//             onClick={async () => {
//               try { await confirmArrival(ride.id); loadRideDetails(); }
//               catch (error) { console.error('Error confirming arrival:', error); alert('Failed to confirm arrival'); }
//             }}
//             sx={{ height: 56, fontWeight: 700, borderRadius: 3, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
//             I've Arrived at Pickup
//           </Button>
//         </Box>
//       )}

//       {ride.rideStatus === 'arrived' && (
//         <Box sx={{ p: 3 }}>
//           <Button fullWidth variant="contained" size="large"
//             onClick={async () => {
//               try { await startTrip(ride.id); loadRideDetails(); }
//               catch (error) { console.error('Error starting trip:', error); alert('Failed to start trip'); }
//             }}
//             sx={{ height: 56, fontWeight: 700, borderRadius: 3, bgcolor: 'primary.main' }}>
//             Start Trip
//           </Button>
//         </Box>
//       )}

//       {ride.rideStatus === 'passenger_onboard' && (
//         <Box sx={{ p: 3 }}>
//           <Button fullWidth variant="contained" size="large" color="success"
//             onClick={async () => {
//               if (window.confirm('Complete this ride?')) {
//                 try {
//                   await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration });
//                   router.push('/home');
//                 } catch (error) { console.error('Error completing trip:', error); alert('Failed to complete trip'); }
//               }
//             }}
//             sx={{ height: 56, fontWeight: 700, borderRadius: 3 }}>
//             Complete Trip
//           </Button>
//         </Box>
//       )}

//       {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
//         <Box sx={{ p: 3, pt: 0 }}>
//           <Button fullWidth variant="outlined" color="error"
//             onClick={async () => {
//               const reason = window.prompt('Reason for cancellation:');
//               if (reason) {
//                 try { await cancelRide(ride.id, reason); router.push('/home'); }
//                 catch (error) { console.error('Error cancelling ride:', error); alert('Failed to cancel ride'); }
//               }
//             }}
//             sx={{ height: 48, borderRadius: 3 }}>
//             Cancel Ride
//           </Button>
//         </Box>
//       )}
//     </Box>
//   );
// }
// PATH: app/(main)/rides/[id]/page.jsx
'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Paper, Avatar,
  Divider, IconButton, Button, Chip, Alert,
  List, ListItem, ListItemText, Fab,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as BackIcon, LocationOn as DropIcon,
  MyLocation as PickupIcon, Star as StarIcon,
  Receipt as ReceiptIcon, Navigation as NavIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { RIDE_STATUS } from '@/Constants';
import { useRide } from '@/lib/hooks/useRide';
import MapIframe from '@/components/Map/MapIframe';
import { RideDetailSkeleton } from '@/components/Skeletons/RideDetailSkeleton';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

const STATUS_HEX = {
  completed:         '#10B981',
  cancelled:         '#EF4444',
  accepted:          '#3B82F6',
  arrived:           '#059669',
  passenger_onboard: '#8B5CF6',
  awaiting_payment:  '#F59E0B',
};

function SectionCard({ title, icon, children, accent }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
      <Paper elevation={isDark ? 0 : 2} sx={{
        p: 2.5, borderRadius: 3, mb: 2,
        border: `1px solid ${alpha(accent ?? theme.palette.divider, isDark ? 0.18 : 0.1)}`,
        background: accent ? (isDark
          ? `linear-gradient(145deg, ${alpha(accent, 0.1)} 0%, transparent 60%)`
          : `linear-gradient(145deg, ${alpha(accent, 0.04)} 0%, transparent 60%)`) : undefined,
      }}>
        {title && (
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon && <Box sx={{ '& svg': { fontSize: 18, color: accent ?? 'text.secondary' } }}>{icon}</Box>}
            {title}
          </Typography>
        )}
        {children}
      </Paper>
    </motion.div>
  );
}

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [ride, setRide]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { confirmArrival, startTrip, completeTrip, cancelRide } = useRide();
  const mapControlsRef = useRef(null);

  useEffect(() => { loadRideDetails(); }, [params.id]);

  const loadRideDetails = async () => {
    try {
      const response = await apiClient.get(`/rides/${params.id}`);
      if (response?.data) setRide(response.data);
    } catch (err) { console.error('Error loading ride:', err); }
    finally { setLoading(false); }
  };

  const formatETA = (m) => !m && m !== 0 ? 'N/A' : m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60 ? m%60+'m' : ''}`.trim();

  const rideStatus = ride?.rideStatus;
  const hex        = STATUS_HEX[rideStatus] ?? '#9CA3AF';

  const markers = useMemo(() => {
    const m = [];
    if (ride?.pickupLocation)  m.push({ id:'pickup',  position: ride.pickupLocation,  type:'pickup',  icon:'📍' });
    if (ride?.dropoffLocation && (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment' || rideStatus === 'completed'))
      m.push({ id:'dropoff', position: ride.dropoffLocation, type:'dropoff', icon:'🎯' });
    return m;
  }, [ride?.pickupLocation?.lat, ride?.pickupLocation?.lng, ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng, rideStatus]);

  const handleNavigate = () => {
    const dest = (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment')
      ? ride?.dropoffLocation : ride?.pickupLocation;
    if (!dest) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`, '_blank');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

      {/* ── AppBar ─────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1E293B', 0.98)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Ride Details</Typography>
          {rideStatus && (
            <Chip
              label={rideStatus.replace(/_/g, ' ')}
              size="small"
              sx={{ bgcolor: alpha(hex, 0.22), color: hex, fontWeight: 700, textTransform: 'capitalize', height: 24 }}
            />
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', pb: 4, ...hideScrollbar }}>
        {loading ? (
          <RideDetailSkeleton />
        ) : !ride ? (
          <Box sx={{ p: 3 }}><Alert severity="error">Ride not found</Alert></Box>
        ) : (
          <>
            {/* ── Status strip ─────────────────────────────────────────── */}
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${hex} 0%, ${alpha(hex, 0.3)} 100%)` }} />

            <Box sx={{ p: 2.5 }}>
              {/* ── Rider info ───────────────────────────────────────────── */}
              <SectionCard title="Rider" accent={hex}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={ride.rider?.profilePicture}
                    sx={{ width: 56, height: 56, border: `2px solid ${alpha(hex, 0.4)}`,
                      background: `linear-gradient(135deg, ${hex} 0%, ${alpha(hex, 0.6)} 100%)` }}>
                    {ride.rider?.firstName?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {ride.rider?.firstName} {ride.rider?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{ride.rider?.phoneNumber}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                      <Typography variant="caption" fontWeight={600} color="#F59E0B">
                        {ride.rider?.averageRating || '5.0'}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        · {ride.rider?.totalRides || 0} rides
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </SectionCard>

              {/* ── Route ─────────────────────────────────────────────────── */}
              <SectionCard title="Route" icon={<NavIcon />} accent="#3B82F6">
                {/* Pickup */}
                <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#10B981', isDark ? 0.2 : 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PickupIcon sx={{ color: '#10B981', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Pickup</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ride.pickupLocation?.address}
                    </Typography>
                    {ride.pickupLocation?.name && (
                      <Typography variant="caption" color="text.secondary">{ride.pickupLocation.name}</Typography>
                    )}
                    {ride.acceptedAt && (
                      <Typography variant="caption" color="text.disabled" display="block">{formatDateTime(ride.acceptedAt)}</Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ width: 2, height: 20, bgcolor: alpha(theme.palette.divider, 0.5), ml: 2.2, mb: 1.5 }} />

                {/* Dropoff */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#EF4444', isDark ? 0.2 : 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DropIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Dropoff</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ride.dropoffLocation?.address}
                    </Typography>
                    {ride.dropoffLocation?.name && (
                      <Typography variant="caption" color="text.secondary">{ride.dropoffLocation.name}</Typography>
                    )}
                    {ride.tripCompletedAt && (
                      <Typography variant="caption" color="text.disabled" display="block">{formatDateTime(ride.tripCompletedAt)}</Typography>
                    )}
                  </Box>
                </Box>
              </SectionCard>

              {/* ── Fare ─────────────────────────────────────────────────── */}
              <SectionCard title="Fare Breakdown" icon={<ReceiptIcon />} accent="#F59E0B">
                <List disablePadding dense>
                  {[
                    { label: 'Base Fare',     value: ride.baseFare     },
                    { label: 'Distance Fare', value: ride.distanceFare },
                    { label: 'Time Fare',     value: ride.timeFare     },
                  ].filter(r => r.value != null).map(r => (
                    <ListItem key={r.label} sx={{ px: 0, py: 0.6 }}>
                      <ListItemText primary={<Typography variant="body2" color="text.secondary">{r.label}</Typography>} />
                      <Typography variant="body2" fontWeight={500}>{formatCurrency(r.value)}</Typography>
                    </ListItem>
                  ))}
                  {ride.surgeFare > 0 && (
                    <ListItem sx={{ px: 0, py: 0.6 }}>
                      <ListItemText primary={<Typography variant="body2" color="text.secondary">Surge</Typography>} />
                      <Typography variant="body2" color="warning.main" fontWeight={600}>+{formatCurrency(ride.surgeFare)}</Typography>
                    </ListItem>
                  )}
                  {ride.promoDiscount > 0 && (
                    <ListItem sx={{ px: 0, py: 0.6 }}>
                      <ListItemText primary={<Typography variant="body2" color="text.secondary">Promo</Typography>} />
                      <Typography variant="body2" color="success.main" fontWeight={600}>-{formatCurrency(ride.promoDiscount)}</Typography>
                    </ListItem>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <ListItem sx={{ px: 0, py: 0.6 }}>
                    <ListItemText primary={<Typography variant="body2" fontWeight={700}>Total Fare</Typography>} />
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(ride.totalFare)}</Typography>
                  </ListItem>
                  {ride.wasSubscriptionRide ? (
                    <ListItem sx={{ px: 0, py: 0.6, bgcolor: alpha('#10B981', isDark ? 0.12 : 0.06), borderRadius: 1.5, mt: 0.5, px: 1.5 }}>
                      <ListItemText primary={<Typography variant="body2" fontWeight={700}>Your Earnings</Typography>}
                        secondary="0% commission — subscription ride!" />
                      <Typography variant="subtitle1" fontWeight={800} color="success.main">
                        {formatCurrency(ride.driverEarnings || ride.totalFare)}
                      </Typography>
                    </ListItem>
                  ) : (
                    <>
                      {ride.commission > 0 && (
                        <ListItem sx={{ px: 0, py: 0.6 }}>
                          <ListItemText primary={<Typography variant="body2" color="text.secondary">Commission</Typography>} />
                          <Typography variant="body2" color="error.main">-{formatCurrency(ride.commission)}</Typography>
                        </ListItem>
                      )}
                      <ListItem sx={{ px: 0, py: 0.6 }}>
                        <ListItemText primary={<Typography variant="body2" fontWeight={700}>Your Earnings</Typography>} />
                        <Typography variant="subtitle1" fontWeight={800} color="success.main">
                          {formatCurrency(ride.driverEarnings)}
                        </Typography>
                      </ListItem>
                    </>
                  )}
                </List>
                <Chip
                  label={ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}
                  size="small"
                  sx={{ mt: 1.5, fontWeight: 700, bgcolor: alpha(ride.paymentMethod === 'cash' ? '#10B981' : '#3B82F6', isDark ? 0.2 : 0.1),
                    color: ride.paymentMethod === 'cash' ? 'success.main' : 'primary.main' }}
                />
              </SectionCard>

              {/* ── Stats ─────────────────────────────────────────────────── */}
              <SectionCard title="Trip Stats" accent="#8B5CF6">
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {[
                    { label: 'Distance', value: `${(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km`, color: '#3B82F6' },
                    { label: 'Duration', value: formatETA(ride.actualDuration ?? ride.estimatedDuration), color: '#8B5CF6' },
                  ].map(({ label, value, color }) => (
                    <Paper key={label} elevation={0} sx={{
                      textAlign: 'center', p: 2, borderRadius: 2.5,
                      border: `1px solid ${alpha(color, isDark ? 0.2 : 0.1)}`,
                      background: `linear-gradient(145deg, ${alpha(color, isDark ? 0.12 : 0.05)} 0%, transparent 100%)`,
                    }}>
                      <Typography variant="h5" fontWeight={800}
                        sx={{ background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.25 }}>
                        {value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
                    </Paper>
                  ))}
                </Box>
              </SectionCard>

              {/* ── Action buttons ─────────────────────────────────────── */}
              {ride.rideStatus === 'accepted' && (
                <Button fullWidth variant="contained" size="large"
                  onClick={async () => { try { await confirmArrival(ride.id); loadRideDetails(); } catch (e) { console.error(e); } }}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: `0 4px 16px ${alpha('#10B981', 0.4)}`, mb: 1 }}>
                  I've Arrived at Pickup
                </Button>
              )}
              {ride.rideStatus === 'arrived' && (
                <Button fullWidth variant="contained" size="large"
                  onClick={async () => { try { await startTrip(ride.id); loadRideDetails(); } catch (e) { console.error(e); } }}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    boxShadow: `0 4px 16px ${alpha('#3B82F6', 0.4)}`, mb: 1 }}>
                  Start Trip
                </Button>
              )}
              {ride.rideStatus === 'passenger_onboard' && (
                <Button fullWidth variant="contained" color="success" size="large"
                  onClick={async () => {
                    if (window.confirm('Complete this ride?')) {
                      try { await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration }); router.push('/home'); }
                      catch (e) { console.error(e); }
                    }
                  }}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                    boxShadow: `0 4px 16px ${alpha('#10B981', 0.4)}`, mb: 1 }}>
                  Complete Trip
                </Button>
              )}
              {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
                <Button fullWidth variant="outlined" color="error"
                  onClick={async () => {
                    const reason = window.prompt('Reason for cancellation:');
                    if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
                  }}
                  sx={{ height: 48, borderRadius: 3, fontWeight: 700, textTransform: 'none', borderWidth: 1.5 }}>
                  Cancel Ride
                </Button>
              )}

              <Button fullWidth variant="outlined" startIcon={<NavIcon />}
                onClick={handleNavigate}
                sx={{ height: 48, borderRadius: 3, fontWeight: 600, textTransform: 'none', mt: 1.5 }}>
                Open in Google Maps
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}