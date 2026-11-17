import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import Empty from '@/components/Empty';

type PracticeQ = {
  id: string; slug: string; title: string; topic: string; difficulty: string;
  frequency: number; recency: string; revisionPriority: string | null; notes: string | null;
  companies: Array<{ slug: string; name: string; frequency: number }>;
};

function recencyLabel(recency: string): string | null {
  switch (recency) {
    case 'thirty-days': return 'Asked in last 30 days';
    case 'three-months': return 'Asked in last 3 months';
    case 'six-months': return 'Asked in last 6 months';
    case 'more-than-six-months': return 'Asked 6+ months ago';
    default: return null;
  }
}

function PracticeList({ practice }: { practice: PracticeQ[] }) {
  const maxFreq = Math.max(1, ...practice.map((q) => q.frequency ?? 0));
  return (
    <ul className="divide-y divide-stone-100 dark:divide-white/10 card-calm rounded-2xl overflow-hidden">
      {practice.map((q) => {
        const width = Math.max(8, Math.round(((q.frequency ?? 0) / maxFreq) * 100));
        const recency = recencyLabel(q.recency);
        return (
          <li key={q.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-200/70 dark:bg-white/5 text-stone-600 dark:text-slate-300 capitalize">
                {q.difficulty}
              </span>
              <div className="flex-1 min-w-0">
                <Link href={`/practice/${q.id}`} className="text-[14px] font-medium text-stone-900 dark:text-stone-100 truncate block hover:text-amber-400 transition-colors">{q.title}</Link>
                <p className="text-[12px] text-stone-500 dark:text-stone-400">
                  {q.topic}{recency ? ` · ${recency}` : ''}
                </p>
              </div>
              <div className="shrink-0 hidden sm:flex items-center gap-2" title={`${q.frequency} interview reports`}>
                <div className="w-16 h-1.5 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden" role="img" aria-label={`Asked in ${q.frequency} reports`}>
                  <div className="h-full rounded-full bg-amber-500 dark:bg-amber-400" style={{ width: `${width}%` }} />
                </div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums w-14 text-right">
                  {q.frequency} reports
                </span>
              </div>
              <Link
                href={`/coding?problem=${encodeURIComponent(q.slug || q.id)}&title=${encodeURIComponent(q.title)}&tab=diagram`}
                title={`Open ${q.title} in interactive visualizer`}
                className="hidden sm:inline-flex items-center gap-1 shrink-0 rounded-full border border-stone-200 dark:border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <span aria-hidden>⚡</span>
                <span>Visualize</span>
              </Link>
              <Link href={`/practice/${q.id}`} className="shrink-0 text-sm text-stone-400 hover:text-amber-400 transition-colors" aria-label={`Practice ${q.title}`}>→</Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default async function CompanyBankPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let practice: PracticeQ[];
  let oa: Array<{ id: string; title: string; format?: string; section?: string; difficulty?: string | null; askedAt?: string | null }> = [];
  let guide: { rounds?: Array<{ name: string; focus: string }>; processNotes?: string | null } | null = null;
  try {
    const [prRes, oaRes] = await Promise.all([
      serverGet<{ questions: PracticeQ[] }>(
        `/api/v1/me/bank/companies/${slug}/practice?limit=200`,
      ),
      serverGet<{
        questions: Array<{ id: string; title: string; format?: string; section?: string; difficulty?: string | null; askedAt?: string | null }>;
        guide?: { rounds?: Array<{ name: string; focus: string }>; processNotes?: string | null } | null;
      }>(
        `/api/v1/me/bank/companies/${slug}/oa?limit=100`,
      ).catch(() => ({ questions: [], guide: null })),
    ]);
    practice = prRes.questions;
    oa = oaRes.questions ?? [];
    guide = oaRes.guide ?? null;
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    if ((e as { status?: number })?.status === 403) {
      return (
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Active enrollment required</h1>
          <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Enroll in an open SPURA batch to access company-specific practice and OA sheets.</p>
          <Link href="/courses" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold">Browse courses</Link>
        </main>
      );
    }
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Bank is temporarily unavailable</h1>
        <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Could not reach the SPURA API server.</p>
        <Link href={`/bank/${slug}`} className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold">Retry</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10">
      <Link href="/bank/companies" className="text-sm text-stone-500 dark:text-slate-400 hover:text-amber-400">← All companies</Link>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 capitalize">{slug.replace(/-/g, ' ')}</h1>

      {guide && (guide.processNotes || (guide.rounds && guide.rounds.length > 0)) && (
        <section className="mt-6 card-calm rounded-2xl p-5" aria-label="Interview process guide">
          <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-1.5">Interview Process & Focus Areas</h2>
          {guide.processNotes && (
            <p className="text-[13px] text-stone-600 dark:text-stone-300 leading-relaxed">{guide.processNotes}</p>
          )}
          {guide.rounds && guide.rounds.length > 0 && (
            <div className="mt-3 grid sm:grid-cols-3 gap-2.5">
              {guide.rounds.map((r, idx) => (
                <div key={idx} className="rounded-xl border border-stone-200 dark:border-white/10 px-3.5 py-2.5 bg-stone-50/50 dark:bg-white/[0.02]">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{r.name}</p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">{r.focus}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-8" aria-label="Practice set">
        <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-1">Practice set ({practice.length})</h2>
        <p className="text-[13px] text-stone-500 dark:text-stone-400 mb-4">Runnable in our compiler, most-asked first.</p>
        {practice.length === 0 ? (
          <Empty title="No practice questions yet" hint="This company's set is being enriched." />
        ) : (
          <PracticeList practice={practice} />
        )}
      </section>

      {oa.length > 0 && (
        <section className="mt-10" aria-label="Online Assessment questions">
          <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-1">Online Assessment archive ({oa.length})</h2>
          <p className="text-[13px] text-stone-500 dark:text-stone-400 mb-4">Past OA prompts reported for this company.</p>
          <ul className="divide-y divide-stone-100 dark:divide-white/10 card-calm rounded-2xl overflow-hidden">
            {oa.map((item) => (
              <li key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-stone-900 dark:text-stone-100">{item.title}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 capitalize shrink-0">
                  {[item.format || item.section, item.askedAt ? new Date(item.askedAt).toLocaleDateString() : item.difficulty].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
