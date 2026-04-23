import { describe, expect, it } from 'vitest';
import type { ViewportPipelineState } from '../pipeline/ViewportPipeline';
import { viewportPipelineCornerUi } from './viewportPipelineCornerUi';

function state(partial: Partial<ViewportPipelineState>): ViewportPipelineState {
  return {
    status: 'ready',
    error: null,
    indexedStatus: 'idle',
    indexedError: null,
    indexBlurSigma: 0,
    ...partial,
  };
}

describe('viewportPipelineCornerUi', () => {
  it('hides when idle / ready with no work', () => {
    expect(viewportPipelineCornerUi(state({}))).toEqual({ visible: false });
  });

  it('shows loading when filtering', () => {
    const ui = viewportPipelineCornerUi(state({ status: 'filtering' }));
    expect(ui).toMatchObject({ visible: true, variant: 'loading' });
    if (ui.visible) expect(ui.label).toContain('filters');
  });

  it('shows loading when indexing', () => {
    const ui = viewportPipelineCornerUi(state({ indexedStatus: 'indexing' }));
    expect(ui).toMatchObject({ visible: true, variant: 'loading' });
    if (ui.visible) expect(ui.label).toContain('Indexing');
  });

  it('prefers error over loading', () => {
    const ui = viewportPipelineCornerUi(
      state({ status: 'error', error: 'boom', indexedStatus: 'indexing' }),
    );
    expect(ui).toMatchObject({ visible: true, variant: 'error' });
    if (ui.visible) expect(ui.label).toContain('boom');
  });

  it('includes both errors in label when present', () => {
    const ui = viewportPipelineCornerUi(
      state({ status: 'error', error: 'f', indexedStatus: 'error', indexedError: 'i' }),
    );
    expect(ui).toMatchObject({ visible: true, variant: 'error' });
    if (ui.visible) {
      expect(ui.label).toContain('Filters: f');
      expect(ui.label).toContain('Indexed: i');
    }
  });
});
