# Performance & Architecture TODO

Ordered by priority. Each item includes what to do, why it matters, and where to find the relevant code.

---

## Immediate Wins (Low Risk, High Impact)

### 1. Memoize `resolveLabelOffsets` in `SamplePinsOverlay` — [EPIC-01](EPIC-01-memoize-label-offsets.md)
**File:** `src/components/SamplePinsOverlay.tsx`
**Why it's slow:** `resolveLabelOffsets` runs an O(n²) collision resolution loop with up to 30 iterations on every render. `SamplePinsOverlay` re-renders on every viewport transform change (pan, zoom), so during a drag this fires dozens of times per second for no reason — the pin positions haven't moved relative to the image.
**Fix:** Wrap the call in `useMemo`, keyed on the pin array (positions + ids) and the viewport scale. Recompute only when pins actually change, not on every pan frame.

---

### 2. Memoize context provider value objects — [EPIC-02](EPIC-02-memoize-context-providers.md)
**Files:** `src/context/CanvasContext.tsx`, `src/context/PaletteContext.tsx`, `src/context/FilterContext.tsx`, `src/context/EditorContext.tsx`
**Why it's slow:** Every context provider recreates its value object on every render of the parent component (`Editor.tsx`). React compares context values by reference — a new object always triggers re-renders in all consumers, even if the data inside is identical.
**Fix:** Wrap every provider's `value={...}` object in `useMemo`, and every callback in `useCallback`. This is especially important for `CanvasContext` since it updates continuously during drag.

---

### 3. Add `useMemo` to derived arrays in `PaletteSidebar` and `SamplePinsOverlay` — [EPIC-03](EPIC-03-memoize-derived-arrays.md)
**Files:** `src/components/PaletteSidebar/PaletteSidebar.tsx:40`, `src/components/SamplePinsOverlay.tsx:40`
**Why it's slow:** Both files run `palette.filter(...)` and `groups.find(...)` on every render. PaletteSidebar has an O(n×m) nested filter+find that runs whenever any context value changes.
**Fix:** Wrap in `useMemo` with `[palette, groups]` as dependencies.

---

### 4. Add `will-change: transform` to canvas wrapper — [EPIC-04](EPIC-04-will-change-transform.md)
**File:** `src/components/CanvasViewport.tsx`
**Why it helps:** This CSS property tells the browser compositor to promote the element to its own GPU layer before any animation starts. Without it, pan/zoom triggers a repaint on the main thread. With it, the GPU compositor handles transformations independently.
**Fix:** Add `style={{ willChange: 'transform' }}` to the outermost wrapper of the canvas element. Also verify all wheel listeners that don't call `preventDefault` are marked `{ passive: true }`.

---

## Critical Fixes (High Impact, Moderate Effort)

### 5. Throttle `SamplerOverlay` canvas redraw with `requestAnimationFrame` — [EPIC-05](EPIC-05-raf-sampler-overlay.md)
**File:** `src/components/SamplerOverlay.tsx:36-57`
**Why it's slow:** The `useEffect` that redraws the sampler circle depends on `mouseClient`, which updates on every single `mousemove` event. The browser fires `mousemove` at up to 1000Hz on high-precision mice — you're doing canvas `clearRect` + arc draw up to 1000 times per second.
**Fix:** Store mouse position in a ref instead of state. Use a `requestAnimationFrame` loop that reads the ref and redraws — this caps the redraw rate to the display's refresh rate (60–120fps) and moves the canvas write out of the React render cycle entirely.

---

### 6. Throttle palette DnD `handleDragOver` with `requestAnimationFrame` — [EPIC-06](EPIC-06-raf-palette-dnd.md)
**File:** `src/components/PaletteSidebar/usePaletteDnd.ts:56-75`
**Why it's slow:** `handleDragOver` fires on every pixel of mouse movement during a palette drag. Each call runs 5 O(n) array operations (`find`, `find`, `filter`, `findIndex`, `splice`) and calls `setDragPalette`, which triggers a full re-render of the palette sidebar. This can fire 30–60 times per second.
**Fix:** Use a ref to schedule a single `requestAnimationFrame` callback. If one is already scheduled, skip the update. This reduces redraws from ~60/s to the exact frame rate with no perceived difference in drag smoothness.

```ts
const rafRef = useRef<number | null>(null);
// in handleDragOver:
if (rafRef.current) return;
rafRef.current = requestAnimationFrame(() => {
  setDragPalette(...);
  rafRef.current = null;
});
```

---

### 7. Move viewport pan/zoom off React state — use CSS transform — [EPIC-07](EPIC-07-viewport-css-transform.md)
**File:** `src/hooks/useViewportTransform.ts`
**Why it's slow:** Every pixel of canvas drag calls `setTransform(...)`, which triggers a React re-render. `SamplePinsOverlay` and `CanvasViewport` both consume `viewportTransform` from context, so they both re-render on every frame. The label layout algo runs again. Popovers recalculate. This is the primary cause of drag lag.
**Fix (short-term):** During active drag, accumulate the transform delta in a ref. Apply it directly as a CSS `transform` on the canvas wrapper via a ref (`el.style.transform = ...`) without touching React state. Only commit the final transform to state on `mouseup`. Pins stay in sync because they transform with the same CSS matrix.
**Fix (long-term):** See PixiJS item below — move the entire viewport to a canvas-based renderer where transform is a GPU operation.

---

### 8. Fix `SamplePinsOverlay` `useLayoutEffect` depending on `viewportTransform` — [EPIC-08](EPIC-08-fix-layout-effect-deps.md)
**File:** `src/components/SamplePinsOverlay.tsx:24-36`
**Why it's slow:** The `useLayoutEffect` that sets up the `ResizeObserver` lists `viewportTransform` as a dependency. This means the observer is torn down and recreated on every zoom/pan frame. `ResizeObserver` setup is not free — it involves DOM queries and observer registration.
**Fix:** The ResizeObserver only needs to re-attach if the `filteredCanvasRef` changes (i.e. the canvas element is replaced). Remove `viewportTransform` from the dependency array. Read transform values inside the callback using a ref instead.

---

## Architecture (Medium Effort, Future-Proofing)

### 9. Move filter pipeline to an `OffscreenCanvas` Web Worker — [EPIC-09](EPIC-09-offscreen-canvas-worker.md)
**Files:** `src/hooks/useCanvasPipeline.ts:43-52`, `src/utils/imageProcessing.ts`
**Why it's slow:** `applyFilterPipeline` runs brightness/contrast, hue/saturation, levels, and blur sequentially on the main thread. Each is a full pixel loop. For a 2000×2000 image that's 4M+ iterations blocking the UI thread — the cursor stutters, transitions lag, and the browser may drop frames.
**Fix:** Create a second worker (alongside the existing `indexedRenderer.worker.ts`) that accepts an `ImageData` + filter config, processes all filters off-thread, and posts the result back. Use `OffscreenCanvas` to avoid copying the ImageData buffer — transfer it directly with `Transferable` ownership. The indexed renderer worker already demonstrates the pattern.
**Result:** Filter changes will process in the background with no UI jank. You can also drop the 300ms debounce or tighten it significantly.

---

### 10. Throttle `sampleCircleAverage` calls during palette sync — [EPIC-10](EPIC-10-cache-sample-circle.md)
**File:** `src/hooks/useImageHandlers.ts:46-52`
**Why it's slow:** `deriveAndRender()` maps over the full palette and calls `sampleCircleAverage()` for every sampled color on every filter change. `sampleCircleAverage` is a double-nested pixel loop covering a circle of `radius²×π` pixels. With 10 pins and radius 20, that's 10 × ~1257 = 12,570 pixel reads per filter update.
**Fix (short-term):** Cache the last result per pin keyed on `(x, y, radius, imageDataVersion)`. Only recompute when the image actually changed, not just when React re-ran the effect.
**Fix (long-term):** Move this computation into the filter pipeline worker so it runs off-thread alongside filter processing.

---

### 11. Cache and reuse temporary canvases in `blurImageData` — [EPIC-11](EPIC-11-reuse-temp-canvases.md)
**File:** `src/utils/imageProcessing.ts:40-53`
**Why it's slow:** `blurImageData` creates two new `<canvas>` elements and their 2D contexts on every single call. Canvas element allocation involves browser-side GPU resource allocation — it's not free like a plain object.
**Fix:** Module-level canvas refs that are lazily initialized and resized only when dimensions change. On repeated calls with the same dimensions, reuse them.

---

## Future Architecture (High Effort, Long-Term Payoff)

### 12. PixiJS for the viewport canvas — [EPIC-12](EPIC-12-pixijs-viewport.md)
**Why:** As the app grows with more overlays, effects, and interactive elements on the canvas, a DOM+CSS approach hits a ceiling. PixiJS uses WebGL/WebGPU under the hood — pan/zoom becomes a matrix multiply on the GPU, the sampler circle is a WebGL shader, and pin overlays are GPU sprites. The main thread is freed from all rendering work.
**What changes:** Replace `<canvas>` + absolute-positioned pin divs with a Pixi `Application`. The canvas image becomes a `Sprite`. Pins become `Container`s with `Graphics` circles and `Text` labels. The sampler becomes a `Graphics` circle drawn each frame.
**Benefit:** Completely eliminates drag lag. Pan/zoom runs at native refresh rate with zero JS per frame. Opens the door to real-time filter previews via GLSL shaders, a gradient mesh editor, color grading LUTs, and more.

---

### 13. WebAssembly for image processing (k-means + pixel ops) — [EPIC-13](EPIC-13-wasm-image-processing.md)
**Why:** JavaScript is single-threaded and not designed for tight numeric loops. WASM (compiled from Rust or C++) runs at near-native speed and can be called from a worker thread. Key targets:
- **k-means quantization** (`src/utils/kMeansWrapper.ts`): Currently uses `ml-kmeans` (JS). A Rust WASM implementation is typically 10–50× faster and would make quantization feel instant even on large images.
- **Per-pixel filter loops** (`src/utils/imageProcessing.ts`): Brightness, contrast, hue, levels — all tight loops that WASM executes with SIMD instructions browsers don't expose to JS.
- **`sampleCircleAverage`**: The double-loop pixel sampling becomes a single WASM call.
**Approach:** Write the hot path in Rust, compile to WASM with `wasm-pack`, call from the filter worker. The JS side just passes `ImageData` buffers and receives results.

---

### 14. Instant filter preview via WASM + OffscreenCanvas pipeline — [EPIC-14](EPIC-14-instant-filter-preview.md)
**Goal:** Filter sliders update the canvas in real-time with zero debounce — no 300ms delay.
**How it works together:**
1. Filter worker holds an `OffscreenCanvas` with the original image loaded once.
2. On every slider change, the worker receives new filter params (a tiny JSON message).
3. WASM processes the pixels in-place on the `OffscreenCanvas` bitmap.
4. Worker posts the resulting `ImageBitmap` back to main thread.
5. Main thread draws it to the visible canvas with `drawImage`.
**Why this is fast:** WASM pixel loops + no main-thread blocking + `ImageBitmap` transfer is zero-copy. A 2MP image at 60fps is feasible on modern hardware.

---

### 15. SharedArrayBuffer for zero-copy worker communication — [EPIC-15](EPIC-15-shared-array-buffer.md)
**Why:** Currently, `ImageData` is copied when posted to workers (`postMessage` with no transfer). For a 4K image that's 33MB of data copied on every filter update.
**Fix:** Use `SharedArrayBuffer` to share the pixel buffer between main thread and worker — no copy at all. Requires setting `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers on the server.
**Impact:** Eliminates the largest GC pressure source in the app. Especially important when filter preview runs at 60fps.

---

### 16. WebGPU compute shaders for filter chains (future) — [EPIC-16](EPIC-16-webgpu-compute-shaders.md)
**Why:** Even WASM is single-threaded per core. A WebGPU compute shader runs the filter pipeline in parallel across thousands of GPU cores simultaneously. A 4K image processed in a WASM loop: ~40ms. The same pipeline as a WebGPU shader: <1ms.
**Scope:** This is a 2–3 year horizon for broad browser support, but worth designing toward. Structuring filter operations as stateless transforms (input buffer → output buffer, no side effects) makes them directly mappable to compute shader dispatch groups.

---

## Debugging Guide

### How to find what's draining resources

**Chrome DevTools — Performance tab**
Record while dragging or interacting. Look for:
- Long yellow bars = JavaScript execution time
- Red triangles in the top bar = dropped frames
- Purple bars = layout/style recalculation
- Green bars = painting
The flame chart shows the exact call stack. Click any bar to see what function caused it and from where.

**React DevTools — Profiler tab**
Install the React DevTools browser extension. Under the Profiler tab, hit record, interact with the app, then stop. You'll see a bar chart of every component render, how long it took, and (if you enable "Record why each component rendered") exactly which prop or state change triggered it. This is the most direct way to find unnecessary re-renders.

**Chrome Rendering panel**
Open DevTools → More Tools → Rendering. Enable:
- **Paint flashing**: Green rectangles flash wherever the browser is repainting. You want to see this only when something visibly changes — if the whole screen flashes green on every mousemove, you have a repaint problem.
- **FPS meter**: Shows real-time frame rate and GPU memory usage in the corner.
- **Layer borders**: Shows orange borders around GPU-composited layers. Helps verify `will-change: transform` is working.

**Manual instrumentation**
```ts
// Count renders in a suspect component:
const renderCount = useRef(0);
console.count('SamplePinsOverlay render');

// Time an expensive function:
performance.mark('labelLayout:start');
resolveLabelOffsets(pins);
performance.mark('labelLayout:end');
performance.measure('labelLayout', 'labelLayout:start', 'labelLayout:end');
// Then read in DevTools Performance → Timings
```

**Memory leaks**
Chrome DevTools → Memory tab → Take Heap Snapshot. Take one before and after a repeated interaction. Sort by "Delta" to see what's accumulating. Common culprits: event listeners not cleaned up, closures holding refs to large ImageData objects.
