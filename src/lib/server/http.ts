import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import type { z } from 'zod';
import type { ApiErrorBody, PublicUser } from '@/types/content';
import { paramsToObject } from '@/lib/validation';
import { SESSION_COOKIE } from '@/lib/constants';
import { verifySession } from './session';
import { UpstreamError } from './providers';
import { SupabaseError } from './supabase';

export function jsonError(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status, headers });
}

/** Parses the query string; returns the data or a ready-made 400 response. */
export function parseQuery<S extends z.ZodType>(
  request: NextRequest,
  schema: S,
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(paramsToObject(request.nextUrl.searchParams));
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  const field = issue?.path.join('.') || 'query';
  return { ok: false, response: jsonError(400, 'BAD_REQUEST', `Invalid "${field}": ${issue?.message ?? 'bad value'}`) };
}

export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: jsonError(400, 'BAD_REQUEST', 'Request body must be JSON.') };
  }
  const result = schema.safeParse(body);
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  return {
    ok: false,
    response: jsonError(400, 'BAD_REQUEST', `Invalid "${issue?.path.join('.') || 'body'}": ${issue?.message ?? 'bad value'}`),
  };
}

/** Defense in depth behind proxy.ts: every API handler re-checks the session. */
export function getSessionUser(request: NextRequest): PublicUser | null {
  return verifySession(request.cookies.get(SESSION_COOKIE)?.value);
}

export function unauthorized() {
  return jsonError(401, 'UNAUTHORIZED', 'Sign in to continue.');
}

/**
 * CSRF guard for state-changing requests: the browser-set Origin header must
 * match this host. Combined with SameSite=Lax cookies.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Maps provider failures to 502 and anything unexpected to 500, never leaking internals. */
export function handleRouteError(error: unknown) {
  if (error instanceof UpstreamError) {
    return jsonError(502, 'UPSTREAM_ERROR', `${error.provider} is unavailable right now.`);
  }
  if (error instanceof SupabaseError) {
    console.error('[api] storage error', error.message);
    return jsonError(503, 'STORAGE_UNAVAILABLE', 'Saved data is unavailable right now. Try again shortly.');
  }
  console.error('[api] unexpected error', error instanceof Error ? error.message : error);
  return jsonError(500, 'INTERNAL_ERROR', 'Something went wrong on our side.');
}
