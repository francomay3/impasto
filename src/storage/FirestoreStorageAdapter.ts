import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import type { RawImage } from '../types';
import type { ImpastoProjectDto } from './impastoProjectDto';
import {
  IMPASTO_ENGINE_PROJECTS_COLLECTION,
  impastoEngineProjectSourceImageStoragePath,
  parseImpastoProjectDtoFromFirestoreData,
} from './firestoreImpastoProjectDoc';
import { pathsToUndefinedValues } from './firestoreUndefinedPaths';
import type { IStorageAdapter } from './IStorageAdapter';
import type { IProjectMetadataAdapter } from './IProjectMetadataAdapter';
import type { ProjectMetadata } from './projectMetadata';
import { rawImageToWebpBlob } from './rawImageToWebpBlob';

/** Firestore doc ref for a user-scoped engine project: `users/{userId}/impasto_engine_projects/{projectId}`. */
function impastoEngineProjectDocRef(db: Firestore, userId: string, projectId: string) {
  return doc(db, 'users', userId, IMPASTO_ENGINE_PROJECTS_COLLECTION, projectId);
}

/**
 * Firestore + Firebase Storage implementation of {@link IStorageAdapter}.
 * Documents live at `users/{userId}/impasto_engine_projects/{projectId}`, matching the
 * Firestore security rules that scope access to the authenticated owner.
 */
export class FirestoreStorageAdapter implements IStorageAdapter, IProjectMetadataAdapter {
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
    const payload = {
      schemaVersion: dto.schemaVersion,
      pins: structuredClone(dto.pins),
      filters: structuredClone(dto.filters),
      indexConfig: structuredClone(dto.indexConfig),
      // groups and pigmentSettings are optional fields added after the initial schema —
      // spread conditionally so setDoc doesn't write undefined into Firestore.
      ...(dto.groups != null ? { groups: structuredClone(dto.groups) } : {}),
      ...(dto.pigmentSettings != null ? { pigmentSettings: structuredClone(dto.pigmentSettings) } : {}),
      imageUrl: dto.imageUrl,
    };
    const undefinedPaths = pathsToUndefinedValues(payload);
    if (undefinedPaths.length > 0) {
      console.error('[persistence] Firestore setDoc payload contains undefined at:', undefinedPaths, {
        projectId,
        payloadPreview: JSON.stringify(payload, (_k, v) => (v === undefined ? '__undefined__' : v)),
      });
    }
    await setDoc(impastoEngineProjectDocRef(this.db, this.userId, projectId), payload);
  }

  async uploadImage(projectId: string, image: RawImage): Promise<string> {
    const blob = await rawImageToWebpBlob(image);
    const storageRef = ref(
      this.storage,
      impastoEngineProjectSourceImageStoragePath(this.userId, projectId),
    );
    await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
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

  // Dashboard project doc: `users/{userId}/projects/{projectId}`.
  // Separate from the engine collection (`impasto_engine_projects`) — engine data and project
  // metadata live in different sub-collections under the same user document.
  private projectDocRef(projectId: string) {
    return doc(this.db, 'users', this.userId, 'projects', projectId);
  }

  async loadProjectMetadata(projectId: string): Promise<ProjectMetadata | null> {
    const snap = await getDoc(this.projectDocRef(projectId));
    if (!snap.exists()) return null;
    const name = (snap.data() as Record<string, unknown>)['name'];
    return { name: typeof name === 'string' ? name : '' };
  }

  async saveProjectMetadata(projectId: string, metadata: ProjectMetadata): Promise<void> {
    await updateDoc(this.projectDocRef(projectId), {
      name: metadata.name,
      updatedAt: serverTimestamp(),
    });
  }
}
