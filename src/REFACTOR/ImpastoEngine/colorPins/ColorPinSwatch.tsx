import { ColorSwatch } from '@mantine/core';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { ColorPin } from './ColorPinState';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { useImpastoSelection } from '../hooks/useImpastoSelection';
import { useViewportSurface } from '../viewport/ViewportSurfaceContext';
import { forwardWheelEventToCanvas } from '../viewports/canvas/host/forwardWheelToViewportCanvas';

type ColorPinSwatchProps = {
  pin: ColorPin;
  /** Center X in CSS pixels relative to the overlay host (same box as the viewport canvas). */
  x: number;
  /** Center Y in CSS pixels relative to the overlay host. */
  y: number;
  /** Primary pointer down: selection + optional image-space drag (handled by overlay hook). */
  onPinPrimaryPointerDown: (e: React.PointerEvent<HTMLDivElement>, pin: ColorPin) => void;
  /** True while any pin in this overlay is mid drag (cursor affordance). */
  overlayPinDragActive: boolean;
  /** Raised after default context menu is suppressed; host owns the menu and scope. */
  onPinContextMenu: (detail: { pinId: string; clientX: number; clientY: number }) => void;
};

/**
 * One palette pin in the viewport overlay: positions from layout, resolves the backing canvas via
 * {@link useViewportSurface} for wheel forwarding. Primary click updates selection; context menu is delegated to the overlay host.
 */
export function ColorPinSwatch({
  pin,
  x,
  y,
  onPinPrimaryPointerDown,
  overlayPinDragActive,
  onPinContextMenu,
}: ColorPinSwatchProps) {
  const engine = useImpastoEngine();
  const surface = useViewportSurface();
  const canvas = engine.viewports[surface].canvas;
  const selection = useImpastoSelection();

  const isSelected = useMemo(
    () => selection.some((e) => e.kind === 'colorPin' && e.id === pin.id),
    [selection, pin.id],
  );

  const wrapRef = useRef<HTMLDivElement>(null);

  /**
   * React `onWheel` / `onWheelCapture` are passive, so {@link forwardWheelEventToCanvas} cannot mirror
   * `preventDefault` onto the source event. A native non-passive capture listener matches the canvas.
   */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) {
      return;
    }
    const onWheelCapture = (e: WheelEvent): void => {
      forwardWheelEventToCanvas(canvas, e);
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

  const swatchRing: CSSProperties = {
    borderRadius: '50%',
    lineHeight: 0,
    boxShadow: isSelected
      ? '0 0 0 2px var(--mantine-color-body), 0 0 0 4px var(--mantine-color-blue-5)'
      : undefined,
  };

  return (
    <div
      ref={wrapRef}
      style={pinWrap}
      data-pin-id={pin.id}
      onPointerDown={(e) => {
        if (e.button === 0) {
          onPinPrimaryPointerDown(e, pin);
        } else if (e.button === 1) {
          /* Middle (auxiliary) click: delete this pin only; suppress browser autoscroll. */
          e.preventDefault();
          e.stopPropagation();
          engine.colorPins.remove(pin.id);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPinContextMenu({ pinId: pin.id, clientX: e.clientX, clientY: e.clientY });
      }}
    >
      <div style={swatchRing} data-selected={isSelected || undefined}>
        <ColorSwatch color={pin.color} size={14} withShadow aria-label="Color pin" />
      </div>
    </div>
  );
}
