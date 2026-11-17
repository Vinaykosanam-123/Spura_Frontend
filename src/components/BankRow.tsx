'use client';

import Link from 'next/link';
import { useState } from 'react';

export type BankRowQ = {
  id: string;
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  solved: boolean;
  acceptance: number | null;
  maxFrequency: number;
  companies: Array<{ slug: string; name: string; frequency: number }>;
};

function diffColor(d: string): string {
  if (d === 'easy') return 'text-emerald-600 dark:text-emerald-400';
  if (d === 'medium') return 'text-amber-500 dark:text-amber-400';
  if (d === 'hard') return 'text-red-500 dark:text-red-400';
  return 'text-stone-500';
}

function FreqBars({ value }: { value: number }) {
  const filled = value > 0 ? Math.max(1, Math.round(value / 25)) : 0;
  return (
    <span className="flex items-end gap-[3px]" role="img" aria-label={`Frequency ${value}`}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-sm ${i < filled ? 'bg-amber-500 dark:bg-amber-400' : 'bg-stone-200 dark:bg-white/10'}`}
          style={{ height: `${6 + i * 3}px` }}
        />
      ))}
    </span>
  );
}

export default function BankRow({ q }: { q: BankRowQ }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? q.companies : q.companies.slice(0, 3);
  const hidden = q.companies.length - shown.length;
  return (
    <li className="px-4 sm:px-5 py-3 hover:bg-stone-50/60 dark:hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className={`w-5 shrink-0 text-center text-[15px] font-bold ${q.solved ? 'text-emerald-500 dark:text-emerald-400' : 'text-stone-400'}`} aria-label={q.solved ? 'Solved' : 'Not solved'}>
          {q.solved ? '✓' : ''}
        </span>
        <Link
          href={`/practice/${q.id}`}
          className="flex-1 min-w-0 text-[14px] sm:text-[15px] font-medium text-stone-900 dark:text-stone-100 truncate hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
        >
          {q.title}
        </Link>
        <span className="hidden sm:block w-16 shrink-0 text-right text-[13px] tabular-nums text-stone-500 dark:text-stone-400">
          {q.acceptance != null ? `${q.acceptance}%` : '—'}
        </span>
        <span className={`w-12 shrink-0 text-right text-[13px] font-medium capitalize ${diffColor(q.difficulty)}`}>
          {q.difficulty === 'medium' ? 'Med.' : q.difficulty}
        </span>
        <span className="hidden sm:block shrink-0" title={`${q.maxFrequency} max frequency`}>
          <FreqBars value={q.maxFrequency} />
        </span>
        <Link
          href={`/coding?problem=${encodeURIComponent(q.slug || q.id)}&title=${encodeURIComponent(q.title)}&tab=diagram`}
          title={`Open ${q.title} in interactive visualizer`}
          className="hidden sm:inline-flex items-center gap-1 shrink-0 rounded-full border border-stone-200 dark:border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <span aria-hidden>⚡</span>
          <span>Visualize</span>
        </Link>
      </div>
      {q.companies.length > 0 && (
        <div className="mt-1.5 ml-7 flex flex-wrap items-center gap-1.5">
          {shown.map((c) => (
            <Link
              key={c.slug}
              href={`/bank/${c.slug}`}
              className="text-[11px] px-2 py-px rounded-full border border-stone-200 dark:border-white/10 text-stone-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              {c.name}
            </Link>
          ))}
          {hidden > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[11px] font-medium px-2 py-px rounded-full bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-white/10"
            >
              +{hidden} more
            </button>
          )}
          {expanded && q.companies.length > 3 && (
            <button
              onClick={() => setExpanded(false)}
              className="text-[11px] font-medium text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </li>
  );
}
