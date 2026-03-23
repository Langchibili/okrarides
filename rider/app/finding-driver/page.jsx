// PATH: app/help/page.jsx
// Server Component — no 'use client'.
// HelpPage uses useAuth/useAdminSettings/useScreenshot which require
// client-side context providers. ssr:false keeps it out of the server
// bundle entirely so those hooks are never called during prerender.

export const dynamic = 'force-dynamic';

import FindingDriverPageLoader from './FindingDriverPageLoader';

export default function Page() {
  return <FindingDriverPageLoader />;
}