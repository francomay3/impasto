# EPIC-10: Cache `sampleCircleAverage` Results per Pin

## Summary
`deriveAndRender()` calls `sampleCircleAverage()` for every pin on every filter change — a double-nested pixel loop. Cache the result per pin keyed on `(x, y, radius, imageDataVersion)` so recomputation only happens when the image actually changes, not on every re-render.

**File:** `src/hooks/useImageHandlers.ts` (lines 46–52)

---

## Tickets

- [ ] **TICKET-10-A:** Add an `imageDataVersion` counter

  Introduce a version number that increments each time the `ImageData` is updated (new image loaded or filter result written). Store it alongside the image data in the relevant context or ref.

  **AC:**
  - `grep -rn "imageDataVersion\|imageVersion" src/` returns a result where the value is incremented on image update.
  - The version is accessible inside `useImageHandlers`.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-10-B:** Extract cache key logic into a pure utility function

  Create `src/utils/sampleCircleCache.ts` with a `buildCacheKey(x, y, radius, version): string` function. This keeps the key format testable in isolation.

  **AC:**
  - File exists at `src/utils/sampleCircleCache.ts`.
  - Function is pure (no side effects, no imports of global state).
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-10-C:** Build a `Map`-based cache in `useImageHandlers`

  Use `buildCacheKey` to index a `Map`. Before calling `sampleCircleAverage`, check the cache. On hit, return the cached value. On miss, compute and store. Clear the cache when `imageDataVersion` increments.

  **AC:**
  - `grep -n "sampleCircleCache\|Map\b" src/hooks/useImageHandlers.ts` returns results.
  - `sampleCircleAverage` is not called when a cache hit exists (verified via test in TICKET-10-D).
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-10-D:** Write unit tests for cache hit, miss, and invalidation

  Test three scenarios independently:
  1. Same key twice → `sampleCircleAverage` called once.
  2. Different key → `sampleCircleAverage` called again.
  3. Same key but version bumped → `sampleCircleAverage` called again.

  **AC:**
  - Test file exists at `src/utils/__tests__/sampleCircleCache.test.ts`.
  - All three scenarios have dedicated test cases that pass.
  - `npx vitest run src/utils/__tests__/sampleCircleCache.test` exits with code 0.
