import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PREFIXES = ['/admin', '/api/prompts', '/api/audio', '/api/habits'];

function isLocalHost(hostname: string) {
  return (
    hostname.startsWith('localhost') ||
    hostname.startsWith('127.0.0.1') ||
    hostname.startsWith('[::1]')
  );
}

function isProtectedPath(pathname: string) {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasAdminAccess(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  const hostname = request.headers.get('host') || '';

  if (!password) {
    return process.env.NODE_ENV !== 'production' || isLocalHost(hostname);
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return false;

  try {
    const decoded = atob(header.slice('Basic '.length));
    return decoded === `${username}:${password}`;
  } catch {
    return false;
  }
}

function unauthorized() {
  return new NextResponse('Admin authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Jahera Admin"' },
  });
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const isAdminHost = hostname.startsWith('admin.');
  const isLocal = isLocalHost(hostname);

  if (isAdminHost) {
    const url = request.nextUrl.clone();
    if (
      !url.pathname.startsWith('/admin') &&
      !url.pathname.startsWith('/api')
    ) {
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (!isAdminHost && !isLocal && pathname.startsWith('/admin')) {
    return NextResponse.redirect(
      new URL(
        pathname.replace('/admin', '') || '/',
        `https://admin.${hostname}`,
      ),
    );
  }

  if (isProtectedPath(pathname) && !hasAdminAccess(request)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
