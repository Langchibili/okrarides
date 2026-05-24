// PATH: appdrivers/register/page.js
'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Grid, Select, MenuItem,
  FormControl, InputLabel, Autocomplete, Chip, Alert, CircularProgress,
  InputAdornment, IconButton,
} from '@mui/material';
import { ArrowBack as BackIcon, ContentCopy as CopyIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { registerDriver } from '@/lib/api/partner';
import { getVehicleMakesAndModels, getAllowedVehicleYears } from '@/lib/api/vehicles';
import { usePartner } from '@/lib/hooks/usePartner';
import VehicleColorPicker from '@/components/ui/VehicleColorPicker';

const VEHICLE_TYPES = ['taxi', 'bus', 'motorcycle', 'motorbike', 'truck'];

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function RegisterDriverPage() {
  const router = useRouter();
  const { currency, phoneCode } = usePartner();

  // Driver fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [autoGen, setAutoGen] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');

  // Vehicle fields
  const [vehicleType, setVehicleType] = useState('taxi');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('white');
  const [numberPlate, setNumberPlate] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');

  // Derived
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoGen) setPassword(generatePassword());
  }, [autoGen]);

  useEffect(() => {
    getAllowedVehicleYears().then(setYears);
  }, []);

  useEffect(() => {
    setMake('');
    setModel('');
    setModels([]);
    getVehicleMakesAndModels(vehicleType).then((data) => {
      setMakes(Object.keys(data));
    });
  }, [vehicleType]);

  useEffect(() => {
    if (!make) { setModels([]); return; }
    getVehicleMakesAndModels(vehicleType).then((data) => {
      setModels(data[make] ?? []);
      setModel('');
    });
  }, [make, vehicleType]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await registerDriver({
        firstName, lastName,
        phoneNumber: `${phoneCode}${phoneNumber.replace(/^0/, '')}`,
        password,
        licenseNumber: licenseNumber || undefined,
        licenseExpiryDate: licenseExpiry || undefined,
        nationalIdNumber: nationalId || undefined,
        address: address || undefined,
        vehicleType,
        numberPlate: numberPlate.toUpperCase(),
        make, model,
        year: year ? parseInt(year) : undefined,
        color,
        seatingCapacity: seatingCapacity ? parseInt(seatingCapacity) : undefined,
        insuranceExpiryDate: insuranceExpiry || undefined,
      });
      setSuccess(res);
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ p: 3, maxWidth: 560, mx: 'auto', textAlign: 'center' }}>
        <Paper sx={{ p: 4, borderRadius: 4, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.3)' }}>
          <CheckIcon sx={{ fontSize: 56, color: '#10B981', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 1 }}>
            Driver Registered!
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            {success.driver?.firstName} {success.driver?.lastName} — {success.driver?.phoneNumber}
          </Typography>
          <Paper sx={{ p: 2, borderRadius: 2.5, mb: 3, bgcolor: 'rgba(0,0,0,0.3)' }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', mb: 0.5 }}>
              Temporary Password (share with driver)
            </Typography>
            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: '#F59E0B', fontSize: '1.2rem', letterSpacing: 2 }}>
              {password}
            </Typography>
          </Paper>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700 }} onClick={() => router.push(`drivers/${success.driver?.id}`)}>
              View Driver Profile
            </Button>
            <Button variant="contained" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700 }} onClick={() => {
              setSuccess(null); setFirstName(''); setLastName(''); setPhoneNumber('');
              setPassword(''); setLicenseNumber(''); setModel(''); setMake(''); setNumberPlate('');
            }}>
              Register Another
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  const sectionTitle = (t) => (
    <Typography sx={{ fontWeight: 800, color: '#10B981', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1.2, mb: 2, mt: 1 }}>
      {t}
    </Typography>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ color: 'rgba(255,255,255,0.5)' }}><BackIcon /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Register Driver & Vehicle</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>All sections visible — scroll down to complete</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        {sectionTitle('Section 1 — Driver Identity')}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Phone Number" value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">+{phoneCode}</InputAdornment> }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth label="Password"
                value={password}
                onChange={(e) => { if (!autoGen) setPassword(e.target.value); }}
                InputProps={{
                  readOnly: autoGen,
                  endAdornment: autoGen && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleCopy} edge="end">
                        {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <Button
                variant={autoGen ? 'contained' : 'outlined'}
                onClick={() => setAutoGen(!autoGen)}
                sx={{ height: 56, borderRadius: 2.5, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                {autoGen ? 'Manual' : 'Auto-Generate'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        {sectionTitle('Section 2 — Documents')}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="License Expiry Date" type="date" value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="National ID Number" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Residential Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        {sectionTitle('Section 3 — Vehicle')}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Vehicle Type</InputLabel>
              <Select value={vehicleType} label="Vehicle Type" onChange={(e) => setVehicleType(e.target.value)}>
                {VEHICLE_TYPES.map((t) => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Number Plate" value={numberPlate}
              onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
              inputProps={{ style: { fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3, textTransform: 'uppercase' } }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo options={makes} value={make}
              onInputChange={(_, v) => setMake(v)}
              renderInput={(params) => <TextField {...params} label="Make" required />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo options={models} value={model}
              onInputChange={(_, v) => setModel(v)}
              renderInput={(params) => <TextField {...params} label="Model" required />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)}>
                {[...years].reverse().map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Seating Capacity" type="number" value={seatingCapacity}
              onChange={(e) => setSeatingCapacity(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Insurance Expiry" type="date" value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <VehicleColorPicker value={color} onChange={setColor} />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3, background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}>
        {sectionTitle('Section 4 — Review & Submit')}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Driver</Typography>
            <Typography sx={{ color: '#fff', fontWeight: 700 }}>{firstName} {lastName}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>+{phoneCode}{phoneNumber}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Vehicle</Typography>
            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", color: '#F59E0B', fontWeight: 700, letterSpacing: 2 }}>
              {numberPlate || '—'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{make} {model} · {vehicleType}</Typography>
          </Grid>
        </Grid>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={loading || !firstName || !lastName || !phoneNumber || !password || !vehicleType || !numberPlate || !make || !model}
          sx={{ height: 56, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem' }}
        >
          {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : '🚀 Register Driver & Vehicle'}
        </Button>
      </Paper>
    </Box>
  );
}
