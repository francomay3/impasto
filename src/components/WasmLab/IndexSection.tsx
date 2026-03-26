import { useState, useMemo } from 'react';
import chroma from 'chroma-js';
import { Stack, Title, Text, Slider, Group, ColorInput, Button, SimpleGrid, Divider, ColorSwatch, ActionIcon } from '@mantine/core';
import { X } from 'lucide-react';
import type { FilterInstance, RawImage } from '../../types';
import { useIndexedImage, type LabColor } from '../../hooks/useIndexedImage';
import { useFilteredImage } from '../../hooks/useFilteredImage';
import { useCanvas } from '../../hooks/useCanvas';

const NO_FILTERS: FilterInstance[] = [];
const PRESET_PALETTE = ['#2c1a0e', '#8b4513', '#d4a96a', '#f5f0e8', '#1a3a2a', '#4a7c59'];

function hexToLab(hex: string): LabColor {
  const [l, a, b] = chroma(hex).lab();
  return { l, a, b };
}

type Props = { sourceImage: RawImage | null };

export function IndexSection({ sourceImage }: Props) {
  const [sigma, setSigma] = useState(3);
  const [hexColors, setHexColors] = useState<string[]>(PRESET_PALETTE);
  const [inputHex, setInputHex] = useState('#ffffff');

  const palette = useMemo(() => hexColors.map(hexToLab), [hexColors]);

  const originalData = useFilteredImage(sourceImage, NO_FILTERS);
  const originalRef = useCanvas(originalData);
  const indexedData = useIndexedImage(sourceImage, sigma, palette);
  const indexedRef = useCanvas(indexedData);

  function addColor() {
    if (!hexColors.includes(inputHex)) setHexColors(c => [...c, inputHex]);
  }

  function removeColor(hex: string) {
    setHexColors(c => c.filter(x => x !== hex));
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>useIndexedImage</Title>
        <Text c="dimmed" size="sm">
          Blurs then maps every pixel to the nearest palette color using delta E 2000 in CIE Lab space. Runs in a Web Worker via Rust/WASM.
        </Text>
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>Blur sigma: {sigma}</Text>
        <Slider min={0} max={20} step={0.5} value={sigma} onChange={setSigma} size="xs" />
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>Palette ({hexColors.length} colors)</Text>
        <Group gap="xs">
          {hexColors.map(hex => (
            <Group key={hex} gap={2} align="center">
              <ColorSwatch color={hex} size={24} radius="sm" />
              <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => removeColor(hex)}>
                <X size={10} />
              </ActionIcon>
            </Group>
          ))}
        </Group>
        <Group>
          <ColorInput value={inputHex} onChange={setInputHex} style={{ flex: 1 }} />
          <Button variant="light" onClick={addColor}>Add</Button>
        </Group>
      </Stack>

      {sourceImage && (
        <>
          <Divider label="Before / After" />
          <SimpleGrid cols={2} spacing="md">
            <Stack gap={4}>
              <Text size="xs" c="dimmed">Original</Text>
              <canvas ref={originalRef} style={{ display: 'block', maxWidth: '100%' }} />
            </Stack>
            <Stack gap={4}>
              <Text size="xs" c="dimmed">Indexed</Text>
              <canvas ref={indexedRef} style={{ display: 'block', maxWidth: '100%' }} />
            </Stack>
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
