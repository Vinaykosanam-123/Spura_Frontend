'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  EMAIL_RE,
  formatAuthError,
  formatPasswordError,
} from '@/lib/auth-validation';
import {
  AuthAlert,
  AuthShell,
  PasswordChecklist,
  PasswordField,
} from '@/components/auth/AuthShell';

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
    setError('');
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwErr = formatPasswordError(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }

    setBusy(true);
    try {
      const res = await api.confirmPasswordReset({
        email: cleanEmail,
        token: token.trim(),
        password,
      });
      setDone(true);
      setMessage(res.message || 'Password has been reset. You can now sign in.');
      setPassword('');
    } catch (err: unknown) {
      setError(formatAuthError(err, 'Password reset failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      badge="Password Reset"
      title="Set a new password"
      subtitle="Use a strong password with uppercase, lowercase, and numeric characters."
    >
      {done ? (
        <div className="space-y-4">
          <AuthAlert tone="success">✓ {message}</AuthAlert>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm font-bold text-stone-950 transition-colors"
          >
            Continue to sign in →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rp-email" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Email address
            </label>
            <input
              id="rp-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="rp-token" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
              Reset token
            </label>
            <input
              id="rp-token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-2">
            <PasswordField
              id="rp-password"
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={8}
            />
            <PasswordChecklist password={password} />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {busy ? 'Resetting…' : 'Confirm new password'}
          </button>
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          <div className="pt-2 text-center">
            <Link href="/login" className="text-xs font-medium text-stone-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400">
              ← Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <p className="text-sm text-stone-500 dark:text-slate-400">Loading password reset…</p>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
