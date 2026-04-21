import type { ImpastoProjectDto } from './impastoProjectDto';
import type { PipelineIndexConfig } from '../engine/pipeline/pipelineIndexConfig';

/**
 * Collection id for engine {@link ImpastoProjectDto} documents. `FirestoreStorageAdapter` `load` / `save`
 * must use the same path segment so reads and writes align.
 */
export const IMPASTO_ENGINE_PROJECTS_COLLECTION = 'impasto_engine_projects';

/**
 * Deterministic Storage object path for the engine project's source image (same convention as
 * {@link FirestoreStorageAdapter.uploadImage}). Dashboard `imageStorageUrl` can store this path so
 * thumbnails resolve via `getProjectImageUrl` without duplicating bytes under `projects/…/image`.
 */
export function impastoEngineProjectSourceImageStoragePath(userId: string, projectId: string): string {
  return `users/${userId}/${IMPASTO_ENGINE_PROJECTS_COLLECTION}/${projectId}/source.webp`;
}

/**
 * Parses untyped Firestore document data into {@link ImpastoProjectDto}.
 *
 * @throws If `schemaVersion` is missing or not supported, or required fields are malformed.
 */
export function parseImpastoProjectDtoFromFirestoreData(data: unknown): ImpastoProjectDto {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Impasto project document must contain a JSON object');
  }
  const rec = data as Record<string, unknown>;

  const schemaVersion = rec.schemaVersion;
  if (typeof schemaVersion !== 'number' || schemaVersion !== 1) {
    throw new Error(
      `Unsupported ImpastoProjectDto schemaVersion: ${String(schemaVersion)} (expected 1). ` +
        'Add a migration branch in parseImpastoProjectDtoFromFirestoreData when bumping the schema.'
    );
  }

  if (!Array.isArray(rec.pins)) {
    throw new Error('Impasto project document is missing a valid "pins" array');
  }
  if (!Array.isArray(rec.filters)) {
    throw new Error('Impasto project document is missing a valid "filters" array');
  }
  const indexConfig = rec.indexConfig;
  if (
    typeof indexConfig !== 'object' ||
    indexConfig === null ||
    typeof (indexConfig as { blurSigma?: unknown }).blurSigma !== 'number'
  ) {
    throw new Error('Impasto project document is missing a valid "indexConfig" object with blurSigma');
  }

  const validatedIndexConfig: PipelineIndexConfig = {
    blurSigma: (indexConfig as { blurSigma: number }).blurSigma,
  };

  let imageUrl: string | null;
  if (rec.imageUrl === undefined || rec.imageUrl === null) {
    imageUrl = null;
  } else if (typeof rec.imageUrl === 'string') {
    imageUrl = rec.imageUrl;
  } else {
    throw new Error('Impasto project document "imageUrl" must be a string or null');
  }

  let groups: ImpastoProjectDto['groups'];
  if (rec.groups === undefined) {
    groups = undefined;
  } else if (Array.isArray(rec.groups)) {
    groups = structuredClone(rec.groups);
  } else {
    throw new Error('Impasto project document "groups" must be an array when present');
  }

  let pigmentSettings: ImpastoProjectDto['pigmentSettings'];
  if (rec.pigmentSettings !== undefined) {
    const ps = rec.pigmentSettings as Record<string, unknown>;
    if (
      typeof ps === 'object' &&
      ps !== null &&
      Array.isArray(ps.enabledNames) &&
      typeof ps.minPaintPercent === 'number' &&
      typeof ps.deltaThreshold === 'number'
    ) {
      pigmentSettings = {
        enabledNames: structuredClone(ps.enabledNames) as string[],
        minPaintPercent: ps.minPaintPercent,
        deltaThreshold: ps.deltaThreshold,
      };
    }
  }

  return {
    schemaVersion: 1,
    pins: structuredClone(rec.pins),
    filters: structuredClone(rec.filters),
    indexConfig: structuredClone(validatedIndexConfig),
    ...(groups !== undefined ? { groups } : {}),
    ...(pigmentSettings !== undefined ? { pigmentSettings } : {}),
    imageUrl,
  };
}
