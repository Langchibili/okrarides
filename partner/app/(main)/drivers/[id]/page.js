// // PATH: appdrivers/[id]/page.js
// 'use client';
// import { useState, useEffect, useCallback } from 'react';
// import {
//   Box, Typography, Paper, Grid, Tabs, Tab, Avatar, Chip, Button,
//   IconButton, Alert, Skeleton, TextField, Dialog, DialogTitle,
//   DialogContent, DialogActions, CircularProgress, Select, MenuItem,
//   FormControl, InputLabel, Table, TableBody, TableCell, TableHead,
//   TableRow, TableContainer,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon, Phone as PhoneIcon, Warning as WarningIcon,
//   Cancel as CancelIcon,
// } from '@mui/icons-material';
// import { WhatsApp as WaIcon } from '@mui/icons-material';
// import { useRouter, useParams } from 'next/navigation';
// import { getDriverMetrics, modifyDriverFloat, reportDriver, cancelRide, getVehicles, assignVehicle } from '@/lib/api/partner';
// import { formatCurrency, formatDate, formatDateTime, getPhoneDigits, getFloatColor, getInsuranceChipProps } from '@/lib/utils/format';
// import { RIDE_STATUS_COLORS, RIDE_STATUS_LABELS } from '@/constants';
// import MetricCard from '@/components/partner/MetricCard';
// import FloatModal from '@/components/partner/FloatModal';
// import { usePartner } from '@/lib/hooks/usePartner';

// // Simple SVG bar chart for daily breakdown
// function SvgBarChart({ data, color = '#10B981' }) {
//   if (!data || data.length === 0) return null;
//   const maxEarnings = Math.max(...data.map((d) => d.earnings), 1);
//   const W = 400, H = 120, BAR_W = Math.max(8, W / data.length - 4);

//   return (
//     <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
//       {data.map((d, i) => {
//         const barH = (d.earnings / maxEarnings) * (H - 30);
//         const x = (i / data.length) * W + 2;
//         const y = H - 20 - barH;
//         return (
//           <g key={d.date}>
//             <rect x={x} y={y} width={BAR_W} height={barH} fill={color} opacity={0.7} rx={3} />
//             <text x={x + BAR_W / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)">
//               {d.date?.slice(5)}
//             </text>
//           </g>
//         );
//       })}
//     </svg>
//   );
// }

// export default function DriverDetailPage() {
//   const router = useRouter();
//   const { id } = useParams();
//   const { currency, dashboard } = usePartner();
//   const partnerBalance = dashboard?.partnerProfile?.floatBalance ?? 0;

//   const [tab, setTab] = useState(0);
//   const [data, setData] = useState(null);
//   const [period, setPeriod] = useState('week');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [floatModal, setFloatModal] = useState(null);

//   // Report dialog
//   const [reportOpen, setReportOpen] = useState(false);
//   const [reportReason, setReportReason] = useState('');
//   const [reportDetails, setReportDetails] = useState('');
//   const [reporting, setReporting] = useState(false);
//   const [reportDone, setReportDone] = useState(false);

//   // Cancel ride dialog
//   const [cancelOpen, setCancelOpen] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [cancelling, setCancelling] = useState(false);

//   // Assign vehicle
//   const [vehicles, setVehicles] = useState([]);
//   const [assignVehicleId, setAssignVehicleId] = useState('');
//   const [assigning, setAssigning] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await getDriverMetrics(Number(id), period);
//       setData(res);
//     } catch (e) {
//       setError(e.message || 'Failed to load driver');
//     } finally {
//       setLoading(false);
//     }
//   }, [id, period]);

//   useEffect(() => { load(); }, [load]);

//   useEffect(() => {
//     if (tab === 4) {
//       getVehicles().then((res) => setVehicles(res?.data ?? []));
//     }
//   }, [tab]);

//   const driver = data?.driver;
//   const metrics = data?.metrics;
//   const floatHistory = data?.floatHistory ?? [];
//   const dailyBreakdown = data?.dailyBreakdown ?? [];
//   const activeRide = data?.activeRide;

//   const digits = driver ? getPhoneDigits(driver.phoneNumber) : '';
//   const vehicle = driver?.assignedVehicle;
//   const insuranceChip = getInsuranceChipProps(vehicle?.insuranceExpiryDate);

//   const handleReport = async () => {
//     setReporting(true);
//     try {
//       await reportDriver(Number(id), reportReason, reportDetails || undefined);
//       setReportDone(true);
//       setReportOpen(false);
//     } catch (e) {
//       alert(e.message);
//     } finally {
//       setReporting(false);
//     }
//   };

//   const handleCancelRide = async () => {
//     setCancelling(true);
//     try {
//       await cancelRide(activeRide.id, cancelReason, false);
//       setCancelOpen(false);
//       load();
//     } catch (e) {
//       alert(e.message);
//     } finally {
//       setCancelling(false);
//     }
//   };

//   const handleAssignVehicle = async () => {
//     if (!assignVehicleId) return;
//     setAssigning(true);
//     try {
//       await assignVehicle(Number(assignVehicleId), Number(id));
//       load();
//       setAssignVehicleId('');
//     } catch (e) {
//       alert(e.message);
//     } finally {
//       setAssigning(false);
//     }
//   };

//   if (loading && !data) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
//         <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
//       {/* Header */}
//       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
//         <IconButton onClick={() => router.back()} sx={{ color: 'rgba(255,255,255,0.5)' }}><BackIcon /></IconButton>
//         <Avatar sx={{ width: 48, height: 48, bgcolor: '#059669', fontWeight: 800, fontSize: '1.1rem' }}>
//           {driver?.firstName?.[0]}
//         </Avatar>
//         <Box sx={{ flex: 1 }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
//             <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
//               {driver?.firstName} {driver?.lastName}
//             </Typography>
//             <Chip
//               label={driver?.status}
//               size="small"
//               color={driver?.status === 'ONLINE' ? 'success' : driver?.status === 'ON_TRIP' ? 'error' : 'default'}
//               sx={{ fontWeight: 700 }}
//             />
//           </Box>
//           <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
//             {driver?.phoneNumber}
//           </Typography>
//         </Box>
//         <Box sx={{ display: 'flex', gap: 1 }}>
//           <Button href={`tel:${digits}`} component="a" variant="outlined" startIcon={<PhoneIcon />} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
//             Call
//           </Button>
//           <Button href={`https://wa.me/${digits}`} target="_blank" component="a" variant="outlined" startIcon={<WaIcon />} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>
//             WhatsApp
//           </Button>
//         </Box>
//       </Box>

//       {reportDone && (
//         <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setReportDone(false)}>
//           Report submitted to Okra support.
//         </Alert>
//       )}

//       {/* Tabs */}
//       <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 3 }}>
//         <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600 }, '& .Mui-selected': { color: '#10B981' }, '& .MuiTabs-indicator': { bgcolor: '#10B981' } }}>
//           <Tab label="Overview" />
//           <Tab label="Metrics" />
//           <Tab label="Float History" />
//           <Tab label="Rides" />
//           <Tab label="Actions" />
//         </Tabs>
//       </Box>

//       {/* ── Overview ── */}
//       {tab === 0 && (
//         <Box>
//           {/* Float balance hero */}
//           <Paper sx={{ p: 3, borderRadius: 3, mb: 3, background: `linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(4,120,87,0.08) 100%)`, border: '1px solid rgba(5,150,105,0.2)' }}>
//             <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>Float Balance</Typography>
//             <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 800, color: getFloatColor(driver?.floatBalance ?? 0) }}>
//               {currency}{Number(driver?.floatBalance ?? 0).toFixed(2)}
//             </Typography>
//           </Paper>

//           {/* Active ride card */}
//           {activeRide && (
//             <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(185,28,28,0.04) 100%)', position: 'relative', overflow: 'hidden' }}>
//               <Box sx={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444', animation: 'livePulse 1.5s ease-in-out infinite', '@keyframes livePulse': { '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.7)' }, '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' } } }} />
//               <Typography sx={{ fontWeight: 700, color: '#EF4444', fontSize: '0.75rem', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
//                 Active Trip In Progress
//               </Typography>
//               <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
//                 <Box sx={{ flex: 1 }}>
//                   <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>From</Typography>
//                   <Typography sx={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{activeRide.pickupLocation?.address}</Typography>
//                 </Box>
//                 <Box sx={{ flex: 1 }}>
//                   <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>To</Typography>
//                   <Typography sx={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{activeRide.dropoffLocation?.address}</Typography>
//                 </Box>
//               </Box>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <Box>
//                   <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Rider: {activeRide.rider?.firstName} {activeRide.rider?.lastName}</Typography>
//                   <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#10B981', fontSize: '1.1rem' }}>
//                     {currency}{Number(activeRide.totalFare).toFixed(2)}
//                   </Typography>
//                 </Box>
//                 <Button size="small" variant="outlined" color="error" onClick={() => setCancelOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
//                   Cancel Ride
//                 </Button>
//               </Box>
//             </Paper>
//           )}

//           {/* Vehicle card */}
//           {vehicle && (
//             <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
//               <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
//                 Assigned Vehicle
//               </Typography>
//               <Typography sx={{
//                 fontFamily: "'JetBrains Mono', monospace", fontSize: '1.8rem', fontWeight: 800, letterSpacing: 3,
//                 background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
//                 WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', mb: 1,
//               }}>
//                 {vehicle.numberPlate}
//               </Typography>
//               <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
//                 {vehicle.make} {vehicle.model} · {vehicle.color}
//               </Typography>
//               <Chip label={insuranceChip.label} color={insuranceChip.color} size="small" sx={{ fontWeight: 700 }} />
//             </Paper>
//           )}

//           {/* Stats row */}
//           <Grid container spacing={2}>
//             <Grid item xs={6} md={3}>
//               <MetricCard label="Total Rides" value={driver?.totalRides ?? 0} color="blue" />
//             </Grid>
//             <Grid item xs={6} md={3}>
//               <MetricCard
//                 label="Completion Rate"
//                 value={`${driver?.totalRides > 0 ? Math.round((driver.completedRides / driver.totalRides) * 100) : 0}%`}
//                 color="green"
//               />
//             </Grid>
//             <Grid item xs={6} md={3}>
//               <MetricCard label="Avg Rating" value={`⭐ ${Number(driver?.averageRating ?? 0).toFixed(1)}`} color="orange" />
//             </Grid>
//             <Grid item xs={6} md={3}>
//               <MetricCard label="Member Since" value={driver?.createdAt ? formatDate(driver.createdAt) : '—'} color="purple" />
//             </Grid>
//           </Grid>
//         </Box>
//       )}

//       {/* ── Metrics ── */}
//       {tab === 1 && (
//         <Box>
//           <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
//             {['today', 'week', 'month'].map((p) => (
//               <Button key={p} variant={period === p ? 'contained' : 'outlined'} size="small"
//                 onClick={() => setPeriod(p)} sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'capitalize' }}>
//                 {p.charAt(0).toUpperCase() + p.slice(1)}
//               </Button>
//             ))}
//           </Box>
//           <Grid container spacing={2} sx={{ mb: 3 }}>
//             <Grid item xs={6} md={4}><MetricCard label="Rides Completed" value={metrics?.ridesCompleted ?? 0} color="blue" /></Grid>
//             <Grid item xs={6} md={4}><MetricCard label="Total Earnings" value={`${currency}${Number(metrics?.totalEarnings ?? 0).toFixed(0)}`} color="green" /></Grid>
//             <Grid item xs={6} md={4}><MetricCard label="Commission Paid" value={`${currency}${Number(metrics?.totalCommission ?? 0).toFixed(0)}`} color="orange" /></Grid>
//             <Grid item xs={6} md={4}><MetricCard label="Deliveries Done" value={metrics?.deliveriesCompleted ?? 0} color="purple" /></Grid>
//             <Grid item xs={6} md={4}><MetricCard label="Distance (km)" value={Number(metrics?.totalDistance ?? 0).toFixed(1)} color="cyan" /></Grid>
//             <Grid item xs={6} md={4}><MetricCard label="Cash Rides" value={metrics?.cashTransactions ?? 0} color="red" /></Grid>
//           </Grid>
//           {dailyBreakdown.length > 0 && (
//             <Paper sx={{ p: 2.5, borderRadius: 3 }}>
//               <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Daily Earnings</Typography>
//               <SvgBarChart data={dailyBreakdown} color="#10B981" />
//             </Paper>
//           )}
//         </Box>
//       )}

//       {/* ── Float History ── */}
//       {tab === 2 && (
//         <Box>
//           <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>Date</TableCell>
//                   <TableCell>Action</TableCell>
//                   <TableCell>Amount</TableCell>
//                   <TableCell>Note</TableCell>
//                   <TableCell>Balance After</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {floatHistory.length === 0 ? (
//                   <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No float history</TableCell></TableRow>
//                 ) : (
//                   floatHistory
//                     .filter((e) => ['float_topup-partner', 'float_debit-partner'].includes(e.type))
//                     .map((e) => {
//                       const isCredit = e.type === 'float_topup-partner';
//                       return (
//                         <TableRow key={e.id}>
//                           <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{formatDateTime(e.createdAt)}</TableCell>
//                           <TableCell>
//                             <Chip label={isCredit ? 'CREDIT' : 'DEBIT'} size="small" color={isCredit ? 'success' : 'error'} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
//                           </TableCell>
//                           <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isCredit ? '#10B981' : '#EF4444' }}>
//                             {isCredit ? '+' : '-'}{currency}{Number(e.amount).toFixed(2)}
//                           </TableCell>
//                           <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{e.description}</TableCell>
//                           <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", color: getFloatColor(e.balanceAfter ?? 0), fontWeight: 700 }}>
//                             {currency}{Number(e.balanceAfter ?? 0).toFixed(2)}
//                           </TableCell>
//                         </TableRow>
//                       );
//                     })
//                 )}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         </Box>
//       )}

//       {/* ── Rides ── */}
//       {tab === 3 && (
//         <Box>
//           <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, fontSize: '0.85rem' }}>
//             Showing recent rides for this driver
//           </Typography>
//           <Paper sx={{ p: 2, borderRadius: 3 }}>
//             <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', py: 4 }}>
//               View rides in the Rides section, filtering by this driver.
//             </Typography>
//             <Button variant="outlined" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700 }}
//               onClick={() => router.push(`rides?driverId=${id}`)}>
//               View All Rides for This Driver
//             </Button>
//           </Paper>
//         </Box>
//       )}

//       {/* ── Actions ── */}
//       {tab === 4 && (
//         <Box>
//           <Grid container spacing={2}>
//             <Grid item xs={12} sm={6}>
//               <Paper sx={{ p: 2.5, borderRadius: 3 }}>
//                 <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Float Management</Typography>
//                 <Box sx={{ display: 'flex', gap: 1.5 }}>
//                   <Button variant="contained" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }} onClick={() => setFloatModal('CREDIT')}>
//                     💰 Add Float
//                   </Button>
//                   <Button variant="outlined" color="error" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }} onClick={() => setFloatModal('DEBIT')}>
//                     ➖ Remove Float
//                   </Button>
//                 </Box>
//               </Paper>
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <Paper sx={{ p: 2.5, borderRadius: 3 }}>
//                 <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Assign Vehicle</Typography>
//                 <Box sx={{ display: 'flex', gap: 1.5 }}>
//                   <FormControl fullWidth size="small">
//                     <InputLabel>Select Vehicle</InputLabel>
//                     <Select value={assignVehicleId} label="Select Vehicle" onChange={(e) => setAssignVehicleId(e.target.value)}>
//                       <MenuItem value="">— None —</MenuItem>
//                       {vehicles.filter((v) => !v.assignedDriver || v.assignedDriver.id === Number(id)).map((v) => (
//                         <MenuItem key={v.id} value={v.id}>
//                           {v.numberPlate} · {v.make} {v.model}
//                         </MenuItem>
//                       ))}
//                     </Select>
//                   </FormControl>
//                   <Button variant="contained" onClick={handleAssignVehicle} disabled={!assignVehicleId || assigning} sx={{ borderRadius: 2.5, fontWeight: 700, flexShrink: 0 }}>
//                     {assigning ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Assign'}
//                   </Button>
//                 </Box>
//               </Paper>
//             </Grid>

//             <Grid item xs={12}>
//               <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(239,68,68,0.2)' }}>
//                 <Typography sx={{ fontWeight: 700, color: '#EF4444', mb: 2 }}>Report Driver</Typography>
//                 <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 2 }}>
//                   Submit a report to Okra admin. This sends an email and SMS to all admin contacts.
//                 </Typography>
//                 {reportDone ? (
//                   <Alert severity="success" sx={{ borderRadius: 2 }}>Report submitted successfully.</Alert>
//                 ) : (
//                   <Button variant="outlined" color="error" sx={{ borderRadius: 2.5, fontWeight: 700 }} onClick={() => setReportOpen(true)}>
//                     📋 Submit Report
//                   </Button>
//                 )}
//               </Paper>
//             </Grid>
//           </Grid>
//         </Box>
//       )}

//       {/* Float modal */}
//       {floatModal && (
//         <FloatModal
//           open={!!floatModal}
//           onClose={() => setFloatModal(null)}
//           driver={driver}
//           partnerFloatBalance={partnerBalance}
//           defaultAction={floatModal}
//           currency={currency}
//           onSuccess={() => { setFloatModal(null); load(); }}
//         />
//       )}

//       {/* Report dialog */}
//       <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
//         <DialogTitle sx={{ fontWeight: 700 }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//             <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <WarningIcon sx={{ color: '#fff', fontSize: 22 }} />
//             </Box>
//             Report Driver
//           </Box>
//         </DialogTitle>
//         <DialogContent>
//           <TextField fullWidth label="Reason *" value={reportReason} onChange={(e) => setReportReason(e.target.value)} sx={{ mb: 2, mt: 1 }} />
//           <TextField fullWidth multiline rows={3} label="Details (optional)" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />
//         </DialogContent>
//         <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
//           <Button onClick={() => setReportOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Go Back</Button>
//           <Button onClick={handleReport} disabled={!reportReason.trim() || reporting} variant="contained" color="error" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
//             {reporting ? <CircularProgress size={16} color="inherit" /> : 'Submit Report'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Cancel ride dialog */}
//       <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
//         <DialogTitle sx={{ fontWeight: 700 }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//             <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <WarningIcon sx={{ color: '#fff', fontSize: 22 }} />
//             </Box>
//             Cancel This Ride?
//           </Box>
//         </DialogTitle>
//         <DialogContent>
//           <TextField fullWidth multiline rows={2} label="Reason for cancellation" value={cancelReason}
//             onChange={(e) => setCancelReason(e.target.value)} sx={{ mt: 1 }} />
//         </DialogContent>
//         <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
//           <Button onClick={() => setCancelOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Go Back</Button>
//           <Button onClick={handleCancelRide} disabled={!cancelReason.trim() || cancelling} variant="contained" color="error" startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />} sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
//             {cancelling ? 'Cancelling…' : 'Cancel Ride'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

// PATH: app/partner/drivers/[id]/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Avatar, Chip, Button,
  IconButton, Alert, Skeleton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Phone as PhoneIcon, Warning as WarningIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { WhatsApp as WaIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { getDriverMetrics, reportDriver, cancelRide } from '@/lib/api/partner';
import { formatDate, formatDateTime, getPhoneDigits, getFloatColor, getInsuranceChipProps } from '@/lib/utils/format';
import { RIDE_STATUS_COLORS, RIDE_STATUS_LABELS, getColorByKey } from '@/constants';
import MetricCard from '@/components/partner/MetricCard';
import FloatModal from '@/components/partner/FloatModal';
import { usePartner } from '@/lib/hooks/usePartner';
import { apiClient } from '@/lib/api/client';

function SvgBarChart({ data, color = '#10B981' }) {
  if (!data || data.length === 0) return null;
  const maxEarnings = Math.max(...data.map((d) => d.earnings), 1);
  const W = 400, H = 120, BAR_W = Math.max(8, W / data.length - 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      {data.map((d, i) => {
        const barH = (d.earnings / maxEarnings) * (H - 30);
        const x = (i / data.length) * W + 2;
        const y = H - 20 - barH;
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={BAR_W} height={barH} fill={color} opacity={0.7} rx={3} />
            <text x={x + BAR_W / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)">
              {d.date?.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const PAGE_SIZE = 8;
const FLOAT_PAGE_SIZE = 15;
const RIDE_STATUSES = ['pending', 'accepted', 'arrived', 'passenger_onboard', 'awaiting_payment', 'completed', 'cancelled', 'no_drivers_available'];

// Normalize Strapi v4 { id, attributes } → flat, recursively flattening relations
function norm(entry) {
  if (!entry) return null;
  if (!entry.attributes) return entry;
  const attrs = { ...entry.attributes };
  Object.keys(attrs).forEach(k => {
    const v = attrs[k];
    if (v && typeof v === 'object' && 'data' in v) {
      if (v.data === null) attrs[k] = null;
      else if (Array.isArray(v.data)) attrs[k] = v.data.map(norm);
      else attrs[k] = norm(v.data);
    }
  });
  return { id: entry.id, ...attrs };
}
const normList = (list) => (list ?? []).map(norm).filter(Boolean);

export default function DriverDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { currency, dashboard } = usePartner();
  const partnerBalance = dashboard?.partnerProfile?.floatBalance ?? 0;

  const [tab, setTab] = useState(0);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [floatModal, setFloatModal] = useState(null);

  // Report
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  // Cancel ride
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Assign vehicle
  const [vehicles, setVehicles] = useState([]);
  const [assignVehicleId, setAssignVehicleId] = useState('');
  const [assignAccountType, setAssignAccountType] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Float history
  const [floatEntries, setFloatEntries] = useState([]);
  const [floatLoading, setFloatLoading] = useState(false);
  const [floatPage, setFloatPage] = useState(1);
  const [floatHasMore, setFloatHasMore] = useState(false);

  // Rides
  const [driverRides, setDriverRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [ridesPage, setRidesPage] = useState(1);
  const [ridesHasMore, setRidesHasMore] = useState(false);
  const [ridesStatusFilter, setRidesStatusFilter] = useState('');

  // Deliveries
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [deliveriesPage, setDeliveriesPage] = useState(1);
  const [deliveriesHasMore, setDeliveriesHasMore] = useState(false);
  const [deliveriesStatusFilter, setDeliveriesStatusFilter] = useState('');

  // ── Main driver data ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDriverMetrics(Number(id), period);
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load driver');
    } finally {
      setLoading(false);
    }
  }, [id, period]);

  useEffect(() => { load(); }, [load]);

  // ── Float history via ledger-entries ──────────────────────────────────────
  const loadFloatHistory = useCallback(async (page = 1, append = false) => {
    setFloatLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('filters[driver][id][$eq]', id);
      params.append('filters[type][$in][0]', 'float_topup-partner');
      params.append('filters[type][$in][1]', 'float_debit-partner');
      params.append('sort[0]', 'createdAt:desc');
      params.append('pagination[page]', String(page));
      params.append('pagination[pageSize]', String(FLOAT_PAGE_SIZE));
      const test = await apiClient.get(
        `/ledger-entries/partner-floats/${id}?page=${page}&pageSize=15`
      );
      console.log('test', test)
      const res = await apiClient.get(`/ledger-entries?${params.toString()}`);
      console.log('res', res)
      const entries = normList(res?.data ?? []);
      const total = res?.meta?.pagination?.total ?? 0;

      if (append) setFloatEntries(prev => [...prev, ...entries]);
      else setFloatEntries(entries);
      setFloatHasMore(page * FLOAT_PAGE_SIZE < total);
      setFloatPage(page);
    } catch (e) {
      console.warn('loadFloatHistory:', e);
    } finally {
      setFloatLoading(false);
    }
  }, [id]);

  // ── Driver rides ──────────────────────────────────────────────────────────
  const loadDriverRides = useCallback(async (page = 1, append = false, statusFilter = '') => {
    setRidesLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('filters[driver][id][$eq]', id);
      if (statusFilter) params.append('filters[rideStatus][$eq]', statusFilter);
      params.append('sort[0]', 'createdAt:desc');
      params.append('pagination[page]', String(page));
      params.append('pagination[pageSize]', String(PAGE_SIZE));
      params.append('fields[0]', 'rideCode');
      params.append('fields[1]', 'rideStatus');
      params.append('fields[2]', 'totalFare');
      params.append('fields[3]', 'paymentMethod');
      params.append('fields[4]', 'createdAt');
      params.append('fields[5]', 'rideType');
      params.append('populate[rider][fields][0]', 'firstName');
      params.append('populate[rider][fields][1]', 'lastName');

      const res = await apiClient.get(`/rides?${params.toString()}`);
      const entries = normList(res?.data ?? []);
      const total = res?.meta?.pagination?.total ?? 0;

      if (append) setDriverRides(prev => [...prev, ...entries]);
      else setDriverRides(entries);
      setRidesHasMore(page * PAGE_SIZE < total);
      setRidesPage(page);
    } catch (e) {
      console.warn('loadDriverRides:', e);
    } finally {
      setRidesLoading(false);
    }
  }, [id]);

  // ── Driver deliveries ─────────────────────────────────────────────────────
  const loadDriverDeliveries = useCallback(async (page = 1, append = false, statusFilter = '') => {
    setDeliveriesLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('filters[deliverer][id][$eq]', id);
      if (statusFilter) params.append('filters[rideStatus][$eq]', statusFilter);
      params.append('sort[0]', 'createdAt:desc');
      params.append('pagination[page]', String(page));
      params.append('pagination[pageSize]', String(PAGE_SIZE));
      params.append('fields[0]', 'rideCode');
      params.append('fields[1]', 'rideStatus');
      params.append('fields[2]', 'totalFare');
      params.append('fields[3]', 'paymentMethod');
      params.append('fields[4]', 'createdAt');
      params.append('populate[sender][fields][0]', 'firstName');
      params.append('populate[sender][fields][1]', 'lastName');

      const res = await apiClient.get(`/deliveries?${params.toString()}`);
      const entries = normList(res?.data ?? []);
      const total = res?.meta?.pagination?.total ?? 0;

      if (append) setDeliveries(prev => [...prev, ...entries]);
      else setDeliveries(entries);
      setDeliveriesHasMore(page * PAGE_SIZE < total);
      setDeliveriesPage(page);
    } catch (e) {
      console.warn('loadDriverDeliveries:', e);
    } finally {
      setDeliveriesLoading(false);
    }
  }, [id]);

  // Tab-triggered loads
  useEffect(() => {
    if (tab === 2) loadFloatHistory(1, false);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab !== 3) return;
    setDriverRides([]);
    loadDriverRides(1, false, ridesStatusFilter);
  }, [tab, ridesStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab !== 4) return;
    setDeliveries([]);
    loadDriverDeliveries(1, false, deliveriesStatusFilter);
  }, [tab, deliveriesStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load vehicles with color when Actions tab opens
  useEffect(() => {
    if (tab !== 5) return;
    const params = new URLSearchParams();
    params.append('fields[0]', 'id');
    params.append('fields[1]', 'numberPlate');
    params.append('fields[2]', 'make');
    params.append('fields[3]', 'model');
    params.append('fields[4]', 'color');
    params.append('populate[assignedDriver][fields][0]', 'id');
    params.append('pagination[pageSize]', '200');
    apiClient.get(`/vehicles?${params.toString()}`)
      .then(res => setVehicles(normList(res?.data ?? [])))
      .catch(() => setVehicles([]));
  }, [tab]);

  const driver = data?.driver;
  const metrics = data?.metrics;
  const dailyBreakdown = data?.dailyBreakdown ?? [];
  const activeRide = data?.activeRide;
  const digits = driver ? getPhoneDigits(driver.phoneNumber) : '';
  const vehicle = driver?.assignedVehicle;
  const insuranceChip = getInsuranceChipProps(vehicle?.insuranceExpiryDate);

  const handleReport = async () => {
    setReporting(true);
    try {
      await reportDriver(Number(id), reportReason, reportDetails || undefined);
      setReportDone(true);
      setReportOpen(false);
    } catch (e) { alert(e.message); }
    finally { setReporting(false); }
  };

  const handleCancelRide = async () => {
    setCancelling(true);
    try {
      await cancelRide(activeRide.id, cancelReason, false);
      setCancelOpen(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setCancelling(false); }
  };

  const handleAssignVehicle = async () => {
    if (!assignVehicleId || !assignAccountType) return;
    setAssigning(true);
    try {
      const endpoint = assignAccountType === 'delivery'
        ? '/delivery-driver/assign-vehicle'
        : '/driver/assign-vehicle';
      await apiClient.post(endpoint, {
        driverId: Number(id),
        vehicleId: Number(assignVehicleId),
      });
      load();
      setAssignVehicleId('');
      setAssignAccountType('');
    } catch (e) { alert(e.message); }
    finally { setAssigning(false); }
  };

  const renderStatusChip = (s) => {
    const color = RIDE_STATUS_COLORS[s] ?? '#6B7280';
    return (
      <Chip label={RIDE_STATUS_LABELS[s] ?? s} size="small"
        sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: color + '22', color, border: `1px solid ${color}44` }} />
    );
  };

  if (loading && !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => router.back()} sx={{ color: 'rgba(255,255,255,0.5)' }}><BackIcon /></IconButton>
        <Avatar sx={{ width: 48, height: 48, bgcolor: '#059669', fontWeight: 800, fontSize: '1.1rem' }}>
          {driver?.firstName?.[0]}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
              {driver?.firstName} {driver?.lastName}
            </Typography>
            <Chip label={driver?.status} size="small"
              color={driver?.status === 'ONLINE' ? 'success' : driver?.status === 'ON_TRIP' ? 'error' : 'default'}
              sx={{ fontWeight: 700 }} />
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{driver?.phoneNumber}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button href={`tel:${digits}`} component="a" variant="outlined" startIcon={<PhoneIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>Call</Button>
          <Button href={`https://wa.me/${digits}`} target="_blank" component="a" variant="outlined" startIcon={<WaIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>WhatsApp</Button>
        </Box>
      </Box>

      {reportDone && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setReportDone(false)}>
          Report submitted to Okra support.
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600 }, '& .Mui-selected': { color: '#10B981' }, '& .MuiTabs-indicator': { bgcolor: '#10B981' } }}>
          <Tab label="Overview" />
          <Tab label="Metrics" />
          <Tab label="Float History" />
          <Tab label="Rides" />
          <Tab label="Deliveries" />
          <Tab label="Actions" />
        </Tabs>
      </Box>

      {/* ── Overview ── */}
      {tab === 0 && (
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3, background: `linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(4,120,87,0.08) 100%)`, border: '1px solid rgba(5,150,105,0.2)' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>Float Balance</Typography>
            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 800, color: getFloatColor(driver?.floatBalance ?? 0) }}>
              {currency}{Number(driver?.floatBalance ?? 0).toFixed(2)}
            </Typography>
          </Paper>

          {activeRide && (
            <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(185,28,28,0.04) 100%)', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444', animation: 'livePulse 1.5s ease-in-out infinite', '@keyframes livePulse': { '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.7)' }, '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' } } }} />
              <Typography sx={{ fontWeight: 700, color: '#EF4444', fontSize: '0.75rem', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>Active Trip In Progress</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2, '& > *': { minWidth: 0 } }}>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>From</Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{activeRide.pickupLocation?.address}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>To</Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{activeRide.dropoffLocation?.address}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Rider: {activeRide.rider?.firstName} {activeRide.rider?.lastName}</Typography>
                  <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#10B981', fontSize: '1.1rem' }}>
                    {currency}{Number(activeRide.totalFare).toFixed(2)}
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" color="error" onClick={() => setCancelOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 700 }}>Cancel Ride</Button>
              </Box>
            </Paper>
          )}

          {vehicle && (
            <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>Assigned Vehicle</Typography>
              <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.8rem', fontWeight: 800, letterSpacing: 3, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
                {vehicle.numberPlate}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>{vehicle.make} {vehicle.model} · {vehicle.color}</Typography>
              <Chip label={insuranceChip.label} color={insuranceChip.color} size="small" sx={{ fontWeight: 700 }} />
            </Paper>
          )}

          {/* Stats — 4-col on md, 2-col on xs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, '& > *': { minWidth: 0 } }}>
            <MetricCard label="Total Rides" value={driver?.totalRides ?? 0} color="blue" />
            <MetricCard label="Completion Rate" value={`${driver?.totalRides > 0 ? Math.round((driver.completedRides / driver.totalRides) * 100) : 0}%`} color="green" />
            <MetricCard label="Avg Rating" value={`⭐ ${Number(driver?.averageRating ?? 0).toFixed(1)}`} color="orange" />
            <MetricCard label="Member Since" value={driver?.createdAt ? formatDate(driver.createdAt) : '—'} color="purple" />
          </Box>
        </Box>
      )}

      {/* ── Metrics ── */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {['today', 'week', 'month'].map((p) => (
              <Button key={p} variant={period === p ? 'contained' : 'outlined'} size="small"
                onClick={() => setPeriod(p)} sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'capitalize' }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3, '& > *': { minWidth: 0 } }}>
            <MetricCard label="Rides Completed" value={metrics?.ridesCompleted ?? 0} color="blue" />
            <MetricCard label="Total Earnings" value={`${currency}${Number(metrics?.totalEarnings ?? 0).toFixed(0)}`} color="green" />
            <MetricCard label="Commission Paid" value={`${currency}${Number(metrics?.totalCommission ?? 0).toFixed(0)}`} color="orange" />
            <MetricCard label="Deliveries Done" value={metrics?.deliveriesCompleted ?? 0} color="purple" />
            <MetricCard label="Distance (km)" value={Number(metrics?.totalDistance ?? 0).toFixed(1)} color="cyan" />
            <MetricCard label="Cash Rides" value={metrics?.cashTransactions ?? 0} color="red" />
          </Box>
          {dailyBreakdown.length > 0 && (
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Daily Earnings</Typography>
              <SvgBarChart data={dailyBreakdown} color="#10B981" />
            </Paper>
          )}
        </Box>
      )}

      {/* ── Float History ── */}
      {tab === 2 && (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell>Balance After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {floatLoading && floatEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : floatEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No float history</TableCell></TableRow>
                ) : (
                  floatEntries.map((e) => {
                    const isCredit = e.type === 'float_topup-partner';
                    return (
                      <TableRow key={e.id}>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{formatDateTime(e.createdAt)}</TableCell>
                        <TableCell>
                          <Chip label={isCredit ? 'CREDIT' : 'DEBIT'} size="small" color={isCredit ? 'success' : 'error'} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isCredit ? '#10B981' : '#EF4444' }}>
                          {isCredit ? '+' : '-'}{currency}{Number(e.amount).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{e.description}</TableCell>
                        <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", color: getFloatColor(e.balanceAfter ?? 0), fontWeight: 700 }}>
                          {currency}{Number(e.balanceAfter ?? 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {floatHasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="outlined" disabled={floatLoading}
                onClick={() => loadFloatHistory(floatPage + 1, true)}
                sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                {floatLoading ? <CircularProgress size={18} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* ── Rides ── */}
      {tab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select value={ridesStatusFilter} label="Status" onChange={(e) => setRidesStatusFilter(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                {RIDE_STATUSES.map(s => <MenuItem key={s} value={s}>{RIDE_STATUS_LABELS[s] ?? s}</MenuItem>)}
              </Select>
            </FormControl>
            <Button size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, ml: 'auto' }}
              onClick={() => router.push(`/partner/rides?driverId=${id}`)}>
              View All in Rides Page →
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Rider</TableCell>
                  <TableCell>Fare</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {ridesLoading && driverRides.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : driverRides.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No rides found</TableCell></TableRow>
                ) : (
                  driverRides.map((r) => (
                    <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/partner/rides/${r.id}`)}>
                      <TableCell>
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.8rem', color: '#F59E0B', letterSpacing: 1 }}>
                          {r.rideCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{renderStatusChip(r.rideStatus)}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        {r.rider?.firstName ? `${r.rider.firstName} ${r.rider.lastName}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.85rem', color: '#10B981' }}>
                          {currency}{Number(r.totalFare ?? 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{formatDateTime(r.createdAt)}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.7rem' }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {ridesHasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="outlined" disabled={ridesLoading}
                onClick={() => loadDriverRides(ridesPage + 1, true, ridesStatusFilter)}
                sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                {ridesLoading ? <CircularProgress size={18} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* ── Deliveries ── */}
      {tab === 4 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select value={deliveriesStatusFilter} label="Status" onChange={(e) => setDeliveriesStatusFilter(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                {RIDE_STATUSES.map(s => <MenuItem key={s} value={s}>{RIDE_STATUS_LABELS[s] ?? s}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sender</TableCell>
                  <TableCell>Fee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveriesLoading && deliveries.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : deliveries.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No deliveries found</TableCell></TableRow>
                ) : (
                  deliveries.map((d) => (
                    <TableRow key={d.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/partner/rides/${d.id}?isDelivery=true`)}>
                      <TableCell>
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.8rem', color: '#8B5CF6', letterSpacing: 1 }}>
                          {d.rideCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{renderStatusChip(d.rideStatus)}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        {d.sender?.firstName ? `${d.sender.firstName} ${d.sender.lastName}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.85rem', color: '#10B981' }}>
                          {currency}{Number(d.totalFare ?? 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{formatDateTime(d.createdAt)}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.7rem' }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {deliveriesHasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="outlined" disabled={deliveriesLoading}
                onClick={() => loadDriverDeliveries(deliveriesPage + 1, true, deliveriesStatusFilter)}
                sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                {deliveriesLoading ? <CircularProgress size={18} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* ── Actions ── */}
      {tab === 5 && (
        <Box>
          {/* 2-col on sm+, 1-col on xs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2, '& > *': { minWidth: 0 } }}>
            {/* Float Management */}
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Float Management</Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="contained" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }} onClick={() => setFloatModal('CREDIT')}>
                  💰 Add Float
                </Button>
                <Button variant="outlined" color="error" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }} onClick={() => setFloatModal('DEBIT')}>
                  ➖ Remove
                </Button>
              </Box>
            </Paper>

            {/* Assign Vehicle */}
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Assign Vehicle</Typography>

              <FormControl fullWidth size="small" sx={{ mb: assignVehicleId ? 2 : 0 }}>
                <InputLabel>Select Vehicle</InputLabel>
                <Select value={assignVehicleId} label="Select Vehicle"
                  onChange={(e) => { setAssignVehicleId(e.target.value); setAssignAccountType(''); }}>
                  <MenuItem value="">— None —</MenuItem>
                  {vehicles
                    .filter(v => {
                      const assignedId = v.assignedDriver?.id ?? v.assignedDriver;
                      return !assignedId || Number(assignedId) === Number(id);
                    })
                    .map(v => {
                      const colorObj = getColorByKey(v.color?.toLowerCase() ?? '');
                      return (
                        <MenuItem key={v.id} value={v.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {v.color && (
                              <Box sx={{
                                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                bgcolor: colorObj?.body ?? '#ccc',
                                border: `1px solid ${colorObj?.outline ?? '#999'}`,
                              }} />
                            )}
                            <span>{v.numberPlate} · {v.make} {v.model}{v.color ? ` · ${v.color}` : ''}</span>
                          </Box>
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>

              {/* Account type picker — appears once a vehicle is chosen */}
              {assignVehicleId && (
                <>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', mb: 1.5 }}>
                    Assign vehicle to:
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2, '& > *': { minWidth: 0 } }}>
                    <Paper elevation={0} onClick={() => setAssignAccountType('driver')}
                      sx={{
                        p: 1.5, borderRadius: 2.5, cursor: 'pointer',
                        border: `2px solid ${assignAccountType === 'driver' ? '#10B981' : 'rgba(16,185,129,0.25)'}`,
                        background: assignAccountType === 'driver' ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.04)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                        transition: 'all 0.18s ease',
                        '&:hover': { borderColor: '#10B981', background: 'rgba(16,185,129,0.1)' },
                      }}>
                      <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.8rem', textAlign: 'center' }}>Driver Account</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.3 }}>Ride driver</Typography>
                    </Paper>
                    <Paper elevation={0} onClick={() => setAssignAccountType('delivery')}
                      sx={{
                        p: 1.5, borderRadius: 2.5, cursor: 'pointer',
                        border: `2px solid ${assignAccountType === 'delivery' ? '#F59E0B' : 'rgba(245,158,11,0.25)'}`,
                        background: assignAccountType === 'delivery' ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.04)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                        transition: 'all 0.18s ease',
                        '&:hover': { borderColor: '#F59E0B', background: 'rgba(245,158,11,0.1)' },
                      }}>
                      <Typography sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.8rem', textAlign: 'center' }}>Courier Account</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.3 }}>Delivery driver</Typography>
                    </Paper>
                  </Box>
                  <Button variant="contained" fullWidth onClick={handleAssignVehicle}
                    disabled={!assignAccountType || assigning}
                    sx={{ borderRadius: 2.5, fontWeight: 700, height: 44 }}>
                    {assigning ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Assign Vehicle'}
                  </Button>
                </>
              )}
            </Paper>
          </Box>

          {/* Report Driver — full width */}
          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(239,68,68,0.2)' }}>
            <Typography sx={{ fontWeight: 700, color: '#EF4444', mb: 2 }}>Report Driver</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 2 }}>
              Submit a report to Okra admin. This sends an email and SMS to all admin contacts.
            </Typography>
            {reportDone ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>Report submitted successfully.</Alert>
            ) : (
              <Button variant="outlined" color="error" sx={{ borderRadius: 2.5, fontWeight: 700 }} onClick={() => setReportOpen(true)}>
                📋 Submit Report
              </Button>
            )}
          </Paper>
        </Box>
      )}

      {/* Float modal */}
      {floatModal && (
        <FloatModal open={!!floatModal} onClose={() => setFloatModal(null)} driver={driver}
          partnerFloatBalance={partnerBalance} defaultAction={floatModal} currency={currency}
          onSuccess={() => { setFloatModal(null); load(); }} />
      )}

      {/* Report dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WarningIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            Report Driver
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Reason *" value={reportReason} onChange={(e) => setReportReason(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth multiline rows={3} label="Details (optional)" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setReportOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Go Back</Button>
          <Button onClick={handleReport} disabled={!reportReason.trim() || reporting} variant="contained" color="error" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
            {reporting ? <CircularProgress size={16} color="inherit" /> : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel ride dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WarningIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            Cancel This Ride?
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={2} label="Reason for cancellation" value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCancelOpen(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>Go Back</Button>
          <Button onClick={handleCancelRide} disabled={!cancelReason.trim() || cancelling} variant="contained" color="error"
            startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
            sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
            {cancelling ? 'Cancelling…' : 'Cancel Ride'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}