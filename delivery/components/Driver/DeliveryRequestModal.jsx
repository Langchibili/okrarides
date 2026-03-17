// PATH: driver/components/Driver/DeliveryRequestModal.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, Box, Typography, Button, LinearProgress,
  Avatar, Paper, useTheme,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  LocalShipping as DeliveryIcon,
  Inventory as PackageIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency, formatDistance } from '@/Functions';

const PACKAGE_TYPE_LABELS = {
  document:  '📄 Document',
  parcel:    '📦 Parcel',
  food:      '🍔 Food',
  groceries: '🛒 Groceries',
  other:     '📫 Other',
};

function formatETA(minutes) {
  if (!minutes && minutes !== 0) return 'Calculating...';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const r = minutes % 60;
  return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
}

export const DeliveryRequestModal = ({ open, deliveryRequest, onAccept, onDecline }) => {
  const theme    = useTheme();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); onDecline?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, onDecline]);

  useEffect(() => {
    if (open && deliveryRequest) setCountdown(30);
  }, [open, deliveryRequest]);

  if (!deliveryRequest) return null;

  const handleAccept  = () => onAccept(deliveryRequest.deliveryId ?? deliveryRequest.rideId);
  const handleDecline = () => onDecline(deliveryRequest.deliveryId ?? deliveryRequest.rideId);

  const packageLabel = PACKAGE_TYPE_LABELS[deliveryRequest.packageType] ?? '📦 Package';

  return (
    <Dialog open={open} fullScreen PaperProps={{ sx: { bgcolor: 'background.default' } }}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 3 }}>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              bgcolor: '#F59E0B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { boxShadow: `0 0 0 0 #F59E0B66` },
                '50%':      { boxShadow: `0 0 0 20px #F59E0B00` },
              },
            }}>
              <DeliveryIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
          </motion.div>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>New Delivery Request!</Typography>
          <Typography variant="body2" color="text.secondary">
            Accept or decline in {countdown} seconds
          </Typography>
        </Box>

        {/* Progress */}
        <LinearProgress
          variant="determinate"
          value={(countdown / 30) * 100}
          sx={{
            height: 8, borderRadius: 4, mb: 3, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              bgcolor: countdown > 10 ? '#F59E0B' : 'error.main',
              borderRadius: 4,
            },
          }}
        />

        {/* Sender info */}
        <Paper elevation={3} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: '#F59E0B' }}>
              <PersonIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {deliveryRequest.senderName ?? 'Sender'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PackageIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{packageLabel}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Route */}
        <Paper elevation={3} sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
          {/* Pickup */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2, bgcolor: 'success.light',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <MyLocationIcon sx={{ color: 'success.dark', fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">PICKUP</Typography>
              <Typography variant="body1" fontWeight={500}>
                {deliveryRequest.pickupLocation?.address}
              </Typography>
              {deliveryRequest.pickupLocation?.name && (
                <Typography variant="body2" color="text.secondary">
                  {deliveryRequest.pickupLocation.name}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />

          {/* Dropoff */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2, bgcolor: 'error.light',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LocationIcon sx={{ color: 'error.dark', fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">DROPOFF</Typography>
              <Typography variant="body1" fontWeight={500}>
                {deliveryRequest.dropoffLocation?.address}
              </Typography>
              {deliveryRequest.dropoffLocation?.name && (
                <Typography variant="body2" color="text.secondary">
                  {deliveryRequest.dropoffLocation.name}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
          {[
            { label: 'Distance', value: formatDistance((deliveryRequest.distance ?? 0) * 1000) },
            { label: 'ETA',      value: formatETA(Math.round(((deliveryRequest.distance ?? 0) / 40) * 60)) },
            { label: 'Fare',     value: formatCurrency(deliveryRequest.estimatedFare ?? 0) },
          ].map(({ label, value }) => (
            <Paper key={label} elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} color={label === 'Fare' ? 'success.main' : 'primary.main'}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth variant="outlined" size="large" onClick={handleDecline}
            sx={{ height: 56, borderRadius: 3, fontWeight: 600, borderWidth: 2 }}
          >
            Decline
          </Button>
          <motion.div style={{ flex: 1 }} whileTap={{ scale: 0.98 }}>
            <Button
              fullWidth variant="contained" size="large" onClick={handleAccept}
              sx={{
                height: 56, borderRadius: 3, fontWeight: 600, fontSize: '1.1rem',
                color: 'white', bgcolor: '#F59E0B',
                '&:hover': { bgcolor: '#D97706' },
              }}
            >
              Accept
            </Button>
          </motion.div>
        </Box>
      </Box>
    </Dialog>
  );
};

export default DeliveryRequestModal;