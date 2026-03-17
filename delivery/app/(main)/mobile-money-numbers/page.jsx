'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
// ─── Constants ────────────────────────────────────────────────────────────────

const MOBILE_TYPE_COLORS = {
  mtn:     { bg: '#FFF8E1', text: '#E65100', dot: '#FFB300' },
  airtel:  { bg: '#FCE4EC', text: '#880E4F', dot: '#E91E63' },
  zamtel:  { bg: '#E8F5E9', text: '#1B5E20', dot: '#43A047' },
  default: { bg: '#EDE7F6', text: '#4527A0', dot: '#7E57C2' },
};

function getTypeStyle(type) {
  return MOBILE_TYPE_COLORS[type?.toLowerCase()] || MOBILE_TYPE_COLORS.default;
}

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

// ─── InlineForm ───────────────────────────────────────────────────────────────
//
// CRITICAL: Defined at MODULE scope (outside the page component).
// If defined inside the page, React creates a new component type on every
// render, which unmounts/remounts the inputs and drops focus after every
// single keystroke. Keeping it here fixes that entirely.
//
function InlineForm({ label, confirmLabel, editState, setEditState, acceptedTypes, phoneCode, onCommit, onCancel, saving }) {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {label}
      </Typography>

      {/* Network type */}
      <FormControl fullWidth size="small">
        <InputLabel>Mobile Money Type</InputLabel>
        <Select
          value={editState.mobileType}
          label="Mobile Money Type"
          onChange={e => setEditState(s => ({ ...s, mobileType: e.target.value }))}
        >
          {acceptedTypes.map(type => (
            <MenuItem key={type} value={type}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getTypeStyle(type).dot }} />
                {type.toUpperCase()}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Local number — country code shown as a read-only adornment */}
      <TextField
        size="small"
        label="Mobile Number"
        value={editState.mobileNumber}
        onChange={e => setEditState(s => ({ ...s, mobileNumber: e.target.value }))}
        placeholder="971234567"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <PhoneIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                {phoneCode && (
                  <>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: 'text.secondary', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      {phoneCode}
                    </Typography>
                    <Box sx={{ width: '1px', height: 18, bgcolor: 'divider' }} />
                  </>
                )}
              </Box>
            </InputAdornment>
          ),
        }}
        fullWidth
      />

      {/* Account name */}
      <TextField
        size="small"
        label="Account Name"
        value={editState.name}
        onChange={e => setEditState(s => ({ ...s, name: e.target.value }))}
        placeholder="Name as registered on network"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        fullWidth
      />

      <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
        <Button variant="contained" size="small" startIcon={saving ? undefined : <CheckIcon />} onClick={onCommit} disabled={saving} sx={{ flex: 1, borderRadius: 2 }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : confirmLabel}
        </Button>
        <Button variant="outlined" size="small" startIcon={<CloseIcon />} onClick={onCancel} sx={{ flex: 1, borderRadius: 2 }}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MobileMoneyNumbersPage() {
  const router = useRouter();

  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [acceptedTypes, setAcceptedTypes] = useState([]);
  const [phoneCode, setPhoneCode]         = useState('');
  const [entries, setEntries]             = useState([]);
  const [editingId, setEditingId]         = useState(null);
  const [editState, setEditState]         = useState({ mobileNumber: '', mobileType: '', name: '' });
  const { user } = useAuth();
  useEffect(() => { loadData(); }, []);

  // ── Data ────────────────────────────────────────────────────────────────────

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/driver/payment-phone-numbers');
      setEntries((data.paymentPhoneNumbers || []).map(e => ({ ...e, _id: genId() })));
      setAcceptedTypes(data.acceptedMobileMoneyPayments || []);
      // phoneCode from user.country.phoneCode e.g. "+260"
      setPhoneCode(user?.country?.phoneCode);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── Edit helpers ────────────────────────────────────────────────────────────

  const startEdit = (entry) => {
    // Strip stored country code prefix so the user only edits the local part
    const localPart =
      phoneCode && entry.mobileNumber.startsWith(phoneCode)
        ? entry.mobileNumber.slice(phoneCode.length).replace(/^\s+/, '')
        : entry.mobileNumber;
    setEditingId(entry._id);
    setEditState({ mobileNumber: localPart, mobileType: entry.mobileType, name: entry.name });
    setError('');
  };

  const startAdd = () => {
    setEditingId('new');
    setEditState({ mobileNumber: '', mobileType: acceptedTypes[0] || '', name: '' });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState({ mobileNumber: '', mobileType: '', name: '' });
    setError('');
  };

  const validate = () => {
    if (!editState.mobileType) return 'Please select a mobile money type';

    const localDigits = editState.mobileNumber.replace(/\D/g, '');
    if (!localDigits)            return 'Please enter a mobile number';
    if (localDigits.length < 7)  return 'Number too short — enter local digits only (e.g. 971234567)';
    if (localDigits.length > 12) return 'Number too long — do not include the country code';

    if (!editState.name.trim()) return 'Please enter the account holder name';
    return null;
  };

  // Commits the entry AND immediately persists the full list to the backend.
  // The previous two-step flow (commit locally, then click Save Changes) was
  // confusing — the entry appeared on screen but was never actually saved.
  const commitAndSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    const localDigits = editState.mobileNumber.replace(/\D/g, '');
    const fullNumber  = phoneCode ? `${phoneCode}${localDigits}` : `${localDigits}`;

    // Build updated list without mutating state yet
    let updatedEntries;
    if (editingId === 'new') {
      updatedEntries = [...entries, { ...editState, mobileNumber: fullNumber.replace(/\D/g, ''), _id: genId() }];
    } else {
      updatedEntries = entries.map(e =>
        e._id === editingId ? { ...e, ...editState, mobileNumber: fullNumber.replace(/\D/g, '') } : e
      );
    }

    try {
      setSaving(true);
      setError('');
      const payload = updatedEntries.map(({ mobileNumber, mobileType, name }) => ({ mobileNumber, mobileType, name }));
      await apiClient.put('/driver/payment-phone-numbers', { paymentPhoneNumbers: payload });
      // Only commit to local state after a successful API response
      setEntries(updatedEntries);
      setSuccess('Saved!');
      setTimeout(() => setSuccess(''), 2500);
      cancelEdit();
    } catch (saveErr) {
      setError(saveErr.message || 'Failed to save — please try again');
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id) => {
    const updatedEntries = entries.filter(e => e._id !== id);
    try {
      setSaving(true);
      const payload = updatedEntries.map(({ mobileNumber, mobileType, name }) => ({ mobileNumber, mobileType, name }));
      await apiClient.put('/driver/payment-phone-numbers', { paymentPhoneNumbers: payload });
      setEntries(updatedEntries);
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err.message || 'Failed to remove number');
    } finally {
      setSaving(false);
    }
  };

  // Props forwarded to InlineForm
  const formProps = { editState, setEditState, acceptedTypes, phoneCode, onCommit: commitAndSave, onCancel: cancelEdit, saving };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', pb: 4 }}>

      {/* ── Header ── */}
      <Box
        sx={{
          px: 3, pt: 5, pb: 3,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
          color: '#fff',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          boxShadow: '0 8px 32px rgba(15,52,96,0.35)',
        }}
      >
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <IconButton onClick={() => router.push('/')} sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Payments
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48, height: 48, borderRadius: '14px',
                background: 'linear-gradient(135deg, #e94560, #c23152)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(233,69,96,0.4)',
              }}
            >
              <AccountBalanceIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Mobile Money</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.25 }}>
                Manage your payout numbers
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ px: 3, pt: 3, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert severity="error" sx={{ borderRadius: 3 }} onClose={() => setError('')}>{error}</Alert>
            </motion.div>
          )}
          {success && (
            <motion.div key="ok" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert severity="success" sx={{ borderRadius: 3 }}>{success}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2].map(i => <Skeleton key={i} variant="rounded" height={88} sx={{ borderRadius: 3 }} />)}
          </Box>
        )}

        {/* Entry cards */}
        {!loading && (
          <AnimatePresence initial={false}>
            {entries.map((entry, idx) => {
              const style     = getTypeStyle(entry.mobileType);
              const isEditing = editingId === entry._id;

              return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: isEditing ? '2px solid' : '1.5px solid',
                      borderColor: isEditing ? 'primary.main' : 'divider',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* View mode */}
                    {!isEditing && (
                      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 44, height: 44, borderRadius: '12px',
                            bgcolor: style.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <PhoneIcon sx={{ color: style.dot, fontSize: 22 }} />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                            <Chip
                              label={entry.mobileType.toUpperCase()}
                              size="small"
                              sx={{
                                bgcolor: style.bg, color: style.text,
                                fontWeight: 700, fontSize: '0.65rem', height: 20,
                                '& .MuiChip-label': { px: 1 },
                              }}
                            />
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {entry.mobileNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {entry.name}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <IconButton size="small" onClick={() => startEdit(entry)} sx={{ color: 'text.secondary' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => removeEntry(entry._id)} sx={{ color: 'error.light' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    )}

                    {/* Edit mode */}
                    {isEditing && <InlineForm {...formProps} label="Edit Number" confirmLabel="Save" />}
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && editingId !== 'new' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box
              sx={{
                textAlign: 'center', py: 6, px: 3,
                borderRadius: 4, border: '2px dashed', borderColor: 'divider', bgcolor: 'action.hover',
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>No payment numbers yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Add a mobile money number to receive payouts
              </Typography>
            </Box>
          </motion.div>
        )}

        {/* Add new form */}
        <AnimatePresence>
          {editingId === 'new' && (
            <motion.div key="new-form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Box
                sx={{
                  borderRadius: 3, border: '2px solid', borderColor: 'primary.main',
                  overflow: 'hidden', bgcolor: 'primary.50',
                }}
              >
                <InlineForm {...formProps} label="New Number" confirmLabel="Add" />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add button */}
        {!loading && editingId === null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={startAdd}
              disabled={acceptedTypes.length === 0}
              sx={{ height: 52, borderRadius: 3, borderStyle: 'dashed', fontWeight: 600, fontSize: '0.9rem' }}
            >
              Add Mobile Money Number
            </Button>
          </motion.div>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Go back home */}
        {!loading && (
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
            sx={{ height: 52, borderRadius: 3, fontWeight: 600, mt: 2 }}
          >
            Go Back Home
          </Button>
        )}
      </Box>
    </Box>
  );
}