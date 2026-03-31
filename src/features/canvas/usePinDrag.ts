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

  // Stable refs so callbacks don't rebuild when these change mid-gesture
  const paletteRef = useRef(palette);
  paletteRef.current = palette;
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const sourceImageRef = useRef(sourceImage);
  sourceImageRef.current = sourceImage;
  const onPinMoveEndRef = useRef(onPinMoveEnd);
  onPinMoveEndRef.current = onPinMoveEnd;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, colorId: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      if (inSelectMode) return;
      const svg = svgRef.current;
      const color = paletteRef.current.find((c) => c.id === colorId);
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
    [inSelectMode, svgRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const currentDrag = dragRef.current;
      const image = sourceImageRef.current;
      if (!currentDrag || !svgRef.current || !image) return;
      hasDraggedRef.current = true;
      const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
      const x = Math.round(
        Math.max(0, Math.min(image.width - 1, currentDrag.originalSample.x + pt.x - currentDrag.startPt.x))
      );
      const y = Math.round(
        Math.max(0, Math.min(image.height - 1, currentDrag.originalSample.y + pt.y - currentDrag.startPt.y))
      );
      setDrag((prev) =>
        prev ? { ...prev, currentSample: { ...prev.originalSample, x, y } } : null
      );
    },
    [svgRef]
  );

  const handleMouseUp = useCallback(() => {
    const d = dragRef.current;
    if (d && hasDraggedRef.current) onPinMoveEndRef.current(d.colorId, d.currentSample);
    setDrag(null);
  }, []);

  return { drag, hasDraggedRef, handleMouseDown, handleMouseMove, handleMouseUp };
}
