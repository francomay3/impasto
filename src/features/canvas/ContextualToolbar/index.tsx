import { Group, Switch, Text, Tooltip } from '@mantine/core';
import { RotateCcw, SplitSquareHorizontal, Square, SquarePlus, SquareMinus, SquareDashed } from 'lucide-react';
import { useCanvasContext } from '../CanvasContext';
import { useFilterContext } from '../../filters/FilterContext';
import { useEditorStore } from '../../editor/editorStore';
import { SlimNumberInput } from '../../../shared/SlimNumberInput';
import { SlimButton } from '../../../shared/SlimButton';
import { SlimIconButton } from '../../../shared/SlimIconButton';
import type { SelectionMode } from '../../../tools';

const SELECTION_MODES: { mode: SelectionMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'new',       icon: <Square size={12} />,       label: 'New selection' },
  { mode: 'add',       icon: <SquarePlus size={12} />,   label: 'Add to selection (Shift)' },
  { mode: 'subtract',  icon: <SquareMinus size={12} />,  label: 'Subtract from selection (Alt)' },
  { mode: 'intersect', icon: <SquareDashed size={12} />, label: 'Intersect with selection' },
];

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
  const { activeTool, samplingRadius, setSamplingRadius, selectionMode, setSelectionMode } = useCanvasContext();

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
      <Group gap={0}>
        {SELECTION_MODES.map(({ mode, icon, label }) => (
          <Tooltip key={mode} label={label} withArrow fz="xs">
            <SlimIconButton
              variant={selectionMode === mode ? 'light' : 'subtle'}
              color={selectionMode === mode ? 'primary' : 'gray'}
              onClick={(e) => { e.stopPropagation(); setSelectionMode(mode); }}
            >
              {icon}
            </SlimIconButton>
          </Tooltip>
        ))}
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
      label={<Text size="xs" c="dimmed">Show mixes</Text>}
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
