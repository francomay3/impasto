import { Group } from '@mantine/core';

interface Props {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function ViewportToolbar({ left, right }: Props) {
  return (
    <Group
      px={6}
      justify="space-between"
      style={{
        flexShrink: 0,
        height: 32,
        background: 'rgba(25,25,25,0.82)',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        userSelect: 'none',
      }}
    >
      <Group gap={4}>{left}</Group>
      <Group gap={4}>{right}</Group>
    </Group>
  );
}
