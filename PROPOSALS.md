# Proposal: Introduce Konva for Canvas Rendering

## Motivation

Three upcoming features collectively push the current rendering stack past what is practical to build and maintain with raw canvas + SVG:

- **Crop** — requires drag handles, aspect-ratio constraints, visual overlay. Non-trivial custom work.
- **Rotate** — requires a rotation handle, visual feedback, angle snapping.
- **Freehand drawing / annotations** — lines, shapes as first-class objects with their own state.

Konva provides all three via `Konva.Transformer` (crop/rotate handles) and `Konva.Line` / free-draw. The alternative is writing a custom drag-handle system, a rotation knob, and a line renderer from scratch — several weeks of work that Konva eliminates.

---

## Architecture

### Core decision: the engine owns the stage

The `CanvasEngine` creates and owns the `Konva.Stage` internally. Nothing outside the engine touches the stage directly. Components mount a `<div>` and hand it to `engine.mount(div)` — that is their only canvas interaction.

This is the only scalable arrangement:
- Conventions (like "don't touch the stage directly") erode over time; ownership enforced by `private` does not.
- All rendering mutations go through engine methods, so there is a single source of truth.
- The engine is fully testable without React — pass a real `HTMLDivElement`, inspect layer nodes.

### Two-canvas model (unchanged from today)

The pixel sampling constraint makes a dual-canvas model permanent:

```
Off-screen canvas (CanvasPipeline — unchanged)
  ├── source image (raw Uint8ClampedArray)
  ├── filter chain → filtered ImageData
  └── getColorAt(x, y, r) ← reads from here, no pins composited on top

Konva Stage (owned by CanvasEngine)
  ├── ImageLayer    ← Konva.Image fed from the pipeline's off-screen canvas
  ├── DrawingLayer  ← Konva.Line, shapes (annotations)
  └── UILayer       ← pins (Konva.Circle), Transformer (crop/rotate)
```

`CanvasPipeline` is untouched. When filters change, the pipeline renders to its off-screen canvas and calls `imageNode.image(offScreenCanvas)` to push the update into Konva.

### Renderer delegates

The engine does not manage Konva nodes directly. Each layer is owned by a dedicated renderer class:

```
CanvasEngine
  ├── Konva.Stage                (private, created in constructor)
  ├── CanvasPipeline             (unchanged)
  ├── ToolStateManager           (unchanged)
  ├── PinRenderer                (new) — Konva.Circle per pin, handles drag
  ├── AnnotationRenderer         (new) — Konva.Line / shape nodes
  └── CropTransformer            (new) — Konva.Transformer + crop rect node
```

Each renderer holds one `Konva.Layer` and a `Map<id, Konva.Node>`. It exposes one `update(data)` method that diffs the map against incoming data and creates, updates, or destroys nodes accordingly. This keeps the engine thin and stays under the 160-line limit.

### What disappears

| Current file / class | Fate |
|---|---|
| `SamplePinsOverlay.tsx` (SVG) | Deleted — replaced by `PinRenderer` |
| `SamplerOverlay.tsx` (2D canvas crosshair) | Deleted — replaced by a `Konva.Circle` node in UILayer |
| `MarqueeSelectOverlay.tsx` | Deleted — replaced by a `Konva.Rect` node managed by `MarqueeController` |
| `viewport.ts` (pan/zoom math) | Mostly deleted — Konva stage handles transforms; pure math utilities kept if needed |
| `hitTest.ts` | Deleted — Konva handles hit detection natively |
| `panHandler.ts` | Deleted — stage-level drag replaces this |
| Parts of `drag.ts` | Pan and marquee drag move to Konva; pin drag becomes a Konva `dragend` event |

### What stays exactly as-is

- `CanvasPipeline` — off-screen image processing, pixel sampling
- `ToolStateManager` — tool selection logic
- `EyedropperController`, `MarqueeController`, `SelectController` — interaction logic
- Zustand stores — no change
- All business logic in `.ts` files — the rule holds

---

## Prerequisite: finish the current engine refactor first

The `ENGINE_REFACTOR_PLAN.md` phases 1–4 are complete. Phases 5–7 are pending:

- **Phase 5** — move `activeTool` to `editorStore`, remove `activeFilterTool`
- **Phase 6** — wire `EyedropperController`, `MarqueeController`, `SelectController` into the live UI
- **Phase 7** — cleanup, knip, full typecheck pass

**Complete phases 5–7 before starting the Konva migration.** Attempting both in parallel means wiring controllers into an architecture that is about to be replaced. The clean foundation phases 5–7 produce (tool state in the store, controllers decoupled from rendering) is exactly what makes the Konva migration safe and incremental.

---

## Migration phases

### Phase K1 — Install and mount

- Add `konva` to dependencies (no `react-konva` needed)
- `CanvasEngine` constructor accepts `container: HTMLDivElement` and creates the stage
- Add `engine.mount(div)` and `engine.unmount()` methods
- `CanvasViewport.tsx` passes its `<div>` ref to the engine and never touches the stage again
- Stage is empty at this point — existing canvas and SVG overlays still render alongside

### Phase K2 — Image layer

- Create `ImageLayer` (or inline in engine) that holds a `Konva.Image` node
- After each `pipeline.applyFilterPipeline()` call, push the off-screen canvas to the Konva image node
- Verify `getColorAt()` still reads from the off-screen canvas (not the Konva canvas) — nothing changes here
- At this point the image is rendered twice (old `<canvas>` element + Konva). Remove the old visible canvas element.

### Phase K3 — PinRenderer replaces SVG overlay

- Create `PinRenderer` — one `Konva.Circle` per pin, `draggable: true`
- Expose `pinRenderer.update(palette, hiddenPinIds, selectedColorIds)` — diffs the node map
- Pin `dragend` event calls `engine.handlePinDragEnd(colorId, imageX, imageY)` which calls `pipeline.getColorAt()` and emits the result via the existing `onPinMoveEnd` callback
- Delete `SamplePinsOverlay.tsx`

### Phase K4 — Viewport migration

- Replace `viewport.ts` pan/zoom with `stage.position()` / `stage.scale()`
- `handleWheel` calls `stage.scaleBy()` anchored to the cursor position
- Stage `draggable: true` handles pan (middle mouse or tool-dependent)
- `subscribeToViewport` reads from `stage.position()` and `stage.scaleX()` — or the listener is dropped in favour of Konva's own `dragmove` / scale events
- Delete `viewport.ts`, `panHandler.ts`
- Coordinate math in controllers (MarqueeController, EyedropperController) updates to use `stage.getRelativePointerPosition()` for image-space coords

### Phase K5 — Sampler and marquee overlays

- Replace the 2D-canvas crosshair in `SamplerOverlay` with a `Konva.Circle` node on the UILayer, toggled visible by tool state
- Replace `MarqueeSelectOverlay` with a `Konva.Rect` node, position/size driven by `MarqueeController` state
- Delete both overlay components

### Phase K6 — CropTransformer

- Create `CropTransformer` — a `Konva.Rect` (crop area) + `Konva.Transformer` attached to it
- Transformer `onTransformEnd` calls `engine.applyCrop(rect)` with normalised coordinates
- Activated/deactivated based on `activeTool` in the store

### Phase K7 — AnnotationRenderer

- Create `AnnotationRenderer` — manages a `Konva.Layer` for drawn lines and shapes
- Line drawing: on `pointermove` with button held, append to an active `Konva.Line` node's points array
- On `pointerup`, finalise the line and persist it (shape added to store / project state)
- Tool: a new `draw` tool ID in `src/tools.ts`

### Phase K8 — Cleanup

- Delete `hitTest.ts` (now unused)
- Delete remaining parts of `drag.ts` replaced by Konva
- Run `knip`, fix all dead exports
- Run `npm run typecheck`
- Run full test suite; update tests that inspected SVG nodes to inspect Konva layer nodes instead

---

## Key decisions to make before starting

**1. Coordinate space for pin positions**

Currently pins are stored as normalised image coordinates (0–1). Konva works in stage pixels. `PinRenderer` must translate on every `update()` call: `imageX * imageWidth * stage.scaleX() + stage.x()`. Confirm this is the right direction (image-space in store, stage-space in renderer) before starting K3.

**2. What "drag a pin" means for getColorAt**

During a pin drag, `getColorAt` is called on `pointermove` to preview the new color. Konva fires `dragmove` on the node. Confirm that `dragmove` fires frequently enough (it does — Konva uses `pointermove` internally) and that the off-screen canvas pixel coordinates are correctly back-transformed from stage space.

**3. Annotation persistence**

Drawn lines need to be saved with the project. Decide the data model (array of point arrays per line, stored in Zustand / Firestore) before implementing K7, so the `AnnotationRenderer.update()` signature is correct from the start.

---

## What we do NOT use from Konva

- `react-konva` — the engine owns the stage imperatively; no JSX for canvas nodes
- Konva's built-in filter system — our `CanvasPipeline` handles all image processing at the pixel level; Konva filters cannot operate on raw `Uint8ClampedArray`
- Konva's serialisation (`toJSON` / `fromJSON`) — project state lives in Zustand / Firestore, not in the Konva scene graph

---

# Proposal: Pipeline Refactor + Revised Konva Scope

## What we learned from the first proposal

The original Konva proposal was written before fully thinking through the pipeline architecture. Reviewing it surfaced two things:

1. The filtered canvas is duplicated — it appears independently in both the Filters tab and the Palette tab, showing the same content twice with no shared ownership.
2. Crop and rotate do not need to be Konva responsibilities. They are transforms applied to the source image, upstream of the filter chain. Konva's `Transformer` is useful only as a handle widget during those modes — it does not own the pixel transformation.

This proposal replaces the original architecture with a cleaner one.

---

## The pipeline

Each canvas derives strictly from the one above it:

```
SourceCanvas       ← raw pixels; crop/rotate applied here; dimensions change on crop
      ↓ applyFilterPipeline
FilteredCanvas     ← filtered image; displayed in Filters tab (right) and Palette tab (left); getColorAt reads here
      ↓ useIndexedImage
IndexedCanvas      ← quantized / mixed-colors preview; displayed in Palette tab (right)

PinsCanvas         ← overlay; no data dependency; absolutely positioned on top of FilteredCanvas; shares viewport transform
```

Crop and rotate are applied to `SourceCanvas` before the filter chain runs. Everything downstream recomputes from the new pixels. Pin positions are stored as normalised image coordinates (0–1); when crop changes the image dimensions, pin positions must be re-anchored at crop-apply time. The engine owns this translation.

---

## Canvas classes

Each canvas becomes a plain TypeScript class with only the methods this app needs:

- `SourceCanvas` — holds raw pixels; `loadBitmap`, `applyCrop(rect)`, `applyRotation(deg)`, exposes `width` / `height`
- `FilteredCanvas` — receives source `ImageData`; runs filter chain; exposes `getColorAt(x, y, r)`; exposes the underlying `HTMLCanvasElement` so Konva can read it as a texture
- `IndexedCanvas` — receives quantized `ImageData`; draws it; display only
- `PinsCanvas` — overlay canvas; `update(palette, hiddenIds, selectedIds, viewport)`; hit detection in image space

The `CanvasEngine` owns all four instances, runs the pipeline between them, and translates viewport ↔ image space centrally so no component ever does coordinate math.

---

## Where Konva fits

**Input catching — yes, Konva.** If Konva is in, all input should route through the stage. `stage.on('wheel', ...)`, `stage.on('mousedown', ...)`, `node.on('dragend', ...)` replace the current DOM event listeners and manual `getBoundingClientRect()` + transform inversion. The engine's internal routing logic does not change — only what calls it. The benefit is real: `stage.getRelativePointerPosition()` returns image-space coordinates accounting for pan/zoom in one call, Konva normalises pointer events across browsers, and every handler has the same consistent coordinate API. This also makes the codebase significantly easier to work with — a well-documented, widely-used event surface beats custom pointer math that has to be reverse-engineered each time.

**Crop / rotate handles — yes, Konva.** `Konva.Transformer` gives corner handles, rotation knob, aspect-ratio constraints, and snapping for free. Implementing these from scratch is expensive. The Transformer acts purely as a UI input device: when the user commits, the engine extracts the resulting `cropRect` / `rotation` and feeds them into `SourceCanvas`. Konva does not touch pixels.

**Freehand drawing — yes, Konva (if it lands).** `Konva.Line` with live point appending is the right tool for annotation. If this feature is scoped in, Konva earns its place more fully and the dependency is clearly justified.

**If only crop/rotate handles are needed in the near term**, Konva can be deferred. A handful of absolutely-positioned DOM elements with pointer handlers covers simple handles at zero dependency cost. Add Konva when freehand drawing is confirmed. But if Konva is added at all, input must go through the stage — a parallel DOM event surface alongside Konva is more work and leaves two competing input systems.

---

## Pipeline + Konva coexistence

Konva and the pipeline are orthogonal and compose without conflict:

```
FilteredCanvas (off-screen HTMLCanvasElement, clean pixels only)
  ├── Konva.Image(filteredCanvas.element) ← Konva reads it as a texture to display
  └── getColorAt()                         ← reads pixel data directly; bypasses Konva entirely
```

Konva never writes to the pipeline's canvases. It samples `FilteredCanvas` each frame to render its image node, but the canvas stays clean — no pins or handles composited on it — so `getColorAt` remains correct.

The one coupling point is coordinate translation during color sampling. When the user clicks in eyedropper mode, the pointer arrives in screen space. The engine converts:

```
screen coords → stage.getRelativePointerPosition() → stage space → image space → getColorAt
```

This translation lives in the engine, same as today, just using Konva's API to get the pointer position.

---

## The filtered canvas duplication fix

Currently `filteredCanvasRef` (owned by the engine) and a local `filteredRef` in `PaletteTabContent` both show the same filtered image. This is accidental duplication.

The fix: one `FilteredCanvas` instance owned by the engine. Both tabs reference it. The Filters tab displays it directly. The Palette tab displays it with the `PinsCanvas` absolutely positioned on top. No content is ever rendered twice.

---

## Prerequisite

Complete engine refactor phases 5–7 before starting this. The clean foundation (tool state in the store, controllers decoupled from rendering) is what makes the canvas class extraction safe and incremental.
