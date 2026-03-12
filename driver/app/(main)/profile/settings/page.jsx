// //Okrarides\driver\app\(main)\profile\settings\page.jsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   AppBar,
//   Toolbar,
//   Typography,
//   IconButton,
//   Paper,
//   List,
//   ListItem,
//   ListItemText,
//   Switch,
//   Divider,
//   Button,
//   Alert,
// } from '@mui/material';
// import { ArrowBack as BackIcon } from '@mui/icons-material';
// import { useDriver } from '@/lib/hooks/useDriver';

// export default function SettingsPage() {
//   const router = useRouter();
//   const { driverProfile, updatePreferences } = useDriver();

//   const [preferences, setPreferences] = useState({
//     pushNotifications: true,
//     smsNotifications: true,
//     emailNotifications: false,
//     rideRequestSound: true,
//     autoAcceptRides: false,
//     maxDistanceForPickup: 10,
//     preferredNavigationApp: 'google_maps',
//     voiceNavigationEnabled: true,
//   });

//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);

//   useEffect(() => {
//     if (driverProfile) {
//       setPreferences({
//         pushNotifications: driverProfile.pushNotifications ?? true,
//         smsNotifications: driverProfile.smsNotifications ?? true,
//         emailNotifications: driverProfile.emailNotifications ?? false,
//         rideRequestSound: driverProfile.rideRequestSound ?? true,
//         autoAcceptRides: driverProfile.autoAcceptRides ?? false,
//         maxDistanceForPickup: driverProfile.maxDistanceForPickup ?? 10,
//         preferredNavigationApp: driverProfile.preferredNavigationApp ?? 'google_maps',
//         voiceNavigationEnabled: driverProfile.voiceNavigationEnabled ?? true,
//       });
//     }
//   }, [driverProfile]);

//   const handleToggle = (key) => {
//     setPreferences((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const handleSave = async () => {
//     try {
//       setLoading(true);
//       await updatePreferences(preferences);
//       setSuccess(true);
//       setTimeout(() => setSuccess(false), 3000);
//     } catch (error) {
//       console.error('Error saving preferences:', error);
//     } finally {
//       setLoading(false);
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
//           <Typography variant="h6" sx={{ flex: 1 }}>
//             Settings
//           </Typography>
//         </Toolbar>
//       </AppBar>

//       <Box sx={{ p: 3 }}>
//         {success && (
//           <Alert severity="success" sx={{ mb: 3 }}>
//             Settings saved successfully!
//           </Alert>
//         )}

//         {/* Notifications */}
//         <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
//           <List disablePadding>
//             <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
//               <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
//                 NOTIFICATIONS
//               </Typography>
//             </ListItem>

//             <ListItem>
//               <ListItemText
//                 primary="Push Notifications"
//                 secondary="Receive ride requests and updates"
//               />
//               <Switch
//                 checked={preferences.pushNotifications}
//                 onChange={() => handleToggle('pushNotifications')}
//               />
//             </ListItem>

//             <Divider />

//             <ListItem>
//               <ListItemText
//                 primary="SMS Notifications"
//                 secondary="Important updates via SMS"
//               />
//               <Switch
//                 checked={preferences.smsNotifications}
//                 onChange={() => handleToggle('smsNotifications')}
//               />
//             </ListItem>

//             <Divider />

//             <ListItem>
//               <ListItemText
//                 primary="Email Notifications"
//                 secondary="Receipts and weekly summaries"
//               />
//               <Switch
//                 checked={preferences.emailNotifications}
//                 onChange={() => handleToggle('emailNotifications')}
//               />
//             </ListItem>

//             <Divider />

//             <ListItem>
//               <ListItemText
//                 primary="Ride Request Sound"
//                 secondary="Play sound for new ride requests"
//               />
//               <Switch
//                 checked={preferences.rideRequestSound}
//                 onChange={() => handleToggle('rideRequestSound')}
//               />
//             </ListItem>
//           </List>
//         </Paper>

//         {/* Ride Preferences */}
//         <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
//           <List disablePadding>
//             <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
//               <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
//                 RIDE PREFERENCES
//               </Typography>
//             </ListItem>

//             <ListItem>
//               <ListItemText
//                 primary="Auto-Accept Rides"
//                 secondary="Automatically accept ride requests"
//               />
//               <Switch
//                 checked={preferences.autoAcceptRides}
//                 onChange={() => handleToggle('autoAcceptRides')}
//               />
//             </ListItem>

//             <Divider />

//             <ListItem>
//               <ListItemText
//                 primary="Maximum Pickup Distance"
//                 secondary={`${preferences.maxDistanceForPickup} km`}
//               />
//             </ListItem>
//           </List>
//         </Paper>

//         {/* Navigation */}
//         <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
//           <List disablePadding>
//             <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
//               <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
//                 NAVIGATION
//               </Typography>
//             </ListItem>

//             <ListItem>
//               <ListItemText
//                 primary="Voice Navigation"
//                 secondary="Turn-by-turn voice guidance"
//               />
//               <Switch
//                 checked={preferences.voiceNavigationEnabled}
//                 onChange={() => handleToggle('voiceNavigationEnabled')}
//               />
//             </ListItem>

//             <Divider />

//             <ListItem>
//               <ListItemText
//                 primary="Navigation App"
//                 secondary={preferences.preferredNavigationApp === 'google_maps' ? 'Google Maps' : 'Waze'}
//               />
//             </ListItem>
//           </List>
//         </Paper>

//         {/* Save Button */}
//         <Button
//           fullWidth
//           variant="contained"
//           size="large"
//           onClick={handleSave}
//           disabled={loading}
//           sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
//         >
//           {loading ? 'Saving...' : 'Save Settings'}
//         </Button>
//       </Box>
//     </Box>
//   );
// }

// PATH: app/(main)/profile/settings/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter }            from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, IconButton,
  Paper, List, ListItem, ListItemText, Switch, Divider, Button, Alert,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriver } from '@/lib/hooks/useDriver';
import { useThemeMode } from '@/components/ThemeProvider';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

function ToggleRow({ primary, secondary, checked, onChange, accent = '#3B82F6' }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <ListItem sx={{ py: 1.5, px: 2 }}>
      <ListItemText
        primary={<Typography variant="body2" fontWeight={600}>{primary}</Typography>}
        secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
      />
      <Switch
        checked={checked}
        onChange={onChange}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked':                    { color: accent },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: alpha(accent, 0.5) },
        }}
      />
    </ListItem>
  );
}

function SettingSection({ label, children }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
      <Paper elevation={isDark ? 0 : 2} sx={{
        borderRadius: 3, mb: 2, overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.08)}`,
      }}>
        <Box sx={{ px: 2, py: 1, bgcolor: alpha(theme.palette.background.default, 0.7) }}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.8, color: 'text.disabled', fontSize: 10, textTransform: 'uppercase' }}>
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
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { driverProfile, updatePreferences } = useDriver();
  const [prefs,   setPrefs]   = useState(DEFAULTS);
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1E293B', 0.98)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
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
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Settings saved!</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <SettingSection label="Notifications">
          <ToggleRow primary="Push Notifications" secondary="Ride requests and app updates" checked={prefs.pushNotifications} onChange={() => toggle('pushNotifications')} accent="#3B82F6" />
          <Divider sx={{ ml: 2 }} />
          <ToggleRow primary="SMS Notifications"  secondary="Important updates via SMS"    checked={prefs.smsNotifications}  onChange={() => toggle('smsNotifications')}  accent="#10B981" />
          <Divider sx={{ ml: 2 }} />
          <ToggleRow primary="Email Notifications" secondary="Receipts and weekly summaries" checked={prefs.emailNotifications} onChange={() => toggle('emailNotifications')} accent="#F59E0B" />
          <Divider sx={{ ml: 2 }} />
          <ToggleRow primary="Ride Request Sound"  secondary="Play sound for new requests"  checked={prefs.rideRequestSound}  onChange={() => toggle('rideRequestSound')}  accent="#8B5CF6" />
        <ToggleRow
    primary="Dark Mode"
    secondary={mode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
    checked={mode === 'dark'}
    onChange={toggleTheme}
    accent="#8B5CF6"
  />
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
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.36)}` }}>
            {loading ? 'Saving…' : 'Save Settings'}
          </Button>
        </motion.div>
      </Box>
    </Box>
  );
}