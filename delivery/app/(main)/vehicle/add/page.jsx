// PATH: delivery-driver/app/(main)/vehicle/add/page.jsx
// ─── Changes from the ride driver version ────────────────────────────────────
// 1. Vehicle type options: taxi | motorbike | motorcycle | truck (not bus)
// 2. Vehicle image changes based on selected type (bike SVG for motorbike/motorcycle)
// 3. getVehicleTypeFromDriverProfile reads deliveryProfile.activeVehicleType
// 4. addVehicle / submitForVerification already point to /delivery-driver/* (patched in vehicle.js)
// 5. All other logic (documents, photos, edit dialog) is identical

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, TextField, Button, Paper, MenuItem,
  IconButton, Alert, Chip, Dialog, DialogContent, DialogActions,
  Tooltip, CircularProgress, Autocomplete,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Edit as EditIcon, Check as CheckIcon,
  Warning as WarningIcon, Lock as LockIcon,
  ConfirmationNumber as PlateIcon, EventSeat as SeatsIcon,
} from '@mui/icons-material';
import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard';
import {
  addVehicle, updateVehicle, getVehicleMakesAndModels,
  getAllowedVehicleYears, getVehicleFromDeliveryProfile, submitForVerification,
  getDriverVehicle,
} from '@/lib/api/vehicle';
import { uploadDocument } from '@/lib/api/onboarding';
import { useDeliveryDriver } from '@/lib/hooks/useDeliveryDriver';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { VehicleColorPicker, getColorByKey } from '@/components/ui/VehicleColorPicker';
import { apiClient } from '@/lib/api/client';

// ─── Delivery vehicle types ───────────────────────────────────────────────────
const DELIVERY_VEHICLE_TYPES = [
  { value: 'taxi',       label: 'Car / Taxi' },
  { value: 'motorbike',  label: 'Motorbike' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'truck',      label: 'Truck' },
];

// ─── Vehicle silhouette SVG components ───────────────────────────────────────

function CarSilhouette({ color = '#CBD5E1', size = 120 }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="40" width="140" height="40" rx="6" fill={color} />
      <path d="M60 40 L75 15 L130 15 L148 40" fill={color} />
      <rect x="25" y="58" width="20" height="8" rx="3" fill="rgba(0,0,0,0.2)" />
      <rect x="155" y="58" width="20" height="8" rx="3" fill="rgba(0,0,0,0.2)" />
      <circle cx="60" cy="80" r="14" fill="#1E293B" />
      <circle cx="60" cy="80" r="9" fill={color} opacity="0.5" />
      <circle cx="60" cy="80" r="4" fill="#0F172A" />
      <circle cx="140" cy="80" r="14" fill="#1E293B" />
      <circle cx="140" cy="80" r="9" fill={color} opacity="0.5" />
      <circle cx="140" cy="80" r="4" fill="#0F172A" />
      <rect x="76" y="20" width="50" height="18" rx="3" fill="rgba(147,197,253,0.4)" />
    </svg>
  );
}

function BikeSilhouette({ color = '#CBD5E1', size = 120 }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Frame */}
      <path d="M60 100 L90 50 L130 50 L160 100" stroke={color} strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M100 50 L100 80 L130 100" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Seat */}
      <rect x="90" y="44" width="42" height="9" rx="4" fill={color} />
      {/* Handlebars */}
      <path d="M145 52 L160 42 M145 52 L155 58" stroke={color} strokeWidth="5" strokeLinecap="round" />
      {/* Engine block */}
      <rect x="92" y="72" width="28" height="18" rx="4" fill={color} opacity="0.6" />
      {/* Front wheel */}
      <circle cx="155" cy="105" r="26" stroke="#1E293B" strokeWidth="3" fill="none" />
      <circle cx="155" cy="105" r="20" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="155" cy="105" r="5" fill="#1E293B" />
      {/* Rear wheel */}
      <circle cx="50" cy="105" r="26" stroke="#1E293B" strokeWidth="3" fill="none" />
      <circle cx="50" cy="105" r="20" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="50" cy="105" r="5" fill="#1E293B" />
      {/* Exhaust */}
      <path d="M90 88 L70 92 L60 88" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* Headlight */}
      <ellipse cx="168" cy="82" rx="7" ry="5" fill="rgba(253,230,138,0.7)" />
    </svg>
  );
}

function TruckSilhouette({ color = '#CBD5E1', size = 120 }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 220 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cargo box */}
      <rect x="10" y="25" width="120" height="55" rx="4" fill={color} />
      {/* Cab */}
      <rect x="130" y="38" width="70" height="42" rx="5" fill={color} opacity="0.85" />
      <path d="M130 38 L145 20 L200 20 L200 38" fill={color} opacity="0.7" />
      {/* Windows */}
      <rect x="148" y="24" width="40" height="13" rx="3" fill="rgba(147,197,253,0.5)" />
      {/* Wheels */}
      <circle cx="45" cy="82" r="14" fill="#1E293B" /><circle cx="45" cy="82" r="8" fill={color} opacity="0.4" /><circle cx="45" cy="82" r="3" fill="#0F172A" />
      <circle cx="95" cy="82" r="14" fill="#1E293B" /><circle cx="95" cy="82" r="8" fill={color} opacity="0.4" /><circle cx="95" cy="82" r="3" fill="#0F172A" />
      <circle cx="160" cy="82" r="13" fill="#1E293B" /><circle cx="160" cy="82" r="8" fill={color} opacity="0.4" /><circle cx="160" cy="82" r="3" fill="#0F172A" />
      {/* Cargo door lines */}
      <line x1="10" y1="55" x2="130" y2="55" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
      <line x1="70" y1="25" x2="70" y2="80" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
    </svg>
  );
}

function VehicleSilhouette({ type, colorKey, size = 120 }) {
  const resolvedColor = getColorByKey(colorKey)?.body ?? '#CBD5E1';
  if (type === 'motorbike' || type === 'motorcycle') return <BikeSilhouette color={resolvedColor} size={size} />;
  if (type === 'truck') return <TruckSilhouette color={resolvedColor} size={size} />;
  return <CarSilhouette color={resolvedColor} size={size} />;
}

// ─── Layout helpers (same as ride driver version) ─────────────────────────────
const fieldStyles = { '& .MuiOutlinedInput-root': { borderRadius: 2.5 } };
const monoFieldStyles = { '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 } };
const FullRow = ({ children }) => <div style={{ width: '100%' }}>{children}</div>;
const TwoCol  = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px' }} className="two-col-grid">{children}</div>;
const PhotoGrid = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px', marginBottom: '24px' }} className="photo-grid">{children}</div>;
const FieldStack = ({ children }) => <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>{children}</div>;
const ResponsiveStyle = () => (
  <style>{`@media(max-width:600px){.two-col-grid{grid-template-columns:1fr!important;}.photo-grid{grid-template-columns:1fr!important;}}`}</style>
);

export default function AddDeliveryVehiclePage() {
  const router = useRouter();
  // useDeliveryDriver returns the full user object under the 'deliveryProfile' key.
  // The actual delivery profile is nested one level deeper at user.deliveryProfile.
  const { deliveryProfile: _hookData } = useDeliveryDriver();
  const deliveryProfile = _hookData?.deliveryProfile ?? null;
  const { loading: settingsLoading, isInsuranceRequired, isRoadTaxRequired, isFitnessDocumentRequired, isVehicleRegistrationRequired } = useAdminSettings();

  const [loading,         setLoading]         = useState(false);
  const [loadingVehicle,  setLoadingVehicle]  = useState(false);
  const [loadingData,     setLoadingData]     = useState(true);
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [error,           setError]           = useState(null);
  const [success,         setSuccess]         = useState(null);
  const [isEditMode,      setIsEditMode]      = useState(false);
  const [editDialogOpen,  setEditDialogOpen]  = useState(false);
  const [existingVehicle, setExistingVehicle] = useState(null);
  const [vehicleId,       setVehicleId]       = useState(null);
  const [hasBasicInfoSaved, setHasBasicInfoSaved] = useState(false);

  const [makesAndModels, setMakesAndModels] = useState({});
  const [makesLoading, setMakesLoading] = useState(false);
  const [allowedYears,   setAllowedYears]   = useState([]);
  const [makesList,      setMakesList]      = useState([]);
  const [modelsList,     setModelsList]     = useState([]);

  // ─── KEY CHANGE: read activeVehicleType from deliveryProfile ─────────────
  const getVehicleTypeFromDriverProfile = useMemo(() => {
    const active = deliveryProfile?.activeVehicleType;
    const resolved = (active && active !== 'none') ? active : 'taxi';
    console.log('[VehicleType] deliveryProfile?.activeVehicleType =', active, '→ resolved =', resolved);
    return resolved;
  }, [deliveryProfile]);

  const [vehicleData, setVehicleData] = useState({
    vehicleType:         getVehicleTypeFromDriverProfile,
    numberPlate:         '',
    make:                '',
    model:               '',
    year:                new Date().getFullYear(),
    color:               '',
    seatingCapacity:     2,
    insuranceExpiryDate: '',
  });

  const [uploadedDocs, setUploadedDocs] = useState({
    registrationDocument: null, insuranceCertificate: null,
    roadTaxCertificate: null,   fitnessDocument: null,
  });

  const [vehiclePhotos, setVehiclePhotos] = useState({
    front: null, back: null, left: null, right: null,
  });

  // ─── Map vehicle type → API type parameter ───────────────────────────────
  // taxi/truck → undefined (car list)
  // motorbike/motorcycle → 'motorbike'
  const apiTypeForVehicle = useCallback((vType) => {
    if (vType === 'motorbike' || vType === 'motorcycle') return 'motorbike';
    return undefined; // returns car/truck list
  }, []);

  // ─── Load allowed years once ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const years  = await getAllowedVehicleYears();
        const cur    = new Date().getFullYear();
        const sorted = [...years].sort((a, b) => parseInt(a) - parseInt(b));
        const last   = parseInt(sorted[sorted.length - 1] ?? cur);
        const extended = last >= cur
          ? sorted
          : [...sorted, ...Array.from({ length: cur - last + 1 }, (_, i) => (last + i + 1).toString())];
        setAllowedYears(extended);
      } catch { /* use defaults */ }
      finally  { setLoadingData(false); }
    })();
  }, []);

  // ─── Reload makes/models whenever vehicleType changes ────────────────────
  // Clears make + model selections so stale values don't carry over when
  // switching between car and motorbike (they have completely different lists).
  useEffect(() => {
    if (!vehicleData.vehicleType) return;
    const apiType = apiTypeForVehicle(vehicleData.vehicleType);
    console.log('[MakesModels] vehicleType changed →', vehicleData.vehicleType, '| apiType =', apiType, '| hasBasicInfoSaved =', hasBasicInfoSaved);
    let cancelled = false;
    setMakesLoading(true);
    (async () => {
      try {
        const mm = await getVehicleMakesAndModels(apiType);
        if (cancelled) return;
        console.log('[MakesModels] loaded', Object.keys(mm).length, 'makes for type', vehicleData.vehicleType);
        setMakesAndModels(mm);
        setMakesList(Object.keys(mm));
        setModelsList([]);
        if (!hasBasicInfoSaved) {
          console.log('[MakesModels] ⚠️ hasBasicInfoSaved=false — clearing make+model');
          setVehicleData(prev => ({ ...prev, make: '', model: '' }));
        } else {
          console.log('[MakesModels] ✅ hasBasicInfoSaved=true — keeping make+model');
        }
      } catch { /* keep previous list */ }
      finally { if (!cancelled) setMakesLoading(false); }
    })();
    return () => { cancelled = true; setMakesLoading(false); };
  }, [vehicleData.vehicleType, hasBasicInfoSaved, apiTypeForVehicle]);

  // Update model options whenever make or the loaded makes/models list changes
  useEffect(() => {
    if (vehicleData.make && makesAndModels[vehicleData.make]) {
      setModelsList(makesAndModels[vehicleData.make]);
    } else {
      setModelsList([]);
    }
  }, [vehicleData.make, makesAndModels]);

  useEffect(() => {
    console.log('[SyncVehicleType] getVehicleTypeFromDriverProfile =', getVehicleTypeFromDriverProfile, '| isEditMode =', isEditMode);
    if (getVehicleTypeFromDriverProfile && !isEditMode) {
      console.log('[SyncVehicleType] ✅ Setting vehicleType →', getVehicleTypeFromDriverProfile);
      setVehicleData(p => ({ ...p, vehicleType: getVehicleTypeFromDriverProfile }));
    } else {
      console.log('[SyncVehicleType] ⏭ Skipped (isEditMode is true)');
    }
  }, [getVehicleTypeFromDriverProfile, isEditMode]);

  // ─── Load existing vehicle from already-loaded deliveryProfile ───────────
  useEffect(() => {
    console.log('[LoadVehicle] deliveryProfile =', JSON.stringify(deliveryProfile, null, 2));
    const result = getVehicleFromDeliveryProfile(deliveryProfile);
    console.log('[LoadVehicle] getVehicleFromDeliveryProfile result =', result);

    if (!result.hasVehicle) {
      console.log('[LoadVehicle] ⏭ No vehicle found — skipping load');
      return;
    }

    setLoadingVehicle(true);
    try {
     const loadVehicleDetails = async()=>{
        let v = result.vehicle;
        const vehicleRes = await apiClient.get('/vehicles/'+v.id+"?populate=insuranceCertificate,vehiclePhotos")
        v = vehicleRes?.data || vehicleRes
        setExistingVehicle(v);
        setVehicleId(v.id);
        setHasBasicInfoSaved(true);
        setIsEditMode(true);
        const newVehicleData = {
          vehicleType:         result.activeVehicleType ?? getVehicleTypeFromDriverProfile,
          numberPlate:         v.numberPlate         ?? '',
          make:                v.make                ?? '',
          model:               v.model               ?? '',
          year:                v.year                ?? new Date().getFullYear(),
          color:               v.color               ?? '',
          seatingCapacity:     v.seatingCapacity      ?? 2,
          insuranceExpiryDate: v.insuranceExpiryDate
            ? new Date(v.insuranceExpiryDate).toISOString().split('T')[0] : '',
        };
        console.log('[LoadVehicle] setting vehicleData →', newVehicleData);
        setVehicleData(newVehicleData);
        setUploadedDocs({
          registrationDocument: v.registrationDocument ?? null,
          insuranceCertificate: v.insuranceCertificate ?? null,
          roadTaxCertificate:   v.roadTaxCertificate   ?? null,
          fitnessDocument:      v.fitnessDocument      ?? null,
        });
        if (v.vehiclePhotos?.length) {
          setVehiclePhotos({
            front: v.vehiclePhotos[0] ?? null,
            back:  v.vehiclePhotos[1] ?? null,
            left:  v.vehiclePhotos[2] ?? null,
            right: v.vehiclePhotos[3] ?? null,
          });
        }
      }
      loadVehicleDetails()
    }
    catch { setError('Failed to load vehicle details'); }
    finally  { setLoadingVehicle(false); }
  }, [deliveryProfile, getVehicleTypeFromDriverProfile]);


  // FIX B: named handler — also re-POSTs to onboarding endpoint after updating
  // the Vehicle record so deliveryProfile.[vehicleType].vehicle stays in sync.
  const handleUpdateVehicle = async () => {
    if (!existingVehicle?.id) return;
    if (!vehicleData.color) { setError('Please select a vehicle colour before saving.'); return; }

    setSavingBasicInfo(true); setError(null);
    try {
      const payload = {
        vehicleType:         vehicleData.vehicleType,
        numberPlate:         vehicleData.numberPlate.trim().toUpperCase(),
        make:                vehicleData.make.trim(),
        model:               vehicleData.model.trim(),
        year:                vehicleData.year,
        color:               vehicleData.color,
        seatingCapacity:     vehicleData.seatingCapacity,
        insuranceExpiryDate: vehicleData.insuranceExpiryDate,
      };

      // Step 1 — patch the Vehicle record
      const res = await updateVehicle(existingVehicle.id, payload);
      if (!res.success) { setError(res.error ?? 'Failed to update vehicle'); return; }

      // Step 2 — re-sync deliveryProfile sub-component.
      // addVehicle calls the onboarding endpoint which updates the sub-component
      // directly via delivery-vehicles.${vehicleType} (our new backend pattern).
      await addVehicle(payload); // POST /delivery-driver/onboarding/vehicle-details

      // Step 3 — reflect the new values locally (deliveryProfile hook will
      // also re-fetch in the background; use the payload we just sent as the
      // source of truth rather than making another API call).
      setExistingVehicle((prev) => ({ ...prev, ...payload }));

      setSuccess('Vehicle details updated successfully!');
      setEditDialogOpen(false);
    } catch (err) { setError(err.message ?? 'An unexpected error occurred'); }
    finally { setSavingBasicInfo(false); }
  };
  const handleChange      = (e) => { const { name, value } = e.target; setVehicleData(p => ({ ...p, [name]: value })); };
  const handleMakeChange  = (_, v) => setVehicleData(p => ({...p, make:v??'', model:''}));
  const handleModelChange = (_, v) => setVehicleData(p => ({...p, model:v??''}));

  const handleSaveBasicInfo = async () => {
    if (!vehicleData.numberPlate.trim()) { setError('Number plate is required');         return; }
    if (!vehicleData.make.trim())        { setError('Vehicle make is required');          return; }
    if (!vehicleData.model.trim())       { setError('Vehicle model is required');         return; }
    if (!vehicleData.insuranceExpiryDate){ setError('Insurance expiry date is required'); return; }
    // FIX A: color guard — surfaces problem before a useless network round-trip
    if (!vehicleData.color)              { setError('Please select a vehicle colour before saving.'); return; }

    setSavingBasicInfo(true); setError(null);
    try {
      // FIX A: explicit payload — nothing accidentally omitted, color is named
      const payload = {
        vehicleType:         vehicleData.vehicleType,
        numberPlate:         vehicleData.numberPlate.trim().toUpperCase(),
        make:                vehicleData.make.trim(),
        model:               vehicleData.model.trim(),
        year:                vehicleData.year,
        color:               vehicleData.color,           // ← named explicitly
        seatingCapacity:     vehicleData.seatingCapacity,
        insuranceExpiryDate: vehicleData.insuranceExpiryDate,
      };
      const res = await addVehicle(payload); // POST /delivery-driver/onboarding/vehicle-details
      if (res.success) {
        setVehicleId(res.vehicle.id);
        setExistingVehicle(res.vehicle);
        setHasBasicInfoSaved(true);
        setSuccess('Vehicle information saved! Now upload the required documents.');
      } else {
        setError(res.error ?? 'Failed to save vehicle information');
      }
    } catch (err) { setError(err.message ?? 'An unexpected error occurred'); }
    finally { setSavingBasicInfo(false); }
  };

  const handleDocumentUpload = async (file, docType) => {
    if (!vehicleId) { setError('Please save vehicle information first'); return; }
    try {
      const res = await uploadDocument(docType, file, 'api::vehicle.vehicle', vehicleId);
      setUploadedDocs(p => ({ ...p, [docType]: Array.isArray(res)?res[0]:res }));
      setSuccess(`${docType} uploaded successfully`);
    } catch { setError(`Failed to upload ${docType}`); }
  };

  const handleVehiclePhotoUpload = async (file, position) => {
    if (!vehicleId) { setError('Please save vehicle information first'); return; }
    try {
      const res = await uploadDocument('vehiclePhotos', file, 'api::vehicle.vehicle', vehicleId);
      setVehiclePhotos(p => ({ ...p, [position]: Array.isArray(res)?res[0]:res }));
      setSuccess(`${position} photo uploaded`);
    } catch { setError(`Failed to upload ${position} photo`); }
  }

  const areAllDocumentsUploaded = () => {
    if (isVehicleRegistrationRequired && !uploadedDocs.registrationDocument) return false;
    if (isInsuranceRequired  && !uploadedDocs.insuranceCertificate)  return false;
    if (isRoadTaxRequired    && !uploadedDocs.roadTaxCertificate)    return false;
    if (isFitnessDocumentRequired && !uploadedDocs.fitnessDocument)  return false;
    return !['front','back','left','right'].some(p => !vehiclePhotos[p]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null);
    if (!hasBasicInfoSaved) { setError('Please save vehicle information first'); return; }
    if (!areAllDocumentsUploaded()) { setError('Please upload all required documents and photos'); return; }
    try {
      setLoading(true);
      const res = await submitForVerification(); // → /delivery-driver/onboarding/submit
      if(res.success) { 
        setSuccess('Vehicle submitted for verification!'); 
        if(typeof window !== "undefined"){
          localStorage.setItem('onboarding_step_page','/onboarding/pending')
        }
        setTimeout(() => router.push('/onboarding/pending'), 2000); 
      }
      else { setError(res.error ?? 'Failed to submit vehicle for verification'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const isInsuranceExpired       = () => existingVehicle?.insuranceExpiryDate && new Date(existingVehicle.insuranceExpiryDate) < new Date();
  const isInsuranceExpiringSoon  = () => { if (!existingVehicle?.insuranceExpiryDate) return false; const exp = new Date(existingVehicle.insuranceExpiryDate); const soon = new Date(Date.now()+30*864e5); return exp > new Date() && exp < soon; };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : 'Not set';

  if (loadingVehicle || settingsLoading || loadingData) {
    return <Box sx={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center' }}><CircularProgress /></Box>;
  }

  const insuranceChipColor = isInsuranceExpired()?'error':isInsuranceExpiringSoon()?'warning':'success';
  const insuranceChipLabel = isInsuranceExpired()?'EXPIRED':isInsuranceExpiringSoon()?'EXPIRING SOON':'VALID';
  const selectedColor = vehicleData.color;

  return (
    <>
      <ResponsiveStyle />
      <Box sx={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', bgcolor:'background.default' }}>

        {/* Header */}
        <Box sx={{ flexShrink:0, px:2, py:1.5, display:'flex', alignItems:'center', gap:2, borderBottom:1, borderColor:'divider', bgcolor:'background.paper', zIndex:10 }}>
          <IconButton onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" fontWeight={600}>{isEditMode ? 'Vehicle Details' : 'Add Delivery Vehicle'}</Typography>
          {isEditMode && <Chip label="Edit Mode" color="primary" size="small" icon={<EditIcon />} sx={{ ml:'auto' }} />}
        </Box>

        {/* Scrollable content */}
        <Box sx={{ flex:1, overflowY:'scroll', pb:10, '&::-webkit-scrollbar':{display:'none'}, scrollbarWidth:'none' }}>
          <Box sx={{ p:3 }}>

            {/* {error   && <Alert severity="error"   sx={{mb:3}} onClose={()=>setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{mb:3}} onClose={()=>setSuccess(null)}>{success}</Alert>} */}
            {isEditMode && existingVehicle && isInsuranceExpired()      && <Alert severity="error"   icon={<WarningIcon/>} sx={{mb:3}}>Your insurance has expired! Please update your documents and expiry date.</Alert>}
            {isEditMode && existingVehicle && isInsuranceExpiringSoon() && <Alert severity="warning" icon={<WarningIcon/>} sx={{mb:3}}>Your insurance is expiring soon! Please renew and update your documents.</Alert>}

            {/* ─── Vehicle silhouette preview ─────────────────────────────── */}
            <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', py:3, mb:1 }}>
              <VehicleSilhouette type={vehicleData.vehicleType} colorKey={selectedColor} size={160} />
            </Box>

            {/* ─── Existing vehicle summary ───────────────────────────────── */}
            {isEditMode && existingVehicle && (
              <Paper elevation={0} sx={{ borderRadius:4, mb:3, overflow:'hidden', border:'1px solid', borderColor:'divider' }}>
                <Box sx={{ background:'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)', px:3, py:2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                    <Box sx={{ width:40, height:40, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <VehicleSilhouette type={existingVehicle.vehicleType} colorKey={existingVehicle.color} size={32} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight:800, color:'white', lineHeight:1.1 }}>{existingVehicle.make} {existingVehicle.model}</Typography>
                      <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{existingVehicle.year}</Typography>
                    </Box>
                  </Box>
                  <Tooltip title="Edit Vehicle Details">
                    <IconButton onClick={()=>setEditDialogOpen(true)} sx={{ bgcolor:'rgba(255,255,255,0.22)', color:'white', '&:hover':{bgcolor:'rgba(255,255,255,0.35)'} }}><EditIcon /></IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{p:3}}>
                  <Box sx={{px:2.5,py:1.5,borderRadius:2.5,bgcolor:(t)=>t.palette.mode==='dark'?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',border:'1.5px dashed',borderColor:'divider',display:'flex',alignItems:'center',gap:1.5,mb:2}}>
                    <PlateIcon sx={{color:'text.disabled',fontSize:20}}/>
                    <Box>
                      <Typography variant="caption" sx={{color:'text.disabled',fontWeight:700,fontSize:'0.6rem',letterSpacing:0.8,textTransform:'uppercase'}}>Number Plate</Typography>
                      <Typography variant="h6" sx={{fontWeight:900,letterSpacing:2,fontFamily:'monospace',background:'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',backgroundClip:'text',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1.2}}>
                        {existingVehicle.numberPlate}
                      </Typography>
                    </Box>
                  </Box>
                  <TwoCol>
                    <Box sx={{display:'flex',flexDirection:'column',gap:0.5}}>
                      <Typography variant="caption" sx={{color:'text.disabled',fontWeight:700,fontSize:'0.6rem',letterSpacing:0.8,textTransform:'uppercase'}}>Color</Typography>
                      <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                        <Box sx={{width:20,height:20,borderRadius:'50%',flexShrink:0,bgcolor:getColorByKey(existingVehicle.color)?.body,border:'2px solid',borderColor:getColorByKey(existingVehicle.color)?.outline??'divider',boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}/>
                        <Typography variant="body1" fontWeight={600}>{getColorByKey(existingVehicle.color)?.label??existingVehicle.color}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{display:'flex',flexDirection:'column',gap:0.5}}>
                      <Typography variant="caption" sx={{color:'text.disabled',fontWeight:700,fontSize:'0.6rem',letterSpacing:0.8,textTransform:'uppercase'}}>Seating</Typography>
                      <Box sx={{display:'flex',alignItems:'center',gap:1}}><SeatsIcon sx={{color:'text.disabled',fontSize:18}}/><Typography variant="body1" fontWeight={600}>{existingVehicle.seatingCapacity} seats</Typography></Box>
                    </Box>
                  </TwoCol>
                  <Box sx={{px:2,py:1.5,borderRadius:2.5,mt:2,bgcolor:isInsuranceExpired()?'rgba(211,47,47,0.06)':isInsuranceExpiringSoon()?'rgba(237,108,2,0.06)':'rgba(46,125,50,0.06)',border:'1px solid',borderColor:isInsuranceExpired()?'rgba(211,47,47,0.2)':isInsuranceExpiringSoon()?'rgba(237,108,2,0.2)':'rgba(46,125,50,0.15)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
                      <Box><Typography variant="caption" sx={{color:'text.disabled',fontWeight:700,fontSize:'0.6rem',letterSpacing:0.8,textTransform:'uppercase',display:'block'}}>Insurance Expiry</Typography><Typography variant="body2" fontWeight={600}>{formatDate(existingVehicle.insuranceExpiryDate)}</Typography></Box>
                    </Box>
                    {existingVehicle.insuranceExpiryDate && <Chip label={insuranceChipLabel} color={insuranceChipColor} size="small" sx={{fontWeight:700,fontSize:'0.65rem'}}/>}
                  </Box>
                </Box>
              </Paper>
            )}

            {/* ─── Edit dialog ────────────────────────────────────────────── */}
            <Dialog open={editDialogOpen} onClose={()=>setEditDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{sx:{borderRadius:4}}}>
              <Box sx={{background:'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',px:3,py:2.5,display:'flex',alignItems:'center',gap:1.5}}>
                <EditIcon sx={{color:'white'}}/>
                <Typography variant="h6" sx={{fontWeight:800,color:'white'}}>Edit Vehicle Details</Typography>
              </Box>
              <DialogContent sx={{pt:3}}>
                {error && <Alert severity="error" sx={{mb:2.5,borderRadius:2}} onClose={()=>setError(null)}>{error}</Alert>}
                <FieldStack>
                  <FullRow>
                    <TextField select fullWidth label="Vehicle Type" name="vehicleType" value={vehicleData.vehicleType} onChange={handleChange} required disabled sx={fieldStyles}>
                      {DELIVERY_VEHICLE_TYPES.map(t=><MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </TextField>
                  </FullRow>
                  <FullRow><TextField fullWidth label="Number Plate" name="numberPlate" value={vehicleData.numberPlate} onChange={handleChange} required sx={monoFieldStyles}/></FullRow>
                  <FullRow><Autocomplete fullWidth freeSolo options={makesList} value={vehicleData.make} onChange={handleMakeChange} loading={makesLoading} renderInput={(p)=><TextField {...p} label="Make" required sx={fieldStyles} InputProps={{ ...p.InputProps, endAdornment: (<>{makesLoading ? <CircularProgress size={16}/> : null}{p.InputProps.endAdornment}</>) }}/>}/></FullRow>
                  <FullRow><Autocomplete fullWidth freeSolo options={modelsList} value={vehicleData.model} onChange={handleModelChange} disabled={!vehicleData.make} renderInput={(p)=><TextField {...p} label="Model" required sx={fieldStyles}/>}/></FullRow>
                  <TwoCol>
                    <TextField select fullWidth label="Year" name="year" value={vehicleData.year} onChange={handleChange} required sx={fieldStyles}>
                      {allowedYears.map(y=><MenuItem key={y} value={parseInt(y)}>{y}</MenuItem>)}
                    </TextField>
                    <TextField fullWidth type="number" label="Seating Capacity" name="seatingCapacity" value={vehicleData.seatingCapacity} onChange={handleChange} inputProps={{min:1,max:50}} required sx={fieldStyles}/>
                  </TwoCol>
                  <FullRow><VehicleColorPicker value={vehicleData.color} onChange={(k)=>setVehicleData(p=>({...p,color:k}))} required helperText="Select your vehicle's color"/></FullRow>
                  <FullRow><TextField fullWidth type="date" label="Insurance Expiry Date" name="insuranceExpiryDate" value={vehicleData.insuranceExpiryDate} onChange={handleChange} InputLabelProps={{shrink:true}} required inputProps={{min:new Date().toISOString().split('T')[0]}} sx={fieldStyles}/></FullRow>
                </FieldStack>
              </DialogContent>
              <DialogActions sx={{p:3,pt:1,gap:1}}>
                <Button onClick={()=>setEditDialogOpen(false)} variant="outlined" sx={{borderRadius:2.5,px:3,fontWeight:600}}>Cancel</Button>
                <Button onClick={handleUpdateVehicle} variant="contained" disabled={savingBasicInfo}
                  sx={{borderRadius:2.5,px:3,fontWeight:700,background:'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)'}}>
                  {savingBasicInfo?'Updating…':'Update Vehicle'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* ─── Add vehicle form ───────────────────────────────────────── */}
            {!isEditMode && (
              <Paper elevation={0} sx={{borderRadius:4,mb:3,overflow:'hidden',border:'1px solid',borderColor:'divider'}}>
                <Box sx={{background:'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',px:3,py:2,display:'flex',alignItems:'center',gap:1.5}}>
                  <Typography variant="subtitle1" sx={{fontWeight:800,color:'white'}}>Vehicle Information</Typography>
                </Box>
                <Box sx={{p:3}}>
                  <FieldStack>
                    {/* ─── KEY CHANGE: delivery vehicle types ──────────── */}
                    <FullRow>
                      <TextField select fullWidth label="Vehicle Type" name="vehicleType" value={vehicleData.vehicleType} onChange={handleChange} required disabled={hasBasicInfoSaved}
                        helperText={`Set based on your delivery profile: ${DELIVERY_VEHICLE_TYPES.find(t=>t.value===vehicleData.vehicleType)?.label??vehicleData.vehicleType}`} sx={fieldStyles}>
                        {DELIVERY_VEHICLE_TYPES.map(t=><MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                      </TextField>
                    </FullRow>
                    <FullRow><TextField fullWidth label="Number Plate" name="numberPlate" value={vehicleData.numberPlate} onChange={handleChange} placeholder="e.g., BAZ1234" required disabled={hasBasicInfoSaved} sx={monoFieldStyles}/></FullRow>
                    <FullRow><Autocomplete fullWidth freeSolo options={makesList} value={vehicleData.make} onChange={handleMakeChange} disabled={hasBasicInfoSaved} loading={makesLoading} renderInput={(p)=><TextField {...p} label="Make" placeholder={makesLoading ? 'Loading…' : 'e.g., Honda'} required sx={fieldStyles} InputProps={{ ...p.InputProps, endAdornment: (<>{makesLoading ? <CircularProgress size={16}/> : null}{p.InputProps.endAdornment}</>) }}/>}/></FullRow>
                    <FullRow><Autocomplete fullWidth freeSolo options={modelsList} value={vehicleData.model} onChange={handleModelChange} disabled={!vehicleData.make||hasBasicInfoSaved} renderInput={(p)=><TextField {...p} label="Model" placeholder="e.g., CB125" required sx={fieldStyles}/>}/></FullRow>
                    <TwoCol>
                      <TextField select fullWidth label="Year" name="year" value={vehicleData.year} onChange={handleChange} required disabled={hasBasicInfoSaved} sx={fieldStyles}>
                        {allowedYears.map(y=><MenuItem key={y} value={parseInt(y)}>{y}</MenuItem>)}
                      </TextField>
                      <TextField fullWidth type="number" label="Seating Capacity" name="seatingCapacity" value={vehicleData.seatingCapacity} onChange={handleChange} inputProps={{min:1,max:50}} required disabled={hasBasicInfoSaved} sx={fieldStyles}/>
                    </TwoCol>
                    <FullRow><VehicleColorPicker value={vehicleData.color} onChange={(k)=>setVehicleData(p=>({...p,color:k}))} required disabled={hasBasicInfoSaved} helperText="Select your vehicle's color"/></FullRow>
                    <FullRow><TextField fullWidth type="date" label="Insurance Expiry Date" name="insuranceExpiryDate" value={vehicleData.insuranceExpiryDate} onChange={handleChange} InputLabelProps={{shrink:true}} required disabled={hasBasicInfoSaved} inputProps={{min:new Date().toISOString().split('T')[0]}} sx={fieldStyles}/></FullRow>
                  </FieldStack>
                  {!hasBasicInfoSaved && (
                    <Button fullWidth variant="contained" size="large" onClick={handleSaveBasicInfo} disabled={savingBasicInfo} startIcon={savingBasicInfo&&<CircularProgress size={20}/>}
                      sx={{mt:3,height:56,borderRadius:3,fontWeight:700,background:'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',boxShadow:'0 6px 20px rgba(245,158,11,0.35)'}}>
                      {savingBasicInfo?'Saving…':'Save Vehicle Information'}
                    </Button>
                  )}
                  {hasBasicInfoSaved && <Alert severity="success" sx={{mt:3,borderRadius:2.5}} icon={<CheckIcon/>}><Typography variant="body2" fontWeight="medium">Vehicle information saved! Now upload the required documents below.</Typography></Alert>}
                </Box>
              </Paper>
            )}

            {/* Documents locked hint */}
            {!hasBasicInfoSaved && !isEditMode && (
              <Alert severity="info" icon={<LockIcon/>} sx={{mb:3,borderRadius:2.5}}>
                <Typography variant="body2" fontWeight="medium">Document uploads will be enabled after you save the vehicle information above.</Typography>
              </Alert>
            )}

            {/* Documents */}
            <Box sx={{opacity:!vehicleId?0.5:1,pointerEvents:!vehicleId?'none':'auto'}}>
              <Typography variant="h6" fontWeight={600} sx={{mb:2}}>Vehicle Documents</Typography>
              {isVehicleRegistrationRequired && <Box sx={{mb:3}}><DocumentUploadCard title="Vehicle Registration (Blue Book)" description="Upload all pages of your vehicle registration document clearly" onUpload={(f)=>handleDocumentUpload(f,'registrationDocument')} uploadedFile={uploadedDocs.registrationDocument} onRemove={()=>setUploadedDocs(p=>({...p,registrationDocument:null}))}/></Box>}
              {isInsuranceRequired  && <Box sx={{mb:3}}><DocumentUploadCard title="Insurance Certificate" description="Upload your valid comprehensive insurance certificate" onUpload={(f)=>handleDocumentUpload(f,'insuranceCertificate')} uploadedFile={uploadedDocs.insuranceCertificate} onRemove={()=>setUploadedDocs(p=>({...p,insuranceCertificate:null}))}/></Box>}
              {isRoadTaxRequired    && <Box sx={{mb:3}}><DocumentUploadCard title="Road Tax Certificate" description="Upload your valid road tax certificate" onUpload={(f)=>handleDocumentUpload(f,'roadTaxCertificate')} uploadedFile={uploadedDocs.roadTaxCertificate} onRemove={()=>setUploadedDocs(p=>({...p,roadTaxCertificate:null}))}/></Box>}
              {isFitnessDocumentRequired && <Box sx={{mb:3}}><DocumentUploadCard title="Fitness Certificate" description="Upload your valid fitness/roadworthy certificate" onUpload={(f)=>handleDocumentUpload(f,'fitnessDocument')} uploadedFile={uploadedDocs.fitnessDocument} onRemove={()=>setUploadedDocs(p=>({...p,fitnessDocument:null}))}/></Box>}

              <Typography variant="h6" fontWeight={600} sx={{mb:1,mt:4}}>Vehicle Photos</Typography>
              <Typography variant="body2" color="text.secondary" sx={{mb:2}}>Upload clear photos of your vehicle from all angles</Typography>
              <PhotoGrid>
                {['front','back','left','right'].map(pos=>(
                  <DocumentUploadCard key={pos} title={`${pos.charAt(0).toUpperCase()+pos.slice(1)} View`} description={`Photo from the ${pos}`}
                    onUpload={(f)=>handleVehiclePhotoUpload(f,pos)} uploadedFile={vehiclePhotos[pos]} onRemove={()=>setVehiclePhotos(p=>({...p,[pos]:null}))}/>
                ))}
              </PhotoGrid>
            </Box>

            {/* Submit */}
            {(isEditMode || hasBasicInfoSaved) && (
              <>
                <Alert severity="info" icon={<WarningIcon/>} sx={{mb:3,borderRadius:2.5}}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>Important Notice</Typography>
                  <Typography variant="body2">After submitting, you will temporarily not receive orders until we approve the vehicle. This typically takes 24–48 hours.</Typography>
                </Alert>
                <Button onClick={handleSubmit} fullWidth variant="contained" size="large" disabled={loading||!vehicleId||!areAllDocumentsUploaded()} startIcon={loading&&<CircularProgress size={20}/>}
                  sx={{mt:3,height:56,borderRadius:3,fontWeight:700,background:'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',boxShadow:'0 6px 20px rgba(245,158,11,0.35)'}}>
                  {loading?'Submitting…':'Submit Vehicle for Verification'}
                </Button>
                {vehicleId && !areAllDocumentsUploaded() && <Typography variant="caption" color="text.secondary" sx={{display:'block',textAlign:'center',mt:2}}>Please upload all required documents and photos before submitting</Typography>}
              </>
            )}
          </Box>
        </Box>
        {/* ── replace with these two Snackbars, placed anywhere inside the root Box, outside the scrollable area ── */}
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ zIndex: 9999 }}
        >
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ width: '100%', borderRadius: 2.5 }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={5000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ zIndex: 9999 }}
        >
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ width: '100%', borderRadius: 2.5 }}
          >
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}