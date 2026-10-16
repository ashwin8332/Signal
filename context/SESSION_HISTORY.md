# Session history (condensed)

The full build conversation, compressed. Read this instead of the chat log. Newest iteration last.

## Brief (from the user)
Build "Personalized Content Dashboard" for a frontend take-home (React, Next.js, TS, Redux Toolkit, APIs, tests): news (NewsAPI), recommendations (TMDB), social (mock); preferences; cards with CTAs; infinite scroll; sidebar + header with search; feed / trending / favorites; debounced search; drag-and-drop; dark mode; animations; RTK + thunks/RTK Query; localStorage; unit + integration + E2E tests; bonuses: auth, real-time, i18n. The user wants it "comprehensive, attractive, intimidating", following their playbooks (kept outside the repo) and the neo-brutalist reference (`context/design-reference/`).

## Standing decisions
- Standalone repo (not the PlaceIQ project): `C:\Users\hp\OneDrive\Desktop\personalized-content-dashboard`, GitHub `ashwin8332/Signal`, branch `main`.
- Product name **Signal**. Mock data by default; real APIs when keys exist (server-only, `.env.local`).
- Process: planning docs first (`docs/01–08`), vertical slices, tests with every change.

## Iterations
1. **Core build**: Next 16 / React 19 / RTK Query `infiniteQuery` / Tailwind 4 / react-dnd / Framer / i18next; BFF route handlers + deterministic mocks; mock auth (scrypt, HMAC cookie, `proxy.ts`, CSP nonce, rate limit, CSRF); SSE live feed; en/es/fr; docs + ADRs; Vitest + Playwright + axe.
2. **Redesign + real data**: neo-brutalist tokens (`globals.css`), dashboard widgets (control bar, KPI tiles, ticker, spotlight, source-mix LIVE/DEMO stamps, trending top-5, activity log); NewsAPI + TMDB (v3 key or v4 token) verified live; bigger mock corpus; `AGENTS.md`, `CLAUDE.md`, `context/`, `.claude/`.
3. **Product polish**: landing page at `/`, dashboard at `/dashboard`; per-user favorites via `/api/favorites` + Supabase (`supabase/migrations/0001…sql`, RLS on, no policies, server secret key only; memory fallback); per-user localStorage; de/pt/hi (6 languages); vendored fonts (offline builds); `/api/health`; Vercel guide (`docs/08-deployment.md`).
4. **Fixes**: Grammarly hydration warning (`<body suppressHydrationWarning>`); routing bug (feed page never moved → `/` conflict; fixed, full route matrix verified); spotlight frozen during drag + hover cooldown; E2E isolated from real Supabase; `data-hydrated` marker on `<html>` for tests.
5. **CI lockfile**: `npm ci` failed (nested `lightningcss@1.33` platform deps missing). Fixed with `overrides.lightningcss = 1.33.0`, a clean lockfile, and `npm run check:lockfile` (also in CI).

## Pitfalls learned (don't repeat)
- `npm install <pkg>` can strip optional native bindings from `package-lock.json` (Rolldown, lightningcss, fsevents). Always run `npm run check:lockfile`; if it fails, run `rm -rf node_modules package-lock.json && npm install`.
- `git mv -k` silently skips untracked files: verify moves with `find src/app -name page.tsx`.
- Building inside long shell heredocs / JS template strings mangles regex backslashes. Edit files directly.
- Tests must wait for hydration (`html[data-hydrated]`) before interacting.
- Never let E2E reach real services: Playwright's `webServer.env` blanks every key.

## Waiting on the user
Run the Supabase migration; rotate the Supabase secret key (it was pasted in chat); push and import in Vercel.
