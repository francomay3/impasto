import type { FilterInstance, BrightnessContrastParams, HueSaturationParams, LevelsParams, BlurParams } from '../types';

function applyBrightnessContrast(imageData: ImageData, p: BrightnessContrastParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const cf = (259 * (p.contrast + 255)) / (255 * (259 - p.contrast));
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.max(0, Math.min(255, cf * (data[i + c] + p.brightness - 128) + 128));
    }
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function applyHueSaturation(imageData: ImageData, p: HueSaturationParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const sat = (p.saturation + 100) / 100;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] + p.temperature;
    const g = data[i + 1] + p.tint;
    const b = data[i + 2] - p.temperature;
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.max(0, Math.min(255, gray + sat * (r - gray)));
    data[i + 1] = Math.max(0, Math.min(255, gray + sat * (g - gray)));
    data[i + 2] = Math.max(0, Math.min(255, gray + sat * (b - gray)));
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function applyLevels(imageData: ImageData, p: LevelsParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const range = Math.max(1, p.whitePoint - p.blackPoint);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.max(0, Math.min(255, (data[i + c] - p.blackPoint) / range * 255));
    }
  }
  return new ImageData(data, imageData.width, imageData.height);
}

export function blurImageData(imageData: ImageData, blur: number): ImageData {
  if (blur === 0) return imageData;
  const { width, height } = imageData;
  const src = document.createElement('canvas');
  src.width = width; src.height = height;
  src.getContext('2d')!.putImageData(imageData, 0, 0);
  const dst = document.createElement('canvas');
  dst.width = width; dst.height = height;
  const dCtx = dst.getContext('2d', { willReadFrequently: true })!;
  dCtx.filter = `blur(${blur}px)`;
  dCtx.drawImage(src, 0, 0);
  dCtx.filter = 'none';
  return dCtx.getImageData(0, 0, width, height);
}

function applyBlurFilter(imageData: ImageData, p: BlurParams): ImageData {
  return blurImageData(imageData, p.blur);
}

export function applyFilters(imageData: ImageData, filters: FilterInstance[]): ImageData {
  return filters.reduce((data, filter) => {
    switch (filter.type) {
      case 'brightness-contrast': return applyBrightnessContrast(data, filter.params as BrightnessContrastParams);
      case 'hue-saturation': return applyHueSaturation(data, filter.params as HueSaturationParams);
      case 'levels': return applyLevels(data, filter.params as LevelsParams);
      case 'blur': return applyBlurFilter(data, filter.params as BlurParams);
      default: return data;
    }
  }, imageData);
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
