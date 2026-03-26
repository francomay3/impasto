import { useEffect, useRef, useState } from 'react';
import type { RawImage } from '../types';
import { useWorkerBackpressure } from './useWorkerBackpressure';
import ImgIndexWorker from '../workers/img-index.worker?worker';

export type LabColor = { l: number; a: number; b: number };

type WorkerOutput = { buffer: ArrayBuffer };

export function useIndexedImage(sourceImage: RawImage | null, sigma: number, palette: LabColor[]) {
  const [displayData, setDisplayData] = useState<ImageData | null>(null);
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
    },
    errorLabel: 'img_index worker',
  });

  fireRef.current = () => {
    const source = sourceRef.current;
    if (!source || paletteRef.current.length === 0) return;
    const pixelsCopy = new Uint8Array(source.data);
    busyRef.current = true;
    workerRef.current!.postMessage(
      { pixels: pixelsCopy, width: source.width, height: source.height, sigma: sigmaRef.current, paletteJson: JSON.stringify(paletteRef.current) },
      [pixelsCopy.buffer],
    );
  };

  useEffect(() => {
    if (!sourceImage) return;
    schedule();
  }, [sourceImage, schedule]);

  const configKey = JSON.stringify({ sigma, palette });
  useEffect(() => {
    if (!sourceImage) return;
    schedule();
    // configKey is intentionally used instead of sigma/palette to avoid firing on reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, schedule]);

  return displayData;
}
