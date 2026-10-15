---
description: Run every quality gate and report real results
---
Run, in order, stopping at the first failure and reporting its output faithfully:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. If `$ARGUMENTS` contains "e2e" (or UI changed): `npm run test:e2e` (requires `npx playwright install chromium` once).

Then summarize: what passed, what failed (with the key error lines), and what you did not run. Do not claim success for steps you skipped.
