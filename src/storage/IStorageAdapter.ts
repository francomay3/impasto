import type { RawImage } from '../types';
import type { ImpastoProjectDto } from './impastoProjectDto';

/**
 * Swappable persistence backend for {@link ImpastoProjectDto} and source image blobs.
 * Implementations (e.g. Firestore + Firebase Storage) are wired by glue code; the engine stays I/O-free.
 */
export interface IStorageAdapter {
  load(projectId: string): Promise<ImpastoProjectDto | null>;
  save(projectId: string, dto: ImpastoProjectDto): Promise<void>;
  /** Uploads pixels for `projectId` and returns a stable download URL for the DTO. */
  uploadImage(projectId: string, image: RawImage): Promise<string>;
  deleteImage(url: string): Promise<void>;
}
