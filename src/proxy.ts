import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'learnandlearn_session';

export function proxy(req: NextRequest) {
  // Skip middleware in dev bypass mode
  if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true') {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  
  // If no session, redirect to login with next param
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/my/:path*',
    '/practice/:path*',
    '/bank/:path*',
    '/contests/:path*',
    '/admin/:path*',
    '/studio/:path*',
  ],
};
