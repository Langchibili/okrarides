//Okra\Okrarides\driver\app\(main)\float\page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Paper, Button, IconButton,
  Alert, List, ListItem, ListItemText, Divider, Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  TrendingDown as WithdrawIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/Functions';
import { getFloatBalance } from '@/Functions';
import { useDriver } from '@/lib/hooks/useDriver';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

export default function FloatPage() {
  const router = useRouter();
  const { driverProfile, paymentSystemType } = useDriver();
  const {
    isNegativeFloatAllowed,
    negativeFloatLimit,
    defaultCommissionPercentage,
    isFloatSystemEnabled,
    isSubscriptionSystemEnabled,
  } = useAdminSettings();

  const [floatData, setFloatData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFloatBalance();
  }, []);

  const loadFloatBalance = async () => {
    try {
      const response = await getFloatBalance();
      if (response.success) setFloatData(response.float);
    } catch (error) {
      console.error('Error loading float:', error);
    } finally {
      setLoading(false);
    }
  };

  const floatBalance = floatData?.floatBalance ?? driverProfile?.floatBalance ?? 0;
  const currentBalance = floatData?.currentBalance ?? driverProfile?.currentBalance ?? 0;
  const pendingWithdrawal = floatData?.pendingWithdrawal ?? driverProfile?.pendingWithdrawal ?? 0;
  const availableToWithdraw = Math.max(0, currentBalance - pendingWithdrawal);

  const isNegative = floatBalance < 0;

  // Driver-level payment mode: subscription takes precedence in hybrid when active
  const driverSubscriptionStatus = driverProfile?.subscriptionStatus;
  const isSubscriptionBased =
    paymentSystemType === 'subscription_based' ||
    (paymentSystemType === 'hybrid' && ['active', 'trial'].includes(driverSubscriptionStatus));
  const isFloatBased = !isSubscriptionBased;

  // Blocked = negative when not allowed, or exceeded the configured limit
  const isBlocked =
    isNegative &&
    (!isNegativeFloatAllowed || (negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit));

  const commissionRate = defaultCommissionPercentage;
  const exampleFare = 100;
  const exampleCommission = exampleFare * (commissionRate / 100);
  const exampleDeduction = exampleFare + exampleCommission;

  const cardGradient = isBlocked
    ? 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)'
    : isNegative
    ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
    : isSubscriptionBased
    ? 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)'
    : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>Float Balance</Typography>
          <IconButton color="inherit" onClick={() => router.push('/float/transactions')}>
            <HistoryIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>

        {/* Subscription: float is withdrawable */}
        {isSubscriptionBased && floatBalance > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity="info"
              icon={<CheckIcon />}
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => router.push('/earnings/withdraw')}>
                  Withdraw
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Your Float is Available to Withdraw
              </Typography>
              <Typography variant="body2">
                You are on a subscription plan — no commission is deducted from your float.
                Your full balance of {formatCurrency(floatBalance)} can be withdrawn.
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Float blocked */}
        {isBlocked && isFloatBased && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity="error"
              icon={<WarningIcon />}
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>
                  Top Up
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Cash Rides Blocked</Typography>
              <Typography variant="body2">
                Your float is {formatCurrency(floatBalance)}.{' '}
                {!isNegativeFloatAllowed
                  ? 'Negative float is not allowed. Top up to accept rides.'
                  : `You have exceeded the negative limit of ${formatCurrency(-negativeFloatLimit)}.`}
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Negative but within limit */}
        {isNegative && !isBlocked && isFloatBased && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Negative Float Balance</Typography>
              <Typography variant="body2">
                Your float is {formatCurrency(floatBalance)}.{' '}
                {negativeFloatLimit > 0
                  ? `You have ${formatCurrency(negativeFloatLimit - Math.abs(floatBalance))} remaining before you are blocked.`
                  : 'Top up when you can.'}
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4, mb: 3, borderRadius: 4,
              background: cardGradient,
              color: 'white', textAlign: 'center',
            }}
          >
            <WalletIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>Float Balance</Typography>
            <Typography
              variant="h2"
              sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", mb: 1 }}
            >
              {formatCurrency(floatBalance)}
            </Typography>

            {isSubscriptionBased ? (
              <Chip
                label="✓ Subscription Plan — Fully Withdrawable"
                sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 600 }}
              />
            ) : isBlocked ? (
              <Chip
                label="🚫 Rides Blocked — Top Up Required"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
            ) : isNegative ? (
              <Chip
                label="⚠️ Negative Balance"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
            ) : null}

            {availableToWithdraw > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Available to Withdraw</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {formatCurrency(availableToWithdraw)}
                </Typography>
                {pendingWithdrawal > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {formatCurrency(pendingWithdrawal)} pending
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </motion.div>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {isFloatBased && (
            <Button
              fullWidth variant="contained" size="large" startIcon={<AddIcon />}
              onClick={() => router.push('/float/topup')}
              sx={{ height: 56, borderRadius: 3, fontWeight: 600, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            >
              Top Up Float
            </Button>
          )}
          {availableToWithdraw > 0 && (
            <Button
              fullWidth
              variant={isSubscriptionBased ? 'contained' : 'outlined'}
              size="large"
              startIcon={<WithdrawIcon />}
              onClick={() => router.push('/earnings/withdraw')}
              sx={{
                height: 56, borderRadius: 3, fontWeight: 600,
                ...(isSubscriptionBased && { bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }),
              }}
            >
              Withdraw
            </Button>
          )}
        </Box>

        {/* Balance Details */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Balance Details</Typography>
          <List disablePadding>
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Float Balance" secondary="Your pre-paid float" />
              <Typography fontWeight={600} color={isNegative ? 'error.main' : 'success.main'}>
                {formatCurrency(floatBalance)}
              </Typography>
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Withdrawable Balance" secondary="Available to withdraw now" />
              <Typography fontWeight={600} color={availableToWithdraw > 0 ? 'success.main' : 'text.secondary'}>
                {formatCurrency(availableToWithdraw)}
              </Typography>
            </ListItem>

            {pendingWithdrawal > 0 && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Pending Withdrawal" secondary="Being processed" />
                <Typography color="warning.main">{formatCurrency(pendingWithdrawal)}</Typography>
              </ListItem>
            )}

            <Divider sx={{ my: 1.5 }} />

            {isFloatBased && (
              <>
                {isNegativeFloatAllowed && negativeFloatLimit > 0 && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Negative Balance Limit"
                      secondary="How far below zero you can go"
                    />
                    <Typography color="error.main">{formatCurrency(-negativeFloatLimit)}</Typography>
                  </ListItem>
                )}
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Commission Rate" secondary="Deducted from float per cash ride" />
                  <Typography fontWeight={600}>{commissionRate}%</Typography>
                </ListItem>
              </>
            )}

            {isSubscriptionBased && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Commission Rate" secondary="You are on a subscription plan" />
                <Chip label="0% — Free" color="success" size="small" sx={{ fontWeight: 700 }} />
              </ListItem>
            )}

            <Divider sx={{ my: 1.5 }} />

            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Total Float Purchased" secondary="All-time top-ups" />
              <Typography>{formatCurrency(floatData?.totalTopups || 0)}</Typography>
            </ListItem>

            {isFloatBased && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Total Deducted" secondary="Commission paid via float" />
                <Typography color="error.main">{formatCurrency(floatData?.totalDeductions || 0)}</Typography>
              </ListItem>
            )}
          </List>
        </Paper>

        {/* How Float Works */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            {isSubscriptionBased ? 'About Your Float' : 'How the Float System Works'}
          </Typography>

          {isSubscriptionBased ? (
            <>
              <Typography variant="body2" color="text.secondary" paragraph>
                You are on a subscription plan. Your float works differently:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• No commission is deducted from your float — you keep 100% of your earnings." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Your float balance is simply money you deposited that can be withdrawn at any time." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Use the Withdraw button above to get your float back." />
                </ListItem>
              </List>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" paragraph>
                The float is your pre-paid balance used to settle platform commissions on cash rides.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={`• When you complete a cash ride, the platform deducts: fare + commission from your float.`}
                    secondary={`Example: K${exampleFare} ride at ${commissionRate}% = K${exampleDeduction} deducted (K${exampleFare} + K${exampleCommission}).`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• For digital (OkraPay) rides, commission is settled digitally — no float deduction." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Top up your float to keep accepting cash rides." />
                </ListItem>
                {isNegativeFloatAllowed && negativeFloatLimit > 0 && (
                  <ListItem>
                    <ListItemText
                      primary={`• You can go negative up to ${formatCurrency(-negativeFloatLimit)} before cash rides are blocked.`}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="• Any remaining positive float balance can be withdrawn."
                    secondary="Withdraw your float once it's positive."
                  />
                </ListItem>
              </List>

              <Box
                sx={{
                  mt: 1.5, p: 2, borderRadius: 2,
                  bgcolor: 'grey.100', border: '1px solid', borderColor: 'grey.300',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                  Example deduction for a K{exampleFare} cash ride:
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Float before: K200 &nbsp;→&nbsp;
                  Deduction: K{exampleFare} + K{exampleCommission} = K{exampleDeduction} &nbsp;→&nbsp;
                  Float after: K{200 - exampleDeduction}
                </Typography>
              </Box>
            </>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            {isFloatBased && (
              <Button variant="outlined" fullWidth onClick={() => router.push('/float/topup')}>
                Top Up Float
              </Button>
            )}
            <Button variant="outlined" fullWidth onClick={() => router.push('/float/transactions')}>
              Transaction History
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}