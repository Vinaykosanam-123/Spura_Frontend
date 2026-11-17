'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { safeRedirectTarget } from '@/lib/config';
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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const serviceError = searchParams.get('error') === 'service_unavailable';

  const [mode, setMode] = useState<'login' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [verifiedMsg, setVerifiedMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Password recovery state
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPw, setResetNewPw] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetErr, setResetErr] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setVerifiedMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      setErr('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErr('Please enter your password.');
      return;
    }

    setBusy(true);
    try {
      await api.login(cleanEmail, password);
      const verified = await api.me();
      if (!verified?.user?.id) {
        throw new Error('Session could not be verified. Please ensure cookies are enabled.');
      }

      const roleLabel = verified.user.roles?.includes('admin')
        ? 'Admin'
        : verified.user.roles?.includes('mentor') || verified.user.roles?.includes('instructor')
          ? 'Instructor'
          : 'Student';
      setVerifiedMsg(`Signed in as ${verified.user.fullName} (${roleLabel}) — opening dashboard…`);

      router.push(safeRedirectTarget(nextParam, '/my'));
      router.refresh();
    } catch (error: unknown) {
      setErr(formatAuthError(error, 'Sign in failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg('');
    setResetErr('');
    const target = (resetEmail || email).trim().toLowerCase();
    if (!EMAIL_RE.test(target)) {
      setResetErr('Please enter a valid email address.');
      return;
    }
    setResetBusy(true);
    try {
      const res = await api.requestPasswordReset(target);
      setResetEmail(target);
      setResetMsg(res.message || 'If an account exists, a reset token has been sent.');
      setResetStep('confirm');
    } catch (error: unknown) {
      setResetErr(formatAuthError(error, 'Could not request password reset.'));
    } finally {
      setResetBusy(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg('');
    setResetErr('');
    const target = (resetEmail || email).trim().toLowerCase();
    if (!EMAIL_RE.test(target)) {
      setResetErr('Please enter a valid email address.');
      return;
    }
    const pwErr = formatPasswordError(resetNewPw);
    if (pwErr) {
      setResetErr(pwErr);
      return;
    }
    if (!resetToken.trim()) {
      setResetErr('Please enter the reset token from your email.');
      return;
    }
    setResetBusy(true);
    try {
      const res = await api.confirmPasswordReset({
        email: target,
        token: resetToken.trim(),
        password: resetNewPw,
      });
      setResetMsg(res.message || 'Password updated. You can now sign in with your new password.');
      setResetToken('');
      setResetNewPw('');
      setEmail(target);
    } catch (error: unknown) {
      setResetErr(formatAuthError(error, 'Password reset failed.'));
    } finally {
      setResetBusy(false);
    }
  };

  if (mode === 'recover') {
    return (
      <AuthShell
        activeMode="login"
        nextParam={nextParam}
        badge="Account Recovery"
        title="Reset your password"
        subtitle="Request a verification token and choose a new password."
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setResetErr('');
              setResetMsg('');
            }}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
          >
            ← Back to sign in
          </button>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setResetStep('request')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                resetStep === 'request'
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              1. Send token
            </button>
            <button
              type="button"
              onClick={() => setResetStep('confirm')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                resetStep === 'confirm'
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              2. New password
            </button>
          </div>
        </div>

        {resetStep === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label htmlFor="recover-email" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Account email
              </label>
              <input
                id="recover-email"
                type="email"
                required
                autoComplete="email"
                value={resetEmail || email}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={resetBusy}
              className="w-full h-11 rounded-xl bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {resetBusy ? 'Sending token…' : 'Send reset token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div>
              <label htmlFor="confirm-email" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Account email
              </label>
              <input
                id="confirm-email"
                type="email"
                required
                autoComplete="email"
                value={resetEmail || email}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label htmlFor="confirm-token" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
                Reset token
              </label>
              <input
                id="confirm-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token from email"
                className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <PasswordField
              id="confirm-new-pw"
              label="New password"
              value={resetNewPw}
              onChange={setResetNewPw}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
            />
            <PasswordChecklist password={resetNewPw} />
            <button
              type="submit"
              disabled={resetBusy}
              className="w-full h-11 rounded-xl bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {resetBusy ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        )}

        {resetMsg && <AuthAlert tone="success">{resetMsg}</AuthAlert>}
        {resetErr && <AuthAlert tone="error">{resetErr}</AuthAlert>}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      activeMode="login"
      nextParam={nextParam}
      badge="SPURA Student & Mentor Portal"
      title="Welcome back"
      subtitle="Sign in with your SPURA credentials to continue learning."
    >
      {serviceError && (
        <AuthAlert tone="info">
          Session verification service is temporarily unavailable. Please sign in again once connected.
        </AuthAlert>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
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
            className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          rightSlot={
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setResetErr('');
                setResetMsg('');
                setMode('recover');
              }}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
            >
              Forgot password?
            </button>
          }
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-xl bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {busy ? 'Signing in & verifying session…' : 'Sign in to dashboard →'}
        </button>
      </form>

      {verifiedMsg && <AuthAlert tone="success">✓ {verifiedMsg}</AuthAlert>}
      {err && <AuthAlert tone="error">{err}</AuthAlert>}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <p className="text-sm text-stone-500 dark:text-slate-400">Loading sign in…</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
