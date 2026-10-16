# Conventions

## Code
- TypeScript strict + `noUncheckedIndexedAccess`; no `any`. Shared types live in `src/types/content.ts`.
- Server-only modules import `'server-only'`. Client components start with `'use client'`.
- Pure logic goes in `src/lib/*` (unit-tested). Components stay thin.
- Redux: one slice per domain in `src/features/<domain>/`; cross-cutting side effects go in listener middleware (`store/index.ts`, `features/activity/activityListener.ts`), not in components.
- Server data comes through RTK Query (`services/contentApi.ts`). Don't hand-roll fetch plus useState for API data.
- Comments explain **why**, not what. Match the surrounding density.

## UI (neo-brutalist design system)
- Tokens: `bg-bg | bg-surface | bg-surface-2/3`, `text-fg | text-fg-muted`, `border-ink`, `shadow-brut-sm | brut | brut-lg`, accents `amber`, `accent`, source `news | film | social` (+ `-soft` backgrounds).
- Utilities: `.brut` / `.brut-sm` / `.brut-lg` (border + hard shadow), `.press` (lift on hover, press on click), `.tag` (uppercase mono label), `.stamp` (rotated status), `.skeleton`.
- Type: display = Archivo (`font-display`, black/extrabold headings), body = Hanken Grotesk, data and labels = Space Mono (`font-mono`, uppercase, tracking).
- Square corners; spacing 4/8/12/16/24/32. Cards use `.brut`, controls use 2px `border-ink`.
- Never convey meaning by color alone (icon + label). Text contrast ≥ 4.5:1 in light **and** dark; white text on `accent` green fails, so use amber + ink instead.
- Every async surface has loading / empty / error / partial states. Motion respects `prefers-reduced-motion`.

## i18n
Add keys to `src/i18n/locales/en.ts` first; `es.ts`/`fr.ts` must match (TypeScript enforces it). Plurals use `_one` / `_other`.

## Testing
- Logic → `tests/unit`. Components → `tests/integration` with `renderWithProviders` (`tests/render.tsx`) and `mockFetch` (`tests/fixtures.ts`). Route handlers → call `GET`/`POST` with a real `NextRequest`.
- Critical flows → `e2e/` (Playwright, mock data, port 3100). Debounce timing is asserted with fake timers in unit tests, not in E2E.

## Git
Small commits with clear messages. Never commit `.env.local`, `coverage/`, `playwright-report/`, `test-results/`.

## Dependencies (important)
npm has a bug with optional native packages (Rolldown for Vitest, `@next/swc-*`, lightningcss): adding a package with `npm install <pkg>` can **remove the platform bindings from `package-lock.json`**, breaking Vitest locally and builds/CI on other OSes. After adding a dependency, check:

```bash
grep -c '"node_modules/@rolldown/binding-' package-lock.json   # expect > 0
grep -c '"node_modules/@next/swc-' package-lock.json            # expect > 0
```

If either is 0, run `rm -rf node_modules package-lock.json && npm install`.
