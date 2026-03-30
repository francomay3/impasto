/** Clamp a value to the [0, 255] range. */
export function clamp255(v: number): number {
  return Math.max(0, Math.min(255, v));
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

/** Apply hue/saturation adjustments to a single pixel (mutates r/g/b in place). */
export function hueSaturationPixel(
  r: number,
  g: number,
  b: number,
  saturation: number,
  temperature: number,
  tint: number
): [number, number, number] {
  const sat = (saturation + 100) / 100;
  const tr = r + temperature;
  const tg = g + tint;
  const tb = b - temperature;
  const gray = 0.299 * tr + 0.587 * tg + 0.114 * tb;
  return [
    clamp255(gray + sat * (tr - gray)),
    clamp255(gray + sat * (tg - gray)),
    clamp255(gray + sat * (tb - gray)),
  ];
}

/** Apply levels adjustment to a single channel value. */
export function levelsChannel(value: number, blackPoint: number, whitePoint: number): number {
  const range = Math.max(1, whitePoint - blackPoint);
  return clamp255(((value - blackPoint) / range) * 255);
}
