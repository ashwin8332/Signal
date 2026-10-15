import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PublicUser } from '@/types/content';
import { SESSION_TTL_SECONDS } from '@/lib/constants';
import { getAuthSecret } from './env';

/**
 * Stateless session token: `base64url(json payload).base64url(HMAC-SHA256)`.
 * Stored in an httpOnly cookie, so page scripts can never read it.
 */
interface SessionPayload extends PublicUser {
  exp: number; // unix seconds
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSessionToken(user: PublicUser, now = Date.now(), secret = getAuthSecret()): string {
  const payload: SessionPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data, secret)}`;
}

/** Returns the user for a valid, unexpired token; null for anything else. */
export function verifySession(token: string | undefined | null, now = Date.now(), secret = getAuthSecret()): PublicUser | null {
  if (!token || token.length > 4096) return null;
  const [data, signature, extra] = token.split('.');
  if (!data || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(data, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as Partial<SessionPayload>;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now) return null;
    if (typeof payload.id !== 'string' || typeof payload.email !== 'string' || typeof payload.name !== 'string') {
      return null;
    }
    return { id: payload.id, name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
