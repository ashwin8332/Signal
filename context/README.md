# context/: portable project memory

Purpose: let any AI tool or teammate resume work **without re-reading the codebase**. Read in this order and stop as soon as you have enough:

| # | File | Size | When to read |
|---|---|---|---|
| 1 | [`../AGENTS.md`](../AGENTS.md) | short | Always (stack, map, rules, commands) |
| 2 | [`STATUS.md`](STATUS.md) | short | Always (what's done, verified, open) |
| 3 | [`CONVENTIONS.md`](CONVENTIONS.md) | short | Before writing code or UI |
| 4 | [`PLAN.md`](PLAN.md) | medium | When planning or changing scope/architecture |
| 5 | [`../docs/`](../docs) | medium | For the specific concern: stories/ACs, UI spec, ADRs, API contract, security, testing |
| 6 | [`playbooks/`](playbooks) | **long** | Only the relevant section, when running a process stage (e.g. "write user stories", "pre-ship UI gate") |
| 7 | [`design-reference/`](design-reference) | long | When changing visual design (neo-brutalist source reference) |

Keep this folder current: update `STATUS.md` at the end of every work session. Never put secrets here.
