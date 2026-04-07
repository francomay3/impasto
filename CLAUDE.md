# Impasto — Development Rules

## Package Manager

**Always use `bun`. Never use `npm`, `npx`, or `yarn` for any command in this project.**

- Install deps: `bun install`
- Run scripts: `bun run <script>`
- Add packages: `bun add <package>`
- Execute binaries: `bunx <binary>`

## No business logic in components or hooks

**All business logic must live in plain TypeScript files (classes, functions, state machines). React components and hooks are only allowed to wire things together and render.**

Examples of logic that must NOT live in components or hooks:
- Color math, mixing, sampling
- Viewport transforms (zoom, pan)
- Tool state and transitions
- Hotkey handling
- Derived/computed state calculations
- Validation or formatting

If you find yourself writing logic inside a `.tsx` file or a `use*` hook beyond simple wiring, extract it to a `.ts` file first and test it there.

This rule exists because logic coupled to the React render cycle is hard to unit test, has unpredictable blast radius when changed, and causes unrelated features to break.

## Testing `.tsx` files

Component tests (`.test.tsx` with `@testing-library/react`) are acceptable **only** when the bug or behaviour is inherently about DOM interaction or event propagation — things that cannot be reproduced by testing plain `.ts` logic in isolation.

Acceptable cases:
- Click/keyboard events that bubble through the component tree (e.g. a toolbar button clearing selection via a parent `onClick`)
- Context wiring — verifying that a component reads from the right context and responds correctly
- Accessibility attributes or ARIA behaviour that depend on rendered output

Not acceptable — extract to `.ts` first instead:
- Business logic that happens to live inside a component
- Derived state or computed values
- Anything that can be tested without rendering React at all

When in doubt: if you can write the test in a `.test.ts` file, do that instead.
