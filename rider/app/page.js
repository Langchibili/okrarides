'use client';

import { Box, useTheme } from '@mui/material';
import { BottomNav } from '@/components/Layout/BottomNav';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useThemeMode } from '@/components/ThemeProvider';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { ridesAPI } from '@/lib/api/rides';
import HomePage from './(main)/home/page';
import { motion, AnimatePresence } from 'framer-motion';
import ContextProviders from '@/lib/contexts/ContextProviders';

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


const RenderHomePage = ()=>{
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { setAccentColor, setMode } = useThemeMode()
  const { isNative, servicesInitialized, initializeNativeServices } = useReactNative();
  const [checkingAuth, setCheckingAuth] = useState(() => loading)
  const [splashVisible, setSplashVisible] = useState(() => {
    // Only show splash if this is a fresh page load — not an in-app navigation
    if (typeof window === 'undefined') return false;
    const already = sessionStorage.getItem('okra_splash_shown');
    if(!already){
      setMode('light')
    }
    return !already;
  })
  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(()=>{
    if(typeof window !== "undefined"){
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('ref') || params.get('afcode');
      if (fromUrl) {
       localStorage.setItem('affiliateRef', fromUrl)
      }
    }
  },[])



  useEffect(() => {
    if (!splashVisible) return;
    const t = setTimeout(() => {
      setSplashVisible(false);
      sessionStorage.setItem('okra_splash_shown', '1');
    }, 2500);
    return () => clearTimeout(t);
  }, [splashVisible])

  // Redirect to login if not authenticated
   useEffect(() => {
    const initializeNativeCode = async () => {
      // ONLY NOW initialize native services (if in native environment, and user has authenticated)
      if (isNative && !servicesInitialized && user?.id) {
        console.log('🔧 Initializing native services for driver...');
        const result = await initializeNativeServices(
          user.id,
          'rider', // frontendName
          process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
        )
       
        if (window.ReactNativeWebView || result.success) {
            if (typeof window !== 'undefined') {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'GET_CURRENT_LOCATION',
                    requestId: `init_loc_${Date.now()}`
                }));

                // Listen for location response
                const handleLocationUpdate = (event) => {
                    try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (data.type === 'LOCATION_UPDATE' && data.payload) {
                        const { lat, lng } = data.payload;
                        // Update backend with location
                        apiClient.post('/driver/update-location', {
                        location: { lat, lng }
                        }).catch(err => console.error('Location update error:', err));
                        
                        window.removeEventListener('message', handleLocationUpdate);
                    }
                    } catch (e) {
                    console.error('Location response parse error:', e);
                    }
                };

                window.addEventListener('message', handleLocationUpdate);
                setTimeout(() => window.removeEventListener('message', handleLocationUpdate), 10000);
            } else {
            // Web fallback
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                (position) => {
                    apiClient.post('/driver/update-location', {
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                    }).catch(err => console.error('Location update error:', err));
                },
                (error) => console.error('Geolocation error:', error)
                );
            }
            }
            console.log('✅ Native services initialized successfully');
            } else {
            console.error('❌ Failed to initialize native services:', result.error);
            // Continue anyway - app should work in web mode
            }
      }
    }

    if (!loading) {
      if (!isAuthenticated()) {
        router.push('/login')
      } else {
        ridesAPI.cleanTempBlocks() // clears list of temporarily blocked off drivers due to ride declines, if driver was blocked off a long time ago
        initializeNativeCode() // initialize native code
      }
    }
  }, [user, loading, isAuthenticated, router]);

  useEffect(() => {
    if (!loading) setCheckingAuth(false);
  }, [loading])

  useEffect(()=>{
    // Set different colours for each mode
    setAccentColor('#FFFFFF', 'orange')
  },[])
  // ============================================
  // Redirect Logic for Active Rides
  // ============================================
 

  useEffect(() => {
    // Force MUI to re-evaluate styles on route change
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }

    // Reset any inline styles that might have been added by homepage
    document.body.classList.remove('map-loaded', 'google-maps-initialized');
  }, [pathname]);

  if (loading || checkingAuth) return <LoadingSplash visible />;
  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: '80px', // Space for bottom nav
        bgcolor: 'background.default', overflowX: 'hidden' 
      }}
    >
      <HomePage />
      <BottomNav userType="rider" />
      <LoadingSplash visible={splashVisible} />   {/* ← overlays for 800ms then fades */}
    </Box>
  )
}


export default function Home() {
       return <ContextProviders> <RenderHomePage/> </ContextProviders>               
}