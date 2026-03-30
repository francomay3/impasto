import { Box } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ColorGroup } from '../../../types';
import { GroupDropZone } from './GroupDropZone';
import { GroupHeader } from './GroupHeader';

interface Props {
  group: ColorGroup;
  children: React.ReactNode;
  collapsed: boolean;
  isDraggingColor: boolean;
  autoEdit?: boolean;
  showDragHandle?: boolean;
  colorCount: number;
  sampleColorIds: string[];
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function SortableGroup({
  group,
  children,
  collapsed,
  isDraggingColor,
  autoEdit,
  showDragHandle,
  colorCount,
  sampleColorIds,
  onToggleCollapse,
  onRename,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id, data: { type: 'group' } });

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      data-testid="group-item"
    >
      <Box style={{ border: '1px solid var(--mantine-color-dark-5)', borderRadius: 6, overflow: 'hidden' }}>
        <GroupHeader
          group={group}
          collapsed={collapsed}
          colorCount={colorCount}
          sampleColorIds={sampleColorIds}
          showDragHandle={showDragHandle ?? false}
          isDragging={isDragging}
          autoEdit={autoEdit}
          dragHandleRef={setActivatorNodeRef}
          dragHandleListeners={listeners as Record<string, unknown> | undefined}
          dragContainerAttributes={attributes as unknown as Record<string, unknown>}
          onToggleCollapse={onToggleCollapse}
          onRename={onRename}
          onDelete={onDelete}
        />
        {colorCount === 0 && (
          <Box px={6} pb={6}>
            <GroupDropZone groupId={group.id} isDraggingColor={isDraggingColor} />
          </Box>
        )}
        {colorCount > 0 && !collapsed && <Box p={6}>{children}</Box>}
      </Box>
    </Box>
  );
}
