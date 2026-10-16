// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, GET, PUT } from '@/app/api/favorites/route';
import { GET as health } from '@/app/api/health/route';
import { createSessionToken } from '@/lib/server/session';
import { resetFavoriteStore } from '@/lib/server/favorites';
import { authenticate, createUser, resetUserStore } from '@/lib/server/users';
import { supabaseState } from '@/lib/server/supabase';
import { SESSION_COOKIE } from '@/lib/constants';
import { makeItem } from '../fixtures';

const ORIGIN = 'http://localhost:3000';

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', 'integration-test-secret-0123456789-abcdef');
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_SECRET_KEY', '');
  supabaseState.unavailable = false;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetFavoriteStore();
  resetUserStore();
});

const cookieFor = (id: string) => `${SESSION_COOKIE}=${createSessionToken({ id, name: id, email: `${id}@example.com` })}`;

function request(method: string, userId: string | null, init: { body?: unknown; query?: string; origin?: string | null } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json', host: 'localhost:3000' };
  if (userId) headers.cookie = cookieFor(userId);
  if (init.origin !== null) headers.origin = init.origin ?? ORIGIN;
  return new NextRequest(`${ORIGIN}/api/favorites${init.query ?? ''}`, {
    method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

describe('/api/favorites (per-user)', () => {
  it('requires a session', async () => {
    expect((await GET(request('GET', null))).status).toBe(401);
    expect((await PUT(request('PUT', null, { body: { item: makeItem() } }))).status).toBe(401);
  });

  it('keeps each user’s favorites separate', async () => {
    const forAlice = makeItem({ title: 'Alice’s pick' });
    const forBob = makeItem({ title: 'Bob’s pick' });
    expect((await PUT(request('PUT', 'alice', { body: { item: forAlice } }))).status).toBe(204);
    expect((await PUT(request('PUT', 'bob', { body: { item: forBob } }))).status).toBe(204);

    const alice = await (await GET(request('GET', 'alice'))).json();
    const bob = await (await GET(request('GET', 'bob'))).json();
    expect(alice.items.map((item: { title: string }) => item.title)).toEqual(['Alice’s pick']);
    expect(bob.items.map((item: { title: string }) => item.title)).toEqual(['Bob’s pick']);
    expect(alice.storage).toBe('memory');
  });

  it('is idempotent and returns newest first', async () => {
    const first = makeItem({ title: 'First' });
    const second = makeItem({ title: 'Second' });
    await PUT(request('PUT', 'u1', { body: { item: first } }));
    await PUT(request('PUT', 'u1', { body: { item: second } }));
    await PUT(request('PUT', 'u1', { body: { item: first } }));
    const { items } = await (await GET(request('GET', 'u1'))).json();
    expect(items.map((item: { title: string }) => item.title)).toEqual(['First', 'Second']);

    expect((await DELETE(request('DELETE', 'u1', { query: `?id=${encodeURIComponent(first.id)}` }))).status).toBe(204);
    expect((await DELETE(request('DELETE', 'u1', { query: `?id=${encodeURIComponent(first.id)}` }))).status).toBe(204);
    const after = await (await GET(request('GET', 'u1'))).json();
    expect(after.items).toHaveLength(1);
  });

  it('rejects unsafe or malformed items and cross-origin writes', async () => {
    const evil = makeItem({ url: 'javascript:alert(1)' });
    expect((await PUT(request('PUT', 'u1', { body: { item: evil } }))).status).toBe(400);
    expect((await PUT(request('PUT', 'u1', { body: { nope: true } }))).status).toBe(400);
    expect((await PUT(request('PUT', 'u1', { body: { item: makeItem() }, origin: 'https://evil.example' }))).status).toBe(403);
    expect((await DELETE(request('DELETE', 'u1', { query: '' }))).status).toBe(400);
  });
});

describe('Supabase fallback', () => {
  it('uses Supabase when configured, and falls back to memory when its tables are missing', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example-ref.supabase.co/rest/v1/');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test');
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ code: 'PGRST205', message: 'not found' }), { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const created = await createUser('Ana', 'ana@example.com', 'password123');
    expect(created).toMatchObject({ email: 'ana@example.com' });
    expect(await authenticate('ana@example.com', 'password123')).toMatchObject({ name: 'Ana' });

    // The first call went to the project's REST endpoint with the secret key in headers only.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toMatch(/^https:\/\/example-ref\.supabase\.co\/rest\/v1\/app_users/);
    expect(String(url)).not.toContain('sb_secret_test');
    expect((init.headers as Record<string, string>).apikey).toBe('sb_secret_test');
    expect(supabaseState.unavailable).toBe(true);
  });

  it('maps a Supabase outage to 503 for favorites', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://example-ref.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await GET(request('GET', 'u1'));
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('STORAGE_UNAVAILABLE');
  });
});

describe('/api/health', () => {
  it('reports configuration as booleans only', async () => {
    vi.stubEnv('NEWS_API_KEY', 'secret-news-key');
    const body = await health().json();
    expect(body.status).toBe('ok');
    expect(body.integrations.newsApi).toBe(true);
    expect(JSON.stringify(body)).not.toContain('secret-news-key');
  });
});
