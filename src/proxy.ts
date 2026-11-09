import { NextResponse, type NextRequest } from 'next/server';

// First line of defence for the admin: without a session cookie, admin pages send visitors to the
// login page and admin APIs answer 401. Every page, action and API still checks the session and
// the administrator's role against the database itself.
const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-nida_admin' : 'nida_admin';
const PUBLIC_ADMIN = ['/admin/login', '/admin/forgot-password', '/admin/reset-password', '/admin/setup', '/admin/recover'];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(COOKIE)?.value);
  if (pathname.startsWith('/api/admin')) {
    if (!hasSession) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.next();
  }
  if (PUBLIC_ADMIN.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login/';
    url.search = pathname === '/admin' || pathname === '/admin/' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
