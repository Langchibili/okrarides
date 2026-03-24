// 'use client'
// import { useState, useEffect, useCallback } from 'react';
// import {
//   Box, Typography, Button, CircularProgress, TextField,
//   IconButton, Divider, Chip, Alert, Paper, Switch,
//   FormControlLabel, InputAdornment, Collapse,
// } from '@mui/material';
// import {
//   Close as CloseIcon,
//   CheckCircle as CheckIcon,
//   AccessTime as TimeIcon,
//   DirectionsBike as BikeIcon,
//   DirectionsCar as CarIcon,
//   LocalShipping as TruckIcon,
//   AccountBalanceWallet as CashIcon,
//   CreditCard as CardIcon,
//   Phone as PhoneIcon,
//   Person as PersonIcon,
//   Warning as FragileIcon,
//   FitnessCenter as WeightIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';

// // ─── Constants ────────────────────────────────────────────────────────────────

// const AMBER  = '#F59E0B';
// const AMBER2 = '#D97706';

// const HEADER_SX = {
//   background: 'linear-gradient(160deg, #92400E 0%, #B45309 100%)',
//   backgroundSize: '300% 300%',
//   animation: 'deliverySendWave 7s ease infinite',
//   '@keyframes deliverySendWave': {
//     '0%':   { backgroundPosition: '0% 50%' },
//     '50%':  { backgroundPosition: '100% 50%' },
//     '100%': { backgroundPosition: '0% 50%' },
//   },
// }
// // Maps internal packageType + vehicleHint → the class name sent to the backend
// const PACKAGE_TO_CLASS = {
//   package:         'standard',
//   big_item_car:    'midsize',
//   big_item_truck:  'big',
//   cargo:           'large',
// };

// // Display labels for each delivery class name coming from the backend
// const CLASS_DISPLAY = {
//   standard: { emoji: '📦', label: 'Package',   sub: 'Up to standard size & weight' },
//   midsize:  { emoji: '🛍️', label: 'Big Item',  sub: 'Fits in a car' },
//   big:      { emoji: '🚚', label: 'Big Item',  sub: 'Needs a truck' },
//   large:    { emoji: '🏗️', label: 'Cargo',     sub: 'Large / heavy cargo' },
// };

// // Vehicle type options for "Deliver by"
// const VEHICLE_OPTIONS = [
//   { value: 'motorbike',  Icon: BikeIcon,  label: 'Motorbike' },
//   { value: 'taxi',       Icon: CarIcon,   label: 'Car / Taxi' },
//   { value: 'truck',      Icon: TruckIcon, label: 'Truck' },
// ];

// // Which vehicle types are allowed per delivery class
// const VEHICLES_FOR_CLASS = {
//   standard: ['motorbike', 'taxi'],
//   midsize:  ['motorbike', 'taxi'],
//   big:      ['taxi', 'truck'],
//   large:    ['truck'],
// };

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function SectionLabel({ children }) {
//   return (
//     <Typography variant="caption" sx={{
//       display: 'block', fontWeight: 800, letterSpacing: 1.1,
//       textTransform: 'uppercase', color: 'text.disabled', mb: 1, mt: 0.5,
//     }}>
//       {children}
//     </Typography>
//   );
// }

// function SelectCard({ selected, onClick, emoji, label, sub, disabled }) {
//   return (
//     <Paper
//       onClick={disabled ? undefined : onClick}
//       elevation={0}
//       sx={{
//         p: 1.75, mb: 1.25, cursor: disabled ? 'not-allowed' : 'pointer',
//         border: '2px solid',
//         borderColor: selected ? AMBER : 'divider',
//         bgcolor: selected ? `rgba(245,158,11,0.1)` : 'rgba(255,255,255,0.55)',
//         borderRadius: 2.5, transition: 'all 0.14s ease',
//         opacity: disabled ? 0.45 : 1,
//         '&:hover': disabled ? {} : { borderColor: AMBER, transform: 'translateY(-1px)', boxShadow: `0 4px 14px rgba(245,158,11,0.18)` },
//         display: 'flex', alignItems: 'center', gap: 1.5,
//       }}
//     >
//       <Box sx={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{emoji}</Box>
//       <Box sx={{ flex: 1, minWidth: 0 }}>
//         <Typography variant="subtitle2" fontWeight={700} noWrap>{label}</Typography>
//         {sub && <Typography variant="caption" color="text.secondary" noWrap>{sub}</Typography>}
//       </Box>
//       {selected && <CheckIcon sx={{ color: AMBER, flexShrink: 0 }} />}
//     </Paper>
//   );
// }

// function VehicleChip({ value, Icon, label, selected, onClick, disabled }) {
//   return (
//     <Chip
//       icon={<Icon sx={{ fontSize: 16, color: selected ? '#fff' : disabled ? 'text.disabled' : 'text.secondary' }} />}
//       label={label}
//       onClick={disabled ? undefined : onClick}
//       variant={selected ? 'filled' : 'outlined'}
//       sx={{
//         fontWeight: selected ? 700 : 500,
//         bgcolor: selected ? AMBER : 'transparent',
//         borderColor: selected ? AMBER : disabled ? 'divider' : 'divider',
//         color: selected ? '#fff' : disabled ? 'text.disabled' : 'text.primary',
//         opacity: disabled ? 0.4 : 1,
//         cursor: disabled ? 'not-allowed' : 'pointer',
//         '&:hover': disabled ? {} : { bgcolor: selected ? AMBER2 : `rgba(245,158,11,0.08)` },
//       }}
//     />
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────

// export function DeliveryOptionsSheet({
//   pickupLocation,
//   dropoffLocation,
//   routeInfo,
//   onClose,
//   onConfirmDelivery,
//   loading = false,
//   bottomPadding = 80,
//   // fetchEstimates(payload) → Promise<{ estimates: [...], route: {...} }>
//   fetchEstimates,
// }) {
//   // ── Delivery mode ─────────────────────────────────────────────────────
//   const [deliveryMode, setDeliveryMode] = useState('to_someone'); // 'to_someone' | 'with_me'

//   // ── Recipient ─────────────────────────────────────────────────────────
//   const [recipientName,  setRecipientName]  = useState('');
//   const [recipientPhone, setRecipientPhone] = useState('');

//   // ── Package type ──────────────────────────────────────────────────────
//   // 'package' | 'big_item' | 'cargo' | null
//   const [packageType, setPackageType] = useState(null);

//   // Package options
//   const [isFragile, setIsFragile] = useState(false);

//   // Big item options
//   const [itemWeight,    setItemWeight]    = useState('');
//   const [unknownWeight, setUnknownWeight] = useState(false);
//   const [bigItemFit,    setBigItemFit]    = useState(null); // 'car' | 'truck'

//   // ── Vehicle preference (optional) ────────────────────────────────────
//   const [vehiclePreference, setVehiclePreference] = useState(null);

//   // ── Estimates ─────────────────────────────────────────────────────────
//   const [estimates,       setEstimates]       = useState([]);
//   const [loadingEst,      setLoadingEst]      = useState(false);
//   const [estError,        setEstError]        = useState(null);
//   const [selectedClass,   setSelectedClass]   = useState(null);

//   // ── Payment ───────────────────────────────────────────────────────────
//   const [paymentMethod, setPaymentMethod] = useState('cash');

//   // ── Derived: the class key to request from backend ───────────────────
//   const resolvedClassKey = (() => {
//     if (packageType === 'package')  return 'standard';
//     if (packageType === 'big_item') return bigItemFit === 'truck' ? 'big' : bigItemFit === 'car' ? 'midsize' : null;
//     if (packageType === 'cargo')    return 'large';
//     return null;
//   })();

//   // ── Auto-fetch estimates when we have enough info ─────────────────────
//   const canFetchEstimates = !!(
//     pickupLocation && dropoffLocation && resolvedClassKey && fetchEstimates
//   );

//   const doFetchEstimates = useCallback(async () => {
//     if (!canFetchEstimates) return;
//     setLoadingEst(true);
//     setEstError(null);
//     setSelectedClass(null);
//     try {
//       const result = await fetchEstimates({
//         pickupLocation,
//         dropoffLocation,
//         deliveryClassName:  resolvedClassKey,
//         isFragile:          packageType === 'package' ? isFragile : false,
//         weightKg:           packageType === 'big_item' ? parseFloat(itemWeight) || null : null,
//         vehicleTypePreference: vehiclePreference,
//       });
//       setEstimates(result?.estimates ?? []);
//       if (result?.estimates?.length === 1) setSelectedClass(result.estimates[0]);
//     } catch (e) {
//       setEstError('Could not load delivery options. Please try again.');
//     } finally {
//       setLoadingEst(false);
//     }
//   }, [canFetchEstimates, pickupLocation, dropoffLocation, resolvedClassKey, isFragile, itemWeight, vehiclePreference, packageType]);

//   useEffect(() => {
//     if (canFetchEstimates) doFetchEstimates();
//     else { setEstimates([]); setSelectedClass(null); }
//   }, [canFetchEstimates, doFetchEstimates]);

//   // ── Validation ────────────────────────────────────────────────────────
//   const recipientOk = deliveryMode === 'with_me' || (recipientName.trim() && recipientPhone.trim());
//   const packageOk   = (() => {
//     if (!packageType) return false;
//     if (packageType === 'big_item') return !!(bigItemFit && (unknownWeight || itemWeight));
//     return true;
//   })();
//   const canConfirm  = !!(recipientOk && packageOk && selectedClass && !loading);

//   // ── Confirm ───────────────────────────────────────────────────────────
//   const handleConfirm = () => {
//     if (!canConfirm) return;
//     onConfirmDelivery({
//       deliveryMode,
//       recipient: deliveryMode === 'to_someone'
//         ? { name: recipientName.trim(), phone: recipientPhone.trim() }
//         : null,
//       packageType,
//       isFragile: packageType === 'package' ? isFragile : false,
//       weightKg:  packageType === 'big_item' ? (unknownWeight ? null : parseFloat(itemWeight) || null) : null,
//       bigItemFit,
//       vehiclePreference,
//       deliveryClass:   selectedClass,
//       paymentMethod,
//       totalFare: selectedClass?.totalFare ?? 0,
//     });
//   };

//   // ── Render ────────────────────────────────────────────────────────────
//   return (
//     <Box sx={{
//       display: 'flex', flexDirection: 'column',
//       height: '100%', minHeight: 0,
//       bgcolor: '#FBF3E8',
//       width: '100%', boxSizing: 'border-box',
//       overflow: 'hidden',
//     }}>

//       {/* ① HEADER */}
//       <Box sx={{
//         ...HEADER_SX,
//         borderTopLeftRadius: 24, borderTopRightRadius: 24,
//         flexShrink: 0, position: 'relative', overflow: 'hidden',
//         '&::before': {
//           content: '""', position: 'absolute',
//           top: -30, right: -30, width: 120, height: 120,
//           borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)',
//           pointerEvents: 'none',
//         },
//       }}>
//         <BottomSheetDragPill colored />
//         <Box sx={{ px: 3, pb: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
//           <Box sx={{ flex: 1, pr: 1 }}>
//             <Typography variant="h6" sx={{
//               fontWeight: 900, color: 'white', fontSize: '1.15rem',
//               letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.15)',
//               mb: routeInfo ? 0.5 : 0,
//             }}>
//               Deliver
//             </Typography>
//             {routeInfo && (
//               <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.78rem' }}>
//                 📍 {routeInfo.distance}&nbsp;&nbsp;·&nbsp;&nbsp;⏱ {routeInfo.duration}
//               </Typography>
//             )}
//           </Box>
//           <IconButton onClick={onClose} size="small" sx={{
//             bgcolor: 'rgba(255,255,255,0.2)', color: 'white', flexShrink: 0,
//             '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
//           }}>
//             <CloseIcon fontSize="small" />
//           </IconButton>
//         </Box>
//       </Box>

//       {/* ② SCROLL AREA */}
//       <Box sx={{
//         flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
//         scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
//         p: 2, pb: 1, boxSizing: 'border-box', bgcolor: '#FBF3E8',
//       }}>

//         {/* ─ Delivery mode ─────────────────────────────────────────── */}
//         <SectionLabel>Deliver</SectionLabel>
//         <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
//           {[
//             { value: 'to_someone', emoji: '🧑', label: 'To someone' },
//             { value: 'with_me',    emoji: '🚶', label: 'With me' },
//           ].map(({ value, emoji, label }) => (
//             <Paper
//               key={value}
//               onClick={() => setDeliveryMode(value)}
//               elevation={0}
//               sx={{
//                 flex: 1, p: 1.5, cursor: 'pointer', border: '2px solid',
//                 borderColor: deliveryMode === value ? AMBER : 'divider',
//                 bgcolor: deliveryMode === value ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.55)',
//                 borderRadius: 2.5, transition: 'all 0.14s',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
//                 '&:hover': { borderColor: AMBER },
//               }}
//             >
//               <Typography sx={{ fontSize: '1.1rem' }}>{emoji}</Typography>
//               <Typography variant="body2" fontWeight={deliveryMode === value ? 700 : 500}>{label}</Typography>
//               {deliveryMode === value && <CheckIcon sx={{ fontSize: 15, color: AMBER, ml: 0.5 }} />}
//             </Paper>
//           ))}
//         </Box>

//         {/* ─ Recipient info ─────────────────────────────────────────── */}
//         <Collapse in={deliveryMode === 'to_someone'}>
//           <Box sx={{ mb: 2 }}>
//             <SectionLabel>Recipient</SectionLabel>
//             <TextField
//               fullWidth size="small" label="Recipient's name" value={recipientName}
//               onChange={(e) => setRecipientName(e.target.value)}
//               InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
//               sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
//             />
//             <TextField
//               fullWidth size="small" label="Recipient's phone number" value={recipientPhone}
//               onChange={(e) => setRecipientPhone(e.target.value)}
//               type="tel"
//               InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
//               sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
//             />
//           </Box>
//         </Collapse>

//         {/* ─ Package type ───────────────────────────────────────────── */}
//         <SectionLabel>What are you sending?</SectionLabel>
//         <SelectCard
//           selected={packageType === 'package'} emoji="📦"
//           label="Package" sub="Standard parcel, envelope, small item"
//           onClick={() => { setPackageType('package'); setBigItemFit(null); }}
//         />
//         <SelectCard
//           selected={packageType === 'big_item'} emoji="🛍️"
//           label="Big item" sub="Furniture, appliance, multiple boxes"
//           onClick={() => setPackageType('big_item')}
//         />
//         <SelectCard
//           selected={packageType === 'cargo'} emoji="🏗️"
//           label="Cargo" sub="Heavy / oversized freight"
//           onClick={() => { setPackageType('cargo'); setBigItemFit(null); }}
//         />

//         {/* Package options — fragile */}
//         <Collapse in={packageType === 'package'}>
//           <Box sx={{ mb: 1.5, mt: 0.5 }}>
//             <Paper elevation={0} sx={{
//               px: 2, py: 1.25, border: '1.5px solid',
//               borderColor: isFragile ? '#EF4444' : 'divider',
//               borderRadius: 2.5, bgcolor: isFragile ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.55)',
//               display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//               cursor: 'pointer', transition: 'all 0.14s',
//             }} onClick={() => setIsFragile(p => !p)}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <FragileIcon sx={{ fontSize: 20, color: isFragile ? '#EF4444' : 'text.disabled' }} />
//                 <Box>
//                   <Typography variant="body2" fontWeight={600}>Fragile item</Typography>
//                   <Typography variant="caption" color="text.secondary">Extra care during handling</Typography>
//                 </Box>
//               </Box>
//               <Switch
//                 checked={isFragile}
//                 onChange={(e) => setIsFragile(e.target.checked)}
//                 size="small"
//                 sx={{ '& .MuiSwitch-thumb': { bgcolor: isFragile ? '#EF4444' : undefined } }}
//                 onClick={(e) => e.stopPropagation()}
//               />
//             </Paper>
//           </Box>
//         </Collapse>

//         {/* Big item options — weight + vehicle fit */}
//         <Collapse in={packageType === 'big_item'}>
//           <Box sx={{ mb: 2, mt: 0.5 }}>
//             <TextField
//               fullWidth size="small" label="Weight of item/items (kg)"
//               value={itemWeight}
//               onChange={(e) => setItemWeight(e.target.value.replace(/[^0-9.]/g, ''))}
//               type="number"
//               disabled={unknownWeight}
//               inputProps={{ min: 0.1, step: 0.5 }}
//               InputProps={{ startAdornment: <InputAdornment position="start"><WeightIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>, endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
//               sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
//             />

//             {/* Unknown weight checkbox */}
//             <Box
//               onClick={() => { setUnknownWeight(p => !p); if (!unknownWeight) setItemWeight(''); }}
//               sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: unknownWeight ? 1 : 1.5, px: 0.5 }}
//             >
//               <Box sx={{
//                 width: 18, height: 18, borderRadius: 0.75, border: '2px solid',
//                 borderColor: unknownWeight ? AMBER : 'text.disabled',
//                 bgcolor: unknownWeight ? AMBER : 'transparent',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.14s',
//               }}>
//                 {unknownWeight && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
//               </Box>
//               <Typography variant="body2" sx={{ color: 'text.secondary', userSelect: 'none' }}>
//                 I don't know the weight of the item/items
//               </Typography>
//             </Box>

//             <Collapse in={unknownWeight}>
//               <Alert severity="warning" icon={<WeightIcon sx={{ fontSize: 18 }} />} sx={{ mb: 1.5, borderRadius: 2, py: 0.5, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
//                 If it's a heavy item, the deliverer might decline the order.
//               </Alert>
//             </Collapse>

//             <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', mb: 1 }}>
//               Does it fit in a car?
//             </Typography>
//             <Box sx={{ display: 'flex', gap: 1 }}>
//               {[
//                 { value: 'car',   emoji: '🚗', label: 'Yes, fits in a car' },
//                 { value: 'truck', emoji: '🚚', label: 'No, needs a truck' },
//               ].map(({ value, emoji, label }) => (
//                 <Paper
//                   key={value}
//                   onClick={() => setBigItemFit(value)}
//                   elevation={0}
//                   sx={{
//                     flex: 1, p: 1.25, cursor: 'pointer', border: '2px solid',
//                     borderColor: bigItemFit === value ? AMBER : 'divider',
//                     bgcolor: bigItemFit === value ? `rgba(245,158,11,0.07)` : 'transparent',
//                     borderRadius: 2.5, transition: 'all 0.14s',
//                     display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4,
//                     '&:hover': { borderColor: AMBER },
//                   }}
//                 >
//                   <Typography sx={{ fontSize: '1.4rem' }}>{emoji}</Typography>
//                   <Typography variant="caption" fontWeight={bigItemFit === value ? 700 : 500} textAlign="center" sx={{ lineHeight: 1.2 }}>{label}</Typography>
//                 </Paper>
//               ))}
//             </Box>
//           </Box>
//         </Collapse>

//         {/* ─ Vehicle preference ─────────────────────────────────────── */}
//         {packageType && (
//           <Box sx={{ mb: 2 }}>
//             <SectionLabel>Deliver by <Typography component="span" variant="caption" color="text.secondary" sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</Typography></SectionLabel>
//             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
//               {VEHICLE_OPTIONS.map(({ value, Icon, label }) => {
//                 // Only show vehicles allowed for the resolved class
//                 const allowed = resolvedClassKey ? (VEHICLES_FOR_CLASS[resolvedClassKey] ?? VEHICLE_OPTIONS.map(v => v.value)) : VEHICLE_OPTIONS.map(v => v.value);
//                 const isAllowed = allowed.includes(value);
//                 return (
//                   <VehicleChip
//                     key={value} value={value} Icon={Icon} label={label}
//                     selected={vehiclePreference === value}
//                     disabled={!isAllowed}
//                     onClick={() => {
//                       if (!isAllowed) return;
//                       setVehiclePreference(p => p === value ? null : value);
//                     }}
//                   />
//                 );
//               })}
//             </Box>
//             {vehiclePreference && (
//               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
//                 Only drivers with a {VEHICLE_OPTIONS.find(v => v.value === vehiclePreference)?.label} will be matched.
//               </Typography>
//             )}
//           </Box>
//         )}

//         {/* ─ Delivery class estimates ───────────────────────────────── */}
//         {canFetchEstimates && (
//           <Box sx={{ mb: 2 }}>
//             <SectionLabel>Delivery option</SectionLabel>

//             {loadingEst && (
//               <Box sx={{ textAlign: 'center', py: 3 }}>
//                 <CircularProgress size={32} sx={{ color: AMBER }} />
//                 <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Finding options…</Typography>
//               </Box>
//             )}

//             {estError && !loadingEst && (
//               <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }} action={
//                 <Button size="small" onClick={doFetchEstimates}>Retry</Button>
//               }>{estError}</Alert>
//             )}

//             {!loadingEst && !estError && estimates.map((est, i) => {
//               const displayInfo = CLASS_DISPLAY[est.deliveryClassName] ?? { emoji: '📦', label: est.deliveryClassName, sub: '' };
//               const isSelected  = selectedClass?.deliveryClassId === est.deliveryClassId;
//               return (
//                 <motion.div key={est.deliveryClassId ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
//                   <Paper
//                     onClick={() => setSelectedClass(est)}
//                     elevation={0}
//                     sx={{
//                       p: 2, mb: 1.25, cursor: 'pointer', border: '2px solid',
//                       borderColor: isSelected ? AMBER : 'divider',
//                       bgcolor: isSelected ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.55)',
//                       borderRadius: 2.5, transition: 'all 0.14s',
//                       '&:hover': { borderColor: AMBER, transform: 'translateY(-1px)', boxShadow: `0 4px 14px rgba(245,158,11,0.15)` },
//                     }}
//                   >
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                       <Box sx={{ fontSize: '1.9rem', lineHeight: 1, flexShrink: 0 }}>{displayInfo.emoji}</Box>
//                       <Box sx={{ flex: 1, minWidth: 0 }}>
//                         <Typography variant="subtitle2" fontWeight={700}>{displayInfo.label}</Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
//                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
//                             <TimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
//                             <Typography variant="caption" color="text.secondary">{est.estimatedDuration} min</Typography>
//                           </Box>
//                           {est.maxWeightKg && (
//                             <Typography variant="caption" color="text.secondary">up to {est.maxWeightKg} kg</Typography>
//                           )}
//                         </Box>
//                       </Box>
//                       <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
//                         <Typography variant="h6" fontWeight={800} sx={{ color: AMBER, fontSize: '1rem' }}>
//                           K{(est.totalFare ?? 0).toFixed(2)}
//                         </Typography>
//                         {est.fragileSurcharge > 0 && (
//                           <Typography variant="caption" color="text.secondary">incl. fragile fee</Typography>
//                         )}
//                       </Box>
//                       {isSelected && <CheckIcon sx={{ color: AMBER, flexShrink: 0 }} />}
//                     </Box>
//                   </Paper>
//                 </motion.div>
//               );
//             })}

//             {!loadingEst && !estError && estimates.length === 0 && canFetchEstimates && (
//               <Alert severity="info" sx={{ borderRadius: 2 }}>No delivery options available for this route.</Alert>
//             )}
//           </Box>
//         )}

//         {/* ─ Payment method ─────────────────────────────────────────── */}
//         {selectedClass && (
//           <Box sx={{ mb: 2 }}>
//             <SectionLabel>Payment</SectionLabel>
//             <Box sx={{ display: 'flex', gap: 1 }}>
//               {[
//                 { value: 'cash',    label: 'Cash',    Icon: CashIcon },
//                 { value: 'okrapay', label: 'OkraPay', Icon: CardIcon },
//               ].map(({ value, label, Icon }) => (
//                 <Paper
//                   key={value}
//                   onClick={() => setPaymentMethod(value)}
//                   elevation={0}
//                   sx={{
//                     flex: 1, p: 1.5, cursor: 'pointer', border: '2px solid',
//                     borderColor: paymentMethod === value ? AMBER : 'divider',
//                     bgcolor: paymentMethod === value ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.55)',
//                     borderRadius: 2.5, transition: 'all 0.14s',
//                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
//                     '&:hover': { borderColor: AMBER },
//                   }}
//                 >
//                   <Icon sx={{ fontSize: 18, color: paymentMethod === value ? AMBER : 'text.secondary' }} />
//                   <Typography variant="body2" fontWeight={paymentMethod === value ? 700 : 500}>{label}</Typography>
//                 </Paper>
//               ))}
//             </Box>
//           </Box>
//         )}

//         <Box sx={{ height: 8 }} />
//       </Box>

//       {/* ③ FOOTER */}
//       <AnimatePresence>
//         {selectedClass && (
//           <motion.div
//             initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }}
//             style={{ flexShrink: 0, width: '100%' }}
//           >
//             <Box sx={{
//               px: 2.5, pt: 1.5, pb: `${bottomPadding}px`,
//               borderTop: '1px solid', borderColor: 'divider',
//               bgcolor: '#F5E8D5', width: '100%', boxSizing: 'border-box',
//             }}>
//               {/* Fare breakdown */}
//               <Box sx={{ mb: 1.5 }}>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
//                   <Typography variant="body2" color="text.secondary">Base fare</Typography>
//                   <Typography variant="body2" fontWeight={600}>K{(selectedClass.baseFare ?? 0).toFixed(2)}</Typography>
//                 </Box>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
//                   <Typography variant="body2" color="text.secondary">Distance & time</Typography>
//                   <Typography variant="body2" fontWeight={600}>K{((selectedClass.distanceFare ?? 0) + (selectedClass.timeFare ?? 0)).toFixed(2)}</Typography>
//                 </Box>
//                 {selectedClass.fragileSurcharge > 0 && (
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
//                     <Typography variant="body2" color="text.secondary">Fragile handling</Typography>
//                     <Typography variant="body2" fontWeight={600}>K{(selectedClass.fragileSurcharge ?? 0).toFixed(2)}</Typography>
//                   </Box>
//                 )}
//                 <Divider sx={{ my: 0.75 }} />
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                   <Typography variant="h6" fontWeight={800}>Total</Typography>
//                   <Typography variant="h6" fontWeight={800} sx={{ color: AMBER }}>K{(selectedClass.totalFare ?? 0).toFixed(2)}</Typography>
//                 </Box>
//               </Box>

//               <Button
//                 fullWidth variant="contained" size="large"
//                 onClick={handleConfirm}
//                 disabled={!canConfirm}
//                 sx={{
//                   height: 52, fontWeight: 800, fontSize: '0.95rem',
//                   borderRadius: 3, textTransform: 'none',
//                   background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER2} 100%)`,
//                   boxShadow: '0 4px 18px rgba(245,158,11,0.4)',
//                   '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 28px rgba(245,158,11,0.5)' },
//                   '&:active': { transform: 'none' },
//                   '&:disabled': { opacity: 0.5 },
//                 }}
//               >
//                 {loading
//                   ? <CircularProgress size={22} color="inherit" />
//                   : `Confirm Delivery · K${(selectedClass.totalFare ?? 0).toFixed(2)}`}
//               </Button>

//               {!recipientOk && (
//                 <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
//                   Please fill in the recipient's name and phone number.
//                 </Typography>
//               )}
//             </Box>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </Box>
//   );
// }

// export default DeliveryOptionsSheet;
'use client'
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, CircularProgress, TextField,
  IconButton, Divider, Chip, Alert, Paper, Switch,
  FormControlLabel, InputAdornment, Collapse,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import {
  Close as CloseIcon, CheckCircle as CheckIcon,
  AccessTime as TimeIcon, DirectionsBike as BikeIcon,
  DirectionsCar as CarIcon, LocalShipping as TruckIcon,
  AccountBalanceWallet as CashIcon, CreditCard as CardIcon,
  Phone as PhoneIcon, Person as PersonIcon,
  Warning as FragileIcon, FitnessCenter as WeightIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';

// ─── Constants ────────────────────────────────────────────────────────────────
const AMBER  = '#F59E0B';
const AMBER2 = '#D97706';

const HEADER_SX = {
  background: 'linear-gradient(160deg, #92400E 0%, #B45309 100%)',
  backgroundSize: '300% 300%',
  animation: 'deliverySendWave 7s ease infinite',
  '@keyframes deliverySendWave': {
    '0%':   { backgroundPosition: '0% 50%' },
    '50%':  { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
};

const PACKAGE_TO_CLASS = {
  package:        'standard',
  big_item_car:   'midsize',
  big_item_truck: 'big',
  cargo:          'large',
};

const CLASS_DISPLAY = {
  standard: { emoji: '📦', label: 'Package',  sub: 'Up to standard size & weight' },
  midsize:  { emoji: '🛍️', label: 'Big Item', sub: 'Fits in a car' },
  big:      { emoji: '🚚', label: 'Big Item', sub: 'Needs a truck' },
  large:    { emoji: '🏗️', label: 'Cargo',    sub: 'Large / heavy cargo' },
};

const VEHICLE_OPTIONS = [
  { value: 'motorbike', Icon: BikeIcon,  label: 'Motorbike' },
  { value: 'taxi',      Icon: CarIcon,   label: 'Car / Taxi' },
  { value: 'truck',     Icon: TruckIcon, label: 'Truck' },
];

const VEHICLES_FOR_CLASS = {
  standard: ['motorbike', 'taxi'],
  midsize:  ['motorbike', 'taxi'],
  big:      ['taxi', 'truck'],
  large:    ['truck'],
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <Typography variant="caption" sx={{
      display: 'block', fontWeight: 800, letterSpacing: 1.1,
      textTransform: 'uppercase', color: 'text.disabled', mb: 1, mt: 0.5,
    }}>
      {children}
    </Typography>
  );
}

function SelectCard({ selected, onClick, emoji, label, sub, disabled }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper onClick={disabled ? undefined : onClick} elevation={0} sx={{
      p: 1.75, mb: 1.25, cursor: disabled ? 'not-allowed' : 'pointer',
      border: '2px solid',
      borderColor: selected ? AMBER : isDark ? alpha('#fff', 0.12) : 'divider',
      bgcolor: selected
        ? alpha(AMBER, 0.12)
        : isDark ? alpha('#fff', 0.04) : 'rgba(255,255,255,0.55)',
      borderRadius: 2.5, transition: 'all 0.14s ease',
      opacity: disabled ? 0.45 : 1,
      '&:hover': disabled ? {} : { borderColor: AMBER, transform: 'translateY(-1px)', boxShadow: `0 4px 14px ${alpha(AMBER, 0.18)}` },
      display: 'flex', alignItems: 'center', gap: 1.5,
    }}>
      <Box sx={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{emoji}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap color="text.primary">{label}</Typography>
        {sub && <Typography variant="caption" color="text.secondary" noWrap>{sub}</Typography>}
      </Box>
      {selected && <CheckIcon sx={{ color: AMBER, flexShrink: 0 }} />}
    </Paper>
  );
}

function VehicleChip({ value, Icon, label, selected, onClick, disabled }) {
  return (
    <Chip
      icon={<Icon sx={{ fontSize: 16, color: selected ? '#fff' : disabled ? 'text.disabled' : 'text.secondary' }} />}
      label={label}
      onClick={disabled ? undefined : onClick}
      variant={selected ? 'filled' : 'outlined'}
      sx={{
        fontWeight: selected ? 700 : 500,
        bgcolor: selected ? AMBER : 'transparent',
        borderColor: selected ? AMBER : 'divider',
        color: selected ? '#fff' : disabled ? 'text.disabled' : 'text.primary',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        '&:hover': disabled ? {} : { bgcolor: selected ? AMBER2 : alpha(AMBER, 0.08) },
      }}
    />
  );
}

// ── Shared TextField sx — fixes invisible text in dark mode ──────────────────
const textFieldSx = {
  mb: 1.5,
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    color: 'text.primary',                       // ← input text colour
    '& input': { color: 'text.primary' },        // ← explicit for dark mode
    '& fieldset': { borderColor: 'divider' },
    '&:hover fieldset': { borderColor: AMBER },
    '&.Mui-focused fieldset': { borderColor: AMBER },
  },
  '& .MuiInputLabel-root': { color: 'text.secondary' },
  '& .MuiInputLabel-root.Mui-focused': { color: AMBER },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function DeliveryOptionsSheet({
  pickupLocation, dropoffLocation, routeInfo,
  onClose, onConfirmDelivery, loading = false,
  bottomPadding = 80, fetchEstimates,
}) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // ── Palette helpers derived once ─────────────────────────────────────
  const bgPage    = isDark ? '#1C1207' : '#FBF3E8';
  const bgFooter  = isDark ? '#1E1508' : '#F5E8D5';
  const bgCard    = isDark ? alpha('#fff', 0.04)  : 'rgba(255,255,255,0.55)';
  const borderDim = isDark ? alpha('#fff', 0.12)  : 'divider';

  // ── State (unchanged) ────────────────────────────────────────────────
  const [deliveryMode,      setDeliveryMode]      = useState('to_someone');
  const [recipientName,     setRecipientName]      = useState('');
  const [recipientPhone,    setRecipientPhone]     = useState('');
  const [packageType,       setPackageType]        = useState(null);
  const [isFragile,         setIsFragile]          = useState(false);
  const [itemWeight,        setItemWeight]         = useState('');
  const [unknownWeight,     setUnknownWeight]      = useState(false);
  const [bigItemFit,        setBigItemFit]         = useState(null);
  const [vehiclePreference, setVehiclePreference]  = useState(null);
  const [estimates,         setEstimates]          = useState([]);
  const [loadingEst,        setLoadingEst]         = useState(false);
  const [estError,          setEstError]           = useState(null);
  const [selectedClass,     setSelectedClass]      = useState(null);
  const [paymentMethod,     setPaymentMethod]      = useState('cash');

  const resolvedClassKey = (() => {
    if (packageType === 'package')  return 'standard';
    if (packageType === 'big_item') return bigItemFit === 'truck' ? 'big' : bigItemFit === 'car' ? 'midsize' : null;
    if (packageType === 'cargo')    return 'large';
    return null;
  })();

  const canFetchEstimates = !!(pickupLocation && dropoffLocation && resolvedClassKey && fetchEstimates);

  const doFetchEstimates = useCallback(async () => {
    if (!canFetchEstimates) return;
    setLoadingEst(true); setEstError(null); setSelectedClass(null);
    try {
      const result = await fetchEstimates({
        pickupLocation, dropoffLocation,
        deliveryClassName: resolvedClassKey,
        isFragile: packageType === 'package' ? isFragile : false,
        weightKg:  packageType === 'big_item' ? parseFloat(itemWeight) || null : null,
        vehicleTypePreference: vehiclePreference,
      });
      setEstimates(result?.estimates ?? []);
      if (result?.estimates?.length === 1) setSelectedClass(result.estimates[0]);
    } catch { setEstError('Could not load delivery options. Please try again.'); }
    finally { setLoadingEst(false); }
  }, [canFetchEstimates, pickupLocation, dropoffLocation, resolvedClassKey, isFragile, itemWeight, vehiclePreference, packageType]);

  useEffect(() => {
    if (canFetchEstimates) doFetchEstimates();
    else { setEstimates([]); setSelectedClass(null); }
  }, [canFetchEstimates, doFetchEstimates]);

  const recipientOk = deliveryMode === 'with_me' || (recipientName.trim() && recipientPhone.trim());
  const packageOk   = (() => {
    if (!packageType) return false;
    if (packageType === 'big_item') return !!(bigItemFit && (unknownWeight || itemWeight));
    return true;
  })();
  const canConfirm = !!(recipientOk && packageOk && selectedClass && !loading);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirmDelivery({
      deliveryMode,
      recipient: deliveryMode === 'to_someone' ? { name: recipientName.trim(), phone: recipientPhone.trim() } : null,
      packageType,
      isFragile: packageType === 'package' ? isFragile : false,
      weightKg:  packageType === 'big_item' ? (unknownWeight ? null : parseFloat(itemWeight) || null) : null,
      bigItemFit, vehiclePreference,
      deliveryClass: selectedClass, paymentMethod,
      totalFare: selectedClass?.totalFare ?? 0,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: bgPage, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* ① HEADER */}
      <Box sx={{
        ...HEADER_SX,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        flexShrink: 0, position: 'relative', overflow: 'hidden',
        '&::before': { content: '""', position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' },
      }}>
        <BottomSheetDragPill colored />
        <Box sx={{ px: 3, pb: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, pr: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontSize: '1.15rem', letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.15)', mb: routeInfo ? 0.5 : 0 }}>Deliver</Typography>
            {routeInfo && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.78rem' }}>
                📍 {routeInfo.distance}&nbsp;&nbsp;·&nbsp;&nbsp;⏱ {routeInfo.duration}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', flexShrink: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* ② SCROLL AREA */}
      <Box sx={{ flex: 1, height: 0, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, p: 2, pb: 1, boxSizing: 'border-box', bgcolor: bgPage }}>

        {/* Delivery mode */}
        <SectionLabel>Deliver</SectionLabel>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[{ value: 'to_someone', emoji: '🧑', label: 'To someone' }, { value: 'with_me', emoji: '🚶', label: 'With me' }].map(({ value, emoji, label }) => (
            <Paper key={value} onClick={() => setDeliveryMode(value)} elevation={0} sx={{
              flex: 1, p: 1.5, cursor: 'pointer', border: '2px solid',
              borderColor: deliveryMode === value ? AMBER : borderDim,
              bgcolor: deliveryMode === value ? alpha(AMBER, 0.12) : bgCard,
              borderRadius: 2.5, transition: 'all 0.14s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
              '&:hover': { borderColor: AMBER },
            }}>
              <Typography sx={{ fontSize: '1.1rem' }}>{emoji}</Typography>
              <Typography variant="body2" fontWeight={deliveryMode === value ? 700 : 500} color="text.primary">{label}</Typography>
              {deliveryMode === value && <CheckIcon sx={{ fontSize: 15, color: AMBER, ml: 0.5 }} />}
            </Paper>
          ))}
        </Box>

        {/* Recipient */}
        <Collapse in={deliveryMode === 'to_someone'}>
          <Box sx={{ mb: 2 }}>
            <SectionLabel>Recipient</SectionLabel>
            <TextField
              fullWidth size="small" label="Recipient's name" value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
              sx={textFieldSx}
            />
            <TextField
              fullWidth size="small" label="Recipient's phone number" value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              type="tel"
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
              sx={{ ...textFieldSx, mb: 0 }}
            />
          </Box>
        </Collapse>

        {/* Package type */}
        <SectionLabel>What are you sending?</SectionLabel>
        <SelectCard selected={packageType === 'package'} emoji="📦" label="Package" sub="Standard parcel, envelope, small item" onClick={() => { setPackageType('package'); setBigItemFit(null); }} />
        <SelectCard selected={packageType === 'big_item'} emoji="🛍️" label="Big item" sub="Furniture, appliance, multiple boxes" onClick={() => setPackageType('big_item')} />
        <SelectCard selected={packageType === 'cargo'} emoji="🏗️" label="Cargo" sub="Heavy / oversized freight" onClick={() => { setPackageType('cargo'); setBigItemFit(null); }} />

        {/* Fragile toggle */}
        <Collapse in={packageType === 'package'}>
          <Box sx={{ mb: 1.5, mt: 0.5 }}>
            <Paper elevation={0} sx={{
              px: 2, py: 1.25, border: '1.5px solid',
              borderColor: isFragile ? '#EF4444' : borderDim,
              borderRadius: 2.5,
              bgcolor: isFragile ? alpha('#EF4444', 0.07) : bgCard,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'all 0.14s',
            }} onClick={() => setIsFragile(p => !p)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FragileIcon sx={{ fontSize: 20, color: isFragile ? '#EF4444' : 'text.disabled' }} />
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary">Fragile item</Typography>
                  <Typography variant="caption" color="text.secondary">Extra care during handling</Typography>
                </Box>
              </Box>
              <Switch checked={isFragile} onChange={(e) => setIsFragile(e.target.checked)} size="small"
                sx={{ '& .MuiSwitch-thumb': { bgcolor: isFragile ? '#EF4444' : undefined } }}
                onClick={(e) => e.stopPropagation()} />
            </Paper>
          </Box>
        </Collapse>

        {/* Big item options */}
        <Collapse in={packageType === 'big_item'}>
          <Box sx={{ mb: 2, mt: 0.5 }}>
            <TextField
              fullWidth size="small" label="Weight of item/items (kg)"
              value={itemWeight}
              onChange={(e) => setItemWeight(e.target.value.replace(/[^0-9.]/g, ''))}
              type="number" disabled={unknownWeight}
              inputProps={{ min: 0.1, step: 0.5 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><WeightIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
                endAdornment:   <InputAdornment position="end">kg</InputAdornment>,
              }}
              sx={textFieldSx}
            />

            <Box onClick={() => { setUnknownWeight(p => !p); if (!unknownWeight) setItemWeight(''); }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: unknownWeight ? 1 : 1.5, px: 0.5 }}>
              <Box sx={{ width: 18, height: 18, borderRadius: 0.75, border: '2px solid', borderColor: unknownWeight ? AMBER : 'text.disabled', bgcolor: unknownWeight ? AMBER : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.14s' }}>
                {unknownWeight && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', userSelect: 'none' }}>I don't know the weight of the item/items</Typography>
            </Box>

            <Collapse in={unknownWeight}>
              <Alert severity="warning" icon={<WeightIcon sx={{ fontSize: 18 }} />} sx={{ mb: 1.5, borderRadius: 2, py: 0.5, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                If it's a heavy item, the deliverer might decline the order.
              </Alert>
            </Collapse>

            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', mb: 1 }}>Does it fit in a car?</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[{ value: 'car', emoji: '🚗', label: 'Yes, fits in a car' }, { value: 'truck', emoji: '🚚', label: 'No, needs a truck' }].map(({ value, emoji, label }) => (
                <Paper key={value} onClick={() => setBigItemFit(value)} elevation={0} sx={{
                  flex: 1, p: 1.25, cursor: 'pointer', border: '2px solid',
                  borderColor: bigItemFit === value ? AMBER : borderDim,
                  bgcolor: bigItemFit === value ? alpha(AMBER, 0.07) : bgCard,
                  borderRadius: 2.5, transition: 'all 0.14s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4,
                  '&:hover': { borderColor: AMBER },
                }}>
                  <Typography sx={{ fontSize: '1.4rem' }}>{emoji}</Typography>
                  <Typography variant="caption" fontWeight={bigItemFit === value ? 700 : 500} textAlign="center" color="text.primary" sx={{ lineHeight: 1.2 }}>{label}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        </Collapse>

        {/* Vehicle preference */}
        {packageType && (
          <Box sx={{ mb: 2 }}>
            <SectionLabel>Deliver by <Typography component="span" variant="caption" color="text.secondary" sx={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</Typography></SectionLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {VEHICLE_OPTIONS.map(({ value, Icon, label }) => {
                const allowed   = resolvedClassKey ? (VEHICLES_FOR_CLASS[resolvedClassKey] ?? VEHICLE_OPTIONS.map(v => v.value)) : VEHICLE_OPTIONS.map(v => v.value);
                const isAllowed = allowed.includes(value);
                return (
                  <VehicleChip key={value} value={value} Icon={Icon} label={label}
                    selected={vehiclePreference === value} disabled={!isAllowed}
                    onClick={() => { if (!isAllowed) return; setVehiclePreference(p => p === value ? null : value); }} />
                );
              })}
            </Box>
            {vehiclePreference && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                Only drivers with a {VEHICLE_OPTIONS.find(v => v.value === vehiclePreference)?.label} will be matched.
              </Typography>
            )}
          </Box>
        )}

        {/* Estimates */}
        {canFetchEstimates && (
          <Box sx={{ mb: 2 }}>
            <SectionLabel>Delivery option</SectionLabel>
            {loadingEst && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={32} sx={{ color: AMBER }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Finding options…</Typography>
              </Box>
            )}
            {estError && !loadingEst && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }} action={<Button size="small" onClick={doFetchEstimates}>Retry</Button>}>{estError}</Alert>
            )}
            {!loadingEst && !estError && estimates.map((est, i) => {
              const displayInfo = CLASS_DISPLAY[est.deliveryClassName] ?? { emoji: '📦', label: est.deliveryClassName, sub: '' };
              const isSelected  = selectedClass?.deliveryClassId === est.deliveryClassId;
              return (
                <motion.div key={est.deliveryClassId ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Paper onClick={() => setSelectedClass(est)} elevation={0} sx={{
                    p: 2, mb: 1.25, cursor: 'pointer', border: '2px solid',
                    borderColor: isSelected ? AMBER : borderDim,
                    bgcolor: isSelected ? alpha(AMBER, 0.12) : bgCard,
                    borderRadius: 2.5, transition: 'all 0.14s',
                    '&:hover': { borderColor: AMBER, transform: 'translateY(-1px)', boxShadow: `0 4px 14px ${alpha(AMBER, 0.15)}` },
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ fontSize: '1.9rem', lineHeight: 1, flexShrink: 0 }}>{displayInfo.emoji}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">{displayInfo.label}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                            <TimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">{est.estimatedDuration} min</Typography>
                          </Box>
                          {est.maxWeightKg && <Typography variant="caption" color="text.secondary">up to {est.maxWeightKg} kg</Typography>}
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ color: AMBER, fontSize: '1rem' }}>K{(est.totalFare ?? 0).toFixed(2)}</Typography>
                        {est.fragileSurcharge > 0 && <Typography variant="caption" color="text.secondary">incl. fragile fee</Typography>}
                      </Box>
                      {isSelected && <CheckIcon sx={{ color: AMBER, flexShrink: 0 }} />}
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
            {!loadingEst && !estError && estimates.length === 0 && canFetchEstimates && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No delivery options available for this route.</Alert>
            )}
          </Box>
        )}

        {/* Payment */}
        {selectedClass && (
          <Box sx={{ mb: 2 }}>
            <SectionLabel>Payment</SectionLabel>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[{ value: 'cash', label: 'Cash', Icon: CashIcon }, { value: 'okrapay', label: 'OkraPay', Icon: CardIcon }].map(({ value, label, Icon }) => (
                <Paper key={value} onClick={() => setPaymentMethod(value)} elevation={0} sx={{
                  flex: 1, p: 1.5, cursor: 'pointer', border: '2px solid',
                  borderColor: paymentMethod === value ? AMBER : borderDim,
                  bgcolor: paymentMethod === value ? alpha(AMBER, 0.12) : bgCard,
                  borderRadius: 2.5, transition: 'all 0.14s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                  '&:hover': { borderColor: AMBER },
                }}>
                  <Icon sx={{ fontSize: 18, color: paymentMethod === value ? AMBER : 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={paymentMethod === value ? 700 : 500} color="text.primary">{label}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ height: 8 }} />
      </Box>

      {/* ③ FOOTER */}
      <AnimatePresence>
        {selectedClass && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.18 }} style={{ flexShrink: 0, width: '100%' }}>
            <Box sx={{
              px: 2.5, pt: 1.5, pb: `${bottomPadding}px`,
              borderTop: '1px solid', borderColor: isDark ? alpha('#fff', 0.1) : 'divider',
              bgcolor: bgFooter, width: '100%', boxSizing: 'border-box',
            }}>
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                  <Typography variant="body2" color="text.secondary">Base fare</Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">K{(selectedClass.baseFare ?? 0).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                  <Typography variant="body2" color="text.secondary">Distance & time</Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">K{((selectedClass.distanceFare ?? 0) + (selectedClass.timeFare ?? 0)).toFixed(2)}</Typography>
                </Box>
                {selectedClass.fragileSurcharge > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography variant="body2" color="text.secondary">Fragile handling</Typography>
                    <Typography variant="body2" fontWeight={600} color="text.primary">K{(selectedClass.fragileSurcharge ?? 0).toFixed(2)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.75 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={800} color="text.primary">Total</Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: AMBER }}>K{(selectedClass.totalFare ?? 0).toFixed(2)}</Typography>
                </Box>
              </Box>

              <Button fullWidth variant="contained" size="large" onClick={handleConfirm} disabled={!canConfirm} sx={{
                height: 52, fontWeight: 800, fontSize: '0.95rem', borderRadius: 3, textTransform: 'none',
                background: `linear-gradient(135deg,${AMBER} 0%,${AMBER2} 100%)`,
                boxShadow: `0 4px 18px ${alpha(AMBER, 0.4)}`,
                '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 8px 28px ${alpha(AMBER, 0.5)}` },
                '&:active': { transform: 'none' },
                '&:disabled': { opacity: 0.5 },
              }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : `Confirm Delivery · K${(selectedClass.totalFare ?? 0).toFixed(2)}`}
              </Button>

              {!recipientOk && (
                <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                  Please fill in the recipient's name and phone number.
                </Typography>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default DeliveryOptionsSheet;