// PATH: rider/app/(main)/deliveries/[id]/page.jsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Paper, Avatar, Divider,
  IconButton, Button, Chip, List, ListItem, ListItemText, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Rating,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as BackIcon, LocationOn as DropIcon, MyLocation as PickupIcon,
  Star as StarIcon, Receipt as ReceiptIcon, Navigation as NavIcon,
  LocalShipping as DeliveryIcon, Inventory as PackageIcon,
  ContentCopy as CopyIcon, Phone as PhoneIcon, Message as MessageIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MapIframe from '@/components/Map/MapIframeNoSSR';
import { getDelivery, cancelDelivery, rateDelivery } from '@/lib/api/deliveries';
import { formatCurrency, formatDate} from '@/Functions';

const AMBER = '#F59E0B';
const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

const STATUS_HEX = {
  completed: '#10B981', cancelled: '#EF4444', accepted: AMBER,
  arrived: '#10B981', passenger_onboard: AMBER, awaiting_payment: '#EF4444',
};

const STATUS_LABELS = {
  pending: 'Searching for Deliverer', accepted: 'Deliverer En Route',
  arrived: 'Arrived at Pickup', passenger_onboard: 'Package In Transit',
  awaiting_payment: 'Awaiting Payment', completed: 'Delivered ✓', cancelled: 'Cancelled',
};

const PKG_ICONS = { document: '📄', parcel: '📦', food: '🍔', groceries: '🛒', other: '📫' };

const ACTIVE = new Set(['accepted', 'arrived', 'passenger_onboard', 'awaiting_payment']);

function SectionCard({ title, icon, children, accent, sx = {} }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
      <Paper elevation={0} sx={{
        p: 2.5, borderRadius: 3, mb: 2,
        border: `1px solid ${alpha(accent ?? theme.palette.divider, isDark ? 0.18 : 0.1)}`,
        background: accent
          ? isDark ? `linear-gradient(145deg,${alpha(accent,0.1)} 0%,transparent 60%)` : `linear-gradient(145deg,${alpha(accent,0.05)} 0%,#FFF 100%)`
          : isDark ? undefined : 'linear-gradient(145deg,#FFF 0%,#FAFAFA 100%)',
        ...sx,
      }}>
        {title && (
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon && <Box sx={{ '& svg': { fontSize: 18, color: accent ?? 'text.secondary' } }}>{icon}</Box>}
            {title}
          </Typography>
        )}
        {children}
      </Paper>
    </motion.div>
  );
}

// ─── Rating modal ─────────────────────────────────────────────────────────────
function RateDeliveryModal({ open, onClose, deliveryId, onRated }) {
  const [rating,  setRating]  = useState(0);
  const [review,  setReview]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    try {
      await rateDelivery(deliveryId, rating, review);
      onRated?.();
      onClose();
    } catch {} finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 4, maxWidth: 360, mx: 2 } }}>
      <DialogTitle fontWeight={700}>Rate Your Delivery</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 1 }}>
          <Rating size="large" value={rating} onChange={(_, v) => setRating(v ?? 0)}
            sx={{ fontSize: '3rem', '& .MuiRating-iconFilled': { color: AMBER } }} />
          <textarea
            rows={3} placeholder="Optional review…" value={review}
            onChange={(e) => setReview(e.target.value)}
            style={{ width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none', outline: 'none' }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Skip</Button>
        <Button onClick={handleSubmit} disabled={!rating || loading} variant="contained"
          sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, bgcolor: AMBER, '&:hover': { bgcolor: '#D97706' }, color: '#fff' }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [delivery,     setDelivery]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [cancelOpen,   setCancelOpen]   = useState(false);
  const [cancelling,   setCancelling]   = useState(false);
  const [ratingOpen,   setRatingOpen]   = useState(false);
  const [rated,        setRated]        = useState(false);
  const mapControlsRef = useRef(null);

  useEffect(() => { load(); }, [params.id]);

  const load = async () => {
    try {
      const res  = await getDelivery(params.id);
      const data = res?.data ?? res;
      if (data) setDelivery(data);
    } catch {} finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelDelivery(params.id, 'Sender cancelled');
      setCancelOpen(false);
      load();
    } catch {} finally { setCancelling(false); }
  };

  const rideStatus   = delivery?.rideStatus;
  const hex          = STATUS_HEX[rideStatus] ?? '#9CA3AF';
  const isActive     = ACTIVE.has(rideStatus);
  const isCompleted  = rideStatus === 'completed';
  const isCancellable = ['pending', 'accepted'].includes(rideStatus);

  const markers = useMemo(() => {
    const m = [];
    if (delivery?.pickupLocation)  m.push({ id: 'pickup',  position: delivery.pickupLocation,  type: 'pickup',  icon: '📍' });
    if (delivery?.dropoffLocation) m.push({ id: 'dropoff', position: delivery.dropoffLocation, type: 'dropoff', icon: '🎯' });
    return m;
  }, [delivery?.pickupLocation?.lat, delivery?.dropoffLocation?.lat]);

  const appBarBg = isDark ? `linear-gradient(135deg,#1E293B 0%,#0F172A 100%)` : `linear-gradient(135deg,#92400E 0%,#B45309 100%)`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ background: appBarBg }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Delivery Details</Typography>
          {rideStatus && (
            <Chip label={STATUS_LABELS[rideStatus] ?? rideStatus} size="small"
              sx={{ bgcolor: alpha(hex, isDark?0.25:0.22), color: isDark?hex:'#fff', border: `1px solid ${alpha(hex,isDark?0.4:0.35)}`, fontWeight: 700, height: 24, maxWidth: 160, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', pb: 4, ...hideScrollbar }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress sx={{ color: AMBER }} /></Box>
        ) : !delivery ? (
          <Box sx={{ p: 3 }}><Alert severity="error">Delivery not found</Alert></Box>
        ) : (
          <>
            {/* Status accent */}
            <Box sx={{ height: 4, background: `linear-gradient(90deg,${hex} 0%,${alpha(hex,0.2)} 100%)` }} />

            {/* Map preview */}
            <Box sx={{ height: 200, position: 'relative', overflow: 'hidden' }}>
              <MapIframe center={delivery.pickupLocation ?? { lat: -15.4167, lng: 28.2833 }}
                zoom={13} height="100%" markers={markers}
                pickupLocation={delivery.pickupLocation} dropoffLocation={delivery.dropoffLocation} showRoute
                onMapLoad={(c) => { mapControlsRef.current = c; }} />
            </Box>

            <Box sx={{ p: 2.5 }}>
              {/* Active status — track button */}
              {isActive && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <Button fullWidth variant="contained" size="large" onClick={() => router.push(`/deliveries/${params.id}/tracking`)}
                    startIcon={<DeliveryIcon />}
                    sx={{ height: 52, borderRadius: 3, fontWeight: 700, mb: 2.5, background: `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)`, boxShadow: `0 6px 20px ${alpha(AMBER,0.45)}`, color: '#fff' }}>
                    Track Package
                  </Button>
                </motion.div>
              )}

              {/* Rate button (completed, not yet rated) */}
              {isCompleted && !rated && !delivery.senderRating && (
                <Button fullWidth variant="outlined" size="large" onClick={() => setRatingOpen(true)}
                  startIcon={<StarIcon />}
                  sx={{ height: 48, borderRadius: 3, fontWeight: 600, mb: 2, borderColor: alpha(AMBER,0.6), color: AMBER }}>
                  Rate this Delivery
                </Button>
              )}

              {/* Package info */}
              <SectionCard title="Package" icon={<PackageIcon />} accent={AMBER}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: 36 }}>{PKG_ICONS[delivery.package?.packageType] ?? '📦'}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} textTransform="capitalize">
                      {delivery.package?.packageType ?? 'Package'}
                    </Typography>
                    {delivery.package?.description && (
                      <Typography variant="body2" color="text.secondary">{delivery.package.description}</Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      {delivery.package?.isFragile && <Chip label="⚠️ Fragile" size="small" color="error" sx={{ fontWeight: 700, height: 20 }} />}
                      {delivery.package?.packageStatus && (
                        <Chip label={delivery.package.packageStatus.replace(/_/g,' ')} size="small"
                          color={delivery.package.packageStatus === 'delivered' ? 'success' : 'default'} sx={{ fontWeight: 700, height: 20 }} />
                      )}
                    </Box>
                  </Box>
                </Box>
                {delivery.package?.recipientName && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha(isDark?'#fff':'#000',0.07)}` }}>
                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Recipient</Typography>
                    <Typography variant="body2" fontWeight={600}>{delivery.package.recipientName}</Typography>
                    {delivery.package.recipientPhone && (
                      <Typography variant="body2" color="text.secondary">{delivery.package.recipientPhone}</Typography>
                    )}
                  </Box>
                )}
              </SectionCard>

              {/* Deliverer info (only when assigned) */}
              {delivery.deliverer && (
                <SectionCard title="Deliverer" accent={hex}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 52, height: 52, border: `2.5px solid ${alpha(hex,0.45)}` }}>
                      {delivery.deliverer.firstName?.[0]}{delivery.deliverer.lastName?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {delivery.deliverer.firstName} {delivery.deliverer.lastName}
                      </Typography>
                      {delivery.deliverer.deliveryProfile?.averageRating > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 14, color: AMBER }} />
                          <Typography variant="caption" fontWeight={700} sx={{ color: AMBER }}>
                            {delivery.deliverer.deliveryProfile.averageRating.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                      {delivery.vehicle && (
                        <Typography variant="caption" color="text.secondary">
                          {delivery.vehicle.make} {delivery.vehicle.model} · {delivery.vehicle.numberPlate}
                        </Typography>
                      )}
                    </Box>
                    {isActive && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => window.location.href = `tel:${delivery.deliverer.phoneNumber}`}
                          sx={{ bgcolor: 'success.main', color: '#fff', width: 36, height: 36 }}>
                          <PhoneIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton onClick={() => window.open(`https://wa.me/${delivery.deliverer.phoneNumber?.replace(/\D/g,'')}`, '_blank')}
                          sx={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', width: 36, height: 36 }}>
                          <MessageIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </SectionCard>
              )}

              {/* Route */}
              <SectionCard title="Route" icon={<NavIcon />} accent="#3B82F6">
                <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha('#10B981',isDark?0.2:0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PickupIcon sx={{ color: '#10B981', fontSize: 18 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Pickup</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {delivery.pickupLocation?.address}
                    </Typography>
                    {delivery.acceptedAt && <Typography variant="caption" color="text.disabled">{formatDate(delivery.acceptedAt)}</Typography>}
                  </Box>
                </Box>
                <Box sx={{ width: 2, height: 16, bgcolor: alpha(theme.palette.divider,0.5), ml: 2, mb: 1.5, borderRadius: 1 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha('#EF4444',isDark?0.2:0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DropIcon sx={{ color: '#EF4444', fontSize: 18 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Dropoff</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {delivery.dropoffLocation?.address}
                    </Typography>
                    {delivery.tripCompletedAt && <Typography variant="caption" color="text.disabled">{formatDate(delivery.tripCompletedAt)}</Typography>}
                  </Box>
                </Box>
              </SectionCard>

              {/* Fare */}
              <SectionCard title="Fare" icon={<ReceiptIcon />} accent={AMBER}>
                <List disablePadding dense>
                  {delivery.baseFare != null && (
                    <ListItem sx={{ px: 0, py: 0.6 }}><ListItemText primary={<Typography variant="body2" color="text.secondary">Base Fare</Typography>} /><Typography variant="body2" fontWeight={500}>{formatCurrency(delivery.baseFare)}</Typography></ListItem>
                  )}
                  {delivery.distanceFare != null && (
                    <ListItem sx={{ px: 0, py: 0.6 }}><ListItemText primary={<Typography variant="body2" color="text.secondary">Distance Fare</Typography>} /><Typography variant="body2" fontWeight={500}>{formatCurrency(delivery.distanceFare)}</Typography></ListItem>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <ListItem sx={{ px: 0, py: 0.6 }}>
                    <ListItemText primary={<Typography variant="body2" fontWeight={700}>Total</Typography>} />
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: AMBER }}>{formatCurrency(delivery.totalFare ?? 0)}</Typography>
                  </ListItem>
                </List>
                {delivery.paymentMethod && (
                  <Chip label={delivery.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'} size="small"
                    sx={{ mt: 1, fontWeight: 700, bgcolor: alpha(AMBER,isDark?0.18:0.1), color: AMBER, border: `1px solid ${alpha(AMBER,0.3)}` }} />
                )}
              </SectionCard>

              {/* Cancel button */}
              {isCancellable && (
                <Button fullWidth variant="outlined" color="error" onClick={() => setCancelOpen(true)}
                  sx={{ height: 48, borderRadius: 3, fontWeight: 600, borderWidth: 1.5, mt: 0.5 }}>
                  Cancel Delivery
                </Button>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} PaperProps={{ sx: { borderRadius: 4, mx: 2 } }}>
        <DialogTitle fontWeight={700}>Cancel Delivery?</DialogTitle>
        <DialogContent>
          <DialogContentText>Your delivery request will be cancelled. This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCancelOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Keep It</Button>
          <Button onClick={handleCancel} disabled={cancelling} variant="contained" color="error" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
            {cancelling ? <CircularProgress size={18} color="inherit" /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating modal */}
      <RateDeliveryModal open={ratingOpen} onClose={() => setRatingOpen(false)} deliveryId={params.id}
        onRated={() => { setRated(true); load(); }} />
    </Box>
  );
}