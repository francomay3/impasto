# Testing Notes

Features not yet covered by Playwright tests, with notes on why and what it would take.

---

## ImageUploader — drag-and-drop file onto the upload zone

**What it is:** The `ImageUploader` box accepts `onDrop` events. Dragging an image file onto it should load the image (tab bar appears); dragging a non-image should be silently rejected.

**Why not tested:** `DataTransfer.files` is read-only by browser security policy and cannot be set from JavaScript (`page.evaluate`). Playwright does not currently expose a first-class API for dispatching synthetic drag-from-filesystem events with real file objects. The `page.locator.setInputFiles` helper only targets `<input type="file">` elements, not the drop-zone Box.

**How to approach:** Use Playwright's CDP `Input.dispatchDragEvent` via `page.context().newCDPSession()` combined with file injection. Alternatively, intercept the `onDrop` handler at the React boundary using a `page.exposeFunction` approach: expose a JS function that calls `handleFile` directly with a synthesized `File` object from `page.evaluate`. This avoids the DataTransfer restriction but bypasses the DOM event path. A simpler route is to test the underlying `onFileSelected` callback via unit tests on `useEditorHandlers`.

---

## Drag-and-drop color reordering in the palette

**Why not tested:** dnd-kit uses a custom pointer sensor with a deliberate activation delay and distance threshold. Playwright's standard `dragTo` and `page.mouse` drag sequences do not replicate the pointer events dnd-kit expects, causing drags to silently no-op.

**How to approach:** Use a custom helper that fires the full low-level pointer event sequence: `pointerdown` → wait at least the activation delay (default 250 ms) → `pointermove` past the activation distance → `pointermove` to destination → `pointerup`. This must be dispatched via `page.evaluate` or `page.dispatchEvent` directly on the drag handle element. Build a dedicated `tests/helpers/dnd.ts` helper once the approach is validated.

---

## Drag-and-drop filter reordering

Same issue as palette drag-and-drop. `FilterItem` uses `useSortable` from dnd-kit. The same custom pointer event helper applies.

---

## Drag color into a group

Same dnd-kit constraints. Additionally, dropping on `GroupDropZone` requires coordinates relative to the target group element's bounding box at test time.

---

## Dashboard page

**Why not tested:** In E2E test mode, the dashboard auto-creates a project and immediately redirects to `/project/<id>` when no projects exist. The test never sees the dashboard UI.

**How to approach:** Seed at least one project before navigating to `/`. Options:
1. Seed Firestore via the Firebase Emulator in a `globalSetup` fixture.
2. Add a `VITE_E2E_PREFILL_PROJECTS=true` flag (consistent with the existing auth bypass in `AuthContext.tsx`) that returns in-memory stub projects without hitting Firestore.

Option 2 is the most consistent with the existing test-mode architecture.

---

## Pin dragging on canvas

**What it is:** Sampled color pins (SVG `<g>` elements) can be dragged to reposition the sample point on the image.

**Why not tested:** The pin's coordinate system uses a `viewBox` scaled to source image dimensions. Drag coordinates must account for the canvas bounding box and the current viewport transform (pan/zoom). Getting the right screen coordinates requires knowing where the pin dot is rendered after a zoom/pan.

**How to approach:** After sampling a color with the eyedropper, get the SVG overlay bounding box and compute the pin's screen position from its `sample.x / sample.y` and the canvas scale. Then use `mouse.move → down → move → up`. Assert the result with a visual screenshot.

---

## Marquee selection (draw rectangle to bulk-add colors)

**What it is:** With the marquee tool active, dragging on the canvas draws a selection rectangle and extracts colors from that area.

**Why not tested:** The current test image is a solid 10×10 red square — any selection would yield the same one color. Also, the WASM k-means clustering is randomly seeded, making exact color counts non-deterministic.

**How to approach:** Generate a multi-color test image in a new helper (e.g. a 4-quadrant canvas with distinct solid colors). Fix the k-means seed for tests (or check only that *at least N* colors were added). Then activate marquee, drag across one quadrant, and assert the palette count increased.

---

## Levels filter — sample black/white point from canvas

**What it is:** The Levels widget has a pipette button per point. Clicking enters sampling mode; clicking the canvas samples that pixel's luminance as the new point value.

**Why not tested:** The solid-red test image would sample the same luminance value for both black and white points, making assertions non-obvious.

**How to approach:** Use a test image containing near-black and near-white regions. Click the Black Point pipette, click the dark region, and assert the `Black Point:` label updated to a non-zero value.

---

## Export palette and Sort palette (contextual toolbar)

**Status:** Both buttons are rendered in the contextual toolbar but have no `onClick` handlers yet. No tests needed until the features are implemented.

---

## Select All and Deselect (contextual toolbar)

**Status:** Both buttons are rendered in the contextual toolbar (`PaletteToolOptions` when `activeTool === 'select'`) but have no `onClick` handlers yet. No tests needed until the features are implemented.

---

## Color ratio badge

**What it is:** A `{ratio}%` badge appears on each color item once the WASM indexed-image pipeline finishes assigning pixel-area ratios.

**Why not tested:** The badge only appears after the async WASM worker completes. The timing is non-deterministic and the 10×10 solid-red test image yields 100% for any sampled color, making meaningful assertions about distinct ratio values impossible without a multi-color test image.

**How to approach:** Use a fixed multi-color test image and wait for the `color-ratio` testid to become visible before asserting its value.

---

## Double-click canvas to reset viewport transform

**What it is:** Double-clicking the canvas viewport container calls `onResetTransform`, snapping pan and zoom back to default.

**Why not tested:** There is no DOM-observable indicator for the current zoom/pan level. Asserting the reset would require either a visual screenshot comparison or inspecting the computed CSS `transform` style on an internal element — both are fragile.

**How to approach:** Add a `data-testid="canvas-transform"` to the transform wrapper `Box` and expose the current `scale` as a `data-scale` attribute. Then zoom in via a wheel event, assert `data-scale` changed, double-click, and assert it returned to `1`.

---

## Contextual toolbar — unimplemented buttons

**Status:** The following buttons are rendered but have no `onClick` handlers yet. No tests needed until the features are implemented.

- **Select All** / **Deselect** (palette tab, select tool active) — `src/components/ContextualToolbar/index.tsx:24-25`
- **Add to Selection** / **Subtract** (palette tab, marquee tool active) — `src/components/ContextualToolbar/index.tsx:33-34`
- **Compare** / **Reset** (filters tab) — `src/components/ContextualToolbar/index.tsx:91-92`
- **Sort** / **Export** (palette tab right side) — `src/components/ContextualToolbar/index.tsx:98-99`
