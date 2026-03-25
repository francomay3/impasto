# EPIC-11: Cache and Reuse Temporary Canvases in `blurImageData`

## Summary
`blurImageData` creates two new `<canvas>` elements and 2D contexts on every call. Canvas allocation involves GPU resource allocation. Replace with module-level refs that are lazily initialized and resized only when dimensions change.

**File:** `src/utils/imageProcessing.ts` (lines 40–53)

---

## Tickets

- [ ] **TICKET-11-A:** Extract `blurImageData` into its own module

  Move `blurImageData` (and any private helpers it uses) from `imageProcessing.ts` into a new file `src/utils/blurImageData.ts`. Update the import in `imageProcessing.ts` or callers directly.

  **AC:**
  - File exists at `src/utils/blurImageData.ts`.
  - `grep -n "blurImageData" src/utils/imageProcessing.ts` returns an import or re-export, not the implementation.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-11-B:** Add module-level canvas refs with lazy init and resize-only-on-change logic

  Declare `let _canvas1: HTMLCanvasElement | null = null` at module level. Inside `blurImageData`, initialize on first call. On subsequent calls with the same dimensions, reuse. On dimension change, update `width`/`height` (do not create a new element).

  **AC:**
  - `grep -n "_canvas1\|_canvas2" src/utils/blurImageData.ts` returns the module-level declarations.
  - `document.createElement` is not called on every invocation (verified via test in TICKET-11-C).
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-11-C:** Write unit test asserting `document.createElement` is called at most twice across multiple calls with same dimensions

  Spy on `document.createElement`. Call `blurImageData` three times with identical dimensions. Assert spy call count ≤ 2 (one per canvas slot, allocated once).

  **AC:**
  - Test file exists at `src/utils/__tests__/blurImageData.test.ts`.
  - `createElement` spy call count is ≤ 2 across 3 identical calls.
  - `npx vitest run src/utils/__tests__/blurImageData.test` exits with code 0.

- [ ] **TICKET-11-D:** Write unit test asserting canvas is resized (not re-created) on dimension change

  Call with 100×100, then 200×200. Assert `createElement` was not called again and the canvas `width`/`height` properties reflect the new dimensions.

  **AC:**
  - Same test file as TICKET-11-C, separate test case.
  - `createElement` spy count is still ≤ 2 after both calls combined.
  - Canvas `width` and `height` equal 200 after the second call.
  - `npx vitest run src/utils/__tests__/blurImageData.test` exits with code 0.
