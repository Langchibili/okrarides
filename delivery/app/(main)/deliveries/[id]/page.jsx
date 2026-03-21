// PATH: driver/app/(main)/deliveries/[id]/page.jsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Paper, Avatar, Divider, IconButton,
  Button, Chip, List, ListItem, ListItemText, Alert,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as BackIcon, LocationOn as DropIcon, MyLocation as PickupIcon,
  Star as StarIcon, Receipt as ReceiptIcon, Navigation as NavIcon,
  LocalShipping as DeliveryIcon, Inventory as PackageIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { useDelivery } from '@/lib/hooks/useDelivery';
import MapIframe from '@/components/Map/MapIframe';
import DeliveryDetailSkeleton from '@/components/Skeletons/RideDetailSkeleton';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

const STATUS_HEX = {
  completed: '#10B981', cancelled: '#EF4444', accepted: '#F59E0B',
  arrived: '#059669', passenger_onboard: '#F59E0B', awaiting_payment: '#EF4444',
};

const STATUS_LABELS = {
  pending: 'Pending', accepted: 'Accepted', arrived: 'Arrived at Pickup',
  passenger_onboard: 'In Transit', awaiting_payment: 'Awaiting Payment',
  completed: 'Delivered', cancelled: 'Cancelled',
};

const PACKAGE_TYPE_LABELS = {
  document: '📄 Document', parcel: '📦 Parcel', food: '🍔 Food',
  groceries: '🛒 Groceries', other: '📫 Other',
};

function SectionCard({ title, icon, children, accent }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
      <Paper elevation={0} sx={{
        p: 2.5, borderRadius: 3, mb: 2,
        border: `1px solid ${alpha(accent ?? theme.palette.divider, isDark ? 0.18 : 0.1)}`,
        background: accent
          ? isDark ? `linear-gradient(145deg,${alpha(accent,0.1)} 0%,transparent 60%)` : `linear-gradient(145deg,${alpha(accent,0.05)} 0%,#FFFFFF 100%)`
          : isDark ? undefined : 'linear-gradient(145deg,#FFFFFF 0%,#FAFAFA 100%)',
        boxShadow: isDark ? 'none' : `0 3px 16px rgba(0,0,0,0.06)`,
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

function formatETA(m) {
  if (!m && m !== 0) return 'N/A';
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + 'm' : ''}`.trim();
}

export default function DeliveryDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading]   = useState(true);
  const { confirmArrival, startDelivery, completeDelivery, cancelDelivery } = useDelivery();
  const mapControlsRef = useRef(null);

  useEffect(() => { loadDeliveryDetails(); }, [params.id]);

  const loadDeliveryDetails = async () => {
    try {
      const response = await apiClient.get(`/deliveries/${params.id}`);
      if (response?.data) setDelivery(response.data);
    } catch (err) {
      console.error('Error loading delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  const rideStatus = delivery?.rideStatus;
  const hex        = STATUS_HEX[rideStatus] ?? '#9CA3AF';

  const markers = useMemo(() => {
    const m = [];
    if (delivery?.pickupLocation) m.push({ id: 'pickup', position: delivery.pickupLocation, type: 'pickup', icon: '📍' });
    if (delivery?.dropoffLocation && ['passenger_onboard', 'awaiting_payment', 'completed'].includes(rideStatus))
      m.push({ id: 'dropoff', position: delivery.dropoffLocation, type: 'dropoff', icon: '🎯' });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery?.pickupLocation?.lat, delivery?.dropoffLocation?.lat, rideStatus]);

  const handleNavigate = () => {
    const dest = ['passenger_onboard', 'awaiting_payment'].includes(rideStatus)
      ? delivery?.dropoffLocation : delivery?.pickupLocation;
    if (!dest) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`, '_blank');
  };

  const appBarBg = isDark
    ? `linear-gradient(135deg,#1E293B 0%,#0F172A 100%)`
    : `linear-gradient(135deg,#92400E 0%,#B45309 100%)`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ background: appBarBg, boxShadow: isDark ? `0 2px 16px rgba(0,0,0,0.4)` : `0 4px 20px ${alpha('#D97706',0.28)}` }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Delivery Details</Typography>
          {rideStatus && (
            <Chip
              label={STATUS_LABELS[rideStatus] ?? rideStatus}
              size="small"
              sx={{ bgcolor: alpha(hex, isDark ? 0.25 : 0.22), color: isDark ? hex : '#fff', border: `1px solid ${alpha(hex,isDark?0.4:0.35)}`, fontWeight: 700, height: 24 }}
            />
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', pb: 4, ...hideScrollbar }}>
        {loading ? (
          <DeliveryDetailSkeleton />
        ) : !delivery ? (
          <Box sx={{ p: 3 }}><Alert severity="error">Delivery not found</Alert></Box>
        ) : (
          <>
            <Box sx={{ height: 4, background: `linear-gradient(90deg,${hex} 0%,${alpha(hex,0.25)} 100%)` }} />

            {/* Map preview */}
            <Box sx={{ height: 200, position: 'relative', overflow: 'hidden' }}>
              <MapIframe
                center={delivery.pickupLocation ?? { lat: -15.4167, lng: 28.2833 }}
                zoom={14} height="100%" markers={markers}
                onMapLoad={(c) => { mapControlsRef.current = c; }}
              />
            </Box>

            <Box sx={{ p: 2.5 }}>
              {/* Sender info */}
              <SectionCard title="Sender" accent={hex}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={delivery.sender?.profilePicture}
                    sx={{ width: 56, height: 56, border: `2.5px solid ${alpha(hex,0.5)}`, boxShadow: `0 4px 14px ${alpha(hex,0.28)}` }}>
                    {delivery.sender?.firstName?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: -0.2 }}>
                      {delivery.sender?.firstName} {delivery.sender?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{delivery.sender?.phoneNumber}</Typography>
                  </Box>
                </Box>
              </SectionCard>

              {/* Package info */}
              {delivery.package && (
                <SectionCard title="Package" icon={<PackageIcon />} accent="#F59E0B">
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="h2" sx={{ lineHeight: 1 }}>
                      {PACKAGE_TYPE_LABELS[delivery.package.packageType]?.split(' ')[0] ?? '📦'}
                    </Typography>
                    <Box>
                      <Typography variant="body1" fontWeight={600} textTransform="capitalize">
                        {PACKAGE_TYPE_LABELS[delivery.package.packageType] ?? 'Package'}
                      </Typography>
                      {delivery.package.description && (
                        <Typography variant="body2" color="text.secondary">{delivery.package.description}</Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        {delivery.package.fragile && (
                          <Chip label="⚠️ Fragile" size="small" color="warning" sx={{ fontWeight: 600 }} />
                        )}
                        {delivery.package.packageStatus && (
                          <Chip label={delivery.package.packageStatus.replace(/_/g, ' ')} size="small" sx={{ fontWeight: 600 }} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </SectionCard>
              )}

              {/* Route */}
              <SectionCard title="Route" icon={<NavIcon />} accent="#3B82F6">
                <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#10B981',isDark?0.2:0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PickupIcon sx={{ color: '#10B981', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Pickup</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {delivery.pickupLocation?.address}
                    </Typography>
                    {delivery.acceptedAt && <Typography variant="caption" color="text.disabled" display="block">{formatDateTime(delivery.acceptedAt)}</Typography>}
                  </Box>
                </Box>
                <Box sx={{ width: 2, height: 20, bgcolor: alpha(theme.palette.divider, 0.5), ml: 2.2, mb: 1.5, borderRadius: 1 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: alpha('#EF4444',isDark?0.2:0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DropIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Dropoff</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {delivery.dropoffLocation?.address}
                    </Typography>
                    {delivery.tripCompletedAt && <Typography variant="caption" color="text.disabled" display="block">{formatDateTime(delivery.tripCompletedAt)}</Typography>}
                  </Box>
                </Box>
              </SectionCard>

              {/* Fare */}
              <SectionCard title="Fare Breakdown" icon={<ReceiptIcon />} accent="#F59E0B">
                <List disablePadding dense>
                  {[
                    { label: 'Base Fare',     value: delivery.baseFare },
                    { label: 'Distance Fare', value: delivery.distanceFare },
                  ].filter(r => r.value != null).map(r => (
                    <ListItem key={r.label} sx={{ px: 0, py: 0.6 }}>
                      <ListItemText primary={<Typography variant="body2" color="text.secondary">{r.label}</Typography>} />
                      <Typography variant="body2" fontWeight={500}>{formatCurrency(r.value)}</Typography>
                    </ListItem>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <ListItem sx={{ px: 0, py: 0.6 }}>
                    <ListItemText primary={<Typography variant="body2" fontWeight={700}>Total Fare</Typography>} />
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(delivery.totalFare)}</Typography>
                  </ListItem>
                  {delivery.wasSubscriptionRide ? (
                    <ListItem sx={{ px: 0, py: 0.8, bgcolor: alpha('#10B981',isDark?0.12:0.07), borderRadius: 2, mt: 0.5, px: 1.5 }}>
                      <ListItemText primary={<Typography variant="body2" fontWeight={700}>Your Earnings</Typography>} secondary="0% commission — subscription ride!" />
                      <Typography variant="subtitle1" fontWeight={800} color="success.main">
                        {formatCurrency(delivery.driverEarnings ?? delivery.totalFare)}
                      </Typography>
                    </ListItem>
                  ) : (
                    <>
                      {delivery.commission > 0 && (
                        <ListItem sx={{ px: 0, py: 0.6 }}>
                          <ListItemText primary={<Typography variant="body2" color="text.secondary">Commission</Typography>} />
                          <Typography variant="body2" color="error.main">-{formatCurrency(delivery.commission)}</Typography>
                        </ListItem>
                      )}
                      <ListItem sx={{ px: 0, py: 0.6 }}>
                        <ListItemText primary={<Typography variant="body2" fontWeight={700}>Your Earnings</Typography>} />
                        <Typography variant="subtitle1" fontWeight={800} color="success.main">
                          {formatCurrency(delivery.driverEarnings)}
                        </Typography>
                      </ListItem>
                    </>
                  )}
                </List>
                <Chip
                  label={delivery.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}
                  size="small"
                  sx={{ mt: 1.5, fontWeight: 700, bgcolor: alpha(delivery.paymentMethod === 'cash' ? '#10B981' : '#3B82F6', isDark ? 0.2 : 0.1), color: delivery.paymentMethod === 'cash' ? (isDark ? '#34D399' : '#059669') : (isDark ? '#93C5FD' : '#1D4ED8') }}
                />
              </SectionCard>

              {/* Stats */}
              <SectionCard title="Delivery Stats" accent="#8B5CF6">
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {[
                    { label: 'Distance', value: `${(delivery.actualDistance ?? delivery.estimatedDistance ?? 0).toFixed(1)} km`, color: '#3B82F6' },
                    { label: 'Duration', value: formatETA(delivery.actualDuration ?? delivery.estimatedDuration), color: '#8B5CF6' },
                  ].map(({ label, value, color }) => (
                    <Paper key={label} elevation={0} sx={{
                      textAlign: 'center', p: 2, borderRadius: 2.5,
                      border: `1px solid ${alpha(color,isDark?0.2:0.12)}`,
                      background: isDark ? `linear-gradient(145deg,${alpha(color,0.12)} 0%,transparent 100%)` : `linear-gradient(145deg,${alpha(color,0.07)} 0%,#fff 100%)`,
                    }}>
                      <Typography variant="h5" fontWeight={800} sx={{ background: `linear-gradient(135deg,${color} 0%,${alpha(color,0.7)} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.25 }}>
                        {value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
                    </Paper>
                  ))}
                </Box>
              </SectionCard>

              {/* Action buttons */}
              {rideStatus === 'accepted' && (
                <Button fullWidth variant="contained" size="large"
                  onClick={async () => { try { await confirmArrival(delivery.id); loadDeliveryDetails(); } catch (e) { console.error(e); } }}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none', background: 'linear-gradient(135deg,#10B981 0%,#059669 100%)', mb: 1 }}>
                  I've Arrived at Pickup
                </Button>
              )}

              {rideStatus === 'arrived' && (
                <Button fullWidth variant="contained" size="large"
                  onClick={async () => { try { await startDelivery(delivery.id); loadDeliveryDetails(); } catch (e) { console.error(e); } }}
                  startIcon={<DeliveryIcon />}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none', background: 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)', mb: 1 }}>
                  Package Picked Up — Start Delivery
                </Button>
              )}

              {rideStatus === 'passenger_onboard' && (
                <Button fullWidth variant="contained" color="success" size="large"
                  onClick={async () => {
                    if (window.confirm('Mark this delivery as completed?')) {
                      try { await completeDelivery(delivery.id, { actualDistance: delivery.estimatedDistance, actualDuration: delivery.estimatedDuration }); router.push('/home'); }
                      catch (e) { console.error(e); }
                    }
                  }}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none', background: 'linear-gradient(135deg,#10B981 0%,#059669 100%)', mb: 1 }}>
                  Mark as Delivered
                </Button>
              )}

              {['accepted', 'arrived'].includes(rideStatus) && (
                <Button fullWidth variant="outlined" color="error"
                  onClick={async () => {
                    const reason = window.prompt('Reason for cancellation:');
                    if (reason) { try { await cancelDelivery(delivery.id, reason); router.push('/home'); } catch (e) { console.error(e); } }
                  }}
                  sx={{ height: 48, borderRadius: 3, fontWeight: 700, textTransform: 'none', borderWidth: 1.5 }}>
                  Cancel Delivery
                </Button>
              )}

              <Button fullWidth variant="outlined" startIcon={<NavIcon />} onClick={handleNavigate}
                sx={{ height: 48, borderRadius: 3, fontWeight: 600, textTransform: 'none', mt: 1.5, borderColor: alpha('#F59E0B',0.5), color: '#F59E0B' }}>
                Open in Google Maps
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}