# EPIC-04: Add `will-change: transform` to Canvas Wrapper

## Summary
Without `will-change: transform`, pan/zoom triggers a repaint on the main thread. This CSS property tells the browser compositor to promote the element to its own GPU layer ahead of time. Also verify wheel event listeners are marked `passive: true` where `preventDefault` is not needed.

**File:** `src/components/CanvasViewport.tsx`

---

## Tickets

- [ ] **TICKET-04-A:** Add `will-change: transform` to the canvas wrapper element

  Locate the outermost wrapper of the canvas element in `CanvasViewport.tsx` and add `style={{ willChange: 'transform' }}`.

  **AC:**
  - `grep -n "willChange" src/components/CanvasViewport.tsx` returns a result with value `'transform'`.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-04-B:** Audit and mark passive wheel listeners

  Search for `addEventListener('wheel'` and `onWheel` usages. For any listener that does not call `event.preventDefault()`, register it with `{ passive: true }`.

  **AC:**
  - `grep -rn "addEventListener.*wheel" src/` lists all wheel listeners.
  - Each listener not calling `preventDefault` has `{ passive: true }` — verified by grep showing `passive.*true` adjacent to each such listener.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-04-C:** Write a rendering test asserting the canvas wrapper has the `will-change` style

  Render `CanvasViewport` in a jsdom test environment and assert `element.style.willChange === 'transform'`.

  **AC:**
  - Test file exists at `src/components/__tests__/CanvasViewport.styles.test.tsx`.
  - Assertion checks `willChange` on the wrapper element.
  - `npx vitest run src/components/__tests__/CanvasViewport.styles.test` exits with code 0.
