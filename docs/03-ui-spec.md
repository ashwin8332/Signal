# 03 · UI specification

> Follows the master UI/UX prompt: purpose → IA → structure → tokens → components → states → accessibility → responsive → critique.

## Information architecture

```
Auth (no shell)      /login · /signup
Dashboard shell      Sidebar (primary nav) + Header (search · theme · language · account)
  /           Feed        "Your briefing": catch up across sources
  /trending   Trending    What's hot, ranked, by type
  /favorites  Favorites   Things I saved
  /search     Search      Results for ?q= with a type filter
  /settings   Settings    Interests, live updates, appearance, language
  /profile    Profile     Name, bio, avatar color
```

Every screen answers the four questions:
- **Where am I?** The active nav item (with `aria-current="page"`), plus an `<h1>` and a one-line description.
- **What can I do?** One obvious primary action per screen.
- **What just happened?** Toasts and live regions.
- **What happens if…?** Labels that name the action ("Remove from favorites", not "Remove").

### Screen purposes

| Screen | "This screen exists to help the reader…" | Primary action |
|---|---|---|
| Feed | catch up on their interests across sources | Open an item |
| Trending | see what's popular right now | Open an item |
| Favorites | return to saved items | Open an item |
| Search | find one specific thing | Refine or open a result |
| Settings | shape what the feed contains | Toggle an interest |
| Profile | personalize how they appear | Save profile |
| Login | get into their dashboard | Sign in |

## Layout system

- **Shell:** sidebar 240 px at ≥ 1024 px; a 72 px icon rail (with tooltips and accessible names) from 768–1023 px; an off-canvas drawer below 768 px (focus trapped, `Esc` closes, focus returns to the menu button).
- **Content:** `max-width: 1280px`, padding 16 px (mobile), 24 px (tablet), 32 px (desktop).
- **Card grid:** 1 column below 640 px → 2 columns from 640 px → 3 columns from 1280 px, with a 16/24 px gap. Cards stop being readable below ~300 px, which sets the breakpoints.
- **Header:** sticky with a translucent surface. The search box grows to fill the space; on mobile it collapses to a search icon that opens a full-width field.

## Design tokens

> **Iteration 2 (current):** the token values below were replaced by the neo-brutalist system in `src/app/globals.css` (mint `#cfe8d6` grid paper, ink `#121210` borders and hard offset shadows, primary green `#1b6b2e`, amber `#e8a030`, pastel source tags; a mint-on-charcoal dark theme). The semantic roles are unchanged. See `context/CONVENTIONS.md` for the utility classes (`.brut`, `.press`, `.tag`, `.stamp`). The table below documents the original roles.

All colors are semantic CSS custom properties, defined for `:root` (light) and overridden on `.dark`. Tailwind v4 maps them through `@theme`, so components only use classes like `bg-surface text-fg`.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#f6f7f9` | `#0b1120` | App background |
| `--surface` | `#ffffff` | `#111827` | Cards, header, sidebar |
| `--surface-2` | `#f0f2f5` | `#1a2333` | Hover, subtle fills, skeleton |
| `--fg` | `#0f172a` | `#e5e7eb` | Primary text |
| `--fg-muted` | `#475569` | `#a3acb9` | Secondary text (≥ 4.5:1 on surface and bg) |
| `--border` | `#e2e8f0` | `#263244` | Dividers |
| `--border-strong` | `#94a3b8` | `#4b5563` | Input borders (≥ 3:1, WCAG 1.4.11) |
| `--primary` | `#4338ca` | `#818cf8` | Primary action |
| `--primary-fg` | `#ffffff` | `#0b1120` | Text on primary |
| `--primary-soft` | `#eef2ff` | `#1e1b4b` | Selected chips, active nav |
| `--focus` | `#4f46e5` | `#a5b4fc` | Focus ring (2 px + 2 px offset) |
| `--news` | `#0369a1` | `#38bdf8` | Source accent: news |
| `--film` | `#b45309` | `#fbbf24` | Source accent: films |
| `--social` | `#7e22ce` | `#c084fc` | Source accent: social |
| `--success` / `--danger` | `#15803d` / `#b91c1c` | `#4ade80` / `#f87171` | Semantic status |

Source identity is never conveyed by color alone: each source has a **dot + icon + text label** (Newspaper / Clapperboard / MessageCircle).

- **Typography:** Inter (self-hosted via `next/font`). Scale 12 · 14 · 16 · 18 · 20 · 24 · 30. Body 16/1.5; metadata 12–14 in `--fg-muted`; headings semibold, never more than two weights per view. Measure ≤ 70ch.
- **Spacing:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (Tailwind's default 4 px scale, using only these steps).
- **Radius:** 8 px controls · 12 px cards · full for chips and avatars.
- **Elevation:** `resting` (border only) · `raised` (cards on hover: `shadow-md`, −2 px lift) · `overlay` (menus, drawer, toasts: `shadow-xl`). Dark mode leans on borders and lighter surfaces, not shadows.
- **Motion:** 150 ms (hover and press), 200 ms (menus and toasts), 250 ms (page enter and reorder) with an ease-out curve. Under `prefers-reduced-motion`, transforms are removed and only opacity changes remain.

## Components

| Component | Variants | States | Accessibility |
|---|---|---|---|
| Button | primary · secondary · ghost · danger; sm/md | hover, focus-visible, active, disabled, loading (spinner + `aria-busy`) | Native `<button>`; label names the action |
| IconButton | ghost · subtle | same as Button | `label` prop is **required**, rendered as `aria-label` plus a tooltip |
| TextField | text · email · password · search | default, focus, invalid, disabled | Visible `<label>`; `aria-describedby` hint and error; `aria-invalid` |
| Chip (toggle) | category/genre/hashtag | on/off, disabled (last category) | `<button aria-pressed>` |
| Tabs / SegmentedControl | n options | selected, focus | WAI-ARIA tabs: roving tabindex, arrow keys |
| Switch | – | on/off | `role="switch"` + `aria-checked` |
| ContentCard | news · movie · social | resting, hover, focus-within, dragging, drop-target, favorited | `<article aria-labelledby>`; CTA link; "Move earlier/later" buttons |
| Skeleton | card · row | shimmer | `aria-hidden`; the container has `aria-busy` |
| EmptyState / ErrorState | – | – | Heading, explanation, single action |
| Toast | info · success · error, optional action (Undo) | enter/exit | `role="status"` region; 5 s; pauses on hover/focus |
| Drawer | – | open/closed | Focus trap, `Esc`, restores focus |
| Menu (account) | – | open/closed | Disclosure button + list; `Esc` closes |

## States (first-class)

| Surface | Loading | Empty | Error | Partial |
|---|---|---|---|---|
| Feed | 6 skeleton cards | "Nothing here for this filter" + "Adjust interests" | "We couldn't load your briefing" + Retry | Notice per failed source + Retry |
| Next page | Spinner row "Loading more…" | "You're all caught up" | Inline "Couldn't load more" + Retry | – |
| Trending | 5 skeleton rows | "Nothing trending yet" | Error + Retry | – |
| Favorites | (local, instant) | "No favorites yet" + "Browse your feed" | – | – |
| Search | Hint before typing; spinner while fetching, previous results dimmed | "No results for 'x'" + tips | Error + Retry | Notice for failed sources |
| Login | Button loading | – | Inline form error | – |

## Responsive checks

375 (small phone) · 768 (tablet, icon rail) · 1024 (sidebar appears) · 1280 (3-column grid) · 1600 (content capped, centered).

## Self-critique (pre-ship gate, filled in during the quality pass)

See the README's "Quality gate" section for the final checklist results.
