import type { ViewportTransform } from '../viewport/models';
import { imagePixelToCanvasCssPixel } from '../viewports/canvas/space/viewportCanvasSpace';
import type { ImageAxisRect } from '../infra/imageRect';

type MarqueeCssRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

export function imageRectToCanvasCssRect(
  rect: ImageAxisRect,
  transform: ViewportTransform,
  canvas: HTMLCanvasElement,
): MarqueeCssRect | null {
  if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
    return null;
  }
  const p1 = imagePixelToCanvasCssPixel({ x: rect.minX, y: rect.minY }, transform, canvas);
  const p2 = imagePixelToCanvasCssPixel({ x: rect.maxX, y: rect.maxY }, transform, canvas);
  const left = Math.min(p1.x, p2.x);
  const top = Math.min(p1.y, p2.y);
  const width = Math.abs(p2.x - p1.x);
  const height = Math.abs(p2.y - p1.y);
  return { left, top, width, height };
}
