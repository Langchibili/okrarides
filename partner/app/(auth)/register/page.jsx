'use client';
// PATH: app/register/page.jsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Collapse,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CheckCircle as CheckIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  WhatsApp as WhatsAppIcon,
  AssignmentInd as DocsIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

// ── Partner requirements ──────────────────────────────────────────────────────
const PARTNER_REQUIREMENTS = [
  {
    section: 'Business Registration Documents',
    emoji: '🏢',
    items: [
      'Certificate of Incorporation or Business Registration Certificate issued by the relevant government authority (e.g. PACRA in Zambia, CAC in Nigeria, CIPC in South Africa).',
      'Valid Trading Licence / Business Operating Licence from the local council or municipal authority.',
      'Company Tax Identification Number (TIN / TPIN) — issued by the national revenue authority.',
      'Memorandum and Articles of Association (for limited companies and corporate entities).',
      'Proof of registered business address (e.g. utility bill, lease agreement, or rates notice not older than 3 months).',
    ],
  },
  {
    section: 'Identity Verification',
    emoji: '🪪',
    items: [
      'Valid National Identity Card or Passport for all directors, shareholders, and authorised signatories.',
      'Recent proof of personal residential address (utility bill or bank statement, not older than 3 months).',
      'For sole traders: a copy of your National Registration Card (NRC) or equivalent government-issued ID.',
    ],
  },
  {
    section: 'Vehicle & Operations Documents',
    emoji: '🚗',
    items: [
      'Vehicle Registration Certificate (logbook) for each vehicle to be listed on the platform.',
      'Valid roadworthiness / fitness certificate for each vehicle.',
      'Comprehensive or third-party vehicle insurance certificate.',
      'Professional / Public Service Vehicle (PSV) licence or equivalent transport permit.',
      "Copy of valid driver's licence(s) for all drivers who will operate under your account.",
    ],
  },
  {
    section: 'Financial & Banking Information',
    emoji: '🏦',
    items: [
      'Bank account details in the business name (account name, account number, bank name and branch code).',
      'Recent bank statement (last 3 months) confirming the business account.',
      'Mobile money account details (e.g. Airtel Money, MTN MoMo, Zamtel Kwacha) registered to the business or authorised contact.',
    ],
  },
  {
    section: 'Business Contact Information',
    emoji: '📞',
    items: [
      'Primary business email address (must be accessible and actively monitored).',
      'Business phone number (WhatsApp-enabled preferred for quick communication).',
      'Physical street address of the principal place of business.',
      'Name and contact details of the designated account manager or representative.',
    ],
  },
  {
    section: 'Additional Notes',
    emoji: '📋',
    items: [
      'All documents must be submitted in English or accompanied by a certified translation.',
      'Scanned copies are accepted during the application stage; originals may be requested for verification.',
      'Applications with incomplete documentation will not be processed until all required items are received.',
      'Our onboarding team will contact you within 3–5 business days after a complete submission.',
    ],
  },
];

// ── Clipboard helper ──────────────────────────────────────────────────────────
function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch { }
  document.body.removeChild(ta);
  return Promise.resolve();
}

// ── ContactRow (same as HelpPage) ─────────────────────────────────────────────
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
      p: 1.5, borderRadius: 2.5, mb: 1,
      bgcolor: alpha(color, isDark ? 0.1 : 0.05),
      border: `1px solid ${alpha(color, 0.15)}`,
    }}>
      <Box sx={{
        width: 34, height: 34, borderRadius: 2, flexShrink: 0,
        bgcolor: alpha(color, isDark ? 0.2 : 0.1),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {type === 'phone'
          ? <PhoneIcon sx={{ fontSize: 16, color }} />
          : <EmailIcon sx={{ fontSize: 16, color }} />}
      </Box>

      <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, fontSize: 13 }}>
        {value}
      </Typography>

      <IconButton
        size="small"
        onClick={handleCopy}
        sx={{
          width: 30, height: 30, borderRadius: 1.5, transition: 'all 0.2s',
          bgcolor: copied ? alpha('#10B981', 0.15) : alpha(color, 0.1),
          color: copied ? '#10B981' : color,
        }}
      >
        {copied ? <CheckIcon sx={{ fontSize: 15 }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
      </IconButton>

      {type === 'phone' && (
        <IconButton
          size="small"
          onClick={() => window.open(
            `https://wa.me/${value.replace(/\D/g, '')}?text=Hello%2C%20I%20would%20like%20to%20become%20a%20partner`,
            '_blank'
          )}
          sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: alpha('#25D366', 0.12), color: '#25D366' }}
        >
          <WhatsAppIcon sx={{ fontSize: 15 }} />
        </IconButton>
      )}
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { adminSupportNumbers, adminSupportEmails } = useAdminSettings();

  const [showRequirements, setShowRequirements] = useState(false);

  // Already logged in → go to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated() && user?.partnerProfile?.verificationStatus) router.replace('/dashboard');
  }, [authLoading, isAuthenticated, router, user]);

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasNumbers = Array.isArray(adminSupportNumbers) && adminSupportNumbers.length > 0;
  const hasEmails = Array.isArray(adminSupportEmails) && adminSupportEmails.length > 0;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', p: 3, pb: 10 }}>

      {/* Header */}
      <Box sx={{ pt: 6, pb: 3 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            Become a Partner
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Partner accounts are set up by our team. Reach out to us directly and we'll get you onboarded.
          </Typography>
        </motion.div>
      </Box>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

        {/* ── Contact card ─────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{
          p: 2.5, borderRadius: 3, mb: 2.5,
          bgcolor: isDark ? alpha('#10B981', 0.07) : alpha('#10B981', 0.04),
          border: `1px solid ${alpha('#10B981', isDark ? 0.2 : 0.12)}`,
        }}>
          <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary', mb: 2 }}>
            Interested in joining our network as a transport or fleet partner?{' '}
            <strong style={{ color: theme.palette.text.primary }}>
              Call us or send a message
            </strong>{' '}
            to any of the numbers or email addresses below — our onboarding team will guide you through the process and create your account.
          </Typography>

          {/* Phone numbers */}
          {hasNumbers && (
            <Box sx={{ mb: hasEmails ? 2 : 0 }}>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.75 }}>
                📞 Phone / WhatsApp
              </Typography>
              {adminSupportNumbers.map((n, i) => (
                <ContactRow key={i} value={typeof n === 'object' ? (n.number ?? n.value ?? '') : n} type="phone" isDark={isDark} />
              ))}

              {/* WhatsApp group CTA */}
              <Button
                fullWidth
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={() => {
                  const first = adminSupportNumbers[0];
                  const num = typeof first === 'object' ? (first.number ?? first.value) : first;
                  window.open(`https://wa.me/${(num || '').replace(/\D/g, '')}?text=Hello%2C%20I%20would%20like%20to%20become%20a%20partner`, '_blank');
                }}
                sx={{
                  mt: 1, height: 48, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                  background: 'linear-gradient(135deg,#25D366 0%,#128C7E 100%)',
                  boxShadow: `0 4px 16px ${alpha('#25D366', 0.35)}`,
                }}
              >
                Message Us on WhatsApp
              </Button>
            </Box>
          )}

          {/* Email addresses */}
          {hasEmails && (
            <Box>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.75 }}>
                ✉️ Email
              </Typography>
              {adminSupportEmails.map((e, i) => (
                <ContactRow key={i} value={typeof e === 'object' ? (e.email ?? e.value ?? '') : e} type="email" isDark={isDark} />
              ))}
            </Box>
          )}
        </Paper>

        {/* ── Requirements toggle ───────────────────────────────────────── */}
        <Paper elevation={0} sx={{
          borderRadius: 3, overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.1)}`,
        }}>
          <Button
            fullWidth
            onClick={() => setShowRequirements((v) => !v)}
            sx={{
              p: 2, justifyContent: 'space-between', textTransform: 'none',
              color: 'text.primary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                bgcolor: alpha('#8B5CF6', isDark ? 0.2 : 0.1),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DocsIcon sx={{ fontSize: 18, color: '#8B5CF6' }} />
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={700}>Partner Requirements</Typography>
                <Typography variant="caption" color="text.secondary">Documents &amp; information needed to onboard</Typography>
              </Box>
            </Box>
            {showRequirements
              ? <CollapseIcon sx={{ color: 'text.secondary' }} />
              : <ExpandIcon sx={{ color: 'text.secondary' }} />}
          </Button>

          <Collapse in={showRequirements}>
            <Box sx={{ px: 2.5, pb: 2.5, pt: 0.5 }}>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2.5, fontSize: 12 }}>
                Please have these documents ready when you contact us. Incomplete submissions will be put on hold until all required items are received.
              </Alert>

              {PARTNER_REQUIREMENTS.map((block) => (
                <Box key={block.section} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography sx={{ fontSize: 16 }}>{block.emoji}</Typography>
                    <Typography variant="body2" fontWeight={800}>{block.section}</Typography>
                  </Box>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {block.items.map((item, idx) => (
                      <Box component="li" key={idx} sx={{ mb: 0.75 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: 12.5 }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Contact info repeated at bottom of requirements */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600 }}>
                Ready to apply? Contact our team:
              </Typography>
              {hasNumbers && adminSupportNumbers.map((n, i) => (
                <ContactRow key={i} value={typeof n === 'object' ? (n.number ?? n.value ?? '') : n} type="phone" isDark={isDark} />
              ))}
              {hasEmails && adminSupportEmails.map((e, i) => (
                <ContactRow key={i} value={typeof e === 'object' ? (e.email ?? e.value ?? '') : e} type="email" isDark={isDark} />
              ))}
            </Box>
          </Collapse>
        </Paper>

      </motion.div>

      <Box sx={{ flex: 1 }} />

      {/* Sign in link */}
      <Button
        fullWidth
        variant="text"
        onClick={() => router.push('/login')}
        sx={{ height: 48, mt: 4, textTransform: 'none' }}
      >
        Already have an account?&nbsp;<strong>Sign In</strong>
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
        Partner accounts are managed by our onboarding team.
      </Typography>
    </Box>
  );
}