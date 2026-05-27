// // 'use client';
// // // PATH: app/partner/drivers/page.js

// // import { useState, useEffect, useCallback } from 'react';
// // import {
// //   Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
// //   Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
// //   Avatar, Chip, IconButton, Alert, Skeleton, useMediaQuery, useTheme, CircularProgress,
// //   Dialog, DialogTitle, DialogContent, DialogActions,
// // } from '@mui/material';
// // import {
// //   PersonAdd as PersonAddIcon, Visibility as ViewIcon,
// //   Phone as PhoneIcon, WhatsApp as WaIcon, Edit as EditIcon,
// //   DirectionsCar as CarIcon, LocalShipping as DeliveryIcon,
// //   Close as CloseIcon,
// // } from '@mui/icons-material';
// // import { alpha } from '@mui/material/styles';
// // import { useRouter } from 'next/navigation';
// // import { getDrivers } from '@/lib/api/partner';
// // import { getPhoneDigits, getFloatColor } from '@/lib/utils/format';
// // import { STATUS_CHIP_COLOR } from '@/constants';
// // import FloatModal from '@/components/partner/FloatModal';
// // import { usePartner } from '@/lib/hooks/usePartner';
// // import { motion } from 'framer-motion';

// // // ─── Register driver type modal ───────────────────────────────────────────────
// // function RegisterDriverTypeModal({ open, onClose, onSelect }) {
// //   return (
// //     <Dialog
// //       open={open}
// //       onClose={onClose}
// //       PaperProps={{
// //         sx: {
// //           borderRadius: 3.5,
// //           bgcolor: '#0f172a',
// //           border: '1px solid rgba(255,255,255,0.1)',
// //           backgroundImage: 'none',
// //           maxWidth: 400,
// //           width: '100%',
// //         },
// //       }}
// //     >
// //       <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
// //         <Box>
// //           <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
// //             Register New Driver
// //           </Typography>
// //           <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
// //             Choose the type of driver account to create
// //           </Typography>
// //         </Box>
// //         <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
// //           <CloseIcon fontSize="small" />
// //         </IconButton>
// //       </DialogTitle>

// //       <DialogContent sx={{ pb: 1 }}>
// //         <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 2.5 }}>
// //           Basic info and documents are shared. Vehicle details differ by driver type.
// //         </Typography>
// //         <Box sx={{ display: 'flex', gap: 2 }}>
// //           {/* Ride Driver */}
// //           <Paper
// //             elevation={0}
// //             onClick={() => onSelect('driver')}
// //             sx={{
// //               flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
// //               border: '2px solid rgba(16,185,129,0.3)',
// //               background: 'rgba(16,185,129,0.06)',
// //               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
// //               transition: 'all 0.2s ease',
// //               '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.12)', transform: 'translateY(-2px)' },
// //             }}
// //           >
// //             <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// //               <CarIcon sx={{ color: '#10B981', fontSize: 26 }} />
// //             </Box>
// //             <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem', textAlign: 'center' }}>
// //               Ride Driver
// //             </Typography>
// //             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
// //               Taxi, Bus &amp; Motorbike ride driver
// //             </Typography>
// //           </Paper>

// //           {/* Courier */}
// //           <Paper
// //             elevation={0}
// //             onClick={() => onSelect('delivery')}
// //             sx={{
// //               flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
// //               border: '2px solid rgba(245,158,11,0.3)',
// //               background: 'rgba(245,158,11,0.06)',
// //               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
// //               transition: 'all 0.2s ease',
// //               '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.12)', transform: 'translateY(-2px)' },
// //             }}
// //           >
// //             <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// //               <DeliveryIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
// //             </Box>
// //             <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem', textAlign: 'center' }}>
// //               Courier
// //             </Typography>
// //             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
// //               Delivery driver (motorbike, car, truck)
// //             </Typography>
// //           </Paper>
// //         </Box>
// //       </DialogContent>

// //       <DialogActions sx={{ px: 3, pb: 2.5 }}>
// //         <Button fullWidth variant="text" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderRadius: 2.5, height: 40 }}>
// //           Cancel
// //         </Button>
// //       </DialogActions>
// //     </Dialog>
// //   );
// // }

// // // ─── Edit driver type selection modal ─────────────────────────────────────────
// // function DriverTypeModal({ driver, open, onClose, onSelect }) {
// //   if (!driver) return null;
// //   return (
// //     <Dialog
// //       open={open}
// //       onClose={onClose}
// //       PaperProps={{
// //         sx: {
// //           borderRadius: 3.5,
// //           bgcolor: '#0f172a',
// //           border: '1px solid rgba(255,255,255,0.1)',
// //           backgroundImage: 'none',
// //           maxWidth: 400,
// //           width: '100%',
// //         },
// //       }}
// //     >
// //       <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
// //         <Box>
// //           <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
// //             Edit Driver&apos;s Account
// //           </Typography>
// //           <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
// //             {driver.firstName} {driver.lastName}
// //           </Typography>
// //         </Box>
// //         <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
// //           <CloseIcon fontSize="small" />
// //         </IconButton>
// //       </DialogTitle>

// //       <DialogContent sx={{ pb: 1 }}>
// //         <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 2.5 }}>
// //           Choose which driver profile to edit. Basic info and documents are shared — only vehicle details differ.
// //         </Typography>
// //         <Box sx={{ display: 'flex', gap: 2 }}>
// //           <Paper
// //             elevation={0}
// //             onClick={() => onSelect('driver')}
// //             sx={{
// //               flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
// //               border: '2px solid rgba(16,185,129,0.3)',
// //               background: 'rgba(16,185,129,0.06)',
// //               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
// //               transition: 'all 0.2s ease',
// //               '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.12)', transform: 'translateY(-2px)' },
// //             }}
// //           >
// //             <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// //               <CarIcon sx={{ color: '#10B981', fontSize: 26 }} />
// //             </Box>
// //             <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem', textAlign: 'center' }}>Driver Account</Typography>
// //             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Taxi, Bus &amp; Motorbike ride driver</Typography>
// //           </Paper>

// //           <Paper
// //             elevation={0}
// //             onClick={() => onSelect('delivery')}
// //             sx={{
// //               flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
// //               border: '2px solid rgba(245,158,11,0.3)',
// //               background: 'rgba(245,158,11,0.06)',
// //               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
// //               transition: 'all 0.2s ease',
// //               '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.12)', transform: 'translateY(-2px)' },
// //             }}
// //           >
// //             <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// //               <DeliveryIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
// //             </Box>
// //             <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem', textAlign: 'center' }}>Courier Account</Typography>
// //             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Motorbike, Car &amp; Truck courier</Typography>
// //           </Paper>
// //         </Box>
// //       </DialogContent>

// //       <DialogActions sx={{ px: 3, pb: 2.5 }}>
// //         <Button fullWidth variant="text" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderRadius: 2.5, height: 40 }}>
// //           Cancel
// //         </Button>
// //       </DialogActions>
// //     </Dialog>
// //   );
// // }

// // // ═════════════════════════════════════════════════════════════════════════════
// // export default function DriversPage() {
// //   const router = useRouter();
// //   const theme = useTheme();
// //   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
// //   const { dashboard, currency } = usePartner();

// //   const [drivers, setDrivers] = useState([]);
// //   const [meta, setMeta] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [search, setSearch] = useState('');
// //   const [status, setStatus] = useState('');
// //   const [page, setPage] = useState(1);
// //   const [floatModal, setFloatModal] = useState(null);
// //   const [editTypeModal, setEditTypeModal] = useState(null);
// //   const [registerTypeModal, setRegisterTypeModal] = useState(false);

// //   const partnerBalance = dashboard?.partnerProfile?.floatBalance ?? 0;

// //   const load = useCallback(async () => {
// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const res = await getDrivers({ search, status, page });
// //       setDrivers(res?.data ?? []);
// //       setMeta(res?.meta?.pagination ?? null);
// //     } catch (e) {
// //       setError(e.message || 'Failed to load drivers');
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [search, status, page]);

// //   useEffect(() => { load(); }, [load]);

// //   const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

// //   const renderStatusChip = (s) => (
// //     <Chip
// //       label={s}
// //       size="small"
// //       color={STATUS_CHIP_COLOR[s] ?? 'default'}
// //       variant={['OFFLINE', 'PENDING'].includes(s) ? 'outlined' : 'filled'}
// //       sx={{ fontWeight: 700, fontSize: '0.65rem' }}
// //     />
// //   );

// //   const handleEditClick = (driver) => setEditTypeModal(driver);

// //   const handleDriverTypeSelect = (driverType) => {
// //     if (!editTypeModal) return;
// //     setEditTypeModal(null);
// //     router.push(`drivers/${editTypeModal.id}/edit?driverType=${driverType}`);
// //   };

// //   const handleRegisterTypeSelect = (type) => {
// //     setRegisterTypeModal(false);
// //     if (type === 'driver') router.push('drivers/register');
// //     else router.push('drivers/register/courier');
// //   };

// //   if (loading && drivers.length === 0) {
// //     return (
// //       <Box sx={{ p: 3 }}>
// //         {[...Array(5)].map((_, i) => (
// //           <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 1.5, bgcolor: 'rgba(255,255,255,0.05)' }} />
// //         ))}
// //       </Box>
// //     );
// //   }

// //   return (
// //     <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
// //       {/* Header */}
// //       <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
// //         <Box>
// //           <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Fleet Drivers</Typography>
// //           <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
// //             {drivers.length} drivers registered
// //           </Typography>
// //         </Box>
// //         <Button
// //           variant="contained"
// //           startIcon={<PersonAddIcon />}
// //           onClick={() => setRegisterTypeModal(true)}
// //           sx={{ borderRadius: 2.5, fontWeight: 700 }}
// //         >
// //           Register Driver
// //         </Button>
// //       </Box>

// //       {error && (
// //         <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2.5 }}
// //           action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
// //           {error}
// //         </Alert>
// //       )}

// //       {/* Controls */}
// //       <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
// //         <TextField
// //           placeholder="Search name or phone…"
// //           value={search}
// //           onChange={(e) => { setSearch(e.target.value); setPage(1); }}
// //           size="small"
// //           sx={{ flex: 1, minWidth: 200 }}
// //         />
// //         <FormControl size="small" sx={{ minWidth: 150 }}>
// //           <InputLabel>Status</InputLabel>
// //           <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
// //             <MenuItem value="">All</MenuItem>
// //             {['ONLINE', 'ON_TRIP', 'EN_ROUTE', 'OFFLINE', 'PENDING', 'SUSPENDED'].map((s) => (
// //               <MenuItem key={s} value={s}>{s}</MenuItem>
// //             ))}
// //           </Select>
// //         </FormControl>
// //       </Box>

// //       {/* Desktop table */}
// //       {!isMobile ? (
// //         <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
// //           <Table>
// //             <TableHead>
// //               <TableRow>
// //                 <TableCell>Driver</TableCell>
// //                 <TableCell>Phone</TableCell>
// //                 <TableCell>Status</TableCell>
// //                 <TableCell>Float</TableCell>
// //                 <TableCell>Vehicle</TableCell>
// //                 <TableCell>Actions</TableCell>
// //               </TableRow>
// //             </TableHead>
// //             <TableBody>
// //               {loading ? (
// //                 <TableRow><TableCell colSpan={6}><CircularProgress size={24} /></TableCell></TableRow>
// //               ) : drivers.length === 0 ? (
// //                 <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No drivers found</TableCell></TableRow>
// //               ) : (
// //                 drivers.map((d) => {
// //                   const digits = getPhoneDigits(d.phoneNumber);
// //                   return (
// //                     <TableRow key={d.id} hover sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
// //                       <TableCell>
// //                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
// //                           <Avatar sx={{ width: 32, height: 32, bgcolor: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>
// //                             {d.firstName?.[0]}
// //                           </Avatar>
// //                           <Box>
// //                             <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>
// //                               {d.firstName} {d.lastName}
// //                             </Typography>
// //                             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
// //                               ⭐ {d.averageRating?.toFixed(1)} · {d.completedRides} rides
// //                             </Typography>
// //                           </Box>
// //                         </Box>
// //                       </TableCell>
// //                       <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{d.phoneNumber}</TableCell>
// //                       <TableCell>{renderStatusChip(d.status)}</TableCell>
// //                       <TableCell>
// //                         <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', fontWeight: 700, color: getFloatColor(d.floatBalance) }}>
// //                           K{Number(d.floatBalance).toFixed(2)}
// //                         </Typography>
// //                       </TableCell>
// //                       <TableCell>
// //                         {d.assignedVehicle ? (
// //                           <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#F59E0B', letterSpacing: 1 }}>
// //                             {d.assignedVehicle.numberPlate}
// //                           </Typography>
// //                         ) : (
// //                           <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Unassigned</Typography>
// //                         )}
// //                       </TableCell>
// //                       <TableCell>
// //                         <Box sx={{ display: 'flex', gap: 0.5 }}>
// //                           <IconButton size="small" onClick={() => router.push(`drivers/${d.id}`)} sx={{ color: '#3B82F6' }}>
// //                             <ViewIcon fontSize="small" />
// //                           </IconButton>
// //                           <IconButton size="small" onClick={() => handleEditClick(d)} sx={{ color: '#A78BFA' }}>
// //                             <EditIcon fontSize="small" />
// //                           </IconButton>
// //                           <IconButton size="small" onClick={() => setFloatModal({ driver: d, action: 'CREDIT' })} sx={{ color: '#10B981' }}>
// //                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>💰</Typography>
// //                           </IconButton>
// //                           <IconButton size="small" onClick={() => setFloatModal({ driver: d, action: 'DEBIT' })} sx={{ color: '#F59E0B' }}>
// //                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>➖</Typography>
// //                           </IconButton>
// //                           <IconButton size="small" component="a" href={`tel:${digits}`} sx={{ color: '#10B981' }}>
// //                             <PhoneIcon fontSize="small" />
// //                           </IconButton>
// //                           <IconButton size="small" component="a" href={`https://wa.me/${digits}`} target="_blank" sx={{ color: '#25D366' }}>
// //                             <WaIcon fontSize="small" />
// //                           </IconButton>
// //                         </Box>
// //                       </TableCell>
// //                     </TableRow>
// //                   );
// //                 })
// //               )}
// //             </TableBody>
// //           </Table>
// //         </TableContainer>
// //       ) : (
// //         /* Mobile cards */
// //         <Box>
// //           {drivers.map((d) => {
// //             const digits = getPhoneDigits(d.phoneNumber);
// //             return (
// //               <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
// //                 <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2.5 }} onClick={() => router.push(`drivers/${d.id}`)}>
// //                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
// //                     <Avatar sx={{ width: 40, height: 40, bgcolor: '#059669', fontWeight: 700 }}>
// //                       {d.firstName?.[0]}
// //                     </Avatar>
// //                     <Box sx={{ flex: 1 }}>
// //                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                         <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
// //                           {d.firstName} {d.lastName}
// //                         </Typography>
// //                         {renderStatusChip(d.status)}
// //                       </Box>
// //                       <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
// //                         {d.phoneNumber}
// //                       </Typography>
// //                     </Box>
// //                     <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: getFloatColor(d.floatBalance), fontSize: '0.9rem' }}>
// //                       K{Number(d.floatBalance).toFixed(2)}
// //                     </Typography>
// //                   </Box>
// //                   {d.assignedVehicle && (
// //                     <Typography sx={{ fontSize: '0.75rem', color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", mb: 1.5 }}>
// //                       🚗 {d.assignedVehicle.numberPlate} · {d.assignedVehicle.make} {d.assignedVehicle.model}
// //                     </Typography>
// //                   )}
// //                   <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
// //                     <Button size="small" variant="outlined" onClick={() => handleEditClick(d)}
// //                       sx={{ flex: 1, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700, borderColor: '#A78BFA', color: '#A78BFA' }}>
// //                       ✏️ Edit
// //                     </Button>
// //                     <Button size="small" variant="outlined" color="success" onClick={() => setFloatModal({ driver: d, action: 'CREDIT' })}
// //                       sx={{ flex: 1, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700 }}>
// //                       💰 Float
// //                     </Button>
// //                     <Button size="small" href={`tel:${digits}`} component="a" variant="outlined" sx={{ borderRadius: 2, minWidth: 44, fontWeight: 700 }}>📞</Button>
// //                     <Button size="small" href={`https://wa.me/${digits}`} target="_blank" component="a" variant="outlined"
// //                       sx={{ borderRadius: 2, minWidth: 44, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>💬</Button>
// //                   </Box>
// //                 </Paper>
// //               </motion.div>
// //             );
// //           })}
// //         </Box>
// //       )}

// //       {/* Pagination */}
// //       <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1, alignItems: 'center' }}>
// //         <Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage((p) => p - 1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
// //           Previous
// //         </Button>
// //         <Typography sx={{ display: 'flex', alignItems: 'center', px: 2, color: 'text.secondary', fontSize: '0.85rem' }}>
// //           Page {page} of {totalPages}
// //         </Typography>
// //         <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
// //           Next
// //         </Button>
// //       </Box>

// //       {/* Register driver type modal */}
// //       <RegisterDriverTypeModal
// //         open={registerTypeModal}
// //         onClose={() => setRegisterTypeModal(false)}
// //         onSelect={handleRegisterTypeSelect}
// //       />

// //       {/* Edit driver type modal */}
// //       <DriverTypeModal
// //         open={!!editTypeModal}
// //         driver={editTypeModal}
// //         onClose={() => setEditTypeModal(null)}
// //         onSelect={handleDriverTypeSelect}
// //       />

// //       {/* Float modal */}
// //       {floatModal && (
// //         <FloatModal
// //           open={!!floatModal}
// //           onClose={() => setFloatModal(null)}
// //           driver={floatModal.driver}
// //           partnerFloatBalance={partnerBalance}
// //           defaultAction={floatModal.action}
// //           currency={currency}
// //           onSuccess={() => { setFloatModal(null); load(); }}
// //         />
// //       )}
// //     </Box>
// //   );
// // }
// 'use client';
// // PATH: app/partner/drivers/page.js

// import { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
//   Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
//   Avatar, Chip, IconButton, Alert, Skeleton, useMediaQuery, useTheme, CircularProgress,
//   Dialog, DialogTitle, DialogContent, DialogActions,
// } from '@mui/material';
// import {
//   PersonAdd as PersonAddIcon, Visibility as ViewIcon,
//   Phone as PhoneIcon, WhatsApp as WaIcon, Edit as EditIcon,
//   DirectionsCar as CarIcon, LocalShipping as DeliveryIcon,
//   Close as CloseIcon,
// } from '@mui/icons-material';
// import { alpha } from '@mui/material/styles';
// import { useRouter } from 'next/navigation';
// import { getDrivers } from '@/lib/api/partner';
// import { getPhoneDigits, getFloatColor } from '@/lib/utils/format';
// import { STATUS_CHIP_COLOR } from '@/constants';
// import FloatModal from '@/components/partner/FloatModal';
// import { usePartner } from '@/lib/hooks/usePartner';
// import { motion } from 'framer-motion';

// // ─── Fetch vehicles for a list of driver IDs ──────────────────────────────────
// // Calls GET /api/vehicles?filters[assignedDriver][id][$in][N]=<id>&...
// // Returns a map of { [driverId]: vehicle }
// async function fetchVehiclesByDriverIds(driverIds) {
//   if (!driverIds || driverIds.length === 0) return {};
//   try {
//     const params = new URLSearchParams();
//     driverIds.forEach((id, i) => {
//       params.append(`filters[assignedDriver][id][$in][${i}]`, id);
//     });
//     // Only pull back the fields we actually render
//     ['id', 'numberPlate', 'make', 'model', 'vehicleType', 'color'].forEach((f, i) => {
//       params.append(`fields[${i}]`, f);
//     });
//     // Populate assignedDriver so we can key the map by driver ID
//     params.append('populate[assignedDriver][fields][0]', 'id');

//     const res = await fetch(`/api/vehicles?${params.toString()}`);
//     if (!res.ok) return {};
//     const json = await res.json();

//     // Build driverId → vehicle map
//     const map = {};
//     const vehicles = json?.data ?? json ?? [];
//     vehicles.forEach((v) => {
//       // Support both Strapi v4 (v.attributes) and flat response shapes
//       const vehicle = v?.attributes ? { id: v.id, ...v.attributes } : v;
//       const driverId =
//         vehicle?.assignedDriver?.data?.id ?? // v4 nested
//         vehicle?.assignedDriver?.id ??       // flat
//         vehicle?.assignedDriver;             // bare ID
//       if (driverId) {
//         map[driverId] = vehicle;
//       }
//     });
//     return map;
//   } catch (err) {
//     console.warn('[drivers/page] fetchVehiclesByDriverIds failed:', err);
//     return {};
//   }
// }

// // ─── Backend search: drivers whose partner === current partner + search term ──
// // Calls GET /api/users?filters[partner][id][$eq]=<partnerId>&filters[$or][0][firstName][$containsi]=<q>...
// // Falls back to getDrivers({ search, status, page }) if you already have a
// // server-side helper that handles the partner scope.
// async function searchDriversOnBackend({ search, status, page, partnerId }) {
//   try {
//     // If your existing getDrivers already scopes by partner on the server side,
//     // just call it here. This path is only hit when local results are empty.
//     const res = await getDrivers({ search, status, page });
//     return res?.data ?? [];
//   } catch (err) {
//     console.warn('[drivers/page] searchDriversOnBackend failed:', err);
//     return [];
//   }
// }

// // ─── Local search: filter an already-loaded driver list ──────────────────────
// function filterLocally(drivers, query) {
//   if (!query || !query.trim()) return drivers;
//   const q = query.trim().toLowerCase();
//   return drivers.filter((d) => {
//     const fullName = `${d.firstName ?? ''} ${d.lastName ?? ''}`.toLowerCase();
//     const phone = (d.phoneNumber ?? '').toLowerCase();
//     return fullName.includes(q) || phone.includes(q);
//   });
// }

// // ─── Register driver type modal ───────────────────────────────────────────────
// function RegisterDriverTypeModal({ open, onClose, onSelect }) {
//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       PaperProps={{
//         sx: {
//           borderRadius: 3.5,
//           bgcolor: '#0f172a',
//           border: '1px solid rgba(255,255,255,0.1)',
//           backgroundImage: 'none',
//           maxWidth: 400,
//           width: '100%',
//         },
//       }}
//     >
//       <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Box>
//           <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
//             Register New Driver
//           </Typography>
//           <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
//             Choose the type of driver account to create
//           </Typography>
//         </Box>
//         <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
//           <CloseIcon fontSize="small" />
//         </IconButton>
//       </DialogTitle>

//       <DialogContent sx={{ pb: 1 }}>
//         <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 2.5 }}>
//           Basic info and documents are shared. Vehicle details differ by driver type.
//         </Typography>
//         <Box sx={{ display: 'flex', gap: 2 }}>
//           {/* Ride Driver */}
//           <Paper
//             elevation={0}
//             onClick={() => onSelect('driver')}
//             sx={{
//               flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
//               border: '2px solid rgba(16,185,129,0.3)',
//               background: 'rgba(16,185,129,0.06)',
//               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
//               transition: 'all 0.2s ease',
//               '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.12)', transform: 'translateY(-2px)' },
//             }}
//           >
//             <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <CarIcon sx={{ color: '#10B981', fontSize: 26 }} />
//             </Box>
//             <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem', textAlign: 'center' }}>
//               Ride Driver
//             </Typography>
//             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
//               Taxi, Bus &amp; Motorbike ride driver
//             </Typography>
//           </Paper>

//           {/* Courier */}
//           <Paper
//             elevation={0}
//             onClick={() => onSelect('delivery')}
//             sx={{
//               flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
//               border: '2px solid rgba(245,158,11,0.3)',
//               background: 'rgba(245,158,11,0.06)',
//               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
//               transition: 'all 0.2s ease',
//               '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.12)', transform: 'translateY(-2px)' },
//             }}
//           >
//             <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <DeliveryIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
//             </Box>
//             <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem', textAlign: 'center' }}>
//               Courier
//             </Typography>
//             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
//               Delivery driver (motorbike, car, truck)
//             </Typography>
//           </Paper>
//         </Box>
//       </DialogContent>

//       <DialogActions sx={{ px: 3, pb: 2.5 }}>
//         <Button fullWidth variant="text" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderRadius: 2.5, height: 40 }}>
//           Cancel
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

// // ─── Edit driver type selection modal ─────────────────────────────────────────
// function DriverTypeModal({ driver, open, onClose, onSelect }) {
//   if (!driver) return null;
//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       PaperProps={{
//         sx: {
//           borderRadius: 3.5,
//           bgcolor: '#0f172a',
//           border: '1px solid rgba(255,255,255,0.1)',
//           backgroundImage: 'none',
//           maxWidth: 400,
//           width: '100%',
//         },
//       }}
//     >
//       <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Box>
//           <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
//             Edit Driver&apos;s Account
//           </Typography>
//           <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
//             {driver.firstName} {driver.lastName}
//           </Typography>
//         </Box>
//         <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
//           <CloseIcon fontSize="small" />
//         </IconButton>
//       </DialogTitle>

//       <DialogContent sx={{ pb: 1 }}>
//         <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 2.5 }}>
//           Choose which driver profile to edit. Basic info and documents are shared — only vehicle details differ.
//         </Typography>
//         <Box sx={{ display: 'flex', gap: 2 }}>
//           <Paper
//             elevation={0}
//             onClick={() => onSelect('driver')}
//             sx={{
//               flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
//               border: '2px solid rgba(16,185,129,0.3)',
//               background: 'rgba(16,185,129,0.06)',
//               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
//               transition: 'all 0.2s ease',
//               '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.12)', transform: 'translateY(-2px)' },
//             }}
//           >
//             <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <CarIcon sx={{ color: '#10B981', fontSize: 26 }} />
//             </Box>
//             <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem', textAlign: 'center' }}>Driver Account</Typography>
//             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Taxi, Bus &amp; Motorbike ride driver</Typography>
//           </Paper>

//           <Paper
//             elevation={0}
//             onClick={() => onSelect('delivery')}
//             sx={{
//               flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
//               border: '2px solid rgba(245,158,11,0.3)',
//               background: 'rgba(245,158,11,0.06)',
//               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
//               transition: 'all 0.2s ease',
//               '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.12)', transform: 'translateY(-2px)' },
//             }}
//           >
//             <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <DeliveryIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
//             </Box>
//             <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem', textAlign: 'center' }}>Courier Account</Typography>
//             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Motorbike, Car &amp; Truck courier</Typography>
//           </Paper>
//         </Box>
//       </DialogContent>

//       <DialogActions sx={{ px: 3, pb: 2.5 }}>
//         <Button fullWidth variant="text" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderRadius: 2.5, height: 40 }}>
//           Cancel
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

// // ═════════════════════════════════════════════════════════════════════════════
// export default function DriversPage() {
//   const router = useRouter();
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
//   const { dashboard, currency } = usePartner();

//   // ── Core driver list (what came back from the last backend page load) ──────
//   const [drivers, setDrivers] = useState([]);
//   // ── What's actually shown in the table (local filter or backend search) ────
//   const [displayedDrivers, setDisplayedDrivers] = useState([]);

//   const [meta, setMeta] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [backendSearching, setBackendSearching] = useState(false);
//   const [error, setError] = useState(null);

//   const [search, setSearch] = useState('');
//   const [status, setStatus] = useState('');
//   const [page, setPage] = useState(1);

//   // ── Vehicle map: driverId → vehicle object ────────────────────────────────
//   // Populated by a separate /api/vehicles request after each page load.
//   const [vehiclesMap, setVehiclesMap] = useState({});
//   const [vehiclesLoading, setVehiclesLoading] = useState(false);

//   const [floatModal, setFloatModal] = useState(null);
//   const [editTypeModal, setEditTypeModal] = useState(null);
//   const [registerTypeModal, setRegisterTypeModal] = useState(false);

//   // Debounce ref for backend search fallback
//   const searchDebounceRef = useRef(null);

//   const partnerBalance = dashboard?.partnerProfile?.floatBalance ?? 0;
//   const partnerId = dashboard?.partnerProfile?.id ?? null;

//   // ── 1. Load a page of drivers (no search term — search is client-side first) ─
//   const load = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       // Note: search is intentionally NOT passed here. We load the full page
//       // and filter locally. Only if local results are empty do we hit the
//       // backend with a search term (see the search useEffect below).
//       const res = await getDrivers({ status, page });
//       const fetched = res?.data ?? [];
//       setDrivers(fetched);
//       setDisplayedDrivers(fetched); // reset to full list on every page load
//       setMeta(res?.meta?.pagination ?? null);
//       return fetched;
//     } catch (e) {
//       setError(e.message || 'Failed to load drivers');
//       return [];
//     } finally {
//       setLoading(false);
//     }
//   }, [status, page]);

//   // ── 2. After drivers load, fetch their vehicles in one batched request ─────
//   const loadVehicles = useCallback(async (driverList) => {
//     if (!driverList || driverList.length === 0) {
//       setVehiclesMap({});
//       return;
//     }
//     setVehiclesLoading(true);
//     try {
//       const ids = driverList.map((d) => d.id).filter(Boolean);
//       const map = await fetchVehiclesByDriverIds(ids);
//       setVehiclesMap(map);
//     } finally {
//       setVehiclesLoading(false);
//     }
//   }, []);

//   // Run load, then immediately fetch vehicles for whatever came back
//   const refresh = useCallback(async () => {
//     const fetched = await load();
//     await loadVehicles(fetched);
//   }, [load, loadVehicles]);

//   useEffect(() => { refresh(); }, [refresh]);

//   // ── 3. Two-tier search ────────────────────────────────────────────────────
//   // Tier 1: filter `drivers` (current page) locally.
//   // Tier 2: if nothing matches locally AND there is a search term, debounce a
//   //         backend request (partner-scoped) after 400 ms of no typing.
//   useEffect(() => {
//     // Clear any pending backend search
//     if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

//     if (!search.trim()) {
//       // No search term → show the full loaded page
//       setDisplayedDrivers(drivers);
//       return;
//     }

//     const localResults = filterLocally(drivers, search);

//     if (localResults.length > 0) {
//       // Tier 1 hit — no need to go to the backend
//       setDisplayedDrivers(localResults);
//       return;
//     }

//     // Tier 1 miss — debounce a backend search
//     searchDebounceRef.current = setTimeout(async () => {
//       setBackendSearching(true);
//       try {
//         const backendResults = await searchDriversOnBackend({
//           search: search.trim(),
//           status,
//           page: 1, // always start at page 1 for a search
//           partnerId,
//         });
//         setDisplayedDrivers(backendResults);

//         // Also fetch vehicles for these backend search results
//         if (backendResults.length > 0) {
//           const ids = backendResults.map((d) => d.id).filter(Boolean);
//           const map = await fetchVehiclesByDriverIds(ids);
//           // Merge into existing map so already-loaded vehicles stay cached
//           setVehiclesMap((prev) => ({ ...prev, ...map }));
//         }
//       } catch (err) {
//         console.warn('[drivers/page] backend search failed:', err);
//       } finally {
//         setBackendSearching(false);
//       }
//     }, 400);

//     return () => {
//       if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [search, drivers, status, partnerId]);

//   // When status or page changes, reset search so load() fetches fresh data
//   const handleStatusChange = (val) => { setStatus(val); setPage(1); setSearch(''); };
//   const handlePageChange = (delta) => { setPage((p) => p + delta); setSearch(''); };

//   const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

//   const renderStatusChip = (s) => (
//     <Chip
//       label={s}
//       size="small"
//       color={STATUS_CHIP_COLOR[s] ?? 'default'}
//       variant={['OFFLINE', 'PENDING'].includes(s) ? 'outlined' : 'filled'}
//       sx={{ fontWeight: 700, fontSize: '0.65rem' }}
//     />
//   );

//   const handleEditClick = (driver) => setEditTypeModal(driver);

//   const handleDriverTypeSelect = (driverType) => {
//     if (!editTypeModal) return;
//     setEditTypeModal(null);
//     router.push(`drivers/${editTypeModal.id}/edit?driverType=${driverType}`);
//   };

//   const handleRegisterTypeSelect = (type) => {
//     setRegisterTypeModal(false);
//     if (type === 'driver') router.push('drivers/register');
//     else router.push('drivers/register/courier');
//   };

//   // ── Vehicle lookup helper — reads from vehiclesMap keyed by driver ID ──────
//   const getVehicleForDriver = (driverId) => vehiclesMap[driverId] ?? null;

//   if (loading && drivers.length === 0) {
//     return (
//       <Box sx={{ p: 3 }}>
//         {[...Array(5)].map((_, i) => (
//           <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 1.5, bgcolor: 'rgba(255,255,255,0.05)' }} />
//         ))}
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
//       {/* Header */}
//       <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Fleet Drivers</Typography>
//           <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
//             {drivers.length} drivers registered
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<PersonAddIcon />}
//           onClick={() => setRegisterTypeModal(true)}
//           sx={{ borderRadius: 2.5, fontWeight: 700 }}
//         >
//           Register Driver
//         </Button>
//       </Box>

//       {error && (
//         <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2.5 }}
//           action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}>
//           {error}
//         </Alert>
//       )}

//       {/* Controls */}
//       <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
//         <TextField
//           placeholder="Search name or phone…"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           size="small"
//           sx={{ flex: 1, minWidth: 200 }}
//           InputProps={{
//             endAdornment: backendSearching ? (
//               <CircularProgress size={14} sx={{ mr: 1, color: 'rgba(255,255,255,0.4)' }} />
//             ) : null,
//           }}
//         />
//         <FormControl size="small" sx={{ minWidth: 150 }}>
//           <InputLabel>Status</InputLabel>
//           <Select value={status} label="Status" onChange={(e) => handleStatusChange(e.target.value)}>
//             <MenuItem value="">All</MenuItem>
//             {['ONLINE', 'ON_TRIP', 'EN_ROUTE', 'OFFLINE', 'PENDING', 'SUSPENDED'].map((s) => (
//               <MenuItem key={s} value={s}>{s}</MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//         {/* Show a hint when showing backend search results */}
//         {search.trim() && !backendSearching && displayedDrivers.length > 0 && filterLocally(drivers, search).length === 0 && (
//           <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>
//             Showing server results for &ldquo;{search}&rdquo;
//           </Typography>
//         )}
//       </Box>

//       {/* Desktop table */}
//       {!isMobile ? (
//         <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Driver</TableCell>
//                 <TableCell>Phone</TableCell>
//                 <TableCell>Status</TableCell>
//                 <TableCell>Float</TableCell>
//                 <TableCell>Vehicle</TableCell>
//                 <TableCell>Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {loading || backendSearching ? (
//                 <TableRow>
//                   <TableCell colSpan={6} align="center">
//                     <CircularProgress size={24} />
//                   </TableCell>
//                 </TableRow>
//               ) : displayedDrivers.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>
//                     {search.trim() ? `No drivers found for "${search}"` : 'No drivers found'}
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 displayedDrivers.map((d) => {
//                   const digits = getPhoneDigits(d.phoneNumber);
//                   const vehicle = getVehicleForDriver(d.id);
//                   return (
//                     <TableRow key={d.id} hover sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
//                       <TableCell>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                           <Avatar sx={{ width: 32, height: 32, bgcolor: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>
//                             {d.firstName?.[0]}
//                           </Avatar>
//                           <Box>
//                             <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>
//                               {d.firstName} {d.lastName}
//                             </Typography>
//                             <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
//                               ⭐ {d.averageRating?.toFixed(1)} · {d.completedRides} rides
//                             </Typography>
//                           </Box>
//                         </Box>
//                       </TableCell>
//                       <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{d.phoneNumber}</TableCell>
//                       <TableCell>{renderStatusChip(d.status)}</TableCell>
//                       <TableCell>
//                         <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', fontWeight: 700, color: getFloatColor(d.floatBalance) }}>
//                           K{Number(d.floatBalance).toFixed(2)}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         {vehiclesLoading && !vehicle ? (
//                           <Skeleton variant="text" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
//                         ) : vehicle ? (
//                           <Box>
//                             <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#F59E0B', letterSpacing: 1 }}>
//                               {vehicle.numberPlate}
//                             </Typography>
//                             <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
//                               {vehicle.make} {vehicle.model}
//                             </Typography>
//                           </Box>
//                         ) : (
//                           <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Unassigned</Typography>
//                         )}
//                       </TableCell>
//                       <TableCell>
//                         <Box sx={{ display: 'flex', gap: 0.5 }}>
//                           <IconButton size="small" onClick={() => router.push(`drivers/${d.id}`)} sx={{ color: '#3B82F6' }}>
//                             <ViewIcon fontSize="small" />
//                           </IconButton>
//                           <IconButton size="small" onClick={() => handleEditClick(d)} sx={{ color: '#A78BFA' }}>
//                             <EditIcon fontSize="small" />
//                           </IconButton>
//                           <IconButton size="small" onClick={() => setFloatModal({ driver: d, action: 'CREDIT' })} sx={{ color: '#10B981' }}>
//                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>💰</Typography>
//                           </IconButton>
//                           <IconButton size="small" onClick={() => setFloatModal({ driver: d, action: 'DEBIT' })} sx={{ color: '#F59E0B' }}>
//                             <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>➖</Typography>
//                           </IconButton>
//                           <IconButton size="small" component="a" href={`tel:${digits}`} sx={{ color: '#10B981' }}>
//                             <PhoneIcon fontSize="small" />
//                           </IconButton>
//                           <IconButton size="small" component="a" href={`https://wa.me/${digits}`} target="_blank" sx={{ color: '#25D366' }}>
//                             <WaIcon fontSize="small" />
//                           </IconButton>
//                         </Box>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       ) : (
//         /* Mobile cards */
//         <Box>
//           {backendSearching ? (
//             <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//               <CircularProgress size={28} />
//             </Box>
//           ) : displayedDrivers.length === 0 ? (
//             <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', py: 4 }}>
//               {search.trim() ? `No drivers found for "${search}"` : 'No drivers found'}
//             </Typography>
//           ) : (
//             displayedDrivers.map((d) => {
//               const digits = getPhoneDigits(d.phoneNumber);
//               const vehicle = getVehicleForDriver(d.id);
//               return (
//                 <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
//                   <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2.5 }} onClick={() => router.push(`drivers/${d.id}`)}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
//                       <Avatar sx={{ width: 40, height: 40, bgcolor: '#059669', fontWeight: 700 }}>
//                         {d.firstName?.[0]}
//                       </Avatar>
//                       <Box sx={{ flex: 1 }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                           <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
//                             {d.firstName} {d.lastName}
//                           </Typography>
//                           {renderStatusChip(d.status)}
//                         </Box>
//                         <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
//                           {d.phoneNumber}
//                         </Typography>
//                       </Box>
//                       <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: getFloatColor(d.floatBalance), fontSize: '0.9rem' }}>
//                         K{Number(d.floatBalance).toFixed(2)}
//                       </Typography>
//                     </Box>

//                     {/* Vehicle row */}
//                     {vehiclesLoading && !vehicle ? (
//                       <Skeleton variant="text" width={140} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 1.5 }} />
//                     ) : vehicle ? (
//                       <Typography sx={{ fontSize: '0.75rem', color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", mb: 1.5 }}>
//                         🚗 {vehicle.numberPlate} · {vehicle.make} {vehicle.model}
//                       </Typography>
//                     ) : null}

//                     <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
//                       <Button size="small" variant="outlined" onClick={() => handleEditClick(d)}
//                         sx={{ flex: 1, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700, borderColor: '#A78BFA', color: '#A78BFA' }}>
//                         ✏️ Edit
//                       </Button>
//                       <Button size="small" variant="outlined" color="success" onClick={() => setFloatModal({ driver: d, action: 'CREDIT' })}
//                         sx={{ flex: 1, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700 }}>
//                         💰 Float
//                       </Button>
//                       <Button size="small" href={`tel:${digits}`} component="a" variant="outlined" sx={{ borderRadius: 2, minWidth: 44, fontWeight: 700 }}>📞</Button>
//                       <Button size="small" href={`https://wa.me/${digits}`} target="_blank" component="a" variant="outlined"
//                         sx={{ borderRadius: 2, minWidth: 44, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>💬</Button>
//                     </Box>
//                   </Paper>
//                 </motion.div>
//               );
//             })
//           )}
//         </Box>
//       )}

//       {/* Pagination — hidden while actively searching (search has its own scope) */}
//       {!search.trim() && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1, alignItems: 'center' }}>
//           <Button variant="outlined" size="small" disabled={page === 1} onClick={() => handlePageChange(-1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
//             Previous
//           </Button>
//           <Typography sx={{ display: 'flex', alignItems: 'center', px: 2, color: 'text.secondary', fontSize: '0.85rem' }}>
//             Page {page} of {totalPages}
//           </Typography>
//           <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => handlePageChange(1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
//             Next
//           </Button>
//         </Box>
//       )}

//       {/* Register driver type modal */}
//       <RegisterDriverTypeModal
//         open={registerTypeModal}
//         onClose={() => setRegisterTypeModal(false)}
//         onSelect={handleRegisterTypeSelect}
//       />

//       {/* Edit driver type modal */}
//       <DriverTypeModal
//         open={!!editTypeModal}
//         driver={editTypeModal}
//         onClose={() => setEditTypeModal(null)}
//         onSelect={handleDriverTypeSelect}
//       />

//       {/* Float modal */}
//       {floatModal && (
//         <FloatModal
//           open={!!floatModal}
//           onClose={() => setFloatModal(null)}
//           driver={floatModal.driver}
//           partnerFloatBalance={partnerBalance}
//           defaultAction={floatModal.action}
//           currency={currency}
//           onSuccess={() => { setFloatModal(null); refresh(); }}
//         />
//       )}
//     </Box>
//   );
// }
'use client';
// PATH: app/partner/drivers/page.js

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Chip, IconButton, Alert, Skeleton, useMediaQuery, useTheme, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon, Visibility as ViewIcon,
  Phone as PhoneIcon, WhatsApp as WaIcon, Edit as EditIcon,
  DirectionsCar as CarIcon, LocalShipping as DeliveryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { getDrivers } from '@/lib/api/partner';
import { getPhoneDigits, getFloatColor } from '@/lib/utils/format';
import { STATUS_CHIP_COLOR } from '@/constants';
import FloatModal from '@/components/partner/FloatModal';
import { usePartner } from '@/lib/hooks/usePartner';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api/client';

// ─── Fetch the single vehicle assigned to each driver ID ──────────────────────
// Uses Strapi's $in filter:
//   GET /api/vehicles?filters[assignedDriver][id][$in][0]=1&filters[assignedDriver][id][$in][1]=2...
// Returns { [driverId]: vehicle }
async function fetchVehiclesByDriverIds(driverIds) {
  if (!driverIds || driverIds.length === 0) return {};
  try {
    const params = new URLSearchParams();

    // Filter: only vehicles whose assignedDriver is one of our driver IDs
    driverIds.forEach((id, i) => {
      params.append(`filters[assignedDriver][id][$in][${i}]`, String(id));
    });

    // Populate assignedDriver so we can key the result map by driver ID
    params.append('populate[assignedDriver][fields][0]', 'id');

    // Only return the fields we actually render
    params.append('fields[0]', 'id');
    params.append('fields[1]', 'numberPlate');
    params.append('fields[2]', 'make');
    params.append('fields[3]', 'model');
    params.append('fields[4]', 'vehicleType');
    params.append('fields[5]', 'color');

    // Raise the page size ceiling so we don't miss vehicles for large fleets
    params.append('pagination[pageSize]', String(driverIds.length + 10));

    const res = await apiClient.get(`/vehicles?${params.toString()}`);
    if (!res.data) {
      console.warn('[drivers/page] fetchVehiclesByDriverIds HTTP error:', res.status);
      return {};
    }

    const json = res;

    json    // Strapi v4 returns { data: [{ id, attributes }] }
    // Some setups return a flat array or { data: [{ id, ...fields }] }
    const rawList = json?.data ?? (Array.isArray(json) ? json : []);

    const map = {};
    rawList.forEach((entry) => {
      // Normalise v4 nested shape → flat object
      const vehicle = entry?.attributes
        ? { id: entry.id, ...entry.attributes }
        : entry;

      // Resolve the assignedDriver id from whichever shape we got
      const assignedDriver = vehicle?.assignedDriver;
      const driverId =
        assignedDriver?.data?.id ??   // v4: { data: { id, attributes } }
        assignedDriver?.id ??          // flat populated object
        (typeof assignedDriver === 'number' ? assignedDriver : null); // bare id

      if (driverId != null) {
        map[driverId] = vehicle;
      }
    });

    return map;
  } catch (err) {
    console.warn('[drivers/page] fetchVehiclesByDriverIds failed:', err);
    return {};
  }
}

// ─── Backend search ───────────────────────────────────────────────────────────
async function searchDriversOnBackend({ search, status, page, partnerId }) {
  try {
    const res = await getDrivers({ search, status, page });
    return res?.data ?? [];
  } catch (err) {
    console.warn('[drivers/page] searchDriversOnBackend failed:', err);
    return [];
  }
}

// ─── Local search ─────────────────────────────────────────────────────────────
function filterLocally(drivers, query) {
  if (!query || !query.trim()) return drivers;
  const q = query.trim().toLowerCase();
  return drivers.filter((d) => {
    const fullName = `${d.firstName ?? ''} ${d.lastName ?? ''}`.toLowerCase();
    const phone = (d.phoneNumber ?? '').toLowerCase();
    return fullName.includes(q) || phone.includes(q);
  });
}

// ─── Register driver type modal ───────────────────────────────────────────────
function RegisterDriverTypeModal({ open, onClose, onSelect }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          bgcolor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundImage: 'none',
          maxWidth: 400,
          width: '100%',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
            Register New Driver
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
            Choose the type of driver account to create
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 2.5 }}>
          Basic info and documents are shared. Vehicle details differ by driver type.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Paper
            elevation={0}
            onClick={() => onSelect('driver')}
            sx={{
              flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
              border: '2px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CarIcon sx={{ color: '#10B981', fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem', textAlign: 'center' }}>
              Ride Driver
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
              Taxi, Bus &amp; Motorbike ride driver
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            onClick={() => onSelect('delivery')}
            sx={{
              flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
              border: '2px solid rgba(245,158,11,0.3)',
              background: 'rgba(245,158,11,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DeliveryIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem', textAlign: 'center' }}>
              Courier
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>
              Delivery driver (motorbike, car, truck)
            </Typography>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button fullWidth variant="text" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderRadius: 2.5, height: 40 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Edit driver type modal ───────────────────────────────────────────────────
function DriverTypeModal({ driver, open, onClose, onSelect }) {
  if (!driver) return null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          bgcolor: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundImage: 'none',
          maxWidth: 400,
          width: '100%',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
            Edit Driver&apos;s Account
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
            {driver.firstName} {driver.lastName}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', mb: 2.5 }}>
          Choose which driver profile to edit. Basic info and documents are shared — only vehicle details differ.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Paper
            elevation={0}
            onClick={() => onSelect('driver')}
            sx={{
              flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
              border: '2px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CarIcon sx={{ color: '#10B981', fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem', textAlign: 'center' }}>Driver Account</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Taxi, Bus &amp; Motorbike ride driver</Typography>
          </Paper>

          <Paper
            elevation={0}
            onClick={() => onSelect('delivery')}
            sx={{
              flex: 1, p: 2.5, borderRadius: 3, cursor: 'pointer',
              border: '2px solid rgba(245,158,11,0.3)',
              background: 'rgba(245,158,11,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.12)', transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DeliveryIcon sx={{ color: '#F59E0B', fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem', textAlign: 'center' }}>Courier Account</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Motorbike, Car &amp; Truck courier</Typography>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button fullWidth variant="text" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderRadius: 2.5, height: 40 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function DriversPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { dashboard, currency } = usePartner();

  const [drivers, setDrivers] = useState([]);
  const [displayedDrivers, setDisplayedDrivers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendSearching, setBackendSearching] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // driverId → vehicle object
  const [vehiclesMap, setVehiclesMap] = useState({});
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const [floatModal, setFloatModal] = useState(null);
  const [editTypeModal, setEditTypeModal] = useState(null);
  const [registerTypeModal, setRegisterTypeModal] = useState(false);

  const searchDebounceRef = useRef(null);

  const partnerBalance = dashboard?.partnerProfile?.floatBalance ?? 0;
  const partnerId = dashboard?.partnerProfile?.id ?? null;

  // ── Load a page of drivers ────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDrivers({ status, page });
      const fetched = res?.data ?? [];
      setDrivers(fetched);
      setDisplayedDrivers(fetched);
      setMeta(res?.meta?.pagination ?? null);
      return fetched;
    } catch (e) {
      setError(e.message || 'Failed to load drivers');
      return [];
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  // ── Fetch vehicles for a list of drivers in one batched request ───────────
  const loadVehicles = useCallback(async (driverList) => {
    if (!driverList || driverList.length === 0) {
      setVehiclesMap({});
      return;
    }
    setVehiclesLoading(true);
    try {
      const ids = driverList.map((d) => d.id).filter(Boolean);
      const map = await fetchVehiclesByDriverIds(ids);
      setVehiclesMap(map);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const fetched = await load();
    await loadVehicles(fetched);
  }, [load, loadVehicles]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Two-tier search: local first, backend fallback ────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!search.trim()) {
      setDisplayedDrivers(drivers);
      return;
    }

    const localResults = filterLocally(drivers, search);
    if (localResults.length > 0) {
      setDisplayedDrivers(localResults);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setBackendSearching(true);
      try {
        const backendResults = await searchDriversOnBackend({
          search: search.trim(),
          status,
          page: 1,
          partnerId,
        });
        setDisplayedDrivers(backendResults);

        if (backendResults.length > 0) {
          const ids = backendResults.map((d) => d.id).filter(Boolean);
          const map = await fetchVehiclesByDriverIds(ids);
          setVehiclesMap((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.warn('[drivers/page] backend search failed:', err);
      } finally {
        setBackendSearching(false);
      }
    }, 400);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, drivers, status, partnerId]);

  const handleStatusChange = (val) => { setStatus(val); setPage(1); setSearch(''); };
  const handlePageChange = (delta) => { setPage((p) => p + delta); setSearch(''); };

  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

  const renderStatusChip = (s) => (
    <Chip
      label={s}
      size="small"
      color={STATUS_CHIP_COLOR[s] ?? 'default'}
      variant={['OFFLINE', 'PENDING'].includes(s) ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, fontSize: '0.65rem' }}
    />
  );

  const handleEditClick = (driver) => setEditTypeModal(driver);

  const handleDriverTypeSelect = (driverType) => {
    if (!editTypeModal) return;
    setEditTypeModal(null);
    router.push(`drivers/${editTypeModal.id}/edit?driverType=${driverType}`);
  };

  const handleRegisterTypeSelect = (type) => {
    setRegisterTypeModal(false);
    if (type === 'driver') router.push('drivers/register');
    else router.push('drivers/register/courier');
  };

  const getVehicleForDriver = (driverId) => vehiclesMap[driverId] ?? null;

  if (loading && drivers.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 1.5, bgcolor: 'rgba(255,255,255,0.05)' }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Fleet Drivers</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            {drivers.length} drivers registered
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setRegisterTypeModal(true)}
          sx={{ borderRadius: 2.5, fontWeight: 700 }}
        >
          Register Driver
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2.5 }}
          action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            endAdornment: backendSearching ? (
              <CircularProgress size={14} sx={{ mr: 1, color: 'rgba(255,255,255,0.4)' }} />
            ) : null,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => handleStatusChange(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {['ONLINE', 'ON_TRIP', 'EN_ROUTE', 'OFFLINE', 'PENDING', 'SUSPENDED'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {search.trim() && !backendSearching && displayedDrivers.length > 0 && filterLocally(drivers, search).length === 0 && (
          <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>
            Showing server results for &ldquo;{search}&rdquo;
          </Typography>
        )}
      </Box>

      {/* Desktop table */}
      {!isMobile ? (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Float</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || backendSearching ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : displayedDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    {search.trim() ? `No drivers found for "${search}"` : 'No drivers found'}
                  </TableCell>
                </TableRow>
              ) : (
                displayedDrivers.map((d) => {
                  const digits = getPhoneDigits(d.phoneNumber);
                  const vehicle = getVehicleForDriver(d.id);
                  return (
                    <TableRow key={d.id} hover sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>
                            {d.firstName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>
                              {d.firstName} {d.lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                              ⭐ {d.averageRating?.toFixed(1)} · {d.completedRides} rides
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{d.phoneNumber}</TableCell>
                      <TableCell>{renderStatusChip(d.status)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', fontWeight: 700, color: getFloatColor(d.floatBalance) }}>
                          K{Number(d.floatBalance).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {vehiclesLoading && !vehicle ? (
                          <Skeleton variant="text" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                        ) : vehicle ? (
                          <Box>
                            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#F59E0B', letterSpacing: 1 }}>
                              {vehicle.numberPlate}
                            </Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
                              {vehicle.make} {vehicle.model}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Unassigned</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => router.push(`drivers/${d.id}`)} sx={{ color: '#3B82F6' }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleEditClick(d)} sx={{ color: '#A78BFA' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setFloatModal({ driver: d, action: 'CREDIT' })} sx={{ color: '#10B981' }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>💰</Typography>
                          </IconButton>
                          <IconButton size="small" onClick={() => setFloatModal({ driver: d, action: 'DEBIT' })} sx={{ color: '#F59E0B' }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>➖</Typography>
                          </IconButton>
                          <IconButton size="small" component="a" href={`tel:${digits}`} sx={{ color: '#10B981' }}>
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" component="a" href={`https://wa.me/${digits}`} target="_blank" sx={{ color: '#25D366' }}>
                            <WaIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Mobile cards */
        <Box>
          {backendSearching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : displayedDrivers.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', py: 4 }}>
              {search.trim() ? `No drivers found for "${search}"` : 'No drivers found'}
            </Typography>
          ) : (
            displayedDrivers.map((d) => {
              const digits = getPhoneDigits(d.phoneNumber);
              const vehicle = getVehicleForDriver(d.id);
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2.5 }} onClick={() => router.push(`drivers/${d.id}`)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: '#059669', fontWeight: 700 }}>
                        {d.firstName?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                            {d.firstName} {d.lastName}
                          </Typography>
                          {renderStatusChip(d.status)}
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          {d.phoneNumber}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: getFloatColor(d.floatBalance), fontSize: '0.9rem' }}>
                        K{Number(d.floatBalance).toFixed(2)}
                      </Typography>
                    </Box>

                    {vehiclesLoading && !vehicle ? (
                      <Skeleton variant="text" width={140} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 1.5 }} />
                    ) : vehicle ? (
                      <Typography sx={{ fontSize: '0.75rem', color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", mb: 1.5 }}>
                        🚗 {vehicle.numberPlate} · {vehicle.make} {vehicle.model}
                      </Typography>
                    ) : null}

                    <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                      <Button size="small" variant="outlined" onClick={() => handleEditClick(d)}
                        sx={{ flex: 1, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700, borderColor: '#A78BFA', color: '#A78BFA' }}>
                        ✏️ Edit
                      </Button>
                      <Button size="small" variant="outlined" color="success" onClick={() => setFloatModal({ driver: d, action: 'CREDIT' })}
                        sx={{ flex: 1, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700 }}>
                        💰 Float
                      </Button>
                      <Button size="small" href={`tel:${digits}`} component="a" variant="outlined" sx={{ borderRadius: 2, minWidth: 44, fontWeight: 700 }}>📞</Button>
                      <Button size="small" href={`https://wa.me/${digits}`} target="_blank" component="a" variant="outlined"
                        sx={{ borderRadius: 2, minWidth: 44, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>💬</Button>
                    </Box>
                  </Paper>
                </motion.div>
              );
            })
          )}
        </Box>
      )}

      {/* Pagination */}
      {!search.trim() && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1, alignItems: 'center' }}>
          <Button variant="outlined" size="small" disabled={page === 1} onClick={() => handlePageChange(-1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Previous
          </Button>
          <Typography sx={{ display: 'flex', alignItems: 'center', px: 2, color: 'text.secondary', fontSize: '0.85rem' }}>
            Page {page} of {totalPages}
          </Typography>
          <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => handlePageChange(1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Next
          </Button>
        </Box>
      )}

      <RegisterDriverTypeModal
        open={registerTypeModal}
        onClose={() => setRegisterTypeModal(false)}
        onSelect={handleRegisterTypeSelect}
      />

      <DriverTypeModal
        open={!!editTypeModal}
        driver={editTypeModal}
        onClose={() => setEditTypeModal(null)}
        onSelect={handleDriverTypeSelect}
      />

      {floatModal && (
        <FloatModal
          open={!!floatModal}
          onClose={() => setFloatModal(null)}
          driver={floatModal.driver}
          partnerFloatBalance={partnerBalance}
          defaultAction={floatModal.action}
          currency={currency}
          onSuccess={() => { setFloatModal(null); refresh(); }}
        />
      )}
    </Box>
  );
}