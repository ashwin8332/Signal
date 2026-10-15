// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionToken, verifySession } from '@/lib/server/session';
import { createRateLimiter } from '@/lib/server/rateLimit';
import { authenticate, createUser, DEMO_USER, hashPassword, resetUserStore, verifyPassword } from '@/lib/server/users';
import { mockNewsPage, MOCK_NEWS_PER_CATEGORY } from '@/lib/server/mock/news';
import { mockMoviesPage } from '@/lib/server/mock/movies';
import { mockSocialPage, mockLivePost } from '@/lib/server/mock/social';
import { getAuthSecret } from '@/lib/server/env';
import { getMovies, getNews, matchesQuery, normalizeNewsArticle, normalizeTmdbMovie, searchContent, tmdbAuth, UpstreamError } from '@/lib/server/providers';
import { makeItem } from '../fixtures';

const user = { id: 'u1', name: 'Ana', email: 'ana@example.com' };
const SECRET = 'test-secret-that-is-long-enough-0123456789';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('session tokens', () => {
  it('round-trips a valid token', () => {
    expect(verifySession(createSessionToken(user, Date.now(), SECRET), Date.now(), SECRET)).toEqual(user);
  });

  it('rejects tampered payloads, wrong secrets, expired and malformed tokens', () => {
    const token = createSessionToken(user, Date.now(), SECRET);
    const [payload, signature] = token.split('.') as [string, string];
    const forged = Buffer.from(JSON.stringify({ ...user, id: 'admin', exp: 9_999_999_999 })).toString('base64url');

    expect(verifySession(`${forged}.${signature}`, Date.now(), SECRET)).toBeNull();
    expect(verifySession(token, Date.now(), 'a-different-secret-0123456789-abcdef')).toBeNull();
    expect(verifySession(token, Date.now() + 8 * 24 * 3600 * 1000, SECRET)).toBeNull();
    expect(verifySession(`${payload}`, Date.now(), SECRET)).toBeNull();
    expect(verifySession(`${payload}.${signature}.extra`, Date.now(), SECRET)).toBeNull();
    expect(verifySession('', Date.now(), SECRET)).toBeNull();
    expect(verifySession(undefined, Date.now(), SECRET)).toBeNull();
  });

  it('requires AUTH_SECRET in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', '');
    expect(() => getAuthSecret()).toThrow(/AUTH_SECRET/);
    vi.stubEnv('AUTH_SECRET', SECRET);
    expect(getAuthSecret()).toBe(SECRET);
  });
});

describe('users (mock auth)', () => {
  afterEach(() => resetUserStore());

  it('hashes with a random salt and verifies', async () => {
    const [a, b] = await Promise.all([hashPassword('correct horse'), hashPassword('correct horse')]);
    expect(a).not.toBe(b);
    expect(await verifyPassword('correct horse', a)).toBe(true);
    expect(await verifyPassword('wrong', a)).toBe(false);
  });

  it('authenticates the seeded demo user and rejects bad credentials', async () => {
    expect(await authenticate(DEMO_USER.email, DEMO_USER.password)).toMatchObject({ email: DEMO_USER.email });
    expect(await authenticate(DEMO_USER.email, 'nope')).toBeNull();
    expect(await authenticate('nobody@example.com', 'whatever')).toBeNull();
  });

  it('creates users and refuses duplicates', async () => {
    expect(await createUser('Ana', 'ana@example.com', 'password123')).toMatchObject({ name: 'Ana' });
    expect(await createUser('Ana 2', 'ana@example.com', 'password123')).toBeNull();
    expect(await authenticate('ana@example.com', 'password123')).toMatchObject({ name: 'Ana' });
  });
});

describe('rate limiter', () => {
  it('allows `limit` hits per window, then blocks until the window resets', () => {
    const limiter = createRateLimiter(2, 60_000);
    expect(limiter.hit('k', 0).allowed).toBe(true);
    expect(limiter.hit('k', 1).allowed).toBe(true);
    const blocked = limiter.hit('k', 2);
    expect(blocked).toEqual({ allowed: false, retryAfterSeconds: 60 });
    expect(limiter.hit('other', 2).allowed).toBe(true);
    expect(limiter.hit('k', 60_001).allowed).toBe(true);
  });
});

describe('mock providers', () => {
  it('pages news deterministically without overlap, spreading categories evenly', () => {
    const first = mockNewsPage(['technology', 'sports'], 1, 4);
    const again = mockNewsPage(['technology', 'sports'], 1, 4);
    const second = mockNewsPage(['technology', 'sports'], 2, 4);
    expect(first.items.map((item) => item.id)).toEqual(again.items.map((item) => item.id));
    expect(first.items.map((item) => item.category)).toEqual(['technology', 'sports', 'technology', 'sports']);
    const firstIds = new Set(first.items.map((item) => item.id));
    expect(second.items.some((item) => firstIds.has(item.id))).toBe(false);
    expect(first.hasMore).toBe(true);
  });

  it('reports hasMore=false on the last page', () => {
    const last = mockNewsPage(['science'], MOCK_NEWS_PER_CATEGORY / 9, 9);
    expect(last.hasMore).toBe(false);
    expect(mockNewsPage(['science'], 99, 9).items).toEqual([]);
  });

  it('only produces https URLs and images', () => {
    const items = [
      ...mockNewsPage(['technology'], 1, 9).items,
      ...mockMoviesPage(['drama', 'comedy'], 1, 9).items,
      ...mockSocialPage(['ai', 'custom_tag'], 1, 9).items,
    ];
    for (const item of items) {
      expect(item.url.startsWith('https://')).toBe(true);
      if (item.imageUrl) expect(item.imageUrl.startsWith('https://')).toBe(true);
    }
  });

  it('labels each item with why it is shown', () => {
    expect(mockMoviesPage(['horror'], 1, 1).items[0]?.reason).toBe('genre:horror');
    expect(mockSocialPage(['space'], 1, 1).items[0]?.reason).toBe('hashtag:space');
  });

  it('creates unique live posts', () => {
    const a = mockLivePost(['ai']);
    const b = mockLivePost(['ai']);
    expect(a.id).not.toBe(b.id);
    expect(a.reason).toBe('live');
  });
});

describe('real provider adapters', () => {
  it('normalizes NewsAPI articles and drops removed or unsafe ones', () => {
    const good = normalizeNewsArticle(
      { title: 'Hello', description: 'World', url: 'https://news.example/a', urlToImage: 'http://insecure/img.png', source: { name: 'Example' } },
      'technology',
      'category:technology',
    );
    expect(good).toMatchObject({ type: 'news', title: 'Hello', imageUrl: null, source: 'Example' });
    expect(normalizeNewsArticle({ title: '[Removed]', url: 'https://x.example' }, 'general', 'x')).toBeNull();
    expect(normalizeNewsArticle({ title: 'XSS', url: 'javascript:alert(1)' }, 'general', 'x')).toBeNull();
  });

  it('normalizes TMDB movies and picks the matching preferred genre', () => {
    const item = normalizeTmdbMovie(
      { id: 7, title: 'Film', overview: 'Plot', backdrop_path: '/b.jpg', vote_average: 7.456, genre_ids: [28, 18] },
      ['drama'],
    );
    expect(item).toMatchObject({
      id: 'movie:tmdb-7',
      category: 'drama',
      reason: 'genre:drama',
      imageUrl: 'https://image.tmdb.org/t/p/w780/b.jpg',
      metrics: { label: 'rating', value: 7.5 },
    });
  });

  it('calls NewsAPI with the key in a header (never the URL) when configured', async () => {
    vi.stubEnv('NEWS_API_KEY', 'secret-key');
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ status: 'ok', totalResults: 50, articles: [{ title: 'A', url: 'https://a.example' }] })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await getNews(['technology'], 1, 9);
    expect(result).toMatchObject({ source: 'live', hasMore: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).not.toContain('secret-key');
    expect((init.headers as Record<string, string>)['X-Api-Key']).toBe('secret-key');
  });

  it('strips the redundant " - Outlet" suffix NewsAPI appends to headlines', () => {
    const item = normalizeNewsArticle(
      { title: 'Big story - Forbes', url: 'https://forbes.example/a', source: { name: 'Forbes' } },
      'business',
      'category:business',
    );
    expect(item?.title).toBe('Big story');
    expect(normalizeNewsArticle({ title: 'A - B - Forbes', url: 'https://x.example', source: { name: 'Other' } }, 'g', 'r')?.title).toBe(
      'A - B - Forbes',
    );
  });

  it('supports a TMDB v3 API key as a query parameter when no v4 token is set', async () => {
    vi.stubEnv('TMDB_API_READ_TOKEN', '');
    vi.stubEnv('TMDB_API_KEY', 'v3-key');
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ page: 1, total_pages: 3, results: [{ id: 1, title: 'Film', genre_ids: [18] }] })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await getMovies(['drama'], 1, 9);
    expect(result).toMatchObject({ source: 'live', hasMore: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.searchParams.get('api_key')).toBe('v3-key');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('prefers the v4 read token (header) over a v3 key', async () => {
    vi.stubEnv('TMDB_API_READ_TOKEN', 'v4-token');
    vi.stubEnv('TMDB_API_KEY', 'v3-key');
    expect(tmdbAuth()).toEqual({ headers: { Authorization: 'Bearer v4-token' }, params: {} });
    vi.stubEnv('TMDB_API_READ_TOKEN', '');
    vi.stubEnv('TMDB_API_KEY', '');
    expect(tmdbAuth()).toBeNull();
  });

  it('raises UpstreamError on upstream failure (no silent mock fallback)', async () => {
    vi.stubEnv('TMDB_API_READ_TOKEN', 'token');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })));
    await expect(getMovies(['drama'], 1, 9)).rejects.toBeInstanceOf(UpstreamError);
  });
});

describe('search', () => {
  it('requires every term to match', () => {
    const item = makeItem({ title: 'Quantum computing breakthrough', summary: 'Labs report progress', tags: ['science'] });
    expect(matchesQuery(item, 'quantum')).toBe(true);
    expect(matchesQuery(item, 'Quantum LABS')).toBe(true);
    expect(matchesQuery(item, 'quantum football')).toBe(false);
  });

  it('reports a failing source in failedSources while returning the rest', async () => {
    vi.stubEnv('NEWS_API_KEY', 'key');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 500 })));
    const result = await searchContent('ai', 'all', 1);
    expect(result.failedSources).toEqual(['news']);
    expect(result.allFailed).toBe(false);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.type !== 'news')).toBe(true);
  });
});
