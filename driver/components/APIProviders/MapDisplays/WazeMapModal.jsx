// PATH: Okra/Okrarides/rider/components/Map/MapDisplays/WazeMapModal.jsx
//
// Full-screen Waze Map modal — shown when prioritizedMap === 'wazemap'
//
// Design:
//   • Full viewport overlay (z-index 1400, above MUI Drawer/AppBar)
//   • Integrated LocationSearch at the top using mapsProvider (Geoapify, etc.)
//   • Waze Live Map iframe fills the body
//   • Center-pin crosshair — user drags Waze map under the pin to fine-tune
//   • Reverse-geocodes the selected lat/lng to show a human address
//   • Bottom action sheet: "Set as Pickup" / "Set as Dropoff" / "Confirm"
//   • All buttons fire onLocationSelected(location, type) back to the parent
//     — same shape LocationSearch.onSelectLocation uses, so booking logic needs
//       no changes.
//
// Props:
//   open                  boolean               — controls modal visibility
//   onClose               () => void
//   onLocationSelected    (location, type) => void
//                           location: { lat, lng, address, name, placeId }
//                           type:     'pickup' | 'dropoff' | 'general'
//   initialCenter         { lat, lng }          — where to open the map
//   pickupLocation        { lat, lng, address } — optional, shown on map
//   dropoffLocation       { lat, lng, address } — optional
//   countryCode           string                — e.g. "zm", for search bias

'use client';

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  Box, IconButton, Typography, Paper, CircularProgress,
  Slide, Chip, Divider, Button, Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Navigation as NavigationIcon,
  LocationOn as PickupIcon,
  Flag as DropoffIcon,
  CheckCircle as ConfirmIcon,
  ArrowBack as ArrowBackIcon,
  PushPin as PinIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Safe MapsProvider import
let useMapsProviderHook = null;
try {
  const mod = require('../APIProviders/MapsProvider');
  useMapsProviderHook = mod.useMapProvider;
} catch {}

function useSafeMapProvider() {
  try { if (useMapsProviderHook) return useMapsProviderHook(); } catch {}
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// WAZE MODAL
// ─────────────────────────────────────────────────────────────────────────────
export default function WazeMapModal({
  open               = false,
  onClose,
  onLocationSelected,
  initialCenter      = { lat: -15.4167, lng: 28.2833 },
  pickupLocation     = null,
  dropoffLocation    = null,
  countryCode        = null,
}) {
  const mapsProvider = useSafeMapProvider();

  // ── Search state ───────────────────────────────────────────────────────────
  const [query,           setQuery]           = useState('');
  const [predictions,     setPredictions]     = useState([]);
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [searchFocused,   setSearchFocused]   = useState(false);
  const searchTimeout                         = useRef(null);
  const predictionCache                       = useRef({});

  // ── Map state ──────────────────────────────────────────────────────────────
  const [mapCenter,       setMapCenter]       = useState(initialCenter);
  const [mapZoom,         setMapZoom]         = useState(14);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [reverseLoading,  setReverseLoading]  = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setMapCenter(initialCenter);
      setSelectedLocation(null);
      setActionSheetOpen(false);
      setQuery('');
      setPredictions([]);
    }
  }, [open, initialCenter.lat, initialCenter.lng]); // eslint-disable-line

  // ── Waze iframe URL ────────────────────────────────────────────────────────
  const iframeUrl = useMemo(() => {
    const z = Math.min(17, Math.max(3, mapZoom));
    return `https://embed.waze.com/iframe?lat=${mapCenter.lat}&lon=${mapCenter.lng}&zoom=${z}&pin=1`;
  }, [mapCenter.lat, mapCenter.lng, mapZoom]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setPredictions([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    try {
      let results = [];
      if (mapsProvider?.searchPlaces) {
        results = await mapsProvider.searchPlaces(q, countryCode) || [];
        results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
      }
      // Fallback: Nominatim
      if (!results.length) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          results = data.map((item, i) => ({
            place_id:       `nominatim_${item.place_id}_${i}`,
            main_text:      item.name || item.display_name?.split(',')[0],
            secondary_text: item.display_name,
            address:        item.display_name,
            name:           item.name || item.display_name?.split(',')[0],
            lat:            parseFloat(item.lat),
            lng:            parseFloat(item.lon),
          }));
          results.forEach((r) => { predictionCache.current[r.place_id] = r; });
        }
      }
      setPredictions(results);
    } catch (err) {
      console.warn('[WazeMapModal.doSearch] error:', err);
      setPredictions([]);
    } finally {
      setSearchLoading(false);
    }
  }, [mapsProvider, countryCode]);

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(searchTimeout.current);
    if (!v || v.length < 2) { setPredictions([]); return; }
    searchTimeout.current = setTimeout(() => doSearch(v), 280);
  };

  // ── Select a prediction from search ───────────────────────────────────────
  const handleSelectPrediction = useCallback(async (prediction) => {
    setSearchLoading(true);
    setPredictions([]);
    setSearchFocused(false);

    try {
      const cached = predictionCache.current[prediction.place_id] || prediction;
      let location = null;

      if (cached.lat != null && cached.lng != null) {
        location = {
          lat:     cached.lat,
          lng:     cached.lng,
          address: cached.address || cached.secondary_text || cached.main_text,
          name:    cached.name    || cached.main_text,
          placeId: cached.place_id || prediction.place_id,
        };
      } else if (mapsProvider?.getPlaceDetails) {
        const result = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
        if (result) {
          location = {
            lat:     result.lat,
            lng:     result.lng,
            address: result.address,
            name:    result.name || result.address?.split(',')[0],
            placeId: result.place_id || prediction.place_id,
          };
        }
      }

      if (location) {
        setQuery(location.name || location.address);
        setMapCenter({ lat: location.lat, lng: location.lng });
        setMapZoom(16);
        setSelectedLocation(location);
        setActionSheetOpen(true);
      }
    } catch (err) {
      console.warn('[WazeMapModal.handleSelectPrediction] error:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [mapsProvider]);

  // ── Use current GPS location ───────────────────────────────────────────────
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setReverseLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setMapCenter({ lat, lng });
      setMapZoom(16);

      let address = 'Current Location';
      let name    = 'Current Location';

      try {
        if (mapsProvider?.reverseGeocode) {
          const result = await mapsProvider.reverseGeocode(lat, lng);
          if (result) { address = result.address || address; name = result.name || name; }
        } else {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            address = data.display_name || address;
            name    = data.name || data.display_name?.split(',')[0] || name;
          }
        }
      } catch {}

      const location = { lat, lng, address, name, placeId: 'current_location' };
      setQuery(name);
      setSelectedLocation(location);
      setActionSheetOpen(true);
      setReverseLoading(false);
    }, () => setReverseLoading(false));
  }, [mapsProvider]);

  // ── Confirm & fire callback ────────────────────────────────────────────────
  const handleConfirm = useCallback((type = 'general') => {
    if (!selectedLocation) return;
    onLocationSelected?.({ ...selectedLocation, locationType: type });
    onClose?.();
  }, [selectedLocation, onLocationSelected, onClose]);

  if (!open) return null;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      sx={{
        position: 'fixed',
        inset:    0,
        zIndex:   1400,
        display:  'flex',
        flexDirection: 'column',
        bgcolor:  'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        display:        'flex',
        alignItems:     'center',
        gap:            1,
        px:             1.5,
        py:             1,
        bgcolor:        '#08b4e0',
        color:          '#fff',
        boxShadow:      '0 2px 8px rgba(0,0,0,0.18)',
        zIndex:         10,
        flexShrink:     0,
      }}>
        <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small">
          <ArrowBackIcon />
        </IconButton>

        {/* Search input */}
        <Box sx={{
          flex:        1,
          display:     'flex',
          alignItems:  'center',
          bgcolor:     'rgba(255,255,255,0.18)',
          borderRadius: 2,
          px:          1.5,
          py:          0.5,
        }}>
          {searchLoading
            ? <CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} />
            : <SearchIcon sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 20, mr: 1 }} />
          }
          <input
            value={query}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            placeholder="Search for a place…"
            style={{
              flex:        1,
              background:  'transparent',
              border:      'none',
              outline:     'none',
              color:       '#fff',
              fontSize:    15,
              fontWeight:  500,
            }}
          />
          {query ? (
            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.8)', p: 0.25 }}
              onClick={() => { setQuery(''); setPredictions([]); setSelectedLocation(null); setActionSheetOpen(false); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Box>

        <Tooltip title="Use current location">
          <IconButton
            onClick={handleUseCurrentLocation}
            disabled={reverseLoading}
            sx={{ color: '#fff' }}
            size="small"
          >
            {reverseLoading
              ? <CircularProgress size={18} sx={{ color: '#fff' }} />
              : <MyLocationIcon />
            }
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Search dropdown ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {predictions.length > 0 && searchFocused && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position:  'absolute',
              top:       56, // below top bar
              left:      0,
              right:     0,
              zIndex:    1500,
              background: '#fff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.16)',
              maxHeight:  320,
              overflowY: 'auto',
            }}
          >
            {predictions.map((p, idx) => (
              <Box
                key={p.place_id || idx}
                onClick={() => handleSelectPrediction(p)}
                sx={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        1.5,
                  px:         2,
                  py:         1.25,
                  cursor:     'pointer',
                  borderBottom: idx < predictions.length - 1 ? '1px solid #f0f0f0' : 'none',
                  '&:hover':  { bgcolor: '#f5faff' },
                }}
              >
                <PickupIcon sx={{ color: '#08b4e0', fontSize: 20, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {p.main_text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {p.secondary_text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map area ─────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Waze iframe */}
        <iframe
          key={iframeUrl}           // re-mount when URL changes
          src={iframeUrl}
          title="Waze Live Map"
          style={{
            position:   'absolute',
            inset:       0,
            width:      '100%',
            height:     '100%',
            border:     'none',
          }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Center crosshair pin — shows where "current selection" is */}
        <Box sx={{
          position:        'absolute',
          top:             '50%',
          left:            '50%',
          transform:       'translate(-50%, -100%)',
          pointerEvents:   'none',
          zIndex:          5,
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
        }}>
          {/* Shadow dot */}
          <Box sx={{
            width:        14,
            height:       6,
            borderRadius: '50%',
            bgcolor:      'rgba(0,0,0,0.25)',
            mt:           0.5,
            filter:       'blur(2px)',
          }} />
        </Box>

        {/* Selected location badge */}
        <AnimatePresence>
          {selectedLocation && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              sx={{
                position:  'absolute',
                top:       12,
                left:      '50%',
                transform: 'translateX(-50%)',
                zIndex:    6,
                pointerEvents: 'none',
              }}
            >
              <Paper elevation={4} sx={{
                px:          2,
                py:          0.75,
                borderRadius: 6,
                display:     'flex',
                alignItems:  'center',
                gap:         0.75,
                bgcolor:     '#08b4e0',
                color:       '#fff',
                maxWidth:    280,
                whiteSpace:  'nowrap',
                overflow:    'hidden',
              }}>
                <PinIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                <Typography variant="caption" fontWeight={700} noWrap>
                  {selectedLocation.name || selectedLocation.address}
                </Typography>
              </Paper>
            </Box>
          )}
        </AnimatePresence>

        {/* Waze attribution */}
        <Box sx={{
          position:   'absolute',
          bottom:     actionSheetOpen ? 140 : 12,
          right:      12,
          bgcolor:    'rgba(255,255,255,0.9)',
          borderRadius: 1.5,
          px:          1,
          py:          0.5,
          fontSize:   11,
          fontWeight:  700,
          color:       '#08b4e0',
          pointerEvents: 'none',
          boxShadow:   '0 1px 4px rgba(0,0,0,0.15)',
          transition:  'bottom 0.3s ease',
          zIndex:      5,
        }}>
          Powered by Waze
        </Box>
      </Box>

      {/* ── Bottom action sheet ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {actionSheetOpen && selectedLocation && (
          <Box
            component={motion.div}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            sx={{
              position:     'relative',
              bgcolor:      '#fff',
              borderTop:    '1px solid #e8e8e8',
              px:            2,
              pt:            1.5,
              pb:            3,
              flexShrink:    0,
              zIndex:        10,
              boxShadow:    '0 -4px 20px rgba(0,0,0,0.1)',
            }}
          >
            {/* Drag handle */}
            <Box sx={{
              width:        40,
              height:       4,
              borderRadius: 2,
              bgcolor:      '#ddd',
              mx:           'auto',
              mb:           1.5,
            }} />

            {/* Address text */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
              <PickupIcon sx={{ color: '#08b4e0', mt: 0.25, flexShrink: 0 }} />
              <Box>
                <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                  {selectedLocation.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {selectedLocation.address}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PickupIcon />}
                onClick={() => handleConfirm('pickup')}
                fullWidth
                sx={{
                  borderColor: '#22c55e',
                  color:       '#16a34a',
                  fontWeight:  700,
                  '&:hover':   { bgcolor: '#f0fdf4', borderColor: '#16a34a' },
                }}
              >
                Set Pickup
              </Button>

              <Button
                variant="outlined"
                startIcon={<DropoffIcon />}
                onClick={() => handleConfirm('dropoff')}
                fullWidth
                sx={{
                  borderColor: '#ef4444',
                  color:       '#dc2626',
                  fontWeight:  700,
                  '&:hover':   { bgcolor: '#fef2f2', borderColor: '#dc2626' },
                }}
              >
                Set Dropoff
              </Button>

              <Button
                variant="contained"
                startIcon={<ConfirmIcon />}
                onClick={() => handleConfirm('general')}
                sx={{
                  bgcolor:    '#08b4e0',
                  color:      '#fff',
                  fontWeight: 700,
                  flexShrink: 0,
                  '&:hover':  { bgcolor: '#0696bc' },
                }}
              >
                Use
              </Button>
            </Box>
          </Box>
        )}
      </AnimatePresence>

      {/* ── No selection hint ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!actionSheetOpen && !searchFocused && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            sx={{
              py:         2,
              px:         3,
              textAlign:  'center',
              bgcolor:    'rgba(255,255,255,0.96)',
              borderTop:  '1px solid #eee',
              flexShrink: 0,
            }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Search for a place above, or tap the{' '}
              <Box component="span" sx={{ color: '#08b4e0', fontWeight: 700 }}>
                📍
              </Box>
              {' '}location button to use your current position
            </Typography>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}