import { Code, Slider, Stack } from '@mantine/core';
import {
  useImpastoEngine,
  type ColorPin,
  type Tool,
  type ViewportPipelineState,
  type ViewportTransform,
} from '../../REFACTOR/ImpastoEngine';
import { useImpastoSelection } from '../../REFACTOR/ImpastoEngine/hooks/useImpastoSelection';

type DevDebugDataProps = {
  viewportTransform: ViewportTransform;
  pipelineState: ViewportPipelineState;
  activeTool: Tool;
  colorPins: readonly ColorPin[];
};

function activeToolDebugSuffix(active: Tool): string {
  if (!active.config.params.length) {
    return '';
  }
  return ` (${active.config.params
    .map((p) => (p.kind === 'number' ? `${p.label} ${p.value} ${p.unit}` : ''))
    .filter(Boolean)
    .join(', ')})`;
}

/** Dev-only readout: viewport transform, pipeline status, active tool. */
export function DevDebugData({ viewportTransform, pipelineState, activeTool }: DevDebugDataProps) {
  const engine = useImpastoEngine();
  const selection = useImpastoSelection();

  return (
    <Stack gap="xs">
      <Code>
        transform: {viewportTransform.x.toFixed(2)} {viewportTransform.y.toFixed(2)}{' '}
        {viewportTransform.z.toFixed(2)}
        <br />
        pipeline: {pipelineState.status}
        {pipelineState.error ? (
          <>
            <br />
            {pipelineState.error}
          </>
        ) : null}
        <br />
        indexed: {pipelineState.indexedStatus}
        {pipelineState.indexedError ? (
          <>
            <br />
            {pipelineState.indexedError}
          </>
        ) : null}
        <br />
        tool: {activeTool.id}
        {activeToolDebugSuffix(activeTool)}
        <br />
        selection: {selection.length === 0 ? '[]' : JSON.stringify(selection)}
      </Code>
      <Slider
        size="xs"
        label={`Index blur σ (${pipelineState.indexBlurSigma.toFixed(2)})`}
        min={0}
        max={50}
        step={0.25}
        value={pipelineState.indexBlurSigma}
        onChange={(v) => engine.pipeline.setIndexConfig({ blurSigma: v })}
        maw={360}
      />
    </Stack>
  );
}
