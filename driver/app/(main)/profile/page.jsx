// //Okra\Okrarides\driver\app\(main)\profile\page.jsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   AppBar,
//   Toolbar,
//   Typography,
//   Avatar,
//   Paper,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   ListItemButton,
//   Divider,
//   IconButton,
//   Chip,
// } from '@mui/material';
// import {
//   ArrowBack as BackIcon,
//   Edit as EditIcon,
//   PersonOutline as ProfileIcon,
//   Settings as SettingsIcon,
//   DirectionsCar as VehicleIcon,
//   VerifiedUser as VerifiedIcon,
//   Assessment as PerformanceIcon,
//   CardGiftcard as ReferralIcon,
//   Help as HelpIcon,
//   Description as DocumentIcon,
//   Logout as LogoutIcon,
//   ChevronRight as ChevronIcon,
//   Star as StarIcon,
//   AccountBalance as AccountBalanceIcon,
//   CardGiftcard,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useDriver } from '@/lib/hooks/useDriver';
// import { VERIFICATION_STATUS } from '@/Constants';

// export default function ProfilePage() {
//   const router = useRouter();
//   const { user, logout } = useAuth();
//   const { driverProfile, isOnline, toggleOnline } = useDriver();

//   const handleLogout = () => {
//     if (window.confirm('Are you sure you want to logout?')) {
//       logout();
//     }
//   };

//   const getVerificationBadge = () => {
//     switch (driverProfile?.verificationStatus) {
//       case VERIFICATION_STATUS.APPROVED:
//         return <Chip label="✓ Verified" color="success" size="small" sx={{ fontWeight: 600 }} />;
//       case VERIFICATION_STATUS.PENDING:
//         return <Chip label="⏳ Pending" color="warning" size="small" sx={{ fontWeight: 600 }} />;
//       case VERIFICATION_STATUS.REJECTED:
//         return <Chip label="✗ Rejected" color="error" size="small" sx={{ fontWeight: 600 }} />;
//       default:
//         return <Chip label="Not Verified" color="default" size="small" sx={{ fontWeight: 600 }} />;
//     }
//   };

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
//       {/* AppBar */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
//             <BackIcon />
//           </IconButton>
//           <Typography variant="h6" sx={{ flex: 1 }}>Profile</Typography>
//           <IconButton color="inherit" onClick={() => router.push('/profile/edit')}>
//             <EditIcon />
//           </IconButton>
//         </Toolbar>
//       </AppBar>

//       <Box sx={{ p: 3 }}>
//         {/* Profile Header */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//           <Paper elevation={3} sx={{ p: 3, borderRadius: 4, mb: 3, textAlign: 'center' }}>
//             <Avatar
//               src={user?.profilePicture}
//               sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: 3, borderColor: 'primary.main' }}
//             >
//               {user?.firstName?.[0]}
//             </Avatar>

//             <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
//               {user?.firstName} {user?.lastName}
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//               {user?.phoneNumber}
//             </Typography>

//             {getVerificationBadge()}

//             {/* Driver Stats */}
//             <Box
//               sx={{
//                 display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2,
//                 mt: 3, pt: 3, borderTop: 1, borderColor: 'divider',
//               }}
//             >
//               <Box>
//                 <Typography variant="h6" sx={{ fontWeight: 700 }}>
//                   {driverProfile?.totalRides || 0}
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary">Total Rides</Typography>
//               </Box>
//               <Box>
//                 <Typography variant="h6" sx={{ fontWeight: 700 }}>
//                   <StarIcon sx={{ fontSize: 20, color: 'warning.main', verticalAlign: 'middle' }} />{' '}
//                   {driverProfile?.averageRating?.toFixed(1) || '0.0'}
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary">Rating</Typography>
//               </Box>
//               <Box>
//                 <Typography variant="h6" sx={{ fontWeight: 700 }}>
//                   {driverProfile?.completionRate?.toFixed(0) || 0}%
//                 </Typography>
//                 <Typography variant="caption" color="text.secondary">Completion</Typography>
//               </Box>
//             </Box>
//           </Paper>
//         </motion.div>

//         {/* Account Section */}
//         <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
//           <List disablePadding>
//             <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
//               <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>ACCOUNT</Typography>
//             </ListItem>

//             <ListItemButton onClick={() => router.push('/profile/edit')}>
//               <ListItemIcon><ProfileIcon /></ListItemIcon>
//               <ListItemText primary="Edit Profile" secondary="Name, photo, contact info" />
//               <ChevronIcon />
//             </ListItemButton>

//             <Divider />

//             <ListItemButton onClick={() => router.push('/verification')}>
//               <ListItemIcon>
//                 <VerifiedIcon color={driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED ? 'success' : 'default'} />
//               </ListItemIcon>
//               <ListItemText primary="Verification Status" secondary={driverProfile?.verificationStatus || 'Not started'} />
//               <ChevronIcon />
//             </ListItemButton>

//             <Divider />

//             <ListItemButton onClick={() => router.push('/vehicle')}>
//               <ListItemIcon><VehicleIcon /></ListItemIcon>
//               <ListItemText
//                 primary="Vehicle Information"
//                 secondary={
//                   driverProfile?.assignedVehicle
//                     ? `${driverProfile.assignedVehicle.make} ${driverProfile.assignedVehicle.model}`
//                     : 'No vehicle added'
//                 }
//               />
//               <ChevronIcon />
//             </ListItemButton>

//             <Divider />

//             <ListItemButton onClick={() => router.push('/profile/performance')}>
//               <ListItemIcon><PerformanceIcon /></ListItemIcon>
//               <ListItemText primary="Performance Metrics" secondary="Stats, ratings, completion rate" />
//               <ChevronIcon />
//             </ListItemButton>
//           </List>
//         </Paper>

//         {/* Earnings & Finance */}
//         <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
//           <List disablePadding>
//             <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
//               <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>EARNINGS & FINANCE</Typography>
//             </ListItem>

//             <ListItemButton onClick={() => router.push('/subscription')}>
//               <ListItemIcon><CardGiftcard /></ListItemIcon>
//               <ListItemText
//                 primary="Subscription"
//                 secondary={driverProfile?.subscriptionStatus === 'active' ? 'Active - No commission' : 'View plans'}
//               />
//               <ChevronIcon />
//             </ListItemButton>

//             <Divider />

//             {/* ── Mobile Money Numbers ── */}
//             <ListItemButton onClick={() => router.push('/mobile-money-numbers')}>
//               <ListItemIcon>
//                 <AccountBalanceIcon color={driverProfile?.paymentPhoneNumbers?.length > 0 ? 'primary' : 'default'} />
//               </ListItemIcon>
//               <ListItemText
//                 primary="Mobile Money Numbers"
//                 secondary={
//                   driverProfile?.paymentPhoneNumbers?.length > 0
//                     ? `${driverProfile.paymentPhoneNumbers.length} number${driverProfile.paymentPhoneNumbers.length > 1 ? 's' : ''} saved`
//                     : 'Add payout numbers'
//                 }
//               />
//               <ChevronIcon />
//             </ListItemButton>

//             <Divider />

//             <ListItemButton onClick={() => router.push('/earnings/withdraw')}>
//               <ListItemIcon><DocumentIcon /></ListItemIcon>
//               <ListItemText primary="Withdrawals" secondary="Request withdrawal" />
//               <ChevronIcon />
//             </ListItemButton>

//             <Divider />

//             <ListItemButton onClick={() => router.push('/profile/referrals')}>
//               <ListItemIcon><ReferralIcon /></ListItemIcon>
//               <ListItemText primary="Referral Program" secondary="Earn points by referring" />
//               <ChevronIcon />
//             </ListItemButton>
//           </List>
//         </Paper>

//         {/* Support & Settings */}
//         <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
//           <List disablePadding>
//             <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
//               <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>SUPPORT & SETTINGS</Typography>
//             </ListItem>

//             <ListItemButton onClick={() => router.push('/profile/settings')}>
//               <ListItemIcon><SettingsIcon /></ListItemIcon>
//               <ListItemText primary="Settings" secondary="App preferences, notifications" />
//               <ChevronIcon />
//             </ListItemButton>

//             <Divider />

//             <ListItemButton onClick={() => router.push('/help')}>
//               <ListItemIcon><HelpIcon /></ListItemIcon>
//               <ListItemText primary="Help Center" secondary="FAQs, guides, contact support" />
//               <ChevronIcon />
//             </ListItemButton>

//             <Divider />

//             <ListItemButton onClick={() => router.push('/profile/legal')}>
//               <ListItemIcon><DocumentIcon /></ListItemIcon>
//               <ListItemText primary="Legal" secondary="Terms, privacy policy" />
//               <ChevronIcon />
//             </ListItemButton>
//           </List>
//         </Paper>

//         {/* Logout */}
//         <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
//           <ListItemButton onClick={handleLogout} sx={{ py: 2 }}>
//             <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
//             <ListItemText
//               primary="Logout"
//               primaryTypographyProps={{ color: 'error.main', fontWeight: 600 }}
//             />
//           </ListItemButton>
//         </Paper>

//         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
//           OkraRides Driver v1.0.0
//         </Typography>
//       </Box>
//     </Box>
//   );
// }
// PATH: app/(main)/profile/page.jsx
'use client';
import { useRouter }   from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, Avatar, Paper,
  List, ListItemIcon, ListItemText, ListItemButton,
  Divider, IconButton, Chip,
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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth }   from '@/lib/hooks/useAuth';
import { useDriver } from '@/lib/hooks/useDriver';
import { VERIFICATION_STATUS } from '@/Constants';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

function NavSection({ label, items }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
      <Paper elevation={isDark ? 0 : 2} sx={{
        borderRadius: 3, mb: 1.5, overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.08)}`,
      }}>
        <Box sx={{ px: 2, py: 1, bgcolor: alpha(theme.palette.background.default, 0.7) }}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.8, color: 'text.disabled', fontSize: 10, textTransform: 'uppercase' }}>
            {label}
          </Typography>
        </Box>
        <List disablePadding>
          {items.map(({ icon: Icon, primary, secondary, path, color }, i) => (
            <Box key={primary}>
              <ListItemButton
                onClick={() => path && useRouter().push(path)}
                sx={{ py: 1.5, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
              >
                <ListItemIcon sx={{ minWidth: 38 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(color ?? theme.palette.primary.main, isDark ? 0.18 : 0.1),
                    '& svg': { fontSize: 17, color: color ?? 'primary.main' },
                  }}>
                    <Icon />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={600}>{primary}</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
                />
                <ChevronIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </ListItemButton>
              {i < items.length - 1 && <Divider sx={{ ml: 7 }} />}
            </Box>
          ))}
        </List>
      </Paper>
    </motion.div>
  );
}

export default function ProfilePage() {
  const router  = useRouter();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const { user, logout } = useAuth();
  const { driverProfile } = useDriver();

  const verStatus = driverProfile?.verificationStatus;
  const verBadge = {
    [VERIFICATION_STATUS.APPROVED]: { label: '✓ Verified',   color: 'success' },
    [VERIFICATION_STATUS.PENDING]:  { label: '⏳ Pending',    color: 'warning' },
    [VERIFICATION_STATUS.REJECTED]: { label: '✗ Rejected',   color: 'error'   },
  }[verStatus] ?? { label: 'Not Verified', color: 'default' };

  const statItems = [
    { value: driverProfile?.totalRides || 0,                        label: 'Rides' },
    { value: `★ ${driverProfile?.averageRating?.toFixed(1) || '0.0'}`, label: 'Rating', color: '#F59E0B' },
    { value: `${driverProfile?.completionRate?.toFixed(0) || 0}%`,  label: 'Completion' },
  ];

  const accountItems = [
    { icon: ProfileIcon,     primary: 'Edit Profile',          secondary: 'Name, photo, contact info',                path: '/profile/edit',        color: '#3B82F6' },
    { icon: VerifiedIcon,    primary: 'Verification',           secondary: verStatus || 'Not started',                 path: '/verification',        color: verStatus === VERIFICATION_STATUS.APPROVED ? '#10B981' : '#F59E0B' },
    { icon: VehicleIcon,     primary: 'Vehicle',                secondary: driverProfile?.assignedVehicle ? `${driverProfile.assignedVehicle.make} ${driverProfile.assignedVehicle.model}` : 'No vehicle', path: '/vehicle', color: '#8B5CF6' },
    { icon: PerformanceIcon, primary: 'Performance',            secondary: 'Stats, ratings, completion',               path: '/profile/performance', color: '#06B6D4' },
  ];
  const financeItems = [
    { icon: ReferralIcon,       primary: 'Subscription',           secondary: driverProfile?.subscriptionStatus === 'active' ? 'Active — 0% commission' : 'View plans', path: '/subscription', color: '#10B981' },
    { icon: AccountBalanceIcon, primary: 'Mobile Money Numbers',   secondary: driverProfile?.paymentPhoneNumbers?.length > 0 ? `${driverProfile.paymentPhoneNumbers.length} saved` : 'Add payout numbers', path: '/mobile-money-numbers', color: '#3B82F6' },
    { icon: DocumentIcon,       primary: 'Withdrawals',            secondary: 'Request withdrawal',                       path: '/earnings/withdraw',   color: '#F59E0B' },
    { icon: ReferralIcon,       primary: 'Referral Program',       secondary: 'Earn by referring friends',                path: '/profile/referrals',   color: '#EC4899' },
  ];
  const supportItems = [
    { icon: SettingsIcon, primary: 'Settings',    secondary: 'Preferences, notifications',    path: '/profile/settings', color: '#6B7280' },
    { icon: HelpIcon,     primary: 'Help Center', secondary: 'FAQs, contact support',         path: '/help',             color: '#3B82F6' },
    { icon: DocumentIcon, primary: 'Legal',       secondary: 'Terms, privacy policy',          path: '/profile/legal',    color: '#6B7280' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1E293B', 0.98)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Profile</Typography>
          <IconButton color="inherit" onClick={() => router.push('/profile/edit')}><EditIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 4, ...hideScrollbar }}>

        {/* ── Profile hero ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          <Paper elevation={isDark ? 0 : 3} sx={{
            p: 3, borderRadius: 4, mb: 2, textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.08)}`,
            background: isDark
              ? `linear-gradient(145deg, ${alpha('#3B82F6', 0.1)} 0%, ${alpha('#10B981', 0.06)} 100%)`
              : `linear-gradient(145deg, ${alpha('#3B82F6', 0.04)} 0%, ${alpha('#10B981', 0.02)} 100%)`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Ambient blob */}
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Avatar with gradient ring */}
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 1.5 }}>
              <Box sx={{
                position: 'absolute', inset: -3, borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                zIndex: 0,
              }} />
              <Avatar src={user?.profilePicture}
                sx={{ width: 88, height: 88, position: 'relative', zIndex: 1, border: '3px solid', borderColor: 'background.paper' }}>
                {user?.firstName?.[0]}
              </Avatar>
            </Box>

            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.25 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{user?.phoneNumber}</Typography>
            <Chip label={verBadge.label} color={verBadge.color} size="small" sx={{ fontWeight: 700, mb: 2 }} />

            {/* Stats row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
              {statItems.map(({ value, label, color }) => (
                <Box key={label}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: color ?? 'text.primary' }}>{value}</Typography>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </motion.div>

        {/* Use a plain inline router.push via closure workaround */}
        {[
          { label: 'Account',            items: accountItems },
          { label: 'Earnings & Finance', items: financeItems },
          { label: 'Support & Settings', items: supportItems },
        ].map(({ label, items }) => (
          <Paper key={label} elevation={isDark ? 0 : 2} sx={{
            borderRadius: 3, mb: 1.5, overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.08)}`,
          }}>
            <Box sx={{ px: 2, py: 1, bgcolor: alpha(theme.palette.background.default, 0.7) }}>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.8, color: 'text.disabled', fontSize: 10, textTransform: 'uppercase' }}>
                {label}
              </Typography>
            </Box>
            <List disablePadding>
              {items.map(({ icon: Icon, primary, secondary, path, color }, i) => (
                <Box key={primary}>
                  <ListItemButton onClick={() => router.push(path)} sx={{ py: 1.5, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}>
                    <ListItemIcon sx={{ minWidth: 38 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha(color ?? theme.palette.primary.main, isDark ? 0.18 : 0.1),
                        '& svg': { fontSize: 17, color: color ?? 'primary.main' } }}>
                        <Icon />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>{primary}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
                    />
                    <ChevronIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </ListItemButton>
                  {i < items.length - 1 && <Divider sx={{ ml: 7 }} />}
                </Box>
              ))}
            </List>
          </Paper>
        ))}

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Paper elevation={isDark ? 0 : 2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden', border: `1px solid ${alpha('#EF4444', isDark ? 0.2 : 0.1)}` }}>
            <ListItemButton onClick={() => { if (window.confirm('Log out of OkraRides?')) logout(); }}
              sx={{ py: 1.75, px: 2, '&:hover': { bgcolor: alpha('#EF4444', 0.05) } }}>
              <ListItemIcon sx={{ minWidth: 38 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha('#EF4444', isDark ? 0.18 : 0.08) }}>
                  <LogoutIcon sx={{ fontSize: 17, color: '#EF4444' }} />
                </Box>
              </ListItemIcon>
              <ListItemText primary={<Typography variant="body2" fontWeight={700} color="error.main">Logout</Typography>} />
            </ListItemButton>
          </Paper>
        </motion.div>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
          OkraRides Driver v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}