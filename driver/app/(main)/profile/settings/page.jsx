'use client';
// PATH: app/(main)/profile/settings/page.jsx — UI POLISH ONLY
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, AppBar, Toolbar, Typography, IconButton, Paper, List, ListItem, ListItemText, Switch, Divider, Button, Alert } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriver } from '@/lib/hooks/useDriver';
import { useThemeMode } from '@/components/ThemeProvider';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

function ToggleRow({ primary, secondary, checked, onChange, accent = '#3B82F6' }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <ListItem sx={{ py: 1.5, px: 2 }}>
      <ListItemText
        primary={<Typography variant="body2" fontWeight={600}>{primary}</Typography>}
        secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
      />
      <Switch checked={checked} onChange={onChange} sx={{
        '& .MuiSwitch-switchBase.Mui-checked': { color: accent },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: alpha(accent, 0.5) },
      }} />
    </ListItem>
  );
}

function SettingSection({ label, children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
      <Paper elevation={0} sx={{
        borderRadius: 3, mb: 2, overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.1)}`,
        boxShadow: isDark ? 'none' : '0 3px 16px rgba(0,0,0,0.06)',
        background: isDark ? undefined : 'linear-gradient(145deg, #FFFFFF 0%, #FAFAFA 100%)',
      }}>
        <Box sx={{
          px: 2, py: 1.25,
          background: isDark
            ? alpha('#fff', 0.03)
            : 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.08 : 0.08)}`,
        }}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.8, color: isDark ? 'text.disabled' : '#059669', fontSize: 10, textTransform: 'uppercase' }}>
            {label}
          </Typography>
        </Box>
        <List disablePadding>{children}</List>
      </Paper>
    </motion.div>
  );
}

const DEFAULTS = {
  pushNotifications: true, smsNotifications: true, emailNotifications: false,
  rideRequestSound: true, autoAcceptRides: false, maxDistanceForPickup: 10,
  preferredNavigationApp: 'google_maps', voiceNavigationEnabled: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { driverProfile, updatePreferences } = useDriver();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { mode, toggleTheme } = useThemeMode();

  useEffect(() => {
    if (driverProfile) setPrefs({ ...DEFAULTS, ...Object.fromEntries(Object.keys(DEFAULTS).map(k => [k, driverProfile[k] ?? DEFAULTS[k]])) });
  }, [driverProfile]);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    try {
      setLoading(true);
      await updatePreferences(prefs);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error('Error saving preferences:', err); }
    finally { setLoading(false); }
  };

  const appBarBg = isDark
    ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
    : `linear-gradient(135deg, #065F46 0%, #059669 100%)`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{
        background: appBarBg,
        boxShadow: isDark ? `0 2px 16px rgba(0,0,0,0.4)` : `0 4px 20px ${alpha('#059669', 0.28)}`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Settings</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 4, ...hideScrollbar }}>
        <AnimatePresence>
          {success && (
            <motion.div key="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5, boxShadow: '0 4px 16px rgba(16,185,129,0.2)' }}>Settings saved successfully!</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <SettingSection label="Notifications">
          <ToggleRow primary="Push Notifications" secondary="Ride requests and app updates" checked={prefs.pushNotifications} onChange={() => toggle('pushNotifications')} accent="#3B82F6" />
          <Divider sx={{ ml: 2 }} />
          <ToggleRow primary="SMS Notifications" secondary="Important updates via SMS" checked={prefs.smsNotifications} onChange={() => toggle('smsNotifications')} accent="#10B981" />
          <Divider sx={{ ml: 2 }} />
          <ToggleRow primary="Email Notifications" secondary="Receipts and weekly summaries" checked={prefs.emailNotifications} onChange={() => toggle('emailNotifications')} accent="#F59E0B" />
          <Divider sx={{ ml: 2 }} />
          <ToggleRow primary="Ride Request Sound" secondary="Play sound for new requests" checked={prefs.rideRequestSound} onChange={() => toggle('rideRequestSound')} accent="#8B5CF6" />
          <Divider sx={{ ml: 2 }} />
          <ToggleRow primary="Dark Mode" secondary={mode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'} checked={mode === 'dark'} onChange={toggleTheme} accent="#8B5CF6" />
        </SettingSection>

        <SettingSection label="Ride Preferences">
          <ToggleRow primary="Auto-Accept Rides" secondary="Automatically accept new requests" checked={prefs.autoAcceptRides} onChange={() => toggle('autoAcceptRides')} accent="#F59E0B" />
          <Divider sx={{ ml: 2 }} />
          <ListItem sx={{ py: 1.5, px: 2 }}>
            <ListItemText
              primary={<Typography variant="body2" fontWeight={600}>Max Pickup Distance</Typography>}
              secondary={<Typography variant="caption" color="text.secondary">{prefs.maxDistanceForPickup} km</Typography>}
            />
          </ListItem>
        </SettingSection>

        <SettingSection label="Navigation">
          <ToggleRow primary="Voice Navigation" secondary="Turn-by-turn voice guidance" checked={prefs.voiceNavigationEnabled} onChange={() => toggle('voiceNavigationEnabled')} accent="#10B981" />
          <Divider sx={{ ml: 2 }} />
          <ListItem sx={{ py: 1.5, px: 2 }}>
            <ListItemText
              primary={<Typography variant="body2" fontWeight={600}>Navigation App</Typography>}
              secondary={<Typography variant="caption" color="text.secondary">{prefs.preferredNavigationApp === 'google_maps' ? 'Google Maps' : 'Waze'}</Typography>}
            />
          </ListItem>
        </SettingSection>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button fullWidth variant="contained" size="large" disabled={loading} onClick={handleSave}
            sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
              background: isDark
                ? `linear-gradient(135deg, #10B981 0%, #059669 100%)`
                : `linear-gradient(135deg, #059669 0%, #047857 100%)`,
              boxShadow: `0 4px 20px ${alpha('#10B981', 0.38)}`,
              '&:hover': { boxShadow: `0 6px 28px ${alpha('#10B981', 0.5)}` },
            }}>
            {loading ? 'Saving…' : 'Save Settings'}
          </Button>
        </motion.div>
      </Box>
    </Box>
  );
}