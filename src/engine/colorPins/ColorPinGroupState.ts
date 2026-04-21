/**
 * Named groups for palette pins.
 *
 * Each row is **immutable** once stored: updates replace the array and produce new frozen objects. Callers subscribe
 * for coarse “groups changed” notifications.
 */
export type ColorPinGroup = {
  readonly id: string;
  readonly label: string;
  readonly color?: string; // optional display tint for the group
};

export class ColorPinGroupState {
  private readonly listeners = new Set<() => void>();
  private _groups: readonly ColorPinGroup[] = [];

  getAll(): readonly ColorPinGroup[] {
    return this._groups;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Inserts a group row. The new row is frozen before assignment; listeners see a single notify.
   * @returns The new group’s id.
   */
  add(label: string, color?: string): string {
    const id =
      globalThis.crypto?.randomUUID?.() ?? `pin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const row: ColorPinGroup = Object.freeze(
      color !== undefined ? { id, label, color } : { id, label },
    );
    this._groups = [...this._groups, row];
    this.notify();
    return id;
  }

  removeById(id: string): void {
    const next = this._groups.filter((g) => g.id !== id);
    if (next.length === this._groups.length) {
      return;
    }
    this._groups = next;
    this.notify();
  }

  /** Updates the label for one id. One notify if the label changed. */
  setLabel(id: string, label: string): void {
    let changed = false;
    const next = this._groups.map((g) => {
      if (g.id !== id) {
        return g;
      }
      if (g.label === label) {
        return g;
      }
      changed = true;
      return Object.freeze({
        ...g,
        label,
      });
    });
    if (!changed) {
      return;
    }
    this._groups = next;
    this.notify();
  }

  clear(): void {
    if (this._groups.length === 0) {
      return;
    }
    this._groups = [];
    this.notify();
  }

  /**
   * Replaces the group list (e.g. undo/redo). Engine/history only — callers must pass frozen or copy-stable rows.
   */
  setAllGroups(next: readonly ColorPinGroup[]): void {
    const mapped = next.map((g) =>
      Object.freeze(
        g.color !== undefined ? { id: g.id, label: g.label, color: g.color } : { id: g.id, label: g.label },
      ),
    );
    if (mapped.length === this._groups.length) {
      let same = true;
      for (let i = 0; i < mapped.length; i += 1) {
        const a = mapped[i]!;
        const b = this._groups[i]!;
        if (a.id !== b.id || a.label !== b.label || a.color !== b.color) {
          same = false;
          break;
        }
      }
      if (same) {
        return;
      }
    }
    this._groups = mapped;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
