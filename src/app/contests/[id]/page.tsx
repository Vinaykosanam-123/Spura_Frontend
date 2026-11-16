'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';

type CQ = { id: string; slug: string; title: string; topic: string; difficulty: string };
type Entry = { name: string; score: number; finishedAt: string | null };

export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [state, setState] = useState('');
  const [questions, setQuestions] = useState<CQ[]>([]);
  const [board, setBoard] = useState<Entry[]>([]);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [meta, setMeta] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.contestDetail(id);
      setTitle(d.contest.title);
      setState(d.contest.state);
      setQuestions(d.questions);
      setBoard(d.leaderboard);
      setMyScore(d.myScore);
      setJoined(Boolean(d.joined || d.myScore != null));
      setMeta(`${d.contest.difficulty} · ${d.contest.durationMinutes} min${d.contest.companyName ? ` · ${d.contest.companyName}` : ''}`);
    } catch (e: unknown) {
      if ((e as ApiError)?.status === 401) { router.push('/login'); return; }
      setError(e instanceof Error ? e.message : 'Could not load contest');
    }
  }, [id, router]);

  useEffect(() => {
    let active = true;
    const sync = () => {
      api
        .contestDetail(id)
        .then((d) => {
          if (!active) return;
          setTitle(d.contest.title);
          setState(d.contest.state);
          setQuestions(d.questions);
          setBoard(d.leaderboard);
          setMyScore(d.myScore);
          setMeta(`${d.contest.difficulty} · ${d.contest.durationMinutes} min${d.contest.companyName ? ` · ${d.contest.companyName}` : ''}`);
        })
        .catch((e: unknown) => {
          if (!active) return;
          if ((e as ApiError)?.status === 401) { router.push('/login'); return; }
          setError(e instanceof Error ? e.message : 'Could not load contest');
        });
    };
    sync();
    const t = setInterval(sync, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [id, router]);

  const join = useCallback(async () => {
    setJoining(true);
    setError('');
    try {
      await api.joinContest(id);
      setJoined(true);
      await load();
    } catch (e: unknown) {
      if ((e as ApiError)?.status === 401) { router.push('/login'); return; }
      setError(e instanceof Error ? e.message : 'Could not join contest');
    } finally {
      setJoining(false);
    }
  }, [id, router, load]);

  if (error && !title) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-600 dark:text-stone-300">{error}</p>
        <Link href="/contests" className="mt-4 inline-block text-sm font-medium text-amber-400 underline underline-offset-4">Back to contests</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
      <Link href="/contests" className="text-sm text-stone-500 dark:text-slate-400 hover:text-amber-400">← All contests</Link>
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${state === 'live' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-200/70 dark:bg-white/10 text-stone-600 dark:text-slate-300'}`}>
          {state || '…'}
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">{title || 'Loading…'}</h1>
      </div>
      {meta && <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400 capitalize">{meta}</p>}

      {state === 'live' && !joined && (
        <button
          onClick={join}
          disabled={joining}
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-6 text-sm text-stone-950 font-semibold transition-colors disabled:opacity-50"
        >
          {joining ? 'Joining…' : 'Join contest →'}
        </button>
      )}
      {(joined || myScore != null) && state === 'live' && (
        <p className="mt-4 text-sm font-medium text-stone-900 dark:text-stone-100 tabular-nums">
          Your score: {myScore ?? 0}/{questions.length} — solve below before it ends.
        </p>
      )}
      {state === 'ended' && myScore != null && (
        <p className="mt-4 text-sm font-medium text-stone-900 dark:text-stone-100 tabular-nums">
          Your final score: {myScore}/{questions.length}
        </p>
      )}

      <h2 className="mt-8 text-[16px] font-semibold text-stone-900 dark:text-stone-50">Questions</h2>
      <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800 card-calm rounded-2xl overflow-hidden">
        {questions.map((q, i) => (
          <li key={q.id}>
            <Link
              href={state === 'upcoming' ? `/contests/${id}` : `/practice/${q.id}`}
              className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors"
            >
              <span className="w-6 shrink-0 text-[13px] font-semibold text-stone-400 tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-stone-900 dark:text-stone-100 truncate">{q.title}</p>
                <p className="text-[12px] text-stone-500 dark:text-stone-400 capitalize">{q.difficulty} · {q.topic}</p>
              </div>
              {state !== 'upcoming' && <span className="text-sm text-stone-400">→</span>}
            </Link>
          </li>
        ))}
      </ul>

      {board.length > 0 && (
        <>
          <h2 className="mt-8 text-[16px] font-semibold text-stone-900 dark:text-stone-50">Leaderboard</h2>
          <ul className="mt-3 card-calm rounded-2xl p-2">
            {board.map((e, i) => (
              <li key={`${e.name}-${i}`} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="w-6 shrink-0 text-[13px] font-bold text-stone-400 tabular-nums">{i + 1}</span>
                <span className="flex-1 min-w-0 truncate text-stone-800 dark:text-stone-200">{e.name}</span>
                <span className="shrink-0 text-[13px] font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{e.score}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
