'use client';

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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  LocationOn as LocationIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeMode } from '@/components/ThemeProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { mode, toggleTheme } = useThemeMode();

  const [settings, setSettings] = useState({
    pushNotifications: true,
    rideUpdates: true,
    promoAlerts: true,
    emailNotifications: false,
    locationTracking: true,
    language: 'en',
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleLanguageChange = (event) => {
    setSettings({ ...settings, language: event.target.value });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton onClick={() => router.back()} edge="start">
          <BackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Settings
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Notifications Section */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}
        >
          Notifications
        </Typography>
        <Paper sx={{ mb: 3 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive notifications on your device"
              />
              <Switch
                checked={settings.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Ride Updates"
                secondary="Driver arrival, ride status changes"
                sx={{ pl: 7 }}
              />
              <Switch
                checked={settings.rideUpdates}
                onChange={() => handleToggle('rideUpdates')}
                disabled={!settings.pushNotifications}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Promo Alerts"
                secondary="Special offers and discounts"
                sx={{ pl: 7 }}
              />
              <Switch
                checked={settings.promoAlerts}
                onChange={() => handleToggle('promoAlerts')}
                disabled={!settings.pushNotifications}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive updates via email"
                sx={{ pl: 7 }}
              />
              <Switch
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Appearance Section */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}
        >
          Appearance
        </Typography>
        <Paper sx={{ mb: 3 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon>
                <DarkModeIcon />
              </ListItemIcon>
              <ListItemText
                primary="Dark Mode"
                secondary="Use dark theme for the app"
              />
              <Switch checked={mode === 'dark'} onChange={toggleTheme} />
            </ListItem>
          </List>
        </Paper>

        {/* Language & Region */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}
        >
          Language & Region
        </Typography>
        <Paper sx={{ mb: 3 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon>
                <LanguageIcon />
              </ListItemIcon>
              <ListItemText primary="Language" secondary="App language" />
              <Select
                value={settings.language}
                onChange={handleLanguageChange}
                variant="outlined"
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ny">Nyanja</MenuItem>
                <MenuItem value="bem">Bemba</MenuItem>
              </Select>
            </ListItem>
          </List>
        </Paper>

        {/* Privacy & Security */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}
        >
          Privacy & Security
        </Typography>
        <Paper sx={{ mb: 3 }}>
          <List disablePadding>
            <ListItem>
              <ListItemIcon>
                <LocationIcon />
              </ListItemIcon>
              <ListItemText
                primary="Location Tracking"
                secondary="Allow app to access your location"
              />
              <Switch
                checked={settings.locationTracking}
                onChange={() => handleToggle('locationTracking')}
              />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => router.push('/profile/settings/privacy')}>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Privacy Policy"
                secondary="Read our privacy policy"
              />
              <ChevronRightIcon />
            </ListItem>
          </List>
        </Paper>

        {/* Data Management */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, mb: 1, display: 'block', fontWeight: 600 }}
        >
          Data Management
        </Typography>
        <Paper>
          <List disablePadding>
            <ListItem button onClick={() => alert('Cache cleared!')}>
              <ListItemText
                primary="Clear Cache"
                secondary="Free up storage space"
              />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => alert('Data will be downloaded...')}>
              <ListItemText
                primary="Download My Data"
                secondary="Get a copy of your data"
              />
            </ListItem>
            <Divider />
            <ListItem
              button
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to delete your account? This action cannot be undone.'
                  )
                ) {
                  alert('Account deletion requested');
                }
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemText
                primary="Delete Account"
                secondary="Permanently delete your account"
              />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Box>
  );
}
