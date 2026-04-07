import { forwardRef, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Box } from '@mantine/core';
import { useMergedRef } from '@mantine/hooks';
import { Plus, Maximize2, Download } from 'lucide-react';
import { useEngine } from './engine/EngineContext';
import { useViewportState } from './engine/useViewportState';
import { usePaletteContext } from '../palette/PaletteContext';
import { useContextMenuStore } from '../../shared/contextMenuStore';
import { getPixelHex } from '../../utils/colorUtils';
import { downloadCanvas } from '../../utils/canvasUtils';

interface Props {
  children?: React.ReactNode;
  /** Rendered outside the zoom/pan transform — won't scale or move with the canvas. */
  overlayChildren?: React.ReactNode;
  variant?: 'filtered' | 'indexed';
}

export const CanvasViewport = forwardRef<HTMLCanvasElement, Props>(function CanvasViewport(
  { children, overlayChildren, variant = 'filtered' },
  ref
) {
  const engine = useEngine();
  const { transform: t, isDragging, handleWheel: onWheel, handleMouseDown: onMouseDown, resetTransform: onResetTransform, subscribeToTransform } = useViewportState(engine);
  const { isSampling } = useSyncExternalStore(engine.subscribe.bind(engine), engine.getToolState.bind(engine));
  const { onAddColorAtPosition } = usePaletteContext();
  const openMenu = useContextMenuStore(s => s.open);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformBoxRef = useRef<HTMLDivElement>(null);
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const mergedRef = useMergedRef(ref, localCanvasRef);

  // Apply viewport transforms imperatively — bypasses React's render cycle during drag.
  // Falls back to the React-managed style on initial render and after zoom/drag-end commits.
  useEffect(() => {
    return subscribeToTransform(({ panX, panY, scale }) => {
      const el = transformBoxRef.current;
      if (el) el.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    });
  }, [subscribeToTransform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    engine.setViewportSize(el.offsetWidth, el.offsetHeight);
    const ro = new ResizeObserver(() => engine.setViewportSize(el.offsetWidth, el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [engine]);

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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = localCanvasRef.current;
      const isFiltered = variant === 'filtered';
      const hex = isFiltered && canvas ? getPixelHex(canvas, e.clientX, e.clientY) : null;
      const sample =
        isFiltered && canvas
          ? (() => {
              const rect = canvas.getBoundingClientRect();
              const px = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
              const py = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
              return { x: px, y: py, radius: 1 };
            })()
          : null;
      openMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          ...(isFiltered && hex && sample
            ? [
                {
                  label: 'Add color here',
                  icon: <Plus size={14} />,
                  onClick: () => onAddColorAtPosition(sample, hex),
                },
                { type: 'divider' as const },
              ]
            : []),
          { label: 'Fit to view', icon: <Maximize2 size={14} />, onClick: onResetTransform },
          ...(canvas ? [{ label: 'Download image', icon: <Download size={14} />, onClick: () => downloadCanvas(canvas) }] : []),
        ],
      });
    },
    [variant, openMenu, onAddColorAtPosition, onResetTransform]
  );

  const cursor = isSampling ? 'crosshair' : isDragging ? 'grabbing' : 'grab';
  const transformCss = `translate(${t.panX}px, ${t.panY}px) scale(${t.scale})`;

  return (
    <Box style={{ background: 'var(--mantine-color-dark-9)', flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
      <Box
        ref={containerRef}
        data-canvas-viewport=""
        data-testid={`canvas-viewport-${variant}`}
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor }}
        onMouseDown={
          isSampling
            ? (e) => {
                if (e.button === 1) onMouseDown(e);
              }
            : onMouseDown
        }
        onDoubleClick={isSampling ? undefined : onResetTransform}
        onContextMenu={handleContextMenu}
      >
        <Box
          ref={transformBoxRef}
          style={{
            transformOrigin: '0 0',
            transform: transformCss,
            willChange: 'transform',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box style={{ position: 'relative', lineHeight: 0 }}>
            <canvas
              ref={mergedRef}
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
            />
            {children}
          </Box>
        </Box>
        {overlayChildren}
      </Box>
    </Box>
  );
});
