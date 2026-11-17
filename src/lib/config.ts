/**
 * Centralized frontend configuration & URL helpers.
 * Prevents duplicated env-var fallbacks and redirect validation across SSR, proxy, and client modules.
 */

export const CLIENT_API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '');

export function getServerApiBaseUrl(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  ).replace(/\/+$/, '');
}

export function isDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'
  );
}

export function safeRedirectTarget(
  nextParam: string | null | undefined,
  fallback = '/my',
): string {
  if (!nextParam) return fallback;
  if (nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    return nextParam;
  }
  return fallback;
}
