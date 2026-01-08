'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useDriver } from '@/lib/hooks/useDriver';

export default function SettingsPage() {
  const router = useRouter();
  const { driverProfile, updatePreferences } = useDriver();

  const [preferences, setPreferences] = useState({
    pushNotifications: true,
    smsNotifications: true,
    emailNotifications: false,
    rideRequestSound: true,
    autoAcceptRides: false,
    maxDistanceForPickup: 10,
    preferredNavigationApp: 'google_maps',
    voiceNavigationEnabled: true,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (driverProfile) {
      setPreferences({
        pushNotifications: driverProfile.pushNotifications ?? true,
        smsNotifications: driverProfile.smsNotifications ?? true,
        emailNotifications: driverProfile.emailNotifications ?? false,
        rideRequestSound: driverProfile.rideRequestSound ?? true,
        autoAcceptRides: driverProfile.autoAcceptRides ?? false,
        maxDistanceForPickup: driverProfile.maxDistanceForPickup ?? 10,
        preferredNavigationApp: driverProfile.preferredNavigationApp ?? 'google_maps',
        voiceNavigationEnabled: driverProfile.voiceNavigationEnabled ?? true,
      });
    }
  }, [driverProfile]);

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updatePreferences(preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully!
          </Alert>
        )}

        {/* Notifications */}
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
          <List disablePadding>
            <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                NOTIFICATIONS
              </Typography>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive ride requests and updates"
              />
              <Switch
                checked={preferences.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="SMS Notifications"
                secondary="Important updates via SMS"
              />
              <Switch
                checked={preferences.smsNotifications}
                onChange={() => handleToggle('smsNotifications')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receipts and weekly summaries"
              />
              <Switch
                checked={preferences.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="Ride Request Sound"
                secondary="Play sound for new ride requests"
              />
              <Switch
                checked={preferences.rideRequestSound}
                onChange={() => handleToggle('rideRequestSound')}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Ride Preferences */}
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
          <List disablePadding>
            <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                RIDE PREFERENCES
              </Typography>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Auto-Accept Rides"
                secondary="Automatically accept ride requests"
              />
              <Switch
                checked={preferences.autoAcceptRides}
                onChange={() => handleToggle('autoAcceptRides')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="Maximum Pickup Distance"
                secondary={`${preferences.maxDistanceForPickup} km`}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Navigation */}
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
          <List disablePadding>
            <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                NAVIGATION
              </Typography>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="Voice Navigation"
                secondary="Turn-by-turn voice guidance"
              />
              <Switch
                checked={preferences.voiceNavigationEnabled}
                onChange={() => handleToggle('voiceNavigationEnabled')}
              />
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="Navigation App"
                secondary={preferences.preferredNavigationApp === 'google_maps' ? 'Google Maps' : 'Waze'}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Save Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={loading}
          sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
}
