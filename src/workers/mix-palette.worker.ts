import chroma from 'chroma-js';
import { findMixData, mixedResultHex } from '../services/ColorMixer';
import type { Pigment } from '../types';

type Input = {
  hexes: string[];
  pigments: Pigment[];
  minPaintPercent: number;
  deltaThreshold: number;
};

type LabColor = { l: number; a: number; b: number };

self.onmessage = ({ data }: MessageEvent<Input>) => {
  const { hexes, pigments, minPaintPercent, deltaThreshold } = data;
  const result: LabColor[] = hexes.map((hex) => {
    const mix = findMixData(hex, minPaintPercent, deltaThreshold, pigments);
    const resultHex = mixedResultHex(mix);
    const [l, a, b] = chroma(resultHex).lab();
    return { l, a, b };
  });
  self.postMessage(result);
};
