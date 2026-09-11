'use client';
// PATH: delivery-driver/app/(main)/DeliveryMainLayoutClient.jsx

import { Box } from '@mui/material';
import { BottomNav } from '@/components/Layout/BottomNav';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDelivery } from '@/lib/hooks/useDelivery';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { apiClient } from '@/lib/api/client';
import { useThemeMode } from '@/components/ThemeProvider';
import ContextProviders from '@/lib/contexts/ContextProviders';

export default function DeliveryMainLayoutClient ({ children }) {
   return (
        <ContextProviders>
                     <RenderMainLayout children={children}/>           {/* ← loads immediately in the background */}
          </ContextProviders>
   )
}

const RenderMainLayout = ({children})=>{
  const { user, loading, isAuthenticated } = useAuth();
   const router   = useRouter();
  const pathname = usePathname();
  const { incomingDelivery: activeDelivery } = useDelivery();
  const { isNative, servicesInitialized, initializeNativeServices, startLocationTracking } = useReactNative();

  const { setAccentColor } = useThemeMode()
  // ── KEY FIX: same pattern — lazy init from `loading`
  const [checkingAuth, setCheckingAuth] = useState(() => loading);
  const [splashVisible, setSplashVisible] = useState(() => {
    // Only show splash if this is a fresh page load — not an in-app navigation
    if (typeof window === 'undefined') return false;
    const already = sessionStorage.getItem('okra_splash_shown');
    return !already;
  })

  useEffect(() => {
    if (!splashVisible) return;
    const t = setTimeout(() => {
      setSplashVisible(false);
      sessionStorage.setItem('okra_splash_shown', '1');
    }, 2500);
    return () => clearTimeout(t);
  }, [splashVisible])

 useEffect(() => {
    const initializeNativeCode = async () => {
      if (isNative && !servicesInitialized && user?.id) {
        console.log('🔧 Initializing native services for delivery driver...');
        const result = await initializeNativeServices(
          user.id,
          'delivery',   // ← must be 'delivery' so device socket joins correct room
          process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
        );

        if (window.ReactNativeWebView || result.success) {
          if (typeof window !== 'undefined' && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'GET_CURRENT_LOCATION',
              requestId: `init_loc_${Date.now()}`,
            }));

            const handleLocationUpdate = (event) => {
              try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data.type === 'LOCATION_UPDATE' && data.payload) {
                  const { lat, lng } = data.payload;
                  // ← correct endpoint for delivery driver
                  apiClient.post('/delivery-driver/update-location', { lat, lng })
                    .catch(err => console.error('Location update error:', err));
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
                  apiClient.post('/delivery-driver/update-location', {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  }).catch(err => console.error('Location update error:', err));
                },
                (error) => console.error('Geolocation error:', error)
              );
            }
          }
          console.log('✅ Native services initialized for delivery driver');
        } else {
          console.error('❌ Failed to initialize native services:', result.error);
        }
      }
      startLocationTracking()
    }

    if (!loading) {
      if (!isAuthenticated()) {
        router.push('/login');
      } else {
        initializeNativeCode();
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

   // Redirect if there's an active delivery in progress
  useEffect(() => {
    if (activeDelivery && isAuthenticated) {
      const { rideStatus, id } = activeDelivery;
      if (['accepted', 'arrived', 'passenger_onboard'].includes(rideStatus)) {
        router.push(`/active-delivery/${id}`);
      }
    }
  }, [activeDelivery, router, isAuthenticated]);

  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) jssStyles.parentElement?.removeChild(jssStyles);
    document.body.classList.remove('map-loaded', 'google-maps-initialized');
  }, [pathname]);

  // if(loading || checkingAuth) {
  //   return <HomePageSkeleton/>
  // }
  
  // if (loading || checkingAuth) return <LoadingSplash visible />;
  return (
    <Box sx={{ minHeight: '100vh', pb: '80px' }}>
      {children}
      <BottomNav userType="delivery" />
    </Box>
  )
}