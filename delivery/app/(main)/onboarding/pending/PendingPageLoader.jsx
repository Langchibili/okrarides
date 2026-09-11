'use client';
// PATH: driver/app/(main)/onboarding/PendingPage
import dynamic from 'next/dynamic';

const PendingPage = dynamic(
  () => import('./PendingPage'),
  { ssr: false, loading: () => null }
);

export default function PendingPageLoader() {
  return <PendingPage />;
}