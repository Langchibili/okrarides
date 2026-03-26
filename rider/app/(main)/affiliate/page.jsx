'use client';
/**
 * Affiliate Dashboard
 * PATH: app/(main)/affiliate/page.jsx
 *
 * QR code is served directly from affiliateProfile.qrCode (uploaded at account creation).
 * No client-side QR generation — the `qrcode` npm package is not needed for this page.
 */

import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Paper,
  Button, TextField, Chip, Alert, Divider, List, ListItem,
  ListItemText, Tab, Tabs, CircularProgress, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, LinearProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  CheckCircle as CheckIcon,
  ErrorOutline as ErrorIcon,
  Phone as PhoneIcon,
  AccountBalanceWallet as WalletIcon,
  Block as BlockIcon,
  Share as ShareIcon,
  BrokenImage as BrokenImageIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import useAdminSettings from '@/lib/hooks/useAdminSettings';
import { getImageUrl } from '@/Functions';


// ── Constants ────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS  = 5 * 60 * 1_000;
const LANDING_BASE     = process.env.NEXT_PUBLIC_FRONTEND_URL || '';
const API_URL          = process.env.NEXT_PUBLIC_API_URL     || 'http://localhost:1343';

const ZM_OPERATORS = [
  { value: 'mtn',    label: 'MTN',    color: '#FFCC00' },
  { value: 'airtel', label: 'Airtel', color: '#EE0000' },
  { value: 'zamtel', label: 'Zamtel', color: '#228B22' },
];

function detectOperator(phone) {
  const local = phone.replace(/\D/g, '').replace(/^260/, '').replace(/^0+/, '');
  if (/^(97|77)/.test(local)) return 'airtel';
  if (/^(96|76)/.test(local)) return 'mtn';
  return null;
}

function normalisePhone(phone, phoneCode) {
  const code = String(phoneCode).replace(/\D/g, '');
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith(code)) digits = digits.slice(code.length);
  digits = digits.replace(/^0+/, '');
  return `${code}${digits.slice(-9)}`;
}

function fmtCurrency(amount, symbol = 'K') {
  const n = parseFloat(amount) || 0;
  return `${symbol}${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Resolve a Strapi media URL to an absolute URL.
 * Strapi v4/v5 returns either a full URL (e.g. https://cdn.example.com/...)
 * or a root-relative path (e.g. /uploads/qr_code_1.png).
 * We prepend API_URL only when the path is relative.
 */
function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url}`;
}

const hideScrollbar = {
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
};

// ── Stat Tile ────────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, accent, icon }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper elevation={0} sx={{
      p: 2, borderRadius: 3, textAlign: 'center',
      border: `1px solid ${alpha(accent, isDark ? 0.22 : 0.15)}`,
      background: isDark
        ? `linear-gradient(145deg,${alpha(accent, 0.14)} 0%,transparent 100%)`
        : `linear-gradient(145deg,${alpha(accent, 0.07)} 0%,#fff 100%)`,
      boxShadow: `0 2px 12px ${alpha(accent, 0.1)}`,
    }}>
      <Box sx={{ fontSize: 28, mb: 0.5 }}>{icon}</Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: accent, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mt: 0.25 }}>{label}</Typography>
      {sub && <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: 10, mt: 0.25 }}>{sub}</Typography>}
    </Paper>
  );
}

// ── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx, currencySymbol }) {
  const isRedeem = tx.type === 'points_redemption';
  const date = new Date(tx.createdAt || tx.processedAt).toLocaleDateString('en-ZM', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  return (
    <ListItem divider sx={{ px: 0 }}>
      <ListItemText
        primary={tx.description || tx.type.replace(/_/g, ' ')}
        secondary={`${date} · ${tx.affiliate_transaction_status}`}
        primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
        secondaryTypographyProps={{ fontSize: 11 }}
      />
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography variant="body2" fontWeight={700} color={isRedeem ? 'error.main' : 'success.main'}>
          {isRedeem ? '−' : '+'}{tx.points} pts
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isRedeem ? '−' : '+'}{fmtCurrency(tx.amount, currencySymbol)}
        </Typography>
      </Box>
    </ListItem>
  );
}

// ── QR Code Panel ────────────────────────────────────────────────────────────
/**
 * Renders the stored QR code image. Download fetches the image as a Blob so
 * the browser saves it as a file instead of navigating to it. Print opens a
 * minimal print window with the image and the affiliate code text.
 */
function QRPanel({ qrUrl, affiliateCode }) {
  const [imgError, setImgError] = useState(false);

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const res  = await fetch(qrUrl);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = href;
      a.download = `okra-affiliate-${affiliateCode}.png`;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      // Fallback: direct link (browser may navigate instead of downloading)
      const a    = document.createElement('a');
      a.href     = qrUrl;
      a.download = `okra-affiliate-${affiliateCode}.png`;
      a.target   = '_blank';
      a.click();
    }
  };

  const handlePrint = () => {
    if (!qrUrl) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Affiliate QR — ${affiliateCode}</title>
  <style>
    body {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      gap: 16px; margin: 0;
    }
    img  { width: 280px; height: 280px; border-radius: 12px; }
    h2   { margin: 0; font-size: 22px; color: #14532d; }
    p    { margin: 0; color: #4b5563; font-size: 14px; }
    code { font-size: 20px; font-weight: 700; letter-spacing: 4px; color: #14532d; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <img src="${qrUrl}" alt="Affiliate QR Code" />
  <h2>Okra Affiliate</h2>
  <code>${affiliateCode}</code>
  <p>Scan to register &amp; earn together</p>
  <button onclick="window.print()">Print</button>
</body>
</html>`);
    win.document.close();
    // Delay slightly so the image has time to load before print dialog
    setTimeout(() => win.print(), 600);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
      {qrUrl && !imgError ? (
        <motion.img
          src={qrUrl}
          alt="Affiliate QR Code"
          onError={() => setImgError(true)}
          style={{ width: 240, height: 240, borderRadius: 12, display: 'block', margin: '0 auto', objectFit: 'contain' }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        />
      ) : (
        // QR not available (upload failed at account creation or image error)
        <Box sx={{
          width: 240, height: 240, borderRadius: 3, mx: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 1,
          bgcolor: 'action.hover', border: '2px dashed', borderColor: 'divider',
        }}>
          <BrokenImageIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled" textAlign="center" sx={{ maxWidth: 180 }}>
            QR code not available. Contact support or try refreshing.
          </Typography>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 0.5 }}>
        Scan to register and earn rewards
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: 2 }}>
        {affiliateCode}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, justifyContent: 'center' }}>
        <Button
          variant="contained" startIcon={<DownloadIcon />}
          onClick={handleDownload} disabled={!qrUrl || imgError}
          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
        >
          Download
        </Button>
        <Button
          variant="outlined" startIcon={<PrintIcon />}
          onClick={handlePrint} disabled={!qrUrl || imgError}
          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
        >
          Print
        </Button>
      </Box>
    </Paper>
  );
}

// ── Withdrawal bottom sheet ──────────────────────────────────────────────────
function WithdrawOverlay({ open, amount, currency, phoneCode, acceptedMM, onClose, onSuccess, onError }) {
  const [phase,    setPhase]    = useState('form');
  const [phone,    setPhone]    = useState('');
  const [operator, setOperator] = useState('');
  const [errMsg,   setErrMsg]   = useState('');
  const pollRef = useRef(null);
  const tmoRef  = useRef(null);
  const mounted = useRef(true);
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearInterval(pollRef.current);
      clearTimeout(tmoRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) { setPhase('form'); setErrMsg(''); setPhone(''); setOperator(''); }
  }, [open]);

  const handlePhoneChange = (v) => {
    setPhone(v);
    const d = detectOperator(v);
    if (d) setOperator(d);
  };

  const startPolling = useCallback((ref) => {
    setPhase('polling');
    pollRef.current = setInterval(async () => {
      if (!mounted.current) return;
      try {
        const res = await apiClient.get(`/okrapay/status/${ref}`);
        if (res?.paymentStatus === 'completed') {
          clearInterval(pollRef.current); clearTimeout(tmoRef.current);
          setPhase('success');
          setTimeout(() => { onSuccess(res); }, 2000);
        } else if (res?.paymentStatus === 'failed') {
          clearInterval(pollRef.current); clearTimeout(tmoRef.current);
          setPhase('error');
          setErrMsg(res?.failureReason || 'Withdrawal failed. Please try again.');
        }
      } catch { /* retry silently */ }
    }, POLL_INTERVAL_MS);
    tmoRef.current = setTimeout(() => {
      if (!mounted.current) return;
      clearInterval(pollRef.current);
      setPhase('error');
      setErrMsg('Timed out waiting for confirmation.');
    }, POLL_TIMEOUT_MS);
  }, [onSuccess]);

  const handleSubmit = async () => {
    setPhase('submitting');
    try {
      const formatted = normalisePhone(phone, phoneCode);
      const res = await apiClient.post('/affiliate/request-withdrawal', {
        amount,
        method: 'mobile_money',
        phone: formatted,
        operator,
      });
      const ref = res?.data?.reference;
      if (!ref) throw new Error('No reference returned');
      startPolling(ref);
    } catch (err) {
      setPhase('error');
      setErrMsg(err?.message || 'Failed to initiate withdrawal');
    }
  };

  const allowedOps = Array.isArray(acceptedMM) && acceptedMM.length
    ? ZM_OPERATORS.filter(o => acceptedMM.map(v => v.toLowerCase()).includes(o.value))
    : ZM_OPERATORS;
  const opLabel        = allowedOps.find(o => o.value === operator)?.label || '';
  const opColor        = allowedOps.find(o => o.value === operator)?.color;
  const formattedPhone = phone.replace(/\D/g, '').length >= 9 ? normalisePhone(phone, phoneCode) : null;
  const canSubmit      = phase === 'form' && phone.replace(/\D/g, '').length >= 9 && !!operator;

  if (!open) return null;

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        style={{ width: '100%' }}
      >
        <Box sx={{
          background: isDark ? '#1E293B' : '#fff',
          borderRadius: '20px 20px 0 0', p: 3, pb: 5,
          maxHeight: '85vh', overflowY: 'auto', ...hideScrollbar,
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Withdraw Earnings</Typography>
              <Typography variant="caption" color="text.secondary">{fmtCurrency(amount, currency.symbol)} · {currency.code}</Typography>
            </Box>
            {['form', 'error'].includes(phase) && (
              <IconButton onClick={onClose} size="small"><BackIcon /></IconButton>
            )}
          </Box>

          {/* FORM */}
          {phase === 'form' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Mobile Money Number" fullWidth type="tel"
                value={phone} onChange={e => handlePhoneChange(e.target.value)}
                placeholder="e.g. 0971234567"
                helperText={formattedPhone ? `Will be sent as: +${formattedPhone}` : 'Enter your mobile money number'}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 20 }} /></InputAdornment> }}
              />
              <FormControl fullWidth>
                <InputLabel>Network Operator</InputLabel>
                <Select value={operator} onChange={e => setOperator(e.target.value)} label="Network Operator">
                  {allowedOps.map(op => (
                    <MenuItem key={op.value} value={op.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: op.color }} />
                        <Typography fontWeight={600}>{op.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {opLabel && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: -0.5 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: opColor }} />
                  <Typography variant="caption" color="text.secondary">
                    <strong>{opLabel}</strong> detected automatically
                  </Typography>
                </Box>
              )}
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  A prompt will be sent to <strong>{formattedPhone ? `+${formattedPhone}` : 'your number'}</strong>. Enter your PIN to confirm.
                </Typography>
              </Alert>
              <Button fullWidth variant="contained" size="large" disabled={!canSubmit} onClick={handleSubmit}
                sx={{ height: 52, borderRadius: 2.5, fontWeight: 700, mt: 1 }}>
                Withdraw {fmtCurrency(amount, currency.symbol)}
              </Button>
            </Box>
          )}

          {/* SUBMITTING */}
          {phase === 'submitting' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={52} />
              <Typography variant="h6" fontWeight={700}>Processing…</Typography>
            </Box>
          )}

          {/* POLLING */}
          {phase === 'polling' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <motion.div animate={{ scale: [1, 1.07, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneIcon sx={{ fontSize: 38, color: 'primary.dark' }} />
                </Box>
              </motion.div>
              <Typography variant="h6" fontWeight={700} textAlign="center">Withdrawal Submitted</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 280 }}>
                {fmtCurrency(amount, currency.symbol)} will arrive in your <strong>{opLabel}</strong> wallet shortly.
              </Typography>
              <LinearProgress sx={{ width: '100%', maxWidth: 240, borderRadius: 1, height: 4 }} />
              <Button size="small" variant="outlined" onClick={() => { clearInterval(pollRef.current); clearTimeout(tmoRef.current); setPhase('form'); }}>
                Cancel &amp; Go Back
              </Button>
            </Box>
          )}

          {/* SUCCESS */}
          {phase === 'success' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckIcon sx={{ fontSize: 50, color: 'success.dark' }} />
                </Box>
              </motion.div>
              <Typography variant="h6" fontWeight={700} color="success.dark">Withdrawal Initiated!</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {fmtCurrency(amount, currency.symbol)} will arrive in your account shortly.
              </Typography>
            </Box>
          )}

          {/* ERROR */}
          {phase === 'error' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ErrorIcon sx={{ fontSize: 48, color: 'error.dark' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="error.dark">Withdrawal Failed</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 280 }}>{errMsg}</Typography>
              <Button variant="contained" color="error" onClick={() => { setPhase('form'); setErrMsg(''); }} sx={{ borderRadius: 2 }}>
                Try Again
              </Button>
            </Box>
          )}
        </Box>
      </motion.div>
    </Box>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AffiliateDashboard() {
  const router  = useRouter();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const { user, loading: authLoading } = useAuth();

  const [data,         setData]         = useState(null);
  const [txs,          setTxs]          = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [withdrawAmt,  setWithdrawAmt]  = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawErr,  setWithdrawErr]  = useState('');
  const { isAffiliateSystemEnabled } = useAdminSettings();

  // ── Fetch dashboard data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const [dash, txRes] = await Promise.all([
          apiClient.get('/affiliate/dashboard'),
          apiClient.get('/affiliate/transactions?pageSize=20'),
        ]);
        const res = await apiClient.get('/affiliate/dashboard')
        console.log('res',res)
        setData(dash?.data);
        setTxs(txRes?.data || []);
      } catch (err) {
        console.error('[AffiliateDashboard]', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ── Derive QR URL from stored media object ────────────────────────────────
  // affiliateProfile.qrCode is a Strapi media entity populated by the dashboard
  // endpoint. It has a `url` field which may be relative (/uploads/...) or
  // absolute (https://cdn...). resolveMediaUrl() handles both cases.
  
  const qrUrl = process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(data?.profile?.qrCode)
  // ── Copy affiliate code ──────────────────────────────────────────────────
  const handleCopy = () => {
    const code = data?.profile?.affiliateCode;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Share affiliate link ──────────────────────────────────────────────────
  const handleShare = async () => {
    const code = data?.profile?.affiliateCode;
    const url  = `${LANDING_BASE}?ref=${code}`;
    if (navigator.share) {
      await navigator.share({ title: 'Join Okra!', text: `Use my code ${code} to sign up.`, url });
    } else {
      navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Withdrawal handlers ──────────────────────────────────────────────────
  const handleWithdrawSuccess = () => {
    setShowWithdraw(false);
    apiClient.get('/affiliate/dashboard').then(d => setData(d?.data)).catch(() => {});
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0} sx={{ background: 'linear-gradient(135deg,#14532d,#15803d)' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
            <Typography variant="h6" sx={{ flex: 1 }}>Affiliate Dashboard</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>
      </Box>
    );
  }

  // ── Affiliate system disabled ─────────────────────────────────────────────
  if (!isAffiliateSystemEnabled) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0} sx={{ background: 'linear-gradient(135deg,#14532d,#15803d)' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
            <Typography variant="h6" sx={{ flex: 1 }}>Affiliate Program</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3, textAlign: 'center', pt: 10 }}>
          <Typography variant="h5" fontWeight={700} color="text.secondary">Coming Soon</Typography>
          <Typography color="text.disabled" sx={{ mt: 1 }}>
            The affiliate program is not yet active. Check back soon!
          </Typography>
        </Box>
      </Box>
    )
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const profile    = data?.profile ?? {};
  const rate       = data?.conversionRate ?? { ratePerPoint: 0.1, currencySymbol: 'K', currencyCode: 'ZMW', affiliatePoints: 1, currencyAmount: 0.1 };
  const minRedeem  = data?.minimumPointsForRedemption ?? 100;
  const minWithdr  = data?.minimumWithdrawAmount      ?? 10;
  const sym        = rate.currencySymbol;
  const cashValue  = (profile.pointsBalance ?? 0) * rate.ratePerPoint;
  const canWithdraw = (profile.withdrawableBalance ?? 0) >= minWithdr && !profile.blocked;
  const numWithdraw = parseFloat(withdrawAmt) || 0;
  const withdrawValid = numWithdraw >= minWithdr && numWithdraw <= (profile.withdrawableBalance ?? 0);

  const appBarGrad = isDark
    ? 'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)'
    : 'linear-gradient(135deg,#14532d 0%,#15803d 100%)';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

      {/* ── AppBar ──────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0} sx={{ background: appBarGrad }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Affiliate Dashboard</Typography>
          {profile.blocked && <Chip label="Blocked" color="error" size="small" icon={<BlockIcon />} />}
        </Toolbar>
      </AppBar>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'absolute',
        top: 64,        // AppBar height
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        pb: 10,
        ...hideScrollbar,
        }}>
        {/* Blocked banner */}
        <AnimatePresence>
          {profile.blocked && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}>
              <Alert severity="error" icon={<BlockIcon />} sx={{ borderRadius: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>Account Blocked</Typography>
                <Typography variant="body2">Withdrawals are disabled. Contact support to resolve this.</Typography>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Paper elevation={0} sx={{
            mx: 2, mt: 4, p: 3, borderRadius: 4,
            background: 'linear-gradient(140deg,#14532d 0%,#15803d 40%,#0d9488 100%)',
            color: 'white', position: 'relative', overflow: 'hidden',
            boxShadow: `0 12px 40px ${alpha('#10B981', 0.35)}`,
          }}>
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>Your Affiliate Code</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                {profile.affiliateCode}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                <IconButton size="small" onClick={handleCopy}
                  sx={{ color: copied ? '#86efac' : 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                  <CopyIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleShare}
                  sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <AnimatePresence>
              {copied && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Chip label="Copied!" size="small" sx={{ bgcolor: '#86efac', color: '#14532d', fontWeight: 700, mb: 1 }} />
                </motion.div>
              )}
            </AnimatePresence>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Total Referrals</Typography>
                <Typography variant="h5" fontWeight={800}>{profile.totalReferrals ?? 0}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Active</Typography>
                <Typography variant="h5" fontWeight={800}>{profile.activeReferrals ?? 0}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Total Earned</Typography>
                <Typography variant="h5" fontWeight={800}>{fmtCurrency(profile.totalEarnings, sym)}</Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Stat tiles */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, p: 2, pt: 1.5 }}>
          {[
            { label: 'Points Balance',     value: (profile.pointsBalance ?? 0).toLocaleString(), sub: `≈ ${fmtCurrency(cashValue, sym)}`,                              accent: '#10B981', icon: '⭐' },
            { label: 'Withdrawable',        value: fmtCurrency(profile.withdrawableBalance, sym), sub: `${rate.affiliatePoints} pts = ${fmtCurrency(rate.currencyAmount, sym)}`, accent: '#3B82F6', icon: '💰' },
            { label: 'Total Points Earned', value: (profile.totalPoints ?? 0).toLocaleString(),   sub: 'All time',                                                       accent: '#8B5CF6', icon: '🏆' },
            { label: 'Total Earnings',      value: fmtCurrency(profile.totalEarnings, sym),       sub: 'All time',                                                       accent: '#F59E0B', icon: '📈' },
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }}>
              <StatTile {...t} />
            </motion.div>
          ))}
        </Box>

        {/* Conversion rate explainer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Paper elevation={0} sx={{
            mx: 2, mb: 2, p: 2, borderRadius: 3,
            border: `1px solid ${alpha('#10B981', 0.2)}`,
            background: isDark ? alpha('#10B981', 0.08) : alpha('#10B981', 0.04),
          }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Points Conversion Rate
            </Typography>
            <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
              {rate.affiliatePoints} pts = {fmtCurrency(rate.currencyAmount, sym)} {rate.currencyCode}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Minimum to redeem: {minRedeem} pts · Minimum withdrawal: {fmtCurrency(minWithdr, sym)}
            </Typography>
          </Paper>
        </motion.div>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="QR Code"  />
          <Tab label="Withdraw" />
          <Tab label="History"  />
        </Tabs>

        {/* ── QR Tab ──────────────────────────────────────────────────────── */}
        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <QRPanel qrUrl={qrUrl} affiliateCode={profile.affiliateCode} />
          </Box>
        )}

        {/* ── Withdraw Tab ─────────────────────────────────────────────────── */}
        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            {profile.blocked ? (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight={700}>Account Blocked</Typography>
                <Typography variant="body2">Contact support to restore withdrawal access.</Typography>
              </Alert>
            ) : !canWithdraw ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight={700}>Minimum Not Reached</Typography>
                <Typography variant="body2">
                  You have {fmtCurrency(profile.withdrawableBalance, sym)} available. Minimum withdrawal is {fmtCurrency(minWithdr, sym)}.
                  Keep referring people to earn more!
                </Typography>
              </Alert>
            ) : (
              <>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2, textAlign: 'center', background: isDark ? alpha('#10B981', 0.1) : alpha('#10B981', 0.05) }}>
                  <WalletIcon sx={{ fontSize: 44, color: 'success.main', mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Available to Withdraw</Typography>
                  <Typography variant="h2" fontWeight={800} color="success.main" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {fmtCurrency(profile.withdrawableBalance, sym)}
                  </Typography>
                </Paper>

                <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Withdrawal Amount</Typography>
                  <TextField
                    fullWidth label="Amount" type="number" value={withdrawAmt}
                    onChange={e => { setWithdrawAmt(e.target.value); setWithdrawErr(''); }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{sym}</InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button size="small" onClick={() => setWithdrawAmt(String(profile.withdrawableBalance))} sx={{ fontWeight: 700 }}>MAX</Button>
                        </InputAdornment>
                      ),
                    }}
                    error={!!withdrawErr || (numWithdraw > 0 && !withdrawValid)}
                    helperText={
                      withdrawErr
                      || (numWithdraw > 0 && numWithdraw < minWithdr ? `Minimum is ${fmtCurrency(minWithdr, sym)}`
                          : numWithdraw > (profile.withdrawableBalance ?? 0) ? `Max is ${fmtCurrency(profile.withdrawableBalance, sym)}`
                          : `Min: ${fmtCurrency(minWithdr, sym)} · Max: ${fmtCurrency(profile.withdrawableBalance, sym)}`)
                    }
                    sx={{ mb: 1.5 }}
                  />

                  {withdrawValid && (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Points redeemed</Typography>
                        <Typography variant="body2" fontWeight={700}>~{Math.ceil(numWithdraw / rate.ratePerPoint)} pts</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={700}>You'll receive</Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">{fmtCurrency(numWithdraw, sym)}</Typography>
                      </Box>
                    </Box>
                  )}

                  <Button fullWidth variant="contained" size="large"
                    disabled={!withdrawValid}
                    onClick={() => setShowWithdraw(true)}
                    sx={{ height: 52, borderRadius: 2.5, fontWeight: 700, background: withdrawValid ? 'linear-gradient(135deg,#14532d,#15803d)' : undefined }}>
                    {withdrawValid ? `Withdraw ${fmtCurrency(numWithdraw, sym)}` : `Enter amount (min. ${fmtCurrency(minWithdr, sym)})`}
                  </Button>
                </Paper>
              </>
            )}
          </Box>
        )}

        {/* ── History Tab ──────────────────────────────────────────────────── */}
        {tab === 2 && (
          <Box sx={{ px: 2, pt: 1 }}>
            {txs.length === 0 ? (
              <Box sx={{ textAlign: 'center', pt: 6 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>💸</Typography>
                <Typography color="text.secondary">No transactions yet. Start referring!</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {txs.map((tx, i) => (
                  <motion.div key={tx.id ?? i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <TxRow tx={tx} currencySymbol={sym} />
                  </motion.div>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>

      {/* ── Withdrawal bottom sheet ──────────────────────────────────────── */}
      <AnimatePresence>
        {showWithdraw && (
          <WithdrawOverlay
            open={showWithdraw}
            amount={numWithdraw}
            currency={{ symbol: sym, code: rate.currencyCode }}
            phoneCode={data?.user?.country?.phoneCode ?? '260'}
            acceptedMM={data?.user?.country?.acceptedMobileMoneyPayments ?? null}
            onClose={() => setShowWithdraw(false)}
            onSuccess={handleWithdrawSuccess}
            onError={(err) => { setShowWithdraw(false); setWithdrawErr(err?.message ?? 'Withdrawal failed'); }}
          />
        )}
      </AnimatePresence>
    </Box>
  );
}