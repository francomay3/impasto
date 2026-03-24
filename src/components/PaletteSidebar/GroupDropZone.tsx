import { Box, Text } from '@mantine/core';
import { useDroppable } from '@dnd-kit/core';

interface Props {
  groupId: string | undefined;
  isDraggingColor: boolean;
}

export function GroupDropZone({ groupId, isDraggingColor }: Props) {
  const id = groupId !== undefined ? `zone-${groupId}` : 'zone-ungrouped';
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'groupDrop', groupId } });

  if (!isDraggingColor) return null;

  return (
    <Box
      ref={setNodeRef}
      style={{
        height: 28,
        borderRadius: 4,
        border: `1px dashed ${isOver ? 'var(--mantine-color-blue-4)' : 'var(--mantine-color-dark-3)'}`,
        background: isOver ? 'color-mix(in srgb, var(--mantine-color-blue-4) 8%, transparent)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        transition: 'all 0.15s',
      }}
    >
      <Text size="xs" c={isOver ? 'blue' : 'dimmed'} style={{ fontStyle: 'italic', fontSize: 11 }}>
        {isOver ? 'Release to add here' : 'Drop color here'}
      </Text>
    </Box>
  );
}
