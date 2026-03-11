'use client';
// PATH: driver/app/(main)/subscription/success/page.jsx
//
// This page is reached after OkraPayModal fires onSuccess (or after a
// free trial starts). It polls GET /subscriptions/me every 3 seconds until
// the subscription status is 'active' or 'trial', shows a success animation,
// then redirects to /home after a short celebration delay.

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Paper, Button,
  CircularProgress, LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Star         as StarIcon,
  Home         as HomeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';

// How long to show the success screen before auto-redirecting (ms)
const REDIRECT_DELAY   = 4000;
// How often to poll the subscription status (ms)
const POLL_INTERVAL    = 3000;
// Give up polling after this many seconds and show the success screen anyway
// (payment was confirmed by OkraPay; backend may just be slightly delayed)
const POLL_TIMEOUT_MS  = 60_000;

export default function SubscriptionSuccessPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { updateUser, user } = useAuth();

  const planName  = params.get('plan')  || '';
  const isTrial   = params.get('type') === 'trial';

  const [phase, setPhase] = useState('polling'); // 'polling' | 'success'
  const [dots,  setDots]  = useState('');        // animated "..." while polling

  const pollRef     = useRef(null);
  const timeoutRef  = useRef(null);
  const redirectRef = useRef(null);
  const startedAt   = useRef(Date.now());

  // ── Animated dots while polling ────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(id);
  }, []);

  // ── Activation logic ───────────────────────────────────────────────────────
  const activateSuccess = (subscription) => {
    // Clear all timers
    clearInterval(pollRef.current);
    clearTimeout(timeoutRef.current);

    // Push the activated subscription into the auth context so the rest of
    // the app reflects the new status immediately (no re-login needed)
    if (subscription && updateUser) {
      updateUser({
        driverProfile: {
          ...user?.driverProfile,
          subscriptionStatus: subscription.status ?? (isTrial ? 'trial' : 'active'),
          currentSubscription: subscription,
        },
      });
    }

    setPhase('success');

    // Auto-redirect after celebration delay
    redirectRef.current = setTimeout(() => {
      router.replace('/home');
    }, REDIRECT_DELAY);
  };

  // ── Poll /subscriptions/me ─────────────────────────────────────────────────
  useEffect(() => {
    // For free trials, the hook already set the status — just show success
    if (isTrial) {
      activateSuccess(null);
      return;
    }

    const poll = async () => {
      try {
        const res = await apiClient.get('/subscriptions/me');
        const sub = res?.subscription ?? res;
        const status = sub?.status ?? sub?.subscriptionStatus;

        if (status === 'active' || status === 'trial') {
          activateSuccess(sub);
          return;
        }
      } catch {
        // Non-fatal — keep polling
      }

      // Give up after POLL_TIMEOUT_MS — show success anyway (payment was confirmed)
      if (Date.now() - startedAt.current >= POLL_TIMEOUT_MS) {
        activateSuccess(null);
      }
    };

    // First poll immediately, then on interval
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      clearInterval(pollRef.current);
      clearTimeout(timeoutRef.current);
      clearTimeout(redirectRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearTimeout(timeoutRef.current);
      clearTimeout(redirectRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <AnimatePresence mode="wait">

        {/* ── Polling state ─────────────────────────────────────────────────── */}
        {phase === 'polling' && (
          <motion.div
            key="polling"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            <Paper
              elevation={4}
              sx={{
                p: 5, borderRadius: 5, textAlign: 'center',
                background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
                color: 'white',
              }}
            >
              <CircularProgress
                size={72}
                thickness={3}
                sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}
              />
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                Activating your subscription{dots}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mb: 3 }}>
                Payment received. We're setting up your plan — this usually takes a few seconds.
              </Typography>
              <LinearProgress
                sx={{
                  borderRadius: 4, height: 6,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': { bgcolor: 'white' },
                }}
              />
            </Paper>
          </motion.div>
        )}

        {/* ── Success state ─────────────────────────────────────────────────── */}
        {phase === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            <Paper
              elevation={4}
              sx={{
                p: 5, borderRadius: 5, textAlign: 'center',
                background: 'linear-gradient(135deg, #4CAF50 0%, #1B5E20 100%)',
                color: 'white',
              }}
            >
              {/* Animated check icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
              >
                <Box sx={{
                  width: 96, height: 96, borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 3,
                }}>
                  <CheckIcon sx={{ fontSize: 56, color: 'white' }} />
                </Box>
              </motion.div>

              {/* Stars */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                  {[0, 0.1, 0.2].map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + d, type: 'spring', stiffness: 400 }}
                    >
                      <StarIcon sx={{ color: '#FFD700', fontSize: 28 }} />
                    </motion.div>
                  ))}
                </Box>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
                  {isTrial ? 'Trial Started!' : "You're Subscribed!"}
                </Typography>

                {planName ? (
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    {planName} Plan
                  </Typography>
                ) : null}

                <Typography variant="body1" sx={{ opacity: 0.85, mb: 3 }}>
                  {isTrial
                    ? 'Your free trial is now active. Enjoy zero-commission rides!'
                    : 'Your subscription is active. You can now accept unlimited rides with zero commission.'}
                </Typography>

                {/* Benefit pills */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mb: 4 }}>
                  {['Zero Commission', 'Unlimited Rides', 'Priority Support'].map(b => (
                    <Box
                      key={b}
                      sx={{
                        px: 2, py: 0.75, borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.35)',
                      }}
                    >
                      <Typography variant="caption" fontWeight={600}>{b}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Redirect hint */}
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 2 }}>
                  Taking you home in a moment…
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<HomeIcon />}
                  onClick={() => router.replace('/home')}
                  sx={{
                    height: 52, borderRadius: 3, fontWeight: 700,
                    bgcolor: 'white', color: 'success.dark',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                  }}
                >
                  Go to Home
                </Button>
              </motion.div>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}