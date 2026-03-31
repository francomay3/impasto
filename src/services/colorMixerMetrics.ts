import chroma from 'chroma-js';
import mixbox from '../utils/mixbox';

export function ciede2000(hex1: string, hex2: string): number {
  return chroma.deltaE(hex1, hex2);
}

export function mixLatent(hexes: string[], weights: number[]): string {
  const total = weights.reduce((a, b) => a + b, 0);
  const latentMix = new Array<number>(mixbox.LATENT_SIZE).fill(0);
  hexes.forEach((h, i) => {
    const w = weights[i] / total;
    const [r, g, b] = chroma(h).rgb();
    const latent = mixbox.rgbToLatent(r, g, b);
    for (let j = 0; j < latentMix.length; j++) latentMix[j] += w * latent[j];
  });
  const [r, g, b] = mixbox.latentToRgb(latentMix);
  return chroma(r, g, b).hex();
}
