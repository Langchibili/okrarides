'use client';

import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
