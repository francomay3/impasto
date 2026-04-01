import type { Color } from '../../../types';

const HIT_R = 11;

interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Find the first pin at the given client coordinates.
 * canvasRect is the bounding rect of the rendered (CSS-transformed) canvas element.
 */
export function findPinAt(
  cx: number,
  cy: number,
  pins: Color[],
  canvasRect: CanvasRect,
  imgW: number,
  imgH: number,
): string | null {
  for (const c of pins) {
    if (!c.sample) continue;
    const sx = canvasRect.left + (c.sample.x / imgW) * canvasRect.width;
    const sy = canvasRect.top + (c.sample.y / imgH) * canvasRect.height;
    if (Math.hypot(cx - sx, cy - sy) <= HIT_R) return c.id;
  }
  return null;
}

/**
 * Find all pins whose image-space coordinates fall within the selection rect.
 * Both rect and canvasRect are in client coordinates.
 */
export function findPinsInRect(
  rect: { startX: number; startY: number; endX: number; endY: number },
  pins: Color[],
  canvasRect: CanvasRect,
  imgW: number,
  imgH: number,
): Set<string> {
  const toImg = (sx: number, sy: number) => ({
    x: ((sx - canvasRect.left) / canvasRect.width) * imgW,
    y: ((sy - canvasRect.top) / canvasRect.height) * imgH,
  });
  const { x: x1, y: y1 } = toImg(Math.min(rect.startX, rect.endX), Math.min(rect.startY, rect.endY));
  const { x: x2, y: y2 } = toImg(Math.max(rect.startX, rect.endX), Math.max(rect.startY, rect.endY));
  return new Set(
    pins
      .filter((c) => c.sample && c.sample.x >= x1 && c.sample.x <= x2 && c.sample.y >= y1 && c.sample.y <= y2)
      .map((c) => c.id),
  );
}
