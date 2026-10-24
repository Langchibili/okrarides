'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminHomePath, useAuth } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) router.replace(isAuthenticated ? getAdminHomePath(user) : '/login');
  }, [isAuthenticated, loading, router, user]);

  return (
    <div className="auth-loading" role="status" aria-live="polite">
      <span className="loading-mark">OR</span>
      <span>Loading your admin workspace…</span>
    </div>
  );
}
