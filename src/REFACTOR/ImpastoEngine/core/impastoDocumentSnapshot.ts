import type { ColorPin } from '../colorPins/ColorPinState';
import type { PipelineIndexConfig } from '../pipeline/pipelineIndexConfig';
import type { FilterInstance } from '../../../types';

/**
 * Serializable durable state of an Impasto document: color pins, filter chain, and
 * index-worker tuning. Used by persistence (adapter + glue) and {@link ImpastoEngine}
 * snapshot/load APIs.
 *
 * **Intentionally excluded** (not part of this snapshot):
 * - Active tool and tool parameters
 * - Viewport transform (pan / zoom)
 * - Source image pixels — the storage adapter owns image binary and URL separately
 */
export type ImpastoDocumentSnapshot = {
  readonly pins: readonly ColorPin[];
  readonly filters: readonly FilterInstance[];
  readonly indexConfig: Readonly<PipelineIndexConfig>;
};
