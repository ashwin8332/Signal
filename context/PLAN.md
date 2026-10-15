# Plan — "Signal": Personalized Content Dashboard

## Context

The assignment is a 48-hour frontend take-home: build a **Personalized Content Dashboard** (news + movie recommendations + social posts) with React, Next.js, TypeScript, Redux Toolkit, API integration and tests (unit, integration, E2E), plus the optional bonuses (auth, real-time, i18n). Submission is a GitHub repo with a README.

Decisions already made with you:
- **Brand-new standalone project** at `C:\Users\hp\OneDrive\Desktop\personalized-content-dashboard`, with its own fresh `git init`. It has nothing to do with PlaceIQ, so no PlaceIQ code, conventions or history are carried over. The half-scaffolded `content-dashboard/` folder in the PlaceIQ worktree gets deleted.
- **Mock data by default, real APIs optional.** The app and all tests run offline. If `NEWS_API_KEY` / `TMDB_API_READ_TOKEN` are set in `.env.local`, the server uses the real NewsAPI / TMDB instead.

Process: I follow your two playbooks. Each stage goes **Understand → Define → Design → Build (vertical slices) → Verify**, with every stage written up in `docs/`. The UI follows the master UI/UX prompt: product brief first, then IA, wireframe-level structure, design tokens, component states, accessibility, responsiveness, differentiation, and a self-critique gate before finishing.

---

## 1. Product brief (Playbook Stage 0–4, UI prompt §6)

| | |
|---|---|
| **Product** | "Signal": one calm, personalized briefing of news, film picks and social chatter |
| **Primary user** | Busy, information-hungry professional, ~5–10 min sessions, desktop + mobile |
| **Primary job** | "Catch up on what matters to *me* across sources without hopping between apps" |
| **Secondary jobs** | Find a specific item (search), save for later (favorites), see what's hot (trending), tune what I see (settings) |
| **Success criteria** | User reaches personalized content within 1 click of login; changing a preference visibly changes the feed; every state (loading/empty/error/partial) gives a next action; WCAG 2.2 AA; Lighthouse a11y ≥ 95 |

**ASSUMPTIONS:** a single user per browser; mock auth is acceptable ("NextAuth.js *or* mock authentication"); a social API can be mocked ("this can be a mock API").
**OUT OF SCOPE:** real social-network OAuth, persistent database, email verification and password reset, push notifications.

### Differentiation thesis (UI prompt §37, "three directions")
- A. Familiar but superior: a standard card dashboard, polished. *Too generic.*
- B. **Workflow innovation (chosen):** the feed reads as a *briefing* the user controls and understands:
  1. **"Why you're seeing this"** chip on every card (e.g. "Because you follow Technology" / "#ai"). Personalization becomes transparent instead of magic.
  2. **Source-mix control**: a segmented control (All · News · Films · Social) plus per-source counts in the feed header.
  3. **Non-disruptive live updates**: new posts queue behind a "3 new posts" pill. The feed never jumps under the reader's eyes.
  4. **Reordering that works for everyone**: drag with the mouse, *or* keyboard/touch "Move earlier/later" controls with live-region announcements.
  5. **`/` shortcut** focuses search.
- C. Experience innovation (3D/immersive): rejected per UI prompt §69. It would be decorative.

---

## 2. User stories & acceptance criteria (Playbook Stage 6)

Each story becomes `docs/stories/US-0xx.md` using the playbook template. Summary:

| ID | Story (As a reader, I want…) | Key acceptance criteria (Given/When/Then, condensed) |
|---|---|---|
| US-01 | to sign in or sign up (or use a demo account) so my dashboard is mine | Bad credentials → inline error, password kept out of state; protected routes redirect to `/login?next=`; logout clears the session cookie; 5 failed attempts per minute → 429 with a friendly message |
| US-02 | to choose categories, film genres, hashtags, language and theme so the feed fits me | Changes apply instantly and survive reload (localStorage); can't deselect the last category (with an explanatory hint); "Reset to defaults" |
| US-03 | a unified feed of news + films + posts so I catch up in one place | Interleaved by source; skeletons on first load; infinite scroll + "Load more" button fallback; **partial failure**: one source down → others still render + inline "News unavailable — Retry"; all down → error state with Retry; no prefs match → empty state linking to Settings |
| US-04 | rich cards so I can decide quickly what to open | Image (fixed 16:9, lazy, gradient fallback on error), title, summary (3-line clamp), source/time, "why" chip, CTA ("Read article" / "View film" / "Open post") in a new tab with `rel=noopener`, favorite toggle with `aria-pressed` |
| US-05 | to reorder cards so the most important stay on top | Drag-and-drop with animated reflow; keyboard/touch "Move earlier/later" plus SR announcement; order persists across reload; new items append without breaking the custom order; "Reset order" |
| US-06 | trending items per category so I see what's hot | Tabs All/News/Films/Social; ranked list with rank numbers; loading/empty/error states |
| US-07 | to favorite items so I can come back later | Toggle from any card; Favorites page works offline (stores a snapshot); empty state → "Browse your feed"; remove with **Undo** toast (no confirmation dialog: the action is reversible) |
| US-08 | to search across sources while typing so I find things fast | 350 ms debounce (verified: one request per pause); type filter; results count announced via `aria-live`; empty-query hint, no-results state, error + retry; query reflected in the URL (`/search?q=`) so it's shareable/back-button safe |
| US-09 | live updates so the feed stays fresh | SSE `/api/stream` pushes a mock post every ~20 s; "N new posts" pill; click → prepend + scroll to top; toggle in Settings; auto-reconnect with backoff; paused when the tab is hidden |
| US-10 | dark mode so it's comfortable at night | Light / Dark / System; no flash on load (inline pre-hydration script); persisted |
| US-11 | the UI in my language | English, Español, Français via react-i18next; `<html lang>` updates; persisted |
| US-12 | to edit my profile (name, avatar color, bio) | Validated form with visible labels; success toast; persisted |

---

## 3. Information architecture & screens (UI prompt §8–10, §48)

```
/login, /signup               (auth layout: centered card, brand panel on ≥lg)
/(dashboard) layout           Sidebar (nav) + Header (search, theme, language, account menu)
  /            Feed           primary job: catch up    primary action: open/read
  /trending    Trending
  /favorites   Favorites
  /search      Search results (q in URL)
  /settings    Preferences panel
  /profile     Profile
```

**Layout system:** 12-col grid; content max-w 1280. Sidebar 240px on ≥lg, icon rail on md, off-canvas drawer on mobile (focus-trapped, Esc closes). Card grid: 1 col <640, 2 cols ≥640, 3 cols ≥1280. Breakpoints follow the content: cards get cramped below ~300px.
Each screen answers the four questions ("Where am I / what can I do / what happened / what next"): active nav state + page `<h1>`, plus toasts/live regions for feedback.

## 4. Design system (UI prompt §11–21, §32)

- **Tokens as CSS custom properties** in `globals.css`, mapped into Tailwind v4 `@theme`. Semantic names only: `--bg`, `--surface`, `--surface-raised`, `--text`, `--text-muted`, `--border`, `--primary`, `--primary-contrast`, `--success`, `--warning`, `--danger`, `--focus`, plus source accents `--news`, `--film`, `--social`. Dark theme overrides the same tokens on `.dark` (deep slate, not pure black). All pairs are contrast-checked ≥ 4.5:1.
- **Source identity never relies on color alone:** colored dot + icon + text label.
- **Type:** Inter (next/font, self-hosted), scale 12/14/16/20/24/30, body 16 / 1.5, measure ≤ 70ch.
- **Spacing:** 4/8/12/16/24/32/48/64. **Radius:** 8 (controls) / 12 (cards). **Elevation:** resting / raised (hover) / overlay (menus, drawer).
- **Motion:** 150–250 ms ease-out. Card hover lift, layout reflow on reorder, page fade/slide, skeleton shimmer. `MotionConfig reducedMotion="user"` plus a `prefers-reduced-motion` CSS guard.
- **Components** (`src/components/ui/`): Button (primary/secondary/ghost/danger; loading/disabled), IconButton (requires `label`), Input/TextField (label + hint + error), Switch, Checkbox chips, SegmentedControl/Tabs (roving tabindex), Card, Badge, Skeleton, Spinner, EmptyState, ErrorState, Toast (live region), Drawer, Menu.
- Icons: one family, **lucide-react**.

## 5. Architecture (Playbook Stage 8, ADRs in `docs/adr/`)

**Modular monolith in one Next.js app:** the App Router UI plus Route Handlers as a **BFF/proxy**.

```
Browser ──RTK Query──▶ /api/* (Next Route Handlers, server-only)
                         ├─ newsService     → NewsAPI (if key) | mock
                         ├─ moviesService   → TMDB (if token) | mock
                         ├─ socialService   → mock social API
                         ├─ trending/search → aggregate the three
                         ├─ stream (SSE)    → mock live posts
                         └─ auth            → in-memory user store + signed session cookie
```

| ADR | Decision | Why |
|---|---|---|
| 001 | Next.js (latest) App Router, TS strict | Required; route handlers keep keys server-side |
| 002 | RTK + **RTK Query** (incl. `infiniteQuery` for the feed) + `createAsyncThunk` for auth | Required; caching, dedupe, tag invalidation, pagination |
| 003 | BFF proxy + provider adapters with mock fallback | Security (no `NEXT_PUBLIC_` keys), offline tests, normalized `ContentItem` |
| 004 | Persistence via a small typed listener-middleware → localStorage (versioned key, schema-validated on load, SSR-safe) | Explicit and testable; avoids redux-persist hydration quirks with RSC |
| 005 | **react-dnd** (HTML5 backend) for DnD + Framer Motion for layout animation + keyboard alternative | Grid reordering (Framer `Reorder` is single-axis); a11y needs a non-drag path |
| 006 | Mock auth: scrypt-hashed passwords, HMAC-signed httpOnly cookie, verified in Next middleware/proxy | Real security patterns without an external IdP |
| 007 | SSE (not WebSockets) for live feed | One-way updates; works in serverless; trivial to reconnect |
| 008 | Vitest + RTL (unit/integration), Playwright (E2E) | Fast, TS-native; Playwright handles HTML5 DnD |

**Normalized model** (`src/types/content.ts`):
`ContentItem { id, type: 'news'|'movie'|'social', title, summary, imageUrl?, url, source, author?, publishedAt, category, tags[], reason, metrics? }`

**Redux state:** `preferences` (categories, genres, hashtags, language, theme, liveUpdates; persisted) · `favorites` (entities by id; persisted) · `feed` (custom order ids, active source filter, pending live items; order persisted) · `auth` (user, status; thunks login/signup/logout/fetchSession) · `profile` (persisted) · `ui` (toasts, mobile nav) · `contentApi` (RTK Query).

## 6. API contract (Playbook Stage 10 → `docs/api.md`)

All `GET`s are validated with **zod** (categories/genres from allow-lists, `page` 1–20, `pageSize` ≤ 30, `q` ≤ 100 chars). The error shape is always `{ error: { code, message } }`. Every response carries `{ items, page, hasMore, source: 'live'|'mock' }`.

| Endpoint | Purpose |
|---|---|
| `GET /api/news?categories=&page=` | News by preferred categories |
| `GET /api/recommendations?genres=&page=` | Film recommendations by genres |
| `GET /api/social?hashtags=&page=` | Mock social posts |
| `GET /api/trending?type=` | Top items per source |
| `GET /api/search?q=&type=&page=` | Cross-source search |
| `GET /api/stream` | SSE live posts (heartbeat every 15 s) |
| `POST /api/auth/{login,signup,logout,demo}` · `GET /api/auth/session` | Mock auth |

The feed's `infiniteQuery` calls news/recommendations/social in parallel per page and interleaves them client-side. Per-source errors are captured, so a partial failure shows the other sources.

## 7. Security / threat model (Playbook Stage 14 → `docs/security.md`)

- API keys stay server-side only; `.env.example` holds placeholders; `.env*` is gitignored.
- Session: httpOnly, `SameSite=Lax`, `Secure` in prod, 7-day expiry, HMAC-SHA256 with `AUTH_SECRET`. The app refuses to start in production without the secret.
- CSRF: `SameSite=Lax` plus an Origin check on auth POSTs. Login rate limit and generic "invalid email or password" responses (no user enumeration).
- XSS: no `dangerouslySetInnerHTML`; external URLs are allow-listed to `https:`; links use `rel="noopener noreferrer"`. Security headers (CSP, X-Content-Type-Options, Referrer-Policy, frame-ancestors) are set in `next.config`.
- SSRF: the server only calls fixed provider hosts; user input only goes into encoded query params.
- Never log secrets or passwords.

## 8. Test strategy & traceability (Playbook Stage 13 → `docs/testing.md`)

- **Unit (Vitest):** slices (preferences incl. "can't remove last category", favorites toggle, feed `reorder`/`applyOrder`), `interleave`, `useDebounce` (fake timers), persistence load/save (corrupt JSON → defaults), zod validators, session sign/verify (tampered token rejected), mock providers (deterministic paging).
- **Component/integration (RTL + stubbed `fetch`):** Feed renders the fetched items; empty state; full-error state + Retry; **partial failure** banner; infinite-scroll sentinel loads page 2; ContentCard favorite toggle + CTA link; SearchBar debounce → a single request; Settings change → feed refetch args; Login form validation + error; ThemeToggle applies the `.dark` class; route handlers tested directly (400 on bad params, mock fallback).
- **E2E (Playwright, Chromium, against `next build && next start`):** login (bad → error, demo → dashboard) and logout redirect; debounced search shows results and updates the URL; **drag-and-drop reorder** plus keyboard reorder, persisted after reload; favorite → appears on Favorites → persists; dark mode persists; language switch; error state via `page.route` failing `/api/news`; an axe a11y scan (`@axe-core/playwright`) on the main pages.
- Coverage target ≥ 80% lines on `src/lib` + `src/store`. A traceability table maps US → AC → tests.
- **CI:** `.github/workflows/ci.yml` runs typecheck → lint → vitest → build → playwright.

## 9. Implementation plan (vertical slices)

Project root: `C:\Users\hp\OneDrive\Desktop\personalized-content-dashboard`

0. **Cleanup + scaffold:** delete `content-dashboard/` from the PlaceIQ worktree; `git init`; package.json; install deps (next, react, @reduxjs/toolkit, react-redux, framer-motion, react-dnd(+html5 backend), i18next, react-i18next, zod, lucide-react; dev: typescript, tailwindcss v4 + @tailwindcss/postcss, eslint + eslint-config-next, vitest, @vitest/coverage-v8, @vitejs/plugin-react, jsdom, @testing-library/*, @playwright/test, @axe-core/playwright). Then check the installed APIs of the newest majors (Next 16 middleware→proxy naming, Tailwind 4 dark variant, Vitest 5 config) before writing code against them.
1. **Docs first:** `docs/01-product-brief.md`, `02-stories/`, `03-ui-spec.md` (tokens, components, screen specs), `04-architecture.md` + `adr/`, `05-api.md`, `06-security.md`, `07-testing.md`.
2. **Foundation:** tokens/globals.css, theme no-flash script, i18n, store + persistence, UI primitives, dashboard shell (sidebar/header/drawer).
3. **Slice: auth** (route handlers, session, middleware, login/signup pages, thunks), with tests.
4. **Slice: feed** (providers + mock data generators, `/api/news|recommendations|social`, RTK `infiniteQuery`, ContentCard, states, infinite scroll), with tests.
5. **Slice: preferences/settings** + profile, with tests.
6. **Slice: favorites** (+ undo toast), with tests.
7. **Slice: DnD reorder** (react-dnd + keyboard + persistence), with tests.
8. **Slice: search** (debounced, URL-synced) + **trending**, with tests.
9. **Slice: real-time** SSE + new-posts pill, with tests.
10. **E2E suite + CI workflow**; README (setup, env vars, scripts, architecture summary, demo account, test commands, deploy-to-Vercel notes).
11. **Quality gate (UI prompt §44 + Playbook DoD):** run the app in the browser pane at 375/768/1280/1600 widths, light/dark, keyboard-only pass, axe scan, Lighthouse; fix findings; final commit.

## 10. Verification

- `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`: all green.
- Manual run in the built-in browser: log in with the demo account; change categories → feed changes; scroll → page 2 loads; drag a card → reload → order kept; search "ai" → results after a pause; favorite → Favorites; toggle dark/language → reload keeps them; stop a source (`page.route`) → partial-failure UI; live pill appears.
- Screenshots of key screens (light/dark, mobile/desktop) saved to `docs/screenshots/` and referenced in the README.
- I'll create the local git repo and commit. **Pushing to GitHub and creating the remote repo is your step** (or I'll do it only if you ask).

---

## Addendum: iteration 2 (2026-10-16)

User request: apply the neo-brutalist reference design (`context/design-reference/`), use the real NewsAPI and TMDB keys (via `.env.local` only), add more demo data, make the dashboard richer, and add portable AI context (`context/`, `AGENTS.md`, `CLAUDE.md`, `.claude/`).

Decisions:
- **Adopt** the reference's visual language (mint grid paper, ink borders, hard offset shadows, Archivo / Space Mono, stamps and tags, black control bar) as design tokens, plus its *useful* patterns: an operations-console control bar, KPI tiles, an audit-style activity log, and status stamps.
- **Reject** its 3D seal (decorative 3D, UI playbook §69), sound effects (accessibility), and CDN scripts (strict CSP; fonts are self-hosted via `next/font`).
- TMDB: support the v3 `TMDB_API_KEY` (query param, server-only) in addition to the v4 read token (header, preferred).
- Make data provenance visible: a **Source mix** panel stamps each source LIVE API / DEMO DATA / UNAVAILABLE / OFF, so a failing key is obvious instead of silently masked.
- Dashboard layout: overview tiles → ticker → feed (spotlight first card, container-query grid) beside a sticky rail (source mix, trending top-5, session log).
