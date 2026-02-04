'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  IconButton,
  Avatar,
  Fab,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Phone as PhoneIcon,
  Navigation as NavigationIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GoogleMapIframe } from '@/components/Map/GoogleMapIframe';
import { useRide } from '@/lib/hooks/useRide';
import { formatCurrency, formatDistance } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/Constants';

export default function ActiveRidePage() {
  const params = useParams();
  const router = useRouter();
  const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
  const { updateLocation } = useSocket();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRideDetails();
  }, [params.id]);

  // Add location tracking
  useEffect(() => {
    if (!ride || ride.rideStatus === 'completed' || ride.rideStatus === 'cancelled') return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        const heading = position.coords.heading || 0;
        const speed = position.coords.speed || 0;

        // Update socket
        updateLocation(location, heading, speed);
      },
      (error) => {
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [ride?.rideStatus, updateLocation]);

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

  const handleStartTrip = async () => {
    try {
      await startTrip(ride.id);
      loadRideDetails();
    } catch (error) {
      console.error('Error starting trip:', error);
    }
  };

  const handleCompleteTrip = async () => {
    if (window.confirm('Complete this ride?')) {
      try {
        await completeTrip(ride.id, {
          // Add completion data
        });
        router.push('/home');
      } catch (error) {
        console.error('Error completing trip:', error);
      }
    }
  };

  const handleConfirmArrival = async (type) => {
    try {
      await confirmArrival(ride.id, type);
      loadRideDetails();
    } catch (error) {
      console.error('Error confirming arrival:', error);
    }
  };

  const handleNavigate = () => {
    const destination = ride.rideStatus === 'accepted' || ride.rideStatus === 'arrived'
      ? ride.pickupLocation
      : ride.dropoffLocation;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    window.open(url, '_blank');
  };

  if (loading || !ride) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Active Ride
          </Typography>
          <IconButton color="inherit" href={`tel:${ride.rider?.phoneNumber}`}>
            <PhoneIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <GoogleMapIframe
          center={ride.pickupLocation}
          zoom={15}
          height="100%"
          pickupLocation={ride.pickupLocation}
          dropoffLocation={ride.dropoffLocation}
        />

        {/* Navigate FAB */}
        <Fab
          color="primary"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
          onClick={handleNavigate}
        >
          <NavigationIcon />
        </Fab>
      </Box>

      {/* Ride Info Bottom Sheet */}
      <Paper
        elevation={8}
        sx={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          p: 3,
          maxHeight: '50vh',
          overflow: 'auto',
        }}
      >
        {/* Rider Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={ride.rider?.profilePicture} sx={{ width: 56, height: 56 }}>
            {ride.rider?.firstName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {ride.rider?.firstName} {ride.rider?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ⭐ {ride.rider?.averageRating || '5.0'} • {ride.rider?.totalRides || 0} rides
            </Typography>
          </Box>
        </Box>

        {/* Trip Details */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            PICKUP
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {ride.pickupLocation.address}
          </Typography>
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            DROPOFF
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {ride.dropoffLocation.address}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main">
                {formatDistance(ride.estimatedDistance * 1000)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
            </Paper>
            <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {formatCurrency(ride.totalFare)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fare
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Action Buttons */}
        {ride.rideStatus === 'accepted' && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => handleConfirmArrival('pickup')}
            sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
          >
            I've Arrived
          </Button>
        )}

        {ride.rideStatus === 'arrived' && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleStartTrip}
            startIcon={<CheckIcon />}
            sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
          >
            Start Trip
          </Button>
        )}

        {ride.rideStatus === 'passenger_onboard' && (
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            onClick={handleCompleteTrip}
            startIcon={<CheckIcon />}
            sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
          >
            Complete Trip
          </Button>
        )}
      </Paper>
    </Box>
  );
}

