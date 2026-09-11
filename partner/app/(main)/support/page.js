// PATH: appsupport/page.js
'use client';
import { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, CircularProgress, IconButton, Snackbar,
} from '@mui/material';
import { ContentCopy as CopyIcon, CheckCircle as CheckIcon, Phone as PhoneIcon } from '@mui/icons-material';
import { WhatsApp as WaIcon } from '@mui/icons-material';
import { contactSupport } from '@/lib/api/partner';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { getPhoneDigits } from '@/lib/utils/format';
import { motion } from 'framer-motion';

const SUBJECT_OPTIONS = [
  'General Inquiry', 'Float Issue', 'Driver Issue',
  'Vehicle Issue', 'Technical Problem', 'Billing/Payment', 'Account Issue',
];

export default function SupportPage() {
  const { settings } = useAdminSettings();
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [toast, setToast] = useState(null);

  const canSubmit = message.trim().length >= 20 && !loading;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await contactSupport(subject, message);
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedEmail(email);
      setToast({ msg: 'Email copied!', severity: 'success' });
      setTimeout(() => setCopiedEmail(null), 2000);
    });
  };

  const phones = settings?.adminSupportNumbers ?? [];
  const emails = settings?.adminSupportEmails ?? [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: 'auto', minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 1 }}>Contact Support</Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 4 }}>
        Our team will get back to you within 24 hours.
      </Typography>

      {/* ── Two-column layout via CSS Grid ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          gap: 3,
          alignItems: 'start',
          '& > *': { minWidth: 0, minHeight: 0 },
        }}
      >
        {/* Contact info section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Paper
            sx={{
              p: 3, borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(5,150,105,0.1) 0%, rgba(4,120,87,0.05) 100%)',
              border: '1px solid rgba(5,150,105,0.2)',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#fff', mb: 2.5 }}>📞 Contact Us Directly</Typography>

            {phones.length > 0 ? (
              phones.map((phone, i) => {
                const raw = typeof phone === 'object' ? phone.number ?? phone.phone : phone;
                const label = typeof phone === 'object' ? phone.label || raw : raw;
                const digits = getPhoneDigits(raw);
                return (
                  <Box key={i} sx={{ mb: 2.5, pb: 2.5, borderBottom: i < phones.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', mb: 1 }}>{label}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        href={`tel:${digits}`}
                        component="a"
                        variant="outlined"
                        size="small"
                        startIcon={<PhoneIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700, flex: 1 }}
                      >
                        Call
                      </Button>
                      <Button
                        href={`https://wa.me/${digits}`}
                        target="_blank"
                        component="a"
                        variant="outlined"
                        size="small"
                        startIcon={<WaIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700, flex: 1, borderColor: '#25D366', color: '#25D366', '&:hover': { borderColor: '#25D366', bgcolor: 'rgba(37,211,102,0.08)' } }}
                      >
                        WhatsApp
                      </Button>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No phone numbers configured</Typography>
            )}

            {emails.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5 }}>
                  Email
                </Typography>
                {emails.map((email, i) => {
                  const addr = typeof email === 'object' ? email.email ?? email.address : email;
                  return (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography sx={{ flex: 1, fontSize: '0.85rem', color: '#fff', fontWeight: 500 }} noWrap>{addr}</Typography>
                      <IconButton size="small" onClick={() => handleCopyEmail(addr)} sx={{ color: copiedEmail === addr ? '#10B981' : 'rgba(255,255,255,0.4)' }}>
                        {copiedEmail === addr ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </motion.div>

        {/* Contact form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#fff', mb: 2.5 }}>💬 Send a Message</Typography>

            {success ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckIcon sx={{ fontSize: 56, color: '#10B981', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', mb: 1 }}>
                  Message Sent!
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
                  Our team will contact you within 24 hours.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => { setSuccess(false); setMessage(''); setSubject('General Inquiry'); }}
                  sx={{ borderRadius: 2.5, fontWeight: 700 }}
                >
                  Send Another Message
                </Button>
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Subject</InputLabel>
                  <Select value={subject} label="Subject" onChange={(e) => setSubject(e.target.value)}>
                    {SUBJECT_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail (minimum 20 characters)…"
                  sx={{ mb: 1 }}
                />
                <Typography sx={{ fontSize: '0.75rem', color: message.trim().length < 20 ? '#F59E0B' : 'rgba(255,255,255,0.3)', mb: 2, textAlign: 'right' }}>
                  {message.length} / 2000 chars
                  {message.trim().length < 20 && ` · Need at least ${20 - message.trim().length} more chars`}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  sx={{ height: 52, borderRadius: 2.5, fontWeight: 700, fontSize: '0.95rem' }}
                >
                  {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : '📤 Send Message'}
                </Button>
              </>
            )}
          </Paper>
        </motion.div>
      </Box>

      {/* Toast */}
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2.5 }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}