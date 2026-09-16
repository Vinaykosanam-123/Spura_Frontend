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
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Backend is offline (UI-only mode)</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">API at http://localhost:4000 is unreachable.</p>
        <p className="mt-1 text-xs text-zinc-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <a href="/progress" className="mt-6 inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium">Retry</a>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Progress</h1>
      {progress.length === 0 ? (
        <Empty title="No progress yet" hint="Start a lesson to track your progress per topic." />
      ) : (
        <div className="space-y-6">
          {progress.map((p) => (
            <section
              key={p.topic}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 bg-white dark:bg-zinc-900"
              aria-label={p.topic}
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                {p.topic}
              </h2>
              <ProgressBar value={p.completedLessons} max={p.totalLessons} label="Lessons" />
              <p className="mt-3 text-sm text-zinc-500">
                Attended lives: <strong className="text-zinc-900 dark:text-zinc-100">{p.attendedLives}</strong>
              </p>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
