import chroma from 'chroma-js';
import type { Color } from '../types';

export function getValidPaletteHexes(palette: Color[]): string[] {
  return palette.flatMap((c) => { try { chroma(c.hex); return [c.hex]; } catch { return []; } });
}

export function computeLabPalette(hexes: string[]): { l: number; a: number; b: number }[] {
  return hexes.map((hex) => { const [l, a, b] = chroma(hex).lab(); return { l, a, b }; });
}
