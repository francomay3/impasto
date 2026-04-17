/**
 * Coalesces arbitrary invalidations into at most one callback per animation frame.
 *
 * Used by viewport canvases so layout/sync work does not run more than once per frame when
 * several code paths call for a redraw in the same tick.
 *
 * **Invariant:** While started, any number of `markDirty()` calls before the next frame
 * produce exactly one `onFrame` invocation (unless `markDirty()` runs again inside `onFrame`,
 * which schedules the following frame).
 */

export class CanvasRafScheduler {
  private _dirty = false;
  private _rafId = 0;
  private _onFrame: (() => void) | null = null;

  /**
   * Registers the per-frame work and flushes immediately if already dirty (e.g. `markDirty`
   * ran before `start`).
   */
  start(onFrame: () => void): void {
    this._onFrame = onFrame;
    this.ensureRafScheduled();
  }

  /** Marks work pending; schedules a single RAF if none is pending and `start` was called. */
  markDirty(): void {
    this._dirty = true;
    this.ensureRafScheduled();
  }

  /**
   * Tears down the scheduler: cancels a pending frame and drops the `onFrame` reference so
   * `markDirty()` becomes a no-op until `start` is called again.
   */
  dispose(): void {
    if (this._rafId !== 0) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    this._onFrame = null;
    this._dirty = false;
  }

  private ensureRafScheduled(): void {
    if (this._rafId !== 0 || this._onFrame === null) return;
    this._rafId = requestAnimationFrame(this.onAnimationFrame);
  }

  private readonly onAnimationFrame = (): void => {
    this._rafId = 0;
    const cb = this._onFrame;
    if (cb === null || !this._dirty) return;

    this._dirty = false;
    cb();

    // `onFrame` may have called `markDirty()` again; schedule the next frame if so.
    if (this._dirty && this._onFrame !== null) {
      this.ensureRafScheduled();
    }
  };
}
