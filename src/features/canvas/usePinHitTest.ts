import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { RawImage, Color } from '../../types';

const HIT_R = 11;

interface Options {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  sourceImageRef: RefObject<RawImage | null>;
  visiblePinsRef: RefObject<Color[]>;
  sourceImage: RawImage | null;
  visiblePins: Color[];
}

export function usePinHitTest({
  canvasRef,
  sourceImageRef,
  visiblePinsRef,
  sourceImage,
  visiblePins,
}: Options) {
  const getClientCanvasRect = useCallback(
    () => canvasRef.current?.getBoundingClientRect() ?? null,
    [canvasRef]
  );

  const findPinAt = useCallback(
    (cx: number, cy: number): string | null => {
      if (!sourceImageRef.current) return null;
      const cr = getClientCanvasRect();
      if (!cr) return null;
      const { width, height } = sourceImageRef.current;
      for (const c of visiblePinsRef.current) {
        if (!c.sample) continue;
        const sx = cr.left + (c.sample.x / width) * cr.width;
        const sy = cr.top + (c.sample.y / height) * cr.height;
        if (Math.hypot(cx - sx, cy - sy) <= HIT_R) return c.id;
      }
      return null;
    },
    [getClientCanvasRect, sourceImageRef, visiblePinsRef]
  );

  const getPinsInRect = useCallback(
    (rect: { startX: number; startY: number; endX: number; endY: number }): Set<string> => {
      if (!sourceImage) return new Set();
      const cr = getClientCanvasRect();
      if (!cr) return new Set();
      const toImg = (sx: number, sy: number) => ({
        x: ((sx - cr.left) / cr.width) * sourceImage.width,
        y: ((sy - cr.top) / cr.height) * sourceImage.height,
      });
      const { x: x1, y: y1 } = toImg(
        Math.min(rect.startX, rect.endX),
        Math.min(rect.startY, rect.endY)
      );
      const { x: x2, y: y2 } = toImg(
        Math.max(rect.startX, rect.endX),
        Math.max(rect.startY, rect.endY)
      );
      return new Set(
        visiblePins
          .filter(
            (c) =>
              c.sample &&
              c.sample.x >= x1 &&
              c.sample.x <= x2 &&
              c.sample.y >= y1 &&
              c.sample.y <= y2
          )
          .map((c) => c.id)
      );
    },
    [getClientCanvasRect, sourceImage, visiblePins]
  );

  return { findPinAt, getPinsInRect };
}
