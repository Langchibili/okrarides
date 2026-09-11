// PATH: driver/app/(main)/subscription/success/page.jsx
import { Suspense } from 'react';
import SubscriptionSuccessPage from './SubscriptionSuccessPage';
export default function Page() {
  return <Suspense fallback={null}><SubscriptionSuccessPage /></Suspense>;
}