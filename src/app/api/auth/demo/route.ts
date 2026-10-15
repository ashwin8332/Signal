import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { getDemoUser } from '@/lib/server/users';
import { createSessionToken, sessionCookieOptions } from '@/lib/server/session';
import { isSameOrigin, jsonError, handleRouteError } from '@/lib/server/http';

/** POST /api/auth/demo: signs in the seeded demo account, server-side. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError(403, 'FORBIDDEN', 'Cross-origin request rejected.');
  let user;
  try {
    user = await getDemoUser();
  } catch (error) {
    return handleRouteError(error);
  }
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions());
  return response;
}
