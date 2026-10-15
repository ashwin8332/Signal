# Signal: Personalized Content Dashboard

One personalized briefing of **news**, **film recommendations** and **social posts**, presented as a bold **neo-brutalist operations dashboard**. Readers pick their interests, arrange the feed by drag-and-drop, search across everything, save favorites, watch source health, and get live updates that never yank the page while they read.

Built with **Next.js 16 (App Router) · React 19 · TypeScript (strict) · Redux Toolkit + RTK Query · Tailwind CSS 4 · Framer Motion · React DnD · react-i18next**, tested with **Vitest + Testing Library** and **Playwright**.

> **No API keys needed to try it.** Every source has a realistic, deterministic mock provider. Add NewsAPI or TMDB keys and the server switches to the real APIs automatically.

---

## Quick start

Requirements: **Node.js 20.9+** (22 recommended) and npm.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000 and click **Continue with demo account**, or create an account.
Prefer the form? The seeded demo login is in `src/lib/server/users.ts` (`DEMO_USER`).

### Optional: real APIs

```bash
cp .env.example .env.local
```

| Variable | Purpose | Without it |
|---|---|---|
| `NEWS_API_KEY` | [NewsAPI](https://newsapi.org/register) top headlines and search | Mock news |
| `TMDB_API_READ_TOKEN` | [TMDB](https://www.themoviedb.org/settings/api) v4 read token (sent as a header, preferred) | Mock films |
| `TMDB_API_KEY` | …or the TMDB v3 API key (sent as a query parameter, server-side only) | Mock films |
| `AUTH_SECRET` | Signs session cookies (32+ chars). **Required in production.** | Dev-only fallback, with a warning |
| `LIVE_FEED_INTERVAL_MS` | How often the live stream pushes a post (default 20000) | 20 s |

Keys are read **only on the server** (`src/lib/server/env.ts`, guarded by `server-only`) and never shipped to the browser.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript + React Compiler rules) |
| `npm test` | Unit and integration tests (Vitest) |
| `npm run test:coverage` | Same, with a coverage report in `coverage/` |
| `npm run test:e2e` | Playwright E2E against a production build (run `npx playwright install chromium` once first) |
| `npm run test:all` | Everything above, in order |

---

## Requirements → implementation

| Assignment requirement | Where |
|---|---|
| **Preferences** (categories, genres, hashtags) persisted | `features/preferences`, Settings page, `store/persistence.ts` (localStorage, zod-validated) |
| **News API** by category | `/api/news` → `lib/server/providers.ts` (NewsAPI `top-headlines`, or mock) |
| **Recommendations API** (TMDB) | `/api/recommendations` (TMDB `discover/movie` by genre, or mock) |
| **Social API** (mock) by hashtags | `/api/social` → `lib/server/mock/social.ts` |
| **Cards** with image, headline, description, CTA | `components/content/ContentCard.tsx` ("Read article" / "View film" / "Open post") |
| **Infinite scrolling** + pagination | RTK Query `infiniteQuery` + IntersectionObserver sentinel, with a "Load more" fallback |
| **Layout**: sidebar, header with search, settings, account | `components/layout/*` (sidebar → icon rail → mobile drawer) |
| **Unified feed / Trending / Favorites** | `/`, `/trending`, `/favorites` |
| **Search** across categories, **debounced** | Header `SearchBar` (350 ms debounce → URL `/search?q=`), `/api/search` |
| **Drag-and-drop** reordering | React DnD (HTML5 backend) + Framer Motion layout animation, plus keyboard/touch move buttons |
| **Dark mode** (CSS custom properties + Tailwind) | Semantic tokens in `app/globals.css`, class strategy, no-flash inline script |
| **Animations** | Page transitions, card hover lift, layout reflow, skeleton shimmer, spinners, toasts; all honor `prefers-reduced-motion` |
| **Redux Toolkit**, **RTK Query**, **thunks** | `store/`, `features/*`, `services/contentApi.ts`, `createAsyncThunk` for auth |
| **localStorage** persistence | Debounced listener middleware; versioned key; schema-validated on load |
| **Unit / integration / E2E tests** | `tests/unit`, `tests/integration`, `e2e/` (see [Testing](#testing)) |
| Bonus: **Authentication** + profile | Mock auth with real mechanics (scrypt, HMAC-signed httpOnly cookie, proxy guard), `/profile` |
| Bonus: **Real-time** | Server-Sent Events `/api/stream` + "N new posts" pill |
| Bonus: **i18n** | react-i18next: English, Español, Français (type-checked key parity) |

### The dashboard
- **Control bar**: an operations-console strip with the live-stream status (LIVE / CONNECTING / RECONNECTING / PAUSED / OFF) and a running clock.
- **KPI tiles**: items in your briefing, saved items, live posts, active interests.
- **Headline ticker**: pausable, hidden from screen readers (it duplicates the feed), static under reduced motion.
- **Spotlight**: the first card spans two columns. Drag anything to the top and it becomes the spotlight.
- **Source mix**: a stacked bar of the source split, plus a stamp per source saying **LIVE API**, **DEMO DATA**, **UNAVAILABLE** or **OFF**, so a broken or missing key is visible instead of silently masked.
- **Trending top-5** and an audit-style **session log** of what you changed and when.

### Design
Neo-brutalist, adapted from the reference in [`context/design-reference/`](context/design-reference): mint grid-paper background, ink borders, hard offset shadows, square corners, Archivo display, Hanken Grotesk body, Space Mono data labels, stamps and tags. It is all tokenized in `src/app/globals.css` with a full dark theme (mint-on-charcoal). The reference's decorative 3D seal, sound effects and CDN scripts were deliberately not adopted (performance, accessibility, strict CSP).

### Beyond the brief (the differentiation)
- **"Why you're seeing this"**: every card explains itself ("You follow Technology", "You like Drama", "Trending now").
- **Source mix control**: filter the unified feed by source, with live counts.
- **Non-disruptive live updates**: new posts queue behind a pill and never shift what you're reading.
- **Reordering for everyone**: drag with a mouse, or use the move buttons with keyboard or touch. Moves are announced to screen readers and focus follows the card.
- **Graceful partial failure**: if TMDB is down, news and posts still load, with an inline "Film picks couldn't load. Try again".
- `/` focuses search from anywhere; `Esc` clears it.

---

## Architecture

```
Browser (React + Redux store)                         Next.js server
┌──────────────────────────────┐   fetch /api/*    ┌───────────────────────────────────┐
│ preferences · favorites ·     │ ───────────────▶ │ proxy.ts: session redirect + CSP  │
│ feed · auth · profile · ui    │                  │ Route handlers (BFF)               │
│ contentApi (RTK Query cache)  │ ◀─── SSE ─────── │  news → NewsAPI | mock             │
│ localStorage ◀ persistence    │  /api/stream     │  recommendations → TMDB | mock     │
└──────────────────────────────┘                   │  social, trending, search, stream │
                                                   │  auth → users (memory) + cookie   │
                                                   └───────────────────────────────────┘
```

- **Backend-for-frontend.** All third-party calls go through Route Handlers that validate input (zod allow-lists), add 8 s timeouts and 5-minute caching, and normalize everything into one `ContentItem` shape. A failing upstream returns `502` and the UI degrades per source. It never silently swaps in fake data.
- **RTK Query** owns server state. The feed is one `infiniteQuery` whose `queryFn` fetches the enabled sources in parallel and interleaves them. A failed source becomes `failedSources[]` instead of an error. Changing an interest changes the query argument (via a memoized selector), which triggers exactly one refetch.
- **Slices** own client state. A custom **listener middleware** persists the whitelisted slices (debounced 250 ms) and **hydrates after mount**, so server and client render identically (no hydration mismatch). The feed query waits for hydration, so it never fetches defaults and then refetches.
- **Ordering** is pure, tested logic in `lib/feed.ts`. Saved ids come first; newly loaded items append in natural order; reordering a filtered view keeps hidden items in their slots.

The full write-up and the 8 ADRs are in [`docs/04-architecture.md`](docs/04-architecture.md).

```
src/
  app/            routes: (auth)/login, signup · (dashboard)/feed, trending, favorites, search, settings, profile · api/*
  proxy.ts        auth redirect + per-request CSP nonce (Next 16's successor to middleware)
  components/     ui/ (design system) · layout/ · content/ · feed/ · search/ · settings/ · …
  features/       Redux slices + selectors
  services/       RTK Query API
  store/          store, typed hooks, persistence, hydrate action
  lib/            pure logic (feed ordering, validation, formatting) · server/ (providers, mocks, session, users)
  hooks/          useDebounce, useInfiniteScroll, useLiveFeed, useHotkey, useIsDark
  i18n/           i18next setup + en / es / fr
tests/            unit/ · integration/ (route handlers + components) · fixtures and render helpers
e2e/              Playwright specs
docs/             product brief, user stories, UI spec, architecture + ADRs, API contract, security, testing
```

---

## Testing

| Layer | Tool | What it covers |
|---|---|---|
| **Unit** | Vitest | Feed ordering/interleave, all slices (incl. "can't remove last category", undo), persistence (corrupt or poisoned storage), validation & open-redirect guard, session tokens (tampered, expired, wrong secret), rate limiter, mock providers (deterministic paging), real-API adapters (key in header, not URL), debounce, backoff, i18n key parity and plurals |
| **Integration (API)** | Vitest + real `NextRequest` | Every route: 401s, 400 validation, 502 upstream errors, login cookie flags, generic credential errors, rate limiting (429 + `Retry-After`), CSRF origin checks, signup conflicts, logout, CSP |
| **Integration (UI)** | Testing Library, real store + RTK Query, `fetch` stubbed at the boundary | Feed: loading, interleaving, **partial failure + retry**, **total failure**, **empty state**, filters with arrow keys, **infinite scroll page 2**, keyboard reordering + announcement, refetch on preference change. Cards, favorites + undo, debounced search (fake timers: one navigation per pause), search states, trending, settings validation, login errors and redirects, theme toggle, live pill, toasts |
| **E2E** | Playwright (production build) | Auth redirects/sign-up/sign-out, CSP headers, feed + infinite scroll, settings → feed, partial and total outage, live updates, debounced search, **real drag-and-drop with persistence across reload**, keyboard reordering, favorites persistence + undo, dark mode with no flash, language switch, profile, **axe WCAG 2.2 AA scans** (light + dark), skip link, mobile drawer and touch targets |

The strategy and traceability (story → test) are in [`docs/07-testing.md`](docs/07-testing.md). CI (`.github/workflows/ci.yml`) runs typecheck → lint → unit/integration with coverage → E2E.

---

## Security

- **Secrets** live only on the server; there are no `NEXT_PUBLIC_` keys, and NewsAPI's key travels in a header, never the URL.
- **Sessions**: an HMAC-SHA256-signed token in an `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookie, compared in constant time, expiring after 7 days. `proxy.ts` guards pages and every API handler re-verifies.
- **Passwords**: scrypt with a per-user salt. Unknown emails take the same path, so timing doesn't reveal which accounts exist.
- **CSRF**: `SameSite=Lax` plus an Origin check on every auth POST. **Brute force**: 5 attempts per minute → 429.
- **XSS**: React escaping, a per-request **CSP nonce** with `strict-dynamic`, `https:`-only URLs from providers, `rel="noopener noreferrer"`, `frame-ancestors 'none'`.
- **Input**: zod allow-lists on every route; open-redirect guard on `?next=`; localStorage treated as untrusted and validated on load.

Threat model, accepted risks (in-memory auth store, `style-src 'unsafe-inline'`, a dev-only `npm audit` finding) and their mitigations: [`docs/06-security.md`](docs/06-security.md).

## Accessibility

Targets WCAG 2.2 AA, verified with axe in E2E (light and dark). Highlights: semantic landmarks and one `h1` per page; a skip link; visible focus rings everywhere; contrast-checked tokens in both themes; source identity shown with icon + label, never color alone; labelled forms with inline errors and `aria-invalid`; the WAI-ARIA tabs pattern; a native `<dialog>` mobile drawer; a toast live region that pauses on hover/focus; ≥44 px touch targets; a keyboard alternative for drag-and-drop (WCAG 2.5.7); `prefers-reduced-motion` respected.

## Performance

Debounced search (one request per pause); RTK Query caching and de-duplication; paged fetching with infinite scroll; memoized selectors so preference changes trigger one refetch; persistence writes debounced; 5-minute server-side caching of upstream calls; lazy images in fixed 16:9 frames (no layout shift) with skeletons; live stream paused while the tab is hidden.

---

## Deploying (e.g. Vercel)

1. Push the repo and import it in Vercel (framework: Next.js).
2. Set `AUTH_SECRET` (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`), and optionally `NEWS_API_KEY` / `TMDB_API_READ_TOKEN`.
3. Deploy. Note: NewsAPI's free plan only allows requests from localhost; on a deployed site without a paid key, leave `NEWS_API_KEY` empty to use mock news.

## Known limitations

- Mock authentication keeps accounts **in server memory**: they reset on restart and aren't shared between serverless instances. The demo account always works. The production path is Auth.js plus a database; the UI and slices wouldn't change (ADR-006).
- Preferences, favorites and order are stored **per browser** (localStorage), not synced across devices.
- The social network is mocked, as the brief allows.

## Live API verification

With the keys in `.env.local`, the app's own routes were exercised end to end (2026-10-16): `/api/news` returned live NewsAPI headlines, `/api/recommendations` returned live TMDB films (with paging), `/api/trending` mixed live news and films, and `/api/search` returned live results ("batman" → *The Batman*, *Batman Begins*). The Source mix panel shows **LIVE API** for both. Automated tests and CI never use real keys; they run on deterministic demo data.

## AI-portable context

`AGENTS.md` (read automatically by most AI coding tools) and `CLAUDE.md` hold a compact project brief. [`context/`](context/README.md) holds status, conventions, the plan, the process playbooks and the design reference, each with guidance on *when* to read it. `.claude/` adds a preview launch config and `/verify` and `/resume` commands. Another tool can pick the project up without re-reading the codebase.

## Process docs

Built following a product-engineering playbook: [product brief](docs/01-product-brief.md) · [user stories & acceptance criteria](docs/02-user-stories.md) · [UI specification](docs/03-ui-spec.md) · [architecture & ADRs](docs/04-architecture.md) · [API contract](docs/05-api.md) · [security](docs/06-security.md) · [testing](docs/07-testing.md).
