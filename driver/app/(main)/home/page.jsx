'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Grid, IconButton,
  Button, Alert, Paper, Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  LocalAtm as EarningsIcon,
  DirectionsCar as RidesIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
  TrendingDown as FloatLowIcon,
  Schedule as ExpiryIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { OnlineToggle } from '@/components/Driver/OnlineToggle';
import { EarningsCard } from '@/components/Driver/EarningsCard';
import { StatCard } from '@/components/Driver/StatCard';
import { RideRequestModal } from '@/components/Driver/RideRequestModal';
import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
import { useDriver } from '@/lib/hooks/useDriver';
import { useRide } from '@/lib/hooks/useRide';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { getDriverStats, formatCurrency } from '@/Functions';
import { VERIFICATION_STATUS } from '@/Constants';
import useAuthGuard from '@/lib/hooks/useAuthGuard';

export default function DriverHomePage() {
  const router = useRouter();
  const {
    driverProfile,
    isOnline,
    toggleOnline,
    needsVerification,
    needsVehicle,
    needsSubscription,
    paymentSystemType,
  } = useDriver();

  const {
    isNegativeFloatAllowed,
    negativeFloatLimit,
    minimumFloatTopup,
    defaultCommissionPercentage,
    isFloatSystemEnabled,
    isSubscriptionSystemEnabled,
  } = useAdminSettings();

  const { user } = useAuthGuard({
    requireAuth: true,
    requireVerification: true,
    redirectTo: '/home',
  });

  const { incomingRide, currentRide, acceptRide, declineRide } = useRide();
  const { isNative, getCurrentLocation } = useReactNative();

  const [stats, setStats] = useState({ todayEarnings: 0, todayRides: 0, rating: 0, acceptance: 0 });
  const [loading, setLoading] = useState(true);
  const [mapControls, setMapControls] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    loadDriverStats();
    requestLocationOnMount();
  }, []);

  const loadDriverStats = async () => {
    try {
      const response = await getDriverStats();
      if (response.success) setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationOnMount = async () => {
    try {
      if (isNative) {
        const location = await getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          mapControls?.animateToLocation(location, 16);
        }
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const loc = { lat: coords.latitude, lng: coords.longitude };
            setCurrentLocation(loc);
            mapControls?.animateToLocation(loc, 16);
          },
          (error) => console.error('Location error:', error)
        );
      }
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };

  const handleToggleOnline = async () => {
    try {
      const result = await toggleOnline(!isOnline);
      if (!result.allowed) {
        if (result.action === 'subscribe') {
          if (window.confirm(result.message + '\n\nView plans?')) router.push('/subscription/plans');
        } else if (result.action === 'topup_float') {
          if (window.confirm(result.message + '\n\nTop up now?')) router.push('/float/topup');
        }
      }
    } catch (error) {
      console.error('Error toggling online:', error);
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      await acceptRide(rideId);
      router.push(`/active-ride/${rideId}`);
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const handleDeclineRide = async (rideId) => {
    try {
      await declineRide(rideId, 'Driver declined');
    } catch (error) {
      console.error('Error declining ride:', error);
    }
  };

  // ─── Driver-level payment mode ─────────────────────────────────────────────
  // For hybrid: subscription takes precedence when driver has an active/trial sub
  const subscriptionStatus = driverProfile?.subscriptionStatus;
  const subscriptionExpiresAt = driverProfile?.currentSubscription?.expiresAt;

  const isOnSubscriptionSystem =
    paymentSystemType === 'subscription_based' ||
    (paymentSystemType === 'hybrid' && ['active', 'trial'].includes(subscriptionStatus));

  const isOnFloatSystem =
    paymentSystemType === 'float_based' ||
    (paymentSystemType === 'hybrid' && !['active', 'trial'].includes(subscriptionStatus));

  // ─── Subscription alert conditions ────────────────────────────────────────
  const daysUntilExpiry = subscriptionExpiresAt
    ? Math.floor((new Date(subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isSubscriptionExpired = ['expired', 'cancelled'].includes(subscriptionStatus);
  const isSubscriptionExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  const isOnTrial = subscriptionStatus === 'trial';

  // ─── Float alert conditions ────────────────────────────────────────────────
  const floatBalance = driverProfile?.floatBalance || 0;
  const isFloatNegative = floatBalance < 0;
  const isFloatAtLimit =
    isFloatNegative && negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit;
  const isFloatLow = !isFloatNegative && floatBalance < minimumFloatTopup * 2 && floatBalance > 0;

  // ─── Alert visibility flags ───────────────────────────────────────────────
  const showVerificationAlert = needsVerification || needsVehicle;

  const showSubscriptionRequiredAlert =
    !showVerificationAlert &&
    paymentSystemType === 'subscription_based' &&
    needsSubscription;
 
  const showSubscriptionExpiryAlert =
    !showVerificationAlert &&
    isOnSubscriptionSystem &&
    (isSubscriptionExpired || isSubscriptionExpiringSoon);

  const showFloatBlockedAlert =
    !showVerificationAlert &&
    isOnFloatSystem &&
    (isFloatAtLimit || (isFloatNegative && !isNegativeFloatAllowed))

  const showFloatLowAlert =
    !showVerificationAlert &&
    isOnFloatSystem &&
    isFloatLow;

  const showFloatNegativeWarning =
    !showVerificationAlert &&
    isOnFloatSystem &&
    isFloatNegative &&
    !isFloatAtLimit &&
    isNegativeFloatAllowed;

  const showFloatWithdrawableNotice =
    !showVerificationAlert &&
    isOnSubscriptionSystem &&
    floatBalance > 0;
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit"><MenuIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>Dashboard</Typography>
          <IconButton color="inherit"><NotificationsIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>

        {/* 1. Verification Required */}
        {showVerificationAlert && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}
              action={<Button color="inherit" size="small" onClick={() => router.push('/verification')}>Complete</Button>}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Verification Required</Typography>
              <Typography variant="body2">
                {needsVerification && 'Complete your verification before accepting rides. '}
                {needsVehicle && 'Add your vehicle information to continue.'}
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* 2. Subscription Required */}
        {showSubscriptionRequiredAlert && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity="info" sx={{ mb: 2 }}
              action={<Button color="inherit" size="small" onClick={() => router.push('/subscription/plans')}>Subscribe</Button>}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Subscription Required</Typography>
              <Typography variant="body2">
                Subscribe to a plan to start accepting rides and keep 100% of your earnings.
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* 3. Subscription Expiry Warning */}
        {showSubscriptionExpiryAlert && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity={isSubscriptionExpired ? 'error' : 'warning'}
              icon={<ExpiryIcon />} sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => router.push('/subscription/plans')}>
                  {isSubscriptionExpired ? 'Renew Now' : 'View Plan'}
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {isSubscriptionExpired
                  ? 'Subscription Expired'
                  : isOnTrial
                  ? `Trial Ends in ${daysUntilExpiry} Day${daysUntilExpiry !== 1 ? 's' : ''}`
                  : `Subscription Expiring in ${daysUntilExpiry} Day${daysUntilExpiry !== 1 ? 's' : ''}`}
              </Typography>
              <Typography variant="body2">
                {isSubscriptionExpired
                  ? 'Your subscription has expired. Renew to keep accepting rides at zero commission.'
                  : isOnTrial
                  ? 'Your free trial ends soon. Subscribe to continue enjoying 0% commission.'
                  : 'Renew before it expires to avoid interruption.'}
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* 4. Float Blocked */}
        {showFloatBlockedAlert && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity="error" icon={<FloatLowIcon />} sx={{ mb: 2 }}
              action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Float Balance Blocked</Typography>
              <Typography variant="body2">
                Your float balance is {formatCurrency(floatBalance)} and you cannot accept cash rides until you top up.{' '}
                {isFloatAtLimit && `You have exceeded the negative limit of ${formatCurrency(-negativeFloatLimit)}.`}
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* 5. Float Negative (within limit) */}
        {showFloatNegativeWarning && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity="warning" icon={<FloatLowIcon />} sx={{ mb: 2 }}
              action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Negative Float Balance</Typography>
              <Typography variant="body2">
                Your float is {formatCurrency(floatBalance)}.{' '}
                {negativeFloatLimit > 0
                  ? `You can go down to ${formatCurrency(-negativeFloatLimit)} before being blocked.`
                  : 'Top up to maintain a healthy balance.'}
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* 6. Float Low */}
        {showFloatLowAlert && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity="warning" sx={{ mb: 2 }}
              action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Float Balance Low</Typography>
              <Typography variant="body2">
                Your float balance is {formatCurrency(floatBalance)}. Top up soon to avoid interruptions.
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* 7. Withdrawable Float (subscription drivers) */}
        {showFloatWithdrawableNotice && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert
              severity="success" icon={<SavingsIcon />} sx={{ mb: 2 }}
              action={<Button color="inherit" size="small" onClick={() => router.push('/float')}>Withdraw</Button>}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>You Have Float to Withdraw</Typography>
              <Typography variant="body2">
                You have {formatCurrency(floatBalance)} in your float. Since you're on a subscription
                plan, this can be withdrawn at any time.
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Payment System Banner */}
        {driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED && (
          <Paper
            elevation={0}
            sx={{
              p: 1.5, mb: 2, borderRadius: 2,
              bgcolor: isOnSubscriptionSystem ? 'success.light' : 'info.light',
              border: 1,
              borderColor: isOnSubscriptionSystem ? 'success.main' : 'info.main',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: isOnSubscriptionSystem ? 'success.dark' : 'info.dark' }}
              >
                💰{' '}
                {paymentSystemType === 'subscription_based'
                  ? '0% Commission — Subscription Plan'
                  : paymentSystemType === 'float_based'
                  ? `Float System — ${defaultCommissionPercentage}% Commission on Cash Rides`
                  : isOnSubscriptionSystem
                  ? '0% Commission — Active Subscription'
                  : `Hybrid — ${defaultCommissionPercentage}% Commission (no active subscription)`}
              </Typography>
              {isOnFloatSystem && (
                <Chip
                  label={`Float: ${formatCurrency(floatBalance)}`}
                  size="small"
                  color={isFloatNegative ? 'error' : isFloatLow ? 'warning' : 'success'}
                  onClick={() => router.push('/float')}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              )}
            </Box>
          </Paper>
        )}

        {/* Online Toggle */}
        <OnlineToggle
          isOnline={isOnline}
          subscriptionStatus={driverProfile?.currentSubscription}
          onToggle={handleToggleOnline}
          disabled={showVerificationAlert || showFloatBlockedAlert || showSubscriptionRequiredAlert}
        />

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <EarningsCard
                title="Today's Earnings"
                amount={stats.todayEarnings}
                icon={<EarningsIcon sx={{ color: 'earnings.dark' }} />}
                color="earnings"
              />
            </motion.div>
          </Grid>
          <Grid item xs={6}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <StatCard title="Rides Completed" value={stats.todayRides} icon={<RidesIcon sx={{ color: 'primary.dark' }} />} color="primary" />
            </motion.div>
          </Grid>
          <Grid item xs={6}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <StatCard title="Rating" value={stats.rating.toFixed(1)} icon={<StarIcon sx={{ color: 'warning.dark' }} />} color="warning" />
            </motion.div>
          </Grid>
          <Grid item xs={6}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <StatCard title="Acceptance" value={`${stats.acceptance}%`} icon={<SpeedIcon sx={{ color: 'info.dark' }} />} color="info" />
            </motion.div>
          </Grid>
        </Grid>

        {/* Map Preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Box sx={{ height: 200, borderRadius: 3, overflow: 'hidden', mb: 2 }}>
            <GoogleMapIframe
              center={currentLocation || { lat: -15.4167, lng: 28.2833 }}
              zoom={13}
              height="200px"
              onMapLoad={setMapControls}
            />
          </Box>
        </motion.div>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="outlined" fullWidth startIcon={<HistoryIcon />} onClick={() => router.push('/rides')}>
            Ride History
          </Button>
          <Button variant="outlined" fullWidth startIcon={<WalletIcon />} onClick={() => router.push('/earnings')}>
            Earnings
          </Button>
        </Box>

        {/* Float / Subscription row */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isFloatSystemEnabled && (
            <Button
              variant={isFloatNegative || isFloatLow ? 'contained' : 'outlined'}
              fullWidth
              color={isFloatNegative ? 'error' : isFloatLow ? 'warning' : 'inherit'}
              startIcon={<WalletIcon />}
              onClick={() => router.push('/float')}
            >
              Float: {formatCurrency(floatBalance)}
            </Button>
          )}
          {isSubscriptionSystemEnabled && (
            <Button
              variant="outlined"
              fullWidth
              color={isSubscriptionExpired ? 'error' : isSubscriptionExpiringSoon ? 'warning' : 'inherit'}
              onClick={() => router.push('/subscription/plans')}
            >
              {isSubscriptionExpired
                ? 'Renew Plan'
                : ['active', 'trial'].includes(subscriptionStatus)
                ? `Plan: ${daysUntilExpiry}d left`
                : 'View Plans'}
            </Button>
          )}
        </Box>
      </Box>

      <AnimatePresence>
        {incomingRide && (
          <RideRequestModal
            open={!!incomingRide}
            rideRequest={incomingRide}
            onAccept={handleAcceptRide}
            onDecline={handleDeclineRide}
          />
        )}
      </AnimatePresence>
    </Box>
  );
}