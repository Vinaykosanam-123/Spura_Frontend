'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';

type MockQ = { id: string; slug: string; title: string; topic: string; difficulty: string; solved: boolean };
type Mock = {
  id: string; difficulty: string; durationMinutes: number; status: string;
  score: number | null; startedAt: string; endsAt: string;
  companySlug: string | null; companyName: string | null; questions: MockQ[];
};

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function MockRunPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mock, setMock] = useState<Mock | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const d = await api.mockDetail(id);
      setMock(d.assessment);
    } catch (e: unknown) {
      if ((e as ApiError)?.status === 401) { router.push('/login'); return; }
      setError(e instanceof Error ? e.message : 'Could not load mock');
    }
  }, [id, router]);

  useEffect(() => {
    let active = true;
    const sync = () => {
      api
        .mockDetail(id)
        .then((d) => {
          if (active) setMock(d.assessment);
        })
        .catch((e: unknown) => {
          if (!active) return;
          if ((e as ApiError)?.status === 401) { router.push('/login'); return; }
          setError(e instanceof Error ? e.message : 'Could not load mock');
        });
    };
    sync();
    const t = setInterval(sync, 20000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { active = false; clearInterval(t); clearInterval(clock); };
  }, [id, router]);

  if (error && !mock) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-600 dark:text-stone-300">{error}</p>
        <Link href="/practice/mock" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">Back to mocks</Link>
      </main>
    );
  }
  if (!mock) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-500">Loading your mock…</p>
      </main>
    );
  }

  const left = new Date(mock.endsAt).getTime() - now;
  const live = mock.status === 'active' && left > 0;
  const solved = mock.questions.filter((q) => q.solved).length;
  const total = mock.questions.length;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
      <Link href="/practice/mock" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">← All mocks</Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 capitalize">
            {mock.companyName ?? 'Mixed'} · {mock.difficulty} mock
          </h1>
          <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400">
            {mock.durationMinutes} minutes · {solved}/{total} solved
          </p>
        </div>
        <div className={`shrink-0 px-4 py-2 rounded-xl text-[15px] font-semibold tabular-nums border ${live ? 'border-amber-500/40 bg-amber-500/15 text-amber-300' : 'border-stone-200 dark:border-white/10 text-stone-500'}`} aria-live="polite">
          {live ? `⏳ ${fmt(left)}` : mock.status === 'completed' ? 'Finished' : 'Expired'}
        </div>
      </div>

      {!live && (
        <div className="card-calm mt-6 rounded-2xl p-6 text-center">
          <p className="text-[13px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">Final score</p>
          <p className="mt-1 text-[34px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 tabular-nums">
            {mock.score ?? solved}<span className="text-stone-400">/{total}</span>
          </p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {(mock.score ?? solved) === total ? 'Flawless run.' : 'Review the unsolved ones and retry the set.'}
          </p>
        </div>
      )}

      <ul className="mt-6 divide-y divide-stone-100 dark:divide-white/10 card-calm rounded-2xl overflow-hidden">
        {mock.questions.map((q, i) => (
          <li key={q.id}>
            <Link href={live ? `/practice/${q.id}` : `/practice/${q.id}`} className="px-5 py-4 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${q.solved ? 'bg-emerald-500 text-stone-950' : 'bg-stone-200/70 dark:bg-white/10 text-stone-500 dark:text-slate-400'}`}>
                {q.solved ? '✓' : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-stone-900 dark:text-stone-100 truncate">{q.title}</p>
                <p className="text-[12px] text-stone-500 dark:text-stone-400 capitalize">{q.difficulty} · {q.topic}</p>
              </div>
              <span className="shrink-0 text-sm text-stone-400">→</span>
            </Link>
          </li>
        ))}
      </ul>
      {live && (
        <button
          onClick={() => { void load(); }}
          className="mt-4 text-[13px] font-medium text-stone-500 dark:text-slate-400 hover:text-amber-400 border border-stone-200 dark:border-white/10 rounded-xl px-3.5 py-1.5 transition-colors"
        >
          Refresh solved status
        </button>
      )}
      <p className="mt-3 text-[12px] text-stone-500 dark:text-stone-400">
        Solve in the practice editor — accepted solutions inside the window count automatically.
      </p>
    </main>
  );
}
