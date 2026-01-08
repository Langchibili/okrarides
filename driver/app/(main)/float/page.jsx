'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  TrendingDown as WithdrawIcon,
  History as HistoryIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency, formatDateTime } from '@/Functions';
import { getFloatBalance } from '@/Functions';
import { useDriver } from '@/lib/hooks/useDriver';

export default function FloatPage() {
  const router = useRouter();
  const { driverProfile, adminSettings } = useDriver();
  const [floatData, setFloatData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFloatBalance();
  }, []);

  const loadFloatBalance = async () => {
    try {
      const response = await getFloatBalance();
      if (response.success) {
        setFloatData(response.float);
      }
    } catch (error) {
      console.error('Error loading float:', error);
    } finally {
      setLoading(false);
    }
  };

  const isNegative = floatData?.balance < 0;
  const isBlocked =
    isNegative &&
    (!adminSettings?.allowNegativeFloat ||
      floatData?.balance < -adminSettings?.negativeFloatLimit);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Float Balance
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => router.push('/float/transactions')}
          >
            <HistoryIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 4,
              background: isBlocked
                ? `linear-gradient(135deg, #F44336 0%, #D32F2F 100%)`
                : isNegative
                ? `linear-gradient(135deg, #FF9800 0%, #F57C00 100%)`
                : `linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)`,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <WalletIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              Current Float Balance
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                mb: 2,
              }}
            >
              {formatCurrency(floatData?.balance || 0)}
            </Typography>

            {isBlocked && (
              <Alert
                severity="error"
                sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)' }}
                icon={<InfoIcon />}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Float Limit Exceeded
                </Typography>
                <Typography variant="caption">
                  You cannot accept cash rides until you top up your float.
                </Typography>
              </Alert>
            )}

            {isNegative && !isBlocked && (
              <Chip
                label="⚠️ Negative Balance"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
          </Paper>
        </motion.div>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => router.push('/float/topup')}
            sx={{
              height: 56,
              borderRadius: 3,
              fontWeight: 600,
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' },
            }}
          >
            Top Up Float
          </Button>
        </Box>

        {/* Float Info */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Float Information
          </Typography>

          <List disablePadding>
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Current Balance" />
              <Typography
                fontWeight={600}
                color={isNegative ? 'error.main' : 'success.main'}
              >
                {formatCurrency(floatData?.balance || 0)}
              </Typography>
            </ListItem>

            {adminSettings?.floatLimit && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Float Limit" />
                <Typography>{formatCurrency(adminSettings.floatLimit)}</Typography>
              </ListItem>
            )}

            {adminSettings?.allowNegativeFloat && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Negative Balance Limit"
                  secondary="Maximum you can go below zero"
                />
                <Typography>
                  {formatCurrency(adminSettings.negativeFloatLimit || 0)}
                </Typography>
              </ListItem>
            )}

            <Divider sx={{ my: 2 }} />

            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="Total Top-ups"
                secondary="Lifetime"
              />
              <Typography>{formatCurrency(floatData?.totalTopups || 0)}</Typography>
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="Total Deductions"
                secondary="Commission deductions"
              />
              <Typography color="error.main">
                {formatCurrency(floatData?.totalDeductions || 0)}
              </Typography>
            </ListItem>
          </List>
        </Paper>

        {/* How Float Works */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            How Float System Works
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            The float system is used for commission deductions on cash rides:
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText
                primary="• When you complete a cash ride, 15% commission is deducted from your float"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="• For digital payments, commission is automatically deducted before payout"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="• Top up your float anytime using OkraPay"
              />
            </ListItem>
            {adminSettings?.allowNegativeFloat && (
              <ListItem>
                <ListItemText
                  primary={`• You can go negative up to ${formatCurrency(
                    adminSettings.negativeFloatLimit || 0
                  )} before being blocked`}
                />
              </ListItem>
            )}
          </List>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => router.push('/help/float-system')}
            sx={{ mt: 2 }}
          >
            Learn More
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}