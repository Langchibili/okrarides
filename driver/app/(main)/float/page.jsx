// 'use client';
// // PATH: driver/app/(main)/float/page.jsx

// import { useRouter } from 'next/navigation';
// import {
//   Box, AppBar, Toolbar, Typography, Paper, Button, IconButton,
//   Alert, List, ListItem, ListItemText, Divider, Chip, CircularProgress,
// } from '@mui/material';
// import {
//   ArrowBack            as BackIcon,
//   AccountBalanceWallet as WalletIcon,
//   Add                  as AddIcon,
//   TrendingDown         as WithdrawIcon,
//   History              as HistoryIcon,
//   Info                 as InfoIcon,
//   CheckCircle          as CheckIcon,
//   Warning              as WarningIcon,
//   Lock                 as LockIcon,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { formatCurrency } from '@/Functions';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

// // ─── NOTE on WithdrawablefloatBalance ────────────────────────────────────────
// // The Strapi component schema field is stored as "WithdrawablefloatBalance"
// // (capital W) in the DB. We read both casings for safety.
// // ─────────────────────────────────────────────────────────────────────────────

// export default function FloatPage() {
//   const router = useRouter();
//   const { user, loading: userLoading } = useAuth();

//   const {
//     loading:                    settingsLoading,
//     refresh:                    refreshSettings,
//     // payment system
//     paymentSystemType,
//     isFloatSystemEnabled,
//     isSubscriptionSystemEnabled,
//     // float rules
//     isNegativeFloatAllowed,
//     negativeFloatLimit,
//     defaultCommissionPercentage,
//     // withdrawal
//     isWithdrawFromFloat,
//     minimumWithdrawAmount,
//   } = useAdminSettings();

 
//   // ── Derive everything from user.driverProfile ──────────────────────────────
//   const dp = user?.driverProfile ?? {};

//   const floatBalance = Number(dp.floatBalance) || 0;

//   // Field name has capital W in actual API response: "WithdrawablefloatBalance"
//   // Fall back to camelCase in case it gets normalised later.
//   const withdrawableFloatBalance =
//     Number(dp.WithdrawablefloatBalance ?? dp.withdrawableFloatBalance) || 0;

//   const currentBalance    = Number(dp.currentBalance)    || 0;
//   const pendingWithdrawal = Number(dp.pendingWithdrawal) || 0;

//   // ── Subscription status from driverProfile ────────────────────────────────
//   const subscriptionStatus = dp.subscriptionStatus;
//   const isSubscriptionBased =
//     paymentSystemType === 'subscription_based' ||
//     (paymentSystemType === 'hybrid' &&
//       ['active', 'trial'].includes(subscriptionStatus));
//   const isFloatBased = !isSubscriptionBased;

//   // ── Balance maths ──────────────────────────────────────────────────────────
//   const withdrawablePool    = isWithdrawFromFloat ? withdrawableFloatBalance : currentBalance;
//   const availableToWithdraw = Math.max(0, withdrawablePool - pendingWithdrawal);

//   // Promo float = gap between total float and driver-funded portion.
//   // Only meaningful in float mode; ignored in earnings mode.
//   const promoFloat = isWithdrawFromFloat
//     ? Math.max(0, floatBalance - withdrawableFloatBalance)
//     : 0;

//   // Wait until settings have loaded before evaluating the minimum
//   const settingsReady = !settingsLoading && minimumWithdrawAmount != null;
//   const canWithdraw   = settingsReady && availableToWithdraw >= minimumWithdrawAmount;

//   // ── Float health ───────────────────────────────────────────────────────────
//   const isNegative = floatBalance < 0;
//   const isBlocked  =
//     isNegative &&
//     (!isNegativeFloatAllowed ||
//       (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit));

//   // ── Visuals ────────────────────────────────────────────────────────────────
//   const cardGradient = isBlocked
//     ? 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)'
//     : isNegative
//     ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
//     : isSubscriptionBased
//     ? 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)'
//     : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';

//   const commissionRate   = defaultCommissionPercentage;
//   const exampleFare      = 100;
//   const exampleComm      = exampleFare * (commissionRate / 100);
//   const exampleDeduction = exampleFare + exampleComm;

//   const isLoading = userLoading || settingsLoading;

//   // ─────────────────────────────────────────────────────────────────────────
//  return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>

//       {/* ── App Bar ─────────────────────────────────────────────────────────── */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
//             <BackIcon />
//           </IconButton>
//           <Typography variant="h6" sx={{ flex: 1 }}>Float Balance</Typography>
//           <IconButton color="inherit" onClick={() => router.push('/float/transactions')}>
//             <HistoryIcon />
//           </IconButton>
//         </Toolbar>
//       </AppBar>

//       {isLoading ? (
//         <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
//           <CircularProgress />
//         </Box>
//       ) : (
//         <Box sx={{ p: 3 }}>

//           {/* ── Alerts ──────────────────────────────────────────────────────── */}

//           {/* Subscription plan */}
//           {isSubscriptionBased && floatBalance > 0 && (
//             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity="info" icon={<CheckIcon />} sx={{ mb: 2 }}
//                 action={
//                   <Button color="inherit" size="small" onClick={() => router.push('/earnings/withdraw')}>
//                     Withdraw
//                   </Button>
//                 }
//               >
//                 <Typography variant="subtitle2" fontWeight={600}>
//                   Your Float is Available to Withdraw
//                 </Typography>
//                 <Typography variant="body2">
//                   You are on a subscription plan — no commission deducted.
//                   Your full balance of {formatCurrency(floatBalance)} can be withdrawn.
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* Float blocked */}
//           {isBlocked && isFloatBased && (
//             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert
//                 severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}
//                 action={
//                   <Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>
//                     Top Up
//                   </Button>
//                 }
//               >
//                 <Typography variant="subtitle2" fontWeight={600}>Cash Rides Blocked</Typography>
//                 <Typography variant="body2">
//                   Your float is {formatCurrency(floatBalance)}.{' '}
//                   {!isNegativeFloatAllowed
//                     ? 'Negative float is not allowed. Top up to accept rides.'
//                     : `You have exceeded the negative limit of ${formatCurrency(-negativeFloatLimit)}.`}
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* Negative but within limit */}
//           {isNegative && !isBlocked && isFloatBased && (
//             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert severity="warning" sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" fontWeight={600}>Negative Float Balance</Typography>
//                 <Typography variant="body2">
//                   Your float is {formatCurrency(floatBalance)}.{' '}
//                   {negativeFloatLimit > 0
//                     ? `You have ${formatCurrency(negativeFloatLimit - Math.abs(floatBalance))} remaining before you are blocked.`
//                     : 'Top up when you can.'}
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* Promo float present — only shown in float withdrawal mode */}
//           {isWithdrawFromFloat && promoFloat > 0 && (
//             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" fontWeight={600}>Promotional Float Included</Typography>
//                 <Typography variant="body2">
//                   {formatCurrency(promoFloat)} of your float was added as a promotion and cannot be
//                   withdrawn — it can still be used for cash rides. Your withdrawable portion is{' '}
//                   {formatCurrency(withdrawableFloatBalance)}.
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* Below minimum */}
//           {settingsReady && !canWithdraw && availableToWithdraw > 0 && (
//             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//               <Alert severity="info" sx={{ mb: 2 }}>
//                 <Typography variant="body2">
//                   Minimum withdrawal is {formatCurrency(minimumWithdrawAmount)}.
//                   You currently have {formatCurrency(availableToWithdraw)} available.
//                 </Typography>
//               </Alert>
//             </motion.div>
//           )}

//           {/* ── Balance Card ─────────────────────────────────────────────────── */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//             <Paper
//               elevation={3}
//               sx={{ p: 4, mb: 3, borderRadius: 4, background: cardGradient, color: 'white', textAlign: 'center' }}
//             >
//               <WalletIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
//               <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Float Balance</Typography>
//               <Typography
//                 variant="h2"
//                 sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", mb: 1 }}
//               >
//                 {formatCurrency(floatBalance)}
//               </Typography>

//               {isSubscriptionBased ? (
//                 <Chip label="✓ Subscription Plan — Fully Withdrawable" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 600 }} />
//               ) : isBlocked ? (
//                 <Chip label="🚫 Rides Blocked — Top Up Required" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
//               ) : isNegative ? (
//                 <Chip label="⚠️ Negative Balance" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
//               ) : null}

//               {/* Withdrawable sub-section */}
//               <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
//                 <Typography variant="caption" sx={{ opacity: 0.8 }}>
//                   {isWithdrawFromFloat ? 'Withdrawable Float' : 'Available Earnings'}
//                 </Typography>
//                 <Typography variant="h5" fontWeight={700}>
//                   {formatCurrency(availableToWithdraw)}
//                 </Typography>
//                 {pendingWithdrawal > 0 && (
//                   <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
//                     {formatCurrency(pendingWithdrawal)} pending withdrawal deducted
//                   </Typography>
//                 )}
//                 {settingsReady && !canWithdraw && availableToWithdraw > 0 && (
//                   <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
//                     Min. withdrawal: {formatCurrency(minimumWithdrawAmount)}
//                   </Typography>
//                 )}
//               </Box>
//             </Paper>
//           </motion.div>

//           {/* ── Quick Actions ─────────────────────────────────────────────────── */}
//           <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
//             {isFloatBased && (
//               <Button
//                 fullWidth variant="contained" size="large" startIcon={<AddIcon />}
//                 onClick={() => router.push('/float/topup')}
//                 sx={{ height: 56, borderRadius: 3, fontWeight: 600, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
//               >
//                 Top Up Float
//               </Button>
//             )}
//             {canWithdraw && (
//               <Button
//                 fullWidth
//                 variant={isSubscriptionBased ? 'contained' : 'outlined'}
//                 size="large"
//                 startIcon={<WithdrawIcon />}
//                 onClick={() => router.push('/earnings/withdraw')}
//                 sx={{
//                   height: 56, borderRadius: 3, fontWeight: 600,
//                   ...(isSubscriptionBased && { bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }),
//                 }}
//               >
//                 Withdraw
//               </Button>
//             )}
//           </Box>

//           {/* ── Balance Details ───────────────────────────────────────────────── */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
//             <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Balance Details</Typography>
//             <List disablePadding>

//               <ListItem sx={{ px: 0 }}>
//                 <ListItemText primary="Float Balance" secondary="Total float including any promotional credit" />
//                 <Typography fontWeight={600} color={isNegative ? 'error.main' : 'success.main'}>
//                   {formatCurrency(floatBalance)}
//                 </Typography>
//               </ListItem>

//               {/* Float mode — show withdrawable vs promo breakdown */}
//               {isWithdrawFromFloat && (
//                 <>
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText
//                       primary="Withdrawable Float"
//                       secondary="Your own top-up deposits — can be withdrawn"
//                     />
//                     <Typography fontWeight={600} color="success.main">
//                       {formatCurrency(withdrawableFloatBalance)}
//                     </Typography>
//                   </ListItem>

//                   {promoFloat > 0 && (
//                     <ListItem sx={{ px: 0 }}>
//                       <ListItemText
//                         primary="Promotional Float"
//                         secondary="Added by OkraRides — usable for rides, not withdrawable"
//                       />
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                         <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
//                         <Typography color="text.secondary">{formatCurrency(promoFloat)}</Typography>
//                       </Box>
//                     </ListItem>
//                   )}
//                 </>
//               )}

//               {/* Earnings mode */}
//               {!isWithdrawFromFloat && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Earnings Balance" secondary="Accumulated from completed rides" />
//                   <Typography fontWeight={600} color={currentBalance > 0 ? 'success.main' : 'text.secondary'}>
//                     {formatCurrency(currentBalance)}
//                   </Typography>
//                 </ListItem>
//               )}

//               <ListItem sx={{ px: 0 }}>
//                 <ListItemText
//                   primary="Available to Withdraw"
//                   secondary={
//                     settingsReady
//                       ? `Min. ${formatCurrency(minimumWithdrawAmount)} per request`
//                       : 'Loading settings…'
//                   }
//                 />
//                 <Typography fontWeight={600} color={canWithdraw ? 'success.main' : 'text.secondary'}>
//                   {formatCurrency(availableToWithdraw)}
//                 </Typography>
//               </ListItem>

//               {pendingWithdrawal > 0 && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Pending Withdrawal" secondary="Being processed" />
//                   <Typography color="warning.main">{formatCurrency(pendingWithdrawal)}</Typography>
//                 </ListItem>
//               )}

//               <Divider sx={{ my: 1.5 }} />

//               {isFloatBased && (
//                 <>
//                   {isNegativeFloatAllowed && negativeFloatLimit > 0 && (
//                     <ListItem sx={{ px: 0 }}>
//                       <ListItemText primary="Negative Balance Limit" secondary="How far below zero you can go" />
//                       <Typography color="error.main">{formatCurrency(-negativeFloatLimit)}</Typography>
//                     </ListItem>
//                   )}
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText primary="Commission Rate" secondary="Deducted from float per cash ride" />
//                     <Typography fontWeight={600}>{commissionRate}%</Typography>
//                   </ListItem>
//                 </>
//               )}

//               {isSubscriptionBased && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Commission Rate" secondary="You are on a subscription plan" />
//                   <Chip label="0% — Free" color="success" size="small" sx={{ fontWeight: 700 }} />
//                 </ListItem>
//               )}

//               <Divider sx={{ my: 1.5 }} />

//               <ListItem sx={{ px: 0 }}>
//                 <ListItemText primary="Total Earnings" secondary="All-time from completed rides" />
//                 <Typography>{formatCurrency(dp.totalEarnings || 0)}</Typography>
//               </ListItem>

//               {isFloatBased && (
//                 <ListItem sx={{ px: 0 }}>
//                   <ListItemText primary="Commission Rate" secondary="Current setting" />
//                   <Typography>{commissionRate}%</Typography>
//                 </ListItem>
//               )}
//             </List>
//           </Paper>

//           {/* ── How It Works ──────────────────────────────────────────────────── */}
//           <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
//             <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
//               <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
//               {isSubscriptionBased ? 'About Your Float' : 'How the Float System Works'}
//             </Typography>

//             {isSubscriptionBased ? (
//               <>
//                 <Typography variant="body2" color="text.secondary" paragraph>
//                   You are on a subscription plan. Your float works differently:
//                 </Typography>
//                 <List dense>
//                   <ListItem><ListItemText primary="• No commission is deducted from your float — you keep 100% of your earnings." /></ListItem>
//                   <ListItem><ListItemText primary="• Your float balance is simply money you deposited that can be withdrawn at any time." /></ListItem>
//                   <ListItem><ListItemText primary="• Use the Withdraw button above to get your float back." /></ListItem>
//                 </List>
//               </>
//             ) : (
//               <>
//                 <Typography variant="body2" color="text.secondary" paragraph>
//                   The float is your pre-paid balance used to settle platform commissions on cash rides.
//                 </Typography>
//                 <List dense>
//                   <ListItem>
//                     <ListItemText
//                       primary="• When you complete a cash ride, the platform deducts: fare + commission from your float."
//                       secondary={`Example: K${exampleFare} ride at ${commissionRate}% = K${exampleDeduction} deducted (K${exampleFare} + K${exampleComm}).`}
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemText primary="• For digital (OkraPay) rides, commission is settled digitally — no float deduction." />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemText primary="• Top up your float to keep accepting cash rides." />
//                   </ListItem>
//                   {isNegativeFloatAllowed && negativeFloatLimit > 0 && (
//                     <ListItem>
//                       <ListItemText primary={`• You can go negative up to ${formatCurrency(-negativeFloatLimit)} before cash rides are blocked.`} />
//                     </ListItem>
//                   )}
//                   {isWithdrawFromFloat ? (
//                     <>
//                       <ListItem>
//                         <ListItemText
//                           primary="• Only float you personally topped up can be withdrawn."
//                           secondary="Promotional float added by OkraRides cannot be withdrawn but can be used for rides."
//                         />
//                       </ListItem>
//                       {settingsReady && (
//                         <ListItem>
//                           <ListItemText primary={`• Minimum withdrawal is ${formatCurrency(minimumWithdrawAmount)}.`} />
//                         </ListItem>
//                       )}
//                     </>
//                   ) : (
//                     <ListItem>
//                       <ListItemText
//                         primary="• Withdrawals come from your ride earnings balance, not your float."
//                         secondary={settingsReady ? `Minimum withdrawal: ${formatCurrency(minimumWithdrawAmount)}.` : ''}
//                       />
//                     </ListItem>
//                   )}
//                 </List>

//                 <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: 'grey.100', border: '1px solid', borderColor: 'grey.300' }}>
//                   <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
//                     Example deduction for a K{exampleFare} cash ride:
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     Float before: K200 &nbsp;→&nbsp;
//                     Deduction: K{exampleFare} + K{exampleComm} = K{exampleDeduction} &nbsp;→&nbsp;
//                     Float after: K{200 - exampleDeduction}
//                   </Typography>
//                 </Box>
//               </>
//             )}

//             <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
//               {isFloatBased && (
//                 <Button variant="outlined" fullWidth onClick={() => router.push('/float/topup')}>
//                   Top Up Float
//                 </Button>
//               )}
//               <Button variant="outlined" fullWidth onClick={() => router.push('/float/transactions')}>
//                 Transaction History
//               </Button>
//             </Box>
//           </Paper>

//         </Box>
//       )}
//     </Box>
//   );
// }
// PATH: app/(main)/float/page.jsx
'use client';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Paper, Button, IconButton,
  Alert, List, ListItem, ListItemText, Divider, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as BackIcon, AccountBalanceWallet as WalletIcon,
  Add as AddIcon, TrendingDown as WithdrawIcon,
  History as HistoryIcon, Info as InfoIcon,
  CheckCircle as CheckIcon, Warning as WarningIcon, Lock as LockIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/Functions';
import { useAuth }         from '@/lib/hooks/useAuth';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { FloatPageSkeleton } from '@/components/Skeletons/FloatPageSkeleton';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

export default function FloatPage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, loading: userLoading } = useAuth();

  const {
    loading: settingsLoading, paymentSystemType,
    isNegativeFloatAllowed, negativeFloatLimit, defaultCommissionPercentage,
    isWithdrawFromFloat, minimumWithdrawAmount,
  } = useAdminSettings();

  const dp = user?.driverProfile ?? {};
  const floatBalance             = Number(dp.floatBalance) || 0;
  const withdrawableFloatBalance = Number(dp.WithdrawablefloatBalance ?? dp.withdrawableFloatBalance) || 0;
  const currentBalance           = Number(dp.currentBalance) || 0;
  const pendingWithdrawal        = Number(dp.pendingWithdrawal) || 0;

  const subscriptionStatus  = dp.subscriptionStatus;
  const isSubscriptionBased = paymentSystemType === 'subscription_based' ||
    (paymentSystemType === 'hybrid' && ['active', 'trial'].includes(subscriptionStatus));
  const isFloatBased = !isSubscriptionBased;

  const withdrawablePool    = isWithdrawFromFloat ? withdrawableFloatBalance : currentBalance;
  const availableToWithdraw = Math.max(0, withdrawablePool - pendingWithdrawal);
  const promoFloat          = isWithdrawFromFloat ? Math.max(0, floatBalance - withdrawableFloatBalance) : 0;
  const settingsReady       = !settingsLoading && minimumWithdrawAmount != null;
  const canWithdraw         = settingsReady && availableToWithdraw >= minimumWithdrawAmount;

  const isNegative = floatBalance < 0;
  const isBlocked  = isNegative && (!isNegativeFloatAllowed || (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit));

  const heroGrad = isBlocked
    ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
    : isNegative
    ? 'linear-gradient(135deg, #D97706 0%, #92400E 100%)'
    : isSubscriptionBased
    ? 'linear-gradient(135deg, #1D4ED8 0%, #1E3A8A 100%)'
    : 'linear-gradient(135deg, #059669 0%, #065F46 100%)';

  const heroShadow = isBlocked
    ? alpha('#DC2626', 0.35)
    : isNegative
    ? alpha('#D97706', 0.3)
    : isSubscriptionBased
    ? alpha('#1D4ED8', 0.35)
    : alpha('#059669', 0.35);

  const isLoading = userLoading || settingsLoading;

  const alertVars = {
    hidden: { opacity: 0, y: -8, height: 0 },
    show:   { opacity: 1, y: 0,  height: 'auto', transition: { type: 'spring', stiffness: 300, damping: 28 } },
    exit:   { opacity: 0, y: -4, height: 0 },
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1E293B', 0.98)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Float Balance</Typography>
          <IconButton color="inherit" onClick={() => router.push('/float/transactions')}><HistoryIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 4, ...hideScrollbar }}>
        {isLoading ? (
          <FloatPageSkeleton />
        ) : (
          <>
            {/* ── Alerts ──────────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
              {isSubscriptionBased && floatBalance > 0 && (
                <motion.div key="sub-float" variants={alertVars} initial="hidden" animate="show" exit="exit">
                  <Alert severity="info" icon={<CheckIcon />} sx={{ mb: 1.5, borderRadius: 2 }}
                    action={<Button color="inherit" size="small" onClick={() => router.push('/earnings/withdraw')}>Withdraw</Button>}>
                    <Typography variant="subtitle2" fontWeight={600}>Float Available to Withdraw</Typography>
                    <Typography variant="body2">{formatCurrency(floatBalance)} — subscription plan, no commission deducted.</Typography>
                  </Alert>
                </motion.div>
              )}
              {isBlocked && isFloatBased && (
                <motion.div key="blocked" variants={alertVars} initial="hidden" animate="show" exit="exit">
                  <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 1.5, borderRadius: 2 }}
                    action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}>
                    <Typography variant="subtitle2" fontWeight={600}>Cash Rides Blocked</Typography>
                    <Typography variant="body2">Float: {formatCurrency(floatBalance)}.{' '}
                      {!isNegativeFloatAllowed ? 'Negative float not allowed.' : `Exceeded limit of ${formatCurrency(-negativeFloatLimit)}.`}
                    </Typography>
                  </Alert>
                </motion.div>
              )}
              {isNegative && !isBlocked && isFloatBased && (
                <motion.div key="neg" variants={alertVars} initial="hidden" animate="show" exit="exit">
                  <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Negative Balance</Typography>
                    <Typography variant="body2">Float: {formatCurrency(floatBalance)}.{' '}
                      {negativeFloatLimit > 0 ? `${formatCurrency(negativeFloatLimit - Math.abs(floatBalance))} before blocked.` : 'Top up when possible.'}
                    </Typography>
                  </Alert>
                </motion.div>
              )}
              {isWithdrawFromFloat && promoFloat > 0 && (
                <motion.div key="promo" variants={alertVars} initial="hidden" animate="show" exit="exit">
                  <Alert severity="info" icon={<LockIcon />} sx={{ mb: 1.5, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Promo Float Included</Typography>
                    <Typography variant="body2">{formatCurrency(promoFloat)} is promo credit (not withdrawable). Withdrawable: {formatCurrency(withdrawableFloatBalance)}.</Typography>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Hero balance card ────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
              <Paper elevation={0} sx={{
                p: 3.5, mb: 2, borderRadius: 4, textAlign: 'center', color: 'white',
                background: heroGrad,
                boxShadow: `0 12px 40px ${heroShadow}`,
                position: 'relative', overflow: 'hidden',
              }}>
                <Box sx={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <WalletIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.88 }} />
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Float Balance</Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", mb: 1, lineHeight: 1.1 }}>
                  {formatCurrency(floatBalance)}
                </Typography>

                {isSubscriptionBased && (
                  <Chip label="✓ Subscription — Fully Withdrawable" size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'white', fontWeight: 700 }} />
                )}
                {isBlocked && <Chip label="🚫 Blocked — Top Up Required" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />}
                {isNegative && !isBlocked && <Chip label="⚠️ Negative Balance" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />}

                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.22)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    {isWithdrawFromFloat ? 'Withdrawable Float' : 'Available Earnings'}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>{formatCurrency(availableToWithdraw)}</Typography>
                  {pendingWithdrawal > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.65, display: 'block' }}>
                      {formatCurrency(pendingWithdrawal)} pending deducted
                    </Typography>
                  )}
                </Box>
              </Paper>
            </motion.div>

            {/* ── Quick actions ────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              {isFloatBased && (
                <motion.div style={{ flex: 1 }} whileTap={{ scale: 0.97 }}>
                  <Button fullWidth variant="contained" startIcon={<AddIcon />}
                    onClick={() => router.push('/float/topup')}
                    sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      boxShadow: `0 4px 16px ${alpha('#10B981', 0.35)}` }}>
                    Top Up
                  </Button>
                </motion.div>
              )}
              {canWithdraw && (
                <motion.div style={{ flex: 1 }} whileTap={{ scale: 0.97 }}>
                  <Button fullWidth variant="contained" startIcon={<WithdrawIcon />}
                    onClick={() => router.push('/earnings/withdraw')}
                    sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      boxShadow: `0 4px 16px ${alpha('#3B82F6', 0.35)}` }}>
                    Withdraw
                  </Button>
                </motion.div>
              )}
            </Box>

            {/* ── Balance details ──────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Paper elevation={isDark ? 0 : 2} sx={{
                p: 2.5, borderRadius: 3, mb: 2,
                border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.08)}`,
              }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Balance Details</Typography>
                <List disablePadding dense>
                  {[
                    { primary: 'Float Balance', secondary: 'Total incl. promo credit', value: formatCurrency(floatBalance), color: isNegative ? 'error.main' : 'success.main' },
                    isWithdrawFromFloat && { primary: 'Withdrawable Float', secondary: 'Your deposits — can withdraw', value: formatCurrency(withdrawableFloatBalance), color: 'success.main' },
                    isWithdrawFromFloat && promoFloat > 0 && { primary: 'Promo Float', secondary: 'Non-withdrawable', value: formatCurrency(promoFloat), color: 'text.disabled' },
                    !isWithdrawFromFloat && { primary: 'Earnings Balance', secondary: 'From completed rides', value: formatCurrency(currentBalance), color: currentBalance > 0 ? 'success.main' : 'text.secondary' },
                    { primary: 'Available to Withdraw', secondary: settingsReady ? `Min. ${formatCurrency(minimumWithdrawAmount)}` : '…', value: formatCurrency(availableToWithdraw), color: canWithdraw ? 'success.main' : 'text.secondary' },
                    pendingWithdrawal > 0 && { primary: 'Pending Withdrawal', secondary: 'Being processed', value: formatCurrency(pendingWithdrawal), color: 'warning.main' },
                    isFloatBased && { primary: 'Commission Rate', secondary: 'Per cash ride', value: `${defaultCommissionPercentage}%`, color: 'text.primary' },
                    isSubscriptionBased && { primary: 'Commission Rate', secondary: 'Subscription plan', value: null, chip: <Chip label="0% — Free" color="success" size="small" sx={{ fontWeight: 700 }} /> },
                  ].filter(Boolean).map((row, i, arr) => (
                    <Box key={row.primary}>
                      <ListItem sx={{ px: 0, py: 0.9 }}>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{row.primary}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{row.secondary}</Typography>}
                        />
                        {row.chip ?? <Typography variant="body2" fontWeight={700} sx={{ color: row.color }}>{row.value}</Typography>}
                      </ListItem>
                      {i < arr.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Paper>
            </motion.div>

            {/* ── Transaction history link ─────────────────────────────── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
              <Button fullWidth variant="outlined" startIcon={<HistoryIcon />}
                onClick={() => router.push('/float/transactions')}
                sx={{ height: 48, borderRadius: 3, fontWeight: 600, textTransform: 'none' }}>
                Transaction History
              </Button>
            </motion.div>
          </>
        )}
      </Box>
    </Box>
  );
}