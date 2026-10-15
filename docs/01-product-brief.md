# 01 · Product brief: Signal

> Stage 0–4 of the product-development playbook: intake, scope, and the product goal.
> Labels: **FACT** (from the assignment), **ASSUMPTION**, **DECISION**, **OUT OF SCOPE**.

## Problem

People follow news, films and social conversation across many apps. Each one has its own feed, its own idea of relevance, and no shared "save for later". Catching up means switching apps and re-filtering every time.

## Product goal

> A reader can open **one** dashboard and, within a single session, catch up on the news, film picks and social posts that match *their* interests. They can also understand why each item is there and shape the feed themselves.

## Users

| Persona | Context | Goal | Success looks like |
|---|---|---|---|
| **The catch-up reader** (primary) | 5–10 min sessions, morning on mobile, breaks on desktop | Skim what matters, open 1–3 things, save some for later | Reaches relevant content in ≤ 1 click after login; never sees a dead end |
| **The tinkerer** (secondary) | Occasional, on desktop | Tune categories, genres and hashtags; arrange the feed | Changes apply instantly and are still there tomorrow |
| **The assistive-tech user** (cross-cutting) | Keyboard or screen reader | Do everything above without a mouse | Every flow, including reordering, works by keyboard with announcements |

## Requirements traceability (assignment → stories)

| Assignment requirement | Type | Story |
|---|---|---|
| Configure preferences, persist them | FACT | US-02 |
| News API by category | FACT | US-03 |
| Recommendations API (TMDB) | FACT | US-03 |
| Social API (mock allowed) | FACT | US-03 |
| Cards with image, headline, description, CTA | FACT | US-04 |
| Infinite scroll or pagination | FACT | US-03 |
| Sidebar + header (search, settings, account) | FACT | shell, all stories |
| Unified feed, Trending, Favorites sections | FACT | US-03, US-06, US-07 |
| Search across categories, debounced | FACT | US-08 |
| Drag-and-drop reordering | FACT | US-05 |
| Dark mode via CSS custom properties + Tailwind | FACT | US-10 |
| Animations: transitions, spinners, hover | FACT | UI spec §Motion |
| Redux Toolkit, thunks / RTK Query, localStorage | FACT | architecture |
| Unit, integration, E2E tests | FACT | testing strategy |
| Bonus: auth + profile customization | FACT (optional) | US-01, US-12 |
| Bonus: real-time feed | FACT (optional) | US-09 |
| Bonus: i18n with react-i18next | FACT (optional) | US-11 |
| Security of API keys and auth | FACT | security doc |

## Assumptions

- **ASSUMPTION:** one person per browser profile. Preferences, favorites and order live in that browser's `localStorage`, not in a server database.
- **ASSUMPTION:** "mock authentication" is acceptable (the brief allows it). Accounts live in server memory and reset when the server restarts. The demo account is always available.
- **DECISION:** every source has a deterministic mock provider, so the app, CI and the reviewer's machine all work without API keys. Real NewsAPI and TMDB are used automatically when keys are present.
- **DECISION:** "Finance" maps to NewsAPI's `business` category ("Business & Finance").

## Out of scope

Real social-network OAuth, a persistent user database, password reset and email verification, push notifications, server-side sync of preferences across devices.

## Differentiation thesis

> Signal should feel different because the feed is **legible and controllable**: every card says why it is there, the reader decides the order and the source mix, and live updates never yank content out from under them.

Three directions were considered (UI playbook §37):

| Direction | Idea | Verdict |
|---|---|---|
| A. Familiar but superior | A polished card grid | Baseline we keep, but alone it is a generic template |
| **B. Workflow innovation** | "Why you're seeing this" chips, source-mix control, non-disruptive "N new posts" pill, keyboard-accessible reordering, `/` to search | **Chosen.** It reduces confusion and effort and is useful to every persona |
| C. Experience innovation | Immersive or 3D "news globe" | Rejected. It would be decorative 3D (UI playbook §69) and hurt performance and accessibility |

## Success metrics (if this shipped)

Time to first opened item after login · share of sessions that change a preference · favorites saved per session · search success (search followed by a click) · error-state retry success rate.
