import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type { CurriculumEntry } from '@/lib/types';
import { formatDuration } from '@/lib/format';
import Empty from '@/components/Empty';

export default async function CurriculumPage() {
  let curriculum: CurriculumEntry[];
  try {
    ({ curriculum } = await serverGet<{ curriculum: CurriculumEntry[] }>(
      '/api/v1/me/curriculum'
    ));
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    const msg = e instanceof Error ? e.message : 'Backend unreachable';
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-4xl" aria-hidden="true">🔌</p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Backend is offline (UI-only mode)</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">API at http://localhost:4000 is unreachable. Start the backend to see real curriculum.</p>
        <p className="mt-1 text-xs text-zinc-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <a href="/curriculum" className="mt-6 inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium">Retry</a>
      </main>
    );
  }

  if (curriculum.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Curriculum</h1>
        <Empty title="No curriculum yet" hint="Enroll in a batch to see your learning path." />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Curriculum</h1>
      {curriculum.map((entry) => (
        <section key={entry.enrollmentId} className="mb-10" aria-label={entry.course.title}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            {entry.course.title}
          </h2>
          {entry.modules.map((m) => (
            <div
              key={m.id}
              className="mb-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden"
            >
              <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {m.sequence}. {m.title}
                </p>
              </div>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    {l.locked ? (
                      <div className="px-5 py-3 flex items-center gap-3 text-zinc-400">
                        <span aria-label="locked">🔒</span>
                        <div className="flex-1">
                          <p className="font-medium">{l.title}</p>
                          <p className="text-xs">Locked — complete prerequisites to unlock.</p>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/lessons/${l.id}`}
                        className="px-5 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <span aria-label={l.completedAt ? 'completed' : 'not started'}>
                          {l.completedAt ? '✅' : '⭕'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{l.title}</p>
                          <p className="text-xs text-zinc-500">
                            {l.type} · {formatDuration(l.durationSeconds)}
                            {l.watchedSeconds > 0 && ` · watched ${formatDuration(l.watchedSeconds)}`}
                          </p>
                        </div>
                        <span className="text-sm text-zinc-400">→</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
