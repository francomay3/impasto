type Vec2 = { x: number; y: number };

type MarqueeState =
  | { type: 'idle' }
  | { type: 'dragging'; start: Vec2; current: Vec2 };

export type MarqueeRect = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  canvasRect: DOMRect;
};

type Listener = () => void;

export class MarqueeController {
  private state: MarqueeState = { type: 'idle' };
  private listeners = new Set<Listener>();
  private onCommitCallback: (rect: MarqueeRect, shiftKey: boolean, altKey: boolean) => void;
  private onCancelCallback: (() => void) | undefined;

  constructor(
    onCommit: (rect: MarqueeRect, shiftKey: boolean, altKey: boolean) => void,
    onCancel?: () => void,
  ) {
    this.onCommitCallback = onCommit;
    this.onCancelCallback = onCancel;
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  startDrag(e: MouseEvent, canvasRect: DOMRect): void {
    if (this.state.type !== 'idle') return;
    const startX = e.clientX;
    const startY = e.clientY;
    let hasDragged = false;
    let rafPending = false;
    let latestEv: MouseEvent | null = null;

    const onMove = (ev: MouseEvent) => {
      if (!hasDragged && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) hasDragged = true;
      if (!hasDragged) return;
      latestEv = ev;
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (!latestEv) return;
        this.setState({ type: 'dragging', start: { x: startX, y: startY }, current: { x: latestEv.clientX, y: latestEv.clientY } });
        latestEv = null;
      });
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      latestEv = null; // prevent any pending rAF from setting state back to dragging
      this.setState({ type: 'idle' });
      if (!hasDragged) return;
      this.onCommitCallback(
        { startX, startY, endX: ev.clientX, endY: ev.clientY, canvasRect },
        ev.shiftKey,
        ev.altKey,
      );
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  cancel(): void {
    this.setState({ type: 'idle' });
    this.onCancelCallback?.();
  }

  getState(): MarqueeState { return this.state; }
  isActive(): boolean { return this.state.type !== 'idle'; }

  private setState(s: MarqueeState): void {
    this.state = s;
    this.listeners.forEach((l) => l());
  }
}
