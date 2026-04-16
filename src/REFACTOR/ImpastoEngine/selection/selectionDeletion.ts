import type { SelectionEntry, SelectionState } from './SelectionState';

/**
 * Subsystem hooks for removing entities referenced by {@link SelectionEntry}. The engine implements this;
 * add methods when new selectable, deletable kinds exist.
 */
type SelectionDeletionHost = {
  removeColorPins(ids: readonly string[]): void;
};

const DELETABLE_BY_KIND: Record<SelectionEntry['kind'], boolean> = {
  colorPin: true,
};

function isDeletableEntry(e: SelectionEntry): boolean {
  return DELETABLE_BY_KIND[e.kind];
}

/** True if the selection includes at least one entry whose kind supports delete. */
export function selectionContainsDeletableEntries(entries: readonly SelectionEntry[]): boolean {
  return entries.some(isDeletableEntry);
}

export function selectionStateHasDeletableSelection(selection: SelectionState): boolean {
  return selectionContainsDeletableEntries(selection.getAll());
}

/**
 * Deletes every selected entity for which a host hook exists. Does not clear unrelated selection entries:
 * subsystems are expected to prune their own kind from {@link SelectionState} (e.g. color pin removeMany).
 */
export function deleteSelectedEntries(selection: SelectionState, host: SelectionDeletionHost): void {
  const entries = selection.getAll();
  const pinIds = entries.filter((e): e is { kind: 'colorPin'; id: string } => e.kind === 'colorPin').map((e) => e.id);
  if (pinIds.length > 0) {
    host.removeColorPins(pinIds);
  }
  // Future: branch on other kinds, call host.removeMasks(ids), etc.
}
