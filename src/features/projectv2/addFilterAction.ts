import type { FilterInstance, FilterType } from '../../types';
import { DEFAULT_FILTER_PARAMS } from '../../types';

/** Returns a new filter list with one enabled instance appended (caller supplies stable `id`, e.g. `crypto.randomUUID()`). */
export function appendFilterWithType(
  current: readonly FilterInstance[],
  type: FilterType,
  id: string,
): FilterInstance[] {
  return [...current, { id, type, params: DEFAULT_FILTER_PARAMS[type], enabled: true }];
}
