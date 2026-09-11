// //Okra\Okrarides\rider\app\(main)\trips\[id]\receipt\page.jsx
// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Paper,
//   IconButton,
//   Divider,
//   Button,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon,
//   Download as DownloadIcon,
//   Share as ShareIcon,
//   Print as PrintIcon,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { ridesAPI } from '@/lib/api/rides';
// import { formatCurrency, formatDate, formatDistance, formatDuration } from '@/Functions';
// import { APP_NAME } from '@/Constants';
// import { Spinner } from '@/components/ui';

// export default function TripReceiptPage() {
//   const router = useRouter();
//   const params = useParams();
//   const receiptRef = useRef(null);
//   const [ride, setRide] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (params.id) {
//       loadRide();
//     }
//   }, [params.id]);

//   const loadRide = async () => {
//     try {
//       setLoading(true);
//       const data = await ridesAPI.getRide(params.id);
//       setRide(data);
//     } catch (error) {
//       console.error('Error loading ride:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownload = () => {
//     const receipt = {
//       rideCode: ride.rideCode,
//       date: formatDate(ride.completedAt || ride.createdAt, 'long'),
//       from: ride.pickupLocation.address,
//       to: ride.dropoffLocation.address,
//       distance: formatDistance(ride.actualDistance),
//       duration: formatDuration(ride.actualDuration),
//       baseFare: ride.baseFare,
//       distanceFare: ride.distanceFare,
//       timeFare: ride.timeFare || 0,
//       surgeFare: ride.surgeFare || 0,
//       promoDiscount: ride.promoDiscount || 0,
//       totalFare: ride.totalFare,
//       paymentMethod: ride.paymentMethod,
//       driver: `${ride.driver?.firstName} ${ride.driver?.lastName}`,
//       vehicle: `${ride.vehicle?.color} ${ride.vehicle?.make} ${ride.vehicle?.model}`,
//       plate: ride.vehicle?.numberPlate,
//     };

//     const blob = new Blob([JSON.stringify(receipt, null, 2)], {
//       type: 'application/json',
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `okra-receipt-${ride.rideCode}.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   const handleShare = async () => {
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: 'Okra Rides Receipt',
//           text: `Trip Receipt: ${ride.rideCode} - ${formatCurrency(ride.totalFare)}`,
//         });
//       } catch (error) {
//         console.log('Share cancelled');
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
//         <Spinner />
//       </Box>
//     );
//   }

//   if (!ride) {
//     return (
//       <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
//         <Typography>Receipt not found</Typography>
//         <Button onClick={() => router.back()} sx={{ mt: 2 }}>
//           Go Back
//         </Button>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
//       {/* Header */}
//       <Box
//         sx={{
//           p: 2,
//           bgcolor: 'background.paper',
//           borderBottom: 1,
//           borderColor: 'divider',
//           display: 'flex',
//           alignItems: 'center',
//           gap: 2,
//           '@media print': {
//             display: 'none',
//           },
//         }}
//       >
//         <IconButton onClick={() => router.back()} edge="start">
//           <BackIcon />
//         </IconButton>
//         <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
//           Receipt
//         </Typography>
//       </Box>

//       <Box sx={{ p: 2 }}>
//         {/* Receipt */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//           <Paper
//             ref={receiptRef}
//             sx={{
//               p: 4,
//               mb: 3,
//               maxWidth: 600,
//               mx: 'auto',
//               '@media print': {
//                 boxShadow: 'none',
//                 border: 'none',
//               },
//             }}
//           >
//             {/* Header */}
//             <Box sx={{ textAlign: 'center', mb: 4 }}>
//               <Typography
//                 variant="h4"
//                 sx={{
//                   fontWeight: 700,
//                   background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
//                   WebkitBackgroundClip: 'text',
//                   WebkitTextFillColor: 'transparent',
//                   mb: 1,
//                 }}
//               >
//                 {APP_NAME}
//               </Typography>
//               <Typography variant="caption" color="text.secondary">
//                 Trip Receipt
//               </Typography>
//             </Box>

//             {/* Ride Code */}
//             <Box sx={{ textAlign: 'center', mb: 3 }}>
//               <Typography variant="caption" color="text.secondary">
//                 Ride Code
//               </Typography>
//               <Typography variant="h6" sx={{ fontWeight: 600 }}>
//                 {ride.rideCode}
//               </Typography>
//             </Box>

//             <Divider sx={{ mb: 3 }} />

//             {/* Date & Time */}
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Date
//               </Typography>
//               <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                 {formatDate(ride.completedAt || ride.createdAt, 'short')}
//               </Typography>
//             </Box>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Time
//               </Typography>
//               <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                 {formatDate(ride.completedAt || ride.createdAt, 'time')}
//               </Typography>
//             </Box>

//             <Divider sx={{ mb: 3 }} />

//             {/* Route */}
//             <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
//               Trip Details
//             </Typography>

//             <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
//               <Box
//                 sx={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: '50%',
//                   bgcolor: 'success.main',
//                   mt: 0.5,
//                   flexShrink: 0,
//                 }}
//               />
//               <Box>
//                 <Typography variant="caption" color="text.secondary">
//                   Pickup
//                 </Typography>
//                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                   {ride.pickupLocation.address}
//                 </Typography>
//               </Box>
//             </Box>

//             <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: '5px', mb: 2 }} />

//             <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
//               <Box
//                 sx={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: 1,
//                   bgcolor: 'error.main',
//                   mt: 0.5,
//                   flexShrink: 0,
//                 }}
//               />
//               <Box>
//                 <Typography variant="caption" color="text.secondary">
//                   Dropoff
//                 </Typography>
//                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                   {ride.dropoffLocation.address}
//                 </Typography>
//               </Box>
//             </Box>

//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Distance
//               </Typography>
//               <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                 {formatDistance(ride.actualDistance)}
//               </Typography>
//             </Box>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Duration
//               </Typography>
//               <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                 {formatDuration(ride.actualDuration)}
//               </Typography>
//             </Box>

//             <Divider sx={{ mb: 3 }} />

//             {/* Driver Info */}
//             {ride.driver && (
//               <>
//                 <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
//                   Driver Information
//                 </Typography>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//                   <Typography variant="body2" color="text.secondary">
//                     Name
//                   </Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                     {ride.driver.firstName} {ride.driver.lastName}
//                   </Typography>
//                 </Box>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//                   <Typography variant="body2" color="text.secondary">
//                     Vehicle
//                   </Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                     {ride.vehicle?.color} {ride.vehicle?.make} {ride.vehicle?.model}
//                   </Typography>
//                 </Box>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
//                   <Typography variant="body2" color="text.secondary">
//                     Plate Number
//                   </Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                     {ride.vehicle?.numberPlate}
//                   </Typography>
//                 </Box>
//                 <Divider sx={{ mb: 3 }} />
//               </>
//             )}

//             {/* Fare Breakdown */}
//             <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
//               Fare Breakdown
//             </Typography>

//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Base Fare
//               </Typography>
//               <Typography variant="body2">{formatCurrency(ride.baseFare || 0)}</Typography>
//             </Box>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Distance Fare
//               </Typography>
//               <Typography variant="body2">
//                 {formatCurrency(ride.distanceFare || 0)}
//               </Typography>
//             </Box>
//             {ride.timeFare > 0 && (
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                 <Typography variant="body2" color="text.secondary">
//                   Time Fare
//                 </Typography>
//                 <Typography variant="body2">{formatCurrency(ride.timeFare)}</Typography>
//               </Box>
//             )}
//             {ride.surgeFare > 0 && (
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                 <Typography variant="body2" color="text.secondary">
//                   Surge
//                 </Typography>
//                 <Typography variant="body2">{formatCurrency(ride.surgeFare)}</Typography>
//               </Box>
//             )}
//             {ride.promoDiscount > 0 && (
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                 <Typography variant="body2" color="success.main">
//                   Promo Discount
//                 </Typography>
//                 <Typography variant="body2" color="success.main">
//                   -{formatCurrency(ride.promoDiscount)}
//                 </Typography>
//               </Box>
//             )}

//             <Divider sx={{ my: 2 }} />

//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
//               <Typography variant="h6" sx={{ fontWeight: 700 }}>
//                 Total
//               </Typography>
//               <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
//                 {formatCurrency(ride.totalFare)}
//               </Typography>
//             </Box>

//             <Divider sx={{ mb: 3 }} />

//             {/* Payment Method */}
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
//               <Typography variant="body2" color="text.secondary">
//                 Payment Method
//               </Typography>
//               <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                 {ride.paymentMethod === 'cash' ? 'Cash' : 'OkraPay'}
//               </Typography>
//             </Box>

//             {/* Footer */}
//             <Box
//               sx={{
//                 textAlign: 'center',
//                 pt: 3,
//                 borderTop: 1,
//                 borderColor: 'divider',
//               }}
//             >
//               <Typography variant="caption" color="text.secondary">
//                 Thank you for riding with {APP_NAME}!
//                 <br />
//                 For support, contact: support@okrarides.com
//               </Typography>
//             </Box>
//           </Paper>
//         </motion.div>

//         {/* Actions */}
//         <Box
//           sx={{
//             display: 'flex',
//             gap: 2,
//             maxWidth: 600,
//             mx: 'auto',
//             '@media print': {
//               display: 'none',
//             },
//           }}
//         >
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<DownloadIcon />}
//             onClick={handleDownload}
//             sx={{ height: 48 }}
//           >
//             Download
//           </Button>
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<PrintIcon />}
//             onClick={handlePrint}
//             sx={{ height: 48 }}
//           >
//             Print
//           </Button>
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<ShareIcon />}
//             onClick={handleShare}
//             sx={{ height: 48 }}
//           >
//             Share
//           </Button>
//         </Box>
//       </Box>
//     </Box>
//   );
// }
'use client';
// PATH: rider/app/(main)/trips/[id]/receipt/page.jsx

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box, Typography, Paper, IconButton, Divider, Button, CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ridesAPI } from '@/lib/api/rides';
import { formatCurrency, formatDate, formatDistance, formatDuration } from '@/Functions';
import { APP_NAME } from '@/Constants';

export default function TripReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const [receipt, setReceipt]   = useState(null);   // JSON receipt from backend
  const [loading, setLoading]   = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (params.id) loadReceipt();
  }, [params.id]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      // GET /api/rides/:id/receipt returns structured JSON
      const data = await ridesAPI.getReceipt(params.id);
      setReceipt(data);
    } catch (error) {
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the backend-generated HTML receipt in a new tab.
   * The HTML page has a "Save as PDF / Print" button and auto-download support.
   */
  const handleDownload = async () => {
    try {
      setDownloading(true);
      // GET /api/rides/:id/receipt/download returns a full HTML document
      const url = await ridesAPI.getReceiptDownloadUrl(params.id);
      // Open in new tab — user can then print → Save as PDF
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download receipt');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (!receipt) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${APP_NAME} Receipt`,
          text:  `Trip Receipt: ${receipt.rideDetails.rideCode} — ${formatCurrency(receipt.fareBreakdown.totalFare)}`,
        });
      } catch {}
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!receipt) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        <Typography>Receipt not found</Typography>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  const fare = receipt.fareBreakdown;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2, bgcolor: 'background.paper',
          borderBottom: 1, borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 2,
          '@media print': { display: 'none' },
        }}
      >
        <IconButton onClick={() => router.back()} edge="start"><BackIcon /></IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>Receipt</Typography>
        <IconButton onClick={handleShare}><ShareIcon /></IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            sx={{
              p: 4, mb: 3, maxWidth: 600, mx: 'auto',
              '@media print': { boxShadow: 'none', border: 'none' },
            }}
          >
            {/* Branding */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                {APP_NAME}
              </Typography>
              <Typography variant="caption" color="text.secondary">Trip Receipt</Typography>
            </Box>

            {/* Ride Code */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="caption" color="text.secondary">Ride Code</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {receipt.rideDetails.rideCode}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Date */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatDate(receipt.rideDetails.date, 'short')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Time</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatDate(receipt.rideDetails.date, 'time')}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Route */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Trip Details</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main', mt: 0.5, flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Pickup</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {receipt.locations.pickup.address}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: '5px', mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: 'error.main', mt: 0.5, flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Dropoff</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {receipt.locations.dropoff.address}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Distance</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{receipt.tripInfo.distance}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Duration</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{receipt.tripInfo.duration}</Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Driver */}
            {receipt.driver && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Driver</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{receipt.driver.name}</Typography>
                </Box>
                {receipt.vehicle && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {receipt.vehicle.color} {receipt.vehicle.make} {receipt.vehicle.model}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">Plate</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{receipt.vehicle.numberPlate}</Typography>
                    </Box>
                  </>
                )}
                <Divider sx={{ mb: 3 }} />
              </>
            )}

            {/* Fare Breakdown */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Fare Breakdown</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Base Fare</Typography>
              <Typography variant="body2">{formatCurrency(fare.baseFare)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Distance Fare</Typography>
              <Typography variant="body2">{formatCurrency(fare.distanceFare)}</Typography>
            </Box>
            {fare.timeFare > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Time Fare</Typography>
                <Typography variant="body2">{formatCurrency(fare.timeFare)}</Typography>
              </Box>
            )}
            {fare.surgeFare > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Surge</Typography>
                <Typography variant="body2">{formatCurrency(fare.surgeFare)}</Typography>
              </Box>
            )}
            {fare.promoDiscount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="success.main">Promo Discount</Typography>
                <Typography variant="body2" color="success.main">
                  -{formatCurrency(fare.promoDiscount)}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatCurrency(fare.totalFare)}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Payment */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Payment Method</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {receipt.payment.method === 'cash' ? 'Cash' : 'OkraPay'}
              </Typography>
            </Box>

            {receipt.rideDetails.wasSubscriptionRide && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Note</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  Subscription Ride — 0% commission
                </Typography>
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ textAlign: 'center', pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Thank you for riding with {APP_NAME}!
              </Typography>
            </Box>
          </Paper>
        </motion.div>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex', gap: 2, maxWidth: 600, mx: 'auto',
            '@media print': { display: 'none' },
          }}
        >
          <Button
            fullWidth variant="outlined" startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={downloading}
            sx={{ height: 48 }}
          >
            {downloading ? 'Opening...' : 'Download PDF'}
          </Button>
          <Button
            fullWidth variant="outlined" startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ height: 48 }}
          >
            Print
          </Button>
          <Button
            fullWidth variant="outlined" startIcon={<ShareIcon />}
            onClick={handleShare}
            sx={{ height: 48 }}
          >
            Share
          </Button>
        </Box>
      </Box>
    </Box>
  );
}