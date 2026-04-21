import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawImage } from '../../types';
import type { FilterInstance, RawImage } from '../../types';
import { FilterChainRunner } from './FilterChainRunner';

const workerCtx = vi.hoisted(() => {
  const created: Array<{
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
    onmessage: ((e: MessageEvent) => void) | null;
    onerror: ((e: ErrorEvent) => void) | null;
  }> = [];
  return { created };
});

vi.mock('../../workers/img-pipeline.worker?worker', () => ({
  default: class MockImgPipelineWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    constructor() {
      workerCtx.created.push(this);
    }
  },
}));

function imageDepFromGetter(get: () => RawImage | null) {
  return { get, subscribe: () => () => {} };
}

describe('FilterChainRunner', () => {
  beforeEach(() => {
    workerCtx.created.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('syncFromImageDep with null source emits 1×1 blank, idle state, and resets cache for a later image', () => {
    let img: RawImage | null = createRawImage(
      new Uint8ClampedArray([255, 0, 0, 255]),
      1,
      1,
    );
    const onOut = vi.fn();
    const runner = new FilterChainRunner(imageDepFromGetter(() => img), onOut);
    runner.syncFromImageDep();
    onOut.mockClear();

    img = null;
    runner.syncFromImageDep();

    expect(runner.getState()).toEqual({ status: 'idle', error: null });
    expect(onOut).toHaveBeenCalledTimes(1);
    const blank = onOut.mock.calls[0]![0];
    expect(blank.width).toBe(1);
    expect(blank.height).toBe(1);
    expect([...blank.data]).toEqual([0, 0, 0, 0]);

    img = createRawImage(new Uint8ClampedArray([10, 20, 30, 40, 50, 60, 70, 80]), 2, 1);
    onOut.mockClear();
    runner.syncFromImageDep();
    expect(runner.getState().status).toBe('ready');
    expect(onOut).toHaveBeenCalledTimes(1);
    const restored = onOut.mock.calls[0]![0];
    expect(restored.width).toBe(2);
    expect(restored.data[0]).toBe(10);
  });

  it('setFilters notifies every subscribed filter listener', () => {
    const runner = new FilterChainRunner(imageDepFromGetter(() => null), vi.fn());
    const a = vi.fn();
    const b = vi.fn();
    runner.subscribeFilters(a);
    runner.subscribeFilters(b);
    const f: FilterInstance = { id: '1', type: 'blur', params: { blur: 1 } };
    runner.setFilters([f]);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    runner.dispose();
  });

  it('dispose terminates the worker', () => {
    const runner = new FilterChainRunner(imageDepFromGetter(() => null), vi.fn());
    expect(workerCtx.created).toHaveLength(1);
    const w = workerCtx.created[0]!;
    runner.dispose();
    expect(w.terminate).toHaveBeenCalledTimes(1);
  });

  it('worker onmessage with valid steps updates cache and calls onFilteredOutput', () => {
    const src = createRawImage(
      new Uint8ClampedArray([100, 101, 102, 255, 200, 201, 202, 255]),
      2,
      1,
    );
    const onOut = vi.fn();
    const runner = new FilterChainRunner(imageDepFromGetter(() => src), onOut);
    runner.syncFromImageDep();
    onOut.mockClear();

    const f: FilterInstance = { id: 'a', type: 'blur', params: { blur: 1 } };
    runner.setFilters([f]);

    const w = workerCtx.created[0]!;
    expect(w.postMessage).toHaveBeenCalledTimes(1);
    expect(runner.getState().status).toBe('filtering');

    const outPixels = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    w.onmessage!(
      new MessageEvent('message', {
        data: { steps: [outPixels.buffer], dirtyIndex: 0 },
      }),
    );

    expect(runner.getState()).toEqual({ status: 'ready', error: null });
    expect(onOut).toHaveBeenCalledTimes(1);
    const filtered = onOut.mock.calls[0]![0];
    expect(filtered.width).toBe(2);
    expect(filtered.height).toBe(1);
    expect([...filtered.data]).toEqual([...outPixels]);

    runner.dispose();
  });

  it('stale worker result (filters changed mid-flight) does not emit output and schedules a re-run', () => {
    const src = createRawImage(
      new Uint8ClampedArray([10, 20, 30, 40, 50, 60, 70, 80]),
      2,
      1,
    );
    const onOut = vi.fn();
    const runner = new FilterChainRunner(imageDepFromGetter(() => src), onOut);
    runner.syncFromImageDep();
    onOut.mockClear();

    const f1: FilterInstance = { id: 'a', type: 'blur', params: { blur: 1 } };
    const f2: FilterInstance = { id: 'b', type: 'blur', params: { blur: 2 } };
    runner.setFilters([f1]);

    const w = workerCtx.created[0]!;
    expect(w.postMessage).toHaveBeenCalledTimes(1);

    runner.setFilters([f2]);
    expect(runner.getState().status).toBe('filtering');

    const staleBadPixels = new Uint8Array(8).fill(99);
    w.onmessage!(
      new MessageEvent('message', {
        data: { steps: [staleBadPixels.buffer], dirtyIndex: 0 },
      }),
    );

    // Stale result is discarded; the retry is deferred until the throttle window closes.
    expect(onOut).not.toHaveBeenCalled();
    expect(w.postMessage).toHaveBeenCalledTimes(1);

    // Advance past the INPUT_THROTTLE_MS window so the trailing scheduleFilterPass fires.
    vi.advanceTimersByTime(50);

    expect(w.postMessage).toHaveBeenCalledTimes(2);

    const secondCall = w.postMessage.mock.calls[1]![0] as {
      filters: FilterInstance[];
    };
    expect(secondCall.filters).toEqual([f2]);

    const goodPixels = new Uint8Array([11, 12, 13, 14, 15, 16, 17, 18]);
    w.onmessage!(
      new MessageEvent('message', {
        data: { steps: [goodPixels.buffer], dirtyIndex: 0 },
      }),
    );

    expect(onOut).toHaveBeenCalledTimes(1);
    expect([...onOut.mock.calls[0]![0].data]).toEqual([...goodPixels]);
    expect(runner.getState().status).toBe('ready');

    runner.dispose();
  });

  it('cache hit: identical filter chain on second setFilters does not re-post to worker', () => {
    const src = createRawImage(
      new Uint8ClampedArray([10, 20, 30, 40]),
      1,
      1,
    );
    const onOut = vi.fn();
    const runner = new FilterChainRunner(imageDepFromGetter(() => src), onOut);

    // Seed the pass cache with the current source.
    runner.syncFromImageDep();

    const f: FilterInstance = { id: 'f1', type: 'blur', params: { blur: 1 } };

    // First setFilters → dispatches to the worker.
    runner.setFilters([f]);
    const w = workerCtx.created[0]!;
    expect(w.postMessage).toHaveBeenCalledTimes(1);

    // Simulate worker completing the first pass.
    const outPixels = new Uint8Array([11, 22, 33, 44]);
    w.onmessage!(
      new MessageEvent('message', {
        data: { steps: [outPixels.buffer], dirtyIndex: 0 },
      }),
    );
    expect(runner.getState().status).toBe('ready');

    // Reset mocks so we get clean call counts for the second pass.
    w.postMessage.mockClear();
    onOut.mockClear();

    // Second setFilters with the exact same filter chain — throttled, so advance past the window.
    runner.setFilters([f]);
    vi.advanceTimersByTime(50);

    // Cache hit: no re-post to worker, but output is re-emitted synchronously from the cache.
    expect(w.postMessage).not.toHaveBeenCalled();
    expect(onOut).toHaveBeenCalledTimes(1);
    expect(runner.getState().status).toBe('ready');

    runner.dispose();
  });

  it('no-seed fallback: setFilters without syncFromImageDep passes raw source pixels to worker', () => {
    // Source: a single pixel [50, 60, 70, 255].
    const src = createRawImage(new Uint8ClampedArray([50, 60, 70, 255]), 1, 1);
    const runner = new FilterChainRunner(imageDepFromGetter(() => src), vi.fn());

    // Intentionally skip syncFromImageDep so the pass cache slot 0 is null.
    const f: FilterInstance = { id: 'f1', type: 'blur', params: { blur: 1 } };
    runner.setFilters([f]);

    const w = workerCtx.created[0]!;
    expect(w.postMessage).toHaveBeenCalledTimes(1);

    // The pixels sent must be the raw source data (line 69 fallback path).
    const call = w.postMessage.mock.calls[0]![0] as { pixels: Uint8Array };
    expect([...call.pixels]).toEqual([50, 60, 70, 255]);

    runner.dispose();
  });
});
