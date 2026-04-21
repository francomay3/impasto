import { Box, Stack, Text } from '@mantine/core';

interface Props {
  hex: string;
  name: string;
}

export function MobileColorCardV2({ hex, name }: Props) {
  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 8,
        background: 'var(--mantine-color-dark-7)',
        border: '1px solid var(--mantine-color-dark-5)',
      }}
    >
      <Box
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          background: hex,
          border: '1px solid var(--mantine-color-dark-3)',
          flexShrink: 0,
        }}
      />
      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" ff={name ? undefined : 'monospace'} truncate>
          {name ? name : hex}
        </Text>
        {name ? (
          <Text size="xs" c="dimmed" ff="monospace">
            {hex}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}
