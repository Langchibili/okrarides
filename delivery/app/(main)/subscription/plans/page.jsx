// 'use client';
// // PATH: driver/app/(main)/subscription/plans/page.jsx

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   Grid,
//   Chip,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Divider,
//   CircularProgress,
//   Alert,
//   AppBar,
//   Toolbar,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions,
// } from '@mui/material';
// import {
//   CheckCircle as CheckIcon,
//   Star         as StarIcon,
//   Timer        as TimerIcon,
//   ArrowBack    as BackIcon,
//   Warning      as WarningIcon,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { useSubscription } from '@/lib/hooks/useSubscription';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { formatCurrency } from '@/Functions';
// import OkraPayModal from '@/components/OkraPay/OkraPayModal';

// export default function SubscriptionPlansPage() {
//   const router = useRouter();
//   const { user } = useAuth();

//   const {
//     plans,
//     currentSubscription,
//     loading,
//     error,
//     fetchPlans,
//     startFreeTrial,
//     createSubscriptionIntent,
//   } = useSubscription();

//   const [trialLoading,   setTrialLoading]   = useState(null);  // planId | null
//   const [intentLoading,  setIntentLoading]  = useState(null);  // planId | null
//   const [modalOpen,      setModalOpen]      = useState(false);
//   const [pendingPayment, setPendingPayment] = useState(null);  // { subscriptionId, amount, planName }
//   const [pageError,      setPageError]      = useState(null);

//   // ── Confirmation dialog state ──────────────────────────────────────────────
//   const [confirmDialog, setConfirmDialog] = useState({
//     open:    false,
//     type:    null,   // 'trial' | 'subscribe'
//     plan:    null,
//     loading: false,
//   });

//   useEffect(() => {
//     fetchPlans().catch(() => {});
//   }, []);

//   // ── Country / phone / currency from user.country ───────────────────────────
//   const country    = user?.country ?? {};
//   const phoneCode  = String(country.phoneCode || '260').replace(/\D/g, '');
//   const currency   = 'ZMW';
//   const acceptedMM = Array.isArray(country.acceptedMobileMoneyPayments)
//     ? country.acceptedMobileMoneyPayments
//     : null;

//   // ── Open confirmation dialogs (instead of window.confirm) ─────────────────
//   const handleStartTrialClick = (plan) => {
//     setPageError(null);
//     setConfirmDialog({ open: true, type: 'trial', plan, loading: false });
//   };

//   const handleSubscribeClick = (plan) => {
//     setPageError(null);
//     setConfirmDialog({ open: true, type: 'subscribe', plan, loading: false });
//   };

//   const handleConfirmClose = () => {
//     if (confirmDialog.loading) return; // prevent close while processing
//     setConfirmDialog({ open: false, type: null, plan: null, loading: false });
//   };

//   // ── Called when user confirms the dialog ──────────────────────────────────
//   const handleConfirmProceed = async () => {
//     const { type, plan } = confirmDialog;
//     setConfirmDialog(prev => ({ ...prev, loading: true }));

//     if (type === 'trial') {
//       await handleStartTrial(plan);
//     } else if (type === 'subscribe') {
//       await handleSubscribe(plan);
//     }

//     setConfirmDialog({ open: false, type: null, plan: null, loading: false });
//   };

//   // ── Free trial (called after confirmation) ─────────────────────────────────
//   const handleStartTrial = async (plan) => {
//     setPageError(null);
//     try {
//       setTrialLoading(plan.id);
//       const res = await startFreeTrial(plan.id);
//       if (res.success) router.push('/subscription/success?type=trial');
//     } catch (err) {
//       setPageError(err.message);
//     } finally {
//       setTrialLoading(null);
//     }
//   };

//   // ── Subscribe → create PENDING intent → open OkraPayModal ─────────────────
//   //
//   // IMPORTANT: createSubscriptionIntent now creates a PENDING subscription on
//   // the backend (not active).  The subscription is only activated AFTER
//   // OkraPay confirms payment via webhook / poller.
//   // The backend returns { success, subscriptionId, amount } so we can pass
//   // the subscriptionId to OkraPayModal as relatedEntityId.
//   const handleSubscribe = async (plan) => {
//     setPageError(null);
//     try {
//       setIntentLoading(plan.id);
//       const res = await createSubscriptionIntent(plan.id);

//       // res must contain subscriptionId (the pending DB record)
//       if (!res?.subscriptionId) {
//         throw new Error('Could not create subscription record. Please try again.');
//       }

//       setPendingPayment({
//         subscriptionId: res.subscriptionId,
//         amount:         res.amount ?? plan.price,
//         planName:       plan.name,
//       });
//       setModalOpen(true);
//     } catch (err) {
//       setPageError(err.message);
//     } finally {
//       setIntentLoading(null);
//     }
//   };

//   // ── Modal callbacks ────────────────────────────────────────────────────────
//   const handlePaymentSuccess = () => {
//     setModalOpen(false);
//     router.push(
//       `/subscription/success?plan=${encodeURIComponent(pendingPayment?.planName ?? '')}`
//     );
//   };

//   const handlePaymentError = (err) => {
//     setModalOpen(false);
//     setPendingPayment(null);
//     setPageError(err?.message || 'Payment failed. Please try again.');
//   };

//   const handleModalClose = () => {
//     setModalOpen(false);
//     // Do NOT clear pendingPayment here — user may have just dismissed the sheet
//     // without paying; keep the pending record intact for a retry.
//     // If they click Subscribe again a new intent will be created anyway.
//     setPendingPayment(null);
//   };

//   // ─────────────────────────────────────────────────────────────────────────

//   if (loading && plans.length === 0) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>

//       {/* ── App Bar ─────────────────────────────────────────────────────────── */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
//             <BackIcon />
//           </IconButton>
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="h6" fontWeight={700}>Subscription Plans</Typography>
//             <Typography variant="caption" sx={{ opacity: 0.85 }}>
//               Choose a plan and keep 100% of your earnings
//             </Typography>
//           </Box>
//         </Toolbar>
//       </AppBar>

//       <Box sx={{ p: 3 }}>

//         {/* Errors */}
//         {(error || pageError) && (
//           <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError(null)}>
//             {pageError || error}
//           </Alert>
//         )}

//         {/* Current subscription banner */}
//         {currentSubscription && (
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//             <Paper
//               elevation={3}
//               sx={{
//                 p: 3, mb: 3, borderRadius: 4,
//                 background: currentSubscription.subscriptionStatus === 'active'
//                   ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
//                   : 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
//                 color: 'white',
//               }}
//             >
//               <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
//                 Current Plan: {currentSubscription.plan?.name}
//               </Typography>
//               <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
//                 Status: {currentSubscription.subscriptionStatus}
//               </Typography>
//               <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                 {currentSubscription.daysRemaining} days remaining · Expires:{' '}
//                 {new Date(currentSubscription.expiresAt).toLocaleDateString()}
//               </Typography>
//             </Paper>
//           </motion.div>
//         )}

//         {/* ── Plans Grid ───────────────────────────────────────────────────── */}
//         <Grid container spacing={2} alignItems="stretch">
//           {plans.map((plan, index) => (
//             <Grid
//               item xs={12} md={6} key={plan.id}
//               sx={{ display: 'flex' }}
//             >
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: index * 0.1 }}
//                 style={{ width: '100%', display: 'flex' }}
//               >
//                 <Paper
//                   elevation={plan.isPopular ? 6 : 2}
//                   sx={{
//                     p: 3, borderRadius: 4,
//                     width: '100%', height: '100%',
//                     display: 'flex', flexDirection: 'column',
//                     position: 'relative',
//                     border: plan.isPopular ? 3 : 0,
//                     borderColor: 'primary.main',
//                   }}
//                 >
//                   {plan.isPopular && (
//                     <Chip
//                       label="Most Popular"
//                       color="primary"
//                       icon={<StarIcon />}
//                       sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 600 }}
//                     />
//                   )}

//                   <Typography
//                     variant="h5" fontWeight={700}
//                     sx={{ mb: 1, pr: plan.isPopular ? 14 : 0 }}
//                   >
//                     {plan.name}
//                   </Typography>

//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                     {plan.description}
//                   </Typography>

//                   <Box sx={{ mb: 3 }}>
//                     <Typography variant="h3" fontWeight={700} color="primary.main">
//                       {formatCurrency(plan.price)}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">
//                       per {plan.durationType}
//                     </Typography>
//                   </Box>

//                   <Divider sx={{ my: 2 }} />

//                   <List dense sx={{ flex: 1 }}>
//                     {plan.features.map((feature, idx) => (
//                       <ListItem key={idx} sx={{ px: 0 }}>
//                         <ListItemIcon sx={{ minWidth: 32 }}>
//                           <CheckIcon color="success" fontSize="small" />
//                         </ListItemIcon>
//                         <ListItemText
//                           primary={feature}
//                           primaryTypographyProps={{ variant: 'body2' }}
//                         />
//                       </ListItem>
//                     ))}
//                   </List>

//                   {plan.hasFreeTrial && (
//                     <Box sx={{
//                       mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'success.light',
//                       display: 'flex', alignItems: 'center', gap: 1,
//                     }}>
//                       <TimerIcon sx={{ color: 'success.dark' }} />
//                       <Typography variant="caption" fontWeight={600} color="success.dark">
//                         {plan.freeTrialDays}-day free trial available
//                       </Typography>
//                     </Box>
//                   )}

//                   {/* ── Buttons ─────────────────────────────────────────────── */}
//                   <Box sx={{ mt: 'auto', pt: 3 }}>
//                     {plan.hasFreeTrial && !currentSubscription && (
//                       <Button
//                         fullWidth variant="outlined" size="large"
//                         onClick={() => handleStartTrialClick(plan)}
//                         disabled={!!trialLoading || !!intentLoading}
//                         sx={{ mb: 1.5, height: 52, borderRadius: 3, fontWeight: 600 }}
//                       >
//                         {trialLoading === plan.id
//                           ? <CircularProgress size={22} />
//                           : `Start ${plan.freeTrialDays}-Day Free Trial`}
//                       </Button>
//                     )}

//                     <Button
//                       fullWidth
//                       variant={plan.isPopular ? 'contained' : 'outlined'}
//                       size="large"
//                       onClick={() => handleSubscribeClick(plan)}
//                       disabled={
//                         currentSubscription?.plan?.id === plan.id ||
//                         !!trialLoading ||
//                         intentLoading === plan.id
//                       }
//                       sx={{ height: 52, borderRadius: 3, fontWeight: 600 }}
//                     >
//                       {intentLoading === plan.id ? (
//                         <CircularProgress size={22} />
//                       ) : currentSubscription?.plan?.id === plan.id ? (
//                         'Current Plan'
//                       ) : (
//                         `Subscribe Now — ${formatCurrency(plan.price)}`
//                       )}
//                     </Button>
//                   </Box>
//                 </Paper>
//               </motion.div>
//             </Grid>
//           ))}
//         </Grid>

//         {/* ── Why Subscribe ───────────────────────────────────────────────── */}
//         <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 4 }}>
//           <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Why Subscribe?</Typography>
//           <Grid container spacing={2}>
//             {[
//               { color: 'success', label: 'Zero Commission',     sub: 'Keep 100% of your ride earnings' },
//               { color: 'primary', label: 'Unlimited Rides',     sub: 'Accept as many rides as you want' },
//               { color: 'info',    label: 'Priority Support',    sub: 'Get help faster when you need it' },
//               { color: 'warning', label: 'Real-time Analytics', sub: 'Track your earnings and performance' },
//             ].map(({ color, label, sub }) => (
//               <Grid item xs={12} sm={6} key={label}>
//                 <Box sx={{ display: 'flex', gap: 2 }}>
//                   <Box sx={{
//                     width: 48, height: 48, borderRadius: 2,
//                     bgcolor: `${color}.light`,
//                     display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
//                   }}>
//                     <CheckIcon sx={{ color: `${color}.dark` }} />
//                   </Box>
//                   <Box>
//                     <Typography variant="subtitle1" fontWeight={600}>{label}</Typography>
//                     <Typography variant="body2" color="text.secondary">{sub}</Typography>
//                   </Box>
//                 </Box>
//               </Grid>
//             ))}
//           </Grid>
//         </Paper>
//       </Box>

//       {/* ── OkraPayModal ────────────────────────────────────────────────────────
//            purpose="subpay" with relatedEntityId = PENDING subscription ID.
//            The backend's handleSubscriptionPaymentSuccess activates the
//            pending subscription only after OkraPay confirms payment.
//       ─────────────────────────────────────────────────────────────────────── */}
//       {pendingPayment && (
//         <OkraPayModal
//           open={modalOpen}
//           onClose={handleModalClose}
//           amount={pendingPayment.amount}
//           purpose="subpay"
//           relatedEntityId={pendingPayment.subscriptionId}
//           currency={currency}
//           phoneCode={phoneCode}
//           acceptedMobileMoneyPayments={acceptedMM}
//           onSuccess={handlePaymentSuccess}
//           onError={handlePaymentError}
//         />
//       )}

//       {/* ── Confirmation Dialog ──────────────────────────────────────────────── */}
//       <Dialog
//         open={confirmDialog.open}
//         onClose={handleConfirmClose}
//         PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
//         maxWidth="xs"
//         fullWidth
//       >
//         <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
//           <WarningIcon color="primary" />
//           {confirmDialog.type === 'trial' ? 'Start Free Trial' : 'Confirm Subscription'}
//         </DialogTitle>

//         <DialogContent>
//           <DialogContentText>
//             {confirmDialog.type === 'trial' ? (
//               <>
//                 You're about to start a{' '}
//                 <strong>{confirmDialog.plan?.freeTrialDays}-day free trial</strong> for{' '}
//                 <strong>{confirmDialog.plan?.name}</strong>.
//                 <br /><br />
//                 No payment is required now. The trial gives you full access for{' '}
//                 {confirmDialog.plan?.freeTrialDays} day(s).
//               </>
//             ) : (
//               <>
//                 You're about to subscribe to{' '}
//                 <strong>{confirmDialog.plan?.name}</strong> for{' '}
//                 <strong>{formatCurrency(confirmDialog.plan?.price)}</strong> per{' '}
//                 {confirmDialog.plan?.durationType}.
//                 <br /><br />
//                 You will be taken to the payment screen to complete your purchase.
//               </>
//             )}
//           </DialogContentText>
//         </DialogContent>

//         <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
//           <Button
//             onClick={handleConfirmClose}
//             variant="outlined"
//             disabled={confirmDialog.loading}
//             sx={{ flex: 1, borderRadius: 2 }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleConfirmProceed}
//             variant="contained"
//             disabled={confirmDialog.loading}
//             sx={{ flex: 1, borderRadius: 2 }}
//           >
//             {confirmDialog.loading
//               ? <CircularProgress size={20} />
//               : 'Proceed'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//     </Box>
//   );
// }
// PATH: app/(main)/subscription/plans/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Button, Paper, Grid,
  Chip, List, ListItem, ListItemIcon, ListItemText, Divider,
  CircularProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CheckCircle as CheckIcon, Star as StarIcon,
  Timer as TimerIcon, ArrowBack as BackIcon, Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription }   from '@/lib/hooks/useSubscription';
import { useAuth }           from '@/lib/hooks/useAuth';
import { formatCurrency }    from '@/Functions';
import OkraPayModal          from '@/components/OkraPay/OkraPayModal';
import { SubscriptionSkeleton } from '@/components/Skeletons/SubscriptionSkeleton';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

const PLAN_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { plans, currentSubscription, loading, error, fetchPlans, startFreeTrial, createSubscriptionIntent } = useSubscription();

  const [trialLoading,  setTrialLoading]  = useState(null);
  const [intentLoading, setIntentLoading] = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [pageError,     setPageError]     = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, plan: null, loading: false });

  useEffect(() => { fetchPlans().catch(() => {}); }, []);

  const country   = user?.country ?? {};
  const phoneCode = String(country.phoneCode || '260').replace(/\D/g, '');
  const currency  = 'ZMW';
  const acceptedMM = Array.isArray(country.acceptedMobileMoneyPayments) ? country.acceptedMobileMoneyPayments : null;

  const handleStartTrialClick = (plan) => { setPageError(null); setConfirmDialog({ open: true, type: 'trial', plan, loading: false }); };
  const handleSubscribeClick  = (plan) => { setPageError(null); setConfirmDialog({ open: true, type: 'subscribe', plan, loading: false }); };
  const handleConfirmClose    = ()     => { if (!confirmDialog.loading) setConfirmDialog({ open: false, type: null, plan: null, loading: false }); };

  const handleConfirmProceed = async () => {
    const { type, plan } = confirmDialog;
    setConfirmDialog(p => ({ ...p, loading: true }));
    if (type === 'trial')     await handleStartTrial(plan);
    else if (type === 'subscribe') await handleSubscribe(plan);
    setConfirmDialog({ open: false, type: null, plan: null, loading: false });
  };

  const handleStartTrial = async (plan) => {
    try { setTrialLoading(plan.id); const res = await startFreeTrial(plan.id); if (res.success) router.push('/subscription/success?type=trial'); }
    catch (err) { setPageError(err.message); }
    finally { setTrialLoading(null); }
  };

  const handleSubscribe = async (plan) => {
    try {
      setIntentLoading(plan.id);
      const res = await createSubscriptionIntent(plan.id);
      if (!res?.subscriptionId) throw new Error('Could not create subscription record.');
      setPendingPayment({ subscriptionId: res.subscriptionId, amount: res.amount ?? plan.price, planName: plan.name });
      setModalOpen(true);
    } catch (err) { setPageError(err.message); }
    finally { setIntentLoading(null); }
  };

  const handlePaymentSuccess = () => { setModalOpen(false); router.push(`/subscription/success?plan=${encodeURIComponent(pendingPayment?.planName ?? '')}`); };
  const handlePaymentError   = (err) => { setModalOpen(false); setPendingPayment(null); setPageError(err?.message || 'Payment failed.'); };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1E293B', 0.98)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>Subscription Plans</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Keep 100% of your earnings</Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 4, ...hideScrollbar }}>
        {(error || pageError) && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPageError(null)}>
            {pageError || error}
          </Alert>
        )}

        {loading && plans.length === 0 ? (
          <SubscriptionSkeleton />
        ) : (
          <>
            {/* ── Current plan banner ──────────────────────────────────── */}
            <AnimatePresence>
              {currentSubscription && (
                <motion.div key="cur" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Paper elevation={0} sx={{
                    p: 2.5, mb: 2, borderRadius: 3, color: 'white',
                    background: currentSubscription.subscriptionStatus === 'active'
                      ? 'linear-gradient(135deg, #059669 0%, #065F46 100%)'
                      : 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
                    boxShadow: `0 8px 28px ${alpha(currentSubscription.subscriptionStatus === 'active' ? '#059669' : '#D97706', 0.35)}`,
                  }}>
                    <Typography variant="subtitle1" fontWeight={700}>{currentSubscription.plan?.name} — {currentSubscription.subscriptionStatus}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {currentSubscription.daysRemaining}d remaining · Expires {new Date(currentSubscription.expiresAt).toLocaleDateString()}
                    </Typography>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Plans ────────────────────────────────────────────────── */}
            <Box sx={{
                display: 'block',
                gridTemplateColumns: '1fr 1fr',
                gridAutoRows: '1fr',
                gap: 1.5,
                mb: 1.5,
                '& > *': { minWidth: 0, minHeight: 0 },
              }}>
              {plans.map((plan, index) => {
                const accent   = PLAN_COLORS[index % PLAN_COLORS.length];
                const isCurrent = currentSubscription?.plan?.id === plan.id;
                return (
                  <Grid item xs={12} key={plan.id} sx={{ display: 'flex', marginBottom:'20px' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.07 }}
                      style={{ width: '100%', display: 'flex' }}
                    >
                      <Paper elevation={isDark ? 0 : plan.isPopular ? 4 : 2} sx={{
                        p: 2.5, borderRadius: 3, width: '100%', display: 'flex', flexDirection: 'column',
                        position: 'relative', overflow: 'hidden',
                        border: `1.5px solid ${alpha(accent, plan.isPopular ? (isDark ? 0.5 : 0.3) : (isDark ? 0.18 : 0.1))}`,
                        background: isDark
                          ? `linear-gradient(145deg, ${alpha(accent, 0.12)} 0%, transparent 70%)`
                          : `linear-gradient(145deg, ${alpha(accent, 0.05)} 0%, transparent 70%)`,
                        boxShadow: plan.isPopular ? `0 8px 28px ${alpha(accent, isDark ? 0.25 : 0.18)}` : undefined,
                      }}>
                        {/* Ambient blob */}
                        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%',
                          background: `radial-gradient(circle, ${alpha(accent, 0.18)} 0%, transparent 70%)`, pointerEvents: 'none' }} />

                        {plan.isPopular && (
                          <Chip label="⭐ Most Popular" size="small"
                            sx={{ position: 'absolute', top: 14, right: 14, fontWeight: 700, height: 24,
                              bgcolor: alpha(accent, isDark ? 0.25 : 0.12), color: accent, fontSize: 11 }} />
                        )}

                        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.25, pr: plan.isPopular ? 12 : 0, color: accent }}>
                          {plan.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>{plan.description}</Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h3" fontWeight={900} sx={{
                            background: `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.7)} 100%)`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1,
                          }}>
                            {formatCurrency(plan.price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">per {plan.durationType}</Typography>
                        </Box>

                        <Divider sx={{ mb: 1.5 }} />

                        <List dense sx={{ flex: 1, mb: 1.5 }}>
                          {plan.features.map((f, fi) => (
                            <ListItem key={fi} sx={{ px: 0, py: 0.4 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <CheckIcon sx={{ fontSize: 16, color: accent }} />
                              </ListItemIcon>
                              <ListItemText primary={<Typography variant="body2">{f}</Typography>} />
                            </ListItem>
                          ))}
                        </List>

                        {plan.hasFreeTrial && (
                          <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha(accent, isDark ? 0.15 : 0.07),
                            display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimerIcon sx={{ fontSize: 16, color: accent }} />
                            <Typography variant="caption" fontWeight={700} sx={{ color: accent }}>
                              {plan.freeTrialDays}-day free trial available
                            </Typography>
                          </Box>
                        )}

                        {plan.hasFreeTrial && !currentSubscription && (
                          <Button fullWidth variant="outlined" size="large"
                            onClick={() => handleStartTrialClick(plan)}
                            disabled={!!trialLoading || !!intentLoading}
                            sx={{ mb: 1, height: 48, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                              borderColor: accent, color: accent,
                              '&:hover': { borderColor: accent, bgcolor: alpha(accent, 0.06) } }}>
                            {trialLoading === plan.id ? <CircularProgress size={20} /> : `Start ${plan.freeTrialDays}-Day Free Trial`}
                          </Button>
                        )}

                        <Button fullWidth variant={plan.isPopular ? 'contained' : 'outlined'} size="large"
                          onClick={() => handleSubscribeClick(plan)}
                          disabled={isCurrent || !!trialLoading || intentLoading === plan.id}
                          sx={{ height: 48, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                            ...(plan.isPopular
                              ? { background: `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.8)} 100%)`,
                                  boxShadow: `0 4px 16px ${alpha(accent, 0.38)}`, color: '#fff',
                                  '&:hover': { background: `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.9)} 100%)` } }
                              : { borderColor: accent, color: accent, '&:hover': { bgcolor: alpha(accent, 0.06), borderColor: accent } }
                            ),
                          }}>
                          {intentLoading === plan.id ? <CircularProgress size={20} />
                            : isCurrent ? 'Current Plan'
                            : `Subscribe — ${formatCurrency(plan.price)}`}
                        </Button>
                      </Paper>
                    </motion.div>
                  </Grid>
                );
              })}
            </Box>

            {/* ── Why subscribe ────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Paper elevation={isDark ? 0 : 2} sx={{
                p: 2.5, mt: 2, borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.08)}`,
              }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Why Subscribe?</Typography>
                <Grid container spacing={1.5}>
                  {[
                    { color: '#10B981', label: 'Zero Commission',     sub: 'Keep 100% of your ride earnings' },
                    { color: '#3B82F6', label: 'Unlimited Rides',     sub: 'Accept as many rides as you want' },
                    { color: '#06B6D4', label: 'Priority Support',    sub: 'Get help faster when you need it' },
                    { color: '#F59E0B', label: 'Real-time Analytics', sub: 'Track earnings and performance'   },
                  ].map(({ color, label, sub }) => (
                    <Grid item xs={6} key={label}>
                      <Box sx={{ display: 'flex', gap: 1.25 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(color, isDark ? 0.18 : 0.1),
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckIcon sx={{ fontSize: 18, color }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{label}</Typography>
                          <Typography variant="caption" color="text.secondary">{sub}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          </>
        )}
      </Box>

      {/* OkraPay Modal */}
      {pendingPayment && (
        <OkraPayModal open={modalOpen} onClose={() => { setModalOpen(false); setPendingPayment(null); }}
          amount={pendingPayment.amount} purpose="subpay" relatedEntityId={pendingPayment.subscriptionId}
          currency={currency} phoneCode={phoneCode} acceptedMobileMoneyPayments={acceptedMM}
          onSuccess={handlePaymentSuccess} onError={handlePaymentError} />
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleConfirmClose}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <WarningIcon color="primary" />
          {confirmDialog.type === 'trial' ? 'Start Free Trial' : 'Confirm Subscription'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.type === 'trial'
              ? <>Starting a <strong>{confirmDialog.plan?.freeTrialDays}-day free trial</strong> for <strong>{confirmDialog.plan?.name}</strong>. No payment required.</>
              : <>Subscribing to <strong>{confirmDialog.plan?.name}</strong> for <strong>{formatCurrency(confirmDialog.plan?.price)}</strong> / {confirmDialog.plan?.durationType}. You'll be taken to the payment screen.</>
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleConfirmClose} variant="outlined" disabled={confirmDialog.loading} sx={{ flex: 1, borderRadius: 2, fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleConfirmProceed} variant="contained" disabled={confirmDialog.loading} sx={{ flex: 1, borderRadius: 2, fontWeight: 700 }}>
            {confirmDialog.loading ? <CircularProgress size={20} /> : 'Proceed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}