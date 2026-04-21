/**
 * Whether startup timing records and mirrors to the console.
 * Future: gate the dynamic import of the full timing chunk the same way.
 */
export function isStartupTimingEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage?.getItem('impasto_debug_startup') === '1';
  } catch {
    return false;
  }
}
