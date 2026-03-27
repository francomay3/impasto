import { useRef, useState, useCallback, useEffect, type RefObject } from 'react';
import { Tooltip } from '@mantine/core';
import { useCanvasContext } from '../context/CanvasContext';
import { usePaletteContext } from '../context/PaletteContext';
import { useEditorContext } from '../context/EditorContext';
import { useColorContextMenu } from '../hooks/useColorContextMenu';
import { useCanvasMeasure } from '../hooks/useCanvasMeasure';
import { PinEditPopover } from './PinEditPopover';
import type { ColorSample } from '../types';

const DOT_R = 6; // desired screen pixels
const HIT_R = DOT_R + 5; // desired screen pixels

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
  /** Canvas to measure position from. Defaults to filteredCanvasRef from CanvasContext. */
  canvasRef?: RefObject<HTMLCanvasElement | null>;
}

export function SamplePinsOverlay({ canvasRef }: Props) {
  const { sourceImage, viewportTransform, isSampling, filteredCanvasRef } = useCanvasContext();
  const resolvedCanvasRef = canvasRef ?? filteredCanvasRef;
  const { palette, groups, onPinMoveEnd } = usePaletteContext();
  const { selectedColorId, onSelectColor, hoveredColorId, onHoverColor, hiddenPinIds } = useEditorContext();
  const openColorMenu = useColorContextMenu();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [editPin, setEditPin] = useState<EditPin | null>(null);
  const hasDraggedRef = useRef(false);

  const { canvasRect, measure } = useCanvasMeasure(resolvedCanvasRef);
  useEffect(() => { measure(); }, [viewportTransform, measure]);
  useEffect(() => { if (isSampling) setDrag(null); else measure(); }, [isSampling, measure]);

  const sampledColors = palette.filter(c => c.sample && !hiddenPinIds.has(c.id));

  const handleMouseDown = useCallback((e: React.MouseEvent, colorId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const svg = svgRef.current;
    const color = palette.find(c => c.id === colorId);
    if (!svg || !color?.sample) return;
    hasDraggedRef.current = false;
    const startPt = clientToSvg(svg, e.clientX, e.clientY);
    const originalSample = { ...color.sample };
    setDrag({ colorId, startPt: { x: startPt.x, y: startPt.y }, originalSample, currentSample: originalSample });
  }, [palette]);

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

  const handleContextMenu = useCallback((e: React.MouseEvent, colorId: string) => {
    e.preventDefault(); e.stopPropagation();
    const pos = { x: e.clientX, y: e.clientY };
    openColorMenu(colorId, pos, { onEditStart: () => setEditPin({ colorId, position: pos }) });
  }, [openColorMenu]);

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
          overflow: 'visible', pointerEvents: drag ? 'all' : 'none',
        }}
        viewBox={`0 0 ${imgW} ${imgH}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {drag && <rect x={0} y={0} width={imgW} height={imgH} fill="transparent" style={{ pointerEvents: 'all', cursor: 'grabbing' }} />}
        {sampledColors.map(c => {
          const activeSample = (drag?.colorId === c.id) ? drag.currentSample : c.sample!;
          const { x, y, radius } = activeSample;
          const isSelected = selectedColorId === c.id;
          const isHovered = hoveredColorId === c.id;
          const group = c.groupId ? groups.find(g => g.id === c.groupId) : undefined;
          const label = c.name || c.hex;
          const tooltipLabel = group ? `${label}\n${group.name}` : label;
          return (
            <g key={c.id} transform={`translate(${x}, ${y})`}>
              {radius > DOT_R * inv && (
                <circle r={radius} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5 * inv} />
              )}
              <Tooltip label={<span style={{ whiteSpace: 'pre-line' }}>{tooltipLabel}</span>} openDelay={300} withinPortal>
                <g
                  transform={`scale(${inv})`}
                  style={{ pointerEvents: 'auto', cursor: drag?.colorId === c.id ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => handleMouseDown(e, c.id)}
                  onClick={(e) => { e.stopPropagation(); if (!hasDraggedRef.current) onSelectColor(selectedColorId === c.id ? null : c.id); }}
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
