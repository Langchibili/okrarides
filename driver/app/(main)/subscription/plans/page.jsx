// // //Okrarides\driver\app\(main)\subscription\plans\page.jsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useRouter } from 'next/navigation';
// // import {
// //   Box,
// //   Typography,
// //   Button,
// //   Paper,
// //   Grid,
// //   Chip,
// //   List,
// //   ListItem,
// //   ListItemIcon,
// //   ListItemText,
// //   Divider,
// //   CircularProgress,
// //   Alert,
// // } from '@mui/material';
// // import {
// //   CheckCircle as CheckIcon,
// //   Star as StarIcon,
// //   Timer as TimerIcon,
// //   ArrowBack as BackIcon,
// // } from '@mui/icons-material';
// // import { motion } from 'framer-motion';
// // import { useSubscription } from '@/lib/hooks/useSubscription';
// // import { formatCurrency } from '@/Functions';

// // export default function SubscriptionPlansPage() {
// //   const router = useRouter();
// //   const {
// //     plans,
// //     currentSubscription,
// //     loading,
// //     error,
// //     fetchPlans,
// //     startFreeTrial,
// //     subscribe,
// //   } = useSubscription();

// //   const [selectedPlan, setSelectedPlan] = useState(null);
// //   const [actionLoading, setActionLoading] = useState(false);

// //   useEffect(() => {
// //     loadPlans();
// //   }, []);

// //   const loadPlans = async () => {
// //     try {
// //       await fetchPlans();
// //     } catch (err) {
// //       console.error('Error loading plans:', err);
// //     }
// //   };

// //   const handleStartTrial = async (plan) => {
// //     if (window.confirm(`Start ${plan.freeTrialDays}-day free trial?`)) {
// //       try {
// //         setActionLoading(true);
// //         const response = await startFreeTrial(plan.id);
// //         if (response.success) {
// //           router.push('/home');
// //         }
// //       } catch (err) {
// //         console.error('Error starting trial:', err);
// //         alert(err.message);
// //       } finally {
// //         setActionLoading(false);
// //       }
// //     }
// //   };

// //   const handleSubscribe = async (plan) => {
// //     try {
// //       setActionLoading(true);
// //       setSelectedPlan(plan.id);
// //       const response = await subscribe(plan.id);
// //       if (response.success) {
// //         // Redirect to payment
// //         window.location.href = response.paymentUrl;
// //       }
// //     } catch (err) {
// //       console.error('Error subscribing:', err);
// //       alert(err.message);
// //     } finally {
// //       setActionLoading(false);
// //       setSelectedPlan(null);
// //     }
// //   };

// //   if (loading && plans.length === 0) {
// //     return (
// //       <Box
// //         sx={{
// //           display: 'flex',
// //           justifyContent: 'center',
// //           alignItems: 'center',
// //           minHeight: '100vh',
// //         }}
// //       >
// //         <CircularProgress />
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
// //       {/* Header */}
// //       <Box
// //         sx={{
// //           p: 2,
// //           display: 'flex',
// //           alignItems: 'center',
// //           gap: 2,
// //           borderBottom: 1,
// //           borderColor: 'divider',
// //         }}
// //       >
// //         <Button
// //           startIcon={<BackIcon />}
// //           onClick={() => router.back()}
// //           sx={{ minWidth: 'auto' }}
// //         >
// //           Back
// //         </Button>
// //         <Box sx={{ flex: 1 }}>
// //           <Typography variant="h5" sx={{ fontWeight: 700 }}>
// //             Subscription Plans
// //           </Typography>
// //           <Typography variant="body2" color="text.secondary">
// //             Choose a plan and keep 100% of your earnings
// //           </Typography>
// //         </Box>
// //       </Box>

// //       <Box sx={{ p: 3 }}>
// //         {/* Error Alert */}
// //         {error && (
// //           <Alert severity="error" sx={{ mb: 2 }}>
// //             {error}
// //           </Alert>
// //         )}

// //         {/* Current Subscription */}
// //         {currentSubscription && (
// //           <motion.div
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //           >
// //             <Paper
// //               elevation={3}
// //               sx={{
// //                 p: 3,
// //                 mb: 3,
// //                 borderRadius: 4,
// //                 background: `linear-gradient(135deg, ${
// //                   currentSubscription.status === 'active'
// //                     ? '#4CAF50'
// //                     : '#FF9800'
// //                 } 0%, ${
// //                   currentSubscription.status === 'active'
// //                     ? '#388E3C'
// //                     : '#F57C00'
// //                 } 100%)`,
// //                 color: 'white',
// //               }}
// //             >
// //               <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
// //                 Current Plan: {currentSubscription.plan?.name}
// //               </Typography>
// //               <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
// //                 Status: {currentSubscription.status}
// //               </Typography>
// //               <Typography variant="caption" sx={{ opacity: 0.8 }}>
// //                 {currentSubscription.daysRemaining} days remaining • Expires:{' '}
// //                 {new Date(currentSubscription.expiresAt).toLocaleDateString()}
// //               </Typography>
// //             </Paper>
// //           </motion.div>
// //         )}

// //         {/* Plans Grid */}
// //         <Grid container spacing={2}>
// //           {plans.map((plan, index) => (
// //             <Grid item xs={12} md={6} key={plan.id}>
// //               <motion.div
// //                 initial={{ opacity: 0, y: 20 }}
// //                 animate={{ opacity: 1, y: 0 }}
// //                 transition={{ delay: index * 0.1 }}
// //               >
// //                 <Paper
// //                   elevation={plan.isPopular ? 6 : 2}
// //                   sx={{
// //                     p: 3,
// //                     borderRadius: 4,
// //                     height: '100%',
// //                     position: 'relative',
// //                     border: plan.isPopular ? 3 : 0,
// //                     borderColor: 'primary.main',
// //                   }}
// //                 >
// //                   {plan.isPopular && (
// //                     <Chip
// //                       label="Most Popular"
// //                       color="primary"
// //                       icon={<StarIcon />}
// //                       sx={{
// //                         position: 'absolute',
// //                         top: 16,
// //                         right: 16,
// //                         fontWeight: 600,
// //                       }}
// //                     />
// //                   )}

// //                   <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
// //                     {plan.name}
// //                   </Typography>
// //                   <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
// //                     {plan.description}
// //                   </Typography>

// //                   <Box sx={{ mb: 3 }}>
// //                     <Typography
// //                       variant="h3"
// //                       sx={{ fontWeight: 700, color: 'primary.main' }}
// //                     >
// //                       {formatCurrency(plan.price)}
// //                     </Typography>
// //                     <Typography variant="body2" color="text.secondary">
// //                       per {plan.durationType}
// //                     </Typography>
// //                   </Box>

// //                   <Divider sx={{ my: 2 }} />

// //                   <List dense>
// //                     {plan.features.map((feature, idx) => (
// //                       <ListItem key={idx} sx={{ px: 0 }}>
// //                         <ListItemIcon sx={{ minWidth: 32 }}>
// //                           <CheckIcon color="success" fontSize="small" />
// //                         </ListItemIcon>
// //                         <ListItemText
// //                           primary={feature}
// //                           primaryTypographyProps={{ variant: 'body2' }}
// //                         />
// //                       </ListItem>
// //                     ))}
// //                   </List>

// //                   {plan.hasFreeTrial && (
// //                     <Box
// //                       sx={{
// //                         mt: 2,
// //                         p: 1.5,
// //                         borderRadius: 2,
// //                         bgcolor: 'success.light',
// //                         display: 'flex',
// //                         alignItems: 'center',
// //                         gap: 1,
// //                       }}
// //                     >
// //                       <TimerIcon sx={{ color: 'success.dark' }} />
// //                       <Typography
// //                         variant="caption"
// //                         sx={{ fontWeight: 600, color: 'success.dark' }}
// //                       >
// //                         {plan.freeTrialDays} days free trial
// //                       </Typography>
// //                     </Box>
// //                   )}

// //                   {/* Action Buttons */}
// //                   {plan.hasFreeTrial && !currentSubscription && (
// //                     <Button
// //                       fullWidth
// //                       variant="outlined"
// //                       size="large"
// //                       onClick={() => handleStartTrial(plan)}
// //                       disabled={actionLoading}
// //                       sx={{ mt: 2, height: 56, borderRadius: 3, fontWeight: 600 }}
// //                     >
// //                       {actionLoading && selectedPlan === plan.id ? (
// //                         <CircularProgress size={24} />
// //                       ) : (
// //                         `Start ${plan.freeTrialDays}-Day Free Trial`
// //                       )}
// //                     </Button>
// //                   )}

// //                   <Button
// //                     fullWidth
// //                     variant={plan.isPopular ? 'contained' : 'outlined'}
// //                     size="large"
// //                     onClick={() => handleSubscribe(plan)}
// //                     disabled={
// //                       currentSubscription?.plan?.id === plan.id || actionLoading
// //                     }
// //                     sx={{
// //                       mt: 2,
// //                       height: 56,
// //                       borderRadius: 3,
// //                       fontWeight: 600,
// //                     }}
// //                   >
// //                     {actionLoading && selectedPlan === plan.id ? (
// //                       <CircularProgress size={24} />
// //                     ) : currentSubscription?.plan?.id === plan.id ? (
// //                       'Current Plan'
// //                     ) : (
// //                       'Subscribe Now'
// //                     )}
// //                   </Button>
// //                 </Paper>
// //               </motion.div>
// //             </Grid>
// //           ))}
// //         </Grid>

// //         {/* Benefits Section */}
// //         <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 4 }}>
// //           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// //             Why Subscribe?
// //           </Typography>
// //           <Grid container spacing={2}>
// //             <Grid item xs={12} sm={6}>
// //               <Box sx={{ display: 'flex', gap: 2 }}>
// //                 <Box
// //                   sx={{
// //                     width: 48,
// //                     height: 48,
// //                     borderRadius: 2,
// //                     bgcolor: 'success.light',
// //                     display: 'flex',
// //                     alignItems: 'center',
// //                     justifyContent: 'center',
// //                     flexShrink: 0,
// //                   }}
// //                 >
// //                   <CheckIcon sx={{ color: 'success.dark' }} />
// //                 </Box>
// //                 <Box>
// //                   <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
// //                     Zero Commission
// //                   </Typography>
// //                   <Typography variant="body2" color="text.secondary">
// //                     Keep 100% of your ride earnings
// //                   </Typography>
// //                 </Box>
// //               </Box>
// //             </Grid>
// //             <Grid item xs={12} sm={6}>
// //               <Box sx={{ display: 'flex', gap: 2 }}>
// //                 <Box
// //                   sx={{
// //                     width: 48,
// //                     height: 48,
// //                     borderRadius: 2,
// //                     bgcolor: 'primary.light',
// //                     display: 'flex',
// //                     alignItems: 'center',
// //                     justifyContent: 'center',
// //                     flexShrink: 0,
// //                   }}
// //                 >
// //                   <CheckIcon sx={{ color: 'primary.dark' }} />
// //                 </Box>
// //                 <Box>
// //                   <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
// //                     Unlimited Rides
// //                   </Typography>
// //                   <Typography variant="body2" color="text.secondary">
// //                     Accept as many rides as you want
// //                   </Typography>
// //                 </Box>
// //               </Box>
// //             </Grid>
// //             <Grid item xs={12} sm={6}>
// //               <Box sx={{ display: 'flex', gap: 2 }}>
// //                 <Box
// //                   sx={{
// //                     width: 48,
// //                     height: 48,
// //                     borderRadius: 2,
// //                     bgcolor: 'info.light',
// //                     display: 'flex',
// //                     alignItems: 'center',
// //                     justifyContent: 'center',
// //                     flexShrink: 0,
// //                   }}
// //                 >
// //                   <CheckIcon sx={{ color: 'info.dark' }} />
// //                 </Box>
// //                 <Box>
// //                   <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
// //                     Priority Support
// //                   </Typography>
// //                   <Typography variant="body2" color="text.secondary">
// //                     Get help faster when you need it
// //                   </Typography>
// //                 </Box>
// //               </Box>
// //             </Grid>
// //             <Grid item xs={12} sm={6}>
// //               <Box sx={{ display: 'flex', gap: 2 }}>
// //                 <Box
// //                   sx={{
// //                     width: 48,
// //                     height: 48,
// //                     borderRadius: 2,
// //                     bgcolor: 'warning.light',
// //                     display: 'flex',
// //                     alignItems: 'center',
// //                     justifyContent: 'center',
// //                     flexShrink: 0,
// //                   }}
// //                 >
// //                   <CheckIcon sx={{ color: 'warning.dark' }} />
// //                 </Box>
// //                 <Box>
// //                   <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
// //                     Real-time Analytics
// //                   </Typography>
// //                   <Typography variant="body2" color="text.secondary">
// //                     Track your earnings and performance
// //                   </Typography>
// //                 </Box>
// //               </Box>
// //             </Grid>
// //           </Grid>
// //         </Paper>
// //       </Box>
// //     </Box>
// //   );
// // }

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
// } from '@mui/material';
// import {
//   CheckCircle as CheckIcon,
//   Star         as StarIcon,
//   Timer        as TimerIcon,
//   ArrowBack    as BackIcon,
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

//   // ── Free trial ─────────────────────────────────────────────────────────────
//   const handleStartTrial = async (plan) => {
//     if (!window.confirm(`Start your ${plan.freeTrialDays}-day free trial for ${plan.name}?`)) return;
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

//   // ── Subscribe → create intent → open OkraPayModal ─────────────────────────
//   const handleSubscribe = async (plan) => {
//     setPageError(null);
//     try {
//       setIntentLoading(plan.id);
//       const res = await createSubscriptionIntent(plan.id);
//       if (!res?.subscriptionId) throw new Error('Could not create subscription record');

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
//     setPageError(err?.message || 'Payment failed. Please try again.');
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
//                 background: currentSubscription.status === 'active'
//                   ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
//                   : 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
//                 color: 'white',
//               }}
//             >
//               <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
//                 Current Plan: {currentSubscription.plan?.name}
//               </Typography>
//               <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
//                 Status: {currentSubscription.status}
//               </Typography>
//               <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                 {currentSubscription.daysRemaining} days remaining · Expires:{' '}
//                 {new Date(currentSubscription.expiresAt).toLocaleDateString()}
//               </Typography>
//             </Paper>
//           </motion.div>
//         )}

//         {/* ── Plans Grid ─────────────────────────────────────────────────────
//              Equal-height fix:
//                • alignItems="stretch" on the container
//                • display:'flex' on each Grid item
//                • Paper: display:'flex' + flexDirection:'column' + height:'100%'
//                • Feature list: flex:1  →  fills remaining vertical space
//                • Buttons: mt:'auto'   →  always pinned to card bottom
//         ─────────────────────────────────────────────────────────────────── */}
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

//                   {/* Name */}
//                   <Typography
//                     variant="h5" fontWeight={700}
//                     sx={{ mb: 1, pr: plan.isPopular ? 14 : 0 }}
//                   >
//                     {plan.name}
//                   </Typography>

//                   {/* Description */}
//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                     {plan.description}
//                   </Typography>

//                   {/* Price */}
//                   <Box sx={{ mb: 3 }}>
//                     <Typography variant="h3" fontWeight={700} color="primary.main">
//                       {formatCurrency(plan.price)}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">
//                       per {plan.durationType}
//                     </Typography>
//                   </Box>

//                   <Divider sx={{ my: 2 }} />

//                   {/* Features — flex:1 fills remaining space */}
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

//                   {/* Free trial badge */}
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

//                   {/* ── Buttons pinned to bottom via mt:'auto' ───────────────── */}
//                   <Box sx={{ mt: 'auto', pt: 3 }}>
//                     {plan.hasFreeTrial && !currentSubscription && (
//                       <Button
//                         fullWidth variant="outlined" size="large"
//                         onClick={() => handleStartTrial(plan)}
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
//                       onClick={() => handleSubscribe(plan)}
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
//            purpose="subpay" → backend's handleSubscriptionPaymentSuccess fires
//            on payment completion and activates the subscription record.
//            The success page polls /subscriptions/me to confirm activation.
//       ─────────────────────────────────────────────────────────────────────── */}
//       {pendingPayment && (
//         <OkraPayModal
//           open={modalOpen}
//           onClose={() => { setModalOpen(false); setPendingPayment(null); }}
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
//     </Box>
//   );
// }
'use client';
// PATH: driver/app/(main)/subscription/plans/page.jsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Star         as StarIcon,
  Timer        as TimerIcon,
  ArrowBack    as BackIcon,
  Warning      as WarningIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatCurrency } from '@/Functions';
import OkraPayModal from '@/components/OkraPay/OkraPayModal';

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    plans,
    currentSubscription,
    loading,
    error,
    fetchPlans,
    startFreeTrial,
    createSubscriptionIntent,
  } = useSubscription();

  const [trialLoading,   setTrialLoading]   = useState(null);  // planId | null
  const [intentLoading,  setIntentLoading]  = useState(null);  // planId | null
  const [modalOpen,      setModalOpen]      = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);  // { subscriptionId, amount, planName }
  const [pageError,      setPageError]      = useState(null);

  // ── Confirmation dialog state ──────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState({
    open:    false,
    type:    null,   // 'trial' | 'subscribe'
    plan:    null,
    loading: false,
  });

  useEffect(() => {
    fetchPlans().catch(() => {});
  }, []);

  // ── Country / phone / currency from user.country ───────────────────────────
  const country    = user?.country ?? {};
  const phoneCode  = String(country.phoneCode || '260').replace(/\D/g, '');
  const currency   = 'ZMW';
  const acceptedMM = Array.isArray(country.acceptedMobileMoneyPayments)
    ? country.acceptedMobileMoneyPayments
    : null;

  // ── Open confirmation dialogs (instead of window.confirm) ─────────────────
  const handleStartTrialClick = (plan) => {
    setPageError(null);
    setConfirmDialog({ open: true, type: 'trial', plan, loading: false });
  };

  const handleSubscribeClick = (plan) => {
    setPageError(null);
    setConfirmDialog({ open: true, type: 'subscribe', plan, loading: false });
  };

  const handleConfirmClose = () => {
    if (confirmDialog.loading) return; // prevent close while processing
    setConfirmDialog({ open: false, type: null, plan: null, loading: false });
  };

  // ── Called when user confirms the dialog ──────────────────────────────────
  const handleConfirmProceed = async () => {
    const { type, plan } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, loading: true }));

    if (type === 'trial') {
      await handleStartTrial(plan);
    } else if (type === 'subscribe') {
      await handleSubscribe(plan);
    }

    setConfirmDialog({ open: false, type: null, plan: null, loading: false });
  };

  // ── Free trial (called after confirmation) ─────────────────────────────────
  const handleStartTrial = async (plan) => {
    setPageError(null);
    try {
      setTrialLoading(plan.id);
      const res = await startFreeTrial(plan.id);
      if (res.success) router.push('/subscription/success?type=trial');
    } catch (err) {
      setPageError(err.message);
    } finally {
      setTrialLoading(null);
    }
  };

  // ── Subscribe → create PENDING intent → open OkraPayModal ─────────────────
  //
  // IMPORTANT: createSubscriptionIntent now creates a PENDING subscription on
  // the backend (not active).  The subscription is only activated AFTER
  // OkraPay confirms payment via webhook / poller.
  // The backend returns { success, subscriptionId, amount } so we can pass
  // the subscriptionId to OkraPayModal as relatedEntityId.
  const handleSubscribe = async (plan) => {
    setPageError(null);
    try {
      setIntentLoading(plan.id);
      const res = await createSubscriptionIntent(plan.id);

      // res must contain subscriptionId (the pending DB record)
      if (!res?.subscriptionId) {
        throw new Error('Could not create subscription record. Please try again.');
      }

      setPendingPayment({
        subscriptionId: res.subscriptionId,
        amount:         res.amount ?? plan.price,
        planName:       plan.name,
      });
      setModalOpen(true);
    } catch (err) {
      setPageError(err.message);
    } finally {
      setIntentLoading(null);
    }
  };

  // ── Modal callbacks ────────────────────────────────────────────────────────
  const handlePaymentSuccess = () => {
    setModalOpen(false);
    router.push(
      `/subscription/success?plan=${encodeURIComponent(pendingPayment?.planName ?? '')}`
    );
  };

  const handlePaymentError = (err) => {
    setModalOpen(false);
    setPendingPayment(null);
    setPageError(err?.message || 'Payment failed. Please try again.');
  };

  const handleModalClose = () => {
    setModalOpen(false);
    // Do NOT clear pendingPayment here — user may have just dismissed the sheet
    // without paying; keep the pending record intact for a retry.
    // If they click Subscribe again a new intent will be created anyway.
    setPendingPayment(null);
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading && plans.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>

      {/* ── App Bar ─────────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>Subscription Plans</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Choose a plan and keep 100% of your earnings
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>

        {/* Errors */}
        {(error || pageError) && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError(null)}>
            {pageError || error}
          </Alert>
        )}

        {/* Current subscription banner */}
        {currentSubscription && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Paper
              elevation={3}
              sx={{
                p: 3, mb: 3, borderRadius: 4,
                background: currentSubscription.subscriptionStatus === 'active'
                  ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
                  : 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                color: 'white',
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Current Plan: {currentSubscription.plan?.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                Status: {currentSubscription.subscriptionStatus}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {currentSubscription.daysRemaining} days remaining · Expires:{' '}
                {new Date(currentSubscription.expiresAt).toLocaleDateString()}
              </Typography>
            </Paper>
          </motion.div>
        )}

        {/* ── Plans Grid ───────────────────────────────────────────────────── */}
        <Grid container spacing={2} alignItems="stretch">
          {plans.map((plan, index) => (
            <Grid
              item xs={12} md={6} key={plan.id}
              sx={{ display: 'flex' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ width: '100%', display: 'flex' }}
              >
                <Paper
                  elevation={plan.isPopular ? 6 : 2}
                  sx={{
                    p: 3, borderRadius: 4,
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    position: 'relative',
                    border: plan.isPopular ? 3 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  {plan.isPopular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      icon={<StarIcon />}
                      sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 600 }}
                    />
                  )}

                  <Typography
                    variant="h5" fontWeight={700}
                    sx={{ mb: 1, pr: plan.isPopular ? 14 : 0 }}
                  >
                    {plan.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" fontWeight={700} color="primary.main">
                      {formatCurrency(plan.price)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      per {plan.durationType}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense sx={{ flex: 1 }}>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {plan.hasFreeTrial && (
                    <Box sx={{
                      mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'success.light',
                      display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                      <TimerIcon sx={{ color: 'success.dark' }} />
                      <Typography variant="caption" fontWeight={600} color="success.dark">
                        {plan.freeTrialDays}-day free trial available
                      </Typography>
                    </Box>
                  )}

                  {/* ── Buttons ─────────────────────────────────────────────── */}
                  <Box sx={{ mt: 'auto', pt: 3 }}>
                    {plan.hasFreeTrial && !currentSubscription && (
                      <Button
                        fullWidth variant="outlined" size="large"
                        onClick={() => handleStartTrialClick(plan)}
                        disabled={!!trialLoading || !!intentLoading}
                        sx={{ mb: 1.5, height: 52, borderRadius: 3, fontWeight: 600 }}
                      >
                        {trialLoading === plan.id
                          ? <CircularProgress size={22} />
                          : `Start ${plan.freeTrialDays}-Day Free Trial`}
                      </Button>
                    )}

                    <Button
                      fullWidth
                      variant={plan.isPopular ? 'contained' : 'outlined'}
                      size="large"
                      onClick={() => handleSubscribeClick(plan)}
                      disabled={
                        currentSubscription?.plan?.id === plan.id ||
                        !!trialLoading ||
                        intentLoading === plan.id
                      }
                      sx={{ height: 52, borderRadius: 3, fontWeight: 600 }}
                    >
                      {intentLoading === plan.id ? (
                        <CircularProgress size={22} />
                      ) : currentSubscription?.plan?.id === plan.id ? (
                        'Current Plan'
                      ) : (
                        `Subscribe Now — ${formatCurrency(plan.price)}`
                      )}
                    </Button>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* ── Why Subscribe ───────────────────────────────────────────────── */}
        <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Why Subscribe?</Typography>
          <Grid container spacing={2}>
            {[
              { color: 'success', label: 'Zero Commission',     sub: 'Keep 100% of your ride earnings' },
              { color: 'primary', label: 'Unlimited Rides',     sub: 'Accept as many rides as you want' },
              { color: 'info',    label: 'Priority Support',    sub: 'Get help faster when you need it' },
              { color: 'warning', label: 'Real-time Analytics', sub: 'Track your earnings and performance' },
            ].map(({ color, label, sub }) => (
              <Grid item xs={12} sm={6} key={label}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: 2,
                    bgcolor: `${color}.light`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CheckIcon sx={{ color: `${color}.dark` }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{label}</Typography>
                    <Typography variant="body2" color="text.secondary">{sub}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>

      {/* ── OkraPayModal ────────────────────────────────────────────────────────
           purpose="subpay" with relatedEntityId = PENDING subscription ID.
           The backend's handleSubscriptionPaymentSuccess activates the
           pending subscription only after OkraPay confirms payment.
      ─────────────────────────────────────────────────────────────────────── */}
      {pendingPayment && (
        <OkraPayModal
          open={modalOpen}
          onClose={handleModalClose}
          amount={pendingPayment.amount}
          purpose="subpay"
          relatedEntityId={pendingPayment.subscriptionId}
          currency={currency}
          phoneCode={phoneCode}
          acceptedMobileMoneyPayments={acceptedMM}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}

      {/* ── Confirmation Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmClose}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <WarningIcon color="primary" />
          {confirmDialog.type === 'trial' ? 'Start Free Trial' : 'Confirm Subscription'}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {confirmDialog.type === 'trial' ? (
              <>
                You're about to start a{' '}
                <strong>{confirmDialog.plan?.freeTrialDays}-day free trial</strong> for{' '}
                <strong>{confirmDialog.plan?.name}</strong>.
                <br /><br />
                No payment is required now. The trial gives you full access for{' '}
                {confirmDialog.plan?.freeTrialDays} day(s).
              </>
            ) : (
              <>
                You're about to subscribe to{' '}
                <strong>{confirmDialog.plan?.name}</strong> for{' '}
                <strong>{formatCurrency(confirmDialog.plan?.price)}</strong> per{' '}
                {confirmDialog.plan?.durationType}.
                <br /><br />
                You will be taken to the payment screen to complete your purchase.
              </>
            )}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleConfirmClose}
            variant="outlined"
            disabled={confirmDialog.loading}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmProceed}
            variant="contained"
            disabled={confirmDialog.loading}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            {confirmDialog.loading
              ? <CircularProgress size={20} />
              : 'Proceed'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}