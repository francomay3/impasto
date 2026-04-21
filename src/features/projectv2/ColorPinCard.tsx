import { useCallback } from 'react';
import { Box, Text, ActionIcon, Tooltip, Menu } from '@mantine/core';
import { GripVertical, X, Folder } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ColorPin } from '../../engine/colorPins/ColorPinState';
import { useColorPinHighlightStore } from '../../engine/colorPins/colorPinHighlightStore';
import { useContextTrigger } from '../../hooks/useContextTrigger';
import { useEngineColorPinContextMenu } from '../../engine/colorPins/useEngineColorPinContextMenu';

export type Group = { id: string; name: string };

interface ColorPinCardProps {
  pin: ColorPin;
  isSelected: boolean;
  dragHandleRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, (...args: unknown[]) => void>;
  groups: Group[];
  groupId?: string;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onSetGroup: (groupId: string | undefined) => void;
}

function ColorPinCard({
  pin,
  isSelected,
  dragHandleRef,
  dragListeners,
  groups,
  groupId,
  onSelect,
  onDelete,
  onSetGroup,
}: ColorPinCardProps) {
  const highlightedPinId = useColorPinHighlightStore((s) => s.highlightedPinId);
  const setHighlightedPinId = useColorPinHighlightStore((s) => s.setHighlightedPinId);
  const isHighlighted = highlightedPinId === pin.id && !isSelected;
  const openEnginePinMenu = useEngineColorPinContextMenu();
  const openContextMenu = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      openEnginePinMenu(pin.id, x, y);
    },
    [openEnginePinMenu, pin.id],
  );
  const contextTrigger = useContextTrigger(openContextMenu);

  return (
    <Box
      onClick={onSelect}
      onMouseEnter={() => setHighlightedPinId(pin.id)}
      onMouseLeave={() => setHighlightedPinId(null)}
      {...contextTrigger}
      data-testid="color-pin-card"
      style={{
        border: '1px solid var(--mantine-color-dark-4)',
        outline: isSelected
          ? '2px solid var(--mantine-primary-color-5)'
          : isHighlighted
            ? '2px solid var(--mantine-color-secondary-2)'
            : undefined,
        outlineOffset: -2,
        borderRadius: 6,
        padding: 8,
        background: 'var(--mantine-color-dark-7)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Box
          ref={dragHandleRef}
          {...dragListeners}
          style={{ color: 'var(--mantine-color-dark-3)', display: 'flex', alignItems: 'center', cursor: 'grab', touchAction: 'none' }}
        >
          <GripVertical size={14} />
        </Box>
        <Box style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 4, background: pin.color, border: '1px solid var(--mantine-color-dark-3)' }} />
        <Text size="xs" ff="monospace" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pin.color.toLowerCase()}
        </Text>
      </Box>
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, paddingLeft: 46, marginTop: 4 }}>
        <Menu shadow="md" width={160} position="bottom-end">
          <Menu.Target>
            <Tooltip label="Move to group">
              <ActionIcon size="sm" variant="subtle" color={groupId ? 'blue' : 'gray'} onClick={(e) => e.stopPropagation()}>
                <Folder size={13} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Assign group</Menu.Label>
            <Menu.Item leftSection={<X size={12} />} onClick={() => onSetGroup(undefined)} style={{ fontWeight: !groupId ? 600 : 400 }}>
              No group
            </Menu.Item>
            {groups.map((g) => (
              <Menu.Item key={g.id} leftSection={<Folder size={12} />} onClick={() => onSetGroup(g.id)} style={{ fontWeight: groupId === g.id ? 600 : 400 }}>
                {g.name}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
        <Tooltip label="Delete color">
          <ActionIcon size="sm" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <X size={13} />
          </ActionIcon>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function SortableColorPinCard(props: Omit<ColorPinCardProps, 'dragHandleRef' | 'dragListeners'>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.pin.id });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <ColorPinCard
        {...props}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners as Record<string, (...args: unknown[]) => void>}
      />
    </Box>
  );
}
