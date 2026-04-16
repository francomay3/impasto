# Refactor session guidelines (agents & humans)

This document applies to work on the **ImpastoEngine / REFACTOR** effort. Read it at the start of a session so expectations stay aligned.

## Scope: `src/REFACTOR` only

- **Implement and evolve code under** `src/REFACTOR` **only** for this phase.
- The production editor and routes outside that tree may continue to exist unchanged. **Duplication with the “real” app is expected** while the new engine, viewports, tools, and wiring are proven out in isolation.
- **When the refactor is complete**, we will **move and integrate** this code into the actual app surfaces (pages, routes, shared libs). Until then, treat `src/REFACTOR` as the staging ground for a large, unfinished implementation—**finish the implementation here first**, then consolidate.

## Code checking

- **Do not rely on** `bun run project-check` **as a gate** for code change during this phase. project-check does not check typescript only, it checks file length, knip, lint and others.. so dont rely on it.
- **Do** keep TypeScript sound: fix errors in files you touch, respect types, and use the editor / `tsc` feedback on changed modules so merged code stays type-correct. Leave no new TS errors in `src/REFACTOR` even if the global project-check script is skipped.

## File size and structure

- **File length is not a priority** right now. Prefer clarity and a working vertical slice over splitting files purely for line counts. We can normalize structure when we integrate with the main app. leaving comments in the files is good practice.

## Tests

- **Writing tests is preferred** for logic you add or change: especially pure `.ts` (state, pipelines, math, protocols). Follow project norms: keep business logic testable in `.ts`; use `.test.tsx` only when behavior is inherently about DOM or React wiring.
- Run targeted unit tests when practical: `bun run test:unit` (optionally with a path filter if your setup supports it).

## Package manager and architecture

important: read src/REFACTOR/ImpastoEngine/ARCHITECTURE.md for architecture guidelines on the ImpastoEngine you are building

## Summary

| Topic               | Guideline                                                             |
| ------------------- | --------------------------------------------------------------------- |
| Where to work       | `src/REFACTOR` only; duplication elsewhere is temporary.              |
| End state           | Move into real pages after the big implementation is done.            |
| `bun project-check` | Not required every session; still keep TS correct in what you change. |
| File length         | Relax constraints for now.                                            |
| Tests               | Preferred for non-trivial logic.                                      |

When in doubt: **ship working, well-typed building blocks under `src/REFACTOR`** and test the tricky parts.
