'use client';

export const TERMINAL_SUBMISSION_STATUSES = new Set([
  'completed',
  'infra_failed',
  'failed',
  'cancelled',
]);

export const MAX_SUBMISSION_POLL_MS = 180_000;

export function isTerminalSubmissionStatus(status?: string | null): boolean {
  return typeof status === 'string' && TERMINAL_SUBMISSION_STATUSES.has(status);
}

export function isInfraOrFailedSubmission(status?: string | null): boolean {
  return status === 'infra_failed' || status === 'failed' || status === 'cancelled';
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `spura-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Adaptive polling cadence for compiler grading jobs:
 *  - 0..10s:   1.5s (fast feedback under normal load)
 *  - 10..45s:  3.0s (reduces read load during bursts)
 *  - 45..180s: 5.0s (accommodates 40-student mock-test queues without premature timeout)
 */
export function getSubmissionPollDelayMs(elapsedMs: number): number {
  if (elapsedMs < 10_000) return 1_500;
  if (elapsedMs < 45_000) return 3_000;
  return 5_000;
}

function sleepAbortable(ms: number, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve(false);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(true);
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function waitUntilVisible(signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) return Promise.resolve(false);
  if (typeof document === 'undefined' || document.visibilityState !== 'hidden') {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVis);
      signal?.removeEventListener('abort', onAbort);
    };
    const onVis = () => {
      if (document.visibilityState !== 'hidden') {
        cleanup();
        resolve(true);
      }
    };
    const onAbort = () => {
      cleanup();
      resolve(false);
    };
    document.addEventListener('visibilitychange', onVis);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export interface PollSubmissionResult<T extends { status?: string }> {
  submission: T;
  timedOut: boolean;
  aborted: boolean;
  unauthorized: boolean;
}

export async function pollSubmissionUntilTerminal<T extends { status?: string }>(
  initial: T,
  fetchLatest: (signal: AbortSignal) => Promise<{ submission: T | null; unauthorized?: boolean }>,
  options: {
    signal?: AbortSignal;
    maxWaitMs?: number;
    onUpdate?: (submission: T) => void;
  } = {}
): Promise<PollSubmissionResult<T>> {
  const maxWaitMs = options.maxWaitMs ?? MAX_SUBMISSION_POLL_MS;
  let current = initial;
  if (isTerminalSubmissionStatus(current.status)) {
    return { submission: current, timedOut: false, aborted: false, unauthorized: false };
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    const elapsed = Date.now() - startedAt;
    const delay = getSubmissionPollDelayMs(elapsed);
    const slept = await sleepAbortable(delay, options.signal);
    if (!slept) {
      return { submission: current, timedOut: false, aborted: true, unauthorized: false };
    }
    const visible = await waitUntilVisible(options.signal);
    if (!visible) {
      return { submission: current, timedOut: false, aborted: true, unauthorized: false };
    }

    const reqController = new AbortController();
    const forwardAbort = () => reqController.abort();
    options.signal?.addEventListener('abort', forwardAbort, { once: true });
    try {
      const res = await fetchLatest(reqController.signal);
      if (res.unauthorized) {
        return { submission: current, timedOut: false, aborted: false, unauthorized: true };
      }
      if (res.submission) {
        current = res.submission;
        options.onUpdate?.(current);
        if (isTerminalSubmissionStatus(current.status)) {
          return { submission: current, timedOut: false, aborted: false, unauthorized: false };
        }
      }
    } catch {
      if (options.signal?.aborted) {
        return { submission: current, timedOut: false, aborted: true, unauthorized: false };
      }
      // Transient poll error — retry on next backoff tick
    } finally {
      options.signal?.removeEventListener('abort', forwardAbort);
    }
  }

  return {
    submission: current,
    timedOut: !isTerminalSubmissionStatus(current.status),
    aborted: false,
    unauthorized: false,
  };
}
