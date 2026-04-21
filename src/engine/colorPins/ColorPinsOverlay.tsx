import { useCallback, useLayoutEffect, useState, type CSSProperties } from 'react';
import { throttle } from '../infra/throttle';
import { INPUT_THROTTLE_MS } from '../core/engineConstants';
import { ColorPinSwatch } from './ColorPinSwatch';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { useImpastoColorPins } from './useImpastoColorPins';
import { useImpastoViewportTransform } from '../hooks/useImpastoViewportTransform';
import { useViewportSurface } from '../viewport/ViewportSurfaceContext';
import { buildColorPinOverlayLayouts } from './viewports/ViewportColorPins';
import { useColorPinOverlayImageDrag } from './useColorPinOverlayImageDrag';
import { useEngineColorPinContextMenu } from './useEngineColorPinContextMenu';

const shellStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 1,
};

/**
 * Fills the viewport host (`position: relative`, same displayed size as the canvas sibling). Layout is computed
 * against the engine canvas for correct DPR / backing-store mapping; pins handle their own interaction.
 *
 * Clearing pin selection happens on canvas pointer-down before tools (viewport canvas host),
 * not via overlay click-outside. Context menu uses the app-wide portal (same entries as sidebar pin cards).
 */
export function ColorPinsOverlay() {
  const surface = useViewportSurface();
  const engine = useImpastoEngine();
  const pins = useImpastoColorPins();
  const transform = useImpastoViewportTransform();
  const pinDrag = useColorPinOverlayImageDrag(surface, transform);
  const [, bumpResize] = useState(0);
  const openPinContextMenu = useEngineColorPinContextMenu();

  const canvas = engine.viewports[surface].canvas;

  useLayoutEffect(() => {
    const throttledBump = throttle(() => bumpResize((n) => n + 1), INPUT_THROTTLE_MS);
    const ro = new ResizeObserver(throttledBump);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      throttledBump.cancel();
    };
  }, [canvas]);

  const onPinContextMenu = useCallback(
    (detail: { pinId: string; clientX: number; clientY: number }) => {
      openPinContextMenu(detail.pinId, detail.clientX, detail.clientY);
    },
    [openPinContextMenu],
  );

  const layouts = buildColorPinOverlayLayouts(pins, transform, canvas);

  return (
    <div style={shellStyle} data-testid="color-pins-overlay">
      {layouts.map((layout) => (
        <ColorPinSwatch
          key={layout.pin.id}
          {...layout}
          onPinPrimaryPointerDown={pinDrag.onPinPrimaryPointerDown}
          overlayPinDragActive={pinDrag.isDraggingPins}
          onPinContextMenu={onPinContextMenu}
        />
      ))}
    </div>
  );
}
