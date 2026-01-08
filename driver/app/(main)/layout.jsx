'use client';

import { Box } from '@mui/material';
import { BottomNav } from '@/components/Layout/BottomNav';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MainLayout({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated()) {
        router.push('/login');
      } else {
        setCheckingAuth(false);
      }
    }
  }, [loading, isAuthenticated, router]);

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