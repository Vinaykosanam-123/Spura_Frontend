import Link from 'next/link';
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
        <h1 className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">Announcements are temporarily unavailable</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Could not reach the SPURA API server.</p>
        <p className="mt-1 text-xs text-stone-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <Link href="/my/announcements" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors">Retry</Link>
      </main>
    );
  }

  const sorted = [...announcements].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)
  );

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">Announcements</h1>
      {sorted.length === 0 ? (
        <Empty title="No announcements" hint="Check back later for updates from your instructors." />
      ) : (
        <ul className="space-y-4">
          {sorted.map((a) => (
            <li
              key={a.id}
              className="card-calm rounded-2xl p-5"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium text-stone-900 dark:text-stone-100">{a.title}</p>
                <time className="text-xs text-stone-500 whitespace-nowrap">
                  {formatDate(a.publishedAt)}
                </time>
              </div>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 whitespace-pre-wrap">
                {a.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
