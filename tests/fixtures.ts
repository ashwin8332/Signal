import type { ContentItem, PageResponse } from '@/types/content';

let counter = 0;

export function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  counter += 1;
  const type = overrides.type ?? 'news';
  return {
    id: `${type}:test-${counter}`,
    type,
    title: `Test ${type} item ${counter}`,
    summary: `Summary for ${type} item ${counter}`,
    imageUrl: null,
    url: `https://example.com/${type}/${counter}`,
    source: 'Test Source',
    author: null,
    publishedAt: new Date('2026-10-15T10:00:00Z').toISOString(),
    category: 'technology',
    tags: ['technology'],
    reason: 'category:technology',
    metrics: null,
    ...overrides,
  };
}

export function page(items: ContentItem[], hasMore = false, pageNumber = 1): PageResponse {
  return { items, page: pageNumber, hasMore, source: 'mock' };
}

type Handler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Stubs global fetch with a router keyed by pathname. RTK Query and the auth
 * thunks run for real; only the network boundary is faked. Returns the mock
 * so tests can assert on calls.
 */
export function mockFetch(routes: Record<string, Handler>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost:3000');
    const handler = routes[url.pathname];
    if (!handler) return json({ error: { code: 'NOT_FOUND', message: `No mock for ${url.pathname}` } }, 404);
    return handler(url, init);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** Calls made to a path, as URL objects. */
export function callsTo(fn: ReturnType<typeof mockFetch>, pathname: string): URL[] {
  return fn.mock.calls
    .map(([input]) => new URL(input instanceof Request ? input.url : String(input), 'http://localhost:3000'))
    .filter((url) => url.pathname === pathname);
}
