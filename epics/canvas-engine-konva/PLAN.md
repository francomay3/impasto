# CanvasEngine Refactor + Konva Integration

## What & Why

`CanvasEngine` currently does four unrelated jobs: viewport physics, tool state, pin dragging, and color sampling — with a direct `useEditorStore` import that couples it to React. This refactor extracts each concern into its rightful owner, rebuilds `CanvasPipeline` as four typed canvas layer classes, and introduces Konva to replace manual coordinate math, DOM/SVG overlays, and custom drag/hit-test code.

---

## Phase 1 — Layer Classes

### Phase 1 — Layer Classes

- [ ] Create `src/features/canvas/engine/layers/CanvasLayer.ts` — abstract base class with protected `canvas: HTMLCanvasElement`, `ctx`, and `get element()`.
- [ ] Create `src/features/canvas/engine/layers/SourceCanvas.ts` extending `CanvasLayer` — `loadBitmap`, `loadImage`, `applyCrop`, `applyRotation`, `width`, `height`. Wire the crop/rotate stubs that currently sit unused on `CanvasEngine`. Write `SourceCanvas.test.ts`.
- [ ] Create `src/features/canvas/engine/layers/FilteredCanvas.ts` extending `CanvasLayer` — `applyFilters(source, filters)`, `getColorAt(x, y, radius)`, `get element()`. Lift logic from `CanvasPipeline`. Write `FilteredCanvas.test.ts`.
- [ ] Create `src/features/canvas/engine/layers/IndexedCanvas.ts` extending `CanvasLayer` — `draw(imageData)`. Display-only.
- [ ] Create `src/features/canvas/engine/layers/PinsCanvas.ts` extending `CanvasLayer` — `update(palette, hiddenIds, selectedIds, imgW, imgH)`, `hitTestPoint`, `hitTestRect`. Absorb logic from `hitTest.ts`. Split into `PinsCanvas.ts` + `PinsCanvas.hitTest.ts` if needed to stay under 160 lines.
- [ ] Refactor `CanvasPipeline` into a thin composition container holding `source`, `filtered`, `indexed`, `pins`. Move `runQuantization` to `src/features/canvas/engine/quantize.ts`. Update/repurpose `pipeline.test.ts`.

---

## Phase 2 — CanvasController

- [ ] Create `src/features/canvas/engine/CanvasController.ts` — owns `ToolStateManager`, `MarqueeController`, `EyedropperController` adapter, pin drag state, palette, `onPinMoveEnd`. Constructor takes `(engine: CanvasEngine, filteredCanvas: FilteredCanvas)`. Move `useEditorStore` import here. `CanvasController` calls `engine.notify()` after state changes. Split into `CanvasController.ts` + `CanvasController.input.ts` if needed to stay under 160 lines.
- [ ] Write `src/features/canvas/engine/CanvasController.test.ts` — absorb content from `toolState.test.ts` and drag-related `CanvasEngine` tests.
- [ ] Strip `CanvasEngine` — remove all methods/fields marked `// this shouldnt be here`. `EngineState` loses `drag`. `getSnapshot()` returns only `{ viewport, pipeline }`. Make `notify()` non-private.
- [ ] Update `CanvasEngine.test.ts` — remove drag/tool assertions and `editorStore` mock.

---

## Phase 3 — React Wiring

- [ ] Create `src/features/canvas/engine/ControllerContext.tsx` — exports `ControllerProvider` and `useController()`, analogous to `EngineContext.tsx`.
- [ ] Modify `Editor.tsx` — instantiate `CanvasController` alongside `CanvasEngine`; provide it via `ControllerContext`.
- [ ] Update `useCanvasOverlayProps.ts` — replace all `engine.*` tool/drag calls with `controller.*`; subscribe to both `engine.subscribe` and `controller.subscribe`.
- [ ] Update `ContextualToolbar/index.tsx` — replace `engine.getToolState`, `engine.setSamplingRadius`, `engine.setSelectionMode` with `useController()`.
- [ ] Update `CanvasViewport.tsx` — `isSampling` comes from `controller`; `filteredCanvasRef` becomes imperatively assigned from `engine.pipeline.filtered.element` in a `useEffect`.
- [ ] Update `PaletteTabContent.tsx` — remove `drawImageDataToCanvas` call; route filter application through `engine.pipeline.filtered.applyFilters(...)` via `useEditorActions`.
- [ ] Route all remaining `engine.getColorAt` callers to `controller.getColorAt`.
- [ ] Run `bun knip`, `bun run typecheck`, `bun test` — all green before starting Phase 4.

---

## Phase 4 — Konva: Stage + Image Layer

- [ ] `bun add konva && bun add -d @types/konva`.
- [ ] Add `mount(container: HTMLDivElement)` and `unmount()` to `CanvasEngine` — creates `Konva.Stage` with `ImageLayer` and `UILayer`; adds `Konva.Image` fed from `filteredCanvas.element`; makes stage draggable.
- [ ] Rewrite `CanvasViewport.tsx` — replace inner `transformBox` div + `<canvas>` ref with `<div ref={containerRef} />`; call `engine.mount` / `engine.unmount` in a `useEffect`. Remove the `subscribeToViewport` + imperative `style.transform` pattern.
- [ ] Replace `viewport.ts` pan/zoom math in `CanvasEngine` with Konva stage calls (`stage.scale`, `stage.position`). Delete `panHandler.ts`.
- [ ] After verifying image renders correctly through Konva, remove the old visible `<canvas>` element. Delete `viewport.ts` once no callers remain.

---

## Phase 5 — Konva: Overlay Nodes

- [ ] Create `src/features/canvas/engine/layers/konva/MarqueeNode.ts` — `Konva.Rect` on UILayer; `CanvasController` calls `marqueeNode.update(state)` after drag updates. Delete `MarqueeSelectOverlay.tsx`.
- [ ] Create `src/features/canvas/engine/layers/konva/SamplerNode.ts` — `Konva.Circle` crosshair on UILayer; listens to `stage.on('mousemove')`; triggers eyedropper sample on click. Delete `SamplerOverlay.tsx`.
- [ ] Create `src/features/canvas/engine/layers/konva/PinRenderer.ts` — pool of `Konva.Circle` nodes; `update(palette, hiddenIds, selectedIds, dragState)` diffs node map; `dragend` calls `controller.handlePinDragEnd`. Write `PinRenderer.test.ts`. Delete `SamplePinsOverlay.tsx` and `SamplePin.tsx`.
- [ ] Create `src/features/canvas/engine/layers/konva/CropNode.ts` and `RotateNode.ts` — `Konva.Transformer`-based handles; bridge to `CropController` / `RotateController`. Delete `CropOverlay.tsx` and `RotateOverlay.tsx`.

---

## Phase 6 — Cleanup

- [ ] Delete dead files: `hitTest.ts`, `panHandler.ts`, `viewport.ts` (confirm with `bun knip` first).
- [ ] Update `canvasEngine.viewport.test.ts` — assertions move from `getSnapshot().viewport.panX` to `stage.position().x`; mock `Konva.Stage` in vitest setup.
- [ ] Delete `hitTest.test.ts` and `panHandler.test.ts` (modules removed).
- [ ] Run `bun knip`, `bun run typecheck`, `bun test` — all green. Ship.
