'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';

function errMsg(e: unknown): string {
  const err = e as ApiError;
  if (err?.status === 401) return 'Invalid email or password.';
  if (err?.status === 400) return `Validation failed: ${err.message}`;
  return e instanceof Error ? e.message : 'Login failed';
}

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPw, setResetNewPw] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg('');
    setResetErr('');
    try {
      const res = await api.requestPasswordReset(resetEmail || email);
      setResetMsg(res.message);
    } catch (e: unknown) {
      setResetErr(e instanceof Error ? e.message : 'Reset request failed.');
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg('');
    setResetErr('');
    try {
      const res = await api.confirmPasswordReset({
        email: resetEmail || email,
        token: resetToken.trim(),
        password: resetNewPw,
      });
      setResetMsg(res.message);
      setResetToken('');
      setResetNewPw('');
    } catch (e: unknown) {
      setResetErr(e instanceof Error ? e.message : 'Password reset failed.');
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md card-calm rounded-2xl p-6 sm:p-8 dark:border-white/10">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 mb-3">
          SPURA Portal
        </span>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Log in</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
          No account yet?{' '}
          <Link href="/register" className="text-amber-500 hover:text-amber-400 font-medium underline underline-offset-4">
            Create an account
          </Link>
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            setBusy(true);
            try {
              await api.login(email, password);
              const nextParam =
                typeof window !== 'undefined'
                  ? new URLSearchParams(window.location.search).get('next')
                  : null;
              const destination =
                nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
                  ? nextParam
                  : '/my';
              r.push(destination);
              r.refresh();
            } catch (e: unknown) {
              setErr(errMsg(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Email
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
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-xl bg-amber-500 text-stone-950 font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        {err && (
          <p className="mt-4 p-3 text-sm rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" role="alert">
            {err}
          </p>
        )}

        <div className="mt-6 border-t border-stone-200 dark:border-white/10 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowReset((v) => !v);
              if (!resetEmail) setResetEmail(email);
            }}
            className="text-xs font-medium text-stone-500 dark:text-slate-400 hover:text-amber-400 underline underline-offset-4"
          >
            {showReset ? 'Hide password reset' : 'Forgot your password?'}
          </button>

          {showReset && (
            <div className="mt-4 space-y-4 rounded-xl border border-stone-200 dark:border-white/10 p-4 bg-stone-50/70 dark:bg-[#090C10]">
              <form onSubmit={handleRequestReset} className="space-y-2">
                <label htmlFor="rst-email" className="block text-xs font-medium text-stone-600 dark:text-stone-300">
                  Account email
                </label>
                <div className="flex gap-2">
                  <input
                    id="rst-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-stone-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0F1319] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 text-xs font-semibold"
                  >
                    Send reset token
                  </button>
                </div>
              </form>

              <form onSubmit={handleConfirmReset} className="space-y-2 pt-2 border-t border-stone-200 dark:border-white/10">
                <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Have a reset token?
                </p>
                <input
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Reset token"
                  className="w-full px-3 py-1.5 border border-stone-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0F1319] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetNewPw}
                  onChange={(e) => setResetNewPw(e.target.value)}
                  placeholder="New password (8+ chars, upper, lower, digit)"
                  className="w-full px-3 py-1.5 border border-stone-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0F1319] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg border border-stone-300 dark:border-white/10 hover:bg-white/5 text-xs font-medium"
                >
                  Confirm new password
                </button>
              </form>

              {resetErr && <p className="text-xs text-red-500" role="alert">{resetErr}</p>}
              {resetMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400" role="status">{resetMsg}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
