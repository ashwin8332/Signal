# context/: portable project memory

Purpose: let any AI tool or teammate resume work **without re-reading the codebase**. Read in this order and stop as soon as you have enough:

| # | File | Size | When to read |
|---|---|---|---|
| 1 | [`../AGENTS.md`](../AGENTS.md) | short | Always (stack, map, rules, commands) |
| 2 | [`STATUS.md`](STATUS.md) | short | Always (what's done, verified, open) |
| 2b | [`SESSION_HISTORY.md`](SESSION_HISTORY.md) | short | Instead of the original chat: decisions, iterations, pitfalls |
| 3 | [`CONVENTIONS.md`](CONVENTIONS.md) | short | Before writing code or UI |
| 4 | [`PLAN.md`](PLAN.md) | medium | When planning or changing scope/architecture |
| 5 | [`../docs/`](../docs) | medium | For the specific concern: stories/ACs, UI spec, ADRs, API contract, security, testing |
| 6 | Process playbooks (kept **outside** the repo by the owner) | long | Ask the owner for the product-development playbook / UI-UX master prompt when running a process stage |
| 7 | [`design-reference/`](design-reference) | long | When changing visual design (neo-brutalist source reference) |

Keep this folder current: update `STATUS.md` at the end of every work session. Never put secrets here.
