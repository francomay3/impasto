import { Group, NumberInput, Text } from '@mantine/core';

interface Props {
  blur: number;
  onBlurChange: (v: number) => void;
}

export function IndexedViewportControls({ blur, onBlurChange }: Props) {
  return (
    <Group gap={6} align="center">
      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Pre-index blur</Text>
      <NumberInput
        value={blur}
        min={0} max={50} suffix="px"
        onChange={(v) => onBlurChange(Number(v))}
        size="xs" w={80}
        styles={{
          wrapper: { height: 22 },
          input: { height: 22, minHeight: 22, fontSize: 11 },
          section: { width: 16 },
          controls: { height: 22 },
          control: { height: 11, minHeight: 'unset' },
        }}
      />
      <Text size="xs" c="dark.2" fw={500} ml={4} style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>
        Indexed Result
      </Text>
    </Group>
  );
}
