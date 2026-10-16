# Status

_Last updated: 2026-10-16 (iteration 5). See `SESSION_HISTORY.md` for how we got here._

## Done and verified
- **Core assignment** complete: unified feed, preferences, infinite scroll, cards, Trending, Favorites (+ Undo), debounced URL-synced search, drag-and-drop + keyboard reordering, dark mode, animations, Redux Toolkit + RTK Query + thunks, persistence.
- **Bonuses**: auth (scrypt, HMAC httpOnly cookie, proxy guard, rate limit, CSRF), profile, SSE live feed, i18n en/es/fr/de/pt/hi.
- **Neo-brutalist UI** + dashboard widgets; **landing page** at `/` with real product screenshots (`public/screenshots/`, regenerate with `npm run screenshots <url>`); dashboard at `/dashboard`.
- **Real APIs**: NewsAPI + TMDB through server routes. On upstream failure, the source falls back to labelled demo data (DEMO DATA stamp) with a 15-min cooldown (`liveOrDemo` in `providers.ts`).
- **Per-user favorites**: `/api/favorites` + Supabase (`supabase/migrations/0001…sql`), memory fallback that re-checks Supabase every 60 s.
- **CI/Vercel**: `lightningcss` override + clean lockfile; `npm run check:lockfile` runs in CI before `npm ci`; vendored fonts; `/api/health`; `docs/08-deployment.md`.
- **Quality**: typecheck + lint clean; 157 Vitest tests; Playwright E2E (36 specs incl. axe, landing, mobile).

## Waiting on the user
- Run `supabase/migrations/0001_users_and_favorites.sql` in the Supabase SQL editor (tables still missing as of 2026-10-16; `/api/health` shows `storage: "memory"`).
- Rotate the Supabase secret key (it was pasted in chat); set new values in `.env.local` and Vercel.
- NewsAPI free plan: 100 requests/day, currently rate-limited (it resets within 12–24 h). The app shows DEMO DATA for news meanwhile.
- Push to GitHub (`ashwin8332/Signal`) and import in Vercel.

## Verify before claiming done
`npm run check:lockfile && npm run typecheck && npm run lint && npm test && npm run test:e2e`
