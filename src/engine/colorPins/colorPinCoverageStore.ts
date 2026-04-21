import { create } from 'zustand';

/**
 * Indexed-pass coverage fractions keyed by pin id (parallel to the LAB palette sent to `img-index`).
 * Populated by {@link IndexedPassRunner} when the worker returns per-slot counts; cleared when indexed output idles.
 */
type ColorPinCoverageState = {
  coverage: Record<string, number>;
  setCoverage: (next: Record<string, number>) => void;
  clearCoverage: () => void;
};

export const useColorPinCoverageStore = create<ColorPinCoverageState>((set) => ({
  coverage: {},
  setCoverage: (coverage) => set({ coverage }),
  clearCoverage: () => set({ coverage: {} }),
}));
