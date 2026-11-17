import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isForbidden, isUnauthorized, serverGet } from '@/lib/server';
import type { QuestionDetail } from '@/lib/types';

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: QuestionDetail;
  try {
    data = await serverGet<QuestionDetail>(`/api/v1/me/questions/${encodeURIComponent(id)}`);
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    if (isForbidden(e)) {
      return (
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Active enrollment required</h1>
          <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Enroll in an open SPURA batch to unlock full problem statements and test cases.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/courses" className="inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors">Browse courses</Link>
            <Link href="/my/curriculum" className="inline-flex h-11 items-center rounded-xl border border-stone-200 dark:border-white/10 px-5 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">Back to curriculum</Link>
          </div>
        </main>
      );
    }
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Practice is temporarily unavailable</h1>
        <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Could not reach the SPURA API server. Please ensure the backend service is running.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href={`/my/questions/${id}`} className="inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors">Retry</Link>
          <Link href="/my/curriculum" className="inline-flex h-11 items-center rounded-xl border border-stone-200 dark:border-white/10 px-5 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">Back to curriculum</Link>
        </div>
      </main>
    );
  }

  const q = data.question as {
    title?: string;
    slug?: string;
    topic?: string;
    difficulty?: string;
    statement?: string;
    externalUrl?: string | null;
  };
  const samples = data.samples ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
      <Link href="/my/curriculum" className="text-[13px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">
        ← Back to curriculum
      </Link>
      <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.1em] text-stone-500 dark:text-stone-400">
        Practice · {[q.topic, q.difficulty].filter(Boolean).join(' · ') || 'Hands-on'}
      </p>
      <h1 className="mt-2 text-[30px] sm:text-[34px] font-semibold tracking-[-0.02em] leading-tight text-stone-900 dark:text-stone-50">
        {String(q.title ?? 'Question')}
      </h1>
      {q.statement && (
        <p className="study-prose mt-4 text-[16px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{q.statement}</p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/practice/${id}`}
          className="inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold transition-colors"
        >
          Solve in Compiler →
        </Link>
        {q.externalUrl && (
          <a
            href={q.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-xl border border-stone-200 dark:border-white/10 px-5 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
          >
            Open external link ↗
          </a>
        )}
      </div>

      <section className="mt-10" aria-label="Sample test cases">
        <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-3">
          Samples
        </h2>
        {samples.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">No samples provided.</p>
        ) : (
          <ul className="space-y-3">
            {samples.map((s, i) => (
              <li
                key={s.id}
                className="card-calm rounded-2xl p-5 font-mono text-[13px] leading-relaxed"
              >
                <p className="font-sans text-[12px] font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2">Example {i + 1}</p>
                <p className="text-stone-500 dark:text-stone-400 text-[11px] uppercase tracking-wide mb-1">Input</p>
                <pre className="whitespace-pre-wrap text-stone-900 dark:text-stone-100 bg-stone-100/80 dark:bg-[#06080B] border border-stone-200/70 dark:border-white/5 rounded-xl p-3">{s.stdin}</pre>
                <p className="text-stone-500 dark:text-stone-400 text-[11px] uppercase tracking-wide mt-4 mb-1">Expected output</p>
                <pre className="whitespace-pre-wrap text-stone-900 dark:text-stone-100 bg-stone-100/80 dark:bg-[#06080B] border border-stone-200/70 dark:border-white/5 rounded-xl p-3">{s.expected}</pre>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[13px] text-stone-500 dark:text-stone-400">
          Only samples are shown — hidden tests stay hidden to keep practice honest.
        </p>
      </section>
    </main>
  );
}
