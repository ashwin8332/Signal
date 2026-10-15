import 'server-only';
import { serverEnv } from './env';

/**
 * Minimal Supabase (PostgREST) client for the server, using the secret key.
 * The browser never talks to Supabase: all access goes through our route
 * handlers, which enforce the session. Tables have RLS on with no policies,
 * so only this secret key can read or write them.
 */

export class SupabaseError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'SupabaseError';
  }

  /** Table missing (migration not run yet) or schema cache not refreshed. */
  get isMissingTable(): boolean {
    return this.code === 'PGRST205' || this.code === '42P01';
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabaseSecretKey);
}

const TIMEOUT_MS = 8_000;

export async function supabaseRequest<T>(
  path: string,
  init: { method?: 'GET' | 'POST' | 'DELETE' | 'PATCH'; query?: Record<string, string>; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const base = serverEnv.supabaseUrl;
  const key = serverEnv.supabaseSecretKey;
  if (!base || !key) throw new SupabaseError(0, 'NOT_CONFIGURED', 'Supabase is not configured');

  const url = new URL(`/rest/v1/${path}`, base);
  if (init.query) url.search = new URLSearchParams(init.query).toString();

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method ?? 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.prefer ? { Prefer: init.prefer } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    throw new SupabaseError(0, 'NETWORK', 'Supabase was unreachable');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;
    // Status + Postgres/PostgREST code only: never log request bodies (they can hold password hashes).
    throw new SupabaseError(response.status, body?.code, `Supabase responded ${response.status}${body?.code ? ` (${body.code})` : ''}`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

let warned = false;

/**
 * Runs `remote` against Supabase when it's configured and its tables exist,
 * otherwise `local` (in-memory). A missing table, e.g. before the migration
 * has been run, switches to memory once with a clear warning, so the app keeps
 * working.
 */
export async function withSupabase<T>(remote: () => Promise<T>, local: () => Promise<T> | T): Promise<T> {
  if (!isSupabaseConfigured() || supabaseState.unavailable) return local();
  try {
    return await remote();
  } catch (error) {
    if (error instanceof SupabaseError && error.isMissingTable) {
      supabaseState.unavailable = true;
      if (!warned) {
        warned = true;
        console.warn('[supabase] tables not found: run supabase/migrations/0001_users_and_favorites.sql. Using in-memory storage for now.');
      }
      return local();
    }
    throw error;
  }
}

/** Exposed for tests and the health endpoint. */
export const supabaseState = { unavailable: false };

export function storageMode(): 'supabase' | 'memory' {
  return isSupabaseConfigured() && !supabaseState.unavailable ? 'supabase' : 'memory';
}
