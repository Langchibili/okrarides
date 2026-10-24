'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminHomePath, useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace(getAdminHomePath(user));
  }, [loading, isAuthenticated, router, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const currentUser = await login(email.trim(), password);
      router.replace(getAdminHomePath(currentUser));
    } catch (error) {
      toast.error(error.message || 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="brand-mark">OR</div>
        <p className="eyebrow">OKRARIDES PLATFORM</p>
        <h1>Admin workspace</h1>
        <p className="login-copy">Sign in with your Strapi administrator account.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" autoComplete="username" value={email}
            onChange={event => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password}
            onChange={event => setPassword(event.target.value)} required />
          <button className="button button-primary login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="login-security">Protected by your Strapi Admin role and permissions.</p>
      </section>
    </main>
  );
}
