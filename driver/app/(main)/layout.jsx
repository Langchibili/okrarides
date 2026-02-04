//driver/app/(main)/layout.jsx
'use client';

import { Box } from '@mui/material';
import { BottomNav } from '@/components/Layout/BottomNav';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { useRide } from '@/lib/hooks/useRide';

export default function MainLayout({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { isNative, servicesInitialized, initializeNativeServices } = useReactNative();
  const { currentRide } = useRide();

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
        setCheckingAuth(false);
        initializeNativeCode() // initialize native code
      }
    }
  }, [user, loading, isAuthenticated, router]);

  // ============================================
  // Redirect Logic for Active Rides
  // ============================================
  useEffect(() => {
    if (currentRide) {
      const { rideStatus, id } = currentRide;

      if (['accepted', 'arrived', 'passenger_onboard'].includes(rideStatus)) {
        router.push(`/rides/${id}`);
      } else if (rideStatus === 'completed') {
        router.push(`/rides/${id}`);
      }
    }
  }, [currentRide, router]);

  if (loading || checkingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 10 }}>
      {children}
      <BottomNav />
    </Box>
  );
}
