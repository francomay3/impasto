# Impasto — Development Rules

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
