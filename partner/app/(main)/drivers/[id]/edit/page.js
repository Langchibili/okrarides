'use client';
// PATH: app/partner/drivers/[id]/edit/page.jsx

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box, Typography, TextField, Button, Paper, MenuItem,
    Alert, Chip, CircularProgress, Autocomplete, Snackbar,
    IconButton, InputAdornment, Radio, Modal, Fade, Backdrop,
    List, ListItem, ListItemText, ListItemButton, Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    ArrowBack as BackIcon,
    Person as PersonIcon,
    DirectionsCar as CarIcon,
    LocalShipping as DeliveryIcon,
    Badge as BadgeIcon,
    CheckCircle as CheckCircleIcon,
    Lock as LockIcon,
    Phone as PhoneIcon,
    Home as HomeIcon,
    CameraAlt as CameraIcon,
    Check as CheckIcon,
    Description as DocIcon,
    Edit as EditIcon,
    TwoWheeler as BikeIcon,
    DirectionsBus as BusIcon,
    OpenInNew as OpenInNewIcon,
    AddCircleOutline as AddIcon,
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
import { savedPhoneCode } from '@/lib/utils/format';

const DELIVERY_VEHICLE_TYPES = [
    { value: 'taxi', label: 'Car / Taxi', Icon: CarIcon, color: '#F59E0B' },
    { value: 'motorbike', label: 'Motorbike', Icon: BikeIcon, color: '#10B981' },
    { value: 'motorcycle', label: 'Motorcycle', Icon: BikeIcon, color: '#3B82F6' },
    { value: 'truck', label: 'Truck', Icon: DeliveryIcon, color: '#8B5CF6' },
];

const RIDE_VEHICLE_TYPES = [
    { value: 'taxi', label: 'Taxi / Sedan', Icon: CarIcon, color: '#10B981' },
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
                        <TextField
                            fullWidth label="Vehicle Make" value={customMake}
                            onChange={e => setCustomMake(e.target.value)}
                            placeholder="e.g., Kia, Chery, BYD"
                            sx={fieldSx}
                            autoFocus
                        />
                        <TextField
                            fullWidth label="Vehicle Model" value={customModel}
                            onChange={e => setCustomModel(e.target.value)}
                            placeholder="e.g., Sportage, Tiggo, Atto"
                            sx={fieldSx}
                            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                        />
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                            <Button fullWidth variant="text" onClick={onClose} sx={{ borderRadius: 2.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Cancel</Button>
                            <Button
                                fullWidth variant="contained" onClick={handleConfirm}
                                disabled={!customMake.trim() || !customModel.trim()}
                                sx={{ borderRadius: 2.5, fontWeight: 700, background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
                            >
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
                            fontWeight: 900, fontSize: '1.25rem', color: '#A78BFA', letterSpacing: 2, mb: 0.75,
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
                        Are you sure you want to attach this vehicle to this driver? <strong>This will remove the vehicle from any other driver it is currently assigned to.</strong>
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
                                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
                                '&:hover': { boxShadow: '0 6px 20px rgba(245,158,11,0.5)' },
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
                            value={query} onChange={e => setQuery(e.target.value)}
                            autoFocus
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} /></InputAdornment>,
                                endAdornment: searching ? <InputAdornment position="end"><CircularProgress size={16} sx={{ color: '#8B5CF6' }} /></InputAdornment> : null,
                            }}
                            sx={fieldSx}
                        />
                    </Box>
                    <Box sx={{ overflowY: 'auto', flex: 1 }}>
                        {results.length === 0 && query.length >= 2 && !searching && (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>No vehicles found</Typography>
                            </Box>
                        )}
                        {query.length < 2 && (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Type at least 2 characters to search</Typography>
                            </Box>
                        )}
                        <List disablePadding>
                            {results.map((vehicle, i) => {
                                const colorObj = getColorByKey(vehicle.color);
                                return (
                                    <Box key={vehicle.id ?? i}>
                                        <ListItemButton
                                            onClick={() => { onSelect(vehicle); onClose(); }}
                                            sx={{ px: 3, py: 1.75, '&:hover': { bgcolor: 'rgba(139,92,246,0.12)' } }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1rem', color: '#A78BFA', letterSpacing: 1.5 }}>
                                                        {vehicle.numberPlate}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mt: 0.3 }}>
                                                        <Typography component="span" sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                                                            {vehicle.make} {vehicle.model} · {vehicle.year} · {vehicle.vehicleType}
                                                        </Typography>
                                                        {vehicle.color && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <Box sx={{
                                                                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                                                    bgcolor: colorObj?.hex ?? vehicle.color,
                                                                    border: '1.5px solid rgba(255,255,255,0.2)',
                                                                }} />
                                                                <Typography component="span" sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>
                                                                    {colorObj?.label ?? vehicle.color}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                        {i < results.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                                    </Box>
                                );
                            })}
                        </List>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
}

function SectionCard({ icon: Icon, title, subtitle, color = '#059669', locked = false, completed, onEdit, children }) {
    return (
        <Paper elevation={0} sx={{
            borderRadius: 3.5, mb: 3, overflow: 'hidden',
            border: `1px solid ${locked ? 'rgba(255,255,255,0.05)' : alpha(color, 0.2)}`,
            background: locked
                ? 'rgba(255,255,255,0.015)'
                : `linear-gradient(145deg, ${alpha(color, 0.06)} 0%, transparent 100%)`,
        }}>
            <Box sx={{
                px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                background: locked
                    ? 'rgba(255,255,255,0.03)'
                    : `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
            }}>
                <Box sx={{
                    width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                    bgcolor: locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {completed
                        ? <CheckIcon sx={{ color: locked ? 'rgba(255,255,255,0.25)' : '#fff', fontSize: 20 }} />
                        : locked
                            ? <LockIcon sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }} />
                            : <Icon sx={{ color: '#fff', fontSize: 20 }} />
                    }
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, color: locked ? 'rgba(255,255,255,0.3)' : '#fff' }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography sx={{ fontSize: '0.72rem', mt: 0.25, color: locked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)' }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {completed && !locked && (
                    <Chip label="Saved" size="small" sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                        bgcolor: 'rgba(255,255,255,0.2)', color: '#fff',
                    }} />
                )}
                {!locked && onEdit && (
                    <IconButton size="small" onClick={onEdit}
                        sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', width: 28, height: 28, flexShrink: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
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
                        No data yet for this section
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}

function SaveBtn({ onClick, loading, label, color = '#059669' }) {
    return (
        <Button
            fullWidth variant="contained" size="large"
            onClick={onClick} disabled={loading}
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
            {loading ? 'Saving…' : label}
        </Button>
    );
}

function ExistingVehicleCard({ vehicle, vehicleId, onEditRedirect }) {
    return (
        <Paper elevation={0} sx={{
            p: 2, borderRadius: 3, mb: 2,
            border: '1px solid rgba(245,158,11,0.3)',
            background: 'rgba(245,158,11,0.06)',
            display: 'flex', alignItems: 'center', gap: 2,
        }}>
            <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>
                    Current Vehicle
                </Typography>
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '1.1rem', color: '#F59E0B', letterSpacing: 2 }}>
                    {vehicle.numberPlate}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', mt: 0.25 }}>
                    {vehicle.make} {vehicle.model} · {vehicle.year} · {vehicle.vehicleType}
                </Typography>
            </Box>
            {vehicleId && onEditRedirect && (
                <IconButton
                    onClick={() => onEditRedirect(vehicleId)}
                    sx={{ color: '#F59E0B', bgcolor: 'rgba(245,158,11,0.15)', '&:hover': { bgcolor: 'rgba(245,158,11,0.25)' } }}
                >
                    <OpenInNewIcon fontSize="small" />
                </IconButton>
            )}
        </Paper>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function DriverEditPage({ params }) {
    const { id: driverId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    const driverType = searchParams.get('driverType') ?? 'driver';
    const isDeliveryDriver = driverType === 'delivery';

    const { user: partnerUser } = useAuth();
    const phoneCode = (partnerUser?.country?.phoneCode ?? '+' + savedPhoneCode()).replace(/^\+/, '');

    const {
        loading: settingsLoading,
        isDriverLicenseRequired: reqLicense,
        isNationalIdRequired: reqNRC,
        isProofOfAddressRequired: reqAddress,
        isInsuranceRequired: reqInsurance,
    } = useAdminSettings();

    // ── Driver data ───────────────────────────────────────────────────────────
    const [loadingDriver, setLoadingDriver] = useState(true);
    const [driverProfileId, setDriverProfileId] = useState(null);
    const [vehicleId, setVehicleId] = useState(null);
    const [existingVehicle, setExistingVehicle] = useState(null);
    const [existingVehicleId, setExistingVehicleId] = useState(null);

    // ── Editing flags ─────────────────────────────────────────────────────────
    const [editingBasic, setEditingBasic] = useState(false);
    const [editingLicense, setEditingLicense] = useState(false);
    const [editingNationalId, setEditingNationalId] = useState(false);
    const [editingAddress, setEditingAddress] = useState(false);
    const [editingVehicleType, setEditingVehicleType] = useState(false);
    const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
    const [editingNewVehicleDet, setEditingNewVehicleDet] = useState(false);

    // ── Modal flags ───────────────────────────────────────────────────────────
    const [addMakeModelOpen, setAddMakeModelOpen] = useState(false);
    const [existingVehicleSearchOpen, setExistingVehicleSearchOpen] = useState(false);
    const [attachedExistingVehicle, setAttachedExistingVehicle] = useState(null);
    const [vehicleToConfirm, setVehicleToConfirm] = useState(null);
    const [confirmAttachOpen, setConfirmAttachOpen] = useState(false);

    // ── Form: basic ───────────────────────────────────────────────────────────
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [origPhone, setOrigPhone] = useState('');

    // ── Form: documents ───────────────────────────────────────────────────────
    const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
    const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
    const [nationalIdNumber, setNationalIdNumber] = useState('');
    const [address, setAddress] = useState('');

    // ── Form: vehicle ─────────────────────────────────────────────────────────
    const [selectedVehicleType, setSelectedVehicleType] = useState(
        isDeliveryDriver ? 'motorbike' : 'taxi'
    );
    const [vehicleTypeSaved, setVehicleTypeSaved] = useState(false);
    const [newVehicleDetailsSaved, setNewVehicleDetailsSaved] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({
        numberPlate: '', make: '', model: '',
        year: new Date().getFullYear(), color: '',
        seatingCapacity: isDeliveryDriver ? 1 : 4,
        insuranceExpiryDate: '',
    });

    // ── Section saved flags ───────────────────────────────────────────────────
    const [basicSaved, setBasicSaved] = useState(false);
    const [licenseSaved, setLicenseSaved] = useState(false);
    const [nrcSaved, setNrcSaved] = useState(false);
    const [addressSaved, setAddressSaved] = useState(false);

    // ── Documents (using correct field names from API) ─────────────────────────
    const [docs, setDocs] = useState({
        driverLicenseFront: null,
        driverLicenseBack: null,
        nationalIdFront: null,
        nationalIdBack: null,
        profilePicture: null,
        insuranceCertificate: null,
    });

    // ── Vehicle dropdown data ─────────────────────────────────────────────────
    const [makesAndModels, setMakesAndModels] = useState({});
    const [makesList, setMakesList] = useState([]);
    const [modelsList, setModelsList] = useState([]);
    const [allowedYears, setAllowedYears] = useState([]);

    // ── UI ────────────────────────────────────────────────────────────────────
    const [saving, setSaving] = useState({});
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // ── Verification statuses (Issue 1 — Step A) ──────────────────────────────
    const [driverVerificationStatus, setDriverVerificationStatus] = useState(null);
    const [deliveryVerificationStatus, setDeliveryVerificationStatus] = useState(null);

    const setSavingStep = (step, val) => setSaving(p => ({ ...p, [step]: val }));
    const vehicleTypes = isDeliveryDriver ? DELIVERY_VEHICLE_TYPES : RIDE_VEHICLE_TYPES;

    useEffect(() => {
        if (!driverId) return;
        loadDriver();
    }, [driverId]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadDriver = async () => {
        try {
            setLoadingDriver(true);
            const userData = await apiClient.get(`/users/${driverId}?populate=*`);
            const rawPhone = (userData?.phoneNumber ?? '').replace(new RegExp(`^\\+?${savedPhoneCode()}`), '');
            setFirstName(userData?.firstName ?? '');
            setLastName(userData?.lastName ?? '');
            setPhoneNumber(rawPhone);
            setOrigPhone(rawPhone);
            setBasicSaved(true);

            if (isDeliveryDriver) {
                const deliveryRes = await apiClient.get(
                    `/users/${driverId}?` +
                    'populate[deliveryProfile][populate][motorbike][populate]=vehicle&' +
                    'populate[deliveryProfile][populate][taxi][populate]=vehicle&' +
                    'populate[deliveryProfile][populate][truck][populate]=vehicle&' +
                    'populate[deliveryProfile][populate][motorcycle][populate]=vehicle'
                );
                const delp = deliveryRes?.deliveryProfile ?? deliveryRes?.data?.deliveryProfile;

                const dpRes = await apiClient.get(`/users/${driverId}?populate[driverProfile][populate]=*`);
                const dp = dpRes?.driverProfile ?? dpRes?.data?.driverProfile;
                if (dp?.id) {
                    setDriverProfileId(dp.id);
                    setDriverLicenseNumber(dp.driverLicenseNumber ?? '');
                    setLicenseExpiryDate(dp.licenseExpiryDate ?? '');
                    if (dp.driverLicenseNumber) setLicenseSaved(true);
                    setNationalIdNumber(dp.nationalIdNumber ?? '');
                    if (dp.nationalIdNumber) setNrcSaved(true);
                    setAddress(dp.address ?? '');
                    if (dp.address) setAddressSaved(true);
                    // Load existing doc references
                    setDocs(prev => ({
                        ...prev,
                        driverLicenseFront: dp.driverLicenseFront ?? null,
                        driverLicenseBack: dp.driverLicenseBack ?? null,
                        nationalIdFront: dp.nationalIdFront ?? null,
                        nationalIdBack: dp.nationalIdBack ?? null,
                    }));
                    // Issue 1 — Step B: set driver verification status (delivery branch)
                    setDriverVerificationStatus(dp.verificationStatus ?? null);
                }

                if (delp) {
                    const activeType = delp.activeVehicleType;
                    if (activeType && activeType !== 'none') {
                        const subVehicle = delp[activeType]?.vehicle;
                        if (subVehicle) {
                            setExistingVehicle({ ...subVehicle, vehicleType: activeType });
                            setExistingVehicleId(subVehicle.id);
                            setSelectedVehicleType(activeType);
                            setVehicleTypeSaved(true);
                        }
                    }
                    // Issue 1 — Step B: set delivery verification status
                    setDeliveryVerificationStatus(delp?.verificationStatus ?? null);
                }
            } else {
                const driverRes = await apiClient.get(`/users/${driverId}?populate[driverProfile][populate]=*`);
                const dp = driverRes?.driverProfile ?? driverRes?.data?.driverProfile;
                if (dp?.id) {
                    setDriverProfileId(dp.id);
                    setDriverLicenseNumber(dp.driverLicenseNumber ?? '');
                    setLicenseExpiryDate(dp.licenseExpiryDate ?? '');
                    if (dp.driverLicenseNumber) setLicenseSaved(true);
                    setNationalIdNumber(dp.nationalIdNumber ?? '');
                    if (dp.nationalIdNumber) setNrcSaved(true);
                    setAddress(dp.address ?? '');
                    if (dp.address) setAddressSaved(true);
                    setDocs(prev => ({
                        ...prev,
                        driverLicenseFront: dp.driverLicenseFront ?? null,
                        driverLicenseBack: dp.driverLicenseBack ?? null,
                        nationalIdFront: dp.nationalIdFront ?? null,
                        nationalIdBack: dp.nationalIdBack ?? null,
                    }));
                    // Issue 1 — Step B: set driver verification status (ride branch)
                    setDriverVerificationStatus(dp.verificationStatus ?? null);

                    if (dp.assignedVehicle) {
                        setExistingVehicle(dp.assignedVehicle);
                        setExistingVehicleId(dp.assignedVehicle.id);
                        setSelectedVehicleType(dp.assignedVehicle.vehicleType ?? dp.vehicleType ?? 'taxi');
                        setVehicleTypeSaved(true);
                    } else if (dp.vehicleType) {
                        setSelectedVehicleType(dp.vehicleType);
                        setVehicleTypeSaved(true);
                    }
                }
            }
        } catch (err) {
            setError('Failed to load driver — ' + (err?.message ?? 'Unknown error'));
        } finally {
            setLoadingDriver(false);
        }
    };

    useEffect(() => {
        if (!showNewVehicleForm) return;
        const isBike = selectedVehicleType === 'motorbike' || selectedVehicleType === 'motorcycle';
        getVehicleMakesAndModels(isBike ? 'motorbike' : undefined)
            .then(mm => { setMakesAndModels(mm); setMakesList(Object.keys(mm)); })
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
    }, [selectedVehicleType, showNewVehicleForm]);

    useEffect(() => {
        setModelsList(vehicleForm.make && makesAndModels[vehicleForm.make] ? makesAndModels[vehicleForm.make] : []);
    }, [vehicleForm.make, makesAndModels]);

    // ── Issue 1 — Step C: needsVerification + handleSubmitForVerification ─────
    const needsVerification = driverVerificationStatus !== null && (
        isDeliveryDriver
            ? (driverVerificationStatus !== 'approved' || deliveryVerificationStatus !== 'approved')
            : driverVerificationStatus !== 'approved'
    );

    const handleSubmitForVerification = async () => {
        setError(null);
        setSavingStep('submit', true);
        try {
            const endpoint = isDeliveryDriver
                ? '/delivery-driver/onboarding/submit'
                : '/driver/onboarding/submit';
            await apiClient.post(endpoint, { driverId });
            setDriverVerificationStatus('pending');
            if (isDeliveryDriver) setDeliveryVerificationStatus('pending');
            setToast({ msg: 'Driver submitted for verification', severity: 'success' });
        } catch (err) {
            setError(err?.message ?? 'Submission failed');
        } finally {
            setSavingStep('submit', false);
        }
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSaveBasic = async () => {
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
                await apiClient.put(`/users/${driverId}`, { ...body, username: fullPhone });
            } else {
                await apiClient.put(`/users/${driverId}`, body);
            }
            setOrigPhone(phoneDigits);
            setBasicSaved(true);
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
            await saveLicenseInfo({ licenseNumber: driverLicenseNumber.trim(), expiryDate: licenseExpiryDate, driverId });
            setLicenseSaved(true);
            setEditingLicense(false);
            setToast({ msg: 'License info updated', severity: 'success' });
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
            await saveNationalIdInfo({ idNumber: nationalIdNumber.trim(), driverId });
            setNrcSaved(true);
            setEditingNationalId(false);
            setToast({ msg: 'NRC info updated', severity: 'success' });
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
            await saveProofOfAddress({ address: address.trim() || undefined, driverId });
            setAddressSaved(true);
            setEditingAddress(false);
            setToast({ msg: 'Address updated', severity: 'success' });
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
            if (isDeliveryDriver) {
                await apiClient.post('/delivery-driver/onboarding/vehicle-type', {
                    vehicleType: selectedVehicleType, driverId,
                });
            } else {
                await saveVehicleType({ vehicleType: selectedVehicleType, driverId });
            }
            setVehicleTypeSaved(true);
            setEditingVehicleType(false);
            setNewVehicleDetailsSaved(false);
            setToast({ msg: 'Vehicle type updated', severity: 'success' });
        } catch (err) {
            setError(err?.message ?? 'Failed to save vehicle type');
        } finally {
            setSavingStep('vehicleType', false);
        }
    };

    const handleSaveNewVehicle = async () => {
        setError(null);
        if (!vehicleForm.numberPlate.trim()) { setError('Number plate is required'); return; }
        if (!vehicleForm.make.trim()) { setError('Vehicle make is required'); return; }
        if (!vehicleForm.model.trim()) { setError('Vehicle model is required'); return; }
        if (!vehicleForm.color) { setError('Please select a vehicle color'); return; }
        if (!vehicleForm.insuranceExpiryDate) { setError('Insurance expiry date is required'); return; }

        setSavingStep('newVehicle', true);
        try {
            let res;
            const payload = {
                ...vehicleForm,
                numberPlate: vehicleForm.numberPlate.toUpperCase(),
                vehicleType: selectedVehicleType,
                driverId,
            };

            if (isDeliveryDriver) {
                res = await apiClient.post('/delivery-driver/onboarding/vehicle-details', payload);
            } else {
                res = await saveVehicleDetails(payload);
            }

            const newId = res?.newVehicle?.id ?? res?.vehicle?.id ?? null;
            setVehicleId(newId);

            // Issue 3 — persist vehicle type to driver/delivery profile to keep it in sync
            if (isDeliveryDriver) {
                await apiClient.post('/delivery-driver/onboarding/vehicle-type', {
                    vehicleType: selectedVehicleType,
                    driverId,
                });
            } else {
                await saveVehicleType({ vehicleType: selectedVehicleType, driverId });
            }

            setNewVehicleDetailsSaved(true);
            setEditingNewVehicleDet(false);
            setToast({ msg: 'New vehicle attached to driver', severity: 'success' });
        } catch (err) {
            setError(err?.message ?? 'Failed to attach vehicle');
        } finally {
            setSavingStep('newVehicle', false);
        }
    };

    // ── Issue 2 — handleAttachExistingVehicle (updated try block) ─────────────
    const handleAttachExistingVehicle = async (vehicle) => {
        setError(null);
        setSavingStep('attachExisting', true);
        try {
            if (isDeliveryDriver) {
                await apiClient.post('/delivery-driver/assign-vehicle', {
                    driverId,
                    vehicleId: vehicle.id,
                });
            } else {
                await apiClient.post('/driver/assign-vehicle', {
                    driverId,
                    vehicleId: vehicle.id,
                });
            }
            setAttachedExistingVehicle(vehicle);
            setExistingVehicle(vehicle);
            setExistingVehicleId(vehicle.id);
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
            setToast({ msg: 'Profile not ready — please wait a moment', severity: 'warning' });
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

    if (loadingDriver || settingsLoading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: isDeliveryDriver ? '#F59E0B' : '#10B981' }} />
            </Box>
        );
    }

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
                position: 'sticky', top: 0, zIndex: 100,
                px: 3, py: 2,
                background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: 2,
            }}>
                <IconButton onClick={() => router.back()} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <BackIcon />
                </IconButton>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem', lineHeight: 1.2 }}>
                        Edit Driver
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                        {firstName} {lastName} · {isDeliveryDriver ? 'Courier' : 'Ride Driver'}
                    </Typography>
                </Box>
                <Chip
                    size="small"
                    label={isDeliveryDriver ? 'Courier' : 'Ride'}
                    sx={{
                        bgcolor: alpha(isDeliveryDriver ? '#F59E0B' : '#10B981', 0.2),
                        color: isDeliveryDriver ? '#F59E0B' : '#10B981',
                        fontWeight: 700, fontSize: '0.7rem',
                    }}
                />
            </Box>

            <Box sx={{ maxWidth: 720, mx: 'auto', p: { xs: 2, md: 4 } }}>
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: 2.5 }}>{error}</Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══ Section 1: Basic Info ══ */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <SectionCard
                        icon={PersonIcon}
                        title="Basic Information"
                        subtitle="Name and phone number"
                        completed={basicSaved}
                        onEdit={() => setEditingBasic(true)}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TwoCol>
                                <TextField fullWidth label="First Name" value={firstName} required onChange={e => setFirstName(e.target.value)} disabled={!editingBasic} sx={fieldSx} />
                                <TextField fullWidth label="Last Name" value={lastName} required onChange={e => setLastName(e.target.value)} disabled={!editingBasic} sx={fieldSx} />
                            </TwoCol>
                            <TextField
                                fullWidth label="Phone Number" value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                placeholder="97XXXXXXXX"
                                helperText={editingBasic ? 'Changing the phone number will also update the login username' : undefined}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PhoneIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} />
                                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', ml: 0.5 }}>+{phoneCode}</Typography>
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={!editingBasic}
                                sx={fieldSx}
                            />
                            {editingBasic && (
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <SaveBtn onClick={handleSaveBasic} loading={saving.basic} label="Update Basic Info" />
                                    <Button variant="text" size="small" onClick={() => setEditingBasic(false)}
                                        sx={{ mt: 2.5, height: 48, px: 3, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2.5 }}>
                                        Cancel
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </SectionCard>
                </motion.div>

                {/* ══ Section 2: Driver's License ══ */}
                {reqLicense && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                        <SectionCard
                            icon={DocIcon}
                            title="Driver's License"
                            subtitle="License number, expiry date, and photos"
                            color="#7C3AED"
                            completed={licenseSaved}
                            onEdit={() => setEditingLicense(true)}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TwoCol>
                                    <TextField
                                        fullWidth label="License Number" value={driverLicenseNumber}
                                        onChange={e => setDriverLicenseNumber(e.target.value.toUpperCase())}
                                        placeholder="e.g., DL-123456"
                                        disabled={!editingLicense}
                                        sx={fieldSx}
                                    />
                                    <TextField
                                        fullWidth type="date" label="License Expiry Date" value={licenseExpiryDate}
                                        onChange={e => setLicenseExpiryDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ min: new Date().toISOString().split('T')[0] }}
                                        disabled={!editingLicense}
                                        sx={fieldSx}
                                    />
                                </TwoCol>
                                {editingLicense && (
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <SaveBtn onClick={handleSaveLicense} loading={saving.license} label="Update License Info" color="#7C3AED" />
                                        <Button variant="text" size="small" onClick={() => setEditingLicense(false)}
                                            sx={{ mt: 2.5, height: 48, px: 3, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2.5 }}>
                                            Cancel
                                        </Button>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                        License Photos
                                    </Typography>
                                    <DocumentUploadCard
                                        title="License — Front"
                                        description="Clear photo of the front side"
                                        onUpload={f => handleDocUpload(f, 'driverLicenseFront', 'driver-profiles.driver-profile', driverProfileId, 'driverLicenseFront')}
                                        uploadedFile={docs.driverLicenseFront}
                                        onRemove={() => setDocs(p => ({ ...p, driverLicenseFront: null }))}
                                    />
                                    <DocumentUploadCard
                                        title="License — Back"
                                        description="Clear photo of the back side"
                                        onUpload={f => handleDocUpload(f, 'driverLicenseBack', 'driver-profiles.driver-profile', driverProfileId, 'driverLicenseBack')}
                                        uploadedFile={docs.driverLicenseBack}
                                        onRemove={() => setDocs(p => ({ ...p, driverLicenseBack: null }))}
                                    />
                                </Box>
                            </Box>
                        </SectionCard>
                    </motion.div>
                )}

                {/* ══ Section 3: National ID (NRC) ══ */}
                {reqNRC && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <SectionCard
                            icon={BadgeIcon}
                            title="National ID (NRC)"
                            subtitle="NRC number and photos"
                            color="#0EA5E9"
                            completed={nrcSaved}
                            onEdit={() => setEditingNationalId(true)}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    fullWidth label="NRC Number" value={nationalIdNumber}
                                    onChange={e => setNationalIdNumber(e.target.value)}
                                    placeholder="e.g., 123456/78/9"
                                    disabled={!editingNationalId}
                                    sx={fieldSx}
                                />
                                {editingNationalId && (
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <SaveBtn onClick={handleSaveNationalId} loading={saving.nationalId} label="Update NRC Info" color="#0EA5E9" />
                                        <Button variant="text" size="small" onClick={() => setEditingNationalId(false)}
                                            sx={{ mt: 2.5, height: 48, px: 3, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2.5 }}>
                                            Cancel
                                        </Button>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                        NRC Photos
                                    </Typography>
                                    <DocumentUploadCard
                                        title="NRC — Front"
                                        description="Clear photo of the front"
                                        onUpload={f => handleDocUpload(f, 'nationalIdFront', 'driver-profiles.driver-profile', driverProfileId, 'nationalIdFront')}
                                        uploadedFile={docs.nationalIdFront}
                                        onRemove={() => setDocs(p => ({ ...p, nationalIdFront: null }))}
                                    />
                                    <DocumentUploadCard
                                        title="NRC — Back"
                                        description="Clear photo of the back"
                                        onUpload={f => handleDocUpload(f, 'nationalIdBack', 'driver-profiles.driver-profile', driverProfileId, 'nationalIdBack')}
                                        uploadedFile={docs.nationalIdBack}
                                        onRemove={() => setDocs(p => ({ ...p, nationalIdBack: null }))}
                                    />
                                </Box>
                            </Box>
                        </SectionCard>
                    </motion.div>
                )}

                {/* ══ Section 4: Residential Address ══ */}
                {reqAddress && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                        <SectionCard
                            icon={HomeIcon}
                            title="Residential Address"
                            subtitle="Driver's home address"
                            color="#F59E0B"
                            completed={addressSaved}
                            onEdit={() => setEditingAddress(true)}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    fullWidth label="Address" value={address} multiline rows={2}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="House No, Street, Area, City"
                                    disabled={!editingAddress}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ mt: '-12px !important', alignSelf: 'flex-start', pt: 1.5 }}>
                                                <HomeIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={fieldSx}
                                />
                                {editingAddress && (
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <SaveBtn onClick={handleSaveAddress} loading={saving.address} label="Update Address" color="#F59E0B" />
                                        <Button variant="text" size="small" onClick={() => setEditingAddress(false)}
                                            sx={{ mt: 2.5, height: 48, px: 3, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2.5 }}>
                                            Cancel
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </SectionCard>
                    </motion.div>
                )}

                {/* ══ Section 5: Vehicles ══ */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                    <Paper elevation={0} sx={{
                        borderRadius: 3.5, mb: 3, overflow: 'hidden',
                        border: `1px solid ${alpha('#8B5CF6', 0.2)}`,
                        background: `linear-gradient(145deg, ${alpha('#8B5CF6', 0.06)} 0%, transparent 100%)`,
                    }}>
                        <Box sx={{
                            px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                            background: `linear-gradient(135deg, #8B5CF6 0%, ${alpha('#8B5CF6', 0.8)} 100%)`,
                        }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isDeliveryDriver ? <DeliveryIcon sx={{ color: '#fff', fontSize: 20 }} /> : <CarIcon sx={{ color: '#fff', fontSize: 20 }} />}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                                    {isDeliveryDriver ? 'Delivery Vehicle' : 'Vehicle'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                                    Existing vehicle and new attachments
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Existing assigned vehicle — read only */}
                            {existingVehicle ? (
                                <ExistingVehicleCard
                                    vehicle={existingVehicle}
                                    vehicleId={existingVehicleId}
                                    onEditRedirect={id => router.push(`/partner/vehicle/${id}`)}
                                />
                            ) : (
                                <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                                    <Typography variant="caption">No vehicle currently assigned to this driver.</Typography>
                                </Alert>
                            )}

                            {/* ── Attach existing vehicle ── */}
                            <Button
                                fullWidth variant="outlined" startIcon={saving.attachExisting ? <CircularProgress size={16} /> : <SearchIcon />}
                                onClick={() => setExistingVehicleSearchOpen(true)}
                                disabled={saving.attachExisting}
                                sx={{
                                    borderRadius: 2.5, fontWeight: 700, height: 48,
                                    borderColor: alpha('#10B981', 0.5), color: '#34D399',
                                    '&:hover': { borderColor: '#10B981', bgcolor: alpha('#10B981', 0.08) },
                                }}
                            >
                                {saving.attachExisting ? 'Attaching…' : 'Attach Existing Vehicle to Driver'}
                            </Button>

                            {attachedExistingVehicle && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#10B981' }}>
                                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        {attachedExistingVehicle.numberPlate} attached successfully
                                    </Typography>
                                </Box>
                            )}

                            {/* ── Attach new vehicle toggle ── */}
                            {!showNewVehicleForm ? (
                                <Button
                                    fullWidth variant="outlined" startIcon={<AddIcon />}
                                    onClick={() => setShowNewVehicleForm(true)}
                                    sx={{
                                        borderRadius: 2.5, fontWeight: 700, height: 48,
                                        borderColor: alpha('#8B5CF6', 0.5), color: '#A78BFA',
                                        '&:hover': { borderColor: '#8B5CF6', bgcolor: alpha('#8B5CF6', 0.08) },
                                    }}
                                >
                                    Attach New Vehicle to Driver
                                </Button>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                            New Vehicle
                                        </Typography>
                                        <Button variant="text" size="small" onClick={() => setShowNewVehicleForm(false)}
                                            sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '0.75rem' }}>
                                            Cancel
                                        </Button>
                                    </Box>

                                    {/* Vehicle type selector */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {vehicleTypes.map(({ value, label, Icon: VtIcon, color: vtColor }) => {
                                            const selected = selectedVehicleType === value;
                                            const isLocked = vehicleTypeSaved && !editingVehicleType;
                                            return (
                                                <Paper
                                                    key={value} elevation={0}
                                                    onClick={() => !isLocked && setSelectedVehicleType(value)}
                                                    sx={{
                                                        p: 2, borderRadius: 3, cursor: isLocked ? 'default' : 'pointer',
                                                        border: `2px solid ${selected ? vtColor : 'rgba(255,255,255,0.07)'}`,
                                                        background: selected ? alpha(vtColor, 0.12) : 'rgba(255,255,255,0.02)',
                                                        display: 'flex', alignItems: 'center', gap: 2,
                                                        opacity: isLocked && !selected ? 0.35 : 1,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': !isLocked ? { borderColor: vtColor, transform: 'translateY(-1px)' } : {},
                                                    }}
                                                >
                                                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(vtColor, selected ? 0.25 : 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: vtColor }}>
                                                        <VtIcon sx={{ fontSize: 28 }} />
                                                    </Box>
                                                    <Typography sx={{ flex: 1, fontWeight: 700, color: selected ? vtColor : '#fff' }}>{label}</Typography>
                                                    <Radio checked={selected} size="small" disabled={isLocked} sx={{ color: vtColor, '&.Mui-checked': { color: vtColor }, p: 0 }} />
                                                </Paper>
                                            );
                                        })}

                                        {vehicleTypeSaved && !editingVehicleType ? (
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 0.5 }}>
                                                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#10B981', flex: 1 }}>
                                                    {vehicleTypes.find(t => t.value === selectedVehicleType)?.label} confirmed
                                                </Typography>
                                                <Button size="small" variant="text" startIcon={<EditIcon />}
                                                    onClick={() => setEditingVehicleType(true)}
                                                    sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.75rem' }}>
                                                    Change
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                <SaveBtn onClick={handleSaveVehicleType} loading={saving.vehicleType} label="Confirm Vehicle Type" color="#8B5CF6" />
                                                {editingVehicleType && (
                                                    <Button variant="text" size="small" onClick={() => setEditingVehicleType(false)}
                                                        sx={{ mt: 2.5, height: 48, px: 3, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2.5 }}>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </Box>
                                        )}
                                    </Box>

                                    {/* New vehicle details — visible after type is confirmed */}
                                    {vehicleTypeSaved && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                                    Vehicle Details
                                                </Typography>
                                                {newVehicleDetailsSaved && !editingNewVehicleDet && (
                                                    <IconButton size="small" onClick={() => setEditingNewVehicleDet(true)}
                                                        sx={{ color: '#fff', bgcolor: alpha('#8B5CF6', 0.2), width: 26, height: 26, '&:hover': { bgcolor: alpha('#8B5CF6', 0.4) } }}>
                                                        <EditIcon sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                )}
                                            </Box>

                                            <TextField
                                                fullWidth label="Number Plate" value={vehicleForm.numberPlate} required
                                                onChange={e => setVehicleForm(p => ({ ...p, numberPlate: e.target.value.toUpperCase() }))}
                                                placeholder="e.g., ALZ 1234"
                                                disabled={newVehicleDetailsSaved && !editingNewVehicleDet}
                                                sx={monoSx}
                                            />
                                            <TwoCol>
                                                <Box>
                                                    <Autocomplete
                                                        fullWidth freeSolo options={makesList} value={vehicleForm.make}
                                                        onChange={(_, v) => setVehicleForm(p => ({ ...p, make: v ?? '', model: '' }))}
                                                        disabled={newVehicleDetailsSaved && !editingNewVehicleDet}
                                                        renderInput={params => <TextField {...params} label="Make" required sx={fieldSx} />}
                                                    />
                                                    {!(newVehicleDetailsSaved && !editingNewVehicleDet) && (
                                                        <Button
                                                            size="small" variant="text" startIcon={<AddNewIcon sx={{ fontSize: 14 }} />}
                                                            onClick={() => setAddMakeModelOpen(true)}
                                                            sx={{ mt: 0.5, color: '#A78BFA', fontWeight: 600, fontSize: '0.72rem', textTransform: 'none', px: 0.5 }}
                                                        >
                                                            Add name if not in list
                                                        </Button>
                                                    )}
                                                </Box>
                                                <Autocomplete
                                                    fullWidth freeSolo options={modelsList} value={vehicleForm.model}
                                                    onChange={(_, v) => setVehicleForm(p => ({ ...p, model: v ?? '' }))}
                                                    disabled={!vehicleForm.make || (newVehicleDetailsSaved && !editingNewVehicleDet)}
                                                    renderInput={params => <TextField {...params} label="Model" required sx={fieldSx} />}
                                                />
                                            </TwoCol>
                                            <TwoCol>
                                                <TextField
                                                    select fullWidth label="Year" value={vehicleForm.year}
                                                    onChange={e => setVehicleForm(p => ({ ...p, year: parseInt(e.target.value) }))}
                                                    disabled={newVehicleDetailsSaved && !editingNewVehicleDet}
                                                    sx={fieldSx}
                                                >
                                                    {[...allowedYears].reverse().map(y => <MenuItem key={y} value={parseInt(y)}>{y}</MenuItem>)}
                                                </TextField>
                                                <TextField
                                                    fullWidth type="number" label="Seating Capacity" value={vehicleForm.seatingCapacity}
                                                    onChange={e => setVehicleForm(p => ({ ...p, seatingCapacity: parseInt(e.target.value) }))}
                                                    inputProps={{ min: 1, max: 50 }}
                                                    disabled={newVehicleDetailsSaved && !editingNewVehicleDet}
                                                    sx={fieldSx}
                                                />
                                            </TwoCol>
                                            <VehicleColorPicker
                                                value={vehicleForm.color}
                                                onChange={k => setVehicleForm(p => ({ ...p, color: k }))}
                                                disabled={newVehicleDetailsSaved && !editingNewVehicleDet}
                                                helperText="Select vehicle color"
                                            />
                                            <TextField
                                                fullWidth type="date" label="Insurance Expiry Date" value={vehicleForm.insuranceExpiryDate}
                                                onChange={e => setVehicleForm(p => ({ ...p, insuranceExpiryDate: e.target.value }))}
                                                InputLabelProps={{ shrink: true }}
                                                helperText="When does the vehicle insurance expire?"
                                                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                                                disabled={newVehicleDetailsSaved && !editingNewVehicleDet}
                                                sx={fieldSx}
                                            />

                                            {(!newVehicleDetailsSaved || editingNewVehicleDet) && (
                                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                    <SaveBtn
                                                        onClick={handleSaveNewVehicle}
                                                        loading={saving.newVehicle}
                                                        label={editingNewVehicleDet ? 'Update Vehicle' : 'Save & Attach Vehicle'}
                                                        color="#8B5CF6"
                                                    />
                                                    {editingNewVehicleDet && (
                                                        <Button variant="text" size="small" onClick={() => setEditingNewVehicleDet(false)}
                                                            sx={{ mt: 2.5, height: 48, px: 3, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderRadius: 2.5 }}>
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </Box>
                                            )}

                                            {newVehicleDetailsSaved && !editingNewVehicleDet && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#10B981' }}>
                                                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                        Vehicle attached — {vehicleForm.numberPlate.toUpperCase()}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </motion.div>

                {/* ══ Section 6: Profile Picture & Insurance ══ */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                    <SectionCard
                        icon={CameraIcon}
                        title="Profile Picture & Insurance"
                        subtitle={`Driver photo (required)${reqInsurance ? ' and insurance certificate (required)' : ''}`}
                        color="#0EA5E9"
                        completed={!!docs.profilePicture}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <DocumentUploadCard
                                title="Profile Photo"
                                description="Clear, well-lit photo of the driver's face"
                                acceptedFormats="image/*"
                                onUpload={f => handleDocUpload(f, 'profilePicture', 'plugin::users-permissions.user', driverId, 'profilePicture')}
                                uploadedFile={docs.profilePicture}
                                onRemove={() => setDocs(p => ({ ...p, profilePicture: null }))}
                            />
                            <DocumentUploadCard
                                title="Insurance Certificate"
                                description={reqInsurance ? 'Valid insurance disk or certificate' : 'Optional — valid insurance disk or certificate'}
                                onUpload={f => handleDocUpload(f, 'insuranceCertificate', 'api::vehicle.vehicle', vehicleId ?? existingVehicleId, 'insuranceCertificate')}
                                uploadedFile={docs.insuranceCertificate}
                                onRemove={() => setDocs(p => ({ ...p, insuranceCertificate: null }))}
                            />
                        </Box>
                    </SectionCard>
                </motion.div>

                {/* ══ Section 7: Submit for Verification (Issue 1 — Step D) ══ */}
                {needsVerification && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                        <SectionCard
                            icon={CheckCircleIcon}
                            title="Submit for Verification"
                            subtitle="Re-submit this driver for admin approval"
                            color="#059669"
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
                                    <Typography variant="body2" fontWeight={600} gutterBottom>Account not yet approved</Typography>
                                    <Typography variant="body2">
                                        {isDeliveryDriver
                                            ? 'Both the driver profile and delivery profile must be approved. Submitting will queue this account for admin review.'
                                            : "This driver's profile has not been approved yet. Submitting will queue it for admin review."}
                                    </Typography>
                                </Alert>
                                <Button
                                    fullWidth variant="contained" size="large"
                                    onClick={handleSubmitForVerification}
                                    disabled={saving.submit}
                                    startIcon={saving.submit ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : null}
                                    sx={{
                                        height: 56, borderRadius: 3, fontWeight: 800, fontSize: '1rem',
                                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                        boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
                                        '&:hover': { boxShadow: '0 8px 24px rgba(5,150,105,0.5)', transform: 'translateY(-1px)' },
                                        '&:disabled': { background: 'rgba(255,255,255,0.08)', boxShadow: 'none' },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {saving.submit ? 'Submitting…' : 'Submit Driver for Verification'}
                                </Button>
                            </Box>
                        </SectionCard>
                    </motion.div>
                )}
            </Box>

            <Snackbar
                open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2.5 }}>
                    {toast?.msg}
                </Alert>
            </Snackbar>
        </Box>
    )
}