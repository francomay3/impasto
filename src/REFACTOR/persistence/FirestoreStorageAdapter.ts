import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import type { RawImage } from '../../types';
import type { ImpastoProjectDto } from './impastoProjectDto';
import {
  IMPASTO_ENGINE_PROJECTS_COLLECTION,
  parseImpastoProjectDtoFromFirestoreData,
} from './firestoreImpastoProjectDoc';
import type { IStorageAdapter } from './IStorageAdapter';
import { rawImageToPngBlob } from './rawImageToPngBlob';

/** Firestore doc ref for a user-scoped engine project: `users/{userId}/impasto_engine_projects/{projectId}`. */
function impastoEngineProjectDocRef(db: Firestore, userId: string, projectId: string) {
  return doc(db, 'users', userId, IMPASTO_ENGINE_PROJECTS_COLLECTION, projectId);
}

/** Deterministic Storage path for the project's source image (overwritten on each upload). */
function impastoEngineProjectSourcePngStoragePath(userId: string, projectId: string): string {
  return `users/${userId}/${IMPASTO_ENGINE_PROJECTS_COLLECTION}/${projectId}/source.png`;
}

/**
 * Firestore + Firebase Storage implementation of {@link IStorageAdapter}.
 * Documents live at `users/{userId}/impasto_engine_projects/{projectId}`, matching the
 * Firestore security rules that scope access to the authenticated owner.
 */
export class FirestoreStorageAdapter implements IStorageAdapter {
  readonly db: Firestore;
  readonly storage: FirebaseStorage;
  readonly userId: string;

  constructor(db: Firestore, storage: FirebaseStorage, userId: string) {
    this.db = db;
    this.storage = storage;
    this.userId = userId;
  }

  async load(projectId: string): Promise<ImpastoProjectDto | null> {
    const snap = await getDoc(impastoEngineProjectDocRef(this.db, this.userId, projectId));
    if (!snap.exists()) {
      return null;
    }
    return parseImpastoProjectDtoFromFirestoreData(snap.data());
  }

  async save(projectId: string, dto: ImpastoProjectDto): Promise<void> {
    await setDoc(impastoEngineProjectDocRef(this.db, this.userId, projectId), {
      schemaVersion: dto.schemaVersion,
      pins: structuredClone(dto.pins),
      filters: structuredClone(dto.filters),
      indexConfig: structuredClone(dto.indexConfig),
      imageUrl: dto.imageUrl,
    });
  }

  async uploadImage(projectId: string, image: RawImage): Promise<string> {
    const blob = await rawImageToPngBlob(image);
    const storageRef = ref(
      this.storage,
      impastoEngineProjectSourcePngStoragePath(this.userId, projectId),
    );
    await uploadBytes(storageRef, blob, { contentType: 'image/png' });
    return getDownloadURL(storageRef);
  }

  async deleteImage(url: string): Promise<void> {
    const trimmed = url.trim();
    if (trimmed.length === 0) {
      return;
    }
    const storageRef = ref(this.storage, trimmed);
    try {
      await deleteObject(storageRef);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'storage/object-not-found'
      ) {
        return;
      }
      throw err;
    }
  }
}
