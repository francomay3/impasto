import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { createRawImage } from '../../types';
import { IMPASTO_ENGINE_PROJECTS_COLLECTION } from './firestoreImpastoProjectDoc';
import type { ImpastoProjectDto } from './impastoProjectDto';

const {
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockDeleteObject,
  mockUploadBytes,
  mockGetDownloadURL,
  mockRef,
  mockRawImageToPngBlob,
} = vi.hoisted(() => ({
  mockDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockDeleteObject: vi.fn(),
  mockUploadBytes: vi.fn(),
  mockGetDownloadURL: vi.fn(),
  mockRef: vi.fn(),
  mockRawImageToPngBlob: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

vi.mock('firebase/storage', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  deleteObject: (...args: unknown[]) => mockDeleteObject(...args),
  uploadBytes: (...args: unknown[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
}));

vi.mock('./rawImageToPngBlob', () => ({
  rawImageToPngBlob: (...args: unknown[]) => mockRawImageToPngBlob(...args),
}));

import { FirestoreStorageAdapter } from './FirestoreStorageAdapter';

const TEST_USER_ID = 'user-abc';

describe('FirestoreStorageAdapter', () => {
  const db = {} as Firestore;
  const storage = {} as FirebaseStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteObject.mockResolvedValue(undefined);
    mockUploadBytes.mockResolvedValue(undefined);
    mockGetDownloadURL.mockResolvedValue('https://example.com/download.png');
    mockRawImageToPngBlob.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    mockDoc.mockImplementation((_d, ...segments: string[]) => ({ __path: segments.join('/') }));
    mockRef.mockImplementation((_s, pathOrUrl: string) => ({ __pathOrUrl: pathOrUrl }));
  });

  it('load returns null when the Firestore document is missing', async () => {
    const adapter = new FirestoreStorageAdapter(db, storage, TEST_USER_ID);
    const result = await adapter.load('missing-id');
    expect(result).toBeNull();
    expect(mockDoc).toHaveBeenCalledWith(
      db, 'users', TEST_USER_ID, IMPASTO_ENGINE_PROJECTS_COLLECTION, 'missing-id',
    );
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
  });

  it('load uses users/{userId}/impasto_engine_projects/{projectId} and parses DTO when doc exists', async () => {
    const firestorePayload = {
      schemaVersion: 1,
      pins: [{ id: 'p1', imageX: 0, imageY: 0, radiusPx: 1, color: '#fff' }],
      filters: [],
      indexConfig: { blurSigma: 4 },
      imageUrl: null,
    };
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => firestorePayload,
    });

    const adapter = new FirestoreStorageAdapter(db, storage, TEST_USER_ID);
    const result = await adapter.load('proj-42');

    expect(mockDoc).toHaveBeenCalledWith(
      db, 'users', TEST_USER_ID, IMPASTO_ENGINE_PROJECTS_COLLECTION, 'proj-42',
    );
    expect(result).toEqual({
      schemaVersion: 1,
      pins: firestorePayload.pins,
      filters: [],
      indexConfig: { blurSigma: 4 },
      imageUrl: null,
    });
  });

  it('save writes to users/{userId}/impasto_engine_projects/{projectId} with cloned DTO fields', async () => {
    const dto: ImpastoProjectDto = {
      schemaVersion: 1,
      pins: [],
      filters: [{ id: 'f1', type: 'brightness-contrast', enabled: true, params: { brightness: 1, contrast: 0 } }],
      indexConfig: { blurSigma: 2 },
      imageUrl: 'https://cdn.example/img.png',
    };

    const adapter = new FirestoreStorageAdapter(db, storage, TEST_USER_ID);
    await adapter.save('save-me', dto);

    expect(mockDoc).toHaveBeenCalledWith(
      db, 'users', TEST_USER_ID, IMPASTO_ENGINE_PROJECTS_COLLECTION, 'save-me',
    );
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, payload] = mockSetDoc.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(payload.schemaVersion).toBe(1);
    expect(payload.imageUrl).toBe(dto.imageUrl);
    expect(payload.indexConfig).toEqual({ blurSigma: 2 });
    expect(payload.pins).toEqual([]);
    expect(payload.filters).toEqual(dto.filters);
    expect(payload.filters).not.toBe(dto.filters);
  });

  it('uploadImage targets deterministic user-scoped Storage path under the project id', async () => {
    const data = new Uint8ClampedArray(4);
    data.set([255, 0, 0, 255]);
    const image = createRawImage(data, 1, 1);

    const adapter = new FirestoreStorageAdapter(db, storage, TEST_USER_ID);
    const url = await adapter.uploadImage('pid-99', image);

    expect(url).toBe('https://example.com/download.png');
    expect(mockRawImageToPngBlob).toHaveBeenCalledWith(image);
    expect(mockRef).toHaveBeenCalledWith(
      storage,
      `users/${TEST_USER_ID}/${IMPASTO_ENGINE_PROJECTS_COLLECTION}/pid-99/source.png`,
    );
    expect(mockUploadBytes).toHaveBeenCalledTimes(1);
    expect(mockGetDownloadURL).toHaveBeenCalledTimes(1);
  });

  it('when replacing an image, deleteImage completes before uploadImage issues Storage writes (glue contract)', async () => {
    const data = new Uint8ClampedArray(4);
    data.set([0, 255, 0, 255]);
    const image = createRawImage(data, 1, 1);

    const adapter = new FirestoreStorageAdapter(db, storage, TEST_USER_ID);
    await adapter.deleteImage('https://storage.googleapis.com/bucket/old.png');
    await adapter.uploadImage('same-project', image);

    expect(mockDeleteObject.mock.invocationCallOrder[0]).toBeLessThan(
      mockUploadBytes.mock.invocationCallOrder[0],
    );
  });
});
