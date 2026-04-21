import { ColorSwatch } from '@mantine/core';
import type { ColorPin } from './ColorPinState';
import { useColorPinSwatchController } from './useColorPinSwatchController';

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
 * One palette pin in the viewport overlay. Primary click updates selection; context menu is delegated to the overlay host.
 * Wheel/pinch zoom bubbles naturally to the parent ViewportWrapper (no manual forwarding needed).
 */
export function ColorPinSwatch(props: ColorPinSwatchProps) {
  const { pin, ...rest } = props;
  const {
    wrapRef,
    pinWrap,
    swatchRing,
    isSelected,
    onMouseEnter,
    onMouseLeave,
    onPointerDown,
    onContextMenu,
  } = useColorPinSwatchController({ pin, ...rest });

  return (
    <div
      ref={wrapRef}
      style={pinWrap}
      data-pin-id={pin.id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    >
      <div style={swatchRing} data-selected={isSelected || undefined}>
        <ColorSwatch color={pin.color} size={14} withShadow aria-label="Color pin" />
      </div>
    </div>
  );
}
