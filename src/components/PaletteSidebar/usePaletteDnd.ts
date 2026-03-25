import { useState, useCallback } from 'react';
import {
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { SmartMouseSensor } from '../../utils/dndSensor';
import { arrayMove } from '@dnd-kit/sortable';
import type { Color, ColorGroup } from '../../types';

interface Options {
  palette: Color[];
  groups: ColorGroup[];
  onReorderGroups: (groups: ColorGroup[]) => void;
  onReorderPalette: (palette: Color[]) => void;
}

interface Return {
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: CollisionDetection;
  displayPalette: Color[];
  draggingType: 'group' | 'color' | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
}

export function usePaletteDnd({ palette, groups, onReorderGroups, onReorderPalette }: Options): Return {
  const [draggingType, setDraggingType] = useState<'group' | 'color' | null>(null);
  const [dragPalette, setDragPalette] = useState<Color[] | null>(null);
  const sensors = useSensors(useSensor(SmartMouseSensor));

  const displayPalette = dragPalette ?? palette;

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const type = args.active.data.current?.type;
    if (type === 'group') {
      return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => c.data.current?.type === 'group') });
    }
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(c => c.data.current?.type !== 'group') });
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setDraggingType(event.active.data.current?.type ?? null);
    if (event.active.data.current?.type === 'color') {
      setDragPalette([...palette]);
    }
  }

  // Live cross-group repositioning: fires on every hover while dragging
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== 'color') return;
    if (over.data.current?.type !== 'color') return;

    setDragPalette(current => {
      const p = current!;
      const activeColor = p.find(c => c.id === active.id);
      const overColor = p.find(c => c.id === over.id);
      if (!activeColor || !overColor) return p;
      if (activeColor.groupId === overColor.groupId) return p;

      const withoutActive = p.filter(c => c.id !== active.id);
      const overIdx = withoutActive.findIndex(c => c.id === over.id);
      const result = [...withoutActive];
      result.splice(overIdx, 0, { ...activeColor, groupId: overColor.groupId });
      return result;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingType(null);
    const { active, over } = event;
    const p = dragPalette ?? palette;

    if (!over || active.id === over.id) {
      if (dragPalette) onReorderPalette(dragPalette);
      setDragPalette(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'group' && overData?.type === 'group') {
      const oldIdx = groups.findIndex(g => g.id === active.id);
      const newIdx = groups.findIndex(g => g.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) onReorderGroups(arrayMove(groups, oldIdx, newIdx));
      return;
    }

    if (activeData?.type === 'color') {
      // Dropped on empty group drop zone — append to that group
      if (overData?.type === 'groupDrop') {
        const targetGroupId = overData.groupId as string | undefined;
        const activeColor = p.find(c => c.id === active.id);
        if (activeColor && activeColor.groupId !== targetGroupId) {
          const withoutActive = p.filter(c => c.id !== active.id);
          const lastIdx = withoutActive.reduce((last, c, i) => c.groupId === targetGroupId ? i : last, -1);
          const result = [...withoutActive];
          result.splice(lastIdx + 1, 0, { ...activeColor, groupId: targetGroupId });
          onReorderPalette(result);
        } else if (dragPalette) {
          onReorderPalette(dragPalette);
        }
        setDragPalette(null);
        return;
      }

      // Dropped on a color in the same group — finalize sort position
      const activeColor = p.find(c => c.id === active.id);
      const overColor = p.find(c => c.id === over.id);
      if (activeColor && overColor && activeColor.groupId === overColor.groupId) {
        const gid = activeColor.groupId;
        const groupColors = p.filter(c => c.groupId === gid);
        const oldIdx = groupColors.findIndex(c => c.id === active.id);
        const newIdx = groupColors.findIndex(c => c.id === over.id);
        if (oldIdx !== newIdx) {
          const reordered = arrayMove(groupColors, oldIdx, newIdx);
          let gi = 0;
          const newPalette = p.map(c => c.groupId === gid ? reordered[gi++] : c);
          onReorderPalette(newPalette);
          setDragPalette(null);
          return;
        }
      }

      if (dragPalette) onReorderPalette(dragPalette);
      setDragPalette(null);
    }
  }

  function handleDragCancel() {
    setDraggingType(null);
    setDragPalette(null);
  }

  return { sensors, collisionDetection, displayPalette, draggingType, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel };
}
