# 04 · Architecture

## Drivers

- **Security:** third-party API keys must never reach the browser.
- **Resilience:** any of the three sources can fail independently; the reader should still get the rest.
- **Offline-capable dev and CI:** reviewers and CI have no API keys.
- **Assignment constraints:** Next.js, TypeScript, Redux Toolkit, async logic through thunks or RTK Query, local persistence.
- **Scale assumption:** a single-user demo. No database is justified (playbook §50: defer complexity that no requirement forces).

## System context

```
┌────────────────────────── Browser ───────────────────────────┐
│ React (App Router client components)                         │
│   Redux store                                                │
│     preferences · favorites · feed · auth · profile · ui     │
│     contentApi (RTK Query cache)                             │
│   localStorage ◀── persistence listener (whitelisted slices) │
└───────────────┬───────────────────────────────▲──────────────┘
                │ fetch /api/*  (same origin)   │ SSE /api/stream
┌───────────────▼───────────────────────────────┴──────────────┐
│ Next.js server                                               │
│  proxy.ts: session check → redirect · CSP nonce              │
│  Route handlers (BFF)                                        │
│    /api/news ──────── newsProvider ── NewsAPI | mock         │
│    /api/recommendations  moviesProvider ── TMDB | mock       │
│    /api/social ────── socialProvider ── mock                 │
│    /api/trending, /api/search ── aggregate providers         │
│    /api/stream ────── SSE mock live posts                    │
│    /api/auth/* ────── userStore (memory) + signed cookie     │
└──────────────────────────────────────────────────────────────┘
```

## Module layout

```
src/
  app/                    routes (App Router)
    (auth)/login, signup   auth pages, no shell
    (dashboard)/…          shell layout + feed, trending, favorites, search, settings, profile
    api/…                  route handlers (server only)
  proxy.ts                 auth redirect + CSP
  components/
    ui/                    design-system primitives (Button, TextField, Chip, Tabs, Toast…)
    layout/                Sidebar, Header, SearchBar, AccountMenu, MobileNav
    content/               ContentCard, ContentGrid (DnD), states, skeletons
    feed/ trending/ favorites/ search/ settings/ profile/ auth/   feature components
  store/                   store setup, typed hooks, persistence listener
  features/                RTK slices: preferences, favorites, feed, auth, profile, ui
  services/contentApi.ts   RTK Query API (infinite feed, trending, search)
  lib/
    server/                providers, mock data, session, users, rate limit (server only)
    feed.ts                interleave / applyOrder / reorder (pure)
    validation.ts          zod schemas shared by client and server
    constants.ts           categories, genres, default hashtags
  hooks/                   useDebounce, useInfiniteScroll, useLiveFeed, useHotkey
  i18n/                    i18next setup + locales (en, es, fr)
  types/                   shared types (ContentItem, API responses)
```

`lib/server/*` imports `server-only`, so an accidental client import fails the build.

## Key flows

**Feed page N.** `useGetFeedInfiniteQuery({categories, genres, hashtags})` runs `queryFn` with page N. It calls `/api/news`, `/api/recommendations` and `/api/social` in parallel with `Promise.allSettled`, so a failed source becomes a `failedSources[]` entry instead of an error. The page result is `interleave(news, movies, posts)`. `hasMore` is true if any source has more. The UI then flattens the pages, applies the source filter and the custom order (`applyOrder`), and renders.

**Preference change.** The slice updates, which changes the query argument and gives RTK Query a new cache key, so the feed refetches page 1. The persistence listener writes to `localStorage` (debounced 250 ms).

**Reorder.** react-dnd's `hover`/`drop` (or the keyboard buttons) dispatch `feed/moveItem({ visibleIds, from, to })`. The reducer stores the full visible order. `applyOrder` keeps ordered ids first, then appends unseen ids in their natural order.

**Live.** `useLiveFeed` opens an `EventSource('/api/stream')` while live updates are enabled and the tab is visible. Incoming posts go to `feed.pending`; the pill dispatches `feed/flushPending`, which prepends them.

## Architecture Decision Records

### ADR-001 · Next.js App Router with Route Handlers as a BFF
**Context:** API keys must stay secret, and NewsAPI's free plan rejects browser requests. **Decision:** every external call goes through `/api/*` route handlers that normalize results into `ContentItem`. **Alternatives:** calling the APIs from the browser (leaks keys, fails CORS); a separate Express server (extra deployable). **Consequences:** one deployable unit; providers are unit-testable. **Revisit when:** the server needs a shared cache or a DB.

### ADR-002 · Redux Toolkit + RTK Query (`infiniteQuery`), thunks for auth
**Context:** the assignment requires RTK and async logic. **Decision:** RTK Query for all content reads (caching, dedupe, `infiniteQuery` pagination, `refetch`), and `createAsyncThunk` for auth, which is command-like and updates slice state. **Alternatives:** thunks only (we'd hand-roll caching); React Query (not Redux). **Revisit when:** content mutations appear.

### ADR-003 · Provider adapters with a mock fallback
**Decision:** each provider uses the real API when its key is set, otherwise deterministic demo data. **Revised (iteration 5):** when a configured API fails (rate limit, outage, bad key), that source serves demo data for 15 minutes (a cooldown, so a rate-limited API is not hammered). Responses carry `source: "mock"`, so the dashboard stamps the source **DEMO DATA**: a labelled fallback, never a silent swap. Trigger: NewsAPI's free plan (100 requests/day) blanked news and trending during testing.

### ADR-004 · Own persistence listener instead of redux-persist
**Decision:** a `createListenerMiddleware` effect writes whitelisted slices (`preferences`, `favorites`, `feed.order`, `profile`) to one versioned key. On load the data is validated with zod and falls back to defaults if invalid. Hydration happens on the client after mount through a `hydrate` action, so server and client first render match (no hydration mismatch). The theme alone is applied pre-paint by the inline script. **Alternatives:** redux-persist (a PersistGate delays render and its `rehydrate` semantics are opaque). **Trade-off:** we own ~60 lines of code, which are fully tested.

### ADR-005 · react-dnd + Framer Motion layout + keyboard alternative
**Decision:** react-dnd's HTML5 backend handles pointer drag in a 2-D grid. Framer Motion's `layout` animates the reflow. "Move earlier/later" buttons give keyboard and touch users the same capability (WCAG 2.5.7, dragging movements). **Alternatives:** Framer `Reorder` (one axis only, so it can't do a grid); dnd-kit (good, but the brief names React DnD or Framer Motion).

### ADR-006 · Mock authentication with real security mechanics
**Decision:** an in-memory user store seeded with a demo account; scrypt password hashes; a session token of `base64url(payload).HMAC-SHA256(AUTH_SECRET)` in an httpOnly, `SameSite=Lax`, `Secure` (in prod) cookie with a 7-day expiry. `proxy.ts` redirects requests without a valid session; route handlers re-verify the session. **Alternatives:** NextAuth Credentials (extra dependency, same in-memory limitation). **Revisit when:** a real IdP or database exists. Then swap in Auth.js; the UI and slices don't change.

### ADR-007 · Server-Sent Events for real-time
**Decision:** SSE (`ReadableStream` with `text/event-stream`), a heartbeat every 15 s, and client reconnect with exponential backoff. **Why:** updates flow one way, SSE needs no extra server, and the browser reconnects natively. **Alternative:** WebSockets (bidirectional, which we don't need, and awkward on serverless).

### ADR-008 · Vitest + Testing Library + Playwright
**Decision:** Vitest (fast, native TS/ESM) with jsdom for components; `fetch` is stubbed at the boundary, so RTK Query runs for real. Playwright runs against a production build for E2E, including real HTML5 drag-and-drop and axe accessibility scans.
