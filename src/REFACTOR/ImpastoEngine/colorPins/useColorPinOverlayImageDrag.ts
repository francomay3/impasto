import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ColorPin } from './ColorPinState';
import { repositionUpdatesForPointerImageDelta } from './colorPinImageDrag';
import { colorPinIdsFromSelection } from './resolveColorPinContextScope';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import type { ViewportTransform } from '../viewport/models';
import type { ViewportSurfaceId } from '../viewports/canvas/host/viewportInputPolicy';
import { clientPointToImagePixel } from '../viewports/canvas/space/viewportCanvasSpace';

type DragSession = {
  readonly pointerId: number;
  readonly captureEl: HTMLElement;
  readonly startPointerImage: { readonly x: number; readonly y: number };
  readonly startById: ReadonlyMap<string, { readonly x: number; readonly y: number }>;
  readonly pinIds: readonly string[];
  readonly onWindowPointerMove: (ev: PointerEvent) => void;
  readonly onWindowPointerUp: (ev: PointerEvent) => void;
};

/**
 * Primary-button drag for color pins in the HTML overlay: image-space delta applied to the current
 * selection (after {@link ImpastoEngineSelectionApi.pickColorPin} on pointer down), clamped by the engine.
 * Window-level move/up so drags stay smooth when the cursor leaves the swatch.
 */
export function useColorPinOverlayImageDrag(
  surface: ViewportSurfaceId,
  transform: ViewportTransform,
): {
  readonly onPinPrimaryPointerDown: (e: React.PointerEvent<HTMLDivElement>, pin: ColorPin) => void;
  readonly isDraggingPins: boolean;
} {
  const engine = useImpastoEngine();
  const engineRef = useRef(engine);
  // Keep refs current via layout effect so callbacks always see the latest value without re-subscribing.
  useLayoutEffect(() => {
    engineRef.current = engine;
  });

  const transformRef = useRef(transform);
  useLayoutEffect(() => {
    transformRef.current = transform;
  });

  const sessionRef = useRef<DragSession | null>(null);
  const [isDraggingPins, setIsDraggingPins] = useState(false);

  useEffect(() => {
    return () => {
      const sess = sessionRef.current;
      if (!sess) {
        return;
      }
      window.removeEventListener('pointermove', sess.onWindowPointerMove);
      window.removeEventListener('pointerup', sess.onWindowPointerUp);
      window.removeEventListener('pointercancel', sess.onWindowPointerUp);
      try {
        sess.captureEl.releasePointerCapture(sess.pointerId);
      } catch {
        /* */
      }
      engineRef.current.colorPins.abortPointerDrag();
      sessionRef.current = null;
      setIsDraggingPins(false);
    };
  }, []);

  const onPinPrimaryPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, pin: ColorPin) => {
      if (e.button !== 0) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      const eng = engineRef.current;
      eng.selection.pickColorPin(pin.id, {
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
      });

      const pinIds = colorPinIdsFromSelection(eng.selection.getAll());
      if (pinIds.length === 0) {
        return;
      }

      const rows = eng.colorPins.getAll();
      const startById = new Map<string, { readonly x: number; readonly y: number }>();
      for (const id of pinIds) {
        const row = rows.find((p) => p.id === id);
        if (row) {
          startById.set(id, { x: row.imageX, y: row.imageY });
        }
      }
      if (startById.size === 0) {
        return;
      }

      const canvas = eng.viewports[surface].canvas;
      const startPointerImage = clientPointToImagePixel(
        canvas,
        e.clientX,
        e.clientY,
        transformRef.current,
      );

      const captureEl = e.currentTarget;
      const orderedPinIds = pinIds.filter((id) => startById.has(id));
      eng.colorPins.beginPointerDrag(orderedPinIds);

      try {
        captureEl.setPointerCapture(e.pointerId);
      } catch {
        /* element may not support capture in some environments */
      }
      setIsDraggingPins(true);

      const onWindowPointerMove = (ev: PointerEvent): void => {
        const sess = sessionRef.current;
        if (!sess || ev.pointerId !== sess.pointerId) {
          return;
        }
        const extent = engineRef.current.colorPins.getPlacementExtents();
        if (!extent) {
          return;
        }
        const cur = clientPointToImagePixel(canvas, ev.clientX, ev.clientY, transformRef.current);
        const updates = repositionUpdatesForPointerImageDelta(
          sess.startPointerImage,
          cur,
          sess.pinIds,
          sess.startById,
          extent.width,
          extent.height,
        );
        engineRef.current.colorPins.repositionMany(updates);
      };

      const onWindowPointerUp = (ev: PointerEvent): void => {
        const sess = sessionRef.current;
        if (!sess || ev.pointerId !== sess.pointerId) {
          return;
        }
        window.removeEventListener('pointermove', sess.onWindowPointerMove);
        window.removeEventListener('pointerup', sess.onWindowPointerUp);
        window.removeEventListener('pointercancel', sess.onWindowPointerUp);
        try {
          sess.captureEl.releasePointerCapture(sess.pointerId);
        } catch {
          /* */
        }
        engineRef.current.colorPins.endPointerDrag();
        sessionRef.current = null;
        setIsDraggingPins(false);
      };

      sessionRef.current = {
        pointerId: e.pointerId,
        captureEl,
        startPointerImage,
        startById,
        pinIds: orderedPinIds,
        onWindowPointerMove,
        onWindowPointerUp,
      };

      window.addEventListener('pointermove', onWindowPointerMove);
      window.addEventListener('pointerup', onWindowPointerUp);
      window.addEventListener('pointercancel', onWindowPointerUp);
    },
    [surface],
  );

  return { onPinPrimaryPointerDown, isDraggingPins };
}
