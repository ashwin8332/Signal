import 'server-only';

/**
 * The only place that reads secrets from the environment. Everything in
 * lib/server is guarded by `server-only`, so importing it from a client
 * component fails the build instead of leaking a key.
 */
export const serverEnv = {
  get newsApiKey(): string | undefined {
    return process.env.NEWS_API_KEY?.trim() || undefined;
  },
  /** TMDB v4 "API Read Access Token" (sent as a Bearer header; preferred). */
  get tmdbToken(): string | undefined {
    return process.env.TMDB_API_READ_TOKEN?.trim() || undefined;
  },
  /** TMDB v3 API key (sent as the `api_key` query parameter, server-side only). */
  get tmdbApiKey(): string | undefined {
    return process.env.TMDB_API_KEY?.trim() || undefined;
  },
  /** Supabase project URL, e.g. https://<ref>.supabase.co (a trailing /rest/v1/ is tolerated). */
  get supabaseUrl(): string | undefined {
    const raw = process.env.SUPABASE_URL?.trim();
    if (!raw) return undefined;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' ? url.origin : undefined;
    } catch {
      return undefined;
    }
  },
  /** Server-only secret key (bypasses RLS). Never sent to the browser. */
  get supabaseSecretKey(): string | undefined {
    return process.env.SUPABASE_SECRET_KEY?.trim() || undefined;
  },
  get liveFeedIntervalMs(): number {
    const value = Number(process.env.LIVE_FEED_INTERVAL_MS);
    return Number.isFinite(value) && value >= 1000 ? value : 20_000;
  },
};

let warnedAboutSecret = false;

/**
 * Secret for signing session cookies. Production refuses to run without one.
 * Development falls back to a fixed, clearly-labelled value with a warning, so
 * the app works out of the box.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set (32+ characters) in production.');
  }
  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn('[auth] AUTH_SECRET is not set; using an insecure development-only secret.');
  }
  return 'dev-only-insecure-secret-change-me-0123456789';
}
