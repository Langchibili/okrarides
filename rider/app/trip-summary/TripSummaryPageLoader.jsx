'use client';
import ContextProviders from '@/lib/contexts/ContextProviders';
// PATH: app/help/TripSummaryPageLoader.jsx
// Client Component — allowed to use next/dynamic with ssr:false.
// This prevents TripSummaryPage (and its context hooks) from ever running on the server.

import dynamic from 'next/dynamic';

const TripSummaryPage = dynamic(
  () => import('./TripSummaryPage'),
  { ssr: false, loading: () => null }
);

export default function TripSummaryPageLoader() {
  return <ContextProviders><TripSummaryPage /></ContextProviders>
}