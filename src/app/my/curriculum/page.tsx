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
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Curriculum is temporarily unavailable</h1>
        <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Could not reach the SPURA API server. Please ensure the backend service is running.</p>
        <Link href="/my/curriculum" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors">Retry</Link>
      </main>
    );
  }

  if (curriculum.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-6">Learning path</h1>
        <Empty title="No curriculum yet" hint="Enroll in a batch to see your learning path." />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
      <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-stone-500 dark:text-stone-400">Your path</p>
      <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Learning path</h1>
      <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">One step at a time — locked steps open as you finish.</p>
      {curriculum.map((entry) => (
        <section key={entry.enrollmentId} className="mt-8" aria-label={entry.course.title}>
          <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-4">
            {entry.course.title}
          </h2>
          {entry.modules.map((m) => (
            <div
              key={m.id}
              className="card-calm mb-4 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-stone-100 dark:border-white/10">
                <p className="text-[14px] font-semibold text-stone-900 dark:text-stone-100">
                  {m.sequence}. {m.title}
                </p>
              </div>
              <ul className="divide-y divide-stone-100 dark:divide-white/10">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    {l.locked ? (
                      <div className="px-5 py-3.5 flex items-center gap-3 opacity-60">
                        <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 dark:border-white/20 text-[10px]">·</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-stone-700 dark:text-stone-300 truncate">{l.title}</p>
                          <p className="text-[12px] text-stone-500">Locked — complete previous steps to unlock.</p>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/my/lessons/${l.id}`}
                        className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span
                          aria-label={l.completedAt ? 'completed' : 'not started'}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${l.completedAt ? 'bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950' : 'border border-stone-300 dark:border-white/20'}`}
                        >
                          {l.completedAt ? '✓' : ''}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-stone-900 dark:text-stone-100 truncate">{l.title}</p>
                          <p className="text-[12px] text-stone-500 dark:text-stone-400">
                            {l.type} · {formatDuration(l.durationSeconds)}
                            {l.watchedSeconds > 0 && ` · watched ${formatDuration(l.watchedSeconds)}`}
                          </p>
                        </div>
                        <span className="text-sm text-stone-400">→</span>
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
