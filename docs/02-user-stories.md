# 02 · User stories and acceptance criteria

> Stage 6 of the playbook. Every story passes INVEST and the Definition of Ready below.
> The "Tests" line maps each story to the automated checks that prove it (see `07-testing.md`).

**Definition of Ready:** persona known · value clear · scope bounded · ACs testable · edge and failure behavior defined · data and API impact known.
**Definition of Done:** ACs pass · unit/integration tests added · E2E for critical flows · keyboard and screen-reader path verified · loading/empty/error states present · typecheck + lint + tests green · docs updated.

---

## US-01 · Sign in to my dashboard
**As a** reader, **I want** to sign in, sign up or use a demo account **so that** my dashboard is mine.

- **AC-01** Given valid credentials, when I sign in, then I land on the page I originally requested (`?next=`), or the feed if there was none.
- **AC-02** Given a wrong email or password, then I see one generic message ("Email or password is incorrect"). It never says which one was wrong, and my email stays filled in.
- **AC-03** Given I am signed out, when I open any dashboard route, then I am redirected to `/login?next=<route>`.
- **AC-04** When I sign out, then the session cookie is cleared and dashboard routes redirect again.
- **AC-05** Given 5 failed attempts from one client within a minute, then further attempts get HTTP 429 with "Too many attempts, wait a minute".
- **AC-06** Signup validates name (1–60 chars), email format and password (≥ 8 chars). Errors appear inline, next to the field, after leaving the field or submitting.
- **Edge:** an already-registered email on signup → "An account with this email already exists". A `next` pointing off-site is ignored (open-redirect guard).
- **Security:** scrypt password hashing; HMAC-signed httpOnly `SameSite=Lax` cookie; Origin check on POST.
- **Tests:** `session.test.ts`, `auth-routes.test.ts`, `LoginForm.test.tsx`, `e2e/auth.spec.ts`.

## US-02 · Tune what I see
**As a** reader, **I want** to choose news categories, film genres and hashtags **so that** the feed reflects my interests.

- **AC-01** Toggling a category, genre or hashtag updates the feed without a page reload.
- **AC-02** Preferences survive a reload and a sign-out and sign-in in the same browser.
- **AC-03** The last remaining news category cannot be removed; a hint explains why.
- **AC-04** I can add a custom hashtag (letters, digits, underscore; 2–30 chars). Invalid input shows an inline error. Duplicates are ignored.
- **AC-05** "Reset to defaults" restores the defaults, with an undo toast.
- **Edge:** corrupt or old-version data in `localStorage` → defaults load silently, and the app never crashes.
- **Tests:** `preferencesSlice.test.ts`, `persistence.test.ts`, `SettingsPanel.test.tsx`.

## US-03 · One unified feed
**As a** reader, **I want** news, film picks and social posts in one feed **so that** I catch up in one place.

- **AC-01** The feed interleaves the three sources (news, film, post, news, …) so one source never floods the top.
- **AC-02** The first load shows skeleton cards shaped like real cards (no layout shift).
- **AC-03** Scrolling near the end loads the next page automatically. A visible "Load more" button exists as a fallback, and "You're all caught up" shows at the end.
- **AC-04** **Partial failure:** if one source fails, the other sources still render, plus an inline notice "Film picks couldn't load. Try again" with a Retry button.
- **AC-05** **Total failure:** an error state explains what happened and offers Retry.
- **AC-06** **Empty:** if a source filter leaves nothing, an empty state explains why and links to Settings.
- **AC-07** A source filter (All · News · Films · Social) narrows the feed and shows counts.
- **Tests:** `feed-utils.test.ts`, `Feed.test.tsx`, `api-routes.test.ts`, `e2e/feed.spec.ts`.

## US-04 · Cards I can act on
**As a** reader, **I want** each item as a rich card **so that** I can decide quickly whether to open it.

- **AC-01** A card shows an image (16:9, lazy-loaded, branded fallback if it fails), title, a 3-line summary, source label with icon, relative time, and a "why" chip.
- **AC-02** The primary CTA names the action: "Read article", "View film", or "Open post". It opens a new tab with `rel="noopener noreferrer"`.
- **AC-03** The favorite button announces its state (`aria-pressed`) and its label says what it will do.
- **Edge:** a missing image, an overly long title (clamped at 2 lines, full text in the title attribute), a missing summary, or a non-https URL (rejected server-side).
- **Tests:** `ContentCard.test.tsx`, `validation.test.ts`.

## US-05 · Arrange my feed
**As a** reader, **I want** to reorder cards **so that** what matters most stays on top.

- **AC-01** With a mouse, I can drag a card onto another card's position, and the others animate to their new positions.
- **AC-02** With a keyboard or touch, each card's "Move earlier" and "Move later" controls do the same, and a live region announces "Moved to position 3 of 24".
- **AC-03** The custom order persists across reloads.
- **AC-04** Newly loaded items keep their natural position after the custom-ordered ones and never scramble my order.
- **AC-05** "Reset order" restores the natural order.
- **Tests:** `feedSlice.test.ts` (reorder/applyOrder), `e2e/reorder.spec.ts`.

## US-06 · What's trending
**As a** reader, **I want** to see top trending items by type **so that** I know what everyone is talking about.

- **AC-01** Tabs: All · News · Films · Social, using the WAI-ARIA tab pattern (arrow keys move between tabs).
- **AC-02** Items are ranked (#1…#n) with a popularity metric.
- **AC-03** Loading, empty and error states are present.
- **Tests:** `Trending.test.tsx`, `api-routes.test.ts`.

## US-07 · Keep favorites
**As a** reader, **I want** to favorite items **so that** I can come back to them later.

- **AC-01** Favoriting from any card (feed, trending, search) adds the item to Favorites immediately.
- **AC-02** Favorites persist and render without network access (a snapshot of the item is stored).
- **AC-03** Removing a favorite shows an "Undo" toast for 5 s. There is no confirmation dialog because the action is reversible.
- **AC-04** The empty state explains what favorites are and links to the feed.
- **Tests:** `favoritesSlice.test.ts`, `e2e/favorites.spec.ts`.

## US-08 · Search everything
**As a** reader, **I want** to search across news, films and posts as I type **so that** I find something specific quickly.

- **AC-01** Typing waits 350 ms after the last keystroke before searching, so a quick burst of typing makes one request.
- **AC-02** The query is mirrored to `/search?q=…`, so it's shareable and the back button works.
- **AC-03** A type filter narrows results. The result count is announced through `aria-live`.
- **AC-04** States: hint before typing, spinner while searching (the previous results stay visible), "No results for 'x'" with suggestions, and an error with Retry.
- **AC-05** Pressing `/` anywhere (outside a text field) focuses the search box; `Esc` clears it.
- **Edge:** a query over 100 chars is truncated; a whitespace-only query does not search.
- **Tests:** `useDebounce.test.ts`, `SearchBar.test.tsx`, `e2e/search.spec.ts`.

## US-09 · Stay fresh without losing my place
**As a** reader, **I want** new posts to arrive live **so that** the feed stays current.

- **AC-01** New posts arrive over Server-Sent Events and are queued; a pill shows "3 new posts".
- **AC-02** Clicking the pill puts them at the top and scrolls there. The feed never shifts on its own.
- **AC-03** Live updates can be switched off in Settings; the connection then closes.
- **AC-04** A dropped connection reconnects with exponential backoff (max 30 s) and pauses while the tab is hidden.
- **Tests:** `liveFeed.test.ts`, `e2e/live.spec.ts`.

## US-10 · Dark mode
- **AC-01** Theme options: Light, Dark, System (follows the OS, live).
- **AC-02** No flash of the wrong theme on load (an inline pre-paint script).
- **AC-03** Both themes meet WCAG AA contrast.
- **Tests:** `ThemeToggle.test.tsx`, `e2e/preferences.spec.ts`.

## US-11 · My language
- **AC-01** English, Español and Français; switching is instant and persisted.
- **AC-02** `<html lang>` follows the selection, and dates and numbers use that locale.
- **Tests:** `i18n.test.ts`, `e2e/preferences.spec.ts`.

## US-12 · My profile
- **AC-01** I can edit my display name, short bio (≤ 160 chars, with a counter) and avatar color.
- **AC-02** Fields have visible labels and inline validation; saving shows a success toast.
- **AC-03** The header avatar and greeting reflect the change immediately.
- **Tests:** `ProfileForm.test.tsx`.
