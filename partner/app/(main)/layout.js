// // PATH: applayout.js
// 'use client';
// import { useEffect, useState, useCallback } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { Box, CircularProgress, Typography } from '@mui/material';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { usePartner } from '@/lib/hooks/usePartner';
// import Sidebar from '@/componentsSidebar';
// import { PartnerSocketProvider } from '@/lib/socket/PartnerSocketProvider';
// import { getFleetLocations } from '@/lib/api/partner';

// function PartnerLayoutInner({ children }) {
//   const { user, loading } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();
//   const { dashboard, refreshDashboard } = usePartner();
//   const [fleetDriverIds, setFleetDriverIds] = useState([]);
//   const [connected, setConnected] = useState(true);

//   useEffect(() => {
//     if (loading) return;
//     if (!user) { router.push('/login'); return; }
//     const status = user?.partnerProfile?.verificationStatus;
//     if (!status) { router.push('/register'); return; }
//     if (status !== 'approved' && pathname !== 'pending') {
//       router.push('pending');
//     }
//   }, [user, loading, router, pathname]);

//   useEffect(() => {
//     if (dashboard?.fleet) {
//       // extract fleet driver IDs if available from drivers list separately
//     }
//   }, [dashboard]);

//   const handleReconnect = useCallback(async () => {
//     refreshDashboard?.();
//     try {
//       await getFleetLocations();
//     } catch { }
//   }, [refreshDashboard]);

//   if (loading) {
//     return (
//       <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
//         <Box sx={{ textAlign: 'center' }}>
//           <CircularProgress sx={{ color: '#10B981' }} />
//           <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
//             Loading partner dashboard…
//           </Typography>
//         </Box>
//       </Box>
//     );
//   }

//   if (!user?.partnerProfile || user.partnerProfile.verificationStatus !== 'approved') {
//     return <>{children}</>;
//   }

//   return (
//     <PartnerSocketProvider fleetDriverIds={fleetDriverIds} onReconnect={handleReconnect}>
//       <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
//         <Sidebar />
//         <Box sx={{ flex: 1, ml: { xs: 0, md: '260px' }, display: 'flex', flexDirection: 'column' }}>
//           {children}
//         </Box>
//       </Box>
//     </PartnerSocketProvider>
//   )
// }

// export default function PartnerLayout({ children }) {
//   return <PartnerLayoutInner>{children}</PartnerLayoutInner>;
// }
'use client';
// PATH: applayout.js

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePartner } from '@/lib/hooks/usePartner';
import Sidebar from '@/components/partner/Sidebar';
import { PartnerSocketProvider } from '@/lib/socket/PartnerSocketProvider';
import { getFleetLocations } from '@/lib/api/partner';

function PartnerLayoutInner({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { dashboard, refreshDashboard } = usePartner();
  const [fleetDriverIds, setFleetDriverIds] = useState([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    const status = user?.partnerProfile?.verificationStatus;
    if (!status) { router.push('/register'); return; }
    if (status !== 'approved' && pathname !== 'pending') {
      router.push('pending');
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    if (dashboard?.fleet) {
      // populate fleetDriverIds from fleet list if needed
    }
  }, [dashboard]);

  const handleReconnect = useCallback(async () => {
    refreshDashboard?.();
    try { await getFleetLocations(); } catch { }
  }, [refreshDashboard]);

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#10B981' }} />
          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            Loading partner dashboard…
          </Typography>
        </Box>
      </Box>
    );
  }

  const isApproved = user?.partnerProfile?.verificationStatus === 'approved';

  // PartnerSocketProvider always wraps children so every page inside this
  // layout can safely call usePartnerSocketContext() without throwing.
  return (
    <PartnerSocketProvider fleetDriverIds={fleetDriverIds} onReconnect={handleReconnect}>
      {isApproved ? (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
          <Sidebar />
          <Box sx={{ flex: 1, ml: { xs: 0, md: '260px' }, display: 'flex', flexDirection: 'column' }}>
            {children}
          </Box>
        </Box>
      ) : (
        // Pending / unapproved state — no sidebar, but provider is still present
        <>{children}</>
      )}
    </PartnerSocketProvider>
  );
}

export default function PartnerLayout({ children }) {
  return <PartnerLayoutInner>{children}</PartnerLayoutInner>;
}