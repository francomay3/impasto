import type { MixEntry } from '../services/ColorMixer';
import type { Pigment } from '../types';

/** Realized CIELAB after pigment mixing, parallel to the source hexes array. */
export type LabColor = { l: number; a: number; b: number };

/** One round-trip: recipes from findMixData, labs from the mixed sRGB (chroma of mixedResultHex). */
export type MixPaletteWorkerOutput = {
  labs: LabColor[];
  recipes: MixEntry[][];
};

export type MixPaletteWorkerInput = {
  hexes: string[];
  pigments: Pigment[];
  minPaintPercent: number;
  deltaThreshold: number;
};
