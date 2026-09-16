import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import type { QuestionDetail } from '@/lib/types';

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: QuestionDetail;
  try {
    data = await serverGet<QuestionDetail>(`/api/v1/me/questions/${id}`);
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    const msg = e instanceof Error ? e.message : 'Backend unreachable';
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-4xl" aria-hidden="true">🔌</p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Backend is offline (UI-only mode)</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">API at http://localhost:4000 is unreachable.</p>
        <p className="mt-1 text-xs text-zinc-500 font-mono break-all">{msg.slice(0, 200)}</p>
        <div className="mt-6 flex gap-3 justify-center">
          <a href={`/questions/${id}`} className="inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium">Retry</a>
          <Link href="/curriculum" className="inline-flex h-11 items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-5 font-medium">Back to curriculum</Link>
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
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/curriculum" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        ← Back to curriculum
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {String(q.title ?? 'Question')}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {[q.topic, q.difficulty].filter(Boolean).join(' · ')}
      </p>
      {q.statement && (
        <p className="mt-4 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{q.statement}</p>
      )}
      {q.externalUrl && (
        <a
          href={q.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-10 items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-5 text-sm font-medium"
        >
          Open practice link ↗
        </a>
      )}

      <section className="mt-8" aria-label="Sample test cases">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Samples
        </h2>
        {samples.length === 0 ? (
          <p className="text-sm text-zinc-500">No samples provided.</p>
        ) : (
          <ul className="space-y-3">
            {samples.map((s) => (
              <li
                key={s.id}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900 font-mono text-sm"
              >
                <p className="text-zinc-500 text-xs mb-1">Input</p>
                <pre className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">{s.stdin}</pre>
                <p className="text-zinc-500 text-xs mt-3 mb-1">Expected output</p>
                <pre className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">{s.expected}</pre>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          Only sample cases are shown — hidden tests are never exposed.
        </p>
      </section>
    </main>
  );
}
