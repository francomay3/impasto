import { useState, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import type { Color, ColorSample } from '../../types';

interface DragState {
  colorId: string;
  startPt: { x: number; y: number };
  originalSample: ColorSample;
  currentSample: ColorSample;
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(svg.getScreenCTM()!.inverse());
}

interface Options {
  palette: Color[];
  sourceImage: { width: number; height: number } | null;
  svgRef: RefObject<SVGSVGElement | null>;
  onPinMoveEnd: (colorId: string, sample: ColorSample) => void;
  inSelectMode: boolean;
}

export function usePinDrag({ palette, sourceImage, svgRef, onPinMoveEnd, inSelectMode }: Options) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, colorId: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      if (inSelectMode) return;
      const svg = svgRef.current;
      const color = palette.find((c) => c.id === colorId);
      if (!svg || !color?.sample) return;
      hasDraggedRef.current = false;
      const startPt = clientToSvg(svg, e.clientX, e.clientY);
      const originalSample = { ...color.sample };
      setDrag({
        colorId,
        startPt: { x: startPt.x, y: startPt.y },
        originalSample,
        currentSample: originalSample,
      });
    },
    [palette, inSelectMode, svgRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drag || !svgRef.current || !sourceImage) return;
      hasDraggedRef.current = true;
      const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      const x = Math.round(
        Math.max(0, Math.min(sourceImage.width - 1, drag.originalSample.x + pt.x - drag.startPt.x))
      );
      const y = Math.round(
        Math.max(0, Math.min(sourceImage.height - 1, drag.originalSample.y + pt.y - drag.startPt.y))
      );
      setDrag((prev) =>
        prev ? { ...prev, currentSample: { ...prev.originalSample, x, y } } : null
      );
    },
    [drag, sourceImage, svgRef]
  );

  const handleMouseUp = useCallback(() => {
    if (drag && hasDraggedRef.current) onPinMoveEnd(drag.colorId, drag.currentSample);
    setDrag(null);
  }, [drag, onPinMoveEnd]);

  return { drag, hasDraggedRef, handleMouseDown, handleMouseMove, handleMouseUp };
}
