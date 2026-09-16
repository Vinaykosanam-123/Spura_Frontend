'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import type { LiveClass } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import Empty from '@/components/Empty';

export default function LivePage() {
  const r = useRouter();
  const [live, setLive] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fired, setFired] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { live } = await api.upcoming();
      setLive(live ?? []);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 401) {
        r.push('/login');
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load live classes');
    } finally {
      setLoading(false);
    }
  }, [r]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async (c: LiveClass) => {
    if (c.meetingUrl) window.open(c.meetingUrl, '_blank', 'noopener');
    if (fired[c.id]) return;
    setFired((f) => ({ ...f, [c.id]: true }));
    try {
      await api.attendance(c.id);
      setMsg((m) => ({ ...m, [c.id]: 'Attendance recorded ✅' }));
    } catch (e: unknown) {
      setMsg((m) => ({
        ...m,
        [c.id]: e instanceof Error ? e.message : 'Attendance failed',
      }));
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Live classes</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">Upcoming sessions for your batches.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400" role="alert">
          <p>{error}</p>
          <button onClick={load} className="mt-2 text-sm underline hover:no-underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse border border-zinc-200 dark:border-zinc-700 rounded-lg p-5">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : live.length === 0 ? (
        <Empty title="No upcoming classes" hint="New live sessions will appear here." />
      ) : (
        <ul className="space-y-4">
          {live.map((c) => (
            <li
              key={c.id}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{c.title}</p>
                  <p className="text-sm text-zinc-500">
                    {c.courseTitle} · {c.batchName} · {c.status}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {formatDateTime(c.scheduledAt)} → {formatDateTime(c.endsAt)}
                  </p>
                </div>
                <button
                  onClick={() => join(c)}
                  disabled={!c.meetingUrl && fired[c.id]}
                  className="h-10 px-5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium text-sm disabled:opacity-50"
                >
                  {fired[c.id] ? 'Joined' : 'Join'}
                </button>
              </div>
              {!c.meetingUrl && (
                <p className="mt-2 text-xs text-zinc-500">Meeting link not published yet.</p>
              )}
              {msg[c.id] && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400" role="status">
                  {msg[c.id]}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
