import { beforeEach, describe, expect, it, vi } from 'vitest';
import { impastoEngineProjectSourceImageStoragePath } from './firestoreImpastoProjectDoc';
import { ensureDashboardThumbnailForEngineProject } from './ensureDashboardThumbnailForEngineProject';
import { DEFAULT_PROJECT_STATE } from '../types';

const mockGetFirestoreProject = vi.fn();
const mockSaveFirestoreImageUrl = vi.fn();

vi.mock('../services/FirestoreService', () => ({
  getFirestoreProject: (...args: unknown[]) => mockGetFirestoreProject(...args),
  saveFirestoreImageUrl: (...args: unknown[]) => mockSaveFirestoreImageUrl(...args),
}));

describe('ensureDashboardThumbnailForEngineProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false and does not write when dashboard doc is missing', async () => {
    mockGetFirestoreProject.mockResolvedValue(null);
    const out = await ensureDashboardThumbnailForEngineProject('u1', 'p1');
    expect(out).toBe(false);
    expect(mockSaveFirestoreImageUrl).not.toHaveBeenCalled();
  });

  it('returns false when imageStorageUrl is already set', async () => {
    mockGetFirestoreProject.mockResolvedValue({
      ...DEFAULT_PROJECT_STATE,
      id: 'p1',
      imageStorageUrl: 'users/u1/projects/p1/image',
    });
    const out = await ensureDashboardThumbnailForEngineProject('u1', 'p1');
    expect(out).toBe(false);
    expect(mockSaveFirestoreImageUrl).not.toHaveBeenCalled();
  });

  it('writes engine source.webp path and returns true when metadata has no thumbnail url', async () => {
    mockGetFirestoreProject.mockResolvedValue({
      ...DEFAULT_PROJECT_STATE,
      id: 'p1',
    });
    mockSaveFirestoreImageUrl.mockResolvedValue(undefined);
    const out = await ensureDashboardThumbnailForEngineProject('u1', 'p1');
    expect(out).toBe(true);
    expect(mockSaveFirestoreImageUrl).toHaveBeenCalledWith(
      'u1',
      'p1',
      impastoEngineProjectSourceImageStoragePath('u1', 'p1'),
    );
  });
});
