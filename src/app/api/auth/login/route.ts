import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { loginSchema } from '@/lib/validation';
import { authenticate } from '@/lib/server/users';
import { createSessionToken, sessionCookieOptions } from '@/lib/server/session';
import { clientKey, loginLimiter } from '@/lib/server/rateLimit';
import { isSameOrigin, jsonError, parseJsonBody, handleRouteError } from '@/lib/server/http';

/** POST /api/auth/login  { email, password } */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError(403, 'FORBIDDEN', 'Cross-origin request rejected.');
  const parsed = await parseJsonBody(request, loginSchema);
  if (!parsed.ok) return parsed.response;
  const { email, password } = parsed.data;

  const key = `${clientKey(request)}:${email}`;
  const limit = loginLimiter.hit(key);
  if (!limit.allowed) {
    return jsonError(429, 'RATE_LIMITED', 'Too many attempts. Wait a minute and try again.', {
      'Retry-After': String(limit.retryAfterSeconds),
    });
  }

  let user;
  try {
    user = await authenticate(email, password);
  } catch (error) {
    return handleRouteError(error);
  }
  if (!user) return jsonError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');

  loginLimiter.reset(key);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions());
  return response;
}
