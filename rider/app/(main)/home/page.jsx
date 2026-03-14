// PATH: rider/app/(main)/home/page.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Typography,
  Button,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Backdrop,
  Alert,
  Snackbar,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  MyLocation as MyLocationIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  // ── NEW: theme toggle icons ──
  LightMode as LightIcon,
  DarkMode  as DarkIcon,
} from '@mui/icons-material';
import { alpha, useTheme }     from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useRide } from '@/lib/hooks/useRide';
import { MapControls } from '@/components/Map/MapControls';
import { LocationSearch } from '@/components/Map/LocationSearch';
import { RideOptionsSheet } from '@/components/Rider/RideOptionsSheet';
import SwipeableBottomSheet, { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';
import ClientOnly from '@/components/ClientOnly';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import MapIframe from '@/components/Map/MapIframe';
import { apiClient } from '@/lib/api/client';
// ── NEW ──
import { useThemeMode } from '@/components/ThemeProvider';

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar shared constants
// ─────────────────────────────────────────────────────────────────────────────
const GREEN     = '#ffc107';
const GREEN_DIM = '#ffc107af';

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar SVG icons
// ─────────────────────────────────────────────────────────────────────────────
function AppsIcon({ size = 20, color = GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3"  y="3"  width="7" height="7" rx="2" fill={color} />
      <rect x="14" y="3"  width="7" height="7" rx="2" fill={color} opacity="0.7" />
      <rect x="3"  y="14" width="7" height="7" rx="2" fill={color} opacity="0.7" />
      <rect x="14" y="14" width="7" height="7" rx="2" fill={color} opacity="0.5" />
    </svg>
  );
}

function HelpSvgIcon({ size = 20, color = GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 10.88 12 12 12 13.5"
            stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.9" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedHeaderButton — identical to driver page
// direction 'left'  → «LABEL slides in from right, exits left,  icon enters from right
// direction 'right' →  LABEL» slides in from left,  exits right, icon enters from left
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedHeaderButton({ label, icon, direction, onClick }) {
  const [phase, setPhase] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const t = setTimeout(() => { if (mounted.current) setPhase(1); }, 1800);
    return () => { mounted.current = false; clearTimeout(t); };
  }, []);

  const textVariants = {
    enter:  { x: direction === 'left' ? 18 : -18, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 28 } },
    exit:   { x: direction === 'left' ? -22 : 22, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
  };

  const iconVariants = {
    enter:  { x: direction === 'left' ? 18 : -18, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 26 } },
    exit:   { x: 0, opacity: 0, transition: { duration: 0.15 } },
  };

  return (
    <Box onClick={onClick} sx={{
      cursor: 'pointer', minWidth: 48, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', borderRadius: 2, px: 0.5,
      '&:hover': { '& .btn-glow': { opacity: 1 } },
    }}>
      <Box className="btn-glow" sx={{
        position: 'absolute', inset: 0, borderRadius: 2,
        background: `radial-gradient(circle, ${alpha(GREEN, 0.18)} 0%, transparent 70%)`,
        opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none',
      }} />

      <AnimatePresence mode="wait" initial>
        {phase === 0 ? (
          <motion.div key="label" variants={textVariants} initial="enter" animate="center" exit="exit"
            style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
            {direction === 'left' && (
              <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1, color: GREEN, mr: 0.25, letterSpacing: -1, fontFamily: 'monospace' }}>«</Typography>
            )}
            <Typography sx={{
              fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
              background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DIM} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {label}
            </Typography>
            {direction === 'right' && (
              <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1, color: GREEN, ml: 0.25, letterSpacing: -1, fontFamily: 'monospace' }}>»</Typography>
            )}
          </motion.div>
        ) : (
          <motion.div key="icon" variants={iconVariants} initial="enter" animate="center" exit="exit"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 6px ${alpha(GREEN, 0.55)})` }}>
            {icon}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle — identical to driver page
// Dark:  ( DARK 🌙 )   Light: ( ☀️ LIGHT )
// ─────────────────────────────────────────────────────────────────────────────
const PILL_W  = 74;
const PILL_H  = 30;
const THUMB_D = 22;
const THUMB_PAD = 3;
const THUMB_TRAVEL = PILL_W - THUMB_D - THUMB_PAD * 3; // how far thumb moves

function ThemeToggle({ isDark, onToggle }) {
  return (
    <Box onClick={onToggle} sx={{
      position: 'relative', width: PILL_W, height: PILL_H,
      borderRadius: PILL_H / 2, cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
      border: `1.5px solid ${isDark ? alpha(GREEN, 0.35) : alpha('#CBD5E1', 0.9)}`,
      background: isDark
        ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #F1F5F9 100%)',
      boxShadow: isDark
        ? `0 0 12px ${alpha(GREEN, 0.22)}, inset 0 1px 0 ${alpha('#fff', 0.04)}`
        : `0 1px 6px ${alpha('#94A3B8', 0.3)}, inset 0 1px 0 rgba(255,255,255,0.9)`,
      transition: 'background 0.35s, border-color 0.35s, box-shadow 0.35s',
      '&:hover': {
        boxShadow: isDark ? `0 0 20px ${alpha(GREEN, 0.38)}` : `0 2px 10px ${alpha('#94A3B8', 0.45)}`,
        border: isDark ? `1.5px solid ${alpha(GREEN, 0.6)}` : `1.5px solid ${alpha('#94A3B8', 0.7)}`,
      },
    }}>
      {/* Static label — opposite side to thumb */}
      <Box sx={{
        position: 'absolute', top: 0, bottom: 0,
        ...(isDark
          ? { left: THUMB_PAD + 3, right: THUMB_D + THUMB_PAD * 2 }
          : { left: THUMB_D + THUMB_PAD * 2, right: THUMB_PAD + 3 }
        ),
        display: 'flex', alignItems: 'center',
        justifyContent: isDark ? 'flex-start' : 'flex-end',
        pointerEvents: 'none', overflow: 'hidden',
      }}>
        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: 0.9, textTransform: 'uppercase', lineHeight: 1,
          color: isDark ? alpha(GREEN, 0.85) : alpha('#64748B', 0.9),
          transition: 'color 0.3s',
        }}>
          {isDark ? 'DARK' : 'LIGHT'}
        </Typography>
      </Box>

      {/* Sliding thumb */}
      <motion.div
        animate={{ x: isDark ? THUMB_TRAVEL : 0 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34 }}
        style={{
          position: 'absolute', top: THUMB_PAD, left: THUMB_PAD,
          width: THUMB_D, height: THUMB_D, borderRadius: '50%', zIndex: 1,
          background: isDark
            ? `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DIM} 100%)`
            : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          boxShadow: isDark ? `0 2px 8px ${alpha(GREEN, 0.55)}` : `0 2px 8px ${alpha('#F59E0B', 0.55)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <motion.div animate={{ rotate: isDark ? 0 : 20 }} transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isDark
            ? <DarkIcon  sx={{ fontSize: 13, color: '#fff' }} />
            : <LightIcon sx={{ fontSize: 13, color: '#fff' }} />
          }
        </motion.div>
      </motion.div>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// (All existing constants below — unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const HEADER_GRADIENT_SX = {
  background: 'linear-gradient(-60deg, #FFB300 0%, #FF8A00 25%, #FFC107 50%, #FF6D00 75%, #FFD54F 100%)',
  backgroundSize: '300% 300%',
  animation: 'okraHeaderWave 6s ease infinite',
  '@keyframes okraHeaderWave': {
    '0%':   { backgroundPosition: '0% 50%' },
    '50%':  { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
};

const CLEAN_INPUT_SX = {
  '& .MuiInputBase-root': {
    border: 'none !important',
    outline: 'none !important',
    boxShadow: 'none !important',
    bgcolor: 'transparent !important',
    p: '0 !important',
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none !important' },
  '& .MuiFilledInput-underline:before': { display: 'none' },
  '& .MuiFilledInput-underline:after':  { display: 'none' },
  '& .MuiInput-underline:before':       { display: 'none' },
  '& .MuiInput-underline:after':        { display: 'none' },
  '& .MuiInputAdornment-root':          { display: 'none' },
  '& .MuiIconButton-root':              { display: 'none' },
  '& .MuiInputBase-input': {
    p: '0 !important',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
};

const ModalLoadingSkeleton = () => (
  <Box>
    <Box sx={{ ...HEADER_GRADIENT_SX, borderTopLeftRadius: 24, borderTopRightRadius: 24, px: 3, pb: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.75 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.4)' }} />
      </Box>
      <Skeleton animation="wave" variant="text" width={110} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.25)', borderRadius: 1, mb: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton animation="wave" width={80}  height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
        <Skeleton animation="wave" width={130} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton animation="wave" variant="rounded" height={38} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
        <Skeleton animation="wave" variant="rounded" height={38} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
      </Box>
    </Box>
    <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
      <Skeleton animation="wave" width={44}  height={11} sx={{ borderRadius: 1, mb: 0.5 }} />
      <Skeleton animation="wave" variant="rounded" height={62} sx={{ borderRadius: 2, mb: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
        <Skeleton animation="wave" width={2} height={22} />
      </Box>
      <Skeleton animation="wave" width={60}  height={11} sx={{ borderRadius: 1, mb: 0.5 }} />
      <Skeleton animation="wave" variant="rounded" height={62} sx={{ borderRadius: 2 }} />
    </Box>
    <Box sx={{ px: 3, pt: 2 }}>
      <Skeleton animation="wave" width={120} height={14} sx={{ borderRadius: 1, mb: 1.5 }} />
      {[1, 2, 3].map((i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Skeleton animation="wave" variant="circular" width={36} height={36} sx={{ mr: 1.5, flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton animation="wave" width="55%" height={14} sx={{ borderRadius: 1, mb: 0.4 }} />
            <Skeleton animation="wave" width="75%" height={12} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

const FareEstimatesSkeleton = ({ onClose, routeInfo }) => (
  <Box>
    <Box sx={{ ...HEADER_GRADIENT_SX, borderTopLeftRadius: 24, borderTopRightRadius: 24, px: 3, pb: 2.5, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.75 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.4)' }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Skeleton animation="wave" width={130} height={26} sx={{ bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 1, mb: 0.5 }} />
          {routeInfo ? (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              📍 {routeInfo.distance}&nbsp;·&nbsp;⏱ {routeInfo.duration}
            </Typography>
          ) : (
            <Skeleton animation="wave" width={100} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
    <Box sx={{ px: 3, pt: 2.5 }}>
      <Skeleton animation="wave" width={110} height={18} sx={{ borderRadius: 1, mb: 2 }} />
      {[{ w1: '60%', w2: '35%' }, { w1: '50%', w2: '30%' }, { w1: '45%', w2: '25%' }].map(({ w1, w2 }, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 1.5, border: '1.5px solid', borderColor: i === 0 ? 'primary.light' : 'divider', borderRadius: 2.5, bgcolor: i === 0 ? 'rgba(255,193,7,0.06)' : 'transparent', gap: 2 }}>
          <Skeleton animation="wave" variant="circular" width={52} height={52} sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton animation="wave" width={w1} height={18} sx={{ borderRadius: 1, mb: 0.5 }} />
            <Skeleton animation="wave" width={w2} height={14} sx={{ borderRadius: 1 }} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Skeleton animation="wave" width={64} height={22} sx={{ borderRadius: 1, mb: 0.3 }} />
            <Skeleton animation="wave" width={44} height={13} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      ))}
    </Box>
    <Box sx={{ px: 3, pb: 3, pt: 1 }}>
      <Skeleton animation="wave" variant="rounded" height={50} sx={{ borderRadius: 2, mb: 2 }} />
      <Skeleton animation="wave" variant="rounded" height={56} sx={{ borderRadius: 3, bgcolor: 'rgba(255,193,7,0.25)' }} />
    </Box>
  </Box>
);

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { location, loading: locationLoading, refresh: refreshWebLocation } = useGeolocation({ watch: true });
  const { isNative, getCurrentLocation: getNativeLocation } = useReactNative();
  const {
    loading: rideLoading,
    error: rideError,
    getFareEstimate,
    validatePromoCode,
    requestRide,
    getTaxiTypes,
    getRideClasses,
  } = useRide();

  // ── NEW: theme + landing url ──────────────────────────────────────────────
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { toggleTheme } = useThemeMode();
  const [landingPageUrl, setLandingPageUrl] = useState(null);

  useEffect(() => {
    const getFrontendUrl = async () => {
      const res = await apiClient.get('/frontend-url').catch(() => null);
      const url = res?.data?.paths?.['okra-frontend-app'];
      if (url) setLandingPageUrl(url);
    };
    getFrontendUrl();
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const [mapCenter, setMapCenter]           = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [showLocationSheet, setShowLocationSheet] = useState(true);
  const [showRideOptions, setShowRideOptions]     = useState(false);
  const [recentLocations, setRecentLocations]     = useState([]);
  const [mapControls, setMapControls]             = useState(null);
  const [isRelocating, setIsRelocating]           = useState(false);
  const [routeInfo, setRouteInfo]                 = useState(null);

  const [focusedInput, setFocusedInput]       = useState(null);
  const [sheetExpanded, setSheetExpanded]     = useState(false);
  const [pickupChipVisible, setPickupChipVisible] = useState(false);

  const [showModalSkeleton, setShowModalSkeleton] = useState(true);
  const skeletonTimerRef = useRef(null);

  const [fareEstimates, setFareEstimates]       = useState(null);
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [selectedRideClass, setSelectedRideClass] = useState(null);
  const [promoCode, setPromoCode]               = useState('');
  const [promoDiscount, setPromoDiscount]       = useState(null);
  const [validatingPromo, setValidatingPromo]   = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const fastIntervalRef     = useRef(null);
  const slowIntervalRef     = useRef(null);
  const locationObtainedRef = useRef(false);
  const mapControlsRef      = useRef(null);

  useEffect(() => { mapControlsRef.current = mapControls; }, [mapControls]);

  useEffect(() => {
    skeletonTimerRef.current = setTimeout(() => setShowModalSkeleton(false), 5000);
    return () => { if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current); };
  }, []);

  useEffect(() => {
    setPickupChipVisible(
      pickupLocation?.isCurrentLocation === true && focusedInput !== 'pickup'
    );
  }, [pickupLocation, focusedInput]);

  const fetchAndApplyNativeLocation = useCallback(async () => {
    try {
      const nativeLoc = await getNativeLocation();
      if (!nativeLoc?.lat) return null;

      const coords = { lat: nativeLoc.lat, lng: nativeLoc.lng };
      setMapCenter(coords);
      if (mapControlsRef.current) mapControlsRef.current.animateToLocation(coords, 16);

      await new Promise((r) => setTimeout(r, 3000));

      if (user?.id) {
        const res = await apiClient.get(`/users/${user.id}`)
        if (res.currentLocation) {
          const userData = res
          const cl = userData?.currentLocation;
          if (cl?.latitude && cl?.longitude) {
            locationObtainedRef.current = true;
            const loc = {
              lat:               cl.latitude,
              lng:               cl.longitude,
              address:           cl.address   || `${cl.latitude}, ${cl.longitude}`,
              name:              cl.name      || cl.address?.split(',')[0] || 'Current Location',
              placeId:           cl.placeId   || `geo_${cl.latitude}_${cl.longitude}`,
              isCurrentLocation: true,
            };
            setPickupLocation((prev) => (prev && !prev.isCurrentLocation ? prev : loc));
            return loc;
          }
        }
      }

      locationObtainedRef.current = true;
      return coords;
    } catch {
      return null;
    }
  }, [user, getNativeLocation]);

  const applyLocationFix = useCallback((lat, lng) => {
    if (lat == null || lng == null) return;
    locationObtainedRef.current = true;
    setMapCenter({ lat, lng });
    setPickupLocation((prev) => {
      if (prev && !prev.isCurrentLocation) return prev;
      return {
        lat, lng,
        address:           `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        name:              `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        placeId:           `geo_${lat}_${lng}`,
        isCurrentLocation: true,
      };
    });
  }, []);

  useEffect(() => {
    if (mapControls && mapCenter) mapControls.animateToLocation(mapCenter, 16);
  }, [mapControls, mapCenter]);

  useEffect(() => {
    if (location && !locationObtainedRef.current) applyLocationFix(location.lat, location.lng);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    const FAST_MS = 1_000;
    const SLOW_MS = 4 * 60_000;

    if (isNative && !locationObtainedRef.current) {
      fastIntervalRef.current = setInterval(async () => {
        if (locationObtainedRef.current) { clearInterval(fastIntervalRef.current); fastIntervalRef.current = null; return; }
        const result = await fetchAndApplyNativeLocation();
        if (result) { clearInterval(fastIntervalRef.current); fastIntervalRef.current = null; }
      }, FAST_MS);
    }

    slowIntervalRef.current = setInterval(async () => {
      try {
        let refreshed = false;
        if (isNative && getNativeLocation) { await fetchAndApplyNativeLocation(); refreshed = true; }
        if (!refreshed) await refreshWebLocation();
      } catch { /* silent */ }
    }, SLOW_MS);

    return () => {
      if (fastIntervalRef.current) clearInterval(fastIntervalRef.current);
      if (slowIntervalRef.current) clearInterval(slowIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isNative) return;
    fetchAndApplyNativeLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const load = async () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('okra_rides_recent_locations');
        if (saved) { try { setRecentLocations(JSON.parse(saved)); } catch {} }
      }
      try {
        const types = await getTaxiTypes();
        if (types?.length > 0) await getRideClasses(types[0].id);
      } catch {}
    };
    load();
  }, [getTaxiTypes, getRideClasses]);

  useEffect(() => {
    if (pickupLocation && dropoffLocation && showLocationSheet) {
      loadFareEstimates();
      const t = setTimeout(() => {
        setShowLocationSheet(false);
        setShowRideOptions(true);
        setSheetExpanded(false);
        setFocusedInput(null);
      }, 250);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation, dropoffLocation]);

  const loadFareEstimates = async () => {
    if (!pickupLocation || !dropoffLocation) return;
    setLoadingEstimates(true);
    setFareEstimates(null);
    try {
      const estimates = await getFareEstimate(pickupLocation, dropoffLocation, 'taxi', ['taxi']);
      if (estimates) {
        setFareEstimates(estimates);
        if (estimates.estimates?.length > 0) setSelectedRideClass(estimates.estimates[0]);
      } else {
        setSnackbar({ open: true, message: 'Failed to load fare estimates', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Error calculating fare. Please try again.', severity: 'error' });
    } finally {
      setLoadingEstimates(false);
    }
  };

  const handleValidatePromoCode = async (code) => {
    if (!code || !selectedRideClass) return;
    setValidatingPromo(true);
    try {
      const result = await validatePromoCode(code, selectedRideClass.subtotal);
      if (result?.valid) {
        setPromoDiscount(result);
        setSnackbar({ open: true, message: result.message || 'Promo code applied!', severity: 'success' });
      } else {
        setPromoDiscount(null);
        setSnackbar({ open: true, message: 'Invalid or expired promo code', severity: 'error' });
      }
    } catch {
      setPromoDiscount(null);
      setSnackbar({ open: true, message: 'Error validating promo code', severity: 'error' });
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleConfirmRide = async (rideDetails) => {
    if (!pickupLocation || !dropoffLocation || !selectedRideClass) {
      setSnackbar({ open: true, message: 'Please select pickup and dropoff locations', severity: 'warning' });
      return;
    }
    try {
      const result = await requestRide({
        taxiType: 'taxi', rideType: 'taxi', rider: user,
        rideClass: selectedRideClass.rideClassId || selectedRideClass.id,
        rideClassId: selectedRideClass.rideClassId || selectedRideClass.id,
        pickupLocation, dropoffLocation,
        paymentMethod:    rideDetails.paymentMethod || 'cash',
        promoCode:        promoCode || null,
        estimatedFare:    rideDetails.totalFare || selectedRideClass.subtotal,
        totalFare:        rideDetails.totalFare || selectedRideClass.subtotal,
        passengerCount:   rideDetails.passengerCount || 1,
        specialRequests:  rideDetails.specialRequests || [],
        notes:            rideDetails.notes || '',
        estimatedDistance: parseFloat(routeInfo?.distance) || null,
        estimatedDuration: parseFloat(routeInfo?.duration) || null,
      });
      if (result.success) {
        setSnackbar({ open: true, message: 'Ride requested! Finding your driver…', severity: 'success' });
        setTimeout(() => router.push(`/finding-driver?rideId=${result.data.id}`), 500);
      } else {
        setSnackbar({ open: true, message: result.error || 'Failed to book ride.', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'An error occurred while booking.', severity: 'error' });
    }
  };

  const saveToRecent = useCallback((loc) => {
    if (loc.isCurrentLocation) return;
    const newRecent = [loc, ...recentLocations.filter((l) => l.placeId !== loc.placeId && l.address !== loc.address)].slice(0, 5);
    setRecentLocations(newRecent);
    if (typeof window !== 'undefined') localStorage.setItem('okra_rides_recent_locations', JSON.stringify(newRecent));
  }, [recentLocations]);

  const handlePickupSelect = useCallback((loc) => {
    setPickupLocation(loc); saveToRecent(loc);
    if (mapControls) mapControls.animateToLocation(loc, 15);
    setTimeout(() => setFocusedInput(null), 150);
    setFareEstimates(null); setSelectedRideClass(null); setPromoDiscount(null);
  }, [mapControls, saveToRecent]);

  const handleDropoffSelect = useCallback((loc) => {
    setDropoffLocation(loc); saveToRecent(loc);
    if (mapControls) mapControls.animateToLocation(loc, 15);
    setTimeout(() => setFocusedInput(null), 150);
    setFareEstimates(null); setSelectedRideClass(null); setPromoDiscount(null);
  }, [mapControls, saveToRecent]);

  const handleSelectRecentLocation = useCallback((loc) => {
    if (focusedInput === 'pickup') handlePickupSelect(loc);
    else handleDropoffSelect(loc);
  }, [focusedInput, handlePickupSelect, handleDropoffSelect]);

  const handleReset = () => {
    if (isNative) fetchAndApplyNativeLocation();
    else if (location) applyLocationFix(location.lat, location.lng);
    else setPickupLocation(null);
    setDropoffLocation(null); setFareEstimates(null); setSelectedRideClass(null);
    setPromoCode(''); setPromoDiscount(null); setShowRideOptions(false);
    setShowLocationSheet(true); setRouteInfo(null); setFocusedInput(null); setSheetExpanded(false);
  };

  const handleInputFocus = (input) => { setFocusedInput(input); if (!sheetExpanded) setSheetExpanded(true); };
  const handleInputBlur  = () => { setTimeout(() => setFocusedInput(null), 180); };
  const handleChangeLocation = () => { setPickupChipVisible(false); handleInputFocus('pickup'); };

  const handleIAmHere = () => {
    if (isNative) { fetchAndApplyNativeLocation(); setFocusedInput(null); return; }
    const lat = location?.lat ?? pickupLocation?.lat;
    const lng = location?.lng ?? pickupLocation?.lng;
    if (lat == null || lng == null) return;
    applyLocationFix(lat, lng);
    setFocusedInput(null);
    if (mapControls) mapControls.animateToLocation({ lat, lng }, 16);
  };

  const handleRelocate = async () => {
    setIsRelocating(true);
    try {
      if (isNative) {
        const result = await fetchAndApplyNativeLocation();
        if (!result) throw new Error('no_location');
        if (result.lat && mapControls) mapControls.animateToLocation({ lat: result.lat, lng: result.lng }, 16);
      } else {
        await refreshWebLocation();
        await new Promise((r) => setTimeout(r, 500));
        if (location && mapControls) {
          mapControls.animateToLocation({ lat: location.lat, lng: location.lng }, 16);
          applyLocationFix(location.lat, location.lng);
        } else throw new Error('no_location');
      }
      setSnackbar({ open: true, message: 'Location updated', severity: 'success' });
      setTimeout(() => setIsRelocating(false), 1500);
    } catch {
      setIsRelocating(false);
      setSnackbar({ open: true, message: 'Could not get your location. Check permissions.', severity: 'error' });
    }
  };

  const handleCloseRideOptions = () => {
    setShowRideOptions(false); setShowLocationSheet(true); setSheetExpanded(false);
    setFareEstimates(null); setDropoffLocation(null); setSelectedRideClass(null);
  };

  const locationDisplayText = (() => {
    if (!pickupLocation) return 'Detecting location…';
    if (pickupLocation.isCurrentLocation) {
      const label = pickupLocation.name || pickupLocation.address;
      if (label) return label.split(',')[0];
      if (location) return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      return 'Detecting location…';
    }
    return pickupLocation.name || pickupLocation.address?.split(',')[0] || 'Current Location';
  })();

  if (locationLoading && !location && !pickupLocation) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>Getting your location…</Typography>
      </Box>
    );
  }

  return (
    <ClientOnly>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', overflow: 'hidden', maxWidth: '100vw', boxSizing: 'border-box' }}>

        {/* ── Map ── */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <MapIframe
            center={mapCenter ?? (location ? { lat: location.lat, lng: location.lng } : { lat: -15.4167, lng: 28.2833 })}
            zoom={16}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            onMapLoad={setMapControls}
            onRouteCalculated={setRouteInfo}
          />
        </Box>

        {/* ── Relocating overlay ── */}
        <AnimatePresence>
          {isRelocating && (
            <Backdrop open sx={{ zIndex: 1400, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
              <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} style={{ textAlign: 'center' }}>
                <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, mx: 'auto', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { boxShadow: '0 0 0 0 rgba(255,193,7,0.7)' }, '70%': { boxShadow: '0 0 0 20px rgba(255,193,7,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(255,193,7,0)' } } }}>
                  <MyLocationIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <CircularProgress size={44} thickness={3} sx={{ mb: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>Finding your location…</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>This may take a few seconds</Typography>
              </motion.div>
            </Backdrop>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════
            ── AppBar — updated toolbar ──
        ══════════════════════════════════════════════════ */}
        <AppBar position="absolute" sx={{
          background: isDark
            ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #F8FAFC 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: 'none',
          borderBottom: isDark ? `1px solid ${alpha(GREEN, 0.12)}` : '1px solid rgba(0,0,0,0.07)',
          zIndex: 10,
          transition: 'background 0.35s',
        }}>
          <Toolbar sx={{ minHeight: 56, justifyContent: 'space-between', gap: 1 }}>

            {/* LEFT: apps link */}
            <AnimatedHeaderButton
              label="APPS"
              direction="left"
              icon={<AppsIcon size={22} color={GREEN} />}
              onClick={() => { if (landingPageUrl) router.push(landingPageUrl) }}
            />

            {/* CENTER: theme toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </Box>

            {/* RIGHT: help link */}
            <AnimatedHeaderButton
              label="HELP"
              direction="right"
              icon={<HelpSvgIcon size={22} color={GREEN} />}
              onClick={() => router.push('/help')}
            />

          </Toolbar>
        </AppBar>

        {/* ── Map Controls ── */}
        <Box sx={{ position: 'absolute', right: 16, bottom: showLocationSheet ? 360 : 100, zIndex: 5, transition: 'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <MapControls onLocateMe={handleRelocate} onZoomIn={() => mapControls?.zoomIn()} onZoomOut={() => mapControls?.zoomOut()} />
        </Box>

        {/* ══════════════════════════════════════════════════
            Location Selection Sheet
        ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showLocationSheet && (
            <SwipeableBottomSheet open initialHeight="80%" maxHeight="90%" minHeight={280} expandedHeight={sheetExpanded ? '90%' : null} persistHeight={sheetExpanded} onSwipeDown={() => { setSheetExpanded(false); setFocusedInput(null); }}>
              <AnimatePresence mode="wait">
                {showModalSkeleton ? (
                  <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <ModalLoadingSkeleton />
                  </motion.div>
                ) : (
                  <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                    <Box sx={{ ...HEADER_GRADIENT_SX, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexShrink: 0, overflow: 'hidden', position: 'relative', '&::before': { content: '""', position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' } }}>
                      <BottomSheetDragPill colored />
                      <AnimatePresence>
                        {!focusedInput && (
                          <motion.div key="header-info" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -28 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: 'hidden' }}>
                            <Box sx={{ px: 3, pb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontSize: '1.15rem', letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.15)', mb: 1.25 }}>Okra Rides</Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, gap: 1 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, flexShrink: 0 }}>Your location</Typography>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, maxWidth: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{locationDisplayText}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button fullWidth size="small" onClick={handleChangeLocation} sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', py: 0.75, border: '1px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }, '&:focus': { outline: 'none' } }}>Change</Button>
                                <Button fullWidth size="small" onClick={handleIAmHere} sx={{ bgcolor: 'white', color: '#E65100', borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', py: 0.75, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' }, '&:focus': { outline: 'none' } }}>I am here</Button>
                              </Box>
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.div layout transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }} style={{ width: '100%' }}>
                        <Box sx={{ px: 2.5, pt: 0.5, pb: 2.5, width: '100%', boxSizing: 'border-box' }}>
                          {rideError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{rideError}</Alert>}
                          <Box sx={{ mb: 0.75 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, transition: 'color 0.2s ease', color: focusedInput === 'pickup' ? 'white' : 'rgba(255,255,255,0.65)' }}>Pickup</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid', borderColor: focusedInput === 'pickup' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)', borderRadius: 2, boxShadow: focusedInput === 'pickup' ? '0 0 0 3px rgba(255,255,255,0.22)' : 'none', bgcolor: focusedInput === 'pickup' ? 'white' : 'rgba(255,255,255,0.88)', minHeight: 52, width: '100%', maxWidth: '100%', boxSizing: 'border-box', transition: 'all 0.22s ease', overflow: 'hidden' }}>
                              <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', flexShrink: 0, borderRight: '1.5px solid', borderColor: focusedInput === 'pickup' ? 'divider' : 'rgba(255,255,255,0.3)', bgcolor: focusedInput === 'pickup' ? 'rgba(255,193,7,0.08)' : 'rgba(255,255,255,0.15)', transition: 'all 0.22s ease' }}>
                                <PersonIcon sx={{ fontSize: 19, color: focusedInput === 'pickup' ? 'primary.main' : pickupLocation ? 'success.main' : 'rgba(0,0,0,0.4)', transition: 'color 0.22s ease' }} />
                              </Box>
                              <Box sx={{ flex: 1, px: 1.5, py: 1, display: 'flex', alignItems: 'center', cursor: 'text', minWidth: 0 }} onClick={() => { if (pickupChipVisible) { setPickupChipVisible(false); handleInputFocus('pickup'); } }}>
                                {pickupChipVisible ? (
                                  <Chip icon={<MyLocationIcon sx={{ fontSize: '14px !important' }} />} label="Current Location" onDelete={() => { setPickupLocation(null); setPickupChipVisible(false); handleInputFocus('pickup'); }} onClick={() => { setPickupChipVisible(false); handleInputFocus('pickup'); }} size="small" sx={{ bgcolor: 'rgba(255,193,7,0.15)', color: '#E65100', fontWeight: 700, fontSize: '0.75rem', height: 28, '& .MuiChip-deleteIcon': { color: '#E65100', opacity: 0.7 }, '& .MuiChip-icon': { color: '#E65100' } }} />
                                ) : (
                                  <Box sx={{ ...CLEAN_INPUT_SX, width: '100%' }}>
                                    <LocationSearch placeholder={pickupLocation?.address && !pickupLocation.isCurrentLocation ? pickupLocation.address : 'Enter pickup location'} onSelectLocation={handlePickupSelect} mapControls={mapControls} value={focusedInput === 'pickup' ? (pickupLocation?.isCurrentLocation ? '' : pickupLocation?.address || '') : (pickupLocation?.address || '')} autoFocus={focusedInput === 'pickup'} onFocus={() => handleInputFocus('pickup')} onBlur={handleInputBlur} />
                                  </Box>
                                )}
                              </Box>
                              {pickupLocation && !pickupChipVisible && (
                                <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled', '&:focus': { outline: 'none' } }} onClick={(e) => { e.stopPropagation(); setPickupLocation(null); setFareEstimates(null); }}>
                                  <CloseIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: '21px', my: 0.2 }}>
                            <Box sx={{ width: 2, height: 18, bgcolor: pickupLocation && dropoffLocation ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', borderRadius: 1, transition: 'background-color 0.3s ease' }} />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, transition: 'color 0.2s ease', color: focusedInput === 'dropoff' ? 'white' : 'rgba(255,255,255,0.65)' }}>Destination</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid', borderColor: focusedInput === 'dropoff' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)', borderRadius: 2, boxShadow: focusedInput === 'dropoff' ? '0 0 0 3px rgba(255,255,255,0.22)' : 'none', bgcolor: focusedInput === 'dropoff' ? 'white' : 'rgba(255,255,255,0.88)', minHeight: 52, width: '100%', maxWidth: '100%', boxSizing: 'border-box', transition: 'all 0.22s ease', overflow: 'hidden' }}>
                              <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', flexShrink: 0, borderRight: '1.5px solid', borderColor: focusedInput === 'dropoff' ? 'divider' : 'rgba(255,255,255,0.3)', bgcolor: focusedInput === 'dropoff' ? 'rgba(255,193,7,0.08)' : 'rgba(255,255,255,0.15)', transition: 'all 0.22s ease' }}>
                                <FlagIcon sx={{ fontSize: 19, color: focusedInput === 'dropoff' ? 'primary.main' : dropoffLocation ? 'error.main' : 'rgba(0,0,0,0.4)', transition: 'color 0.22s ease' }} />
                              </Box>
                              <Box sx={{ flex: 1, px: 1.5, py: 1, minWidth: 0 }}>
                                <Box sx={{ ...CLEAN_INPUT_SX, width: '100%' }}>
                                  <LocationSearch placeholder="Where to?" onSelectLocation={handleDropoffSelect} mapControls={mapControls} value={dropoffLocation?.address || ''} autoFocus={focusedInput === 'dropoff'} onFocus={() => handleInputFocus('dropoff')} onBlur={handleInputBlur} />
                                </Box>
                              </Box>
                              {dropoffLocation && (
                                <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled', '&:focus': { outline: 'none' } }} onClick={(e) => { e.stopPropagation(); setDropoffLocation(null); setFareEstimates(null); }}>
                                  <CloseIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </motion.div>
                    </Box>

                    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none', '&::-webkit-scrollbar': { display: 'none' }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                      <AnimatePresence>
                        {recentLocations.length > 0 && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                            <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                  {focusedInput === 'pickup' ? 'Set as pickup' : 'Recent destinations'}
                                </Typography>
                                <Box sx={{ height: 1, flex: 1, mx: 1.5, bgcolor: 'divider' }} />
                                <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                              </Box>
                              <List disablePadding>
                                {recentLocations.map((loc, index) => (
                                  <motion.div key={`${loc.placeId}-${index}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.2 }}>
                                    <ListItem onClick={() => handleSelectRecentLocation(loc)} sx={{ py: 1, px: 1.5, borderRadius: 2, mb: 0.5, cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { bgcolor: 'action.hover', transform: 'translateX(3px)' }, '&:active': { transform: 'translateX(1px)' }, '&:focus': { outline: 'none' } }}>
                                      <ListItemIcon sx={{ minWidth: 36, width: 36, height: 36, borderRadius: '50%', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
                                        <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      </ListItemIcon>
                                      <ListItemText primary={loc.name || loc.address?.split(',')[0]} secondary={loc.name && loc.name !== loc.address ? loc.address : null} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem', noWrap: true }} secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', noWrap: true }} />
                                    </ListItem>
                                  </motion.div>
                                ))}
                              </List>
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </SwipeableBottomSheet>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════
            Ride Options Sheet
        ══════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {showRideOptions && pickupLocation && dropoffLocation && (
            <SwipeableBottomSheet key="ride-options-sheet" open initialHeight="80%" maxHeight="90%" minHeight={280} expandedHeight="90%" persistHeight draggable={false}>
              {loadingEstimates ? (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <FareEstimatesSkeleton onClose={handleCloseRideOptions} routeInfo={routeInfo} />
                </Box>
              ) : (
                <RideOptionsSheet pickupLocation={pickupLocation} dropoffLocation={dropoffLocation} routeInfo={routeInfo} fareEstimates={fareEstimates} loadingEstimates={loadingEstimates} selectedRideClass={selectedRideClass} onSelectRideClass={setSelectedRideClass} promoCode={promoCode} onPromoCodeChange={setPromoCode} promoDiscount={promoDiscount} onValidatePromo={handleValidatePromoCode} validatingPromo={validatingPromo} onClose={handleCloseRideOptions} onConfirmRide={handleConfirmRide} loading={rideLoading} bottomPadding={80} />
              )}
            </SwipeableBottomSheet>
          )}
        </AnimatePresence>

        {/* ── Snackbar ── */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ClientOnly>
  );
}