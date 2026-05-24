// PATH: apppending/page.js
'use client';
import { useState } from 'react';
import { Box, Typography, Chip, Alert, Button, CircularProgress } from '@mui/material';
import { HourglassEmpty as HourglassIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { getPhoneDigits } from '@/lib/utils/format';

export default function PendingPage() {
  const { user, refreshUser } = useAuth();
  const { settings } = useAdminSettings();
  const profile = user?.partnerProfile;
  const status = profile?.verificationStatus ?? 'pending';
  const [refreshing, setRefreshing] = useState(false);

  const statusChip = {
    pending: { label: 'UNDER REVIEW', color: 'warning' },
    rejected: { label: 'REJECTED', color: 'error' },
    suspended: { label: 'SUSPENDED', color: 'error' },
  }[status] ?? { label: status?.toUpperCase(), color: 'default' };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const u = await refreshUser();
      if (u?.partnerProfile?.verificationStatus === 'approved') {
        window.location.href = 'dashboard';
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', p: 3 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
        <Box sx={{ maxWidth: 480, p: 4, borderRadius: 4, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, animation: status === 'pending' ? 'spin 3s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }}>
            <HourglassIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
          </Box>

          <Chip label={statusChip.label} color={statusChip.color} sx={{ mb: 2, fontWeight: 700, letterSpacing: 0.8 }} />

          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>
            {status === 'pending' ? 'Application Under Review' : status === 'rejected' ? 'Application Rejected' : 'Account Suspended'}
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, mb: 3 }}>
            {status === 'pending' && "Your partner application has been submitted and is under review. You'll receive an SMS notification once your account is approved."}
            {status === 'rejected' && "Your partner application was not approved at this time. Please review the notes below and contact support for assistance."}
            {status === 'suspended' && "Your account has been temporarily suspended. Please contact Okra support for assistance."}
          </Typography>

          {status === 'rejected' && profile?.verificationNotes && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>{profile.verificationNotes}</Alert>
          )}

          <Button onClick={handleRefresh} disabled={refreshing} variant="contained" fullWidth sx={{ mb: 3, height: 48, borderRadius: 2.5, fontWeight: 700 }}>
            {refreshing ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : '🔄 Refresh Status'}
          </Button>

          {settings?.adminSupportNumbers?.length > 0 && (
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', pt: 3 }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Need Help? Contact Us
              </Typography>
              {settings.adminSupportNumbers.map((num, i) => {
                const digits = getPhoneDigits(typeof num === 'object' ? num.number : num);
                const display = typeof num === 'object' ? num.label || num.number : num;
                return (
                  <Box key={i} sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 1 }}>
                    <Button size="small" href={`tel:${digits}`} component="a" sx={{ borderRadius: 2, fontWeight: 700, color: '#10B981' }}>📞 {display}</Button>
                    <Button size="small" href={`https://wa.me/${digits}`} target="_blank" component="a" sx={{ borderRadius: 2, fontWeight: 700, color: '#25D366' }}>💬 WhatsApp</Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </motion.div>
    </Box>
  );
}
