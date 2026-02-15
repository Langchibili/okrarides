//driver/app/(main)/home/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  IconButton,
  Button,
  Alert,
  Paper,
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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { OnlineToggle } from '@/components/Driver/OnlineToggle';
import { EarningsCard } from '@/components/Driver/EarningsCard';
import { StatCard } from '@/components/Driver/StatCard';
import { RideRequestModal } from '@/components/Driver/RideRequestModal';
import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
import { useDriver } from '@/lib/hooks/useDriver';
import { useRide } from '@/lib/hooks/useRide';
import { useAuth } from '@/lib/hooks/useAuth';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { getDriverStats } from '@/Functions';
import { VERIFICATION_STATUS } from '@/Constants';
import useAuthGuard from '@/lib/hooks/useAuthGuard';

export default function DriverHomePage() {
  const router = useRouter();
  const {
    driverProfile,
    adminSettings,
    isOnline,
    toggleOnline,
    canGoOnline,
    needsVerification,
    needsVehicle,
    needsSubscription,
    needsFloat,
    paymentSystemType,
  } = useDriver();

  const { user } = useAuthGuard({
    requireAuth: true,
    requireVerification: true,
    redirectTo: '/home'
  });

  const { incomingRide, currentRide, acceptRide, declineRide } = useRide();
  const { isNative, getCurrentLocation, requestPermission } = useReactNative();

  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayRides: 0,
    rating: 0,
    acceptance: 0,
  });
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
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationOnMount = async () => {
    try {
      if (isNative) {
        // Request location from native
        const location = await getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          if (mapControls) {
            mapControls.animateToLocation(location, 16);
          }
        }
      } else {
        // Web fallback
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const loc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setCurrentLocation(loc);
              if (mapControls) {
                mapControls.animateToLocation(loc, 16);
              }
            },
            (error) => console.error('Location error:', error)
          );
        }
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
          if (window.confirm(result.message + '\n\nView plans?')) {
            router.push('/subscription/plans');
          }
        } else if (result.action === 'topup_float') {
          if (window.confirm(result.message + '\n\nTop up now?')) {
            router.push('/float/topup');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling online:', error);
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      await acceptRide(rideId);
      router.push(`/rides/${rideId}`);
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

  const handleRelocate = async () => {
    await requestLocationOnMount();
  };

  // Show verification required alert
  const showVerificationAlert = needsVerification || needsVehicle;
  const showSubscriptionAlert = needsSubscription && !needsVerification && !needsVehicle;
  const showFloatAlert = needsFloat && !needsVerification && !needsVehicle && !needsSubscription;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            Dashboard
          </Typography>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 10 }}>
        {/* Verification Required Alert */}
        {showVerificationAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => router.push('/verification')}
                >
                  Complete
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Verification Required
              </Typography>
              <Typography variant="body2">
                {needsVerification && 'You must complete verification before accepting rides.'}
                {needsVehicle && 'Add your vehicle information to continue.'}
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Subscription Required Alert */}
        {showSubscriptionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => router.push('/subscription/plans')}
                >
                  Subscribe
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Subscription Required
              </Typography>
              <Typography variant="body2">
                Subscribe to a plan to start accepting rides. Keep 100% of your earnings!
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Float Top-up Alert */}
        {showFloatAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => router.push('/float/topup')}
                >
                  Top Up
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Float Top-up Required
              </Typography>
              <Typography variant="body2">
                Your float balance is low. Top up to continue accepting rides. 
                Current balance: K{driverProfile?.floatBalance?.toFixed(2)}
              </Typography>
            </Alert>
          </motion.div>
        )}

        {/* Payment System Info */}
        {driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED && (
          <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: 'info.light' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.dark' }}>
              💰 Payment System:{' '}
              {paymentSystemType === 'subscription_based'
                ? 'Subscription (0% Commission)'
                : paymentSystemType === 'float_based'
                ? 'Float-based (15% Commission)'
                : 'Hybrid (Choose your preference)'}
            </Typography>
          </Paper>
        )}

        {/* Online Toggle Card */}
        <OnlineToggle
          isOnline={isOnline}
          subscriptionStatus={driverProfile?.currentSubscription}
          onToggle={handleToggleOnline}
          disabled={showVerificationAlert}
        />

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <EarningsCard
                title="Today's Earnings"
                amount={stats.todayEarnings}
                icon={<EarningsIcon sx={{ color: 'earnings.dark' }} />}
                color="earnings"
              />
            </motion.div>
          </Grid>
          <Grid item xs={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatCard
                title="Rides Completed"
                value={stats.todayRides}
                icon={<RidesIcon sx={{ color: 'primary.dark' }} />}
                color="primary"
              />
            </motion.div>
          </Grid>
          <Grid item xs={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatCard
                title="Rating"
                value={stats.rating.toFixed(1)}
                icon={<StarIcon sx={{ color: 'warning.dark' }} />}
                color="warning"
              />
            </motion.div>
          </Grid>
          <Grid item xs={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StatCard
                title="Acceptance"
                value={`${stats.acceptance}%`}
                icon={<SpeedIcon sx={{ color: 'info.dark' }} />}
                color="info"
              />
            </motion.div>
          </Grid>
        </Grid>

        {/* Map Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Box
            sx={{
              height: 200,
              borderRadius: 3,
              overflow: 'hidden',
              mb: 2
            }}
          >
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
          <Button
            variant="outlined"
            fullWidth
            startIcon={<HistoryIcon />}
            onClick={() => router.push('/rides')}
          >
            Ride History
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<WalletIcon />}
            onClick={() => router.push('/earnings')}
          >
            Earnings
          </Button>
        </Box>
      </Box>

      {/* Incoming Ride Request Modal */}
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