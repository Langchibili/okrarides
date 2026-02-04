//rider\app\(main)\trips\[id]\page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Divider,
  Button,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Report as ReportIcon,
  Share as ShareIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ridesAPI } from '@/lib/api/rides';
import { formatCurrency, formatDate, formatDistance, formatDuration } from '@/Functions';
import { RIDE_STATUS_LABELS, RIDE_STATUS_COLORS } from '@/Constants';
import { Spinner } from '@/components/ui';

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRide();
  }, [params.id]);

  const loadRide = async () => {
  try {
    setLoading(true);
    const response = await ridesAPI.getRide(params.id);
    console.log('response',response)
    // Handle both data structures
    const rideData = response.success ? response.data : response;
    setRide(rideData);
  } catch (error) {
    console.error('Error loading ride:', error);
  } finally {
    setLoading(false);
  }
};

  const handleGetReceipt = () => {
    router.push(`/trips/${params.id}/receipt`);
  };

  const handleShareTrip = () => {
    if (navigator.share) {
      navigator.share({
        title: 'OkraRides Trip',
        text: `Trip from ${ride.pickupLocation.address} to ${ride.dropoffLocation.address}`,
        url: window.location.href,
      });
    }
  };

  const handleReportIssue = () => {
    router.push(`/trips/${params.id}/report`);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Spinner />
      </Box>
    );
  }

  if (!ride) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        <Typography>Trip not found</Typography>
      </Box>
    );
  }

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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Trip Details
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ride.rideCode}
          </Typography>
        </Box>
        <IconButton onClick={handleShareTrip}>
          <ShareIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Chip
                label={RIDE_STATUS_LABELS[ride.rideStatus]}
                sx={{
                  bgcolor: `${RIDE_STATUS_COLORS[ride.rideStatus]}20`,
                  color: RIDE_STATUS_COLORS[ride.rideStatus],
                  fontWeight: 600,
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatCurrency(ride.totalFare)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(ride.createdAt, 'long')} • {formatDate(ride.createdAt, 'time')}
            </Typography>
          </Paper>
        </motion.div>

        {/* Trip Route */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Trip Route
            </Typography>
            
            {/* Pickup */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  mt: 0.5,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Pickup
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                   {ride.pickupLocation?.address || 'N/A'}
                </Typography>
              </Box>
            </Box>

            {/* Line */}
            <Box
              sx={{
                width: 2,
                height: 24,
                bgcolor: 'divider',
                ml: '5px',
                mb: 2,
              }}
            />

            {/* Dropoff */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 1,
                  bgcolor: 'error.main',
                  mt: 0.5,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Dropoff
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {ride.dropoffLocation.address}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Driver Info */}
        {ride.driver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Driver
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={ride.driver.profilePicture}
                  sx={{ width: 56, height: 56 }}
                >
                  {ride.driver.firstName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {ride.driver.firstName} {ride.driver.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ⭐ {ride.driver.driverProfile?.averageRating?.toFixed(1) || 'N/A'}
                  </Typography>
                </Box>
                <IconButton>
                  <PhoneIcon />
                </IconButton>
                <IconButton>
                  <MessageIcon />
                </IconButton>
              </Box>
              
              {ride.vehicle && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Vehicle
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      Plate
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ride.vehicle.numberPlate}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}

        {/* Trip Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Trip Details
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Distance
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatDistance(ride.actualDistance || ride.estimatedDistance || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatDuration(ride.actualDuration || ride.estimatedDuration || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Payment
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {ride.paymentMethod === 'cash' ? 'Cash' : 'OkraPay'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Ride Type
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {ride.taxiType?.name || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Fare Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Fare Breakdown
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Base Fare
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(ride.baseFare || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Distance Fare
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(ride.distanceFare || 0)}
                </Typography>
              </Box>
              {ride.surgeFare > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Surge
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(ride.surgeFare)}
                  </Typography>
                </Box>
              )}
              {ride.promoDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="success.main">
                    Promo Discount
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -{formatCurrency(ride.promoDiscount)}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatCurrency(ride.totalFare)}
              </Typography>
            </Box>
          </Paper>
        </motion.div>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={handleGetReceipt}
            sx={{ height: 48 }}
          >
            Get Receipt
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<ReportIcon />}
            onClick={handleReportIssue}
            sx={{ height: 48 }}
          >
            Report Issue
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

