'use client';

import { Box }  from '@mui/material';
import { BottomNav }        from '@/components/Layout/BottomNav';
import { useAuth }          from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter }        from 'next/navigation';
import  { useReactNative }   from '@/lib/contexts/ReactNativeWrapper';
import { useRide }          from '@/lib/hooks/useRide';
import { apiClient }        from '@/lib/api/client';
import HomePageSkeleton from '@/components/Skeletons/HomePageSkeleton';

export default function MainLayout({ children }) {
   return (
       <ContextProviders>
            <RenderMainLayout children={children}/>            {/* ← loads immediately in the background */}
        </ContextProviders>
   )
}

const RenderMainLayout = ({children})=>{
 const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { isNative, servicesInitialized, initializeNativeServices } = useReactNative();
  const { currentRide } = useRide();

  // ── KEY FIX: same pattern — lazy init from `loading`
  const [checkingAuth, setCheckingAuth] = useState(() => loading);

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
    };

    if (!loading) {
      if (!isAuthenticated()) {
        router.push('/login');
      } else {
        setCheckingAuth(false);
        initializeNativeCode();
      }
    }
  }, [user, loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && currentRide) {
      const { rideStatus, id } = currentRide;
      if (['accepted', 'arrived', 'passenger_onboard', 'completed'].includes(rideStatus)) {
        router.push(`/active-ride/${id}`);
      }
    }
  }, [currentRide, router, isAuthenticated])
  // if(loading || checkingAuth) {
  //   return <HomePageSkeleton/>
  // }
  return (
    <Box sx={{ minHeight: '100vh', pb: '68px', bgcolor: 'background.default', overflowX: 'hidden' }}>
      {children}
      <BottomNav />
    </Box>
  )
}