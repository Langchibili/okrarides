'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter }           from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Tabs, Tab,
  Paper, Chip, CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  DirectionsCar as CarIcon,
  CheckCircle   as DoneIcon,
  Cancel        as CancelIcon,
  MyLocation    as PickupIcon,
  LocationOn    as DropIcon,
  ChevronRight  as ChevronIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ridesAPI }              from '@/lib/api/rides';
import { formatCurrency, formatDate, getRelativeTime, formatDateTime } from '@/Functions';
import { RIDE_STATUS, RIDE_STATUS_LABELS } from '@/Constants';
import { RidesListSkeleton }     from '@/components/Skeletons/RidesListSkeleton';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

const STATUS_FILTERS = [
  { label: 'All',       value: null                  },
  { label: 'Completed', value: RIDE_STATUS.COMPLETED },
  { label: 'Cancelled', value: RIDE_STATUS.CANCELLED },
];

const STATUS_HEX = {
  completed:         '#10B981',
  cancelled:         '#EF4444',
  accepted:          '#3B82F6',
  arrived:           '#059669',
  passenger_onboard: '#8B5CF6',
  awaiting_payment:  '#F59E0B',
};

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
        <Box sx={{
          width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 2.5,
          background: isDark
            ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(16,185,129,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(16,185,129,0.04) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CarIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>No trips yet</Typography>
        <Typography variant="body2" color="text.secondary">
          {filter
            ? `No ${STATUS_FILTERS.find(f => f.value === filter)?.label.toLowerCase()} trips found.`
            : 'Your completed rides will appear here.'}
        </Typography>
      </Box>
    </motion.div>
  );
}

// ── Single ride card ──────────────────────────────────────────────────────────
function RideCard({ ride, index, onClick }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hex    = STATUS_HEX[ride.rideStatus] ?? '#9CA3AF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26, delay: Math.min(index * 0.04, 0.32) }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Paper elevation={isDark ? 0 : 2} sx={{
        mb: 1.5, borderRadius: 3, overflow: 'hidden',
        border: `1px solid ${alpha(hex, isDark ? 0.2 : 0.1)}`,
        background: isDark
          ? `linear-gradient(145deg, ${alpha(hex, 0.07)} 0%, transparent 100%)`
          : `linear-gradient(145deg, ${alpha(hex, 0.03)} 0%, transparent 100%)`,
        transition: 'box-shadow 0.2s, transform 0.15s',
        '&:hover': {
          boxShadow: `0 6px 24px ${alpha(hex, 0.18)}`,
          transform: 'translateY(-1px)',
        },
      }}>
        {/* Status accent strip */}
        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${hex} 0%, ${alpha(hex, 0.25)} 100%)` }} />

        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
            <Chip
              label={RIDE_STATUS_LABELS[ride.rideStatus] || ride.rideStatus}
              size="small"
              sx={{
                bgcolor: alpha(hex, isDark ? 0.22 : 0.1),
                color: hex, fontWeight: 700, borderRadius: 2, height: 22, fontSize: 11,
              }}
            />
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
              {getRelativeTime(ride.createdAt)}
            </Typography>
          </Box>

          {/* Pickup row */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: 2, flexShrink: 0,
              bgcolor: alpha('#10B981', isDark ? 0.2 : 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PickupIcon sx={{ color: '#10B981', fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.disabled"
                sx={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                Pickup
              </Typography>
              <Typography variant="body2" fontWeight={600}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {ride.pickupLocation?.address || 'N/A'}
              </Typography>
              {ride.pickupLocation?.name && (
                <Typography variant="caption" color="text.secondary"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {ride.pickupLocation.name}
                </Typography>
              )}
              {ride.acceptedAt && (
                <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: 10 }}>
                  {formatDateTime(ride.acceptedAt)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Connector line */}
          <Box sx={{
            width: 2, height: 14,
            bgcolor: alpha(theme.palette.divider, isDark ? 0.4 : 0.35),
            ml: '16px', mb: 1,
            borderRadius: 1,
          }} />

          {/* Dropoff row */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: 2, flexShrink: 0,
              bgcolor: alpha('#EF4444', isDark ? 0.2 : 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DropIcon sx={{ color: '#EF4444', fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.disabled"
                sx={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                Dropoff
              </Typography>
              <Typography variant="body2" fontWeight={600}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {ride.dropoffLocation?.address || 'N/A'}
              </Typography>
              {ride.dropoffLocation?.name && (
                <Typography variant="caption" color="text.secondary"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {ride.dropoffLocation.name}
                </Typography>
              )}
              {ride.tripCompletedAt && (
                <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: 10 }}>
                  {formatDateTime(ride.tripCompletedAt)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            pt: 1.25, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}>
            <Typography variant="caption" color="text.disabled">
              {formatDate(ride.createdAt, 'short')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {formatCurrency(ride.totalFare || 0)}
              </Typography>
              <ChevronIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const router  = useRouter();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';

  const [activeTab,    setActiveTab]    = useState(0);
  const [rides,        setRides]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);

  const sentinelRef   = useRef(null);
  const isFetchingRef = useRef(false);

  const currentFilter = STATUS_FILTERS[activeTab].value;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const loadRides = useCallback(async (pageNum = 1) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (pageNum === 1) setLoading(true);
      else               setLoadingMore(true);

      const response = await ridesAPI.getRideHistory({
        page: pageNum, limit: 20, rideStatus: currentFilter,
      });

      const data = response?.data || [];
      if (pageNum === 1) setRides(data);
      else               setRides(prev => [...prev, ...data]);

      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading rides:', err);
      if (pageNum === 1) setRides([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [currentFilter]);

  // Reset + reload on tab change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadRides(1);
  }, [activeTab]);

  // ── Intersection observer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore && !loading) {
          loadRides(page + 1);
        }
      },
      { threshold: 0.1, rootMargin: '80px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, loadRides]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

      {/* ── AppBar ─────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>My Trips</Typography>
        </Toolbar>
        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v); setPage(1); }}
          variant="fullWidth"
          textColor="inherit"
          TabIndicatorProps={{ sx: { bgcolor: 'white', height: 3, borderRadius: '3px 3px 0 0' } }}
        >
          {STATUS_FILTERS.map((f, i) => (
            <Tab key={i} label={f.label} sx={{ fontWeight: 600, fontSize: 13, minHeight: 48 }} />
          ))}
        </Tabs>
      </AppBar>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      
      <Box  sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 3, ...hideScrollbar }}
        onTouchStart={(e) => {
          e.currentTarget._touchStartX = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const startX = e.currentTarget._touchStartX;
          if (startX == null) return;
          const diff = startX - e.changedTouches[0].clientX;
          if (diff > 60 && activeTab < STATUS_FILTERS.length - 1) {
            setActiveTab(t => t + 1);
          } else if (diff < -60 && activeTab > 0) {
            setActiveTab(t => t - 1);
          }
          e.currentTarget._touchStartX = null;
        }}>
        <AnimatePresence mode="wait">

          {/* Initial skeleton */}
          {loading && page === 1 ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RidesListSkeleton />
            </motion.div>

          /* Empty state */
          ) : rides.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState filter={currentFilter} />
            </motion.div>

          /* List */
          ) : (
            <motion.div key={`tab-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {rides.map((ride, i) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  index={i}
                  onClick={() => router.push(`/rides/${ride.id}`)}
                />
              ))}

              {/* ── Sentinel: intersection observer target ── */}
              {hasMore && (
                <Box ref={sentinelRef} sx={{ py: 1 }}>
                  {loadingMore ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={28} thickness={3} sx={{ color: '#10B981' }} />
                    </Box>
                  ) : (
                    /* Fallback manual "Load More" button */
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Box
                        onClick={() => loadRides(page + 1)}
                        sx={{
                          py: 1.75, borderRadius: 3, textAlign: 'center', cursor: 'pointer',
                          bgcolor: 'action.hover',
                          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          transition: 'background 0.15s',
                          '&:hover': { bgcolor: 'action.selected' },
                        }}
                      >
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                          Load More
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </Box>
              )}

              {/* End-of-list message */}
              {!hasMore && rides.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: 0.5 }}>
                      — All {rides.length} trips loaded —
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}