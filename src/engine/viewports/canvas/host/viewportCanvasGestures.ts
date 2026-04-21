import {
  applyZoomFromPinchOffset,
  applyZoomFromWheelDelta,
  panOnDrag,
  panOnZoom,
} from '../../../viewport/viewportMath';
import type { ViewportTransform } from '../../../viewport/models';

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

/** Continuous wheel zoom — proportional to delta magnitude, cursor stays fixed. */
export function nextTransformFromWheelDelta(
  current: ViewportTransform,
  deltaY: number,
  cursorXInViewport: number,
  cursorYInViewport: number,
): ViewportTransform {
  const newZ = applyZoomFromWheelDelta(current.z, deltaY);
  return {
    z: newZ,
    x: panOnZoom(cursorXInViewport, current.x, current.z, newZ),
    y: panOnZoom(cursorYInViewport, current.y, current.z, newZ),
  };
}

/** Pinch zoom — cumulative scale offset from gesture start, pinch origin stays fixed. */
export function nextTransformFromPinch(
  startTransform: ViewportTransform,
  pinchScale: number,
  originXInViewport: number,
  originYInViewport: number,
): ViewportTransform {
  const newZ = applyZoomFromPinchOffset(startTransform.z, pinchScale);
  return {
    z: newZ,
    x: panOnZoom(originXInViewport, startTransform.x, startTransform.z, newZ),
    y: panOnZoom(originYInViewport, startTransform.y, startTransform.z, newZ),
  };
}
