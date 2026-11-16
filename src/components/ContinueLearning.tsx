"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface NextLesson {
  id: string;
  title: string;
  course: string;
}

export default function ContinueLearning() {
  const [next, setNext] = useState<NextLesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { curriculum } = await api.curriculum();
        for (const entry of curriculum) {
          for (const m of entry.modules) {
            const l = m.lessons.find((x) => !x.locked && !x.completedAt);
            if (l) {
              if (!cancelled) {
                setNext({ id: l.id, title: l.title, course: entry.course.title });
              }
              return;
            }
          }
        }
      } catch {
        // Not logged in or backend down — stay hidden, public hero remains
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !next) return null;

  return (
    <section
      aria-label="Continue learning"
      className="card-calm mt-8 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-base" aria-hidden="true">
        ▶
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-amber-500 dark:text-amber-400">
          Continue where you left off
        </p>
        <p className="mt-1 truncate font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {next.title}
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{next.course}</p>
      </div>
      <Link
        href={`/my/lessons/${next.id}`}
        className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-6 text-sm text-stone-950 font-semibold transition-colors"
      >
        Resume →
      </Link>
    </section>
  );
}
