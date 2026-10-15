---
description: Load just enough project context to continue work
---
Load context cheaply. Do not read the whole codebase.

1. Read `AGENTS.md` (already in CLAUDE.md) and `context/STATUS.md`.
2. If the task touches scope or architecture, read the relevant part of `context/PLAN.md` and `docs/04-architecture.md`.
3. If the task touches UI, read `context/CONVENTIONS.md` (design system section).
4. Only then open the specific source files the task needs.

Task: $ARGUMENTS
