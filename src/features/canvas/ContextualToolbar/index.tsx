import { Group, Switch, Text } from '@mantine/core';
import { RotateCcw, SplitSquareHorizontal } from 'lucide-react';
import { useEngine } from '../engine/EngineContext';
import { useToolState } from '../engine/useToolState';
import { useFilterContext } from '../../filters/FilterContext';
import { useEditorStore } from '../../editor/editorStore';
import { usePaletteContext } from '../../palette/PaletteContext';
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
  const engine = useEngine();
  const { activeTool, samplingRadius, setSamplingRadius, selectionMode, setSelectionMode } = useToolState(engine);
  const { palette } = usePaletteContext();
  const setSelectedColorIds = useEditorStore(s => s.setSelectedColorIds);

  if (activeTool === 'select') {
    const sampledIds = palette.filter((c) => c.sample).map((c) => c.id);
    return (
      <Group gap={2}>
        <SlimButton onClick={() => setSelectedColorIds(new Set(sampledIds))}>Select All</SlimButton>
        <SlimButton onClick={() => setSelectedColorIds(new Set())}>Deselect</SlimButton>
      </Group>
    );
  }

  if (activeTool === 'marquee') {
    return (
      <Group gap={2}>
        <SlimButton
          variant={selectionMode === 'add' ? 'light' : 'subtle'}
          color={selectionMode === 'add' ? 'primary' : 'gray'}
          onClick={() => setSelectionMode('add')}
        >
          Add to Selection
        </SlimButton>
        <SlimButton
          variant={selectionMode === 'subtract' ? 'light' : 'subtle'}
          color={selectionMode === 'subtract' ? 'primary' : 'gray'}
          onClick={() => setSelectionMode('subtract')}
        >
          Subtract
        </SlimButton>
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

function PaletteMixToggle() {
  const showMixedColors = useEditorStore((s) => s.showMixedColors);
  const setShowMixedColors = useEditorStore((s) => s.setShowMixedColors);
  return (
    <Switch
      size="xs"
      label={
        <Text size="xs" c="dimmed">
          Show mixes
        </Text>
      }
      checked={showMixedColors}
      onChange={(e) => setShowMixedColors(e.currentTarget.checked)}
    />
  );
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
          <Group gap={12}>
            <PaletteMixToggle />
            <PaletteBlurInput />
          </Group>
        )}
      </Group>
    </div>
  );
}
