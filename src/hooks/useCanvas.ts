import { useEffect, useRef } from 'react';

/** Paints ImageData onto a canvas whenever it changes. Returns the canvas ref. */
export function useCanvas(imageData: ImageData | null) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !imageData) return;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  }, [imageData]);
  return ref;
}
