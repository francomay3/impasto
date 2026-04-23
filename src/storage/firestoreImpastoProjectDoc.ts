import type { ImpastoProjectDto } from './impastoProjectDto';
import type { PipelineIndexConfig } from '../engine/pipeline/pipelineIndexConfig';

/** Subcollection under `users/{userId}/projects/{projectId}` holding the engine DTO. */
export const PROJECT_ENGINE_SUBCOLLECTION = 'engine';

/** Single document id for {@link ImpastoProjectDto} in that subcollection. */
export const PROJECT_ENGINE_STATE_DOC_ID = 'data';

/**
 * Deterministic Storage object path for the project source image (WebP).
 * Same path for engine uploads and legacy `ImageStorageService` uploads — one object per project.
 */
export function projectSourceImageWebpStoragePath(userId: string, projectId: string): string {
  return `users/${userId}/projects/${projectId}/source.webp`;
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
      const usePigmentMatchedColors =
        typeof ps.usePigmentMatchedColors === 'boolean' ? ps.usePigmentMatchedColors : false;
      pigmentSettings = {
        enabledNames: structuredClone(ps.enabledNames) as string[],
        minPaintPercent: ps.minPaintPercent,
        deltaThreshold: ps.deltaThreshold,
        usePigmentMatchedColors,
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
