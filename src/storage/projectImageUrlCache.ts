/**
 * Persists the last known project source image URL in `localStorage` so the next editor visit
 * can start prefetching the image in parallel with Firestore (see editor-startup-perf Phase 3).
 *
 * Keys are namespaced and project ids are encoded so odd characters cannot collide with the prefix.
 */

const STORAGE_KEY_PREFIX = 'impasto:v1:projectImageUrl:';

function storageKeyForProject(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(projectId)}`;
}

/**
 * Returns the cached image URL for this project, or `null` if missing, empty, or storage is unavailable.
 */
export function getCachedImageUrl(projectId: string): string | null {
  try {
    const raw = globalThis.localStorage?.getItem(storageKeyForProject(projectId));
    if (raw === null || raw === '') {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

/**
 * Writes the current image URL for this project. Failures (quota, private mode) are swallowed
 * so hydration never depends on cache durability.
 */
export function setCachedImageUrl(projectId: string, url: string): void {
  try {
    globalThis.localStorage?.setItem(storageKeyForProject(projectId), url);
  } catch {
    /* ignore */
  }
}
