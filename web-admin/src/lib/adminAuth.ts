import { NextRequest, NextResponse } from 'next/server';

function isLocalHost(hostname: string) {
  return (
    hostname.startsWith('localhost') ||
    hostname.startsWith('127.0.0.1') ||
    hostname.startsWith('[::1]')
  );
}

export function requireAdminRequest(req: NextRequest): NextResponse | null {
  const password = process.env.ADMIN_PASSWORD;
  const host = req.headers.get('host') || '';

  if (!password) {
    if (process.env.NODE_ENV !== 'production' || isLocalHost(host)) return null;

    return NextResponse.json(
      { error: 'ADMIN_PASSWORD is required in production.' },
      { status: 503 },
    );
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Basic ')) {
    return NextResponse.json(
      { error: 'Admin authentication required.' },
      {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Jahera Admin"' },
      },
    );
  }

  try {
    const decoded = atob(header.slice('Basic '.length));
    if (decoded === `${username}:${password}`) return null;
  } catch {}

  return NextResponse.json(
    { error: 'Invalid admin credentials.' },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Jahera Admin"' },
    },
  );
}
