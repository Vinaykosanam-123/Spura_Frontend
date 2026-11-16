'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { FeedbackItem } from '@/lib/types';
import { formatDate } from '@/lib/format';
import Guard from '@/components/Guard';
import Empty from '@/components/Empty';

const CATS = ['all', 'suggestion', 'bug', 'content', 'other'] as const;
const STATUSES = ['open', 'under_review', 'resolved', 'closed'] as const;

export default function AdminFeedback() {
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [cat, setCat] = useState<(typeof CATS)[number]>('all');
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { feedback } = await api.adminFeedback();
      setList(feedback ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.adminFeedback()
      .then(({ feedback }) => {
        if (active) setList(feedback ?? []);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUpdate = async (
    f: FeedbackItem,
    nextStatus?: (typeof STATUSES)[number],
    replyText?: string,
  ) => {
    setBusyId(f.id);
    setError('');
    try {
      await api.reviewFeedback(f.id, {
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(replyText !== undefined ? { adminResponse: replyText } : {}),
      });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const shown = cat === 'all' ? list : list.filter((f) => f.category === cat);
  const counts = CATS.map((c) => ({
    c,
    n: c === 'all' ? list.length : list.filter((f) => f.category === c).length,
  }));

  return (
    <Guard requireAdmin allowInstructor={false}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Feedback inbox
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mb-6">{list.length} messages from students.</p>
        {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Category filter">
          {counts.map(({ c, n }) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${cat === c ? 'bg-amber-500 text-stone-950 border-transparent' : 'border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5'}`}
            >
              {c} ({n})
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <Empty title="Nothing here" hint="No feedback in this category yet." />
        ) : (
          <ul className="space-y-4">
            {shown.map((f) => (
              <li key={f.id} className="card-calm rounded-2xl p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {f.fullName} <span className="font-normal text-stone-500">· {f.email}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {f.category}
                    </span>
                    <select
                      value={f.status ?? 'open'}
                      disabled={busyId === f.id}
                      onChange={(e) =>
                        handleUpdate(f, e.target.value as (typeof STATUSES)[number])
                      }
                      aria-label={`Status for feedback ${f.id}`}
                      className="text-xs px-2.5 py-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{f.message}</p>
                <p className="mt-2 text-xs text-stone-500">{formatDate(f.createdAt)}</p>

                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-white/10 flex gap-2">
                  <input
                    value={replyDrafts[f.id] ?? f.adminResponse ?? ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [f.id]: e.target.value }))
                    }
                    placeholder="Write admin response…"
                    className="flex-1 px-3 py-1.5 border border-stone-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#06080B] text-xs"
                  />
                  <button
                    type="button"
                    disabled={busyId === f.id}
                    onClick={() =>
                      handleUpdate(
                        f,
                        (f.status as (typeof STATUSES)[number]) ?? 'resolved',
                        (replyDrafts[f.id] ?? f.adminResponse ?? '').trim(),
                      )
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Save reply
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </Guard>
  );
}
