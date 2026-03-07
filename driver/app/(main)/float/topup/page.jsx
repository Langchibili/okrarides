'use client';
// PATH: driver/app/(main)/float/topup/page.jsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Paper, TextField, Button,
  IconButton, InputAdornment, Alert, Radio, RadioGroup,
  FormControlLabel, FormControl, Chip,
} from '@mui/material';
import { ArrowBack as BackIcon, Add as AddIcon } from '@mui/icons-material';
import { formatCurrency } from '@/Functions';
import { topupFloat } from '@/Functions';
import { useDriver } from '@/lib/hooks/useDriver';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

export default function FloatTopupPage() {
  const router = useRouter();
  const { adminSettings } = useDriver();
  const {
    isOkrapayEnabled,
    allowFloatTopUpWithOkraPay,
    minimumFloatTopup,
    maximumFloatTopup,
  } = useAdminSettings();

  const [amount, setAmount]               = useState('');
  const [paymentMethod, setPaymentMethod] = useState('okrapay');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const quickAmounts = [50, 100, 200, 500];

  const minTopup = minimumFloatTopup || adminSettings?.minimumFloatTopup || 10;
  const maxTopup = maximumFloatTopup || adminSettings?.maximumFloatTopup || 1000;

  // OkraPay is available for float top-up only when BOTH flags are on
  const okrapayAvailable = isOkrapayEnabled && allowFloatTopUpWithOkraPay;

  const handleQuickAmount = (value) => setAmount(value.toString());

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount < minTopup) {
      setError(`Minimum top-up amount is ${formatCurrency(minTopup)}`);
      return;
    }
    if (numAmount > maxTopup) {
      setError(`Maximum top-up amount is ${formatCurrency(maxTopup)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await topupFloat(numAmount, paymentMethod);

      if (response.success) {
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else if (response.data?.gatewayConfig && window.LencoPay) {
          // Handle Lenco inline widget
          window.LencoPay.getPaid({
            ...response.data.gatewayConfig,
            onSuccess: () => router.push('/float?topup=success'),
            onClose:   () => setLoading(false),
          });
        } else {
          router.push('/float');
        }
      } else {
        setError(response.error || 'Failed to initiate top-up');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>Top Up Float</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>

          {/* Amount Input */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Enter Amount</Typography>
            <TextField
              fullWidth
              label="Top-up Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">K</InputAdornment>,
              }}
              helperText={`Min: ${formatCurrency(minTopup)} • Max: ${formatCurrency(maxTopup)}`}
              sx={{ mb: 2 }}
              required
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Quick Amounts:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {quickAmounts.map((value) => (
                <Chip
                  key={value}
                  label={formatCurrency(value)}
                  onClick={() => handleQuickAmount(value)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    bgcolor: amount === value.toString() ? 'primary.main' : 'default',
                    color:   amount === value.toString() ? 'white' : 'inherit',
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* Payment Method — only show OkraPay if the flag is on */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Payment Method</Typography>

            {!okrapayAvailable && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Online payment is currently unavailable. Please use cash or contact support.
              </Alert>
            )}

            {okrapayAvailable && (
              <FormControl component="fieldset">
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel
                    value="okrapay"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          💳 OkraPay
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Mobile Money, Visa, Mastercard
                        </Typography>
                      </Box>
                    }
                    sx={{
                      border: 1,
                      borderColor: paymentMethod === 'okrapay' ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      p: 2,
                      mb: 1,
                    }}
                  />
                </RadioGroup>
              </FormControl>
            )}
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              The amount will be added to your float balance after successful payment.
              Commission from cash rides will be deducted from your float.
            </Typography>
          </Alert>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !amount || !okrapayAvailable}
            startIcon={<AddIcon />}
            sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
          >
            {loading ? 'Processing...' : `Top Up ${formatCurrency(parseFloat(amount) || 0)}`}
          </Button>

        </form>
      </Box>
    </Box>
  );
}