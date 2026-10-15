import 'server-only';

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window, in-memory rate limiter. Per instance only; a multi-instance
 * deployment would move this to Redis or the edge (see docs/06-security.md).
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const windows = new Map<string, Window>();

  return {
    /** Records a hit; returns whether it is allowed and seconds until reset. */
    hit(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
      let window = windows.get(key);
      if (!window || window.resetAt <= now) {
        window = { count: 0, resetAt: now + windowMs };
        windows.set(key, window);
      }
      window.count += 1;
      // Opportunistic cleanup keeps the map from growing without bound.
      if (windows.size > 10_000) {
        for (const [entryKey, entry] of windows) if (entry.resetAt <= now) windows.delete(entryKey);
      }
      return { allowed: window.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)) };
    },
    reset(key: string) {
      windows.delete(key);
    },
    clear() {
      windows.clear();
    },
  };
}

/** Failed sign-in attempts: 5 per minute per client + email. */
export const loginLimiter = createRateLimiter(5, 60_000);

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'local';
}
