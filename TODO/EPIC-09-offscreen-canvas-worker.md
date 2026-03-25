# EPIC-09: Move Filter Pipeline to an `OffscreenCanvas` Web Worker

## Summary
`applyFilterPipeline` runs all filters synchronously on the main thread, blocking the UI for large images. Create a dedicated worker that accepts `ImageData` + filter config, processes off-thread, and posts the result back via `Transferable` ownership.

**Files:**
- `src/hooks/useCanvasPipeline.ts` (lines 43–52)
- `src/utils/imageProcessing.ts`

---

## Tickets

- [ ] **TICKET-09-A:** Create `filterPipeline.worker.ts`

  Create `src/workers/filterPipeline.worker.ts`. It accepts `{ type: 'applyFilters', imageData: ImageData, filters: FilterConfig }`, runs `applyFilterPipeline`, and posts the result back using the transferable pattern: `postMessage(result, [result.data.buffer])`.

  **AC:**
  - File exists at `src/workers/filterPipeline.worker.ts`.
  - `grep -n "postMessage\|onmessage" src/workers/filterPipeline.worker.ts` returns results.
  - The `postMessage` call uses the transferable array.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-09-B:** Create `useFilterWorker` hook

  Create `src/hooks/useFilterWorker.ts` that instantiates the worker, exposes `processFilters(imageData, filters): Promise<ImageData>`, and terminates the worker on unmount.

  **AC:**
  - File exists at `src/hooks/useFilterWorker.ts`.
  - `grep -n "Worker\|terminate" src/hooks/useFilterWorker.ts` returns results.
  - The exposed function is wrapped in `useCallback`.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-09-C:** Replace synchronous `applyFilterPipeline` in `useCanvasPipeline` with the worker call

  Swap the synchronous call for an async `processFilters(...)` call. Update canvas after the promise resolves.

  **AC:**
  - `grep -n "processFilters\|filterWorker" src/hooks/useCanvasPipeline.ts` returns results.
  - `grep -n "applyFilterPipeline" src/hooks/useCanvasPipeline.ts` returns 0 results (no longer called directly on main thread).
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-09-D:** Reduce or remove the 300ms debounce on filter changes

  Now that processing is off-thread, lower the debounce to ≤50ms or remove it.

  **AC:**
  - `grep -n "300\|debounce" src/hooks/useCanvasPipeline.ts` returns no result with value `300`, or shows a value ≤50.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-09-E:** Write unit test for `useFilterWorker` hook

  Mock the Worker constructor and `postMessage`. Call `processFilters` and simulate the worker response via `onmessage`. Assert the promise resolves with the expected `ImageData`.

  **AC:**
  - Test file exists at `src/hooks/__tests__/useFilterWorker.test.ts`.
  - Promise resolves with the mocked response data.
  - `npx vitest run src/hooks/__tests__/useFilterWorker.test` exits with code 0.

- [ ] **TICKET-09-F:** Write unit test asserting worker is terminated on hook unmount

  Mount the hook, unmount it, and assert `worker.terminate` was called.

  **AC:**
  - Same test file as TICKET-09-E, separate test case.
  - `terminate` spy call count equals 1 after unmount.
  - `npx vitest run src/hooks/__tests__/useFilterWorker.test` exits with code 0.
