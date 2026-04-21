import type { ImageAxisRect } from '../infra/imageRect';
import { applyRepositionMany, applySetAllPins, applySetPinMeta } from './colorPinMutations';
import type { ColorPin, ColorPinAddPayload } from './colorPinTypes';

export type { ColorPin, ColorPinAddPayload } from './colorPinTypes';

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
   * Inserts a pin row. `sampledColorHex` is engine-produced only (filtered-image sample); it is frozen on the stored
   * pin until a later {@link repositionMany}.
   * @returns The new pin's id.
   */
  addFromSample(geometry: ColorPinAddPayload, sampledColorHex: string): string {
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `pin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { imageX, imageY, radiusPx, label, groupId } = geometry;
    const row: ColorPin = Object.freeze({
      id,
      imageX,
      imageY,
      radiusPx,
      color: sampledColorHex,
      ...(label !== undefined ? { label } : {}),
      ...(groupId !== undefined ? { groupId } : {}),
    } as ColorPin);
    this._pins = [...this._pins, row];
    this.notify();
    return id;
  }

  /**
   * Like {@link addFromSample} but inserts at `insertIndex` in the current engine list (0 = front). Clamps to
   * `[0, length]` so callers may pass an index computed for the post-merge length before this row exists.
   */
  addFromSampleInsertAt(
    geometry: ColorPinAddPayload,
    sampledColorHex: string,
    insertIndex: number,
  ): string {
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `pin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { imageX, imageY, radiusPx, label, groupId } = geometry;
    const row: ColorPin = Object.freeze({
      id,
      imageX,
      imageY,
      radiusPx,
      color: sampledColorHex,
      ...(label !== undefined ? { label } : {}),
      ...(groupId !== undefined ? { groupId } : {}),
    } as ColorPin);
    const at = Math.max(0, Math.min(insertIndex, this._pins.length));
    this._pins = [...this._pins.slice(0, at), row, ...this._pins.slice(at)];
    this.notify();
    return id;
  }

  removeById(id: string): void {
    const next = this._pins.filter((p) => p.id !== id);
    if (next.length === this._pins.length) return;
    this._pins = next;
    this.notify();
  }

  /** Removes every pin whose id is in `ids`. One notify if anything changed. */
  removeByIds(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const drop = new Set(ids);
    const next = this._pins.filter((p) => !drop.has(p.id));
    if (next.length === this._pins.length) return;
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
    }[]
  ): void {
    const next = applyRepositionMany(this._pins, updates);
    if (next === null) return;
    this._pins = next;
    this.notify();
  }

  /** Pin centers inside the closed axis-aligned rectangle (inclusive edges), in insertion order. */
  queryColorPinIdsInImageRect(rect: ImageAxisRect): readonly string[] {
    const out: string[] = [];
    for (const p of this._pins) {
      if (p.imageX >= rect.minX && p.imageX <= rect.maxX && p.imageY >= rect.minY && p.imageY <= rect.maxY) {
        out.push(p.id);
      }
    }
    return out;
  }

  clear(): void {
    if (this._pins.length === 0) return;
    this._pins = [];
    this.notify();
  }

  /** Replaces the pin list (e.g. undo/redo). Engine/history only — callers must pass frozen or copy-stable rows. */
  setAllPins(next: readonly ColorPin[]): void {
    const mapped = applySetAllPins(this._pins, next);
    if (mapped === null) return;
    this._pins = mapped;
    this.notify();
  }

  /** Updates optional pin metadata. Unknown ids are ignored. One notify if any matching pin field changed. */
  setPinMeta(id: string, meta: { label?: string; groupId?: string | null }): void {
    const next = applySetPinMeta(this._pins, id, meta);
    if (next === null) return;
    this._pins = next;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
