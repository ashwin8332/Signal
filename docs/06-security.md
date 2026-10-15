# 06 · Security and threat model

Approach: OWASP threat modeling. What are we building, what can go wrong, what do we do about it, and how do we verify it?

## Assets
NewsAPI/TMDB keys · `AUTH_SECRET` · session cookies · user passwords (memory only) · user preferences/favorites (the user's own browser).

## Trust boundaries
Browser ⇄ Next server (untrusted input crosses here) · Next server ⇄ NewsAPI/TMDB (untrusted third-party content crosses here) · `localStorage` (user-controlled, treated as untrusted on load).

## Threats and mitigations

| # | Threat | Mitigation | Verified by |
|---|---|---|---|
| T1 | API key leakage to the client | Keys read only in `lib/server/*` (`server-only` import); no `NEXT_PUBLIC_` vars; `.env*` gitignored | Build fails on client import; grep in CI review |
| T2 | Session forgery / tampering | HMAC-SHA256 signature, constant-time compare, `exp` claim | `session.test.ts` (tampered, expired, wrong-secret tokens rejected) |
| T3 | Session theft via XSS | httpOnly cookie; CSP with per-request script nonce + `strict-dynamic`; React escaping; no `dangerouslySetInnerHTML` except the nonce'd theme script | E2E checks the CSP header; lint |
| T4 | CSRF on auth POSTs | `SameSite=Lax` + Origin header must match Host | `auth-routes.test.ts` (foreign Origin → 403) |
| T5 | Credential stuffing / brute force | 5 attempts/min per IP+email → 429 with `Retry-After`; scrypt slows offline cracking | `auth-routes.test.ts` |
| T6 | User enumeration | Identical message and timing path for unknown email vs wrong password (a dummy hash is compared for unknown users) | `auth-routes.test.ts` |
| T7 | Open redirect via `?next=` | Only same-origin relative paths starting with a single `/` are accepted | `validation.test.ts` |
| T8 | Malicious links/images from third-party content | `https:` only for `url` and `imageUrl` (otherwise dropped); links open with `rel="noopener noreferrer"`; images use `referrerPolicy="no-referrer"` | `validation.test.ts`, provider tests |
| T9 | Injection into upstream requests / SSRF | Upstream hosts are constants; user input only goes into `URLSearchParams`; zod allow-lists | `api-routes.test.ts` (bad params → 400) |
| T10 | Malformed/poisoned `localStorage` | zod-validated on load, falls back to defaults, versioned key | `persistence.test.ts` |
| T11 | Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` | E2E header check |
| T12 | Missing secret in production | Server throws at first session use if `AUTH_SECRET` is missing when `NODE_ENV=production`; a dev-only fallback logs a warning | `session.test.ts` |
| T14 | TMDB v3 key appears in an upstream URL | v4 read token (header) is preferred when both are set. The v3 key is only added server-side to the outgoing TMDB request, never sent to the browser, and upstream URLs are never logged (errors log the status only) | `server.test.ts` (v3 key query param, v4 precedence) |
| T13 | Upstream hangs exhaust resources | 8 s `AbortSignal.timeout` on every upstream fetch | provider tests |

## Accepted risks

- **In-memory users and rate limiting** reset on restart and are per-instance. This is acceptable for mock auth (documented in the README); the production path is Auth.js plus a database.
- **`style-src 'unsafe-inline'`** is required because React SSR and Framer Motion emit inline `style` attributes. Script execution, the main XSS vector, stays nonce-locked.
- **`npm audit`**: 5 "high" findings, all in `braces` via `eslint-config-next` → `fast-glob`. This is a dev-only lint dependency, never bundled or executed at runtime. No patched `braces` exists. The only "fix" downgrades `eslint-config-next` by two majors. Re-check on every dependency update.
