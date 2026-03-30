import type { Color } from '../types';
import { hexToRgb } from '../utils/colorUtils';

self.onmessage = (
  e: MessageEvent<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
    palette: Color[];
    generation: number;
  }>
) => {
  const { data, width, height, palette, generation } = e.data;
  const out = new Uint8ClampedArray(data.length);
  const rgbs = palette.map((c) => hexToRgb(c.hex));

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    let best = 0,
      bestDist = Infinity;
    for (let j = 0; j < rgbs.length; j++) {
      const [pr, pg, pb] = rgbs[j];
      const d = Math.hypot(r - pr, g - pg, b - pb);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }
    out[i] = rgbs[best][0];
    out[i + 1] = rgbs[best][1];
    out[i + 2] = rgbs[best][2];
    out[i + 3] = data[i + 3];
  }

  (self as unknown as Worker).postMessage({ buffer: out.buffer, width, height, generation }, [
    out.buffer,
  ]);
};
