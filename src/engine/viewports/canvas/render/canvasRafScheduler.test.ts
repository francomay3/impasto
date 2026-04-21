// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CanvasRafScheduler } from './canvasRafScheduler';

/**
 * Deferred RAF: callbacks run only when `flush` is invoked, so multiple `markDirty()` calls
 * in the same synchronous turn stay coalesced behind a single pending frame.
 */
function installDeferredRafStubs(): { flush: () => void } {
  let pending: FrameRequestCallback | null = null;
  let id = 0;

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pending = cb;
    id += 1;
    return id;
  });

  vi.stubGlobal('cancelAnimationFrame', () => {
    pending = null;
  });

  return {
    flush: () => {
      const cb = pending;
      pending = null;
      cb?.(0);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CanvasRafScheduler', () => {
  it('coalesces multiple markDirty() calls into a single onFrame per animation frame', () => {
    const { flush } = installDeferredRafStubs();
    const onFrame = vi.fn();
    const scheduler = new CanvasRafScheduler();

    scheduler.start(onFrame);
    scheduler.markDirty();
    scheduler.markDirty();
    scheduler.markDirty();

    expect(onFrame).not.toHaveBeenCalled();
    flush();
    expect(onFrame).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onFrame after dispose(), even if a previously scheduled RAF callback runs', () => {
    let pending: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      pending = cb;
      return 42;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const onFrame = vi.fn();
    const scheduler = new CanvasRafScheduler();
    scheduler.start(onFrame);
    scheduler.markDirty();

    expect(pending).not.toBeNull();
    scheduler.dispose();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);

    pending!(0);
    expect(onFrame).not.toHaveBeenCalled();
  });

  it('does not schedule further frames after dispose() when markDirty() is called', () => {
    const { flush } = installDeferredRafStubs();
    const onFrame = vi.fn();
    const scheduler = new CanvasRafScheduler();

    scheduler.start(onFrame);
    scheduler.markDirty();
    flush();
    expect(onFrame).toHaveBeenCalledTimes(1);

    scheduler.dispose();
    onFrame.mockClear();
    scheduler.markDirty();
    flush();
    expect(onFrame).not.toHaveBeenCalled();
  });
});
