// 'use client';
// // PATH: app/partner/drivers/register/page.jsx
// // Partner-side RIDE driver registration

// import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box, Typography, TextField, Button, Paper, MenuItem,
//   Alert, Chip, CircularProgress, Autocomplete, Snackbar,
//   IconButton, InputAdornment, Radio, Modal, Fade, Backdrop,
//   List, ListItemButton, ListItemText, Divider,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions
// } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import {
//   ArrowBack as BackIcon,
//   Person as PersonIcon,
//   DirectionsCar as CarIcon,
//   Badge as BadgeIcon,
//   CheckCircle as CheckCircleIcon,
//   Lock as LockIcon,
//   Phone as PhoneIcon,
//   Home as HomeIcon,
//   CameraAlt as CameraIcon,
//   Check as CheckIcon,
//   DriveEta as TaxiIcon,
//   DirectionsBus as BusIcon,
//   TwoWheeler as BikeIcon,
//   Description as DocIcon,
//   Edit as EditIcon,
//   Search as SearchIcon,
//   Add as AddNewIcon,
//   Close as CloseIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { apiClient } from '@/lib/api/client';
// import {
//   uploadDocument,
//   saveLicenseInfo,
//   saveNationalIdInfo,
//   saveProofOfAddress,
//   saveVehicleType,
//   saveVehicleDetails,
// } from '@/lib/api/onboarding';
// import { getVehicleMakesAndModels, getAllowedVehicleYears } from '@/lib/api/vehicles';
// import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard';
// import { VehicleColorPicker } from '@/components/ui/VehicleColorPicker';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

// const RIDE_VEHICLE_TYPES = [
//   { value: 'taxi', label: 'Taxi / Sedan', Icon: TaxiIcon, color: '#10B981' },
//   { value: 'bus', label: 'Bus / Minibus', Icon: BusIcon, color: '#3B82F6' },
//   { value: 'motorbike', label: 'Motorbike', Icon: BikeIcon, color: '#F59E0B' },
// ];

// const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2.5 } };
// const monoSx = {
//   '& .MuiOutlinedInput-root': {
//     borderRadius: 2.5,
//     fontFamily: "'JetBrains Mono', monospace",
//     fontWeight: 700, letterSpacing: 1,
//   },
// };
// const TwoCol = ({ children }) => (
//   <Box sx={{
//     display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
//     gap: 2.5, '& > *': { minWidth: 0 },
//   }}>
//     {children}
//   </Box>
// );

// // ─── Add Custom Make/Model Modal ──────────────────────────────────────────────
// function AddMakeModelModal({ open, onClose, onConfirm }) {
//   const [customMake, setCustomMake] = useState('');
//   const [customModel, setCustomModel] = useState('');

//   const handleConfirm = () => {
//     if (!customMake.trim() || !customModel.trim()) return;
//     onConfirm(customMake.trim(), customModel.trim());
//     setCustomMake('');
//     setCustomModel('');
//     onClose();
//   };

//   return (
//     <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 300 } }}>
//       <Fade in={open}>
//         <Box sx={{
//           position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
//           width: { xs: '90%', sm: 420 }, bgcolor: '#1E293B', borderRadius: 3,
//           border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', p: 3,
//         }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
//             <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Add Custom Make & Model</Typography>
//             <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}><CloseIcon fontSize="small" /></IconButton>
//           </Box>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//             <TextField fullWidth label="Vehicle Make" value={customMake} onChange={e => setCustomMake(e.target.value)} placeholder="e.g., Kia, Chery, BYD" sx={fieldSx} autoFocus />
//             <TextField fullWidth label="Vehicle Model" value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="e.g., Sportage, Tiggo, Atto" sx={fieldSx} onKeyDown={e => e.key === 'Enter' && handleConfirm()} />
//             <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
//               <Button fullWidth variant="text" onClick={onClose} sx={{ borderRadius: 2.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel</Button>
//               <Button fullWidth variant="contained" onClick={handleConfirm} disabled={!customMake.trim() || !customModel.trim()}
//                 sx={{ borderRadius: 2.5, fontWeight: 700, background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
//                 Use These
//               </Button>
//             </Box>
//           </Box>
//         </Box>
//       </Fade>
//     </Modal>
//   );
// }

// // ─── Existing Vehicle Search Modal ────────────────────────────────────────────
// function ExistingVehicleSearchModal({ open, onClose, onSelect }) {
//   const [query, setQuery] = useState('');
//   const [results, setResults] = useState([]);
//   const [searching, setSearching] = useState(false);

//   useEffect(() => {
//     if (!open) { setQuery(''); setResults([]); }
//   }, [open]);

//   useEffect(() => {
//     if (!query.trim() || query.length < 2) { setResults([]); return; }
//     const t = setTimeout(async () => {
//       setSearching(true);
//       try {
//         const res = await apiClient.get(
//           `/vehicles?filters[numberPlate][$containsi]=${encodeURIComponent(query)}&pagination[limit]=10&populate=*`
//         );
//         setResults(res?.data ?? res ?? []);
//       } catch { setResults([]); }
//       finally { setSearching(false); }
//     }, 350);
//     return () => clearTimeout(t);
//   }, [query]);

//   return (
//     <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 300 } }}>
//       <Fade in={open}>
//         <Box sx={{
//           position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
//           width: { xs: '92%', sm: 480 }, bgcolor: '#1E293B', borderRadius: 3,
//           border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
//           display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden',
//         }}>
//           <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
//               <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Attach Existing Vehicle</Typography>
//               <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}><CloseIcon fontSize="small" /></IconButton>
//             </Box>
//             <TextField
//               fullWidth placeholder="Search by number plate…"
//               value={query} onChange={e => setQuery(e.target.value)} autoFocus
//               InputProps={{
//                 startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} /></InputAdornment>,
//                 endAdornment: searching ? <InputAdornment position="end"><CircularProgress size={16} sx={{ color: '#10B981' }} /></InputAdornment> : null,
//               }}
//               sx={fieldSx}
//             />
//           </Box>
//           <Box sx={{ overflowY: 'auto', flex: 1 }}>
//             {results.length === 0 && query.length >= 2 && !searching && (
//               <Box sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>No vehicles found</Typography></Box>
//             )}
//             {query.length < 2 && (
//               <Box sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Type at least 2 characters to search</Typography></Box>
//             )}
//             <List disablePadding>
//               {results.map((vehicle, i) => (
//                 <Box key={vehicle.id ?? i}>
//                   <ListItemButton onClick={() => { onSelect(vehicle); onClose(); }} sx={{ px: 3, py: 1.5, '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}>
//                     <ListItemText
//                       primary={<Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', color: '#34D399', letterSpacing: 1.5 }}>{vehicle.numberPlate}</Typography>}
//                       secondary={<Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>{vehicle.make} {vehicle.model} · {vehicle.year} · {vehicle.vehicleType}</Typography>}
//                     />
//                   </ListItemButton>
//                   {i < results.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
//                 </Box>
//               ))}
//             </List>
//           </Box>
//         </Box>
//       </Fade>
//     </Modal>
//   );
// }

// function SectionCard({ icon: Icon, title, subtitle, color = '#059669', locked, completed, onEdit, children }) {
//   return (
//     <Paper elevation={0} sx={{
//       borderRadius: 3.5, mb: 3, overflow: 'hidden',
//       border: `1px solid ${locked ? 'rgba(255,255,255,0.05)' : alpha(color, 0.2)}`,
//       background: locked ? 'rgba(255,255,255,0.015)' : `linear-gradient(145deg, ${alpha(color, 0.06)} 0%, transparent 100%)`,
//       transition: 'border-color 0.3s, background 0.3s',
//     }}>
//       <Box sx={{
//         px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
//         background: locked ? 'rgba(255,255,255,0.03)' : `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
//       }}>
//         <Box sx={{
//           width: 36, height: 36, borderRadius: 2, flexShrink: 0,
//           bgcolor: locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//         }}>
//           {completed ? <CheckIcon sx={{ color: locked ? 'rgba(255,255,255,0.25)' : '#fff', fontSize: 20 }} />
//             : locked ? <LockIcon sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }} />
//               : <Icon sx={{ color: '#fff', fontSize: 20 }} />}
//         </Box>
//         <Box sx={{ flex: 1, minWidth: 0 }}>
//           <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, color: locked ? 'rgba(255,255,255,0.3)' : '#fff' }}>{title}</Typography>
//           {subtitle && <Typography sx={{ fontSize: '0.72rem', mt: 0.25, color: locked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)' }}>{subtitle}</Typography>}
//         </Box>
//         {completed && (
//           <Chip label="Done" size="small" sx={{
//             height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
//             bgcolor: locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//             color: locked ? 'rgba(255,255,255,0.3)' : '#fff',
//           }} />
//         )}
//         {completed && !locked && onEdit && (
//           <IconButton size="small" onClick={onEdit} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', width: 28, height: 28, flexShrink: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
//             <EditIcon sx={{ fontSize: 14 }} />
//           </IconButton>
//         )}
//       </Box>
//       {!locked ? (
//         <Box sx={{ p: 3 }}>{children}</Box>
//       ) : (
//         <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
//           <LockIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.15)' }} />
//           <Typography sx={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
//             Complete the step above to unlock this section
//           </Typography>
//         </Box>
//       )}
//     </Paper>
//   );
// }

// function SaveBtn({ onClick, loading, done, label, updateLabel, doneLabel = 'Saved', color = '#059669', editing = false }) {
//   if (done && !editing) {
//     return (
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: '#10B981' }}>
//         <CheckCircleIcon sx={{ fontSize: 18 }} />
//         <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{doneLabel}</Typography>
//       </Box>
//     );
//   }
//   const btnLabel = editing ? (updateLabel ?? 'Update') : label;
//   return (
//     <Button fullWidth variant="contained" size="large" onClick={onClick} disabled={loading}
//       startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : null}
//       sx={{
//         mt: 2.5, height: 48, borderRadius: 2.5, fontWeight: 700,
//         background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
//         boxShadow: `0 4px 16px ${alpha(color, 0.35)}`,
//         '&:hover': { boxShadow: `0 6px 20px ${alpha(color, 0.5)}`, transform: 'translateY(-1px)' },
//         '&:disabled': { background: 'rgba(255,255,255,0.08)', boxShadow: 'none' },
//         transition: 'all 0.2s ease',
//       }}
//     >
//       {loading ? 'Saving…' : btnLabel}
//     </Button>
//   );
// }

// // ═════════════════════════════════════════════════════════════════════════════
// export default function PartnerRideDriverRegisterPage() {
//   const router = useRouter();
//   const { user: partnerUser } = useAuth();
//   const phoneCode = (partnerUser?.country?.phoneCode ?? '+260').replace(/^\+/, '');

//   const {
//     loading: settingsLoading,
//     isDriverLicenseRequired: reqLicense,
//     isNationalIdRequired: reqNRC,
//     isProofOfAddressRequired: reqAddress,
//     isInsuranceRequired: reqInsurance,
//   } = useAdminSettings();

//   // ── Registered driver identifiers ─────────────────────────────────────────
//   const [driverUserId, setDriverUserId] = useState(null);
//   const [driverProfileId, setDriverProfileId] = useState(null);
//   const [vehicleId, setVehicleId] = useState(null);

//   // ── Step completion flags ─────────────────────────────────────────────────
//   const [accountCreated, setAccountCreated] = useState(false);
//   const [licenseInfoSaved, setLicenseInfoSaved] = useState(false);
//   const [nationalIdSaved, setNationalIdSaved] = useState(false);
//   const [addressSaved, setAddressSaved] = useState(false);
//   const [vehicleTypeSaved, setVehicleTypeSaved] = useState(false);
//   const [vehicleDetailsSaved, setVehicleDetailsSaved] = useState(false);
//   const [existingVehicleAttached, setExistingVehicleAttached] = useState(false);
//   const [submitted, setSubmitted] = useState(false);

//   // ── Edit mode flags ───────────────────────────────────────────────────────
//   const [editingBasic, setEditingBasic] = useState(false);
//   const [editingLicense, setEditingLicense] = useState(false);
//   const [editingNationalId, setEditingNationalId] = useState(false);
//   const [editingAddress, setEditingAddress] = useState(false);
//   const [editingVehicleType, setEditingVehicleType] = useState(false);
//   const [editingVehicleDetails, setEditingVehicleDetails] = useState(false);

//   // ── Modal flags ───────────────────────────────────────────────────────────
//   const [addMakeModelOpen, setAddMakeModelOpen] = useState(false);
//   const [existingVehicleSearchOpen, setExistingVehicleSearchOpen] = useState(false);
//   const [attachedExistingVehicle, setAttachedExistingVehicle] = useState(null);

//   // ── Form: identity ────────────────────────────────────────────────────────
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [origPhone, setOrigPhone] = useState('');

//   // ── Form: license ─────────────────────────────────────────────────────────
//   const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
//   const [licenseExpiryDate, setLicenseExpiryDate] = useState('');

//   // ── Form: national ID ─────────────────────────────────────────────────────
//   const [nationalIdNumber, setNationalIdNumber] = useState('');

//   // ── Form: address ─────────────────────────────────────────────────────────
//   const [address, setAddress] = useState('');

//   // ── Form: vehicle ─────────────────────────────────────────────────────────
//   const [selectedVehicleType, setSelectedVehicleType] = useState('taxi');
//   const [vehicleForm, setVehicleForm] = useState({
//     numberPlate: '', make: '', model: '',
//     year: new Date().getFullYear(), color: '',
//     seatingCapacity: 4, insuranceExpiryDate: '',
//   });

//   // ── Vehicle data ──────────────────────────────────────────────────────────
//   const [makesAndModels, setMakesAndModels] = useState({});
//   const [makesList, setMakesList] = useState([]);
//   const [modelsList, setModelsList] = useState([]);
//   const [allowedYears, setAllowedYears] = useState([]);

//   // ── Documents (using correct field names from API) ─────────────────────────
//   const [docs, setDocs] = useState({
//     driverLicenseFront: null,
//     driverLicenseBack: null,
//     nationalIdFront: null,
//     nationalIdBack: null,
//     profilePicture: null,
//     insuranceCertificate: null,
//   });


//   // ── UI ────────────────────────────────────────────────────────────────────
//   const [saving, setSaving] = useState({});
//   const [error, setError] = useState(null);
//   const [toast, setToast] = useState(null);
//   const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
//   const [pendingLeaveAction, setPendingLeaveAction] = useState(null);

//   const hasUnsavedChanges =
//     !submitted &&
//     (
//       accountCreated ||
//       firstName.trim() ||
//       lastName.trim() ||
//       phoneNumber.trim() ||
//       driverLicenseNumber.trim() ||
//       licenseExpiryDate ||
//       nationalIdNumber.trim() ||
//       address.trim() ||
//       vehicleForm.numberPlate.trim() ||
//       vehicleForm.make.trim() ||
//       vehicleForm.model.trim() ||
//       vehicleForm.color ||
//       vehicleForm.insuranceExpiryDate ||
//       docs.driverLicenseFront ||
//       docs.driverLicenseBack ||
//       docs.nationalIdFront ||
//       docs.nationalIdBack ||
//       docs.profilePicture ||
//       docs.insuranceCertificate
//     );

//   const requestLeave = (action) => {
//     if (hasUnsavedChanges) {
//       setPendingLeaveAction(() => action);
//       setLeaveDialogOpen(true);
//       return;
//     }
//     action?.();
//   };

//   const confirmLeave = () => {
//     setLeaveDialogOpen(false);
//     const action = pendingLeaveAction;
//     setPendingLeaveAction(null);
//     action?.();
//   }

//   const cancelLeave = () => {
//     setLeaveDialogOpen(false);
//     setPendingLeaveAction(null);
//   }
//   const setSavingStep = (step, val) => setSaving(p => ({ ...p, [step]: val }));


//   useEffect(() => {
//     const handleBeforeUnload = (e) => {
//       if (!hasUnsavedChanges) return;

//       e.preventDefault();
//       e.returnValue = '';
//       return '';
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     }
//   }, [hasUnsavedChanges])

//   useEffect(() => {
//     const isMotorbike = selectedVehicleType === 'motorbike' || selectedVehicleType === 'motorcycle';
//     getVehicleMakesAndModels(isMotorbike ? 'motorbike' : undefined)
//       .then(mm => {
//         setMakesAndModels(mm);
//         setMakesList(Object.keys(mm));
//         if (!editingVehicleDetails && !vehicleDetailsSaved) {
//           setVehicleForm(p => ({ ...p, make: '', model: '' }));
//         }
//       })
//       .catch(() => { });

//     getAllowedVehicleYears()
//       .then(years => {
//         const cur = new Date().getFullYear();
//         const sorted = [...years].sort((a, b) => parseInt(a) - parseInt(b));
//         const last = parseInt(sorted[sorted.length - 1] ?? cur);
//         const extended = last >= cur
//           ? sorted
//           : [...sorted, ...Array.from({ length: cur - last + 1 }, (_, i) => String(last + i + 1))];
//         setAllowedYears(extended);
//       })
//       .catch(() => setAllowedYears(Array.from({ length: 26 }, (_, i) => String(2000 + i))));
//   }, [selectedVehicleType]); // eslint-disable-line react-hooks/exhaustive-deps

//   useEffect(() => {
//     setModelsList(vehicleForm.make && makesAndModels[vehicleForm.make] ? makesAndModels[vehicleForm.make] : []);
//   }, [vehicleForm.make, makesAndModels]);

//   // ── Progressive lock chain ────────────────────────────────────────────────
//   const licenseComplete = !reqLicense || (licenseInfoSaved && docs.driverLicenseFront && docs.driverLicenseBack);
//   const nrcComplete = !reqNRC || (nationalIdSaved && docs.nationalIdFront && docs.nationalIdBack);
//   const addressChainDone = !reqAddress || addressSaved;

//   const licenseGate = accountCreated;
//   const nrcGate = accountCreated && licenseComplete;
//   const addressGate = nrcGate && nrcComplete;
//   const vehicleTypeGate = addressGate && addressChainDone;
//   const vehicleDetGate = vehicleTypeGate && vehicleTypeSaved;
//   const photoGate = vehicleDetGate && (vehicleDetailsSaved || existingVehicleAttached);
//   const submitGate = photoGate;

//   const allRequiredDocs =
//     (!reqLicense || (docs.driverLicenseFront && docs.driverLicenseBack)) &&
//     (!reqNRC || (docs.nationalIdFront && docs.nationalIdBack)) &&
//     !!docs.profilePicture;

//   // ── Step 1: Create driver account ─────────────────────────────────────────
//   const handleCreateAccount = async () => {
//     setError(null);
//     if (!firstName.trim()) { setError('First name is required'); return; }
//     if (!lastName.trim()) { setError('Last name is required'); return; }
//     if (!phoneNumber.trim()) { setError('Phone number is required'); return; }

//     setSavingStep('account', true);
//     try {
//       const phoneDigits = phoneNumber.replace(/\D/g, '');
//       const fullPhone = `${phoneCode}${phoneDigits}`;

//       const regRes = await fetch(`${API_URL}/auth/local/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           username: fullPhone,
//           email: `unset_${fullPhone}@email.com`,
//           password: fullPhone,
//         }),
//       });
//       const regData = await regRes.json();
//       if (!regRes.ok) throw new Error(regData?.error?.message ?? regData?.message ?? 'Registration failed');

//       const newDriverId = regData.user?.id;
//       const driverJwt = regData.jwt;

//       await fetch(`${API_URL}/users/${newDriverId}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverJwt}` },
//         body: JSON.stringify({
//           firstName: firstName.trim(), lastName: lastName.trim(),
//           phoneNumber: fullPhone, country: partnerUser?.country?.id, partner: partnerUser?.id,
//         }),
//       });

//       setDriverUserId(newDriverId);
//       setOrigPhone(phoneDigits);

//       const profileData = await apiClient.get(`/users/${newDriverId}?populate=driverProfile`);
//       setDriverProfileId(profileData?.driverProfile?.id ?? null);

//       setAccountCreated(true);
//       setToast({ msg: `Account created for ${firstName} ${lastName}`, severity: 'success' });
//     } catch (err) {
//       setError(err?.message ?? 'Account creation failed');
//     } finally {
//       setSavingStep('account', false);
//     }
//   };

//   // ── Update basic info (after account creation) ────────────────────────────
//   const handleUpdateBasic = async () => {
//     setError(null);
//     if (!firstName.trim()) { setError('First name is required'); return; }
//     if (!lastName.trim()) { setError('Last name is required'); return; }
//     setSavingStep('basic', true);
//     try {
//       const phoneDigits = phoneNumber.replace(/\D/g, '');
//       const fullPhone = `${phoneCode}${phoneDigits}`;
//       const origFull = `${phoneCode}${origPhone.replace(/\D/g, '')}`;
//       const body = { firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: fullPhone };
//       if (fullPhone !== origFull && phoneDigits) {
//         await apiClient.put(`/users/${driverUserId}`, { ...body, username: fullPhone });
//       } else {
//         await apiClient.put(`/users/${driverUserId}`, body);
//       }
//       setOrigPhone(phoneDigits);
//       setEditingBasic(false);
//       setToast({ msg: 'Basic info updated', severity: 'success' });
//     } catch (err) {
//       setError(err?.message ?? 'Failed to update basic info');
//     } finally {
//       setSavingStep('basic', false);
//     }
//   };

//   const handleSaveLicense = async () => {
//     setError(null);
//     if (!driverLicenseNumber.trim()) { setError('License number is required'); return; }
//     if (!licenseExpiryDate) { setError('License expiry date is required'); return; }
//     setSavingStep('license', true);
//     try {
//       await saveLicenseInfo({ licenseNumber: driverLicenseNumber.trim(), expiryDate: licenseExpiryDate, driverId: driverUserId });
//       setLicenseInfoSaved(true);
//       setEditingLicense(false);
//       setToast({ msg: editingLicense ? 'License info updated' : 'License info saved — upload photos below', severity: 'success' });
//     } catch (err) {
//       setError(err?.message ?? 'Failed to save license info');
//     } finally {
//       setSavingStep('license', false);
//     }
//   };

//   const handleSaveNationalId = async () => {
//     setError(null);
//     if (!nationalIdNumber.trim()) { setError('NRC number is required'); return; }
//     setSavingStep('nationalId', true);
//     try {
//       await saveNationalIdInfo({ idNumber: nationalIdNumber.trim(), driverId: driverUserId });
//       setNationalIdSaved(true);
//       setEditingNationalId(false);
//       setToast({ msg: editingNationalId ? 'NRC info updated' : 'NRC info saved — upload photos below', severity: 'success' });
//     } catch (err) {
//       setError(err?.message ?? 'Failed to save NRC info');
//     } finally {
//       setSavingStep('nationalId', false);
//     }
//   };

//   const handleSaveAddress = async () => {
//     setError(null);
//     setSavingStep('address', true);
//     try {
//       await saveProofOfAddress({ address: address.trim() || undefined, driverId: driverUserId });
//       setAddressSaved(true);
//       setEditingAddress(false);
//       setToast({ msg: 'Address saved', severity: 'success' });
//     } catch (err) {
//       setError(err?.message ?? 'Failed to save address');
//     } finally {
//       setSavingStep('address', false);
//     }
//   };

//   const handleSaveVehicleType = async () => {
//     setError(null);
//     setSavingStep('vehicleType', true);
//     try {
//       await saveVehicleType({ vehicleType: selectedVehicleType, driverId: driverUserId });
//       setVehicleTypeSaved(true);
//       setEditingVehicleType(false);
//       if (editingVehicleType && vehicleDetailsSaved) {
//         setVehicleDetailsSaved(false);
//         setToast({ msg: 'Vehicle type updated — please re-save vehicle details', severity: 'warning' });
//       } else {
//         setToast({ msg: 'Vehicle type confirmed', severity: 'success' });
//       }
//     } catch (err) {
//       setError(err?.message ?? 'Failed to save vehicle type');
//     } finally {
//       setSavingStep('vehicleType', false);
//     }
//   };

//   const handleSaveVehicleDetails = async () => {
//     setError(null);
//     if (!vehicleForm.numberPlate.trim()) { setError('Number plate is required'); return; }
//     if (!vehicleForm.make.trim()) { setError('Vehicle make is required'); return; }
//     if (!vehicleForm.model.trim()) { setError('Vehicle model is required'); return; }
//     if (!vehicleForm.color) { setError('Please select a vehicle color'); return; }
//     if (!vehicleForm.insuranceExpiryDate) { setError('Insurance expiry date is required'); return; }

//     setSavingStep('vehicleDetails', true);
//     try {
//       const res = await saveVehicleDetails({
//         ...vehicleForm,
//         numberPlate: vehicleForm.numberPlate.toUpperCase(),
//         vehicleType: selectedVehicleType,
//         driverId: driverUserId,
//       });

//       setVehicleId(res?.newVehicle?.id ?? null);

//       // Re-confirm vehicle type on driver profile to ensure it is persisted
//       await saveVehicleType({ vehicleType: selectedVehicleType, driverId: driverUserId });

//       if (partnerUser?.id) {
//         await apiClient.put(`/users/${driverUserId}`, { partner: partnerUser.id });
//       }

//       setVehicleDetailsSaved(true);
//       setEditingVehicleDetails(false);
//       setToast({ msg: editingVehicleDetails ? 'Vehicle details updated' : 'Vehicle saved and linked to your partner account', severity: 'success' });
//     } catch (err) {
//       setError(err?.message ?? 'Failed to save vehicle details');
//     } finally {
//       setSavingStep('vehicleDetails', false);
//     }
//   };

//   // Attach an existing vehicle from search
//   const handleAttachExistingVehicle = async (vehicle) => {
//     setError(null);
//     setSavingStep('attachExisting', true);
//     try {
//       await apiClient.post('/driver/assign-vehicle', {
//         driverId: driverUserId,
//         vehicleId: vehicle.id,
//       });
//       if (partnerUser?.id) {
//         await apiClient.put(`/users/${driverUserId}`, { partner: partnerUser.id });
//       }
//       setVehicleId(vehicle.id);
//       setAttachedExistingVehicle(vehicle);
//       setExistingVehicleAttached(true);
//       setToast({ msg: `Vehicle ${vehicle.numberPlate} attached to driver`, severity: 'success' });
//     } catch (err) {
//       setError(err?.message ?? 'Failed to attach existing vehicle');
//     } finally {
//       setSavingStep('attachExisting', false);
//     }
//   };

//   const handleDocUpload = useCallback(async (file, field, ref, refId, stateKey) => {
//     if (!refId) {
//       setToast({ msg: 'Driver profile not ready — please wait a moment', severity: 'warning' });
//       return;
//     }
//     try {
//       const res = await uploadDocument(field, file, ref, refId);
//       setDocs(p => ({ ...p, [stateKey]: Array.isArray(res) ? res[0] : res }));
//       setToast({ msg: 'Document uploaded', severity: 'success' });
//     } catch {
//       setToast({ msg: `Failed to upload ${field}`, severity: 'error' });
//     }
//   }, []);

//   const handleSubmit = async () => {
//     setError(null);
//     if (!allRequiredDocs) { setError('Upload all required documents before submitting'); return; }
//     setSavingStep('submit', true);
//     try {
//       await apiClient.post('/driver/onboarding/submit', { driverId: driverUserId });
//       setSubmitted(true);
//     } catch (err) {
//       setError(err?.message ?? 'Submission failed');
//     } finally {
//       setSavingStep('submit', false);
//     }
//   };

//   const resetAll = () => {
//     setDriverUserId(null); setDriverProfileId(null); setVehicleId(null);
//     setAccountCreated(false); setLicenseInfoSaved(false); setNationalIdSaved(false);
//     setAddressSaved(false); setVehicleTypeSaved(false); setVehicleDetailsSaved(false);
//     setExistingVehicleAttached(false); setAttachedExistingVehicle(null); setSubmitted(false);
//     setEditingBasic(false); setEditingLicense(false); setEditingNationalId(false);
//     setEditingAddress(false); setEditingVehicleType(false); setEditingVehicleDetails(false);
//     setFirstName(''); setLastName(''); setPhoneNumber(''); setOrigPhone('');
//     setDriverLicenseNumber(''); setLicenseExpiryDate(''); setNationalIdNumber(''); setAddress('');
//     setSelectedVehicleType('taxi');
//     setVehicleForm({ numberPlate: '', make: '', model: '', year: new Date().getFullYear(), color: '', seatingCapacity: 4, insuranceExpiryDate: '' });
//     setDocs({ driverLicenseFront: null, driverLicenseBack: null, nationalIdFront: null, nationalIdBack: null, profilePicture: null, insuranceCertificate: null });
//   };

//   if (settingsLoading) {
//     return (
//       <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <CircularProgress sx={{ color: '#10B981' }} />
//       </Box>
//     );
//   }

//   if (submitted) {
//     return (
//       <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', p: { xs: 2, md: 4 } }}>
//         <Box sx={{ maxWidth: 560, mx: 'auto', pt: 8 }}>
//           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
//             <Paper elevation={0} sx={{
//               borderRadius: 4, overflow: 'hidden', textAlign: 'center',
//               border: '1px solid rgba(5,150,105,0.25)',
//               background: 'linear-gradient(145deg, rgba(5,150,105,0.15) 0%, rgba(16,185,129,0.05) 100%)',
//             }}>
//               <Box sx={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', py: 4 }}>
//                 <CheckCircleIcon sx={{ fontSize: 72, color: '#fff', mb: 1 }} />
//                 <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Driver Registered!</Typography>
//                 <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>Account submitted for verification</Typography>
//               </Box>
//               <Box sx={{ p: 4 }}>
//                 <Box sx={{ p: 2.5, borderRadius: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
//                   <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>{firstName} {lastName}</Typography>
//                   <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mt: 0.25 }}>+{phoneCode}{phoneNumber}</Typography>
//                   {vehicleForm.numberPlate && (
//                     <Typography sx={{ mt: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', letterSpacing: 2, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
//                       {vehicleForm.numberPlate.toUpperCase()}
//                     </Typography>
//                   )}
//                   {attachedExistingVehicle && (
//                     <Typography sx={{ mt: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', letterSpacing: 2, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
//                       {attachedExistingVehicle.numberPlate}
//                     </Typography>
//                   )}
//                 </Box>
//                 <Alert severity="info" sx={{ mb: 3, borderRadius: 2.5, textAlign: 'left' }}>
//                   <Typography variant="body2" fontWeight={600} gutterBottom>Share login credentials with driver</Typography>
//                   <Typography variant="body2">Phone / Username: <strong>+{phoneCode}{phoneNumber.replace(/\D/g, '')}</strong></Typography>
//                   <Typography variant="body2">Initial password: <strong style={{ fontFamily: 'monospace' }}>{phoneCode}{phoneNumber.replace(/\D/g, '')}</strong></Typography>
//                 </Alert>
//                 <Box sx={{ display: 'flex', gap: 2 }}>
//                   <Button fullWidth variant="outlined" onClick={() => router.push(`/partner/drivers/${driverUserId}`)} sx={{ borderRadius: 2.5, fontWeight: 600, height: 48 }}>View Profile</Button>
//                   <Button fullWidth variant="contained" onClick={resetAll} sx={{ borderRadius: 2.5, fontWeight: 700, height: 48, background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>Register Another</Button>
//                 </Box>
//               </Box>
//             </Paper>
//           </motion.div>
//         </Box>
//       </Box>
//     );
//   }

//   const stepsCompleted = [licenseInfoSaved, nationalIdSaved, addressSaved, vehicleTypeSaved, vehicleDetailsSaved || existingVehicleAttached].filter(Boolean).length;

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a' }}>
//       {/* Modals */}
//       <AddMakeModelModal
//         open={addMakeModelOpen}
//         onClose={() => setAddMakeModelOpen(false)}
//         onConfirm={(make, model) => {
//           setMakesList(prev => prev.includes(make) ? prev : [...prev, make]);
//           setVehicleForm(p => ({ ...p, make, model }));
//         }}
//       />
//       <ExistingVehicleSearchModal
//         open={existingVehicleSearchOpen}
//         onClose={() => setExistingVehicleSearchOpen(false)}
//         onSelect={handleAttachExistingVehicle}
//       />

//       {/* Sticky header */}
//       <Box sx={{
//         position: 'sticky', top: 0, zIndex: 100, px: 3, py: 2,
//         background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)',
//         borderBottom: '1px solid rgba(255,255,255,0.07)',
//         display: 'flex', alignItems: 'center', gap: 2,
//       }}>
//         <IconButton onClick={() => requestLeave(() => router.back())} sx={{ color: 'rgba(255,255,255,0.7)' }}>
//           <BackIcon />
//         </IconButton>
//         <Box sx={{ flex: 1, minWidth: 0 }}>
//           <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem', lineHeight: 1.2 }}>Register Ride Driver</Typography>
//           <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
//             {accountCreated ? `Onboarding ${firstName} ${lastName}` : 'Complete all steps to onboard a driver'}
//           </Typography>
//         </Box>
//         {accountCreated && (
//           <Chip size="small" label={`${stepsCompleted}/5 steps`}
//             sx={{ bgcolor: alpha('#059669', 0.2), color: '#10B981', fontWeight: 700, fontSize: '0.7rem' }} />
//         )}
//       </Box>

//       <Box sx={{ maxWidth: 720, mx: 'auto', p: { xs: 2, md: 4 } }}>
//         <AnimatePresence>
//           {error && (
//             <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
//               <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: 2.5 }}>{error}</Alert>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* ══ Section 1: Driver Identity ══ */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
//           <SectionCard
//             icon={PersonIcon}
//             title="Driver Identity"
//             subtitle="Create the driver's account — phone number becomes their password"
//             locked={false}
//             completed={accountCreated}
//             onEdit={accountCreated ? () => setEditingBasic(true) : undefined}
//           >
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
//               <TwoCol>
//                 <TextField fullWidth label="First Name" value={firstName} required onChange={e => setFirstName(e.target.value)} disabled={accountCreated && !editingBasic} sx={fieldSx} />
//                 <TextField fullWidth label="Last Name" value={lastName} required onChange={e => setLastName(e.target.value)} disabled={accountCreated && !editingBasic} sx={fieldSx} />
//               </TwoCol>
//               <TextField
//                 fullWidth label="Phone Number" value={phoneNumber} required
//                 onChange={e => setPhoneNumber(e.target.value)} placeholder="97XXXXXXXX"
//                 helperText={
//                   editingBasic
//                     ? 'Changing the phone number will also update the login username'
//                     : accountCreated
//                       ? undefined
//                       : 'Becomes their username and initial login password'
//                 }
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <PhoneIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} />
//                       <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', ml: 0.5 }}>+{phoneCode}</Typography>
//                     </InputAdornment>
//                   ),
//                 }}
//                 disabled={accountCreated && !editingBasic}
//                 sx={fieldSx}
//               />
//               {!accountCreated && (
//                 <Alert severity="info" sx={{ borderRadius: 2.5 }}>
//                   <Typography variant="caption">The driver's initial password will be their full phone number (country code + digits). They should change it on first login.</Typography>
//                 </Alert>
//               )}

//               {!accountCreated && (
//                 <SaveBtn onClick={handleCreateAccount} loading={saving.account} done={false} label="Create Driver Account" />
//               )}

//               {accountCreated && editingBasic && (
//                 <Box sx={{ display: 'flex', gap: 1.5 }}>
//                   <SaveBtn onClick={handleUpdateBasic} loading={saving.basic} done={false} label="Update Basic Info" />
//                   <Button variant="text" size="small" onClick={() => setEditingBasic(false)}
//                     sx={{ mt: 2.5, height: 48, px: 3, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2.5 }}>
//                     Cancel
//                   </Button>
//                 </Box>
//               )}

//               {accountCreated && !editingBasic && (
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: '#10B981' }}>
//                   <CheckCircleIcon sx={{ fontSize: 18 }} />
//                   <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Account created — {firstName} {lastName}</Typography>
//                 </Box>
//               )}
//             </Box>
//           </SectionCard>
//         </motion.div>

//         {/* ══ Section 2: Driver's License ══ */}
//         {reqLicense && (
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
//             <SectionCard icon={DocIcon} title="Driver's License" subtitle="License number, expiry date, and photos of both sides" color="#7C3AED" locked={!licenseGate} completed={licenseComplete} onEdit={() => setEditingLicense(true)}>
//               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
//                 <TwoCol>
//                   <TextField fullWidth label="License Number" value={driverLicenseNumber} onChange={e => setDriverLicenseNumber(e.target.value.toUpperCase())} placeholder="e.g., DL-123456" disabled={licenseInfoSaved && !editingLicense} sx={fieldSx} />
//                   <TextField fullWidth type="date" label="License Expiry Date" value={licenseExpiryDate} onChange={e => setLicenseExpiryDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split('T')[0] }} disabled={licenseInfoSaved && !editingLicense} sx={fieldSx} />
//                 </TwoCol>
//                 <SaveBtn onClick={handleSaveLicense} loading={saving.license} done={licenseInfoSaved} editing={editingLicense} label="Save License Info" updateLabel="Update License Info" doneLabel="License info saved" color="#7C3AED" />
//                 {editingLicense && <Button variant="text" size="small" onClick={() => setEditingLicense(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
//                 {licenseInfoSaved && (
//                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
//                     <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Upload License Photos</Typography>
//                     <DocumentUploadCard title="License — Front" description="Clear photo of the front side"
//                       onUpload={f => handleDocUpload(f, 'driverLicenseFront', 'driver-profiles.driver-profile', driverProfileId, 'driverLicenseFront')}
//                       uploadedFile={docs.driverLicenseFront} onRemove={() => setDocs(p => ({ ...p, driverLicenseFront: null }))} />
//                     <DocumentUploadCard title="License — Back" description="Clear photo of the back side"
//                       onUpload={f => handleDocUpload(f, 'driverLicenseBack', 'driver-profiles.driver-profile', driverProfileId, 'driverLicenseBack')}
//                       uploadedFile={docs.driverLicenseBack} onRemove={() => setDocs(p => ({ ...p, driverLicenseBack: null }))} />
//                     {!licenseComplete && <Alert severity="info" sx={{ borderRadius: 2.5 }}><Typography variant="caption">Upload both sides of the license to unlock the next section.</Typography></Alert>}
//                   </Box>
//                 )}
//               </Box>
//             </SectionCard>
//           </motion.div>
//         )}

//         {/* ══ Section 3: National ID (NRC) ══ */}
//         {reqNRC && (
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//             <SectionCard icon={BadgeIcon} title="National ID (NRC)" subtitle="NRC number and photos of both sides" color="#0EA5E9" locked={!nrcGate} completed={nrcComplete} onEdit={() => setEditingNationalId(true)}>
//               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
//                 <TextField fullWidth label="NRC Number" value={nationalIdNumber} required onChange={e => setNationalIdNumber(e.target.value)} placeholder="e.g., 123456/78/9" disabled={nationalIdSaved && !editingNationalId} sx={fieldSx} />
//                 <SaveBtn onClick={handleSaveNationalId} loading={saving.nationalId} done={nationalIdSaved} editing={editingNationalId} label="Save NRC Info" updateLabel="Update NRC Info" doneLabel="NRC info saved" color="#0EA5E9" />
//                 {editingNationalId && <Button variant="text" size="small" onClick={() => setEditingNationalId(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
//                 {nationalIdSaved && (
//                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
//                     <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Upload NRC Photos</Typography>
//                     <DocumentUploadCard title="NRC — Front" description="Clear photo of the front"
//                       onUpload={f => handleDocUpload(f, 'nationalIdFront', 'driver-profiles.driver-profile', driverProfileId, 'nationalIdFront')}
//                       uploadedFile={docs.nationalIdFront} onRemove={() => setDocs(p => ({ ...p, nationalIdFront: null }))} />
//                     <DocumentUploadCard title="NRC — Back" description="Clear photo of the back"
//                       onUpload={f => handleDocUpload(f, 'nationalIdBack', 'driver-profiles.driver-profile', driverProfileId, 'nationalIdBack')}
//                       uploadedFile={docs.nationalIdBack} onRemove={() => setDocs(p => ({ ...p, nationalIdBack: null }))} />
//                     {!nrcComplete && <Alert severity="info" sx={{ borderRadius: 2.5 }}><Typography variant="caption">Upload both sides of the NRC to unlock the next section.</Typography></Alert>}
//                   </Box>
//                 )}
//               </Box>
//             </SectionCard>
//           </motion.div>
//         )}

//         {/* ══ Section 4: Residential Address ══ */}
//         {reqAddress && (
//           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
//             <SectionCard icon={HomeIcon} title="Residential Address" subtitle="Driver's home address" color="#F59E0B" locked={!addressGate} completed={addressSaved} onEdit={() => setEditingAddress(true)}>
//               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
//                 <TextField fullWidth label="Address" value={address} multiline rows={2} onChange={e => setAddress(e.target.value)} placeholder="House No, Street, Area, City" disabled={addressSaved && !editingAddress}
//                   InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mt: '-12px !important', alignSelf: 'flex-start', pt: 1.5 }}><HomeIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} /></InputAdornment> }}
//                   sx={fieldSx} />
//                 <SaveBtn onClick={handleSaveAddress} loading={saving.address} done={addressSaved} editing={editingAddress} label="Save Address" updateLabel="Update Address" doneLabel="Address saved" color="#F59E0B" />
//                 {editingAddress && <Button variant="text" size="small" onClick={() => setEditingAddress(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
//               </Box>
//             </SectionCard>
//           </motion.div>
//         )}

//         {/* ══ Section 5: Vehicle Type ══ */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
//           <SectionCard icon={CarIcon} title="Vehicle Type" subtitle="Select the type of vehicle the driver operates" locked={!vehicleTypeGate} completed={vehicleTypeSaved} onEdit={() => setEditingVehicleType(true)}>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
//               {RIDE_VEHICLE_TYPES.map(({ value, label, Icon: VtIcon, color: vtColor }) => {
//                 const selected = selectedVehicleType === value;
//                 const disabled = vehicleTypeSaved && !editingVehicleType;
//                 return (
//                   <Paper key={value} elevation={0} onClick={() => !disabled && setSelectedVehicleType(value)} sx={{
//                     p: 2, borderRadius: 3, cursor: disabled ? 'default' : 'pointer',
//                     border: `2px solid ${selected ? vtColor : 'rgba(255,255,255,0.07)'}`,
//                     background: selected ? alpha(vtColor, 0.12) : 'rgba(255,255,255,0.02)',
//                     display: 'flex', alignItems: 'center', gap: 2,
//                     opacity: disabled && !selected ? 0.35 : 1, transition: 'all 0.2s ease',
//                     '&:hover': !disabled ? { borderColor: vtColor, transform: 'translateY(-1px)' } : {},
//                   }}>
//                     <Box sx={{ width: 48, height: 48, borderRadius: 2, flexShrink: 0, bgcolor: alpha(vtColor, selected ? 0.25 : 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: vtColor }}>
//                       <VtIcon sx={{ fontSize: 28 }} />
//                     </Box>
//                     <Typography sx={{ flex: 1, fontWeight: 700, color: selected ? vtColor : '#fff' }}>{label}</Typography>
//                     <Radio checked={selected} size="small" disabled={disabled} sx={{ color: vtColor, '&.Mui-checked': { color: vtColor }, p: 0 }} />
//                   </Paper>
//                 );
//               })}
//               <SaveBtn onClick={handleSaveVehicleType} loading={saving.vehicleType} done={vehicleTypeSaved} editing={editingVehicleType} label="Confirm Vehicle Type" updateLabel="Update Vehicle Type" doneLabel={`${RIDE_VEHICLE_TYPES.find(t => t.value === selectedVehicleType)?.label ?? selectedVehicleType} confirmed`} />
//               {editingVehicleType && <Button variant="text" size="small" onClick={() => setEditingVehicleType(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
//             </Box>
//           </SectionCard>
//         </motion.div>

//         {/* ══ Section 6: Vehicle — Existing or New ══ */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
//           <SectionCard icon={CarIcon} title="Vehicle" subtitle="Attach an existing vehicle or register a new one" color="#F59E0B" locked={!vehicleDetGate} completed={vehicleDetailsSaved || existingVehicleAttached} onEdit={vehicleDetailsSaved ? () => setEditingVehicleDetails(true) : undefined}>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

//               {attachedExistingVehicle && (
//                 <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)', display: 'flex', alignItems: 'center', gap: 2 }}>
//                   <Box sx={{ flex: 1 }}>
//                     <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>Attached Vehicle</Typography>
//                     <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.1rem', color: '#34D399', letterSpacing: 2 }}>{attachedExistingVehicle.numberPlate}</Typography>
//                     <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', mt: 0.25 }}>{attachedExistingVehicle.make} {attachedExistingVehicle.model} · {attachedExistingVehicle.year}</Typography>
//                   </Box>
//                   <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
//                 </Box>
//               )}

//               {!existingVehicleAttached && (
//                 <Button fullWidth variant="outlined" startIcon={saving.attachExisting ? <CircularProgress size={16} /> : <SearchIcon />}
//                   onClick={() => setExistingVehicleSearchOpen(true)} disabled={saving.attachExisting}
//                   sx={{ borderRadius: 2.5, fontWeight: 700, height: 48, borderColor: alpha('#10B981', 0.5), color: '#34D399', '&:hover': { borderColor: '#10B981', bgcolor: alpha('#10B981', 0.08) } }}>
//                   {saving.attachExisting ? 'Attaching…' : 'Attach Existing Vehicle to Driver'}
//                 </Button>
//               )}

//               {!existingVehicleAttached && (
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                   <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.07)' }} />
//                   <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OR REGISTER NEW</Typography>
//                   <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.07)' }} />
//                 </Box>
//               )}

//               {!existingVehicleAttached && (
//                 <>
//                   <TextField fullWidth label="Number Plate" value={vehicleForm.numberPlate} required
//                     onChange={e => setVehicleForm(p => ({ ...p, numberPlate: e.target.value.toUpperCase() }))}
//                     placeholder="e.g., ALZ 1234" disabled={vehicleDetailsSaved && !editingVehicleDetails} sx={monoSx} />

//                   <TwoCol>
//                     <Box>
//                       <Autocomplete fullWidth freeSolo options={makesList} value={vehicleForm.make}
//                         onChange={(_, v) => setVehicleForm(p => ({ ...p, make: v ?? '', model: '' }))}
//                         disabled={vehicleDetailsSaved && !editingVehicleDetails}
//                         renderInput={params => <TextField {...params} label="Make" placeholder="e.g., Toyota" required sx={fieldSx} />}
//                       />
//                       {!(vehicleDetailsSaved && !editingVehicleDetails) && (
//                         <Button size="small" variant="text" startIcon={<AddNewIcon sx={{ fontSize: 14 }} />}
//                           onClick={() => setAddMakeModelOpen(true)}
//                           sx={{ mt: 0.5, color: '#A78BFA', fontWeight: 600, fontSize: '0.72rem', textTransform: 'none', px: 0.5 }}>
//                           Add name if not in list
//                         </Button>
//                       )}
//                     </Box>
//                     <Autocomplete fullWidth freeSolo options={modelsList} value={vehicleForm.model}
//                       onChange={(_, v) => setVehicleForm(p => ({ ...p, model: v ?? '' }))}
//                       disabled={!vehicleForm.make || (vehicleDetailsSaved && !editingVehicleDetails)}
//                       renderInput={params => <TextField {...params} label="Model" placeholder="e.g., Corolla" required sx={fieldSx} />}
//                     />
//                   </TwoCol>

//                   <TwoCol>
//                     <TextField select fullWidth label="Year" value={vehicleForm.year} required onChange={e => setVehicleForm(p => ({ ...p, year: parseInt(e.target.value) }))} disabled={vehicleDetailsSaved && !editingVehicleDetails} sx={fieldSx}>
//                       {[...allowedYears].reverse().map(y => <MenuItem key={y} value={parseInt(y)}>{y}</MenuItem>)}
//                     </TextField>
//                     <TextField fullWidth type="number" label="Seating Capacity" value={vehicleForm.seatingCapacity}
//                       onChange={e => setVehicleForm(p => ({ ...p, seatingCapacity: parseInt(e.target.value) }))}
//                       inputProps={{ min: 2, max: 50 }} disabled={vehicleDetailsSaved && !editingVehicleDetails} sx={fieldSx} />
//                   </TwoCol>

//                   <VehicleColorPicker value={vehicleForm.color} onChange={k => setVehicleForm(p => ({ ...p, color: k }))} disabled={vehicleDetailsSaved && !editingVehicleDetails} helperText="Select vehicle color" />

//                   <TextField fullWidth type="date" label="Insurance Expiry Date" value={vehicleForm.insuranceExpiryDate}
//                     onChange={e => setVehicleForm(p => ({ ...p, insuranceExpiryDate: e.target.value }))}
//                     InputLabelProps={{ shrink: true }} helperText="When does the vehicle insurance expire?"
//                     inputProps={{ min: new Date().toISOString().split('T')[0] }} disabled={vehicleDetailsSaved && !editingVehicleDetails} sx={fieldSx} />

//                   <SaveBtn onClick={handleSaveVehicleDetails} loading={saving.vehicleDetails} done={vehicleDetailsSaved} editing={editingVehicleDetails} label="Save Vehicle Details" updateLabel="Update Vehicle Details" doneLabel="Vehicle saved and linked to your partner account" color="#F59E0B" />
//                   {editingVehicleDetails && <Button variant="text" size="small" onClick={() => setEditingVehicleDetails(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
//                 </>
//               )}
//             </Box>
//           </SectionCard>
//         </motion.div>

//         {/* ══ Section 7: Profile Picture & Insurance ══ */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
//           <SectionCard icon={CameraIcon} title="Profile Picture & Insurance" subtitle={`Driver photo (required)${reqInsurance ? ' and insurance certificate (required)' : ''}`} color="#0EA5E9" locked={!photoGate} completed={!!docs.profilePicture && (!reqInsurance || !!docs.insuranceCertificate)}>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
//               <DocumentUploadCard title="Profile Photo" description="Clear, well-lit photo of the driver's face" acceptedFormats="image/*"
//                 onUpload={f => handleDocUpload(f, 'profilePicture', 'plugin::users-permissions.user', driverUserId, 'profilePicture')}
//                 uploadedFile={docs.profilePicture} onRemove={() => setDocs(p => ({ ...p, profilePicture: null }))} />
//               {reqInsurance ? (
//                 <DocumentUploadCard title="Insurance Certificate" description="Valid insurance disk or certificate"
//                   onUpload={f => handleDocUpload(f, 'insuranceCertificate', 'api::vehicle.vehicle', vehicleId, 'insuranceCertificate')}
//                   uploadedFile={docs.insuranceCertificate} onRemove={() => setDocs(p => ({ ...p, insuranceCertificate: null }))} />
//               ) : (
//                 <DocumentUploadCard title="Insurance Certificate" description="Optional — valid insurance disk or certificate"
//                   onUpload={f => handleDocUpload(f, 'insuranceCertificate', 'api::vehicle.vehicle', vehicleId, 'insuranceCertificate')}
//                   uploadedFile={docs.insuranceCertificate} onRemove={() => setDocs(p => ({ ...p, insuranceCertificate: null }))} />
//               )}
//             </Box>
//           </SectionCard>
//         </motion.div>

//         {/* ══ Section 8: Submit for Verification ══ */}
//         <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//           <SectionCard icon={CheckCircleIcon} title="Submit for Verification" subtitle="Final step — send driver for admin approval" color="#059669" locked={!submitGate}>
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
//               {!allRequiredDocs && (
//                 <Alert severity="info" sx={{ borderRadius: 2.5 }}>
//                   <Typography variant="body2">
//                     Required before submitting:{reqLicense && ' license photos (front & back),'}{reqNRC && ' NRC photos (front & back),'}{' '}and a profile picture.
//                   </Typography>
//                 </Alert>
//               )}
//               <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
//                 <Typography variant="body2" fontWeight={600} gutterBottom>Important notice</Typography>
//                 <Typography variant="body2">After submission, the driver will not receive orders until their account is verified. This typically takes 24–48 hours.</Typography>
//               </Alert>
//               <Button fullWidth variant="contained" size="large" onClick={handleSubmit} disabled={saving.submit || !allRequiredDocs}
//                 startIcon={saving.submit ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : null}
//                 sx={{ height: 56, borderRadius: 3, fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', boxShadow: '0 6px 20px rgba(5,150,105,0.35)', '&:hover': { boxShadow: '0 8px 24px rgba(5,150,105,0.5)', transform: 'translateY(-1px)' }, '&:disabled': { background: 'rgba(255,255,255,0.08)', boxShadow: 'none' }, transition: 'all 0.2s ease' }}>
//                 {saving.submit ? 'Submitting…' : 'Submit Driver for Verification'}
//               </Button>
//             </Box>
//           </SectionCard>
//         </motion.div>
//       </Box>

//       <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//         <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2.5 }}>{toast?.msg}</Alert>
//       </Snackbar>
//       <Dialog
//         open={leaveDialogOpen}
//         onClose={cancelLeave}
//         disableEscapeKeyDown
//         PaperProps={{
//           sx: {
//             borderRadius: 3,
//             bgcolor: '#111827',
//             color: '#fff',
//             border: '1px solid rgba(255,255,255,0.08)',
//           },
//         }}
//       >
//         <DialogTitle sx={{ fontWeight: 800 }}>
//           Leave this page?
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
//             Do you really want to leave without registering the driver?
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ p: 2, pt: 0 }}>
//           <Button
//             onClick={confirmLeave}
//             variant="contained"
//             color="error"
//             sx={{ borderRadius: 2, fontWeight: 700 }}
//           >
//             Yes
//           </Button>
//           <Button
//             onClick={cancelLeave}
//             variant="contained"
//             autoFocus
//             sx={{
//               borderRadius: 2,
//               fontWeight: 700,
//               bgcolor: '#10B981',
//               '&:hover': { bgcolor: '#059669' },
//             }}
//           >
//             No
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }
'use client';
// PATH: app/partner/drivers/register/page.jsx
// Partner-side RIDE driver registration

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, TextField, Button, Paper, MenuItem,
  Alert, Chip, CircularProgress, Autocomplete, Snackbar,
  IconButton, InputAdornment, Radio, Modal, Fade, Backdrop,
  List, ListItemButton, ListItemText, Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CameraAlt as CameraIcon,
  Check as CheckIcon,
  DriveEta as TaxiIcon,
  DirectionsBus as BusIcon,
  TwoWheeler as BikeIcon,
  Description as DocIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Add as AddNewIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import {
  uploadDocument,
  saveLicenseInfo,
  saveNationalIdInfo,
  saveProofOfAddress,
  saveVehicleType,
  saveVehicleDetails,
} from '@/lib/api/onboarding';
import { getVehicleMakesAndModels, getAllowedVehicleYears } from '@/lib/api/vehicles';
import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard';
import { VehicleColorPicker, getColorByKey } from '@/components/ui/VehicleColorPicker';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

const RIDE_VEHICLE_TYPES = [
  { value: 'taxi', label: 'Taxi / Sedan', Icon: TaxiIcon, color: '#10B981' },
  { value: 'bus', label: 'Bus / Minibus', Icon: BusIcon, color: '#3B82F6' },
  { value: 'motorbike', label: 'Motorbike', Icon: BikeIcon, color: '#F59E0B' },
];

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2.5 } };
const monoSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700, letterSpacing: 1,
  },
};
const TwoCol = ({ children }) => (
  <Box sx={{
    display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    gap: 2.5, '& > *': { minWidth: 0 },
  }}>
    {children}
  </Box>
);

// ─── Add Custom Make/Model Modal ──────────────────────────────────────────────
function AddMakeModelModal({ open, onClose, onConfirm }) {
  const [customMake, setCustomMake] = useState('');
  const [customModel, setCustomModel] = useState('');

  const handleConfirm = () => {
    if (!customMake.trim() || !customModel.trim()) return;
    onConfirm(customMake.trim(), customModel.trim());
    setCustomMake('');
    setCustomModel('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 300 } }}>
      <Fade in={open}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 420 }, bgcolor: '#1E293B', borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', p: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Add Custom Make & Model</Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Vehicle Make" value={customMake} onChange={e => setCustomMake(e.target.value)} placeholder="e.g., Kia, Chery, BYD" sx={fieldSx} autoFocus />
            <TextField fullWidth label="Vehicle Model" value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="e.g., Sportage, Tiggo, Atto" sx={fieldSx} onKeyDown={e => e.key === 'Enter' && handleConfirm()} />
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
              <Button fullWidth variant="text" onClick={onClose} sx={{ borderRadius: 2.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel</Button>
              <Button fullWidth variant="contained" onClick={handleConfirm} disabled={!customMake.trim() || !customModel.trim()}
                sx={{ borderRadius: 2.5, fontWeight: 700, background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
                Use These
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

// ─── Confirm Attach Vehicle Modal ─────────────────────────────────────────────
function ConfirmAttachVehicleModal({ open, onClose, onConfirm, vehicle }) {
  if (!vehicle) return null;
  const colorObj = getColorByKey(vehicle.color);

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 300 } }}>
      <Fade in={open}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 440 }, bgcolor: '#1E293B', borderRadius: 3,
          border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', p: 3,
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <WarningIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem', lineHeight: 1.3 }}>
                Attach this vehicle?
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)', mt: -0.5, mr: -0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Vehicle details card */}
          <Box sx={{
            p: 2, borderRadius: 2.5, mb: 2.5,
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Typography sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 900, fontSize: '1.25rem', color: '#34D399', letterSpacing: 2, mb: 0.75,
            }}>
              {vehicle.numberPlate}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
                {vehicle.make} {vehicle.model} · {vehicle.year} · {vehicle.vehicleType}
              </Typography>
              {vehicle.color && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{
                    width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                    bgcolor: colorObj?.hex ?? vehicle.color,
                    border: '1.5px solid rgba(255,255,255,0.2)',
                  }} />
                  <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>
                    {colorObj?.label ?? vehicle.color}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Warning */}
          <Alert
            severity="warning"
            sx={{ borderRadius: 2.5, mb: 2.5, '& .MuiAlert-message': { fontSize: '0.82rem' } }}
          >
            Are you sure you want to attach this vehicle to this driver?{' '}
            <strong>This will remove the vehicle from any other driver it is currently assigned to.</strong>
          </Alert>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              fullWidth variant="text" onClick={onClose}
              sx={{ borderRadius: 2.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, height: 44 }}
            >
              Cancel
            </Button>
            <Button
              fullWidth variant="contained" onClick={onConfirm}
              sx={{
                borderRadius: 2.5, fontWeight: 700, height: 44,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                '&:hover': { boxShadow: '0 6px 20px rgba(16,185,129,0.5)' },
              }}
            >
              Yes, Attach Vehicle
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

// ─── Existing Vehicle Search Modal ────────────────────────────────────────────
function ExistingVehicleSearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get(
          `/vehicles?filters[numberPlate][$containsi]=${encodeURIComponent(query)}&pagination[limit]=10&populate=*`
        );
        setResults(res?.data ?? res ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 300 } }}>
      <Fade in={open}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '92%', sm: 480 }, bgcolor: '#1E293B', borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden',
        }}>
          <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Attach Existing Vehicle</Typography>
              <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <TextField
              fullWidth placeholder="Search by number plate…"
              value={query} onChange={e => setQuery(e.target.value)} autoFocus
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} /></InputAdornment>,
                endAdornment: searching ? <InputAdornment position="end"><CircularProgress size={16} sx={{ color: '#10B981' }} /></InputAdornment> : null,
              }}
              sx={fieldSx}
            />
          </Box>
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {results.length === 0 && query.length >= 2 && !searching && (
              <Box sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>No vehicles found</Typography></Box>
            )}
            {query.length < 2 && (
              <Box sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Type at least 2 characters to search</Typography></Box>
            )}
            <List disablePadding>
              {results.map((vehicle, i) => (
                <Box key={vehicle.id ?? i}>
                  <ListItemButton onClick={() => { onSelect(vehicle); onClose(); }} sx={{ px: 3, py: 1.5, '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}>
                    <ListItemText
                      primary={<Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', color: '#34D399', letterSpacing: 1.5 }}>{vehicle.numberPlate}</Typography>}
                      secondary={<Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>{vehicle.make} {vehicle.model} · {vehicle.year} · {vehicle.vehicleType}</Typography>}
                    />
                  </ListItemButton>
                  {i < results.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                </Box>
              ))}
            </List>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

function SectionCard({ icon: Icon, title, subtitle, color = '#059669', locked, completed, onEdit, children }) {
  return (
    <Paper elevation={0} sx={{
      borderRadius: 3.5, mb: 3, overflow: 'hidden',
      border: `1px solid ${locked ? 'rgba(255,255,255,0.05)' : alpha(color, 0.2)}`,
      background: locked ? 'rgba(255,255,255,0.015)' : `linear-gradient(145deg, ${alpha(color, 0.06)} 0%, transparent 100%)`,
      transition: 'border-color 0.3s, background 0.3s',
    }}>
      <Box sx={{
        px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
        background: locked ? 'rgba(255,255,255,0.03)' : `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2, flexShrink: 0,
          bgcolor: locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {completed ? <CheckIcon sx={{ color: locked ? 'rgba(255,255,255,0.25)' : '#fff', fontSize: 20 }} />
            : locked ? <LockIcon sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }} />
              : <Icon sx={{ color: '#fff', fontSize: 20 }} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, color: locked ? 'rgba(255,255,255,0.3)' : '#fff' }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize: '0.72rem', mt: 0.25, color: locked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)' }}>{subtitle}</Typography>}
        </Box>
        {completed && (
          <Chip label="Done" size="small" sx={{
            height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
            bgcolor: locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
            color: locked ? 'rgba(255,255,255,0.3)' : '#fff',
          }} />
        )}
        {completed && !locked && onEdit && (
          <IconButton size="small" onClick={onEdit} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', width: 28, height: 28, flexShrink: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
            <EditIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>
      {!locked ? (
        <Box sx={{ p: 3 }}>{children}</Box>
      ) : (
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.15)' }} />
          <Typography sx={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
            Complete the step above to unlock this section
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

function SaveBtn({ onClick, loading, done, label, updateLabel, doneLabel = 'Saved', color = '#059669', editing = false }) {
  if (done && !editing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: '#10B981' }}>
        <CheckCircleIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{doneLabel}</Typography>
      </Box>
    );
  }
  const btnLabel = editing ? (updateLabel ?? 'Update') : label;
  return (
    <Button fullWidth variant="contained" size="large" onClick={onClick} disabled={loading}
      startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : null}
      sx={{
        mt: 2.5, height: 48, borderRadius: 2.5, fontWeight: 700,
        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
        boxShadow: `0 4px 16px ${alpha(color, 0.35)}`,
        '&:hover': { boxShadow: `0 6px 20px ${alpha(color, 0.5)}`, transform: 'translateY(-1px)' },
        '&:disabled': { background: 'rgba(255,255,255,0.08)', boxShadow: 'none' },
        transition: 'all 0.2s ease',
      }}
    >
      {loading ? 'Saving…' : btnLabel}
    </Button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function PartnerRideDriverRegisterPage() {
  const router = useRouter();
  const { user: partnerUser } = useAuth();
  const phoneCode = (partnerUser?.country?.phoneCode ?? '+260').replace(/^\+/, '');
  const {
    loading: settingsLoading,
    isDriverLicenseRequired: reqLicense,
    isNationalIdRequired: reqNRC,
    isProofOfAddressRequired: reqAddress,
    isInsuranceRequired: reqInsurance,
  } = useAdminSettings();

  // ── Registered driver identifiers ─────────────────────────────────────────
  const [driverUserId, setDriverUserId] = useState(null);
  const [driverProfileId, setDriverProfileId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);

  // ── Step completion flags ─────────────────────────────────────────────────
  const [accountCreated, setAccountCreated] = useState(false);
  const [licenseInfoSaved, setLicenseInfoSaved] = useState(false);
  const [nationalIdSaved, setNationalIdSaved] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [vehicleTypeSaved, setVehicleTypeSaved] = useState(false);
  const [vehicleDetailsSaved, setVehicleDetailsSaved] = useState(false);
  const [existingVehicleAttached, setExistingVehicleAttached] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Edit mode flags ───────────────────────────────────────────────────────
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingLicense, setEditingLicense] = useState(false);
  const [editingNationalId, setEditingNationalId] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState(false);
  const [editingVehicleDetails, setEditingVehicleDetails] = useState(false);

  // ── Modal flags ───────────────────────────────────────────────────────────
  const [addMakeModelOpen, setAddMakeModelOpen] = useState(false);
  const [existingVehicleSearchOpen, setExistingVehicleSearchOpen] = useState(false);
  const [attachedExistingVehicle, setAttachedExistingVehicle] = useState(null);
  const [vehicleToConfirm, setVehicleToConfirm] = useState(null);
  const [confirmAttachOpen, setConfirmAttachOpen] = useState(false);

  // ── Form: identity ────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [origPhone, setOrigPhone] = useState('');

  // ── Form: license ─────────────────────────────────────────────────────────
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');

  // ── Form: national ID ─────────────────────────────────────────────────────
  const [nationalIdNumber, setNationalIdNumber] = useState('');

  // ── Form: address ─────────────────────────────────────────────────────────
  const [address, setAddress] = useState('');

  // ── Form: vehicle ─────────────────────────────────────────────────────────
  const [selectedVehicleType, setSelectedVehicleType] = useState('taxi');
  const [vehicleForm, setVehicleForm] = useState({
    numberPlate: '', make: '', model: '',
    year: new Date().getFullYear(), color: '',
    seatingCapacity: 4, insuranceExpiryDate: '',
  });

  // ── Vehicle data ──────────────────────────────────────────────────────────
  const [makesAndModels, setMakesAndModels] = useState({});
  const [makesList, setMakesList] = useState([]);
  const [modelsList, setModelsList] = useState([]);
  const [allowedYears, setAllowedYears] = useState([]);

  // ── Documents (using correct field names from API) ─────────────────────────
  const [docs, setDocs] = useState({
    driverLicenseFront: null,
    driverLicenseBack: null,
    nationalIdFront: null,
    nationalIdBack: null,
    profilePicture: null,
    insuranceCertificate: null,
  });


  // ── UI ────────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState(null);

  const hasUnsavedChanges =
    !submitted &&
    (
      accountCreated ||
      firstName.trim() ||
      lastName.trim() ||
      phoneNumber.trim() ||
      driverLicenseNumber.trim() ||
      licenseExpiryDate ||
      nationalIdNumber.trim() ||
      address.trim() ||
      vehicleForm.numberPlate.trim() ||
      vehicleForm.make.trim() ||
      vehicleForm.model.trim() ||
      vehicleForm.color ||
      vehicleForm.insuranceExpiryDate ||
      docs.driverLicenseFront ||
      docs.driverLicenseBack ||
      docs.nationalIdFront ||
      docs.nationalIdBack ||
      docs.profilePicture ||
      docs.insuranceCertificate
    );

  const requestLeave = (action) => {
    if (hasUnsavedChanges) {
      setPendingLeaveAction(() => action);
      setLeaveDialogOpen(true);
      return;
    }
    action?.();
  };

  const confirmLeave = () => {
    setLeaveDialogOpen(false);
    const action = pendingLeaveAction;
    setPendingLeaveAction(null);
    action?.();
  }

  const cancelLeave = () => {
    setLeaveDialogOpen(false);
    setPendingLeaveAction(null);
  }
  const setSavingStep = (step, val) => setSaving(p => ({ ...p, [step]: val }));


  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!hasUnsavedChanges) return;

      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    const isMotorbike = selectedVehicleType === 'motorbike' || selectedVehicleType === 'motorcycle';
    getVehicleMakesAndModels(isMotorbike ? 'motorbike' : undefined)
      .then(mm => {
        setMakesAndModels(mm);
        setMakesList(Object.keys(mm));
        if (!editingVehicleDetails && !vehicleDetailsSaved) {
          setVehicleForm(p => ({ ...p, make: '', model: '' }));
        }
      })
      .catch(() => { });

    getAllowedVehicleYears()
      .then(years => {
        const cur = new Date().getFullYear();
        const sorted = [...years].sort((a, b) => parseInt(a) - parseInt(b));
        const last = parseInt(sorted[sorted.length - 1] ?? cur);
        const extended = last >= cur
          ? sorted
          : [...sorted, ...Array.from({ length: cur - last + 1 }, (_, i) => String(last + i + 1))];
        setAllowedYears(extended);
      })
      .catch(() => setAllowedYears(Array.from({ length: 26 }, (_, i) => String(2000 + i))));
  }, [selectedVehicleType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setModelsList(vehicleForm.make && makesAndModels[vehicleForm.make] ? makesAndModels[vehicleForm.make] : []);
  }, [vehicleForm.make, makesAndModels]);

  // ── Progressive lock chain ────────────────────────────────────────────────
  const licenseComplete = !reqLicense || (licenseInfoSaved && docs.driverLicenseFront && docs.driverLicenseBack);
  const nrcComplete = !reqNRC || (nationalIdSaved && docs.nationalIdFront && docs.nationalIdBack);
  const addressChainDone = !reqAddress || addressSaved;

  const licenseGate = accountCreated;
  const nrcGate = accountCreated && licenseComplete;
  const addressGate = nrcGate && nrcComplete;
  const vehicleTypeGate = addressGate && addressChainDone;
  const vehicleDetGate = vehicleTypeGate && vehicleTypeSaved;
  const photoGate = vehicleDetGate && (vehicleDetailsSaved || existingVehicleAttached);
  const submitGate = photoGate;

  const allRequiredDocs =
    (!reqLicense || (docs.driverLicenseFront && docs.driverLicenseBack)) &&
    (!reqNRC || (docs.nationalIdFront && docs.nationalIdBack)) &&
    !!docs.profilePicture;

  // ── Step 1: Create driver account ─────────────────────────────────────────
  const handleCreateAccount = async () => {
    setError(null);
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!lastName.trim()) { setError('Last name is required'); return; }
    if (!phoneNumber.trim()) { setError('Phone number is required'); return; }

    setSavingStep('account', true);
    try {
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      const fullPhone = `${phoneCode}${phoneDigits}`;

      const regRes = await fetch(`${API_URL}/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fullPhone,
          email: `unset_${fullPhone}@email.com`,
          password: fullPhone,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData?.error?.message ?? regData?.message ?? 'Registration failed');

      const newDriverId = regData.user?.id;
      const driverJwt = regData.jwt;

      await fetch(`${API_URL}/users/${newDriverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverJwt}` },
        body: JSON.stringify({
          firstName: firstName.trim(), lastName: lastName.trim(),
          phoneNumber: fullPhone, country: partnerUser?.country?.id, partner: partnerUser?.id,
        }),
      });

      setDriverUserId(newDriverId);
      setOrigPhone(phoneDigits);

      const profileData = await apiClient.get(`/users/${newDriverId}?populate=driverProfile`);
      setDriverProfileId(profileData?.driverProfile?.id ?? null);

      setAccountCreated(true);
      setToast({ msg: `Account created for ${firstName} ${lastName}`, severity: 'success' });
    } catch (err) {
      setError(err?.message ?? 'Account creation failed');
    } finally {
      setSavingStep('account', false);
    }
  };

  // ── Update basic info (after account creation) ────────────────────────────
  const handleUpdateBasic = async () => {
    setError(null);
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!lastName.trim()) { setError('Last name is required'); return; }
    setSavingStep('basic', true);
    try {
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      const fullPhone = `${phoneCode}${phoneDigits}`;
      const origFull = `${phoneCode}${origPhone.replace(/\D/g, '')}`;
      const body = { firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: fullPhone };
      if (fullPhone !== origFull && phoneDigits) {
        await apiClient.put(`/users/${driverUserId}`, { ...body, username: fullPhone });
      } else {
        await apiClient.put(`/users/${driverUserId}`, body);
      }
      setOrigPhone(phoneDigits);
      setEditingBasic(false);
      setToast({ msg: 'Basic info updated', severity: 'success' });
    } catch (err) {
      setError(err?.message ?? 'Failed to update basic info');
    } finally {
      setSavingStep('basic', false);
    }
  };

  const handleSaveLicense = async () => {
    setError(null);
    if (!driverLicenseNumber.trim()) { setError('License number is required'); return; }
    if (!licenseExpiryDate) { setError('License expiry date is required'); return; }
    setSavingStep('license', true);
    try {
      await saveLicenseInfo({ licenseNumber: driverLicenseNumber.trim(), expiryDate: licenseExpiryDate, driverId: driverUserId });
      setLicenseInfoSaved(true);
      setEditingLicense(false);
      setToast({ msg: editingLicense ? 'License info updated' : 'License info saved — upload photos below', severity: 'success' });
    } catch (err) {
      setError(err?.message ?? 'Failed to save license info');
    } finally {
      setSavingStep('license', false);
    }
  };

  const handleSaveNationalId = async () => {
    setError(null);
    if (!nationalIdNumber.trim()) { setError('NRC number is required'); return; }
    setSavingStep('nationalId', true);
    try {
      await saveNationalIdInfo({ idNumber: nationalIdNumber.trim(), driverId: driverUserId });
      setNationalIdSaved(true);
      setEditingNationalId(false);
      setToast({ msg: editingNationalId ? 'NRC info updated' : 'NRC info saved — upload photos below', severity: 'success' });
    } catch (err) {
      setError(err?.message ?? 'Failed to save NRC info');
    } finally {
      setSavingStep('nationalId', false);
    }
  };

  const handleSaveAddress = async () => {
    setError(null);
    setSavingStep('address', true);
    try {
      await saveProofOfAddress({ address: address.trim() || undefined, driverId: driverUserId });
      setAddressSaved(true);
      setEditingAddress(false);
      setToast({ msg: 'Address saved', severity: 'success' });
    } catch (err) {
      setError(err?.message ?? 'Failed to save address');
    } finally {
      setSavingStep('address', false);
    }
  };

  const handleSaveVehicleType = async () => {
    setError(null);
    setSavingStep('vehicleType', true);
    try {
      await saveVehicleType({ vehicleType: selectedVehicleType, driverId: driverUserId });
      setVehicleTypeSaved(true);
      setEditingVehicleType(false);
      if (editingVehicleType && vehicleDetailsSaved) {
        setVehicleDetailsSaved(false);
        setToast({ msg: 'Vehicle type updated — please re-save vehicle details', severity: 'warning' });
      } else {
        setToast({ msg: 'Vehicle type confirmed', severity: 'success' });
      }
    } catch (err) {
      setError(err?.message ?? 'Failed to save vehicle type');
    } finally {
      setSavingStep('vehicleType', false);
    }
  };

  const handleSaveVehicleDetails = async () => {
    setError(null);
    if (!vehicleForm.numberPlate.trim()) { setError('Number plate is required'); return; }
    if (!vehicleForm.make.trim()) { setError('Vehicle make is required'); return; }
    if (!vehicleForm.model.trim()) { setError('Vehicle model is required'); return; }
    if (!vehicleForm.color) { setError('Please select a vehicle color'); return; }
    if (!vehicleForm.insuranceExpiryDate) { setError('Insurance expiry date is required'); return; }

    setSavingStep('vehicleDetails', true);
    try {
      const res = await saveVehicleDetails({
        ...vehicleForm,
        numberPlate: vehicleForm.numberPlate.toUpperCase(),
        vehicleType: selectedVehicleType,
        driverId: driverUserId,
      });

      setVehicleId(res?.newVehicle?.id ?? null);

      // Re-confirm vehicle type on driver profile to ensure it is persisted
      await saveVehicleType({ vehicleType: selectedVehicleType, driverId: driverUserId });

      if (partnerUser?.id) {
        await apiClient.put(`/users/${driverUserId}`, { partner: partnerUser.id });
      }

      setVehicleDetailsSaved(true);
      setEditingVehicleDetails(false);
      setToast({ msg: editingVehicleDetails ? 'Vehicle details updated' : 'Vehicle saved and linked to your partner account', severity: 'success' });
    } catch (err) {
      setError(err?.message ?? 'Failed to save vehicle details');
    } finally {
      setSavingStep('vehicleDetails', false);
    }
  };

  // Attach an existing vehicle from search
  const handleAttachExistingVehicle = async (vehicle) => {
    setError(null);
    setSavingStep('attachExisting', true);
    try {
      await apiClient.post('/driver/assign-vehicle', {
        driverId: driverUserId,
        vehicleId: vehicle.id,
      });
      if (partnerUser?.id) {
        await apiClient.put(`/users/${driverUserId}`, { partner: partnerUser.id });
      }
      setVehicleId(vehicle.id);
      setAttachedExistingVehicle(vehicle);
      setExistingVehicleAttached(true);
      setToast({ msg: `Vehicle ${vehicle.numberPlate} attached to driver`, severity: 'success' });
    } catch (err) {
      setError(err?.message ?? 'Failed to attach existing vehicle');
    } finally {
      setSavingStep('attachExisting', false);
    }
  };

  // ── Vehicle confirmation flow ─────────────────────────────────────────────
  const handleVehicleSelected = (vehicle) => {
    setVehicleToConfirm(vehicle);
    setConfirmAttachOpen(true);
  };

  const handleConfirmAttach = async () => {
    setConfirmAttachOpen(false);
    if (vehicleToConfirm) {
      await handleAttachExistingVehicle(vehicleToConfirm);
      setVehicleToConfirm(null);
    }
  };

  const handleDocUpload = useCallback(async (file, field, ref, refId, stateKey) => {
    if (!refId) {
      setToast({ msg: 'Driver profile not ready — please wait a moment', severity: 'warning' });
      return;
    }
    try {
      const res = await uploadDocument(field, file, ref, refId);
      setDocs(p => ({ ...p, [stateKey]: Array.isArray(res) ? res[0] : res }));
      setToast({ msg: 'Document uploaded', severity: 'success' });
    } catch {
      setToast({ msg: `Failed to upload ${field}`, severity: 'error' });
    }
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!allRequiredDocs) { setError('Upload all required documents before submitting'); return; }
    setSavingStep('submit', true);
    try {
      await apiClient.post('/driver/onboarding/submit', { driverId: driverUserId });
      setSubmitted(true);
    } catch (err) {
      setError(err?.message ?? 'Submission failed');
    } finally {
      setSavingStep('submit', false);
    }
  };

  const resetAll = () => {
    setDriverUserId(null); setDriverProfileId(null); setVehicleId(null);
    setAccountCreated(false); setLicenseInfoSaved(false); setNationalIdSaved(false);
    setAddressSaved(false); setVehicleTypeSaved(false); setVehicleDetailsSaved(false);
    setExistingVehicleAttached(false); setAttachedExistingVehicle(null); setSubmitted(false);
    setEditingBasic(false); setEditingLicense(false); setEditingNationalId(false);
    setEditingAddress(false); setEditingVehicleType(false); setEditingVehicleDetails(false);
    setFirstName(''); setLastName(''); setPhoneNumber(''); setOrigPhone('');
    setDriverLicenseNumber(''); setLicenseExpiryDate(''); setNationalIdNumber(''); setAddress('');
    setSelectedVehicleType('taxi');
    setVehicleForm({ numberPlate: '', make: '', model: '', year: new Date().getFullYear(), color: '', seatingCapacity: 4, insuranceExpiryDate: '' });
    setDocs({ driverLicenseFront: null, driverLicenseBack: null, nationalIdFront: null, nationalIdBack: null, profilePicture: null, insuranceCertificate: null });
  };

  if (settingsLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#10B981' }} />
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 560, mx: 'auto', pt: 8 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Paper elevation={0} sx={{
              borderRadius: 4, overflow: 'hidden', textAlign: 'center',
              border: '1px solid rgba(5,150,105,0.25)',
              background: 'linear-gradient(145deg, rgba(5,150,105,0.15) 0%, rgba(16,185,129,0.05) 100%)',
            }}>
              <Box sx={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 72, color: '#fff', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Driver Registered!</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>Account submitted for verification</Typography>
              </Box>
              <Box sx={{ p: 4 }}>
                <Box sx={{ p: 2.5, borderRadius: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>{firstName} {lastName}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mt: 0.25 }}>+{phoneCode}{phoneNumber}</Typography>
                  {vehicleForm.numberPlate && (
                    <Typography sx={{ mt: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', letterSpacing: 2, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {vehicleForm.numberPlate.toUpperCase()}
                    </Typography>
                  )}
                  {attachedExistingVehicle && (
                    <Typography sx={{ mt: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', letterSpacing: 2, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {attachedExistingVehicle.numberPlate}
                    </Typography>
                  )}
                </Box>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2.5, textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>Share login credentials with driver</Typography>
                  <Typography variant="body2">Phone / Username: <strong>+{phoneCode}{phoneNumber.replace(/\D/g, '')}</strong></Typography>
                  <Typography variant="body2">Initial password: <strong style={{ fontFamily: 'monospace' }}>{phoneCode}{phoneNumber.replace(/\D/g, '')}</strong></Typography>
                </Alert>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button fullWidth variant="outlined" onClick={() => router.push(`/partner/drivers/${driverUserId}`)} sx={{ borderRadius: 2.5, fontWeight: 600, height: 48 }}>View Profile</Button>
                  <Button fullWidth variant="contained" onClick={resetAll} sx={{ borderRadius: 2.5, fontWeight: 700, height: 48, background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>Register Another</Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Box>
      </Box>
    );
  }

  const stepsCompleted = [licenseInfoSaved, nationalIdSaved, addressSaved, vehicleTypeSaved, vehicleDetailsSaved || existingVehicleAttached].filter(Boolean).length;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a' }}>
      {/* Modals */}
      <AddMakeModelModal
        open={addMakeModelOpen}
        onClose={() => setAddMakeModelOpen(false)}
        onConfirm={(make, model) => {
          setMakesList(prev => prev.includes(make) ? prev : [...prev, make]);
          setVehicleForm(p => ({ ...p, make, model }));
        }}
      />
      <ExistingVehicleSearchModal
        open={existingVehicleSearchOpen}
        onClose={() => setExistingVehicleSearchOpen(false)}
        onSelect={handleVehicleSelected}
      />
      <ConfirmAttachVehicleModal
        open={confirmAttachOpen}
        onClose={() => { setConfirmAttachOpen(false); setVehicleToConfirm(null); }}
        onConfirm={handleConfirmAttach}
        vehicle={vehicleToConfirm}
      />

      {/* Sticky header */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 100, px: 3, py: 2,
        background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <IconButton onClick={() => requestLeave(() => router.back())} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem', lineHeight: 1.2 }}>Register Ride Driver</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
            {accountCreated ? `Onboarding ${firstName} ${lastName}` : 'Complete all steps to onboard a driver'}
          </Typography>
        </Box>
        {accountCreated && (
          <Chip size="small" label={`${stepsCompleted}/5 steps`}
            sx={{ bgcolor: alpha('#059669', 0.2), color: '#10B981', fontWeight: 700, fontSize: '0.7rem' }} />
        )}
      </Box>

      <Box sx={{ maxWidth: 720, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: 2.5 }}>{error}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Section 1: Driver Identity ══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionCard
            icon={PersonIcon}
            title="Driver Identity"
            subtitle="Create the driver's account — phone number becomes their password"
            locked={false}
            completed={accountCreated}
            onEdit={accountCreated ? () => setEditingBasic(true) : undefined}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TwoCol>
                <TextField fullWidth label="First Name" value={firstName} required onChange={e => setFirstName(e.target.value)} disabled={accountCreated && !editingBasic} sx={fieldSx} />
                <TextField fullWidth label="Last Name" value={lastName} required onChange={e => setLastName(e.target.value)} disabled={accountCreated && !editingBasic} sx={fieldSx} />
              </TwoCol>
              <TextField
                fullWidth label="Phone Number" value={phoneNumber} required
                onChange={e => setPhoneNumber(e.target.value)} placeholder="97XXXXXXXX"
                helperText={
                  editingBasic
                    ? 'Changing the phone number will also update the login username'
                    : accountCreated
                      ? undefined
                      : 'Becomes their username and initial login password'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', ml: 0.5 }}>+{phoneCode}</Typography>
                    </InputAdornment>
                  ),
                }}
                disabled={accountCreated && !editingBasic}
                sx={fieldSx}
              />
              {!accountCreated && (
                <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                  <Typography variant="caption">The driver's initial password will be their full phone number (country code + digits). They should change it on first login.</Typography>
                </Alert>
              )}

              {!accountCreated && (
                <SaveBtn onClick={handleCreateAccount} loading={saving.account} done={false} label="Create Driver Account" />
              )}

              {accountCreated && editingBasic && (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <SaveBtn onClick={handleUpdateBasic} loading={saving.basic} done={false} label="Update Basic Info" />
                  <Button variant="text" size="small" onClick={() => setEditingBasic(false)}
                    sx={{ mt: 2.5, height: 48, px: 3, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2.5 }}>
                    Cancel
                  </Button>
                </Box>
              )}

              {accountCreated && !editingBasic && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: '#10B981' }}>
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Account created — {firstName} {lastName}</Typography>
                </Box>
              )}
            </Box>
          </SectionCard>
        </motion.div>

        {/* ══ Section 2: Driver's License ══ */}
        {reqLicense && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <SectionCard icon={DocIcon} title="Driver's License" subtitle="License number, expiry date, and photos of both sides" color="#7C3AED" locked={!licenseGate} completed={licenseComplete} onEdit={() => setEditingLicense(true)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TwoCol>
                  <TextField fullWidth label="License Number" value={driverLicenseNumber} onChange={e => setDriverLicenseNumber(e.target.value.toUpperCase())} placeholder="e.g., DL-123456" disabled={licenseInfoSaved && !editingLicense} sx={fieldSx} />
                  <TextField fullWidth type="date" label="License Expiry Date" value={licenseExpiryDate} onChange={e => setLicenseExpiryDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split('T')[0] }} disabled={licenseInfoSaved && !editingLicense} sx={fieldSx} />
                </TwoCol>
                <SaveBtn onClick={handleSaveLicense} loading={saving.license} done={licenseInfoSaved} editing={editingLicense} label="Save License Info" updateLabel="Update License Info" doneLabel="License info saved" color="#7C3AED" />
                {editingLicense && <Button variant="text" size="small" onClick={() => setEditingLicense(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
                {licenseInfoSaved && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Upload License Photos</Typography>
                    <DocumentUploadCard title="License — Front" description="Clear photo of the front side"
                      onUpload={f => handleDocUpload(f, 'driverLicenseFront', 'driver-profiles.driver-profile', driverProfileId, 'driverLicenseFront')}
                      uploadedFile={docs.driverLicenseFront} onRemove={() => setDocs(p => ({ ...p, driverLicenseFront: null }))} />
                    <DocumentUploadCard title="License — Back" description="Clear photo of the back side"
                      onUpload={f => handleDocUpload(f, 'driverLicenseBack', 'driver-profiles.driver-profile', driverProfileId, 'driverLicenseBack')}
                      uploadedFile={docs.driverLicenseBack} onRemove={() => setDocs(p => ({ ...p, driverLicenseBack: null }))} />
                    {!licenseComplete && <Alert severity="info" sx={{ borderRadius: 2.5 }}><Typography variant="caption">Upload both sides of the license to unlock the next section.</Typography></Alert>}
                  </Box>
                )}
              </Box>
            </SectionCard>
          </motion.div>
        )}

        {/* ══ Section 3: National ID (NRC) ══ */}
        {reqNRC && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SectionCard icon={BadgeIcon} title="National ID (NRC)" subtitle="NRC number and photos of both sides" color="#0EA5E9" locked={!nrcGate} completed={nrcComplete} onEdit={() => setEditingNationalId(true)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField fullWidth label="NRC Number" value={nationalIdNumber} required onChange={e => setNationalIdNumber(e.target.value)} placeholder="e.g., 123456/78/9" disabled={nationalIdSaved && !editingNationalId} sx={fieldSx} />
                <SaveBtn onClick={handleSaveNationalId} loading={saving.nationalId} done={nationalIdSaved} editing={editingNationalId} label="Save NRC Info" updateLabel="Update NRC Info" doneLabel="NRC info saved" color="#0EA5E9" />
                {editingNationalId && <Button variant="text" size="small" onClick={() => setEditingNationalId(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
                {nationalIdSaved && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Upload NRC Photos</Typography>
                    <DocumentUploadCard title="NRC — Front" description="Clear photo of the front"
                      onUpload={f => handleDocUpload(f, 'nationalIdFront', 'driver-profiles.driver-profile', driverProfileId, 'nationalIdFront')}
                      uploadedFile={docs.nationalIdFront} onRemove={() => setDocs(p => ({ ...p, nationalIdFront: null }))} />
                    <DocumentUploadCard title="NRC — Back" description="Clear photo of the back"
                      onUpload={f => handleDocUpload(f, 'nationalIdBack', 'driver-profiles.driver-profile', driverProfileId, 'nationalIdBack')}
                      uploadedFile={docs.nationalIdBack} onRemove={() => setDocs(p => ({ ...p, nationalIdBack: null }))} />
                    {!nrcComplete && <Alert severity="info" sx={{ borderRadius: 2.5 }}><Typography variant="caption">Upload both sides of the NRC to unlock the next section.</Typography></Alert>}
                  </Box>
                )}
              </Box>
            </SectionCard>
          </motion.div>
        )}

        {/* ══ Section 4: Residential Address ══ */}
        {reqAddress && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <SectionCard icon={HomeIcon} title="Residential Address" subtitle="Driver's home address" color="#F59E0B" locked={!addressGate} completed={addressSaved} onEdit={() => setEditingAddress(true)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField fullWidth label="Address" value={address} multiline rows={2} onChange={e => setAddress(e.target.value)} placeholder="House No, Street, Area, City" disabled={addressSaved && !editingAddress}
                  InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mt: '-12px !important', alignSelf: 'flex-start', pt: 1.5 }}><HomeIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} /></InputAdornment> }}
                  sx={fieldSx} />
                <SaveBtn onClick={handleSaveAddress} loading={saving.address} done={addressSaved} editing={editingAddress} label="Save Address" updateLabel="Update Address" doneLabel="Address saved" color="#F59E0B" />
                {editingAddress && <Button variant="text" size="small" onClick={() => setEditingAddress(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
              </Box>
            </SectionCard>
          </motion.div>
        )}

        {/* ══ Section 5: Vehicle Type ══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <SectionCard icon={CarIcon} title="Vehicle Type" subtitle="Select the type of vehicle the driver operates" locked={!vehicleTypeGate} completed={vehicleTypeSaved} onEdit={() => setEditingVehicleType(true)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {RIDE_VEHICLE_TYPES.map(({ value, label, Icon: VtIcon, color: vtColor }) => {
                const selected = selectedVehicleType === value;
                const disabled = vehicleTypeSaved && !editingVehicleType;
                return (
                  <Paper key={value} elevation={0} onClick={() => !disabled && setSelectedVehicleType(value)} sx={{
                    p: 2, borderRadius: 3, cursor: disabled ? 'default' : 'pointer',
                    border: `2px solid ${selected ? vtColor : 'rgba(255,255,255,0.07)'}`,
                    background: selected ? alpha(vtColor, 0.12) : 'rgba(255,255,255,0.02)',
                    display: 'flex', alignItems: 'center', gap: 2,
                    opacity: disabled && !selected ? 0.35 : 1, transition: 'all 0.2s ease',
                    '&:hover': !disabled ? { borderColor: vtColor, transform: 'translateY(-1px)' } : {},
                  }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, flexShrink: 0, bgcolor: alpha(vtColor, selected ? 0.25 : 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: vtColor }}>
                      <VtIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography sx={{ flex: 1, fontWeight: 700, color: selected ? vtColor : '#fff' }}>{label}</Typography>
                    <Radio checked={selected} size="small" disabled={disabled} sx={{ color: vtColor, '&.Mui-checked': { color: vtColor }, p: 0 }} />
                  </Paper>
                );
              })}
              <SaveBtn onClick={handleSaveVehicleType} loading={saving.vehicleType} done={vehicleTypeSaved} editing={editingVehicleType} label="Confirm Vehicle Type" updateLabel="Update Vehicle Type" doneLabel={`${RIDE_VEHICLE_TYPES.find(t => t.value === selectedVehicleType)?.label ?? selectedVehicleType} confirmed`} />
              {editingVehicleType && <Button variant="text" size="small" onClick={() => setEditingVehicleType(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
            </Box>
          </SectionCard>
        </motion.div>

        {/* ══ Section 6: Vehicle — Existing or New ══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <SectionCard icon={CarIcon} title="Vehicle" subtitle="Attach an existing vehicle or register a new one" color="#F59E0B" locked={!vehicleDetGate} completed={vehicleDetailsSaved || existingVehicleAttached} onEdit={vehicleDetailsSaved ? () => setEditingVehicleDetails(true) : undefined}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

              {attachedExistingVehicle && (
                <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>Attached Vehicle</Typography>
                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.1rem', color: '#34D399', letterSpacing: 2 }}>{attachedExistingVehicle.numberPlate}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', mt: 0.25 }}>{attachedExistingVehicle.make} {attachedExistingVehicle.model} · {attachedExistingVehicle.year}</Typography>
                  </Box>
                  <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
                </Box>
              )}

              {!existingVehicleAttached && (
                <Button fullWidth variant="outlined" startIcon={saving.attachExisting ? <CircularProgress size={16} /> : <SearchIcon />}
                  onClick={() => setExistingVehicleSearchOpen(true)} disabled={saving.attachExisting}
                  sx={{ borderRadius: 2.5, fontWeight: 700, height: 48, borderColor: alpha('#10B981', 0.5), color: '#34D399', '&:hover': { borderColor: '#10B981', bgcolor: alpha('#10B981', 0.08) } }}>
                  {saving.attachExisting ? 'Attaching…' : 'Attach Existing Vehicle to Driver'}
                </Button>
              )}

              {!existingVehicleAttached && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.07)' }} />
                  <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OR REGISTER NEW</Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.07)' }} />
                </Box>
              )}

              {!existingVehicleAttached && (
                <>
                  <TextField fullWidth label="Number Plate" value={vehicleForm.numberPlate} required
                    onChange={e => setVehicleForm(p => ({ ...p, numberPlate: e.target.value.toUpperCase() }))}
                    placeholder="e.g., ALZ 1234" disabled={vehicleDetailsSaved && !editingVehicleDetails} sx={monoSx} />

                  <TwoCol>
                    <Box>
                      <Autocomplete fullWidth freeSolo options={makesList} value={vehicleForm.make}
                        onChange={(_, v) => setVehicleForm(p => ({ ...p, make: v ?? '', model: '' }))}
                        disabled={vehicleDetailsSaved && !editingVehicleDetails}
                        renderInput={params => <TextField {...params} label="Make" placeholder="e.g., Toyota" required sx={fieldSx} />}
                      />
                      {!(vehicleDetailsSaved && !editingVehicleDetails) && (
                        <Button size="small" variant="text" startIcon={<AddNewIcon sx={{ fontSize: 14 }} />}
                          onClick={() => setAddMakeModelOpen(true)}
                          sx={{ mt: 0.5, color: '#A78BFA', fontWeight: 600, fontSize: '0.72rem', textTransform: 'none', px: 0.5 }}>
                          Add name if not in list
                        </Button>
                      )}
                    </Box>
                    <Autocomplete fullWidth freeSolo options={modelsList} value={vehicleForm.model}
                      onChange={(_, v) => setVehicleForm(p => ({ ...p, model: v ?? '' }))}
                      disabled={!vehicleForm.make || (vehicleDetailsSaved && !editingVehicleDetails)}
                      renderInput={params => <TextField {...params} label="Model" placeholder="e.g., Corolla" required sx={fieldSx} />}
                    />
                  </TwoCol>

                  <TwoCol>
                    <TextField select fullWidth label="Year" value={vehicleForm.year} required onChange={e => setVehicleForm(p => ({ ...p, year: parseInt(e.target.value) }))} disabled={vehicleDetailsSaved && !editingVehicleDetails} sx={fieldSx}>
                      {[...allowedYears].reverse().map(y => <MenuItem key={y} value={parseInt(y)}>{y}</MenuItem>)}
                    </TextField>
                    <TextField fullWidth type="number" label="Seating Capacity" value={vehicleForm.seatingCapacity}
                      onChange={e => setVehicleForm(p => ({ ...p, seatingCapacity: parseInt(e.target.value) }))}
                      inputProps={{ min: 2, max: 50 }} disabled={vehicleDetailsSaved && !editingVehicleDetails} sx={fieldSx} />
                  </TwoCol>

                  <VehicleColorPicker value={vehicleForm.color} onChange={k => setVehicleForm(p => ({ ...p, color: k }))} disabled={vehicleDetailsSaved && !editingVehicleDetails} helperText="Select vehicle color" />

                  <TextField fullWidth type="date" label="Insurance Expiry Date" value={vehicleForm.insuranceExpiryDate}
                    onChange={e => setVehicleForm(p => ({ ...p, insuranceExpiryDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }} helperText="When does the vehicle insurance expire?"
                    inputProps={{ min: new Date().toISOString().split('T')[0] }} disabled={vehicleDetailsSaved && !editingVehicleDetails} sx={fieldSx} />

                  <SaveBtn onClick={handleSaveVehicleDetails} loading={saving.vehicleDetails} done={vehicleDetailsSaved} editing={editingVehicleDetails} label="Save Vehicle Details" updateLabel="Update Vehicle Details" doneLabel="Vehicle saved and linked to your partner account" color="#F59E0B" />
                  {editingVehicleDetails && <Button variant="text" size="small" onClick={() => setEditingVehicleDetails(false)} sx={{ alignSelf: 'flex-start', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel editing</Button>}
                </>
              )}
            </Box>
          </SectionCard>
        </motion.div>

        {/* ══ Section 7: Profile Picture & Insurance ══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <SectionCard icon={CameraIcon} title="Profile Picture & Insurance" subtitle={`Driver photo (required)${reqInsurance ? ' and insurance certificate (required)' : ''}`} color="#0EA5E9" locked={!photoGate} completed={!!docs.profilePicture && (!reqInsurance || !!docs.insuranceCertificate)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <DocumentUploadCard title="Profile Photo" description="Clear, well-lit photo of the driver's face" acceptedFormats="image/*"
                onUpload={f => handleDocUpload(f, 'profilePicture', 'plugin::users-permissions.user', driverUserId, 'profilePicture')}
                uploadedFile={docs.profilePicture} onRemove={() => setDocs(p => ({ ...p, profilePicture: null }))} />
              {reqInsurance ? (
                <DocumentUploadCard title="Insurance Certificate" description="Valid insurance disk or certificate"
                  onUpload={f => handleDocUpload(f, 'insuranceCertificate', 'api::vehicle.vehicle', vehicleId, 'insuranceCertificate')}
                  uploadedFile={docs.insuranceCertificate} onRemove={() => setDocs(p => ({ ...p, insuranceCertificate: null }))} />
              ) : (
                <DocumentUploadCard title="Insurance Certificate" description="Optional — valid insurance disk or certificate"
                  onUpload={f => handleDocUpload(f, 'insuranceCertificate', 'api::vehicle.vehicle', vehicleId, 'insuranceCertificate')}
                  uploadedFile={docs.insuranceCertificate} onRemove={() => setDocs(p => ({ ...p, insuranceCertificate: null }))} />
              )}
            </Box>
          </SectionCard>
        </motion.div>

        {/* ══ Section 8: Submit for Verification ══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionCard icon={CheckCircleIcon} title="Submit for Verification" subtitle="Final step — send driver for admin approval" color="#059669" locked={!submitGate}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {!allRequiredDocs && (
                <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                  <Typography variant="body2">
                    Required before submitting:{reqLicense && ' license photos (front & back),'}{reqNRC && ' NRC photos (front & back),'}{' '}and a profile picture.
                  </Typography>
                </Alert>
              )}
              <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>Important notice</Typography>
                <Typography variant="body2">After submission, the driver will not receive orders until their account is verified. This typically takes 24–48 hours.</Typography>
              </Alert>
              <Button fullWidth variant="contained" size="large" onClick={handleSubmit} disabled={saving.submit || !allRequiredDocs}
                startIcon={saving.submit ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : null}
                sx={{ height: 56, borderRadius: 3, fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', boxShadow: '0 6px 20px rgba(5,150,105,0.35)', '&:hover': { boxShadow: '0 8px 24px rgba(5,150,105,0.5)', transform: 'translateY(-1px)' }, '&:disabled': { background: 'rgba(255,255,255,0.08)', boxShadow: 'none' }, transition: 'all 0.2s ease' }}>
                {saving.submit ? 'Submitting…' : 'Submit Driver for Verification'}
              </Button>
            </Box>
          </SectionCard>
        </motion.div>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2.5 }}>{toast?.msg}</Alert>
      </Snackbar>
      <Dialog
        open={leaveDialogOpen}
        onClose={cancelLeave}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: '#111827',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Leave this page?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Do you really want to leave without registering the driver?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={confirmLeave}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Yes
          </Button>
          <Button
            onClick={cancelLeave}
            variant="contained"
            autoFocus
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}