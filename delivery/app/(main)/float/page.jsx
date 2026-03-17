'use client';
// PATH: app/(main)/float/page.jsx — UI POLISH ONLY (logic identical to original)
import { useRouter } from 'next/navigation';
import { Box, AppBar, Toolbar, Typography, Paper, Button, IconButton, Alert, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as BackIcon, AccountBalanceWallet as WalletIcon,
  Add as AddIcon, TrendingDown as WithdrawIcon, History as HistoryIcon,
  CheckCircle as CheckIcon, Warning as WarningIcon, Lock as LockIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/Functions';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { FloatPageSkeleton } from '@/components/Skeletons/FloatPageSkeleton';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

export default function FloatPage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, loading: userLoading } = useAuth();
  const { loading: settingsLoading, paymentSystemType, isNegativeFloatAllowed, negativeFloatLimit, defaultCommissionPercentage, isWithdrawFromFloat, minimumWithdrawAmount } = useAdminSettings();

  const dp = user?.driverProfile ?? {};
  const floatBalance             = Number(dp.floatBalance) || 0;
  const withdrawableFloatBalance = Number(dp.WithdrawablefloatBalance ?? dp.withdrawableFloatBalance) || 0;
  const currentBalance           = Number(dp.currentBalance) || 0;
  const pendingWithdrawal        = Number(dp.pendingWithdrawal) || 0;
  const subscriptionStatus  = dp.subscriptionStatus;
  const isSubscriptionBased = paymentSystemType === 'subscription_based' || (paymentSystemType === 'hybrid' && ['active', 'trial'].includes(subscriptionStatus));
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

  const heroShadow = isBlocked ? alpha('#DC2626', 0.35) : isNegative ? alpha('#D97706', 0.3) : isSubscriptionBased ? alpha('#1D4ED8', 0.35) : alpha('#059669', 0.35);
  const isLoading = userLoading || settingsLoading;

  const alertVars = {
    hidden: { opacity: 0, y: -8, height: 0 },
    show:   { opacity: 1, y: 0,  height: 'auto', transition: { type: 'spring', stiffness: 300, damping: 28 } },
    exit:   { opacity: 0, y: -4, height: 0 },
  };

  const appBarBg = isDark
    ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
    : `linear-gradient(135deg, #065F46 0%, #059669 100%)`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{
        background: appBarBg,
        boxShadow: isDark ? `0 2px 16px rgba(0,0,0,0.4)` : `0 4px 20px ${alpha('#059669', 0.28)}`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Float Balance</Typography>
          <IconButton color="inherit" onClick={() => router.push('/float/transactions')}><HistoryIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 4, ...hideScrollbar }}>
        {isLoading ? <FloatPageSkeleton /> : (
          <>
            <AnimatePresence initial={false}>
              {isSubscriptionBased && floatBalance > 0 && (
                <motion.div key="sub-float" variants={alertVars} initial="hidden" animate="show" exit="exit">
                  <Alert severity="info" icon={<CheckIcon />} sx={{ mb: 1.5, borderRadius: 2.5 }}
                    action={<Button color="inherit" size="small" onClick={() => router.push('/earnings/withdraw')}>Withdraw</Button>}>
                    <Typography variant="subtitle2" fontWeight={600}>Float Available to Withdraw</Typography>
                    <Typography variant="body2">{formatCurrency(floatBalance)} — subscription plan, no commission deducted.</Typography>
                  </Alert>
                </motion.div>
              )}
              {isBlocked && isFloatBased && (
                <motion.div key="blocked" variants={alertVars} initial="hidden" animate="show" exit="exit">
                  <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 1.5, borderRadius: 2.5 }}
                    action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}>
                    <Typography variant="subtitle2" fontWeight={600}>Cash Rides Blocked</Typography>
                    <Typography variant="body2">Float: {formatCurrency(floatBalance)}.{' '}{!isNegativeFloatAllowed ? 'Negative float not allowed.' : `Exceeded limit of ${formatCurrency(-negativeFloatLimit)}.`}</Typography>
                  </Alert>
                </motion.div>
              )}
              {isNegative && !isBlocked && isFloatBased && (
                <motion.div key="neg" variants={alertVars} initial="hidden" animate="show" exit="exit">
                  <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Negative Balance</Typography>
                    <Typography variant="body2">Float: {formatCurrency(floatBalance)}.{' '}{negativeFloatLimit > 0 ? `${formatCurrency(negativeFloatLimit - Math.abs(floatBalance))} before blocked.` : 'Top up when possible.'}</Typography>
                  </Alert>
                </motion.div>
              )}
              {isWithdrawFromFloat && promoFloat > 0 && (
                <motion.div key="promo" variants={alertVars} initial="hidden" animate="show" exit="exit">
                  <Alert severity="info" icon={<LockIcon />} sx={{ mb: 1.5, borderRadius: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Promo Float Included</Typography>
                    <Typography variant="body2">{formatCurrency(promoFloat)} is promo credit. Withdrawable: {formatCurrency(withdrawableFloatBalance)}.</Typography>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hero balance */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
              <Paper elevation={0} sx={{
                p: 3.5, mb: 2, borderRadius: 4, textAlign: 'center', color: 'white',
                background: heroGrad, boxShadow: `0 12px 40px ${heroShadow}`,
                position: 'relative', overflow: 'hidden',
              }}>
                <Box sx={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <WalletIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.88 }} />
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5, fontWeight: 500 }}>Float Balance</Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", mb: 1, lineHeight: 1.1 }}>
                  {formatCurrency(floatBalance)}
                </Typography>
                {isSubscriptionBased && <Chip label="✓ Subscription — Fully Withdrawable" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'white', fontWeight: 700 }} />}
                {isBlocked && <Chip label="🚫 Blocked — Top Up Required" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />}
                {isNegative && !isBlocked && <Chip label="⚠️ Negative Balance" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />}
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.22)' }}>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>{isWithdrawFromFloat ? 'Withdrawable Float' : 'Available Earnings'}</Typography>
                  <Typography variant="h5" fontWeight={800}>{formatCurrency(availableToWithdraw)}</Typography>
                  {pendingWithdrawal > 0 && <Typography variant="caption" sx={{ opacity: 0.65, display: 'block' }}>{formatCurrency(pendingWithdrawal)} pending deducted</Typography>}
                </Box>
              </Paper>
            </motion.div>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              {isFloatBased && (
                <motion.div style={{ flex: 1 }} whileTap={{ scale: 0.97 }}>
                  <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/float/topup')}
                    sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      boxShadow: `0 4px 16px ${alpha('#10B981', 0.38)}`,
                    }}>Top Up</Button>
                </motion.div>
              )}
              {canWithdraw && (
                <motion.div style={{ flex: 1 }} whileTap={{ scale: 0.97 }}>
                  <Button fullWidth variant="contained" startIcon={<WithdrawIcon />} onClick={() => router.push('/earnings/withdraw')}
                    sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      boxShadow: `0 4px 16px ${alpha('#3B82F6', 0.38)}`,
                    }}>Withdraw</Button>
                </motion.div>
              )}
            </Box>

            {/* Balance details */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Paper elevation={0} sx={{
                p: 2.5, borderRadius: 3, mb: 2,
                border: `1px solid ${alpha(isDark ? '#fff' : '#000', isDark ? 0.08 : 0.07)}`,
                boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.06)',
              }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Balance Details</Typography>
                <List disablePadding dense>
                  {[
                    { primary: 'Float Balance',          secondary: 'Total incl. promo credit',   value: formatCurrency(floatBalance),            color: isNegative ? 'error.main' : 'success.main' },
                    isWithdrawFromFloat && { primary: 'Withdrawable Float', secondary: 'Your deposits — can withdraw', value: formatCurrency(withdrawableFloatBalance), color: 'success.main' },
                    isWithdrawFromFloat && promoFloat > 0 && { primary: 'Promo Float',  secondary: 'Non-withdrawable',         value: formatCurrency(promoFloat),              color: 'text.disabled' },
                    !isWithdrawFromFloat && { primary: 'Earnings Balance',  secondary: 'From completed rides',      value: formatCurrency(currentBalance),          color: currentBalance > 0 ? 'success.main' : 'text.secondary' },
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

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
              <Button fullWidth variant="outlined" startIcon={<HistoryIcon />} onClick={() => router.push('/float/transactions')}
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