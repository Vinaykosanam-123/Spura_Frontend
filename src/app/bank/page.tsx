import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isForbidden, isUnauthorized, serverGet } from '@/lib/server';
import Empty from '@/components/Empty';
import BankRow, { type BankRowQ } from '@/components/BankRow';
import ActivityCalendar from '@/components/ActivityCalendar';

const DIFFS = ['easy', 'medium', 'hard'] as const;
const PAGE_SIZE = 50;

type Company = { id: string; slug: string; name: string; oaCount: number; practiceCount: number };

export default async function BankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; difficulty?: string; topic?: string; solved?: string; page?: string }>;
}) {
  const { q, difficulty, topic, solved: solvedFilter, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const params = new URLSearchParams({ limit: '1000' });
  if (q) params.set('q', q);
  if (difficulty) params.set('difficulty', difficulty);
  if (topic) params.set('topic', topic);
  if (solvedFilter === 'true' || solvedFilter === 'false') params.set('solved', solvedFilter);
  let questions: BankRowQ[];
  let companies: Company[] = [];
  try {
    const [qRes, cRes] = await Promise.all([
      serverGet<{ questions: BankRowQ[] }>(`/api/v1/me/bank/questions?${params.toString()}`),
      serverGet<{ companies: Company[] }>('/api/v1/me/bank/companies?limit=8').catch(() => ({ companies: [] as Company[] })),
    ]);
    questions = qRes.questions;
    companies = cRes.companies;
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    if (isForbidden(e)) {
      return (
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Active enrollment required</h1>
          <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Enroll in an open SPURA batch to unlock the 450+ curated problem bank and company sheets.</p>
          <Link href="/courses" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors">Browse courses</Link>
        </main>
      );
    }
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Bank is temporarily unavailable</h1>
        <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Could not reach the SPURA API server. Please ensure the backend service is running.</p>
        <Link href="/bank" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors">Retry</Link>
      </main>
    );
  }

  const topics = Array.from(new Set(questions.map((item) => item.topic))).sort();
  const topicCounts = new Map<string, number>();
  for (const item of questions) topicCounts.set(item.topic, (topicCounts.get(item.topic) ?? 0) + 1);
  const solved = questions.filter((item) => item.solved).length;
  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedQuestions = questions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const keep = {
    ...(q ? { q } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(solvedFilter ? { solved: solvedFilter } : {}),
  };
  const withTopic = (t?: string) =>
    `/bank?${new URLSearchParams({ ...keep, ...(t ? { topic: t } : {}) }).toString()}`;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        {/* Main column */}
        <div className="min-w-0">
          {/* Topic chips with counts */}
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Topic filter">
            {[{ t: undefined, label: 'All', n: questions.length }, ...topics.map((t) => ({ t, label: t.replace(/-/g, ' '), n: topicCounts.get(t) ?? 0 }))].map(({ t, label, n }) => (
              <Link
                key={label}
                href={withTopic(t)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors capitalize ${(t ?? '') === (topic ?? '') ? 'bg-amber-500 text-stone-950 font-semibold border-transparent' : 'border-stone-200 dark:border-white/10 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-white/5'}`}
              >
                {label} <span className="opacity-65 text-[11px]">{n}</span>
              </Link>
            ))}
          </div>

          {/* Search + solved counter */}
          <div className="mt-4 flex items-center gap-4">
            <form action="/bank" method="get" className="flex-1">
              <input
                name="q"
                defaultValue={q ?? ''}
                placeholder="Search questions"
                className="w-full px-4 py-2.5 border border-stone-200 dark:border-white/10 rounded-xl bg-stone-100 dark:bg-[#0F1319] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {difficulty && <input type="hidden" name="difficulty" value={difficulty} />}
              {topic && <input type="hidden" name="topic" value={topic} />}
            </form>
            <p className="shrink-0 text-[14px] tabular-nums text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-amber-500 dark:text-amber-400">{solved}</span>/{questions.length} Solved
            </p>
          </div>

          {/* Difficulty filter */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]" role="group" aria-label="Difficulty filter">
            <Link href={withTopic(topic)} className={!difficulty ? 'font-semibold text-amber-500 dark:text-amber-400 underline underline-offset-4' : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'}>All</Link>
            {DIFFS.map((d) => (
              <Link
                key={d}
                href={`/bank?${new URLSearchParams({ ...keep, ...(topic ? { topic } : {}), difficulty: d }).toString()}`}
                className={`capitalize ${difficulty === d ? 'font-semibold text-amber-500 dark:text-amber-400 underline underline-offset-4' : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'}`}
              >
                {d === 'medium' ? 'Med.' : d}
              </Link>
            ))}
            <span className="text-stone-300 dark:text-white/10">|</span>
            {[
              { val: undefined, label: 'Any status' },
              { val: 'true', label: 'Solved' },
              { val: 'false', label: 'Unsolved' },
            ].map(({ val, label }) => (
              <Link
                key={label}
                href={`/bank?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  ...(difficulty ? { difficulty } : {}),
                  ...(topic ? { topic } : {}),
                  ...(val ? { solved: val } : {}),
                }).toString()}`}
                className={
                  (solvedFilter ?? undefined) === val
                    ? 'font-semibold text-amber-500 dark:text-amber-400 underline underline-offset-4'
                    : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }
              >
                {label}
              </Link>
            ))}
            {(q || topic || difficulty || solvedFilter) && (
              <Link href="/bank" className="ml-auto text-stone-500 dark:text-slate-400 hover:text-amber-400 underline underline-offset-4">
                Clear filters
              </Link>
            )}
          </div>

          {pagedQuestions.length === 0 ? (
            <div className="mt-8"><Empty title="No questions found" hint="Try a different search or filter." /></div>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-stone-100 dark:divide-white/10 card-calm rounded-2xl overflow-hidden">
                {pagedQuestions.map((item) => (
                  <BankRow key={item.id} q={item} />
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span>
                    Page {currentPage} of {totalPages} ({questions.length} problems)
                  </span>
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <Link
                        href={`/bank?${new URLSearchParams({
                          ...keep,
                          ...(topic ? { topic } : {}),
                          page: String(currentPage - 1),
                        }).toString()}`}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5"
                      >
                        ← Prev
                      </Link>
                    )}
                    {currentPage < totalPages && (
                      <Link
                        href={`/bank?${new URLSearchParams({
                          ...keep,
                          ...(topic ? { topic } : {}),
                          page: String(currentPage + 1),
                        }).toString()}`}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5"
                      >
                        Next →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right rail */}
        <aside className="space-y-5 lg:sticky lg:top-20">
          <ActivityCalendar />
          <section className="card-calm rounded-2xl p-5" aria-label="Trending companies">
            <h2 className="text-[15px] font-semibold text-stone-900 dark:text-stone-50">Trending companies</h2>
            {companies.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">No company data yet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {companies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/bank/${c.slug}`}
                    className="px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 text-[13px] text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-600"
                  >
                    {c.name} <span className="ml-1 text-[11px] font-semibold px-1.5 py-px rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 tabular-nums">{c.practiceCount}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
