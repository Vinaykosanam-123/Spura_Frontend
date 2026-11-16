import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isUnauthorized, serverGet } from '@/lib/server';
import PracticeSubNav from '@/components/PracticeSubNav';
import Empty from '@/components/Empty';

type Contest = {
  id: string; title: string; difficulty: string; durationMinutes: number;
  startsAt: string; endsAt: string; state: string; total: number;
  companySlug: string | null; companyName: string | null; myScore: number | null;
};

function stateBadge(state: string): string {
  if (state === 'live') return 'bg-amber-500 text-stone-950 font-semibold';
  return 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300';
}

function ContestCard({ c }: { c: Contest }) {
  return (
    <Link href={`/contests/${c.id}`} className="card-calm card-calm-hover rounded-2xl p-5 block">
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${stateBadge(c.state)}`}>
          {c.state}
        </span>
        {c.companyName && (
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">{c.companyName}</span>
        )}
      </div>
      <p className="mt-2 text-[16px] font-semibold text-stone-900 dark:text-stone-50">{c.title}</p>
      <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400 capitalize">
        {c.difficulty} · {c.total} questions · {c.durationMinutes} min
      </p>
      <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400">
        {new Date(c.startsAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        {' → '}
        {new Date(c.endsAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      {c.myScore != null && (
        <p className="mt-2 text-[13px] font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
          Your score: {c.myScore}/{c.total}
        </p>
      )}
    </Link>
  );
}

export default async function ContestsPage() {
  let contests: Contest[];
  try {
    ({ contests } = await serverGet<{ contests: Contest[] }>('/api/v1/me/contests'));
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    if ((e as { status?: number })?.status === 403) {
      return (
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Active enrollment required</h1>
          <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Enroll in an open SPURA batch to compete in live coding contests.</p>
          <Link href="/courses" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold">Browse courses</Link>
        </main>
      );
    }
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Contests are temporarily unavailable</h1>
        <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Could not reach the SPURA API server.</p>
        <Link href="/contests" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold">Retry</Link>
      </main>
    );
  }

  const live = contests.filter((c) => c.state === 'live');
  const upcoming = contests.filter((c) => c.state === 'upcoming');
  const ended = contests.filter((c) => c.state === 'ended');

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Contests</h1>
      <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">
        Timed sets against the clock — join live ones, review past results.
      </p>
      <div className="mt-6">
        <PracticeSubNav />
      </div>

      {contests.length === 0 ? (
        <div className="mt-8">
          <Empty title="No contests yet" hint="Check back soon — new contests appear here." />
        </div>
      ) : (
        <>
          {live.length > 0 && (
            <section className="mt-8" aria-label="Live contests">
              <h2 className="text-[16px] font-semibold text-stone-900 dark:text-stone-50 mb-3">Live now</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {live.map((c) => <ContestCard key={c.id} c={c} />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section className="mt-8" aria-label="Upcoming contests">
              <h2 className="text-[16px] font-semibold text-stone-900 dark:text-stone-50 mb-3">Upcoming</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {upcoming.map((c) => <ContestCard key={c.id} c={c} />)}
              </div>
            </section>
          )}
          {ended.length > 0 && (
            <section className="mt-8" aria-label="Past contests">
              <h2 className="text-[16px] font-semibold text-stone-900 dark:text-stone-50 mb-3">Past results</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {ended.map((c) => <ContestCard key={c.id} c={c} />)}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
