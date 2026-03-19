'use client';

import { Box }  from '@mui/material';
import { BottomNav }        from '@/components/Layout/BottomNav';
import { useAuth }          from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter }        from 'next/navigation';
import { useReactNative }   from '@/lib/contexts/ReactNativeWrapper';
import { useRide }          from '@/lib/hooks/useRide';
import { apiClient }        from '@/lib/api/client';
import HomePageSkeleton from '@/components/Skeletons/HomePageSkeleton';
import { useThemeMode } from '@/components/ThemeProvider';

export default function MainLayout({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { isNative, servicesInitialized, initializeNativeServices } = useReactNative();
  const { currentRide } = useRide();
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
        const result = await initializeNativeServices(
          user.id, 'driver', process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
        );
        if (window.ReactNativeWebView || result.success) {
          if (typeof window !== 'undefined' && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'GET_CURRENT_LOCATION', requestId: `init_loc_${Date.now()}`,
            }));
            const handleLocationUpdate = (event) => {
              try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data.type === 'LOCATION_UPDATE' && data.payload) {
                  const { lat, lng } = data.payload;
                  apiClient.post('/driver/update-location', { location: { lat, lng } })
                    .catch(err => console.error('Location update error:', err));
                  window.removeEventListener('message', handleLocationUpdate);
                }
              } catch (e) { console.error('Location response parse error:', e); }
            };
            window.addEventListener('message', handleLocationUpdate);
            setTimeout(() => window.removeEventListener('message', handleLocationUpdate), 10000);
          } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              ({ coords }) => apiClient.post('/driver/update-location', {
                location: { lat: coords.latitude, lng: coords.longitude },
              }).catch(console.error),
              console.error
            );
          }
        }
      }
   }

    if (!loading) {
      if (!isAuthenticated()) {
        router.push('/login');
      } else {
        setCheckingAuth(false);
        initializeNativeCode();
      }
    }
  }, [user, loading, isAuthenticated, router])

  useEffect(() => {
    if (!loading) setCheckingAuth(false);
  }, [loading])

  useEffect(()=>{
    // Set different colours for each mode
    setAccentColor('#FFFFFF', 'orange')
  },[])

  useEffect(() => {
    if (isAuthenticated && currentRide) {
      const { rideStatus, id } = currentRide;
      if (['accepted', 'arrived', 'passenger_onboard', 'completed'].includes(rideStatus)) {
        router.push(`/active-ride/${id}`);
      }
    }
  }, [currentRide, router, isAuthenticated])

  if(loading || checkingAuth) {
    return <HomePageSkeleton/>
  }
  
  if (loading || checkingAuth) return <LoadingSplash visible />;
  return (
    <Box sx={{ minHeight: '100vh', pb: '68px', bgcolor: 'background.default', overflowX: 'hidden' }}>
      {children}
      <BottomNav />
    </Box>
  );
}