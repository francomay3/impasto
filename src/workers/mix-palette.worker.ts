import chroma from 'chroma-js';
import { findMixData, mixedResultHex } from '../services/ColorMixer';
import type { MixPaletteWorkerInput, MixPaletteWorkerOutput } from './mixPaletteWorkerProtocol';

self.onmessage = ({ data }: MessageEvent<MixPaletteWorkerInput>) => {
  const { hexes, pigments, minPaintPercent, deltaThreshold } = data;
  const labs: MixPaletteWorkerOutput['labs'] = [];
  const recipes: MixPaletteWorkerOutput['recipes'] = [];
  for (const hex of hexes) {
    const recipe = findMixData(hex, minPaintPercent, deltaThreshold, pigments);
    recipes.push(recipe);
    const [l, a, b] = chroma(mixedResultHex(recipe)).lab();
    labs.push({ l, a, b });
  }
  const out: MixPaletteWorkerOutput = { labs, recipes };
  self.postMessage(out);
};

;
