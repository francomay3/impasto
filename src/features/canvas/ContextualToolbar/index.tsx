import { Group, Text } from '@mantine/core';
import { ArrowUpDown, Download, RotateCcw, SplitSquareHorizontal } from 'lucide-react';
import { useToolContext } from '../ToolContext';
import { useFilterContext } from '../../filters/FilterContext';
import { SlimNumberInput } from '../../../shared/SlimNumberInput';
import { SlimButton } from '../../../shared/SlimButton';

const barStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px',
  borderBottom: '1px solid var(--mantine-color-dark-6)',
  background: 'var(--mantine-color-dark-7)',
};

function PaletteToolOptions() {
  const { activeTool, samplingRadius, setSamplingRadius } = useToolContext();

  if (activeTool === 'select') {
    return (
      <Group gap={2}>
        <SlimButton>Select All</SlimButton>
        <SlimButton>Deselect</SlimButton>
      </Group>
    );
  }

  if (activeTool === 'marquee') {
    return (
      <Group gap={2}>
        <SlimButton>Add to Selection</SlimButton>
        <SlimButton>Subtract</SlimButton>
      </Group>
    );
  }

  if (activeTool === 'eyedropper') {
    return (
      <Group gap={6} align="center">
        <Text size="xs" c="dimmed">
          Sampling radius
        </Text>
        <SlimNumberInput
          data-testid="sampling-radius-input"
          value={samplingRadius}
          onChange={(v) => typeof v === 'number' && setSamplingRadius(v)}
          min={1}
          max={200}
          suffix="px"
          w={72}
        />
      </Group>
    );
  }

  return null;
}

function PaletteBlurInput() {
  const { preIndexingBlur, setPreIndexingBlur } = useFilterContext();
  return (
    <Group gap={6} align="center">
      <Text size="xs" c="dimmed">
        Pre-index blur
      </Text>
      <SlimNumberInput
        data-testid="pre-index-blur-input"
        value={preIndexingBlur}
        onChange={(v) => typeof v === 'number' && setPreIndexingBlur(v)}
        min={0}
        max={50}
        suffix="px"
        w={72}
      />
    </Group>
  );
}

interface Props {
  tab: 'filters' | 'palette';
}

export function ContextualToolbar({ tab }: Props) {
  return (
    <div style={barStyle} data-testid="contextual-toolbar">
      <Group gap={4}>{tab === 'palette' && <PaletteToolOptions />}</Group>

      <Group gap={2}>
        {tab === 'filters' && (
          <>
            <SlimButton leftSection={<SplitSquareHorizontal size={12} />}>Compare</SlimButton>
            <SlimButton leftSection={<RotateCcw size={12} />}>Reset</SlimButton>
          </>
        )}
        {tab === 'palette' && (
          <>
            <PaletteBlurInput />
            <SlimButton leftSection={<ArrowUpDown size={12} />}>Sort</SlimButton>
            <SlimButton leftSection={<Download size={12} />}>Export</SlimButton>
          </>
        )}
      </Group>
    </div>
  );
}
