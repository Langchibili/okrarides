// // PATH: app/(main)/layout.jsx
// 'use client';

// import { Box, CircularProgress, Typography } from '@mui/material';
// import { alpha, useTheme }   from '@mui/material/styles';
// import { motion }            from 'framer-motion';
// import { BottomNav }         from '@/components/Layout/BottomNav';
// import { useAuth }           from '@/lib/hooks/useAuth';
// import { useEffect, useState } from 'react';
// import { useRouter }         from 'next/navigation';
// import { useReactNative }    from '@/lib/contexts/ReactNativeWrapper';
// import { useRide }           from '@/lib/hooks/useRide';
// import { apiClient }         from '@/lib/api/client';

// // ── Shared scrollbar-hide style ───────────────────────────────────────────────
// export const hideScrollbar = {
//   scrollbarWidth: 'none',
//   '&::-webkit-scrollbar': { display: 'none' },
// };

// // ── Full-screen loading splash ────────────────────────────────────────────────
// function LoadingSplash() {
//   const theme  = useTheme();
//   const isDark = theme.palette.mode === 'dark';

//   return (
//     <Box sx={{
//       minHeight: '100vh',
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       justifyContent: 'center',
//       gap: 3,
//       background: isDark
//         ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
//         : 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)',
//     }}>
//       {/* Pulsing logo ring */}
//       <motion.div
//         animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
//         transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
//       >
//         <Box sx={{
//           width: 72, height: 72, borderRadius: '50%',
//           background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           boxShadow: '0 0 40px rgba(16,185,129,0.35)',
//         }}>
//           <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
//             O
//           </Typography>
//         </Box>
//       </motion.div>

//       <Box sx={{ textAlign: 'center' }}>
//         <Typography variant="h6" sx={{
//           fontWeight: 700, mb: 0.5,
//           background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
//           WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
//         }}>
//           OkraRides
//         </Typography>
//         <Typography variant="caption" color="text.secondary">Setting things up…</Typography>
//       </Box>

//       <Box sx={{ display: 'flex', gap: 0.75 }}>
//         {[0, 1, 2].map(i => (
//           <motion.div key={i}
//             animate={{ opacity: [0.2, 1, 0.2], y: [0, -5, 0] }}
//             transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
//           >
//             <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
//           </motion.div>
//         ))}
//       </Box>
//     </Box>
//   );
// }

// export default function MainLayout({ children }) {
//   const { user, loading, isAuthenticated } = useAuth();
//   const router = useRouter();
//   const [checkingAuth, setCheckingAuth] = useState(true);
//   const { isNative, servicesInitialized, initializeNativeServices } = useReactNative();
//   const { currentRide } = useRide();

//   useEffect(() => {
//     const initializeNativeCode = async () => {
//       if (isNative && !servicesInitialized && user?.id) {
//         console.log('🔧 Initializing native services for driver…');
//         const result = await initializeNativeServices(
//           user.id,
//           'driver',
//           process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
//         );

//         if (window.ReactNativeWebView || result.success) {
//           if (typeof window !== 'undefined' && window.ReactNativeWebView) {
//             window.ReactNativeWebView.postMessage(JSON.stringify({
//               type: 'GET_CURRENT_LOCATION',
//               requestId: `init_loc_${Date.now()}`
//             }));

//             const handleLocationUpdate = (event) => {
//               try {
//                 const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
//                 if (data.type === 'LOCATION_UPDATE' && data.payload) {
//                   const { lat, lng } = data.payload;
//                   apiClient.post('/driver/update-location', { location: { lat, lng } })
//                     .catch(err => console.error('Location update error:', err));
//                   window.removeEventListener('message', handleLocationUpdate);
//                 }
//               } catch (e) { console.error('Location response parse error:', e); }
//             };

//             window.addEventListener('message', handleLocationUpdate);
//             setTimeout(() => window.removeEventListener('message', handleLocationUpdate), 10000);
//           } else if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//               (position) => {
//                 apiClient.post('/driver/update-location', {
//                   location: { lat: position.coords.latitude, lng: position.coords.longitude }
//                 }).catch(err => console.error('Location update error:', err));
//               },
//               (error) => console.error('Geolocation error:', error)
//             );
//           }
//           console.log('✅ Native services initialized successfully');
//         } else {
//           console.error('❌ Failed to initialize native services:', result.error);
//         }
//       }
//     };

//     if (!loading) {
//       if (!isAuthenticated()) {
//         router.push('/login');
//       } else {
//         setCheckingAuth(false);
//         initializeNativeCode();
//       }
//     }
//   }, [user, loading, isAuthenticated, router]);

//   // ── Redirect for active rides ─────────────────────────────────────────────
//   useEffect(() => {
//     if (currentRide) {
//       const { rideStatus, id } = currentRide;
//       if (['accepted', 'arrived', 'passenger_onboard', 'completed'].includes(rideStatus)) {
//         router.push(`/active-ride/${id}`);
//       }
//     }
//   }, [currentRide, router]);

//   if (loading || checkingAuth) return <LoadingSplash />;

//   return (
//     <Box sx={{
//       minHeight: '100vh',
//       pb: '68px',            // nav height + safe area
//       bgcolor: 'background.default',
//       overflowX: 'hidden',
//     }}>
//       {children}
//       <BottomNav />
//     </Box>
//   );
// }
// PATH: app/(main)/layout.jsx
'use client';

import { Box, Typography }  from '@mui/material';
import { useTheme }         from '@mui/material/styles';
import { motion }           from 'framer-motion';
import { BottomNav }        from '@/components/Layout/BottomNav';
import { useAuth }          from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter }        from 'next/navigation';
import { useReactNative }   from '@/lib/contexts/ReactNativeWrapper';
import { useRide }          from '@/lib/hooks/useRide';
import { apiClient }        from '@/lib/api/client';

function LoadingSplash() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 3,
      background: isDark
        ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
        : 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)',
    }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Box sx={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(16,185,129,0.35)',
        }}>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>O</Typography>
        </Box>
      </motion.div>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{
          fontWeight: 700, mb: 0.5,
          background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>OkraRides</Typography>
        <Typography variant="caption" color="text.secondary">Setting things up…</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -5, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
          </motion.div>
        ))}
      </Box>
    </Box>
  );
}

export default function MainLayout({ children }) {
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
    if (currentRide) {
      const { rideStatus, id } = currentRide;
      if (['accepted', 'arrived', 'passenger_onboard', 'completed'].includes(rideStatus)) {
        router.push(`/active-ride/${id}`);
      }
    }
  }, [currentRide, router]);

  if (loading || checkingAuth) return <LoadingSplash />;

  return (
    <Box sx={{ minHeight: '100vh', pb: '68px', bgcolor: 'background.default', overflowX: 'hidden' }}>
      {children}
      <BottomNav />
    </Box>
  );
}