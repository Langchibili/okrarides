'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { RIDE_STATUS } from '@/Constants';

export default function RidesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadRides();
  }, [activeTab, page]);

  const loadRides = async () => {
    try {
      setLoading(true);
      const status = ['completed', 'cancelled', 'all'][activeTab];
      const response = await apiClient.get('/driver/rides', {
        params: {
          status: status !== 'all' ? status : undefined,
          page,
          limit: 20,
          search: searchQuery,
        },
      });

      if (response.success) {
        if (page === 1) {
          setRides(response.rides);
        } else {
          setRides((prev) => [...prev, ...response.rides]);
        }
        setHasMore(response.hasMore);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
    setRides([]);
  };

  const handleSearch = () => {
    setPage(1);
    setRides([]);
    loadRides();
  };

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

  const RideCard = ({ ride }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          mb: 2,
          borderRadius: 3,
          cursor: 'pointer',
        }}
        onClick={() => router.push(`/rides/${ride.id}`)}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={ride.rider?.profilePicture}
              sx={{ width: 40, height: 40, mr: 2 }}
            >
              {ride.rider?.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {ride.rider?.firstName} {ride.rider?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(ride.createdAt)}
              </Typography>
            </Box>
            <Chip
              label={ride.status}
              color={getStatusColor(ride.status)}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Locations */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <MyLocationIcon sx={{ fontSize: 18, color: 'success.main' }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {ride.pickupLocation.address}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <LocationIcon sx={{ fontSize: 18, color: 'error.main' }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {ride.dropoffLocation.address}
              </Typography>
            </Box>
          </Box>

          {/* Stats */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {ride.actualDistance?.toFixed(1) || ride.estimatedDistance?.toFixed(1)} km
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {Math.round((ride.actualDuration || ride.estimatedDuration) / 60)} min
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Fare
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'success.main' }}
              >
                {formatCurrency(ride.totalFare)}
              </Typography>
            </Box>
          </Box>

          {/* Subscription indicator */}
          {ride.wasSubscriptionRide && (
            <Chip
              label="📦 Subscription Ride (0% Commission)"
              size="small"
              sx={{
                mt: 1,
                bgcolor: 'success.light',
                color: 'success.dark',
                fontWeight: 600,
              }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Ride History
          </Typography>
        </Toolbar>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="inherit"
          TabIndicatorProps={{
            sx: { bgcolor: 'white', height: 3 },
          }}
        >
          <Tab label="Completed" />
          <Tab label="Cancelled" />
          <Tab label="All" />
        </Tabs>
      </AppBar>

      <Box sx={{ p: 2 }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search by rider name, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSearch}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Rides List */}
        {loading && rides.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : rides.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No rides found
          </Alert>
        ) : (
          <>
            {rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}

            {/* Load More */}
            {hasMore && (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Load More'}
              </Button>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}