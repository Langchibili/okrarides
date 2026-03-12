//Okrarides\driver\app\(main)\float\topup\page.jsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Paper, TextField, Button,
  IconButton, InputAdornment, Alert, Chip,
} from '@mui/material';
import { ArrowBack as BackIcon, Add as AddIcon } from '@mui/icons-material';
import { formatCurrency } from '@/Functions';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import OkraPayModal from '@/components/OkraPay/OkraPayModal';
import { useAuth } from '@/lib/hooks/useAuth';
import { createFloatTopupIntent } from '@/lib/api/float';
/**
 * NOTE on `createFloatTopupIntent`:
 *   This is a thin wrapper that calls POST /float-topup with { amount }
 *   and returns { id } — the float-topup record ID used as relatedEntityId
 *   in the OkraPay payment.  It does NOT initiate payment itself.
 *
 *   If you still have the old `topupFloat(amount, method)` that returns
 *   a paymentUrl, replace it with this lighter version that just creates
 *   the intent record, e.g.:
 *
 *     export async function createFloatTopupIntent(amount) {
 *       return apiClient.post('/float-topups', { data: { amount } });
 *     }
 */

export default function FloatTopupPage() {
  const router = useRouter();
  const {
    isOkrapayEnabled,
    allowFloatTopUpWithOkraPay,
    minimumFloatTopup,
    maximumFloatTopup,
  } = useAdminSettings();

  const [amount,    setAmount]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [topupId,   setTopupId]   = useState(null);
  const { user } = useAuth();

  // ── Derive country / currency / operators from the already-loaded user ──────
  // user.country is populated by useAuth — no extra API call needed.
  const userCountry = user?.country;
  const phoneCode   = String(userCountry?.phoneCode  || '260').replace(/\D/g, '');
  const currency    = (userCountry?.currency?.code   || 'ZMW').toUpperCase();
  const acceptedMM  = Array.isArray(userCountry?.acceptedMobileMoneyPayments)
    ? userCountry.acceptedMobileMoneyPayments
    : null;

  const quickAmounts = [50, 100, 200, 500];

  const minTopup = minimumFloatTopup || 10;
  const maxTopup = maximumFloatTopup || 1000;

  const okrapayAvailable = isOkrapayEnabled && allowFloatTopUpWithOkraPay;
  const numAmount        = parseFloat(amount) || 0;

  const handleQuickAmount = value => setAmount(value.toString());

  // ── Step 1: validate amount then create the DB intent record ─────────────
  const handleOpenPayment = async () => {
    if (numAmount < minTopup) {
      setError(`Minimum top-up amount is ${formatCurrency(minTopup)}`);
      return;
    }
    if (numAmount > maxTopup) {
      setError(`Maximum top-up amount is ${formatCurrency(maxTopup)}`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create the float-topup intent record so we have an ID to pass
      // to OkraPay as relatedEntityId.
      const paymentMethod = okrapayAvailable ? 'okrapay' : 'cash';
      const res = await createFloatTopupIntent(numAmount, user, paymentMethod);
      const id  = res?.data?.id ?? res?.id;

      if (!id) throw new Error('Could not create top-up record');

      setTopupId(id);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to start top-up');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OkraPayModal calls /okrapay/initiate and handles the rest ─────
  const handlePaymentSuccess = () => {
    setModalOpen(false);
    router.push('/float?topup=success');
  };

  const handlePaymentError = (err) => {
    setModalOpen(false);
    setError(err?.message || 'Payment failed');
  };

  return (
    <Box sx={{ minHeight:'100vh', bgcolor:'background.default', pb:10 }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex:1 }}>Top Up Float</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p:3 }}>
        {/* ── Amount ──────────────────────────────────────────────────────── */}
        <Paper elevation={2} sx={{ p:3, borderRadius:3, mb:3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb:2 }}>Enter Amount</Typography>
          <TextField
            fullWidth
            label="Top-up Amount"
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(null); }}
            InputProps={{
              startAdornment:<InputAdornment position="start">K</InputAdornment>,
            }}
            helperText={`Min: ${formatCurrency(minTopup)} · Max: ${formatCurrency(maxTopup)}`}
            sx={{ mb:2 }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb:1 }}>
            Quick amounts:
          </Typography>
          <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
            {quickAmounts.map(v => (
              <Chip
                key={v}
                label={formatCurrency(v)}
                onClick={() => { handleQuickAmount(v); setError(null); }}
                sx={{
                  cursor:'pointer', fontWeight:600,
                  bgcolor: amount === v.toString() ? 'primary.main' : undefined,
                  color:   amount === v.toString() ? '#fff'          : undefined,
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* ── Info ────────────────────────────────────────────────────────── */}
        {!okrapayAvailable && (
          <Alert severity="info" sx={{ mb:3 }}>
            Online payment is currently unavailable. Please contact support.
          </Alert>
        )}

        <Alert severity="info" sx={{ mb:3 }}>
          <Typography variant="body2">
            The amount will be added to your float balance after successful payment.
            Commission from cash rides will be deducted from your float.
          </Typography>
        </Alert>

        {error && <Alert severity="error" sx={{ mb:3 }}>{error}</Alert>}

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || !numAmount || !okrapayAvailable}
          onClick={handleOpenPayment}
          startIcon={loading ? <span /> : <AddIcon />}
          sx={{ height:56, borderRadius:3, fontWeight:700 }}
        >
          {loading ? 'Preparing…' : `Top Up ${formatCurrency(numAmount || 0)}`}
        </Button>
      </Box>

      {/* ── OkraPayModal ────────────────────────────────────────────────────── */}
      <OkraPayModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        amount={numAmount}
        purpose="floatadd"
        relatedEntityId={topupId}
        currency={currency}
        phoneCode={phoneCode}
        acceptedMobileMoneyPayments={acceptedMM}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </Box>
  );
}