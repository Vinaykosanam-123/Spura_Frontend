'use client';

const KEY = 'll_visualizer_trials_v1';
const EVENT = 'll-visualizer-trials';

export const TRIAL_LIMIT = 3;

let volatileTrials: string[] = [];

export function parseTrials(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function subscribeTrials(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function trialsSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored !== null) return stored;
  } catch {
    // Storage disabled: fall through to the in-memory fallback.
  }
  return volatileTrials.length > 0 ? JSON.stringify(volatileTrials) : '';
}

export function unlockVisualizer(slug: string): void {
  if (typeof window === 'undefined') return;
  const current = parseTrials(trialsSnapshot());
  if (current.includes(slug) || current.length >= TRIAL_LIMIT) return;
  const next = [...current, slug];
  volatileTrials = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage disabled (for example private mode): the in-memory trial still works for this view.
  }
  window.dispatchEvent(new Event(EVENT));
}
