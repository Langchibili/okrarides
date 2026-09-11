// PATH: app/(onboarding)/welcome/page.jsx
import { Suspense } from 'react';
import WelcomePage from './WelcomePage';
export default function Page() {
  return <Suspense fallback={null}><WelcomePage /></Suspense>;
}