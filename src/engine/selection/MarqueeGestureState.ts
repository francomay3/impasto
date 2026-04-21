import type { ViewportSurfaceId } from '../viewports/canvas/host/viewportInputPolicy';
import type { ImagePoint } from '../infra/imageRect';

export type MarqueeDraft = {
  readonly surface: ViewportSurfaceId;
  readonly start: ImagePoint;
  readonly current: ImagePoint;
};

/**
 * In-memory draft for marquee overlay and pointer bridge; no product semantics beyond draft geometry.
 */
export class MarqueeGestureState {
  private readonly listeners = new Set<() => void>();
  private _draft: MarqueeDraft | null = null;

  getDraft(): MarqueeDraft | null {
    return this._draft;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(surface: ViewportSurfaceId, start: ImagePoint): void {
    this._draft = { surface, start, current: start };
    this.notify();
  }

  move(current: ImagePoint): void {
    if (!this._draft) {
      return;
    }
    this._draft = { ...this._draft, current };
    this.notify();
  }

  clear(): void {
    if (this._draft === null) {
      return;
    }
    this._draft = null;
    this.notify();
  }

  private notify(): void {
    for (const l of this.listeners) {
      l();
    }
  }
}
