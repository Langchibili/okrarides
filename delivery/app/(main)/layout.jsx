// PATH: driver/app/(main)/layout.jsx
// Server Component — no 'use client'.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DeliveryMainLayoutClient from './DeliveryMainLayoutClient';

export default function MainLayout({ children }) {
  return <DeliveryMainLayoutClient>{children}</DeliveryMainLayoutClient>;
}