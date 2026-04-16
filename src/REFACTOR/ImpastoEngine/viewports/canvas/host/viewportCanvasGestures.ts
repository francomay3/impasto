import { applyZoomStep, panOnDrag, panOnZoom } from '../../../../../features/canvas/engine/viewport';
import type { ViewportTransform } from '../../../viewport/models';

export function nextViewportTransformAfterWheel(
  current: ViewportTransform,
  zoomIn: boolean,
  cursorXInCanvas: number,
  cursorYInCanvas: number,
): ViewportTransform {
  const newZ = applyZoomStep(current.z, zoomIn);
  return {
    z: newZ,
    x: panOnZoom(cursorXInCanvas, current.x, current.z, newZ),
    y: panOnZoom(cursorYInCanvas, current.y, current.z, newZ),
  };
}

export function nextViewportTransformAfterPanMove(
  start: ViewportTransform,
  startClientX: number,
  startClientY: number,
  clientX: number,
  clientY: number,
): ViewportTransform {
  return {
    z: start.z,
    x: panOnDrag(start.x, startClientX, clientX),
    y: panOnDrag(start.y, startClientY, clientY),
  };
}
