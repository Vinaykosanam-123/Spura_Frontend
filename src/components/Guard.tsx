'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Guard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const r = useRouter();
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'login'>('loading');

  useEffect(() => {
    api
      .me()
      .then(({ user }) => {
        if (requireAdmin && !user.roles.includes('admin')) setState('denied');
        else setState('ok');
      })
      .catch((e: unknown) => {
        if ((e as { status?: number })?.status === 401) {
          setState('login');
          r.push('/login');
        } else {
          setState('denied');
        }
      });
  }, [r, requireAdmin]);

  if (state === 'loading') {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12" aria-busy="true">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
        </div>
      </main>
    );
  }

  if (state === 'login') return null;

  if (state === 'denied') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">403 — No permission</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {requireAdmin
            ? 'This area is for admins only.'
            : 'You do not have access to this page.'}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}
