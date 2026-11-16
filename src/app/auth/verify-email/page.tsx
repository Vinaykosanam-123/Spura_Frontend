'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';
  const initialToken = searchParams.get('token') ?? '';

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
        setMessage(err instanceof Error ? err.message : 'Verification failed.');
      });
    return () => {
      cancelled = true;
    };
  }, [initialEmail, initialToken]);

  const handleManualConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('verifying');
    setMessage('');
    try {
      const res = await api.confirmVerifyEmail({ email: email.trim(), token: token.trim() });
      setStatus('verified');
      setMessage(res.message || 'Email verified successfully.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#0F1319] p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Verify your email</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
        Confirm your email address to complete account verification.
      </p>

      {status === 'verifying' && (
        <p className="mt-6 text-sm text-stone-600 dark:text-stone-300">Verifying your email address…</p>
      )}

      {status === 'verified' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-200">
            {message}
          </div>
          <div className="flex gap-3">
            <Link
              href="/my"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm font-semibold text-stone-950"
            >
              Go to dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 dark:border-white/10 hover:bg-white/5 px-5 text-sm font-medium text-stone-700 dark:text-stone-200"
            >
              Log in
            </Link>
          </div>
        </div>
      )}

      {(status === 'idle' || status === 'error') && (
        <form onSubmit={handleManualConfirm} className="mt-6 space-y-4">
          {status === 'error' && message && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
              {message}
            </div>
          )}
          <div>
            <label htmlFor="ve-email" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Email
            </label>
            <input
              id="ve-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="ve-token" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Verification Token
            </label>
            <input
              id="ve-token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-colors"
          >
            Confirm verification
          </button>
        </form>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <Suspense fallback={<p className="text-sm text-stone-500">Loading verification…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
