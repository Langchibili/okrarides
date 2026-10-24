'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminClient } from '@/lib/api/adminClient';

const AuthContext = createContext(null);

function unwrap(payload) {
  return payload?.data ?? payload?.user ?? payload;
}

export function getAdminHomePath(user) {
  const roleCodes = (Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [])
    .map(role => String(role?.code || role?.name || '').toLowerCase().replace(/\s+/g, '_'));
  if (
    user?.isSuperAdmin
    || roleCodes.some(code => ['super_admin', 'strapi_super_admin', 'strapi-super-admin'].includes(code))
  ) {
    return '/dashboard';
  }

  const permissions = new Set((Array.isArray(user?.permissions) ? user.permissions : [])
    .map(permission => typeof permission === 'string' ? permission : permission.code || permission.action)
    .filter(Boolean));
  const canView = category => [
    `${category}.view`,
    `admn.${category}.view`,
    `${category}_view`,
    category,
  ].some(permission => permissions.has(permission))
    || [`${category}.manage`, `admn.${category}.manage`, `${category}_manage`]
      .some(permission => permissions.has(permission));

  if (canView('dashboard')) return '/dashboard';

  return [
    ['drivers', '/drivers'],
    ['riders', '/riders'],
    ['deliveries', '/deliveries'],
    ['rides', '/rides'],
    ['users', '/users'],
    ['partners', '/partners'],
    ['finance', '/finance'],
    ['affiliates', '/affiliates'],
    ['countries', '/countries'],
    ['settings', '/settings'],
  ].find(([category]) => canView(category))?.[1] || '/dashboard';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!adminClient.hasToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const current = unwrap(await adminClient.get('/me'));
      if (
        !current
        || typeof current !== 'object'
        || !current.id
        || typeof current.email !== 'string'
        || !Array.isArray(current.roles)
        || !Array.isArray(current.permissions)
      ) {
        throw new Error('The Admin API did not return a valid administrator profile. Confirm the admn backend routes are built and available.');
      }
      setUser(current);
      return current;
    } catch (error) {
      adminClient.logout();
      setUser(null);
      if (error.status !== 401 && error.status !== 403) throw error;
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().catch(error => {
      console.error('Failed to load the current admin user', error);
    });
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    await adminClient.login(email, password);
    setLoading(true);
    try {
      const current = await refreshUser();
      if (!current) throw new Error('Your admin account could not be loaded');
      return current;
    } catch (error) {
      adminClient.logout();
      setUser(null);
      throw error;
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    adminClient.logout();
    setUser(null);
  }, []);

  const roleCodes = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
    return roles.map(role => String(role?.code || role?.name || '').toLowerCase().replace(/\s+/g, '_'));
  }, [user]);
  const isSuperAdmin = Boolean(user?.isSuperAdmin || roleCodes.includes('super_admin') || roleCodes.includes('strapi_super_admin') || roleCodes.includes('strapi-super-admin'));
  const grantedPermissions = useMemo(() => {
    const permissions = user?.permissions;
    if (Array.isArray(permissions)) {
      return new Set(permissions.map(permission => typeof permission === 'string' ? permission : permission.code));
    }
    return new Set();
  }, [user]);

  const hasPermission = useCallback((category, action = 'view') => {
    if (isSuperAdmin) return true;
    const candidates = [
      `${category}_${action}`,
      `${category}_manage`,
      `${category}.${action}`,
      `${category}.manage`,
      `admn.${category}.${action}`,
      `admn.${category}.manage`,
    ];
    return candidates.some(permission => grantedPermissions.has(permission))
      || (action === 'view' && grantedPermissions.has(category));
  }, [grantedPermissions, isSuperAdmin]);

  const canWrite = useCallback(category => (
    hasPermission(category, 'create')
    || hasPermission(category, 'update')
    || hasPermission(category, 'manage')
  ), [hasPermission]);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    isSuperAdmin,
    adminType: user?.adminType || user?.roles?.[0]?.name || user?.role?.name || 'Admin',
    hasPermission,
    canWrite,
    login,
    logout,
    refreshUser,
  }), [user, loading, isSuperAdmin, hasPermission, canWrite, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function AuthGate({ children }) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        <span className="loading-mark">OR</span>
        <span>Loading your admin workspace…</span>
      </div>
    );
  }
  return children;
}
