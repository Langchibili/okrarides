// PATH: app/tracking-order/page.jsx
import { Suspense } from 'react';
import PublicTrackingPage from './PublicTrackingPage';
export default function Page() {
  return <Suspense fallback={null}><PublicTrackingPage /></Suspense>;
}
