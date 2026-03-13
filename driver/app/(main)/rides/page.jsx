// 'use client';
// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useRouter }           from 'next/navigation';
// import {
//   Box, AppBar, Toolbar, Typography, Tabs, Tab,
//   Paper, Chip, CircularProgress,
// } from '@mui/material';
// import { alpha, useTheme } from '@mui/material/styles';
// import {
//   DirectionsCar as CarIcon,
//   CheckCircle   as DoneIcon,
//   Cancel        as CancelIcon,
//   MyLocation    as PickupIcon,
//   LocationOn    as DropIcon,
//   ChevronRight  as ChevronIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ridesAPI }              from '@/lib/api/rides';
// import { formatCurrency, formatDate, getRelativeTime, formatDateTime } from '@/Functions';
// import { RIDE_STATUS, RIDE_STATUS_LABELS } from '@/Constants';
// import { RidesListSkeleton }     from '@/components/Skeletons/RidesListSkeleton';

// const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

// const STATUS_FILTERS = [
//   { label: 'All',       value: null                  },
//   { label: 'Completed', value: RIDE_STATUS.COMPLETED },
//   { label: 'Cancelled', value: RIDE_STATUS.CANCELLED },
// ];

// const STATUS_HEX = {
//   completed:         '#10B981',
//   cancelled:         '#EF4444',
//   accepted:          '#3B82F6',
//   arrived:           '#059669',
//   passenger_onboard: '#8B5CF6',
//   awaiting_payment:  '#F59E0B',
// };

// // ── Empty state ───────────────────────────────────────────────────────────────
// function EmptyState({ filter }) {
//   const theme  = useTheme();
//   const isDark = theme.palette.mode === 'dark';
//   return (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//       <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
//         <Box sx={{
//           width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 2.5,
//           background: isDark
//             ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(16,185,129,0.08) 100%)'
//             : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(16,185,129,0.04) 100%)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//         }}>
//           <CarIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
//         </Box>
//         <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>No trips yet</Typography>
//         <Typography variant="body2" color="text.secondary">
//           {filter
//             ? `No ${STATUS_FILTERS.find(f => f.value === filter)?.label.toLowerCase()} trips found.`
//             : 'Your completed rides will appear here.'}
//         </Typography>
//       </Box>
//     </motion.div>
//   );
// }

// // ── Single ride card ──────────────────────────────────────────────────────────
// function RideCard({ ride, index, onClick }) {
//   const theme  = useTheme();
//   const isDark = theme.palette.mode === 'dark';
//   const hex    = STATUS_HEX[ride.rideStatus] ?? '#9CA3AF';

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 14 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ type: 'spring', stiffness: 280, damping: 26, delay: Math.min(index * 0.04, 0.32) }}
//       whileTap={{ scale: 0.985 }}
//       onClick={onClick}
//       style={{ cursor: 'pointer' }}
//     >
//       <Paper elevation={isDark ? 0 : 2} sx={{
//         mb: 1.5, borderRadius: 3, overflow: 'hidden',
//         border: `1px solid ${alpha(hex, isDark ? 0.2 : 0.1)}`,
//         background: isDark
//           ? `linear-gradient(145deg, ${alpha(hex, 0.07)} 0%, transparent 100%)`
//           : `linear-gradient(145deg, ${alpha(hex, 0.03)} 0%, transparent 100%)`,
//         transition: 'box-shadow 0.2s, transform 0.15s',
//         '&:hover': {
//           boxShadow: `0 6px 24px ${alpha(hex, 0.18)}`,
//           transform: 'translateY(-1px)',
//         },
//       }}>
//         {/* Status accent strip */}
//         <Box sx={{ height: 3, background: `linear-gradient(90deg, ${hex} 0%, ${alpha(hex, 0.25)} 100%)` }} />

//         <Box sx={{ p: 2 }}>
//           {/* Header */}
//           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
//             <Chip
//               label={RIDE_STATUS_LABELS[ride.rideStatus] || ride.rideStatus}
//               size="small"
//               sx={{
//                 bgcolor: alpha(hex, isDark ? 0.22 : 0.1),
//                 color: hex, fontWeight: 700, borderRadius: 2, height: 22, fontSize: 11,
//               }}
//             />
//             <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
//               {getRelativeTime(ride.createdAt)}
//             </Typography>
//           </Box>

//           {/* Pickup row */}
//           <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
//             <Box sx={{
//               width: 34, height: 34, borderRadius: 2, flexShrink: 0,
//               bgcolor: alpha('#10B981', isDark ? 0.2 : 0.1),
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//             }}>
//               <PickupIcon sx={{ color: '#10B981', fontSize: 18 }} />
//             </Box>
//             <Box sx={{ flex: 1, minWidth: 0 }}>
//               <Typography variant="caption" color="text.disabled"
//                 sx={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
//                 Pickup
//               </Typography>
//               <Typography variant="body2" fontWeight={600}
//                 sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
//                 {ride.pickupLocation?.address || 'N/A'}
//               </Typography>
//               {ride.pickupLocation?.name && (
//                 <Typography variant="caption" color="text.secondary"
//                   sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
//                   {ride.pickupLocation.name}
//                 </Typography>
//               )}
//               {ride.acceptedAt && (
//                 <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: 10 }}>
//                   {formatDateTime(ride.acceptedAt)}
//                 </Typography>
//               )}
//             </Box>
//           </Box>

//           {/* Connector line */}
//           <Box sx={{
//             width: 2, height: 14,
//             bgcolor: alpha(theme.palette.divider, isDark ? 0.4 : 0.35),
//             ml: '16px', mb: 1,
//             borderRadius: 1,
//           }} />

//           {/* Dropoff row */}
//           <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
//             <Box sx={{
//               width: 34, height: 34, borderRadius: 2, flexShrink: 0,
//               bgcolor: alpha('#EF4444', isDark ? 0.2 : 0.1),
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//             }}>
//               <DropIcon sx={{ color: '#EF4444', fontSize: 18 }} />
//             </Box>
//             <Box sx={{ flex: 1, minWidth: 0 }}>
//               <Typography variant="caption" color="text.disabled"
//                 sx={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
//                 Dropoff
//               </Typography>
//               <Typography variant="body2" fontWeight={600}
//                 sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
//                 {ride.dropoffLocation?.address || 'N/A'}
//               </Typography>
//               {ride.dropoffLocation?.name && (
//                 <Typography variant="caption" color="text.secondary"
//                   sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
//                   {ride.dropoffLocation.name}
//                 </Typography>
//               )}
//               {ride.tripCompletedAt && (
//                 <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: 10 }}>
//                   {formatDateTime(ride.tripCompletedAt)}
//                 </Typography>
//               )}
//             </Box>
//           </Box>

//           {/* Footer */}
//           <Box sx={{
//             display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//             pt: 1.25, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
//           }}>
//             <Typography variant="caption" color="text.disabled">
//               {formatDate(ride.createdAt, 'short')}
//             </Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//               <Typography variant="subtitle2" sx={{
//                 fontWeight: 800,
//                 background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
//                 WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
//               }}>
//                 {formatCurrency(ride.totalFare || 0)}
//               </Typography>
//               <ChevronIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
//             </Box>
//           </Box>
//         </Box>
//       </Paper>
//     </motion.div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────

// export default function TripsPage() {
//   const router  = useRouter();
//   const theme   = useTheme();
//   const isDark  = theme.palette.mode === 'dark';

//   const [activeTab,    setActiveTab]    = useState(0);
//   const [rides,        setRides]        = useState([]);
//   const [loading,      setLoading]      = useState(true);
//   const [loadingMore,  setLoadingMore]  = useState(false);
//   const [page,         setPage]         = useState(1);
//   const [hasMore,      setHasMore]      = useState(true);

//   const sentinelRef   = useRef(null);
//   const isFetchingRef = useRef(false);

//   const currentFilter = STATUS_FILTERS[activeTab].value;

//   // ── Fetch ─────────────────────────────────────────────────────────────────
//   const loadRides = useCallback(async (pageNum = 1) => {
//     if (isFetchingRef.current) return;
//     isFetchingRef.current = true;

//     try {
//       if (pageNum === 1) setLoading(true);
//       else               setLoadingMore(true);

//       const response = await ridesAPI.getRideHistory({
//         page: pageNum, limit: 20, rideStatus: currentFilter,
//       });

//       const data = response?.data || [];
//       if (pageNum === 1) setRides(data);
//       else               setRides(prev => [...prev, ...data]);

//       setHasMore(data.length === 20);
//       setPage(pageNum);
//     } catch (err) {
//       console.error('Error loading rides:', err);
//       if (pageNum === 1) setRides([]);
//     } finally {
//       setLoading(false);
//       setLoadingMore(false);
//       isFetchingRef.current = false;
//     }
//   }, [currentFilter]);

//   // Reset + reload on tab change
//   useEffect(() => {
//     setPage(1);
//     setHasMore(true);
//     loadRides(1);
//   }, [activeTab]);

//   // ── Intersection observer ─────────────────────────────────────────────────
//   useEffect(() => {
//     if (!sentinelRef.current) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         const first = entries[0];
//         if (first.isIntersecting && hasMore && !loadingMore && !loading) {
//           loadRides(page + 1);
//         }
//       },
//       { threshold: 0.1, rootMargin: '80px' }
//     );

//     observer.observe(sentinelRef.current);
//     return () => observer.disconnect();
//   }, [hasMore, loadingMore, loading, page, loadRides]);

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

//       {/* ── AppBar ─────────────────────────────────────────────────────── */}
//       <AppBar position="static" elevation={0} sx={{
//         background: isDark
//           ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
//           : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
//       }}>
//         <Toolbar>
//           <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>My Trips</Typography>
//         </Toolbar>
//         <Tabs
//           value={activeTab}
//           onChange={(_, v) => { setActiveTab(v); setPage(1); }}
//           variant="fullWidth"
//           textColor="inherit"
//           TabIndicatorProps={{ sx: { bgcolor: 'white', height: 3, borderRadius: '3px 3px 0 0' } }}
//         >
//           {STATUS_FILTERS.map((f, i) => (
//             <Tab key={i} label={f.label} sx={{ fontWeight: 600, fontSize: 13, minHeight: 48 }} />
//           ))}
//         </Tabs>
//       </AppBar>

//       {/* ── Body ───────────────────────────────────────────────────────── */}
      
//       <Box  sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 3, ...hideScrollbar }}
//         onTouchStart={(e) => {
//           e.currentTarget._touchStartX = e.touches[0].clientX;
//         }}
//         onTouchEnd={(e) => {
//           const startX = e.currentTarget._touchStartX;
//           if (startX == null) return;
//           const diff = startX - e.changedTouches[0].clientX;
//           if (diff > 60 && activeTab < STATUS_FILTERS.length - 1) {
//             setActiveTab(t => t + 1);
//           } else if (diff < -60 && activeTab > 0) {
//             setActiveTab(t => t - 1);
//           }
//           e.currentTarget._touchStartX = null;
//         }}>
//         <AnimatePresence mode="wait">

//           {/* Initial skeleton */}
//           {loading && page === 1 ? (
//             <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//               <RidesListSkeleton />
//             </motion.div>

//           /* Empty state */
//           ) : rides.length === 0 ? (
//             <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//               <EmptyState filter={currentFilter} />
//             </motion.div>

//           /* List */
//           ) : (
//             <motion.div key={`tab-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//               {rides.map((ride, i) => (
//                 <RideCard
//                   key={ride.id}
//                   ride={ride}
//                   index={i}
//                   onClick={() => router.push(`/rides/${ride.id}`)}
//                 />
//               ))}

//               {/* ── Sentinel: intersection observer target ── */}
//               {hasMore && (
//                 <Box ref={sentinelRef} sx={{ py: 1 }}>
//                   {loadingMore ? (
//                     <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
//                       <CircularProgress size={28} thickness={3} sx={{ color: '#10B981' }} />
//                     </Box>
//                   ) : (
//                     /* Fallback manual "Load More" button */
//                     <motion.div whileTap={{ scale: 0.97 }}>
//                       <Box
//                         onClick={() => loadRides(page + 1)}
//                         sx={{
//                           py: 1.75, borderRadius: 3, textAlign: 'center', cursor: 'pointer',
//                           bgcolor: 'action.hover',
//                           border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
//                           transition: 'background 0.15s',
//                           '&:hover': { bgcolor: 'action.selected' },
//                         }}
//                       >
//                         <Typography variant="body2" fontWeight={700} color="text.secondary">
//                           Load More
//                         </Typography>
//                       </Box>
//                     </motion.div>
//                   )}
//                 </Box>
//               )}

//               {/* End-of-list message */}
//               {!hasMore && rides.length > 0 && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
//                   <Box sx={{ py: 3, textAlign: 'center' }}>
//                     <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: 0.5 }}>
//                       — All {rides.length} trips loaded —
//                     </Typography>
//                   </Box>
//                 </motion.div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </Box>
//     </Box>
//   );
// }
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter }           from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Tabs, Tab,
  Paper, Chip, CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  DirectionsCar  as CarIcon,
  CheckCircle    as DoneIcon,
  Cancel         as CancelIcon,
  MyLocation     as PickupIcon,
  LocationOn     as DropIcon,
  ChevronRight   as ChevronIcon,
  TrendingUp     as TrendingIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ridesAPI }              from '@/lib/api/rides';
import { formatCurrency, formatDate, getRelativeTime, formatDateTime } from '@/Functions';
import { RIDE_STATUS, RIDE_STATUS_LABELS } from '@/Constants';
import { RidesListSkeleton }     from '@/components/Skeletons/RidesListSkeleton';

const hideScrollbar = {
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
  msOverflowStyle: 'none',
};

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

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.08 }}
    >
      <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
        <Box sx={{
          width: 88, height: 88, borderRadius: '50%', mx: 'auto', mb: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(16,185,129,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.09) 0%, rgba(16,185,129,0.05) 100%)',
          border: `1.5px solid ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isDark
            ? '0 8px 32px rgba(59,130,246,0.12)'
            : '0 8px 32px rgba(59,130,246,0.08)',
        }}>
          <CarIcon sx={{ fontSize: 40, color: isDark ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.4)' }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75, letterSpacing: -0.3 }}>No trips yet</Typography>
        <Typography variant="body2" color="text.secondary">
          {filter
            ? `No ${STATUS_FILTERS.find(f => f.value === filter)?.label.toLowerCase()} trips found.`
            : 'Your completed rides will appear here.'}
        </Typography>
      </Box>
    </motion.div>
  );
}

// ── Single ride card — styled like rider app trips ───────────────────────────
function RideCard({ ride, index, onClick }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hex    = STATUS_HEX[ride.rideStatus] ?? '#9CA3AF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: Math.min(index * 0.045, 0.36) }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 1.75,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid`,
          borderColor: isDark
            ? `rgba(255,255,255,0.07)`
            : `rgba(0,0,0,0.07)`,
          background: isDark
            ? `linear-gradient(145deg, ${alpha(hex, 0.07)} 0%, rgba(30,41,59,0.9) 100%)`
            : `linear-gradient(145deg, ${alpha(hex, 0.04)} 0%, #ffffff 100%)`,
          boxShadow: isDark
            ? `0 4px 20px rgba(0,0,0,0.35)`
            : `0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05)`,
          transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isDark
              ? `0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px ${alpha(hex, 0.3)}`
              : `0 12px 36px rgba(0,0,0,0.13), 0 0 0 1px ${alpha(hex, 0.25)}`,
            borderColor: isDark ? alpha(hex, 0.3) : alpha(hex, 0.28),
          },
          // Left accent bar — same trick as rider app
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 4,
            background: `linear-gradient(180deg, ${hex} 0%, ${alpha(hex, 0.5)} 100%)`,
            borderRadius: '3px 0 0 3px',
          },
        }}
      >
        {/* Top gradient strip */}
        <Box sx={{
          height: 2,
          background: `linear-gradient(90deg, ${hex} 0%, ${alpha(hex, 0.15)} 100%)`,
        }} />

        <Box sx={{ p: 2, pl: 2.5 }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
            <Chip
              label={RIDE_STATUS_LABELS[ride.rideStatus] || ride.rideStatus}
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${alpha(hex, isDark ? 0.22 : 0.1)} 0%, ${alpha(hex, isDark ? 0.12 : 0.05)} 100%)`,
                color: hex,
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: 0.3,
                border: `1px solid ${alpha(hex, isDark ? 0.3 : 0.2)}`,
                borderRadius: 1.5,
                height: 22,
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', fontWeight: 500 }}>
              {getRelativeTime(ride.createdAt)}
            </Typography>
          </Box>

          {/* Route visualization */}
          <Box sx={{ mb: 1.75 }}>
            {/* Pickup row */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.25 }}>
              <Box sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                flexShrink: 0, pt: 0.25,
              }}>
                <Box sx={{
                  width: 10, height: 10, borderRadius: '50%',
                  bgcolor: '#10B981',
                  boxShadow: `0 0 0 3px ${alpha('#10B981', 0.18)}`,
                  flexShrink: 0,
                }} />
                <Box sx={{
                  width: 1.5, flex: 1, minHeight: 18,
                  background: isDark
                    ? 'repeating-linear-gradient(180deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 3px, transparent 3px, transparent 6px)'
                    : 'repeating-linear-gradient(180deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 3px, transparent 3px, transparent 6px)',
                  mt: 0.5, mb: 0.5,
                }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{
                  color: 'text.disabled', fontWeight: 700, fontSize: '0.62rem',
                  letterSpacing: 0.8, textTransform: 'uppercase',
                }}>
                  Pickup
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{
                  lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', fontSize: '0.83rem',
                }}>
                  {ride.pickupLocation?.address || 'N/A'}
                </Typography>
                {ride.pickupLocation?.name && (
                  <Typography variant="caption" color="text.secondary" sx={{
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontSize: '0.72rem',
                  }}>
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

            {/* Dropoff row */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{
                width: 10, height: 10, borderRadius: '2px',
                bgcolor: '#EF4444', flexShrink: 0, mt: 0.25,
                boxShadow: `0 0 0 3px ${alpha('#EF4444', 0.18)}`,
              }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{
                  color: 'text.disabled', fontWeight: 700, fontSize: '0.62rem',
                  letterSpacing: 0.8, textTransform: 'uppercase',
                }}>
                  Dropoff
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{
                  lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', fontSize: '0.83rem',
                }}>
                  {ride.dropoffLocation?.address || 'N/A'}
                </Typography>
                {ride.dropoffLocation?.name && (
                  <Typography variant="caption" color="text.secondary" sx={{
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontSize: '0.72rem',
                  }}>
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
            pt: 1.25,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
          }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500, fontSize: '0.7rem' }}>
              {formatDate(ride.createdAt, 'short')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle1" sx={{
                fontWeight: 800,
                letterSpacing: -0.4,
                fontSize: '1.05rem',
                background: ride.rideStatus === 'completed'
                  ? 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)'
                  : 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
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

// ── Main Page ────────────────────────────────────────────────────────────────
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
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [currentFilter]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadRides(1);
  }, [activeTab]);

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

  return (
    <Box sx={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      bgcolor: 'background.default', overflow: 'hidden',
    }}>

      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <Box sx={{
        flexShrink: 0,
        position: 'relative',
        background: isDark
          ? 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)'
          : 'linear-gradient(160deg, #ffffff 0%, #F8FAFC 100%)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.45)'
          : '0 4px 24px rgba(0,0,0,0.07)',
        zIndex: 10,
        pt: 2.5,
        pb: 0,
        px: 2.5,
      }}>
        {/* Top accent line */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #10B981 100%)',
          backgroundSize: '200% 100%',
        }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
            flexShrink: 0,
          }}>
            <TrendingIcon sx={{ fontSize: 21, color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1, letterSpacing: -0.5 }}>
              My Trips
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
              {rides.length > 0 ? `${rides.length}+ rides logged` : 'Your complete ride history'}
            </Typography>
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, v) => { setActiveTab(v); setPage(1); }}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 100%)',
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
                color: '#10B981',
                fontWeight: 700,
              },
            },
          }}
        >
          {STATUS_FILTERS.map((f, i) => (
            <Tab key={i} label={f.label} />
          ))}
        </Tabs>
      </Box>

      {/* ── Scrollable Body ───────────────────────────────────────────────── */}
      <Box
        sx={{ flex: 1, overflowY: 'auto', px: 2, pt: 2, pb: 3, ...hideScrollbar }}
        onTouchStart={(e) => { e.currentTarget._touchStartX = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const startX = e.currentTarget._touchStartX;
          if (startX == null) return;
          const diff = startX - e.changedTouches[0].clientX;
          if (diff > 60 && activeTab < STATUS_FILTERS.length - 1) setActiveTab(t => t + 1);
          else if (diff < -60 && activeTab > 0)                   setActiveTab(t => t - 1);
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
                <RideCard
                  key={ride.id}
                  ride={ride}
                  index={i}
                  onClick={() => router.push(`/rides/${ride.id}`)}
                />
              ))}

              {hasMore && (
                <Box ref={sentinelRef} sx={{ py: 1 }}>
                  {loadingMore ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, gap: 1, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                        >
                          <Box sx={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                          }} />
                        </motion.div>
                      ))}
                    </Box>
                  ) : (
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Box onClick={() => loadRides(page + 1)} sx={{
                        py: 1.75, borderRadius: 3, textAlign: 'center', cursor: 'pointer',
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' },
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
                    <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: 0.5, fontWeight: 500 }}>
                      ✓ All {rides.length} trips loaded
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