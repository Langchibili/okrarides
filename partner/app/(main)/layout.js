'use client';
// PATH: applayout.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box, Typography, Paper, Grid, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, CircularProgress, IconButton, Snackbar,
} from '@mui/material';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePartner } from '@/lib/hooks/usePartner';
import Sidebar from '@/components/partner/Sidebar';
import { PartnerSocketProvider } from '@/lib/socket/PartnerSocketProvider';
import { getFleetLocations } from '@/lib/api/partner';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { motion } from 'framer-motion';
import { getPhoneDigits } from '@/lib/utils/format';
import { ContentCopy as CopyIcon, CheckCircle as CheckIcon, Phone as PhoneIcon } from '@mui/icons-material';
import { WhatsApp as WaIcon } from '@mui/icons-material';
import { contactSupport } from '@/lib/api/partner';

function PartnerLayoutInner({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { dashboard, refreshDashboard } = usePartner();
  const [fleetDriverIds, setFleetDriverIds] = useState([]);
  const [userisNotProperlySetUp, setIsNotProperlySetUp] = useState(false)
  const { settings } = useAdminSettings();
  const phones = settings?.adminSupportNumbers ?? [];
  const emails = settings?.adminSupportEmails ?? [];
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    const status = user?.partnerProfile?.verificationStatus;
    if (!user?.partnerProfile) {
      setIsNotProperlySetUp(true)
    }
    if (!status) { router.push('/register'); return; }
    if (status !== 'approved' && pathname !== 'pending') {
      router.push('pending');
    }
    if (!user?.country) {
      setIsNotProperlySetUp(true)
    }
    if (typeof window !== 'undefined' && user?.country) {
      localStorage.setItem('savedCurrencyCode', user.country.currency?.code || 'ZMK')
      localStorage.setItem('savedCurrencySymbol', user.country.currency?.symbol || 'K')
      localStorage.setItem('savedPhoneCode', user?.country.phoneCode.replace('+', ''))
      localStorage.setItem('savedCountryName', user?.country.name)
    }
    if (pathname === "/") {
      router.push('/dashboard')
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    if (dashboard?.fleet) {
      // populate fleetDriverIds from fleet list if needed
    }
  }, [dashboard]);

  const handleReconnect = useCallback(async () => {
    refreshDashboard?.();
    try { await getFleetLocations(); } catch { }
  }, [refreshDashboard]);

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#10B981' }} />
          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            Loading partner dashboard…
          </Typography>
        </Box>
      </Box>
    );
  }

  const isApproved = user?.partnerProfile?.verificationStatus === 'approved';

  // PartnerSocketProvider always wraps children so every page inside this
  // layout can safely call usePartnerSocketContext() without throwing.
  if (userisNotProperlySetUp) {
    const handleCopyEmail = (email) => {
      navigator.clipboard.writeText(email).then(() => {
        setCopiedEmail(email);
        setToast({ msg: 'Email copied!', severity: 'success' });
        setTimeout(() => setCopiedEmail(null), 2000);
      });
    };
    return (
      <div style={{ padding: '10px' }}>
        <Alert severity='warning'>
          apologies, it seems your account was not set up properly, please contact us to have your account set up properly
        </Alert>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Paper
            sx={{
              marginTop: '10px',
              p: 3, borderRadius: 3, mb: 3,
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
        {/* Toast */}
        <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2.5 }}>{toast?.msg}</Alert>
        </Snackbar>
      </div>
    )
  }
  return (
    <PartnerSocketProvider fleetDriverIds={fleetDriverIds} onReconnect={handleReconnect}>
      {isApproved ? (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
          <Sidebar />
          <Box sx={{ flex: 1, ml: { xs: 0, md: '260px' }, display: 'flex', flexDirection: 'column' }}>
            {children}
          </Box>
        </Box>
      ) : (
        // Pending / unapproved state — no sidebar, but provider is still present
        <>{children}</>
      )}
    </PartnerSocketProvider>
  );
}

export default function PartnerLayout({ children }) {
  return <PartnerLayoutInner>{children}</PartnerLayoutInner>;
}