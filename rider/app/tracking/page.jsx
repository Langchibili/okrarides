'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Message as MessageIcon,
  Close as CancelIcon,
  Share as ShareIcon,
  MyLocation as LocationIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedMap } from '@/components/Map/OptimizedMap';
import { MapControls } from '@/components/Map/MapControls';
import { GoogleMapProvider } from '@/components/Map/GoogleMapProvider';
import { createCarMarker, createCustomMarker } from '@/components/Map/CustomMarkers';
import { useRide } from '@/lib/hooks/useRide';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { formatCurrency, formatDistance, generateShareLink, copyToClipboard } from '@/Functions';
import { RIDE_STATUS } from '@/Constants';
import { Spinner } from '@/components/ui';

export default function TrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideId = searchParams.get('rideId');
  
  const { ride, loading, loadRide, cancelRide } = useRide(rideId);
  const { connected, on, off, joinRoom, leaveRoom } = useWebSocket();
  
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [eta, setEta] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const mapRef = useRef(null);

  // Load ride data
  useEffect(() => {
    if (rideId) {
      loadRide(rideId);
    }
  }, [rideId]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!connected || !rideId) return;

    // Join ride room
    joinRoom(`ride_${rideId}`);

    // Listen for driver location updates
    on('driver_location', (data) => {
      setDriverLocation({
        lat: data.latitude,
        lng: data.longitude,
        heading: data.heading,
      });
      setEta(data.eta);
    });

    // Listen for ride status updates
    on('ride_status', (data) => {
      if (data.status === RIDE_STATUS.COMPLETED) {
        router.push(`/trip-summary?rideId=${rideId}`);
      } else if (data.status === RIDE_STATUS.CANCELLED) {
        router.push('/home');
      }
    });

    return () => {
      off('driver_location');
      off('ride_status');
      leaveRoom(`ride_${rideId}`);
    };
  }, [connected, rideId, on, off, joinRoom, leaveRoom, router]);

  // Set initial map center
  useEffect(() => {
    if (ride?.pickupLocation) {
      setMapCenter({
        lat: ride.pickupLocation.latitude,
        lng: ride.pickupLocation.longitude,
      });
    }
  }, [ride]);

  const handleCancelRide = async () => {
    if (!confirm('Are you sure you want to cancel this ride?')) return;
    
    try {
      await cancelRide(rideId, 'Changed my mind');
      router.push('/home');
    } catch (error) {
      alert('Failed to cancel ride. Please try again.');
    }
  };

  const handleShareTrip = async () => {
    const shareLink = generateShareLink(rideId);
    const shared = await copyToClipboard(shareLink);
    
    if (shared && navigator.share) {
      try {
        await navigator.share({
          title: 'Track My Ride',
          text: 'Follow my ride in real-time',
          url: shareLink,
        });
      } catch (error) {
        alert('Link copied to clipboard!');
      }
    } else {
      alert('Link copied to clipboard!');
    }
  };

  const handleCallDriver = () => {
    if (ride?.driver?.phoneNumber) {
      window.location.href = `tel:${ride.driver.phoneNumber}`;
    }
  };

  const handleMessageDriver = () => {
    if (ride?.driver?.phoneNumber) {
      window.location.href = `sms:${ride.driver.phoneNumber}`;
    }
  };

  const getStatusMessage = () => {
    switch (ride?.status) {
      case RIDE_STATUS.ACCEPTED:
        return `${ride.driver?.firstName} is on the way`;
      case RIDE_STATUS.ARRIVED:
        return 'Driver has arrived';
      case RIDE_STATUS.PASSENGER_ONBOARD:
        return 'Trip in progress';
      default:
        return 'Tracking your ride';
    }
  };

  // const getMarkers = () => {
  //   const markers = [];

  //   // Pickup marker
  //   if (ride?.pickupLocation) {
  //     markers.push({
  //       id: 'pickup',
  //       position: {
  //         lat: ride.pickupLocation.latitude,
  //         lng: ride.pickupLocation.longitude,
  //       },
  //       icon: createCustomMarker('pickup'),
  //       title: 'Pickup Location',
  //     });
  //   }

  //   // Dropoff marker
  //   if (ride?.dropoffLocation) {
  //     markers.push({
  //       id: 'dropoff',
  //       position: {
  //         lat: ride.dropoffLocation.latitude,
  //         lng: ride.dropoffLocation.longitude,
  //       },
  //       icon: createCustomMarker('dropoff'),
  //       title: 'Dropoff Location',
  //     });
  //   }

  //   // Driver marker
  //   if (driverLocation) {
  //     markers.push({
  //       id: 'driver',
  //       position: driverLocation,
  //       icon: createCarMarker(driverLocation.heading || 0, '#FFC107'),
  //       title: `${ride?.driver?.firstName}'s Location`,
  //     });
  //   }

  //   return markers;
  // };

  // In app/tracking/page.jsx, update the getMarkers function:

const getMarkers = () => {
  const markers = [];
  
  // Pickup marker
  if (ride?.pickupLocation) {
    markers.push({
      id: 'pickup',
      position: { lat: ride.pickupLocation.latitude, lng: ride.pickupLocation.longitude },
      icon: createCustomMarker('pickup'), // No theme parameter
      title: 'Pickup Location',
    });
  }
  
  // Dropoff marker
  if (ride?.dropoffLocation) {
    markers.push({
      id: 'dropoff',
      position: { lat: ride.dropoffLocation.latitude, lng: ride.dropoffLocation.longitude },
      icon: createCustomMarker('dropoff'), // No theme parameter
      title: 'Dropoff Location',
    });
  }
  
  // Driver marker
  if (driverLocation) {
    markers.push({
      id: 'driver',
      position: driverLocation,
      icon: createCarMarker(driverLocation.heading || 0, '#FFC107'),
      title: `${ride?.driver?.firstName}'s Location`,
    });
  }
  
  return markers;
}

  if (loading && !ride) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Spinner />
      </Box>
    );
  }

  if (!ride) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        <Typography>Ride not found</Typography>
        <Button onClick={() => router.push('/home')} sx={{ mt: 2 }}>
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Map */}
      <GoogleMapProvider>
        <OptimizedMap
          center={mapCenter || { lat: -15.4167, lng: 28.2833 }}
          zoom={15}
          markers={getMarkers()}
          onMapLoad={(map) => {
            mapRef.current = map;
          }}
        />
      </GoogleMapProvider>

      {/* Map Controls */}
      <MapControls
        onLocateMe={() => {
          if (driverLocation && mapRef.current) {
            mapRef.current.animateToLocation(driverLocation, 16);
          }
        }}
        onZoomIn={() => mapRef.current?.map?.setZoom((mapRef.current?.map?.getZoom() || 15) + 1)}
        onZoomOut={() => mapRef.current?.map?.setZoom((mapRef.current?.map?.getZoom() || 15) - 1)}
        style={{ bottom: 280 }}
      />

      {/* Top Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {getStatusMessage()}
            </Typography>
            {eta && (
              <Typography variant="caption" color="text.secondary">
                ETA: {eta} min
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleShareTrip}>
            <ShareIcon />
          </IconButton>
        </Box>
        
        {/* Connection status */}
        {!connected && (
          <Chip
            label="Reconnecting..."
            size="small"
            color="warning"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            p: 3,
            maxHeight: '50vh',
            overflow: 'auto',
          }}
        >
          {/* Driver Info */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Avatar
              src={ride.driver?.profilePicture}
              sx={{ width: 64, height: 64 }}
            >
              {ride.driver?.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {ride.driver?.firstName} {ride.driver?.lastName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ⭐ {ride.driver?.driverProfile?.averageRating?.toFixed(1) || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {ride.vehicle?.color} {ride.vehicle?.make} {ride.vehicle?.model}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {ride.vehicle?.numberPlate}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handleCallDriver}
                sx={{ bgcolor: 'success.light' }}
              >
                <PhoneIcon />
              </IconButton>
              <IconButton
                onClick={handleMessageDriver}
                sx={{ bgcolor: 'primary.light' }}
              >
                <MessageIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Trip Progress */}
          {ride.status === RIDE_STATUS.PASSENGER_ONBOARD && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Trip Progress
                </Typography>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                  {formatDistance(ride.actualDistance || 0)} / {formatDistance(ride.estimatedDistance)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={((ride.actualDistance || 0) / ride.estimatedDistance) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Route Info */}
          <Box sx={{ mb: 3 }}>
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
          </Box>

          {/* Fare */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              mb: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Estimated Fare
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {formatCurrency(ride.totalFare)}
            </Typography>
          </Box>

          {/* Cancel Button */}
          {[RIDE_STATUS.ACCEPTED, RIDE_STATUS.ARRIVED].includes(ride.status) && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancelRide}
              sx={{ height: 48 }}
            >
              Cancel Ride
            </Button>
          )}
        </Paper>
      </motion.div>
    </Box>
  );
}

