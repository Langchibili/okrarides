'use client';
// PATH: driver/app/(main)/onboarding/SetupDriverPage
import dynamic from 'next/dynamic';

const SetupDriverPage = dynamic(
  () => import('./SetupDriverPage'),
  { ssr: false, loading: () => null }
);

export default function SetupDriverPageLoader() {
  return <SetupDriverPage />;
}