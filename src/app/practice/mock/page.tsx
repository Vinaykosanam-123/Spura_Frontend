'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import PracticeSubNav from '@/components/PracticeSubNav';

type MockRow = {
  id: string; difficulty: string; durationMinutes: number; status: string;
  score: number | null; total: number; startedAt: string; endsAt: string;
  companySlug: string | null; companyName: string | null;
};

const DURATIONS = [15, 30, 45, 60, 90];
const DIFFS = ['mixed', 'easy', 'medium', 'hard'] as const;

export default function MockSetupPage() {
  const router = useRouter();
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<string>('mixed');
  const [company, setCompany] = useState('');
  const [companies, setCompanies] = useState<Array<{ slug: string; name: string }>>([]);
  const [history, setHistory] = useState<MockRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.mocks()
      .then((d) => setHistory(d.mocks))
      .catch((e: unknown) => {
        if ((e as ApiError)?.status === 401) router.push('/login');
      });
    api.bankCompanies(undefined, 100)
      .then((d) => setCompanies(d.companies.map((c) => ({ slug: c.slug, name: c.name }))))
      .catch(() => {});
  }, [router]);

  const start = useCallback(async () => {
    setError('');
    setCreating(true);
    try {
      const data = await api.createMock({
        difficulty,
        durationMinutes: duration,
        ...(company.trim() ? { companySlug: company.trim().toLowerCase() } : {}),
      });
      router.push(`/practice/mock/${data.assessment.id}`);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 401) { router.push('/login'); return; }
      if (err?.status === 422) setError('Not enough runnable questions for this selection — try mixed difficulty or no company.');
      else if (err?.status === 403) setError('An active enrollment is required for mocks.');
      else setError(err?.message || 'Could not start mock');
    } finally {
      setCreating(false);
    }
  }, [difficulty, duration, company, router]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Mock assessment</h1>
      <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">
        Pick time, level and company — we build a timed set and score your accepted solutions.
      </p>
      <div className="mt-6">
        <PracticeSubNav />
      </div>

      <div className="card-calm mt-6 rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">New mock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-[13px] font-medium text-stone-600 dark:text-stone-300">Time</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1.5 w-full px-3 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d} minutes</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-stone-600 dark:text-stone-300">Level</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {DIFFS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-stone-600 dark:text-stone-300">Company (optional)</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              list="mock-companies"
              placeholder="Any company"
              className="mt-1.5 w-full px-3 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <datalist id="mock-companies">
              {companies.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </datalist>
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        <button
          onClick={start}
          disabled={creating}
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-7 text-sm text-stone-950 font-semibold transition-colors disabled:opacity-50"
        >
          {creating ? 'Building your set…' : 'Start mock →'}
        </button>
        <p className="mt-2 text-[12px] text-stone-500 dark:text-stone-400">3–10 questions based on duration · solve in the practice editor before time runs out.</p>
      </div>

      {history.length > 0 && (
        <div className="card-calm mt-6 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">Past mocks</h2>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {history.map((m) => (
              <li key={m.id}>
                <Link href={`/practice/mock/${m.id}`} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-stone-900 dark:text-stone-100 capitalize truncate">
                      {m.companyName ?? 'Mixed companies'} · {m.difficulty} · {m.durationMinutes} min
                    </p>
                    <p className="text-[12px] text-stone-500 dark:text-stone-400">
                      {new Date(m.startedAt).toLocaleDateString()} · {m.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] font-semibold px-2.5 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 tabular-nums">
                    {m.score != null ? `${m.score}/${m.total}` : `${m.total} Qs`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
