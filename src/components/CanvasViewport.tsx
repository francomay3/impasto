import { forwardRef, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { Plus, Maximize2, Tag } from 'lucide-react';
import { useCanvasContext } from '../context/CanvasContext';
import { usePaletteContext } from '../features/palette/PaletteContext';
import { useContextMenu } from '../context/ContextMenuContext';
import { rgbToHex } from '../utils/colorUtils';

interface Props {
  children?: React.ReactNode;
  /** Rendered outside the zoom/pan transform — won't scale or move with the canvas. */
  overlayChildren?: React.ReactNode;
  variant?: 'filtered' | 'indexed';
}

function getPixelHex(canvas: HTMLCanvasElement, clientX: number, clientY: number): string | null {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const px = Math.round(x * (canvas.width / rect.width));
  const py = Math.round(y * (canvas.height / rect.height));
  const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
  return rgbToHex(r, g, b);
}

export const CanvasViewport = forwardRef<HTMLCanvasElement, Props>(
  function CanvasViewport({ children, overlayChildren, variant = 'filtered' }, ref) {
    const { viewportTransform: t, onWheel, onMouseDown, onResetTransform, isDragging, isSampling, showLabels, onToggleLabels } = useCanvasContext();
    const { onAddColorAtPosition } = usePaletteContext();
    const { open: openMenu } = useContextMenu();
    const containerRef = useRef<HTMLDivElement>(null);
    const localCanvasRef = useRef<HTMLCanvasElement>(null);
    const mergedRef = useMergedRef(ref, localCanvasRef);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const handler = (e: WheelEvent) => {
        if (isSampling && e.altKey) return;
        onWheel(e, el.getBoundingClientRect());
      };
      el.addEventListener('wheel', handler, { passive: false });
      return () => el.removeEventListener('wheel', handler);
    }, [onWheel, isSampling]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = localCanvasRef.current;
      const isFiltered = variant === 'filtered';
      const hex = isFiltered && canvas ? getPixelHex(canvas, e.clientX, e.clientY) : null;
      const sample = isFiltered && canvas ? (() => {
        const rect = canvas.getBoundingClientRect();
        const px = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
        const py = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
        return { x: px, y: py, radius: 1 };
      })() : null;
      openMenu({ x: e.clientX, y: e.clientY, items: [
        ...(isFiltered && hex && sample ? [
          { label: 'Add color here', icon: <Plus size={14} />, onClick: () => onAddColorAtPosition(sample, hex) },
          { type: 'divider' as const },
        ] : []),
        { label: 'Fit to view', icon: <Maximize2 size={14} />, onClick: onResetTransform },
        ...(isFiltered ? [
          { label: showLabels ? 'Hide labels' : 'Show labels', icon: <Tag size={14} />, onClick: onToggleLabels },
        ] : []),
      ]});
    }, [variant, openMenu, onAddColorAtPosition, onResetTransform, showLabels, onToggleLabels]);

    const cursor = isSampling ? 'crosshair' : isDragging ? 'grabbing' : 'grab';
    const transformCss = `translate(${t.panX}px, ${t.panY}px) scale(${t.scale})`;

    return (
      <Box style={{ background: 'var(--mantine-color-dark-9)', flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
        <Box
          ref={containerRef}
          data-canvas-viewport=""
          data-testid={`canvas-viewport-${variant}`}
          style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor }}
          onMouseDown={isSampling ? (e) => { if (e.button === 1) onMouseDown(e); } : onMouseDown}
          onDoubleClick={isSampling ? undefined : onResetTransform}
          onContextMenu={handleContextMenu}
        >
          <Box style={{ transformOrigin: '0 0', transform: transformCss, willChange: 'transform', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box style={{ position: 'relative', lineHeight: 0 }}>
              <canvas ref={mergedRef} style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', display: 'block' }} />
              {children}
            </Box>
          </Box>
          {overlayChildren}
        </Box>
      </Box>
    );
  }
);
