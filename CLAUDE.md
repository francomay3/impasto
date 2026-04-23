# Impasto — Development Rules

**Always use `bun`:** for installing deps, running scripts, adding packages, etc...
**Leave comments:** to explain non-obvious intent, invariants, tradeoffs, and anything that would save the next reader (human or agent) a trip through git history.
**No business logic in components or hooks:** as much as possible though
**planning:** When asked to write a plan for a feature or refactor, always use the `/plan-project` skill. Never write ad-hoc plan files directly.
**save tokens:**: you are expensive to run. thinking tokens and your review is more valuable that ahving you write every single line of code. whenever you can delegate your task in smaller chunks, use the /delegate skill to have a dumber agent implement the changes. you just prompt, verify, correct.
**dont write custom CSS:** unless necessary. use mantine defaults as much as possible. if you need to add CSS, its preferred to add it in theme scoped places to keep everything consistent. specific css for a single component is allowed as a 3 option only.
**run `bun project-check`:** do that pretty often. make sure your changes dont break the check.

## core values

- testability: modularize a lot. test everything you can. leave logic outside react for easier testability.
- scalability: dont be afraid of bigger refactors in favour of scalability. they are needed to keep the codebase able to grow.
