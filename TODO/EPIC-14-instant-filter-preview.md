# EPIC-14: Instant Filter Preview via WASM + OffscreenCanvas Pipeline

## Summary
Remove the 300ms debounce entirely. The filter worker holds an `OffscreenCanvas` with the original image loaded once. On every slider change it receives only the new filter params, processes pixels via WASM in-place, and posts the resulting `ImageBitmap` back to the main thread for zero-copy display.

**Depends on:** EPIC-09 (filter worker), EPIC-13 (WASM pixel ops)

---

## Tickets

- [ ] **TICKET-14-A:** Update filter worker to accept an `init` message that stores the source image

  Add a two-message protocol to `filterPipeline.worker.ts`:
  - `{ type: 'init', bitmap: ImageBitmap }` — store on an internal `OffscreenCanvas`
  - `{ type: 'applyFilters', filters: FilterConfig }` — process from stored image and respond

  **AC:**
  - `grep -n "'init'\|'applyFilters'" src/workers/filterPipeline.worker.ts` returns results for both message types.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-14-B:** Apply WASM filters on `OffscreenCanvas` pixel data and return `ImageBitmap`

  In the `applyFilters` handler: call WASM filter functions on the `OffscreenCanvas` pixel buffer, then call `transferToImageBitmap()` to produce a zero-copy result.

  **AC:**
  - `grep -n "transferToImageBitmap" src/workers/filterPipeline.worker.ts` returns a result.
  - `grep -n "wasm\|wasmFilter" src/workers/filterPipeline.worker.ts` returns results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-14-C:** Remove the 300ms debounce from `useCanvasPipeline`

  Wire filter state changes to dispatch a worker message immediately without debouncing.

  **AC:**
  - `grep -n "300\|debounce" src/hooks/useCanvasPipeline.ts` returns no results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-14-D:** Draw received `ImageBitmap` to the visible canvas and release it

  On the main thread, `ctx.drawImage(bitmap, 0, 0)` the result, then call `bitmap.close()`.

  **AC:**
  - `grep -n "drawImage\|bitmap\.close\(\)" src/hooks/useCanvasPipeline.ts` (or equivalent) returns results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-14-E:** Write integration test for the full two-message worker protocol

  Using a Worker test environment or mock, send an `init` message, then an `applyFilters` message, and assert the response is an `ImageBitmap` with the correct dimensions.

  **AC:**
  - Test file exists at `src/workers/__tests__/filterPipeline.worker.test.ts`.
  - Response type is `ImageBitmap` and dimensions match the initialized image.
  - `npx vitest run src/workers/__tests__/filterPipeline.worker.test` exits with code 0.

- [ ] **TICKET-14-F:** Write unit test asserting `bitmap.close()` is called after drawing

  Spy on `ImageBitmap.prototype.close`. After a filter response is received and drawn, assert `close` was called exactly once per response.

  **AC:**
  - Same test file as TICKET-14-E, separate test case.
  - `close` spy call count equals 1 per resolved response.
  - `npx vitest run src/workers/__tests__/filterPipeline.worker.test` exits with code 0.
