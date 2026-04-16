import type { ImpastoProjectDto } from './impastoProjectDto';
import type { PipelineIndexConfig } from '../ImpastoEngine/pipeline/pipelineIndexConfig';

/**
 * Collection id for engine {@link ImpastoProjectDto} documents. `FirestoreStorageAdapter` `load` / `save`
 * must use the same path segment so reads and writes align.
 */
export const IMPASTO_ENGINE_PROJECTS_COLLECTION = 'impasto_engine_projects';

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

  return {
    schemaVersion: 1,
    pins: structuredClone(rec.pins),
    filters: structuredClone(rec.filters),
    indexConfig: structuredClone(validatedIndexConfig),
    imageUrl,
  };
}
