import { useState, useCallback } from 'react';
import type { RefObject } from 'react';
import type { ToolId } from '../tools';
import type { ColorSample, ProjectState } from '../types';
import { prepareImage } from '../utils/imageResize';
import type { ReplaceImageModalRef } from '../components/ReplaceImageModal';

interface Params {
  state: ProjectState;
  activeTool: ToolId;
  samplingColorId: string | null;
  handleAddColorAtPosition: (sample: ColorSample, hex: string) => string;
  handleSample: (sample: ColorSample, hex: string) => void;
  handleDeleteColor: (id: string) => void;
  handleImageLoadBitmap: (bitmap: ImageBitmap) => void;
  setActiveTool: (id: ToolId) => void;
  setActiveTab: (tab: string) => void;
  replaceRef: RefObject<ReplaceImageModalRef | null>;
  onNewImageFile?: (file: File) => void;
}

export function useEditorHandlers({
  state, activeTool, samplingColorId,
  handleAddColorAtPosition, handleSample, handleDeleteColor, handleImageLoadBitmap,
  setActiveTool, setActiveTab, replaceRef, onNewImageFile,
}: Params) {
  const [selectedColorIds, setSelectedColorIds] = useState<Set<string>>(new Set());

  const handleSelectColor = useCallback((id: string | null) => {
    if (!id) { setSelectedColorIds(new Set()); return; }
    setSelectedColorIds(prev => (prev.size === 1 && prev.has(id)) ? new Set() : new Set([id]));
  }, []);

  const handleToggleColorSelection = useCallback((id: string) => {
    setSelectedColorIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleFileSelected = useCallback((file: File) => {
    prepareImage(file).then(({ bitmap, webpFile }) => {
      handleImageLoadBitmap(bitmap);
      if (onNewImageFile) onNewImageFile(webpFile);
    });
  }, [handleImageLoadBitmap, onNewImageFile]);

  const handleEnterAddColorMode = useCallback(() => {
    setSelectedColorIds(new Set());
    setActiveTool('eyedropper');
    setActiveTab('palette');
  }, [setActiveTool, setActiveTab]);

  const handleAddNewColor = useCallback((sample: ColorSample, hex: string) => {
    const id = handleAddColorAtPosition(sample, hex);
    setSelectedColorIds(new Set([id]));
    setActiveTool('select');
  }, [handleAddColorAtPosition, setActiveTool]);

  const handleSampleWithSelect = useCallback((sample: ColorSample, hex: string) => {
    const id = samplingColorId;
    handleSample(sample, hex);
    if (id) setSelectedColorIds(new Set([id]));
  }, [samplingColorId, handleSample]);

  const handleDeleteSelectedColors = useCallback(() => {
    setSelectedColorIds(prev => { prev.forEach(id => handleDeleteColor(id)); return new Set(); });
  }, [handleDeleteColor]);

  const handleToggleSelectTool = useCallback(() => {
    setActiveTool('select');
  }, [setActiveTool]);

  const handleToggleMarqueeTool = useCallback(() => {
    setActiveTool(activeTool === 'marquee' ? 'select' : 'marquee');
  }, [activeTool, setActiveTool]);

  const handlePasteFile = useCallback((file: File) => {
    if (state.palette.some(c => c.sample)) replaceRef.current?.openWithFile(file);
    else handleFileSelected(file);
  }, [state.palette, replaceRef, handleFileSelected]);

  return {
    selectedColorIds, setSelectedColorIds,
    handleSelectColor, handleToggleColorSelection,
    handleFileSelected, handleEnterAddColorMode, handleAddNewColor,
    handleSampleWithSelect, handleDeleteSelectedColors,
    handleToggleSelectTool, handleToggleMarqueeTool, handlePasteFile,
  };
}
