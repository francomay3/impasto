import type { FilterInstance, RawImage } from '../../types';
import { filterChainsEqual, findDirtyFilterIndex } from '../../lib/filterChainIncremental';

function cloneFilterList(filters: FilterInstance[]): FilterInstance[] {
  return structuredClone(filters);
}

/**
 * Incremental filter pipeline cache: per-step RGBA buffers, last completed chain, and
 * in-flight worker snapshot for stale-result detection.
 */
export class FilterPassCache {
  private readonly filterCache: (Uint8Array | null)[] = [];
  private prevSentFilters: FilterInstance[] = [];
  private sentFiltersSnapshot: FilterInstance[] = [];

  /** Reset all cache slots and filter-chain bookkeeping. */
  clear(): void {
    this.filterCache.length = 0;
    this.prevSentFilters = [];
    this.sentFiltersSnapshot = [];
  }

  /**
   * Re-seed from a source image: slot 0 is the source RGBA buffer view; clears prev/snapshot.
   */
  seed(img: RawImage): void {
    this.filterCache.length = 0;
    this.filterCache[0] = new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength);
    this.prevSentFilters = [];
    this.sentFiltersSnapshot = [];
  }

  get(index: number): Uint8Array | null | undefined {
    return this.filterCache[index];
  }

  computeDirtyIndex(prev: FilterInstance[], current: FilterInstance[]): number {
    return findDirtyFilterIndex(prev, current);
  }

  /**
   * Apply worker step buffers starting at `dirtyIndex + 1`; trims cache to `filterCount + 1` slots.
   */
  update(dirtyIndex: number, steps: ArrayBuffer[], filterCount: number): void {
    for (let i = 0; i < steps.length; i++) {
      this.filterCache[dirtyIndex + 1 + i] = new Uint8Array(steps[i]!);
    }
    this.filterCache.length = filterCount + 1;
  }

  getPrev(): FilterInstance[] {
    return this.prevSentFilters;
  }

  /** Clone chain into the in-flight snapshot before `postMessage` (worker correlation). */
  beginInflightChain(chain: FilterInstance[]): void {
    this.sentFiltersSnapshot = cloneFilterList(chain);
  }

  /** True when the worker result still matches the chain we sent (not stale). */
  inflightMatches(chain: FilterInstance[]): boolean {
    return filterChainsEqual(this.sentFiltersSnapshot, chain);
  }

  /**
   * After a successful worker round-trip: prev completed chain becomes the in-flight snapshot
   * (same reference semantics as the pre-refactor runner).
   */
  commitInflightToPrev(): void {
    this.prevSentFilters = this.sentFiltersSnapshot;
  }

  /** Cache hit / passthrough: prev is a fresh clone of the current chain. */
  setPrevToCloned(chain: FilterInstance[]): void {
    this.prevSentFilters = cloneFilterList(chain);
  }
}
