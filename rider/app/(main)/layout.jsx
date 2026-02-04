//rider/app/(main)/layout.jsx
'use client';

import { Box } from '@mui/material';
import { BottomNav } from '@/components/Layout/BottomNav';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useThemeMode } from '@/components/ThemeProvider';
import { useRide } from '@/lib/hooks/useRide';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';

export default function MainLayout({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { activeRide } = useRide();
  const theme = useThemeMode();
  const { isNative, servicesInitialized, initializeNativeServices } = useReactNative();

  // Redirect to login if not authenticated
   useEffect(() => {
    const initializeNativeCode = async () => {
      // ONLY NOW initialize native services (if in native environment, and user has authenticated)
      if (isNative && !servicesInitialized && user?.id) {
        console.log('🔧 Initializing native services for driver...');
        const result = await initializeNativeServices(
          user.id,
          'driver', // frontendName
          process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
        );
       
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
        router.push('/login');
      } else {
        initializeNativeCode() // initialize native code
      }
    }
  }, [user, loading, isAuthenticated, router]);

  // ============================================
  // Redirect Logic for Active Rides
  // ============================================
  useEffect(() => {
    if (activeRide) {
      const { rideStatus, id } = activeRide;

      if (rideStatus === 'pending') {
        router.push(`/finding-driver?rideId=${id}`);
      } else if (['accepted', 'arrived', 'passenger_onboard'].includes(rideStatus)) {
        router.push(`/tracking?rideId=${id}`);
      } else if (rideStatus === 'completed') {
        router.push(`/trip-summary?rideId=${id}`);
      }
    }
  }, [activeRide, router]);

  useEffect(() => {
    // Force MUI to re-evaluate styles on route change
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }

    // Reset any inline styles that might have been added by homepage
    document.body.classList.remove('map-loaded', 'google-maps-initialized');
  }, [pathname]);

  // Show loading or nothing while checking auth
  if (loading || !isAuthenticated()) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: '80px', // Space for bottom nav
      }}
    >
      {children}
      <BottomNav userType="rider" />
    </Box>
  );
}