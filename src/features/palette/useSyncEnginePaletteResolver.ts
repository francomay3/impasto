import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { useImpastoEngine } from '../../engine/core/ImpastoEngineContext';
import { activePigmentsFromSettings } from '../../engine/palette/activePigmentsFromSettings';
import { PigmentMatchedPaletteResolver } from '../../engine/palette/PigmentMatchedPaletteResolver';
import { PigmentMixWorkerBridge } from '../../engine/palette/pigmentMixWorkerBridge';
import { SampledPaletteResolver } from '../../engine/palette/SampledPaletteResolver';
import type { PaletteResolver } from '../../engine/palette/paletteResolver';
import type { PigmentSettings } from '../../storage/impastoProjectDto';
import { useEditorStore } from '../editor/editorStore';
import { useProjectPigments } from '../projectv2/pigments/useProjectPigments';

/** Structural dependency of {@link PigmentMatchedPaletteResolver} (worker bridge surface). */
export type PigmentMixWorkerBridgeLike = Pick<InstanceType<typeof PigmentMixWorkerBridge>, 'mix' | 'dispose'>;

export type UseSyncEnginePaletteResolverOptions = {
  bridgeFactory?: () => PigmentMixWorkerBridgeLike;
};

function asEngineBridge(b: PigmentMixWorkerBridgeLike): InstanceType<typeof PigmentMixWorkerBridge> {
  return b as InstanceType<typeof PigmentMixWorkerBridge>;
}

function nextResolver(
  showMixed: boolean,
  settings: PigmentSettings,
  bridgeRef: MutableRefObject<PigmentMixWorkerBridgeLike | null>,
  bridgeFactory: () => PigmentMixWorkerBridgeLike,
): { resolver: PaletteResolver; key: string } {
  const pigments = activePigmentsFromSettings(settings);
  if (!showMixed || pigments.length === 0) {
    const r = new SampledPaletteResolver();
    return { resolver: r, key: `${r.id}:${r.version}` };
  }
  if (!bridgeRef.current) bridgeRef.current = bridgeFactory();
  const r = new PigmentMatchedPaletteResolver({
    pigments,
    minPaintPercent: settings.minPaintPercent,
    deltaThreshold: settings.deltaThreshold,
    bridge: asEngineBridge(bridgeRef.current),
  });
  return { resolver: r, key: `${r.id}:${r.version}` };
}

/**
 * Keeps {@link ImpastoEngine.palette} resolver aligned with editor “mixed colors” and project pigment settings.
 * Owns one worker bridge while pigment matching is active; disposes on unmount.
 */
export function useSyncEnginePaletteResolver(options?: UseSyncEnginePaletteResolverOptions): void {
  const engine = useImpastoEngine();
  const showMixed = useEditorStore((s) => s.showMixedColors);
  const { settings } = useProjectPigments();
  const bridgeRef = useRef<PigmentMixWorkerBridgeLike | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const factoryRef = useRef<(() => PigmentMixWorkerBridgeLike) | null>(null);

  useLayoutEffect(() => {
    if (options?.bridgeFactory) factoryRef.current = options.bridgeFactory;
    else if (factoryRef.current === null) factoryRef.current = () => new PigmentMixWorkerBridge();
  }, [options?.bridgeFactory]);

  useEffect(() => {
    const { resolver, key } = nextResolver(showMixed, settings, bridgeRef, factoryRef.current!);
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    engine.palette.setResolver(resolver);
  }, [engine, settings, showMixed]);

  useEffect(
    () => () => {
      bridgeRef.current?.dispose();
      bridgeRef.current = null;
    },
    [],
  );
}
