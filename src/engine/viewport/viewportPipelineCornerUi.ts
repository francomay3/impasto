import type { ViewportPipelineState } from '../pipeline/ViewportPipeline';

/** UI model for a fixed-corner pipeline indicator (not tied to pan/zoom transform). */
type ViewportPipelineCornerUi =
  | { visible: false }
  | { visible: true; variant: 'loading' | 'error'; label: string };

function joinErrors(filter: string | null, indexed: string | null): string {
  const parts: string[] = [];
  if (filter) parts.push(`Filters: ${filter}`);
  if (indexed) parts.push(`Indexed: ${indexed}`);
  return parts.join('\n');
}

/**
 * Maps merged pipeline state to a minimal corner affordance. Filter errors take precedence in the label
 * when both fail; details stay in `label` for tooltips.
 */
export function viewportPipelineCornerUi(state: ViewportPipelineState): ViewportPipelineCornerUi {
  const filterErr = state.status === 'error' ? state.error : null;
  const indexErr = state.indexedStatus === 'error' ? state.indexedError : null;
  if (filterErr || indexErr) {
    return { visible: true, variant: 'error', label: joinErrors(filterErr, indexErr) };
  }

  const busyFilter = state.status === 'filtering';
  const busyIndex = state.indexedStatus === 'indexing';
  if (busyFilter || busyIndex) {
    const parts: string[] = [];
    if (busyFilter) parts.push('Applying filters');
    if (busyIndex) parts.push('Indexing colors');
    return { visible: true, variant: 'loading', label: parts.join(' · ') };
  }

  return { visible: false };
}
