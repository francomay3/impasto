import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import type { ColorPin } from './ColorPinState';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { useImpastoSelection } from '../hooks/useImpastoSelection';
import { useViewportSurface } from '../viewport/ViewportSurfaceContext';
import { forwardWheelEventToCanvas } from '../viewports/canvas/host/forwardWheelToViewportCanvas';
import { useColorPinHighlightStore } from './colorPinHighlightStore';

type UseColorPinSwatchControllerArgs = {
  pin: ColorPin;
  x: number;
  y: number;
  onPinPrimaryPointerDown: (e: ReactPointerEvent<HTMLDivElement>, pin: ColorPin) => void;
  overlayPinDragActive: boolean;
  onPinContextMenu: (detail: { pinId: string; clientX: number; clientY: number }) => void;
};

export function useColorPinSwatchController(args: UseColorPinSwatchControllerArgs): {
  wrapRef: RefObject<HTMLDivElement | null>;
  pinWrap: CSSProperties;
  swatchRing: CSSProperties;
  isSelected: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onContextMenu: (e: ReactMouseEvent<HTMLDivElement>) => void;
} {
  const { pin, x, y, onPinPrimaryPointerDown, overlayPinDragActive, onPinContextMenu } = args;
  const engine = useImpastoEngine();
  const surface = useViewportSurface();
  const canvas = engine.viewports[surface].canvas;
  const selection = useImpastoSelection();
  const highlightedPinId = useColorPinHighlightStore((s) => s.highlightedPinId);
  const setHighlightedPinId = useColorPinHighlightStore((s) => s.setHighlightedPinId);

  const isHighlighted = highlightedPinId === pin.id;

  const isSelected = useMemo(
    () => selection.some((e) => e.kind === 'colorPin' && e.id === pin.id),
    [selection, pin.id],
  );

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    const onWheelCapture = (ev: WheelEvent): void => {
      forwardWheelEventToCanvas(canvas, ev);
    };
    el.addEventListener('wheel', onWheelCapture, { capture: true, passive: false });
    return () => {
      el.removeEventListener('wheel', onWheelCapture, { capture: true });
    };
  }, [canvas]);

  const pinWrap: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
    pointerEvents: 'auto',
    touchAction: 'none',
    cursor: overlayPinDragActive ? 'grabbing' : isSelected ? 'grab' : 'pointer',
  };

  // Priority: selected > highlighted > default white ring
  const swatchRing: CSSProperties = {
    borderRadius: '50%',
    lineHeight: 0,
    boxShadow: isSelected
      ? '0 0 0 2px var(--mantine-primary-color-5)'
      : isHighlighted
        ? '0 0 0 2px var(--mantine-color-secondary-2)'
        : '0 0 0 2px rgba(255, 255, 255, 0.35)',
  };

  return {
    wrapRef,
    pinWrap,
    swatchRing,
    isSelected,
    onMouseEnter: () => setHighlightedPinId(pin.id),
    onMouseLeave: () => setHighlightedPinId(null),
    onPointerDown: (e) => {
      if (e.button === 0) {
        onPinPrimaryPointerDown(e, pin);
      } else if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        engine.colorPins.remove(pin.id);
      }
    },
    onContextMenu: (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPinContextMenu({ pinId: pin.id, clientX: e.clientX, clientY: e.clientY });
    },
  };
}
