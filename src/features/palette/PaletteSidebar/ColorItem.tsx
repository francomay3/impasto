import { useState, useCallback } from 'react';
import { Stack, Box, Text } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Color } from '../../../types';
import { usePaletteContext } from '../PaletteContext';
import { useEditorStore } from '../../editor/editorStore';
import { useContextTrigger } from '../../../hooks/useContextTrigger';
import { useColorContextMenu } from '../useColorContextMenu';
import { useSelectionContextMenu } from '../useSelectionContextMenu';
import { PinEditPopover } from '../PinEditPopover';
import { ColorNameRow } from './ColorNameRow';
import { ColorItemFooter } from './ColorItemFooter';

interface ColorItemProps {
  color: Color;
  dragHandleRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, (...args: unknown[]) => void>;
}

function ColorItem({ color, dragHandleRef, dragListeners }: ColorItemProps) {
  const { onRenameColor, onDeleteColor } = usePaletteContext();
  const selectedColorIds = useEditorStore(s => s.selectedColorIds);
  const hoveredColorId = useEditorStore(s => s.hoveredColorId);
  const selectColor = useEditorStore(s => s.selectColor);
  const toggleColorSelection = useEditorStore(s => s.toggleColorSelection);
  const setHoveredColorId = useEditorStore(s => s.setHoveredColorId);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editPopoverPos, setEditPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const openColorMenu = useColorContextMenu();
  const openSelectionMenu = useSelectionContextMenu();

  const handleNameEditStart = useCallback(() => {
    setEditNameValue(color.name || color.hex.toLowerCase());
    setEditingName(true);
  }, [color.name, color.hex]);

  const handleNameSubmit = () => {
    const trimmed = editNameValue.trim();
    const newName = trimmed === color.hex.toLowerCase() ? '' : trimmed;
    if (newName !== (color.name ?? '')) onRenameColor(color.id, newName);
    setEditingName(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.metaKey || e.shiftKey) toggleColorSelection(color.id);
    else selectColor(color.id);
  };

  const openContextMenu = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      if (selectedColorIds.size > 1 && selectedColorIds.has(color.id)) {
        openSelectionMenu({ x, y });
      } else {
        openColorMenu(color.id, { x, y }, { onEditStart: () => setEditPopoverPos({ x, y }) });
      }
    },
    [color.id, selectedColorIds, openColorMenu, openSelectionMenu]
  );

  const contextTrigger = useContextTrigger(openContextMenu);

  const isSelected = selectedColorIds.has(color.id);
  const outline = isSelected
    ? '2px solid var(--mantine-color-primary-4)'
    : hoveredColorId === color.id
      ? '2px solid var(--mantine-color-secondary-4)'
      : undefined;

  return (
    <>
      <Box
        onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); onDeleteColor(color.id); } }}
        onClick={handleClick}
        onMouseEnter={() => setHoveredColorId(color.id)}
        onMouseLeave={() => setHoveredColorId(null)}
        {...contextTrigger}
        data-testid="color-card"
        style={{
          border: '1px solid var(--mantine-color-dark-4)',
          outline,
          outlineOffset: -2,
          borderRadius: 6,
          padding: 8,
          background: 'var(--mantine-color-dark-7)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Stack gap={4}>
          <ColorNameRow
            color={color}
            editingName={editingName}
            editNameValue={editNameValue}
            dragHandleRef={dragHandleRef}
            dragListeners={dragListeners}
            onEditNameChange={setEditNameValue}
            onEditNameSubmit={handleNameSubmit}
            onEditNameCancel={() => setEditingName(false)}
            onStartEditing={handleNameEditStart}
          />
          <ColorItemFooter color={color} />
          {color.mixRecipe && (
            <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>
              {color.mixRecipe}
            </Text>
          )}
        </Stack>
      </Box>
      {editPopoverPos && (
        <PinEditPopover
          colorId={color.id}
          position={editPopoverPos}
          onClose={() => setEditPopoverPos(null)}
        />
      )}
    </>
  );
}

export function SortableColorItem({ color, index }: { color: Color; index: number }) {
  const selectedColorIds = useEditorStore(s => s.selectedColorIds);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: color.id, data: { type: 'color' } });
  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      data-testid={`color-item-${index}`}
      data-selected={selectedColorIds.has(color.id) ? 'true' : undefined}
    >
      <ColorItem
        color={color}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners as Record<string, (...args: unknown[]) => void>}
      />
    </Box>
  );
}
