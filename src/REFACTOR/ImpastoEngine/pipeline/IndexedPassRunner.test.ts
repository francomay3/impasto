import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawImage } from '../../../types';
import { IndexedPassRunner } from './IndexedPassRunner';

const workerCtx = vi.hoisted(() => {
  const created: Array<{
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
    onmessage: ((e: MessageEvent) => void) | null;
    onerror: ((e: ErrorEvent) => void) | null;
  }> = [];
  return { created };
});

vi.mock('../../../workers/img-index.worker?worker', () => ({
  default: class MockImgIndexWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    constructor() {
      workerCtx.created.push(this);
    }
  },
}));

describe('IndexedPassRunner', () => {
  beforeEach(() => {
    workerCtx.created.length = 0;
  });

  it('setFilteredImage with a non-empty palette calls postMessage on the worker', () => {
    const onIndexedOutput = vi.fn();
    const runner = new IndexedPassRunner(onIndexedOutput);
    const img = createRawImage(
      new Uint8ClampedArray([1, 2, 3, 255, 5, 6, 7, 255]),
      2,
      1,
    );
    runner.setFilteredImage(img);
    onIndexedOutput.mockClear();

    runner.setIndexedPaletteConfig({ palette: [{ l: 50, a: 1, b: -2 }] });

    expect(workerCtx.created).toHaveLength(1);
    const w = workerCtx.created[0]!;
    expect(w.postMessage).toHaveBeenCalledTimes(1);
    const payload = w.postMessage.mock.calls[0]![0] as {
      pixels: Uint8Array;
      width: number;
      height: number;
      sigma: number;
      paletteJson: string;
    };
    expect(payload.width).toBe(2);
    expect(payload.height).toBe(1);
    expect(payload.sigma).toBeGreaterThanOrEqual(0);
    expect(JSON.parse(payload.paletteJson)).toEqual([{ l: 50, a: 1, b: -2 }]);
    expect(payload.pixels.byteLength).toBe(img.data.length);

    expect(runner.getState()).toEqual({ indexedStatus: 'indexing', indexedError: null });

    runner.dispose();
  });

  it('empty palette skips the worker and calls onIndexedOutput with a blank at indexedStatus idle', () => {
    const onIndexedOutput = vi.fn();
    const runner = new IndexedPassRunner(onIndexedOutput);
    const img = createRawImage(new Uint8ClampedArray([9, 9, 9, 255]), 1, 1);

    runner.setFilteredImage(img);

    expect(workerCtx.created).toHaveLength(1);
    expect(workerCtx.created[0]!.postMessage).not.toHaveBeenCalled();
    expect(onIndexedOutput).toHaveBeenCalledTimes(1);
    const blank = onIndexedOutput.mock.calls[0]![0];
    expect(blank.width).toBe(1);
    expect(blank.height).toBe(1);
    expect([...blank.data]).toEqual([0, 0, 0, 0]);
    expect(runner.getState()).toEqual({ indexedStatus: 'idle', indexedError: null });

    runner.dispose();
  });

  it('clearIndexedToIdle resets indexed output and status to idle', () => {
    const onIndexedOutput = vi.fn();
    const runner = new IndexedPassRunner(onIndexedOutput);
    const img = createRawImage(
      new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]),
      2,
      1,
    );
    runner.setFilteredImage(img);
    runner.setIndexedPaletteConfig({ palette: [{ l: 10, a: 0, b: 0 }] });
    onIndexedOutput.mockClear();

    const w = workerCtx.created[0]!;
    const out = new Uint8Array(8).fill(7);
    w.onmessage!(
      new MessageEvent('message', {
        data: { buffer: out.buffer },
      }),
    );

    expect(runner.getState().indexedStatus).toBe('ready');
    onIndexedOutput.mockClear();

    runner.clearIndexedToIdle();

    expect(onIndexedOutput).toHaveBeenCalledTimes(1);
    const blank = onIndexedOutput.mock.calls[0]![0];
    expect(blank.width).toBe(1);
    expect(blank.height).toBe(1);
    expect([...blank.data]).toEqual([0, 0, 0, 0]);
    expect(runner.getState()).toEqual({ indexedStatus: 'idle', indexedError: null });

    runner.dispose();
  });

  it('worker onerror sets indexedStatus error', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onIndexedOutput = vi.fn();
    const runner = new IndexedPassRunner(onIndexedOutput);
    const img = createRawImage(new Uint8ClampedArray([1, 1, 1, 255]), 1, 1);
    runner.setFilteredImage(img);
    runner.setIndexedPaletteConfig({ palette: [{ l: 1, a: 0, b: 0 }] });
    onIndexedOutput.mockClear();

    const w = workerCtx.created[0]!;
    // Node test env may not define `ErrorEvent`; runner only reads `message`.
    w.onerror!({ message: 'index worker boom' } as ErrorEvent);

    expect(runner.getState()).toEqual({
      indexedStatus: 'error',
      indexedError: 'index worker boom',
    });
    expect(onIndexedOutput).not.toHaveBeenCalled();

    errSpy.mockRestore();
    runner.dispose();
  });
});
