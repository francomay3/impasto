import type { ProjectMetadata } from './projectMetadata';

/**
 * Persistence backend for project-scoped metadata that lives outside the engine document.
 * Implemented by {@link FirestoreStorageAdapter}; injected into {@link PersistenceGlue} to enable
 * parallel metadata hydration and imperative saves (e.g. rename) without coupling callers to Firestore.
 */
export interface IProjectMetadataAdapter {
  loadProjectMetadata(projectId: string): Promise<ProjectMetadata | null>;
  saveProjectMetadata(projectId: string, metadata: ProjectMetadata): Promise<void>;
}
