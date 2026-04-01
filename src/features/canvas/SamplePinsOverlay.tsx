import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useCanvasMeasure } from './useCanvasMeasure';
import { SamplePin } from './SamplePin';
import type { SamplePinsOverlayProps } from './engine/overlayProps.types';

interface Props extends SamplePinsOverlayProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function SamplePinsOverlay({
  canvasRef, pins, groups, selectedIds, hoveredId, pinDrag, isSampling,
  viewportScale, imgWidth, imgHeight,
  onPinMouseDown, onPinClick, onPinMouseEnter, onPinMouseLeave, onContextMenu,
}: Props) {
  const { canvasRect, measure } = useCanvasMeasure(canvasRef);

  useEffect(() => { measure(); }, [viewportScale, measure]);
  useEffect(() => { if (!isSampling) measure(); }, [isSampling, measure]);

  const effectiveDrag = isSampling ? null : pinDrag;
  const inv = canvasRect && canvasRect.width > 0 ? imgWidth / canvasRect.width : 1;

  if (!imgWidth || pins.length === 0 || !canvasRect || canvasRect.width === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        overflow: 'visible', pointerEvents: effectiveDrag ? 'all' : 'none',
      }}
      viewBox={`0 0 ${imgWidth} ${imgHeight}`}
    >
      {effectiveDrag && (
        <rect
          x={0} y={0} width={imgWidth} height={imgHeight}
          fill="transparent"
          style={{ pointerEvents: 'all', cursor: 'grabbing' }}
        />
      )}
      {pins.map((c) => {
        const activeSample = effectiveDrag?.colorId === c.id ? effectiveDrag.currentSample : c.sample!;
        return (
          <SamplePin
            key={c.id}
            color={c}
            group={c.groupId ? groups.find((g) => g.id === c.groupId) : undefined}
            isSelected={selectedIds.has(c.id)}
            isHovered={hoveredId === c.id}
            activeSample={activeSample}
            isDragging={effectiveDrag?.colorId === c.id}
            inv={inv}
            onMouseDown={onPinMouseDown}
            onClick={onPinClick}
            onMouseEnter={onPinMouseEnter}
            onMouseLeave={onPinMouseLeave}
            onContextMenu={onContextMenu}
          />
        );
      })}
    </svg>
  );
}
