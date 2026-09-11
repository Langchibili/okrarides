'use client';
// PATH: rider/app/(main)/profile/favourite-locations/page.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, IconButton, List, ListItem,
  ListItemIcon, ListItemText, useTheme, Snackbar, Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocationOn as LocationIcon,
  Delete as DeleteIcon,
  TravelExplore as EmptyIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'okra_rides_recent_locations';

export default function FavouriteLocationsPage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [locations, setLocations] = useState([]);
  const [snack,     setSnack]     = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLocations(JSON.parse(saved));
    } catch {}
  }, []);

  const handleDelete = (index) => {
    const updated = locations.filter((_, i) => i !== index);
    setLocations(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
    showSnack('Location removed');
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <Box sx={{
        flexShrink: 0,
        background: isDark
          ? 'linear-gradient(160deg, #1C1C1C 0%, #141414 100%)'
          : 'linear-gradient(160deg, #FFFFFF 0%, #F8F8F8 100%)',
        borderBottom: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
        px: 2, py: 1.5,
        display: 'flex', alignItems: 'center', gap: 2,
        position: 'relative',
      }}>
        {/* Accent underline */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #FFC107 0%, #FF8C00 100%)' }} />
        <IconButton onClick={() => router.back()} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', width: 38, height: 38, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)' } }}>
          <BackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, letterSpacing: -0.3 }}>Favourite Locations</Typography>
      </Box>

      {/* ── Scrollable content ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', msOverflowStyle: 'none', px: 2, pt: 2, pb: 4 }}>

        {/* Info banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
          <Box sx={{
            p: 2, mb: 2.5, borderRadius: 3,
            background: isDark
              ? 'linear-gradient(135deg, rgba(255,193,7,0.12) 0%, rgba(255,140,0,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(255,193,7,0.08) 0%, rgba(255,140,0,0.03) 100%)',
            border: '1px solid rgba(255,193,7,0.2)',
            display: 'flex', gap: 1.5, alignItems: 'flex-start',
          }}>
            <LocationIcon sx={{ color: '#FFC107', fontSize: 20, flexShrink: 0, mt: 0.1 }} />
            <Typography variant="caption" sx={{ fontWeight: 500, lineHeight: 1.6, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)' }}>
              All the recently visited or mostly visited locations are saved here.
              Tap the trash icon to remove any location you no longer need.
            </Typography>
          </Box>
        </motion.div>

        {/* Empty state */}
        {locations.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 22 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 8, gap: 2 }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                background: isDark ? 'rgba(255,193,7,0.1)' : 'rgba(255,193,7,0.08)',
                border: '1px solid rgba(255,193,7,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <EmptyIcon sx={{ fontSize: 38, color: '#FFC107', opacity: 0.7 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: -0.3 }}>No saved locations yet</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 260, lineHeight: 1.6 }}>
                Locations you visit while booking rides will appear here automatically.
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <List disablePadding>
            <AnimatePresence>
              {locations.map((loc, index) => (
                <motion.div
                  key={`${loc.placeId ?? loc.address}-${index}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                  transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
                  layout
                >
                  <Paper elevation={0} sx={{
                    mb: 1.25, borderRadius: 3, overflow: 'hidden',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': {
                      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.38)' : '0 4px 20px rgba(0,0,0,0.09)',
                    },
                  }}>
                    <ListItem
                      sx={{ px: 2, py: 1.5 }}
                      secondaryAction={
                        <motion.div whileTap={{ scale: 0.85 }}>
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete(index)}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(244,67,54,0.08)',
                              color: 'error.main',
                              width: 34, height: 34,
                              '&:hover': { bgcolor: 'rgba(244,67,54,0.15)' },
                              transition: 'background 0.16s ease',
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </motion.div>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Box sx={{
                          width: 36, height: 36, borderRadius: 2,
                          bgcolor: isDark ? alpha('#FFC107', 0.12) : alpha('#FFC107', 0.1),
                          border: `1px solid ${alpha('#FFC107', 0.2)}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <LocationIcon sx={{ fontSize: 18, color: '#FFC107' }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={700} sx={{ letterSpacing: -0.15 }} noWrap>
                            {loc.name || loc.address?.split(',')[0] || 'Unknown location'}
                          </Typography>
                        }
                        secondary={
                          loc.address && loc.name && loc.name !== loc.address
                            ? <Typography variant="caption" color="text.secondary" noWrap>{loc.address}</Typography>
                            : null
                        }
                        sx={{ pr: 1 }}
                      />
                    </ListItem>
                  </Paper>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}
      </Box>

      {/* ── Snackbar ── */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={closeSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: '100%', borderRadius: 2.5 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}