# EPIC-08: Fix `SamplePinsOverlay` `useLayoutEffect` Dependency on `viewportTransform`

## Summary
The `useLayoutEffect` that sets up the `ResizeObserver` lists `viewportTransform` as a dependency, causing the observer to be torn down and recreated on every zoom/pan frame. The observer only needs to re-attach when the canvas element changes. Remove `viewportTransform` from the deps array and read it via a ref inside the callback.

**File:** `src/components/SamplePinsOverlay.tsx` (lines 24–36)

---

## Tickets

- [ ] **TICKET-08-A:** Extract `viewportTransform` into a ref inside `SamplePinsOverlay`

  Create `viewportTransformRef = useRef(viewportTransform)` and keep it current with a `useEffect(() => { viewportTransformRef.current = viewportTransform; }, [viewportTransform])`.

  **AC:**
  - `grep -n "viewportTransformRef\|useRef" src/components/SamplePinsOverlay.tsx` returns results.
  - The sync effect pattern is present.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-08-B:** Remove `viewportTransform` from the `useLayoutEffect` dependency array

  Update the dep array to only include the canvas element ref. Replace direct `viewportTransform` reads in the callback with `viewportTransformRef.current`.

  **AC:**
  - `grep -n "useLayoutEffect" src/components/SamplePinsOverlay.tsx` shows a dependency array that does NOT contain `viewportTransform`.
  - `npx tsc --noEmit` exits with code 0.
  - `npx eslint src/components/SamplePinsOverlay.tsx --rule '{"react-hooks/exhaustive-deps": "error"}'` exits with code 0 (no exhaustive-deps violations).

- [ ] **TICKET-08-C:** Write test asserting `ResizeObserver` is constructed exactly once regardless of how many transform changes occur

  Mock the global `ResizeObserver` and track constructor call count. Mount `SamplePinsOverlay`, trigger 5 `viewportTransform` prop changes via context, and assert `ResizeObserver` was constructed exactly once.

  **AC:**
  - Test file exists at `src/components/__tests__/SamplePinsOverlay.resizeObserver.test.tsx`.
  - `ResizeObserver` constructor spy call count equals 1 after 5 transform changes.
  - `npx vitest run src/components/__tests__/SamplePinsOverlay.resizeObserver.test` exits with code 0.
