'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';

function errMsg(e: unknown): string {
  const err = e as ApiError;
  if (err?.status === 409) return 'An account already exists with this email. Try logging in instead.';
  if (err?.status === 400) {
    const fields = err.fields ? ` — ${JSON.stringify(err.fields)}` : '';
    return `${err.message || 'Validation failed'}${fields}`;
  }
  return e instanceof Error ? e.message : 'Registration failed';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const r = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [verifiedMsg, setVerifiedMsg] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md card-calm rounded-2xl p-6 sm:p-8 dark:border-white/10">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 mb-3">
          Join SPURA Batch 2.0
        </span>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Create your SPURA account</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
          Already registered?{' '}
          <Link
            href="/login"
            className="text-amber-500 hover:text-amber-400 font-semibold underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            setVerifiedMsg('');

            const cleanName = fullName.trim();
            const cleanEmail = email.trim().toLowerCase();

            if (cleanName.length < 2) {
              setErr('Please enter your full name (at least 2 characters).');
              return;
            }
            if (!EMAIL_RE.test(cleanEmail)) {
              setErr('Please enter a valid email address.');
              return;
            }
            if (password.length < 8) {
              setErr('Password must be at least 8 characters long.');
              return;
            }
            if (password !== confirmPassword) {
              setErr('Passwords do not match.');
              return;
            }

            setBusy(true);
            try {
              await api.register(cleanName, cleanEmail, password);
              // Validate the created session & user account via /api/v1/auth/me
              const verified = await api.me();
              if (!verified?.user?.id) {
                throw new Error('Account created, but session validation failed. Please log in.');
              }
              setVerifiedMsg(
                `Welcome ${verified.user.fullName}! Account verified & enrolled — redirecting...`,
              );
              r.push('/my');
              r.refresh();
            } catch (e: unknown) {
              setErr(errMsg(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="mt-1 w-full px-4 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full px-4 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-xs text-stone-500 hover:text-amber-400 transition-colors"
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mt-1 w-full px-4 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="mt-1 w-full px-4 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {busy ? 'Creating & verifying account…' : 'Sign up & Start Learning'}
          </button>
        </form>

        {verifiedMsg && (
          <p
            className="mt-4 p-3 text-sm rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium"
            role="status"
          >
            ✓ {verifiedMsg}
          </p>
        )}

        {err && (
          <p
            className="mt-4 p-3 text-sm rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            role="alert"
          >
            {err}
          </p>
        )}
      </div>
    </main>
  );
}
