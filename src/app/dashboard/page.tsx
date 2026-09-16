import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type {
  Announcement,
  CurriculumEntry,
  Enrollment,
  Progress,
  User,
} from '@/lib/types';
import { formatDate } from '@/lib/format';
import Empty from '@/components/Empty';
import LogoutButton from '@/components/LogoutButton';
import ProgressBar from '@/components/ProgressBar';

async function load() {
  const [{ user }] = await Promise.all([
    serverGet<{ user: User }>('/api/v1/auth/me'),
  ]).catch((e) => {
    if (isUnauthorized(e)) redirect('/login');
    throw e;
  });
  const [enr, cur, prog, ann] = await Promise.all([
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
  ]);
  return { user, ...enr, ...cur, ...prog, ...ann };
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
        <p className="text-4xl" aria-hidden="true">🔌</p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {isDown ? 'Backend is offline (UI-only mode)' : 'Couldn\'t load dashboard'}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {isDown
            ? 'API at http://localhost:4000 is unreachable. UI still works — start the backend to see real data.'
            : msg}
        </p>
        <p className="mt-1 text-xs text-zinc-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <div className="mt-6 flex gap-3 justify-center">
          <a
            href="/dashboard"
            className="inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium"
          >
            Retry
          </a>
          <Link
            href="/catalog"
            className="inline-flex h-11 items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-5 font-medium"
          >
            Browse catalog
          </Link>
        </div>
      </main>
    );
  }
  const { user, enrollments, curriculum, progress, announcements } = data;
  const active = enrollments.filter((e) => e.state === 'active');

  let nextLesson: { id: string; title: string; course: string } | null = null;
  for (const entry of curriculum) {
    for (const m of entry.modules) {
      const l = m.lessons.find((x) => !x.locked && !x.completedAt);
      if (l) {
        nextLesson = { id: l.id, title: l.title, course: entry.course.title };
        break;
      }
    }
    if (nextLesson) break;
  }

  const totalLessons = progress.reduce((a, p) => a + p.totalLessons, 0);
  const doneLessons = progress.reduce((a, p) => a + p.completedLessons, 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Hi, {user.fullName}
          </h1>
          <p className="text-sm text-zinc-500">
            {user.email} — {user.roles.join(', ')}
          </p>
        </div>
        <LogoutButton />
      </div>

      {active.length === 0 ? (
        <Empty
          title="Access pending"
          hint="You have no active enrollment yet. Contact an admin to get enrolled in a batch."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 bg-white dark:bg-zinc-900" aria-label="Active batch">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Active batch
            </h2>
            {active.map((e) => (
              <div key={e.id} className="mb-4 last:mb-0">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {e.courseTitle} — {e.batchName}
                </p>
                <p className="text-sm text-zinc-500">
                  {e.batchCode} · access until {formatDate(e.accessExpiresAt)}
                </p>
              </div>
            ))}
          </section>

          <section className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 bg-white dark:bg-zinc-900" aria-label="Next lesson">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Up next
            </h2>
            {nextLesson ? (
              <div>
                <p className="text-sm text-zinc-500">{nextLesson.course}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{nextLesson.title}</p>
                <Link
                  href={`/lessons/${nextLesson.id}`}
                  className="mt-3 inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm text-white dark:bg-white dark:text-zinc-900 font-medium"
                >
                  Continue →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">All caught up — nothing unlocked.</p>
            )}
          </section>

          <section className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 bg-white dark:bg-zinc-900" aria-label="Completion">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Completion
            </h2>
            <ProgressBar value={doneLessons} max={totalLessons} label="Lessons completed" />
            <Link href="/progress" className="mt-3 inline-block text-sm underline hover:no-underline">
              View details →
            </Link>
          </section>

          <section className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 bg-white dark:bg-zinc-900" aria-label="Announcements">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Announcements
            </h2>
            {announcements.length === 0 ? (
              <p className="text-sm text-zinc-500">No announcements yet.</p>
            ) : (
              <ul className="space-y-2">
                {announcements.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{a.title}</p>
                    <p className="text-xs text-zinc-500">{formatDate(a.publishedAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/announcements" className="mt-3 inline-block text-sm underline hover:no-underline">
              View all →
            </Link>
          </section>
        </div>
      )}

      <nav className="mt-8 flex flex-wrap gap-3" aria-label="Student sections">
        {[
          ['/curriculum', 'Curriculum'],
          ['/live', 'Live classes'],
          ['/recordings', 'Recordings'],
          ['/progress', 'Progress'],
          ['/announcements', 'Announcements'],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
