import { Menu, Portal } from '@mantine/core';
import { GitMerge, PlusCircle, Trash2 } from 'lucide-react';
import { useCallback, useLayoutEffect, useState, type CSSProperties } from 'react';
import { throttle } from '../infra/throttle';
import { INPUT_THROTTLE_MS } from '../core/engineConstants';
import { ColorPinSwatch } from './ColorPinSwatch';
import { useImpastoEngine } from '../core/ImpastoEngineContext';
import { useImpastoColorPins } from './useImpastoColorPins';
import { useImpastoViewportTransform } from '../hooks/useImpastoViewportTransform';
import { resolveColorPinContextScope } from './resolveColorPinContextScope';
import { useViewportSurface } from '../viewport/ViewportSurfaceContext';
import { buildColorPinOverlayLayouts } from './viewports/ViewportColorPins';
import { useColorPinOverlayImageDrag } from './useColorPinOverlayImageDrag';

const shellStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 1,
};

type PinContextMenuModel = {
  readonly clientX: number;
  readonly clientY: number;
  readonly scopePinIds: readonly string[];
};

/**
 * Fills the viewport host (`position: relative`, same displayed size as the canvas sibling). Layout is computed
 * against the engine canvas for correct DPR / backing-store mapping; pins handle their own interaction.
 *
 * Clearing pin selection happens on canvas pointer-down before tools (viewport canvas host),
 * not via overlay click-outside. One context menu instance scopes actions via `resolveColorPinContextScope`.
 */
export function ColorPinsOverlay() {
  const surface = useViewportSurface();
  const engine = useImpastoEngine();
  const pins = useImpastoColorPins();
  const transform = useImpastoViewportTransform();
  const pinDrag = useColorPinOverlayImageDrag(surface, transform);
  const [, bumpResize] = useState(0);
  const [pinMenu, setPinMenu] = useState<null | PinContextMenuModel>(null);

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
      const scopePinIds = resolveColorPinContextScope(
        detail.pinId,
        engine.selection.getAll(),
      );
      setPinMenu({
        clientX: detail.clientX,
        clientY: detail.clientY,
        scopePinIds,
      });
    },
    [engine],
  );

  const layouts = buildColorPinOverlayLayouts(pins, transform, canvas);

  const deleteLabel =
    pinMenu && pinMenu.scopePinIds.length > 1
      ? `Delete ${pinMenu.scopePinIds.length} pins`
      : 'Delete';

  return (
    <div style={shellStyle} data-testid="color-pins-overlay">
      {pinMenu && (
        <Portal>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 299 }}
            onMouseDown={() => {
              setPinMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setPinMenu(null);
            }}
          />
          <Menu
            opened
            onClose={() => {
              setPinMenu(null);
            }}
            withinPortal={false}
            closeOnClickOutside={false}
            zIndex={300}
            width={210}
            shadow="md"
            position="bottom-start"
          >
            <Menu.Target>
              <div
                style={{
                  position: 'fixed',
                  left: pinMenu.clientX,
                  top: pinMenu.clientY,
                  width: 0,
                  height: 0,
                }}
              />
            </Menu.Target>
            <Menu.Dropdown
              style={{
                background: 'var(--mantine-color-dark-7)',
                border: '1px solid var(--mantine-color-dark-4)',
              }}
            >
              {pinMenu.scopePinIds.length > 1 && (
                <>
                  <Menu.Item
                    leftSection={<GitMerge size={14} />}
                    onClick={() => {
                      engine.colorPins.mergePinsFromIds(pinMenu.scopePinIds);
                      setPinMenu(null);
                    }}
                  >
                    Merge pins
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<PlusCircle size={14} />}
                    onClick={() => {
                      engine.colorPins.addMiddlePinFromIds(pinMenu.scopePinIds);
                      setPinMenu(null);
                    }}
                  >
                    Add middle color pin
                  </Menu.Item>
                </>
              )}
              <Menu.Item
                leftSection={<Trash2 size={14} />}
                color="red"
                onClick={() => {
                  engine.colorPins.removeMany(pinMenu.scopePinIds);
                  setPinMenu(null);
                }}
              >
                {deleteLabel}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Portal>
      )}
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
