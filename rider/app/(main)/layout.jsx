'use client';

import { Box } from '@mui/material';
import { BottomNav } from '@/components/Layout/BottomNav';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MainLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);
  
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
