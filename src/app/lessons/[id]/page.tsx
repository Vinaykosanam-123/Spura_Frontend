'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import type { LessonDetail, LessonQuestion } from '@/lib/types';
import { formatDuration } from '@/lib/format';

type Status = 'loading' | 'ready' | 'locked' | 'error';

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const r = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [err, setErr] = useState('');
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [seconds, setSeconds] = useState('120');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setErr('');
    try {
      const { lesson } = await api.lessonDetail(id);
      setLesson(lesson);
      try {
        const q = await api.lessonQuestions(id);
        setQuestions(q.questions ?? []);
      } catch {
        setQuestions([]);
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
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const { progress } = await api.saveProgress(id, parseInt(seconds, 10) || 0);
      setLesson((l) => (l ? { ...l, watchedSeconds: progress.watchedSeconds } : l));
      setMsg(`Saved — watched ${formatDuration(progress.watchedSeconds)}. Refresh to verify.`);
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
      setLesson((l) => (l ? { ...l, completedAt: progress.completedAt } : l));
      setMsg('Marked complete.');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Complete failed');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12" aria-busy="true">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
        </div>
      </main>
    );
  }

  if (status === 'locked') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-4xl" aria-hidden="true">🔒</p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Lesson locked</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{err}</p>
        <Link
          href="/curriculum"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium"
        >
          ← Back to curriculum
        </Link>
      </main>
    );
  }

  if (status === 'error' || !lesson) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400" role="alert">
          <p className="font-medium">Couldn&apos;t load lesson</p>
          <p className="text-sm mt-1">{err}</p>
          <button onClick={load} className="mt-2 text-sm underline hover:no-underline">Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/curriculum" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        ← Back to curriculum
      </Link>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{lesson.title}</h1>
        {lesson.completedAt && (
          <span className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            ✅ Completed
          </span>
        )}
      </div>
      {lesson.description && (
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">{lesson.description}</p>
      )}
      <p className="mt-2 text-sm text-zinc-500">
        {lesson.type} · {formatDuration(lesson.durationSeconds)} · watched{' '}
        {formatDuration(lesson.watchedSeconds)}
      </p>

      <section className="mt-8 border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 bg-white dark:bg-zinc-900" aria-label="Track progress">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Track progress</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-2 text-sm">
            Watched (seconds)
            <input
              type="number"
              min={0}
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="w-28 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800"
            />
          </label>
          <button
            onClick={save}
            disabled={busy}
            className="h-10 px-5 rounded-full border border-zinc-300 dark:border-zinc-700 font-medium text-sm disabled:opacity-50"
          >
            Save progress
          </button>
          <button
            onClick={complete}
            disabled={busy}
            className="h-10 px-5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium text-sm disabled:opacity-50"
          >
            Mark complete
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400" role="status">{msg}</p>}
      </section>

      {lesson.resources.length > 0 && (
        <section className="mt-8" aria-label="Resources">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Resources</h2>
          <ul className="space-y-2">
            {lesson.resources.map((res) => (
              <li key={res.id}>
                <a
                  href={res.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline hover:no-underline"
                >
                  {res.title} ({res.contentType}) ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-label="Practice questions">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Practice</h2>
        {questions.length === 0 ? (
          <p className="text-sm text-zinc-500">No practice questions for this lesson.</p>
        ) : (
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.id}>
                <Link href={`/questions/${q.id}`} className="text-sm underline hover:no-underline">
                  {q.title} — {q.difficulty}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
