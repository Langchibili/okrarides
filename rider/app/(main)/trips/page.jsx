'use client';
// PATH: rider/app/(main)/trips/page.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  List,
  Chip,
  useTheme,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ShimmerDiv, ShimmerText, ShimmerTitle } from 'shimmer-effects-react';
import { ridesAPI } from '@/lib/api/rides';
import { formatCurrency, formatDate, getRelativeTime } from '@/Functions';
import { RIDE_STATUS, RIDE_STATUS_LABELS, RIDE_STATUS_COLORS } from '@/Constants';
import { EmptyState } from '@/components/ui';

// ─── Skeleton for a single trip card ─────────────────────────────────────────
const TripCardSkeleton = ({ shimmerMode }) => (
  <Box
    sx={{
      mb: 2,
      borderRadius: 3,
      overflow: 'hidden',
      bgcolor: 'background.paper',
      p: 2,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <ShimmerDiv mode={shimmerMode} height={26} width={90} rounded={1} />
      <ShimmerDiv mode={shimmerMode} height={16} width={70} rounded={1} />
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <ShimmerDiv mode={shimmerMode} height={12} width={12} rounded={1} />
      <ShimmerDiv mode={shimmerMode} height={14} width="75%" rounded={1} />
    </Box>
    <Box sx={{ ml: '5px', mb: 1.5 }}>
      <ShimmerDiv mode={shimmerMode} height={20} width={2} rounded={1} />
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <ShimmerDiv mode={shimmerMode} height={12} width={12} rounded={1} />
      <ShimmerDiv mode={shimmerMode} height={14} width="60%" rounded={1} />
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <ShimmerDiv mode={shimmerMode} height={14} width={80} rounded={1} />
      <ShimmerDiv mode={shimmerMode} height={22} width={60} rounded={1} />
    </Box>
  </Box>
);

const TripsSkeletonList = ({ shimmerMode }) => (
  <Box sx={{ pt: 1 }}>
    {[1, 2, 3, 4].map((i) => (
      <TripCardSkeleton key={i} shimmerMode={shimmerMode} />
    ))}
  </Box>
);

// ─── Single trip card ─────────────────────────────────────────────────────────
const TripCard = ({ ride, onClick, index }) => {
  const theme = useTheme();
  const statusColor = RIDE_STATUS_COLORS[ride.rideStatus] || '#9E9E9E';
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.98 }}
    >
      <Paper
        onClick={onClick}
        elevation={0}
        sx={{
          mb: 2,
          cursor: 'pointer',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.35)'
            : '0 4px 20px rgba(0,0,0,0.06)',
          transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: isDark
              ? `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${statusColor}30`
              : `0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px ${statusColor}40`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: `linear-gradient(180deg, ${statusColor} 0%, ${statusColor}80 100%)`,
            borderRadius: '3px 0 0 3px',
          },
        }}
      >
        <Box sx={{ p: 2, pl: 2.5 }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Chip
              label={RIDE_STATUS_LABELS[ride.rideStatus] || ride.rideStatus}
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${statusColor}22 0%, ${statusColor}12 100%)`,
                color: statusColor,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: 0.3,
                border: `1px solid ${statusColor}30`,
                borderRadius: 1.5,
                height: 24,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'text.disabled',
                fontSize: '0.7rem',
                fontWeight: 500,
              }}
            >
              {getRelativeTime(ride.createdAt)}
            </Typography>
          </Box>

          {/* Route */}
          <Box sx={{ mb: 1.5 }}>
            {/* Pickup */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.3 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    boxShadow: '0 0 0 3px rgba(76,175,80,0.18)',
                    flexShrink: 0,
                  }}
                />
                <Box
                  sx={{
                    width: 1.5,
                    flex: 1,
                    minHeight: 16,
                    background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 3px, transparent 3px, transparent 6px)',
                    mt: 0.5,
                    mb: 0.5,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase' }}
                >
                  From
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.82rem',
                  }}
                >
                  {ride.pickupLocation?.address || 'N/A'}
                </Typography>
              </Box>
            </Box>

            {/* Dropoff */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 0.8,
                  bgcolor: 'error.main',
                  flexShrink: 0,
                  mt: 0.3,
                  boxShadow: '0 0 0 3px rgba(244,67,54,0.18)',
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase' }}
                >
                  To
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.82rem',
                  }}
                >
                  {ride.dropoffLocation?.address || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 1.5,
              mt: 0.5,
              borderTop: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, fontSize: '0.7rem' }}>
              {formatDate(ride.createdAt, 'short')}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FFC107 10%, #FF8C00 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: -0.3,
                fontSize: '1.05rem',
              }}
            >
              {formatCurrency(ride.totalFare || 0)}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TripsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const shimmerMode = theme.palette.mode;

  const [activeTab, setActiveTab] = useState(0);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Intersection observer sentinel
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const statusFilters = [
    { label: 'All', value: null },
    { label: 'Completed', value: RIDE_STATUS.COMPLETED },
    { label: 'Cancelled', value: RIDE_STATUS.CANCELLED },
  ];

  const currentFilter = statusFilters[activeTab].value;

  useEffect(() => {
    loadRides();
  }, [activeTab]);

  // Intersection observer for automatic load-more
  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '80px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
  }, [hasMore, loading, loadingMore]);

  useEffect(() => {
    setupObserver();
    return () => observerRef.current?.disconnect();
  }, [setupObserver]);

  const loadRides = async (pageNum = 1) => {
    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);
      const response = await ridesAPI.getRideHistory({
        page: pageNum,
        limit: 20,
        rideStatus: currentFilter,
      });

      if (response.success || response?.data) {
        if (pageNum === 1) {
          setRides(response.data || []);
        } else {
          setRides((prev) => [...prev, ...(response.data || [])]);
        }
        setHasMore((response.data || []).length === 20);
        setPage(pageNum);
      } else {
        setRides([]);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
      setRides([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) loadRides(page + 1);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const handleRideClick = (rideId) => {
    router.push(`/trips/${rideId}`);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* ── Fixed Header ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          position: 'relative',
          background: isDark
            ? 'linear-gradient(160deg, #1A1A1A 0%, #141414 100%)'
            : 'linear-gradient(160deg, #FFFFFF 0%, #F8F6F0 100%)',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.06)',
          zIndex: 10,
          pt: 3,
          pb: 0,
          px: 2.5,
        }}
      >
        {/* Decorative accent line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #FFC107 0%, #FF8C00 50%, #FFC107 100%)',
            backgroundSize: '200% 100%',
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255,193,7,0.35)',
            }}
          >
            <TrendingIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1, letterSpacing: -0.5 }}>
              My Trips
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
              {rides.length > 0 ? `${rides.length}+ rides` : 'Your ride history'}
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: 'linear-gradient(90deg, #FFC107 0%, #FF8C00 100%)',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              minHeight: 44,
              letterSpacing: 0.1,
              color: 'text.disabled',
              transition: 'color 0.2s',
              '&.Mui-selected': {
                color: '#FFC107',
                fontWeight: 700,
              },
            },
          }}
        >
          {statusFilters.map((filter) => (
            <Tab key={filter.label} label={filter.label} />
          ))}
        </Tabs>
      </Box>

      {/* ── Scrollable Content ─────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 2,
          pt: 2,
          pb: 3,
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
       onTouchStart={(e) => {
        e.currentTarget._touchStartX = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const startX = e.currentTarget._touchStartX;
        if (startX == null) return;
        const diff = startX - e.changedTouches[0].clientX;
        if (diff > 60 && activeTab < statusFilters.length - 1) {   // ← statusFilters not STATUS_FILTERS
          setActiveTab(t => t + 1);
        } else if (diff < -60 && activeTab > 0) {
          setActiveTab(t => t - 1);
        }
        e.currentTarget._touchStartX = null;
      }}
      >
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TripsSkeletonList shimmerMode={shimmerMode} />
            </motion.div>
          ) : rides.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Box sx={{ pt: 6 }}>
                <EmptyState
                  icon={<CarIcon sx={{ fontSize: '4rem', opacity: 0.4 }} />}
                  title="No trips yet"
                  description={
                    currentFilter
                      ? `No ${statusFilters[activeTab].label.toLowerCase()} trips found`
                      : 'Book your first ride to get started'
                  }
                  action={() => router.push('/home')}
                  actionLabel="Book a Ride"
                />
              </Box>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <List disablePadding>
                {rides.map((ride, index) => (
                  <TripCard
                    key={ride.id}
                    ride={ride}
                    index={index}
                    onClick={() => handleRideClick(ride.id)}
                  />
                ))}
              </List>

              {/* Intersection sentinel & loading indicator */}
              {hasMore && (
                <Box ref={sentinelRef} sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                  {loadingMore && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FFC107, #FF8C00)',
                              }}
                            />
                          </motion.div>
                        ))}
                      </Box>
                    </motion.div>
                  )}
                </Box>
              )}

              {!hasMore && rides.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                    ✓ All trips loaded
                  </Typography>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}