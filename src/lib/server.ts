import { cookies } from 'next/headers';
import { getServerApiBaseUrl, isDevBypassEnabled } from './config';
import type { User } from './types';

export interface ServerApiError extends Error {
  status: number;
}

/** Best-effort viewer lookup for public pages that change behaviour when signed in. */
export async function getViewer(): Promise<User | null> {
  try {
    const data = await serverGet<{ user: User }>('/api/v1/auth/me');
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** Server-side GET to the API, forwarding the session cookie. No-store (auth data). */
export async function serverGet<T>(path: string): Promise<T> {
  if (isDevBypassEnabled()) {
    const { mockResponse } = await import('./mock');
    return mockResponse(path, 'GET') as T;
  }
  const jar = await cookies();
  const base = getServerApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      headers: { Cookie: jar.toString() },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const err = new Error(
      `Backend unreachable at ${base}${path}: ${msg}`
    ) as ServerApiError;
    err.status = 0;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(
      `${res.status} ${(await res.text()).slice(0, 200)}`
    ) as ServerApiError;
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export function isUnauthorized(e: unknown): boolean {
  return (e as ServerApiError)?.status === 401;
}

export function isForbidden(e: unknown): boolean {
  return (e as ServerApiError)?.status === 403;
}
