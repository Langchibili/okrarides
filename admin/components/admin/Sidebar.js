// components/admin/Sidebar.js
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import usePermissions from '@/lib/hooks/usePermissions';

const NAV = [
  {
    group: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊', permission: null },
    ],
  },
  {
    group: 'People',
    items: [
      { href: '/users', label: 'All Users', icon: '👥', permission: 'users' },
      { href: '/riders', label: 'Riders', icon: '🧍', permission: 'riders' },
      { href: '/drivers', label: 'Drivers', icon: '🚕', permission: 'drivers' },
      { href: '/admin-users', label: 'Admin Users', icon: '🛡️', permission: 'users' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { href: '/rides', label: 'Rides', icon: '🚗', permission: 'rides' },
      { href: '/deliveries', label: 'Deliveries', icon: '📦', permission: 'deliveries' },
      { href: '/packages', label: 'Packages', icon: '🗃️', permission: 'deliveries' },
      { href: '/vehicles', label: 'Vehicles', icon: '🚙', permission: 'vehicles' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { href: '/finance', label: 'Finance Overview', icon: '💰', permission: 'finance' },
      { href: '/float-topups', label: 'Float Top-ups', icon: '💳', permission: 'finance' },
      { href: '/withdrawals', label: 'Withdrawals', icon: '🏧', permission: 'finance' },
      { href: '/okrapay', label: 'OkraPay Transactions', icon: '📲', permission: 'finance' },
      { href: '/ledger', label: 'Ledger', icon: '📋', permission: 'finance' },
    ],
  },
  {
    group: 'Subscriptions',
    items: [
      { href: '/subscriptions', label: 'Subscriptions', icon: '⭐', permission: 'subscriptions' },
      { href: '/subscription-plans', label: 'Plans', icon: '📄', permission: 'subscriptions' },
    ],
  },
  {
    group: 'Affiliates',
    items: [
      { href: '/affiliates', label: 'Affiliates', icon: '🤝', permission: 'affiliates' },
      { href: '/affiliate-transactions', label: 'AF Transactions', icon: '💸', permission: 'affiliates' },
      { href: '/affiliate-promotions', label: 'Promotions', icon: '🎁', permission: 'affiliates' },
      { href: '/affiliate-points-types', label: 'Points Rules', icon: '⚡', permission: 'affiliates' },
      { href: '/affiliate-points-conversions', label: 'Conversion Rates', icon: '🔄', permission: 'affiliates' },
    ],
  },
  {
    group: 'Pricing & Config',
    items: [
      { href: '/ride-classes', label: 'Ride Classes', icon: '🏷️', permission: 'settings' },
      { href: '/delivery-classes', label: 'Delivery Classes', icon: '🏷️', permission: 'settings' },
      { href: '/taxi-types', label: 'Taxi Types', icon: '🚐', permission: 'settings' },
      { href: '/commission-tiers', label: 'Commission Tiers', icon: '📐', permission: 'finance' },
      { href: '/surge-pricing', label: 'Surge Pricing', icon: '🔥', permission: 'settings' },
      { href: '/promo-codes', label: 'Promo Codes', icon: '🎟️', permission: 'settings' },
      { href: '/cancellation-reasons', label: 'Cancel Reasons', icon: '🚫', permission: 'settings' },
    ],
  },
  {
    group: 'Platform',
    items: [
      { href: '/countries', label: 'Countries', icon: '🌍', permission: 'settings' },
      { href: '/currencies', label: 'Currencies', icon: '💱', permission: 'settings' },
      { href: '/geofence-zones', label: 'Geofence Zones', icon: '🗺️', permission: 'settings' },
      { href: '/translations', label: 'Translations', icon: '🌐', permission: 'settings' },
      { href: '/settings', label: 'Admin Settings', icon: '⚙️', permission: 'settings' },
    ],
  },
  {
    group: 'More Finance',
    items: [
      { href: '/transactions', label: 'Transactions', icon: '🔁', permission: 'finance' },
      { href: '/driver-subscriptions', label: 'Driver Subscriptions', icon: '📅', permission: 'subscriptions' },
    ],
  },
  {
    group: 'Users & Data',
    items: [
      { href: '/ratings', label: 'Ratings & Reviews', icon: '⭐', permission: 'rides' },
      { href: '/payment-methods', label: 'Payment Methods', icon: '💳', permission: 'finance' },
      { href: '/favorite-locations', label: 'Favourite Locations', icon: '📍', permission: 'users' },
      { href: '/emergency-contacts', label: 'Emergency Contacts', icon: '🆘', permission: 'users' },
      { href: '/affiliate-impressions', label: 'AF Impressions', icon: '👁️', permission: 'affiliates' },
    ],
  },
  {
    group: 'Tools',
    items: [
      { href: '/support', label: 'Support Tickets', icon: '🎧', permission: 'support' },
      { href: '/notifications', label: 'Notifications', icon: '🔔', permission: 'support' },
      { href: '/reports', label: 'Reports', icon: '📈', permission: 'reports' },
      { href: '/audit-logs', label: 'Audit Logs', icon: '🔍', permission: 'audit' },
      { href: '/permissions', label: 'Permissions', icon: '🔑', permission: 'settings' },
      { href: '/surge-pricing', label: 'Surge Pricing', icon: '🔥', permission: 'settings' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const { can, adminType } = usePermissions();

  const isActive = href => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className={`h-screen flex flex-col bg-gray-900 text-white transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'} shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">OR</div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm">OkraRides</div>
            <div className="text-xs text-gray-400 capitalize">{adminType?.replace('_', ' ') || 'Admin'}</div>
          </div>
        )}
        <button onClick={onToggle} className="ml-auto text-gray-400 hover:text-white text-xs">
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-none">
        {NAV.map(group => {
          const visible = group.items.filter(item => !item.permission || can(item.permission) || adminType === 'super_admin');
          if (!visible.length) return null;
          return (
            <div key={group.group} className="mb-1">
              {!collapsed && (
                <p className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.group}</p>
              )}
              {visible.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors relative ${
                    isActive(item.href)
                      ? 'bg-blue-600/20 text-blue-400 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {isActive(item.href) && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />}
                  <span className="text-base shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 px-4 py-3">
        {!collapsed ? (
          <Link href="/login" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white">
            <span>⬅</span> Sign out
          </Link>
        ) : (
          <Link href="/login" className="flex justify-center text-gray-500 hover:text-white text-sm">⬅</Link>
        )}
      </div>
    </aside>
  );
}