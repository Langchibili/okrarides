// // PATH: Okra/Okrarides/rider/components/Map/LocationSearch.jsx
// 'use client';

// import { useState, useRef, useEffect, useCallback } from 'react';
// import {
//   Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText,
//   CircularProgress, IconButton, InputAdornment,
// } from '@mui/material';
// import { useTheme } from '@mui/material/styles';
// import {
//   Search as SearchIcon,
//   Clear as ClearIcon,
//   LocationOn as LocationIcon,
//   MyLocation as MyLocationIcon,
// } from '@mui/icons-material';
// import { createPortal } from 'react-dom';
// import { motion, AnimatePresence } from 'framer-motion';

// let useMapsProviderHook = null;
// try {
//   const mod = require('../APIProviders/MapsProvider');
//   useMapsProviderHook = mod.useMapProvider;
// } catch { /* MapsProvider not in tree */ }

// function useSafeMapProvider() {
//   try { if (useMapsProviderHook) return useMapsProviderHook(); } catch {}
//   return null;
// }

// // ── Read saved geolocation from localStorage ──────────────────────────────────
// function readSavedGeoLoc() {
//   if (typeof window === 'undefined') return null;
//   try {
//     if (localStorage.getItem('geo_loc_status') !== 'success') return null;
//     const geo = JSON.parse(localStorage.getItem('geo_loc_data') || 'null');
//     if (geo?.lat != null && geo?.lng != null) return geo;
//   } catch {}
//   return null;
// }

// export const LocationSearch = ({
//   onSelectLocation,
//   placeholder   = 'Search location',
//   autoFocus     = false,
//   mapControls,
//   value,
//   onChange,
//   onFocus:  externalOnFocus,
//   onBlur:   externalOnBlur,
//   countryCode = null,
//   HandleOnfocus,
//   HandleOnBlur,
//   displayKey,
// }) => {
//   const theme = useTheme();
//   const isDark = theme.palette.mode === 'dark';

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

//   const providerReady = mapsProvider?.ready ?? true;

//   useEffect(() => { setMounted(true); }, []);
//   useEffect(() => { if (value !== undefined) setQuery(value); }, [value]);

//   // ── Measure dropdown position ─────────────────────────────────────────────
//   const measureDropdown = useCallback(() => {
//     if (!containerRef.current) return;
//     const rect   = containerRef.current.getBoundingClientRect();
//     const gap    = 4;
//     const margin = 8;
//     setDropdownStyle({
//       position: 'fixed',
//       top:      rect.bottom + gap,
//       left:     margin,
//       right:    margin,
//       width:    `calc(100vw - ${margin * 2}px)`,
//       height:   `calc(100vh - ${rect.bottom + gap + margin}px)`,
//       zIndex:   9999,
//     });
//   }, []);

//   // ── Nominatim search — geo-biased, limit 10 ───────────────────────────────
//   const nominatimSearch = useCallback(async (q) => {
//     if (!q || q.length < 2) return [];
//     try {
//       let viewboxParam = {};
//       const geo = readSavedGeoLoc();
//       if (geo) {
//         const delta = 0.5;
//         viewboxParam = {
//           viewbox: `${geo.lng - delta},${geo.lat + delta},${geo.lng + delta},${geo.lat - delta}`,
//           bounded: '0',
//         };
//       }

//       const params = new URLSearchParams({
//         q,
//         format:         'json',
//         limit:          '10',
//         addressdetails: '1',
//         ...viewboxParam,
//         ...(countryCode ? { countrycodes: countryCode } : {}),
//       });

//       const res = await fetch(
//         `https://nominatim.openstreetmap.org/search?${params}`,
//         { headers: { 'Accept-Language': 'en' } },
//       );
//       if (!res.ok) return [];

//       const data    = await res.json();
//       const results = data.map((item) => ({
//         place_id:       item.place_id?.toString(),
//         main_text:      item.name || item.display_name?.split(',')[0],
//         secondary_text: item.display_name,
//         lat:            parseFloat(item.lat),
//         lng:            parseFloat(item.lon),
//         address:        item.display_name,
//         name:           item.name || item.display_name?.split(',')[0],
//       }));

//       results.sort((a, b) => {
//         const aNum = /\d/.test(a.main_text) ? 0 : 1;
//         const bNum = /\d/.test(b.main_text) ? 0 : 1;
//         return aNum - bNum;
//       });

//       return results;
//     } catch { return []; }
//   }, [countryCode]);

//   // ── Search ────────────────────────────────────────────────────────────────
//   const doSearch = useCallback(async (q) => {
//     if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
//     setLoading(true);

//     try {
//       let results = [];

//       if (!providerReady) {
//         results = await nominatimSearch(q);
//       } else if (mapsProvider?.searchPlaces) {
//         results = await mapsProvider.searchPlaces(q, countryCode) || [];
//         results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
//       }

//       if (!results.length && mapControls?.searchLocation) {
//         await new Promise((resolve) => {
//           mapControls.searchLocation(q, (res) => { results = res || []; resolve(); });
//         });
//         results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
//       }

//       if (!results.length) {
//         results = await nominatimSearch(q);
//       }

//       setPredictions(results);
//     } catch (err) {
//       console.warn('[LocationSearch] search error:', err);
//       const fallback = await nominatimSearch(q);
//       setPredictions(fallback);
//     } finally {
//       setLoading(false);
//     }
//   }, [mapsProvider, mapControls, countryCode, providerReady, nominatimSearch]);

//   const handleInputChange = (e) => {
//     const v = e.target.value;
//     setQuery(v); onChange?.(v);
//     if (searchTimeout.current) clearTimeout(searchTimeout.current);
//     if (!v || v.length < 2) { setPredictions([]); return; }
//     searchTimeout.current = setTimeout(() => doSearch(v), 300);
//   };

//   // ── Select prediction ─────────────────────────────────────────────────────
//   //
//   // For Yandex GeoSuggest results (and any suggest-only source), results
//   // arrive WITHOUT coordinates.  The flow is:
//   //
//   //   1. User picks an entry  →  display its title optimistically in the input
//   //      and close the dropdown immediately (responsive feel).
//   //   2. Call getPlaceDetails(place_id, cached) to resolve lat/lng via Geocoder.
//   //      • If place_id is a Yandex URI (ymapsbm1://…) the geocoder uses &uri=
//   //      • Otherwise it geocodes the formatted address text.
//   //   3. Fire onSelectLocation with the complete location object.
//   //
//   // For results that already carry lat/lng (Nominatim, biz results from
//   // GeoSuggest) we skip step 2 and go straight to step 3.
//   // ─────────────────────────────────────────────────────────────────────────

//   const handleSelectPrediction = useCallback(async (prediction) => {
//     // ── Optimistic UI: close dropdown and show entry title right away ──────
//     const displayTitle = prediction.main_text || prediction.address || prediction.name || '';
//     setQuery(displayTitle);
//     setPredictions([]);
//     setFocused(false);
//     setLoading(true);

//     try {
//       let location = null;
//       const cached = predictionCache.current[prediction.place_id] || prediction;

//       // ── Fast path: coords already present ─────────────────────────────
//       if (cached.lat != null && cached.lng != null) {
//         location = {
//           lat:     cached.lat,
//           lng:     cached.lng,
//           address: cached.address || cached.secondary_text || cached.main_text,
//           name:    cached.name    || cached.main_text,
//           placeId: cached.place_id || prediction.place_id,
//         };
//       }

//       // ── Slow path: resolve via Geocoder (Yandex suggest, no-coord results) ─
//       else if (mapsProvider?.getPlaceDetails) {
//         // place_id for Yandex GeoSuggest = ymapsbm1:// URI → Geocoder uses &uri=
//         // place_id for legacy suggest     = text-based id  → Geocoder uses &geocode=
//         const r = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
//         if (r) {
//           location = {
//             lat:     r.lat,
//             lng:     r.lng,
//             // Prefer the original suggestion's label for display consistency
//             address: cached.address || cached.secondary_text || cached.main_text || r.address,
//             name:    cached.name    || cached.main_text       || r.name,
//             placeId: r.place_id || prediction.place_id,
//           };
//         }
//       }

//       // ── mapControls fallback (IframeMap bridge) ────────────────────────
//       else if (mapControls?.getPlaceDetails) {
//         await new Promise((resolve) => {
//           mapControls.getPlaceDetails(prediction.place_id, (r) => {
//             if (r) location = {
//               ...r,
//               address: cached.address || cached.secondary_text || cached.main_text || r.address,
//               name:    cached.name    || cached.main_text       || r.name,
//             };
//             resolve();
//           });
//         });
//       }

//       if (location) {
//         onSelectLocation(location);
//         // Update input to the full resolved address (may differ from optimistic title)
//         setQuery(location.address || location.name);
//       } else {
//         // Resolution failed — revert input to what user was typing
//         console.warn('[LocationSearch] could not resolve location for:', prediction.main_text);
//         setQuery(displayTitle);
//       }
//     } catch (err) {
//       console.warn('[LocationSearch] getPlaceDetails error:', err);
//       setQuery(displayTitle);
//     } finally {
//       setLoading(false);
//     }
//   }, [mapsProvider, mapControls, onSelectLocation]);

//   // ── Current location ──────────────────────────────────────────────────────
//   const handleUseCurrentLocation = useCallback(async () => {
//     if (mapControls?.getCurrentLocation) {
//       mapControls.getCurrentLocation((loc) => {
//         if (loc) {
//           onSelectLocation({ ...loc, address: 'Current Location', name: 'Current Location', placeId: 'current_location' });
//           setQuery('Current Location'); setPredictions([]); setFocused(false);
//         }
//       });
//       return;
//     }
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition((pos) => {
//         const loc = {
//           lat: pos.coords.latitude, lng: pos.coords.longitude,
//           address: 'Current Location', name: 'Current Location', placeId: 'current_location',
//         };
//         onSelectLocation(loc); setQuery('Current Location'); setPredictions([]); setFocused(false);
//       });
//     }
//   }, [mapControls, onSelectLocation]);

//   const handleClear = () => { setQuery(''); onChange?.(''); setPredictions([]); };

//   // ── Lock body scroll when dropdown open ───────────────────────────────────
//   useEffect(() => {
//     if (focused && predictions.length > 0) {
//       const prev = document.body.style.overflow;
//       document.body.style.overflow = 'hidden';
//       return () => { document.body.style.overflow = prev; };
//     }
//   }, [focused, predictions.length]);

//   useEffect(() => {
//     if (focused) measureDropdown();
//   }, [focused, predictions, measureDropdown]);

//   const showDropdown = mounted && focused && predictions.length > 0 && dropdownStyle;

//   // ── Theme-aware values ────────────────────────────────────────────────────
//   const dropdownShadow  = isDark
//     ? '0 8px 40px rgba(0,0,0,0.65), 0 2px 12px rgba(0,0,0,0.4)'
//     : '0 8px 40px rgba(0,0,0,0.20)';
//   const currentLocHover = isDark ? 'rgba(255,193,7,0.12)' : 'rgba(255,193,7,0.08)';
//   const paperBg         = theme.palette.background.paper;

//   const rowSx = {
//     cursor: 'pointer',
//     '&:hover':  { bgcolor: 'action.hover' },
//     '&:active': { bgcolor: 'action.selected' },
//   };

//   const dropdown = showDropdown ? createPortal(
//     <AnimatePresence>
//       <motion.div
//         key="loc-dropdown"
//         initial={{ opacity: 0, y: -6 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: -6 }}
//         transition={{ duration: 0.15 }}
//         style={{ ...dropdownStyle, display: 'flex', flexDirection: 'column' }}
//       >
//         <Paper
//           elevation={12}
//           sx={{
//             flex: 1, display: 'flex', flexDirection: 'column',
//             borderRadius: 2.5, overflow: 'hidden',
//             bgcolor: paperBg, boxShadow: dropdownShadow,
//             border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
//           }}
//         >
//           <List
//             sx={{
//               py: 0.5, flex: 1, overflowY: 'auto', overflowX: 'hidden',
//               scrollbarWidth: 'none', msOverflowStyle: 'none',
//               '&::-webkit-scrollbar': { display: 'none' },
//             }}
//           >
//             {/* ── Use current location row ── */}
//             <ListItem
//               component="div"
//               onClick={handleUseCurrentLocation}
//               sx={{
//                 ...rowSx,
//                 py: 1.25,
//                 borderBottom: '1px solid',
//                 borderColor: 'divider',
//                 '&:hover': { bgcolor: currentLocHover },
//               }}
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
//                 component="div"
//                 onClick={() => handleSelectPrediction(pred)}
//                 sx={{ ...rowSx, py: 1 }}
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
//     document.body,
//   ) : null;

//   return (
//     <Box
//       ref={containerRef}
//       sx={{
//         position:   'relative',
//         width:      '100%',
//         minWidth:   0,
//         overflow:   'hidden',
//         boxSizing:  'border-box',
//       }}
//     >
//       <TextField
//         key={displayKey}
//         fullWidth
//         size="small"
//         value={query}
//         onChange={handleInputChange}
//         onFocus={() => { HandleOnfocus?.(); setFocused(true); measureDropdown(); externalOnFocus?.(); }}
//         onBlur={() => setTimeout(() => { HandleOnBlur?.(); setFocused(false); externalOnBlur?.(); }, 200)}
//         placeholder={placeholder}
//         autoFocus={autoFocus}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment position="start">
//               {loading
//                 ? <CircularProgress size={16} />
//                 : <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
//             </InputAdornment>
//           ),
//           endAdornment: query ? (
//             <InputAdornment position="end">
//               <IconButton size="small" onClick={handleClear} sx={{ p: 0.25 }}>
//                 <ClearIcon sx={{ fontSize: 15 }} />
//               </IconButton>
//             </InputAdornment>
//           ) : null,
//         }}
//         sx={{
//           '& .MuiOutlinedInput-root': {
//             bgcolor:    'background.paper',
//             borderRadius: 2,
//             boxSizing:  'border-box',
//           },
//         }}
//       />
//       {dropdown}
//     </Box>
//   );
// };
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

// ── Read saved geolocation from localStorage ──────────────────────────────────
function readSavedGeoLoc() {
  if (typeof window === 'undefined') return null;
  try {
    if (localStorage.getItem('geo_loc_status') !== 'success') return null;
    const geo = JSON.parse(localStorage.getItem('geo_loc_data') || 'null');
    if (geo?.lat != null && geo?.lng != null) return geo;
  } catch {}
  return null;
}

// ── Parse a "lng,lat" locationBounds string into { lat, lng } ────────────────
// This is the user's CURRENT geolocation coordinate bounds and takes PRIORITY
// over localStorage geo / static defaults wherever it's supplied.
function parseLocationBounds(locationBounds) {
  if (!locationBounds || typeof locationBounds !== 'string') return null;
  const parts = locationBounds.split(',').map((s) => parseFloat(String(s).trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [lng, lat] = parts;
  return { lat, lng };
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
  displayKey,
  locationBounds = null,
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

  // ── Nominatim search — geo-biased, limit 10 ───────────────────────────────
  const nominatimSearch = useCallback(async (q) => {
    if (!q || q.length < 2) return [];
    try {
      let viewboxParam = {};

      // locationBounds prop takes PRIORITY over the saved localStorage geo.
      const boundsGeo = parseLocationBounds(locationBounds);
      const geo = boundsGeo || readSavedGeoLoc();

      if (geo) {
        const delta = 0.5;
        viewboxParam = {
          viewbox: `${geo.lng - delta},${geo.lat + delta},${geo.lng + delta},${geo.lat - delta}`,
          bounded: '0',
        };
      }

      const params = new URLSearchParams({
        q,
        format:         'json',
        limit:          '10',
        addressdetails: '1',
        ...viewboxParam,
        ...(countryCode ? { countrycodes: countryCode } : {}),
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'Accept-Language': 'en' } },
      );
      if (!res.ok) return [];

      const data    = await res.json();
      const results = data.map((item) => ({
        place_id:       item.place_id?.toString(),
        main_text:      item.name || item.display_name?.split(',')[0],
        secondary_text: item.display_name,
        lat:            parseFloat(item.lat),
        lng:            parseFloat(item.lon),
        address:        item.display_name,
        name:           item.name || item.display_name?.split(',')[0],
      }));

      results.sort((a, b) => {
        const aNum = /\d/.test(a.main_text) ? 0 : 1;
        const bNum = /\d/.test(b.main_text) ? 0 : 1;
        return aNum - bNum;
      });

      return results;
    } catch { return []; }
  }, [countryCode, locationBounds]);

  // ── Search ────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
    setLoading(true);

    try {
      let results = [];

      if (!providerReady) {
        results = await nominatimSearch(q);
      } else if (mapsProvider?.searchPlaces) {
        results = await mapsProvider.searchPlaces(q, countryCode, locationBounds) || [];
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
  }, [mapsProvider, mapControls, countryCode, providerReady, nominatimSearch, locationBounds]);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setQuery(v); onChange?.(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!v || v.length < 2) { setPredictions([]); return; }
    searchTimeout.current = setTimeout(() => doSearch(v), 300);
  };

  // ── Select prediction ─────────────────────────────────────────────────────
  //
  // For Yandex GeoSuggest results (and any suggest-only source), results
  // arrive WITHOUT coordinates.  The flow is:
  //
  //   1. User picks an entry  →  display its title optimistically in the input
  //      and close the dropdown immediately (responsive feel).
  //   2. Call getPlaceDetails(place_id, cached) to resolve lat/lng via Geocoder.
  //      • If place_id is a Yandex URI (ymapsbm1://…) the geocoder uses &uri=
  //      • Otherwise it geocodes the formatted address text.
  //   3. Fire onSelectLocation with the complete location object.
  //
  // For results that already carry lat/lng (Nominatim, biz results from
  // GeoSuggest) we skip step 2 and go straight to step 3.
  // ─────────────────────────────────────────────────────────────────────────

  const handleSelectPrediction = useCallback(async (prediction) => {
    // ── Optimistic UI: close dropdown and show entry title right away ──────
    const displayTitle = prediction.main_text || prediction.address || prediction.name || '';
    setQuery(displayTitle);
    setPredictions([]);
    setFocused(false);
    setLoading(true);

    try {
      let location = null;
      const cached = predictionCache.current[prediction.place_id] || prediction;

      // ── Fast path: coords already present ─────────────────────────────
      if (cached.lat != null && cached.lng != null) {
        location = {
          lat:     cached.lat,
          lng:     cached.lng,
          address: cached.address || cached.secondary_text || cached.main_text,
          name:    cached.name    || cached.main_text,
          placeId: cached.place_id || prediction.place_id,
        };
      }

      // ── Slow path: resolve via Geocoder (Yandex suggest, no-coord results) ─
      else if (mapsProvider?.getPlaceDetails) {
        // place_id for Yandex GeoSuggest = ymapsbm1:// URI → Geocoder uses &uri=
        // place_id for legacy suggest     = text-based id  → Geocoder uses &geocode=
        const r = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
        if (r) {
          location = {
            lat:     r.lat,
            lng:     r.lng,
            // Prefer the original suggestion's label for display consistency
            address: cached.address || cached.secondary_text || cached.main_text || r.address,
            name:    cached.name    || cached.main_text       || r.name,
            placeId: r.place_id || prediction.place_id,
          };
        }
      }

      // ── mapControls fallback (IframeMap bridge) ────────────────────────
      else if (mapControls?.getPlaceDetails) {
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
        // Update input to the full resolved address (may differ from optimistic title)
        setQuery(location.address || location.name);
      } else {
        // Resolution failed — revert input to what user was typing
        console.warn('[LocationSearch] could not resolve location for:', prediction.main_text);
        setQuery(displayTitle);
      }
    } catch (err) {
      console.warn('[LocationSearch] getPlaceDetails error:', err);
      setQuery(displayTitle);
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

  const rowSx = {
    cursor: 'pointer',
    '&:hover':  { bgcolor: 'action.hover' },
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
                sx={{ ...rowSx, py: 1 }}
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
    <Box
      ref={containerRef}
      sx={{
        position:   'relative',
        width:      '100%',
        minWidth:   0,
        overflow:   'hidden',
        boxSizing:  'border-box',
      }}
    >
      <TextField
        key={displayKey}
        fullWidth
        size="small"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { HandleOnfocus?.(); setFocused(true); measureDropdown(); externalOnFocus?.(); }}
        onBlur={() => setTimeout(() => { HandleOnBlur?.(); setFocused(false); externalOnBlur?.(); }, 200)}
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
          '& .MuiOutlinedInput-root': {
            bgcolor:    'background.paper',
            borderRadius: 2,
            boxSizing:  'border-box',
          },
        }}
      />
      {dropdown}
    </Box>
  );
};