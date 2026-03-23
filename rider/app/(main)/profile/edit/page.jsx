'use client';
// PATH: app/(main)/profile/edit/page.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, AppBar, Toolbar, Typography, IconButton, TextField, Button, Avatar, Paper, MenuItem, Alert } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowBack as BackIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { getImageUrl } from '@/Functions';

export default function EditProfilePage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', dateOfBirth: '', gender: '', address: '' });

  const isUnsetEmail = (email) => email?.startsWith('unset_');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName:   user.firstName   || '',
        lastName:    user.lastName    || '',
        email:       isUnsetEmail(user.email) ? '' : (user.email || ''),
        dateOfBirth: user.dateOfBirth || '',
        gender:      user.gender      || '',
        address:     user.address     || '',
      });
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('files', file);
      const uploadResponse = await apiClient.upload('/upload', fd);
      if (uploadResponse?.[0]) {
        const response = await apiClient.put(`/users/${user.id}`, { profilePicture: uploadResponse[0].id });
        if (response) { updateUser({ profilePicture: uploadResponse[0].url }); setSuccess(true); }
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setError(null);
      const response = await apiClient.put(`/users/${user.id}`, {
        ...formData,
        email:       formData.email.trim() === '' ? user.email : formData.email,
        dateOfBirth: formData.dateOfBirth.trim() === '' ? null : formData.dateOfBirth,
      });
      if (response) { updateUser(formData); setSuccess(true); setTimeout(() => router.back(), 1500); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const appBarBg = isDark
    ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
    : 'linear-gradient(135deg, #065F46 0%, #059669 100%)';

  return (
    // ── Full-height flex column so AppBar is fixed and content scrolls ──
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>

      <AppBar position="static" elevation={0} sx={{
        flexShrink: 0,
        background: appBarBg,
        boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : `0 4px 20px ${alpha('#059669', 0.28)}`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Edit Profile</Typography>
        </Toolbar>
      </AppBar>

      {/* ── Scrollable content area ── */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        p: 2.5,
        pb: 6,
      }}>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2.5 }}>Profile updated successfully!</Alert>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>{error}</Alert>
          </motion.div>
        )}

        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Paper elevation={0} sx={{
            p: 3, borderRadius: 3.5, mb: 2.5, textAlign: 'center',
            border: `1px solid ${alpha(isDark ? '#fff' : '#000', isDark ? 0.08 : 0.07)}`,
            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.07)',
            background: isDark
              ? 'linear-gradient(145deg, rgba(16,185,129,0.08) 0%, transparent 100%)'
              : 'linear-gradient(145deg, #F0FDF4 0%, #FFFFFF 100%)',
          }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(user?.profilePicture, 'thumbnail')}
                sx={{
                  width: 100, height: 100,
                  border: `3px solid ${isDark ? alpha('#10B981', 0.6) : alpha('#059669', 0.5)}`,
                  boxShadow: `0 4px 20px ${alpha('#10B981', 0.3)}`,
                }}
              >
                {user?.firstName?.[0]}
              </Avatar>
              <IconButton component="label" sx={{
                position: 'absolute', bottom: 0, right: 0,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white', width: 32, height: 32,
                boxShadow: `0 2px 8px ${alpha('#10B981', 0.5)}`,
                '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
              }}>
                <CameraIcon fontSize="small" />
                <input type="file" hidden accept="image/*" onChange={handleProfilePictureChange} />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontWeight: 500 }}>
              Tap to change photo
            </Typography>
          </Paper>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <Paper elevation={0} sx={{
              p: 2.5, borderRadius: 3.5,
              border: `1px solid ${alpha(isDark ? '#fff' : '#000', isDark ? 0.08 : 0.07)}`,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                  <TextField fullWidth label="Last Name"  name="lastName"  value={formData.lastName}  onChange={handleChange} required />
                </Box>
                <TextField fullWidth label="Email" type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder={isUnsetEmail(user?.email) ? 'Add email address' : ''}
                  helperText="Optional — for receipts and notifications" />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField fullWidth label="Date of Birth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                  <TextField select fullWidth label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                    <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                  </TextField>
                </Box>
                <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} multiline rows={2} />
              </Box>

              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                sx={{
                  mt: 3, height: 56, borderRadius: 3, fontWeight: 700,
                  background: isDark
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: `0 4px 20px ${alpha('#10B981', 0.38)}`,
                }}>
                {loading ? 'Saving…' : 'Save Changes'}
              </Button>
            </Paper>
          </motion.div>
        </form>
      </Box>
    </Box>
  );
}