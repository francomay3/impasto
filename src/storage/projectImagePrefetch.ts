/**
 * Kicks off a non-decoding HTTP GET for a project image URL so bytes can overlap with Firestore
 * (see editor-startup-perf Phase 3). Callers reuse the same {@link Response} in the decode path
 * when the URL still matches after `adapter.load()` resolves, or {@link startImagePrefetch.abort}
 * if the canonical URL changed.
 */

/**
 * Starts `fetch(url)` immediately with an {@link AbortController} signal. Network only — no
 * `blob()`, `createImageBitmap`, or canvas readback.
 */
export function startImagePrefetch(url: string): {
  promise: Promise<Response>;
  abort: () => void;
} {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal });
  return {
    promise,
    abort: () => {
      controller.abort();
    },
  };
}
