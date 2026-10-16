# 08 · Deployment (Vercel)

The app is a standard Next.js 16 project: Vercel detects it with zero config. Fonts are vendored (`@fontsource` + `next/font/local`), so the build needs no network access beyond `npm ci`.

## 1. One-time: create the Supabase tables

Supabase dashboard → **SQL Editor** → New query → paste [`supabase/migrations/0001_users_and_favorites.sql`](../supabase/migrations/0001_users_and_favorites.sql) → **Run**.

It creates `app_users` and `user_favorites` with **Row Level Security on and no public policies**: only the server (with the secret key) can read or write. Until it runs, the app keeps working with in-memory storage, and `/api/health` reports `"storage": "memory"`.

## 2. Import the repo in Vercel

New Project → import the GitHub repo → Framework: **Next.js** (auto) → keep the default build command (`next build`) and output.

## 3. Environment variables (Project → Settings → Environment Variables)

| Name | Required | Value |
|---|---|---|
| `AUTH_SECRET` | **Yes** | 32+ random chars: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `SUPABASE_URL` | Recommended | `https://<project-ref>.supabase.co` |
| `SUPABASE_SECRET_KEY` | Recommended | `sb_secret_…` (server-only; bypasses RLS) |
| `NEWS_API_KEY` | Optional | NewsAPI key. The free Developer plan is meant for development; if requests fail in production, the dashboard shows **UNAVAILABLE** for news, and removing the key switches to demo data |
| `TMDB_API_READ_TOKEN` or `TMDB_API_KEY` | Optional | TMDB v4 read token (preferred) or v3 key |
| `LIVE_FEED_INTERVAL_MS` | Optional | Live stream cadence (default 20000) |

Never prefix any of these with `NEXT_PUBLIC_`. `SUPABASE_PUBLISHABLE_KEY` is not needed: the browser never talks to Supabase directly.

## 4. Deploy and verify

1. Deploy, then open `https://<your-app>/api/health`. Expect `status: ok`, `authSecret: true`, and `storage: "supabase"` once the migration has run.
2. Open `/` (landing), click **Try the live demo**, and check that the dashboard's **Source mix** shows LIVE API for configured sources.
3. Sign up a second account and confirm its favorites are separate from the demo account's.

## Platform notes

- **Live updates** (`/api/stream`, SSE) run with `maxDuration = 300`. When Vercel ends a stream, the client reconnects with backoff; there is no user-visible effect.
- **Rate limiting** for sign-in is per instance (in memory). Fine for this scope; use Vercel KV / Upstash for a strict global limit.
- **Sessions** are stateless signed cookies, so they work across instances as long as every instance has the same `AUTH_SECRET`.

## Security checklist before going public

- [ ] Rotate any key that was ever pasted into chat, email or a ticket (Supabase secret key, NewsAPI, TMDB), and set the new values only in Vercel.
- [ ] `AUTH_SECRET` is unique to production.
- [ ] Migration applied; `/api/health` shows `storage: "supabase"`.
- [ ] `npm run test:all` green on the commit being deployed (CI does this on every push).
