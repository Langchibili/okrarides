// PATH: rider/app/(main)/deliveries/page.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Tabs, Tab, Paper, Chip,
  CircularProgress, Button, IconButton, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  LocalShipping as DeliveryIcon,
  Add as AddIcon,
  MyLocation as PickupIcon,
  LocationOn as DropIcon,
  ChevronRight as ChevronIcon,
  Inventory as PackageIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { getDeliveryHistory } from '@/lib/api/deliveries';
import { formatCurrency, formatDate, getRelativeTime, formatDateTime } from '@/Functions';
import useDeliveryBooking from '@/lib/hooks/useDeliveryBooking';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

const STATUS_FILTERS = [
  { label: 'All',       value: null },
  { label: 'Active',    value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_HEX = {
  pending:           '#6366F1',
  accepted:          '#F59E0B',
  arrived:           '#10B981',
  passenger_onboard: '#F59E0B',
  awaiting_payment:  '#EF4444',
  completed:         '#10B981',
  cancelled:         '#EF4444',
};

const STATUS_LABELS = {
  pending:              'Searching…',
  accepted:             'Deliverer En Route',
  arrived:              'Deliverer Arrived',
  passenger_onboard:    'In Transit',
  awaiting_payment:     'Awaiting Payment',
  completed:            'Delivered ✓',
  cancelled:            'Cancelled',
  no_drivers_available: 'No Drivers Found',
};

const PKG_ICONS = { document: '📄', parcel: '📦', food: '🍔', groceries: '🛒', other: '📫' };

const AMBER = '#F59E0B';

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ onSend }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
        <Box sx={{
          width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 2.5,
          background: isDark ? `linear-gradient(135deg,${alpha(AMBER,0.15)} 0%,${alpha(AMBER,0.08)} 100%)` : `linear-gradient(135deg,${alpha(AMBER,0.1)} 0%,${alpha(AMBER,0.05)} 100%)`,
          border: `1px solid ${alpha(AMBER, isDark ? 0.2 : 0.15)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <DeliveryIcon sx={{ fontSize: 40, color: alpha(AMBER, 0.55) }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>No deliveries yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Send your first package and track it in real time.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onSend}
          sx={{ borderRadius: 3, fontWeight: 700, height: 48, px: 3, background: `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)`, boxShadow: `0 4px 16px ${alpha(AMBER,0.4)}`, color: '#fff' }}>
          Send a Package
        </Button>
      </Box>
    </motion.div>
  );
}

// ─── Delivery card ────────────────────────────────────────────────────────────
function DeliveryCard({ delivery, index, onClick }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hex    = STATUS_HEX[delivery.rideStatus] ?? '#9CA3AF';
  const isActive = ['pending','accepted','arrived','passenger_onboard','awaiting_payment'].includes(delivery.rideStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.28), ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Paper elevation={0} sx={{
        mb: 1.5, borderRadius: 3, overflow: 'hidden',
        border: `1px solid ${alpha(isDark ? '#fff' : '#000', isDark ? 0.07 : 0.06)}`,
        boxShadow: isDark ? `0 4px 20px rgba(0,0,0,0.3)` : `0 4px 20px rgba(0,0,0,0.06)`,
        transition: 'all 0.2s ease',
        position: 'relative',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: isDark ? `0 10px 30px rgba(0,0,0,0.45)` : `0 8px 24px rgba(0,0,0,0.1)` },
        '&::before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg,${hex} 0%,${alpha(hex,0.4)} 100%)`, borderRadius: '3px 0 0 3px' },
      }}>
        {/* Top accent strip */}
        <Box sx={{ height: 2.5, background: `linear-gradient(90deg,${hex} 0%,${alpha(hex,0.15)} 100%)` }} />

        <Box sx={{ p: 2, pl: 2.5 }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={STATUS_LABELS[delivery.rideStatus] ?? delivery.rideStatus} size="small"
                sx={{ background: `linear-gradient(135deg,${alpha(hex,isDark?0.22:0.12)} 0%,${alpha(hex,isDark?0.12:0.06)} 100%)`, color: hex, fontWeight: 700, fontSize: '0.68rem', border: `1px solid ${alpha(hex,0.25)}`, borderRadius: 1.5, height: 22 }} />
              {isActive && (
                <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: hex, display: 'inline-block', animation: 'blink 1.2s ease-in-out infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {PKG_ICONS[delivery.package?.packageType] ?? '📦'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', fontWeight: 500 }}>
                {getRelativeTime(delivery.createdAt)}
              </Typography>
            </Box>
          </Box>

          {/* Route */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.25 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#10B981' }} />
                <Box sx={{ width: 1.5, flex: 1, minHeight: 14, mt: 0.4, mb: 0.4, background: `repeating-linear-gradient(180deg,${alpha('#94A3B8',0.5)} 0,${alpha('#94A3B8',0.5)} 3px,transparent 3px,transparent 6px)` }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>Pickup</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                  {delivery.pickupLocation?.address ?? 'N/A'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: 0.5, bgcolor: '#EF4444', flexShrink: 0, mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>Dropoff</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                  {delivery.dropoffLocation?.address ?? 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.25, borderTop: `1px solid ${alpha(isDark?'#fff':'#000', isDark?0.06:0.05)}` }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
              {delivery.deliverer ? `${delivery.deliverer.firstName ?? ''} ${delivery.deliverer.lastName ?? ''}`.trim() : formatDate(delivery.createdAt, 'short')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {delivery.totalFare != null && (
                <Typography variant="subtitle2" sx={{ fontWeight: 800, background: `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.3, fontSize: '0.93rem' }}>
                  {formatCurrency(delivery.totalFare)}
                </Typography>
              )}
              <ChevronIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DeliveriesPage() {
  const router  = useRouter();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab]       = useState(0);
  const [deliveries, setDeliveries]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(true);
  const sentinelRef                     = useRef(null);
  const fetchingRef                     = useRef(false);
const {  currentDelivery } = useDeliveryBooking();

  const currentFilter = STATUS_FILTERS[activeTab].value;

  const load = useCallback(async (pageNum = 1) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      if (pageNum === 1) setLoading(true); else setLoadingMore(true);

      // For the 'active' filter we send multiple statuses
      const statusParam = currentFilter === 'active' ? undefined : currentFilter;
      const res  = await getDeliveryHistory({ page: pageNum, limit: 20, rideStatus: statusParam });
      let data   = res?.data ?? [];

      if (currentFilter === 'active') {
        const active = ['pending','accepted','arrived','passenger_onboard','awaiting_payment'];
        data = data.filter(d => active.includes(d.rideStatus));
      }

      if (pageNum === 1) setDeliveries(data); else setDeliveries(p => [...p, ...data]);
      setHasMore((res?.data?.length ?? 0) === 20);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [currentFilter]);

  useEffect(() => {
    if (currentDelivery) {
        const { rideStatus, id } = currentDelivery;

        if (rideStatus === 'pending') {
        router.push(`/deliveries/finding-deliverer?id=${id}`)
        } else if (['accepted', 'arrived', 'passenger_onboard'].includes(rideStatus)) {
        router.push(`/deliveries/${id}/tracking`);
        } else if (rideStatus === 'completed') {
        router.push(`/deliveries/${id}`);
        }
    }
  }, [currentDelivery, router]);

  useEffect(() => { setPage(1); setHasMore(true); load(1); }, [activeTab]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasMore && !loadingMore && !loading) load(page + 1);
    }, { threshold: 0.1, rootMargin: '80px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, page, load]);

  const appBarBg = isDark
    ? `linear-gradient(135deg,#1E293B 0%,#0F172A 100%)`
    : `linear-gradient(135deg,#92400E 0%,#B45309 100%)`;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>

      {/* Fixed header */}
      <Box sx={{
        flexShrink: 0, position: 'relative',
        background: isDark
          ? 'linear-gradient(160deg,#1E293B 0%,#0F172A 100%)'
          : 'linear-gradient(160deg,#92400E 0%,#B45309 100%)',
        borderBottom: `1px solid ${alpha(isDark ? AMBER : '#FDE68A', 0.15)}`,
        boxShadow: isDark ? `0 4px 24px rgba(0,0,0,0.5)` : `0 4px 24px ${alpha('#D97706',0.3)}`,
        zIndex: 10, pt: 3, pb: 0, px: 2.5,
      }}>
        {/* Top accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${AMBER} 0%,#D97706 50%,${AMBER} 100%)` }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 2, background: isDark ? `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)` : `linear-gradient(135deg,rgba(255,255,255,0.25) 0%,rgba(255,255,255,0.1) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DeliveryIcon sx={{ fontSize: 20, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1, letterSpacing: -0.5, color: isDark ? 'text.primary' : '#fff' }}>My Deliveries</Typography>
              <Typography variant="caption" sx={{ color: isDark ? 'text.disabled' : 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {deliveries.length > 0 ? `${deliveries.length} packages` : 'Track your packages'}
              </Typography>
            </Box>
          </Box>

          {/* Send Package CTA — top right */}
          {/* <motion.div whileTap={{ scale: 0.94 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => router.push('/deliveries/send')}
              size="small"
              sx={{
                borderRadius: 2.5, fontWeight: 700, height: 38, px: 2,
                background: isDark ? `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)` : 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(8px)',
                color: isDark ? '#fff' : '#fff',
                border: isDark ? 'none' : '1px solid rgba(255,255,255,0.35)',
                boxShadow: isDark ? `0 4px 14px ${alpha(AMBER,0.45)}` : '0 2px 8px rgba(0,0,0,0.15)',
                fontSize: 13,
                '&:hover': { background: isDark ? `linear-gradient(135deg,#D97706 0%,#B45309 100%)` : 'rgba(255,255,255,0.32)' },
              }}
            >
              Send Package
            </Button>
          </motion.div> */}
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', background: isDark ? `linear-gradient(90deg,${AMBER} 0%,#D97706 100%)` : 'rgba(255,255,255,0.9)' },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', minHeight: 44, color: isDark ? alpha('#fff', 0.4) : 'rgba(255,255,255,0.6)', '&.Mui-selected': { color: isDark ? AMBER : '#fff', fontWeight: 700 } },
          }}>
          {STATUS_FILTERS.map((f, i) => <Tab key={i} label={f.label} sx={{ minHeight: 44 }} />)}
        </Tabs>
      </Box>

      {/* Scrollable list */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pt: 2, pb: 10, ...hideScrollbar }}
        onTouchStart={(e) => { e.currentTarget._tx = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = e.currentTarget._tx - e.changedTouches[0].clientX;
          if (diff > 60 && activeTab < STATUS_FILTERS.length - 1) setActiveTab(t => t + 1);
          else if (diff < -60 && activeTab > 0) setActiveTab(t => t - 1);
        }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
                <CircularProgress sx={{ color: AMBER }} />
              </Box>
            </motion.div>
          ) : deliveries.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState onSend={() => router.push('/deliveries/send')} />
            </motion.div>
          ) : (
            <motion.div key={`tab-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {deliveries.map((d, i) => (
                <DeliveryCard key={d.id} delivery={d} index={i}
                  onClick={() => {
                    const active = ['pending','accepted','arrived','passenger_onboard','awaiting_payment'];
                    if (active.includes(d.rideStatus)) {
                      router.push(d.rideStatus === 'pending' ? `/deliveries/finding-deliverer?id=${d.id}` : `/deliveries/${d.id}/tracking`);
                    } else {
                      router.push(`/deliveries/${d.id}`);
                    }
                  }} />
              ))}
              {hasMore && (
                <Box ref={sentinelRef} sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                  {loadingMore && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {[0,1,2].map(i => (
                        <motion.div key={i} animate={{ scale: [1,1.5,1], opacity: [0.4,1,0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: `linear-gradient(135deg,${AMBER},#D97706)` }} />
                        </motion.div>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {!hasMore && deliveries.length > 0 && (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>✓ All {deliveries.length} deliveries loaded</Typography>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Floating send button (visible when list has items) */}
      {deliveries.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 90, right: 20, zIndex: 100 }}>
          <motion.div whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }}>
            <Button
              variant="contained"
              onClick={() => router.push('/deliveries/send')}
              sx={{
                borderRadius: '28px', height: 52, px: 3, fontWeight: 700,
                background: `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)`,
                boxShadow: `0 8px 24px ${alpha(AMBER,0.5)}`,
                color: '#fff',
              }}
              startIcon={<AddIcon />}
            >
              Send Package
            </Button>
          </motion.div>
        </Box>
      )}
    </Box>
  );
}