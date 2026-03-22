'use client';
// Use this instead of importing MapIframe directly in page files.
// Keeps the entire Map module tree out of the SSR bundle.
import dynamic from 'next/dynamic';

const MapIframeNoSSR = dynamic(
  () => import('./MapIframe'),
  { ssr: false, loading: () => null }
);

export default MapIframeNoSSR;