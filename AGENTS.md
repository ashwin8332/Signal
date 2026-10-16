<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md: Signal (Personalized Content Dashboard)

Read this first. It is the compact, tool-agnostic brief for any AI coding agent (Claude Code, Codex, Cursor, Copilot…).
Deeper context lives in [`context/`](context/README.md). Open it **only when the task needs it**, so you don't spend tokens re-reading the codebase.

## What this is
A take-home assignment: a personalized dashboard that merges **news (NewsAPI)**, **film recommendations (TMDB)** and **social posts (mock)** into one feed, with preferences, drag-and-drop ordering, debounced search, trending, favorites, dark mode, auth, real-time updates (SSE) and i18n (en/es/fr). The visual language is **neo-brutalist** (mint grid paper, ink borders, hard offset shadows; see `context/design-reference/`).

## Stack (exact majors matter: they changed recently)
Next.js **16** (App Router, Turbopack, `src/proxy.ts` replaces middleware, async request APIs) · React **19** · TypeScript strict (`noUncheckedIndexedAccess`) · Redux Toolkit **2** + RTK Query (`build.infiniteQuery`) · Tailwind **4** (CSS-first config in `src/app/globals.css`, no tailwind.config) · Framer Motion · react-dnd · i18next/react-i18next · zod **4** · Vitest **5** + Testing Library · Playwright.

## Commands
```bash
npm run dev          # http://localhost:3000 (demo account button on /login)
npm run typecheck && npm run lint && npm test   # must all pass before you finish
npm run test:e2e     # Playwright on a prod build, port 3100, mock data only (run `npx playwright install chromium` once)
```

## Map
- `src/app/`: routes. `(auth)/login|signup`, `(dashboard)/` = feed, `trending`, `favorites`, `search`, `settings`, `profile`. `api/*` = BFF route handlers.
- `src/lib/server/`: **server-only**: `env.ts` (the only place secrets are read), `providers.ts` (NewsAPI/TMDB adapters + mock fallback), `mock/*` (deterministic demo data), `session.ts`, `users.ts`, `rateLimit.ts`, `http.ts`.
- `src/features/*`: Redux slices (preferences, favorites, feed, auth, profile, ui, activity). `src/services/contentApi.ts`: RTK Query. `src/store/`: store, typed hooks, persistence (localStorage, zod-validated, hydrate-after-mount).
- `src/components/ui/`: design-system primitives. `layout/`: shell. `content/`: cards and grids. `dashboard/`: control bar, KPI tiles, ticker, source mix, trending mini, activity log.
- `src/lib/feed.ts`: pure ordering/interleave logic. `src/i18n/locales/*.ts`: copy (es/fr are type-checked against en).
- `tests/unit`, `tests/integration` (route handlers + components), `e2e/`, `docs/` (brief, stories, UI spec, ADRs, API, security, testing).

## Rules that keep the project healthy
1. **Secrets**: API keys live only in `.env.local` (gitignored) and are read only in `src/lib/server/env.ts`. Never use `NEXT_PUBLIC_` for keys, never commit or log them, never paste them into docs or `context/`.
2. **Validate at the boundary**: every route handler parses input with zod (`src/lib/validation.ts`) and returns `{ error: { code, message } }` on failure. A failing upstream API falls back to labelled demo data (`source: "mock"`, 15-min cooldown via `liveOrDemo` in `providers.ts`); route errors (5xx) become per-source "partial failure" notices in the UI.
3. **Styling** uses semantic tokens only (`bg-surface`, `text-fg-muted`, `border-ink`, `shadow-brut`, `.brut`, `.press`, `.tag`, `.stamp`). No raw hex in components except fixed ink-on-pastel pairs. Check contrast (≥ 4.5:1 text) in **both** themes.
4. **Accessibility is a requirement**: labelled controls, visible focus, keyboard alternatives (e.g. move buttons for drag-and-drop), `aria-live` for async results, reduced-motion respected. E2E runs axe (WCAG 2.2 AA).
5. **Every state**: loading, empty, error, and partial. Copy goes through i18n: add keys to `en.ts`, then `es.ts` and `fr.ts` (TypeScript enforces parity).
6. **React Compiler lint rules** are on: no `setState` inside effects (adjust state during render instead), no ref access during render, and don't name non-ref props `*Ref`.
7. **Tests with every change**: unit for logic, Testing Library with `mockFetch` (tests/fixtures.ts) for components, Playwright for critical flows.

## Current status
See [`context/STATUS.md`](context/STATUS.md) for what's done, verified, and next.
