'use client';

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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useThemeMode } from '@/components/ThemeProvider';
import { formatPhoneNumber } from '@/Functions';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.riderProfile?.pushNotifications ?? true
  );

  const stats = [
    {
      label: 'Total Trips',
      value: user?.riderProfile?.totalRides || 0,
      icon: <StarIcon />,
    },
    {
      label: 'Rating',
      value: user?.riderProfile?.averageRating?.toFixed(1) || '0.0',
      icon: <StarIcon />,
    },
    {
      label: 'Total Spent',
      value: `K${user?.riderProfile?.totalSpent?.toFixed(2) || '0.00'}`,
      icon: <GiftIcon />,
    },
  ];

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          icon: <EditIcon />,
          label: 'Edit Profile',
          action: () => router.push('/profile/edit'),
        },
        {
          icon: <LocationIcon />,
          label: 'Favorite Locations',
          action: () => router.push('/profile/favorite-locations'),
        },
        {
          icon: <ContactIcon />,
          label: 'Emergency Contacts',
          action: () => router.push('/profile/emergency-contacts'),
        },
      ],
    },
    {
      title: 'Rewards & Promotions',
      items: [
        {
          icon: <ReferralIcon />,
          label: 'Refer & Earn',
          action: () => router.push('/profile/referrals'),
          badge: user?.affiliateProfile?.pointsBalance || 0,
        },
        {
          icon: <PromoIcon />,
          label: 'Promo Codes',
          action: () => router.push('/profile/promo-codes'),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          icon: <NotificationsIcon />,
          label: 'Push Notifications',
          toggle: true,
          value: notificationsEnabled,
          onChange: setNotificationsEnabled,
        },
        {
          icon: <DarkModeIcon />,
          label: 'Dark Mode',
          toggle: true,
          value: mode === 'dark',
          onChange: toggleTheme,
        },
        {
          icon: <SettingsIcon />,
          label: 'App Settings',
          action: () => router.push('/profile/settings'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpIcon />,
          label: 'Help Center',
          action: () => router.push('/profile/help'),
        },
        {
          icon: <InfoIcon />,
          label: 'About',
          action: () => router.push('/profile/about'),
        },
      ],
    },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          pt: 4,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Profile
        </Typography>
      </Box>

      {/* Profile Card */}
      <Box sx={{ p: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Avatar
                src={user?.profilePicture}
                sx={{ width: 80, height: 80, mr: 2 }}
              >
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPhoneNumber(user?.phoneNumber)}
                </Typography>
              </Box>
              <IconButton
                onClick={() => router.push('/profile/edit')}
                sx={{ bgcolor: 'action.hover' }}
              >
                <EditIcon />
              </IconButton>
            </Box>

            {/* Stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
              }}
            >
              {stats.map((stat, index) => (
                <Box key={stat.label} sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 0.5 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </motion.div>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.05 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}
            >
              {section.title}
            </Typography>
            <Paper sx={{ mb: 2 }}>
              <List disablePadding>
                {section.items.map((item, index) => (
                  <Box key={item.label}>
                    {index > 0 && <Divider />}
                    <ListItem
                      button={!item.toggle}
                      onClick={!item.toggle ? item.action : undefined}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: 500,
                        }}
                      />
                      {item.badge !== undefined && item.badge > 0 && (
                        <Box
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            borderRadius: '12px',
                            px: 1.5,
                            py: 0.5,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            mr: 1,
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
                        />
                      ) : (
                        <IconButton size="small">
                          <ChevronRightIcon />
                        </IconButton>
                      )}
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Paper>
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
        >
          <Paper
            onClick={handleLogout}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'error.dark',
                mr: 2,
              }}
            >
              <LogoutIcon />
            </Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: 'error.main', flex: 1 }}
            >
              Logout
            </Typography>
          </Paper>
        </motion.div>

        {/* App Version */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3, mb: 2 }}
        >
          OkraRides v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}
