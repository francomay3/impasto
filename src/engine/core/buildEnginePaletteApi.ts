import type { EnginePaletteSync } from '../colorPins/enginePaletteSync';
import type { ResolvedPaletteState } from '../palette/ResolvedPaletteState';
import type { ImpastoEnginePaletteApi } from './ImpastoEngineApi';

type BuildEnginePaletteApiDeps = {
  readonly paletteSync: EnginePaletteSync;
  readonly resolved: ResolvedPaletteState;
  readonly ensureLive: () => void;
};

/** Public read/write façade for palette resolver selection + last resolved rows (see {@link ResolvedPaletteState}). */
export function buildEnginePaletteApi(deps: BuildEnginePaletteApiDeps): ImpastoEnginePaletteApi {
  return {
    setResolver: (resolver) => {
      deps.ensureLive();
      deps.paletteSync.setResolver(resolver);
    },
    getAll: () => deps.resolved.getAll(),
    getByPinId: (pinId) => deps.resolved.getByPinId(pinId),
    subscribe: (listener) => deps.resolved.subscribe(listener),
  };
}
