'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Avatar,
  Divider,
  IconButton,
  Button,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  Receipt as ReceiptIcon,
  Navigation as NavigationIcon,
} from '@mui/icons-material';
import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { RIDE_STATUS } from '@/Constants';

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRideDetails();
  }, [params.id]);

  const loadRideDetails = async () => {
    try {
      const response = await apiClient.get(`/rides/${params.id}`);
      if (response.success) {
        setRide(response.ride);
      }
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ride) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Ride not found</Alert>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case RIDE_STATUS.COMPLETED:
        return 'success';
      case RIDE_STATUS.CANCELLED:
        return 'error';
      default:
        return 'default';
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
            Ride Details
          </Typography>
          <Chip
            label={ride.status}
            color={getStatusColor(ride.status)}
            sx={{ color: 'white' }}
          />
        </Toolbar>
      </AppBar>

      {/* Map */}
      <Box sx={{ height: 250 }}>
        <GoogleMapIframe
          center={ride.pickupLocation}
          zoom={13}
          height="250px"
          pickupLocation={ride.pickupLocation}
          dropoffLocation={ride.dropoffLocation}
        />
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Rider Info */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Rider Information
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={ride.rider?.profilePicture}
              sx={{ width: 56, height: 56 }}
            >
              {ride.rider?.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {ride.rider?.firstName} {ride.rider?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ride.rider?.phoneNumber}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="body2">
                  {ride.rider?.averageRating || '5.0'} • {ride.rider?.totalRides || 0} rides
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Trip Details */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Trip Details
          </Typography>

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
                {ride.pickupLocation.address}
              </Typography>
              {ride.acceptedAt && (
                <Typography variant="caption" color="text.secondary">
                  Accepted: {formatDateTime(ride.acceptedAt)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Connecting line */}
          <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: 2.2, mb: 1 }} />

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
                {ride.dropoffLocation.address}
              </Typography>
              {ride.tripCompletedAt && (
                <Typography variant="caption" color="text.secondary">
                  Completed: {formatDateTime(ride.tripCompletedAt)}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Fare Breakdown */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Fare Breakdown
          </Typography>

          <List disablePadding>
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Base Fare" />
              <Typography>{formatCurrency(ride.baseFare || 0)}</Typography>
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Distance Fare" />
              <Typography>{formatCurrency(ride.distanceFare || 0)}</Typography>
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText primary="Time Fare" />
              <Typography>{formatCurrency(ride.timeFare || 0)}</Typography>
            </ListItem>
            {ride.surgeFare > 0 && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Surge" />
                <Typography color="warning.main">
                  +{formatCurrency(ride.surgeFare)}
                </Typography>
              </ListItem>
            )}
            {ride.promoDiscount > 0 && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Promo Discount" />
                <Typography color="success.main">
                  -{formatCurrency(ride.promoDiscount)}
                </Typography>
              </ListItem>
            )}
            <Divider sx={{ my: 1 }} />
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="Subtotal"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              <Typography fontWeight={600}>
                {formatCurrency(ride.subtotal || ride.totalFare)}
              </Typography>
            </ListItem>

            {/* Subscription vs Float Mode */}
            {ride.wasSubscriptionRide ? (
              <>
                <ListItem sx={{ px: 0, bgcolor: 'success.light', borderRadius: 2, mt: 1 }}>
                  <ListItemText
                    primary="Commission (Subscription Mode)"
                    secondary="You keep 100% of the fare!"
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Typography fontWeight={700} color="success.dark">
                    {formatCurrency(0)}
                  </Typography>
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Your Earnings"
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                  />
                  <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
                    {formatCurrency(ride.driverEarnings || ride.totalFare)}
                  </Typography>
                </ListItem>
              </>
            ) : (
              <>
                {ride.commission > 0 && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Commission (15%)" />
                    <Typography color="error.main">
                      -{formatCurrency(ride.commission)}
                    </Typography>
                  </ListItem>
                )}
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Your Earnings"
                    primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                  />
                  <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
                    {formatCurrency(ride.driverEarnings)}
                  </Typography>
                </ListItem>
              </>
            )}
          </List>

          {/* Payment Method */}
          <Chip
            label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`}
            sx={{ mt: 2, fontWeight: 600 }}
          />
        </Paper>

        {/* Trip Stats */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Trip Statistics
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
            }}
          >
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {ride.actualDistance?.toFixed(1) || ride.estimatedDistance?.toFixed(1)} km
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                {Math.round((ride.actualDuration || ride.estimatedDuration) / 60)} min
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Duration
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
