// PATH: Okra/Okrarides/driver/components/Map/LocationSearch.jsx
//
// Changes from original driver version:
//  1. ListItem `button` prop replaced with component="div" + onClick
//     (MUI v5 deprecation — was causing React DOM warning)
//  2. providerReady guard: skips provider chain on early keystrokes before
//     MapsProvider finishes loading, falls back directly to Nominatim
//  3. Nominatim direct search added as absolute last resort in doSearch
//  All existing props and logic are preserved unchanged.

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress, IconButton, InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon, Clear as ClearIcon,
  LocationOn as LocationIcon, MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

let useMapsProviderHook = null;
try {
  const mod = require('../APIProviders/MapsProvider');
  useMapsProviderHook = mod.useMapProvider;
} catch { /* MapsProvider not in tree */ }

function useSafeMapProvider() {
  try { if (useMapsProviderHook) return useMapsProviderHook(); }
  catch {}
  return null;
}

export const LocationSearch = ({
  onSelectLocation,
  placeholder  = 'Search location',
  autoFocus    = false,
  mapControls,
  value,
  onChange,
  onFocus:  externalOnFocus,
  onBlur:   externalOnBlur,
  countryCode = null,
}) => {
  const [query,       setQuery]       = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [focused,     setFocused]     = useState(false);
  const searchTimeout    = useRef(null);
  const predictionCache  = useRef({});
  const mapsProvider     = useSafeMapProvider();

  // providerReady: skip provider chain until MapsProvider finishes loading
  const providerReady = mapsProvider?.ready ?? true;

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  // ── Nominatim direct search ───────────────────────────────────────────────
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
  const doSearch = useCallback(
    async (q) => {
      if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
      setLoading(true);
      try {
        let results = [];

        // If providers haven't loaded yet, go straight to Nominatim
        if (!providerReady) {
          results = await nominatimSearch(q);
        } else if (mapsProvider?.searchPlaces) {
          results = await mapsProvider.searchPlaces(q, countryCode) || [];
          results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
        }

        if (!results.length && mapControls?.searchLocation) {
          await new Promise((resolve) => {
            mapControls.searchLocation(q, (res) => { results = res || []; resolve(); });
          });
          results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
        }

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
    },
    [mapsProvider, mapControls, countryCode, providerReady, nominatimSearch],
  );

  const handleInputChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange?.(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!v || v.length < 2) { setPredictions([]); return; }
    searchTimeout.current = setTimeout(() => doSearch(v), 300);
  };

  // ── Select prediction ─────────────────────────────────────────────────────
  const handleSelectPrediction = useCallback(
    async (prediction) => {
      setLoading(true);
      try {
        let location = null;
        const cached = predictionCache.current[prediction.place_id] || prediction;

        if (cached.lat != null && cached.lng != null) {
          location = {
            lat:      cached.lat,
            lng:      cached.lng,
            address:  cached.address  || cached.secondary_text || cached.main_text,
            name:     cached.name     || cached.main_text,
            placeId:  cached.place_id || prediction.place_id,
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
        } else if (mapControls?.getPlaceDetails) {
          await new Promise((resolve) => {
            mapControls.getPlaceDetails(prediction.place_id, (result) => {
              if (result) location = result;
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
    },
    [mapsProvider, mapControls, onSelectLocation],
  );

  // ── Current location ──────────────────────────────────────────────────────
  const handleUseCurrentLocation = useCallback(async () => {
    if (mapControls?.getCurrentLocation) {
      mapControls.getCurrentLocation((loc) => {
        if (loc) {
          onSelectLocation({ ...loc, address: 'Current Location', name: 'Current Location', placeId: 'current_location' });
          setQuery('Current Location');
          setPredictions([]);
          setFocused(false);
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
        onSelectLocation(loc);
        setQuery('Current Location');
        setPredictions([]);
        setFocused(false);
      });
    }
  }, [mapControls, onSelectLocation]);

  const handleClear = () => {
    setQuery('');
    onChange?.('');
    setPredictions([]);
  };

  // Shared clickable row style — replaces deprecated `button` prop
  const rowSx = {
    cursor: 'pointer',
    '&:hover': { bgcolor: 'action.hover' },
    '&:active': { bgcolor: 'action.selected' },
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth size="small"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { setFocused(true); externalOnFocus?.(); }}
        onBlur={() => setTimeout(() => { setFocused(false); externalOnBlur?.(); }, 200)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={20} /> : <SearchIcon />}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}><ClearIcon /></IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 2 } }}
      />

      <AnimatePresence>
        {predictions.length > 0 && focused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
          >
            <Paper elevation={4} sx={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              maxHeight: 300, overflow: 'auto', zIndex: 1000, borderRadius: 2,
            }}>
              <List sx={{ py: 1 }}>
                {/* component="div" avoids deprecated MUI `button` prop */}
                <ListItem
                  component="div"
                  onClick={handleUseCurrentLocation}
                  sx={{ ...rowSx, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <ListItemIcon><MyLocationIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="Use Current Location"
                    primaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }}
                  />
                </ListItem>

                {predictions.map((prediction, idx) => (
                  <ListItem
                    key={prediction.place_id || idx}
                    component="div"
                    onClick={() => handleSelectPrediction(prediction)}
                    sx={rowSx}
                  >
                    <ListItemIcon><LocationIcon /></ListItemIcon>
                    <ListItemText
                      primary={prediction.main_text}
                      secondary={prediction.secondary_text}
                      primaryTypographyProps={{ fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default LocationSearch;