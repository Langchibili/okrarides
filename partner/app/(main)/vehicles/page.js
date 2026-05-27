// // // PATH: app/partner/vehicles/page.js
// // 'use client';
// // import { useState, useEffect, useCallback } from 'react';
// // import {
// //   Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
// //   TableHead, TableRow, Button, TextField, Chip, Dialog, DialogTitle,
// //   DialogContent, DialogActions, Grid, Select, MenuItem, FormControl,
// //   InputLabel, Autocomplete, Alert, CircularProgress, IconButton, Avatar,
// // } from '@mui/material';
// // import { Add as AddIcon, LinkOff as UnassignIcon } from '@mui/icons-material';
// // import { getVehicles, addVehicle, getDrivers } from '@/lib/api/partner';
// // import { getVehicleMakesAndModels, getAllowedVehicleYears } from '@/lib/api/vehicles';
// // import { getInsuranceChipProps } from '@/lib/utils/format';
// // import { VEHICLE_TYPES, getColorByKey } from '@/constants';
// // import { VehicleColorPicker } from '@/components/ui/VehicleColorPicker';
// // import { apiClient } from '@/lib/api/client';

// // // ─── Unassign a vehicle by setting assignedDriver to null via a vehicle update ─
// // async function unassignVehicleRequest(vehicleId) {
// //   const res = await apiClient.put(`/vehicles/${vehicleId}`, { data: { assignedDriver: null } });
// //   if (!res) {
// //     const body = await res.json().catch(() => ({}));
// //     throw new Error(body?.error?.message ?? `Failed to unassign vehicle (${res.status})`);
// //   }
// //   return res;
// // }

// // // ─── Unassign confirmation modal ──────────────────────────────────────────────
// // function UnassignConfirmModal({ vehicle, open, onClose, onConfirm, loading }) {
// //   if (!vehicle) return null;

// //   const driverName = vehicle.assignedDriver
// //     ? `${vehicle.assignedDriver.firstName ?? ''} ${vehicle.assignedDriver.lastName ?? ''}`.trim()
// //     : 'this driver';

// //   return (
// //     <Dialog
// //       open={open}
// //       onClose={loading ? undefined : onClose}
// //       PaperProps={{
// //         sx: {
// //           borderRadius: 3.5,
// //           bgcolor: '#0f172a',
// //           border: '1px solid rgba(255,255,255,0.1)',
// //           backgroundImage: 'none',
// //           maxWidth: 380,
// //           width: '100%',
// //         },
// //       }}
// //     >
// //       <DialogTitle sx={{ pb: 0.5 }}>
// //         <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
// //           Unassign Vehicle?
// //         </Typography>
// //       </DialogTitle>

// //       <DialogContent>
// //         <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.6 }}>
// //           This will remove{' '}
// //           <Box component="span" sx={{ color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
// //             {vehicle.numberPlate}
// //           </Box>{' '}
// //           from <Box component="span" sx={{ color: '#fff', fontWeight: 600 }}>{driverName}</Box>.
// //           The vehicle will become unassigned and available to reassign.
// //         </Typography>
// //       </DialogContent>

// //       <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
// //         <Button
// //           onClick={onClose}
// //           disabled={loading}
// //           variant="outlined"
// //           sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}
// //         >
// //           Cancel
// //         </Button>
// //         <Button
// //           onClick={onConfirm}
// //           disabled={loading}
// //           variant="contained"
// //           color="warning"
// //           sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 42 }}
// //         >
// //           {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Unassign'}
// //         </Button>
// //       </DialogActions>
// //     </Dialog>
// //   );
// // }

// // // ═════════════════════════════════════════════════════════════════════════════
// // export default function VehiclesPage() {
// //   const [vehicles, setVehicles] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [search, setSearch] = useState('');
// //   const [addOpen, setAddOpen] = useState(false);
// //   const [toast, setToast] = useState(null);

// //   // Unassign confirmation: stores the full vehicle object while modal is open
// //   const [unassignTarget, setUnassignTarget] = useState(null);
// //   const [unassigning, setUnassigning] = useState(false);

// //   // Add vehicle form
// //   const [form, setForm] = useState({
// //     vehicleType: 'taxi', numberPlate: '', make: '', model: '',
// //     year: '', color: 'white', seatingCapacity: '', insuranceExpiryDate: '', driverId: '',
// //   });
// //   const [makes, setMakes] = useState([]);
// //   const [models, setModels] = useState([]);
// //   const [years, setYears] = useState([]);
// //   const [drivers, setDrivers] = useState([]);
// //   const [saving, setSaving] = useState(false);

// //   const load = useCallback(async () => {
// //     setLoading(true);
// //     try {
// //       const res = await getVehicles(search || undefined);
// //       setVehicles(res?.data ?? []);
// //     } catch (e) {
// //       setError(e.message || 'Failed to load vehicles');
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [search]);

// //   useEffect(() => { load(); }, [load]);

// //   useEffect(() => {
// //     if (addOpen) {
// //       getAllowedVehicleYears().then(setYears);
// //       getDrivers({ pageSize: 100 }).then((r) => setDrivers(r?.data ?? []));
// //     }
// //   }, [addOpen]);

// //   useEffect(() => {
// //     if (!addOpen) return;
// //     setForm((f) => ({ ...f, make: '', model: '' }));
// //     getVehicleMakesAndModels(form.vehicleType).then((data) => setMakes(Object.keys(data)));
// //   }, [form.vehicleType, addOpen]);

// //   useEffect(() => {
// //     if (!form.make) { setModels([]); return; }
// //     getVehicleMakesAndModels(form.vehicleType).then((data) => {
// //       setModels(data[form.make] ?? []);
// //     });
// //   }, [form.make, form.vehicleType]);

// //   const handleAdd = async () => {
// //     setSaving(true);
// //     try {
// //       await addVehicle({
// //         vehicleType: form.vehicleType,
// //         numberPlate: form.numberPlate.toUpperCase(),
// //         make: form.make, model: form.model,
// //         year: form.year ? parseInt(form.year) : undefined,
// //         color: form.color,
// //         seatingCapacity: form.seatingCapacity ? parseInt(form.seatingCapacity) : undefined,
// //         insuranceExpiryDate: form.insuranceExpiryDate || undefined,
// //         driverId: form.driverId ? parseInt(form.driverId) : undefined,
// //       });
// //       setAddOpen(false);
// //       setForm({ vehicleType: 'taxi', numberPlate: '', make: '', model: '', year: '', color: 'white', seatingCapacity: '', insuranceExpiryDate: '', driverId: '' });
// //       setToast({ msg: 'Vehicle added successfully!', severity: 'success' });
// //       load();
// //     } catch (e) {
// //       setToast({ msg: e.message || 'Failed to add vehicle', severity: 'error' });
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   // ── Open the confirmation modal ───────────────────────────────────────────
// //   const handleUnassignClick = (vehicle) => {
// //     setUnassignTarget(vehicle);
// //   };

// //   // ── Confirmed: send PUT with assignedDriver: null ─────────────────────────
// //   const handleUnassignConfirm = async () => {
// //     if (!unassignTarget) return;
// //     setUnassigning(true);
// //     try {
// //       await unassignVehicleRequest(unassignTarget.id);
// //       setToast({ msg: `${unassignTarget.numberPlate} unassigned successfully`, severity: 'success' });
// //       setUnassignTarget(null);
// //       load();
// //     } catch (e) {
// //       setToast({ msg: e.message || 'Failed to unassign vehicle', severity: 'error' });
// //     } finally {
// //       setUnassigning(false);
// //     }
// //   };

// //   return (
// //     <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
// //       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
// //         <Box>
// //           <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Fleet Vehicles</Typography>
// //           <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{vehicles.length} vehicles registered</Typography>
// //         </Box>
// //         <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
// //           Add Vehicle
// //         </Button>
// //       </Box>

// //       {toast && <Alert severity={toast.severity} sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setToast(null)}>{toast.msg}</Alert>}
// //       {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError(null)}>{error}</Alert>}

// //       <TextField placeholder="Search by plate, make, model…" value={search}
// //         onChange={(e) => setSearch(e.target.value)} size="small" sx={{ mb: 3, maxWidth: 360, width: '100%' }} />

// //       <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
// //         <Table>
// //           <TableHead>
// //             <TableRow>
// //               <TableCell>Plate</TableCell>
// //               <TableCell>Make / Model / Year</TableCell>
// //               <TableCell>Color</TableCell>
// //               <TableCell>Assigned Driver</TableCell>
// //               <TableCell>Insurance</TableCell>
// //               <TableCell>Verification</TableCell>
// //               <TableCell>Actions</TableCell>
// //             </TableRow>
// //           </TableHead>
// //           <TableBody>
// //             {loading ? (
// //               <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
// //             ) : vehicles.length === 0 ? (
// //               <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No vehicles found</TableCell></TableRow>
// //             ) : (
// //               vehicles.map((v) => {
// //                 const ins = getInsuranceChipProps(v.insuranceExpiryDate);
// //                 const colorObj = getColorByKey(v.color?.toLowerCase() ?? '');
// //                 return (
// //                   <TableRow key={v.id} hover>
// //                     <TableCell>
// //                       <Typography sx={{
// //                         fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, letterSpacing: 2,
// //                         fontSize: '0.95rem', color: '#F59E0B',
// //                       }}>
// //                         {v.numberPlate}
// //                       </Typography>
// //                     </TableCell>
// //                     <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
// //                       {v.make} {v.model} · {v.year}
// //                     </TableCell>
// //                     <TableCell>
// //                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                         <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: colorObj?.body ?? '#ccc', border: `1px solid ${colorObj?.outline ?? '#999'}` }} />
// //                         <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{v.color}</Typography>
// //                       </Box>
// //                     </TableCell>
// //                     <TableCell>
// //                       {v.assignedDriver ? (
// //                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                           <Avatar sx={{ width: 24, height: 24, bgcolor: '#059669', fontSize: '0.7rem', fontWeight: 700 }}>
// //                             {v.assignedDriver.firstName?.[0]}
// //                           </Avatar>
// //                           <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
// //                             {v.assignedDriver.firstName} {v.assignedDriver.lastName}
// //                           </Typography>
// //                         </Box>
// //                       ) : (
// //                         <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Unassigned</Typography>
// //                       )}
// //                     </TableCell>
// //                     <TableCell><Chip label={ins.label} color={ins.color} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} /></TableCell>
// //                     <TableCell>
// //                       <Chip
// //                         label={v.verificationStatus?.toUpperCase()}
// //                         size="small"
// //                         color={v.verificationStatus === 'approved' ? 'success' : v.verificationStatus === 'pending' ? 'warning' : 'error'}
// //                         variant="outlined"
// //                         sx={{ fontWeight: 700, fontSize: '0.6rem' }}
// //                       />
// //                     </TableCell>
// //                     <TableCell>
// //                       {v.assignedDriver && (
// //                         <IconButton
// //                           size="small"
// //                           onClick={() => handleUnassignClick(v)}
// //                           sx={{ color: '#F59E0B' }}
// //                           title="Unassign driver"
// //                         >
// //                           <UnassignIcon fontSize="small" />
// //                         </IconButton>
// //                       )}
// //                     </TableCell>
// //                   </TableRow>
// //                 );
// //               })
// //             )}
// //           </TableBody>
// //         </Table>
// //       </TableContainer>

// //       {/* Add vehicle dialog */}
// //       <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
// //         <DialogTitle sx={{ fontWeight: 800 }}>Add Vehicle</DialogTitle>
// //         <DialogContent>
// //           <Grid container spacing={2} sx={{ mt: 0.5 }}>
// //             <Grid item xs={12} sm={6}>
// //               <FormControl fullWidth>
// //                 <InputLabel>Vehicle Type</InputLabel>
// //                 <Select value={form.vehicleType} label="Vehicle Type" onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}>
// //                   {VEHICLE_TYPES.map((t) => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
// //                 </Select>
// //               </FormControl>
// //             </Grid>
// //             <Grid item xs={12} sm={6}>
// //               <TextField fullWidth label="Number Plate *" value={form.numberPlate}
// //                 onChange={(e) => setForm((f) => ({ ...f, numberPlate: e.target.value.toUpperCase() }))}
// //                 inputProps={{ style: { fontFamily: "'JetBrains Mono', monospace", letterSpacing: 3 } }} />
// //             </Grid>
// //             <Grid item xs={12} sm={6}>
// //               <Autocomplete freeSolo options={makes} value={form.make}
// //                 onInputChange={(_, v) => setForm((f) => ({ ...f, make: v, model: '' }))}
// //                 renderInput={(params) => <TextField {...params} label="Make *" />} />
// //             </Grid>
// //             <Grid item xs={12} sm={6}>
// //               <Autocomplete freeSolo options={models} value={form.model}
// //                 onInputChange={(_, v) => setForm((f) => ({ ...f, model: v }))}
// //                 renderInput={(params) => <TextField {...params} label="Model *" />} />
// //             </Grid>
// //             <Grid item xs={12} sm={4}>
// //               <FormControl fullWidth>
// //                 <InputLabel>Year</InputLabel>
// //                 <Select value={form.year} label="Year" onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}>
// //                   {[...years].reverse().map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
// //                 </Select>
// //               </FormControl>
// //             </Grid>
// //             <Grid item xs={12} sm={4}>
// //               <TextField fullWidth label="Seating Capacity" type="number" value={form.seatingCapacity}
// //                 onChange={(e) => setForm((f) => ({ ...f, seatingCapacity: e.target.value }))} />
// //             </Grid>
// //             <Grid item xs={12} sm={4}>
// //               <TextField fullWidth label="Insurance Expiry" type="date" value={form.insuranceExpiryDate}
// //                 onChange={(e) => setForm((f) => ({ ...f, insuranceExpiryDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
// //             </Grid>
// //             <Grid item xs={12}>
// //               <VehicleColorPicker value={form.color} onChange={(c) => setForm((f) => ({ ...f, color: c }))} />
// //             </Grid>
// //             <Grid item xs={12}>
// //               <FormControl fullWidth>
// //                 <InputLabel>Assign to Driver (optional)</InputLabel>
// //                 <Select value={form.driverId} label="Assign to Driver (optional)"
// //                   onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}>
// //                   <MenuItem value="">— None / Unassigned —</MenuItem>
// //                   {drivers.map((d) => (
// //                     <MenuItem key={d.id} value={d.id}>{d.firstName} {d.lastName} · {d.phoneNumber}</MenuItem>
// //                   ))}
// //                 </Select>
// //               </FormControl>
// //             </Grid>
// //           </Grid>
// //         </DialogContent>
// //         <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
// //           <Button onClick={() => setAddOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Cancel</Button>
// //           <Button onClick={handleAdd} disabled={!form.numberPlate || !form.make || !form.model || saving} variant="contained"
// //             sx={{ flex: 2, borderRadius: 2.5, fontWeight: 700, height: 48 }}>
// //             {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Add Vehicle'}
// //           </Button>
// //         </DialogActions>
// //       </Dialog>

// //       {/* Unassign confirmation modal */}
// //       <UnassignConfirmModal
// //         open={!!unassignTarget}
// //         vehicle={unassignTarget}
// //         loading={unassigning}
// //         onClose={() => { if (!unassigning) setUnassignTarget(null); }}
// //         onConfirm={handleUnassignConfirm}
// //       />
// //     </Box>
// //   );
// // }
// // PATH: app/partner/vehicles/page.js
// 'use client';
// import { useState, useEffect, useCallback } from 'react';
// import {
//   Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
//   TableHead, TableRow, Button, TextField, Chip, Dialog, DialogTitle,
//   DialogContent, DialogActions, Select, MenuItem, FormControl,
//   InputLabel, Autocomplete, Alert, CircularProgress, IconButton, Avatar,
//   Modal, Fade, Backdrop,
// } from '@mui/material';
// import {
//   Add as AddIcon, LinkOff as UnassignIcon,
//   Add as AddNewIcon, Close as CloseIcon,
// } from '@mui/icons-material';
// import { alpha } from '@mui/material/styles';
// import { getVehicles, getDrivers } from '@/lib/api/partner';
// import { getVehicleMakesAndModels, getAllowedVehicleYears } from '@/lib/api/vehicles';
// import { getInsuranceChipProps } from '@/lib/utils/format';
// import { VEHICLE_TYPES, getColorByKey } from '@/constants';
// import { VehicleColorPicker } from '@/components/ui/VehicleColorPicker';
// import { apiClient } from '@/lib/api/client';

// // ─── Unassign a vehicle ───────────────────────────────────────────────────────
// async function unassignVehicleRequest(vehicleId) {
//   const res = await apiClient.put(`/vehicles/${vehicleId}`, { data: { assignedDriver: null } });
//   if (!res) {
//     const body = await res.json().catch(() => ({}));
//     throw new Error(body?.error?.message ?? `Failed to unassign vehicle (${res.status})`);
//   }
//   return res;
// }

// // ─── Add Custom Make/Model Modal (from register driver page) ──────────────────
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
//             <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
//               <CloseIcon fontSize="small" />
//             </IconButton>
//           </Box>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//             <TextField
//               fullWidth label="Vehicle Make" value={customMake}
//               onChange={e => setCustomMake(e.target.value)}
//               placeholder="e.g., Kia, Chery, BYD"
//               sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
//               autoFocus
//             />
//             <TextField
//               fullWidth label="Vehicle Model" value={customModel}
//               onChange={e => setCustomModel(e.target.value)}
//               placeholder="e.g., Sportage, Tiggo, Atto"
//               sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
//               onKeyDown={e => e.key === 'Enter' && handleConfirm()}
//             />
//             <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
//               <Button fullWidth variant="text" onClick={onClose}
//                 sx={{ borderRadius: 2.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
//                 Cancel
//               </Button>
//               <Button fullWidth variant="contained" onClick={handleConfirm}
//                 disabled={!customMake.trim() || !customModel.trim()}
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

// // ─── Unassign confirmation modal ──────────────────────────────────────────────
// function UnassignConfirmModal({ vehicle, open, onClose, onConfirm, loading }) {
//   if (!vehicle) return null;
//   const driverName = vehicle.assignedDriver
//     ? `${vehicle.assignedDriver.firstName ?? ''} ${vehicle.assignedDriver.lastName ?? ''}`.trim()
//     : 'this driver';

//   return (
//     <Dialog
//       open={open}
//       onClose={loading ? undefined : onClose}
//       PaperProps={{
//         sx: {
//           borderRadius: 3.5, bgcolor: '#0f172a',
//           border: '1px solid rgba(255,255,255,0.1)',
//           backgroundImage: 'none', maxWidth: 380, width: '100%',
//         },
//       }}
//     >
//       <DialogTitle sx={{ pb: 0.5 }}>
//         <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Unassign Vehicle?</Typography>
//       </DialogTitle>
//       <DialogContent>
//         <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.6 }}>
//           This will remove{' '}
//           <Box component="span" sx={{ color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
//             {vehicle.numberPlate}
//           </Box>{' '}
//           from <Box component="span" sx={{ color: '#fff', fontWeight: 600 }}>{driverName}</Box>.
//           The vehicle will become unassigned and available to reassign.
//         </Typography>
//       </DialogContent>
//       <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
//         <Button onClick={onClose} disabled={loading} variant="outlined"
//           sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}>
//           Cancel
//         </Button>
//         <Button onClick={onConfirm} disabled={loading} variant="contained" color="warning"
//           sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 42 }}>
//           {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Unassign'}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

// const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2.5 } };
// const monoSx = {
//   '& .MuiOutlinedInput-root': {
//     borderRadius: 2.5,
//     fontFamily: "'JetBrains Mono', monospace",
//     fontWeight: 700, letterSpacing: 1,
//   },
// };

// // ═════════════════════════════════════════════════════════════════════════════
// export default function VehiclesPage() {
//   const [vehicles, setVehicles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState('');
//   const [addOpen, setAddOpen] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [addMakeModelOpen, setAddMakeModelOpen] = useState(false);

//   const [unassignTarget, setUnassignTarget] = useState(null);
//   const [unassigning, setUnassigning] = useState(false);

//   // ── Add vehicle form ──────────────────────────────────────────────────────
//   const [form, setForm] = useState({
//     vehicleType: 'taxi',
//     numberPlate: '',
//     make: '',
//     model: '',
//     year: '',
//     color: 'white',
//     seatingCapacity: '',
//     insuranceExpiryDate: '',
//     driverId: '',
//     assignAccountType: '', // 'driver' | 'delivery'
//   });

//   // ── Make/model/year data (mirrored from register driver page) ─────────────
//   const [makesAndModels, setMakesAndModels] = useState({});
//   const [makesList, setMakesList] = useState([]);
//   const [modelsList, setModelsList] = useState([]);
//   const [years, setYears] = useState([]);

//   const [drivers, setDrivers] = useState([]);
//   const [saving, setSaving] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await getVehicles(search || undefined);
//       setVehicles(res?.data ?? []);
//     } catch (e) {
//       setError(e.message || 'Failed to load vehicles');
//     } finally {
//       setLoading(false);
//     }
//   }, [search]);

//   useEffect(() => { load(); }, [load]);

//   // Load years and drivers when dialog opens
//   useEffect(() => {
//     if (!addOpen) return;
//     getAllowedVehicleYears().then(y => {
//       const cur = new Date().getFullYear();
//       const sorted = [...y].sort((a, b) => parseInt(a) - parseInt(b));
//       const last = parseInt(sorted[sorted.length - 1] ?? cur);
//       const extended = last >= cur
//         ? sorted
//         : [...sorted, ...Array.from({ length: cur - last + 1 }, (_, i) => String(last + i + 1))];
//       setYears(extended);
//     });
//     getDrivers({ pageSize: 100 }).then(r => setDrivers(r?.data ?? []));
//   }, [addOpen]);

//   // Reload makes/models when vehicleType changes
//   useEffect(() => {
//     if (!addOpen) return;
//     const isMotorbike = form.vehicleType === 'motorbike' || form.vehicleType === 'motorcycle';
//     getVehicleMakesAndModels(isMotorbike ? 'motorbike' : undefined).then(mm => {
//       setMakesAndModels(mm);
//       setMakesList(Object.keys(mm));
//       setForm(f => ({ ...f, make: '', model: '' }));
//     });
//   }, [form.vehicleType, addOpen]); // eslint-disable-line react-hooks/exhaustive-deps

//   // Update models list when make changes
//   useEffect(() => {
//     setModelsList(form.make && makesAndModels[form.make] ? makesAndModels[form.make] : []);
//   }, [form.make, makesAndModels]);

//   const resetForm = () => setForm({
//     vehicleType: 'taxi', numberPlate: '', make: '', model: '',
//     year: '', color: 'white', seatingCapacity: '', insuranceExpiryDate: '',
//     driverId: '', assignAccountType: '',
//   });

//   const handleAdd = async () => {
//     if (!form.numberPlate || !form.make || !form.model) {
//       setToast({ msg: 'Number plate, make and model are required', severity: 'error' });
//       return;
//     }
//     if (form.driverId && !form.assignAccountType) {
//       setToast({ msg: 'Please choose which account to assign the vehicle to', severity: 'error' });
//       return;
//     }

//     setSaving(true);
//     try {
//       // Step 1: Create the vehicle
//       const vehiclePayload = {
//         data: {
//           vehicleType: form.vehicleType,
//           numberPlate: form.numberPlate.toUpperCase(),
//           make: form.make,
//           model: form.model,
//           year: form.year ? parseInt(form.year) : undefined,
//           color: form.color || undefined,
//           seatingCapacity: form.seatingCapacity ? parseInt(form.seatingCapacity) : undefined,
//           insuranceExpiryDate: form.insuranceExpiryDate || undefined,
//         },
//       };

//       const created = await apiClient.post('/vehicles', vehiclePayload);
//       // Strapi v4 returns { data: { id, attributes } } or flat { id, ... }
//       const newVehicleId = created?.data?.id ?? created?.id;

//       if (!newVehicleId) throw new Error('Vehicle created but no ID returned');

//       // Step 2: Assign to driver account if a driver was selected
//       if (form.driverId && form.assignAccountType) {
//         const assignEndpoint =
//           form.assignAccountType === 'delivery'
//             ? '/delivery-driver/assign-vehicle'
//             : '/driver/assign-vehicle';

//         await apiClient.post(assignEndpoint, {
//           driverId: parseInt(form.driverId),
//           vehicleId: newVehicleId,
//         });
//       }

//       setAddOpen(false);
//       resetForm();
//       setToast({ msg: 'Vehicle added successfully!', severity: 'success' });
//       load();
//     } catch (e) {
//       setToast({ msg: e.message || 'Failed to add vehicle', severity: 'error' });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleUnassignClick = (vehicle) => setUnassignTarget(vehicle);

//   const handleUnassignConfirm = async () => {
//     if (!unassignTarget) return;
//     setUnassigning(true);
//     try {
//       await unassignVehicleRequest(unassignTarget.id);
//       setToast({ msg: `${unassignTarget.numberPlate} unassigned successfully`, severity: 'success' });
//       setUnassignTarget(null);
//       load();
//     } catch (e) {
//       setToast({ msg: e.message || 'Failed to unassign vehicle', severity: 'error' });
//     } finally {
//       setUnassigning(false);
//     }
//   };

//   const selectedDriver = drivers.find(d => String(d.id) === String(form.driverId)) ?? null;

//   return (
//     <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
//       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Fleet Vehicles</Typography>
//           <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{vehicles.length} vehicles registered</Typography>
//         </Box>
//         <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
//           Add Vehicle
//         </Button>
//       </Box>

//       {toast && <Alert severity={toast.severity} sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setToast(null)}>{toast.msg}</Alert>}
//       {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError(null)}>{error}</Alert>}

//       <TextField placeholder="Search by plate, make, model…" value={search}
//         onChange={e => setSearch(e.target.value)} size="small" sx={{ mb: 3, maxWidth: 360, width: '100%' }} />

//       <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell>Plate</TableCell>
//               <TableCell>Make / Model / Year</TableCell>
//               <TableCell>Color</TableCell>
//               <TableCell>Assigned Driver</TableCell>
//               <TableCell>Insurance</TableCell>
//               <TableCell>Verification</TableCell>
//               <TableCell>Actions</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {loading ? (
//               <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
//             ) : vehicles.length === 0 ? (
//               <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No vehicles found</TableCell></TableRow>
//             ) : (
//               vehicles.map((v) => {
//                 const ins = getInsuranceChipProps(v.insuranceExpiryDate);
//                 const colorObj = getColorByKey(v.color?.toLowerCase() ?? '');
//                 return (
//                   <TableRow key={v.id} hover>
//                     <TableCell>
//                       <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, letterSpacing: 2, fontSize: '0.95rem', color: '#F59E0B' }}>
//                         {v.numberPlate}
//                       </Typography>
//                     </TableCell>
//                     <TableCell sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
//                       {v.make} {v.model} · {v.year}
//                     </TableCell>
//                     <TableCell>
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: colorObj?.body ?? '#ccc', border: `1px solid ${colorObj?.outline ?? '#999'}` }} />
//                         <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{v.color}</Typography>
//                       </Box>
//                     </TableCell>
//                     <TableCell>
//                       {v.assignedDriver ? (
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                           <Avatar sx={{ width: 24, height: 24, bgcolor: '#059669', fontSize: '0.7rem', fontWeight: 700 }}>
//                             {v.assignedDriver.firstName?.[0]}
//                           </Avatar>
//                           <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
//                             {v.assignedDriver.firstName} {v.assignedDriver.lastName}
//                           </Typography>
//                         </Box>
//                       ) : (
//                         <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Unassigned</Typography>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <Chip label={ins.label} color={ins.color} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         label={v.verificationStatus?.toUpperCase()}
//                         size="small"
//                         color={v.verificationStatus === 'approved' ? 'success' : v.verificationStatus === 'pending' ? 'warning' : 'error'}
//                         variant="outlined"
//                         sx={{ fontWeight: 700, fontSize: '0.6rem' }}
//                       />
//                     </TableCell>
//                     <TableCell>
//                       {v.assignedDriver && (
//                         <IconButton size="small" onClick={() => handleUnassignClick(v)} sx={{ color: '#F59E0B' }} title="Unassign driver">
//                           <UnassignIcon fontSize="small" />
//                         </IconButton>
//                       )}
//                     </TableCell>
//                   </TableRow>
//                 );
//               })
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* ── Add vehicle dialog ────────────────────────────────────────────── */}
//       <Dialog
//         open={addOpen}
//         onClose={() => { setAddOpen(false); resetForm(); }}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', backgroundImage: 'none' } }}
//       >
//         <DialogTitle sx={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//           Add Vehicle
//           <IconButton size="small" onClick={() => { setAddOpen(false); resetForm(); }} sx={{ color: 'rgba(255,255,255,0.4)' }}>
//             <CloseIcon fontSize="small" />
//           </IconButton>
//         </DialogTitle>

//         <DialogContent>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>

//             {/* Row 1: Vehicle Type + Number Plate */}
//             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, '& > *': { minWidth: 0 } }}>
//               <FormControl fullWidth sx={fieldSx}>
//                 <InputLabel>Vehicle Type</InputLabel>
//                 <Select
//                   value={form.vehicleType}
//                   label="Vehicle Type"
//                   onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
//                   {VEHICLE_TYPES.map(t => (
//                     <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//               <TextField
//                 fullWidth label="Number Plate *"
//                 value={form.numberPlate}
//                 onChange={e => setForm(f => ({ ...f, numberPlate: e.target.value.toUpperCase() }))}
//                 sx={monoSx}
//               />
//             </Box>

//             {/* Row 2: Make + Model (with Autocomplete + custom add) */}
//             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, '& > *': { minWidth: 0 } }}>
//               <Box>
//                 <Autocomplete
//                   fullWidth
//                   freeSolo
//                   options={makesList}
//                   value={form.make}
//                   onChange={(_, v) => setForm(f => ({ ...f, make: v ?? '', model: '' }))}
//                   onInputChange={(_, v) => setForm(f => ({ ...f, make: v, model: '' }))}
//                   renderInput={params => (
//                     <TextField {...params} label="Make *" placeholder="e.g., Toyota" sx={fieldSx} />
//                   )}
//                 />
//                 <Button
//                   size="small" variant="text"
//                   startIcon={<AddNewIcon sx={{ fontSize: 14 }} />}
//                   onClick={() => setAddMakeModelOpen(true)}
//                   sx={{ mt: 0.5, color: '#A78BFA', fontWeight: 600, fontSize: '0.72rem', textTransform: 'none', px: 0.5 }}
//                 >
//                   Add name if not in list
//                 </Button>
//               </Box>
//               <Autocomplete
//                 fullWidth
//                 freeSolo
//                 options={modelsList}
//                 value={form.model}
//                 onChange={(_, v) => setForm(f => ({ ...f, model: v ?? '' }))}
//                 onInputChange={(_, v) => setForm(f => ({ ...f, model: v }))}
//                 disabled={!form.make}
//                 renderInput={params => (
//                   <TextField {...params} label="Model *" placeholder="e.g., Corolla" sx={fieldSx} />
//                 )}
//               />
//             </Box>

//             {/* Row 3: Year + Seating Capacity + Insurance Expiry */}
//             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, '& > *': { minWidth: 0 } }}>
//               <FormControl fullWidth sx={fieldSx}>
//                 <InputLabel>Year</InputLabel>
//                 <Select
//                   value={form.year}
//                   label="Year"
//                   onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
//                   {[...years].reverse().map(y => (
//                     <MenuItem key={y} value={y}>{y}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//               <TextField
//                 fullWidth label="Seats"
//                 type="number"
//                 value={form.seatingCapacity}
//                 onChange={e => setForm(f => ({ ...f, seatingCapacity: e.target.value }))}
//                 inputProps={{ min: 1, max: 50 }}
//                 sx={fieldSx}
//               />
//               <TextField
//                 fullWidth label="Insurance Expiry"
//                 type="date"
//                 value={form.insuranceExpiryDate}
//                 onChange={e => setForm(f => ({ ...f, insuranceExpiryDate: e.target.value }))}
//                 InputLabelProps={{ shrink: true }}
//                 sx={fieldSx}
//               />
//             </Box>

//             {/* Row 4: Color */}
//             <VehicleColorPicker
//               value={form.color}
//               onChange={c => setForm(f => ({ ...f, color: c }))}
//             />

//             {/* Divider */}
//             <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.07)', pt: 1 }}>
//               <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, mb: 2 }}>
//                 Driver Assignment
//               </Typography>

//               <FormControl fullWidth sx={{ ...fieldSx, mb: 2 }}>
//                 <InputLabel>Select Driver *</InputLabel>
//                 <Select
//                   value={form.driverId}
//                   label="Select Driver *"
//                   onChange={e => setForm(f => ({ ...f, driverId: e.target.value, assignAccountType: '' }))}>
//                   {drivers.map(d => (
//                     <MenuItem key={d.id} value={d.id}>
//                       {d.firstName} {d.lastName} · {d.phoneNumber}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//               {/* Row 6: Account type selector — only shown when a driver is selected */}
//               {form.driverId && (
//                 <Box
//                   sx={{
//                     p: 2, borderRadius: 2.5,
//                     border: '1px solid rgba(255,255,255,0.08)',
//                     background: 'rgba(255,255,255,0.025)',
//                   }}
//                 >
//                   <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', mb: 1.5 }}>
//                     Assign vehicle to
//                     {selectedDriver && (
//                       <Box component="span" sx={{ color: '#fff', ml: 0.75 }}>
//                         {selectedDriver.firstName} {selectedDriver.lastName}'s
//                       </Box>
//                     )}
//                     :
//                   </Typography>
//                   <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, '& > *': { minWidth: 0 } }}>
//                     {/* Ride Driver account */}
//                     <Paper
//                       elevation={0}
//                       onClick={() => setForm(f => ({ ...f, assignAccountType: 'driver' }))}
//                       sx={{
//                         p: 2, borderRadius: 2.5, cursor: 'pointer',
//                         border: `2px solid ${form.assignAccountType === 'driver' ? '#10B981' : 'rgba(16,185,129,0.25)'}`,
//                         background: form.assignAccountType === 'driver' ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.04)',
//                         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
//                         transition: 'all 0.18s ease',
//                         '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.1)', transform: 'translateY(-1px)' },
//                       }}
//                     >
//                       <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.85rem', textAlign: 'center' }}>
//                         Driver Account
//                       </Typography>
//                       <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
//                         Taxi, Bus &amp; Motorbike ride driver
//                       </Typography>
//                     </Paper>

//                     {/* Courier account */}
//                     <Paper
//                       elevation={0}
//                       onClick={() => setForm(f => ({ ...f, assignAccountType: 'delivery' }))}
//                       sx={{
//                         p: 2, borderRadius: 2.5, cursor: 'pointer',
//                         border: `2px solid ${form.assignAccountType === 'delivery' ? '#F59E0B' : 'rgba(245,158,11,0.25)'}`,
//                         background: form.assignAccountType === 'delivery' ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.04)',
//                         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
//                         transition: 'all 0.18s ease',
//                         '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.1)', transform: 'translateY(-1px)' },
//                       }}
//                     >
//                       <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.85rem', textAlign: 'center' }}>
//                         Courier Account
//                       </Typography>
//                       <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
//                         Motorbike, Car &amp; Truck courier
//                       </Typography>
//                     </Paper>
//                   </Box>

//                   {form.driverId && !form.assignAccountType && (
//                     <Typography sx={{ mt: 1.25, fontSize: '0.72rem', color: '#F59E0B' }}>
//                       Select an account type above to assign this vehicle
//                     </Typography>
//                   )}
//                 </Box>
//               )}
//             </Box>
//           </Box>
//         </DialogContent>

//         <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
//           <Button
//             onClick={() => { setAddOpen(false); resetForm(); }}
//             variant="outlined"
//             sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleAdd}
//             disabled={
//               !form.numberPlate ||
//               !form.make ||
//               !form.model ||
//               !form.driverId ||
//               !form.assignAccountType ||
//               saving
//             }
//             variant="contained"
//             sx={{ flex: 2, borderRadius: 2.5, fontWeight: 700, height: 48 }}
//           >
//             {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Add Vehicle'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Unassign confirmation modal */}
//       <UnassignConfirmModal
//         open={!!unassignTarget}
//         vehicle={unassignTarget}
//         loading={unassigning}
//         onClose={() => { if (!unassigning) setUnassignTarget(null); }}
//         onConfirm={handleUnassignConfirm}
//       />

//       {/* Add custom make/model modal */}
//       <AddMakeModelModal
//         open={addMakeModelOpen}
//         onClose={() => setAddMakeModelOpen(false)}
//         onConfirm={(make, model) => {
//           setMakesList(prev => prev.includes(make) ? prev : [...prev, make]);
//           setForm(f => ({ ...f, make, model }));
//         }}
//       />
//     </Box>
//   );
// }
// PATH: app/partner/vehicles/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl,
  InputLabel, Autocomplete, Alert, CircularProgress, IconButton, Avatar,
  Modal, Fade, Backdrop,
} from '@mui/material';
import {
  Add as AddIcon, LinkOff as UnassignIcon,
  Add as AddNewIcon, Close as CloseIcon, Edit as EditIcon,
} from '@mui/icons-material';
import { getVehicles, getDrivers } from '@/lib/api/partner';
import { getVehicleMakesAndModels, getAllowedVehicleYears } from '@/lib/api/vehicles';
import { getInsuranceChipProps } from '@/lib/utils/format';
import { VEHICLE_TYPES, getColorByKey } from '@/constants';
import { VehicleColorPicker } from '@/components/ui/VehicleColorPicker';
import { apiClient } from '@/lib/api/client';

async function unassignVehicleRequest(vehicleId) {
  const res = await apiClient.put(`/vehicles/${vehicleId}`, { data: { assignedDriver: null } });
  if (!res) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Failed to unassign vehicle (${res.status})`);
  }
  return res;
}

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
            <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Vehicle Make" value={customMake} onChange={e => setCustomMake(e.target.value)}
              placeholder="e.g., Kia, Chery, BYD" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} autoFocus />
            <TextField fullWidth label="Vehicle Model" value={customModel} onChange={e => setCustomModel(e.target.value)}
              placeholder="e.g., Sportage, Tiggo, Atto" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()} />
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

function UnassignConfirmModal({ vehicle, open, onClose, onConfirm, loading }) {
  if (!vehicle) return null;
  const driverName = vehicle.assignedDriver
    ? `${vehicle.assignedDriver.firstName ?? ''} ${vehicle.assignedDriver.lastName ?? ''}`.trim()
    : 'this driver';
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose}
      PaperProps={{ sx: { borderRadius: 3.5, bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', backgroundImage: 'none', maxWidth: 380, width: '100%' } }}>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>Unassign Vehicle?</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          This will remove{' '}
          <Box component="span" sx={{ color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{vehicle.numberPlate}</Box>{' '}
          from <Box component="span" sx={{ color: '#fff', fontWeight: 600 }}>{driverName}</Box>.
          The vehicle will become unassigned and available to reassign.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined"
          sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained" color="warning"
          sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700, height: 42 }}>
          {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Unassign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2.5 } };
const monoSx = { '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: 1 } };

const EMPTY_FORM = {
  vehicleType: 'taxi', numberPlate: '', make: '', model: '',
  year: '', color: 'white', seatingCapacity: '', insuranceExpiryDate: '',
  driverId: '', assignAccountType: '',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null); // null = add mode, vehicle obj = edit mode
  const [toast, setToast] = useState(null);
  const [addMakeModelOpen, setAddMakeModelOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState(null);
  const [unassigning, setUnassigning] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [makesAndModels, setMakesAndModels] = useState({});
  const [makesList, setMakesList] = useState([]);
  const [modelsList, setModelsList] = useState([]);
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

  // Load supporting data whenever the modal opens
  useEffect(() => {
    if (!modalOpen) return;
    getAllowedVehicleYears().then(y => {
      const cur = new Date().getFullYear();
      const sorted = [...y].sort((a, b) => parseInt(a) - parseInt(b));
      const last = parseInt(sorted[sorted.length - 1] ?? cur);
      const extended = last >= cur
        ? sorted
        : [...sorted, ...Array.from({ length: cur - last + 1 }, (_, i) => String(last + i + 1))];
      setYears(extended);
    });
    getDrivers({ pageSize: 100 }).then(r => setDrivers(r?.data ?? []));
  }, [modalOpen]);

  // Reload makes when vehicleType changes
  useEffect(() => {
    if (!modalOpen) return;
    const isMotorbike = form.vehicleType === 'motorbike' || form.vehicleType === 'motorcycle';
    getVehicleMakesAndModels(isMotorbike ? 'motorbike' : undefined).then(mm => {
      setMakesAndModels(mm);
      setMakesList(Object.keys(mm));
      // Only reset make/model when changing type in add mode (not on initial edit load)
      if (!editingVehicle) {
        setForm(f => ({ ...f, make: '', model: '' }));
      }
    });
  }, [form.vehicleType, modalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload models when make changes
  useEffect(() => {
    setModelsList(form.make && makesAndModels[form.make] ? makesAndModels[form.make] : []);
  }, [form.make, makesAndModels]);

  // ── Open in ADD mode ──────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  // ── Open in EDIT mode — pre-populate from vehicle row ────────────────────
  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      vehicleType: vehicle.vehicleType ?? 'taxi',
      numberPlate: vehicle.numberPlate ?? '',
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year ? String(vehicle.year) : '',
      color: vehicle.color ?? 'white',
      seatingCapacity: vehicle.seatingCapacity ? String(vehicle.seatingCapacity) : '',
      insuranceExpiryDate: vehicle.insuranceExpiryDate ?? '',
      // Pre-fill driver but leave account type blank — user must explicitly choose if they want to reassign
      driverId: vehicle.assignedDriver?.id ? String(vehicle.assignedDriver.id) : '',
      assignAccountType: '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
  };

  // ── Unified save: POST (add) or PUT (edit) ────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const vehiclePayload = {
        data: {
          vehicleType: form.vehicleType,
          numberPlate: form.numberPlate.toUpperCase(),
          make: form.make,
          model: form.model,
          year: form.year ? parseInt(form.year) : undefined,
          color: form.color || undefined,
          seatingCapacity: form.seatingCapacity ? parseInt(form.seatingCapacity) : undefined,
          insuranceExpiryDate: form.insuranceExpiryDate || undefined,
        },
      };

      let vehicleId;

      if (editingVehicle) {
        // ── EDIT: PUT ───────────────────────────────────────────────────────
        await apiClient.put(`/vehicles/${editingVehicle.id}`, vehiclePayload);
        vehicleId = editingVehicle.id;
      } else {
        // ── ADD: POST ───────────────────────────────────────────────────────
        const created = await apiClient.post('/vehicles', vehiclePayload);
        vehicleId = created?.data?.id ?? created?.id;
        if (!vehicleId) throw new Error('Vehicle created but no ID returned');
      }

      // ── Assign to driver account if driver + account type both chosen ─────
      if (form.driverId && form.assignAccountType) {
        const assignEndpoint =
          form.assignAccountType === 'delivery'
            ? '/delivery-driver/assign-vehicle'
            : '/driver/assign-vehicle';

        await apiClient.post(assignEndpoint, {
          driverId: parseInt(form.driverId),
          vehicleId,
        });
      }

      closeModal();
      setToast({ msg: editingVehicle ? 'Vehicle updated successfully!' : 'Vehicle added successfully!', severity: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.message || 'Failed to save vehicle', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignClick = (vehicle) => setUnassignTarget(vehicle);
  const handleUnassignConfirm = async () => {
    if (!unassignTarget) return;
    setUnassigning(true);
    try {
      await unassignVehicleRequest(unassignTarget.id);
      setToast({ msg: `${unassignTarget.numberPlate} unassigned successfully`, severity: 'success' });
      setUnassignTarget(null);
      load();
    } catch (e) {
      setToast({ msg: e.message || 'Failed to unassign vehicle', severity: 'error' });
    } finally {
      setUnassigning(false);
    }
  };

  const isEditing = !!editingVehicle;
  const selectedDriver = drivers.find(d => String(d.id) === String(form.driverId)) ?? null;

  // Add mode: all required fields + driver + account type must be set
  // Edit mode: only vehicle fields required; driver+accountType optional (only runs assign if both set)
  const isSaveDisabled =
    !form.numberPlate || !form.make || !form.model || saving ||
    (!isEditing && (!form.driverId || !form.assignAccountType)) ||
    (isEditing && !!form.driverId && !!form.assignAccountType === false && form.driverId !== String(editingVehicle?.assignedDriver?.id ?? ''));

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Fleet Vehicles</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{vehicles.length} vehicles registered</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
          Add Vehicle
        </Button>
      </Box>

      {toast && <Alert severity={toast.severity} sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setToast(null)}>{toast.msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setError(null)}>{error}</Alert>}

      <TextField placeholder="Search by plate, make, model…" value={search}
        onChange={e => setSearch(e.target.value)} size="small" sx={{ mb: 3, maxWidth: 360, width: '100%' }} />

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plate</TableCell>
              <TableCell>Make / Model / Year</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Assigned Driver</TableCell>
              <TableCell>Insurance</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No vehicles found</TableCell></TableRow>
            ) : (
              vehicles.map((v) => {
                const ins = getInsuranceChipProps(v.insuranceExpiryDate);
                const colorObj = getColorByKey(v.color?.toLowerCase() ?? '');
                return (
                  <TableRow key={v.id} hover>
                    <TableCell>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, letterSpacing: 2, fontSize: '0.95rem', color: '#F59E0B' }}>
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
                    <TableCell>
                      <Chip label={ins.label} color={ins.color} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openEditModal(v)} sx={{ color: '#A78BFA' }} title="Edit vehicle">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {v.assignedDriver && (
                          <IconButton size="small" onClick={() => handleUnassignClick(v)} sx={{ color: '#F59E0B' }} title="Unassign driver">
                            <UnassignIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Add / Edit vehicle dialog ─────────────────────────────────────── */}
      <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isEditing ? 'Edit Vehicle' : 'Add Vehicle'}
          <IconButton size="small" onClick={closeModal} sx={{ color: 'rgba(255,255,255,0.4)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>

            {/* Row 1: Vehicle Type + Number Plate */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, '& > *': { minWidth: 0 } }}>
              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Vehicle Type</InputLabel>
                <Select value={form.vehicleType} label="Vehicle Type"
                  onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
                  {VEHICLE_TYPES.map(t => (
                    <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField fullWidth label="Number Plate *" value={form.numberPlate}
                onChange={e => setForm(f => ({ ...f, numberPlate: e.target.value.toUpperCase() }))}
                sx={monoSx} />
            </Box>

            {/* Row 2: Make + Model */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, '& > *': { minWidth: 0 } }}>
              <Box>
                <Autocomplete fullWidth freeSolo options={makesList} value={form.make}
                  onChange={(_, v) => setForm(f => ({ ...f, make: v ?? '', model: '' }))}
                  onInputChange={(_, v) => setForm(f => ({ ...f, make: v, model: '' }))}
                  renderInput={params => <TextField {...params} label="Make *" placeholder="e.g., Toyota" sx={fieldSx} />}
                />
                <Button size="small" variant="text" startIcon={<AddNewIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setAddMakeModelOpen(true)}
                  sx={{ mt: 0.5, color: '#A78BFA', fontWeight: 600, fontSize: '0.72rem', textTransform: 'none', px: 0.5 }}>
                  Add name if not in list
                </Button>
              </Box>
              <Autocomplete fullWidth freeSolo options={modelsList} value={form.model}
                onChange={(_, v) => setForm(f => ({ ...f, model: v ?? '' }))}
                onInputChange={(_, v) => setForm(f => ({ ...f, model: v }))}
                disabled={!form.make}
                renderInput={params => <TextField {...params} label="Model *" placeholder="e.g., Corolla" sx={fieldSx} />}
              />
            </Box>

            {/* Row 3: Year + Seats + Insurance */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, '& > *': { minWidth: 0 } }}>
              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Year</InputLabel>
                <Select value={form.year} label="Year"
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                  {[...years].reverse().map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth label="Seats" type="number" value={form.seatingCapacity}
                onChange={e => setForm(f => ({ ...f, seatingCapacity: e.target.value }))}
                inputProps={{ min: 1, max: 50 }} sx={fieldSx} />
              <TextField fullWidth label="Insurance Expiry" type="date" value={form.insuranceExpiryDate}
                onChange={e => setForm(f => ({ ...f, insuranceExpiryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Box>

            {/* Row 4: Color */}
            <VehicleColorPicker value={form.color} onChange={c => setForm(f => ({ ...f, color: c }))} />

            {/* Driver assignment section */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.07)', pt: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, mb: 2 }}>
                {isEditing ? 'Driver Assignment' : 'Driver Assignment *'}
              </Typography>

              <FormControl fullWidth sx={{ ...fieldSx, mb: 2 }}>
                <InputLabel>{isEditing ? 'Assigned Driver' : 'Select Driver *'}</InputLabel>
                <Select value={form.driverId} label={isEditing ? 'Assigned Driver' : 'Select Driver *'}
                  onChange={e => setForm(f => ({ ...f, driverId: e.target.value, assignAccountType: '' }))}>
                  {isEditing && <MenuItem value="">— Remove Assignment —</MenuItem>}
                  {drivers.map(d => (
                    <MenuItem key={d.id} value={String(d.id)}>
                      {d.firstName} {d.lastName} · {d.phoneNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Account type picker — shown in add mode always, in edit mode only when driver is set */}
              {form.driverId && (
                <Box sx={{ p: 2, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)' }}>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', mb: 1.5 }}>
                    Assign vehicle to
                    {selectedDriver && (
                      <Box component="span" sx={{ color: '#fff', ml: 0.75 }}>
                        {selectedDriver.firstName} {selectedDriver.lastName}'s
                      </Box>
                    )}
                    :
                    {isEditing && (
                      <Box component="span" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400, ml: 0.5 }}>
                        (optional — only needed to reassign)
                      </Box>
                    )}
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, '& > *': { minWidth: 0 } }}>
                    <Paper elevation={0} onClick={() => setForm(f => ({ ...f, assignAccountType: 'driver' }))}
                      sx={{
                        p: 2, borderRadius: 2.5, cursor: 'pointer',
                        border: `2px solid ${form.assignAccountType === 'driver' ? '#10B981' : 'rgba(16,185,129,0.25)'}`,
                        background: form.assignAccountType === 'driver' ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.04)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        transition: 'all 0.18s ease',
                        '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.1)', transform: 'translateY(-1px)' },
                      }}>
                      <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.85rem', textAlign: 'center' }}>Driver Account</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Taxi, Bus &amp; Motorbike ride driver</Typography>
                    </Paper>

                    <Paper elevation={0} onClick={() => setForm(f => ({ ...f, assignAccountType: 'delivery' }))}
                      sx={{
                        p: 2, borderRadius: 2.5, cursor: 'pointer',
                        border: `2px solid ${form.assignAccountType === 'delivery' ? '#F59E0B' : 'rgba(245,158,11,0.25)'}`,
                        background: form.assignAccountType === 'delivery' ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.04)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        transition: 'all 0.18s ease',
                        '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.1)', transform: 'translateY(-1px)' },
                      }}>
                      <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.85rem', textAlign: 'center' }}>Courier Account</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Motorbike, Car &amp; Truck courier</Typography>
                    </Paper>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={closeModal} variant="outlined"
            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600, borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !form.numberPlate || !form.make || !form.model || saving ||
              // Add mode: driver + account type required
              (!isEditing && (!form.driverId || !form.assignAccountType))
            }
            variant="contained"
            sx={{ flex: 2, borderRadius: 2.5, fontWeight: 700, height: 48 }}
          >
            {saving
              ? <CircularProgress size={18} sx={{ color: '#fff' }} />
              : isEditing ? 'Save Changes' : 'Add Vehicle'
            }
          </Button>
        </DialogActions>
      </Dialog>

      <UnassignConfirmModal
        open={!!unassignTarget} vehicle={unassignTarget} loading={unassigning}
        onClose={() => { if (!unassigning) setUnassignTarget(null); }}
        onConfirm={handleUnassignConfirm}
      />

      <AddMakeModelModal
        open={addMakeModelOpen}
        onClose={() => setAddMakeModelOpen(false)}
        onConfirm={(make, model) => {
          setMakesList(prev => prev.includes(make) ? prev : [...prev, make]);
          setForm(f => ({ ...f, make, model }));
        }}
      />
    </Box>
  );
}