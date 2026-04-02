import { createPortal } from 'react-dom';
import { Box } from '@mantine/core';
import type { MarqueeOverlayProps } from './engine/overlayProps.types';

export function MarqueeSelectOverlay({
  activeTool, isHoveringPin, marqueeDrag, onMouseDown, onClick, onMouseMove, onMouseLeave, onContextMenu,
}: MarqueeOverlayProps) {
  if (activeTool !== 'select' && activeTool !== 'marquee') return null;

  const rectStyle = marqueeDrag
    ? {
        position: 'fixed' as const,
        left: Math.min(marqueeDrag.start.x, marqueeDrag.current.x),
        top: Math.min(marqueeDrag.start.y, marqueeDrag.current.y),
        width: Math.abs(marqueeDrag.current.x - marqueeDrag.start.x),
        height: Math.abs(marqueeDrag.current.y - marqueeDrag.start.y),
        border: '1px solid var(--mantine-color-primary-4)',
        background: 'color-mix(in srgb, var(--mantine-color-primary-4) 15%, transparent)',
        pointerEvents: 'none' as const,
        zIndex: 6,
      }
    : null;

  return (
    <>
      <Box
        data-no-pan={activeTool === 'marquee' ? '' : undefined}
        style={{
          position: 'absolute', inset: 0,
          cursor: activeTool === 'marquee' ? 'crosshair' : isHoveringPin ? 'pointer' : 'inherit',
          zIndex: 5, pointerEvents: 'all',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onClick={onClick}
        onMouseLeave={onMouseLeave}
        onContextMenu={onContextMenu}
      />
      {rectStyle && createPortal(<Box style={rectStyle} />, document.body)}
    </>
  );
}
