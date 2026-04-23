import type { ColorPin } from '../ColorPinState';
import type { ViewportTransform } from '../../viewport/models';
import { imagePixelToCanvasCssPixel } from '../../viewports/canvas/space/viewportCanvasSpace';

/**
 * Headless layout for HTML (or SVG) overlays: world-anchored positions in **CSS px**, constant widget size.
 *
 * Presentation (Mantine swatches, context menus, etc.) lives in React; this module only maps
 * {@link ColorPin} geometry through the same camera as {@link ViewportCanvasBase}.
 */
type ColorPinOverlayLayout = {
  readonly pin: ColorPin;
  /** Horizontal center of the pin in canvas CSS coordinates (use with `translate(-50%, -50%)`). */
  readonly x: number;
  /** Vertical center of the pin in canvas CSS coordinates. */
  readonly y: number;
  /** Sampling radius in CSS px (image radius × zoom; DPR cancels in the projection pipeline). */
  readonly radiusCssPx: number;
};

export function buildColorPinOverlayLayouts(
  pins: readonly ColorPin[],
  transform: ViewportTransform,
  canvas: HTMLCanvasElement,
): ColorPinOverlayLayout[] {
  if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
    return [];
  }
  return pins.map((pin) => {
    const { x, y } = imagePixelToCanvasCssPixel(
      { x: pin.imageX, y: pin.imageY },
      transform,
      canvas,
    );
    return { pin, x, y, radiusCssPx: pin.radiusPx * transform.z };
  });
}
