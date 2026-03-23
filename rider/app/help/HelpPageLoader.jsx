'use client';
import ContextProviders from '@/lib/contexts/ContextProviders';
// PATH: app/help/HelpPageLoader.jsx
// Client Component — allowed to use next/dynamic with ssr:false.
// This prevents HelpPage (and its context hooks) from ever running on the server.

import dynamic from 'next/dynamic';

const HelpPage = dynamic(
  () => import('./HelpPage'),
  { ssr: false, loading: () => null }
);

export default function HelpPageLoader() {
  return <ContextProviders><HelpPage /></ContextProviders>
}