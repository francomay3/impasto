import type { RawImage } from '../types';
import type { IStorageAdapter } from './IStorageAdapter';
import type { IProjectMetadataAdapter } from './IProjectMetadataAdapter';
import {
  loadRawImageFromOkResponse,
  loadRawImageFromOkResponseWithBreakdown,
  loadRawImageFromUrl,
  loadRawImageFromUrlWithBreakdown,
} from './loadRawImageFromUrl';
import { startImagePrefetch } from './projectImagePrefetch';

export type ImagePrefetchHandle = ReturnType<typeof startImagePrefetch>;

type HydrationSourceImageResult = {
  sourceApply: RawImage | null;
  imageFetchMs?: number;
  imageDecodeOk?: boolean;
  imageBreakdown?: Record<string, unknown>;
};

type EngineDto = Awaited<ReturnType<IStorageAdapter['load']>>;

/**
 * Runs `adapter.load` and optionally `projectMetadataAdapter.loadProjectMetadata` in parallel so
 * both Firestore round-trips overlap when a metadata adapter is provided.
 */
export async function loadAdapterDtoAndProjectMeta(
  adapter: IStorageAdapter,
  projectId: string,
  projectMetadataAdapter: IProjectMetadataAdapter | undefined,
): Promise<{ dto: EngineDto; projectName: string }> {
  if (projectMetadataAdapter != null) {
    const [dto, meta] = await Promise.all([
      adapter.load(projectId),
      projectMetadataAdapter.loadProjectMetadata(projectId).catch((err) => {
        console.warn(
          '[persistence] loadProjectMetadata failed during parallel hydrate; continuing with engine doc only',
          err
        );
        return null;
      }),
    ]);
    return { dto, projectName: meta?.name ?? '' };
  }
  return { dto: await adapter.load(projectId), projectName: '' };
}

function prefetchUrlMatchesDto(
  imagePrefetchHandle: ImagePrefetchHandle | null,
  cachedImageUrl: string | null | undefined,
  dtoImageUrl: string,
): boolean {
  return (
    imagePrefetchHandle !== null &&
    cachedImageUrl != null &&
    cachedImageUrl !== '' &&
    dtoImageUrl === cachedImageUrl
  );
}

async function tryDecodePrefetchResponse<R>(
  imagePrefetchHandle: ImagePrefetchHandle,
  decode: (response: Response) => Promise<R>,
): Promise<R | null> {
  try {
    const response = await imagePrefetchHandle.promise;
    return await decode(response);
  } catch {
    return null;
  }
}

async function loadWithBreakdown(
  dtoImageUrl: string,
  urlMatches: boolean,
  imagePrefetchHandle: ImagePrefetchHandle | null,
  tImg: number,
): Promise<HydrationSourceImageResult> {
  let fromPrefetch: Awaited<ReturnType<typeof loadRawImageFromOkResponseWithBreakdown>> | null = null;
  if (urlMatches && imagePrefetchHandle !== null) {
    fromPrefetch = await tryDecodePrefetchResponse(imagePrefetchHandle, (response) =>
      loadRawImageFromOkResponseWithBreakdown(response, 0)
    );
  }
  const { raw, breakdown } =
    fromPrefetch ?? (await loadRawImageFromUrlWithBreakdown(dtoImageUrl));
  return {
    sourceApply: raw,
    imageDecodeOk: true,
    imageFetchMs: Math.round((performance.now() - tImg) * 10) / 10,
    imageBreakdown: {
      fetchUntilHeadersMs: breakdown.fetchUntilHeadersMs,
      bodyReadMs: breakdown.bodyReadMs,
      bitmapDecodeMs: breakdown.bitmapDecodeMs,
      canvasRasterMs: breakdown.canvasRasterMs,
      measuredTotalMs: breakdown.totalMs,
    },
  };
}

async function loadWithoutBreakdown(
  dtoImageUrl: string,
  urlMatches: boolean,
  imagePrefetchHandle: ImagePrefetchHandle | null,
): Promise<HydrationSourceImageResult> {
  let rawFromPrefetch: RawImage | null = null;
  if (urlMatches && imagePrefetchHandle !== null) {
    rawFromPrefetch = await tryDecodePrefetchResponse(imagePrefetchHandle, loadRawImageFromOkResponse);
  }
  return {
    sourceApply: rawFromPrefetch ?? (await loadRawImageFromUrl(dtoImageUrl)),
    imageDecodeOk: true,
  };
}

/**
 * Loads the source image for hydration, reusing an in-flight prefetch when the URL matches.
 * Aborts the prefetch when the URL changed. Returns `sourceApply: null` on fetch/decode failure.
 */
export async function loadHydrationSourceImage(
  dtoImageUrl: string,
  timing: boolean,
  cachedImageUrl: string | null | undefined,
  imagePrefetchHandle: ImagePrefetchHandle | null,
  tImg: number,
): Promise<HydrationSourceImageResult> {
  const urlMatches = prefetchUrlMatchesDto(imagePrefetchHandle, cachedImageUrl, dtoImageUrl);
  if (!urlMatches && imagePrefetchHandle !== null) {
    imagePrefetchHandle.abort();
  }

  try {
    if (timing) {
      return await loadWithBreakdown(dtoImageUrl, urlMatches, imagePrefetchHandle, tImg);
    }
    return await loadWithoutBreakdown(dtoImageUrl, urlMatches, imagePrefetchHandle);
  } catch (err) {
    console.error('[persistence] Source image fetch/decode failed; hydrating document without pixels.', err);
    const imageFetchMs = timing ? Math.round((performance.now() - tImg) * 10) / 10 : undefined;
    return { sourceApply: null, imageDecodeOk: false, imageFetchMs };
  }
}
