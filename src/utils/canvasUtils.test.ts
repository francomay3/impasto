// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadCanvas } from './canvasUtils';

describe('downloadCanvas', () => {
  let anchor: { href: string; download: string; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    anchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement);
  });

  it('sets href to the canvas data URL and triggers a click', () => {
    const canvas = document.createElement('canvas') as unknown as HTMLCanvasElement;
    canvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,abc');

    downloadCanvas(canvas);

    expect(anchor.href).toBe('data:image/png;base64,abc');
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it('uses default filename when none is provided', () => {
    const canvas = document.createElement('canvas') as unknown as HTMLCanvasElement;
    canvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,abc');

    downloadCanvas(canvas);

    expect(anchor.download).toBe('image.png');
  });

  it('uses provided filename', () => {
    const canvas = document.createElement('canvas') as unknown as HTMLCanvasElement;
    canvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,abc');

    downloadCanvas(canvas, 'my-painting.png');

    expect(anchor.download).toBe('my-painting.png');
  });
});
