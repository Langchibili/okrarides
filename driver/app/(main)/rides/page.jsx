'use client';
// PATH: app/(main)/rides/page.jsx — styled like rider trips, adapted for driver

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter }           from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Tabs, Tab,
  Paper, Chip, CircularProgress, List, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  DirectionsCar as CarIcon,
  TrendingUp as TrendingIcon,
  MyLocation as PickupIcon,
  LocationOn as DropIcon,
  ChevronRight as ChevronIcon,
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

const GREEN = '#10B981';

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
            ? `linear-gradient(135deg, ${alpha('#10B981', 0.15)} 0%, ${alpha('#3B82F6', 0.08)} 100%)`
            : `linear-gradient(135deg, ${alpha('#10B981', 0.1)} 0%, ${alpha('#3B82F6', 0.06)} 100%)`,
          border: `1px solid ${alpha('#10B981', isDark ? 0.2 : 0.15)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CarIcon sx={{ fontSize: 40, color: alpha('#10B981', 0.5) }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>No rides yet</Typography>
        <Typography variant="body2" color="text.secondary">
          {filter
            ? `No ${STATUS_FILTERS.find(f => f.value === filter)?.label.toLowerCase()} rides found.`
            : 'Your completed rides will appear here.'}
        </Typography>
      </Box>
    </motion.div>
  );
}

// ── Ride card — styled like rider TripCard ────────────────────────────────────
function RideCard({ ride, index, onClick }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const statusColor = STATUS_HEX[ride.rideStatus] ?? '#9CA3AF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.32), ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Paper elevation={0} sx={{
        mb: 1.5, borderRadius: 3, overflow: 'hidden',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        boxShadow: isDark
          ? `0 4px 20px rgba(0,0,0,0.35)`
          : `0 4px 20px rgba(0,0,0,0.06)`,
        transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${statusColor}30`
            : `0 10px 28px rgba(0,0,0,0.1), 0 0 0 1px ${statusColor}35`,
        },
        // Left status accent bar
        '&::before': {
          content: '""',
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: `linear-gradient(180deg, ${statusColor} 0%, ${alpha(statusColor, 0.5)} 100%)`,
          borderRadius: '3px 0 0 3px',
        },
      }}>
        {/* Top color strip */}
        <Box sx={{ height: 2.5, background: `linear-gradient(90deg, ${statusColor} 0%, ${alpha(statusColor, 0.2)} 100%)` }} />

        <Box sx={{ p: 2, pl: 2.5 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Chip
              label={RIDE_STATUS_LABELS[ride.rideStatus] || ride.rideStatus}
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${alpha(statusColor, isDark ? 0.22 : 0.12)} 0%, ${alpha(statusColor, isDark ? 0.12 : 0.06)} 100%)`,
                color: statusColor, fontWeight: 700, fontSize: '0.68rem',
                letterSpacing: 0.3, border: `1px solid ${alpha(statusColor, 0.25)}`,
                borderRadius: 1.5, height: 22,
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', fontWeight: 500 }}>
              {getRelativeTime(ride.createdAt)}
            </Typography>
          </Box>

          {/* Route */}
          <Box sx={{ mb: 1.5 }}>
            {/* Pickup */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.25 }}>
                <Box sx={{
                  width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0,
                  boxShadow: `0 0 0 3px ${alpha('#10B981', 0.18)}`,
                }} />
                <Box sx={{
                  width: 1.5, flex: 1, minHeight: 16, mt: 0.5, mb: 0.5,
                  background: `repeating-linear-gradient(180deg, ${alpha(isDark ? '#fff' : '#000', 0.18)} 0px, ${alpha(isDark ? '#fff' : '#000', 0.18)} 3px, transparent 3px, transparent 6px)`,
                }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.62rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Pickup
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                  {ride.pickupLocation?.address || 'N/A'}
                </Typography>
                {ride.pickupLocation?.name && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontSize: '0.7rem' }}>
                    {ride.pickupLocation.name}
                  </Typography>
                )}
                {ride.acceptedAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', fontSize: '0.68rem' }}>
                    {formatDateTime(ride.acceptedAt)}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Dropoff */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{
                width: 10, height: 10, borderRadius: 0.8, bgcolor: '#EF4444', flexShrink: 0, mt: 0.25,
                boxShadow: `0 0 0 3px ${alpha('#EF4444', 0.18)}`,
              }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.62rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Dropoff
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                  {ride.dropoffLocation?.address || 'N/A'}
                </Typography>
                {ride.dropoffLocation?.name && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontSize: '0.7rem' }}>
                    {ride.dropoffLocation.name}
                  </Typography>
                )}
                {ride.tripCompletedAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', fontSize: '0.68rem' }}>
                    {formatDateTime(ride.tripCompletedAt)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            pt: 1.25, borderTop: `1px solid ${alpha(isDark ? '#fff' : '#000', isDark ? 0.06 : 0.05)}`,
          }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, fontSize: '0.68rem' }}>
              {formatDate(ride.createdAt, 'short')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: -0.3, fontSize: '0.95rem',
              }}>
                {formatCurrency(ride.totalFare || 0)}
              </Typography>
              <ChevronIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
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

  const [activeTab,   setActiveTab]   = useState(0);
  const [rides,       setRides]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);

  const sentinelRef   = useRef(null);
  const isFetchingRef = useRef(false);
  const currentFilter = STATUS_FILTERS[activeTab].value;

  const loadRides = useCallback(async (pageNum = 1) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (pageNum === 1) setLoading(true);
      else               setLoadingMore(true);
      const response = await ridesAPI.getRideHistory({ page: pageNum, limit: 20, rideStatus: currentFilter });
      const data = response?.data || [];
      if (pageNum === 1) setRides(data);
      else               setRides(prev => [...prev, ...data]);
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading rides:', err);
      if (pageNum === 1) setRides([]);
    } finally {
      setLoading(false); setLoadingMore(false); isFetchingRef.current = false;
    }
  }, [currentFilter]);

  useEffect(() => { setPage(1); setHasMore(true); loadRides(1); }, [activeTab]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) loadRides(page + 1);
      },
      { threshold: 0.1, rootMargin: '80px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, loadRides]);

  const appBarBg = isDark
    ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
    : `linear-gradient(135deg, #065F46 0%, #059669 100%)`;

  return (
    <Box sx={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      bgcolor: 'background.default', overflow: 'hidden',
    }}>
      {/* ── Fixed Header ─────────────────────────────────────────────── */}
      <Box sx={{
        flexShrink: 0, position: 'relative',
        background: isDark
          ? 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)'
          : 'linear-gradient(160deg, #065F46 0%, #047857 100%)',
        borderBottom: `1px solid ${alpha(isDark ? GREEN : '#A7F3D0', 0.15)}`,
        boxShadow: isDark
          ? `0 4px 24px rgba(0,0,0,0.5)`
          : `0 4px 24px ${alpha('#059669', 0.3)}`,
        zIndex: 10, pt: 3, pb: 0, px: 2.5,
      }}>
        {/* Top accent strip */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #10B981 100%)',
        }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2,
            background: isDark
              ? `linear-gradient(135deg, #10B981 0%, #059669 100%)`
              : `linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)`,
            border: isDark ? 'none' : `1px solid rgba(255,255,255,0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDark ? `0 4px 12px ${alpha('#10B981', 0.4)}` : 'none',
          }}>
            <TrendingIcon sx={{ fontSize: 20, color: isDark ? '#fff' : 'rgba(255,255,255,0.9)' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{
              fontWeight: 800, lineHeight: 1, letterSpacing: -0.5,
              color: isDark ? 'text.primary' : '#fff',
            }}>
              My Rides
            </Typography>
            <Typography variant="caption" sx={{
              fontWeight: 500,
              color: isDark ? 'text.disabled' : 'rgba(255,255,255,0.7)',
            }}>
              {rides.length > 0 ? `${rides.length}+ rides` : 'Your ride history'}
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v); setPage(1); }}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': {
              height: 3, borderRadius: '3px 3px 0 0',
              background: isDark
                ? 'linear-gradient(90deg, #10B981 0%, #3B82F6 100%)'
                : 'rgba(255,255,255,0.9)',
            },
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
              minHeight: 44, letterSpacing: 0.1,
              color: isDark ? alpha('#fff', 0.45) : 'rgba(255,255,255,0.6)',
              transition: 'color 0.2s',
              '&.Mui-selected': {
                color: isDark ? '#10B981' : '#fff',
                fontWeight: 700,
              },
            },
          }}
        >
          {STATUS_FILTERS.map((f, i) => (
            <Tab key={i} label={f.label} sx={{ fontWeight: 600, fontSize: 13, minHeight: 48 }} />
          ))}
        </Tabs>
      </Box>

      {/* ── Scrollable Body ──────────────────────────────────────────── */}
      <Box
        sx={{ flex: 1, overflowY: 'auto', px: 2, pt: 2, pb: 3, ...hideScrollbar }}
        onTouchStart={(e) => { e.currentTarget._touchStartX = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const startX = e.currentTarget._touchStartX;
          if (startX == null) return;
          const diff = startX - e.changedTouches[0].clientX;
          if (diff > 60 && activeTab < STATUS_FILTERS.length - 1) setActiveTab(t => t + 1);
          else if (diff < -60 && activeTab > 0) setActiveTab(t => t - 1);
          e.currentTarget._touchStartX = null;
        }}
      >
        <AnimatePresence mode="wait">
          {loading && page === 1 ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RidesListSkeleton />
            </motion.div>
          ) : rides.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState filter={currentFilter} />
            </motion.div>
          ) : (
            <motion.div key={`tab-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {rides.map((ride, i) => (
                <RideCard key={ride.id} ride={ride} index={i} onClick={() => router.push(`/rides/${ride.id}`)} />
              ))}

              {hasMore && (
                <Box ref={sentinelRef} sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                  {loadingMore ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #3B82F6)' }} />
                          </motion.div>
                        ))}
                      </Box>
                    </motion.div>
                  ) : (
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Box onClick={() => loadRides(page + 1)} sx={{
                        py: 1.75, px: 4, borderRadius: 3, cursor: 'pointer',
                        border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}`,
                        bgcolor: 'action.hover',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: 'action.selected' },
                      }}>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">Load More</Typography>
                      </Box>
                    </motion.div>
                  )}
                </Box>
              )}

              {!hasMore && rides.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: 0.5 }}>
                      ✓ All {rides.length} rides loaded
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