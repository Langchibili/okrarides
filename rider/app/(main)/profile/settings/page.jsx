
'use client';
// PATH: rider/app/(main)/profile/settings/page.jsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
  MenuItem,
  Select,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  LocationOn as LocationIcon,
  ChevronRight as ChevronRightIcon,
  NotificationsActive as RideUpdatesIcon,
  LocalOffer as PromoIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Download as DownloadIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '@/components/ThemeProvider';

const SectionHeader = ({ title }) => (
  <Typography
    variant="caption"
    sx={{
      px: 1,
      mb: 1,
      mt: 0.5,
      display: 'block',
      fontWeight: 700,
      fontSize: '0.65rem',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: 'text.disabled',
    }}
  >
    {title}
  </Typography>
);

const StyledListItem = ({ icon, iconColor, label, secondary, action, toggle, checked, onChange, disabled, danger, children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div whileTap={!toggle && !children ? { scale: 0.98 } : {}}>
      <ListItem
        button={!!action}
        onClick={action}
        disabled={disabled}
        sx={{
          py: 1.5,
          px: 2,
          transition: 'background 0.15s ease',
          opacity: disabled ? 0.5 : 1,
          '&:hover': action ? {
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          } : undefined,
        }}
      >
        {icon && (
          <ListItemIcon sx={{ minWidth: 52 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                background: isDark
                  ? `linear-gradient(135deg, ${iconColor}22 0%, ${iconColor}10 100%)`
                  : `linear-gradient(135deg, ${iconColor}18 0%, ${iconColor}08 100%)`,
                border: '1px solid',
                borderColor: `${iconColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: danger ? 'error.main' : iconColor,
              }}
            >
              {icon}
            </Box>
          </ListItemIcon>
        )}
        <ListItemText
          primary={label}
          secondary={secondary}
          primaryTypographyProps={{
            fontWeight: 500,
            fontSize: '0.9rem',
            color: danger ? 'error.main' : 'text.primary',
          }}
          secondaryTypographyProps={{ fontSize: '0.75rem' }}
          sx={!icon ? { pl: secondary ? 0 : 0 } : undefined}
        />
        {toggle ? (
          <Switch
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#fff',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#FFC107',
                opacity: 1,
              },
              '& .MuiSwitch-track': {
                borderRadius: 22,
                opacity: isDark ? 0.3 : 0.25,
              },
              '& .MuiSwitch-thumb': {
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              },
            }}
          />
        ) : children ? children : action ? (
          <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
        ) : null}
      </ListItem>
    </motion.div>
  );
};

const SectionPaper = ({ children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {children}
    </Paper>
  );
};

const Separator = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return <Divider sx={{ ml: 7.5, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />;
};

export default function SettingsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { mode, toggleTheme } = useThemeMode();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    rideUpdates: true,
    promoAlerts: true,
    emailNotifications: false,
    locationTracking: true,
    language: 'en',
  });

  const handleToggle = (key) => setSettings({ ...settings, [key]: !settings[key] });
  const handleLanguageChange = (e) => setSettings({ ...settings, language: e.target.value });

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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          background: isDark
            ? 'linear-gradient(160deg, #1C1C1C 0%, #141414 100%)'
            : 'linear-gradient(160deg, #FFFFFF 0%, #F8F8F8 100%)',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #FFC107 0%, #FF8C00 100%)' }} />
        <IconButton
          onClick={() => router.back()}
          sx={{
            bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            width: 38, height: 38,
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)' },
          }}
        >
          <BackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.3 }}>
          Settings
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
          px: 2,
          pt: 2,
          pb: 3,
        }}
      >
        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <SectionHeader title="Notifications" />
          <SectionPaper>
            <List disablePadding>
              <StyledListItem icon={<NotificationsIcon sx={{ fontSize: 18 }} />} iconColor="#4CAF50" label="Push Notifications" secondary="Receive notifications on your device" toggle checked={settings.pushNotifications} onChange={() => handleToggle('pushNotifications')} />
              <Separator />
              <StyledListItem icon={<RideUpdatesIcon sx={{ fontSize: 18 }} />} iconColor="#2196F3" label="Ride Updates" secondary="Driver arrival, ride status changes" toggle checked={settings.rideUpdates} onChange={() => handleToggle('rideUpdates')} disabled={!settings.pushNotifications} />
              <Separator />
              <StyledListItem icon={<PromoIcon sx={{ fontSize: 18 }} />} iconColor="#FFC107" label="Promo Alerts" secondary="Special offers and discounts" toggle checked={settings.promoAlerts} onChange={() => handleToggle('promoAlerts')} disabled={!settings.pushNotifications} />
              <Separator />
              <StyledListItem icon={<EmailIcon sx={{ fontSize: 18 }} />} iconColor="#9C27B0" label="Email Notifications" secondary="Receive updates via email" toggle checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
            </List>
          </SectionPaper>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionHeader title="Appearance" />
          <SectionPaper>
            <List disablePadding>
              <StyledListItem icon={<DarkModeIcon sx={{ fontSize: 18 }} />} iconColor="#607D8B" label="Dark Mode" secondary="Use dark theme for the app" toggle checked={mode === 'dark'} onChange={toggleTheme} />
            </List>
          </SectionPaper>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionHeader title="Language & Region" />
          <SectionPaper>
            <List disablePadding>
              <ListItem sx={{ py: 1.5, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 52 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, background: isDark ? 'rgba(33,150,243,0.15)' : 'rgba(33,150,243,0.1)', border: '1px solid rgba(33,150,243,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2196F3' }}>
                    <LanguageIcon sx={{ fontSize: 18 }} />
                  </Box>
                </ListItemIcon>
                <ListItemText primary="Language" secondary="App language" primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }} secondaryTypographyProps={{ fontSize: '0.75rem' }} />
                <Select
                  value={settings.language}
                  onChange={handleLanguageChange}
                  variant="outlined"
                  size="small"
                  sx={{
                    minWidth: 110,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                    },
                    '& .MuiSelect-select': { fontWeight: 600, fontSize: '0.82rem' },
                  }}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="ny">Nyanja</MenuItem>
                  <MenuItem value="bem">Bemba</MenuItem>
                </Select>
              </ListItem>
            </List>
          </SectionPaper>
        </motion.div>

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionHeader title="Privacy & Security" />
          <SectionPaper>
            <List disablePadding>
              <StyledListItem icon={<LocationIcon sx={{ fontSize: 18 }} />} iconColor="#FF5722" label="Location Tracking" secondary="Allow app to access your location" toggle checked={settings.locationTracking} onChange={() => handleToggle('locationTracking')} />
              <Separator />
              <StyledListItem icon={<SecurityIcon sx={{ fontSize: 18 }} />} iconColor="#795548" label="Privacy Policy" secondary="Read our privacy policy" action={() => router.push('/profile/settings/privacy')} />
            </List>
          </SectionPaper>
        </motion.div>

        {/* Data */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionHeader title="Data Management" />
          <SectionPaper>
            <List disablePadding>
              <StyledListItem icon={<StorageIcon sx={{ fontSize: 18 }} />} iconColor="#9E9E9E" label="Clear Cache" secondary="Free up storage space" action={() => alert('Cache cleared!')} />
              <Separator />
              <StyledListItem icon={<DownloadIcon sx={{ fontSize: 18 }} />} iconColor="#00BCD4" label="Download My Data" secondary="Get a copy of your data" action={() => alert('Data will be downloaded...')} />
              <Separator />
              <StyledListItem
                icon={<DeleteIcon sx={{ fontSize: 18 }} />}
                iconColor="#f44336"
                label="Delete Account"
                secondary="Permanently delete your account"
                danger
                action={() => { if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) { alert('Account deletion requested'); } }}
              />
            </List>
          </SectionPaper>
        </motion.div>
      </Box>
    </Box>
  );
}