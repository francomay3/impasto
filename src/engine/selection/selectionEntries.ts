/**
 * Barrel re-export: keeps legacy `selection/selectionEntries` import paths stable after the ESLint boundary move.
 *
 * **Invariants:** No logic here — only re-exports from {@link ../infra/selectionEntry}. New code should import
 * `colorPinEntry` / `SelectionEntry` from `infra/selectionEntry` directly when not constrained by existing paths.
 *
 * **Coupling:** Exists so `selection/` modules and older call sites avoid duplicating DTOs; canonical types live in
 * `infra/` so `colorPins/` can depend on them without violating `import/no-restricted-paths`.
 */
export { colorPinEntry } from '../infra/selectionEntry';
;
