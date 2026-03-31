import { create } from 'zustand';

interface EditorStore {
  selectedColorIds: Set<string>;
  hoveredColorId: string | null;
  hiddenPinIds: Set<string>;
  showMixedColors: boolean;
  // Selection actions
  selectColor: (id: string | null) => void;
  toggleColorSelection: (id: string) => void;
  setSelectedColorIds: (ids: Set<string>) => void;
  // Hover actions
  setHoveredColorId: (id: string | null) => void;
  // Pin visibility actions
  toggleHiddenPin: (id: string) => void;
  setGroupPinsVisible: (colorIds: string[], visible: boolean) => void;
  // Display actions
  setShowMixedColors: (show: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  selectedColorIds: new Set(),
  hoveredColorId: null,
  hiddenPinIds: new Set(),
  showMixedColors: false,

  selectColor: (id) =>
    set((s) => {
      if (!id) return { selectedColorIds: new Set() };
      const prev = s.selectedColorIds;
      return { selectedColorIds: prev.size === 1 && prev.has(id) ? new Set() : new Set([id]) };
    }),

  toggleColorSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedColorIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedColorIds: next };
    }),

  setSelectedColorIds: (ids) => set({ selectedColorIds: ids }),

  setHoveredColorId: (id) => set({ hoveredColorId: id }),

  toggleHiddenPin: (id) =>
    set((s) => {
      const next = new Set(s.hiddenPinIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { hiddenPinIds: next };
    }),

  setGroupPinsVisible: (colorIds, visible) =>
    set((s) => {
      const next = new Set(s.hiddenPinIds);
      colorIds.forEach((id) => (visible ? next.delete(id) : next.add(id)));
      return { hiddenPinIds: next };
    }),

  setShowMixedColors: (show) => set({ showMixedColors: show }),
}));
