# CanvasEngine Refactor Plan

> **For the executing agent:** read `prompt.md` first — it has your instructions.
> Ongoing learnings and phase notes live in `comments.md`.

---

## Background & Motivation

### Why this plan exists

This app is a color palette extraction and image editing tool built in React. Over
time, as features were added on top of features, business logic accumulated inside
React hooks and components. The result is a codebase where:

- Changing one hook or component causes unrelated features to break, because
  everything is coupled through the React render cycle.
- The blast radius of any change is unpredictable and hard to reason about.
- Tests had to be written as Playwright e2e tests (browser-launched), because the
  logic cannot be exercised in isolation. These tests are slow to write, slow to
  run, and fragile to maintain.

The conversation that produced this plan identified the root cause: **business logic
should never live in React components or hooks.** React should only render and wire.
When logic lives in plain TypeScript, it can be unit tested in milliseconds with
Vitest, and a change to one module cannot break a component that doesn't import it.

### The specific problem with the canvas

The canvas area (viewport, tools, overlays) is the most interconnected part of the
app. It currently has:

- Viewport pan/zoom state inside a React hook (`useViewportTransform`)
- Tool/interaction state split between a hook (`useInteraction`) and an XState
  machine (`interactionMachine`) that is started inside the hook
- Mouse and keyboard event handlers spread across `CanvasViewport.tsx`, 
  `SamplePinsOverlay.tsx`, `MarqueeSelectOverlay.tsx`, and several other overlay
  components
- Hit testing logic (`findPinAt`, `getPinsInRect`) partially inside hooks, partially
  inside overlay components
- Drag state managed by two separate hooks (`usePinDrag`, `useMarqueeDrag`)
- The canvas rendering pipeline (`useCanvasPipeline`) inside a hook

All of this means the canvas feature is one large, tightly-coupled ball. You cannot
test viewport math without mounting React. You cannot test whether a click on a pin
selects it without running Playwright. And you cannot change the drag logic without
risking a regression in pin selection, which is implemented nearby.

### The fix

Extract all of the above into a single `CanvasEngine` class written in plain
TypeScript. React components become thin, dumb renderers: they receive state from
the engine and forward raw DOM events back to it. Nothing more.

### Things to keep in mind throughout

- **Do not change visible behaviour.** Every phase should leave the app looking and
  feeling identical to before. The refactor is purely structural.
- **Do not change WASM, Workers, or the data layer.** They are not the problem.
- **Each phase is independently shippable.** Commit and verify after each one before
  moving to the next. If something breaks, the blast radius is limited to one phase.
- **Follow the phase order.** Later phases depend on earlier ones. Skipping ahead
  creates undefined dependencies.
- **Tests come with each phase.** Do not defer testing to the end.
- **Read `comments.md` before starting each phase.** Previous phases may have left
  learnings that affect the current one.

---

## Goal

Replace the current mix of React hooks, contexts, and component-bound logic with a
single `CanvasEngine` class that owns all canvas behaviour. React becomes a thin
rendering layer that subscribes to engine state and forwards raw DOM events.

### What moves INTO the engine

| Concern | Currently lives in |
|---|---|
| Viewport transform (pan, zoom) | `useViewportTransform` hook |
| Tool / interaction state | `useInteraction` + `interactionMachine` XState |
| Mouse / keyboard input routing | `CanvasViewport`, overlay components |
| Hit testing (pin, marquee) | `usePinHitTest`, `MarqueeSelectOverlay` |
| Drag state (pin drag, marquee drag, pan) | `usePinDrag`, `useMarqueeDrag` |
| Canvas pipeline (image load, filter, quantize) | `useCanvasPipeline` hook |

### What stays in React

- SVG overlay rendering (SamplePinsOverlay, SamplerOverlay, MarqueeSelectOverlay)
- UI chrome (toolbar, panels, modals, palette sidebar)
- Zustand `editorStore` (selection/hover — cross-boundary UI state)
- Firebase + TanStack Query (data layer)
- Mantine components

---

## Key Design Decisions

These are decided. Do not relitigate them mid-refactor — if you encounter a strong
reason to deviate, document it in `comments.md` and flag it.

### 1. Engine instantiation

One engine instance per Editor mount (not a global singleton). Created in
`Editor.tsx`, held in a ref, passed down via a single `EngineContext`.

```ts
const engineRef = useRef(new CanvasEngine(editorStore))
```

Testable (`new CanvasEngine(mockStore)`), supports multiple editors, no global
state leaks.

### 2. Engine → React communication

Use `useSyncExternalStore`. The engine maintains a plain state object and calls
`notify()` when it changes. React subscribes with a selector.

```ts
// inside engine
private listeners = new Set<() => void>()
notify() { this.listeners.forEach(l => l()) }
subscribe(l: () => void) { this.listeners.add(l); return () => this.listeners.delete(l) }
getSnapshot() { return this.state }

// in React
const viewportTransform = useSyncExternalStore(
  engine.subscribe,
  () => engine.getSnapshot().viewport
)
```

No Zustand, no extra deps. React-native. Optimal re-renders via selectors.

### 3. Engine → Zustand editorStore

Selection and hover stay in Zustand (read by components outside the canvas).
The engine calls the store directly — no React involved.

```ts
class CanvasEngine {
  constructor(private editorStore: typeof import('./editorStore').useEditorStore) {}
  private selectPin(id: string) {
    this.editorStore.getState().selectColor(id)
  }
}
```

### 4. Input events

Components forward raw DOM events to the engine. No business logic in the handler.

```tsx
<div onMouseDown={e => engine.handleMouseDown(e.nativeEvent)} />
```

Engine reads coordinates, transforms via viewport, dispatches to the active tool.

### 5. Canvas element refs

Engine owns the canvas refs. Components register them on mount.

```tsx
useEffect(() => {
  engine.attachCanvas(filteredCanvasEl, indexedCanvasEl)
  return () => engine.detachCanvas()
}, [])
```

---

## Phases

Each phase is independently shippable, passes all existing tests, and changes no
visible behaviour. Complete them in order.

---

### [ ] Phase 0 — Engine Stub

**Goal:** Establish file structure, instantiation pattern, and subscription
mechanism. No logic moves yet.

Steps:
1. Create `src/features/canvas/engine/CanvasEngine.ts` — empty class with
   `subscribe` / `getSnapshot` / `notify` pattern.
2. Create `src/features/canvas/engine/EngineContext.tsx` — React context holding
   the engine instance.
3. Instantiate `CanvasEngine` in `Editor.tsx`, wrap children in `EngineContext`.
4. Add `useEngine()` convenience hook.
5. No existing code is changed. All existing hooks/contexts still do all the work.

**Tests:** Unit test that `subscribe` / `notify` / `getSnapshot` wire correctly.

---

### [ ] Phase 1 — Viewport

**Goal:** Viewport transform (pan, zoom) lives in the engine.

Steps:
1. Add `ViewportState` to engine state: `{ panX, panY, scale }`.
2. Move `panOnZoom`, `panOnDrag`, `applyZoomStep` from `viewportMath.ts` into
   `engine/viewport.ts` (pure functions, keep testable).
3. Add engine methods: `handleWheel(e, canvasRect)`, `handlePanStart(e)`,
   `handlePanMove(e)`, `handlePanEnd()`.
4. Replace `useViewportTransform` with `useViewportState(engine)` — thin
   `useSyncExternalStore` subscriber on the engine's viewport slice.
5. The imperative DOM write (CSS transform on the viewport div) stays, but is now
   driven by engine subscription, not hook-internal state.
6. Delete `useViewportTransform.ts`.
7. Update `CanvasViewport.tsx` to forward wheel and mouse events to the engine.

**Tests:** `engine/viewport.test.ts` — zoom at cursor, pan, scale clamping,
fit-to-screen. No React, no DOM.

---

### [ ] Phase 2 — Tool / Interaction State

**Goal:** Tool state and transitions live in the engine.

Steps:
1. Move `interactionMachine.ts` into `engine/interactionMachine.ts` — already
   pure, no changes to the machine itself.
2. Start the machine inside the engine constructor. Engine exposes: `activeTool`,
   `isSampling`, `samplingColorId`, `samplingLevels`, `samplingRadius`.
3. Engine methods: `selectTool(id)`, `activateEyedropper()`,
   `startSamplingColor(id)`, `completeSample()`, `cancel()`, `setSamplingRadius(r)`.
4. Replace `useInteraction` with `useToolState(engine)` — `useSyncExternalStore`
   on the engine's tool slice.
5. Delete `useInteraction.ts`.
6. Update `CanvasContext` to source `activeTool` from engine, or remove those
   fields from the context if nothing still needs them there.

**Tests:** Keep `engine/interactionMachine.test.ts`. Add `engine/toolState.test.ts`
for engine method → machine transition coverage.

---

### [ ] Phase 3 — Input Routing

**Goal:** All mouse and keyboard input is handled by the engine. Components only
forward raw events.

Steps:
1. Add `engine.handleMouseDown(e, canvasRect)`, `handleMouseMove(e)`,
   `handleMouseUp(e)`, `handleKeyDown(e)`, `handleKeyUp(e)`.
2. Engine routes based on `activeTool`:
   - `select` → hit test → select/deselect pin
   - `marquee` → start marquee drag
   - `eyedropper` → start sampling
   - middle button / space+drag → pan
3. Strip all `onMouseDown` / `onMouseMove` logic from `CanvasViewport.tsx`,
   `SamplePinsOverlay.tsx`, `MarqueeSelectOverlay.tsx`. Replace with single-line
   engine forwards.
4. Delete `useMarqueeDrag.ts` and `usePinDrag.ts` — logic moves into engine.

**Tests:** `engine/input.test.ts` — mock canvas rect, send synthetic MouseEvents,
assert engine state transitions. No React, no DOM rendering.

---

### [ ] Phase 4 — Hit Testing

**Goal:** Pin and marquee hit testing are pure engine functions.

Steps:
1. Create `engine/hitTest.ts`:
   - `findPinAt(clientX, clientY, pins, canvasRect, viewport): string | null`
   - `findPinsInRect(selectionRect, pins, viewport): string[]`
2. Replace logic currently spread across `usePinHitTest.ts` and
   `MarqueeSelectOverlay.tsx`.
3. Engine calls these from its input handlers (Phase 3).
4. Delete `usePinHitTest.ts`.

**Tests:** `engine/hitTest.test.ts` — various scales, pan offsets, edge cases. Pure
math, no React.

---

### [ ] Phase 5 — Drag State

**Goal:** Pin drag and marquee drag state live in the engine.

Steps:
1. Add `DragState` to engine state:
   ```ts
   type DragState =
     | { type: 'none' }
     | { type: 'pan'; startPan: Vec2; startCursor: Vec2 }
     | { type: 'pin'; colorId: string; currentSample: ColorSample }
     | { type: 'marquee'; start: Vec2; current: Vec2 }
   ```
2. Engine transitions drag state in `handleMouseDown/Move/Up` (Phase 3).
3. React overlays subscribe to `engine.getSnapshot().drag` to render visual
   feedback (drag ghost, marquee rect).
4. On drag end, engine calls `editorStore.getState().setSelectedColorIds(...)` or
   `onPinMoveEnd(...)` via callbacks registered at construction time.

**Tests:** `engine/drag.test.ts` — idle → dragging → commit / cancel transitions.

---

### [ ] Phase 6 — Overlay Components Become Pure Renderers

**Goal:** Overlay components receive props, render, and forward events. No hooks,
no internal logic.

Steps:
1. `SamplePinsOverlay.tsx` — receives `pins`, `selectedIds`, `hoveredId`,
   `dragState`, `viewport` as props. Forwards `onMouseDown`, `onClick` to engine.
2. `MarqueeSelectOverlay.tsx` — receives `marqueeRect` from engine drag state.
   Forwards mouse events to engine.
3. `SamplerOverlay.tsx` — receives `samplingState` (radius, cursor position).
   Forwards mouse events to engine.
4. A single parent hook `useCanvasOverlayProps(engine)` computes all props from
   engine state + editorStore subscriptions and passes them down.

After this phase: any behaviour change touches the engine only. Overlay components
do not change.

---

### [ ] Phase 7 — Canvas Pipeline

**Goal:** Image loading, filtering, and quantization are engine-managed.

Steps:
1. Create `engine/pipeline.ts` — wraps WASM calls currently in
   `useCanvasPipeline.ts`.
2. Engine owns `filteredCanvas` and `indexedCanvas` (attached in Phase 0).
3. Engine exposes pipeline state:
   `{ status: 'idle' | 'loading' | 'filtering' | 'ready', error: string | null }`.
4. React subscribes to pipeline state for loading indicators.
5. Delete `useCanvasPipeline.ts`.
6. WASM modules and Web Workers are untouched — engine calls them directly.

**Tests:** `engine/pipeline.test.ts` — mock WASM calls, test lifecycle transitions.

---

### [ ] Phase 8 — Context Cleanup

**Goal:** Remove or radically simplify the React contexts.

Steps:
1. `CanvasContext` — most fields now come from the engine. Reduce to just the
   engine ref, or remove entirely and use `useEngine()` directly.
2. Delete `useCanvasContextValue.ts`.
3. Keep `useCanvasMeasure.ts` — it is a thin ResizeObserver wrapper, not logic.
4. Audit `PaletteContext` and `FilterContext` for any logic that crept in. Extract
   to plain TS if found.

---

## Testing Strategy After Refactor

| Layer | Tool | Speed | What it covers |
|---|---|---|---|
| Engine units | Vitest | ~2s total | Viewport, tools, hit test, drag, pipeline |
| Hook wiring | Vitest + `renderHook` | ~5s | `useToolState`, `useViewportState` |
| Overlay rendering | Vitest + Testing Library | ~10s | Pure render output |
| Critical user flows | Playwright | minutes | Open image → pick color → export |

Playwright tests shrink dramatically — most of what they covered is now exercised
by fast unit tests without a browser.

---

## What NOT to change during this refactor

- WASM modules (`img_ops`, `img_index`, `img_blur`)
- Web Workers
- Zustand `editorStore` (selection/hover)
- Firebase / TanStack Query
- Mantine UI components
- SVG overlay rendering approach

---

## Acceptance Criteria

The refactor is complete when ALL of the following are true:

**Architecture**
- [ ] `CanvasEngine` class exists at `src/features/canvas/engine/CanvasEngine.ts`
- [ ] `CanvasEngine` owns: viewport state, tool/interaction state, input routing,
      hit testing, drag state, canvas pipeline
- [ ] No business logic exists in any `.tsx` file
- [ ] No business logic exists in any `use*` hook (hooks may only subscribe to
      engine state or call engine methods)

**Deleted files** (these must not exist)
- [ ] `useViewportTransform.ts` — deleted
- [ ] `useInteraction.ts` — deleted
- [ ] `usePinDrag.ts` — deleted
- [ ] `useMarqueeDrag.ts` — deleted
- [ ] `usePinHitTest.ts` — deleted
- [ ] `useCanvasPipeline.ts` — deleted
- [ ] `useCanvasContextValue.ts` — deleted

**Tests**
- [ ] `engine/viewport.test.ts` — exists and passes
- [ ] `engine/toolState.test.ts` — exists and passes
- [ ] `engine/input.test.ts` — exists and passes
- [ ] `engine/hitTest.test.ts` — exists and passes
- [ ] `engine/drag.test.ts` — exists and passes
- [ ] `engine/pipeline.test.ts` — exists and passes
- [ ] All Vitest unit tests pass with `npm run test`
- [ ] Playwright suite is reduced: only user-visible flows remain

**Behaviour**
- [ ] App looks and behaves identically to before the refactor
- [ ] Viewport pan and zoom work
- [ ] All three tools (select, marquee, eyedropper) work
- [ ] Pin drag works
- [ ] Marquee selection works
- [ ] Color sampling (eyedropper) works
- [ ] Image loading and filter pipeline works
- [ ] Hotkeys work
