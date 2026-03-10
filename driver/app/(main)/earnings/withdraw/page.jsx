'use client';
// PATH: driver/app/(main)/earnings/withdraw/page.jsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Paper,
  TextField, Button, InputAdornment, Alert, Chip,
  List, ListItem, ListItemText, Divider, CircularProgress,
} from '@mui/material';
import {
  ArrowBack            as BackIcon,
  AccountBalanceWallet as WalletIcon,
  Lock                 as LockIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/Functions';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import OkraPayModal from '@/components/OkraPay/OkraPayModal';

// ─────────────────────────────────────────────────────────────────────────────
// All driver data comes from user.driverProfile (already populated by useAuth).
// No extra API call needed.
//
// Withdrawal is handled entirely by OkraPayModal (purpose="withdraw").
// The modal calls POST /okrapay/request-withdrawal, polls for confirmation,
// and fires onSuccess / onError when done.
// ─────────────────────────────────────────────────────────────────────────────

export default function WithdrawPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuth();

  const {
    loading:              settingsLoading,
    isWithdrawFromFloat,
    minimumWithdrawAmount,
  } = useAdminSettings();

  const [amount,    setAmount]    = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [error,     setError]     = useState(null);

  // ── Balance resolution from user.driverProfile ─────────────────────────────
  const dp = user?.driverProfile ?? {};

  // API returns "WithdrawablefloatBalance" (capital W).
  // Fall back to camelCase in case it normalises in a future Strapi version.
  const withdrawableFloatBalance =
    Number(dp.WithdrawablefloatBalance ?? dp.withdrawableFloatBalance) || 0;

  const currentBalance    = Number(dp.currentBalance)    || 0;
  const pendingWithdrawal = Number(dp.pendingWithdrawal) || 0;
  const totalFloat        = Number(dp.floatBalance)      || 0;

  // The pool configured by admin
  const availablePool    = isWithdrawFromFloat ? withdrawableFloatBalance : currentBalance;
  const availableBalance = Math.max(0, availablePool - pendingWithdrawal);

  // Promo float note for float mode
  const promoFloat = isWithdrawFromFloat
    ? Math.max(0, totalFloat - withdrawableFloatBalance)
    : 0;

  // ── Country / phone / currency from user.country ───────────────────────────
  const country    = user?.country ?? {};
  // phoneCode comes as "+260" — strip the leading +
  const phoneCode  = String(country.phoneCode  || '260').replace(/\D/g, '');
  // currency not on country object in current API — default ZMW
  const currency   = 'ZMW';
  const acceptedMM = Array.isArray(country.acceptedMobileMoneyPayments)
    ? country.acceptedMobileMoneyPayments
    : null;

  // ── Labels ─────────────────────────────────────────────────────────────────
  const balanceLabel = isWithdrawFromFloat ? 'Withdrawable Float' : 'Available Earnings';
  const poolNote     = isWithdrawFromFloat
    ? 'Float you personally topped up — promo credit excluded'
    : 'Ride earnings accumulated on the platform';

  // ── Amount validation ──────────────────────────────────────────────────────
  const numAmount   = parseFloat(amount) || 0;
  const settingsReady = !settingsLoading && minimumWithdrawAmount != null;
  const isBelowMin  = numAmount > 0 && settingsReady && numAmount < minimumWithdrawAmount;
  const isOverMax   = numAmount > availableBalance;
  const isFormValid = settingsReady && numAmount >= minimumWithdrawAmount && numAmount <= availableBalance;

  const hasNothing   = availableBalance <= 0;
  const hasTooLittle = availableBalance > 0 && settingsReady && availableBalance < minimumWithdrawAmount;

  // Quick amounts: only those within range AND above minimum
  const quickAmounts = settingsReady
    ? [100, 200, 500, 1000].filter(v => v <= availableBalance && v >= minimumWithdrawAmount)
    : [];

  const handleOpenModal = () => {
    if (!isFormValid) return;
    setError(null);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    setModalOpen(false);
    router.replace('/float?withdrawal=success');
  };

  const handleError = (err) => {
    setModalOpen(false);
    setError(err?.message || 'Withdrawal failed. Please try again.');
  };

  const isLoading = userLoading || settingsLoading;

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => router.back()}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6">Withdraw</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
          <CircularProgress />
        </Box>
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
          <Typography variant="h6" sx={{ flex: 1 }}>
            {isWithdrawFromFloat ? 'Withdraw Float' : 'Withdraw Earnings'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>

        {/* ── Balance Card ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3, mb: 3, borderRadius: 4,
              background: hasNothing || hasTooLittle
                ? 'linear-gradient(135deg, #757575 0%, #424242 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              color: 'white', textAlign: 'center',
            }}
          >
            <WalletIcon sx={{ fontSize: 44, mb: 1, opacity: 0.9 }} />
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 0.5 }}
            >
              {balanceLabel}
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", mb: 0.5 }}
            >
              {formatCurrency(availableBalance)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>{poolNote}</Typography>

            {/* Promo float note */}
            {isWithdrawFromFloat && promoFloat > 0 && (
              <Box sx={{
                mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
              }}>
                <LockIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {formatCurrency(promoFloat)} promotional float not included
                </Typography>
              </Box>
            )}

            {/* Pending deduction note */}
            {pendingWithdrawal > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {formatCurrency(pendingWithdrawal)} pending withdrawal deducted
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>

        {/* ── Blocking states ──────────────────────────────────────────────────── */}
        {hasNothing && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              No {isWithdrawFromFloat ? 'withdrawable float' : 'earnings'} available
            </Typography>
            <Typography variant="body2">
              {isWithdrawFromFloat
                ? 'Top up your float — the portion you paid in becomes withdrawable once processed.'
                : 'Complete rides to accumulate earnings you can withdraw.'}
            </Typography>
          </Alert>
        )}

        {hasTooLittle && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600}>Below minimum withdrawal</Typography>
            <Typography variant="body2">
              You have {formatCurrency(availableBalance)} but the minimum is{' '}
              {formatCurrency(minimumWithdrawAmount)}.{' '}
              {isWithdrawFromFloat
                ? 'Top up more float to reach the threshold.'
                : 'Complete more rides to reach the minimum.'}
            </Typography>
          </Alert>
        )}

        {/* ── Main form — only when there's enough balance ─────────────────────── */}
        {!hasNothing && !hasTooLittle && (
          <>
            {/* Amount Input */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Withdrawal Amount
              </Typography>

              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(null); }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">K</InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => { setAmount(availableBalance.toFixed(2)); setError(null); }}
                        sx={{ fontWeight: 700 }}
                      >
                        MAX
                      </Button>
                    </InputAdornment>
                  ),
                }}
                error={isBelowMin || isOverMax}
                helperText={
                  isBelowMin
                    ? `Minimum is ${formatCurrency(minimumWithdrawAmount)}`
                    : isOverMax
                    ? `Max available is ${formatCurrency(availableBalance)}`
                    : `Min: ${formatCurrency(minimumWithdrawAmount)} · Max: ${formatCurrency(availableBalance)}`
                }
                sx={{ mb: quickAmounts.length > 0 ? 2 : 0 }}
              />

              {quickAmounts.length > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Quick amounts:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {quickAmounts.map(v => (
                      <Chip
                        key={v}
                        label={formatCurrency(v)}
                        onClick={() => { setAmount(v.toString()); setError(null); }}
                        color={amount === v.toString() ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Paper>

            {/* Info */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Withdrawals are typically processed within 24 hours on business days.
                You'll receive an SMS once processed.
              </Typography>
            </Alert>

            {/* Error */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Summary */}
            {isFormValid && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Summary</Typography>
                <List disablePadding>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary={balanceLabel} secondary="Before withdrawal" />
                    <Typography fontWeight={600}>{formatCurrency(availableBalance)}</Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Withdrawal Amount" />
                    <Typography color="error.main" fontWeight={600}>− {formatCurrency(numAmount)}</Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Processing Fee" />
                    <Typography color="text.secondary">K 0.00</Typography>
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Remaining Balance"
                      primaryTypographyProps={{ fontWeight: 700 }}
                    />
                    <Typography fontWeight={700}>
                      {formatCurrency(availableBalance - numAmount)}
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="You'll Receive"
                      primaryTypographyProps={{ fontWeight: 700, color: 'success.main' }}
                    />
                    <Typography fontWeight={700} color="success.main" fontSize="1.1rem">
                      {formatCurrency(numAmount)}
                    </Typography>
                  </ListItem>
                </List>
              </Paper>
            )}

            {/* Submit */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={!isFormValid}
              onClick={handleOpenModal}
              sx={{ height: 56, borderRadius: 3, fontWeight: 700 }}
            >
              {isFormValid
                ? `Withdraw ${formatCurrency(numAmount)}`
                : settingsReady
                  ? `Enter an amount (min. ${formatCurrency(minimumWithdrawAmount)})`
                  : 'Loading…'}
            </Button>
          </>
        )}
      </Box>

      {/* ── OkraPayModal ────────────────────────────────────────────────────────
           purpose="withdraw" → modal calls POST /okrapay/request-withdrawal
           and handles the full polling → success/failure flow internally.
           The driver picks their mobile money number or bank account inside
           the modal — no phone number input needed on this page.
      ─────────────────────────────────────────────────────────────────────── */}
      <OkraPayModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        amount={numAmount}
        purpose="withdraw"
        currency={currency}
        phoneCode={phoneCode}
        acceptedMobileMoneyPayments={acceptedMM}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </Box>
  );
}