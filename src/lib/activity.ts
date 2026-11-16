'use client';

export type ActivityDay = {
  solves: number;
  lessons: number;
  minutes: number;
};

const KEY = 'll_activity';

export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return localDateKey(new Date());
}

export function getActivity(): Record<string, ActivityDay> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function recordActivity(patch: Partial<ActivityDay>): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getActivity();
    const k = todayKey();
    const prev = all[k] ?? { solves: 0, lessons: 0, minutes: 0 };
    all[k] = {
      solves: prev.solves + (patch.solves ?? 0),
      lessons: prev.lessons + (patch.lessons ?? 0),
      minutes: prev.minutes + (patch.minutes ?? 0),
    };
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — ignore
  }
}

export function currentStreak(activity: Record<string, ActivityDay>): number {
  let streak = 0;
  const d = new Date();
  for (;;) {
    const k = localDateKey(d);
    const v = activity[k];
    const active = v && (v.solves > 0 || v.lessons > 0 || v.minutes > 0);
    if (!active) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
