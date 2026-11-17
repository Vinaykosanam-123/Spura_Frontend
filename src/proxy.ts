import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getServerApiBaseUrl,
  isDevBypassEnabled,
  safeRedirectTarget,
} from '@/lib/config';

const SESSION_COOKIE = 'learnandlearn_session';

export async function proxy(req: NextRequest) {
  if (isDevBypassEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isStaffRoute = pathname.startsWith('/admin') || pathname.startsWith('/studio');
  const session = req.cookies.get(SESSION_COOKIE)?.value;

  if (!session) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session token against backend /api/v1/auth/me
  const apiBase = getServerApiBaseUrl();
  try {
    const meRes = await fetch(`${apiBase}/api/v1/auth/me`, {
      headers: { Cookie: `${SESSION_COOKIE}=${session}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (meRes.status === 401 || meRes.status === 403) {
      if (isAuthPage) {
        const res = NextResponse.next();
        res.cookies.delete(SESSION_COOKIE);
        return res;
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }

    if (meRes.ok) {
      const data = (await meRes.json().catch(() => null)) as {
        user?: { id: string; roles?: string[] };
      } | null;

      if (isAuthPage && data?.user?.id) {
        const target = safeRedirectTarget(req.nextUrl.searchParams.get('next'), '/my');
        return NextResponse.redirect(new URL(target, req.url));
      }

      if (isStaffRoute) {
        const roles = data?.user?.roles ?? [];
        const allowed =
          roles.includes('admin') ||
          roles.includes('mentor') ||
          roles.includes('instructor');
        if (!allowed) {
          return NextResponse.redirect(new URL('/my', req.url));
        }
      }
      return NextResponse.next();
    }

    // Fail closed for staff routes if backend returned 5xx or unexpected status
    if (isStaffRoute) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      loginUrl.searchParams.set('error', 'service_unavailable');
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Fail closed for staff routes; student client Guard handles cold-start retries on /my
    if (isStaffRoute) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      loginUrl.searchParams.set('error', 'service_unavailable');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/my/:path*',
    '/practice/:path*',
    '/bank/:path*',
    '/contests/:path*',
    '/admin/:path*',
    '/studio/:path*',
  ],
};
