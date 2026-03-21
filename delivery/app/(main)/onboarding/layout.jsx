// PATH: delivery/app/(onboarding)/layout.jsx
// Server Component — no 'use client'.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import OnboardingLayoutClient from './OnboardingLayoutClient';

export default function OnboardingLayout({ children }) {
  return <OnboardingLayoutClient>{children}</OnboardingLayoutClient>;
}