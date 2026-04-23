import type { ResolvedPaletteEntry } from './paletteResolver';

function mixEntryEqual(a: { name: string; rgb: string; parts: number }, b: typeof a): boolean {
  return a.name === b.name && a.rgb === b.rgb && a.parts === b.parts;
}

function targetEqual(
  a: ResolvedPaletteEntry['target'],
  b: ResolvedPaletteEntry['target'],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.l === b.l && a.a === b.a && a.b === b.b;
}

function recipeEqual(
  a: ResolvedPaletteEntry['recipe'],
  b: ResolvedPaletteEntry['recipe'],
): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!mixEntryEqual(a[i]!, b[i]!)) return false;
  }
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

function entriesSnapshotEqual(
  a: readonly ResolvedPaletteEntry[],
  b: readonly ResolvedPaletteEntry[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!entryEqual(a[i]!, b[i]!)) return false;
  }
  return true;
}

/**
 * Runtime snapshot of the last palette resolver output (pin id → row). Not persisted; mirrors
 * {@link ColorPinGroupState}’s subscribe + stable `getAll` reference between identical notifies.
 */
export class ResolvedPaletteState {
  private readonly listeners = new Set<() => void>();
  private readonly byId = new Map<string, ResolvedPaletteEntry>();
  private snapshot: readonly ResolvedPaletteEntry[] = Object.freeze([]);

  getAll(): readonly ResolvedPaletteEntry[] {
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

  setEntries(entries: readonly ResolvedPaletteEntry[]): void {
    const frozen = Object.freeze(entries.map((e) => Object.freeze({ ...e })));
    if (entriesSnapshotEqual(frozen, this.snapshot)) {
      return;
    }
    this.byId.clear();
    for (const e of frozen) {
      this.byId.set(e.pinId, e);
    }
    this.snapshot = frozen;
    this.notify();
  }

  clear(): void {
    if (this.snapshot.length === 0) {
      return;
    }
    this.byId.clear();
    this.snapshot = Object.freeze([]);
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
