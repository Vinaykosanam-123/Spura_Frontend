import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type { Announcement } from '@/lib/types';
import { formatDate } from '@/lib/format';
import Empty from '@/components/Empty';

export default async function AnnouncementsPage() {
  let announcements: Announcement[];
  try {
    ({ announcements } = await serverGet<{ announcements: Announcement[] }>(
      '/api/v1/me/announcements'
    ));
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    const msg = e instanceof Error ? e.message : 'Backend unreachable';
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-4xl" aria-hidden="true">🔌</p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Backend is offline (UI-only mode)</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">API at http://localhost:4000 is unreachable.</p>
        <p className="mt-1 text-xs text-zinc-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <a href="/announcements" className="mt-6 inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium">Retry</a>
      </main>
    );
  }

  const sorted = [...announcements].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)
  );

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Announcements</h1>
      {sorted.length === 0 ? (
        <Empty title="No announcements" hint="Check back later for updates from your instructors." />
      ) : (
        <ul className="space-y-4">
          {sorted.map((a) => (
            <li
              key={a.id}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{a.title}</p>
                <time className="text-xs text-zinc-500 whitespace-nowrap">
                  {formatDate(a.publishedAt)}
                </time>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {a.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
