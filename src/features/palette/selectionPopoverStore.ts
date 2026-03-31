import { create } from 'zustand';

interface PopoverPos {
  x: number;
  y: number;
}

interface SelectionPopoverStore {
  pos: PopoverPos | null;
  open: (pos: PopoverPos) => void;
  close: () => void;
}

export const useSelectionPopoverStore = create<SelectionPopoverStore>((set) => ({
  pos: null,
  open: (pos) => set({ pos }),
  close: () => set({ pos: null }),
}));
