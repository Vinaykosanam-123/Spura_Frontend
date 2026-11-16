import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isForbidden, isUnauthorized, serverGet } from '@/lib/server';
import Empty from '@/components/Empty';

type Company = { id: string; slug: string; name: string; oaCount: number; practiceCount: number };

export default async function BankCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let companies: Company[];
  try {
    ({ companies } = await serverGet<{ companies: Company[] }>(
      `/api/v1/me/bank/companies${q ? `?q=${encodeURIComponent(q)}` : '?limit=100'}`
    ));
  } catch (e) {
    if (isUnauthorized(e)) redirect('/login');
    if (isForbidden(e)) {
      return (
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Active enrollment required</h1>
          <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Enroll in an open SPURA batch to browse company sheets.</p>
          <Link href="/courses" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold">Browse courses</Link>
        </main>
      );
    }
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Bank is temporarily unavailable</h1>
        <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Could not reach the SPURA API server.</p>
        <Link href="/bank/companies" className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm text-stone-950 font-semibold">Retry</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10">
      <Link href="/bank" className="text-sm text-stone-500 dark:text-slate-400 hover:text-amber-400">← All questions</Link>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Browse by company</h1>
      <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Runnable practice counts per company.</p>

      <form action="/bank/companies" method="get" className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search companies (e.g. tcs, google, infosys)"
          className="flex-1 px-4 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#0F1319] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold transition-colors">
          Search
        </button>
      </form>

      {companies.length === 0 ? (
        <div className="mt-8"><Empty title="No companies found" hint="Try a different search." /></div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {companies.map((c) => (
            <li key={c.id}>
              <Link
                href={`/bank/${c.slug}`}
                className="card-calm card-calm-hover rounded-2xl p-5 block"
              >
                <p className="text-[16px] font-semibold text-stone-900 dark:text-stone-50">{c.name}</p>
                <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400">
                  {c.practiceCount} practice questions
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
