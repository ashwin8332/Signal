# 07 · Test strategy

Risk-based: the most effort goes where a failure would hurt readers most (data shown wrong, data lost, locked out, unusable without a mouse) and where the logic is easiest to get subtly wrong (ordering, persistence, partial failure, auth).

## Layers

| Layer | Tool | Boundary faked | Location |
|---|---|---|---|
| Unit | Vitest (jsdom or node) | none | `tests/unit/` |
| Integration: API | Vitest (node) calling route handlers with real `NextRequest` | upstream `fetch` only when testing real adapters | `tests/integration/api-routes.test.ts` |
| Integration: UI | Testing Library, real Redux store, real RTK Query, real i18n and DnD providers | global `fetch` (`tests/fixtures.ts → mockFetch`), `next/navigation` | `tests/integration/*.test.tsx` |
| E2E | Playwright on `next build && next start`, mock data, live stream every 3 s | `page.route` for outage scenarios | `e2e/` |
| Accessibility | `@axe-core/playwright`, WCAG 2.2 AA, serious/critical fail the build | n/a | `e2e/a11y.spec.ts` |

Why fake only `fetch` in UI tests: RTK Query's caching, `infiniteQuery` paging and the partial-failure logic in `queryFn` all run for real, so the tests check what users see rather than implementation details.

## Traceability

| Story | Key acceptance criteria | Automated by |
|---|---|---|
| US-01 Sign in | redirect with `next`; generic error; logout; 429; signup validation; open-redirect guard | `server.test.ts` (session, users, limiter), `api-routes.test.ts` (auth), `components.test.tsx › LoginForm`, `validation.test.ts`, `e2e/auth.spec.ts` |
| US-02 Preferences | instant + persisted; last category locked; hashtag validation; reset + undo; corrupt storage → defaults | `slices.test.ts`, `persistence.test.ts`, `components.test.tsx › SettingsView`, `Feed.test.tsx › refetches…`, `e2e/feed.spec.ts › changing interests` |
| US-03 Unified feed | interleaved; skeletons; infinite scroll; partial failure + retry; total failure; empty; filter + counts | `feed-utils.test.ts`, `Feed.test.tsx`, `e2e/feed.spec.ts` |
| US-04 Cards | image fallback; named CTA in new tab with `noopener`; favorite `aria-pressed`; https-only URLs | `components.test.tsx › ContentCard`, `server.test.ts › adapters`, `Feed.test.tsx › reason…` |
| US-05 Reorder | drag; keyboard buttons + announcement + focus; persists; new items append; reset | `feed-utils.test.ts`, `slices.test.ts › feed`, `Feed.test.tsx › reorders…`, `e2e/reorder.spec.ts` |
| US-06 Trending | ranked; tabs; states | `api-routes.test.ts › trending`, `components.test.tsx › TrendingView` |
| US-07 Favorites | toggle anywhere; persisted snapshot; undo; empty state | `slices.test.ts › favorites`, `components.test.tsx › FavoritesView`, `e2e/preferences.spec.ts` |
| US-08 Search | 350 ms debounce = one navigation; URL sync; filter; no results; `/` hotkey | `hooks-and-i18n.test.ts › useDebounce`, `components.test.tsx › SearchBar / SearchView`, `server.test.ts › search`, `e2e/search.spec.ts` |
| US-09 Live | pill, not shifting; flush to top; backoff | `slices.test.ts › live`, `components.test.tsx › LivePill`, `hooks-and-i18n.test.ts › backoff`, `e2e/feed.spec.ts › live` |
| US-10 Dark mode | toggle; persisted; no flash; contrast | `components.test.tsx › ThemeToggle`, `persistence.test.ts`, `e2e/preferences.spec.ts`, `e2e/a11y.spec.ts` (dark) |
| US-11 Language | switch + persist; plurals; key parity | `hooks-and-i18n.test.ts › i18n`, `e2e/preferences.spec.ts` |
| US-12 Profile | validated; reflected in header | `e2e/preferences.spec.ts › profile` |

## Running

```bash
npm test                 # unit + integration
npm run test:coverage    # with coverage (coverage/index.html)
npx playwright install chromium   # once
npm run test:e2e         # builds, starts on :3100, runs desktop + mobile projects
```

## Notes on flakiness

- Exact debounce timing is asserted with fake timers in unit tests. The E2E search test asserts the user-visible contract (far fewer requests than keystrokes, ending with the full query), which still holds on a slow CI runner.
- E2E uses at most 3 local workers (2 in CI): each launches a browser against a single Next server.
- Mock data is deterministic (seeded PRNG), so card titles and order are stable across runs.
