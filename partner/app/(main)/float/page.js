// PATH: app/partner/float/page.js
'use client';
import { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Chip, Alert,
  CircularProgress, Avatar, Snackbar, Skeleton,
} from '@mui/material';
import { getDrivers, modifyDriverFloat } from '@/lib/api/partner';
import { getFloatColor, formatDateTime } from '@/lib/utils/format';
import { usePartner } from '@/lib/hooks/usePartner';
import { usePartnerSocketContext } from '@/lib/socket/PartnerSocketProvider';
import FloatModal from '@/components/partner/FloatModal';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import OkraPayModal from '@/components/OkraPay/OkraPayModal';

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

export default function FloatPage() {
  const {
    dashboard, currency, currencyCode, phoneCode, acceptedMM,
    refreshDashboard, loading: partnerLoading,
  } = usePartner();
  const { partnerFloatBalance: socketBalance } = usePartnerSocketContext();
  const { settings } = useAdminSettings();

  const [buyAmount, setBuyAmount] = useState('');
  const [buyError, setBuyError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [floatModal, setFloatModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [quickLoading, setQuickLoading] = useState({});

  const partnerProfile = dashboard?.partnerProfile;
  const displayBalance = socketBalance ?? partnerProfile?.floatBalance ?? 0;
  const floatHistory = dashboard?.recentFloatActivity ?? [];

  const minTopup = settings?.minimumFloatTopup ?? 50;
  const maxTopup = settings?.maximumFloatTopup ?? 50000;
  const numBuyAmount = parseFloat(buyAmount) || 0;

  const loadDrivers = useCallback(async () => {
    setDriversLoading(true);
    try {
      const res = await getDrivers({ pageSize: 100 });
      const sorted = (res?.data ?? []).sort((a, b) => a.floatBalance - b.floatBalance);
      setDrivers(sorted);
    } finally {
      setDriversLoading(false);
    }
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  // ── Validate and open OkraPay modal — no pre-call needed ──────────────────
  const handleBuyFloat = () => {
    setBuyError(null);
    if (numBuyAmount < minTopup) { setBuyError(`Minimum top-up is ${currency}${minTopup}`); return; }
    if (numBuyAmount > maxTopup) { setBuyError(`Maximum top-up is ${currency}${maxTopup}`); return; }
    setModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setModalOpen(false);
    setBuyAmount('');
    refreshDashboard();
    setToast({ msg: 'Float top-up successful! Your balance will update shortly.', severity: 'success' });
  };

  const handlePaymentError = (err) => {
    setModalOpen(false);
    setBuyError(err?.message || 'Payment failed — please try again.');
  };

  const handleQuickCredit = async (driverId, amount) => {
    setQuickLoading(prev => ({ ...prev, [driverId]: true }));
    try {
      await modifyDriverFloat(driverId, 'CREDIT', amount);
      setToast({ msg: `${currency}${amount} sent successfully!`, severity: 'success' });
      refreshDashboard();
      loadDrivers();
    } catch (e) {
      setToast({ msg: e.message || 'Failed to send float', severity: 'error' });
    } finally {
      setQuickLoading(prev => ({ ...prev, [driverId]: false }));
    }
  };

  if (partnerLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 3 }}>Float / Wallet</Typography>

      {/* Hero balance card */}
      <Paper sx={{
        mb: 3, p: 3.5, borderRadius: 3,
        background: `linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
          Partner Float Balance
        </Typography>
        <Typography sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: { xs: '2.2rem', md: '3rem' },
          fontWeight: 800, color: '#fff', lineHeight: 1, mb: 0.5,
        }}>
          {currency}{Number(displayBalance).toFixed(2)}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
          Available to distribute to your fleet
        </Typography>
      </Paper>

      {/* Main two-column layout */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
        gap: 3,
        alignItems: 'start',
        '& > *': { minWidth: 0 },
      }}>

        {/* Left: Buy float + Recent activity */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>Buy Float</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 2.5 }}>
              Min: {currency}{minTopup} · Max: {currency}{maxTopup?.toLocaleString()}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {QUICK_AMOUNTS.map((v) => (
                <Chip
                  key={v}
                  label={`${currency}${v.toLocaleString()}`}
                  size="small"
                  onClick={() => { setBuyAmount(String(v)); setBuyError(null); }}
                  variant={buyAmount === String(v) ? 'filled' : 'outlined'}
                  color={buyAmount === String(v) ? 'success' : 'default'}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={buyAmount}
              onChange={(e) => { setBuyAmount(e.target.value); setBuyError(null); }}
              InputProps={{
                startAdornment: (
                  <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>{currency}</Typography>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {buyError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{buyError}</Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleBuyFloat}
              disabled={numBuyAmount <= 0}
              sx={{ height: 52, borderRadius: 2.5, fontWeight: 700, fontSize: '0.95rem' }}
            >
              {`Buy Float — ${currency}${numBuyAmount.toFixed(2)}`}
            </Button>
          </Paper>

          {floatHistory.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>Recent Activity</Typography>
              {floatHistory.slice(0, 8).map((entry) => {
                const isCredit = entry.type === 'float_topup-partner';
                return (
                  <Box key={entry.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isCredit ? '#10B981' : '#EF4444', flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }} noWrap>
                        {entry.driver?.firstName} {entry.driver?.lastName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        {entry.createdAt ? formatDateTime(entry.createdAt) : ''}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isCredit ? '#10B981' : '#EF4444', fontSize: '0.85rem', flexShrink: 0 }}>
                      {isCredit ? '+' : '-'}{currency}{Number(entry.amount).toFixed(2)}
                    </Typography>
                  </Box>
                );
              })}
            </Paper>
          )}
        </Box>

        {/* Right: Distribute float */}
        <Box>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#fff', mb: 0.5 }}>Distribute Float</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 2.5 }}>
              Sorted by lowest balance first
            </Typography>

            {driversLoading ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 2.5, mb: 1.5, bgcolor: 'rgba(255,255,255,0.05)' }} />
              ))
            ) : drivers.length === 0 ? (
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', py: 4 }}>No drivers found</Typography>
            ) : (
              drivers.map((driver) => (
                <Paper key={driver.id} sx={{ p: 2, borderRadius: 2.5, mb: 1.5, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Avatar sx={{ bgcolor: '#059669', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
                    {driver.firstName?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }} noWrap>
                      {driver.firstName} {driver.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: getFloatColor(driver.floatBalance), fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      {currency}{Number(driver.floatBalance).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
                    {[50, 100, 200].map((v) => (
                      <Chip key={v} label={`${currency}${v}`} size="small" variant="outlined"
                        disabled={quickLoading[driver.id]}
                        onClick={() => handleQuickCredit(driver.id, v)}
                        sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.65rem' }} />
                    ))}
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => setFloatModal(driver)}
                    disabled={quickLoading[driver.id]}
                    sx={{ borderRadius: 2, fontWeight: 700, flexShrink: 0, fontSize: '0.75rem' }}>
                    {quickLoading[driver.id] ? <CircularProgress size={14} /> : 'Custom'}
                  </Button>
                </Paper>
              ))
            )}
          </Paper>
        </Box>
      </Box>

      {/* FloatModal for distributing to drivers */}
      {floatModal && (
        <FloatModal
          open={!!floatModal}
          onClose={() => setFloatModal(null)}
          driver={floatModal}
          partnerFloatBalance={displayBalance}
          defaultAction="CREDIT"
          currency={currency}
          onSuccess={() => {
            setFloatModal(null);
            refreshDashboard();
            loadDrivers();
            setToast({ msg: 'Float sent!', severity: 'success' });
          }}
        />
      )}

      {/* OkraPay modal — no relatedEntityId needed; modal creates the intent inline */}
      <OkraPayModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        amount={numBuyAmount}
        purpose="floatadd"
        currency={currencyCode ?? 'ZMW'}
        phoneCode={phoneCode ?? '260'}
        acceptedMobileMoneyPayments={acceptedMM}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2.5 }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}