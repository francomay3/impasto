import type { RawImage } from '../types';
import { normalizeHex, isUsableColor } from './colorUtils';

export function drawRawImage(canvas: HTMLCanvasElement, source: RawImage): void {
  canvas.width = source.width;
  canvas.height = source.height;
  canvas
    .getContext('2d')!
    .putImageData(new ImageData(new Uint8ClampedArray(source.data), source.width, source.height), 0, 0);
}

export function drawImageDataToCanvas(canvas: HTMLCanvasElement, data: ImageData): void {
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext('2d')!.putImageData(data, 0, 0);
}

export function drawPaletteThumbnail(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rawColors: string[]
): void {
  ctx.fillStyle = '#1a1b1e';
  ctx.fillRect(0, 0, W, H);

  const usable = rawColors.filter(isUsableColor);
  const source = usable.length > 0 ? usable : rawColors.length > 0 ? rawColors : ['#444'];
  const shuffled = [...source].sort(() => Math.random() - 0.5);

  for (const hex of shuffled) {
    const normalized = normalizeHex(hex);
    const blobs = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < blobs; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = 30 + Math.random() * 80;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, normalized + '99');
      g.addColorStop(1, normalized + '00');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
