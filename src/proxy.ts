import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'learnandlearn_session';

export async function proxy(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true') {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === '/login' || pathname === '/register';
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
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
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
        const nextParam = req.nextUrl.searchParams.get('next');
        const target =
          nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
            ? nextParam
            : '/my';
        return NextResponse.redirect(new URL(target, req.url));
      }

      if (pathname.startsWith('/admin') || pathname.startsWith('/studio')) {
        const roles = data?.user?.roles ?? [];
        const allowed =
          roles.includes('admin') ||
          roles.includes('mentor') ||
          roles.includes('instructor');
        if (!allowed) {
          return NextResponse.redirect(new URL('/my', req.url));
        }
      }
    }
  } catch {
    // If backend is momentarily waking up on cold start, allow client Guard to handle retry
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
