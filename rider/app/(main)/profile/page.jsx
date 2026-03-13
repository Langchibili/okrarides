// //Okrarides\rider\app\(main)\profile\page.jsx
// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   Avatar,
//   Paper,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Divider,
//   IconButton,
//   Switch,
// } from '@mui/material';
// import {
//   Edit as EditIcon,
//   ChevronRight as ChevronRightIcon,
//   LocationOn as LocationIcon,
//   ContactPhone as ContactIcon,
//   LocalOffer as PromoIcon,
//   People as ReferralIcon,
//   Settings as SettingsIcon,
//   Help as HelpIcon,
//   Info as InfoIcon,
//   ExitToApp as LogoutIcon,
//   Star as StarIcon,
//   CardGiftcard as GiftIcon,
//   DarkMode as DarkModeIcon,
//   Notifications as NotificationsIcon,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { useThemeMode } from '@/components/ThemeProvider';
// import { formatPhoneNumber } from '@/Functions';

// export default function ProfilePage() {
//   const router = useRouter();
//   const { user, logout } = useAuth();
//   const { mode, toggleTheme } = useThemeMode();
  
//   const [notificationsEnabled, setNotificationsEnabled] = useState(
//     user?.riderProfile?.pushNotifications ?? true
//   );

//   const stats = [
//     {
//       label: 'Total Trips',
//       value: user?.riderProfile?.totalRides || 0,
//       icon: <StarIcon />,
//     },
//     {
//       label: 'Rating',
//       value: user?.riderProfile?.averageRating?.toFixed(1) || '0.0',
//       icon: <StarIcon />,
//     },
//     {
//       label: 'Total Spent',
//       value: `K${user?.riderProfile?.totalSpent?.toFixed(2) || '0.00'}`,
//       icon: <GiftIcon />,
//     },
//   ];

//   const menuSections = [
//     {
//       title: 'Account',
//       items: [
//         {
//           icon: <EditIcon />,
//           label: 'Edit Profile',
//           action: () => router.push('/profile/edit'),
//         },
//         {
//           icon: <LocationIcon />,
//           label: 'Favorite Locations',
//           action: () => router.push('/profile/favorite-locations'),
//         },
//         {
//           icon: <ContactIcon />,
//           label: 'Emergency Contacts',
//           action: () => router.push('/profile/emergency-contacts'),
//         },
//       ],
//     },
//     {
//       title: 'Rewards & Promotions',
//       items: [
//         {
//           icon: <ReferralIcon />,
//           label: 'Refer & Earn',
//           action: () => router.push('/profile/referrals'),
//           badge: user?.affiliateProfile?.pointsBalance || 0,
//         },
//         {
//           icon: <PromoIcon />,
//           label: 'Promo Codes',
//           action: () => router.push('/profile/promo-codes'),
//         },
//       ],
//     },
//     {
//       title: 'Settings',
//       items: [
//         {
//           icon: <NotificationsIcon />,
//           label: 'Push Notifications',
//           toggle: true,
//           value: notificationsEnabled,
//           onChange: setNotificationsEnabled,
//         },
//         {
//           icon: <DarkModeIcon />,
//           label: 'Dark Mode',
//           toggle: true,
//           value: mode === 'dark',
//           onChange: toggleTheme,
//         },
//         {
//           icon: <SettingsIcon />,
//           label: 'App Settings',
//           action: () => router.push('/profile/settings'),
//         },
//       ],
//     },
//     {
//       title: 'Support',
//       items: [
//         {
//           icon: <HelpIcon />,
//           label: 'Help Center',
//           action: () => router.push('/profile/help'),
//         },
//         {
//           icon: <InfoIcon />,
//           label: 'About',
//           action: () => router.push('/profile/about'),
//         },
//       ],
//     },
//   ];

//   const handleLogout = () => {
//     if (confirm('Are you sure you want to logout?')) {
//       logout();
//     }
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: '100vh',
//         bgcolor: 'background.default',
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           p: 3,
//           pt: 4,
//           bgcolor: 'background.paper',
//           borderBottom: 1,
//           borderColor: 'divider',
//         }}
//       >
//         <Typography variant="h5" sx={{ fontWeight: 700 }}>
//           Profile
//         </Typography>
//       </Box>

//       {/* Profile Card */}
//       <Box sx={{ p: 2 }}>
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//         >
//           <Paper sx={{ p: 3, mb: 3 }}>
//             <Box
//               sx={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 mb: 3,
//               }}
//             >
//               <Avatar
//                 src={user?.profilePicture}
//                 sx={{ width: 80, height: 80, mr: 2 }}
//               >
//                 {user?.firstName?.[0]}
//                 {user?.lastName?.[0]}
//               </Avatar>
//               <Box sx={{ flex: 1 }}>
//                 <Typography variant="h6" sx={{ fontWeight: 600 }}>
//                   {user?.firstName} {user?.lastName}
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   {formatPhoneNumber(user?.phoneNumber)}
//                 </Typography>
//               </Box>
//               <IconButton
//                 onClick={() => router.push('/profile/edit')}
//                 sx={{ bgcolor: 'action.hover' }}
//               >
//                 <EditIcon />
//               </IconButton>
//             </Box>

//             {/* Stats */}
//             <Box
//               sx={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(3, 1fr)',
//                 gap: 2,
//               }}
//             >
//               {stats.map((stat, index) => (
//                 <Box key={stat.label} sx={{ textAlign: 'center' }}>
//                   <Typography
//                     variant="h6"
//                     sx={{ fontWeight: 700, mb: 0.5 }}
//                   >
//                     {stat.value}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary">
//                     {stat.label}
//                   </Typography>
//                 </Box>
//               ))}
//             </Box>
//           </Paper>
//         </motion.div>

//         {/* Menu Sections */}
//         {menuSections.map((section, sectionIndex) => (
//           <motion.div
//             key={section.title}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: sectionIndex * 0.05 }}
//           >
//             <Typography
//               variant="caption"
//               color="text.secondary"
//               sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}
//             >
//               {section.title}
//             </Typography>
//             <Paper sx={{ mb: 2 }}>
//               <List disablePadding>
//                 {section.items.map((item, index) => (
//                   <Box key={item.label}>
//                     {index > 0 && <Divider />}
//                     <ListItem
//                       button={!item.toggle}
//                       onClick={!item.toggle ? item.action : undefined}
//                     >
//                       <ListItemIcon>
//                         <Box
//                           sx={{
//                             width: 40,
//                             height: 40,
//                             borderRadius: 2,
//                             bgcolor: 'action.hover',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                           }}
//                         >
//                           {item.icon}
//                         </Box>
//                       </ListItemIcon>
//                       <ListItemText
//                         primary={item.label}
//                         primaryTypographyProps={{
//                           fontWeight: 500,
//                         }}
//                       />
//                       {item.badge !== undefined && item.badge > 0 && (
//                         <Box
//                           sx={{
//                             bgcolor: 'primary.main',
//                             color: 'primary.contrastText',
//                             borderRadius: '12px',
//                             px: 1.5,
//                             py: 0.5,
//                             fontSize: '0.75rem',
//                             fontWeight: 600,
//                             mr: 1,
//                           }}
//                         >
//                           {item.badge}
//                         </Box>
//                       )}
//                       {item.toggle ? (
//                         <Switch
//                           checked={item.value}
//                           onChange={(e) => item.onChange(e.target.checked)}
//                           onClick={(e) => e.stopPropagation()}
//                         />
//                       ) : (
//                         <IconButton size="small">
//                           <ChevronRightIcon />
//                         </IconButton>
//                       )}
//                     </ListItem>
//                   </Box>
//                 ))}
//               </List>
//             </Paper>
//           </motion.div>
//         ))}

//         {/* Logout Button */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.3 }}
//           whileTap={{ scale: 0.98 }}
//         >
//           <Paper
//             onClick={handleLogout}
//             sx={{
//               p: 2,
//               display: 'flex',
//               alignItems: 'center',
//               cursor: 'pointer',
//               '&:hover': {
//                 bgcolor: 'action.hover',
//               },
//             }}
//           >
//             <Box
//               sx={{
//                 width: 40,
//                 height: 40,
//                 borderRadius: 2,
//                 bgcolor: 'error.light',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 color: 'error.dark',
//                 mr: 2,
//               }}
//             >
//               <LogoutIcon />
//             </Box>
//             <Typography
//               variant="body1"
//               sx={{ fontWeight: 600, color: 'error.main', flex: 1 }}
//             >
//               Logout
//             </Typography>
//           </Paper>
//         </motion.div>

//         {/* App Version */}
//         <Typography
//           variant="caption"
//           color="text.secondary"
//           sx={{ display: 'block', textAlign: 'center', mt: 3, mb: 2 }}
//         >
//           OkraRides v1.0.0
//         </Typography>
//       </Box>
//     </Box>
//   );
// }


'use client';
// PATH: rider/app/(main)/profile/page.jsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Switch,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  ChevronRight as ChevronRightIcon,
  LocationOn as LocationIcon,
  ContactPhone as ContactIcon,
  LocalOffer as PromoIcon,
  People as ReferralIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  ExitToApp as LogoutIcon,
  Star as StarIcon,
  CardGiftcard as GiftIcon,
  DarkMode as DarkModeIcon,
  Notifications as NotificationsIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ShimmerDiv, ShimmerText } from 'shimmer-effects-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useThemeMode } from '@/components/ThemeProvider';
import { formatPhoneNumber } from '@/Functions';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const ProfileSkeleton = ({ mode }) => (
  <Box sx={{ px: 2 }}>
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ShimmerDiv mode={mode} height={80} width={80} rounded={1} />
        <Box sx={{ flex: 1 }}>
          <ShimmerDiv mode={mode} height={20} width={140} rounded={1} />
          <Box sx={{ mt: 1 }}>
            <ShimmerDiv mode={mode} height={14} width={100} rounded={1} />
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ textAlign: 'center' }}>
            <ShimmerDiv mode={mode} height={22} width={50} rounded={1} center />
            <Box sx={{ mt: 1 }}>
              <ShimmerDiv mode={mode} height={12} width={60} rounded={1} center />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
    {[1, 2, 3, 4].map((s) => (
      <Box key={s} sx={{ mb: 2 }}>
        <ShimmerDiv mode={mode} height={12} width={80} rounded={1} />
        <Box sx={{ mt: 1, p: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
          {[1, 2].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <ShimmerDiv mode={mode} height={40} width={40} rounded={1} />
              <ShimmerDiv mode={mode} height={16} width={120} rounded={1} />
            </Box>
          ))}
        </Box>
      </Box>
    ))}
  </Box>
);

// Icon container with color
const IconBox = ({ children, color, isDark }) => (
  <Box
    sx={{
      width: 40,
      height: 40,
      borderRadius: 2,
      background: isDark
        ? `linear-gradient(135deg, ${color}25 0%, ${color}12 100%)`
        : `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
      border: '1px solid',
      borderColor: `${color}25`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      flexShrink: 0,
      transition: 'transform 0.18s ease',
    }}
  >
    {children}
  </Box>
);

const ICON_COLORS = {
  'Edit Profile': '#2196F3',
  'Favorite Locations': '#FF5722',
  'Emergency Contacts': '#E91E63',
  'Refer & Earn': '#9C27B0',
  'Promo Codes': '#FFC107',
  'Push Notifications': '#4CAF50',
  'Dark Mode': '#607D8B',
  'App Settings': '#795548',
  'Help Center': '#00BCD4',
  'About': '#9E9E9E',
};

export default function ProfilePage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const shimmerMode = theme.palette.mode;
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.riderProfile?.pushNotifications ?? true
  );

  const stats = [
    { label: 'Trips', value: user?.riderProfile?.totalRides || 0, color: '#2196F3' },
    { label: 'Rating', value: user?.riderProfile?.averageRating?.toFixed(1) || '0.0', color: '#FFC107' },
    { label: 'Spent', value: `K${user?.riderProfile?.totalSpent?.toFixed(0) || '0'}`, color: '#4CAF50' },
  ];

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: <EditIcon sx={{ fontSize: 18 }} />, label: 'Edit Profile', action: () => router.push('/profile/edit') },
        { icon: <LocationIcon sx={{ fontSize: 18 }} />, label: 'Favorite Locations', action: () => router.push('/profile/favorite-locations') },
        { icon: <ContactIcon sx={{ fontSize: 18 }} />, label: 'Emergency Contacts', action: () => router.push('/profile/emergency-contacts') },
      ],
    },
    {
      title: 'Rewards & Promotions',
      items: [
        { icon: <ReferralIcon sx={{ fontSize: 18 }} />, label: 'Refer & Earn', action: () => router.push('/profile/referrals'), badge: user?.affiliateProfile?.pointsBalance || 0 },
        { icon: <PromoIcon sx={{ fontSize: 18 }} />, label: 'Promo Codes', action: () => router.push('/profile/promo-codes') },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: <NotificationsIcon sx={{ fontSize: 18 }} />, label: 'Push Notifications', toggle: true, value: notificationsEnabled, onChange: setNotificationsEnabled },
        { icon: <DarkModeIcon sx={{ fontSize: 18 }} />, label: 'Dark Mode', toggle: true, value: mode === 'dark', onChange: toggleTheme },
        { icon: <SettingsIcon sx={{ fontSize: 18 }} />, label: 'App Settings', action: () => router.push('/profile/settings') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: <HelpIcon sx={{ fontSize: 18 }} />, label: 'Help Center', action: () => router.push('/profile/help') },
        { icon: <InfoIcon sx={{ fontSize: 18 }} />, label: 'About', action: () => router.push('/profile/about') },
      ],
    },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) logout();
  };

  // If still loading user data, show skeleton
  if (!user) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0, p: 3, pt: 4, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <ShimmerDiv mode={shimmerMode} height={28} width={80} rounded={1} />
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', pt: 2 }}>
          <ProfileSkeleton mode={shimmerMode} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* ── Fixed Header ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          p: 3,
          pt: 4,
          pb: 2.5,
          background: isDark
            ? 'linear-gradient(160deg, #1A1A1A 0%, #141414 100%)'
            : 'linear-gradient(160deg, #FFFFFF 0%, #F8F6F0 100%)',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FFC107 0%, #FF8C00 100%)' }} />
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          Profile
        </Typography>
      </Box>

      {/* ── Scrollable Content ──────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          pb: 3,
        }}
      >
        <Box sx={{ px: 2, pt: 2 }}>
          {/* ── Profile Hero Card ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
              }}
            >
              {/* Gradient banner */}
              <Box
                sx={{
                  height: 72,
                  background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 50%, #F57C00 100%)',
                  position: 'relative',
                }}
              >
                {/* Decorative circles */}
                <Box sx={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                <Box sx={{ position: 'absolute', right: 40, bottom: -15, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              </Box>

              <Box sx={{ px: 3, pb: 3 }}>
                {/* Avatar row */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mt: '-28px', mb: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={user?.profilePicture}
                      sx={{
                        width: 70,
                        height: 70,
                        border: '3px solid',
                        borderColor: 'background.paper',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        bgcolor: '#FFC107',
                        color: '#fff',
                      }}
                    >
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </Avatar>
                  </Box>
                  <motion.div whileTap={{ scale: 0.94 }}>
                    <IconButton
                      onClick={() => router.push('/profile/edit')}
                      size="small"
                      sx={{
                        bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
                        width: 36,
                        height: 36,
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </motion.div>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
                  {formatPhoneNumber(user?.phoneNumber)}
                </Typography>

                {/* Stats */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1,
                    mt: 2.5,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  {stats.map((stat) => (
                    <Box
                      key={stat.label}
                      sx={{
                        textAlign: 'center',
                        p: 1.5,
                        borderRadius: 2,
                        background: isDark
                          ? `${stat.color}15`
                          : `${stat.color}10`,
                        border: '1px solid',
                        borderColor: `${stat.color}20`,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          mb: 0.2,
                          fontSize: '1.1rem',
                          letterSpacing: -0.3,
                          color: stat.color,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600, letterSpacing: 0.3 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* ── Menu Sections ──────────────────────────────────────────────── */}
          {menuSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * sectionIndex + 0.08 }}
            >
              <Typography
                variant="caption"
                sx={{
                  px: 1,
                  mb: 1,
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'text.disabled',
                }}
              >
                {section.title}
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  mb: 2.5,
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.05)',
                }}
              >
                <List disablePadding>
                  {section.items.map((item, index) => (
                    <Box key={item.label}>
                      {index > 0 && (
                        <Divider sx={{ ml: 7.5, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
                      )}
                      <motion.div whileTap={!item.toggle ? { scale: 0.98 } : {}}>
                        <ListItem
                          button={!item.toggle}
                          onClick={!item.toggle ? item.action : undefined}
                          sx={{
                            py: 1.5,
                            px: 2,
                            transition: 'background 0.15s ease',
                            '&:hover': {
                              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            },
                            '&:active': {
                              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 52 }}>
                            <IconBox color={ICON_COLORS[item.label] || '#9E9E9E'} isDark={isDark}>
                              {item.icon}
                            </IconBox>
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                          />
                          {item.badge !== undefined && item.badge > 0 && (
                            <Box
                              sx={{
                                background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                                color: '#fff',
                                borderRadius: '12px',
                                px: 1.2,
                                py: 0.3,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                mr: 1,
                                boxShadow: '0 2px 8px rgba(255,193,7,0.4)',
                              }}
                            >
                              {item.badge}
                            </Box>
                          )}
                          {item.toggle ? (
                            <Switch
                              checked={item.value}
                              onChange={(e) => item.onChange(e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              size="small"
                            />
                          ) : (
                            <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                          )}
                        </ListItem>
                      </motion.div>
                    </Box>
                  ))}
                </List>
              </Paper>
            </motion.div>
          ))}

          {/* ── Logout ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            whileTap={{ scale: 0.97 }}
          >
            <Paper
              onClick={handleLogout}
              elevation={0}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'rgba(244,67,54,0.2)',
                background: isDark
                  ? 'rgba(244,67,54,0.08)'
                  : 'rgba(244,67,54,0.04)',
                transition: 'all 0.18s ease',
                '&:hover': {
                  background: 'rgba(244,67,54,0.1)',
                  borderColor: 'rgba(244,67,54,0.35)',
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(244,67,54,0.2) 0%, rgba(244,67,54,0.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'error.main',
                  mr: 2,
                }}
              >
                <LogoutIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'error.main', flex: 1 }}>
                Logout
              </Typography>
              <ChevronRightIcon sx={{ fontSize: 18, color: 'error.main', opacity: 0.5 }} />
            </Paper>
          </motion.div>

          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', mt: 3, mb: 2, color: 'text.disabled', fontWeight: 500 }}
          >
            OkraRides v1.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}