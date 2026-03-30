import { useRef, useState, useCallback, useEffect, type RefObject } from 'react';
import { Tooltip } from '@mantine/core';
import { useCanvasContext } from '../context/CanvasContext';
import { usePaletteContext } from '../features/palette/PaletteContext';
import { useEditorContext } from '../context/EditorContext';
import { useToolContext } from '../context/ToolContext';
import { useColorContextMenu } from '../features/palette/useColorContextMenu';
import { useSelectionContextMenu } from '../features/palette/useSelectionContextMenu';
import { useCanvasMeasure } from '../hooks/useCanvasMeasure';
import { PinEditPopover } from '../features/palette/PinEditPopover';
import type { ColorSample } from '../types';

const DOT_R = 6;
const HIT_R = DOT_R + 5;

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

interface DragState {
  colorId: string;
  startPt: { x: number; y: number };
  originalSample: ColorSample;
  currentSample: ColorSample;
}

interface EditPin { colorId: string; position: { x: number; y: number } }

interface Props {
  canvasRef?: RefObject<HTMLCanvasElement | null>;
}

export function SamplePinsOverlay({ canvasRef }: Props) {
  const { sourceImage, viewportTransform, isSampling, filteredCanvasRef } = useCanvasContext();
  const resolvedCanvasRef = canvasRef ?? filteredCanvasRef;
  const { palette, groups, onPinMoveEnd } = usePaletteContext();
  const { selectedColorIds, onSelectColor, onToggleColorSelection, hoveredColorId, onHoverColor, hiddenPinIds } = useEditorContext();
  const { activeTool } = useToolContext();
  const openColorMenu = useColorContextMenu();
  const openSelectionMenu = useSelectionContextMenu();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [editPin, setEditPin] = useState<EditPin | null>(null);
  const hasDraggedRef = useRef(false);

  const { canvasRect, measure } = useCanvasMeasure(resolvedCanvasRef);
  useEffect(() => { measure(); }, [viewportTransform, measure]);
  useEffect(() => { if (!isSampling) measure(); }, [isSampling, measure]);

  const effectiveDrag = isSampling ? null : drag;
  const inSelectMode = activeTool === 'select' || activeTool === 'marquee';
  const sampledColors = palette.filter(c => c.sample && !hiddenPinIds.has(c.id));

  const handleMouseDown = useCallback((e: React.MouseEvent, colorId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (inSelectMode) return;
    const svg = svgRef.current;
    const color = palette.find(c => c.id === colorId);
    if (!svg || !color?.sample) return;
    hasDraggedRef.current = false;
    const startPt = clientToSvg(svg, e.clientX, e.clientY);
    const originalSample = { ...color.sample };
    setDrag({ colorId, startPt: { x: startPt.x, y: startPt.y }, originalSample, currentSample: originalSample });
  }, [palette, inSelectMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag || !svgRef.current || !sourceImage) return;
    hasDraggedRef.current = true;
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    const x = Math.round(Math.max(0, Math.min(sourceImage.width - 1, drag.originalSample.x + pt.x - drag.startPt.x)));
    const y = Math.round(Math.max(0, Math.min(sourceImage.height - 1, drag.originalSample.y + pt.y - drag.startPt.y)));
    setDrag(prev => prev ? { ...prev, currentSample: { ...prev.originalSample, x, y } } : null);
  }, [drag, sourceImage]);

  const handleMouseUp = useCallback(() => {
    if (drag && hasDraggedRef.current) onPinMoveEnd(drag.colorId, drag.currentSample);
    setDrag(null);
  }, [drag, onPinMoveEnd]);

  const handlePinClick = useCallback((e: React.MouseEvent, colorId: string) => {
    e.stopPropagation();
    if (hasDraggedRef.current) return;
    if (e.metaKey || e.shiftKey) onToggleColorSelection(colorId);
    else onSelectColor(colorId);
  }, [onSelectColor, onToggleColorSelection]);

  const handleContextMenu = useCallback((e: React.MouseEvent, colorId: string) => {
    e.preventDefault(); e.stopPropagation();
    const pos = { x: e.clientX, y: e.clientY };
    if (selectedColorIds.size > 1 && selectedColorIds.has(colorId)) {
      openSelectionMenu(pos);
    } else {
      openColorMenu(colorId, pos, { onEditStart: () => setEditPin({ colorId, position: pos }) });
    }
  }, [openColorMenu, openSelectionMenu, selectedColorIds]);

  if (!sourceImage || sampledColors.length === 0 || !canvasRect || canvasRect.width === 0) return null;

  const { width: imgW, height: imgH } = sourceImage;
  const inv = imgW / canvasRect.width;

  return (
    <>
      <svg
        ref={svgRef}
        style={{
          position: 'absolute', left: canvasRect.left, top: canvasRect.top,
          width: canvasRect.width, height: canvasRect.height,
          overflow: 'visible', pointerEvents: effectiveDrag ? 'all' : 'none',
        }}
        viewBox={`0 0 ${imgW} ${imgH}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {effectiveDrag && <rect x={0} y={0} width={imgW} height={imgH} fill="transparent" style={{ pointerEvents: 'all', cursor: 'grabbing' }} />}
        {sampledColors.map(c => {
          const activeSample = (effectiveDrag?.colorId === c.id) ? effectiveDrag.currentSample : c.sample!;
          const { x, y, radius } = activeSample;
          const isSelected = selectedColorIds.has(c.id);
          const isHovered = hoveredColorId === c.id;
          const group = c.groupId ? groups.find(g => g.id === c.groupId) : undefined;
          const tooltipLabel = group ? `${c.name || c.hex}\n${group.name}` : (c.name || c.hex);
          return (
            <g key={c.id} transform={`translate(${x}, ${y})`}>
              {radius > DOT_R * inv && (
                <circle r={radius} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5 * inv} />
              )}
              <Tooltip label={<span style={{ whiteSpace: 'pre-line' }}>{tooltipLabel}</span>} openDelay={300} withinPortal>
                <g
                  transform={`scale(${inv})`}
                  style={{ pointerEvents: 'auto', cursor: effectiveDrag?.colorId === c.id ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => handleMouseDown(e, c.id)}
                  onClick={(e) => handlePinClick(e, c.id)}
                  onMouseEnter={() => onHoverColor(c.id)}
                  onMouseLeave={() => onHoverColor(null)}
                  onContextMenu={(e) => handleContextMenu(e, c.id)}
                >
                  <circle r={HIT_R} fill="transparent" />
                  <circle r={DOT_R} fill={c.hex} stroke={isSelected ? 'var(--mantine-color-primary-4)' : isHovered ? 'var(--mantine-color-secondary-4)' : 'white'} strokeWidth={isSelected || isHovered ? 3 : 2} />
                </g>
              </Tooltip>
            </g>
          );
        })}
      </svg>
      {editPin && <PinEditPopover colorId={editPin.colorId} position={editPin.position} onClose={() => setEditPin(null)} />}
    </>
  );
}
