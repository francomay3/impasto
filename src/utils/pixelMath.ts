/** Clamp a value to the [0, 255] range. */
export function clamp255(v: number): number {
  return Math.max(0, Math.min(255, v));
}

/** Convert RGB [0,255] to HSL [0,1] each. */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 0.5) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/** Convert HSL [0,1] each to RGB [0,255]. */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hueToRgb(p, q, h + 1 / 3) * 255,
    hueToRgb(p, q, h) * 255,
    hueToRgb(p, q, h - 1 / 3) * 255,
  ];
}

/** Apply brightness + contrast to a single channel value. */
export function brightnessContrastChannel(
  value: number,
  brightness: number,
  contrast: number
): number {
  const cf = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return clamp255(cf * (value + brightness - 128) + 128);
}

/** Apply hue rotation, saturation, and lightness to a single pixel via HSL.
 *  Fast path skips HSL round-trip when hue=0. */
export function hueSaturationPixel(
  r: number,
  g: number,
  b: number,
  hue: number,
  saturation: number,
  lightness: number
): [number, number, number] {
  if (hue === 0) {
    const satMul = (saturation + 100) / 100;
    const lightAdd = lightness * 2.55;
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    return [
      clamp255(gray + satMul * (r - gray) + lightAdd),
      clamp255(gray + satMul * (g - gray) + lightAdd),
      clamp255(gray + satMul * (b - gray) + lightAdd),
    ];
  }
  let [h, s, l] = rgbToHsl(r, g, b);
  h = ((h + hue / 360) % 1 + 1) % 1;
  s = Math.max(0, Math.min(1, s + saturation / 100));
  l = Math.max(0, Math.min(1, l + lightness / 100));
  const [nr, ng, nb] = hslToRgb(h, s, l);
  return [clamp255(nr), clamp255(ng), clamp255(nb)];
}

/** Apply temperature and tint shifts to a pixel. */
export function whiteBalancePixel(
  r: number,
  g: number,
  b: number,
  temperature: number,
  tint: number
): [number, number, number] {
  return [clamp255(r + temperature), clamp255(g + tint), clamp255(b - temperature)];
}

/** Apply vibrance (adaptive saturation) and uniform saturation to a pixel. */
export function vibrancePixel(
  r: number,
  g: number,
  b: number,
  vibrance: number,
  saturation: number
): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const currentSat = max > 0 ? (max - min) / max : 0;
  const vibMul = 1 + (vibrance / 100) * (1 - currentSat);
  const satMul = (saturation + 100) / 100;
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const factor = satMul * vibMul;
  return [
    clamp255(gray + factor * (r - gray)),
    clamp255(gray + factor * (g - gray)),
    clamp255(gray + factor * (b - gray)),
  ];
}

/** Apply color balance (shadows/midtones/highlights per channel) to a pixel. */
export function colorBalancePixel(
  r: number, g: number, b: number,
  sr: number, sg: number, sb: number,
  mr: number, mg: number, mb: number,
  hr: number, hg: number, hb: number,
  preserveLuminosity: number
): [number, number, number] {
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const sm = (1 - l) ** 2;
  const mm = 1 - (2 * l - 1) ** 2;
  const hm = l ** 2;
  let nr = clamp255(r + (sr * sm + mr * mm + hr * hm) * 0.5);
  let ng = clamp255(g + (sg * sm + mg * mm + hg * hm) * 0.5);
  let nb = clamp255(b + (sb * sm + mb * mm + hb * hm) * 0.5);
  if (preserveLuminosity) {
    const origLum = 0.299 * r + 0.587 * g + 0.114 * b;
    const newLum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
    if (newLum > 0) {
      const scale = origLum / newLum;
      nr = clamp255(nr * scale);
      ng = clamp255(ng * scale);
      nb = clamp255(nb * scale);
    }
  }
  return [nr, ng, nb];
}

/** Apply levels adjustment to a single channel value. */
export function levelsChannel(value: number, blackPoint: number, whitePoint: number): number {
  const range = Math.max(1, whitePoint - blackPoint);
  return clamp255(((value - blackPoint) / range) * 255);
}
