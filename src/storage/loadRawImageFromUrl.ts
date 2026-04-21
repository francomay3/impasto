import { createRawImage, type RawImage } from '../types';

function assertImageResponseOk(response: Response): void {
  if (!response.ok) {
    throw new Error(`[persistence] Failed to fetch image: ${response.status} ${response.statusText}`);
  }
}

async function rawImageFromOkResponse(response: Response): Promise<RawImage> {
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return createRawImage(data, width, height);
}

/**
 * Decodes an already-fetched HTTP {@link Response} (e.g. from a prefetch) into a {@link RawImage}.
 * Throws if the response status is not OK.
 */
export async function loadRawImageFromOkResponse(response: Response): Promise<RawImage> {
  assertImageResponseOk(response);
  return rawImageFromOkResponse(response);
}

/**
 * Fetches a persisted image URL and decodes it into a {@link RawImage}.
 * Uses OffscreenCanvas for pixel extraction — runs in any browser context that supports it.
 */
export async function loadRawImageFromUrl(url: string): Promise<RawImage> {
  const response = await fetch(url);
  assertImageResponseOk(response);
  return rawImageFromOkResponse(response);
}

/** Sub-steps of {@link loadRawImageFromUrlWithBreakdown} for startup profiling (network vs decode vs GPU readback). */
type RawImageUrlBreakdown = {
  /** Until `fetch()` promise resolves (includes queueing + TLS when cold). */
  fetchUntilHeadersMs: number;
  /** `response.blob()` — reading the HTTP body after status is known. */
  bodyReadMs: number;
  /** `createImageBitmap`. */
  bitmapDecodeMs: number;
  /** Draw + `getImageData` (often large for wide images). */
  canvasRasterMs: number;
  totalMs: number;
};

/**
 * Same pixels as {@link loadRawImageFromUrl}, with coarse phase timings for diagnosing slow hydration.
 */
export async function loadRawImageFromUrlWithBreakdown(url: string): Promise<{
  raw: RawImage;
  breakdown: RawImageUrlBreakdown;
}> {
  const t0 = performance.now();
  const tFetch = performance.now();
  const response = await fetch(url);
  const fetchUntilHeadersMs = Math.round((performance.now() - tFetch) * 10) / 10;
  assertImageResponseOk(response);
  return decodeRawImageFromOkResponseWithBreakdown(response, fetchUntilHeadersMs, t0);
}

/**
 * Decodes a completed image {@link Response} with the same breakdown phases as
 * {@link loadRawImageFromUrlWithBreakdown}. Use `fetchUntilHeadersMs: 0` when the network work was
 * overlapped (e.g. startup prefetch).
 */
export async function loadRawImageFromOkResponseWithBreakdown(
  response: Response,
  fetchUntilHeadersMs: number,
): Promise<{
  raw: RawImage;
  breakdown: RawImageUrlBreakdown;
}> {
  const t0 = performance.now();
  assertImageResponseOk(response);
  return decodeRawImageFromOkResponseWithBreakdown(response, fetchUntilHeadersMs, t0);
}

async function decodeRawImageFromOkResponseWithBreakdown(
  response: Response,
  fetchUntilHeadersMs: number,
  t0: number,
): Promise<{
  raw: RawImage;
  breakdown: RawImageUrlBreakdown;
}> {
  const tBlob = performance.now();
  const blob = await response.blob();
  const bodyReadMs = Math.round((performance.now() - tBlob) * 10) / 10;

  const tBmp = performance.now();
  const bitmap = await createImageBitmap(blob);
  const bitmapDecodeMs = Math.round((performance.now() - tBmp) * 10) / 10;

  const tRaster = performance.now();
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const canvasRasterMs = Math.round((performance.now() - tRaster) * 10) / 10;

  const raw = createRawImage(data, width, height);
  const totalMs = Math.round((performance.now() - t0) * 10) / 10;

  return {
    raw,
    breakdown: {
      fetchUntilHeadersMs,
      bodyReadMs,
      bitmapDecodeMs,
      canvasRasterMs,
      totalMs,
    },
  };
}
