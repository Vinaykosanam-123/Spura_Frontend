import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type { CurriculumEntry, Enrollment } from '@/lib/types';
import { formatDate } from '@/lib/format';
import Empty from '@/components/Empty';

export default async function CoursesPage() {
  let enrollments: Enrollment[];
  let curriculum: CurriculumEntry[];
  try {
    const [enr, cur] = await Promise.all([
      serverGet<{ enrollments: Enrollment[] }>('/api/v1/me/enrollments'),
      serverGet<{ curriculum: CurriculumEntry[] }>('/api/v1/me/curriculum').catch(() => ({
        curriculum: [] as CurriculumEntry[],
      })),
    ]);
    enrollments = enr.enrollments;
    curriculum = cur.curriculum;
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    throw e;
  }

  const active = enrollments.filter((e) => e.state === 'active');
  const other = enrollments.filter((e) => e.state !== 'active');

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">My courses</h1>
          <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">
            {active.length === 0
              ? 'No active enrollments yet.'
              : `${active.length} active ${active.length === 1 ? 'course' : 'courses'} · pick up where you left off.`}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link
            href="/courses"
            className="inline-flex h-9 items-center rounded-xl border border-stone-200 dark:border-white/10 px-3.5 font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-white/5"
          >
            Browse catalog
          </Link>
          <Link
            href="/my/orders"
            className="inline-flex h-9 items-center rounded-xl border border-stone-200 dark:border-white/10 px-3.5 font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-white/5"
          >
            Orders & invoices
          </Link>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="mt-8">
          <Empty
            title="Access pending"
            hint="You have no active enrollment yet. Browse the catalog to enroll in an open batch or check your orders."
            cta={{ label: 'Browse catalog', href: '/courses' }}
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {active.map((e) => {
            const entry = curriculum.find((c) => c.enrollmentId === e.id);
            const lessons = (entry?.modules ?? []).flatMap((m) => m.lessons);
            const done = lessons.filter((l) => l.completedAt).length;
            const total = lessons.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <li key={e.id} className="card-calm rounded-2xl p-6 flex flex-col">
                <p className="text-[12px] font-medium uppercase tracking-wide text-amber-400">
                  {e.batchName}
                </p>
                <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                  {e.courseTitle}
                </h2>
                <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400">
                  Access until {formatDate(e.accessExpiresAt)}
                </p>
                {total > 0 && (
                  <div className="mt-4">
                    <div className="h-1.5 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden" role="img" aria-label={`${pct}% complete`}>
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-[12px] text-stone-500 dark:text-stone-400 tabular-nums">
                      {done}/{total} lessons · {pct}%
                    </p>
                  </div>
                )}
                <Link
                  href="/my/curriculum"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors"
                >
                  Continue →
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {other.length > 0 && (
        <section className="mt-10" aria-label="Other enrollments">
          <h2 className="text-[16px] font-semibold text-stone-900 dark:text-stone-50 mb-3">
            Past & pending enrollments
          </h2>
          <ul className="space-y-2.5">
            {other.map((e) => (
              <li
                key={e.id}
                className="card-calm rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {e.courseTitle ?? 'Course'} · {e.batchName ?? e.batchCode}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Access expires {formatDate(e.accessExpiresAt)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {e.state}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
