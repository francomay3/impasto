import { forwardRef, useRef, useEffect } from 'react';
import { Text, Box } from '@mantine/core';
import type { ViewportTransform } from '../hooks/useViewportTransform';

interface Props {
  label: string;
  children?: React.ReactNode;
  viewportTransform?: ViewportTransform;
  onWheel?: (e: WheelEvent, rect: DOMRect) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  isSampling?: boolean;
}

export const CanvasViewport = forwardRef<HTMLCanvasElement, Props>(
  function CanvasViewport(
    { label, children, viewportTransform, onWheel, onMouseDown, onDoubleClick, isDragging, isSampling },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = containerRef.current;
      if (!el || !onWheel) return;
      const handler = (e: WheelEvent) => {
        if (isSampling && e.altKey) return; // Alt+Scroll reserved for brush size during sampling
        onWheel(e, el.getBoundingClientRect());
      };
      el.addEventListener('wheel', handler, { passive: false });
      return () => el.removeEventListener('wheel', handler);
    }, [onWheel, isSampling]);

    const t = viewportTransform;
    const transformCss = t
      ? `translate(${t.panX}px, ${t.panY}px) scale(${t.scale})`
      : undefined;

    const cursor = isSampling
      ? 'crosshair'
      : isDragging
      ? 'grabbing'
      : onMouseDown
      ? 'grab'
      : 'default';

    return (
      <Box style={{ background: '#111', flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
        <div
          ref={containerRef}
          style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor }}
          onMouseDown={onMouseDown && isSampling
            ? (e) => { if (e.button === 1) onMouseDown(e); } // during sampling, only middle-click pans
            : onMouseDown}
          onDoubleClick={isSampling ? undefined : onDoubleClick}
        >
          <div
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
            <canvas
              ref={ref}
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
            />
            {children}
          </div>
        </div>
        <Text id="tex!" size="xs" c="white" mb={4} pos="absolute" top="2px" left="2px" style={{ textShadow: '0 1px 2px #000, 0 0 8px #000', opacity: 0.7 }}>{label}</Text>
      </Box>
    );
  }
);
