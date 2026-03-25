# EPIC-02: Memoize Context Provider Value Objects

## Summary
Every context provider recreates its value object on every render of `Editor.tsx`. React compares context values by reference — a new object always triggers re-renders in all consumers even if the data inside hasn't changed. Wrap every provider's `value={...}` in `useMemo` and every callback in `useCallback`.

**Files:**
- `src/context/CanvasContext.tsx`
- `src/context/PaletteContext.tsx`
- `src/context/FilterContext.tsx`
- `src/context/EditorContext.tsx`

---

## Tickets

- [ ] **TICKET-02-A:** Memoize `CanvasContext` provider value and callbacks

  Wrap the `value` object in `useMemo` and all callbacks in `useCallback`.

  **AC:**
  - `grep -n "useMemo\|useCallback" src/context/CanvasContext.tsx` returns results covering the provider value and all callbacks.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-02-B:** Memoize `PaletteContext` provider value and callbacks

  **AC:**
  - `grep -n "useMemo\|useCallback" src/context/PaletteContext.tsx` returns results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-02-C:** Memoize `FilterContext` provider value and callbacks

  **AC:**
  - `grep -n "useMemo\|useCallback" src/context/FilterContext.tsx` returns results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-02-D:** Memoize `EditorContext` provider value and callbacks

  **AC:**
  - `grep -n "useMemo\|useCallback" src/context/EditorContext.tsx` returns results.
  - `npx tsc --noEmit` exits with code 0.

- [ ] **TICKET-02-E:** Write tests verifying consumers do not re-render on unrelated state changes

  For each context, render a consumer component wrapped in the provider. Trigger a state change in one slice of the context and assert a consumer subscribed to a different slice was not re-rendered (use a render spy / `vi.fn()` in the consumer).

  **AC:**
  - Test file exists at `src/context/__tests__/context-memoization.test.tsx`.
  - Each context has at least one test asserting the consumer render count stays at 1 when an unrelated state key changes.
  - `npx vitest run src/context/__tests__/context-memoization.test` exits with code 0.
