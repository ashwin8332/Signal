import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { isSameOrigin, jsonError } from '@/lib/server/http';

/** POST /api/auth/logout: idempotent; always clears the cookie. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError(403, 'FORBIDDEN', 'Cross-origin request rejected.');
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
