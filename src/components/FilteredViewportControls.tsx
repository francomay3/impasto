import { ActionIcon, Group, Text, Tooltip } from '@mantine/core';
import { Tag, Maximize2, Layers, Contrast, Grid3x3 } from 'lucide-react';
import { useCanvasContext } from '../context/CanvasContext';

const btnStyle = { width: 26, height: 26, borderRadius: 4, border: 'none' } as const;

export function FilteredViewportControls() {
  const { showLabels, onToggleLabels, onResetTransform } = useCanvasContext();

  return (
    <Group gap={1}>
      <Text size="xs" c="dark.2" fw={500} mr={4} style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>
        Filtered
      </Text>
      <Tooltip label="Toggle color labels" openDelay={400} position="bottom">
        <ActionIcon size={26} variant={showLabels ? 'filled' : 'subtle'} color={showLabels ? 'blue' : 'gray'} style={btnStyle} onClick={onToggleLabels}>
          <Tag size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Fit to view" openDelay={400} position="bottom">
        <ActionIcon size={26} variant="subtle" color="gray" style={btnStyle} onClick={onResetTransform}>
          <Maximize2 size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Grid overlay" openDelay={400} position="bottom">
        <ActionIcon size={26} variant="subtle" color="gray" style={btnStyle} disabled>
          <Grid3x3 size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Channels" openDelay={400} position="bottom">
        <ActionIcon size={26} variant="subtle" color="gray" style={btnStyle} disabled>
          <Layers size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Display mode" openDelay={400} position="bottom">
        <ActionIcon size={26} variant="subtle" color="gray" style={btnStyle} disabled>
          <Contrast size={13} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
