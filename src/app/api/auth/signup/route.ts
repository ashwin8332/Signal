import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { signupSchema } from '@/lib/validation';
import { createUser } from '@/lib/server/users';
import { createSessionToken, sessionCookieOptions } from '@/lib/server/session';
import { isSameOrigin, jsonError, parseJsonBody, handleRouteError } from '@/lib/server/http';

/** POST /api/auth/signup  { name, email, password } */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError(403, 'FORBIDDEN', 'Cross-origin request rejected.');
  const parsed = await parseJsonBody(request, signupSchema);
  if (!parsed.ok) return parsed.response;
  const { name, email, password } = parsed.data;

  let user;
  try {
    user = await createUser(name, email, password);
  } catch (error) {
    return handleRouteError(error);
  }
  if (!user) return jsonError(409, 'CONFLICT', 'An account with this email already exists.');

  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions());
  return response;
}
