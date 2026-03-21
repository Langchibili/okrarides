'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForwardIos as ArrowIcon,
  DirectionsCar,
  MyLocation,
  Payment,
  SupportAgent,
  CardGiftcard,
  TwoWheeler,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { APP_VERSION } from '@/Constants';
import apiClient from '@/lib/api/client';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function AboutPage() {
  const router = useRouter();

  const [frontenUrl, setLandingPageUrl] = useState(process.env.NEXT_PUBLIC_FRONTEND_URL);

  useEffect(() => {
    const getFrontendUrl = async () => {
      const res = await apiClient.get('/frontend-url').catch(() => null);
      const url = res?.data?.paths?.['okra-frontend-app'];
      if (url) setLandingPageUrl(url);
    };
    getFrontendUrl();
  }, []);

  const links = [
    { label: 'Terms of Service',     url: `${frontenUrl}/terms.html`,                   emoji: '📋' },
    { label: 'Privacy Policy',       url: `${frontenUrl}/privacy-policy.html`,           emoji: '🔒' },
    { label: 'Data Deletion Policy', url: `${frontenUrl}/data-deletion-policy.html`,     emoji: '🗑️' },
    { label: 'Account Deletion',     url: `${frontenUrl}/account-deletion-policy.html`,  emoji: '👤' },
   ]

  const features = [
    { icon: <DirectionsCar sx={{ fontSize: 18 }} />, label: 'Taxi' },
    { icon: <TwoWheeler sx={{ fontSize: 18 }} />,    label: 'Motorcycle' },
    { icon: <MyLocation sx={{ fontSize: 18 }} />,    label: 'Live Tracking' },
    { icon: <Payment sx={{ fontSize: 18 }} />,       label: 'Secure Pay' },
    { icon: <SupportAgent sx={{ fontSize: 18 }} />,  label: '24/7 Support' },
    { icon: <CardGiftcard sx={{ fontSize: 18 }} />,  label: 'Rewards' },
  ];

  return (
    // ── Scroll container ────────────────────────────────────────────────────
    <Box sx={{ height: '100vh', overflowY: 'auto', bgcolor: '#0f0f13' }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          bgcolor: 'rgba(15,15,19,0.82)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <IconButton
          onClick={() => router.back()}
          edge="start"
          sx={{
            color: '#fff',
            bgcolor: 'rgba(255,255,255,0.07)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.13)' },
            width: 36, height: 36,
          }}
        >
          <BackIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>
          About
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 6 }}>

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <Box
            sx={{
              mt: 2.5, mb: 3,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ea580c 100%)',
              boxShadow: '0 20px 60px rgba(249,115,22,0.35)',
            }}
          >
            {/* decorative blobs */}
            <Box sx={{
              position: 'absolute', top: -40, right: -40,
              width: 180, height: 180, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', pointerEvents: 'none',
            }} />
            <Box sx={{
              position: 'absolute', bottom: -30, left: -20,
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(0,0,0,0.1)', pointerEvents: 'none',
            }} />

            <Box sx={{ position: 'relative', p: 4, textAlign: 'center' }}>
              {/* logo mark */}
              <Box sx={{
                width: 64, height: 64, borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <Typography sx={{ fontWeight: 900, fontSize: 28, color: '#fff', lineHeight: 1 }}>O</Typography>
              </Box>

              <Typography sx={{
                fontWeight: 800, fontSize: 28, color: '#fff',
                letterSpacing: '-0.8px', lineHeight: 1.1, mb: 0.75,
              }}>
                 Okra Delivery
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', mb: 2.5, lineHeight: 1.5 }}>
                For your maximum earning as a driver
              </Typography>

              <Chip
                label={`v${APP_VERSION}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 11,
                  border: '1px solid rgba(255,255,255,0.25)',
                  height: 24,
                }}
              />
            </Box>
          </Box>
        </motion.div>

        {/* ── About text ─────────────────────────────────────────────────── */}
        <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
          <Paper
            elevation={0}
            sx={{
              mb: 3, p: 3, borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, mb: 2.5 }}>
              Okra Rides is Zambia's leading multi-modal transport platform, connecting
              riders with safe, reliable, and affordable transportation options across the country.
            </Typography>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 2.5 }} />

            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', mb: 1.5 }}>
              Features
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {features.map((f) => (
                <Chip
                  key={f.label}
                  icon={<Box sx={{ color: '#f97316 !important', display: 'flex' }}>{f.icon}</Box>}
                  label={f.label}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 12,
                    fontWeight: 500,
                    '& .MuiChip-icon': { color: '#f97316' },
                  }}
                />
              ))}
            </Box>
          </Paper>
        </motion.div>

        {/* ── Legal links ────────────────────────────────────────────────── */}
        <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', mb: 1.5, px: 0.5 }}>
            Legal &amp; Info
          </Typography>

          <Paper
            elevation={0}
            sx={{
              mb: 3, borderRadius: 3, overflow: 'hidden',
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {links.map((link, index) => (
              <Box key={link.label}>
                {index > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />}
                <Box
                  component="a"
                  href={link.url}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 2.5,
                    py: 1.75,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: 'rgba(249,115,22,0.07)' },
                    '&:active': { bgcolor: 'rgba(249,115,22,0.12)' },
                  }}
                >
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                    bgcolor: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, lineHeight: 1,
                  }}>
                    {link.emoji}
                  </Box>

                  <Typography sx={{
                    flex: 1, fontSize: 14, fontWeight: 500,
                    color: 'rgba(255,255,255,0.85)',
                  }}>
                    {link.label}
                  </Typography>

                  <ArrowIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }} />
                </Box>
              </Box>
            ))}
          </Paper>
        </motion.div>

        {/* ── Copyright ──────────────────────────────────────────────────── */}
        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 2 }}>
              © 2025 Okra Technologies. All rights reserved.
              <br />
              Made with ❤️ in Zambia 🇿🇲
            </Typography>
          </Box>
        </motion.div>

      </Box>
    </Box>
  );
}