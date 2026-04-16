/**
 * Shared selection-entry shapes for the engine.
 *
 * Lives under `infra/` so `colorPins/` can depend on these DTOs without importing
 * `selection/` (ESLint `import/no-restricted-paths` zone 4). Selection behaviour
 * stays in `selection/`; this module is types + tiny constructors only.
 *
 * Invariant: new selectable kinds extend the discriminated union here first, then
 * `SelectionState` and selection helpers consume the updated shape.
 */

/** One selectable color pin in the engine selection list. */
export type SelectionEntryColorPin = { readonly kind: 'colorPin'; readonly id: string };

/** Extend with `| { kind: '…'; … }` when new selectable entities exist. */
export type SelectionEntry = SelectionEntryColorPin;

/**
 * Builds a {@link SelectionEntry} for a color pin id (used after placement and in blend flows).
 */
export function colorPinEntry(id: string): SelectionEntry {
  return { kind: 'colorPin', id };
}
