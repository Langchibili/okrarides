'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGate, useAuth } from '@/lib/auth';
import Sidebar from '@/components/admin/Sidebar';

const PAGE_PERMISSIONS = [
  ['/admin-users', 'superAdmin'],
  ['/permissions', 'superAdmin'],
  ['/otp-verifications', 'superAdmin'],
  ['/partners', 'partners'],
  ['/drivers', 'drivers'],
  ['/deliverers', 'drivers'],
  ['/riders', 'riders'],
  ['/users', 'users'],
  ['/countries', 'countries'],
  ['/currencies', 'currencies'],
  ['/settings', 'settings'],
  ['/ride-classes', 'rides'],
  ['/delivery-classes', 'deliveries'],
  ['/taxi-types', 'rides'],
  ['/surge-pricing', 'settings'],
  ['/promo-codes', 'settings'],
  ['/cancellation-reasons', 'settings'],
  ['/geofence-zones', 'countries'],
  ['/translations', 'settings'],
  ['/rides', 'rides'],
  ['/deliveries', 'deliveries'],
  ['/packages', 'deliveries'],
  ['/vehicles', 'vehicles'],
  ['/subscriptions', 'subscriptions'],
  ['/subscription-plans', 'subscriptions'],
  ['/finance', 'finance'],
  ['/float-topups', 'finance'],
  ['/withdrawals', 'finance'],
  ['/okrapay', 'finance'],
  ['/ledger', 'finance'],
  ['/transactions', 'finance'],
  ['/commission-tiers', 'finance'],
  ['/payment-methods', 'finance'],
  ['/driver-subscriptions', 'subscriptions'],
  ['/affiliates', 'affiliates'],
  ['/affiliate-points-allocation-rules', 'affiliates'],
  ['/affiliate-', 'affiliates'],
  ['/support', 'support'],
  ['/notifications', 'notifications'],
  ['/reports', 'reports'],
  ['/audit-logs', 'audit'],
  ['/affiliate-impressions', 'affiliates'],
  ['/bus-routes', 'settings'],
  ['/bus-stations', 'settings'],
  ['/ratings', 'rides'],
];

export default function AdminShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, adminType, isSuperAdmin, hasPermission } = useAuth();
  const pagePermission = PAGE_PERMISSIONS.find(([path]) => pathname === path || pathname.startsWith(path))?.[1];
  let hasPageAccess = true;
  if (pagePermission === 'superAdmin') hasPageAccess = isSuperAdmin;
  else if (pagePermission) hasPageAccess = hasPermission(pagePermission);

  return (
    <AuthGate>
      <div className="admin-shell">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="admin-main">
          <header className="mobile-topbar">
            <button type="button" className="icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button>
            <span>OkraRides</span>
            <span className="mobile-role">{adminType}</span>
          </header>
          <div className="admin-content">
            <div className="workspace-heading">
              <div>
                <p className="eyebrow">ADMINISTRATION</p>
                <h2>OkraRides platform</h2>
              </div>
              <div className="workspace-user">
                <span className="online-indicator" />
                <span>{user?.firstname || user?.firstName || user?.email || 'Administrator'}</span>
              </div>
            </div>
            {hasPageAccess ? children : (
              <section className="access-denied" role="alert">
                <h1>Access denied</h1>
                <p>Your Strapi Admin role does not grant access to this section.</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
