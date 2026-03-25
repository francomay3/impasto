# EPIC-05: Throttle `SamplerOverlay` Canvas Redraw with `requestAnimationFrame`

## Summary
The sampler circle canvas is redrawn on every `mousemove` event (up to 1000Hz on high-precision mice). Move mouse position to a ref and use a `requestAnimationFrame` loop to cap redraws to the display refresh rate and remove canvas writes from the React render cycle.

**File:** `src/components/SamplerOverlay.tsx` (lines 36–57)

---

## Tickets

- [ ] **TICKET-05-A:** Move `mouseClient` from React state to a ref

  Replace the `mouseClient` `useState` with a `useRef`. Update the `mousemove` listener to write to the ref instead of calling a state setter. The component should no longer re-render on mouse movement.

  **AC:**
  - `grep -n "mouseClient" src/components/SamplerOverlay.tsx` shows the variable is declared with `useRef`, not `useState`.
  - No `setState`/setter call for mouse position remains inside the `mousemove` handler.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-05-B:** Replace `useEffect` canvas redraw with a `requestAnimationFrame` loop

  Set up a `requestAnimationFrame` loop on mount that reads the mouse position ref each frame, clears the canvas, and redraws the sampler circle. Cancel the loop on unmount.

  **AC:**
  - `grep -n "requestAnimationFrame" src/components/SamplerOverlay.tsx` returns at least one result.
  - A cleanup function calling `cancelAnimationFrame` is present.
  - The old `useEffect` depending on mouse position state is removed.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-05-C:** Write unit test for RAF loop setup and teardown

  Mock `requestAnimationFrame` and `cancelAnimationFrame`. Mount `SamplerOverlay` and assert `requestAnimationFrame` was called. Unmount and assert `cancelAnimationFrame` was called with the frame id returned by the mock.

  **AC:**
  - Test file exists at `src/components/__tests__/SamplerOverlay.raf.test.tsx`.
  - `requestAnimationFrame` spy is called on mount.
  - `cancelAnimationFrame` spy is called on unmount with the correct frame id.
  - `npx vitest run src/components/__tests__/SamplerOverlay.raf.test` exits with code 0.

- [ ] **TICKET-05-D:** Write unit test asserting no React re-render occurs on `mousemove`

  Attach a render counter via a spy. Fire a synthetic `mousemove` event and assert the component render count remains at 1.

  **AC:**
  - Same test file as TICKET-05-C, separate test case.
  - Render count stays at 1 after `mousemove` is fired.
  - `npx vitest run src/components/__tests__/SamplerOverlay.raf.test` exits with code 0.
