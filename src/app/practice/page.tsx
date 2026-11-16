import Link from 'next/link';
import PracticeSubNav from '@/components/PracticeSubNav';

const CARDS = [
  {
    href: '/bank',
    title: 'Practice questions',
    desc: '480+ runnable problems with company tags, hints and complexity analysis.',
    cta: 'Browse questions →',
  },
  {
    href: '/practice/mock',
    title: 'Mock assessment',
    desc: 'Pick time, level and company — get a timed set with scoring.',
    cta: 'Start a mock →',
  },
  {
    href: '/coding',
    title: 'Visual coding compiler',
    desc: '54+ interactive DSA problems in C++, Java, Python & JS with live step-by-step memory traces.',
    cta: 'Open coding compiler →',
  },
  {
    href: '/visualize',
    title: 'DSA visualizers',
    desc: 'Play, pause and rewind all 11 interactive visualizers: Sorting, Heaps, AVL, Tries, DP, Graphs & more.',
    cta: 'Open 11 visualizers →',
  },
  {
    href: '/contests',
    title: 'Contest',
    desc: 'Live and upcoming timed placement contests with real-time standings and past results.',
    cta: 'View contests →',
  },
] as const;

export default function PracticeHub() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">Practice</h1>
      <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">
        Train by topic, simulate real assessments, or compete.
      </p>
      <div className="mt-6">
        <PracticeSubNav />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card-calm card-calm-hover rounded-2xl p-6 flex flex-col">
            <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">{c.title}</h2>
            <p className="mt-2 flex-1 text-[14px] leading-relaxed text-stone-600 dark:text-stone-400">{c.desc}</p>
            <span className="mt-4 text-[14px] font-semibold text-amber-500 dark:text-amber-400">{c.cta}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
