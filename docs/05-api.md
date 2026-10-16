# 05 · API contract

All endpoints are same-origin Route Handlers. Every content endpoint requires a valid session cookie (otherwise `401`).

**Errors** always use one shape:

```json
{ "error": { "code": "BAD_REQUEST", "message": "Human-readable explanation" } }
```

| Status | `code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Query/body failed zod validation |
| 401 | `UNAUTHORIZED` | No or invalid session |
| 403 | `FORBIDDEN` | Cross-origin POST (Origin mismatch) |
| 409 | `CONFLICT` | Signup with an existing email |
| 429 | `RATE_LIMITED` | Too many login attempts (`Retry-After` header) |
| 502 | `UPSTREAM_ERROR` | Only when every searched source fails. A single failing NewsAPI/TMDB call falls back to demo data (`source: "mock"`) with a 15-minute cooldown |

## Content model

```ts
type ContentType = 'news' | 'movie' | 'social';

interface ContentItem {
  id: string;            // globally unique, prefixed: "news:…", "movie:…", "social:…"
  type: ContentType;
  title: string;
  summary: string;
  imageUrl: string | null;   // https only, else null
  url: string;               // https only
  source: string;            // "The Verge", "TMDB", "@dev_jane"
  author: string | null;
  publishedAt: string;       // ISO-8601
  category: string;          // news category / primary genre / first hashtag
  tags: string[];
  reason: string;            // machine key for "why you're seeing this", e.g. "category:technology"
  metrics: { label: 'rating' | 'likes' | 'reads'; value: number } | null;
}

interface PageResponse { items: ContentItem[]; page: number; hasMore: boolean; source: 'live' | 'mock' }
```

## Endpoints

| ID | Method & path | Query / body | Response | Notes |
|---|---|---|---|---|
| API-1 | `GET /api/news` | `categories` (csv from the allow-list, 1–7), `page` (1–20, default 1), `pageSize` (1–30, default 9) | `PageResponse` | NewsAPI `top-headlines` per category, merged by date. Cached 5 min server-side |
| API-2 | `GET /api/recommendations` | `genres` (csv from the allow-list, 1–8), `page`, `pageSize` | `PageResponse` | TMDB `discover/movie?with_genres=` sorted by popularity |
| API-3 | `GET /api/social` | `hashtags` (csv, each `^[a-z0-9_]{2,30}$`, 1–10), `page`, `pageSize` | `PageResponse` | Mock social network |
| API-4 | `GET /api/trending` | `type` = `all`/`news`/`movie`/`social`, `limit` (1–20, default 10) | `{ items }` ranked | Ranked by the popularity metric |
| API-5 | `GET /api/search` | `q` (1–100 chars, trimmed), `type` = `all`/`news`/`movie`/`social`, `page` | `PageResponse` + `failedSources[]` | NewsAPI `everything`, TMDB `search/movie`, mock social |
| API-6 | `GET /api/stream` | – | `text/event-stream`; `event: post` with a `ContentItem`, `: ping` every 15 s | Interval from `LIVE_FEED_INTERVAL_MS` |
| API-7 | `POST /api/auth/login` | `{ email, password }` | `{ user }` + `Set-Cookie` | Rate limit 5/min per IP+email; generic error |
| API-8 | `POST /api/auth/signup` | `{ name, email, password }` | `201 { user }` + cookie | 409 if the email exists |
| API-9 | `POST /api/auth/demo` | – | `{ user }` + cookie | Signs in the seeded demo user; no password leaves the server |
| API-10 | `POST /api/auth/logout` | – | `204` + cookie cleared | Idempotent |
| API-11 | `GET /api/auth/session` | – | `{ user }` or `401` | Used on app load |

`user` = `{ id, name, email }`. Password hashes never leave the user store.

**Allow-lists** (`src/lib/constants.ts`):
- categories: `business, entertainment, general, health, science, sports, technology`
- genres: `action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, horror, romance, science-fiction, thriller` (mapped to TMDB genre ids)
