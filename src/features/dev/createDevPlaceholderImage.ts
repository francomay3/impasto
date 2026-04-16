import { createRawImage, type RawImage } from '../../types';

export function createDevPlaceholderImage(width = 200, height = 120): RawImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = 30 + (x / width) * 200;
      data[i + 1] = 40 + (y / height) * 150;
      data[i + 2] = 100 + (x / width) * 80;
      data[i + 3] = 255;
    }
  }
  return createRawImage(data, width, height);
}
