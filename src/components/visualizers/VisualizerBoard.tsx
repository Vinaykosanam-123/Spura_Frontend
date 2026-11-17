'use client';

import type { ReactNode } from 'react';

export interface FrameStat {
  label: string;
  value: string | number;
}

interface Props {
  stage: ReactNode;
  controls: ReactNode;
  note: string;
  code: string[];
  codeLine?: number;
  stats?: FrameStat[];
  extra?: ReactNode;
}

export default function VisualizerBoard({ stage, controls, note, code, codeLine, stats, extra }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F1319] shadow-xl shadow-black/40">
        <div className="flex min-h-[340px] items-center justify-center overflow-x-auto bg-[#090C10]/60 px-3 py-6 sm:px-6 sm:py-8">
          {stage}
        </div>
        {controls}
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-white/10 bg-[#0F1319] p-5" aria-live="polite">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
            Step Inspector
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-stone-800 dark:text-slate-200">{note}</p>
          {stats && stats.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/5 bg-[#161B24] px-3 py-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">{s.label}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-stone-900 dark:text-white">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {extra}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F1319]" aria-label="Pseudocode">
          <div className="border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-slate-400">
              Pseudocode Trace
            </p>
            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
          </div>
          <pre className="overflow-x-auto bg-stone-100 dark:bg-[#06080B] p-3 text-[12px] leading-6 font-mono">
            <code>
              {code.map((line, i) => {
                const active = i === codeLine;
                return (
                  <span
                    key={`${i}-${line}`}
                    className={`flex gap-3 rounded px-2 ${
                      active
                        ? 'border-l-2 border-amber-500 bg-amber-500/15 font-medium text-amber-900 dark:text-amber-200'
                        : 'border-l-2 border-transparent text-stone-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-4 shrink-0 select-none text-right text-stone-400 dark:text-slate-600">{i + 1}</span>
                    <span className="min-w-0 whitespace-pre-wrap break-words">{line || ' '}</span>
                  </span>
                );
              })}
            </code>
          </pre>
        </section>
      </div>
    </div>
  );
}
