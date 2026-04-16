import { Button, Divider, FileButton, Group, SegmentedControl, Slider, Stack, Tooltip } from '@mantine/core';
import { useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import {
  ImpastoEngineProvider,
  useImpastoEngine,
  type ImpastoEngine,
  type ImpastoToolId,
  type ToolConfigParam,
} from '../../REFACTOR/ImpastoEngine';
import { useImpastoColorPins } from '../../REFACTOR/ImpastoEngine/colorPins/useImpastoColorPins';
import { useImpastoToolsState } from '../../REFACTOR/ImpastoEngine/tools/useImpastoToolsState';
import { useImpastoViewportPipelineState } from '../../REFACTOR/ImpastoEngine/hooks/useImpastoViewportPipelineState';
import { useImpastoViewportTransform } from '../../REFACTOR/ImpastoEngine/hooks/useImpastoViewportTransform';
import { createDevPlaceholderImage } from './createDevPlaceholderImage';
import { loadRawImageFromFile } from './loadRawImageFromFile';
import { DevDebugData } from './debugData';
import { ViewportWrapper } from '../../REFACTOR/ImpastoEngine/viewport/ViewportWrapper';
import { impastoToolTooltipText } from '../../REFACTOR/ImpastoEngine/tools/toolHotkeyLabels';
import { DevPageWithPersistence } from './DevPageWithPersistence';

export function DevPage() {
  const { id: projectId } = useParams<{ id?: string }>();
  const placeholder = useMemo(() => createDevPlaceholderImage(), []);

  return (
    <ImpastoEngineProvider initialSourceImage={projectId !== undefined ? null : placeholder}>
      {projectId !== undefined && <DevPageWithPersistence projectId={projectId} />}
      <DevPageContent />
    </ImpastoEngineProvider>
  );
}

function toolParamControl(
  engine: ImpastoEngine,
  toolId: ImpastoToolId,
  param: ToolConfigParam
): ReactNode {
  switch (param.kind) {
    case 'number':
      return (
        <Slider
          key={param.key}
          size="xs"
          miw={220}
          maw={320}
          w={280}
          label={`${param.label} (${param.unit})`}
          min={param.min}
          max={param.max}
          step={param.step}
          value={param.value}
          onChange={(v) => engine.tools.setToolParamValue(toolId, param.key, v)}
        />
      );
    case 'choice':
      return (
        <SegmentedControl
          key={param.key}
          size="xs"
          data={param.options.map((o) => ({ label: o.label, value: o.value }))}
          value={param.value}
          onChange={(v) => engine.tools.setToolParamValue(toolId, param.key, v)}
        />
      );
  }
}

function DevPageContent() {
  const engine = useImpastoEngine();
  const tools = useImpastoToolsState();
  const colorPins = useImpastoColorPins();
  const viewportTransform = useImpastoViewportTransform();
  const pipelineState = useImpastoViewportPipelineState();
  const [imageLoading, setImageLoading] = useState(false);

  async function handleImageFile(file: File | null) {
    if (!file) return;
    setImageLoading(true);
    try {
      const rawImage = await loadRawImageFromFile(file);
      engine.image.set(rawImage);
    } catch (err) {
      console.error('[dev] loadRawImageFromFile failed:', err);
    } finally {
      setImageLoading(false);
    }
  }

  return (
    <Stack style={{ minHeight: '100vh' }} p="xs">
      <DevDebugData
        viewportTransform={viewportTransform}
        pipelineState={pipelineState}
        activeTool={tools.activeTool}
        colorPins={colorPins}
      />

      <Stack>
        <Group gap="xs">
          {tools.allTools.map((t) => (
            <Tooltip
              key={t.id}
              label={
                <span style={{ whiteSpace: 'pre-line' }}>
                  {`${t.label}\n${impastoToolTooltipText(t.id)}`}
                </span>
              }
              position="top"
              openDelay={400}
              withinPortal
            >
              <Button
                size="xs"
                variant={tools.activeTool.id === t.id ? 'filled' : 'default'}
                onClick={() => engine.tools.setActiveTool(t.id)}
              >
                {t.label}
              </Button>
            </Tooltip>
          ))}
          <Divider orientation="vertical" />
          <FileButton onChange={handleImageFile} accept="image/*">
            {(props) => (
              <Button size="xs" variant="default" loading={imageLoading} {...props}>
                Load image
              </Button>
            )}
          </FileButton>
        </Group>
        <Group gap="xs" align="flex-end" wrap="wrap">
          {tools.activeTool.config.params.map((p) =>
            toolParamControl(engine, tools.activeTool.id, p)
          )}
        </Group>
      </Stack>

      <Group align="stretch">
        <ViewportWrapper
          surface="filtered"
          flex="1"
          bd="1px solid gray"
          h="400px"
          showColorPinsOverlay
        />
        <ViewportWrapper
          surface="indexed"
          flex="1"
          bd="1px solid gray"
          h="400px"
          showColorPinsOverlay
        />
      </Group>
    </Stack>
  );
}
