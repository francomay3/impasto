import { getFirestoreProject, saveFirestoreImageUrl } from '../services/FirestoreService';
import { impastoEngineProjectSourceImageStoragePath } from './firestoreImpastoProjectDoc';

/**
 * Dashboard cards and orphan routing use `users/{userId}/projects/{projectId}.imageStorageUrl`.
 * Project v2 only writes pixels to `impasto_engine_projects/…/source.webp` until this runs.
 *
 * Call when the engine has decoded source pixels but the dashboard row has no thumbnail path yet
 * (e.g. first import in v2, or legacy rows created before this sync existed).
 *
 * @returns whether a Firestore write ran (caller may invalidate the projects list query only then).
 */
export async function ensureDashboardThumbnailForEngineProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const meta = await getFirestoreProject(userId, projectId);
  if (!meta || meta.imageStorageUrl) {
    return false;
  }
  await saveFirestoreImageUrl(
    userId,
    projectId,
    impastoEngineProjectSourceImageStoragePath(userId, projectId),
  );
  return true;
}
