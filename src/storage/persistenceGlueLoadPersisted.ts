import type { RawImage } from '../types';
import type { ImpastoDocumentSnapshot } from '../engine/core/impastoDocumentSnapshot';
import type { ImpastoEngine } from '../engine/core/ImpastoEngine';
import { DEFAULT_INDEX_BLUR_SIGMA } from '../engine/infra/engineConstants';
import type { IStorageAdapter } from './IStorageAdapter';
import type { IProjectMetadataAdapter } from './IProjectMetadataAdapter';
import { dtoToSnapshot, dtoToPigmentSettings } from './impastoProjectMapper';
import type { PigmentSettings } from './impastoProjectDto';
import { cloneRawImage } from './rawImageCompare';
import { isEditorStartupTimingEnabled, logEditorStartupPhase } from '../utils/editorStartupTiming';
import { startImagePrefetch } from './projectImagePrefetch';
import { getCachedImageUrl, setCachedImageUrl } from './projectImageUrlCache';
import {
  loadAdapterDtoAndProjectMeta,
  loadHydrationSourceImage,
  type ImagePrefetchHandle,
} from './persistenceGlueHydrationLoad';

type EngineDto = Awaited<ReturnType<IStorageAdapter['load']>>;
type NonNullEngineDto = NonNullable<EngineDto>;

type PersistenceGlueHydrateBookkeeping = {
  lastPersistedImageUrl: string | null;
  lastSavedImageCopy: RawImage | null;
  /** Dashboard `projects/{id}` title when `userId` was passed in; otherwise `''`. */
  projectName: string;
  /** Pigment settings from the persisted DTO; undefined when no document existed (blank project). */
  pigmentSettings: PigmentSettings | undefined;
};

type LoadPersistedDtoIntoEngineOptions = {
  /**
   * When set, `loadProjectMetadata` is called in parallel with the engine DTO load so both Firestore
   * round-trips overlap. The result populates `bookkeeping.projectName`.
   */
  projectMetadataAdapter?: IProjectMetadataAdapter;
  /**
   * Fires after the Firestore DTO is applied to the engine via `engine.loadDocument` with no pixels
   * yet (`sourceImage: null`), and before any image fetch/decode. Enables progressive UI (shell vs image-ready).
   */
  onStructuralReady?: () => void;
};

/**
 * New dashboard projects only have `projects/{id}` until the first engine save — `adapter.load` is null.
 * Without applying this snapshot, the in-memory {@link ImpastoEngine} would keep the **previous** route's
 * document + pixels while `PersistenceGlue` debounces saves to the **new** id (wrong project corruption).
 */
function blankPersistedProjectSnapshot(): ImpastoDocumentSnapshot {
  return {
    pins: [],
    filters: [],
    indexConfig: { blurSigma: DEFAULT_INDEX_BLUR_SIGMA },
    groups: [],
  };
}

async function hydrateEngineFromPersistedDto(
  engine: ImpastoEngine,
  dto: NonNullEngineDto,
  projectId: string,
  timing: boolean,
  t0: number,
  firestoreMs: number,
  cachedImageUrl: string | null | undefined,
  imagePrefetchHandle: ImagePrefetchHandle | null,
  options: LoadPersistedDtoIntoEngineOptions | undefined,
  projectName: string,
): Promise<PersistenceGlueHydrateBookkeeping> {
  engine.loadDocument(dtoToSnapshot(dto), null, {
    documentChangeIntent: 'hydrate',
  });
  options?.onStructuralReady?.();

  let imageFetchMs: number | undefined;
  let imageDecodeOk: boolean | undefined;
  let imageBreakdown: Record<string, unknown> | undefined;
  let sourceApply: RawImage | null = null;

  if (dto.imageUrl !== null) {
    const tImg = timing ? performance.now() : 0;
    const loaded = await loadHydrationSourceImage(
      dto.imageUrl,
      timing,
      cachedImageUrl,
      imagePrefetchHandle,
      tImg,
    );
    sourceApply = loaded.sourceApply;
    imageFetchMs = loaded.imageFetchMs;
    imageDecodeOk = loaded.imageDecodeOk;
    imageBreakdown = loaded.imageBreakdown;
  } else if (imagePrefetchHandle !== null) {
    imagePrefetchHandle.abort();
  }

  if (dto.imageUrl !== null && sourceApply !== null) {
    setCachedImageUrl(projectId, dto.imageUrl);
  }
  if (dto.imageUrl !== null) {
    engine.loadDocument(dtoToSnapshot(dto), sourceApply, {
      documentChangeIntent: 'hydrate',
    });
  }

  if (timing) {
    logEditorStartupPhase('persistence:hydrate ok', {
      projectIdSuffix: projectId.slice(-6),
      firestoreMs,
      imageWallMs: imageFetchMs,
      imageBreakdown,
      hadFirestoreDoc: true,
      hadImageUrl: dto.imageUrl != null,
      imageDecodeOk,
      hydrateTotalMs: Math.round((performance.now() - t0) * 10) / 10,
    });
  }

  return {
    lastPersistedImageUrl: dto.imageUrl,
    lastSavedImageCopy: cloneRawImage(engine.image.get()),
    projectName,
    pigmentSettings: dtoToPigmentSettings(dto),
  };
}

/**
 * Loads Firestore DTO + optional Storage image into the engine (hydration path).
 * Startup timings are logged when {@link isEditorStartupTimingEnabled} is true.
 *
 * When `options.projectMetadataAdapter` is set, the engine document read (`adapter.load`) and the
 * dashboard metadata read (`loadProjectMetadata`) run in parallel so both Firestore round-trips overlap.
 *
 * When `options.onStructuralReady` is set, it runs after the first `engine.loadDocument` (DTO
 * applied, `sourceImage: null`) and before the image fetch when `dto.imageUrl` is non-null.
 */
export async function loadPersistedDtoIntoEngine(
  engine: ImpastoEngine,
  adapter: IStorageAdapter,
  projectId: string,
  options?: LoadPersistedDtoIntoEngineOptions
): Promise<PersistenceGlueHydrateBookkeeping> {
  const timing = isEditorStartupTimingEnabled();
  const t0 = timing ? performance.now() : 0;

  try {
    // If we have a URL from the last visit, start the image GET immediately so it overlaps
    // Firestore. URL reconciliation (reuse vs abort) happens after `adapter.load()` resolves.
    const cachedImageUrl = getCachedImageUrl(projectId);
    const imagePrefetchHandle =
      cachedImageUrl != null && cachedImageUrl !== '' ? startImagePrefetch(cachedImageUrl) : null;

    const tDto = timing ? performance.now() : 0;
    const { dto, projectName } = await loadAdapterDtoAndProjectMeta(
      adapter,
      projectId,
      options?.projectMetadataAdapter,
    );

    if (dto === null && imagePrefetchHandle !== null) {
      imagePrefetchHandle.abort();
    }
    const firestoreMs = timing ? Math.round((performance.now() - tDto) * 10) / 10 : 0;

    if (dto !== null) {
      return await hydrateEngineFromPersistedDto(
        engine, dto, projectId, timing, t0, firestoreMs,
        cachedImageUrl, imagePrefetchHandle, options, projectName,
      );
    }

    engine.loadDocument(blankPersistedProjectSnapshot(), null, {
      documentChangeIntent: 'hydrate',
    });
    options?.onStructuralReady?.();

    if (timing) {
      logEditorStartupPhase('persistence:hydrate ok', {
        projectIdSuffix: projectId.slice(-6),
        firestoreMs,
        imageWallMs: undefined,
        imageBreakdown: undefined,
        hadFirestoreDoc: false,
        hadImageUrl: false,
        imageDecodeOk: undefined,
        hydrateTotalMs: Math.round((performance.now() - t0) * 10) / 10,
      });
    }
    return { lastPersistedImageUrl: null, lastSavedImageCopy: null, projectName, pigmentSettings: undefined };
  } catch (err) {
    console.error('[persistence] Failed to load project from storage', err);
    if (timing) {
      logEditorStartupPhase('persistence:hydrate failed (adapter.load)', {
        projectIdSuffix: projectId.slice(-6),
        hydrateTotalMs: Math.round((performance.now() - t0) * 10) / 10,
      });
    }
    return { lastPersistedImageUrl: null, lastSavedImageCopy: null, projectName: '', pigmentSettings: undefined };
  }
}
