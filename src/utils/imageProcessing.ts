import type {
  FilterInstance,
  BrightnessContrastParams,
  HueSaturationParams,
  WhiteBalanceParams,
  VibranceParams,
  ColorBalanceParams,
  LevelsParams,
  BlurParams,
} from '../types';
import {
  brightnessContrastChannel,
  hueSaturationPixel,
  whiteBalancePixel,
  vibrancePixel,
  colorBalancePixel,
  levelsChannel,
} from './pixelMath';

function applyBrightnessContrast(imageData: ImageData, p: BrightnessContrastParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = brightnessContrastChannel(data[i + c], p.brightness, p.contrast);
    }
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function applyHueSaturation(imageData: ImageData, p: HueSaturationParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = hueSaturationPixel(data[i], data[i + 1], data[i + 2], p.hue, p.saturation, p.lightness);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function applyWhiteBalance(imageData: ImageData, p: WhiteBalanceParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = whiteBalancePixel(data[i], data[i + 1], data[i + 2], p.temperature, p.tint);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function applyVibrance(imageData: ImageData, p: VibranceParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = vibrancePixel(data[i], data[i + 1], data[i + 2], p.vibrance, p.saturation);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function applyColorBalance(imageData: ImageData, p: ColorBalanceParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = colorBalancePixel(
      data[i], data[i + 1], data[i + 2],
      p.shadowsR, p.shadowsG, p.shadowsB,
      p.midtonesR, p.midtonesG, p.midtonesB,
      p.highlightsR, p.highlightsG, p.highlightsB,
      p.preserveLuminosity
    );
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function applyLevels(imageData: ImageData, p: LevelsParams): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = levelsChannel(data[i + c], p.blackPoint, p.whitePoint);
    }
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function blurImageData(imageData: ImageData, blur: number): ImageData {
  if (blur === 0) return imageData;
  const { width, height } = imageData;
  const src = document.createElement('canvas');
  src.width = width;
  src.height = height;
  src.getContext('2d')!.putImageData(imageData, 0, 0);
  const dst = document.createElement('canvas');
  dst.width = width;
  dst.height = height;
  const dCtx = dst.getContext('2d', { willReadFrequently: true })!;
  dCtx.filter = `blur(${blur}px)`;
  dCtx.drawImage(src, 0, 0);
  dCtx.filter = 'none';
  return dCtx.getImageData(0, 0, width, height);
}

export function applyFilters(imageData: ImageData, filters: FilterInstance[]): ImageData {
  return filters.reduce((data, filter) => {
    if (filter.enabled === false) return data;
    switch (filter.type) {
      case 'brightness-contrast':
        return applyBrightnessContrast(data, filter.params as BrightnessContrastParams);
      case 'hue-saturation':
        return applyHueSaturation(data, filter.params as HueSaturationParams);
      case 'white-balance':
        return applyWhiteBalance(data, filter.params as WhiteBalanceParams);
      case 'vibrance':
        return applyVibrance(data, filter.params as VibranceParams);
      case 'color-balance':
        return applyColorBalance(data, filter.params as ColorBalanceParams);
      case 'levels':
        return applyLevels(data, filter.params as LevelsParams);
      case 'blur':
        return blurImageData(data, (filter.params as BlurParams).blur);
      default:
        return data;
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
