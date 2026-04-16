/**
 * Marquee selection pointer gesture for a viewport canvas surface.
 *
 * Owns the transient `{ pointerId }` session, pointer capture, and the
 * `ViewportCanvasInputHost` marquee hooks (`marqueeDragStart` / `Move` / `End`).
 * The host {@link ViewportCanvasPointerBridge} runs color-sample and marquee policy
 * ordering first, then delegates here only when marquee mode is active.
 *
 * Invariants: at most one marquee drag at a time; capture is released on pointer-up
 * even if the browser already dropped capture (swallow `releasePointerCapture` errors).
 */

import type { ViewportCanvasInputHost, ViewportSurfaceId } from './viewportInputPolicy';

type ViewportCanvasMarqueePointerSessionDeps = {
  canvas: HTMLCanvasElement;
  surface: ViewportSurfaceId;
  inputHost: ViewportCanvasInputHost;
  imageFromClient: (clientX: number, clientY: number) => { x: number; y: number };
  onPointerStateChange: () => void;
};

/**
 * Encapsulates marquee rectangle drag for one canvas element.
 */
export class ViewportCanvasMarqueePointerSession {
  private drag: { pointerId: number } | null = null;
  private readonly deps: ViewportCanvasMarqueePointerSessionDeps;

  constructor(deps: ViewportCanvasMarqueePointerSessionDeps) {
    this.deps = deps;
  }

  /**
   * Starts marquee capture after the caller has verified primary button + marquee tool policy.
   */
  beginPrimaryMarquee(e: PointerEvent): void {
    e.preventDefault();
    this.deps.canvas.setPointerCapture(e.pointerId);
    const { x: ix, y: iy } = this.deps.imageFromClient(e.clientX, e.clientY);
    this.deps.inputHost.marqueeDragStart?.({ surface: this.deps.surface, imageX: ix, imageY: iy });
    this.drag = { pointerId: e.pointerId };
    this.deps.onPointerStateChange();
  }

  /**
   * Routes move events while a marquee drag is active for the same `pointerId`.
   * @returns true if the event was consumed.
   */
  consumePointerMoveIfActive(e: PointerEvent): boolean {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return false;
    e.preventDefault();
    const { x, y } = this.deps.imageFromClient(e.clientX, e.clientY);
    this.deps.inputHost.marqueeDragMove?.({ surface: this.deps.surface, imageX: x, imageY: y });
    return true;
  }

  /**
   * Ends marquee drag, forwards modifier keys, and releases capture.
   * @returns true if the event was consumed.
   */
  consumePointerUpIfActive(e: PointerEvent): boolean {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointerId) return false;
    this.drag = null;
    const { x, y } = this.deps.imageFromClient(e.clientX, e.clientY);
    this.deps.inputHost.marqueeDragEnd?.({
      surface: this.deps.surface,
      imageX: x,
      imageY: y,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
    });
    this.deps.onPointerStateChange();
    try {
      this.deps.canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    return true;
  }
}
