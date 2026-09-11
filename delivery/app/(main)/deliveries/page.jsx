// PATH: driver/app/(main)/deliveries/page.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Tabs, Tab, Paper, Chip,
  CircularProgress, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  TrendingUp as TrendingIcon,
  LocalShipping as DeliveryIcon,
  MyLocation as PickupIcon,
  LocationOn as DropIcon,
  ChevronRight as ChevronIcon,
  Inventory as PackageIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { deliveriesAPI } from '@/lib/api/deliveries';
import { formatCurrency, formatDate, getRelativeTime, formatDateTime } from '@/Functions';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };
const GREEN = '#F59E0B'; // amber for delivery brand

const STATUS_FILTERS = [
  { label: 'All',       value: null },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_HEX = {
  completed:         '#10B981',
  cancelled:         '#EF4444',
  accepted:          '#F59E0B',
  arrived:           '#059669',
  passenger_onboard: '#F59E0B',
  awaiting_payment:  '#EF4444',
};

const STATUS_LABELS = {
  pending:           'Pending',
  accepted:          'Accepted',
  arrived:           'Arrived at Pickup',
  passenger_onboard: 'In Transit',
  awaiting_payment:  'Awaiting Payment',
  completed:         'Delivered',
  cancelled:         'Cancelled',
  no_drivers_available: 'No Drivers',
};

const PACKAGE_ICONS = {
  document:  '📄',
  parcel:    '📦',
  food:      '🍔',
  groceries: '🛒',
  other:     '📫',
};

function EmptyState({ filter }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
        <Box sx={{
          width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 2.5,
          background: isDark
            ? `linear-gradient(135deg,${alpha('#F59E0B',0.15)} 0%,${alpha('#D97706',0.08)} 100%)`
            : `linear-gradient(135deg,${alpha('#F59E0B',0.1)} 0%,${alpha('#D97706',0.06)} 100%)`,
          border: `1px solid ${alpha('#F59E0B', isDark ? 0.2 : 0.15)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <DeliveryIcon sx={{ fontSize: 40, color: alpha('#F59E0B', 0.5) }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>No deliveries yet</Typography>
        <Typography variant="body2" color="text.secondary">
          {filter
            ? `No ${STATUS_FILTERS.find(f => f.value === filter)?.label?.toLowerCase()} deliveries found.`
            : 'Your completed deliveries will appear here.'}
        </Typography>
      </Box>
    </motion.div>
  );
}

function DeliveryCard({ delivery, index, onClick }) {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const hex      = STATUS_HEX[delivery.rideStatus] ?? '#9CA3AF';
  const pkg      = delivery.package;
  const pkgIcon  = PACKAGE_ICONS[pkg?.packageType] ?? '📦';

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
        border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        boxShadow: isDark ? `0 4px 20px rgba(0,0,0,0.35)` : `0 4px 20px rgba(0,0,0,0.06)`,
        transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
        position: 'relative',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: isDark ? `0 12px 32px rgba(0,0,0,0.5)` : `0 10px 28px rgba(0,0,0,0.1)` },
        '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg,${hex} 0%,${alpha(hex,0.5)} 100%)`, borderRadius: '3px 0 0 3px' },
      }}>
        <Box sx={{ height: 2.5, background: `linear-gradient(90deg,${hex} 0%,${alpha(hex,0.2)} 100%)` }} />
        <Box sx={{ p: 2, pl: 2.5 }}>

          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Chip label={STATUS_LABELS[delivery.rideStatus] ?? delivery.rideStatus} size="small"
              sx={{
                background: `linear-gradient(135deg,${alpha(hex,isDark?0.22:0.12)} 0%,${alpha(hex,isDark?0.12:0.06)} 100%)`,
                color: hex, fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.3,
                border: `1px solid ${alpha(hex,0.25)}`, borderRadius: 1.5, height: 22,
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {pkg && (
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{pkgIcon}</Typography>
              )}
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', fontWeight: 500 }}>
                {getRelativeTime(delivery.createdAt)}
              </Typography>
            </Box>
          </Box>

          {/* Route */}
          <Box sx={{ mb: 1.5 }}>
            {/* Pickup */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.25 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                <Box sx={{ width: 1.5, flex: 1, minHeight: 16, mt: 0.5, mb: 0.5, background: `repeating-linear-gradient(180deg,${alpha(isDark?'#fff':'#000',0.18)} 0px,${alpha(isDark?'#fff':'#000',0.18)} 3px,transparent 3px,transparent 6px)` }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.62rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>Pickup</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                  {delivery.pickupLocation?.address ?? 'N/A'}
                </Typography>
                {delivery.acceptedAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', fontSize: '0.68rem' }}>
                    {formatDateTime(delivery.acceptedAt)}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Dropoff */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.8, bgcolor: '#EF4444', flexShrink: 0, mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.62rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>Dropoff</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                  {delivery.dropoffLocation?.address ?? 'N/A'}
                </Typography>
                {delivery.tripCompletedAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', fontSize: '0.68rem' }}>
                    {formatDateTime(delivery.tripCompletedAt)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.25, borderTop: `1px solid ${alpha(isDark?'#fff':'#000',isDark?0.06:0.05)}` }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, fontSize: '0.68rem' }}>
              {formatDate(delivery.createdAt, 'short')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: -0.3, fontSize: '0.95rem',
              }}>
                {formatCurrency(delivery.totalFare ?? 0)}
              </Typography>
              <ChevronIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

export default function DeliveriesPage() {
  const router   = useRouter();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab]     = useState(0);
  const [deliveries, setDeliveries]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const sentinelRef                   = useRef(null);
  const isFetchingRef                 = useRef(false);
  const currentFilter                 = STATUS_FILTERS[activeTab].value;

  const loadDeliveries = useCallback(async (pageNum = 1) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (pageNum === 1) setLoading(true); else setLoadingMore(true);
      const response = await deliveriesAPI.getDeliveryHistory({ page: pageNum, limit: 20, rideStatus: currentFilter });
      const data = response?.data ?? [];
      if (pageNum === 1) setDeliveries(data); else setDeliveries(prev => [...prev, ...data]);
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading deliveries:', err);
      if (pageNum === 1) setDeliveries([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [currentFilter]);

  useEffect(() => { setPage(1); setHasMore(true); loadDeliveries(1); }, [activeTab]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading)
        loadDeliveries(page + 1);
    }, { threshold: 0.1, rootMargin: '80px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, loadDeliveries]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{
        flexShrink: 0, position: 'relative',
        background: isDark ? 'linear-gradient(160deg,#1E293B 0%,#0F172A 100%)' : 'linear-gradient(160deg,#92400E 0%,#B45309 100%)',
        borderBottom: `1px solid ${alpha(isDark ? '#F59E0B' : '#FDE68A', 0.15)}`,
        boxShadow: isDark ? `0 4px 24px rgba(0,0,0,0.5)` : `0 4px 24px ${alpha('#D97706',0.3)}`,
        zIndex: 10, pt: 3, pb: 0, px: 2.5,
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#F59E0B 0%,#D97706 50%,#F59E0B 100%)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2,
            background: isDark ? `linear-gradient(135deg,#F59E0B 0%,#D97706 100%)` : `linear-gradient(135deg,rgba(255,255,255,0.25) 0%,rgba(255,255,255,0.1) 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingIcon sx={{ fontSize: 20, color: isDark ? '#fff' : 'rgba(255,255,255,0.9)' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1, letterSpacing: -0.5, color: isDark ? 'text.primary' : '#fff' }}>
              My Deliveries
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 500, color: isDark ? 'text.disabled' : 'rgba(255,255,255,0.7)' }}>
              {deliveries.length > 0 ? `${deliveries.length}+ deliveries` : 'Your delivery history'}
            </Typography>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setPage(1); }} variant="fullWidth"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', background: isDark ? 'linear-gradient(90deg,#F59E0B 0%,#D97706 100%)' : 'rgba(255,255,255,0.9)' },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 44, color: isDark ? alpha('#fff',0.45) : 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: isDark ? '#F59E0B' : '#fff', fontWeight: 700 } },
          }}>
          {STATUS_FILTERS.map((f, i) => <Tab key={i} label={f.label} sx={{ fontWeight: 600, fontSize: 13, minHeight: 48 }} />)}
        </Tabs>
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pt: 2, pb: 3, ...hideScrollbar }}
        onTouchStart={(e) => { e.currentTarget._touchStartX = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const startX = e.currentTarget._touchStartX;
          if (startX == null) return;
          const diff = startX - e.changedTouches[0].clientX;
          if (diff > 60 && activeTab < STATUS_FILTERS.length - 1) setActiveTab(t => t + 1);
          else if (diff < -60 && activeTab > 0) setActiveTab(t => t - 1);
          e.currentTarget._touchStartX = null;
        }}>
        <AnimatePresence mode="wait">
          {loading && page === 1 ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress sx={{ color: '#F59E0B' }} /></Box>
            </motion.div>
          ) : deliveries.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState filter={currentFilter} />
            </motion.div>
          ) : (
            <motion.div key={`tab-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {deliveries.map((delivery, i) => (
                <DeliveryCard key={delivery.id} delivery={delivery} index={i}
                  onClick={() => router.push(`/deliveries/${delivery.id}`)} />
              ))}
              {hasMore && (
                <Box ref={sentinelRef} sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                  {loadingMore ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#D97706)' }} />
                        </motion.div>
                      ))}
                    </Box>
                  ) : (
                    <Box onClick={() => loadDeliveries(page + 1)} sx={{ py: 1.75, px: 4, borderRadius: 3, cursor: 'pointer', border: `1px solid ${alpha(isDark?'#fff':'#000',0.08)}`, bgcolor: 'action.hover' }}>
                      <Typography variant="body2" fontWeight={700} color="text.secondary">Load More</Typography>
                    </Box>
                  )}
                </Box>
              )}
              {!hasMore && deliveries.length > 0 && (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: 0.5 }}>✓ All {deliveries.length} deliveries loaded</Typography>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}