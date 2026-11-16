import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type { Progress } from '@/lib/types';
import Empty from '@/components/Empty';
import ProgressBar from '@/components/ProgressBar';

export default async function ProgressPage() {
  let progress: Progress[];
  try {
    ({ progress } = await serverGet<{ progress: Progress[] }>('/api/v1/me/progress'));
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    const msg = e instanceof Error ? e.message : 'Backend unreachable';
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-4xl" aria-hidden="true">🔌</p>
        <h1 className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">Progress is temporarily unavailable</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Could not reach the SPURA API server.</p>
        <p className="mt-1 text-xs text-stone-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <Link href="/my/progress" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors">Retry</Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Progress</h1>
      <div className="mt-2 max-w-2xl text-[14px] leading-relaxed text-stone-600 dark:text-stone-400">
        <p>
          <strong className="font-semibold text-stone-900 dark:text-stone-100">Lessons x/y (z%)</strong>
          {' — '}completed lessons out of published lessons in that module. A lesson counts when you press
          “Mark complete” on its page.
        </p>
        <p className="mt-1">
          <strong className="font-semibold text-stone-900 dark:text-stone-100">Attended lives</strong>
          {' — '}live classes you joined (attendance is marked when you open the class link).
        </p>
      </div>
      {progress.length === 0 ? (
        <div className="mt-8">
          <Empty title="No progress yet" hint="Start a lesson to track your progress per topic." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {progress.map((p) => (
            <section
              key={p.topic}
              className="card-calm rounded-2xl p-5"
              aria-label={p.topic}
            >
              <h2 className="text-[16px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 truncate">
                {p.topic}
              </h2>
              <div className="mt-3">
                <ProgressBar value={p.completedLessons} max={p.totalLessons} label="Lessons" />
              </div>
              <p className="mt-3 text-[13px] text-stone-500 dark:text-stone-400">
                Attended lives: <strong className="text-stone-900 dark:text-stone-100 tabular-nums">{p.attendedLives}</strong>
              </p>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
