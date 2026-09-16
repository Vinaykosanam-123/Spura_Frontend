import { cookies } from 'next/headers';

export interface ServerApiError extends Error {
  status: number;
}

/** Server-side GET to the API, forwarding the session cookie. No-store (auth data). */
export async function serverGet<T>(path: string): Promise<T> {
  const jar = await cookies();
  const base = process.env.NEXT_PUBLIC_API_URL;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      headers: { Cookie: jar.toString() },
      cache: 'no-store',
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
