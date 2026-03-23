<!-- this file will be read by Claude before any code change -->

# Development Guidelines

These rules apply to all code in this repository. They are not suggestions — treat every item here as a hard requirement.

---

## File Size

Keep every file under **160 lines**. If a file is growing beyond that limit, it is a signal that it is doing too much. Split it into focused, single-responsibility modules before continuing.

---

## Code Duplication

Do not duplicate logic. If a change you are about to make would reproduce code that already exists somewhere in the codebase, stop and propose a refactor instead. Extract shared logic into a shared utility, hook, or component, and reference it from both call sites.

---

## UI Components — Mantine First

All UI must be built with [Mantine](https://mantine.dev/). Do not reach for raw HTML elements or other component libraries when a Mantine equivalent exists.

If a use case requires a Mantine extension package (e.g. `@mantine/dates`, `@mantine/charts`, `@mantine/spotlight`), add it — do not work around the absence of it.

---

## File Structure

If the file structure of a directory is becoming hard to navigate — mixed concerns, too many files at the top level, unclear groupings — propose a structural refactor before adding more files. A well-organised structure is part of the codebase, not an afterthought.

---

## Testing

Write tests for every unit of logic that can be tested in isolation. Design your code to be test-friendly from the start: avoid tight coupling to global state, side effects, or concrete implementations where an abstraction can be injected instead.

#### What to test

Test pure logic: parsing, formatting, filtering, validation, transformation. These are fast, reliable, and catch real bugs.

#### Keep logic out of components

If you find yourself wanting to test something inside a `.tsx` file, that is a signal to extract it first. Move the logic to a plain `.ts` file, test it there, and keep the component as thin wiring. This produces better-isolated tests and simpler components at the same time.