'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await api.confirmPasswordReset({
        email: email.trim(),
        token: token.trim(),
        password,
      });
      setDone(true);
      setMessage(res.message || 'Password has been reset. You can now log in.');
      setPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#0F1319] p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Reset your password</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
        Choose a new strong password (8+ chars, uppercase, lowercase, and digit).
      </p>

      {done ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-200">
            {message}
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm font-semibold text-stone-950"
          >
            Continue to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="rp-email" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Email
            </label>
            <input
              id="rp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="rp-token" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Reset Token
            </label>
            <input
              id="rp-token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="rp-password" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              New Password
            </label>
            <input
              id="rp-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {busy ? 'Resetting…' : 'Confirm new password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <Suspense fallback={<p className="text-sm text-stone-500">Loading password reset…</p>}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
