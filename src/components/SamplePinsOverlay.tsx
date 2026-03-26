import { useRef, useState, useCallback } from 'react';
import { Trash2, RefreshCw, PinOff } from 'lucide-react';
import { useCanvasContext } from '../context/CanvasContext';
import { usePaletteContext } from '../context/PaletteContext';
import { useEditorContext } from '../context/EditorContext';
import { useContextMenu } from '../context/ContextMenuContext';
import { estimateLabelWidth } from '../utils/labelLayout';
import type { ColorSample } from '../types';

const DOT_R = 6;
const HIT_R = DOT_R + 5;
const LABEL_H = 20;
const H_PAD = 14;

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

interface DragState {
  colorId: string;
  startPt: { x: number; y: number };
  originalSample: ColorSample;
}

export function SamplePinsOverlay() {
  const { sourceImage, viewportTransform, isSampling, showLabels } = useCanvasContext();
  const { palette, onDeleteColor, onStartSampling, onMoveSamplePin, onRemoveSamplePin } = usePaletteContext();
  const { selectedColorId, onSelectColor } = useEditorContext();
  const { open: openMenu } = useContextMenu();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const hasDraggedRef = useRef(false);

  const sampledColors = palette.filter(c => c.sample);

  const handleMouseDown = useCallback((e: React.MouseEvent, colorId: string) => {
    e.stopPropagation();
    const svg = svgRef.current;
    const color = palette.find(c => c.id === colorId);
    if (!svg || !color?.sample) return;
    hasDraggedRef.current = false;
    const startPt = clientToSvg(svg, e.clientX, e.clientY);
    setDrag({ colorId, startPt: { x: startPt.x, y: startPt.y }, originalSample: { ...color.sample } });
  }, [palette]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag || !svgRef.current || !sourceImage) return;
    hasDraggedRef.current = true;
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    const x = Math.round(Math.max(0, Math.min(sourceImage.width - 1, drag.originalSample.x + pt.x - drag.startPt.x)));
    const y = Math.round(Math.max(0, Math.min(sourceImage.height - 1, drag.originalSample.y + pt.y - drag.startPt.y)));
    onMoveSamplePin(drag.colorId, { ...drag.originalSample, x, y });
  }, [drag, sourceImage, onMoveSamplePin]);

  const handleMouseUp = useCallback(() => setDrag(null), []);

  const handleContextMenu = useCallback((e: React.MouseEvent, colorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu({ x: e.clientX, y: e.clientY, items: [
      { label: 'Resample', icon: <RefreshCw size={14} />, onClick: () => onStartSampling(colorId) },
      { label: 'Remove pin', icon: <PinOff size={14} />, onClick: () => onRemoveSamplePin(colorId) },
      { type: 'divider' as const },
      { label: 'Delete color', icon: <Trash2 size={14} />, onClick: () => onDeleteColor(colorId) },
    ]});
  }, [openMenu, onStartSampling, onRemoveSamplePin, onDeleteColor]);

  if (!sourceImage || isSampling || sampledColors.length === 0) return null;

  const { width: imgW, height: imgH } = sourceImage;
  const inv = 1 / viewportTransform.scale;

  return (
    <svg
      ref={svgRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: drag ? 'all' : 'none' }}
      viewBox={`0 0 ${imgW} ${imgH}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {drag && <rect x={0} y={0} width={imgW} height={imgH} fill="transparent" style={{ pointerEvents: 'all', cursor: 'grabbing' }} />}

      {sampledColors.map(c => {
        const { x, y, radius } = c.sample!;
        const isSelected = selectedColorId === c.id;
        const label = c.name || c.hex;
        const lw = estimateLabelWidth(label);

        return (
          <g key={c.id} transform={`translate(${x}, ${y})`}>
            {radius * viewportTransform.scale > DOT_R && (
              <circle r={radius} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5 * inv} />
            )}
            <g
              transform={`scale(${inv})`}
              style={{ pointerEvents: 'auto', cursor: drag?.colorId === c.id ? 'grabbing' : 'grab' }}
              onMouseDown={(e) => handleMouseDown(e, c.id)}
              onClick={(e) => { e.stopPropagation(); if (!hasDraggedRef.current) onSelectColor(selectedColorId === c.id ? null : c.id); }}
              onContextMenu={(e) => handleContextMenu(e, c.id)}
            >
              <circle r={HIT_R} fill="transparent" />
              <circle r={DOT_R} fill={c.hex} stroke={isSelected ? 'var(--mantine-color-primary-4)' : 'white'} strokeWidth={isSelected ? 3 : 2} />
              {showLabels && (
                <g transform={`translate(${DOT_R + 6}, ${-LABEL_H / 2})`}>
                  <rect x={0} y={0} width={lw} height={LABEL_H} rx={4} fill="rgba(0,0,0,0.7)" />
                  <text x={H_PAD / 2} y={14} fontSize={11} fontFamily="monospace" letterSpacing="0.03em" fill="rgba(255,255,255,0.92)" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {label}
                  </text>
                </g>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
