'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/bank', label: 'Questions', match: ['/bank', '/questions', '/practice/'] },
  { href: '/practice/mock', label: 'Mock Assessment', match: ['/practice/mock'] },
  { href: '/visualize', label: 'Visualizers', match: ['/visualize'] },
  { href: '/contests', label: 'Contest', match: ['/contests'] },
] as const;

export default function PracticeSubNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Practice sections">
      {ITEMS.map((item) => {
        const active =
          pathname === item.href || item.match.some((m) => pathname === m || pathname.startsWith(m));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors ${active ? 'bg-amber-500 text-stone-950 font-semibold border-amber-500' : 'border-white/10 bg-[#0F1319] text-slate-300 hover:border-amber-500/40 hover:text-white'}`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
