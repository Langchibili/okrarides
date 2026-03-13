'use client'

import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import '@/styles/google-maps-fix.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { AdminSettingsProvider } from '@/lib/hooks/useAdminSettings';
import { SocketProvider } from '@/lib/socket/SocketProvider';
import { ReactNativeWrapper } from '@/lib/contexts/ReactNativeWrapper';
import { MapsProvider } from '@/components/APIProviders/MapsProvider';
import { ScreenshotProvider }     from '@/lib/contexts/ScreenshotContext';
import { FloatingCaptureButton }  from '@/components/FloatingCaptureButton';
import { Box, Typography }  from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useState } from 'react';

// we are getting the native code wrapper here because we are using it as a hook inside the layout file for main pages or authenticated pages

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
  adjustFontFallback: true,
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['600', '700', '800'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
  adjustFontFallback: true,
})


// ── Splash overlay — renders ABOVE the app, app loads behind it ──────────────
function LoadingSplash({ visible }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            background: isDark
              ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
              : 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)',
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Box
                component="img"
                src="/okra-rides-logo-transparent.png"
                alt="OkraRides"
                sx={{
                  width: 110,
                  height: 110,
                  objectFit: 'contain',
                  filter: isDark ? 'brightness(1)' : 'none',
                  // Subtle glow matching your brand green
                  dropShadow: `drop-shadow(0 0 24px rgba(16,185,129,0.38))`,
                }}
              />
            </motion.div>
          </motion.div>

          {/* Dots */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2], y: [0, -5, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
              </motion.div>
            ))}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function RootLayout({ children }) {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ThemeProvider>
          <ReactNativeWrapper>
            <AdminSettingsProvider>
              <AuthProvider>
                 <ScreenshotProvider>
                  <SocketProvider>
                    <MapsProvider>
                      {children}            {/* ← loads immediately in the background */}
                      <LoadingSplash visible={splashVisible} />   {/* ← overlays for 800ms then fades */}
                    </MapsProvider>
                  </SocketProvider>
                    <FloatingCaptureButton />
                  </ScreenshotProvider>
              </AuthProvider>
            </AdminSettingsProvider>
          </ReactNativeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}