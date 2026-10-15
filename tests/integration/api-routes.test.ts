// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getNews } from '@/app/api/news/route';
import { GET as getRecommendations } from '@/app/api/recommendations/route';
import { GET as getSocial } from '@/app/api/social/route';
import { GET as getTrending } from '@/app/api/trending/route';
import { GET as getSearch } from '@/app/api/search/route';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as signup } from '@/app/api/auth/signup/route';
import { POST as demo } from '@/app/api/auth/demo/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { GET as session } from '@/app/api/auth/session/route';
import { buildCsp } from '@/proxy';
import { createSessionToken } from '@/lib/server/session';
import { DEMO_USER, resetUserStore } from '@/lib/server/users';
import { loginLimiter } from '@/lib/server/rateLimit';
import { SESSION_COOKIE } from '@/lib/constants';

const ORIGIN = 'http://localhost:3000';

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', 'integration-test-secret-0123456789-abcdef');
  vi.stubEnv('NEWS_API_KEY', '');
  vi.stubEnv('TMDB_API_READ_TOKEN', '');
  vi.stubEnv('TMDB_API_KEY', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetUserStore();
  loginLimiter.clear();
});

function authedGet(path: string) {
  const token = createSessionToken({ id: 'u1', name: 'Ana', email: 'ana@example.com' });
  return new NextRequest(`${ORIGIN}${path}`, { headers: { cookie: `${SESSION_COOKIE}=${token}` } });
}

function post(path: string, body?: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { 'content-type': 'application/json', host: 'localhost:3000' };
  if (origin) headers.origin = origin;
  return new NextRequest(`${ORIGIN}${path}`, { method: 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

describe('content routes', () => {
  it('reject unauthenticated requests with 401 and the standard error shape', async () => {
    const response = await getNews(new NextRequest(`${ORIGIN}/api/news?categories=technology`));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Sign in to continue.' } });
  });

  it('serve mock news when no API key is configured', async () => {
    const response = await getNews(authedGet('/api/news?categories=technology,sports&page=2&pageSize=6'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ page: 2, source: 'mock', hasMore: true });
    expect(body.items).toHaveLength(6);
  });

  it('validate query params (400 with the offending field)', async () => {
    const response = await getNews(authedGet('/api/news?categories=hacking'));
    expect(response.status).toBe(400);
    expect((await response.json()).error.message).toMatch(/categories/);
    expect((await getRecommendations(authedGet('/api/recommendations?genres=drama&page=500'))).status).toBe(400);
    expect((await getSocial(authedGet('/api/social?hashtags=bad tag'))).status).toBe(400);
    expect((await getSearch(authedGet('/api/search?q='))).status).toBe(400);
  });

  it('return 502 when a configured upstream fails', async () => {
    vi.stubEnv('TMDB_API_READ_TOKEN', 'token');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    const response = await getRecommendations(authedGet('/api/recommendations?genres=drama'));
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe('UPSTREAM_ERROR');
  });

  it('rank trending items and limit them', async () => {
    const response = await getTrending(authedGet('/api/trending?type=movie&limit=5'));
    const { items } = await response.json();
    expect(items).toHaveLength(5);
    const ratings = items.map((item: { metrics: { value: number } }) => item.metrics.value);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
    expect(items.every((item: { reason: string }) => item.reason === 'trending')).toBe(true);
  });

  it('search across sources', async () => {
    const response = await getSearch(authedGet('/api/search?q=ai&type=social'));
    const body = await response.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((item: { type: string }) => item.type === 'social')).toBe(true);
    expect(body.failedSources).toEqual([]);
  });
});

describe('auth routes', () => {
  it('log in with valid credentials and set an httpOnly SameSite cookie', async () => {
    const response = await login(post('/api/auth/login', { email: DEMO_USER.email, password: DEMO_USER.password }));
    expect(response.status).toBe(200);
    expect((await response.json()).user.email).toBe(DEMO_USER.email);
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it('give the same generic error for a wrong password and an unknown email', async () => {
    const wrongPassword = await login(post('/api/auth/login', { email: DEMO_USER.email, password: 'wrong' }));
    const unknownUser = await login(post('/api/auth/login', { email: 'nobody@example.com', password: 'wrong' }));
    expect(wrongPassword.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownUser.json());
  });

  it('rate-limit repeated failures (429 + Retry-After)', async () => {
    const attempt = () => login(post('/api/auth/login', { email: DEMO_USER.email, password: 'wrong' }));
    for (let index = 0; index < 5; index += 1) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('reject cross-origin or origin-less POSTs (CSRF)', async () => {
    expect((await demo(post('/api/auth/demo', undefined, 'https://evil.example'))).status).toBe(403);
    expect((await demo(post('/api/auth/demo', undefined, null))).status).toBe(403);
    expect((await logout(post('/api/auth/logout', undefined, 'https://evil.example'))).status).toBe(403);
  });

  it('sign up, then reject the same email (409)', async () => {
    const details = { name: 'Ana', email: 'ana@example.com', password: 'password123' };
    expect((await signup(post('/api/auth/signup', details))).status).toBe(201);
    expect((await signup(post('/api/auth/signup', details))).status).toBe(409);
    expect((await signup(post('/api/auth/signup', { ...details, password: 'short' }))).status).toBe(400);
  });

  it('report the session and clear it on logout', async () => {
    const loginResponse = await demo(post('/api/auth/demo'));
    const token = /signal_session=([^;]+)/.exec(loginResponse.headers.get('set-cookie') ?? '')?.[1];
    const sessionResponse = await session(new NextRequest(`${ORIGIN}/api/auth/session`, { headers: { cookie: `${SESSION_COOKIE}=${token}` } }));
    expect((await sessionResponse.json()).user.email).toBe(DEMO_USER.email);

    const logoutResponse = await logout(post('/api/auth/logout'));
    expect(logoutResponse.status).toBe(204);
    expect(logoutResponse.headers.get('set-cookie')).toMatch(/Max-Age=0/i);

    expect((await session(new NextRequest(`${ORIGIN}/api/auth/session`))).status).toBe(401);
  });
});

describe('content security policy', () => {
  it('locks scripts to a nonce and forbids framing and plugins', () => {
    const csp = buildCsp('abc123', false);
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });
});
