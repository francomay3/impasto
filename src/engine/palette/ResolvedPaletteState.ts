import type { ResolvedPaletteEntry } from './paletteResolver';

function mixEntryEqual(a: { name: string; rgb: string; parts: number }, b: typeof a): boolean {
  return a.name === b.name && a.rgb === b.rgb && a.parts === b.parts;
}

function targetEqual(a: ResolvedPaletteEntry['target'], b: ResolvedPaletteEntry['target']): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.l === b.l && a.a === b.a && a.b === b.b;
}

function recipeEqual(a: ResolvedPaletteEntry['recipe'], b: ResolvedPaletteEntry['recipe']): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (!mixEntryEqual(a[i]!, b[i]!)) return false;
  return true;
}

function entryEqual(a: ResolvedPaletteEntry, b: ResolvedPaletteEntry): boolean {
  return (
    a.pinId === b.pinId &&
    a.displayHex === b.displayHex &&
    a.lab.l === b.lab.l &&
    a.lab.a === b.lab.a &&
    a.lab.b === b.lab.b &&
    targetEqual(a.target, b.target) &&
    recipeEqual(a.recipe, b.recipe)
  );
}

/**
 * Keyed store of per-pin resolver output (pin id → entry). Write one entry at a time via
 * {@link setEntry}, remove via {@link removeEntry} or {@link retainPinIds}. {@link getAll}
 * returns an insertion-ordered snapshot that is rebuilt lazily and stable between notifies.
 */
export class ResolvedPaletteState {
  private readonly listeners = new Set<() => void>();
  private readonly byId = new Map<string, ResolvedPaletteEntry>();
  private snapshot: readonly ResolvedPaletteEntry[] | null = Object.freeze([]);

  getAll(): readonly ResolvedPaletteEntry[] {
    if (this.snapshot) return this.snapshot;
    this.snapshot = Object.freeze(Array.from(this.byId.values()));
    return this.snapshot;
  }

  getByPinId(pinId: string): ResolvedPaletteEntry | undefined {
    return this.byId.get(pinId);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Insert-or-update one pin's entry. No-op (no notify) if the stored entry is structurally equal. */
  setEntry(entry: ResolvedPaletteEntry): void {
    const prev = this.byId.get(entry.pinId);
    const frozen = Object.freeze({ ...entry });
    if (prev && entryEqual(prev, frozen)) return;
    this.byId.set(entry.pinId, frozen);
    this.snapshot = null;
    this.notify();
  }

  /** Drops one entry. No-op if the key isn't present. */
  removeEntry(pinId: string): void {
    if (!this.byId.delete(pinId)) return;
    this.snapshot = null;
    this.notify();
  }

  /** Removes every entry whose pinId is not in `activePinIds`. Single notify if anything dropped. */
  retainPinIds(activePinIds: Iterable<string>): void {
    const keep = new Set(activePinIds);
    let removed = false;
    for (const id of Array.from(this.byId.keys())) {
      if (!keep.has(id)) {
        this.byId.delete(id);
        removed = true;
      }
    }
    if (!removed) return;
    this.snapshot = null;
    this.notify();
  }

  clear(): void {
    if (this.byId.size === 0) return;
    this.byId.clear();
    this.snapshot = Object.freeze([]);
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
