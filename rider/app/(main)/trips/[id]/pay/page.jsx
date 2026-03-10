// 'use client';
// // PATH: rider/app/(main)/trips/[id]/pay/page.jsx
// //
// // Rider selects HOW to pay for the ride.
// //   • Cash   → calls POST /rides/:id/pay-cash  (backend marks completed + emits payment:received to driver)
// //   • OkraPay → calls walletAPI.payForRide()   (wallet-first, then Lenco widget if needed)
// //
// // On payment success (either path) → router.replace(`/trips/${id}`)

// import { useState, useEffect, useCallback } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import {
//   Box, Typography, Button, Paper, CircularProgress,
//   Alert, Chip, Divider, Snackbar, Fade,
// } from '@mui/material';
// import {
//   Money as CashIcon, CreditCard as CardIcon,
//   CheckCircle as CheckIcon, PhoneAndroid as PhoneIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { apiClient } from '@/lib/api/client';
// import { walletAPI } from '@/lib/api/wallet';
// import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { formatCurrency } from '@/Functions';

// // ── helper: open Lenco widget  ────────────────────────────────────────────────
// function openLencoWidget(checkoutUrl) {
//   if (typeof window === 'undefined') return;
//   if (window.ReactNativeWebView) {
//     window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_LENCO_WIDGET', url: checkoutUrl }));
//   } else {
//     window.open(checkoutUrl, '_blank');
//   }
// }

// export default function PayRidePage() {
//   const { id: rideId } = useParams();
//   const router         = useRouter();

//   const { isOkrapayEnabled, allowRidePaymentWithOkraPay } = useAdminSettings();
//   const okrapayAllowed = isOkrapayEnabled && allowRidePaymentWithOkraPay;

//   const { on: rnOn } = useReactNative();

//   const [ride,      setRide]      = useState(null);
//   const [loading,   setLoading]   = useState(true);
//   const [paying,    setPaying]    = useState(false);
//   const [success,   setSuccess]   = useState(false);
//   const [snackbar,  setSnackbar]  = useState({ open: false, message: '', severity: 'info' });

//   // ── Load ride ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!rideId) return;
//     apiClient.get(`/rides/${rideId}`)
//       .then(res => setRide(res.data ?? res))
//       .catch(err => console.error('[PayPage] load ride error', err))
//       .finally(() => setLoading(false));
//   }, [rideId]);

//   // ── Listen for PAYMENT_SUCCESS from RN bridge (OkraPay gateway webhook) ────
//   useEffect(() => {
//     const unsub = rnOn('PAYMENT_SUCCESS', (payload) => {
//       if (payload?.type && payload.type !== 'ride_payment') return;
//       if (payload?.rideId && String(payload.rideId) !== String(rideId)) return;
//       handlePaymentDone();
//     });
//     return () => unsub?.();
//   }, [rideId, rnOn]);
  
//   useEffect(()=>{
//     console.log('ride',ride)
//   },[ride])
//   // ── Also listen via window.message (browser relay from App.tsx) ─────────────
//   useEffect(() => {
//     const handler = (event) => {
//       try {
//         const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
//         if (!msg?.type) return;
//         if (msg.type === 'PAYMENT_SUCCESS' && (!msg.payload?.type || msg.payload.type === 'ride_payment')) {
//           if (!msg.payload?.rideId || String(msg.payload.rideId) === String(rideId)) handlePaymentDone();
//         }
//         if (msg.type === 'PAYMENT_RECEIVED') {
//           if (!msg.payload?.rideId || String(msg.payload.rideId) === String(rideId)) handlePaymentDone();
//         }
//       } catch {}
//     };
//     window.addEventListener('message', handler);
//     return () => window.removeEventListener('message', handler);
//   }, [rideId]);

//   const handlePaymentDone = useCallback(() => {
//     setSuccess(true);
//     setTimeout(() => router.replace(`/trip-summary?rideId=${rideId}`), 2000);
//   }, [rideId, router]);

//   // ═══════════════════════════════════════════════════════════════════════════
//   // CASH PAYMENT
//   // Calls POST /rides/:id/pay-cash
//   // Backend: sets paymentMethod='cash', paymentStatus='completed', rideStatus='completed'
//   //          and emits `payment:received` to the driver.
//   // ═══════════════════════════════════════════════════════════════════════════
//   const handleCashPayment = async () => {
//     setPaying(true);
//     try {
//       await apiClient.post(`/rides/${rideId}/pay-cash`);
//       // Backend will also emit payment:received to driver — nothing more needed here
//       handlePaymentDone();
//     } catch (err) {
//       setSnackbar({ open: true, message: err.message || 'Failed to record cash payment', severity: 'error' });
//     } finally {
//       setPaying(false);
//     }
//   };

//   // ═══════════════════════════════════════════════════════════════════════════
//   // OKRAPAY PAYMENT
//   // Uses walletAPI.payForRide() which hits POST /okrapay/initiate
//   // → wallet-first logic on backend → if sufficient deducts wallet, else
//   //   returns Lenco checkout URL which we open in the widget.
//   // ═══════════════════════════════════════════════════════════════════════════
//   const handleOkraPayPayment = async () => {
//     if (!ride) return;
//     setPaying(true);
//     try {
//       const result = await walletAPI.payForRide(rideId, ride.totalFare ?? ride.estimatedFare);

//       if (result?.paidFromWallet) {
//         // Wallet had sufficient balance — backend already emitted payment:received
//         handlePaymentDone();
//         return;
//       }

//       if (result?.checkoutUrl || result?.data?.checkoutUrl) {
//         const url = result.checkoutUrl ?? result.data.checkoutUrl;
//         openLencoWidget(url);
//         // Payment success will come back via PAYMENT_SUCCESS window message or RN bridge
//       } else {
//         throw new Error('No checkout URL returned');
//       }
//     } catch (err) {
//       setSnackbar({ open: true, message: err.message || 'OkraPay payment failed. Please try cash.', severity: 'error' });
//     } finally {
//       setPaying(false);
//     }
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
//         <CircularProgress size={48} />
//         <Typography color="text.secondary">Loading payment details…</Typography>
//       </Box>
//     );
//   }

//   const fare = ride?.totalFare ?? ride?.estimatedFare ?? 0;

//   // ── Success overlay ────────────────────────────────────────────────────────
//   if (success) {
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3, bgcolor: 'success.light' }}>
//         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
//           <CheckIcon sx={{ fontSize: 100, color: 'success.dark' }} />
//         </motion.div>
//         <Typography variant="h5" fontWeight={700} color="success.dark">Payment Confirmed!</Typography>
//         <Typography color="text.secondary">Redirecting to your trip summary…</Typography>
//         <CircularProgress size={24} color="success" />
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

//       {/* Header */}
//       <Box sx={{ bgcolor: 'primary.main', color: 'white', pt: 6, pb: 4, px: 3, textAlign: 'center' }}>
//         <Typography variant="h4" fontWeight={800}>{formatCurrency(fare)}</Typography>
//         <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>Amount Due</Typography>
//         {ride?.rideCode && (
//           <Chip label={`Ride #${ride.rideCode}`} size="small"
//             sx={{ mt: 1.5, color: 'white', borderColor: 'rgba(255,255,255,0.6)', border: '1px solid' }} />
//         )}
//       </Box>

//       {/* Payment options */}
//       <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 440, mx: 'auto', width: '100%' }}>

//         <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Choose Payment Method</Typography>

//         {/* ── CASH ───────────────────────────────────────────────────────────── */}
//         <Paper
//           component={motion.div} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
//           elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: 'divider' }}
//         >
//           <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
//             <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//               <CashIcon sx={{ color: 'success.dark', fontSize: 28 }} />
//             </Box>
//             <Box sx={{ flex: 1 }}>
//               <Typography fontWeight={700}>Cash</Typography>
//               <Typography variant="body2" color="text.secondary">Pay the driver directly with cash</Typography>
//             </Box>
//           </Box>
//           <Divider />
//           <Box sx={{ p: 2 }}>
//             <Button fullWidth variant="contained" color="success" size="large"
//               onClick={handleCashPayment} disabled={paying}
//               sx={{ height: 52, fontWeight: 700, borderRadius: 2 }}>
//               {paying ? <CircularProgress size={22} color="inherit" /> : `Pay ${formatCurrency(fare)} Cash`}
//             </Button>
//           </Box>
//         </Paper>

//         {/* ── OKRAPAY ────────────────────────────────────────────────────────── */}
//         <AnimatePresence>
//           {okrapayAllowed && (
//             <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
//               <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: 'primary.light' }}>
//                 <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
//                   <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                     <PhoneIcon sx={{ color: 'primary.dark', fontSize: 28 }} />
//                   </Box>
//                   <Box sx={{ flex: 1 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                       <Typography fontWeight={700}>OkraPay</Typography>
//                       <Chip label="MTN / Airtel" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
//                     </Box>
//                     <Typography variant="body2" color="text.secondary">Mobile money — instant deduction</Typography>
//                   </Box>
//                 </Box>
//                 <Divider />
//                 <Box sx={{ p: 2 }}>
//                   <Button fullWidth variant="contained" color="primary" size="large"
//                     onClick={handleOkraPayPayment} disabled={paying}
//                     sx={{ height: 52, fontWeight: 700, borderRadius: 2 }}>
//                     {paying ? <CircularProgress size={22} color="inherit" /> : `Pay ${formatCurrency(fare)} with OkraPay`}
//                   </Button>
//                 </Box>
//               </Paper>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Info when OkraPay is disabled */}
//         {!okrapayAllowed && (
//           <Alert severity="info" sx={{ borderRadius: 2 }}>
//             Online payment is currently unavailable. Please pay the driver with cash.
//           </Alert>
//         )}

//       </Box>

//       {/* Snackbar */}
//       <Snackbar open={snackbar.open} autoHideDuration={4000}
//         onClose={() => setSnackbar(s => ({ ...s, open: false }))}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//         <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// }
'use client';
// PATH: rider/app/(main)/trips/[id]/pay/page.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, CircularProgress,
  Alert, Chip, Divider, Snackbar, Tooltip, IconButton,
} from '@mui/material';
import {
  Money as CashIcon,
  CheckCircle as CheckIcon,
  PhoneAndroid as PhoneIcon,
  ContentCopy as CopyIcon,
  Check as CopiedIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import { walletAPI } from '@/lib/api/wallet';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { formatCurrency } from '@/Functions';

const MOBILE_TYPE_COLORS = {
  mtn:     { bg: '#FFF8E1', text: '#E65100', dot: '#FFB300', label: 'MTN Mobile Money' },
  airtel:  { bg: '#FCE4EC', text: '#880E4F', dot: '#E91E63', label: 'Airtel Money' },
  zamtel:  { bg: '#E8F5E9', text: '#1B5E20', dot: '#43A047', label: 'Zamtel Kwacha' },
  default: { bg: '#EDE7F6', text: '#4527A0', dot: '#7E57C2', label: 'Mobile Money' },
};

function getTypeStyle(type) {
  return MOBILE_TYPE_COLORS[type?.toLowerCase()] || MOBILE_TYPE_COLORS.default;
}

// ── helper: open Lenco widget ─────────────────────────────────────────────────
function openLencoWidget(checkoutUrl) {
  if (typeof window === 'undefined') return;
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_LENCO_WIDGET', url: checkoutUrl }));
  } else {
    window.open(checkoutUrl, '_blank');
  }
}

// ── Single mobile money number card ──────────────────────────────────────────
function MobileMoneyCard({ entry }) {
  const [copied, setCopied] = useState(false);
  const style = getTypeStyle(entry.mobileType);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(entry.mobileNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older WebViews
      const el = document.createElement('textarea');
      el.value = entry.mobileNumber;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 2.5,
          border: '1.5px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Network dot + icon */}
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '11px',
            bgcolor: style.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <PhoneIcon sx={{ color: style.dot, fontSize: 20 }} />
        </Box>

        {/* Number + name */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
            <Box
              sx={{
                width: 7, height: 7, borderRadius: '50%',
                bgcolor: style.dot, flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: style.text, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {style.label}
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.2 }}>
            {entry.mobileNumber}
          </Typography>

          <Typography variant="caption" color="text.secondary" noWrap>
            Registered as: <strong>{entry.name}</strong>
          </Typography>
        </Box>

        {/* Copy button */}
        <Tooltip title={copied ? 'Copied!' : 'Copy number'} placement="top">
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              flexShrink: 0,
              bgcolor: copied ? 'success.light' : 'action.hover',
              color: copied ? 'success.dark' : 'text.secondary',
              transition: 'background-color 0.2s, color 0.2s',
              '&:hover': { bgcolor: copied ? 'success.light' : 'action.selected' },
            }}
          >
            {copied ? <CopiedIcon sx={{ fontSize: 18 }} /> : <CopyIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PayRidePage() {
  const { id: rideId } = useParams();
  const router         = useRouter();

  const { isOkrapayEnabled, allowRidePaymentWithOkraPay } = useAdminSettings();
  const okrapayAllowed = isOkrapayEnabled && allowRidePaymentWithOkraPay;

  const { on: rnOn } = useReactNative();

  const [ride,     setRide]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ── Load ride ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rideId) return;
    apiClient.get(`/rides/${rideId}`)
      .then(res => setRide(res.data ?? res))
      .catch(err => console.error('[PayPage] load ride error', err))
      .finally(() => setLoading(false));
  }, [rideId]);

  // ── RN bridge: PAYMENT_SUCCESS ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = rnOn('PAYMENT_SUCCESS', (payload) => {
      if (payload?.type && payload.type !== 'ride_payment') return;
      if (payload?.rideId && String(payload.rideId) !== String(rideId)) return;
      handlePaymentDone();
    });
    return () => unsub?.();
  }, [rideId, rnOn]);

  // ── Window message relay ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!msg?.type) return;
        if (msg.type === 'PAYMENT_SUCCESS' && (!msg.payload?.type || msg.payload.type === 'ride_payment')) {
          if (!msg.payload?.rideId || String(msg.payload.rideId) === String(rideId)) handlePaymentDone();
        }
        if (msg.type === 'PAYMENT_RECEIVED') {
          if (!msg.payload?.rideId || String(msg.payload.rideId) === String(rideId)) handlePaymentDone();
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [rideId]);

  const handlePaymentDone = useCallback(() => {
    setSuccess(true);
    setTimeout(() => router.replace(`/trip-summary?rideId=${rideId}`), 2000);
  }, [rideId, router]);

  // ── Cash payment ───────────────────────────────────────────────────────────
  const handleCashPayment = async () => {
    setPaying(true);
    try {
      await apiClient.post(`/rides/${rideId}/pay-cash`);
      handlePaymentDone();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to record cash payment', severity: 'error' });
    } finally {
      setPaying(false);
    }
  };

  // ── OkraPay payment ────────────────────────────────────────────────────────
  const handleOkraPayPayment = async () => {
    if (!ride) return;
    setPaying(true);
    try {
      const result = await walletAPI.payForRide(rideId, ride.totalFare ?? ride.estimatedFare);
      if (result?.paidFromWallet) {
        handlePaymentDone();
        return;
      }
      if (result?.checkoutUrl || result?.data?.checkoutUrl) {
        openLencoWidget(result.checkoutUrl ?? result.data.checkoutUrl);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'OkraPay payment failed. Please try cash.', severity: 'error' });
    } finally {
      setPaying(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading payment details…</Typography>
      </Box>
    );
  }

  const fare = ride?.totalFare ?? ride?.estimatedFare ?? 0;
  const driverNumbers = ride?.driver?.driverProfile?.paymentPhoneNumbers ?? [];

  // ── Success overlay ────────────────────────────────────────────────────────
  if (success) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3, bgcolor: 'success.light' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
          <CheckIcon sx={{ fontSize: 100, color: 'success.dark' }} />
        </motion.div>
        <Typography variant="h5" fontWeight={700} color="success.dark">Payment Confirmed!</Typography>
        <Typography color="text.secondary">Redirecting to your trip summary…</Typography>
        <CircularProgress size={24} color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', pt: 6, pb: 4, px: 3, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800}>{formatCurrency(fare)}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>Amount Due</Typography>
        {ride?.rideCode && (
          <Chip
            label={`Ride #${ride.rideCode}`}
            size="small"
            sx={{ mt: 1.5, color: 'white', borderColor: 'rgba(255,255,255,0.6)', border: '1px solid' }}
          />
        )}
      </Box>

      {/* ── Content ── */}
      <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 440, mx: 'auto', width: '100%' }}>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Choose Payment Method</Typography>

        {/* ── CASH ─────────────────────────────────────────────────────────── */}
        <Paper
          component={motion.div} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          elevation={2}
          sx={{ borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: 'divider' }}
        >
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CashIcon sx={{ color: 'success.dark', fontSize: 28 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={700}>Cash</Typography>
              <Typography variant="body2" color="text.secondary">Pay the driver directly with cash</Typography>
            </Box>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth variant="contained" color="success" size="large"
              onClick={handleCashPayment} disabled={paying}
              sx={{ height: 52, fontWeight: 700, borderRadius: 2 }}
            >
              {paying ? <CircularProgress size={22} color="inherit" /> : `Pay ${formatCurrency(fare)} Cash`}
            </Button>
          </Box>
        </Paper>

        {/* ── MOBILE MONEY (driver's numbers) ──────────────────────────────── */}
        <AnimatePresence>
          {driverNumbers.length > 0 && (
            <motion.div
              key="mobile-money-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Paper
                elevation={2}
                sx={{ borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: 'warning.light' }}
              >
                {/* Section header */}
                <Box
                  sx={{
                    px: 2.5, py: 2,
                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                    bgcolor: 'warning.50',
                    borderBottom: '1.5px solid',
                    borderColor: 'warning.light',
                  }}
                >
                  <Box
                    sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: 'warning.light',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PhoneIcon sx={{ color: 'warning.dark', fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={700} sx={{ lineHeight: 1.3 }}>
                      Send via Mobile Money
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      Transfer {formatCurrency(fare)} to one of the driver's numbers below, then tap confirm.
                    </Typography>
                  </Box>
                </Box>

                {/* Number cards */}
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {driverNumbers.map((entry, idx) => (
                    <MobileMoneyCard key={idx} entry={entry} />
                  ))}
                </Box>

                <Divider />

                {/* Confirm button — same cash endpoint, driver already has the money */}
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth variant="contained" color="warning" size="large"
                    onClick={handleCashPayment} disabled={paying}
                    sx={{ height: 52, fontWeight: 700, borderRadius: 2, color: 'white' }}
                  >
                    {paying
                      ? <CircularProgress size={22} color="inherit" />
                      : `I've Sent ${formatCurrency(fare)} — Confirm`
                    }
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                  >
                    Tap after you've completed the mobile money transfer
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── OKRAPAY ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {okrapayAllowed && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: 'primary.light' }}>
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PhoneIcon sx={{ color: 'primary.dark', fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight={700}>OkraPay</Typography>
                      <Chip label="MTN / Airtel" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">Mobile money — instant deduction</Typography>
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth variant="contained" color="primary" size="large"
                    onClick={handleOkraPayPayment} disabled={paying}
                    sx={{ height: 52, fontWeight: 700, borderRadius: 2 }}
                  >
                    {paying ? <CircularProgress size={22} color="inherit" /> : `Pay ${formatCurrency(fare)} with OkraPay`}
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {!okrapayAllowed && driverNumbers.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Online payment is currently unavailable. Please pay the driver with cash.
          </Alert>
        )}

      </Box>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}