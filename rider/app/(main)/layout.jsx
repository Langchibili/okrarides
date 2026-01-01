'use client';

import { Box } from '@mui/material';
import { BottomNav } from '@/components/Layout/BottomNav';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter,usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useThemeMode } from '@/components/ThemeProvider';

export default function MainLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useThemeMode();

  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);
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

