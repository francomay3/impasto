/**
 * Linear undo/redo: each committed step stores an `undo` / `redo` pair (typically created by the engine when it
 * applies a document mutation). Caps are enforced on the **past** line only; the redo stack is cleared whenever a
 * new step is pushed.
 *
 * Retention (shared refs vs duplicated bitmaps) is the caller’s responsibility — this module only invokes the
 * functions it is given.
 */

type HistoryEntryWeight = 'light' | 'heavy';

type HistoryRecord = {
  readonly undo: () => void;
  readonly redo: () => void;
  /**
   * `heavy` should be used for full source-image replacements; `light` for pins, filters, and similar.
   * Separate caps apply (defaults: 100 light, 20 heavy).
   */
  readonly weight: HistoryEntryWeight;
};

/** Argument to {@link HistoryManager.push}; omits `weight` to default to `light`. */
type HistoryPushRecord = {
  readonly undo: () => void;
  readonly redo: () => void;
  readonly weight?: HistoryEntryWeight;
};

type HistoryManagerOptions = {
  /** Max number of `light` entries kept in the past line (oldest dropped first). Default 100. */
  readonly maxLightEntries?: number;
  /** Max number of `heavy` entries kept in the past line. Default 20. */
  readonly maxHeavyEntries?: number;
};

export class HistoryManager {
  private readonly maxLightEntries: number;
  private readonly maxHeavyEntries: number;
  private readonly past: HistoryRecord[] = [];
  private readonly future: HistoryRecord[] = [];
  private readonly listeners = new Set<() => void>();

  constructor(options?: HistoryManagerOptions) {
    this.maxLightEntries = options?.maxLightEntries ?? 100;
    this.maxHeavyEntries = options?.maxHeavyEntries ?? 20;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Records a new user step. The document mutation has already been applied; `undo` restores the prior state and
   * `redo` reapplies the new state. Clears the redo line.
   */
  push(record: HistoryPushRecord): void {
    this.future.length = 0;
    const normalized: HistoryRecord = {
      undo: record.undo,
      redo: record.redo,
      weight: record.weight ?? 'light',
    };
    this.past.push(normalized);
    this.evictPastIfOverCap();
    this.notify();
  }

  /** Undo the most recent past step, if any. */
  back(): void {
    const step = this.past.pop();
    if (!step) {
      return;
    }
    step.undo();
    this.future.push(step);
    this.notify();
  }

  /** Redo one step from the redo line, if any. */
  forward(): void {
    const step = this.future.pop();
    if (!step) {
      return;
    }
    step.redo();
    this.past.push(step);
    this.evictPastIfOverCap();
    this.notify();
  }

  /** Drops all undo/redo state (for example on engine dispose). */
  clear(): void {
    this.past.length = 0;
    this.future.length = 0;
    this.notify();
  }

  /**
   * Empties past and future without notifying subscribers. Used when hydrating a document (`loadDocument`) so
   * persistence listeners do not fire a save and load-time steps are not left on the undo stack.
   */
  clearSilently(): void {
    this.past.length = 0;
    this.future.length = 0;
  }

  /**
   * Invokes document-changed subscribers without pushing an undo step or clearing stacks.
   * Used when durable state was replaced wholesale (e.g. user import) so persistence can debounce-save
   * without an undo stack entry.
   */
  notifyExternalDocumentChange(): void {
    this.notify();
  }

  private evictPastIfOverCap(): void {
    while (this.pastOverCap()) {
      this.past.shift();
    }
  }

  private pastOverCap(): boolean {
    let light = 0;
    let heavy = 0;
    for (const e of this.past) {
      if (e.weight === 'heavy') {
        heavy += 1;
      } else {
        light += 1;
      }
    }
    return light > this.maxLightEntries || heavy > this.maxHeavyEntries;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
