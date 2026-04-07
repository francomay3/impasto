import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { ColorSample, ProjectState } from '../../types';
import { prepareImage } from '../../utils/imageResize';
import type { ReplaceImageModalRef } from './ReplaceImageModal';
import type { InteractionAPI } from '../canvas/engine/toolStateManager';
import { useEditorStore } from './editorStore';

interface Params {
  state: ProjectState;
  samplingColorId: string | null;
  interaction: Pick<InteractionAPI, 'activateEyedropper' | 'selectTool' | 'completeSample' | 'toggleMarquee'>;
  handleAddColorAtPosition: (sample: ColorSample, hex: string) => string;
  handleSample: (sample: ColorSample, hex: string) => void;
  handleDeleteColor: (id: string) => void;
  handleImageLoadBitmap: (bitmap: ImageBitmap) => void;
  setActiveTab: (tab: string) => void;
  replaceRef: RefObject<ReplaceImageModalRef | null>;
  onNewImageFile?: (file: File) => void;
}

export function useEditorHandlers({
  state,
  samplingColorId,
  interaction,
  handleAddColorAtPosition,
  handleSample,
  handleDeleteColor,
  handleImageLoadBitmap,
  setActiveTab,
  replaceRef,
  onNewImageFile,
}: Params) {
  const handleFileSelected = useCallback(
    (file: File) => {
      prepareImage(file).then(({ bitmap, webpFile }) => {
        handleImageLoadBitmap(bitmap);
        if (onNewImageFile) onNewImageFile(webpFile);
      });
    },
    [handleImageLoadBitmap, onNewImageFile]
  );

  const handleEnterAddColorMode = useCallback(() => {
    useEditorStore.getState().setSelectedColorIds(new Set());
    interaction.activateEyedropper();
    setActiveTab('palette');
  }, [interaction, setActiveTab]);

  const handleAddNewColor = useCallback(
    (sample: ColorSample, hex: string) => {
      const id = handleAddColorAtPosition(sample, hex);
      useEditorStore.getState().setSelectedColorIds(new Set([id]));
      interaction.completeSample();
    },
    [handleAddColorAtPosition, interaction]
  );

  const handleSampleWithSelect = useCallback(
    (sample: ColorSample, hex: string) => {
      const id = samplingColorId;
      handleSample(sample, hex);
      if (id) useEditorStore.getState().setSelectedColorIds(new Set([id]));
    },
    [samplingColorId, handleSample]
  );

  const handleDeleteSelectedColors = useCallback(() => {
    const ids = useEditorStore.getState().selectedColorIds;
    ids.forEach((id) => handleDeleteColor(id));
    useEditorStore.getState().setSelectedColorIds(new Set());
  }, [handleDeleteColor]);

  const handleToggleSelectTool = useCallback(() => {
    interaction.selectTool('select');
  }, [interaction]);

  const handleToggleMarqueeTool = useCallback(() => {
    interaction.toggleMarquee();
  }, [interaction]);

  const handlePasteFile = useCallback(
    (file: File) => {
      if (state.palette.some((c) => c.sample)) replaceRef.current?.openWithFile(file);
      else handleFileSelected(file);
    },
    [state.palette, replaceRef, handleFileSelected]
  );

  return {
    handleFileSelected,
    handleEnterAddColorMode,
    handleAddNewColor,
    handleSampleWithSelect,
    handleDeleteSelectedColors,
    handleToggleSelectTool,
    handleToggleMarqueeTool,
    handlePasteFile,
  };
}
