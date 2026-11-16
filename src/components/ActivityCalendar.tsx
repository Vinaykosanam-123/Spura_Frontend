'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getActivity, localDateKey, type ActivityDay } from '@/lib/activity';
import { api } from '@/lib/api';

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function keyOf(d: Date): string {
  return localDateKey(d);
}

export default function ActivityCalendar() {
  const [activity, setActivity] = useState<Record<string, ActivityDay> | null>(null);
  const [bank, setBank] = useState<Array<{ id: string; title: string; difficulty: string }>>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  /* eslint-disable react-hooks/set-state-in-effect -- activity must hydrate from localStorage on mount */
  useEffect(() => {
    const base = getActivity();
    setActivity(base);
    api.submissions()
      .then((res) => {
        const merged: Record<string, ActivityDay> = { ...base };
        for (const sub of res.submissions ?? []) {
          if (sub.verdict === 'accepted' && sub.createdAt) {
            const k = keyOf(new Date(sub.createdAt));
            const prev = merged[k] ?? { solves: 0, lessons: 0, minutes: 0 };
            merged[k] = { ...prev, solves: Math.max(prev.solves, 1) };
          }
        }
        setActivity(merged);
      })
      .catch(() => {});
    api.bankQuestions({ limit: 60 })
      .then((d) => setBank((d.questions ?? []).map((q) => ({ id: q.id, title: q.title, difficulty: q.difficulty }))))
      .catch(() => {});
  }, []);

  const potdFor = (dateKey: string) => {
    if (bank.length === 0) return null;
    const t = new Date(`${dateKey}T00:00:00`).getTime();
    const start = new Date(new Date(t).getFullYear(), 0, 0).getTime();
    const dayOfYear = Math.floor((t - start) / 86400000);
    return bank[dayOfYear % bank.length];
  };
  /* eslint-enable react-hooks/set-state-in-effect */

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: ({ key: string; day?: ActivityDay; today: boolean } | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) out.push(null);
    const todayKey = keyOf(new Date());
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = keyOf(date);
      out.push({ key, day: activity?.[key], today: key === todayKey });
    }
    return out;
  }, [cursor, activity]);

  if (!activity) return null;

  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  let streak = 0;
  const d = new Date();
  for (;;) {
    const v = activity[keyOf(d)];
    if (!v || (v.solves === 0 && v.lessons === 0 && v.minutes === 0)) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }

  return (
    <section className="card-calm rounded-2xl p-5" aria-label="Activity calendar">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-stone-900 dark:text-stone-50">
          {monthLabel}
          <span className="ml-2 text-[12px] font-normal text-stone-500 dark:text-stone-400">
            {streak > 0 ? `🔥 ${streak}-day streak` : 'No active streak'}
          </span>
        </p>
        <div className="flex gap-1">
          <button
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="h-7 w-7 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm"
          >
            ‹
          </button>
          <button
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="h-7 w-7 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm"
          >
            ›
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-stone-400">
        {WD.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c, i) =>
          c === null ? (
            <span key={`pad-${i}`} />
          ) : (
            (() => {
              const potd = potdFor(c.key);
              const cls = `aspect-square flex items-center justify-center rounded-full text-[11px] tabular-nums ${
                c.day && (c.day.solves > 0 || c.day.lessons > 0 || c.day.minutes > 0)
                  ? 'bg-emerald-500/90 text-stone-950 font-semibold'
                  : c.today
                    ? 'border-2 border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10'
              }`;
                            const label = potd ? potd.title : c.key;
              return potd ? (
                <Link
                  key={c.key}
                  href={`/practice/${potd.id}`}
                  title={label}
                  aria-label={label}
                  className={cls}
                >
                  {Number(c.key.slice(8, 10))}
                </Link>
              ) : (
                <span key={c.key} title={c.key} className={cls}>
                  {Number(c.key.slice(8, 10))}
                </span>
              );
            })()
          ),
        )}
      </div>
    </section>
  );
}
