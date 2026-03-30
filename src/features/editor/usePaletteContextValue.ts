import type { useProjectState } from './useProjectState';
import type { useImageHandlers } from './useImageHandlers';
import type { useEditorHandlers } from './useEditorHandlers';
import type { ToolId } from '../../tools';
import type { SamplingLevels } from '../filters/FilterContext';

type Project = ReturnType<typeof useProjectState>;
type ImageHandlers = ReturnType<typeof useImageHandlers>;
type EditorHandlers = ReturnType<typeof useEditorHandlers>;

interface Options {
  project: Project;
  imageHandlers: ImageHandlers;
  editorHandlers: EditorHandlers;
  samplingColorId: string | null;
  activeTool: ToolId;
  setActiveTool: (t: ToolId) => void;
  setSamplingColorId: (id: string | null) => void;
  setSamplingLevels: (v: SamplingLevels | null) => void;
}

export function usePaletteContextValue({
  project,
  imageHandlers,
  editorHandlers,
  samplingColorId,
  activeTool,
  setActiveTool,
  setSamplingColorId,
  setSamplingLevels,
}: Options) {
  return {
    palette: project.state.palette,
    groups: project.state.groups ?? [],
    samplingColorId,
    isAddingColor: activeTool === 'eyedropper',
    onStartSampling: (id: string) => {
      setSamplingLevels(null);
      setActiveTool('select');
      setSamplingColorId(id);
    },
    onSampleColor: editorHandlers.handleSampleWithSelect,
    onCancelSampleColor: imageHandlers.handleCancelSample,
    onAddNewColor: editorHandlers.handleAddNewColor,
    onCancelAddingColor: () => setActiveTool('select'),
    onRenameColor: (id: string, name: string) => project.updateColor(id, { name }),
    onAddColor: imageHandlers.handleAddColor,
    onAddColorAtPosition: imageHandlers.handleAddColorAtPosition,
    onDeleteColor: imageHandlers.handleDeleteColor,
    onPinMoveEnd: imageHandlers.handlePinMoveEnd,
    onRemoveSamplePin: (id: string) => project.updateColor(id, { sample: undefined }),
    onAddGroup: project.addGroup,
    onRemoveGroup: project.removeGroup,
    onRenameGroup: project.renameGroup,
    onSetColorGroup: project.setColorGroup,
    onReorderPalette: project.setPalette,
    onReorderGroups: project.reorderGroups,
  };
}
