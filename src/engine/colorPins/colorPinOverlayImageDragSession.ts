import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react';
import type { ImpastoEngine } from '../core/ImpastoEngine';
import type { ViewportTransform } from '../viewport/models';
import type { ViewportSurfaceId } from '../viewports/canvas/host/viewportInputPolicy';
import { INPUT_THROTTLE_MS } from '../core/engineConstants';
import { throttle } from '../infra/throttle';
import { clientPointToImagePixel } from '../viewports/canvas/space/viewportCanvasSpace';
import type { ColorPin } from './ColorPinState';
import { repositionUpdatesForPointerImageDelta } from './colorPinImageDrag';

/** Active overlay drag: window listeners + throttle must be torn down on pointer-up or React unmount. */
export type ColorPinOverlayDragSession = {
  readonly pointerId: number;
  readonly target: HTMLElement;
  /** Idempotent: removes window listeners and cancels the throttled move handler. */
  readonly detach: () => void;
};

type BeginArgs = {
  engineRef: MutableRefObject<ImpastoEngine>;
  transformRef: MutableRefObject<ViewportTransform>;
  sessionRef: MutableRefObject<ColorPinOverlayDragSession | null>;
  cancelMoveThrottleRef: MutableRefObject<(() => void) | null>;
  surface: ViewportSurfaceId;
  setIsDraggingPins: (v: boolean) => void;
  e: ReactPointerEvent<HTMLDivElement>;
  pin: ColorPin;
};

export function beginColorPinOverlayPointerDown(args: BeginArgs): void {
  const { engineRef, transformRef, sessionRef, cancelMoveThrottleRef, surface, setIsDraggingPins, e, pin } = args;
  const engine = engineRef.current;

  if (e.button === 1) {
    e.preventDefault();
    e.stopPropagation();
    engine.colorPins.remove(pin.id);
    return;
  }
  if (e.button !== 0) {
    return;
  }

  const canvas = engine.viewports[surface].canvas;

  engine.selection.pickColorPin(pin.id, {
    shiftKey: e.shiftKey,
    metaKey: e.metaKey,
    ctrlKey: e.ctrlKey,
  });

  const selPins = engine.selection
    .getAll()
    .filter((s) => s.kind === 'colorPin')
    .map((s) => s.id);
  const dragIds = selPins.includes(pin.id) ? selPins : [pin.id];

  const startImage = clientPointToImagePixel(canvas, e.clientX, e.clientY, transformRef.current);
  const pinsSnap = engine.colorPins.getAll();
  const startCenterById = new Map(pinsSnap.map((p) => [p.id, { x: p.imageX, y: p.imageY }]));

  engine.colorPins.beginPointerDrag(dragIds);

  const target = e.currentTarget;
  const pointerId = e.pointerId;

  cancelMoveThrottleRef.current?.();
  const throttledMove = throttle((ev: PointerEvent) => {
    const eng = engineRef.current;
    const xf = transformRef.current;
    const current = clientPointToImagePixel(canvas, ev.clientX, ev.clientY, xf);
    const r = eng.colorPins.getPlacementExtents();
    if (!r) {
      return;
    }
    const updates = repositionUpdatesForPointerImageDelta(
      startImage,
      current,
      dragIds,
      startCenterById,
      r.width,
      r.height,
    );
    if (updates.length === 0) {
      return;
    }
    eng.colorPins.repositionMany(updates);
  }, INPUT_THROTTLE_MS);
  cancelMoveThrottleRef.current = throttledMove.cancel;

  let attached = true;
  const detach = (): void => {
    if (!attached) {
      return;
    }
    attached = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    throttledMove.cancel();
    cancelMoveThrottleRef.current = null;
  };

  const onMove = (ev: PointerEvent): void => {
    if (ev.pointerId !== pointerId) {
      return;
    }
    throttledMove(ev);
  };

  const session: ColorPinOverlayDragSession = { pointerId, target, detach };

  const onUp = (ev: PointerEvent): void => {
    if (ev.pointerId !== pointerId) {
      return;
    }
    detach();
    try {
      target.releasePointerCapture(pointerId);
    } catch {
      /* capture may already be lost */
    }
    if (sessionRef.current === session) {
      sessionRef.current = null;
      engineRef.current.colorPins.endPointerDrag();
      setIsDraggingPins(false);
    }
  };

  sessionRef.current = session;
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  try {
    target.setPointerCapture(pointerId);
  } catch {
    /* disconnected targets */
  }
  setIsDraggingPins(true);
}

export function createColorPinOverlayDragUnmountCleanup(
  sessionRef: MutableRefObject<ColorPinOverlayDragSession | null>,
  cancelMoveThrottleRef: MutableRefObject<(() => void) | null>,
  engineRef: MutableRefObject<ImpastoEngine>,
  setIsDraggingPins: (v: boolean) => void,
): () => void {
  return () => {
    cancelMoveThrottleRef.current?.();
    cancelMoveThrottleRef.current = null;
    const s = sessionRef.current;
    if (s) {
      s.detach();
      try {
        s.target.releasePointerCapture(s.pointerId);
      } catch {
        /* best-effort */
      }
      engineRef.current.colorPins.abortPointerDrag();
      sessionRef.current = null;
      setIsDraggingPins(false);
    }
  };
}
