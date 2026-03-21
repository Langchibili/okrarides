// PATH: rider/app/(auth)/layout.jsx
// Server Component shell — no 'use client'.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import AuthLayoutClient from './AuthLayoutClient';

export default function AuthLayout({ children }) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}