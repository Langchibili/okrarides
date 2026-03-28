// export default LocationSearch;
// PATH: Okra/Okrarides/rider/components/Map/LocationSearch.jsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress, IconButton, InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

let useMapsProviderHook = null;
try {
  const mod = require('../APIProviders/MapsProvider');
  useMapsProviderHook = mod.useMapProvider;
} catch { /* MapsProvider not in tree */ }

function useSafeMapProvider() {
  try { if (useMapsProviderHook) return useMapsProviderHook(); } catch {}
  return null;
}

export const LocationSearch = ({
  onSelectLocation,
  placeholder   = 'Search location',
  autoFocus     = false,
  mapControls,
  value,
  onChange,
  onFocus:  externalOnFocus,
  onBlur:   externalOnBlur,
  countryCode = null,
  HandleOnfocus,
  HandleOnBlur,
  displayKey
  
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [query,         setQuery]         = useState(value || '');
  const [predictions,   setPredictions]   = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [focused,       setFocused]       = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const [mounted,       setMounted]       = useState(false);

  const containerRef    = useRef(null);
  const searchTimeout   = useRef(null);
  const predictionCache = useRef({});
  const mapsProvider    = useSafeMapProvider();

  // `ready` tells us whether provider config has finished loading.
  // When false we skip the provider chain and go straight to Nominatim so the
  // user never sees a spinner that never resolves.
  const providerReady = mapsProvider?.ready ?? true;

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (value !== undefined) setQuery(value); }, [value]);

  // ── Measure dropdown position ─────────────────────────────────────────────
  const measureDropdown = useCallback(() => {
    if (!containerRef.current) return;
    const rect   = containerRef.current.getBoundingClientRect();
    const gap    = 4;
    const margin = 8;
    setDropdownStyle({
      position: 'fixed',
      top:      rect.bottom + gap,
      left:     margin,
      right:    margin,
      width:    `calc(100vw - ${margin * 2}px)`,
      height:   `calc(100vh - ${rect.bottom + gap + margin}px)`,
      zIndex:   9999,
    });
  }, []);

  // ── Nominatim direct search (used when providers not ready / all fail) ────
  const nominatimSearch = useCallback(async (q) => {
    if (!q || q.length < 2) return [];
    try {
      const params = new URLSearchParams({
        q, format: 'json', limit: '7', addressdetails: '1',
        ...(countryCode ? { countrycodes: countryCode } : {}),
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'Accept-Language': 'en' },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((item) => ({
        place_id:       item.place_id?.toString(),
        main_text:      item.name || item.display_name?.split(',')[0],
        secondary_text: item.display_name,
        lat:            parseFloat(item.lat),
        lng:            parseFloat(item.lon),
        address:        item.display_name,
        name:           item.name || item.display_name?.split(',')[0],
      }));
    } catch { return []; }
  }, [countryCode]);

  // ── Search ────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
    setLoading(true);

    try {
      let results = [];

      // If providers haven't finished loading yet, skip straight to Nominatim
      // so the user gets results immediately rather than seeing failures.
      if (!providerReady) {
        results = await nominatimSearch(q);
      } else if (mapsProvider?.searchPlaces) {
        results = await mapsProvider.searchPlaces(q, countryCode) || [];
        results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
      }

      // Final fallback: mapControls (IframeMap Nominatim bridge)
      if (!results.length && mapControls?.searchLocation) {
        await new Promise((resolve) => {
          mapControls.searchLocation(q, (res) => { results = res || []; resolve(); });
        });
        results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
      }

      // Absolute last resort — direct Nominatim from here
      if (!results.length) {
        results = await nominatimSearch(q);
      }

      setPredictions(results);
    } catch (err) {
      console.warn('[LocationSearch] search error:', err);
      const fallback = await nominatimSearch(q);
      setPredictions(fallback);
    } finally {
      setLoading(false);
    }
  }, [mapsProvider, mapControls, countryCode, providerReady, nominatimSearch]);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setQuery(v); onChange?.(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!v || v.length < 2) { setPredictions([]); return; }
    searchTimeout.current = setTimeout(() => doSearch(v), 300);
  };

  // ── Select prediction ─────────────────────────────────────────────────────
  const handleSelectPrediction = useCallback(async (prediction) => {
    setLoading(true);
    try {
      let location = null;
      const cached = predictionCache.current[prediction.place_id] || prediction;

      if (cached.lat != null && cached.lng != null) {
        location = {
          lat:     cached.lat,
          lng:     cached.lng,
          address: cached.address || cached.secondary_text || cached.main_text,
          name:    cached.name    || cached.main_text,
          placeId: cached.place_id || prediction.place_id,
        }
        console.log('[LocationSearch] raw cached:', JSON.stringify(cached, null, 2));
  console.log('[LocationSearch] built location:', JSON.stringify(location, null, 2));
      } else if (mapsProvider?.getPlaceDetails) {
        // const r = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
        // if (r) location = {
        //   lat: r.lat, lng: r.lng,
        //   address: r.address,
        //   name:    r.name || r.address?.split(',')[0],
        //   placeId: r.place_id || prediction.place_id,
        // };

  const r = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
  if (r) location = {
    lat: r.lat,
    lng: r.lng,
    // ── Use the prediction's name/address, not getPlaceDetails' response ──
    address: cached.address || cached.secondary_text || cached.main_text || r.address,
    name:    cached.name    || cached.main_text       || r.name,
    placeId: r.place_id || prediction.place_id,
  };
      } else if (mapControls?.getPlaceDetails) {
  await new Promise((resolve) => {
    mapControls.getPlaceDetails(prediction.place_id, (r) => {
      if (r) location = {
        ...r,
        address: cached.address || cached.secondary_text || cached.main_text || r.address,
        name:    cached.name    || cached.main_text       || r.name,
      };
      resolve();
    });
  });
}

      if (location) {
        onSelectLocation(location);
        setQuery(location.address || location.name);
        setPredictions([]);
        setFocused(false);
        }
    } catch (err) {
      console.warn('[LocationSearch] getPlaceDetails error:', err);
    } finally {
      setLoading(false);
    }
  }, [mapsProvider, mapControls, onSelectLocation]);

  // ── Current location ──────────────────────────────────────────────────────
  const handleUseCurrentLocation = useCallback(async () => {
    if (mapControls?.getCurrentLocation) {
      mapControls.getCurrentLocation((loc) => {
        if (loc) {
          onSelectLocation({ ...loc, address: 'Current Location', name: 'Current Location', placeId: 'current_location' });
          setQuery('Current Location'); setPredictions([]); setFocused(false);
        }
      });
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          address: 'Current Location', name: 'Current Location', placeId: 'current_location',
        };
        onSelectLocation(loc); setQuery('Current Location'); setPredictions([]); setFocused(false);
      });
    }
  }, [mapControls, onSelectLocation]);

  const handleClear = () => { setQuery(''); onChange?.(''); setPredictions([]); };

  // ── Lock body scroll when dropdown open ───────────────────────────────────
  useEffect(() => {
    if (focused && predictions.length > 0) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [focused, predictions.length]);

  useEffect(() => {
    if (focused) measureDropdown();
  }, [focused, predictions, measureDropdown]);

  const showDropdown = mounted && focused && predictions.length > 0 && dropdownStyle;

  // ── Theme-aware values ────────────────────────────────────────────────────
  const dropdownShadow  = isDark
    ? '0 8px 40px rgba(0,0,0,0.65), 0 2px 12px rgba(0,0,0,0.4)'
    : '0 8px 40px rgba(0,0,0,0.20)';
  const currentLocHover = isDark ? 'rgba(255,193,7,0.12)' : 'rgba(255,193,7,0.08)';
  const paperBg         = theme.palette.background.paper;

  // ── Shared clickable row style ────────────────────────────────────────────
  // Using `component="div"` on ListItem avoids the deprecated `button` prop
  // while preserving the MUI ripple via the sx `cursor` + hover bg pattern.
  const rowSx = {
    cursor: 'pointer',
    '&:hover': { bgcolor: 'action.hover' },
    '&:active': { bgcolor: 'action.selected' },
  };

  const dropdown = showDropdown ? createPortal(
    <AnimatePresence>
      <motion.div
        key="loc-dropdown"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
        style={{ ...dropdownStyle, display: 'flex', flexDirection: 'column' }}
      >
        <Paper
          elevation={12}
          sx={{
            flex: 1, display: 'flex', flexDirection: 'column',
            borderRadius: 2.5, overflow: 'hidden',
            bgcolor: paperBg, boxShadow: dropdownShadow,
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}
        >
          <List
            sx={{
              py: 0.5, flex: 1, overflowY: 'auto', overflowX: 'hidden',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {/* ── Use current location row ── */}
            {/* component="div" avoids the deprecated `button` prop on ListItem */}
            <ListItem
              component="div"
              onClick={handleUseCurrentLocation}
              sx={{
                ...rowSx,
                py: 1.25,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: currentLocHover },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <MyLocationIcon color="primary" sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Use Current Location"
                primaryTypographyProps={{ fontWeight: 700, color: 'primary.main', fontSize: '0.9rem' }}
              />
            </ListItem>

            {predictions.map((pred, idx) => (
              <ListItem
                key={pred.place_id || idx}
                component="div"
                onClick={() => handleSelectPrediction(pred)}
                sx={{ ...rowSx, py: 1}}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText
                  primary={pred.main_text}
                  secondary={pred.secondary_text}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: '0.88rem', noWrap: true }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', noWrap: true }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </motion.div>
    </AnimatePresence>,
    document.body,
  ) : null;

  return (
    // Container Box — add minWidth: 0 and overflow: hidden
<Box
  ref={containerRef}
  sx={{
    position: 'relative',
    width: '100%',
    minWidth: 0,          // ← prevents flex item from blowing past its track
    overflow: 'hidden',   // ← hard clamp, nothing escapes the box
    boxSizing: 'border-box',
  }}
>
  <TextField
    key={displayKey}
    fullWidth
    size="small"
    value={query}
    onChange={handleInputChange}
    onFocus={() => { HandleOnfocus(); setFocused(true); measureDropdown(); externalOnFocus?.(); }}
    onBlur={() => setTimeout(() => { HandleOnBlur(); setFocused(false); externalOnBlur?.(); }, 200)}
    placeholder={placeholder}
    autoFocus={autoFocus}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          {loading
            ? <CircularProgress size={16} />
            : <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
        </InputAdornment>
      ),
      endAdornment: query ? (
        <InputAdornment position="end">
          <IconButton size="small" onClick={handleClear} sx={{ p: 0.25 }}>
            <ClearIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </InputAdornment>
      ) : null,
    }}
    sx={{
      // Remove the explicit width/maxWidth — fullWidth + container already handle it
      '& .MuiOutlinedInput-root': {
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxSizing: 'border-box', // ← border thickening on focus won't shift layout
      },
    }}
  />
  {dropdown}
</Box>
  )
};

export default LocationSearch;