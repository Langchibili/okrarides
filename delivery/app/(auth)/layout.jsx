'use client';
// PATH: rider/app/(auth)/AuthLayoutClient.jsx
// Full auth layout logic — moved here from layout.jsx so layout.jsx can be
// a Server Component and export const dynamic = 'force-dynamic'.

import { Box, Container, AppBar, Toolbar, Typography, useTheme } from '@mui/material';
import { alpha }       from '@mui/material/styles';
import { useRouter, usePathname }   from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LightMode as LightIcon, DarkMode as DarkIcon } from '@mui/icons-material';
import { useThemeMode } from '@/components/ThemeProvider';
import ContextProviders from '@/lib/contexts/ContextProviders';

const GREEN     = '#10B981';
const GREEN_DIM = '#059669';

function AppsIcon({ size = 20, color = GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3"  y="3"  width="7" height="7" rx="2" fill={color} />
      <rect x="14" y="3"  width="7" height="7" rx="2" fill={color} opacity="0.7" />
      <rect x="3"  y="14" width="7" height="7" rx="2" fill={color} opacity="0.7" />
      <rect x="14" y="14" width="7" height="7" rx="2" fill={color} opacity="0.5" />
    </svg>
  );
}

function HelpSvgIcon({ size = 20, color = GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 10.88 12 12 12 13.5"
            stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.9" fill={color} />
    </svg>
  );
}

function AnimatedHeaderButton({ label, icon, direction, onClick }) {
  const [phase, setPhase] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const t = setTimeout(() => { if (mounted.current) setPhase(1); }, 1800);
    return () => { mounted.current = false; clearTimeout(t); };
  }, []);

  const textVariants = {
    enter:  { x: direction === 'left' ? 18 : -18, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 28 } },
    exit:   { x: direction === 'left' ? -22 : 22, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
  };
  const iconVariants = {
    enter:  { x: direction === 'left' ? 18 : -18, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 26 } },
    exit:   { x: 0, opacity: 0, transition: { duration: 0.15 } },
  };

  return (
    <Box onClick={onClick} sx={{
      cursor: 'pointer', minWidth: 48, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', borderRadius: 2, px: 0.5,
      '&:hover': { '& .btn-glow': { opacity: 1 } },
    }}>
      <Box className="btn-glow" sx={{
        position: 'absolute', inset: 0, borderRadius: 2,
        background: `radial-gradient(circle, ${alpha(GREEN, 0.18)} 0%, transparent 70%)`,
        opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none',
      }} />
      <AnimatePresence mode="wait" initial>
        {phase === 0 ? (
          <motion.div key="label" variants={textVariants} initial="enter" animate="center" exit="exit"
            style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
            {direction === 'left' && (
              <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1, color: GREEN, mr: 0.25, letterSpacing: -1, fontFamily: 'monospace' }}>«</Typography>
            )}
            <Typography sx={{
              fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
              background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DIM} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {label}
            </Typography>
            {direction === 'right' && (
              <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1, color: GREEN, ml: 0.25, letterSpacing: -1, fontFamily: 'monospace' }}>»</Typography>
            )}
          </motion.div>
        ) : (
          <motion.div key="icon" variants={iconVariants} initial="enter" animate="center" exit="exit"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 6px ${alpha(GREEN, 0.55)})` }}>
            {icon}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

const PILL_W = 74, PILL_H = 30, THUMB_D = 22, THUMB_PAD = 3;
const THUMB_TRAVEL = PILL_W - THUMB_D - THUMB_PAD * 3;

function ThemeToggle({ isDark, onToggle }) {
  return (
    <Box onClick={onToggle} sx={{
      position: 'relative', width: PILL_W, height: PILL_H,
      borderRadius: PILL_H / 2, cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
      border: `1.5px solid ${isDark ? alpha(GREEN, 0.35) : alpha('#CBD5E1', 0.9)}`,
      background: isDark ? 'linear-gradient(135deg,#0F172A 0%,#1E293B 100%)' : 'linear-gradient(135deg,#ffffff 0%,#F1F5F9 100%)',
      boxShadow: isDark ? `0 0 12px ${alpha(GREEN, 0.22)},inset 0 1px 0 ${alpha('#fff', 0.04)}` : `0 1px 6px ${alpha('#94A3B8', 0.3)},inset 0 1px 0 rgba(255,255,255,0.9)`,
      transition: 'background 0.35s,border-color 0.35s,box-shadow 0.35s',
      '&:hover': {
        boxShadow: isDark ? `0 0 20px ${alpha(GREEN, 0.38)}` : `0 2px 10px ${alpha('#94A3B8', 0.45)}`,
        border: isDark ? `1.5px solid ${alpha(GREEN, 0.6)}` : `1.5px solid ${alpha('#94A3B8', 0.7)}`,
      },
    }}>
      <Box sx={{
        position: 'absolute', top: 0, bottom: 0,
        ...(isDark ? { left: THUMB_PAD + 3, right: THUMB_D + THUMB_PAD * 2 } : { left: THUMB_D + THUMB_PAD * 2, right: THUMB_PAD + 3 }),
        display: 'flex', alignItems: 'center', justifyContent: isDark ? 'flex-start' : 'flex-end',
        pointerEvents: 'none', overflow: 'hidden',
      }}>
        <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.9, textTransform: 'uppercase', lineHeight: 1, color: isDark ? alpha(GREEN, 0.85) : alpha('#64748B', 0.9), transition: 'color 0.3s' }}>
          {isDark ? 'DARK' : 'LIGHT'}
        </Typography>
      </Box>
      <motion.div
        animate={{ x: isDark ? THUMB_TRAVEL : 0 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34 }}
        style={{ position: 'absolute', top: THUMB_PAD, left: THUMB_PAD, width: THUMB_D, height: THUMB_D, borderRadius: '50%', zIndex: 1, background: isDark ? `linear-gradient(135deg,${GREEN} 0%,${GREEN_DIM} 100%)` : 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)', boxShadow: isDark ? `0 2px 8px ${alpha(GREEN, 0.55)}` : `0 2px 8px ${alpha('#F59E0B', 0.55)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div animate={{ rotate: isDark ? 0 : 20 }} transition={{ duration: 0.4, ease: 'easeOut' }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isDark ? <DarkIcon sx={{ fontSize: 13, color: '#fff' }} /> : <LightIcon sx={{ fontSize: 13, color: '#fff' }} />}
        </motion.div>
      </motion.div>
    </Box>
  );
}

function LoadingSplash({ visible }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <AnimatePresence>
      {visible && (
        <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, background: isDark ? 'linear-gradient(135deg,#0F172A 0%,#1E293B 100%)' : 'linear-gradient(135deg,#EFF6FF 0%,#F8FAFC 100%)' }}
        >
          <motion.div initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}>
            <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <Box component="img" src="/okra-delivery-logo-transparent.png" alt="OkraRides" sx={{ width: 110, height: 110, objectFit: 'contain' }} />
            </motion.div>
          </motion.div>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], y: [0, -5, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
              </motion.div>
            ))}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RenderThemeToggle({ isDark }) {
  const { toggleTheme } = useThemeMode();
  return <ThemeToggle isDark={isDark} onToggle={toggleTheme} />;
}

// ── Outer shell — just provides context ───────────────────────────────────
export default function AuthLayoutClient({ children }) {
  return (
    <ContextProviders>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </ContextProviders>
  );
}

// ── Inner — all theme hooks run INSIDE ContextProviders/ThemeProvider ──────
function AuthLayoutInner({ children }) {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const router   = useRouter();
  const [landingPageUrl, setLandingPageUrl] = useState(null);
  const [splashVisible,  setSplashVisible]  = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    import('@/lib/api/client').then(({ apiClient }) => {
      apiClient.get('/frontend-url').then(res => {
        const url = res?.data?.paths?.['okra-frontend-app'];
        if (url) setLandingPageUrl(url);
      }).catch(() => {});
    });
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <AppBar position="static" elevation={0} sx={{
        background: isDark ? 'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)' : 'linear-gradient(135deg,#ffffff 0%,#F8FAFC 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: isDark ? `1px solid ${alpha(GREEN, 0.12)}` : `1px solid ${alpha('#CBD5E1', 0.7)}`,
        boxShadow: isDark ? `0 1px 0 ${alpha(GREEN, 0.08)}` : `0 1px 8px ${alpha('#94A3B8', 0.15)}`,
        transition: 'background 0.35s',
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 1 }}>
          <AnimatedHeaderButton label="APPS" direction="left" icon={<AppsIcon size={22} color={GREEN} />} onClick={() => { if (landingPageUrl) router.push(landingPageUrl); }} />
          <RenderThemeToggle isDark={isDark} />
          <AnimatedHeaderButton label="HELP" direction="right" icon={<HelpSvgIcon size={22} color={GREEN} />} onClick={() => router.push('/help')} />
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm">
        {children}
        <LoadingSplash visible={splashVisible} />
      </Container>
    </Box>
  );
}