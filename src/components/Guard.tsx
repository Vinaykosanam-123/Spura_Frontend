'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Guard({
  children,
  requireAdmin = false,
  allowInstructor = true,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowInstructor?: boolean;
}) {
  const r = useRouter();
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'error' | 'login'>('loading');

  useEffect(() => {
    api
      .me()
      .then(({ user }) => {
        const isAdmin = user.roles.includes('admin');
        const isInstructor =
          user.roles.includes('instructor') || user.roles.includes('mentor');
        if (requireAdmin && !isAdmin && !(allowInstructor && isInstructor)) {
          setState('denied');
        } else {
          setState('ok');
        }
      })
      .catch((e: unknown) => {
        const status = (e as { status?: number })?.status;
        if (status === 401) {
          setState('login');
          r.push('/login');
        } else if (status === 403) {
          setState('denied');
        } else {
          setState('error');
        }
      });
  }, [r, requireAdmin, allowInstructor]);

  if (state === 'loading') {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12" aria-busy="true">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-stone-200 dark:bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-stone-200 dark:bg-white/10 rounded w-full" />
          <div className="h-4 bg-stone-200 dark:bg-white/10 rounded w-2/3" />
        </div>
      </main>
    );
  }

  if (state === 'login') return null;

  if (state === 'error') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Service temporarily unavailable</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Could not verify your session with the SPURA API server. Please ensure the backend is running and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-stone-950 font-semibold transition-colors"
        >
          Retry
        </button>
      </main>
    );
  }

  if (state === 'denied') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">403 — No permission</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          {requireAdmin
            ? 'This area is for admins only.'
            : 'You do not have access to this page.'}
        </p>
        <Link
          href="/my"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-stone-950 font-semibold transition-colors"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}
