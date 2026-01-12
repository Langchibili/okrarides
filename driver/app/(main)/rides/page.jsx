'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  Chip,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ridesAPI } from '@/lib/api/rides';
import { formatCurrency, formatDate, getRelativeTime } from '@/Functions';
import { RIDE_STATUS, RIDE_STATUS_LABELS, RIDE_STATUS_COLORS } from '@/Constants';
import { EmptyState, Spinner } from '@/components/ui';

export default function TripsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const statusFilters = [
    { label: 'All', value: null },
    { label: 'Completed', value: RIDE_STATUS.COMPLETED },
    { label: 'Cancelled', value: RIDE_STATUS.CANCELLED },
  ];

  const currentFilter = statusFilters[activeTab].value;

  // Load rides
  useEffect(() => {
    loadRides();
  }, [activeTab]);

  const loadRides = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await ridesAPI.getRideHistory({
        page: pageNum,
        limit: 20,
        rideStatus: currentFilter, // CHANGED from 'status'
      });

      console.log('Rides response:', response);

      if (response.success || response?.data) {
        if (pageNum === 1) {
          setRides(response.data || []);
        } else {
          setRides(prev => [...prev, ...(response.data || [])]);
        }
        setHasMore((response.data || []).length === 20);
        setPage(pageNum);
      } else {
        console.error('Failed to load rides:', response.error);
        setRides([]);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const handleLoadMore = () => {
    loadRides(page + 1);
  };

  const handleRideClick = (rideId) => {
    router.push(`/rides/${rideId}`);
  };

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
          p: 3,
          pt: 4,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          My Trips
        </Typography>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          {statusFilters.map((filter) => (
            <Tab key={filter.label} label={filter.label} />
          ))}
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {loading && page === 1 ? (
          <Spinner />
        ) : rides.length === 0 ? (
          <EmptyState
            icon={<CarIcon sx={{ fontSize: '4rem' }} />}
            title="No trips yet"
            description={
              currentFilter
                ? `You don't have any ${statusFilters[activeTab].label.toLowerCase()} trips`
                : "Book your first ride to get started"
            }
            action={() => router.push('/home')}
            actionLabel="Book a Ride"
          />
        ) : (
          <>
            <List disablePadding>
              {rides.map((ride, index) => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Paper
                    onClick={() => handleRideClick(ride.id)}
                    sx={{
                      mb: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        p: 2,
                      }}
                    >
                      {/* Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={RIDE_STATUS_LABELS[ride.rideStatus] || ride.rideStatus}
                          size="small"
                          sx={{
                            bgcolor: `${RIDE_STATUS_COLORS[ride.rideStatus] || '#9E9E9E'}20`,
                            color: RIDE_STATUS_COLORS[ride.rideStatus] || '#9E9E9E',
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {getRelativeTime(ride.createdAt)}
                        </Typography>
                      </Box>

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


                      {/* Footer */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          pt: 2,
                          borderTop: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(ride.createdAt, 'short')}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: 'primary.main' }}
                        >
                          {formatCurrency(ride.totalFare || 0)}
                        </Typography>
                      </Box>
                    </ListItem>
                  </Paper>
                </motion.div>
              ))}
            </List>

            {/* Load More */}
            {hasMore && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                {loading ? (
                  <Spinner size={32} />
                ) : (
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Box
                      onClick={handleLoadMore}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.selected',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Load More
                      </Typography>
                    </Box>
                  </motion.div>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}