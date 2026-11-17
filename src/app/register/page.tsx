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

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [verifiedMsg, setVerifiedMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
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
    const pwErr = formatPasswordError(password);
    if (pwErr) {
      setErr(pwErr);
      return;
    }
    if (password !== confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await api.register(cleanName, cleanEmail, password);
      let verifiedUser: { id: string; fullName: string } | null = null;
      try {
        const verified = await api.me();
        verifiedUser = verified?.user ?? null;
      } catch {
        verifiedUser = null;
      }

      if (!verifiedUser?.id) {
        setErr('Account created, but session validation failed. Please sign in manually.');
        return;
      }

      setVerifiedMsg(`Welcome ${verifiedUser.fullName}! Account verified — redirecting…`);
      router.push(safeRedirectTarget(nextParam, '/my'));
      router.refresh();
    } catch (error: unknown) {
      setErr(formatAuthError(error, 'Registration failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      activeMode="register"
      nextParam={nextParam}
      badge="Create SPURA Account"
      title="Start mastering DSA"
      subtitle="Unlock live cohorts, interactive visualizers, and 450+ interview problems."
    >
      <form className="space-y-4" onSubmit={handleRegister}>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
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
            className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
          />
        </div>

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

        <div className="space-y-2">
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
            placeholder="Minimum 8 characters"
          />
          <PasswordChecklist password={password} />
        </div>

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          minLength={8}
          placeholder="Re-enter your password"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-xl bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {busy ? 'Creating & verifying account…' : 'Create account & continue →'}
        </button>
      </form>

      {verifiedMsg && <AuthAlert tone="success">✓ {verifiedMsg}</AuthAlert>}
      {err && <AuthAlert tone="error">{err}</AuthAlert>}
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <p className="text-sm text-stone-500 dark:text-slate-400">Loading registration…</p>
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
