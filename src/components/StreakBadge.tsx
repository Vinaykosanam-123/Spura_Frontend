"use client";

import { useEffect, useState } from "react";

/**
 * Daily visit streak stored locally.
 * Increments once per calendar day the student opens the dashboard.
 */
export default function StreakBadge() {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    let nextValue: number | null = null;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem("ll_last_visit");
      const raw = localStorage.getItem("ll_streak");
      let s = parseInt(raw || "0", 10) || 0;
      if (last !== today) {
        if (last) {
          const dLast = new Date(last + "T00:00:00Z").getTime();
          const dToday = new Date(today + "T00:00:00Z").getTime();
          const diffDays = Math.round((dToday - dLast) / 86400000);
          s = diffDays === 1 ? s + 1 : 1;
        } else {
          s = 1;
        }
        localStorage.setItem("ll_streak", String(s));
        localStorage.setItem("ll_last_visit", today);
      } else if (s === 0) {
        s = 1;
        localStorage.setItem("ll_streak", "1");
      }
      nextValue = s;
    } catch {
      nextValue = null;
    }
    const rafId = window.requestAnimationFrame(() => setStreak(nextValue));
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  if (streak === null) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-300"
      title="Consecutive days you opened your dashboard"
      aria-label={`${streak} day streak`}
    >
      <span aria-hidden="true">🔥</span> {streak}-day streak
    </span>
  );
}
