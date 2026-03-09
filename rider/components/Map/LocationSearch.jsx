// // // // PATH: Okra/Okrarides/rider/components/Map/LocationSearch.jsx
// // // //
// // // // All existing props are preserved — no changes needed in consuming pages.

// // // 'use client';

// // // import { useState, useRef, useEffect, useCallback } from 'react';
// // // import {
// // //   Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText,
// // //   CircularProgress, IconButton, InputAdornment,
// // // } from '@mui/material';
// // // import {
// // //   Search as SearchIcon, Clear as ClearIcon,
// // //   LocationOn as LocationIcon, MyLocation as MyLocationIcon,
// // // } from '@mui/icons-material';
// // // import { motion, AnimatePresence } from 'framer-motion';

// // // // Safe import of MapsProvider hook — component still works without it
// // // let useMapsProviderHook = null;
// // // try {
// // //   const mod = require('./APIProviders/MapsProvider');
// // //   useMapsProviderHook = mod.useMapProvider;
// // // } catch { /* MapsProvider not in tree — fall back to mapControls */ }

// // // function useSafeMapProvider() {
// // //   try { if (useMapsProviderHook) return useMapsProviderHook(); }
// // //   catch { /* not inside MapsProvider */ }
// // //   return null;
// // // }

// // // export const LocationSearch = ({
// // //   onSelectLocation,
// // //   placeholder  = 'Search location',
// // //   autoFocus    = false,
// // //   mapControls,
// // //   value,
// // //   onChange,
// // //   onFocus:  externalOnFocus,
// // //   onBlur:   externalOnBlur,
// // //   countryCode = null,
// // // }) => {
// // //   const [query,       setQuery]       = useState(value || '');
// // //   const [predictions, setPredictions] = useState([]);
// // //   const [loading,     setLoading]     = useState(false);
// // //   const [focused,     setFocused]     = useState(false);
// // //   const searchTimeout = useRef(null);

// // //   // Store full prediction objects so getPlaceDetails gets everything it needs
// // //   // (lat, lng, _rawText, _uri, etc.) — not just place_id
// // //   const predictionCache = useRef({});

// // //   const mapsProvider = useSafeMapProvider();

// // //   useEffect(() => {
// // //     if (value !== undefined) setQuery(value);
// // //   }, [value]);

// // //   // ── Search ────────────────────────────────────────────────────────────────
// // //   const doSearch = useCallback(
// // //     async (q) => {
// // //       if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
// // //       setLoading(true);
// // //       try {
// // //         let results = [];

// // //         // 1. MapsProvider (priority-based: Yandex → Google → Nominatim)
// // //         if (mapsProvider?.searchPlaces) {
// // //           results = await mapsProvider.searchPlaces(q, countryCode) || [];
// // //           // Cache each prediction by place_id so we can pass it to getPlaceDetails
// // //           results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
// // //         }

// // //         // 2. mapControls iframe fallback
// // //         if (!results.length && mapControls?.searchLocation) {
// // //           await new Promise((resolve) => {
// // //             mapControls.searchLocation(q, (res) => { results = res || []; resolve(); });
// // //           });
// // //           results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
// // //         }

// // //         setPredictions(results);
// // //       } catch (err) {
// // //         console.warn('[LocationSearch] search error:', err);
// // //         setPredictions([]);
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     },
// // //     [mapsProvider, mapControls, countryCode]
// // //   );

// // //   const handleInputChange = (e) => {
// // //     const v = e.target.value;
// // //     setQuery(v);
// // //     onChange?.(v);
// // //     if (searchTimeout.current) clearTimeout(searchTimeout.current);
// // //     if (!v || v.length < 2) { setPredictions([]); return; }
// // //     searchTimeout.current = setTimeout(() => doSearch(v), 300);
// // //   };

// // //   // ── Select prediction ─────────────────────────────────────────────────────
// // //   const handleSelectPrediction = useCallback(
// // //     async (prediction) => {
// // //       setLoading(true);
// // //       try {
// // //         let location = null;

// // //         // Retrieve the cached full prediction (has lat, lng, _rawText etc.)
// // //         const cached = predictionCache.current[prediction.place_id] || prediction;

// // //         // Fast path: prediction already has coordinates (Nominatim, Yandex URI-parsed)
// // //         if (cached.lat != null && cached.lng != null) {
// // //           location = {
// // //             lat:      cached.lat,
// // //             lng:      cached.lng,
// // //             address:  cached.address  || cached.secondary_text || cached.main_text,
// // //             name:     cached.name     || cached.main_text,
// // //             placeId:  cached.place_id || prediction.place_id,
// // //           };
// // //         }
// // //         // MapsProvider path — pass the FULL cached prediction as extraData
// // //         // YandexMapsProvider.getPlaceDetails will use lat/lng if present,
// // //         // or fall back to geocoding _rawText if not
// // //         else if (mapsProvider?.getPlaceDetails) {
// // //           const result = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
// // //           if (result) {
// // //             location = {
// // //               lat:     result.lat,
// // //               lng:     result.lng,
// // //               address: result.address,
// // //               name:    result.name || result.address?.split(',')[0],
// // //               placeId: result.place_id || prediction.place_id,
// // //             };
// // //           }
// // //         }
// // //         // mapControls iframe path
// // //         else if (mapControls?.getPlaceDetails) {
// // //           await new Promise((resolve) => {
// // //             mapControls.getPlaceDetails(prediction.place_id, (result) => {
// // //               if (result) location = result;
// // //               resolve();
// // //             });
// // //           });
// // //         }

// // //         if (location) {
// // //           onSelectLocation(location);
// // //           setQuery(location.address || location.name);
// // //           setPredictions([]);
// // //           setFocused(false);
// // //         }
// // //       } catch (err) {
// // //         console.warn('[LocationSearch] getPlaceDetails error:', err);
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     },
// // //     [mapsProvider, mapControls, onSelectLocation]
// // //   );

// // //   // ── Current location ──────────────────────────────────────────────────────
// // //   const handleUseCurrentLocation = useCallback(async () => {
// // //     if (mapControls?.getCurrentLocation) {
// // //       mapControls.getCurrentLocation((loc) => {
// // //         if (loc) {
// // //           onSelectLocation({ ...loc, address: 'Current Location', name: 'Current Location', placeId: 'current_location' });
// // //           setQuery('Current Location');
// // //           setPredictions([]);
// // //           setFocused(false);
// // //         }
// // //       });
// // //       return;
// // //     }
// // //     if (navigator.geolocation) {
// // //       navigator.geolocation.getCurrentPosition((pos) => {
// // //         const loc = {
// // //           lat: pos.coords.latitude, lng: pos.coords.longitude,
// // //           address: 'Current Location', name: 'Current Location', placeId: 'current_location',
// // //         };
// // //         onSelectLocation(loc);
// // //         setQuery('Current Location');
// // //         setPredictions([]);
// // //         setFocused(false);
// // //       });
// // //     }
// // //   }, [mapControls, onSelectLocation]);

// // //   const handleClear = () => {
// // //     setQuery('');
// // //     onChange?.('');
// // //     setPredictions([]);
// // //   };

// // //   return (
// // //     <Box sx={{ position: 'relative', width: '100%' }}>
// // //       <TextField
// // //         fullWidth size="small"
// // //         value={query}
// // //         onChange={handleInputChange}
// // //         onFocus={() => { setFocused(true); externalOnFocus?.(); }}
// // //         onBlur={() => setTimeout(() => { setFocused(false); externalOnBlur?.(); }, 200)}
// // //         placeholder={placeholder}
// // //         autoFocus={autoFocus}
// // //         InputProps={{
// // //           startAdornment: (
// // //             <InputAdornment position="start">
// // //               {loading ? <CircularProgress size={20} /> : <SearchIcon />}
// // //             </InputAdornment>
// // //           ),
// // //           endAdornment: query && (
// // //             <InputAdornment position="end">
// // //               <IconButton size="small" onClick={handleClear}><ClearIcon /></IconButton>
// // //             </InputAdornment>
// // //           ),
// // //         }}
// // //         sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 2 } }}
// // //       />

// // //       <AnimatePresence>
// // //         {predictions.length > 0 && focused && (
// // //           <motion.div
// // //             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
// // //             exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
// // //           >
// // //             <Paper elevation={4} sx={{
// // //               position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
// // //               maxHeight: 300, overflow: 'auto', zIndex: 1000, borderRadius: 2,
// // //             }}>
// // //               <List sx={{ py: 1 }}>
// // //                 <ListItem button onClick={handleUseCurrentLocation} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
// // //                   <ListItemIcon><MyLocationIcon color="primary" /></ListItemIcon>
// // //                   <ListItemText
// // //                     primary="Use Current Location"
// // //                     primaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }}
// // //                   />
// // //                 </ListItem>

// // //                 {predictions.map((prediction, idx) => (
// // //                   <ListItem
// // //                     key={prediction.place_id || idx}
// // //                     button
// // //                     onClick={() => handleSelectPrediction(prediction)}
// // //                     sx={{ '&:hover': { bgcolor: 'action.hover' } }}
// // //                   >
// // //                     <ListItemIcon><LocationIcon /></ListItemIcon>
// // //                     <ListItemText
// // //                       primary={prediction.main_text}
// // //                       secondary={prediction.secondary_text}
// // //                       primaryTypographyProps={{ fontWeight: 500 }}
// // //                       secondaryTypographyProps={{ variant: 'caption' }}
// // //                     />
// // //                   </ListItem>
// // //                 ))}
// // //               </List>
// // //             </Paper>
// // //           </motion.div>
// // //         )}
// // //       </AnimatePresence>
// // //     </Box>
// // //   );
// // // };

// // // export default LocationSearch;
// // // PATH: Okra/Okrarides/rider/components/Map/LocationSearch.jsx
// // //
// // // All existing props are preserved — no changes needed in consuming pages.

// // 'use client';

// // import { useState, useRef, useEffect, useCallback } from 'react';
// // import {
// //   Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText,
// //   CircularProgress, IconButton, InputAdornment,
// // } from '@mui/material';
// // import {
// //   Search as SearchIcon, Clear as ClearIcon,
// //   LocationOn as LocationIcon, MyLocation as MyLocationIcon,
// // } from '@mui/icons-material';
// // import { motion, AnimatePresence } from 'framer-motion';

// // // Safe import of MapsProvider hook — component still works without it
// // let useMapsProviderHook = null;
// // try {
// //   const mod = require('@/components/APIProviders/MapsProvider');
// //   useMapsProviderHook = mod.useMapProvider;
// // } catch { /* MapsProvider not in tree — fall back to mapControls */ }

// // function useSafeMapProvider() {
// //   try { if (useMapsProviderHook) return useMapsProviderHook(); }
// //   catch { /* not inside MapsProvider */ }
// //   return null;
// // }

// // export const LocationSearch = ({
// //   onSelectLocation,
// //   placeholder  = 'Search location',
// //   autoFocus    = false,
// //   mapControls,
// //   value,
// //   onChange,
// //   onFocus:  externalOnFocus,
// //   onBlur:   externalOnBlur,
// //   countryCode = null,
// // }) => {
// //   const [query,       setQuery]       = useState(value || '');
// //   const [predictions, setPredictions] = useState([]);
// //   const [loading,     setLoading]     = useState(false);
// //   const [focused,     setFocused]     = useState(false);
// //   const searchTimeout = useRef(null);

// //   // Store full prediction objects so getPlaceDetails gets everything it needs
// //   // (lat, lng, _rawText, _uri, etc.) — not just place_id
// //   const predictionCache = useRef({});

// //   const mapsProvider = useSafeMapProvider();
// //   console.log('[LocationSearch] mapsProvider available:', !!mapsProvider);

// //   useEffect(() => {
// //     if (value !== undefined) setQuery(value);
// //   }, [value]);

// //   // ── Search ────────────────────────────────────────────────────────────────
// //   const doSearch = useCallback(
// //     async (q) => {
// //       console.log(`[LocationSearch] doSearch: "${q}"`);
// //       if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
// //       setLoading(true);
// //       try {
// //         let results = [];

// //         // 1. MapsProvider (priority-based: Yandex → Google → Nominatim)
// //         if (mapsProvider?.searchPlaces) {
// //           console.log('[LocationSearch] using mapsProvider.searchPlaces');
// //           results = await mapsProvider.searchPlaces(q, countryCode) || [];
// //           console.log(`[LocationSearch] mapsProvider returned ${results.length} results`);
// //           // Cache each prediction by place_id so we can pass it to getPlaceDetails
// //           results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
// //         }

// //         // 2. mapControls iframe fallback
// //         if (!results.length && mapControls?.searchLocation) {
// //           console.log('[LocationSearch] falling back to mapControls.searchLocation');
// //           await new Promise((resolve) => {
// //             mapControls.searchLocation(q, (res) => { results = res || []; resolve(); });
// //           });
// //           console.log(`[LocationSearch] mapControls returned ${results.length} results`);
// //           results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
// //         }

// //         setPredictions(results);
// //       } catch (err) {
// //         console.warn('[LocationSearch] search error:', err);
// //         setPredictions([]);
// //       } finally {
// //         setLoading(false);
// //       }
// //     },
// //     [mapsProvider, mapControls, countryCode]
// //   );

// //   const handleInputChange = (e) => {
// //     const v = e.target.value;
// //     setQuery(v);
// //     onChange?.(v);
// //     if (searchTimeout.current) clearTimeout(searchTimeout.current);
// //     if (!v || v.length < 2) { setPredictions([]); return; }
// //     searchTimeout.current = setTimeout(() => doSearch(v), 300);
// //   };

// //   // ── Select prediction ─────────────────────────────────────────────────────
// //   const handleSelectPrediction = useCallback(
// //     async (prediction) => {
// //       console.log('[LocationSearch] handleSelectPrediction', prediction);
// //       setLoading(true);
// //       try {
// //         let location = null;

// //         // Retrieve the cached full prediction (has lat, lng, _rawText etc.)
// //         const cached = predictionCache.current[prediction.place_id] || prediction;
// //         console.log('[LocationSearch] cached data:', cached);

// //         // Fast path: prediction already has coordinates (Nominatim, Yandex URI-parsed)
// //         if (cached.lat != null && cached.lng != null) {
// //           console.log('[LocationSearch] using cached coordinates (fast path)');
// //           location = {
// //             lat:      cached.lat,
// //             lng:      cached.lng,
// //             address:  cached.address  || cached.secondary_text || cached.main_text,
// //             name:     cached.name     || cached.main_text,
// //             placeId:  cached.place_id || prediction.place_id,
// //           };
// //         }
// //         // MapsProvider path — pass the FULL cached prediction as extraData
// //         // YandexMapsProvider.getPlaceDetails will use lat/lng if present,
// //         // or fall back to geocoding _rawText if not
// //         else if (mapsProvider?.getPlaceDetails) {
// //           console.log('[LocationSearch] using mapsProvider.getPlaceDetails with extraData:', cached);
// //           const result = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
// //           console.log('[LocationSearch] mapsProvider.getPlaceDetails returned:', result);
// //           if (result) {
// //             location = {
// //               lat:     result.lat,
// //               lng:     result.lng,
// //               address: result.address,
// //               name:    result.name || result.address?.split(',')[0],
// //               placeId: result.place_id || prediction.place_id,
// //             };
// //           }
// //         }
// //         // mapControls iframe path
// //         else if (mapControls?.getPlaceDetails) {
// //           console.log('[LocationSearch] using mapControls.getPlaceDetails');
// //           await new Promise((resolve) => {
// //             mapControls.getPlaceDetails(prediction.place_id, (result) => {
// //               if (result) location = result;
// //               resolve();
// //             });
// //           });
// //         }

// //         if (location) {
// //           console.log('[LocationSearch] location selected:', location);
// //           onSelectLocation(location);
// //           setQuery(location.address || location.name);
// //           setPredictions([]);
// //           setFocused(false);
// //         } else {
// //           console.warn('[LocationSearch] no location obtained');
// //         }
// //       } catch (err) {
// //         console.warn('[LocationSearch] getPlaceDetails error:', err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     },
// //     [mapsProvider, mapControls, onSelectLocation]
// //   );

// //   // ── Current location ──────────────────────────────────────────────────────
// //   const handleUseCurrentLocation = useCallback(async () => {
// //     if (mapControls?.getCurrentLocation) {
// //       mapControls.getCurrentLocation((loc) => {
// //         if (loc) {
// //           onSelectLocation({ ...loc, address: 'Current Location', name: 'Current Location', placeId: 'current_location' });
// //           setQuery('Current Location');
// //           setPredictions([]);
// //           setFocused(false);
// //         }
// //       });
// //       return;
// //     }
// //     if (navigator.geolocation) {
// //       navigator.geolocation.getCurrentPosition((pos) => {
// //         const loc = {
// //           lat: pos.coords.latitude, lng: pos.coords.longitude,
// //           address: 'Current Location', name: 'Current Location', placeId: 'current_location',
// //         };
// //         onSelectLocation(loc);
// //         setQuery('Current Location');
// //         setPredictions([]);
// //         setFocused(false);
// //       });
// //     }
// //   }, [mapControls, onSelectLocation]);

// //   const handleClear = () => {
// //     setQuery('');
// //     onChange?.('');
// //     setPredictions([]);
// //   };

// //   return (
// //     <Box sx={{ position: 'relative', width: '100%' }}>
// //       <TextField
// //         fullWidth size="small"
// //         value={query}
// //         onChange={handleInputChange}
// //         onFocus={() => { setFocused(true); externalOnFocus?.(); }}
// //         onBlur={() => setTimeout(() => { setFocused(false); externalOnBlur?.(); }, 200)}
// //         placeholder={placeholder}
// //         autoFocus={autoFocus}
// //         InputProps={{
// //           startAdornment: (
// //             <InputAdornment position="start">
// //               {loading ? <CircularProgress size={20} /> : <SearchIcon />}
// //             </InputAdornment>
// //           ),
// //           endAdornment: query && (
// //             <InputAdornment position="end">
// //               <IconButton size="small" onClick={handleClear}><ClearIcon /></IconButton>
// //             </InputAdornment>
// //           ),
// //         }}
// //         sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 2 } }}
// //       />

// //       <AnimatePresence>
// //         {predictions.length > 0 && focused && (
// //           <motion.div
// //             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
// //             exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
// //           >
// //             <Paper elevation={4} sx={{
// //               position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
// //               maxHeight: 300, overflow: 'auto', zIndex: 1000, borderRadius: 2,
// //             }}>
// //               <List sx={{ py: 1 }}>
// //                 <ListItem button onClick={handleUseCurrentLocation} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
// //                   <ListItemIcon><MyLocationIcon color="primary" /></ListItemIcon>
// //                   <ListItemText
// //                     primary="Use Current Location"
// //                     primaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }}
// //                   />
// //                 </ListItem>

// //                 {predictions.map((prediction, idx) => (
// //                   <ListItem
// //                     key={prediction.place_id || idx}
// //                     button
// //                     onClick={() => handleSelectPrediction(prediction)}
// //                     sx={{ '&:hover': { bgcolor: 'action.hover' } }}
// //                   >
// //                     <ListItemIcon><LocationIcon /></ListItemIcon>
// //                     <ListItemText
// //                       primary={prediction.main_text}
// //                       secondary={prediction.secondary_text}
// //                       primaryTypographyProps={{ fontWeight: 500 }}
// //                       secondaryTypographyProps={{ variant: 'caption' }}
// //                     />
// //                   </ListItem>
// //                 ))}
// //               </List>
// //             </Paper>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //     </Box>
// //   );
// // };

// // export default LocationSearch;
// // PATH: Okra/Okrarides/rider/components/Map/LocationSearch.jsx
// //
// // All existing props are preserved — no changes needed in consuming pages.

// 'use client';

// import { useState, useRef, useEffect, useCallback } from 'react';
// import {
//   Box, TextField, Paper, List, ListItem, ListItemIcon, ListItemText,
//   CircularProgress, IconButton, InputAdornment,
// } from '@mui/material';
// import {
//   Search as SearchIcon, Clear as ClearIcon,
//   LocationOn as LocationIcon, MyLocation as MyLocationIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';

// // Safe import of MapsProvider hook — component still works without it
// let useMapsProviderHook = null;
// try {
//   const mod = require('./APIProviders/MapsProvider');
//   useMapsProviderHook = mod.useMapProvider;
// } catch { /* MapsProvider not in tree — fall back to mapControls */ }

// function useSafeMapProvider() {
//   try { if (useMapsProviderHook) return useMapsProviderHook(); }
//   catch { /* not inside MapsProvider */ }
//   return null;
// }

// export const LocationSearch = ({
//   onSelectLocation,
//   placeholder  = 'Search location',
//   autoFocus    = false,
//   mapControls,
//   value,
//   onChange,
//   onFocus:  externalOnFocus,
//   onBlur:   externalOnBlur,
//   countryCode = null,
// }) => {
//   const [query,       setQuery]       = useState(value || '');
//   const [predictions, setPredictions] = useState([]);
//   const [loading,     setLoading]     = useState(false);
//   const [focused,     setFocused]     = useState(false);
//   const searchTimeout = useRef(null);

//   // Store full prediction objects so getPlaceDetails gets everything it needs
//   // (lat, lng, _rawText, _uri, etc.) — not just place_id
//   const predictionCache = useRef({});

//   const mapsProvider = useSafeMapProvider();

//   useEffect(() => {
//     if (value !== undefined) setQuery(value);
//   }, [value]);

//   // ── Search ────────────────────────────────────────────────────────────────
//   const doSearch = useCallback(
//     async (q) => {
//       if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
//       setLoading(true);
//       try {
//         let results = [];

//         // 1. MapsProvider (priority-based: Yandex → Google → Nominatim)
//         if (mapsProvider?.searchPlaces) {
//           results = await mapsProvider.searchPlaces(q, countryCode) || [];
//           // Cache each prediction by place_id so we can pass it to getPlaceDetails
//           results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
//         }

//         // 2. mapControls iframe fallback
//         if (!results.length && mapControls?.searchLocation) {
//           await new Promise((resolve) => {
//             mapControls.searchLocation(q, (res) => { results = res || []; resolve(); });
//           });
//           results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
//         }

//         setPredictions(results);
//       } catch (err) {
//         console.warn('[LocationSearch] search error:', err);
//         setPredictions([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [mapsProvider, mapControls, countryCode]
//   );

//   const handleInputChange = (e) => {
//     const v = e.target.value;
//     setQuery(v);
//     onChange?.(v);
//     if (searchTimeout.current) clearTimeout(searchTimeout.current);
//     if (!v || v.length < 2) { setPredictions([]); return; }
//     searchTimeout.current = setTimeout(() => doSearch(v), 300);
//   };

//   // ── Select prediction ─────────────────────────────────────────────────────
//   const handleSelectPrediction = useCallback(
//     async (prediction) => {
//       setLoading(true);
//       try {
//         let location = null;

//         // Retrieve the cached full prediction (has lat, lng, _rawText etc.)
//         const cached = predictionCache.current[prediction.place_id] || prediction;

//         // Fast path: prediction already has coordinates (Nominatim, Yandex URI-parsed)
//         if (cached.lat != null && cached.lng != null) {
//           location = {
//             lat:      cached.lat,
//             lng:      cached.lng,
//             address:  cached.address  || cached.secondary_text || cached.main_text,
//             name:     cached.name     || cached.main_text,
//             placeId:  cached.place_id || prediction.place_id,
//           };
//         }
//         // MapsProvider path — pass the FULL cached prediction as extraData
//         // YandexMapsProvider.getPlaceDetails will use lat/lng if present,
//         // or fall back to geocoding _rawText if not
//         else if (mapsProvider?.getPlaceDetails) {
//           const result = await mapsProvider.getPlaceDetails(prediction.place_id, cached);
//           if (result) {
//             location = {
//               lat:     result.lat,
//               lng:     result.lng,
//               address: result.address,
//               name:    result.name || result.address?.split(',')[0],
//               placeId: result.place_id || prediction.place_id,
//             };
//           }
//         }
//         // mapControls iframe path
//         else if (mapControls?.getPlaceDetails) {
//           await new Promise((resolve) => {
//             mapControls.getPlaceDetails(prediction.place_id, (result) => {
//               if (result) location = result;
//               resolve();
//             });
//           });
//         }

//         if (location) {
//           onSelectLocation(location);
//           setQuery(location.address || location.name);
//           setPredictions([]);
//           setFocused(false);
//         }
//       } catch (err) {
//         console.warn('[LocationSearch] getPlaceDetails error:', err);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [mapsProvider, mapControls, onSelectLocation]
//   );

//   // ── Current location ──────────────────────────────────────────────────────
//   const handleUseCurrentLocation = useCallback(async () => {
//     if (mapControls?.getCurrentLocation) {
//       mapControls.getCurrentLocation((loc) => {
//         if (loc) {
//           onSelectLocation({ ...loc, address: 'Current Location', name: 'Current Location', placeId: 'current_location' });
//           setQuery('Current Location');
//           setPredictions([]);
//           setFocused(false);
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
//         onSelectLocation(loc);
//         setQuery('Current Location');
//         setPredictions([]);
//         setFocused(false);
//       });
//     }
//   }, [mapControls, onSelectLocation]);

//   const handleClear = () => {
//     setQuery('');
//     onChange?.('');
//     setPredictions([]);
//   };

//   return (
//     <Box sx={{ position: 'relative', width: '100%' }}>
//       <TextField
//         fullWidth size="small"
//         value={query}
//         onChange={handleInputChange}
//         onFocus={() => { setFocused(true); externalOnFocus?.(); }}
//         onBlur={() => setTimeout(() => { setFocused(false); externalOnBlur?.(); }, 200)}
//         placeholder={placeholder}
//         autoFocus={autoFocus}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment position="start">
//               {loading ? <CircularProgress size={20} /> : <SearchIcon />}
//             </InputAdornment>
//           ),
//           endAdornment: query && (
//             <InputAdornment position="end">
//               <IconButton size="small" onClick={handleClear}><ClearIcon /></IconButton>
//             </InputAdornment>
//           ),
//         }}
//         sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 2 } }}
//       />

//       <AnimatePresence>
//         {predictions.length > 0 && focused && (
//           <motion.div
//             initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
//           >
//             <Paper elevation={4} sx={{
//               position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
//               maxHeight: 300, overflow: 'auto', zIndex: 1000, borderRadius: 2,
//             }}>
//               <List sx={{ py: 1 }}>
//                 <ListItem button onClick={handleUseCurrentLocation} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
//                   <ListItemIcon><MyLocationIcon color="primary" /></ListItemIcon>
//                   <ListItemText
//                     primary="Use Current Location"
//                     primaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }}
//                   />
//                 </ListItem>

//                 {predictions.map((prediction, idx) => (
//                   <ListItem
//                     key={prediction.place_id || idx}
//                     button
//                     onClick={() => handleSelectPrediction(prediction)}
//                     sx={{ '&:hover': { bgcolor: 'action.hover' } }}
//                   >
//                     <ListItemIcon><LocationIcon /></ListItemIcon>
//                     <ListItemText
//                       primary={prediction.main_text}
//                       secondary={prediction.secondary_text}
//                       primaryTypographyProps={{ fontWeight: 500 }}
//                       secondaryTypographyProps={{ variant: 'caption' }}
//                     />
//                   </ListItem>
//                 ))}
//               </List>
//             </Paper>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </Box>
//   );
// };

// export default LocationSearch;
// PATH: Okra/Okrarides/rider/components/Map/LocationSearch.jsx
//
// All existing props are preserved — no changes needed in consuming pages.

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

// Safe import of MapsProvider hook — component still works without it
let useMapsProviderHook = null;
try {
  const mod = require('../APIProviders/MapsProvider');
  useMapsProviderHook = mod.useMapProvider;
} catch { /* MapsProvider not in tree — fall back to mapControls */ }

function useSafeMapProvider() {
  try { if (useMapsProviderHook) return useMapsProviderHook(); }
  catch { /* not inside MapsProvider */ }
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
  const searchTimeout = useRef(null);

  // Store full prediction objects so getPlaceDetails gets everything it needs
  // (lat, lng, _rawText, _uri, etc.) — not just place_id
  const predictionCache = useRef({});

  const mapsProvider = useSafeMapProvider();

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  // ── Search ────────────────────────────────────────────────────────────────
  const doSearch = useCallback(
    async (q) => {
      if (!q || q.length < 2) { setPredictions([]); setLoading(false); return; }
      setLoading(true);
      try {
        let results = [];

        // 1. MapsProvider (priority-based: Yandex → Google → Nominatim)
        if (mapsProvider?.searchPlaces) {
          results = await mapsProvider.searchPlaces(q, countryCode) || [];
          // Cache each prediction by place_id so we can pass it to getPlaceDetails
          results.forEach((r) => { if (r.place_id) predictionCache.current[r.place_id] = r; });
        }

        // 2. mapControls iframe fallback
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
    },
    [mapsProvider, mapControls, countryCode]
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

        // Retrieve the cached full prediction (has lat, lng, _rawText etc.)
        const cached = predictionCache.current[prediction.place_id] || prediction;

        // Fast path: prediction already has coordinates (Nominatim, Yandex URI-parsed)
        if (cached.lat != null && cached.lng != null) {
          location = {
            lat:      cached.lat,
            lng:      cached.lng,
            address:  cached.address  || cached.secondary_text || cached.main_text,
            name:     cached.name     || cached.main_text,
            placeId:  cached.place_id || prediction.place_id,
          };
        }
        // MapsProvider path — pass the FULL cached prediction as extraData
        // YandexMapsProvider.getPlaceDetails will use lat/lng if present,
        // or fall back to geocoding _rawText if not
        else if (mapsProvider?.getPlaceDetails) {
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
        // mapControls iframe path
        else if (mapControls?.getPlaceDetails) {
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
    [mapsProvider, mapControls, onSelectLocation]
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
                <ListItem button onClick={handleUseCurrentLocation} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <ListItemIcon><MyLocationIcon color="primary" /></ListItemIcon>
                  <ListItemText
                    primary="Use Current Location"
                    primaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }}
                  />
                </ListItem>

                {predictions.map((prediction, idx) => (
                  <ListItem
                    key={prediction.place_id || idx}
                    button
                    onClick={() => handleSelectPrediction(prediction)}
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
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
  )
}

export default LocationSearch;