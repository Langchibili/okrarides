// PATH: apprides/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Alert, CircularProgress, Tabs, Tab,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFleetRides, getPartnerFleetItems } from '@/lib/api/partner';
import { formatDateTime, formatCurrency } from '@/lib/utils/format';
import { RIDE_STATUS_COLORS, RIDE_STATUS_LABELS } from '@/constants';
import { usePartner } from '@/lib/hooks/usePartner';

const STATUS_OPTIONS = ['', 'pending', 'accepted', 'arrived', 'passenger_onboard', 'completed', 'cancelled'];

export default function RidesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = usePartner();

  const [type, setType] = useState('all');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [rides, setRides] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const driverIdFilter = searchParams.get('driverId');

  // const load = useCallback(async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const res = await getFleetRides({
  //       type,
  //       status: status || undefined,
  //       driverId: driverIdFilter ? parseInt(driverIdFilter) : undefined,
  //       page,
  //     });
  //     setRides(res?.data ?? [])
  //     setMeta(res?.meta?.pagination ?? null);
  //   } catch (e) {
  //     setError(e.message || 'Failed to load rides');
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [type, status, page, driverIdFilter]);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPartnerFleetItems({
        type,
        status: status || undefined,
        driverId: driverIdFilter ? parseInt(driverIdFilter) : undefined,
        page,
        pageSize: 20, // or your PAGE_SIZE constant
      });
      setRides(res?.data ?? res ?? []);
      setMeta(res?.meta?.pagination ?? null);
    } catch (e) {
      setError(e.message || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  }, [type, status, page, driverIdFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

  const renderStatusChip = (s) => (
    <Chip
      label={RIDE_STATUS_LABELS[s] ?? s}
      size="small"
      sx={{
        fontWeight: 700, fontSize: '0.65rem',
        bgcolor: (RIDE_STATUS_COLORS[s] ?? '#6B7280') + '22',
        color: RIDE_STATUS_COLORS[s] ?? '#6B7280',
        border: `1px solid ${(RIDE_STATUS_COLORS[s] ?? '#6B7280')}44`,
      }}
    />
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>Fleet Rides & Deliveries</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
          {meta?.total ?? 0} records {driverIdFilter ? `· Driver #${driverIdFilter}` : ''}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2.5 }}
          action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Filter tabs */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 3 }}>
        <Tabs
          value={type}
          onChange={(_, v) => { setType(v); setPage(1); }}
          sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600 }, '& .Mui-selected': { color: '#10B981' }, '& .MuiTabs-indicator': { bgcolor: '#10B981' } }}
        >
          <Tab label="All" value="all" />
          <Tab label="🚗 Rides" value="rides" />
          <Tab label="📦 Deliveries" value="deliveries" />
        </Tabs>
      </Box>

      {/* Status filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <MenuItem value="">All Statuses</MenuItem>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <MenuItem key={s} value={s}>{RIDE_STATUS_LABELS[s] ?? s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {driverIdFilter && (
          <Button size="small" variant="outlined" onClick={() => router.push('rides')} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Clear Driver Filter
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Rider / Sender</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Fare</TableCell>
              <TableCell>Date</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} sx={{ color: '#10B981' }} />
                </TableCell>
              </TableRow>
            ) : rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: 'rgba(255,255,255,0.4)', py: 4 }}>
                  No rides found
                </TableCell>
              </TableRow>
            ) : (
              rides.map((r) => {
                const isDelivery = r.recordType === 'delivery';
                const driver = r.driver || r.deliverer;
                const rider = r.rider || r.sender;
                return (
                  <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`rides/${r.id}${isDelivery ? '?isDelivery=true' : ''}`)}>
                    <TableCell>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.8rem', color: '#F59E0B', letterSpacing: 1 }}>
                        {r.rideCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isDelivery ? '📦 Delivery' : '🚗 Ride'}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.65rem',
                          bgcolor: isDelivery ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
                          color: isDelivery ? '#8B5CF6' : '#3B82F6',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                      {driver ? `${driver.firstName} ${driver.lastName}` : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                      {rider ? `${rider.firstName} ${rider.lastName}` : '—'}
                    </TableCell>
                    <TableCell>{renderStatusChip(r.rideStatus)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.85rem', color: '#10B981' }}>
                        {currency}{Number(r.totalFare).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      {formatDateTime(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.7rem' }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Box>
  );
}
