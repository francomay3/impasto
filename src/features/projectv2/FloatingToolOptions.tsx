import { Divider, Group, SegmentedControl, Slider, Text } from '@mantine/core';
import { Fragment, useState } from 'react';
import { useImpastoEngine } from '../../engine/core/ImpastoEngineContext';
import { useImpastoToolsState } from '../../engine/tools/useImpastoToolsState';
import type { ImpastoToolId } from '../../engine/tools/ToolState';
import type { ToolConfigChoiceParam, ToolConfigNumberParam, ToolConfigParam } from '../../engine/tools/toolConfigParams';

// Left offset = tool rail left(4) + rail width(~38) + gap(8) = 50px.
const OPTIONS_LEFT = 50;

function NumberParam({ toolId, param }: { toolId: ImpastoToolId; param: ToolConfigNumberParam }) {
  const engine = useImpastoEngine();
  // Local draft keeps the slider visually smooth; commits to engine only on drag end.
  const [draft, setDraft] = useState<number | null>(null);
  const displayed = draft ?? param.value;

  return (
    <Group gap={8} align="center" wrap="nowrap">
      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {param.label}
      </Text>
      <Slider
        value={displayed}
        onChange={setDraft}
        onChangeEnd={(v) => {
          setDraft(null);
          engine.tools.setToolParamValue(toolId, param.key, v);
        }}
        min={param.min}
        max={param.max}
        step={param.step}
        size="sm"
        style={{ width: 130 }}
      />
      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap', minWidth: 28, textAlign: 'right' }}>
        {displayed}
        {param.unit}
      </Text>
    </Group>
  );
}

function ChoiceParam({ toolId, param }: { toolId: ImpastoToolId; param: ToolConfigChoiceParam }) {
  const engine = useImpastoEngine();

  return (
    <SegmentedControl
      size="xs"
      value={param.value}
      onChange={(v) => engine.tools.setToolParamValue(toolId, param.key, v)}
      data={param.options.map((o) => ({ value: o.value, label: o.label }))}
    />
  );
}

function ParamControl({ toolId, param }: { toolId: ImpastoToolId; param: ToolConfigParam }) {
  if (param.kind === 'number') return <NumberParam toolId={toolId} param={param} />;
  if (param.kind === 'choice') return <ChoiceParam toolId={toolId} param={param} />;
  return null;
}

/**
 * Contextual floating strip that appears to the right of {@link FloatingToolRail}
 * when the active tool exposes configurable params. Renders nothing for param-less tools (e.g. Pan).
 */
export function FloatingToolOptions() {
  const { activeTool } = useImpastoToolsState();
  const { params } = activeTool.config;

  if (params.length === 0) return null;

  return (
    <Group
      gap={12}
      px={12}
      py={8}
      align="center"
      wrap="nowrap"
      style={{
        position: 'absolute',
        left: OPTIONS_LEFT,
        top: 4,
        zIndex: 10,
        background: 'var(--mantine-color-dark-7)',
        border: '1px solid var(--mantine-color-dark-5)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
      }}
    >
      {params.map((param, i) => (
        <Fragment key={param.key}>
          {i > 0 && <Divider orientation="vertical" h={20} />}
          <ParamControl toolId={activeTool.id} param={param} />
        </Fragment>
      ))}
    </Group>
  );
}
