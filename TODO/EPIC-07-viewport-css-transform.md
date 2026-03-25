# EPIC-07: Move Viewport Pan/Zoom Off React State — Use CSS Transform

## Summary
Every pixel of canvas drag calls `setTransform(...)`, triggering a React re-render that ripples through all context consumers. During active drag, accumulate the delta in a ref and apply it directly via `el.style.transform` without touching React state. Only commit the final transform to state on `mouseup`.

**File:** `src/hooks/useViewportTransform.ts`

---

## Tickets

- [ ] **TICKET-07-A:** Audit all consumers of `viewportTransform` from context

  Grep the codebase and list which consumers need the committed (post-drag) value vs. those that only observe the live canvas transform. Document findings in a comment at the top of this epic file.

  **AC:**
  - `grep -rn "viewportTransform" src/` runs without error and lists all usages.
  - A comment is added to this file under `## Consumer Audit` listing each consumer and its category (live vs. committed).

- [ ] **TICKET-07-B:** Add a canvas wrapper ref and apply CSS transform during drag without calling `setTransform`

  During `mousemove` while dragging, write the new transform directly to `canvasWrapperRef.current.style.transform`. Do not call `setTransform`.

  **AC:**
  - `grep -n "style.transform" src/hooks/useViewportTransform.ts` (or the relevant component) returns a result inside the drag-move handler.
  - `grep -n "setTransform" src/hooks/useViewportTransform.ts` does NOT return a result inside the move handler (only in mouseup).
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-07-C:** Commit transform to React state only on `mouseup`

  On `mouseup`, read the accumulated transform from the ref and call `setTransform` exactly once.

  **AC:**
  - `grep -n "setTransform" src/hooks/useViewportTransform.ts` returns a result only in the mouseup/drag-end path.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-07-D:** Write unit test asserting `setTransform` is called exactly once per drag gesture

  Simulate a full drag: `mousedown` → 10× `mousemove` → `mouseup`. Assert `setTransform` was called exactly 1 time.

  **AC:**
  - Test file exists at `src/hooks/__tests__/useViewportTransform.deferredState.test.ts`.
  - `setTransform` spy call count equals 1 after the full gesture.
  - `npx vitest run src/hooks/__tests__/useViewportTransform.deferredState.test` exits with code 0.

- [ ] **TICKET-07-E:** Write unit test asserting `style.transform` is updated during drag before `setTransform` is called

  After `mousedown` + one `mousemove`, assert the canvas wrapper element's `style.transform` has been updated AND `setTransform` has not yet been called.

  **AC:**
  - Same test file as TICKET-07-D, separate test case.
  - `setTransform` call count is 0 mid-drag; `element.style.transform` is non-empty.
  - `npx vitest run src/hooks/__tests__/useViewportTransform.deferredState.test` exits with code 0.
