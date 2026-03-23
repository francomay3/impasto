import type { FilterSettings } from '../types';

export function applyFilters(imageData: ImageData, filters: FilterSettings): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const { brightness, contrast, saturation, temperature, tint } = filters;

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    r += brightness;
    g += brightness;
    b += brightness;

    // Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Temperature (red/blue shift)
    r += temperature;
    b -= temperature;

    // Tint (green/magenta)
    g += tint;

    // Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = (saturation + 100) / 100;
    r = gray + sat * (r - gray);
    g = gray + sat * (g - gray);
    b = gray + sat * (b - gray);

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function sampleCircleAverage(
  imageData: ImageData,
  cx: number,
  cy: number,
  radius: number
): [number, number, number, number] {
  const { width, height, data } = imageData;
  let r = 0, g = 0, b = 0, a = 0, count = 0;
  const r2 = radius * radius;

  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
      r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; a += data[idx + 3];
      count++;
    }
  }
  if (count === 0) return [0, 0, 0, 255];
  return [r / count, g / count, b / count, a / count];
}
