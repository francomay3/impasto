/**
 * One-shot construction of every subsystem and public API façade for {@link ImpastoEngine}.
 *
 * Split across {@link buildImpastoEngineBootMid} and {@link wireImpastoEngineApis} so each module stays within
 * `project-check` limits; the class file only declares fields and delegates document/dispose behaviour.
 *
 * **Invariants:** Returns a single flattened `ImpastoEngineBoot` object — no lazy singletons; callers assign fields
 * onto the engine instance in one pass so partially constructed engines are impossible from this entrypoint.
 *
 * **Coupling:** Imports only mid + wiring stages; all cross-package wiring (viewport pipeline, filters, input)
 * stays in those modules so this file stays a stable façade over the boot graph.
 */

import { buildImpastoEngineBootMid } from './impastoEngineBootMid';
import type { ImpastoEngineBoot, ImpastoEngineLifecycle } from './impastoEngineBootTypes';
import { wireImpastoEngineApis } from './impastoEngineBootWiring';

export type {  ImpastoEngineLifecycle } from './impastoEngineBootTypes';

type CreateImpastoEngineBootArgs = {
  readonly lifecycle: ImpastoEngineLifecycle;
};

export function createImpastoEngineBoot(args: CreateImpastoEngineBootArgs): ImpastoEngineBoot {
  const mid = buildImpastoEngineBootMid(args.lifecycle);
  const wired = wireImpastoEngineApis(mid);
  return {
    _inputManager: mid._inputManager,
    _historyManager: mid._historyManager,
    _colorPinDragSession: mid._colorPinDragSession,
    _colorPins: mid._colorPins,
    _colorPinCoordinator: mid._colorPinCoordinator,
    _marqueeGesture: mid._marqueeGesture,
    _sourceImageCoordinator: mid._sourceImageCoordinator,
    _unsubscribeColorPins: mid._unsubscribeColorPins,
    _paletteSync: mid._paletteSync,
    ...wired,
    colorPinGroups: wired.colorPinGroups,
  };
}
