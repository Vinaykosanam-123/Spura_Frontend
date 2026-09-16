export function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d;
  }
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d;
  }
}

export function formatPrice(minor: number, currency: string): string {
  const major = (minor ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(major);
  } catch {
    return `${major} ${currency}`;
  }
}

export function courseDurationLabel(c: {
  durationWeeks?: number | null;
  estimatedDurationHours?: number | null;
}): string {
  if (c?.durationWeeks != null) return `${c.durationWeeks} weeks`;
  if (c?.estimatedDurationHours != null) return `${c.estimatedDurationHours}h`;
  return 'Self-paced';
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return '—';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m${s > 0 ? ` ${s}s` : ''}`;
}
