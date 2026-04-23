import { Box, Menu, Text } from '@mantine/core';
import { HOTKEYS, hotkeyLabel } from '../../hotkeys';

interface HelpMenuV2Props {
  onOpenShortcuts: () => void;
}

export function HelpMenuV2({ onOpenShortcuts }: HelpMenuV2Props) {
  return (
    <>
      <Menu.Item
        onClick={onOpenShortcuts}
        rightSection={<Text size="xs" c="dimmed">{hotkeyLabel(HOTKEYS.SHOW_SHORTCUTS)}</Text>}
      >
        Keyboard Shortcuts
      </Menu.Item>
      <Menu.Divider />
      <Box px="sm" py={4}>
        <Text size="xs" c="dimmed">
          Impasto v{__APP_VERSION__}
        </Text>
      </Box>
    </>
  );
}
