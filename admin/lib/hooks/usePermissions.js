// lib/hooks/usePermissions.js
'use client';
import { useEffect, useState } from 'react';
import { adminClient } from '@/lib/api/adminClient';

const PERMISSION_CATEGORIES = [
  'users','drivers','riders','rides','vehicles',
  'subscriptions','finance','settings','reports','support',
  'affiliates','deliveries','notifications','audit',
]

export function usePermissions() {
  const [permissions, setPermissions] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminClient.get('/users/me?populate=adminPermissions')
      .then(user => {
        setAdminUser(user);
        // Build a set of granted permission codes
        const granted = new Set(
          (user?.adminPermissions || []).map(p => p.code)
        );
        setPermissions({ granted, adminType: user?.adminType });
      })
      .catch(() => setPermissions({ granted: new Set(), adminType: 'noRole' }))
      .finally(() => setLoading(false));
  }, []);

  function can(category, action = 'view') {
    if (!permissions) return false;
    const { adminType, granted } = permissions;
    if (adminType === 'super_admin') return true;
    return granted.has(`${category}_${action}`) || granted.has(`${category}_manage`);
  }

  function canAny(...categories) {
    return categories.some(c => can(c));
  }

  return { can, canAny, adminUser, adminType: permissions?.adminType, loading };
}

export default usePermissions;