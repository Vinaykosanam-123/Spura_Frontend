'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { evaluatePasswordStrength } from '@/lib/auth-validation';

interface AuthShellProps {
  activeMode?: 'login' | 'register';
  nextParam?: string | null;
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const HIGHLIGHTS = [
  {
    title: 'Diagrammatic Code Execution',
    detail: 'Watch pointers, call stacks, trees, and DP tables animate line-by-line beside your code.',
  },
  {
    title: '450+ Company-Tagged Sheet',
    detail: 'Structured topic tracks and FAANG OA problems with multi-language C++, Java, JS & Python judge.',
  },
  {
    title: 'Live Cohort & Mock Contests',
    detail: 'Recorded Telugu & English sessions, weekly timed mocks, and instant verdict telemetry.',
  },
];

export function AuthShell({
  activeMode,
  nextParam,
  badge,
  title,
  subtitle,
  children,
}: AuthShellProps) {
  const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 lg:py-16">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#0F1319] shadow-xl shadow-stone-900/5 dark:shadow-black/50 overflow-hidden">
        {/* Left brand showcase panel (hidden on compact phones, crisp summary on tablet, full split on lg) */}
        <section className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 xl:p-10 bg-gradient-to-br from-stone-900 via-[#111722] to-[#0B0F17] text-stone-100 border-r border-white/10 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
          />

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-sm font-bold tracking-tight text-white"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-stone-950 font-black">
                S
              </span>
              <span>SPURA</span>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                Studio 2.0
              </span>
            </Link>

            <h2 className="mt-8 text-2xl xl:text-[26px] font-bold leading-snug tracking-tight text-white">
              Stop memorizing algorithms.{' '}
              <span className="text-amber-400">See how they execute.</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Sign in once to sync your solved problems, saved visualizers, live class recordings, and contest rankings across devices.
            </p>

            <ul className="mt-8 space-y-5">
              {HIGHLIGHTS.map((item, idx) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/15 text-xs font-bold text-amber-300">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Ready to preview labs?</span>
            <Link
              href="/visualize"
              className="font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Try Visualizers →
            </Link>
          </div>
        </section>

        {/* Right form workspace */}
        <section className="lg:col-span-7 p-6 sm:p-8 xl:p-10 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            {activeMode && (
              <div
                className="mb-6 grid grid-cols-2 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-[#090C10] p-1"
                role="tablist"
                aria-label="Authentication mode"
              >
                <Link
                  href={`/login${nextQuery}`}
                  role="tab"
                  aria-selected={activeMode === 'login'}
                  className={`py-2 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    activeMode === 'login'
                      ? 'bg-white dark:bg-[#161B24] text-stone-950 dark:text-white shadow-sm'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-950 dark:hover:text-white'
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  href={`/register${nextQuery}`}
                  role="tab"
                  aria-selected={activeMode === 'register'}
                  className={`py-2 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    activeMode === 'register'
                      ? 'bg-white dark:bg-[#161B24] text-stone-950 dark:text-white shadow-sm'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-950 dark:hover:text-white'
                  }`}
                >
                  Create account
                </Link>
              </div>
            )}

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 mb-3">
              {badge}
            </span>
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-stone-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-stone-600 dark:text-slate-400">{subtitle}</p>

            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  rightSlot?: React.ReactNode;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete,
  minLength,
  required = true,
  rightSlot,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-stone-700 dark:text-stone-200">
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 pr-16 border border-stone-300 dark:border-white/15 rounded-xl bg-white dark:bg-[#090C10] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-2 my-auto h-7 px-2.5 rounded-lg text-xs font-medium text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

export function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null;
  const s = evaluatePasswordStrength(password);
  const rules = [
    { ok: s.minLength, label: '8+ chars' },
    { ok: s.hasUpper, label: 'Uppercase (A-Z)' },
    { ok: s.hasLower, label: 'Lowercase (a-z)' },
    { ok: s.hasDigit, label: 'Number (0-9)' },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]" aria-live="polite">
      {rules.map((rule) => (
        <span
          key={rule.label}
          className={`inline-flex items-center gap-1.5 font-medium ${
            rule.ok
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-stone-500 dark:text-slate-400'
          }`}
        >
          <span>{rule.ok ? '✓' : '○'}</span>
          <span>{rule.label}</span>
        </span>
      ))}
    </div>
  );
}

export function AuthAlert({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'info';
  children: React.ReactNode;
}) {
  const styles =
    tone === 'error'
      ? 'bg-red-50 dark:bg-red-950/35 border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300'
      : tone === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-200';

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mt-4 rounded-xl border px-3.5 py-3 text-sm font-medium ${styles}`}
    >
      {children}
    </div>
  );
}
