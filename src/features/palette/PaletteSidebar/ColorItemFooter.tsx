import { Box, Text, Badge, Menu, ActionIcon, Tooltip } from '@mantine/core';
import { Crosshair, X, Folder, Plus, Eye, EyeOff } from 'lucide-react';
import type { Color } from '../../../types';
import { usePaletteContext } from '../PaletteContext';
import { useEditorContext } from '../../editor/EditorContext';

export function ColorItemFooter({ color }: { color: Color }) {
  const { groups, onSetColorGroup, onAddGroup, onStartSampling, onDeleteColor } =
    usePaletteContext();
  const { hiddenPinIds, onTogglePinVisibility } = useEditorContext();

  return (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 46 }}>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        {color.name && (
          <Text
            data-testid="color-hex"
            ff="monospace"
            c="dimmed"
            style={{ fontSize: 10, userSelect: 'text' }}
          >
            {color.hex.toLowerCase()}
          </Text>
        )}
        {color.ratio > 0 && (
          <Badge data-testid="color-ratio" size="xs" variant="outline" color="gray">
            {color.ratio}%
          </Badge>
        )}
      </Box>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Menu shadow="md" width={160} position="bottom-end">
          <Menu.Target>
            <Tooltip label="Move to group">
              <ActionIcon
                size="sm"
                variant="subtle"
                color={color.groupId ? 'blue' : 'gray'}
                data-testid="color-group-button"
              >
                <Folder size={13} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Assign group</Menu.Label>
            <Menu.Item
              leftSection={<X size={12} />}
              onClick={() => onSetColorGroup(color.id, undefined)}
              style={{ fontWeight: !color.groupId ? 600 : 400 }}
            >
              No group
            </Menu.Item>
            {groups.map((g) => (
              <Menu.Item
                key={g.id}
                leftSection={<Folder size={12} />}
                onClick={() => onSetColorGroup(color.id, g.id)}
                style={{ fontWeight: color.groupId === g.id ? 600 : 400 }}
              >
                {g.name}
              </Menu.Item>
            ))}
            <Menu.Divider />
            <Menu.Item
              leftSection={<Plus size={12} />}
              onClick={() => {
                const id = crypto.randomUUID();
                onAddGroup(id, `Group ${groups.length + 1}`);
                onSetColorGroup(color.id, id);
              }}
            >
              New group
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
        {color.sample && (
          <Tooltip label={hiddenPinIds.has(color.id) ? 'Show pin' : 'Hide pin'}>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              data-testid="pin-visibility-toggle"
              data-hidden={hiddenPinIds.has(color.id) ? 'true' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinVisibility(color.id);
              }}
            >
              {hiddenPinIds.has(color.id) ? <EyeOff size={13} /> : <Eye size={13} />}
            </ActionIcon>
          </Tooltip>
        )}
        <Tooltip label="Sample from image">
          <ActionIcon
            size="sm"
            variant="subtle"
            color="blue"
            onClick={() => onStartSampling(color.id)}
          >
            <Crosshair size={13} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete color">
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            data-testid="color-delete"
            onClick={() => onDeleteColor(color.id)}
          >
            <X size={13} />
          </ActionIcon>
        </Tooltip>
      </Box>
    </Box>
  );
}
