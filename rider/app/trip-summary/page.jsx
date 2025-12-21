'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ridesAPI } from '@/lib/api/rides';
import { RatingModal } from '@/components/Rider/RatingModal';
import { formatCurrency, formatDate, formatDistance, formatDuration } from '@/Functions';
import { Spinner } from '@/components/ui';

export default function TripSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideId = searchParams.get('rideId');

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    if (rideId) {
      loadRide();
    }
  }, [rideId]);

  const loadRide = async () => {
    try {
      setLoading(true);
      const data = await ridesAPI.getRide(rideId);
      setRide(data);
      
      // Show rating modal if not rated
      if (!data.rating) {
        setTimeout(() => setShowRating(true), 1000);
      }
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const receipt = await ridesAPI.getReceipt(rideId);
      // Create download link
      const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `okra-rides-receipt-${ride.rideCode}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download receipt');
    }
  };

  const handleShareTrip = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Okra Rides Trip',
          text: `Just completed a ride with Okra Rides! From ${ride.pickupLocation.address} to ${ride.dropoffLocation.address}`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  const handleRatingComplete = () => {
    setShowRating(false);
    loadRide(); // Reload to get updated rating
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
        <Button onClick={() => router.push('/home')} sx={{ mt: 2 }}>
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 4,
      }}
    >
      {/* Success Header */}
      <Box
        sx={{
          p: 4,
          pb: 6,
          background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <SuccessIcon sx={{ fontSize: '3rem' }} />
          </Box>
        </motion.div>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Trip Completed!
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Thank you for riding with Okra
        </Typography>
      </Box>

      <Box sx={{ px: 2, mt: -3 }}>
        {/* Fare Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 4,
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Total Fare
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', my: 1 }}>
                {formatCurrency(ride.totalFare)}
              </Typography>
              <Chip
                label={ride.paymentMethod === 'cash' ? 'Paid with Cash' : 'Paid with OkraPay'}
                size="small"
                color="success"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Fare Breakdown */}
            <Box>
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
                  Distance ({formatDistance(ride.actualDistance)})
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(ride.distanceFare || 0)}
                </Typography>
              </Box>
              {ride.timeFare > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Time ({formatDuration(ride.actualDuration)})
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(ride.timeFare)}
                  </Typography>
                </Box>
              )}
              {ride.surgeFare > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Surge Pricing
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
          </Paper>
        </motion.div>

        {/* Trip Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Trip Details
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDate(ride.completedAt || ride.createdAt, 'short')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDate(ride.completedAt || ride.createdAt, 'time')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Distance
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDistance(ride.actualDistance)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDuration(ride.actualDuration)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Route */}
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
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pickup
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {ride.pickupLocation.address}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: '5px', mb: 2 }} />

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
              <Box>
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
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Your Driver
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                    {ride.vehicle?.color} {ride.vehicle?.make} • {ride.vehicle?.numberPlate}
                  </Typography>
                </Box>
                {ride.rating ? (
                  <Chip
                    label={`⭐ ${ride.rating.rating}`}
                    color="success"
                    size="small"
                  />
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowRating(true)}
                  >
                    Rate
                  </Button>
                )}
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReceipt}
            sx={{ height: 48 }}
          >
            Receipt
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShareTrip}
            sx={{ height: 48 }}
          >
            Share
          </Button>
        </Box>

        {/* Home Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/home')}
            sx={{ height: 56, fontSize: '1rem', fontWeight: 600 }}
          >
            Back to Home
          </Button>
        </motion.div>
      </Box>

      {/* Rating Modal */}
      {ride.driver && (
        <RatingModal
          open={showRating}
          onClose={() => setShowRating(false)}
          ride={ride}
          driver={ride.driver}
        />
      )}
    </Box>
  );
}
