// PATH: rider/app/(main)/layout.jsx
// Server Component shell — no 'use client'.
// Delegates everything to MainLayoutClient which has the actual logic.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import MainLayoutClient from './MainLayoutClient';

export default function MainLayout({ children }) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}