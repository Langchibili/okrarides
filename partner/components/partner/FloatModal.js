// PATH: componentsFloatModal.js
'use client';
import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, Alert, Chip,
  ToggleButton, ToggleButtonGroup, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { modifyDriverFloat } from '@/lib/api/partner';

export default function FloatModal({
  open, onClose, driver, partnerFloatBalance,
  defaultAction = 'CREDIT', onSuccess, currency = 'K',
}) {
  const [action, setAction] = useState(defaultAction);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const numAmount = parseFloat(amount) || 0;
  const QUICK = [50, 100, 200, 500];
  const isCredit = action === 'CREDIT';
  const canSubmit = numAmount > 0 && !loading;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await modifyDriverFloat(driver.id, action, numAmount, note || undefined);
      onSuccess();
      onClose();
      setAmount('');
      setNote('');
    } catch (err) {
      setError(err.message || 'Failed to modify float');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Header */}
      <Box
        sx={{
          background: isCredit
            ? 'linear-gradient(135deg, #047857 0%, #059669 100%)'
            : 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
          px: 3, pt: 3, pb: 2.5,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>
          {isCredit ? 'Add Float' : 'Remove Float'}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
          {driver?.firstName} {driver?.lastName}
        </Typography>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {/* Action toggle */}
        <ToggleButtonGroup
          value={action}
          exclusive
          fullWidth
          onChange={(_, v) => { if (v) { setAction(v); setError(null); } }}
          sx={{ mb: 3 }}
        >
          {(['CREDIT', 'DEBIT']).map((a) => (
            <ToggleButton
              key={a}
              value={a}
              sx={{
                fontWeight: 700, fontSize: '0.85rem',
                '&.Mui-selected': {
                  background: a === 'CREDIT'
                    ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                    : 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
                  color: '#fff',
                },
              }}
            >
              {a === 'CREDIT' ? '+ Add Float' : '− Remove Float'}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Balance reference */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
          {[
            { label: 'Your Float', value: partnerFloatBalance, color: '#10B981' },
            { label: "Driver's Float", value: driver?.floatBalance, color: isCredit ? '#10B981' : '#EF4444' },
          ].map(({ label, value, color }) => (
            <Box key={label} sx={{ p: 1.5, borderRadius: 2, background: alpha(color, 0.08), border: `1px solid ${alpha(color, 0.2)}`, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {label}
              </Typography>
              <Typography sx={{ fontWeight: 800, color, fontSize: '1rem' }}>
                {currency}{Number(value ?? 0).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Amount */}
        <TextField
          fullWidth
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(null); }}
          InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>{currency}</Typography> }}
          sx={{ mb: 1.5 }}
        />

        {/* Quick amounts */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {QUICK.map((v) => (
            <Chip
              key={v}
              label={`${currency}${v}`}
              size="small"
              onClick={() => setAmount(String(v))}
              variant={amount === String(v) ? 'filled' : 'outlined'}
              color={amount === String(v) ? (isCredit ? 'success' : 'error') : 'default'}
              sx={{ cursor: 'pointer', fontWeight: 600 }}
            />
          ))}
        </Box>

        <TextField
          fullWidth
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mb: error ? 2 : 0 }}
        />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" sx={{ flex: 1, borderRadius: 2.5, fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          variant="contained"
          sx={{
            flex: 2, borderRadius: 2.5, fontWeight: 700, height: 48,
            background: isCredit
              ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
              : 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
          }}
        >
          {loading ? (
            <CircularProgress size={18} sx={{ color: '#fff' }} />
          ) : (
            `${isCredit ? 'Add' : 'Remove'} ${currency}${numAmount.toFixed(2)}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
