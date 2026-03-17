'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter }    from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Paper,
  Chip, TextField, Button, CircularProgress, Alert,
  Accordion, AccordionSummary, AccordionDetails,
  Modal, Divider, Snackbar, FormControlLabel, Checkbox,
} from '@mui/material';
import { alpha, useTheme }   from '@mui/material/styles';
import {
  ArrowBack     as BackIcon,
  ExpandMore    as ExpandIcon,
  ContentCopy   as CopyIcon,
  WhatsApp      as WhatsAppIcon,
  CameraAlt     as CameraIcon,
  Send          as SendIcon,
  CheckCircle   as CheckIcon,
  Phone         as PhoneIcon,
  Email         as EmailIcon,
  Close         as CloseIcon,
  Help          as HelpIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth }           from '@/lib/hooks/useAuth';
import { useAdminSettings }  from '@/lib/hooks/useAdminSettings';
import { useScreenshot }     from '@/lib/contexts/ScreenshotContext';
import { supportTicketsAPI } from '@/lib/api/supportTickets';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };
const ACCENT        = '#10B981';

const ISSUE_CATEGORIES = [
  {
    category: 'ride_issue', label: 'Ride Issues', emoji: '🚗', color: '#3B82F6',
    subjects: [
      'Driver did not arrive', 'Driver arrived very late',
      'Driver took the wrong route', 'Driver behaviour was inappropriate',
      'Ride was cancelled unexpectedly', 'Driver requested to cancel the ride',
      'Incorrect pickup location', 'Ride did not complete properly',
    ],
  },
  {
    category: 'payment_issue', label: 'Payment Issues', emoji: '💳', color: '#F59E0B',
    subjects: [
      'I was charged incorrectly', 'Payment failed but ride was completed',
      'Refund has not been received', 'Float top-up not reflecting',
      'Duplicate charge on my account', 'Float balance deducted incorrectly',
    ],
  },
  {
    category: 'subscription_issue', label: 'Subscription Issues', emoji: '📋', color: '#8B5CF6',
    subjects: [
      'Subscription is not activating', 'Subscription expired earlier than expected',
      'Free trial did not start',
      'Commission still being charged with active subscription',
      'Subscription renewal failed',
    ],
  },
  {
    category: 'account_issue', label: 'Account Issues', emoji: '👤', color: '#06B6D4',
    subjects: [
      'Cannot log into my account', 'Account is blocked or suspended',
      'Profile information is not updating', 'Phone number change issue',
      'Verification documents were rejected', 'I want to delete my account',
    ],
  },
  {
    category: 'technical_issue', label: 'Technical Issues', emoji: '⚙️', color: '#EF4444',
    subjects: [
      'App keeps crashing', 'Map is not loading',
      'Ride requests are not coming through', 'GPS / location is incorrect',
      'Push notifications are not working', 'App is very slow or unresponsive',
    ],
  },
  {
    category: 'feature_request', label: 'Feature Request', emoji: '💡', color: '#10B981',
    subjects: [
      'Request a new app feature',
      'Suggestion for ride matching improvement',
      'Request support for a new payment method',
    ],
  },
  {
    category: 'complaint', label: 'Complaint', emoji: '📣', color: '#F97316',
    subjects: [
      'Complaint about a driver', 'Complaint about a passenger',
      'Complaint about app policies', 'Safety concern or incident report',
    ],
  },
  {
    category: 'other', label: 'Other', emoji: '❓', color: '#9CA3AF',
    subjects: ['Something not listed here', 'General enquiry'],
  },
];

// ── Copy with fallback ────────────────────────────────────────────────────────
function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
  return Promise.resolve();
}

// ── Contact row ───────────────────────────────────────────────────────────────
function ContactRow({ value, type, isDark }) {
  const [copied, setCopied] = useState(false);
  const color = type === 'phone' ? '#10B981' : '#3B82F6';

  const handleCopy = () => {
    copyToClipboard(value).finally(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1,
      p: 1.5, borderRadius: 2.5,
      bgcolor: alpha(color, isDark ? 0.1 : 0.05),
      border: `1px solid ${alpha(color, 0.15)}`,
      mb: 1,
    }}>
      <Box sx={{
        width: 34, height: 34, borderRadius: 2, flexShrink: 0,
        bgcolor: alpha(color, isDark ? 0.2 : 0.1),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {type === 'phone'
          ? <PhoneIcon sx={{ fontSize: 16, color }} />
          : <EmailIcon sx={{ fontSize: 16, color }} />
        }
      </Box>

      <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, fontSize: 13 }}>
        {value}
      </Typography>

      {/* Copy button */}
      <IconButton size="small" onClick={handleCopy} sx={{
        width: 30, height: 30, borderRadius: 1.5,
        bgcolor: copied ? alpha('#10B981', 0.15) : alpha(color, 0.1),
        color:   copied ? '#10B981' : color,
        transition: 'all 0.2s',
      }}>
        {copied ? <CheckIcon sx={{ fontSize: 15 }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
      </IconButton>

      {/* WhatsApp — phones only */}
      {type === 'phone' && (
        <IconButton size="small" onClick={() => {
          const clean = value.replace(/\D/g, '');
          window.open(`https://wa.me/${clean}?text=Hello%2C%20I%20need%20support`, '_blank');
        }} sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: alpha('#25D366', 0.12), color: '#25D366' }}>
          <WhatsAppIcon sx={{ fontSize: 15 }} />
        </IconButton>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HelpPage() {
  const router  = useRouter();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const { user }                                    = useAuth();
  const { adminSupportNumbers, adminSupportEmails } = useAdminSettings();
 const {
  draftTicketId, screenshotCount,
  draftSubject, draftCategory,          // ← add these two
  startScreenshotMode, clearDraft, MAX_SCREENSHOTS,
} = useScreenshot();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubject,  setSelectedSubject]  = useState('');
  const [description,      setDescription]      = useState('');
  const [guestName,        setGuestName]         = useState('');
  const [guestPhone,       setGuestPhone]        = useState('');
  const [expandedCat,      setExpandedCat]       = useState(null);

  const [loading,          setLoading]           = useState(false);
  const [submitSuccess,    setSubmitSuccess]      = useState(false);
  const [submitError,      setSubmitError]        = useState(null);
  const [showInstructions, setShowInstructions]  = useState(false);
  const [creatingDraft,    setCreatingDraft]      = useState(false);
  const [snackMsg,         setSnackMsg]           = useState('');

  const isLoggedIn = !!user;
  const catObj     = ISSUE_CATEGORIES.find(c => c.category === selectedCategory);

  // Submit enabled as long as subject is selected
  const canSubmit = !!selectedSubject && (isLoggedIn || (guestName.trim() && guestPhone.trim()));

  // ── Start screenshot flow ─────────────────────────────────────────────────
  const handleStartScreenshot = async () => {
  if (!selectedSubject) return;
  setCreatingDraft(true);
  try {
    const ticket = await supportTicketsAPI.createDraft({
      category:    selectedCategory || 'other',
      subject:     selectedSubject,
      description: description.trim() || 'No description provided.',
      guestName:   !isLoggedIn ? guestName.trim()  : undefined,
      phoneNumber: !isLoggedIn ? guestPhone.trim() : undefined,
    });
    // ↓ now passes subject + category so context persists them
    startScreenshotMode(ticket.id ?? ticket.data?.id, selectedSubject, selectedCategory);
    setShowInstructions(true);
  } catch {
    setSubmitError('Could not create support ticket. Please try again.');
  } finally {
    setCreatingDraft(false);
  }
};
// ── Restore draft state when returning to help page ───────────────────────
useEffect(() => {
  if (draftTicketId && draftSubject && !selectedSubject) {
    // User had gone off to capture — restore their selections
    setSelectedSubject(draftSubject);
    setSelectedCategory(draftCategory);
  }
}, [draftTicketId, draftSubject, draftCategory])
  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      let ticketId = draftTicketId;

      // No draft yet (user skipped screenshot) — create one now
      if (!ticketId) {
        const ticket = await supportTicketsAPI.createDraft({
          category:    selectedCategory || 'other',
          subject:     selectedSubject,
          description: description.trim() || 'No description provided.',
          guestName:   !isLoggedIn ? guestName.trim()  : undefined,
          phoneNumber: !isLoggedIn ? guestPhone.trim() : undefined,
        });
        ticketId = ticket.id ?? ticket.data?.id;
      }

      await supportTicketsAPI.submitTicket(ticketId, {
        guestName:   !isLoggedIn ? guestName.trim()  : undefined,
        phoneNumber: !isLoggedIn ? guestPhone.trim() : undefined,
      });

      setSubmitSuccess(true);
      clearDraft();
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item    = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 2.5,
              background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 12px 32px ${alpha(ACCENT, 0.38)}`,
            }}>
              <CheckIcon sx={{ fontSize: 40, color: '#fff' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>Ticket Submitted!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
              Our support team has been notified and will get back to you shortly.
            </Typography>
            <Button variant="contained" onClick={() => router.back()}
              sx={{
                borderRadius: 3, height: 48, px: 4, fontWeight: 700, textTransform: 'none',
                background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                boxShadow: `0 4px 16px ${alpha(ACCENT, 0.36)}`,
              }}>
              Done
            </Button>
          </Box>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Help Center</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 10, ...hideScrollbar }}>
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <Paper elevation={0} sx={{
              p: 3, mb: 2, borderRadius: 4, textAlign: 'center',
              background: isDark
                ? `linear-gradient(145deg, ${alpha(ACCENT, 0.16)} 0%, ${alpha('#047857', 0.08)} 100%)`
                : `linear-gradient(145deg, ${alpha(ACCENT, 0.07)} 0%, ${alpha('#047857', 0.03)} 100%)`,
              border: `1px solid ${alpha(ACCENT, isDark ? 0.25 : 0.14)}`,
              position: 'relative', overflow: 'hidden',
            }}>
              <Box sx={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(ACCENT, 0.14)} 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <Box sx={{
                width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 1.5,
                background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px ${alpha(ACCENT, 0.38)}`,
              }}>
                <HelpIcon sx={{ fontSize: 28, color: '#fff' }} />
              </Box>
              <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>How can we help?</Typography>
              <Typography variant="body2" color="text.secondary">
                Tell us what's going on and we'll sort it out.
              </Typography>
            </Paper>
          </motion.div>

          {/* ── Issue selector — checkboxes ──────────────────────────────── */}
          <motion.div variants={item}>
            <Typography variant="overline" color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.25 }}>
              What issue are you facing?
            </Typography>

            {ISSUE_CATEGORIES.map((cat) => (
              <Accordion
                key={cat.category}
                expanded={expandedCat === cat.category}
                onChange={(_, open) => setExpandedCat(open ? cat.category : null)}
                elevation={0}
                sx={{
                  mb: 0.75, borderRadius: '12px !important',
                  border: `1px solid ${alpha(
                    selectedCategory === cat.category ? cat.color : theme.palette.divider,
                    isDark ? 0.2 : 0.1,
                  )}`,
                  background: selectedCategory === cat.category
                    ? isDark ? alpha(cat.color, 0.1) : alpha(cat.color, 0.04)
                    : 'transparent',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandIcon sx={{ fontSize: 18 }} />}
                  sx={{ minHeight: 52, px: 2, '& .MuiAccordionSummary-content': { my: 0.75 } }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: 2, flexShrink: 0,
                      bgcolor: alpha(cat.color, isDark ? 0.2 : 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15,
                    }}>
                      {cat.emoji}
                    </Box>
                    <Typography variant="body2" fontWeight={700}>{cat.label}</Typography>
                    {selectedCategory === cat.category && selectedSubject && (
                      <Chip size="small" label="Selected" sx={{
                        height: 18, fontSize: 10, fontWeight: 700,
                        bgcolor: alpha(cat.color, 0.15), color: cat.color,
                      }} />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 1.5, pt: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {cat.subjects.map((sub) => {
                      const checked = selectedSubject === sub && selectedCategory === cat.category;
                      return (
                        <FormControlLabel
                          key={sub}
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setSelectedSubject('');
                                  setSelectedCategory(null);
                                } else {
                                  setSelectedCategory(cat.category);
                                  setSelectedSubject(sub);
                                  setExpandedCat(null);
                                }
                              }}
                              size="small"
                              sx={{
                                color: alpha(cat.color, 0.5),
                                '&.Mui-checked': { color: cat.color },
                                p: 0.75,
                              }}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{
                              fontWeight: checked ? 700 : 500,
                              color: checked ? cat.color : 'text.primary',
                              fontSize: 13,
                            }}>
                              {sub}
                            </Typography>
                          }
                          sx={{
                            mx: 0, px: 1, py: 0.5, borderRadius: 2,
                            bgcolor: checked ? alpha(cat.color, isDark ? 0.12 : 0.06) : 'transparent',
                            transition: 'background 0.15s',
                            '&:hover': { bgcolor: alpha(cat.color, isDark ? 0.1 : 0.05) },
                          }}
                        />
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </motion.div>

          {/* ── Selected pill ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedSubject && catObj && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, mb: 0.5 }}>
                  <Typography variant="caption" color="text.disabled">Selected:</Typography>
                  <Chip
                    label={selectedSubject}
                    onDelete={() => { setSelectedSubject(''); setSelectedCategory(null); }}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: alpha(catObj.color, 0.12), color: catObj.color }}
                  />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Description (optional) ─────────────────────────────────────── */}
          <AnimatePresence>
            {selectedSubject && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              >
                <Paper elevation={0} sx={{
                  p: 2, mt: 1.5, borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.1)}`,
                  background: isDark ? alpha('#1E293B', 0.5) : alpha('#F8FAFC', 0.8),
                }}>
                  <Typography variant="overline" color="text.secondary"
                    sx={{ fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.25 }}>
                    Describe your issue{' '}
                    <Typography component="span" variant="overline" color="text.disabled">
                      (optional)
                    </Typography>
                  </Typography>
                  <TextField
                    fullWidth multiline rows={3}
                    placeholder="Please describe what happened in detail…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Guest info ─────────────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedSubject && !isLoggedIn && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.05 }}
              >
                <Paper elevation={0} sx={{
                  p: 2, mt: 1.5, borderRadius: 3,
                  border: `1px solid ${alpha('#F59E0B', isDark ? 0.2 : 0.12)}`,
                  background: isDark ? alpha('#F59E0B', 0.06) : alpha('#FFFBEB', 0.8),
                }}>
                  <Typography variant="overline" color="text.secondary"
                    sx={{ fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.25 }}>
                    Your Contact Info
                  </Typography>
                  <TextField fullWidth label="Your Name" value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    variant="outlined" size="small"
                    sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                  <TextField fullWidth label="Phone Number" value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    variant="outlined" size="small" type="tel"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Screenshot section ─────────────────────────────────────────── */}
          {/* ── Screenshot section ─────────────────────────────────────────────── */}
<AnimatePresence>
  {selectedSubject && (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.08 }}
    >
      <Paper elevation={0} sx={{
        p: 2, mt: 1.5, borderRadius: 3,
        border: `1px solid ${alpha(ACCENT, isDark ? 0.2 : 0.12)}`,
        background: isDark ? alpha(ACCENT, 0.07) : alpha(ACCENT, 0.03),
      }}>
        <Typography variant="overline" color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1 }}>
          Attach Screenshots{' '}
          <Typography component="span" variant="overline" color="text.disabled">
            (optional)
          </Typography>
        </Typography>

        {!draftTicketId ? (
          /* No draft — show capture button */
          <Button
            fullWidth variant="outlined"
            startIcon={creatingDraft ? <CircularProgress size={16} /> : <CameraIcon />}
            disabled={creatingDraft}
            onClick={handleStartScreenshot}
            sx={{
              height: 48, borderRadius: 2.5, fontWeight: 700,
              textTransform: 'none',
              borderColor: alpha(ACCENT, 0.4), color: ACCENT,
              '&:hover': { borderColor: ACCENT, bgcolor: alpha(ACCENT, 0.06) },
            }}
          >
            {creatingDraft ? 'Setting up…' : 'Take Screenshot of Issue'}
          </Button>
        ) : (
          /* Draft exists — user went to capture or already has screenshots */
          <Box>
            {screenshotCount > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  bgcolor: alpha(ACCENT, isDark ? 0.2 : 0.1),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CheckIcon sx={{ fontSize: 18, color: ACCENT }} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700} color={ACCENT}>
                    {screenshotCount} screenshot{screenshotCount !== 1 ? 's' : ''} attached
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {screenshotCount < MAX_SCREENSHOTS
                      ? 'Use the floating button to capture more'
                      : `Maximum ${MAX_SCREENSHOTS} reached`
                    }
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CameraIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">
                  Use the floating button at the bottom of any page to capture a screenshot.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </motion.div>
  )}
</AnimatePresence>
          {/* ── Error ─────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {submitError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }} onClose={() => setSubmitError(null)}>
                  {submitError}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Submit — visible whenever subject is selected ─────────────── */}
          <AnimatePresence>
            {selectedSubject && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
              >
                <Button
                  fullWidth variant="contained" size="large"
                  startIcon={loading
                    ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                    : <SendIcon />
                  }
                  disabled={loading || !canSubmit}
                  onClick={handleSubmit}
                  sx={{
                    mt: 2, height: 54, borderRadius: 3.5, fontWeight: 800,
                    textTransform: 'none', fontSize: 15,
                    background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                    boxShadow: `0 6px 24px ${alpha(ACCENT, 0.38)}`,
                    '&:disabled': { opacity: 0.55 },
                  }}
                >
                  {loading ? 'Submitting…' : 'Submit Support Ticket'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <Divider sx={{ my: 3 }} />

          {/* ── Contact section ────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <Typography variant="overline" color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5 }}>
              Contact Support Directly
            </Typography>

            {Array.isArray(adminSupportNumbers) && adminSupportNumbers.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.disabled"
                  sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.75 }}>
                  📞 Phone Numbers
                </Typography>
                {adminSupportNumbers.map((n, i) => (
                  <ContactRow
                    key={i}
                    value={typeof n === 'object' ? (n.number ?? n.value ?? '') : n}
                    type="phone"
                    isDark={isDark}
                  />
                ))}
                <Button
                  fullWidth variant="contained" size="large"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => {
                    const first = adminSupportNumbers[0];
                    const num   = typeof first === 'object' ? (first.number ?? first.value) : first;
                    window.open(`https://wa.me/${(num || '').replace(/\D/g, '')}?text=Hello%2C%20I%20need%20support`, '_blank');
                  }}
                  sx={{
                    mt: 1, height: 48, borderRadius: 3, fontWeight: 700,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    boxShadow: `0 4px 16px ${alpha('#25D366', 0.38)}`,
                  }}
                >
                  Chat With Us on WhatsApp
                </Button>
              </Box>
            )}

            {Array.isArray(adminSupportEmails) && adminSupportEmails.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.disabled"
                  sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.75 }}>
                  ✉️ Email Addresses
                </Typography>
                {adminSupportEmails.map((e, i) => (
                  <ContactRow
                    key={i}
                    value={typeof e === 'object' ? (e.email ?? e.value ?? '') : e}
                    type="email"
                    isDark={isDark}
                  />
                ))}
              </Box>
            )}
          </motion.div>

        </motion.div>
      </Box>

      {/* ── Instructions modal ─────────────────────────────────────────────── */}
      <Modal open={showInstructions} onClose={() => setShowInstructions(false)}>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <motion.div
            initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ width: '100%', maxWidth: 480 }}
          >
            <Paper elevation={24} sx={{
              p: 3, borderRadius: '24px 24px 0 0',
              background: isDark ? 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)' : '#fff',
            }}>
              <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mb: 2.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={800}>How to Capture a Screenshot</Typography>
                <IconButton size="small" onClick={() => setShowInstructions(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {[
                { step: '1', text: 'Close this modal and navigate to the page where you see the issue.' },
                { step: '2', text: 'Tap the floating "Capture Screenshot" button at the bottom of the screen.' },
                { step: '3', text: 'Grant screen share permission when prompted by your device.' },
                { step: '4', text: 'Come back here and tap Submit once you\'ve captured everything you need.' },
              ].map(({ step, text }) => (
                <Box key={step} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 2px 8px ${alpha(ACCENT, 0.35)}`,
                  }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{step}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.65, pt: 0.4 }}>{text}</Typography>
                </Box>
              ))}

              <Button
                fullWidth variant="contained" size="large"
                onClick={() => setShowInstructions(false)}
                sx={{
                  mt: 1, height: 50, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                  boxShadow: `0 4px 16px ${alpha(ACCENT, 0.36)}`,
                }}
              >
                Got It — Take Me There
              </Button>
            </Paper>
          </motion.div>
        </Box>
      </Modal>

      <Snackbar
        open={!!snackMsg} autoHideDuration={3000}
        onClose={() => setSnackMsg('')} message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}