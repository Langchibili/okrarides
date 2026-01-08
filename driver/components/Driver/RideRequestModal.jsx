'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Button,
  LinearProgress,
  Avatar,
  Divider,
  Paper,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Navigation as NavigationIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import useSound from 'use-sound';
import { formatCurrency, formatDistance } from '@/Functions';

export const RideRequestModal = ({ open, rideRequest, onAccept, onDecline }) => {
  const theme = useTheme();
  const [countdown, setCountdown] = useState(30);
  const [playSound, { stop }] = useSound('/sounds/ride-request.mp3', {
    volume: 1,
    loop: true,
  });

  // Play sound when modal opens
  useEffect(() => {
    if (open) {
      playSound();
      // Vibrate pattern
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }
    return () => {
      stop?.();
    };
  }, [open, playSound, stop]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(); // Auto-decline when timer runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onDecline]);

  // Reset countdown when new request
  useEffect(() => {
    if (open && rideRequest) {
      setCountdown(30);
    }
  }, [open, rideRequest]);

  if (!rideRequest) return null;

  const handleAccept = () => {
    stop?.();
    onAccept(rideRequest.rideId);
  };

  const handleDecline = () => {
    stop?.();
    onDecline(rideRequest.rideId);
  };

  return (
    <Dialog
      open={open}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
        },
      }}
    >
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          p: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    boxShadow: `0 0 0 0 ${theme.palette.primary.main}66`,
                  },
                  '50%': {
                    boxShadow: `0 0 0 20px ${theme.palette.primary.main}00`,
                  },
                },
              }}
            >
              <NavigationIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
          </motion.div>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            New Ride Request!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accept or decline in {countdown} seconds
          </Typography>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={(countdown / 30) * 100}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 3,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              bgcolor: countdown > 10 ? 'success.main' : 'error.main',
              borderRadius: 4,
            },
          }}
        />

        {/* Rider Info */}
        <Paper elevation={3} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={rideRequest.rider?.avatar}
              sx={{ width: 56, height: 56 }}
            >
              <PersonIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {rideRequest.rider?.name || 'Rider'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  ⭐ {rideRequest.rider?.rating || '5.0'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {rideRequest.rider?.totalRides || 0} rides
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Trip Details */}
        <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
          {/* Pickup */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                PICKUP
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {rideRequest.pickupLocation?.address}
              </Typography>
            </Box>
          </Box>

          {/* Connecting line */}
          <Box
            sx={{
              width: 2,
              height: 16,
              bgcolor: 'divider',
              ml: 2.2,
              mb: 1,
            }}
          />

          {/* Dropoff */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                DROPOFF
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {rideRequest.dropoffLocation?.address}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Trip Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 2,
            mb: 3,
          }}
        >
          <Paper elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'primary.main' }}
            >
              {formatDistance(rideRequest.distance * 1000)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Distance
            </Typography>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'info.main' }}
            >
              {rideRequest.duration} min
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Duration
            </Typography>
          </Paper>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'success.main' }}
            >
              {formatCurrency(rideRequest.fare)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Fare
            </Typography>
          </Paper>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleDecline}
            sx={{
              height: 56,
              borderRadius: 3,
              fontWeight: 600,
              borderWidth: 2,
            }}
          >
            Decline
          </Button>
          <motion.div style={{ flex: 1 }} whileTap={{ scale: 0.98 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleAccept}
              sx={{
                height: 56,
                borderRadius: 3,
                fontWeight: 600,
                fontSize: '1.1rem',
                bgcolor: 'success.main',
                '&:hover': {
                  bgcolor: 'success.dark',
                },
              }}
            >
              Accept Ride
            </Button>
          </motion.div>
        </Box>
      </Box>
    </Dialog>
  );
};

export default RideRequestModal;
