'use client';
// PATH: driver/app/(main)/onboarding/ProofOfAddressPage
import dynamic from 'next/dynamic';

const ProofOfAddressPage = dynamic(
  () => import('./ProofOfAddressPage'),
  { ssr: false, loading: () => null }
);

export default function ProofOfAddressPageLoader() {
  return <ProofOfAddressPage />;
}