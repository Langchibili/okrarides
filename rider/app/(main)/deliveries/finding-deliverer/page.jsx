
'use client';

export const dynamic = 'force-dynamic'; 
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper, CircularProgress,
  LinearProgress, IconButton, Alert, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon, LocalShipping as DeliveryIcon,
  MyLocation as PickupIcon, LocationOn as DropIcon,
  Inventory as PackageIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { getDelivery, cancelDelivery } from '@/lib/api/deliveries';
import { useSocket } from '@/lib/socket/SocketProvider';
import { formatCurrency } from '@/Functions';
import MapIframe from '@/components/Map/MapIframe';

const AMBER = '#F59E0B';

const STAGES = [
  { label: 'Broadcasting request…',      duration: 8000  },
  { label: 'Matching nearby deliverers…', duration: 10000 },
  { label: 'Waiting for acceptance…',    duration: null  },
];

function normalizeCoords(loc) {
  if (!loc) return null;
  const lat = loc.lat ?? loc.latitude;
  const lng = loc.lng ?? loc.longitude;
  if (lat == null || lng == null) return null;
  return { ...loc, lat, lng };
}

export default function FindingDelivererPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const theme        = useTheme();
  const isDark       = theme.palette.mode === 'dark';
  const deliveryId   = searchParams.get('id');

  const [delivery,        setDelivery]        = useState(null);
  const [stage,           setStage]           = useState(0);
  const [progress,        setProgress]        = useState(0);
  const [cancelling,      setCancelling]      = useState(false);
  const [error,           setError]           = useState(null);
  const [noDrivers,       setNoDrivers]       = useState(false);
  const [noDriversReason, setNoDriversReason] = useState(null); // 'no_drivers_available' | 'cancelled'
  const [elapsed,         setElapsed]         = useState(0);

  const { on, off, connected } = useSocket();
  const pollRef    = useRef(null);
  const timerRef   = useRef(null);
  const stageTimer = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
      clearTimeout(stageTimer.current);
    };
  }, []);

  // ─── Load delivery ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!deliveryId) { router.replace('/deliveries'); return; }
    const load = async () => {
      try {
        const res  = await getDelivery(deliveryId);
        const data = res?.data ?? res;
        if (data && mountedRef.current) setDelivery(data);

        if (data?.rideStatus === 'accepted') {
          router.replace(`/deliveries/${deliveryId}/tracking`);
        } else if (data?.rideStatus === 'no_drivers_available') {
          setNoDrivers(true);
          setNoDriversReason('no_drivers_available');
        } else if (data?.rideStatus === 'cancelled') {
          setNoDrivers(true);
          setNoDriversReason('cancelled');
        }
      } catch (err) {
        setError('Could not load delivery details.');
      }
    };
    load();
  }, [deliveryId, router]);

  // ─── Status polling (10s interval) ───────────────────────────────────────
  useEffect(() => {
    if (!deliveryId) return;
    pollRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const res  = await getDelivery(deliveryId);
        const data = res?.data ?? res;
        if (!data || !mountedRef.current) return;
        setDelivery(prev => ({ ...prev, ...data }));

        if (data.rideStatus === 'accepted') {
          clearInterval(pollRef.current);
          router.push(`/deliveries/${deliveryId}/tracking`);
        } else if (data.rideStatus === 'no_drivers_available') {
          clearInterval(pollRef.current);
          setNoDrivers(true);
          setNoDriversReason('no_drivers_available');
        } else if (data.rideStatus === 'cancelled') {
          clearInterval(pollRef.current);
          setNoDrivers(true);
          setNoDriversReason('cancelled');
        }
      } catch {}
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [deliveryId, router]);

  // ─── Socket events ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!connected || !deliveryId) return;

    const handleAccepted = (data) => {
      if (String(data?.deliveryId) !== String(deliveryId)) return;
      clearInterval(pollRef.current);
      router.push(`/deliveries/${deliveryId}/tracking`);
    };

    const handleNoDrivers = (data) => {
      if (String(data?.deliveryId) !== String(deliveryId)) return;
      clearInterval(pollRef.current);
      setNoDrivers(true);
      setNoDriversReason('no_drivers_available');
    };

    const handleCancelled = (data) => {
      if (String(data?.deliveryId) !== String(deliveryId)) return;
      clearInterval(pollRef.current);
      setNoDrivers(true);
      setNoDriversReason('cancelled');
    };

    on('delivery:accepted',   handleAccepted);
    on('delivery:no_drivers', handleNoDrivers);
    on('delivery:cancelled',  handleCancelled);

    return () => {
      off('delivery:accepted');
      off('delivery:no_drivers');
      off('delivery:cancelled');
    };
  }, [connected, deliveryId, on, off, router]);

  // ─── Elapsed timer + stage transitions ───────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setElapsed(s => s + 1);
      setProgress(p => Math.min(p + (100 / 120), 99));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (elapsed === 8)  setStage(1);
    if (elapsed === 18) setStage(2);
  }, [elapsed]);

  // ─── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelDelivery(deliveryId, 'Sender cancelled before acceptance');
      router.replace('/deliveries');
    } catch (err) {
      setError('Could not cancel. Try again.');
      setCancelling(false);
    }
  };

  const pickup  = normalizeCoords(delivery?.pickupLocation);
  const dropoff = normalizeCoords(delivery?.dropoffLocation);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: isDark ? '#0F172A' : '#F8FAFC', overflow: 'hidden' }}>

      {/* Map section */}
      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <MapIframe
          center={pickup ?? { lat: -15.4167, lng: 28.2833 }}
          zoom={13}
          height="100%"
          markers={[
            ...(pickup  ? [{ id: 'pickup',  position: pickup,  type: 'pickup',  icon: '📍' }] : []),
            ...(dropoff ? [{ id: 'dropoff', position: dropoff, type: 'dropoff', icon: '🎯' }] : []),
          ]}
          pickupLocation={pickup}
          dropoffLocation={dropoff}
          showRoute={!!(pickup && dropoff)}
        />

        {/* Pulsing delivery icon overlay */}
        <Box sx={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10, pointerEvents: 'none' }}>
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%',
              background: `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 0 ${alpha(AMBER, 0.6)}`,
              animation: 'ripple 2s ease-out infinite',
              '@keyframes ripple': {
                '0%':   { boxShadow: `0 0 0 0 ${alpha(AMBER, 0.6)}` },
                '70%':  { boxShadow: `0 0 0 24px ${alpha(AMBER, 0)}` },
                '100%': { boxShadow: `0 0 0 0 ${alpha(AMBER, 0)}` },
              },
            }}>
              <DeliveryIcon sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
          </motion.div>
        </Box>
      </Box>

      {/* Bottom sheet */}
      <Paper elevation={0} sx={{
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        p: 3, flexShrink: 0,
        background: isDark ? 'linear-gradient(160deg,#1E293B 0%,#0F172A 100%)' : '#FFFFFF',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
      }}>
        <AnimatePresence mode="wait">
          {noDrivers ? (
            <motion.div
              key="no-drivers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography sx={{ fontSize: 40, mb: 1 }}>
                  {noDriversReason === 'no_drivers_available' ? '🚚' : '😔'}
                </Typography>

                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>
                  {noDriversReason === 'no_drivers_available'
                    ? 'No Deliverers Available'
                    : 'Request Cancelled'}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {noDriversReason === 'no_drivers_available'
                    ? 'No nearby deliverers are available right now. Please try again in a few minutes.'
                    : 'This delivery request was cancelled.'}
                </Typography>

                <Button
                  variant="contained" fullWidth
                  onClick={() => router.push('/deliveries/send')}
                  sx={{
                    height: 52, borderRadius: 3, fontWeight: 700,
                    background: `linear-gradient(135deg,${AMBER} 0%,#D97706 100%)`,
                    color: '#fff', mb: 1.5,
                  }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined" fullWidth
                  onClick={() => router.replace('/deliveries')}
                  sx={{ height: 48, borderRadius: 3, fontWeight: 600 }}
                >
                  Back to Deliveries
                </Button>
              </Box>
            </motion.div>
          ) : (
            <motion.div key="searching" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

              {/* Progress bar */}
              <LinearProgress
                variant="determinate" value={progress}
                sx={{
                  height: 5, borderRadius: 2.5, mb: 2,
                  bgcolor: alpha(AMBER, 0.15),
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg,${AMBER},#D97706)`,
                    borderRadius: 2.5,
                  },
                }}
              />

              {/* Stage label */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <CircularProgress size={22} sx={{ color: AMBER }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {STAGES[stage]?.label}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', fontWeight: 700 }}>
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </Typography>
                  </Box>
                </motion.div>
              </AnimatePresence>

              {/* Delivery summary card */}
              {delivery && (
                <Paper elevation={0} sx={{
                  p: 2, borderRadius: 3, mb: 2,
                  border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}`,
                  bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.02),
                }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#10B981', mt: 0.6, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Pickup
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {delivery.pickupLocation?.address}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: 1, bgcolor: '#EF4444', mt: 0.6, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Dropoff
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {delivery.dropoffLocation?.address}
                      </Typography>
                    </Box>
                  </Box>

                  {delivery.totalFare != null && (
                    <Box sx={{
                      mt: 1.5, pt: 1.5,
                      borderTop: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.07)}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <PackageIcon sx={{ fontSize: 14, color: AMBER }} />
                        <Typography variant="caption" color="text.secondary" textTransform="capitalize">
                          {delivery.package?.packageType ?? 'Package'}
                        </Typography>
                        {delivery.package?.isFragile && (
                          <Chip label="Fragile" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }} />
                        )}
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: AMBER }}>
                        {formatCurrency(delivery.totalFare)}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Cancel button */}
              <Button
                fullWidth variant="outlined" color="error"
                onClick={handleCancel} disabled={cancelling}
                sx={{ height: 48, borderRadius: 3, fontWeight: 600, borderWidth: 1.5 }}
                startIcon={cancelling ? <CircularProgress size={16} /> : <CloseIcon />}
              >
                {cancelling ? 'Cancelling…' : 'Cancel Request'}
              </Button>

            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
    </Box>
  );
}