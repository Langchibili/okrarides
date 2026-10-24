'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Modal } from '@/components/UI';

const NAV = [
  { group: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: '▦', permission: 'dashboard' },
  ] },
  { group: 'People', items: [
    { href: '/users', label: 'All Users', icon: '◉', permission: 'users' },
    { href: '/riders', label: 'Riders', icon: '◎', permission: 'riders' },
    { href: '/drivers', label: 'Drivers', icon: '⌁', permission: 'drivers' },
    { href: '/deliverers', label: 'Deliverers', icon: '▣', permission: 'drivers' },
    { href: '/admin-users', label: 'Admin Users', icon: '♙', superAdminOnly: true },
  ] },
  { group: 'Operations', items: [
    { href: '/partners', label: 'Partners', icon: '◇', permission: 'partners' },
    { href: '/rides', label: 'Rides', icon: '↗', permission: 'rides' },
    { href: '/deliveries', label: 'Deliveries', icon: '▣', permission: 'deliveries' },
    { href: '/packages', label: 'Packages', icon: '▤', permission: 'deliveries' },
    { href: '/vehicles', label: 'Vehicles', icon: '▱', permission: 'vehicles' },
  ] },
  { group: 'Finance', items: [
    { href: '/finance', label: 'Finance overview', icon: '◈', permission: 'finance' },
    { href: '/float-topups', label: 'Float top-ups', icon: '＋', permission: 'finance' },
    { href: '/withdrawals', label: 'Withdrawals', icon: '⇵', permission: 'finance' },
    { href: '/okrapay', label: 'OkraPay', icon: '◌', permission: 'finance' },
    { href: '/ledger', label: 'Ledger', icon: '▤', permission: 'finance' },
    { href: '/transactions', label: 'Transactions', icon: '⇄', permission: 'finance' },
  ] },
  { group: 'Subscriptions', items: [
    { href: '/subscriptions', label: 'Subscriptions', icon: '✦', permission: 'subscriptions' },
    { href: '/subscription-plans', label: 'Plans', icon: '▱', permission: 'subscriptions' },
  ] },
  { group: 'Affiliates', items: [
    { href: '/affiliates', label: 'Affiliates', icon: '⌘', permission: 'affiliates' },
    { href: '/affiliate-transactions', label: 'Affiliate transactions', icon: '↗', permission: 'affiliates' },
    { href: '/affiliate-points-allocation-rules', label: 'Referral allocation rules', icon: '✧', permission: 'affiliates' },
    { href: '/affiliate-points-types', label: 'Points rules', icon: '✧', permission: 'affiliates' },
    { href: '/affiliate-points-conversions', label: 'Conversion rates', icon: '⇄', permission: 'affiliates' },
  ] },
  { group: 'Platform settings', items: [
    { href: '/countries', label: 'Countries', icon: '◎', permission: 'countries' },
    { href: '/currencies', label: 'Currencies', icon: '◉', permission: 'currencies' },
    { href: '/settings', label: 'Admin settings', icon: '⚙', permission: 'settings' },
    { href: '/ride-classes', label: 'Ride classes', icon: '▱', permission: 'rides' },
    { href: '/delivery-classes', label: 'Delivery classes', icon: '▱', permission: 'deliveries' },
    { href: '/taxi-types', label: 'Taxi types', icon: '▱', permission: 'rides' },
    { href: '/geofence-zones', label: 'Geofences', icon: '⌖', permission: 'countries' },
    { href: '/translations', label: 'Translations', icon: '文', permission: 'settings' },
  ] },
  { group: 'Tools', items: [
    { href: '/support', label: 'Support', icon: '◌', permission: 'support' },
    { href: '/notifications', label: 'Notifications', icon: '◍', permission: 'notifications' },
    { href: '/reports', label: 'Reports', icon: '▥', permission: 'reports' },
    { href: '/audit-logs', label: 'Audit logs', icon: '⌕', permission: 'audit' },
    { href: '/otp-verifications', label: 'OTP verifications', icon: '⌕', superAdminOnly: true },
    { href: '/permissions', label: 'Roles & permissions', icon: '⚿', superAdminOnly: true },
  ] },
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, adminType, isSuperAdmin, logout, user } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const visibleItems = NAV.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.superAdminOnly) return isSuperAdmin;
      return !item.permission || hasPermission(item.permission);
    }),
  })).filter(group => group.items.length);

  function handleLogout() {
    logout();
    onClose();
    setConfirmLogout(false);
    router.replace('/login');
  }

  return (
    <>
      {mobileOpen && <button className="sidebar-backdrop" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">OR</div>
          <div className="brand-copy">
            <strong>OkraRides</strong>
            <span>Admin workspace</span>
          </div>
          <button className="sidebar-close" type="button" onClick={onClose} aria-label="Close navigation">×</button>
        </div>

        <div className="sidebar-profile">
          <span className="profile-avatar">
            {(user?.firstname || user?.firstName || user?.email || 'A').slice(0, 1).toUpperCase()}
          </span>
          <span className="profile-text">
            <strong>{user?.firstname || user?.firstName || user?.email || 'Administrator'}</strong>
            <span>{String(adminType || 'Admin').replace(/[_-]/g, ' ')}</span>
          </span>
          <span className="online-indicator" title="Signed in" />
        </div>

        <nav className="sidebar-navigation" aria-label="Admin navigation">
          {visibleItems.map(group => (
            <section className="sidebar-group" key={group.group}>
              <p>{group.group}</p>
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}
                    className={`sidebar-link ${active ? 'active' : ''}`}>
                    <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>
        <button type="button" className="sidebar-logout" onClick={() => setConfirmLogout(true)}>
          <span aria-hidden="true">↩</span> Sign out
        </button>
      </aside>
      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Sign out?">
        <p>Are you sure you want to end your admin session?</p>
        <div className="modal-actions">
          <button className="button button-secondary" type="button" onClick={() => setConfirmLogout(false)}>Cancel</button>
          <button className="button button-primary" type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </Modal>
    </>
  );
}
