// //driver\app\(main)\rides\page.jsx
// 'use client';
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Tabs,
//   Tab,
//   Paper,
//   List,
//   ListItem,
//   Chip,
// } from '@mui/material';
// import {
//   DirectionsCar as CarIcon,
//   Schedule as ScheduleIcon,
//   Cancel as CancelIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ridesAPI } from '@/lib/api/rides';
// import { formatCurrency, formatDate, getRelativeTime } from '@/Functions';
// import { RIDE_STATUS, RIDE_STATUS_LABELS, RIDE_STATUS_COLORS } from '@/Constants';
// import { EmptyState, Spinner } from '@/components/ui';

// export default function TripsPage() {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState(0);
//   const [rides, setRides] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   const statusFilters = [
//     { label: 'All', value: null },
//     { label: 'Completed', value: RIDE_STATUS.COMPLETED },
//     { label: 'Cancelled', value: RIDE_STATUS.CANCELLED },
//   ];

//   const currentFilter = statusFilters[activeTab].value;

//   // Load rides
//   useEffect(() => {
//     loadRides();
//   }, [activeTab]);

//   const loadRides = async (pageNum = 1) => {
//     try {
//       setLoading(true);
//       const response = await ridesAPI.getRideHistory({
//         page: pageNum,
//         limit: 20,
//         rideStatus: currentFilter, // CHANGED from 'status'
//       });

//       console.log('Rides response:', response);

//       if (response.success || response?.data) {
//         if (pageNum === 1) {
//           setRides(response.data || []);
//         } else {
//           setRides(prev => [...prev, ...(response.data || [])]);
//         }
//         setHasMore((response.data || []).length === 20);
//         setPage(pageNum);
//       } else {
//         console.error('Failed to load rides:', response.error);
//         setRides([]);
//       }
//     } catch (error) {
//       console.error('Error loading rides:', error);
//       setRides([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue);
//     setPage(1);
//   };

//   const handleLoadMore = () => {
//     loadRides(page + 1);
//   };

//   const handleRideClick = (rideId) => {
//     router.push(`/rides/${rideId}`);
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: '100vh',
//         bgcolor: 'background.default',
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           p: 3,
//           pt: 4,
//           bgcolor: 'background.paper',
//           borderBottom: 1,
//           borderColor: 'divider',
//         }}
//       >
//         <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
//           My Trips
//         </Typography>

//         {/* Tabs */}
//         <Tabs
//           value={activeTab}
//           onChange={handleTabChange}
//           variant="fullWidth"
//           sx={{
//             '& .MuiTab-root': {
//               textTransform: 'none',
//               fontWeight: 500,
//             },
//           }}
//         >
//           {statusFilters.map((filter) => (
//             <Tab key={filter.label} label={filter.label} />
//           ))}
//         </Tabs>
//       </Box>

//       {/* Content */}
//       <Box sx={{ p: 2 }}>
//         {loading && page === 1 ? (
//           <Spinner />
//         ) : rides.length === 0 ? (
//           <EmptyState
//             icon={<CarIcon sx={{ fontSize: '4rem' }} />}
//             title="No trips yet"
//             description={
//               currentFilter
//                 ? `You don't have any ${statusFilters[activeTab].label.toLowerCase()} trips`
//                 : "Book your first ride to get started"
//             }
//             action={() => router.push('/home')}
//             actionLabel="Book a Ride"
//           />
//         ) : (
//           <>
//             <List disablePadding>
//               {rides.map((ride, index) => (
//                 <motion.div
//                   key={ride.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                 >
//                   <Paper
//                     onClick={() => handleRideClick(ride.id)}
//                     sx={{
//                       mb: 2,
//                       cursor: 'pointer',
//                       transition: 'all 0.2s',
//                       '&:hover': {
//                         boxShadow: 4,
//                         transform: 'translateY(-2px)',
//                       },
//                     }}
//                   >
//                     <ListItem
//                       sx={{
//                         flexDirection: 'column',
//                         alignItems: 'stretch',
//                         p: 2,
//                       }}
//                     >
//                       {/* Header */}
//                       <Box
//                         sx={{
//                           display: 'flex',
//                           justifyContent: 'space-between',
//                           alignItems: 'center',
//                           mb: 2,
//                         }}
//                       >
//                         <Chip
//                           label={RIDE_STATUS_LABELS[ride.rideStatus] || ride.rideStatus}
//                           size="small"
//                           sx={{
//                             bgcolor: `${RIDE_STATUS_COLORS[ride.rideStatus] || '#9E9E9E'}20`,
//                             color: RIDE_STATUS_COLORS[ride.rideStatus] || '#9E9E9E',
//                             fontWeight: 600,
//                             borderRadius: 2,
//                           }}
//                         />
//                         <Typography variant="caption" color="text.secondary">
//                           {getRelativeTime(ride.createdAt)}
//                         </Typography>
//                       </Box>

//                     {/* Trip Route */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//         >
//           <Paper sx={{ p: 3, mb: 2 }}>
//             <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
//               Trip Route
//             </Typography>
            
//             {/* Pickup */}
//             <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
//               <Box
//                 sx={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: '50%',
//                   bgcolor: 'success.main',
//                   mt: 0.5,
//                   flexShrink: 0,
//                 }}
//               />
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="caption" color="text.secondary">
//                   Pickup
//                 </Typography>
//                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                    {ride.pickupLocation?.address || 'N/A'}
//                 </Typography>
//               </Box>
//             </Box>

//             {/* Line */}
//             <Box
//               sx={{
//                 width: 2,
//                 height: 24,
//                 bgcolor: 'divider',
//                 ml: '5px',
//                 mb: 2,
//               }}
//             />

//             {/* Dropoff */}
//             <Box sx={{ display: 'flex', gap: 1.5 }}>
//               <Box
//                 sx={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: 1,
//                   bgcolor: 'error.main',
//                   mt: 0.5,
//                   flexShrink: 0,
//                 }}
//               />
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="caption" color="text.secondary">
//                   Dropoff
//                 </Typography>
//                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                   {ride.dropoffLocation.address}
//                 </Typography>
//               </Box>
//             </Box>
//           </Paper>
//         </motion.div>


//                       {/* Footer */}
//                       <Box
//                         sx={{
//                           display: 'flex',
//                           justifyContent: 'space-between',
//                           alignItems: 'center',
//                           pt: 2,
//                           borderTop: 1,
//                           borderColor: 'divider',
//                         }}
//                       >
//                         <Typography variant="caption" color="text.secondary">
//                           {formatDate(ride.createdAt, 'short')}
//                         </Typography>
//                         <Typography
//                           variant="h6"
//                           sx={{ fontWeight: 700, color: 'primary.main' }}
//                         >
//                           {formatCurrency(ride.totalFare || 0)}
//                         </Typography>
//                       </Box>
//                     </ListItem>
//                   </Paper>
//                 </motion.div>
//               ))}
//             </List>

//             {/* Load More */}
//             {hasMore && (
//               <Box sx={{ textAlign: 'center', mt: 3 }}>
//                 {loading ? (
//                   <Spinner size={32} />
//                 ) : (
//                   <motion.div whileTap={{ scale: 0.98 }}>
//                     <Box
//                       onClick={handleLoadMore}
//                       sx={{
//                         p: 2,
//                         borderRadius: 3,
//                         bgcolor: 'action.hover',
//                         cursor: 'pointer',
//                         '&:hover': {
//                           bgcolor: 'action.selected',
//                         },
//                       }}
//                     >
//                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                         Load More
//                       </Typography>
//                     </Box>
//                   </motion.div>
//                 )}
//               </Box>
//             )}
//           </>
//         )}
//       </Box>
//     </Box>
//   );
// }
// PATH: app/(main)/rides/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Tabs, Tab,
  Paper, Chip, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  DirectionsCar as CarIcon,
  CheckCircle   as DoneIcon,
  Cancel        as CancelIcon,
  MyLocation    as PinIcon,
  LocationOn    as DropIcon,
  ChevronRight  as ChevronIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ridesAPI }              from '@/lib/api/rides';
import { formatCurrency, formatDate, getRelativeTime } from '@/Functions';
import { RIDE_STATUS, RIDE_STATUS_LABELS, RIDE_STATUS_COLORS } from '@/Constants';
import { RidesListSkeleton }     from '@/components/Skeletons/RidesListSkeleton';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

const STATUS_FILTERS = [
  { label: 'All',       value: null,                    icon: <CarIcon sx={{ fontSize: 16 }} />    },
  { label: 'Completed', value: RIDE_STATUS.COMPLETED,   icon: <DoneIcon sx={{ fontSize: 16 }} />   },
  { label: 'Cancelled', value: RIDE_STATUS.CANCELLED,   icon: <CancelIcon sx={{ fontSize: 16 }} /> },
];

// Colour per ride status (hex fallback)
const STATUS_HEX = {
  completed:  '#10B981',
  cancelled:  '#EF4444',
  accepted:   '#3B82F6',
  arrived:    '#059669',
  passenger_onboard: '#8B5CF6',
  awaiting_payment:  '#F59E0B',
};

function EmptyState({ filter, onAction }) {
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
          {filter ? `No ${STATUS_FILTERS.find(f => f.value === filter)?.label.toLowerCase()} trips found.` : 'Your completed rides will appear here.'}
        </Typography>
      </Box>
    </motion.div>
  );
}

function RideCard({ ride, index, onClick }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hex    = STATUS_HEX[ride.rideStatus] ?? '#9CA3AF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26, delay: index * 0.04 }}
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
        {/* Coloured accent strip */}
        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${hex} 0%, ${alpha(hex, 0.3)} 100%)` }} />

        <Box sx={{ p: 2 }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
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

          {/* Route */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.3, flexShrink: 0, gap: 0.25 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', boxShadow: `0 0 6px ${alpha('#10B981', 0.5)}` }} />
              <Box sx={{ width: 1.5, height: 18, bgcolor: alpha(theme.palette.text.disabled, 0.3) }} />
              <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: '#EF4444', boxShadow: `0 0 6px ${alpha('#EF4444', 0.5)}` }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>
                Pickup
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ride.pickupLocation?.address || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>
                Dropoff
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ride.dropoffLocation?.address || 'N/A'}
              </Typography>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.25, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <Typography variant="caption" color="text.disabled">
              {formatDate(ride.createdAt, 'short')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="subtitle2" sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, #10B981 0%, #3B82F6 100%)`,
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

export default function TripsPage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState(0);
  const [rides,     setRides]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);

  const currentFilter = STATUS_FILTERS[activeTab].value;

  useEffect(() => { loadRides(); }, [activeTab]);

  const loadRides = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await ridesAPI.getRideHistory({ page: pageNum, limit: 20, rideStatus: currentFilter });
      if (response.success || response?.data) {
        setRides(pageNum === 1 ? (response.data || []) : prev => [...prev, ...(response.data || [])]);
        setHasMore((response.data || []).length === 20);
        setPage(pageNum);
      } else { setRides([]); }
    } catch (err) {
      console.error('Error loading rides:', err);
      setRides([]);
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

      {/* ── AppBar ─────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1E293B', 0.98)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>My Trips</Typography>
        </Toolbar>
        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setPage(1); }}
          variant="fullWidth" textColor="inherit"
          TabIndicatorProps={{ sx: { bgcolor: 'white', height: 3, borderRadius: '3px 3px 0 0' } }}>
          {STATUS_FILTERS.map((f, i) => (
            <Tab key={i} label={f.label} iconPosition="start" sx={{ fontWeight: 600, fontSize: 13, minHeight: 48 }} />
          ))}
        </Tabs>
      </AppBar>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 2, ...hideScrollbar }}>
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
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Box onClick={() => loadRides(page + 1)} sx={{
                    py: 2, borderRadius: 3, textAlign: 'center', cursor: 'pointer',
                    bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' },
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'background 0.15s',
                  }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      {loading ? 'Loading…' : 'Load More'}
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