// PATH: rider/app/trip-summary/page.jsx
import { Suspense } from 'react';
import TripSummaryPage from './TripSummaryPage';
export default function Page() {
  return <Suspense fallback={null}><TripSummaryPage /></Suspense>;
}