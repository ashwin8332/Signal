@AGENTS.md

## Claude Code notes
- Start with `/resume` (`.claude/commands/resume.md`) to load just enough context from `context/STATUS.md` and the plan, then work.
- Before declaring work done, run `/verify` (typecheck → lint → unit/integration → optional E2E) and report real results.
- Preview: `.claude/launch.json` defines the `signal-dev` server for the browser pane.
- Process guides (product playbook and UI/UX master prompt) are deliberately not in the repo; ask the owner if a process stage needs them. Their key decisions are already captured in `docs/` and `context/PLAN.md`.
- Plan files: the approved implementation plan is `context/PLAN.md`; update `context/STATUS.md` when you finish a chunk of work.
