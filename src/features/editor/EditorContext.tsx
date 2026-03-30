import { createContext, useContext } from 'react';
import type { SaveStatus } from './useSaveStatus';

interface EditorContextValue {
  projectName: string;
  hasImage: boolean;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  selectedColorIds: Set<string>;
  onSelectColor: (id: string | null) => void;
  onToggleColorSelection: (id: string) => void;
  onSetSelection: (ids: Set<string>) => void;
  hoveredColorId: string | null;
  onHoverColor: (id: string | null) => void;
  onExportClick: () => void;
  onReplaceImage: () => void;
  onFileSelected: (file: File) => void;
  onRename: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  activeTab: string;
  onSetActiveTab: (tab: string) => void;
  hiddenPinIds: Set<string>;
  onTogglePinVisibility: (id: string) => void;
  onSetGroupPinsVisible: (colorIds: string[], visible: boolean) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used within EditorContext.Provider');
  return ctx;
}

export { EditorContext };
