import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FilterInstance } from '../../../types';
import { FilterChainRunner } from './FilterChainRunner';
import { IndexedPassRunner } from './IndexedPassRunner';
import { DEFAULT_INDEX_BLUR_SIGMA } from '../infra/engineConstants';
import { ToolState } from '../tools/ToolState';
import { ViewportPhysics } from '../viewport/ViewportPhysics';
import { ViewportPipeline } from './ViewportPipeline';
import type { PipelineImageDep, StateListener } from './viewportPipelineTypes';

type CanvasStub = { setImage: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };

const pipelineWorkerCtx = vi.hoisted(() => {
  const created: Array<{
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
    onmessage: ((e: MessageEvent) => void) | null;
    onerror: ((e: ErrorEvent) => void) | null;
  }> = [];
  return { created };
});

const indexWorkerCtx = vi.hoisted(() => {
  const created: Array<{
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
    onmessage: ((e: MessageEvent) => void) | null;
    onerror: ((e: ErrorEvent) => void) | null;
  }> = [];
  return { created };
});

const canvasCtx = vi.hoisted(() => ({
  sources: [] as CanvasStub[],
  filtereds: [] as CanvasStub[],
  indexeds: [] as CanvasStub[],
}));

function canvasStub(): CanvasStub {
  return { setImage: vi.fn(), dispose: vi.fn() };
}

vi.mock('../../../workers/img-pipeline.worker?worker', () => ({
  default: class MockImgPipelineWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    constructor() {
      pipelineWorkerCtx.created.push(this);
    }
  },
}));

vi.mock('../../../workers/img-index.worker?worker', () => ({
  default: class MockImgIndexWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    constructor() {
      indexWorkerCtx.created.push(this);
    }
  },
}));

vi.mock('../viewports/canvas/surfaces/SourceViewportCanvas', () => ({
  SourceViewportCanvas: function MockSourceViewportCanvas() {
    const s = canvasStub();
    canvasCtx.sources.push(s);
    return s;
  },
}));

vi.mock('../viewports/canvas/surfaces/FilteredViewportCanvas', () => ({
  FilteredViewportCanvas: function MockFilteredViewportCanvas() {
    const s = canvasStub();
    canvasCtx.filtereds.push(s);
    return s;
  },
}));

vi.mock('../viewports/canvas/surfaces/IndexedViewportCanvas', () => ({
  IndexedViewportCanvas: function MockIndexedViewportCanvas() {
    const s = canvasStub();
    canvasCtx.indexeds.push(s);
    return s;
  },
}));

function nullImageDep(): PipelineImageDep {
  return { get: () => null, subscribe: () => () => {} };
}

function createPipeline(imageDep: PipelineImageDep, onStateChange?: StateListener) {
  const physics = new ViewportPhysics();
  const toolState = new ToolState();
  return new ViewportPipeline(
    imageDep,
    physics,
    () => () => {},
    onStateChange,
    {
      getToolsState: () => toolState.getState(),
      subscribeTools: (l) => toolState.subscribe(l),
      addColorPinFromSample: vi.fn(),
    },
  );
}

describe('ViewportPipeline', () => {
  beforeEach(() => {
    pipelineWorkerCtx.created.length = 0;
    indexWorkerCtx.created.length = 0;
    canvasCtx.sources.length = 0;
    canvasCtx.filtereds.length = 0;
    canvasCtx.indexeds.length = 0;
    vi.clearAllMocks();
  });

  it('constructs stub viewports (no DOM) and wires one of each canvas class', () => {
    createPipeline(nullImageDep());
    expect(canvasCtx.sources).toHaveLength(1);
    expect(canvasCtx.filtereds).toHaveLength(1);
    expect(canvasCtx.indexeds).toHaveLength(1);
  });

  it('with a null imageDep yields merged state status idle for filter and index', () => {
    const p = createPipeline(nullImageDep());
    expect(p.getState()).toEqual({
      status: 'idle',
      error: null,
      indexedStatus: 'idle',
      indexedError: null,
      indexBlurSigma: DEFAULT_INDEX_BLUR_SIGMA,
    });
  });

  it('filters.setFilters delegates to FilterChainRunner', () => {
    const spy = vi.spyOn(FilterChainRunner.prototype, 'setFilters');
    const p = createPipeline(nullImageDep());
    spy.mockClear();
    const f: FilterInstance = { id: '1', type: 'blur', params: { blur: 1 } };
    p.filters.setFilters([f]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith([f]);
    spy.mockRestore();
  });

  it('setIndexedPaletteConfig delegates to IndexedPassRunner', () => {
    const spy = vi.spyOn(IndexedPassRunner.prototype, 'setIndexedPaletteConfig');
    const p = createPipeline(nullImageDep());
    spy.mockClear();
    const palette = [{ l: 50, a: 1, b: -2 }];
    p.setIndexedPaletteConfig({ palette });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toEqual({ palette });
    spy.mockRestore();
  });

  it('getState() merges runner slices and returns the same object when inputs are unchanged', () => {
    const p = createPipeline(nullImageDep());
    const a = p.getState();
    const b = p.getState();
    expect(b).toBe(a);
    expect(a.indexBlurSigma).toBe(DEFAULT_INDEX_BLUR_SIGMA);
  });
});
