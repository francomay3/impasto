import type { CropRect } from '../../../types';

export type CropHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move';

const MIN_SIZE = 0.02;

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

export function applyDrag(handle: CropHandle, r: CropRect, dx: number, dy: number): CropRect {
  const right = r.x + r.width;
  const bottom = r.y + r.height;

  if (handle === 'move') {
    return { x: clamp(r.x + dx, 0, 1 - r.width), y: clamp(r.y + dy, 0, 1 - r.height), width: r.width, height: r.height };
  }

  let l = r.x, t = r.y, ri = right, bo = bottom;
  if (handle === 'nw' || handle === 'w' || handle === 'sw') l = clamp(r.x + dx, 0, ri - MIN_SIZE);
  if (handle === 'ne' || handle === 'e' || handle === 'se') ri = clamp(right + dx, l + MIN_SIZE, 1);
  if (handle === 'nw' || handle === 'n' || handle === 'ne') t = clamp(r.y + dy, 0, bo - MIN_SIZE);
  if (handle === 'sw' || handle === 's' || handle === 'se') bo = clamp(bottom + dy, t + MIN_SIZE, 1);

  return { x: l, y: t, width: ri - l, height: bo - t };
}

export class CropController {
  private rect: CropRect;
  private readonly onChange: (rect: CropRect) => void;

  constructor(initial: CropRect | undefined, onChange: (rect: CropRect) => void) {
    this.rect = initial ?? { x: 0, y: 0, width: 1, height: 1 };
    this.onChange = onChange;
  }

  getRect(): CropRect { return this.rect; }

  reset(rect?: CropRect): void {
    this.rect = rect ?? { x: 0, y: 0, width: 1, height: 1 };
    this.onChange(this.rect);
  }

  startDrag(handle: CropHandle, e: MouseEvent, container: HTMLElement): void {
    e.preventDefault();
    const bounds = container.getBoundingClientRect();
    const startRect = { ...this.rect };
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / bounds.width;
      const dy = (me.clientY - startY) / bounds.height;
      this.rect = applyDrag(handle, startRect, dx, dy);
      this.onChange(this.rect);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}
