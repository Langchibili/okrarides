// PATH: appvehicles/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, MenuItem, FormControl,
  InputLabel, Autocomplete, Alert, CircularProgress, IconButton, Avatar,
} from '@mui/material';
import { Add as AddIcon, Link as AssignIcon, LinkOff as UnassignIcon } from '@mui/icons-material';
import { getVehicles, addVehicle, assignVehicle, getDrivers } from '@/lib/api/partner';
import { getVehicleMakesAndModels, getAllowedVehicleYears } from '@/lib/api/vehicles';
import { getInsuranceChipProps } from '@/lib/utils/format';
import { VEHICLE_TYPES, getColorByKey } from '@/constants';
import VehicleColorPicker from '@/components/ui/VehicleColorPicker';
import { motion } from 'framer-motion';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Add vehicle form state
  const [form, setForm] = useState({
    vehicleType: 'taxi', numberPlate: '', make: '', model: '',
    year: '', color: 'white', seatingCapacity: '', insuranceExpiryDate: '', driverId: '',
  });
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVehicles(search || undefined);
      setVehicles(res?.data ?? []);
    } catch (e) {
      setError(e.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (addOpen) {
      getAllowedVehicleYears().then(setYears);
      getDrivers({ pageSize: 100 }).then((r) => setDrivers(r?.data ?? []));
    }
  }, [addOpen]);

  useEffect(() => {
    if (!addOpen) return;
    setForm((f) => ({ ...f, make: '', model: '' }));
    getVehicleMakesAndModels(form.vehicleType).then((data) => setMakes(Object.keys(data)));
  }, [form.vehicleType, addOpen]);

  useEffect(() => {
    if (!form.make) { setModels([]); return; }
    getVehicleMakesAndModels(form.vehicleType).then((data) => {
      setModels(data[form.make] ?? []);
    });
  }, [form.make, form.vehicleType]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await addVehicle({
        vehicleType: form.vehicleType,
        numberPlate: form.numberPlate.toUpperCase(),
        make: form.make, model: form.model,
        year: form.year ? parseInt(form.year) : undefined,
        color: form.color,
        seatingCapacity: form.seatingCapacity ? parseInt(form.seatingCapacity) : undefined,
        insuranceExpiryDate: form.insuranceExpiryDate || undefined,
        driverId: form.driverId ? parseInt(form.driverId) : undefined,
      });
      setAddOpen(false);
      setForm({ vehicleType: 'taxi', numberPlate: '', make: '', model: '', year: '', color: 'white', seatingCapacity: '', insuranceExpiryDate: '', driverId: '' });
      setToast({ msg: 'Vehicle added successfully!', severity: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.message || 'Failed to add vehicle', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (vehicleId) => {
    try {
      await assignVehicle(vehicleId, undefined);
      setToast({ msg: 'Vehicle unassigned', severity: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.message, severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Fleet Vehicles</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{vehicles.length} vehicles registered</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
          Add Vehicle
        </Button>
      </Box>

      {toast && <Alert severity={toast.severity} sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setToast(null)}>{toast.msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError(null)}>{error}</Alert>}

      <TextField placeholder="Search by plate, make, model…" value={search}
        onChange={(e) => setSearch(e.target.value)} size="small" sx={{ mb: 3, maxWidth: 360, width: '100%' }} />

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plate</TableCell>
              <TableCell>Make / Model / Year</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Assigned Driver</TableCell>
              <TableCell>Insurance</TableCell>
              <TableCell>Verification</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7}><CircularProgress size={24} /></TableCell></TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No vehicles found</TableCell></TableRow>
            ) : (
              vehicles.map((v) => {
                const ins = getInsuranceChipProps(v.insuranceExpiryDate);
                const colorObj = getColorByKey(v.color?.toLowerCase() ?? '');
                return (
                  <TableRow key={v.id} hover>
                    <TableCell>
                      <Typography sx={{
                        fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, letterSpacing: 2,
                        fontSize: '0.95rem', color: '#F59E0B',
                      }}>
                        {v.numberPlate}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                      {v.make} {v.model} · {v.year}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: colorObj?.body ?? '#ccc', border: `1px solid ${colorObj?.outline ?? '#999'}` }} />
                        <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{v.color}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {v.assignedDriver ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#059669', fontSize: '0.7rem', fontWeight: 700 }}>
                            {v.assignedDriver.firstName?.[0]}
                          </Avatar>
                          <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                            {v.assignedDriver.firstName} {v.assignedDriver.lastName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Unassigned</Typography>
                      )}
                    </TableCell>
                    <TableCell><Chip label={ins.label} color={ins.color} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} /></TableCell>
                    <TableCell>
                      <Chip
                        label={v.verificationStatus?.toUpperCase()}
                        size="small"
                        color={v.verificationStatus === 'approved' ? 'success' : v.verificationStatus === 'pending' ? 'warning' : 'error'}
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.6rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      {v.assignedDriver && (
                        <IconButton size="small" onClick={() => handleUnassign(v.id)} sx={{ color: '#F59E0B' }} title="Unassign">
                          <UnassignIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add vehicle dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Vehicle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vehicle Type</InputLabel>
                <Select value={form.vehicleType} label="Vehicle Type" onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}>
                  {VEHICLE_TYPES.map((t) => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Number Plate *" value={form.numberPlate}
                onChange={(e) => setForm((f) => ({ ...f, numberPlate: e.target.value.toUpperCase() }))}
                inputProps={{ style: { fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3 } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete freeSolo options={makes} value={form.make}
                onInputChange={(_, v) => setForm((f) => ({ ...f, make: v, model: '' }))}
                renderInput={(params) => <TextField {...params} label="Make *" />} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete freeSolo options={models} value={form.model}
                onInputChange={(_, v) => setForm((f) => ({ ...f, model: v }))}
                renderInput={(params) => <TextField {...params} label="Model *" />} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select value={form.year} label="Year" onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}>
                  {[...years].reverse().map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Seating Capacity" type="number" value={form.seatingCapacity}
                onChange={(e) => setForm((f) => ({ ...f, seatingCapacity: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Insurance Expiry" type="date" value={form.insuranceExpiryDate}
                onChange={(e) => setForm((f) => ({ ...f, insuranceExpiryDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <VehicleColorPicker value={form.color} onChange={(c) => setForm((f) => ({ ...f, color: c }))} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Assign to Driver (optional)</InputLabel>
                <Select value={form.driverId} label="Assign to Driver (optional)"
                  onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}>
                  <MenuItem value="">— None / Unassigned —</MenuItem>
                  {drivers.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.firstName} {d.lastName} · {d.phoneNumber}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!form.numberPlate || !form.make || !form.model || saving} variant="contained"
            sx={{ flex: 2, borderRadius: 2.5, fontWeight: 700, height: 48 }}>
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Add Vehicle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
