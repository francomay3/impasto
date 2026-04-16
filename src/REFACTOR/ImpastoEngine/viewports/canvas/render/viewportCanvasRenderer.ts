import type { ViewportTransform } from '../../../viewport/models';
import { drawSampleColorReticle } from '../chrome/sampleColorReticle';
import {
  brushRadiusFromToolsState,
  type ViewportCanvasInputHost,
  type ViewportSurfaceId,
} from '../host/viewportInputPolicy';
import { viewportCanvasPointerUi } from '../chrome/viewportCanvasPointerUi';

/** Mirrors pan-drag state owned by {@link ViewportCanvasPointerBridge} for overlay chrome. */
export type ViewportCanvasPanDragState = {
  pointerId: number;
  pointerButton: 0 | 1;
  startX: number;
  startY: number;
  startT: ViewportTransform;
};

/**
 * Inputs for painting the display canvas (image pass + sample reticle overlay).
 * Includes pointer-overlay fields required by {@link viewportCanvasPointerUi}.
 */
type ViewportCanvasDrawParams = {
  sourceCanvas: HTMLCanvasElement;
  displayDpr: number;
  transform: ViewportTransform;
  reticleCanvasPos: { x: number; y: number } | null;
  inputHost: ViewportCanvasInputHost;
  surface: ViewportSurfaceId;
  pointerInsideCanvas: boolean;
  panDrag: ViewportCanvasPanDragState | null;
};

/** Pass A: clear + camera transform + bitmap. Pass B: identity + HUD in backing-store space. */
export function drawViewportCanvas(
  ctx: CanvasRenderingContext2D,
  params: ViewportCanvasDrawParams,
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  if (w === 0 || h === 0) return;

  const { sourceCanvas: src, displayDpr: dpr, transform: t } = params;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  if (src.width !== 0 && src.height !== 0) {
    ctx.setTransform(dpr * t.z, 0, 0, dpr * t.z, dpr * t.x, dpr * t.y);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(src, 0, 0);
  }

  const tools = params.inputHost.getToolsState();
  const ui = viewportCanvasPointerUi({
    surface: params.surface,
    toolId: tools.activeTool.id,
    pointerInside: params.pointerInsideCanvas,
    panDrag: params.panDrag,
  });
  if (!ui.sampleRingActive || !params.reticleCanvasPos) {
    return;
  }

  const rImg = brushRadiusFromToolsState(tools);
  const ringDevicePx = rImg * params.displayDpr * params.transform.z;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawSampleColorReticle(
    ctx,
    params.reticleCanvasPos.x,
    params.reticleCanvasPos.y,
    ringDevicePx,
  );
}
