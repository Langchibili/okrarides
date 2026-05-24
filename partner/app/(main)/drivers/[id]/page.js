// PATH: appdrivers/[id]/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Avatar, Chip, Button,
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
import { getDriverMetrics, modifyDriverFloat, reportDriver, cancelRide, getVehicles, assignVehicle } from '@/lib/api/partner';
import { formatCurrency, formatDate, formatDateTime, getPhoneDigits, getFloatColor, getInsuranceChipProps } from '@/lib/utils/format';
import { RIDE_STATUS_COLORS, RIDE_STATUS_LABELS } from '@/constants';
import MetricCard from '@/components/partner/MetricCard';
import FloatModal from '@/components/partner/FloatModal';
import { usePartner } from '@/lib/hooks/usePartner';

// Simple SVG bar chart for daily breakdown
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

  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  // Cancel ride dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Assign vehicle
  const [vehicles, setVehicles] = useState([]);
  const [assignVehicleId, setAssignVehicleId] = useState('');
  const [assigning, setAssigning] = useState(false);

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

  useEffect(() => {
    if (tab === 4) {
      getVehicles().then((res) => setVehicles(res?.data ?? []));
    }
  }, [tab]);

  const driver = data?.driver;
  const metrics = data?.metrics;
  const floatHistory = data?.floatHistory ?? [];
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
    } catch (e) {
      alert(e.message);
    } finally {
      setReporting(false);
    }
  };

  const handleCancelRide = async () => {
    setCancelling(true);
    try {
      await cancelRide(activeRide.id, cancelReason, false);
      setCancelOpen(false);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleAssignVehicle = async () => {
    if (!assignVehicleId) return;
    setAssigning(true);
    try {
      await assignVehicle(Number(assignVehicleId), Number(id));
      load();
      setAssignVehicleId('');
    } catch (e) {
      alert(e.message);
    } finally {
      setAssigning(false);
    }
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
            <Chip
              label={driver?.status}
              size="small"
              color={driver?.status === 'ONLINE' ? 'success' : driver?.status === 'ON_TRIP' ? 'error' : 'default'}
              sx={{ fontWeight: 700 }}
            />
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
            {driver?.phoneNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button href={`tel:${digits}`} component="a" variant="outlined" startIcon={<PhoneIcon />} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            Call
          </Button>
          <Button href={`https://wa.me/${digits}`} target="_blank" component="a" variant="outlined" startIcon={<WaIcon />} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>
            WhatsApp
          </Button>
        </Box>
      </Box>

      {reportDone && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }} onClose={() => setReportDone(false)}>
          Report submitted to Okra support.
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600 }, '& .Mui-selected': { color: '#10B981' }, '& .MuiTabs-indicator': { bgcolor: '#10B981' } }}>
          <Tab label="Overview" />
          <Tab label="Metrics" />
          <Tab label="Float History" />
          <Tab label="Rides" />
          <Tab label="Actions" />
        </Tabs>
      </Box>

      {/* ── Overview ── */}
      {tab === 0 && (
        <Box>
          {/* Float balance hero */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3, background: `linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(4,120,87,0.08) 100%)`, border: '1px solid rgba(5,150,105,0.2)' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>Float Balance</Typography>
            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 800, color: getFloatColor(driver?.floatBalance ?? 0) }}>
              {currency}{Number(driver?.floatBalance ?? 0).toFixed(2)}
            </Typography>
          </Paper>

          {/* Active ride card */}
          {activeRide && (
            <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(185,28,28,0.04) 100%)', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444', animation: 'livePulse 1.5s ease-in-out infinite', '@keyframes livePulse': { '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.7)' }, '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' } } }} />
              <Typography sx={{ fontWeight: 700, color: '#EF4444', fontSize: '0.75rem', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Active Trip In Progress
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', mb: 0.25 }}>From</Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{activeRide.pickupLocation?.address}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
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
                <Button size="small" variant="outlined" color="error" onClick={() => setCancelOpen(true)} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
                  Cancel Ride
                </Button>
              </Box>
            </Paper>
          )}

          {/* Vehicle card */}
          {vehicle && (
            <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
                Assigned Vehicle
              </Typography>
              <Typography sx={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '1.8rem', fontWeight: 800, letterSpacing: 3,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', mb: 1,
              }}>
                {vehicle.numberPlate}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                {vehicle.make} {vehicle.model} · {vehicle.color}
              </Typography>
              <Chip label={insuranceChip.label} color={insuranceChip.color} size="small" sx={{ fontWeight: 700 }} />
            </Paper>
          )}

          {/* Stats row */}
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <MetricCard label="Total Rides" value={driver?.totalRides ?? 0} color="blue" />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard
                label="Completion Rate"
                value={`${driver?.totalRides > 0 ? Math.round((driver.completedRides / driver.totalRides) * 100) : 0}%`}
                color="green"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="Avg Rating" value={`⭐ ${Number(driver?.averageRating ?? 0).toFixed(1)}`} color="orange" />
            </Grid>
            <Grid item xs={6} md={3}>
              <MetricCard label="Member Since" value={driver?.createdAt ? formatDate(driver.createdAt) : '—'} color="purple" />
            </Grid>
          </Grid>
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
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={4}><MetricCard label="Rides Completed" value={metrics?.ridesCompleted ?? 0} color="blue" /></Grid>
            <Grid item xs={6} md={4}><MetricCard label="Total Earnings" value={`${currency}${Number(metrics?.totalEarnings ?? 0).toFixed(0)}`} color="green" /></Grid>
            <Grid item xs={6} md={4}><MetricCard label="Commission Paid" value={`${currency}${Number(metrics?.totalCommission ?? 0).toFixed(0)}`} color="orange" /></Grid>
            <Grid item xs={6} md={4}><MetricCard label="Deliveries Done" value={metrics?.deliveriesCompleted ?? 0} color="purple" /></Grid>
            <Grid item xs={6} md={4}><MetricCard label="Distance (km)" value={Number(metrics?.totalDistance ?? 0).toFixed(1)} color="cyan" /></Grid>
            <Grid item xs={6} md={4}><MetricCard label="Cash Rides" value={metrics?.cashTransactions ?? 0} color="red" /></Grid>
          </Grid>
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
                {floatHistory.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No float history</TableCell></TableRow>
                ) : (
                  floatHistory
                    .filter((e) => ['float_topup-partner', 'float_debit-partner'].includes(e.type))
                    .map((e) => {
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
        </Box>
      )}

      {/* ── Rides ── */}
      {tab === 3 && (
        <Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, fontSize: '0.85rem' }}>
            Showing recent rides for this driver
          </Typography>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', py: 4 }}>
              View rides in the Rides section, filtering by this driver.
            </Typography>
            <Button variant="outlined" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700 }}
              onClick={() => router.push(`rides?driverId=${id}`)}>
              View All Rides for This Driver
            </Button>
          </Paper>
        </Box>
      )}

      {/* ── Actions ── */}
      {tab === 4 && (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Float Management</Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="contained" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }} onClick={() => setFloatModal('CREDIT')}>
                    💰 Add Float
                  </Button>
                  <Button variant="outlined" color="error" fullWidth sx={{ borderRadius: 2.5, fontWeight: 700, height: 48 }} onClick={() => setFloatModal('DEBIT')}>
                    ➖ Remove Float
                  </Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>Assign Vehicle</Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Vehicle</InputLabel>
                    <Select value={assignVehicleId} label="Select Vehicle" onChange={(e) => setAssignVehicleId(e.target.value)}>
                      <MenuItem value="">— None —</MenuItem>
                      {vehicles.filter((v) => !v.assignedDriver || v.assignedDriver.id === Number(id)).map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.numberPlate} · {v.make} {v.model}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={handleAssignVehicle} disabled={!assignVehicleId || assigning} sx={{ borderRadius: 2.5, fontWeight: 700, flexShrink: 0 }}>
                    {assigning ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Assign'}
                  </Button>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
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
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Float modal */}
      {floatModal && (
        <FloatModal
          open={!!floatModal}
          onClose={() => setFloatModal(null)}
          driver={driver}
          partnerFloatBalance={partnerBalance}
          defaultAction={floatModal}
          currency={currency}
          onSuccess={() => { setFloatModal(null); load(); }}
        />
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
          <Button onClick={handleCancelRide} disabled={!cancelReason.trim() || cancelling} variant="contained" color="error" startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />} sx={{ flex: 1, borderRadius: 2.5, fontWeight: 700 }}>
            {cancelling ? 'Cancelling…' : 'Cancel Ride'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
