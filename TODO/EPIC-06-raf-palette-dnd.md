# EPIC-06: Throttle Palette DnD `handleDragOver` with `requestAnimationFrame`

## Summary
`handleDragOver` fires on every pixel of mouse movement, running 5 O(n) array operations and triggering a full palette sidebar re-render up to 60 times per second. Throttle with a RAF guard so at most one state update is scheduled per frame.

**File:** `src/components/PaletteSidebar/usePaletteDnd.ts` (lines 56–75)

---

## Tickets

- [ ] **TICKET-06-A:** Add RAF guard ref to `usePaletteDnd`

  Add `rafRef = useRef<number | null>(null)`. At the top of `handleDragOver`, if `rafRef.current !== null`, return early. Otherwise, schedule the state update logic inside `requestAnimationFrame` and set `rafRef.current = null` on completion.

  **AC:**
  - `grep -n "requestAnimationFrame\|rafRef" src/components/PaletteSidebar/usePaletteDnd.ts` returns results.
  - An early-return guard exists when a frame is already pending.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-06-B:** Cancel pending RAF on drag end

  In the drag-end handler, call `cancelAnimationFrame(rafRef.current)` and reset the ref to `null`.

  **AC:**
  - `grep -n "cancelAnimationFrame" src/components/PaletteSidebar/usePaletteDnd.ts` returns a result in the drag-end handler.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-06-C:** Write unit test asserting state setter is called at most once per frame for multiple `handleDragOver` calls

  Mock `requestAnimationFrame` to capture the callback without executing it. Call `handleDragOver` 10 times synchronously. Assert the state setter has not been called yet (frame hasn't fired). Invoke the captured callback once. Assert the setter was called exactly once.

  **AC:**
  - Test file exists at `src/components/PaletteSidebar/__tests__/usePaletteDnd.raf.test.ts`.
  - State setter call count is 0 before the RAF callback fires and 1 after.
  - `npx vitest run src/components/PaletteSidebar/__tests__/usePaletteDnd.raf.test` exits with code 0.

- [ ] **TICKET-06-D:** Write unit test asserting no stale update fires after drag end

  Start a drag, schedule a pending RAF (by calling `handleDragOver` once), then call `handleDragEnd` before the frame fires. Assert that when the RAF tick is manually flushed, the state setter is NOT called.

  **AC:**
  - Same test file as TICKET-06-C, separate test case.
  - State setter call count remains 0 after `handleDragEnd` + manual RAF flush.
  - `npx vitest run src/components/PaletteSidebar/__tests__/usePaletteDnd.raf.test` exits with code 0.
