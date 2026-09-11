'use client';
// PATH: Okra/Okrarides/rider/components/Map/LocationSelectMap.jsx
//
// Full-screen "drag map, fixed center pin" location picker — Uber/Bolt style.
// Reuses the SAME provider abstraction as everywhere else (MapIframe / MapsProvider),
// so whichever provider is prioritized (Yandex, Google, OSM iframe, etc.) is what
// renders here too. The pin + radius circle are a fixed overlay; the map moves
// underneath it. We poll `mapControls.getCenter()` (added to every provider's
// controls object) to know where the pin is currently pointing, debounce, then
// reverse-geocode that point via mapsProvider.reverseGeocode().

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Box, IconButton, Button, Typography, CircularProgress, Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  LocationOn as LocationIcon,
  SwipeOutlined as SwipeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { MapIframe } from './MapIframe';

let useMapsProviderHook = null;
try {
  const mod = require('./APIProviders/MapsProvider');
  useMapsProviderHook = mod.useMapProvider;
} catch { /* MapsProvider not in tree */ }

function useSafeMapProvider() {
  try { if (useMapsProviderHook) return useMapsProviderHook(); } catch {}
  return null;
}

function readSavedGeoLoc() {
  if (typeof window === 'undefined') return null;
  try {
    if (localStorage.getItem('geo_loc_status') !== 'success') return null;
    const geo = JSON.parse(localStorage.getItem('geo_loc_data') || 'null');
    if (geo?.lat != null && geo?.lng != null) return geo;
  } catch {}
  return null;
}

const DEFAULT_CENTER = { lat: -15.4167, lng: 28.2833 };
const POLL_MS = 250;
const SETTLE_MS = 450;
const CENTER_EPSILON = 1e-7;

export const LocationSelectMap = ({
  open,
  initialCenter = null,   // { lat, lng } — highest priority
  initialZoom = 16,
  countryCode = null,
  onClose,
  onSelectLocation,       // (location) => void — location = { lat, lng, address, name, placeId }
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const mapsProvider = useSafeMapProvider();

  const [mounted, setMounted] = useState(false);
  const [center, setCenter] = useState(initialCenter || readSavedGeoLoc() || DEFAULT_CENTER);
  const [isMoving, setIsMoving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [address, setAddress] = useState(null);
  const [showHint, setShowHint] = useState(true);
  const [locating, setLocating] = useState(false);

  const mapControlsRef = useRef(null);
  const lastCenterRef = useRef(null);
  const settleTimeoutRef = useRef(null);
  const resolveTokenRef = useRef(0);
  const pollIntervalRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Reset state each time the picker opens ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const startCenter = initialCenter || readSavedGeoLoc() || DEFAULT_CENTER;
    setCenter(startCenter);
    lastCenterRef.current = startCenter;
    setAddress(null);
    setResolving(false);
    setIsMoving(false);
    setShowHint(true);
    const hintTimer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(hintTimer);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reverse-geocode the current center ────────────────────────────────────
  const resolveAddress = useCallback(async (loc) => {
    if (!loc) return;
    const myToken = ++resolveTokenRef.current;
    setResolving(true);
    try {
      let result = null;
      if (mapsProvider?.reverseGeocode) {
        result = await mapsProvider.reverseGeocode(loc.lat, loc.lng);
      }
      if (!result) {
        // Fallback: Nominatim directly, so this still works even if
        // MapsProvider isn't ready yet.
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } },
          );
          if (res.ok) {
            const d = await res.json();
            result = {
              lat: loc.lat, lng: loc.lng,
              address: d.display_name,
              name: d.name || d.display_name?.split(',')[0],
              place_id: `nominatim_${d.place_id}`,
            };
          }
        } catch { /* ignore */ }
      }
      if (myToken !== resolveTokenRef.current) return; // stale response
      if (result) {
        setAddress({ ...result, lat: loc.lat, lng: loc.lng });
      } else {
        setAddress({
          lat: loc.lat, lng: loc.lng,
          address: `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`,
          name: 'Selected location',
          place_id: `pin_${loc.lat}_${loc.lng}`,
        });
      }
    } finally {
      if (myToken === resolveTokenRef.current) setResolving(false);
    }
  }, [mapsProvider]);

  // ── Poll the map's center via the unified controls API ───────────────────
  useEffect(() => {
    if (!open) return;
    pollIntervalRef.current = setInterval(() => {
      const controls = mapControlsRef.current;
      if (!controls?.getCenter) return;
      controls.getCenter((loc) => {
        if (!loc || loc.lat == null || loc.lng == null) return;
        const prev = lastCenterRef.current;
        const changed =
          !prev ||
          Math.abs(prev.lat - loc.lat) > CENTER_EPSILON ||
          Math.abs(prev.lng - loc.lng) > CENTER_EPSILON;
        if (!changed) return;

        lastCenterRef.current = loc;
        setCenter(loc);
        setIsMoving(true);
        setShowHint(false);

        if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = setTimeout(() => {
          setIsMoving(false);
          resolveAddress(loc);
        }, SETTLE_MS);
      });
    }, POLL_MS);

    return () => {
      clearInterval(pollIntervalRef.current);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, [open, resolveAddress]);

  const handleMapLoad = useCallback((controls) => {
    mapControlsRef.current = controls;
    // Resolve the starting address immediately.
    resolveAddress(lastCenterRef.current || center);
  }, [resolveAddress, center]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocating(false);
        mapControlsRef.current?.animateToLocation?.(loc, 17);
        lastCenterRef.current = loc;
        setCenter(loc);
        resolveAddress(loc);
      },
      () => setLocating(false),
    );
  }, [resolveAddress]);

  const handleConfirm = useCallback(() => {
    if (!address) return;
    onSelectLocation?.({
      lat: address.lat,
      lng: address.lng,
      address: address.address,
      name: address.name,
      placeId: address.place_id,
    });
  }, [address, onSelectLocation]);

  if (!mounted || !open) return null;

  const bg = theme.palette.background.paper;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="location-select-map"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 14000,
          display: 'flex', flexDirection: 'column',
          background: bg,
        }}
      >
        {/* ── Map layer ── */}
        <Box sx={{ position: 'absolute', inset: 0 }}>
          <MapIframe
            center={center}
            zoom={initialZoom}
            onMapLoad={handleMapLoad}
            height="100%"
            width="100%"
          />
        </Box>

        {/* ── Close button (top-right) ── */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 3 }}>
          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: bg, boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              '&:hover': { bgcolor: bg },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* ── "Swipe to move map" hint ── */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                zIndex: 3,
              }}
            >
              <Chip
                icon={<SwipeIcon sx={{ fontSize: 16 }} />}
                label="Swipe to move map"
                sx={{
                  bgcolor: bg, fontWeight: 600, boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Fixed center pin + radius circle (map moves underneath) ── */}
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* radius circle — sits centered on the exact map center point */}
          <motion.div
            animate={{
              scale: isMoving ? [1, 1.08, 1] : 1,
              opacity: isMoving ? 0.35 : 0.22,
            }}
            transition={{ duration: 0.6, repeat: isMoving ? Infinity : 0 }}
            style={{
              position: 'absolute',
              width: 110, height: 110, borderRadius: '50%',
              background: theme.palette.primary.main,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 110, height: 110, borderRadius: '50%',
              border: `1.5px solid ${theme.palette.primary.main}`,
              opacity: 0.5,
            }}
          />

          {/* pin — lifts slightly while the map is actively moving */}
          <motion.div
            animate={{ y: isMoving ? -14 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <LocationIcon
              sx={{
                fontSize: 42,
                color: theme.palette.primary.main,
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
              }}
            />
          </motion.div>

          {/* small shadow under the pin, shrinks when the pin lifts */}
          <motion.div
            animate={{ scale: isMoving ? 0.6 : 1, opacity: isMoving ? 0.15 : 0.3 }}
            style={{
              position: 'absolute', bottom: -4,
              width: 16, height: 6, borderRadius: '50%',
              background: '#000',
            }}
          />
        </Box>

        {/* ── Bottom sheet ── */}
        <Box
          sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
            bgcolor: bg, boxShadow: '0 -6px 24px rgba(0,0,0,0.18)',
            borderTopLeftRadius: 18, borderTopRightRadius: 18,
            p: 2, pb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
            <LocationIcon color="primary" sx={{ mt: 0.25, fontSize: 20 }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Selected location
              </Typography>
              {resolving ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <CircularProgress size={14} />
                  <Typography variant="body2" color="text.secondary">Finding address…</Typography>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  noWrap
                >
                  {address?.address || address?.name || 'Move the map to select a location'}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              startIcon={locating ? <CircularProgress size={14} /> : <MyLocationIcon sx={{ fontSize: 18 }} />}
              sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              Current
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleConfirm}
              disabled={!address || resolving}
              sx={{ fontWeight: 700 }}
            >
              Confirm location
            </Button>
          </Box>
        </Box>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default LocationSelectMap;