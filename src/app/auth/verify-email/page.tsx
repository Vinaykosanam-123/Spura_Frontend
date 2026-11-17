'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { EMAIL_RE, formatAuthError } from '@/lib/auth-validation';
import { AuthAlert, AuthShell } from '@/components/auth/AuthShell';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = (searchParams.get('email') ?? '').trim().toLowerCase();
  const initialToken = (searchParams.get('token') ?? '').trim();

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>(
    initialEmail && initialToken ? 'verifying' : 'idle',
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!initialEmail || !initialToken) return;
    let cancelled = false;
    api
      .confirmVerifyEmail({ email: initialEmail, token: initialToken })
      .then((res) => {
        if (cancelled) return;
        setStatus('verified');
        setMessage(res.message || 'Email verified successfully.');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(formatAuthError(err, 'Verification failed.'));
      });
    return () => {
      cancelled = true;
    };
  }, [initialEmail, initialToken]);

  const handleManualConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('verifying');
    setMessage('');
    try {
      const res = await api.confirmVerifyEmail({ email: cleanEmail, token: token.trim() });
      setStatus('verified');
      setMessage(res.message || 'Email verified successfully.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(formatAuthError(err, 'Verification failed.'));
    }
  };

  return (
    <AuthShell
      badge="Email Verification"
      title="Verify your email"
      subtitle="Confirm your email address to activate full account recovery and alerts."
    >
      {status === 'verifying' && (
        <AuthAlert tone="info">Verifying your email address…</AuthAlert>
      )}

      {status === 'verified' && (
        <div className="space-y-4">
          <AuthAlert tone="success">✓ {message}</AuthAlert>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/my"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm font-bold text-stone-950 transition-colors"
            >
              Go to dashboard →
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/5 px-5 text-sm font-medium text-stone-700 dark:text-stone-200 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      {(status === 'idle' || status === 'error') && (
        <form onSubmit={handleManualConfirm} className="space-y-4">
          {status === 'error' && message && <AuthAlert tone="error">{message}</AuthAlert>}
          <div>
            <label htmlFor="ve-email" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Email address
            </label>
            <input
              id="ve-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="ve-token" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Verification token
            </label>
            <input
              id="ve-token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="w-full h-11 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold rounded-xl transition-colors"
          >
            Confirm verification
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <p className="text-sm text-stone-500 dark:text-slate-400">Loading verification…</p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
