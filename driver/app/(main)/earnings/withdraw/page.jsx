'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
  TextField,
  Button,
  InputAdornment,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ArrowBack as BackIcon, AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import { formatCurrency } from '@/Functions';
import { requestWithdrawal } from '@/Functions';
import { useDriver } from '@/lib/hooks/useDriver';
import { MINIMUM_WITHDRAWAL_AMOUNT } from '@/Constants';

export default function WithdrawPage() {
  const router = useRouter();
  const { driverProfile } = useDriver();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('okrapay');
  const [accountDetails, setAccountDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableBalance = driverProfile?.currentBalance || 0;
  const minimumAmount = MINIMUM_WITHDRAWAL_AMOUNT;

  const quickAmounts = [100, 200, 500, 1000].filter((amt) => amt <= availableBalance);

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);

    // Validation
    if (!numAmount || numAmount < minimumAmount) {
      setError(`Minimum withdrawal amount is ${formatCurrency(minimumAmount)}`);
      return;
    }

    if (numAmount > availableBalance) {
      setError('Insufficient balance');
      return;
    }

    if (method === 'okrapay' && !accountDetails.accountNumber) {
      setError('Please enter your OkraPay phone number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await requestWithdrawal(numAmount, method, accountDetails);

      if (response.success) {
        router.push('/earnings/withdraw/success');
      } else {
        setError(response.error || 'Failed to request withdrawal');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Withdraw Earnings
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Available Balance */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <WalletIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
            Available Balance
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {formatCurrency(availableBalance)}
          </Typography>
        </Paper>

        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Withdrawal Amount
            </Typography>

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">K</InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={handleMaxAmount}>
                      MAX
                    </Button>
                  </InputAdornment>
                ),
              }}
              helperText={`Min: ${formatCurrency(minimumAmount)} • Max: ${formatCurrency(
                availableBalance
              )}`}
              sx={{ mb: 2 }}
              required
            />

            {/* Quick Amounts */}
            {quickAmounts.length > 0 && (
              <>
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
                        color: amount === value.toString() ? 'white' : 'inherit',
                      }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>

          {/* Withdrawal Method */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Withdrawal Method
            </Typography>

            <FormControl component="fieldset" fullWidth>
              <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
                <FormControlLabel
                  value="okrapay"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        💳 OkraPay
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Instant withdrawal to mobile money
                      </Typography>
                    </Box>
                  }
                  sx={{
                    border: 1,
                    borderColor: method === 'okrapay' ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 2,
                    mb: 1,
                  }}
                />
              </RadioGroup>
            </FormControl>

            {/* Account Details */}
            {method === 'okrapay' && (
              <TextField
                fullWidth
                label="Mobile Money Number"
                placeholder="+260 9X XXX XXXX"
                value={accountDetails.accountNumber}
                onChange={(e) =>
                  setAccountDetails({ ...accountDetails, accountNumber: e.target.value })
                }
                sx={{ mt: 2 }}
                required
              />
            )}
          </Paper>

          {/* Processing Info */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Withdrawals are typically processed within 24 hours during business days.
              You'll receive an SMS confirmation once processed.
            </Typography>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Summary */}
          {amount && parseFloat(amount) >= minimumAmount && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Withdrawal Summary
              </Typography>
              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Withdrawal Amount" />
                  <Typography fontWeight={600}>{formatCurrency(parseFloat(amount))}</Typography>
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Processing Fee" />
                  <Typography>K 0.00</Typography>
                </ListItem>
                <ListItem sx={{ px: 0, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <ListItemText
                    primary="You'll Receive"
                    primaryTypographyProps={{ fontWeight: 700 }}
                  />
                  <Typography fontWeight={700} color="success.main" fontSize="1.1rem">
                    {formatCurrency(parseFloat(amount))}
                  </Typography>
                </ListItem>
              </List>
            </Paper>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !amount || parseFloat(amount) < minimumAmount}
            sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
          >
            {loading
              ? 'Processing...'
              : `Request Withdrawal of ${formatCurrency(parseFloat(amount) || 0)}`}
          </Button>
        </form>
      </Box>
    </Box>
  );
}