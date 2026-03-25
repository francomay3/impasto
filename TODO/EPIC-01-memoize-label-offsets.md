# EPIC-01: Memoize `resolveLabelOffsets` in `SamplePinsOverlay`

## Summary
`resolveLabelOffsets` runs an O(n²) collision resolution loop on every render. During pan/zoom this fires dozens of times per second even though pin positions haven't changed. Wrap it in `useMemo` so it only recomputes when pins actually change.

**File:** `src/components/SamplePinsOverlay.tsx`

---

## Tickets

- [ ] **TICKET-01-A:** Wrap `resolveLabelOffsets` call in `useMemo`

  Wrap the `resolveLabelOffsets(...)` call inside `SamplePinsOverlay` with `useMemo`, keyed on the filtered pin array (ids + positions) and viewport scale — not the full transform object.

  **AC:**
  - `grep -n "useMemo" src/components/SamplePinsOverlay.tsx` returns at least one result wrapping `resolveLabelOffsets`.
  - The dependency array does not include the full viewport transform object.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-01-B:** Write unit test asserting `resolveLabelOffsets` is not re-called when pins are unchanged

  Mock `resolveLabelOffsets`. Render the component, trigger a re-render by changing something outside the memo dependencies (e.g. a viewport translate delta), and assert the mock was called exactly once total.

  **AC:**
  - Test file exists at `src/components/__tests__/SamplePinsOverlay.memoization.test.tsx`.
  - `resolveLabelOffsets` mock call count is 1 after two renders with identical pin arrays.
  - `npx vitest run src/components/__tests__/SamplePinsOverlay.memoization.test` exits with code 0.

- [ ] **TICKET-01-C:** Write unit test asserting `resolveLabelOffsets` IS re-called when pins change

  After the memoization, verify the function is invoked again when pin positions actually change. Guards against over-memoization that would freeze pin layout.

  **AC:**
  - Same test file as TICKET-01-B, separate test case.
  - Mock call count increments to 2 after a pin position change.
  - `npx vitest run src/components/__tests__/SamplePinsOverlay.memoization.test` exits with code 0.
