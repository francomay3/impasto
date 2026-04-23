// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImpastoEngine } from '../../engine/core/ImpastoEngine';
import { ImpastoEngineContext } from '../../engine/core/ImpastoEngineContext';
import { PigmentMatchedPaletteResolver } from '../../engine/palette/PigmentMatchedPaletteResolver';
import { SampledPaletteResolver } from '../../engine/palette/SampledPaletteResolver';
import type { PaletteResolver } from '../../engine/palette/paletteResolver';
import type { PigmentSettings } from '../../storage/impastoProjectDto';
import { useEditorStore } from '../editor/editorStore';
import { useSyncEnginePaletteResolver } from './useSyncEnginePaletteResolver';

const pigmentCtl = vi.hoisted(() => ({
  settings: {
    enabledNames: ['Titanium White'],
    minPaintPercent: 2,
    deltaThreshold: 4,
  } as PigmentSettings,
}));

vi.mock('../../engine/palette/pigmentMixWorkerBridge', () => ({
  PigmentMixWorkerBridge: class {
    mix = vi.fn().mockResolvedValue({ labs: [], recipes: [] });
    dispose = vi.fn();
  },
}));

vi.mock('../projectv2/pigments/useProjectPigments', () => ({
  useProjectPigments: () => ({ settings: pigmentCtl.settings, pigmentsState: {} }),
}));

function makeEngine() {
  const setResolver = vi.fn<(resolver: PaletteResolver) => void>();
  const engine = { palette: { setResolver } } as unknown as ImpastoEngine;
  return { engine, setResolver };
}

function engineWrapper(engine: ImpastoEngine) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(ImpastoEngineContext.Provider, { value: engine }, children);
  };
}

describe('useSyncEnginePaletteResolver', () => {
  beforeEach(() => {
    useEditorStore.setState({ showMixedColors: false });
    pigmentCtl.settings = {
      enabledNames: ['Titanium White'],
      minPaintPercent: 2,
      deltaThreshold: 4,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderWithEngine(engine: ImpastoEngine) {
    return renderHook(() => useSyncEnginePaletteResolver(), { wrapper: engineWrapper(engine) });
  }

  it('mounts with showMixed false -> sampled resolver', () => {
    const { engine, setResolver } = makeEngine();
    renderWithEngine(engine);
    expect(setResolver).toHaveBeenCalledWith(expect.any(SampledPaletteResolver));
  });

  it('toggles showMixed true with pigments -> pigment-matched resolver', () => {
    const { engine, setResolver } = makeEngine();
    const { rerender } = renderWithEngine(engine);
    useEditorStore.setState({ showMixedColors: true });
    rerender();
    expect(setResolver).toHaveBeenLastCalledWith(expect.any(PigmentMatchedPaletteResolver));
  });

  it('changes minPaintPercent while showMixed -> swaps resolver (new version)', () => {
    const { engine, setResolver } = makeEngine();
    useEditorStore.setState({ showMixedColors: true });
    const { rerender } = renderWithEngine(engine);
    const v1 = (setResolver.mock.calls.at(-1)?.[0] as PigmentMatchedPaletteResolver).version;
    pigmentCtl.settings = { ...pigmentCtl.settings, minPaintPercent: 9 };
    rerender();
    const v2 = (setResolver.mock.calls.at(-1)?.[0] as PigmentMatchedPaletteResolver).version;
    expect(v2).not.toBe(v1);
  });

  it('flipping showMixed false -> sampled again', () => {
    const { engine, setResolver } = makeEngine();
    useEditorStore.setState({ showMixedColors: true });
    const { rerender } = renderWithEngine(engine);
    useEditorStore.setState({ showMixedColors: false });
    rerender();
    expect(setResolver).toHaveBeenLastCalledWith(expect.any(SampledPaletteResolver));
  });

  it('skips setResolver when resolver key unchanged', () => {
    const { engine, setResolver } = makeEngine();
    const { rerender } = renderWithEngine(engine);
    expect(setResolver).toHaveBeenCalledTimes(1);
    rerender();
    expect(setResolver).toHaveBeenCalledTimes(1);
  });

  it('unmount disposes injected bridge', () => {
    const dispose = vi.fn();
    const mix = vi.fn().mockResolvedValue({ labs: [], recipes: [] });
    const { engine } = makeEngine();
    useEditorStore.setState({ showMixedColors: true });
    const { unmount } = renderHook(
      () => useSyncEnginePaletteResolver({ bridgeFactory: () => ({ dispose, mix }) }),
      { wrapper: engineWrapper(engine) },
    );
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
