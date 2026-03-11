// // PATH: Okra/Okrarides/rider/components/Map/LocationSearch.jsx
// 'use client';

// import { useState, useRef, useEffect, useCallback } from 'react';
// import {
//   Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText,
//   CircularProgress, IconButton, InputAdornment,
// } from '@mui/material';
// import { Search as SearchIcon, Clear as ClearIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
// import { createPortal } from 'react-dom';
// import { motion, AnimatePresence } from 'framer-motion';

// let useMapsProviderHook = null;
// try {
//   const mod = require('../APIProviders/MapsProvider');
//   useMapsProviderHook = mod.useMapProvider;
// } catch { /* MapsProvider not in tree */ }

// function useSafeMapProvider() {
//   try { if (useMapsProviderHook) return useMapsProviderHook(); } catch { /* not inside MapsProvider */ }
//   return null;
// }

// export const LocationSearch = ({
//   onSelectLocation, placeholder = 'Search location', autoFocus = false,
//   mapControls, value, onChange,
//   onFocus: externalOnFocus, onBlur: externalOnBlur,
//   countryCode = null,
// }) => {
//   const [query,         setQuery]         = useState(value || '');
//   const [predictions,   setPredictions]   = useState([]);
//   const [loading,       setLoading]       = useState(false);
//   const [focused,       setFocused]       = useState(false);
//   const [dropdownStyle, setDropdownStyle] = useState(null);
//   const [mounted,       setMounted]       = useState(false);

//   const containerRef    = useRef(null);
//   const searchTimeout   = useRef(null);
//   const predictionCache = useRef({});
//   const mapsProvider    = useSafeMapProvider();

//   useEffect(() => { setMounted(true); }, []);
//   useEffect(() => { if (value !== undefined) setQuery(value); }, [value]);

//   // ── Measure dropdown position ──────────────────────────────────────────────
//   // The dropdown is a portal on document.body, positioned fixed below the input.
//   // Width = 100vw (full screen minus small margin) so it always readable.
//   // Height = remaining viewport from input bottom to screen bottom.
//   const measureDropdown = useCallback(() => {
//     if (!containerRef.current) return;
//     const rect = containerRef.current.getBoundingClientRect();
//     const gap = 4;
//     const margin = 8;
//     setDropdownStyle({
//       position: 'fixed',
//       top: rect.bottom + gap,
//       left: margin,
//       right: margin,
//       width: `calc(100vw - ${margin * 2}px)`,
//       // Fill all remaining space below the input — no fixed max-height
//       height: `calc(100vh - ${rect.bottom + gap + margin}px)`,
//       zIndex: 9999,
//     });
//   }, []);

//   // ── Search ─────────────────────────────────────────────────────────────────
//   const doSearch = useCallback(async (q) => {
//     if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
//     setLoading(true);
//     try {
//       let results = [];
//       if (mapsProvider?.searchPlaces) {
//         results = await mapsProvider.searchPlaces(q, countryCode) || [];
//         results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
//       }
//       if (!results.length && mapControls?.searchLocation) {
//         await new Promise((resolve) => {
//           mapControls.searchLocation(q, (res) => { results = res || []; resolve(); });
//         });
//         results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
//       }
//       setPredictions(results);
//     } catch (err) {
//       console.warn('[LocationSearch] search error:', err);
//       setPredictions([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [mapsProvider, mapControls, countryCode]);

//   const handleInputChange = (e) => {
//     const v = e.target.value;
//     setQuery(v); onChange?.(v);
//     if (searchTimeout.current) clearTimeout(searchTimeout.current);
//     if (!v || v.length < 2) { setPredictions([]); return; }
//     searchTimeout.current = setTimeout(() => doSearch(v), 300);
//   };

//   // ── Select prediction ──────────────────────────────────────────────────────
//   const handleSelectPrediction = useCallback(async (prediction) => {
//     setLoading(true);
//     try {
//       let location = null;
//       const cached = predictionCache.current[prediction.place_id] || prediction;
//       if (cached.lat != null && cached.lng != null) {
//         location = { lat: cached.lat, lng: cached.lng, address: cached.address || cached.secondary_text || cached.main_text, name: cached.name || cached.main_text, placeId: cached.place_id || prediction.place_id };
//       } else if (mapsProvider?.getPlaceDetails) {
//         const r = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
//         if (r) location = { lat: r.lat, lng: r.lng, address: r.address, name: r.name || r.address?.split(',')[0], placeId: r.place_id || prediction.place_id };
//       } else if (mapControls?.getPlaceDetails) {
//         await new Promise((resolve) => {
//           mapControls.getPlaceDetails(prediction.place_id, (r) => { if (r) location = r; resolve(); });
//         });
//       }
//       if (location) {
//         onSelectLocation(location);
//         setQuery(location.address || location.name);
//         setPredictions([]);
//         setFocused(false);
//       }
//     } catch (err) {
//       console.warn('[LocationSearch] getPlaceDetails error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [mapsProvider, mapControls, onSelectLocation]);

//   // ── Current location ───────────────────────────────────────────────────────
//   const handleUseCurrentLocation = useCallback(async () => {
//     if (mapControls?.getCurrentLocation) {
//       mapControls.getCurrentLocation((loc) => {
//         if (loc) { onSelectLocation({ ...loc, address: 'Current Location', name: 'Current Location', placeId: 'current_location' }); setQuery('Current Location'); setPredictions([]); setFocused(false); }
//       });
//       return;
//     }
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition((pos) => {
//         const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Current Location', name: 'Current Location', placeId: 'current_location' };
//         onSelectLocation(loc); setQuery('Current Location'); setPredictions([]); setFocused(false);
//       });
//     }
//   }, [mapControls, onSelectLocation]);

//   const handleClear = () => { setQuery(''); onChange?.(''); setPredictions([]); };

//   // Re-measure on every relevant change so position stays correct after scroll/resize
//   useEffect(() => {
//     if (focused) measureDropdown();
//   }, [focused, predictions, measureDropdown]);

//   const showDropdown = mounted && focused && predictions.length > 0 && dropdownStyle;

//   const dropdown = showDropdown ? createPortal(
//     <AnimatePresence>
//       <motion.div
//         key="loc-dropdown"
//         initial={{ opacity: 0, y: -6 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: -6 }}
//         transition={{ duration: 0.15 }}
//         style={{
//           ...dropdownStyle,
//           // The outer div fills the remaining screen height.
//           // The Paper inside scrolls — no scrollbar shown.
//           display: 'flex',
//           flexDirection: 'column',
//         }}
//       >
//         <Paper
//           elevation={12}
//           sx={{
//             flex: 1,
//             display: 'flex',
//             flexDirection: 'column',
//             borderRadius: 2.5,
//             overflow: 'hidden',
//             boxShadow: '0 8px 40px rgba(0,0,0,0.20)',
//           }}
//         >
//           <List
//             sx={{
//               py: 0.5,
//               flex: 1,
//               overflowY: 'auto',
//               overflowX: 'hidden',
//               // Hide scrollbar but keep scrollable
//               scrollbarWidth: 'none',
//               msOverflowStyle: 'none',
//               '&::-webkit-scrollbar': { display: 'none' },
//             }}
//           >
//             {/* Use current location */}
//             <ListItem
//               button onClick={handleUseCurrentLocation}
//               sx={{ py: 1.25, '&:hover': { bgcolor: 'rgba(255,193,7,0.08)' }, '&:focus': { outline: 'none', bgcolor: 'rgba(255,193,7,0.08)' } }}
//             >
//               <ListItemIcon sx={{ minWidth: 36 }}>
//                 <MyLocationIcon color="primary" sx={{ fontSize: 20 }} />
//               </ListItemIcon>
//               <ListItemText
//                 primary="Use Current Location"
//                 primaryTypographyProps={{ fontWeight: 700, color: 'primary.main', fontSize: '0.9rem' }}
//               />
//             </ListItem>

//             {predictions.map((pred, idx) => (
//               <ListItem
//                 key={pred.place_id || idx}
//                 button
//                 onClick={() => handleSelectPrediction(pred)}
//                 sx={{ py: 1, '&:hover': { bgcolor: 'action.hover' }, '&:focus': { outline: 'none' } }}
//               >
//                 <ListItemIcon sx={{ minWidth: 36 }}>
//                   <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
//                 </ListItemIcon>
//                 <ListItemText
//                   primary={pred.main_text}
//                   secondary={pred.secondary_text}
//                   primaryTypographyProps={{ fontWeight: 500, fontSize: '0.88rem', noWrap: true }}
//                   secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', noWrap: true }}
//                 />
//               </ListItem>
//             ))}
//           </List>
//         </Paper>
//       </motion.div>
//     </AnimatePresence>,
//     document.body
//   ) : null;

//   return (
//     <Box
//       ref={containerRef}
//       sx={{
//         position: 'relative',
//         width: '100%',
//         maxWidth: '100%',
//         boxSizing: 'border-box',
//       }}
//     >
//       <TextField
//         fullWidth size="small"
//         value={query}
//         onChange={handleInputChange}
//         onFocus={() => {
//           setFocused(true);
//           measureDropdown();
//           externalOnFocus?.();
//         }}
//         onBlur={() => setTimeout(() => { setFocused(false); externalOnBlur?.(); }, 200)}
//         placeholder={placeholder}
//         autoFocus={autoFocus}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment position="start">
//               {loading ? <CircularProgress size={16} /> : <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
//             </InputAdornment>
//           ),
//           endAdornment: query ? (
//             <InputAdornment position="end">
//               <IconButton size="small" onClick={handleClear} sx={{ p: 0.25, '&:focus': { outline: 'none' } }}>
//                 <ClearIcon sx={{ fontSize: 15 }} />
//               </IconButton>
//             </InputAdornment>
//           ) : null,
//         }}
//         sx={{
//           '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 2 },
//           '& .MuiInputBase-root:focus-within': { outline: 'none' },
//           width: '100%',
//           maxWidth: '100%',
//           boxSizing: 'border-box',
//         }}
//       />
//       {dropdown}
//     </Box>
//   );
// };

// export default LocationSearch;
// PATH: Okra/Okrarides/rider/components/Map/LocationSearch.jsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress, IconButton, InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, LocationOn as LocationIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

let useMapsProviderHook = null;
try {
  const mod = require('../APIProviders/MapsProvider');
  useMapsProviderHook = mod.useMapProvider;
} catch { /* MapsProvider not in tree */ }

function useSafeMapProvider() {
  try { if (useMapsProviderHook) return useMapsProviderHook(); } catch { /* not inside MapsProvider */ }
  return null;
}

export const LocationSearch = ({
  onSelectLocation, placeholder = 'Search location', autoFocus = false,
  mapControls, value, onChange,
  onFocus: externalOnFocus, onBlur: externalOnBlur,
  countryCode = null,
}) => {
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

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (value !== undefined) setQuery(value); }, [value]);

  // ── Measure dropdown position ──────────────────────────────────────────────
  // The dropdown is a portal on document.body, positioned fixed below the input.
  // Width = 100vw (full screen minus small margin) so it always readable.
  // Height = remaining viewport from input bottom to screen bottom.
  const measureDropdown = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const gap = 4;
    const margin = 8;
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + gap,
      left: margin,
      right: margin,
      width: `calc(100vw - ${margin * 2}px)`,
      // Fill all remaining space below the input — no fixed max-height
      height: `calc(100vh - ${rect.bottom + gap + margin}px)`,
      zIndex: 9999,
    });
  }, []);

  // ── Search ─────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
    setLoading(true);
    try {
      let results = [];
      if (mapsProvider?.searchPlaces) {
        results = await mapsProvider.searchPlaces(q, countryCode) || [];
        results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
      }
      if (!results.length && mapControls?.searchLocation) {
        await new Promise((resolve) => {
          mapControls.searchLocation(q, (res) => { results = res || []; resolve(); });
        });
        results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
      }
      setPredictions(results);
    } catch (err) {
      console.warn('[LocationSearch] search error:', err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [mapsProvider, mapControls, countryCode]);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setQuery(v); onChange?.(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!v || v.length < 2) { setPredictions([]); return; }
    searchTimeout.current = setTimeout(() => doSearch(v), 300);
  };

  // ── Select prediction ──────────────────────────────────────────────────────
  const handleSelectPrediction = useCallback(async (prediction) => {
    setLoading(true);
    try {
      let location = null;
      const cached = predictionCache.current[prediction.place_id] || prediction;
      if (cached.lat != null && cached.lng != null) {
        location = { lat: cached.lat, lng: cached.lng, address: cached.address || cached.secondary_text || cached.main_text, name: cached.name || cached.main_text, placeId: cached.place_id || prediction.place_id };
      } else if (mapsProvider?.getPlaceDetails) {
        const r = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
        if (r) location = { lat: r.lat, lng: r.lng, address: r.address, name: r.name || r.address?.split(',')[0], placeId: r.place_id || prediction.place_id };
      } else if (mapControls?.getPlaceDetails) {
        await new Promise((resolve) => {
          mapControls.getPlaceDetails(prediction.place_id, (r) => { if (r) location = r; resolve(); });
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

  // ── Current location ───────────────────────────────────────────────────────
  const handleUseCurrentLocation = useCallback(async () => {
    if (mapControls?.getCurrentLocation) {
      mapControls.getCurrentLocation((loc) => {
        if (loc) { onSelectLocation({ ...loc, address: 'Current Location', name: 'Current Location', placeId: 'current_location' }); setQuery('Current Location'); setPredictions([]); setFocused(false); }
      });
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Current Location', name: 'Current Location', placeId: 'current_location' };
        onSelectLocation(loc); setQuery('Current Location'); setPredictions([]); setFocused(false);
      });
    }
  }, [mapControls, onSelectLocation]);

  const handleClear = () => { setQuery(''); onChange?.(''); setPredictions([]); };

  // ── Lock body scroll when dropdown is open (prevents scrollbar-induced layout shift) ──
  useEffect(() => {
    if (focused && predictions.length > 0) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [focused, predictions.length]);

  // Re-measure on every relevant change so position stays correct after scroll/resize
  useEffect(() => {
    if (focused) measureDropdown();
  }, [focused, predictions, measureDropdown]);

  const showDropdown = mounted && focused && predictions.length > 0 && dropdownStyle;

  const dropdown = showDropdown ? createPortal(
    <AnimatePresence>
      <motion.div
        key="loc-dropdown"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
        style={{
          ...dropdownStyle,
          // The outer div fills the remaining screen height.
          // The Paper inside scrolls — no scrollbar shown.
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Paper
          elevation={12}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2.5,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.20)',
          }}
        >
          <List
            sx={{
              py: 0.5,
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              // Hide scrollbar but keep scrollable
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {/* Use current location */}
            <ListItem
              button onClick={handleUseCurrentLocation}
              sx={{ py: 1.25, '&:hover': { bgcolor: 'rgba(255,193,7,0.08)' }, '&:focus': { outline: 'none', bgcolor: 'rgba(255,193,7,0.08)' } }}
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
                button
                onClick={() => handleSelectPrediction(pred)}
                sx={{ py: 1, '&:hover': { bgcolor: 'action.hover' }, '&:focus': { outline: 'none' } }}
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
    document.body
  ) : null;

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <TextField
        fullWidth size="small"
        value={query}
        onChange={handleInputChange}
        onFocus={() => {
          setFocused(true);
          measureDropdown();
          externalOnFocus?.();
        }}
        onBlur={() => setTimeout(() => { setFocused(false); externalOnBlur?.(); }, 200)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={16} /> : <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear} sx={{ p: 0.25, '&:focus': { outline: 'none' } }}>
                <ClearIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        sx={{
          '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 2 },
          '& .MuiInputBase-root:focus-within': { outline: 'none' },
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      />
      {dropdown}
    </Box>
  );
};

export default LocationSearch;