// PATH: driver/app/(main)/layout.jsx
// Server Component — no 'use client'.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DriverMainLayoutClient from './DriverMainLayoutClient';

export default function MainLayout({ children }) {
  return <DriverMainLayoutClient>{children}</DriverMainLayoutClient>;
}