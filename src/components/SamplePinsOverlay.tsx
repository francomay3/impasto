import { useState, useLayoutEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip, Popover, Box } from '@mantine/core';
import { usePaletteContext } from '../context/PaletteContext';
import { useCanvasContext } from '../context/CanvasContext';
import { estimateLabelWidth, resolveLabelOffsets } from '../utils/labelLayout';
import { PinPopover } from './PinPopover';
import type { CSSProperties } from 'react';

const DOT_R = 6;

interface ActivePin {
  id: string;
  name: string;
  groupId: string | null;
}

export function SamplePinsOverlay() {
  const { palette, groups, onRenameColor, onSetColorGroup } = usePaletteContext();
  const { filteredCanvasRef, viewportTransform, isSampling, showLabels } = useCanvasContext();
  const [activePin, setActivePin] = useState<ActivePin | null>(null);
  type Layout = { canvas: DOMRect; container: DOMRect; cw: number; ch: number; target: HTMLElement };
  const [layout, setLayout] = useState<Layout | null>(null);

  useLayoutEffect(() => {
    const canvas = filteredCanvasRef.current;
    const container = canvas?.closest('[data-canvas-viewport]') as HTMLElement | null;
    if (!canvas || !container) return;
    const update = () => setLayout({
      canvas: canvas.getBoundingClientRect(),
      container: container.getBoundingClientRect(),
      cw: canvas.width,
      ch: canvas.height,
      target: container,
    });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [viewportTransform, filteredCanvasRef]);

  const sampledColors = palette.filter(c => c.sample);
  if (!layout || layout.cw === 0 || sampledColors.length === 0 || isSampling) return null;

  const sx = layout.canvas.width / layout.cw;
  const sy = layout.canvas.height / layout.ch;
  const ox = layout.canvas.left - layout.container.left;
  const oy = layout.canvas.top - layout.container.top;

  const pins = sampledColors.map(c => ({
    px: ox + c.sample!.x * sx,
    py: oy + c.sample!.y * sy,
    labelWidth: estimateLabelWidth(c.name || c.hex),
  }));
  const labelOffsets = resolveLabelOffsets(pins, DOT_R);

  const commitAndClose = () => {
    if (activePin) {
      onRenameColor(activePin.id, activePin.name.trim());
      onSetColorGroup(activePin.id, activePin.groupId ?? undefined);
    }
    setActivePin(null);
  };

  const cancelAndClose = () => setActivePin(null);

  return createPortal(
    <Box style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {sampledColors.map((c, i) => {
        const { radius } = c.sample!;
        const { px, py } = pins[i];
        const cr = radius * sx;
        const labelY = py + labelOffsets[i];
        const label = c.name || c.hex;
        const isActive = activePin?.id === c.id;

        return (
          <Fragment key={c.id}>
            {cr > DOT_R && (
              <Box style={{
                position: 'absolute',
                left: px - cr, top: py - cr,
                width: cr * 2, height: cr * 2,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.65)',
                boxShadow: '0 0 0 1.5px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
              }} />
            )}

            <Popover
              opened={!!isActive}
              onClose={cancelAndClose}
              position="bottom"
              withArrow
              shadow="md"
              closeOnClickOutside={false}
            >
              <Popover.Target>
                <Tooltip label={label} openDelay={300} position="top" disabled={!!isActive || showLabels}>
                  <Box
                    style={{ position: 'absolute', left: px - DOT_R, top: py - DOT_R, pointerEvents: 'auto', cursor: 'pointer' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      if (isActive) return;
                      setActivePin({ id: c.id, name: c.name || '', groupId: c.groupId ?? null });
                    }}
                  >
                    <Box style={{
                      width: DOT_R * 2, height: DOT_R * 2, borderRadius: '50%',
                      background: c.hex, border: '2.5px solid white',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.5)',
                    }} />
                  </Box>
                </Tooltip>
              </Popover.Target>
              <Popover.Dropdown>
                {isActive && activePin && (
                  <PinPopover
                    name={activePin.name}
                    hex={c.hex}
                    groupId={activePin.groupId}
                    groups={groups}
                    onNameChange={(name) => setActivePin(p => p && { ...p, name })}
                    onGroupChange={(groupId) => setActivePin(p => p && { ...p, groupId })}
                    onCommit={commitAndClose}
                    onCancel={cancelAndClose}
                  />
                )}
              </Popover.Dropdown>
            </Popover>

            {showLabels && !isActive && (
              <Box
                style={{ position: 'absolute', left: px + DOT_R + 6, top: labelY, pointerEvents: 'auto', cursor: 'pointer' }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setActivePin({ id: c.id, name: c.name || '', groupId: c.groupId ?? null })}
              >
                <Box style={labelStyle}>{label}</Box>
              </Box>
            )}
          </Fragment>
        );
      })}
    </Box>,
    layout.target
  );
}

const labelStyle: CSSProperties = {
  height: 20, padding: '0 7px',
  borderRadius: 4, fontSize: 11,
  lineHeight: '20px', fontFamily: 'monospace',
  letterSpacing: '0.03em', whiteSpace: 'nowrap',
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(6px)',
  color: 'rgba(255,255,255,0.92)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
  userSelect: 'none',
};
