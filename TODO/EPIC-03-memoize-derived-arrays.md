# EPIC-03: Memoize Derived Arrays in `PaletteSidebar` and `SamplePinsOverlay`

## Summary
Both `PaletteSidebar` and `SamplePinsOverlay` run `palette.filter(...)` and `groups.find(...)` on every render. `PaletteSidebar` has an O(n×m) nested filter+find. Wrap these in `useMemo` with correct dependency arrays.

**Files:**
- `src/components/PaletteSidebar/PaletteSidebar.tsx` (line ~40)
- `src/components/SamplePinsOverlay.tsx` (line ~40)

---

## Tickets

- [ ] **TICKET-03-A:** Memoize filtered palette in `PaletteSidebar`

  Wrap all `.filter(...)` and `.find(...)` calls in the component body with `useMemo`, using `[palette, groups]` as dependencies.

  **AC:**
  - `grep -n "useMemo" src/components/PaletteSidebar/PaletteSidebar.tsx` returns at least one result.
  - No bare `.filter(` or `.find(` calls remain outside a `useMemo` in the component body (verify with a grep that returns 0 results).
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-03-B:** Memoize filtered arrays in `SamplePinsOverlay`

  Wrap all derived array expressions in `SamplePinsOverlay.tsx` with `useMemo`.

  **AC:**
  - `grep -n "useMemo" src/components/SamplePinsOverlay.tsx` returns at least one result per derived array.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-03-C:** Write unit test asserting derived array reference is stable when inputs haven't changed

  Render `PaletteSidebar`, force a parent re-render with unchanged `palette` and `groups`, and assert the derived array reference inside the component is the same object (use `Object.is` via a spy or expose via a test hook).

  **AC:**
  - Test file exists at `src/components/PaletteSidebar/__tests__/PaletteSidebar.memoization.test.tsx`.
  - Test asserts the derived array is referentially stable across re-renders with identical inputs.
  - `npx vitest run src/components/PaletteSidebar/__tests__/PaletteSidebar.memoization.test` exits with code 0.

- [ ] **TICKET-03-D:** Write unit test asserting derived array updates when inputs change

  Verify the memoized array is recomputed when `palette` or `groups` changes.

  **AC:**
  - Same test file as TICKET-03-C, separate test case.
  - Reference changes after an input mutation.
  - `npx vitest run src/components/PaletteSidebar/__tests__/PaletteSidebar.memoization.test` exits with code 0.
