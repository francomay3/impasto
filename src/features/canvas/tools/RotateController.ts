const ROTATION_RANGE_DEG = 180;

/** Pure helper — testable without DOM. */
export function applyDelta(currentAngle: number, dx: number, containerWidth: number): number {
  return currentAngle + (dx / containerWidth) * ROTATION_RANGE_DEG;
}

export class RotateController {
  private angle: number;
  private readonly onChange: (angle: number) => void;

  constructor(initial: number | undefined, onChange: (angle: number) => void) {
    this.angle = initial ?? 0;
    this.onChange = onChange;
  }

  getAngle(): number { return this.angle; }

  reset(angle?: number): void {
    this.angle = angle ?? 0;
    this.onChange(this.angle);
  }

  startDrag(e: MouseEvent, container: HTMLElement): void {
    e.preventDefault();
    const { width } = container.getBoundingClientRect();
    const startX = e.clientX;
    const startAngle = this.angle;

    const onMove = (me: MouseEvent) => {
      this.angle = applyDelta(startAngle, me.clientX - startX, width);
      this.onChange(this.angle);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}
