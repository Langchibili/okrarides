// 'use client';
// // PATH: rider/app/(main)/trips/[id]/pay/page.jsx

// import { useState, useEffect, useCallback } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import {
//   Box, Typography, Paper, Button, CircularProgress,
//   IconButton, Divider, Alert,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon,
//   Money as CashIcon,
//   CreditCard as CardIcon,
//   CheckCircle as CheckIcon,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { walletAPI } from '@/lib/api/wallet';
// import { apiClient } from '@/lib/api/client';
// import { formatCurrency } from '@/Functions';
// import { APP_NAME } from '@/Constants';

// // ─── helper: open Lenco widget ────────────────────────────────────────────────
// function openLencoWidget({ gatewayConfig, onSuccess, onClose }) {
//   if (typeof window !== 'undefined' && window.LencoPay) {
//     window.LencoPay.getPaid({
//       ...gatewayConfig,
//       onSuccess,
//       onClose,
//     });
//   } else {
//     // Lenco SDK not yet loaded — inject it then retry
//     const script = document.createElement('script');
//     script.src = 'https://checkout.lenco.co/v2/lenco.pay.js';
//     script.onload = () => {
//       window.LencoPay?.getPaid({ ...gatewayConfig, onSuccess, onClose });
//     };
//     document.head.appendChild(script);
//   }
// }
// // ─────────────────────────────────────────────────────────────────────────────

// export default function TripPayPage() {
//   const params = useParams();
//   const router  = useRouter();
//   const rideId  = params.id;

//   const { isOkrapayEnabled, allowRidePaymentWithOkraPay } = useAdminSettings();
//   const { on: rnOn }                                       = useReactNative();

//   const [ride, setRide]               = useState(null);
//   const [loading, setLoading]         = useState(true);
//   const [paying, setPaying]           = useState(false);
//   const [selected, setSelected]       = useState(null);  // 'cash' | 'okrapay'
//   const [paymentDone, setPaymentDone] = useState(false);
//   const [error, setError]             = useState(null);

//   // OkraPay is available for ride payment only when both global + ride flags are on
//   const okrapayAvailable = isOkrapayEnabled && allowRidePaymentWithOkraPay;

//   // ── Load ride ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await apiClient.get(`/rides/${rideId}?populate=*`);
//         setRide(res?.data ?? res);
//       } catch (e) {
//         setError('Could not load ride details.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (rideId) load();
//   }, [rideId]);

//   // ── Listen for PAYMENT_SUCCESS from device socket relay ───────────────────
//   // When the OkraPay gateway webhook fires on the backend, it emits payment:success
//   // → device socket → webview relay → PAYMENT_SUCCESS. Navigate to summary.
//   const handlePaymentSuccessEvent = useCallback((payload) => {
//     if (payload?.rideId && String(payload.rideId) !== String(rideId)) return;
//     setPaymentDone(true);
//     setTimeout(() => router.replace(`/trip-summary?rideId=${rideId}`), 1200);
//   }, [rideId, router]);

//   useEffect(() => {
//     const unsub = rnOn?.('PAYMENT_SUCCESS', handlePaymentSuccessEvent);
//     return () => unsub?.();
//   }, [rnOn, handlePaymentSuccessEvent]);

//   // Also listen on the browser-socket path (PWA / non-native)
//   useEffect(() => {
//     const handler = (event) => {
//       try {
//         const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
//         if (msg?.type === 'PAYMENT_SUCCESS') handlePaymentSuccessEvent(msg.payload ?? {});
//       } catch {}
//     };
//     window.addEventListener('message', handler);
//     return () => window.removeEventListener('message', handler);
//   }, [handlePaymentSuccessEvent]);

//   // ── Pay with Cash ──────────────────────────────────────────────────────────
//   const handleCashPayment = async () => {
//     setPaying(true);
//     setError(null);
//     try {
//       // Mark the ride as cash-paid on the backend
//       await apiClient.post(`/rides/${rideId}/confirm-cash-payment`, {});
//       router.replace(`/trip-summary?rideId=${rideId}`);
//     } catch (e) {
//       // Even if the endpoint doesn't exist yet, just navigate to summary
//       router.replace(`/trip-summary?rideId=${rideId}`);
//     } finally {
//       setPaying(false);
//     }
//   };

//   // ── Pay with OkraPay ───────────────────────────────────────────────────────
//   const handleOkraPayPayment = async () => {
//     if (!ride) return;
//     setPaying(true);
//     setError(null);
//     try {
//       const result = await walletAPI.payForRide(rideId, ride.totalFare);

//       if (result.paidFromWallet) {
//         // Wallet had enough balance — already deducted
//         setPaymentDone(true);
//         setTimeout(() => router.replace(`/trip-summary?rideId=${rideId}`), 1200);
//         return;
//       }

//       if (result.data?.paymentUrl) {
//         window.location.href = result.data.paymentUrl;
//         return;
//       }

//       if (result.data?.gatewayConfig) {
//         openLencoWidget({
//           gatewayConfig: result.data.gatewayConfig,
//           onSuccess: () => {
//             setPaymentDone(true);
//             setTimeout(() => router.replace(`/trip-summary?rideId=${rideId}`), 1200);
//           },
//           onClose: () => setPaying(false),
//         });
//         return;
//       }

//       throw new Error(result.error || 'Payment initiation failed');
//     } catch (e) {
//       setError(e.message || 'Payment failed. Please try again.');
//     } finally {
//       setPaying(false);
//     }
//   };

//   const handleConfirm = () => {
//     if (selected === 'cash')    handleCashPayment();
//     if (selected === 'okrapay') handleOkraPayPayment();
//   };

//   // ── Render ─────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (paymentDone) {
//     return (
//       <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
//         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
//           <CheckIcon sx={{ fontSize: 96, color: 'success.main' }} />
//         </motion.div>
//         <Typography variant="h5" sx={{ fontWeight: 700, mt: 2 }}>Payment Done!</Typography>
//         <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Redirecting to your trip summary…</Typography>
//       </Box>
//     );
//   }

//   const fare = ride?.totalFare ?? 0;

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
//       {/* Header */}
//       <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
//         <IconButton onClick={() => router.back()} edge="start"><BackIcon /></IconButton>
//         <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>Pay for Trip</Typography>
//       </Box>

//       <Box sx={{ p: 2, maxWidth: 480, mx: 'auto' }}>
//         {/* Amount */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//           <Paper sx={{ p: 3, mb: 3, textAlign: 'center', borderRadius: 3 }}>
//             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
//               Amount Due
//             </Typography>
//             <Typography variant="h3" sx={{ fontWeight: 800, my: 1, color: 'text.primary' }}>
//               {formatCurrency(fare)}
//             </Typography>
//             {ride?.rideCode && (
//               <Typography variant="caption" color="text.secondary">
//                 Ride #{ride.rideCode}
//               </Typography>
//             )}
//           </Paper>
//         </motion.div>

//         {/* Payment Method Selection */}
//         <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
//           Choose Payment Method
//         </Typography>

//         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>

//           {/* ── Cash ────────────────────────────────────────────────────────── */}
//           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
//             whileTap={{ scale: 0.98 }}>
//             <Paper
//               onClick={() => setSelected('cash')}
//               sx={{
//                 display: 'flex', alignItems: 'center', gap: 2, p: 2.5,
//                 cursor: 'pointer', borderRadius: 3, border: 2,
//                 borderColor: selected === 'cash' ? 'success.main' : 'divider',
//                 transition: 'all 0.2s',
//                 bgcolor: selected === 'cash' ? 'success.50' : 'background.paper',
//               }}
//             >
//               <Box sx={{
//                 width: 48, height: 48, borderRadius: 2,
//                 bgcolor: selected === 'cash' ? 'success.main' : 'success.light',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}>
//                 <CashIcon sx={{ color: selected === 'cash' ? 'white' : 'success.dark', fontSize: 24 }} />
//               </Box>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="body1" sx={{ fontWeight: 700 }}>Cash</Typography>
//                 <Typography variant="caption" color="text.secondary">Pay the driver directly</Typography>
//               </Box>
//               <Box sx={{
//                 width: 22, height: 22, borderRadius: '50%', border: 2,
//                 borderColor: selected === 'cash' ? 'success.main' : 'divider',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}>
//                 {selected === 'cash' && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />}
//               </Box>
//             </Paper>
//           </motion.div>

//           {/* ── OkraPay (MTN/Airtel) — only if allowed ─────────────────────── */}
//           {okrapayAvailable && (
//             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
//               whileTap={{ scale: 0.98 }}>
//               <Paper
//                 onClick={() => setSelected('okrapay')}
//                 sx={{
//                   display: 'flex', alignItems: 'center', gap: 2, p: 2.5,
//                   cursor: 'pointer', borderRadius: 3, border: 2,
//                   borderColor: selected === 'okrapay' ? 'primary.main' : 'divider',
//                   transition: 'all 0.2s',
//                   bgcolor: selected === 'okrapay' ? 'primary.50' : 'background.paper',
//                 }}
//               >
//                 {/* OkraPay compact icon badge */}
//                 <Box sx={{
//                   width: 48, height: 48, borderRadius: 2,
//                   bgcolor: selected === 'okrapay' ? 'primary.main' : 'primary.light',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   position: 'relative',
//                 }}>
//                   <CardIcon sx={{ color: selected === 'okrapay' ? 'white' : 'primary.dark', fontSize: 24 }} />
//                 </Box>

//                 <Box sx={{ flex: 1, minWidth: 0 }}>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
//                     <Typography variant="body1" sx={{ fontWeight: 700 }}>OkraPay</Typography>
//                     {/* Compact provider badge */}
//                     <Box sx={{
//                       display: 'inline-flex', alignItems: 'center', gap: 0.5,
//                       px: 1, py: 0.25, borderRadius: 1,
//                       bgcolor: selected === 'okrapay' ? 'primary.100' : 'action.hover',
//                       border: 1, borderColor: selected === 'okrapay' ? 'primary.200' : 'divider',
//                     }}>
//                       <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', color: 'text.secondary' }}>
//                         MTN / Airtel
//                       </Typography>
//                     </Box>
//                   </Box>
//                   <Typography variant="caption" color="text.secondary">Mobile money — fast &amp; secure</Typography>
//                 </Box>

//                 <Box sx={{
//                   width: 22, height: 22, borderRadius: '50%', border: 2,
//                   borderColor: selected === 'okrapay' ? 'primary.main' : 'divider',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 }}>
//                   {selected === 'okrapay' && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />}
//                 </Box>
//               </Paper>
//             </motion.div>
//           )}
//         </Box>

//         {/* Only-cash notice */}
//         {!okrapayAvailable && (
//           <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
//             Online payment is currently unavailable. Please pay the driver with cash.
//           </Alert>
//         )}

//         {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

//         {/* Confirm Button */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
//           whileTap={{ scale: 0.98 }}>
//           <Button
//             fullWidth variant="contained" size="large"
//             onClick={handleConfirm}
//             disabled={!selected || paying}
//             sx={{ height: 56, fontWeight: 700, fontSize: '1rem', borderRadius: 3 }}
//           >
//             {paying ? <CircularProgress size={24} color="inherit" /> :
//               selected === 'cash'    ? `Confirm Cash Payment` :
//               selected === 'okrapay' ? `Pay ${formatCurrency(fare)} via OkraPay` :
//               'Select a payment method'}
//           </Button>
//         </motion.div>

//         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
//           Powered by {APP_NAME} • Secure &amp; Encrypted
//         </Typography>
//       </Box>
//     </Box>
//   );
// }
'use client';
// PATH: rider/app/(main)/trips/[id]/pay/page.jsx
//
// Rider selects HOW to pay for the ride.
//   • Cash   → calls POST /rides/:id/pay-cash  (backend marks completed + emits payment:received to driver)
//   • OkraPay → calls walletAPI.payForRide()   (wallet-first, then Lenco widget if needed)
//
// On payment success (either path) → router.replace(`/trips/${id}`)

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Paper, CircularProgress,
  Alert, Chip, Divider, Snackbar, Fade,
} from '@mui/material';
import {
  Money as CashIcon, CreditCard as CardIcon,
  CheckCircle as CheckIcon, PhoneAndroid as PhoneIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import { walletAPI } from '@/lib/api/wallet';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { formatCurrency } from '@/Functions';

// ── helper: open Lenco widget  ────────────────────────────────────────────────
function openLencoWidget(checkoutUrl) {
  if (typeof window === 'undefined') return;
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_LENCO_WIDGET', url: checkoutUrl }));
  } else {
    window.open(checkoutUrl, '_blank');
  }
}

export default function PayRidePage() {
  const { id: rideId } = useParams();
  const router         = useRouter();

  const { isOkrapayEnabled, allowRidePaymentWithOkraPay } = useAdminSettings();
  const okrapayAllowed = isOkrapayEnabled && allowRidePaymentWithOkraPay;

  const { on: rnOn } = useReactNative();

  const [ride,      setRide]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [snackbar,  setSnackbar]  = useState({ open: false, message: '', severity: 'info' });

  // ── Load ride ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rideId) return;
    apiClient.get(`/rides/${rideId}`)
      .then(res => setRide(res.data ?? res))
      .catch(err => console.error('[PayPage] load ride error', err))
      .finally(() => setLoading(false));
  }, [rideId]);

  // ── Listen for PAYMENT_SUCCESS from RN bridge (OkraPay gateway webhook) ────
  useEffect(() => {
    const unsub = rnOn('PAYMENT_SUCCESS', (payload) => {
      if (payload?.type && payload.type !== 'ride_payment') return;
      if (payload?.rideId && String(payload.rideId) !== String(rideId)) return;
      handlePaymentDone();
    });
    return () => unsub?.();
  }, [rideId, rnOn]);

  // ── Also listen via window.message (browser relay from App.tsx) ─────────────
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

  // ═══════════════════════════════════════════════════════════════════════════
  // CASH PAYMENT
  // Calls POST /rides/:id/pay-cash
  // Backend: sets paymentMethod='cash', paymentStatus='completed', rideStatus='completed'
  //          and emits `payment:received` to the driver.
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCashPayment = async () => {
    setPaying(true);
    try {
      await apiClient.post(`/rides/${rideId}/pay-cash`);
      // Backend will also emit payment:received to driver — nothing more needed here
      handlePaymentDone();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to record cash payment', severity: 'error' });
    } finally {
      setPaying(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // OKRAPAY PAYMENT
  // Uses walletAPI.payForRide() which hits POST /okrapay/initiate
  // → wallet-first logic on backend → if sufficient deducts wallet, else
  //   returns Lenco checkout URL which we open in the widget.
  // ═══════════════════════════════════════════════════════════════════════════
  const handleOkraPayPayment = async () => {
    if (!ride) return;
    setPaying(true);
    try {
      const result = await walletAPI.payForRide(rideId, ride.totalFare ?? ride.estimatedFare);

      if (result?.paidFromWallet) {
        // Wallet had sufficient balance — backend already emitted payment:received
        handlePaymentDone();
        return;
      }

      if (result?.checkoutUrl || result?.data?.checkoutUrl) {
        const url = result.checkoutUrl ?? result.data.checkoutUrl;
        openLencoWidget(url);
        // Payment success will come back via PAYMENT_SUCCESS window message or RN bridge
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

      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', pt: 6, pb: 4, px: 3, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800}>{formatCurrency(fare)}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>Amount Due</Typography>
        {ride?.rideCode && (
          <Chip label={`Ride #${ride.rideCode}`} size="small"
            sx={{ mt: 1.5, color: 'white', borderColor: 'rgba(255,255,255,0.6)', border: '1px solid' }} />
        )}
      </Box>

      {/* Payment options */}
      <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 440, mx: 'auto', width: '100%' }}>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Choose Payment Method</Typography>

        {/* ── CASH ───────────────────────────────────────────────────────────── */}
        <Paper
          component={motion.div} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: 'divider' }}
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
            <Button fullWidth variant="contained" color="success" size="large"
              onClick={handleCashPayment} disabled={paying}
              sx={{ height: 52, fontWeight: 700, borderRadius: 2 }}>
              {paying ? <CircularProgress size={22} color="inherit" /> : `Pay ${formatCurrency(fare)} Cash`}
            </Button>
          </Box>
        </Paper>

        {/* ── OKRAPAY ────────────────────────────────────────────────────────── */}
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
                  <Button fullWidth variant="contained" color="primary" size="large"
                    onClick={handleOkraPayPayment} disabled={paying}
                    sx={{ height: 52, fontWeight: 700, borderRadius: 2 }}>
                    {paying ? <CircularProgress size={22} color="inherit" /> : `Pay ${formatCurrency(fare)} with OkraPay`}
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info when OkraPay is disabled */}
        {!okrapayAllowed && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Online payment is currently unavailable. Please pay the driver with cash.
          </Alert>
        )}

      </Box>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}