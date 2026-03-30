import type { RefObject } from 'react';
import type { useProjectState } from './useProjectState';
import type { useEditorHandlers } from './useEditorHandlers';
import type { useHiddenPins } from './useHiddenPins';
import type { SaveStatus } from './useSaveStatus';
import type { ReplaceImageModalRef } from './ReplaceImageModal';

type Project = ReturnType<typeof useProjectState>;
type EditorHandlers = ReturnType<typeof useEditorHandlers>;
type HiddenPins = ReturnType<typeof useHiddenPins>;

interface Options {
  project: Project;
  editorHandlers: EditorHandlers;
  hiddenPins: HiddenPins;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  hoveredColorId: string | null;
  setHoveredColorId: (id: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setExportModalOpen: (v: boolean) => void;
  replaceRef: RefObject<ReplaceImageModalRef | null>;
  handleUndo: () => void;
  handleRedo: () => void;
}

export function useEditorContextValue({
  project,
  editorHandlers,
  hiddenPins,
  saveStatus,
  canUndo,
  canRedo,
  isLoading,
  hoveredColorId,
  setHoveredColorId,
  activeTab,
  setActiveTab,
  setExportModalOpen,
  replaceRef,
  handleUndo,
  handleRedo,
}: Options) {
  return {
    projectName: project.state.name,
    hasImage: !!project.state.sourceImage,
    saveStatus,
    canUndo,
    canRedo,
    isLoading,
    selectedColorIds: editorHandlers.selectedColorIds,
    onSelectColor: editorHandlers.handleSelectColor,
    onToggleColorSelection: editorHandlers.handleToggleColorSelection,
    onSetSelection: editorHandlers.setSelectedColorIds,
    hoveredColorId,
    onHoverColor: setHoveredColorId,
    onExportClick: () => setExportModalOpen(true),
    onReplaceImage: () => replaceRef.current?.open(),
    onFileSelected: editorHandlers.handleFileSelected,
    onRename: project.renameName,
    onUndo: handleUndo,
    onRedo: handleRedo,
    activeTab,
    onSetActiveTab: setActiveTab,
    hiddenPinIds: hiddenPins.hiddenPinIds,
    onTogglePinVisibility: hiddenPins.onTogglePinVisibility,
    onSetGroupPinsVisible: hiddenPins.onSetGroupPinsVisible,
  };
}
