// PATH: app/help/page.jsx
import { Suspense } from 'react';
import HelpPage from './HelpPage';
export default function Page() {
  return <Suspense fallback={null}><HelpPage /></Suspense>;
}