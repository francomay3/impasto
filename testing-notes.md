# Testing Notes

## Auth-gated features

All editor features (tool switching, palette sidebar, filter panel, canvas interactions) require a signed-in Firebase user.
The current test suite can only exercise the auth screen without real auth.

### Unblocking editor tests

To unlock tests for editor features, one of the following is needed:

1. **Firebase local emulator** — run the emulator with `firebase emulators:start`, configure the app to point to it in test mode, and pre-create a test user via the emulator UI or REST API.
2. **Fixed test credentials** — create a dedicated test account in the real Firebase project. Store credentials in an env-var or Playwright `storageState` fixture.

Once auth is available, `tests/helpers/index.ts#signInAs` should be implemented to restore a saved auth state using `page.context().storageState(...)`.

---

## Features needing tests (pending auth setup)

### Tool switching (editor/tools.spec.ts)

The palette tab has a tool rail with three tools: `select`, `marquee`, and `eyedropper`.

- Each tool button has `data-testid="tool-{id}"` and `data-active="true"` when active.
- Test that clicking a tool button activates it and deactivates the previously active one.
- Test keyboard shortcuts: `V` → select, `S` → marquee, `E` → eyedropper.

### Tab switching (editor/tabs.spec.ts)

The editor has two active tabs: Filters and Palette.

- Test switching between Filters and Palette tabs.
- Verify that the correct sidebar panel appears (filter-panel vs palette-sidebar).
- The other tabs (Values, Composition, Color Study, Paint) are disabled — test that clicking them has no effect.

### Image upload (editor/image-upload.spec.ts)

When no image is loaded, the editor shows an upload prompt.

- Test that the upload dropzone is visible when no image is loaded.
- Simulating a file drop requires `page.dispatchEvent` with a DataTransfer containing a File. The test image should be a small PNG in `tests/fixtures/`.
- After upload, the editor should switch away from the upload prompt and show the tab interface.

### Palette sidebar (editor/palette.spec.ts)

The palette sidebar (`data-testid="palette-sidebar"`) contains color items.

- Test adding a color via the "Add Color" button.
- Test renaming a color by clicking its name label.
- Test deleting a color via the X button.
- Color items do not yet have `data-testid` attributes. Before writing these tests, add `data-testid={`color-item-${index}`}` to `SortableColorItem` in `PaletteSidebar/ColorItem.tsx` and pass the index from `PaletteSidebar/index.tsx`.

### Filter panel (editor/filters.spec.ts)

The filter panel (`data-testid="filter-panel"`) shows applied filters.

- Test adding a filter via the "Add Filter" button (opens a context menu).
- Test reordering filters via drag-and-drop.
- Test removing a filter.

### Canvas interactions (editor/canvas.spec.ts)

Canvas interactions require visual regression snapshots.

- Test a brush stroke by simulating `mouse.down → mouse.move → mouse.up` on `data-testid="editor-canvas"`.
- Test marquee selection drag.
- All canvas interaction tests must end with `expect(page).toHaveScreenshot(...)`.

### Marquee selection (editor/marquee.spec.ts)

- Activate the marquee tool (S), then drag across the canvas.
- Assert that the marquee overlay (`MarqueeSelectOverlay`) is visible during the drag.
- Assert that colors under the selection are highlighted after mouse-up.

### Undo / Redo (editor/undo-redo.spec.ts)

- Perform a state-changing action (e.g. add a color).
- Press `Cmd+Z` and verify the action is undone.
- Press `Cmd+Shift+Z` and verify it is redone.
