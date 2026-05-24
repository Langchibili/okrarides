// PATH: appdashboard/page.js
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Grid, Button, Skeleton, Alert, Paper, Avatar,
  Dialog, IconButton, Chip,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon,
  AddCard as AddCardIcon, PersonAdd as PersonAddIcon, Receipt as ReceiptIcon,
  TrendingUp, DirectionsCar, People, FlashOn,
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

export default function DashboardPage() {
  const router = useRouter();
  const { dashboard, loading, currency, refreshDashboard } = usePartner();
  const { tickerEvents, fleetStatuses, partnerFloatBalance, lowFloatAlerts, clearLowFloatAlert } =
    usePartnerSocketContext();

  const [pins, setPins] = useState([]);
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [floatDriver, setFloatDriver] = useState(null);
  const [error, setError] = useState(null);
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

  // Apply socket status changes to pins immediately
  const enrichedPins = pins.map((pin) => ({
    ...pin,
    status: fleetStatuses[pin.driverId] ?? pin.status,
  }));

  const partnerProfile = dashboard?.partnerProfile;
  const fleet = dashboard?.fleet;
  const todayMetrics = dashboard?.todayMetrics;
  const lowFloatDrivers = dashboard?.lowFloatDrivers ?? [];
  const recentFloat = dashboard?.recentFloatActivity ?? [];

  // Live balance: prefer socket-updated balance
  const displayBalance = partnerFloatBalance ?? partnerProfile?.floatBalance ?? 0;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
            </Grid>
          ))}
        </Grid>
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
          <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => router.push('drivers/register')} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
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

      {/* Fleet status KPI row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <MetricCard label="Online Now" value={fleet?.onlineCount ?? 0} color="green" icon={<FlashOn />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard label="On Trip" value={fleet?.onTripCount ?? 0} color="red" icon={<DirectionsCar />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard label="En Route" value={fleet?.enRouteCount ?? 0} color="orange" icon={<TrendingUp />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard label="Total Fleet" value={fleet?.totalDrivers ?? 0} color="blue" icon={<People />} />
        </Grid>
      </Grid>

      {/* Main two-column layout */}
      <Grid container spacing={3}>
        {/* Left: Map + Ticker */}
        <Grid item xs={12} md={7}>
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
        </Grid>

        {/* Right: Alerts + Today's metrics */}
        <Grid item xs={12} md={5}>
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

          {/* Today's metrics */}
          <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', mb: 2 }}>
            Today's Performance
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <MetricCard label="Rides Completed" value={todayMetrics?.ridesCompleted ?? 0} color="blue" />
            </Grid>
            <Grid item xs={6}>
              <MetricCard label="Fleet Earnings" value={`${currency}${Number(todayMetrics?.fleetEarnings ?? 0).toFixed(0)}`} color="green" />
            </Grid>
            <Grid item xs={6}>
              <MetricCard label="Active Float Out" value={`${currency}${Number(todayMetrics?.activeFloat ?? 0).toFixed(0)}`} color="orange" />
            </Grid>
            <Grid item xs={6}>
              <MetricCard label="Avg Rating" value={Number(todayMetrics?.avgRating ?? 0).toFixed(1)} color="purple" />
            </Grid>
          </Grid>

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
        </Grid>
      </Grid>

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
