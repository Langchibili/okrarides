'use client';
// PATH: app/(main)/rides/[id]/page.jsx — UI POLISH ONLY (logic identical)
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, AppBar, Toolbar, Typography, Paper, Avatar, Divider, IconButton, Button, Chip, Alert, List, ListItem, ListItemText } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowBack as BackIcon, LocationOn as DropIcon, MyLocation as PickupIcon, Star as StarIcon, Receipt as ReceiptIcon, Navigation as NavIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { RIDE_STATUS } from '@/Constants';
import { useRide } from '@/lib/hooks/useRide';
import MapIframe from '@/components/Map/MapIframe';
import { RideDetailSkeleton } from '@/components/Skeletons/RideDetailSkeleton';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };
const STATUS_HEX = { completed: '#10B981', cancelled: '#EF4444', accepted: '#3B82F6', arrived: '#059669', passenger_onboard: '#8B5CF6', awaiting_payment: '#F59E0B' };

function SectionCard({ title, icon, children, accent }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
      <Paper elevation={0} sx={{
        p: 2.5, borderRadius: 3, mb: 2,
        border: `1px solid ${alpha(accent ?? theme.palette.divider, isDark ? 0.18 : 0.1)}`,
        background: accent
          ? isDark
            ? `linear-gradient(145deg, ${alpha(accent, 0.1)} 0%, transparent 60%)`
            : `linear-gradient(145deg, ${alpha(accent, 0.05)} 0%, #FFFFFF 100%)`
          : isDark ? undefined : 'linear-gradient(145deg, #FFFFFF 0%, #FAFAFA 100%)',
        boxShadow: isDark ? 'none' : `0 3px 16px rgba(0,0,0,0.06), 0 0 0 0px ${alpha(accent ?? '#000', 0.04)}`,
      }}>
        {title && (
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: -0.2 }}>
            {icon && <Box sx={{ '& svg': { fontSize: 18, color: accent ?? 'text.secondary' } }}>{icon}</Box>}
            {title}
          </Typography>
        )}
        {children}
      </Paper>
    </motion.div>
  );
}

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [ride, setRide]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { confirmArrival, startTrip, completeTrip, cancelRide } = useRide();
  const mapControlsRef = useRef(null);

  useEffect(() => { loadRideDetails(); }, [params.id]);

  const loadRideDetails = async () => {
    try {
      const response = await apiClient.get(`/rides/${params.id}`);
      if (response?.data) setRide(response.data);
    } catch (err) { console.error('Error loading ride:', err); }
    finally { setLoading(false); }
  };

  const formatETA = (m) => !m && m !== 0 ? 'N/A' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + 'm' : ''}`.trim();
  const rideStatus = ride?.rideStatus;
  const hex = STATUS_HEX[rideStatus] ?? '#9CA3AF';

  const markers = useMemo(() => {
    const m = [];
    if (ride?.pickupLocation) m.push({ id: 'pickup', position: ride.pickupLocation, type: 'pickup', icon: '📍' });
    if (ride?.dropoffLocation && (['passenger_onboard', 'awaiting_payment', 'completed'].includes(rideStatus)))
      m.push({ id: 'dropoff', position: ride.dropoffLocation, type: 'dropoff', icon: '🎯' });
    return m;
  }, [ride?.pickupLocation?.lat, ride?.pickupLocation?.lng, ride?.dropoffLocation?.lat, ride?.dropoffLocation?.lng, rideStatus]);

  const handleNavigate = () => {
    const dest = (['passenger_onboard', 'awaiting_payment'].includes(rideStatus)) ? ride?.dropoffLocation : ride?.pickupLocation;
    if (!dest) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`, '_blank');
  };

  const appBarBg = isDark
    ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
    : `linear-gradient(135deg, #065F46 0%, #059669 100%)`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{
        background: appBarBg,
        boxShadow: isDark ? `0 2px 16px rgba(0,0,0,0.4)` : `0 4px 20px ${alpha('#059669', 0.28)}`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Ride Details</Typography>
          {rideStatus && (
            <Chip label={rideStatus.replace(/_/g, ' ')} size="small"
              sx={{
                bgcolor: alpha(hex, isDark ? 0.25 : 0.22), color: isDark ? hex : '#fff',
                border: `1px solid ${alpha(hex, isDark ? 0.4 : 0.35)}`,
                fontWeight: 700, textTransform: 'capitalize', height: 24,
              }} />
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', pb: 4, ...hideScrollbar }}>
        {loading ? <RideDetailSkeleton /> : !ride ? (
          <Box sx={{ p: 3 }}><Alert severity="error">Ride not found</Alert></Box>
        ) : (
          <>
            {/* Status strip */}
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${hex} 0%, ${alpha(hex, 0.25)} 100%)` }} />

            <Box sx={{ p: 2.5 }}>
              {/* Rider info */}
              <SectionCard title="Rider" accent={hex}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={ride.rider?.profilePicture} sx={{
                    width: 56, height: 56,
                    border: `2.5px solid ${alpha(hex, 0.5)}`,
                    boxShadow: `0 4px 14px ${alpha(hex, 0.28)}`,
                  }}>
                    {ride.rider?.firstName?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: -0.2 }}>
                      {ride.rider?.firstName} {ride.rider?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{ride.rider?.phoneNumber}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#F59E0B' }}>{ride.rider?.averageRating || '5.0'}</Typography>
                      <Typography variant="caption" color="text.disabled">· {ride.rider?.totalRides || 0} rides</Typography>
                    </Box>
                  </Box>
                </Box>
              </SectionCard>

              {/* Route */}
              <SectionCard title="Route" icon={<NavIcon />} accent="#3B82F6">
                <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#10B981', isDark ? 0.2 : 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PickupIcon sx={{ color: '#10B981', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Pickup</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.pickupLocation?.address}</Typography>
                    {ride.pickupLocation?.name && <Typography variant="caption" color="text.secondary">{ride.pickupLocation.name}</Typography>}
                    {ride.acceptedAt && <Typography variant="caption" color="text.disabled" display="block">{formatDateTime(ride.acceptedAt)}</Typography>}
                  </Box>
                </Box>
                <Box sx={{ width: 2, height: 20, bgcolor: alpha(theme.palette.divider, 0.5), ml: 2.2, mb: 1.5, borderRadius: 1 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#EF4444', isDark ? 0.2 : 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DropIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Dropoff</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ride.dropoffLocation?.address}</Typography>
                    {ride.dropoffLocation?.name && <Typography variant="caption" color="text.secondary">{ride.dropoffLocation.name}</Typography>}
                    {ride.tripCompletedAt && <Typography variant="caption" color="text.disabled" display="block">{formatDateTime(ride.tripCompletedAt)}</Typography>}
                  </Box>
                </Box>
              </SectionCard>

              {/* Fare */}
              <SectionCard title="Fare Breakdown" icon={<ReceiptIcon />} accent="#F59E0B">
                <List disablePadding dense>
                  {[
                    { label: 'Base Fare',     value: ride.baseFare     },
                    { label: 'Distance Fare', value: ride.distanceFare },
                    { label: 'Time Fare',     value: ride.timeFare     },
                  ].filter(r => r.value != null).map(r => (
                    <ListItem key={r.label} sx={{ px: 0, py: 0.6 }}>
                      <ListItemText primary={<Typography variant="body2" color="text.secondary">{r.label}</Typography>} />
                      <Typography variant="body2" fontWeight={500}>{formatCurrency(r.value)}</Typography>
                    </ListItem>
                  ))}
                  {ride.surgeFare > 0 && (
                    <ListItem sx={{ px: 0, py: 0.6 }}>
                      <ListItemText primary={<Typography variant="body2" color="text.secondary">Surge</Typography>} />
                      <Typography variant="body2" color="warning.main" fontWeight={600}>+{formatCurrency(ride.surgeFare)}</Typography>
                    </ListItem>
                  )}
                  {ride.promoDiscount > 0 && (
                    <ListItem sx={{ px: 0, py: 0.6 }}>
                      <ListItemText primary={<Typography variant="body2" color="text.secondary">Promo</Typography>} />
                      <Typography variant="body2" color="success.main" fontWeight={600}>-{formatCurrency(ride.promoDiscount)}</Typography>
                    </ListItem>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <ListItem sx={{ px: 0, py: 0.6 }}>
                    <ListItemText primary={<Typography variant="body2" fontWeight={700}>Total Fare</Typography>} />
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(ride.totalFare)}</Typography>
                  </ListItem>
                  {ride.wasSubscriptionRide ? (
                    <ListItem sx={{ px: 0, py: 0.8, bgcolor: alpha('#10B981', isDark ? 0.12 : 0.07), borderRadius: 2, mt: 0.5, px: 1.5 }}>
                      <ListItemText primary={<Typography variant="body2" fontWeight={700}>Your Earnings</Typography>} secondary="0% commission — subscription ride!" />
                      <Typography variant="subtitle1" fontWeight={800} color="success.main">{formatCurrency(ride.driverEarnings || ride.totalFare)}</Typography>
                    </ListItem>
                  ) : (
                    <>
                      {ride.commission > 0 && (
                        <ListItem sx={{ px: 0, py: 0.6 }}>
                          <ListItemText primary={<Typography variant="body2" color="text.secondary">Commission</Typography>} />
                          <Typography variant="body2" color="error.main">-{formatCurrency(ride.commission)}</Typography>
                        </ListItem>
                      )}
                      <ListItem sx={{ px: 0, py: 0.6 }}>
                        <ListItemText primary={<Typography variant="body2" fontWeight={700}>Your Earnings</Typography>} />
                        <Typography variant="subtitle1" fontWeight={800} color="success.main">{formatCurrency(ride.driverEarnings)}</Typography>
                      </ListItem>
                    </>
                  )}
                </List>
                <Chip label={ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'} size="small"
                  sx={{ mt: 1.5, fontWeight: 700,
                    bgcolor: alpha(ride.paymentMethod === 'cash' ? '#10B981' : '#3B82F6', isDark ? 0.2 : 0.1),
                    color: ride.paymentMethod === 'cash' ? (isDark ? '#34D399' : '#059669') : (isDark ? '#93C5FD' : '#1D4ED8'),
                  }} />
              </SectionCard>

              {/* Stats */}
              <SectionCard title="Trip Stats" accent="#8B5CF6">
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {[
                    { label: 'Distance', value: `${(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km`, color: '#3B82F6' },
                    { label: 'Duration', value: formatETA(ride.actualDuration ?? ride.estimatedDuration), color: '#8B5CF6' },
                  ].map(({ label, value, color }) => (
                    <Paper key={label} elevation={0} sx={{
                      textAlign: 'center', p: 2, borderRadius: 2.5,
                      border: `1px solid ${alpha(color, isDark ? 0.2 : 0.12)}`,
                      background: isDark
                        ? `linear-gradient(145deg, ${alpha(color, 0.12)} 0%, transparent 100%)`
                        : `linear-gradient(145deg, ${alpha(color, 0.07)} 0%, #fff 100%)`,
                      boxShadow: isDark ? 'none' : `0 2px 12px rgba(0,0,0,0.06)`,
                    }}>
                      <Typography variant="h5" fontWeight={800} sx={{
                        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.25,
                      }}>{value}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
                    </Paper>
                  ))}
                </Box>
              </SectionCard>

              {/* Action buttons */}
              {ride.rideStatus === 'accepted' && (
                <Button fullWidth variant="contained" size="large"
                  onClick={async () => { try { await confirmArrival(ride.id); loadRideDetails(); } catch (e) { console.error(e); } }}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: `0 4px 16px ${alpha('#10B981', 0.4)}`, mb: 1 }}>
                  I've Arrived at Pickup
                </Button>
              )}
              {ride.rideStatus === 'arrived' && (
                <Button fullWidth variant="contained" size="large"
                  onClick={async () => { try { await startTrip(ride.id); loadRideDetails(); } catch (e) { console.error(e); } }}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    boxShadow: `0 4px 16px ${alpha('#3B82F6', 0.4)}`, mb: 1 }}>
                  Start Trip
                </Button>
              )}
              {ride.rideStatus === 'passenger_onboard' && (
                <Button fullWidth variant="contained" color="success" size="large"
                  onClick={async () => {
                    if (window.confirm('Complete this ride?')) {
                      try { await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration }); router.push('/home'); }
                      catch (e) { console.error(e); }
                    }
                  }}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: `0 4px 16px ${alpha('#10B981', 0.4)}`, mb: 1 }}>
                  Complete Trip
                </Button>
              )}
              {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
                <Button fullWidth variant="outlined" color="error"
                  onClick={async () => {
                    const reason = window.prompt('Reason for cancellation:');
                    if (reason) { try { await cancelRide(ride.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
                  }}
                  sx={{ height: 48, borderRadius: 3, fontWeight: 700, textTransform: 'none', borderWidth: 1.5 }}>
                  Cancel Ride
                </Button>
              )}

              <Button fullWidth variant="outlined" startIcon={<NavIcon />} onClick={handleNavigate}
                sx={{ height: 48, borderRadius: 3, fontWeight: 600, textTransform: 'none', mt: 1.5 }}>
                Open in Google Maps
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}