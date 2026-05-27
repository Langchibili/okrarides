// // PATH: appdashboard/page.js
// 'use client';
// import { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   Box, Typography, Grid, Button, Skeleton, Alert, Paper, Avatar,
//   Dialog, IconButton, Chip,
// } from '@mui/material';
// import {
//   Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon,
//   AddCard as AddCardIcon, PersonAdd as PersonAddIcon, Receipt as ReceiptIcon,
//   TrendingUp, DirectionsCar, People, FlashOn,
// } from '@mui/icons-material';
// import { useRouter } from 'next/navigation';
// import { usePartner } from '@/lib/hooks/usePartner';
// import { usePartnerSocketContext } from '@/lib/socket/PartnerSocketProvider';
// import { getFleetLocations } from '@/lib/api/partner';
// import { formatCurrency, getFloatColor, getPartnerFloatColor } from '@/lib/utils/format';
// import MetricCard from '@/components/partner/MetricCard';
// import dynamic from 'next/dynamic';
// import LiveEventTicker from '@/components/partner/LiveEventTicker';
// import FloatModal from '@/components/partner/FloatModal';

// const FleetMap = dynamic(() => import('@/components/partner/FleetMap'), { ssr: false });

// export default function DashboardPage() {
//   const router = useRouter();
//   const { dashboard, loading, currency, refreshDashboard } = usePartner();
//   const { tickerEvents, fleetStatuses, partnerFloatBalance, lowFloatAlerts, clearLowFloatAlert } =
//     usePartnerSocketContext();

//   const [pins, setPins] = useState([]);
//   const [fullscreenMap, setFullscreenMap] = useState(false);
//   const [floatDriver, setFloatDriver] = useState(null);
//   const [error, setError] = useState(null);
//   const intervalRef = useRef(null);

//   const loadFleetLocations = useCallback(async () => {
//     try {
//       const res = await getFleetLocations();
//       setPins(res?.data ?? []);
//     } catch { }
//   }, []);

//   useEffect(() => {
//     loadFleetLocations();
//     intervalRef.current = setInterval(loadFleetLocations, 10 * 60 * 1000);
//     return () => clearInterval(intervalRef.current);
//   }, [loadFleetLocations]);

//   // Apply socket status changes to pins immediately
//   const enrichedPins = pins.map((pin) => ({
//     ...pin,
//     status: fleetStatuses[pin.driverId] ?? pin.status,
//   }));

//   const partnerProfile = dashboard?.partnerProfile;
//   const fleet = dashboard?.fleet;
//   const todayMetrics = dashboard?.todayMetrics;
//   const lowFloatDrivers = dashboard?.lowFloatDrivers ?? [];
//   const recentFloat = dashboard?.recentFloatActivity ?? [];

//   // Live balance: prefer socket-updated balance
//   const displayBalance = partnerFloatBalance ?? partnerProfile?.floatBalance ?? 0;

//   if (loading) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Grid container spacing={2} sx={{ mb: 3 }}>
//           {[...Array(4)].map((_, i) => (
//             <Grid item xs={6} md={3} key={i}>
//               <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
//             </Grid>
//           ))}
//         </Grid>
//         <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
//       {/* Header */}
//       <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
//             Fleet Dashboard
//           </Typography>
//           <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
//             {partnerProfile?.businessName} · {fleet?.totalDrivers ?? 0} drivers
//           </Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
//           <Button variant="contained" startIcon={<AddCardIcon />} onClick={() => router.push('float')} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
//             Buy Float
//           </Button>
//           <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => router.push('drivers/register')} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
//             Register Driver
//           </Button>
//           <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={() => router.push('rides')} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
//             View Rides
//           </Button>
//         </Box>
//       </Box>

//       {error && (
//         <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2.5 }}
//           action={<Button color="inherit" size="small" onClick={refreshDashboard}>Retry</Button>}>
//           {error}
//         </Alert>
//       )}

//       {/* Partner Float Hero */}
//       <Paper
//         sx={{
//           mb: 3, p: 3, borderRadius: 3,
//           background: `linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)`,
//           border: 'none',
//           position: 'relative',
//           overflow: 'hidden',
//         }}
//       >
//         <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
//         <Box sx={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
//         <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>
//           Partner Float Balance
//         </Typography>
//         <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
//           {currency}{Number(displayBalance).toFixed(2)}
//         </Typography>
//         <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', mt: 0.5 }}>
//           Available to distribute to drivers
//         </Typography>
//       </Paper>

//       {/* Fleet status KPI row */}
//       <Grid container spacing={2} sx={{ mb: 3 }}>
//         <Grid item xs={6} md={3}>
//           <MetricCard label="Online Now" value={fleet?.onlineCount ?? 0} color="green" icon={<FlashOn />} />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <MetricCard label="On Trip" value={fleet?.onTripCount ?? 0} color="red" icon={<DirectionsCar />} />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <MetricCard label="En Route" value={fleet?.enRouteCount ?? 0} color="orange" icon={<TrendingUp />} />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <MetricCard label="Total Fleet" value={fleet?.totalDrivers ?? 0} color="blue" icon={<People />} />
//         </Grid>
//       </Grid>

//       {/* Main two-column layout */}
//       <Grid container spacing={3}>
//         {/* Left: Map + Ticker */}
//         <Grid item xs={12} md={7}>
//           <Paper sx={{ borderRadius: 3, mb: 3, overflow: 'hidden', position: 'relative' }}>
//             <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Live Fleet Map</Typography>
//               <IconButton size="small" onClick={() => setFullscreenMap(true)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
//                 <FullscreenIcon />
//               </IconButton>
//             </Box>
//             <FleetMap pins={enrichedPins} height={400} />
//           </Paper>
//           <LiveEventTicker events={tickerEvents} />
//         </Grid>

//         {/* Right: Alerts + Today's metrics */}
//         <Grid item xs={12} md={5}>
//           {/* Low float alerts */}
//           <Box sx={{ mb: 3 }}>
//             <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', mb: 2 }}>
//               Float Alerts
//             </Typography>
//             {lowFloatDrivers.length === 0 ? (
//               <Paper sx={{ p: 2, borderRadius: 2.5, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
//                 <Typography sx={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>
//                   ✓ All drivers have adequate float
//                 </Typography>
//               </Paper>
//             ) : (
//               lowFloatDrivers.map((driver) => (
//                 <Paper
//                   key={driver.id}
//                   sx={{
//                     p: 2, borderRadius: 2.5, mb: 1.5,
//                     background: 'rgba(239,68,68,0.08)',
//                     border: '1px solid rgba(239,68,68,0.2)',
//                     display: 'flex', alignItems: 'center', gap: 2,
//                   }}
//                 >
//                   <Avatar sx={{ width: 36, height: 36, bgcolor: '#EF4444', fontSize: '0.85rem', fontWeight: 700 }}>
//                     {driver.firstName?.[0]}
//                   </Avatar>
//                   <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
//                       {driver.firstName} {driver.lastName}
//                     </Typography>
//                     <Typography sx={{ color: '#EF4444', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>
//                       {currency}{Number(driver.floatBalance).toFixed(2)}
//                     </Typography>
//                   </Box>
//                   <Button
//                     size="small"
//                     variant="contained"
//                     onClick={() => setFloatDriver(driver)}
//                     sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#059669', flexShrink: 0 }}
//                   >
//                     Add Float
//                   </Button>
//                 </Paper>
//               ))
//             )}
//           </Box>

//           {/* Today's metrics */}
//           <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', mb: 2 }}>
//             Today's Performance
//           </Typography>
//           <Grid container spacing={1.5}>
//             <Grid item xs={6}>
//               <MetricCard label="Rides Completed" value={todayMetrics?.ridesCompleted ?? 0} color="blue" />
//             </Grid>
//             <Grid item xs={6}>
//               <MetricCard label="Fleet Earnings" value={`${currency}${Number(todayMetrics?.fleetEarnings ?? 0).toFixed(0)}`} color="green" />
//             </Grid>
//             <Grid item xs={6}>
//               <MetricCard label="Active Float Out" value={`${currency}${Number(todayMetrics?.activeFloat ?? 0).toFixed(0)}`} color="orange" />
//             </Grid>
//             <Grid item xs={6}>
//               <MetricCard label="Avg Rating" value={Number(todayMetrics?.avgRating ?? 0).toFixed(1)} color="purple" />
//             </Grid>
//           </Grid>

//           {/* Recent float activity */}
//           {recentFloat.length > 0 && (
//             <Box sx={{ mt: 3 }}>
//               <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', mb: 2 }}>
//                 Recent Float Activity
//               </Typography>
//               {recentFloat.slice(0, 5).map((entry) => (
//                 <Box
//                   key={entry.id}
//                   sx={{
//                     display: 'flex', alignItems: 'center', gap: 2,
//                     py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)',
//                   }}
//                 >
//                   <Chip
//                     label={entry.type === 'float_topup-partner' ? 'CREDIT' : 'DEBIT'}
//                     size="small"
//                     color={entry.type === 'float_topup-partner' ? 'success' : 'error'}
//                     sx={{ fontWeight: 700, fontSize: '0.65rem' }}
//                   />
//                   <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }} noWrap>
//                       {entry.driver?.firstName} {entry.driver?.lastName}
//                     </Typography>
//                     <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
//                       {entry.description}
//                     </Typography>
//                   </Box>
//                   <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#10B981', fontWeight: 700, flexShrink: 0 }}>
//                     +{currency}{Number(entry.amount).toFixed(2)}
//                   </Typography>
//                 </Box>
//               ))}
//             </Box>
//           )}
//         </Grid>
//       </Grid>

//       {/* Fullscreen map dialog */}
//       <Dialog open={fullscreenMap} onClose={() => setFullscreenMap(false)} fullScreen>
//         <Box sx={{ position: 'relative', width: '100%', height: '100vh', bgcolor: '#0f172a' }}>
//           <FleetMap pins={enrichedPins} height="100vh" initialZoom={15} />
//           <Box sx={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
//             <Button
//               variant="contained"
//               size="large"
//               startIcon={<FullscreenExitIcon />}
//               onClick={() => setFullscreenMap(false)}
//               sx={{
//                 height: 52, px: 5, borderRadius: 3.5, fontWeight: 700,
//                 bgcolor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(16px)',
//                 color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
//                 '&:hover': { bgcolor: 'rgba(15,23,42,0.98)' },
//               }}
//             >
//               Close Map
//             </Button>
//           </Box>
//         </Box>
//       </Dialog>

//       {/* Float modal for low-float alerts */}
//       {floatDriver && (
//         <FloatModal
//           open={!!floatDriver}
//           onClose={() => setFloatDriver(null)}
//           driver={floatDriver}
//           partnerFloatBalance={displayBalance}
//           defaultAction="CREDIT"
//           currency={currency}
//           onSuccess={() => { setFloatDriver(null); refreshDashboard(); }}
//         />
//       )}
//     </Box>
//   );
// }

// PATH: appdashboard/page.js
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Skeleton, Alert, Paper, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon,
  AddCard as AddCardIcon, PersonAdd as PersonAddIcon, Receipt as ReceiptIcon,
  TrendingUp, DirectionsCar, People, FlashOn,
  DirectionsCar as CarIcon, LocalShipping as DeliveryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { usePartner } from '@/lib/hooks/usePartner';
import { usePartnerSocketContext } from '@/lib/socket/PartnerSocketProvider';
import { getFleetLocations } from '@/lib/api/partner';
import { formatCurrency, getFloatColor, getPartnerFloatColor } from '@/lib/utils/format';
import MetricCard from '@/components/partner/MetricCard';
import dynamic from 'next/dynamic';
import LiveEventTicker from '@/components/partner/LiveEventTicker';
import FloatModal from '@/components/partner/FloatModal';

const FleetMap = dynamic(() => import('@/components/partner/FleetMap'), { ssr: false });

// ─── Register driver type modal (mirrored from drivers/page.js) ───────────────
function RegisterDriverTypeModal({ open, onClose, onSelect }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          bgcolor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundImage: 'none',
          maxWidth: 400,
          width: '100%',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
            Register New Driver
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
            Choose the type of driver account to create
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 2.5 }}>
          Basic info and documents are shared. Vehicle details differ by driver type.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Ride Driver */}
          <Paper
            elevation={0}
            onClick={() => onSelect('driver')}
            sx={{
              flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
              border: '2px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CarIcon sx={{ color: '#10B981', fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem', textAlign: 'center' }}>
              Ride Driver
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
              Taxi, Bus &amp; Motorbike ride driver
            </Typography>
          </Paper>

          {/* Courier */}
          <Paper
            elevation={0}
            onClick={() => onSelect('delivery')}
            sx={{
              flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
              border: '2px solid rgba(245,158,11,0.3)',
              background: 'rgba(245,158,11,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DeliveryIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem', textAlign: 'center' }}>
              Courier
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
              Delivery driver (motorbike, car, truck)
            </Typography>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button fullWidth variant="text" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderRadius: 2.5, height: 40 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router = useRouter();
  const { dashboard, loading, currency, refreshDashboard } = usePartner();
  const { tickerEvents, fleetStatuses, partnerFloatBalance, lowFloatAlerts, clearLowFloatAlert } =
    usePartnerSocketContext();

  const [pins, setPins] = useState([]);
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [floatDriver, setFloatDriver] = useState(null);
  const [error, setError] = useState(null);
  const [registerTypeModal, setRegisterTypeModal] = useState(false);
  const intervalRef = useRef(null);

  const loadFleetLocations = useCallback(async () => {
    try {
      const res = await getFleetLocations();
      setPins(res?.data ?? []);
    } catch { }
  }, []);

  useEffect(() => {
    loadFleetLocations();
    intervalRef.current = setInterval(loadFleetLocations, 10 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [loadFleetLocations]);

  const enrichedPins = pins.map((pin) => ({
    ...pin,
    status: fleetStatuses[pin.driverId] ?? pin.status,
  }));

  const partnerProfile = dashboard?.partnerProfile;
  const fleet = dashboard?.fleet;
  const todayMetrics = dashboard?.todayMetrics;
  const lowFloatDrivers = dashboard?.lowFloatDrivers ?? [];
  const recentFloat = dashboard?.recentFloatActivity ?? [];

  const displayBalance = partnerFloatBalance ?? partnerProfile?.floatBalance ?? 0;

  const handleRegisterTypeSelect = (type) => {
    setRegisterTypeModal(false);
    if (type === 'driver') router.push('drivers/register');
    else router.push('drivers/register/courier');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
          ))}
        </Box>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
            Fleet Dashboard
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            {partnerProfile?.businessName} · {fleet?.totalDrivers ?? 0} drivers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<AddCardIcon />} onClick={() => router.push('float')} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
            Buy Float
          </Button>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={() => setRegisterTypeModal(true)}
            sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            Register Driver
          </Button>
          <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={() => router.push('rides')} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            View Rides
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2.5 }}
          action={<Button color="inherit" size="small" onClick={refreshDashboard}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Partner Float Hero */}
      <Paper
        sx={{
          mb: 3, p: 3, borderRadius: 3,
          background: `linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)`,
          border: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>
          Partner Float Balance
        </Typography>
        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {currency}{Number(displayBalance).toFixed(2)}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', mt: 0.5 }}>
          Available to distribute to drivers
        </Typography>
      </Paper>

      {/* Fleet status KPI row — 4-col on md+, 2-col on mobile */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gridAutoRows: '1fr',
          gap: 2,
          mb: 3,
          '& > *': { minWidth: 0, minHeight: 0 },
        }}
      >
        <MetricCard label="Online Now" value={fleet?.onlineCount ?? 0} color="green" icon={<FlashOn />} />
        <MetricCard label="On Trip" value={fleet?.onTripCount ?? 0} color="red" icon={<DirectionsCar />} />
        <MetricCard label="En Route" value={fleet?.enRouteCount ?? 0} color="orange" icon={<TrendingUp />} />
        <MetricCard label="Total Fleet" value={fleet?.totalDrivers ?? 0} color="blue" icon={<People />} />
      </Box>

      {/* Main two-column layout — map left, alerts+metrics right */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          gap: 3,
          alignItems: 'start',
          '& > *': { minWidth: 0 },
        }}
      >
        {/* Left: Map + Ticker */}
        <Box>
          <Paper sx={{ borderRadius: 3, mb: 3, overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Live Fleet Map</Typography>
              <IconButton size="small" onClick={() => setFullscreenMap(true)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <FleetMap pins={enrichedPins} height={400} />
          </Paper>
          <LiveEventTicker events={tickerEvents} />
        </Box>

        {/* Right: Alerts + Today's metrics */}
        <Box>
          {/* Low float alerts */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', mb: 2 }}>
              Float Alerts
            </Typography>
            {lowFloatDrivers.length === 0 ? (
              <Paper sx={{ p: 2, borderRadius: 2.5, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Typography sx={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>
                  ✓ All drivers have adequate float
                </Typography>
              </Paper>
            ) : (
              lowFloatDrivers.map((driver) => (
                <Paper
                  key={driver.id}
                  sx={{
                    p: 2, borderRadius: 2.5, mb: 1.5,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#EF4444', fontSize: '0.85rem', fontWeight: 700 }}>
                    {driver.firstName?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                      {driver.firstName} {driver.lastName}
                    </Typography>
                    <Typography sx={{ color: '#EF4444', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace" }}>
                      {currency}{Number(driver.floatBalance).toFixed(2)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setFloatDriver(driver)}
                    sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#059669', flexShrink: 0 }}
                  >
                    Add Float
                  </Button>
                </Paper>
              ))
            )}
          </Box>

          {/* Today's Performance — 2×2 grid */}
          <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', mb: 2 }}>
            Today's Performance
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridAutoRows: '1fr',
              gap: 1.5,
              mb: 1.5,
              '& > *': { minWidth: 0, minHeight: 0 },
            }}
          >
            <MetricCard label="Rides Completed" value={todayMetrics?.ridesCompleted ?? 0} color="blue" />
            <MetricCard label="Fleet Earnings" value={`${currency}${Number(todayMetrics?.fleetEarnings ?? 0).toFixed(0)}`} color="green" />
            <MetricCard label="Active Float Out" value={`${currency}${Number(todayMetrics?.activeFloat ?? 0).toFixed(0)}`} color="orange" />
            <MetricCard label="Avg Rating" value={Number(todayMetrics?.avgRating ?? 0).toFixed(1)} color="purple" />
          </Box>

          {/* Recent float activity */}
          {recentFloat.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', mb: 2 }}>
                Recent Float Activity
              </Typography>
              {recentFloat.slice(0, 5).map((entry) => (
                <Box
                  key={entry.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Chip
                    label={entry.type === 'float_topup-partner' ? 'CREDIT' : 'DEBIT'}
                    size="small"
                    color={entry.type === 'float_topup-partner' ? 'success' : 'error'}
                    sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }} noWrap>
                      {entry.driver?.firstName} {entry.driver?.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                      {entry.description}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: '#10B981', fontWeight: 700, flexShrink: 0 }}>
                    +{currency}{Number(entry.amount).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Fullscreen map dialog */}
      <Dialog open={fullscreenMap} onClose={() => setFullscreenMap(false)} fullScreen>
        <Box sx={{ position: 'relative', width: '100%', height: '100vh', bgcolor: '#0f172a' }}>
          <FleetMap pins={enrichedPins} height="100vh" initialZoom={15} />
          <Box sx={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<FullscreenExitIcon />}
              onClick={() => setFullscreenMap(false)}
              sx={{
                height: 52, px: 5, borderRadius: 3.5, fontWeight: 700,
                bgcolor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(16px)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
                '&:hover': { bgcolor: 'rgba(15,23,42,0.98)' },
              }}
            >
              Close Map
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Register driver type modal */}
      <RegisterDriverTypeModal
        open={registerTypeModal}
        onClose={() => setRegisterTypeModal(false)}
        onSelect={handleRegisterTypeSelect}
      />

      {/* Float modal for low-float alerts */}
      {floatDriver && (
        <FloatModal
          open={!!floatDriver}
          onClose={() => setFloatDriver(null)}
          driver={floatDriver}
          partnerFloatBalance={displayBalance}
          defaultAction="CREDIT"
          currency={currency}
          onSuccess={() => { setFloatDriver(null); refreshDashboard(); }}
        />
      )}
    </Box>
  );
}