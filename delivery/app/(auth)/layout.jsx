// PATH: driver/app/(auth)/layout.jsx
// Server Component — no 'use client'.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DriverAuthLayoutClient from './DriverAuthLayoutClient';

export default function AuthLayout({ children }) {
  return <DriverAuthLayoutClient>{children}</DriverAuthLayoutClient>;
}