'use client';
// PATH: driver/app/(main)/onboarding/NationalIdPage
import dynamic from 'next/dynamic';

const NationalIdPage = dynamic(
  () => import('./NationalIdPage'),
  { ssr: false, loading: () => null }
);

export default function NationalIdPageLoader() {
  return <NationalIdPage />;
}