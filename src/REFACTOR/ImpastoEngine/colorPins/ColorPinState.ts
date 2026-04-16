import type { ImageAxisRect } from '../infra/imageRect';

/**
 * Palette pins in filtered image space.
 *
 * {@link ColorPin.color} is a **read-only** UX snapshot (`#rrggbb`): averaged sRGB under the pin footprint on the
 * filtered image. The engine sets it at insert and again whenever the pin is repositioned; LAB for indexing is
 * recomputed separately from geometry + filtered pixels.
 */
export type ColorPin = {
  readonly id: string;
  readonly imageX: number;
  readonly imageY: number;
  readonly radiusPx: number;
  /** Read-only display hex from the engine (insert or reposition); callers never set this directly. */
  readonly color: string;
};

/** Geometry for a new pin. {@link ColorPin.color} is never part of this payload — the engine samples it at insert. */
export type ColorPinAddPayload = {
  imageX: number;
  imageY: number;
  radiusPx: number;
};

export class ColorPinState {
  private readonly listeners = new Set<() => void>();
  private _pins: readonly ColorPin[] = [];

  getAll(): readonly ColorPin[] {
    return this._pins;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Inserts a pin row. `sampledColorHex` is engine-produced only (filtered-image sample); it is frozen on the stored pin until a later {@link repositionMany}.
   * @returns The new pin’s id.
   */
  addFromSample(geometry: ColorPinAddPayload, sampledColorHex: string): string {
    const id =
      globalThis.crypto?.randomUUID?.() ?? `pin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { imageX, imageY, radiusPx } = geometry;
    const row: ColorPin = Object.freeze({
      id,
      imageX,
      imageY,
      radiusPx,
      color: sampledColorHex,
    });
    this._pins = [...this._pins, row];
    this.notify();
    return id;
  }

  removeById(id: string): void {
    const next = this._pins.filter((p) => p.id !== id);
    if (next.length === this._pins.length) {
      return;
    }
    this._pins = next;
    this.notify();
  }

  /**
   * Updates pin centers and display colors in one pass. `color` must be engine-sampled (`#rrggbb`), same rule as
   * {@link addFromSample}. Unknown ids are ignored. One notify if any field changed.
   */
  repositionMany(
    updates: readonly {
      readonly id: string;
      readonly imageX: number;
      readonly imageY: number;
      readonly color: string;
    }[],
  ): void {
    if (updates.length === 0) {
      return;
    }
    const byId = new Map<string, { readonly imageX: number; readonly imageY: number; readonly color: string }>();
    for (const u of updates) {
      byId.set(u.id, { imageX: u.imageX, imageY: u.imageY, color: u.color });
    }
    let changed = false;
    const next = this._pins.map((p) => {
      const u = byId.get(p.id);
      if (!u) {
        return p;
      }
      if (u.imageX === p.imageX && u.imageY === p.imageY && u.color === p.color) {
        return p;
      }
      changed = true;
      return Object.freeze({
        ...p,
        imageX: u.imageX,
        imageY: u.imageY,
        color: u.color,
      });
    });
    if (!changed) {
      return;
    }
    this._pins = next;
    this.notify();
  }

  /** Removes every pin whose id is in `ids`. One notify if anything changed. */
  removeByIds(ids: readonly string[]): void {
    if (ids.length === 0) {
      return;
    }
    const drop = new Set(ids);
    const next = this._pins.filter((p) => !drop.has(p.id));
    if (next.length === this._pins.length) {
      return;
    }
    this._pins = next;
    this.notify();
  }

  /**
   * Pin centers inside the closed axis-aligned rectangle (inclusive edges), in insertion order.
   */
  queryColorPinIdsInImageRect(rect: ImageAxisRect): readonly string[] {
    const out: string[] = [];
    for (const p of this._pins) {
      if (
        p.imageX >= rect.minX &&
        p.imageX <= rect.maxX &&
        p.imageY >= rect.minY &&
        p.imageY <= rect.maxY
      ) {
        out.push(p.id);
      }
    }
    return out;
  }

  clear(): void {
    if (this._pins.length === 0) {
      return;
    }
    this._pins = [];
    this.notify();
  }

  /**
   * Replaces the pin list (e.g. undo/redo). Engine/history only — callers must pass frozen or copy-stable rows.
   */
  setAllPins(next: readonly ColorPin[]): void {
    const mapped = next.map((p) =>
      Object.freeze({
        id: p.id,
        imageX: p.imageX,
        imageY: p.imageY,
        radiusPx: p.radiusPx,
        color: p.color,
      }),
    );
    if (mapped.length === this._pins.length) {
      let same = true;
      for (let i = 0; i < mapped.length; i += 1) {
        const a = mapped[i]!;
        const b = this._pins[i]!;
        if (
          a.id !== b.id ||
          a.imageX !== b.imageX ||
          a.imageY !== b.imageY ||
          a.radiusPx !== b.radiusPx ||
          a.color !== b.color
        ) {
          same = false;
          break;
        }
      }
      if (same) {
        return;
      }
    }
    this._pins = mapped;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
