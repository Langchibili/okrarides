'use client';
// PATH: rider/app/(main)/deliveries/send/page.jsx

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, IconButton, Button,
  List, ListItem, ListItemText, ListItemIcon,
  CircularProgress, Alert, Snackbar, Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  Close as CloseIcon,
  SwapVert as SwapIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import MapIframe from '@/components/Map/MapIframe';
import { MapControls } from '@/components/Map/MapControls';
import { LocationSearch } from '@/components/Map/LocationSearch';
import SwipeableBottomSheet, { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';
import DeliveryOptionsSheet from '@/components/Rider/DeliveryOptionsSheet';
import { useDeliveryBooking } from '@/lib/hooks/useDeliveryBooking';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';

const AMBER = '#F59E0B';

const CLEAN_INPUT_SX = {
  '& .MuiInputBase-root': {
    border: 'none !important', outline: 'none !important',
    boxShadow: 'none !important', bgcolor: 'transparent !important', p: '0 !important',
  },
  '& .MuiOutlinedInput-notchedOutline': { border: 'none !important' },
  '& .MuiFilledInput-underline:before': { display: 'none' },
  '& .MuiFilledInput-underline:after':  { display: 'none' },
  '& .MuiInput-underline:before':       { display: 'none' },
  '& .MuiInput-underline:after':        { display: 'none' },
  '& .MuiInputAdornment-root':          { display: 'none' },
  '& .MuiIconButton-root':              { display: 'none' },
  '& .MuiInputBase-input': { p: '0 !important', fontSize: '0.9rem', fontWeight: 500 },
};

const HEADER_GRADIENT_SX = {
  background: 'linear-gradient(-60deg, #F59E0B 0%, #EF6C00 25%, #FFC107 50%, #FF8F00 75%, #F59E0B 100%)',
  backgroundSize: '300% 300%',
  animation: 'deliverySendWave 7s ease infinite',
  '@keyframes deliverySendWave': {
    '0%':   { backgroundPosition: '0% 50%' },
    '50%':  { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
};

export default function SendPackagePage() {
  const router = useRouter();
  const { user } = useAuth();

  // ── Location hooks — exact same as rides home page ─────────────────────
  const { location, loading: locationLoading, refresh: refreshWebLocation } = useGeolocation({ watch: true });
  const { isNative, getCurrentLocation: getNativeLocation } = useReactNative();

  // ── Delivery booking ───────────────────────────────────────────────────
  const { bookDelivery, booking, currentDelivery } = useDeliveryBooking();

  // ── Location state ─────────────────────────────────────────────────────
  const [pickupLocation,    setPickupLocation]    = useState(null);
  const [dropoffLocation,   setDropoffLocation]   = useState(null);
  const [mapCenter,         setMapCenter]         = useState({ lat: -15.4167, lng: 28.2833 });
  const [routeInfo,         setRouteInfo]         = useState(null);
  const [focusedInput,      setFocusedInput]      = useState(null);
  const [sheetExpanded,     setSheetExpanded]     = useState(false);
  const [pickupChipVisible, setPickupChipVisible] = useState(false);

  // ── Sheet visibility ───────────────────────────────────────────────────
  const [showLocationSheet,   setShowLocationSheet]   = useState(true);
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);

  // ── Misc ───────────────────────────────────────────────────────────────
  const [recentLocations, setRecentLocations] = useState([]);
  const [mapControls,     setMapControls]     = useState(null);
  const [showTraffic,     setShowTraffic]     = useState(false);
  const [isRelocating,    setIsRelocating]    = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ── Refs ───────────────────────────────────────────────────────────────
  const mapControlsRef      = useRef(null);
  const locationObtainedRef = useRef(false);
  const fastIntervalRef     = useRef(null);
  const slowIntervalRef     = useRef(null);

  useEffect(() => { mapControlsRef.current = mapControls; }, [mapControls]);

  // ── Load recent locations ──────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('okra_rides_recent_locations');
    if (saved) { try { setRecentLocations(JSON.parse(saved)); } catch {} }
  }, []);
  
  useEffect(() => {
      if (currentDelivery) {
        const { rideStatus, id } = currentDelivery;
  
        if (rideStatus === 'pending') {
          router.push(`/deliveries/finding-deliverer`)
        } else if (['accepted', 'arrived', 'passenger_onboard'].includes(rideStatus)) {
          router.push(`/deliveries/${id}/tracking`);
        } else if (rideStatus === 'completed') {
          router.push(`/deliveries/${id}`);
        }
      }
    }, [currentDelivery, router]);

  // ── Pickup chip visibility ─────────────────────────────────────────────
  useEffect(() => {
    setPickupChipVisible(pickupLocation?.isCurrentLocation === true && focusedInput !== 'pickup');
  }, [pickupLocation, focusedInput]);

  // ══════════════════════════════════════════════════════════════════════
  // Location detection — exact copy from rides home page
  // ══════════════════════════════════════════════════════════════════════

  const applyLocationFix = useCallback((lat, lng) => {
    if (lat == null || lng == null) return;
    locationObtainedRef.current = true;
    setMapCenter({ lat, lng });
    setPickupLocation((prev) => {
      if (prev && !prev.isCurrentLocation) return prev;
      return { lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, placeId: `geo_${lat}_${lng}`, isCurrentLocation: true };
    });
  }, []);

  const fetchAndApplyNativeLocation = useCallback(async () => {
    try {
      const nativeLoc = await getNativeLocation();
      if (!nativeLoc?.lat) return null;
      const coords = { lat: nativeLoc.lat, lng: nativeLoc.lng };
      setMapCenter(coords);
      if (mapControlsRef.current) mapControlsRef.current.animateToLocation(coords, 16);
      await new Promise((r) => setTimeout(r, 3000));
      if (user?.id) {
        const res = await apiClient.get(`/users/${user.id}`);
        const cl  = res?.currentLocation;
        if (cl?.latitude && cl?.longitude) {
          locationObtainedRef.current = true;
          const loc = { lat: cl.latitude, lng: cl.longitude, address: cl.address || `${cl.latitude}, ${cl.longitude}`, name: cl.name || cl.address?.split(',')[0] || 'Current Location', placeId: cl.placeId || `geo_${cl.latitude}_${cl.longitude}`, isCurrentLocation: true };
          setPickupLocation((prev) => (prev && !prev.isCurrentLocation ? prev : loc));
          return loc;
        }
      }
      locationObtainedRef.current = true;
      return coords;
    } catch { return null; }
  }, [user, getNativeLocation]);

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
        if (isNative && getNativeLocation) await fetchAndApplyNativeLocation();
        else await refreshWebLocation();
      } catch {}
    }, SLOW_MS);
    return () => {
      if (fastIntervalRef.current) clearInterval(fastIntervalRef.current);
      if (slowIntervalRef.current) clearInterval(slowIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNative) fetchAndApplyNativeLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapControls && mapCenter) mapControls.animateToLocation(mapCenter, 16);
  }, [mapControls, mapCenter]);

  // ── Switch sheets when both locations are set ──────────────────────────
  useEffect(() => {
    if (pickupLocation && dropoffLocation && showLocationSheet) {
      const t = setTimeout(() => {
        setShowLocationSheet(false);
        setShowDeliveryOptions(true);
        setSheetExpanded(false);
        setFocusedInput(null);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [pickupLocation, dropoffLocation, showLocationSheet]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const saveToRecent = useCallback((loc) => {
    if (loc.isCurrentLocation) return;
    const newRecent = [loc, ...recentLocations.filter((l) => l.placeId !== loc.placeId && l.address !== loc.address)].slice(0, 5);
    setRecentLocations(newRecent);
    localStorage.setItem('okra_rides_recent_locations', JSON.stringify(newRecent));
  }, [recentLocations]);

  const handlePickupSelect = useCallback((loc) => {
    setPickupLocation(loc); saveToRecent(loc);
    if (mapControls) mapControls.animateToLocation(loc, 15);
    setTimeout(() => setFocusedInput(null), 150);
  }, [mapControls, saveToRecent]);

  const handleDropoffSelect = useCallback((loc) => {
    setDropoffLocation(loc); saveToRecent(loc);
    if (mapControls) mapControls.animateToLocation(loc, 15);
    setTimeout(() => setFocusedInput(null), 150);
  }, [mapControls, saveToRecent]);

  const handleSelectRecent = useCallback((loc) => {
    if (focusedInput === 'pickup') handlePickupSelect(loc);
    else handleDropoffSelect(loc);
  }, [focusedInput, handlePickupSelect, handleDropoffSelect]);

  const handleInputFocus = (input) => { setFocusedInput(input); if (!sheetExpanded) setSheetExpanded(true); };
  const handleInputBlur  = () => { setTimeout(() => setFocusedInput(null), 180); };

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
        if (location && mapControls) { mapControls.animateToLocation({ lat: location.lat, lng: location.lng }, 16); applyLocationFix(location.lat, location.lng); }
        else throw new Error('no_location');
      }
      setSnackbar({ open: true, message: 'Location updated', severity: 'success' });
    } catch { setSnackbar({ open: true, message: 'Could not get your location.', severity: 'error' }); }
    finally { setTimeout(() => setIsRelocating(false), 1500); }
  };

  const handleSwap = () => { const [p, d] = [pickupLocation, dropoffLocation]; setPickupLocation(d); setDropoffLocation(p); };

  const handleCloseDeliveryOptions = () => {
    setShowDeliveryOptions(false); setShowLocationSheet(true);
    setDropoffLocation(null); setSheetExpanded(false);
  };

  // ── Fetch estimates ────────────────────────────────────────────────────
  const fetchDeliveryEstimates = useCallback(async (payload) => {
    const response = await apiClient.post('/deliveries/estimate', payload);
    return response?.data ?? response;
  }, []);

  // ── Confirm ────────────────────────────────────────────────────────────
  const handleConfirmDelivery = async (details) => {
    try {
      const data = await bookDelivery({
        pickupLocation, dropoffLocation,
        paymentMethod:         details.paymentMethod,
        deliveryMode:          details.deliveryMode,
        recipient:             details.recipient,
        packageType:           details.packageType,
        isFragile:             details.isFragile,
        weightKg:              details.weightKg,
        bigItemFit:            details.bigItemFit,
        vehiclePreference:     details.vehiclePreference,
        deliveryClassName:     details.deliveryClass?.deliveryClassName,
        deliveryClassId:       details.deliveryClass?.deliveryClassId,
        vehicleTypePreference: details.vehiclePreference,
        estimatedFare:         details.totalFare,
        totalFare:             details.totalFare,
        estimatedDistance:     parseFloat(routeInfo?.distance) || null,
        estimatedDuration:     parseFloat(routeInfo?.duration) || null,
      });
      if (data?.id) router.push(`/deliveries/finding-deliverer?id=${data.id}`);
    } catch (e) {
      setSnackbar({ open: true, message: e?.message ?? 'Failed to place delivery.', severity: 'error' });
    }
  };

  // ── Markers ────────────────────────────────────────────────────────────
  const markers = useMemo(() => {
    const m = [];
    if (pickupLocation)  m.push({ id: 'pickup',  position: pickupLocation,  type: 'pickup'  });
    if (dropoffLocation) m.push({ id: 'dropoff', position: dropoffLocation, type: 'dropoff' });
    return m;
  }, [pickupLocation?.lat, pickupLocation?.lng, dropoffLocation?.lat, dropoffLocation?.lng]);

  // ── Location display text ──────────────────────────────────────────────
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

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', overflow: 'hidden', maxWidth: '100vw', boxSizing: 'border-box' }}>

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <MapIframe
          center={mapCenter ?? { lat: -15.4167, lng: 28.2833 }}
          zoom={16}
          markers={markers}
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          showRoute={!!(pickupLocation && dropoffLocation)}
          showTraffic={showTraffic}
          onMapLoad={setMapControls}
          onRouteCalculated={setRouteInfo}
          onMapClick={(loc) => {
            if (!loc) return;
            const field = focusedInput ?? (pickupLocation ? 'dropoff' : 'pickup');
            const coords = { lat: loc.lat, lng: loc.lng, address: 'Selected location', name: 'Selected location' };
            if (field === 'pickup') handlePickupSelect(coords);
            else handleDropoffSelect(coords);
          }}
        />
      </Box>

      {/* ── Back button ───────────────────────────────────────────────────── */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
        <IconButton onClick={() => router.back()} sx={{ bgcolor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
          <BackIcon />
        </IconButton>
      </Box>

      {/* ── Relocating overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isRelocating && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 1400, bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} style={{ textAlign: 'center' }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, mx: 'auto', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { boxShadow: `0 0 0 0 ${alpha(AMBER, 0.7)}` }, '70%': { boxShadow: `0 0 0 20px ${alpha(AMBER, 0)}` }, '100%': { boxShadow: `0 0 0 0 ${alpha(AMBER, 0)}` } } }}>
                <MyLocationIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <CircularProgress size={44} thickness={3} sx={{ mb: 2, color: AMBER }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>Finding your location…</Typography>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      {/* ── Map controls ──────────────────────────────────────────────────── */}
      <Box sx={{ position: 'absolute', right: 16, bottom: showLocationSheet ? 360 : 100, zIndex: 5, transition: 'bottom 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
        <MapControls
          onLocateMe={handleRelocate}
          onZoomIn={() => mapControls?.zoomIn?.()}
          onZoomOut={() => mapControls?.zoomOut?.()}
          onToggleTraffic={() => setShowTraffic((p) => !p)}
          showTraffic={showTraffic}
        />
      </Box>

      {/* ══════════════════════════════════════════════════════════════════
          Location Selection Sheet — identical structure to rides home
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showLocationSheet && (
          <SwipeableBottomSheet open initialHeight="80%" maxHeight="90%" minHeight={280} expandedHeight={sheetExpanded ? '90%' : null} persistHeight={sheetExpanded} onSwipeDown={() => { setSheetExpanded(false); setFocusedInput(null); }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', overflow: 'hidden', bgcolor: '#FBF3E8' }}>

              {/* Gradient header */}
              <Box sx={{ ...HEADER_GRADIENT_SX, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexShrink: 0, overflow: 'hidden', position: 'relative', '&::before': { content: '""', position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' } }}>
                <BottomSheetDragPill colored />

                {/* Location summary — hides on focus */}
                <AnimatePresence>
                  {!focusedInput && (
                    <motion.div key="header-info" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -28 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                      <Box sx={{ px: 3, pb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontSize: '1.15rem', letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.15)', mb: 1.25 }}>
                          Send a package
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, flexShrink: 0 }}>Your location</Typography>
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, maxWidth: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{locationDisplayText}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button fullWidth size="small" onClick={() => { setPickupChipVisible(false); handleInputFocus('pickup'); }} sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', py: 0.75, border: '1px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>Change</Button>
                          <Button fullWidth size="small" onClick={handleIAmHere} sx={{ bgcolor: 'white', color: '#E65100', borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', py: 0.75, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' } }}>I am here</Button>
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input fields */}
                <motion.div layout transition={{ duration: 0.26 }} style={{ width: '100%' }}>
                  <Box sx={{ px: 2.5, pt: 0.5, pb: 2.5, width: '100%', boxSizing: 'border-box' }}>
                    {/* Pickup */}
                    <Box sx={{ mb: 0.75 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, color: focusedInput === 'pickup' ? 'white' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}>Pickup</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid', borderColor: focusedInput === 'pickup' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)', borderRadius: 2, boxShadow: focusedInput === 'pickup' ? '0 0 0 3px rgba(255,255,255,0.22)' : 'none', bgcolor: focusedInput === 'pickup' ? 'white' : 'rgba(255,255,255,0.88)', minHeight: 52, width: '100%', boxSizing: 'border-box', transition: 'all 0.22s', overflow: 'hidden' }}>
                        <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', flexShrink: 0, borderRight: '1.5px solid', borderColor: focusedInput === 'pickup' ? 'divider' : 'rgba(255,255,255,0.3)', bgcolor: focusedInput === 'pickup' ? `rgba(245,158,11,0.08)` : 'rgba(255,255,255,0.15)', transition: 'all 0.22s' }}>
                          <PersonIcon sx={{ fontSize: 19, color: focusedInput === 'pickup' ? AMBER : pickupLocation ? 'success.main' : 'rgba(0,0,0,0.4)', transition: 'color 0.22s' }} />
                        </Box>
                        <Box sx={{ flex: 1, px: 1.5, py: 1, display: 'flex', alignItems: 'center', cursor: 'text', minWidth: 0 }} onClick={() => { if (pickupChipVisible) { setPickupChipVisible(false); handleInputFocus('pickup'); } }}>
                          {pickupChipVisible ? (
                            <Chip icon={<MyLocationIcon sx={{ fontSize: '14px !important' }} />} label="Current Location" onDelete={() => { setPickupLocation(null); setPickupChipVisible(false); handleInputFocus('pickup'); }} onClick={() => { setPickupChipVisible(false); handleInputFocus('pickup'); }} size="small" sx={{ bgcolor: `rgba(245,158,11,0.15)`, color: '#E65100', fontWeight: 700, fontSize: '0.75rem', height: 28, '& .MuiChip-deleteIcon': { color: '#E65100', opacity: 0.7 }, '& .MuiChip-icon': { color: '#E65100' } }} />
                          ) : (
                            <Box sx={{ ...CLEAN_INPUT_SX, width: '100%' }}>
                              <LocationSearch
                                placeholder={pickupLocation?.address && !pickupLocation.isCurrentLocation ? pickupLocation.address : 'Enter pickup location'}
                                onSelectLocation={handlePickupSelect} mapControls={mapControls}
                                value={focusedInput === 'pickup' ? (pickupLocation?.isCurrentLocation ? '' : pickupLocation?.address || '') : (pickupLocation?.address || '')}
                                autoFocus={focusedInput === 'pickup'} onFocus={() => handleInputFocus('pickup')} onBlur={handleInputBlur}
                              />
                            </Box>
                          )}
                        </Box>
                        {pickupLocation && !pickupChipVisible && (
                          <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled' }} onClick={(e) => { e.stopPropagation(); setPickupLocation(null); }}><CloseIcon sx={{ fontSize: 13 }} /></IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Connector + swap */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: '21px', my: 0.2 }}>
                      <Box sx={{ width: 2, height: 18, bgcolor: pickupLocation && dropoffLocation ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', borderRadius: 1, transition: 'background-color 0.3s' }} />
                      {pickupLocation && dropoffLocation && (
                        <IconButton size="small" onClick={handleSwap} sx={{ color: 'rgba(255,255,255,0.8)', mr: 0.5, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' } }}><SwapIcon sx={{ fontSize: 18 }} /></IconButton>
                      )}
                    </Box>

                    {/* Dropoff */}
                    <Box>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, color: focusedInput === 'dropoff' ? 'white' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}>Destination</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid', borderColor: focusedInput === 'dropoff' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)', borderRadius: 2, boxShadow: focusedInput === 'dropoff' ? '0 0 0 3px rgba(255,255,255,0.22)' : 'none', bgcolor: focusedInput === 'dropoff' ? 'white' : 'rgba(255,255,255,0.88)', minHeight: 52, width: '100%', boxSizing: 'border-box', transition: 'all 0.22s', overflow: 'hidden' }}>
                        <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', flexShrink: 0, borderRight: '1.5px solid', borderColor: focusedInput === 'dropoff' ? 'divider' : 'rgba(255,255,255,0.3)', bgcolor: focusedInput === 'dropoff' ? `rgba(245,158,11,0.08)` : 'rgba(255,255,255,0.15)', transition: 'all 0.22s' }}>
                          <FlagIcon sx={{ fontSize: 19, color: focusedInput === 'dropoff' ? AMBER : dropoffLocation ? 'error.main' : 'rgba(0,0,0,0.4)', transition: 'color 0.22s' }} />
                        </Box>
                        <Box sx={{ flex: 1, px: 1.5, py: 1, minWidth: 0 }}>
                          <Box sx={{ ...CLEAN_INPUT_SX, width: '100%' }}>
                            <LocationSearch placeholder="Where to deliver?" onSelectLocation={handleDropoffSelect} mapControls={mapControls} value={dropoffLocation?.address || ''} autoFocus={focusedInput === 'dropoff'} onFocus={() => handleInputFocus('dropoff')} onBlur={handleInputBlur} />
                          </Box>
                        </Box>
                        {dropoffLocation && (
                          <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled' }} onClick={(e) => { e.stopPropagation(); setDropoffLocation(null); }}><CloseIcon sx={{ fontSize: 13 }} /></IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              </Box>

              {/* Recent locations */}
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, width: '100%', boxSizing: 'border-box' }}>
                <AnimatePresence>
                  {recentLocations.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
                            <motion.div key={`${loc.placeId}-${index}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                              <ListItem button onClick={() => handleSelectRecent(loc)} sx={{ py: 1, px: 1.5, borderRadius: 2, mb: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', transform: 'translateX(3px)' }, transition: 'all 0.15s' }}>
                                <ListItemIcon sx={{ minWidth: 36, width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
                                  <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={loc.name || loc.address?.split(',')[0]}
                                  secondary={loc.name && loc.name !== loc.address ? loc.address : null}
                                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem', noWrap: true }}
                                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', noWrap: true }}
                                />
                              </ListItem>
                            </motion.div>
                          ))}
                        </List>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          </SwipeableBottomSheet>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          Delivery Options Sheet
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {showDeliveryOptions && pickupLocation && dropoffLocation && (
          <SwipeableBottomSheet key="delivery-options-sheet" open initialHeight="80%" maxHeight="90%" minHeight={280} expandedHeight="90%" persistHeight draggable={false}>
            <DeliveryOptionsSheet
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              routeInfo={routeInfo}
              onClose={handleCloseDeliveryOptions}
              onConfirmDelivery={handleConfirmDelivery}
              loading={booking}
              bottomPadding={80}
              fetchEstimates={fetchDeliveryEstimates}
            />
          </SwipeableBottomSheet>
        )}
      </AnimatePresence>

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}













  