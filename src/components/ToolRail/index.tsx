import { Stack, ActionIcon, Tooltip, Divider } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';

export type ToolRailItem =
  | {
      type?: 'action';
      icon: LucideIcon;
      label: string;
      onClick?: () => void;
      active?: boolean;
      disabled?: boolean;
    }
  | { type: 'separator' };

interface Props {
  items: ToolRailItem[];
}

export function ToolRail({ items }: Props) {
  return (
    <Stack
      gap={4}
      p={6}
      align="center"
      style={{
        width: 48,
        flexShrink: 0,
        height: '100%',
        borderRight: '1px solid var(--mantine-color-dark-6)',
        background: 'var(--mantine-color-dark-8)',
      }}
    >
      {items.map((item, i) => {
        if (item.type === 'separator') {
          return <Divider key={i} w="70%" my={2} />;
        }
        const Icon = item.icon;
        return (
          <Tooltip key={i} label={item.label} position="right" withArrow>
            <ActionIcon
              variant={item.active ? 'filled' : 'subtle'}
              color={item.active ? 'blue' : 'gray'}
              size="md"
              disabled={item.disabled}
              onClick={item.onClick}
              aria-label={item.label}
            >
              <Icon size={16} />
            </ActionIcon>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
