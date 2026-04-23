import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImpastoDocumentSnapshot } from '../engine/core/impastoDocumentSnapshot';
import type { ImpastoEngine } from '../engine/core/ImpastoEngine';
import type { IStorageAdapter } from './IStorageAdapter';
import type { IProjectMetadataAdapter } from './IProjectMetadataAdapter';
import type { ImpastoProjectDto } from './impastoProjectDto';
import { createRawImage, type RawImage } from '../types';
import { dtoToSnapshot } from './impastoProjectMapper';
import { PersistenceGlue } from './PersistenceGlue';

// Hoist mock so the factory can reference it before imports are evaluated
const mockLoadRawImageFromUrl = vi.hoisted(() => vi.fn<() => Promise<RawImage>>());
vi.mock('./loadRawImageFromUrl', () => ({
  loadRawImageFromUrl: mockLoadRawImageFromUrl,
}));
vi.mock('../utils/editorStartupTiming', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/editorStartupTiming')>();
  return {
    ...actual,
    isEditorStartupTimingEnabled: () => false,
  };
});

function assertSnapshotStructurallyEqual(a: ImpastoDocumentSnapshot, b: ImpastoDocumentSnapshot): void {
  expect([...a.pins]).toEqual([...b.pins]);
  expect([...a.filters]).toEqual([...b.filters]);
  expect({ ...a.indexConfig }).toEqual({ ...b.indexConfig });
  expect([...a.groups]).toEqual([...b.groups]);
}

function createTestDto(): ImpastoProjectDto {
  return {
    schemaVersion: 1,
    pins: [{ id: 'p1', imageX: 1, imageY: 2, radiusPx: 3, color: '#ff0000' }],
    filters: [
      {
        id: 'f1',
        type: 'brightness-contrast',
        params: { brightness: 0, contrast: 0 },
        enabled: true,
      },
    ],
    indexConfig: { blurSigma: 4 },
    groups: [],
    imageUrl: 'https://example.com/img.png',
  };
}

describe('PersistenceGlue.initialize', () => {
  let glue: PersistenceGlue | undefined;

  afterEach(() => {
    glue?.dispose();
    glue = undefined;
    vi.clearAllMocks();
  });

  it('loads image from url and calls engine.loadDocument with snapshot + image when load returns a document', async () => {
    const dto = createTestDto();
    const fakeImage = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    mockLoadRawImageFromUrl.mockResolvedValue(fakeImage);

    const loadDocument = vi.fn();
    const engine = {
      subscribeDocumentChanged: vi.fn(() => () => {}),
      loadDocument,
      getDocumentSnapshot: vi.fn(),
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    glue = new PersistenceGlue(engine, adapter);
    await glue.initialize('proj-1');

    expect(adapter.load).toHaveBeenCalledWith('proj-1');
    expect(mockLoadRawImageFromUrl).toHaveBeenCalledWith(dto.imageUrl);
    expect(loadDocument).toHaveBeenCalledTimes(2);
    const [structSnap, structImg, structOpts] = loadDocument.mock.calls[0] as [
      ImpastoDocumentSnapshot,
      unknown,
      { documentChangeIntent: 'hydrate' },
    ];
    assertSnapshotStructurallyEqual(structSnap, dtoToSnapshot(dto));
    expect(structImg).toBeNull();
    expect(structOpts).toEqual({ documentChangeIntent: 'hydrate' });
    const [passedSnapshot, passedImage, passedOptions] = loadDocument.mock.calls[1] as [
      ImpastoDocumentSnapshot,
      unknown,
      { documentChangeIntent: 'hydrate' },
    ];
    assertSnapshotStructurallyEqual(passedSnapshot, dtoToSnapshot(dto));
    expect(passedImage).toBe(fakeImage);
    expect(passedOptions).toEqual({ documentChangeIntent: 'hydrate' });
    expect(glue.projectName).toBe('');
  });

  it('exposes projectName from parallel projectMetadataAdapter.loadProjectMetadata when adapter is provided', async () => {
    const dto = createTestDto();
    const fakeImage = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    mockLoadRawImageFromUrl.mockResolvedValue(fakeImage);

    const loadDocument = vi.fn();
    const engine = {
      subscribeDocumentChanged: vi.fn(() => () => {}),
      loadDocument,
      getDocumentSnapshot: vi.fn(),
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    const metaAdapter: IProjectMetadataAdapter = {
      loadProjectMetadata: vi.fn(async () => ({ name: 'Parallel Hydrate Title' })),
      saveProjectMetadata: vi.fn(),
      setOrphaned: vi.fn(),
    };

    glue = new PersistenceGlue(engine, adapter, { projectMetadataAdapter: metaAdapter });
    await glue.initialize('proj-1');

    expect(metaAdapter.loadProjectMetadata).toHaveBeenCalledWith('proj-1');
    expect(glue.projectName).toBe('Parallel Hydrate Title');
  });

  it('hydrates without pixels when the image download fails (stale or forbidden URL)', async () => {
    const dto = createTestDto();
    mockLoadRawImageFromUrl.mockRejectedValue(new Error('403'));

    const loadDocument = vi.fn();
    const engine = {
      subscribeDocumentChanged: vi.fn(() => () => {}),
      loadDocument,
      getDocumentSnapshot: vi.fn(),
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    glue = new PersistenceGlue(engine, adapter);
    await glue.initialize('proj-403');

    expect(mockLoadRawImageFromUrl).toHaveBeenCalledWith(dto.imageUrl);
    expect(loadDocument).toHaveBeenCalledTimes(2);
    const [, passedImage, passedOptions] = loadDocument.mock.calls[1] as [
      ImpastoDocumentSnapshot,
      unknown,
      { documentChangeIntent: 'hydrate' },
    ];
    expect(passedImage).toBeNull();
    expect(passedOptions).toEqual({ documentChangeIntent: 'hydrate' });
  });

  it('calls engine.loadDocument with null sourceImage when dto.imageUrl is null', async () => {
    const dto: ImpastoProjectDto = { ...createTestDto(), imageUrl: null };

    const loadDocument = vi.fn();
    const engine = {
      subscribeDocumentChanged: vi.fn(() => () => {}),
      loadDocument,
      getDocumentSnapshot: vi.fn(),
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    glue = new PersistenceGlue(engine, adapter);
    await glue.initialize('proj-no-image');

    expect(mockLoadRawImageFromUrl).not.toHaveBeenCalled();
    expect(loadDocument).toHaveBeenCalledTimes(1);
    const [, passedImage, passedOptions] = loadDocument.mock.calls[0] as [
      ImpastoDocumentSnapshot,
      unknown,
      { documentChangeIntent: 'hydrate' },
    ];
    expect(passedImage).toBeNull();
    expect(passedOptions).toEqual({ documentChangeIntent: 'hydrate' });
  });

  it('forwards onStructuralReady from initialize options into hydration', async () => {
    const dto = createTestDto();
    const fakeImage = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    mockLoadRawImageFromUrl.mockResolvedValue(fakeImage);

    const loadDocument = vi.fn();
    const engine = {
      subscribeDocumentChanged: vi.fn(() => () => {}),
      loadDocument,
      getDocumentSnapshot: vi.fn(),
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    const onStructuralReady = vi.fn();
    glue = new PersistenceGlue(engine, adapter);
    await glue.initialize('proj-cb', { onStructuralReady });

    expect(onStructuralReady).toHaveBeenCalledTimes(1);
    expect(onStructuralReady.mock.invocationCallOrder[0]).toBeLessThan(
      mockLoadRawImageFromUrl.mock.invocationCallOrder[0]!,
    );
  });

  it('loads blank document when adapter.load returns null (new project, no engine doc yet)', async () => {
    const loadDocument = vi.fn();
    const engine = {
      subscribeDocumentChanged: vi.fn(() => () => {}),
      loadDocument,
      getDocumentSnapshot: vi.fn(),
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => null),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    glue = new PersistenceGlue(engine, adapter);
    await glue.initialize('new-proj');

    expect(adapter.load).toHaveBeenCalledWith('new-proj');
    expect(mockLoadRawImageFromUrl).not.toHaveBeenCalled();
    // A blank snapshot is always applied so a newly-routed engine doesn't keep the previous project's state.
    expect(loadDocument).toHaveBeenCalledTimes(1);
    const [snap, img] = loadDocument.mock.calls[0] as [ImpastoDocumentSnapshot, unknown];
    expect(snap).toEqual({ pins: [], filters: [], indexConfig: { blurSigma: 3 }, groups: [] });
    expect(img).toBeNull();
  });
});

describe('PersistenceGlue coalescing save', () => {
  let glue: PersistenceGlue | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    glue?.dispose();
    glue = undefined;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function createEngineWithDocumentListener(debounceMs: number, opts: {
    getDocumentSnapshot: () => ImpastoDocumentSnapshot;
    adapter: IStorageAdapter;
  }): { engine: ImpastoEngine; documentChanged: () => void } {
    let documentListener: (() => void) | undefined;
    const engine = {
      subscribeDocumentChanged: vi.fn((listener: () => void) => {
        documentListener = listener;
        return () => {
          documentListener = undefined;
        };
      }),
      loadDocument: vi.fn(),
      getDocumentSnapshot: vi.fn(opts.getDocumentSnapshot),
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    glue = new PersistenceGlue(engine, opts.adapter, { debounceMs });
    return {
      engine,
      documentChanged: () => {
        if (documentListener === undefined) {
          throw new Error('subscribeDocumentChanged was not wired');
        }
        documentListener();
      },
    };
  }

  it('debounces rapid document notifications into one save with the latest snapshot', async () => {
    let revision = 0;
    const snapshotFor = (n: number): ImpastoDocumentSnapshot =>
      Object.freeze({
        pins: Object.freeze([
          {
            id: 'p1',
            imageX: n,
            imageY: 0,
            radiusPx: 1,
            color: '#000000',
          },
        ]) as ImpastoDocumentSnapshot['pins'],
        filters: Object.freeze([]) as ImpastoDocumentSnapshot['filters'],
        indexConfig: Object.freeze({ blurSigma: 0 }),
        groups: Object.freeze([]),
      });

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => null),
      save: vi.fn(async () => {}),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    const { documentChanged } = createEngineWithDocumentListener(20, {
      getDocumentSnapshot: () => snapshotFor(revision),
      adapter,
    });

    await glue!.initialize('proj-coalesce');

    for (let i = 0; i < 30; i += 1) {
      revision = i;
      documentChanged();
    }

    await vi.advanceTimersByTimeAsync(20);
    await vi.runAllTimersAsync();

    expect(adapter.save).toHaveBeenCalledTimes(1);
    const saveCalls = vi.mocked(adapter.save).mock.calls;
    const dto = saveCalls[0]![1];
    expect(dto.pins[0]!.imageX).toBe(29);
    expect(saveCalls[0]![0]).toBe('proj-coalesce');
  });

  it('runs at most two saves when a second debounce fires while the first save is still in flight', async () => {
    let revision = 0;
    const snapshotFor = (n: number): ImpastoDocumentSnapshot =>
      Object.freeze({
        pins: Object.freeze([
          {
            id: 'p1',
            imageX: n,
            imageY: 0,
            radiusPx: 1,
            color: '#000000',
          },
        ]) as ImpastoDocumentSnapshot['pins'],
        filters: Object.freeze([]) as ImpastoDocumentSnapshot['filters'],
        indexConfig: Object.freeze({ blurSigma: 0 }),
        groups: Object.freeze([]),
      });

    let finishFirstSave: (() => void) | undefined;
    const firstSave = new Promise<void>((resolve) => {
      finishFirstSave = resolve;
    });

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => null),
      save: vi
        .fn()
        .mockImplementationOnce(() => firstSave)
        .mockResolvedValue(undefined),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    const { documentChanged } = createEngineWithDocumentListener(10, {
      getDocumentSnapshot: () => snapshotFor(revision),
      adapter,
    });

    await glue!.initialize('proj-chain');

    revision = 1;
    documentChanged();
    await vi.advanceTimersByTimeAsync(10);

    revision = 2;
    documentChanged();
    await vi.advanceTimersByTimeAsync(10);

    const saveCalls = vi.mocked(adapter.save).mock.calls;
    expect(adapter.save).toHaveBeenCalledTimes(1);
    expect(saveCalls[0]![1].pins[0]!.imageX).toBe(1);

    finishFirstSave!();
    await Promise.resolve();
    await Promise.resolve();

    expect(adapter.save).toHaveBeenCalledTimes(2);
    expect(saveCalls[1]![1].pins[0]!.imageX).toBe(2);
    expect(saveCalls[1]![0]).toBe('proj-chain');
  });

  it('replacing source image overwrites Storage without delete-first (avoids 403 while Firestore still holds old URL)', async () => {
    const imgA = createRawImage(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    const imgB = createRawImage(new Uint8ClampedArray([0, 255, 0, 255]), 1, 1);

    const snapshot = Object.freeze({
      pins: Object.freeze([]),
      filters: Object.freeze([]),
      indexConfig: Object.freeze({ blurSigma: 0 }),
      groups: Object.freeze([]),
    });

    let currentImage: RawImage | null = imgA;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => null),
      save: vi.fn(async () => {}),
      uploadImage: vi.fn(async () => 'https://storage.example/new-token'),
      deleteImage: vi.fn(),
    };

    let documentListener: (() => void) | undefined;
    const engine = {
      subscribeDocumentChanged: vi.fn((listener: () => void) => {
        documentListener = listener;
        return () => {
          documentListener = undefined;
        };
      }),
      loadDocument: vi.fn(),
      getDocumentSnapshot: vi.fn(() => snapshot),
      image: { get: () => currentImage },
    } as unknown as ImpastoEngine;

    glue = new PersistenceGlue(engine, adapter, { debounceMs: 10 });
    await glue.initialize('proj-replace-img');

    documentListener!();
    await vi.advanceTimersByTimeAsync(10);
    await vi.runAllTimersAsync();

    expect(adapter.uploadImage).toHaveBeenCalledTimes(1);
    expect(adapter.deleteImage).not.toHaveBeenCalled();

    currentImage = imgB;
    documentListener!();
    await vi.advanceTimersByTimeAsync(10);
    await vi.runAllTimersAsync();

    expect(adapter.uploadImage).toHaveBeenCalledTimes(2);
    expect(adapter.deleteImage).not.toHaveBeenCalled();
  });

  it('after a failed image fetch, debounced save deletes the stale Storage object and clears imageUrl', async () => {
    vi.useFakeTimers();
    const dto = createTestDto();
    mockLoadRawImageFromUrl.mockRejectedValue(new Error('403'));

    const loadDocument = vi.fn();
    let documentListener: (() => void) | undefined;
    const emptySnapshot = Object.freeze({
      pins: Object.freeze([]),
      filters: Object.freeze([]),
      indexConfig: Object.freeze({ blurSigma: 0 }),
      groups: Object.freeze([]),
    });
    const engine = {
      subscribeDocumentChanged: vi.fn((listener: () => void) => {
        documentListener = listener;
        return () => {
          documentListener = undefined;
        };
      }),
      loadDocument,
      getDocumentSnapshot: vi.fn(() => emptySnapshot),
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(async () => {}),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(async () => {}),
    };

    glue = new PersistenceGlue(engine, adapter, { debounceMs: 10 });
    await glue.initialize('proj-orphan-url');

    documentListener!();
    await vi.advanceTimersByTimeAsync(10);
    await vi.runAllTimersAsync();

    expect(adapter.deleteImage).toHaveBeenCalledWith(dto.imageUrl);
    expect(vi.mocked(adapter.save).mock.calls[0]![1].imageUrl).toBeNull();

    glue.dispose();
    vi.useRealTimers();
  });
});
