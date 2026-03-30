import { useRef, useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useCanvasContext } from './CanvasContext';
import { usePaletteContext } from '../palette/PaletteContext';
import { useEditorContext } from '../editor/EditorContext';
import { useToolContext } from './ToolContext';
import { useColorContextMenu } from '../palette/useColorContextMenu';
import { useSelectionContextMenu } from '../palette/useSelectionContextMenu';
import { useCanvasMeasure } from './useCanvasMeasure';
import { PinEditPopover } from '../palette/PinEditPopover';
import { usePinDrag } from './usePinDrag';
import { SamplePin } from './SamplePin';

interface EditPin {
  colorId: string;
  position: { x: number; y: number };
}

interface Props {
  canvasRef?: RefObject<HTMLCanvasElement | null>;
}

export function SamplePinsOverlay({ canvasRef }: Props) {
  const { sourceImage, viewportTransform, isSampling, filteredCanvasRef } = useCanvasContext();
  const resolvedCanvasRef = canvasRef ?? filteredCanvasRef;
  const { palette, groups, onPinMoveEnd } = usePaletteContext();
  const { selectedColorIds, onSelectColor, onToggleColorSelection, hoveredColorId, onHoverColor, hiddenPinIds } =
    useEditorContext();
  const { activeTool } = useToolContext();
  const openColorMenu = useColorContextMenu();
  const openSelectionMenu = useSelectionContextMenu();
  const svgRef = useRef<SVGSVGElement>(null);
  const [editPin, setEditPin] = useState<EditPin | null>(null);

  const { canvasRect, measure } = useCanvasMeasure(resolvedCanvasRef);
  useEffect(() => { measure(); }, [viewportTransform, measure]);
  useEffect(() => { if (!isSampling) measure(); }, [isSampling, measure]);

  const inSelectMode = activeTool === 'select' || activeTool === 'marquee';
  const sampledColors = palette.filter((c) => c.sample && !hiddenPinIds.has(c.id));

  const { drag: effectiveDragRaw, hasDraggedRef, handleMouseDown, handleMouseMove, handleMouseUp } =
    usePinDrag({ palette, sourceImage, svgRef, onPinMoveEnd, inSelectMode });
  const effectiveDrag = isSampling ? null : effectiveDragRaw;

  const handlePinClick = useCallback(
    (e: React.MouseEvent, colorId: string) => {
      e.stopPropagation();
      if (hasDraggedRef.current) return;
      if (e.metaKey || e.shiftKey) onToggleColorSelection(colorId);
      else onSelectColor(colorId);
    },
    [onSelectColor, onToggleColorSelection, hasDraggedRef]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, colorId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = { x: e.clientX, y: e.clientY };
      if (selectedColorIds.size > 1 && selectedColorIds.has(colorId)) {
        openSelectionMenu(pos);
      } else {
        openColorMenu(colorId, pos, { onEditStart: () => setEditPin({ colorId, position: pos }) });
      }
    },
    [openColorMenu, openSelectionMenu, selectedColorIds]
  );

  if (!sourceImage || sampledColors.length === 0 || !canvasRect || canvasRect.width === 0)
    return null;

  const { width: imgW, height: imgH } = sourceImage;
  const inv = imgW / canvasRect.width;

  return (
    <>
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          left: canvasRect.left,
          top: canvasRect.top,
          width: canvasRect.width,
          height: canvasRect.height,
          overflow: 'visible',
          pointerEvents: effectiveDrag ? 'all' : 'none',
        }}
        viewBox={`0 0 ${imgW} ${imgH}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {effectiveDrag && (
          <rect
            x={0} y={0} width={imgW} height={imgH}
            fill="transparent"
            style={{ pointerEvents: 'all', cursor: 'grabbing' }}
          />
        )}
        {sampledColors.map((c) => {
          const activeSample =
            effectiveDrag?.colorId === c.id ? effectiveDrag.currentSample : c.sample!;
          return (
            <SamplePin
              key={c.id}
              color={c}
              group={c.groupId ? groups.find((g) => g.id === c.groupId) : undefined}
              isSelected={selectedColorIds.has(c.id)}
              isHovered={hoveredColorId === c.id}
              activeSample={activeSample}
              isDragging={effectiveDrag?.colorId === c.id}
              inv={inv}
              onMouseDown={handleMouseDown}
              onClick={handlePinClick}
              onMouseEnter={onHoverColor}
              onMouseLeave={() => onHoverColor(null)}
              onContextMenu={handleContextMenu}
            />
          );
        })}
      </svg>
      {editPin && (
        <PinEditPopover
          colorId={editPin.colorId}
          position={editPin.position}
          onClose={() => setEditPin(null)}
        />
      )}
    </>
  );
}
