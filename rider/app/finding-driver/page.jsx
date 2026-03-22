// PATH: rider/app/(main)/finding-driver/page.jsx
import { Suspense } from 'react';
import FindingDriverPage from './FindingDriverPage';
export default function Page() {
  return <Suspense fallback={null}><FindingDriverPage /></Suspense>;
}