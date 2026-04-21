// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImpastoEngine } from '../engine/core/ImpastoEngine';
import type { IStorageAdapter } from './IStorageAdapter';
import type { IProjectMetadataAdapter } from './IProjectMetadataAdapter';
import type { ImpastoProjectDto } from './impastoProjectDto';
import { createRawImage } from '../types';
import { dtoToSnapshot } from './impastoProjectMapper';
import { loadPersistedDtoIntoEngine } from './persistenceGlueLoadPersisted';
import { getCachedImageUrl, setCachedImageUrl } from './projectImageUrlCache';

const mockLoadRawImageFromUrlWithBreakdown = vi.hoisted(() =>
  vi.fn<(url: string) => Promise<{ raw: ReturnType<typeof createRawImage>; breakdown: object }>>(),
);

const mockLoadRawImageFromOkResponseWithBreakdown = vi.hoisted(() =>
  vi.fn<
    (
      response: Response,
      fetchUntilHeadersMs: number,
    ) => Promise<{ raw: ReturnType<typeof createRawImage>; breakdown: object }>
  >(),
);

const mockStartImagePrefetch = vi.hoisted(() => vi.fn());

vi.mock('./projectImagePrefetch', () => ({
  startImagePrefetch: mockStartImagePrefetch,
}));

vi.mock('./loadRawImageFromUrl', () => ({
  loadRawImageFromUrl: vi.fn(),
  loadRawImageFromUrlWithBreakdown: mockLoadRawImageFromUrlWithBreakdown,
  loadRawImageFromOkResponse: vi.fn(),
  loadRawImageFromOkResponseWithBreakdown: mockLoadRawImageFromOkResponseWithBreakdown,
}));

vi.mock('../utils/editorStartupTiming', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/editorStartupTiming')>();
  return {
    ...actual,
    isEditorStartupTimingEnabled: () => true,
  };
});

function dtoWithImage(url: string): ImpastoProjectDto {
  return {
    schemaVersion: 1,
    pins: [],
    filters: [],
    indexConfig: { blurSigma: 1 },
    groups: [],
    imageUrl: url,
  };
}

describe('loadPersistedDtoIntoEngine', () => {
  beforeEach(() => {
    // Avoid cross-test localStorage leakage affecting `getCachedImageUrl` + prefetch.
    globalThis.localStorage?.clear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    mockStartImagePrefetch.mockReset();
    mockLoadRawImageFromOkResponseWithBreakdown.mockReset();
    mockLoadRawImageFromUrlWithBreakdown.mockClear();
    mockLoadRawImageFromUrlWithBreakdown.mockResolvedValue({
      raw: createRawImage(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1),
      breakdown: {
        fetchUntilHeadersMs: 1,
        bodyReadMs: 2,
        bitmapDecodeMs: 3,
        canvasRasterMs: 4,
        totalMs: 10,
      },
    });
    mockLoadRawImageFromOkResponseWithBreakdown.mockResolvedValue({
      raw: createRawImage(new Uint8ClampedArray([5, 6, 7, 8]), 1, 1),
      breakdown: {
        fetchUntilHeadersMs: 0,
        bodyReadMs: 1,
        bitmapDecodeMs: 2,
        canvasRasterMs: 3,
        totalMs: 6,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('when timing enabled, loads image via breakdown path and calls loadDocument', async () => {
    const dto = dtoWithImage('https://example.com/x.png');
    const loadDocument = vi.fn();
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    const book = await loadPersistedDtoIntoEngine(engine, adapter, 'proj-z');

    expect(book.projectName).toBe('');
    expect(adapter.load).toHaveBeenCalledWith('proj-z');
    expect(mockLoadRawImageFromUrlWithBreakdown).toHaveBeenCalledWith(dto.imageUrl);
    expect(loadDocument).toHaveBeenCalledTimes(2);
    const [snap0, img0] = loadDocument.mock.calls[0];
    expect(snap0).toEqual(dtoToSnapshot(dto));
    expect(img0).toBeNull();
    const [snap1, img1] = loadDocument.mock.calls[1];
    expect(snap1).toEqual(dtoToSnapshot(dto));
    expect(img1).not.toBeNull();
    expect(getCachedImageUrl('proj-z')).toBe(dto.imageUrl);
  });

  it('calls onStructuralReady after structural loadDocument and before image fetch', async () => {
    const dto = dtoWithImage('https://example.com/ordered.png');
    const loadDocument = vi.fn();
    const onStructuralReady = vi.fn(() => {
      expect(mockLoadRawImageFromUrlWithBreakdown).not.toHaveBeenCalled();
    });
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    await loadPersistedDtoIntoEngine(engine, adapter, 'proj-order', { onStructuralReady });

    expect(loadDocument).toHaveBeenCalledTimes(2);
    expect(onStructuralReady).toHaveBeenCalledTimes(1);
    expect(mockLoadRawImageFromUrlWithBreakdown).toHaveBeenCalledWith(dto.imageUrl);
  });

  it('with empty image URL cache, does not start prefetch and loads via URL breakdown path', async () => {
    const url = 'https://example.com/no-cache.png';
    const dto = dtoWithImage(url);
    const loadDocument = vi.fn();
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    await loadPersistedDtoIntoEngine(engine, adapter, 'proj-empty-cache');

    expect(mockStartImagePrefetch).not.toHaveBeenCalled();
    expect(mockLoadRawImageFromUrlWithBreakdown).toHaveBeenCalledWith(url);
    expect(mockLoadRawImageFromOkResponseWithBreakdown).not.toHaveBeenCalled();
  });

  it('when cached URL matches DTO imageUrl, reuses prefetch response (decode from Response, not fresh URL fetch)', async () => {
    const url = 'https://example.com/match.png';
    setCachedImageUrl('proj-match', url);

    const okResponse = new Response(new Uint8Array([0xff, 0xd8, 0xff]), { status: 200 });
    const abort = vi.fn();
    mockStartImagePrefetch.mockReturnValue({
      promise: Promise.resolve(okResponse),
      abort,
    });

    const dto = dtoWithImage(url);
    const loadDocument = vi.fn();
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    await loadPersistedDtoIntoEngine(engine, adapter, 'proj-match');

    expect(mockStartImagePrefetch).toHaveBeenCalledWith(url);
    expect(mockLoadRawImageFromOkResponseWithBreakdown).toHaveBeenCalledTimes(1);
    expect(mockLoadRawImageFromOkResponseWithBreakdown).toHaveBeenCalledWith(okResponse, 0);
    expect(mockLoadRawImageFromUrlWithBreakdown).not.toHaveBeenCalled();
    expect(abort).not.toHaveBeenCalled();
  });

  it('when cached URL differs from DTO imageUrl, aborts prefetch and loads fresh URL', async () => {
    const cachedUrl = 'https://example.com/stale.png';
    const dtoUrl = 'https://example.com/current.png';
    setCachedImageUrl('proj-mismatch', cachedUrl);

    const abort = vi.fn();
    mockStartImagePrefetch.mockReturnValue({
      promise: new Promise<Response>(() => {
        /* intentionally unresolved — should be aborted */
      }),
      abort,
    });

    const dto = dtoWithImage(dtoUrl);
    const loadDocument = vi.fn();
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    await loadPersistedDtoIntoEngine(engine, adapter, 'proj-mismatch');

    expect(mockStartImagePrefetch).toHaveBeenCalledWith(cachedUrl);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(mockLoadRawImageFromUrlWithBreakdown).toHaveBeenCalledWith(dtoUrl);
    expect(mockLoadRawImageFromOkResponseWithBreakdown).not.toHaveBeenCalled();
  });

  it('when projectMetadataAdapter is provided, runs adapter.load and loadProjectMetadata in parallel', async () => {
    const metaAdapter: IProjectMetadataAdapter = {
      loadProjectMetadata: vi.fn(async () => ({ name: 'Parallel dashboard title' })),
      saveProjectMetadata: vi.fn(),
    };
    const dto = dtoWithImage('https://example.com/parallel.png');
    const loadDocument = vi.fn();
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    const book = await loadPersistedDtoIntoEngine(engine, adapter, 'proj-parallel', {
      projectMetadataAdapter: metaAdapter,
    });

    expect(adapter.load).toHaveBeenCalledWith('proj-parallel');
    expect(metaAdapter.loadProjectMetadata).toHaveBeenCalledWith('proj-parallel');
    expect(book.projectName).toBe('Parallel dashboard title');
    expect(loadDocument).toHaveBeenCalledTimes(2);
  });

  it('when projectMetadataAdapter.loadProjectMetadata rejects, hydrates with empty projectName', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const metaAdapter: IProjectMetadataAdapter = {
      loadProjectMetadata: vi.fn().mockRejectedValue(new Error('metadata unavailable')),
      saveProjectMetadata: vi.fn(),
    };
    const dto = dtoWithImage('https://example.com/meta-fail.png');
    const loadDocument = vi.fn();
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => dto),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    const book = await loadPersistedDtoIntoEngine(engine, adapter, 'proj-meta-fail', {
      projectMetadataAdapter: metaAdapter,
    });

    expect(book.projectName).toBe('');
    expect(loadDocument).toHaveBeenCalledTimes(2);
    expect(metaAdapter.loadProjectMetadata).toHaveBeenCalledWith('proj-meta-fail');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('when adapter returns no engine doc, resets engine with blank snapshot and null image', async () => {
    const metaAdapter: IProjectMetadataAdapter = {
      loadProjectMetadata: vi.fn(async () => ({ name: 'Fresh row' })),
      saveProjectMetadata: vi.fn(),
    };
    const loadDocument = vi.fn();
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => null),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    const book = await loadPersistedDtoIntoEngine(engine, adapter, 'proj-no-dto', {
      projectMetadataAdapter: metaAdapter,
    });

    expect(book.projectName).toBe('Fresh row');
    expect(book.lastPersistedImageUrl).toBeNull();
    expect(loadDocument).toHaveBeenCalledTimes(1);
    const [snap, img] = loadDocument.mock.calls[0];
    expect(snap).toEqual({
      pins: [],
      filters: [],
      indexConfig: { blurSigma: 3 },
      groups: [],
    });
    expect(img).toBeNull();
  });

  it('when adapter returns no engine doc, invokes onStructuralReady after structural loadDocument', async () => {
    const loadDocument = vi.fn();
    const onStructuralReady = vi.fn();
    const engine = {
      loadDocument,
      image: { get: vi.fn(() => null) },
    } as unknown as ImpastoEngine;

    const adapter: IStorageAdapter = {
      load: vi.fn(async () => null),
      save: vi.fn(),
      uploadImage: vi.fn(),
      deleteImage: vi.fn(),
    };

    await loadPersistedDtoIntoEngine(engine, adapter, 'proj-no-dto-cb', {
      onStructuralReady,
    });

    expect(onStructuralReady).toHaveBeenCalledTimes(1);
    expect(loadDocument).toHaveBeenCalledTimes(1);
    expect(onStructuralReady.mock.invocationCallOrder[0]).toBeGreaterThan(
      loadDocument.mock.invocationCallOrder[0],
    );
  });
});
