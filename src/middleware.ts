import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'learnandlearn_session';

export function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const login = new URL('/login', req.url);
    login.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/curriculum/:path*',
    '/lessons/:path*',
    '/live/:path*',
    '/recordings/:path*',
    '/announcements/:path*',
    '/progress/:path*',
    '/questions/:path*',
    '/admin/:path*',
  ],
};
