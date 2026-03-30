import { useCallback, useEffect, useRef, useState } from 'react';
import type { RawImage } from '../types';
import { useWorkerBackpressure } from './useWorkerBackpressure';
import ImgIndexWorker from '../workers/img-index.worker?worker';

type LabColor = { l: number; a: number; b: number };

type WorkerOutput = { buffer: ArrayBuffer };

export function useIndexedImage(sourceImage: RawImage | null, sigma: number, palette: LabColor[]) {
  const [displayData, setDisplayData] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const sourceRef = useRef(sourceImage);
  const sigmaRef = useRef(sigma);
  const paletteRef = useRef(palette);
  sourceRef.current = sourceImage;
  sigmaRef.current = sigma;
  paletteRef.current = palette;

  const { workerRef, busyRef, fireRef, schedule } = useWorkerBackpressure<WorkerOutput>({
    createWorker: () => new ImgIndexWorker(),
    onMessage: ({ buffer }) => {
      const source = sourceRef.current!;
      setDisplayData(new ImageData(new Uint8ClampedArray(buffer), source.width, source.height));
      setIsLoading(false);
    },
    errorLabel: 'img_index worker',
  });

  const scheduleWithLoading = useCallback(() => {
    setIsLoading(true);
    schedule();
  }, [schedule]);

  fireRef.current = () => {
    const source = sourceRef.current;
    if (!source || paletteRef.current.length === 0) return;
    const pixelsCopy = new Uint8Array(source.data);
    busyRef.current = true;
    workerRef.current!.postMessage(
      {
        pixels: pixelsCopy,
        width: source.width,
        height: source.height,
        sigma: sigmaRef.current,
        paletteJson: JSON.stringify(paletteRef.current),
      },
      [pixelsCopy.buffer]
    );
  };

  useEffect(() => {
    if (!sourceImage) return;
    scheduleWithLoading();
  }, [sourceImage, scheduleWithLoading]);

  const configKey = JSON.stringify({ sigma, palette });
  useEffect(() => {
    if (!sourceImage) return;
    scheduleWithLoading();
    // configKey is intentionally used instead of sigma/palette to avoid firing on reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, scheduleWithLoading]);

  return { data: displayData, isLoading };
}
