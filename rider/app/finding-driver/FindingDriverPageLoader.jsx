'use client';
import ContextProviders from '@/lib/contexts/ContextProviders';
// PATH: app/help/FindingDriverPageLoader.jsx
// Client Component — allowed to use next/dynamic with ssr:false.
// This prevents FindingDriverPage (and its context hooks) from ever running on the server.

import dynamic from 'next/dynamic';

const FindingDriverPage = dynamic(
  () => import('./FindingDriverPage'),
  { ssr: false, loading: () => null }
);

export default function FindingDriverPageLoader() {
  return <ContextProviders><FindingDriverPage /></ContextProviders>
}