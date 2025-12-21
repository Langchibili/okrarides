'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWallet } from '@/lib/hooks/useWallet';
import { formatCurrency } from '@/Functions';

const quickAmounts = [10, 20, 50, 100, 200, 500];

export default function WalletTopupPage() {
  const router = useRouter();
  const { balance, topUp, loading } = useWallet();
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('okrapay');

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount < 10) {
      alert('Minimum top-up amount is K10');
      return;
    }

    if (numAmount > 10000) {
      alert('Maximum top-up amount is K10,000');
      return;
    }

    try {
      const result = await topUp(numAmount, selectedPaymentMethod);
      
      // Redirect to payment URL
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (error) {
      alert(error.message || 'Failed to initiate top-up');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton onClick={() => router.back()} edge="start">
          <BackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
          Top Up Wallet
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Current Balance
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
              {formatCurrency(balance)}
            </Typography>
          </Paper>
        </motion.div>

        {/* Amount Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Enter Amount
            </Typography>
            
            <TextField
              fullWidth
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      K
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 64,
                  fontSize: '1.5rem',
                  fontWeight: 600,
                },
                mb: 2,
              }}
            />

            <Typography variant="caption" color="text.secondary">
              Min: K10 • Max: K10,000
            </Typography>
          </Paper>
        </motion.div>

        {/* Quick Amounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Quick Amounts
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {quickAmounts.map((value, index) => (
              <Grid item xs={4} key={value}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Paper
                    onClick={() => handleQuickAmount(value)}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: 2,
                      borderColor:
                        amount === value.toString() ? 'primary.main' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.light',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      K{value}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Payment Method
            </Typography>
            
            <Paper
              onClick={() => setSelectedPaymentMethod('okrapay')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                cursor: 'pointer',
                border: 2,
                borderColor:
                  selectedPaymentMethod === 'okrapay' ? 'primary.main' : 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.light',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PaymentIcon sx={{ color: 'primary.dark' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  OkraPay
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fast & Secure
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: 2,
                  borderColor:
                    selectedPaymentMethod === 'okrapay' ? 'primary.main' : 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedPaymentMethod === 'okrapay' && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                    }}
                  />
                )}
              </Box>
            </Paper>
          </Paper>
        </motion.div>

        {/* Top Up Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleTopUp}
            disabled={!amount || parseFloat(amount) < 10 || loading}
            sx={{
              height: 56,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {loading ? 'Processing...' : `Top Up ${amount ? formatCurrency(parseFloat(amount)) : ''}`}
          </Button>
        </motion.div>

        {/* Info */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            💡 <strong>Tip:</strong> Top up your wallet in advance for faster checkout during rides.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
