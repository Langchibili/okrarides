// PATH: app/(auth)/verify-phone/page.jsx
// Server Component shell — wraps client page in Suspense so
// useSearchParams() doesn't cause a prerender error.

import { Suspense } from 'react';
import VerifyPhonePage from './VerifyPhonePage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyPhonePage />
    </Suspense>
  );
}