// // PATH: apprides/[id]/page.js
// 'use client';
// import { useState, useEffect } from 'react';
// import {
//   Box, Typography, Paper, Grid, Chip, Button, Avatar, Alert,
//   Skeleton, IconButton, Dialog, DialogTitle, DialogContent,
//   DialogActions, TextField, CircularProgress,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon, ContentCopy as CopyIcon, CheckCircle as CheckIcon,
//   Phone as PhoneIcon, Warning as WarningIcon, Cancel as CancelIcon,
// } from '@mui/icons-material';
// import { WhatsApp as WaIcon } from '@mui/icons-material';
// import { useRouter, useParams, useSearchParams } from 'next/navigation';
// import { getRide, cancelRide } from '@/lib/api/partner';
// import { formatCurrency, formatDateTime, getPhoneDigits } from '@/lib/utils/format';
// import { RIDE_STATUS_COLORS, RIDE_STATUS_LABELS } from '@/constants';
// import { usePartner } from '@/lib/hooks/usePartner';

// const TERMINAL_STATUSES = ['completed', 'cancelled', 'no_drivers_available'];

// function TimelineStep({ label, time, done }) {
//   return (
//     <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
//       <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
//         <Box sx={{
//           width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
//           bgcolor: done ? '#10B981' : 'rgba(255,255,255,0.1)',
//           border: done ? 'none' : '2px solid rgba(255,255,255,0.15)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//         }}>
//           {done && <CheckIcon sx={{ fontSize: 10, color: '#fff' }} />}
//         </Box>
//         <Box sx={{ flex: 1, width: 2, bgcolor: done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', mt: 0.5 }} />
//       </Box>
//       <Box sx={{ pb: 2 }}>
//         <Typography sx={{ fontWeight: 600, color: done ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>{label}</Typography>
//         {time && <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', mt: 0.25 }}>{formatDateTime(time)}</Typography>}
//       </Box>
//     </Box>
//   );
// }

// export default function RideDetailPage() {
//   const router = useRouter();
//   const { id } = useParams();
//   const searchParams = useSearchParams();
//   const isDelivery = searchParams.get('isDelivery') === 'true';
//   const { currency } = usePartner();

//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [copied, setCopied] = useState(false);
//   const [cancelOpen, setCancelOpen] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [cancelling, setCancelling] = useState(false);

//   const load = async () => {
//     setLoading(true);
//     try {
//       const res = await getRide(Number(id), isDelivery);
//       setData(res?.data ?? res);
//     } catch (e) {
//       setError(e.message || 'Failed to load ride');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { load(); }, [id, isDelivery]);

//   const handleCancel = async () => {
//     setCancelling(true);
//     try {
//       await cancelRide(Number(id), cancelReason, data?.recordType === 'delivery');
//       setCancelOpen(false);
//       load();
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setCancelling(false);
//     }
//   };

//   if (loading) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2.5, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
//         <Grid container spacing={3}>
//           <Grid item xs={12} md={7}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} /></Grid>
//           <Grid item xs={12} md={5}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} /></Grid>
//         </Grid>
//       </Box>
//     );
//   }

//   if (error || !data) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error || 'Ride not found'}</Alert>
//       </Box>
//     );
//   }

//   const isDeliveryRecord = data.recordType === 'delivery';
//   const labels = isDeliveryRecord
//     ? { rider: 'Sender', driver: 'Deliverer', pickup: 'Collection Point', dropoff: 'Delivery Address', fare: 'Delivery Fee' }
//     : { rider: 'Rider', driver: 'Driver', pickup: 'Pickup', dropoff: 'Dropoff', fare: 'Fare' };

//   const driver = data.driver || data.deliverer;
//   const rider = data.rider || data.sender;
//   const driverDigits = getPhoneDigits(driver?.phoneNumber ?? '');
//   const riderDigits = getPhoneDigits(rider?.phoneNumber ?? '');

//   const statusColor = RIDE_STATUS_COLORS[data.rideStatus] ?? '#6B7280';
//   const isTerminal = TERMINAL_STATUSES.includes(data.rideStatus);
//   const isCancelled = data.rideStatus === 'cancelled';

//   return (
//     <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
//       {/* Header */}
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
//         <IconButton onClick={() => router.back()} sx={{ color: 'rgba(255,255,255,0.5)' }}><BackIcon /></IconButton>
//         <Box sx={{ flex: 1 }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
//             <Typography
//               sx={{
//                 fontFamily: "'JetBrains Mono', monospace", fontSize: '1.3rem', fontWeight: 800,
//                 color: '#F59E0B', letterSpacing: 2, cursor: 'pointer',
//               }}
//               onClick={() => { navigator.clipboard.writeText(data.rideCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
//             >
//               {data.rideCode}
//             </Typography>
//             {copied && <CheckIcon sx={{ color: '#10B981', fontSize: 18 }} />}
//             <Chip label={isDeliveryRecord ? '📦 Delivery' : '🚗 Ride'} size="small" sx={{ fontWeight: 700 }} />
//             <Chip
//               label={RIDE_STATUS_LABELS[data.rideStatus] ?? data.rideStatus}
//               size="small"
//               sx={{ fontWeight: 700, bgcolor: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` }}
//             />
//           </Box>
//         </Box>
//       </Box>

//       <Grid container spacing={3}>
//         {/* Left: Timeline + Route */}
//         <Grid item xs={12} md={7}>
//           <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
//             <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2.5, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
//               Trip Timeline
//             </Typography>
//             <TimelineStep label="Requested" time={data.requestedAt} done={!!data.requestedAt} />
//             <TimelineStep label={isDeliveryRecord ? 'Delivery Accepted' : 'Driver Accepted'} time={data.acceptedAt} done={!!data.acceptedAt} />
//             <TimelineStep label="Driver Arrived" time={data.arrivedAt} done={!!data.arrivedAt} />
//             <TimelineStep label={isDeliveryRecord ? 'Package Collected' : 'Trip Started'} time={data.tripStartedAt} done={!!data.tripStartedAt} />
//             {isCancelled ? (
//               <TimelineStep label="Cancelled" time={data.cancelledAt} done={true} />
//             ) : (
//               <TimelineStep label={isDeliveryRecord ? 'Delivered' : 'Trip Completed'} time={data.tripCompletedAt} done={!!data.tripCompletedAt} />
//             )}
//           </Paper>

//           {/* Route */}
//           <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
//             <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
//               <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                 <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
//                 <Box sx={{ width: 2, flex: 1, bgcolor: 'rgba(255,255,255,0.1)', my: 0.5 }} />
//                 <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EF4444', flexShrink: 0 }} />
//               </Box>
//               <Box sx={{ flex: 1 }}>
//                 <Box sx={{ mb: 2 }}>
//                   <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>{labels.pickup}</Typography>
//                   <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{data.pickupLocation?.address ?? '—'}</Typography>
//                 </Box>
//                 <Box>
//                   <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>{labels.dropoff}</Typography>
//                   <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{data.dropoffLocation?.address ?? '—'}</Typography>
//                 </Box>
//               </Box>
//             </Box>

//             {isCancelled && (
//               <Alert severity="warning" sx={{ borderRadius: 2, mt: 2 }}>
//                 <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Cancelled by {data.cancelledBy}</Typography>
//                 <Typography sx={{ fontSize: '0.8rem' }}>{data.cancellationReason}</Typography>
//                 {data.cancellationFee > 0 && <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Fee: {currency}{data.cancellationFee}</Typography>}
//               </Alert>
//             )}
//           </Paper>

//           {/* Driver card */}
//           {driver && (
//             <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
//               <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
//                 {labels.driver}
//               </Typography>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
//                 <Avatar sx={{ width: 40, height: 40, bgcolor: '#059669', fontWeight: 700 }}>{driver.firstName?.[0]}</Avatar>
//                 <Box sx={{ flex: 1 }}>
//                   <Typography sx={{ fontWeight: 700, color: '#fff' }}>{driver.firstName} {driver.lastName}</Typography>
//                   <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
//                     {driver.phoneNumber} · ⭐ {driver.driverProfile?.averageRating?.toFixed(1) ?? '—'}
//                   </Typography>
//                 </Box>
//               </Box>
//               {data.vehicle && (
//                 <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", color: '#F59E0B', fontWeight: 700, letterSpacing: 2, mb: 1.5 }}>
//                   {data.vehicle.numberPlate}
//                 </Typography>
//               )}
//               <Box sx={{ display: 'flex', gap: 1 }}>
//                 <Button href={`tel:${driverDigits}`} component="a" size="small" variant="outlined" startIcon={<PhoneIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>Call</Button>
//                 <Button href={`https://wa.me/${driverDigits}`} target="_blank" component="a" size="small" variant="outlined" startIcon={<WaIcon />} sx={{ borderRadius: 2, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>WhatsApp</Button>
//               </Box>
//             </Paper>
//           )}

//           {/* Rider card */}
//           {rider && (
//             <Paper sx={{ p: 2.5, borderRadius: 3 }}>
//               <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
//                 {labels.rider}
//               </Typography>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                 <Avatar sx={{ width: 36, height: 36, bgcolor: '#3B82F6', fontWeight: 700, fontSize: '0.85rem' }}>{rider.firstName?.[0]}</Avatar>
//                 <Box sx={{ flex: 1 }}>
//                   <Typography sx={{ fontWeight: 700, color: '#fff' }}>{rider.firstName} {rider.lastName}</Typography>
//                   <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{rider.phoneNumber}</Typography>
//                 </Box>
//                 <Button href={`tel:${riderDigits}`} component="a" size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>📞</Button>
//               </Box>
//             </Paper>
//           )}
//         </Grid>

//         {/* Right: Fare breakdown */}
//         <Grid item xs={12} md={5}>
//           <Paper sx={{ p: 3, borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, rgba(5,150,105,0.08) 0%, rgba(4,120,87,0.04) 100%)', border: '1px solid rgba(5,150,105,0.15)' }}>
//             <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
//               {labels.fare} Breakdown
//             </Typography>
//             {[
//               { label: 'Base Fare', value: data.baseFare },
//               { label: 'Distance Fare', value: data.distanceFare },
//               { label: 'Time Fare', value: data.timeFare },
//               data.surgeFare > 0 && { label: 'Surge', value: data.surgeFare },
//               data.promoDiscount > 0 && { label: 'Promo Discount', value: -data.promoDiscount },
//             ].filter(Boolean).map(({ label, value }) => (
//               <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
//                 <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{label}</Typography>
//                 <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: value < 0 ? '#EF4444' : 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
//                   {value < 0 ? `-${currency}${Math.abs(value).toFixed(2)}` : `${currency}${Number(value ?? 0).toFixed(2)}`}
//                 </Typography>
//               </Box>
//             ))}

//             <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, mt: 1 }}>
//               <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Total</Typography>
//               <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#10B981', fontSize: '1.3rem' }}>
//                 {currency}{Number(data.totalFare ?? 0).toFixed(2)}
//               </Typography>
//             </Box>

//             <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                 <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Commission</Typography>
//                 <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>
//                   {currency}{Number(data.commission ?? 0).toFixed(2)}
//                 </Typography>
//               </Box>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Driver Earnings</Typography>
//                 <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
//                   {currency}{Number(data.driverEarnings ?? 0).toFixed(2)}
//                 </Typography>
//               </Box>
//             </Box>
//           </Paper>

//           {/* Meta info */}
//           <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
//             <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
//               {data.rideClass && <Chip label={data.rideClass.name} size="small" sx={{ fontWeight: 700 }} />}
//               {data.taxiType && <Chip label={data.taxiType.name} size="small" variant="outlined" sx={{ fontWeight: 700 }} />}
//               <Chip
//                 label={data.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}
//                 size="small"
//                 color={data.paymentMethod === 'cash' ? 'default' : 'success'}
//                 sx={{ fontWeight: 700 }}
//               />
//             </Box>
//             {data.estimatedDistance && (
//               <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
//                 Distance: {data.actualDistance ?? data.estimatedDistance} km
//               </Typography>
//             )}
//             {data.actualDuration && (
//               <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
//                 Duration: {data.actualDuration} min
//               </Typography>
//             )}
//           </Paper>

//           {/* Cancel action */}
//           <Button
//             fullWidth
//             variant="outlined"
//             color="error"
//             disabled={isTerminal}
//             onClick={() => setCancelOpen(true)}
//             sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }}
//           >
//             {isTerminal ? `Ride ${data.rideStatus}` : `Cancel This ${isDeliveryRecord ? 'Delivery' : 'Ride'}`}
//           </Button>
//         </Grid>
//       </Grid>

//       {/* Cancel dialog */}
//       <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
//         <DialogTitle sx={{ fontWeight: 700 }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//             <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <WarningIcon sx={{ color: '#fff', fontSize: 22 }} />
//             </Box>
//             Cancel This {isDeliveryRecord ? 'Delivery' : 'Ride'}?
//           </Box>
//         </DialogTitle>
//         <DialogContent>
//           <TextField fullWidth multiline rows={2} label="Reason for cancellation" value={cancelReason}
//             onChange={(e) => setCancelReason(e.target.value)} sx={{ mt: 1 }} />
//         </DialogContent>
//         <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
//           <Button onClick={() => setCancelOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Go Back</Button>
//           <Button onClick={handleCancel} disabled={!cancelReason.trim() || cancelling} variant="contained" color="error"
//             startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
//             sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
//             {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }
// PATH: app/partner/rides/[id]/page.js
'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Avatar, Alert,
  Skeleton, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon, CheckCircle as CheckIcon,
  Phone as PhoneIcon, Warning as WarningIcon, Cancel as CancelIcon,
} from '@mui/icons-material';
import { WhatsApp as WaIcon } from '@mui/icons-material';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getRide, cancelRide } from '@/lib/api/partner';
import { formatDateTime, getPhoneDigits } from '@/lib/utils/format';
import { RIDE_STATUS_COLORS, RIDE_STATUS_LABELS } from '@/constants';
import { usePartner } from '@/lib/hooks/usePartner';

const TERMINAL_STATUSES = ['completed', 'cancelled', 'no_drivers_available'];

function TimelineStep({ label, time, done }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
        <Box sx={{
          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
          bgcolor: done ? '#10B981' : 'rgba(255,255,255,0.1)',
          border: done ? 'none' : '2px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done && <CheckIcon sx={{ fontSize: 10, color: '#fff' }} />}
        </Box>
        <Box sx={{ flex: 1, width: 2, bgcolor: done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', mt: 0.5 }} />
      </Box>
      <Box sx={{ pb: 2 }}>
        <Typography sx={{ fontWeight: 600, color: done ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>{label}</Typography>
        {time && <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', mt: 0.25 }}>{formatDateTime(time)}</Typography>}
      </Box>
    </Box>
  );
}

export default function RideDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isDelivery = searchParams.get('isDelivery') === 'true';
  const { currency } = usePartner();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getRide(Number(id), isDelivery);
      setData(res?.data ?? res);
    } catch (e) {
      setError(e.message || 'Failed to load ride');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, isDelivery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelRide(Number(id), cancelReason, data?.recordType === 'delivery');
      setCancelOpen(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2.5, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
        {/* Two-column skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, '& > *': { minWidth: 0 } }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error || 'Ride not found'}</Alert>
      </Box>
    );
  }

  const isDeliveryRecord = data.recordType === 'delivery';
  const labels = isDeliveryRecord
    ? { rider: 'Sender', driver: 'Deliverer', pickup: 'Collection Point', dropoff: 'Delivery Address', fare: 'Delivery Fee' }
    : { rider: 'Rider', driver: 'Driver', pickup: 'Pickup', dropoff: 'Dropoff', fare: 'Fare' };

  const driver = data.driver || data.deliverer;
  const rider = data.rider || data.sender;
  const driverDigits = getPhoneDigits(driver?.phoneNumber ?? '');
  const riderDigits = getPhoneDigits(rider?.phoneNumber ?? '');

  const statusColor = RIDE_STATUS_COLORS[data.rideStatus] ?? '#6B7280';
  const isTerminal = TERMINAL_STATUSES.includes(data.rideStatus);
  const isCancelled = data.rideStatus === 'cancelled';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => router.back()} sx={{ color: 'rgba(255,255,255,0.5)' }}><BackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography
              sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.3rem', fontWeight: 800, color: '#F59E0B', letterSpacing: 2, cursor: 'pointer' }}
              onClick={() => { navigator.clipboard.writeText(data.rideCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            >
              {data.rideCode}
            </Typography>
            {copied && <CheckIcon sx={{ color: '#10B981', fontSize: 18 }} />}
            <Chip label={isDeliveryRecord ? '📦 Delivery' : '🚗 Ride'} size="small" sx={{ fontWeight: 700 }} />
            <Chip
              label={RIDE_STATUS_LABELS[data.rideStatus] ?? data.rideStatus}
              size="small"
              sx={{ fontWeight: 700, bgcolor: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` }}
            />
          </Box>
        </Box>
      </Box>

      {/* Main two-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, alignItems: 'start', '& > *': { minWidth: 0 } }}>

        {/* Left column */}
        <Box>
          {/* Timeline */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2.5, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Trip Timeline
            </Typography>
            <TimelineStep label="Requested" time={data.requestedAt} done={!!data.requestedAt} />
            <TimelineStep label={isDeliveryRecord ? 'Delivery Accepted' : 'Driver Accepted'} time={data.acceptedAt} done={!!data.acceptedAt} />
            <TimelineStep label="Driver Arrived" time={data.arrivedAt} done={!!data.arrivedAt} />
            <TimelineStep label={isDeliveryRecord ? 'Package Collected' : 'Trip Started'} time={data.tripStartedAt} done={!!data.tripStartedAt} />
            {isCancelled
              ? <TimelineStep label="Cancelled" time={data.cancelledAt} done />
              : <TimelineStep label={isDeliveryRecord ? 'Delivered' : 'Trip Completed'} time={data.tripCompletedAt} done={!!data.tripCompletedAt} />
            }
          </Paper>

          {/* Route */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                <Box sx={{ width: 2, flex: 1, bgcolor: 'rgba(255,255,255,0.1)', my: 0.5 }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EF4444', flexShrink: 0 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>{labels.pickup}</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{data.pickupLocation?.address ?? '—'}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>{labels.dropoff}</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{data.dropoffLocation?.address ?? '—'}</Typography>
                </Box>
              </Box>
            </Box>
            {isCancelled && (
              <Alert severity="warning" sx={{ borderRadius: 2, mt: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Cancelled by {data.cancelledBy}</Typography>
                <Typography sx={{ fontSize: '0.8rem' }}>{data.cancellationReason}</Typography>
                {data.cancellationFee > 0 && <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Fee: {currency}{data.cancellationFee}</Typography>}
              </Alert>
            )}
          </Paper>

          {/* Driver card */}
          {driver && (
            <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
                {labels.driver}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: '#059669', fontWeight: 700 }}>{driver.firstName?.[0]}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#fff' }}>{driver.firstName} {driver.lastName}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    {driver.phoneNumber} · ⭐ {driver.driverProfile?.averageRating?.toFixed(1) ?? '—'}
                  </Typography>
                </Box>
              </Box>
              {data.vehicle && (
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", color: '#F59E0B', fontWeight: 700, letterSpacing: 2, mb: 1.5 }}>
                  {data.vehicle.numberPlate}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button href={`tel:${driverDigits}`} component="a" size="small" variant="outlined" startIcon={<PhoneIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>Call</Button>
                <Button href={`https://wa.me/${driverDigits}`} target="_blank" component="a" size="small" variant="outlined" startIcon={<WaIcon />} sx={{ borderRadius: 2, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>WhatsApp</Button>
              </Box>
            </Paper>
          )}

          {/* Rider card */}
          {rider && (
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
                {labels.rider}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#3B82F6', fontWeight: 700, fontSize: '0.85rem' }}>{rider.firstName?.[0]}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#fff' }}>{rider.firstName} {rider.lastName}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{rider.phoneNumber}</Typography>
                </Box>
                <Button href={`tel:${riderDigits}`} component="a" size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>📞</Button>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Right column */}
        <Box>
          {/* Fare breakdown */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, rgba(5,150,105,0.08) 0%, rgba(4,120,87,0.04) 100%)', border: '1px solid rgba(5,150,105,0.15)' }}>
            <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {labels.fare} Breakdown
            </Typography>
            {[
              { label: 'Base Fare', value: data.baseFare },
              { label: 'Distance Fare', value: data.distanceFare },
              { label: 'Time Fare', value: data.timeFare },
              data.surgeFare > 0 && { label: 'Surge', value: data.surgeFare },
              data.promoDiscount > 0 && { label: 'Promo Discount', value: -data.promoDiscount },
            ].filter(Boolean).map(({ label, value }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{label}</Typography>
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: value < 0 ? '#EF4444' : 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  {value < 0 ? `-${currency}${Math.abs(value).toFixed(2)}` : `${currency}${Number(value ?? 0).toFixed(2)}`}
                </Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, mt: 1 }}>
              <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Total</Typography>
              <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#10B981', fontSize: '1.3rem' }}>
                {currency}{Number(data.totalFare ?? 0).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Commission</Typography>
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>
                  {currency}{Number(data.commission ?? 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Driver Earnings</Typography>
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                  {currency}{Number(data.driverEarnings ?? 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Meta info */}
          <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {data.rideClass && <Chip label={data.rideClass.name} size="small" sx={{ fontWeight: 700 }} />}
              {data.taxiType && <Chip label={data.taxiType.name} size="small" variant="outlined" sx={{ fontWeight: 700 }} />}
              <Chip
                label={data.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}
                size="small"
                color={data.paymentMethod === 'cash' ? 'default' : 'success'}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            {data.estimatedDistance && (
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
                Distance: {data.actualDistance ?? data.estimatedDistance} km
              </Typography>
            )}
            {data.actualDuration && (
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                Duration: {data.actualDuration} min
              </Typography>
            )}
          </Paper>

          {/* Cancel */}
          <Button fullWidth variant="outlined" color="error" disabled={isTerminal}
            onClick={() => setCancelOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }}>
            {isTerminal ? `Ride ${data.rideStatus}` : `Cancel This ${isDeliveryRecord ? 'Delivery' : 'Ride'}`}
          </Button>
        </Box>
      </Box>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WarningIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            Cancel This {isDeliveryRecord ? 'Delivery' : 'Ride'}?
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={2} label="Reason for cancellation" value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCancelOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Go Back</Button>
          <Button onClick={handleCancel} disabled={!cancelReason.trim() || cancelling} variant="contained" color="error"
            startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
            {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}