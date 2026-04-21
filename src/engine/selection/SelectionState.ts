import type { SelectionEntry } from '../infra/selectionEntry';

export type { SelectionEntry,  } from '../infra/selectionEntry';

/**
 * Engine selection: discriminated entries so new selectable kinds can be added without reshaping the API.
 */
export class SelectionState {
  private readonly listeners = new Set<() => void>();
  private _entries: readonly SelectionEntry[] = [];

  getAll(): readonly SelectionEntry[] {
    return this._entries;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Replaces the entire selection (order preserved for future multi-select UX). */
  set(next: readonly SelectionEntry[]): void {
    const copy = next.slice() as SelectionEntry[];
    if (copy.length === this._entries.length && copy.every((e, i) => entryEquals(e, this._entries[i]!))) {
      return;
    }
    this._entries = copy;
    this.notify();
  }

  clear(): void {
    if (this._entries.length === 0) {
      return;
    }
    this._entries = [];
    this.notify();
  }

  /**
   * Drops color-pin entries whose ids are not in `validIds`. Other entry kinds are kept.
   * Call after pins are removed or cleared so selection never references missing pins.
   */
  pruneColorPinsToValidIds(validIds: ReadonlySet<string>): void {
    const next = this._entries.filter((e) => e.kind !== 'colorPin' || validIds.has(e.id));
    if (next.length === this._entries.length) {
      return;
    }
    this._entries = next;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

function entryEquals(a: SelectionEntry, b: SelectionEntry): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  switch (a.kind) {
    case 'colorPin':
      return b.kind === 'colorPin' && a.id === b.id;
  }
}
