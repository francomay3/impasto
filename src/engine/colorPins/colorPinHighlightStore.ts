import { create } from 'zustand';

type ColorPinHighlightStore = {
  highlightedPinId: string | null;
  setHighlightedPinId: (id: string | null) => void;
};

export const useColorPinHighlightStore = create<ColorPinHighlightStore>((set) => ({
  highlightedPinId: null,
  setHighlightedPinId: (id) => set({ highlightedPinId: id }),
}));
