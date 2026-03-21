'use client';
// PATH: rider/app/(main)/MainLayoutClient.jsx
// Full layout logic — moved here from layout.jsx so layout.jsx can be
// a Server Component and export const dynamic = 'force-dynamic'.

import { Box } from '@mui/material';
import { BottomNav } from '@/components/Layout/BottomNav';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useThemeMode } from '@/components/ThemeProvider';
import { useRide } from '@/lib/hooks/useRide';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { ridesAPI } from '@/lib/api/rides';
import ContextProviders from '@/lib/contexts/ContextProviders';

export default function MainLayoutClient({ children }) {
  return (
    <ContextProviders>
      <RenderMainLayout>{children}</RenderMainLayout>
    </ContextProviders>
  );
}

function RenderMainLayout({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { activeRide } = useRide();
  const theme = useThemeMode();
  const { isNative, servicesInitialized, initializeNativeServices } = useReactNative();

  useEffect(() => {
    const initializeNativeCode = async () => {
      if (isNative && !servicesInitialized && user?.id) {
        console.log('🔧 Initializing native services for rider...');
        const result = await initializeNativeServices(
          user.id,
          'rider',
          process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
        );

        if (window.ReactNativeWebView || result.success) {
          if (typeof window !== 'undefined') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'GET_CURRENT_LOCATION',
              requestId: `init_loc_${Date.now()}`,
            }));

            const handleLocationUpdate = (event) => {
              try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data.type === 'LOCATION_UPDATE' && data.payload) {
                  const { lat, lng } = data.payload;
                  import('@/lib/api/client').then(({ apiClient }) => {
                    apiClient.post('/driver/update-location', { location: { lat, lng } })
                      .catch(err => console.error('Location update error:', err));
                  });
                  window.removeEventListener('message', handleLocationUpdate);
                }
              } catch (e) {
                console.error('Location response parse error:', e);
              }
            };

            window.addEventListener('message', handleLocationUpdate);
            setTimeout(() => window.removeEventListener('message', handleLocationUpdate), 10000);
          } else {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  import('@/lib/api/client').then(({ apiClient }) => {
                    apiClient.post('/driver/update-location', {
                      location: { lat: position.coords.latitude, lng: position.coords.longitude },
                    }).catch(err => console.error('Location update error:', err));
                  });
                },
                (error) => console.error('Geolocation error:', error)
              );
            }
          }
          console.log('✅ Native services initialized successfully');
        } else {
          console.error('❌ Failed to initialize native services:', result.error);
        }
      }
    };

    if (!loading) {
      if (!isAuthenticated()) {
        router.push('/login');
      } else {
        ridesAPI.cleanTempBlocks();
        initializeNativeCode();
      }
    }
  }, [user, loading, isAuthenticated, router]);

  useEffect(() => {
    if (activeRide && isAuthenticated) {
      const { rideStatus, id } = activeRide;
      if (rideStatus === 'pending') {
        router.push(`/finding-driver?rideId=${id}`);
      } else if (['accepted', 'arrived', 'passenger_onboard'].includes(rideStatus)) {
        router.push(`/tracking?rideId=${id}`);
      } else if (rideStatus === 'completed') {
        router.push(`/trip-summary?rideId=${id}`);
      }
    }
  }, [activeRide, router, isAuthenticated]);

  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) jssStyles.parentElement?.removeChild(jssStyles);
    document.body.classList.remove('map-loaded', 'google-maps-initialized');
  }, [pathname]);

  if (loading || !isAuthenticated()) return null;

  return (
    <Box sx={{ minHeight: '100vh', pb: '80px' }}>
      {children}
      <BottomNav userType="rider" />
    </Box>
  );
}