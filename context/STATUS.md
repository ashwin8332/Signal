# Status

_Last updated: 2026-10-16_

## Done and verified
- **Core assignment**: unified feed (news + films + social), preferences (persisted), infinite scroll + "Load more", cards with CTAs, Trending, Favorites (+ Undo), debounced search (URL-synced), drag-and-drop + keyboard reordering, dark mode (no flash), animations, Redux Toolkit + RTK Query (`infiniteQuery`) + thunks, localStorage persistence.
- **Bonuses**: mock auth with real mechanics (scrypt, HMAC httpOnly cookie, proxy guard, rate limit, CSRF origin check), profile, real-time SSE feed with "N new posts" pill, i18n en/es/fr.
- **Real APIs verified live** (2026-10-16) through the app's own routes: NewsAPI top-headlines/search and TMDB discover/trending/search (v3 `TMDB_API_KEY` supported alongside the v4 read token). Keys live in `.env.local` only.
- **Demo data** expanded: 63 articles/category, 36 films/genre, 60 posts/hashtag, deterministic.
- **Neo-brutalist redesign** from `design-reference/`: tokens in `src/app/globals.css`, Archivo / Hanken Grotesk / Space Mono via `next/font`.
- **Dashboard widgets**: control bar (stream status + clock), KPI tiles, pausable headline ticker, spotlight card (top of feed), Source mix with LIVE API / DEMO DATA / UNAVAILABLE / OFF stamps, trending top-5, session activity log.
- **Quality**: typecheck clean, lint clean, **144 Vitest tests passing** (unit + route handlers + components).

## Verify before claiming done
`npm run typecheck && npm run lint && npm test`, then `npm run test:e2e` (Playwright + axe). E2E was green except for machine-load timeouts before the redesign. Re-run after UI changes and fix any axe findings (contrast in both themes).

## Known limitations / decisions
- Accounts and rate limits are in memory (mock auth). Preferences and favorites are per browser.
- NewsAPI free plan: 100 requests/day, localhost only. If it's exhausted or the app is deployed, leave `NEWS_API_KEY` empty and the UI shows DEMO DATA.
- NewsAPI top headlines often have no image or description. Cards show a hatched "no photo" placeholder by design; we don't fabricate images for real news.
- The reference design's 3D seal, sounds and CDN scripts were intentionally not adopted (decorative 3D, accessibility, strict CSP).

## Next (if continuing)
- Deploy (Vercel) and add the live URL to the README.
- Screenshots in `docs/screenshots/` for the README.
- Optional: Lighthouse pass; Auth.js + DB if persistence across devices is ever needed.
