'use client';

import { useAuth } from '@/lib/auth';

export function usePermissions() {
  const { hasPermission, user, adminType, loading, isSuperAdmin } = useAuth();
  return {
    can: hasPermission,
    canAny: (...categories) => categories.some(category => hasPermission(category)),
    adminUser: user,
    adminType,
    loading,
    isSuperAdmin,
  };
}

export default usePermissions;
