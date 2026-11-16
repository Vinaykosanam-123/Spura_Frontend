import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type {
  Announcement,
  CurriculumEntry,
  Enrollment,
  LiveClass,
  Progress,
  User,
} from '@/lib/types';
import { formatDate, formatDuration } from '@/lib/format';
import Empty from '@/components/Empty';
import ProgressBar from '@/components/ProgressBar';
import ActivityCalendar from '@/components/ActivityCalendar';

async function load() {
  const [{ user }] = await Promise.all([
    serverGet<{ user: User }>('/api/v1/auth/me'),
  ]).catch((e) => {
    if (isUnauthorized(e)) redirect('/login');
    throw e;
  });
  type SubmissionRow = {
    id: string;
    language: string;
    status: string;
    verdict?: string | null;
    createdAt: string;
    questionTitle?: string | null;
    questionSlug?: string | null;
  };
  const [enr, cur, prog, ann, up, sub] = await Promise.all([
    serverGet<{ enrollments: Enrollment[] }>('/api/v1/me/enrollments').catch(() => ({
      enrollments: [] as Enrollment[],
    })),
    serverGet<{ curriculum: CurriculumEntry[] }>('/api/v1/me/curriculum').catch(() => ({
      curriculum: [] as CurriculumEntry[],
    })),
    serverGet<{ progress: Progress[] }>('/api/v1/me/progress').catch(() => ({
      progress: [] as Progress[],
    })),
    serverGet<{ announcements: Announcement[] }>('/api/v1/me/announcements').catch(() => ({
      announcements: [] as Announcement[],
    })),
    serverGet<{ live: LiveClass[] }>('/api/v1/me/live/upcoming').catch(() => ({
      live: [] as LiveClass[],
    })),
    serverGet<{ submissions: SubmissionRow[] }>('/api/v1/me/submissions?limit=5').catch(() => ({
      submissions: [] as SubmissionRow[],
    })),
  ]);
  return { user, ...enr, ...cur, ...prog, ...ann, ...up, ...sub };
}

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function Dashboard() {
  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    const msg = e instanceof Error ? e.message : 'Backend unreachable';
    const isDown = msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('4000');
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="mt-4 text-[26px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {isDown ? 'Study space is offline' : "Couldn't load your session"}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-600 dark:text-stone-400">
          {isDown
            ? 'SPURA API is temporarily unreachable. Please refresh in a moment.'
            : msg}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/my"
            className="inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-stone-950 text-sm font-semibold transition-colors"
          >
            Retry
          </Link>
          <Link
            href="/courses"
            className="inline-flex h-11 items-center rounded-xl border border-stone-200 dark:border-white/10 hover:bg-white/5 px-5 text-sm font-medium"
          >
            Browse catalog
          </Link>
        </div>
      </main>
    );
  }
  const { user, enrollments, curriculum, progress, announcements, submissions } = data;
  const active = enrollments.filter((e) => e.state === 'active');

  type QueueItem = { id: string; title: string; course: string; module: string; durationSeconds?: number | null; type: string };
  const queue: QueueItem[] = [];
  for (const entry of curriculum) {
    for (const m of entry.modules) {
      for (const l of m.lessons) {
        if (!l.locked && !l.completedAt) {
          queue.push({ id: l.id, title: l.title, course: entry.course.title, module: m.title, durationSeconds: l.durationSeconds, type: l.type });
        }
      }
    }
  }
  const nextLesson = queue[0] ?? null;
  const sessionPlan = queue.slice(0, 3);


  const totalLessons = progress.reduce((a, p) => a + p.totalLessons, 0);
  const doneLessons = progress.reduce((a, p) => a + p.completedLessons, 0);
  const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  const sessionMinutes = sessionPlan.reduce((a, l) => a + Math.round(((l.durationSeconds ?? 900) as number) / 60), 0);
  const firstName = user.fullName.split(' ')[0] || user.fullName;
  const greeting = greetingFor(new Date().getHours());
  const todayLabel = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Calm header — one greeting, one context line */}
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-stone-500 dark:text-stone-400">{todayLabel}</p>
          <h1 className="mt-1 text-[30px] sm:text-[34px] font-semibold tracking-[-0.02em] leading-tight text-stone-900 dark:text-stone-50">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-600 dark:text-stone-400">
            {active.length === 0
              ? 'Your learning space is ready — once enrolled, your session plan will appear here.'
              : nextLesson
                ? `You're ${pct}% through · ${sessionMinutes} min planned for today · pick up where you left off.`
                : `You're ${pct}% through · all caught up. Review or revisit a recording to stay sharp.`}
          </p>
          {active.length > 0 && (
            <p className="mt-2 text-[13px] text-stone-500 dark:text-stone-400">
              {active[0].courseTitle} · {active[0].batchName} · access until {formatDate(active[0].accessExpiresAt)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
      <div className="min-w-0">

      {active.length === 0 ? (
        <div className="mt-8">
          <Empty
            title="Access pending"
            hint="You have no active enrollment yet. Contact an admin to get enrolled in a batch — then this page becomes your daily session."
          />
        </div>
      ) : (
        <>
          {/* Today's session — the only decision the learner must make */}
          <section aria-label="Today's session" className="card-calm mt-6 rounded-2xl p-6 sm:p-8">
            {nextLesson ? (
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-emerald-800 dark:text-emerald-300">
                    Today&apos;s session
                  </p>
                  <p className="mt-2 text-[13px] text-stone-500 dark:text-stone-400">{nextLesson.course} · {nextLesson.module}</p>
                  <h2 className="mt-1 text-[24px] sm:text-[28px] font-semibold tracking-tight leading-snug text-stone-900 dark:text-stone-50">
                    {nextLesson.title}
                  </h2>
                  <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                    {nextLesson.type} · {formatDuration(nextLesson.durationSeconds ?? 900)} · step 1 of {sessionPlan.length}
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/my/lessons/${nextLesson.id}`}
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-7 text-[15px] text-stone-950 font-semibold transition-colors"
                    >
                      Continue learning →
                    </Link>
                    <Link
                      href="/my/curriculum"
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-stone-200 dark:border-white/10 px-6 text-[15px] font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                    >
                      View full path
                    </Link>
                  </div>
                </div>
                <div className="lg:border-l lg:border-stone-200 lg:dark:border-white/10 lg:pl-8">
                  <p className="text-[13px] font-medium text-stone-500 dark:text-stone-400">Session plan · ~{sessionMinutes} min</p>
                  <ol className="mt-3 space-y-3">
                    {sessionPlan.map((l, i) => (
                      <li key={l.id} className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${i === 0 ? 'bg-amber-500 text-stone-950' : 'bg-stone-200/70 text-stone-600 dark:bg-white/10 dark:text-slate-300'}`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium leading-snug text-stone-900 dark:text-stone-100 truncate">{l.title}</p>
                          <p className="text-[13px] text-stone-500 dark:text-stone-400">{formatDuration(l.durationSeconds ?? 900)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5">
                    <ProgressBar value={doneLessons} max={totalLessons} label="Overall progress" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <h2 className="text-[22px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">All caught up — nicely done.</h2>
                <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Revisit recordings or review your progress to lock it in.</p>
                <div className="mt-5 flex gap-3 justify-center">
                  <Link href="/my/recordings" className="inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-6 text-sm text-stone-950 font-semibold transition-colors">Review recordings</Link>
                  <Link href="/my/progress" className="inline-flex h-11 items-center rounded-xl border border-stone-200 dark:border-white/10 hover:bg-white/5 px-6 text-sm font-medium">View progress</Link>
                </div>
              </div>
            )}
          </section>

          {/* Secondary — glanceable, not competing */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="card-calm rounded-2xl p-6" aria-label="Up next queue">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[16px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Up next</h2>
                <Link href="/my/curriculum" className="text-[13px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">Full curriculum →</Link>
              </div>
              {queue.length <= 1 ? (
                <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Nothing else queued — finish today&apos;s session first.</p>
              ) : (
                <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
                  {queue.slice(1, 5).map((l) => (
                    <li key={l.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-stone-900 dark:text-stone-100 truncate">{l.title}</p>
                        <p className="text-[13px] text-stone-500 dark:text-stone-400 truncate">{l.course} · {formatDuration(l.durationSeconds ?? 900)}</p>
                      </div>
                      <Link href={`/my/lessons/${l.id}`} className="shrink-0 text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5">
                        Start
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card-calm rounded-2xl p-6" aria-label="Announcements">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[16px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Announcements</h2>
                <Link href="/my/announcements" className="text-[13px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">View all →</Link>
              </div>
              <ul className="mt-4 space-y-2.5">
                {(announcements ?? []).slice(0, 3).map((a: Announcement) => (
                  <li key={a.id} className="flex items-start justify-between gap-3">
                    <p className="text-[14px] text-stone-700 dark:text-stone-300 leading-snug line-clamp-2">{a.title}</p>
                    <span className="shrink-0 text-[12px] text-stone-400">{formatDate(a.publishedAt)}</span>
                  </li>
                ))}
                {(announcements ?? []).length === 0 && (
                  <p className="text-sm text-stone-500 dark:text-stone-400">No announcements yet.</p>
                )}
              </ul>
            </section>
          </div>
        </>
      )}

      {(submissions ?? []).length > 0 && (
        <section className="card-calm mt-6 rounded-2xl p-6" aria-label="Recent submissions">
          <h2 className="text-[16px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Recent submissions</h2>
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {(submissions ?? []).slice(0, 5).map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-stone-900 dark:text-stone-100 truncate">
                    {s.questionTitle ?? s.questionSlug ?? 'Submission'}
                  </p>
                  <p className="text-[13px] text-stone-500 dark:text-stone-400">
                    {s.language} · {formatDate(s.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-semibold px-2.5 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {s.verdict === 'accepted' ? '✓ accepted' : s.verdict ? `✗ ${s.verdict}` : `… ${s.status}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-20">
        <ActivityCalendar />
      </aside>
      </div>

    </main>
  );
}
