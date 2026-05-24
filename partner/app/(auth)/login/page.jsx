'use client';
// PATH: app/login/page.jsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  AlternateEmail as EmailIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisIcon,
  VisibilityOff as VisOffIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';

/** Returns true when the string looks like an e-mail address. */
const looksLikeEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect already-authenticated users
  useEffect(() => {
    if (!authLoading && isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const identifierIsEmail = looksLikeEmail(identifier);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email address or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await login(identifier.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      // Strapi returns user-friendly messages in err.message
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('identifier') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('invalid')) {
        setError('Incorrect email / username or password. Please try again.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ pt: 6, pb: 5 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your partner account to continue.
          </Typography>
        </motion.div>
      </Box>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Identifier field */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
              Email Address or Username
            </Typography>
            <TextField
              fullWidth
              autoComplete="username"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
              placeholder="you@example.com  or  john_banda"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {identifierIsEmail
                      ? <EmailIcon sx={{ color: 'text.secondary' }} />
                      : <PersonIcon sx={{ color: 'text.secondary' }} />}
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { height: 56 } }}
            />
            {/* Subtle hint showing detected mode */}
            {identifier.length > 3 && (
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                Signing in as: <strong>{identifierIsEmail ? 'email address' : 'username'}</strong>
              </Typography>
            )}
          </Box>

          {/* Password field */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block', fontWeight: 600 }}>
              Password
            </Typography>
            <TextField
              fullWidth
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter your password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd((v) => !v)} edge="end">
                      {showPwd ? <VisOffIcon fontSize="small" /> : <VisIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { height: 56 } }}
            />
          </Box>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }}>
                {error}
              </Alert>
            </motion.div>
          )}

          {/* Submit */}
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !identifier.trim() || !password}
            sx={{ height: 56, fontSize: '1rem', fontWeight: 700, borderRadius: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </form>
      </motion.div>

      <Box sx={{ flex: 1 }} />

      {/* Footer links */}
      <Button
        fullWidth
        variant="text"
        onClick={() => router.push('/register')}
        sx={{ height: 48, textTransform: 'none' }}
      >
        Don&apos;t have an account?&nbsp;<strong>Register as a Partner</strong>
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
        By signing in, you agree to our Terms &amp; Conditions.
      </Typography>
    </Box>
  );
}