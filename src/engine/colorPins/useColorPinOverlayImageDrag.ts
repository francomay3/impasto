import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ColorPin } from './ColorPinState';
import {
  beginColorPinOverlayPointerDown,
  createColorPinOverlayDragUnmountCleanup,
  type ColorPinOverlayDragSession,
} from './colorPinOverlayImageDragSession';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import type { ViewportTransform } from '../viewport/models';
import type { ViewportSurfaceId } from '../viewports/canvas/host/viewportInputPolicy';

/** Overlay primary drag: image-space delta on selection; window move/up for smooth drags off the swatch. */
export function useColorPinOverlayImageDrag(
  surface: ViewportSurfaceId,
  transform: ViewportTransform,
): {
  readonly onPinPrimaryPointerDown: (e: React.PointerEvent<HTMLDivElement>, pin: ColorPin) => void;
  readonly isDraggingPins: boolean;
} {
  const engine = useImpastoEngine();
  const engineRef = useRef(engine);
  const transformRef = useRef(transform);
  // Keep refs current via layout effect so callbacks always see the latest value without re-subscribing.
  useLayoutEffect(() => {
    engineRef.current = engine;
    transformRef.current = transform;
  });

  const sessionRef = useRef<ColorPinOverlayDragSession | null>(null);
  const [isDraggingPins, setIsDraggingPins] = useState(false);
  // Holds the cancel function for the active drag's throttled move handler.
  const cancelMoveThrottleRef = useRef<(() => void) | null>(null);

  useEffect(
    () =>
      createColorPinOverlayDragUnmountCleanup(
        sessionRef,
        cancelMoveThrottleRef,
        engineRef,
        setIsDraggingPins,
      ),
    [],
  );

  const onPinPrimaryPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, pin: ColorPin) => {
      beginColorPinOverlayPointerDown({
        engineRef,
        transformRef,
        sessionRef,
        cancelMoveThrottleRef,
        surface,
        setIsDraggingPins,
        e,
        pin,
      });
    },
    [surface],
  );

  return { onPinPrimaryPointerDown, isDraggingPins };
}
