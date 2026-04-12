// 'use client';
// // PATH: rider/app/(main)/deliveries/send/page.jsx

// import {
//   useState, useEffect, useRef, useCallback, useMemo,
// } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box, Typography, IconButton, Button,
//   List, ListItem, ListItemText, ListItemIcon,
//   CircularProgress, Alert, Snackbar, Chip,
// } from '@mui/material';
// import { alpha, useTheme } from '@mui/material/styles';
// import {
//   ArrowBack as BackIcon,
//   Close as CloseIcon,
//   SwapVert as SwapIcon,
//   LocationOn as LocationOnIcon,
//   AccessTime as AccessTimeIcon,
//   Person as PersonIcon,
//   Flag as FlagIcon,
//   MyLocation as MyLocationIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import MapIframe from '@/components/Map/MapIframeNoSSR';
// import { MapControls } from '@/components/Map/MapControls';
// import { LocationSearch } from '@/components/Map/LocationSearch';
// import SwipeableBottomSheet, { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';
// import DeliveryOptionsSheet from '@/components/Rider/DeliveryOptionsSheet';
// import { useDeliveryBooking } from '@/lib/hooks/useDeliveryBooking';
// import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
// import { useGeolocation } from '@/lib/hooks/useGeolocation';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { apiClient } from '@/lib/api/client';
// import { HomePageSkeleton } from '@/components/Skeletons/HomePageSkeleton';
// import { useBottomNav } from '@/lib/contexts/BottomNavContext';

// const AMBER = '#F59E0B';

// const CLEAN_INPUT_SX = {
//   '& .MuiInputBase-root': {
//     border: 'none !important', outline: 'none !important',
//     boxShadow: 'none !important', bgcolor: 'transparent !important', p: '0 !important',
//   },
//   '& .MuiOutlinedInput-notchedOutline': { border: 'none !important' },
//   '& .MuiFilledInput-underline:before': { display: 'none' },
//   '& .MuiFilledInput-underline:after':  { display: 'none' },
//   '& .MuiInput-underline:before':       { display: 'none' },
//   '& .MuiInput-underline:after':        { display: 'none' },
//   '& .MuiInputAdornment-root':          { display: 'none' },
//   '& .MuiIconButton-root':              { display: 'none' },
//   '& .MuiInputBase-input': { p: '0 !important', fontSize: '0.9rem', fontWeight: 500 },
// };

// export default function SendPackagePage() {
//   const router = useRouter();
//   const { user, isAuthenticated } = useAuth();
//   const theme  = useTheme();
//   const isDark = theme.palette.mode === 'dark';
//   const { hideNav, showNav, setNavVisible } = useBottomNav();
//   const [estimatesVisible, setEstimatesVisible] = useState(false);

//   // ── Location hooks ─────────────────────────────────────────────────────
//   const { location, loading: locationLoading, refresh: refreshWebLocation } = useGeolocation({ watch: true });
//   const { isNative, reconnectDeviceSocket, stopLocationTracking, getCurrentLocation: getNativeLocation } = useReactNative();

//   // ── Delivery booking ───────────────────────────────────────────────────
//   const { bookDelivery, booking, currentDelivery } = useDeliveryBooking();

//   // ── Location state ─────────────────────────────────────────────────────
//   const [pickupLocation,    setPickupLocation]    = useState(null);
//   const [dropoffLocation,   setDropoffLocation]   = useState(null);
//   const [mapCenter,         setMapCenter]         = useState({ lat: -15.4167, lng: 28.2833 });
//   const [routeInfo,         setRouteInfo]         = useState(null);
//   const [focusedInput,      setFocusedInput]      = useState(null);
//   const [sheetExpanded,     setSheetExpanded]     = useState(false);
//   const [pickupChipVisible, setPickupChipVisible] = useState(false);
//   const [stopGettingGeoCodedLoc, setStopGettingGeoCodedLoc] = useState(false)
//   const [geoCodeCounter, setGeoCodeCounter] = useState(0)
//   // ── Tracks every time location is successfully obtained/refreshed ──────
//   // Bumping this guarantees locationDisplayText and any derived UI re-renders
//   // even when the lat/lng coordinates themselves haven't changed.
//   const [locationObtainedAt, setLocationObtainedAt] = useState(null);

//   // ── Sheet visibility ───────────────────────────────────────────────────
//   const [showLocationSheet,   setShowLocationSheet]   = useState(true);
//   const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);

//   // ── Misc ───────────────────────────────────────────────────────────────
//   const [recentLocations, setRecentLocations] = useState([]);
//   const [mapControls,     setMapControls]     = useState(null);
//   const [showTraffic,     setShowTraffic]     = useState(false);
//   const [isRelocating,    setIsRelocating]    = useState(false);
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

//   // ── Refs ───────────────────────────────────────────────────────────────
//   const mapControlsRef      = useRef(null);
//   const locationObtainedRef = useRef(false);
//   const fastIntervalRef     = useRef(null);
//   const slowIntervalRef     = useRef(null);

//   const HEADER_GRADIENT_DARK_SX = {
//     background: 'linear-gradient(-60deg, #6D4C41 0%, #4E342E 25%, #795548 50%, #5D4037 75%, #8D6E63 100%)',
//     backgroundSize: '300% 300%',
//     animation: 'deliverySendWave 7s ease infinite',
//     '@keyframes deliverySendWave': {
//       '0%':   { backgroundPosition: '0% 50%' },
//       '50%':  { backgroundPosition: '100% 50%' },
//       '100%': { backgroundPosition: '0% 50%' },
//     },
//   };

//   const HEADER_GRADIENT_SX = {
//     background: 'linear-gradient(160deg, #92400E 0%, #B45309 100%)',
//     backgroundSize: '300% 300%',
//     animation: 'deliverySendWave 7s ease infinite',
//     '@keyframes deliverySendWave': {
//       '0%':   { backgroundPosition: '0% 50%' },
//       '50%':  { backgroundPosition: '100% 50%' },
//       '100%': { backgroundPosition: '0% 50%' },
//     },
//   };

//   const GRADIENT_STYLES = isDark ? HEADER_GRADIENT_DARK_SX : HEADER_GRADIENT_SX;

//    useEffect(() => {
//     if (estimatesVisible) hideNav();
//     else showNav();
//     // Clean up: restore nav when this page unmounts
//     return () => showNav();
//   }, [estimatesVisible]); // eslint-disable-line react-hooks/exhaustive-dep
  

//   useEffect(() => { mapControlsRef.current = mapControls; }, [mapControls]);

//   // ── Load recent locations ──────────────────────────────────────────────
//   useEffect(() => {
//     const saved = localStorage.getItem('okra_rides_recent_locations');
//     if (saved) { try { setRecentLocations(JSON.parse(saved)); } catch {} }
//   }, []);
  

//   useEffect(() => {
//     if (currentDelivery) {
//       const { rideStatus, id } = currentDelivery;
//       if (rideStatus === 'pending') {
//         router.push(`/deliveries/finding-deliverer?id=${id}`);
//       } else if (['accepted', 'arrived', 'passenger_onboard'].includes(rideStatus)) {
//         router.push(`/deliveries/${id}/tracking`);
//       } else if (rideStatus === 'completed') {
//         router.push(`/deliveries/${id}`);
//       }
//     }
//   }, [currentDelivery, router]);

//   // ── Pickup chip visibility ─────────────────────────────────────────────
//   useEffect(() => {
//     setPickupChipVisible(pickupLocation?.isCurrentLocation === true && focusedInput !== 'pickup');
//   }, [pickupLocation, focusedInput]);

//   // ── Location detection ────────────────────────────────────────────────

//   // ── Reverse-geocode helper ─────────────────────────────────────────────
//   const reverseGeocodeCoords = useCallback(async (lat, lng) => {
//     try {
//       const res = await apiClient.post('/reverse-geocode', {
//         location: { lat, lng },
//       });
//       const loc = res?.data?.location ?? res?.location;
//       if (loc?.latitude && loc?.longitude) return loc;
//     } catch (err) {
//       console.warn('[send] reverse geocode failed (non-fatal):', err);
//     }
//     return null;
//   }, []);

//   const applyLocationFix = useCallback(async (lat, lng) => {
//     if (lat == null || lng == null) return;
//     locationObtainedRef.current = true;
//     setMapCenter({ lat, lng });

//     // Set raw coords immediately so the map moves without waiting for geocoding
//     setPickupLocation((prev) => {
//       if (prev && !prev.isCurrentLocation) return prev;
//       return {
//         lat, lng,
//         address:           `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
//         name:              `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
//         placeId:           `geo_${lat}_${lng}`,
//         isCurrentLocation: true,
//       };
//     });

//     // Bump timestamp so display always re-renders when location is (re-)obtained
//     setLocationObtainedAt(Date.now());

//     // Enrich with real address in the background
//     const geocoded = await reverseGeocodeCoords(lat, lng);
//     if (geocoded) {
//       setPickupLocation((prev) => {
//         if (prev && !prev.isCurrentLocation) return prev;
//         return {
//           lat:               geocoded.latitude,
//           lng:               geocoded.longitude,
//           address:           geocoded.address   || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
//           name:              geocoded.name       || geocoded.streetAddress || geocoded.address?.split(',')[0] || 'Current Location',
//           placeId:           geocoded.placeId    || `geo_${lat}_${lng}`,
//           city:              geocoded.city,
//           country:           geocoded.country,
//           state:             geocoded.state,
//           postalCode:        geocoded.postalCode,
//           isCurrentLocation: true,
//         };
//       });
//       // Bump again once enriched address arrives so display shows the real name
//       setLocationObtainedAt(Date.now());
//     }
//   }, [reverseGeocodeCoords]);

//  const fetchServerStoredLocation = async(userId)=>{
//      if (userId) {
//          if(geoCodeCounter >= 2){
//            return
//          }
//          const res = await apiClient.get(`/users/${userId}`);
//          const cl = res?.currentLocation;
//          if (cl?.latitude && cl?.longitude) {
//            locationObtainedRef.current = true;
//            // If the server's stored location has no address yet, geocode it now
//            const needsGeocode = !cl.address && !cl.name;
//            if(stopGettingGeoCodedLoc){
//               return
//            }
//            const geocoded = needsGeocode ? await reverseGeocodeCoords(cl.latitude, cl.longitude) : null;
//            const source = geocoded ?? cl;
//            if(!source.hasOwnProperty('address')){
//              stopGettingGeoCodedLoc(true)
//            }
//            const loc = {
//              lat:               source.latitude  ?? cl.latitude,
//              lng:               source.longitude ?? cl.longitude,
//              address:           source.address   || `${cl.latitude}, ${cl.longitude}`,
//              name:              source.name      || source.streetAddress || source.address?.split(',')[0] || 'Current Location',
//              placeId:           source.placeId   || `geo_${cl.latitude}_${cl.longitude}`,
//              city:              source.city,
//              country:           source.country,
//              state:             source.state,
//              postalCode:        source.postalCode,
//              isCurrentLocation: true,
//            };
//            setGeoCodeCounter((prev)=> (prev + 1))
//            setPickupLocation((prev) => (prev && !prev.isCurrentLocation ? prev : loc));
//            // Bump timestamp so display re-renders with fresh location
//            setLocationObtainedAt(Date.now());
//            return loc;
//          }
//        }
//    }

//    useEffect(()=>{
//       const runGetDeviceLocationOnce = async ()=>{
//          await getNativeLocation(fetchAndApplyNativeLocation,user?.id) // tell the device to fetch the location at least once first, then procede
//          await fetchAndApplyNativeLocation() // and apply it and geocode it when fetched
//       }
//       runGetDeviceLocationOnce()
//     },[])


//   const fetchAndApplyNativeLocation = useCallback(async () => {
//     try {
//       await new Promise((r) => setTimeout(r, 2000)) // wait 2 seconds then fetch the updated server code
//       if (user?.id) { // fetch backend code at least once first
//         fetchServerStoredLocation(user.id)
//       }
//       const nativeLoc = await getNativeLocation(fetchAndApplyNativeLocation,user?.id);
//       if (!nativeLoc?.lat) return null;
//       const coords = { lat: nativeLoc.lat, lng: nativeLoc.lng };
//       setMapCenter(coords);
//       if (mapControlsRef.current) mapControlsRef.current.animateToLocation(coords, 16);
//       await new Promise((r) => setTimeout(r, 2000));
//       if (user?.id) { // fetch backend code at least once first
//         fetchServerStoredLocation(user.id)
//       }
//       // Server had no currentLocation — geocode the raw native coords directly
//       locationObtainedRef.current = true;
//       await applyLocationFix(nativeLoc.lat, nativeLoc.lng);
//       return coords;
//     } catch { return null; }
//   }, [user, getNativeLocation, reverseGeocodeCoords, applyLocationFix]);

//   useEffect(() => {
//     if (location && !locationObtainedRef.current) applyLocationFix(location.lat, location.lng);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [location]);

//   useEffect(() => {
//     const FAST_MS = 2_000;
//     const SLOW_MS = 10 * 60_000;

//     if (isNative && !locationObtainedRef.current) {
//       fastIntervalRef.current = setInterval(() => {
//         if (locationObtainedRef.current) {
//           clearInterval(fastIntervalRef.current);
//           fastIntervalRef.current = null;
//           return;
//         }
//         // Fire-and-forget — never block the interval tick
//         fetchAndApplyNativeLocation().then((result) => {
//           if (result) {
//             clearInterval(fastIntervalRef.current);
//             fastIntervalRef.current = null;
//           }
//         }).catch(() => {});
//       }, FAST_MS);
//     }

//     slowIntervalRef.current = setInterval(() => {
//       // Fire-and-forget — never block the UI
//       if (isNative && getNativeLocation) {
//         fetchAndApplyNativeLocation().catch(() => {});
//       } else {
//         refreshWebLocation().catch(() => {});
//       }
//     }, SLOW_MS);

//     return () => {
//       if (fastIntervalRef.current) clearInterval(fastIntervalRef.current);
//       if (slowIntervalRef.current) clearInterval(slowIntervalRef.current);
//     };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (isNative) fetchAndApplyNativeLocation();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (mapControls && mapCenter) mapControls.animateToLocation(mapCenter, 16);
//   }, [mapControls, mapCenter]);

//   // ── Switch sheets when both locations are set ──────────────────────────
//   useEffect(() => {
//     if (pickupLocation && dropoffLocation && showLocationSheet) {
//       const t = setTimeout(() => {
//         setShowLocationSheet(false);
//         setShowDeliveryOptions(true);
//         setSheetExpanded(false);
//         setFocusedInput(null);
//       }, 250);
//       return () => clearTimeout(t);
//     }
//   }, [pickupLocation, dropoffLocation, showLocationSheet]);

//   // ── Handlers ───────────────────────────────────────────────────────────

//   const saveToRecent = useCallback((loc) => {
//     if (loc.isCurrentLocation) return;
//     const newRecent = [loc, ...recentLocations.filter((l) => l.placeId !== loc.placeId && l.address !== loc.address)].slice(0, 5);
//     setRecentLocations(newRecent);
//     localStorage.setItem('okra_rides_recent_locations', JSON.stringify(newRecent));
//   }, [recentLocations]);

//   const handlePickupSelect = useCallback((loc) => {
//     setPickupLocation(loc); saveToRecent(loc);
//     if(dropoffLocation){
//       hideNav()
//     }
//     if (mapControls) mapControls.animateToLocation(loc, 15);
//     setTimeout(() => setFocusedInput(null), 150);
//   }, [mapControls, saveToRecent]);

//   const handleDropoffSelect = useCallback((loc) => {
//     setDropoffLocation(loc); saveToRecent(loc);
//     if(pickupLocation){
//       hideNav()
//     }
//     if (mapControls) mapControls.animateToLocation(loc, 15);
//     setTimeout(() => setFocusedInput(null), 150);
//   }, [mapControls, saveToRecent]);

//   const handleSelectRecent = useCallback((loc) => {
//     if (focusedInput === 'pickup') handlePickupSelect(loc);
//     else handleDropoffSelect(loc);
//   }, [focusedInput, handlePickupSelect, handleDropoffSelect]);

//   const handleInputFocus = useCallback((input) => {
//     setFocusedInput(input);
//     if (!sheetExpanded) setSheetExpanded(true);

//     // When the user taps the destination field, silently re-obtain current location
//     // in the background so the pickup reflects exactly where they are right now.
//     if (input === 'dropoff') {
//       if (isNative) {
//         fetchAndApplyNativeLocation().catch(() => {});
//       } else {
//         refreshWebLocation().catch(() => {});
//       }
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [sheetExpanded, isNative]);

//   const handleInputBlur  = () => { setTimeout(() => setFocusedInput(null), 180); };

//   const handleIAmHere = () => {
//     if (isNative) { fetchAndApplyNativeLocation(); setFocusedInput(null); return; }
//     const lat = location?.lat ?? pickupLocation?.lat;
//     const lng = location?.lng ?? pickupLocation?.lng;
//     if (lat == null || lng == null) return;
//     applyLocationFix(lat, lng);
//     setFocusedInput(null);
//     if (mapControls) mapControls.animateToLocation({ lat, lng }, 16);
//   };

//   const handleRelocate = async () => {
//     setIsRelocating(true);
//     try {
//       if (isNative) {
//         const result = await fetchAndApplyNativeLocation();
//         if (!result) throw new Error('no_location');
//         if (result.lat && mapControls) mapControls.animateToLocation({ lat: result.lat, lng: result.lng }, 16);
//       } else {
//         await refreshWebLocation();
//         await new Promise((r) => setTimeout(r, 500));
//         if (location && mapControls) { mapControls.animateToLocation({ lat: location.lat, lng: location.lng }, 16); applyLocationFix(location.lat, location.lng); }
//         else throw new Error('no_location');
//       }
//       setSnackbar({ open: true, message: 'Location updated', severity: 'success' });
//     } catch { setSnackbar({ open: true, message: 'Could not get your location.', severity: 'error' }); }
//     finally { setTimeout(() => setIsRelocating(false), 1500); }
//   };

//   const handleSwap = () => { const [p, d] = [pickupLocation, dropoffLocation]; setPickupLocation(d); setDropoffLocation(p); };

//   const handleCloseDeliveryOptions = () => {
//     setShowDeliveryOptions(false); setShowLocationSheet(true);
//     setDropoffLocation(null); setSheetExpanded(false);
//     showNav();
//   };

//   // ── Fetch estimates ────────────────────────────────────────────────────
//   const fetchDeliveryEstimates = useCallback(async (payload) => {
//   try {
//     const response = await apiClient.post('/deliveries/estimate', payload);
//     hideNav()
//     return response?.data ?? response;
//     } catch {
//       setSnackbar({ open: true, message: 'Error calculating delivery fare. Please try again.', severity: 'error' });
//     } finally {
//       setTimeout(() => {
//           if(isNative) {
//             reconnectDeviceSocket(user.id, 'rider', process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL);
//           }
//           stopLocationTracking() // no need to continue tracking your location, you are about to send a delivery
//       }, 0);
//     }
//   }, []);

//   // ── Confirm ────────────────────────────────────────────────────────────
//   const handleConfirmDelivery = async (details) => {
//     try {
//       const data = await bookDelivery({
//         pickupLocation, dropoffLocation,
//         paymentMethod:         details.paymentMethod,
//         deliveryMode:          details.deliveryMode,
//         recipient:             details.recipient,
//         packageType:           details.packageType,
//         isFragile:             details.isFragile,
//         weightKg:              details.weightKg,
//         bigItemFit:            details.bigItemFit,
//         vehiclePreference:     details.vehiclePreference,
//         deliveryClassName:     details.deliveryClass?.deliveryClassName,
//         deliveryClassId:       details.deliveryClass?.deliveryClassId,
//         vehicleTypePreference: details.vehiclePreference,
//         estimatedFare:         details.totalFare,
//         totalFare:             details.totalFare,
//         estimatedDistance:     parseFloat(routeInfo?.distance) || null,
//         estimatedDuration:     parseFloat(routeInfo?.duration) || null,
//       });
//       setGeoCodeCounter(0) // in case you don't find a driver yet you moved a bit
//       setStopGettingGeoCodedLoc(false) // in case you don't find a driver yet you moved a bit
//       if (data?.id) router.push(`/deliveries/finding-deliverer?id=${data.id}`);
//     } catch (e) {
//       setSnackbar({ open: true, message: e?.message ?? 'Failed to place delivery.', severity: 'error' });
//     }
//   };

//   // ── Markers ────────────────────────────────────────────────────────────
//   const markers = useMemo(() => {
//     const m = [];
//     if (pickupLocation)  m.push({ id: 'pickup',  position: pickupLocation,  type: 'pickup'  });
//     if (dropoffLocation) m.push({ id: 'dropoff', position: dropoffLocation, type: 'dropoff' });
//     return m;
//   }, [pickupLocation?.lat, pickupLocation?.lng, dropoffLocation?.lat, dropoffLocation?.lng]);

//   // ── Location display text ──────────────────────────────────────────────
//   // locationObtainedAt is included as a dependency so this re-computes every
//   // time location is refreshed, even if the coords haven't changed.
//   const locationDisplayText = useMemo(() => {
//     if (!pickupLocation) return 'Detecting location…';
//     if (pickupLocation.isCurrentLocation) {
//       const label = pickupLocation.name || pickupLocation.address;
//       if (label) return label.split(',')[0];
//       if (location) return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
//       return 'Detecting location…';
//     }
//     return pickupLocation.name || pickupLocation.address?.split(',')[0] || 'Current Location';
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pickupLocation, location, locationObtainedAt]);

//   // ── Derived dark-mode-aware style values ──────────────────────────────
//   const sheetBg          = isDark ? '#1A1208'              : '#FBF3E8';
//   const inputFocusedBg   = isDark ? '#2A1F10'              : 'white';
//   const inputUnfocusedBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.88)';
//   const iconPanelFocused = 'rgba(245,158,11,0.12)';
//   const iconPanelUnfocused = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)';
//   const recentIconBg     = isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)';

//   const rideBtnBorder        = `1.5px solid rgba(255,179,0,${isDark ? '0.5' : '0.35'})`;
//   const rideBtnBg            = isDark
//     ? 'linear-gradient(-60deg, rgba(255,179,0,0.18) 0%, rgba(255,138,0,0.14) 25%, rgba(255,193,7,0.16) 50%, rgba(255,109,0,0.12) 75%, rgba(255,213,79,0.1) 100%)'
//     : 'linear-gradient(-60deg, rgba(255,179,0,0.12) 0%, rgba(255,138,0,0.08) 25%, rgba(255,193,7,0.1) 50%, rgba(255,109,0,0.07) 75%, rgba(255,213,79,0.06) 100%)';
//   const rideBtnHoverBorder   = `1.5px solid rgba(255,179,0,${isDark ? '0.8' : '0.65'})`;
//   const rideBtnHoverBg       = isDark
//     ? 'linear-gradient(-60deg, rgba(255,179,0,0.28) 0%, rgba(255,138,0,0.22) 25%, rgba(255,193,7,0.26) 50%, rgba(255,109,0,0.2) 75%, rgba(255,213,79,0.18) 100%)'
//     : 'linear-gradient(-60deg, rgba(255,179,0,0.2) 0%, rgba(255,138,0,0.14) 25%, rgba(255,193,7,0.18) 50%, rgba(255,109,0,0.12) 75%, rgba(255,213,79,0.1) 100%)';
//   const rideBtnIconBg        = isDark ? 'rgba(255,179,0,0.22)' : 'rgba(255,179,0,0.15)';
//   const rideBtnChevronBg     = isDark ? 'rgba(255,179,0,0.18)' : 'rgba(255,179,0,0.12)';

//   if(!isAuthenticated()) {
//     return <HomePageSkeleton />;
//   }

//   return (
//     <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', overflow: 'hidden', maxWidth: '100vw', boxSizing: 'border-box' }}>

//       {/* ── Map ──────────────────────────────────────────────────────────── */}
//       <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
//         <MapIframe
//           center={mapCenter ?? { lat: -15.4167, lng: 28.2833 }}
//           zoom={16}
//           markers={markers}
//           pickupLocation={pickupLocation}
//           dropoffLocation={dropoffLocation}
//           showRoute={!!(pickupLocation && dropoffLocation)}
//           showTraffic={showTraffic}
//           onMapLoad={setMapControls}
//           onRouteCalculated={setRouteInfo}
//           onMapClick={(loc) => {
//             if (!loc) return;
//             const field = focusedInput ?? (pickupLocation ? 'dropoff' : 'pickup');
//             const coords = { lat: loc.lat, lng: loc.lng, address: 'Selected location', name: 'Selected location' };
//             if (field === 'pickup') handlePickupSelect(coords);
//             else handleDropoffSelect(coords);
//           }}
//         />
//       </Box>

//       {/* ── Back button ───────────────────────────────────────────────────── */}
//       <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 20 }}>
//         <IconButton onClick={() => router.back()} sx={{ bgcolor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
//           <BackIcon />
//         </IconButton>
//       </Box>

//       {/* ── Relocating overlay ────────────────────────────────────────────── */}
//       <AnimatePresence>
//         {isRelocating && (
//           <Box sx={{ position: 'absolute', inset: 0, zIndex: 1400, bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
//             <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} style={{ textAlign: 'center' }}>
//               <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, mx: 'auto', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { boxShadow: `0 0 0 0 ${alpha(AMBER, 0.7)}` }, '70%': { boxShadow: `0 0 0 20px ${alpha(AMBER, 0)}` }, '100%': { boxShadow: `0 0 0 0 ${alpha(AMBER, 0)}` } } }}>
//                 <MyLocationIcon sx={{ fontSize: 40, color: 'white' }} />
//               </Box>
//               <CircularProgress size={44} thickness={3} sx={{ mb: 2, color: AMBER }} />
//               <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>Finding your location…</Typography>
//             </motion.div>
//           </Box>
//         )}
//       </AnimatePresence>

//       {/* ── Map controls ──────────────────────────────────────────────────── */}
//       <Box sx={{ position: 'absolute', right: 16, bottom: showLocationSheet ? 360 : 100, zIndex: 5, transition: 'bottom 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
//         <MapControls
//           onLocateMe={handleRelocate}
//           onZoomIn={() => mapControls?.zoomIn?.()}
//           onZoomOut={() => mapControls?.zoomOut?.()}
//           onToggleTraffic={() => setShowTraffic((p) => !p)}
//           showTraffic={showTraffic}
//         />
//       </Box>

//       {/* ══════════════════════════════════════════════════════════════════
//           Location Selection Sheet
//       ══════════════════════════════════════════════════════════════════ */}
//       <AnimatePresence>
//         {showLocationSheet && (
//           <SwipeableBottomSheet open initialHeight="80%" maxHeight="90%" minHeight={280} expandedHeight={sheetExpanded ? '90%' : null} persistHeight={sheetExpanded} onSwipeDown={() => { setSheetExpanded(false); setFocusedInput(null); }}>
//             <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', overflow: 'hidden', bgcolor: sheetBg }}>

//               {/* Gradient header */}
//               <Box sx={{ ...GRADIENT_STYLES, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexShrink: 0, overflow: 'hidden', position: 'relative', '&::before': { content: '""', position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' } }}>
//                 <BottomSheetDragPill colored />

//                 {/* Location summary */}
//                 <AnimatePresence>
//                   {!focusedInput && (
//                     <motion.div key="header-info" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -28 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
//                       <Box sx={{ px: 3, pb: 2 }}>
//                         <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontSize: '1.15rem', letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.15)', mb: 1.25 }}>
//                           Send a package
//                         </Typography>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, gap: 1 }}>
//                           <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, flexShrink: 0 }}>Your location</Typography>
//                           <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, maxWidth: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>{locationDisplayText}</Typography>
//                         </Box>
//                         <Box sx={{ display: 'flex', gap: 1 }}>
//                           <Button fullWidth size="small" onClick={() => { setPickupChipVisible(false); handleInputFocus('pickup'); }} sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', py: 0.75, border: '1px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>Change</Button>
//                           <Button fullWidth size="small" onClick={handleIAmHere} sx={{ bgcolor: 'white', color: '#5D4037', borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', py: 0.75, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' } }}>I am here</Button>
//                         </Box>
//                       </Box>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 {/* Input fields */}
//                 <motion.div layout transition={{ duration: 0.26 }} style={{ width: '100%' }}>
//                   {/* ─── DROP-IN REPLACEMENT ──────────────────────────────────────────────────
//                   Replace the entire <Box sx={{ px: 2.5, pt: 0.5, pb: 2.5 ... }}> block
//                   inside the <motion.div layout> in SendPackagePage with this.
//                   Nothing else in the page changes.
//                 ─────────────────────────────────────────────────────────────────────────── */}

//                 <Box sx={{ px: 2.5, pt: 0.5, pb: 2.5, width: '100%', boxSizing: 'border-box' }}>

//                   {/* ── PICKUP — hidden when dropoff is focused ── */}
//                   <AnimatePresence initial={false}>
//                     {focusedInput !== 'dropoff' && (
//                       <motion.div
//                         key="pickup-input"
//                         initial={{ opacity: 0, y: -18, height: 0 }}
//                         animate={{ opacity: 1, y: 0,   height: 'auto' }}
//                         exit={{   opacity: 0, y: -18,  height: 0 }}
//                         transition={{ type: 'spring', stiffness: 340, damping: 30 }}
//                         style={{ overflow: 'hidden', marginBottom: 6 }}
//                       >
//                         <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, color: focusedInput === 'pickup' ? 'white' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}>Pickup</Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid', borderColor: focusedInput === 'pickup' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)', borderRadius: 2, boxShadow: focusedInput === 'pickup' ? '0 0 0 3px rgba(255,255,255,0.22)' : 'none', bgcolor: focusedInput === 'pickup' ? inputFocusedBg : inputUnfocusedBg, minHeight: 52, width: '100%', boxSizing: 'border-box', transition: 'all 0.22s', overflow: 'hidden' }}>
//                           <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', flexShrink: 0, borderRight: '1.5px solid', borderColor: focusedInput === 'pickup' ? 'divider' : 'rgba(255,255,255,0.3)', bgcolor: focusedInput === 'pickup' ? iconPanelFocused : iconPanelUnfocused, transition: 'all 0.22s' }}>
//                             <PersonIcon sx={{ fontSize: 19, color: focusedInput === 'pickup' ? AMBER : pickupLocation ? 'success.main' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), transition: 'color 0.22s' }} />
//                           </Box>
//                           <Box sx={{ flex: 1, px: 1.5, py: 1, display: 'flex', alignItems: 'center', cursor: 'text', minWidth: 0 }}
//                             onClick={() => { if (pickupChipVisible) { setPickupChipVisible(false); handleInputFocus('pickup'); } }}>
//                             {pickupChipVisible ? (
//                               <Chip
//                                 icon={<MyLocationIcon sx={{ fontSize: '14px !important' }} />}
//                                 label="Current Location"
//                                 onDelete={() => { setPickupLocation(null); setPickupChipVisible(false); handleInputFocus('pickup'); }}
//                                 onClick={() => { setPickupChipVisible(false); handleInputFocus('pickup'); }}
//                                 size="small"
//                                 sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#5D4037', fontWeight: 700, fontSize: '0.75rem', height: 28, '& .MuiChip-deleteIcon': { color: '#5D4037', opacity: 0.7 }, '& .MuiChip-icon': { color: '#5D4037' } }}
//                               />
//                             ) : (
//                               <Box sx={{ ...CLEAN_INPUT_SX, width: '98%' }}>
//                                 <LocationSearch
//                                   displayKey="d1"
//                                   HandleOnBlur={showNav}
//                                   HandleOnfocus={hideNav}
//                                   placeholder={pickupLocation?.address && !pickupLocation.isCurrentLocation ? pickupLocation.address : 'Enter pickup location'}
//                                   onSelectLocation={handlePickupSelect}
//                                   mapControls={mapControls}
//                                   value={focusedInput === 'pickup' ? (pickupLocation?.isCurrentLocation ? '' : pickupLocation?.address || '') : (pickupLocation?.address || '')}
//                                   autoFocus={focusedInput === 'pickup'}
//                                   onFocus={() => handleInputFocus('pickup')}
//                                   onBlur={handleInputBlur}
//                                 />
//                               </Box>
//                             )}
//                           </Box>
//                           {pickupLocation && !pickupChipVisible && (
//                             <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled' }}
//                               onClick={(e) => { e.stopPropagation(); setPickupLocation(null); }}>
//                               <CloseIcon sx={{ fontSize: 13 }} />
//                             </IconButton>
//                           )}
//                         </Box>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>

//                   {/* ── CONNECTOR + SWAP — only when neither is focused ── */}
//                   <AnimatePresence initial={false}>
//                     {!focusedInput && (
//                       <motion.div
//                         key="connector"
//                         initial={{ opacity: 0, scaleY: 0 }}
//                         animate={{ opacity: 1, scaleY: 1 }}
//                         exit={{   opacity: 0, scaleY: 0 }}
//                         transition={{ duration: 0.18 }}
//                         style={{ transformOrigin: 'top' }}
//                       >
//                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: '21px', my: 0.2 }}>
//                           <Box sx={{ width: 2, height: 18, bgcolor: pickupLocation && dropoffLocation ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', borderRadius: 1, transition: 'background-color 0.3s' }} />
//                           {pickupLocation && dropoffLocation && (
//                             <IconButton size="small" onClick={handleSwap} sx={{ color: 'rgba(255,255,255,0.8)', mr: 0.5, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' } }}>
//                               <SwapIcon sx={{ fontSize: 18 }} />
//                             </IconButton>
//                           )}
//                         </Box>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>

//                   {/* ── DROPOFF — hidden when pickup is focused ── */}
//                   <AnimatePresence initial={false}>
//                     {focusedInput !== 'pickup' && (
//                       <motion.div
//                         key="dropoff-input"
//                         initial={{ opacity: 0, y: 18, height: 0 }}
//                         animate={{ opacity: 1, y: 0,  height: 'auto' }}
//                         exit={{   opacity: 0, y: 18,  height: 0 }}
//                         transition={{ type: 'spring', stiffness: 340, damping: 30 }}
//                         style={{ overflow: 'hidden' }}
//                       >
//                         <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, color: focusedInput === 'dropoff' ? 'white' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}>Destination</Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid', borderColor: focusedInput === 'dropoff' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)', borderRadius: 2, boxShadow: focusedInput === 'dropoff' ? '0 0 0 3px rgba(255,255,255,0.22)' : 'none', bgcolor: focusedInput === 'dropoff' ? inputFocusedBg : inputUnfocusedBg, minHeight: 52, width: '100%', boxSizing: 'border-box', transition: 'all 0.22s', overflow: 'hidden' }}>
//                           <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', flexShrink: 0, borderRight: '1.5px solid', borderColor: focusedInput === 'dropoff' ? 'divider' : 'rgba(255,255,255,0.3)', bgcolor: focusedInput === 'dropoff' ? iconPanelFocused : iconPanelUnfocused, transition: 'all 0.22s' }}>
//                             <FlagIcon sx={{ fontSize: 19, color: focusedInput === 'dropoff' ? AMBER : dropoffLocation ? 'error.main' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), transition: 'color 0.22s' }} />
//                           </Box>
//                           <Box sx={{ flex: 1, px: 1.5, py: 1, minWidth: 0 }}>
//                             <Box sx={{ ...CLEAN_INPUT_SX, width: '98%' }}>
//                               <LocationSearch
//                                 displayKey="d2"
//                                 HandleOnBlur={showNav}
//                                 HandleOnfocus={hideNav}
//                                 placeholder="Where to deliver?"
//                                 onSelectLocation={handleDropoffSelect}
//                                 mapControls={mapControls}
//                                 value={dropoffLocation?.address || ''}
//                                 autoFocus={focusedInput === 'dropoff'}
//                                 onFocus={() => handleInputFocus('dropoff')}
//                                 onBlur={handleInputBlur}
//                               />
//                             </Box>
//                           </Box>
//                           {dropoffLocation && (
//                             <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled' }}
//                               onClick={(e) => { e.stopPropagation(); setDropoffLocation(null); }}>
//                               <CloseIcon sx={{ fontSize: 13 }} />
//                             </IconButton>
//                           )}
//                         </Box>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>

//                 </Box>
//                 </motion.div>
//               </Box>

//               {/* ── Book a Ride Instead CTA ── */}
//               <Box sx={{ px: 2.5, pt: recentLocations.length > 0 ? 0.5 : 1.5, pb: 3 }}>
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
//                 >
//                   <Box
//                     onClick={() => router.push('/')}
//                     sx={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'space-between',
//                       px: 2.5,
//                       py: 1.75,
//                       borderRadius: 3,
//                       cursor: 'pointer',
//                       border: rideBtnBorder,
//                       background: rideBtnBg,
//                       transition: 'all 0.2s cubic-bezier(0.34,1.3,0.64,1)',
//                       '&:hover': {
//                         border: rideBtnHoverBorder,
//                         background: rideBtnHoverBg,
//                         transform: 'translateX(3px)',
//                       },
//                       '&:active': { transform: 'scale(0.97)' },
//                     }}
//                   >
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                       <Box sx={{
//                         width: 36, height: 36, borderRadius: 2,
//                         bgcolor: rideBtnIconBg,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 18,
//                       }}>
//                         🚗
//                       </Box>
//                       <Box>
//                         <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary', lineHeight: 1.2 }}>
//                           Book a Ride Instead
//                         </Typography>
//                         <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
//                           Get picked up, go anywhere
//                         </Typography>
//                       </Box>
//                     </Box>

//                     <Box sx={{
//                       width: 28, height: 28, borderRadius: '50%',
//                       bgcolor: rideBtnChevronBg,
//                       display: 'flex', alignItems: 'center', justifyContent: 'center',
//                     }}>
//                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
//                         <path d="M9 18l6-6-6-6" stroke="#FF8A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
//                       </svg>
//                     </Box>
//                   </Box>
//                 </motion.div>
//               </Box>

//               {/* Recent locations */}
//               <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, width: '100%', boxSizing: 'border-box' }}>
//                 <AnimatePresence>
//                   {recentLocations.length > 0 && (
//                     <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
//                       <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                           <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
//                             {focusedInput === 'pickup' ? 'Set as pickup' : 'Recent destinations'}
//                           </Typography>
//                           <Box sx={{ height: 1, flex: 1, mx: 1.5, bgcolor: 'divider' }} />
//                           <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
//                         </Box>
//                         <List disablePadding>
//                           {recentLocations.slice(0, 2).map((loc, index) => (
//                             <motion.div key={`${loc.placeId}-${index}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
//                               <ListItem button onClick={() => handleSelectRecent(loc)} sx={{ py: 1, px: 1.5, borderRadius: 2, mb: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', transform: 'translateX(3px)' }, transition: 'all 0.15s' }}>
//                                 <ListItemIcon sx={{ minWidth: 36, width: 36, height: 36, borderRadius: '50%', bgcolor: recentIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
//                                   <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
//                                 </ListItemIcon>
//                                 <ListItemText
//                                   primary={loc.name || loc.address?.split(',')[0]}
//                                   secondary={loc.name && loc.name !== loc.address ? loc.address : null}
//                                   primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem', noWrap: true }}
//                                   secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary', noWrap: true }}
//                                 />
//                               </ListItem>
//                             </motion.div>
//                           ))}
//                         </List>
//                       </Box>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </Box>
//             </Box>
//           </SwipeableBottomSheet>
//         )}
//       </AnimatePresence>

//       {/* ══════════════════════════════════════════════════════════════════
//           Delivery Options Sheet
//       ══════════════════════════════════════════════════════════════════ */}
//       <AnimatePresence mode="wait">
//         {showDeliveryOptions && pickupLocation && dropoffLocation && (
//           <SwipeableBottomSheet key="delivery-options-sheet" open initialHeight="80%" maxHeight="90%" minHeight={280} expandedHeight="90%" persistHeight draggable={false}>
//             <DeliveryOptionsSheet
//               pickupLocation={pickupLocation}
//               dropoffLocation={dropoffLocation}
//               routeInfo={routeInfo}
//               onClose={handleCloseDeliveryOptions}
//               onConfirmDelivery={handleConfirmDelivery}
//               loading={booking}
//               bottomPadding={80}
//               fetchEstimates={fetchDeliveryEstimates}
//             />
//           </SwipeableBottomSheet>
//         )}
//       </AnimatePresence>

//       {/* ── Snackbar ──────────────────────────────────────────────────────── */}
//       <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
//         <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
//       </Snackbar>
//     </Box>
//   );
// }
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
import { alpha, useTheme } from '@mui/material/styles';
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
import MapIframe from '@/components/Map/MapIframeNoSSR';
import { MapControls } from '@/components/Map/MapControls';
import { LocationSearch } from '@/components/Map/LocationSearch';
import SwipeableBottomSheet, { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';
import DeliveryOptionsSheet from '@/components/Rider/DeliveryOptionsSheet';
import { useDeliveryBooking } from '@/lib/hooks/useDeliveryBooking';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { HomePageSkeleton } from '@/components/Skeletons/HomePageSkeleton';
import { useBottomNav } from '@/lib/contexts/BottomNavContext';

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

export default function SendPackagePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { hideNav, showNav, setNavVisible } = useBottomNav();
  const [estimatesVisible, setEstimatesVisible] = useState(false);

  // ── Location hooks ─────────────────────────────────────────────────────
  const { location, loading: locationLoading, refresh: refreshWebLocation } = useGeolocation({ watch: true });
  const { isNative, reconnectDeviceSocket, stopLocationTracking, getCurrentLocation: getNativeLocation } = useReactNative();

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

  // ── Refs — always current inside any closure, unlike state ────────────
  const geoCodeCounterRef       = useRef(0);   // replaces useState geoCodeCounter
  const stopGeoCodeRef          = useRef(false); // replaces useState stopGettingGeoCodedLoc

  // ── Tracks every time location is successfully obtained/refreshed ──────
  const [locationObtainedAt, setLocationObtainedAt] = useState(null);

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

  const HEADER_GRADIENT_DARK_SX = {
    background: 'linear-gradient(-60deg, #6D4C41 0%, #4E342E 25%, #795548 50%, #5D4037 75%, #8D6E63 100%)',
    backgroundSize: '300% 300%',
    animation: 'deliverySendWave 7s ease infinite',
    '@keyframes deliverySendWave': {
      '0%':   { backgroundPosition: '0% 50%' },
      '50%':  { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
  };

  const HEADER_GRADIENT_SX = {
    background: 'linear-gradient(160deg, #92400E 0%, #B45309 100%)',
    backgroundSize: '300% 300%',
    animation: 'deliverySendWave 7s ease infinite',
    '@keyframes deliverySendWave': {
      '0%':   { backgroundPosition: '0% 50%' },
      '50%':  { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
  };

  const GRADIENT_STYLES = isDark ? HEADER_GRADIENT_DARK_SX : HEADER_GRADIENT_SX;

   useEffect(() => {
    if (estimatesVisible) hideNav();
    else showNav();
    return () => showNav();
  }, [estimatesVisible]); // eslint-disable-line react-hooks/exhaustive-dep
  

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
        router.push(`/deliveries/finding-deliverer?id=${id}`);
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

  // ── Reverse-geocode helper ─────────────────────────────────────────────
  // Uses a ref for the counter so the closure always sees the current value,
  // even with an empty deps array.
  const reverseGeocodeCoords = useCallback(async (lat, lng) => {
    if (geoCodeCounterRef.current >= 2) return null; // ← reads live ref, not stale state
    try {
      const res = await apiClient.post('/reverse-geocode', {
        location: { lat, lng },
      });
      const loc = res?.data?.location ?? res?.location;
      if (loc?.latitude && loc?.longitude) {
        geoCodeCounterRef.current += 1; // ← mutate ref directly, no re-render needed
        return loc;
      }
    } catch (err) {
      console.warn('[send] reverse geocode failed (non-fatal):', err);
    }
    return null;
  }, []); // ← deps stay empty — ref is always current

  const applyLocationFix = useCallback(async (lat, lng) => {
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

    setLocationObtainedAt(Date.now());

    const geocoded = await reverseGeocodeCoords(lat, lng);
    if (geocoded) {
      setPickupLocation((prev) => {
        if (prev && !prev.isCurrentLocation) return prev;
        return {
          lat:               geocoded.latitude,
          lng:               geocoded.longitude,
          address:           geocoded.address   || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          name:              geocoded.name      || geocoded.streetAddress || geocoded.address?.split(',')[0] || ("("+( geocoded?.latitude ?? cl.latitude).toFixed(2) +","+ (geocoded?.longitude ?? cl.longitude).toFixed(2)+")"),
          placeId:           geocoded.placeId  || `geo_${lat}_${lng}`,
          city:              geocoded.city,
          country:           geocoded.country,
          state:             geocoded.state,
          postalCode:        geocoded.postalCode,
          isCurrentLocation: true,
        }
      })
      setLocationObtainedAt(Date.now());
    }
  }, [reverseGeocodeCoords]);

  const fetchServerStoredLocation = async (userId) => {
    if (userId) {
      if (geoCodeCounterRef.current >= 2) return; // ← ref, always current
      const res = await apiClient.get(`/users/${userId}`);
      const cl = res?.currentLocation;
      if (cl?.latitude && cl?.longitude) {
        locationObtainedRef.current = true;
        if (stopGeoCodeRef.current) return; // ← ref, always current
        const needsGeocode = !cl.address && !cl.name;
        const geocoded = needsGeocode ? await reverseGeocodeCoords(cl.latitude, cl.longitude) : null;
        const source = geocoded ?? cl;
        if (!source.hasOwnProperty('address')) {
          stopGeoCodeRef.current = true; // ← mutate ref directly
        }
        const loc = {
          lat:               source.latitude  ?? cl.latitude,
          lng:               source.longitude ?? cl.longitude,
          address:           source.address   || `${cl.latitude}, ${cl.longitude}`,
          name:              source.name      || source.streetAddress || source.address?.split(',')[0] || ("("+( geocoded?.latitude ?? cl.latitude).toFixed(2) +","+ (geocoded?.longitude ?? cl.longitude).toFixed(2)+")"),
          placeId:           source.placeId   || `geo_${cl.latitude}_${cl.longitude}`,
          city:              source.city,
          country:           source.country,
          state:             source.state,
          postalCode:        source.postalCode,
          isCurrentLocation: true,
        };
        setPickupLocation((prev) => (prev && !prev.isCurrentLocation ? prev : loc));
        setLocationObtainedAt(Date.now());
        return loc;
      }
    }
  };

   useEffect(()=>{
      const runGetDeviceLocationOnce = async ()=>{
         await getNativeLocation(fetchAndApplyNativeLocation,user?.id)
         await fetchAndApplyNativeLocation()
      }
      runGetDeviceLocationOnce()
    },[])


  const fetchAndApplyNativeLocation = useCallback(async () => {
    try {
      await new Promise((r) => setTimeout(r, 2000));
      if (user?.id) {
        fetchServerStoredLocation(user.id);
      }
      const nativeLoc = await getNativeLocation(fetchAndApplyNativeLocation, user?.id);
      if (!nativeLoc?.lat) return null;
      const coords = { lat: nativeLoc.lat, lng: nativeLoc.lng };
      setMapCenter(coords);
      if (mapControlsRef.current) mapControlsRef.current.animateToLocation(coords, 16);
      await new Promise((r) => setTimeout(r, 2000));
      if (user?.id) {
        fetchServerStoredLocation(user.id);
      }
      locationObtainedRef.current = true;
      await applyLocationFix(nativeLoc.lat, nativeLoc.lng);
      return coords;
    } catch { return null; }
  }, [user, getNativeLocation, reverseGeocodeCoords, applyLocationFix]);

  useEffect(() => {
    if (location && !locationObtainedRef.current) applyLocationFix(location.lat, location.lng);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    const FAST_MS = 2_000;
    const SLOW_MS = 10 * 60_000;

    if (isNative && !locationObtainedRef.current) {
      fastIntervalRef.current = setInterval(() => {
        if (locationObtainedRef.current) {
          clearInterval(fastIntervalRef.current);
          fastIntervalRef.current = null;
          return;
        }
        fetchAndApplyNativeLocation().then((result) => {
          if (result) {
            clearInterval(fastIntervalRef.current);
            fastIntervalRef.current = null;
          }
        }).catch(() => {});
      }, FAST_MS);
    }

    slowIntervalRef.current = setInterval(() => {
      if (isNative && getNativeLocation) {
        fetchAndApplyNativeLocation().catch(() => {});
      } else {
        refreshWebLocation().catch(() => {});
      }
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
    if(dropoffLocation){
      hideNav()
    }
    if (mapControls) mapControls.animateToLocation(loc, 15);
    setTimeout(() => setFocusedInput(null), 150);
  }, [mapControls, saveToRecent]);

  const handleDropoffSelect = useCallback((loc) => {
    setDropoffLocation(loc); saveToRecent(loc);
    if(pickupLocation){
      hideNav()
    }
    if (mapControls) mapControls.animateToLocation(loc, 15);
    setTimeout(() => setFocusedInput(null), 150);
  }, [mapControls, saveToRecent]);

  const handleSelectRecent = useCallback((loc) => {
    if (focusedInput === 'pickup') handlePickupSelect(loc);
    else handleDropoffSelect(loc);
  }, [focusedInput, handlePickupSelect, handleDropoffSelect]);

  const handleInputFocus = useCallback((input) => {
    setFocusedInput(input);
    if (!sheetExpanded) setSheetExpanded(true);

    if (input === 'dropoff') {
      if (isNative) {
        fetchAndApplyNativeLocation().catch(() => {});
      } else {
        refreshWebLocation().catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetExpanded, isNative]);

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
    showNav();
  };

  // ── Fetch estimates ────────────────────────────────────────────────────
  const fetchDeliveryEstimates = useCallback(async (payload) => {
  try {
    const response = await apiClient.post('/deliveries/estimate', payload);
    hideNav()
    return response?.data ?? response;
    } catch {
      setSnackbar({ open: true, message: 'Error calculating delivery fare. Please try again.', severity: 'error' });
    } finally {
      setTimeout(() => {
          if(isNative) {
            reconnectDeviceSocket(user.id, 'rider', process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL);
          }
          stopLocationTracking()
      }, 0);
    }
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

      // Reset refs so a fresh geocode cycle can run if no driver is found
      // and the user moves to a new location before retrying.
      geoCodeCounterRef.current = 0;   // replaces setGeoCodeCounter(0)
      stopGeoCodeRef.current    = false; // replaces setStopGettingGeoCodedLoc(false)

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
  const locationDisplayText = useMemo(() => {
    if (!pickupLocation) return 'Detecting location…';
    if (pickupLocation.isCurrentLocation) {
      const label = pickupLocation.name || pickupLocation.address;
      if (label) return label.split(',')[0];
      if (location) return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      return 'Detecting location…';
    }
    return pickupLocation.name || pickupLocation.address?.split(',')[0] || 'Current Location';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocation, location, locationObtainedAt]);

  // ── Derived dark-mode-aware style values ──────────────────────────────
  const sheetBg          = isDark ? '#1A1208'              : '#FBF3E8';
  const inputFocusedBg   = isDark ? '#2A1F10'              : 'white';
  const inputUnfocusedBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.88)';
  const iconPanelFocused = 'rgba(245,158,11,0.12)';
  const iconPanelUnfocused = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)';
  const recentIconBg     = isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.12)';

  const rideBtnBorder        = `1.5px solid rgba(255,179,0,${isDark ? '0.5' : '0.35'})`;
  const rideBtnBg            = isDark
    ? 'linear-gradient(-60deg, rgba(255,179,0,0.18) 0%, rgba(255,138,0,0.14) 25%, rgba(255,193,7,0.16) 50%, rgba(255,109,0,0.12) 75%, rgba(255,213,79,0.1) 100%)'
    : 'linear-gradient(-60deg, rgba(255,179,0,0.12) 0%, rgba(255,138,0,0.08) 25%, rgba(255,193,7,0.1) 50%, rgba(255,109,0,0.07) 75%, rgba(255,213,79,0.06) 100%)';
  const rideBtnHoverBorder   = `1.5px solid rgba(255,179,0,${isDark ? '0.8' : '0.65'})`;
  const rideBtnHoverBg       = isDark
    ? 'linear-gradient(-60deg, rgba(255,179,0,0.28) 0%, rgba(255,138,0,0.22) 25%, rgba(255,193,7,0.26) 50%, rgba(255,109,0,0.2) 75%, rgba(255,213,79,0.18) 100%)'
    : 'linear-gradient(-60deg, rgba(255,179,0,0.2) 0%, rgba(255,138,0,0.14) 25%, rgba(255,193,7,0.18) 50%, rgba(255,109,0,0.12) 75%, rgba(255,213,79,0.1) 100%)';
  const rideBtnIconBg        = isDark ? 'rgba(255,179,0,0.22)' : 'rgba(255,179,0,0.15)';
  const rideBtnChevronBg     = isDark ? 'rgba(255,179,0,0.18)' : 'rgba(255,179,0,0.12)';

  if(!isAuthenticated()) {
    return <HomePageSkeleton />;
  }

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
          Location Selection Sheet
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showLocationSheet && (
          <SwipeableBottomSheet open initialHeight="80%" maxHeight="90%" minHeight={280} expandedHeight={sheetExpanded ? '90%' : null} persistHeight={sheetExpanded} onSwipeDown={() => { setSheetExpanded(false); setFocusedInput(null); }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', overflow: 'hidden', bgcolor: sheetBg }}>

              {/* Gradient header */}
              <Box sx={{ ...GRADIENT_STYLES, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexShrink: 0, overflow: 'hidden', position: 'relative', '&::before': { content: '""', position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' } }}>
                <BottomSheetDragPill colored />

                {/* Location summary */}
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
                          <Button fullWidth size="small" onClick={handleIAmHere} sx={{ bgcolor: 'white', color: '#5D4037', borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', py: 0.75, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' } }}>I am here</Button>
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input fields */}
                <motion.div layout transition={{ duration: 0.26 }} style={{ width: '100%' }}>

                <Box sx={{ px: 2.5, pt: 0.5, pb: 2.5, width: '100%', boxSizing: 'border-box' }}>

                  {/* ── PICKUP — hidden when dropoff is focused ── */}
                  <AnimatePresence initial={false}>
                    {focusedInput !== 'dropoff' && (
                      <motion.div
                        key="pickup-input"
                        initial={{ opacity: 0, y: -18, height: 0 }}
                        animate={{ opacity: 1, y: 0,   height: 'auto' }}
                        exit={{   opacity: 0, y: -18,  height: 0 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                        style={{ overflow: 'hidden', marginBottom: 6 }}
                      >
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, color: focusedInput === 'pickup' ? 'white' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}>Pickup</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid', borderColor: focusedInput === 'pickup' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)', borderRadius: 2, boxShadow: focusedInput === 'pickup' ? '0 0 0 3px rgba(255,255,255,0.22)' : 'none', bgcolor: focusedInput === 'pickup' ? inputFocusedBg : inputUnfocusedBg, minHeight: 52, width: '100%', boxSizing: 'border-box', transition: 'all 0.22s', overflow: 'hidden' }}>
                          <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', flexShrink: 0, borderRight: '1.5px solid', borderColor: focusedInput === 'pickup' ? 'divider' : 'rgba(255,255,255,0.3)', bgcolor: focusedInput === 'pickup' ? iconPanelFocused : iconPanelUnfocused, transition: 'all 0.22s' }}>
                            <PersonIcon sx={{ fontSize: 19, color: focusedInput === 'pickup' ? AMBER : pickupLocation ? 'success.main' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), transition: 'color 0.22s' }} />
                          </Box>
                          <Box sx={{ flex: 1, px: 1.5, py: 1, display: 'flex', alignItems: 'center', cursor: 'text', minWidth: 0 }}
                            onClick={() => { if (pickupChipVisible) { setPickupChipVisible(false); handleInputFocus('pickup'); } }}>
                            {pickupChipVisible ? (
                              <Chip
                                icon={<MyLocationIcon sx={{ fontSize: '14px !important' }} />}
                                label="Current Location"
                                onDelete={() => { setPickupLocation(null); setPickupChipVisible(false); handleInputFocus('pickup'); }}
                                onClick={() => { setPickupChipVisible(false); handleInputFocus('pickup'); }}
                                size="small"
                                sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#5D4037', fontWeight: 700, fontSize: '0.75rem', height: 28, '& .MuiChip-deleteIcon': { color: '#5D4037', opacity: 0.7 }, '& .MuiChip-icon': { color: '#5D4037' } }}
                              />
                            ) : (
                              <Box sx={{ ...CLEAN_INPUT_SX, width: '98%' }}>
                                <LocationSearch
                                  displayKey="d1"
                                  HandleOnBlur={showNav}
                                  HandleOnfocus={hideNav}
                                  placeholder={pickupLocation?.address && !pickupLocation.isCurrentLocation ? pickupLocation.address : 'Enter pickup location'}
                                  onSelectLocation={handlePickupSelect}
                                  mapControls={mapControls}
                                  value={focusedInput === 'pickup' ? (pickupLocation?.isCurrentLocation ? '' : pickupLocation?.address || '') : (pickupLocation?.address || '')}
                                  autoFocus={focusedInput === 'pickup'}
                                  onFocus={() => handleInputFocus('pickup')}
                                  onBlur={handleInputBlur}
                                />
                              </Box>
                            )}
                          </Box>
                          {pickupLocation && !pickupChipVisible && (
                            <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled' }}
                              onClick={(e) => { e.stopPropagation(); setPickupLocation(null); }}>
                              <CloseIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          )}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── CONNECTOR + SWAP — only when neither is focused ── */}
                  <AnimatePresence initial={false}>
                    {!focusedInput && (
                      <motion.div
                        key="connector"
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{   opacity: 0, scaleY: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ transformOrigin: 'top' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: '21px', my: 0.2 }}>
                          <Box sx={{ width: 2, height: 18, bgcolor: pickupLocation && dropoffLocation ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', borderRadius: 1, transition: 'background-color 0.3s' }} />
                          {pickupLocation && dropoffLocation && (
                            <IconButton size="small" onClick={handleSwap} sx={{ color: 'rgba(255,255,255,0.8)', mr: 0.5, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' } }}>
                              <SwapIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          )}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── DROPOFF — hidden when pickup is focused ── */}
                  <AnimatePresence initial={false}>
                    {focusedInput !== 'pickup' && (
                      <motion.div
                        key="dropoff-input"
                        initial={{ opacity: 0, y: 18, height: 0 }}
                        animate={{ opacity: 1, y: 0,  height: 'auto' }}
                        exit={{   opacity: 0, y: 18,  height: 0 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 0.4, pl: 0.5, color: focusedInput === 'dropoff' ? 'white' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s' }}>Destination</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid', borderColor: focusedInput === 'dropoff' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.45)', borderRadius: 2, boxShadow: focusedInput === 'dropoff' ? '0 0 0 3px rgba(255,255,255,0.22)' : 'none', bgcolor: focusedInput === 'dropoff' ? inputFocusedBg : inputUnfocusedBg, minHeight: 52, width: '100%', boxSizing: 'border-box', transition: 'all 0.22s', overflow: 'hidden' }}>
                          <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', flexShrink: 0, borderRight: '1.5px solid', borderColor: focusedInput === 'dropoff' ? 'divider' : 'rgba(255,255,255,0.3)', bgcolor: focusedInput === 'dropoff' ? iconPanelFocused : iconPanelUnfocused, transition: 'all 0.22s' }}>
                            <FlagIcon sx={{ fontSize: 19, color: focusedInput === 'dropoff' ? AMBER : dropoffLocation ? 'error.main' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'), transition: 'color 0.22s' }} />
                          </Box>
                          <Box sx={{ flex: 1, px: 1.5, py: 1, minWidth: 0 }}>
                            <Box sx={{ ...CLEAN_INPUT_SX, width: '98%' }}>
                              <LocationSearch
                                displayKey="d2"
                                HandleOnBlur={showNav}
                                HandleOnfocus={hideNav}
                                placeholder="Where to deliver?"
                                onSelectLocation={handleDropoffSelect}
                                mapControls={mapControls}
                                value={dropoffLocation?.address || ''}
                                autoFocus={focusedInput === 'dropoff'}
                                onFocus={() => handleInputFocus('dropoff')}
                                onBlur={handleInputBlur}
                              />
                            </Box>
                          </Box>
                          {dropoffLocation && (
                            <IconButton size="small" sx={{ mr: 0.5, p: 0.5, color: 'text.disabled' }}
                              onClick={(e) => { e.stopPropagation(); setDropoffLocation(null); }}>
                              <CloseIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          )}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </Box>
                </motion.div>
              </Box>

              {/* ── Book a Ride Instead CTA ── */}
              <Box sx={{ px: 2.5, pt: recentLocations.length > 0 ? 0.5 : 1.5, pb: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
                >
                  <Box
                    onClick={() => router.push('/')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2.5,
                      py: 1.75,
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: rideBtnBorder,
                      background: rideBtnBg,
                      transition: 'all 0.2s cubic-bezier(0.34,1.3,0.64,1)',
                      '&:hover': {
                        border: rideBtnHoverBorder,
                        background: rideBtnHoverBg,
                        transform: 'translateX(3px)',
                      },
                      '&:active': { transform: 'scale(0.97)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 2,
                        bgcolor: rideBtnIconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18,
                      }}>
                        🚗
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary', lineHeight: 1.2 }}>
                          Book a Ride Instead
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Get picked up, go anywhere
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%',
                      bgcolor: rideBtnChevronBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="#FF8A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
                          {recentLocations.slice(0, 2).map((loc, index) => (
                            <motion.div key={`${loc.placeId}-${index}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                              <ListItem button onClick={() => handleSelectRecent(loc)} sx={{ py: 1, px: 1.5, borderRadius: 2, mb: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', transform: 'translateX(3px)' }, transition: 'all 0.15s' }}>
                                <ListItemIcon sx={{ minWidth: 36, width: 36, height: 36, borderRadius: '50%', bgcolor: recentIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0 }}>
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