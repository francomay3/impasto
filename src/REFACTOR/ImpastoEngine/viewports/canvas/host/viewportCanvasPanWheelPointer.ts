/**
 * Primary / middle-button pan drag and wheel zoom for a viewport canvas.
 *
 * Extracted from {@link ViewportCanvasPointerBridge} so the bridge stays a thin shell
 * for color sampling, marquee delegation, reticle scheduling, and listener wiring.
 *
 * Coupling: reticle updates during pan use caller-supplied hooks because they depend on
 * bridge-owned backing-store pixel caching and coalesced redraw scheduling.
 */

import type { ViewportTransform } from '../../../viewport/models';
import {
  nextViewportTransformAfterPanMove,
  nextViewportTransformAfterWheel,
} from './viewportCanvasGestures';
import type { ImpastoToolId } from '../../../tools/ToolState';
import {
  allowsMiddleButtonDragPan,
  effectivePrimaryDragPan,
  effectiveWheelZoom,
  type ViewportCanvasInputHost,
  type ViewportSurfaceId,
} from './viewportInputPolicy';
import type { ViewportCanvasPanDragState } from '../render/viewportCanvasRenderer';
import { throttle, type ThrottledFn } from '../../../infra/throttle';
import { INPUT_THROTTLE_MS } from '../../../core/engineConstants';

type ViewportCanvasPanWheelPointerDeps = {
  canvas: HTMLCanvasElement;
  surface: ViewportSurfaceId;
  inputHost: ViewportCanvasInputHost;
  getTransform: () => ViewportTransform;
  proposeTransform: (next: ViewportTransform) => void;
  onPointerStateChange: () => void;
  /** Whether the active tool shows the sample ring so pan moves should refresh reticle pixels. */
  isSampleRingActive: () => boolean;
  /** Updates hover reticle backing-store position and schedules a redraw (pan path only). */
  updateReticleForPanMove: (e: PointerEvent) => void;
};

/**
 * Owns `panDrag` state and the wheel zoom path for one canvas.
 */
export class ViewportCanvasPanWheelPointer {
  private panDrag: ViewportCanvasPanDragState | null = null;
  private readonly deps: ViewportCanvasPanWheelPointerDeps;
  private readonly _throttledPanMove: ThrottledFn<[PointerEvent]>;

  constructor(deps: ViewportCanvasPanWheelPointerDeps) {
    this.deps = deps;
    this._throttledPanMove = throttle((e: PointerEvent) => {
      const drag = this.panDrag;
      if (!drag) return;
      const next = nextViewportTransformAfterPanMove(
        drag.startT, drag.startX, drag.startY, e.clientX, e.clientY,
      );
      this.deps.proposeTransform(next);
      if (this.deps.isSampleRingActive()) {
        this.deps.updateReticleForPanMove(e);
      }
    }, INPUT_THROTTLE_MS);
  }

  getPanDrag(): ViewportCanvasPanDragState | null {
    return this.panDrag;
  }

  /**
   * Primary button after color-sample and marquee branches have declined.
   * @returns true when pan drag was started.
   */
  tryBeginPrimaryPan(e: PointerEvent, toolId: ImpastoToolId): boolean {
    if (!effectivePrimaryDragPan(this.deps.surface, toolId)) return false;
    this.beginPanCapture(e);
    return true;
  }

  /**
   * Middle-button pan entry.
   * @returns true when pan drag was started.
   */
  tryBeginMiddlePan(e: PointerEvent): boolean {
    if (!allowsMiddleButtonDragPan(this.deps.surface)) return false;
    this.beginPanCapture(e);
    return true;
  }

  private beginPanCapture(e: PointerEvent): void {
    e.preventDefault();
    this.deps.canvas.setPointerCapture(e.pointerId);
    this.panDrag = {
      pointerId: e.pointerId,
      pointerButton: e.button as 0 | 1,
      startX: e.clientX,
      startY: e.clientY,
      startT: { ...this.deps.getTransform() },
    };
    this.deps.onPointerStateChange();
  }

  consumePointerMoveIfActive(e: PointerEvent): boolean {
    const drag = this.panDrag;
    if (!drag || e.pointerId !== drag.pointerId) return false;
    // preventDefault must fire synchronously; the expensive work is throttled.
    e.preventDefault();
    this._throttledPanMove(e);
    return true;
  }

  dispose(): void {
    this._throttledPanMove.cancel();
  }

  consumePointerUpIfActive(e: PointerEvent): boolean {
    const drag = this.panDrag;
    if (!drag || e.pointerId !== drag.pointerId) return false;
    this.panDrag = null;
    this.deps.onPointerStateChange();
    try {
      this.deps.canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    return true;
  }

  handleWheel(e: WheelEvent): void {
    const tools = this.deps.inputHost.getToolsState();
    if (!effectiveWheelZoom(this.deps.surface, tools.activeTool.id)) {
      return;
    }
    e.preventDefault();
    const rect = this.deps.canvas.getBoundingClientRect();
    const next = nextViewportTransformAfterWheel(
      this.deps.getTransform(),
      e.deltaY < 0,
      e.clientX - rect.left,
      e.clientY - rect.top,
    );
    this.deps.proposeTransform(next);
  }
}
