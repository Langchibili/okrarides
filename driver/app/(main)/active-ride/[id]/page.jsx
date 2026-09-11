'use client';
// PATH: driver/app/(main)/active-ride/[id]/page.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Button, Paper, IconButton, Avatar,
  Fab, Chip, Alert, CircularProgress, List, ListItem, ListItemText, Divider,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Phone as PhoneIcon, Navigation as NavigationIcon,
  Check as CheckIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon,
  Star as StarIcon, Receipt as ReceiptIcon, Message as MessageIcon,
  OpenInNew as OpenInNewIcon, Close as CloseIcon, Payment as PaymentIcon,
  AccessTime as TimerIcon, Map as MapIcon, Speed as SpeedIcon,
  Cancel as CancelIcon, Warning as WarningIcon, KeyboardArrowUp as ArrowUpIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRide } from '@/lib/hooks/useRide';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { formatCurrency, formatDateTime } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { RIDE_STATUS, SOCKET_EVENTS } from '@/Constants';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import MapIframe from '@/components/Map/MapIframeNoSSR';

const COMPLETE_TRIP_LOCK_MS = 60_000;
const DEFAULT_CANCEL_REASON = 'Change of plans';

function getPollingInterval(settings) {
  const v = settings?.appsServerPollingIntervalInSeconds;
  return v && Number(v) > 0 ? Number(v) * 1000 : 20_000;
}

const normalizeCoords = (loc) => {
  if (!loc) return null;
  const lat = loc.lat ?? loc.latitude;
  const lng = loc.lng ?? loc.longitude;
  if (lat == null || lng == null) return null;
  return { ...loc, lat, lng };
};

const deg2rad = (d) => d * (Math.PI / 180);
const calculateDistance = (a, b) => {
  if (!a || !b) return 0;
  const lat1 = a.lat ?? a.latitude ?? 0, lat2 = b.lat ?? b.latitude ?? 0;
  const lng1 = a.lng ?? a.longitude ?? 0, lng2 = b.lng ?? b.longitude ?? 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lng2 - lng1);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};
const estimateDuration = (km) => Math.ceil((km / 30) * 60);
const formatETA = (m) => {
  if (!m && m !== 0) return 'Calculating…';
  if (m < 1) return 'Less than a minute';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r === 0 ? `${h} hr` : `${h} hr ${r} min`;
};

// ═══════════════════════════════════════════════════════════════════════════
// SwipeButton — drag thumb to confirm an action
// ═══════════════════════════════════════════════════════════════════════════
function SwipeButton({ onSuccess, direction = 'right', label, trackGradient, thumbGradient, disabled, resetKey }) {
  const trackRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0 });
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const THUMB_W = 64;

  // Reset when ride status changes
  useEffect(() => {
    setProgress(0);
    setTriggered(false);
    setIsDragging(false);
    dragRef.current.active = false;
  }, [resetKey]);

  const getMax = () => Math.max(10, (trackRef.current?.offsetWidth ?? 320) - THUMB_W - 8);

  const onStart = useCallback((clientX) => {
    if (disabled || triggered) return;
    dragRef.current = { active: true, startX: clientX };
    setIsDragging(true);
  }, [disabled, triggered]);

  const onMove = useCallback((clientX) => {
    if (!dragRef.current.active) return;
    const max = getMax();
    const delta = direction === 'right'
      ? clientX - dragRef.current.startX
      : dragRef.current.startX - clientX;
    const p = Math.max(0, Math.min(1, delta / max));
    setProgress(p);
    if (p >= 0.9) {
      dragRef.current.active = false;
      setIsDragging(false);
      setTriggered(true);
      setProgress(1);
      setTimeout(() => onSuccess?.(), 60);
    }
  }, [direction, onSuccess]);

  const onEnd = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    if (!triggered) setProgress(0);
  }, [triggered]);

  // Global mouse listeners so dragging outside the element still works
  useEffect(() => {
    const mm = (e) => onMove(e.clientX);
    const mu = () => onEnd();
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
  }, [onMove, onEnd]);

  const thumbLeft = direction === 'right'
    ? 4 + progress * getMax()
    : 4 + (1 - progress) * getMax();

  return (
    <Box
      ref={trackRef}
      sx={{
        position: 'relative', height: 70, borderRadius: 35,
        overflow: 'hidden', userSelect: 'none', touchAction: 'none',
        background: trackGradient,
        boxShadow: '0 10px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.25)',
        opacity: disabled ? 0.42 : 1,
        transition: 'opacity 0.25s ease',
      }}
    >
      {/* Progress fill overlay */}
      <Box sx={{
        position: 'absolute', top: 0, bottom: 0,
        left: direction === 'right' ? 0 : 'auto',
        right: direction === 'left' ? 0 : 'auto',
        width: `${Math.round(progress * 100)}%`,
        background: 'rgba(255,255,255,0.14)',
        transition: isDragging ? 'none' : 'width 0.35s ease',
        pointerEvents: 'none',
      }} />

      {/* Animated chevron hints */}
      {!triggered && (
        <Box sx={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 0.25, pointerEvents: 'none',
          opacity: Math.max(0, 1 - progress * 3.5),
        }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                color: 'rgba(255,255,255,0.6)', fontSize: 30, lineHeight: 1, fontWeight: 900,
                animation: `chevronHint${direction} 1.4s ${i * 0.19}s ease-in-out infinite`,
                [`@keyframes chevronHint${direction}`]: {
                  '0%, 100%': {
                    transform: `translateX(${direction === 'right' ? '-7px' : '7px'})`,
                    opacity: 0.2,
                  },
                  '50%': { transform: 'translateX(0px)', opacity: 0.9 },
                },
              }}
            >
              {direction === 'right' ? '›' : '‹'}
            </Box>
          ))}
        </Box>
      )}

      {/* Centre label */}
      <Box sx={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <Typography sx={{
          fontWeight: 800, color: 'rgba(255,255,255,0.95)', fontSize: '0.82rem',
          letterSpacing: 1.6, textTransform: 'uppercase',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>
          {triggered ? '✓  Done!' : label}
        </Typography>
      </Box>

      {/* Draggable thumb */}
      <Box
        sx={{
          position: 'absolute', top: 5, height: 60, width: THUMB_W, borderRadius: 30,
          left: thumbLeft,
          background: thumbGradient,
          boxShadow: '0 6px 28px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'left 0.42s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 2,
        }}
        onMouseDown={(e) => { e.preventDefault(); onStart(e.clientX); }}
        onTouchStart={(e) => { e.preventDefault(); onStart(e.touches[0].clientX); }}
        onTouchMove={(e) => { e.preventDefault(); onMove(e.touches[0].clientX); }}
        onTouchEnd={onEnd}
      >
        <Typography sx={{ color: 'white', fontSize: 26, lineHeight: 1, fontWeight: 900, userSelect: 'none' }}>
          {triggered ? '✓' : direction === 'right' ? '›' : '‹'}
        </Typography>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CustomBottomSheet — single swipeable drawer, full-height capable
// ═══════════════════════════════════════════════════════════════════════════
function CustomBottomSheet({ children }) {
  const PEEK = 78;

  const [screenH, setScreenH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setScreenH(window.innerHeight);
    const onResize = () => setScreenH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const collapsedY = screenH - PEEK;
  const expandedY = 0;

  // Use refs for values needed in event listeners to avoid stale closures
  const collapsedYRef = useRef(collapsedY);
  const expandedYRef = useRef(expandedY);
  useEffect(() => { collapsedYRef.current = collapsedY; }, [collapsedY]);
  useEffect(() => { expandedYRef.current = expandedY; }, [expandedY]);

  const [sheetTop, setSheetTop] = useState(null); // null = use collapsedY
  const sheetTopRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const dragStart = useRef({ y: 0, top: 0 });

  const commitTop = useCallback((v) => {
    sheetTopRef.current = v;
    setSheetTop(v);
  }, []);

  const top = sheetTop ?? collapsedY;
  const isOpen = top < collapsedY - 20;

  // ── Drag start (handle area only) ────────────────────────────────────────
  const onHandleStart = useCallback((clientY) => {
    const currentTop = sheetTopRef.current ?? collapsedYRef.current;
    dragStart.current = { y: clientY, top: currentTop };
    draggingRef.current = true;
    setIsDragging(true);
  }, []);

  // ── Global mouse listeners ────────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingRef.current) return;
      const delta = e.clientY - dragStart.current.y;
      const newTop = Math.max(expandedYRef.current, Math.min(collapsedYRef.current, dragStart.current.top + delta));
      commitTop(newTop);
    };
    const onMouseUp = (e) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
      const delta = e.clientY - dragStart.current.y;
      const finalTop = Math.max(expandedYRef.current, Math.min(collapsedYRef.current, dragStart.current.top + delta));
      const mid = (collapsedYRef.current + expandedYRef.current) / 2;
      commitTop(delta > 60 || finalTop > mid ? collapsedYRef.current : expandedYRef.current);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [commitTop]);

  // ── Touch handlers ────────────────────────────────────────────────────────
  const onTouchMove = useCallback((e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const delta = e.touches[0].clientY - dragStart.current.y;
    const newTop = Math.max(expandedYRef.current, Math.min(collapsedYRef.current, dragStart.current.top + delta));
    commitTop(newTop);
  }, [commitTop]);

  const onTouchEnd = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    const delta = e.changedTouches[0].clientY - dragStart.current.y;
    const finalTop = Math.max(expandedYRef.current, Math.min(collapsedYRef.current, dragStart.current.top + delta));
    const mid = (collapsedYRef.current + expandedYRef.current) / 2;
    commitTop(delta > 60 || finalTop > mid ? collapsedYRef.current : expandedYRef.current);
  }, [commitTop]);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${top}px`,
        height: `${screenH}px`,
        zIndex: 20,
        borderRadius: '24px 24px 0 0',
        bgcolor: 'background.paper',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.32)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging ? 'none' : 'top 0.38s cubic-bezier(0.32,0.72,0,1)',
        willChange: 'top',
      }}
    >
      {/* ── Drag handle ────────────────────────────────────────────────────── */}
      <Box
        onMouseDown={(e) => { e.preventDefault(); onHandleStart(e.clientY); }}
        onTouchStart={(e) => onHandleStart(e.touches[0].clientY)}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        sx={{
          pt: 1.25, pb: 0.75,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4,
          flexShrink: 0,
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Pill */}
        <Box sx={{
          width: 40, height: 4.5, borderRadius: 3,
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)',
        }} />

        {/* Swipe-up / swipe-down hint */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
          <ArrowUpIcon sx={{
            fontSize: 15,
            color: 'text.disabled',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s ease',
            animation: isOpen ? 'none' : 'pulseArrowCS 1.7s ease-in-out infinite',
            '@keyframes pulseArrowCS': {
              '0%, 100%': { transform: 'translateY(3px)', opacity: 0.3 },
              '50%': { transform: 'translateY(-1px)', opacity: 0.85 },
            },
          }} />
          <Typography variant="caption" sx={{
            color: 'text.disabled', fontSize: '0.65rem', fontWeight: 700,
            letterSpacing: 1.1, textTransform: 'uppercase',
          }}>
            {isOpen ? 'Close' : 'Details'}
          </Typography>
          <ArrowUpIcon sx={{
            fontSize: 15,
            color: 'text.disabled',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s ease',
            animation: isOpen ? 'none' : 'pulseArrowCS2 1.7s 0.28s ease-in-out infinite',
            '@keyframes pulseArrowCS2': {
              '0%, 100%': { transform: 'translateY(3px)', opacity: 0.3 },
              '50%': { transform: 'translateY(-1px)', opacity: 0.85 },
            },
          }} />
        </Box>
      </Box>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: isOpen ? 'auto' : 'hidden',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════
export default function ActiveRidePage() {
  const params = useParams();
  const router = useRouter();

  const { currentRide, startTrip, completeTrip, cancelRide, confirmArrival } = useRide();
  const { updateLocation } = useSocket();
  const { isNative, getCurrentLocation, on: rnOn } = useReactNative();
  const { emit, on: socketOn, off: socketOff } = useSocket();
  const { isOkrapayEnabled, allowRidePaymentWithOkraPay, settings } = useAdminSettings();

  const okrapayAllowedForRides = isOkrapayEnabled && allowRidePaymentWithOkraPay;

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);

  // ── MAP: route state ───────────────────────────────────────────────────────
  const [routePickup, setRoutePickup] = useState(null);
  const [routeDropoff, setRouteDropoff] = useState(null);
  const [routeReady, setRouteReady] = useState(false);
  const routeStatusRef = useRef(null);

  const [showNavPopup, setShowNavPopup] = useState(false);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completing, setCompleting] = useState(false);

  // ── Cancel flow ────────────────────────────────────────────────────────────
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelReasons, setShowCancelReasons] = useState(false);
  const [cancelReasons, setCancelReasons] = useState([]);
  const [cancelReasonsLoading, setCancelReasonsLoading] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [cancelOtherText, setCancelOtherText] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const mapControlsRef = useRef(null);
  const fullScreenMapControlsRef = useRef(null);
  const fullScreenMapInitializedRef = useRef(false);

  const [paymentRequested, setPaymentRequested] = useState(false);
  const [completeLockSecondsLeft, setCompleteLockSecondsLeft] = useState(0);

  const lockTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const pollingRef = useRef(null);
  const locationPollRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(lockTimerRef.current);
      clearInterval(countdownRef.current);
      clearInterval(pollingRef.current);
      clearInterval(locationPollRef.current);
    };
  }, []);

  // ── Load ride ──────────────────────────────────────────────────────────────
  const loadRideDetails = useCallback(async () => {
    try {
      const response = await apiClient.get(`/rides/${params.id}`);
      if (response?.data && mountedRef.current) {
        const rideData = response.data;
        if (rideData.currentDriverLocation) {
          const norm = normalizeCoords(rideData.currentDriverLocation);
          if (norm) setDriverLocation(norm);
        }
        setRide(rideData);
      }
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { loadRideDetails(); }, [loadRideDetails]);

  // ── Status polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ride?.id) return;
    const ACTIVE = ['accepted', 'arrived', 'passenger_onboard', 'awaiting_payment'];
    if (!ACTIVE.includes(ride.rideStatus)) return;

    const interval = getPollingInterval(settings);
    pollingRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const res = await apiClient.get(`/rides/${ride.id}?populate=rider,vehicle`);
        const backend = res?.data;
        if (!backend || !mountedRef.current) return;
        if (backend.paymentStatus === 'completed' || backend.rideStatus === 'completed') {
          clearInterval(pollingRef.current);
          router.push('/home');
          return;
        }
        setRide(prev => prev ? { ...prev, ...backend } : prev);
      } catch (err) { console.error('[ActiveRide] poll error:', err); }
    }, interval);

    return () => clearInterval(pollingRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id, ride?.rideStatus, settings]);

  // ── MAP: reset route when status changes ───────────────────────────────────
  useEffect(() => {
    routeStatusRef.current = null;
    setRouteReady(false);
    setRoutePickup(null);
    setRouteDropoff(null);
  }, [ride?.rideStatus]);

  const rideStatus = ride?.rideStatus;

  // ── 2-second live location + ETA + route ──────────────────────────────────
  useEffect(() => {
    if (!ride || ['completed', 'cancelled'].includes(rideStatus)) return;

    const updateLocations = async () => {
      if (!mountedRef.current) return;
      try {
        const driverRes = await apiClient.get(`/users/${ride.driver?.id}`);
        const rawDriver = driverRes?.data?.currentLocation ?? driverRes?.currentLocation;
        const driverLoc = normalizeCoords(rawDriver);

        if (driverLoc && mountedRef.current) {
          setDriverLocation(driverLoc);
          mapControlsRef.current?.updateDriverLocation(driverLoc);
          if (fullScreenMapInitializedRef.current) {
            fullScreenMapControlsRef.current?.updateDriverLocation(driverLoc);
          }
          updateLocation(driverLoc, rawDriver?.heading || 0, rawDriver?.speed || 0);
        }

        if (rideStatus === 'accepted' && driverLoc) {
          const riderRes = await apiClient.get(`/users/${ride.rider?.id}`);
          const rawRider = riderRes?.data?.currentLocation ?? riderRes?.currentLocation;
          const riderLoc = normalizeCoords(rawRider);
          const etaDest = riderLoc ?? normalizeCoords(ride.pickupLocation);
          if (etaDest) {
            const dist = calculateDistance(driverLoc, etaDest);
            if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
          }
          const pickup = normalizeCoords(ride.pickupLocation);
          if (pickup) {
            setRoutePickup(driverLoc);
            setRouteDropoff(pickup);
            setRouteReady(true);
          }
        }

        if ((rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') && driverLoc) {
          const dropoff = normalizeCoords(ride.dropoffLocation);
          if (dropoff) {
            const dist = calculateDistance(driverLoc, dropoff);
            if (mountedRef.current) { setDistance(dist); setEta(estimateDuration(dist)); }
          }
          if (routeStatusRef.current !== 'passenger_onboard') {
            routeStatusRef.current = 'passenger_onboard';
            const pickup = normalizeCoords(ride.pickupLocation);
            const dropoffNorm = normalizeCoords(ride.dropoffLocation);
            if (pickup && dropoffNorm) {
              setRoutePickup(pickup);
              setRouteDropoff(dropoffNorm);
              setRouteReady(true);
            }
          }
        }
      } catch (err) { console.error('[ActiveRide] location update error:', err); }
    };

    updateLocations();
    locationPollRef.current = setInterval(updateLocations, 2000);
    return () => clearInterval(locationPollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.id, rideStatus, ride?.driver?.id, ride?.rider?.id]);

  // ── MAP: markers ───────────────────────────────────────────────────────────
  const markers = useMemo(() => {
    if (!ride) return [];
    const pickupLoc = normalizeCoords(ride.pickupLocation);
    const dropoffLoc = normalizeCoords(ride.dropoffLocation);

    if (rideStatus === 'accepted') {
      const result = [];
      if (pickupLoc) result.push({ id: 'pickup', position: pickupLoc, type: 'pickup' });
      return result;
    }
    if (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment' || rideStatus === 'arrived') {
      const result = [];
      if (pickupLoc) result.push({ id: 'pickup', position: pickupLoc, type: 'pickup' });
      if (dropoffLoc) result.push({ id: 'dropoff', position: dropoffLoc, type: 'dropoff' });
      return result;
    }
    return [];
  }, [rideStatus, ride]);

  // ── PAYMENT_RECEIVED listeners ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = rnOn('PAYMENT_RECEIVED', (payload) => {
      if (payload?.rideId && String(payload.rideId) !== String(params.id)) return;
      clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
      router.push('/home');
    });
    return () => unsub?.();
  }, [rnOn, params.id, router]);

  useEffect(() => {
    const handler = (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg?.type !== 'PAYMENT_RECEIVED') return;
        if (msg.payload?.rideId && String(msg.payload.rideId) !== String(params.id)) return;
        clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
        router.push('/home');
      } catch { }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [params.id, router]);

  useEffect(() => {
    const handlePaymentReceived = (data) => {
      if (data.rideId && String(data.rideId) !== String(params.id)) return;
      clearTimeout(lockTimerRef.current); clearInterval(countdownRef.current); clearInterval(pollingRef.current);
      router.push('/home');
    };
    socketOn(SOCKET_EVENTS.PAYMENT.RECEIVED, handlePaymentReceived);
    return () => socketOff(SOCKET_EVENTS.PAYMENT.RECEIVED);
  }, [socketOn, socketOff, params.id, router]);

  // ── Request payment ────────────────────────────────────────────────────────
  const handleRequestPayment = useCallback(() => {
    try {
      emit(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, { rideId: ride.id, driverId: ride.driver?.id, riderId: ride.rider?.id, finalFare: ride.totalFare });
      setPaymentRequested(true);
      setCompleteLockSecondsLeft(Math.round(COMPLETE_TRIP_LOCK_MS / 1000));
      countdownRef.current = setInterval(() => {
        setCompleteLockSecondsLeft(prev => { if (prev <= 1) { clearInterval(countdownRef.current); return 0; } return prev - 1; });
      }, 1000);
      lockTimerRef.current = setTimeout(() => { setCompleteLockSecondsLeft(0); setPaymentRequested(false); }, COMPLETE_TRIP_LOCK_MS);
    } catch (err) { console.error('Error requesting payment:', err); }
  }, [emit, ride]);

  const completeTripLocked = completeLockSecondsLeft > 0;

  const handleStartTrip = async () => { try { await startTrip(ride.id); loadRideDetails(); } catch (err) { console.error(err); } };
  const handleCompleteTrip = async () => { if (completeTripLocked) return; setShowCompleteDialog(true); };
  const handleConfirmComplete = async () => {
    setCompleting(true);
    try { await completeTrip(ride.id, { actualDistance: ride.estimatedDistance, actualDuration: ride.estimatedDuration }); router.push('/home'); }
    catch (err) { console.error(err); setCompleting(false); setShowCompleteDialog(false); }
  };
  const handleConfirmArrival = async () => { try { await confirmArrival(ride.id); loadRideDetails(); } catch (err) { console.error(err); } };
  const handleNavigate = () => setShowNavPopup(prev => !prev);

  // ── Call rider (shared logic) ──────────────────────────────────────────────
  const callRider = useCallback(() => {
    const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber;
    const d = (raw || '').replace(/\D/g, '');
    window.location.href = `tel:${d.length > 10 ? d.slice(-10) : d}`;
  }, [ride]);

  const handleOpenInGoogleMaps = () => {
    const dest = (rideStatus === 'accepted' || rideStatus === 'arrived')
      ? normalizeCoords(ride?.pickupLocation)
      : normalizeCoords(ride?.dropoffLocation);
    if (dest?.lat && dest?.lng)
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`, '_blank');
  };

  // ── Cancel handlers ────────────────────────────────────────────────────────
  const handleCancelPress = () => setShowCancelConfirm(true);
  const handleCancelConfirmNo = () => setShowCancelConfirm(false);

  const handleCancelConfirmYes = async () => {
    setShowCancelConfirm(false);
    setCancelReasonsLoading(true);
    setShowCancelReasons(true);
    setSelectedCancelReason('');
    setCancelOtherText('');
    try {
      const res = await apiClient.get('/cancellation-reasons?filters[isActive][$eq]=true&filters[applicableFor][$in][0]=driver&filters[applicableFor][$in][1]=both&sort=displayOrder:asc');
      const reasons = res?.data ?? res ?? [];
      if (mountedRef.current) setCancelReasons(reasons);
    } catch (err) {
      console.error('[ActiveRide] failed to load cancellation reasons:', err);
      if (mountedRef.current) setCancelReasons([]);
    } finally {
      if (mountedRef.current) setCancelReasonsLoading(false);
    }
  };

  const handleCancelWithReason = async () => {
    const isOther = selectedCancelReason === '__other__';
    const reason = isOther
      ? (cancelOtherText.trim() || 'Other')
      : (cancelReasons.find(r => String(r.id) === String(selectedCancelReason))?.reason || selectedCancelReason);
    if (!reason) return;
    setCancelling(true);
    try { await cancelRide(ride.id, reason); router.push('/home'); }
    catch (e) { console.error(e); setCancelling(false); }
  };

  const handleCancelWithoutReason = async () => {
    setCancelling(true);
    try { await cancelRide(ride.id, DEFAULT_CANCEL_REASON); router.push('/home'); }
    catch (e) { console.error(e); setCancelling(false); }
  };

  const handleCloseCancelReasons = () => {
    if (cancelling) return;
    setShowCancelReasons(false);
    setCancelReasons([]);
    setSelectedCancelReason('');
    setCancelOtherText('');
  };

  const canSubmitCancel = selectedCancelReason && (
    selectedCancelReason !== '__other__' || cancelOtherText.trim().length > 0
  );

  const getStatusColor = (s) => ({
    completed: 'success', cancelled: 'error', passenger_onboard: 'primary',
    arrived: 'success', accepted: 'info', awaiting_payment: 'warning',
  }[s] || 'default');

  if (loading || !ride) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  const navDest = (rideStatus === 'accepted' || rideStatus === 'arrived')
    ? normalizeCoords(ride?.pickupLocation)
    : normalizeCoords(ride?.dropoffLocation);

  const fullscreenMarkers = [
    driverLocation && { id: 'driver', position: driverLocation, type: 'driver', icon: '🚗', animation: 'BOUNCE' },
    navDest && { id: 'navdest', position: navDest, type: (rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment') ? 'dropoff' : 'pickup', icon: '📍' },
  ].filter(Boolean);

  // ── Swipe button config per status ────────────────────────────────────────
  const isOnTrip = rideStatus === 'passenger_onboard' || rideStatus === 'awaiting_payment';

  return (
    <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── Map — position:absolute fills entire viewport ────────────────── */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <MapIframe
          center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
          zoom={15}
          height="100%"
          markers={markers}
          pickupLocation={routePickup}
          dropoffLocation={routeDropoff}
          showRoute={routeReady}
          onMapLoad={(c) => {
            mapControlsRef.current = c;
            c.configureDriverMarker?.({ bg: '#1d4ed8', label: '🚗', size: 42 });
          }}
        />
      </Box>

      {/* ── AppBar — floats over map ──────────────────────────────────────── */}
      <AppBar
        position="absolute"
        elevation={0}
        sx={{
          zIndex: 10, top: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 80%, transparent 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: 'none',
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, letterSpacing: 0.3 }}>Active Ride</Typography>
          <Chip
            label={ride.rideStatus?.replace(/_/g, ' ')}
            color={getStatusColor(ride.rideStatus)}
            sx={{ color: 'white', mr: 1, fontWeight: 700, textTransform: 'capitalize', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          />
        </Toolbar>
      </AppBar>

      {/* ════════════════════════════════════════════════════════════════════
          TOP ACTION + ETA SECTION — just below AppBar
          ════════════════════════════════════════════════════════════════════ */}
      <Box sx={{ position: 'absolute', top: 68, left: 12, right: 12, zIndex: 9, display: 'flex', flexDirection: 'column', gap: 1.25 }}>

        {/* ETA Card — visible by default when riding */}
        <AnimatePresence>
          {(rideStatus === 'accepted' || isOnTrip) && (
            <motion.div
              key={`eta-${rideStatus}`}
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <Box sx={{
                px: 2.5, py: 1.6, borderRadius: 20,
                background: rideStatus === 'accepted'
                  ? 'linear-gradient(135deg, rgba(5,150,105,0.92) 0%, rgba(6,95,70,0.96) 100%)'
                  : 'linear-gradient(135deg, rgba(180,83,9,0.92) 0%, rgba(120,53,15,0.96) 100%)',
                backdropFilter: 'blur(28px)',
                border: '1px solid',
                borderColor: rideStatus === 'accepted' ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)',
                boxShadow: rideStatus === 'accepted'
                  ? '0 12px 48px rgba(5,150,105,0.45), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : '0 12px 48px rgba(180,83,9,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, mb: 0.15 }}>
                    {rideStatus === 'accepted' ? 'ETA to Pickup' : 'ETA to Destination'}
                  </Typography>
                  <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.55rem', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    {formatETA(eta)}
                  </Typography>
                </Box>
                {distance != null && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, mb: 0.15 }}>
                      Distance
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>
                      {typeof distance === 'number' ? distance.toFixed(1) : distance} km
                    </Typography>
                  </Box>
                )}
              </Box>
              {/* Thin progress bar below ETA card */}
              <LinearProgress
                variant="indeterminate"
                sx={{
                  borderRadius: '0 0 8px 8px', height: 3, mx: 2,
                  bgcolor: rideStatus === 'accepted' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)',
                  '& .MuiLinearProgress-bar': {
                    background: rideStatus === 'accepted'
                      ? 'linear-gradient(90deg,#34d399,#10b981)'
                      : 'linear-gradient(90deg,#fbbf24,#f59e0b)',
                  },
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Status-specific action button / swipe button ─────────────── */}
        <AnimatePresence mode="wait">

          {/* ACCEPTED → Arrive at Pickup (green button) */}
          {rideStatus === 'accepted' && (
            <motion.div
              key="btn-arrive"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <Button
                fullWidth variant="contained" size="large"
                onClick={handleConfirmArrival}
                sx={{
                  height: 70, fontWeight: 800, borderRadius: 35, fontSize: '0.95rem', letterSpacing: 0.5,
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 45%, #15803d 100%)',
                  boxShadow: '0 10px 48px rgba(22,163,74,0.65), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.15)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #15803d 0%, #16a34a 45%, #166534 100%)',
                    boxShadow: '0 14px 56px rgba(22,163,74,0.75)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.22s ease',
                }}
              >
                <CheckIcon sx={{ mr: 1.5, fontSize: 22 }} />
                I've Arrived at Pickup
              </Button>
            </motion.div>
          )}

          {/* ARRIVED → Swipe right to Start Ride (orange) */}
          {rideStatus === 'arrived' && (
            <motion.div
              key="swipe-start"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <SwipeButton
                direction="right"
                label="Swipe to Start Ride"
                trackGradient="linear-gradient(135deg, #c2410c 0%, #ea580c 40%, #f97316 75%, #fb923c 100%)"
                thumbGradient="linear-gradient(145deg, #9a3412 0%, #c2410c 50%, #ea580c 100%)"
                onSuccess={handleStartTrip}
                resetKey={rideStatus}
              />
            </motion.div>
          )}

          {/* PASSENGER_ONBOARD / AWAITING_PAYMENT → Swipe left to Complete (red) */}
          {isOnTrip && (
            <motion.div
              key="swipe-complete"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {/* Swipe to complete */}
                <SwipeButton
                  direction="left"
                  label="Swipe to Complete Ride"
                  trackGradient="linear-gradient(135deg, #7f1d1d 0%, #b91c1c 35%, #dc2626 70%, #ef4444 100%)"
                  thumbGradient="linear-gradient(145deg, #450a0a 0%, #7f1d1d 50%, #b91c1c 100%)"
                  disabled={completeTripLocked}
                  onSuccess={handleConfirmComplete}
                  resetKey={rideStatus}
                />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* ════════════════════════════════════════════════════════════════════
          FABs — Directions + Call Rider
          ════════════════════════════════════════════════════════════════════ */}
      <Box sx={{ position: 'absolute', bottom: 100, right: 16, zIndex: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>

          {/* Nav FAB + popup */}
          <Box sx={{ position: 'relative' }}>
            <AnimatePresence>
              {showNavPopup && (
                <motion.div
                  key="nav-popup"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                  style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 10 }}
                >
                  <Paper
                    elevation={10}
                    sx={{
                      borderRadius: 3, overflow: 'hidden', minWidth: 192,
                      border: '1px solid', borderColor: 'divider',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                    }}
                  >
                    <Button
                      fullWidth startIcon={<MapIcon />}
                      onClick={() => { setShowNavPopup(false); setShowFullScreenMap(true); }}
                      sx={{ justifyContent: 'flex-start', px: 2.5, py: 1.5, fontWeight: 700, textTransform: 'none', borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      In App
                    </Button>
                    <Button
                      fullWidth startIcon={<OpenInNewIcon />}
                      onClick={() => { setShowNavPopup(false); handleOpenInGoogleMaps(); }}
                      sx={{ justifyContent: 'flex-start', px: 2.5, py: 1.5, fontWeight: 700, textTransform: 'none', borderRadius: 0 }}
                    >
                      Use Google Maps
                    </Button>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            <Fab
              variant="extended"
              color="primary"
              sx={{
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(29,78,216,0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)', transform: 'translateY(-1px)', boxShadow: '0 12px 40px rgba(29,78,216,0.65)' },
                transition: 'all 0.2s ease',
              }}
              onClick={handleNavigate}
            >
              <NavigationIcon sx={{ mr: 1 }} />
              Directions
            </Fab>
          </Box>

          {/* Call Rider FAB */}
          <Fab
            variant="extended"
            onClick={callRider}
            sx={{
              borderRadius: '24px', color: 'white',
              background: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%)',
              boxShadow: '0 8px 32px rgba(22,163,74,0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
              '&:hover': { background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', transform: 'translateY(-1px)', boxShadow: '0 12px 40px rgba(22,163,74,0.65)' },
              transition: 'all 0.2s ease',
            }}
          >
            <PhoneIcon sx={{ mr: 1 }} />
            Call Rider
          </Fab>
        </Box>
      </Box>

      {/* Click-away for nav popup */}
      {showNavPopup && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 5 }} onClick={() => setShowNavPopup(false)} />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          Single CustomBottomSheet — swipes all the way to the top
          ════════════════════════════════════════════════════════════════════ */}
      <CustomBottomSheet>
        <Box sx={{
          px: 2.5, pb: 3,
          '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
        }}>

          {/* Rider Info */}
          <Paper
            elevation={0}
            sx={{
              p: 3, borderRadius: 4, mb: 2,
              background: (t) => t.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
              border: '1px solid',
              borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>Rider Information</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56, height: 56,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                  fontSize: '1.2rem', fontWeight: 700,
                }}
              >
                {ride.rider?.firstName?.[0]}{ride.rider?.lastName?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>{ride.rider?.firstName} {ride.rider?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(() => {
                    const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber;
                    const d = (raw || '').replace(/\D/g, '');
                    return d.length > 10 ? d.slice(-10) : d;
                  })()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ride.rider?.riderProfile?.averageRating?.toFixed(1) || '5.0'} • {ride.rider?.riderProfile?.completedRides || 0} rides
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <IconButton
                  onClick={callRider}
                  sx={{
                    background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                    color: '#fff', width: 42, height: 42,
                    boxShadow: '0 4px 16px rgba(22,163,74,0.4)',
                    '&:hover': { transform: 'scale(1.1)', boxShadow: '0 6px 20px rgba(22,163,74,0.55)' },
                    transition: 'all 0.18s ease',
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 19 }} />
                </IconButton>
                <IconButton
                  onClick={() => {
                    const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride?.rider?.username) ? ride?.rider?.username : ride?.rider?.phoneNumber;
                    window.open(`https://wa.me/${(raw || '').replace(/\D/g, '')}`, '_blank');
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#fff', width: 42, height: 42,
                    boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
                    '&:hover': { transform: 'scale(1.1)', boxShadow: '0 6px 20px rgba(16,185,129,0.55)' },
                    transition: 'all 0.18s ease',
                  }}
                >
                  <MessageIcon sx={{ fontSize: 19 }} />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {/* Trip Details */}
          <Paper
            elevation={0}
            sx={{
              p: 3, borderRadius: 4, mb: 2,
              background: (t) => t.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
              border: '1px solid',
              borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>Trip Details</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{
                width: 38, height: 38, borderRadius: 2.5, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(22,163,74,0.15) 0%, rgba(16,185,129,0.08) 100%)',
                border: '1px solid rgba(22,163,74,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MyLocationIcon sx={{ color: '#16a34a', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.62rem' }}>Pickup</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.2 }}>{ride.pickupLocation?.address}</Typography>
              </Box>
            </Box>
            <Box sx={{ width: 2, height: 18, bgcolor: 'divider', ml: 2.35, mb: 1.5 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{
                width: 38, height: 38, borderRadius: 2.5, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.08) 100%)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LocationIcon sx={{ color: '#ef4444', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.62rem' }}>Dropoff</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.2 }}>{ride.dropoffLocation?.address}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Fare */}
          <Paper
            elevation={0}
            sx={{
              p: 3, borderRadius: 4, mb: 2,
              background: (t) => t.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
              border: '1px solid',
              borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>
              <ReceiptIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />Fare
            </Typography>
            <List disablePadding>
              {ride.baseFare != null && <ListItem sx={{ px: 0, py: 0.6 }}><ListItemText primary="Base Fare" primaryTypographyProps={{ fontSize: '0.9rem' }} /><Typography fontSize="0.9rem">{formatCurrency(ride.baseFare)}</Typography></ListItem>}
              {ride.distanceFare != null && <ListItem sx={{ px: 0, py: 0.6 }}><ListItemText primary="Distance Fare" primaryTypographyProps={{ fontSize: '0.9rem' }} /><Typography fontSize="0.9rem">{formatCurrency(ride.distanceFare)}</Typography></ListItem>}
              {ride.surgeFare > 0 && <ListItem sx={{ px: 0, py: 0.6 }}><ListItemText primary="Surge" primaryTypographyProps={{ fontSize: '0.9rem' }} /><Typography color="warning.main" fontSize="0.9rem">+{formatCurrency(ride.surgeFare)}</Typography></ListItem>}
              {ride.promoDiscount > 0 && <ListItem sx={{ px: 0, py: 0.6 }}><ListItemText primary="Promo" primaryTypographyProps={{ fontSize: '0.9rem' }} /><Typography color="success.main" fontSize="0.9rem">-{formatCurrency(ride.promoDiscount)}</Typography></ListItem>}
              <Divider sx={{ my: 1 }} />
              <ListItem sx={{ px: 0, py: 0.6 }}>
                <ListItemText primary="Total" primaryTypographyProps={{ fontWeight: 700 }} />
                <Typography fontWeight={700}>{formatCurrency(ride.totalFare)}</Typography>
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.6 }}>
                <ListItemText primary="Your Earnings" primaryTypographyProps={{ fontWeight: 700, fontSize: '1.05rem' }} />
                <Typography fontWeight={800} fontSize="1.05rem" sx={{ color: '#16a34a' }}>
                  {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
                </Typography>
              </ListItem>
            </List>
            <Chip
              label={`Payment: ${ride.paymentMethod === 'cash' ? '💵 Cash' : '💳 OkraPay'}`}
              sx={{ mt: 2, fontWeight: 700, borderRadius: 2 }}
            />
          </Paper>

          {/* Trip Stats */}
          <Paper
            elevation={0}
            sx={{
              p: 3, borderRadius: 4, mb: 2,
              background: (t) => t.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
              border: '1px solid',
              borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>Trip Statistics</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box sx={{
                textAlign: 'center', p: 2, borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(29,78,216,0.08) 0%, rgba(37,99,235,0.04) 100%)',
                border: '1px solid rgba(29,78,216,0.12)',
              }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563eb' }}>
                  {(ride.actualDistance ?? ride.estimatedDistance ?? 0).toFixed(1)} km
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Distance</Typography>
              </Box>
              <Box sx={{
                textAlign: 'center', p: 2, borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(2,132,199,0.04) 100%)',
                border: '1px solid rgba(14,165,233,0.12)',
              }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0ea5e9' }}>
                  {formatETA(ride.actualDuration ?? ride.estimatedDuration)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Duration</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Request Payment (OkraPay) — in drawer when on trip */}
          {isOnTrip && okrapayAllowedForRides && (
            <Paper
              elevation={0}
              sx={{
                p: 3, borderRadius: 4, mb: 2,
                background: (t) => t.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
                border: '1px solid',
                borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>
                <PaymentIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />Payment
              </Typography>

              <Button
                fullWidth variant="contained" size="large"
                onClick={handleRequestPayment}
                disabled={paymentRequested && completeLockSecondsLeft > 0}
                startIcon={<PaymentIcon />}
                sx={{
                  height: 58, fontWeight: 700, borderRadius: 29, fontSize: '0.9rem',
                  background: (paymentRequested && completeLockSecondsLeft > 0)
                    ? 'rgba(60,60,60,0.75)'
                    : 'linear-gradient(135deg, #b45309 0%, #d97706 45%, #f59e0b 100%)',
                  boxShadow: (paymentRequested && completeLockSecondsLeft > 0)
                    ? 'none'
                    : '0 8px 36px rgba(180,83,9,0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  '&.Mui-disabled': { background: 'rgba(60,60,60,0.6)', color: 'rgba(255,255,255,0.45)' },
                  '&:hover:not(:disabled)': { transform: 'translateY(-1px)', boxShadow: '0 12px 44px rgba(180,83,9,0.65)' },
                  transition: 'all 0.2s ease',
                }}
              >
                {(paymentRequested && completeLockSecondsLeft > 0)
                  ? `Payment Requested ✓  (${completeLockSecondsLeft}s)`
                  : 'Request Payment'}
              </Button>

              {/* Lock countdown */}
              {completeTripLocked && (
                <Box sx={{
                  mt: 1.5, px: 2, py: 1.25, borderRadius: 3,
                  background: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(255,140,0,0.25)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <TimerIcon sx={{ fontSize: 15, color: '#fbbf24' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Complete available in {completeLockSecondsLeft}s — giving rider time to pay
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((COMPLETE_TRIP_LOCK_MS / 1000 - completeLockSecondsLeft) / (COMPLETE_TRIP_LOCK_MS / 1000)) * 100}
                    sx={{
                      borderRadius: 2, height: 5,
                      bgcolor: 'rgba(251,191,36,0.15)',
                      '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#fbbf24,#f59e0b)' },
                    }}
                  />
                </Box>
              )}

              {/* Awaiting payment alert */}
              {rideStatus === 'awaiting_payment' && (
                <Alert
                  severity="info" icon={<PaymentIcon />}
                  sx={{
                    mt: 1.5, borderRadius: 3,
                    '& .MuiAlert-icon': { color: '#38bdf8' },
                  }}
                >
                  Waiting for rider to complete payment…
                </Alert>
              )}
            </Paper>
          )}

          {/* Cancel Ride */}
          {['pending', 'accepted', 'arrived'].includes(ride.rideStatus) && (
            <Button
              fullWidth variant="outlined" color="error"
              sx={{
                height: 52, borderRadius: 26, fontWeight: 700, borderWidth: 2, mt: 1,
                borderColor: 'rgba(239,68,68,0.6)',
                color: '#ef4444',
                background: 'rgba(239,68,68,0.05)',
                '&:hover': {
                  borderWidth: 2, borderColor: '#ef4444',
                  background: 'rgba(239,68,68,0.1)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
              onClick={handleCancelPress}
            >
              <CancelIcon sx={{ mr: 1, fontSize: 19 }} />
              Cancel Ride
            </Button>
          )}
        </Box>
      </CustomBottomSheet>

      {/* ── Full-screen in-app navigation modal ─────────────────────────── */}
      <Dialog
        fullScreen
        open={showFullScreenMap}
        onClose={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}
      >
        <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000' }}>
          <MapIframe
            center={driverLocation || normalizeCoords(ride?.pickupLocation) || { lat: -15.4167, lng: 28.2833 }}
            zoom={20}
            height="100%"
            markers={fullscreenMarkers}
            pickupLocation={driverLocation}
            dropoffLocation={navDest}
            showRoute={!!(driverLocation && navDest)}
            onMapLoad={(c) => {
              fullScreenMapControlsRef.current = c;
              c.configureDriverMarker?.({ bg: '#1d4ed8', label: '🚗', size: 42 });
              if (driverLocation && !fullScreenMapInitializedRef.current) {
                setTimeout(() => {
                  fullScreenMapControlsRef.current?.animateToLocation(driverLocation, 20);
                  fullScreenMapInitializedRef.current = true;
                }, 700);
              }
            }}
          />
          <Box sx={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <Button
              variant="contained" size="large" startIcon={<CloseIcon />}
              onClick={() => { setShowFullScreenMap(false); fullScreenMapInitializedRef.current = false; }}
              sx={{
                height: 52, px: 5, borderRadius: 3.5, fontWeight: 700,
                bgcolor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(16px)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.94)' },
              }}
            >
              Close Map
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* ── Complete Trip dialog ─────────────────────────────────────────── */}
      <Dialog
        open={showCompleteDialog}
        onClose={() => !completing && setShowCompleteDialog(false)}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 360, mx: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg,#10B981 0%,#059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
            }}>
              <CheckIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            Complete Trip?
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            Please confirm that the rider has been dropped off at the destination and the trip is finished.
          </Typography>
          {ride?.totalFare != null && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, display: 'block' }}>Your Earnings</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>
                {formatCurrency(ride.driverEarnings || (ride.totalFare - (ride.commission || 0)))}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setShowCompleteDialog(false)} disabled={completing} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, height: 44 }}>Not Yet</Button>
          <Button onClick={handleConfirmComplete} disabled={completing} variant="contained" color="success"
            startIcon={completing ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 44 }}>
            {completing ? 'Completing…' : 'Complete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel step 1: confirmation ──────────────────────────────────── */}
      <Dialog
        open={showCancelConfirm}
        onClose={handleCancelConfirmNo}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 360, mx: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
            }}>
              <WarningIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            Cancel Ride?
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            Are you sure you want to cancel this ride? This action cannot be undone and may affect your acceptance rate.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={handleCancelConfirmNo} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, height: 44 }}>No</Button>
          <Button onClick={handleCancelConfirmYes} variant="contained" color="error" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 44 }}>Yes</Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel step 2: reason selection ─────────────────────────────── */}
      <Dialog
        open={showCancelReasons}
        onClose={handleCloseCancelReasons}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 400, mx: 2, width: '100%', border: '1px solid', borderColor: 'divider', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
            }}>
              <CancelIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            Reason for Cancellation
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
            Please let us know why you're cancelling so we can improve your experience.
          </Typography>
          {cancelReasonsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
          ) : (
            <FormControl fullWidth size="medium">
              <InputLabel id="cancel-reason-label">Select a reason</InputLabel>
              <Select
                labelId="cancel-reason-label"
                value={selectedCancelReason}
                label="Select a reason"
                onChange={(e) => {
                  setSelectedCancelReason(e.target.value);
                  if (e.target.value !== '__other__') setCancelOtherText('');
                }}
                sx={{ borderRadius: 2 }}
              >
                {cancelReasons.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>{r.reason}</MenuItem>
                ))}
                <MenuItem value="__other__">Other</MenuItem>
              </Select>
            </FormControl>
          )}
          <AnimatePresence>
            {selectedCancelReason === '__other__' && (
              <motion.div
                key="other-input"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                style={{ overflow: 'hidden' }}
              >
                <TextField
                  fullWidth multiline minRows={2} maxRows={4}
                  placeholder="Explain more…"
                  value={cancelOtherText}
                  onChange={(e) => setCancelOtherText(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 1.5, gap: 1, flexDirection: 'column' }}>
          <Button
            fullWidth variant="contained" color="error" size="large"
            disabled={!canSubmitCancel || cancelling}
            startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
            onClick={handleCancelWithReason}
            sx={{ height: 50, borderRadius: 2.5, fontWeight: 700 }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Ride'}
          </Button>
          <Divider sx={{ width: '100%', my: 0.5 }}>
            <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>or</Typography>
          </Divider>
          <Button
            fullWidth variant="text" size="medium"
            disabled={cancelling}
            onClick={handleCancelWithoutReason}
            sx={{ height: 44, borderRadius: 2.5, fontWeight: 600, color: 'text.secondary', textTransform: 'none', fontSize: '0.875rem', '&:hover': { bgcolor: 'action.hover' } }}
          >
            Cancel without reason
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}