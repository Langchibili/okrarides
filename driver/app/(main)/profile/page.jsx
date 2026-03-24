'use client';
import { useEffect, useState } from 'react';  // ← add useState
import { useRouter }   from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Avatar, Paper,
  List, ListItemIcon, ListItemText, ListItemButton,
  Divider, IconButton, Chip, Modal, Button,  // ← add Modal, Button
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Edit as EditIcon, PersonOutline as ProfileIcon,
  Settings as SettingsIcon, DirectionsCar as VehicleIcon,
  VerifiedUser as VerifiedIcon, Assessment as PerformanceIcon,
  CardGiftcard as ReferralIcon, Help as HelpIcon,
  Description as DocumentIcon, Logout as LogoutIcon,
  ChevronRight as ChevronIcon, Star as StarIcon,
  AccountBalance as AccountBalanceIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth }   from '@/lib/hooks/useAuth';
import { useDriver } from '@/lib/hooks/useDriver';
import { VERIFICATION_STATUS } from '@/Constants';
import { useAdminSettings }  from '@/lib/hooks/useAdminSettings';
import { getImageUrl } from '@/Functions';
import { apiClient } from '@/lib/api/client';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } } };


// ── Logout confirmation modal ─────────────────────────────────────────────────
function LogoutModal({ open, onConfirm, onCancel }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Modal open={open} onClose={onCancel}>
      <Box sx={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2,
      }}>
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{   scale: 0.85, opacity: 0, y: 20  }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <Paper elevation={24} sx={{
            p: 3.5, borderRadius: 4, maxWidth: 320, width: '100%',
            background: isDark
              ? 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)'
              : '#ffffff',
            border: `1px solid ${alpha('#EF4444', isDark ? 0.22 : 0.12)}`,
            boxShadow: `0 24px 64px ${alpha('#000', isDark ? 0.55 : 0.18)}`,
            textAlign: 'center',
          }}>
            <motion.div
              initial={{ rotate: -12, scale: 0.7 }}
              animate={{ rotate: 0,   scale: 1   }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
            >
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 2.5,
                background: `linear-gradient(135deg, ${alpha('#EF4444', 0.18)} 0%, ${alpha('#B91C1C', 0.1)} 100%)`,
                border: `2px solid ${alpha('#EF4444', 0.25)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 20px ${alpha('#EF4444', 0.22)}`,
              }}>
                <LogoutIcon sx={{ fontSize: 28, color: '#EF4444' }} />
              </Box>
            </motion.div>

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75, letterSpacing: -0.2 }}>
              Log Out?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              Are you sure you want to log out of OkraRides?
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.25 }}>
              <Button
                fullWidth variant="outlined" size="large"
                onClick={onCancel}
                sx={{
                  height: 48, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                  borderColor: alpha(theme.palette.divider, 0.6),
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'text.secondary', bgcolor: alpha('#000', 0.03) },
                }}
              >
                No
              </Button>
              <Button
                fullWidth variant="contained" size="large"
                onClick={onConfirm}
                sx={{
                  height: 48, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                  background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                  boxShadow: `0 4px 16px ${alpha('#EF4444', 0.38)}`,
                  '&:hover': { boxShadow: `0 6px 20px ${alpha('#EF4444', 0.48)}` },
                }}
              >
                Yes
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router  = useRouter();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const { user, logout } = useAuth();
  const { driverProfile } = useDriver();
  const { isSubscriptionSystemEnabled } = useAdminSettings();
  const [showLogout, setShowLogout] = useState(false);  // ← add this
  const [frontenUrl, setLandingPageUrl] = useState(process.env.NEXT_PUBLIC_FRONTEND_URL)

   useEffect(() => {
    const getFrontendUrl = async () => {
      const res = await apiClient.get('/frontend-url').catch(() => null);
      const url = res?.data?.paths?.['okra-frontend-app'];
      if (url) setLandingPageUrl(url);
    }
    getFrontendUrl();
  }, []);

  // ... all existing logic unchanged below this line ...

  const verStatus = driverProfile?.verificationStatus;
  const verBadge = {
    [VERIFICATION_STATUS.APPROVED]: { label: '✓ Verified',   color: 'success' },
    [VERIFICATION_STATUS.PENDING]:  { label: '⏳ Pending',    color: 'warning' },
    [VERIFICATION_STATUS.REJECTED]: { label: '✗ Rejected',   color: 'error'   },
  }[verStatus] ?? { label: 'Not Verified', color: 'default' };

  const statItems = [
    { value: driverProfile?.totalRides || 0,                            label: 'Rides',      color: '#3B82F6' },
    { value: `★ ${driverProfile?.averageRating?.toFixed(1) || '0.0'}`,  label: 'Rating',     color: '#F59E0B' },
    { value: `${driverProfile?.completionRate?.toFixed(0) || 0}%`,      label: 'Completion', color: '#10B981' },
  ];

  const accountItems = [
    { icon: ProfileIcon,     primary: 'Edit Profile',    secondary: 'Name, photo, contact info',
      path: '/profile/edit',        color: '#3B82F6' },
    { icon: VerifiedIcon,    primary: 'Verification',    secondary: verStatus || 'Not started',
      path: verStatus === VERIFICATION_STATUS.PENDING ? '/onboarding/pending' : '/onboarding/welcome',
      color: verStatus === VERIFICATION_STATUS.APPROVED ? '#10B981' : '#F59E0B' },
    { icon: VehicleIcon,     primary: 'Vehicle',         secondary: driverProfile?.assignedVehicle
        ? `${driverProfile.assignedVehicle.make} ${driverProfile.assignedVehicle.model}` : 'No vehicle',
      path: '/onboarding/vehicle-type', color: '#8B5CF6' },
    { icon: PerformanceIcon, primary: 'Performance',     secondary: 'Stats, ratings, completion',
      path: '/earnings/analytics', color: '#06B6D4' },
  ];

  const financeItems = [
    { icon: AccountBalanceIcon, primary: 'Mobile Money Numbers', secondary: driverProfile?.paymentPhoneNumbers?.length > 0
        ? `${driverProfile.paymentPhoneNumbers.length} saved` : 'Add payout numbers',
      path: '/mobile-money-numbers', color: '#3B82F6' },
    { icon: DocumentIcon, primary: 'Withdrawals',      secondary: 'Request withdrawal',
      path: '/earnings/withdraw',   color: '#F59E0B' },
    { icon: ReferralIcon, primary: 'Referral Program', secondary: 'Earn by referring friends',
      path: '/affiliate',   color: '#EC4899' },
  ];

  if (isSubscriptionSystemEnabled) {
    financeItems.push({
      icon: ReferralIcon, primary: 'Subscription',
      secondary: driverProfile?.subscriptionStatus === 'active' ? 'Active — 0% commission' : 'View plans',
      path: '/subscription/plans', color: '#10B981',
    });
  }

  const supportItems = [
    { icon: SettingsIcon, primary: 'Settings',    secondary: 'Preferences, notifications', path: '/profile/settings', color: '#6B7280' },
    { icon: HelpIcon,     primary: 'Help Center', secondary: 'FAQs, contact support',      path: '/help',             color: '#3B82F6' },
    { icon: InfoIcon,     primary: 'About', secondary: 'FAQs, contact support',      path: '/about',             color: '#48a254' },
    { icon: DocumentIcon, primary: 'Legal',       secondary: 'Terms, privacy policy',       path: frontenUrl+'/terms.html',    color: '#6B7280' },
  ];

  const sections = [
    { label: 'Account',            items: accountItems  },
    { label: 'Earnings & Finance', items: financeItems  },
    { label: 'Support & Settings', items: supportItems  },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
          : `linear-gradient(135deg, #ffffff 0%, #F8FAFC 100%)`,
        borderBottom: `1px solid ${isDark ? alpha('#fff', 0.07) : alpha('#000', 0.08)}`,
        boxShadow: isDark ? `0 4px 20px rgba(0,0,0,0.4)` : `0 4px 20px rgba(0,0,0,0.06)`,
      }}>
        <Box sx={{ height: 2, background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%)' }} />
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, color: isDark ? 'inherit' : 'text.primary' }}>Profile</Typography>
          <IconButton onClick={() => router.push('/profile/edit')} sx={{ color: isDark ? 'inherit' : 'text.primary' }}>
            <EditIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 4, ...hideScrollbar }}>
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* ── Profile hero ──────────────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <Paper elevation={isDark ? 0 : 3} sx={{
              p: 3, mb: 2, borderRadius: 4, textAlign: 'center',
              border: `1px solid ${isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07)}`,
              background: isDark
                ? `linear-gradient(145deg, ${alpha('#3B82F6', 0.1)} 0%, ${alpha('#10B981', 0.06)} 100%)`
                : `linear-gradient(145deg, #ffffff 0%, #F0FDF4 100%)`,
              boxShadow: isDark ? 'none' : `0 6px 30px rgba(0,0,0,0.09)`,
              position: 'relative', overflow: 'hidden',
            }}>
              <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${alpha('#3B82F6', isDark ? 0.12 : 0.07)} 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${alpha('#10B981', isDark ? 0.1 : 0.06)} 0%, transparent 70%)`, pointerEvents: 'none' }} />

              <Box sx={{ position: 'relative', display: 'inline-block', mb: 1.75 }}>
                <Box sx={{ position: 'absolute', inset: -3, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', zIndex: 0 }} />
                <Avatar
                  src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(user?.profilePicture, 'thumbnail')}
                  sx={{ width: 88, height: 88, position: 'relative', zIndex: 1, border: '3px solid', borderColor: 'background.paper' }}
                >
                  {user?.firstName?.[0]}
                </Avatar>
              </Box>

              <Typography variant="h5" fontWeight={800} sx={{ mb: 0.25, letterSpacing: -0.3 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{user?.phoneNumber}</Typography>
              <Chip label={verBadge.label} color={verBadge.color} size="small" sx={{ fontWeight: 700, mb: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5, pt: 2, borderTop: `1px solid ${isDark ? alpha('#fff', 0.08) : alpha('#000', 0.07)}` }}>
                {statItems.map(({ value, label, color }) => (
                  <Box key={label} sx={{ py: 0.5 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color, mb: 0.1, letterSpacing: -0.3 }}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </motion.div>

          {/* ── Sections ──────────────────────────────────────────────── */}
          {sections.map(({ label, items }) => (
            <motion.div key={label} variants={fadeUp}>
              <Paper elevation={isDark ? 0 : 2} sx={{
                borderRadius: 3, mb: 1.5, overflow: 'hidden',
                border: `1px solid ${isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07)}`,
                background: isDark ? undefined : '#ffffff',
                boxShadow: isDark ? 'none' : `0 2px 14px rgba(0,0,0,0.06)`,
              }}>
                <Box sx={{ px: 2, py: 1, bgcolor: isDark ? alpha('#fff', 0.03) : '#F8FAFC', borderBottom: `1px solid ${isDark ? alpha('#fff', 0.05) : alpha('#000', 0.05)}` }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.9, color: 'text.disabled', fontSize: 10, textTransform: 'uppercase' }}>
                    {label}
                  </Typography>
                </Box>
                <List disablePadding>
                  {items.map(({ icon: Icon, primary, secondary, path, color }, i) => (
                    <Box key={primary}>
                      <ListItemButton onClick={() => router.push(path)} sx={{
                        py: 1.5, px: 2,
                        '&:hover': { bgcolor: isDark ? alpha('#fff', 0.04) : alpha(color, 0.04) },
                        transition: 'background 0.15s',
                      }}>
                        <ListItemIcon sx={{ minWidth: 42 }}>
                          <Box sx={{
                            width: 34, height: 34, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isDark
                              ? `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.1)} 100%)`
                              : `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.06)} 100%)`,
                            border: `1px solid ${alpha(color, isDark ? 0.2 : 0.12)}`,
                            '& svg': { fontSize: 17, color },
                          }}>
                            <Icon />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{primary}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
                        />
                        <ChevronIcon sx={{ fontSize: 17, color: 'text.disabled' }} />
                      </ListItemButton>
                      {i < items.length - 1 && <Divider sx={{ ml: 7, opacity: isDark ? 0.4 : 0.6 }} />}
                    </Box>
                  ))}
                </List>
              </Paper>
            </motion.div>
          ))}

          {/* ── Logout ────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <Paper elevation={isDark ? 0 : 2} sx={{
              borderRadius: 3, mb: 2, overflow: 'hidden',
              border: `1px solid ${alpha('#EF4444', isDark ? 0.2 : 0.12)}`,
              background: isDark ? undefined : alpha('#FFF5F5', 1),
              boxShadow: isDark ? 'none' : `0 2px 12px ${alpha('#EF4444', 0.07)}`,
            }}>
              <ListItemButton
                onClick={() => setShowLogout(true)}  // ← only change here
                sx={{ py: 1.75, px: 2, '&:hover': { bgcolor: alpha('#EF4444', 0.06) } }}>
                <ListItemIcon sx={{ minWidth: 42 }}>
                  <Box sx={{
                    width: 34, height: 34, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDark
                      ? `linear-gradient(135deg, ${alpha('#EF4444', 0.2)} 0%, ${alpha('#EF4444', 0.1)} 100%)`
                      : `linear-gradient(135deg, ${alpha('#EF4444', 0.12)} 0%, ${alpha('#FEE2E2', 1)} 100%)`,
                    border: `1px solid ${alpha('#EF4444', isDark ? 0.2 : 0.14)}`,
                  }}>
                    <LogoutIcon sx={{ fontSize: 17, color: '#EF4444' }} />
                  </Box>
                </ListItemIcon>
                <ListItemText primary={<Typography variant="body2" fontWeight={700} color="error.main">Logout</Typography>} />
              </ListItemButton>
            </Paper>
          </motion.div>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.disabled' }}>
            OkraRides Driver v1.0.0
          </Typography>
        </motion.div>
      </Box>

      {/* ── Logout confirmation modal ─────────────────────────────────── */}
      <LogoutModal
        open={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={() => { setShowLogout(false); logout(); }}
      />
    </Box>
  );
}