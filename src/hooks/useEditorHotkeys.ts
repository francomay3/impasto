import { useRef, useState, useEffect, useCallback } from 'react';
import { useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { HOTKEYS } from '../hotkeys';
import type { FilterType } from '../types';

interface Params {
  onUndo: () => void;
  onRedo: () => void;
  onAddFilter: (type: FilterType) => void;
  onAddColor: () => void;
}

export function useEditorHotkeys({ onUndo, onRedo, onAddFilter, onAddColor }: Params) {
  const mousePos = useRef({ x: 0, y: 0 });
  const [filterMenuPos, setFilterMenuPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const track = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', track);
    return () => window.removeEventListener('mousemove', track);
  }, []);

  const openFilterMenu = useCallback((pos: { x: number; y: number }) => {
    setFilterMenuPos(pos);
  }, []);

  useHotkeys([
    [HOTKEYS.SAVE,       () => notifications.show({ message: 'Project saved', color: 'blue' })],
    [HOTKEYS.UNDO,       onUndo],
    [HOTKEYS.REDO,       onRedo],
    [HOTKEYS.REDO_ALT,   onRedo],
    [HOTKEYS.ADD_FILTER, () => openFilterMenu({ ...mousePos.current })],
    [HOTKEYS.ADD_COLOR,  onAddColor],
  ]);

  return {
    filterMenuOpen:    !!filterMenuPos,
    filterMenuPos:     filterMenuPos ?? { x: 0, y: 0 },
    onFilterMenuClose: () => setFilterMenuPos(null),
    openFilterMenu,
  };
}
