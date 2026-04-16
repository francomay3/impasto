/**
 * Owns the canonical source raster for the engine: pixel buffer, change notifications, and history for user-driven
 * replacements.
 *
 * **Invariants**
 * - `buildApi().set` always stores a defensive copy when `next` is non-null so callers cannot mutate engine-owned
 *   pixels through their original `RawImage` reference.
 * - `applySnapshot` assigns the given reference (or null) as-is — used by undo/redo closures and `loadDocument` so
 *   history steps and hydration do not allocate or double-copy.
 *
 * **Coupling**
 * - Takes `HistoryManager` and an optional `ensureLive` callback from the composition root so `image.set` can reject
 *   mutations after engine `dispose` (same guard the engine previously applied in `setSourceImage`).
 */
import type { RawImage } from '../../../types';
import { createRawImage } from '../../../types';
import type { HistoryManager } from '../history/HistoryManager';
import { ListenerRegistry } from '../infra/listenerRegistry';
import type { ImpastoEngineImageApi } from './ImpastoEngineApi';

export class SourceImageCoordinator {
  private _image: RawImage | null = null;
  private readonly _listeners = new ListenerRegistry<[]>();
  private readonly _history: HistoryManager;
  private readonly _ensureLive?: () => void;

  constructor(history: HistoryManager, ensureLive?: () => void) {
    this._history = history;
    this._ensureLive = ensureLive;
  }

  /** Current source bitmap (may be shared with undo stack after `applySnapshot` — treat as read-only from outside). */
  getImage(): RawImage | null {
    return this._image;
  }

  /**
   * Replaces the stored image without recording history. Callers include hydration and history `undo`/`redo`
   * handlers that already own the correct `RawImage` instance for that timeline position.
   */
  applySnapshot(snap: RawImage | null): void {
    this._image = snap;
    this._listeners.notify();
  }

  /**
   * User-facing surface: read, replace with copy + history, and subscribe to pixel changes.
   */
  buildApi(): ImpastoEngineImageApi {
    return {
      get: () => this.getImage(),
      set: (next) => {
        this._ensureLive?.();
        const before = this._image;
        this.replaceImageWithUserCopy(next);
        const after = this._image;
        if (before === after) {
          return;
        }
        this._history.push({
          weight: 'heavy',
          undo: () => this.applySnapshot(before),
          redo: () => this.applySnapshot(after),
        });
      },
      subscribe: (listener) => this._listeners.add(listener),
    };
  }

  private replaceImageWithUserCopy(next: RawImage | null): void {
    if (next === null) {
      this._image = null;
    } else {
      const copy = new Uint8ClampedArray(next.data);
      this._image = createRawImage(copy, next.width, next.height);
    }
    this._listeners.notify();
  }
}
