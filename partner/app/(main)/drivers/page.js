// PATH: appdrivers/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Chip, IconButton, Alert, Skeleton, useMediaQuery, useTheme, CircularProgress,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon, Visibility as ViewIcon,
  Phone as PhoneIcon, WhatsApp as WaIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { getDrivers } from '@/lib/api/partner';
import { getPhoneDigits, getFloatColor } from '@/lib/utils/format';
import { STATUS_CHIP_COLOR } from '@/constants';
import FloatModal from '@/components/partner/FloatModal';
import { usePartner } from '@/lib/hooks/usePartner';
import { motion } from 'framer-motion';

export default function DriversPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { dashboard, currency } = usePartner();

  const [drivers, setDrivers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [verStatus, setVerStatus] = useState('');
  const [page, setPage] = useState(1);
  const [floatModal, setFloatModal] = useState(null); // { driver, action }

  const partnerBalance = dashboard?.partnerProfile?.floatBalance ?? 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDrivers({ search, status, verificationStatus: verStatus, page });
      setDrivers(res?.data ?? []);
      setMeta(res?.meta?.pagination ?? null);
    } catch (e) {
      setError(e.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [search, status, verStatus, page]);

  useEffect(() => { load(); }, [load]);

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

  const renderVerChip = (s) => {
    const colors = { approved: 'success', pending: 'warning', rejected: 'error', suspended: 'error', not_started: 'default' };
    return (
      <Chip label={s?.toUpperCase()} size="small" color={colors[s] ?? 'default'}
        variant="outlined" sx={{ fontWeight: 700, fontSize: '0.6rem' }} />
    );
  };

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
            {meta?.total ?? 0} drivers registered
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => router.push('drivers/register')} sx={{ borderRadius: 2.5, fontWeight: 700 }}>
          Register Driver
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2.5 }}
          action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search name or phone…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <MenuItem value="">All</MenuItem>
            {['ONLINE', 'ON_TRIP', 'EN_ROUTE', 'OFFLINE', 'PENDING', 'SUSPENDED'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Verification</InputLabel>
          <Select value={verStatus} label="Verification" onChange={(e) => { setVerStatus(e.target.value); setPage(1); }}>
            <MenuItem value="">All</MenuItem>
            {['approved', 'pending', 'rejected', 'suspended', 'not_started'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
                <TableCell>Verification</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7}><CircularProgress size={24} /></TableCell></TableRow>
              ) : drivers.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>No drivers found</TableCell></TableRow>
              ) : (
                drivers.map((d) => {
                  const digits = getPhoneDigits(d.phoneNumber);
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
                        {d.assignedVehicle ? (
                          <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#F59E0B', letterSpacing: 1 }}>
                            {d.assignedVehicle.numberPlate}
                          </Typography>
                        ) : (
                          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Unassigned</Typography>
                        )}
                      </TableCell>
                      <TableCell>{renderVerChip(d.verificationStatus)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => router.push(`drivers/${d.id}`)} sx={{ color: '#3B82F6' }}>
                            <ViewIcon fontSize="small" />
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
          {drivers.map((d) => {
            const digits = getPhoneDigits(d.phoneNumber);
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
                  {d.assignedVehicle && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#F59E0B', fontFamily: "'JetBrains Mono', monospace", mb: 1.5 }}>
                      🚗 {d.assignedVehicle.numberPlate} · {d.assignedVehicle.make} {d.assignedVehicle.model}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                    <Button size="small" variant="outlined" color="success" onClick={() => setFloatModal({ driver: d, action: 'CREDIT' })} sx={{ flex: 1, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700 }}>💰 Add Float</Button>
                    <Button size="small" href={`tel:${digits}`} component="a" variant="outlined" sx={{ borderRadius: 2, minWidth: 44, fontWeight: 700 }}>📞</Button>
                    <Button size="small" href={`https://wa.me/${digits}`} target="_blank" component="a" variant="outlined" sx={{ borderRadius: 2, minWidth: 44, fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}>💬</Button>
                  </Box>
                </Paper>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1, alignItems: 'center' }}>
        <Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage((p) => p - 1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
          Previous
        </Button>
        <Typography sx={{ display: 'flex', alignItems: 'center', px: 2, color: 'text.secondary', fontSize: '0.85rem' }}>
          Page {page} of {totalPages}
        </Typography>
        <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} sx={{ borderRadius: 2, fontWeight: 600 }}>
          Next
        </Button>
      </Box>

      {/* Float modal */}
      {floatModal && (
        <FloatModal
          open={!!floatModal}
          onClose={() => setFloatModal(null)}
          driver={floatModal.driver}
          partnerFloatBalance={partnerBalance}
          defaultAction={floatModal.action}
          currency={currency}
          onSuccess={() => { setFloatModal(null); load(); }}
        />
      )}
    </Box>
  );
}
