// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawImage } from '../../types';
import { ImpastoEngine } from './ImpastoEngine';
import type { ImpastoDocumentSnapshot } from './impastoDocumentSnapshot';
import { ViewportPipeline } from '../pipeline/ViewportPipeline';

const USED_AFTER_DISPOSE = 'ImpastoEngine: used after dispose';

type CanvasStub = {
  setImage: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  /** Required by {@link ViewportHub.subscribe} when wiring real engine pipelines. */
  setRequestNewTransform: ReturnType<typeof vi.fn>;
  /** Called by {@link ViewportHub.setTransform} for each subscribed viewport surface. */
  notifyTransformChange: ReturnType<typeof vi.fn>;
};

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
  return {
    setImage: vi.fn(),
    dispose: vi.fn(),
    setRequestNewTransform: vi.fn(),
    notifyTransformChange: vi.fn(),
  };
}

vi.mock('../../workers/img-pipeline.worker?worker', () => ({
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

vi.mock('../../workers/img-index.worker?worker', () => ({
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

describe('ImpastoEngine', () => {
  beforeEach(() => {
    pipelineWorkerCtx.created.length = 0;
    indexWorkerCtx.created.length = 0;
    canvasCtx.sources.length = 0;
    canvasCtx.filtereds.length = 0;
    canvasCtx.indexeds.length = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('palette rebuild path', () => {
    it('defers palette flush until after the resolver promise settles (microtasks after add)', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const spy = vi.spyOn(ViewportPipeline.prototype, 'setIndexedPaletteConfig');
      spy.mockClear();

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 2 });
      expect(spy).not.toHaveBeenCalled();

      await Promise.resolve();
      await Promise.resolve();
      expect(spy).toHaveBeenCalledTimes(1);

      engine.dispose();
    });

    it('removing a pin prunes selection to only valid remaining ids', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(4 * 4 * 4).fill(255), 4, 4);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 });
      const id1 = engine.colorPins.getAll()[0]!.id;
      engine.colorPins.add({ imageX: 1, imageY: 1, radiusPx: 1 });
      const id2 = engine.colorPins.getAll()[1]!.id;

      engine.selection.set([
        { kind: 'colorPin', id: id1 },
        { kind: 'colorPin', id: id2 },
      ]);

      engine.colorPins.remove(id1);
      expect(engine.selection.getAll()).toEqual([{ kind: 'colorPin', id: id2 }]);

      spy.mockRestore();
      engine.dispose();
    });

    it('removeMany prunes selection once for all removed pins', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(4 * 4 * 4).fill(255), 4, 4);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 });
      const id1 = engine.colorPins.getAll()[0]!.id;
      engine.colorPins.add({ imageX: 1, imageY: 1, radiusPx: 1 });
      const id2 = engine.colorPins.getAll()[1]!.id;
      engine.colorPins.add({ imageX: 2, imageY: 2, radiusPx: 1 });
      const id3 = engine.colorPins.getAll()[2]!.id;

      engine.selection.set([
        { kind: 'colorPin', id: id1 },
        { kind: 'colorPin', id: id2 },
        { kind: 'colorPin', id: id3 },
      ]);

      engine.colorPins.removeMany([id1, id3]);
      expect(engine.colorPins.getAll()).toHaveLength(1);
      expect(engine.selection.getAll()).toEqual([{ kind: 'colorPin', id: id2 }]);

      spy.mockRestore();
      engine.dispose();
    });

    it('reorderTo permutes pin order and records undo', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(4 * 4 * 4).fill(255), 4, 4);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 });
      engine.colorPins.add({ imageX: 1, imageY: 1, radiusPx: 1 });
      const [id0, id1] = engine.colorPins.getAll().map((p) => p.id);

      engine.colorPins.reorderTo([id1, id0]);
      expect(engine.colorPins.getAll().map((p) => p.id)).toEqual([id1, id0]);

      engine.managers.history.back();
      expect(engine.colorPins.getAll().map((p) => p.id)).toEqual([id0, id1]);

      spy.mockRestore();
      engine.dispose();
    });

    it('does not add a color pin outside raster extents when filtered image size is known', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 });
      expect(engine.colorPins.getAll()).toHaveLength(1);

      engine.colorPins.add({ imageX: 1, imageY: 0, radiusPx: 1 });
      engine.colorPins.add({ imageX: 0, imageY: -0.5, radiusPx: 1 });
      expect(engine.colorPins.getAll()).toHaveLength(1);

      spy.mockRestore();
      engine.dispose();
    });

    it('repositionMany clamps to placement extents and re-samples swatch from filtered image', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const data = new Uint8ClampedArray(10 * 10 * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
      const img = createRawImage(data, 10, 10);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 2, imageY: 3, radiusPx: 1 });
      const id = engine.colorPins.getAll()[0]!.id;

      engine.colorPins.repositionMany([{ id, imageX: 50, imageY: 3 }]);
      const p = engine.colorPins.getAll()[0]!;
      expect(p.imageX).toBeLessThan(10);
      expect(p.imageY).toBe(3);
      expect(p.color.toLowerCase()).toBe('#ff0000');

      spy.mockRestore();
      engine.dispose();
    });

    it('clearing all pins schedules a palette rebuild with an empty palette array', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 });
      await Promise.resolve();

      const spy = vi.spyOn(ViewportPipeline.prototype, 'setIndexedPaletteConfig');
      spy.mockClear();

      engine.colorPins.clear();
      expect(spy).not.toHaveBeenCalled();

      await Promise.resolve();
      await Promise.resolve();
      expect(spy).toHaveBeenCalledWith({ palette: [], pinIds: [] });

      engine.dispose();
    });
  });

  describe('color pin merge / middle placement', () => {
    it('mergePinsFromIds removes source pins, adds one pin, selects it', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(
        new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
        3,
        1,
      );
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 0 });
      const id1 = engine.colorPins.getAll()[0]!.id;
      engine.colorPins.add({ imageX: 2, imageY: 0, radiusPx: 0 });
      const id2 = engine.colorPins.getAll()[1]!.id;

      engine.colorPins.mergePinsFromIds([id1, id2]);

      const pins = engine.colorPins.getAll();
      expect(pins).toHaveLength(1);
      expect(pins[0]!.id).not.toBe(id1);
      expect(pins[0]!.id).not.toBe(id2);
      expect(engine.selection.getAll()).toEqual([{ kind: 'colorPin', id: pins[0]!.id }]);
      // x=1 is the grey pixel whose neighbourhood average has the smallest ΔE from the
      // Lab-space average of the red+blue pin colors — see colorPinBlendPlacement.test.ts.
      expect(pins[0]!.imageX).toBe(1);

      spy.mockRestore();
      engine.dispose();
    });

    it('addMiddlePinFromIds keeps originals and selects only the new pin', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(
        new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
        3,
        1,
      );
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 0 });
      const id1 = engine.colorPins.getAll()[0]!.id;
      engine.colorPins.add({ imageX: 2, imageY: 0, radiusPx: 0 });
      const id2 = engine.colorPins.getAll()[1]!.id;

      engine.selection.set([
        { kind: 'colorPin', id: id1 },
        { kind: 'colorPin', id: id2 },
      ]);

      engine.colorPins.addMiddlePinFromIds([id1, id2]);

      expect(engine.colorPins.getAll()).toHaveLength(3);
      const sel = engine.selection.getAll();
      expect(sel).toHaveLength(1);
      expect(sel[0]!.kind).toBe('colorPin');
      const newId = sel[0]!.id;
      expect(newId).not.toBe(id1);
      expect(newId).not.toBe(id2);
      expect(new Set(engine.colorPins.getAll().map((p) => p.id))).toEqual(new Set([id1, id2, newId]));

      spy.mockRestore();
      engine.dispose();
    });
  });

  describe('color pin history', () => {
    it('undo/redo add and remove pin layout', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(4 * 4 * 4).fill(200), 4, 4);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 });
      expect(engine.colorPins.getAll()).toHaveLength(1);

      engine.managers.history.back();
      expect(engine.colorPins.getAll()).toHaveLength(0);

      engine.managers.history.forward();
      expect(engine.colorPins.getAll()).toHaveLength(1);

      engine.colorPins.remove(engine.colorPins.getAll()[0]!.id);
      expect(engine.colorPins.getAll()).toHaveLength(0);

      engine.managers.history.back();
      expect(engine.colorPins.getAll()).toHaveLength(1);

      spy.mockRestore();
      engine.dispose();
    });

    it('sub-epsilon pointer drag end restores baseline with no history step', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(10 * 10 * 4).fill(255), 10, 10);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 5, imageY: 5, radiusPx: 1 });
      const id = engine.colorPins.getAll()[0]!.id;
      engine.colorPins.beginPointerDrag([id]);
      engine.colorPins.repositionMany([{ id, imageX: 5.5, imageY: 5.5 }]);
      engine.colorPins.endPointerDrag();

      const p = engine.colorPins.getAll()[0]!;
      expect(p.imageX).toBe(5);
      expect(p.imageY).toBe(5);
      // Drag did not push a step; the only undo is from the initial add.
      engine.managers.history.back();
      expect(engine.colorPins.getAll()).toHaveLength(0);

      spy.mockRestore();
      engine.dispose();
    });

    it('meaningful pointer drag end records one undo step', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(10 * 10 * 4).fill(255), 10, 10);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 5, imageY: 5, radiusPx: 1 });
      const id = engine.colorPins.getAll()[0]!.id;
      engine.colorPins.beginPointerDrag([id]);
      engine.colorPins.repositionMany([{ id, imageX: 9, imageY: 5 }]);
      engine.colorPins.endPointerDrag();

      expect(engine.colorPins.getAll()[0]!.imageX).toBe(9);
      expect(engine.managers.history.canUndo()).toBe(true);
      engine.managers.history.back();
      expect(engine.colorPins.getAll()[0]!.imageX).toBe(5);

      spy.mockRestore();
      engine.dispose();
    });

    it('remove commits an in-flight drag before deleting so history stays consistent', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(10 * 10 * 4).fill(255), 10, 10);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 5, imageY: 5, radiusPx: 1 });
      const id = engine.colorPins.getAll()[0]!.id;
      engine.colorPins.beginPointerDrag([id]);
      engine.colorPins.repositionMany([{ id, imageX: 9, imageY: 5 }]);
      engine.colorPins.remove(id);

      expect(engine.colorPins.getAll()).toHaveLength(0);
      engine.managers.history.back();
      expect(engine.colorPins.getAll()).toHaveLength(1);
      expect(engine.colorPins.getAll()[0]!.imageX).toBe(9);
      engine.managers.history.back();
      expect(engine.colorPins.getAll()[0]!.imageX).toBe(5);
      engine.managers.history.forward();
      expect(engine.colorPins.getAll()[0]!.imageX).toBe(9);
      engine.managers.history.forward();
      expect(engine.colorPins.getAll()).toHaveLength(0);

      spy.mockRestore();
      engine.dispose();
    });
  });

  describe('filter history', () => {
    const sampleChain = [
      {
        id: 'filter-test-1',
        type: 'brightness-contrast' as const,
        params: { brightness: 7, contrast: 2 },
      },
    ];

    it('setFilters records a history step; back restores prior chain; forward reapplies', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      expect(engine.managers.history.canUndo()).toBe(false);
      expect(engine.filters.getFilters()).toEqual([]);

      engine.filters.setFilters(sampleChain);
      expect(engine.managers.history.canUndo()).toBe(true);
      expect(engine.filters.getFilters()).toEqual(sampleChain);

      engine.managers.history.back();
      expect(engine.filters.getFilters()).toEqual([]);
      expect(engine.managers.history.canRedo()).toBe(true);

      engine.managers.history.forward();
      expect(engine.filters.getFilters()).toEqual(sampleChain);
      expect(engine.managers.history.canUndo()).toBe(true);

      engine.dispose();
    });

    it('setFilters that is JSON-equal to the current chain does not push history', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      engine.filters.setFilters(sampleChain);
      expect(engine.managers.history.canUndo()).toBe(true);

      engine.filters.setFilters(structuredClone(sampleChain));
      expect(engine.managers.history.canUndo()).toBe(true);

      engine.managers.history.back();
      expect(engine.filters.getFilters()).toEqual([]);
      expect(engine.managers.history.canUndo()).toBe(false);

      engine.dispose();
    });
  });

  describe('document snapshot roundtrip', () => {
    function assertImpastoDocumentSnapshotEqual(
      a: ImpastoDocumentSnapshot,
      b: ImpastoDocumentSnapshot,
    ): void {
      expect([...a.pins]).toEqual([...b.pins]);
      expect([...a.filters]).toEqual([...b.filters]);
      expect({ ...a.indexConfig }).toEqual({ ...b.indexConfig });
      expect([...a.groups]).toEqual([...b.groups]);
    }

    it('getDocumentSnapshot → loadDocument → getDocumentSnapshot is structurally equal (empty)', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const before = engine.getDocumentSnapshot();
      engine.loadDocument(before);
      const after = engine.getDocumentSnapshot();
      assertImpastoDocumentSnapshotEqual(before, after);
      expect(engine.managers.history.canUndo()).toBe(false);

      engine.dispose();
    });

    it('getDocumentSnapshot → loadDocument → getDocumentSnapshot is structurally equal (pins, filters, index)', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(4 * 4 * 4).fill(200), 4, 4);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 1, imageY: 2, radiusPx: 3 });
      engine.filters.setFilters([
        {
          id: 'roundtrip-filter',
          type: 'brightness-contrast',
          params: { brightness: 1, contrast: 2 },
        },
      ]);
      engine.pipeline.setIndexConfig({ blurSigma: 9.25 });

      const before = engine.getDocumentSnapshot();
      engine.loadDocument(before);
      const after = engine.getDocumentSnapshot();
      assertImpastoDocumentSnapshotEqual(before, after);
      expect(engine.managers.history.canUndo()).toBe(false);

      spy.mockRestore();
      engine.dispose();
    });

    it('loadDocument clears undo stack even when snapshot was taken after edits', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const img = createRawImage(new Uint8ClampedArray(4 * 4 * 4).fill(200), 4, 4);
      const spy = vi.spyOn(ViewportPipeline.prototype, 'getLastFilteredImage').mockReturnValue(img);

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 });
      engine.filters.setFilters([
        { id: 'f1', type: 'brightness-contrast', params: { brightness: 0, contrast: 0 } },
      ]);
      expect(engine.managers.history.canUndo()).toBe(true);

      const snap = engine.getDocumentSnapshot();
      engine.loadDocument(snap);
      expect(engine.managers.history.canUndo()).toBe(false);
      expect(engine.managers.history.canRedo()).toBe(false);

      spy.mockRestore();
      engine.dispose();
    });

    it('loadDocument defaults to hydrate and does not notify document subscribers', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const listener = vi.fn();
      engine.subscribeDocumentChanged(listener);
      engine.loadDocument(engine.getDocumentSnapshot());

      expect(listener).not.toHaveBeenCalled();

      engine.dispose();
    });

    it('loadDocument user-edit notifies document subscribers once', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const listener = vi.fn();
      engine.subscribeDocumentChanged(listener);
      engine.loadDocument(engine.getDocumentSnapshot(), undefined, {
        documentChangeIntent: 'user-edit',
      });

      expect(listener).toHaveBeenCalledTimes(1);

      engine.dispose();
    });
  });

  describe('lifecycle path', () => {
    it('viewport.setTransform notifies every subscribed viewport surface', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const next = { x: 4, y: 5, z: 1.25 };
      engine.viewport.setTransform(next);

      expect(canvasCtx.sources[0]!.notifyTransformChange).toHaveBeenCalledTimes(1);
      expect(canvasCtx.filtereds[0]!.notifyTransformChange).toHaveBeenCalledTimes(1);
      expect(canvasCtx.indexeds[0]!.notifyTransformChange).toHaveBeenCalledTimes(1);
      expect(engine.viewport.physics.transform).toEqual(next);

      engine.dispose();
    });

    it('viewport.subscribeTransform unsubscribe stops transform notifications', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const listener = vi.fn();
      const unsub = engine.viewport.subscribeTransform(listener);

      engine.viewport.setTransform({ x: 0, y: 0, z: 1 });
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      listener.mockClear();
      engine.viewport.setTransform({ x: 1, y: 1, z: 2 });
      expect(listener).not.toHaveBeenCalled();

      engine.dispose();
    });

    it('dispose is idempotent (second call does not re-dispose pipeline)', async () => {
      const disposeSpy = vi.spyOn(ViewportPipeline.prototype, 'dispose');
      const engine = new ImpastoEngine();
      await Promise.resolve();

      disposeSpy.mockClear();
      engine.dispose();
      engine.dispose();

      expect(disposeSpy).toHaveBeenCalledTimes(1);

      disposeSpy.mockRestore();
    });

    it('after dispose, pending palette rebuild microtask does not flush', async () => {
      const engine = new ImpastoEngine();
      await Promise.resolve();

      const spy = vi.spyOn(ViewportPipeline.prototype, 'setIndexedPaletteConfig');
      spy.mockClear();

      engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 });
      engine.dispose();

      await Promise.resolve();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('post-dispose guards', () => {
    async function disposedEngine(): Promise<ImpastoEngine> {
      const engine = new ImpastoEngine();
      await Promise.resolve();
      engine.dispose();
      return engine;
    }

    it('throws on image.set', async () => {
      const engine = await disposedEngine();
      const img = createRawImage(new Uint8ClampedArray([1, 2, 3, 255]), 1, 1);
      expect(() => engine.image.set(img)).toThrow(USED_AFTER_DISPOSE);
      expect(() => engine.image.set(null)).toThrow(USED_AFTER_DISPOSE);
    });

    it('throws on colorPins.add / remove / removeMany / clear / merge / addMiddle', async () => {
      const engine = await disposedEngine();
      expect(() => engine.colorPins.add({ imageX: 0, imageY: 0, radiusPx: 1 })).toThrow(
        USED_AFTER_DISPOSE,
      );
      expect(() => engine.colorPins.remove('any-id')).toThrow(USED_AFTER_DISPOSE);
      expect(() => engine.colorPins.removeMany(['a'])).toThrow(USED_AFTER_DISPOSE);
      expect(() => engine.colorPins.clear()).toThrow(USED_AFTER_DISPOSE);
      expect(() => engine.colorPins.mergePinsFromIds(['a', 'b'])).toThrow(USED_AFTER_DISPOSE);
      expect(() => engine.colorPins.addMiddlePinFromIds(['a', 'b'])).toThrow(USED_AFTER_DISPOSE);
      expect(() => engine.colorPins.beginPointerDrag(['a'])).toThrow(USED_AFTER_DISPOSE);
      expect(() => engine.colorPins.endPointerDrag()).toThrow(USED_AFTER_DISPOSE);
      expect(() => engine.colorPins.abortPointerDrag()).toThrow(USED_AFTER_DISPOSE);
    });

    it('throws on tools.setActiveTool', async () => {
      const engine = await disposedEngine();
      expect(() => engine.tools.setActiveTool('sample-color')).toThrow(USED_AFTER_DISPOSE);
    });

    it('throws on viewport.setTransform', async () => {
      const engine = await disposedEngine();
      expect(() => engine.viewport.setTransform({ x: 0, y: 0, z: 1 })).toThrow(USED_AFTER_DISPOSE);
    });

    it('throws on selection.pickColorPin', async () => {
      const engine = await disposedEngine();
      expect(() =>
        engine.selection.pickColorPin('id', { shiftKey: false, metaKey: false, ctrlKey: false }),
      ).toThrow(USED_AFTER_DISPOSE);
    });
  });
});
