'use client';
/**
 * OkraPayModal — updated
 * PATH: shared/components/OkraPayModal.jsx
 *
 * Changes vs previous version:
 *  1. Auto-detect operator from phone prefix:
 *       097x / 77x  → Airtel
 *       096x / 76x  → MTN
 *  2. Phone normalised to {phoneCode}{9-digit-local} before sending:
 *       "0971234567" + "260" → "260971234567"
 *  3. Dedicated 'insufficient' phase for
 *       reasonForFailure === 'Insufficient funds or wallet withdrawal limit exceeded'
 *  4. General 'failed' phase for all other immediate Lenco failures
 *  5. `phoneCode` prop (e.g. "260") passed from parent — derived from user's country
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, Box, Typography, Tabs, Tab,
  TextField, Button, IconButton, InputAdornment,
  CircularProgress, Select, MenuItem, FormControl,
  InputLabel, Divider, Chip, LinearProgress, Fade,
} from '@mui/material';
import {
  Close          as CloseIcon,
  Phone          as PhoneIcon,
  CreditCard     as CardIcon,
  AccountBalance as BankIcon,
  CheckCircle    as CheckIcon,
  ErrorOutline   as ErrorIcon,
  Lock           as LockIcon,
  AccountBalanceWallet as WalletIcon,
  Visibility, VisibilityOff,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@/Functions';

// ─── Constants ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS  = 5 * 60 * 1_000; // 5 min

const INSUFFICIENT_FUNDS_REASON =
  'Insufficient funds or wallet withdrawal limit exceeded';

const ZM_OPERATORS = [
  { value: 'mtn',    label: 'MTN',    color: '#FFCC00' },
  { value: 'airtel', label: 'Airtel', color: '#EE0000' },
  { value: 'zamtel', label: 'Zamtel', color: '#228B22' },
];

const ZM_BANKS = [
  { id: 'zanaco',     name: 'Zanaco'             },
  { id: 'stanchart',  name: 'Standard Chartered' },
  { id: 'absa',       name: 'ABSA'               },
  { id: 'fnbzambia',  name: 'FNB Zambia'         },
  { id: 'investrust', name: 'Investrust Bank'    },
  { id: 'atlas',      name: 'Atlas Mara'         },
];

// ─── Phone helpers ─────────────────────────────────────────────────────────────

/**
 * Auto-detect Zambian mobile network from a phone number string.
 * Works on raw user input with or without leading 0 / country code.
 *
 *   097x / 77x  → 'airtel'
 *   096x / 76x  → 'mtn'
 *   Returns null when no match (e.g. Zamtel 095, or incomplete number).
 */
function detectOperator(phone) {
  const digits = phone.replace(/\D/g, '');
  // Normalise: strip leading 260 (Zambia) if present
  const local  = digits.startsWith('260') ? digits.slice(3) : digits;

  if (/^(097|97|077|77)/.test(local)) return 'airtel';
  if (/^(096|96|076|76)/.test(local)) return 'mtn';
  return null;
}

/**
 * Normalise a phone number to international format with no '+'.
 *
 * Steps:
 *  1. Strip all non-digits
 *  2. Remove leading country code if already present
 *  3. Strip leading zeros
 *  4. Take the last 9 digits (local part)
 *  5. Prepend the country dial code
 *
 * Examples (phoneCode = "260"):
 *   "0971 234 567"  → "260971234567"
 *   "971234567"     → "260971234567"
 *   "260971234567"  → "260971234567"  (idempotent)
 */
function normalisePhone(phone, phoneCode) {
  const code   = String(phoneCode).replace(/\D/g, '');  // e.g. "260"
  let   digits = String(phone).replace(/\D/g, '');

  // Remove already-present country code
  if (digits.startsWith(code)) digits = digits.slice(code.length);

  // Remove leading zeros
  digits = digits.replace(/^0+/, '');

  // Keep only the last 9 digits
  const local = digits.slice(-9);

  return `${code}${local}`;
}

// ─── Card formatters ───────────────────────────────────────────────────────────

const fmtCard = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp  = v => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function OkraPayModal({
  open,
  onClose,
  amount,                     // number — read-only display
  purpose       = 'ridepay',  // 'ridepay'|'floatadd'|'subpay'|'walletTopup'|'withdraw'
  relatedEntityId,
  currency      = 'ZMW',      // resolved from user's country.currency.code on parent
  /** Dial code WITHOUT +, from user's country.phoneCode.  e.g. "260" */
  phoneCode     = '260',
  /**
   * user.country.acceptedMobileMoneyPayments — e.g. ["mtn", "airtel", "zamtel"]
   * Falls back to all three if not provided.
   */
  acceptedMobileMoneyPayments = null,
  onSuccess     = () => {},
  onError       = () => {},
}) {
  const isWithdraw = purpose === 'withdraw';

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab,      setTab]      = useState(0);
  /**
   * Phase machine:
   *   'form'         → user filling in fields
   *   'submitting'   → POST in-flight
   *   'polling'      → waiting for phone authorisation / background 3DS
   *   '3ds'          → card 3DS popup opened, polling in background
   *   'success'      → payment confirmed
   *   'insufficient' → Lenco: "Insufficient funds or wallet withdrawal limit exceeded"
   *   'error'        → any other failure
   */
  const [phase,    setPhase]    = useState('form');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Mobile Money form ─────────────────────────────────────────────────────
  const [mmPhone,    setMmPhone]    = useState('');
  const [mmOperator, setMmOperator] = useState('');

  // ── Card form ─────────────────────────────────────────────────────────────
  const [cardNum,     setCardNum]     = useState('');
  const [expiry,      setExpiry]      = useState('');
  const [cvv,         setCvv]         = useState('');
  const [showCvv,     setShowCvv]     = useState(false);
  const [cardFirst,   setCardFirst]   = useState('');
  const [cardLast,    setCardLast]    = useState('');
  const [billStreet,  setBillStreet]  = useState('');
  const [billCity,    setBillCity]    = useState('');
  const [billPostal,  setBillPostal]  = useState('');
  const [billCountry, setBillCountry] = useState('ZM');

  // ── Bank withdrawal form ──────────────────────────────────────────────────
  const [bankAccNum,  setBankAccNum]  = useState('');
  const [bankId,      setBankId]      = useState('');
  const [bankAccName, setBankAccName] = useState('');

  // ── Polling ────────────────────────────────────────────────────────────────
  const pollRef  = useRef(null);
  const tmoRef   = useRef(null);
  const mounted  = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearInterval(pollRef.current);
      clearTimeout(tmoRef.current);
    };
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setPhase('form');
      setErrorMsg('');
      setTab(0);
      setMmPhone('');
      setMmOperator('');
      clearInterval(pollRef.current);
      clearTimeout(tmoRef.current);
    }
  }, [open]);

  // ── Auto-detect operator as user types ────────────────────────────────────
  const handlePhoneChange = (value) => {
    setMmPhone(value);
    const detected = detectOperator(value);
    if (detected) setMmOperator(detected);
  };

  // ── Derived: formatted phone preview ─────────────────────────────────────
  const formattedPhone = mmPhone.replace(/\D/g, '').length >= 9
    ? normalisePhone(mmPhone, phoneCode)
    : null;

  // ── Polling ────────────────────────────────────────────────────────────────
  const startPolling = useCallback((ref) => {
    setPhase('polling');

    pollRef.current = setInterval(async () => {
      if (!mounted.current) return;
      try {
        const res    = await apiClient.get(`/okrapay/status/${ref}`);
        const status = res?.paymentStatus;

        if (status === 'completed') {
          clearInterval(pollRef.current);
          clearTimeout(tmoRef.current);
          setPhase('success');
          setTimeout(() => { onSuccess(res); onClose(); }, 2000);
        } else if (status === 'failed') {
          clearInterval(pollRef.current);
          clearTimeout(tmoRef.current);
          const reason = res?.failureReason || '';
          if (reason === INSUFFICIENT_FUNDS_REASON) {
            setPhase('insufficient');
          } else {
            setPhase('error');
            setErrorMsg(reason || 'Payment failed. Please try again.');
          }
        }
      } catch { /* silently retry */ }
    }, POLL_INTERVAL_MS);

    tmoRef.current = setTimeout(() => {
      if (!mounted.current) return;
      clearInterval(pollRef.current);
      setPhase('error');
      setErrorMsg('Payment timed out. Please check your phone for a prompt and try again.');
    }, POLL_TIMEOUT_MS);
  }, [onSuccess, onClose]);

  const cancelPolling = () => {
    clearInterval(pollRef.current);
    clearTimeout(tmoRef.current);
    setPhase('form');
  };

  // ── Handle backend immediate-failure response ─────────────────────────────
  // Called when the backend returns { success: false, immediateFailure: true }
  const handleImmediateFailure = (responseData) => {
    const reason = responseData?.reasonForFailure || '';
    if (reason === INSUFFICIENT_FUNDS_REASON) {
      setPhase('insufficient');
    } else {
      setPhase('error');
      setErrorMsg(reason || 'Payment was declined. Please try again.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Submit handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const submitMobileMoney = async () => {
    setPhase('submitting');
    setErrorMsg('');
    try {
      const phone = normalisePhone(mmPhone, phoneCode);

      const res = await apiClient.post('/okrapay/initiate', {
        purpose,
        amount,
        currency,
        relatedEntityId,
        paymentType: 'mobile_money',
        phone,
        operator: mmOperator,  // controller will lowercase
      });

      // Wallet paid it immediately
      if (res?.paidFromWallet || res?.alreadyPaid) {
        setPhase('success');
        setTimeout(() => { onSuccess(res); onClose(); }, 2000);
        return;
      }

      // Backend returned a Lenco immediate failure
      if (res?.immediateFailure || res?.data?.lencoStatus === 'failed') {
        handleImmediateFailure(res?.data);
        return;
      }

      const ref = res?.data?.reference;
      if (!ref) throw new Error('No reference returned from server');

      // 'pay-offline' → poll
      startPolling(ref);
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message || 'Failed to initiate payment');
    }
  };

  const submitCard = async () => {
    setPhase('submitting');
    setErrorMsg('');
    try {
      const [expMonth, expYearShort] = expiry.split('/');

      const res = await apiClient.post('/okrapay/initiate', {
        purpose,
        amount,
        currency,
        relatedEntityId,
        paymentType: 'card',
        customer: { firstName: cardFirst, lastName: cardLast },
        card: {
          number:      cardNum.replace(/\s/g, ''),
          expiryMonth: expMonth?.trim(),
          expiryYear:  `20${expYearShort?.trim()}`,
          cvv,
        },
        billing: {
          streetAddress: billStreet,
          city:          billCity,
          postalCode:    billPostal,
          country:       billCountry,
        },
        redirectUrl: `${window.location.origin}/payment/callback`,
      });

      if (res?.immediateFailure || res?.data?.lencoStatus === 'failed') {
        handleImmediateFailure(res?.data);
        return;
      }

      const d           = res?.data;
      const lencoStatus = d?.lencoStatus;
      const ref         = d?.reference;

      if (lencoStatus === 'successful') {
        setPhase('success');
        setTimeout(() => { onSuccess(res); onClose(); }, 2000);
        return;
      }
      if (lencoStatus === '3ds-auth-required') {
        setPhase('3ds');
        window.open(d.redirectUrl, '_blank', 'width=600,height=700,noopener');
        startPolling(ref);
        return;
      }
      if (ref) {
        startPolling(ref);
      } else {
        throw new Error('Unexpected card response from server');
      }
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message || 'Card payment failed');
    }
  };

  const submitWithdrawMM = async () => {
    setPhase('submitting');
    setErrorMsg('');
    try {
      const phone = normalisePhone(mmPhone, phoneCode);

      const res = await apiClient.post('/okrapay/request-withdrawal', {
        amount,
        method:      'mobile_money',
        phone,
        operator:    mmOperator,
        accountName: phone,  // display fallback
      });

      const ref = res?.data?.reference;
      if (!ref) throw new Error('No reference returned from server');
      startPolling(ref);
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message || 'Withdrawal request failed');
    }
  };

  const submitWithdrawBank = async () => {
    setPhase('submitting');
    setErrorMsg('');
    try {
      const res = await apiClient.post('/okrapay/request-withdrawal', {
        amount,
        method:        'bank_account',
        accountNumber: bankAccNum,
        bankId,
        accountName:   bankAccName,
      });

      const ref = res?.data?.reference;
      if (!ref) throw new Error('No reference returned from server');
      startPolling(ref);
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message || 'Withdrawal request failed');
    }
  };

  const handleSubmit = () => {
    if (isWithdraw) return tab === 0 ? submitWithdrawMM() : submitWithdrawBank();
    return tab === 0 ? submitMobileMoney() : submitCard();
  };

  const canSubmit = () => {
    if (phase !== 'form') return false;
    const cleanPhone = mmPhone.replace(/\D/g, '');
    if (isWithdraw) {
      if (tab === 0) return cleanPhone.length >= 9 && !!mmOperator;
      return bankAccNum.length >= 6 && !!bankId && !!bankAccName;
    }
    if (tab === 0) return cleanPhone.length >= 9 && !!mmOperator;
    const [m, y] = expiry.split('/');
    return (
      cardNum.replace(/\s/g, '').length === 16 &&
      m?.length === 2 && y?.length === 2 &&
      cvv.length >= 3 &&
      !!cardFirst && !!cardLast &&
      !!billStreet && !!billCity && !!billPostal
    );
  };

  // Filter to only the operators the country allows; fall back to all three
  const allowedOperators = Array.isArray(acceptedMobileMoneyPayments) && acceptedMobileMoneyPayments.length > 0
    ? ZM_OPERATORS.filter(o => acceptedMobileMoneyPayments.map(v => v.toLowerCase()).includes(o.value))
    : ZM_OPERATORS;

  const operatorLabel = allowedOperators.find(o => o.value === mmOperator)?.label || '';
  const operatorColor = allowedOperators.find(o => o.value === mmOperator)?.color;

  // ═══════════════════════════════════════════════════════════════════════════
  // Form panels
  // ═══════════════════════════════════════════════════════════════════════════

  const MobileMoneyPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
      <TextField
        label="Mobile Money Number"
        placeholder="e.g. 0971 234 567"
        value={mmPhone}
        onChange={e => handlePhoneChange(e.target.value)}
        type="tel"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        helperText={
          formattedPhone
            ? `Will be sent as: +${formattedPhone}`
            : 'Enter the number registered for mobile money'
        }
        fullWidth
      />

      <FormControl fullWidth>
        <InputLabel shrink>Network Operator</InputLabel>
        <Select
          value={mmOperator}
          onChange={e => setMmOperator(e.target.value)}
          label="Network Operator"
          notched
          displayEmpty
          renderValue={val => {
            const op = allowedOperators.find(o => o.value === val);
            if (!op) return <Typography color="text.secondary" fontSize="0.9rem">Select operator</Typography>;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: op.color, flexShrink: 0 }} />
                <Typography fontWeight={600}>{op.label}</Typography>
              </Box>
            );
          }}
        >
          {allowedOperators.map(op => (
            <MenuItem key={op.value} value={op.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: op.color, flexShrink: 0 }} />
                <Typography fontWeight={600}>{op.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Auto-detect badge */}
      {mmOperator && mmPhone.replace(/\D/g, '').length >= 3 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: -0.5 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: operatorColor }} />
          <Typography variant="caption" color="text.secondary">
            <strong>{operatorLabel}</strong> detected automatically
          </Typography>
        </Box>
      )}

      <Box sx={{
        p: 2, borderRadius: 2, bgcolor: 'action.hover',
        display: 'flex', alignItems: 'flex-start', gap: 1.5,
      }}>
        <PhoneIcon sx={{ fontSize: 16, color: 'primary.main', mt: 0.2, flexShrink: 0 }} />
        <Typography variant="caption" color="text.secondary" lineHeight={1.6}>
          A payment prompt will be sent to{' '}
          <strong>{formattedPhone ? `+${formattedPhone}` : 'your number'}</strong>.
          Open your <strong>{operatorLabel || 'mobile money'}</strong> menu and enter your PIN to authorise.
        </Typography>
      </Box>
    </Box>
  );

  const CardPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
      <TextField
        label="Card Number"
        value={cardNum}
        onChange={e => setCardNum(fmtCard(e.target.value))}
        placeholder="1234 5678 9012 3456"
        inputProps={{ maxLength: 19 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CardIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
          endAdornment: cardNum.replace(/\s/g, '').startsWith('4')
            ? <Chip label="VISA" size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
            : cardNum.replace(/\s/g, '').startsWith('5')
              ? <Chip label="MC" size="small" color="warning" sx={{ fontSize: '0.6rem', height: 18 }} />
              : null,
        }}
        fullWidth
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField
          label="Expiry (MM/YY)"
          value={expiry}
          onChange={e => setExpiry(fmtExp(e.target.value))}
          placeholder="MM/YY"
          inputProps={{ maxLength: 5 }}
          fullWidth
        />
        <TextField
          label="CVV"
          value={cvv}
          onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
          type={showCvv ? 'text' : 'password'}
          inputProps={{ maxLength: 4 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowCvv(v => !v)}>
                  {showCvv ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          fullWidth
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField label="First Name" value={cardFirst} onChange={e => setCardFirst(e.target.value)} fullWidth />
        <TextField label="Last Name"  value={cardLast}  onChange={e => setCardLast(e.target.value)}  fullWidth />
      </Box>

      <Divider sx={{ my: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Billing Address</Typography>
      </Divider>

      <TextField label="Street Address" value={billStreet}  onChange={e => setBillStreet(e.target.value)}  fullWidth />
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
        <TextField label="City"        value={billCity}   onChange={e => setBillCity(e.target.value)}   fullWidth />
        <TextField label="Postal Code" value={billPostal} onChange={e => setBillPostal(e.target.value)} fullWidth />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <LockIcon sx={{ fontSize: 13, color: 'success.main' }} />
        <Typography variant="caption" color="success.main" fontWeight={600}>
          256-bit SSL · Lenco PCI DSS certified
        </Typography>
      </Box>
    </Box>
  );

  const BankAccountPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
      <TextField
        label="Account Holder Name"
        value={bankAccName}
        onChange={e => setBankAccName(e.target.value)}
        placeholder="Full name as on bank account"
        fullWidth
      />
      <TextField
        label="Account Number"
        value={bankAccNum}
        onChange={e => setBankAccNum(e.target.value.replace(/\D/g, ''))}
        type="tel"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <BankIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel>Bank</InputLabel>
        <Select value={bankId} onChange={e => setBankId(e.target.value)} label="Bank">
          {ZM_BANKS.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
        </Select>
      </FormControl>
      <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
        Withdrawals to bank accounts may take 1–3 business days.
      </Typography>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase overlay
  // ═══════════════════════════════════════════════════════════════════════════

  const BLOCKING_PHASES = ['submitting', 'polling', '3ds', 'success', 'insufficient', 'error'];

  const Overlay = () => (
    <AnimatePresence>
      {BLOCKING_PHASES.includes(phase) && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'var(--mui-palette-background-paper)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 32, borderRadius: 12,
          }}
        >

          {/* ── SUBMITTING ── */}
          {phase === 'submitting' && (
            <>
              <CircularProgress size={52} sx={{ mb: 3 }} />
              <Typography variant="h6" fontWeight={700}>Processing…</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Connecting to your {tab === 0 ? 'mobile money' : 'card'} provider.
              </Typography>
            </>
          )}

          {/* ── POLLING ── */}
          {phase === 'polling' && (
            <>
              <motion.div
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Box sx={{
                  width: 72, height: 72, borderRadius: '50%',
                  bgcolor: 'primary.light',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                }}>
                  <PhoneIcon sx={{ fontSize: 38, color: 'primary.dark' }} />
                </Box>
              </motion.div>
              <Typography variant="h6" fontWeight={700} textAlign="center" sx={{ mb: 1 }}>
                {isWithdraw ? 'Withdrawal Submitted' : 'Authorise on Your Phone'}
              </Typography>
              {!isWithdraw && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3, maxWidth: 280 }}>
                  A prompt was sent to <strong>+{formattedPhone || mmPhone}</strong>.
                  Open your <strong>{operatorLabel}</strong> menu and enter your PIN to complete payment.
                </Typography>
              )}
              {isWithdraw && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3, maxWidth: 280 }}>
                  Your withdrawal of <strong>{formatCurrency(amount)}</strong> is being processed.
                </Typography>
              )}
              <Box sx={{ width: '100%', maxWidth: 240, mb: 3 }}>
                <LinearProgress sx={{ borderRadius: 1, height: 4 }} />
              </Box>
              <Typography variant="caption" color="text.disabled" sx={{ mb: 2 }}>
                Waiting for confirmation…
              </Typography>
              <Button size="small" variant="outlined" onClick={cancelPolling} sx={{ borderRadius: 2 }}>
                Cancel &amp; Go Back
              </Button>
            </>
          )}

          {/* ── 3DS ── */}
          {phase === '3ds' && (
            <>
              <Box sx={{
                width: 72, height: 72, borderRadius: '50%',
                bgcolor: 'warning.light',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
              }}>
                <LockIcon sx={{ fontSize: 38, color: 'warning.dark' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Complete 3D Secure
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3, maxWidth: 280 }}>
                Your bank requires extra verification. A new window has opened — complete
                authentication there. This page will update automatically.
              </Typography>
              <CircularProgress size={24} />
            </>
          )}

          {/* ── SUCCESS ── */}
          {phase === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <Box sx={{
                  width: 80, height: 80, borderRadius: '50%',
                  bgcolor: 'success.light',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                }}>
                  <CheckIcon sx={{ fontSize: 50, color: 'success.dark' }} />
                </Box>
              </motion.div>
              <Typography variant="h6" fontWeight={700} color="success.dark" sx={{ mb: 1 }}>
                {isWithdraw ? 'Withdrawal Initiated!' : 'Payment Confirmed!'}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {isWithdraw
                  ? `${formatCurrency(amount)} will arrive in your account shortly.`
                  : `${formatCurrency(amount)} received successfully.`}
              </Typography>
            </>
          )}

          {/* ── INSUFFICIENT FUNDS ── */}
          {phase === 'insufficient' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              >
                <Box sx={{
                  width: 80, height: 80, borderRadius: '50%',
                  bgcolor: 'warning.light',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                }}>
                  <WalletIcon sx={{ fontSize: 46, color: 'warning.dark' }} />
                </Box>
              </motion.div>
              <Typography variant="h6" fontWeight={700} color="warning.dark" sx={{ mb: 1, textAlign: 'center' }}>
                Insufficient Funds
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 1, maxWidth: 280 }}>
                Your{operatorLabel ? <> <strong>{operatorLabel}</strong></> : ' mobile money'} wallet
                {' '}doesn&apos;t have enough funds to pay{' '}
                <strong>{formatCurrency(amount)}</strong>.
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3, maxWidth: 280 }}>
                Please top up your <strong>{operatorLabel || 'mobile money'}</strong> wallet and try again.
              </Typography>
              <Button
                variant="contained"
                color="warning"
                onClick={() => { setPhase('form'); setErrorMsg(''); }}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Try Again
              </Button>
            </>
          )}

          {/* ── ERROR ── */}
          {phase === 'error' && (
            <>
              <Box sx={{
                width: 72, height: 72, borderRadius: '50%',
                bgcolor: 'error.light',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
              }}>
                <ErrorIcon sx={{ fontSize: 48, color: 'error.dark' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="error.dark" sx={{ mb: 1 }}>
                {isWithdraw ? 'Withdrawal Failed' : 'Payment Failed'}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3, maxWidth: 280 }}>
                {errorMsg}
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={() => { setPhase('form'); setErrorMsg(''); }}
                sx={{ borderRadius: 2 }}
              >
                Try Again
              </Button>
            </>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  const isLocked = ['polling', 'submitting', '3ds'].includes(phase);

  return (
    <Dialog
      open={open}
      onClose={isLocked ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      TransitionComponent={Fade}
    >
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        px: 3, pt: 3, pb: 2.5, position: 'relative',
      }}>
        {!isLocked && onClose && (
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute', top: 8, right: 8,
              color: 'rgba(255,255,255,0.45)',
              '&:hover': { color: '#fff' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: 1.5, bgcolor: '#e94560',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography fontSize="1rem">🥑</Typography>
          </Box>
          <Typography variant="caption" sx={{
            color: 'rgba(255,255,255,0.7)', fontWeight: 700,
            letterSpacing: 1.2, textTransform: 'uppercase', fontSize: '0.68rem',
          }}>
            OkraPay · Secure {isWithdraw ? 'Withdrawal' : 'Payment'}
          </Typography>
        </Box>

        {/* Amount — always read-only */}
        <Typography variant="h4" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-1px' }}>
          {formatCurrency(amount)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          {currency} · {isWithdraw ? 'Amount to withdraw' : 'Amount to pay'}
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => { if (phase === 'form') setTab(v); }}
        variant="fullWidth"
        sx={{
          borderBottom: 1, borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 700, fontSize: '0.78rem', py: 1.5 },
        }}
      >
        <Tab icon={<PhoneIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Mobile Money" />
        <Tab
          icon={isWithdraw
            ? <BankIcon sx={{ fontSize: 16 }} />
            : <CardIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={isWithdraw ? 'Bank Account' : 'Card'}
        />
      </Tabs>

      {/* Body */}
      <DialogContent sx={{ p: 3, position: 'relative', minHeight: 340, overflow: 'auto' }}>
        <Overlay />

        {tab === 0 && MobileMoneyPanel}
        {tab === 1 && (isWithdraw ? BankAccountPanel : CardPanel)}

        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!canSubmit()}
            sx={{
              height: 52, fontWeight: 700, borderRadius: 2.5, fontSize: '0.95rem',
              background: canSubmit()
                ? 'linear-gradient(135deg, #e94560 0%, #c62a47 100%)'
                : undefined,
              boxShadow: canSubmit()
                ? '0 4px 14px rgba(233,69,96,0.35)'
                : undefined,
            }}
          >
            {isWithdraw
              ? `Withdraw ${formatCurrency(amount)}`
              : `Pay ${formatCurrency(amount)}`}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1.5 }}>
          <LockIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            Secured by Lenco · 256-bit SSL
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}