import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type { Recording } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import Empty from '@/components/Empty';

export default async function RecordingsPage() {
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
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Backend is offline (UI-only mode)</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">API at http://localhost:4000 is unreachable.</p>
        <p className="mt-1 text-xs text-zinc-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <a href="/recordings" className="mt-6 inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium">Retry</a>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Recordings</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Past live classes, available until your access expires.
      </p>
      {recordings.length === 0 ? (
        <Empty title="No recordings yet" hint="Recordings appear after a live class ends and the recording is published." />
      ) : (
        <ul className="space-y-4">
          {recordings.map((r) => (
            <li
              key={r.classId}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 bg-white dark:bg-zinc-900"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{r.title}</p>
              <p className="text-sm text-zinc-500">
                {r.batchName} · {formatDateTime(r.scheduledAt)}
              </p>
              <a
                href={r.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm text-white dark:bg-white dark:text-zinc-900 font-medium"
              >
                Watch recording ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
