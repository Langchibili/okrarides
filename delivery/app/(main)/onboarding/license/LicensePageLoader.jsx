'use client';
// PATH: driver/app/(main)/onboarding/LicensePage
import dynamic from 'next/dynamic';

const LicensePage = dynamic(
  () => import('./LicensePage'),
  { ssr: false, loading: () => null }
);

export default function LicensePageLoader() {
  return <LicensePage />;
}