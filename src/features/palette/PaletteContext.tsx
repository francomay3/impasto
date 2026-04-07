import { createContext, useContext } from 'react';
import type { Color, ColorGroup, ColorSample } from '../../types';

interface PaletteContextValue {
  palette: Color[];
  groups: ColorGroup[];
  isAddingColor: boolean;
  onAddNewColor: (sample: ColorSample, hex: string) => void;
  onCancelAddingColor: () => void;
  onRenameColor: (id: string, name: string) => void;
  onAddColor: () => void;
  onAddColorAtPosition: (sample: ColorSample, hex: string) => void;
  onDeleteColor: (id: string) => void;
  onPinMoveEnd: (id: string, sample: ColorSample) => void;
  onRemoveSamplePin: (id: string) => void;
  onAddGroup: (id: string, name: string) => void;
  onRemoveGroup: (id: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onSetColorGroup: (colorId: string, groupId: string | undefined) => void;
  onReorderPalette: (palette: Color[]) => void;
  onReorderGroups: (groups: ColorGroup[]) => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function usePaletteContext(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error('usePaletteContext must be used within PaletteContext.Provider');
  return ctx;
}

export { PaletteContext };
