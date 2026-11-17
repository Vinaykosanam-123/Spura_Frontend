'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import { recordActivity } from '@/lib/activity';
import type { LessonDetail, LessonQuestion } from '@/lib/types';
import { formatDuration } from '@/lib/format';

type Status = 'loading' | 'ready' | 'locked' | 'error';

const QUICK_MINUTES = [5, 15, 30];

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const r = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [err, setErr] = useState('');
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null);
  const [position, setPosition] = useState<{ index: number; total: number } | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    await Promise.resolve();
    setStatus('loading');
    setErr('');
    setNextLesson(null);
    try {
      const { lesson } = await api.lessonDetail(id);
      setLesson(lesson);
      try {
        const q = await api.lessonQuestions(id);
        setQuestions(q.questions ?? []);
      } catch {
        setQuestions([]);
      }
      try {
        const { curriculum } = await api.curriculum();
        const flat: { id: string; title: string; locked: boolean; completedAt?: string | null }[] = [];
        for (const entry of curriculum) {
          const mods = [...entry.modules].sort((a, b) => a.sequence - b.sequence);
          for (const m of mods) {
            const ls = [...m.lessons].sort((a, b) => a.sequence - b.sequence);
            for (const l of ls) flat.push(l);
          }
        }
        const idx = flat.findIndex((l) => l.id === id);
        if (idx >= 0) setPosition({ index: idx + 1, total: flat.length });
        const next =
          (idx >= 0 ? flat.slice(idx + 1).find((l) => !l.locked) : flat.find((l) => !l.locked && !l.completedAt)) ??
          null;
        if (next && next.id !== id) setNextLesson({ id: next.id, title: next.title });
      } catch {
        // curriculum optional
      }
      setStatus('ready');
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 401) {
        r.push('/login');
        return;
      }
      if (err?.status === 403) {
        setStatus('locked');
        setErr(err.code === 'LESSON_LOCKED'
          ? 'This lesson is locked — complete its prerequisites first.'
          : 'This lesson is unavailable for your enrollment.');
        return;
      }
      setStatus('error');
      setErr(e instanceof Error ? e.message : 'Failed to load lesson');
    }
  }, [id, r]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { lesson } = await api.lessonDetail(id);
        if (!active) return;
        setLesson(lesson);
        try {
          const q = await api.lessonQuestions(id);
          if (active) setQuestions(q.questions ?? []);
        } catch {
          if (active) setQuestions([]);
        }
        try {
          const { curriculum } = await api.curriculum();
          if (!active) return;
          const flat: { id: string; title: string; locked: boolean; completedAt?: string | null }[] = [];
          for (const entry of curriculum) {
            const mods = [...entry.modules].sort((a, b) => a.sequence - b.sequence);
            for (const m of mods) {
              const ls = [...m.lessons].sort((a, b) => a.sequence - b.sequence);
              for (const l of ls) flat.push(l);
            }
          }
          const idx = flat.findIndex((l) => l.id === id);
          if (idx >= 0) setPosition({ index: idx + 1, total: flat.length });
          const next =
            (idx >= 0 ? flat.slice(idx + 1).find((l) => !l.locked) : flat.find((l) => !l.locked && !l.completedAt)) ??
            null;
          if (next && next.id !== id) setNextLesson({ id: next.id, title: next.title });
          else setNextLesson(null);
        } catch {
          // curriculum optional
        }
        if (active) setStatus('ready');
      } catch (e: unknown) {
        if (!active) return;
        const err = e as ApiError;
        if (err?.status === 401) {
          r.push('/login');
          return;
        }
        if (err?.status === 403) {
          setStatus('locked');
          setErr(err.code === 'LESSON_LOCKED'
            ? 'This lesson is locked — complete its prerequisites first.'
            : 'This lesson is unavailable for your enrollment.');
          return;
        }
        setStatus('error');
        setErr(e instanceof Error ? e.message : 'Failed to load lesson');
      }
    })();
    return () => {
      active = false;
    };
  }, [id, r]);

  const logMinutes = async (minutes: number) => {
    if (!lesson) return;
    setBusy(true);
    setMsg('');
    try {
      const next = lesson.watchedSeconds + minutes * 60;
      const { progress } = await api.saveProgress(id, next);
      recordActivity({ minutes });
      setLesson((l) => (l ? { ...l, watchedSeconds: progress.watchedSeconds } : l));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSavedAt(now);
      setMsg(`Logged ${minutes} min · total ${formatDuration(progress.watchedSeconds)} · saved ${now}.`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    setBusy(true);
    setMsg('');
    try {
      const { progress } = await api.completeLesson(id);
      recordActivity({ lessons: 1 });
      setLesson((l) => (l ? { ...l, completedAt: progress.completedAt } : l));
      setMsg(nextLesson ? 'Marked complete — ready for the next one below.' : 'Marked complete.');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Complete failed');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12" aria-busy="true">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
          <div className="h-9 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
          <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-full" />
          <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-2/3" />
        </div>
      </main>
    );
  }

  if (status === 'locked') {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-[26px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Lesson locked</h1>
        <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">{err}</p>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Complete the previous lessons in order to unlock this one — your progress saves automatically.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/my/curriculum"
            className="inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors"
          >
            Back to curriculum
          </Link>
          <Link
            href="/my"
            className="inline-flex h-11 items-center rounded-xl border border-stone-200 dark:border-white/10 px-5 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (status === 'error' || !lesson) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300" role="alert">
          <p className="font-medium">Couldn&apos;t load lesson</p>
          <p className="text-sm mt-1">{err}</p>
          <button onClick={load} className="mt-2 text-sm underline hover:no-underline">Retry</button>
        </div>
      </main>
    );
  }

  const watchedPct = lesson.durationSeconds ? Math.min(100, Math.round((lesson.watchedSeconds / lesson.durationSeconds) * 100)) : 0;
  const visualizer = (() => {
    const title = lesson.title.toLowerCase();
    if (title.includes('avl')) return { href: '/visualize?tab=avl', label: 'AVL tree rotations' };
    if (title.includes('trie') || title.includes('prefix tree')) return { href: '/visualize?tab=trie', label: 'trie prefix trees' };
    if (title.includes('heap') || title.includes('priority queue')) return { href: '/visualize?tab=heap', label: 'binary heaps' };
    if (title.includes('tree') || title.includes('bst')) return { href: '/visualize?tab=bst', label: 'binary search trees' };
    if (title.includes('graph') || title.includes('bfs') || title.includes('dfs') || title.includes('dijkstra')) return { href: '/visualize?tab=graph', label: 'graph traversal' };
    if (title.includes('sort')) return { href: '/visualize?tab=sorting', label: 'sorting algorithms' };
    if (title.includes('stack') || title.includes('queue')) return { href: '/visualize?tab=stack-queue', label: 'stacks and queues' };
    if (title.includes('linked')) return { href: '/visualize?tab=linked-list', label: 'linked lists' };
    if (title.includes('hash')) return { href: '/visualize?tab=hash', label: 'hash tables' };
    if (title.includes('dp') || title.includes('dynamic programming') || title.includes('knapsack')) return { href: '/visualize?tab=dp', label: 'dynamic programming' };
    if (title.includes('recurs') || title.includes('backtrack')) return { href: '/visualize?tab=recursion', label: 'recursion call trees' };
    return { href: '/visualize', label: 'data structures' };
  })();

  const videoInfo = (() => {
    const raw = lesson.videoProviderId?.trim();
    if (!raw) return null;
    try {
      const u = new URL(raw);
      const host = u.hostname.toLowerCase();
      if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
        const v = u.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{6,}$/.test(v)) {
          return { kind: 'embed' as const, url: `https://www.youtube.com/embed/${encodeURIComponent(v)}` };
        }
      }
      if (host === 'youtu.be') {
        const v = u.pathname.replace(/^\//, '');
        if (v && /^[a-zA-Z0-9_-]{6,}$/.test(v)) {
          return { kind: 'embed' as const, url: `https://www.youtube.com/embed/${encodeURIComponent(v)}` };
        }
      }
      if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
        const v = u.pathname.replace(/^\/(video\/)?/, '');
        if (/^\d+$/.test(v)) {
          return { kind: 'embed' as const, url: `https://player.vimeo.com/video/${v}` };
        }
      }
      if (u.protocol === 'https:' || u.protocol === 'http:') {
        return { kind: 'link' as const, url: raw };
      }
    } catch {
      // Non-URL provider ID
    }
    return null;
  })();

  const embedVideoUrl = videoInfo?.url ?? null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
      {/* Focus top bar */}
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <Link href="/my/curriculum" className="font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">
          ← Curriculum
        </Link>
        {position && (
          <span className="text-stone-400 dark:text-stone-500 tabular-nums">
            Step {position.index} of {position.total}
          </span>
        )}
      </div>

      <article className="study-prose mt-6">
        <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.02em] leading-[1.2] text-stone-900 dark:text-stone-50">
          {lesson.title}
        </h1>
        {lesson.completedAt && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-3 py-1 text-[13px] font-medium text-emerald-800 dark:text-emerald-300">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            Completed
          </p>
        )}
        {lesson.description && (
          <p className="mt-4 text-[16px] leading-relaxed text-stone-600 dark:text-stone-300">{lesson.description}</p>
        )}
        <p className="mt-3 text-[13px] text-stone-500 dark:text-stone-400">
          {lesson.type} · {formatDuration(lesson.durationSeconds ?? 0)} · watched {formatDuration(lesson.watchedSeconds)}
          {savedAt && <span className="ml-2 text-emerald-700 dark:text-emerald-400">· Saved {savedAt}</span>}
        </p>
        {lesson.durationSeconds ? (
          <div className="mt-4 h-1.5 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={watchedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Watched progress">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${watchedPct}%` }} />
          </div>
        ) : null}
      </article>

      {embedVideoUrl && videoInfo && (
        <section className="mt-8 card-calm rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10" aria-label="Lesson video">
          {videoInfo.kind === 'embed' ? (
            <div className="aspect-video w-full bg-black">
              <iframe
                src={embedVideoUrl}
                title={lesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">Lecture Video Resource</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-md">{embedVideoUrl}</p>
              </div>
              <a
                href={embedVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-4 text-sm font-semibold text-stone-950 transition-colors"
              >
                Watch video ↗
              </a>
            </div>
          )}
        </section>
      )}

      {/* Study actions — no typing, one tap */}
      <section className="card-calm mt-8 rounded-2xl p-5 sm:p-6" aria-label="Log study time">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Log study time</h2>
          <p className="text-[13px] text-stone-500 dark:text-stone-400">Phone away · 25 min focus</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_MINUTES.map((m) => (
            <button
              key={m}
              onClick={() => logMinutes(m)}
              disabled={busy}
              className="h-10 px-4 rounded-xl border border-stone-200 dark:border-white/10 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              +{m} min
            </button>
          ))}
          <button
            onClick={complete}
            disabled={busy}
            className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            Mark complete
          </button>
        </div>
        {msg && <p className="mt-3 text-[13px] text-stone-600 dark:text-stone-400" role="status">{msg}</p>}
        {!msg && savedAt && (
          <p className="mt-3 text-[13px] text-stone-500" role="status">Last saved {savedAt} — safe to leave.</p>
        )}
      </section>

      <section aria-label="Interactive visualizer" className="mt-6">
        <Link
          href={visualizer.href}
          className="card-calm card-calm-hover flex items-center gap-4 rounded-2xl p-4 sm:p-5"
        >
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-[18px] text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            ◇
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
              Interactive visualizer
            </span>
            <span className="mt-0.5 block text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              See {visualizer.label} move
            </span>
            <span className="mt-0.5 block text-[13px] text-stone-600 dark:text-stone-400">
              Play, pause and step through every comparison and pointer change.
            </span>
          </span>
          <span className="shrink-0 text-[13px] font-medium text-amber-600 dark:text-amber-400">Open →</span>
        </Link>
      </section>

      {nextLesson && (
        <section aria-label="Next lesson" className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">Next up</p>
            <p className="mt-1 truncate font-semibold tracking-tight text-stone-900 dark:text-stone-50">{nextLesson.title}</p>
          </div>
          <Link
            href={`/my/lessons/${nextLesson.id}`}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-6 text-sm text-stone-950 font-semibold transition-colors"
          >
            Next lesson →
          </Link>
        </section>
      )}

      {lesson.resources.length > 0 && (
        <section className="mt-10" aria-label="Resources">
          <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-3">Resources</h2>
          <ul className="space-y-2">
            {lesson.resources.map((res) => (
              <li key={res.id}>
                <a
                  href={res.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-calm card-calm-hover flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-stone-900 dark:text-stone-100">{res.title}</span>
                    <span className="text-[12px] text-stone-500 dark:text-stone-400">{res.contentType}</span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-stone-400">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-label="Practice questions">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Practice</h2>
          <p className="text-[13px] text-stone-500 dark:text-stone-400">Stay here — no context switch</p>
        </div>
        {questions.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">No practice questions for this lesson yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {questions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/practice/${q.id}`}
                  className="card-calm card-calm-hover flex items-center justify-between gap-3 rounded-xl px-4 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-stone-900 dark:text-stone-100">{q.title}</span>
                    <span className="text-[12px] text-stone-500 dark:text-stone-400">{[q.topic, q.difficulty].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="shrink-0 rounded-xl border border-stone-200 dark:border-white/10 px-2.5 py-1 text-[12px] font-medium text-amber-700 dark:text-amber-400">Practice →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
