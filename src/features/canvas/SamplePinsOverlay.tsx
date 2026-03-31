import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import type { RefObject } from 'react';
import { useCanvasContext } from './CanvasContext';
import { usePaletteContext } from '../palette/PaletteContext';
import { useEditorStore } from '../editor/editorStore';
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
  const { sourceImage, viewportTransform, isSampling, filteredCanvasRef, activeTool } = useCanvasContext();
  const resolvedCanvasRef = canvasRef ?? filteredCanvasRef;
  const { palette, groups, onPinMoveEnd } = usePaletteContext();
  const selectedColorIds = useEditorStore(s => s.selectedColorIds);
  const hoveredColorId = useEditorStore(s => s.hoveredColorId);
  const hiddenPinIds = useEditorStore(s => s.hiddenPinIds);
  const selectColor = useEditorStore(s => s.selectColor);
  const toggleColorSelection = useEditorStore(s => s.toggleColorSelection);
  const setHoveredColorId = useEditorStore(s => s.setHoveredColorId);
  const openColorMenu = useColorContextMenu();
  const openSelectionMenu = useSelectionContextMenu();
  const svgRef = useRef<SVGSVGElement>(null);
  const [editPin, setEditPin] = useState<EditPin | null>(null);

  const { canvasRect, measure } = useCanvasMeasure(resolvedCanvasRef);
  // Only re-measure on zoom (scale change) — pan is handled by the CSS transform layer.
  const { scale } = viewportTransform;
  useEffect(() => { measure(); }, [scale, measure]);
  useEffect(() => { if (!isSampling) measure(); }, [isSampling, measure]);

  const inSelectMode = activeTool === 'select' || activeTool === 'marquee';
  const sampledColors = useMemo(
    () => palette.filter((c) => c.sample && !hiddenPinIds.has(c.id)),
    [palette, hiddenPinIds]
  );

  const { drag: effectiveDragRaw, hasDraggedRef, handleMouseDown, handleMouseMove, handleMouseUp } =
    usePinDrag({ palette, sourceImage, svgRef, onPinMoveEnd, inSelectMode });
  const effectiveDrag = isSampling ? null : effectiveDragRaw;

  const handlePinClick = useCallback(
    (e: React.MouseEvent, colorId: string) => {
      e.stopPropagation();
      if (hasDraggedRef.current) return;
      if (e.metaKey || e.shiftKey) toggleColorSelection(colorId);
      else selectColor(colorId);
    },
    [selectColor, toggleColorSelection, hasDraggedRef]
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

  const imgW = sourceImage?.width ?? 0;
  const imgH = sourceImage?.height ?? 0;
  const inv = useMemo(
    () => (canvasRect && canvasRect.width > 0 ? imgW / canvasRect.width : 1),
    [imgW, canvasRect]
  );

  if (!sourceImage || sampledColors.length === 0 || !canvasRect || canvasRect.width === 0)
    return null;

  return (
    <>
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
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
              onMouseEnter={setHoveredColorId}
              onMouseLeave={() => setHoveredColorId(null)}
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
