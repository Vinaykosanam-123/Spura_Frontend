import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type { Recording } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import Empty from '@/components/Empty';

const PAGE_SIZE = 10;

export default async function RecordingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  let recordings: Recording[];
  try {
    ({ recordings } = await serverGet<{ recordings: Recording[] }>(
      '/api/v1/me/recordings'
    ));
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    const msg = e instanceof Error ? e.message : 'Backend unreachable';
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-4xl" aria-hidden="true">🔌</p>
        <h1 className="mt-4 text-2xl font-bold text-stone-900 dark:text-stone-100">Recordings are temporarily unavailable</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Could not reach the SPURA API server.</p>
        <p className="mt-1 text-xs text-stone-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <Link href="/my/recordings" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors">Retry</Link>
      </main>
    );
  }

  const totalPages = Math.ceil(recordings.length / PAGE_SIZE);
  const paginated = recordings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Recordings</h1>
      <p className="text-stone-600 dark:text-stone-400 mb-6">
        Past live classes, available until your access expires.
      </p>
      {recordings.length === 0 ? (
        <Empty title="No recordings yet" hint="Recordings appear after a live class ends and the recording is published." />
      ) : (
        <>
          <ul className="space-y-4">
            {paginated.map((r) => (
              <li
                key={r.classId}
                className="card-calm rounded-2xl p-5"
              >
                <p className="font-medium text-stone-900 dark:text-stone-100">{r.title}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {r.batchName} · {formatDateTime(r.scheduledAt)}
                </p>
                <a
                  href={r.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-10 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors"
                >
                  Watch recording ↗
                </a>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/my/recordings?page=${p}`}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                    p === page
                      ? 'bg-amber-500 text-stone-950'
                      : 'border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
