# Testing Strategy — Impasto

## Why E2E First

Impasto is a canvas-based image editor with deeply interconnected state: tools, palettes, pins, filters, WASM processing, and drag interactions all feed into each other. Unit-testing individual hooks or components in isolation would require mocking so much of that surface that the tests would stop reflecting reality. The recurring problem — "adding a feature breaks another one" — is a *flow* problem, not a logic problem.

E2E tests with Playwright exercise the app as a user would, which is exactly the regression surface we need to protect.

---

## Architecture of the Test Suite

```
tests/
  TESTING.md          ← this file
  snapshots/          ← committed visual baseline screenshots
  helpers/            ← shared utilities (auth, canvas actions, selectors)
  editor/             ← tests grouped by editor feature area
  dashboard/          ← tests for the dashboard/home flows
  auth/               ← sign-in, sign-out, auth guards
```

Group tests by **feature area**, not by component. A test for the brush tool should live in `editor/tools.spec.ts`, not in a file named after `ToolRail.tsx`.

---

## Two-Layer Testing Model

### 1. Behavioral tests (`*.spec.ts`)

Test user flows end-to-end. These assert that actions produce the correct application state — DOM changes, URL changes, sidebar state, tool state reflected in UI chrome, etc.

```ts
// Good: tests a real user flow
test('selecting brush tool activates it in the toolbar', async ({ page }) => {
  await page.getByTestId('tool-brush').click()
  await expect(page.getByTestId('tool-brush')).toHaveAttribute('data-active', 'true')
})
```

Use `data-testid` attributes as the primary selector strategy. Never select by CSS class or by text that might change. If a testid is missing, add it to the component — it's part of the contract.

### 2. Visual regression tests (`*.visual.spec.ts`)

Use `expect(page).toHaveScreenshot()` for areas where correctness is visual and cannot be encoded in a DOM assertion. This applies to:

- Canvas output after a paint operation
- Filter panel rendering
- Palette color swatches
- Pin overlays on the canvas

Snapshots live in `tests/snapshots/`. Commit them. Update them intentionally with `npx playwright test --update-snapshots` when a visual change is expected.

---

## Canvas Interactions

The canvas has no internal DOM structure Playwright can query. Test canvas interactions by:

1. Simulating pointer events at specific coordinates relative to the canvas element
2. Asserting the visual result with a screenshot

```ts
const canvas = page.getByTestId('editor-canvas')
const box = await canvas.boundingBox()

// Simulate a brush stroke
await page.mouse.move(box.x + 100, box.y + 100)
await page.mouse.down()
await page.mouse.move(box.x + 200, box.y + 150)
await page.mouse.up()

await expect(page).toHaveScreenshot('brush-stroke.png')
```

For drag interactions (marquee select, moving pins), use the same pattern — `mouse.down`, `mouse.move`, `mouse.up`.

---

## Helpers

Put reusable operations in `tests/helpers/`. Keep them plain TypeScript functions that accept a `Page` object. Do not put assertions in helpers — helpers navigate and set up state, tests assert.

Examples of what belongs in helpers:
- `openEditor(page, projectId)` — navigate to a project and wait for the editor to be ready
- `signInAs(page, role)` — authenticate with a test account
- `pickColor(page, hex)` — interact with the palette sidebar to select a color

---

## `data-testid` Convention

Add testids to any element a test needs to target. Use kebab-case. Be specific enough to avoid collisions but not so specific that a rename breaks tests.

| Element | Testid |
|---|---|
| Editor canvas | `editor-canvas` |
| Tool buttons | `tool-{name}` (e.g. `tool-brush`, `tool-sampler`) |
| Active tool indicator | `tool-{name}` with `data-active="true"` |
| Palette sidebar | `palette-sidebar` |
| Color item in palette | `color-item-{index}` |
| Pin on canvas overlay | `pin-{id}` |
| Editor tabs | `editor-tab-{id}` |
| Filter panel | `filter-panel` |

---

## State Reset Between Tests

Each test must start from a known state. Do not rely on state left over from a previous test — Playwright runs tests in the same browser context by default unless you use `test.describe` with `use: { storageState }` isolation.

Use `beforeEach` to navigate to the correct route and wait for the app to be ready before asserting anything.

---

## What Not to Test Here

- WASM crate logic → test in Rust with `cargo test`
- Pure utility functions (color math, formatting) → extract to `.ts` files and test with Vitest if added later
- Firebase auth flows in production → mock with local emulator or fixed test credentials

---

## Running Tests

```bash
# Run all tests (starts dev server automatically)
npx playwright test

# Run a specific file
npx playwright test tests/editor/tools.spec.ts

# Run in headed mode (see the browser)
npx playwright test --headed

# Update visual snapshots
npx playwright test --update-snapshots

# Open the HTML report after a run
npx playwright show-report
```

---

## CI

On CI, set `CI=true`. Playwright will:
- Not reuse an existing dev server (starts fresh)
- Retry failed tests up to 2 times
- Run with 1 worker to avoid port conflicts
